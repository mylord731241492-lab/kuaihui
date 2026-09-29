// The renderer never receives the service token or device private key.
const juheIpc = require('electron').ipcRenderer;
window.juheLocalAiCall = (action, data) => juheIpc.invoke('juhe-ai:call', action, data);
window.juheOpenAuth = () => juheIpc.invoke('juhe-auth:call', 'show');
function installLegacyImportEntry() {
  const header=document.querySelector('.header-container');
  if(!header || !window.juheLegacyImport) return;
  if(!document.getElementById('juhe-import-legacy')) {
    const migrate=document.createElement('button'); migrate.id='juhe-import-legacy'; migrate.textContent='导入已确认的旧版设置'; migrate.type='button';
    migrate.style.cssText='margin:0 16px;padding:6px 12px;border:1px solid #dce3ef;border-radius:8px;background:#fff;color:#416ee0;cursor:pointer;white-space:nowrap;-webkit-app-region:no-drag';
    migrate.onclick=()=>window.juheLegacyImport(); header.append(migrate);
  }
  legacyImportEntry.disconnect();
}
const legacyImportEntry = new MutationObserver(installLegacyImportEntry);
legacyImportEntry.observe(document.documentElement,{childList:true,subtree:true});
window.juheLegacyRequest = async request => {
  const result = await juheIpc.invoke('juhe-auth:call', 'compat', { url: request.url, method: request.method, data: request.data, params: request.params });
  if (result.error) throw { code: result.status || 503, msg: result.error, message: result.error };
  return result.data;
};
window.juheSessionReady = juheIpc.invoke('juhe-auth:call', 'snapshot').then(result => {
  if (result.error) { window.juheOpenAuth(); throw Error(result.error); }
  window.__JUHE_USER__ = result.user;
  return juheIpc.invoke('juhe-cache-context').then(async ({scope,legacyImportReady,legacyBrowser}) => {
    const {scopedStorage,browserBusinessData} = await import('./juhe-browser-cache.js');
    const rawLocal=window.localStorage, rawSession=window.sessionStorage;
    Object.defineProperty(window, 'localStorage', {configurable:true, value:scopedStorage(rawLocal, scope)});
    Object.defineProperty(window, 'sessionStorage', {configurable:true, value:scopedStorage(rawSession, scope)});
    // Only stale authentication state is reset. Reply and AI configuration survive navigation.
    sessionStorage.removeItem('user');
    if (legacyImportReady && !localStorage.getItem('legacy-import-complete')) {
      window.juheLegacyImport = () => {
      const name=result.user.userName;
      if (!confirm(`确认将本机旧版的店铺与回复设置导入账号「${name}」？仅在已确认资料归属时继续，会覆盖本账号对应设置。旧版原始资料保留。`)) return;
      for (const [raw, target] of [[rawLocal,localStorage],[rawSession,sessionStorage]]) {
        for (const [key,value] of Object.entries(browserBusinessData(raw))) target.setItem(key,JSON.stringify(value));
      }
      if(legacyBrowser) for(const [key,value] of Object.entries(browserBusinessData({getItem:k=>JSON.stringify(legacyBrowser[k]??null)}))) {
        localStorage.setItem(key,JSON.stringify(value)); sessionStorage.setItem(key,JSON.stringify(value));
      }
        localStorage.setItem('legacy-import-complete','true'); location.reload();
      };
      installLegacyImportEntry();
    } else legacyImportEntry.disconnect();
    // Keep a saved old off/on preference when this account first gains native
    // persistence. A stale browser value must never replace a newer native value.
    if (location.hash.split('?')[0] === '#/index') {
      for (const storage of [sessionStorage, localStorage]) {
        let value;
        try { value = JSON.parse(storage.getItem('app') || 'null')?.globalAiReplySwitch; } catch {}
        if (value !== 0 && value !== 1) continue;
        await window.juheLocalAiCall('switch-initialize', {value});
        break;
      }
    }
  });
});
// The module bootstrap may arrive after the IPC response. Keep its original
// rejection available to the error screen without an early unhandled rejection.
window.juheSessionReady.catch(() => {});
