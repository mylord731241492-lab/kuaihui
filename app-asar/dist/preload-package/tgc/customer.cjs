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
let currentShopName = "";
function getReadableErrorMessage(a) {
  if (!a) return "未知错误";
  if (typeof a === "string") return a;
  if (a instanceof Error) return a["stack"] || a["message"] || String(a);
  if (typeof a === "object") {
    const b = a["message"] || a["reason"]?.["message"] || "",
      c = a["stack"] || a["reason"]?.["stack"] || "",
      d = a["filename"] || "",
      e = a["lineno"] ? ":" + a["lineno"] : "",
      f = a["colno"] ? ":" + a["colno"] : "",
      g = d ? "\x20" + d + e + f : "";
    if (b || c) return ("" + b + g + (c ? "\x0a" + c : ""))["trim"]();
  }
  return String(a);
}
function reportGlobalPreloadError(a, b) {
  ipcRenderer["send"]("write-preload-error-log", {
    shopName: currentShopName || "未知店铺",
    platform: "tgc",
    errorMessage: a + ":\x20" + getReadableErrorMessage(b),
    time: new Date()["toLocaleString"]("zh-CN", { hour12: ![] }),
  });
}
const apiHealthMonitor = {
  recentRequests: [],
  MAX_RECORDS: 0xa,
  initialized: ![],
  record(a) {
    (this["recentRequests"]["push"](a),
      this["recentRequests"]["length"] > this["MAX_RECORDS"] && this["recentRequests"]["shift"]());
  },
  isHealthy() {
    if (this["recentRequests"]["length"] < 0x3) return !![];
    const a = this["recentRequests"]["filter"]((b) => !b)["length"];
    return a / this["recentRequests"]["length"] < 0.5;
  },
  init() {
    if (this["initialized"]) return;
    this["initialized"] = !![];
    const a = this,
      b = window["fetch"];
    ((window["fetch"] = async function (...c) {
      try {
        const d = await b["apply"](this, c),
          f = typeof c[0x0] === "string" ? c[0x0] : c[0x0]?.["url"] || "";
        return (!f["includes"](".js") && !f["includes"](".css") && a["record"](d["ok"]), d);
      } catch (g) {
        const h = typeof c[0x0] === "string" ? c[0x0] : c[0x0]?.["url"] || "";
        a["record"](![]);
        throw g;
      }
    }),
      console["log"]("[API健康监控]\x20已初始化"));
  },
};
apiHealthMonitor["init"]();
let isUserOperating = ![],
  lastMouseActivity = 0x0,
  windowHasFocus = ![],
  userActivityTimer = null,
  USER_ACTIVITY_TIMEOUT = 0xbb8,
  is_key = null,
  shopBotStatus = null,
  message = null,
  isProcessing = ![];
const userMap = new Map(),
  sleepMsg = new Map();
let orderList = [];
function interceptDevToolsShortcuts(a) {
  if (a["key"] === "F12")
    return (a["preventDefault"](), a["stopPropagation"](), a["stopImmediatePropagation"](), ![]);
  if ((a["key"] === "I" || a["key"] === "i") && a["ctrlKey"] && a["shiftKey"])
    return (a["preventDefault"](), a["stopPropagation"](), a["stopImmediatePropagation"](), ![]);
  if ((a["key"] === "J" || a["key"] === "j") && a["ctrlKey"] && a["shiftKey"])
    return (a["preventDefault"](), a["stopPropagation"](), a["stopImmediatePropagation"](), ![]);
  if ((a["key"] === "K" || a["key"] === "k") && a["ctrlKey"] && a["shiftKey"])
    return (a["preventDefault"](), a["stopPropagation"](), a["stopImmediatePropagation"](), ![]);
  if ((a["key"] === "C" || a["key"] === "c") && a["ctrlKey"] && a["shiftKey"])
    return (a["preventDefault"](), a["stopPropagation"](), a["stopImmediatePropagation"](), ![]);
}
document["addEventListener"]("keydown", interceptDevToolsShortcuts, !![]);
document["readyState"] === "loading" &&
  document["addEventListener"]("DOMContentLoaded", function () {
    document["addEventListener"]("keydown", interceptDevToolsShortcuts, !![]);
  });
(window["addEventListener"]("error", (a) => {
  (console["error"]("全局\x20JavaScript\x20错误:", a["error"]),
    reportGlobalPreloadError("全局错误", a["error"] || a));
}),
  window["addEventListener"]("unhandledrejection", (a) => {
    (console["error"]("未处理的\x20Promise\x20拒绝:", a["reason"]),
      reportGlobalPreloadError("未捕获的promise错误", a["reason"] || a));
  }));
let retryCount = 0x0;
const maxRetries = 0x1e;
let that_pvId = null,
  listdom,
  messageQueue = [],
  isProcessingQueue = ![];
const enqueuedIds = new Set();
let logoInfo = {
    username: "",
    password: "",
  },
  shopInfo = {
    id: null,
    name: null,
    username: null,
  },
  commonLoginByXspaceInfo = {
    xpScene: "",
    xpToken: "",
    xpServicerId: "",
    buId: "",
    callback: "",
  },
  cookie = null;
function getHttpAccountPassword() {
  const a = new URL(window["location"]["href"]),
    b = new URLSearchParams(a["search"]);
  let c = b["get"]("username"),
    d = b["get"]("password");
  if (!c || !d) {
    const e = b["get"]("redirect_url");
    if (e)
      try {
        const f = decodeURIComponent(e),
          g = new URL(f),
          h = new URLSearchParams(g["search"]);
        ((c = h["get"]("username") == "null" ? "" : h["get"]("username")),
          (d = h["get"]("password") == "null" ? "" : h["get"]("password")));
      } catch (i) {
        console["error"]("解析redirect_url失败:", i);
      }
  }
  return {
    username: c,
    password: d,
  };
}
(contextBridge["exposeInMainWorld"]("context_bridge", {
  send: (a, b) => ipcRenderer["send"](a, b),
  invoke: (a, b) => ipcRenderer["invoke"](a, b),
  on: (a, b) => safeIpcOn(a, b),
}),
  window["addEventListener"]("load", () => {
    console["log"]("页面加载成功");
    const a = document["createElement"]("style");
    (a["setAttribute"]("data-disable-anim", "true"),
      setTimeout(() => {
        ipcRenderer["send"]("request-shop-bot-status");
      }, 0x3e8));
    try {
      fetch("https://c2mbc.service.xixikf.cn/g_config.js", {
        method: "GET",
        mode: "cors",
        credentials: "include",
      })
        ["then"]((d) => d["text"]())
        ["then"]((d) => {
          const e = /"currentUser"\s*:\s*(\{[\s\S]*?\})\s*,\s*"thirdPartyLogin"/,
            f = d["match"](e);
          if (f) {
            const g = f[0x1],
              h = JSON["parse"](g);
            (console["log"]("shopmessage==========>", h),
              (shopInfo["username"] = h["showName"]),
              (shopInfo["id"] = h["servicerId"]),
              (shopInfo["name"] = h["showName"]),
              (currentShopName = shopInfo["name"] || ""),
              console["log"]("shopInfo==========>", shopInfo),
              ipcRenderer["send"]("get-shop-info", shopInfo),
              loopDom());
          }
        });
    } catch (d) {
      console["log"]("捕获异常", d);
    }
    ipcRenderer["send"]("get-shop-page-loaded");
    const b = document["querySelector"]("#alibaba-login-box");
    if (b) {
      const e = b["src"];
      console["log"]("url=========>", e);
      const { username: f, password: g } = getHttpAccountPassword();
      window["location"]["href"] = e + "&username=" + f + "&password=" + g;
      return;
    }
    const c = window["location"]["href"];
    if (c && c["includes"]("https://havanalogin.taobao.com/mini_login.htm")) {
      const h = document["querySelector"]("#mini-login-body"),
        i = h["querySelector"]("#container");
      h &&
        i &&
        (h["style"]["setProperty"]("padding", "100px", "important"),
        i["style"]["setProperty"]("background", "#85858575"),
        i["style"]["setProperty"]("border", "1px\x20solid\x20#dbdbdbff"),
        i["style"]["setProperty"]("border-radius", "10px"),
        i["style"]["setProperty"]("padding", "30px"));
      const { username: j, password: k } = getHttpAccountPassword(),
        l = document["querySelector"]("[name=\x22fm-login-id\x22]"),
        m = document["querySelector"]("[name=\x22fm-login-password\x22]");
      ((l["value"] = j == "null" ? "" : j), (m["value"] = k == "null" ? "" : k));
      const n = document["querySelector"]("[type=\x22submit\x22]");
      n["click"]();
    }
    checkElement();
  }));
const checkElement = async () => {
    retryCount++;
    const a = document["querySelector"](
      ".xixikf-workbench_components-shell-banner_app-display-name",
    );
    a
      ? ((window["alert"] = (b) => {
          console["log"]("alert\x20被拦截:", b);
        }),
        (window["confirm"] = (b) => {
          return (console["log"]("confirm\x20被拦截:", b), !![]);
        }),
        getListMessage())
      : retryCount < maxRetries
        ? setTimeout(checkElement, 0xbb8)
        : console["log"]("淘工厂DOM检查失败，已尝试" + maxRetries + "次");
  },
  getListMessage = () => {
    let a = 0x0;
    const b = 0xa,
      c = () => {
        (a++,
          (listdom = document["querySelector"](
            ".xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-tao-factory-online-touch-explorer-assigned-touch-list_container",
          )),
          listdom
            ? console["log"]("元素检查完毕成功监听")
            : a < b
              ? setTimeout(c, 0xbb8)
              : console["log"]("列表元素查询失败，已尝试" + b + "次(30秒)"));
      };
    c();
  },
  checkTimecontContent = (a, b = 0x0) => {
    return new Promise((c) => {
      if (a && a["textContent"]["trim"]() !== "") c(a["textContent"]["trim"]());
      else
        b < 0x19
          ? setTimeout(() => {
              checkTimecontContent(a, b + 0x1)["then"](c);
            }, 0x64)
          : c("");
    });
  };
(safeIpcOn("click-customer-message", async (a, b) => {
  (console["log"]("点击发送消息按钮", b), await gotoUser(b));
}),
  safeIpcOn("login-do-result", (a, b) => {
    console["log"]("登录状态", b);
    if (b["content"]["data"]["returnUrl"]) {
      const c = document["querySelector"]("[name=\x22fm-login-id\x22]"),
        d = document["querySelector"]("[name=\x22fm-login-password\x22]"),
        e = document["querySelector"]("[name=\x22fm-sms-login-id\x22]");
      if (c && d)
        ((logoInfo["username"] = c["value"]),
          (logoInfo["password"] = d["value"]),
          (window["location"]["href"] = b["content"]["data"]["returnUrl"]));
      else
        e &&
          e["value"] &&
          ((logoInfo["username"] = e["value"]),
          (window["location"]["href"] = b["content"]["data"]["returnUrl"]));
      ipcRenderer["send"]("loginInfo", logoInfo);
    }
  }),
  safeIpcOn("reply-message", async (a, b) => {
    console["log"]("兜底回复信息", b);
    try {
      let c = [];
      if (typeof b === "object") c = [b];
      else {
        const d = JSON["parse"](b);
        c = d;
      }
      (console["log"]("发送列表", c), processNextMessage(c));
    } catch (e) {
      b["isBottomLineAutoReply"] && processNextMessage([b]);
    }
  }));
async function processNextMessage(a) {
  const b = a["shift"](),
    c = Array["isArray"](b) ? b[0x0] : b;
  (console["log"]("开始发送消息=========>11111", c),
    (c?.["imageBase64"] || c?.["imageUrl"]) &&
      (sendImage(c?.["imageBase64"], c["messageId"], c["covid"], c["imageUrl"]),
      await delay(0x1f4)),
    window["postMessage"]({
      type: "send-message",
      data: {
        content: c["replyContent"],
        messageId: c["messageId"],
        covid: c["covid"],
      },
    }),
    setTimeout(() => {
      (ipcRenderer["send"]("get-customer-callback-result", {
        ...c,
        isAiInviteReply: c["isAiInviteReply"],
        isReminderReply: c["isReminderReply"],
        isBottomLineAutoReply: c["isBottomLineAutoReply"],
        isAiAutoReply: !c["isBottomLineAutoReply"],
      }),
        userMap["delete"](c["messageId"]));
    }, 0x5dc));
}
const handleReplyMessage = async (a) => {
    if (a["isBottomLineAutoReply"]) {
      if (is_key)
        return (console["log"]("[兜底回复]\x20当前页面可见，不回复", a["messageId"]), ![]);
    }
    const b = await gotoUser(a);
    console["log"]("找到输入框，开始发送消息", b);
    if (b) {
      (b["focus"](), (b["innerHTML"] = a["content"]));
      const c = new InputEvent("input", {
        bubbles: !![],
        inputType: "insertText",
        data: a["content"],
      });
      (b["dispatchEvent"](c), await delay(0x64));
      const d = await getElementRecursively("[aria-label=\x27在线会话输入框发送按钮\x27]");
      if (b["textContent"]["trim"]() === "")
        return (
          console["log"]("输入框内容为空，无法发送"),
          (a["isBottomLineAutoReply"] = ![]),
          ![]
        );
      const e = 0x5;
      let f = 0x0,
        g = ![];
      while (f < e && !g) {
        (d["removeAttribute"]("disabled"), console["log"]("发送"));
        d && !d["disabled"]
          ? (d["click"](), console["log"]("按钮发送====="))
          : (b["dispatchEvent"](
              new KeyboardEvent("keydown", {
                key: "Enter",
                code: "Enter",
                bubbles: !![],
                cancelable: !![],
              }),
            ),
            b["dispatchEvent"](
              new KeyboardEvent("keyup", {
                key: "Enter",
                code: "Enter",
                bubbles: !![],
                cancelable: !![],
              }),
            ),
            console["log"]("模拟回车发送====="));
        await delay(0x1f4);
        if (b["textContent"]["trim"]() === "")
          return (
            (g = !![]),
            console["log"]("发送成功=====", a["content"]),
            (a["isBottomLineAutoReply"] = !![]),
            !![]
          );
        else
          (f++,
            console["log"]("第" + f + "次发送失败，输入框内容:", b["textContent"]["trim"]()),
            f < e && (console["log"]("准备重试..."), await delay(0x12c)));
      }
      if (!g)
        return (
          console["error"]("发送失败，已重试" + e + "次:", a["content"]),
          (a["isBottomLineAutoReply"] = ![]),
          ![]
        );
      return ((a["isBottomLineAutoReply"] = !![]), !![]);
    }
    return ((a["isBottomLineAutoReply"] = ![]), ![]);
  },
  gotoUser = async (a) => {
    try {
      (console["log"]("跳转到当前用户============", a),
        document["querySelector"]("[aria-label=\x22快捷方式:在线客服\x22]")["click"]());
      let b = await getElementRecursively("[data-id=\x22" + a["messageId"] + "\x22]");
      console["log"]("theUser", b);
      if (!b) return null;
      b["click"]();
      const c = await getElementRecursively("#xixi-editor-" + a["messageId"]);
      return (console["log"]("inputBox", c), c);
    } catch (d) {
      console["log"]("gotoUser\x20error===========", d);
    }
  },
  getElementRecursively = (a, b = 0x0, c = 0x23) => {
    return new Promise((d) => {
      const e = document["querySelector"](a);
      if (e) d(e);
      else
        b < c
          ? setTimeout(() => {
              getElementRecursively(a, b + 0x1, c)["then"](d);
            }, 0x64)
          : d(null);
    });
  },
  HOOK_CODE = function () {
    let a = null,
      b = {
        id: null,
        name: null,
        username: null,
      };
    const c = window["WebSocket"];
    window["WebSocket"] = function (n, o) {
      const p = new c(n, o),
        q = p["send"];
      return (
        (p["send"] = function (r) {
          q["apply"](this, arguments);
        }),
        p["addEventListener"]("error", function (r) {
          console["info"]("wss断开");
        }),
        p["addEventListener"]("open", function (r) {
          console["info"]("打开ws");
        }),
        p["addEventListener"]("close", function (r) {
          console["info"]("WebSocket连接关闭");
        }),
        p
      );
    };
    const d = "https://c2mbc.api.xixikf.cn/xixi-scheduler/graphql/1.0/InitSeatStatus",
      e = "https://c2mbc.api.xixikf.cn/xixi-scheduler/graphql/1.0/ChangeStatus",
      f = "https://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/OnlineTouches",
      g = "/base/user-tenants",
      h = "https://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/SendMessage",
      i = "https://c2mbc.api.xixikf.cn/h5/mopen.code.bundle.appx.runtime.info/1.0/",
      j =
        "https://c2mbc.api3.xixikf.cn/self-service-workbench/bizql/1.0/BizSupplierOrder__SelfServiceWorkbenchpbib",
      k = "https://c2mbc.service.xixikf.cn/g_config.js";
    let l = !![];
    const m = window["fetch"];
    ((window["fetch"] = async (...n) => {
      let o = null;
      try {
        const p = n[0x1]?.["method"],
          q = typeof n[0x0] === "string" ? n[0x0] : n[0x0]["url"] || "";
        if (p == "post" && q["includes"](d)) {
          if (n[0x1]?.["config"]?.["data"]?.["variables"]?.["channelType"] == "ONLINE") {
            const r = await m(...n);
            ((o = r["clone"]()), console["log"]("==================", o));
            const { data: s } = await o["json"]();
            console["log"]("_this_status============data", s);
            if (s?.["currentStatus"]?.["statusId"] == 0x1)
              window["context_bridge"]["send"]("shop-status-change", { status: "离线" });
            else {
              const t = s?.["statusList"]?.["find"](
                (u) => u["statusId"] == s["currentStatus"]["statusId"],
              );
              t &&
                window["context_bridge"]["send"]("shop-status-change", { status: t["statusName"] });
            }
            return r;
          }
        } else {
          if (p == "post" && q["includes"](e)) {
            console["log"]("fetch===========", n);
            const u = await m(...n);
            o = u["clone"]();
            const { data: v } = await o["json"](),
              w = v?.["changeStatus"]?.["statusId"];
            switch (w) {
              case "1":
                window["context_bridge"]["send"]("shop-status-change", { status: "离线" });
                break;
              case "2":
                window["context_bridge"]["send"]("shop-status-change", { status: "接线" });
                break;
              case "3":
                window["context_bridge"]["send"]("shop-status-change", { status: "申请忙碌" });
                break;
              case "5":
                window["context_bridge"]["send"]("shop-status-change", { status: "申请离线" });
                break;
              case "6":
                window["context_bridge"]["send"]("shop-status-change", { status: "培训" });
                break;
              case "19":
                window["context_bridge"]["send"]("shop-status-change", { status: "小休" });
                break;
              case "20":
                window["context_bridge"]["send"]("shop-status-change", { status: "申请小休" });
                break;
              default:
                break;
            }
            return u;
          } else {
            if (p == "post" && q["includes"](h)) {
              const x = JSON["parse"](n[0x1]?.["body"] || "{}"),
                y = x?.["variables"]?.["input"]?.["header"]?.["props"]?.["onlineTouchId"];
              console["log"]("body", x);
              const z = x?.["variables"]?.["input"]?.["content"]?.["text"];
              y &&
                (window["context_bridge"]["send"]("reply-customer-message", {
                  messageId: y,
                  sendTarget: "tgc5",
                  content: z,
                }),
                window["postMessage"]({
                  type: "delete-message",
                  messageId: y,
                }));
            } else {
              if (p == "post" && q["includes"](i))
                ((a = n[0x1]?.["config"]?.["searchURLParams"]?.["__pvId"]),
                  a &&
                    window["postMessage"]({
                      type: "pvId",
                      pvId: a,
                    }));
              else {
                if (p == "post" && q["includes"](j)) {
                  const A = JSON["parse"](n[0x1]?.["body"] || "{}"),
                    B = await m(...n);
                  o = B["clone"]();
                  const { data: C } = await o["json"]();
                  if (C?.["result"]?.["dataList"]) {
                    const D = C?.["result"]?.["dataList"]["map"]((E) => {
                      return {
                        userId: A?.["variables"]?.["input"]?.["buyerId"],
                        orderId: E?.["mainOrderId"],
                        orderName: E?.["subOrders"][0x0]?.["itemTitle"],
                        orderStatus:
                          E?.["subOrders"][0x0]?.["refundStatus"] ||
                          E?.["subOrders"][0x0]?.["subOrderStatus"],
                        time: new Date(E?.["subOrders"][0x0]?.["gmtCreate"]["replace"](/\//g, "-"))[
                          "getTime"
                        ](),
                      };
                    });
                    window["postMessage"]({
                      type: "order-list",
                      data: D,
                    });
                  }
                }
              }
            }
          }
        }
      } catch (E) {
        return (console["error"]("fetch\x20拦截器出错:", E), m(...n));
      } finally {
        o = null;
        try {
          return m(...n);
        } catch (F) {
          return (console["error"]("finally\x20块中的\x20fetch\x20请求失败:", F), m(...n));
        }
      }
    }),
      window["addEventListener"]("message", (n) => {
        if (n["data"]["type"] == "send-message") {
          console["log"]("e.send-message", n["data"]["data"]);
          const { content: o, messageId: p, covid: q } = n["data"]["data"],
            r = Date["now"]();
          fetch(
            "https://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/SendMessage?operationName=SendMessage&operationType=mutation&__pvId=" +
              a,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON["stringify"]({
                query:
                  "\x0a\x20\x20\x20\x20mutation\x20SendMessage($input:\x20IMSendMessageInput!)\x20{\x0a\x20\x20sendMessage(input:\x20$input)\x20{\x0a\x20\x20\x20\x20...\x20on\x20IMSendMessageSuccessPayload\x20{\x0a\x20\x20\x20\x20\x20\x20isRejected\x0a\x20\x20\x20\x20\x20\x20gmtCreate\x0a\x20\x20\x20\x20\x20\x20messageId\x0a\x20\x20\x20\x20\x20\x20sequence\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20...\x20on\x20IMSendMessageRejectedPayload\x20{\x0a\x20\x20\x20\x20\x20\x20isRejected\x0a\x20\x20\x20\x20\x20\x20rejectedReason\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20content\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20...\x20on\x20IMRiskCheckContent\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20details\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20keywords\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20level\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20remark\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20...\x20on\x20IMBizRuleCheckContent\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20level\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20remark\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20type\x0a\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20}\x0a\x20\x20}\x0a}\x0a\x20\x20\x20\x20",
                variables: {
                  input: {
                    id: r,
                    contentType: "PLAIN_TEXT",
                    content: { text: o },
                    header: {
                      conversationId: "ocs_" + q + "_c2m-TB-MZ",
                      version: "1.0",
                      props: {
                        onlineTouchId: p,
                        msgId: r,
                      },
                    },
                    ignoreNormalRisk: !![],
                  },
                },
                operationName: "SendMessage",
              }),
            },
          )
            ["then"]((s) => s["json"]())
            ["then"]((s) => {
              s["errors"] &&
                fetch(
                  "https://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/SendMessage?operationName=SendMessage&operationType=mutation&__pvId=" +
                    a,
                  {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON["stringify"]({
                      query:
                        "\x0a\x20\x20\x20\x20mutation\x20SendMessage($input:\x20IMSendMessageInput!)\x20{\x0a\x20\x20sendMessage(input:\x20$input)\x20{\x0a\x20\x20\x20\x20...\x20on\x20IMSendMessageSuccessPayload\x20{\x0a\x20\x20\x20\x20\x20\x20isRejected\x0a\x20\x20\x20\x20\x20\x20gmtCreate\x0a\x20\x20\x20\x20\x20\x20messageId\x0a\x20\x20\x20\x20\x20\x20sequence\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20...\x20on\x20IMSendMessageRejectedPayload\x20{\x0a\x20\x20\x20\x20\x20\x20isRejected\x0a\x20\x20\x20\x20\x20\x20rejectedReason\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20content\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20...\x20on\x20IMRiskCheckContent\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20details\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20keywords\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20level\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20remark\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20...\x20on\x20IMBizRuleCheckContent\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20level\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20remark\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20type\x0a\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20}\x0a\x20\x20}\x0a}\x0a\x20\x20\x20\x20",
                      variables: {
                        input: {
                          id: r,
                          contentType: "PLAIN_TEXT",
                          content: { text: o },
                          header: {
                            conversationId: "ocs_" + q + "_c2m-TB-GC",
                            version: "1.0",
                            props: {
                              onlineTouchId: p,
                              msgId: r,
                            },
                          },
                          ignoreNormalRisk: !![],
                        },
                      },
                      operationName: "SendMessage",
                    }),
                  },
                );
            });
        }
      }));
  };
(webFrame["executeJavaScriptInIsolatedWorld"](0x0, [{ code: "(" + HOOK_CODE + ")();" }]),
  safeIpcOn("get-goods-detail-by-id", (a, b) => {
    console["log"]("根据商品id获取商品详情", b);
  }),
  safeIpcOn("get-all-goods-detail", (a, b) => {
    console["log"]("获取所有商品详情", b);
  }),
  window["addEventListener"]("message", (a) => {
    const { type: b, data: c, pvId: d } = a["data"] || {};
    console["log"]("type============", b);
    if (!b) return;
    if (b === "delete-message") {
      (userMap["delete"](c?.["messageId"]),
        sleepMsg["set"](c?.["messageId"], !![]),
        setTimeout(() => {
          sleepMsg["delete"](c?.["messageId"]);
        }, 0x5dc));
      return;
    }
    if (b === "pvId") {
      ((that_pvId = d), minToTime(that_pvId));
      return;
    }
    a["data"] && a["data"]["type"] === "WS_STATE_CHANGE" && (wsConnectState = a["data"]["state"]);
    if (b === "order-list") {
      if (!Array["isArray"](c) || c["length"] === 0x0) return;
      const e = c[0x0],
        f = orderList["findIndex"]((g) => g["userId"] === e["userId"]);
      (f !== -0x1 ? (orderList[f] = e) : orderList["push"](e),
        orderList["sort"]((g, h) => h["time"] - g["time"]),
        ipcRenderer["send"]("get-customer-message-list", [orderList[0x0]]),
        orderList["splice"](0x1));
    }
  }));
const minToTime = (a) => {
  setTimeout(() => {
    try {
      const b = new Date();
      b["setUTCHours"](0x0, 0x0, 0x0, 0x0);
      const c = new Date();
      (c["setUTCHours"](0x17, 0x3b, 0x3b, 0x3e7),
        b["toISOString"](),
        c["toISOString"](),
        fetch(
          "https://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/OnlineTouches?operationName=OnlineTouches&operationType=query&__pvId=" +
            (a || that_pvId) +
            "&__bundle=com.xixikf.c2mbc.im.desk.extension",
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON["stringify"]({
              operationName: "OnlineTouches",
              query:
                "\x0a\x20\x20\x20\x20query\x20OnlineTouches($input:\x20IMQueryOnlineTouchInput)\x20{\x0a\x20\x20onlineTouches(input:\x20$input)\x20{\x0a\x20\x20\x20\x20list\x20{\x0a\x20\x20\x20\x20\x20\x20...OnlineToucheFragment\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20page\x20{\x0a\x20\x20\x20\x20\x20\x20current\x0a\x20\x20\x20\x20\x20\x20pageSize\x0a\x20\x20\x20\x20\x20\x20total\x0a\x20\x20\x20\x20}\x0a\x20\x20}\x0a}\x0a\x20\x20\x20\x20\x0a\x20\x20\x20\x20fragment\x20OnlineToucheFragment\x20on\x20IMOnlineTouch\x20{\x0a\x20\x20id\x0a\x20\x20isServiceNoteSaved\x0a\x20\x20isTransferred\x0a\x20\x20unreadCount\x0a\x20\x20latestMessage\x0a\x20\x20assignType\x0a\x20\x20assignedTime\x0a\x20\x20noReplyStartTime\x0a\x20\x20closeReason\x0a\x20\x20closeTime\x0a\x20\x20messageBeginSequence\x0a\x20\x20messageEndSequence\x0a\x20\x20onlineTouchDuration\x0a\x20\x20state\x0a\x20\x20flagId\x0a\x20\x20remark\x0a\x20\x20onlineTouchSummary\x0a\x20\x20associatedWorkState\x0a\x20\x20groupKey\x0a\x20\x20isBeManaged\x0a\x20\x20manageType\x0a\x20\x20isKept\x0a\x20\x20todoContent\x20{\x0a\x20\x20\x20\x20normalCnt\x0a\x20\x20\x20\x20overdueGoingCnt\x0a\x20\x20\x20\x20overdueCnt\x0a\x20\x20}\x0a\x20\x20type\x0a\x20\x20touchConfig\x20{\x0a\x20\x20\x20\x20enableMessageReading\x0a\x20\x20\x20\x20enableServicerRevokeMessage\x0a\x20\x20\x20\x20enableMessageQuote\x0a\x20\x20}\x0a\x20\x20tags\x20{\x0a\x20\x20\x20\x20description\x0a\x20\x20\x20\x20iconUrl\x0a\x20\x20\x20\x20label\x0a\x20\x20\x20\x20type\x0a\x20\x20\x20\x20key\x0a\x20\x20\x20\x20level\x0a\x20\x20\x20\x20order\x0a\x20\x20}\x0a\x20\x20conversation\x20{\x0a\x20\x20\x20\x20avatar\x0a\x20\x20\x20\x20id\x0a\x20\x20\x20\x20name\x20@supportmask\x0a\x20\x20\x20\x20participants\x20{\x0a\x20\x20\x20\x20\x20\x20id\x0a\x20\x20\x20\x20\x20\x20avatar\x0a\x20\x20\x20\x20\x20\x20name\x20@supportmask\x0a\x20\x20\x20\x20\x20\x20type\x0a\x20\x20\x20\x20\x20\x20latestReadSequence\x0a\x20\x20\x20\x20}\x0a\x20\x20}\x0a\x20\x20props\x0a\x20\x20touchManagedTime\x0a\x20\x20isBeMuted\x0a\x20\x20mutedReason\x0a}\x0a\x20\x20\x20\x20",
              variables: {
                input: {
                  types: ["ONLINE"],
                  state: "ASSIGNED",
                  gmtCreateRange: {
                    start: b,
                    end: c,
                  },
                  pageInput: {
                    current: 0x1,
                    pageSize: 0x14,
                  },
                },
              },
            }),
          },
        )
          ["then"]((d) => d["json"]())
          ["then"]((d) => {
            if (d?.["errors"]) {
              ipcRenderer["send"]("account-login-expired");
              return;
            }
            console["log"]("\x20获取数据=====>\x20", d);
            const {
              data: {
                onlineTouches: { list: e },
              },
            } = d;
            e["forEach"]((f) => {
              try {
                if (
                  (f["latestMessage"]["header"]["sender"] &&
                    f["latestMessage"]["header"]["sender"]["type"] &&
                    f["latestMessage"]["header"]["sender"]["type"] == "CUSTOMER") ||
                  (f["latestMessage"]["header"]["sender"] &&
                    f["latestMessage"]["header"]["sender"]["type"] &&
                    f["latestMessage"]["header"]["sender"]["type"] == "CHATBOT")
                ) {
                  let g = {};
                  const h = f["latestMessage"],
                    {
                      header: { props: i },
                    } = h;
                  ((g["content"] = h?.["content"]?.["text"] || ""),
                    (g["timeout"] = Math["floor"]((i["timestamp"] + 0x7530) / 0x3e8)),
                    (g["api"] = !![]),
                    (g["isTimeout"] = i["timestamp"] + 0x7530 < Date["now"]()),
                    (g["messageId"] = f["id"]),
                    (g["username"] = f["props"]["userNick"]),
                    (g["covid"] = h?.["header"]?.["sender"]?.["id"]),
                    console["log"]("接口=======", g));
                  if (userMap["has"](f["id"])) {
                    const j = userMap["get"](f["id"]);
                    j?.["content"] != g?.["content"] &&
                      (userMap["set"](f["id"], g), (g["type"] = "code"));
                  } else (userMap["set"](f["id"], g), (g["type"] = "code"));
                  if (!sleepMsg["has"](g["messageId"]))
                    ipcRenderer["send"]("get-customer-message-list", [g]);
                }
              } catch (k) {
                console["log"]("err", k);
              }
            });
          })
          ["catch"]((d) => {
            console["log"]("接口补偿错误err==============", d);
          }));
    } catch (d) {
    } finally {
      minToTime(a);
    }
  }, 0x1388);
};
function extractContentFromCCOMASK(a) {
  try {
    const b = a["replace"](/^.*?CCOMASK/, "")["trim"](),
      c = JSON["parse"](b);
    return c["content"];
  } catch (d) {
    return (console["error"]("解析\x20CCOMASK\x20失败:", d), "游客");
  }
}
safeIpcOn("get-shop-cookie", (a, b) => {
  cookie = cookieArrayToHeaderString(b);
});
function cookieArrayToHeaderString(a) {
  return a["map"]((b) => b["name"] + "=" + b["value"])["join"](";\x20");
}
safeIpcOn("get-shop-user", gethistoryMessage);
async function gethistoryMessage(a, b) {
  console["log"]("ai获取用户历史聊天记录\x20传递参数", b);
  const c = document["querySelector"](
      "[data-c-l-i=\x27com.xixikf.imdesk.IMDeskApp/im-touch-chat-input-box\x27]",
    ),
    d = (windowHasFocus && isUserOperating) || (c && c["textContent"]);
  if (d) {
    ipcRenderer["send"]("get-shop-isuser-status", { hasContent: d });
    return;
  }
  ipcRenderer["send"]("get-shop-isuser-status", { hasContent: d });
  let e = {
    ...b,
    history: [],
  };
  (await gotoUser(b), await delay(0x1f4));
  const f = await getUrlUeserHistoryMessage(b["messageId"]);
  if (!f) return;
  const g = lastContinuousCustomerBlock(f);
  if (!g || g["length"] === 0x0) return;
  let h = null,
    i = null,
    j = g["map"]((l) => {
      const m = {
          messageId: b?.["messageId"],
          username: b?.["username"],
          role: "user",
          goodId: "",
          orderId: "",
          orderName: "",
          orderStatus: "",
          goodName: "",
          userId: l?.["header"]?.["sender"]?.["id"] || "",
        },
        n = l?.["contentType"],
        o = l?.["content"]?.["data"]?.["code"],
        p = l?.["content"]?.["data"],
        q = p?.["bizInfo"] || {},
        r = q?.["title"]?.["content"] || l?.["content"]?.["text"] || "";
      if (n === "CARD")
        switch (o) {
          case "order":
            i = {
              orderStatus: q?.["status"] || "",
              orderId: p?.["data"]?.["orderId"] || "",
              orderName: r,
            };
            return {
              ...m,
              ...i,
              content: r,
            };
          case "item":
            h = {
              goodId: p?.["basicInfo"]?.["title"]?.["copyContent"] || "",
              goodName: r,
            };
            return {
              ...m,
              ...h,
              content: r,
            };
          default:
            return {
              ...m,
              content: r,
            };
        }
      if (n === "IMAGE" || n === "VIDEO")
        return {
          ...m,
          content: "[用户发送" + (n === "IMAGE" ? "图片" : "视频") + "]",
        };
      return {
        ...m,
        content: l?.["content"]?.["text"] || "",
      };
    });
  h &&
    (j = j["map"]((l) => ({
      ...l,
      ...h,
    })));
  i &&
    (j = j["map"]((l) => ({
      ...l,
      ...i,
    })));
  const k = j["some"]((l) => l["orderId"]);
  (!k &&
    orderList["length"] > 0x0 &&
    j["some"]((l) => l["userId"] === orderList[0x0]["userId"]) &&
    (j = j["map"]((l) => ({
      ...l,
      ...orderList[0x0],
    }))),
    console["log"]("处理完成history", j),
    (e["history"] = j),
    ipcRenderer["send"]("get-historical-records", JSON["stringify"](e)));
}
function lastContinuousCustomerBlock(a) {
  if (!Array["isArray"](a) || a["length"] === 0x0) return [];
  let b = -0x1;
  for (let d = a["length"] - 0x1; d >= 0x0; d--) {
    if (a[d]?.["header"]?.["sender"]?.["type"] === "CUSTOMER") {
      b = d;
      break;
    }
  }
  if (b === -0x1) return [];
  let c = b;
  for (let e = b - 0x1; e >= 0x0; e--) {
    const f = a[e]?.["header"]?.["sender"]?.["type"];
    if (f !== "CUSTOMER") break;
    c = e;
  }
  return a["slice"](c, b + 0x1);
}
const getUrlUeserHistoryMessage = async (a) => {
  return new Promise((b, c) => {
    fetch(
      "https://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/MessagesByOnlineTouchId?operationName=MessagesByOnlineTouchId&operationType=query&__pvId=" +
        that_pvId,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          query:
            "\x0a\x20\x20\x20\x20query\x20MessagesByOnlineTouchId($input:\x20IMQueryMessageByOnlineTouchIdInput!)\x20{\x0a\x20\x20messagesByOnlineTouchId(input:\x20$input)\x20{\x0a\x20\x20\x20\x20messages\x0a\x20\x20}\x0a}\x0a\x20\x20\x20\x20",
          variables: {
            input: {
              onlineTouchId: a,
              calculateReceiversHaveRead: !![],
            },
          },
          operationName: "MessagesByOnlineTouchId",
        }),
      },
    )
      ["then"]((d) => d["json"]())
      ["then"]((d) => {
        d["data"]?.["messagesByOnlineTouchId"]
          ? b(d["data"]["messagesByOnlineTouchId"]["messages"])
          : b(null);
      })
      ["catch"]((d) => {
        console["log"]("接口报错信息", d);
      });
  });
};
(document["addEventListener"]("mousemove", () => {
  windowHasFocus &&
    shopBotStatus == 0x1 &&
    ((lastMouseActivity = Date["now"]()), (isUserOperating = !![]));
}),
  document["addEventListener"]("mousedown", () => {
    windowHasFocus &&
      shopBotStatus == 0x1 &&
      ((lastMouseActivity = Date["now"]()), (isUserOperating = !![]));
  }),
  document["addEventListener"]("mouseup", () => {
    windowHasFocus &&
      shopBotStatus == 0x1 &&
      ((lastMouseActivity = Date["now"]()), (isUserOperating = !![]));
  }),
  window["addEventListener"]("focus", () => {
    ((windowHasFocus = !![]), startUserActivityTimer());
  }),
  window["addEventListener"]("blur", () => {
    ((windowHasFocus = ![]), (isUserOperating = ![]), stopUserActivityTimer());
  }));
function startUserActivityTimer() {
  (userActivityTimer && clearInterval(userActivityTimer),
    (userActivityTimer = setInterval(() => {
      const a = Date["now"]() - lastMouseActivity;
      a > USER_ACTIVITY_TIMEOUT && isUserOperating && (isUserOperating = ![]);
    }, 0x3e8)));
}
function stopUserActivityTimer() {
  userActivityTimer && (clearInterval(userActivityTimer), (userActivityTimer = null));
}
const delay = (a) => new Promise((b) => setTimeout(b, a));
(safeIpcOn("currnt-page", (a, b) => {
  ((is_key = b), is_key && ipcRenderer["send"]("get-currnt-page", ![]));
}),
  safeIpcOn("request-heartbeat", async () => {
    let a = null;
    const b = document["querySelector"](".xixikf-im-app_components-seats-management-icon_badge");
    let c = "";
    try {
      a = await fetch(
        "https://c2mbc.api.xixikf.cn/xixi-scheduler/graphql/1.0/InitSeatStatus?operationName=InitSeatStatus&operationType=query&__pvId=" +
          that_pvId +
          "&__bundle=com.xixikf.support",
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json;\x20charset=utf-8" },
          body: JSON["stringify"]({
            query:
              "\x0a\x20\x20\x20\x20query\x20InitSeatStatus($channelType:\x20SDChannelType!)\x20{\x0a\x20\x20currentStatus(input:\x20{channelType:\x20$channelType})\x20{\x0a\x20\x20\x20\x20statusId\x0a\x20\x20\x20\x20subStatusId\x0a\x20\x20\x20\x20autoClose\x0a\x20\x20\x20\x20countdownTime\x0a\x20\x20\x20\x20countdownStart\x0a\x20\x20\x20\x20isZZS\x0a\x20\x20\x20\x20statusChangeTime\x0a\x20\x20\x20\x20workChannel\x0a\x20\x20}\x0a\x20\x20statusList(input:\x20{channelType:\x20$channelType})\x20{\x0a\x20\x20\x20\x20...SeatStatusFragment\x0a\x20\x20}\x0a}\x0a\x20\x20\x20\x20\x0a\x20\x20\x20\x20fragment\x20SeatStatusFragment\x20on\x20SDStatusPayload\x20{\x0a\x20\x20channelType\x0a\x20\x20parentStatusId\x0a\x20\x20statusCode\x0a\x20\x20statusDesc\x0a\x20\x20statusId\x0a\x20\x20statusName\x0a\x20\x20subStatusList\x20{\x0a\x20\x20\x20\x20parentStatusId\x0a\x20\x20\x20\x20statusCode\x0a\x20\x20\x20\x20statusDesc\x0a\x20\x20\x20\x20statusId\x0a\x20\x20\x20\x20statusName\x0a\x20\x20\x20\x20visible\x0a\x20\x20}\x0a\x20\x20visible\x0a}\x0a\x20\x20\x20\x20",
            variables: { channelType: "ONLINE" },
            operationName: "InitSeatStatus",
          }),
        },
      )["then"]((d) => d["json"]());
      if (a["data"]) {
        if (a["data"]["currentStatus"]["statusId"] == "2") c = "在线";
        else a["data"]["currentStatus"]["statusId"] == "1" ? (c = "离线") : (c = "忙碌");
      }
    } catch (d) {
      if (b) {
        const e = b["getAttribute"]("class");
        if (e["includes"]("xixikf-im-app_components-seats-management-badge_seats-status-1"))
          c = "离线";
        else
          e["includes"]("xixikf-im-app_components-seats-management-badge_seats-status-2")
            ? (c = "在线")
            : (c = "忙碌");
      }
    } finally {
      const f = apiHealthMonitor["isHealthy"](),
        g = b ? !![] : ![];
      ipcRenderer["send"]("heartbeat-response", {
        status: c,
        apiHealthy: f,
        webSocketState: wsConnectState,
        domExists: g,
      });
    }
  }),
  safeIpcOn("change-shop-status", (a, b) => {
    console["log"]("改变店铺状态", b);
    const c = b === "online",
      d = (g, h, i, j) => {
        return fetch(g, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json;\x20charset=utf-8" },
          body: JSON["stringify"]({
            query: h,
            variables: i,
            operationName: j,
          }),
        })["then"]((k) => k["json"]());
      },
      e = (g) =>
        "https://c2mbc.api.xixikf.cn/xixi-scheduler/graphql/1.0/" +
        g +
        "?operationName=" +
        g +
        "&operationType=mutation&__pvId=" +
        that_pvId +
        "&__bundle=com.xixikf.support",
      f =
        "\x0a\x20\x20\x20\x20mutation\x20ChangeStatus($input:\x20SDChangeStatusInput!)\x20{\x0a\x20\x20\x20\x20\x20\x20changeStatus(input:\x20$input)\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20statusId\x0a\x20\x20\x20\x20\x20\x20\x20\x20subStatusId\x0a\x20\x20\x20\x20\x20\x20\x20\x20statusChangeTime\x0a\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20}\x0a\x20\x20";
    if (c) {
      const g =
        "\x0a\x20\x20\x20\x20\x20\x20mutation\x20WorkOnlineV2($input:\x20SDWorkOnlineInput!)\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20workOnlineV2(input:\x20$input)\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20canWork\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20preConditions\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20code\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20isPreconditionMet\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20";
      d(
        e("WorkOnlineV2"),
        g,
        {
          input: {
            channelType: "ONLINE",
            workbenchType: "XIXIKF",
            isTrain: ![],
          },
        },
        "WorkOnlineV2",
      )["then"]((h) => {
        return (
          console["log"]("上班状态改变店铺状态成功", h),
          d(
            e("ChangeStatus"),
            f,
            {
              input: {
                channelType: "ONLINE",
                targetStatusId: "2",
                targetSubStatusId: "2",
              },
            },
            "ChangeStatus",
          )["then"]((i) => {
            (console["log"]("接线结果==========", i),
              i?.["data"]?.["changeStatus"]?.["statusId"] == "2" &&
                (console["log"]("接线成功"),
                ipcRenderer["send"]("shop-status-change", { status: "接线" })));
          })
        );
      });
    } else
      d(
        e("ChangeStatus"),
        f,
        {
          input: {
            channelType: "ONLINE",
            targetStatusId: "1",
            targetSubStatusId: "1",
          },
        },
        "ChangeStatus",
      )["then"]((h) => {
        (console["log"]("离线结果==========", h),
          h?.["data"]?.["changeStatus"]?.["statusId"] == "1" &&
            (console["log"]("离线成功"),
            ipcRenderer["send"]("shop-status-change", { status: "离线" })));
      });
  }));
const loopDom = () => {
  setTimeout(() => {
    const a = document["body"]["querySelectorAll"](
        ".xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-tao-factory-online-touch-explorer-servicing-touch-list_list\x20[data-id]",
      ),
      b = [];
    a["forEach"]((c) => {
      const d =
        c["querySelector"](
          ".xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-components-online-touch-timer-for-supplier_container",
        ) ||
        c["querySelector"](
          ".xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-components-online-touch-timer_container",
        );
      if (d) {
        const e = d["textContent"];
        if (e) {
          const f = c["querySelector"](
              ".xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-tao-factory-online-touch-explorer-member-card_username",
            ),
            g = f["textContent"],
            h = c["getAttribute"]("data-id"),
            i = c["querySelector"](
              ".xixikf-c-2-mbc-im-desk-extension_tao-factory-im-desk-tao-factory-online-touch-explorer-member-card_message",
            ),
            j = i["textContent"];
          let k = Math["floor"](Date["now"]() / 0x3e8);
          if (/^\d{2}:\d{2}$/["test"](e)) {
            const o = Number(e["split"](":")[0x1]) || 0x0,
              p = 0x1e - o;
            k = Math["floor"](Date["now"]() / 0x3e8) + p;
          }
          const l = c["querySelector"]("img");
          let m = null;
          if (l) {
            const q = l["src"]["split"]("userId=");
            if (q) m = q[0x1];
          }
          const n = {
            username: g,
            messageId: h,
            userId: h,
            content: j,
            timeout: k,
            covid: m,
          };
          console["log"]("sendMessage========>", n);
          if (userMap["has"](h)) {
            const r = userMap["get"](h);
            r?.["content"] != n["content"] && (userMap["set"](h, n), (n["type"] = "code"));
          } else (userMap["set"](h, n), (n["type"] = "code"));
          if (!sleepMsg["has"](h)) b["push"](n);
        }
      }
    });
    if (b["length"]) ipcRenderer["send"]("get-customer-message-list", b);
    loopDom();
  }, 0x1388);
};
ipcRenderer["on"]("paste-to-shop", async (a, b) => {
  const c = document["querySelector"]("[aria-label=\x22在线会话输入框\x22]");
  console["log"]("input=================", c);
  if (!c) return;
  c["innerHTML"] = b;
  const d = new InputEvent("input", {
    bubbles: !![],
    inputType: "insertText",
    data: b,
  });
  (c["dispatchEvent"](d), await delay(0x12c));
  const e = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    keyCode: 0xd,
    which: 0xd,
    bubbles: !![],
    cancelable: !![],
  });
  c["dispatchEvent"](e);
});
const base64ToBlob = (a) => {
    const [b, c] = a["split"](","),
      d = b["match"](/:(.*?);/)[0x1],
      e = atob(c),
      f = new Uint8Array(e["length"]);
    for (let g = 0x0; g < e["length"]; g++) {
      f[g] = e["charCodeAt"](g);
    }
    return new Blob([f], { type: d });
  },
  imageUrlToBlob = async (a) => {
    const b = await fetch(a);
    if (!b["ok"]) throw new Error("下载图片失败:\x20" + b["status"]);
    return b["blob"]();
  },
  sendImage = async (a, b, c, d) => {
    const e = d ? await imageUrlToBlob(d) : base64ToBlob(a),
      f = await fetch(
        "\x0ahttps://c2mbc.api.xixikf.cn/xixi-base/graphql/1.0/Configs?operationName=Configs&operationType=query&__pvId=" +
          that_pvId +
          "&__bundle=com.xixikf.imdesk",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON["stringify"]({
            query:
              "\x0a\x20\x20\x20\x20query\x20Configs\x20{\x0a\x20\x20configs\x20{\x0a\x20\x20\x20\x20ossInfo\x20{\x0a\x20\x20\x20\x20\x20\x20accessId\x0a\x20\x20\x20\x20\x20\x20policy\x0a\x20\x20\x20\x20\x20\x20signature\x0a\x20\x20\x20\x20\x20\x20dir\x0a\x20\x20\x20\x20\x20\x20endpoint\x0a\x20\x20\x20\x20\x20\x20cdn\x0a\x20\x20\x20\x20}\x0a\x20\x20}\x0a}\x0a\x20\x20\x20\x20",
            operationName: "Configs",
          }),
        },
      )["then"]((g) => g["json"]());
    if (f["data"]["configs"]["ossInfo"]) {
      const { accessId: g, policy: h, signature: i, dir: j } = f["data"]["configs"]["ossInfo"],
        k = new FormData();
      (k["append"]("OSSAccessKeyId", g),
        k["append"]("policy", h),
        k["append"]("Signature", i),
        k["append"]("key", "consult/img.png"),
        k["append"]("file", e, "img.png"),
        fetch("https://xspace-img-cn.oss-cn-shanghai.aliyuncs.com/", {
          method: "POST",
          credentials: "include",
          body: k,
        })["then"]((l) => {
          fetch(
            "\x0ahttps://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/SendMessage?operationName=SendMessage&operationType=mutation&__pvId=" +
              that_pvId,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json;\x20charset=utf-8" },
              body: JSON["stringify"]({
                query:
                  "\x0a\x20\x20\x20\x20mutation\x20SendMessage($input:\x20IMSendMessageInput!)\x20{\x0a\x20\x20sendMessage(input:\x20$input)\x20{\x0a\x20\x20\x20\x20...\x20on\x20IMSendMessageSuccessPayload\x20{\x0a\x20\x20\x20\x20\x20\x20isRejected\x0a\x20\x20\x20\x20\x20\x20gmtCreate\x0a\x20\x20\x20\x20\x20\x20messageId\x0a\x20\x20\x20\x20\x20\x20sequence\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20...\x20on\x20IMSendMessageRejectedPayload\x20{\x0a\x20\x20\x20\x20\x20\x20isRejected\x0a\x20\x20\x20\x20\x20\x20rejectedReason\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20content\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20...\x20on\x20IMRiskCheckContent\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20details\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20keywords\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20level\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20remark\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20...\x20on\x20IMBizRuleCheckContent\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20level\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20remark\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20type\x0a\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20}\x0a\x20\x20}\x0a}\x0a\x20\x20\x20\x20",
                variables: {
                  input: {
                    id: Date["now"](),
                    contentType: "RICH_TEXT",
                    content: {
                      text: "<div\x20class=\x22xixi-editor-img-wrap\x22><span\x20class=\x22xixi-editor-img-wrap-filler\x22></span><div\x20class=\x22xixi-editor-img-content-wrap\x22\x20contenteditable=\x22false\x22><img\x20class=\x22xixi-editor-img-tag-49ba59abbe56e057\x22\x20src=\x22//xspace-img-cn.alicdn.com/consult/img.png?getAvatar=1\x22></div><span\x20class=\x22xixi-editor-img-wrap-filler\x22></span></div>",
                    },
                    header: {
                      conversationId: "ocs_" + c + "_c2m-TB-GC",
                      version: "1.0",
                      props: {
                        onlineTouchId: b,
                        msgId: Date["now"](),
                      },
                    },
                    ignoreNormalRisk: !![],
                  },
                },
                operationName: "SendMessage",
              }),
            },
          )
            ["then"]((m) => m["json"]())
            ["then"]((m) => {
              m["errors"] &&
                fetch(
                  "\x0ahttps://c2mbc.api.xixikf.cn/xixi-online/graphql/1.0/SendMessage?operationName=SendMessage&operationType=mutation&__pvId=" +
                    that_pvId,
                  {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json;\x20charset=utf-8" },
                    body: JSON["stringify"]({
                      query:
                        "\x0a\x20\x20\x20\x20mutation\x20SendMessage($input:\x20IMSendMessageInput!)\x20{\x0a\x20\x20sendMessage(input:\x20$input)\x20{\x0a\x20\x20\x20\x20...\x20on\x20IMSendMessageSuccessPayload\x20{\x0a\x20\x20\x20\x20\x20\x20isRejected\x0a\x20\x20\x20\x20\x20\x20gmtCreate\x0a\x20\x20\x20\x20\x20\x20messageId\x0a\x20\x20\x20\x20\x20\x20sequence\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20...\x20on\x20IMSendMessageRejectedPayload\x20{\x0a\x20\x20\x20\x20\x20\x20isRejected\x0a\x20\x20\x20\x20\x20\x20rejectedReason\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20content\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20...\x20on\x20IMRiskCheckContent\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20details\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20keywords\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20level\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20remark\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20...\x20on\x20IMBizRuleCheckContent\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20level\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20remark\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20type\x0a\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20}\x0a\x20\x20}\x0a}\x0a\x20\x20\x20\x20",
                      variables: {
                        input: {
                          id: Date["now"](),
                          contentType: "RICH_TEXT",
                          content: {
                            text: "<div\x20class=\x22xixi-editor-img-wrap\x22><span\x20class=\x22xixi-editor-img-wrap-filler\x22></span><div\x20class=\x22xixi-editor-img-content-wrap\x22\x20contenteditable=\x22false\x22><img\x20class=\x22xixi-editor-img-tag-49ba59abbe56e057\x22\x20src=\x22//xspace-img-cn.alicdn.com/consult/img.png?getAvatar=1\x22></div><span\x20class=\x22xixi-editor-img-wrap-filler\x22></span></div>",
                          },
                          header: {
                            conversationId: "ocs_" + c + "_c2m-TB-MZ",
                            version: "1.0",
                            props: {
                              onlineTouchId: b,
                              msgId: Date["now"](),
                            },
                          },
                          ignoreNormalRisk: !![],
                        },
                      },
                      operationName: "SendMessage",
                    }),
                  },
                );
            });
        }));
    }
  };
ipcRenderer["on"]("heartbeat", () => {
  ipcRenderer["send"]("web-heartbeat-ping");
});
