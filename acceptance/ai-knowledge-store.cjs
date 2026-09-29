'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const reportFile = path.join(__dirname, 'ai-knowledge-store-results.json');
const report = { at: new Date().toISOString(), passed: false, status: 'running', checks: [], scope: 'Local temporary account directories only; real UTF-8 files and injected write failures; no network requests' };
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n', 'utf8');
const createKnowledgeStore = require('../app-asar/dist-electron/juhe-ai-knowledge.cjs');
const { LIMITS } = createKnowledgeStore;
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'juhe-ai-knowledge-'));
let directory = path.join(temporary, 'account-a');
let store = createKnowledgeStore({ getDirectory: () => directory });
const file = () => path.join(directory, 'ai-knowledge.json');
const digest = () => createHash('sha256').update(fs.readFileSync(file())).digest('hex');
const checks = report.checks;
function check(name, test) { test(); checks.push(name); }
const textRecord = (title = '退换货规则', content = '收到货后请先核对商品。') => ({ title, content });
function unchanged(test, pattern) {
  const before = digest();
  assert.throws(test, pattern);
  assert.equal(digest(), before, 'Failed action must preserve the complete file');
}

try {
  check('shared library, UTF-8 CRUD, compatible fields and restart persistence', () => {
    assert.deepEqual(store.call('list'), { records: [] });
    assert.equal(fs.existsSync(file()), false, 'Reading an empty library must not create a file');
    const record = store.call('save', { record: {
      ...textRecord(), scenarios: ['售前', '售后', '售后'], sendType: 'text', titleType: 2,
      goodId: '100001', imageurls: ['https://images.example.test/商品.png']
    } }).record;
    assert.equal(record.shopId, '__shared__');
    assert.match(record.id, /^[a-z0-9-]+$/);
    assert.deepEqual(record.scenarios, ['售前', '售后']);
    assert.equal(record.sendType, 'text');
    assert.equal(record.titleType, 2);
    assert.equal(record.goodId, '100001');
    assert(fs.readFileSync(file(), 'utf8').includes('退换货规则'));
    store = createKnowledgeStore({ getDirectory: () => directory });
    assert.deepEqual(store.call('list').records, [record]);
    assert.equal(store.call('list', { search: '售后' }).records.length, 1);
    assert.equal(store.call('list', { search: '100001' }).records.length, 1);
    assert.equal(store.call('list', { search: '不存在' }).records.length, 0);
    const updated = store.call('save', { record: { ...record, content: '中文更新\r\n第二行' } }).record;
    assert.equal(updated.id, record.id);
    assert.equal(updated.createdAt, record.createdAt);
    assert.equal(updated.content, '中文更新\n第二行');
    assert.deepEqual(store.call('export'), { version: 1, records: [updated] });
    assert.deepEqual(store.call('delete', { id: updated.id }), { deleted: true });
    assert.deepEqual(store.call('list').records, []);
  });
  check('shop isolation and trusted account-directory switching', () => {
    const shared = store.call('save', { record: textRecord('公共', '公共答案') }).record;
    const one = store.call('save', { shopId: 101, record: textRecord('店铺一', '专用答案') }).record;
    assert.equal(store.call('list', { shopId: '101' }).records[0].id, one.id);
    assert.equal(store.call('list', { shopId: '102' }).records.length, 0);
    unchanged(() => store.call('save', { shopId: '102', record: { ...one, content: '不能跨店修改' } }), /不存在或不属于/);
    unchanged(() => store.call('delete', { shopId: '102', id: one.id }), /不存在或不属于/);
    const firstDirectory = directory;
    directory = path.join(temporary, 'account-b');
    assert.equal(store.call('list').records.length, 0);
    store.call('save', { record: textRecord('账号二', '隔离') });
    directory = firstDirectory;
    assert.equal(store.call('list').records[0].id, shared.id);
    assert.equal(store.call('list', { search: '账号二' }).records.length, 0);
  });
  check('save deduplication and update requires an existing id', () => {
    const original = store.call('save', { record: textRecord('重复', '相同内容') }).record;
    const before = digest();
    const duplicate = store.call('save', { record: textRecord('重复', '相同内容') }).record;
    assert.equal(duplicate.id, original.id);
    assert.equal(digest(), before);
    unchanged(() => store.call('save', { record: { id: 'unknown-id', ...textRecord() } }), /不存在/);
    const second = store.call('save', { record: textRecord('另一条', '另一条内容') }).record;
    unchanged(() => store.call('save', { record: { ...second, title: '重复', content: '相同内容' } }), /相同内容/);
  });
  check('deduplication preserves different scenarios, products, send rules and images', () => {
    const base = textRecord('同一个问题', '同一个答案');
    const variants = [
      { ...base }, { ...base, scenarios: ['售前'] }, { ...base, scenarios: ['售后'] },
      { ...base, goodId: '100001' }, { ...base, goodId: '100002' },
      { ...base, sendType: 1 }, { ...base, titleType: 1 },
      { ...base, imageurls: ['https://images.example.test/one.png'] },
      { ...base, imageurls: ['https://images.example.test/two.png'] },
      { ...base, scenarios: ['售前', '售后'], imageurls: ['https://images.example.test/one.png', 'https://images.example.test/two.png'] }
    ];
    assert.equal(store.call('import', { shopId: 'variant-source', records: variants }).count, variants.length);
    assert.equal(store.call('copy', { shopId: 'variant-source', targetShopIds: ['variant-target'] }).count, variants.length);
    const before = digest();
    assert.equal(store.call('import', { shopId: 'variant-target', records: [
      { ...variants.at(-1), scenarios: ['售后', '售前'], imageurls: ['https://images.example.test/two.png', 'https://images.example.test/one.png'] }
    ] }).count, 0);
    assert.equal(digest(), before, 'Array ordering must not create duplicate knowledge');
    assert.equal(store.call('list', { shopId: 'variant-target' }).records.length, variants.length);
  });
  check('import validates whole batch before writing and export round-trips', () => {
    unchanged(() => store.call('import', { shopId: '201', records: [textRecord('有效', '有效'), textRecord('', '无效')] }), /标题不能为空/);
    assert.equal(store.call('list', { shopId: '201' }).records.length, 0);
    assert.equal(store.call('import', { shopId: '201', records: [textRecord('有效', '有效'), textRecord('有效', '有效')] }).count, 1);
    const exported = store.call('export', { shopId: '201' });
    assert.equal(store.call('import', { shopId: '201', records: exported.records }).count, 0);
    assert.equal(store.call('import', { shopId: '202', records: exported.records }).count, 1);
    const imported = store.call('list', { shopId: '202' }).records[0];
    assert.equal(imported.shopId, '202');
    assert.notEqual(imported.id, exported.records[0].id, 'Imported IDs must not collide across shops');
    assert.equal(imported.content, exported.records[0].content);
    const before = digest();
    assert.equal(store.call('import', { shopId: '202', records: exported.records }).count, 0);
    assert.equal(digest(), before);
  });
  check('copy is atomic across targets and prevents duplicates', () => {
    unchanged(() => store.call('copy', { shopId: '201', targetShopIds: ['301', '../bad'] }), /目标店铺编号不合法/);
    assert.equal(store.call('list', { shopId: '301' }).records.length, 0);
    assert.equal(store.call('copy', { shopId: '201', targetShopIds: ['301', '302', '301', '201'] }).count, 2);
    const before = digest();
    assert.equal(store.call('copy', { shopId: '201', targetShopIds: ['301', '302'] }).count, 0);
    assert.equal(digest(), before);
    assert.notEqual(store.call('list', { shopId: '301' }).records[0].id, store.call('list', { shopId: '302' }).records[0].id);
  });
  check('invalid data, pollution keys, bounds and unsafe URLs are rejected', () => {
    const badRecords = [
      {}, textRecord('', 'x'), textRecord('x', ''), textRecord('x', 'a\u0000b'),
      textRecord('x'.repeat(LIMITS.title + 1), 'x'), textRecord('x', 'x'.repeat(LIMITS.content + 1)),
      { ...textRecord(), id: '__proto__' }, { ...textRecord(), id: 'constructor' },
      { ...textRecord(), imageurls: ['javascript:alert(1)'] }, { ...textRecord(), imageurls: ['file:///private/file'] },
      { ...textRecord(), imageurls: ['https://user:password@example.test/image'] },
      { ...textRecord(), scenarios: ['x', {}] }, { ...textRecord(), sendType: Infinity },
      { ...textRecord(), goodId: {} }, { ...textRecord(), goodId: null },
      JSON.parse('{"title":"x","content":"x","__proto__":{"polluted":true}}')
    ];
    for (const record of badRecords) unchanged(() => store.call('save', { record }));
    unchanged(() => store.call('save', { shopId: '../escape', record: textRecord() }));
    unchanged(() => store.call('save', { path: '/escape', record: textRecord() }));
    unchanged(() => store.call('list', { search: {} }));
    unchanged(() => store.call('constructor', {}));
    unchanged(() => store.call('import', { records: Array(LIMITS.importRecords + 1).fill(textRecord()) }));
    unchanged(() => store.call('copy', { targetShopIds: Array(LIMITS.targets + 1).fill('101') }));
    assert.equal({}.polluted, undefined);
    const html = '<img src=x onerror=alert(1)>';
    assert.equal(store.call('save', { record: textRecord('纯文本', html) }).record.content, html, 'Store text verbatim; rendering must use textContent');
  });
  check('rename and partial-write failures preserve the complete previous file', () => {
    const rename = fs.renameSync;
    try {
      fs.renameSync = (from, to) => { if (to === file()) throw Error('simulated-rename-failure'); return rename(from, to); };
      unchanged(() => store.call('import', { records: [textRecord('不可落盘一', '1'), textRecord('不可落盘二', '2')] }), /保存本地知识库失败/);
      unchanged(() => store.call('copy', { shopId: '201', targetShopIds: ['401', '402'] }), /保存本地知识库失败/);
    } finally { fs.renameSync = rename; }
    const write = fs.writeFileSync;
    try {
      fs.writeFileSync = (target, ...args) => {
        if (typeof target === 'number') { write(target, '{partial', 'utf8'); throw Error('simulated-disk-failure'); }
        return write(target, ...args);
      };
      unchanged(() => store.call('save', { record: textRecord('写入失败', '未提交') }), /保存本地知识库失败/);
    } finally { fs.writeFileSync = write; }
    assert.deepEqual(fs.readdirSync(directory), ['ai-knowledge.json']);
    assert.equal(store.call('list', { search: '不可落盘' }).records.length, 0);
    assert.equal(store.call('list', { shopId: '401' }).records.length, 0);
  });
  check('corrupt JSON, invalid schema and invalid UTF-8 never become an empty library', () => {
    const original = fs.readFileSync(file());
    const invalid = [Buffer.from('{bad'), Buffer.from('{"version":99,"records":[]}'), Buffer.from('{"version":1,"records":[{}]}'), Buffer.from([0xff, 0xfe])];
    for (const bytes of invalid) {
      fs.writeFileSync(file(), bytes);
      for (const action of ['list', 'save', 'import', 'copy', 'delete']) {
        const payload = action === 'save' ? { record: textRecord() } : action === 'import' ? { records: [textRecord()] } : action === 'copy' ? { targetShopIds: ['777'] } : action === 'delete' ? { id: 'any-id' } : {};
        unchanged(() => store.call(action, payload), /文件损坏或格式不兼容/);
      }
    }
    fs.writeFileSync(file(), original);
  });
  check('file and record-count limits preserve existing contents', () => {
    const original = fs.readFileSync(file());
    fs.writeFileSync(file(), Buffer.alloc(LIMITS.fileBytes + 1, 32));
    unchanged(() => store.call('save', { record: textRecord() }), /大小限制/);
    fs.writeFileSync(file(), original);
    const base = store.call('list').records[0];
    const records = Array.from({ length: LIMITS.records }, (_, index) => ({ ...base, id: `limit-${index}`, title: `知识${index}` }));
    fs.writeFileSync(file(), JSON.stringify({ version: 1, records }), 'utf8');
    unchanged(() => store.call('save', { record: textRecord('超过上限', '1') }), /最多允许/);
    unchanged(() => store.call('copy', { targetShopIds: ['999'] }), /最多允许/);
    fs.writeFileSync(file(), original);
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
  const resolved = path.resolve(temporary), expectedParent = path.resolve(os.tmpdir());
  if (path.dirname(resolved) === expectedParent && path.basename(resolved).startsWith('juhe-ai-knowledge-')) fs.rmSync(resolved, { recursive: true, force: true });
}
