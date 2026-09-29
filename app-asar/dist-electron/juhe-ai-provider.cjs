'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function atomicWrite(file,value){
  const temporary=file+'.'+crypto.randomUUID()+'.tmp';let fd;
  try{fs.mkdirSync(path.dirname(file),{recursive:true});fd=fs.openSync(temporary,'wx',0o600);fs.writeFileSync(fd,JSON.stringify(value,null,2)+'\n','utf8');fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temporary,file);}
  finally{if(fd!==undefined){try{fs.closeSync(fd);}catch{}}try{fs.unlinkSync(temporary);}catch{}}
}
function readJson(file,fallback){
  try{if(fs.statSync(file).size>5*1024*1024)throw Error('文件过大');return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(file)));}
  catch(error){if(error.code==='ENOENT')return fallback;throw Error('本地 AI 配置无法读取，原文件已保留');}
}
function normalizeBase(value){
  if(typeof value!=='string'||value.length>2000)throw Error('请输入正确的 API 地址');
  let url;try{url=new URL(value.trim());}catch{throw Error('API 地址格式不正确');}
  if(url.username||url.password||url.search||url.hash||!['https:','http:'].includes(url.protocol))throw Error('API 地址不应包含账号、密码、查询参数或片段');
  if(url.protocol!=='https:'&&!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw Error('中转站请使用 HTTPS 地址');
  url.pathname=url.pathname.replace(/\/+$/,'').replace(/\/(chat\/completions|responses|models)$/,'')||'/v1';
  return url.toString().replace(/\/$/,'');
}
const defaults=Object.freeze({version:1,baseUrl:'',model:'gpt-6-sol',apiFormat:'chat-completions',enabled:false,enabledShopIds:[],autoLearn:true,apiKeyEncrypted:'',revision:''});
const shopIdValid=id=>['string','number'].includes(typeof id)&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(String(id))&&!['constructor','prototype','__proto__'].includes(String(id));
function cleanModel(value){if(typeof value!=='string'||!value.trim()||value.length>200||/[\r\n\u0000]/.test(value))throw Error('模型名称格式不正确');return value.trim();}
function aborted(){const error=Error('模型请求超时或已取消，请重试');error.code='AI_PROVIDER_CANCELLED';return error;}
function abortable(promise,signal){return new Promise((resolve,reject)=>{const onAbort=()=>{signal.removeEventListener('abort',onAbort);reject(aborted());};if(signal.aborted){Promise.resolve(promise).catch(()=>{});return onAbort();}signal.addEventListener('abort',onAbort,{once:true});Promise.resolve(promise).then(value=>{signal.removeEventListener('abort',onAbort);signal.aborted?reject(aborted()):resolve(value);},error=>{signal.removeEventListener('abort',onAbort);reject(error);});});}
function createProvider({getDirectory,getScope,authorized,safeStorage,fetchImpl=globalThis.fetch}){
  const active=new Set();
  const file=()=>{const directory=getDirectory();if(typeof directory!=='string'||!path.isAbsolute(directory))throw Error('账号 AI 配置目录尚未准备好');return path.join(directory,'ai-provider.json');};
  function read(){
    const value=readJson(file(),defaults);
    if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1||typeof value.baseUrl!=='string'||(value.baseUrl&&normalizeBase(value.baseUrl)!==value.baseUrl)||typeof value.model!=='string'||cleanModel(value.model)!==value.model||!['chat-completions','responses'].includes(value.apiFormat)||typeof value.enabled!=='boolean'||typeof value.autoLearn!=='boolean'||!Array.isArray(value.enabledShopIds)||value.enabledShopIds.length>1000||value.enabledShopIds.some(id=>!shopIdValid(id))||typeof value.apiKeyEncrypted!=='string'||value.apiKeyEncrypted.length>16384||(value.apiKeyEncrypted&&!/^[A-Za-z0-9+/]+={0,2}$/.test(value.apiKeyEncrypted))||typeof value.revision!=='string'||value.revision.length>80)throw Error('本地 AI 配置格式不兼容，原文件已保留');
    return {...defaults,...value,enabledShopIds:[...value.enabledShopIds]};
  }
  function decrypt(value){if(!value.apiKeyEncrypted||!safeStorage?.isEncryptionAvailable())throw Error('系统密钥加密暂不可用');const key=safeStorage.decryptString(Buffer.from(value.apiKeyEncrypted,'base64'));if(typeof key!=='string'||!key.trim()||key.length>4096||/[\r\n\u0000]/.test(key))throw Error('API 密钥不可用');return key;}
  function redact(value,key='',limit=300){let result=String(value||'');if(key)result=result.replaceAll(key,'[已隐藏]');return result.replace(/sk-[A-Za-z0-9_-]+/g,'[已隐藏]').slice(0,limit);}
  function status(){
    const value=read();let key='';try{key=decrypt(value);}catch{}
    const probe=value.lastProbe,lastProbe=probe&&typeof probe==='object'&&probe.ok===true&&typeof probe.at==='string'&&Number.isFinite(probe.durationMs)?{ok:true,at:probe.at.slice(0,40),durationMs:probe.durationMs,reply:redact(probe.reply,key,100)}:null;
    return {baseUrl:value.baseUrl,model:value.model,apiFormat:value.apiFormat,hasApiKey:!!value.apiKeyEncrypted,enabled:value.enabled,enabledShopIds:value.enabledShopIds,autoLearn:value.autoLearn,ready:!!(value.baseUrl&&value.model&&key),lastProbe};
  }
  function save(data){
    if(!authorized())throw Error('请先登录');
    if(!data||typeof data!=='object'||Array.isArray(data))throw Error('模型配置格式不正确');
    const allowed=['baseUrl','model','apiFormat','enabled','enabledShopIds','autoLearn','apiKey','clearKey'];if(Object.keys(data).some(key=>!allowed.includes(key)))throw Error('模型配置包含不支持的字段');
    const old=read(),next={...old};
    if(data.baseUrl!==undefined)next.baseUrl=normalizeBase(data.baseUrl);
    if(data.model!==undefined)next.model=cleanModel(data.model);
    if(data.apiFormat!==undefined){if(!['chat-completions','responses'].includes(data.apiFormat))throw Error('接口格式不正确');next.apiFormat=data.apiFormat;}
    for(const key of ['enabled','autoLearn'])if(data[key]!==undefined){if(typeof data[key]!=='boolean')throw Error('开关值不正确');next[key]=data[key];}
    if(data.enabledShopIds!==undefined){if(!Array.isArray(data.enabledShopIds)||data.enabledShopIds.length>1000||data.enabledShopIds.some(id=>!shopIdValid(id)))throw Error('启用店铺列表不正确');next.enabledShopIds=[...new Set(data.enabledShopIds.map(String))];}
    if(data.apiKey!==undefined&&data.apiKey!==''){
      if(typeof data.apiKey!=='string'||!data.apiKey.trim()||data.apiKey.length>4096||/[\r\n\u0000]/.test(data.apiKey))throw Error('API 密钥格式不正确');
      if(!safeStorage?.isEncryptionAvailable())throw Error('系统密钥加密暂不可用，未保存密钥');
      next.apiKeyEncrypted=safeStorage.encryptString(data.apiKey.trim()).toString('base64');
    }
    if(data.clearKey!==undefined&&typeof data.clearKey!=='boolean')throw Error('清除密钥开关不正确');
    if(data.clearKey===true){next.apiKeyEncrypted='';next.enabled=false;}
    if(next.enabled&&(!next.baseUrl||!next.model||!next.apiKeyEncrypted||!next.enabledShopIds.length))throw Error('请先配置模型、密钥，并选择允许 AI 自动接待的店铺');
    if(next.enabled){try{decrypt(next);}catch{throw Error('已保存密钥无法解密，请重新填写密钥后再启用');}}
    next.revision=crypto.randomUUID();delete next.lastProbe;
    atomicWrite(file(),next);cancelAll();return status();
  }
  function cancelAll(){for(const controller of active)controller.abort();active.clear();}
  async function generate(messages,{maxTokens=1000,timeoutMs=60000}={}){
    if(!authorized())throw Error('请先登录');
    if(!Array.isArray(messages)||!messages.length||messages.length>200||!Number.isInteger(maxTokens)||maxTokens<1||maxTokens>32768||!Number.isFinite(timeoutMs))throw Error('模型请求参数不正确');
    const value=read(),scope=getScope(),directory=getDirectory();let key;try{key=decrypt(value);}catch{throw Error('请先保存有效的模型地址和 API 密钥');}
    if(!value.baseUrl||!value.model)throw Error('请先保存有效的模型地址和 API 密钥');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.min(Math.max(timeoutMs,1000),60000));active.add(controller);
    const route=value.apiFormat==='responses'?'/responses':'/chat/completions';
    const body=value.apiFormat==='responses'?{model:value.model,input:messages,max_output_tokens:maxTokens,reasoning:{effort:'none'},stream:false,store:false}:{model:value.model,messages,max_completion_tokens:maxTokens,reasoning_effort:'none',stream:false};
    const started=Date.now();
    try{
      const serialized=JSON.stringify(body);if(Buffer.byteLength(serialized,'utf8')>1024*1024)throw Error('模型请求内容过大');
      const response=await abortable(fetchImpl(normalizeBase(value.baseUrl)+route,{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:serialized,signal:controller.signal}),controller.signal);
      const payload=await abortable((async()=>{const chunks=[];let size=0;if(response.body)for await(const chunk of response.body){size+=chunk.length;if(size>2*1024*1024)throw Error('模型返回内容过大');chunks.push(Buffer.from(chunk));}return Buffer.concat(chunks).toString('utf8');})(),controller.signal);
      let result;try{result=JSON.parse(payload);}catch{if(response.ok)throw Error('中转站没有返回有效 JSON');result={};}
      if(!response.ok){const error=Error(response.status===429?'中转站上游限流，请稍后重试':`中转请求失败（HTTP ${response.status}）：${redact(result?.error?.message||result?.message||'请检查模型配置',key)}`);error.status=response.status;const retry=Number(response.headers?.get('retry-after'));error.retryAfter=Number.isFinite(retry)&&retry>0?Math.min(retry,3600):0;throw error;}
      if(controller.signal.aborted)throw aborted();
      if(!authorized()||scope!==getScope()||directory!==getDirectory()||read().revision!==value.revision)throw Error('账号或模型配置已改变，本次结果已作废');
      const output=value.apiFormat==='responses'?(result.output_text||result.output?.flatMap(item=>item.content||[]).filter(item=>item.type==='output_text').map(item=>item.text).join('')):result.choices?.[0]?.message?.content;
      if(typeof output!=='string'||!output.trim())throw Error('模型没有返回可用文本');
      const usage={};for(const name of ['prompt_tokens','completion_tokens','total_tokens','input_tokens','output_tokens'])if(Number.isFinite(result.usage?.[name])&&result.usage[name]>=0)usage[name]=result.usage[name];
      return {text:redact(output.trim(),key,2*1024*1024),durationMs:Date.now()-started,usage:Object.keys(usage).length?usage:null,requestId:crypto.randomUUID()};
    }catch(error){
      // A fresh Error avoids preserving a fetch error's credential-bearing stack or cause.
      const safe=Error(controller.signal.aborted?'模型请求超时或已取消，请重试':redact(error?.message||'模型请求失败',key));if(Number.isInteger(error?.status))safe.status=error.status;if(Number.isFinite(error?.retryAfter))safe.retryAfter=error.retryAfter;if(controller.signal.aborted)safe.code='AI_PROVIDER_CANCELLED';throw safe;
    }finally{clearTimeout(timer);active.delete(controller);}
  }
  async function test(){
    const scope=getScope(),directory=getDirectory(),value=read();
    const result=await generate([{role:'user',content:'Reply with exactly OK. This is a connectivity test.'}],{maxTokens:64});
    const probe={ok:true,at:new Date().toISOString(),durationMs:result.durationMs,reply:result.text.slice(0,100)};
    if(authorized()&&getScope()===scope&&getDirectory()===directory&&read().revision===value.revision)atomicWrite(file(),{...read(),lastProbe:probe});
    return probe;
  }
  return {status,save,generate,test,cancelAll};
}
module.exports={createProvider,normalizeBase,atomicWrite,readJson};
