import { createHash, createHmac, randomUUID } from 'node:crypto';
// Official ACS3 signing and SendSms 2017-05-25:
// https://help.aliyun.com/zh/sdk/product-overview/v3-request-structure-and-signature
// https://help.aliyun.com/zh/sms/developer-reference/api-dysmsapi-2017-05-25-sendsms
const sha = s => createHash('sha256').update(s).digest('hex');
const encode = s => encodeURIComponent(s).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
export function signSms(config, phone, code, date = new Date(), nonce = randomUUID()) {
  const query = { PhoneNumbers:phone, SignName:config.signName, TemplateCode:config.templateCode, TemplateParam:JSON.stringify({code}) };
  const canonicalQuery=Object.keys(query).sort().map(k=>encode(k)+'='+encode(query[k])).join('&');
  const headers = { host:'dysmsapi.aliyuncs.com', 'x-acs-action':'SendSms', 'x-acs-version':'2017-05-25', 'x-acs-date':date.toISOString().replace(/\.\d{3}Z$/,'Z'), 'x-acs-signature-nonce':nonce, 'x-acs-content-sha256':sha('') };
  if(config.securityToken)headers['x-acs-security-token']=config.securityToken;
  const keys=Object.keys(headers).sort(), signedHeaders=keys.join(';');
  const canonical=['POST','/',canonicalQuery,keys.map(k=>k+':'+headers[k].trim()+'\n').join(''),signedHeaders,sha('')].join('\n');
  const signature=createHmac('sha256',config.accessKeySecret).update('ACS3-HMAC-SHA256\n'+sha(canonical)).digest('hex');
  headers.Authorization=`ACS3-HMAC-SHA256 Credential=${config.accessKeyId},SignedHeaders=${signedHeaders},Signature=${signature}`;
  return {url:'https://dysmsapi.aliyuncs.com/?'+canonicalQuery,headers};
}
export function createAliyunSms(env=process.env, transport=fetch) {
  const config={accessKeyId:env.ALIBABA_CLOUD_ACCESS_KEY_ID,accessKeySecret:env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,securityToken:env.ALIBABA_CLOUD_SECURITY_TOKEN,signName:env.JUHE_SMS_SIGN_NAME,templateCode:env.JUHE_SMS_TEMPLATE_CODE};
  const configured=!!(config.accessKeyId&&config.accessKeySecret&&config.signName&&config.templateCode);
  return {configured,async send(phone,code){
    if(!configured)throw Object.assign(Error('短信服务暂不可用，请稍后重试或联系客服'),{status:503});
    const r=signSms(config,phone,code);
    let response,result;
    try {response=await transport(r.url,{method:'POST',headers:r.headers,signal:AbortSignal.timeout(8000),redirect:'error'});result=await response.json();}
    catch {throw Object.assign(Error('短信提交未确认，请稍后查看手机，勿连续重试'),{status:502});}
    if(!response.ok||result.Code!=='OK')throw Object.assign(Error('短信发送未成功，请稍后重试或联系客服'),{status:502});
    return {requestId:String(result.RequestId||''),bizId:String(result.BizId||'')};
  }};
}
