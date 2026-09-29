// Execute the actual preload dispatch and injected XHR hooks against protocol fixtures.
// No platform network or customer messages are sent.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const files=['app-asar/dist/preload-package/pdd/customer.cjs','app-asar/dist/assets/customer-BAHSo8oQ.cjs'];
const report={at:new Date().toISOString(),checks:[],networkRequests:0};
const key=n=>String(n).padStart(64,'a');
function fixture(file){
  const source=fs.readFileSync(path.join(root,file),'utf8'),start=source.indexOf('const insertScriptStr = () => {');
  const marker=source.indexOf('quality-socket-message',start),end=source.lastIndexOf('};',marker)+2;
  assert(start>0&&end>start);
  const replyStart=source.indexOf('let juhePddLastRequestId = 0;'),replyEnd=source.indexOf('const processNextMessage',replyStart);
  assert(replyStart>0&&replyEnd>replyStart);
  let now=1790420000000,currentUid='';const calls=[],posted=[],timers=[],events={},handlers={};
  class FixedDate extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
  class XHR{
    constructor(){this.listeners=[];this.status=0;this.response='';}
    open(method,url){this.method=method;this.url=url;}
    send(body){this.body=body;}
    addEventListener(name,listener,options){this.listeners.push({name,listener,once:options?.once});}
    complete(response={result:'ok'},status=200){this.status=status;this.response=typeof response==='string'?response:JSON.stringify(response);const active=this.listeners.filter(item=>item.name==='load');this.listeners=this.listeners.filter(item=>item.name!=='load'||!item.once);for(const item of active)item.listener.call(this);}
  }
  const document={addEventListener:(type,fn)=>{(events[type]||=[]).push(fn);},querySelector:selector=>selector==='[currentuid]'?{getAttribute:()=>currentUid}:selector==='.conv-today'?{textContent:'今日 (3)'}:null,querySelectorAll:()=>[]};
  class Socket{constructor(){this.listeners={};}addEventListener(type,fn){(this.listeners[type]||=[]).push(fn);}emit(type,data){for(const listener of this.listeners[type]||[])listener(data);}close(){}}
  const window={fetch:async()=>{throw Error('Network forbidden');},WebSocket:Socket,context_bridge:{send:(name,data)=>calls.push({name,data:JSON.parse(JSON.stringify(data))})},addEventListener:(type,fn)=>{(events[type]||=[]).push(fn);},postMessage:data=>{posted.push(JSON.parse(JSON.stringify(data)));for(const handler of events.message||[])handler({data});}};
  const ctx=vm.createContext({window,document,XMLHttpRequest:XHR,navigator:{},Date:FixedDate,console:{log(){},info(){},error(){},warn(){}},setTimeout:(fn,delay)=>{timers.push({fn,delay});return timers.length;},setInterval:()=>1,clearTimeout(){},fetch:window.fetch,
    safeIpcOn:(channel,handler)=>{handlers[channel]=handler;},sendInsert:true,antigain:()=>'',sendImageToUser(){throw Error('Unexpected image');},imageUrlToBase64(){throw Error('Unexpected image');},preloadOrderAndGoodsByNeedOrder(){},ipcRenderer:{send(){},invoke(){}}});
  vm.runInContext(source.slice(start,end)+'\ninsertScriptStr();',ctx,{filename:file+':injected'});
  vm.runInContext(source.slice(replyStart,replyEnd),ctx,{filename:file+':dispatch'});
  const dispatch=(messageKey,content='准确回复',customer='customer-1')=>{
    const offset=posted.length,item={messageId:customer,userId:customer,replyContent:content};if(messageKey)item.juheAiMessageKey=messageKey;
    handlers['reply-message']({},JSON.stringify([item]));
    const queue=timers.filter(timer=>timer.delay===500);for(const timer of queue){timers.splice(timers.indexOf(timer),1);timer.fn();}
    const messages=posted.slice(offset),packet=messages.find(message=>message.type==='send-message'),metadata=messages.find(message=>message.type==='SET_AI_REPLY_INFO');
    assert(packet&&metadata);return {packet:packet.data,metadata:metadata.data};
  };
  const request=(packet,method='post',url='/plateau/chat/send_message',xhr=new XHR())=>{xhr.open(method,url);xhr.send(JSON.stringify({data:packet}));return xhr;};
  const verified=()=>calls.filter(call=>call.data?.juheAckVerified===true);
  return {dispatch,request,verified,calls,window,events,XHR,now:()=>now,advance:ms=>{now+=ms;},manual:uid=>{currentUid=uid;for(const handler of events.keydown||[])handler({});}};
}
function run(file){
  const check=(name,task)=>{task();report.checks.push(file+': '+name);console.log('PASS '+path.basename(path.dirname(file))+' '+name);};
  check('Same-millisecond dispatches have unique safe request IDs and preserve millisecond message timestamps',()=>{
    const f=fixture(file),a=f.dispatch(key(1)),b=f.dispatch(key(2));assert.notEqual(a.packet.request_id,b.packet.request_id);assert(Number.isSafeInteger(a.packet.request_id));assert(Number.isSafeInteger(b.packet.request_id));assert.equal(a.packet.message.ts,f.now());assert.equal(a.metadata.juheAiRequestId,a.packet.request_id);assert.notEqual(a.metadata.juheAiSendToken,b.metadata.juheAiSendToken);assert.equal(f.window._aiReplyCountMap.size,0);
  });
  check('Old AI and manual success for the same customer cannot acknowledge a newly queued local AI reply',()=>{
    const f=fixture(file),old=f.dispatch(null,'旧AI内容'),oldXhr=f.request(old.packet),next=f.dispatch(key(3),'新AI内容');
    f.manual('customer-1');const manual={...next.packet,request_id:f.now(),message:{...next.packet.message,content:'人工回复'}};f.request(manual).complete();oldXhr.complete();assert.equal(f.verified().length,0);
    assert(f.calls.some(call=>call.name==='reply-customer-message'));
    assert(f.calls.filter(call=>call.name==='get-customer-callback-result').every(call=>!call.data.juheAiMessageKey&&!call.data.juheAckVerified));
    f.request(next.packet).complete();assert.equal(f.verified().length,1);assert.equal(f.verified()[0].data.juheAiMessageKey,key(3));
  });
  check('Concurrent same-customer replies bind to their original transaction even when responses arrive out of order',()=>{
    const f=fixture(file),a=f.dispatch(key(4),'第一条'),xa=f.request(a.packet),b=f.dispatch(key(5),'第二条'),xb=f.request(b.packet);xb.complete();xa.complete();assert.deepEqual(f.verified().map(call=>call.data.juheAiMessageKey),[key(5),key(4)]);assert.deepEqual(f.verified().map(call=>call.data.replyContent),['第二条','第一条']);
  });
  check('Wrong request ID, customer or content never confirms; only the matching request confirms once',()=>{
    const f=fixture(file),a=f.dispatch(key(6));
    f.request({...a.packet,request_id:a.packet.request_id+99}).complete();
    f.request({...a.packet,message:{...a.packet.message,to:{uid:'another-customer'}}}).complete();
    f.request({...a.packet,message:{...a.packet.message,content:'wrong content'}}).complete();assert.equal(f.verified().length,0);
    f.request(a.packet).complete();f.request(a.packet).complete();assert.equal(f.verified().length,1);assert.equal(f.verified()[0].data.juheAiSendToken,a.metadata.juheAiSendToken);
  });
  check('HTTP failures, result errors, misleading nested success and malformed JSON do not confirm',()=>{
    const f=fixture(file),a=f.dispatch(key(7));f.request(a.packet).complete({result:'ok'},500);f.request(a.packet).complete({result:'error'});f.request(a.packet).complete({error:{result:'ok'}});f.request(a.packet).complete('not json');assert.equal(f.verified().length,0);f.request(a.packet,'POST','https://mms.pinduoduo.com/plateau/chat/send_message').complete('{ "result" : "ok" }');assert.equal(f.verified().length,1);
  });
  check('The send-time snapshot cannot adopt registration or changed metadata that arrived after sending',()=>{
    const f=fixture(file),id=f.now()*1000,packet={request_id:id,message:{to:{uid:'customer-1'},content:'same text'}},xhr=f.request(packet);
    f.window.postMessage({type:'SET_AI_REPLY_INFO',data:{messageId:'customer-1',replyContent:'same text',juheAiMessageKey:key(8),juheAiRequestId:id,juheAiSendToken:String(id)+':'+key(8)}});xhr.complete();assert.equal(f.verified().length,0);
    const actual=f.request(packet);f.window.postMessage({type:'SET_AI_REPLY_INFO',data:{messageId:'customer-1',replyContent:'same text',juheAiMessageKey:key(9),juheAiRequestId:id,juheAiSendToken:String(id)+':'+key(9)}});actual.complete();assert.equal(f.verified().length,1);assert.equal(f.verified()[0].data.juheAiMessageKey,key(8));
  });
  check('Reused XHR objects cannot let an abandoned load listener acknowledge a different request',()=>{
    const f=fixture(file),a=f.dispatch(key(10)),xhr=f.request(a.packet);f.request({...a.packet,request_id:a.packet.request_id+100,message:{...a.packet.message,content:'manual replacement'}},'post','/plateau/chat/send_message',xhr);xhr.complete();assert.equal(f.verified().length,0);f.request(a.packet).complete();assert.equal(f.verified().length,1);
  });
  check('Expired transactions and invalid local metadata do not turn into legacy verified acknowledgements',()=>{
    const f=fixture(file),a=f.dispatch(key(11)),xhr=f.request(a.packet);f.advance(300001);xhr.complete();assert.equal(f.verified().length,0);
    f.window.postMessage({type:'SET_AI_REPLY_INFO',data:{messageId:'bad',replyContent:'bad',juheAiMessageKey:'invalid',juheAckVerified:true}});assert.equal(f.window._aiReplyCountMap.has('bad'),false);
    f.window.postMessage({type:'SET_AI_REPLY_INFO',data:{messageId:'legacy',replyContent:'legacy',isAiAutoReply:true,juheAckVerified:true}});f.request({request_id:12,message:{to:{uid:'legacy'},content:'legacy'}}).complete();assert.equal(f.verified().length,0);assert(f.calls.some(call=>call.name==='get-customer-callback-result'&&call.data.messageId==='legacy'&&!call.data.juheAiMessageKey&&!call.data.juheAckVerified));
  });
  check('Exact local WebSocket echoes are suppressed before and after XHR acknowledgement; unrelated manual echoes remain manual',()=>{
    const f=fixture(file),socket=new f.window.WebSocket('wss://fixture.invalid'),a=f.dispatch(key(12));
    const packet={...a.packet,msg_id:'fixture-echo'};
    socket.emit('message',{data:JSON.stringify(packet)});assert.equal(f.calls.length,0);assert.equal(f.verified().length,0);
    f.request(a.packet).complete();const calls=f.calls.length;socket.emit('message',{data:JSON.stringify(packet)});assert.equal(f.calls.length,calls);
    socket.emit('message',{data:JSON.stringify({...packet,request_id:123})});
    socket.emit('message',{data:JSON.stringify({...packet,request_id:undefined})});
    socket.emit('message',{data:JSON.stringify({...packet,message:{...packet.message,content:'人工改过的回复'}})});
    const manual=f.calls.slice(calls);assert.equal(manual.length,3);assert(manual.every(call=>call.name==='reply-customer-message'&&!call.data.juheAiMessageKey&&!call.data.juheAckVerified));
  });
}
try{for(const file of files)run(file);report.passed=true;}catch(error){report.passed=false;report.error=error.stack;console.error(error);process.exitCode=1;}
fs.writeFileSync(path.join(__dirname,'ai-pdd-send-ack-results.json'),JSON.stringify(report,null,2),'utf8');
