'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {retrieve,segment}=require('../app-asar/dist-electron/juhe-ai-retrieval.cjs');
const {createRuntime}=require('../app-asar/dist-electron/juhe-ai-runtime.cjs');
const {createKnowledgeStore}=require('../app-asar/dist-electron/juhe-ai-knowledge.cjs');

let serial=0;
const record=(title,content,extra={})=>({id:'r'+(++serial),shopId:'101',title,content,scenarios:[],sendType:0,goodId:'',imageurls:[],updatedAt:new Date(2026,0,serial).toISOString(),...extra});
const kb=[
  record('发货时间','付款后48小时内发货',{sendType:1}),
  record('退款多久到账','退款原路返回，一般1-3个工作日到账',{sendType:1}),
  record('是否包邮','全国包邮，偏远地区除外',{sendType:1}),
  record('尺码怎么选','请参考详情页尺码表'),
  record('可以开发票吗','可以开具电子发票，请联系客服登记',{sendType:1}),
  record('支持七天无理由退货','支持七天无理由退货，需保持商品完好',{sendType:1})
];
const top=question=>retrieve(kb,question)[0];
const checks=[],check=(name,fn)=>Promise.resolve(fn()).then(()=>{checks.push(name);console.log('PASS '+name);});

async function main(){
  await check('dictionary segmentation keeps trade terms that ICU splits',()=>{
    assert.deepEqual(segment('请问多久发货'),['多久','发货']);
    assert(segment('这个有没有大码').includes('大码'));
    assert.deepEqual(segment('包邮吗'),['包邮']);
    assert(segment('退款多久到账').includes('到账'));
  });
  await check('synonyms match colloquial questions to authored titles',()=>{
    assert.equal(top('什么时候发出呀').record.title,'发货时间');
    assert.equal(top('退的钱几天到账').record.title,'退款多久到账');
    assert.equal(top('运费怎么算').record.title,'是否包邮');
    assert.equal(top('码数怎么挑').record.title,'尺码怎么选');
    assert.equal(top('能开票吗').record.title,'可以开发票吗');
  });
  await check('confident matches cover the whole question and the title',()=>{
    assert(top('什么时候发货').confident);
    assert(top('退钱多久到账').confident);
    assert(top('包不包邮，运费多少').confident);
  });
  await check('compound or partial questions are not confident',()=>{
    const compound=top('多久发货，能开发票吗');
    assert(compound&&!compound.confident);
    const partial=top('退款');
    assert(!partial?.confident,'a bare topic must not trigger a verbatim answer about a narrower title');
    assert.equal(retrieve(kb,'可以送货到火星吗').length,0);
  });
  await check('unknown text still yields searchable words',()=>{
    assert(segment('火星基地').length>0);
  });

  const root=fs.mkdtempSync(path.join(os.tmpdir(),'juhe-retrieval-'));
  try{
    const directory=()=>path.join(root,'a'),store=createKnowledgeStore({getDirectory:directory});
    let calls=0;
    const provider={status:()=>({ready:true,enabled:true,enabledShopIds:['101'],autoLearn:false}),cancelAll(){},async generate(messages){calls++;const data=JSON.parse(messages[1].content);return {text:JSON.stringify({answer:'润色后的回答',needsHuman:false,reason:'资料依据',sourceIds:data.sources.slice(0,1).map(s=>s.id)})};}};
    const runtime=createRuntime({getDirectory:directory,getScope:()=>'a',authorized:()=>true,getGlobalConfig:()=>({globalAiReplySwitch:1}),getShopConfig:()=>({aiReplyStrategy:'AI_RGA'}),provider});
    const verbatim=store.call('save',{shopId:'101',record:{title:'发货时间',content:'付款后48小时内发货',sendType:1}}).record;
    store.call('save',{shopId:'101',record:{title:'尺码怎么选',content:'请参考详情页尺码表',sendType:0}});
    await check('confident 原话发送 knowledge answers without a model request',async()=>{
      const before=calls,result=await runtime.call('runtime-preview',{shopId:'101',question:'亲，什么时候发出呀？'});
      assert.equal(result.answer,'付款后48小时内发货');assert.equal(result.reason,'高置信命中原文回复');assert.equal(calls,before);
      assert.deepEqual(result.sources,[{id:'knowledge:'+verbatim.id,title:'发货时间'}]);
    });
    await check('润色 knowledge still goes through the model and source verification',async()=>{
      const before=calls,result=await runtime.call('runtime-preview',{shopId:'101',question:'码数怎么挑'});
      assert.equal(calls,before+1);assert.equal(result.answer,'润色后的回答');assert(result.sources[0].id.startsWith('knowledge:'));
    });
    await check('sensitive words and human requests still win over direct answers',async()=>{
      const human=await runtime.call('runtime-preview',{shopId:'101',question:'什么时候发货，转人工'});
      assert(human.needsHuman);assert.equal(human.answer,'');
    });
  }finally{
    if(path.dirname(root)===path.resolve(os.tmpdir()))fs.rmSync(root,{recursive:true,force:true});
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
