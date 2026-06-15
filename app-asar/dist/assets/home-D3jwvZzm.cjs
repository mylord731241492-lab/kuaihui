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

// 安全注册 IPC 监听器（自动移除旧监听，防止刷新时重复注册）
function safeIpcOn(channel, handler) {
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, handler);
}

// 从 BrowserWindow additionalArguments 里直接读取账号密码，保证子 frame preload 也能拿到。
function getArgValue(prefix) {
  const matchedArg = process.argv.find((arg) => String(arg).startsWith(prefix));
  return matchedArg ? String(matchedArg).slice(prefix.length) : "";
}

let loginInfo = {
  subAccount: getArgValue("--username"),
  password: getArgValue("--password"),
};

let customerName = "";
let hasAutoSubmitted = false;
let hasUserEditedLoginForm = false;
let fillRetryTimer = null;
let fillRetryCount = 0;
let loginSuccessRetryTimer = null;
let hasSentOnlineStatus = false;
let realtimePerformanceTimer = null;
// 标记当前淘宝页面是否已经登录成功过，避免首次打开登录页时误报过期。
let hasLoggedInOnce = false;
// 标记是否已经上报过登录过期，避免重复发送同一个状态。
let hasReportedLoginExpired = false;
// 主进程会把淘宝页面运行态挂到主世界 window 上，这里统一用同一个 key 读取。
const TBSJ_RUNTIME_KEY = "__TBSJ_RUNTIME__";
const MAX_FILL_RETRY = 20;
const MAX_LOGIN_SUCCESS_RETRY = 30;
const REALTIME_PERFORMANCE_INTERVAL = 3 * 60 * 1000;
// 只在淘宝统一登录 iframe 内执行自动填表，避免误跑到其他 frame。
const TARGET_MINI_LOGIN_URL_PREFIX = "https://havanalogin.taobao.com/mini_login.htm";

class LoginCacheDB {
  constructor() {
    this.db = null;
    this.DB_NAME = "tbsjLoginCacheDB";
    this.STORE_NAME = "loginInfo";
    this.CACHE_ID = "current";
    this.VERSION = 1;
  }

  // 初始化登录缓存库，页面刷新后仍可读取上次记录的账号密码。
  async init() {
    if (this.db) return this.db;

    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.db;
  }

  // 读取缓存的登录信息，优先用于补足主进程还没回传时的空档期。
  async get() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readonly");
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.get(this.CACHE_ID);

      request.onsuccess = () => {
        const result = request.result;
        resolve(
          result
            ? {
                subAccount: result.subAccount || "",
                password: result.password || "",
              }
            : { subAccount: "", password: "" },
        );
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 写入缓存，保证用户手输和主进程下发的账号密码都能持久化。
  async set(data) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readwrite");
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.put({
        id: this.CACHE_ID,
        subAccount: data?.subAccount || "",
        password: data?.password || "",
      });

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

const loginCacheDB = new LoginCacheDB();

// 统一读取最终可用的账号密码，内存优先，缓存兜底。
async function getFinalLoginInfo() {
  // 内存里已有账号密码时直接返回，避免每次重试都访问 indexedDB。
  if (loginInfo.subAccount || loginInfo.password) {
    return {
      subAccount: loginInfo.subAccount || "",
      password: loginInfo.password || "",
    };
  }

  const cachedLoginInfo = await loginCacheDB.get().catch(() => ({
    subAccount: "",
    password: "",
  }));

  return {
    subAccount: loginInfo.subAccount || cachedLoginInfo.subAccount || "",
    password: loginInfo.password || cachedLoginInfo.password || "",
  };
}

// 统一更新内存和缓存，字段传了就覆盖，允许用户把内容清空。
async function persistLoginInfo(data) {
  const nextLoginInfo = {
    subAccount: Object.prototype.hasOwnProperty.call(data || {}, "subAccount")
      ? (data.subAccount ?? "")
      : loginInfo.subAccount,
    password: Object.prototype.hasOwnProperty.call(data || {}, "password")
      ? (data.password ?? "")
      : loginInfo.password,
  };

  // 数据没变化时直接跳过持久化，避免重试期间反复写 indexedDB。
  if (
    nextLoginInfo.subAccount === loginInfo.subAccount &&
    nextLoginInfo.password === loginInfo.password
  ) {
    return;
  }

  if (Object.prototype.hasOwnProperty.call(data || {}, "subAccount")) {
    loginInfo.subAccount = data.subAccount ?? "";
  }

  if (Object.prototype.hasOwnProperty.call(data || {}, "password")) {
    loginInfo.password = data.password ?? "";
  }

  try {
    await loginCacheDB.set(loginInfo);
  } catch (error) {
    console.warn("[TBSJ] 写入登录缓存失败:", error);
  }
}

// 优先把主进程注入的客服名同步到 preload 作用域，避免绩效逻辑拿不到 customerName。
async function syncCustomerNameFromMainWorld() {
  try {
    const injectedCustomerName =
      (await webFrame.executeJavaScript(`window.${TBSJ_RUNTIME_KEY}?.customerName || ''`)) || "";
    if (injectedCustomerName) {
      customerName = injectedCustomerName;
    }
  } catch (error) {
    console.warn("[TBSJ] 读取主世界 customerName 失败:", error);
  }
  return customerName;
}

// 判断当前页是否还是淘宝登录页，供自动填充和登录成功检测共用。
function isLoginPage() {
  return Boolean(
    document.querySelector("#login-form") ||
    document.querySelector("#fm-login-id") ||
    document.querySelector("#fm-login-password"),
  );
}

// 判断当前 URL 是否已经回到淘宝登录页，用于更早识别登录过期。
function isTaobaoLoginPageUrl() {
  const url = String(window.location.href || "").toLowerCase();
  return (
    url.includes("login.taobao.com") ||
    url.includes("havanalogin.taobao.com") ||
    url.includes("login") ||
    url.includes("login.do")
  );
}

// 仅按 iframe 和 URL 判断是否是目标登录容器，供更早的账号密码拉取使用。
function isTargetMiniLoginFrameByUrl() {
  const currentUrl = String(window.location.href || "").toLowerCase();
  // return (
  //   !process.isMainFrame && currentUrl.startsWith(TARGET_MINI_LOGIN_URL_PREFIX)
  // )
  return false;
}

// 给输入框补发事件，确保 React/受控表单能感知 value 变化。
function triggerInputEvents(element) {
  if (!element) return;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

// 停止有限次重试，避免登录页一直反复回填。
function stopFillRetry() {
  if (!fillRetryTimer) return;
  clearTimeout(fillRetryTimer);
  fillRetryTimer = null;
}

// 停止登录成功检测，避免命中后继续重复轮询。
function stopLoginSuccessRetry() {
  if (!loginSuccessRetryTimer) return;
  clearTimeout(loginSuccessRetryTimer);
  loginSuccessRetryTimer = null;
}

// 停止实时绩效轮询，避免刷新或重复初始化后出现多个定时器。
function stopRealtimePerformancePolling() {
  if (!realtimePerformanceTimer) return;
  clearInterval(realtimePerformanceTimer);
  realtimePerformanceTimer = null;
}

// 只在页面跳转后检查是否重新回到登录页，命中后通知主进程账号过期。
function reportLoginExpiredIfNeeded() {
  if (!hasLoggedInOnce || hasReportedLoginExpired) return;

  if (isTaobaoLoginPageUrl() || isLoginPage()) {
    hasReportedLoginExpired = true;
    ipcRenderer.send("account-login-expired");
  }
}

// 用首页图标判断是否登录成功，成功后只发送一次在线状态。
function checkLoginSuccessByDom() {
  if (hasSentOnlineStatus) return true;

  const successIcon = document.querySelector('[class="user-area-pop-up-panel"]');
  console.log("[TBSJ] 登录成功图标:", successIcon);
  if (!successIcon) return false;

  hasSentOnlineStatus = true;
  hasLoggedInOnce = true;
  hasReportedLoginExpired = false;
  stopLoginSuccessRetry();
  startRealtimePerformancePolling();
  // 淘宝这里补发登录成功事件，让 store 中的 loginStatus 同步置为 true。
  ipcRenderer.send("shop-login-success");
  ipcRenderer.send("shop-status-change", { status: "在线" });
  return true;
}

// 绑定账号框、密码框和登录按钮事件，记录用户最终输入的内容。
function bindLoginElements(usernameInput, passwordInput, loginBtn) {
  if (usernameInput && !usernameInput._binded) {
    usernameInput.addEventListener("input", async () => {
      hasUserEditedLoginForm = true;
      await persistLoginInfo({
        subAccount: usernameInput.value,
        password: passwordInput?.value ?? "",
      });
      stopFillRetry();
    });
    usernameInput._binded = true;
  }

  if (passwordInput && !passwordInput._binded) {
    passwordInput.addEventListener("input", async () => {
      hasUserEditedLoginForm = true;
      await persistLoginInfo({
        subAccount: usernameInput?.value ?? "",
        password: passwordInput.value,
      });
      stopFillRetry();
    });
    passwordInput._binded = true;
  }

  if (loginBtn && !loginBtn._binded) {
    loginBtn.addEventListener("click", async () => {
      await persistLoginInfo({
        subAccount: usernameInput?.value ?? "",
        password: passwordInput?.value ?? "",
      });
      scheduleLoginSuccessRetry();
      stopFillRetry();
    });
    loginBtn._binded = true;
  }
}

// 在账号密码和 DOM 都准备好后自动填充并触发登录。
async function tryFillLoginForm() {
  const usernameInput = document.querySelector("#fm-login-id");
  const passwordInput = document.querySelector("#fm-login-password");
  const loginBtn = document.querySelector(".fm-button.fm-submit.password-login");

  if (!usernameInput || !passwordInput || !loginBtn) return false;

  bindLoginElements(usernameInput, passwordInput, loginBtn);

  const finalLoginInfo = await getFinalLoginInfo();
  const subAccount = finalLoginInfo.subAccount === "null" ? "" : finalLoginInfo.subAccount;
  const password = finalLoginInfo.password === "null" ? "" : finalLoginInfo.password;

  const shouldFillUsername = !usernameInput.value && subAccount;
  const shouldFillPassword = !passwordInput.value && password;

  if (shouldFillUsername) {
    usernameInput.value = subAccount;
    triggerInputEvents(usernameInput);
  }

  if (shouldFillPassword) {
    passwordInput.value = password;
    triggerInputEvents(passwordInput);
  }

  if (shouldFillUsername || shouldFillPassword) {
    await persistLoginInfo({
      subAccount: usernameInput.value,
      password: passwordInput.value,
    });
  }

  if (
    shouldFillUsername &&
    shouldFillPassword &&
    loginInfo.subAccount &&
    loginInfo.password &&
    !hasAutoSubmitted
  ) {
    hasAutoSubmitted = true;
    setTimeout(() => {
      if (isLoginPage()) {
        loginBtn.click();
      }
    }, 1200);
    return true;
  }

  return false;
}

// 做有限次重试，兼容登录表单稍后渲染出来的场景。
async function scheduleFillRetry() {
  stopFillRetry();
  fillRetryCount = 0;

  const run = async () => {
    if (hasUserEditedLoginForm) {
      fillRetryTimer = null;
      return;
    }

    const filled = await tryFillLoginForm();
    if (filled || fillRetryCount >= MAX_FILL_RETRY) {
      fillRetryTimer = null;
      return;
    }

    fillRetryCount += 1;
    fillRetryTimer = setTimeout(run, 1000);
  };

  fillRetryTimer = setTimeout(() => {
    fillRetryTimer = null;
    void run();
  }, 0);
}

// 做有限次重试，兼容首页图标稍后异步渲染出来的场景。
function scheduleLoginSuccessRetry() {
  if (hasSentOnlineStatus) return;

  stopLoginSuccessRetry();
  let retryCount = 0;

  const run = () => {
    if (checkLoginSuccessByDom() || retryCount >= MAX_LOGIN_SUCCESS_RETRY) {
      loginSuccessRetryTimer = null;
      return;
    }

    retryCount += 1;
    loginSuccessRetryTimer = setTimeout(run, 2000);
  };

  run();
}

contextBridge.exposeInMainWorld("context_bridge", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
});

// 在路由跳转后补做一次登录态检查，避免淘宝回到登录页时状态没有及时同步。
function bindLoginExpiredCheckOnNavigation() {
  const rawPushState = history.pushState;
  history.pushState = function () {
    const result = rawPushState.apply(this, arguments);
    reportLoginExpiredIfNeeded();
    return result;
  };

  const rawReplaceState = history.replaceState;
  history.replaceState = function () {
    const result = rawReplaceState.apply(this, arguments);
    reportLoginExpiredIfNeeded();
    return result;
  };

  window.addEventListener("popstate", reportLoginExpiredIfNeeded);
  window.addEventListener("hashchange", reportLoginExpiredIfNeeded);
}

bindLoginExpiredCheckOnNavigation();

window.addEventListener("load", async () => {
  // 主页面负责店铺加载上报和登录态检测，避免子 frame 重复发送状态。
  if (process.isMainFrame) {
    ipcRenderer.send("get-shop-page-loaded");
    console.log("加载完成");
    reportLoginExpiredIfNeeded();
  }

  // 目标登录 iframe 在 load 时只更新一次账号密码，不在这里启动重试，避免重复拉高 CPU。
  if (isTargetMiniLoginFrameByUrl()) {
    ipcRenderer.send("get-shop-pwd");
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  // 只在真正命中登录表单 iframe 时启动一次回填重试，避免 URL 命中但表单未出现时空转。
  if (isTargetMiniLoginFrameByUrl() && isLoginPage()) {
    await scheduleFillRetry();
  }
});

window.addEventListener("beforeunload", () => {
  stopRealtimePerformancePolling();
});

// 获取登录的账号密码
safeIpcOn("get-shop-pwd", async (_, arg) => {
  // IPC 只做兜底更新，不直接启动重试，避免与 DOM 事件重复触发。
  hasUserEditedLoginForm = false;
  hasAutoSubmitted = false;
  await persistLoginInfo({
    subAccount: arg?.userName || "",
    password: arg?.password || "",
  });
  customerName = arg?.customerName || "";
});

// 发起一次实时绩效查询，并把结果按质检字段格式回传。
async function fetchRealtimePerformanceInfo() {
  if (isLoginPage()) return;

  // 还未确认登录成功时先跳过，避免登录页阶段重复请求接口。
  if (!hasSentOnlineStatus && !checkLoginSuccessByDom()) return;

  await syncCustomerNameFromMainWorld();

  try {
    const query = new URLSearchParams({
      dateType: "today",
      pageSize: "10",
      page: "1",
      order: "desc",
      orderBy: "cstUv",
      scopeType: "sub",
      groupId: "",
      _: String(Date.now()),
    });
    const response = await fetch(
      `https://sycm.taobao.com/csp/api/realtime/account-list.json?${query.toString()}`,
      {
        mode: "cors",
        credentials: "include",
        method: "GET",
      },
    );
    const result = await response.json();
    const dataSource = Array.isArray(result?.data?.data?.data) ? result.data.data.data : [];
    // 这里统一读取接口字段里的 value，没有值时返回空字符串。
    const readValue = (field) =>
      Object.prototype.hasOwnProperty.call(field || {}, "value") ? String(field.value) : "";
    // 实时接口里账号名优先全等匹配，匹配不到再走包含匹配。
    console.log("customerName====", customerName);
    const currentCustomerItem =
      dataSource.find((item) => {
        const accountNick = readValue(item?.accountNickWang).trim();
        const currentCustomerName = String(customerName || "").trim();
        return (
          accountNick &&
          currentCustomerName &&
          (accountNick === currentCustomerName || accountNick.includes(currentCustomerName))
        );
      }) || {};
    console.log("实时绩效数据", dataSource, currentCustomerItem);
    // 实时质检只回传这 5 个字段，没有值就留空字符串。
    ipcRenderer.send("get-quality-testing", {
      inquiryCount: readValue(currentCustomerItem?.cstUv),
      responseRateWithinThreeMin: readValue(currentCustomerItem?.threeMinReplyRate)
        ? `${readValue(currentCustomerItem?.threeMinReplyRate) * 100}`
        : "",
      averageRate:
        readValue(currentCustomerItem?.csAvgReplyInterval) ||
        readValue(currentCustomerItem?.avgRecInterval),
      dissatisfiedRate: "",
      recoverRate: readValue(currentCustomerItem?.consultTrdOrdRate)
        ? `${readValue(currentCustomerItem?.consultTrdOrdRate)}%`
        : "",
    });
  } catch (error) {
    console.warn("[TBSJ] 查询实时绩效失败:", error);
  }
}

// 启动 3 分钟一次的实时绩效轮询，客服名可用后才开始轮询。
function startRealtimePerformancePolling() {
  if (realtimePerformanceTimer) return;
  console.log("执行任务", customerName, realtimePerformanceTimer);
  fetchRealtimePerformanceInfo();
  realtimePerformanceTimer = setInterval(() => {
    fetchRealtimePerformanceInfo();
  }, REALTIME_PERFORMANCE_INTERVAL);
}

// 把日期统一转成接口需要的 YYYYMMDD 格式。
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

// 把 YYYYMMDD 转回 Date，便于按自然月拆分查询区间。
function parseCompactDate(value) {
  const year = Number(String(value).slice(0, 4));
  const month = Number(String(value).slice(4, 6)) - 1;
  const day = Number(String(value).slice(6, 8));
  return new Date(year, month, day);
}

// 跨月时按自然月拆段，避免把两个月直接混成一次查询。
function splitRangesByMonth(start, end) {
  const ranges = [];
  let current = parseCompactDate(start);
  const endDate = parseCompactDate(end);

  while (current <= endDate) {
    const rangeStart = new Date(current);
    const monthLastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    const rangeEnd = monthLastDay < endDate ? monthLastDay : endDate;

    ranges.push({
      startDate: formatDate(rangeStart),
      endDate: formatDate(rangeEnd),
    });

    current = new Date(rangeEnd);
    current.setDate(current.getDate() + 1);
  }

  return ranges;
}

// 接口缺字段时按 0 兜底，避免合并阶段出现 undefined。
function normalizePerformanceItem(item = {}) {
  return {
    volume: Number(item.cstUv1d || 0),
    conversionRate: Number(item.inquiryFinalTcr || 0),
    averageResp: Number(item.avgReplyDur1d || 0),
    satisfactionRate: Number(item.allCstSftRate || 0),
    minuteResp: Number(item.manReplyRate3min || 0),
  };
}

// 两个月数据按接待人数加权合并，没有权重时直接回退为 0。
function mergePerformanceItems(first, second) {
  const base = normalizePerformanceItem(first);
  const extra = normalizePerformanceItem(second);
  const totalVolume = base.volume + extra.volume;
  const getWeightedValue = (left, right) => {
    if (!totalVolume) return 0;
    return (left * base.volume + right * extra.volume) / totalVolume;
  };

  return {
    volume: totalVolume,
    conversionRate: getWeightedValue(base.conversionRate, extra.conversionRate),
    averageResp: getWeightedValue(base.averageResp, extra.averageResp),
    satisfactionRate: getWeightedValue(base.satisfactionRate, extra.satisfactionRate),
    minuteResp: getWeightedValue(base.minuteResp, extra.minuteResp),
  };
}

const HOOK_CODE = () => {
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  // 统一判断是否命中淘宝登录接口，避免 URL 带额外参数时匹配不到。
  function isTargetLoginRequest(method, url) {
    return String(method || "").toLowerCase() === "post" && String(url || "").includes("login.do");
  }

  // 重写淘宝登录请求体中的指定参数，确保从生意参谋入口登录。
  function rewriteTaobaoLoginBody(body) {
    if (typeof body !== "string" || !body) return body;

    const formData = new URLSearchParams(body);
    formData.set("isIframe", "true");
    formData.set("documentReferer", "https://sycm.taobao.com/");
    formData.set(
      "bizParams",
      "taobaoBizLoginFrom=sycm&renderRefer=https%3A%2F%2Fsycm.taobao.com%2F",
    );
    return formData.toString();
  }

  // 重写 open 方法
  XMLHttpRequest.prototype.open = function (method, url) {
    this._method = method; // 保存请求方法
    this._url = url; // 保存请求 URL
    console.log("url", this._url);
    // 调用原始的 open 方法
    originalXhrOpen.apply(this, arguments);
  };
  // 重写 send 方法
  XMLHttpRequest.prototype.send = function (body) {
    // 命中淘宝登录接口时，先改写表单参数，再继续发原始请求。
    const finalBody = isTargetLoginRequest(this._method, this._url)
      ? rewriteTaobaoLoginBody(body)
      : body;

    // 调用原始的 send 方法
    originalXhrSend.call(this, finalBody);
  };
};

webFrame.executeJavaScript(`(${HOOK_CODE})()`);
