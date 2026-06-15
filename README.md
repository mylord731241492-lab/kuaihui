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
