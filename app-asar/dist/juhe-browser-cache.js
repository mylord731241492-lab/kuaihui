// Browser-only equivalents of the storage helpers in juhe-account-cache.cjs.
// Keep these in the renderer realm: requiring Node filesystem modules across
// Electron window navigation can retain references to a destroyed context.
export function scopedStorage(storage, scope) {
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
const browserFields = {
  app: ['theme','settings','loginType','autoRefresh','todayTotalConsultation','reminderReply','aiAutoReview','scrollToSelectedShop','bottomLineReplyTimeRange','bottomLineReplyFrequency','bottomLineReplyCompleted','serviceReplyTime','globalAiReplySwitch','bottomLineReply','aiReplyConfig'],
  shop: ['manuallyAddShopList','localDataList','aiRepliedMessageList','currentSelectShop','shopList','messages','goodsUrlList','aiToHumanReplyList','shopActiveList','collapse','singleShopBottomLineReplyFrequency','singleShopBottomLineReplyList','singleShopAiReplyConfig']
};
export function browserBusinessData(raw) {
  const result = {};
  for (const [key, fields] of Object.entries(browserFields)) {
    let value; try { value = JSON.parse(raw.getItem(key) || 'null'); } catch { continue; }
    if (!value || typeof value !== 'object') continue;
    result[key] = Object.fromEntries(fields.filter(field => Object.hasOwn(value, field)).map(field => [field, value[field]]));
  }
  return result;
}
