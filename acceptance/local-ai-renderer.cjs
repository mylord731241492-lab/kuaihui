// Run from any directory: node acceptance/local-ai-renderer.cjs
// Exercises shipped renderer functions with local IPC mocks; no server or model calls.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const base = path.resolve(__dirname, '../app-asar/dist/assets');
const read = name => fs.readFileSync(path.join(base, name), 'utf8');
const core = read('index-Ct5UuHQN.js');
const settings = read('index-DjoMJELL.js');
const main = read('index-CGzMkKvq.js');
const results = [];
const cut = (source, start, end, offset = 0) => {
  const a = source.indexOf(start, offset);
  assert(a >= 0, `Missing start: ${start}`);
  const b = source.indexOf(end, a + start.length);
  assert(b > a, `Missing end: ${end}`);
  return source.slice(a + start.length, b).replace(/,\s*$/, '');
};
const test = async (name, run) => {
  try { await run(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.stack }); }
};
(async () => {
  for (const name of ['index-Ct5UuHQN.js', 'index-DjoMJELL.js', 'index-BBVfS0_y.js', 'index-CGzMkKvq.js', 'AiModal-jByqgfbK.js', 'modal-jyfXxgks.js', 'juhe-local-ai-entry.js']) {
    await test(`syntax: ${name}`, () => {
      const checked = spawnSync(process.execPath, ['--check', path.join(base, name)], { encoding: 'utf8' });
      assert.equal(checked.status, 0, checked.stderr);
    });
  }
  const calls = [], notices = [];
  let storedGlobal = { aiReplyStrategy: 'AI_RGA', aiHumanReplyType: 0, subAccount: '', aiSensitiveWords: ['keep'], aiReplyFlag: '~', aiWorkMode: 1 };
  const storedShops = {};
  let fail = '';
  const local = async (operation, payload = {}) => {
    calls.push({ operation, payload: structuredClone(payload) });
    if (operation === fail) throw Error('local disk failed');
    if (operation === 'config-get') return payload.shopId == null ? storedGlobal : storedShops[payload.shopId] ?? null;
    if (operation === 'config-save') {
      if (payload.shopId == null) storedGlobal = structuredClone(payload.config);
      else storedShops[payload.shopId] = structuredClone(payload.config);
      return structuredClone(payload.config);
    }
    if (operation === 'snapshot') return { shops: [{ id: 7, platformType: '拼多多', shopName: '本地店铺', subAccountInfo: '测试' }], globalConfig: storedGlobal, singleShopConfig: storedShops };
    if (operation === 'switch-save') return { value: payload.value };
    throw Error('Unexpected local operation: ' + operation);
  };
  const api = { window: { juheLocalAiCall: local } };
  vm.createContext(api);
  vm.runInContext('async function QC' + cut(core, 'async function QC', '\nfunction ex') + '\nasync function tx' + cut(core, 'async function tx', '\nfunction rx'), api);
  await test('config: global and missing single-shop reads use local storage', async () => {
    const global = await api.QC({ configType: 1, userId: 999 });
    assert.deepEqual(JSON.parse(global.configContent), storedGlobal);
    const absent = await api.QC({ configType: 2, shopId: 7 });
    assert.equal(absent.configContent, null);
  });
  await test('config: single-shop save persists before resolving and is readable', async () => {
    const config = { isEnabled: true, aiWorkMode: 1, aiSensitiveWords: ['local'] };
    await api.tx([{ configType: 2, shopId: 7, configContent: JSON.stringify(config) }]);
    const result = await api.QC({ configType: 2, shopId: 7 });
    assert.deepEqual(JSON.parse(result.configContent), config);
  });
  await test('config: invalid batch is rejected before any writes', async () => {
    calls.length = 0;
    await assert.rejects(api.tx([{ configType: 1, configContent: '{}' }, { configType: 2, configContent: '{}' }]), /选择店铺/);
    assert.equal(calls.length, 0);
  });
  await test('config: disk error reaches caller without reporting success', async () => {
    fail = 'config-save';
    await assert.rejects(api.tx([{ configType: 1, configContent: '{}' }]), /local disk failed/);
    fail = '';
  });
  const ai = {
    window: { juheLocalAiCall: local }, fe: api.QC, ge: api.tx,
    n: { aiReplyConfig: { ...storedGlobal }, globalAiReplySwitch: 1 },
    r: { userInfo: { userId: 1 } }, i: { value: false }, v: { value: 1 },
    h: { value: false }, c: { value: [] }, p: { value: {} },
    ue: { deepClone: value => structuredClone(value) },
    a: Object.fromEntries(['error', 'success'].map(type => [type, text => notices.push({ type, text })])),
    J: { postMessage: () => { throw Error('Unexpected duplicate IPC write'); } },
  };
  vm.createContext(ai);
  const offset = settings.indexOf('__name: "AIAgentSet"');
  for (const [name, end] of [['m', 'f'], ['f', 'g'], ['g', 'y'], ['w', 'C']]) {
    vm.runInContext(`${name} = ` + cut(settings, `          ${name} = `, `\n          ${end} = `, offset), ai);
  }
  await test('settings: transfer account choices come from local shop snapshot', async () => {
    await ai.m();
    assert.equal(ai.c.value[0].id, 7);
    assert.equal(ai.p.value[7], '测试');
  });
  await test('settings: absent global config preserves the existing local draft', async () => {
    const saved = storedGlobal;
    storedGlobal = null;
    const original = ai.n.aiReplyConfig;
    await ai.f();
    assert.equal(ai.n.aiReplyConfig, original);
    storedGlobal = saved;
  });
  await test('settings: saved global config reports success without duplicate IPC', async () => {
    notices.length = 0;
    await ai.g();
    assert.equal(notices.length, 1);
    assert.equal(notices[0].type, 'success');
  });
  await test('settings: failed save keeps draft and displays the storage error', async () => {
    fail = 'config-save'; notices.length = 0;
    const original = ai.n.aiReplyConfig;
    await ai.g();
    assert.equal(ai.n.aiReplyConfig, original);
    assert.equal(notices[0].type, 'error');
    assert.match(notices[0].text, /local disk failed/);
    fail = '';
  });
  await test('single-shop settings: save persists locally before closing', async () => {
    const events = [];
    const context = {
      fe: { value: { isEnabled: true, aiReplyStrategy: 'AI_RGA', aiHumanReplyType: 0, subAccount: '', aiSensitiveWords: ['single'], aiReplyFlag: '.', aiWorkMode: 1 } },
      ye: { value: 7 }, pe: { userInfo: { userId: 1 } }, ge: { value: false },
      ce: { singleShopAiReplyConfig: {} }, me: { value: {} },
      t: { deepClone: value => structuredClone(value) }, n: api.tx,
      v: { success: text => events.push(['success', text]), error: text => events.push(['error', text]) },
      we: () => events.push(['close']),
    };
    vm.createContext(context);
    vm.runInContext('save = ' + cut(read('index-BBVfS0_y.js'), '          _e = ', '\n          we = '), context);
    await context.save();
    assert.equal(storedShops[7].aiWorkMode, 1);
    assert.deepEqual(events.map(e => e[0]), ['success', 'close']);
    fail = 'config-save'; events.length = 0;
    await context.save(); fail = '';
    assert.equal(context.fe.value.isEnabled, true);
    assert.deepEqual(events.map(e => e[0]), ['error']);
    assert.match(events[0][1], /local disk failed/);
  });
  await test('switch: failure restores previous displayed value and is visible', async () => {
    fail = 'switch-save'; notices.length = 0;
    ai.v.value = 0;
    await ai.w(0);
    assert.equal(ai.v.value, 1); assert.equal(ai.n.globalAiReplySwitch, 1);
    assert.equal(notices[0].type, 'error'); fail = '';
  });
  await test('switch: local save success updates state once', async () => {
    calls.length = 0; notices.length = 0;
    await ai.w(0);
    assert.equal(ai.n.globalAiReplySwitch, 0);
    assert.equal(calls.length, 1); assert.equal(calls[0].operation, 'switch-save');
    assert.equal(notices[0].type, 'success');
  });
  await test('menu: local AI settings work with or without a selected shop', async () => {
    const sent = [], menu = { Me: { send: (...args) => sent.push(args) }, z: { value: undefined } };
    vm.createContext(menu);
    vm.runInContext('ps = ' + cut(main, '          ps = ', '\n          Cs = '), menu);
    await menu.ps({ key: 'aiConfig' }); menu.z.value = { id: 7 }; await menu.ps({ key: 'aiConfig' });
    assert.equal(sent[0][0], 'open-local-ai-settings'); assert.equal(sent[0][1].shopId, undefined);
    assert.equal(sent[1][1].shopId, 7);
  });
  await test('legacy knowledge entry: remote IDs cannot overwrite a local record', async () => {
    const mounted = [], sent = [];
    const context = {
      defineComponent: value => value, ref: value => ({ value }), onMounted: fn => mounted.push(fn), onBeforeUnmount: () => {},
      h: (tag, props, children) => ({ tag, props, children }),
      ipc: {
        invoke: async () => ({ data: { shop: { id: 7 }, editForm: { id: 'old-remote-id', title: '问题', content: '答案', scenarios: ['售前'], sendType: 1, titleType: 'type', goodId: 'good', imageurls: ['image'] } } }),
        send: (...args) => sent.push(args), postMessage: () => {}, on: () => {}, removeListener: () => {},
      },
    };
    vm.createContext(context);
    const source = read('juhe-local-ai-entry.js').replace(/^import .*;\r?\n/gm, '').replace('export function', 'function');
    vm.runInContext(source, context);
    const render = context.localAiEntry('AiModal', 'close-auto-reply-modal').setup();
    await mounted[0]();
    const tree = render();
    const buttons = tree.children.filter(node => node && node.tag === 'button');
    buttons[0].props.onClick();
    const payload = sent[0][1];
    assert.equal(payload.shopId, 7); assert.equal(payload.record.title, '问题');
    assert.equal(payload.entryId, undefined); assert.equal(payload.record.id, undefined);
    assert.deepEqual(Array.from(payload.record.scenarios), ['售前']);
    assert.equal(payload.record.sendType, 1); assert.equal(payload.record.titleType, 'type');
    assert.equal(payload.record.goodId, 'good'); assert.deepEqual(Array.from(payload.record.imageurls), ['image']);
    assert(tree.children.some(node => typeof node?.props === 'string' && node.props.includes('保存为新条目')));
  });
  await test('knowledge list edit: preserves scene and attachment fields as a new draft', async () => {
    const start = main.indexOf('Me.send("open-local-ai-settings", { shopId: K.value, record:');
    assert(start > 0);
    const end = main.indexOf(' })', start) + 3;
    const sent = [];
    const context = { K: { value: 7 }, e: { id: 'remote', title: 'q', content: 'a', scenarios: ['售后'], sendType: 1, title_type: '8', imageurls: ['url'], good_id: 'goods' }, Me: { send: (...args) => sent.push(args) } };
    vm.runInNewContext(main.slice(start, end), context);
    const draft = sent[0][1];
    assert.equal(draft.entryId, undefined); assert.equal(draft.record.id, undefined);
    assert.deepEqual(Array.from(draft.record.scenarios), ['售后']);
    assert.equal(draft.record.goodId, 'goods'); assert.equal(draft.record.titleType, '8');
    assert.equal(draft.record.sendType, 1); assert.deepEqual(Array.from(draft.record.imageurls), ['url']);
  });
  await test('legacy routes: knowledge dialogs no longer load unsupported remote editors', async () => {
    for (const name of ['AiModal-jByqgfbK.js', 'modal-jyfXxgks.js']) {
      const code = read(name);
      assert(code.includes('localAiEntry(')); assert(!code.includes('newAi-BxbCXy2V'));
    }
    const listener = cut(main, '            qt("set-global-ai-recommended-reply", ', '\n            qt("set-scroll-to-selected-shop"');
    assert(!listener.includes('ss(')); assert(!listener.includes('botStatus ='));
  });
  const report = { generatedAt: new Date().toISOString(), scope: 'Actual renderer functions with isolated local IPC mocks; no network/model calls', passed: results.every(r => r.passed), checks: results };
  fs.writeFileSync(path.join(__dirname, 'local-ai-renderer-results.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`${results.filter(r => r.passed).length}/${results.length} checks passed`);
  for (const r of results.filter(r => !r.passed)) console.error(r.name, r.error);
  if (!report.passed) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
