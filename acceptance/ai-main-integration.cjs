'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app-asar/dist-electron/main.js'), 'utf8');
function section(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from);
  assert(from >= 0 && to > from, `Missing integration section: ${start}`);
  return source.slice(from, to);
}
const code = section('const juheLocalAiMessages =', 'const newProcessQueue =') + '\n' +
  section('class AiParams {', 'function buildAiOrderInfo(') + '\n' +
  section('function parseAiReplyContent(', 'function markMessageProcessed(') + '\n' +
  `globalThis.bridge = {process:juheProcessLocalMessage, ack:juheLocalAiAck, key:juheLocalAiMessageKey,
    records:juheLocalAiMessages, customers:juheLocalAiCustomers, enabled:juheLocalAiForShop,
    parse:parseAiReplyContent,collect:juheCollectLocalProducts,receiveProducts:juheReceiveLocalProducts,
    collections:juheLocalProductCollections,productTotal:juheReceiveLocalProductTotal,eventCurrent:juheLocalEventCurrent,verified:juheVerifiedAckPlatforms};`;
const tempDirs = [];
function fixture(existingDirectory) {
  const directory=existingDirectory || fs.mkdtempSync(path.join(os.tmpdir(),'juhe-ai-integration-'));
  if(!existingDirectory)tempDirs.push(directory);
  const sent = [], handoffs = [], saved = [], captures = [], calls = [];
  const flags = {authorized:true, enabled:true, expired:false, needsCapture:false, scope:'account-a'};
  let reply = {output:'这是知识库确认的回复', isAdd:0};
  const ctx = {
    crypto, console:{log(){}, warn(){}}, Date, Map, Set, Promise,setImmediate,
    fs__default:fs,path__default:path,juheBusinessDirectory:()=>directory,
    juheAuth:{legacyUser:()=>({userId:10})},
    setTimeout:(fn, ms) => setTimeout(fn, ms === 20000 ? 55 : ms), clearTimeout,
    juheAccountScope:flags.scope,
    juheBusinessAuthorized:() => flags.authorized,
    isAccountExpired:() => flags.expired,
    initshoplist:new Map([1,2].map(id => [id,{id, botStatus:0, loginInfoStatus:true, shopCategory:'服装',platformType:'拼多多'}])),
    aiToHumanReplyList:new Map(),
    shopViewsMap:new Map([1,2].map(id => [id,{webContents:{id:id+100,isDestroyed:() => false, send:(channel,data) => sent.push({shopId:id,channel,data})}}])),
    PDDMessageWindow:{win:null},
    juheAiRuntime:{
      enabledForShop:() => flags.enabled,
      productNeedsCapture:() => flags.needsCapture,
      captureProduct:async value => captures.push(value),
      conversation:async params => {calls.push(params); return {data:{code:200,data:{output:{text:JSON.stringify(reply)}}}};}
    },
    setAiToHumanReply:(message,shopId) => {handoffs.push({message,shopId});ctx.aiToHumanReplyList.set(shopId,[{messageId:message.messageId,isAiToHuman:true}]);},
    unificationAiToHuman:(shopId,messages) => messages,
    prepareProfileForAI(){},
    getShopAiConfig:() => ({aiReplyStrategy:'AI_RGA_FILTER',aiReplyFlag:'.',aiWorkMode:0}),
    buildAiOrderInfo:message => JSON.stringify({orderId:message.orderId || ''}),
    SELECTHistory:{all:() => [{role:'user',content:'上一条消息'}]},
    normalizeAiReplyStrategy:value => value,
    executePlatformTask:async () => ({goodId:'p1',goodName:'棉质T恤',goodProperties:'纯棉'}),
    parseGoodInfoByKs:value => value,
    getGoodInfoByKs:async () => ({goodId:'p1',goodName:'棉质T恤'}),
    urlToBase64:async () => '',
    markMessageProcessed:(...args) => saved.push(['processed',...args]),
    pushMessage:value => saved.push(['history',value]),
    noledgeCache:new Map(), unlock(){}
  };
  vm.createContext(ctx);vm.runInContext(code,ctx);
  // The confirmation branch is exercised with an explicit fake transaction-ACK
  // adapter. PDD's real transaction binding is covered by ai-pdd-send-ack.cjs.
  ctx.bridge.verified.add('ACK 测试平台');
  return {directory,ctx, bridge:ctx.bridge, flags, sent, handoffs, captures, calls, saved, setReply:value => {reply=value;}};
}
const tick = () => new Promise(resolve => setImmediate(resolve));
async function until(predicate) {for(let i=0;i<20;i++){if(predicate())return;await tick();}assert(predicate(),'Expected state was not reached');}
function message(extra={}) {return {messageId:'buyer1',userId:'buyer1',shopSystemId:1,content:'是什么材质',platformType:'ACK 测试平台',...extra};}
function ackSource(f,shopId=1){return {sourceScope:f.ctx.juheAccountScope,sourceContentsId:f.ctx.shopViewsMap.get(shopId).webContents.id,sourceMainFrame:true};}
function ack(f,m,shopId=1) {f.bridge.ack(shopId,{...m,juheAiMessageKey:m.juheAiMessageKey||f.bridge.key(shopId,m),juheAckVerified:true,isAiAutoReply:true},ackSource(f,shopId));}
function inboundFixture(f){
  const queued=[],profiles=[],callbacks=[];
  Object.assign(f.ctx,{ensureUserProfile:async()=>{},saveMessageProfile:(m,id)=>profiles.push({m,id}),store:{get:()=>({status:1,aiNumber:0})},
    newProcessQueueF:(m,id)=>queued.push({m,id}),newProcessQueue:(m,id)=>queued.push({m,id}),
    getCustomerCallbackResult:g=>callbacks.push(g)});
  const messageCase=section('      case "get-customer-message-list":','      case "reply-customer-message":');
  const ackCase=section('      case "get-customer-callback-result":','      case "get-goods-detail":');
  vm.runInContext(`globalThis.receiveFixture=async function(u){var n;const {id:l,channel:d,args:p}=u,
    f=initshoplist.get(l),m=shopViewsMap.get(l),h=p[0],g={id:l,data:h,sourceScope:u.sourceScope,sourceContentsId:u.sourceContentsId,sourceMainFrame:u.sourceMainFrame};
    switch(d){${messageCase}${ackCase}}};`,f.ctx);
  return {queued,profiles,callbacks,receive:packet=>f.ctx.receiveFixture(packet)};
}
const checks = [];
async function check(name,fn) {await fn();checks.push({name,passed:true});}
(async () => {
  await check('explicit opt-in and live account required, expired account always denied', async () => {
    const f=fixture(); for(const key of ['enabled','authorized']) {f.flags[key]=false;assert.equal(f.bridge.process(message(),1),undefined);f.flags[key]=true;}
    f.flags.expired=true;assert.equal(f.bridge.process(message(),1),undefined);assert.equal(f.calls.length,0);
  });
  await check('successful network ACK alone commits assistant history and completed state', async () => {
    const f=fixture(),m=message();const p=f.bridge.process(m,1);await until(()=>f.sent.length===1);
    assert.equal(f.saved.length,0);assert.equal(f.bridge.records.values().next().value.state,'sending');
    ack(f,m);await p;assert.equal(f.saved.length,2);assert.equal(f.bridge.records.values().next().value.state,'confirmed');
    assert.equal(f.bridge.process(m,1),undefined);assert.equal(f.sent.length,1);
    assert.equal(f.calls[0].shopId,'1');assert.equal(f.calls[0].messages.length,2);
  });
  await check('duplicate during generation and dispatch is suppressed', async () => {
    const f=fixture(),m=message();let done;f.ctx.juheAiRuntime.conversation=()=>new Promise(resolve=>{done=resolve;});
    const p=f.bridge.process(m,1);await until(()=>done);assert.equal(f.bridge.process(m,1),undefined);
    done({data:{code:200,data:{output:{text:JSON.stringify({output:'确认回复'})}}}});await until(()=>f.sent.length===1);
    assert.equal(f.bridge.process(m,1),undefined);ack(f,m);await p;
  });
  await check('identical customer and question remain isolated by shop and account', async () => {
    const f=fixture(),m=message();const a=f.bridge.key(1,m),b=f.bridge.key(2,m);assert.notEqual(a,b);
    f.ctx.juheAccountScope='account-b';assert.notEqual(f.bridge.key(1,m),a);
  });
  await check('legacy customer-ID messages can be asked again after completed deduplication expires', async () => {
    const f=fixture(),m=message();const p=f.bridge.process(m,1);await until(()=>f.sent.length===1);ack(f,m);await p;
    f.bridge.records.values().next().value.expiresAt=Date.now()-1;
    const q=f.bridge.process(m,1);await until(()=>f.sent.length===2);ack(f,m);await q;
  });
  await check('new source message is not lost and per-customer generation is serialized', async () => {
    const f=fixture(),m=message({msgId:'m1'}),next=message({msgId:'m2'});
    const p=f.bridge.process(m,1),q=f.bridge.process(next,1);await until(()=>f.sent.length===1);assert.equal(f.calls.length,1);
    ack(f,{...m,juheAiMessageKey:f.bridge.key(1,m)});await p;await until(()=>f.sent.length===2);
    ack(f,{...next,juheAiMessageKey:f.bridge.key(1,next)});await q;assert.equal(f.calls.length,2);
  });
  await check('human-required response has no dispatch', async () => {
    const f=fixture();f.setReply({output:'',shouldTransferToHuman:true,reason:'缺少可靠商品资料'});
    await f.bridge.process(message(),1);assert.equal(f.sent.length,0);assert.equal(f.handoffs.length,1);assert.equal(f.saved.length,0);
  });
  await check('parse failure never sends raw model output or fabricated fallback', async () => {
    const f=fixture();for(const value of [null,{}, {output:{text:'not json'}},{output:{text:'{"output":42}'}}]) {
      const result=f.bridge.parse(value,1,message());assert.equal(result.text,'');assert.equal(result.shouldTransferToHuman,true);
    }
  });
  await check('explicit handoff takes priority over a nonempty model output',async()=>{
    const f=fixture(),result=f.bridge.parse({output:{text:JSON.stringify({output:'不可发送的答案',shouldTransferToHuman:true,reason:'证据不足'})}},1,message());
    assert.equal(result.shouldTransferToHuman,true);assert.equal(result.text,'');
  });
  await check('generation error is retryable after user restores AI, never confirmed early', async () => {
    const f=fixture(),m=message();f.ctx.juheAiRuntime.conversation=async()=>{throw Error('transport');};
    await f.bridge.process(m,1);assert.equal(f.saved.length,0);assert.equal(f.handoffs.length,1);
    assert.equal(f.bridge.records.values().next().value.state,'failed');f.ctx.aiToHumanReplyList.clear();
    f.ctx.juheAiRuntime.conversation=async()=>({data:{code:200,data:{output:{text:'{"output":"确认回复"}'}}}});
    const p=f.bridge.process(m,1);await until(()=>f.sent.length===1);ack(f,m);await p;
  });
  await check('logout or account switch while generating blocks delayed dispatch', async () => {
    for(const change of ['logout','scope','enabled','human']){
      const f=fixture();let done;f.ctx.juheAiRuntime.conversation=()=>new Promise(resolve=>{done=resolve;});
      const p=f.bridge.process(message(),1);await until(()=>done);
      if(change==='logout')f.flags.authorized=false;if(change==='scope')f.ctx.juheAccountScope='account-b';
      if(change==='enabled')f.flags.enabled=false;if(change==='human')f.ctx.aiToHumanReplyList.set(1,[{messageId:'buyer1',isAiToHuman:true}]);
      done({data:{code:200,data:{output:{text:'{"output":"回复"}'}}}});await p;assert.equal(f.sent.length,0,change);
    }
  });
  await check('observed product data is captured through existing platform hook', async () => {
    const f=fixture();f.flags.needsCapture=true;const m=message({goodId:'p1'}),p=f.bridge.process(m,1);
    await until(()=>f.sent.length===1);assert.equal(f.captures.length,1);assert.equal(f.captures[0].observed.goodName,'棉质T恤');ack(f,m);await p;
  });
  await check('wrong product ID returned by platform is not saved under the requested item', async () => {
    const f=fixture();f.flags.needsCapture=true;f.ctx.executePlatformTask=async()=>({goodId:'wrong-product',goodName:'错误商品'});
    const m=message({goodId:'p1'}),p=f.bridge.process(m,1);await until(()=>f.sent.length===1);assert.equal(f.captures.length,0);ack(f,m);await p;
  });
  await check('normal channel does not overwrite a human draft', async () => {
    const f=fixture();f.ctx.operatingWaiter={wait:async()=>({hasContent:true})};f.ctx.isUserOperating=new Map();
    await f.bridge.process(message({platformType:'淘工厂'}),1);assert.equal(f.calls.length,0);
    assert.equal(f.sent.filter(item=>item.channel==='reply-message').length,0);
  });
  await check('timer-only platform callback remains unconfirmed and requires human inspection', async () => {
    const f=fixture(),m=message({platformType:'视频号'}),p=f.bridge.process(m,1);await until(()=>f.sent.length===1);
    ack(f,m);await p;assert.equal(f.bridge.records.values().next().value.state,'unconfirmed');assert.equal(f.saved.length,0);
    assert.equal(f.handoffs.length,1);assert.equal(f.bridge.process(m,1),undefined);
  });
  await check('missing send acknowledgement is not retried or recorded as sent', async () => {
    const f=fixture(),m=message();await f.bridge.process(m,1);assert.equal(f.sent.length,1);assert.equal(f.saved.length,0);
    assert.equal(f.bridge.records.values().next().value.state,'unconfirmed');assert.equal(f.bridge.process(m,1),undefined);
  });
  await check('synchronous dispatch failure releases lock and leaves failed state', async () => {
    const f=fixture();f.ctx.shopViewsMap.get(1).webContents.send=()=>{throw Error('destroyed');};await f.bridge.process(message(),1);
    assert.equal(f.bridge.records.values().next().value.state,'failed');assert.equal(f.saved.length,0);assert.equal(f.handoffs.length,1);
  });
  await check('delivery journal is written before dispatch and suppresses unresolved send after restart',async()=>{
    const f=fixture(),m=message();let journalAtDispatch;
    const original=f.ctx.shopViewsMap.get(1).webContents.send;
    f.ctx.shopViewsMap.get(1).webContents.send=(...args)=>{journalAtDispatch=JSON.parse(fs.readFileSync(path.join(f.directory,'ai-delivery-journal.json'),'utf8'));original(...args);};
    await f.bridge.process(m,1);assert.equal(journalAtDispatch.items[0].state,'sending');
    const raw=fs.readFileSync(path.join(f.directory,'ai-delivery-journal.json'),'utf8');assert(!raw.includes(m.content));
    const restarted=fixture(f.directory);assert.equal(restarted.bridge.process(m,1),undefined);
    assert.equal(restarted.sent.length,0);assert.equal(restarted.handoffs.length,1);
  });
  await check('corrupt delivery journal prevents dispatch without overwriting evidence',async()=>{
    const f=fixture();fs.writeFileSync(path.join(f.directory,'ai-delivery-journal.json'),'broken','utf8');
    assert.equal(f.bridge.process(message(),1),undefined);assert.equal(f.sent.length,0);assert.equal(f.handoffs.length,1);
    assert.equal(fs.readFileSync(path.join(f.directory,'ai-delivery-journal.json'),'utf8'),'broken');
  });
  await check('explicit product collection binds account, shop and actual main-frame sender',async()=>{
    const f=fixture();assert.equal(f.bridge.receiveProducts(1,[{goodId:'p1'}],101,true),false);
    const result=await f.bridge.collect({shopId:'1'});assert.equal(result.started,true);assert.equal(f.sent[0].channel,'get-goods-all-detail');
    const payload=[{goodId:'p1',goodName:'真实商品',id:'other-shop'}];
    assert.equal(f.bridge.receiveProducts(1,payload,102,true,'account-a'),false);assert.equal(f.bridge.receiveProducts(1,payload,101,false,'account-a'),false);
    assert.equal(f.bridge.receiveProducts(1,payload,101,true,'account-a'),true);await f.bridge.collections.get(1).work;
    assert.equal(f.captures.length,1);assert.equal(f.captures[0].shopId,'1');assert.equal(f.captures[0].observed.goodName,'真实商品');
    f.ctx.juheAccountScope='account-b';assert.equal(f.bridge.receiveProducts(1,[{goodId:'p2'}],101,true,'account-a'),false);
  });
  await check('bulk aliases save video/XHS product facts and process more than 500 returned items',async()=>{
    const f=fixture();await f.bridge.collect({shopId:'1'});f.bridge.productTotal(1,{total:510},101,true,'account-a');
    const payload=Array.from({length:510},(_,i)=>({goods_id:'p'+i,goods_name:'真实商品',goods_desc:'纯棉描述',goods_cat:'服装',goods_properties:'纯棉',goods_sku:'红色',goods_url:'https://example.com/main.png',urls:['https://example.com/detail.png']}));
    f.bridge.receiveProducts(1,payload,101,true,'account-a');await f.bridge.collections.get(1).work;
    assert.equal(f.captures.length,510);assert.equal(f.captures[0].observed.goodDescription,'纯棉描述');assert.equal(f.captures[0].observed.detailImages.length,1);
    assert.equal(f.bridge.collections.get(1).state,'complete');
  });
  await check('Kuaishou task IDs on every page do not prematurely complete collection',async()=>{
    const f=fixture();await f.bridge.collect({shopId:'1'});const job=f.bridge.collections.get(1);
    f.bridge.productTotal(1,{total:2},101,true,'account-a');f.bridge.receiveProducts(1,[{goodId:'p1',goodName:'商品1',aiTaskId:job.id}],101,true,'account-a');await job.work;
    assert.equal(job.state,'running');f.bridge.receiveProducts(1,[{goodId:'p2',goodName:'商品2',aiTaskId:job.id}],101,true,'account-a');await job.work;
    assert.equal(job.state,'complete');assert.equal(f.captures.length,2);
  });
  await check('XHS collection rejects missing real seller identity and stale shop after identity check',async()=>{
    const f=fixture();f.ctx.initshoplist.get(1).platformType='小红书';f.ctx.shopViewsMap.get(1).webContents.executeJavaScript=async()=>'';
    await assert.rejects(f.bridge.collect({shopId:'1'}),/店铺身份/);assert.equal(f.sent.length,0);
    f.ctx.shopViewsMap.get(1).webContents.executeJavaScript=async()=>{f.ctx.juheAccountScope='other';return 'actual-seller-123';};
    await assert.rejects(f.bridge.collect({shopId:'1'}),/已变化/);assert.equal(f.sent.length,0);
    f.ctx.juheAccountScope='account-a';f.ctx.shopViewsMap.get(1).webContents.executeJavaScript=async()=>'actual-seller-123';
    await f.bridge.collect({shopId:'1'});assert.equal(f.sent[0].data.sellerId,'actual-seller-123');
  });
  await check('ACK requires exact local dispatch token and current account, view and top frame',async()=>{
    const f=fixture(),m=message(),p=f.bridge.process(m,1);await until(()=>f.sent.length===1);
    const packet={...m,isAiAutoReply:true,juheAckVerified:true,juheAiMessageKey:f.bridge.key(1,m)},valid=ackSource(f);
    for(const invalid of [{...valid,sourceMainFrame:false},{...valid,sourceScope:'other'},{...valid,sourceContentsId:102}])assert.equal(f.bridge.ack(1,packet,invalid),null);
    assert.equal(f.bridge.ack(1,{...packet,juheAiMessageKey:undefined},valid),null);assert.equal(f.saved.length,0);ack(f,m);await p;
  });
  await check('actual weak platform callbacks never claim confirmed delivery',async()=>{
    for(const platformType of ['拼多多','抖店','小红书','视频号','快手','淘工厂']){
      const f=fixture();f.ctx.operatingWaiter={wait:async()=>({hasContent:false})};f.ctx.isUserOperating=new Map();
      const m=message({platformType}),p=f.bridge.process(m,1);await until(()=>f.sent.some(item=>item.channel==='reply-message'));
      f.bridge.ack(1,{...m,juheAiMessageKey:f.bridge.key(1,m),isAiAutoReply:true,juheAckVerified:false},ackSource(f));await p;assert.equal(f.saved.length,0,platformType);assert.equal(f.bridge.records.values().next().value.state,'unconfirmed',platformType);
    }
  });
  await check('PDD transaction-verified acknowledgement completes local delivery',async()=>{
    const f=fixture(),m=message({platformType:'拼多多'}),pending=f.bridge.process(m,1);
    await until(()=>f.sent.some(item=>item.channel==='reply-message'));ack(f,m);await pending;
    assert.equal(f.bridge.records.values().next().value.state,'confirmed');assert.equal(f.saved.length,2);
  });
  await check('real receive-case code blocks old view, foreign frame and account before profile/history/AI',async()=>{
    for(const bad of [{sourceScope:'other'},{sourceMainFrame:false},{sourceContentsId:999}]){
      const f=fixture(),inbound=inboundFixture(f);await inbound.receive({id:1,channel:'get-customer-message-list',args:[[{...message(),type:'code'}]],...ackSource(f),...bad});
      assert.equal(inbound.profiles.length,0);assert.equal(inbound.queued.length,0);assert.equal(f.saved.length,0);
    }
  });
  await check('real receive-case revalidates account and view after awaiting profile collection',async()=>{
    for(const change of ['account','view']){
      const f=fixture(),inbound=inboundFixture(f);let release;
      f.ctx.ensureUserProfile=()=>new Promise(resolve=>{release=resolve;});
      const receive=inbound.receive({id:1,channel:'get-customer-message-list',args:[[{...message(),type:'code'}]],...ackSource(f)});await until(()=>release);
      if(change==='account')f.ctx.juheAccountScope='other';else f.ctx.shopViewsMap.get(1).webContents.id=999;
      release();await receive;assert.equal(inbound.profiles.length,0);assert.equal(inbound.queued.length,0);assert.equal(f.saved.length,0);
    }
  });
  await check('real receive-case delivers authorized local messages despite unavailable legacy quota',async()=>{
    const f=fixture(),inbound=inboundFixture(f);await inbound.receive({id:1,channel:'get-customer-message-list',args:[[message()]],...ackSource(f)});
    assert.equal(inbound.profiles.length,1);assert.equal(inbound.queued.length,1);assert.equal(inbound.queued[0].m.juheAiSource.scope,'account-a');
    await inbound.receive({id:1,channel:'get-customer-callback-result',args:[{...message(),juheAiMessageKey:'a'.repeat(64)}],...ackSource(f),sourceMainFrame:false});assert.equal(inbound.callbacks.length,0);
  });
  await check('both legacy queue entries select local branch, callback and logout are connected',async()=>{
    for(const name of ['const newProcessQueue =','}, newProcessQueueF ='])assert.match(section(name,'if (isAccountExpired()').slice(0,450),/juheProcessLocalMessage\(e, t\)/);
    assert.match(source,/const localAck = juheLocalAiAck\(n, s, e\)/);
    assert.match(section('}, resetRuntimeForLogout =','}, getShopView ='),/juheLocalAiMessages\.clear\(\)/);
    assert.match(source,/runtime:juheAiRuntime/);
  });
  const report={passed:true,checks,limitations:['Dispatch is tested with isolated fake shop WebContents and protocol fixtures; no real customer was messaged.','PDD is enabled only with transaction-verified acknowledgement; other current platform adapters retain unconfirmed delivery until stronger protocol correlation is implemented.']};
  fs.writeFileSync(path.join(__dirname,'ai-main-integration-results.json'),JSON.stringify(report,null,2)+'\n','utf8');
  process.stdout.write(JSON.stringify({passed:true,count:checks.length})+'\n');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{
  for(const directory of tempDirs)fs.rmSync(directory,{recursive:true,force:true});
});
