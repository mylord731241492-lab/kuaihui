'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {createRuntime}=require('../app-asar/dist-electron/juhe-ai-runtime.cjs');
const {createKnowledgeStore}=require('../app-asar/dist-electron/juhe-ai-knowledge.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'juhe-runtime-'));
let account='a',allowed=true,enabled=false,mode='AI_RGA',switchValue=1,sensitiveWords=[],behavior='answer',calls=0,captured,release;
const directory=()=>path.join(root,account),store=createKnowledgeStore({getDirectory:directory});
const provider={status:()=>({ready:true,enabled,enabledShopIds:['101'],autoLearn:true}),save:()=>({}),test:async()=>({ok:true}),cancelAll(){},async generate(messages){calls++;captured=messages;if(behavior==='wait')await new Promise(r=>release=r);if(behavior==='error')throw Error('中转站上游限流，请稍后重试');if(behavior==='bad')return {text:'not JSON'};if(behavior==='learn')return {text:JSON.stringify({summary:'500ml保温杯',facts:[{field:'容量',value:'500ml',evidence:'容量500ml'}]})};if(behavior==='fake-fact')return {text:JSON.stringify({summary:'虚构承诺',facts:[{field:'发货',value:'当天发货',evidence:'当天发货'}]})};const data=JSON.parse(messages[1].content);return {text:JSON.stringify({answer:behavior==='human'?'不该发送':'48小时内发货',needsHuman:behavior==='human',reason:'资料依据',sourceIds:behavior==='fake-cite'?['knowledge:other-shop']:data.sources.slice(0,1).map(s=>s.id)}),requestId:'fixture-request'};}};
const runtime=createRuntime({getDirectory:directory,getScope:()=>account,authorized:()=>allowed,getGlobalConfig:()=>({globalAiReplySwitch:switchValue,aiReplyStrategy:mode,aiSensitiveWords:sensitiveWords}),getShopConfig:()=>({aiReplyStrategy:mode,aiSensitiveWords:sensitiveWords}),provider,collectProducts:({shopId})=>({started:true,message:shopId})});
const checks=[],check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS '+name);};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function until(predicate){for(let i=0;i<100;i++){if(predicate())return;await tick();}assert(predicate(),'Expected asynchronous state was not reached');}
function schedulerFixture(name){
  const folder=path.join(root,name),starts=[],pending=[];
  let active=0,learningActive=0,maxActive=0,maxLearning=0,allowed=true;
  const provider={status:()=>({ready:true,enabled:true,enabledShopIds:['101'],autoLearn:true}),cancelAll(){for(const job of pending.splice(0))job.reject(Error('cancelled'));},
    generate(messages){
      const learning=messages[0].content.startsWith('从商品原始文字');
      active++;if(learning)learningActive++;maxActive=Math.max(maxActive,active);maxLearning=Math.max(maxLearning,learningActive);
      let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
      const job={kind:learning?'learning':'answer',resolve:()=>{const data=learning?{summary:'原文摘要',facts:[{field:'材质',value:'纯棉',evidence:'纯棉'}]}:{answer:'使用纯棉',needsHuman:false,reason:'来源资料',sourceIds:JSON.parse(messages[1].content).sources.map(s=>s.id)};resolve({text:JSON.stringify(data)});},reject};
      starts.push(job.kind);pending.push(job);
      return promise.finally(()=>{active--;if(learning)learningActive--;const index=pending.indexOf(job);if(index>=0)pending.splice(index,1);});
    }};
  const runtime=createRuntime({getDirectory:()=>folder,getScope:()=>name,authorized:()=>allowed,getGlobalConfig:()=>({globalAiReplySwitch:1}),getShopConfig:()=>({aiReplyStrategy:'AI_RGA'}),provider});
  createKnowledgeStore({getDirectory:()=>folder}).call('save',{shopId:'101',record:{title:'是什么材质',content:'商品材质为纯棉'}});
  return {runtime,starts,pending,get maxActive(){return maxActive;},get maxLearning(){return maxLearning;},setAllowed:value=>{allowed=value;}};
}
async function main(){
  await check('automatic replies require explicit enabled account, shop and global switch',()=>{assert(!runtime.enabledForShop('101'));enabled=true;assert(runtime.enabledForShop('101'));assert(!runtime.enabledForShop('102'));switchValue=0;assert(!runtime.enabledForShop('101'));switchValue=1;allowed=false;assert(!runtime.enabledForShop('101'));allowed=true;});
  const shared=store.call('save',{record:{title:'多久发货',content:'正常48小时内发货'}}).record;
  store.call('save',{shopId:'102',record:{title:'多久发货',content:'另一店铺特殊承诺'}});
  store.call('save',{shopId:'101',record:{title:'多久发货',content:'另一商品资料',goodId:'999'}});
  await check('retrieval combines own shop and shared, excludes other shops and unrelated products',async()=>{const result=await runtime.call('runtime-preview',{shopId:'101',question:'多久发货'});assert(!result.needsHuman);assert.deepEqual(result.sources,[{id:'knowledge:'+shared.id,title:'多久发货'}]);assert(!JSON.stringify(captured).includes('另一店铺'));assert(!JSON.stringify(captured).includes('另一商品'));});
  await check('insufficient knowledge and collaboration mode never call model or invent facts',async()=>{let before=calls;const result=await runtime.call('runtime-preview',{shopId:'101',question:'可以送货到火星吗'});assert(result.needsHuman);assert.equal(calls,before);mode='AI_RGA_FILTER';const greeting=await runtime.call('runtime-preview',{shopId:'101',question:'你好'});assert(greeting.needsHuman);assert.equal(calls,before);mode='AI_RGA';});
  await check('configured sensitive words and explicit human request bypass the model',async()=>{sensitiveWords=['发货'];const before=calls;const sensitive=await runtime.call('runtime-preview',{shopId:'101',question:'多久发货'});assert(sensitive.needsHuman);assert.equal(calls,before);sensitiveWords=[];const human=await runtime.call('runtime-preview',{shopId:'101',question:'找人工客服'});assert(human.needsHuman);assert.equal(calls,before);});
  await check('exact direct-answer entries preserve authored answer without model request',async()=>{store.call('save',{shopId:'101',record:{title:'快递公司',content:'使用顺丰',sendType:1}});const before=calls,result=await runtime.call('runtime-preview',{shopId:'101',question:'快递公司？'});assert.equal(result.answer,'使用顺丰');assert.equal(calls,before);});
  await check('model failures, malformed JSON, forged citations and explicit handoff suppress answer',async()=>{for(const type of ['error','bad','fake-cite','human']){behavior=type;const result=await runtime.call('runtime-preview',{shopId:'101',question:'多久发货'});assert(result.needsHuman,type);assert.equal(result.answer,'');}behavior='answer';});
  await check('product source is manual, deduplicated and grounded learning persists',async()=>{runtime.call('product-save',{shopId:'101',product:{productId:'p1',title:'保温杯',content:'容量500ml',source:'fake-platform'}});behavior='learn';const product=await runtime.call('product-learn',{shopId:'101',productId:'p1'});assert.equal(product.observed.source,'manual');assert.equal(product.learning,'learned');assert.equal(product.extracted.facts[0].value,'500ml');assert(!runtime.productNeedsCapture('101','p1'));});
  await check('fabricated product facts fail with previous evidence retained and stale',async()=>{runtime.call('product-save',{shopId:'101',product:{productId:'p1',title:'保温杯',content:'容量600ml'}});behavior='fake-fact';const product=await runtime.call('product-learn',{shopId:'101',productId:'p1'});assert.equal(product.learning,'failed');assert(product.stale);assert.equal(product.extracted.facts[0].value,'500ml');behavior='answer';await runtime.call('runtime-preview',{shopId:'101',question:'容量是多少',productId:'p1'});const payload=JSON.parse(captured[1].content);assert(payload.sources.some(s=>s.content.includes('600ml')));assert(!JSON.stringify(payload).includes('500ml'));assert(!JSON.stringify(payload).includes('虚构承诺'));});
  await check('collaboration mode accepts real product and order sources without an FAQ match',async()=>{mode='AI_RGA_FILTER';const product=await runtime.call('runtime-preview',{shopId:'101',question:'容量是多少',productId:'p1'});assert(!product.needsHuman);assert(product.sources.some(s=>s.id==='product:p1'));const order=await runtime.call('runtime-preview',{shopId:'101',question:'订单是什么状态',orderInfo:{orderStatus:'待发货'}});assert(!order.needsHuman);assert(order.sources.some(s=>s.id==='order:current'));mode='AI_RGA';});
  await check('legacy conversation contract exposes transfer and does not call removed service',async()=>{behavior='error';const value=await runtime.conversation({shopId:'101',message:'多久发货'});const result=JSON.parse(value.data.data.output.text);assert.equal(value.data.code,200);assert.equal(result.shouldTransferToHuman,true);assert.equal(result.output,'');behavior='answer';});
  await check('history separates preview/conversation, shop/account and contains missed questions',()=>{const logs=runtime.call('runtime-history',{shopId:'101'}).records;assert(logs.some(r=>r.kind==='conversation'&&r.needsHuman));assert(logs.some(r=>r.kind==='preview'));assert(runtime.call('runtime-history',{shopId:'102'}).records.length===0);account='b';assert(runtime.call('runtime-history',{shopId:'101'}).records.length===0);assert(runtime.call('products-list',{shopId:'101'}).products.length===0);account='a';});
  await check('logout, account switch and config save discard late answers without wrong-account writes',async()=>{for(const change of ['logout','account','save']){behavior='wait';const pending=runtime.call('runtime-preview',{shopId:'101',question:'多久发货'});await new Promise(r=>setImmediate(r));if(change==='logout')allowed=false;if(change==='account')account='b';if(change==='save')runtime.call('runtime-config-save',{});release();await assert.rejects(pending,/作废/);allowed=true;account='a';}behavior='answer';});
  await check('changing reply policy or disabling the global switch discards delayed customer replies',async()=>{
    for(const change of ['sensitive','strategy','switch']){
      behavior='wait';const pending=runtime.conversation({shopId:'101',message:'多久发货'});await tick();
      if(change==='sensitive')sensitiveWords=['发货'];if(change==='strategy')mode='AI_RGA_FILTER';if(change==='switch')switchValue=0;
      release();await assert.rejects(pending,/作废/);sensitiveWords=[];mode='AI_RGA';switchValue=1;
    }behavior='answer';
  });
  await check('auth rejection covers every public action and collection validates shop',async()=>{assert.equal(runtime.call('products-collect',{shopId:'101'}).started,true);assert.throws(()=>runtime.call('products-collect',{shopId:'../escape'}));allowed=false;for(const action of ['runtime-status','runtime-config-save','runtime-history','products-list','product-save','products-collect'])assert.throws(()=>runtime.call(action,{}),/登录/);allowed=true;});
  await check('capture persists real facts immediately, while one background learning request runs',async()=>{
    const f=schedulerFixture('capture-scheduler');
    const record=await f.runtime.captureProduct({shopId:'101',productId:'p1',observed:{goodName:'T恤',goodProperties:'纯棉'}});
    assert.equal(record.observed.properties,'纯棉');await until(()=>f.starts.length===1);
    await f.runtime.captureProduct({shopId:'101',productId:'p1',observed:{goodName:'T恤',goodProperties:'纯棉'}});
    assert.equal(f.starts.length,1);assert.equal(f.runtime.call('products-list',{shopId:'101'}).products[0].learning,'learning');
    const answer=f.runtime.call('runtime-preview',{shopId:'101',question:'是什么材质',productId:'p1'});await until(()=>f.starts.length===2);
    assert.deepEqual(f.starts,['learning','answer']);f.pending.find(job=>job.kind==='answer').resolve();assert(!(await answer).needsHuman);
    f.pending.find(job=>job.kind==='learning').resolve();await until(()=>f.runtime.call('products-list',{shopId:'101'}).products[0].learning==='learned');
  });
  await check('cross-shop model tasks are bounded to two total and one learning, with replies prioritized',async()=>{
    const f=schedulerFixture('model-scheduler');for(const id of ['p1','p2','p3'])f.runtime.call('product-save',{shopId:'101',product:{productId:id,title:'T恤',content:'纯棉'}});
    const learns=['p1','p2','p3'].map(productId=>f.runtime.call('product-learn',{shopId:'101',productId}));
    const answers=[1,2].map(()=>f.runtime.call('runtime-preview',{shopId:'101',question:'是什么材质'}));
    const all=Promise.all([...learns,...answers]);await until(()=>f.starts.length===2);assert.deepEqual(f.starts,['answer','answer']);
    // Product-store learning enters its generator in a microtask, while direct
    // reply jobs already occupy both slots. Release one to admit one learner.
    f.pending[0].resolve();await until(()=>f.starts.length===3);assert.equal(f.starts[2],'learning');
    while(f.starts.length<5||f.pending.length){for(const job of [...f.pending])job.resolve();await tick();}
    await all;assert.equal(f.maxActive,2);assert.equal(f.maxLearning,1);
  });
  await check('cancelAll cancels pending and active model work without starting another queued task',async()=>{
    const f=schedulerFixture('cancel-scheduler');
    const pending=[1,2,3,4].map(()=>f.runtime.call('runtime-preview',{shopId:'101',question:'是什么材质'}));
    const all=Promise.allSettled(pending);await until(()=>f.starts.length===2);f.runtime.cancelAll();const result=await all;
    assert(result.every(item=>item.status==='rejected'));assert.equal(f.starts.length,2);
  });
}
main().then(()=>{fs.writeFileSync(path.join(__dirname,'ai-runtime-results.json'),JSON.stringify({at:new Date().toISOString(),passed:true,scope:'Production runtime, real temporary account stores, deterministic model fixture, no network or customer send',checks},null,2)+'\n','utf8');}).catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{if(path.dirname(root)===path.resolve(os.tmpdir())&&path.basename(root).startsWith('juhe-runtime-'))fs.rmSync(root,{recursive:true,force:true});});
