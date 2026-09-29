// Explicit compatibility contract for the recovered desktop client.
export function createCompatibility(db, now) {
  db.exec(`CREATE TABLE IF NOT EXISTS shops(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id), platform TEXT NOT NULL, external_id TEXT NOT NULL, payload TEXT NOT NULL, UNIQUE(user_id,platform,external_id));
    CREATE TABLE IF NOT EXISTS client_config(user_id INTEGER NOT NULL REFERENCES users(id), name TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(user_id,name));`);
  const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
  const encode = (row) => ({ ...JSON.parse(row.payload), id: row.id, platformType: row.platform, platformShopId: row.external_id });
  const owned = (id, u) => { const row = db.prepare('SELECT * FROM shops WHERE id=? AND user_id=?').get(Number(id), u.id); if (!row) fail(404, '店铺不存在或不属于当前账号'); return row; };
  function save(data, u, create = false) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) fail(400, '店铺数据格式错误');
    let old = data.id ? owned(data.id, u) : null;
    if (!create && !old) fail(400, '缺少店铺编号');
    const platform = String(data.platformType || old?.platform || '4');
    const external = String(data.platformShopId || old?.external_id || `pending-${crypto.randomUUID()}`);
    if (platform.length > 40 || external.length > 200) fail(400, '店铺标识过长');
    const duplicate = db.prepare('SELECT * FROM shops WHERE user_id=? AND platform=? AND external_id=?').get(u.id, platform, external);
    if (duplicate && (!old || duplicate.id !== old.id)) fail(409, '该店铺已添加，请使用已有店铺');
    const payload = { ...(old ? JSON.parse(old.payload) : {}), ...data }; delete payload.id;
    if (!old) {
      const r = db.prepare('INSERT INTO shops(user_id,platform,external_id,payload) VALUES(?,?,?,?)').run(u.id, platform, external, JSON.stringify(payload));
      old = owned(Number(r.lastInsertRowid), u);
    } else {
      db.prepare('UPDATE shops SET platform=?,external_id=?,payload=? WHERE id=? AND user_id=?').run(platform, external, JSON.stringify(payload), old.id, u.id);
      old = owned(old.id, u);
    }
    return encode(old);
  }
  return (u, request) => {
    const route = String(request.url || '').split('?')[0], method = String(request.method || 'get').toLowerCase(), data = request.data || {};
    if (!u || u.disabled || u.expires <= now()) fail(403, '套餐未激活或已到期，请兑换授权码');
    if (route === '/cline/shop/Alllist' && method === 'get') return db.prepare('SELECT * FROM shops WHERE user_id=? ORDER BY id').all(u.id).map(encode);
    if (route === '/cline/shop/app/list' && method === 'get') {
      const platform = String(request.params?.platformType || new URL(request.url, 'http://local').searchParams.get('platformType') || '');
      return db.prepare('SELECT * FROM shops WHERE user_id=? AND platform=? ORDER BY id').all(u.id, platform).map(encode);
    }
    if (route === '/cline/shop' && method === 'post') return save(data, u, true);
    if (['/cline/shop', '/cline/shop/app/updateLoginUrlToken'].includes(route) && method === 'put') return save(data, u);
    if (route === '/cline/shop/batchupdateshop' && method === 'put') return Array.isArray(data) ? data.map(item => save(item, u)) : save(data, u);
    if (/^\/cline\/shop\/\d+$/.test(route)) {
      const row = owned(route.split('/').pop(), u);
      if (method === 'get') return encode(row);
      if (method === 'delete') { db.prepare('DELETE FROM shops WHERE id=? AND user_id=?').run(row.id, u.id); return { deleted: true }; }
    }
    if (route === '/system/notice/noticelist' && method === 'get') return [];
    if (route === '/system/dict/data/type/sys_version' && method === 'get') return [{ dictValue: '3.8.0-juhe.1', dictLabel: '聚禾客服：新账号、授权码及设备绑定版本' }];
    if (['/fallback/config', '/fallback/config/list'].includes(route)) {
      const key = 'fallback', saved = db.prepare('SELECT payload FROM client_config WHERE user_id=? AND name=?').get(u.id, key);
      if (method === 'get') return route.endsWith('/list') ? (saved ? [JSON.parse(saved.payload)] : []) : saved ? JSON.parse(saved.payload) : {};
      if (method === 'post' && !route.endsWith('/list')) { db.prepare('INSERT INTO client_config VALUES(?,?,?) ON CONFLICT(user_id,name) DO UPDATE SET payload=excluded.payload').run(u.id, key, JSON.stringify(data)); return data; }
    }
    fail(501, '此功能尚未接入新服务，请联系 QQ 731241492');
  };
}
