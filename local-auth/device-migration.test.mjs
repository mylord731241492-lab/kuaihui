import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { generateKeyPairSync, randomBytes, scryptSync, sign } from 'node:crypto';
import { createService, hash } from './server.mjs';
import { initializeKey, makeBackup, restoreBackup } from './ops.mjs';

const password = 'Isolated-device-migration-2026';
const oldToken = 'isolated-valid-legacy-token';
const expiredToken = 'isolated-expired-legacy-token';
const historicalLimits = [3, 1, 999, 0, -1, 1000, 1.5, 'invalid'];
const expectedLimits = [3, 1, 999, 1, 1, 1, 1, 1];
const rows = (db, table) => db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all().map(row => ({ ...row }));
const columns = (db, table) => db.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name);

function legacyDatabase(directory, time, { existingDeviceTable = false } = {}) {
  fs.mkdirSync(directory, { recursive: true });
  const db = new DatabaseSync(path.join(directory, 'accounts.sqlite'));
  const pair = generateKeyPairSync('ed25519');
  const publicKey = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const salt = randomBytes(32).toString('base64url'), passwordHash = scryptSync(password, salt, 64).toString('hex');
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT UNIQUE NOT NULL,salt TEXT NOT NULL,password_hash TEXT NOT NULL,public_key TEXT,disabled INTEGER NOT NULL DEFAULT 0,expires INTEGER NOT NULL DEFAULT 0,shops INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL);
    CREATE TABLE sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),public_key TEXT NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE codes(id INTEGER PRIMARY KEY,code_hash TEXT UNIQUE NOT NULL,hint TEXT NOT NULL,months INTEGER NOT NULL,shops INTEGER NOT NULL,expires INTEGER NOT NULL,used_by INTEGER REFERENCES users(id),used_at INTEGER,revoked INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL);
    CREATE TABLE audit(id INTEGER PRIMARY KEY,action TEXT NOT NULL,user_id INTEGER,code_id INTEGER,created INTEGER NOT NULL);`);
  const insertUser = db.prepare('INSERT INTO users(id,username,salt,password_hash,public_key,disabled,expires,shops,created) VALUES(?,?,?,?,?,?,?,?,?)');
  const insertCode = db.prepare('INSERT INTO codes(id,code_hash,hint,months,shops,expires,used_by,used_at,revoked,created) VALUES(?,?,?,?,?,?,?,?,?,?)');
  for (const [index, limit] of historicalLimits.entries()) {
    const id = index + 1;
    insertUser.run(id, 'legacy_device_' + id, salt, passwordHash, id === 1 ? publicKey : null, id === 2 ? 1 : 0,
      id % 2 ? time + 86400000 : 0, limit, time - 86400000 - id);
    insertCode.run(id, hash('LEGACY-DEVICE-CODE-' + id), 'CODE-' + id, id % 2 ? 1 : 12, limit,
      time + 86400000, id === 1 ? 1 : null, id === 1 ? time - 500 : null, id === 3 ? 1 : 0, time - 86400000);
  }
  db.prepare('INSERT INTO sessions(token_hash,user_id,public_key,expires) VALUES(?,?,?,?)').run(hash(oldToken), 1, publicKey, time + 3600000);
  db.prepare('INSERT INTO sessions(token_hash,user_id,public_key,expires) VALUES(?,?,?,?)').run(hash(expiredToken), 1, publicKey, time);
  db.prepare('INSERT INTO audit(action,user_id,code_id,created) VALUES(?,?,?,?)').run('redeem', 1, 1, time - 500);
  if (existingDeviceTable) db.exec('CREATE TABLE devices(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id),public_key TEXT NOT NULL,name TEXT NOT NULL,created INTEGER NOT NULL,last_login INTEGER NOT NULL,UNIQUE(user_id,public_key))');
  const previous = { users: rows(db, 'users'), sessions: rows(db, 'sessions'), codes: rows(db, 'codes'), audit: rows(db, 'audit') };
  db.close();
  return { pair, publicKey, previous };
}

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'juhe-device-migration-'));
  const active = new Set(), transport = globalThis.fetch;
  let time = 1810000000000;
  globalThis.fetch = (url, options) => {
    if (String(url).startsWith('http://127.0.0.1:')) return transport(url, options);
    throw Error('External network forbidden in device migration tests');
  };
  t.after(async () => {
    for (const instance of active) await new Promise(resolve => instance.server.close(resolve));
    globalThis.fetch = transport;
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  async function start(dataDir) {
    const service = createService({ dataDir, now: () => time, publicOrigin: '', legacyAdminEnabled: false,
      testMode: true, testSmsAdapter: { configured: false, async send() { throw Error('SMS forbidden in migration tests'); } } });
    await new Promise(resolve => service.server.listen(0, '127.0.0.1', resolve));
    active.add(service);
    const base = 'http://127.0.0.1:' + service.server.address().port;
    async function request(route, data, auth) {
      const method = data === undefined ? 'GET' : 'POST', raw = data === undefined ? '' : JSON.stringify(data);
      const headers = { 'Content-Type': 'application/json' };
      if (auth) {
        const stamp = String(time), nonce = randomBytes(24).toString('hex');
        Object.assign(headers, { Authorization: 'Bearer ' + auth.token, 'X-Time': stamp, 'X-Nonce': nonce,
          'X-Signature': sign(null, Buffer.from([method, route, stamp, nonce, hash(raw)].join('\n')), auth.privateKey).toString('base64') });
      }
      const response = await transport(base + route, { method, headers, ...(data === undefined ? {} : { body: raw }) });
      return { status: response.status, body: await response.json() };
    }
    async function login() {
      const pair = generateKeyPairSync('ed25519'), publicKey = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
      const challenge = await request('/v1/challenge', { publicKey });
      assert.equal(challenge.status, 200);
      return request('/v1/login', { username: 'legacy_device_1', password, challenge: challenge.body.challenge,
        signature: sign(null, Buffer.from(challenge.body.challenge), pair.privateKey).toString('base64') });
    }
    return { ...service, request, login, async stop() { await new Promise(resolve => service.server.close(resolve)); active.delete(service); } };
  }
  return { directory, start, now: () => time, advance: value => { time += value; } };
}

function assertHistoricalRows(db, previous, { restored = false } = {}) {
  assert.deepEqual(rows(db, 'users').map(({ device_limit, phone, ...row }) => row), previous.users);
  assert.deepEqual(rows(db, 'codes').map(({ device_limit, days, ...row }) => row), previous.codes.map(row => restored && row.used_by === null ? { ...row, revoked: 1 } : row));
  assert.deepEqual(rows(db, 'audit'), previous.audit);
  assert.deepEqual(rows(db, 'users').map(row => row.device_limit), expectedLimits);
  assert.deepEqual(rows(db, 'codes').map(row => row.device_limit), expectedLimits);
}

test('legacy device migration preserves users and licenses, grants valid old sessions a heartbeat and accepts signed old tokens', async t => {
  const f = await fixture(t), dataDir = path.join(f.directory, 'legacy');
  const legacy = legacyDatabase(dataDir, f.now()), startedAt = f.now(), service = await f.start(dataDir);
  assertHistoricalRows(service.db, legacy.previous);
  const sessions = rows(service.db, 'sessions');
  assert.deepEqual(sessions.map(({ last_seen, ...row }) => row), legacy.previous.sessions);
  assert.equal(sessions.find(row => row.token_hash === hash(oldToken)).last_seen, startedAt);
  assert.equal(sessions.find(row => row.token_hash === hash(expiredToken)).last_seen, 0);
  assert.equal(rows(service.db, 'devices').length, 1);
  assert.equal(rows(service.db, 'devices')[0].public_key, legacy.publicKey);
  const auth = { token: oldToken, privateKey: legacy.pair.privateKey };
  f.advance(1200);
  const account = await service.request('/v1/me', undefined, auth);
  assert.equal(account.status, 200); assert.equal(account.body.user.deviceLimit, 3);
  assert.equal(account.body.user.shopUnlimited, true); assert.equal(account.body.user.shopLimit, null);
  assert.equal(account.body.user.username, 'legacy_device_1'); assert.equal(account.body.user.expiresAt, legacy.previous.users[0].expires);
  assert.equal((await service.request('/v1/me', undefined, { ...auth, token: expiredToken })).status, 401);
  const lastSeen = service.db.prepare('SELECT last_seen FROM sessions WHERE token_hash=?').get(hash(oldToken)).last_seen;
  assert.equal(lastSeen, f.now());
  await service.stop(); f.advance(10000);
  const restarted = await f.start(dataDir);
  assert.equal(restarted.db.prepare('SELECT last_seen FROM sessions WHERE token_hash=?').get(hash(oldToken)).last_seen, lastSeen, 'restart must not renew existing leases');
  assert.equal(columns(restarted.db, 'users').filter(name => name === 'device_limit').length, 1);
  assert.equal(columns(restarted.db, 'sessions').filter(name => name === 'last_seen').length, 1);
  assert.equal(columns(restarted.db, 'codes').filter(name => name === 'device_limit').length, 1);
});

test('restart preserves edited computer limits and does not recreate an unbound device from a stale legacy pointer', async t => {
  const f = await fixture(t), dataDir = path.join(f.directory, 'legacy');
  const legacy = legacyDatabase(dataDir, f.now()), service = await f.start(dataDir);
  const auth = { token: oldToken, privateKey: legacy.pair.privateKey };
  const deviceId = service.db.prepare('SELECT id FROM devices WHERE user_id=1').get().id;
  const unbound = await service.request('/v1/devices/unbind', { id: deviceId }, auth);
  assert.equal(unbound.status, 200); assert.equal(unbound.body.loggedOut, true);
  // Historical databases can retain the old single-device pointer even after a
  // device was removed. The existing devices table is the source of truth.
  service.db.prepare('UPDATE users SET device_limit=7,public_key=? WHERE id=1').run(legacy.publicKey);
  service.db.prepare('UPDATE codes SET device_limit=9 WHERE id=1').run();
  await service.stop(); f.advance(10000);
  const restarted = await f.start(dataDir);
  assert.equal(restarted.db.prepare('SELECT device_limit FROM users WHERE id=1').get().device_limit, 7);
  assert.equal(restarted.db.prepare('SELECT device_limit FROM codes WHERE id=1').get().device_limit, 9);
  assert.equal(restarted.db.prepare('SELECT shops FROM users WHERE id=1').get().shops, 3);
  assert.equal(restarted.db.prepare('SELECT shops FROM codes WHERE id=1').get().shops, 3);
  assert.equal(restarted.db.prepare('SELECT COUNT(*) AS n FROM devices WHERE user_id=1').get().n, 0);
  assert.equal(restarted.db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id=1').get().n, 0);
  assert.equal((await restarted.request('/v1/me', undefined, auth)).status, 401);
});

test('an existing empty device table is not repopulated from a historical users.public_key during upgrade', async t => {
  const f = await fixture(t), dataDir = path.join(f.directory, 'legacy');
  const legacy = legacyDatabase(dataDir, f.now(), { existingDeviceTable: true }), service = await f.start(dataDir);
  assert.equal(service.db.prepare('SELECT COUNT(*) AS n FROM devices').get().n, 0);
  assert.equal((await service.request('/v1/me', undefined, { token: oldToken, privateKey: legacy.pair.privateKey })).status, 401);
  assert.equal(service.db.prepare('SELECT public_key FROM users WHERE id=1').get().public_key, legacy.publicKey);
});

test('new backups retain computer limits and heartbeat schema while restore clears every login session', async t => {
  const f = await fixture(t), dataDir = path.join(f.directory, 'live');
  const legacy = legacyDatabase(dataDir, f.now()), service = await f.start(dataDir);
  service.db.prepare('UPDATE users SET device_limit=8 WHERE id=1').run();
  service.db.prepare('UPDATE codes SET device_limit=6 WHERE id=1').run();
  service.db.prepare('INSERT INTO administrators(id,username,salt,password_hash,created) VALUES(?,?,?,?,?)').run(1, 'legacy_admin', 'isolated-salt', 'isolated-hash', f.now());
  service.db.prepare('INSERT INTO admin_sessions(token_hash,admin_id,expires) VALUES(?,?,?)').run(hash('isolated-admin-token'), 1, f.now() + 3600000);
  service.db.prepare('INSERT INTO challenges(id,public_key,expires) VALUES(?,?,?)').run('isolated-challenge', legacy.publicKey, f.now() + 60000);
  service.db.prepare('INSERT INTO nonces(id,expires) VALUES(?,?)').run('isolated-nonce', f.now() + 60000);
  const snapshot = Object.fromEntries(['users', 'codes', 'devices', 'sessions', 'admin_sessions', 'challenges', 'nonces'].map(table => [table, rows(service.db, table)]));
  const keyFile = path.join(f.directory, 'backup.key'), backups = path.join(f.directory, 'backups'), restoredDir = path.join(f.directory, 'restored');
  initializeKey(keyFile);
  const backup = await makeBackup({ source: path.join(dataDir, 'accounts.sqlite'), directory: backups, keyFile });
  assert.deepEqual(await restoreBackup({ file: path.join(backups, backup.file), directory: restoredDir, keyFile }), { restored: true, requireLogin: true });
  const restoredDb = new DatabaseSync(path.join(restoredDir, 'accounts.sqlite'), { readOnly: true });
  try {
    assert(columns(restoredDb, 'users').includes('device_limit')); assert(columns(restoredDb, 'codes').includes('device_limit'));
    assert(columns(restoredDb, 'sessions').includes('last_seen'));
    assert.deepEqual(rows(restoredDb, 'users'), snapshot.users); assert.deepEqual(rows(restoredDb, 'devices'), snapshot.devices);
    assert.deepEqual(rows(restoredDb, 'codes'), snapshot.codes.map(row => row.used_by === null ? { ...row, revoked: 1 } : row));
    for (const table of ['sessions', 'admin_sessions', 'challenges', 'nonces']) assert.equal(rows(restoredDb, table).length, 0, table);
  } finally { restoredDb.close(); }
  for (const [table, before] of Object.entries(snapshot)) assert.deepEqual(rows(service.db, table), before, 'backup and restore cannot modify live ' + table);
  const restored = await f.start(restoredDir);
  assert.equal((await restored.request('/v1/me', undefined, { token: oldToken, privateKey: legacy.pair.privateKey })).status, 401);
  const login = await restored.login(); assert.equal(login.status, 200); assert.equal(login.body.user.deviceLimit, 8);
  assert.equal(restored.db.prepare('SELECT device_limit FROM codes WHERE id=1').get().device_limit, 6);
});

test('restoring a pre-upgrade backup migrates missing limit and heartbeat columns without restoring legacy tokens', async t => {
  const f = await fixture(t), dataDir = path.join(f.directory, 'old-backup-source');
  const legacy = legacyDatabase(dataDir, f.now());
  const keyFile = path.join(f.directory, 'old-backup.key'), backups = path.join(f.directory, 'backups'), restoredDir = path.join(f.directory, 'restored');
  initializeKey(keyFile);
  const backup = await makeBackup({ source: path.join(dataDir, 'accounts.sqlite'), directory: backups, keyFile });
  await restoreBackup({ file: path.join(backups, backup.file), directory: restoredDir, keyFile });
  const beforeMigration = new DatabaseSync(path.join(restoredDir, 'accounts.sqlite'), { readOnly: true });
  try {
    assert.equal(columns(beforeMigration, 'users').includes('device_limit'), false);
    assert.equal(columns(beforeMigration, 'codes').includes('device_limit'), false);
    assert.equal(columns(beforeMigration, 'sessions').includes('last_seen'), false);
    assert.equal(rows(beforeMigration, 'sessions').length, 0);
  } finally { beforeMigration.close(); }
  const restored = await f.start(restoredDir);
  assertHistoricalRows(restored.db, legacy.previous, { restored: true });
  assert(columns(restored.db, 'sessions').includes('last_seen')); assert.equal(rows(restored.db, 'sessions').length, 0);
  assert.equal((await restored.request('/v1/me', undefined, { token: oldToken, privateKey: legacy.pair.privateKey })).status, 401);
  const login = await restored.login(); assert.equal(login.status, 200); assert.equal(login.body.user.deviceLimit, 3);
  const source = new DatabaseSync(path.join(dataDir, 'accounts.sqlite'), { readOnly: true });
  try {
    assert.equal(columns(source, 'users').includes('device_limit'), false);
    assert.deepEqual(rows(source, 'users'), legacy.previous.users); assert.deepEqual(rows(source, 'codes'), legacy.previous.codes);
    assert.deepEqual(rows(source, 'sessions'), legacy.previous.sessions);
  } finally { source.close(); }
});
