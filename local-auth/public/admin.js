'use strict';
const $ = id => document.getElementById(id);
const statusLabels = { active: '套餐有效', inactive: '待激活', expired: '已到期', disabled: '已停用' };
const state = {
  authenticated: false, epoch: 0, panel: 'users', mutation: false, loginBusy: false,
  query: '', status: 'all', page: 1, pageSize: 20, totalPages: 0, total: 0,
  loaded: { users: false, codes: false, audit: false, sms: false },
  loading: { users: false, codes: false, audit: false, detail: false, sms: false },
  tickets: { users: 0, codes: 0, audit: 0, detail: 0, sms: 0 },
  before: null, auditMore: false, detailId: null, sms: null,
};
const pending = new Set();
const downloadUrls = new Set();
const dateText = value => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—';
const cell = text => { const td = document.createElement('td'); td.textContent = String(text ?? '—'); return td; };
function message(text, error = false) { $('message').textContent = text; $('message').className = error ? 'error' : ''; }
function feedback(id, text = '', error = false) {
  const el = $(id); el.textContent = text; el.hidden = !text; el.classList.toggle('is-error', error);
}
function staleError() { return new DOMException('请求已失效', 'AbortError'); }
function syncControls() {
  $('login-submit').disabled = state.loginBusy;
  $('login-submit').textContent = state.loginBusy ? '正在登录…' : '进入后台';
  $('admin-logout').disabled = state.mutation;
  document.querySelectorAll('[data-mutation]').forEach(button => { button.disabled = state.mutation || !state.authenticated; });
  $('reload').disabled = state.loading.users;
  $('codes-reload').disabled = state.loading.codes;
  $('audit-reload').disabled = state.loading.audit;
  $('audit-older').disabled = state.loading.audit || !state.auditMore;
  $('user-prev').disabled = state.loading.users || !state.loaded.users || state.page <= 1;
  $('user-next').disabled = state.loading.users || !state.loaded.users || state.page >= state.totalPages;
  $('copy').disabled = !$('new-code').textContent;
  $('download-codes').disabled = !$('new-code').textContent;
  $('sms-reload').disabled = state.loading.sms || state.mutation;
  $('sms-fields').disabled = !state.loaded.sms || state.loading.sms || state.mutation || !state.authenticated;
  $('sms-save').disabled = !state.loaded.sms || state.loading.sms || state.mutation || !state.authenticated;
  syncCodeFields(); syncSmsFields();
  $('users-table').setAttribute('aria-busy', String(state.loading.users));
}
function syncCodeFields() {
  const custom = $('code-mode').value === 'custom', days = $('months').value === 'days';
  const locked = state.mutation || !state.authenticated;
  for (const id of ['code-mode', 'months', 'device-limit']) $(id).disabled = locked;
  $('custom-code-field').hidden = !custom; $('custom-code').required = custom;
  $('custom-code').disabled = locked || !custom;
  if (custom) $('code-count').value = '1';
  $('code-count').disabled = locked || custom;
  $('code-days-field').hidden = !days; $('code-days').required = days;
  $('code-days').disabled = locked || !days;
}
function syncSmsFields() {
  const spug = $('sms-mode').value === 'spug';
  $('sms-template-field').hidden = !spug;
  $('sms-template').disabled = !spug;
  $('sms-template').required = spug && !state.sms?.hasTemplate;
  $('sms-daily-limit').disabled = !spug;
  $('sms-daily-limit').required = spug;
  $('sms-template-hint').textContent = state.sms?.hasTemplate
    ? '绑定手机和找回密码共用固定十分钟模板。留空保留原配置；若旧模板含 number，请替换为仅含 code 的十分钟模板。'
    : '填写固定“十分钟内有效”、仅含 code 变量的模板 Code，绑定手机和找回密码共用。';
}
function clearSms() {
  state.tickets.sms++; state.loaded.sms = false; state.loading.sms = false; state.sms = null;
  $('sms-settings').reset(); $('sms-summary').replaceChildren(); $('sms-summary').hidden = true;
  feedback('sms-feedback');
}
function clearDetail() {
  state.tickets.detail++; state.loading.detail = false; state.detailId = null;
  $('user-detail').hidden = true;
  $('detail-fields').replaceChildren(); $('device-list').replaceChildren(); $('detail-actions').replaceChildren();
  $('user-dialog-title').textContent = '用户详情'; feedback('detail-feedback');
}
function closeDetail() {
  // close events are queued: clear now so no stale fields or requests survive this click.
  clearDetail();
  if ($('user-dialog').open) $('user-dialog').close();
}
function signedOut() {
  state.epoch++; state.authenticated = false;
  for (const controller of pending) controller.abort();
  pending.clear();
  for (const section of ['users', 'codes', 'audit', 'detail']) {
    state.tickets[section]++; state.loading[section] = false;
    if (section !== 'detail') { state.loaded[section] = false; $(section).replaceChildren(); }
  }
  state.total = 0; state.totalPages = 0; state.page = 1; state.before = null; state.auditMore = false;
  state.query = ''; state.status = 'all'; state.pageSize = 20; $('user-filters').reset();
  $('admin-login').hidden = false; $('dashboard').hidden = true; $('admin-logout').hidden = true;
  $('new-code').textContent = ''; $('new-code').hidden = true;
  $('copy').hidden = true; $('download-codes').hidden = true; $('issued-results').hidden = true; $('issued-summary').textContent = '';
  $('issue').reset(); feedback('issue-feedback'); clearSms();
  for (const url of downloadUrls) URL.revokeObjectURL(url);
  downloadUrls.clear();
  $('admin-password').value = ''; $('admin-change-password').reset();
  for (const key of ['total', 'active', 'inactive', 'expired', 'disabled']) $('summary-' + key).textContent = '—';
  for (const id of ['users-feedback', 'codes-feedback', 'audit-feedback']) feedback(id);
  $('users-count').textContent = '等待加载'; $('users-page').textContent = '第 1 页'; $('audit-count').textContent = '等待加载';
  closeDetail(); syncControls();
}
async function api(route, data) {
  const epoch = state.epoch, controller = new AbortController(); pending.add(controller);
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch('/v1/admin/' + route, {
      method: data === undefined ? 'GET' : 'POST', credentials: 'same-origin', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'X-Juhe-Admin': '1' },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    if (epoch !== state.epoch) throw staleError();
    if (res.status === 401) {
      const result = await res.json().catch(() => ({}));
      if (epoch !== state.epoch) throw staleError();
      signedOut(); throw Error(result.message || '登录已失效，请重新登录');
    }
    const result = await res.json().catch(() => { throw Error('服务器返回异常，请稍后重试'); });
    if (epoch !== state.epoch) throw staleError();
    if (!res.ok) throw Error(result.message || '操作失败，请稍后重试');
    return result;
  } catch (error) {
    if (error.name === 'AbortError' && epoch === state.epoch) throw Error('请求超时，请检查网络后重试');
    throw error;
  } finally { clearTimeout(timer); pending.delete(controller); }
}
function reportError(error) { if (error.name !== 'AbortError') message(error.message || '操作失败，请稍后重试', true); }
async function mutate(fn) {
  if (state.mutation || !state.authenticated) return;
  state.mutation = true; syncControls();
  try { await fn(); } catch (error) { reportError(error); }
  finally { state.mutation = false; syncControls(); }
}
function button(label, handler, mutation = false) {
  const el = document.createElement('button'); el.type = 'button'; el.textContent = label;
  if (mutation) el.dataset.mutation = '';
  el.addEventListener('click', handler); return el;
}
function stacked(primary, secondary) {
  const td = cell(''), main = document.createElement('span'), small = document.createElement('small');
  main.textContent = String(primary ?? '—'); small.textContent = String(secondary ?? '');
  td.append(main, small); td.className = 'admin-stacked'; return td;
}
function badge(status) {
  const el = document.createElement('span'); el.className = 'admin-status';
  if (Object.hasOwn(statusLabels, status)) el.classList.add('status-' + status);
  el.textContent = statusLabels[status] || '未知状态'; return el;
}
async function refreshAfterMutation() {
  // Invalidate reads started before the write, including panels no longer visible.
  for (const section of ['users', 'codes', 'audit']) {
    state.tickets[section]++; state.loaded[section] = false; state.loading[section] = false;
  }
  const jobs = [];
  if (state.panel === 'users') jobs.push(loadUsers());
  if (state.panel === 'codes') jobs.push(loadCodes());
  if (state.panel === 'audit') jobs.push(loadAudit());
  if ($('user-dialog').open && state.detailId !== null) jobs.push(loadDetail(state.detailId));
  await Promise.all(jobs);
}
function userActions(user, includeDetail = false) {
  const actions = document.createDocumentFragment();
  if (includeDetail) actions.append(button('查看详情', () => openDetail(user.id)));
  actions.append(button('解绑全部', () => {
    if (!confirm(`确认解绑 ${user.username} 的所有设备？已有登录将立即失效。`)) return;
    mutate(async () => { await api('reset-device', { id: user.id }); await refreshAfterMutation(); message('全部设备已解绑，已有登录已失效'); });
  }, true));
  actions.append(button(user.disabled ? '恢复启用' : '停用账号', () => {
    if (!confirm(user.disabled ? `确认恢复启用 ${user.username}？用户仍需重新登录。` : `确认停用 ${user.username}？已有登录将立即失效。`)) return;
    mutate(async () => { await api(user.disabled ? 'enable' : 'disable', { id: user.id }); await refreshAfterMutation(); message(user.disabled ? '账号已恢复启用，请用户重新登录' : '账号已停用'); });
  }, true));
  return actions;
}
async function loadUsers() {
  if (!state.authenticated) return;
  const ticket = ++state.tickets.users; state.loading.users = true; state.loaded.users = false;
  $('users').replaceChildren(); feedback('users-feedback', '正在加载用户…');
  $('users-count').textContent = '正在加载'; syncControls();
  const params = new URLSearchParams({ q: state.query, status: state.status, page: String(state.page), pageSize: String(state.pageSize) });
  try {
    const data = await api('users?' + params);
    if (ticket !== state.tickets.users || !state.authenticated) return;
    state.page = data.page; state.pageSize = data.pageSize; state.totalPages = data.totalPages; state.total = data.total;
    for (const key of ['total', 'active', 'inactive', 'expired', 'disabled']) $('summary-' + key).textContent = String(data.summary[key]);
    for (const user of data.users) {
      const tr = document.createElement('tr'), status = cell(''), actions = cell('');
      status.append(badge(user.status)); actions.className = 'admin-row-actions'; actions.append(userActions(user, true));
      tr.append(stacked(user.username, 'ID ' + user.id), status, stacked(dateText(user.createdAt), '最近登录：' + dateText(user.lastLogin)), stacked(dateText(user.expiresAt), '最多同时登录 ' + user.deviceLimit + ' 台电脑 · 店铺不限'), stacked('在线 ' + user.onlineDeviceCount + ' 台', '已绑定 ' + user.boundDeviceCount + ' 台'), actions);
      $('users').append(tr);
    }
    state.loaded.users = true;
    feedback('users-feedback', data.users.length ? '' : (state.query || state.status !== 'all' ? '没有符合条件的用户，请调整搜索或筛选条件。' : '暂无用户，客户端注册后会显示在这里。'));
    $('users-count').textContent = '共 ' + data.total + ' 位用户' + (state.query || state.status !== 'all' ? '（筛选结果）' : '');
    $('users-page').textContent = '第 ' + data.page + ' / ' + Math.max(1, data.totalPages) + ' 页';
  } catch (error) {
    if (ticket !== state.tickets.users || !state.authenticated) { if (!state.authenticated) reportError(error); return; }
    feedback('users-feedback', '用户加载失败：' + error.message + '。可点击“刷新用户”重试。', true);
    $('users-count').textContent = '加载失败'; $('users-page').textContent = '—';
    for (const key of ['total', 'active', 'inactive', 'expired', 'disabled']) $('summary-' + key).textContent = '—';
  } finally { if (ticket === state.tickets.users) { state.loading.users = false; syncControls(); } }
}
async function loadDetail(id) {
  clearDetail(); state.detailId = id; const ticket = ++state.tickets.detail;
  state.loading.detail = true; feedback('detail-feedback', '正在加载用户与设备信息…');
  try {
    const data = await api('users/' + encodeURIComponent(id));
    if (ticket !== state.tickets.detail || !state.authenticated || !$('user-dialog').open) return;
    const user = data.user;
    $('user-dialog-title').textContent = user.username + ' · 用户详情';
    const fields = [['用户 ID', user.id], ['账号', user.username], ['账号状态', statusLabels[user.status] || '未知状态'], ['创建时间', dateText(user.createdAt)], ['最近登录', dateText(user.lastLogin)], ['套餐到期', dateText(user.expiresAt)], ['同时登录电脑上限', user.deviceLimit + ' 台'], ['店铺数量', '不限'], ['在线电脑', user.onlineDeviceCount + ' 台'], ['绑定设备', user.boundDeviceCount + ' 台']];
    for (const [label, value] of fields) { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = label; dd.textContent = String(value); $('detail-fields').append(dt, dd); }
    for (const device of data.devices) {
      const tr = document.createElement('tr');
      tr.append(stacked(device.name || '未命名设备', 'ID ' + device.id), cell(dateText(device.createdAt)), cell(dateText(device.lastLogin)), cell(device.online ? '在线' : '离线'));
      $('device-list').append(tr);
    }
    $('devices-empty').hidden = data.devices.length > 0;
    $('detail-actions').append(userActions(user)); $('user-detail').hidden = false; feedback('detail-feedback'); syncControls();
  } catch (error) {
    if (ticket !== state.tickets.detail || !state.authenticated) { if (!state.authenticated) reportError(error); return; }
    feedback('detail-feedback', '详情加载失败：' + error.message + '。请关闭后重新打开。', true);
  } finally { if (ticket === state.tickets.detail) state.loading.detail = false; }
}
function openDetail(id) { if (!state.authenticated) return; if (!$('user-dialog').open) $('user-dialog').showModal(); loadDetail(id); }
async function loadCodes() {
  if (!state.authenticated) return;
  const ticket = ++state.tickets.codes; state.loading.codes = true; state.loaded.codes = false;
  $('codes').replaceChildren(); feedback('codes-feedback', '正在加载授权码…'); syncControls();
  try {
    const data = await api('state?includeUsers=0');
    if (ticket !== state.tickets.codes || !state.authenticated) return;
    for (const code of data.codes) {
      const tr = document.createElement('tr'), actions = cell('');
      if (!code.used_by && !code.revoked) actions.append(button('作废', () => {
        if (!confirm('确认作废尾号 ' + code.hint + ' 的授权码？此操作不可撤销。')) return;
        mutate(async () => { await api('revoke-code', { id: code.id }); await refreshAfterMutation(); message('授权码已作废'); });
      }, true));
      tr.append(cell('…' + code.hint), cell(code.days > 0 ? code.days + ' 天' : code.months === 12 ? '年卡 · 12个月' : '月卡 · 1个月'), cell(code.deviceLimit + ' 台'), cell(code.used_by ? '已兑换 · 账号 #' + code.used_by : code.revoked ? '已作废' : code.expires <= Date.now() ? '已过期' : '待兑换'), cell(dateText(code.expires)), cell(dateText(code.created)), actions);
      $('codes').append(tr);
    }
    state.loaded.codes = true; feedback('codes-feedback', data.codes.length ? '' : '暂无授权码记录。');
  } catch (error) {
    if (ticket !== state.tickets.codes || !state.authenticated) { if (!state.authenticated) reportError(error); return; }
    feedback('codes-feedback', '授权码加载失败：' + error.message + '。可点击“刷新记录”重试。', true);
  } finally { if (ticket === state.tickets.codes) { state.loading.codes = false; syncControls(); } }
}
async function loadAudit(older = false) {
  if (!state.authenticated) return;
  const cursor = older ? state.before : null, ticket = ++state.tickets.audit;
  state.loading.audit = true; state.loaded.audit = false; $('audit').replaceChildren();
  feedback('audit-feedback', '正在加载审计记录…'); $('audit-count').textContent = '正在加载'; syncControls();
  try {
    const data = await api('audit' + (cursor ? '?before=' + encodeURIComponent(cursor) : ''));
    if (ticket !== state.tickets.audit || !state.authenticated) return;
    for (const item of data.items) { const tr = document.createElement('tr'); tr.append(cell(dateText(item.created)), cell(item.actor_type + ' #' + (item.actor_id ?? '—')), cell(item.action), cell(item.target_id ?? '—'), cell(item.detail)); $('audit').append(tr); }
    state.before = data.items.at(-1)?.id ?? null; state.auditMore = data.items.length === 100; state.loaded.audit = true;
    feedback('audit-feedback', data.items.length ? '' : older ? '没有更早的记录。' : '暂无审计记录。');
    $('audit-count').textContent = '本页 ' + data.items.length + ' 条记录' + (cursor ? ' · 较早记录' : ' · 最新记录');
  } catch (error) {
    if (ticket !== state.tickets.audit || !state.authenticated) { if (!state.authenticated) reportError(error); return; }
    state.auditMore = false; feedback('audit-feedback', '审计加载失败：' + error.message + '。可点击“刷新审计”重试。', true); $('audit-count').textContent = '加载失败';
  } finally { if (ticket === state.tickets.audit) { state.loading.audit = false; syncControls(); } }
}
function renderSms(data) {
  state.sms = data; state.loaded.sms = true;
  const modeLabels = { environment: '沿用服务器环境配置', spug: '使用 Spug', disabled: '已关闭' };
  $('sms-mode').value = Object.hasOwn(modeLabels, data.mode) ? data.mode : 'environment';
  $('sms-daily-limit').value = String(data.dailyLimit ?? 100);
  $('sms-template').value = ''; $('sms-admin-password').value = '';
  $('sms-summary').replaceChildren();
  const fields = [
    ['当前模式', modeLabels[data.mode] || '未知模式'],
    ['配置状态', data.configurationError ? '配置需重新保存' : data.mode === 'disabled' ? '短信服务已关闭' : data.configured ? '已配置（未验证送达）' : '尚未配置完成'],
    ['服务商', data.provider || '—'],
    ['可复用模板', data.hasTemplate ? (data.templateHint || '已保存，完整内容不展示') : '暂无'],
    ['每日发送上限', String(data.dailyLimit ?? '—') + ' 条'],
    ['更新时间', dateText(data.updatedAt)],
  ];
  for (const [label, value] of fields) {
    const dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = label; dd.textContent = value; $('sms-summary').append(dt, dd);
  }
  $('sms-summary').hidden = false;
  feedback('sms-feedback', data.configurationError ? '已保存的短信配置无法读取，请重新填写模板 Code 并保存完整配置。' : '', Boolean(data.configurationError));
  syncControls();
}
async function loadSms() {
  if (!state.authenticated) return;
  clearSms(); const ticket = ++state.tickets.sms; state.loading.sms = true;
  feedback('sms-feedback', '正在加载短信配置…'); syncControls();
  try {
    const data = await api('sms');
    if (ticket !== state.tickets.sms || !state.authenticated) return;
    renderSms(data);
  } catch (error) {
    if (ticket !== state.tickets.sms || !state.authenticated) { if (!state.authenticated) reportError(error); return; }
    feedback('sms-feedback', '短信配置加载失败：' + error.message + '。可点击“刷新配置”重试。', true);
  } finally { if (ticket === state.tickets.sms) { state.loading.sms = false; syncControls(); } }
}
function showPanel(panel) {
  if (!state.authenticated || !['users', 'codes', 'audit', 'settings'].includes(panel)) return;
  state.panel = panel;
  document.querySelectorAll('[data-panel]').forEach(el => { if (el.dataset.panel === panel) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
  for (const name of ['users', 'codes', 'audit', 'settings']) $('panel-' + name).hidden = name !== panel;
  if (panel === 'users' && !state.loaded.users && !state.loading.users) loadUsers();
  if (panel === 'codes' && !state.loaded.codes && !state.loading.codes) loadCodes();
  if (panel === 'audit' && !state.loaded.audit && !state.loading.audit) loadAudit();
  if (panel === 'settings' && !state.loaded.sms && !state.loading.sms) loadSms();
}
function signedIn() {
  state.authenticated = true; $('admin-login').hidden = true; $('dashboard').hidden = false; $('admin-logout').hidden = false;
  showPanel('users'); syncControls();
}
$('admin-login').addEventListener('submit', async event => {
  event.preventDefault(); if (state.loginBusy) return; state.loginBusy = true; syncControls();
  const password = $('admin-password').value; $('admin-password').value = '';
  try { await api('login', { username: $('admin-username').value.trim(), password }); signedIn(); message('管理员登录成功'); }
  catch (error) { reportError(error); }
  finally { state.loginBusy = false; syncControls(); }
});
$('admin-logout').addEventListener('click', () => mutate(async () => { await api('logout', {}); signedOut(); message('管理员已退出'); }));
document.querySelectorAll('[data-panel]').forEach(el => el.addEventListener('click', () => showPanel(el.dataset.panel)));
$('user-filters').addEventListener('submit', event => { event.preventDefault(); state.query = $('user-query').value.trim(); state.status = $('user-status').value; state.pageSize = Number($('user-page-size').value); state.page = 1; loadUsers(); });
for (const id of ['user-status', 'user-page-size']) $(id).addEventListener('change', () => $('user-filters').requestSubmit());
$('user-clear').addEventListener('click', () => { $('user-filters').reset(); $('user-filters').requestSubmit(); });
$('reload').addEventListener('click', () => loadUsers());
$('user-prev').addEventListener('click', () => { if (!state.loading.users && state.page > 1) { state.page--; loadUsers(); } });
$('user-next').addEventListener('click', () => { if (!state.loading.users && state.page < state.totalPages) { state.page++; loadUsers(); } });
$('codes-reload').addEventListener('click', () => loadCodes());
$('audit-reload').addEventListener('click', () => loadAudit());
$('audit-older').addEventListener('click', () => { if (!state.loading.audit && state.auditMore) loadAudit(true); });
$('user-dialog-close').addEventListener('click', closeDetail);
$('user-dialog').addEventListener('cancel', event => { event.preventDefault(); closeDetail(); });
$('user-dialog').addEventListener('close', () => {
  // A queued close event from the previous view must not clear a newly opened view.
  if (!$('user-dialog').open) clearDetail();
});
$('issue').addEventListener('submit', event => {
  event.preventDefault(); if (state.mutation || !state.authenticated || !$('issue').reportValidity()) return;
  const mode = $('code-mode').value, count = mode === 'custom' ? 1 : Number($('code-count').value);
  const duration = $('months').value, deviceLimit = Number($('device-limit').value);
  const request = { mode, count, deviceLimit };
  if (duration === 'days') request.days = Number($('code-days').value);
  else request.months = Number(duration);
  if (mode === 'custom') request.customCode = $('custom-code').value.trim();
  const durationLabel = duration === 'days' ? request.days + '天' : duration === '12' ? '年卡（12个月）' : '月卡（1个月）';
  if (count > 1 && !confirm(`确认生成 ${count} 个授权码？每个为${durationLabel}、最多同时登录${deviceLimit}台电脑，店铺不限。生成后请保存完整授权码。`)) return;
  mutate(async () => {
    feedback('issue-feedback', '正在生成，请勿重复提交…');
    try {
      const data = await api('codes', request);
      const codes = Array.isArray(data.codes) ? data.codes.map(item => item.code) : data.code ? [data.code] : [];
      if (!codes.length || codes.some(code => typeof code !== 'string')) throw Error('未收到完整生成结果');
      $('new-code').textContent = codes.join('\n'); $('new-code').hidden = false;
      $('issued-summary').textContent = `${codes.length} 个 · ${durationLabel} · 最多同时登录${deviceLimit}台电脑 · 店铺不限 · ${dateText(Date.now())}`;
      $('issued-results').hidden = false; $('copy').hidden = false; $('download-codes').hidden = false;
      $('custom-code').value = ''; feedback('issue-feedback');
      await refreshAfterMutation();
      if (state.authenticated) message(`已生成 ${codes.length} 个授权码，请复制或下载保存`);
    } catch (error) {
      if (state.authenticated && error.name !== 'AbortError') feedback('issue-feedback', '生成未完成确认：' + error.message + '。请先刷新授权码记录核对，再决定是否重新生成。', true);
      throw error;
    }
  });
});
$('code-mode').addEventListener('change', syncCodeFields);
$('months').addEventListener('change', syncCodeFields);
$('copy').addEventListener('click', async () => { const value = $('new-code').textContent; if (!state.authenticated || !value) return; try { await navigator.clipboard.writeText(value); if (state.authenticated) message('全部授权码已复制'); } catch { if (state.authenticated) message('复制失败，请选中授权码手动复制', true); } });
$('download-codes').addEventListener('click', () => {
  const value = $('new-code').textContent; if (!state.authenticated || !value) return;
  const url = URL.createObjectURL(new Blob(['\ufeff' + value.replaceAll('\n', '\r\n') + '\r\n'], { type: 'text/plain;charset=utf-8' }));
  downloadUrls.add(url);
  const link = document.createElement('a');
  link.href = url; link.download = 'juhe-codes-' + new Date().toISOString().replace(/[:.]/g, '-') + '.txt'; link.hidden = true;
  document.body.append(link);
  try { link.click(); message('已开始下载授权码文件，请妥善保存'); }
  finally { link.remove(); setTimeout(() => { URL.revokeObjectURL(url); downloadUrls.delete(url); }, 1000); }
});
$('sms-mode').addEventListener('change', syncSmsFields);
$('sms-reload').addEventListener('click', () => loadSms());
$('sms-settings').addEventListener('submit', event => {
  event.preventDefault();
  if (state.mutation || state.loading.sms || !state.loaded.sms || !state.authenticated || !$('sms-settings').reportValidity()) return;
  const mode = $('sms-mode').value, request = { mode, adminPassword: $('sms-admin-password').value };
  if (mode === 'spug') {
    request.dailyLimit = Number($('sms-daily-limit').value);
    const template = $('sms-template').value.trim();
    if (template) request.templateCode = template;
  }
  mutate(async () => {
    const ticket = ++state.tickets.sms; state.loading.sms = true;
    $('sms-admin-password').value = ''; feedback('sms-feedback', '正在保存短信配置…'); syncControls();
    try {
      const data = await api('sms', request);
      if (ticket !== state.tickets.sms || !state.authenticated) return;
      renderSms(data);
      state.tickets.audit++; state.loaded.audit = false; state.loading.audit = false;
      if (state.panel === 'audit') loadAudit();
      message('短信配置已保存，尚未验证实际送达');
    } catch (error) {
      if (ticket === state.tickets.sms && state.authenticated && error.name !== 'AbortError') feedback('sms-feedback', '保存失败：' + error.message, true);
      throw error;
    } finally {
      $('sms-template').value = ''; $('sms-admin-password').value = '';
      if (ticket === state.tickets.sms) { state.loading.sms = false; syncControls(); }
    }
  });
});
$('admin-change-password').addEventListener('submit', event => {
  event.preventDefault(); mutate(async () => { const data = { oldPassword: $('admin-old-password').value, newPassword: $('admin-new-password').value }; $('admin-change-password').reset(); await api('password', data); signedOut(); message('管理员密码已修改，请重新登录'); });
});
(async () => {
  state.loginBusy = true; syncControls();
  try { await api('session'); signedIn(); }
  catch (error) { if (state.authenticated) signedOut(); if (error.name !== 'AbortError' && !/登录|认证|管理员/.test(error.message)) reportError(error); }
  finally { state.loginBusy = false; syncControls(); }
})();
