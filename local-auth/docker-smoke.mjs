import { execFileSync } from 'node:child_process';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { hash } from './server.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const compose = (...args) => execFileSync('docker', ['compose', '-f', path.join(root, 'compose.yaml'), ...args], { encoding: 'utf8', timeout: 60_000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const base = 'http://127.0.0.1:47832';
const report = { at: new Date().toISOString(), checks: [] };
let adminKey;
async function ready() {
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(base + '/health', { signal: AbortSignal.timeout(1000) }); if (r.ok && (await r.json()).service === 'juhe-local-auth') return; } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw Error('Container did not become healthy');
}
async function api(route, data, auth, admin = false) {
  const method = data === undefined ? 'GET' : 'POST', raw = data === undefined ? '' : JSON.stringify(data);
  const headers = { 'Content-Type': 'application/json' };
  if (admin) headers.Authorization = `Bearer ${adminKey}`;
  if (auth) {
    const stamp = String(Date.now()), nonce = randomBytes(24).toString('hex');
    Object.assign(headers, { Authorization: `Bearer ${auth.token}`, 'X-Time': stamp, 'X-Nonce': nonce, 'X-Signature': sign(null, Buffer.from([method, route, stamp, nonce, hash(raw)].join('\n')), auth.privateKey).toString('base64') });
  }
  const res = await fetch(base + route, { method, headers, body: data === undefined ? undefined : raw, signal: AbortSignal.timeout(8000) });
  return { status: res.status, data: await res.json() };
}
const device = () => { const p = generateKeyPairSync('ed25519'); return { privateKey: p.privateKey, publicKey: p.publicKey.export({ type: 'spki', format: 'pem' }).toString() }; };
const username = 'docker_' + Date.now(), password = randomBytes(20).toString('base64url');
async function login(d) {
  const c = await api('/v1/challenge', { publicKey: d.publicKey }); assert.equal(c.status, 200);
  const r = await api('/v1/login', { username, password, challenge: c.data.challenge, signature: sign(null, Buffer.from(c.data.challenge), d.privateKey).toString('base64') });
  if (r.data.token) d.token = r.data.token; return r;
}
try {
  await ready();
  adminKey = compose('exec', '-T', 'auth', 'node', '-e', "process.stdout.write(require('node:fs').readFileSync('/data/admin-key.txt','utf8'))");
  for (const route of ['/client', '/admin', '/logo.png', '/style.css', '/client.js', '/admin.js']) {
    const r = await fetch(base + route); assert.equal(r.status, 200, route); assert((await r.arrayBuffer()).byteLength > 0);
  }
  report.checks.push('host port and all page assets accessible');
  assert.equal((await api('/v1/admin/state')).status, 401);
  assert.equal((await api('/v1/register', { username, password })).status, 200);
  const first = device(), second = device();
  const attempts = await Promise.all([login(first), login(second)]);
  assert.deepEqual(attempts.map(r => r.status).sort(), [200, 403]);
  const winner = attempts[0].status === 200 ? first : second, other = winner === first ? second : first;
  report.checks.push('concurrent first login binds exactly one device');
  const c = await api('/v1/admin/codes', { months: 1, shops: 3 }, null, true); assert.equal(c.status, 200);
  const results = await Promise.all(Array.from({ length: 10 }, () => api('/v1/redeem', { code: c.data.code }, winner)));
  assert.equal(results.filter(r => r.status === 200).length, 1); assert.equal(results.filter(r => r.status === 409).length, 9);
  const user = results.find(r => r.status === 200).data.user;
  report.checks.push('ten concurrent redemptions grant once');
  const renewal = await api('/v1/admin/codes', { months: 12, shops: 3 }, null, true);
  const renewed = await api('/v1/redeem', { code: renewal.data.code }, winner); assert.equal(renewed.status, 200); assert(renewed.data.user.expiresAt > user.expiresAt);
  report.checks.push('annual renewal retains remaining time');
  compose('restart', 'auth'); await ready();
  assert.equal((await api('/v1/me', undefined, winner)).data.user.expiresAt, renewed.data.user.expiresAt);
  assert.equal(compose('exec', '-T', 'auth', 'node', '-e', "process.stdout.write(require('node:fs').readFileSync('/data/admin-key.txt','utf8'))"), adminKey);
  report.checks.push('normal container restart persists session, entitlement and admin key');
  compose('kill', '-s', 'SIGKILL', 'auth'); compose('up', '-d', 'auth'); await ready();
  assert.equal((await api('/v1/me', undefined, winner)).data.user.expiresAt, renewed.data.user.expiresAt);
  report.checks.push('forced process termination preserves committed entitlement');
  compose('up', '-d', '--force-recreate', 'auth'); await ready();
  assert.equal((await api('/v1/me', undefined, winner)).data.user.expiresAt, renewed.data.user.expiresAt);
  report.checks.push('container recreation keeps named-volume data');
  const restored = JSON.parse(compose('exec', '-T', 'auth', 'node', '--input-type=module', '-e',
    "import {DatabaseSync,backup} from 'node:sqlite'; const db=new DatabaseSync('/data/accounts.sqlite'); await backup(db,'/tmp/restore-check.sqlite'); const restored=new DatabaseSync('/tmp/restore-check.sqlite'); console.log(JSON.stringify({integrity:restored.prepare('PRAGMA integrity_check').get().integrity_check,users:restored.prepare('SELECT count(*) n FROM users').get().n,grants:restored.prepare(\"SELECT count(*) n FROM audit WHERE action='redeem'\").get().n}));restored.close();db.close();"));
  assert.equal(restored.integrity, 'ok'); assert(restored.users >= 1 && restored.grants >= 2);
  report.checks.push('SQLite online snapshot opens with integrity_check=ok');
  assert.equal((await api('/v1/admin/reset-device', { id: user.id }, null, true)).status, 200);
  assert.equal((await api('/v1/me', undefined, winner)).status, 401); assert.equal((await login(other)).status, 200);
  report.checks.push('device reset revokes sessions and allows another key');
  const samples = await Promise.all(Array.from({ length: 40 }, async () => {
    const start = performance.now(); const result = await api('/v1/me', undefined, other); assert.equal(result.status, 200); return performance.now() - start;
  }));
  samples.sort((a, b) => a - b);
  report.concurrentReads = { count: 40, p95Ms: Math.round(samples[Math.ceil(samples.length * 0.95) - 1]), maxMs: Math.round(samples.at(-1)) };
  report.checks.push('forty concurrent signed entitlement reads succeed');
  await api('/v1/admin/disable', { id: user.id }, null, true);
  assert.equal((await api('/v1/me', undefined, other)).status, 401);
  report.checks.push('disabled account cannot use existing session');
  report.passed = true;
} catch (e) { report.error = e.message; process.exitCode = 1; }
finally { writeFileSync(path.join(root, '../../acceptance/docker-auth-results.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2)); }
