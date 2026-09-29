import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createService, hash, addMonths } from './server.mjs';
import { seedLegacyAccount } from './test-helper.mjs';

const DAY = 86400_000;

async function fixture(t, beforeStart) {
  const dir = mkdtempSync(path.join(tmpdir(), 'juhe-license-codes-'));
  let time = Date.UTC(2028, 0, 31, 12, 34, 56), service, base;
  beforeStart?.(dir, time);
  async function start() {
    service = createService({ dataDir: dir, now: () => time, legacyAdminEnabled: false });
    await new Promise(resolve => service.server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${service.server.address().port}`;
  }
  t.after(async () => {
    if (service?.server.listening) await new Promise(resolve => service.server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  });
  await start();
  await service.security.initializeAdmin('test_admin', 'Only-isolated-license-tests-2026');
  let cookie;
  const api = async (route, data, { admin = false, auth, csrf = true } = {}) => {
    const method = data === undefined ? 'GET' : 'POST', raw = data === undefined ? '' : JSON.stringify(data);
    const headers = { 'Content-Type': 'application/json' };
    if (admin) { headers.Cookie = cookie; if (csrf) headers['X-Juhe-Admin'] = '1'; }
    if (auth) {
      const stamp = String(time), nonce = randomBytes(24).toString('hex');
      Object.assign(headers, { Authorization: `Bearer ${auth.token}`, 'X-Time': stamp, 'X-Nonce': nonce, 'X-Signature': sign(null, Buffer.from([method, route, stamp, nonce, hash(raw)].join('\n')), auth.privateKey).toString('base64') });
    }
    const response = await fetch(base + route, { method, headers, body: data === undefined ? undefined : raw });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie') };
  };
  const login = await api('/v1/admin/login', { username: 'test_admin', password: 'Only-isolated-license-tests-2026' });
  assert.equal(login.status, 200);
  cookie = login.cookie.split(';')[0];
  async function user(username = 'license_user', { deviceLimit = 1 } = {}) {
    const id = seedLegacyAccount(service.db, { username, password: 'Only-isolated-customer-tests-2026', created: time });
    service.db.prepare('UPDATE users SET device_limit=? WHERE id=?').run(deviceLimit, id);
    const pair = generateKeyPairSync('ed25519');
    const publicKey = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const challenge = (await api('/v1/challenge', { publicKey })).body.challenge;
    const result = await api('/v1/login', { username, password: 'Only-isolated-customer-tests-2026', challenge, signature: sign(null, Buffer.from(challenge), pair.privateKey).toString('base64') });
    assert.equal(result.status, 200);
    return { privateKey: pair.privateKey, token: result.body.token, id: result.body.user.id };
  }
  return {
    get db() { return service.db; }, api, user,
    issue: data => api('/v1/admin/codes', data, { admin: true }),
    time: () => time,
    advance: delta => { time += delta; },
    async restart() { await new Promise(resolve => service.server.close(resolve)); await start(); }
  };
}

test('legacy databases migrate days and computer limits additively while preserving old records and calendar renewals', async t => {
  let previous;
  const legacyCode = 'OLD-CALENDAR-CODE-2028';
  const f = await fixture(t, (dir, time) => {
    const db = new DatabaseSync(path.join(dir, 'accounts.sqlite'));
    db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, password_hash TEXT NOT NULL, public_key TEXT, disabled INTEGER NOT NULL DEFAULT 0, expires INTEGER NOT NULL DEFAULT 0, shops INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL);
      CREATE TABLE codes(id INTEGER PRIMARY KEY, code_hash TEXT UNIQUE NOT NULL, hint TEXT NOT NULL, months INTEGER NOT NULL, shops INTEGER NOT NULL, expires INTEGER NOT NULL, used_by INTEGER REFERENCES users(id), used_at INTEGER, revoked INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL);`);
    db.prepare('INSERT INTO users(id,username,salt,password_hash,created) VALUES(1,?,?,?,?)').run('old_user', 'old-salt', 'old-hash', time - DAY);
    const insert = db.prepare('INSERT INTO codes(id,code_hash,hint,months,shops,expires,used_by,used_at,revoked,created) VALUES(?,?,?,?,?,?,?,?,?,?)');
    insert.run(7, hash(legacyCode), legacyCode.slice(-6), 1, 2, time + 30 * DAY, null, null, 0, time - DAY);
    insert.run(8, hash('OLD-USED-2028'), 'D-2028', 12, 2, time + 30 * DAY, 1, time - 1000, 0, time - DAY);
    insert.run(9, hash('OLD-REVOKED-2028'), 'D-2028', 1, 2, time + 30 * DAY, null, null, 1, time - DAY);
    previous = db.prepare('SELECT * FROM codes ORDER BY id').all().map(row => ({ ...row }));
    db.close();
  });
  const migrated = () => f.db.prepare('SELECT * FROM codes ORDER BY id').all().map(({ days, device_limit, ...rest }) => { assert.equal(days, null); assert.equal(device_limit, 2); return rest; });
  assert.deepEqual(migrated(), previous);
  await f.restart();
  assert.equal(f.db.prepare('PRAGMA table_info(codes)').all().filter(column => column.name === 'days').length, 1);
  assert.equal(f.db.prepare('PRAGMA table_info(codes)').all().filter(column => column.name === 'device_limit').length, 1);
  assert.deepEqual(migrated(), previous);
  const auth = await f.user();
  const redeemed = await f.api('/v1/redeem', { code: legacyCode }, { auth });
  assert.equal(redeemed.status, 200);
  assert.equal(redeemed.body.user.expiresAt, Date.UTC(2028, 1, 29, 12, 34, 56));
  assert.equal(redeemed.body.user.deviceLimit, 2);
  assert.equal(redeemed.body.user.shopUnlimited, true); assert.equal(redeemed.body.user.shopLimit, null);
  const year = await f.issue({ months: 12, deviceLimit: 2 });
  assert.equal(year.status, 200);
  const renewed = await f.api('/v1/redeem', { code: year.body.code }, { auth });
  assert.equal(renewed.body.user.expiresAt, Date.UTC(2029, 1, 28, 12, 34, 56));
});

test('single legacy issuance remains compatible and random batches return unique codes without retaining plaintext', async t => {
  const f = await fixture(t);
  const single = await f.issue({ months: 1, shops: 3 });
  assert.equal(single.status, 200);
  assert.deepEqual(single.body.codes, [{ id: single.body.id, code: single.body.code }]);
  assert.equal(single.body.count, 1);
  assert.match(single.body.code, /^JH-(?:[A-F0-9]{6}-){5}[A-F0-9]{6}$/);
  const batch = await f.issue({ days: 45, deviceLimit: 5, count: 100, mode: 'random' });
  assert.equal(batch.status, 200);
  assert.equal(batch.body.count, 100);
  assert.equal(batch.body.codes.length, 100);
  assert.equal(new Set(batch.body.codes.map(item => item.code)).size, 100);
  assert.equal(new Set(batch.body.codes.map(item => item.id)).size, 100);
  assert.equal('code' in batch.body, false);
  assert.equal('id' in batch.body, false);
  const all = [single.body.codes[0], ...batch.body.codes];
  const databaseText = JSON.stringify(['codes', 'audit', 'security_audit'].map(table => f.db.prepare(`SELECT * FROM ${table}`).all()));
  for (const item of all) {
    assert.equal(databaseText.includes(item.code), false);
    const row = f.db.prepare('SELECT * FROM codes WHERE id=?').get(item.id);
    assert.equal(row.code_hash, hash(item.code));
    assert.equal(row.hint, item.code.slice(-6));
    assert.equal(row.expires, f.time() + 30 * DAY);
    assert.equal(row.created, f.time());
    assert.equal(row.device_limit, item.id === single.body.id ? 3 : 5);
    assert.equal(row.shops, row.device_limit, 'new rows retain the legacy column with the same computer count');
    if (item.id !== single.body.id) { assert.equal(row.months, 0); assert.equal(row.days, 45); }
    else assert.equal(row.days, null);
  }
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM audit WHERE action='issue-code'").get().n, 101);
  const state = await f.api('/v1/admin/state?includeUsers=0', undefined, { admin: true });
  assert.equal(state.body.codes.length, 100);
  assert.equal(state.body.codes[0].deviceLimit, 5);
  assert.equal(Object.hasOwn(state.body.codes[0], 'code_hash'), false);
  assert.equal(state.body.codes[0].days, 45);
});

test('legacy code migration defaults invalid historical limits to one and never overwrites a migrated limit on restart', async t => {
  const values = [1, 999, 0, -1, 1000, 1.5, 'not-a-count'];
  let previous;
  const f = await fixture(t, (dir, time) => {
    const db = new DatabaseSync(path.join(dir, 'accounts.sqlite'));
    db.exec('CREATE TABLE codes(id INTEGER PRIMARY KEY,code_hash TEXT UNIQUE NOT NULL,hint TEXT NOT NULL,months INTEGER NOT NULL,shops INTEGER NOT NULL,expires INTEGER NOT NULL,used_by INTEGER,used_at INTEGER,revoked INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL)');
    const insert = db.prepare('INSERT INTO codes(code_hash,hint,months,shops,expires,created) VALUES(?,?,?,?,?,?)');
    for (const [i, value] of values.entries()) insert.run(hash('OLD-LIMIT-' + i), 'OLD-' + i, 1, value, time + DAY, time);
    previous = db.prepare('SELECT * FROM codes ORDER BY id').all().map(row => ({ ...row }));
    db.close();
  });
  const migrated = f.db.prepare('SELECT * FROM codes ORDER BY id').all();
  assert.deepEqual(migrated.map(row => row.device_limit), [1, 999, 1, 1, 1, 1, 1]);
  assert.deepEqual(migrated.map(({ days, device_limit, ...row }) => row), previous);
  f.db.prepare('UPDATE codes SET device_limit=7 WHERE id=1').run();
  await f.restart();
  assert.equal(f.db.prepare('SELECT device_limit FROM codes WHERE id=1').get().device_limit, 7);
  assert.deepEqual(f.db.prepare('SELECT shops FROM codes ORDER BY id').all().map(row => row.shops), values);
});

test('new computer-count input and legacy shops alias are accepted only as matching integers in range', async t => {
  const f = await fixture(t);
  for (const value of [0, -1, 1000, 1.5, '1', null, true]) {
    assert.equal((await f.issue({ days: 1, deviceLimit: value })).status, 400);
    assert.equal((await f.issue({ days: 1, deviceLimit: 2, shops: value })).status, 400);
    assert.equal((await f.issue({ days: 1, deviceLimit: value, shops: 2 })).status, 400);
  }
  assert.equal((await f.issue({ days: 1, deviceLimit: 2, shops: 3 })).status, 400);
  assert.equal((await f.issue({ days: 1 })).status, 400);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM codes').get().n, 0);
  for (const data of [{ deviceLimit: 1 }, { deviceLimit: 999 }, { shops: 4 }, { deviceLimit: 5, shops: 5 }]) {
    const result = await f.issue({ days: 1, ...data }); assert.equal(result.status, 200);
    const row = f.db.prepare('SELECT device_limit,shops FROM codes WHERE id=?').get(result.body.id);
    assert.equal(row.device_limit, data.deviceLimit ?? data.shops); assert.equal(row.shops, row.device_limit);
  }
});

test('custom codes normalize case, conflict permanently after issue, revoke or redemption and support a single-item response', async t => {
  const f = await fixture(t), auth = await f.user();
  const spec = { days: 15, deviceLimit: 1, mode: 'custom', customCode: '  vip_customer-2028  ' };
  const created = await f.issue(spec);
  assert.equal(created.status, 200);
  assert.equal(created.body.code, 'VIP_CUSTOMER-2028');
  assert.deepEqual(created.body.codes, [{ id: created.body.id, code: 'VIP_CUSTOMER-2028' }]);
  assert.equal((await f.issue({ ...spec, customCode: 'Vip_Customer-2028' })).status, 409);
  assert.equal((await f.api('/v1/redeem', { code: ' vip_customer-2028 ' }, { auth })).status, 200);
  assert.equal((await f.issue(spec)).status, 409);
  const revoked = await f.issue({ months: 12, shops: 1, mode: 'custom', customCode: 'REVOKED-2028' });
  assert.equal(revoked.status, 200);
  assert.equal((await f.api('/v1/admin/revoke-code', { id: revoked.body.id }, { admin: true })).status, 200);
  assert.equal((await f.issue({ days: 9, shops: 2, mode: 'custom', customCode: 'revoked-2028' })).status, 409);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM codes').get().n, 2);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM audit WHERE action='issue-code'").get().n, 2);
});

test('batch insertion failure rolls back every newly inserted code and issuance audit record', async t => {
  const f = await fixture(t);
  assert.equal((await f.issue({ days: 2, shops: 1 })).status, 200);
  const before = JSON.stringify(f.db.prepare('SELECT * FROM codes').all());
  const audits = JSON.stringify(f.db.prepare("SELECT * FROM audit WHERE action='issue-code'").all());
  f.db.exec(`CREATE TRIGGER fail_third_code BEFORE INSERT ON codes WHEN NEW.days=33 AND (SELECT COUNT(*) FROM codes)>=3 BEGIN SELECT RAISE(ABORT, 'isolated atomicity test'); END;`);
  assert.equal((await f.issue({ days: 33, shops: 1, count: 5 })).status, 500);
  assert.equal(JSON.stringify(f.db.prepare('SELECT * FROM codes').all()), before);
  assert.equal(JSON.stringify(f.db.prepare("SELECT * FROM audit WHERE action='issue-code'").all()), audits);
  f.db.exec('DROP TRIGGER fail_third_code');
  assert.equal((await f.issue({ days: 33, shops: 1, count: 5 })).body.count, 5);
});

test('issuance validates every range, shape and mode while preserving administrator authentication and CSRF checks', async t => {
  const f = await fixture(t);
  assert.equal((await f.api('/v1/admin/codes', { days: 1, shops: 1 })).status, 401);
  assert.equal((await f.api('/v1/admin/codes', { days: 1, shops: 1 }, { admin: true, csrf: false })).status, 403);
  const valid = { days: 1, shops: 1 };
  const invalid = [
    {}, { shops: 1 }, { ...valid, months: 1 }, { months: 0, shops: 1 }, { months: 2, shops: 1 }, { months: '1', shops: 1 },
    ...[0, -1, 3651, 1.5, '2', null, true].map(days => ({ ...valid, days })),
    ...[0, 1000, 1.5, '1', null].map(shops => ({ ...valid, shops })),
    ...[0, 101, -1, 1.5, '1', null].map(count => ({ ...valid, count })),
    { ...valid, mode: 'CUSTOM' }, { ...valid, mode: null }, { ...valid, extra: 1 },
    { ...valid, customCode: 'RANDOM-2028' }, { ...valid, mode: 'random', customCode: '' },
    { ...valid, mode: 'custom' }, { ...valid, mode: 'custom', customCode: 12345678 },
    ...['short', 'x'.repeat(65), 'BAD SPACE-2028', '中文授权码2028', 'BAD/CODE2028', 'BAD.CODE2028', 'BAD\nCODE2028', 'ßßßß'].map(customCode => ({ ...valid, mode: 'custom', customCode })),
    { ...valid, mode: 'custom', customCode: 'COUNT-2028', count: 2 }
  ];
  for (const body of invalid) assert.equal((await f.issue(body)).status, 400, JSON.stringify(body));
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM codes').get().n, 0);
  assert.equal((await f.issue({ days: 3650, shops: 999, mode: 'custom', customCode: 'A'.repeat(64) })).status, 200);
  assert.equal((await f.issue({ days: 1, shops: 1, mode: 'custom', customCode: 'A_123456' })).status, 200);
});

test('daily packages use exact 24-hour units, preserve computer limits during renewal and redeem once under concurrency', async t => {
  const f = await fixture(t), auth = await f.user();
  const first = (await f.issue({ days: 7, deviceLimit: 2 })).body;
  const responses = await Promise.all([f.api('/v1/redeem', { code: first.code }, { auth }), f.api('/v1/redeem', { code: first.code }, { auth })]);
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
  const initialExpiry = f.time() + 7 * DAY;
  assert.equal(responses.find(response => response.status === 200).body.user.expiresAt, initialExpiry);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM audit WHERE action='redeem'").get().n, 1);
  f.db.prepare('UPDATE users SET shops=97 WHERE id=?').run(auth.id);
  const renewal = (await f.issue({ days: 31, deviceLimit: 2 })).body;
  const renewed = await f.api('/v1/redeem', { code: renewal.code }, { auth });
  assert.equal(renewed.status, 200);
  assert.equal(renewed.body.user.expiresAt, initialExpiry + 31 * DAY);
  assert.equal(renewed.body.user.deviceLimit, 2);
  assert.equal(f.db.prepare('SELECT shops FROM users WHERE id=?').get(auth.id).shops, 97);
  const wrongLimit = (await f.issue({ days: 10, deviceLimit: 5 })).body;
  assert.equal((await f.api('/v1/redeem', { code: wrongLimit.code }, { auth })).status, 409);
  assert.equal(f.db.prepare('SELECT used_by FROM codes WHERE id=?').get(wrongLimit.id).used_by, null);
  f.db.prepare('UPDATE users SET expires=? WHERE id=?').run(f.time() - DAY, auth.id);
  const restarted = await f.api('/v1/redeem', { code: wrongLimit.code }, { auth });
  assert.equal(restarted.body.user.expiresAt, f.time() + 10 * DAY);
  assert.equal(restarted.body.user.deviceLimit, 5);
  assert.equal(restarted.body.user.shopUnlimited, true); assert.equal(restarted.body.user.shopLimit, null);
});

test('daily code revocation, redemption deadlines and mixed daily/calendar renewals keep existing authorization rules', async t => {
  const f = await fixture(t), auth = await f.user();
  const revoked = (await f.issue({ days: 9, shops: 1 })).body;
  assert.equal((await f.api('/v1/admin/revoke-code', { id: revoked.id }, { admin: true })).status, 200);
  assert.equal((await f.api('/v1/redeem', { code: revoked.code }, { auth })).status, 400);
  const expired = (await f.issue({ days: 9, shops: 1 })).body;
  f.db.prepare('UPDATE codes SET expires=? WHERE id=?').run(f.time(), expired.id);
  assert.equal((await f.api('/v1/redeem', { code: expired.code }, { auth })).status, 400);
  assert.equal(f.db.prepare('SELECT expires FROM users WHERE id=?').get(auth.id).expires, 0);
  const monthly = (await f.issue({ months: 1, shops: 1 })).body;
  const monthResult = await f.api('/v1/redeem', { code: monthly.code }, { auth });
  const monthExpiry = addMonths(f.time(), 1);
  assert.equal(monthResult.body.user.expiresAt, monthExpiry);
  const daily = (await f.issue({ days: 1, shops: 1 })).body;
  assert.equal((await f.api('/v1/redeem', { code: daily.code }, { auth })).body.user.expiresAt, monthExpiry + DAY);
  const yearly = (await f.issue({ months: 12, shops: 1 })).body;
  assert.equal((await f.api('/v1/redeem', { code: yearly.code }, { auth })).body.user.expiresAt, addMonths(monthExpiry + DAY, 12));
});

test('two different accounts racing for one custom daily code grant only the winning account', async t => {
  const f = await fixture(t), first = await f.user('first_customer'), second = await f.user('second_customer');
  const code = (await f.issue({ days: 90, deviceLimit: 4, mode: 'custom', customCode: 'ONE-OWNER-2028' })).body;
  const responses = await Promise.all([first, second].map(auth => f.api('/v1/redeem', { code: code.code }, { auth })));
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
  const owner = [first, second][responses.findIndex(response => response.status === 200)];
  const stored = f.db.prepare('SELECT used_by,used_at FROM codes WHERE id=?').get(code.id);
  assert.equal(stored.used_by, owner.id);
  assert.equal(stored.used_at, f.time());
  for (const auth of [first, second]) {
    const account = f.db.prepare('SELECT expires,shops,device_limit FROM users WHERE id=?').get(auth.id);
    assert.equal(account.expires, auth.id === owner.id ? f.time() + 90 * DAY : 0);
    assert.equal(account.device_limit, auth.id === owner.id ? 4 : 1);
    assert.equal(account.shops, 0, 'redemption must preserve the historical shops column');
  }
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM audit WHERE action='redeem'").get().n, 1);
});
