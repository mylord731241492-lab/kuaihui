'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const FILE_NAME = 'ai-knowledge.json';
const LIMITS = Object.freeze({
  fileBytes: 20 * 1024 * 1024,
  records: 10000,
  importRecords: 2000,
  targets: 100,
  title: 200,
  content: 20000,
  scenarios: 32,
  images: 20,
  imageUrl: 4096
});
const recordFields = new Set(['id', 'shopId', 'title', 'content', 'scenarios', 'sendType', 'titleType', 'goodId', 'imageurls', 'createdAt', 'updatedAt']);
const forbiddenIds = new Set(['__proto__', 'prototype', 'constructor']);

function fail(message, code = 'AI_KNOWLEDGE_INVALID_DATA') {
  const error = new Error(message);
  error.code = code;
  throw error;
}
function object(value, label, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(`${label}格式不正确`);
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail(`${label}包含不支持的字段：${key}`);
  return value;
}
function text(value, label, maximum, required = false) {
  if (typeof value !== 'string') fail(`${label}必须是文本`);
  const result = value.replace(/\r\n?/g, '\n').trim();
  if (result.length > maximum) fail(`${label}最多允许 ${maximum} 个字符`);
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(result)) fail(`${label}包含不支持的控制字符`);
  if (required && !result) fail(`${label}不能为空`);
  return result;
}
function identifier(value, label, shared = false) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) value = String(value);
  if (shared && value === '__shared__') return value;
  if (typeof value !== 'string' || forbiddenIds.has(value) || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value)) fail(`${label}不合法`);
  return value;
}
function choice(value, label) {
  if (value === undefined) return 0;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 1000) return value;
  return text(value, label, 100);
}
function goodId(value) {
  if (value === undefined) return '';
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) value = String(value);
  return text(value, '商品编号', 120);
}
function list(value, label, maximum, normalize) {
  if (value === undefined || value === '') return [];
  const items = typeof value === 'string' ? value.split(/[,，\n]/u) : value;
  if (!Array.isArray(items) || items.length > maximum) fail(`${label}最多允许 ${maximum} 项`);
  return [...new Set(items.map(item => normalize(item)))];
}
function imageUrl(value) {
  const result = text(value, '图片地址', LIMITS.imageUrl, true);
  let url;
  try { url = new URL(result); } catch { fail('图片地址必须是完整的 HTTP 或 HTTPS 地址'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) fail('图片地址必须是无账号密码的 HTTP 或 HTTPS 地址');
  return result;
}
function timestamp(value, label) {
  if (typeof value !== 'string' || value.length > 40 || !Number.isFinite(Date.parse(value))) fail(`${label}格式不正确`);
  return value;
}
function normalizeRecord(input, shopId, now, { stored = false } = {}) {
  object(input, '知识记录', recordFields);
  if (input.updatedAt !== undefined) timestamp(input.updatedAt, '更新时间');
  const result = {
    id: input.id === undefined ? randomUUID() : identifier(input.id, '知识编号'),
    shopId,
    title: text(input.title, '知识标题', LIMITS.title, true),
    content: text(input.content, '知识内容', LIMITS.content),
    scenarios: list(input.scenarios, '适用场景', LIMITS.scenarios, value => text(value, '适用场景', 100, true)),
    sendType: choice(input.sendType, '发送类型'),
    titleType: choice(input.titleType, '标题类型'),
    goodId: goodId(input.goodId),
    imageurls: list(input.imageurls, '图片地址', LIMITS.images, imageUrl),
    createdAt: input.createdAt === undefined ? now : timestamp(input.createdAt, '创建时间'),
    updatedAt: stored ? timestamp(input.updatedAt, '更新时间') : now
  };
  if (!result.content && !result.imageurls.length) fail('知识内容或图片至少填写一项');
  if (stored && (input.id === undefined || input.createdAt === undefined || result.shopId !== input.shopId)) fail('知识记录缺少必要字段');
  if (input.shopId !== undefined) identifier(input.shopId, '店铺编号', true);
  return result;
}
function validateFile(value) {
  object(value, '知识库', new Set(['version', 'records']));
  if (value.version !== 1 || !Array.isArray(value.records) || value.records.length > LIMITS.records) fail('知识库版本或记录数量不正确');
  const ids = new Set();
  const records = value.records.map(record => {
    if (!record || typeof record !== 'object') fail('知识记录格式不正确');
    const normalized = normalizeRecord(record, identifier(record.shopId, '店铺编号', true), undefined, { stored: true });
    if (ids.has(normalized.id)) fail('知识库存在重复编号');
    ids.add(normalized.id);
    return normalized;
  });
  return { version: 1, records };
}
function fingerprint(record) {
  return JSON.stringify([
    record.title, record.content, [...record.scenarios].sort(),
    record.sendType, record.titleType, record.goodId, [...record.imageurls].sort()
  ]);
}

function createKnowledgeStore({ getDirectory } = {}) {
  if (typeof getDirectory !== 'function') throw new TypeError('getDirectory 必须由主进程提供');

  function location() {
    const directory = getDirectory();
    if (typeof directory !== 'string' || !path.isAbsolute(directory)) fail('账号知识库目录尚未准备好', 'AI_KNOWLEDGE_DIRECTORY');
    return { directory, file: path.join(directory, FILE_NAME) };
  }
  function read(file) {
    let buffer;
    try {
      if (fs.statSync(file).size > LIMITS.fileBytes) fail('文件超过大小限制');
      buffer = fs.readFileSync(file);
      if (buffer.length > LIMITS.fileBytes) fail('文件超过大小限制');
    } catch (error) {
      if (error.code === 'ENOENT') return { version: 1, records: [] };
      fail(`无法读取本地知识库，原文件保持不变：${error.message}`, 'AI_KNOWLEDGE_READ_ERROR');
    }
    try {
      // A replacement character would silently corrupt text if invalid UTF-8 were accepted.
      const raw = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      return validateFile(JSON.parse(raw));
    } catch (error) {
      fail(`本地知识库文件损坏或格式不兼容，已停止读写，原文件保持不变：${error.message}`, 'AI_KNOWLEDGE_CORRUPT_FILE');
    }
  }
  function write(where, state) {
    if (state.records.length > LIMITS.records) fail(`知识库最多允许 ${LIMITS.records} 条记录`, 'AI_KNOWLEDGE_LIMIT');
    const serialized = JSON.stringify(validateFile(state), null, 2) + '\n';
    if (Buffer.byteLength(serialized, 'utf8') > LIMITS.fileBytes) fail('知识库文件超过 20 MB，请减少导入内容', 'AI_KNOWLEDGE_LIMIT');
    const temporary = path.join(where.directory, `.ai-knowledge-${process.pid}-${randomUUID()}.tmp`);
    let fd;
    try {
      fs.mkdirSync(where.directory, { recursive: true });
      fd = fs.openSync(temporary, 'wx', 0o600);
      fs.writeFileSync(fd, serialized, 'utf8');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = undefined;
      fs.renameSync(temporary, where.file);
    } catch (error) {
      fail(`保存本地知识库失败，原文件保持不变：${error.message}`, 'AI_KNOWLEDGE_WRITE_ERROR');
    } finally {
      if (fd !== undefined) { try { fs.closeSync(fd); } catch {} }
      try { fs.unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') { /* Preserve the original failure; never remove the target. */ } }
    }
  }
  function call(action, data = {}) {
    const fields = {
      list: ['shopId', 'search'], save: ['shopId', 'record'], delete: ['shopId', 'id'],
      import: ['shopId', 'records'], copy: ['shopId', 'targetShopIds'], export: ['shopId']
    };
    if (typeof action !== 'string' || !Object.hasOwn(fields, action)) fail('不支持的知识库操作');
    object(data, '操作参数', new Set(fields[action]));
    const shopId = identifier(data.shopId === undefined ? '__shared__' : data.shopId, '店铺编号', true);
    const where = location(), state = read(where.file), now = new Date().toISOString();
    const selected = () => state.records.filter(record => record.shopId === shopId);
    if (action === 'list') {
      const search = text(data.search === undefined ? '' : data.search, '搜索内容', 500).toLocaleLowerCase();
      return { records: selected().filter(record => !search || `${record.title}\n${record.content}\n${record.scenarios.join('\n')}\n${record.goodId}`.toLocaleLowerCase().includes(search)) };
    }
    if (action === 'export') return { version: 1, records: selected() };
    if (action === 'save') {
      const record = normalizeRecord(data.record, shopId, now);
      const index = state.records.findIndex(item => item.id === record.id && item.shopId === shopId);
      if (data.record.id !== undefined && index < 0) fail('要修改的知识不存在或不属于此店铺', 'AI_KNOWLEDGE_NOT_FOUND');
      const duplicate = selected().find(item => item.id !== record.id && fingerprint(item) === fingerprint(record));
      if (duplicate) {
        if (index >= 0) fail('此店铺已存在相同内容与适用条件的知识');
        return { record: duplicate };
      }
      if (index >= 0) { record.createdAt = state.records[index].createdAt; state.records[index] = record; }
      else state.records.push(record);
      write(where, state);
      return { record };
    }
    if (action === 'delete') {
      const id = identifier(data.id, '知识编号');
      const index = state.records.findIndex(record => record.shopId === shopId && record.id === id);
      if (index < 0) fail('要删除的知识不存在或不属于此店铺', 'AI_KNOWLEDGE_NOT_FOUND');
      state.records.splice(index, 1);
      write(where, state);
      return { deleted: true };
    }
    let additions;
    if (action === 'import') {
      if (!Array.isArray(data.records) || data.records.length > LIMITS.importRecords) fail(`一次最多导入 ${LIMITS.importRecords} 条知识`);
      // Validate the entire batch before mutating the in-memory database or writing a file.
      additions = data.records.map(record => normalizeRecord(record, shopId, now));
    } else {
      if (!Array.isArray(data.targetShopIds) || data.targetShopIds.length > LIMITS.targets) fail(`一次最多复制到 ${LIMITS.targets} 个知识库`);
      const targets = [...new Set(data.targetShopIds.map(value => identifier(value, '目标店铺编号', true)))].filter(value => value !== shopId);
      const records = selected();
      if (records.length * targets.length > LIMITS.records) fail('本次复制的记录数量超过上限', 'AI_KNOWLEDGE_LIMIT');
      additions = targets.flatMap(target => records.map(record => ({ ...record, id: randomUUID(), shopId: target, createdAt: now, updatedAt: now })));
    }
    const ids = new Set(state.records.map(record => record.id));
    const existing = new Set(state.records.map(record => JSON.stringify([record.shopId, fingerprint(record)])));
    let count = 0;
    for (const record of additions) {
      const key = JSON.stringify([record.shopId, fingerprint(record)]);
      if (existing.has(key)) continue;
      existing.add(key);
      if (ids.has(record.id)) record.id = randomUUID();
      ids.add(record.id);
      state.records.push(record);
      count++;
    }
    if (count) write(where, state);
    return { count };
  }
  return { call };
}

module.exports = createKnowledgeStore;
module.exports.createKnowledgeStore = createKnowledgeStore;
module.exports.LIMITS = LIMITS;
