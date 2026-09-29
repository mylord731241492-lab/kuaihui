import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

export async function fileHash(file) {
  const hash = createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
export function validateRelease(m) {
  if (!m || !/^\d+\.\d+\.\d+-juhe\.\d+$/.test(m.version) || !/^Juhe-Customer-Service-[\d.]+-juhe\.\d+-x64-Setup\.exe$/.test(m.filename) || !/^[a-f0-9]{64}$/.test(m.sha256) || !Number.isSafeInteger(m.size) || m.size < 1 || m.size > 1024*1024*1024) throw Error('发布清单无效');
  if (m.filename !== `Juhe-Customer-Service-${m.version}-x64-Setup.exe`) throw Error('安装包版本不匹配');
  return m;
}
export async function handleRelease(req, res, dir = process.env.JUHE_RELEASE_DIR) {
  const route = new URL(req.url, 'http://local').pathname;
  if (!route.startsWith('/v1/releases/')) return false;
  if (req.method !== 'GET') { res.writeHead(405); res.end(); return true; }
  let m;
  try { if (!dir) throw Error(); m = validateRelease(JSON.parse(fs.readFileSync(path.join(dir,'latest.json'),'utf8'))); }
  catch { res.writeHead(503, {'Content-Type':'application/json'}); res.end(JSON.stringify({message:'更新发布尚未配置'})); return true; }
  if (route === '/v1/releases/latest') { res.setHeader('Content-Type','application/json; charset=utf-8'); res.end(JSON.stringify({...m, url:`/v1/releases/files/${m.filename}`})); return true; }
  if (route !== `/v1/releases/files/${m.filename}`) { res.writeHead(404); res.end(); return true; }
  const file = path.join(dir,m.filename);
  try {
    if (fs.lstatSync(file).isSymbolicLink() || fs.statSync(file).size !== m.size) throw Error();
    res.setHeader('Content-Type','application/octet-stream'); res.setHeader('Content-Length',m.size);
    res.setHeader('Content-Disposition',`attachment; filename="${m.filename}"`);
    await pipeline(fs.createReadStream(file),res);
  } catch { if (!res.headersSent) {res.writeHead(503);res.end();} else res.destroy(); }
  return true;
}
export async function publishRelease(source, directory, version, notes='') {
  fs.mkdirSync(directory,{recursive:true});
  const filename=`Juhe-Customer-Service-${version}-x64-Setup.exe`;
  const m=validateRelease({version,filename,size:fs.statSync(source).size,sha256:await fileHash(source),notes:String(notes).slice(0,4000),publishedAt:new Date().toISOString()});
  const target=path.join(directory,filename);
  if(path.resolve(source)!==path.resolve(target)) fs.copyFileSync(source,target);
  fs.writeFileSync(path.join(directory,'latest.json.tmp'),JSON.stringify(m,null,2)+'\n');
  fs.renameSync(path.join(directory,'latest.json.tmp'),path.join(directory,'latest.json'));
  return m;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [, , command, source, directory, version]=process.argv;
  if(command!=='publish'||!source||!directory||!version) throw Error('用法: node releases.mjs publish <安装包> <发布目录> <版本>');
  console.log(JSON.stringify(await publishRelease(source,directory,version),null,2));
}
