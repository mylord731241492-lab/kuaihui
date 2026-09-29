import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { generateKeyPairSync, sign, randomBytes, scryptSync } from 'node:crypto';
import { createService, hash } from './server.mjs';
import { initializeKey, makeBackup, restoreBackup } from './ops.mjs';
import { seedLegacyAccount } from './test-helper.mjs';

const password = 'Phone-registration-test-2026';
const adminPassword = 'Phone-registration-admin-2026';
const phone = '13800138101';
const otherPhone = '13800138102';
const template = 'Registration_TestOnly_4422';

async function fixture(t, { dailyLimit = 100, configured = true } = {}) {
  const envKeys = ['JUHE_SMS_PROVIDER', 'JUHE_SPUG_TEMPLATE_CODE', 'JUHE_SMS_DAILY_LIMIT'];
  const saved = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  process.env.JUHE_SMS_PROVIDER = 'spug';
  process.env.JUHE_SPUG_TEMPLATE_CODE = template;
  process.env.JUHE_SMS_DAILY_LIMIT = String(dailyLimit);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'juhe-phone-registration-'));
  const transport = globalThis.fetch, sent = [];
  let time = 1780000000000, cookie = '', adminInitialized = false;
  let delivery = async () => ({ requestId: 'isolated-registration-receipt' });
  const adapter = { configured, validityMinutes: 10, async send(to, code) { sent.push({ to, code }); return delivery(to, code); } };
  globalThis.fetch = (url, options) => {
    if (String(url).startsWith('http://127.0.0.1:')) return transport(url, options);
    throw Error('External network forbidden in phone registration tests');
  };
  const svc = createService({ dataDir: dir, now: () => time, testMode: true, testSmsAdapter: adapter, legacyAdminEnabled: false });
  await new Promise(resolve => svc.server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + svc.server.address().port;
  t.after(async () => {
    if (svc.server.listening) await new Promise(resolve => svc.server.close(resolve));
    globalThis.fetch = transport;
    for (const key of envKeys) if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
    assert.equal(path.dirname(dir), path.resolve(os.tmpdir()));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  async function request(route, data, { device, admin = false } = {}) {
    const method = data === undefined ? 'GET' : 'POST', raw = data === undefined ? '' : JSON.stringify(data);
    const headers = { 'Content-Type': 'application/json' };
    if (admin) Object.assign(headers, { Cookie: cookie, 'X-Juhe-Admin': '1' });
    if (device) {
      const stamp = String(time), nonce = randomBytes(20).toString('hex');
      Object.assign(headers, { Authorization: 'Bearer ' + device.token, 'X-Time': stamp, 'X-Nonce': nonce,
        'X-Signature': sign(null, Buffer.from([method, route, stamp, nonce, hash(raw)].join('\n')), device.privateKey).toString('base64') });
    }
    const response = await transport(base + route, { method, headers, ...(data === undefined ? {} : { body: raw }) });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie') };
  }
  async function login(username, suppliedPassword = password, takeover = false) {
    const pair = generateKeyPairSync('ed25519');
    const publicKey = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const challenge = await request('/v1/challenge', { publicKey });
    assert.equal(challenge.status, 200);
    const result = await request('/v1/login', { username, password: suppliedPassword, takeover, publicKey,
      challenge: challenge.data.challenge, signature: sign(null, Buffer.from(challenge.data.challenge), pair.privateKey).toString('base64') });
    return { ...result, privateKey: pair.privateKey, token: result.data.token };
  }
  async function send(to = phone) {
    const result = await request('/v1/phone/register/send', { phone: to });
    return { ...result, phone: to, challengeId: result.data.challengeId, code: sent.findLast(item => item.to === to)?.code };
  }
  const register = (ticket, overrides = {}) => request('/v1/phone/register', {
    phone: ticket.phone, challengeId: ticket.challengeId, code: ticket.code, password, ...overrides
  });
  async function legacy(username = 'legacy_customer') {
    seedLegacyAccount(svc.db, { username, password, created: time });
    const device = await login(username); assert.equal(device.status, 200); return device;
  }
  async function saveSms(data = {}) {
    if (!adminInitialized) {
      await svc.security.initializeAdmin('registration_admin', adminPassword);
      const result = await request('/v1/admin/login', { username: 'registration_admin', password: adminPassword });
      assert.equal(result.status, 200); cookie = result.cookie.split(';')[0]; adminInitialized = true;
    }
    return request('/v1/admin/sms', { mode: 'spug', templateCode: template, dailyLimit, adminPassword, ...data }, { admin: true });
  }
  return { db: svc.db, dir, request, login, legacy, send, register, saveSms, sent, adapter,
    advance: ms => { time += ms; }, setDelivery: fn => { delivery = fn; } };
}

test('verified phone registration binds the phone, stores only digests and permits password login', async t => {
  const f = await fixture(t), ticket = await f.send();
  assert.equal(ticket.status, 200); assert.match(ticket.code, /^\d{6}$/); assert.match(ticket.data.message, /10分钟内有效/);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 0, 'sending must not create an account');
  const otp = f.db.prepare('SELECT * FROM phone_registration_otps WHERE id=?').get(ticket.challengeId);
  assert.equal(otp.expires - otp.created, 600000); assert.equal(otp.ready, 1);
  assert.equal(otp.attempts, 0); assert.match(otp.digest, /^[a-f0-9]{64}$/); assert.notEqual(otp.digest, ticket.code);
  assert.equal(Object.hasOwn(ticket.data, 'code'), false); assert.equal(Object.hasOwn(otp, 'code'), false);
  const result = await f.register(ticket); assert.equal(result.status, 200); assert.equal(result.data.username, phone);
  const user = f.db.prepare('SELECT * FROM users WHERE username=?').get(phone);
  assert.equal(user.phone, phone); assert.equal(user.public_key, null); assert.equal(user.expires, 0); assert.equal(user.shops, 0);
  assert.match(user.password_hash, /^[a-f0-9]{128}$/); assert.notEqual(user.salt, password);
  assert.equal(scryptSync(password, user.salt, 64).toString('hex'), user.password_hash);
  assert.equal(JSON.stringify(user).includes(password), false);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM phone_registration_otps').get().n, 0);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 0, 'registration must not silently authenticate');
  assert.equal((await f.login(phone, 'Incorrect-password-2026')).status, 401);
  const device = await f.login(phone); assert.equal(device.status, 200); assert.equal(device.data.user.username, phone);
  const status = await f.request('/v1/security/status', undefined, { device });
  assert.equal(status.status, 200); assert.equal(status.data.phone, '138****8101'); assert.equal(status.data.smsAvailable, true);
  assert.equal((await f.request('/v1/me', undefined, { device })).status, 200);
});

test('phone registration enforces device slots, preserves concurrent sessions and supports unbinding and SMS recovery', async t => {
  const f = await fixture(t), ticket = await f.send(); assert.equal((await f.register(ticket)).status, 200);
  const first = await f.login(phone); assert.equal(first.status, 200);
  assert.equal((await f.login(phone)).status, 409);
  assert.equal((await f.login(phone, password, true)).status, 409);
  f.db.prepare('UPDATE users SET device_limit=2 WHERE username=?').run(phone);
  const second = await f.login(phone, password, true); assert.equal(second.status, 200);
  assert.equal((await f.request('/v1/me', undefined, { device: first })).status, 200);
  const devices = await f.request('/v1/devices', undefined, { device: second });
  assert.equal(devices.status, 200); assert.equal(devices.data.devices.length, 2);
  const previous = devices.data.devices.find(item => !item.current);
  assert.equal((await f.request('/v1/devices/unbind', { id: previous.id }, { device: second })).status, 200);
  f.advance(61000);
  const reset = await f.request('/v1/phone/send', { purpose: 'reset', username: phone, phone });
  assert.equal(reset.status, 200);
  const newPassword = 'Phone-registration-changed-2026';
  assert.equal((await f.request('/v1/phone/reset', { username: phone, challengeId: reset.data.challengeId, code: f.sent.at(-1).code, newPassword })).status, 200);
  assert.equal((await f.request('/v1/me', undefined, { device: second })).status, 401);
  assert.equal((await f.login(phone, password)).status, 401); assert.equal((await f.login(phone, newPassword)).status, 200);
});

test('legacy registration is closed for usernames and phones while historical mobile accounts still log in', async t => {
  const f = await fixture(t);
  for (const username of ['legacy_customer', 'UPPER_CASE', phone, '', '<invalid>']) {
    const result = await f.request('/v1/register', { username, password });
    assert.equal(result.status, 410); assert.match(result.data.message, /账号注册已关闭.*手机号验证码注册/);
  }
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 0);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM phone_registration_otps').get().n, 0);
  assert.equal(f.sent.length, 0);
  await f.legacy(phone);
  const original = f.db.prepare('SELECT * FROM users WHERE username=?').get(phone);
  f.advance(90000);
  assert.equal((await f.login(phone, password, true)).status, 200);
  assert.equal((await f.send()).status, 409); assert.equal(f.sent.length, 0);
  assert.equal(f.db.prepare('SELECT phone FROM users WHERE id=?').get(original.id).phone, null);
  assert.equal(f.db.prepare('SELECT password_hash FROM users WHERE id=?').get(original.id).password_hash, original.password_hash);
});

test('duplicate registration and an existing bound phone are rejected without sending or replacing an account', async t => {
  const f = await fixture(t), ticket = await f.send(); assert.equal((await f.register(ticket)).status, 200);
  const original = f.db.prepare('SELECT * FROM users WHERE username=?').get(phone);
  f.advance(61000); assert.equal((await f.send()).status, 409); assert.equal(f.sent.length, 1);
  const device = await f.legacy();
  f.db.prepare('UPDATE users SET phone=? WHERE username=?').run(otherPhone, 'legacy_customer');
  assert.equal((await f.send(otherPhone)).status, 409); assert.equal(f.sent.length, 1);
  const bind = await f.request('/v1/phone/send', { purpose: 'bind', phone, password }, { device });
  assert.equal(bind.status, 409); assert.equal(f.sent.length, 1);
  assert.equal(f.db.prepare('SELECT password_hash FROM users WHERE id=?').get(original.id).password_hash, original.password_hash);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 2);
});

test('registration validates the phone and password and cannot create an account without a correct OTP', async t => {
  const f = await fixture(t);
  for (const invalid of ['', '123', '12800138101', '138001381011', '+8613800138101', 'abcdefghijk'])
    assert.equal((await f.send(invalid)).status, 400);
  assert.equal(f.sent.length, 0);
  assert.equal((await f.register({ phone, challengeId: 'missing', code: '123456' })).status, 400);
  const ticket = await f.send(); assert.equal(ticket.status, 200);
  for (const invalid of ['', 'short', 'a'.repeat(129), null]) assert.equal((await f.register(ticket, { password: invalid })).status, 400);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 0);
  assert.equal((await f.register(ticket)).status, 200, 'invalid passwords must not consume a valid OTP');
});

test('registration is valid one millisecond before ten minutes and invalid at the exact expiry', async t => {
  const f = await fixture(t), valid = await f.send(); f.advance(599999);
  assert.equal((await f.register(valid)).status, 200);
  const expired = await f.send(otherPhone); assert.equal(expired.status, 200); f.advance(600000);
  const result = await f.register(expired); assert.equal(result.status, 400); assert.match(result.data.message, /无效|过期|失效/);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM users WHERE username=? OR phone=?').get(otherPhone, otherPhone).n, 0);
});

test('five incorrect registration OTP attempts lock the challenge even when the correct code is later supplied', async t => {
  const f = await fixture(t), ticket = await f.send(), wrong = ticket.code === '000000' ? '000001' : '000000';
  for (let i = 0; i < 5; i++) assert.equal((await f.register(ticket, { code: wrong })).status, 400);
  assert.equal(f.db.prepare('SELECT attempts FROM phone_registration_otps WHERE id=?').get(ticket.challengeId).attempts, 5);
  assert.equal((await f.register(ticket)).status, 400);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 0);
});

test('resending observes the 60-second cooldown and invalidates the previous registration challenge', async t => {
  const f = await fixture(t), old = await f.send();
  assert.equal((await f.send()).status, 429); f.advance(59999); assert.equal((await f.send()).status, 429);
  f.advance(1); const current = await f.send(); assert.equal(current.status, 200); assert.equal(f.sent.length, 2);
  assert.notEqual(current.challengeId, old.challengeId);
  assert.equal((await f.register(old)).status, 400); assert.equal((await f.register(current)).status, 200);
});

test('registration OTP replay and simultaneous consumption create exactly one account', async t => {
  const f = await fixture(t), ticket = await f.send();
  const results = await Promise.all([f.register(ticket), f.register(ticket)]);
  assert.equal(results.filter(result => result.status === 200).length, 1);
  assert(results.filter(result => result.status !== 200).every(result => [400, 409].includes(result.status)));
  assert([400, 409].includes((await f.register(ticket)).status));
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM users WHERE username=? OR phone=?').get(phone, phone).n, 1);
});

test('registration OTPs are isolated by phone and from binding and recovery OTP purposes', async t => {
  const f = await fixture(t), device = await f.legacy(), ticket = await f.send();
  assert.equal((await f.register(ticket, { phone: otherPhone })).status, 400);
  assert.equal((await f.request('/v1/phone/bind', { phone, challengeId: ticket.challengeId, code: ticket.code }, { device })).status, 400);
  const bind = await f.request('/v1/phone/send', { purpose: 'bind', phone: otherPhone, password }, { device });
  assert.equal(bind.status, 200); const bindingCode = f.sent.at(-1).code;
  assert.equal((await f.register({ phone: otherPhone, challengeId: bind.data.challengeId, code: bindingCode })).status, 400);
  assert.equal((await f.request('/v1/phone/bind', { phone: otherPhone, challengeId: bind.data.challengeId, code: bindingCode }, { device })).status, 200);
  assert.equal((await f.request('/v1/phone/reset', { username: 'legacy_customer', challengeId: ticket.challengeId, code: ticket.code, newPassword: password })).status, 400);
  assert.equal((await f.register(ticket)).status, 200, 'cross-purpose requests must not consume the registration challenge');
});

test('a failed or unavailable provider never leaves a usable registration challenge or partial user', async t => {
  const f = await fixture(t, { configured: false });
  assert.equal((await f.send()).status, 503); assert.equal(f.sent.length, 0);
  f.adapter.configured = true;
  f.setDelivery(async () => { throw Object.assign(Error('Simulated SMS delivery failure'), { status: 502 }); });
  assert.equal((await f.send()).status, 502); assert.equal(f.sent.length, 1);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM phone_registration_otps').get().n, 0);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 0);
  assert.equal((await f.send()).status, 429, 'failed submissions still consume the sending quota');
});

test('registration cannot consume a challenge before the SMS provider confirms submission', async t => {
  const f = await fixture(t); let entered, finish;
  const started = new Promise(resolve => { entered = resolve; });
  f.setDelivery(() => { entered(); return new Promise(resolve => { finish = resolve; }); });
  const pending = f.send(); await started;
  try {
    const row = f.db.prepare('SELECT * FROM phone_registration_otps').get(); assert.equal(row.ready, 0);
    assert.equal((await f.register({ phone, challengeId: row.id, code: f.sent.at(-1).code })).status, 400);
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 0);
  } finally { finish({ requestId: 'late-isolated-receipt' }); }
  const ticket = await pending; assert.equal(ticket.status, 200); assert.equal((await f.register(ticket)).status, 200);
});

test('changing SMS configuration invalidates completed and in-flight registration challenges', async t => {
  const f = await fixture(t), old = await f.send();
  assert.equal((await f.saveSms()).status, 200); assert.equal((await f.register(old)).status, 400);
  let entered, finish; const started = new Promise(resolve => { entered = resolve; });
  f.setDelivery(() => { entered(); return new Promise(resolve => { finish = resolve; }); });
  const pending = f.send(otherPhone); await started;
  try { assert.equal((await f.saveSms({ mode: 'disabled', templateCode: '' })).status, 200); }
  finally { finish({ requestId: 'late-isolated-receipt' }); }
  assert.equal((await pending).status, 409);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM phone_registration_otps WHERE phone=?').get(otherPhone).n, 0);
  assert.equal((await f.register(old)).status, 400, 'retained rows from an older configuration must remain unusable');
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 0);
});

test('a phone claimed by an existing account during provider submission cannot finish registration', async t => {
  const f = await fixture(t); await f.legacy(); let entered, finish;
  const started = new Promise(resolve => { entered = resolve; });
  f.setDelivery(() => { entered(); return new Promise(resolve => { finish = resolve; }); });
  const pending = f.send(); await started;
  try { f.db.prepare('UPDATE users SET phone=? WHERE username=?').run(phone, 'legacy_customer'); }
  finally { finish({ requestId: 'late-isolated-receipt' }); }
  assert.equal((await pending).status, 409);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM phone_registration_otps').get().n, 0);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 1);
  assert.equal(f.db.prepare('SELECT username FROM users WHERE phone=?').get(phone).username, 'legacy_customer');
});

test('restoring a backup preserves registered accounts and quota while revoking pending registration OTPs', async t => {
  const f = await fixture(t), registered = await f.send(); assert.equal((await f.register(registered)).status, 200);
  const pending = await f.send(otherPhone); assert.equal(pending.status, 200);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM phone_registration_otps').get().n, 1);
  const keyFile = path.join(f.dir, 'isolated-backup.key'), backups = path.join(f.dir, 'backups'), directory = path.join(f.dir, 'restored');
  initializeKey(keyFile);
  const backup = await makeBackup({ source: path.join(f.dir, 'accounts.sqlite'), directory: backups, keyFile });
  const result = await restoreBackup({ file: path.join(backups, backup.file), directory, keyFile });
  assert.equal(result.restored, true);
  const restored = new DatabaseSync(path.join(directory, 'accounts.sqlite'), { readOnly: true });
  try {
    assert.equal(restored.prepare('SELECT COUNT(*) AS n FROM phone_registration_otps').get().n, 0);
    assert.equal(restored.prepare('SELECT phone FROM users WHERE username=?').get(phone).phone, phone);
    assert.equal(restored.prepare("SELECT count FROM sms_limits WHERE key='sms-global-day'").get().count, 2);
  } finally { restored.close(); }
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM phone_registration_otps').get().n, 1, 'restore must not modify the live database');
});

test('phone registration and binding share cooldown and the global SMS budget', async t => {
  const f = await fixture(t, { dailyLimit: 1 }), device = await f.legacy();
  assert.equal((await f.send()).status, 200);
  assert.equal((await f.request('/v1/phone/send', { purpose: 'bind', phone, password }, { device })).status, 429);
  assert.equal((await f.send(otherPhone)).status, 429);
  f.advance(61000); assert.equal((await f.send(otherPhone)).status, 429);
  assert.equal(f.sent.length, 1);
  assert.equal(f.db.prepare("SELECT count FROM sms_limits WHERE key='sms-global-day'").get().count, 1);
});

test('registration enforces ten SMS submissions per phone per day', async t => {
  const f = await fixture(t);
  for (let i = 0; i < 10; i++) { assert.equal((await f.send()).status, 200); f.advance(61001); }
  assert.equal((await f.send()).status, 429); assert.equal(f.sent.length, 10);
  f.advance(86400000); assert.equal((await f.send()).status, 200); assert.equal(f.sent.length, 11);
});

test('registration enforces thirty SMS submissions per source IP per hour', async t => {
  const f = await fixture(t);
  for (let i = 0; i < 30; i++) { assert.equal((await f.send(String(13800138200 + i))).status, 200); f.advance(61001); }
  assert.equal((await f.send('13800138300')).status, 429); assert.equal(f.sent.length, 30);
  f.advance(3600000); assert.equal((await f.send('13800138300')).status, 200); assert.equal(f.sent.length, 31);
});
