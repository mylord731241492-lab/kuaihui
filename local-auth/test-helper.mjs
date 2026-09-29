import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';

// Test fixtures only: seed a historical account in the caller's isolated database.
// Production registration remains reachable only through the phone verification API.
export function seedLegacyAccount(db, { username, password, created = Date.now(), phone = null, deviceLimit = 1 }) {
  assert.equal(typeof username, 'string');
  assert.equal(typeof password, 'string');
  const salt = randomBytes(32).toString('base64url');
  const digest = scryptSync(password, salt, 64).toString('hex');
  const result = db.prepare('INSERT INTO users(username,phone,salt,password_hash,created,device_limit) VALUES(?,?,?,?,?,?)')
    .run(username, phone, salt, digest, created, deviceLimit);
  return Number(result.lastInsertRowid);
}
