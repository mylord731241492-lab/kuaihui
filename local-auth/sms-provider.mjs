import { createAliyunSms } from './sms-aliyun.mjs';
import { createSpugSms } from './sms-spug.mjs';

export function createSmsProvider(env = process.env, transport = fetch) {
  const rawProvider = env.JUHE_SMS_PROVIDER;
  const provider = typeof rawProvider === 'string' ? rawProvider.trim().toLowerCase() : rawProvider;
  // Existing installations without a selector keep their ordinary Aliyun SMS configuration.
  if (provider === undefined || provider === '') return createAliyunSms(env, transport);
  if (provider === 'aliyun') return createAliyunSms(env, transport);
  if (provider === 'spug') return createSpugSms(env, transport);
  // A typo must not silently switch to another paid provider.
  return {
    configured: false,
    async send() {
      throw Object.assign(Error('短信服务配置不正确，请联系客服'), { status: 503 });
    }
  };
}
