# 聚禾客服 3.8 部署包

此包用于在 Linux 服务器上部署账号和授权后台；每台服务器需按本文完成安装和实际验证。短信需配置服务商凭据后另行联调。AI与人工收款流程保持不变。

**已选择香港服务器、无需自有域名：请从 [IP 部署说明](README-IP.md) 开始。** 使用该入口时，客户在客户端操作，你通过 `https://服务器IP/admin` 管理。本页下方原有命令适用于域名部署，不要与 IP 入口混用。

## 目录与准备

使用 Linux x86_64、Docker Engine 与 Compose 插件。首次小规模运行可准备2核、4GB内存，容量与并发上线后再观察调整；这不是负载保证。域名解析到服务器，放行80/443，SSH只允许管理来源。国内资源的接入要求按云平台办理。应用47831端口不映射公网，数据库不提供外部端口。

将部署压缩包解压，进入 `deployment` 目录。以下操作在新服务器执行，不在当前客户机器运行。先初始化目录和随机备份密钥：

```sh
docker run --rm --user 0 -v "$PWD:/setup" -w /setup public.ecr.aws/docker/library/node:24-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6 node initialize.mjs
```

编辑 `.env` 中的 `JUHE_DOMAIN` 与 `JUHE_TLS_EMAIL` 为自己的域名和证书提醒邮箱。生产镜像默认使用 `caddy:2-alpine`，上线时建议固定已验证的镜像digest并填入 `JUHE_CADDY_IMAGE`，便于复现升级。禁止配置测试短信模式和旧管理员密钥模式。

```sh
docker compose -f compose.production.yaml build auth
docker compose -f compose.production.yaml up -d
docker compose -f compose.production.yaml ps
```

Caddy自动申请HTTPS证书；首次签发依赖真实DNS和80/443可达，未购买域名时不能验证真实证书签发。后端仅接受配置的域名和同源管理网页。管理页为 `https://你的域名/admin`，健康页为 `/health`。首次初始化管理员：

```sh
docker compose -f compose.production.yaml exec auth node admin-cli.mjs init admin
```

在服务器受限目录 `state/data/administrator-initial-password.txt` 读取初始凭据，存入自己的密码管理器后删除该文件。不要把它发给客户或打入安装包。再次init不会覆盖现有管理员；管理员丢失密码时在服务器本机使用 `admin-cli.mjs reset admin`，会重设管理员凭据，应核对操作记录。

## 客户端连接

客户端保留本机调试默认值。部署后设置客户端用户目录下的 `juhe-service.json`：

```json
{"url":"https://你的域名"}
```

也可通过环境变量 `JUHE_SERVICE_URL` 指定相同地址。远程明文HTTP不允许。Windows原兼容用户目录通常为 `%APPDATA%/快回`，测试目录可用 `JUHE_CLIENT_DATA_DIR` 独立指定。不要把管理员凭据或短信密钥写进客户端。

## 每日备份与查看故障

maintenance容器启动后做首次在线一致性备份，此后每天一次，保留14份。备份为AES-256-GCM加密文件，数据保存在 `state/backups`，密钥在 `secrets/backup.key`。务必将密钥独立保存到服务器之外；没有它无法恢复。

```sh
docker compose -f compose.production.yaml logs --tail 100 maintenance
docker compose -f compose.production.yaml ps
```

`state/backups/status.json` 包含最近成功备份时间和服务探测结果。连续3次服务失败、备份失败或状态过旧，会在日志与容器健康状态中反映。可配置 `JUHE_ALERT_WEBHOOK` 为自己控制的HTTPS接收地址，发送通用JSON状态事件（`attention-required` / `recovered`），故障状态不变时不重复通知，投递失败下次重试；它不是企业微信等平台的专用消息格式。当前没有真实接收方，未发送任何故障通知。若整台服务器关机，本机任务也会停止，因此正式营业还需外部可用性监控。

同机备份不能抵抗整台服务器或磁盘丢失。正式使用前，应把加密 `.jhb` 与对应 `.json` 文件定时复制到自己的异机备份存储，密钥分开保存；云存储账号未准备，本包未替用户开通。不要在线直接复制SQLite主文件代替本工具。

手动追加备份：

```sh
docker compose -f compose.production.yaml exec maintenance node ops.mjs backup /data/accounts.sqlite /backups /secrets/backup.key
```

## 恢复演练

恢复工具只接受新空目录，拒绝覆盖原数据库。先停止写入服务，再恢复到独立目录，核对后切换挂载；旧数据目录保留回退。示例中的文件名替换为实际备份：

```sh
docker compose -f compose.production.yaml stop auth maintenance
docker compose -f compose.production.yaml run --rm --no-deps --user 0 -v "$PWD/state/restore-check:/restore" maintenance node ops.mjs restore /backups/实际备份.jhb /restore /secrets/backup.key
```

核对恢复数据库完整性、账号和套餐后，将 `state/restore-check` 设为节点UID1000可读写，在compose中把auth与maintenance两处数据挂载一起切换到恢复目录再启动。恢复会清除客户/管理员会话、挑战、验证码、恢复码，并作废备份中未使用的授权码，避免恢复后旧凭据再次可用；需重新登录、重新发放未兑换授权码。恢复到历史时刻之后发生的订单/续费不在该备份内，应按收款记录核对补齐。管理员密码也回到备份时状态，恢复后及时重设。

## 客户端发布与升级

将安装包复制到服务器临时目录，用发布工具生成清单（示例版本按实际填写）：

```sh
docker compose -f compose.production.yaml run --rm --no-deps --user 0 -v "$PWD/releases:/publish" -v "$PWD/incoming:/incoming:ro" auth node releases.mjs publish /incoming/Juhe-Customer-Service-3.8.0-juhe.1-x64-Setup.exe /publish 3.8.0-juhe.1
```

客户端“检查更新”从同一授权服务获取版本与SHA256，下载后校验大小和哈希，只打开安装包所在文件夹；用户退出客户端再双击安装。不会静默安装，也不会自动打开外部下载地址。服务尚未发布清单时明确提示未配置。

这是受信任HTTPS服务上的完整性校验，不替代Windows代码签名证书。当前没有购买代码签名证书。3.7.x旧客户端尚无新更新入口，首次升级到3.8需要手动下载安装包。

## 服务升级与回退

升级前做一次备份并记录镜像ID。构建新镜像、运行测试后替换auth和maintenance；查看健康状态及管理员登录。数据库迁移可能不兼容旧代码，不应只换旧镜像就直接操作新库；需要回退时恢复升级前备份到新目录并核对升级期间的数据。

短信新增 Spug 平台验证码模板通道，保留普通阿里云短信通道；按 [短信配置说明](../local-auth/account-security-guide.md) 选择服务商。新部署默认选择 Spug，模板编码留空时不发送。现有 `.env` 不会自动覆盖；从旧部署切换时需手动增加 `JUHE_SMS_PROVIDER=spug` 和 `JUHE_SPUG_TEMPLATE_CODE` 并重新创建 auth 容器。AI和自动支付不属于此包新增功能。
