const fs = require('node:fs');
const path = require('node:path');
const DEFAULT_SERVICE_URL = 'https://43.129.16.226';

function resolveServiceUrl(app, env = process.env) {
  const configFile = path.join(app.getPath('userData'), 'juhe-service.json');
  const config = env.JUHE_SERVICE_URL ? {} : fs.existsSync(configFile) ? JSON.parse(fs.readFileSync(configFile, 'utf8')) : {};
  const base = String(env.JUHE_SERVICE_URL || config.url || DEFAULT_SERVICE_URL).replace(/\/$/, '');
  const parsed = new URL(base);
  if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/' || !(parsed.protocol === 'https:' || parsed.protocol === 'http:' && parsed.hostname === '127.0.0.1')) throw Error('授权服务地址必须使用HTTPS，本机调试可用127.0.0.1');
  return base;
}

module.exports = { DEFAULT_SERVICE_URL, resolveServiceUrl };
