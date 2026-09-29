'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { pathToFileURL, fileURLToPath } = require('node:url');
const reportFile = path.join(__dirname, 'ai-settings-controller-results.json');
const report = { at: new Date().toISOString(), passed: false, status: 'running', checks: [], scope: 'Production controller and real auth trust predicate; simulated Electron window/events; temporary local knowledge files; no network' };
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n', 'utf8');
const { createAiSettings, normalizeConfig } = require('../app-asar/dist-electron/juhe-ai-settings.cjs');

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'juhe-ai-controller-'));
const root = path.join(temporary, 'app');
const checks = report.checks;
const authSource = fs.readFileSync(path.join(__dirname, '../app-asar/dist-electron/juhe-auth.cjs'), 'utf8');
const authStart = authSource.indexOf('  function registerBusinessContents(contents)');
const authEnd = authSource.indexOf('  async function call(event, action, data', authStart);
assert(authStart >= 0 && authEnd > authStart, 'Auth predicate source must be present');
const auth = vm.createContext({ path, fileURLToPath, root, entered: true, businessActions: new Set(['snapshot', 'compat', 'show']), businessContents: new WeakSet() });
vm.runInContext(authSource.slice(authStart, authEnd), auth);
const ipcMain = new EventEmitter();
const handlers = new Map();
ipcMain.handle = (name, handler) => { assert(!handlers.has(name)); handlers.set(name, handler); };
let authorized = true, directory = path.join(temporary, 'account-a'), globalSwitch = 1, switchWrites = 0;
const configs = new Map();
const defaultConfig = { aiReplyStrategy: 'AI_RGA', aiHumanReplyType: 0, subAccount: '', aiSensitiveWords: [], aiReplyFlag: '.', aiWorkMode: 0 };
const clone = value => JSON.parse(JSON.stringify(value));
const windows = [];
class Contents extends EventEmitter {
  constructor(url) { super(); this.mainFrame = { url }; this.destroyed = false; this.sent = []; }
  isDestroyed() { return this.destroyed; }
  send(...args) { this.sent.push(args); }
  setWindowOpenHandler(handler) { this.openHandler = handler; }
}
class Window extends EventEmitter {
  constructor(options) { super(); this.options = options; this.webContents = new Contents('about:blank'); this.destroyed = false; this.shown = 0; this.focused = 0; this.minimized = false; windows.push(this); }
  isDestroyed() { return this.destroyed; }
  isMinimized() { return this.minimized; }
  restore() { this.minimized = false; }
  show() { this.shown++; }
  focus() { this.focused++; }
  loadFile(file) { this.webContents.mainFrame.url = pathToFileURL(file).href; return Promise.resolve(); }
  destroy() { this.destroyed = true; this.webContents.destroyed = true; this.emit('closed'); }
}
const controller = createAiSettings({
  BrowserWindow: Window, ipcMain, root,
  runtime: {call: (action,data) => ({action,data,fixture:true})},
  authorized: () => authorized,
  trustedBusiness: event => auth.trustedBusiness(event, 'snapshot'),
  getDirectory: () => directory,
  getSnapshot: () => ({ shops: [{ id: 101, shopName: '测试店铺' }], globalConfig: clone(configs.get('global') || defaultConfig), singleShopConfig: {} }),
  getConfig: id => clone(configs.get(id === null ? 'global' : id) || defaultConfig),
  saveConfig: (id, config) => { configs.set(id === null ? 'global' : id, clone(config)); return clone(config); },
  getSwitch: () => globalSwitch,
  saveSwitch: value => { globalSwitch = value; switchWrites++; }
});
const event = (contents, frame = contents.mainFrame) => ({ sender: contents, senderFrame: frame });
const main = new Contents(pathToFileURL(path.join(root, 'dist', 'index.html')).href + '#/index');
auth.registerBusinessContents(main);
const invoke = (sender, action, data) => handlers.get('juhe-ai:call')(sender, action, data);
function check(name, test) { test(); checks.push(name); }

try {
  check('real auth predicate accepts registered top-level business contents only', () => {
    assert.equal(invoke(event(main), 'snapshot').shops[0].id, 101);
    const unregistered = new Contents(main.mainFrame.url);
    assert.throws(() => invoke(event(unregistered), 'snapshot'), /已登录/);
    assert.throws(() => invoke(event(main, { url: main.mainFrame.url }), 'snapshot'), /已登录/);
    const original = main.mainFrame.url;
    main.mainFrame.url = 'https://example.test/';
    assert.throws(() => invoke(event(main), 'snapshot'), /已登录/);
    main.mainFrame.url = pathToFileURL(path.join(root, 'dist', 'other.html')).href;
    assert.throws(() => invoke(event(main), 'snapshot'), /已登录/);
    main.mainFrame.url = original;
    auth.entered = false;
    assert.throws(() => invoke(event(main), 'snapshot'), /已登录/);
    auth.entered = true;
  });
  check('local window ownership, preload isolation and singleton reopening', () => {
    controller.open(event(main), { shopId: 101, record: { id: 'old-remote-id', title: '草稿', content: '未保存' } });
    const window = windows[0];
    assert.equal(window.options.webPreferences.contextIsolation, true);
    assert.equal(window.options.webPreferences.nodeIntegration, false);
    assert.equal(window.options.webPreferences.sandbox, true);
    assert.deepEqual(window.webContents.openHandler({ url: 'https://example.test/' }), { action: 'deny' });
    let prevented = false;
    window.webContents.emit('will-navigate', { preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
    window.emit('ready-to-show');
    assert.equal(window.shown, 1);
    const snapshot = invoke(event(window.webContents), 'snapshot');
    assert.equal(snapshot.selection.shopId, '101');
    assert.equal(snapshot.selection.record.id, undefined, 'A remote record ID must not overwrite a local record');
    assert.equal(snapshot.selection.record.title, '草稿');
    assert.throws(() => invoke(event(window.webContents, { url: window.webContents.mainFrame.url }), 'snapshot'), /已登录/);
    const correctUrl = window.webContents.mainFrame.url;
    window.webContents.mainFrame.url = pathToFileURL(path.join(root, 'dist', 'index.html')).href;
    assert.throws(() => invoke(event(window.webContents), 'snapshot'), /已登录/);
    window.webContents.mainFrame.url = correctUrl;
    window.minimized = true;
    controller.open(event(main), { shopId: 102 });
    assert.equal(windows.length, 1);
    assert.equal(window.minimized, false);
    assert.equal(window.webContents.sent.at(-1)[0], 'juhe-ai:selection');
    assert.equal(window.webContents.sent.at(-1)[1].shopId, '102');
    window.destroy();
    assert.throws(() => invoke(event(window.webContents), 'snapshot'), /已登录/);
    controller.open(event(main));
    assert.equal(windows.length, 2);
    assert.deepEqual(invoke(event(windows[1].webContents), 'snapshot').selection, {});
  });
  check('configuration schema follows real boolean switches and validates enums', () => {
    const config = { ...defaultConfig, aiReplyStrategy: 'AI_RGA_FILTER', aiHumanReplyType: '1', subAccount: '客服一', aiSensitiveWords: ['  人工  ', '人工', ''], aiReplyFlag: '', aiWorkMode: '1', isEnabled: false };
    const saved = invoke(event(main), 'config-save', { shopId: 101, config });
    assert.equal(saved.isEnabled, false);
    assert.equal(saved.aiHumanReplyType, 1);
    assert.equal(saved.aiWorkMode, 1);
    assert.equal(saved.aiReplyFlag, '');
    assert.deepEqual(saved.aiSensitiveWords, ['人工']);
    assert.deepEqual(invoke(event(main), 'config-get', { shopId: '101' }), saved);
    for (const value of ['false', '0', '1', 0, 1, {}, null]) assert.throws(() => normalizeConfig({ ...defaultConfig, isEnabled: value }), /开关格式/);
    for (const changes of [{ aiReplyStrategy: 'unknown' }, { aiHumanReplyType: 3 }, { aiWorkMode: -1 }, { aiSensitiveWords: ['正常', {}] }]) assert.throws(() => normalizeConfig({ ...defaultConfig, ...changes }));
    assert.throws(() => invoke(event(main), 'config-save', { shopId: '__proto__', config }), /有效的店铺/);
    assert.throws(() => invoke(event(main), 'switch-save', { value: '0' }), /开关值/);
    assert.deepEqual(invoke(event(main), 'switch-save', { value: 0 }), { value: 0 });
    assert.equal(invoke(event(main), 'snapshot').globalSwitch, 0);
  });
  check('knowledge actions retain account boundaries and reject forged scope or paths', () => {
    const first = invoke(event(main), 'knowledge-save', { record: { title: '本地问题', content: '本地答案' } }).record;
    assert.equal(first.shopId, '__shared__');
    assert.equal(invoke(event(windows[1].webContents), 'knowledge-list').records[0].id, first.id);
    assert.throws(() => invoke(event(main), 'knowledge-save', { scope: 'forged', record: { title: '不允许', content: '不允许' } }), /不支持的字段/);
    assert.throws(() => invoke(event(main), 'knowledge-export', { path: path.join(temporary, 'elsewhere') }), /不支持的字段/);
    const accountA = directory;
    directory = path.join(temporary, 'account-b');
    assert.equal(invoke(event(main), 'knowledge-list').records.length, 0);
    directory = accountA;
    assert.equal(invoke(event(main), 'knowledge-list').records[0].id, first.id);
    assert.throws(() => invoke(event(main), 'logout'), /不支持/);
  });
  check('first-upgrade switch initialization writes only when the native value is missing', () => {
    globalSwitch = undefined;
    const before = switchWrites;
    assert.equal(invoke(event(main), 'switch-get').value, 1);
    assert.equal(globalSwitch, undefined, 'Reading the default must not prevent legacy preference migration');
    assert.throws(() => invoke(event(main), 'switch-initialize', { value: '0' }), /开关值/);
    assert.equal(globalSwitch, undefined);
    assert.deepEqual(invoke(event(main), 'switch-initialize', { value: 0 }), { value: 0 });
    assert.equal(switchWrites, before + 1);
    assert.deepEqual(invoke(event(main), 'switch-initialize', { value: 1 }), { value: 0 });
    assert.equal(switchWrites, before + 1, 'An existing native off value must not be overwritten by a stale on value');
    assert.equal(invoke(event(main), 'snapshot').globalSwitch, 0);
    globalSwitch = 1;
    assert.deepEqual(invoke(event(main), 'switch-initialize', { value: 0 }), { value: 1 });
    assert.equal(switchWrites, before + 1, 'An existing native on value must also remain authoritative');
    globalSwitch = undefined;
    assert.deepEqual(invoke(event(main), 'switch-initialize', { value: 1 }), { value: 1 });
    assert.equal(switchWrites, before + 2);
  });
  check('revoked account or destroyed frame blocks every read and write route', () => {
    authorized = false;
    for (const sender of [event(main), event(windows[1].webContents)]) {
      for (const action of ['snapshot', 'config-get', 'config-save', 'switch-save', 'switch-initialize', 'knowledge-list', 'knowledge-save', 'runtime-status', 'runtime-config-save', 'runtime-test', 'runtime-preview', 'runtime-history', 'products-list', 'product-save', 'product-learn', 'products-collect']) assert.throws(() => invoke(sender, action, {}), /已登录/);
      assert.throws(() => controller.open(sender), /先登录/);
    }
    authorized = true;
    main.destroyed = true;
    assert.throws(() => invoke(event(main), 'snapshot'), /已登录/);
    main.destroyed = false;
    windows[1].destroy();
    assert.throws(() => invoke(event(windows[1].webContents), 'knowledge-list'), /已登录/);
  });
  check('runtime action allowlist uses the same trusted frame boundary',()=>{
    const data={shopId:'101'};
    for(const action of ['runtime-status','runtime-config-save','runtime-test','runtime-preview','runtime-history','products-list','product-save','product-delete','product-learn','products-collect']){
      assert.deepEqual(invoke(event(main),action,data),{action,data,fixture:true});
      assert.throws(()=>invoke(event(new Contents(main.mainFrame.url)),action,data),/已登录/);
      assert.throws(()=>invoke(event(main,{url:main.mainFrame.url}),action,data),/已登录/);
    }
    assert.throws(()=>invoke(event(main),'runtime-read-file',{}),/不支持/);
  });
  report.passed = true;
  report.status = 'complete';
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.passed = false;
  report.status = 'failed';
  report.error = error.stack || String(error);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n', 'utf8');
  throw error;
} finally {
  const resolved = path.resolve(temporary), parent = path.resolve(os.tmpdir());
  if (path.dirname(resolved) === parent && path.basename(resolved).startsWith('juhe-ai-controller-')) fs.rmSync(resolved, { recursive: true, force: true });
}
