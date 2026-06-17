# 快回离线联调版

这是从 Electron 应用解包后整理的本地化联调版本代码仓库。

## 提交范围

- `app-asar/dist`
- `app-asar/dist-electron`
- `app-asar/package.json`

仓库不提交 Electron 运行时、安装包、重打包产物、`resources/app.asar`、`node_modules` 和 zip 包。

## 本地打包说明

编辑 `app-asar` 后，需要重新封包到：

```powershell
node "C:\Users\pc\Documents\风格化skill 训练\.reverse-tools\node_modules\asar\bin\asar.js" pack ".\app-asar" ".\resources\app.asar"
```

## 更新记录

### 2026-06-17

- 新增「系统设置 > 通用设置 > 全局打开单个页面」开关；开启后普通弹跳页面复用同一个窗口，后续打开的新页面会在该窗口内加载并聚焦。
- 修复单弹窗打开订单链接时登录态丢失的问题；当新页面来自不同 Electron session 时，会切换到当前店铺 session 对应的弹窗，保证内核 cookie 可用。
- 新增「系统设置 > 通用设置 > 关闭检测到售后状态卡片」开关；开启后不再显示售后状态卡片。
- 优化「快回检测到售后状态」卡片：默认右侧贴边折叠，点击竖条展开，点击卡片外区域自动收回，关闭按钮改为收缩到右侧。
- 优化消息通知窗口：展开和收缩分别记忆尺寸，重启后恢复上次状态；新通知进入时不再自动改变窗口尺寸。
- 压缩消息通知窗口排版，缩放/收缩控制统一放到右上角，减少弹窗占用空间。
- 更新 `scripts/verify-guardrails.cjs`，覆盖售后卡片折叠、全局关闭、单弹窗复用、订单链接 session 保持、消息窗口尺寸记忆等关键行为。
