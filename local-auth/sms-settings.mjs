import { randomBytes, createCipheriv, createDecipheriv, createHmac, createHash } from 'node:crypto';
import { createSmsProvider } from './sms-provider.mjs';

const modes = new Set(['environment', 'spug', 'disabled']);
const aad = Buffer.from('juhe:sms-settings:v1');
const fail = message => { throw Object.assign(Error(message), { status: 400 }); };
const validLimit = value => Number.isInteger(value) && value >= 1 && value <= 5000;
const validTemplate = value => typeof value === 'string' && createSmsProvider({ JUHE_SMS_PROVIDER: 'spug', JUHE_SPUG_TEMPLATE_CODE: value }).configured;
const unavailable = { configured: false, async send() { throw Object.assign(Error('短信服务暂不可用，请稍后重试或联系客服'), { status: 503 }); } };

export function createSmsSettings({ db, adminKey, now, env = process.env }) {
  db.exec('CREATE TABLE IF NOT EXISTS service_settings(name TEXT PRIMARY KEY, encrypted_value TEXT NOT NULL, updated INTEGER NOT NULL)');
  const key = createHmac('sha256', adminKey).update(aad).digest();
  function encode(value) {
    const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(aad);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
  }
  function stored() {
    const row = db.prepare("SELECT encrypted_value,updated FROM service_settings WHERE name='sms'").get();
    if (!row) return { value: null, row: null, error: false };
    try {
      const bytes = Buffer.from(row.encrypted_value, 'base64');
      if (bytes.length < 29) throw Error('Invalid configuration');
      const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
      decipher.setAAD(aad); decipher.setAuthTag(bytes.subarray(12, 28));
      const value = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8'));
      if (!value || value.version !== 1 || !modes.has(value.mode) || !validLimit(value.dailyLimit) || (value.template !== null && !validTemplate(value.template))) throw Error('Invalid configuration');
      return { value, row, error: false };
    } catch { return { value: null, row, error: true }; }
  }
  function environment() {
    const raw = env.JUHE_SMS_PROVIDER;
    const providerName = typeof raw === 'string' ? raw.trim().toLowerCase() || 'aliyun' : raw === undefined ? 'aliyun' : 'unknown';
    const rawLimit = env.JUHE_SMS_DAILY_LIMIT;
    const dailyLimit = rawLimit === undefined || rawLimit === '' ? 100 : /^\d+$/.test(String(rawLimit)) ? Number(rawLimit) : NaN;
    const provider = createSmsProvider(env);
    const template = providerName === 'spug' && validTemplate(env.JUHE_SPUG_TEMPLATE_CODE) ? env.JUHE_SPUG_TEMPLATE_CODE.trim() : null;
    return { providerName, provider, template, dailyLimit, error: !validLimit(dailyLimit) };
  }
  function runtime() {
    const saved = stored(), fallback = environment();
    const mode = saved.error ? 'disabled' : saved.value?.mode || 'environment';
    const template = saved.value?.template || fallback.template;
    let providerName = mode === 'environment' ? fallback.providerName : mode;
    let provider = mode === 'spug' ? createSmsProvider({ JUHE_SMS_PROVIDER: 'spug', JUHE_SPUG_TEMPLATE_CODE: template }) : mode === 'environment' ? fallback.provider : unavailable;
    const configurationError = saved.error || (mode === 'environment' && fallback.error);
    if (configurationError) { provider = unavailable; providerName = 'unavailable'; }
    const rawLimit = mode === 'environment' ? fallback.dailyLimit : saved.value?.dailyLimit ?? 100;
    const dailyLimit = validLimit(rawLimit) ? rawLimit : 100;
    const revision = createHash('sha256').update(JSON.stringify([
      saved.row?.encrypted_value ?? '',
      ...Object.keys(env).filter(k => k.startsWith('JUHE_SMS_') || k.startsWith('ALIBABA_CLOUD_') || k === 'JUHE_SPUG_TEMPLATE_CODE').sort().map(k => [k, env[k]])
    ])).digest('hex');
    return { provider, dailyLimit, revision, status: {
      mode, configured: !!provider.configured, provider: providerName,
      hasTemplate: !configurationError && !!template,
      templateHint: !configurationError && template ? (template.length > 4 ? '••••' + template.slice(-4) : '已保存') : null,
      dailyLimit, updatedAt: saved.row?.updated ?? null, configurationError
    } };
  }
  function save(data) {
    if (!Object.keys(data).every(k => ['mode', 'templateCode', 'dailyLimit', 'adminPassword'].includes(k)) || !modes.has(data.mode)) fail('短信配置参数不正确');
    if (data.templateCode !== undefined && typeof data.templateCode !== 'string') fail('模板编码格式不正确');
    if (data.dailyLimit !== undefined && !validLimit(data.dailyLimit)) fail('每日短信限额需要为1～5000');
    const saved = stored(), fallback = environment();
    let template = saved.value?.template || fallback.template || null;
    if (data.templateCode !== undefined && data.templateCode !== '') {
      if (!validTemplate(data.templateCode)) fail('请填写有效的平台验证码模板编码，不要填写网址');
      template = data.templateCode.trim();
    }
    if (data.mode === 'spug' && !template) fail('首次启用Spug需要填写验证码模板编码');
    const dailyLimit = data.dailyLimit ?? saved.value?.dailyLimit ?? (validLimit(fallback.dailyLimit) ? fallback.dailyLimit : 100);
    const value = { version: 1, mode: data.mode, template, dailyLimit };
    db.prepare("INSERT INTO service_settings(name,encrypted_value,updated) VALUES('sms',?,?) ON CONFLICT(name) DO UPDATE SET encrypted_value=excluded.encrypted_value,updated=excluded.updated").run(encode(value), now());
    return runtime().status;
  }
  return { runtime, save };
}
