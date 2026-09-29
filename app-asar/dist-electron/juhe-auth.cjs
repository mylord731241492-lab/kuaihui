const { safeStorage, BrowserWindow, screen } = require('electron');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { fileURLToPath } = require('node:url');
module.exports = function createJuheAuth({ app, ipcMain, root, getWindow, onState, onEnter, onSuspend, serviceUrl }) {
  const base = serviceUrl || require('./juhe-service.cjs').resolveServiceUrl(app);
  const parsed = new URL(base);
  const updates=require('./juhe-update-ui.cjs')({app,base,root,getWindow});
  if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/' || !(parsed.protocol === 'https:' || parsed.protocol === 'http:' && parsed.hostname === '127.0.0.1')) throw Error('授权服务地址必须使用HTTPS，本机调试可用127.0.0.1');
  if (!safeStorage.isEncryptionAvailable()) throw Error('Windows密钥保护不可用，无法启动登录服务');
  const keyFile = path.join(app.getPath('userData'), 'juhe-device-key.bin');
  let key;
  if (fs.existsSync(keyFile)) key = crypto.createPrivateKey(safeStorage.decryptString(fs.readFileSync(keyFile)));
  else { key = crypto.generateKeyPairSync('ed25519').privateKey; fs.writeFileSync(keyFile, safeStorage.encryptString(key.export({ type: 'pkcs8', format: 'pem' }).toString()), { mode: 0o600 }); }
  const publicKey = crypto.createPublicKey(key).export({ type: 'spki', format: 'pem' }).toString();
  const sha = value => crypto.createHash('sha256').update(value).digest('hex');
  let token = '', current = null, verifiedAt = 0, generation = 0, polling = false, entered = false, notice = '';
  let accountWindow = null;
  const watchedWindows = new WeakSet();
  const controlWindows = new WeakSet();
  const businessContents = new WeakSet();
  const businessActions = new Set(['snapshot', 'compat', 'show']);
  const gateFile = path.join(root, 'dist/auth/index.html');
  const active = () => !!(token && current?.active && current.expiresAt > Date.now() && Date.now() - verifiedAt < 30_000);
  function setUser(user) { current = user; verifiedAt = Date.now(); onState(current, active()); }
  function closeAccountWindow() {
    const window = accountWindow; accountWindow = null;
    if (window && !window.isDestroyed()) window.destroy();
  }
  function windowState(window) {
    return { fullscreen: window.isFullScreen(), minimized: window.isMinimized(), maximized: window.isMaximized(), canFullscreen: window !== accountWindow && window.isFullScreenable() };
  }
  function watchWindowControls(window) {
    if(controlWindows.has(window))return;
    controlWindows.add(window);
    const send=()=>setImmediate(()=>{if(!window.isDestroyed()&&!window.webContents.isDestroyed())window.webContents.send('juhe-auth:window-state',windowState(window));});
    for(const event of ['enter-full-screen','leave-full-screen','maximize','unmaximize','minimize','restore'])window.on(event,send);
    window.webContents.on('did-finish-load',send);
  }
  function mainWindow() {
    const window = getWindow();
    if (!window || window.isDestroyed()) return null;
    if (!watchedWindows.has(window)) {
      watchedWindows.add(window); window.once('closed', closeAccountWindow); watchWindowControls(window); updates.watchWindow(window);
    }
    return window;
  }
  function focusMain() {
    const window = mainWindow(); if (!window) return;
    if (window.isMinimized()) window.restore(); window.show(); window.focus();
  }
  function showGate() {
    const hadWorkbench = entered; entered = false; closeAccountWindow();
    if (hadWorkbench) onSuspend();
    const window = mainWindow();
    if (window) {
      if (window.isMinimized()) window.restore();
      const area=screen.getDisplayMatching(window.getBounds()).workArea;
      const width=Math.max(1,Math.min(1200,area.width-64)),height=Math.max(1,Math.min(900,area.height-64));
      const restoreBounds=()=>{
        if(window.isDestroyed()||entered)return;
        window.setMinimumSize(Math.min(900,width),Math.min(600,height));
        if(window.isMaximized())window.unmaximize();
        window.setBounds({x:Math.round(area.x+(area.width-width)/2),y:Math.round(area.y+(area.height-height)/2),width,height});
      };
      window.setResizable(true);
      if(window.isFullScreen())window.once('leave-full-screen',()=>setImmediate(restoreBounds));
      window.setFullScreen(false);restoreBounds();
      window.loadFile(gateFile); window.show(); window.focus();
    }
  }
  function showAccount() {
    if (!token || !current) { showGate(); return; }
    const parent = mainWindow(); if (!parent) return;
    if (accountWindow && !accountWindow.isDestroyed()) {
      if (accountWindow.isMinimized()) accountWindow.restore();
      accountWindow.show(); accountWindow.focus(); return;
    }
    const area = screen.getDisplayMatching(parent.getBounds()).workArea;
    const width = Math.min(960, Math.max(360, area.width - 64));
    const height = Math.min(760, Math.max(420, area.height - 64));
    const window = new BrowserWindow({
      parent, modal: !entered, title: '聚禾客服平台 · 用户状态',
      width, height, minWidth: Math.min(680, width), minHeight: Math.min(520, height),
      x: Math.round(area.x + (area.width - width) / 2), y: Math.round(area.y + (area.height - height) / 2),
      show: false, frame: false, resizable: true, maximizable: false, fullscreenable: false,
      autoHideMenuBar: true, skipTaskbar: true, backgroundColor: '#f3f6fc',
      icon: path.join(root, 'dist/assets/juhe-logo-mark.png'),
      webPreferences: { nodeIntegration: true, contextIsolation: false, webSecurity: true }
    });
    accountWindow = window; window.setMenuBarVisibility(false); watchWindowControls(window);
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', event => event.preventDefault());
    window.once('ready-to-show', () => { if (accountWindow === window && !window.isDestroyed()) { window.show(); window.focus(); } });
    window.once('closed', () => { if (accountWindow === window) accountWindow = null; });
    window.loadFile(gateFile);
  }
  function enterWorkbench() {
    const window = mainWindow(); if (!window) return;
    if (!entered) {
      window.setFullScreen(false); window.setResizable(true); entered = true;
      try { onEnter(legacyUser()); } catch (error) { entered = false; throw error; }
    }
    closeAccountWindow(); focusMain();
  }
  async function request(route, data, signed = false, timeoutMs = 8000) {
    const epoch = generation, method = data === undefined ? 'GET' : 'POST', raw = data === undefined ? '' : JSON.stringify(data), headers = { 'Content-Type': 'application/json' };
    if (signed) {
      const stamp = String(Date.now()), nonce = crypto.randomBytes(24).toString('hex');
      Object.assign(headers, { Authorization: `Bearer ${token}`, 'X-Time': stamp, 'X-Nonce': nonce, 'X-Signature': crypto.sign(null, Buffer.from([method, route, stamp, nonce, sha(raw)].join('\n')), key).toString('base64') });
    }
    let res;
    try { res = await fetch(base + route, { method, headers, body: data === undefined ? undefined : raw, signal: AbortSignal.timeout(timeoutMs) }); }
    catch { throw Error('无法连接授权服务，请检查服务是否启动或网络连接'); }
    const result = await res.json();
    if (epoch !== generation) throw Error('登录状态已改变，请重试');
    if (!res.ok) throw Object.assign(new Error(result.message || '请求失败'), { status: res.status, code: result.code, deviceLimit: result.deviceLimit });
    return result;
  }
  function legacyUser() {
    if (!current) return null;
    const date = new Date(current.expiresAt || 0), pad = n => String(n).padStart(2, '0');
    return { userId: current.id, userName: current.username, remark: current.username, avatar: '', phone: '', password: '', money: 0, ispay: current.active ? 1 : 0, shopNum: null, shopUnlimited: true, deviceLimit: current.deviceLimit, aiNumber: 0, aiNumberMax: 0,
      expireTime: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
      status: 1, openid: '', roles: [{ roleKey: 'saaszikf', roleName: '聚禾客户' }], firstLogin: false };
  }
  async function refresh() { const r = await request('/v1/me', undefined, true); setUser(r.user); return r; }
  async function logout() {
    try { if (token) await request('/v1/logout', {}, true); } catch {}
    generation++; token = ''; current = null; verifiedAt = 0; notice='已退出登录'; onState(null, false); showGate(); return {};
  }
  function trusted(event) {
    const window = mainWindow();
    if (event.sender !== window?.webContents && event.sender !== accountWindow?.webContents) return false;
    if (event.senderFrame !== event.sender.mainFrame) return false;
    try { const file = fileURLToPath(event.senderFrame.url); const rel = path.relative(path.join(root, 'dist'), file); return rel && !rel.startsWith('..') && !path.isAbsolute(rel); } catch { return false; }
  }
  function registerBusinessContents(contents) {
    if (!contents || contents.isDestroyed()) throw Error('业务页面已关闭');
    businessContents.add(contents);
  }
  function trustedBusiness(event, action) {
    if (!entered || !businessActions.has(action) || !businessContents.has(event.sender)) return false;
    if (event.sender.isDestroyed() || event.senderFrame !== event.sender.mainFrame) return false;
    try { return path.relative(path.join(root, 'dist'), fileURLToPath(event.senderFrame.url)) === 'index.html'; }
    catch { return false; }
  }
  async function call(event, action, data = {}) {
    if (!trusted(event) && !trustedBusiness(event, action)) throw Error('页面无权访问账号接口');
    try {
      if (action === 'phone-register-send') return await request('/v1/phone/register/send',{phone:data.phone},false,20000);
      if (action === 'phone-register') return await request('/v1/phone/register',{phone:data.phone,challengeId:data.challengeId,code:data.code,password:data.password});
      if (action === 'updates-check') return await updates.check();
      if (action === 'updates-show') return updates.show();
      if (action === 'updates-dismiss') return updates.dismiss();
      if (action === 'updates-download') return await updates.download();
      if (action === 'security-status') return await request('/v1/security/status',undefined,true);
      if (action === 'phone-send') {
        const purpose=data.purpose,payload=purpose==='change'?{purpose}:purpose==='reset'?{purpose,phone:data.phone}:{purpose,phone:data.phone,password:data.password};
        return await request('/v1/phone/send',payload,purpose==='bind'||purpose==='change',20000);
      }
      if (action === 'phone-bind') return await request('/v1/phone/bind',{phone:data.phone,code:data.code,challengeId:data.challengeId},true);
      if (action === 'phone-reset') return await request('/v1/phone/reset',{phone:data.phone,code:data.code,challengeId:data.challengeId,newPassword:data.newPassword});
      if (action === 'password-change') {const r=await request('/v1/password/change',{challengeId:data.challengeId,code:data.code,newPassword:data.newPassword},true);generation++;token='';current=null;verifiedAt=0;notice=r.message;onState(null,false);showGate();return r;}
      if (action === 'login') {
        generation++; const c = await request('/v1/challenge', { publicKey });
        const r = await request('/v1/login', { username: data.username, password: data.password, deviceName:require('node:os').hostname(), challenge: c.challenge, signature: crypto.sign(null, Buffer.from(c.challenge), key).toString('base64') });
        token = r.token; notice=''; setUser(r.user);
        if (active()) enterWorkbench(); else showAccount();
        return { user: current, windowMode: entered ? 'workbench' : 'account' };
      }
      if (action === 'state') return { user: current, active: active(), version: app.getVersion(), notice, windowMode: event.sender === accountWindow?.webContents ? 'account' : 'login', workbenchOpen: entered, windowState: windowState(BrowserWindow.fromWebContents(event.sender)) };
      if (action === 'window-minimize') { BrowserWindow.fromWebContents(event.sender).minimize(); return {}; }
      if (action === 'window-toggle-fullscreen') {
        const window=BrowserWindow.fromWebContents(event.sender);
        if(!windowState(window).canFullscreen)throw Error('此窗口不支持全屏');
        const fullscreen=window.isFullScreen();window.setFullScreen(!fullscreen);
        if(fullscreen&&window.isMaximized())window.unmaximize();
        return {};
      }
      if (action === 'snapshot') { await refresh(); if (!active()) throw Error('请先激活套餐'); return { user: legacyUser() }; }
      if (action === 'me') return await refresh();
      if (action === 'devices') return await request('/v1/devices', undefined, true);
      if (action === 'unbind') { const r = await request('/v1/devices/unbind', {id:data.id}, true); if(r.loggedOut) { generation++; token=''; current=null; verifiedAt=0; notice='当前设备已解除绑定，请重新登录'; onState(null,false); showGate(); } return r; }
      if (action === 'redeem') { const r = await request('/v1/redeem', { code: data.code }, true); setUser(r.user); return { user: current }; }
      if (action === 'enter') { await refresh(); if (!active()) throw Error('套餐未激活或已到期，请先兑换授权码'); enterWorkbench(); return {}; }
      if (action === 'show') { showAccount(); return {}; }
      if (action === 'logout') return await logout();
      if (action === 'close') {
        if (event.sender === accountWindow?.webContents) { closeAccountWindow(); focusMain(); }
        else app.quit();
        return {};
      }
      if (action === 'compat') {
        if (!active()) { showGate(); throw Error('授权未验证，请重新登录或激活'); }
        if (data.url === '/cline/getuserinfo') { await refresh(); return { data: legacyUser() }; }
        return await request('/v1/compat', data, true);
      }
      throw Error('操作不支持');
    } catch (e) {
      if (e.status === 401 && token) { generation++; token = ''; current = null; verifiedAt = 0; notice='登录已失效，请重新登录；如电脑在线名额已满，请先退出或解绑其他设备'; onState(null, false); showGate(); }
      return { error: e.message, status: e.status || 0, code: e.code, deviceLimit: e.deviceLimit };
    }
  }
  ipcMain.handle('juhe-auth:call', call);
  const timer = setInterval(async () => {
    if (!token || polling) return; polling = true;
    const epoch = generation;
    try { await refresh(); if (!active() && entered) showGate(); }
    catch (e) { if (epoch === generation) { verifiedAt = 0; if (e.status === 401) { generation++; token = ''; current = null; notice='登录已失效，请重新登录；如电脑在线名额已满，请先退出或解绑其他设备'; } onState(current, false); if (entered || e.status === 401) showGate(); } }
    finally { polling = false; }
  }, 15_000); timer.unref();
  let quitPromise;
  function prepareQuit() {
    clearInterval(timer); closeAccountWindow();
    if (!quitPromise) quitPromise = (async () => {
      try { if (token) await request('/v1/logout', {}, true, 1500); } catch {}
      generation++; token=''; current=null; verifiedAt=0;
    })();
    return quitPromise;
  }
  let quitting=false;
  app.on('before-quit', event => {
    clearInterval(timer);
    if (!token || quitting) return;
    event.preventDefault(); quitting=true; prepareQuit().finally(()=>app.quit());
  });
  return { active, showGate, showLogin: showGate, showAccount, isTrusted: trusted, isTrustedBusiness: event => trustedBusiness(event, 'snapshot'), registerBusinessContents, logout, legacyUser, gateFile, prepareQuit };
};
