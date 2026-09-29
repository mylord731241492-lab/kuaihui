const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const crypto = require('node:crypto'), fs = require('node:fs'), path = require('node:path');
const base = 'http://127.0.0.1:47831';
// The local trial has its own identity and never touches existing shop sessions.
const trialData = process.env.JUHE_TRIAL_DATA_DIR || (app.isPackaged ? path.join(process.resourcesPath, '../../../local-auth/data') : path.join(__dirname, 'data'));
const trialUserData = path.join(trialData, 'desktop');
fs.mkdirSync(trialUserData, { recursive: true });
app.setPath('userData', trialUserData);
app.setName('聚禾客服 · 账号试运行');
let token = '', privateKey, publicKey, adminWindow;
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
async function request(route, data, signed = false) {
  const method = data === undefined ? 'GET' : 'POST', raw = data === undefined ? '' : JSON.stringify(data);
  const headers = { 'Content-Type': 'application/json' };
  if (signed) {
    const stamp = String(Date.now()), nonce = crypto.randomBytes(24).toString('base64url');
    Object.assign(headers, { Authorization: `Bearer ${token}`, 'X-Time': stamp, 'X-Nonce': nonce,
      'X-Signature': crypto.sign(null, Buffer.from([method, route, stamp, nonce, sha(raw)].join('\n')), privateKey).toString('base64') });
  }
  let res;
  try { res = await fetch(base + route, { method, headers, body: data === undefined ? undefined : raw, signal: AbortSignal.timeout(8000) }); }
  catch { throw Error('本地服务未连接，请先启动账号服务'); }
  const result = await res.json(); if (!res.ok) throw Error(result.message); return result;
}
function windowFor(route) {
  const w = new BrowserWindow({ width: route === '/admin' ? 1160 : 980, height: 820, minWidth: 760, minHeight: 680,
    title: '聚禾客服平台 · 本地试运行', icon: path.join(trialData, '../../app-asar/dist/assets/juhe-logo-mark.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false } });
  w.setMenuBarVisibility(false);
  w.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  w.webContents.on('will-navigate', (event, url) => { if (url !== base + route) event.preventDefault(); });
  w.loadURL(base + route); return w;
}
app.whenReady().then(() => {
  if (!safeStorage.isEncryptionAvailable()) throw Error('无法使用系统密钥保护，本地试运行已停止');
  const keyFile = path.join(app.getPath('userData'), 'device-key.bin');
  fs.mkdirSync(path.dirname(keyFile), { recursive: true });
  if (fs.existsSync(keyFile)) privateKey = crypto.createPrivateKey(safeStorage.decryptString(fs.readFileSync(keyFile)));
  else {
    privateKey = crypto.generateKeyPairSync('ed25519').privateKey;
    fs.writeFileSync(keyFile, safeStorage.encryptString(privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()), { mode: 0o600 });
  }
  publicKey = crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'pem' }).toString();
  ipcMain.handle('juhe-trial', async (event, action, data) => {
    const page = event.senderFrame?.url;
    if (event.senderFrame !== event.sender.mainFrame || ![base + '/client', base + '/admin'].includes(page)) throw Error('页面无权访问');
    try {
      if (action === 'admin-key' && page === base + '/admin') return { key: fs.readFileSync(path.join(trialData, 'admin-key.txt'), 'utf8').trim() };
      if (page !== base + '/client') throw Error('页面无权访问');
      if (action === 'admin') {
        if (!adminWindow || adminWindow.isDestroyed()) adminWindow = windowFor('/admin'); else adminWindow.focus();
        return {};
      }
      if (action === 'login') {
        const { challenge } = await request('/v1/challenge', { publicKey });
        const result = await request('/v1/login', { username: data.username, password: data.password, challenge, signature: crypto.sign(null, Buffer.from(challenge), privateKey).toString('base64') });
        token = result.token; return { user: result.user };
      }
      if (action === 'me') return await request('/v1/me', undefined, true);
      if (action === 'redeem') return await request('/v1/redeem', { code: data.code }, true);
      if (action === 'logout') { try { return await request('/v1/logout', {}, true); } finally { token = ''; } }
      throw Error('操作不支持');
    } catch (e) { return { error: e.message }; }
  });
  windowFor('/client');
}).catch(error => { console.error(error.message); app.quit(); });
app.on('window-all-closed', () => app.quit());
