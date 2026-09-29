import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { createService, hash } from './server.mjs';
import { seedLegacyAccount } from './test-helper.mjs';

const adminPassword = 'Local-sms-admin-2026';
const userPassword = 'Local-sms-user-2026';
const template = 'TestOnly_Template_4433';
async function fixture(t, overrides = {}) {
  const envKeys = ['JUHE_SMS_PROVIDER', 'JUHE_SPUG_TEMPLATE_CODE', 'JUHE_SMS_DAILY_LIMIT'];
  const savedEnv = Object.fromEntries(envKeys.map(k => [k, process.env[k]]));
  process.env.JUHE_SMS_PROVIDER = 'spug'; delete process.env.JUHE_SPUG_TEMPLATE_CODE; delete process.env.JUHE_SMS_DAILY_LIMIT;
  Object.assign(process.env, overrides);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'juhe-sms-settings-'));
  const transport = globalThis.fetch, sent = [];
  let time = Date.now(), cookie = '', base, svc, delivery = async () => ({ ok: true, json: async () => ({ code: 200, request_id: 'test-only-receipt' }) });
  globalThis.fetch = async (url, options) => {
    if (String(url).startsWith('https://push.spug.cc/sms/')) {
      assert.equal(options.method, 'GET');
      assert.equal(Object.hasOwn(options, 'body'), false);
      assert.equal(new URL(url).pathname, `/sms/${template}`);
      const query = new URL(url).searchParams;
      assert.deepEqual([...query.keys()], ['to', 'code']);
      sent.push(Object.fromEntries(query));
      return delivery(url, options);
    }
    if (String(url).startsWith('http://127.0.0.1:')) return transport(url, options);
    throw Error('External network forbidden in SMS tests');
  };
  async function start() {
    svc = createService({ dataDir: dir, now: () => time, legacyAdminEnabled: false });
    await new Promise(resolve => svc.server.listen(0, '127.0.0.1', resolve));
    base = 'http://127.0.0.1:' + svc.server.address().port;
  }
  async function stop() { if (svc.server.listening) await new Promise(resolve => svc.server.close(resolve)); }
  t.after(async () => {
    await stop(); globalThis.fetch = transport;
    for (const k of envKeys) if (savedEnv[k] === undefined) delete process.env[k]; else process.env[k] = savedEnv[k];
    assert.equal(path.dirname(dir), path.resolve(os.tmpdir())); fs.rmSync(dir, { recursive: true, force: true });
  });
  await start(); await svc.security.initializeAdmin('sms_admin', adminPassword);
  async function request(route, data, { admin = false, csrf = true, device } = {}) {
    const method = data === undefined ? 'GET' : 'POST', raw = data === undefined ? '' : JSON.stringify(data);
    const headers = { 'Content-Type': 'application/json' };
    if (admin) Object.assign(headers, { Cookie: cookie, ...(csrf ? { 'X-Juhe-Admin': '1' } : {}) });
    if (device) {
      const stamp = String(time), nonce = randomBytes(20).toString('hex');
      Object.assign(headers, { Authorization: 'Bearer ' + device.token, 'X-Time': stamp, 'X-Nonce': nonce,
        'X-Signature': sign(null, Buffer.from([method, route, stamp, nonce, hash(raw)].join('\n')), device.privateKey).toString('base64') });
    }
    const response = await transport(base + route, { method, headers, ...(data === undefined ? {} : { body: raw }) });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie') };
  }
  async function loginAdmin() { const r = await request('/v1/admin/login', { username: 'sms_admin', password: adminPassword }); assert.equal(r.status, 200); cookie = r.cookie.split(';')[0]; }
  await loginAdmin();
  async function user() {
    seedLegacyAccount(svc.db, { username: 'sms_customer', password: userPassword, created: time });
    const pair = generateKeyPairSync('ed25519');
    const publicKey = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const challenge = await request('/v1/challenge', { publicKey });
    const login = await request('/v1/login', { username: 'sms_customer', password: userPassword, challenge: challenge.data.challenge,
      signature: sign(null, Buffer.from(challenge.data.challenge), pair.privateKey).toString('base64') });
    assert.equal(login.status, 200); return { privateKey: pair.privateKey, token: login.data.token };
  }
  return { get db() { return svc.db; }, request, user, sent, setDelivery: fn => { delivery = fn; }, advance: ms => { time += ms; },
    save: data => request('/v1/admin/sms', { mode: 'spug', templateCode: template, dailyLimit: 100, adminPassword, ...data }, { admin: true }),
    status: () => request('/v1/admin/sms', undefined, { admin: true }), restart: async () => { await stop(); await start(); } };
}

test('SMS settings require administrator session, CSRF and current password; saves expose only masked metadata', async t => {
  const f = await fixture(t);
  assert.equal((await f.request('/v1/admin/sms')).status, 401);
  assert.equal((await f.request('/v1/admin/sms', { mode: 'disabled', adminPassword }, { admin: true, csrf: false })).status, 403);
  assert.equal((await f.save({ adminPassword: 'wrong-password' })).status, 400);
  assert.equal((await f.status()).data.configured, false);
  const saved = await f.save(); assert.equal(saved.status, 200);
  assert.deepEqual(saved.data, { mode: 'spug', configured: true, provider: 'spug', hasTemplate: true, templateHint: '••••4433', dailyLimit: 100, updatedAt: saved.data.updatedAt, configurationError: false });
  assert(!JSON.stringify(saved.data).includes(template));
  assert(!JSON.stringify(f.db.prepare('SELECT * FROM service_settings').all()).includes(template));
  assert(!JSON.stringify(f.db.prepare('SELECT * FROM security_audit').all()).includes(template));
  assert.equal(f.sent.length, 0, 'saving never sends SMS');
  await f.restart(); assert.equal((await f.status()).data.configured, true);
  assert.equal((await f.save({ templateCode: '', dailyLimit: 42 })).data.templateHint, '••••4433');
});

test('SMS disabled overrides environment; corrupt ciphertext fails closed and can be replaced', async t => {
  const f = await fixture(t, { JUHE_SPUG_TEMPLATE_CODE: template });
  assert.equal((await f.status()).data.configured, true);
  const disabled = await f.save({ mode: 'disabled', templateCode: '' }); assert.equal(disabled.data.configured, false);
  const d = await f.user(); assert.equal((await f.request('/v1/security/status', undefined, { device: d })).data.smsAvailable, false);
  assert.equal((await f.request('/v1/phone/send', { purpose: 'bind', phone: '13800138011', password: userPassword }, { device: d })).status, 503);
  assert.equal(f.sent.length, 0);
  f.db.prepare("UPDATE service_settings SET encrypted_value='corrupted' WHERE name='sms'").run();
  const corrupt = (await f.status()).data; assert.equal(corrupt.configured, false); assert.equal(corrupt.configurationError, true); assert.equal(corrupt.hasTemplate, false);
  assert.equal((await f.save()).data.configured, true);
  assert.equal((await f.save({ mode: 'environment', templateCode: '' })).data.mode, 'environment');
});

test('SMS settings validate templates and limit without altering prior stored settings', async t => {
  const f = await fixture(t);
  assert.equal((await f.save({ templateCode: '' })).status, 400);
  assert.equal((await f.save({ templateCode: 'https://bad.example/template' })).status, 400);
  assert.equal((await f.save({ dailyLimit: 0 })).status, 400);
  assert.equal((await f.save({ dailyLimit: 5001 })).status, 400);
  assert.equal((await f.save({ mode: 'unknown' })).status, 400);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM service_settings').get().n, 0);
  assert.equal(f.sent.length, 0);
});

test('one saved Spug template gives binding and recovery ten-minute validity with matching messages through intercepted transport', async t => {
  const f = await fixture(t), d = await f.user(); await f.save();
  assert.equal((await f.request('/v1/security/status', undefined, { device: d })).data.smsAvailable, true);
  const bind = await f.request('/v1/phone/send', { purpose: 'bind', phone: '13800138011', password: userPassword }, { device: d });
  assert.equal(bind.status, 200); assert.equal(f.sent.length, 1); assert.match(f.sent[0].code, /^\d{6}$/);
  assert.equal(f.sent[0].to, '13800138011'); assert.deepEqual(Object.keys(f.sent[0]), ['to', 'code']);
  assert.match(bind.data.message, /10分钟内有效/);
  const bindRow = f.db.prepare('SELECT * FROM phone_otps WHERE id=?').get(bind.data.challengeId);
  assert.equal(bindRow.expires - bindRow.created, 600000);
  assert(!JSON.stringify(bind.data).includes(f.sent[0].code));
  f.advance(599999);
  assert.equal((await f.request('/v1/phone/bind', { phone: '13800138011', challengeId: bind.data.challengeId, code: f.sent[0].code }, { device: d })).status, 200);
  const reset = await f.request('/v1/phone/send', { purpose: 'reset', username: 'sms_customer', phone: '13800138011' });
  assert.equal(reset.status, 200);
  assert.deepEqual(Object.keys(f.sent.at(-1)), ['to', 'code']); assert.match(f.sent.at(-1).code, /^\d{6}$/);
  assert.match(reset.data.message, /10分钟内有效/);
  const resetRow = f.db.prepare('SELECT * FROM phone_otps WHERE id=?').get(reset.data.challengeId);
  assert.equal(resetRow.expires - resetRow.created, 600000);
  f.advance(599999);
  assert.equal((await f.request('/v1/phone/reset', { username: 'sms_customer', challengeId: reset.data.challengeId, code: f.sent.at(-1).code, newPassword: 'Changed-user-password-2026' })).status, 200);
  assert.equal((await f.request('/v1/me', undefined, { device: d })).status, 401);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM phone_otps').get().n, 0);
});

test('binding and recovery OTPs expire exactly at ten minutes on the service clock', async t => {
  const f = await fixture(t), d = await f.user(); await f.save();
  const bindData = { purpose: 'bind', phone: '13800138011', password: userPassword };
  const expiredBind = await f.request('/v1/phone/send', bindData, { device: d });
  assert.equal(expiredBind.status, 200);
  f.advance(600000);
  const bindResult = await f.request('/v1/phone/bind', { phone: bindData.phone, challengeId: expiredBind.data.challengeId, code: f.sent.at(-1).code }, { device: d });
  assert.equal(bindResult.status, 400); assert.match(bindResult.data.message, /已过期/);
  assert.equal(f.db.prepare('SELECT phone FROM users WHERE username=?').get('sms_customer').phone, null);

  const currentBind = await f.request('/v1/phone/send', bindData, { device: d });
  assert.equal(currentBind.status, 200);
  assert.equal((await f.request('/v1/phone/bind', { phone: bindData.phone, challengeId: currentBind.data.challengeId, code: f.sent.at(-1).code }, { device: d })).status, 200);
  f.advance(61000);
  const expiredReset = await f.request('/v1/phone/send', { purpose: 'reset', username: 'sms_customer', phone: bindData.phone });
  assert.equal(expiredReset.status, 200);
  f.advance(600000);
  const resetResult = await f.request('/v1/phone/reset', { username: 'sms_customer', challengeId: expiredReset.data.challengeId, code: f.sent.at(-1).code, newPassword: 'Changed-user-password-2026' });
  assert.equal(resetResult.status, 400); assert.match(resetResult.data.message, /已过期/);
  assert.equal((await f.request('/v1/me', undefined, { device: d })).status, 200, 'an expired reset must preserve the current session');
  assert.equal(f.sent.length, 3);
});

test('changing SMS settings invalidates an in-flight OTP and never resurrects it after provider success', async t => {
  const f = await fixture(t), d = await f.user(); await f.save();
  let started, finish;
  const entered = new Promise(resolve => { started = resolve; });
  f.setDelivery(() => { started(); return new Promise(resolve => { finish = resolve; }); });
  const pending = f.request('/v1/phone/send', { purpose: 'bind', phone: '13800138011', password: userPassword }, { device: d });
  await entered;
  assert.equal((await f.save({ mode: 'disabled', templateCode: '' })).status, 200);
  finish({ ok: true, json: async () => ({ code: 200, request_id: 'test-late-receipt' }) });
  assert.equal((await pending).status, 409);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM phone_otps').get().n, 0);
});

test('configured daily budget persists across changes and bounds sending attempts', async t => {
  const f = await fixture(t), d = await f.user(); await f.save({ dailyLimit: 1 });
  assert.equal((await f.request('/v1/phone/send', { purpose: 'bind', phone: '13800138011', password: userPassword }, { device: d })).status, 200);
  f.advance(61000);
  await f.save({ dailyLimit: 1, templateCode: '' });
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM phone_otps').get().n, 0);
  assert.equal((await f.request('/v1/phone/send', { purpose: 'bind', phone: '13800138012', password: userPassword }, { device: d })).status, 429);
  assert.equal(f.sent.length, 1);
});
