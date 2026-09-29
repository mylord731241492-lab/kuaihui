// Run with Node.js after ALL old and new client processes have exited.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {accountScope,browserBusinessData}=require('../app-asar/dist-electron/juhe-account-cache.cjs');
const configKeys=['globalBottomLineReply','singleShopBottomLineReplyList','globalAiReplyConfig','singleShopAiReplyConfig','ShortcutKeys','messageWindowBounds','OpenSinglePopupPage'];
function digest(file) {const hash=crypto.createHash('sha256'),buffer=Buffer.alloc(1024*1024),fd=fs.openSync(file,'r');try{let count;while((count=fs.readSync(fd,buffer,0,buffer.length,null)))hash.update(buffer.subarray(0,count));return hash.digest('hex');}finally{fs.closeSync(fd);}}
function assertClosed() {
  if (process.platform !== 'win32') throw Error('此迁移工具仅支持当前Windows客户端');
  const check=cp.spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"@(Get-Process -ErrorAction Stop | Where-Object { $_.ProcessName -match '聚禾|快回|Juhe-Customer|^electron$' } | Select-Object -ExpandProperty Id) | ConvertTo-Json -Compress"],{encoding:'utf8'});
  if(check.status!==0) throw Error('无法确认客户端进程状态，请关闭客户端后重试');
  if(check.stdout.trim()) throw Error('检测到客户端或Electron进程，请全部退出后迁移');
}
function migrate(options,checkClosed=assertClosed) {
  if(options.confirmOwner !== String(options.accountId)) throw Error('必须用账号ID再次明确确认旧资料归属');
  checkClosed();
  const source=fs.realpathSync(options.source),target=fs.realpathSync(options.target),url=new URL(options.service);
  if(url.username||url.password||url.search||url.hash||url.pathname!=='/'||!(url.protocol==='https:'||url.protocol==='http:'&&url.hostname==='127.0.0.1')) throw Error('服务必须为HTTPS地址或本机调试地址');
  if(!/^\d+$/.test(String(options.accountId))||Number(options.accountId)<1) throw Error('需要已确认的正整数账号ID');
  const scope=accountScope(url.origin,options.accountId),account=path.join(target,'accounts',scope),configTarget=path.join(target,`juhe-${scope}.json`);
  for(const relative of ['accounts',`accounts/${scope}`,'migration-backups','Session Data','Session Data/Partitions']) {
    const candidate=path.join(target,relative);if(fs.existsSync(candidate)&&fs.lstatSync(candidate).isSymbolicLink())throw Error('目标不能含目录连接或符号链接: '+candidate);
  }
  const partitionRoots=[path.join(source,'Session Data','Partitions'),path.join(source,'Partitions')].filter(p=>fs.existsSync(p));
  for(const root of partitionRoots)if(fs.lstatSync(root).isSymbolicLink())throw Error('旧分区目录不能是连接或符号链接');
  if(partitionRoots.length>1) throw Error('发现两套旧分区目录，请先确认原客户端实际Session Data路径，不能混合迁移');
  const partitions=partitionRoots.length?fs.readdirSync(partitionRoots[0],{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.name.startsWith('juhe-')):[];
  const partitionTarget=path.join(target,'Session Data','Partitions');
  const destinations=[configTarget,...partitions.map(e=>path.join(partitionTarget,`juhe-${scope}--${e.name}`))];
  if(fs.existsSync(account)&&fs.readdirSync(account).length || destinations.some(p=>fs.existsSync(p))) throw Error('目标账号已有数据，拒绝覆盖。请备份后选择尚未进入工作台的确认账号');
  const stamp=new Date().toISOString().replace(/[:.]/g,'-'),backup=path.join(target,'migration-backups',`${stamp}-${scope.slice(0,12)}`);
  fs.mkdirSync(backup,{recursive:true});
  const entries=[];
  function regular(p) {if(fs.lstatSync(p).isSymbolicLink()) throw Error('拒绝迁移符号链接或目录连接: '+p);}
  function copy(from,to) {
    regular(from);const stat=fs.statSync(from);
    if(stat.isDirectory()){fs.mkdirSync(to,{recursive:true});for(const name of fs.readdirSync(from))copy(path.join(from,name),path.join(to,name));return;}
    if(!stat.isFile())throw Error('不支持的文件类型');fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);
    entries.push({file:path.relative(backup,to),size:stat.size,sha256:digest(to)});
  }
  const staged=path.join(backup,'account');fs.mkdirSync(staged);
  for(const name of ['msgHistory.db','msgHistory.db-wal','logoLog.db','logoLog.db-wal','shopData.json'])if(fs.existsSync(path.join(source,name)))copy(path.join(source,name),path.join(staged,name));
  // loginData is authentication-related: retain only harmless display preferences, never passwords/tokens.
  if(fs.existsSync(path.join(source,'loginData.json'))) {
    const old=JSON.parse(fs.readFileSync(path.join(source,'loginData.json'),'utf8'));
    fs.writeFileSync(path.join(staged,'loginData.json'),JSON.stringify(Object.fromEntries(['username','userName','rememberAccount'].filter(k=>Object.hasOwn(old,k)).map(k=>[k,old[k]])),null,2));
  }
  let config={};if(fs.existsSync(path.join(source,'config.json'))) {const old=JSON.parse(fs.readFileSync(path.join(source,'config.json'),'utf8'));config=Object.fromEntries(configKeys.filter(k=>Object.hasOwn(old,k)).map(k=>[k,old[k]]));}
  fs.writeFileSync(path.join(backup,'business-config.json'),JSON.stringify(config,null,2));
  if(options.browserExport){const input=JSON.parse(fs.readFileSync(options.browserExport,'utf8'));const sanitized=browserBusinessData({getItem:k=>JSON.stringify(input[k]??null)});fs.writeFileSync(path.join(staged,'browser-legacy.json'),JSON.stringify(sanitized));}
  for(const item of partitions)copy(path.join(partitionRoots[0],item.name),path.join(backup,'partitions',item.name));
  entries.length=0;
  function inventory(folder) {for(const name of fs.readdirSync(folder)){const file=path.join(folder,name);if(fs.statSync(file).isDirectory())inventory(file);else entries.push({file:path.relative(backup,file),size:fs.statSync(file).size,sha256:digest(file)});}}
  inventory(backup);
  const manifest={version:1,source,target,service:url.origin,accountId:String(options.accountId),scope,createdAt:stamp,files:entries,excluded:['userInfo','account tokens','device private key','login password','default browser authentication storage'],state:'staged'};
  fs.writeFileSync(path.join(backup,'manifest.json'),JSON.stringify(manifest,null,2));
  checkClosed(); // No application may have started during the potentially large copy.
  if(fs.existsSync(account)&&fs.readdirSync(account).length || destinations.some(p=>fs.existsSync(p))) throw Error('迁移期间目标发生变化，已保留备份但停止写入');
  fs.cpSync(staged,account,{recursive:true,errorOnExist:true,force:false});
  fs.writeFileSync(configTarget,JSON.stringify(config,null,2),{flag:'wx'});
  for(const item of partitions)fs.cpSync(path.join(backup,'partitions',item.name),path.join(partitionTarget,`juhe-${scope}--${item.name}`),{recursive:true,errorOnExist:true,force:false});
  fs.writeFileSync(path.join(account,'legacy-import.json'),JSON.stringify({scope,backup,confirmedAccountId:String(options.accountId)}));
  manifest.state='completed';fs.writeFileSync(path.join(backup,'manifest.json'),JSON.stringify(manifest,null,2));
  return {scope,backup,account,partitions:partitions.length};
}
if(require.main===module){try{const args=process.argv.slice(2),options={};for(let i=0;i<args.length;i+=2){if(!args[i].startsWith('--')||!args[i+1])throw Error('参数必须为--名称 值');options[args[i].slice(2).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=args[i+1];}console.log(JSON.stringify(migrate(options),null,2));}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={migrate};
