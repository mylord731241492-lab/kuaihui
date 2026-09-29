'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const files=[
  '../app-asar/dist/preload-package/xhs/customer.cjs',
  '../app-asar/dist/assets/customer-3d5EJCqt.cjs'
];
const key='a'.repeat(64),checks=[];
const packet=(chat='chat-a',text='本次 AI 回复',id='msg-1',at=10000)=>({appCid:chat,msgId:id,receivedAt:at,contentInfo:{contentType:1,content:JSON.stringify({type:1,data:JSON.stringify({content_type:1,content:text})})}});
function fixture(relative){
 const source=fs.readFileSync(path.join(__dirname,relative),'utf8');
 const start=source.indexOf('// JUHE_XHS_LOCAL_ACK_BEGIN'),end=source.indexOf('// JUHE_XHS_LOCAL_ACK_END',start);
 assert(start>=0&&end>start);
 const helper=source.slice(start,end);
 const handlerStart=source.indexOf('safeIpcOn("reply-message"',end),handlerEnd=source.indexOf('safeIpcOn("get-shop-pwd"',handlerStart);
 assert(handlerStart>=0&&handlerEnd>handlerStart);
 const handler=source.slice(handlerStart,handlerEnd).trim().replace(/\),$/u,');');
 const events=[],handlers=new Map(),oldQueue=new Map();let currentTime=10000,onPost=()=>{};
 class Clock extends Date{static now(){return currentTime;}}
 const context=vm.createContext({Map,Set,JSON,String,Number,Array,Date:Clock,Promise,console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,
  xhsSendAckQueue:oldQueue,pushXhsSendAck:(chat,receipt)=>{if(!oldQueue.has(chat))oldQueue.set(chat,[]);oldQueue.get(chat).push(receipt);},
  waitForXhsSendAckCount:async()=>[],safeIpcOn:(channel,callback)=>handlers.set(channel,callback),
  ipcRenderer:{send:(channel,data)=>events.push({channel,data})},window:{postMessage:(message)=>onPost(message)},delay:async()=>{},sendImage:async()=>true
 });
 vm.runInContext(helper+'\n'+handler+'\nglobalThis.testApi={begin:juheBeginXhsLocalReply,arm:juheArmXhsLocalReply,record:juheRecordXhsReceipt,forward:juheForwardXhsReceipt,wait:juheWaitXhsLocalReceipt,decode:juheXhsAckText};',context);
 return {source,helper,api:context.testApi,events,handlers,oldQueue,time:value=>currentTime=value,post:callback=>onPost=callback};
}
async function check(name,fn){await fn();checks.push(name);}
(async()=>{
 try{
  const fixtures=files.map(fixture);
  assert.equal(fixtures[0].helper,fixtures[1].helper,'Packaged and asset preload must use identical local receipt logic');
  for(let index=0;index<fixtures.length;index++){
   const prefix=index===0?'packaged':'asset';
   await check(prefix+': exact nested platform text is decoded; nontext or missing evidence cannot match',()=>{
    const f=fixture(files[index]);assert.equal(f.api.decode(packet().contentInfo),'本次 AI 回复');assert.equal(f.api.decode({contentType:2,content:'image'}),'');assert.equal(f.api.decode(undefined),'');
    const task=f.api.begin({juheAiMessageKey:key},'chat-a','本次 AI 回复');f.api.arm(task);
    assert.equal(f.api.record({...packet(),contentInfo:undefined}).localMatched,false);assert.equal(task.receipt,null);
   });
   await check(prefix+': old queued receipts and pre-send receipts do not acknowledge a new local send',()=>{
    const f=fixture(files[index]);f.oldQueue.set('chat-a',[packet()]);const task=f.api.begin({juheAiMessageKey:key},'chat-a','本次 AI 回复');f.api.arm(task);
    assert.equal(f.oldQueue.has('chat-a'),false);assert.equal(f.api.record(packet('chat-a','本次 AI 回复','old',9999)).localMatched,false);assert.equal(task.receipt,null);
   });
   await check(prefix+': wrong conversation or human text cannot confirm a pending AI reply',async()=>{
    const f=fixture(files[index]);const task=f.api.begin({juheAiMessageKey:key},'chat-a','本次 AI 回复');f.api.arm(task);
    assert.equal(f.api.record(packet('other-chat')).localMatched,false);assert.equal(task.receipt,null);
    f.api.forward(packet('chat-a','人工接管后的回复','human'));assert.equal(task.cancelled,true);assert.equal(await f.api.wait(task,10),null);assert.equal(f.events.at(-1).data.isAiAutoReply,undefined);
    assert.equal(f.api.record(packet('chat-a','本次 AI 回复','late-ai')).localMatched,false);
   });
   await check(prefix+': matching current conversation/text/time carries local flag but never claims verified transaction',async()=>{
    const f=fixture(files[index]);const task=f.api.begin({juheAiMessageKey:key},'chat-a','本次 AI 回复');f.api.arm(task);const pending=f.api.wait(task,100);
    f.api.forward(packet());const result=await pending;assert.equal(result.localMatched,true);assert.equal(result.juheAckVerified,false);assert.equal(result.juheAiMessageKey,key);
    const event=f.events.at(-1);assert.equal(event.channel,'reply-customer-message');assert.equal(event.data.isAiAutoReply,true);assert.equal(event.data.juheAiMessageKey,key);assert.equal(event.data.juheAckVerified,false);
    assert.equal(f.api.record(packet()),null,'Duplicate receipt must not consume another pending send');
   });
   await check(prefix+': timeout and missing IDs keep delivery unconfirmed',async()=>{
    const f=fixture(files[index]);const task=f.api.begin({juheAiMessageKey:key},'chat-a','本次 AI 回复');f.api.arm(task);
    assert.equal(f.api.record({...packet(),msgId:''}),null);assert.equal(await f.api.wait(task,10),null);assert.equal(task.receipt,null);
   });
   await check(prefix+': actual reply-message handler ignores stale queue and returns only the current matched receipt',async()=>{
    const f=fixture(files[index]);f.oldQueue.set('chat-a',[packet('chat-a','旧人工回复','old')]);
    f.post(message=>{if(message.type==='send-message')f.api.forward(packet(message.data.chatId,message.data.contentInfo.content,'new'));});
    await f.handlers.get('reply-message')({},JSON.stringify([{messageId:'chat-a',replyContent:'本次 AI 回复',juheAiMessageKey:key}]));
    const callbacks=f.events.filter(event=>event.channel==='get-customer-callback-result');assert.equal(callbacks.length,1);assert.equal(callbacks[0].data.juheAckVerified,false);assert.equal(callbacks[0].data.juheAckEvidence.msgId,'new');assert.equal(callbacks[0].data.juheAiMessageKey,key);
   });
   await check(prefix+': manual event without a local task remains a manual reply',()=>{
    const f=fixture(files[index]);f.api.forward(packet('chat-a','普通人工回复','manual'));const event=f.events.at(-1);assert.equal(event.data.content,'普通人工回复');assert.equal(event.data.isAiAutoReply,undefined);assert.equal(event.data.juheAiMessageKey,undefined);
   });
  }
  console.log(JSON.stringify({passed:true,checks,scope:'Both actual XHS preload helper blocks and reply-message handlers evaluated with recorded protocol shape; no platform network or customer messages. Transaction identity remains unverified.'},null,2));
 }catch(error){console.error(JSON.stringify({passed:false,checks,error:error.stack},null,2));process.exitCode=1;}
})();
