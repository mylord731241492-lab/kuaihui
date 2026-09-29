try {
  await window.juheSessionReady;
  await import('./assets/index-Ct5UuHQN.js');
} catch (error) {
  console.error('Page initialization failed:', error);
  const panel = document.createElement('section');
  panel.id = 'juhe-load-error';
  panel.style.cssText = 'box-sizing:border-box;max-width:520px;margin:12vh auto;padding:32px;font:15px/1.7 "Microsoft YaHei",sans-serif;color:#243653;background:#fff;border:1px solid #dce3ef;border-radius:12px';
  const title = document.createElement('h2');
  title.textContent = '页面暂时无法打开';
  const message = document.createElement('p');
  message.textContent = '请重试。若仍无法打开，请关闭此窗口并检查登录状态。';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = '重新加载';
  retry.onclick = () => location.reload();
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '关闭窗口';
  close.onclick = () => window.close();
  for (const button of [retry, close]) button.style.cssText = 'margin:12px 12px 0 0;padding:9px 18px;border:1px solid #ccd8f0;border-radius:6px;background:#f2f6ff;color:#315bb5;cursor:pointer';
  panel.append(title, message, retry, close);
  document.getElementById('app').replaceChildren(panel);
}
