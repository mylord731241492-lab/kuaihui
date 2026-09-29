// SMS template API: https://push.spug.cc/guide/sms
// GET query integration. The URL contains credentials, phone and OTP; never log it.
const unavailable = () => Object.assign(Error('短信服务暂不可用，请稍后重试或联系客服'), { status: 503 });
const unconfirmed = () => Object.assign(Error('短信提交未确认，请稍后查看手机，勿连续重试'), { status: 502 });
const rejected = () => Object.assign(Error('短信发送未成功，请稍后重试或联系客服'), { status: 502 });

function encodeTemplate(value) {
  if (typeof value !== 'string' || /[\x00-\x1F\x7F]/.test(value)) return '';
  const code = value.trim();
  const safeSegment = segment => segment.length > 0 && segment.length <= 2048 && !/[\s/\\\x00-\x1F\x7F]/.test(segment) && segment !== '.' && segment !== '..' && !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(segment);
  try {
    // Also reject pasted percent-encoded paths. The provider does not publish an alphanumeric-only format.
    if (!safeSegment(code) || !safeSegment(decodeURIComponent(code))) return '';
    return encodeURIComponent(code);
  } catch {
    return '';
  }
}

export function createSpugSms(env = process.env, transport = fetch) {
  const encodedTemplate = encodeTemplate(env.JUHE_SPUG_TEMPLATE_CODE);
  // Accept only one opaque path segment; a pasted URL, encoded separator or traversal is invalid.
  const configured = encodedTemplate !== '';
  const url = configured ? `https://push.spug.cc/sms/${encodedTemplate}` : '';

  return {
    configured,
    validityMinutes: 10,
    async send(phone, code) {
      if (!configured) throw unavailable();
      if (typeof phone !== 'string' || !/^1[3-9]\d{9}$/.test(phone) || typeof code !== 'string' || !/^[A-Za-z0-9]{4,6}$/.test(code)) {
        throw Object.assign(Error('短信发送参数不正确'), { status: 400 });
      }

      const requestUrl = new URL(url);
      requestUrl.search = new URLSearchParams({ to: phone, code }).toString();

      let response, result;
      try {
        response = await transport(requestUrl.toString(), {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          // One fixed ten-minute template is shared by binding and password recovery.
          signal: AbortSignal.timeout(8000),
          redirect: 'error'
        });
        result = await response.json();
      } catch {
        // Submission may have reached the provider. Never retry automatically or expose vendor details.
        throw unconfirmed();
      }

      if (response.ok !== true) throw rejected();
      if (!result || Array.isArray(result) || typeof result !== 'object' || typeof result.code !== 'number') throw unconfirmed();
      if (result.code !== 200) throw rejected();
      if (typeof result.request_id !== 'string' || !/^[\x21-\x7E]{1,256}$/.test(result.request_id)) throw unconfirmed();
      // A request ID confirms submission, not handset delivery.
      return { requestId: result.request_id };
    }
  };
}
