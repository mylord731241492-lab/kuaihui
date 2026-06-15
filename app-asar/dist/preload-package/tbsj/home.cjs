const { ipcRenderer, contextBridge, webFrame } = require("electron"),
  shouldDisablePreloadConsole = process["argv"]["includes"]("--kh-disable-preload-console");
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
  ]["forEach"]((a) => {
    try {
      console[a] = noop;
    } catch {}
  });
}
function safeIpcOn(a, b) {
  (ipcRenderer["removeAllListeners"](a), ipcRenderer["on"](a, b));
}
function getArgValue(a) {
  const b = process["argv"]["find"]((c) => String(c)["startsWith"](a));
  return b ? String(b)["slice"](a["length"]) : "";
}
let loginInfo = {
    subAccount: getArgValue("--username"),
    password: getArgValue("--password"),
  },
  customerName = "",
  hasAutoSubmitted = ![],
  hasUserEditedLoginForm = ![],
  fillRetryTimer = null,
  fillRetryCount = 0x0,
  loginSuccessRetryTimer = null,
  hasSentOnlineStatus = ![],
  realtimePerformanceTimer = null,
  hasLoggedInOnce = ![],
  hasReportedLoginExpired = ![];
const TBSJ_RUNTIME_KEY = "__TBSJ_RUNTIME__",
  MAX_FILL_RETRY = 0x14,
  MAX_LOGIN_SUCCESS_RETRY = 0x1e,
  REALTIME_PERFORMANCE_INTERVAL = 0x3 * 0x3c * 0x3e8,
  TARGET_MINI_LOGIN_URL_PREFIX = "https://havanalogin.taobao.com/mini_login.htm";
class LoginCacheDB {
  constructor() {
    ((this["db"] = null),
      (this["DB_NAME"] = "tbsjLoginCacheDB"),
      (this["STORE_NAME"] = "loginInfo"),
      (this["CACHE_ID"] = "current"),
      (this["VERSION"] = 0x1));
  }
  async ["init"]() {
    if (this["db"]) return this["db"];
    return (
      (this["db"] = await new Promise((a, b) => {
        const c = indexedDB["open"](this["DB_NAME"], this["VERSION"]);
        ((c["onupgradeneeded"] = () => {
          const d = c["result"];
          !d["objectStoreNames"]["contains"](this["STORE_NAME"]) &&
            d["createObjectStore"](this["STORE_NAME"], { keyPath: "id" });
        }),
          (c["onsuccess"] = () => a(c["result"])),
          (c["onerror"] = () => b(c["error"])));
      })),
      this["db"]
    );
  }
  async ["get"]() {
    const a = await this["init"]();
    return new Promise((b, c) => {
      const d = a["transaction"](this["STORE_NAME"], "readonly"),
        e = d["objectStore"](this["STORE_NAME"]),
        f = e["get"](this["CACHE_ID"]);
      ((f["onsuccess"] = () => {
        const g = f["result"];
        b(
          g
            ? {
                subAccount: g["subAccount"] || "",
                password: g["password"] || "",
              }
            : {
                subAccount: "",
                password: "",
              },
        );
      }),
        (f["onerror"] = () => c(f["error"])));
    });
  }
  async ["set"](a) {
    const b = await this["init"]();
    return new Promise((c, d) => {
      const e = b["transaction"](this["STORE_NAME"], "readwrite"),
        f = e["objectStore"](this["STORE_NAME"]),
        g = f["put"]({
          id: this["CACHE_ID"],
          subAccount: a?.["subAccount"] || "",
          password: a?.["password"] || "",
        });
      ((g["onsuccess"] = () => c(!![])), (g["onerror"] = () => d(g["error"])));
    });
  }
}
const loginCacheDB = new LoginCacheDB();
async function getFinalLoginInfo() {
  if (loginInfo["subAccount"] || loginInfo["password"])
    return {
      subAccount: loginInfo["subAccount"] || "",
      password: loginInfo["password"] || "",
    };
  const a = await loginCacheDB["get"]()["catch"](() => ({
    subAccount: "",
    password: "",
  }));
  return {
    subAccount: loginInfo["subAccount"] || a["subAccount"] || "",
    password: loginInfo["password"] || a["password"] || "",
  };
}
async function persistLoginInfo(a) {
  const b = {
    subAccount: Object["prototype"]["hasOwnProperty"]["call"](a || {}, "subAccount")
      ? (a["subAccount"] ?? "")
      : loginInfo["subAccount"],
    password: Object["prototype"]["hasOwnProperty"]["call"](a || {}, "password")
      ? (a["password"] ?? "")
      : loginInfo["password"],
  };
  if (b["subAccount"] === loginInfo["subAccount"] && b["password"] === loginInfo["password"])
    return;
  Object["prototype"]["hasOwnProperty"]["call"](a || {}, "subAccount") &&
    (loginInfo["subAccount"] = a["subAccount"] ?? "");
  Object["prototype"]["hasOwnProperty"]["call"](a || {}, "password") &&
    (loginInfo["password"] = a["password"] ?? "");
  try {
    await loginCacheDB["set"](loginInfo);
  } catch (c) {
    console["warn"]("[TBSJ]\x20写入登录缓存失败:", c);
  }
}
async function syncCustomerNameFromMainWorld() {
  try {
    const a =
      (await webFrame["executeJavaScript"](
        "window." + TBSJ_RUNTIME_KEY + "?.customerName\x20||\x20\x27\x27",
      )) || "";
    a && (customerName = a);
  } catch (b) {
    console["warn"]("[TBSJ]\x20读取主世界\x20customerName\x20失败:", b);
  }
  return customerName;
}
function isLoginPage() {
  return Boolean(
    document["querySelector"]("#login-form") ||
    document["querySelector"]("#fm-login-id") ||
    document["querySelector"]("#fm-login-password"),
  );
}
function isTaobaoLoginPageUrl() {
  const a = String(window["location"]["href"] || "")["toLowerCase"]();
  return (
    a["includes"]("login.taobao.com") ||
    a["includes"]("havanalogin.taobao.com") ||
    a["includes"]("login") ||
    a["includes"]("login.do")
  );
}
function isTargetMiniLoginFrameByUrl() {
  const a = String(window["location"]["href"] || "")["toLowerCase"]();
  return ![];
}
function triggerInputEvents(a) {
  if (!a) return;
  (a["dispatchEvent"](new Event("input", { bubbles: !![] })),
    a["dispatchEvent"](new Event("change", { bubbles: !![] })));
}
function stopFillRetry() {
  if (!fillRetryTimer) return;
  (clearTimeout(fillRetryTimer), (fillRetryTimer = null));
}
function stopLoginSuccessRetry() {
  if (!loginSuccessRetryTimer) return;
  (clearTimeout(loginSuccessRetryTimer), (loginSuccessRetryTimer = null));
}
function stopRealtimePerformancePolling() {
  if (!realtimePerformanceTimer) return;
  (clearInterval(realtimePerformanceTimer), (realtimePerformanceTimer = null));
}
function reportLoginExpiredIfNeeded() {
  if (!hasLoggedInOnce || hasReportedLoginExpired) return;
  (isTaobaoLoginPageUrl() || isLoginPage()) &&
    ((hasReportedLoginExpired = !![]), ipcRenderer["send"]("account-login-expired"));
}
function checkLoginSuccessByDom() {
  if (hasSentOnlineStatus) return !![];
  const a = document["querySelector"]("[class=\x22user-area-pop-up-panel\x22]");
  console["log"]("[TBSJ]\x20登录成功图标:", a);
  if (!a) return ![];
  return (
    (hasSentOnlineStatus = !![]),
    (hasLoggedInOnce = !![]),
    (hasReportedLoginExpired = ![]),
    stopLoginSuccessRetry(),
    startRealtimePerformancePolling(),
    ipcRenderer["send"]("shop-login-success"),
    ipcRenderer["send"]("shop-status-change", { status: "在线" }),
    !![]
  );
}
function bindLoginElements(a, b, c) {
  (a &&
    !a["_binded"] &&
    (a["addEventListener"]("input", async () => {
      ((hasUserEditedLoginForm = !![]),
        await persistLoginInfo({
          subAccount: a["value"],
          password: b?.["value"] ?? "",
        }),
        stopFillRetry());
    }),
    (a["_binded"] = !![])),
    b &&
      !b["_binded"] &&
      (b["addEventListener"]("input", async () => {
        ((hasUserEditedLoginForm = !![]),
          await persistLoginInfo({
            subAccount: a?.["value"] ?? "",
            password: b["value"],
          }),
          stopFillRetry());
      }),
      (b["_binded"] = !![])),
    c &&
      !c["_binded"] &&
      (c["addEventListener"]("click", async () => {
        (await persistLoginInfo({
          subAccount: a?.["value"] ?? "",
          password: b?.["value"] ?? "",
        }),
          scheduleLoginSuccessRetry(),
          stopFillRetry());
      }),
      (c["_binded"] = !![])));
}
async function tryFillLoginForm() {
  const a = document["querySelector"]("#fm-login-id"),
    b = document["querySelector"]("#fm-login-password"),
    c = document["querySelector"](".fm-button.fm-submit.password-login");
  if (!a || !b || !c) return ![];
  bindLoginElements(a, b, c);
  const d = await getFinalLoginInfo(),
    e = d["subAccount"] === "null" ? "" : d["subAccount"],
    f = d["password"] === "null" ? "" : d["password"],
    g = !a["value"] && e,
    h = !b["value"] && f;
  g && ((a["value"] = e), triggerInputEvents(a));
  h && ((b["value"] = f), triggerInputEvents(b));
  (g || h) &&
    (await persistLoginInfo({
      subAccount: a["value"],
      password: b["value"],
    }));
  if (g && h && loginInfo["subAccount"] && loginInfo["password"] && !hasAutoSubmitted)
    return (
      (hasAutoSubmitted = !![]),
      setTimeout(() => {
        isLoginPage() && c["click"]();
      }, 0x4b0),
      !![]
    );
  return ![];
}
async function scheduleFillRetry() {
  (stopFillRetry(), (fillRetryCount = 0x0));
  const a = async () => {
    if (hasUserEditedLoginForm) {
      fillRetryTimer = null;
      return;
    }
    const b = await tryFillLoginForm();
    if (b || fillRetryCount >= MAX_FILL_RETRY) {
      fillRetryTimer = null;
      return;
    }
    ((fillRetryCount += 0x1), (fillRetryTimer = setTimeout(a, 0x3e8)));
  };
  fillRetryTimer = setTimeout(() => {
    ((fillRetryTimer = null), void a());
  }, 0x0);
}
function scheduleLoginSuccessRetry() {
  if (hasSentOnlineStatus) return;
  stopLoginSuccessRetry();
  let a = 0x0;
  const b = () => {
    if (checkLoginSuccessByDom() || a >= MAX_LOGIN_SUCCESS_RETRY) {
      loginSuccessRetryTimer = null;
      return;
    }
    ((a += 0x1), (loginSuccessRetryTimer = setTimeout(b, 0x7d0)));
  };
  b();
}
contextBridge["exposeInMainWorld"]("context_bridge", {
  send: (a, b) => ipcRenderer["send"](a, b),
  invoke: (a, b) => ipcRenderer["invoke"](a, b),
});
function bindLoginExpiredCheckOnNavigation() {
  const a = history["pushState"];
  history["pushState"] = function () {
    const c = a["apply"](this, arguments);
    return (reportLoginExpiredIfNeeded(), c);
  };
  const b = history["replaceState"];
  ((history["replaceState"] = function () {
    const c = b["apply"](this, arguments);
    return (reportLoginExpiredIfNeeded(), c);
  }),
    window["addEventListener"]("popstate", reportLoginExpiredIfNeeded),
    window["addEventListener"]("hashchange", reportLoginExpiredIfNeeded));
}
(bindLoginExpiredCheckOnNavigation(),
  window["addEventListener"]("load", async () => {
    (process["isMainFrame"] &&
      (ipcRenderer["send"]("get-shop-page-loaded"),
      console["log"]("加载完成"),
      reportLoginExpiredIfNeeded()),
      isTargetMiniLoginFrameByUrl() && ipcRenderer["send"]("get-shop-pwd"));
  }),
  document["addEventListener"]("DOMContentLoaded", async () => {
    isTargetMiniLoginFrameByUrl() && isLoginPage() && (await scheduleFillRetry());
  }),
  window["addEventListener"]("beforeunload", () => {
    stopRealtimePerformancePolling();
  }),
  safeIpcOn("get-shop-pwd", async (a, b) => {
    ((hasUserEditedLoginForm = ![]),
      (hasAutoSubmitted = ![]),
      await persistLoginInfo({
        subAccount: b?.["userName"] || "",
        password: b?.["password"] || "",
      }),
      (customerName = b?.["customerName"] || ""));
  }));
async function fetchRealtimePerformanceInfo() {
  if (isLoginPage()) return;
  if (!hasSentOnlineStatus && !checkLoginSuccessByDom()) return;
  await syncCustomerNameFromMainWorld();
  try {
    const a = new URLSearchParams({
        dateType: "today",
        pageSize: "10",
        page: "1",
        order: "desc",
        orderBy: "cstUv",
        scopeType: "sub",
        groupId: "",
        _: String(Date["now"]()),
      }),
      b = await fetch(
        "https://sycm.taobao.com/csp/api/realtime/account-list.json?" + a["toString"](),
        {
          mode: "cors",
          credentials: "include",
          method: "GET",
        },
      ),
      c = await b["json"](),
      d = Array["isArray"](c?.["data"]?.["data"]?.["data"]) ? c["data"]["data"]["data"] : [],
      e = (g) =>
        Object["prototype"]["hasOwnProperty"]["call"](g || {}, "value") ? String(g["value"]) : "";
    console["log"]("customerName====", customerName);
    const f =
      d["find"]((g) => {
        const h = e(g?.["accountNickWang"])["trim"](),
          i = String(customerName || "")["trim"]();
        return h && i && (h === i || h["includes"](i));
      }) || {};
    (console["log"]("实时绩效数据", d, f),
      ipcRenderer["send"]("get-quality-testing", {
        inquiryCount: e(f?.["cstUv"]),
        responseRateWithinThreeMin: e(f?.["threeMinReplyRate"])
          ? "" + e(f?.["threeMinReplyRate"]) * 0x64
          : "",
        averageRate: e(f?.["csAvgReplyInterval"]) || e(f?.["avgRecInterval"]),
        dissatisfiedRate: "",
        recoverRate: e(f?.["consultTrdOrdRate"]) ? e(f?.["consultTrdOrdRate"]) + "%" : "",
      }));
  } catch (g) {
    console["warn"]("[TBSJ]\x20查询实时绩效失败:", g);
  }
}
function startRealtimePerformancePolling() {
  if (realtimePerformanceTimer) return;
  (console["log"]("执行任务", customerName, realtimePerformanceTimer),
    fetchRealtimePerformanceInfo(),
    (realtimePerformanceTimer = setInterval(() => {
      fetchRealtimePerformanceInfo();
    }, REALTIME_PERFORMANCE_INTERVAL)));
}
function formatDate(a) {
  const b = a["getFullYear"](),
    c = String(a["getMonth"]() + 0x1)["padStart"](0x2, "0"),
    d = String(a["getDate"]())["padStart"](0x2, "0");
  return "" + b + c + d;
}
function parseCompactDate(a) {
  const b = Number(String(a)["slice"](0x0, 0x4)),
    c = Number(String(a)["slice"](0x4, 0x6)) - 0x1,
    d = Number(String(a)["slice"](0x6, 0x8));
  return new Date(b, c, d);
}
function splitRangesByMonth(a, b) {
  const c = [];
  let d = parseCompactDate(a);
  const e = parseCompactDate(b);
  while (d <= e) {
    const f = new Date(d),
      g = new Date(d["getFullYear"](), d["getMonth"]() + 0x1, 0x0),
      h = g < e ? g : e;
    (c["push"]({
      startDate: formatDate(f),
      endDate: formatDate(h),
    }),
      (d = new Date(h)),
      d["setDate"](d["getDate"]() + 0x1));
  }
  return c;
}
function normalizePerformanceItem(a = {}) {
  return {
    volume: Number(a["cstUv1d"] || 0x0),
    conversionRate: Number(a["inquiryFinalTcr"] || 0x0),
    averageResp: Number(a["avgReplyDur1d"] || 0x0),
    satisfactionRate: Number(a["allCstSftRate"] || 0x0),
    minuteResp: Number(a["manReplyRate3min"] || 0x0),
  };
}
function mergePerformanceItems(a, b) {
  const c = normalizePerformanceItem(a),
    d = normalizePerformanceItem(b),
    e = c["volume"] + d["volume"],
    f = (g, h) => {
      if (!e) return 0x0;
      return (g * c["volume"] + h * d["volume"]) / e;
    };
  return {
    volume: e,
    conversionRate: f(c["conversionRate"], d["conversionRate"]),
    averageResp: f(c["averageResp"], d["averageResp"]),
    satisfactionRate: f(c["satisfactionRate"], d["satisfactionRate"]),
    minuteResp: f(c["minuteResp"], d["minuteResp"]),
  };
}
const HOOK_CODE = () => {
  const a = XMLHttpRequest["prototype"]["open"],
    b = XMLHttpRequest["prototype"]["send"];
  function c(e, f) {
    return String(e || "")["toLowerCase"]() === "post" && String(f || "")["includes"]("login.do");
  }
  function d(e) {
    if (typeof e !== "string" || !e) return e;
    const f = new URLSearchParams(e);
    return (
      f["set"]("isIframe", "true"),
      f["set"]("documentReferer", "https://sycm.taobao.com/"),
      f["set"]("bizParams", "taobaoBizLoginFrom=sycm&renderRefer=https%3A%2F%2Fsycm.taobao.com%2F"),
      f["toString"]()
    );
  }
  ((XMLHttpRequest["prototype"]["open"] = function (e, f) {
    ((this["_method"] = e),
      (this["_url"] = f),
      console["log"]("url", this["_url"]),
      a["apply"](this, arguments));
  }),
    (XMLHttpRequest["prototype"]["send"] = function (e) {
      const f = c(this["_method"], this["_url"]) ? d(e) : e;
      b["call"](this, f);
    }));
};
webFrame["executeJavaScript"]("(" + HOOK_CODE + ")()");
