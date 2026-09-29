const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// Unowned legacy files are deliberately never claimed by the first new login.
function accountScope(origin, id) {
  if (!id || !origin) throw Error('账号缓存缺少身份');
  return crypto.createHash('sha256').update(`${new URL(origin).origin}\n${id}`).digest('hex');
}
function scopedStorage(storage, scope) {
  const prefix = `juhe:${scope}:`;
  const keys = () => Array.from({length: storage.length}, (_, i) => storage.key(i)).filter(k => k && k.startsWith(prefix));
  const api = {
    getItem: key => storage.getItem(prefix + String(key)),
    setItem: (key, value) => storage.setItem(prefix + String(key), String(value)),
    removeItem: key => storage.removeItem(prefix + String(key)),
    clear: () => keys().forEach(key => storage.removeItem(key)),
    key: index => keys()[index]?.slice(prefix.length) ?? null,
    get length() { return keys().length; }
  };
  return new Proxy(api, {
    get: (target, key) => key in target ? target[key] : typeof key === 'string' ? api.getItem(key) : undefined,
    set: (_, key, value) => { api.setItem(key, value); return true; },
    deleteProperty: (_, key) => { api.removeItem(key); return true; }
  });
}
function accountDirectory(root, scope) {
  if (!/^[a-f0-9]{64}$/.test(scope)) throw Error('账号缓存尚未初始化');
  const directory = path.join(root, 'accounts', scope);
  fs.mkdirSync(directory, {recursive: true});
  return directory;
}
const browserFields = {
  app: ['theme','settings','loginType','autoRefresh','todayTotalConsultation','reminderReply','aiAutoReview','scrollToSelectedShop','bottomLineReplyTimeRange','bottomLineReplyFrequency','bottomLineReplyCompleted','serviceReplyTime','globalAiReplySwitch','bottomLineReply','aiReplyConfig'],
  shop: ['manuallyAddShopList','localDataList','aiRepliedMessageList','currentSelectShop','shopList','messages','goodsUrlList','aiToHumanReplyList','shopActiveList','collapse','singleShopBottomLineReplyFrequency','singleShopBottomLineReplyList','singleShopAiReplyConfig']
};
function browserBusinessData(raw) {
  const result = {};
  for (const [key, fields] of Object.entries(browserFields)) {
    let value; try { value = JSON.parse(raw.getItem(key) || 'null'); } catch { continue; }
    if (!value || typeof value !== 'object') continue;
    result[key] = Object.fromEntries(fields.filter(field => Object.hasOwn(value, field)).map(field => [field, value[field]]));
  }
  return result;
}
module.exports = {accountScope, scopedStorage, accountDirectory, browserBusinessData};
