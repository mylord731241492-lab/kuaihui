const path = require('node:path');
const {fileURLToPath} = require('node:url');
const {createKnowledgeStore} = require('./juhe-ai-knowledge.cjs');

function shopId(value) {
  const id = String(value ?? '');
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id) || ['__proto__', 'constructor', 'prototype'].includes(id)) throw Error('请选择有效的店铺');
  return id;
}
function normalizeConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('AI 设置格式不正确');
  const strategy = value.aiReplyStrategy ?? 'AI_RGA';
  const transfer = Number(value.aiHumanReplyType ?? 0), mode = Number(value.aiWorkMode ?? 0);
  if (!['AI_RGA', 'AI_RGA_FILTER'].includes(strategy) || ![0,1,2].includes(transfer) || ![0,1].includes(mode)) throw Error('AI 设置选项不正确');
  const words = value.aiSensitiveWords ?? [];
  if (!Array.isArray(words) || words.length > 2000 || words.some(word => typeof word !== 'string' || word.length > 200)) throw Error('敏感词格式不正确（最多 2000 个，每个 200 字）');
  const account = value.subAccount ?? '', flag = value.aiReplyFlag ?? '.';
  if (typeof account !== 'string' || account.length > 4000 || typeof flag !== 'string' || flag.length > 100) throw Error('子账号或回复标识过长');
  const result = {aiReplyStrategy:strategy, aiHumanReplyType:transfer, subAccount:account, aiSensitiveWords:[...new Set(words.map(word=>word.trim()).filter(Boolean))], aiReplyFlag:flag, aiWorkMode:mode};
  if (Object.hasOwn(value, 'isEnabled')) {
    if (typeof value.isEnabled !== 'boolean') throw Error('单店设置开关格式不正确');
    result.isEnabled = value.isEnabled;
  }
  return result;
}

function createAiSettings({BrowserWindow, ipcMain, root, authorized, trustedBusiness, getDirectory, getSnapshot, getConfig, saveConfig, getSwitch, saveSwitch, runtime}) {
  const file = path.join(root, 'dist', 'juhe-ai-settings.html');
  const knowledge = createKnowledgeStore({getDirectory});
  let window = null, selection = {};
  function owns(event) {
    if (!window || window.isDestroyed() || event.sender !== window.webContents || event.senderFrame !== event.sender.mainFrame) return false;
    try { return path.resolve(fileURLToPath(event.senderFrame.url)) === path.resolve(file); } catch { return false; }
  }
  function trusted(event) { return authorized() && (owns(event) || trustedBusiness(event)); }
  function call(event, action, data = {}) {
    if (!trusted(event)) throw Error('请在已登录的 AI 设置页面操作');
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('设置参数不正确');
    if (action === 'snapshot') return {...getSnapshot(), globalSwitch:getSwitch() ?? 1, selection};
    if (action === 'config-get') return getConfig(data.shopId == null ? null : shopId(data.shopId));
    if (action === 'config-save') return saveConfig(data.shopId == null ? null : shopId(data.shopId), normalizeConfig(data.config));
    if (action === 'switch-get') return {value:getSwitch() ?? 1};
    if (action === 'switch-initialize') {
      if (data.value !== 0 && data.value !== 1) throw Error('AI 开关值不正确');
      if (getSwitch() == null) saveSwitch(data.value);
      return {value:getSwitch()};
    }
    if (action === 'switch-save') {
      if (data.value !== 0 && data.value !== 1) throw Error('AI 开关值不正确');
      saveSwitch(data.value); return {value:data.value};
    }
    if (typeof action === 'string' && ['list','save','delete','import','copy','export'].some(name => action === 'knowledge-' + name)) return knowledge.call(action.slice(10), data);
    if (['runtime-status','runtime-config-save','runtime-test','runtime-preview','runtime-history','products-list','product-save','product-delete','product-learn','products-collect'].includes(action)) {
      if (!runtime) throw Error('本地 AI 运行模块未准备好');
      return runtime.call(action, data);
    }
    throw Error('不支持此 AI 设置操作');
  }
  function open(event, payload = {}) {
    if (!trusted(event)) throw Error('请先登录后打开 AI 配置');
    selection = {};
    if (payload && payload.shopId != null) selection.shopId = shopId(payload.shopId);
    if (payload && typeof payload.entryId === 'string') selection.entryId = payload.entryId.slice(0,128);
    // Old remote IDs never become local IDs. A supplied question is an unsaved draft.
    if (payload?.record && typeof payload.record === 'object') selection.record = Object.fromEntries(['title','content','scenarios','sendType','titleType','goodId','imageurls'].filter(key => Object.hasOwn(payload.record,key)).map(key=>[key,payload.record[key]]));
    if (window && !window.isDestroyed()) {
      if (window.isMinimized()) window.restore(); window.show(); window.focus();
      window.webContents.send('juhe-ai:selection', selection); return;
    }
    const created = new BrowserWindow({width:1140,height:800,minWidth:850,minHeight:620,show:false,title:'AI 配置 · 聚禾客服平台',autoHideMenuBar:true,backgroundColor:'#f5f7fb',webPreferences:{preload:path.join(root,'dist-electron','juhe-ai-preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
    window = created;
    created.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    created.webContents.on('will-navigate', event=>event.preventDefault());
    created.once('closed',()=>{if(window===created)window=null;});
    created.once('ready-to-show',()=>{if(!created.isDestroyed()){created.show();created.focus();}});
    created.loadFile(file).catch(()=>{if(!created.isDestroyed())created.destroy();});
  }
  ipcMain.handle('juhe-ai:call', call);
  ipcMain.on('open-local-ai-settings', (event,payload)=>{try{open(event,payload);}catch(error){if(!event.sender.isDestroyed())event.sender.send('juhe-ai:error',error.message);}});
  return {call,open};
}
module.exports = {createAiSettings, normalizeConfig};
