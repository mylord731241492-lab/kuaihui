'use strict';

// Local knowledge retrieval for the AI runtime. Questions are segmented with a
// built-in e-commerce dictionary (forward maximum matching), and the remaining
// text falls back to Intl.Segmenter. Each meaningful word becomes a "concept";
// words in a synonym group match any variant of that group. No native module or
// embedding service is required.

const SYNONYM_GROUPS = [
  ['退款', '退钱', '退费', '返款', '钱退'],
  ['退货', '退掉', '退回', '寄回', '不想要了', '不要了'],
  ['换货', '换一个', '换个', '调换', '更换'],
  ['发货', '发出', '寄出', '出库', '发走'],
  ['物流', '快递', '运单', '单号', '快递单号', '到哪了', '配送'],
  ['多久', '几天', '什么时候', '啥时候', '多长时间', '时间', '几时', '时效'],
  ['到货', '送到', '收到', '签收'],
  ['包邮', '包不包邮', '运费', '邮费', '免运费'],
  ['价格', '多少钱', '什么价', '价位', '价钱', '售价'],
  ['优惠', '优惠券', '便宜', '打折', '折扣', '满减', '降价'],
  ['质量', '品质', '好不好', '好用吗', '怎么样', '咋样'],
  ['质量问题', '坏了', '破了', '破损', '瑕疵', '有问题'],
  ['尺码', '码数', '尺寸', '多大'],
  ['颜色', '色号', '什么色', '哪个色'],
  ['发票', '开票', '开发票'],
  ['修改地址', '改地址', '换地址'],
  ['材质', '材料', '面料', '用料', '什么做的'],
  ['赠品', '送什么', '礼品', '小礼物'],
  ['库存', '有货', '现货', '缺货', '没货'],
  ['保修', '质保', '保修期']
];
const LEXICON_WORDS = [
  '大码', '小码', '七天无理由', '无理由', '保质期', '生产日期', '使用方法', '怎么用', '规格', '型号', '容量', '重量',
  '预售', '定制', '批发', '安装', '电池', '充电', '到账', '售后', '订单', '下单', '付款', '地址', '客服', '人工'
];
const STOP_WORDS = [
  '请问', '你好', '您好', '一下', '这个', '那个', '你们', '我们', '可以', '有没有', '能不能', '是不是', '谢谢', '什么', '怎么',
  '如何', '多少', '哪个', '没有', '还是', '或者', '亲', '呢', '吗', '啊', '的', '了', '吧', '呀', '么', '哦', '嗯', '是', '有', '我',
  '你', '在', '就', '都', '也', '还', '要', '想', '请', '帮', '个', '一', '下', '哪', '能', '会', '啦', '哈', '那', '这',
  '和', '跟', '给', '让', '把', '被', '对', '又', '很', '太'
];

const groupOf = new Map();
SYNONYM_GROUPS.forEach((group, index) => { for (const word of group) groupOf.set(word, index); });
const stopWords = new Set(STOP_WORDS);
const dictionary = new Set([...groupOf.keys(), ...LEXICON_WORDS, ...STOP_WORDS.filter(word => word.length > 1)]);
const longestWord = Math.max(...[...dictionary].map(word => word.length));
let segmenter = null;
try { segmenter = new Intl.Segmenter('zh', { granularity: 'word' }); } catch { segmenter = null; }

function plain(value, max = 20000) { return typeof value === 'string' ? value.replace(/\u0000/g, '').slice(0, max) : ''; }
function normalized(value) { return plain(value).toLowerCase().replace(/[\s\p{P}\p{S}]/gu, ''); }
function bigrams(word) { const result = []; for (let i = 0; i < word.length - 1; i++) result.push(word.slice(i, i + 2)); return result; }

// Unknown text is left to Intl.Segmenter. Its single characters are joined back
// into short runs, because ICU often splits trade terms such as 大码 into 大|码.
function segmentResidue(text) {
  const parts = segmenter ? [...segmenter.segment(text)].filter(part => part.isWordLike).map(part => part.segment) : [...text];
  const words = [];
  let singles = '';
  const flush = () => {
    if (singles.length > 3) words.push(...bigrams(singles));
    else if (singles) words.push(singles);
    singles = '';
  };
  for (const part of parts) {
    if (part.length === 1 && !stopWords.has(part)) singles += part;
    else { flush(); words.push(part); }
  }
  flush();
  return words;
}
function segmentHan(run) {
  const words = [];
  let residue = '';
  for (let i = 0; i < run.length;) {
    let match = '';
    for (let size = Math.min(longestWord, run.length - i); size > 1; size--) {
      const candidate = run.slice(i, i + size);
      if (dictionary.has(candidate)) { match = candidate; break; }
    }
    if (match) {
      if (residue) { words.push(...segmentResidue(residue)); residue = ''; }
      words.push(match);
      i += match.length;
    } else residue += run[i++];
  }
  if (residue) words.push(...segmentResidue(residue));
  return words;
}
function segment(value) {
  const words = [];
  for (const run of plain(value).toLowerCase().match(/[a-z0-9]+|[\p{Script=Han}]+/gu) || []) {
    if (/^[a-z0-9]+$/.test(run)) words.push(run);
    else words.push(...segmentHan(run));
  }
  return words.filter(word => !stopWords.has(word));
}

// A concept is one thing the customer asked about. Synonyms collapse into one
// concept, so "退钱" and "退款" count once for coverage. Single characters carry
// half weight because they are ambiguous on their own.
function analyze(value) {
  const concepts = [], seen = new Set();
  for (const word of segment(value)) {
    const group = groupOf.get(word);
    const key = group === undefined ? 'w:' + word : 'g:' + group;
    if (seen.has(key)) continue;
    seen.add(key);
    concepts.push({ word, alternatives: group === undefined ? [word] : SYNONYM_GROUPS[group], weight: word.length > 1 ? 1 : 0.5 });
  }
  return concepts;
}

const titleCache = new Map();
function titleConcepts(title) {
  let concepts = titleCache.get(title);
  if (!concepts) {
    if (titleCache.size > 20000) titleCache.clear();
    concepts = analyze(title);
    titleCache.set(title, concepts);
  }
  return concepts;
}
const mentions = (text, concept) => concept.alternatives.some(word => text.includes(word));

function scoreRecord(record, query, queryText) {
  const head = normalized(record.title + ' ' + record.scenarios.join(' ')), body = normalized(record.content);
  let score = 0, total = 0, matched = 0, inHead = 0;
  for (const concept of query) {
    total += concept.weight;
    if (mentions(head, concept)) { score += 3 * concept.weight; matched += concept.weight; inHead += concept.weight; }
    else if (mentions(body, concept)) { score += concept.weight; matched += concept.weight; }
    else if (concept.word.length > 2) {
      // Partial credit for long unknown words, e.g. a product nickname that only
      // shares part of its characters with the knowledge title.
      const parts = bigrams(concept.word);
      if (parts.some(part => head.includes(part))) score += 1;
      else if (parts.some(part => body.includes(part))) score += 0.5;
    }
  }
  const title = titleConcepts(record.title);
  const titleWeight = title.reduce((sum, concept) => sum + concept.weight, 0);
  const titleMatched = title.reduce((sum, concept) => sum + (mentions(queryText, concept) ? concept.weight : 0), 0);
  return {
    score: score + (total ? matched / total : 0),
    coverage: total ? matched / total : 0,
    headCoverage: total ? inHead / total : 0,
    titleCoverage: titleWeight ? titleMatched / titleWeight : 0
  };
}

// Returns up to eight matches ordered by score. `exact` keeps the original
// whole-title rule; `confident` marks a top match that answers every concept in
// the question, is clearly ahead of any different answer, and whose own title is
// mostly covered by the question. The runtime only sends confident matches
// verbatim when the knowledge author chose 原话发送.
function retrieve(records, question, productId = '') {
  const query = analyze(question), exact = normalized(question);
  const queryText = normalized(question) + query.map(concept => concept.alternatives.join('')).join('');
  const matches = records.filter(record => !record.goodId || record.goodId === productId).map(record => {
    const exactMatch = !!exact && exact === normalized(record.title);
    const measured = scoreRecord(record, query, queryText);
    return { record, ...measured, score: exactMatch ? 1000 : measured.score, exact: exactMatch, confident: false };
  }).filter(item => item.score >= 2)
    .sort((a, b) => b.score - a.score || b.record.updatedAt.localeCompare(a.record.updatedAt))
    .slice(0, 8);
  const [top, ...rest] = matches;
  if (top && !top.exact && query.some(concept => concept.weight === 1)) {
    const rival = rest.find(item => normalized(item.record.content) !== normalized(top.record.content));
    top.confident = top.coverage === 1 && top.headCoverage > 0 && top.titleCoverage >= 0.5 && (!rival || top.score - rival.score >= 1);
  }
  return matches;
}

module.exports = { retrieve, analyze, segment, normalized, SYNONYM_GROUPS };
