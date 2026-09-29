import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateKeyPairSync, randomBytes, sign, scryptSync } from 'node:crypto';
import { createService, hash } from './server.mjs';
import { createSmsSettings } from './sms-settings.mjs';
import { seedLegacyAccount } from './test-helper.mjs';

const password = 'Sms-password-original-2026';
const newPassword = 'Sms-password-replacement-2026';
const adminPassword = 'Sms-password-admin-2026';
const phone = '13800138401';
const otherPhone = '13800138402';
const username = 'historical_sms_customer';

async function fixture(t, { configured = true, bound = true, name = username } = {}) {
  const envKeys = ['JUHE_SMS_PROVIDER', 'JUHE_SPUG_TEMPLATE_CODE', 'JUHE_SMS_DAILY_LIMIT'];
  const saved = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  process.env.JUHE_SMS_PROVIDER = 'spug';
  process.env.JUHE_SPUG_TEMPLATE_CODE = 'Sms_Password_TestOnly_9944';
  process.env.JUHE_SMS_DAILY_LIMIT = '100';
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'juhe-sms-password-'));
  const transport = globalThis.fetch, sent = [];
  let time = 1790000000000, cookie = '', initialized = false;
  let delivery = async () => ({ requestId: 'isolated-sms-password-receipt' });
  const adapter = { configured, validityMinutes: 10, async send(to, code) { sent.push({ to, code }); return delivery(to, code); } };
  const svc = createService({ dataDir: dir, now: () => time, testMode: true, testSmsAdapter: adapter, legacyAdminEnabled: false });
  await new Promise(resolve => svc.server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + svc.server.address().port;
  globalThis.fetch = (url, options) => {
    if (String(url).startsWith(base + '/')) return transport(url, options);
    throw Error('External network forbidden in SMS password tests');
  };
  t.after(async () => {
    if (svc.server.listening) await new Promise(resolve => svc.server.close(resolve));
    globalThis.fetch = transport;
    for (const key of envKeys) if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
    assert.equal(path.dirname(dir), path.resolve(os.tmpdir()));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const id = seedLegacyAccount(svc.db, { username: name, password, phone: bound ? phone : null, created: time });
  function prepare(route, data, { device, admin = false, csrf = true } = {}) {
    const method = data === undefined ? 'GET' : 'POST', raw = data === undefined ? '' : JSON.stringify(data);
    const headers = { 'content-type': 'application/json' };
    if (admin) Object.assign(headers, { cookie, ...(csrf ? { 'x-juhe-admin': '1' } : {}) });
    if (device) {
      const stamp = String(time), nonce = randomBytes(20).toString('hex');
      Object.assign(headers, { authorization: 'Bearer ' + device.token, 'x-time': stamp, 'x-nonce': nonce,
        'x-signature': sign(null, Buffer.from([method, route, stamp, nonce, hash(raw)].join('\n')), device.privateKey).toString('base64') });
    }
    return { method, raw, headers };
  }
  async function request(route, data, options) {
    const { method, raw, headers } = prepare(route, data, options);
    const response = await transport(base + route, { method, headers, ...(data === undefined ? {} : { body: raw }) });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie') };
  }
  function direct(route, data, options) {
    const { method, raw, headers } = prepare(route, data, options);
    const req = { method, url: route, headers, clientIP: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' } };
    // handle runs synchronously through authentication and OTP checks to its first
    // scrypt await. Immediate fixture mutations therefore exercise that boundary
    // deterministically without timing sleeps or a production test hook.
    return svc.security.handle(req, { setHeader() {} }, route, data, raw)
      .then(data => ({ status: 200, data }), error => ({ status: error.status || 500, data: { message: error.message } }));
  }
  async function login(nameToUse = name, suppliedPassword = password, takeover = false, previousDevice = null) {
    const pair = previousDevice || generateKeyPairSync('ed25519'), publicKey = previousDevice?.publicKey || pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const challenge = await request('/v1/challenge', { publicKey });
    assert.equal(challenge.status, 200);
    const result = await request('/v1/login', { username: nameToUse, password: suppliedPassword, takeover,
      challenge: challenge.data.challenge, signature: sign(null, Buffer.from(challenge.data.challenge), pair.privateKey).toString('base64') });
    return { ...result, privateKey: pair.privateKey, publicKey, token: result.data.token };
  }
  const device = await login(); assert.equal(device.status, 200);
  async function send(purpose = 'change', extra = {}, useDevice = device) {
    const result = await request('/v1/phone/send', { purpose, ...(purpose === 'reset' ? { phone } : {}), ...extra }, { device: useDevice });
    return { ...result, challengeId: result.data.challengeId, code: sent.at(-1)?.code };
  }
  const changeData = (ticket, extra = {}) => ({ challengeId: ticket.challengeId, code: ticket.code, newPassword, ...extra });
  const change = (ticket, extra = {}, useDevice = device) => request('/v1/password/change', changeData(ticket, extra), { device: useDevice });
  const reset = (ticket, extra = {}) => request('/v1/phone/reset', { phone, ...changeData(ticket), ...extra });
  async function admin() {
    if (!initialized) {
      await svc.security.initializeAdmin('sms_password_admin', adminPassword);
      const result = await request('/v1/admin/login', { username: 'sms_password_admin', password: adminPassword });
      assert.equal(result.status, 200); cookie = result.cookie.split(';')[0]; initialized = true;
    }
  }
  async function saveSms() {
    await admin();
    return request('/v1/admin/sms', { mode: 'spug', templateCode: 'Sms_Password_TestOnly_9955', dailyLimit: 100, adminPassword }, { admin: true });
  }
  function saveSmsDuringHash() {
    // Apply the same synchronous configuration transaction used by the admin
    // endpoint after administrator authentication has already completed.
    svc.db.exec('BEGIN IMMEDIATE');
    try {
      createSmsSettings({ db: svc.db, adminKey: svc.adminKey, now: () => time }).save({ mode: 'disabled', dailyLimit: 100 });
      svc.db.exec('DELETE FROM phone_otps');
      svc.db.exec('COMMIT');
    } catch (error) { svc.db.exec('ROLLBACK'); throw error; }
  }
  return { db: svc.db, id, device, adapter, sent, request, direct, login, send, change, reset, changeData, admin, saveSms, saveSmsDuringHash,
    user: () => svc.db.prepare('SELECT * FROM users WHERE id=?').get(id),
    now: () => time, advance: ms => { time += ms; }, setDelivery: fn => { delivery = fn; } };
}

test('SMS password change takes only the authenticated bound phone and needs no old password', async t => {
  const f = await fixture(t);
  const ticket = await f.send('change', { phone: otherPhone, username: 'someone_else', password: 'wrong', oldPassword: 'wrong' });
  assert.equal(ticket.status, 200); assert.equal(f.sent.length, 1); assert.equal(f.sent[0].to, phone);
  assert.match(ticket.code, /^\d{6}$/); assert.match(ticket.data.message, /10分钟内有效/);
  const row = f.db.prepare('SELECT * FROM phone_otps WHERE id=?').get(ticket.challengeId);
  assert.equal(row.phone, phone); assert.equal(row.purpose, 'change'); assert.equal(row.user_id, f.id);
  assert.equal(row.expires - row.created, 600000); assert.equal(row.ready, 1);
  assert.equal(Object.hasOwn(ticket.data, 'code'), false); assert.notEqual(row.digest, ticket.code);
  const result = await f.change(ticket, { oldPassword: 'wrong' });
  assert.equal(result.status, 200); assert.equal(result.data.loggedOut, true);
  const current = f.user(); assert.equal(scryptSync(newPassword, current.salt, 64).toString('hex'), current.password_hash);
  assert.equal((await f.login(username, password)).status, 401);
  assert.equal((await f.login(username, newPassword)).status, 200);
});

test('SMS password change requires a signed current session and cannot fall back to old password', async t => {
  const f = await fixture(t);
  assert.equal((await f.send('change', {}, null)).status, 401);
  assert.equal((await f.request('/v1/password/change', { oldPassword: password, newPassword })).status, 401);
  assert.equal((await f.request('/v1/password/change', { oldPassword: password, newPassword }, { device: f.device })).status, 400);
  assert.equal(f.sent.length, 0);
  assert.equal((await f.request('/v1/me', undefined, { device: f.device })).status, 200);
});

test('successful SMS change consumes every user OTP and recovery code and revokes every session', async t => {
  const f = await fixture(t), ticket = await f.send();
  const extraToken = 'isolated-extra-session';
  f.db.prepare('INSERT INTO sessions(token_hash,user_id,public_key,expires,last_seen) VALUES(?,?,?,?,?)').run(hash(extraToken), f.id, f.device.publicKey, f.now() + 3600000,f.now());
  f.db.prepare('INSERT INTO password_recovery(token_hash,user_id,kind,expires,created) VALUES(?,?,?,?,?)').run(hash('REC-historical'), f.id, 'personal', f.now() + 86400000, f.now());
  f.advance(60001); const recovery = await f.send('reset'); assert.equal(recovery.status, 200);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id=?').get(f.id).n, 2);
  assert.equal((await f.change(ticket)).status, 200);
  for (const table of ['sessions', 'phone_otps', 'password_recovery']) assert.equal(f.db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id=?`).get(f.id).n, 0);
  assert.equal((await f.request('/v1/me', undefined, { device: f.device })).status, 401);
  assert.equal((await f.request('/v1/me', undefined, { device: { ...f.device, token: extraToken } })).status, 401);
  assert.equal((await f.reset(recovery)).status, 400);
  const loggedIn = await f.login(username, newPassword); assert.equal(loggedIn.status, 200);
  assert.equal((await f.change(ticket, {}, loggedIn)).status, 400);
});

test('phone-only recovery returns the real historical username and revokes the prior session', async t => {
  const f = await fixture(t), ticket = await f.send('reset', {}, null);
  assert.equal(ticket.status, 200); assert.equal(f.sent[0].to, phone);
  assert.equal(Object.hasOwn(ticket.data, 'username'), false, 'sending must not reveal account names');
  const result = await f.reset(ticket); assert.equal(result.status, 200); assert.equal(result.data.username, username);
  assert.equal((await f.request('/v1/me', undefined, { device: f.device })).status, 401);
  assert.equal((await f.login(username, password)).status, 401);
  assert.equal((await f.login(username, newPassword)).status, 200);
  assert.equal((await f.reset(ticket)).status, 400);
});

test('recovery accepts legacy username submission but an explicit wrong phone never falls back to username', async t => {
  const f = await fixture(t);
  const missing = await f.send('reset', { phone: otherPhone, username }, null);
  assert.equal(missing.status, 200); assert.equal(f.sent.length, 0);
  const ticket = await f.send('reset', { username }, null); assert.equal(ticket.status, 200);
  for (const bad of [{ phone: otherPhone, username }, { phone: '', username }, { phone, username: 'different_account' }]) {
    assert.equal((await f.reset(ticket, bad)).status, 400);
  }
  const result = await f.request('/v1/phone/reset', { username: username.toUpperCase(), ...f.changeData(ticket) });
  assert.equal(result.status, 200); assert.equal(result.data.username, username);
});

test('after phone rebinding the original numeric username is not a recovery phone', async t => {
  const f = await fixture(t, { name: otherPhone });
  const missing = await f.send('reset', { phone: otherPhone }, null);
  assert.equal(missing.status, 200); assert.equal(f.sent.length, 0);
  const ticket = await f.send('reset', {}, null); assert.equal(ticket.status, 200);
  assert.equal((await f.reset(ticket, { phone: otherPhone })).status, 400);
  const result = await f.reset(ticket); assert.equal(result.status, 200); assert.equal(result.data.username, otherPhone);
});

test('change, recovery, binding, registration and other accounts cannot exchange challenges', async t => {
  const f = await fixture(t), change = await f.send();
  assert.equal((await f.reset(change)).status, 400);
  assert.equal((await f.request('/v1/phone/bind', { phone, challengeId: change.challengeId, code: change.code }, { device: f.device })).status, 400);
  seedLegacyAccount(f.db, { username: 'another_sms_account', password, phone: otherPhone, created: f.now() });
  const otherDevice = await f.login('another_sms_account'); assert.equal(otherDevice.status, 200);
  assert.equal((await f.change(change, {}, otherDevice)).status, 400);
  assert.equal((await f.request('/v1/phone/register', { phone, code: change.code, challengeId: change.challengeId, password })).status, 400);
  f.advance(60001); const recovery = await f.send('reset', {}, null);
  assert.equal((await f.change(recovery)).status, 400);
  const bind = await f.send('bind', { phone: '13800138403', password }); assert.equal(bind.status, 200);
  assert.equal((await f.change(bind)).status, 400); assert.equal((await f.reset(bind)).status, 400);
  assert.equal(f.db.prepare('SELECT attempts FROM phone_otps WHERE id=?').get(change.challengeId).attempts, 0);
  assert.equal((await f.change(change)).status, 200, 'cross-purpose and cross-user requests must not consume the challenge');
});

test('SMS password change rejects invalid new passwords without consuming a correct challenge', async t => {
  const f = await fixture(t), ticket = await f.send();
  for (const bad of ['', 'short', 'a'.repeat(129), null]) assert.equal((await f.change(ticket, { newPassword: bad })).status, 400);
  assert.equal((await f.change(ticket)).status, 200);
});

for (const purpose of ['change', 'reset']) {
  test(`${purpose} OTP is accepted at 599999ms and rejected exactly at 600000ms`, async t => {
    for (const [elapsed, expected] of [[599999, 200], [600000, 400]]) await t.test(String(elapsed), async st => {
      const f = await fixture(st), ticket = await f.send(purpose); f.advance(elapsed);
      const result = purpose === 'change' ? await f.change(ticket) : await f.reset(ticket);
      assert.equal(result.status, expected);
    });
  });
  test(`${purpose} OTP locks after five wrong codes and a resend replaces the old challenge`, async t => {
    const f = await fixture(t), old = await f.send(purpose);
    const wrong = old.code === '000000' ? '000001' : '000000';
    const submit = (ticket, extra) => purpose === 'change' ? f.change(ticket, extra) : f.reset(ticket, extra);
    for (let i = 0; i < 5; i++) assert.equal((await submit(old, { code: wrong })).status, 400);
    assert.equal(f.db.prepare('SELECT attempts FROM phone_otps WHERE id=?').get(old.challengeId).attempts, 5);
    assert.equal((await submit(old)).status, 400);
    assert.equal((await f.send(purpose)).status, 429);
    f.advance(60001); const fresh = await f.send(purpose); assert.equal(fresh.status, 200);
    assert.equal((await submit(old)).status, 400); assert.equal((await submit(fresh)).status, 200);
  });
}

test('unbound or disabled accounts cannot send a change code or use phone recovery', async t => {
  await t.test('unbound', async st => {
    const f = await fixture(st, { bound: false });
    assert.equal((await f.send()).status, 409); assert.equal((await f.change({ challengeId: 'missing', code: '123456' })).status, 409);
    assert.equal((await f.send('reset', {}, null)).status, 200); assert.equal(f.sent.length, 0);
  });
  await t.test('disabled', async st => {
    const f = await fixture(st), ticket = await f.send(); f.db.prepare('UPDATE users SET disabled=1 WHERE id=?').run(f.id);
    assert.equal((await f.send()).status, 401); assert.equal((await f.change(ticket)).status, 401);
    f.advance(60001); assert.equal((await f.send('reset', {}, null)).status, 200); assert.equal(f.sent.length, 1);
    assert.equal((await f.reset(ticket)).status, 400);
  });
});

test('closed recovery-code interfaces retain authentication and never issue or redeem historical codes', async t => {
  const f = await fixture(t); await f.admin();
  const original = f.user().password_hash;
  for (const [kind, code] of [['personal', 'REC-previous-valid-code'], ['admin', 'RESET-previous-valid-code']]) {
    f.db.prepare('INSERT INTO password_recovery(token_hash,user_id,kind,expires,created) VALUES(?,?,?,?,?)').run(hash(code), f.id, kind, f.now() + 3600000, f.now());
    assert.equal((await f.request('/v1/password/reset', { username, code, newPassword })).status, 410);
  }
  assert.equal((await f.request('/v1/password/recovery-code', { password })).status, 401);
  assert.equal((await f.request('/v1/password/recovery-code', { password }, { device: f.device })).status, 410);
  assert.equal((await f.request('/v1/admin/reset-code', { id: f.id, reason: 'Historical recovery verification' })).status, 401);
  assert.equal((await f.request('/v1/admin/reset-code', { id: f.id }, { admin: true, csrf: false })).status, 403);
  assert.equal((await f.request('/v1/admin/reset-code', { id: f.id }, { admin: true })).status, 410);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM password_recovery').get().n, 2);
  assert.equal(f.user().password_hash, original); assert.equal(f.sent.length, 0);
});

test('unconfigured service and failed delivery never leave a usable change challenge', async t => {
  const f = await fixture(t, { configured: false });
  assert.equal((await f.send()).status, 503); assert.equal(f.sent.length, 0);
  f.adapter.configured = true; f.setDelivery(async () => { throw Object.assign(Error('isolated provider failure'), { status: 502 }); });
  assert.equal((await f.send()).status, 502); assert.equal(f.sent.length, 1);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM phone_otps').get().n, 0);
  assert.equal((await f.send()).status, 429, 'delivery failure still counts against sending quota');
});

test('a pending provider response cannot be used before the change challenge is ready', async t => {
  const f = await fixture(t); let entered, release;
  const started = new Promise(resolve => { entered = resolve; });
  f.setDelivery(() => new Promise(resolve => { release = resolve; entered(); }));
  const pending = f.send(); await started;
  const row = f.db.prepare('SELECT * FROM phone_otps').get(); assert.equal(row.ready, 0);
  try { assert.equal((await f.change({ challengeId: row.id, code: f.sent.at(-1).code })).status, 400); }
  finally { release({ requestId: 'isolated-ready' }); }
  const ticket = await pending; assert.equal(ticket.status, 200); assert.equal((await f.change(ticket)).status, 200);
});

for (const state of ['logout', 'session-replacement', 'phone', 'password', 'disabled', 'configuration', 'expiry']) {
  test(`pending change delivery is discarded when ${state} changes`, async t => {
    const f = await fixture(t); let entered, release;
    if (state === 'configuration') await f.admin();
    const started = new Promise(resolve => { entered = resolve; });
    f.setDelivery(() => new Promise(resolve => { release = resolve; entered(); }));
    const pending = f.send(); await started;
    try {
      if (state === 'logout') assert.equal((await f.request('/v1/logout', {}, { device: f.device })).status, 200);
      if (state === 'session-replacement') assert.equal((await f.login(username, password, false, f.device)).status, 200);
      if (state === 'phone') f.db.prepare('UPDATE users SET phone=? WHERE id=?').run(otherPhone, f.id);
      if (state === 'password') f.db.prepare('UPDATE users SET password_hash=? WHERE id=?').run('a'.repeat(128), f.id);
      if (state === 'disabled') f.db.prepare('UPDATE users SET disabled=1 WHERE id=?').run(f.id);
      if (state === 'configuration') assert.equal((await f.saveSms()).status, 200);
      if (state === 'expiry') f.advance(600000);
    } finally { release({ requestId: 'isolated-stale' }); }
    assert([400, 401, 409].includes((await pending).status));
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM phone_otps').get().n, 0);
  });
}

for (const purpose of ['change', 'reset']) {
  for (const state of ['phone', 'password', 'disabled', 'configuration', 'expiry', 'attempts', ...(purpose === 'change' ? ['session'] : [])]) {
    test(`${purpose} submission rechecks ${state} after password hashing`, async t => {
      const f = await fixture(t), ticket = await f.send(purpose), original = f.user().password_hash;
      const route = purpose === 'change' ? '/v1/password/change' : '/v1/phone/reset';
      const pending = f.direct(route, { phone, ...f.changeData(ticket) }, purpose === 'change' ? { device: f.device } : {});
      if (state === 'phone') f.db.prepare('UPDATE users SET phone=? WHERE id=?').run(otherPhone, f.id);
      if (state === 'password') f.db.prepare('UPDATE users SET password_hash=? WHERE id=?').run('b'.repeat(128), f.id);
      if (state === 'disabled') f.db.prepare('UPDATE users SET disabled=1 WHERE id=?').run(f.id);
      if (state === 'configuration') f.saveSmsDuringHash();
      if (state === 'expiry') f.advance(600000);
      if (state === 'attempts') f.db.prepare('UPDATE phone_otps SET attempts=5 WHERE id=?').run(ticket.challengeId);
      if (state === 'session') f.db.prepare('DELETE FROM sessions WHERE user_id=?').run(f.id);
      const result = await pending; assert([400, 401].includes(result.status), JSON.stringify(result));
      assert.equal(f.user().password_hash, state === 'password' ? 'b'.repeat(128) : original);
    });
  }
  test(`concurrent ${purpose} submissions consume the challenge once`, async t => {
    const f = await fixture(t), ticket = await f.send(purpose);
    const route = purpose === 'change' ? '/v1/password/change' : '/v1/phone/reset';
    const options = purpose === 'change' ? { device: f.device } : {};
    const first = f.direct(route, { phone, ...f.changeData(ticket) }, options);
    const second = f.direct(route, { phone, ...f.changeData(ticket, { newPassword: 'Another-competing-password-2026' }) }, options);
    const results = await Promise.all([first, second]);
    assert.equal(results.filter(result => result.status === 200).length, 1);
    assert(results.some(result => [400, 401].includes(result.status)));
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM phone_otps WHERE user_id=?').get(f.id).n, 0);
    assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id=?').get(f.id).n, 0);
  });
}

test('change and reset share phone cooldown and cannot use separate purposes to resend immediately', async t => {
  const f = await fixture(t); assert.equal((await f.send()).status, 200);
  assert.equal((await f.send('reset', {}, null)).status, 429);
  assert.equal((await f.send('bind', { phone, password })).status, 429);
  assert.equal(f.sent.length, 1);
});

test('concurrent change and recovery allow only one password update across separate purposes', async t => {
  const f = await fixture(t), changeTicket = await f.send();
  f.advance(60001); const resetTicket = await f.send('reset', {}, null);
  const changing = f.direct('/v1/password/change', f.changeData(changeTicket), { device: f.device });
  const recovering = f.direct('/v1/phone/reset', { phone, ...f.changeData(resetTicket, { newPassword: 'Competing-reset-password-2026' }) });
  const results = await Promise.all([changing, recovering]);
  assert.equal(results.filter(result => result.status === 200).length, 1);
  assert(results.some(result => [400, 401].includes(result.status)));
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM phone_otps WHERE user_id=?').get(f.id).n, 0);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id=?').get(f.id).n, 0);
});

test('recovery returns the current username if it changes while the new password is hashing', async t => {
  const f = await fixture(t), ticket = await f.send('reset', {}, null);
  const pending = f.direct('/v1/phone/reset', { phone, ...f.changeData(ticket) });
  const renamed = 'renamed_sms_customer';
  f.db.prepare('UPDATE users SET username=? WHERE id=?').run(renamed, f.id);
  const result = await pending; assert.equal(result.status, 200); assert.equal(result.data.username, renamed);
  assert.equal((await f.login(renamed, newPassword)).status, 200);
});
