import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { createService, hash } from './server.mjs';
import { seedLegacyAccount } from './test-helper.mjs';

const username = 'multi_device_customer', password = 'Multi-device-password-2026';
function device(name) {
  const pair = generateKeyPairSync('ed25519');
  return { name, privateKey: pair.privateKey, publicKey: pair.publicKey.export({ type: 'spki', format: 'pem' }).toString(), token: '' };
}
async function fixture(t, limit = 2) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'juhe-multi-device-'));
  let time = 1900000000000;
  const sent = [], svc = createService({ dataDir: dir, now: () => time, publicOrigin: '', legacyAdminEnabled: true, testMode: true,
    testSmsAdapter: { configured: true, validityMinutes: 10, async send(phone, code) { sent.push({ phone, code }); return { requestId: 'isolated-device-password' }; } } });
  const id = seedLegacyAccount(svc.db, { username, password, phone: '13800138501', deviceLimit: limit, created: time });
  svc.db.prepare('UPDATE users SET expires=? WHERE id=?').run(time + 86400000, id);
  await new Promise(resolve => svc.server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + svc.server.address().port;
  t.after(async () => { if (svc.server.listening) await new Promise(resolve => svc.server.close(resolve)); assert.equal(path.dirname(dir), path.resolve(os.tmpdir())); fs.rmSync(dir, { recursive: true, force: true }); });
  function headers(route, data, auth, key = auth?.privateKey) {
    const method = data === undefined ? 'GET' : 'POST', raw = data === undefined ? '' : JSON.stringify(data);
    const value = { 'Content-Type': 'application/json' };
    if (auth) {
      const stamp = String(time), nonce = randomBytes(20).toString('hex');
      Object.assign(value, { Authorization: 'Bearer ' + auth.token, 'X-Time': stamp, 'X-Nonce': nonce,
        'X-Signature': sign(null, Buffer.from([method, route, stamp, nonce, hash(raw)].join('\n')), key).toString('base64') });
    }
    return value;
  }
  async function request(route, data, { auth, admin = false, proof } = {}) {
    const h = proof || headers(route, data, auth); if (admin) h.Authorization = 'Bearer ' + svc.adminKey;
    const response = await fetch(base + route, { method: data === undefined ? 'GET' : 'POST', headers: h, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
    return { status: response.status, data: await response.json() };
  }
  async function login(auth, { name = username, suppliedPassword = password, takeover = false } = {}) {
    const challenge = await request('/v1/challenge', { publicKey: auth.publicKey }); assert.equal(challenge.status, 200);
    const result = await request('/v1/login', { username: name, password: suppliedPassword, takeover, deviceName: auth.name,
      challenge: challenge.data.challenge, signature: sign(null, Buffer.from(challenge.data.challenge), auth.privateKey).toString('base64') });
    if (result.status === 200) auth.token = result.data.token;
    return result;
  }
  return { db: svc.db, id, sent, request, login, headers, now: () => time, advance: ms => { time += ms; },
    me: auth => request('/v1/me', undefined, { auth }), list: auth => request('/v1/devices', undefined, { auth }),
    session: auth => svc.db.prepare('SELECT * FROM sessions WHERE token_hash=?').get(hash(auth.token)) };
}

test('two purchased slots permit two independently signed devices and reject a third without takeover', async t => {
  const f = await fixture(t), a = device('电脑A'), b = device('电脑B'), c = device('电脑C');
  const first = await f.login(a); assert.equal(first.status, 200);
  assert.equal(first.data.user.deviceLimit, 2); assert.equal(first.data.user.shopUnlimited, true); assert.equal(first.data.user.shopLimit, null);
  assert.equal((await f.login(b)).status, 200);
  const limited = await f.login(c, { takeover: true });
  assert.equal(limited.status, 409); assert.equal(limited.data.code, 'DEVICE_LIMIT'); assert.equal(limited.data.deviceLimit, 2);
  assert.equal(Object.hasOwn(limited.data, 'token'), false);
  assert.equal((await f.me(a)).status, 200); assert.equal((await f.me(b)).status, 200);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM devices WHERE user_id=?').get(f.id).n, 2, 'rejected login must not create a binding');
  const listA = (await f.list(a)).data, listB = (await f.list(b)).data;
  assert.equal(listA.onlineDeviceCount, 2); assert.equal(listA.boundDeviceCount, 2);
  assert.equal(listA.devices.find(row => row.current).name, '电脑A'); assert.equal(listB.devices.find(row => row.current).name, '电脑B');
  assert(listA.devices.every(row => row.online && row.sessionActive && row.lastSeen === f.now()));
  assert.equal(JSON.stringify(listA).includes('PUBLIC KEY'), false); assert.equal(JSON.stringify(listA).includes(a.token), false);
});

test('same-device relogin replaces only that device token and keeps other devices online', async t => {
  const f = await fixture(t), a = device('A'), b = device('B');
  assert.equal((await f.login(a)).status, 200); assert.equal((await f.login(b)).status, 200);
  const oldA = { ...a }, originalB = b.token;
  assert.equal((await f.login(a)).status, 200); assert.notEqual(a.token, oldA.token); assert.equal(b.token, originalB);
  assert.equal((await f.me(oldA)).status, 401); assert.equal((await f.me(a)).status, 200); assert.equal((await f.me(b)).status, 200);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id=?').get(f.id).n, 2);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM devices WHERE user_id=?').get(f.id).n, 2);
});

test('concurrent logins cannot claim more slots than purchased', async t => {
  const f = await fixture(t), devices = Array.from({ length: 5 }, (_, i) => device('parallel-' + i));
  const results = await Promise.all(devices.map(auth => f.login(auth)));
  assert.equal(results.filter(result => result.status === 200).length, 2);
  assert.equal(results.filter(result => result.status === 409 && result.data.code === 'DEVICE_LIMIT').length, 3);
  assert.equal(f.db.prepare('SELECT COUNT(DISTINCT public_key) AS n FROM sessions WHERE user_id=?').get(f.id).n, 2);
  for (let i = 0; i < devices.length; i++) if (results[i].status === 200) assert.equal((await f.me(devices[i])).status, 200);
});

test('logout releases one device slot while preserving other devices and historical bindings', async t => {
  const f = await fixture(t), a = device('A'), b = device('B'), c = device('C');
  await f.login(a); await f.login(b);
  assert.equal((await f.request('/v1/logout', {}, { auth: a })).status, 200);
  assert.equal((await f.me(a)).status, 401); assert.equal((await f.me(b)).status, 200); assert.equal((await f.login(c)).status, 200);
  const list = (await f.list(b)).data; assert.equal(list.onlineDeviceCount, 2); assert.equal(list.boundDeviceCount, 3);
  assert.equal(list.devices.find(row => row.name === 'A').online, false);
});

test('unbinding a selected device revokes only that device and self-unbind requires relogin', async t => {
  const f = await fixture(t), a = device('A'), b = device('B'), c = device('C'); await f.login(a); await f.login(b);
  const list = (await f.list(a)).data.devices, other = list.find(row => row.name === 'B');
  const removed = await f.request('/v1/devices/unbind', { id: other.id }, { auth: a });
  assert.equal(removed.status, 200); assert.equal(removed.data.loggedOut, false);
  assert.equal((await f.me(b)).status, 401); assert.equal((await f.me(a)).status, 200); assert.equal((await f.login(c)).status, 200);
  const self = (await f.list(a)).data.devices.find(row => row.current);
  const exited = await f.request('/v1/devices/unbind', { id: self.id }, { auth: a });
  assert.equal(exited.data.loggedOut, true); assert.equal((await f.me(a)).status, 401); assert.equal((await f.me(c)).status, 200);
});

test('only valid signed heartbeats extend the lease, including exact 90-second expiry', async t => {
  const f = await fixture(t), a = device('A'), b = device('B'), c = device('C'); await f.login(a); await f.login(b);
  f.advance(89999); assert.equal((await f.me(a)).status, 200); assert.equal((await f.login(c)).status, 409);
  f.advance(1); assert.equal((await f.login(c)).status, 200, 'B is stale at exactly 90 seconds while A remains online');
  const recovered = await f.me(b); assert.equal(recovered.status, 401); assert.equal(recovered.data.code, 'DEVICE_LIMIT'); assert.equal(recovered.data.deviceLimit, 2);
  assert.equal(f.session(b), undefined, 'a rejected stale token must not silently work later');
  assert.equal((await f.me(a)).status, 200); assert.equal((await f.me(c)).status, 200);
  await f.request('/v1/logout', {}, { auth: c }); assert.equal((await f.me(b)).status, 401);
  assert.equal((await f.login(b)).status, 200);
});

test('an idle token may resume its slot when capacity remains and token TTL still expires after 12 hours', async t => {
  const f = await fixture(t, 1), a = device('A'); await f.login(a); const token = a.token, expires = f.session(a).expires;
  f.advance(90000); assert.equal((await f.me(a)).status, 200); assert.equal(a.token, token); assert.equal(f.session(a).last_seen, f.now());
  assert.equal(f.session(a).expires, expires, 'heartbeat must not extend the password session TTL');
  f.advance(expires - f.now()); assert.equal((await f.me(a)).status, 401);
});

test('invalid signatures and replayed proofs never extend a session lease', async t => {
  const f = await fixture(t, 1), a = device('A'), b = device('B'); await f.login(a); const started = f.session(a).last_seen;
  f.advance(89999);
  const invalid = f.headers('/v1/me', undefined, a, b.privateKey);
  assert.equal((await f.request('/v1/me', undefined, { proof: invalid })).status, 401); assert.equal(f.session(a).last_seen, started);
  f.advance(1); assert.equal((await f.login(b)).status, 200);
  f.advance(1000); const proof = f.headers('/v1/me', undefined, b);
  assert.equal((await f.request('/v1/me', undefined, { proof })).status, 200); const lastSeen = f.session(b).last_seen;
  f.advance(1000); assert.equal((await f.request('/v1/me', undefined, { proof })).status, 409); assert.equal(f.session(b).last_seen, lastSeen);
});

test('two stale devices racing for one available slot cannot both resume', async t => {
  const f = await fixture(t), a = device('A'), b = device('B'), c = device('C'); await f.login(a); await f.login(b);
  f.advance(90000); assert.equal((await f.login(c)).status, 200);
  const results = await Promise.all([f.me(a), f.me(b)]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 401]);
  const full = results.find(result => result.status === 401); assert.equal(full.data.code, 'DEVICE_LIMIT');
  assert.equal((await f.list(c)).data.onlineDeviceCount, 2);
});

test('legacy users.public_key never substitutes for a device session signature', async t => {
  const f = await fixture(t), a = device('A'), b = device('B'); await f.login(a); await f.login(b);
  assert.equal(f.db.prepare('SELECT public_key FROM users WHERE id=?').get(f.id).public_key, b.publicKey);
  assert.equal((await f.me(a)).status, 200);
  assert.equal((await f.request('/v1/me', undefined, { proof: f.headers('/v1/me', undefined, a, b.privateKey) })).status, 401);
  f.db.prepare('UPDATE users SET public_key=NULL WHERE id=?').run(f.id);
  assert.equal((await f.me(a)).status, 200); assert.equal((await f.me(b)).status, 200);
});

test('password change revokes every online computer and leaves no reusable device session', async t => {
  const f = await fixture(t), a = device('A'), b = device('B'); await f.login(a); await f.login(b);
  const sent = await f.request('/v1/phone/send', { purpose: 'change' }, { auth: a }); assert.equal(sent.status, 200);
  const result = await f.request('/v1/password/change', { challengeId: sent.data.challengeId, code: f.sent[0].code, newPassword: 'Multi-device-new-password-2026' }, { auth: a });
  assert.equal(result.status, 200); assert.equal((await f.me(a)).status, 401); assert.equal((await f.me(b)).status, 401);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id=?').get(f.id).n, 0);
  assert.equal((await f.login(a)).status, 401); assert.equal((await f.login(a, { suppliedPassword: 'Multi-device-new-password-2026' })).status, 200);
});

test('administrator disabling and unbinding all devices continue to revoke all sessions', async t => {
  const f = await fixture(t), a = device('A'), b = device('B'); await f.login(a); await f.login(b);
  assert.equal((await f.request('/v1/admin/disable', { id: f.id }, { admin: true })).status, 200);
  assert.equal((await f.me(a)).status, 401); assert.equal((await f.me(b)).status, 401); assert.equal((await f.login(a)).status, 403);
  await f.request('/v1/admin/enable', { id: f.id }, { admin: true }); assert.equal((await f.login(a)).status, 200); assert.equal((await f.login(b)).status, 200);
  assert.equal((await f.request('/v1/admin/reset-device', { id: f.id }, { admin: true })).status, 200);
  assert.equal((await f.me(a)).status, 401); assert.equal((await f.me(b)).status, 401);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM devices WHERE user_id=?').get(f.id).n, 0);
});

test('an expired plan cannot be redeemed below the current number of online computers', async t => {
  const f = await fixture(t), a = device('A'), b = device('B'); await f.login(a); await f.login(b);
  f.db.prepare('UPDATE users SET expires=? WHERE id=?').run(f.now() - 1, f.id);
  const issue = await f.request('/v1/admin/codes', { days: 1, deviceLimit: 1 }, { admin: true }); assert.equal(issue.status, 200);
  const blocked = await f.request('/v1/redeem', { code: issue.data.code }, { auth: a });
  assert.equal(blocked.status, 409); assert.equal(blocked.data.code, 'DEVICE_LIMIT');
  assert.equal(f.db.prepare('SELECT used_by FROM codes WHERE id=?').get(issue.data.id).used_by, null);
  assert.equal(f.db.prepare('SELECT device_limit FROM users WHERE id=?').get(f.id).device_limit, 2);
  await f.request('/v1/logout', {}, { auth: b });
  const result = await f.request('/v1/redeem', { code: issue.data.code }, { auth: a }); assert.equal(result.status, 200); assert.equal(result.data.user.deviceLimit, 1);
  assert.equal((await f.login(b)).status, 409);
});
