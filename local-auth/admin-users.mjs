import { DEVICE_HEARTBEAT_MS, deviceLimitFor } from './device-policy.mjs';

const statuses = new Set(['all', 'active', 'inactive', 'expired', 'disabled']);
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const statusExpression = `CASE WHEN disabled <> 0 THEN 'disabled' WHEN expires > ? THEN 'active' WHEN expires > 0 THEN 'expired' ELSE 'inactive' END`;

function validateParameters(params, allowed) {
  const seen = new Set();
  for (const [key] of params) {
    if (!allowed.has(key) || seen.has(key)) fail(400, '查询参数不正确');
    seen.add(key);
  }
}

function positiveInteger(value, name, maximum = Number.MAX_SAFE_INTEGER) {
  if (!/^[1-9]\d*$/.test(value)) fail(400, `${name}需要为正整数`);
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number > maximum) fail(400, `${name}超出范围`);
  return number;
}

export function createAdminUsers(db, now) {
  function metadata(ids, time) {
    const result = new Map(ids.map(id => [id, { deviceCount: 0, onlineDeviceCount: 0, lastLogin: null }]));
    if (!ids.length) return result;
    const placeholders = ids.map(() => '?').join(',');
    for (const row of db.prepare(`SELECT user_id, COUNT(*) AS device_count, MAX(last_login) AS last_login FROM devices WHERE user_id IN (${placeholders}) GROUP BY user_id`).all(...ids)) {
      Object.assign(result.get(row.user_id), { deviceCount: row.device_count, lastLogin: row.last_login });
    }
    for (const row of db.prepare(`SELECT s.user_id, COUNT(DISTINCT s.public_key) AS online_count
      FROM sessions s JOIN users u ON u.id=s.user_id
      JOIN devices d ON d.user_id=s.user_id AND d.public_key=s.public_key
      WHERE s.user_id IN (${placeholders}) AND u.disabled=0 AND s.expires>? AND s.last_seen>?
      GROUP BY s.user_id`).all(...ids, time, time - DEVICE_HEARTBEAT_MS)) {
      result.get(row.user_id).onlineDeviceCount = row.online_count;
    }
    // Audit history survives device unbinding, unlike devices.last_login.
    for (const row of db.prepare(`SELECT user_id, MAX(created) AS last_login FROM audit WHERE action='login' AND user_id IN (${placeholders}) GROUP BY user_id`).all(...ids)) {
      result.get(row.user_id).lastLogin = row.last_login;
    }
    return result;
  }

  function publicUser(row, details) {
    return {
      id: row.id,
      username: row.username,
      active: row.status === 'active',
      expiresAt: row.expires || null,
      deviceLimit: deviceLimitFor(row),
      shopUnlimited: true,
      shopLimit: null,
      deviceBound: details.deviceCount > 0,
      disabled: !!row.disabled,
      status: row.status,
      createdAt: row.created,
      lastLogin: details.lastLogin,
      deviceCount: details.deviceCount,
      boundDeviceCount: details.deviceCount,
      onlineDeviceCount: details.onlineDeviceCount
    };
  }

  function list(params) {
    validateParameters(params, new Set(['q', 'status', 'page', 'pageSize']));
    const q = params.get('q') ?? '';
    if (q.length > 40 || /[\u0000-\u001f\u007f]/.test(q)) fail(400, '搜索内容最多40个字符，不能包含控制字符');
    const status = params.get('status') ?? 'all';
    if (!statuses.has(status)) fail(400, '账号状态不正确');
    const requestedPage = positiveInteger(params.get('page') ?? '1', '页码');
    const pageSize = positiveInteger(params.get('pageSize') ?? '20', '每页数量', 100);
    const time = now();
    const summary = { total: 0, active: 0, inactive: 0, expired: 0, disabled: 0 };
    for (const row of db.prepare(`SELECT ${statusExpression} AS status, COUNT(*) AS count FROM users GROUP BY status`).all(time)) {
      summary[row.status] = row.count;
      summary.total += row.count;
    }

    const conditions = [], values = [];
    if (q) {
      const numericId = /^\d+$/.test(q) && Number.isSafeInteger(Number(q)) && Number(q) > 0 ? Number(q) : null;
      // instr is a literal substring search: '%' and '_' never become wildcards.
      conditions.push('(instr(lower(username), lower(?)) > 0 OR id = ?)');
      values.push(q, numericId);
    }
    if (status !== 'all') {
      conditions.push(`(${statusExpression}) = ?`);
      values.push(time, status);
    }
    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const total = db.prepare('SELECT COUNT(*) AS count FROM users' + where).get(...values).count;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const rows = db.prepare(`SELECT id, username, disabled, expires, device_limit, created, ${statusExpression} AS status FROM users${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(time, ...values, pageSize, (page - 1) * pageSize);
    const details = metadata(rows.map(row => row.id), time);
    return { users: rows.map(row => publicUser(row, details.get(row.id))), total, page, pageSize, totalPages, summary };
  }

  function detail(idText, params) {
    validateParameters(params, new Set());
    const id = positiveInteger(idText, '账号ID'), time = now();
    const row = db.prepare(`SELECT id, username, disabled, expires, device_limit, created, ${statusExpression} AS status FROM users WHERE id = ?`).get(time, id);
    if (!row) fail(404, '账号不存在');
    const devices = db.prepare(`SELECT d.id, d.name, d.created, d.last_login,
      (SELECT MAX(s.last_seen) FROM sessions s WHERE s.user_id=d.user_id AND s.public_key=d.public_key AND s.expires>?) AS last_seen
      FROM devices d WHERE d.user_id = ? ORDER BY d.last_login DESC, d.id DESC`).all(time, id).map(device => ({
      id: device.id,
      name: device.name,
      createdAt: device.created,
      lastLogin: device.last_login,
      current: false,
      lastSeen: device.last_seen,
      online: !row.disabled && device.last_seen !== null && device.last_seen > time - DEVICE_HEARTBEAT_MS,
      sessionActive: !row.disabled && device.last_seen !== null && device.last_seen > time - DEVICE_HEARTBEAT_MS
    }));
    return { user: publicUser(row, metadata([id], time).get(id)), devices };
  }

  return { list, detail };
}
