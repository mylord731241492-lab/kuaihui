import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { probe } from './ops.mjs';

async function serve(t,handler){
  const server=createServer(handler);
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  t.after(async()=>{
    server.closeAllConnections();
    await new Promise(resolve=>server.close(resolve));
  });
  return `http://127.0.0.1:${server.address().port}`;
}

test('probe preserves the internal virtual Host without relaxing server checks',async t=>{
  const requests=[];
  const url=await serve(t,(req,res)=>{
    requests.push({host:req.headers.host,path:req.url,method:req.method});
    res.writeHead(req.headers.host==='127.0.0.1:47831'?200:403);
    res.end(JSON.stringify({service:'juhe-local-auth'}));
  });
  assert.equal(await probe(url+'/health',{Host:'127.0.0.1:47831'}),true);
  assert.equal(await probe(url+'/health'),false);
  assert.deepEqual(requests[0],{host:'127.0.0.1:47831',path:'/health',method:'GET'});
});

test('probe requires a successful status and exact JSON service identity',async t=>{
  const cases=[
    {status:200,body:'{"service":"juhe-local-auth"}',expected:true},
    {status:201,body:'{"service":"juhe-local-auth"}',expected:true},
    {status:500,body:'{"service":"juhe-local-auth"}',expected:false},
    {status:204,body:'',expected:false},
    {status:200,body:'{"service":"other"}',expected:false},
    {status:200,body:'null',expected:false},
    {status:200,body:'not JSON',expected:false}
  ];
  const url=await serve(t,(req,res)=>{
    const sample=cases[Number(req.url.slice(1))];
    res.writeHead(sample.status);res.end(sample.body);
  });
  for(let i=0;i<cases.length;i++)assert.equal(await probe(url+'/'+i),cases[i].expected,`case ${i}`);
});

test('probe rejects redirects without following them',async t=>{
  let requests=0;
  const url=await serve(t,(req,res)=>{
    requests++;
    if(req.url==='/health'){res.writeHead(302,{Location:'/destination'});res.end();}
    else res.end('{"service":"juhe-local-auth"}');
  });
  assert.equal(await probe(url+'/health'),false);
  assert.equal(requests,1);
});

test('probe rejects responses exceeding 64 KiB',async t=>{
  const body=JSON.stringify({service:'juhe-local-auth',padding:'x'.repeat(65536)});
  const url=await serve(t,(_req,res)=>res.end(body));
  assert.equal(await probe(url),false);
});

test('probe returns false for an abruptly closed socket or response',async t=>{
  const url=await serve(t,(req,res)=>{
    if(req.url==='/socket'){req.socket.destroy();return;}
    res.writeHead(200,{'Content-Length':100});
    res.flushHeaders();res.write('{"service":');
    setImmediate(()=>res.destroy());
  });
  assert.equal(await probe(url+'/socket'),false);
  assert.equal(await probe(url+'/body'),false);
});

test('probe enforces its total five-second deadline while reading a stalled body',async t=>{
  let received;
  const responseStarted=new Promise(resolve=>{received=resolve;});
  const url=await serve(t,(_req,res)=>{
    res.writeHead(200);res.write('{"service":');received();
  });
  t.mock.timers.enable({apis:['setTimeout']});
  const pending=probe(url);
  await responseStarted;
  t.mock.timers.tick(5000);
  assert.equal(await pending,false);
  t.mock.timers.reset();
});

test('probe rejects unsupported schemes, credentials and invalid URLs',async()=>{
  for(const url of ['file:///health','ftp://127.0.0.1/health','not a URL','http://user:secret@127.0.0.1/health']){
    assert.equal(await probe(url),false,url);
  }
});
