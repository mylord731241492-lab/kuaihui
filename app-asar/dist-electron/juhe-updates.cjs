const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const DOWNLOAD_IDLE_MS = 60_000, DOWNLOAD_TOTAL_MS = 60 * 60_000;
module.exports = function createUpdates({ app, base, shell, onState = () => {} }) {
  let busy = false, state = { status: 'idle', received: 0, total: 0, percent: 0 }, downloadedPath = '';
  function publish(value) { state = { ...state, ...value }; try { onState({ ...state }); } catch {} }
  function validate(m) {
    if (!m || !/^\d+\.\d+\.\d+-juhe\.\d+$/.test(m.version) || m.filename !== `Juhe-Customer-Service-${m.version}-x64-Setup.exe` || m.url !== `/v1/releases/files/${m.filename}` || !/^[a-f0-9]{64}$/.test(m.sha256) || !Number.isSafeInteger(m.size) || m.size < 1 || m.size > 1024 * 1024 * 1024) throw Error('更新信息无效');
    const version = v => v.split(/[^0-9]+/).map(Number), a = version(m.version), b = version(app.getVersion());
    let newer = false; for (let i = 0; i < Math.max(a.length, b.length); i++) { if ((a[i] || 0) !== (b[i] || 0)) { newer = (a[i] || 0) > (b[i] || 0); break; } }
    return { ...m, notes: typeof m.notes === 'string' ? m.notes.slice(0, 8000) : '', available: newer, currentVersion: app.getVersion() };
  }
  async function check() {
    let res;
    try { res = await fetch(base + '/v1/releases/latest', { signal: AbortSignal.timeout(10000), redirect: 'error' }); }
    catch { throw Error('无法连接更新服务，请检查网络后重试'); }
    if (!res.ok) throw Error('更新发布尚未配置或服务不可用');
    if (Number(res.headers.get('content-length')) > 16384) throw Error('更新信息过大');
    const reader = res.body.getReader(); let size = 0, chunks = [];
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 16384) { await reader.cancel(); throw Error('更新信息过大'); } chunks.push(Buffer.from(value)); }
    const metadata = validate(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    if (!busy && !(state.status === 'downloaded' && state.version === metadata.version)) publish({ status: metadata.available ? 'available' : 'current', ...metadata, received: 0, total: metadata.size, percent: 0, message: metadata.available ? `发现新版本 ${metadata.version}` : `当前已是最新版本 ${metadata.currentVersion}` });
    return metadata;
  }
  async function download() {
    if (busy) throw Error('正在下载，请稍候');
    busy = true; let temporary, idleTimer, totalTimer, controller;
    try {
      const m = await check(); if (!m.available) throw Error('当前已是最新版本');
      const dir = path.join(app.getPath('userData'), 'updates'); fs.mkdirSync(dir, { recursive: true });
      const target = path.join(dir, m.filename); temporary = target + '.' + crypto.randomBytes(6).toString('hex') + '.part';
      downloadedPath = '';
      publish({ ...m, status: 'downloading', received: 0, total: m.size, percent: 0, message: '正在连接下载服务…' });
      controller = new AbortController();
      const abort = message => controller.abort(Error(message));
      const resetIdle = () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => abort('下载已连续60秒没有进展，请检查网络后重试'), DOWNLOAD_IDLE_MS); idleTimer.unref?.(); };
      totalTimer = setTimeout(() => abort('下载超过60分钟，请检查网络后重试'), DOWNLOAD_TOTAL_MS); totalTimer.unref?.(); resetIdle();
      const res = await fetch(base + m.url, { signal: controller.signal, redirect: 'error' });
      if (!res.ok) throw Error('下载安装包失败，请稍后重试');
      resetIdle();
      const hash = crypto.createHash('sha256'); let size = 0, lastProgress = 0; const fd = fs.openSync(temporary, 'wx');
      try {
        for await (const chunk of res.body) {
          if (controller.signal.aborted) throw controller.signal.reason;
          if (!chunk.length) continue;
          resetIdle(); size += chunk.length; if (size > m.size) throw Error('安装包大小不符，请重新下载');
          hash.update(chunk); fs.writeFileSync(fd, chunk);
          if (Date.now() - lastProgress >= 200 || size === m.size) { lastProgress = Date.now(); publish({ received: size, percent: Math.floor(size / m.size * 100), message: '正在下载安装包，可继续使用客户端' }); }
        }
      } finally { fs.closeSync(fd); }
      if (controller.signal.aborted) throw controller.signal.reason;
      publish({ status: 'verifying', received: size, message: '下载完成，正在校验安装包…' });
      if (size !== m.size || hash.digest('hex') !== m.sha256) throw Error('安装包校验失败，请重新下载');
      fs.renameSync(temporary, target); temporary = null; downloadedPath = target;
      const message = '下载与校验完成。请先保存工作并退出客户端，再打开文件夹双击安装包升级。';
      publish({ status: 'downloaded', percent: 100, received: size, message });
      return { message, version: m.version };
    } catch (error) {
      const message = controller?.signal.aborted ? controller.signal.reason.message : error.code === 'ENOSPC' ? '磁盘空间不足，请清理空间后重试' : error.message === 'fetch failed' ? '下载连接中断，请检查网络后重试' : error.message;
      publish({ status: 'error', message }); throw Error(message);
    } finally { clearTimeout(idleTimer); clearTimeout(totalTimer); if (temporary) fs.rmSync(temporary, { force: true }); busy = false; }
  }
  function openDownloaded() {
    if (!downloadedPath || state.status !== 'downloaded' || !fs.existsSync(downloadedPath)) throw Error('请先下载并校验安装包');
    shell.showItemInFolder(downloadedPath); return { message: state.message };
  }
  return { check, download, openDownloaded, getState: () => ({ ...state }) };
};
