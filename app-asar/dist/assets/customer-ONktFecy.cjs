//  淘工厂preload、
const { ipcRenderer, contextBridge, webFrame } = require("electron");
const shouldDisablePreloadConsole = process.argv.includes("--kh-disable-preload-console");

if (shouldDisablePreloadConsole) {
  const noop = () => {};
  [
    "log",
    "info",
    "warn",
    "debug",
    "trace",
    "dir",
    "dirxml",
    "group",
    "groupCollapsed",
    "groupEnd",
    "table",
  ].forEach((method) => {
    try {
      console[method] = noop;
    } catch {}
  });
}

// ==================== 快捷键拦截器 ====================
// 拦截开发者工具快捷键，防止在webView中打开控制台
// (function () {
// 'use strict';
// 安全注册 IPC 监听器（自动移除旧监听，防止刷新时重复注册）
function safeIpcOn(channel, handler) {
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, handler);
}

// 记录当前店铺名，避免早期异常直接读取后面的 let 变量。
let currentShopName = "";

// 把不同来源的异常整理成可读文本，避免日志里出现 [object Event]。
function getReadableErrorMessage(errorLike) {
  if (!errorLike) return "未知错误";
  if (typeof errorLike === "string") return errorLike;
  if (errorLike instanceof Error) {
    return errorLike.stack || errorLike.message || String(errorLike);
  }
  if (typeof errorLike === "object") {
    const message = errorLike.message || errorLike.reason?.message || "";
    const stack = errorLike.stack || errorLike.reason?.stack || "";
    const filename = errorLike.filename || "";
    const lineno = errorLike.lineno ? `:${errorLike.lineno}` : "";
    const colno = errorLike.colno ? `:${errorLike.colno}` : "";
    const location = filename ? ` ${filename}${lineno}${colno}` : "";
    if (message || stack) {
      return `${message}${location}${stack ? `\n${stack}` : ""}`.trim();
    }
  }
  return String(errorLike);
}

// 统一上报淘工厂 preload 的全局错误。
function reportGlobalPreloadError(type, errorLike) {
  ipcRenderer.send("write-preload-error-log", {
    shopName: currentShopName || "未知店铺",
    platform: "tgc",
    errorMessage: `${type}: ${getReadableErrorMessage(errorLike)}`,
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
  });
}

// console.log('✅ 全局焦点拦截已启动')

// ============ API 健康监控 ============
const apiHealthMonitor = {
  recentRequests: [], // 最近的请求结果 [true=成功, false=失败]
  MAX_RECORDS: 10, // 最多记录 10 次
  initialized: false,

  // 记录请求结果
  record(success) {
    this.recentRequests.push(success);
    if (this.recentRequests.length > this.MAX_RECORDS) {
      this.recentRequests.shift();
    }
  },

  // 获取 API 健康状态
  isHealthy() {
    // 样本太少不判断
    if (this.recentRequests.length < 3) return true;
    const failCount = this.recentRequests.filter((ok) => !ok).length;
    // 失败率 >= 50% 视为不健康
    return failCount / this.recentRequests.length < 0.5;
  },

  // 初始化 fetch 拦截
  init() {
    if (this.initialized) return;
    this.initialized = true;

    const self = this;
    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
      try {
        const response = await originalFetch.apply(this, args);
        // 只记录业务接口，忽略静态资源
        const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
        if (!url.includes(".js") && !url.includes(".css")) {
          self.record(response.ok);
        }
        return response;
      } catch (e) {
        const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";

        self.record(false);

        throw e;
      }
    };

    console.log("[API健康监控] 已初始化");
  },
};

// 初始化 API 监控
apiHealthMonitor.init();

let isUserOperating = false; // 用户是否正在操作
let lastMouseActivity = 0; // 最后一次鼠标活动时间
let windowHasFocus = false; // 窗口是否有焦点
let userActivityTimer = null; // 用户活动检查定时器
let USER_ACTIVITY_TIMEOUT = 3000; // 3秒内有鼠标活动认为用户在操作
let is_key = null; //  页面隐藏状态，true=隐藏，false=可见

let shopBotStatus = null; // 店铺bot状态
let message = null;
let isProcessing = false;

const userMap = new Map();
const sleepMsg = new Map();

let orderList = [];

function interceptDevToolsShortcuts(event) {
  // F12
  if (event.key === "F12") {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    // console.log('webView内拦截到F12');
    return false;
  }
  // Ctrl+Shift+I
  if ((event.key === "I" || event.key === "i") && event.ctrlKey && event.shiftKey) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    // console.log('webView内拦截到Ctrl+Shift+I');
    return false;
  }

  // Ctrl+Shift+J
  if ((event.key === "J" || event.key === "j") && event.ctrlKey && event.shiftKey) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    // console.log('webView内拦截到Ctrl+Shift+J');
    return false;
  }

  // Ctrl+Shift+K
  if ((event.key === "K" || event.key === "k") && event.ctrlKey && event.shiftKey) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    // console.log('webView内拦截到Ctrl+Shift+K');
    return false;
  }

  // Ctrl+Shift+C (检查元素)
  if ((event.key === "C" || event.key === "c") && event.ctrlKey && event.shiftKey) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    // console.log('webView内拦截到Ctrl+Shift+C');
    return false;
  }
}

// 在捕获阶段拦截，确保优先级最高
document.addEventListener("keydown", interceptDevToolsShortcuts, true);

// 页面加载完成后再次绑定，确保覆盖其他可能的事件监听器
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("keydown", interceptDevToolsShortcuts, true);
  });
}

// 全局错误监听器
window.addEventListener("error", (event) => {
  console.error("全局 JavaScript 错误:", event.error);
  reportGlobalPreloadError("全局错误", event.error || event);
});

// 未处理的 Promise 拒绝监听器
window.addEventListener("unhandledrejection", (event) => {
  console.error("未处理的 Promise 拒绝:", event.reason);
  reportGlobalPreloadError("未捕获的promise错误", event.reason || event);
});

let retryCount = 0;
const maxRetries = 30;
let that_pvId = null;
let listdom;
// 基于数组的简易发送队列（保持唯一）
let messageQueue = [];
let isProcessingQueue = false;
const enqueuedIds = new Set();
let logoInfo = {
  username: "",
  password: "",
};
// 店铺信息
let shopInfo = {
  id: null,
  name: null,
  username: null,
};
let commonLoginByXspaceInfo = {
  xpScene: "",
  xpToken: "",
  xpServicerId: "",
  buId: "",
  callback: "",
};

let cookie = null;
// 获取http账号密码
function getHttpAccountPassword() {
  const urlObject = new URL(window.location.href);
  // 先尝试从直接URL参数获取
  const redirectParams = new URLSearchParams(urlObject.search);
  let username = redirectParams.get("username");
  let password = redirectParams.get("password");
  // 如果直接参数中没有，尝试从redirect_url中获取
  if (!username || !password) {
    const redirectUrl = redirectParams.get("redirect_url");
    if (redirectUrl) {
      try {
        // 解码redirect_url
        const decodedRedirectUrl = decodeURIComponent(redirectUrl);
        // 从解码后的URL中提取参数
        const redirectUrlObject = new URL(decodedRedirectUrl);
        const redirectUrlParams = new URLSearchParams(redirectUrlObject.search);
        username =
          redirectUrlParams.get("username") == "null" ? "" : redirectUrlParams.get("username");
        password =
          redirectUrlParams.get("password") == "null" ? "" : redirectUrlParams.get("password");
      } catch (error) {
        console.error("解析redirect_url失败:", error);
      }
    }
  }
  return {
    username,
    password,
  };
}

contextBridge.exposeInMainWorld("context_bridge", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  on: (channel, callback) => safeIpcOn(channel, callback),
  // 新增 a_bogus 生成方法
  // getABogus: (url) => {
  //   if (window.byted_acrawler && window.byted_acrawler.sign) {
  //     return window.byted_acrawler.sign({ url })
  //   }
  //   return ''
  // }
});

//  监听页面加载完成
window.addEventListener("load", () => {
  // ipcRenderer.send('window-title')
  console.log("页面加载成功");
  const style = document.createElement("style");
  style.setAttribute("data-disable-anim", "true");
  // 动画延迟  animation-delay: 0.01ms !important;
  // 动画时长  animation-duration: 0.01ms !important;
  // 动画次数  animation-iteration-count: 1 !important;
  // 过渡时长  transition-duration: 0.01ms !important;
  // 过渡延迟  transition-delay: 0.01ms !important;
  // 滚动行为  scroll-behavior: auto !important;
  // style.innerHTML = `
  //   *,
  //   *::before,
  //   *::after {
  //     animation-delay: 0.01ms !important;
  //     animation-duration: 0.01ms !important;
  //     animation-iteration-count: 1 !important;
  //     transition-duration: 0.01ms !important;
  //     transition-delay: 0.01ms !important;
  //     scroll-behavior: auto !important;
  //   }
  // `
  // document.head?.appendChild(style)
  setTimeout(() => {
    ipcRenderer.send("request-shop-bot-status");
  }, 1000);

  // 初始化获取店铺信息
  try {
    fetch("https://c2mbc.service.xixikf.cn/g_config.js", {
      method: "GET",
      mode: "cors",
      credentials: "include",
    })
      .then((res) => res.text())
      .then((res) => {
        // console.log('res=========>', res)
        const reg = /"currentUser"\s*:\s*(\{[\s\S]*?\})\s*,\s*"thirdPartyLogin"/;
        const match = res.match(reg);
        if (match) {
          const currentUserStr = match[1];
          const currentUser = JSON.parse(currentUserStr);
          console.log("shopmessage==========>", currentUser);
          shopInfo.username = currentUser.showName;
          shopInfo.id = currentUser.servicerId;
          shopInfo.name = currentUser.showName;
          currentShopName = shopInfo.name || "";
          console.log("shopInfo==========>", shopInfo);
          ipcRenderer.send("get-shop-info", shopInfo);
          loopDom();
        }
      });
  } catch (err) {
    console.log("捕获异常", err);
  }

  ipcRenderer.send("get-shop-page-loaded");

  // 检查
  const loginbox = document.querySelector("#alibaba-login-box");

  if (loginbox) {
    // console.log('loginbox', loginbox)
    const url = loginbox.src;
    console.log("url=========>", url);
    const { username, password } = getHttpAccountPassword();
    // console.log('username=========', username)
    // console.log('password=========', password)
    window.location.href = url + "&username=" + username + "&password=" + password;
    return;
  }

  // 获取http
  const url = window.location.href;

  if (url && url.includes("https://havanalogin.taobao.com/mini_login.htm")) {
    // name="fm-login-id"
    const loginTabs = document.querySelector("#mini-login-body");
    const container = loginTabs.querySelector("#container");

    // 设置样式
    if (loginTabs && container) {
      loginTabs.style.setProperty("padding", "100px", "important");
      container.style.setProperty("background", "#85858575");
      container.style.setProperty("border", "1px solid #dbdbdbff");
      container.style.setProperty("border-radius", "10px");
      container.style.setProperty("padding", "30px");
    }

    // console.log('url', url)
    const { username, password } = getHttpAccountPassword();
    // console.log('username=========', username)
    // console.log('password=========', password)
    const usernameInput = document.querySelector('[name="fm-login-id"]');
    const passwordInput = document.querySelector('[name="fm-login-password"]');

    usernameInput.value = username == "null" ? "" : username;
    passwordInput.value = password == "null" ? "" : password;
    const submitButton = document.querySelector('[type="submit"]');
    submitButton.click();
  }

  checkElement();

  // setTimeout(() => {
  //   const logo = document.querySelector(
  //     '.xixikf-workbench_components-logo_logo'
  //   )
  //   console.log('logo============', logo)
  //   if (logo) {
  //
  //   }
  // }, 10000)
});

const checkElement = async () => {
  retryCount++;
  // console.log(`淘工厂第${retryCount}次检查DOM元素=============`)
  const line = document.querySelector(".xixikf-workbench_components-shell-banner_app-display-name");

  if (line) {
    // 找到元素，登录成功
    // console.log('淘工厂登录成功，发送店铺信息=============')
    // ipcRenderer.send('get-shop-info', {
    //   name: '淘工厂'
    // })
    window.alert = (msg) => {
      console.log("alert 被拦截:", msg);
    };
    window.confirm = (msg) => {
      console.log("confirm 被拦截:", msg);
      return true; // 或 false
    };

    getListMessage();
  } else {
    // console.log(`淘工厂第${retryCount}次未找到目标元素`)
    if (retryCount < maxRetries) {
      // 继续重试
      setTimeout(checkElement, 3000);
    } else {
      // 达到最大重试次数
      console.log(`淘工厂DOM检查失败，已尝试${maxRetries}次`);
    }
  }
};

// 获取列表信息
const getListMessage = () => {
  // console.log('开始查询列表元素==========')
  let listRetryCount = 0;
  const listMaxRetries = 10; // 30秒 ÷ 3秒 = 10次

  const checkListElement = () => {
    listRetryCount++;
    // console.log(`第${listRetryCount}次查询列表元素`)
    // '.xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-tao-factory-online-touch-explorer-servicing-touch-list_list'
    listdom = document.querySelector(
      ".xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-tao-factory-online-touch-explorer-assigned-touch-list_container",
    );

    if (listdom) {
      // 找到元素后的处理逻辑
      // onlineStatusObserver.observe(listdom, {
      //   childList: true, // 观察子节点的添加或删除
      //   subtree: true, // 观察所有后代节点
      //   attributes: true, // 观察属性变化
      //   characterData: true // 观察文本内容变化
      // })
      console.log("元素检查完毕成功监听");
    } else {
      if (listRetryCount < listMaxRetries) {
        // 继续查询
        setTimeout(checkListElement, 3000);
      } else {
        // 达到最大重试次数
        console.log(`列表元素查询失败，已尝试${listMaxRetries}次(30秒)`);
      }
    }
  };

  // 开始第一次检查
  checkListElement();
};

//  递归检查
const checkTimecontContent = (target, count = 0) => {
  return new Promise((resolve) => {
    if (target && target.textContent.trim() !== "") {
      // 找到内容，立即返回
      // console.log('找到timecont内容:', target.textContent.trim())
      resolve(target.textContent.trim());
    } else if (count < 25) {
      //  = 25次
      // 继续检查
      setTimeout(() => {
        checkTimecontContent(target, count + 1).then(resolve);
      }, 100); // 每100毫秒检查一次
    } else {
      // 超过30次(3秒)，内容仍为空
      // console.log('3秒内timecont内容仍为空')
      resolve("");
    }
  });
};

//  跳转到当前用户
safeIpcOn("click-customer-message", async (event, arg) => {
  console.log("点击发送消息按钮", arg);
  // 等待跳转并加载输入框
  await gotoUser(arg);
  // 跳转到当前用户
});
//判断是否登录成功
safeIpcOn("login-do-result", (event, arg) => {
  console.log("登录状态", arg);
  // console.log('登录状态', arg?.content?.data)
  // console.log('登录状态', arg?.content?.data?.returnUrl)
  if (arg.content.data.returnUrl) {
    const usernameInput = document.querySelector('[name="fm-login-id"]');
    const passwordInput = document.querySelector('[name="fm-login-password"]');
    const smsInput = document.querySelector('[name="fm-sms-login-id"]');
    if (usernameInput && passwordInput) {
      logoInfo.username = usernameInput.value;
      logoInfo.password = passwordInput.value;
      window.location.href = arg.content.data.returnUrl;
    } else if (smsInput && smsInput.value) {
      logoInfo.username = smsInput.value;
      window.location.href = arg.content.data.returnUrl;
    }
    ipcRenderer.send("loginInfo", logoInfo);
  }
});

//  兜底
safeIpcOn("reply-message", async (_, args) => {
  console.log("兜底回复信息", args);

  try {
    let data = [];
    // 是不是对象
    if (typeof args === "object") {
      data = [args];
    } else {
      const sendlist = JSON.parse(args);
      data = sendlist;
    }
    console.log("发送列表", data);
    processNextMessage(data);
  } catch (error) {
    if (args.isBottomLineAutoReply) {
      processNextMessage([args]);
    }
  }
});
// 发送
async function processNextMessage(sendlist) {
  //
  // if (isProcessing || sendlist.length === 0) {
  //   await delay(500)
  //   ipcRenderer.send('get-customer-callback-result', {
  //     ...message,
  //     isAiInviteReply: message.isAiInviteReply,
  //     isReminderReply: message.isReminderReply,
  //     isBottomLineAutoReply: message.isBottomLineAutoReply,
  //     isAiAutoReply: !message.isBottomLineAutoReply
  //   })
  //
  //   console.log('发送完成=========>', {
  //     ...message,
  //     isAiInviteReply: message.isAiInviteReply,
  //     isReminderReply: message.isReminderReply,
  //     isBottomLineAutoReply: message.isBottomLineAutoReply,
  //     isAiAutoReply: !message.isBottomLineAutoReply
  //   })
  //   return
  // }

  // isProcessing = true
  const message1 = sendlist.shift();
  const message = Array.isArray(message1) ? message1[0] : message1;

  console.log("开始发送消息=========>11111", message);
  if (message?.imageBase64 || message?.imageUrl) {
    sendImage(message?.imageBase64, message.messageId, message.covid, message.imageUrl);
    await delay(500);
  }
  window.postMessage({
    type: "send-message",
    data: {
      content: message.replyContent,
      messageId: message.messageId,
      covid: message.covid,
    },
  });
  setTimeout(() => {
    ipcRenderer.send("get-customer-callback-result", {
      ...message,
      isAiInviteReply: message.isAiInviteReply,
      isReminderReply: message.isReminderReply,
      isBottomLineAutoReply: message.isBottomLineAutoReply,
      isAiAutoReply: !message.isBottomLineAutoReply,
    });
    userMap.delete(message.messageId);
  }, 1500);

  // await handleReplyMessage(message)
  //   .then((success) => {
  //     if (!success) {
  //       console.warn('消息发送失败:', message)
  //       // 可以选择：重新加入队列、记录失败、通知主进程等
  //     }
  //   })
  //   .catch((err) => console.error('处理消息异常', err))
  //   .finally(async () => {
  //     isProcessing = false
  //     await delay(100) // 等待一小会
  //     processNextMessage(sendlist) // 串行处理下一条
  //   })
}
// 处理消息
const handleReplyMessage = async (message) => {
  // 如果是兜底回复，进行特殊判断
  if (message.isBottomLineAutoReply) {
    // 判断1: 当前页面是否可见（is_key=false表示页面可见，此时不回复）
    if (is_key) {
      console.log("[兜底回复] 当前页面可见，不回复", message.messageId);
      return false;
    }
  }

  // message 消息对象
  const inputBox = await gotoUser(message);
  console.log("找到输入框，开始发送消息", inputBox);

  if (inputBox) {
    // 找到输入框，开始发送消息
    inputBox.focus();
    inputBox.innerHTML = message.content;
    const inputEvent = new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: message.content,
    });
    inputBox.dispatchEvent(inputEvent);

    // 等待一下确保内容设置完成
    await delay(100);

    const sendButton = await getElementRecursively("[aria-label='在线会话输入框发送按钮']");
    // console.log('发送按钮', sendButton)

    // 发送前判断内容是否为空
    if (inputBox.textContent.trim() === "") {
      console.log("输入框内容为空，无法发送");
      message.isBottomLineAutoReply = false; // 兜底失败
      return false;
    }

    // 重试发送逻辑
    const maxRetries = 5; // 最大重试次数
    let retryCount = 0;
    let sendSuccess = false;

    while (retryCount < maxRetries && !sendSuccess) {
      //

      sendButton.removeAttribute("disabled");

      console.log("发送");
      if (sendButton && !sendButton.disabled) {
        // 点击发送按钮
        sendButton.click();
        console.log("按钮发送=====");
      } else {
        // 模拟回车发送
        inputBox.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            bubbles: true,
            cancelable: true,
          }),
        );

        inputBox.dispatchEvent(
          new KeyboardEvent("keyup", {
            key: "Enter",
            code: "Enter",
            bubbles: true,
            cancelable: true,
          }),
        );
        console.log("模拟回车发送=====");
      }
      // 等待一段时间，让发送操作完成
      await delay(500);
      // 检查输入框是否为空来判断发送是否成功
      if (inputBox.textContent.trim() === "") {
        // 检查输入框 是否发送成功
        sendSuccess = true;
        console.log("发送成功=====", message.content);
        message.isBottomLineAutoReply = true;
        return true;
      } else {
        retryCount++;
        console.log(`第${retryCount}次发送失败，输入框内容:`, inputBox.textContent.trim());
        if (retryCount < maxRetries) {
          console.log("准备重试...");
          await delay(300); // 重试前等待
        }
      }
    }

    if (!sendSuccess) {
      console.error(`发送失败，已重试${maxRetries}次:`, message.content);
      message.isBottomLineAutoReply = false; // 兜底失败
      return false;
    }
    message.isBottomLineAutoReply = true;
    return true;
  }
  message.isBottomLineAutoReply = false;
  return false;
};

//  跳转到当前用户（异步，返回输入框容器）
const gotoUser = async (arg) => {
  try {
    console.log("跳转到当前用户============", arg);
    document.querySelector('[aria-label="快捷方式:在线客服"]').click(); // 进入客服页面
    // 等待列表容器
    // listdom = await getElementRecursively(
    //   '.xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-tao-factory-online-touch-explorer-assigned-touch-list_container'
    // )
    // console.log('listdom', listdom)
    // if (!listdom) return null
    // 等待目标用户项
    let theUser = await getElementRecursively(`[data-id="${arg.messageId}"]`);

    console.log("theUser", theUser);
    if (!theUser) return null;
    theUser.click(); // 跳转到当前用户
    // 等待会话输入容器出现
    // console.log('theUser', theUser)
    const inputBox = await getElementRecursively(`#xixi-editor-${arg.messageId}`);
    console.log("inputBox", inputBox);
    return inputBox;
  } catch (e) {
    console.log("gotoUser error===========", e);
  }
};

// 递归获取dom节点
const getElementRecursively = (selector, count = 0, maxCount = 35) => {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);

    if (element) {
      // 找到元素，立即返回
      // console.log('找到元素:', element)
      resolve(element);
    } else if (count < maxCount) {
      // 35次 × 100ms = 3500ms
      // 继续查找
      setTimeout(() => {
        getElementRecursively(selector, count + 1, maxCount).then(resolve);
      }, 100); // 每100毫秒检查一次
    } else {
      // 超过3秒，未找到元素
      // console.log('3秒内未找到元素:', selector)
      resolve(null);
    }
  });
};

const HOOK_CODE = function () {
  let mypvId = null;
  let shopInfo = {
    id: null,
    name: null,
    username: null,
  };
  const OriginalWebSocket = window.WebSocket;
  window.WebSocket = function (url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    // 更新状态并通知 preload

    // 拦截发送消息
    const originalSend = ws.send;
    ws.send = function (data) {
      originalSend.apply(this, arguments); // 调用原始 send 方法
    };
    ws.addEventListener("error", function (event) {
      console.info("wss断开");
    });
    ws.addEventListener("open", function (event) {
      console.info("打开ws");
    });
    ws.addEventListener("close", function (event) {
      console.info("WebSocket连接关闭");
    });
    return ws; // 返回 WebSocket 实例
  };
  const targetUrl = "https://c2mbc.api.xixikf.cn/xixi-scheduler/graphql/1.0/InitSeatStatus";
  const targetUrl2 = "https://c2mbc.api.xixikf.cn/xixi-scheduler/graphql/1.0/ChangeStatus";
  const targetUrl3 = "https://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/OnlineTouches";
  const targetUrl4 = "/base/user-tenants";
  const targetUrl5 = "https://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/SendMessage";
  const targetUrl6 = "https://c2mbc.api.xixikf.cn/h5/mopen.code.bundle.appx.runtime.info/1.0/";
  const targetUrl7 =
    "https://c2mbc.api3.xixikf.cn/self-service-workbench/bizql/1.0/BizSupplierOrder__SelfServiceWorkbenchpbib";
  const info_url = `https://c2mbc.service.xixikf.cn/g_config.js`;
  // 拦截请求
  let _key = true;

  const _fetch = window.fetch;
  window.fetch = async (...args) => {
    let clone = null;
    // let mypvId = null
    try {
      // console.log('fetch', args)
      const method = args[1]?.method;
      const url = typeof args[0] === "string" ? args[0] : args[0].url || "";
      // console.log('url============', url, method)

      if (method == "post" && url.includes(targetUrl)) {
        if (args[1]?.config?.data?.variables?.channelType == "ONLINE") {
          const res = await _fetch(...args);

          clone = res.clone();
          console.log("==================", clone);
          const { data } = await clone.json(); // 读取克隆的响应体
          console.log("_this_status============data", data);
          if (data?.currentStatus?.statusId == 1) {
            // console.log('data.currentStatus.statusId', data.currentStatus.statusId)
            window.context_bridge.send("shop-status-change", {
              status: "离线",
            });
          } else {
            const _this_status = data?.statusList?.find(
              (item) => item.statusId == data.currentStatus.statusId,
            );
            if (_this_status) {
              window.context_bridge.send("shop-status-change", {
                status: _this_status.statusName,
              }); //
            }
          }
          return res;
        }
      } else if (method == "post" && url.includes(targetUrl2)) {
        console.log("fetch===========", args);
        const res = await _fetch(...args);
        // console.log(res)
        clone = res.clone();
        const { data } = await clone.json(); // 读取克隆的响应体
        // console.log('data============', data)
        const statusId = data?.changeStatus?.statusId;
        switch (statusId) {
          case "1":
            window.context_bridge.send("shop-status-change", {
              status: "离线",
            });
            break;
          case "2":
            window.context_bridge.send("shop-status-change", {
              status: "接线",
            });
            break;
          case "3":
            window.context_bridge.send("shop-status-change", {
              status: "申请忙碌",
            });
            break;
          case "5":
            window.context_bridge.send("shop-status-change", {
              status: "申请离线",
            });
            break;
          case "6":
            window.context_bridge.send("shop-status-change", {
              status: "培训",
            });
            break;
          case "19":
            window.context_bridge.send("shop-status-change", {
              status: "小休",
            });
            break;
          case "20":
            window.context_bridge.send("shop-status-change", {
              status: "申请小休",
            });
            break;
          default:
            break;
        }
        return res;
      }
      // else if (method == 'post' && url.includes(targetUrl3)) {
      // const body = JSON.parse(args[1]?.body || '{}')
      // if (body.variables?.input?.types?.length > 1) {
      //   // 修改body 继续请求
      //
      //   const res = await _fetch(...args)
      //   clone = res.clone()
      //   const { data } = await clone.json() // 读取克隆的响应体
      //   // console.log('data==============', data)
      //   const shop =
      //     data?.onlineTouches?.list?.find(
      //       (item) => item?.props?.servicerShowName
      //     )?.props || null
      //
      //   if (shop && _key) {
      //     shopInfo.name = shop.servicerShowName
      //     shopInfo.username = shop.servicerShowName
      //     if (shopInfo.id) {
      //       window.context_bridge.send('get-shop-info', shopInfo)
      //     }
      //     _key = false
      //   }
      //   return res
      // }
      // }
      // else if (url.includes(targetUrl4)) {
      //
      //   const res = await _fetch(...args)
      //   clone = res.clone()
      //   const { data } = await clone.json()
      //   console.log('argss', data)
      //
      //   shopInfo.id = data[0].idpAccountId
      //   if (shopInfo.name && shopInfo.username) {
      //     window.context_bridge.send('get-shop-info', shopInfo)
      //   }
      // }
      else if (method == "post" && url.includes(targetUrl5)) {
        const body = JSON.parse(args[1]?.body || "{}");
        const uId = body?.variables?.input?.header?.props?.onlineTouchId;
        //  删除回复信息
        console.log("body", body);
        const content = body?.variables?.input?.content?.text;
        if (uId) {
          window.context_bridge.send("reply-customer-message", {
            messageId: uId,
            sendTarget: "tgc5",
            content,
          });
          window.postMessage({ type: "delete-message", messageId: uId });
        }
      } else if (method == "post" && url.includes(targetUrl6)) {
        // console.log('arg======',args)
        mypvId = args[1]?.config?.searchURLParams?.__pvId;
        if (mypvId) {
          //  将pvId发送到preload
          window.postMessage({ type: "pvId", pvId: mypvId });
        }
      } else if (method == "post" && url.includes(targetUrl7)) {
        // console.log('fetch===========', args)
        const body = JSON.parse(args[1]?.body || "{}");

        const res = await _fetch(...args);
        clone = res.clone();
        const { data } = await clone.json();
        // console.log('res===========', data)
        if (data?.result?.dataList) {
          const orderList = data?.result?.dataList.map((item) => {
            return {
              userId: body?.variables?.input?.buyerId,
              orderId: item?.mainOrderId,
              orderName: item?.subOrders[0]?.itemTitle,
              orderStatus: item?.subOrders[0]?.refundStatus || item?.subOrders[0]?.subOrderStatus,
              time: new Date(item?.subOrders[0]?.gmtCreate.replace(/\//g, "-")).getTime(),
            };
          });
          // console.log('orderList===========', orderList)

          window.postMessage({ type: "order-list", data: orderList });
        }
      }
    } catch (error) {
      console.error("fetch 拦截器出错:", error);

      // 出错时仍然返回原始请求，确保不影响正常功能
      return _fetch(...args);
    } finally {
      clone = null;
      try {
        return _fetch(...args);
      } catch (error) {
        console.error("finally 块中的 fetch 请求失败:", error);
        return _fetch(...args);
      }
    }
  };
  window.addEventListener("message", (e) => {
    if (e.data.type == "send-message") {
      console.log("e.send-message", e.data.data);
      const { content, messageId, covid } = e.data.data;
      const time = Date.now();
      fetch(
        `https://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/SendMessage?operationName=SendMessage&operationType=mutation&__pvId=${mypvId}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query:
              "\n    mutation SendMessage($input: IMSendMessageInput!) {\n  sendMessage(input: $input) {\n    ... on IMSendMessageSuccessPayload {\n      isRejected\n      gmtCreate\n      messageId\n      sequence\n    }\n    ... on IMSendMessageRejectedPayload {\n      isRejected\n      rejectedReason {\n        content {\n          ... on IMRiskCheckContent {\n            details {\n              keywords\n              level\n              remark\n            }\n          }\n          ... on IMBizRuleCheckContent {\n            level\n            remark\n          }\n        }\n        type\n      }\n    }\n  }\n}\n    ",
            variables: {
              input: {
                id: time,
                contentType: "PLAIN_TEXT",
                content: {
                  text: content,
                },
                header: {
                  conversationId: `ocs_${covid}_c2m-TB-MZ`, //GC  MZ
                  version: "1.0",
                  props: {
                    onlineTouchId: messageId,
                    msgId: time,
                  },
                },
                ignoreNormalRisk: true,
              },
            },
            operationName: "SendMessage",
          }),
        },
      )
        .then((res) => res.json())
        .then((res) => {
          if (res.errors) {
            fetch(
              `https://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/SendMessage?operationName=SendMessage&operationType=mutation&__pvId=${mypvId}`,
              {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  query:
                    "\n    mutation SendMessage($input: IMSendMessageInput!) {\n  sendMessage(input: $input) {\n    ... on IMSendMessageSuccessPayload {\n      isRejected\n      gmtCreate\n      messageId\n      sequence\n    }\n    ... on IMSendMessageRejectedPayload {\n      isRejected\n      rejectedReason {\n        content {\n          ... on IMRiskCheckContent {\n            details {\n              keywords\n              level\n              remark\n            }\n          }\n          ... on IMBizRuleCheckContent {\n            level\n            remark\n          }\n        }\n        type\n      }\n    }\n  }\n}\n    ",
                  variables: {
                    input: {
                      id: time,
                      contentType: "PLAIN_TEXT",
                      content: {
                        text: content,
                      },
                      header: {
                        conversationId: `ocs_${covid}_c2m-TB-GC`, //GC  MZ
                        version: "1.0",
                        props: {
                          onlineTouchId: messageId,
                          msgId: time,
                        },
                      },
                      ignoreNormalRisk: true,
                    },
                  },
                  operationName: "SendMessage",
                }),
              },
            );
          }
        });
    }
  });
};
// 执行HOOK_CODE
webFrame.executeJavaScriptInIsolatedWorld(0, [
  {
    code: `(${HOOK_CODE})();`,
  },
]);

//  预留
//  获取商品
safeIpcOn("get-goods-detail-by-id", (event, args) => {
  console.log("根据商品id获取商品详情", args);
});

//  获取所有商品
safeIpcOn("get-all-goods-detail", (event, args) => {
  console.log("获取所有商品详情", args);
});

window.addEventListener("message", (event) => {
  const { type, data, pvId } = event.data || {};
  console.log("type============", type);
  if (!type) return;

  if (type === "delete-message") {
    userMap.delete(data?.messageId);
    sleepMsg.set(data?.messageId, true);
    setTimeout(() => {
      sleepMsg.delete(data?.messageId);
    }, 1500);
    return;
  }

  if (type === "pvId") {
    that_pvId = pvId;
    minToTime(that_pvId);
    return;
  }
  if (event.data && event.data.type === "WS_STATE_CHANGE") {
    wsConnectState = event.data.state;
  }

  if (type === "order-list") {
    if (!Array.isArray(data) || data.length === 0) return;

    const newOrder = data[0];

    // 查找相同 userId
    const index = orderList.findIndex((a) => a.userId === newOrder.userId);

    if (index !== -1) {
      // 更新旧数据
      orderList[index] = newOrder;
    } else {
      // 插入新数据
      orderList.push(newOrder);
    }

    // 保留时间最大的一条（不改变引用）
    orderList.sort((a, b) => b.time - a.time);
    //  可能需要写一个防抖

    ipcRenderer.send("get-customer-message-list", [orderList[0]]);

    orderList.splice(1); // 删除除第一条之外的所有项
  }
});
//  每 5s 递归获取数据  自调用
const minToTime = (pvId) => {
  setTimeout(() => {
    // console.log('递归获取数据 ', pvId)

    try {
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0); // 设置 UTC 0 点
      const end = new Date();
      end.setUTCHours(23, 59, 59, 999); // 设置 UTC 23:59:59.999
      start.toISOString();
      end.toISOString();
      fetch(
        `https://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/OnlineTouches?operationName=OnlineTouches&operationType=query&__pvId=${pvId || that_pvId}&__bundle=com.xixikf.c2mbc.im.desk.extension`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            operationName: "OnlineTouches",
            query:
              "\n    query OnlineTouches($input: IMQueryOnlineTouchInput) {\n  onlineTouches(input: $input) {\n    list {\n      ...OnlineToucheFragment\n    }\n    page {\n      current\n      pageSize\n      total\n    }\n  }\n}\n    \n    fragment OnlineToucheFragment on IMOnlineTouch {\n  id\n  isServiceNoteSaved\n  isTransferred\n  unreadCount\n  latestMessage\n  assignType\n  assignedTime\n  noReplyStartTime\n  closeReason\n  closeTime\n  messageBeginSequence\n  messageEndSequence\n  onlineTouchDuration\n  state\n  flagId\n  remark\n  onlineTouchSummary\n  associatedWorkState\n  groupKey\n  isBeManaged\n  manageType\n  isKept\n  todoContent {\n    normalCnt\n    overdueGoingCnt\n    overdueCnt\n  }\n  type\n  touchConfig {\n    enableMessageReading\n    enableServicerRevokeMessage\n    enableMessageQuote\n  }\n  tags {\n    description\n    iconUrl\n    label\n    type\n    key\n    level\n    order\n  }\n  conversation {\n    avatar\n    id\n    name @supportmask\n    participants {\n      id\n      avatar\n      name @supportmask\n      type\n      latestReadSequence\n    }\n  }\n  props\n  touchManagedTime\n  isBeMuted\n  mutedReason\n}\n    ",
            variables: {
              input: {
                types: ["ONLINE"],
                state: "ASSIGNED",
                gmtCreateRange: {
                  start, //    "start": "2026-05-17T16:00:00.000Z",
                  end, // "end": "2026-05-25T15:59:59.999Z"
                },
                pageInput: {
                  current: 1,
                  pageSize: 20,
                },
              },
            },
          }),
        },
      )
        .then((res) => res.json())
        .then((res) => {
          if (res?.errors) {
            ipcRenderer.send("account-login-expired"); //登录过期
            return;
          }
          console.log(" 获取数据=====> ", res);
          const {
            data: {
              onlineTouches: { list },
            },
          } = res;

          list.forEach((item) => {
            try {
              if (
                (item.latestMessage.header.sender &&
                  item.latestMessage.header.sender.type &&
                  item.latestMessage.header.sender.type == "CUSTOMER") ||
                (item.latestMessage.header.sender &&
                  item.latestMessage.header.sender.type &&
                  item.latestMessage.header.sender.type == "CHATBOT")
              ) {
                // 如果是机器人 与 用户信息
                let message = {};
                const latestMessage = item.latestMessage;
                const {
                  header: { props },
                } = latestMessage;
                message.content = latestMessage?.content?.text || ""; // 信息内容
                message.timeout = Math.floor((props.timestamp + 30000) / 1000); // 信息超时时间
                message.api = true; // 接口中获取的数据
                message.isTimeout = props.timestamp + 30000 < Date.now(); // 信息是否超时
                message.messageId = item.id; // 信息id
                // userNick
                message.username = item.props.userNick;
                message.covid = latestMessage?.header?.sender?.id;
                console.log("接口=======", message);
                if (userMap.has(item.id)) {
                  const targetUser = userMap.get(item.id);
                  if (targetUser?.content != message?.content) {
                    userMap.set(item.id, message);
                    message.type = "code";
                  }
                } else {
                  userMap.set(item.id, message);
                  message.type = "code";
                }
                if (!sleepMsg.has(message.messageId))
                  ipcRenderer.send("get-customer-message-list", [message]);
              }
            } catch (err) {
              console.log("err", err);
              // 跳过当前执行下一次
            }
          });
        })
        .catch((err) => {
          console.log("接口补偿错误err==============", err);
        });
    } catch (error) {
    } finally {
      minToTime(pvId);
    }
  }, 5000);
};
// 工具函数 提取CCOMASK内容
function extractContentFromCCOMASK(ccomaskString) {
  try {
    // 提取 CCOMASK 后面的 JSON 部分
    const jsonString = ccomaskString.replace(/^.*?CCOMASK/, "").trim();
    // 解析 JSON
    const ccomaskData = JSON.parse(jsonString);
    // 提取 content 字段
    return ccomaskData.content;
  } catch (error) {
    console.error("解析 CCOMASK 失败:", error);
    return "游客"; // 解析失败时返回原字符串
  }
}
// 接收获取cookie
safeIpcOn("get-shop-cookie", (_, cookieStr) => {
  cookie = cookieArrayToHeaderString(cookieStr);
});
// 工具函数 将cookie数组转换为header字符串
function cookieArrayToHeaderString(cookieArray) {
  return cookieArray.map((c) => `${c.name}=${c.value}`).join("; ");
}

// 获取用户历史记录
safeIpcOn("get-shop-user", gethistoryMessage);
// 获取用户历史记录
async function gethistoryMessage(event, args) {
  console.log("ai获取用户历史聊天记录 传递参数", args);
  // 用户是否正在操作
  // const editdom = document.querySelector(`#xixi-editor-${args.messageId}`)
  const editdom = document.querySelector(
    "[data-c-l-i='com.xixikf.imdesk.IMDeskApp/im-touch-chat-input-box']",
  );
  // console.log('editdom==============', editdom)
  const flag = (windowHasFocus && isUserOperating) || (editdom && editdom.textContent);
  if (flag) {
    ipcRenderer.send(
      "get-shop-isuser-status",
      // 输入框中有信息未发送
      {
        hasContent: flag,
      },
    );
    return;
  }
  ipcRenderer.send(
    "get-shop-isuser-status",
    {
      hasContent: flag,
    },
    //  用户正在操作输入框中有内容
  );
  let newdata = { ...args, history: [] };
  // let history = []
  // 点击选择用户
  await gotoUser(args);
  await delay(500);
  const messages = await getUrlUeserHistoryMessage(args.messageId);

  if (!messages) return; // 没有获取到信息

  const result = lastContinuousCustomerBlock(messages); // 处理最后一段信息
  if (!result || result.length === 0) return;

  let lastGoodInfo = null;
  let lastOrderInfo = null;

  // 转换历史记录
  let history = result.map((item) => {
    const base = {
      messageId: args?.messageId,
      username: args?.username,
      role: "user",
      goodId: "",
      orderId: "",
      orderName: "",
      orderStatus: "",
      goodName: "",
      userId: item?.header?.sender?.id || "",
    };

    const type = item?.contentType;
    const code = item?.content?.data?.code;
    const data = item?.content?.data;
    const bizInfo = data?.bizInfo || {};
    const titleContent = bizInfo?.title?.content || item?.content?.text || "";

    if (type === "CARD") {
      switch (code) {
        case "order":
          lastOrderInfo = {
            orderStatus: bizInfo?.status || "",
            orderId: data?.data?.orderId || "",
            orderName: titleContent,
          };
          return { ...base, ...lastOrderInfo, content: titleContent };

        case "item":
          lastGoodInfo = {
            goodId: data?.basicInfo?.title?.copyContent || "",
            goodName: titleContent,
          };
          return { ...base, ...lastGoodInfo, content: titleContent };

        default:
          return { ...base, content: titleContent };
      }
    }

    if (type === "IMAGE" || type === "VIDEO") {
      return {
        ...base,
        content: `[用户发送${type === "IMAGE" ? "图片" : "视频"}]`,
      };
    }

    return { ...base, content: item?.content?.text || "" };
  });

  // 若存在商品或订单信息，则批量补充
  if (lastGoodInfo) {
    history = history.map((h) => ({ ...h, ...lastGoodInfo })); // 用户发送商品
  }
  if (lastOrderInfo) {
    history = history.map((h) => ({ ...h, ...lastOrderInfo })); // 用发送订单
  }

  // 若仍无订单信息，则使用全局 orderList[0] 填充
  const hasOrder = history.some((h) => h.orderId); // 重排订单
  if (
    !hasOrder &&
    orderList.length > 0 &&
    history.some((item) => item.userId === orderList[0].userId)
  ) {
    history = history.map((h) => ({ ...h, ...orderList[0] }));
  }

  console.log("处理完成history", history);
  newdata.history = history;

  ipcRenderer.send("get-historical-records", JSON.stringify(newdata));
}

//  获取用户历史记录中最后一个连续的 CUSTOMER
function lastContinuousCustomerBlock(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return [];

  // 找到最后一个 CUSTOMER 的索引
  let end = -1;
  for (let j = messages.length - 1; j >= 0; j--) {
    if (messages[j]?.header?.sender?.type === "CUSTOMER") {
      end = j;
      break;
    }
  }
  if (end === -1) return [];

  // 从该索引往前找连续的 CUSTOMER 段
  let start = end;
  for (let k = end - 1; k >= 0; k--) {
    const t = messages[k]?.header?.sender?.type;
    if (t !== "CUSTOMER") break;
    start = k;
  }
  // slice 是纯函数，不影响原数组
  return messages.slice(start, end + 1);
}

// 接口请求 获取用户历史记录
const getUrlUeserHistoryMessage = async (onlineTouchId) => {
  return new Promise((resolve, reject) => {
    // console.log('messageId==============', onlineTouchId, )   // 用户消息id
    // console.log('that_pvId==============', that_pvId, )   // key
    fetch(
      `https://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/MessagesByOnlineTouchId?operationName=MessagesByOnlineTouchId&operationType=query&__pvId=${that_pvId}`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query:
            "\n    query MessagesByOnlineTouchId($input: IMQueryMessageByOnlineTouchIdInput!) {\n  messagesByOnlineTouchId(input: $input) {\n    messages\n  }\n}\n    ",
          variables: {
            input: {
              onlineTouchId,
              calculateReceiversHaveRead: true,
            },
          },
          operationName: "MessagesByOnlineTouchId",
        }),
      },
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.data?.messagesByOnlineTouchId) {
          resolve(res.data.messagesByOnlineTouchId.messages);
        } else {
          resolve(null);
        }
      })
      .catch((err) => {
        console.log("接口报错信息", err);
      });
  });
};

// 监听鼠标移动、按下、释放事件
document.addEventListener("mousemove", () => {
  if (windowHasFocus && shopBotStatus == 1) {
    lastMouseActivity = Date.now();
    isUserOperating = true;
    // console.log('鼠标移动 - 用户正在操作')
  }
});

document.addEventListener("mousedown", () => {
  if (windowHasFocus && shopBotStatus == 1) {
    lastMouseActivity = Date.now();
    isUserOperating = true;
    // console.log('鼠标按下 - 用户正在操作')
  }
});

document.addEventListener("mouseup", () => {
  if (windowHasFocus && shopBotStatus == 1) {
    lastMouseActivity = Date.now();
    isUserOperating = true;
    // console.log('鼠标释放 - 用户正在操作')
  }
});
// 窗口聚焦、失去焦点事件
window.addEventListener("focus", () => {
  windowHasFocus = true;
  startUserActivityTimer();
});
window.addEventListener("blur", () => {
  windowHasFocus = false;
  isUserOperating = false;
  // 页面失去焦点时删除定时器
  stopUserActivityTimer();
});

// 启动用户活动检查定时器
function startUserActivityTimer() {
  // 如果定时器已经存在，先清除
  if (userActivityTimer) {
    // console.log('清除已存在的用户活动检查定时器')
    clearInterval(userActivityTimer);
  }

  // console.log('启动用户活动检查定时器')
  // 启动新的定时器
  userActivityTimer = setInterval(() => {
    const timeSinceLastActivity = Date.now() - lastMouseActivity;
    if (timeSinceLastActivity > USER_ACTIVITY_TIMEOUT) {
      if (isUserOperating) {
        // console.log(`用户停止操作 - 距离上次活动: ${timeSinceLastActivity}ms`)
        isUserOperating = false;
      }
    }
  }, 1000);
}

// 停止用户活动检查定时器
function stopUserActivityTimer() {
  if (userActivityTimer) {
    // console.log('停止用户活动检查定时器')
    clearInterval(userActivityTimer);
    userActivityTimer = null;
  }
}
// 延迟函数
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

safeIpcOn("currnt-page", (_, key) => {
  is_key = key;
  if (is_key) {
    ipcRenderer.send("get-currnt-page", false);
  }
});

// 心跳请求处理 - 返回当前店铺状态
safeIpcOn("request-heartbeat", async () => {
  // 淘工厂的状态通过 currentShopStatus 变量获取
  let res = null;
  const dom = document.querySelector(".xixikf-im-app_components-seats-management-icon_badge");
  let status = "";
  try {
    res = await fetch(
      `https://c2mbc.api.xixikf.cn/xixi-scheduler/graphql/1.0/InitSeatStatus?operationName=InitSeatStatus&operationType=query&__pvId=${that_pvId}&__bundle=com.xixikf.support`,
      {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          query:
            "\n    query InitSeatStatus($channelType: SDChannelType!) {\n  currentStatus(input: {channelType: $channelType}) {\n    statusId\n    subStatusId\n    autoClose\n    countdownTime\n    countdownStart\n    isZZS\n    statusChangeTime\n    workChannel\n  }\n  statusList(input: {channelType: $channelType}) {\n    ...SeatStatusFragment\n  }\n}\n    \n    fragment SeatStatusFragment on SDStatusPayload {\n  channelType\n  parentStatusId\n  statusCode\n  statusDesc\n  statusId\n  statusName\n  subStatusList {\n    parentStatusId\n    statusCode\n    statusDesc\n    statusId\n    statusName\n    visible\n  }\n  visible\n}\n    ",
          variables: {
            channelType: "ONLINE",
          },
          operationName: "InitSeatStatus",
        }),
      },
    ).then((res) => res.json());
    if (res.data) {
      if (res.data.currentStatus.statusId == "2") {
        status = "在线";
      } else if (res.data.currentStatus.statusId == "1") {
        status = "离线";
      } else {
        status = "忙碌";
      }
    }
  } catch (error) {
    // 降级用dom
    if (dom) {
      const clalist = dom.getAttribute("class");
      if (clalist.includes("xixikf-im-app_components-seats-management-badge_seats-status-1")) {
        status = "离线";
      } else if (
        clalist.includes("xixikf-im-app_components-seats-management-badge_seats-status-2")
      ) {
        status = "在线";
      } else {
        status = "忙碌";
      }
    }
  } finally {
    // 获取 API 健康状态
    const apiHealthy = apiHealthMonitor.isHealthy();
    const domExists = dom ? true : false;
    // 发送健康检测响应
    ipcRenderer.send("heartbeat-response", {
      status,
      apiHealthy,
      webSocketState: wsConnectState,
      domExists: domExists,
    });
  }
});

safeIpcOn("change-shop-status", (_, status) => {
  console.log("改变店铺状态", status);
  const isOnline = status === "online";

  // 统一请求函数
  const gqlRequest = (url, query, variables, operationName) => {
    return fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ query, variables, operationName }),
    }).then((res) => res.json());
  };

  // GQL URL 拼接器
  const makeUrl = (name) =>
    `https://c2mbc.api.xixikf.cn/xixi-scheduler/graphql/1.0/${name}?operationName=${name}&operationType=mutation&__pvId=${that_pvId}&__bundle=com.xixikf.support`;

  const changeStatusMutation = `
    mutation ChangeStatus($input: SDChangeStatusInput!) {
      changeStatus(input: $input) {
        statusId
        subStatusId
        statusChangeTime
      }
    }
  `;

  if (isOnline) {
    // 第一个请求：上班
    const workOnlineQuery = `
      mutation WorkOnlineV2($input: SDWorkOnlineInput!) {
        workOnlineV2(input: $input) {
          canWork
          preConditions {
            code
            isPreconditionMet
          }
        }
      }
    `;

    gqlRequest(
      makeUrl("WorkOnlineV2"),
      workOnlineQuery,
      {
        input: {
          channelType: "ONLINE",
          workbenchType: "XIXIKF",
          isTrain: false,
        },
      },
      "WorkOnlineV2",
    ).then((res) => {
      console.log("上班状态改变店铺状态成功", res);

      // 第二个请求：设置在线状态
      return gqlRequest(
        makeUrl("ChangeStatus"),
        changeStatusMutation,
        {
          input: {
            channelType: "ONLINE",
            targetStatusId: "2",
            targetSubStatusId: "2",
          },
        },
        "ChangeStatus",
      ).then((res) => {
        console.log("接线结果==========", res);
        if (res?.data?.changeStatus?.statusId == "2") {
          console.log("接线成功");
          ipcRenderer.send("shop-status-change", {
            status: "接线",
          });
        }
      });
    });
  } else {
    // 下班：直接改状态
    gqlRequest(
      makeUrl("ChangeStatus"),
      changeStatusMutation,
      {
        input: {
          channelType: "ONLINE",
          targetStatusId: "1",
          targetSubStatusId: "1",
        },
      },
      "ChangeStatus",
    ).then((res) => {
      console.log("离线结果==========", res);

      if (res?.data?.changeStatus?.statusId == "1") {
        console.log("离线成功");
        ipcRenderer.send("shop-status-change", {
          status: "离线",
        });
      }
    });
  }
});

const loopDom = () => {
  setTimeout(() => {
    const list = document.body.querySelectorAll(
      ".xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-tao-factory-online-touch-explorer-servicing-touch-list_list [data-id]",
    );
    // xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-components-online-touch-timer_container
    // console.log('list========>', list)
    const sendlist = [];
    list.forEach((node) => {
      const timer =
        node.querySelector(
          ".xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-components-online-touch-timer-for-supplier_container",
        ) ||
        node.querySelector(
          ".xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-components-online-touch-timer_container",
        );
      // xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-components-online-touch-timer_container
      // console.log('timer========>', timer)
      if (timer) {
        const timerText = timer.textContent;
        // console.log('timerText========>', timerText)
        if (timerText) {
          const usernameDom = node.querySelector(
            ".xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-tao-factory-online-touch-explorer-member-card_username",
          );
          const username = usernameDom.textContent;
          const messageId = node.getAttribute("data-id");
          const contentDom = node.querySelector(
            ".xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-tao-factory-online-touch-explorer-member-card_message",
          );
          const content = contentDom.textContent;
          let timeout = Math.floor(Date.now() / 1000);
          if (/^\d{2}:\d{2}$/.test(timerText)) {
            const sec = Number(timerText.split(":")[1]) || 0;
            const result = 30 - sec;
            timeout = Math.floor(Date.now() / 1000) + result;
          }
          const img = node.querySelector("img");
          let covid = null;
          if (img) {
            const match = img.src.split("userId=");
            if (match) covid = match[1];
          }

          const obj = {
            username: username,
            messageId,
            userId: messageId,
            content,
            timeout,
            covid,
            // type: 'code'
          };
          console.log("sendMessage========>", obj);
          if (userMap.has(messageId)) {
            const targetUser = userMap.get(messageId);
            if (targetUser?.content != obj.content) {
              userMap.set(messageId, obj);
              obj.type = "code";
            }
          } else {
            userMap.set(messageId, obj);
            obj.type = "code";
          }
          if (!sleepMsg.has(messageId)) sendlist.push(obj);
        }
      }
    });

    if (sendlist.length) ipcRenderer.send("get-customer-message-list", sendlist);
    //

    loopDom();
  }, 5000);
};

//  发送粘贴
ipcRenderer.on("paste-to-shop", async (event, text) => {
  const input = document.querySelector('[aria-label="在线会话输入框"]');
  console.log("input=================", input);
  if (!input)
    // 未找到 #replyTextarea 元素
    return;
  // input.value = text
  input.innerHTML = text;
  const inputEvent = new InputEvent("input", {
    bubbles: true,
    inputType: "insertText",
    data: text,
  });
  input.dispatchEvent(inputEvent);
  // 触发 input 事件（如果页面有监听 input 事件做实时处理）

  await delay(300);
  //  模拟回车键（keydown + keyup 可选）
  const enterEvent = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  });
  input.dispatchEvent(enterEvent);

  // 如果提交后需要清除焦点或其他操作，可在此添加
  // input.blur(); // 例如失焦
});

//  将base64 转为 Blob
const base64ToBlob = (base64) => {
  const [header, data] = base64.split(",");
  const mime = header.match(/:(.*?);/)[1];

  const binary = atob(data);
  const arr = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }

  return new Blob([arr], { type: mime });
};

const imageUrlToBlob = async (imageUrl) => {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`下载图片失败: ${response.status}`);
  }
  return response.blob();
};

// 发送图片
const sendImage = async (base64, messageId, covid, imageUrl) => {
  const blob = imageUrl ? await imageUrlToBlob(imageUrl) : base64ToBlob(base64);
  const res = await fetch(
    `
https://c2mbc.api.xixikf.cn/xixi-base/graphql/1.0/Configs?operationName=Configs&operationType=query&__pvId=${that_pvId}&__bundle=com.xixikf.imdesk`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query:
          "\n    query Configs {\n  configs {\n    ossInfo {\n      accessId\n      policy\n      signature\n      dir\n      endpoint\n      cdn\n    }\n  }\n}\n    ",
        operationName: "Configs",
      }),
    },
  ).then((r) => r.json());

  if (res.data.configs.ossInfo) {
    // base64

    const { accessId, policy, signature, dir } = res.data.configs.ossInfo;
    const formData = new FormData();
    formData.append("OSSAccessKeyId", accessId);
    formData.append("policy", policy);
    formData.append("Signature", signature);
    formData.append("key", "consult/img.png");

    // 必须带文件名  默认img.png
    formData.append("file", blob, "img.png");
    fetch(`https://xspace-img-cn.oss-cn-shanghai.aliyuncs.com/`, {
      method: "POST",
      credentials: "include",
      // headers: {
      //   'Content-Type':
      //     'multipart/form-data; boundary=----WebKitFormBoundaryfpWaqV2ZSf6yNyyc'
      // },
      body: formData,
    }).then((r) => {
      fetch(
        `
https://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/SendMessage?operationName=SendMessage&operationType=mutation&__pvId=${that_pvId}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            query:
              "\n    mutation SendMessage($input: IMSendMessageInput!) {\n  sendMessage(input: $input) {\n    ... on IMSendMessageSuccessPayload {\n      isRejected\n      gmtCreate\n      messageId\n      sequence\n    }\n    ... on IMSendMessageRejectedPayload {\n      isRejected\n      rejectedReason {\n        content {\n          ... on IMRiskCheckContent {\n            details {\n              keywords\n              level\n              remark\n            }\n          }\n          ... on IMBizRuleCheckContent {\n            level\n            remark\n          }\n        }\n        type\n      }\n    }\n  }\n}\n    ",
            variables: {
              input: {
                id: Date.now(),
                contentType: "RICH_TEXT",
                content: {
                  text: '<div class="xixi-editor-img-wrap"><span class="xixi-editor-img-wrap-filler"></span><div class="xixi-editor-img-content-wrap" contenteditable="false"><img class="xixi-editor-img-tag-49ba59abbe56e057" src="//xspace-img-cn.alicdn.com/consult/img.png?getAvatar=1"></div><span class="xixi-editor-img-wrap-filler"></span></div>',
                },
                header: {
                  conversationId: `ocs_${covid}_c2m-TB-GC`,
                  version: "1.0",
                  props: {
                    onlineTouchId: messageId,
                    msgId: Date.now(),
                  },
                },
                ignoreNormalRisk: true,
              },
            },
            operationName: "SendMessage",
          }),
        },
      )
        .then((r) => r.json())
        .then((res) => {
          if (res.errors) {
            fetch(
              `
https://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/SendMessage?operationName=SendMessage&operationType=mutation&__pvId=${that_pvId}`,
              {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json; charset=utf-8",
                },
                body: JSON.stringify({
                  query:
                    "\n    mutation SendMessage($input: IMSendMessageInput!) {\n  sendMessage(input: $input) {\n    ... on IMSendMessageSuccessPayload {\n      isRejected\n      gmtCreate\n      messageId\n      sequence\n    }\n    ... on IMSendMessageRejectedPayload {\n      isRejected\n      rejectedReason {\n        content {\n          ... on IMRiskCheckContent {\n            details {\n              keywords\n              level\n              remark\n            }\n          }\n          ... on IMBizRuleCheckContent {\n            level\n            remark\n          }\n        }\n        type\n      }\n    }\n  }\n}\n    ",
                  variables: {
                    input: {
                      id: Date.now(),
                      contentType: "RICH_TEXT",
                      content: {
                        text: '<div class="xixi-editor-img-wrap"><span class="xixi-editor-img-wrap-filler"></span><div class="xixi-editor-img-content-wrap" contenteditable="false"><img class="xixi-editor-img-tag-49ba59abbe56e057" src="//xspace-img-cn.alicdn.com/consult/img.png?getAvatar=1"></div><span class="xixi-editor-img-wrap-filler"></span></div>',
                      },
                      header: {
                        conversationId: `ocs_${covid}_c2m-TB-MZ`,
                        version: "1.0",
                        props: {
                          onlineTouchId: messageId,
                          msgId: Date.now(),
                        },
                      },
                      ignoreNormalRisk: true,
                    },
                  },
                  operationName: "SendMessage",
                }),
              },
            );
          }
        });
    });
  }
};

//   收到店铺心跳
ipcRenderer.on("heartbeat", () => {
  ipcRenderer.send("web-heartbeat-ping"); // 返回店铺心跳
});
