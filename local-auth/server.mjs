import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash, scrypt, timingSafeEqual, createPublicKey, verify } from 'node:crypto';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCompatibility } from './compat.mjs';
import { createAccountSecurity } from './account-security.mjs';
import { createAdminUsers } from './admin-users.mjs';
import { createLicenseCodes } from './license-codes.mjs';
import { handleRelease } from './releases.mjs';
import { isIP } from 'node:net';
import { DEVICE_HEARTBEAT_MS, deviceLimitFor } from './device-policy.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const slowHash = promisify(scrypt);
export const hash = value => createHash('sha256').update(value).digest('hex');
const random = () => randomBytes(32).toString('base64url');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
export function addMonths(time, months) {
  const d = new Date(time), day = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last)); return d.getTime();
}
function canonicalKey(pem) {
  try {
    const key = createPublicKey(pem);
    if (key.asymmetricKeyType !== 'ed25519') fail(400, '设备密钥格式不正确');
    return key.export({ type: 'spki', format: 'pem' }).toString();
  } catch { fail(400, '设备密钥格式不正确'); }
}
export function createService({ dataDir = path.join(root, 'data'), now = Date.now, logoFile = path.join(root, '../app-asar/dist/assets/juhe-logo-mark.png'), publicOrigin = process.env.JUHE_PUBLIC_ORIGIN || '', legacyAdminEnabled = process.env.JUHE_ALLOW_LEGACY_ADMIN_KEY === '1', testSmsAdapter = null, testMode = false } = {}) {
  if(publicOrigin) {const p=new URL(publicOrigin);if(p.protocol!=='https:'||p.origin!==publicOrigin||p.username||p.password)throw Error('JUHE_PUBLIC_ORIGIN must be an exact HTTPS origin');}
  if(publicOrigin&&legacyAdminEnabled)throw Error('Legacy admin key is forbidden for public deployment');
  if(publicOrigin&&process.env.NODE_ENV==='production'&&String(process.env.JUHE_PROXY_SECRET||'').length<32)throw Error('Public production deployment requires JUHE_PROXY_SECRET with at least 32 characters');
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const adminFile = path.join(dataDir, 'admin-key.txt');
  if (!fs.existsSync(adminFile)) fs.writeFileSync(adminFile, random(), { mode: 0o600, flag: 'wx' });
  const adminKey = fs.readFileSync(adminFile, 'utf8').trim();
  const db = new DatabaseSync(path.join(dataDir, 'accounts.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS health_write_probe(id INTEGER PRIMARY KEY, checked INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, password_hash TEXT NOT NULL, public_key TEXT, disabled INTEGER NOT NULL DEFAULT 0, expires INTEGER NOT NULL DEFAULT 0, shops INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), public_key TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS challenges(id TEXT PRIMARY KEY, public_key TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS nonces(id TEXT PRIMARY KEY, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS codes(id INTEGER PRIMARY KEY, code_hash TEXT UNIQUE NOT NULL, hint TEXT NOT NULL, months INTEGER NOT NULL, shops INTEGER NOT NULL, expires INTEGER NOT NULL, used_by INTEGER REFERENCES users(id), used_at INTEGER, revoked INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, action TEXT NOT NULL, user_id INTEGER, code_id INTEGER, created INTEGER NOT NULL);`);
  if(!db.prepare('PRAGMA table_info(users)').all().some(column=>column.name==='device_limit')){
    db.exec('BEGIN IMMEDIATE');try{db.exec('ALTER TABLE users ADD COLUMN device_limit INTEGER NOT NULL DEFAULT 1');db.exec("UPDATE users SET device_limit=CASE WHEN typeof(shops)='integer' AND shops BETWEEN 1 AND 999 THEN shops ELSE 1 END");db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
  }
  if(!db.prepare('PRAGMA table_info(sessions)').all().some(column=>column.name==='last_seen')){
    db.exec('BEGIN IMMEDIATE');try{db.exec('ALTER TABLE sessions ADD COLUMN last_seen INTEGER NOT NULL DEFAULT 0');db.prepare('UPDATE sessions SET last_seen=? WHERE expires>?').run(now(),now());db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
  }
  const hadDevices=!!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='devices'").get();
  db.exec('CREATE TABLE IF NOT EXISTS devices(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id), public_key TEXT NOT NULL, name TEXT NOT NULL, created INTEGER NOT NULL, last_login INTEGER NOT NULL, UNIQUE(user_id,public_key))');
  if(!hadDevices)db.exec("INSERT OR IGNORE INTO devices(user_id,public_key,name,created,last_login) SELECT id,public_key,'原绑定电脑',created,created FROM users WHERE public_key IS NOT NULL");
  db.exec('CREATE INDEX IF NOT EXISTS sessions_online_devices ON sessions(user_id,expires,last_seen,public_key)');
  const transaction = fn => { db.exec('BEGIN IMMEDIATE'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } };
  const compatibility = createCompatibility(db, now);
  const audit = (action, user = null, code = null) => db.prepare('INSERT INTO audit(action,user_id,code_id,created) VALUES(?,?,?,?)').run(action, user, code, now());
  const licenseCodes = createLicenseCodes({ db, now, hash, transaction, audit, addMonths });
  const entitlement = u => ({ id: u.id, username: u.username, active: !u.disabled && u.expires > now(), expiresAt: u.expires || null, deviceLimit:deviceLimitFor(u), shopUnlimited:true, shopLimit:null, deviceBound:!!db.prepare('SELECT 1 FROM devices WHERE user_id=? LIMIT 1').get(u.id), disabled: !!u.disabled });
  const onlineDeviceCount=(id,except=null,time=now())=>db.prepare(`SELECT COUNT(DISTINCT s.public_key) AS n FROM sessions s JOIN devices d ON d.user_id=s.user_id AND d.public_key=s.public_key WHERE s.user_id=? AND s.expires>? AND s.last_seen>? AND (? IS NULL OR s.public_key<>?)`).get(id,time,time-DEVICE_HEARTBEAT_MS,except,except).n;
  const deviceLimitError=(status,limit)=>{throw Object.assign(Error(status===409?`已达到同时登录上限（${limit}台），请先在另一台电脑退出登录或解除绑定`:'同时登录台数已达上限，请退出其他电脑后重新登录'),{status,code:'DEVICE_LIMIT',deviceLimit:limit});};
  const rates = new Map();
  function rate(key, limit) {
    const time = now();
    if (rates.size > 1000) for (const [k, v] of rates) if (v.until < time) rates.delete(k);
    const v = rates.get(key) || { count: 0, until: time + 60_000 };
    if (v.until < time) { v.count = 0; v.until = time + 60_000; }
    rates.set(key, v); if (++v.count > limit) fail(429, '操作频繁，请一分钟后重试');
  }
  async function body(req) {
    let size = 0; const chunks = [];
    const limit = req.url === '/v1/compat' ? 524288 : 16384;
    for await (const chunk of req) { size += chunk.length; if (size > limit) fail(413, '请求过大'); chunks.push(chunk); }
    const raw = Buffer.concat(chunks).toString('utf8');
    try { return { raw, data: raw ? JSON.parse(raw) : {} }; } catch { fail(400, '请求格式不正确'); }
  }
  function admin(req,data={}) {
    const a=security.authorizeAdmin(req);
    if(req.method!=='GET')security.record('admin',a.id,'admin-request:'+req.url,Number.isSafeInteger(data.id)?data.id:null);
  }
  function user(req, raw) {
    const token = String(req.headers.authorization || '').replace(/^Bearer /, '');
    const session = db.prepare('SELECT * FROM sessions WHERE token_hash=? AND expires>?').get(hash(token), now());
    if (!session) fail(401, '登录已失效，请重新登录');
    const u = db.prepare('SELECT * FROM users WHERE id=?').get(session.user_id);
    if (!u || u.disabled || !db.prepare('SELECT id FROM devices WHERE user_id=? AND public_key=?').get(u.id, session.public_key)) fail(401, '账号或设备授权已失效，请重新登录');
    const stamp = String(req.headers['x-time'] || ''), nonce = String(req.headers['x-nonce'] || '');
    if (!/^\d{13}$/.test(stamp) || Math.abs(now() - Number(stamp)) > 60_000 || !/^[a-zA-Z0-9_-]{20,100}$/.test(nonce)) fail(401, '设备验证失败');
    const message = [req.method, req.url, stamp, nonce, hash(raw)].join('\n');
    if (!verify(null, Buffer.from(message), session.public_key, Buffer.from(String(req.headers['x-signature'] || ''), 'base64'))) fail(401, '设备验证失败');
    const checked=transaction(()=>{
      const time=now(),current=db.prepare('SELECT * FROM users WHERE id=?').get(u.id),fresh=db.prepare('SELECT * FROM sessions WHERE token_hash=? AND expires>?').get(hash(token),time);
      if(!current||current.disabled||current.password_hash!==u.password_hash||!fresh||fresh.public_key!==session.public_key||!db.prepare('SELECT 1 FROM devices WHERE user_id=? AND public_key=?').get(u.id,session.public_key))fail(401,'账号或设备授权已失效，请重新登录');
      try {db.prepare('INSERT INTO nonces VALUES(?,?)').run(hash(token+nonce),time+120_000);}catch{fail(409,'重复请求，请重试');}
      const limit=deviceLimitFor(current);
      if(onlineDeviceCount(current.id,session.public_key,time)>=limit){db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));return {denied:limit};}
      db.prepare('UPDATE sessions SET last_seen=? WHERE token_hash=?').run(time,hash(token));return {u:current};
    });
    if(checked.denied)deviceLimitError(401,checked.denied);
    return {u:checked.u,token,publicKey:session.public_key};
  }
  const security=createAccountSecurity({db,now,hash,rate,transaction,authenticateUser:user,adminKey,publicOrigin,legacyAdminEnabled,testSmsAdapter,testMode});
  const adminUsers = createAdminUsers(db, now);
  let lastWriteProbe=-Infinity;
  const server = http.createServer(async (req, res) => {
    req.clientIP=req.socket.remoteAddress;
    const proxySecret=process.env.JUHE_PROXY_SECRET||'', supplied=String(req.headers['x-juhe-proxy-token']||''), clientIP=String(req.headers['x-juhe-client-ip']||'');
    if(proxySecret.length>=32&&timingSafeEqual(Buffer.from(hash(proxySecret)),Buffer.from(hash(supplied)))&&isIP(clientIP))req.clientIP=clientIP;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'");
    try {
      const host = req.headers.host || '';
      const local=/^127\.0\.0\.1:\d+$/.test(host), expected=publicOrigin||`http://${host}`;
      if(publicOrigin ? host!==new URL(publicOrigin).host && !(local&&req.url==='/health'&&req.method==='GET') : !local)fail(403,'访问地址不允许');
      if (req.headers.origin && req.headers.origin !== expected) fail(403, '访问来源不允许');
      const url = new URL(req.url, `http://${host}`), route = url.pathname;
      if(await handleRelease(req,res))return;
      if (req.method === 'GET' && ['/admin', '/client', '/style.css', '/admin.js', '/client.js', '/logo.png'].includes(route)) {
        const names = { '/admin': 'admin.html', '/client': 'client.html' };
        const file = route === '/logo.png' ? logoFile : path.join(root, 'public', names[route] || route.slice(1));
        res.setHeader('Content-Type', route.endsWith('.js') ? 'text/javascript; charset=utf-8' : route.endsWith('.css') ? 'text/css; charset=utf-8' : route.endsWith('.png') ? 'image/png' : 'text/html; charset=utf-8');
        return res.end(fs.readFileSync(file));
      }
      if (req.method === 'GET' && route === '/health') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        try {db.prepare('SELECT 1').get();if(now()-lastWriteProbe>=60_000){db.prepare('INSERT INTO health_write_probe VALUES(1,?) ON CONFLICT(id) DO UPDATE SET checked=excluded.checked').run(now());lastWriteProbe=now();}}
        catch {res.statusCode=503;return res.end(JSON.stringify({service:'juhe-local-auth',healthy:false,message:'数据库读写检查失败'}));}
        return res.end(JSON.stringify({ service: 'juhe-local-auth', localOnly: !publicOrigin }));
      }
      rate('global', 2000);
      const { raw, data } = await body(req);
      if (!data || typeof data !== 'object' || Array.isArray(data)) fail(400, '请求格式不正确');
      let result=await security.handle(req,res,route,data,raw);
      if(result !== undefined) {}
      else if (req.method === 'GET' && route === '/health') result = { service: 'juhe-local-auth', localOnly: !publicOrigin };
      else if (req.method === 'POST' && route === '/v1/register') {
        rate('register', 200);rate('register-ip:'+req.clientIP,20);
        fail(410, '账号注册已关闭，请升级客户端并使用手机号验证码注册');
      } else if (req.method === 'POST' && route === '/v1/challenge') {
        rate('challenge', 600);rate('challenge-ip:'+req.clientIP,60); const key = canonicalKey(data.publicKey), id = random();
        db.prepare('INSERT INTO challenges VALUES(?,?,?)').run(id, key, now() + 60_000); result = { challenge: id };
      } else if (req.method === 'POST' && route === '/v1/login') {
        rate('login', 300);rate('login-account:'+String(data.username||'').trim().toLowerCase(),10);rate('login-ip:'+req.clientIP,60);
        const challenge = db.prepare('DELETE FROM challenges WHERE id=? RETURNING *').get(String(data.challenge || ''));
        if (!challenge || challenge.expires <= now() || !verify(null, Buffer.from(challenge.id), challenge.public_key, Buffer.from(String(data.signature || ''), 'base64'))) fail(401, '设备验证失效，请重试');
        const username = String(data.username || '').trim().toLowerCase(), u = db.prepare('SELECT * FROM users WHERE username=?').get(username);
        if (typeof data.password !== 'string' || data.password.length > 128) fail(401, '账号或密码错误');
        const digest = await slowHash(data.password, u?.salt || 'invalid-user-salt', 64);
        if (!u || !timingSafeEqual(digest, Buffer.from(u.password_hash, 'hex'))) fail(401, '账号或密码错误');
        result = transaction(() => {
          const current = db.prepare('SELECT * FROM users WHERE id=?').get(u.id);
          if (!current || current.password_hash !== u.password_hash) fail(401, '账号或密码错误');
          if (current.disabled) fail(403, '账号已停用，请联系 QQ 731241492');
          const limit=deviceLimitFor(current);
          if(onlineDeviceCount(current.id,challenge.public_key)>=limit)deviceLimitError(409,limit);
          const name = typeof data.deviceName === 'string' ? data.deviceName.trim().slice(0, 60) : '';
          db.prepare('INSERT INTO devices(user_id,public_key,name,created,last_login) VALUES(?,?,?,?,?) ON CONFLICT(user_id,public_key) DO UPDATE SET last_login=excluded.last_login').run(u.id, challenge.public_key, name || 'Windows 电脑', now(), now());
          db.prepare('DELETE FROM sessions WHERE user_id=? AND public_key=?').run(u.id,challenge.public_key);
          db.prepare('UPDATE users SET public_key=? WHERE id=?').run(challenge.public_key, u.id);
          const token = random(); db.prepare('INSERT INTO sessions(token_hash,user_id,public_key,expires,last_seen) VALUES(?,?,?,?,?)').run(hash(token), u.id, challenge.public_key, now() + 12 * 3600_000,now());
          audit('login', u.id); return { token, user: entitlement({ ...current, public_key: challenge.public_key }) };
        });
      } else if (route.startsWith('/v1/admin/')) {
        admin(req,data);rate('admin:'+req.adminId,90);
        if (req.method === 'GET' && route === '/v1/admin/state') result = {
          users: url.searchParams.get('includeUsers') === '0' ? [] : db.prepare('SELECT * FROM users ORDER BY id DESC').all().map(entitlement),
          codes: db.prepare('SELECT id,hint,months,days,shops,device_limit,expires,used_by,used_at,revoked,created FROM codes ORDER BY id DESC LIMIT 100').all().map(({device_limit,...code})=>({...code,deviceLimit:device_limit}))
        };
        else if (req.method === 'GET' && route === '/v1/admin/users') result = adminUsers.list(url.searchParams);
        else if (req.method === 'GET' && route.startsWith('/v1/admin/users/')) result = adminUsers.detail(route.slice('/v1/admin/users/'.length), url.searchParams);
        else if (req.method === 'POST' && route === '/v1/admin/codes') {
          result = licenseCodes.issue(data);
        } else if (req.method === 'POST' && route === '/v1/admin/revoke-code') {
          const r = db.prepare('UPDATE codes SET revoked=1 WHERE id=? AND used_by IS NULL AND revoked=0').run(Number(data.id));
          if (!r.changes) fail(409, '授权码已使用、已作废或不存在'); audit('revoke-code', null, data.id); result = { message: '授权码已作废' };
        } else if (req.method === 'POST' && ['/v1/admin/reset-device', '/v1/admin/disable','/v1/admin/enable'].includes(route)) {
          const id = Number(data.id); if (!db.prepare('SELECT id FROM users WHERE id=?').get(id)) fail(404, '账号不存在');
          result = transaction(() => {
            if (route.endsWith('/reset-device')) { db.prepare('UPDATE users SET public_key=NULL WHERE id=?').run(id); db.prepare('DELETE FROM devices WHERE user_id=?').run(id); }
            else db.prepare('UPDATE users SET disabled=? WHERE id=?').run(route.endsWith('/disable')?1:0,id);
            db.prepare('DELETE FROM sessions WHERE user_id=?').run(id); audit(route.split('/').pop(), id); return { message: '操作成功，旧会话已撤销' };
          });
        } else fail(404, '接口不存在');
      } else if (['/v1/me', '/v1/redeem', '/v1/logout', '/v1/compat', '/v1/devices', '/v1/devices/unbind'].includes(route)) {
        const { u, token, publicKey } = user(req, raw);
        if (req.method === 'GET' && route === '/v1/devices') {const time=now(),devices=db.prepare(`SELECT d.*, (SELECT MAX(s.last_seen) FROM sessions s WHERE s.user_id=d.user_id AND s.public_key=d.public_key AND s.expires>?) AS last_seen FROM devices d WHERE d.user_id=? ORDER BY d.last_login DESC,d.id DESC`).all(time,u.id).map(d=>({id:d.id,name:d.name,createdAt:d.created,lastLogin:d.last_login,lastSeen:d.last_seen,current:d.public_key===publicKey,online:d.last_seen!==null&&d.last_seen>time-DEVICE_HEARTBEAT_MS,sessionActive:d.last_seen!==null&&d.last_seen>time-DEVICE_HEARTBEAT_MS}));result={devices,deviceLimit:deviceLimitFor(u),boundDeviceCount:devices.length,onlineDeviceCount:onlineDeviceCount(u.id)};}
        else if (req.method === 'POST' && route === '/v1/devices/unbind') result = transaction(() => {
          const device = db.prepare('SELECT * FROM devices WHERE id=? AND user_id=?').get(Number(data.id), u.id);
          if (!device) fail(404, '设备不存在或不属于当前账号');
          db.prepare('DELETE FROM sessions WHERE user_id=? AND public_key=?').run(u.id, device.public_key);
          db.prepare('DELETE FROM devices WHERE id=? AND user_id=?').run(device.id, u.id);
          const self = device.public_key === publicKey;
          db.prepare('UPDATE users SET public_key=NULL WHERE id=? AND public_key=?').run(u.id,device.public_key);
          audit('unbind-device', u.id); return { message:'设备已解除绑定', loggedOut:self };
        });
        else if (req.method === 'POST' && route === '/v1/compat') result = { data: transaction(() => compatibility(u, data)) };
        else if (req.method === 'GET' && route === '/v1/me') result = { user: entitlement(u) };
        else if (req.method === 'POST' && route === '/v1/logout') { db.prepare('DELETE FROM sessions WHERE user_id=? AND public_key=?').run(u.id,publicKey); result = { message: '已退出登录' }; }
        else if (req.method === 'POST' && route === '/v1/redeem') {
          rate(`redeem:${u.id}`, 15);
          result = transaction(() => {
            const code = db.prepare('SELECT * FROM codes WHERE code_hash=?').get(hash(String(data.code || '').trim().toUpperCase()));
            if (!code || code.revoked || code.expires <= now()) fail(400, '授权码无效、已作废或已超过兑换期限');
            if (code.used_by) fail(409, '授权码已使用');
            const current = db.prepare('SELECT * FROM users WHERE id=?').get(u.id);
            const limit=deviceLimitFor(code);
            if (current.expires > now() && deviceLimitFor(current) !== limit) fail(409, '续费电脑台数需与当前套餐一致，变更套餐请联系客服');
            if(onlineDeviceCount(current.id)>limit)deviceLimitError(409,limit);
            const expiry = licenseCodes.expiry(Math.max(now(), current.expires), code);
            db.prepare('UPDATE users SET expires=?,device_limit=? WHERE id=?').run(expiry,limit,u.id);
            db.prepare('UPDATE codes SET used_by=?,used_at=? WHERE id=?').run(u.id, now(), code.id); audit('redeem', u.id, code.id);
            return { user: entitlement({ ...current, expires: expiry, device_limit:limit }), message: '授权成功' };
          });
        } else fail(405, '请求方法不支持');
      } else fail(404, '接口不存在');
      res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(result));
    } catch (e) {
      res.statusCode = e.status || 500; res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ message: e.status ? e.message : '服务暂时不可用，请稍后重试', ...(e.code==='DEVICE_LIMIT'?{code:'DEVICE_LIMIT',deviceLimit:e.deviceLimit}:{}) }));
      if (!e.status) console.error('Local auth request failed:', e.code || e.name);
    }
  });
  const cleanup = setInterval(() => {
    for (const table of ['sessions', 'challenges', 'nonces','admin_sessions','password_recovery','phone_otps','sms_limits']) db.prepare(`DELETE FROM ${table} WHERE expires<?`).run(now());
  }, 60_000); cleanup.unref();
  server.on('close', () => { clearInterval(cleanup); db.close(); });
  return { server, db, adminKey, security };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const host = process.env.JUHE_BIND_HOST || '127.0.0.1';
  if (!['127.0.0.1', '0.0.0.0'].includes(host)) throw Error('Invalid bind host');
  const { server } = createService({ dataDir: process.env.JUHE_DATA_DIR || path.join(root, 'data'), logoFile: process.env.JUHE_LOGO_FILE || path.join(root, '../app-asar/dist/assets/juhe-logo-mark.png') });
  server.listen(47831, host, () => console.log('Juhe local authorization service listening on port 47831'));
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 8000).unref();
  });
}
