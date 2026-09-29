import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createService, hash } from './server.mjs';

async function fixture(t) {
  const dir = mkdtempSync(path.join(tmpdir(), 'juhe-admin-users-'));
  let time = 1_800_000_000_000;
  const svc = createService({ dataDir: dir, now: () => time, legacyAdminEnabled: false });
  t.after(async () => {
    if (svc.server.listening) await new Promise(resolve => svc.server.close(resolve));
    else svc.db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await svc.security.initializeAdmin('admin_test', 'Only-isolated-test-2026');
  await new Promise(resolve => svc.server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${svc.server.address().port}`;
  const login = await fetch(base + '/v1/admin/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin_test', password: 'Only-isolated-test-2026' })
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  await login.arrayBuffer();
  const request = async (route = '/v1/admin/users', authenticated = true, options = {}) => {
    const response = await fetch(base + route, { headers: authenticated ? { Cookie: cookie } : {}, ...options });
    return { status: response.status, body: await response.json() };
  };
  const add = (username, overrides = {}) => {
    const data = { username, disabled: 0, expires: 0, shops: 0, deviceLimit: 1, created: time - 10000, publicKey: null, ...overrides };
    return Number(svc.db.prepare('INSERT INTO users(username,salt,password_hash,public_key,disabled,expires,shops,device_limit,created,phone) VALUES(?,?,?,?,?,?,?,?,?,?)')
      .run(data.username, 'PRIVATE-SALT', 'PRIVATE-PASSWORD-HASH', data.publicKey, data.disabled, data.expires, data.shops, data.deviceLimit, data.created, data.phone ?? null).lastInsertRowid);
  };
  const device = (userId, key, options = {}) => Number(svc.db.prepare('INSERT INTO devices(user_id,public_key,name,created,last_login) VALUES(?,?,?,?,?)')
    .run(userId, key, options.name ?? '测试电脑', options.created ?? time - 9000, options.lastLogin ?? time - 1000).lastInsertRowid);
  const session = (userId, key, token, options = {}) => svc.db.prepare('INSERT INTO sessions(token_hash,user_id,public_key,expires,last_seen) VALUES(?,?,?,?,?)')
    .run(hash(token), userId, key, options.expires ?? time + 3600000, options.lastSeen ?? time);
  return { ...svc, request, add, device, session, time: () => time, advance: delta => { time += delta; } };
}

test('admin user list and details require a current administrator session before validating parameters', async t => {
  const f = await fixture(t), id = f.add('test_user');
  assert.equal((await f.request('/v1/admin/users', false)).status, 401);
  assert.equal((await f.request(`/v1/admin/users/${id}`, false)).status, 401);
  assert.equal((await f.request('/v1/admin/users?page=invalid', false)).status, 401);
  assert.equal((await f.request('/v1/admin/users/no-such-id', false)).status, 401);
  assert.equal((await f.request()).status, 200);
  assert.equal((await f.request(`/v1/admin/users/${id}`)).status, 200);
  f.advance(8 * 3600_000);
  assert.equal((await f.request()).status, 401);
  assert.equal((await f.request(`/v1/admin/users/${id}`)).status, 401);
});

test('summary is global and mutually exclusive; filtering and pagination honor expiry boundaries and disabled priority', async t => {
  const f = await fixture(t), now = f.time();
  const active = [f.add('alpha_active', { expires: now + 1 }), f.add('second_active', { expires: now + 60000 })];
  const inactive = [f.add('alpha_inactive'), f.add('second_inactive')];
  const expired = [f.add('alpha_expired', { expires: now }), f.add('second_expired', { expires: now - 1 })];
  const disabled = [f.add('disabled_active', { disabled: 1, expires: now + 1 }), f.add('disabled_inactive', { disabled: 1 }), f.add('disabled_expired', { disabled: 1, expires: now - 1 })];
  const expected = { total: 9, active: 2, inactive: 2, expired: 2, disabled: 3 };
  for (const [status, ids] of Object.entries({ active, inactive, expired, disabled })) {
    const result = await f.request('/v1/admin/users?status=' + status);
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.users.map(user => user.id), ids.toReversed());
    assert(result.body.users.every(user => user.status === status && user.active === (status === 'active')));
    assert.equal(result.body.total, ids.length);
    assert.deepEqual(result.body.summary, expected);
  }
  const page1 = (await f.request('/v1/admin/users?pageSize=4')).body;
  const page2 = (await f.request('/v1/admin/users?page=2&pageSize=4')).body;
  const final = (await f.request('/v1/admin/users?page=999&pageSize=4')).body;
  assert.deepEqual(page1.users.map(user => user.id), [9, 8, 7, 6]);
  assert.deepEqual(page2.users.map(user => user.id), [5, 4, 3, 2]);
  assert.deepEqual(final.users.map(user => user.id), [1]);
  assert.equal(final.page, 3);
  assert.equal(final.totalPages, 3);
  assert.equal(final.pageSize, 4);
  const filtered = (await f.request('/v1/admin/users?q=alpha&status=active')).body;
  assert.equal(filtered.total, 1);
  assert.deepEqual(filtered.summary, expected);
});

test('search uses literal account substrings and exact numeric IDs without SQL or wildcard expansion', async t => {
  const f = await fixture(t);
  const first = f.add('alpha_one'), second = f.add('alphaxtwo');
  f.add('customer_120');
  const lookup = async query => (await f.request('/v1/admin/users?q=' + encodeURIComponent(query))).body.users.map(user => user.id);
  assert.deepEqual(await lookup('ALPHA'), [second, first]);
  assert.deepEqual(await lookup('_one'), [first]);
  assert.deepEqual(await lookup('_'), [3, first]);
  assert.deepEqual(await lookup('%'), []);
  assert.deepEqual(await lookup("' OR 1=1 --"), []);
  assert.deepEqual(await lookup('\\'), []);
  assert.deepEqual(await lookup('聚禾'), []);
  assert.deepEqual(await lookup(String(first)), [3, first]);
  assert.deepEqual(await lookup('9007199254740992'), []);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 3);
});

test('invalid list parameters and invalid detail IDs return 400; unknown users return 404', async t => {
  const f = await fixture(t);
  f.add('test_user');
  for (const query of [
    'page=0', 'page=-1', 'page=1.2', 'page=1e2', 'page=', 'page=01', 'page=9007199254740992',
    'pageSize=0', 'pageSize=101', 'pageSize=2.5', 'pageSize=', 'status=', 'status=online',
    'page=1&page=2', 'q=a&q=b', 'status=all&status=active', 'unknown=1',
    'q=' + 'x'.repeat(41), 'q=%00', 'q=%0A'
  ]) assert.equal((await f.request('/v1/admin/users?' + query)).status, 400, query);
  for (const id of ['', '0', '-1', '1.5', '01', '1e2', 'abc', '9007199254740992', '1/extra', '%31']) {
    assert.equal((await f.request('/v1/admin/users/' + id)).status, 400, id);
  }
  assert.equal((await f.request('/v1/admin/users/1?extra=1')).status, 400);
  assert.equal((await f.request('/v1/admin/users/999')).status, 404);
  assert.equal((await f.request('/v1/admin/users?pageSize=100&page=9007199254740991')).body.page, 1);
});

test('list and details expose only safe fields and preserve login history after unbinding', async t => {
  const f = await fixture(t), now = f.time();
  const id = f.add('history_user', { phone: '13800000000', expires: now + 100, shops: 97, deviceLimit: 5 });
  f.db.prepare("INSERT INTO audit(action,user_id,created) VALUES('login',?,?)").run(id, now - 500);
  f.db.prepare("INSERT INTO audit(action,user_id,created) VALUES('register',?,?)").run(id, now - 100);
  const user = (await f.request()).body.users[0];
  assert.deepEqual(Object.keys(user).sort(), ['id', 'username', 'active', 'expiresAt', 'deviceLimit', 'shopUnlimited', 'shopLimit', 'deviceBound', 'disabled', 'status', 'createdAt', 'lastLogin', 'deviceCount', 'boundDeviceCount', 'onlineDeviceCount'].sort());
  assert.equal(user.lastLogin, now - 500);
  assert.equal(user.deviceCount, 0);
  assert.equal(user.boundDeviceCount, 0); assert.equal(user.onlineDeviceCount, 0);
  assert.equal(user.deviceBound, false);
  assert.equal(user.deviceLimit, 5); assert.equal(user.shopUnlimited, true); assert.equal(user.shopLimit, null);
  assert.equal(user.createdAt, now - 10000);
  const detail = (await f.request('/v1/admin/users/' + id)).body;
  assert.deepEqual(detail, { user, devices: [] });
  for (const secret of ['PRIVATE-SALT', 'PRIVATE-PASSWORD-HASH', '13800000000', 'public_key', 'token_hash', 'password_hash']) {
    assert.equal(JSON.stringify(detail).includes(secret), false, secret);
  }
});

test('device details count distinct leased computers independently of the obsolete current key and subscription expiry', async t => {
  const f = await fixture(t), now = f.time();
  const id = f.add('device_user', { publicKey: 'PRIVATE-CURRENT-KEY', deviceLimit: 5 });
  const currentId = f.device(id, 'PRIVATE-CURRENT-KEY', { lastLogin: now - 1 });
  const expiredId = f.device(id, 'PRIVATE-EXPIRED-KEY', { lastLogin: now - 2 });
  const staleId = f.device(id, 'PRIVATE-STALE-KEY', { lastLogin: now - 3 });
  const recentId = f.device(id, 'PRIVATE-RECENT-KEY', { lastLogin: now - 4 });
  f.session(id, 'PRIVATE-CURRENT-KEY', 'PRIVATE-ACTIVE-TOKEN', { expires: now + 1 });
  f.session(id, 'PRIVATE-CURRENT-KEY', 'PRIVATE-DUPLICATE-TOKEN', { expires: now + 1, lastSeen: now - 20 });
  f.session(id, 'PRIVATE-EXPIRED-KEY', 'PRIVATE-EXPIRED-TOKEN', { expires: now });
  f.session(id, 'PRIVATE-STALE-KEY', 'PRIVATE-STALE-TOKEN', { lastSeen: now - 90000 });
  f.session(id, 'PRIVATE-RECENT-KEY', 'PRIVATE-RECENT-TOKEN', { lastSeen: now - 89999 });
  f.session(id, 'PRIVATE-UNBOUND-KEY', 'PRIVATE-ORPHAN-TOKEN');
  const detail = (await f.request('/v1/admin/users/' + id)).body;
  assert.equal(detail.user.deviceCount, 4); assert.equal(detail.user.boundDeviceCount, 4);
  assert.equal(detail.user.onlineDeviceCount, 2, 'duplicate sessions and unbound keys must not inflate the count');
  assert.equal(detail.user.status, 'inactive', 'an account awaiting activation still uses online computer slots');
  assert.equal(detail.user.deviceBound, true);
  assert.equal(detail.user.lastLogin, now - 1);
  assert.deepEqual(detail.devices.map(device => [device.id, device.current, device.online, device.sessionActive, device.lastSeen]), [
    [currentId, false, true, true, now], [expiredId, false, false, false, null],
    [staleId, false, false, false, now - 90000], [recentId, false, true, true, now - 89999]
  ]);
  assert.deepEqual(Object.keys(detail.devices[0]).sort(), ['id', 'name', 'createdAt', 'lastLogin', 'lastSeen', 'current', 'online', 'sessionActive'].sort());
  assert.equal(JSON.stringify(detail).includes('PRIVATE-'), false);
  assert.equal((await f.request()).body.users[0].onlineDeviceCount, 2);
  f.db.prepare('UPDATE users SET public_key=NULL,expires=? WHERE id=?').run(now - 1, id);
  const withoutCurrent = (await f.request('/v1/admin/users/' + id)).body;
  assert.equal(withoutCurrent.user.deviceBound, true, 'binding reflects devices, not users.public_key');
  assert.equal(withoutCurrent.user.onlineDeviceCount, 2, 'expired subscriptions still allow account access to renew');
  assert(withoutCurrent.devices.every(device => device.current === false), 'admin views have no current customer computer');
  f.db.prepare('UPDATE users SET disabled=1 WHERE id=?').run(id);
  const disabled = (await f.request('/v1/admin/users/' + id)).body;
  assert(disabled.devices.every(device => device.sessionActive === false && device.online === false));
  assert.equal(disabled.user.onlineDeviceCount, 0); assert.equal((await f.request()).body.users[0].onlineDeviceCount, 0);
  f.db.prepare('UPDATE users SET disabled=0 WHERE id=?').run(id);
  f.advance(1);
  const boundary = (await f.request('/v1/admin/users/' + id)).body;
  assert.equal(boundary.user.onlineDeviceCount, 0, 'lease expires at exactly 90000ms and sessions at expires=now');
  assert(boundary.devices.every(device => device.sessionActive === false));
  f.db.prepare("INSERT INTO audit(action,user_id,created) VALUES('login',?,?)").run(id, now - 50);
  assert.equal((await f.request()).body.users[0].lastLogin, now - 50, 'audit history takes priority over imported device timestamps');
});

test('legacy state remains compatible while includeUsers=0 skips users; new API reads do not alter account data', async t => {
  const f = await fixture(t);
  const id = f.add('state_user');
  f.device(id, 'PRIVATE-BOUND-KEY');
  f.db.prepare('INSERT INTO codes(code_hash,hint,months,shops,device_limit,expires,created) VALUES(?,?,?,?,?,?,?)').run('PRIVATE-CODE-HASH', '123456', 1, 2, 2, f.time() + 5000, f.time());
  const snapshot = () => JSON.stringify(['users', 'devices', 'sessions', 'codes', 'audit', 'security_audit'].map(table => f.db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()));
  const before = snapshot();
  const legacy = (await f.request('/v1/admin/state')).body;
  const codesOnly = (await f.request('/v1/admin/state?includeUsers=0')).body;
  assert.equal(legacy.users.length, 1);
  assert.deepEqual(Object.keys(legacy.users[0]).sort(), ['id', 'username', 'active', 'expiresAt', 'deviceLimit', 'shopUnlimited', 'shopLimit', 'deviceBound', 'disabled'].sort());
  assert.equal(legacy.users[0].shopUnlimited, true); assert.equal(legacy.users[0].shopLimit, null);
  assert.equal(legacy.codes[0].deviceLimit, 2); assert.equal(legacy.codes[0].shops, 2);
  assert.deepEqual(codesOnly.users, []);
  assert.deepEqual(codesOnly.codes, legacy.codes);
  assert.equal((await f.request('/v1/admin/state?includeUsers=1')).body.users.length, 1);
  await f.request('/v1/admin/users');
  await f.request('/v1/admin/users/' + id);
  assert.equal(snapshot(), before);
});

test('computer limits default safely and online sessions remain isolated by account and actual bindings', async t => {
  const f = await fixture(t);
  for (const [i, limit] of [0, -1, 1000, 1.5, 'invalid'].entries()) {
    const id = f.add('invalid_limit_' + i, { deviceLimit: limit, shops: 99 });
    const detail = (await f.request('/v1/admin/users/' + id)).body;
    assert.equal(detail.user.deviceLimit, 1); assert.equal(detail.user.shopLimit, null); assert.equal(detail.user.shopUnlimited, true);
  }
  const first = f.add('first_bound_account', { deviceLimit: 999 }), second = f.add('second_bound_account', { deviceLimit: 2 });
  f.device(first, 'PRIVATE-SHARED-KEY'); f.device(second, 'PRIVATE-SHARED-KEY');
  f.session(first, 'PRIVATE-SHARED-KEY', 'PRIVATE-FIRST-TOKEN');
  f.session(second, 'PRIVATE-SHARED-KEY', 'PRIVATE-SECOND-TOKEN', { lastSeen: f.time() - 90000 });
  const records = (await f.request()).body.users;
  assert.equal(records.find(user => user.id === first).deviceLimit, 999);
  assert.equal(records.find(user => user.id === first).onlineDeviceCount, 1);
  assert.equal(records.find(user => user.id === second).onlineDeviceCount, 0);
  assert.equal((await f.request('/v1/admin/users/' + first)).body.devices[0].online, true);
  assert.equal((await f.request('/v1/admin/users/' + second)).body.devices[0].online, false);
  f.db.prepare('DELETE FROM devices WHERE user_id=?').run(first);
  const unbound = (await f.request('/v1/admin/users/' + first)).body;
  assert.equal(unbound.user.boundDeviceCount, 0); assert.equal(unbound.user.onlineDeviceCount, 0);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id=?').get(first).n, 1, 'a residual session alone must not establish a binding');
});

test('empty collections and unmatched search return stable first-page metadata', async t => {
  const f = await fixture(t);
  const empty = (await f.request('/v1/admin/users?page=50')).body;
  assert.deepEqual(empty, { users: [], total: 0, page: 1, pageSize: 20, totalPages: 1, summary: { total: 0, active: 0, inactive: 0, expired: 0, disabled: 0 } });
  f.add('real_user');
  const unmatched = (await f.request('/v1/admin/users?q=absent&page=50')).body;
  assert.deepEqual(unmatched.users, []);
  assert.equal(unmatched.total, 0);
  assert.equal(unmatched.page, 1);
  assert.equal(unmatched.totalPages, 1);
  assert.equal(unmatched.summary.total, 1);
});
