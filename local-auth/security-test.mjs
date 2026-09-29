import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { signSms,createAliyunSms } from './sms-aliyun.mjs';
import { createService } from './server.mjs';
import { seedLegacyAccount } from './test-helper.mjs';
import { generateKeyPairSync, randomBytes, scryptSync, sign } from 'node:crypto';
import http from 'node:http';

test('served trial client retains existing-account login but offers no legacy registration submission',async t=>{
  const dir=mkdtempSync(path.join(tmpdir(),'juhe-phone-only-client-'));
  const svc=createService({dataDir:dir});
  t.after(async()=>{if(svc.server.listening)await new Promise(resolve=>svc.server.close(resolve));rmSync(dir,{recursive:true,force:true});});
  await new Promise(resolve=>svc.server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${svc.server.address().port}`;
  const page=await fetch(base+'/client'),script=await fetch(base+'/client.js');
  assert.equal(page.status,200);assert.equal(script.status,200);
  const html=await page.text(),js=await script.text();
  assert.match(html,/id=["']login-form["']/);assert.match(html,/手机号、短信验证码和密码注册/);
  assert.doesNotMatch(html,/id=["'](?:register-form|new-username|new-password)["']/);
  assert.doesNotMatch(js,/call\(['"]register['"]/);assert.doesNotMatch(js,/register-form/);
  const closed=await fetch(base+'/v1/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'browser_bypass',password:'No-bypass-password-2026'})});
  assert.equal(closed.status,410);assert.equal(svc.db.prepare('SELECT COUNT(*) AS n FROM users').get().n,0);
});

test('a password replaced while login hashing is pending cannot resurrect an old-password session',async t=>{
  const dir=mkdtempSync(path.join(tmpdir(),'juhe-password-login-race-'));
  const svc=createService({dataDir:dir}),username='legacy_login_race',oldPassword='Old-isolated-password-2026',newPassword='New-isolated-password-2026';
  t.after(async()=>{if(svc.server.listening)await new Promise(resolve=>svc.server.close(resolve));rmSync(dir,{recursive:true,force:true});});
  seedLegacyAccount(svc.db,{username,password:oldPassword});
  await new Promise(resolve=>svc.server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${svc.server.address().port}`;
  const post=async(route,data)=>{const response=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:response.status,data:await response.json()};};
  const pair=generateKeyPairSync('ed25519'),publicKey=pair.publicKey.export({type:'spki',format:'pem'}).toString();
  async function login(password){const challenge=await post('/v1/challenge',{publicKey});assert.equal(challenge.status,200);return post('/v1/login',{username,password,challenge:challenge.data.challenge,signature:sign(null,Buffer.from(challenge.data.challenge),pair.privateKey).toString('base64')});}
  const prepare=svc.db.prepare.bind(svc.db);let replaced=false;
  // Observe the real account lookup; complete an isolated password replacement
  // at the subsequent async hash boundary without a production timing hook.
  svc.db.prepare=sql=>{
    const statement=prepare(sql);
    if(sql==='SELECT * FROM users WHERE username=?'){
      const get=statement.get.bind(statement);
      statement.get=(...args)=>{
        const row=get(...args);
        if(!replaced&&args[0]===username){replaced=true;queueMicrotask(()=>{const salt=randomBytes(32).toString('base64url');prepare('UPDATE users SET salt=?,password_hash=? WHERE id=?').run(salt,scryptSync(newPassword,salt,64).toString('hex'),row.id);prepare('DELETE FROM sessions WHERE user_id=?').run(row.id);});}
        return row;
      };
    }
    return statement;
  };
  assert.equal((await login(oldPassword)).status,401);assert.equal(replaced,true);
  assert.equal(svc.db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n,0);
  assert.equal(svc.db.prepare('SELECT COUNT(*) AS n FROM devices').get().n,0);
  svc.db.prepare=prepare;
  assert.equal((await login(newPassword)).status,200);
});

test('Aliyun ACS3 request uses fixed HTTPS endpoint, encoded query, no retries or false success',async()=>{
  const c={accessKeyId:'testid',accessKeySecret:'testsecret',signName:'聚禾',templateCode:'SMS_TEST'};
  const signed=signSms(c,'13800000000','123456',new Date('2026-09-24T00:00:00Z'),'testnonce');
  assert(signed.url.startsWith('https://dysmsapi.aliyuncs.com/?PhoneNumbers=13800000000&SignName=%E8%81%9A%E7%A6%BE&'));
  assert.equal(signed.headers['x-acs-date'],'2026-09-24T00:00:00Z');
  assert.match(signed.headers.Authorization,/^ACS3-HMAC-SHA256 Credential=testid,SignedHeaders=host;x-acs-action;x-acs-content-sha256;x-acs-date;x-acs-signature-nonce;x-acs-version,Signature=[a-f0-9]{64}$/);
  assert.equal(signed.headers.Authorization,signSms(c,'13800000000','123456',new Date('2026-09-24T00:00:00Z'),'testnonce').headers.Authorization);
  assert.notEqual(signed.headers.Authorization,signSms(c,'13800000000','123457',new Date('2026-09-24T00:00:00Z'),'testnonce').headers.Authorization);
  await assert.rejects(()=>createAliyunSms({}).send('13800000000','123456'),e=>e.status===503);
  const env={ALIBABA_CLOUD_ACCESS_KEY_ID:c.accessKeyId,ALIBABA_CLOUD_ACCESS_KEY_SECRET:c.accessKeySecret,JUHE_SMS_SIGN_NAME:c.signName,JUHE_SMS_TEMPLATE_CODE:c.templateCode};
  let calls=0;
  await assert.rejects(()=>createAliyunSms(env,async()=>{calls++;return {ok:true,json:async()=>({Code:'isv.BUSINESS_LIMIT_CONTROL'})};}).send('13800000000','123456'),e=>e.status===502);assert.equal(calls,1);
  await assert.rejects(()=>createAliyunSms(env,async()=>{throw Error('network private info');}).send('13800000000','123456'),e=>e.status===502&&!e.message.includes('private'));
  const result=await createAliyunSms(env,async(url,options)=>{assert.equal(options.redirect,'error');assert.equal(options.method,'POST');return {ok:true,json:async()=>({Code:'OK',RequestId:'test-request',BizId:'test-biz'})};}).send('13800000000','123456');assert.equal(result.bizId,'test-biz');
});

test('public deployment trusts only exact origin and authenticated proxy client IP',async()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'juhe-origin-')),oldSecret=process.env.JUHE_PROXY_SECRET;
  process.env.JUHE_PROXY_SECRET='test-proxy-secret-'+ 'a'.repeat(32);
  const svc=createService({dataDir:dir,publicOrigin:'https://service.example'});await svc.security.initializeAdmin('admin','Test-password-2026');
  let seenIP;svc.server.on('request',req=>{seenIP=req.clientIP;});await new Promise(r=>svc.server.listen(0,'127.0.0.1',r));
  const request=(route,headers={},data)=>new Promise((resolve,reject)=>{const raw=data?JSON.stringify(data):'';const r=http.request({hostname:'127.0.0.1',port:svc.server.address().port,path:route,method:data?'POST':'GET',headers:{Host:'service.example','Content-Type':'application/json',...headers}},res=>{let text='';res.on('data',c=>text+=c);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:text}));});r.on('error',reject);r.end(raw);});
  try {
    assert.equal((await request('/admin',{Host:'other.example'})).status,403);
    assert.equal((await request('/admin',{Host:'127.0.0.1:47831'})).status,403);
    assert.equal((await request('/health',{Host:'127.0.0.1:47831'})).status,200);
    assert.equal((await request('/v1/admin/login',{Origin:'https://evil.example'},{username:'admin',password:'Test-password-2026'})).status,403);
    const login=await request('/v1/admin/login',{Origin:'https://service.example'},{username:'admin',password:'Test-password-2026'});assert.equal(login.status,200);assert(login.headers['set-cookie'][0].includes('; Secure'));
    await request('/health',{'X-Juhe-Client-IP':'203.0.113.5','X-Juhe-Proxy-Token':'untrusted','X-Forwarded-For':'203.0.113.6'});assert.equal(seenIP,'127.0.0.1');
    await request('/health',{'X-Juhe-Client-IP':'203.0.113.5','X-Juhe-Proxy-Token':process.env.JUHE_PROXY_SECRET});assert.equal(seenIP,'203.0.113.5');
    await request('/health',{'X-Juhe-Client-IP':'not-an-ip','X-Juhe-Proxy-Token':process.env.JUHE_PROXY_SECRET});assert.equal(seenIP,'127.0.0.1');
  }finally{await new Promise(r=>svc.server.close(r));if(oldSecret===undefined)delete process.env.JUHE_PROXY_SECRET;else process.env.JUHE_PROXY_SECRET=oldSecret;rmSync(dir,{recursive:true,force:true});}
});

test('administrator normalization, credentials hashing, session expiry, CSRF, and writable health',async()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'juhe-security-'));let time=Date.now();const svc=createService({dataDir:dir,now:()=>time});
  await new Promise(r=>svc.server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${svc.server.address().port}`;
  const api=async(route,data,cookie='',csrf=true)=>{const r=await fetch(base+'/v1/admin/'+route,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',Cookie:cookie,...(csrf?{'X-Juhe-Admin':'1'}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};};
  try{
    await svc.security.initializeAdmin('Admin_TEST','Test-password-2026');const row=svc.db.prepare('SELECT * FROM administrators').get();assert.equal(row.username,'admin_test');assert.equal(row.password_hash.length,128);assert.notEqual(row.password_hash,'Test-password-2026');
    let r=await api('login',{username:'ADMIN_TEST',password:'Test-password-2026'});assert.equal(r.status,200);assert(r.cookie.includes('HttpOnly'));assert(r.cookie.includes('SameSite=Strict'));const cookie=r.cookie.split(';')[0];
    assert.equal((await api('session',undefined,cookie)).status,200);
    assert.equal((await api('codes',{months:1,shops:1},cookie,false)).status,403);
    assert.equal((await api('codes',{months:1,shops:1},cookie)).status,200);
    time+=8*3600_000;assert.equal((await api('session',undefined,cookie)).status,401);
    r=await api('login',{username:'admin_test',password:'Test-password-2026'});const c2=r.cookie.split(';')[0];
    assert.equal((await api('password',{oldPassword:'Test-password-2026',newPassword:'Changed-password-2026'},c2)).status,200);
    assert.equal((await api('session',undefined,c2)).status,401);
    assert.equal((await api('login',{username:'admin_test',password:'Test-password-2026'})).status,401);
    assert.equal((await api('login',{username:'admin_test',password:'Changed-password-2026'})).status,200);
    assert(svc.db.prepare('SELECT count(*) n FROM security_audit').get().n>=5);
    assert.equal((await fetch(base+'/health')).status,200);
    time+=60_001;svc.db.exec('PRAGMA query_only=ON');assert.equal((await fetch(base+'/health')).status,503);
    svc.db.exec('PRAGMA query_only=OFF');assert.equal((await fetch(base+'/health')).status,200);
  }finally{await new Promise(r=>svc.server.close(r));rmSync(dir,{recursive:true,force:true});}
});
