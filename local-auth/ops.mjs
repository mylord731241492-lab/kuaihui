import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync, backup } from 'node:sqlite';
import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

const MAGIC=Buffer.from('JUHEBAK1');
const keyAt=file=>{const key=fs.readFileSync(file);if(key.length!==32)throw Error('备份密钥必须为32字节');return key;};
export function initializeKey(file){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,randomBytes(32),{flag:'wx',mode:0o600});}
function integrity(file){const db=new DatabaseSync(file,{readOnly:true,timeout:5000});try{if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('备份数据库完整性检查失败');}finally{db.close();}}
export async function makeBackup({source,directory,keyFile,retain=14}){
  if(!Number.isInteger(retain)||retain<1||retain>365)throw Error('保留份数须为1至365');
  fs.mkdirSync(directory,{recursive:true,mode:0o700});
  const name='juhe-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomBytes(4).toString('hex')+'.jhb';
  const snapshot=path.join(directory,name+'.sqlite.tmp'),target=path.join(directory,name),temp=target+'.tmp';
  const db=new DatabaseSync(source,{readOnly:true,timeout:10000});
  try{await backup(db,snapshot);}catch(e){fs.rmSync(snapshot,{force:true});throw e;}finally{db.close();}
  try{
    integrity(snapshot);const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',keyAt(keyFile),iv);
    cipher.setAAD(MAGIC);fs.writeFileSync(temp,Buffer.concat([MAGIC,iv]),{mode:0o600,flag:'wx'});
    await pipeline(fs.createReadStream(snapshot),cipher,fs.createWriteStream(temp,{flags:'a'}));
    fs.appendFileSync(temp,cipher.getAuthTag());fs.renameSync(temp,target);
    const digest=createHash('sha256');for await(const c of fs.createReadStream(target))digest.update(c);
    fs.writeFileSync(target+'.json',JSON.stringify({file:name,sha256:digest.digest('hex'),createdAt:new Date().toISOString(),encrypted:true},null,2),{mode:0o600});
    const files=fs.readdirSync(directory).filter(f=>/^juhe-[\w-]+\.jhb$/.test(f)).sort().reverse();
    for(const old of files.slice(retain)){fs.unlinkSync(path.join(directory,old));fs.rmSync(path.join(directory,old+'.json'),{force:true});}
    return {file:name};
  }finally{fs.rmSync(snapshot,{force:true});fs.rmSync(temp,{force:true});}
}
export async function restoreBackup({file,directory,keyFile}){
  // Restore only to a new empty directory; never overwrite a running database.
  if(fs.existsSync(directory)&&fs.readdirSync(directory).length)throw Error('只能恢复到空目录，请停止服务后切换数据目录');
  const key=keyAt(keyFile),size=fs.statSync(file).size;if(size<36)throw Error('备份文件不完整');
  const fd=fs.openSync(file,'r'),header=Buffer.alloc(20),tag=Buffer.alloc(16);
  try{fs.readSync(fd,header,0,20,0);fs.readSync(fd,tag,0,16,size-16);}finally{fs.closeSync(fd);}
  if(!header.subarray(0,8).equals(MAGIC))throw Error('备份格式不正确');
  fs.mkdirSync(directory,{recursive:true,mode:0o700});const temp=path.join(directory,'restore.tmp');
  try{
    const decrypt=createDecipheriv('aes-256-gcm',key,header.subarray(8));decrypt.setAAD(MAGIC);decrypt.setAuthTag(tag);
    await pipeline(fs.createReadStream(file,{start:20,end:size-17}),decrypt,fs.createWriteStream(temp,{flags:'wx',mode:0o600}));
    integrity(temp);
    const db=new DatabaseSync(temp);
    try{
      const tables=new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r=>r.name));
      // An old backup must not resurrect any previously revoked login/recovery capability.
      db.exec('BEGIN IMMEDIATE');
      for(const table of ['sessions','challenges','nonces','admin_sessions','password_resets','password_recovery','recovery_codes','phone_otps','phone_registration_otps','sms_codes','otp_codes'])if(tables.has(table))db.exec(`DELETE FROM ${table}`);
      if(tables.has('codes'))db.exec('UPDATE codes SET revoked=1 WHERE used_by IS NULL');
      db.exec('COMMIT');db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    }finally{db.close();}
    fs.renameSync(temp,path.join(directory,'accounts.sqlite'));
    return {restored:true,requireLogin:true};
  }finally{fs.rmSync(temp,{force:true});}
}
export async function probe(url,headers={}){
  return new Promise(resolve=>{
    let request,response,settled=false;
    const finish=healthy=>{
      if(settled)return;
      settled=true;clearTimeout(deadline);response?.destroy();request?.destroy();resolve(healthy);
    };
    // A total deadline also bounds DNS, connection setup and a stalled response body.
    const deadline=setTimeout(()=>finish(false),5000);
    try{
      const target=new URL(url);
      if(!['http:','https:'].includes(target.protocol)||target.username||target.password){finish(false);return;}
      // node:http preserves the virtual Host required by the internal auth service.
      request=(target.protocol==='https:'?httpsRequest:httpRequest)(target,{method:'GET',headers,agent:false},incoming=>{
        response=incoming;
        response.on('error',()=>finish(false));
        response.on('aborted',()=>finish(false));
        response.on('close',()=>finish(false));
        if(response.statusCode<200||response.statusCode>=300){finish(false);return;}
        const chunks=[];let size=0;
        response.on('data',chunk=>{
          size+=chunk.length;
          if(size>65536){finish(false);return;}
          chunks.push(chunk);
        });
        response.on('end',()=>{
          try{finish(JSON.parse(Buffer.concat(chunks).toString('utf8'))?.service==='juhe-local-auth');}
          catch{finish(false);}
        });
      });
      request.on('error',()=>finish(false));
      request.end();
    }catch{finish(false);}
  });
}
export async function notifyEvent(url,state,transport=fetch){
  if(!url)return true;
  const target=new URL(url);if(target.protocol!=='https:'||target.username||target.password)throw Error('告警接收地址须为HTTPS');
  const response=await transport(target,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service:'juhe',event:state.alarm?'attention-required':'recovered',healthy:state.healthy,backupError:state.backupError,checkedAt:state.checkedAt}),redirect:'error',signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw Error('告警投递失败');return true;
}
export async function worker(env=process.env){
  const directory=env.JUHE_BACKUP_DIR||'/backups',keyFile=env.JUHE_BACKUP_KEY_FILE||'/secrets/backup.key',source=path.join(env.JUHE_DATA_DIR||'/data','accounts.sqlite');
  const interval=Number(env.JUHE_BACKUP_HOURS||24)*3600000;if(!Number.isFinite(interval)||interval<3600000)throw Error('备份间隔至少1小时');
  let lastBackup=0,failures=0,previous=null,notified=false,stopping=false;
  process.once('SIGTERM',()=>{stopping=true;});process.once('SIGINT',()=>{stopping=true;});
  while(!stopping){
    const healthy=await probe(env.JUHE_HEALTH_URL||'http://auth:47831/health', {Host:'127.0.0.1:47831'});failures=healthy?0:failures+1;
    let backupError=false;
    if(healthy&&Date.now()-lastBackup>=interval){try{const r=await makeBackup({source,directory,keyFile,retain:Number(env.JUHE_BACKUP_RETAIN||14)});lastBackup=Date.now();console.log(JSON.stringify({event:'backup-ok',...r}));}catch(e){backupError=true;console.error(JSON.stringify({event:'backup-failed',type:e.name}));}}
    const state={healthy,failures,backupError,lastBackup,checkedAt:Date.now()};
    fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'status.json.tmp'),JSON.stringify(state,null,2));fs.renameSync(path.join(directory,'status.json.tmp'),path.join(directory,'status.json'));
    const alarm=failures>=3||backupError;
    if(previous!==alarm){console[alarm?'error':'log'](JSON.stringify({event:alarm?'attention-required':'healthy',...state}));previous=alarm;}
    if(alarm!==notified){try{await notifyEvent(env.JUHE_ALERT_WEBHOOK,{...state,alarm});notified=alarm;}catch{console.error(JSON.stringify({event:'notification-failed'}));}}
    for(let i=0;i<60&&!stopping;i++)await new Promise(r=>setTimeout(r,1000));
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [command,...args]=process.argv.slice(2);
  if(command==='keygen')initializeKey(args[0]);
  else if(command==='backup')console.log(await makeBackup({source:args[0],directory:args[1],keyFile:args[2]}));
  else if(command==='restore')console.log(await restoreBackup({file:args[0],directory:args[1],keyFile:args[2]}));
  else if(command==='worker')await worker();
  else throw Error('命令: keygen <密钥文件> | backup <数据库> <备份目录> <密钥文件> | restore <备份> <空目录> <密钥文件> | worker');
}
