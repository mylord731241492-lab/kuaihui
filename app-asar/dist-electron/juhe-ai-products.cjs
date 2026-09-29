'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');

const FILE_NAME = 'ai-products.json';
const LIMITS = Object.freeze({ fileBytes: 64 * 1024 * 1024, records: 10000, title: 2000, description: 80000, field: 20000, images: 100, facts: 100 });
const OBSERVED_FIELDS = ['title', 'description', 'category', 'properties', 'sku', 'images', 'source', 'collectedAt'];
const RECORD_FIELDS = ['shopId', 'productId', 'observed', 'contentHash', 'learning', 'extracted', 'summary', 'lastError', 'learnedContentHash', 'learnedAt', 'learningRunId', 'learningStartedAt', 'stale', 'createdAt', 'updatedAt'];
const STATES = new Set(['unlearned', 'learning', 'learned', 'failed']);

function fail(message, code = 'AI_PRODUCTS_INVALID_DATA') {
  const error = new Error(message);
  error.code = code;
  throw error;
}
function object(value, label, fields) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(`${label}格式不正确`);
  if (fields) for (const key of Object.keys(value)) if (!fields.includes(key)) fail(`${label}包含不支持的字段：${key}`);
  return value;
}
function text(value, label, max, required = false) {
  if (typeof value !== 'string') fail(`${label}必须是文本`);
  const clean = value.replace(/\r\n?/g, '\n').trim();
  if (clean.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(clean)) fail(`${label}过长或包含不支持的控制字符`);
  if (required && !clean) fail(`${label}不能为空`);
  return clean;
}
function identifier(value, label) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) value = String(value);
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/.test(value) || ['constructor', 'prototype', '__proto__'].includes(value)) fail(`${label}不合法`);
  return value;
}
function timestamp(value, label, optional = false) {
  if (optional && value === '') return '';
  if (typeof value !== 'string' || value.length > 40 || !Number.isFinite(Date.parse(value))) fail(`${label}格式不正确`);
  return value;
}
function field(value, label, max = LIMITS.field) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) value = value.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join('\n');
  else if (typeof value === 'object') value = JSON.stringify(value);
  return text(value, label, max);
}
function imageUrl(value) {
  const result = text(value, '图片地址', 4096, true);
  let parsed;
  try { parsed = new URL(result); } catch { fail('图片地址必须是完整的 HTTP 或 HTTPS 地址'); }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) fail('图片地址必须是无账号密码的 HTTP 或 HTTPS 地址');
  return result;
}
function normalizeObserved(input, now = new Date().toISOString()) {
  object(input, '商品采集内容');
  const primary = input.images === undefined ? [] : input.images;
  const details = input.detailImages === undefined ? [] : input.detailImages;
  if (!Array.isArray(primary) || !Array.isArray(details) || primary.length + details.length > LIMITS.images * 2) fail('商品图片列表不正确');
  const images = [...new Set([...primary, input.mainImage, ...details].filter(value => value !== undefined && value !== null && value !== '').map(imageUrl))];
  if (images.length > LIMITS.images) fail(`商品图片最多 ${LIMITS.images} 张`);
  return {
    title: field(input.title ?? input.goodName, '商品标题', LIMITS.title),
    description: field(input.description ?? input.goodDescription, '商品描述', LIMITS.description),
    category: field(input.category ?? input.goodCat, '商品类目', LIMITS.title),
    properties: field(input.properties ?? input.goodProperties, '商品属性'),
    sku: field(input.sku ?? input.goodSku, '商品规格'),
    images,
    source: text(input.source === undefined ? 'unknown' : input.source, '采集来源', 200, true),
    collectedAt: timestamp(input.collectedAt === undefined ? now : input.collectedAt, '采集时间')
  };
}
function observedText(observed) {
  // Labels, URLs, IDs and source metadata are excluded from factual evidence.
  return ['title', 'description', 'category', 'properties', 'sku'].map(key => observed[key]).filter(Boolean).join('\n');
}
function contentHash(observed) {
  return createHash('sha256').update(JSON.stringify([
    observed.title, observed.description, observed.category, observed.properties, observed.sku,
    [...observed.images].sort(), observed.source
  ]), 'utf8').digest('hex');
}
function normalizeFacts(input, observed, checkEvidence = true) {
  if (!Array.isArray(input) || input.length > LIMITS.facts) fail('商品事实列表格式不正确');
  const source = observedText(observed);
  return input.map(item => {
    object(item, '商品事实', ['field', 'value', 'evidence']);
    const fact = { field: text(item.field, '事实字段', 200, true), value: text(item.value, '事实内容', 4000, true), evidence: text(item.evidence, '事实依据', 6000, true) };
    if (checkEvidence && (!source.includes(fact.evidence) || !fact.evidence.includes(fact.value))) fail('商品学习返回了缺少原文依据的事实', 'AI_PRODUCTS_UNGROUNDED_RESULT');
    return fact;
  });
}
function normalizeGenerated(result, observed) {
  object(result, '商品学习结果', ['summary', 'facts', 'extracted']);
  const facts = normalizeFacts(result.facts ?? (result.extracted && result.extracted.facts), observed);
  if (!facts.length) fail('商品学习未返回有原文依据的事实', 'AI_PRODUCTS_UNGROUNDED_RESULT');
  return { summary: text(result.summary ?? '', '学习摘要', LIMITS.field), extracted: { facts } };
}
function validateRecord(record) {
  object(record, '商品记录', RECORD_FIELDS);
  const shopId = identifier(record.shopId, '店铺编号'), productId = identifier(record.productId, '商品编号');
  object(record.observed, '商品采集内容', OBSERVED_FIELDS);
  const observed = normalizeObserved(record.observed);
  if (!observedText(observed) && !observed.images.length) fail('商品记录没有采集内容');
  if (record.contentHash !== contentHash(observed)) fail('商品内容校验不一致');
  if (!STATES.has(record.learning) || typeof record.stale !== 'boolean') fail('商品学习状态不正确');
  if (typeof record.learnedContentHash !== 'string' || (record.learnedContentHash && !/^[a-f0-9]{64}$/.test(record.learnedContentHash))) fail('商品学习版本不正确');
  object(record.extracted, '商品学习事实', ['facts']);
  // Previous learning results are deliberately kept after a source update, marked stale.
  const extracted = { facts: normalizeFacts(record.extracted.facts, observed, record.learnedContentHash === record.contentHash) };
  if (record.learning === 'learned' && (!record.learnedContentHash || record.learnedContentHash !== record.contentHash || !extracted.facts.length)) fail('已学习状态没有匹配的原文事实');
  if (record.stale !== Boolean(record.learnedContentHash && record.learnedContentHash !== record.contentHash)) fail('商品学习过期状态不一致');
  return {
    shopId, productId, observed, contentHash: record.contentHash, learning: record.learning, extracted,
    summary: text(record.summary, '学习摘要', LIMITS.field), lastError: text(record.lastError, '学习错误', 2000),
    learnedContentHash: record.learnedContentHash, learnedAt: timestamp(record.learnedAt, '学习时间', true),
    learningRunId: text(record.learningRunId, '学习任务编号', 80), learningStartedAt: timestamp(record.learningStartedAt, '学习开始时间', true),
    stale: record.stale, createdAt: timestamp(record.createdAt, '创建时间'), updatedAt: timestamp(record.updatedAt, '更新时间')
  };
}
function validateFile(state) {
  object(state, '商品资料库', ['version', 'records']);
  if (state.version !== 1 || !Array.isArray(state.records) || state.records.length > LIMITS.records) fail('商品资料库版本或记录数量不正确');
  const keys = new Set();
  const records = state.records.map(record => {
    const value = validateRecord(record), key = JSON.stringify([value.shopId, value.productId]);
    if (keys.has(key)) fail('商品资料库存在重复商品');
    keys.add(key);
    return value;
  });
  return { version: 1, records };
}

function createProductStore({ getDirectory } = {}) {
  if (typeof getDirectory !== 'function') throw new TypeError('getDirectory 必须由主进程提供');
  const running = new Map();
  function location() {
    const directory = getDirectory();
    if (typeof directory !== 'string' || !path.isAbsolute(directory)) fail('账号商品资料目录尚未准备好', 'AI_PRODUCTS_DIRECTORY');
    return { directory: path.resolve(directory), file: path.join(path.resolve(directory), FILE_NAME) };
  }
  function sameAccount(where) {
    try { return location().directory === where.directory; } catch { return false; }
  }
  function read(file) {
    let buffer;
    try {
      if (fs.statSync(file).size > LIMITS.fileBytes) fail('商品资料文件超过大小限制');
      buffer = fs.readFileSync(file);
      if (buffer.length > LIMITS.fileBytes) fail('商品资料文件超过大小限制');
    } catch (error) {
      if (error.code === 'ENOENT') return { version: 1, records: [] };
      fail(`无法读取商品资料，原文件保持不变：${error.message}`, 'AI_PRODUCTS_READ_ERROR');
    }
    try { return validateFile(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer))); }
    catch (error) { fail(`商品资料文件损坏或不兼容，已停止读写，原文件保持不变：${error.message}`, 'AI_PRODUCTS_CORRUPT_FILE'); }
  }
  function write(where, state) {
    const serialized = JSON.stringify(validateFile(state), null, 2) + '\n';
    if (Buffer.byteLength(serialized, 'utf8') > LIMITS.fileBytes) fail('商品资料文件超过 64 MB', 'AI_PRODUCTS_LIMIT');
    const temporary = path.join(where.directory, `.ai-products-${process.pid}-${randomUUID()}.tmp`);
    let fd;
    try {
      fs.mkdirSync(where.directory, { recursive: true });
      fd = fs.openSync(temporary, 'wx', 0o600);
      fs.writeFileSync(fd, serialized, 'utf8');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = undefined;
      fs.renameSync(temporary, where.file);
    } catch (error) { fail(`保存商品资料失败，原文件保持不变：${error.message}`, 'AI_PRODUCTS_WRITE_ERROR'); }
    finally {
      if (fd !== undefined) { try { fs.closeSync(fd); } catch {} }
      try { fs.unlinkSync(temporary); } catch { /* Keep the original error and target file. */ }
    }
  }
  function call(action, data = {}) {
    const fields = { list: ['shopId', 'search'], get: ['shopId', 'productId'], upsert: ['shopId', 'productId', 'observed'], delete: ['shopId', 'productId'] };
    if (typeof action !== 'string' || !Object.hasOwn(fields, action)) fail('不支持的商品资料操作');
    object(data, '操作参数', fields[action]);
    const shopId = identifier(data.shopId, '店铺编号'), where = location(), state = read(where.file);
    if (action === 'list') {
      // A new process has no in-flight job for persisted "learning" records.
      // Surface the interrupted task so the UI never spins forever after exit.
      let recovered = false;
      for (const record of state.records) {
        const key = JSON.stringify([where.directory, record.shopId, record.productId, record.contentHash]);
        if (record.learning === 'learning' && !running.has(key)) {
          record.learning = 'failed'; record.learningRunId = '';
          record.lastError = '上次商品学习已中断，请重新学习';
          record.updatedAt = new Date().toISOString(); recovered = true;
        }
      }
      if (recovered) write(where, state);
      const search = text(data.search ?? '', '搜索内容', 500).toLocaleLowerCase();
      return { records: state.records.filter(record => record.shopId === shopId && (!search || `${record.productId}\n${observedText(record.observed)}`.toLocaleLowerCase().includes(search))) };
    }
    const productId = identifier(data.productId, '商品编号');
    const index = state.records.findIndex(record => record.shopId === shopId && record.productId === productId);
    const old = index < 0 ? null : state.records[index];
    if (action === 'get') return { record: old };
    if (action === 'delete') {
      if (!old) fail('商品不存在或不属于此店铺', 'AI_PRODUCTS_NOT_FOUND');
      state.records.splice(index, 1);
      write(where, state);
      return { deleted: true };
    }
    const now = new Date().toISOString(), observed = normalizeObserved(data.observed, now);
    if (!observedText(observed) && !observed.images.length) fail('未采集到商品标题、描述、规格或图片，仅有商品编号不能学习', 'AI_PRODUCTS_EMPTY_CONTENT');
    const hash = contentHash(observed), changed = !old || old.contentHash !== hash;
    const record = {
      shopId, productId, observed, contentHash: hash,
      learning: changed ? 'unlearned' : old.learning,
      extracted: old ? old.extracted : { facts: [] }, summary: old ? old.summary : '', lastError: changed ? '' : old.lastError,
      learnedContentHash: old ? old.learnedContentHash : '', learnedAt: old ? old.learnedAt : '',
      learningRunId: changed ? '' : old.learningRunId, learningStartedAt: changed ? '' : old.learningStartedAt,
      stale: Boolean(old && old.learnedContentHash && old.learnedContentHash !== hash), createdAt: old ? old.createdAt : now, updatedAt: now
    };
    if (index < 0) state.records.push(record); else state.records[index] = record;
    write(where, state);
    return { record, changed };
  }
  function learn({ shopId: shopValue, productId: productValue, generate, force = false } = {}) {
    const shopId = identifier(shopValue, '店铺编号'), productId = identifier(productValue, '商品编号');
    if (typeof generate !== 'function' || typeof force !== 'boolean') fail('商品学习参数不正确');
    const where = location(), state = read(where.file);
    const record = state.records.find(item => item.shopId === shopId && item.productId === productId);
    if (!record) fail('商品不存在或不属于此店铺', 'AI_PRODUCTS_NOT_FOUND');
    const key = JSON.stringify([where.directory, shopId, productId, record.contentHash]);
    if (running.has(key)) return running.get(key);
    if (!force && record.learning === 'learned' && !record.stale) return Promise.resolve({ record, skipped: true, reason: 'unchanged' });
    const runId = randomUUID(), hash = record.contentHash;
    record.learning = 'learning';
    record.learningRunId = runId;
    record.learningStartedAt = new Date().toISOString();
    record.lastError = '';
    record.updatedAt = record.learningStartedAt;
    write(where, state);
    const job = Promise.resolve().then(async () => {
      let generated, error;
      try {
        if (!observedText(record.observed)) fail('目前只能学习商品文字；已保存图片来源，尚未完成图片识别，请补充真实文字资料', 'AI_PRODUCTS_IMAGES_ONLY');
        generated = normalizeGenerated(await generate({ shopId, productId, observed: structuredClone(record.observed), contentHash: hash }), record.observed);
      } catch (caught) { error = caught; }
      if (!sameAccount(where)) return { record: null, discarded: true, reason: 'account-changed' };
      const latest = read(where.file), current = latest.records.find(item => item.shopId === shopId && item.productId === productId);
      if (!current || current.contentHash !== hash || current.learningRunId !== runId) return { record: current || null, discarded: true, reason: 'content-changed' };
      current.learning = error ? 'failed' : 'learned';
      // Persist only a short sanitized failure; never provider request bodies or credentials.
      current.lastError = error ? (error.code === 'AI_PRODUCTS_IMAGES_ONLY' ? error.message : error.code === 'AI_PRODUCTS_UNGROUNDED_RESULT' ? '学习结果缺少商品原文依据，请重试或补充真实资料' : '商品学习失败，请检查模型连接后重试') : '';
      current.updatedAt = new Date().toISOString();
      current.learningRunId = '';
      if (!error) {
        current.extracted = generated.extracted;
        current.summary = generated.summary;
        current.learnedContentHash = hash;
        current.learnedAt = current.updatedAt;
      }
      current.stale = Boolean(current.learnedContentHash && current.learnedContentHash !== current.contentHash);
      write(where, latest);
      return { record: current, ...(error ? { failed: true, code: typeof error.code === 'string' && /^AI_PRODUCTS_[A-Z_]+$/.test(error.code) ? error.code : 'AI_PRODUCTS_LEARNING_FAILED' } : {}) };
    });
    running.set(key, job);
    job.then(() => running.delete(key), () => running.delete(key));
    return job;
  }
  return { call, learn };
}

module.exports = createProductStore;
module.exports.createProductStore = createProductStore;
module.exports.normalizeObserved = normalizeObserved;
module.exports.observedText = observedText;
module.exports.contentHash = contentHash;
module.exports.LIMITS = LIMITS;
