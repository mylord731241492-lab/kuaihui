const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const files = [
  'app-asar/dist/index.html',
  'app-asar/dist/juhe-bootstrap.js',
  'app-asar/dist/juhe-session.js',
  'app-asar/dist/juhe-browser-cache.js',
  'app-asar/dist-electron/juhe-auth.cjs',
  'app-asar/dist-electron/juhe-ai-settings.cjs',
  'app-asar/dist-electron/juhe-ai-knowledge.cjs',
  'app-asar/dist-electron/juhe-ai-provider.cjs',
  'app-asar/dist-electron/juhe-ai-products.cjs',
  'app-asar/dist-electron/juhe-ai-runtime.cjs',
  'app-asar/dist-electron/juhe-ai-retrieval.cjs',
  'app-asar/dist-electron/juhe-ai-preload.cjs',
  'app-asar/dist/juhe-ai-settings.html',
  'app-asar/dist/juhe-ai-settings.js',
  'app-asar/dist/juhe-ai-settings.css',
  'app-asar/dist/assets/juhe-local-ai-entry.js',
  'app-asar/dist/assets/juhe-ui.css',
  'app-asar/dist/assets/juhe-logo-mark.png',
  'app-asar/dist-electron/main.js',
  'app-asar/dist-electron/preload.mjs',
  'electron/protobuf/protoFile/douyin_first_message.proto',
  'electron/protobuf/protoFile/douyin_second_message.proto',
  'electron/protobuf/protoFile/douyin_send_message.proto',
];
const missing = files.filter(file => !fs.existsSync(path.join(root, file)) || fs.statSync(path.join(root, file)).size === 0);
if (missing.length) {
  console.error('构建缺少必要输入，已停止，避免生成无法启动的客户端：\n' + missing.map(file => '  ' + file).join('\n'));
  console.error('协议文件必须来自匹配版本的原始运行包；不能以空文件或推测的协议替代。');
  process.exit(1);
}
console.log('客户端静态构建输入齐全。原生模块 ABI 与启动情况仍须在 Electron 中验收。');
