const { ipcRenderer } = require("electron"),
  invokeCurrentWindowFn = (a, ...b) =>
    ipcRenderer["invoke"]("invoke-current-win-function", a, ...b),
  getCurrentWindowData = (a) => ipcRenderer["invoke"]("get-current-win-data", a);
((exports["invokeCurrentWindowFn"] = invokeCurrentWindowFn),
  (exports["getCurrentWindowData"] = getCurrentWindowData));
const windowMethods = {
  on: () => {},
  setMaximumSize: (a, b) => {
    invokeCurrentWindowFn("setMaximumSize", a, b);
  },
  setMinimumSize: (a, b) => {
    invokeCurrentWindowFn("setMinimumSize", a, b);
  },
  setMaximizable: (a) => {
    invokeCurrentWindowFn("setMaximizable", a);
  },
  maximize: () => {
    invokeCurrentWindowFn("maximize");
  },
  unmaximize: () => {
    invokeCurrentWindowFn("unmaximize");
  },
  minimize: () => {
    invokeCurrentWindowFn("minimize");
  },
  setBounds: (a) => {
    invokeCurrentWindowFn("setBounds", a);
  },
  focus: () => {
    invokeCurrentWindowFn("focus");
  },
  show: () => {
    invokeCurrentWindowFn("show");
  },
  hide: () => {
    invokeCurrentWindowFn("hide");
  },
  restore: () => {
    invokeCurrentWindowFn("restore");
  },
  showInactive: () => {
    invokeCurrentWindowFn("showInactive");
  },
  isVisible: () => {
    return invokeCurrentWindowFn("isVisible");
  },
  isMinimized: () => {
    return invokeCurrentWindowFn("isMinimized");
  },
  isMaximized: () => {
    return invokeCurrentWindowFn("isMaximized");
  },
  isFocused: () => {
    return invokeCurrentWindowFn("isFocused");
  },
  setBackgroundColor: (a) => {
    invokeCurrentWindowFn("setBackgroundColor", a);
  },
  setFullScreenable: (a) => {
    invokeCurrentWindowFn("setFullScreenable", a);
  },
  setFullScreen: (a) => {
    invokeCurrentWindowFn("setFullScreen", a);
  },
  invokeCurrentWindowFn: invokeCurrentWindowFn,
  getCurrentWindowData: getCurrentWindowData,
};
exports["getCurrentWindow"] = () => windowMethods;
