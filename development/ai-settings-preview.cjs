'use strict';
// Offline preview of the AI 配置 window in a normal browser, for UI review only.
// It runs the real settings controller, knowledge/product stores and runtime
// against a temporary data folder. The model is simulated: no request leaves the
// machine, whatever API address or key is typed into 模型连接.
//
//   node development/ai-settings-preview.cjs   →  http://127.0.0.1:5179
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), http = require('node:http');
const root = path.resolve(__dirname, '..', 'app-asar');
const {createRuntime} = require(path.join(root, 'dist-electron', 'juhe-ai-runtime.cjs'));
const {createAiSettings} = require(path.join(root, 'dist-electron', 'juhe-ai-settings.cjs'));

const port = Number(process.env.PORT) || 5179;
const dataDir = process.env.JUHE_PREVIEW_DATA || path.join(os.tmpdir(), 'juhe-ai-settings-preview');
fs.mkdirSync(dataDir, {recursive: true});

const shops = [
  {id: '101', shopName: '测试拼多多店', merchantName: '', platformType: '拼多多', status: 1, subAccountInfo: ''},
  {id: '102', shopName: '测试抖店', merchantName: '', platformType: '抖店', status: 1, subAccountInfo: ''}
];
let globalConfig = {aiReplyStrategy: 'AI_RGA', aiHumanReplyType: 0, subAccount: '', aiSensitiveWords: [], aiReplyFlag: '.', aiWorkMode: 0, globalAiReplySwitch: 1};
const shopConfig = {};
let globalSwitch;

// Fake safeStorage: readable encoding, acceptable only because this is a
// throwaway preview folder and the simulated model never uses the key.
const safeStorage = {
  isEncryptionAvailable: () => true,
  encryptString: value => Buffer.from('preview:' + value, 'utf8'),
  decryptString: buffer => buffer.toString('utf8').replace(/^preview:/, '')
};

function simulatedReply(body) {
  const messages = body.messages || body.input || [];
  const first = String(messages[0]?.content || '');
  if (first.startsWith('Reply with exactly OK')) return 'OK';
  if (first.startsWith('从商品原始文字')) {
    // Learning rejects facts that are not verbatim source text, so quote the
    // first line of the product text as the single simulated fact.
    const line = String(messages[1]?.content || '').split('\n').map(item => item.trim()).find(Boolean) || '';
    const value = line.slice(0, 40);
    return JSON.stringify({summary: '（离线模拟）' + value, facts: value ? [{field: '商品资料', value, evidence: value}] : []});
  }
  let sources = [];
  try { sources = JSON.parse(messages[1].content).sources || []; } catch {}
  if (!sources.length) return JSON.stringify({answer: '您好，请问有什么可以帮您？（离线模拟）', needsHuman: false, reason: '问候', sourceIds: []});
  return JSON.stringify({answer: '（离线模拟润色）' + String(sources[0].content).slice(0, 300), needsHuman: false, reason: '依据：' + sources[0].title, sourceIds: [sources[0].id]});
}
async function fetchImpl(url, options) {
  const body = JSON.parse(options.body), text = simulatedReply(body);
  const payload = String(url).endsWith('/responses') ? {output_text: text} : {choices: [{message: {content: text}}]};
  return {ok: true, status: 200, headers: {get: () => null}, body: [Buffer.from(JSON.stringify(payload), 'utf8')]};
}

const runtime = createRuntime({
  getDirectory: () => dataDir, getScope: () => 'preview', authorized: () => true,
  getGlobalConfig: () => ({...globalConfig, globalAiReplySwitch: globalSwitch ?? 1}),
  getShopConfig: id => shopConfig[id]?.isEnabled ? shopConfig[id] : globalConfig,
  safeStorage, fetchImpl
});
const settings = createAiSettings({
  BrowserWindow: class {}, ipcMain: {handle() {}, on() {}}, root,
  authorized: () => true, trustedBusiness: () => true, getDirectory: () => dataDir,
  getSnapshot: () => ({shops, warnings: ['离线预览：模型回复为模拟结果，店铺为示例数据，不会联网或发送消息。'], globalConfig, singleShopConfig: shopConfig}),
  getConfig: id => id == null ? globalConfig : (shopConfig[id] || null),
  saveConfig: (id, config) => {
    if (id == null) { globalConfig = {...globalConfig, ...config}; return globalConfig; }
    shopConfig[id] = config; return config;
  },
  getSwitch: () => globalSwitch, saveSwitch: value => { globalSwitch = value; },
  runtime
});

const shim = `window.juheAi={call:(action,data)=>fetch('/__call',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,data})}).then(r=>r.json()).then(r=>{if(r.error)throw Error(r.error);return r.result;}),onSelection:()=>()=>{}};`;
const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'};

http.createServer(async (request, response) => {
  const send = (status, type, body) => { response.writeHead(status, {'content-type': type + '; charset=utf-8', 'cache-control': 'no-store'}); response.end(body); };
  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (request.method === 'POST' && url.pathname === '/__call') {
      let raw = ''; for await (const chunk of request) raw += chunk;
      const {action, data} = JSON.parse(raw || '{}');
      try { send(200, 'application/json', JSON.stringify({result: await settings.call({}, action, data ?? {})})); }
      catch (error) { send(200, 'application/json', JSON.stringify({error: error.message})); }
      return;
    }
    if (url.pathname === '/__preview-shim.js') return send(200, 'text/javascript', shim);
    const name = url.pathname === '/' ? 'juhe-ai-settings.html' : decodeURIComponent(url.pathname.slice(1));
    const file = path.resolve(root, 'dist', name);
    if (!file.startsWith(path.join(root, 'dist') + path.sep) || !fs.existsSync(file)) return send(404, 'text/plain', 'Not found');
    let body = fs.readFileSync(file);
    if (name === 'juhe-ai-settings.html') {
      body = body.toString('utf8').replace("connect-src 'none'", "connect-src 'self'")
        .replace('<script src="./juhe-ai-settings.js" defer></script>', '<script src="./__preview-shim.js"></script>\n  <script src="./juhe-ai-settings.js" defer></script>');
    }
    send(200, types[path.extname(file)] || 'application/octet-stream', body);
  } catch (error) { send(500, 'text/plain', String(error.message)); }
}).listen(port, '127.0.0.1', () => console.log(`AI 配置离线预览：http://127.0.0.1:${port}  （数据目录 ${dataDir}）`));
