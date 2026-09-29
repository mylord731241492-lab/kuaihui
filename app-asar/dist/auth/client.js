const ipc = require('electron').ipcRenderer;
const $ = id => document.getElementById(id);
let loggedIn = false, busy = false, pendingUnbind = null, bindChallenge='';
let currentAccountId=null,securityInfo=null,changeChallenge='',changeGeneration=0;
let resetChallenge='',resetChallengePhone='',resetGeneration=0;
let registerChallenge='',registerChallengePhone='',registerGeneration=0;
const registerCooldowns=new Map(),resetCooldowns=new Map(),changeCooldowns=new Map();
function message(text, error = false) { $('message').textContent = text; $('message').className = error ? 'error' : ''; }
function view(name) {
  document.body.classList.toggle('auth-screen',!loggedIn);
  document.body.classList.toggle('account-screen',loggedIn);
  document.body.dataset.authView=loggedIn?'account':name;
  $('auth').hidden = loggedIn; $('account').hidden = !loggedIn;
  $('login-form').hidden = name !== 'login'; $('register-form').hidden = name !== 'register';
  $('forgot-form').hidden = name !== 'forgot';
  $('page-title').textContent = loggedIn ? '用户状态' : name === 'register' ? '创建你的账号' : '欢迎回来';
  $('page-description').textContent = loggedIn ? '查看套餐，管理设备、手机号和账号安全。' : name === 'register' ? '验证手机号，开启你的客服工作空间。' : '登录账号，开始今天的客户服务。';
  document.title = '聚禾客服平台 · ' + (loggedIn ? '用户状态' : name === 'register' ? '注册' : '登录');
  if(name==='forgot'){$('page-title').textContent='找回密码';$('page-description').textContent='验证身份后设置新密码，旧设备登录将退出。';document.title='聚禾客服平台 · 找回密码';}
}
function route() { if (!loggedIn) { $('login-form').reset(); $('register-form').reset(); $('forgot-form').reset(); clearRegisterChallenge(); clearAccountChallenges(); updateSmsButtons(); view(location.hash === '#register' ? 'register' : location.hash==='#forgot'?'forgot':'login'); } }
window.addEventListener('hashchange', route);
$('go-register').onclick = () => { message(''); location.hash='register'; };
$('go-login').onclick = () => { message(''); location.hash='login'; };
async function call(action, data) {
  const result = await ipc.invoke('juhe-auth:call', action, data);
  if (result.error) { if(result.status === 401 && loggedIn) { loggedIn=false; clearAccountChallenges(); $('device-panel').hidden=true; $('security-panel').hidden=true; view('login'); } throw Object.assign(Error(result.error), {status:result.status,code:result.code,deviceLimit:result.deviceLimit}); } return result;
}
function showUser(user) {
  if(!loggedIn||currentAccountId!==user.id){clearAccountChallenges();$('security-panel').hidden=true;}
  currentAccountId=user.id; loggedIn=true; view('account');
  $('account-name').textContent=user.username; $('status').textContent=user.active ? '已激活' : user.expiresAt ? '套餐已到期' : '待激活';
  const deviceLimit=Number.isSafeInteger(user.deviceLimit)&&user.deviceLimit>0?user.deviceLimit:1;
  $('expiry').textContent=user.expiresAt ? new Date(user.expiresAt).toLocaleString('zh-CN',{hour12:false}) : '尚未激活'; $('shops').textContent='不限'; $('device-limit').textContent=`${deviceLimit} 台`;
  $('device-policy').textContent=`可绑定多台电脑，当前套餐允许同时登录 ${deviceLimit} 台。退出登录或解绑在线设备可释放名额；解绑当前电脑会退出登录。`;
}
async function run(event, fn) {
  event?.preventDefault(); if(busy)return; busy=true;
  document.querySelectorAll('button:not(.window-controls button)').forEach(b=>b.disabled=true);
  try { await fn(); } catch(e) { message(e.message,true); } finally { busy=false; document.querySelectorAll('button:not(.window-controls button)').forEach(b=>b.disabled=false); updateSmsButtons(); }
}
function clearResetChallenge(){resetChallenge='';resetChallengePhone='';resetGeneration++;$('forgot-sms-code').value='';}
function clearChangeChallenge(){changeChallenge='';changeGeneration++;$('change-code').value='';}
function clearAccountChallenges(){clearResetChallenge();clearChangeChallenge();bindChallenge='';securityInfo=null;currentAccountId=null;$('change-password-form').reset();$('phone-form').reset();}
function changeCooldownKey(){return `${currentAccountId||''}:${securityInfo?.phone||''}`;}
function updateSmsButtons(){
  updateRegisterSend();
  const resetRemaining=Math.max(0,Math.ceil(((resetCooldowns.get($('forgot-phone').value.trim())||0)-Date.now())/1000));
  $('forgot-send').textContent=resetRemaining?`${resetRemaining}秒后重新发送`:'发送验证码';$('forgot-send').disabled=busy||resetRemaining>0;
  const available=loggedIn&&!!securityInfo?.phone&&!!securityInfo?.smsAvailable;
  const changeRemaining=Math.max(0,Math.ceil(((changeCooldowns.get(changeCooldownKey())||0)-Date.now())/1000));
  $('change-send').textContent=changeRemaining?`${changeRemaining}秒后重新发送`:'发送验证码';$('change-send').disabled=busy||!available||changeRemaining>0;
  $('change-password-form').querySelectorAll('input,button[type=submit],button.primary').forEach(control=>control.disabled=busy||!available);
}
function clearRegisterChallenge(){registerChallenge='';registerChallengePhone='';registerGeneration++;$('register-code').value='';}
function updateRegisterSend(){const remaining=Math.max(0,Math.ceil(((registerCooldowns.get($('new-phone').value.trim())||0)-Date.now())/1000));$('register-send').textContent=remaining?`${remaining}秒后重新发送`:'发送验证码';$('register-send').disabled=busy||remaining>0;}
$('new-phone').oninput=()=>{clearRegisterChallenge();updateRegisterSend();};
$('register-send').onclick=event=>run(event,async()=>{
  const phone=$('new-phone').value.trim();
  if(!/^1[3-9][0-9]{9}$/.test(phone))throw Error('请输入正确的11位手机号');
  if((registerCooldowns.get(phone)||0)>Date.now())throw Error('请稍后再获取验证码');
  clearRegisterChallenge();const generation=registerGeneration;
  const result=await call('phone-register-send',{phone});
  registerCooldowns.set(phone,Date.now()+60000);
  if(generation!==registerGeneration||$('new-phone').value.trim()!==phone)return;
  registerChallenge=result.challengeId;registerChallengePhone=phone;message(result.message);$('register-code').focus();
});
setInterval(updateSmsButtons,1000);
$('register-form').onsubmit = event => run(event, async () => {
  if($('new-password').value !== $('confirm-password').value) throw Error('两次输入的密码不一致');
  const phone=$('new-phone').value.trim();
  if(!registerChallenge||registerChallengePhone!==phone)throw Error('请先获取当前手机号的验证码');
  const result=await call('phone-register',{phone,challengeId:registerChallenge,code:$('register-code').value,password:$('new-password').value});
  $('register-form').reset(); clearRegisterChallenge(); updateRegisterSend(); history.replaceState(null,'','#login'); view('login'); $('username').value=phone; $('password').focus(); message(result.message);
});
async function login(input) {
  clearAccountChallenges();
  try { const result=await call('login',input); $('password').value=''; if(!result.windowMode)showUser(result.user); message('登录成功，当前电脑已验证'); }
  catch(e) { $('password').value=''; if(e.status===409&&e.code==='DEVICE_LIMIT'){const limit=Number.isSafeInteger(e.deviceLimit)&&e.deviceLimit>0?e.deviceLimit:1;throw Error(`已达到套餐允许同时登录 ${limit} 台电脑的上限，请先退出或解绑其他设备`);} throw e; }
}
$('login-form').onsubmit = event => run(event,()=>login({username:$('username').value,password:$('password').value}));
$('redeem-form').onsubmit=event=>run(event,async()=>{ const result=await call('redeem',{code:$('code').value}); showUser(result.user); $('code').value=''; message('授权码兑换成功'); });
async function refresh() { const result=await call('me'); showUser(result.user); }
$('refresh').onclick=event=>run(event,async()=>{await refresh(); message('授权状态已更新');});
$('logout').onclick=event=>run(event,async()=>{clearAccountChallenges();await call('logout'); loggedIn=false; $('code').value='';$('security-panel').hidden=true; view('login');});
function updateWindowControls(state) {
  if(!state)return;
  const button=$('window-fullscreen'),label=state.fullscreen?'还原窗口':'全屏';
  button.hidden=!state.canFullscreen;button.title=label;button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(state.fullscreen));
}
ipc.on('juhe-auth:window-state',(_event,state)=>updateWindowControls(state));
const windowAction=action=>call(action).catch(error=>message(error.message,true));
$('window-minimize').onclick=()=>windowAction('window-minimize');
$('window-fullscreen').onclick=()=>windowAction('window-toggle-fullscreen');
$('close').onclick=()=>windowAction('close');
$('enter').onclick=event=>run(event,()=>call('enter'));
async function devices() {
  const result=await call('devices'); $('device-list').replaceChildren();
  for(const device of result.devices) {
    const row=document.createElement('div'); row.className='device-row'; row.dataset.deviceId=device.id;
    const details=document.createElement('div'), title=document.createElement('strong'), small=document.createElement('small');
    title.textContent=device.name+(device.current?' · 当前设备':'')+(device.online?' · 在线':' · 离线');
    small.textContent='最近登录：'+new Date(device.lastLogin).toLocaleString('zh-CN',{hour12:false})+' · 设备编号 '+device.id;
    details.append(title,small); const button=document.createElement('button'); button.type='button'; button.textContent='解除绑定';
    button.onclick=()=>{pendingUnbind=device; $('unbind-description').textContent=`解除“${device.name}”的绑定？`+(device.current?'当前电脑将退出登录。':device.online?'该电脑将退出登录，下次使用需要重新登录绑定。':'下次使用该电脑需要重新登录绑定。'); $('unbind-dialog').showModal();};
    row.append(details,button); $('device-list').append(row);
  }
  $('device-panel').hidden=false;
}
$('devices-toggle').onclick=event=>run(event,devices); $('devices-refresh').onclick=event=>run(event,devices);
function cancelUnbind(){pendingUnbind=null; $('unbind-dialog').close();}
$('unbind-cancel').onclick=cancelUnbind; $('unbind-dialog').addEventListener('cancel',cancelUnbind);
$('unbind-confirm').onclick=event=>run(event,async()=>{const device=pendingUnbind; cancelUnbind(); if(!device)return; const r=await call('unbind',{id:device.id}); if(!r.loggedOut) await devices(); message(r.message); });
route();
call('state').then(result=>{updateWindowControls(result.windowState);if(result.windowMode==='account'){document.body.classList.add('account-popup');$('close').setAttribute('aria-label','关闭用户状态');$('close').title='关闭用户状态';$('enter').textContent=result.workbenchOpen?'返回工作台':'进入工作台';if(result.user)showUser(result.user);} if(result.notice)message(result.notice,true);}).catch(e=>message(e.message,true));
setInterval(()=>{if(loggedIn&&!busy)refresh().catch(e=>message(e.message,true));},15000);
$('go-forgot').onclick=()=>{message('');location.hash='forgot';};
$('forgot-back').onclick=()=>{message('');location.hash='login';};
$('forgot-phone').oninput=()=>{clearResetChallenge();updateSmsButtons();};
$('forgot-send').onclick=e=>run(e,async()=>{
  const phone=$('forgot-phone').value.trim();if(!/^1[3-9][0-9]{9}$/.test(phone))throw Error('请输入正确的11位手机号');
  if((resetCooldowns.get(phone)||0)>Date.now())throw Error('请稍后再获取验证码');
  clearResetChallenge();const generation=resetGeneration;
  const r=await call('phone-send',{purpose:'reset',phone});resetCooldowns.set(phone,Date.now()+60000);
  if(generation!==resetGeneration||$('forgot-phone').value.trim()!==phone)return;
  resetChallenge=r.challengeId;resetChallengePhone=phone;message(r.message);$('forgot-sms-code').focus();
});
$('forgot-form').onsubmit=e=>run(e,async()=>{
  if($('forgot-password').value!==$('forgot-confirm').value)throw Error('两次新密码不一致');
  const phone=$('forgot-phone').value.trim();if(!resetChallenge||resetChallengePhone!==phone)throw Error('请先获取当前手机号的验证码');
  const r=await call('phone-reset',{phone,newPassword:$('forgot-password').value,code:$('forgot-sms-code').value,challengeId:resetChallenge});
  $('forgot-form').reset();clearResetChallenge();history.replaceState(null,'','#login');view('login');$('username').value=r.username||phone;message(r.message);
});
async function security(){
  const r=await call('security-status');if(securityInfo?.phone!==r.phone||!r.smsAvailable)clearChangeChallenge();securityInfo=r;
  $('security-status').textContent='绑定手机：'+(r.phone||'未绑定')+' · '+(r.smsAvailable?'短信验证已配置':'短信服务尚未开通');
  $('change-phone-status').textContent=!r.phone?'当前账号尚未绑定手机号，请先在下方绑定手机号。':!r.smsAvailable?`绑定手机：${r.phone}。短信服务尚未开通，请稍后重试。`:`验证码将发送至绑定手机 ${r.phone}。`;
  updateSmsButtons();$('security-panel').hidden=false;$('security-panel').scrollIntoView({behavior:'smooth'});
}
$('security-toggle').onclick=e=>run(e,security);
$('change-send').onclick=e=>run(e,async()=>{
  await security();if(!securityInfo?.phone)throw Error('请先绑定手机号');if(!securityInfo.smsAvailable)throw Error('短信服务尚未开通，请稍后重试');
  const cooldownKey=changeCooldownKey();if((changeCooldowns.get(cooldownKey)||0)>Date.now())throw Error('请稍后再获取验证码');
  clearChangeChallenge();const generation=changeGeneration,account=currentAccountId;
  const r=await call('phone-send',{purpose:'change'});changeCooldowns.set(cooldownKey,Date.now()+60000);
  if(generation!==changeGeneration||!loggedIn||account!==currentAccountId)return;
  changeChallenge=r.challengeId;message(r.message);$('change-code').focus();
});
$('change-password-form').onsubmit=e=>run(e,async()=>{
  if(!securityInfo?.phone)throw Error('请先绑定手机号');if(!securityInfo.smsAvailable)throw Error('短信服务尚未开通，请稍后重试');
  if($('new-password-change').value!==$('confirm-password-change').value)throw Error('两次新密码不一致');
  if(!changeChallenge)throw Error('请先获取修改密码的验证码');
  const r=await call('password-change',{challengeId:changeChallenge,code:$('change-code').value,newPassword:$('new-password-change').value});clearAccountChallenges();message(r.message);
});
$('bind-send').onclick=e=>run(e,async()=>{const r=await call('phone-send',{purpose:'bind',phone:$('bind-phone').value,password:$('bind-password').value});$('bind-password').value='';bindChallenge=r.challengeId;message(r.message);});
$('phone-form').onsubmit=e=>run(e,async()=>{if(!bindChallenge)throw Error('请先获取验证码');const r=await call('phone-bind',{phone:$('bind-phone').value,code:$('bind-code').value,challengeId:bindChallenge});bindChallenge='';clearChangeChallenge();$('phone-form').reset();await security();message(r.message);});
$('updates-check').onclick=async()=>{const button=$('updates-check');button.disabled=true;$('updates-message').textContent='正在检查更新…';try{const r=await call('updates-check');$('updates-message').textContent=r.available?'发现新版本 '+r.version+'，可在更新窗口查看进度。':'当前已是最新版本 '+r.currentVersion;$('updates-download').hidden=!r.available;}catch(error){$('updates-message').textContent=error.message;}finally{button.disabled=false;}};
$('updates-download').onclick=()=>call('updates-show').catch(error=>{$('updates-message').textContent=error.message;});
