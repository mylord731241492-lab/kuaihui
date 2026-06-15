const osz = require("os"),
  { clipboard, nativeImage, ipcRenderer, shell } = require("electron"),
  { registDb } = require("./db"),
  { getCurrentWindow } = require("./getWin"),
  {
    getProcessMemoryInfo,
    getProcessCPUUsage,
    getWindowCount,
    getDeviceId,
  } = require("./getProcessCpuMemo"),
  screenshot = require("./screenshot"),
  { isABFlag } = require("../utils/isAlpha.cjs"),
  { version } = require("../../package.json");
window["csBridge"] = {
  getCurrentWindow: getCurrentWindow,
  ipcRenderer: ipcRenderer,
  clipboard: clipboard,
  nativeImage: nativeImage,
  shell: shell,
  screenshot: screenshot,
  getRemote: !![],
  performance: {
    getProcessMemoryInfo: getProcessMemoryInfo,
    getProcessCPUUsage: getProcessCPUUsage,
    getWindowCount: getWindowCount,
    getDeviceId: getDeviceId,
  },
  appInfo: {
    appVersion: version,
    osVersion: os["version"](),
    platform: process["platform"],
    electronVersion: process["versions"]["electron"],
    nodeVersion: process["versions"]["node"],
  },
  supportNewUI: !![],
  sitEnvDb: {
    updateSitUrl(a) {
      ipcRenderer["send"]("store:updateEndpoint", a);
    },
  },
  clientDb: { registDb: registDb },
  supportTab: !![],
  supportFloatPlayVoice: ![],
  supportFloatWin: !![],
  supportArkLogin: !![],
  supportBackgroundHigh: isABFlag("is-high-background") || ![],
  openChildWindow: (a) => {
    a["url"] && a["type"] && a["width"] !== undefined && a["height"] !== undefined
      ? ipcRenderer["send"]("open-child-window", a)
      : console["error"]("url,type,width,height必须传入");
  },
};
