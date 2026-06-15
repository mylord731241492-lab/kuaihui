// const os = require('os')
const { clipboard, nativeImage, ipcRenderer, shell, webFrame, contextBridge } = require("electron");
// const { getCurrentWindow } = require('./getWin')
contextBridge.exposeInMainWorld("context_bridge", {
  sendToHost: (channel, data) => ipcRenderer.sendToHost(channel, data),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, callback) => ipcRenderer.on(channel, callback),
  openExternal: (url) => shell.openExternal(url),
  clipboard: {
    writeText: (text) => clipboard.writeText(text),
    readText: () => clipboard.readText(),
    readImage: () => clipboard.readImage(),
    writeImage: (image) => clipboard.writeImage(image),
  },
  nativeImage: {
    createFromPath: (path) => nativeImage.createFromPath(path),
    createFromDataURL: (dataUrl) => nativeImage.createFromDataURL(dataUrl),
    createFromBuffer: (buffer) => nativeImage.createFromBuffer(buffer),
  },
});
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

let logoInfo = {
  username: "",
  password: "",
  shopId: null,
};

// 记录当前店铺名，供全局异常日志复用。
let currentShopName = "";

// 存储客服 ID，用于获取订单状态
let xhsSellerId = null; // 客服 ID

// 精细控制右键菜单：只在聊天内容区禁用系统菜单，消息列表保留系统菜单（用于调试）
document.addEventListener(
  "contextmenu",
  function (e) {
    const target = e.target;
    // 只在聊天内容区域（有 jarvis-msg 的区域）禁用系统菜单
    const inChatContentArea = target.closest(
      '[id^="jarvis-msg"], .message-content, .chat-message-content, [class*="message-content"]',
    );

    if (inChatContentArea) {
      // 聊天内容区域：阻止系统菜单，使用小红书自定义菜单
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    // 其他区域（消息列表、头部、空白处等）：允许系统菜单，方便调试
  },
  { capture: true },
);

window.addEventListener("load", function () {
  ipcRenderer.send("get-shop-page-loaded");
  // setTimeout(() => {
  //   const dom = document.querySelector('.info-box')
  //   if (dom) {
  //
  //   }
  // }, 3000)
  setTimeout(function () {
    ipcRenderer.send("get-shop-pwd");
    ipcRenderer.send("request-shop-bot-status");
  }, 1000);

  // 检查并处理登录过期弹窗的函数
  function checkAndClickExpiredDialog() {
    // 按当前小红书弹窗结构查找，避免依赖已失效的 role="dialog"。
    var dialogs = document.querySelectorAll(".d-modal");
    for (var i = 0; i < dialogs.length; i++) {
      var dialog = dialogs[i];
      // 通过标题和正文双重校验，只处理“登录认证已过期”提示弹窗。
      var header = dialog.querySelector(".d-modal-header");
      var content = dialog.querySelector(".d-modal-content");
      var headerText = header && header.textContent ? header.textContent : "";
      var contentText = content && content.textContent ? content.textContent : "";
      if (headerText.indexOf("提示") !== -1 && contentText.indexOf("登录认证已过期") !== -1) {
        console.log("[XHS] 检测到登录过期弹窗，自动点击确定");
        // 明确点击“确定”按钮，避免误点隐藏的“取消”按钮。
        var buttons = dialog.querySelectorAll("button");
        var confirmBtn = null;
        for (var j = 0; j < buttons.length; j++) {
          var button = buttons[j];
          var buttonText = button.textContent ? button.textContent.trim() : "";
          if (buttonText.indexOf("确定") !== -1 && button.style.display !== "none") {
            confirmBtn = button;
            break;
          }
        }
        if (confirmBtn) {
          setTimeout(function () {
            confirmBtn.click();
            console.log("[XHS] 已点击确定按钮");
          }, 500);
          return true; // 找到并处理了弹窗
        }
      }
    }
    return false; // 没有找到弹窗
  }

  // 监听"登录认证已过期"弹窗并自动点击确定
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === "childList") {
        // 检查新增的节点
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            // 元素节点
            // 新增节点或其子节点出现弹窗时，统一走同一套识别逻辑。
            checkAndClickExpiredDialog();
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log("[XHS] 已启动登录过期弹窗监听");

  // 立即检查页面是否已经存在登录过期弹窗
  setTimeout(function () {
    checkAndClickExpiredDialog();
  }, 1000);

  // 检查是否是登录界面，如果是就自动填入账户密码并登录
  setTimeout(function () {
    var emailInput = document.querySelector('.login-user-input[placeholder="邮箱"]');
    var passwordInput = document.querySelector(
      '.login-user-input[placeholder="密码"], .login-user-input[type="password"]',
    );
    var loginBtn = document.querySelector(".login-submit-btn");

    if (emailInput && passwordInput && loginBtn) {
      console.log("[XHS Login] 检测到登录界面，准备自动登录");

      // 等待账户密码信息
      setTimeout(function () {
        if (logoInfo.username && logoInfo.password) {
          console.log("[XHS Login] 开始填入账户密码:", logoInfo.username);

          // 填入邮箱
          emailInput.value = logoInfo.username;
          emailInput.dispatchEvent(new Event("input", { bubbles: true }));
          emailInput.dispatchEvent(new Event("change", { bubbles: true }));
          emailInput.addEventListener("input", function (e) {
            logoInfo.username = emailInput.value;
          });

          // 填入密码
          passwordInput.value = logoInfo.password;
          passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
          passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
          passwordInput.addEventListener("input", function (e) {
            logoInfo.password = passwordInput.value;
          });
          // 等待一下让输入生效，然后点击登录按钮
          setTimeout(function () {
            // 检查登录按钮是否可用
            if (!loginBtn.hasAttribute("disabled") && !loginBtn.classList.contains("disabled")) {
              console.log("[XHS Login] 点击登录按钮");
              loginBtn.click();
            } else {
              console.log("[XHS Login] 登录按钮不可用，等待启用");
              // 监听登录按钮启用
              var btnObserver = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                  if (mutation.type === "attributes" && mutation.attributeName === "disabled") {
                    if (!loginBtn.hasAttribute("disabled")) {
                      console.log("[XHS Login] 登录按钮已启用，点击登录");
                      loginBtn.click();
                      btnObserver.disconnect();
                    }
                  }
                });
              });
              btnObserver.observe(loginBtn, { attributes: true });
            }
          }, 500);
        } else {
          console.log("[XHS Login] 账户密码信息不完整，无法自动登录");
        }
      }, 500);
    } else {
      console.log("[XHS Login] 不是登录界面");
    }
  }, 2000);
});
// 小红书环境
const insertScriptStr = function () {
  let editCustomrMessage = null;

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const editordom = document.querySelector("#jarvis-reply-textarea");
        if (editordom) {
          console.log(" editordom?.value", editordom?.value);
          editCustomrMessage = editordom?.value;
        }
      }
    },
    true,
  );
  document.addEventListener("keyup", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      setTimeout(() => {
        editCustomrMessage = null;
      }, 1000);
    }
  });
  window.addEventListener("load", function () {
    setTimeout(() => {
      const dom = document.querySelector(".info-box");
      if (dom) {
        dom.addEventListener("click", function () {});
      }
    }, 3000);
  });
  window._sellerId = "";
  // 创建可扩展的 csBridge 对象
  window.csBridge = {
    getCurrentWindow: function () {
      return {
        on: function () {},
        setMaximumSize: function (width, height) {
          console.log("setMaximumSize called with:", width, height);
        },
        setMinimumSize: function (width, height) {
          console.log("setMinimumSize called with:", width, height);
        },
        setMaximizable: function (flag) {
          console.log("setMaximizable called with:", flag);
        },
        maximize: function () {
          console.log("maximize called");
        },
        unmaximize: function () {
          console.log("unmaximize called");
        },
        minimize: function () {
          console.log("minimize called");
        },
        setBounds: function (option) {
          console.log("setBounds called with:", option);
        },
        focus: function () {
          console.log("focus called");
        },
        show: function () {
          console.log("show called");
        },
        hide: function () {
          console.log("hide called");
        },
        restore: function () {
          console.log("restore called");
        },
        showInactive: function () {
          console.log("showInactive called");
        },
        isVisible: function () {
          console.log("isVisible called");
          return true;
        },
        isMinimized: function () {
          console.log("isMinimized called");
          return false;
        },
        isMaximized: function () {
          console.log("isMaximized called");
          return false;
        },
        isFocused: function () {
          console.log("isFocused called");
          return true;
        },
        setBackgroundColor: function (color) {
          console.log("setBackgroundColor called with:", color);
        },
        setFullScreenable: function (flag) {
          console.log("setFullScreenable called with:", flag);
        },
        setFullScreen: function (flag) {
          console.log("setFullScreen called with:", flag);
        },
        invokeCurrentWindowFn: function (fnName, ...args) {
          console.log("invokeCurrentWindowFn called with:", fnName, args);
        },
        getCurrentWindowData: function (dataName) {
          console.log("getCurrentWindowData called with:", dataName);
          return null;
        },
      };
    },
    ipcRenderer: {
      invoke: function (channel, ...args) {
        return window.context_bridge.invoke(channel, ...args);
      },
      send: function (channel, ...args) {
        if (channel === "logout") {
          window.location.href = "https://walle.xiaohongshu.com/cstools/login";
          return;
        }
        return window.context_bridge.send(channel, ...args);
      },
      on: function (channel, callback) {
        return window.context_bridge.on(channel, callback);
      },
      sendToHost: function (channel, ...args) {
        return window.context_bridge.sendToHost(channel, ...args);
      },
    },
    clipboard: {
      writeText: function (text) {
        return window.context_bridge.clipboard.writeText(text);
      },
      readText: function () {
        return window.context_bridge.clipboard.readText();
      },
      readImage: function () {
        return window.context_bridge.clipboard.readImage();
      },
      writeImage: function (image) {
        return window.context_bridge.clipboard.writeImage(image);
      },
    },
    nativeImage: {
      createFromPath: function (path) {
        return window.context_bridge.nativeImage.createFromPath(path);
      },
      createFromDataURL: function (dataUrl) {
        return window.context_bridge.nativeImage.createFromDataURL(dataUrl);
      },
      createFromBuffer: function (buffer) {
        return window.context_bridge.nativeImage.createFromBuffer(buffer);
      },
    },
    shell: {
      openExternal: function (url) {
        console.log("shell.openExternal called with:", url);
        window.context_bridge.openExternal(url);
      },
    },
    screenshot: {
      capturePage: function (options) {
        console.log("screenshot.capturePage called with:", options);
      },
    },
    getRemote: true,
    appInfo: {
      appVersion: "1.2.6",
      platform: "${process.platform}",
      electronVersion: "${process.versions.electron}",
      nodeVersion: "${process.versions.node}",
    },
    supportNewUI: true,
    supportTab: true,
    supportFloatPlayVoice: false,
    supportFloatWin: true,
    supportArkLogin: true,
    supportBackgroundHigh: false,
    openChildWindow: function (options) {
      if (
        options.url &&
        options.type &&
        options.width !== undefined &&
        options.height !== undefined
      ) {
        // window.context_bridge.send('open-child-window-xhs', options)
        window.context_bridge.openExternal(options.url);
      } else {
        console.error("url,type,width,height必须传入");
      }
    },
    performance: {
      getProcessMemoryInfo: function () {
        return {};
      },
      getProcessCPUUsage: function () {
        return "0";
      },
      getWindowCount: function () {
        return 1;
      },
      getDeviceId: function () {
        // return
        return new Promise((resolve) => resolve(crypto.randomBytes(12).toString("hex")));
        // 'test-device-id'
      },
    },
    sitEnvDb: {
      updateSitUrl: function (config) {
        console.log("updateSitUrl called with:", config);
      },
    },
    clientDb: {
      registDb: function (dbName) {
        const dbs = {};

        if (dbs[dbName]) {
          return dbs[dbName];
        }
        // 这里需要调用真正的 ipcRenderer，但在这个上下文中无法直接调用
        console.log("db:registDb called with:", dbName);
        const opts = ["insert", "update", "remove", "find", "findOne", "count"];
        const returnValue = {};
        opts.forEach((opt) => {
          returnValue[opt] = function (...args) {
            console.log("db:invokeFn called with:", dbName, opt, args);
            return Promise.resolve();
          };
        });
        dbs[dbName] = returnValue;
        return returnValue;
      },
    },
  };
  /**
   *  结构 key ：id
   *  {
   *    id:userId   //  用户id
   *    orderId,   // 订单编号
   *    orderStatus,  // 订单状态
   *    orderInfo,  // 订单详情
   *    goodId,   // 商品id
   *    goodName,  // 商品名称
   *    goodInfo,  // 商品详情
   *    sku      //  sku
   *    timerout,  //  超时时间  超时时间为 24小时  更具情况调整
   *  }
   *
   */
  class UserByOrderDB {
    constructor() {
      this.db = null;
      this.DB_NAME = "userByOrderInfo";
      this.STORE_NAME = "value";
      this.VERSION = 1;
    }
    // 初始化 DB
    async init() {
      if (this.db) return this.db;

      this.db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(this.DB_NAME, this.VERSION);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            db.createObjectStore(this.STORE_NAME, { keyPath: "id" });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return this.db;
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

  // 让对象可扩展
  Object.preventExtensions = function () {
    return true;
  };

  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  const originalXhrSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  // 标记位：是否已经处理过消息列表接口
  let hasProcessedMessageList = false;

  // 存储捕获的 authorization
  let capturedAuthorization = null;

  let capturedAuthorizationAT = null;

  // 标记是否已发送账号密码（参考拼多多，登录成功才发送）
  let hasSentLoginInfo = false;

  // 存储账号密码（从登录输入框获取）
  window._xhsLogoInfo = { username: "", password: "" };
  const xhsConversationUserCache = new Map();

  function cacheXhsConversationUser(appCid, userInfo) {
    if (!appCid || !userInfo) return;

    const userId = userInfo.userId || userInfo.refUserId || "";
    const username = userInfo.username || userInfo.nickName || "";
    const avatar = userInfo.avatar || userInfo.avatarUrl || "";

    if (!userId && !username && !avatar) return;

    xhsConversationUserCache.set(appCid, {
      userId,
      username,
      avatar,
    });
  }

  function getCachedXhsConversationUser(appCid) {
    if (!appCid) return null;
    return xhsConversationUserCache.get(appCid) || null;
  }

  // 监听登录界面输入框和按钮（参考拼多多）
  function setupLoginListener() {
    const emailInput = document.querySelector('.login-user-input[placeholder="邮箱"]');
    const passwordInput = document.querySelector(
      '.login-user-input[placeholder="密码"], .login-user-input[type="password"]',
    );
    const loginBtn = document.querySelector(".login-submit-btn");

    if (emailInput && passwordInput && loginBtn) {
      console.log("[XHS Login] 检测到登录界面，设置监听");

      // 监听邮箱输入
      emailInput.addEventListener("input", function () {
        window._xhsLogoInfo.username = emailInput.value;
      });

      // 监听密码输入
      passwordInput.addEventListener("input", function () {
        window._xhsLogoInfo.password = passwordInput.value;
      });

      // 监听登录按钮点击
      loginBtn.addEventListener("click", function () {
        console.log("[XHS Login] 登录按钮被点击，保存账号密码");
        window._xhsLogoInfo.username = emailInput.value;
        window._xhsLogoInfo.password = passwordInput.value;
      });
    }
  }

  // 页面加载后尝试设置登录监听
  setTimeout(setupLoginListener, 2000);
  // 重写 open 方法
  XMLHttpRequest.prototype.open = function (method, url) {
    this._method = method; // 保存请求方法
    this._url = url; // 保存请求 URL
    // 调用原始的 open 方法
    originalXhrOpen.apply(this, arguments);
  };

  // 重写 setRequestHeader 方法来捕获 authorization
  XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
    // 捕获 authorization 请求头
    if (header.toLowerCase() === "authorization") {
      // 检查是否是 a1:xxx 格式（小红书的真实 authorization）
      if (value && value.startsWith("a1:")) {
        capturedAuthorization = value;
        console.log("[XHS] 捕获到 a1 authorization:", value.substring(0, 50) + "...");
      } else if (value && value.startsWith("AT-")) {
        capturedAuthorizationAT = value;
      }
    }
    // 调用原始方法
    return originalXhrSetRequestHeader.apply(this, arguments);
  };

  // 尝试拦截 axios 请求来捕获 Authorization
  if (window.axios && window.axios.interceptors) {
    window.axios.interceptors.request.use(function (config) {
      if (
        config.headers &&
        config.headers.Authorization &&
        config.headers.Authorization.startsWith("a1:")
      ) {
        capturedAuthorization = config.headers.Authorization;
        console.log(
          "[XHS] 从 axios 捕获到 a1 authorization:",
          capturedAuthorization.substring(0, 50) + "...",
        );
      }
      if (
        config.headers &&
        config.headers.Authorization &&
        config.headers.Authorization.startsWith("AT-")
      ) {
        console.log(
          "[XHS] 从 axios 捕获到 AT- 开头的 authorization:",
          config.headers.Authorization,
        );
        capturedAuthorizationAT = config.headers.Authorization;
      }
      return config;
    });
  }

  XMLHttpRequest.prototype.send = function (body) {
    // 在请求发送之前，添加一个事件监听器
    this.addEventListener("load", function () {
      // console.log('load', this._method, this._url, body, this.response)
      if (this._url.includes("https://walle.xiaohongshu.com/api/edith/cs/get_login_user")) {
        const result = JSON.parse(this.response);
        if (result.success) {
          console.log("result", result);
          window.context_bridge.sendToHost("set-xhs-customer", {
            access_token: result.access_token,
          });
        }
        // console.log('result', result)
      }

      // ============ 拦截历史消息接口 /api/impaas/message/user/list/batch ============
      if (
        !hasProcessedMessageList &&
        this._url.includes("https://edith.xiaohongshu.com/api/impaas/message/user/list/batch")
      ) {
        hasProcessedMessageList = true; // 标记已处理，后续不再处理
        try {
          const result = JSON.parse(this.response);
          console.log("[XHS] 历史消息接口返回（首次）:", result);
          if (result.code === 0 && result.data && result.data.infos) {
            const infos = result.data.infos;
            const messageList = [];

            // 遍历所有会话
            Object.keys(infos).forEach((conversationId) => {
              const conversation = infos[conversationId];
              if (conversation.userMessageInfos && Array.isArray(conversation.userMessageInfos)) {
                const messages = conversation.userMessageInfos;
                let unrepliedMessage = null;

                // 用户逻辑：先过滤系统消息，拿剩下的一条判断
                const nonSystemMessages = messages.filter((msg) => {
                  const senderAppUid = msg.senderAppUid || "";

                  // 先获取消息类型（从内层 contentInfo.content 中解析）
                  let contentType = 0;
                  try {
                    const contentInfoStr = msg.contentInfo?.content || "{}";
                    const contentInfo = JSON.parse(contentInfoStr);
                    contentType = contentInfo.type || 0; // ← 使用内层的 type 字段！
                  } catch (e) {
                    console.log("[XHS Filter] 解析 contentType 失败:", e);
                  }

                  // 检查是否是系统消息或机器人消息
                  const isSystemMessage =
                    senderAppUid.includes("system") || // 系统发送者
                    contentType === 9 || // EndChat
                    contentType === 19 || // Coupon
                    contentType === 102 || // SystemToB
                    contentType === 125; // 系统问答消息

                  if (isSystemMessage) {
                    return false;
                  }

                  return true;
                });
                // 拿过滤后的第一条（索引0）
                if (nonSystemMessages.length > 0) {
                  const firstMsg = nonSystemMessages[0];
                  const isCustomer =
                    firstMsg.senderAppUid && firstMsg.senderAppUid.includes("#2#2#");
                  const isCSA =
                    firstMsg.senderAppUid &&
                    (firstMsg.senderAppUid.includes("#1#1#4#") ||
                      firstMsg.senderAppUid.startsWith("1#1#4#"));

                  if (isCustomer) {
                    unrepliedMessage = firstMsg; // 客户消息 → 未回复
                    console.log("unrepliedMessage=====", unrepliedMessage);
                  }
                  // isCSA 的情况不用处理，因为 unrepliedMessage 默认就是 null
                }

                // 如果找到未回复消息，提取信息
                if (unrepliedMessage) {
                  try {
                    const contentInfo = JSON.parse(unrepliedMessage.contentInfo.content);
                    const contentData = JSON.parse(contentInfo.data);
                    const senderInfo = JSON.parse(unrepliedMessage.extension.sender);
                    const presentInfo = senderInfo.presentInfo;

                    // 解析内容
                    let content = "";
                    let contentType = contentData.content_type; // 1=文本, 其他=图片/视频等

                    if (contentType === 1) {
                      content = contentData.content || "";
                    } else {
                      content = contentInfo.summary || "用户发送了多媒体消息";
                    }

                    const XHS_TIMEOUT_SECONDS = 180;
                    messageList.push({
                      messageId: unrepliedMessage.appCid,
                      userId: senderInfo.presentInfo.refUserId || "",
                      username: presentInfo.nickName,
                      avatar: presentInfo.avatarUrl,
                      content: content,
                      timeout: Math.floor(unrepliedMessage.createAt / 1000) + XHS_TIMEOUT_SECONDS,
                      isTimeout: false,
                      timeNote: "",
                      api: true,
                      type: "code",
                      senderAppUid: unrepliedMessage.senderAppUid,
                    });
                  } catch (error) {
                    console.error("[XHS] 解析未回复消息失败:", error);
                  }
                }
              }
            });

            if (messageList.length > 0) {
              // 发送消息列表给主进程
              window.context_bridge.send("get-customer-message-list", messageList);
            }
          }
        } catch (error) {
          console.error("[XHS] 处理历史消息接口失败:", error);
        }
      }
      // ============ 拦截客服信息接口 get_csa_info ============
      if (this._url.includes("https://walle.xiaohongshu.com/api/edith/mcs/get_csa_info")) {
        const result = JSON.parse(this.response);
        console.log("[XHS] get_csa_info 返回:", result);
        if (result.success && result.data) {
          const data = result.data;

          window._sellerId = data.cs_provider_id;

          console.log("[XHS] 保存客服 sellerId:", window._sellerId);

          // 解析客服状态
          let status = "离线";
          if (data.staff_status === "online") {
            status = "在线";
          } else if (data.staff_status === "busy") {
            status = "忙碌";
          }

          // TODO: 需要补充店铺名称、客服昵称、头像等信息
          // 这些信息可能需要从其他接口或页面 DOM 获取
          const shopInfo = {
            logo: data.seller_image,
            id: data.id,
            name: data.seller_name,
            username: data.csa_real_name,
          };
          currentShopName = shopInfo.name || "";

          // 发送店铺信息给主进程
          window.context_bridge.send("get-shop-info", shopInfo);

          // 发送客服状态变更
          window.context_bridge.send("shop-status-change", { status });

          // 登录成功后发送账号密码（参考拼多多 loginInfo）
          if (!hasSentLoginInfo && window._xhsLogoInfo.username && window._xhsLogoInfo.password) {
            console.log("[XHS] 登录成功，发送账号密码");
            window.context_bridge.send("loginInfo", {
              username: window._xhsLogoInfo.username,
              password: window._xhsLogoInfo.password,
            });
            hasSentLoginInfo = true;
          }
        }
      }
      // ============ 拦截实时质检接口 csa_realtime_data ============
      if (
        this._url.includes("https://walle.xiaohongshu.com/api/edith/walle/mcs/csa_realtime_data")
      ) {
        const result = JSON.parse(this.response);
        console.log("[XHS] csa_realtime_data 返回:", result);
        if (result.success && result.data) {
          const data = result.data;

          // 构造质检数据
          const qualityData = {
            // 今日接待人数
            inquiryCount: data?.consultCustomerCount || 0,
            // 3分钟回复率（转换为百分比）
            responseRateWithinThreeMin: data?.maxReplyIn3minRate
              ? (data.maxReplyIn3minRate * 100).toFixed(2) + "%"
              : "--",
            // 平均响应时间（秒）
            averageRate: data?.daytimeAverageReplyInterval || 0,
          };

          // 随机延迟发送质检数据（0-40秒）
          const randomDelay = Math.random() * 40 * 1000;
          setTimeout(() => {
            window.context_bridge.send("get-quality-testing", qualityData);
          }, randomDelay);
        }
      }
    });
    // 调用原始的 send 方法
    originalXhrSend.apply(this, arguments);
  };

  // ============ WebSocket 拦截 ============
  const OriginalWebSocket = window.WebSocket;
  // WebSocket 状态常量
  const WS_READY_STATE = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  };
  // 子账号信息
  let subAccountInfo = {
    id: null,
    name: null,
  };
  window.WebSocket = function (url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);

    // 保存小红书 WebSocket 引用（根据 URL 判断）
    if (url.includes("xiaohongshu.com") || url.includes("xhscdn.com")) {
      console.log("[XHS] 已保存 WebSocket 连接引用");
    }

    // 拦截 open 事件
    ws.addEventListener("open", function (event) {
      console.log("[XHS WebSocket] 连接已打开", url);
    });

    // 拦截 close 事件
    ws.addEventListener("close", function (event) {
      console.log("[XHS WebSocket] 连接已关闭");
    });

    // 拦截 error 事件
    ws.addEventListener("error", function (event) {
      console.error("[XHS WebSocket] 连接错误");
    });

    // 拦截消息事件 - 解析小红书消息格式
    ws.addEventListener("message", function (event) {
      try {
        const message = JSON.parse(event.data);
        const msgType = message.header?.type;
        const msgAction = message.header?.action;

        // 打印所有收到的消息类型
        console.log("[XHS WebSocket] 收到消息 type=", message, +msgType + " action=" + msgAction);

        // ============ 客服回复消息响应 (type 131, action /message/send) ============
        if (
          message.header &&
          message.header.type === 131 &&
          message.header.action === "/message/send" &&
          message.body &&
          message.body.code === 0
        ) {
          console.log("[XHS WebSocket] 客服回复成功:", message.body.data);
          const replyData = message.body.data;

          // 通知 preload：当前会话消息已被平台确认发送成功
          window.postMessage(
            {
              type: "XHS_REPLY_SEND_SUCCESS",
              data: {
                appCid: replyData.appCid,
                msgId: replyData.msgId,
              },
            },
            "*",
          );
          console.log("replyData.content", JSON.parse(replyData?.contentInfo?.content)?.data);
          // let content = null
          //
          // try {
          //   const contentInfo = replyData?.contentInfo?.content
          //
          //   if (contentInfo) {
          //     const firstParse =
          //       typeof contentInfo === 'string'
          //         ? JSON.parse(contentInfo)
          //         : contentInfo
          //
          //     const secondData = firstParse?.data
          //
          //     const secondParse =
          //       typeof secondData === 'string'
          //         ? JSON.parse(secondData)
          //         : secondData
          //
          //     content = secondParse?.content || ''
          //   }
          // } catch (e) {
          //   console.warn(
          //     '解析 replyData.contentInfo.content 失败',
          //     e,
          //     replyData
          //   )
          // }
          // 发送回复成功消息给主进程
          window.context_bridge.send("reply-customer-message", {
            messageId: replyData.appCid, // 会话ID
            msgId: replyData.msgId, // 消息ID
            content: editCustomrMessage,
          });
          // ============ 关键：不要 return，让页面的 SDK 也能处理这个消息 ============
          // 页面的 SDK 会更新 notRepliedMsgCount 和清除倒计时
        }

        // ============ 消息 (type 4, domain cs, action /sync/unreliable) ============
        if (
          message.header &&
          message.header.type === 4 &&
          message.header.domain === "cs" &&
          message.body &&
          message.body.payload
        ) {
          // 解析 payload 数组
          message.body.payload.forEach(async (payloadItem) => {
            console.log("[XHS WebSocket] 处理 payload:", payloadItem.type);
            console.log("JSON.parse(payloadItem.data)", JSON.parse(payloadItem.data));
            // type 30001 是用户消息（包括我们发送的消息）
            if (payloadItem.type === "30001") {
              const userMessageData = JSON.parse(payloadItem.data);

              if (userMessageData.userMessage) {
                const userMessage = userMessageData.userMessage;
                // 检查是否是自己发送的消息
                const isSelfMsg = userMessageData.isSelfMsg || userMessage.isSelfMsg;

                // contentInfo.content 是双层 JSON 字符串，需要解析两次
                // 第一层: {"data":"{\"content\":\"你好\",\"content_type\":1}","summary":"你好","type":1}
                const contentInfoStr = JSON.parse(userMessage.contentInfo.content);
                // 第二层: {"content":"你好","content_type":1}
                const contentData = JSON.parse(contentInfoStr.data);
                // sender 也是 JSON 字符串，需要解析
                const senderInfo = JSON.parse(userMessage.extension.sender);
                const presentInfo = senderInfo.presentInfo;
                const senderAppUid = userMessage.senderAppUid || "";
                const isTransferSystemMessage =
                  presentInfo.type === "SYSTEM" &&
                  senderAppUid.includes("system") &&
                  (contentInfoStr.type === 38 || contentData.content_type === 38);

                if (isTransferSystemMessage && !isSelfMsg) {
                  const cachedUserInfo = getCachedXhsConversationUser(userMessage.appCid);
                  const transferParams = {
                    messageId: userMessage.appCid,
                    userId: cachedUserInfo?.userId || "",
                    username: cachedUserInfo?.username || "",
                    avatar: cachedUserInfo?.avatar || "",
                    content: contentInfoStr.summary || "系统转交",
                    timeout: Math.floor(userMessage.createAt / 1000) + 180,
                    isTimeout: false,
                    timeNote: "",
                    api: true,
                    isSelfMsg: false,
                    type: "code",
                    eventType: "transfer",
                    senderAppUid,
                    raw: userMessageData,
                  };

                  console.log("[XHS WebSocket] 捕获系统转交消息:", transferParams);
                  window.context_bridge.send("get-customer-message-list", [transferParams]);
                  return;
                }

                if (presentInfo.type === "CUSTOMER") {
                  cacheXhsConversationUser(userMessage.appCid, {
                    userId: senderInfo.presentInfo.refUserId || "",
                    username: presentInfo.nickName,
                    avatar: presentInfo.avatarUrl,
                  });
                  // 解析内容
                  let content = "";
                  let goodId = ""; // 商品id
                  let contentType = contentData.content_type; // 1=文本, 其他=图片/视频等
                  let orderId = ""; // 订单id
                  let orderStatus = ""; // 订单状态
                  if (contentType === 1) {
                    // 文本消息
                    content = contentData.content || "";
                  } else if (contentType === 12) {
                    // // 12商品卡片
                    const goodInfo = JSON.parse(contentData.content);
                    console.log("[XHS WebSocket] goodInfo:", goodInfo);
                    content = "用户发送商品";
                    goodId = goodInfo.id || "";
                  } else if (contentType === 3) {
                    // 订单卡片
                    const orderInfo = JSON.parse(contentData.content);
                    console.log("[XHS WebSocket] orderInfo:", orderInfo);
                    content = "用户发送订单";
                    orderId = orderInfo.packageid || "";
                    orderStatus = orderInfo.erp_status_str || "";
                  }
                  const XHS_TIMEOUT_SECONDS = 180; // 小红书超时时间（秒），根据实际情况调整

                  let params = {
                    messageId: userMessage.appCid, // 会话ID
                    userId: senderInfo.presentInfo.refUserId || "", // 用户ID
                    username: presentInfo.nickName, // 用户昵称
                    avatar: presentInfo.avatarUrl, // 用户头像
                    content: content, // 消息内容
                    goodId: goodId, // 商品id
                    timeout: Math.floor(userMessage.createAt / 1000) + XHS_TIMEOUT_SECONDS, // 超时截止时间
                    isTimeout: false, // 是否超时
                    timeNote: "", // 时间备注
                    api: true, // 是否来自接口
                    isSelfMsg: isSelfMsg, // 标记是否是自己发送的消息
                    orderId,
                    orderStatus,
                    type: "code",
                    senderAppUid: userMessage.senderAppUid || "",
                  };
                  // 只转发用户发送的消息给主进程，不转发自己发送的
                  if (!isSelfMsg) {
                    console.log("[XHS WebSocket] 转发消息给主进程:", params);
                    console.log("发送=", params);
                    window.context_bridge.send("get-customer-message-list", [params]);
                  }
                } else if (presentInfo.type === "BOT" || presentInfo.type === "SELLER") {
                  console.log("[XHS WebSocket] 回复消息:", userMessage);
                  // 机器人回复的信息，要删除
                  window.context_bridge.send("reply-customer-message", {
                    messageId: userMessage.appCid, // 会话ID
                  });
                }
              }
            }
            // type 31010 是消息确认/回执
            else if (payloadItem.type === "31010") {
              const receiptData = JSON.parse(payloadItem.data);
              // console.log('[XHS WebSocket] 消息回执:', receiptData)
            } else if (payloadItem.type === "32012") {
              const userMessageData = JSON.parse(payloadItem.data);
              if (userMessageData.userConversation) {
                console.log("userMessageData============", userMessageData);
                const userMessage = userMessageData.userConversation;
                const isSelfMsg = userMessageData.isSelfMsg || userMessage.isSelfMsg;
                console.log("userMessage============", userMessage);
                if (userMessage.visible) {
                  const userMessageInfo = JSON.parse(userMessage.userExtension.chatUser);
                  console.log("userMessageInfo===========", userMessageInfo);
                  const sender = userMessageInfo.pairInfo;
                  console.log("sender============", sender);
                  cacheXhsConversationUser(userMessage.appCid, {
                    userId: sender?.presentInfo?.refUserId || "",
                    username: sender?.presentInfo?.nickName || "",
                    avatar: sender?.presentInfo?.avatarUrl || "",
                  });
                  const userMessage_Info = userMessage?.userMessageInfo || {};
                  const latestSenderInfo = userMessage_Info.extension?.sender
                    ? JSON.parse(userMessage_Info.extension.sender)
                    : null;
                  const latestSenderType = latestSenderInfo?.presentInfo?.type || "";
                  const latestMessageCreateAt = userMessage_Info.createAt || 0;
                  const hasFreshCtagUpdate =
                    Array.isArray(userMessage.ctagInfos) &&
                    userMessage.ctagInfos.some((tagInfo) => {
                      const isLatestTagMutation =
                        tagInfo && Number(tagInfo.modifyTime) === Number(userMessageData.time);
                      const messageIsOlderThanTag =
                        !latestMessageCreateAt ||
                        latestMessageCreateAt + 3000 < Number(userMessageData.time);

                      return isLatestTagMutation && messageIsOlderThanTag;
                    });

                  if (hasFreshCtagUpdate) {
                    console.log("[XHS WebSocket] 跳过会话标签变更事件:", userMessage.ctagInfos);
                    return;
                  }

                  if (latestSenderType && latestSenderType !== "CUSTOMER") {
                    console.log("[XHS WebSocket] 跳过非客户会话更新:", latestSenderType);
                    return;
                  }

                  const contentInfo = userMessage_Info.contentInfo?.content
                    ? JSON.parse(userMessage_Info.contentInfo?.content)
                    : null;
                  console.log("contentInfo", contentInfo);
                  const content = contentInfo ? contentInfo.summary : "用户接入会话";
                  const XHS_TIMEOUT_SECONDS = 180; // 小红书超时时间（秒），根据实际情况调整
                  const params = {
                    messageId: userMessage.appCid, // 会话ID
                    userId: sender ? sender.presentInfo.refUserId : "", // 用户ID
                    username: sender ? sender.presentInfo.nickName : "", // 用户昵称
                    avatar: sender ? sender.presentInfo.avatarUrl : "", // 用户头像
                    content: content, // 消息内容
                    timeout: userMessage_Info.createAt
                      ? Math.floor(userMessageData?.time / 1000) + XHS_TIMEOUT_SECONDS
                      : Math.floor(Date.now() / 1000) + XHS_TIMEOUT_SECONDS, // 超时截止时间
                    isTimeout: false, // 是否超时
                    timeNote: "", // 时间备注
                    api: true, // 是否来自接口
                    isSelfMsg: isSelfMsg, // 标记是否是自己发送的消息
                    type: "code",
                    senderAppUid: userMessage_Info.senderAppUid || "",
                  };
                  console.log("发送===================", params);
                  window.context_bridge.send("get-customer-message-list", [params]);
                }
              }
            }
          });
        }
      } catch (error) {
        console.error("[XHS WebSocket] 解析消息失败:", error);
      }
    });

    return ws;
  };
  class OrderByUserInfo {
    constructor(obj) {
      this.id = obj.messageId;
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

  window.context_bridge.on("get-shop-user", async (_, arg) => {
    console.log("[XHS] get-shop-user 获取历史记录:", arg);

    // 获取历史消息数据
    const userHistoryData = getUserHistoryData();
    console.log("[XHS] 历史消息数据:", userHistoryData.length, "条");

    if (userHistoryData && userHistoryData.length > 0) {
      // 过滤掉空内容消息
      let processedData = userHistoryData.filter((item) => item.content !== "");

      // ============ 获取订单状态（参考拼多多）============
      let orderStatus = "暂无订单";
      // 如果有用户 ID 和客服 ID，获取订单状态
      if (arg.userId && window._sellerId) {
        try {
          // orderStatus = await getXhsOrderInfo(arg.userId, window._sellerId)
          console.log("[XHS] 获取到订单状态:", orderStatus);
        } catch (e) {
          console.error("[XHS] 获取订单状态失败:", e);
        }
      } else {
        console.log("[XHS] 缺少用户 ID 或客服 ID，跳过订单查询", arg.userId, window._sellerId);
      }

      // 添加 messageId 和 orderStatus
      processedData = processedData.map((item) => ({
        ...item,
        messageId: arg.messageId,
        orderStatus: item.orderStatus || orderStatus, // 返回订单状态（参考拼多多）
      }));

      arg.history = processedData;

      // 将内容转为字符串传输（参考拼多多）
      window.context_bridge.send("get-historical-records", JSON.stringify(arg));
      console.log("[XHS] 发送历史消息记录:", processedData.length, "条");
    } else {
      console.log("[XHS] 没有有效的历史消息");
    }
  });

  // 参考拼多多，使用 DOM 获取历史消息数据
  const getUserHistoryData = () => {
    // 获取所有消息元素
    const msgElements = document.querySelectorAll('[id^="jarvis-msg-"]');
    if (!msgElements || msgElements.length === 0) {
      console.log("[XHS] 没有找到消息元素");
      return [];
    }

    const msgList = [];

    msgElements.forEach((msgElement) => {
      try {
        // 获取 sender-type 属性
        const senderType = msgElement.getAttribute("data-sender-type");
        const msgId = msgElement.getAttribute("id").replace("jarvis-msg-", "");
        const timestamp = msgElement.getAttribute("data-timestamp");
        const chatId = msgElement.getAttribute("data-chat-id");
        const isSelf = msgElement.getAttribute("data-self") === "self";
        const msgType = msgElement.getAttribute("data-msg-type");

        // 🔥 过滤掉机器人消息和系统消息（参考拼多多 isPDDShowRobotReply 逻辑）
        // bot: 机器人消息，system: 系统消息
        // 只保留: individual（用户消息）和 sub_account（客服消息）
        if (senderType === "bot" || senderType === "system") {
          console.log("[XHS] 过滤掉消息:", senderType, msgId);
          return;
        }

        // 获取消息内容
        let content = "";

        // 如果是商品卡片
        if (msgType === "goodCard") {
          const goodsNameElement = msgElement.querySelector(".goods-message-name-text");
          const goodsPriceInt = msgElement.querySelector(".goods-message-price-int-value");
          const goodsPriceFloat = msgElement.querySelector(".goods-message-price-float-value");

          if (goodsNameElement) {
            content = "[商品] " + goodsNameElement.textContent.trim();
            if (goodsPriceInt || goodsPriceFloat) {
              content +=
                " ¥" + (goodsPriceInt?.textContent || "") + (goodsPriceFloat?.textContent || "");
            }
          }
        } else {
          // 普通文本消息
          const contentSpan = msgElement.querySelector("span span");
          if (contentSpan) {
            content = contentSpan.textContent.trim();
          }
        }

        // 获取时间
        const timeElement = msgElement.querySelector(".single-msg-time");
        const timeStr = timeElement ? timeElement.textContent.trim() : "";

        // 获取发送者信息
        const senderNameElement = msgElement.parentElement?.querySelector(".css-1b7ltxq div");
        const senderName = senderNameElement ? senderNameElement.textContent.trim() : "";

        // 获取头像
        const avatarElement = msgElement.parentElement?.querySelector(".im-sender img");
        const avatar = avatarElement ? avatarElement.getAttribute("src") || "" : "";

        // 判断角色：用户还是客服
        const role = senderType === "individual" ? "user" : "assistant";

        msgList.push({
          role: role,
          content: content,
          senderType: senderType,
          senderName: senderName,
          avatar: avatar,
          timestamp: timestamp ? parseInt(timestamp) : Date.now(),
          timeStr: timeStr,
          msgId: msgId,
          chatId: chatId,
          isSelf: isSelf,
        });
      } catch (e) {
        console.warn("[XHS] 解析消息出错:", e);
      }
    });

    return msgList;
  };

  // 收到转接子账号
  window.context_bridge.on("ai-transfer-human-sub", async (_, args) => {
    await zhuanjieSubAccountInfo(args);
  });
  // 收到星标消息
  window.context_bridge.on("star-customer-message", async (_, args) => {
    await starMessage(args);
  });

  // 转接子账号信息
  const zhuanjieSubAccountInfo = async (args) => {
    console.log("AI转人工转接子账号", args);
    // 判断子账号是否相同
    if (subAccountInfo.name !== args.subAccount) {
      const csa_user_id = await getSubCsaUserId(args.subAccount);
      if (csa_user_id) {
        subAccountInfo.name = args.subAccount;
        subAccountInfo.csa_user_id = csa_user_id;
      }
    }

    const chat_id = await getConvUserList(args.messageId);
    if (!chat_id || !subAccountInfo.csa_user_id) {
      return;
    }

    fetch("https://walle.xiaohongshu.com/api/edith/mcs/transfer_conversation", {
      method: "POST",
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-subsystem": "eva",
        "x-t": Date.now().toString(),
        authorization: capturedAuthorizationAT,
      },
      body: JSON.stringify({
        chat_id,
        csa_user_id: subAccountInfo.csa_user_id,
      }),
    });
  };

  // 根据子账号名称获取csa_user_id
  const getSubCsaUserId = async (name) => {
    const response = await fetch(
      "https://eva.xiaohongshu.com/api/edith/seller/online/csas/desensitize",
      {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-subsystem": "eva",
          "x-t": Date.now().toString(),
          authorization: capturedAuthorizationAT,
        },
        body: JSON.stringify({
          seller_id: window._sellerId || "",
        }),
      },
    ).then((res) => res.json());

    const userList = Array.isArray(response?.data) ? response.data : [];
    const matchedUser = userList.find((item) => {
      return item?.user_name === name || item?.nick_name === name;
    });

    return matchedUser?.user_id || null;
  };

  // 根据用户的"appCid"获取要转接的id
  const getConvUserList = async (appCid) => {
    const response = await fetch("https://edith.xiaohongshu.com/api/impaas/conv/user/list", {
      method: "POST",
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-subsystem": "eva",
        "x-t": Date.now().toString(),
        authorization: capturedAuthorization,
      },
      body: JSON.stringify({
        cursor: -1,
        count: 25,
        direction: false,
        hasHide: true,
        withCtag: true,
        topPolicy: 0,
        offset: 0,
        byOffset: true,
      }),
    }).then((res) => res.json());

    const conversationList = Array.isArray(response?.data?.userConversationInfos)
      ? response.data.userConversationInfos
      : [];
    const matchedConversation = conversationList.find((item) => item?.appCid === appCid);
    const downAdditionalInfo = matchedConversation?.bizExtension?.downAdditionalInfo;

    if (!downAdditionalInfo) {
      return null;
    }

    try {
      const bizData = JSON.parse(downAdditionalInfo);
      return bizData?.id || null;
    } catch (error) {
      console.log("解析会话 downAdditionalInfo 失败", error);
      return null;
    }
  };

  // 星标
  const starMessage = (args) => {
    fetch("https://edith.xiaohongshu.com/api/impaas/conv/tag/set", {
      method: "POST",
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-subsystem": "eva",
        "x-t": Date.now().toString(),
        authorization: capturedAuthorization,
      },
      body: JSON.stringify({
        appCid: args.messageId,
        ctag: "COLLECT",
        enable: true,
        expireTime: -1,
        extension: {
          level: "0",
        },
      }),
    });
  };
};
webFrame.executeJavaScript(`(${insertScriptStr})()`);
// 安全注册 IPC 监听器（自动移除旧监听，防止刷新时重复注册）
function safeIpcOn(channel, handler) {
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, handler);
}

// 统一把 preload 全局异常写到主进程的 errorLog 文件里。
function writePreloadErrorLog(payload) {
  ipcRenderer.send("write-preload-error-log", payload);
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

// 统一上报小红书 preload 的全局错误。
function reportGlobalPreloadError(type, errorLike) {
  writePreloadErrorLog({
    shopName: currentShopName || "未知店铺",
    platform: "xhs",
    errorMessage: `${type}: ${getReadableErrorMessage(errorLike)}`,
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
  });
}

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

// 创建节流版本的点击客户消息处理函数
const throttledClickCustomerMessage = throttle((args) => {
  // 根据 data-key 找到对应的聊天项
  const dom = document.querySelector(`.chat-item[data-key="${args.messageId}"]`);
  if (!dom) {
    console.log("[XHS] 未找到对应的聊天项:", args.messageId);
    // 找不到就通知主进程删除
    window.context_bridge.send("reply-customer-message", {
      messageId: args.messageId,
    });
    return;
  }
  // 模拟鼠标点击
  dom.click();
}, 500); // 0.5秒内最多执行一次，防止频繁点击

// 选中用户
safeIpcOn("click-customer-message", (_, args) => {
  throttledClickCustomerMessage(args);
});
//星标
safeIpcOn("star", () => {
  const starDom = document.getElementsByClassName("tool-chat-icon")[1];
  if (starDom) {
    starDom.click();
  }
});

// ============ 小红书消息发送（通过 DOM 模拟输入框发送） ============
// 延迟函数
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 发送成功回执队列：key=appCid
const xhsSendAckQueue = new Map();
// 等待中的回调：key=appCid
const xhsSendAckWaiters = new Map();

function pushXhsSendAck(appCid, ackData) {
  if (!appCid) return;

  const waiters = xhsSendAckWaiters.get(appCid);
  if (waiters && waiters.length > 0) {
    const waiter = waiters.shift();
    if (waiter) waiter(ackData);
    if (waiters.length === 0) {
      xhsSendAckWaiters.delete(appCid);
    }
    return;
  }

  if (!xhsSendAckQueue.has(appCid)) {
    xhsSendAckQueue.set(appCid, []);
  }
  xhsSendAckQueue.get(appCid).push(ackData);
}

function waitForXhsSendAck(appCid, timeout = 5000) {
  if (!appCid) return Promise.resolve(null);

  const queue = xhsSendAckQueue.get(appCid);
  if (queue && queue.length > 0) {
    const ack = queue.shift();
    if (queue.length === 0) {
      xhsSendAckQueue.delete(appCid);
    }
    return Promise.resolve(ack);
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      const waiters = xhsSendAckWaiters.get(appCid) || [];
      const idx = waiters.indexOf(onAck);
      if (idx > -1) waiters.splice(idx, 1);
      if (waiters.length === 0) {
        xhsSendAckWaiters.delete(appCid);
      } else {
        xhsSendAckWaiters.set(appCid, waiters);
      }
      resolve(null);
    }, timeout);

    const onAck = (ackData) => {
      clearTimeout(timer);
      resolve(ackData);
    };

    if (!xhsSendAckWaiters.has(appCid)) {
      xhsSendAckWaiters.set(appCid, []);
    }
    xhsSendAckWaiters.get(appCid).push(onAck);
  });
}

async function waitForXhsSendAckCount(appCid, expectedCount, timeout = 5000) {
  if (!appCid || !expectedCount || expectedCount <= 0) {
    return [];
  }

  const ackList = [];
  const deadline = Date.now() + timeout;

  while (ackList.length < expectedCount) {
    const remainTimeout = deadline - Date.now();
    if (remainTimeout <= 0) {
      break;
    }

    const ack = await waitForXhsSendAck(appCid, remainTimeout);
    if (!ack) {
      break;
    }

    ackList.push(ack);
  }

  return ackList;
}

// ============ 监听 reply-message 事件 ============
safeIpcOn("reply-message", async (_, args) => {
  console.log("[XHS] 收到 reply-message:", args);

  let messageList = [];
  try {
    if (typeof args === "object") {
      messageList = Array.isArray(args) ? args : [args];
    } else {
      const parsed = JSON.parse(args);
      messageList = Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch (error) {
    console.error("[XHS] 解析 reply-message 失败:", error);
    messageList = [args];
  }

  console.log("[XHS] 待发送文本消息列表:", messageList);

  for (const message of messageList) {
    if (!message) continue;

    if (message.videoUrl || message.file) {
      console.log("[XHS] reply-message 暂跳过非文本消息:", message);
      continue;
    }

    const chatId = message.chatId || message.messageId || message.appCid;
    const replyContent = message.replyContent || message.content || "";
    const expectedAckCount = (message.imageBase64 ? 1 : 0) + (replyContent ? 1 : 0);
    if (!chatId) {
      console.error("[XHS] 无法获取会话 ID:", message);
      continue;
    }
    if (message.imageBase64 || message.imageUrl) {
      const imageSent = await sendImage({
        chatId,
        imageBase64: message.imageBase64,
        imageMimeType: message.imageMimeType,
        imageUrl: message.imageUrl,
      });

      if (!imageSent) {
        console.error("[XHS] 图片发送失败，跳过后续回调:", message);
        continue;
      }

      await delay(300);
    }

    if (message?.needOrder && message?.needOrder >= 3) {
      window.postMessage(
        {
          type: "XHS_NEED_ORDER_PREFETCH",
          data: {
            ...message,
            messageId: chatId,
          },
        },
        "*",
      );
    }

    console.log("[XHS] SDK 发送文本消息到会话:", chatId, "内容:", replyContent);
    if (replyContent) {
      window.postMessage(
        {
          type: "send-message",
          data: {
            chatId,
            contentInfo: {
              contentType: 1,
              content: replyContent,
              receiverAppUids: [message.senderAppUid],
            },
          },
        },
        "*",
      );
    }

    const ackList = await waitForXhsSendAckCount(chatId, expectedAckCount, 5000);
    console.log("[XHS] 发送成功回执列表:", ackList);
    if (ackList.length === expectedAckCount) {
      ipcRenderer.send("get-customer-callback-result", {
        ...message,
        isAiInviteReply: message.isAiInviteReply,
        isReminderReply: message.isReminderReply,
        isBottomLineAutoReply: message.isBottomLineAutoReply || false,
        isAiAutoReply: !message.isBottomLineAutoReply,
      });
    } else {
      console.error(
        "[XHS] 未收到完整发送成功回执，跳过 get-customer-callback-result:",
        chatId,
        "expectedAckCount=",
        expectedAckCount,
        "actualAckCount=",
        ackList.length,
      );
    }

    await delay(300);
  }
});

safeIpcOn("get-shop-pwd", (_, args) => {
  logoInfo.password = args.password;
  logoInfo.username = args.userName;
  // 同时保存到 window 对象，供注入脚本使用（页面刷新后的自动登录）
  window._xhsLogoInfo = {
    username: args.userName,
    password: args.password,
  };
});

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
        if (url.includes("pinduoduo.com")) {
          self.record(false);
        }
        throw e;
      }
    };

    console.log("[API健康监控] 已初始化");
  },
};

// 初始化 API 监控
apiHealthMonitor.init();

// ============ WebSocket 状态追踪 ============
let wsConnectState = -1; // -1=未知, 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED

// 健康检测请求处理 - 返回完整的健康状态
safeIpcOn("request-heartbeat", (_, data) => {
  console.log("获取到心跳了");
  const startTime = Date.now();
  // 获取当前店铺状态
  let status = "";
  let domExists = true;
  const dom = document.querySelector("[data-menu-id='side-dashboard']");
  if (!dom) {
    domExists = false;
  }
  // 获取 API 健康状态
  const apiHealthy = apiHealthMonitor.isHealthy();

  // 发送健康检测响应
  ipcRenderer.send("heartbeat-response", {
    status,
    apiHealthy,
    webSocketState: wsConnectState,
    domExists: domExists,
  });
});

// 上下线
safeIpcOn("change-shop-status", (_, status) => {
  // console.log('change-shop-status')
  // 获取dom
  const dom = document.querySelector('[class="status-container"]');
  if (dom) {
    dom.click();
    setTimeout(() => {
      const statusDom = document.getElementsByClassName("el-dropdown-menu__item");
      if (status === "online") {
        statusDom[0].click();
      } else if (status === "busy") {
        statusDom[1].click();
      } else if (status === "offline") {
        statusDom[2].click();
      }
    }, 1000);
  }
});

// ============ 监听 postMessage，接收 customer_id ============
window.addEventListener("message", (event) => {
  // 只处理来自当前窗口的消息
  if (event.source !== window) return;

  if (event.data && event.data.type === "XHS_SELLER_ID") {
    const { sellerId } = event.data.data;
    console.log("[XHS] 接收到 seller_id:", sellerId);

    // 保存用户 ID 到全局变量
    xhsSellerId = sellerId;
  }
  if (event.data && event.data.type === "XHS_REPLY_SEND_SUCCESS") {
    const appCid = event.data?.data?.appCid;
    if (appCid) {
      pushXhsSendAck(appCid, event.data.data);
    }
  }
  if (event.data && event.data.type === "XHS_HOOK_SUCCESS") {
    ipcRenderer.send("xhs-hook-success", {
      success: true,
    });
  }
  if (event.data && event.data.type === "WS_STATE_CHANGE") {
    wsConnectState = event.data.state;
  }
});

// 获取全部商品详情
safeIpcOn("get-goods-all-detail", async (_, args) => {
  getGoodsList(args);
});

async function getGoodsList(args) {
  try {
    console.log("[XHS] 开始获取全部商品详情, args:", args);

    // 获取 seller_id（客服ID）
    const sellerId = window._sellerId || "68b8e6e99265c7001527e9f1";
    console.log("[XHS] sellerId:", sellerId);

    // 第一步：获取商品列表第一页，获取总数
    const firstPageRes = await fetch(
      "https://eva.xiaohongshu.com/api/edith/business/tools/search_seller_item_list",
      {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-subsystem": "eva",
          "x-t": Date.now().toString(),
        },
        body: JSON.stringify({
          seller_id: sellerId,
          page_no: 1,
          page_size: 10,
          order: "desc",
        }),
      },
    );
    const firstPageData = await firstPageRes.json();
    console.log("[XHS] 商品列表返回:", firstPageData);

    if (!firstPageData.success || !firstPageData.data || !firstPageData.data.data) {
      console.error("[XHS] 获取商品列表失败:", firstPageData);
      return;
    }

    const goodsData = firstPageData.data.data;
    const total = firstPageData.data.total || 0;

    // 发送总条数
    ipcRenderer.send("get-goods-all-detail-total", {
      userId: args.userId,
      total: total,
    });
    console.log(`[XHS] 总共有 ${total} 个商品`);

    // 获取所有商品数据
    const allGoods = goodsData || [];

    // 计算需要请求的页数
    const pageSize = 10;
    const totalPages = Math.ceil(total / pageSize);

    // 循环获取剩余页面
    for (let page = 2; page <= totalPages; page++) {
      try {
        const pageRes = await fetch(
          "https://eva.xiaohongshu.com/api/edith/business/tools/search_seller_item_list",
          {
            method: "POST",
            mode: "cors",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "x-subsystem": "eva",
              "x-t": Date.now().toString(),
            },
            body: JSON.stringify({
              seller_id: sellerId,
              page_no: page,
              page_size: pageSize,
              order: "desc",
            }),
          },
        );
        const pageData = await pageRes.json();
        if (pageData.success && pageData.data && pageData.data.data) {
          allGoods.push(...pageData.data.data);
        }
        // 添加延迟避免请求过快
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[XHS] 获取第 ${page} 页商品列表失败:`, error);
      }
    }

    console.log(`[XHS] 共获取到 ${allGoods.length} 个商品，开始处理详情`);

    // 串行处理商品详情
    const batchResults = [];
    for (let i = 0; i < allGoods.length; i++) {
      const item = allGoods[i];
      const itemId = item.item_id;
      if (!itemId) {
        console.warn(`[XHS] 商品缺少 item_id，跳过:`, item);
        continue;
      }

      try {
        // 获取商品SKU详情
        const skuData = await getGoodsSkuInfo(sellerId, itemId);
        if (skuData) {
          // 组装商品详情数据
          const result = {
            goods_id: itemId,
            goods_name: item.name,
            goods_properties: item.attribute_info_list
              ? item.attribute_info_list
                  .map((attr) => `${attr.attribute_name}: ${attr.attribute_value}`)
                  .join(", ")
              : "",
            goods_url:
              item.image_info_list && item.image_info_list[0] ? item.image_info_list[0].link : "",
            urls: item.image_info_list ? item.image_info_list.map((img) => img.link) : [],
            goods_sku: skuData,
            price_info: item.price_info,
            stock: item.stock,
            type: args.type,
            id: args.id,
            // 只有最后一批才添加 aiTaskId
            ...(i === allGoods.length - 1 ? { aiTaskId: args.aiTaskId } : {}),
          };
          batchResults.push(result);
        }
      } catch (error) {
        console.error(`[XHS] 处理商品 ${itemId} 详情失败:`, error);
      }

      // 如果不是最后一个商品，等待一段时间避免请求过快
      if (i < allGoods.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      // 每处理10个商品批量发送一次
      if (batchResults.length >= 10) {
        ipcRenderer.send("get-goods-detail", [...batchResults]);
        batchResults.length = 0;
      }
    }

    // 发送剩余的商品详情
    if (batchResults.length > 0) {
      ipcRenderer.send("get-goods-detail", batchResults);
    }

    console.log("[XHS] 所有商品详情获取完成");
  } catch (error) {
    console.error("[XHS] 获取全部商品详情时出错:", error);
  }
}

// 获取商品SKU详情
async function getGoodsSkuInfo(sellerId, itemId) {
  try {
    const skuRes = await fetch(
      "https://eva.xiaohongshu.com/api/edith/cs-tools/goods-v4/get-seller-sku-list",
      {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-subsystem": "eva",
          "x-t": Date.now().toString(),
        },
        body: JSON.stringify({
          seller_id: sellerId,
          item_id: itemId,
        }),
      },
    );
    const skuData = await skuRes.json();
    console.log("[XHS] SKU返回:", skuData);

    if (!skuData.success || !skuData.data || !skuData.data.data) {
      return "";
    }

    // 解析SKU信息
    const skuList = skuData.data.data;
    const skuStrings = skuList.map((sku) => {
      const variants = sku.variant_info_list
        ? sku.variant_info_list.map((v) => `${v.name}: ${v.value}`).join(", ")
        : "";
      const price = sku.price_info ? (sku.price_info.price / 100).toFixed(2) : "";
      return `${variants} ¥${price}`;
    });

    return skuStrings.join("; ");
  } catch (error) {
    console.error("[XHS] 获取SKU详情失败:", error);
    return "";
  }
}

//  发送粘贴
ipcRenderer.on("paste-to-shop", (event, text) => {
  const input = document.querySelector(".reply-textarea");
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

const sendImage = async (options = {}) => {
  try {
    const chatId = options.chatId || options.appCid || options.messageId;
    let imageBase64 = options.imageBase64 || "";
    let imageMimeType = options.imageMimeType || "image/jpeg";
    const imageUrl = options.imageUrl || "";

    if (!chatId) {
      console.error("[XHS] sendImage 缺少 chatId:", options);
      return false;
    }

    if (!imageBase64 && imageUrl) {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`下载图片失败: ${response.status}`);
      }
      const blob = await response.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("读取图片失败"));
        reader.readAsDataURL(blob);
      });
      imageBase64 = dataUrl.split(",")[1];
      imageMimeType = blob.type || imageMimeType;
    }

    if (!imageBase64) {
      console.error("[XHS] sendImage 缺少 imageBase64:", options);
      return false;
    }

    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:${imageMimeType};base64,${imageBase64}`;

    window.postMessage(
      {
        type: "send-img",
        data: {
          appCid: chatId,
          src: dataUrl,
        },
      },
      "*",
    );

    return true;
  } catch (error) {
    console.error("[XHS] sendImage 失败:", error, options);
    return false;
  }
};

window.addEventListener("error", (event) => {
  console.error("全局错误", event);
  reportGlobalPreloadError("全局错误", event.error || event);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("未捕获的promise错误", event);
  reportGlobalPreloadError("未捕获的promise错误", event.reason || event);
});
//   收到店铺心跳
ipcRenderer.on("heartbeat", () => {
  ipcRenderer.send("web-heartbeat-ping"); // 返回店铺心跳
});
