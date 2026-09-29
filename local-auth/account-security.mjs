import { randomBytes, randomInt, scrypt, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
import { createSmsSettings } from './sms-settings.mjs';
import { DEVICE_HEARTBEAT_MS } from './device-policy.mjs';
const slow=promisify(scrypt), random=()=>randomBytes(32).toString('base64url');
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
const equal=(a,b)=>timingSafeEqual(Buffer.from(a),Buffer.from(b));
const mask=p=>p?p.slice(0,3)+'****'+p.slice(-4):null;
export function createAccountSecurity({db,now,hash,rate,transaction,authenticateUser,adminKey,publicOrigin='',legacyAdminEnabled=false,testSmsAdapter=null,testMode=false}) {
  if(testSmsAdapter && (!testMode || process.env.NODE_ENV==='production'))throw Error('Test SMS adapters are forbidden outside isolated tests');
  const smsSettings=createSmsSettings({db,adminKey,now});
  const smsRuntime=()=>{const value=smsSettings.runtime();return testSmsAdapter?{...value,provider:testSmsAdapter}:value;};
  const columns=db.prepare('PRAGMA table_info(users)').all();
  if(!columns.some(c=>c.name==='phone'))db.exec('ALTER TABLE users ADD COLUMN phone TEXT');
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users(phone) WHERE phone IS NOT NULL;
    CREATE TABLE IF NOT EXISTS administrators(id INTEGER PRIMARY KEY,username TEXT UNIQUE NOT NULL,salt TEXT NOT NULL,password_hash TEXT NOT NULL,created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS admin_sessions(token_hash TEXT PRIMARY KEY,admin_id INTEGER NOT NULL REFERENCES administrators(id),expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS password_recovery(id INTEGER PRIMARY KEY,token_hash TEXT UNIQUE NOT NULL,user_id INTEGER NOT NULL REFERENCES users(id),kind TEXT NOT NULL,expires INTEGER NOT NULL,created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS phone_otps(id TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),phone TEXT NOT NULL,purpose TEXT NOT NULL,digest TEXT NOT NULL,expires INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,ready INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS phone_registration_otps(id TEXT PRIMARY KEY,phone TEXT UNIQUE NOT NULL,digest TEXT NOT NULL,expires INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,ready INTEGER NOT NULL DEFAULT 0,revision TEXT NOT NULL,created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sms_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS security_audit(id INTEGER PRIMARY KEY,actor_type TEXT NOT NULL,actor_id INTEGER,action TEXT NOT NULL,target_id INTEGER,detail TEXT NOT NULL,created INTEGER NOT NULL);`);
  const record=(actorType,actorId,action,target=null,detail='')=>db.prepare('INSERT INTO security_audit(actor_type,actor_id,action,target_id,detail,created) VALUES(?,?,?,?,?,?)').run(actorType,actorId,action,target,detail,now());
  const validatePassword=p=>{if(typeof p!=='string'||p.length<10||p.length>128)fail(400,'新密码需要10～128个字符');};
  async function passwordMatches(u,p) {if(typeof p!=='string'||p.length>128)return false;const value=await slow(p,u?.salt||'missing-user-salt',64);return !!u&&equal(value,Buffer.from(u.password_hash,'hex'));}
  function stable(auth) {const row=db.prepare('SELECT * FROM users WHERE id=?').get(auth.u.id);if(!row||row.disabled||row.password_hash!==auth.u.password_hash||!db.prepare('SELECT 1 FROM sessions WHERE token_hash=? AND expires>? AND last_seen>?').get(hash(auth.token),now(),now()-DEVICE_HEARTBEAT_MS))fail(401,'登录状态已改变，请重新登录');return row;}
  const cookie=(res,token,age=28800)=>res.setHeader('Set-Cookie',`juhe_admin=${token}; Path=/v1/admin; HttpOnly; SameSite=Strict; Max-Age=${age}${publicOrigin.startsWith('https:')?'; Secure':''}`);
  const adminToken=req=>String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('juhe_admin='))?.slice(11)||'';
  function authorizeAdmin(req) {
    const token=adminToken(req), session=db.prepare('SELECT a.id,a.username,s.token_hash FROM admin_sessions s JOIN administrators a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires>?').get(hash(token),now());
    if(session) {if(req.method!=='GET'&&req.headers['x-juhe-admin']!=='1')fail(403,'管理请求验证失败'); req.adminId=session.id;return session;}
    if(legacyAdminEnabled&&!publicOrigin&&String(req.headers.authorization||'')===`Bearer ${adminKey}`){req.adminId=null;return {id:null,username:'local-migration'};}
    fail(401,'管理员登录已失效，请重新登录');
  }
  async function initializeAdmin(username,password,reset=false) {
    username=String(username).trim().toLowerCase();
    if(!/^[a-zA-Z0-9_]{3,40}$/.test(username))fail(400,'管理员账号格式不正确');validatePassword(password);
    const salt=random(), digest=(await slow(password,salt,64)).toString('hex');
    transaction(()=>{const old=db.prepare('SELECT id FROM administrators WHERE username=?').get(username);
      if(old&&!reset)fail(409,'管理员已存在，请使用受控重置命令');
      if(old){db.prepare('UPDATE administrators SET salt=?,password_hash=? WHERE id=?').run(salt,digest,old.id);db.prepare('DELETE FROM admin_sessions WHERE admin_id=?').run(old.id);record('local-cli',null,'reset-administrator',old.id);}
      else{const r=db.prepare('INSERT INTO administrators(username,salt,password_hash,created) VALUES(?,?,?,?)').run(username,salt,digest,now());record('local-cli',null,'initialize-administrator',Number(r.lastInsertRowid));}});
  }
  function invalidate(id) {db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);db.prepare('DELETE FROM password_recovery WHERE user_id=?').run(id);db.prepare('DELETE FROM phone_otps WHERE user_id=?').run(id);}
  async function newPassword(password){validatePassword(password);const salt=random();return {salt,digest:(await slow(password,salt,64)).toString('hex')};}
  function savePassword(id,value){db.prepare('UPDATE users SET salt=?,password_hash=? WHERE id=?').run(value.salt,value.digest,id);invalidate(id);}
  function otpDigest(id,code){return createHmac('sha256',adminKey).update(id+':'+code).digest('hex');}
  function checkOtp(id,code,purpose,userId,phone) {
    const row=db.prepare('SELECT * FROM phone_otps WHERE id=?').get(String(id||''));
    if(!row||!row.ready||row.expires<=now()||row.attempts>=5||row.purpose!==purpose||row.user_id!==userId||(phone&&row.phone!==phone))fail(400,'验证码无效、已使用或已过期');
    if(!/^\d{6}$/.test(String(code))||!equal(otpDigest(row.id,String(code)),row.digest)){db.prepare('UPDATE phone_otps SET attempts=attempts+1 WHERE id=?').run(row.id);fail(400,'验证码不正确');}
    return row;
  }
  function quota(key,max,window) {const row=db.prepare('SELECT * FROM sms_limits WHERE key=?').get(key);if(row&&row.expires>now()&&row.count>=max)fail(429,'验证码发送频繁，请稍后再试');db.prepare('INSERT INTO sms_limits VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count,expires=excluded.expires').run(key,row&&row.expires>now()?row.count+1:1,row&&row.expires>now()?row.expires:now()+window);}
  function registrationPhone(value) {const phone=String(value||'').trim();if(!/^1[3-9]\d{9}$/.test(phone))fail(400,'请填写正确的大陆手机号');return phone;}
  function phoneResetUser(data) {
    const username=String(data.username||'').trim().toLowerCase();
    if(Object.hasOwn(data,'phone')){const phone=registrationPhone(data.phone),u=db.prepare('SELECT * FROM users WHERE phone=? AND disabled=0').get(phone);return !username||u?.username===username?u:undefined;}
    return username?db.prepare('SELECT * FROM users WHERE username=? AND disabled=0').get(username):undefined;
  }
  function availablePhone(phone) {if(db.prepare('SELECT id FROM users WHERE phone=? OR username=?').get(phone,phone))fail(409,'手机号已注册或已绑定账号，请登录或找回密码');}
  function checkRegistrationOtp(id,code,phone) {
    const row=db.prepare('SELECT * FROM phone_registration_otps WHERE id=?').get(String(id||''));
    if(!row||!row.ready||row.phone!==phone||row.expires<=now()||row.attempts>=5||row.revision!==smsSettings.runtime().revision)fail(400,'验证码无效、已使用或已过期，请重新获取');
    if(!/^\d{6}$/.test(String(code))||!equal(otpDigest('register:'+row.id,String(code)),row.digest)){db.prepare('UPDATE phone_registration_otps SET attempts=attempts+1 WHERE id=?').run(row.id);fail(400,'验证码不正确');}
    return row;
  }
  async function handle(req,res,route,data,raw) {
    const post=req.method==='POST', get=req.method==='GET';
    if(route==='/v1/admin/login'&&post) {
      rate('admin-login-ip:'+(req.clientIP||req.socket.remoteAddress),10);const username=String(data.username||'').trim().toLowerCase();rate('admin-login:'+username,6);
      const u=db.prepare('SELECT * FROM administrators WHERE username=?').get(username);
      if(!await passwordMatches(u,data.password)){record('anonymous',null,'admin-login-failed');fail(401,'管理员账号或密码错误');}
      const token=random();transaction(()=>{const current=db.prepare('SELECT password_hash FROM administrators WHERE id=?').get(u.id);if(current?.password_hash!==u.password_hash)fail(401,'管理员状态已改变');db.prepare('DELETE FROM admin_sessions WHERE admin_id=?').run(u.id);db.prepare('INSERT INTO admin_sessions VALUES(?,?,?)').run(hash(token),u.id,now()+8*3600_000);record('admin',u.id,'admin-login');});cookie(res,token);return {username:u.username,expiresAt:now()+8*3600_000};
    }
    if(route==='/v1/admin/logout'&&post){const a=authorizeAdmin(req);db.prepare('DELETE FROM admin_sessions WHERE token_hash=?').run(hash(adminToken(req)));cookie(res,'',0);record('admin',a.id,'admin-logout');return {message:'管理员已退出'};}
    if(route==='/v1/admin/password'&&post){const a=authorizeAdmin(req);if(!a.id)fail(403,'请使用管理员账号登录');rate('admin-password:'+a.id,5);const old=db.prepare('SELECT * FROM administrators WHERE id=?').get(a.id);if(!await passwordMatches(old,data.oldPassword))fail(400,'原密码不正确');const value=await newPassword(data.newPassword);transaction(()=>{const fresh=db.prepare('SELECT password_hash FROM administrators WHERE id=?').get(a.id);if(fresh.password_hash!==old.password_hash)fail(401,'管理员状态已改变');db.prepare('UPDATE administrators SET salt=?,password_hash=? WHERE id=?').run(value.salt,value.digest,a.id);db.prepare('DELETE FROM admin_sessions WHERE admin_id=?').run(a.id);record('admin',a.id,'admin-password-change');});cookie(res,'',0);return {message:'管理员密码已修改，请重新登录'};}
    if(route==='/v1/admin/session'&&get){const a=authorizeAdmin(req);return {username:a.username};}
    if(route==='/v1/admin/sms'&&get){const a=authorizeAdmin(req);rate('admin-sms-read:'+a.id,60);return smsSettings.runtime().status;}
    if(route==='/v1/admin/sms'&&post){
      const a=authorizeAdmin(req);if(!a.id)fail(403,'请使用管理员账号登录');rate('admin-sms-save:'+a.id,6);
      const old=db.prepare('SELECT * FROM administrators WHERE id=?').get(a.id);
      if(!await passwordMatches(old,data.adminPassword))fail(400,'管理员密码不正确');
      return transaction(()=>{
        const current=authorizeAdmin(req),fresh=db.prepare('SELECT password_hash FROM administrators WHERE id=?').get(a.id);
        if(current.id!==a.id||fresh?.password_hash!==old.password_hash)fail(401,'管理员状态已改变，请重新登录');
        const result=smsSettings.save(data);db.exec('DELETE FROM phone_otps');
        record('admin',a.id,'sms-settings-update',null,result.mode);return result;
      });
    }
    if(route==='/v1/admin/audit'&&get){authorizeAdmin(req);const url=new URL(req.url,'http://local'),before=Number(url.searchParams.get('before'))||Number.MAX_SAFE_INTEGER;return {items:db.prepare('SELECT * FROM security_audit WHERE id<? ORDER BY id DESC LIMIT 100').all(before)};}
    if(route==='/v1/admin/reset-code'&&post){authorizeAdmin(req);fail(410,'此接口已关闭，请使用绑定手机号的短信验证码找回密码');}
    if(route==='/v1/security/status'&&get){const {u}=authenticateUser(req,raw);return {phone:mask(u.phone),smsAvailable:!!smsRuntime().provider.configured};}
    if(route==='/v1/password/change'&&post){
      const auth=authenticateUser(req,raw);rate('password-change:'+auth.u.id,6);
      if(!auth.u.phone)fail(409,'请先绑定手机号，再通过短信验证码修改密码');
      const row=checkOtp(data.challengeId,data.code,'change',auth.u.id,auth.u.phone),value=await newPassword(data.newPassword);
      transaction(()=>{const current=stable(auth);if(current.phone!==row.phone)fail(400,'绑定手机号已更新，请重新获取验证码');checkOtp(row.id,data.code,'change',current.id,current.phone);savePassword(current.id,value);record('user',current.id,'password-change',current.id);});
      return {loggedOut:true,message:'密码已修改，所有旧设备登录已退出，请重新登录'};
    }
    if(route==='/v1/password/recovery-code'&&post){authenticateUser(req,raw);fail(410,'此接口已关闭，请使用绑定手机号的短信验证码修改或找回密码');}
    if(route==='/v1/password/reset'&&post){rate('password-reset-ip:'+(req.clientIP||req.socket.remoteAddress),10);fail(410,'此接口已关闭，请使用绑定手机号的短信验证码找回密码');}
    if(route==='/v1/phone/register/send'&&post){
      rate('phone-register-send-ip:'+(req.clientIP||req.socket.remoteAddress),20);
      const phone=registrationPhone(data.phone),runtime=smsRuntime(),sms=runtime.provider,minutes=sms.validityMinutes||5;
      if(!sms.configured)fail(503,'短信服务暂不可用，请稍后重试或联系客服');
      availablePhone(phone);
      const id=random(),code=String(randomInt(0,1000000)).padStart(6,'0');
      transaction(()=>{
        quota('sms-minute:'+phone,1,60_000);quota('sms-day:'+phone,10,86400_000);quota('sms-ip:'+(req.clientIP||req.socket.remoteAddress),30,3600_000);quota('sms-global-day',runtime.dailyLimit,86400_000);
        db.prepare('DELETE FROM phone_registration_otps WHERE phone=? OR expires<=?').run(phone,now());
        db.prepare('INSERT INTO phone_registration_otps(id,phone,digest,expires,revision,created) VALUES(?,?,?,?,?,?)').run(id,phone,otpDigest('register:'+id,code),now()+minutes*60_000,runtime.revision,now());
      });
      try {await sms.send(phone,code);transaction(()=>{
        if(runtime.revision!==smsSettings.runtime().revision)fail(409,'短信配置已更新，请重新获取验证码');
        availablePhone(phone);
        if(!db.prepare('UPDATE phone_registration_otps SET ready=1 WHERE id=? AND expires>?').run(id,now()).changes)fail(409,'验证码已失效，请重新获取');
        record('anonymous',null,'sms-submit-register');
      });}catch(e){db.prepare('DELETE FROM phone_registration_otps WHERE id=?').run(id);throw e;}
      return {challengeId:id,message:`验证码已提交发送，${minutes}分钟内有效`};
    }
    if(route==='/v1/phone/register'&&post){
      rate('register',200);rate('register-ip:'+(req.clientIP||req.socket.remoteAddress),20);
      const phone=registrationPhone(data.phone);validatePassword(data.password);
      const row=checkRegistrationOtp(data.challengeId,data.code,phone),value=await newPassword(data.password);
      transaction(()=>{
        checkRegistrationOtp(row.id,data.code,phone);availablePhone(phone);
        const result=db.prepare('INSERT INTO users(username,phone,salt,password_hash,created) VALUES(?,?,?,?,?)').run(phone,phone,value.salt,value.digest,now()),id=Number(result.lastInsertRowid);
        db.prepare('DELETE FROM phone_registration_otps WHERE id=?').run(row.id);
        db.prepare('INSERT INTO audit(action,user_id,created) VALUES(?,?,?)').run('register',id,now());record('phone-registration',id,'register-phone',id);
      });
      return {username:phone,message:'手机注册成功，手机号已验证绑定，请使用手机号和密码登录'};
    }
    if(route==='/v1/phone/send'&&post){
      const runtime=smsRuntime(),sms=runtime.provider,minutes=sms.validityMinutes||5;
      const purpose=String(data.purpose||'');if(!['bind','reset','change'].includes(purpose))fail(400,'请填写正确的短信用途');
      let auth,u,phone;
      if(purpose==='change'){auth=authenticateUser(req,raw);u=stable(auth);if(!u.phone)fail(409,'请先绑定手机号，再通过短信验证码修改密码');phone=u.phone;}
      else {phone=registrationPhone(data.phone);if(purpose==='bind'){auth=authenticateUser(req,raw);rate('phone-password:'+auth.u.id,6);if(!await passwordMatches(auth.u,data.password))fail(400,'密码不正确');u=stable(auth);if(db.prepare('SELECT id FROM users WHERE phone=? AND id<>?').get(phone,u.id))fail(409,'手机号无法绑定，请使用其他手机号或联系客服');}else u=phoneResetUser(data);}
      if(!sms.configured)fail(503,'短信服务暂不可用，请稍后重试或联系客服');
      if(runtime.revision!==smsSettings.runtime().revision)fail(409,'短信配置已更新，请重新获取验证码');
      transaction(()=>{quota('sms-minute:'+phone,1,60_000);quota('sms-day:'+phone,10,86400_000);quota('sms-ip:'+(req.clientIP||req.socket.remoteAddress),30,3600_000);quota('sms-global-day',runtime.dailyLimit,86400_000);if(u)quota('sms-user:'+u.id,15,86400_000);});
      const id=random(),code=String(randomInt(0,1000000)).padStart(6,'0');
      if(!u)return {challengeId:id,message:`如手机号已绑定账号，验证码将发送，${minutes}分钟内有效`};
      db.prepare('DELETE FROM phone_otps WHERE user_id=? AND purpose=?').run(u.id,purpose);
      db.prepare('INSERT INTO phone_otps(id,user_id,phone,purpose,digest,expires,created) VALUES(?,?,?,?,?,?,?)').run(id,u.id,phone,purpose,otpDigest(id,code),now()+minutes*60_000,now());
      try {await sms.send(phone,code);transaction(()=>{
        if(runtime.revision!==smsSettings.runtime().revision)fail(409,'短信配置已更新，请重新获取验证码');
        const current=db.prepare('SELECT * FROM users WHERE id=?').get(u.id);
        if(!current||current.disabled||current.password_hash!==u.password_hash||(purpose!=='bind'&&current.phone!==phone))fail(409,'账号状态已更新，请重新获取验证码');
        if(auth)stable(auth);
        const updated=db.prepare('UPDATE phone_otps SET ready=1 WHERE id=? AND expires>?').run(id,now());
        if(!updated.changes)fail(409,'验证码已失效，请重新获取');
        record('user',u.id,'sms-submit-'+purpose,u.id);
      });}
      catch(e){db.prepare('DELETE FROM phone_otps WHERE id=?').run(id);throw e;}
      return {challengeId:id,message:purpose==='reset'?`如手机号已绑定账号，验证码将发送，${minutes}分钟内有效`:`验证码已提交发送，${minutes}分钟内有效`};
    }
    if(route==='/v1/phone/bind'&&post){const auth=authenticateUser(req,raw);rate('phone-bind:'+auth.u.id,10);const row=checkOtp(data.challengeId,data.code,'bind',auth.u.id,String(data.phone||''));transaction(()=>{stable(auth);if(db.prepare('SELECT id FROM users WHERE phone=? AND id<>?').get(row.phone,auth.u.id))fail(409,'手机号无法绑定');db.prepare('UPDATE users SET phone=? WHERE id=?').run(row.phone,auth.u.id);db.prepare('DELETE FROM phone_otps WHERE user_id=?').run(auth.u.id);record('user',auth.u.id,'bind-phone',auth.u.id);});return {message:'手机号已验证绑定',phone:mask(row.phone)};}
    if(route==='/v1/phone/reset'&&post){
      rate('phone-reset-ip:'+(req.clientIP||req.socket.remoteAddress),10);const u=phoneResetUser(data);
      if(!u||!u.phone)fail(400,'手机号或验证码无效');rate('phone-reset:'+u.id,10);
      const row=checkOtp(data.challengeId,data.code,'reset',u.id,u.phone),value=await newPassword(data.newPassword);
      const username=transaction(()=>{const current=db.prepare('SELECT * FROM users WHERE id=?').get(u.id);if(!current||current.disabled||current.phone!==row.phone||current.password_hash!==u.password_hash)fail(400,'验证码已失效，请重新获取');checkOtp(row.id,data.code,'reset',current.id,current.phone);savePassword(current.id,value);record('phone-recovery',current.id,'password-reset',current.id);return current.username;});
      return {username,message:'密码已重置，所有旧设备登录已退出，请重新登录'};
    }
    return undefined;
  }
  return {handle,authorizeAdmin,initializeAdmin,record};
}
