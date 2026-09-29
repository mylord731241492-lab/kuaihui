# 将旧客户端资料导入已确认账号

此流程用于本机维护人员。它不会自动认领旧资料，也不会删除原件。应先从管理后台核对目标账号 ID、用户名和服务地址，确认旧店铺和消息确实归该账号。目标账号必须尚未进入新版工作台，不能覆盖已有隔离资料。

## 操作步骤

1. 如需保留仅存在浏览器里的设置，在关闭旧客户端前导出下节说明的设置文件。关闭旧版、新版及托盘进程。旧版会话设置在退出后可能消失；已经同步到业务配置文件的回复和 AI 设置会正常迁移。
2. 备份旧资料目录。默认目录为 `%APPDATA%\快回`，自定义启动参数使用对应目录。源目录和目标目录可相同，工具只新增隔离目录。
3. 安装 Node.js，进入交付包内 `kuaihui` 目录，执行以下 PowerShell 示例，替换服务地址和后台核对的账号 ID：

```powershell
node development/migrate-legacy-account.cjs `
  --source "$env:APPDATA\快回" `
  --target "$env:APPDATA\快回" `
  --service "https://客服服务域名" `
  --account-id "7" `
  --confirm-owner "7"
```

如另有浏览器设置导出文件，加 `--browser-export "C:\备份\browser-business-settings.json"`。

4. 工具输出隔离目录与备份位置。查看 `migration-backups/<时间-账号摘要>/manifest.json`，`state` 为 `completed` 才代表迁移完成。清单包含业务文件 SHA256。保留备份并限制访问权限，其中可能有客户消息和店铺登录 Cookie。
5. 启动新版并登录目标账号。首次进入工作台可能提示重启，按提示再次登录即可。工作台出现“导入已确认的旧版设置”按钮时，核对显示的账号名，再确认导入。此步骤只读取白名单业务配置，不导入原账号登录信息。
6. 检查店铺、回复设置、消息记录。平台 Cookie 在同一 Windows 用户和原机器上有可能继续有效；平台或系统加密限制、异机迁移都可能要求重新登录店铺。

## 浏览器业务设置导出

维护人员在旧客户端工作台开发者工具控制台执行下列代码。只导出 `app` 和 `shop` 状态，不导出 `user` 登录状态。之后迁移工具再次按业务字段白名单过滤，忽略认证字段和原服务地址。不能把导出文件发送到聊天、上传公共仓库。

```javascript
const out = {};
for (const key of ['app', 'shop']) {
  out[key] = {...JSON.parse(localStorage.getItem(key) || '{}'), ...JSON.parse(sessionStorage.getItem(key) || '{}')};
}
const link = document.createElement('a');
link.href = URL.createObjectURL(new Blob([JSON.stringify(out)], {type:'application/json'}));
link.download = 'browser-business-settings.json';
link.click();
```

如果源和目标是同一资料目录，可不导出浏览器文件；旧版持久化 `app`/`shop` 仍保留原地，由已确认的单次导入按钮读取。已退出进程中未持久化的会话状态无法凭空恢复。

## 迁移范围和失败处理

- 复制消息/商品/客户资料数据库（含存在的 WAL）、店铺文件、业务配置、旧平台分区；保留 AI 配置值，不更改 AI 逻辑。
- 不复制授权服务令牌、`userInfo`、设备私钥、旧账号密码；`loginData.json` 只保留用户名/记住账号偏好。账号必须重新认证。
- 检测到客户端/Electron 仍运行、目标已有数据、符号链接或不明确的双分区目录时拒绝迁移。不要手工跳过检查。
- 备份后若中途失败，源资料不变，不要反复强制覆盖。先检查清单和错误，备份并移走本次新建的目标隔离目录、对应 `juhe-<scope>.json`、对应 `juhe-<scope>--*` 分区，再在关闭客户端后重新执行。必须逐一核对 scope，不要删除整个用户目录。
- 恢复旧版时退出新版，使用保留的旧安装包与旧资料。工具从未修改旧业务文件。此导入不替代服务器数据迁移，也不会绕过套餐和账号授权。

本工具已做合成文件测试；真实电商资料迁移仍需在备份副本上验收。
