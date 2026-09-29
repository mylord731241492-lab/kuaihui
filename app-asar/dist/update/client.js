const ipc = require('electron').ipcRenderer;
const $ = id => document.getElementById(id);
let working = false;
const mb = value => (Number(value || 0) / 1024 / 1024).toFixed(1) + ' MB';
function render(state) {
  const active = ['downloading', 'verifying'].includes(state.status);
  $('version').textContent = state.version ? `当前版本 ${state.currentVersion} · 最新版本 ${state.version}` : '可重新检查是否有新版本';
  $('notes').textContent = state.notes || '';
  $('message').textContent = state.message || '';
  $('message').className = state.status === 'error' ? 'error' : '';
  $('progress-area').hidden = !active && state.status !== 'downloaded';
  $('progress').value = state.percent || 0;
  $('progress-text').textContent = `${state.percent || 0}% · ${mb(state.received)} / ${mb(state.total)}`;
  $('download').hidden = active || !state.available || state.status === 'downloaded';
  $('download').textContent = state.status === 'error' ? '重新下载' : '下载安装包';
  $('open').hidden = state.status !== 'downloaded';
  $('check').disabled = active || working;
  $('download').disabled = working;
  $('close').textContent = active ? '后台下载' : '稍后';
}
async function call(action) { const result = await ipc.invoke('juhe-updates:call', action); if (result.error) throw Error(result.error); return result; }
async function action(name) {
  if (working) return; working = true; $('download').disabled = true; $('check').disabled = true;
  let failure;
  try { await call(name); } catch (error) { failure = error.message; }
  finally { working = false; if (name !== 'close') { const state = await call('state').catch(() => null); if (state) render(state); if (failure) { $('message').textContent = failure; $('message').className = 'error'; } } }
}
ipc.on('juhe-updates:state', (_event, state) => render(state));
$('download').onclick = () => action('download');
$('check').onclick = () => action('check');
$('open').onclick = () => action('open');
$('close').onclick = () => call('close');
call('state').then(render).catch(error => { $('message').textContent = error.message; });
