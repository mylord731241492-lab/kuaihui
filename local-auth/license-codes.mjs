import { randomBytes } from 'node:crypto';

const DAY = 24 * 3600_000;
const allowedFields = new Set(['months', 'days', 'deviceLimit', 'shops', 'count', 'mode', 'customCode']);
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const owns = (data, name) => Object.prototype.hasOwnProperty.call(data, name);
const integerWithin = (value, minimum, maximum) => Number.isInteger(value) && value >= minimum && value <= maximum;

function validate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).some(key => !allowedFields.has(key))) fail(400, '授权码参数不正确');
  const hasMonths = owns(data, 'months'), hasDays = owns(data, 'days');
  if (hasMonths === hasDays) fail(400, '请选择月卡、年卡或自定义天数中的一种');
  if (hasMonths && ![1, 12].includes(data.months)) fail(400, '月卡或年卡的月份需要为1或12');
  if (hasDays && !integerWithin(data.days, 1, 3650)) fail(400, '套餐天数需要为1～3650的整数');
  const hasDeviceLimit = owns(data, 'deviceLimit'), hasLegacyLimit = owns(data, 'shops');
  if ((!hasDeviceLimit && !hasLegacyLimit) || (hasDeviceLimit && !integerWithin(data.deviceLimit, 1, 999)) || (hasLegacyLimit && !integerWithin(data.shops, 1, 999))) fail(400, '电脑数需要为1～999的整数');
  if (hasDeviceLimit && hasLegacyLimit && data.deviceLimit !== data.shops) fail(400, '电脑数参数不一致');
  const deviceLimit = hasDeviceLimit ? data.deviceLimit : data.shops;
  const count = owns(data, 'count') ? data.count : 1;
  const mode = owns(data, 'mode') ? data.mode : 'random';
  if (!integerWithin(count, 1, 100)) fail(400, '每批数量需要为1～100的整数');
  if (!['random', 'custom'].includes(mode)) fail(400, '请选择随机或自定义授权码');
  let customCode;
  if (mode === 'custom') {
    if (count !== 1) fail(400, '自定义授权码每次只能生成1个');
    if (typeof data.customCode !== 'string') fail(400, '请填写自定义授权码');
    const trimmed = data.customCode.trim();
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(trimmed)) fail(400, '自定义授权码需要8～64位字母、数字、连字符或下划线');
    customCode = trimmed.toUpperCase();
  } else if (owns(data, 'customCode')) fail(400, '随机模式不能指定授权码内容');
  return { months: hasMonths ? data.months : 0, days: hasDays ? data.days : null, deviceLimit, count, mode, customCode };
}

export function createLicenseCodes({ db, now, hash, transaction, audit, addMonths }) {
  if (!db.prepare('PRAGMA table_info(codes)').all().some(column => column.name === 'days')) db.exec('ALTER TABLE codes ADD COLUMN days INTEGER');
  if (!db.prepare('PRAGMA table_info(codes)').all().some(column => column.name === 'device_limit')) transaction(() => {
    db.exec('ALTER TABLE codes ADD COLUMN device_limit INTEGER NOT NULL DEFAULT 1');
    db.exec("UPDATE codes SET device_limit=CASE WHEN typeof(shops)='integer' AND shops BETWEEN 1 AND 999 THEN shops ELSE 1 END");
  });
  const exists = db.prepare('SELECT 1 FROM codes WHERE code_hash=?');
  const insert = db.prepare('INSERT INTO codes(code_hash,hint,months,days,shops,device_limit,expires,created) VALUES(?,?,?,?,?,?,?,?)');

  function issue(data) {
    const spec = validate(data);
    return transaction(() => {
      const issued = [], time = now();
      for (let index = 0; index < spec.count; index++) {
        let code = spec.customCode;
        if (spec.mode === 'custom') {
          if (exists.get(hash(code))) fail(409, '授权码已存在，请使用其他内容；已使用或作废的码不能重复生成');
        } else {
          code = null;
          for (let attempt = 0; attempt < 8; attempt++) {
            const candidate = 'JH-' + randomBytes(18).toString('hex').toUpperCase().match(/.{6}/g).join('-');
            if (!exists.get(hash(candidate))) { code = candidate; break; }
          }
          if (!code) fail(503, '暂时无法生成授权码，请重试');
        }
        const row = insert.run(hash(code), code.slice(-6), spec.months, spec.days, spec.deviceLimit, spec.deviceLimit, time + 30 * DAY, time);
        const id = Number(row.lastInsertRowid);
        audit('issue-code', null, id);
        issued.push({ id, code });
      }
      return { ...(issued.length === 1 ? issued[0] : {}), codes: issued, count: issued.length };
    });
  }

  function expiry(base, code) {
    return code.days == null ? addMonths(base, code.months) : base + code.days * DAY;
  }

  return { issue, expiry };
}
