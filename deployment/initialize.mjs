import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { isIP } from 'node:net';
const root=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2);
let ip='',email='';
if(args.length){
  if(args.length!==4||args[0]!=='--ip'||args[2]!=='--email')throw Error('用法：node initialize.mjs [--ip 公网IPv4 --email 证书联系邮箱]');
  [ip,email]=[args[1],args[3]];
  const [a,b,c]=ip.split('.').map(Number);
  if(isIP(ip)!==4||a===0||a===10||a===127||a>=224||(a===100&&b>=64&&b<=127)||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===192&&b===0)||(a===192&&b===88&&c===99)||(a===198&&(b===18||b===19))||(a===198&&b===51&&c===100)||(a===203&&b===0&&c===113))throw Error('请填写服务器真实、固定、独享的公网IPv4，不能使用内网、保留或示例IP。');
  if(!/^[A-Za-z0-9.!+_-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email))throw Error('请填写有效的证书联系邮箱。');
  const existing=path.join(root,'.env.ip');
  if(fs.existsSync(existing)){
    const text=fs.readFileSync(existing,'utf8').replace(/\r\n/g,'\n');
    if(!text.includes(`JUHE_PUBLIC_IP=${ip}\n`)||!text.includes(`JUHE_TLS_EMAIL=${email}\n`))throw Error('.env.ip 已存在且地址或邮箱不同；为避免覆盖正在使用的配置，请先核对部署说明。');
  }
}
for(const name of ['state','state/data','state/backups','secrets','releases']){
  const dir=path.join(root,name);fs.mkdirSync(dir,{recursive:true,mode:0o700});
  if(process.platform!=='win32'&&process.getuid()===0){fs.chownSync(dir,1000,1000);fs.chmodSync(dir,0o700);}
}
const key=path.join(root,'secrets/backup.key');
if(!fs.existsSync(key)){fs.writeFileSync(key,randomBytes(32),{mode:0o600,flag:'wx'});if(process.platform!=='win32'&&process.getuid()===0)fs.chownSync(key,1000,1000);}
const envFile=path.join(root,ip?'.env.ip':'.env');
if(!fs.existsSync(envFile)){
  let template=fs.readFileSync(path.join(root,ip?'.env.ip.example':'.env.example'),'utf8');
  if(ip)template=template.replace(/^JUHE_PUBLIC_IP=.*$/m,`JUHE_PUBLIC_IP=${ip}`).replace(/^JUHE_TLS_EMAIL=.*$/m,`JUHE_TLS_EMAIL=${email}`);
  fs.writeFileSync(envFile,template,{mode:0o600,flag:'wx'});
}
let envText=fs.readFileSync(envFile,'utf8');
if(/^JUHE_PROXY_SECRET=\s*$/m.test(envText))envText=envText.replace(/^JUHE_PROXY_SECRET=\s*$/m,'JUHE_PROXY_SECRET='+randomBytes(32).toString('hex'));
fs.writeFileSync(envFile,envText,{mode:0o600});if(process.platform!=='win32')fs.chmodSync(envFile,0o600);
if(ip){
  for(const name of ['state/ip-caddy','state/acme','state/acme/webroot','state/acme/production','state/acme/work','state/acme/logs'])fs.mkdirSync(path.join(root,name),{recursive:true,mode:0o700});
  fs.writeFileSync(path.join(root,'juhe-service.json'),JSON.stringify({url:`https://${ip}`},null,2)+'\n',{mode:0o644});
}
console.log(`部署目录和备份密钥已初始化；配置为 ${path.basename(envFile)}，请离线保存 secrets/backup.key。`);
