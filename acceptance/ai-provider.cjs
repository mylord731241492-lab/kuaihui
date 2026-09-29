'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {createProvider,normalizeBase}=require('../app-asar/dist-electron/juhe-ai-provider.cjs');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'juhe-ai-provider-'));
let directory=path.join(temporary,'account-a'),scope='account-a',allowed=true,encryptionAvailable=true;
const master=crypto.randomBytes(32),testKey='sk-local-fixture-only-not-a-real-key';
const safeStorage={
  isEncryptionAvailable:()=>encryptionAvailable,
  encryptString(value){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',master,iv),data=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),data]);},
  decryptString(value){const decipher=crypto.createDecipheriv('aes-256-gcm',master,value.subarray(0,12));decipher.setAuthTag(value.subarray(12,28));return Buffer.concat([decipher.update(value.subarray(28)),decipher.final()]).toString('utf8');}
};
const requests=[];let responder;
const options={getDirectory:()=>directory,getScope:()=>scope,authorized:()=>allowed,safeStorage,fetchImpl:async(url,request)=>{requests.push({url,request});return responder(url,request);}};
let provider=createProvider(options);
const file=()=>path.join(directory,'ai-provider.json'),bytes=()=>fs.readFileSync(file()),json=()=>JSON.parse(bytes());
const response=(data,status=200,headers={})=>new Response(typeof data==='string'?data:JSON.stringify(data),{status,headers:{'Content-Type':'application/json',...headers}});
const chat=(text='OK')=>response({choices:[{message:{content:text}}],usage:{prompt_tokens:2,completion_tokens:1,total_tokens:3}});
const messages=[{role:'user',content:'A local mocked request.'}];
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
const checks=[];
async function check(name,test){await test();checks.push(name);}
function unchanged(test,pattern){const before=bytes();assert.throws(test,pattern);assert.deepEqual(bytes(),before);}

(async()=>{
 try{
  await check('root and endpoint URLs normalize once to /v1 without double-appending; unsafe URLs rejected',()=>{
    for(const value of ['https://relay.example.test','https://relay.example.test/','https://relay.example.test/v1','https://relay.example.test/v1/','https://relay.example.test/v1/chat/completions','https://relay.example.test/v1/responses/','https://relay.example.test/chat/completions'])assert.equal(normalizeBase(value),'https://relay.example.test/v1');
    assert.equal(normalizeBase('https://relay.example.test/custom/v1/responses'),'https://relay.example.test/custom/v1');
    assert.equal(normalizeBase('http://127.0.0.1:8000'),'http://127.0.0.1:8000/v1');
    for(const value of ['http://relay.example.test','file:///secret','https://user:password@relay.example.test','https://relay.example.test?key=secret','https://relay.example.test/#fragment'])assert.throws(()=>normalizeBase(value));
  });
  await check('system encryption bridge stores only encrypted key and safe status across restart',()=>{
    const initial=provider.status();assert.equal(initial.ready,false);assert.equal(fs.existsSync(file()),false);
    const status=provider.save({baseUrl:'https://relay.example.test',model:'gpt-6-sol',apiKey:testKey});
    assert.equal(status.ready,true);assert.equal(status.enabled,false);assert.equal(status.hasApiKey,true);
    assert(!bytes().includes(Buffer.from(testKey)));assert(!JSON.stringify(status).includes(testKey));assert.equal(Object.hasOwn(status,'apiKeyEncrypted'),false);
    assert.equal(safeStorage.decryptString(Buffer.from(json().apiKeyEncrypted,'base64')),testKey);
    provider=createProvider(options);assert.equal(provider.status().ready,true);
    const encrypted=json().apiKeyEncrypted;provider.save({apiKey:'',enabledShopIds:['shop-1','shop-1',2]});assert.equal(json().apiKeyEncrypted,encrypted);assert.deepEqual(provider.status().enabledShopIds,['shop-1','2']);
  });
  await check('invalid saves, whitespace keys and unavailable encryption preserve existing file',()=>{
    unchanged(()=>provider.save({apiKey:'   '}),/密钥格式/);
    unchanged(()=>provider.save({apiKey:'one\ntwo'}),/密钥格式/);
    unchanged(()=>provider.save({enabledShopIds:['../escape']}),/店铺列表/);
    unchanged(()=>provider.save({apiKeyEncrypted:'external'}),/不支持/);
    encryptionAvailable=false;
    assert.equal(provider.status().ready,false);
    unchanged(()=>provider.save({apiKey:'another-fake'}),/加密暂不可用/);
    unchanged(()=>provider.save({enabled:true}),/无法解密/);
    encryptionAvailable=true;
    provider.save({enabled:true});assert.equal(provider.status().enabled,true);
  });
  await check('Chat Completions uses configured URL, bearer key and bounded nonstreaming payload',async()=>{
    responder=()=>chat(' 测试成功 ');const result=await provider.generate(messages,{maxTokens:123});
    const request=requests.at(-1);assert.equal(request.url,'https://relay.example.test/v1/chat/completions');assert.equal(request.request.headers.Authorization,'Bearer '+testKey);assert.equal(request.request.redirect,'error');
    const body=JSON.parse(request.request.body);assert.deepEqual(body.messages,messages);assert.equal(body.model,'gpt-6-sol');assert.equal(body.max_completion_tokens,123);assert.equal(body.stream,false);assert.equal(Object.hasOwn(body,'input'),false);
    assert.equal(result.text,'测试成功');assert.deepEqual(result.usage,{prompt_tokens:2,completion_tokens:1,total_tokens:3});assert(!JSON.stringify(result).includes(testKey));
  });
  await check('Responses adapter extracts output_text content and disables remote storage',async()=>{
    provider.save({apiFormat:'responses'});
    responder=()=>response({output:[{type:'reasoning',content:[]},{type:'message',content:[{type:'output_text',text:'第一段'},{type:'output_text',text:'第二段'}]}],usage:{input_tokens:3,output_tokens:4,total_tokens:7}});
    const result=await provider.generate(messages,{maxTokens:99});const request=requests.at(-1),body=JSON.parse(request.request.body);
    assert.equal(request.url,'https://relay.example.test/v1/responses');assert.deepEqual(body.input,messages);assert.equal(body.max_output_tokens,99);assert.equal(body.store,false);assert.equal(result.text,'第一段第二段');
    responder=()=>response({output_text:'flat output'});assert.equal((await provider.generate(messages)).text,'flat output');
    provider.save({apiFormat:'chat-completions'});
  });
  await check('429 keeps status and retry-after for JSON or HTML without exposing upstream secrets',async()=>{
    for(const data of [{error:{message:'Authorization '+testKey}},'<html>Rate limit '+testKey+'</html>']){
      responder=()=>response(data,429,{'retry-after':'13'});
      await assert.rejects(provider.generate(messages),error=>{assert.equal(error.status,429);assert.equal(error.retryAfter,13);assert.match(error.message,/限流/);assert(!error.stack.includes(testKey));return true;});
    }
  });
  await check('HTTP and fetch failures never expose a credential through message, stack, cause or enumerable fields',async()=>{
    responder=()=>response({error:{message:'Bad key '+testKey}},401);
    await assert.rejects(provider.generate(messages),error=>{assert.equal(error.status,401);assert(!error.message.includes(testKey));assert(!error.stack.includes(testKey));return true;});
    responder=()=>{const error=Error('transport leaked '+testKey,{cause:{Authorization:testKey}});error.secret=testKey;throw error;};
    await assert.rejects(provider.generate(messages),error=>{assert(!error.stack.includes(testKey));assert(!JSON.stringify(error).includes(testKey));assert.equal(error.cause,undefined);assert.equal(error.secret,undefined);return true;});
  });
  await check('successful malicious key echoes and usage extras are redacted, including persisted probe',async()=>{
    responder=()=>response({choices:[{message:{content:'OK '+testKey}}],usage:{total_tokens:1,debug:testKey}});
    const result=await provider.generate(messages);assert.match(result.text,/已隐藏/);assert(!JSON.stringify(result).includes(testKey));
    const probe=await provider.test();assert.equal(probe.ok,true);assert(!JSON.stringify(probe).includes(testKey));assert(!bytes().includes(Buffer.from(testKey)));assert(!JSON.stringify(provider.status()).includes(testKey));
  });
  await check('logout and account switch discard late response before returning generated text',async()=>{
    for(const mode of ['logout','scope','directory']){
      const gate=deferred();responder=async()=>{await gate.promise;return chat('must not be used');};const job=provider.generate(messages);
      if(mode==='logout')allowed=false;else if(mode==='scope')scope='account-b';else directory=path.join(temporary,'account-b');
      gate.resolve();await assert.rejects(job,/账号或模型配置已改变/);
      allowed=true;scope='account-a';directory=path.join(temporary,'account-a');
    }
  });
  await check('configuration changes and explicit cancellation stop requests even if fetch ignores AbortSignal',async()=>{
    for(const change of [()=>provider.cancelAll(),()=>provider.save({model:'gpt-6-sol-test'})]){
      const gate=deferred();responder=async()=>{await gate.promise;return chat('late output');};const job=provider.generate(messages);change();await assert.rejects(job,/超时或已取消/);gate.resolve();await Promise.resolve();
    }
    provider.save({model:'gpt-6-sol'});
  });
  await check('timeout settles even with a stalled fetch that does not honor cancellation',async()=>{
    const gate=deferred();responder=()=>gate.promise;const start=Date.now();await assert.rejects(provider.generate(messages,{timeoutMs:1000}),/超时或已取消/);assert(Date.now()-start<3000);gate.resolve(chat());
  });
  await check('empty, non-JSON, overlarge and invalid requests never produce a usable reply',async()=>{
    responder=()=>chat('');await assert.rejects(provider.generate(messages),/没有返回可用文本/);
    responder=()=>response('<html>not json</html>');await assert.rejects(provider.generate(messages),/没有返回有效 JSON/);
    responder=()=>response('x'.repeat(2*1024*1024+1));await assert.rejects(provider.generate(messages),/返回内容过大/);
    await assert.rejects(provider.generate(messages,{maxTokens:0}),/参数不正确/);
    allowed=false;await assert.rejects(provider.generate(messages),/请先登录/);assert.throws(()=>provider.save({model:'changed'}),/请先登录/);allowed=true;
  });
  await check('clearing key disables automatic reception without affecting another account',()=>{
    const first=directory;directory=path.join(temporary,'account-b');scope='account-b';assert.equal(provider.status().ready,false);
    provider.save({baseUrl:'https://other.example.test/v1',apiKey:'fake-account-b-key'});const second=bytes();directory=first;scope='account-a';
    provider.save({clearKey:true});assert.equal(provider.status().ready,false);assert.equal(provider.status().hasApiKey,false);assert.equal(provider.status().enabled,false);
    assert.deepEqual(fs.readFileSync(path.join(temporary,'account-b','ai-provider.json')),second);
  });
  await check('atomic write failure and malformed UTF-8 preserve original config',()=>{
    const before=bytes(),rename=fs.renameSync;fs.renameSync=()=>{throw Error('injected write failure');};try{assert.throws(()=>provider.save({model:'not-written'}),/injected/);}finally{fs.renameSync=rename;}assert.deepEqual(bytes(),before);assert.equal(fs.readdirSync(directory).filter(name=>name.endsWith('.tmp')).length,0);
    directory=path.join(temporary,'corrupt');fs.mkdirSync(directory,{recursive:true});
    for(const content of [Buffer.from('{bad'),Buffer.from([0xc3,0x28]),Buffer.from('{"version":1,"enabledShopIds":[],"apiKeyEncrypted":""}')]){fs.writeFileSync(file(),content);assert.throws(()=>provider.save({model:'not-written'}),/原文件已保留/);assert.deepEqual(bytes(),content);}
  });
  console.log(JSON.stringify({passed:true,checks,scope:'Mock fetch and mock encrypted safeStorage bridge only; no actual provider or customer account accessed.'},null,2));
 }catch(error){console.error(JSON.stringify({passed:false,checks,error:error.stack},null,2));process.exitCode=1;}
 finally{provider.cancelAll();if(path.dirname(temporary)===path.resolve(os.tmpdir())&&path.basename(temporary).startsWith('juhe-ai-provider-'))fs.rmSync(temporary,{recursive:true,force:true});}
})();
