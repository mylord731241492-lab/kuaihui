const $ = id => document.getElementById(id);
let loggedIn = false;
function message(text, error = false) { $('message').textContent = text; $('message').className = error ? 'error' : ''; }
async function call(action, data) { if (!window.juheTrial) throw Error('请从本地桌面试运行入口打开'); const result = await window.juheTrial.call(action, data); if (result.error) throw Error(result.error); return result; }
function showUser(user) {
  loggedIn = true; $('auth').hidden = true; $('account').hidden = false;
  $('account-name').textContent = user.username; $('status').textContent = user.active ? '已激活' : user.expiresAt ? '套餐已到期' : '待激活';
  $('expiry').textContent = user.expiresAt ? new Date(user.expiresAt).toLocaleString('zh-CN', { hour12: false }) : '尚未激活'; $('shops').textContent = '不限'; $('device-limit').textContent = `${user.deviceLimit} 台`;
}
async function run(event, fn) {
  event?.preventDefault(); const buttons = [...document.querySelectorAll('button')]; buttons.forEach(b => b.disabled = true);
  try { await fn(); } catch (e) { message(e.message, true); } finally { buttons.forEach(b => b.disabled = false); }
}
$('login-form').onsubmit = event => run(event, async () => { const result = await call('login', { username: $('username').value, password: $('password').value }); $('password').value = ''; showUser(result.user); message('登录成功，当前电脑已验证'); });
$('redeem-form').onsubmit = event => run(event, async () => { const result = await call('redeem', { code: $('code').value }); showUser(result.user); $('code').value = ''; message('授权码兑换成功'); });
async function refresh() { try { const result = await call('me'); showUser(result.user); } catch (e) { $('status').textContent = '授权未验证'; throw e; } }
$('refresh').onclick = event => run(event, async () => { await refresh(); message('授权状态已更新'); });
$('logout').onclick = event => run(event, async () => { try { await call('logout'); } finally { loggedIn = false; $('code').value = ''; $('auth').hidden = false; $('account').hidden = true; } message('已退出登录'); });
$('admin').onclick = event => run(event, () => call('admin'));
setInterval(() => { if (loggedIn) refresh().catch(e => message(e.message, true)); }, 15_000);
if (!window.juheTrial) message('请从桌面试运行入口打开，浏览器不参与电脑绑定。', true);
