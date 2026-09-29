import { test } from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createService, hash, addMonths } from './server.mjs';
import { seedLegacyAccount } from './test-helper.mjs';

test('calendar renewals clamp month-end and leap-day', () => {
  assert.equal(new Date(addMonths(Date.UTC(2028, 0, 31), 1)).toISOString(), '2028-02-29T00:00:00.000Z');
  assert.equal(new Date(addMonths(Date.UTC(2028, 1, 29), 12)).toISOString(), '2029-02-28T00:00:00.000Z');
});
test('real HTTP account, device, authorization, revocation and persistence flows', async t => {
  const dir = mkdtempSync(path.join(tmpdir(), 'juhe-auth-'));
  let time = Date.now(), svc, base;
  async function start() { svc = createService({ dataDir: dir, now: () => time, legacyAdminEnabled:true }); await new Promise(r => svc.server.listen(0, '127.0.0.1', r)); base = `http://127.0.0.1:${svc.server.address().port}`; }
  async function stop() { await new Promise(r => svc.server.close(r)); }
  const device = () => { const pair = generateKeyPairSync('ed25519'); return { privateKey: pair.privateKey, publicKey: pair.publicKey.export({ type: 'spki', format: 'pem' }).toString(), token: '' }; };
  const d1 = device(), d2 = device();
  async function api(route, data, { auth, admin = false, headers = {} } = {}) {
    const method = data === undefined ? 'GET' : 'POST', raw = data === undefined ? '' : JSON.stringify(data);
    const h = { 'Content-Type': 'application/json', ...headers };
    if (admin) h.Authorization = `Bearer ${svc.adminKey}`;
    if (auth) { const nonce = randomBytes(24).toString('hex'), stamp = String(time); Object.assign(h, { Authorization: `Bearer ${auth.token}`, 'X-Time': stamp, 'X-Nonce': nonce, 'X-Signature': sign(null, Buffer.from([method, route, stamp, nonce, hash(raw)].join('\n')), auth.privateKey).toString('base64') }); }
    const r = await fetch(base + route, { method, headers: h, body: data === undefined ? undefined : raw }); return { status: r.status, data: await r.json() };
  }
  async function login(d, password = 'Trial-password-2026', username = 'trialuser', takeover = false) {
    const c = await api('/v1/challenge', { publicKey: d.publicKey });
    const r = await api('/v1/login', { username, password, takeover, deviceName:'开发测试电脑', challenge: c.data.challenge, signature: sign(null, Buffer.from(c.data.challenge), d.privateKey).toString('base64') });
    if (r.data.token) d.token = r.data.token; return r;
  }
  async function code(months = 1, deviceLimit = 3) { const r = await api('/v1/admin/codes', { months, deviceLimit }, { admin: true }); assert.equal(r.status, 200); return r.data; }
  try {
    await start();
    await t.test('legacy registration is closed for every account name and leaves existing accounts unchanged', async () => {
      for (const input of [
        { username: 'trialuser', password: 'short' },
        { username: 'trialuser', password: 'Trial-password-2026' },
        { username: 'TRIALUSER', password: 'Trial-password-2026' },
        { username: '13800138001', password: 'Trial-password-2026' },
        {}
      ]) {
        const result = await api('/v1/register', input);
        assert.equal(result.status, 410); assert.match(result.data.message, /账号注册已关闭.*手机号验证码注册/);
      }
      assert.equal(svc.db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 0);
      seedLegacyAccount(svc.db, { username: 'trialuser', password: 'Trial-password-2026', created: time });
      const original = svc.db.prepare('SELECT * FROM users WHERE username=?').get('trialuser');
      assert.equal((await api('/v1/register', { username: 'trialuser', password: 'Replacement-password-2026' })).status, 410);
      assert.deepEqual(svc.db.prepare('SELECT * FROM users WHERE username=?').get('trialuser'), original);
      assert.equal(svc.db.prepare("SELECT COUNT(*) AS n FROM audit WHERE action='register'").get().n, 0);
    });
    await t.test('wrong passwords do not bind and unactivated accounts have one device slot', async () => {
      assert.equal((await login(d2, 'incorrect-password')).status, 401);
      assert.equal(svc.db.prepare('SELECT public_key FROM users').get().public_key, null);
      const r = await login(d1); assert.equal(r.status, 200); assert.equal(r.data.user.active, false);
      const limited=await login(d2);assert.equal(limited.status,409);assert.equal(limited.data.code,'DEVICE_LIMIT');assert.equal(limited.data.deviceLimit,1);
      assert.equal((await login(d2,'Trial-password-2026','trialuser',true)).status,409,'takeover cannot bypass the purchased limit');
      assert.equal((await api('/v1/devices',undefined,{auth:d1})).data.devices.length,1);
      assert.equal((await api('/v1/me', undefined, { auth: { ...d2, token: d1.token } })).status, 401);
    });
    await t.test('admin and cross-origin endpoints are protected', async () => {
      assert.equal((await api('/v1/admin/state')).status, 401);
      assert.equal((await api('/v1/admin/codes', { months: 1, shops: 3 })).status, 401);
      assert.equal((await api('/v1/register', {}, { headers: { Origin: 'https://example.com' } })).status, 403);
      assert.equal((await api('/v1/admin/codes', { months: 2, shops: -1 }, { admin: true })).status, 400);
    });
    let expiry;
    await t.test('concurrent redemption grants exactly once and rejects reused/invalid codes', async () => {
      const c = await code(); const rs = await Promise.all([api('/v1/redeem', { code: c.code }, { auth: d1 }), api('/v1/redeem', { code: c.code }, { auth: d1 })]);
      assert.deepEqual(rs.map(r => r.status).sort(), [200, 409]); expiry = rs.find(r => r.status === 200).data.user.expiresAt;
      assert.equal(expiry, addMonths(time, 1)); assert.equal(svc.db.prepare("SELECT count(*) AS n FROM audit WHERE action='redeem'").get().n, 1);
      assert.equal((await api('/v1/redeem', { code: 'JH-NOT-REAL' }, { auth: d1 })).status, 400);
      const c2 = await code(12); const r = await api('/v1/redeem', { code: c2.code }, { auth: d1 });
      assert.equal(r.data.user.expiresAt, addMonths(expiry, 12)); expiry = r.data.user.expiresAt;
      const different = await code(1, 5); assert.equal((await api('/v1/redeem', { code: different.code }, { auth: d1 })).status, 409);
      assert.equal(svc.db.prepare('SELECT used_by FROM codes WHERE id=?').get(different.id).used_by, null);
    });
    await t.test('revoked and expired codes cannot activate', async () => {
      const c = await code(); assert.equal((await api('/v1/admin/revoke-code', { id: c.id }, { admin: true })).status, 200);
      assert.equal((await api('/v1/redeem', { code: c.code }, { auth: d1 })).status, 400);
      const expired = await code(); svc.db.prepare('UPDATE codes SET expires=? WHERE id=?').run(time - 1, expired.id);
      assert.equal((await api('/v1/redeem', { code: expired.code }, { auth: d1 })).status, 400);
    });
    await t.test('desktop shop contract permits unlimited shops and preserves ownership, duplicates and atomic batches', async () => {
      const compat = data => api('/v1/compat', data, { auth: d1 });
      const added = await compat({ url: '/cline/shop', method: 'post', data: { platformType: '4', platformShopId: 'test-1', shopName: '测试店铺1' } });
      assert.equal(added.status, 200); const id = added.data.data.id;
      assert.equal((await compat({ url: '/cline/shop', method: 'post', data: { platformType: '4', platformShopId: 'test-1' } })).status, 409);
      const rs = await Promise.all([2,3,4].map(n => compat({ url: '/cline/shop', method: 'post', data: { platformType: '4', platformShopId: `test-${n}` } })));
      assert.equal(rs.filter(r => r.status === 200).length, 3);
      assert.equal((await compat({ url: '/cline/shop/Alllist' })).data.data.length, 4);
      assert.equal((await compat({ url: '/cline/shop/batchupdateshop', method: 'put', data: [{ id, shopName: 'should-rollback' }, { id: 999999, shopName: 'invalid' }] })).status, 404);
      assert.equal((await compat({ url: `/cline/shop/${id}` })).data.data.shopName, '测试店铺1');
      assert.equal((await compat({ url: '/unsupported/write', method: 'post', data: {} })).status, 501);
      const otherUser = device();
      seedLegacyAccount(svc.db, { username: 'otheruser', password: 'Trial-password-2026', created: time }); await login(otherUser, 'Trial-password-2026', 'otheruser');
      const otherCode = await code(); await api('/v1/redeem', { code: otherCode.code }, { auth: otherUser });
      assert.equal((await api('/v1/compat', { url: `/cline/shop/${id}`, method: 'delete' }, { auth: otherUser })).status, 404);
      assert.equal((await compat({ url: `/cline/shop/${id}`, method: 'delete' })).status, 200);
    });
    await t.test('request signatures reject replay', async () => {
      const nonce = randomBytes(24).toString('hex'), stamp = String(time);
      const headers = { Authorization: `Bearer ${d1.token}`, 'X-Time': stamp, 'X-Nonce': nonce, 'X-Signature': sign(null, Buffer.from(['GET', '/v1/me', stamp, nonce, hash('')].join('\n')), d1.privateKey).toString('base64') };
      assert.equal((await api('/v1/me', undefined, { headers })).status, 200); assert.equal((await api('/v1/me', undefined, { headers })).status, 409);
    });
    await t.test('expired and reused login challenges are rejected at the exact boundary', async () => {
      const c = await api('/v1/challenge', { publicKey: d1.publicKey });
      const input = { username: 'trialuser', password: 'Trial-password-2026', challenge: c.data.challenge, signature: sign(null, Buffer.from(c.data.challenge), d1.privateKey).toString('base64') };
      time += 60_000;
      assert.equal((await api('/v1/login', input)).status, 401);
      assert.equal((await api('/v1/login', input)).status, 401);
      const fresh = await api('/v1/challenge', { publicKey: d1.publicKey });
      input.challenge = fresh.data.challenge; input.signature = sign(null, Buffer.from(input.challenge), d1.privateKey).toString('base64');
      const renewed = await api('/v1/login', input); assert.equal(renewed.status, 200); d1.token=renewed.data.token;
      assert.equal((await api('/v1/login', input)).status, 401);
    });
    await t.test('request proof rejects body tampering and clock skew', async () => {
      const headers = { Authorization: `Bearer ${d1.token}`, 'X-Time': String(time), 'X-Nonce': randomBytes(24).toString('hex') };
      headers['X-Signature'] = sign(null, Buffer.from(['POST', '/v1/redeem', headers['X-Time'], headers['X-Nonce'], hash(JSON.stringify({ code: 'original' }))].join('\n')), d1.privateKey).toString('base64');
      assert.equal((await api('/v1/redeem', { code: 'tampered' }, { headers })).status, 401);
      headers['X-Time'] = String(time - 61_000); headers['X-Nonce'] = randomBytes(24).toString('hex');
      headers['X-Signature'] = sign(null, Buffer.from(['GET', '/v1/me', headers['X-Time'], headers['X-Nonce'], hash('')].join('\n')), d1.privateKey).toString('base64');
      assert.equal((await api('/v1/me', undefined, { headers })).status, 401);
    });
    await t.test('malformed JSON, huge bodies and untrusted Host do not break service', async () => {
      let r = await fetch(base + '/v1/register', { method: 'POST', body: '{bad' }); assert.equal(r.status, 400);
      r = await fetch(base + '/v1/register', { method: 'POST', body: JSON.stringify({ password: 'x'.repeat(17000) }) }); assert.equal(r.status, 413);
      const badHostStatus = await new Promise((resolve, reject) => {
        const req = http.get(base + '/health', { headers: { Host: 'example.com' } }, res => { res.resume(); resolve(res.statusCode); }); req.on('error', reject);
      });
      assert.equal(badHostStatus, 403);
      assert.equal((await api('/health')).status, 200);
    });
    await t.test('restart keeps account, binding and entitlement', async () => {
      await stop(); await start(); const r = await api('/v1/me', undefined, { auth: d1 }); assert.equal(r.status, 200); assert.equal(r.data.user.expiresAt, expiry);
      assert.equal((await login(d2)).status, 200);assert.equal((await api('/v1/me',undefined,{auth:d1})).status,200);
    });
    await t.test('reset revokes old sessions and lets another device bind', async () => {
      assert.equal((await api('/v1/admin/reset-device', { id: 1 }, { admin: true })).status, 200);
      assert.equal((await api('/v1/me', undefined, { auth: d1 })).status, 401); assert.equal((await login(d2)).status, 200);
      assert.equal((await login(d1)).status, 200);
    });
    await t.test('expiry restricts entitlement; renew starts from current time; logout revokes token', async () => {
      time = expiry + 1000; const l = await login(d2); assert.equal(l.data.user.active, false);
      const c = await code(); const r = await api('/v1/redeem', { code: c.code }, { auth: d2 }); assert.equal(r.data.user.expiresAt, addMonths(time, 1));
      assert.equal((await api('/v1/logout', {}, { auth: d2 })).status, 200); assert.equal((await api('/v1/me', undefined, { auth: d2 })).status, 401);
    });
    await t.test('multi-device login preserves other sessions and unbinding revokes only the selected device', async () => {
      time += 60_001;
      assert.equal((await login(d2)).status,200);
      const oldToken=d2.token;
      assert.equal((await login(d1)).status,200);
      assert.equal((await api('/v1/me',undefined,{auth:d2})).status,200);
      assert.equal((await login(d1,'Trial-password-2026','trialuser',true)).status,200);
      assert.equal((await api('/v1/me',undefined,{auth:{...d2,token:oldToken}})).status,200);
      let ds=(await api('/v1/devices',undefined,{auth:d1})).data.devices;
      assert.equal(ds.length,2); assert.equal(ds.filter(d=>d.current).length,1);
      const other=ds.find(d=>!d.current), self=ds.find(d=>d.current);
      assert.equal((await api('/v1/devices/unbind',{id:other.id},{auth:d1})).status,200);
      assert.equal((await api('/v1/me',undefined,{auth:d2})).status,401);
      await stop(); await start();
      ds=(await api('/v1/devices',undefined,{auth:d1})).data.devices; assert.equal(ds.length,1); assert.equal(ds[0].id,self.id);
      const r=await api('/v1/devices/unbind',{id:self.id},{auth:d1}); assert.equal(r.data.loggedOut,true);
      assert.equal((await api('/v1/me',undefined,{auth:d1})).status,401);
      await stop(); await start(); assert.equal(svc.db.prepare('SELECT count(*) n FROM devices WHERE user_id=1').get().n,0);
      assert.equal((await login(d2)).status,200);
    });
    await t.test('disabled accounts cannot log in and old sessions stop working', async () => {
      await login(d2); await api('/v1/admin/disable', { id: 1 }, { admin: true }); assert.equal((await api('/v1/me', undefined, { auth: d2 })).status, 401); assert.equal((await login(d2)).status, 403);
      const prior=svc.db.prepare('SELECT expires,device_limit FROM users WHERE id=1').get();
      assert.equal((await api('/v1/admin/enable',{id:1},{admin:true})).status,200);
      assert.equal((await api('/v1/me',undefined,{auth:d2})).status,401);
      assert.equal((await login(d2)).status,200);
      assert.deepEqual(svc.db.prepare('SELECT expires,device_limit FROM users WHERE id=1').get(),prior);
    });
    await t.test('rate limiting never takes the health endpoint down', async () => {
      let limited = false;
      for (let i = 0; i < 320; i++) { const r = await api('/v1/admin/state', undefined, { admin: true }); if (r.status === 429) limited = true; }
      assert(limited); assert.equal((await api('/health')).status, 200);
    });
  } finally {
    if (svc?.server.listening) await stop();
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(tmpdir()));
    assert(path.basename(dir).startsWith('juhe-auth-'));
    rmSync(dir, { recursive: true, force: true });
  }
});
