# Spug GET 短信验证码调用示例

按用户选定的固定十分钟模板接入：[Spug 短信验证码文档](https://push.spug.cc/guide/sms)。沿用现有 `createSmsProvider(env, transport)` 工厂、`send` 方法和原生fetch请求封装，无新增依赖。以下调用示例仅作说明，未执行。

## 服务端配置

```dotenv
JUHE_SMS_PROVIDER=spug
JUHE_SPUG_TEMPLATE_CODE=固定十分钟模板的实际编码
```

模板编码也可通过现有后台“管理设置 → 短信认证”加密保存。只配置一个模板，手机注册、绑定/换绑和找回密码共用；注册验证码独立存储，绑定与找回按 bind/reset 分别校验，验证码不能跨用途使用。客户端调用项目的手机验证接口，由服务端读取配置并生成验证码；不要把模板编码放入客户端。手机注册请求与响应见 [账号安全配置](account-security-guide.md)。

模板：`您的验证码是${code}，十分钟内有效，如非本人操作请忽略。`

## 业务调用示意（未执行）

```js
import { createSmsProvider } from './sms-provider.mjs';

// 读取服务端环境配置；JUHE_SMS_PROVIDER 必须为 spug。
const sms = createSmsProvider(process.env);

// to/code 应由实际业务传入，以下仅说明参数用法。
const { requestId } = await sms.send('13800000000', '123456');

// 同样支持字母与数字混合的 4～6 位验证码：
// await sms.send(to, 'aB12');
// await sms.send(to, 'aB12cD');
```

请求由 `URLSearchParams` 编码为 `GET https://push.spug.cc/sms/<已编码的模板编码>?to=...&code=...`，只有 `to`、`code` 两个查询参数，无请求体。手机号须为单个大陆手机号，验证码须以字符串传入，保留前导零。

Spug 适配器声明 `validityMinutes: 10`，现有账号流程据此写入10分钟失效时间并返回一致提示；业务仍生成6位数字验证码。数据库中的用途校验、一次性使用、最多5次猜错和发送限流保留。适配器只负责提交短信，自定义业务若单独调用适配器，仍需自行保存和校验验证码及失效时间。

原先的 `${number}` 模板不适用于本次固定模板接口；如曾保存旧模板编码，需要在后台改填固定十分钟模板的编码。没有增加第二个配置项，也不会自动覆盖现有配置。r6 已部署固定模板，手机注册继续复用该配置。

成功返回 `{ requestId }`。只有HTTP成功、响应数字 `code: 200` 且 `request_id` 有效才视为提交受理；受理不代表手机送达。参数错误为400，未配置为503，失败或无法确认提交为502。沿用8秒超时、不跟随重定向、不自动重试，不回显供应商敏感信息。GET URL含手机号、验证码及模板凭据，不应记录完整URL。

## 可运行的无网络示例

本例注入模拟transport，完全不会调用fetch。成功响应使用题目中的结构：

```js
import { createSmsProvider } from './sms-provider.mjs';

const sms = createSmsProvider({
  JUHE_SMS_PROVIDER: 'spug',
  JUHE_SPUG_TEMPLATE_CODE: 'example-template-only',
}, async (url, options) => {
  const request = new URL(url);
  console.assert(options.method === 'GET');
  console.assert(options.body === undefined);
  console.assert(request.searchParams.get('to') === '13800000000');
  console.assert(request.searchParams.get('code') === '001234');
  console.assert([...request.searchParams.keys()].join(',') === 'to,code');
  return {
    ok: true,
    json: async () => ({
      code: 200,
      msg: '请求成功',
      request_id: 'example-request-id',
    }),
  };
});

const result = await sms.send('13800000000', '001234');
console.log(result); // { requestId: 'example-request-id' }
```
