# 聚禾客服：香港服务器 IP 部署

客户使用现有 Windows 客户端完成注册、登录、授权码兑换和设备管理；管理员用浏览器访问 `https://服务器IP/admin`。本方案沿用已有账号和授权后台，不需要购买域名。香港托管不要求办理中国内地服务器接入的 ICP 备案，依据见文末。

此包包含服务器部署和证书续期工具。每台新服务器仍需完成下述部署及公网验证，短信需另行实测送达。部署前准备：

- 香港地区 Linux x86_64 服务器，Ubuntu 24.04 LTS，固定且独享的公网 IPv4；排除仅内网地址、共享 NAT、端口转发型套餐。初期可用 2 核 2GB、40GB 磁盘，并观察实际负载；这不是并发保证。
- 服务器安装 Docker Engine、Docker Compose v2 插件，系统使用 systemd。镜像安装参考 [Docker 官方 Ubuntu 指南](https://docs.docker.com/engine/install/ubuntu/)。
- 云防火墙和系统防火墙持续放行 TCP 80、443；UDP 443 为 HTTP/3 可选。SSH 仅对你的管理来源开放。应用 47831 和 Caddy 管理端口不暴露公网。
- 可正常收信的证书联系邮箱；手机号注册须配置可用短信服务、固定十分钟验证码模板与发送额度。

## 1. 初始化

把压缩包解压到 `/opt/juhe`，使该目录下有 `deployment`、`local-auth` 等目录。路径不要带空格。以下命令在这台新服务器执行：

```sh
cd /opt/juhe/deployment
sudo bash ip-deploy.sh init 你的真实公网IPv4 你的邮箱
```

将中文占位内容替换成实际值。初始化会拒绝内网与文档示例 IP；不会自动猜测服务器地址，也不会覆盖已有且地址不同的配置。生成：

- `.env.ip`：IP、联系邮箱和随机代理密钥；权限仅服务器管理员可读。
- `secrets/backup.key`：随机备份密钥，需独立保存到服务器之外。
- `juhe-service.json`：仅包含客户端服务地址，可以交给客户使用。
- `state/`：数据库、加密备份、证书与运行状态。

不要把整个部署目录发给客户。已有域名部署迁移到 IP、或公网 IP 变动时，先备份并安排迁移，不能直接混用两个 Compose 入口。IP 变动也需要重新签证书并更新客户的服务地址。

## 2. 启动及证书

```sh
sudo bash ip-deploy.sh up
```

此命令先启用仅提供证书验证文件的 HTTP 服务，执行 Let's Encrypt 测试验证，再申请正式 IP 证书，启动授权后台并加载 HTTPS。测试证书不会作为正式网站证书使用。登录和后台只通过 HTTPS 提供。

随后检查真实 TLS 连接：系统信任链、IP SAN、有效期至少剩余 48 小时，以及对外证书是否与磁盘证书相同。检查通过后，安装每 6 小时运行的 systemd 续期任务。只有 HTTPS 检查和定时任务均成功才输出完成提示。

证书由 Let's Encrypt 免费签发，有效期约 6 天。续期必须长期运行；不要关闭 80 端口，也不要停用任务。默认 Certbot 镜像固定为 `certbot/certbot:v5.8.0`，IP webroot 功能最低要求 5.4。Caddy 显式加载该证书，续期使用 `reload --force`，不会让客户安装自签名根证书或忽略 TLS 错误。

若执行失败，根据输出修正网络/配置后重新运行。失败不等于部署完成，不能跳过验证直接让客户连接。

## 3. 管理员和客户端

初始化管理员：

```sh
sudo docker compose --env-file .env.ip -f compose.ip.yaml exec auth node admin-cli.mjs init admin
```

在服务器本机受限文件 `state/data/administrator-initial-password.txt` 读取初始密码，保存到自己的密码管理器后删除文件。用浏览器打开 `https://你的服务器IP/admin`，登录后即可管理账号、授权码和设备。管理员密码不能放入客户端。

将初始化生成的 `juhe-service.json` 放到每位客户 Windows 用户的 `%APPDATA%/快回/juhe-service.json`，关闭并重新打开客户端。已有 3.8.0 客户端支持 HTTPS IP，无需为这项部署变化替换业务代码。通用安装包默认使用本机调试地址；服务器部署完成后使用该配置切换到实际公网地址，也可另打包预配置客户端，减少客户手工设置。

公网上线核对：从另一网络打开管理页且无证书警告；客户端手机注册、登录、授权码兑换；套餐额度内多台电脑同时在线，额外电脑登录被拒绝；退出或解绑释放本机名额，失联最迟约90秒后释放；添加店铺不受数量额度限制；改密或管理员停用撤销全部登录；备份任务运行。多电脑规则须配套部署当前源码和新客户端，已发布3.8.3 / r8不包含这项变更。浏览器打不开或提示证书异常时应排查网络/证书，不要使用跳过验证参数。

## 4. 查看状态、续期与备份

```sh
sudo bash ip-deploy.sh status
sudo bash ip-deploy.sh check
sudo systemctl list-timers juhe-ip-renew.timer
sudo journalctl -u juhe-ip-renew.service --since today
```

`status` 检查容器及正在使用的 TLS 证书。`check` 演练 ACME 续期，然后验证现有正式证书；它不把测试证书切到生产。`renew` 手工执行一次真正续期检查和证书重载；尚未到续期时间则不重复签发。失败会返回非零，systemd 记录失败；实际 TLS 结果写入 `state/ip-caddy/tls-status.json`。

如果 Certbot 本身失败，还没有执行到 TLS 检查，状态文件可能仍是上一次结果，必须结合 `checkedAt` 和 systemd 日志查看。自动续期并不等于已经接通通知；本包没有擅自发送短信或消息。正式营业时为 `https://IP/health` 增加自己的外部 HTTPS 监控并开启证书到期提醒，整机断电时本机任务无法通知。

每日加密备份、恢复演练、客户端更新发布仍按 [原部署说明](README.md) 操作；命令中的 `docker compose -f compose.production.yaml` 替换为 `docker compose --env-file .env.ip -f compose.ip.yaml`。数据库路径、密钥、备份格式不变。将加密备份定时复制到异机，密钥单独保存。

## 短信及收费范围

本包新增 Spug 短信适配。2026-09-25 用户提供的客服回复确认：个人实名认证后，可为香港服务器上的 Windows 客户端业务发送验证码；报价为 0.05 元/条，失败返还额度。会员不包含短信额度，短信需单独充值，实际购买价格和可用性以账户控制台为准。

1. 在 [Spug 账户设置](https://user.spug.cc/setting) 完成个人实名认证。在 [短信资源包页面](https://user.spug.cc/?tab=pack) 查看充值选项，先用少量额度验证真实送达；无需为短信购买会员。
2. 按 [官方验证码文档](https://push.spug.cc/guide/sms) 在控制台选择仅含 `code` 变量、固定“十分钟内有效”的官方验证码模板，取得模板编码。手机注册、绑定/换绑手机与找回密码共用这一个模板，GET仅传 `to`、`code`；服务端实际有效期为10分钟。旧 `${number}` 模板编码需替换为固定十分钟模板编码。模板编码位于发送地址路径中，本身就是调用凭据；仅保存在服务器，不放入客户端或聊天记录。
3. r4起可直接进入后台“管理设置 → 短信认证（Spug）”，选择“使用Spug”，填写模板Code和每日发送上限，输入管理员密码后保存。建议先设20条作为小范围验证额度；失败尝试也计数。保存立即生效，无需重启，也不会自动发短信。若Spug启用了IP白名单，填服务器实际出口IP。
4. 如需沿用环境变量，后台选择“沿用服务器环境配置”，在服务器 `deployment/.env.ip` 设置 `JUHE_SMS_PROVIDER=spug`、`JUHE_SPUG_TEMPLATE_CODE=实际模板编码`、`JUHE_SMS_DAILY_LIMIT=20`，然后在 `deployment` 目录执行：

```sh
sudo docker compose --env-file .env.ip -f compose.ip.yaml up -d --build --no-deps auth
```

5. 用自己的测试账号在客户端绑定手机，实际收取验证码并完成绑定；再退出，通过该账号已绑定的手机重置密码，确认旧会话失效。检查 Spug 控制台发送记录和扣费情况。平台“受理”不代表手机已经收到；超时不要连续重试，先查看手机与发送记录。

自动测试使用隔离的模拟通道。3.8.3 客户端配合服务端 r8 仅允许手机号＋短信验证码＋密码注册，注册即验证绑定手机，之后使用该手机号账号和密码登录。旧账号注册接口固定返回410并提示升级，旧账号仍能登录。服务端新增独立的注册验证码表，不改动旧账号资料。Spug 验证码6位、10分钟有效，注册、绑定和找回验证码不能互用；重置密码后撤销旧会话。r6 的真实短信已由用户确认送达，新增注册业务验收不额外发送真实短信。详细规则和接口见 [账号安全配置](../local-auth/account-security-guide.md)。

后台保存的模板使用服务器 `data/admin-key.txt` 派生密钥加密，普通更新须保留此文件。数据库备份不包含该密钥；异机恢复且密钥改变时，需要重新在后台填写模板配置。修改短信配置会使未完成的验证码失效，但不重置当日发送额度。

未配置短信时，已有账号仍可使用账号密码登录，注册及密码修改/找回需要短信服务可用；用户恢复码和客服重置码已关闭。普通阿里云通道仍可明确选择，个人 PNVS 未接入。收款继续使用人工收款发授权码流程，自动支付和定制 AI 不在本次修改范围。

## 官方依据

- [腾讯云 ICP 常见问题：香港托管](https://cloud.tencent.com/document/product/243/19630)
- [Let's Encrypt：Certbot 的 IP 证书及 webroot 参数](https://letsencrypt.org/2026/03/11/shorter-certs-certbot)
- [Certbot：续期与证书目录](https://eff-certbot.readthedocs.io/en/stable/using.html#renewing-certificates)
- [Caddy：强制重新加载证书](https://caddyserver.com/docs/command-line#caddy-reload)

这是所选服务器部署路径的说明，不将客户端界面位置等同于所有业务都免除其他适用要求。
