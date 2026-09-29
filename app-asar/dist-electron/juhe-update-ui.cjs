const fs = require('node:fs'), path = require('node:path');
const { BrowserWindow, ipcMain, shell } = require('electron');
module.exports = function createUpdateUI({ app, base, root, getWindow }) {
  let window = null, checking = false, stopped = false, pendingNotice = null;
  const watched = new WeakSet(), reminderFile = path.join(app.getPath('userData'), 'juhe-update-reminders.json');
  let reminders = {};
  try { reminders = JSON.parse(fs.readFileSync(reminderFile, 'utf8')); } catch {}
  const updater = require('./juhe-updates.cjs')({ app, base, shell, onState: state => {
    for (const w of [window, getWindow()]) if (w && !w.isDestroyed() && !w.webContents.isDestroyed()) {
      w.webContents.send('juhe-updates:state', state);
      w.setProgressBar(state.status === 'downloading' ? state.percent / 100 : state.status === 'verifying' ? 2 : -1);
    }
  } });
  function noticeCode(metadata) {
    return `(() => {
      document.getElementById('juhe-update-notice')?.remove();
      const metadata = ${JSON.stringify(metadata)}; if (!metadata) return;
      const box = document.createElement('aside'); box.id = 'juhe-update-notice'; box.setAttribute('role', 'status');
      box.style.cssText = 'position:fixed;right:22px;bottom:20px;z-index:2147483000;max-width:300px;padding:14px 16px;background:#fff;border:1px solid #d4e0f5;border-radius:12px;box-shadow:0 6px 28px #19355826;color:#18304f;font:14px/1.5 sans-serif';
      const title = document.createElement('strong'); title.textContent = '新版本 ' + metadata.version + ' 已发布';
      const info = document.createElement('div'); info.textContent = '可随时下载，当前工作不受影响。'; info.style.margin = '5px 0 10px';
      const open = document.createElement('button'); open.textContent = '查看更新';
      const later = document.createElement('button'); later.textContent = '稍后';
      for (const button of [open, later]) button.style.cssText = 'padding:5px 12px;margin-right:8px;border:1px solid #ccd8eb;background:#f4f7fd;border-radius:6px;color:#24476b;cursor:pointer';
      open.onclick = () => { require('electron').ipcRenderer.invoke('juhe-auth:call', 'updates-show'); box.remove(); };
      later.onclick = () => { require('electron').ipcRenderer.invoke('juhe-auth:call', 'updates-dismiss'); box.remove(); };
      box.append(title, info, open, later); document.body.append(box);
    })()`;
  }
  function renderNotice() {
    const main = getWindow(); if (main && !main.isDestroyed() && !main.webContents.isDestroyed()) main.webContents.executeJavaScript(noticeCode(pendingNotice)).catch(() => {});
  }
  function dismiss() { pendingNotice = null; renderNotice(); return {}; }
  function watchWindow(main) {
    if (!main || watched.has(main)) return;
    watched.add(main); main.webContents.on('did-finish-load', renderNotice);
  }
  function show() {
    dismiss();
    if (window && !window.isDestroyed()) { if (window.isMinimized()) window.restore(); window.show(); window.focus(); return {}; }
    window = new BrowserWindow({ title: '聚禾客服平台 · 软件更新', width: 520, height: 490, minWidth: 420, minHeight: 420, show: false, autoHideMenuBar: true, maximizable: false, fullscreenable: false, backgroundColor: '#f5f7fc', webPreferences: { nodeIntegration: true, contextIsolation: false, webSecurity: true } });
    window.setMenuBarVisibility(false);
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', event => event.preventDefault());
    window.once('ready-to-show', () => { if (window && !window.isDestroyed()) window.show(); });
    window.once('closed', () => { window = null; });
    window.loadFile(path.join(root, 'dist/update/index.html'));
    return {};
  }
  async function check() { const result = await updater.check(); if (result.available) show(); return result; }
  async function autoCheck() {
    if (checking || stopped || ['downloading', 'verifying'].includes(updater.getState().status)) return;
    checking = true;
    try {
      watchWindow(getWindow());
      const result = await updater.check();
      if (!result.available) { dismiss(); return; }
      if (updater.getState().status === 'downloaded' || Date.now() - (Number(reminders[result.version]) || 0) < 86400_000) return;
      reminders = { [result.version]: Date.now() };
      try { fs.writeFileSync(reminderFile, JSON.stringify(reminders), 'utf8'); } catch {}
      pendingNotice = { version: result.version }; renderNotice();
    } catch {} finally { checking = false; }
  }
  ipcMain.handle('juhe-updates:call', async (event, action) => {
    if (!window || window.isDestroyed() || event.sender !== window.webContents || event.senderFrame !== event.sender.mainFrame) return { error: '页面无权访问更新接口' };
    try {
      if (action === 'state') return updater.getState();
      if (action === 'check') return await updater.check();
      if (action === 'download') return await updater.download();
      if (action === 'open') return updater.openDownloaded();
      if (action === 'close') { window.close(); return {}; }
      return { error: '操作不支持' };
    } catch (error) { return { error: error.message }; }
  });
  const startup = setTimeout(autoCheck, 5000), interval = setInterval(autoCheck, 6 * 60 * 60_000); startup.unref?.(); interval.unref?.();
  function stop() { stopped = true; clearTimeout(startup); clearInterval(interval); }
  app.once('before-quit', stop);
  return { check, download: updater.download, show, dismiss, watchWindow, stop };
};
