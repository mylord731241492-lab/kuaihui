import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSpugSms } from './sms-spug.mjs';
import { createSmsProvider } from './sms-provider.mjs';

// All transports are local fakes. These tests never contact a provider or send SMS.
const phone = '13800000000';
const otp = '001234';
const template = 'test-template_secret-20260925';
const spugEnv = { JUHE_SMS_PROVIDER: 'spug', JUHE_SPUG_TEMPLATE_CODE: template };
const aliyunEnv = {
  ALIBABA_CLOUD_ACCESS_KEY_ID: 'test-access-id',
  ALIBABA_CLOUD_ACCESS_KEY_SECRET: 'test-access-secret',
  JUHE_SMS_SIGN_NAME: '测试',
  JUHE_SMS_TEMPLATE_CODE: 'SMS_TEST'
};
const accepted = () => ({ ok: true, json: async () => ({ code: 200, request_id: 'request-test-1' }) });
const safeError = status => error => {
  assert.equal(error.status, status);
  for (const secret of [template, phone, otp, 'https://push.spug.cc', 'vendor-private-detail']) {
    assert(!String(error.stack).includes(secret), 'Provider details must not escape in error stack');
    assert(!JSON.stringify(error).includes(secret), 'Provider details must not escape in error properties');
  }
  assert.equal(error.cause, undefined);
  return true;
};

test('Spug submits one GET with only a single phone and zero-prefixed OTP for the fixed ten-minute template', async t => {
  const controller = new AbortController();
  let timeoutMs, calls = 0;
  t.mock.method(AbortSignal, 'timeout', milliseconds => {
    timeoutMs = milliseconds;
    return controller.signal;
  });
  const sms = createSpugSms({ ...spugEnv, JUHE_SPUG_TEMPLATE_CODE: `  ${template}  ` }, async (url, options) => {
    calls++;
    const target = new URL(url);
    assert.equal(target.origin, 'https://push.spug.cc');
    assert.equal(target.pathname, `/sms/${template}`);
    assert.deepEqual([...target.searchParams], [['to', phone], ['code', otp]]);
    assert.equal(target.hash, '');
    assert.equal(options.method, 'GET');
    assert.equal(Object.hasOwn(options, 'body'), false);
    assert.deepEqual(options.headers, { Accept: 'application/json' });
    assert.equal(options.cache, 'no-store');
    assert.equal(options.signal, controller.signal);
    assert.equal(options.redirect, 'error');
    return accepted();
  });
  assert.equal(sms.configured, true);
  assert.equal(sms.validityMinutes, 10);
  assert.deepEqual(await sms.send(phone, otp), { requestId: 'request-test-1' });
  assert.equal(timeoutMs, 8000);
  assert.equal(calls, 1);
});

test('missing or malformed Spug credentials stay unavailable without a request', async t => {
  for (const value of [undefined, null, 1234, '', ' ', 'https://push.spug.cc/sms/test', 'https:template', '../test', '.', '..', 'a/b', 'a\\b', 'a%2Fb', '%2e%2e', 'a b', '\ntest', 'test\n', 'a\u0000b', 'a\u007Fb', '\uD800', 'a'.repeat(2049)]) {
    await t.test(`invalid template ${typeof value}:${String(value).length}`, async () => {
      let calls = 0;
      const sms = createSpugSms({ JUHE_SPUG_TEMPLATE_CODE: value }, async () => { calls++; return accepted(); });
      assert.equal(sms.configured, false);
      await assert.rejects(() => sms.send(phone, otp), safeError(503));
      assert.equal(calls, 0);
    });
  }
});

test('safe opaque template punctuation is encoded as one path segment', async () => {
  const opaque = 'template+A=B?x#y';
  const sms = createSpugSms({ JUHE_SPUG_TEMPLATE_CODE: opaque }, async (url, options) => {
    const target = new URL(url);
    assert.equal(target.origin, 'https://push.spug.cc');
    assert.equal(target.pathname, '/sms/template%2BA%3DB%3Fx%23y');
    assert.deepEqual([...target.searchParams], [['to', phone], ['code', otp]]);
    assert.equal(target.hash, '');
    assert.equal(options.method, 'GET');
    assert.equal(Object.hasOwn(options, 'body'), false);
    return accepted();
  });
  assert.equal(sms.configured, true);
  assert.deepEqual(await sms.send(phone, otp), { requestId: 'request-test-1' });
});

test('Spug accepts four-to-six ASCII alphanumeric codes without changing case or leading zeros', async t => {
  for (const code of ['0001', 'Ab9Z', '01234', 'ABCDE', '001234', 'aB12cD']) {
    await t.test(`code ${code}`, async () => {
      let calls = 0;
      const sms = createSpugSms(spugEnv, async (url, options) => {
        calls++;
        const target = new URL(url);
        assert.equal(target.origin, 'https://push.spug.cc');
        assert.equal(target.pathname, `/sms/${template}`);
        assert.deepEqual([...target.searchParams], [['to', phone], ['code', code]]);
        assert.equal(options.method, 'GET');
        assert.equal(Object.hasOwn(options, 'body'), false);
        assert.equal(options.redirect, 'error');
        return accepted();
      });
      assert.deepEqual(await sms.send(phone, code), { requestId: 'request-test-1' });
      assert.equal(calls, 1);
    });
  }
});

test('Spug rejects multiple or malformed recipients and malformed OTPs before transport', async t => {
  const invalid = [
    ['+8613800000000', otp], [phone + ',13900000000', otp], [[phone], otp], [13800000000, otp],
    ['12800000000', otp], ['13800000000\n', otp], [phone, '123'], [phone, '1234567'],
    [phone, 123456], [phone, '１２３４５６'], [phone, '12345\n'], [phone, null],
    [phone, '验证码123'], [phone, 'AB-CD'], [phone, 'A_B12'], [phone, 'AB C1'], [phone, 'ＡBC1'], [phone, 'ab&x'], [phone, 'a?b1'], [phone, 'abcé']
  ];
  for (const [recipient, code] of invalid) {
    await t.test(`invalid ${typeof recipient}/${typeof code}`, async () => {
      let calls = 0;
      const sms = createSpugSms(spugEnv, async () => { calls++; return accepted(); });
      await assert.rejects(() => sms.send(recipient, code), safeError(400));
      assert.equal(calls, 0);
    });
  }
});

test('legacy third arguments cannot change validity or add template variables to the fixed template', async t => {
  for (const legacyArgument of [5, '5', '十', '10&to=13900000000', { number: '5' }]) {
    await t.test(`legacy argument ${typeof legacyArgument}:${String(legacyArgument)}`, async () => {
      let calls = 0;
      const sms = createSpugSms(spugEnv, async url => {
        calls++;
        assert.deepEqual([...new URL(url).searchParams], [['to', phone], ['code', otp]]);
        return accepted();
      });
      assert.equal(sms.validityMinutes, 10);
      assert.deepEqual(await sms.send(phone, otp, legacyArgument), { requestId: 'request-test-1' });
      assert.equal(calls, 1);
    });
  }
});

test('Spug requires HTTP success, numeric acceptance and a usable request ID', async t => {
  const results = [
    { ok: false, body: { code: 200, request_id: 'request-test-1' } },
    { ok: true, body: { code: 400, request_id: 'request-test-1', msg: `vendor-private-detail ${template} ${phone} ${otp}` } },
    { ok: true, body: null }, { ok: true, body: [] }, { ok: true, body: 'ok' },
    { ok: true, body: { code: '200', request_id: 'request-test-1' } },
    { ok: true, body: { code: 200 } }, { ok: true, body: { code: 200, request_id: 1234 } },
    { ok: true, body: { code: 200, request_id: '' } }, { ok: true, body: { code: 200, request_id: ' ' } },
    { ok: true, body: { code: 200, request_id: 'request\n' } },
    { ok: true, body: { code: 200, request_id: 'r'.repeat(257) } }
  ];
  for (const [index, fixture] of results.entries()) {
    await t.test(`rejected response ${index}`, async () => {
      let calls = 0;
      const sms = createSpugSms(spugEnv, async () => { calls++; return { ok: fixture.ok, json: async () => fixture.body }; });
      await assert.rejects(() => sms.send(phone, otp), safeError(502));
      assert.equal(calls, 1, 'Ambiguous failures must not be retried automatically');
    });
  }
});

test('network, redirect, timeout and non-JSON failures are unconfirmed, redacted and never retried', async t => {
  const detail = `vendor-private-detail https://push.spug.cc/sms/${template}?to=${phone}&code=${otp}`;
  const transports = [
    async () => { throw Error(detail); },
    async () => { throw new DOMException(detail, 'TimeoutError'); },
    async () => { throw new TypeError('redirect: ' + detail); },
    async () => ({ ok: true, json: async () => { throw SyntaxError(detail); } })
  ];
  for (const [index, transport] of transports.entries()) {
    await t.test(`transport failure ${index}`, async () => {
      let calls = 0;
      const sms = createSpugSms(spugEnv, async (...args) => { calls++; return transport(...args); });
      await assert.rejects(() => sms.send(phone, otp), error => {
        safeError(502)(error);
        assert.match(error.message, /提交未确认/);
        return true;
      });
      assert.equal(calls, 1);
    });
  }
});

test('provider selection keeps legacy Aliyun configuration and explicitly selects Spug', async t => {
  for (const provider of [undefined, '', 'aliyun', ' Aliyun ']) {
    await t.test(`Aliyun selector ${String(provider)}`, async () => {
      let calls = 0;
      const sms = createSmsProvider({ ...aliyunEnv, ...spugEnv, JUHE_SMS_PROVIDER: provider }, async url => {
        calls++;
        assert.equal(new URL(url).origin, 'https://dysmsapi.aliyuncs.com');
        return { ok: true, json: async () => ({ Code: 'OK', RequestId: 'ali-test', BizId: 'ali-biz' }) };
      });
      assert.equal(sms.configured, true);
      assert.deepEqual(await sms.send(phone, otp), { requestId: 'ali-test', bizId: 'ali-biz' });
      assert.equal(calls, 1);
    });
  }
  let calls = 0;
  const spug = createSmsProvider({ ...aliyunEnv, ...spugEnv, JUHE_SMS_PROVIDER: ' SPUG ' }, async url => {
    calls++;
    assert.equal(new URL(url).origin, 'https://push.spug.cc');
    return accepted();
  });
  assert.equal(spug.validityMinutes, 10);
  assert.deepEqual(await spug.send(phone, otp), { requestId: 'request-test-1' });
  assert.equal(calls, 1);
});

test('unknown provider and missing selected credentials fail closed without paid fallback', async t => {
  const cases = [
    { ...aliyunEnv, ...spugEnv, JUHE_SMS_PROVIDER: 'spgu' },
    { ...aliyunEnv, ...spugEnv, JUHE_SMS_PROVIDER: null },
    { ...aliyunEnv, ...spugEnv, JUHE_SMS_PROVIDER: 1234 },
    { ...aliyunEnv, JUHE_SMS_PROVIDER: 'spug' },
    { ...spugEnv, JUHE_SMS_PROVIDER: 'aliyun' },
    {}
  ];
  for (const [index, env] of cases.entries()) {
    await t.test(`closed selection ${index}`, async () => {
      let calls = 0;
      const sms = createSmsProvider(env, async () => { calls++; return accepted(); });
      assert.equal(sms.configured, false);
      await assert.rejects(() => sms.send(phone, otp), safeError(503));
      assert.equal(calls, 0);
    });
  }
});
