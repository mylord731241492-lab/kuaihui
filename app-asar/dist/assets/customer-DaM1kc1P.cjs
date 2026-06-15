const { ipcRenderer, contextBridge, webFrame } = require("electron");

const shouldDisablePreloadConsole = process.argv.includes("--kh-disable-preload-console");

if (shouldDisablePreloadConsole) {
  const noop = () => {};
  [
    "log",
    "info",
    "warn",
    "error",
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

function safeIpcOn(channel, handler) {
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, handler);
}

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

// 统一上报抖店 preload 的全局错误，便于在主进程日志里按店铺定位。
function reportGlobalPreloadError(type, errorLike) {
  const queryInfo = getQueryParams();

  ipcRenderer.send("write-preload-error-log", {
    shopName: queryInfo.shopName || "未知店铺",
    platform: "doudian",
    errorMessage: `${type}: ${getReadableErrorMessage(errorLike)}`,
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
  });
}

let visibilitychange = true; // 定义参数 窗口是否可见
// let unReplyStopped = false
let isLowVersion = false; // 是否为低版本
let _key = null; //  页面隐藏状态，true=隐藏，false=可见

const HEARTBEAT_INTERVAL = 1000 * 60 * 60 * Number((Math.random() * 1 + 2).toFixed(2)); // 原始变量：刷新间隔时间   隐式转转换number
// const HEARTBEAT_INTERVAL = 10000
let currentInterval = HEARTBEAT_INTERVAL; // 临时变量：当前使用的间隔时间
let hearTimer = null;
let shopInfo = null;
let shopBotStatus = 0;

const timeReg = />(\d+\s*(?:小时|分钟|分|秒))+<\/div>/;
// 添加用户操作状态跟踪变量
let isUserOperating = false; // 用户是否正在操作
let lastMouseActivity = 0; // 最后一次鼠标活动时间
let lastKeyboardActivity = 0; // 最后一次键盘活动时间
let windowHasFocus = false; // 窗口是否有焦点（改为false，只有真正获得焦点才设为true）
let userActivityTimer = null; // 用户活动检查定时器
const USER_ACTIVITY_TIMEOUT = 3000; // 3秒内有鼠标/键盘活动认为用户在操作

let sendInsert = false,
  linkonInsert = false,
  selectuserInsert = false;

// ===== 测试：全局拦截 focus/blur =====
// 1. 重写 focus - 直接返回，不调用原始方法
const _originalFocus = HTMLElement.prototype.focus;
HTMLElement.prototype.focus = function (options) {
  // 如果不可见且需要拦截，直接返回，什么都不做
  // if (!_key && blockAutoFocus) {
  // console.log(
  //   '🚫 [阻止focus调用] 方法未执行',
  //   this.tagName,
  //   this.getAttribute('data-qa-id')
  // )
  // return undefined // 直接返回，不调用 _originalFocus
  // }
  // 否则正常执行
  return _originalFocus.call(this, options);
};

// 2. 重写 blur - 直接返回，不调用原始方法
const _originalBlur = HTMLElement.prototype.blur;
HTMLElement.prototype.blur = function () {
  return _originalBlur.call(this);
};
let replyMessage = null;
let replyMessagekey = null;
// console.log('✅ 全局焦点拦截已启动')
const keylock = new Map();

// 初始化 API 监控
// apiHealthMonitor.init()

// ============ WebSocket 状态追踪 ============
// let wsConnectState = -1 // -1=未知, 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
const pending = new Map();

function waitSendSuccess(messageId, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const task = {
      resolve,
      reject,
    };

    if (!pending.has(messageId)) {
      pending.set(messageId, []);
    }

    pending.get(messageId).push(task);

    setTimeout(() => {
      const list = pending.get(messageId);

      if (!list) return;

      const index = list.indexOf(task);

      if (index !== -1) {
        list.splice(index, 1);

        reject(new Error(`wait timeout: ${messageId}`));
      }

      if (list.length === 0) {
        pending.delete(messageId);
      }
    }, timeout);
  });
}
// 监听 WebSocket 状态变化（从注入脚本发送）
window.addEventListener("message", async (event) => {
  if (event.data && event.data.type === "shop-info") {
    console.log("主窗口收到店铺信息：", event.data.data);
    shopInfo = event.data.data; // 获取店铺信息
  } else if (event.data && event.data.type === "productDetail") {
    console.log("主窗口收到商品详情：", event.data.data);
    // 这里可以关闭 newWindow 或做后续处理
  } else if (event.data && event.data.type === "WS_STATE_CHANGE") {
    // wsConnectState = event.data.state
    wsConnectState = 1;
  } else if (event.data && event.data.type === "get-message") {
    let mydata = JSON.parse(event.data.data);

    if (!linkonInsert) linkonInsert = true;

    console.log("主窗口接收消息》》》》》》》", mydata);

    if (!/^\d+$/.test(mydata.messageId)) {
      mydata.messageId = mydata.userId;
    }

    if (mydata.type || mydata.senderRole == "1") {
      try {
        const dbdata = await getIndexedDBValue(mydata.userId, 500);

        if (dbdata) {
          const { value } = dbdata;
          mydata.username = value.name;
        } else {
          if (!isLowVersion) {
            try {
              const _res = await fetch(
                "https://pigeon.jinritemai.com/backstage/getuserinfo?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&FUSION=true&_v=1.0.1.1852&uids=" +
                  mydata.userId +
                  "&_ts=" +
                  Date.now(),
                {
                  mode: "cors",
                  credentials: "include",
                },
              ).then((_res) => _res.json());

              if (_res?.code == 0 && _res?.data) {
                mydata.username = _res?.data[0]?.screen_name;
                mydata.messageId = mydata.messageId;
              } else if (_res?.code == 11001) {
                isLowVersion = true;
                mydata.username = mydata.username ? mydata.username : "用户" + mydata.userId;
              }
            } catch (e) {
              console.log("获取用户名失败", e);
            }
          } else if (isLowVersion) {
            mydata.username = mydata.username ? mydata.username : "用户" + mydata.userId;
          }
        }
      } catch (e) {
        console.log("IndexedDB 获取失败", e);
      }

      // 只有开了AI才获取订单商品
      if (shopBotStatus == 1) {
        mydata.messageId = mydata.userId;

        mydata.content = mydata?.orderStatus
          ? "用户发送订单"
          : mydata?.goodId
            ? "用户发送商品"
            : mydata?.content;

        console.log("主窗口发送消息==========", mydata);

        mydata.shopMsgTotal = getMsgTotal() || 0;
      }

      console.log("最终发送到渲染进程的消息数据==========", mydata);

      mydata.source = "code";
      mydata.type = "code";

      if (mydata.content?.endsWith("接入")) {
        mydata.content = "用户接入";
      }

      switch (mydata.content) {
        case "[图片]":
          mydata.content = "用户发送了图片";
          break;

        case "[视频]":
          mydata.content = "用户发送了视频";
          break;
      }

      // 最终兜底发送
      try {
        ipcRenderer.send("get-customer-message-list", [mydata]);
      } catch (e) {
        console.log("ipc发送失败", e);
      }
    }
  } else if (event.data && event.data.type === "insert-sucesss") {
    switch (event.data.data.type) {
      case "sendmessage":
        sendInsert = event.data.data.bool;
        break;
      case "getmessage":
        linkonInsert = event.data.data.bool;
        break;
      case "selectuser":
        selectuserInsert = event.data.data.bool;
      default:
        break;
    }
    console.log(
      "主窗口插入状态==========",
      "sendInsert",
      sendInsert,
      "linkonInsert",
      linkonInsert,
      "selectuserInsert",
      selectuserInsert,
    );
  } else if (event.data.type === "send-success") {
    console.log("发送成功==========", event.data.data);
    const userId = event.data?.data?.userId;
    const userId2 = event.data?.data?.userId2;
    // 只处理 f() 正在等待的 messageId
    if (!userId && !userId2) return;

    const resolvePending = (id) => {
      const list = pending.get(id);

      if (!list?.length) return false;

      const task = list.shift();

      task.resolve(event.data.data);

      if (list.length === 0) {
        pending.delete(id);
      }

      return true;
    };

    resolvePending(userId) || resolvePending(userId2);
  }
});

// 节流函数
function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(
        () => {
          func.apply(this, args);
          lastExecTime = Date.now();
        },
        delay - (currentTime - lastExecTime),
      );
    }
  };
}

class GetSendMessage {
  constructor({ userId, username, content, timeout, avatar }) {
    this.userId = userId;
    this.messageId = userId;
    this.username = username;
    this.content = content;
    this.timeout = timeout;
    this.source = "dom";

    // this.type = this.getType()
    // this.shopMsgTotal = getMsgTotal()
  }

  static async create({ userId, username, content, timeout, avatar }) {
    if (!userId) {
      // console.log('未找到用户名对应的用户ID', username)
      userId = await getUserIdByUsername(avatar, username);
    }

    const instance = new GetSendMessage({
      userId,
      username,
      content,
      timeout: 0,
      avatar,
    });

    instance.timeout = instance.durationToMs(timeout);
    return instance;
  }

  // getType() {
  //   return 'code'
  //   // return linkonInsert ? 'code' : null
  // }

  durationToMs(timeout) {
    // console.log('timeout==========', timeout)
    if (!timeout) {
      return Math.floor(Date.now() / 1000) + 180;
    }

    if (typeof timeout === "number") {
      return timeout + 180;
    }

    let ms = 0;
    const d = timeout.match(/(\d+)\s*天/);
    const h = timeout.match(/(\d+)\s*小时/);
    const m = timeout.match(/(\d+)\s*(?:分钟|分)/);
    const s = timeout.match(/(\d+)\s*秒/);

    if (d) ms += +d[1] * 86400;
    if (h) ms += +h[1] * 3600;
    if (m) ms += +m[1] * 60;
    if (s) ms += +s[1];

    return Math.floor(Date.now() / 1000 - ms) + 180;
  }
}
class OrderByUserInfo {
  constructor(obj) {
    this.id = obj.messageId;
    this.convId = obj.convId || "";
    this.orderId = obj.orderId;
    this.ordersku = obj.ordersku || "";
    this.orderStatus = obj.orderStatus;
    this.orderInfo = obj.orderInfo || "";
    this.goodId = obj.goodId;
    this.goodName = obj.goodName || "";
    this.goodInfo = obj.goodInfo || "";
    this.sku = obj.sku || "";

    this.InfoTimerout = Date.now();
  }
}

contextBridge.exposeInMainWorld("context_bridge", {
  postMessage: (channel, data) => ipcRenderer.postMessage(channel, data),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, callback) => safeIpcOn(channel, callback),
  // 新增 a_bogus 生成方法
  getABogus: (url) => {
    if (window.byted_acrawler && window.byted_acrawler.sign) {
      return window.byted_acrawler.sign({ url });
    }
    return "";
  },
});

// 鼠标事件处理函数
const mouseActivityHandler = (eventType) => {
  if (windowHasFocus) {
    lastMouseActivity = Date.now();
    isUserOperating = true;
    // console.log(`鼠标${eventType} - 用户正在操作`)
  }
};

// 具体的鼠标事件处理函数
const mouseMoveHandler = throttle(() => mouseActivityHandler("移动"), 200); // 鼠标移动事件节流，200ms内最多触发一次
const mouseDownHandler = () => mouseActivityHandler("按下");
const mouseUpHandler = () => mouseActivityHandler("释放");
const clickHandler = () => mouseActivityHandler("点击");

// 添加鼠标事件监听器
function addMouseListeners() {
  // console.log('添加鼠标事件监听器')
  document.addEventListener("mousemove", mouseMoveHandler);
  document.addEventListener("mousedown", mouseDownHandler);
  document.addEventListener("mouseup", mouseUpHandler);
  document.addEventListener("click", clickHandler);
}

// 移除鼠标事件监听器
function removeMouseListeners() {
  // console.log('移除鼠标事件监听器')
  document.removeEventListener("mousemove", mouseMoveHandler);
  document.removeEventListener("mousedown", mouseDownHandler);
  document.removeEventListener("mouseup", mouseUpHandler);
  document.removeEventListener("click", clickHandler);
}

// 键盘事件处理函数
const keyboardActivityHandler = () => {
  if (windowHasFocus) {
    lastKeyboardActivity = Date.now();
    isUserOperating = true;
    // console.log('键盘活动 - 用户正在操作')
  }
};

// 添加键盘事件监听器
function addKeyboardListeners() {
  // console.log('添加键盘事件监听器')
  document.addEventListener("keydown", keyboardActivityHandler);
  document.addEventListener("keyup", keyboardActivityHandler);
  document.addEventListener("keypress", keyboardActivityHandler);
}

// 移除键盘事件监听器
function removeKeyboardListeners() {
  // console.log('移除键盘事件监听器')
  document.removeEventListener("keydown", keyboardActivityHandler);
  document.removeEventListener("keyup", keyboardActivityHandler);
  document.removeEventListener("keypress", keyboardActivityHandler);
}

// 焦点事件处理函数
const focusHandler = () => {
  console.log("获得焦点");
  windowHasFocus = true;
  startUserActivityTimer();
};

const blurHandler = () => {
  console.log("失去焦点 - 停止用户操作检测，清除定时器");
  windowHasFocus = false;
  isUserOperating = false;
  // 页面失去焦点时删除定时器
  stopUserActivityTimer();
};

// 添加焦点事件监听器
function addFocusListeners() {
  // console.log('添加焦点事件监听器')
  window.addEventListener("focus", focusHandler);
  window.addEventListener("blur", blurHandler);
}

// 移除焦点事件监听器
function removeFocusListeners() {
  // console.log('移除焦点事件监听器')
  window.removeEventListener("focus", focusHandler);
  window.removeEventListener("blur", blurHandler);
}

// 添加所有用户活动监听器
function addAllUserActivityListeners() {
  // console.log('添加所有用户活动监听器')
  addMouseListeners();
  addKeyboardListeners();
  addFocusListeners();
}

// 移除所有用户活动监听器
function removeAllUserActivityListeners() {
  // console.log('移除所有用户活动监听器')
  removeMouseListeners();
  removeKeyboardListeners();
  removeFocusListeners();
}

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
    const timeSinceLastMouseActivity = Date.now() - lastMouseActivity;
    const timeSinceLastKeyboardActivity = Date.now() - lastKeyboardActivity;
    // 取鼠标和键盘活动中最近的一次
    const timeSinceLastActivity = Math.min(
      timeSinceLastMouseActivity,
      timeSinceLastKeyboardActivity,
    );

    if (timeSinceLastActivity > USER_ACTIVITY_TIMEOUT) {
      if (isUserOperating) {
        // console.log(
        //   `用户停止操作 - 距离上次鼠标活动: ${timeSinceLastMouseActivity}ms, 距离上次键盘活动: ${timeSinceLastKeyboardActivity}ms`
        // )
        isUserOperating = false;
      }
    }
  }, 1000);
}

// 停止用户活动检查定时器
function stopUserActivityTimer() {
  if (userActivityTimer) {
    console.log("停止用户活动检查定时器");
    clearInterval(userActivityTimer);
    userActivityTimer = null;
  }
}

let logoInfo = {
  username: "",
  password: "",
  shopId: null,
};

const pickLogin = (v) => {
  if (typeof v !== "string") return "";
  v = v.trim();
  return v && v !== "null" && v !== "undefined" ? v : "";
};

safeIpcOn("get-shop-pwd", (_, args) => {
  if (!logoInfo.username) logoInfo.username = pickLogin(args?.userName);
  if (!logoInfo.password) logoInfo.password = pickLogin(args?.password);
});

async function refreshLogin() {
  for (const arg of process.argv) {
    if (arg.startsWith("--username")) {
      logoInfo.username = pickLogin(arg.slice("--username".length));
    } else if (arg.startsWith("--password")) {
      logoInfo.password = pickLogin(arg.slice("--password".length));
    }
  }
  if (logoInfo.username && logoInfo.password) return logoInfo;
  ipcRenderer.send("get-shop-pwd");
  await new Promise((r) => setTimeout(r, 500));
  return logoInfo;
}

// 监听店铺bot状态更新

// 监听链接跳转
window.addEventListener("popstate", () => {
  const url = window.location.href;
  if (url.includes("homepage")) {
    window.location.href = "https://im.jinritemai.com/pc_seller_v2/main/workspace";
  } else if (url.includes("error")) {
    console.log("页面错误");
    // 刷新
    window.location.reload();
  }
});

const oldRAF = window.requestAnimationFrame;

window.requestAnimationFrame = (cb) => {
  return oldRAF((time) => {
    setTimeout(() => cb(time), 32);
  });
};
// 页面加载完成
window.addEventListener("load", async () => {
  setTimeout(() => {
    const testdom = document.querySelector('[alt="测试小牛"]');
    console.log("testdom====", testdom);
    if (testdom) {
      testdom.addEventListener("click", async (e) => {
        console.log("点击头像");
        window.postMessage({
          type: "pull-message",
        });
      });
    }
  }, 5000);

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      const el = e.target.closest('[data-qa-id="qa-send-message-textarea"]');

      if (!el) return;
      const cls = (el.className || "").toString();

      const match = cls.match(/inputArea_([^\s]+)/);

      if (!match) return;
      const userId = match[1];
      const content = el.textContent;
      console.log("发送消息 dyDom1", userId, content);
      // 删除消息后
      const oldTimer = keylock.get(userId);
      if (oldTimer) {
        clearTimeout(oldTimer);
      }

      const timer = setTimeout(() => {
        keylock.delete(userId);
      }, 2000);

      keylock.set(userId, timer);
      ipcRenderer.send("reply-customer-message", {
        messageId: userId,
        userId,
        shopMsgTotal: getMsgTotal(),
        sendTarget: "dyDom1",
        content,
        platformType: "抖店",
      });
    },
    true,
  );

  const start1 = Date.now();
  const timer1 = setInterval(() => {
    //
    const modal = document.querySelector(".auxo-modal-wrap");
    const modal2 = document.querySelector(".auxo-modal-mask");

    if (modal && modal2) {
      console.log("modal 命中，已隐藏", modal);
      modal.style.display = "none";
      modal2.style.display = "none";
      clearInterval(timer1);
    }

    // 10 秒后自动停止检查
    if (Date.now() - start1 > 10_000) {
      clearInterval(timer1);
      console.log("10s 检查结束");
    }
  }, 200);
  const ModuleInfo = document.querySelector("#garfishModuleInfo");
  if (ModuleInfo) {
    const moduleInfo = JSON.parse(ModuleInfo.textContent);
    if (moduleInfo["app:@ecom-vmok/pigeon-im-pc"]) {
      if (moduleInfo["app:@ecom-vmok/pigeon-im-pc"].shared[0].assets.css.sync) {
        const r = getPreviousByPrefix(
          moduleInfo["app:@ecom-vmok/pigeon-im-pc"].shared[0].assets.css.sync,
          "pages/view_exams/index",
        );

        if (r) {
          ipcRenderer.send("get-page-load-js", r.split(".")[0]);
        }
      }
    }
  }
  ipcRenderer.send("get-shop-page-loaded");
  // 检测当前窗口是否有焦点
  windowHasFocus = document.hasFocus();
  console.log("页面加载完成，当前焦点状态:", windowHasFocus);
  console.log("页面加载时间:", new Date().toLocaleString());
  const style = document.createElement("style");
  // style.setAttribute('data-disable-anim', 'true')
  // 动画延迟  animation-delay: 0.01ms !important;
  // 动画时长  animation-duration: 0.01ms !important;
  // 动画次数  animation-iteration-count: 1 !important;
  // 过渡时长  transition-duration: 0.01ms !important;
  // 过渡延迟  transition-delay: 0.01ms !important;
  // 滚动行为  scroll-behavior: auto !important;
  style.innerHTML = `
    *,
    *::before,
    *::after {
      animation-delay: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      transition-delay: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  `;
  document.head?.appendChild(style);

  setTimeout(() => {
    ipcRenderer.send("request-shop-bot-status");
    // injectScript()
    // 根据初始AI状态决定是否添加用户活动监听器
    if (shopBotStatus === 1) {
      addAllUserActivityListeners();
    }
  }, 1000);

  ipcRenderer.send("get-currnt-page", true);
  // 判断是否登录
  const loginObserver = new MutationObserver(async (mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList") {
        const loginElement = document.querySelector(".email");
        if (loginElement) {
          loginElement.click();
          setTimeout(async () => {
            const { username, password } = await refreshLogin();
            const usernameDom = document.querySelector(
              "#ecomLoginForm > section > div.account-center-sdk-form > div:nth-child(1) > div > div > span > input",
            );
            if (!usernameDom) return;
            usernameDom.value = username;

            const passwordDom = document.querySelector(
              "#ecomLoginForm > section > div.account-center-sdk-form > div.account-center-input-row.ac-input-last-item > div > div > span > input",
            );
            if (!passwordDom) return;
            passwordDom.value = password;
            // 创造事件
            const event = document.createEvent("HTMLEvents");
            event.initEvent("input", true, true);
            event.eventType = "message";
            // 调度事件
            usernameDom.dispatchEvent(event);
            passwordDom.dispatchEvent(event);
            // 监听输入框输入事件
            usernameDom.addEventListener("input", () => {
              logoInfo.username = usernameDom.value;
            });
            passwordDom.addEventListener("input", () => {
              logoInfo.password = passwordDom.value;
            });
            const checkDom = document.querySelector(".auxo-checkbox-input");
            checkDom?.click();
            const loginBtn = document.querySelector(
              "#ecomLoginForm > section > div.account-center-submit > button",
            );
            loginBtn?.addEventListener("click", () => {
              ipcRenderer.send("loginInfo", logoInfo);
            });
            if (loginBtn && password && username) {
              setTimeout(() => {
                loginBtn.click();
              }, 1800);
            }
            // btnDom.dispatchEvent(mouseDown)
            // btnDom.dispatchEvent(mouseUp)
            // btnDom.click()
            // btnRect.dispatchEvent(mouseDown)
            // btnRect.dispatchEvent(mouseUp)
            // btnRect.click()
            // ipcRenderer.send('cookie-expired')
          }, 1000);
          loginObserver.disconnect();
          break;
        }
      }
    }
  });
  loginObserver.observe(document.body, { childList: true });
  // 监听是否账号发生变化
  const accountObserver = new MutationObserver(async (mutationsList) => {
    for (let mutation of mutationsList) {
      // console.log('mutation>>>>>>', mutation)
      if (mutation.type === "childList") {
        setTimeout(() => {
          const auxoModalWrap = document.querySelector(
            ".auxo-modal-wrap.auxo-modal-confirm-centered.auxo-modal-centered",
          );
          if (auxoModalWrap) {
            const auxoModalConfirmTitle = auxoModalWrap.querySelector(".auxo-modal-confirm-title");
            // console.log('auxoModalConfirmTitle>>>>>>', auxoModalConfirmTitle)
            if (auxoModalConfirmTitle.textContent == "检测到登录账号发生变化") {
              // 删除这个dom
              // console.log('modalRoot', auxoModalWrap)
              const modalRoot = document.querySelector(".auxo-modal-root");
              modalRoot.remove();
            }
          }
        }, 10);
      }
    }
  });
  accountObserver.observe(document.body, {
    childList: true,
  });
  let visibilitychangeTimer = null;
  //  监听页面是否可见
  document.addEventListener("visibilitychange", () => {
    console.log("页面变为可见", document, document.visibilityState, document.hidden);
    if (document.visibilityState === "visible") {
      visibilitychange = true;
      // 清理定时器
      if (visibilitychangeTimer) {
        visibilitychangeTimer = null;
      }
      //  重新拉取数据
    } else {
      visibilitychange = false;
    }
  });

  // 启动入口
  setTimeout(() => {
    getShopInfo();
  }, 3000);
});
const mycode = () => {
  let dialogueRecordList = [];
  //   记录
  // class dialogueRecord {
  //   constructor(
  //     id,
  //     beginTime,
  //     customerName,
  //     customerId,
  //     customerServiceName,
  //     customerServiceId,
  //     tid,
  //     remark1,
  //     remark2,
  //     remark3,
  //     dialogues
  //   ) {
  //     this.schemeTaskConfigId = id //任务id
  //     this.beginTime = beginTime
  //     this.customerName = customerName || '默认客户' //用户名字
  //     this.customerId = customerId //用户id
  //     this.customerServiceName = customerServiceName // 客服名称
  //     this.customerServiceId = customerServiceId //客服id
  //     this.tid = tid //本段对话 ID
  //     this.remark1 = remark1 //店铺id
  //     this.remark2 = remark2 //商家id
  //     this.remark3 = remark3 //平台
  //     this.remark4 = customerServiceId //客服id
  //     this.dialogue = [] // 对话内容
  //     this.setDialogues(dialogues)
  //   }
  //   async setDialogues(dialogues) {
  //     if (!dialogues) return
  //     const list = Array.isArray(dialogues) ? dialogues : [dialogues]
  //     for (const item of list) {
  //       this.dialogue.push(await this.normalizeDialogue(item))
  //     }
  //   }
  //   async normalizeDialogue(raw) {
  //     const role = raw?.ext?.sender_role
  //     return {
  //       beginTime: new Date(raw?.create_time)
  //         .toISOString()
  //         .replace('T', ' ')
  //         .slice(0, 19),
  //       role: role == 1 ? '客户' : '客服',
  //       identity:
  //         role == 1
  //           ? this.customerName
  //           : role == 2
  //             ? this.customerServiceName
  //             : '平台客服',
  //       emotionValue: 6,
  //       speechRate: 153,
  //       words:
  //         raw?.content == '[图片]'
  //           ? raw.ext?.imageUrl
  //           : raw?.content == '[视频]'
  //             ? await this.getvideo(raw.ext?.msg_render_model)
  //             : raw?.content,
  //       begin: 1000,
  //       end: 1000,
  //       channelId: role == 1 ? 0 : 1,
  //       type:
  //         raw?.content == '[图片]'
  //           ? 'IMAGE'
  //           : raw?.content == '[视频]'
  //             ? 'AUDIO'
  //             : 'TEXT'
  //     }
  //   }
  //   async getvideo(obj) {
  //     const data = JSON.parse(obj)
  //
  //     const vid = data?.render_body?.vid
  //
  //     if (vid) {
  //       const key = await fetch(
  //         `https://pigeon.jinritemai.com/backstage/video/getPlayToken?vid=${vid}&_pms=1`,
  //         {
  //           method: 'GET',
  //           credentials: 'include',
  //           headers: {
  //             'Content-Type': 'application/json'
  //           }
  //         }
  //       ).then((res) => res.json())
  //       if (key.data.token) {
  //         const video = await fetch(
  //           `https://open.bytedanceapi.com/?${key.data.token}`,
  //           {
  //             method: 'GET'
  //           }
  //         ).then((res) => res.json())
  //
  //         return (
  //           video?.Result?.Data?.PlayInfoList[0]?.BackupPlayUrl ||
  //           video?.Result?.Data?.PlayInfoList[0]?.MainPlayUrl ||
  //           '[视频]'
  //         )
  //       }
  //     }
  //   }
  // }
  class DialogueRecord {
    constructor(
      id,
      beginTime,
      customerName,
      customerId,
      customerServiceName,
      customerServiceId,
      tid,
      remark1,
      remark2,
      remark3,
    ) {
      this.schemeTaskConfigId = id;
      this.beginTime = beginTime;
      this.customerName = customerName || "默认客户";
      this.customerId = customerId;
      this.customerServiceName = customerServiceName;
      this.customerServiceId = customerServiceId;
      this.tid = tid;
      this.remark1 = remark1;
      this.remark2 = remark2;
      this.remark3 = remark3;
      this.remark4 = customerServiceId;
      this.dialogue = [];
    }

    async init(dialogues) {
      if (!dialogues) return;

      const list = Array.isArray(dialogues) ? dialogues : [dialogues];

      this.dialogue = await Promise.all(list.map((item) => this.normalizeDialogue(item)));
    }

    async normalizeDialogue(raw) {
      const role = raw?.ext?.sender_role;

      return {
        beginTime: new Date(raw?.create_time).toISOString().replace("T", " ").slice(0, 19),

        role: role == 1 ? "客户" : "客服",

        identity: role == 1 ? this.customerName : role == 2 ? this.customerServiceName : "平台客服",

        emotionValue: 6,
        speechRate: 153,

        words:
          raw?.content == "[图片]"
            ? raw.ext?.imageUrl
            : raw?.content == "[视频]"
              ? await this.getVideo(raw.ext?.msg_render_model)
              : raw?.content,

        begin: 1000,
        end: 1000,
        channelId: role == 1 ? 0 : 1,

        type: raw?.content == "[图片]" ? "IMAGE" : raw?.content == "[视频]" ? "AUDIO" : "TEXT",
      };
    }
    async getVideo(obj) {
      const data = JSON.parse(obj);
      const vid = data?.render_body?.vid;
      if (!vid) return "[视频]";

      const keyRes = await fetch(
        `https://pigeon.jinritemai.com/backstage/video/getPlayToken?vid=${vid}&_pms=1`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      ).then((res) => res.json());

      if (!keyRes?.data?.token) return "[视频]";

      const videoRes = await fetch(`https://open.bytedanceapi.com/?${keyRes.data.token}`, {
        method: "GET",
      }).then((res) => res.json());

      return (
        videoRes?.Result?.Data?.PlayInfoList?.[0]?.BackupPlayUrl ||
        videoRes?.Result?.Data?.PlayInfoList?.[0]?.MainPlayUrl ||
        "[视频]"
      );
    }

    static async create(...args) {
      const instance = new DialogueRecord(...args.slice(0, 10));
      await instance.init(args[10]);
      return instance;
    }
  }
  window.addEventListener("message", (e) => {
    if (e.data.type == "quality-socket-message") {
      console.log("quality-socket-message", e.data.data);
      const hs = e.data.data;
      getConversationList(1, hs);
    } else if (e.data.type == "test") {
      fetch(
        `https://pigeon.jinritemai.com/chat/api/backstage/conversation/can_start_conversation?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&device_platform=web&FUSION=true&verifyFp=verify_mki3vlqo_Gno7VUjv_oYrj_4EB1_9xCV_awPSJbtqj9SA&_v=1.0.1.6362&pigeonUid=${e.data.data}&render=backend
      `,
        {
          method: "GET",
          credentials: "include",
        },
      );
    }
  });
  function getConversationList(limit, hs) {
    fetch("https://pigeon.jinritemai.com/backstage/fuzzySearchConversation?_pms=1", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        evaluationTypeList: [],
        commentType: [],
        sessionTypeList: [],
        conversation_server_type: [3, 1, 2, 0],
        page: limit,
        size: 100,
        evaluationLabelList: [],
        workTimeType: 0,
        isFirstResolutionConversation: false,
        inquiryOrderTypes: [],
        isInquiryOrders: [-1, 0, 1],
        turn2_labor_type_agg: [],
        conversationEvaluationType: [],
        robot_evaluation_type: [],
        humanEvaluationType: [],
        conv_source: [],
        dispatch_group_id: [],
        startTime: hs.startTime,
        endTime: hs.endTime,
        startSceneTypeList: [1, 2, 3, 4, 5, 8, 0],
        endSceneTypeList: [1, 2, 6, 7, 8, 9, 10, 11],
        staffQuery: "",
        userQuery: "",
        conversationId: "",
        content: "",
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        console.log("res=============", res, res.total > limit * 100);
        if (res.code == 0 && res.data && res.data.length > 0) {
          for (const item of res.data) {
            if (item.staffId) {
              const userRecord = await DialogueRecord.create(
                hs.taskId,
                item.laborStartTime,
                item.userName,
                item.userId,
                item?.first_staff_name || item?.staffName || item?.staff_username || "默认客服",
                hs.groupId,
                item.conversationId,
                hs.shopId,
                hs.merchantId,
                hs.platformType,
                item.chats,
              );

              dialogueRecordList.push(userRecord);
            }
          }
          // window.context_bridge.send(
          //   'sned-quality-socket-message',
          //   JSON.stringify(dialogueRecordList)
          // )
        }
        if (res.total > limit * 100) {
          console.log("进入total判断", limit * 100);
          getConversationList(++limit, hs);
        } else {
          console.log(
            "结束total判断",
            dialogueRecordList,
            "\n",
            JSON.stringify(dialogueRecordList),
            hs,
          );
          window.context_bridge.send(
            "send-quality-socket-message",
            JSON.stringify(dialogueRecordList),
          );
          dialogueRecordList = [];
        }
      });
  }

  //   监听websocket
  // const OriginalWebSocket = window.WebSocket
  const RECONNECT_DELAY = 60_000; // 1分钟
  let testWs = null;
  //
  // window.addEventListener('message', (e) => {
  //   if (e.data.type == 'close-websocket') {
  //
  //     console.log('测试关闭 websockt 连接=====', testWs)
  //
  //     if (testWs) {
  //       testWs.close()
  //     }
  //   }
  // })

  // window.WebSocket = function (...args) {
  //   let ws
  //   const connect = () => {
  //     ws = new OriginalWebSocket(...args)
  //     testWs = ws
  //
  //     ws.addEventListener('open', () => {
  //       console.log('链接成功')
  //       clearTimeout(reconnectTimer)
  //
  //       window.postMessage({ type: 'get-all-user' })
  //     })
  //     ws.addEventListener('message', (e) => {
  //       console.log('ws收到消息', e)
  //     })
  //     ws.addEventListener('close', (e) => {
  //       console.log('关闭连接', ws.url, e.code, e.reason)
  //       setTimeout(() => {
  //         window.postMessage({ type: 'get-all-user' })
  //       }, 30 * 1000)
  //       window.postMessage({ type: 'get-all-user' })
  //
  //       reconnectTimer = setTimeout(() => {
  //         console.log('开始重连...')
  //         window.postMessage({ type: 'get-all-user' }) // 拉取所有用户
  //         // connect()
  //       }, RECONNECT_DELAY)
  //     })
  //   }
  //
  //   connect()
  //   return ws
  // }
};
webFrame.executeJavaScript(`(${mycode})()`);
webFrame.executeJavaScript(`(${injectScript})()`);

safeIpcOn("update-shop-bot-status", (_, data) => {
  console.log("收到店铺bot状态更新:", data);
  const previousStatus = shopBotStatus;
  shopBotStatus = data.botStatus;

  // 根据AI状态动态管理所有用户活动监听器
  if (shopBotStatus === 1 && previousStatus !== 1) {
    // AI开启，添加所有用户活动监听器
    addAllUserActivityListeners();
  } else if (shopBotStatus !== 1 && previousStatus === 1) {
    // AI关闭，移除所有用户活动监听器
    removeAllUserActivityListeners();
  }
});

// 获取店铺的状态
safeIpcOn("get-shop-status", (_) => {
  // 获取dom元素
  const text = (
    document.querySelector('img[alt="下箭头"]')?.parentElement?.firstChild?.textContent?.trim() ||
    ""
  ).replace("小休", "忙碌");
  if (text) {
    ipcRenderer.send("shop-status-change", { status: text });
  }
});

// 修改startListenShopStatus函数
const startListenShopStatus = (dom) => {
  // 监听店铺在线状态
  const onlineStatusObserver = new MutationObserver(async (mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === "characterData") {
        let status = mutation.target.nodeValue.trim();
        if (status === "小休") {
          status = "忙碌";
        }
        ipcRenderer.send("shop-status-change", { status });
      }
    }
  });
  // 使用更精确的配置
  onlineStatusObserver.observe(dom, {
    characterData: true,
    subtree: true,
    childList: false,
    attributes: false,
  });
  // 存储观察者实例以便稍后清理
  window._observers = window._observers || [];
  window._observers.push(onlineStatusObserver);
};
// 添加清理所有观察者的函数
function disconnectAllObservers() {
  if (window._observers && window._observers.length) {
    window._observers.forEach((observer) => {
      observer.disconnect();
    });
    window._observers = [];
  }
}
// 在页面卸载时清理
window.addEventListener("beforeunload", disconnectAllObservers);
// 存储所有消息信息
let pushedMessageInfo = new Map();
let isLoginSuccess = false;
let canGetShopInfo = true; // 未回复消息的定时器
let currentServiceId = ""; // 当前客服的id
// let welcomeMessage = '' // 欢迎消息
// let welcomeMessageLoaded = false // 标记欢迎语是否已加载
function getShopInfo() {
  pollUnReplyMessage();
  fetch(
    "https://pigeon.jinritemai.com/backstage/currentuser?_ts=" + Date.now() + "&biz_type=4&_pms=1",
    {
      mode: "cors",
      credentials: "include",
    },
  )
    .then((res) => res.json())
    .then((res) => {
      const { code, data } = res;
      if (code === 0) {
        shopInfo = {
          id: data.ShopId.toString(),
          name: data.ShopName,
          logo: data.ShopLogo,
          username: data.CustomerServiceInfo.screen_name,
          kf: data.CustomerServiceInfo.id,
        };
        console.log("获取店铺信息成功:", res, shopInfo);

        getUnReplyMessage();
        //  ipcRenderer.send('get-currnt-page ')
        _renewCookie(); // 启用续期cookie
        if (canGetShopInfo) {
          ipcRenderer.send("get-shop-info", shopInfo);
          isLoginSuccess = true;
          canGetShopInfo = false;
          // 获取店铺状态
          fetch(
            "https://pigeon.jinritemai.com/backstage/onlineservice?busy=1&_ts=" +
              Date.now() +
              "&biz_type=4&_pms=1",
            {
              mode: "cors",
              credentials: "include",
            },
          )
            .then((statusRes) => statusRes.json())
            .then((statusRes) => {
              if (statusRes.code === 0) {
                statusRes.data.forEach((item) => {
                  if (item.service_toutiao_id_str === shopInfo.kf) {
                    let status = "";
                    switch (item.online_status) {
                      case 0:
                        status = "忙碌";
                        break;
                      case 1:
                        status = "在线";
                        break;
                      case 2:
                        status = "离线";
                        break;
                    }
                    ipcRenderer.send("shop-status-change", { status });
                  }
                });
              } else {
                // 延迟拿太快拿不到
                console.log("低版本===========");
                isLowVersion = true;
              }
            });
        }
      }
    });
}
// 获取未回复消息
function getUnReplyMessage(startListen = true) {
  // 获取当前会话
  try {
    fetch(
      "https://pigeon.jinritemai.com/chat/api/backstage/conversation/get_current_conversation_list?_ts=" +
        Date.now() +
        "&biz_type=4&PIGEON_BIZ_TYPE=2&pageNo=0&pageSize=200&_pms=1&FUSION=true",
      {
        mode: "cors",
        credentials: "include",
      },
    )
      .then((res) => res.json())
      .then(async (res) => {
        const { code, data } = res;
        if (code === 0) {
          // 获取未回复消息
          let unReplyMessageList = [];
          for (let item of data) {
            const { countdown, countdown_time } = item.coreInfoMap;
            // console.log('countdown_time', countdown_time)
            if (countdown === "true") {
              let info = {
                userId: "",
                username: "",
                isTimeout: false,
                timeNote: "",
                content: "",
                avatar: "",
                timeout: parseInt(countdown_time) + 180,
                messageId: "",
              };
              // 这条会话的id
              // 过滤出买家的消息
              const buyerMessage = item.msgList
                ? item.msgList
                    .filter((_item) => {
                      return (
                        _item.messageBody.ext["s:sender_biz_role"] === "Buyer" &&
                        _item.messageBody.ext["attention"] === "true" &&
                        !_item.messageBody?.content?.endsWith("接入")
                      );
                    })
                    .sort((a, b) => {
                      // 对_item.messageBody.createTime进行排序，最新的排前面
                      const timeA = parseInt(a.messageBody.createTime);
                      const timeB = parseInt(b.messageBody.createTime);
                      return timeB - timeA;
                    })
                : [];
              console.log("buyerMessage+=======", buyerMessage);
              // 查找 buyerMessage下的ext中的avatar_uri和uname，如果有则取出
              for (let _item of buyerMessage) {
                // 获得该条会话的id
                const { uname } = _item.messageBody.ext;

                if (uname) {
                  info.username = uname;
                }
                if (info.username) {
                  break;
                }
              }
              if (buyerMessage.length > 0) {
                // 判断上下文有没有发过卡片信息

                let lastMessage = buyerMessage[0];

                const dbdata = await getIndexedDBFirstChar();

                const flag = /^\d+$/.test(dbdata?.key);
                console.log("lastMessage", lastMessage, flag);
                info.userId = flag
                  ? lastMessage.messageBody.sender
                  : lastMessage.messageBody?.ext?.security_src_user_id;
                info.messageId = flag
                  ? lastMessage.messageBody.sender
                  : lastMessage.messageBody?.ext?.security_src_user_id;
                info.content = lastMessage.messageBody.content;
                info.api = true;
                console.log("inf============1", info);
                if (!info.username) {
                  try {
                    const _res = await fetch(
                      "https://pigeon.jinritemai.com/backstage/getuserinfo?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&FUSION=true&_v=1.0.1.1852&uids=" +
                        info.userId +
                        "&_ts=" +
                        Date.now(),
                      {
                        mode: "cors",
                        credentials: "include",
                      },
                    ).then((_res) => _res.json());
                    if (_res.code === 0 && _res.data && _res.data.length > 0) {
                      const { avatar_url, screen_name } = _res.data[0];
                      // info.avatar = avatar_url
                      info.username = screen_name;
                      if (info.userId) info.messageId = info.userId;

                      // 如果messageId为空，则不进行处理
                      if (!info.messageId) {
                        continue;
                      }
                      // 如果最后两个字符是接入，则不进行处理
                      if (info.content.endsWith("接入")) {
                        continue;
                      }

                      // }

                      unReplyMessageList.push(info);
                    } else {
                      info.username = "用户" + info.userId;
                      info.messageId = info.userId;
                      unReplyMessageList.push(info);
                    }
                  } catch (error) {
                    console.log(error);
                    info.username = "用户" + info.userId;
                    info.messageId = info.userId;
                    unReplyMessageList.push(info);
                  }
                } else {
                  // 如果messageId为空，则不进行处理
                  if (!info.messageId) {
                    continue;
                  }
                  // 如果最后两个字符是接入，则不进行处理
                  if (info.content.endsWith("接入")) {
                    continue;
                  }
                  console.log("inf=============", info);

                  // }
                  info.source = "url";
                  unReplyMessageList.push(info);
                }
              }
            }
          }
          console.log("unReplyMessageList", unReplyMessageList);
          // 如果unReplyMessageList有信息，则进行批量发送
          if (unReplyMessageList.length > 0) {
            ipcRenderer.send("get-customer-message-list", unReplyMessageList);
          }
        } else if (
          code === 10005 &&
          !window.location.href.includes("https://fxg.jinritemai.com/login/common") &&
          shopInfo?.id
        ) {
          // 登录过期
          ipcRenderer.send("account-login-expired");
          // 重新登录

          console.log("登录过期，请重新登录");
          window.location.href = "https://fxg.jinritemai.com/login/common";
        }
      });
  } catch (err) {
    console.log("获取未回复消息失败", err);
    // 接口获取失败了，进行二次补偿
    // secondCompensationMessage()
  } // 如果startListen为true，则开始监听消息,无论是否获取到未回复消息，都要开始监听消息
}
// 二次补偿信息
const secondCompensationMessage = () => {
  const pigeonChatNotScrollBox = document.querySelector("#chantListScrollArea");
  if (!pigeonChatNotScrollBox) {
    return;
  }
  let unReplyMessageListDom = [];
  // 二次补偿
  const listContainer = pigeonChatNotScrollBox.querySelector(".list_items");
  // console.log('listContainer', listContainer)
  if (!listContainer) {
    return;
  }
  listContainer.querySelectorAll("div").forEach((node) => {
    if (node && node.querySelector('[data-qa-id="qa-conversation-chat-item"]')) {
      const contBox = node.querySelector('[data-qa-id="qa-conversation-chat-item"]');
      const timeDom = contBox.lastChild.firstChild;
      if (["时", "分", "秒"].some((item) => timeDom.textContent.includes(item))) {
        // 拥有时间信息 说明信息没有进行回复
        const avatar = contBox.childNodes[1].querySelector('img[alt="头像"]')?.src || "";
        if (avatar) {
          try {
            const textDom = contBox.querySelector('[data-btm="d089038"]');
            // 获取textDom的上一个兄弟节点
            const nameDOm = textDom.previousSibling.firstChild;
            const username = nameDOm.textContent;
            // console.log(username)
            const contentMessage = contBox.childNodes[2].childNodes[1].textContent;
            // 如果内容是商品，则跳过
            // if (contentMessage === '[商品]' || contentMessage === '[订单卡片]') {
            //   return
            // }
            // 如果名字是用户1233123123后面跟id就把id去出来,详细
            let userId = "";
            if (username.includes("用户")) {
              userId = username.split("用户")[1];
            }
            // 当前时间加上180秒
            const message = {
              messageId: username,
              content: contentMessage,
              // avatar,
              username,
              timeout: Math.floor(new Date() / 1000) + 180,
              isTimeout: false,
              timeNote: "",
              api: false,
              userId,
            };
            unReplyMessageListDom.push(message);
            console.log("二次补偿", message);
          } catch (error) {}
        }
      }
    }
  });
  // 如果unReplyMessageList有信息，则进行批量发送
  if (unReplyMessageListDom.length > 0) {
    // console.log('unReplyMessageListDom3333', unReplyMessageListDom)
    pushMessagesIfNeeded(unReplyMessageListDom);
  }
};
// 通过代码注入层获取用户订单
async function getUserOrderFromInject(userId, orderId) {
  return new Promise((resolve) => {
    const handler = (event) => {
      if (event.data && event.data.type === "get-user-order-result") {
        window.removeEventListener("message", handler);
        resolve(event.data.data);
      }
    };
    window.addEventListener("message", handler);
    // 发送请求
    window.postMessage(
      {
        type: "get-user-order",
        data: {
          userId: userId,
          orderId: orderId,
        },
      },
      "*",
    );
    // 5秒后超时，返回 null
    setTimeout(() => {
      window.removeEventListener("message", handler);
      resolve(null);
    }, 5000);
  });
}
// 获取到的信息就跑这个接口获取商品
async function getGoodsMessage(uid, convId) {
  const res = await fetch(
    "  https://pigeon.jinritemai.com/backstage/workstation/get_consulting_products?user_id=" +
      uid +
      "&conv_id=" +
      convId +
      "&_ts=" +
      Date.now(),
    {
      mode: "cors",
      credentials: "include",
    },
  ).then((_res) => _res.json());

  console.log("咨询商品", res);
  // 判断商品是否下架
  if (!res.data.consulting_product || res.data.consulting_product.length === 0) {
    return "";
  }
  const goodInfo = res.data.consulting_product[0];
  // console.log('goodInfo', _res)
  return {
    goodId: goodInfo.product_id,
    goodName: goodInfo.product_name,
    goodImage: goodInfo.img,
  };

  // const detailRes = await fetch(
  //   'https://haohuo.jinritemai.com/aweme/v2/shop/promotion/pack/detail/?is_h5=1&origin_type=1337&_ts=' +
  //     Date.now(),
  //   {
  //     mode: 'cors',
  //     credentials: 'include',
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/x-www-form-urlencoded'
  //     },
  //     body: 'promotion_id=' + res.goodId + '&enter_from=&meta_param=&is_h5=1'
  //   }
  // )
  // // const skuData = await skuRes.json()
  // // console.log('skuData', skuData)
  // const detail = await detailRes.json()
  // const detailData = detail.detail_info
  // // console.log('detailData',detail,detailData)
  // // 提取商品规格信息
  // let productSpecs = []
  // if (detailData?.product_format && Array.isArray(detailData?.product_format)) {
  //   detailData.product_format.forEach((formatItem, index) => {
  //     // console.log('formatItem', formatItem)
  //     // 处理直接的规格信息
  //     if (
  //       formatItem.name &&
  //       formatItem.message &&
  //       Array.isArray(formatItem.message)
  //     ) {
  //       const specValues = formatItem.message
  //         .map((msg) => msg.desc)
  //         .filter(Boolean)
  //       if (specValues.length > 0) {
  //         productSpecs.push({
  //           name: formatItem.name,
  //           values: specValues.join(',')
  //         })
  //       }
  //     }
  //     // 处理嵌套的format数组
  //     if (formatItem.format && Array.isArray(formatItem.format)) {
  //       formatItem.format.forEach((specItem) => {
  //         if (
  //           specItem.name &&
  //           specItem.message &&
  //           Array.isArray(specItem.message)
  //         ) {
  //           const specValues = specItem.message
  //             .map((msg) => msg.desc)
  //             .filter(Boolean)
  //           if (specValues.length > 0) {
  //             productSpecs.push({
  //               name: specItem.name,
  //               values: specValues.join(',')
  //             })
  //           }
  //         }
  //       })
  //     }
  //   })
  // }
  // // console.log('提取的商品规格信息:', productSpecs)
  // // 将规格信息转换为字符串格式
  // const productSpecsString = productSpecs
  //   .map((item) => item.name + ':' + item.values)
  //   .join(',')
  // // console.log('productSpecsString',res, productSpecsString)
  // return {
  //   // sku: ,
  //   goodId: res.goodId,
  //   goodName: res.goodName,
  //   goodDesc: (res.goodName || '') + productSpecsString
  // }
}

// 收到设置AI是否回复
safeIpcOn("set-ai-to-human-reply", () => {
  // console.log('收到设置AI是否回复')
  const dom = document.querySelector('[data-btm-id="a9034.b39122.c0467.d4350"]');
  // console.log('dom', dom)
  if (dom) {
    // dom.click()
    ipcRenderer.send("set-ai-to-human-reply-customer", {
      messageId: dom.textContent || "",
    });
  }
});
// 获取抖店的体验分
safeIpcOn("get-shop-experience-score", (_) => {
  console.log("获取抖店体验分");
  getShopExperienceScore();
});
// 获取店铺体验
const getShopExperienceScore = () => {
  fetch(
    "https://fxg.jinritemai.com/governance/shop/experiencescore/getOverviewByVersion?exp_version=release&source=1",
    {
      mode: "cors",
      credentials: "include",
    },
  )
    .then((_res) => _res.json())
    .then((_res) => {
      const { data } = _res;
      if (data) {
        const info = {
          consumerDivide: data.experience_score.value,
          serviceDivide: data.goods_score.value,
          foundationDivide: data.logistics_score.value,
          deliveryDivide: data.service_score.value,
          goodDivide: "0",
          logisticsDivide: "0",
        };
        ipcRenderer.send("getShopExperienceScore", info);
      }
    });
};
// 根据抖店指标的 value_type 统一格式化店铺表现值。
function formatDoudianExperienceMetricValue(valueInfo) {
  // value_type=2 表示百分比，需要转成百分数但不带 %。
  if (valueInfo?.value_type === 2) {
    return Number(((valueInfo?.value_figure || 0) * 100).toFixed(4));
  }

  // 其余类型直接返回原始数值；时间类型接口本身已是秒值。
  return valueInfo?.value_figure ?? "";
}

// 将抖店体验分接口返回整理成后续可直接消费的结构。
function buildDoudianExperienceScoreData(data) {
  const shopAnalysis = Array.isArray(data?.shop_analysis) ? data.shop_analysis : [];
  const shopSubScore = Array.isArray(data?.shop_sub_score) ? data.shop_sub_score : [];

  // 一级分统一从 shop_sub_score 提取。
  const getSubScore = (name) => {
    const item = shopSubScore.find((scoreItem) => scoreItem?.sub_score_name === name);
    return item?.sub_score ?? "";
  };

  // 二级指标统一整理成 “得分 + 店铺表现” 结构。
  const buildMetric = (title) => {
    const metric = shopAnalysis.find((item) => item?.title === title);

    if (!metric) {
      return {
        score: "",
        shopValue: "",
      };
    }

    return {
      score: metric?.node_score_info?.node_score ?? "",
      shopValue: formatDoudianExperienceMetricValue(metric?.value),
    };
  };

  return {
    // 基础信息用于后续上传或调试时定位店铺与统计周期。
    shopId: data?.shop_id ?? "",
    shopName: data?.shop_name ?? "",
    beginDate: data?.begin_date ?? "",
    currentDate: data?.current_date ?? "",
    shopOrderLatest30Cnt: data?.shop_order_latest_30_cnt ?? "",

    // 一级分。
    productScore: getSubScore("商品体验得分"),
    logisticsScore: getSubScore("物流体验得分"),
    serviceScore: getSubScore("服务体验得分"),
    badBehaviorScore: getSubScore("差行为扣分"),

    // 二级指标。
    productMetrics: {
      goodsRating: buildMetric("商品综合评分"),
      goodsRefundRate: buildMetric("商品品质退货率"),
    },
    logisticsMetrics: {
      pickupInTimeRate: buildMetric("揽收时效达成率"),
      pickupAvgScore: buildMetric("揽收时长平均得分"),
      deliveryInTimeRate: buildMetric("运单配送时效达成率"),
      logisticsRefundRate: buildMetric("发货物流品退率"),
    },
    serviceMetrics: {
      imReplyDuration: buildMetric("飞鸽平均响应时长"),
      afterSaleHandleInTimeRate: buildMetric("售后处理时长达成率"),
    },
    badBehaviorMetrics: {
      fakeTradeScore: buildMetric("虚假交易刷体验分"),
      affectConsumerExperienceScore: buildMetric("影响消费者体验"),
    },
  };
}

// 请求新的抖店体验分分析接口，并只返回整理后的数据，不在这里发 IPC。
const getShopEXperienceScoreNew = async () => {
  const response = await fetch(
    "https://fxg.jinritemai.com/governance/shop/experiencescore/getAnalysisScore?exp_version=release&number_type=30+&new_shop_version=release",
    {
      mode: "cors",
      credentials: "include",
    },
  );
  const result = await response.json();
  const formattedData = buildDoudianExperienceScoreData(result?.data);
  console.log("抖店体验分分析数据", formattedData);
  return formattedData;
};
let messageList = new Map();
let isFirstLoad = true; // 🔥 添加首次加载标记
let pendingMessages = []; // 🔥 添加待发送消息缓存
let batchTimer = null; // 🔥 添加批量发送定时器
// 存储所有定时器ID，方便统一管理
let timerIds = {
  messageCheck: null,
  statusCheck: null,
  unReplyMessage: null,
  shopObserver: null,
  cleanup: null,
  memoryCheck: null,
  batchSend: null, // 🔥 添加批量发送定时器ID
};

function getQueryParams() {
  const url = window.location.href;
  const urlObject = new URL(url);
  const redirectParams = new URLSearchParams(urlObject.search);
  const shopName = redirectParams.get("shopName");
  return { shopName };
}
const getUserWatchGoodsMessage = async (messageList) => {
  // console.log('messageList', messageList)
  if (messageList.length === 0) {
    return;
  }
  // 取出messageBody.content为用户正在查看商品的信息
  const goodsMessage = messageList.find((item) => item.messageBody.content === "用户正在查看商品");
  if (!goodsMessage) {
    return null;
  }
  // console.log(JSON.parse(goodsMessage.messageBody.ext.static_data))
  const res = JSON.parse(goodsMessage.messageBody.ext.static_data);
  const goodInfo = res.b_goods[0];
  const desc = await getGoodDesc(goodInfo.product_id);
  const productSpecsString = desc.map((item) => item.name + ":" + item.values).join(",");
  // console.log(productSpecsString)
  const params = {
    goodName: goodInfo.product_name,
    goodId: goodInfo.product_id,
    goodDesc: productSpecsString,
  };
  return JSON.stringify(params);
};
// 获取商品基本信息
async function getGoodDesc(goodId) {
  const detailRes = await fetch(
    "https://haohuo.jinritemai.com/aweme/v2/shop/promotion/pack/detail/?is_h5=1&origin_type=1337&_ts=" +
      Date.now(),
    {
      mode: "cors",
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "promotion_id=" + goodId + "&enter_from=&meta_param=&is_h5=1",
    },
  );
  const detail = await detailRes.json();
  console.log("detail>>>>>>>", detail);
  const detailData = detail.detail_info;
  // 提取商品规格信息
  let productSpecs = [];
  if (detailData?.product_format && Array.isArray(detailData?.product_format)) {
    detailData?.product_format.forEach((formatItem, index) => {
      // console.log('formatItem', formatItem)
      // 处理直接的规格信息
      if (formatItem.name && formatItem.message && Array.isArray(formatItem.message)) {
        const specValues = formatItem.message.map((msg) => msg.desc).filter(Boolean);
        if (specValues.length > 0) {
          productSpecs.push({
            name: formatItem.name,
            values: specValues.join(","),
          });
        }
      }
      // 处理嵌套的format数组
      if (formatItem.format && Array.isArray(formatItem.format)) {
        formatItem.format.forEach((specItem) => {
          if (specItem.name && specItem.message && Array.isArray(specItem.message)) {
            const specValues = specItem.message.map((msg) => msg.desc).filter(Boolean);
            if (specValues.length > 0) {
              productSpecs.push({
                name: specItem.name,
                values: specValues.join(","),
              });
            }
          }
        });
      }
    });
  }
  return productSpecs;
}

// 🔥 获取订单状态（带重试和超时，马上拿到就立即返回）
function getOrderStatusWithRetry(messageId, timeout = 3000) {
  return new Promise((resolve) => {
    let resolved = false;
    let retryCount = 0;
    const maxRetries = 3;
    let retryTimer = null;
    let timeoutTimer = null;

    const handler = (event) => {
      if (event.data?.type === "order_status" && !resolved) {
        resolved = true;
        window.removeEventListener("message", handler);
        // 清除定时器
        if (retryTimer) clearInterval(retryTimer);
        if (timeoutTimer) clearTimeout(timeoutTimer);
        console.log("[订单] 拦截到订单状态:", event.data.data?.orderStatus);
        resolve(event.data.data?.orderStatus || null);
      }
    };

    window.addEventListener("message", handler);

    // 每隔 500ms 检查一次，如果没收到就点刷新，最多 3 次
    retryTimer = setInterval(() => {
      if (resolved) {
        clearInterval(retryTimer);
        return;
      }

      retryCount++;
      if (retryCount <= maxRetries) {
        console.log(`[订单] 第 ${retryCount} 次点击刷新`);
        clickOrderRefresh();
      } else {
        clearInterval(retryTimer);
      }
    }, 500);

    // 超时返回 null，不阻塞
    timeoutTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.removeEventListener("message", handler);
        if (retryTimer) clearInterval(retryTimer);
        console.log("[订单] 超时未获取到订单状态");
        resolve(null);
      }
    }, timeout);
  });
}

// 点击刷新按钮
function clickOrderRefresh() {
  const refreshBtn = document.getElementById("qa-order-refresh-icon");
  if (refreshBtn) {
    refreshBtn.click();
    console.log("[订单] 已点击刷新按钮");
  }
}

safeIpcOn("get-shop-user", async (event, data) => {
  console.log("获取用户信息", data);
  if (linkonInsert) {
    ipcRenderer.send("get-shop-isuser-status", {
      hasContent: false,
    });
    return;
  }
  // 获取输入框元素
  const replyTextarea = document.querySelector('[data-qa-id="qa-send-message-textarea"]');

  if (replyTextarea) {
    // 检查输入框是否有内容
    const hasContent = replyTextarea.value && replyTextarea.value.trim().length > 0;

    // 立即计算用户是否在操作（不依赖定时器）
    const now = Date.now();
    const timeSinceMouseActivity = now - lastMouseActivity;
    const timeSinceKeyboardActivity = now - lastKeyboardActivity;
    const timeSinceLastActivity = Math.min(timeSinceMouseActivity, timeSinceKeyboardActivity);

    // 用户是否在最近1秒内有活动
    const hasRecentActivity = windowHasFocus && timeSinceLastActivity < USER_ACTIVITY_TIMEOUT;

    // 综合判断：输入框有内容 或 最近有活动（输入框有焦点不算操作，只要没内容就行）
    const userIsOperating = hasContent || hasRecentActivity;
    // 发送用户操作状态
    ipcRenderer.send("get-shop-isuser-status", { hasContent: userIsOperating });

    if (userIsOperating) {
      console.log("用户正在操作，跳过AI处理");
      return;
    }
  } else {
    ipcRenderer.send("get-shop-isuser-status", { hasContent: false });
    return;
  }
  // console.log('replyTextarea', replyTextarea)
  const newdata = { ...data };
  const { shopId, messageId, userId, username } = data;
  const tabDom = document.querySelector(`[data-qa-id="qa-chat-tab"]`);
  if (tabDom) {
    tabDom.click();
  } else {
    // 兼容新版本
    const newTabDom = document.querySelector(`[class="auxo-badge auxo-badge-top-right"]`);
    // console.log('newTabDom', newTabDom)
    // 判断它的下一个兄弟元素是不是会话
    if (newTabDom) {
      const nextSibling = newTabDom?.nextSibling;
      if (nextSibling && nextSibling.textContent.includes("会话")) {
        nextSibling.click();
      }
    }
  }
  // 等待500ms - 改为 await Promise 确保等待完成
  await new Promise((resolve) => {
    setTimeout(() => {
      try {
        //  document.querySelector(`[data-qa-id="qa-active-chat-tab"]`).click()
        const activeChatTab = document.querySelector(`[data-qa-id="qa-active-chat-tab"]`);
        if (activeChatTab) {
          activeChatTab.click();
        }
        resolve();
      } catch (error) {
        resolve();
      }
    }, 100);
  });

  // 等待用户列表渲染完成
  await new Promise((res) => setTimeout(res, 300));

  let titleDom = null;
  // 判断有没有title为args.username的元素
  titleDom = document.querySelector(`[title="${username}"]`);
  // console.log('titleDom', titleDom)
  if (!titleDom) {
    console.log("没有找到titleDom");
    const nodes = Array.from(document.querySelectorAll('[data-qa-id="qa-conversation-chat-item"]'));
    nodes.forEach((node) => {
      const messageContentDom = node.querySelector('[data-btm="d089038"]');
      // 获取messageContentDom的上一个元素
      const userName = messageContentDom?.previousSibling;
      if (userName) {
        // console.log(userName)
        if (userName.firstChild?.textContent.includes(userId)) {
          // console.log('找到titleDom', userName)
          // node.click()
          titleDom = userName;
        }
      }
    });
  }
  if (titleDom) {
    // 取父级的父级
    const parentParent = titleDom.parentElement.parentElement;
    // console.log('parentParent', parentParent)
    if (parentParent) {
      parentParent.click();
      await new Promise((res) => setTimeout(res, 300));
      // 🔥 先获取消息列表
      const msgResult = getMsgList();

      const reversed = [...msgResult].reverse();
      const index = reversed.findIndex((item) => item.role === "assistant");
      let result = index >= 0 ? reversed.slice(0, index).reverse() : [];
      // 去掉空值
      newdata.history = result.filter((item) => item.content != "");
      // 去掉重复的消息内容
      const uniqueResult = newdata.history.filter(
        (item, index, self) => self.findIndex((t) => t.content === item.content) === index,
      );
      newdata.history = uniqueResult;

      // 🔥 检查消息列表中是否已有有效订单状态（用户发送的订单卡片）
      const msgOrderStatus = msgResult.find(
        (item) => item.orderStatus && item.orderStatus !== "暂无订单",
      )?.orderStatus;

      if (msgOrderStatus) {
        // 消息列表中已有订单状态，直接使用
        newdata.orderStatus = msgOrderStatus;
        console.log("[订单] 从消息列表获取订单状态:", msgOrderStatus);
      } else {
        // 消息列表中没有订单状态，再去主动获取
        const orderStatus = await getOrderStatusWithRetry(messageId, 1500);
        if (orderStatus) {
          newdata.orderStatus = orderStatus;
          // 把订单状态同步到 history 里每条消息
          newdata.history.forEach((item) => {
            if (!item.orderStatus || item.orderStatus === "暂无订单") {
              item.orderStatus = orderStatus;
            }
          });
          console.log("[订单] 主动获取订单状态:", orderStatus);
        }
      }
      const jsonData = JSON.stringify(newdata);
      console.log("用户发送内容", jsonData);
      ipcRenderer.send("get-historical-records", jsonData);
    }
  }
});

safeIpcOn("click-customer-message", async (_, args) => {
  console.log("点击用户信息为", args, linkonInsert);
  // if (selectuserInsert) {
  let targetUserId = args.userId || args.messageId;
  const chatScrollBox = document.querySelector(".pigeonChatNotScrollBox .scroller");
  const targetUser = chatScrollBox.querySelector(`[title="${args.username}"]`);
  if (targetUser) {
    targetUser.click();
    return;
  }

  if (targetUserId) {
    window.postMessage({
      type: "select-user",
      data: targetUserId,
    });
    console.log("退出后续dom查找======");
    return;
  }
  // }

  const tab = document.querySelector('[aria-controls="rc-tabs-0-panel-current"]');

  if (tab) tab?.click();
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (chatScrollBox) {
    const chatUser = chatScrollBox.querySelector(`[title="${args.username}"]`);
    // const chatUser = null

    console.log("chatScrollBox", chatUser);
    if (chatUser) {
      chatUser.click();
      // console.log('chatScrollBox',chatUser.parentElement.parentElement)
    } else {
      if (args.type === "ai") {
        const searchInput = document.querySelector(`[data-qa-id="qa-user-order-search"]`);
        if (searchInput) {
          searchInput.value = args.username;
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
          // 等待500ms
          setTimeout(() => {
            document
              .querySelectorAll(`[data-qa-id="qa-user-order-search-result-item"]`)
              .forEach((item) => {
                const text = item.innerText;
                if (text === args.username) {
                  // console.log('item', item)
                  item.firstChild.click();
                  return;
                }
              });
          }, 500);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const lowlist = document.querySelectorAll(".auxo-dropdown-trigger");
        if (lowlist) {
          const thatUser = Array.from(lowlist).find((item) => {
            const text = item.innerHTML;
            return (
              (args.messageId && text.includes(args.messageId)) ||
              (args.userId && text.includes("用户" + args.userId))
            );
          });
          if (thatUser && thatUser.children[0]) {
            thatUser.children[0].click();
          }
          // else {
          //   ipcRenderer.send('reply-customer-message', {
          //     messageId: args.messageId,
          //     userId: args.userId,
          //     compensate: true,
          //     sendTarget: 'dy6'
          //   })
          // }
        } else {
          console.log("发送消息 dy2", args);
          ipcRenderer.send("reply-customer-message", {
            messageId: args.messageId,
            userId: args.userId,
            compensate: true,
            shopMsgTotal: getMsgTotal(),
            sendTarget: "dy2",
            platformType: "抖店",
          });
        }
      }
    }
  }
});

// 离线/上线
safeIpcOn("change-shop-status", (_, status) => {
  console.log("改变店铺状态为", status);
  // if (isLowVersion) {
  window.postMessage({
    type: "update-status",
    status: status,
  });
  // 五秒之后检索是否成功下线  如果下线失败则 使用dom补偿上下线 状态
  setTimeout(() => {
    const kindex = document.querySelector('[alt="下箭头"]');
    if (kindex) {
      const statusDom = kindex?.parentElement;

      console.log("kindex");
      if (statusDom) {
        const statusText = statusDom?.textContent?.trim();
        console.log("statusText", statusText);
        const atv = statusDom.parentElement?.parentElement?.parentElement;
        if (atv) {
          switch (status) {
            case "online":
              if (statusText != "在线") {
                atv.click();
                setTimeout(() => {
                  const dom = document.querySelector(".auxo-popover-inner-content");
                  if (dom) {
                    const statusList = dom.querySelector('[role="button"]');
                    if (statusList) {
                      console.log("statusList", statusList);
                      const online = statusList.querySelectorAll('[role="button"]');
                      console.log("online", online);
                      if (online) online[0].click();
                    }
                  }
                }, 1000);
              }
              break;
            case "busy":
              if (statusText != "忙碌") {
                atv.click();
                setTimeout(() => {
                  const dom = document.querySelector(".auxo-popover-inner-content");
                  if (dom) {
                    const statusList = dom.querySelector('[role="button"]');
                    if (statusList) {
                      console.log("statusList", statusList);
                      const online = statusList.querySelectorAll('[role="button"]');
                      console.log("online", online);
                      if (online) online[1].click();
                      setTimeout(() => {
                        const confirm = document.querySelector(".auxo-btn.auxo-btn-primary");
                        if (confirm) confirm.click();
                      }, 1000);
                    }
                  }
                }, 1000);
              }

              console.log("忙碌");
              break;
            case "offline":
              if (statusText != "下线") {
                atv.click();
                setTimeout(() => {
                  const dom = document.querySelector(".auxo-popover-inner-content");
                  if (dom) {
                    const statusList = dom.querySelector('[role="button"]');
                    if (statusList) {
                      console.log("statusList", statusList);
                      const online = statusList.querySelectorAll('[role="button"]');
                      console.log("online", online);
                      if (online) online[2].click();
                      setTimeout(() => {
                        const confirm = document.querySelector(".auxo-btn.auxo-btn-primary");
                        if (confirm) confirm.click();
                      }, 1000);
                    }
                  }
                }, 1000);
              }
              console.log("下线");
              break;
          }
        }
      }
    }
  }, 5 * 1000);
  // } else {
  //   const changeStatusDom =
  //     document.querySelector('[data-guide="SWITCH_ONLINE"]') ||
  //     document.querySelector('[alt="下箭头"]')
  //   // console.log('changeStatusDom', changeStatusDom)
  //   if (changeStatusDom) {
  //     changeStatusDom.click()
  //     if (status === 'online') {
  //       // 点击在线
  //       const switchOnline = document.querySelector('[data-btm="d8148"]')
  //       if (switchOnline) {
  //         switchOnline.click()
  //       }
  //     } else if (status === 'offline') {
  //       // 点击离线
  //       const switchOffline = document.querySelector('[data-btm="d7970"]')
  //       if (switchOffline) {
  //         switchOffline.click()
  //         setTimeout(() => {
  //           const modal = document.querySelector('div.auxo-modal-content')
  //           if (modal) {
  //             const confirmButton = modal.querySelector(
  //               'button.auxo-btn.auxo-btn-primary'
  //             )
  //             if (confirmButton) {
  //               confirmButton.click()
  //             }
  //           }
  //         }, 1000)
  //       }
  //     } else {
  //       // 忙碌
  //       const switchOnline = document.querySelector('[data-btm="d8504"]')
  //       if (switchOnline) {
  //         switchOnline.click()
  //         setTimeout(() => {
  //           const modal = document.querySelector('div.auxo-modal-content')
  //           if (modal) {
  //             const confirmButton = modal.querySelector(
  //               'button.auxo-btn.auxo-btn-primary'
  //             )
  //             if (confirmButton) {
  //               confirmButton.click()
  //             }
  //           }
  //         }, 1000)
  //       }
  //     }
  //   }
  // }
});

function injectScript() {
  console.log("inject================");
  //  获取商品详情信息
  const getGoodInfo = async (goodId) => {
    const [category, skuRes, detailRes] = await Promise.all([
      fetch(
        `https://fxg.jinritemai.com/product/tproduct/list?page=0&pageSize=20&id_name_code=${goodId}&draft_status=0&comment_percent=&group_id=&sku_type=&tab=onSale&business_type=4&is_online=1&not_for_sale_search_type=1&from_mng=1&check_status=3&status=0&supply_status=&need_auto_rectify_info=true&need_pay_no_stock_skus=true&order_field=audit_time&sort=desc&appid=1`,
        {
          method: "GET",
          credentials: "include",
        },
      ).then((res) => res.json()),

      fetch(
        `https://pigeon.jinritemai.com/backstage/workstation/get_skuinfo_list?PIGEON_BIZ_TYPE=2&product_id=${goodId}&security_user_id=&_pms=1`,
        {
          method: "GET",
          credentials: "include",
        },
      ).then((res) => res.json()),
      // fetch(
      //   `https://pigeon.jinritemai.com/backstage/workstation/get_product_properties?PIGEON_BIZ_TYPE=2&product_id=${goodId}&_pms=1`,
      //   {
      //     method: 'GET',
      //     credentials: 'include'
      //   }
      // ).then((res) => res.json()),
      fetch(
        "https://haohuo.jinritemai.com/aweme/v2/shop/promotion/pack/detail/?is_h5=1&origin_type=1337&_ts=" +
          Date.now(),
        {
          mode: "cors",
          credentials: "include",
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `promotion_id=${goodId}&enter_from=&meta_param=&is_h5=1`,
        },
      ).then((res) => res.json()),
    ]);
    console.log("sku AND detailRes============", category, skuRes, detailRes);

    let goodSku = {};
    let goodDetail = {};
    let goodCat = null;

    if (category.code == 0 && category.data?.length > 0) {
      goodCat = category?.data[0]?.category_name
        ?.split(">")
        .map((v) => v.trim())
        .join("/");
    }
    if (skuRes.code == 0 && skuRes?.data?.product_info) {
      const productInfo = skuRes?.data?.product_info;
      console.log("productInfo", productInfo?.product_name);
      goodSku.mainImage = productInfo?.img;
      goodSku.goodName = productInfo?.product_name;
      goodSku.goodId = productInfo?.product_id;
      goodSku.goodSku = productInfo?.spec_detail_info.map(
        (v) => `${v.name}:${v.spec_details.map((v) => v.name).join("/")}`,
      );
    }
    // if (detailRes.code == 0) {
    //   goodDetail = detailRes?.data?.properties?.map(
    //     (v) => `${v.name}:${v.value}`
    //   )
    // }
    if (detailRes?.status_code == 0) {
      console.log("detailRes", detailRes?.detail_info.product_format[0]);
      goodDetail.goodProperties = detailRes?.detail_info?.product_format[0]?.format.map(
        (v) => `${v?.name}:${v?.message[0]?.desc}`,
      );
      goodDetail.detailImages = detailRes?.detail_info?.detail_imgs_new.map(
        (v) => v?.image?.url_list[0],
      );
    }
    const good = {
      ...goodSku,
      ...goodDetail,
      goodCat,
      // goodName: goodSku?.goodName, // 商品名称
      // goodId: goodSku?.goodId, // 商品ID
      // goodSku: goodSku?.goodSku, // spec_detail_info  商品sku 材质无纺布 涤纶   尺寸： 100cm 200cm   颜色分类:1,2,3;尺码大小:140 150 160
      // goodProperties: goodDetail?.goodProperties, // 商品属性
      // goodCat, // 商品类目
      // mainImage: goodSku?.mainImage, // 商品主图片
      // detailImages: goodDetail?.detailImages // 商品详情图片
    };
    console.log("good=======>", good);
    return good;
  };
  class OrderFromDB {
    constructor(mydata, dbValue) {
      // 先复制mydata的所有字段
      Object.assign(this, mydata);
      // 遍历dbValue，如果mydata中该字段为空，就用dbValue的值填充
      for (const key in dbValue) {
        if (dbValue[key]) {
          // 检查mydata中该字段是否为空（空字符串、null、undefined）
          const myValue = this[key];
          if (myValue === "" || myValue === null || myValue === undefined) {
            this[key] = dbValue[key];
          }
        }
      }
    }
  }
  class UserByOrderDB {
    constructor() {
      this.db = null;
      this.initPromise = null;
      this.DB_NAME = "userByOrderInfo";
      this.STORE_NAME = "value";
      this.VERSION = 1;
    }
    // 初始化 DB
    async init() {
      if (this.initPromise) return this.initPromise;

      this.initPromise = (async () => {
        if (this.db) return this.db;

        this.db = await new Promise((resolve, reject) => {
          const request = indexedDB.open(this.DB_NAME, this.VERSION);

          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(this.STORE_NAME)) {
              db.createObjectStore(this.STORE_NAME, { keyPath: "id" });
            }
          };

          request.onsuccess = () => {
            const db = request.result;
            db.onversionchange = () => {
              db.close();
              this.db = null;
              this.initPromise = null;
            };
            resolve(db);
          };
          request.onerror = () => reject(request.error);
          request.onblocked = () => reject(new Error("indexedDB blocked"));
        });

        return this.db;
      })().catch((error) => {
        this.initPromise = null;
        this.db = null;
        throw error;
      });

      return this.initPromise;
    }
    // 新增 / 修改
    async save(data) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.STORE_NAME, "readwrite");
        const store = tx.objectStore(this.STORE_NAME);
        const request = store.put(data);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    }
    // 更具id 查询
    async get(id) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.STORE_NAME, "readonly");
        const store = tx.objectStore(this.STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    }
    // 查询所有
    async getAll() {
      const db = await this.init();

      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.STORE_NAME, "readonly");
        const store = tx.objectStore(this.STORE_NAME);

        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    }
    // 删除指定 id
    async delete(id) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.STORE_NAME, "readwrite");
        const store = tx.objectStore(this.STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    }
  }
  let injectShopInfo = {};
  let aiReplyCountMap = new Map();
  window.context_bridge.on("create-workorder", async (_, args) => {
    console.log("接收获取工单信息");
    // 先获取用户的id
    const userDom = document.querySelector('[data-qa-id="qa-send-message-textarea"]');
    if (!userDom) {
      console.error("未找到用户id");
      return;
    }
    // 获取class 中inputArea_后面的数字inputArea_2933149679747143
    // xXHctBqpncWTJsmpY49R inputArea_2933149679747143 QibOk4nwVkEfY0KY5l_U 取到了inputArea_2933149679747143 QibOk4nwVkEfY0KY5l_U，我要取2933149679747143
    const userId = userDom.classList.value.split("inputArea_")[1].split(" ")[0];
    console.log("userId", userId);
    if (userId) {
      // _ts=     Date.now() +
      fetch(
        "https://pigeon.jinritemai.com/backstage/cmpoent/order/query?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&device_platform=web&FUSION=true",
        {
          mode: "cors",
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // from_conversation_short_id: '7522006839597270298',
            biz_type: 2,
            is_init_tab: 0,
            open_params: {},
            page_no: 0,
            page_size: 5,
            search_words: "",
            tab_type: 0,
            security_user_id: userId,
            service_entity_id: "",
            version: "1.0",
            workstation_opt_gray: true,
            workstation_opt_version: "v2",
          }),
        },
      )
        .then((_res) => _res.json())
        .then((_res) => {
          console.log("data", _res);
          // 提取关键
          const list = _res.data.map((item) => {
            return {
              orderId: item.order_id,
              type: item.aftersale_sum_status_desc,
              orderName: item.sku_order_list[0].product_name,
              sku: item.sku_order_list[0].sku_space_text,
              name: item.post_receiver + "," + item.mobile,
              address:
                item.post_address.province.name +
                item.post_address.city.name +
                item.post_address.town.name +
                item.post_address.street.name,
              expressCompany: item.logistics_info.express_company,
              trackingNumber: item.logistics_info.tracking_no,
              expanded: true,
            };
          });
          window.context_bridge.send("get-create-workorder", list);
        });
    }
  });
  window.context_bridge.on("get-goods-detail", async (_, args) => {
    console.log("开始获取商品信息...", args);
    try {
      const promises = args.ids.map(async (id) => {
        const good = await getGoodInfo(id);
        const params = {
          // goodId: good?.goodId,
          // goodName: good?.goodName,
          // // goods_desc: goodsProperties,
          // urls: good?.detailImages,
          // goods_url: good?.mainImage,
          // goods_properties: good?.goodDetail,
          // goods_cat: good?.goodCategory,
          // goods_sku: good?.goodSku,
          ...good,
          aiTaskId: args.aiTaskId,
          id: args.id,
          type: args.type,
        };
        console.log("params", params);
        // 将规格信息添加到参数中
        return params;
      });
      const paramsArray = (await Promise.all(promises)).filter(Boolean);
      console.log("paramsArray", paramsArray);

      window.context_bridge.send("get-goods-detail", paramsArray);
    } catch (error) {
      console.error("获取商品信息时发生错误:", error);
      ipcRenderer.send("upload-server-log", {
        type: "error",
        message: "抖店获取商品信息时发生错误",
      });
      window.context_bridge.send("get-goods-url", {
        data: [],
        count: 0,
        error: error.message || "网络请求失败",
      });
    }
  });
  // window.context_bridge.on('get-goods-detail-by-id', async (_, args) => {
  //   console.log('开始获取商品信息...')
  //   try {
  //     const promises = [args.id].map(async (id) => {
  //       // console.log('id', id)
  //       const res = await fetch(
  //         'https://pigeon.jinritemai.com/backstage/workstation/get_product_list?busy=1&_ts=' +
  //           Date.now() +
  //           '&biz_type=4&_pms=1',
  //         {
  //           mode: 'cors',
  //           credentials: 'include',
  //           method: 'POST',
  //           headers: {
  //             'Content-Type': 'application/json'
  //           },
  //           body: JSON.stringify({
  //             search_words: id,
  //             biz_type: 4,
  //             business_type: 4,
  //             check_status: 3,
  //             hot_style: 0,
  //             is_channel: 0,
  //             page_no: 0,
  //             page_size: 10, // 获取前10个商品
  //             presale_biz_scene: 'b_product_list',
  //             status: 0,
  //             user_id: ''
  //           })
  //         }
  //       )
  //       const data = await res.json()
  //       // console.log('data', data)
  //       // 这里假设只取第一个商品（如需全部可遍历 data.data）
  //       if (data.data && data.data.length > 0) {
  //         // 这里只处理第一个商品
  //         const item = data.data[0]
  //         const leimu = item.product_item.product_base_info.new_category_detail_
  //         const skuInfo = item.product_item.product_base_info.skus
  //         let goodsProperties = ''
  //         let goods_sku = ''
  //
  //         // 商品类目
  //         const goods_cat =
  //           leimu.first_cname +
  //           '/' +
  //           leimu.fourth_cname +
  //           '/' +
  //           leimu.third_cname
  //         // 处理SKU规格信息，提取DisplayValueName
  //         if (skuInfo && skuInfo.length > 0) {
  //           const skuTexts = []
  //
  //           skuInfo.forEach((sku) => {
  //             if (
  //               sku.sale_property_value_pair &&
  //               sku.sale_property_value_pair.length > 0
  //             ) {
  //               const skuProperties = sku.sale_property_value_pair
  //                 .map((pair) => {
  //                   return pair.Value.DisplayValueName || pair.Value.ValueName
  //                 })
  //                 .join(' × ')
  //               skuTexts.push(skuProperties)
  //             }
  //           })
  //
  //           goods_sku = skuTexts.join(';')
  //         }
  //         const params = {
  //           goods_id: item.product_item.product_id,
  //           goods_name: item.product_item.product_base_info.title,
  //           goods_url: item.product_item.product_base_info.main_img,
  //           goods_desc: '',
  //           goods_cat,
  //           goods_properties: '',
  //           goods_sku,
  //           aiTaskId: args.aiTaskId,
  //           id: args.id,
  //           type: args.type,
  //           urls: []
  //         }
  //         const productId = item.product_item.product_id
  //         const detailRes = await fetch(
  //           'https://haohuo.jinritemai.com/aweme/v2/shop/promotion/pack/detail/?is_h5=1&origin_type=1337&_ts=' +
  //             Date.now(),
  //           {
  //             mode: 'cors',
  //             credentials: 'include',
  //             method: 'POST',
  //             headers: {
  //               'Content-Type': 'application/x-www-form-urlencoded'
  //             },
  //             body:
  //               'promotion_id=' + productId + '&enter_from=&meta_param=&is_h5=1'
  //           }
  //         )
  //         const detail = await detailRes.json()
  //         const imgs = detail.detail_info.detail_imgs || []
  //         // 取所有图片的第一张
  //         const firstImgList = imgs
  //           .map((img) =>
  //             img.url_list && img.url_list.length > 0 ? img.url_list[0] : null
  //           )
  //           .filter(Boolean)
  //         // 获取商品详情
  //
  //         params.urls = firstImgList
  //         const detailData = detail.detail_info
  //         // 提取商品规格信息
  //         let productSpecs = []
  //         if (
  //           detailData.product_format &&
  //           Array.isArray(detailData.product_format)
  //         ) {
  //           detailData.product_format.forEach((formatItem, index) => {
  //             // 处理直接的规格信息
  //             if (
  //               formatItem.name &&
  //               formatItem.message &&
  //               Array.isArray(formatItem.message)
  //             ) {
  //               const specValues = formatItem.message
  //                 .map((msg) => msg.desc)
  //                 .filter(Boolean)
  //               if (specValues.length > 0) {
  //                 productSpecs.push({
  //                   name: formatItem.name,
  //                   values: specValues.join(',')
  //                 })
  //               }
  //             }
  //
  //             // 处理嵌套的format数组
  //             if (formatItem.format && Array.isArray(formatItem.format)) {
  //               formatItem.format.forEach((specItem) => {
  //                 if (
  //                   specItem.name &&
  //                   specItem.message &&
  //                   Array.isArray(specItem.message)
  //                 ) {
  //                   const specValues = specItem.message
  //                     .map((msg) => msg.desc)
  //                     .filter(Boolean)
  //                   if (specValues.length > 0) {
  //                     productSpecs.push({
  //                       name: specItem.name,
  //                       values: specValues.join(',')
  //                     })
  //                   }
  //                 }
  //               })
  //             }
  //           })
  //         }
  //
  //         // console.log('提取的商品规格信息:', productSpecs)
  //         // 将规格信息转换为字符串格式
  //         const productSpecsString = productSpecs
  //           .map((item) => item.name + ':' + item.values)
  //           .join(',')
  //         // 将规格信息添加到参数中
  //         params.goods_properties = productSpecsString
  //         return params
  //       } else {
  //         // 没有商品时返回空对象或自定义内容
  //         return null
  //       }
  //     })
  //     const paramsArray = (await Promise.all(promises)).filter(Boolean)
  //     console.log('商品信息:', paramsArray)
  //     window.context_bridge.send('goods-crawl-complete', paramsArray)
  //   } catch (error) {
  //     console.error('获取商品信息时发生错误:', error)
  //     window.context_bridge.send('goods-crawl-error', {
  //       id: args.id,
  //       error: '商品获取失败'
  //     })
  //   }
  // })
  // 获取全部商品
  window.context_bridge.on("get-goods-all-detail", async (_, args) => {
    try {
      console.log("开始获取全部商品信息...", args);
      // 第一步：获取总条数
      const firstPageRes = await fetch(
        "https://pigeon.jinritemai.com/backstage/workstation/get_product_list?busy=1&_ts=" +
          Date.now() +
          "&biz_type=4&_pms=1",
        {
          mode: "cors",
          credentials: "include",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            search_words: "",
            biz_type: 4,
            business_type: 4,
            check_status: 3,
            hot_style: 0,
            is_channel: 0,
            page_no: 0,
            page_size: 20, // 获取前10个商品
            presale_biz_scene: "b_product_list",
            status: 0,
            user_id: "",
          }),
        },
      ).then((res) => res.json());
      // console.log('firstPageRes', firstPageRes)
      const firstPageData = firstPageRes;
      if (firstPageData.code == -1) {
        return null;
      }
      const total = firstPageData.total;
      // 发送总条数
      window.context_bridge.send("get-goods-all-detail-total", {
        userId: args.userId,
        total: total,
      });
      console.log("总共有 " + total + " 个商品");
      // 计算需要请求的页数
      const pageSize = 20;
      const totalPages = Math.ceil(total / pageSize);
      console.log("需要请求 " + totalPages + " 页");
      // 第二步：边获取列表边处理详情
      // 先处理第一页的商品
      if (firstPageData.data) {
        // console.log(
        //   '第 1 页获取到 ' + firstPageData.data.length + ' 个商品，开始处理详情'
        // )
        // 判断第一页是否也是最后一页
        const isFirstPageLastBatch = totalPages === 1;
        await processBatchGoods(firstPageData.data, 1, args, isFirstPageLastBatch);
      }
      // 循环获取剩余页面并立即处理
      for (let page = 2; page <= totalPages; page++) {
        try {
          const pageRes = await fetch(
            "https://pigeon.jinritemai.com/backstage/workstation/get_product_list?busy=1&_ts=" +
              Date.now() +
              "&biz_type=4&_pms=1",
            {
              mode: "cors",
              credentials: "include",
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                biz_type: 4,
                business_type: 4,
                check_status: 3,
                hot_style: 0,
                is_channel: 0,
                page_no: page - 1,
                page_size: 20, // 获取前10个商品
                presale_biz_scene: "b_product_list",
                search_words: "",
                status: 0,
                user_id: "",
              }),
            },
          );
          const pageData = await pageRes.json();
          if (pageData.data) {
            // console.log(
            //   '第 ' +
            //     page +
            //     ' 页获取到 ' +
            //     pageData.data.length +
            //     ' 个商品，开始处理详情'
            // )
            // 判断是否为最后一页
            const isLastBatch = page === totalPages;
            // 立即处理这一页的商品详情
            await processBatchGoods(pageData.data, page, args, isLastBatch);
          }
          // 添加延迟避免请求过快
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          ipcRenderer.send("upload-server-log", {
            type: "error",
            message: "抖店获取第 " + page + " 页商品列表失败:" + error,
          });
          console.error("获取第 " + page + " 页商品列表失败:", error);
        }
      }
      console.log("所有商品详情获取完成");
      // 处理商品详情的函数
      async function processBatchGoods(goodsItems, pageNum, args, isLastBatch = false) {
        try {
          // 串行处理商品详情，每个商品间隔30秒
          const batchResults = [];
          for (let i = 0; i < goodsItems.length; i++) {
            const item = goodsItems[i];
            const goodId = item.product_item.product_id;
            const result = await processGoodsDetail(goodId, args, isLastBatch);
            if (result) {
              console.log("商品 单个抓取完成");
              batchResults.push(result);
            }
            // 如果不是最后一个商品，等待30秒
            if (i < goodsItems.length - 1) {
              // console.log('等待5秒后处理下一个商品...')
              await new Promise((resolve) => setTimeout(resolve, 5000));
            }
          }
          // 一页处理完后，批量发送所有商品详情数据
          if (batchResults.length > 0) {
            window.context_bridge.send("get-goods-detail", batchResults);
          }
          // 添加页面间延迟避免请求过快
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          ipcRenderer.send("upload-server-log", {
            type: "error",
            message: "抖店处理第 " + pageNum + " 页时出错:" + error,
          });
        }
      }
      // 处理单个商品详情的函数
      async function processGoodsDetail(goodId, args, isLastBatch = false) {
        try {
          const good = await getGoodInfo(goodId);
          console.log("good======", good);
          const result = {
            ...good,
            type: args.type,
            id: args.id,
          };

          // 只有最后一批才添加 aiTaskId
          if (isLastBatch) {
            result.aiTaskId = args.aiTaskId;
          }
          console.log("result=====", result);
          return result;
        } catch (error) {
          console.error("处理商品 " + item.product_item.product_id + " 时出错:", error);
          ipcRenderer.send("upload-server-log", {
            type: "error",
            message: "抖店处理商品 " + item.product_item.product_id + " 时出错:" + error,
          });
          return null;
        }
      }
    } catch (error) {
      console.error("获取全部商品详情时出错:", error);
      ipcRenderer.send("upload-server-log", {
        type: "error",
        message: "抖店获取全部商品详情时出错:" + error,
      });
    }
  });
  // 初始化商品
  window.context_bridge.on("init-goods", (_, args) => {
    fetch(
      "https://pigeon.jinritemai.com/backstage/workstation/get_product_list?busy=1&_ts=" +
        Date.now() +
        "&biz_type=4&_pms=1",
      {
        mode: "cors",
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search_words: "",
          biz_type: 4,
          business_type: 4,
          check_status: 3,
          hot_style: 0,
          is_channel: 0,
          page_no: 0,
          page_size: 20, // 获取前10个商品
          presale_biz_scene: "b_product_list",
          search_words: "",
          status: 0,
          user_id: "",
        }),
      },
    )
      .then((res) => res.json())
      .then((res) => {
        // 取出goods_list中的name，id,url
        const goodsList = res.data.map((item) => ({
          name: item.product_item.product_base_info.title,
          id: item.product_item.product_id,
          url: item.product_item.product_base_info.main_img,
        }));
        // console.log(goodsList)
        window.context_bridge.send("init-goods", goodsList);
      });
  });
  // 初始化店铺基本信息
  window.context_bridge.on("init-shop-info", (_, args) => {
    fetch(
      "https://pigeon.jinritemai.com/backstage/workstation/get_product_list?busy=1&_ts=" +
        Date.now() +
        "&biz_type=4&_pms=1",
      {
        mode: "cors",
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search_words: "",
          biz_type: 4,
          business_type: 4,
          check_status: 3,
          hot_style: 0,
          is_channel: 0,
          page_no: 0,
          page_size: 20, // 获取前10个商品
          presale_biz_scene: "b_product_list",
          search_words: "",
          status: 0,
          user_id: "",
        }),
      },
    )
      .then((res) => res.json())
      .then((res) => {
        // 取出goods_list中的name，id,url
        if (res.data && res.data.length > 0) {
          const goodsList = res.data[0];
          if (goodsList) {
            // console.log(goodsList)
            const params = {
              shopClass: goodsList.product_item.product_base_info.new_category_detail_.first_cname,
              goodName: goodsList.product_item.product_base_info.title,
            };
            window.context_bridge.send("init-shop-info", params);
          }
        }
      });
  });
  let keepAliveStopped = false;
  function keepAliveLoop() {
    if (keepAliveStopped) return;

    try {
      // 模拟鼠标移动
      const event = new MouseEvent("mousemove", {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: Math.floor(Math.random() * 100),
        clientY: Math.floor(Math.random() * 100),
      });
      document.dispatchEvent(event);

      // 模拟滚动（微小位移）
      const y = window.scrollY;
      window.scrollTo(0, y + 1);
      setTimeout(() => window.scrollTo(0, y), 300);
    } catch (e) {
      console.error("保持页面活跃失败", e);
    }

    // 关键点：执行完再等
    setTimeout(keepAliveLoop, 10000);
  }
  // 启动
  keepAliveLoop();
  // ==================== 质检数据随机延迟发送 ====================
  let cachedQualityData = null;
  let qualityDataTimer = null;
  // 只获取 第一位
  function getIndexedDBFirstChar(timer = 1000) {
    const dbName = "buyerInfo";
    const storeName = "keyvaluepairs";

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const request = indexedDB.open(dbName);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction(storeName, "readonly");
          const store = tx.objectStore(storeName);

          const cursorRequest = store.openCursor();

          cursorRequest.onsuccess = (e) => {
            const cursor = e.target.result;

            if (cursor) {
              // 第一条
              resolve({
                key: cursor.key,
                value: cursor.value,
              });
            } else {
              resolve(undefined); // 空库
            }

            db.close();
          };

          cursorRequest.onerror = () => reject(cursorRequest.error);
        };
      }, timer);
    });
  }
  // 根据店铺ID生成0-40秒的随机延迟
  function getRandomDelay() {
    return Math.random() * 40 * 1000; // 0-40秒随机
  }
  // 延迟发送质检数据
  function sendQualityDataWithDelay(data) {
    // 缓存最新数据
    cachedQualityData = data;

    // 如果已有定时器，不重新设置（避免频繁重置）
    if (qualityDataTimer) {
      console.log("[质检] 数据已缓存，等待发送");
      return;
    }

    const delay = getRandomDelay();
    console.log("[质检] 将在", Math.round(delay / 1000), "秒后发送质检数据");

    qualityDataTimer = setTimeout(() => {
      if (cachedQualityData) {
        console.log("[质检] 发送质检数据:", cachedQualityData);
        window.context_bridge.send("get-quality-testing", cachedQualityData);
        // 或者对于使用ipcRenderer的：
        // ipcRenderer.send('get-quality-testing', cachedQualityData)
      }
      cachedQualityData = null;
      qualityDataTimer = null;
    }, delay);
  }
  // ==================== 质检数据随机延迟发送结束 ====================
  // 🔥 使用 Map 记录每个用户正在处理的 AI 回复数量

  // 🔥 监听来自 preload 脚本的 postMessage 消息
  window.addEventListener("message", async function (event) {
    // 只处理来自当前窗口的消息
    if (event.source !== window) return;

    if (event.data.type === "update-status") {
      console.info("页面上下文：更新状态", event.data.status);

      if (event.data.status == "offline") {
        fetch(
          `https://pigeon.jinritemai.com/backstage/uponlineservice?_ts=${Date.now()}&biz_type=4&_pms=1`,
          {
            mode: "cors",
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: 2,
              cid: 7521486246033318000,
              cid_str: "7521486246033317376",
            }),
          },
        )
          .then((res) => res.json())
          .then((res) => {
            console.info("res", res);
            window.context_bridge.send("shop-status-change", {
              status: "离线",
            });
          });
      } else if (event.data.status == "online") {
        fetch(
          `https://pigeon.jinritemai.com/backstage/uponlineservice?biz_type=4&PIGEON_BIZ_TYPE=2&_ts=${Date.now()}&_pms=1&FUSION=true`,
          {
            mode: "cors",
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: 1,
            }),
          },
        )
          .then((res) => res.json())
          .then((res) => {
            console.info("res", res);
            window.context_bridge.send("shop-status-change", {
              status: "在线",
            });
          });
      } else {
        fetch(
          `https://pigeon.jinritemai.com/backstage/uponlineservice?biz_type=4&PIGEON_BIZ_TYPE=2&_ts=${Date.now()}&_pms=1&FUSION=true`,
          {
            mode: "cors",
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: 0,
            }),
          },
        )
          .then((res) => res.json())
          .then((res) => {
            console.info("res", res);
            window.context_bridge.send("shop-status-change", {
              status: "忙碌",
            });
          });
      }
    } else if (event.data.type === "SET_AI_REPLY_INFO") {
      const {
        messageId,
        userId,
        isAiAutoReply,
        isBottomLineAutoReply,
        isReminderReply,
        isAiInviteReply,
      } = event.data.data;
      console.log("页面上下文：AI 回复计数 +1", typeof messageId, messageId);

      // 🔥 获取当前计数，如果不存在则初始化
      const currentInfo = aiReplyCountMap.get(messageId) || {
        count: 0,
        messageId,
        userId,
        isAiAutoReply,
        isBottomLineAutoReply,
        isReminderReply,
        isAiInviteReply,
        timestamp: Date.now(),
      };
      currentInfo.count++;
      aiReplyCountMap.set(messageId, currentInfo);
      console.log("存入成功====", aiReplyCountMap, typeof messageId, currentInfo);
    } else if (event.data.type === "CLEAR_AI_REPLY_INFO") {
      const messageId = event.data.data?.messageId;
      console.log("页面上下文：AI 回复计数 -1", messageId);

      if (messageId) {
        const currentInfo = aiReplyCountMap.get(messageId);

        if (currentInfo) {
          currentInfo.count -= 1;
          // console.log(\`页面上下文：用户 \${messageId} 当前 AI 回复计数: \${currentInfo.count}\`);

          // 🔥 如果计数归零，删除该用户的记录

          if (currentInfo.count <= 0) {
            // aiReplyCountMap.delete(messageId)
            console.log(`页面上下文：用户 \${messageId} 所有 AI 回复已完成，删除记录`, messageId);
          } else {
            console.log(`页面上下文CUN`, currentInfo);
            // aiReplyCountMap.set(messageId, currentInfo)
          }
        }
      }
    } else if (event.data.type == "send-reminder") {
      const userId = event.data.value.userId;
      fetch(
        "https://pigeon.jinritemai.com/backstage/workstation/get_product_list?biz_type=4&PIGEON_BIZ_TYPE=2&_ts=" +
          Date.now() +
          "&_pms=1&FUSION=true",
        {
          mode: "cors",
          credentials: "include",
          method: "POST",
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
          },
          body: JSON.stringify({
            app_id: 1128,
            user_id: userId,
            page_no: 0,
            page_size: 1,
            presale_biz_scene: "b_user_footprint",
          }),
        },
      )
        .then((res) => res.json())
        .then((res) => {
          // console.log('res=========', res)
          const { data } = res;
          if (data.length > 0) {
            const productId =
              data[0].product_id || (data[0].product_item && data[0].product_item.product_id) || ""; // 商品ID
            // console.log('productId', productId)
            fetch(
              "https://pigeon.jinritemai.com/backstage/workstation/order_create_care?biz_type=4&PIGEON_BIZ_TYPE=2&_ts=" +
                Date.now() +
                "&_pms=1&FUSION=true",
              {
                method: "POST",
                credentials: "include",

                headers: {
                  "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                  product_id: productId,
                  user_id: userId,
                  source: "goods_view",
                  sku_id: "",
                  sku_num: 1,
                  content: "您看中的商品享受7天无理由退货，早买早发货，赶快下单迎接宝贝吧~",
                }),
              },
            )
              .then((res) => res.json())
              .then((res) => {
                console.log("res======", res);
              });
          }
        });
    } else if (event.data.type == "get-user-order") {
      // 获取用户订单
      const userId = event.data.data?.userId;
      const orderIdParm = event.data.data?.orderId;
      const res = await fetch(
        "https://pigeon.jinritemai.com/backstage/cmpoent/order/query?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&FUSION=true&_ts=" +
          Date.now(),
        {
          method: "POST",
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            security_user_id: userId,
            page_no: 0,
            page_size: 5,
            tab_type: 0,
            search_words: "",
            is_init_tab: 0,
            biz_type: 2,
            // from_conversation_short_id: '7522006839597270298',
            version: "1.0",
            open_params: {},
            workstation_opt_version: "v2",
            service_entity_id: "",
            order_id: orderIdParm,
            workstation_opt_gray: true,
          }),
        },
      ).then((res) => res.json());
      console.log("获取商品 == === res", res);
      let orderStatus = null;
      let orderId = null;
      let goodId = null;

      if (res.code === 0 && res.data && res.data.length > 0) {
        // 判断账单是不是最近30天的
        orderStatus = res.data[0].order_status_desc + res.data[0].aftersale_sum_status_desc;
        orderId = res.data[0].order_id;
        goodId = res.data[0]?.sku_order_list[0]?.product_id;
      } else if (res.code === 0 && (!res.data || res.data.length === 0)) {
        orderStatus = "暂无订单";
      }
      // 把订单结果返回给主窗口
      window.parent.postMessage(
        {
          type: "get-user-order-result",
          data: {
            userId: userId,
            orderStatus: orderStatus,
            orderId: orderId,
            goodId: goodId,
          },
        },
        "*",
      );
    } else if (event.data.type == "test-goodId") {
      const detailRes = await fetch(
        "https://haohuo.jinritemai.com/aweme/v2/shop/promotion/pack/detail/?is_h5=1&origin_type=1337&_ts=" +
          Date.now(),
        {
          mode: "cors",
          credentials: "include",
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "promotion_id=" + 3760779070200218075 + "&enter_from=&meta_param=&is_h5=1",
        },
      );
      const detail = await detailRes.json();
      console.log("detail???????", detail);
    } else if (event.data.type == "get-good-info") {
      console.log("get-good-info", event.data);
      const goodId = event?.data?.goodId; //|| '3760779070200218075' // 3788496824181063840 3760779070200218075
      if (!goodId) return;

      const good = await getGoodInfo(goodId);
      window.postMessage({
        type: "get-good-info-cb",
        data: good,
      });
      console.log("good=====>", good);
    }
  });

  let aiReplyCleanupStopped = false;

  function cleanupAiReplyCountMap() {
    if (aiReplyCleanupStopped) return;

    try {
      const now = Date.now();
      const expireTime = 10000; // 10 秒

      const map = aiReplyCountMap;
      if (!map || map.size === 0) {
        // 空 Map，没必要频繁跑
        scheduleNext(8000);
        return;
      }

      for (const [messageId, info] of map) {
        if (!info || !info.timestamp) {
          map.delete(messageId);
          continue;
        }

        if (now - info.timestamp > expireTime) {
          console.log("页面上下文：清理过期的 AI 回复标记:", messageId);
          map.delete(messageId);
        }
      }
    } catch (err) {
      console.error("cleanupAiReplyCountMap error:", err);
    }

    scheduleNext(5000);
  }

  function scheduleNext(delay) {
    setTimeout(cleanupAiReplyCountMap, delay);
  }
  function getMsgTotal() {
    const waitReply = document.querySelector('[data-btm="message_group_name_waitReply"]'); // 3 分钟
    const overThreemins = document.querySelector('[data-btm="message_group_name_overThreemins"]'); // 超时

    let waitReplyNum = 0;
    let overThreeminsNum = 0;
    if (waitReply) {
      waitReplyNum = getnumber(waitReply);
    }
    if (overThreemins) {
      overThreeminsNum = getnumber(overThreemins);
    }
    return overThreeminsNum + waitReplyNum;
  }

  function getnumber(dom) {
    const parent = dom.parentElement;
    if (parent) {
      const match = parent.textContent.match(/\((\d+)\)/);
      if (match) {
        return Number(match[1]);
      }
    }
    return 0;
  }
  // 启动
  cleanupAiReplyCountMap();
  //
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  // 重写 open 方法
  XMLHttpRequest.prototype.open = function (method, url) {
    this._method = method;
    this._url = url;
    if (url.includes("get_current_conversation_list")) console.log("url=========", method, url);
    originalXhrOpen.apply(this, arguments);
  };
  // 使用WeakMap来避免内存泄漏
  const xhrListeners = new WeakMap();
  XMLHttpRequest.prototype.send = function (body) {
    // 只针对特定的URL添加监听器

    const needsListener =
      (this._method === "POST" &&
        this._url.startsWith("https://doudian-sso.jinritemai.com/passport/sso/account_login/v2")) ||
      (this._method === "GET" &&
        this._url.startsWith("https://pigeon.jinritemai.com/backstage/currentuser")) ||
      (this._method === "GET" &&
        this._url.startsWith(
          "https://pigeon.jinritemai.com/backstage/data/conversationAreaRealtimeData",
        )) ||
      (this._method === "POST" &&
        this._url.startsWith(
          "https://pigeon.jinritemai.com/backstage/robot/assistant/answerRecommend",
        )) ||
      (this._method === "POST" &&
        this._url.startsWith("https://pigeon.jinritemai.com/backstage/getTemplateCardDataV2")) ||
      (this._method === "POST" &&
        this._url.startsWith("https://pigeon.jinritemai.com/backstage/uponlineservice")) ||
      (this._method === "GET" && this._url.includes("get_current_conversation_list"));
    if (needsListener) {
      // console.log('添加监听器 - method:', this._method, 'url:', this._url)

      // 如果已经有监听器了，先移除
      const existingListener = xhrListeners.get(this);
      if (existingListener) {
        console.log("移除已存在的监听器");
        this.removeEventListener("load", existingListener);
        xhrListeners.delete(this);
      }

      const method = this._method;
      const url = this._url;
      const listener = async function () {
        // console.log('监听器被触发 - method:', method, 'url:', url)
        // 🔥 发送回复消息的辅助函数
        function sendReplyMessage(userId, content, aiReplyInfo, is_subscribe) {
          console.log("is_subscribe", aiReplyInfo, is_subscribe);
          const isAiReply = aiReplyInfo && aiReplyInfo.count > 0;

          // 有 DOM 的情况：根据 AI 类型发送不同的事件
          const baseMessage = {
            messageId: userId,
            userId,
            content,
            isAiAutoReply: isAiReply && aiReplyInfo?.isAiAutoReply,
            isBottomLineAutoReply: isAiReply && aiReplyInfo?.isBottomLineAutoReply,
            isReminderReply: isAiReply && aiReplyInfo?.isReminderReply,
            isAiInviteReply: isAiReply && aiReplyInfo?.isAiInviteReply,
          };
          // 修复：先检查 aiReplyInfo 是否存在
          if (is_subscribe == 1) {
            window.context_bridge.send("get-customer-callback-result", baseMessage);
          } else {
            console.log(" 走删除 人工回复", baseMessage);
            baseMessage.sendTarget = "dy3";
            baseMessage.shopMsgTotal = getMsgTotal() || 0;
            baseMessage.platformType = "抖店";
            console.log("发送消息 dy3", baseMessage);
            window.context_bridge.send("reply-customer-message", baseMessage);
          }

          console.log("CLEAR_AI_REPLY_INFO删除回复标记");
          // 🔥 清理 AI 回复标记
          window.postMessage(
            {
              type: "CLEAR_AI_REPLY_INFO",
              data: { messageId: userId },
            },
            "*",
          );
          // aiReplyCountMap.delete(messageId)
        }

        try {
          if (method === "GET" && url.includes("/backstage/onlineservice")) {
            const { code, data } = JSON.parse(this.response);
            console.log("在线状态=======", code);
            if (code === 0) {
              data.forEach((item) => {
                if (item.service_toutiao_id_str === injectShopInfo.kf) {
                  let status = "";
                  switch (item.online_status) {
                    case 0:
                      status = "忙碌";
                      break;
                    case 1:
                      status = "在线";
                      break;
                    case 2:
                      status = "离线";
                      break;
                  }
                  window.context_bridge.send("shop-status-change", { status });
                }
              });
            }
          } else if (method === "POST" && url.includes("backstage/uponlineservice")) {
            // 店铺状态更改
            const data = JSON.parse(body);
            console.log("data", JSON.parse(body));
            if (data) {
              let content = "";
              switch (data.status) {
                case 0:
                  content = "忙碌";
                  break;
                case 1:
                  content = "在线";
                  break;
                case 2:
                  content = "离线";
                  break;
              }
              window.context_bridge.send("shop-status-change", {
                status: content,
              });
            }
          } else if (
            method === "GET" &&
            url.startsWith(
              "https://pigeon.jinritemai.com/backstage/data/conversationAreaRealtimeData",
            )
          ) {
            const { code, data } = JSON.parse(this.response);
            // 平均响应时长:avgResponseDuration.amount
            // 首次响应时长：firstResponseDuration.amount
            // 支付/询单人数：tradeCompound.amount
            // 接待人数：laborUserAmount
            // 人工已接待会话量：laborAmount
            // 3分钟回复率：threeMinResponseConRate
            // 场景解决率：shopSceneResolutionRate
            // 满意率：satisfactionRate
            // 不满意率：dissatisfactionRate
            if (code === 0) {
              const {
                tradeCompound,
                laborUserAmount,
                threeMinResponseConRate,
                avgResponseDuration,
                dissatisfactionRate,
              } = data;
              const parts = tradeCompound.amount.split("/");
              const paidCount = parseInt(parts[0], 10);
              const inquiryCount = parseInt(parts[1], 10);
              // 计算支付转化率
              let conversionRate = 0;
              if (inquiryCount > 0) {
                conversionRate = (paidCount / inquiryCount) * 100;
              }
              sendQualityDataWithDelay({
                inquiryCount: laborUserAmount.amount + "人",
                responseRateWithinThreeMin: threeMinResponseConRate.amount,
                averageRate: avgResponseDuration.amount,
                dissatisfiedRate: dissatisfactionRate.amount,
                recoverRate: conversionRate.toFixed(2) + "%",
              });
            }
          } else if (
            method === "POST" &&
            url.includes("backstage/robot/assistant/answerRecommend")
          ) {
            // 监听客服发送消息
            // const { code, data } = JSON.parse(this.response)
            // console.log('code======', code , data , body )
            try {
              // body 是一个JSON字符串，我们解析它
              const requestBody = JSON.parse(body);
              // 判断是不是客服发送的消息
              // console.log('requestBody', requestBody)
              if (requestBody.msg_body_list.length > 0) {
                if (requestBody.msg_body_list[0].sender_role === "2") {
                  const replyContent = requestBody.msg_body_list[0].content || "";
                  const userId = requestBody?.uid || requestBody?.security_uid;
                  console.log("发送消息 dy4", requestBody, userId, replyContent);
                  window.context_bridge.send("reply-customer-message", {
                    messageId: userId,
                    userId,
                    content: replyContent,
                    platformType: "抖店",
                    sendTarget: "dy4",
                    compensate: true,
                  });
                  // const aiReplyInfo = aiReplyCountMap.get(userId)
                  // sendReplyMessage(
                  //   userId,
                  //   replyContent,
                  //   aiReplyInfo,
                  //   requestBody.is_subscribe
                  // )
                }
              }
            } catch (e) {
              // 如果解析失败，可能body本身就是字符串
              if (typeof body === "string") {
                replyContent = body;
              }
              console.error("解析客服发送内容失败:", e);
            }
          } else if (method === "POST" && url.includes("/backstage/getTemplateCardDataV2")) {
            // 监听用户发送订单卡片
            const { code, data } = JSON.parse(this.response);
            if (code === 0) {
              // console.log('data',data)
              const _res = await fetch(
                "https://pigeon.jinritemai.com/backstage/getuserinfo?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&FUSION=true&_v=1.0.1.1852&uids=" +
                  data.uid +
                  "&_ts=" +
                  Date.now(),
                {
                  mode: "cors",
                  credentials: "include",
                },
              ).then((_res) => _res.json());
              if (_res && _res.data && _res.data.length > 0) {
                window.context_bridge.send("update-customer-message-order", {
                  messageId: _res.data[0].screen_name,
                  istihuan: true,
                  orderStatus: data.tag_content,
                });
              }
            }
          } else if (method === "POST" && url.includes("backstage/cmpoent/order/query")) {
            // 拦截用户订单
            const { code, data } = JSON.parse(this.response);
            // 获取这个用户信息
            const dom = document.querySelector('[data-btm-id="a9034.b39122.c0467.d4350"]');

            if (code === 0 && data && data.length > 0) {
              // 判断账单是不是最近30天的
              const time = data[0].pay_time_sec;
              const timeDate = new Date(time * 1000);
              const now = new Date();
              const diffTime = Math.abs(now - timeDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              let orderStatus = null;
              if (diffDays > 30) {
                orderStatus = "暂无订单";
              } else {
                orderStatus = data[0].order_status_desc + data[0].aftersale_sum_status_desc;
              }

              if (dom) {
                const message = {
                  messageId: dom.textContent,
                  orderStatus,
                };
                console.log("[订单拦截] 发送订单状态:", message);
                window.postMessage(
                  {
                    type: "order_status",
                    data: message,
                  },
                  "*",
                );
              }
            } else if (code === 0 && (!data || data.length === 0)) {
              // 没有订单数据
              if (dom) {
                const message = {
                  messageId: dom.textContent,
                  orderStatus: "暂无订单",
                };
                console.log("[订单拦截] 无订单数据:", message);
                window.postMessage(
                  {
                    type: "order_status",
                    data: message,
                  },
                  "*",
                );
              }
            }
          } else if (method === "GET" && url.includes("backstage/currentuser")) {
            const res = JSON.parse(this.response);
            const { code, data } = res;
            // console.info('this.response', this.response)
            if (code === 0) {
              injectShopInfo = {
                id: data?.ShopId.toString(),
                name: data?.ShopName,
                logo: data?.ShopLogo,
                username: data?.CustomerServiceInfo?.screen_name,
                kf: data.CustomerServiceInfo.id,
              };
              window.context_bridge.send("get-shop-info", injectShopInfo);
              window.postMessage({ type: "shop-info", data: injectShopInfo });
            } else if (res?.msg === "登录过期，请重新登录") {
              window.context_bridge.send("account-login-expired");
            }
          } else if (
            method === "POST" &&
            url.includes("https://doudian-sso.jinritemai.com/passport/sso/account_login/v2/")
          ) {
            const data = JSON.parse(this.response);
            console.log("登录结果:", data);
            if (data?.error_code != 0) {
              window.context_bridge.send("account-login-expired");
            }
          } else if (method === "GET" && url.includes("get_current_conversation_list")) {
            try {
              const data = JSON.parse(this.response);

              if (data.data && data.data.length > 0) {
                let unReplyMessageList = [];

                for (let item of data.data) {
                  const { countdown, countdown_time } = item.coreInfoMap || {};

                  if (countdown === "true") {
                    let info = {
                      userId: "",
                      messageId: "",
                      username: "",
                      isTimeout: false,
                      timeNote: "",
                      content: "",
                      avatar: "",
                      timeout: parseInt(countdown_time || 0) + 180,
                    };

                    const buyerMessage = item.msgList
                      ? item.msgList
                          .filter((_item) => {
                            return (
                              _item.messageBody?.ext?.["s:sender_biz_role"] === "Buyer" &&
                              _item.messageBody?.ext?.["attention"] === "true" &&
                              !_item.messageBody?.content?.endsWith("接入")
                            );
                          })
                          .sort((a, b) => {
                            return (
                              parseInt(b.messageBody.createTime || 0) -
                              parseInt(a.messageBody.createTime || 0)
                            );
                          })
                      : [];

                    for (let _item of buyerMessage) {
                      const { uname } = _item.messageBody?.ext || {};

                      if (uname) {
                        info.username = uname;
                        break;
                      }
                    }

                    if (buyerMessage.length > 0) {
                      const lastMessage = buyerMessage[0];

                      try {
                        const { key } = await getIndexedDBFirstChar();
                        const flag = /^\d+$/.test(key || "");

                        info.userId = flag
                          ? lastMessage.messageBody.sender
                          : lastMessage.messageBody?.securitySender;

                        info.messageId = info.userId;
                        info.content = lastMessage.messageBody?.content || "";
                        info.api = true;

                        if (!info.username) {
                          info.username = info.userId;
                        }

                        if (!info.messageId) continue;
                        if (info.content?.endsWith("接入")) continue;

                        info.source = info.source || "url";

                        unReplyMessageList.push(info);
                      } catch (err) {
                        console.log("inner error:", err);

                        // fallback 保底数据
                        if (info.userId) {
                          info.username = info.username || info.userId;
                          info.messageId = info.messageId || info.userId;
                          info.source = "fallback";

                          unReplyMessageList.push(info);
                        }
                      }
                    }
                  }
                }

                console.log("unReplyMessageList", unReplyMessageList);

                // ✔ IPC 强保证发送（最终兜底）
                try {
                  if (unReplyMessageList.length > 0) {
                    window.context_bridge.send("get-customer-message-list", unReplyMessageList);
                  }
                } catch (ipcErr) {
                  console.log("IPC send failed:", ipcErr);
                }
              }
            } catch (e) {
              console.log("parse error:", e);
            }
          }
          // 关键：处理完后移除监听器
          this.removeEventListener("load", xhrListeners.get(this));
          xhrListeners.delete(this);
        } catch (e) {
          console.error("XHR监听器处理出错:", e);
        }
      };
      xhrListeners.set(this, listener);
      this.addEventListener("load", listener);
    }

    // 调用原始的 send 方法
    originalXhrSend.apply(this, arguments);
  };
}

// 星标
safeIpcOn("star", () => {
  const starDom = document
    .querySelector('[data-btm-id="a9034.b39122.c0467.d6168"]')
    .querySelector("span");
  if (starDom) {
    starDom.click();
  }
});
safeIpcOn("get-cookie", () => {
  // 获取cookie
  fetch("https://pigeon.jinritemai.com/backstage/token", {
    mode: "cors",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((res) => {
      // console.log('获取cookie', res)
    });
});

// ====== 新版串行自动回复队列实现 ======
let isProcessingReply = false;
// 延迟函数

// 等待输入框清空（确认发送成功）
async function waitForTextareaClear(textarea, maxWait = 3000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    if (textarea.value === "") {
      return true; // 清空成功，表示发送完成
    }
    await delay(200);
  }

  return false; // 超时，可能发送失败
}

// 实际发送消息的函数
async function sendMessageToDoudian(res) {
  const replyTextarea = document.querySelector('[data-qa-id="qa-send-message-textarea"]');

  if (!replyTextarea) {
    console.log("未找到输入框");
    return;
  }
  // 填入内容
  replyTextarea.value = res.replyContent;
  replyTextarea.dispatchEvent(new Event("input", { bubbles: true }));

  await delay(200);

  // 点击发送按钮
  const sendButton = document.querySelector('[data-qa-id="qa-send-message-button"]');

  if (sendButton) {
    sendButton.click();
  } else {
    // 备用方案：触发回车
    replyTextarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    replyTextarea.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
  }
}
function getCustomerId() {
  const textarea = document.querySelector('textarea[data-qa-id="qa-send-message-textarea"]');
  const match = textarea?.className?.match(/inputArea_(\d+)/);
  return match ? match[1] : "";
}
// 处理单条回复消息
async function handleReplyMessageForDoudian(res) {
  console.log("开始处理消息:", res);

  // 1. 切换到会话标签
  const tabDom = document.querySelector(`[data-qa-id="qa-chat-tab"]`);
  if (tabDom) {
    tabDom.click();
  } else {
    // 兼容新版本
    const newTabDom = document.querySelector(`[class="auxo-badge auxo-badge-top-right"]`);
    const nextSibling = newTabDom?.nextSibling;
    if (nextSibling && nextSibling.textContent.includes("会话")) {
      nextSibling.click();
    }
  }

  await delay(100);
  let nameDom = document.querySelector(`[title="${res.messageId}"]`);
  // 2. 查找目标用户
  const thatTarget = getCustomerId();
  if (thatTarget && (thatTarget == res.messageId || res.userId == thatTarget) && nameDom) {
    if (res.isBottomLineAutoReply) {
      const checkTextContentDom = nameDom.parentElement.parentElement.lastChild.firstChild;
      if (!["时", "分", "秒"].some((item) => checkTextContentDom.textContent.includes(item))) {
        nameDom.click();
        // 轮询查找输入框
        console.log("CLEAR_AI_REPLY_INFO该消息已回复，跳过");
        window.postMessage(
          { type: "CLEAR_AI_REPLY_INFO", data: { messageId: res.messageId } },
          "*",
        );
        return;
      }
    }
    await sendMessageToDoudian(res);
    if (res.imageBase64 || res.imageUrl) {
      await sendImageMessage(res.messageId, res.imageBase64, res.imageMimeType, res.imageUrl);
    }
  } else {
    if (!nameDom) {
      const lowlist = document.querySelectorAll(".auxo-dropdown-trigger");

      if (lowlist) {
        const thatUser = Array.from(lowlist).find((item) => {
          const text = item.innerText;
          return (
            (res.messageId && text.includes(res.messageId)) ||
            (res.userId && text.includes("用户" + res.userId))
          );
        });
        if (thatUser && thatUser.children[0]) {
          thatUser.children[0].click();
          nameDom = thatUser.children[0];
        }
        if (!nameDom) {
          const searchInput = document.querySelector(`[data-qa-id="qa-user-order-search"]`);
          if (searchInput) {
            searchInput.value = res.messageId;
            searchInput.dispatchEvent(new Event("input", { bubbles: true }));
            // 等待500ms
            await new Promise((resolve) => setTimeout(resolve, 500));
            document
              .querySelectorAll(`[data-qa-id="qa-user-order-search-result-item"]`)
              .forEach((item) => {
                const text = item.innerText;
                if (text === res.messageId) {
                  item.firstChild.click();
                }
              });
            await new Promise((resolve) => setTimeout(resolve, 200));
            await sendMessageToDoudian(res);
            // 6. 发送图片
            if (res.imageBase64 || res.imageUrl) {
              await sendImageMessage(
                res.messageId,
                res.imageBase64,
                res.imageMimeType,
                res.imageUrl,
              );
            }
          }
        }
      }
    }

    if (!nameDom) {
      console.log("CLEAR_AI_REPLY_INFO未找到目标用户:", res.messageId);
      window.postMessage({ type: "CLEAR_AI_REPLY_INFO", data: { messageId: res.messageId } }, "*");
      return;
    }

    // 3. 如果是兜底信息，检查是否已回复
    if (res.isBottomLineAutoReply) {
      const checkTextContentDom = nameDom.parentElement.parentElement.lastChild.firstChild;
      console.log("开始处理兜底信息:", checkTextContentDom.textContent);
      if (!["时", "分", "秒"].some((item) => checkTextContentDom.textContent.includes(item))) {
        console.log("CLEAR_AI_REPLY_INFO删除标记");
        window.postMessage(
          { type: "CLEAR_AI_REPLY_INFO", data: { messageId: res.messageId } },
          "*",
        );
        return;
      }
    }

    // 4. 点击目标用户
    nameDom.click();
    await delay(500); // 等待聊天窗口加载

    // 5. 发送消息
    await sendMessageToDoudian(res);

    // 6. 发送图片
    if (res.imageBase64 || res.imageUrl) {
      await sendImageMessage(res.messageId, res.imageBase64, res.imageMimeType, res.imageUrl);
    }
  }
}
// 串行处理消息队列
async function processNextReplyMessage(sendlist) {
  // 队列为空或正在处理中，检查是否完成
  if (isProcessingReply || sendlist.length === 0) {
    // return
    replyMessagekey = null;
    if (replyMessage.isReminderReply) {
      window.postMessage(
        {
          type: "send-reminder",
          value: {
            userId: message.userId,
          },
        },
        "*",
      );
    }

    return;
  }

  isProcessingReply = true;
  const args = sendlist.shift(); // 取出第一条消息
  replyMessage = args;
  await handleReplyMessageForDoudian(replyMessage)
    .catch((err) => console.error("处理消息异常", err))
    .finally(async () => {
      isProcessingReply = false;
      await delay(200); // 等待一小会，避免太快
      processNextReplyMessage(sendlist); // 递归处理下一条
    });
}

// 监听 reply-message 事件
safeIpcOn("reply-message", async (_, args) => {
  console.log("reply-message", args);
  let data = [];
  try {
    // 是不是对象
    if (typeof args === "object") {
      data = [...args];
    } else {
      const sendlist = JSON.parse(args);
      data = sendlist;
    }
    console.log("解析消息", data);
  } catch {
    if (args.isBottomLineAutoReply) {
      data = [...args];
    }
  }
  if (data.length > 0) {
    const item = data[0];
    console.log("查看发送", shopInfo, sendInsert, item);
    if (item && (item.userId || item.messageId) && shopInfo.id) {
      if (item?.imageBase64 || item?.imageUrl) {
        await sendImage(
          item.imageBase64,
          item.userId || item.messageId,
          shopInfo.id,
          item.imageUrl,
        );
        await delay(500);
      }
      const sendreplyMessage = {
        ...item,
        isReminderReply: item.isReminderReply || false,
        isAiInviteReply: item.isAiInviteReply || false,
        isAiAutoReply: !item.isBottomLineAutoReply,
        isBottomLineAutoReply: item.isBottomLineAutoReply || false,
      };
      // 如果needOrder >=3的话就主动去获取一次商品信息
      if (item?.needOrder && item?.needOrder >= 3) {
        // 主动拿一次订单和商品并存在db里面
      }
      // window.postMessage(
      //   {
      //     type: 'SET_AI_REPLY_INFO',
      //     data: sendreplyMessage
      //   },
      //   '*'
      // )

      window.postMessage({
        type: "send-message",
        data: {
          shopId: shopInfo.id,
          userId: item.userId || item.messageId,
          content: item.replyContent,
        },
      });
      console.log("发送消息:", sendreplyMessage);

      waitSendSuccess(sendreplyMessage.messageId).then((res) => {
        sendreplyMessage.shopMsgTotal = getMsgTotal() || 0;
        console.log("发送成功:", res);
        ipcRenderer.send("get-customer-callback-result", sendreplyMessage);
        replyMessagekey = null;
      });
    }
    // else {
    //   for (let item of data) {
    //     const sendreplyMessage = {
    //       ...item,
    //
    //       isReminderReply: item.isReminderReply || false,
    //       isAiInviteReply: item.isAiInviteReply || false,
    //       isAiAutoReply: !item.isBottomLineAutoReply,
    //       isBottomLineAutoReply: item.isBottomLineAutoReply || false
    //     }
    //     window.postMessage(
    //       {
    //         type: 'SET_AI_REPLY_INFO',
    //         data: sendreplyMessage
    //       },
    //       '*'
    //     )
    //   }
    //   processNextReplyMessage(data)
    // }
  }
  // 调用串行处理函数
});
// 改进错误处理
window.addEventListener("error", (event) => {
  console.error("全局错误", event);
  reportGlobalPreloadError("全局错误", event.error || event);
});
window.addEventListener("unhandledrejection", (event) => {
  console.error("未捕获的promise错误", event);
  reportGlobalPreloadError("未捕获的promise错误", event.reason || event);
});

// 添加清除所有计时器的函数
function clearAllTimers() {
  Object.values(timerIds).forEach((id) => {
    if (id) clearInterval(id);
  });
  // 🔥 清理批量发送定时器
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  // 🔥 发送剩余的待发送消息
  if (pendingMessages.length > 0) {
    sendMessagesBatch();
  }
  timerIds = {
    messageCheck: null,
    statusCheck: null,
    unReplyMessage: null,
    shopObserver: null,
    cleanup: null,
    memoryCheck: null,
    batchSend: null,
  };
}
// 在页面卸载时清除所有计时器
window.addEventListener("beforeunload", clearAllTimers);
// 主窗口监听消息

// 检测输入框状态
safeIpcOn("getShopInputStatus", (_, shopId) => {
  try {
    // 启动用户活动检查定时器
    startUserActivityTimer();

    // 获取输入框元素
    const replyTextarea = document.querySelector('[data-qa-id="qa-send-message-textarea"]');
    if (replyTextarea) {
      // 检查输入框是否有内容
      const hasContent = replyTextarea.value && replyTextarea.value.trim().length > 0;

      // 检查用户是否正在操作（窗口有焦点且有鼠标活动）
      const userIsOperating = (windowHasFocus && isUserOperating) || hasContent;

      // console.log(`店铺 ${shopId} 状态检测结果:`, {
      //   hasContent: hasContent ? '有内容' : '无内容',
      //   windowHasFocus: windowHasFocus ? '有焦点' : '无焦点',
      //   isUserOperating: isUserOperating ? '用户操作中' : '用户未操作',
      //   userIsOperating: userIsOperating
      //     ? '最终判断:操作中'
      //     : '最终判断:未操作',
      //   timeSinceLastMouseActivity: timeSinceLastMouseActivity,
      //   timeSinceLastKeyboardActivity: timeSinceLastKeyboardActivity
      // })
      const currentUserId = document.querySelector('[data-btm-id="a9034.b39122.c0467.d4350"]');
      // 发送输入框状态回主进程，包含用户操作状态
      ipcRenderer.send("shopInputStatus", {
        shopId: shopId,
        hasContent: userIsOperating,
        currentUserId: currentUserId?.textContent,
      });
    } else {
      console.log(`店铺 ${shopId} 未找到输入框元素`);
      // 如果找不到输入框，默认认为没有内容，用户未操作
      ipcRenderer.send("shopInputStatus", {
        shopId: shopId,
        hasContent: false,
        userIsOperating: false,
      });
    }
  } catch (error) {
    console.error(`检测店铺 ${shopId} 输入框状态失败:`, error);
    // 出错时默认认为没有内容，用户未操作
    ipcRenderer.send("shopInputStatus", {
      shopId: shopId,
      hasContent: false,
      userIsOperating: false,
    });
  }
});

//  续期cookie
const _renewCookie = () => {
  setInterval(() => {
    fetch(
      "https://fxg.jinritemai.com/byteshop/loginv2/chooseshop?subject_aid=4966&loginSourceV2=doudian_pc",
      {
        method: "GET",
        credentials: "include",
      },
    );
  }, HEARTBEAT_INTERVAL);
};

safeIpcOn("currnt-page", (_, key) => {
  _key = key;
  // console.log('currnt-page========', _key)
  if (_key) {
    // key为true时暂停定时器
    ipcRenderer.send("get-currnt-page", false);
    clearTimeout(hearTimer); // 清除当前定时器

    // console.log('暂停========', key)
  } else {
    // sendHeartbeat

    // console.log('继续11111111')

    _sendHeartbeat(currentInterval);
    return;
  }
});

const _sendHeartbeat = (time) => {
  if (hearTimer) {
    clearTimeout(hearTimer);
  }
  hearTimer = setTimeout(async () => {
    // console.log('执行11111========', _key)
    if (_key && info) return;
    await ipcRenderer.send("reload-page");
    // console.log('执行========22222222', _key)
    time = 0;
    // location.reload();
    _sendHeartbeat();
  }, time || currentInterval); // 使用临时变量
};
safeIpcOn("reload-page", () => {
  // location.reload()
  ipcRenderer.send("reload-page");
});

//逆向

function getCookieValue(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }
  return null;
}

// 用过dom=获取订单
const _getOrderStatusByDom = () => {
  const ecomCollapseHeader = document.querySelector(".ecom-collapse-header");
  // console.log('ecomCollapseHeader', ecomCollapseHeader)
  let tag = null;
  if (ecomCollapseHeader) {
    // console.log('timecont', timecont)

    try {
      const _tagcont = document.querySelector(".ecom-dorami-tag-group-wrapper");
      console.log("_tagcont", _tagcont);
      if (_tagcont) {
        const tagcont = _tagcont.querySelectorAll(".sp-tag-content");
        // console.log('tagcont', tagcont)
        tag = Array.from(tagcont)
          .map((item) => item.textContent.trim())
          .join();
      } else {
        // 兼容新版,获取组后的一个dev中的第一个dev中的第二个dev
        // tag =
        //   ecomCollapseHeader.lastChild.firstChild.firstChild.nextSibling.textContent.trim()
        tag = ecomCollapseHeader.lastChild.firstChild.firstChild.textContent.trim();
        // console.log(
        //   ' ecomCollapseHeader.lastChild.firstChild.firstChild.nextSibling.textContent.trim()',
        //   ecomCollapseHeader.lastChild.firstChild.firstChild.nextSibling.textContent.trim()
        // )
        // console.log(
        //   ' ecomCollapseHeader.lastChild.firstChild.firstChild.nextSibling.textContent.trim()',
        //   ecomCollapseHeader.lastChild.firstChild.firstChild.textContent.trim()
        // )
      }
    } catch (err) {
      console.log("订单dom 错误", err);
    }
  } else {
    tag = "暂无订单";
  }
  // 优先使用接口数据（如果用户匹配）

  return tag;
};

// 获取用户列表
function getMsgList() {
  try {
    const result = [];

    // 新增：获取用户名
    function getUsername() {
      const textarea = document.querySelector('textarea[data-qa-id="qa-send-message-textarea"]');
      const placeholder = textarea?.getAttribute("placeholder") || "";
      const match = placeholder.match(/^发送给 (.+?)，使用Enter/);
      return match ? match[1] : "";
    }

    function extractTextFromTabSync() {
      try {
        const footprintTab = document.querySelector("#rc-tabs-0-tab-footprint");
        footprintTab?.click();

        const consultTab = document.querySelector("#rc-tabs-0-tab-combination");
        consultTab?.click();

        const targetEl = document.querySelector("._2af0c552fa1648884aa36735c8775c6b-less");
        return targetEl?.innerText?.trim() || "";
      } catch (err) {
        console.warn("extractTextFromTabSync 执行失败:", err);
        return "";
      }
    }

    function detectSender(msg) {
      const msgBody = msg.querySelector(".iD7SHBvMhm4OhfCsBGr1");
      if (msgBody) {
        if (msgBody.classList.contains("messageIsMe")) return "assistant";
        if (msgBody.classList.contains("messageNotMe")) return "user";
      }
      const notMe = msg.querySelector(".messageNotMe");
      const isMe = msg.querySelector(".messageIsMe");
      if (notMe) return "user";
      if (isMe) return "assistant";

      const directionBox = msg.querySelector(".Ie29C7uLyEjZzd8JeS8A");
      if (directionBox) {
        const style = window.getComputedStyle(directionBox);
        if (style.flexDirection === "row") return "user";
        if (style.flexDirection === "row-reverse") return "assistant";
      }

      return "user";
    }

    const userId = getCustomerId();
    const messageId = getUsername(); // 获取当前激活用户名
    const username = messageId;

    const messages = Array.from(document.querySelectorAll(".msgItemWrap")).filter((msg) => {
      const dataId = msg.querySelector("[data-id]")?.getAttribute("data-id") || "";
      return !dataId.includes("_Welcome_");
    });

    let shopTitle = "";
    let lastOrderStatus = "暂无订单";

    messages.forEach((msg) => {
      try {
        const role = detectSender(msg);
        const timeEl = msg.querySelector(".Vry36sSLfjhqZr9MfWnO .O4UWWFoQxgMq4AWHMq25");
        const timeText = timeEl ? timeEl.textContent.trim() : "";
        let content = "";
        let isOrder = false;
        let orderStatus = "暂无订单";

        const transferText = msg.innerText.trim();
        if (transferText.includes("将该会话转移给") || transferText.includes("将会话转移给您")) {
          result.push({
            role: "user",
            time: undefined,
            shopTitle: "",
            content: "",
            userId,
            username, // 加入用户名
            messageId,
            isOrder: false,
          });
          return;
        }
        if (
          (transferText.includes("消息") && transferText.includes("系统")) ||
          transferText.includes("自动消息") ||
          transferText.includes("由机器人发送")
        ) {
          return;
        }

        const videoBox = msg.querySelector(".auxo-dropdown-trigger.I7ZfagWiu5KfRxXX0opn");
        if (videoBox) {
          const videoImgs = Array.from(videoBox.querySelectorAll("img"));
          const videoImg = videoImgs.find((img) => !img.src.startsWith("data:"));
          const videoUrl = videoImg?.src || "";
          const videoTimeEl = msg.querySelector(".UxSmMdIBLhWInjTN6l7s .wi4ZmACMgatEJ1pWdEw1");
          const videoDuration = videoTimeEl?.textContent.trim() || "";

          result.push({
            rple,
            time: timeText,
            shopTitle,
            content: "用户发送了视频",
            videoUrl,
            videoDuration,
            userId,
            username, // 加入用户名
            messageId,
            isOrder,
            orderStatus: lastOrderStatus || "",
          });
          return;
        }

        const imgEl = msg.querySelector("img.auxo-dropdown-trigger");
        if (imgEl && imgEl.src && !imgEl.src.startsWith("data:")) {
          result.push({
            role,
            time: timeText,
            shopTitle,
            content: "用户发送了图片",
            imageUrl: imgEl.src,
            userId,
            username, // 加入用户名
            messageId,
            isOrder: false,
            orderStatus: lastOrderStatus || "",
          });
          return;
        }

        const orderCard = msg.querySelector(".chatd-card-main");
        if (orderCard) {
          const textContent = orderCard.innerText;
          // const orderIdMatch = textContent.match(/订单号(\d+)/)
          // console.log('orderIdMatch-=============', orderIdMatch)
          // if (orderIdMatch) {
          //   orderStatus = orderIdMatch[1]
          //   lastOrderStatus = orderStatus
          //   isOrder = true
          // }
          // 🔥 新增：提取订单状态（如"退款成功"）
          const lines = textContent.trim().split("\n");

          // 第一行：提取订单号
          // const orderIdMatch = lines[0]?.match(/订单号(\d+)/)
          // if (orderIdMatch) {
          //   lastOrderId = orderIdMatch[1]
          //   isOrder = true
          // }

          // 第二行：提取订单状态（去掉"订单"前缀）
          if (lines[1] && lines[1].startsWith("订单")) {
            orderStatus = lines[1].replace(/^订单/, "").trim(); // "退款成功"
            lastOrderStatus = orderStatus;
            isOrder = true;
            console.log("订单状态:", orderStatus);
          }

          const allTitleSpans = orderCard.querySelectorAll(
            ".pigeon-card-place-holder-text .content.max-line span",
          );
          // if (isOrder && allTitleSpans.length >= 3) {
          //   if (allTitleSpans[2].textContent.trim().includes('您看中的商品'))
          //     return
          //   if (allTitleSpans[2].textContent.trim().includes('退款')) return
          //   shopTitle = allTitleSpans[2].textContent.trim()
          //   content = '用户发送订单卡片'
          // } else
          if (!isOrder && allTitleSpans.length >= 2) {
            if (allTitleSpans[1].textContent.trim().includes("您看中的商品")) return;
            if (allTitleSpans[1].textContent.trim().includes("退款")) return;
            shopTitle = allTitleSpans[1].textContent.trim();
            if (shopTitle.includes("已售")) {
              if (allTitleSpans[0].textContent.trim().includes("您看中的商品")) return;
              if (allTitleSpans[0].textContent.trim().includes("退款")) return;
              shopTitle = allTitleSpans[0].textContent.trim();
            }
            content = "用户咨询商品：" + shopTitle;
          }

          result.push({
            role,
            time: timeText,
            shopTitle,
            content,
            userId,
            username, // 加入用户名
            messageId,
            isOrder,
            orderStatus,
          });
          return;
        }

        const spans = msg.querySelectorAll(".content.max-line span");
        if (spans.length > 1 && spans[0].innerText.includes("用户正在查看商品")) {
          if (spans[1].innerText.trim().includes("您看中的商品")) return;
          shopTitle = spans[1].innerText.trim();
        }

        const msgBody = msg.querySelector(".iD7SHBvMhm4OhfCsBGr1");
        if (msgBody) {
          content = msgBody.innerText.trim();
        }

        if (timeText || shopTitle || content) {
          result.push({
            role,
            time: timeText,
            shopTitle,
            content,
            userId,
            username, // 加入用户名
            messageId,
            isOrder,
            orderStatus: lastOrderStatus || "",
          });
        }
      } catch (e) {
        console.warn("单条消息处理异常：", e);
      }
    });

    if (shopTitle !== "") {
      result.forEach((item) => (item["shopTitle"] = shopTitle));
    }

    if (lastOrderStatus !== "") {
      result.forEach((item) => {
        if (!item.orderStatus) item.orderStatus = lastOrderStatus;
      });
    } else {
      lastOrderStatus = _getOrderStatusByDom();
      result.forEach((item) => {
        if (!item.orderStatus) item.orderStatus = lastOrderStatus;
      });
    }
    console.log("result", result);
    return result;
  } catch (e) {
    console.error("脚本整体执行失败：", e);
    return JSON.stringify([]);
  }
}
// 轮询检查输入框是否可用
const checkAndFocusInput = (maxAttempts = 50, interval = 100) => {
  let attempts = 0;
  const timer = setInterval(() => {
    const input = document.querySelector(`[data-qa-id="qa-send-message-textarea"]`);

    if (input) {
      input.focus();
      input.blur();
      input.focus();
      clearInterval(timer);
    } else if (++attempts >= maxAttempts) {
      console.log("input not found after", maxAttempts, "attempts");
      clearInterval(timer);
    }
  }, interval);
};

// 转接子账号或者星标
safeIpcOn("goto-human-reply", async (_, arg) => {
  const trigger = document.querySelector('[data-qa-id="qa-transfer-conversation"]');
  if (trigger) {
    trigger.click();
  }
  await ms_delay(500);
  const input = document.querySelector(`input[placeholder=请输入在线客服昵称]`);
  if (input) {
    input.value = arg.subAccount;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
  await ms_delay(500);
  const candidates = document.querySelectorAll('[data-qa-id="qa-transfer-customer"]');
  if (candidates.length > 0) {
    candidates[0].click();
    await ms_delay(500);
    const confirmDialog = document.querySelector(".sp-popconfirm-content");
    const confirmText = confirmDialog?.textContent?.trim();
    if (confirmText && confirmText.includes("存在未完成待办")) {
      const confirmButton = document.querySelector(".auxo-btn-primary span");
      if (confirmButton && confirmButton.textContent.includes("仍要转接")) {
        confirmButton.click();
        console.log("已点击 '仍要转接'");
      }
    }
  }
});
const ms_delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

let loopCount = 0;
let loginOutFlag = false;
async function pollUnReplyMessage() {
  try {
    const reloadLogin = document.querySelector('[data-btm="c852687"]');

    if (reloadLogin) {
      const reloadLoginClickTarget = reloadLogin.querySelector(
        'span[style="color: rgb(26, 102, 255);"]',
      );
      if (reloadLoginClickTarget) reloadLoginClickTarget?.click();
    }
  } catch (e) {
    console.warn("pollUnReplyMessage error:", e);
  }

  try {
    loopCount++;
    if (loopCount >= 18) {
      window.postMessage({
        type: "pull-message",
      });
      loopCount = 0;
    }
    const nodes = document.querySelectorAll('.sp-icon-parcel[size="16"]');
    // console.log('nodes', nodes)
    for (const node of nodes) {
      // console.log('node:::::', node)

      try {
        const parent = node.parentElement;
        if (!parent) continue;

        const textEl = parent.children?.[1];
        if (!textEl) continue;

        const text = textEl.textContent?.trim();
        if (!text) continue;

        if (text.includes("登录已过期") && !loginOutFlag) {
          ipcRenderer.send("account-login-expired");
          console.log("登录已过期===========");
          loginOutFlag = true;
          break; // 命中一个就够了，避免重复发
        }
      } catch (e) {
        console.warn("unLogin detect error:", e);
      }
    }
    // const activeChatTab = document.querySelector('#rc-tabs-0-tab-current')
    // console.log('shopInfo', shopInfo.id)
    let sendMessageList = [];
    if (shopInfo.id) {
      const nodes = document.querySelectorAll('[data-qa-id="qa-conversation-chat-item"]');
      // console.log('nodes11111', nodes)
      let urlflag = false;
      for (const node of nodes) {
        if (node.children[0]) {
          const stringHtml = node.innerHTML;
          // console.log('stringHtml', stringHtml, timeReg.test(stringHtml))
          if (timeReg.test(stringHtml)) {
            // console.log('命中======')
            const nameDom = node.querySelector("[title]:not(.auxo-scroll-number)"); // 不是角标
            // console.log('命中节点======', nameDom)
            if (nameDom) {
              // 拥有 title 属性  有则为正常版本
              const username = nameDom.getAttribute("title"); // 用户名称
              const dom = node?.children[2]?.children[1]?.children[1];

              if (dom) {
                const content = dom.textContent;
                const timedom = node?.children[2].children[0].children;
                // console.log('dom=========',timedom)
                let timeout = Math.floor(new Date() / 1000);
                if (timedom[timedom.length - 1].textContent) {
                  timeout = timedom[timedom.length - 1].textContent;
                }
                const img = node.querySelector("[src]");
                // console.log('node img===============',img)

                const avatar = img?.src;
                console.log("发送消息", username, content, timeout);
                const sendMessage = await GetSendMessage.create({
                  userId: "",
                  username,
                  content,
                  timeout,
                  avatar,
                });
                if (!sendMessage?.userId) {
                  // 兼容 狗屎抖店没有 关于userId db 的情况  使用接口
                  if (!urlflag) {
                    getUnReplyMessage();
                    urlflag = true;
                  }
                }

                console.log("发送消息", username, content, timeout, sendMessage);
                if (
                  sendMessage.messageId
                  // &&/^\d+$/.test(sendMessage.messageId)
                )
                  sendMessageList.push(sendMessage);
              }
            } else {
              // 大概率为 飞鸽低版本
              // console.log('可能为低版本=====》', node.children[2])
              if (node.children[2]) {
                const contentBox = node.children[2];
                const username = contentBox.children[0].querySelector("span:first-child");
                const dom = contentBox?.children[1]?.children[1];

                if (username && username.textContent) {
                  let userId = "";
                  if (/^用户.+$/.test(username?.textContent)) {
                    userId = username.textContent.split("用户")[1];
                    console.log("用户id", userId, username.textContent.split("用户"));
                  }
                  let sendMessage = await GetSendMessage.create({
                    userId,
                    username: username.textContent,
                    content: dom.textContent,
                    timeout:
                      contentBox.children[0]?.children[2]?.textContent ||
                      Math.floor(Date.now() / 1000),
                  });

                  console.log("dom=========", sendMessage, shopBotStatus);
                  sendMessageList.push(sendMessage);
                }
              }
            }
          }
        }
      }
    }
    console.log("sendMessageList", sendMessageList);
    const total = getMsgTotal();
    ipcRenderer.send("get-message-total", total);
    if (sendMessageList.length) {
      sendMessageList = sendMessageList.filter((item) => !keylock.get(item?.messageId));
      ipcRenderer.send("get-customer-message-list", sendMessageList);
    }
  } catch (err) {
    console.error("pollUnReplyMessage error:", err);
    // 出错不停止，交给下一轮
  }

  setTimeout(pollUnReplyMessage, 10 * 1000); // 开始降频
}

// ============ 图片发送功能 ============
// 监听图片发送消息
safeIpcOn("send-image-message", async (_, args) => {
  console.log("[图片发送] 收到图片发送请求:", args);
  const { messageId, imageBase64, imageMimeType, imageUrl } = args;

  try {
    await sendImageMessage(messageId, imageBase64, imageMimeType, imageUrl);
    console.log("[图片发送] 图片发送成功");
  } catch (error) {
    console.error("[图片发送] 图片发送失败:", error);
  }
});

// 发送图片消息
async function sendImageMessage(messageId, imageBase64, imageMimeType, imageUrl) {
  // // 1. 先切换到对应会话
  // const dom = document.querySelector(
  //   `.chat-item-box[data-random^="${messageId}"]`
  // )

  // if (!dom) {
  //   console.error('[图片发送] 未找到对应的消息DOM:', messageId)
  //   return false
  // }

  // dom.dispatchEvent(mouseDown)
  // dom.dispatchEvent(mouseUp)
  // await ms_delay(500)

  // 2. 找到隐藏的图片上传 input
  const fileInput = document.querySelector('input[type="file"][accept*=".png"]');
  if (!fileInput) {
    console.error("[图片发送] 未找到图片上传input");
    return false;
  }

  let blob;
  let mimeType = imageMimeType;
  if (imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status}`);
    }
    blob = await response.blob();
    mimeType = mimeType || blob.type || "image/jpeg";
  } else if (imageBase64) {
    const byteCharacters = atob(imageBase64);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    blob = new Blob([byteArray], { type: mimeType });
  } else {
    console.error("[图片发送] 缺少图片数据");
    return false;
  }
  const ext = (mimeType || "image/jpeg").split("/")[1] || "jpg";
  const file = new File([blob], `image_${Date.now()}.${ext}`, {
    type: mimeType,
  });

  console.log("[图片发送] 创建文件成功:", file.name, file.size, "bytes");

  // 4. 用 DataTransfer 设置文件
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;

  // 5. 触发 change 事件
  fileInput.dispatchEvent(new Event("change", { bubbles: true }));

  console.log("[图片发送] 已触发 change 事件");

  let checkCount = 0;
  const maxChecks = 20; // 最多检测20次，共2秒
  const checkInterval = setInterval(() => {
    checkCount++;
    const modal = document.querySelector('[data-qa-id="qa-send-img-popup-submit"]');
    if (modal) {
      modal.click();
      clearInterval(checkInterval);
      return;
    }
    if (checkCount >= maxChecks) {
      clearInterval(checkInterval);
      console.log("[图片发送] 弹窗检测超时");
    }
  }, 100);

  return true;
}
function getPreviousByPrefix(fileArray, prefix) {
  for (let i = 0; i < fileArray.length; i++) {
    if (fileArray[i].startsWith(prefix)) {
      return i > 0 ? fileArray[i - 1] : null;
    }
  }
  return null; // 没找到匹配
}

ipcRenderer.on("quality-socket-message", (event, args) => {
  console.log("ws 接收消息", args);
  const base = new Date();
  base.setDate(base.getDate() - 2);

  const start = new Date(base.setHours(0, 0, 0, 0)).getTime();
  const end = new Date(base.setHours(23, 59, 59, 999)).getTime();
  const data = {
    ...args,
    startTime: start,
    endTime: end,
  };
  window.postMessage({
    type: "quality-socket-message",
    data: data,
  });
});

const original = navigator.serviceWorker?.register;
if (original) {
  navigator.serviceWorker.register = () => Promise.reject(new Error("blocked"));
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) {
      console.log("卸载serverWorker unregistering", reg);
      if (reg?.active?.scriptURL == "https://im.jinritemai.com/sw_v1.js") {
        reg.unregister();
        ipcRenderer.send("reload-shop");
      }
    }
  });
}

//  获取db的值
function getIndexedDBValue(key, tiemr = 1000) {
  const dbName = "buyerInfo";
  const storeName = "keyvaluepairs";

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const request = indexedDB.open(dbName);

        request.onerror = () => {
          reject(request.error);
        };

        request.onsuccess = () => {
          try {
            const db = request.result;

            // 关键
            if (!db.objectStoreNames.contains(storeName)) {
              db.close();

              reject(new Error(`objectStore "${storeName}" not found`));

              return;
            }

            const transaction = db.transaction(storeName, "readonly");

            const store = transaction.objectStore(storeName);

            const getRequest = store.get(key);

            getRequest.onsuccess = () => {
              resolve(getRequest.result);
              db.close();
            };

            getRequest.onerror = () => {
              reject(getRequest.error);
              db.close();
            };
          } catch (e) {
            reject(e);
          }
        };
      } catch (e) {
        reject(e);
      }
    }, tiemr);
  });
}
function getUserIdByUsername(avatar, username) {
  const dbName = "buyerInfo";
  const storeName = "keyvaluepairs";

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      let db = null;

      try {
        db = request.result;

        // store 不存在
        if (!db.objectStoreNames.contains(storeName)) {
          db.close();
          resolve(null);
          return;
        }

        const transaction = db.transaction(storeName, "readonly");

        const store = transaction.objectStore(storeName);

        // 不要 getAll
        const cursorRequest = store.openCursor();

        cursorRequest.onerror = () => {
          db.close();
          reject(cursorRequest.error);
        };

        cursorRequest.onsuccess = (event) => {
          try {
            const cursor = event.target.result;

            // 遍历结束
            if (!cursor) {
              db.close();
              resolve(null);
              return;
            }

            const item = cursor.value;

            if (item?.value?.avatar === avatar) {
              const id = item?.value?.id;

              db.close();

              resolve(id || null);

              return;
            } else if (!avatar && item?.value?.username === username) {
              const id = item?.value?.id;

              db.close();

              resolve(id || null);

              return;
            }

            cursor.continue();
          } catch (e) {
            db.close();
            reject(e);
          }
        };
      } catch (e) {
        if (db) db.close();

        reject(e);
      }
    };
  });
}
// 等待
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// 只获取 第一位
function getIndexedDBFirstChar(timer = 1000) {
  const dbName = "buyerInfo";
  const storeName = "keyvaluepairs";

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const request = indexedDB.open(dbName);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        let db;

        try {
          db = request.result;

          // 关键：防炸点
          if (!db.objectStoreNames.contains(storeName)) {
            db.close();
            resolve(undefined);
            return;
          }

          const tx = db.transaction(storeName, "readonly");
          const store = tx.objectStore(storeName);
          const cursorRequest = store.openCursor();

          cursorRequest.onerror = () => {
            db.close();
            reject(cursorRequest.error);
          };

          cursorRequest.onsuccess = (e) => {
            const cursor = e.target.result;

            const result = cursor ? { key: cursor.key, value: cursor.value } : undefined;

            db.close();
            resolve(result);
          };
        } catch (e) {
          if (db) db.close();
          reject(e);
        }
      };
    }, timer);
  });
}
//  获取消息数量
function getMsgTotal() {
  const waitReply = document.querySelector('[data-btm="message_group_name_waitReply"]'); // 3 分钟
  const overThreemins = document.querySelector('[data-btm="message_group_name_overThreemins"]'); // 超时

  let waitReplyNum = 0;
  let overThreeminsNum = 0;
  if (waitReply) {
    waitReplyNum = getnumber(waitReply);
  }
  if (overThreemins) {
    overThreeminsNum = getnumber(overThreemins);
  }

  return overThreeminsNum + waitReplyNum;
}

function getnumber(dom) {
  const parent = dom.parentElement;
  if (parent) {
    const match = parent.textContent.match(/\((\d+)\)/);
    if (match) {
      return Number(match[1]);
    }
  }
  return 0;
}

//  发送粘贴
ipcRenderer.on("paste-to-shop", (event, text) => {
  const input = document.querySelector('[data-qa-id="qa-send-message-textarea"]');
  if (!input)
    // 未找到 #replyTextarea 元素
    return;
  input.value = text;

  // 触发 input 事件（如果页面有监听 input 事件做实时处理）
  input.dispatchEvent(new Event("input", { bubbles: true }));

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

ipcRenderer.on("open-order-id", (event, orderId) => {
  console.log("orderId=================", orderId);

  const searchInput = document.querySelector(`[data-qa-id="qa-user-order-search"]`);

  if (searchInput) {
    searchInput.value = orderId;
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    // 等待500ms
    setTimeout(() => {
      document
        .querySelectorAll(`[data-qa-id="qa-user-order-search-result-item"]`)
        .forEach((item) => {
          const text = item.innerText;
          console.log("text", text);
          if (text?.includes(orderId)) {
            // console.log('item', item)
            item.firstChild.click();
            return;
          }
        });
    }, 800);
  }
});

let audioCtx = null;
let oscillator = null;
let gainNode = null;

function startAudioKeepAlive() {
  if (audioCtx && audioCtx.state === "running") return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  oscillator = audioCtx.createOscillator();
  gainNode = audioCtx.createGain();

  // 关键：静音（但链路存在）
  gainNode.gain.value = 0;

  oscillator.type = "sine";
  oscillator.frequency.value = 200; // 随便一个频率

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();

  console.log("音频保活启动");
}

function resumeAudio() {
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
    console.log("音频恢复");
  }
}

// AI转人工星标
safeIpcOn("ai-transfer-human-mark", (_, args) => {
  console.log("AI转人工星标", args);
  window.postMessage(
    {
      type: "set-user-tag",
      data: {
        uid: args.userId,
      },
    },
    "*",
  );
});

// AI转人工转接子账号
safeIpcOn("ai-transfer-human-sub", async (_, args) => {
  console.log("AI转人工转接子账号", args);
  const serviceId =
    args.serviceId || (args.subAccount ? await getSubAccountIdByName(args.subAccount) : "");

  if (!serviceId) {
    console.warn("[抖店] 未找到匹配的客服账号:", args.subAccount);
    return;
  }

  window.postMessage({
    type: "move-to-chat",
    data: {
      conversationId: args.originConversationId,
      serviceId,
    },
  });
});

// 根据子账号名字返回子账号id
const getSubAccountIdByName = async (subAccountName) => {
  if (!subAccountName) {
    return null;
  }

  const res = await fetch("https://pigeon.jinritemai.com/backstage/getCanAssignStaffList", {
    method: "GET",
    credentials: "include",
  }).then((res) => res.json());

  const list = Array.isArray(res?.data) ? res.data : [];
  const targetName = String(subAccountName).trim();
  const matchedItem = list.find((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    return [item.staffName, item.staff_username]
      .filter(Boolean)
      .some((value) => String(value).trim() === targetName);
  });

  return matchedItem?.staffId || null;
};

//  将base64位图片 转为 blob
function base64ToBlob(base64) {
  const [meta, data] = base64.split(",");
  const mime = meta.match(/:(.*?);/)[1];
  const buffer = Buffer.from(data, "base64");
  return new Blob([buffer], { type: mime });
}
//  读取图片 信息 宽高
const getImageInfo = (blob) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
      URL.revokeObjectURL(url);
    };

    img.onerror = reject;
    img.src = url;
  });
};
//  封装方法 图片发送
const sendImage = async (base64, userId, shopId, imageUrl) => {
  const blob = imageUrl
    ? await fetch(imageUrl).then((response) => {
        if (!response.ok) throw new Error(`下载图片失败: ${response.status}`);
        return response.blob();
      })
    : base64ToBlob(base64);
  const { width, height } = getImageInfo(blob);
  const form = new FormData();
  form.append("images[]", blob, "1.png");

  fetch(`https://pigeon.jinritemai.com/backstage/uploadimg?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&`, {
    method: "POST",
    credentials: "include",
    body: form,
  })
    .then((r) => r.json())
    .then(async (res) => {
      console.log("res===========>", res);
      if (res.code == 0) {
        await fetch(
          `https://pigeon.jinritemai.com/backstage/getURLForURI?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&uri=${res.data[0].uri}.png`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const url = res.data[0].url;
        console.log("res===========>", url, shopInfo);
        window.postMessage(
          {
            type: "send-img",
            data: {
              url: url,
              userId: userId,
              shopId: shopId,
              width,
              height,
              size: blob.size,
            },
          },
          "*",
        );
      }
    });
};

// 获取用户聊天记录
ipcRenderer.on("get-user-chatting-records", async (e, args) => {
  console.log("get-user-chatting-records", args);
});

// 获取售后订单统计
safeIpcOn("get-after-sale-total-order", async (_, arg) => {
  console.log("get-after-sale-total-order==============>", arg);
  const info = arg;
  try {
    const monthStart = new Date(info.info.month[0]);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(info.info.month[1]);
    monthEnd.setHours(23, 59, 59, 999);
    const startTimeSec = Math.floor(monthStart.getTime() / 1000);
    const endTimeSec = Math.floor(monthEnd.getTime() / 1000);
    console.log("startTimeSec============>", startTimeSec, endTimeSec);

    // 1. 获取总售后工单
    const totalCountRes = await fetch("https://fxg.jinritemai.com/after_sale/pc/list", {
      method: "POST",
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        after_sale_status: "",
        after_sale_type: "",
        aftersale_platform_source: "fxg",

        apply_time_end: endTimeSec,
        apply_time_start: startTimeSec,
        conf_version: "v12",
        negotiate_status: "",
        order_by: ["status_deadline asc"],
        order_flag: [],
        order_logistics_state: [],
        page: 1,
        pageSize: 10,
        reason: "",
        search_receiver: "",
      }),
    }).then((res) => res.json());
    console.log("totalCountRes", totalCountRes);

    // 2. 获取未发货仅退款
    const awaitingShipmentRefundRes = await fetch("https://fxg.jinritemai.com/after_sale/pc/list", {
      method: "POST",
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        after_sale_status: "",
        after_sale_type: "presale_all",
        aftersale_platform_source: "fxg",
        apply_time_end: endTimeSec,
        apply_time_start: startTimeSec,
        conf_version: "v12",
        negotiate_status: "",
        order_by: ["status_deadline asc"],
        order_flag: [],
        order_logistics_state: [],
        page: 1,
        pageSize: 10,
        reason: "",
        search_receiver: "",
      }),
    }).then((res) => res.json());
    console.log("awaitingShipmentRefundRes", awaitingShipmentRefundRes);

    // 3. 获取工单条数
    const workOrderRes = await fetch("https://pigeon.jinritemai.com/backstage/task_order/list", {
      method: "POST",
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        createTimeStart: startTimeSec,
        createTimeEnd: endTimeSec,
        page: 1,
        businessType: 0,
        pageSize: 10,
        queryForMixTaskOrder: true,
      }),
    }).then((res) => res.json());
    console.log("workOrderRes", workOrderRes);

    const applyCount = totalCountRes.total || 0; // 总售后工单数
    const refundOnlyCount = awaitingShipmentRefundRes.total || 0; // 未发货仅退款
    const workOrderCount = workOrderRes.data?.taskOrderStatusConfigs[0].count || 0; // 工单条数（全部）
    const realCount = applyCount - refundOnlyCount + workOrderCount; // 实际订单数
    console.log("applyCount", applyCount);
    console.log("refundOnlyCount", refundOnlyCount);
    console.log("workOrderCount", workOrderCount);
    console.log("realCount", realCount);
    ipcRenderer.send("get-after-sale-total-order-result", {
      applyCount,
      refundOnlyCount,
      workOrderCount,
      realCount,
      id: info.info.id,
    });
  } catch (error) {
    console.log("error", error);
    ipcRenderer.send("web-scoker-error-callback", {
      info: info,
      errormsg: "查询月总工单失败,失败原因:" + JSON.stringify(error),
      shopId: info.info?.shopId,
    });
  }
});
//   收到店铺心跳
ipcRenderer.on("heartbeat", (e, arg) => {
  document.dispatchEvent(new Event("visibilitychange"));
  window.dispatchEvent(new Event("focus"));
  window.dispatchEvent(new Event("online"));

  window.scrollBy(0, 1);
  window.scrollBy(0, -1);
  startAudioKeepAlive();
  resumeAudio();
  ipcRenderer.send("web-heartbeat-ping"); // 返回店铺心跳
  getUnReplyMessage(); // 跑一次 url 接口
  // const main = document.querySelector('#imroot') || document.querySelector('#root')
  //
  // console.log(
  //   'main===========',
  //   main,
  //   main?.childNodes,
  //   main?.childNodes.length
  // )
  //
  // if (!main || main.childNodes.length < 1) {
  //   ipcRenderer.send('web-reload-shop')
  // }
});
