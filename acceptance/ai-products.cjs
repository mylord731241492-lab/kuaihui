'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
const { createProductStore, normalizeObserved, contentHash } = require('../app-asar/dist-electron/juhe-ai-products.cjs');

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'juhe-ai-products-'));
let directory = path.join(temporary, 'account-a');
let store = createProductStore({ getDirectory: () => directory });
const checks = [];
const file = () => path.join(directory, 'ai-products.json');
const bytes = () => fs.readFileSync(file());
const digest = () => createHash('sha256').update(bytes()).digest('hex');
const get = (shopId = 'shop-1', productId = 'product-1') => store.call('get', { shopId, productId }).record;
const save = (observed, shopId = 'shop-1', productId = 'product-1') => store.call('upsert', { shopId, productId, observed });
const observed = title => ({ title: title || '纯棉毛巾', description: '尺寸：30 × 60 厘米。材质：纯棉。', sku: '颜色：蓝色', images: ['https://example.test/毛巾.jpg'], source: 'manual' });
const generated = ({ observed: source }) => ({ summary: '根据商品文字整理。', facts: [{ field: '标题', value: source.title, evidence: source.title }] });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
async function check(name, test) { await test(); checks.push(name); }
function unchanged(test, code) {
  const before = digest();
  assert.throws(test, error => error.code === code);
  assert.equal(digest(), before, 'Rejected changes must preserve file bytes');
}

(async () => {
  try {
    await check('empty IDs never count as product content and preserve previous observations', () => {
      assert.deepEqual(store.call('list', { shopId: 'shop-1' }), { records: [] });
      assert.throws(() => save({ goodId: 'product-1', source: 'manual' }), error => error.code === 'AI_PRODUCTS_EMPTY_CONTENT');
      assert.equal(fs.existsSync(file()), false);
      save(observed());
      unchanged(() => save({ source: 'manual' }), 'AI_PRODUCTS_EMPTY_CONTENT');
      assert.equal(get().observed.title, '纯棉毛巾');
    });
    await check('UTF-8 persistence, old platform fields and dedup ignoring collection time', () => {
      const normalized = normalizeObserved({ goodName: '旧版标题', goodProperties: ['材质：纯棉', '颜色：蓝色'], goodCat: '家居', goodSku: [{ name: '蓝色' }], mainImage: 'https://example.test/main.jpg', detailImages: ['https://example.test/detail.jpg'], source: 'platform:拼多多' });
      assert.equal(normalized.title, '旧版标题');
      assert.equal(normalized.properties, '材质：纯棉\n颜色：蓝色');
      assert.equal(normalized.sku, '{"name":"蓝色"}');
      assert.equal(normalized.images.length, 2);
      const first = save(observed()).record;
      const second = save({ ...observed(), collectedAt: '2026-01-01T00:00:00.000Z' });
      assert.equal(second.changed, false);
      assert.equal(second.record.contentHash, first.contentHash);
      assert.equal(contentHash({ ...normalized, images: [...normalized.images].reverse() }), contentHash(normalized));
      assert(bytes().toString('utf8').includes('纯棉毛巾'));
      store = createProductStore({ getDirectory: () => directory });
      assert.equal(get().observed.source, 'manual');
      assert.equal(store.call('list', { shopId: 'shop-1', search: '蓝色' }).records.length, 1);
    });
    await check('same product ID stays isolated by shop and account', () => {
      save(observed('店铺二商品'), 'shop-2');
      assert.equal(get('shop-1').observed.title, '纯棉毛巾');
      assert.equal(get('shop-2').observed.title, '店铺二商品');
      assert.equal(get('shop-3'), null);
      unchanged(() => store.call('delete', { shopId: 'shop-3', productId: 'product-1' }), 'AI_PRODUCTS_NOT_FOUND');
      const first = directory;
      directory = path.join(temporary, 'account-b');
      assert.equal(get(), null);
      save(observed('账号二商品'));
      directory = first;
      assert.equal(get().observed.title, '纯棉毛巾');
    });
    await check('learning records only evidenced facts and unchanged recapture avoids another generation', async () => {
      let calls = 0;
      const generate = input => { calls++; return generated(input); };
      const result = await store.learn({ shopId: 'shop-1', productId: 'product-1', generate });
      assert.equal(result.record.learning, 'learned');
      assert.equal(result.record.extracted.facts[0].evidence, '纯棉毛巾');
      assert.equal(result.record.learnedContentHash, result.record.contentHash);
      assert.equal(result.record.stale, false);
      save({ ...observed(), collectedAt: '2026-09-26T00:00:00.000Z' });
      assert.equal((await store.learn({ shopId: 'shop-1', productId: 'product-1', generate })).skipped, true);
      assert.equal(calls, 1);
    });
    await check('updated content invalidates learned version, failed retry preserves old results with stale marker', async () => {
      const before = get();
      assert.equal(save(observed('更新后的毛巾')).changed, true);
      assert.equal(get().learning, 'unlearned');
      assert.equal(get().stale, true);
      const failed = await store.learn({ shopId: 'shop-1', productId: 'product-1', generate: () => { throw new Error('provider secret must never be saved'); } });
      assert.equal(failed.failed, true);
      assert.equal(failed.record.learning, 'failed');
      assert.equal(failed.record.stale, true);
      assert.deepEqual(failed.record.extracted, before.extracted);
      assert.equal(failed.record.summary, before.summary);
      assert(!bytes().includes(Buffer.from('provider secret')));
      const retried = await store.learn({ shopId: 'shop-1', productId: 'product-1', generate: generated });
      assert.equal(retried.record.learning, 'learned');
      assert.equal(retried.record.stale, false);
      assert.equal(retried.record.extracted.facts[0].value, '更新后的毛巾');
    });
    await check('invented facts and image-only content are never marked learned', async () => {
      save(observed(), 'shop-1', 'untrusted');
      const ungrounded = await store.learn({ shopId: 'shop-1', productId: 'untrusted', generate: () => ({ summary: '猜测', facts: [{ field: '材质', value: '真丝', evidence: '材质：真丝' }] }) });
      assert.equal(ungrounded.record.learning, 'failed');
      assert.equal(ungrounded.code, 'AI_PRODUCTS_UNGROUNDED_RESULT');
      assert.equal(ungrounded.record.summary, '');
      save({ images: ['https://example.test/only.jpg'], source: 'manual' }, 'shop-1', 'images-only');
      let calls = 0;
      const images = await store.learn({ shopId: 'shop-1', productId: 'images-only', generate: () => { calls++; return { summary: '猜测', facts: [] }; } });
      assert.equal(calls, 0);
      assert.equal(images.record.learning, 'failed');
      assert.equal(images.code, 'AI_PRODUCTS_IMAGES_ONLY');
      assert.match(images.record.lastError, /图片识别/);
      assert.deepEqual(images.record.observed.images, ['https://example.test/only.jpg']);
    });
    await check('simultaneous requests share one model call and same-hash recapture keeps its run', async () => {
      save(observed(), 'shop-1', 'simultaneous');
      const gate = deferred();
      let calls = 0;
      const generate = async input => { calls++; await gate.promise; return generated(input); };
      const one = store.learn({ shopId: 'shop-1', productId: 'simultaneous', generate });
      const two = store.learn({ shopId: 'shop-1', productId: 'simultaneous', generate });
      assert.equal(one, two);
      await Promise.resolve();
      assert.equal(get('shop-1', 'simultaneous').learning, 'learning');
      save(observed(), 'shop-1', 'simultaneous');
      gate.resolve();
      assert.equal((await one).record.learning, 'learned');
      assert.equal(calls, 1);
    });
    await check('content changes during generation discard the stale result and retain newer learned facts', async () => {
      save(observed('旧内容'), 'shop-1', 'race');
      const gate = deferred();
      const old = store.learn({ shopId: 'shop-1', productId: 'race', generate: async input => { await gate.promise; return generated(input); } });
      await Promise.resolve();
      save(observed('新内容'), 'shop-1', 'race');
      await store.learn({ shopId: 'shop-1', productId: 'race', generate: generated });
      const before = digest();
      gate.resolve();
      assert.equal((await old).discarded, true);
      assert.equal(digest(), before);
      assert.equal(get('shop-1', 'race').extracted.facts[0].value, '新内容');
    });
    await check('account switch during generation never writes captured account or current account', async () => {
      save(observed(), 'shop-1', 'account-race');
      const gate = deferred();
      const job = store.learn({ shopId: 'shop-1', productId: 'account-race', generate: async input => { await gate.promise; return generated(input); } });
      await Promise.resolve();
      const firstDirectory = directory, oldBytes = bytes();
      directory = path.join(temporary, 'account-b');
      const currentBytes = bytes();
      gate.resolve();
      const result = await job;
      assert.equal(result.discarded, true);
      assert.equal(result.reason, 'account-changed');
      assert.equal(result.record, null);
      assert.deepEqual(bytes(), currentBytes);
      assert.deepEqual(fs.readFileSync(path.join(firstDirectory, 'ai-products.json')), oldBytes);
      directory = firstDirectory;
      assert.equal((await store.learn({ shopId: 'shop-1', productId: 'account-race', generate: generated })).record.learning, 'learned');
    });
    await check('delete then recreate while learning cannot overwrite the new record even for equal hashes', async () => {
      save(observed(), 'shop-1', 'delete-race');
      const gate = deferred();
      const job = store.learn({ shopId: 'shop-1', productId: 'delete-race', generate: async input => { await gate.promise; return generated(input); } });
      await Promise.resolve();
      store.call('delete', { shopId: 'shop-1', productId: 'delete-race' });
      save(observed(), 'shop-1', 'delete-race');
      const before = digest();
      gate.resolve();
      assert.equal((await job).discarded, true);
      assert.equal(digest(), before);
      assert.equal(get('shop-1', 'delete-race').learning, 'unlearned');
    });
    await check('active learning remains active and interrupted process state becomes retryable', async () => {
      save(observed(), 'shop-1', 'interrupted');
      const gate = deferred();
      const job = store.learn({shopId:'shop-1',productId:'interrupted',generate:async input=>{await gate.promise;return generated(input);}});
      await Promise.resolve();
      assert.equal(store.call('list',{shopId:'shop-1'}).records.find(r=>r.productId==='interrupted').learning,'learning');
      const restarted = createProductStore({getDirectory:()=>directory});
      const recovered = restarted.call('list',{shopId:'shop-1'}).records.find(r=>r.productId==='interrupted');
      assert.equal(recovered.learning,'failed');assert.match(recovered.lastError,/中断/);
      gate.resolve();assert.equal((await job).discarded,true);
    });
    await check('invalid identifiers, unsafe image schemes and malformed records preserve database', () => {
      unchanged(() => store.call('upsert', { shopId: '../shop', productId: 'p', observed: observed() }), 'AI_PRODUCTS_INVALID_DATA');
      unchanged(() => save({ ...observed(), images: ['file:///secret'] }), 'AI_PRODUCTS_INVALID_DATA');
      unchanged(() => save({ ...observed(), images: ['https://user:password@example.test/private'] }), 'AI_PRODUCTS_INVALID_DATA');
      unchanged(() => store.call('upsert', { shopId: 'shop-1', productId: 'p', observed: observed(), directory: 'elsewhere' }), 'AI_PRODUCTS_INVALID_DATA');
    });
    await check('write failure preserves original bytes and removes only its temporary file', () => {
      const before = bytes(), rename = fs.renameSync;
      fs.renameSync = () => { const error = new Error('injected disk failure'); error.code = 'EACCES'; throw error; };
      try { assert.throws(() => save(observed('不应写入')), error => error.code === 'AI_PRODUCTS_WRITE_ERROR'); }
      finally { fs.renameSync = rename; }
      assert.deepEqual(bytes(), before);
      assert.equal(fs.readdirSync(directory).filter(name => name.endsWith('.tmp')).length, 0);
    });
    await check('corrupt JSON, invalid UTF-8 and invalid state are never silently overwritten', () => {
      directory = path.join(temporary, 'corrupt');
      fs.mkdirSync(directory, { recursive: true });
      for (const content of [Buffer.from('{bad json'), Buffer.from([0xc3, 0x28]), Buffer.from('{"version":1,"records":[{}]}')]) {
        fs.writeFileSync(file(), content);
        assert.throws(() => store.call('list', { shopId: 'shop-1' }), error => error.code === 'AI_PRODUCTS_CORRUPT_FILE');
        assert.throws(() => save(observed()), error => error.code === 'AI_PRODUCTS_CORRUPT_FILE');
        assert.deepEqual(bytes(), content);
      }
    });
    console.log(JSON.stringify({ passed: true, checks, scope: 'Temporary account directories, no network, injected model results and file errors.' }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ passed: false, checks, error: error.stack }, null, 2));
    process.exitCode = 1;
  } finally {
    // The exact mkdtemp path is under OS temp and owned by this test.
    if (path.dirname(temporary) === path.resolve(os.tmpdir()) && path.basename(temporary).startsWith('juhe-ai-products-')) fs.rmSync(temporary, { recursive: true, force: true });
  }
})();
