import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createService } from './server.mjs';
const args=process.argv.slice(2),command=args[0],username=args[1]||'admin';
if(!['init','reset'].includes(command))throw Error('Usage: node admin-cli.mjs init|reset [username]; JUHE_DATA_DIR chooses the local database');
const dataDir=process.env.JUHE_DATA_DIR||path.join(path.dirname(fileURLToPath(import.meta.url)),'data');
const password=randomBytes(24).toString('base64url'),service=createService({dataDir});
try {
  await service.security.initializeAdmin(username.toLowerCase(),password,command==='reset');
  const output=path.join(dataDir,'administrator-initial-password.txt');
  fs.writeFileSync(output,`管理员账号：${username.toLowerCase()}\n初始密码：${password}\n请保存在密码管理器中，然后删除本文件；不要提交到Git或公开。\n`,{mode:0o600});
  console.log('Administrator credentials written to the protected local file: '+output);
} finally {service.db.close();}
