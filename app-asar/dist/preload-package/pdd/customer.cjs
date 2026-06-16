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
function getReadableErrorMessage(a) {
  if (!a) return "未知错误";
  if (typeof a === "string") return a;
  if (a instanceof Error) return a["stack"] || a["message"] || String(a);
  if (typeof a === "object") {
    const b = a["message"] || a["reason"]?.["message"] || "",
      c = a["stack"] || a["reason"]?.["stack"] || "",
      d = a["filename"] || "",
      f = a["lineno"] ? ":" + a["lineno"] : "",
      g = a["colno"] ? ":" + a["colno"] : "",
      h = d ? "\x20" + d + f + g : "";
    if (b || c) return ("" + b + h + (c ? "\x0a" + c : ""))["trim"]();
  }
  return String(a);
}
function reportGlobalPreloadError(a, b) {
  const c = getQueryParams(window["location"]["href"]),
    d = c["shopName"] || thatshopName || "未知店铺";
  ipcRenderer["send"]("write-preload-error-log", {
    shopName: d,
    platform: "pdd",
    errorMessage: a + ":\x20" + getReadableErrorMessage(b),
    time: new Date()["toLocaleString"]("zh-CN", { hour12: ![] }),
  });
}
let wsConnectState = -0x1,
  linkonInsert = ![],
  sendInsert = ![],
  thatshopName = "",
  isLoginSuccess = ![],
  isPDDShowRobotReply = ![],
  hasSentLoginInfo = ![],
  isAutoOnlineBlocked = ![];
class AutoOnlineBlockDB {
  constructor() {
    ((this["db"] = null),
      (this["DB_NAME"] = "pddAutoOnlineBlockDB"),
      (this["STORE_NAME"] = "autoOnlineBlock"),
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
  async ["get"](a) {
    if (!a) return ![];
    const b = await this["init"]();
    return new Promise((c, d) => {
      const f = b["transaction"](this["STORE_NAME"], "readonly"),
        g = f["objectStore"](this["STORE_NAME"]),
        h = g["get"](String(a));
      ((h["onsuccess"] = () => c(!!h["result"]?.["blocked"])),
        (h["onerror"] = () => d(h["error"])));
    });
  }
  async ["set"](a, b) {
    if (!a) return ![];
    const c = await this["init"]();
    return new Promise((d, f) => {
      const g = c["transaction"](this["STORE_NAME"], "readwrite"),
        h = g["objectStore"](this["STORE_NAME"]),
        i = h["put"]({
          id: String(a),
          blocked: !!b,
        });
      ((i["onsuccess"] = () => d(!![])), (i["onerror"] = () => f(i["error"])));
    });
  }
}
const autoOnlineBlockDB = new AutoOnlineBlockDB();
class ShopMessage {
  constructor(a, b) {
    if (b == "ordinary") this["commonInit"](a);
    else {
      if (b == "push") this["commonInit2"](a);
      else b == "Turn" && this["commonInit3"](a);
    }
    ((this["orderId"] = a?.["info"]?.["orderSequenceNo"]),
      (this["ordersku"] = a?.["info"]?.["orderSequenceNo"] ? a?.["info"]?.["spec"] : ""),
      (this["orderGoodSku"] = this["ordersku"] ? String(this["ordersku"]) : ""),
      (this["orderInfo"] = ""));
    const c = a?.["info"]?.["goodsID"]
      ? String(a["info"]["goodsID"])
          ["trim"]()
          ["replace"](/^(\d+)\.0+$/, "$1")
      : "";
    (this["orderId"]
      ? ((this["orderGoodId"] = c), (this["goodId"] = ""))
      : ((this["orderGoodId"] = ""), (this["goodId"] = c)),
      (this["goodInfo"] = ""),
      (this["goodName"] = a?.["info"]?.["goodsName"]),
      (this["content"] = a?.["info"]?.["orderSequenceNo"]
        ? "用户发送订单"
        : a?.["info"]?.["goodsName"]
          ? "用户发送商品"
          : a?.["content"]),
      (this["timeout"] = this["formatTimeout"](a?.["ts"])),
      (this["type"] = "code"));
  }
  ["commonInit"](a) {
    ((this["messageId"] = a?.["from"]?.["uid"]),
      (this["userId"] = a?.["from"]?.["uid"]),
      (this["username"] = a?.["nickname"] || a?.["from"]?.["uid"]));
  }
  ["commonInit2"](a) {
    ((this["messageId"] = a?.["from"]?.["csid"] ? a?.["to"]?.["uid"] : a?.["from"]?.["uid"]),
      (this["username"] = a?.["nickname"]
        ? a["nickname"]
        : a?.["from"]?.["csid"]
          ? a?.["to"]?.["uid"]
          : a?.["from"]?.["uid"]),
      (this["userId"] = a?.["from"]?.["csid"] ? a?.["to"]?.["uid"] : a?.["from"]?.["uid"]));
  }
  ["commonInit3"](a) {
    ((this["messageId"] =
      a?.["from"]?.["csid"] && a?.["to"]?.["role"] == "user"
        ? a?.["to"]?.["uid"]
        : a?.["from"]?.["uid"]),
      (this["username"] = a?.["nickname"]
        ? a["nickname"]
        : a?.["from"]?.["csid"]
          ? a?.["to"]?.["uid"]
          : a?.["from"]?.["uid"]),
      (this["userId"] =
        a?.["from"]?.["csid"] && a?.["to"]?.["role"] == "user"
          ? a?.["to"]?.["uid"]
          : a?.["from"]?.["uid"]));
  }
  ["formatTimeout"](a) {
    const b = Date["now"]() / 0x3e8;
    if (!a) return Math["floor"](b) + 0xb4;
    const c = a > 0xe8d4a51000 ? a / 0x3e8 : a;
    return Math["floor"](c) + 0xb4;
  }
}
function extractGoodIdFromContent(a) {
  const b = String(a || ""),
    c = b["match"](/https?:\/\/[^\s]+/i);
  if (!c) return "";
  try {
    const d = c[0x0]["replace"](/[)\]}>，。；、】【'"]+$/g, ""),
      f = new URL(d),
      g = f["searchParams"]["get"]("goods_id");
    if (!g) return "";
    return String(g)
      ["trim"]()
      ["replace"](/^(\d+)\.0+$/, "$1");
  } catch (h) {
    return (console["warn"]("[PDD]\x20解析商品链接失败:", h), "");
  }
}
let visibilitychange = !![];
window["addEventListener"]("message", async (a) => {
  if (a["data"]["type"] == "reminder-reply") {
    const { messageId: b } = a["data"]["data"];
    fetch("https://mms.pinduoduo.com/latitude/goods/singleRecommendGoods", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON["stringify"]({
        type: 0x2,
        uid: b,
        pageNum: 0x1,
        pageSize: 0xa,
      }),
    })
      ["then"]((c) => c["json"]())
      ["then"]((c) => {
        console["log"]("推荐商品数据:", c);
        const { result: d } = c;
        if (d && d["headGoods"]) {
          const f = d["headGoods"]["goodsId"] || d["goodsList"][0x0]["goodsId"];
          fetch("https://mms.pinduoduo.com/plateau/message/send/mallGoodsCard", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON["stringify"]({
              uid: b,
              goods_id: f,
              biz_type: 0x5,
            }),
          });
        }
      });
  } else {
    if (a["data"] && a["data"]["type"] === "WS_STATE_CHANGE") wsConnectState = a["data"]["state"];
    else {
      if (a["data"] && a["data"]["type"] === "get-message") {
        const c = JSON["parse"](a["data"]["data"]);
        if (!linkonInsert) linkonInsert = !![];
        const { message: d } = c || {};
        if (c?.["response"] === "push") {
          console["log"]("【push\x20转店铺】", d?.["content"], c);
          const f = new ShopMessage(d, "push");
          f["source"] = "code1";
          if (!f["content"]["includes"]("平台客服已处理本次售后"))
            ipcRenderer["send"]("get-customer-message-list", [f]);
          return;
        } else {
          if (c?.["chat_type_id"] === 0x1) {
            if (d?.["from"]?.["role"] === "user") {
              if (
                ![
                  "enter_manual_823_offline",
                  "merchant_robot_system_hint_to_merchant_alone_text",
                  "mall_robot_man_intervention_and_restart",
                  "merchant_promise_not_fulfilled_remind",
                  "user_source",
                  "merchant_add_as_robot_reply",
                  "guide_merchant_tips",
                  "mall_deliver_description_for_b",
                  "mall_answer_with_text",
                  "remind_help_order",
                  "service_todo_system_hint",
                ]["includes"](d?.["template_name"])
              ) {
                const g = new ShopMessage(d, "ordinary"),
                  h = d?.["from"]?.["uid"];
                if (!h) return;
                g["source"] = "code2";
                switch (d?.["type"]) {
                  case 0x1:
                    g["content"] = "用户发送了图片";
                    break;
                  case 0xe:
                    g["content"] = "用户发送了视频";
                }
                if (!g["content"]["includes"]("平台客服已处理本次售后"))
                  ipcRenderer["send"]("get-customer-message-list", [g]);
              }
              return;
            } else {
              if (
                d?.["from"]?.["role"] != "user" &&
                d?.["from"]?.["mall_id"] &&
                d?.["from"]?.["uid"] &&
                d?.["from"]?.["csid"] &&
                d?.["need_reply"]
              ) {
                if (!["mall_answer_with_text"]["includes"](d?.["template_name"])) return;
                const i = new ShopMessage(d, "Turn");
                i["source"] = "code3";
                if (!i?.["content"]?.["includes"]("平台客服已处理本次售后"))
                  ipcRenderer["send"]("get-customer-message-list\x20", [i]);
              }
            }
            if (isPDDShowRobotReply && ["mall_robot_text_msg"]["includes"](d?.["template_name"])) {
              const j =
                document["querySelector"](
                  "[data-random=\x22" + d?.["to"]?.["uid"] + "-0-unTimeout\x22]",
                ) ||
                document["querySelector"](
                  "[data-random=\x22" + d?.["to"]?.["uid"] + "-0-unRead\x22]",
                );
              if (
                j &&
                !(
                  j["querySelector"](".chat-unreply-over-time") ||
                  j["querySelector"](".chat-unreply-time")
                )
              ) {
                const k = document["querySelector"](".conv-today");
                let l = 0x0;
                if (k) {
                  if (k["textContent"]) {
                    const m = k["textContent"]["match"](/\((\d+)\)/);
                    m ? (l = m[0x1]) : (l = 0x0);
                  }
                }
                ipcRenderer["send"]("reply-customer-message", {
                  messageId: d?.["to"]?.["uid"],
                  sendTarget: "pddRobot",
                  shopMsgTotal: l,
                });
                return;
              }
            }
          } else {
            if (c?.["chat_type_id"] == 0x5 && d?.["from"]?.["role"] == "platform") {
              const n = {
                  messageId: d?.["to"]?.["uid"],
                  username: d?.["nickname"] || d?.["from"]?.["uid"],
                  content: d?.["content"],
                  timeout:
                    Math["floor"](
                      d?.["ts"]
                        ? d["ts"] > 0xe8d4a51000
                          ? d["ts"] / 0x3e8
                          : d["ts"]
                        : Date["now"]() / 0x3e8,
                    ) + 0xb4,
                  userId: d?.["to"]?.["uid"],
                  type: "code",
                },
                o = document["querySelector"](".conv-today");
              if (o) {
                if (o["textContent"]) {
                  const p = o["textContent"]["match"](/\((\d+)\)/);
                  p ? (n["shopMsgTotal"] = p[0x1]) : (n["shopMsgTotal"] = 0x0);
                }
              }
              n["source"] = "code5";
              if (!n?.["content"]["includes"]("平台客服已处理本次售后"))
                ipcRenderer["send"]("get-customer-message-list", [n]);
            }
          }
        }
      } else {
        if (a["data"] && a["data"]["type"] === "insert-sucesss")
          a["data"]["data"]["type"] == "sendmessage" && (sendInsert = a["data"]["data"]["bool"]);
        else {
          if (a?.["data"]?.["type"] === "get-good-info") {
            const q = a?.["data"]?.["goodId"];
            if (!q) return;
            const r = await processGoodsDetail(q);
            window["postMessage"]({
              type: "get-good-info-cb",
              data: r,
            });
          }
        }
      }
    }
  }
});
let _key = ![],
  mallName = "";
const HEARTBEAT_INTERVAL = 0x3e8 * 0x3c * (0x1e + Math["random"]() * 0x14);
let currentInterval = HEARTBEAT_INTERVAL,
  hearTimer = null,
  info = null;
const observerConfig = {
  childList: !![],
  subtree: !![],
  characterData: !![],
  attributes: !![],
  attributeOldValue: !![],
  characterDataOldValue: !![],
};
let shopId = null,
  shopBotStatus = 0x0,
  isUserOperating = ![],
  lastMouseActivity = 0x0,
  lastKeyboardActivity = 0x0,
  windowHasFocus = ![],
  userActivityTimer = null;
const USER_ACTIVITY_TIMEOUT = 0xbb8;
function throttle(a, b) {
  let c,
    d = 0x0;
  return function (...f) {
    const g = Date["now"]();
    g - d > b
      ? (a["apply"](this, f), (d = g))
      : (clearTimeout(c),
        (c = setTimeout(
          () => {
            (a["apply"](this, f), (d = Date["now"]()));
          },
          b - (g - d),
        )));
  };
}
try {
  const params = new URLSearchParams(window["location"]["search"]);
  shopId = params["get"]("shopId");
} catch (s) {}
function syncAutoOnlineBlockToPage() {
  window["postMessage"](
    {
      type: "SYNC_AUTO_ONLINE_BLOCK",
      data: { blocked: isAutoOnlineBlocked },
    },
    "*",
  );
}
async function loadAutoOnlineBlockState() {
  try {
    isAutoOnlineBlocked = await autoOnlineBlockDB["get"](shopId);
  } catch (a) {
    isAutoOnlineBlocked = ![];
  }
  syncAutoOnlineBlockToPage();
}
async function persistAutoOnlineBlockState(a) {
  const b = ["忙碌", "离线"]["includes"](a);
  isAutoOnlineBlocked = b;
  try {
    await autoOnlineBlockDB["set"](shopId, b);
  } catch (c) {
    console["error"]("保存自动上线拦截状态失败", c);
  }
  syncAutoOnlineBlockToPage();
}
function getStatusMenuDom() {
  return document["querySelector"]("[class=\x22status-box\x20sel-box\x22]");
}
function triggerStatusOptionClick(a) {
  if (!a) return ![];
  return (a["click"](), !![]);
}
function tryAutoSwitchOnline(a, b) {
  if (a != globStatus) {
    const c = document["querySelectorAll"](".status-box\x20li");
    let d = ![];
    return (
      c["forEach"]((f) => {
        f["innerText"] == globStatus && (f["click"](), (d = !![]));
      }),
      d
    );
  }
}
let width = 0x780,
  height = 0x438;
shopId &&
  ((width = 0x780 + (parseInt(shopId) % 0x64)), (height = 0x438 + (parseInt(shopId) % 0x64)));
(Object["defineProperty"](window, "screen", {
  value: {
    width: width,
    height: height,
  },
  configurable: !![],
}),
  Object["defineProperty"](navigator, "platform", {
    value: "Win32",
    configurable: !![],
  }),
  Object["defineProperty"](navigator, "hardwareConcurrency", {
    value: 0x8,
    configurable: !![],
  }),
  Object["defineProperty"](navigator, "deviceMemory", {
    value: 0x8,
    configurable: !![],
  }),
  Object["defineProperty"](navigator, "language", {
    value: "zh-CN",
    configurable: !![],
  }),
  Object["defineProperty"](navigator, "languages", {
    value: ["zh-CN", "zh"],
    configurable: !![],
  }),
  Object["defineProperty"](navigator, "webdriver", {
    value: ![],
    configurable: !![],
  }));
const mouseActivityHandler = (a) => {
    windowHasFocus && ((lastMouseActivity = Date["now"]()), (isUserOperating = !![]));
  },
  messageList = [];
(contextBridge["exposeInMainWorld"]("context_bridge", {
  send: (a, b) => ipcRenderer["send"](a, b),
  invoke: (a, b) => ipcRenderer["invoke"](a, b),
}),
  safeIpcOn("update-shop-bot-status", (a, b) => {
    const c = shopBotStatus;
    shopBotStatus = b["botStatus"];
  }),
  safeIpcOn("change-pdd-show-robot-reply", (a, b) => {
    ((isPDDShowRobotReply = b),
      window["postMessage"]({
        type: "CHANGE_PDD_SHOW_ROBOT_REPLY",
        data: { isPDDShowRobotReply: b },
      }));
  }),
  document["addEventListener"]("DOMContentLoaded", () => {
    setTimeout(async () => {
      (await loadAutoOnlineBlockState(),
        ipcRenderer["send"]("request-shop-bot-status"),
        ipcRenderer["send"]("init-shop-set"));
    }, 0x3e8);
  }));
let loginInfo = {
    username: "",
    password: "",
  },
  loginRetryTimer = null,
  loginRetryCount = 0x0;
const loginRetryDelays = [0x7d0, 0xfa0, 0x1770],
  pickLogin = (a) => {
    if (typeof a !== "string") return "";
    return ((a = a["trim"]()), a && a !== "null" && a !== "undefined" ? a : "");
  };
safeIpcOn("get-shop-pwd", (a, b) => {
  console["log"]("get-shop-pwd", b);
  if (!loginInfo["username"] && b["userName"] != "")
    loginInfo["username"] = pickLogin(b?.["userName"]);
  if (!loginInfo["password"] && b["password"] != "")
    loginInfo["password"] = pickLogin(b?.["password"]);
});
async function refreshLogin() {
  for (const a of process["argv"]) {
    if (a["startsWith"]("--username"))
      loginInfo["username"] = pickLogin(a["slice"]("--username"["length"]));
    else
      a["startsWith"]("--password") &&
        (loginInfo["password"] = pickLogin(a["slice"]("--password"["length"])));
  }
  if (loginInfo["username"] && loginInfo["password"]) return loginInfo;
  return (
    ipcRenderer["send"]("get-shop-pwd"),
    await new Promise((b) => setTimeout(b, 0x1f4)),
    loginInfo
  );
}
function clearLoginRetryTimer() {
  loginRetryTimer && (clearTimeout(loginRetryTimer), (loginRetryTimer = null));
}
ipcRenderer["on"]("paste-to-shop", (a, b) => {
  const c = document["querySelector"]("#replyTextarea");
  if (!c) return;
  ((c["value"] = b), c["dispatchEvent"](new Event("input", { bubbles: !![] })));
  const d = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    keyCode: 0xd,
    which: 0xd,
    bubbles: !![],
    cancelable: !![],
  });
  c["dispatchEvent"](d);
});
const KHAI_REPLY_TEXTAREA_DEFAULT_HEIGHT = 128, KHAI_REPLY_TEXTAREA_MIN_HEIGHT = 72, KHAI_REPLY_TEXTAREA_MAX_HEIGHT = 260, KHAI_REPLY_TEXTAREA_STORAGE_KEY = "khai-pdd-reply-textarea-height";
let khaiReplyAreaObserver = null;
function getKhaiReplyTextareaHeight() {
  const a = Number(localStorage["getItem"](KHAI_REPLY_TEXTAREA_STORAGE_KEY));
  return Math["min"](KHAI_REPLY_TEXTAREA_MAX_HEIGHT, Math["max"](KHAI_REPLY_TEXTAREA_MIN_HEIGHT, Number["isFinite"](a) ? a : KHAI_REPLY_TEXTAREA_DEFAULT_HEIGHT));
}
function setKhaiReplyTextareaHeight(a) {
  const b = Math["min"](KHAI_REPLY_TEXTAREA_MAX_HEIGHT, Math["max"](KHAI_REPLY_TEXTAREA_MIN_HEIGHT, Math["round"](a)));
  return (localStorage["setItem"](KHAI_REPLY_TEXTAREA_STORAGE_KEY, String(b)), document["documentElement"]["style"]["setProperty"]("--khai-pdd-reply-textarea-height", `${b}px`), b);
}
function findKhaiReplyPanel(a) {
  let b = a["parentElement"], c = b;
  for (let d = 0; b && d < 7; d += 1, b = b["parentElement"]) {
    const f = b["getBoundingClientRect"]();
    if (f["width"] > 300 && f["height"] > 20 && f["height"] < 320 && (c = b, f["bottom"] > window["innerHeight"] - 80)) return b;
  }
  return c;
}
function ensureKhaiReplyResizeHandle(a, b) {
  if (!a) return;
  window["getComputedStyle"](a)["position"] === "static" && (a["style"]["position"] = "relative");
  let c = document["getElementById"]("khai-pdd-reply-resize-handle");
  c || ((c = document["createElement"]("div")), (c["id"] = "khai-pdd-reply-resize-handle"), (c["title"] = "拖动调整发送窗口高度，双击恢复默认"), (c["textContent"] = "拖动调整高度"), c["addEventListener"]("mousedown", (d) => {
    d["preventDefault"]();
    const f = d["clientY"], g = b["getBoundingClientRect"]()["height"] || getKhaiReplyTextareaHeight(), h = (i) => {
      setKhaiReplyTextareaHeight(g - (i["clientY"] - f)), ensureKhaiReplyAreaHeight();
    }, j = () => {
      window["removeEventListener"]("mousemove", h, !0), window["removeEventListener"]("mouseup", j, !0);
    };
    window["addEventListener"]("mousemove", h, !0), window["addEventListener"]("mouseup", j, !0);
  }), c["addEventListener"]("dblclick", (d) => {
    d["preventDefault"](), setKhaiReplyTextareaHeight(KHAI_REPLY_TEXTAREA_DEFAULT_HEIGHT), ensureKhaiReplyAreaHeight();
  }));
  c["parentElement"] !== a && a["prepend"](c);
}
function ensureKhaiReplyAreaHeight() {
  const a = "khai-pdd-reply-area-height";
  if (!document["getElementById"](a)) {
    const b = document["createElement"]("style");
    b["id"] = a;
    b["textContent"] = `
      #replyTextarea {
        min-height: var(--khai-pdd-reply-textarea-height, ${KHAI_REPLY_TEXTAREA_DEFAULT_HEIGHT}px) !important;
        height: var(--khai-pdd-reply-textarea-height, ${KHAI_REPLY_TEXTAREA_DEFAULT_HEIGHT}px) !important;
        max-height: var(--khai-pdd-reply-textarea-height, ${KHAI_REPLY_TEXTAREA_DEFAULT_HEIGHT}px) !important;
        resize: none !important;
        overflow-y: auto !important;
        line-height: 20px !important;
        box-sizing: border-box !important;
      }
      #replyTextarea:focus {
        height: var(--khai-pdd-reply-textarea-height, ${KHAI_REPLY_TEXTAREA_DEFAULT_HEIGHT}px) !important;
      }
      #khai-pdd-reply-resize-handle {
        position: absolute !important;
        left: 50% !important;
        top: 2px !important;
        width: 96px !important;
        height: 18px !important;
        transform: translateX(-50%) !important;
        cursor: ns-resize !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 999px !important;
        background: rgba(37, 99, 235, 0.88) !important;
        color: #fff !important;
        font-size: 12px !important;
        line-height: 18px !important;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.28) !important;
        user-select: none !important;
        pointer-events: auto !important;
      }
    `;
    document["head"]?.["appendChild"](b);
  }
  const c = document["querySelector"]("#replyTextarea");
  if (!c) return;
  const d = setKhaiReplyTextareaHeight(getKhaiReplyTextareaHeight()),
    f = `${d}px`;
  ((c["style"]["minHeight"] = f), (c["style"]["height"] = f), (c["style"]["maxHeight"] = f), (c["style"]["resize"] = "none"), (c["style"]["overflowY"] = "auto"));
  const g = findKhaiReplyPanel(c);
  ensureKhaiReplyResizeHandle(g, c);
  let h = c["parentElement"];
  const i = `${d + 50}px`;
  for (let j = 0; h && j < 5; j += 1, h = h["parentElement"]) {
    const k = h["getBoundingClientRect"]();
    (h["dataset"]["khaiReplyHeightPanel"] === "1" || h["style"]["minHeight"] || k["width"] > 300 && k["height"] > 20 && k["height"] < KHAI_REPLY_TEXTAREA_MAX_HEIGHT + 70) && ((h["dataset"]["khaiReplyHeightPanel"] = "1"), (h["style"]["minHeight"] = i));
  }
}
function startKhaiReplyAreaHeightObserver() {
  ensureKhaiReplyAreaHeight();
  let a = 0;
  const b = setInterval(() => {
    ensureKhaiReplyAreaHeight(), a += 1, a >= 60 && clearInterval(b);
  }, 1e3);
  if (khaiReplyAreaObserver || !document["body"]) return;
  khaiReplyAreaObserver = new MutationObserver(() => ensureKhaiReplyAreaHeight());
  khaiReplyAreaObserver["observe"](document["body"], { childList: !0, subtree: !0 });
}
let globStatus = "在线";
window["addEventListener"]("load", async () => {
  startKhaiReplyAreaHeightObserver();
  setTimeout(() => {
    const o = document["querySelector"](".avatar");
    o &&
      o["addEventListener"]("click", async (p) => {
        window["postMessage"]({ type: "get-unreply-conversations" });
      });
  }, 0x1388);
  let a = 0x0;
  const b = 0xa,
    c = setInterval(() => {
      const o = document["querySelector"](".panel-tab-header\x20.status");
      if (o) {
        clearInterval(c);
        let p = "忙碌";
        const q = [...o["classList"]];
        if (q["includes"]("online")) p = "在线";
        else {
          if (q["includes"]("offline")) p = "离线";
        }
        ((globStatus = p),
          ipcRenderer["send"]("shop-status-change", { status: p }),
          window["postMessage"]({
            type: "shop-status-change",
            data: globStatus,
          }),
          o["addEventListener"]("mousedown", async (r) => {
            const t = r["target"]["closest"]("li");
            t &&
              ((globStatus = t["textContent"]["trim"]()),
              window["postMessage"]({
                type: "shop-status-change",
                data: globStatus,
              }));
          }));
        return;
      }
      ++a >= b && (clearInterval(c), console["warn"]("status\x20获取失败（已达上限）"));
    }, 0xbb8),
    d = Date["now"](),
    f = setInterval(() => {
      const o =
        document["querySelector"](".installerContact") ||
        document["querySelector"](".pickupServiceGuide");
      (o && ((o["style"]["display"] = "none"), clearInterval(f)),
        Date["now"]() - d > 0xa * 0x3e8 && clearInterval(f));
    }, 0xc8),
    g = window["location"]["href"];
  ipcRenderer["send"]("get-shop-page-loaded");
  const h = document["createElement"]("style");
  (h["setAttribute"]("data-disable-anim", "true"),
    (h["innerHTML"] =
      "\x0a\x20\x20\x20\x20*,\x0a\x20\x20\x20\x20*::before,\x0a\x20\x20\x20\x20*::after\x20{\x0a\x20\x20\x20\x20\x20\x20animation-delay:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20animation-duration:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20animation-iteration-count:\x201\x20!important;\x0a\x20\x20\x20\x20\x20\x20transition-duration:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20transition-delay:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20scroll-behavior:\x20auto\x20!important;\x0a\x20\x20\x20\x20}\x0a\x20\x20"),
    document["head"]?.["appendChild"](h));
  const i = document["createElement"]("meta");
  (i["setAttribute"]("httpEquiv", "Content-Security-Policy"),
    i["setAttribute"]("content", "default-src\x20\x27self\x27\x20\x20app-local://js/;"),
    document["head"]?.["appendChild"](i),
    (windowHasFocus = document["hasFocus"]()),
    console["log"]("页面加载完成，当前焦点状态:", windowHasFocus));
  const j = async () => {
      if (!window["location"]["href"]["includes"]("login") || isLoginSuccess)
        return (clearLoginRetryTimer(), ![]);
      const { username: o, password: p } = await refreshLogin(),
        q = document["querySelector"](".login-info-section");
      if (!q) return ![];
      const r =
        q["querySelectorAll"](".tab-item")[0x1] || q["querySelector"](".Common_item__3diIn");
      r?.["click"]();
      const t = document["querySelector"]("#usernameId"),
        u = document["querySelector"]("#passwordId"),
        v = q["querySelector"](".info-content\x20>\x20button");
      if (!t || !u || !v) return ![];
      !t["value"] &&
        o &&
        ((t["value"] = o),
        t["dispatchEvent"](new Event("input", { bubbles: !![] })),
        t["dispatchEvent"](new Event("change", { bubbles: !![] })));
      !u["value"] &&
        p &&
        ((u["value"] = p),
        u["dispatchEvent"](new Event("input", { bubbles: !![] })),
        u["dispatchEvent"](new Event("change", { bubbles: !![] })));
      t &&
        t["addEventListener"]("input", async () => {
          (console["log"]("usernameDom\x20input:", t["value"]),
            (loginInfo["username"] = t["value"]));
        });
      u &&
        u["addEventListener"]("input", async () => {
          (console["log"]("passwordDom\x20input:", u["value"]),
            (loginInfo["password"] = u["value"]));
        });
      v &&
        v["addEventListener"]("click", () => {
          (clearLoginRetryTimer(), ipcRenderer["send"]("loginInfo", loginInfo));
        });
      if (o && p)
        return (
          setTimeout(() => {
            window["location"]["href"]["includes"]("login") &&
              !isLoginSuccess &&
              t["value"] &&
              u["value"] &&
              v["click"]();
          }, 0x5dc),
          !![]
        );
      return ![];
    },
    k = new MutationObserver(async (o) => {
      for (const p of o) {
        if (p["type"] !== "childList") continue;
        const q = document["querySelector"](".login-info-section");
        if (!window["location"]["href"]["includes"]("login")) k["disconnect"]();
        if (!q) continue;
        k["disconnect"]();
        try {
          ((loginRetryCount = 0x0), await j(), clearLoginRetryTimer());
          const r = () => {
            if (
              loginRetryCount >= loginRetryDelays["length"] ||
              !window["location"]["href"]["includes"]("login") ||
              isLoginSuccess
            ) {
              clearLoginRetryTimer();
              return;
            }
            const t = loginRetryDelays[loginRetryCount];
            loginRetryTimer = setTimeout(async () => {
              loginRetryTimer = null;
              if (!window["location"]["href"]["includes"]("login") || isLoginSuccess) {
                clearLoginRetryTimer();
                return;
              }
              ((loginRetryCount += 0x1),
                await j(),
                loginRetryCount < loginRetryDelays["length"] &&
                  window["location"]["href"]["includes"]("login") &&
                  !isLoginSuccess &&
                  r());
            }, t);
          };
          r();
        } catch (t) {
          console["error"]("loginObserver\x20error:", t);
        }
        break;
      }
    });
  k["observe"](document["body"], {
    childList: !![],
    subtree: !![],
  });
  const l = new MutationObserver((o) => {
    for (let p of o) {
      if (p["type"] === "childList") {
        const q = document["querySelector"]("body\x20>\x20div.el-message-box__wrapper\x20>\x20div");
        if (q && q["querySelector"](".el-message-box__title")["textContent"] === "登录过期") {
          (q["querySelectorAll"]("button")[0x0]["click"](),
            clearLoginRetryTimer(),
            (hasSentLoginInfo = ![]),
            console["log"]("登录过期"),
            ipcRenderer["send"]("account-login-expired"),
            l["disconnect"]());
          break;
        }
        const r = document["querySelector"](".head");
        if (r && r["textContent"] == "账户在别处登录") {
          (clearLoginRetryTimer(),
            (hasSentLoginInfo = ![]),
            ipcRenderer["send"]("account-login-other"),
            l["disconnect"]());
          break;
        }
      }
    }
  });
  l["observe"](document["body"], observerConfig);
  const m = new MutationObserver((o) => {
    for (let p of o) {
      if (p["type"] === "childList") {
        const q = document["querySelector"](
          "#app\x20>\x20div\x20>\x20div.app-container\x20>\x20div.left-panel\x20>\x20div.header.panel-tab-header",
        );
        if (q) {
          (fetch("https://mms.pinduoduo.com/chats/userinfo/realtime?get_response=true")
            ["then"]((r) => r["json"]())
            ["then"](async (r) => {
              ((mallName = r["mall"]["mall_name"]),
                (info = {
                  logo: r["mall"]["logo"],
                  id: r["mall"]["mall_id"]["toString"](),
                  name: r["mall"]["mall_name"],
                  username: r["username"],
                  categoryStr: "",
                }),
                clearLoginRetryTimer(),
                ipcRenderer["send"]("get-shop-info", info));
              if (info)
                setTimeout(() => {
                  window["postMessage"]({
                    type: "sync-shop-info",
                    data: info,
                  });
                }, 0xbb8);
              ((isLoginSuccess = !![]), getTodoCount(), setIntervalF());
              let t = ![];
              async function u() {
                if (t) return;
                try {
                  await getTodoCount();
                } catch (v) {
                  console["error"]("getTodoCount\x20error", v);
                }
                setTimeout(u, 0x5 * 0x3c * 0x3e8);
              }
              u();
            }),
            m["disconnect"]());
          break;
        }
      }
    }
  });
  (m["observe"](document["body"], { childList: !![] }),
    load(),
    await webFrame["executeJavaScript"]("(" + insertScriptStr + ")()"),
    syncAutoOnlineBlockToPage());
  let n = null;
  document["addEventListener"]("visibilitychange", () => {
    document["visibilityState"] === "visible"
      ? (visibilitychange = !![])
      : (visibilitychange = ![]);
  });
});
function getQueryParams(a) {
  try {
    const b = new URL(a);
    let c = b["searchParams"];
    const d = c["get"]("redirectUrl");
    if (d)
      try {
        const g = new URL(d);
        c = g["searchParams"];
      } catch (h) {
        console["warn"]("redirectUrl\x20解析失败，尝试兜底修复");
        const i = d["replace"](/\+/g, "%2B"),
          j = new URL(decodeURIComponent(i));
        c = j["searchParams"];
      }
    const f = (k) => {
      let l = c["get"](k);
      if (!l) return l;
      return (l["includes"]("\x20") && (l = l["replace"](/ /g, "+")), l);
    };
    return {
      shopId: f("shopId"),
      shopName: f("shopName"),
    };
  } catch (k) {
    return (
      console["error"]("getQueryParams\x20error:", k),
      {
        shopId: null,
        shopName: null,
      }
    );
  }
}
function sleep(a) {
  return new Promise((b) => setTimeout(b, a));
}
function load() {
  let a = ![];
  function b() {
    if (a) return;
    const c = document["querySelector"](
      "#app\x20>\x20div\x20>\x20div.app-container\x20>\x20div.left-panel\x20>\x20div.content\x20>\x20div.conv-tab-wrapper\x20>\x20div\x20>\x20div.conv-today.sel",
    );
    if (!c) {
      setTimeout(b, 0xc8);
      return;
    }
    try {
      const d = document["querySelector"](
        "#app\x20>\x20div\x20>\x20div.app-container\x20>\x20div.left-panel\x20>\x20div.content\x20>\x20div.operate-bar\x20>\x20div.search-box\x20>\x20input[type=text]",
      );
      d &&
        (d["setAttribute"]("placeholder", "请点击右侧\x22+\x22号使用此功能"),
        (d["disabled"] = !![]));
      const f = document["getElementsByClassName"]("more-btn-box")[0x4];
      (f && f["textContent"]["trim"]() === "加载更多会话" && f["click"](),
        startShopStatusObserver());
    } catch (g) {
      console["error"]("waitForConvTab\x20error", g);
    }
    a = !![];
  }
  b();
}
function startShopStatusObserver() {
  const a = new MutationObserver((b) => {
    for (let c of b) {
      if (c["type"] === "attributes" && c["attributeName"] === "class") {
        const d = c["target"]["classList"][0x1];
        d !== "online"
          ? ipcRenderer["send"]("shop-status-change", { status: d === "offline" ? "离线" : "忙碌" })
          : ipcRenderer["send"]("shop-status-change", { status: "在线" });
        break;
      }
    }
  });
  a["observe"](document["querySelector"](".status"), observerConfig);
}
function createBatchThrottleSend(a, b = 0x1f4) {
  let c = null,
    d = [];
  return function (f) {
    Array["isArray"](f) ? d["push"](...f) : d["push"](f);
    const g = new Map();
    (d["forEach"]((h) => g["set"](h["messageId"], h)),
      (d = Array["from"](g["values"]())),
      !c &&
        (c = setTimeout(() => {
          (a(d), (d = []), (c = null));
        }, b)));
  };
}
const throttledSendCustomerMessageList = createBatchThrottleSend(async (a) => {
  const b = [];
  for (const c of a) {
    const d = ".chat-item-box[data-random^=\x22" + c["messageId"] + "\x22]",
      f = document["querySelector"](d);
    if (f) {
      c["isNoTime"] = ![];
      const g =
        f["querySelector"](".is-argue")?.["textContent"] ||
        f["querySelector"](".chat-message-content")?.["textContent"] ||
        "";
      if (c["content"]?.["includes"]("订单编号:")) {
        const h = c["content"]["match"](/:(\d+-\d+)/);
        if (h) c["orderId"] = h[0x1];
      }
      b["push"](c);
    } else ((c["isNoTime"] = !![]), b["push"](c));
  }
  b["length"] > 0x0 && ipcRenderer["send"]("get-customer-message-list", b);
}, 0x1f4);
let pushedMessageInfo = new Map();
function pushMessagesIfNeeded(a) {
  const b = Date["now"](),
    c = a["filter"]((d) => d && d["messageId"])["filter"]((d) => {
      const f = pushedMessageInfo["get"](d["messageId"]);
      if (!f) return !![];
      if (b - f["lastPushTime"] > 0x2710) return !![];
      if (f["content"] !== d["content"]) return !![];
      return ![];
    });
  c["length"] &&
    (throttledSendCustomerMessageList(c),
    c["forEach"]((d) => {
      pushedMessageInfo["set"](d["messageId"], {
        content: d["content"],
        lastPushTime: b,
      });
    }));
}
let isFirst = !![];
async function getUnreplyMessage() {
  const a = Array["from"](
    document["querySelectorAll"](".five-minute")[0x0]?.["querySelectorAll"](".chat-item-box") || [],
  )["map"]((b) => ({
    username: b["querySelector"](".nickname-span")?.["textContent"],
    isTimeout: ![],
    timeNote: b["querySelector"](".chat-unreply-time")?.["textContent"],
    content:
      b["querySelector"](".is-argue")?.["textContent"] ??
      b["querySelector"](".chat-message-content")?.["textContent"],
    avatar: b["querySelector"](".chat-portrait\x20img")?.["src"],
    timeout: calculateTimeoutTimestamp(b["querySelector"](".chat-unreply-time")?.["textContent"]),
    messageId: b["getAttribute"]("data-random")["split"]("-")[0x0],
  }));
  if (isFirst) {
    const b = a["concat"](
      Array["from"](
        document["querySelectorAll"](".timeout-unreply")[0x0]?.["querySelectorAll"](
          ".chat-item-box",
        ) || [],
      )["map"]((c) => ({
        username: c["querySelector"](".nickname-span")?.["textContent"],
        isTimeout: !![],
        timeNote: "已超时",
        content: c["querySelector"](".chat-message-content")?.["textContent"],
        avatar: c["querySelector"](".chat-portrait\x20img")?.["src"],
        timeout: null,
        messageId: c["getAttribute"]("data-random")["split"]("-")[0x0],
      })),
    );
    ((isFirst = ![]), pushMessagesIfNeeded(b));
  } else pushMessagesIfNeeded(a);
}
let isPollingActive = !![],
  pollingTimeoutId = null,
  forcont = 0x0;
const POLLING_INTERVAL = 0x1388;
let pullCont = 0x0,
  chekCont = 0x0,
  loginoutFlag = ![];
const combc = async () => {
    let a = [];
    const b = Math["floor"](Date["now"]() / 0x3e8);
    (pullCont++, chekCont++);
    chekCont >= 0x3c &&
      (fetch("https://mms.pinduoduo.com/chats/chatStatusUsers?csname=" + info?.["username"], {
        method: "get",
        headers: { "Content-Type": "application/json" },
      })
        ["then"]((k) => k["json"]())
        ["then"]((k) => {
          k["length"] &&
            tryAutoSwitchOnline(k[k["length"] - 0x1]["status"], "status-history-check");
        })
        ["catch"]((k) => {
          console["log"]("err", k);
        }),
      (chekCont = 0x0));
    pullCont >= 0x12 &&
      (window["postMessage"]({ type: "pull-message" }),
      window["postMessage"]({ type: "get-unreply-conversations" }),
      (pullCont = 0x0));
    const c = document["querySelector"](".layer-box\x20p"),
      d = c?.["textContent"] || "";
    if (d && d["includes"]("登录已过期") && !loginoutFlag)
      (ipcRenderer["send"]("account-login-expired"), (loginoutFlag = !![]));
    else d && d["includes"]("账户在别处登录") && ipcRenderer["send"]("account-login-other");
    const f = document["querySelectorAll"](".already-unreply"),
      g = document["querySelector"](".five-minute"),
      h = document["querySelector"](".timeout-unreply");
    if (g) {
      const k = g["querySelectorAll"](".chat-item-box");
      if (k && k["length"] > 0x0) {
        for (const l of k) {
          const m = {
            username: l["querySelector"](".nickname-span")?.["textContent"],
            isTimeout: ![],
            timeNote: l["querySelector"](".chat-unreply-time")?.["textContent"],
            content:
              l["querySelector"](".is-argue")?.["textContent"] ??
              l["querySelector"](".chat-message-content")?.["textContent"],
            avatar: l["querySelector"](".chat-portrait\x20img")?.["src"],
            timeout: l["querySelector"](".chat-unreply-time")?.["textContent"]
              ? calculateTimeoutTimestamp(l["querySelector"](".chat-unreply-time")?.["textContent"])
              : Math["floor"](Date["now"]() / 0x3e8),
            messageId: l["getAttribute"]("data-random")?.["split"]("-")[0x0],
          };
          m["content"]["includes"]("[纠纷预警") && (m["timeout"] = m["timeout"] + 0xb4);
          if (!m?.["content"]?.["includes"]("平台客服已处理本次售后")) a["push"](m);
        }
        console["log"]("data==========", a);
      }
    }
    if (h) {
      const n = h["querySelectorAll"](".chat-item-box");
      if (n)
        for (const o of n) {
          if (
            !o?.["querySelector"](".chat-message-content")?.["textContent"]?.["includes"](
              "平台客服已处理本次售后",
            )
          )
            a["push"]({
              username: o["querySelector"](".nickname-span")?.["textContent"],
              isTimeout: !![],
              timeNote: "已超时",
              content: o["querySelector"](".chat-message-content")?.["textContent"],
              avatar: o["querySelector"](".chat-portrait\x20img")?.["src"],
              timeout: b,
              messageId: o["getAttribute"]("data-random")?.["split"]("-")[0x0],
            });
        }
    }
    f &&
      !visibilitychange &&
      f["forEach"]((p) => {
        const q = p["querySelector"](".chat-list-title");
        if (q && q["textContent"]["trim"]() === "已被自动回复") {
          const r = p["querySelector"](".chat-item-box");
          if (r) triggerRealMouse(r);
        }
      });
    try {
      const p = document["querySelectorAll"](".already-unreply");
      for (let q = 0x0; q < p["length"]; q++) {
        const r = p[q],
          t = r["querySelector"](".chat-list-title");
        if (t && t["textContent"]["trim"]() === "非工作时间留言") {
          for (let u of r["querySelectorAll"](".chat-item-box")) {
            try {
              if (
                !u?.["querySelector"](".chat-message-content")?.["textContent"]?.["includes"](
                  "平台客服已处理本次售后",
                )
              )
                a["push"]({
                  username: u["querySelector"](".nickname-span")?.["textContent"],
                  isTimeout: !![],
                  timeNote: "非工作时间留言",
                  content: u["querySelector"](".chat-message-content")?.["textContent"],
                  avatar: u["querySelector"](".chat-portrait\x20img")?.["src"],
                  timeout: b,
                  messageId: u["getAttribute"]("data-random")?.["split"]("-")[0x0],
                });
            } catch (v) {
              ipcRenderer["send"]("upload-server-log", {
                bugType: "error",
                bugContent: "拼多多解析非工作时间留言时出错:" + v,
              });
            }
          }
          break;
        }
      }
    } catch (w) {
      ipcRenderer["send"]("upload-server-log", {
        bugType: "error",
        bugContent: "拼多多获取非工作时间留言时出错:" + w,
      });
    }
    if (a["length"] > 0x0) {
      for (const x of a) {
        if (!x["messageId"]) continue;
        const y = extractGoodIdFromContent(x["content"]);
        y && (x["goodId"] = y);
      }
      ipcRenderer["send"]("get-customer-message-list", a);
    }
    const j = getMessageCont();
    return (ipcRenderer["send"]("get-message-total", j), a);
  },
  setIntervalF = async () => {
    (await combc(),
      setTimeout(() => {
        setIntervalF();
      }, 0xa * 0x3e8));
  },
  pollCustomerMessages = async () => {
    if (!isPollingActive) return;
    let a = await combc();
    if (!a) a = (await getMessageByApi()) || [];
    try {
      pushMessagesIfNeeded(a);
    } catch (b) {
      ipcRenderer["send"]("upload-server-log", {
        bugType: "error",
        bugContent: "拼多多推送消息失败:" + b,
      });
    }
    try {
      const c = new Set(a["map"]((d) => d?.["messageId"])["filter"]((d) => d));
      for (const d of Array["from"](pushedMessageInfo["keys"]())) {
        !c["has"](d) && pushedMessageInfo["delete"](d);
      }
    } catch (f) {
      console["warn"]("同步消息ID时出错:", f);
    }
    try {
      const g = document["querySelectorAll"](".more-unreply");
      for (let h of g) {
        const i = h["querySelector"]("span:nth-child(2)\x20>\x20span");
        i &&
          i["textContent"]["trim"]() === "加载未回复会话" &&
          (i["click"](), window["postMessage"]({ type: "get-unreply-conversations" }));
      }
    } catch (j) {
      console["warn"]("点击加载更多按钮时出错:", j);
    }
    try {
      if (isLoginSuccess) {
        const k = window["location"]["href"];
        k["startsWith"]("https://mms.pinduoduo.com/login") &&
          ((isLoginSuccess = ![]), ipcRenderer["send"]("account-login-expired"));
      }
    } catch (l) {
      console["warn"]("检查登录状态时出错:", l);
    }
    (forcont == 0x1 && linkonInsert && console["log"]("初始化巡查结束", forcont),
      isPollingActive &&
        forcont <= 0x1 &&
        (pollingTimeoutId && clearTimeout(pollingTimeoutId),
        linkonInsert && forcont++,
        (pollingTimeoutId = setTimeout(pollCustomerMessages, POLLING_INTERVAL))));
  };
pollCustomerMessages();
const stopPolling = () => {
  ((isPollingActive = ![]),
    pollingTimeoutId && (clearTimeout(pollingTimeoutId), (pollingTimeoutId = null)));
};
let autoReplyLoopStopped = ![];
const parseMessageFromDOM = (a, b = ![]) => {
  return {
    username: a["querySelector"](".nickname-span")?.["textContent"],
    isTimeout: b,
    timeNote: b ? "已超时" : a["querySelector"](".chat-unreply-time")?.["textContent"],
    content: b
      ? a["querySelector"](".chat-message-content")?.["textContent"]
      : (a["querySelector"](".is-argue")?.["textContent"] ??
        a["querySelector"](".chat-message-content")?.["textContent"]),
    avatar: a["querySelector"](".chat-portrait\x20img")?.["src"],
    timeout: b
      ? null
      : calculateTimeoutTimestamp(a["querySelector"](".chat-unreply-time")?.["textContent"]),
    messageId: a["getAttribute"]("data-random")?.["split"]("-")[0x0],
  };
};
async function getMessageByApi() {
  const a = (b, c, d = ![]) => {
    if (!isToday(b["ts"])) return null;
    const f = Math["floor"](Date["now"]() / 0x3e8),
      g = Number(b["ts"]),
      h = f - g,
      i = h > 0xb4,
      j = Math["max"](0x0, 0xb4 - h);
    return {
      username: "游客",
      isTimeout: i,
      timeNote: i ? "已超时" : j + "秒后超时",
      content: b["content"],
      avatar: "",
      timeout: g + 0xb4,
      messageId: c,
      argue: d,
    };
  };
  try {
    const b = await fetch("https://mms.pinduoduo.com/plateau/chat/latest_conversations", {
      method: "POST",
      credentials: "include",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON["stringify"]({
        client: 0x1,
        data: {
          offset: 0x0,
          size: 0x32,
        },
      }),
    })["then"]((i) => i["json"]());
    if (!b["success"] || !b["result"]?.["conversations"]) return [];
    const { conversations: c } = b["result"],
      d = c["filter"]((i) => {
        if (!i) return ![];
        const j = i["from"]?.["role"] === "user",
          k = i["no_unreply_hint"] ?? 0x0,
          l = i["info"]?.["key"] === "aftersale-mediation";
        return j && (k == 0x0 || l);
      })
        ["map"]((i) => a(i, i["from"]?.["uid"]))
        ["filter"]((i) => i !== null);
    let f = [];
    const g = c["filter"]((i) => i["mallName"] !== mallName),
      h = g["filter"]((i) => i["show_auto"] && i["to"]?.["role"] === "user");
    return (
      (f = h["map"]((i) => a(i, i["to"]?.["uid"], !![]))["filter"]((i) => i !== null)),
      (f = f["filter"]((i) => {
        const j = document["querySelector"](
            ".chat-item-box[data-random^=\x22" + i["messageId"] + "\x22]",
          ),
          k =
            j?.["querySelector"](".chat-unreply-time") ||
            j?.["querySelector"](".chat-unreply-over-time");
        return k || !isPDDShowRobotReply;
      })),
      [...d, ...f]
    );
  } catch (i) {
    console["log"]("error", i);
    const j = Array["from"](
        document["querySelectorAll"](".five-minute")[0x0]?.["querySelectorAll"](".chat-item-box") ||
          [],
      )["map"]((l) => parseMessageFromDOM(l, ![])),
      k = Array["from"](
        document["querySelectorAll"](".timeout-unreply")[0x0]?.["querySelectorAll"](
          ".chat-item-box",
        ) || [],
      )["map"]((l) => parseMessageFromDOM(l, !![]));
    return [...j, ...k];
  }
}
async function getUserInfoByUid(a) {
  const b = await fetch("https://mms.pinduoduo.com/latitude/user/userInfoWithTags", {
    method: "POST",
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "anti-content": antigain(),
    },
    body: JSON["stringify"]({ uid: a }),
  })["then"]((c) => c["json"]());
  return b["errorCode"] === 0xf4240
    ? {
        userName: b["result"]["nickname"],
        avatar: b["result"]["avatar"],
      }
    : {
        userName: "",
        avatar: "",
      };
}
const isToday = (a) => {
  if (!a) return ![];
  const b = new Date(Number(a) * 0x3e8),
    c = new Date();
  return (
    b["getDate"]() === c["getDate"]() &&
    b["getMonth"]() === c["getMonth"]() &&
    b["getFullYear"]() === c["getFullYear"]()
  );
};
function getGoodsInfo(a, b) {
  return fetch("https://mms.pinduoduo.com/latitude/goods/recommendGoods", {
    method: "POST",
    mode: "cors",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON["stringify"]({
      goodId: a,
      uid: b,
      pageN: 0x1,
      pageSize: 0xa,
    }),
  })
    ["then"]((c) => c["json"]())
    ["then"]((c) => {
      return c["data"];
    });
}
function calculateTimeoutTimestamp(a) {
  if (!a) return "";
  const b = a["match"](/(\d+)秒/);
  if (b) {
    const c = parseInt(b[0x1], 0xa),
      d = Math["floor"](Date["now"]() / 0x3e8) + c;
    return d;
  } else return a;
}
const mouseDown = new MouseEvent("mousedown", {
    bubbles: !![],
    cancelable: !![],
    view: window,
  }),
  mouseUp = new MouseEvent("mouseup", {
    bubbles: !![],
    cancelable: !![],
    view: window,
  }),
  enterDownEvent = new KeyboardEvent("keydown", {
    key: "Enter",
    keyCode: 0xd,
    which: 0xd,
    bubbles: ![],
  }),
  enterUpEvent = new KeyboardEvent("keyup", {
    key: "Enter",
    keyCode: 0xd,
    which: 0xd,
    bubbles: ![],
  }),
  clickEvent = new MouseEvent("click", {
    bubbles: !![],
    cancelable: !![],
    view: window,
  }),
  throttledClickCustomerMessage = throttle((a) => {
    const b = document["querySelector"](
      "#right-panel\x20>\x20div.content\x20>\x20div\x20>\x20ul\x20>\x20li:nth-child(2)",
    );
    b && b["click"]();
    const c = document["querySelector"](
      ".chat-item-box[data-random^=\x22" + a["messageId"] + "\x22]",
    );
    if (!c && !linkonInsert) {
      const f = document["querySelector"](".conv-today");
      let g = 0x0;
      if (f) {
        if (f["textContent"]) {
          const h = f["textContent"]["match"](/\((\d+)\)/);
          g = h[0x1] || 0x0;
        }
      }
      ipcRenderer["send"]("reply-customer-message", {
        messageId: a["messageId"],
        sendTarget: "pdd1",
        shopMsgTotal: g,
      });
      return;
    }
    (c["dispatchEvent"](mouseDown), c["dispatchEvent"](mouseUp));
    const d = document["getElementById"]("replyTextarea");
    (d?.["blur"](), d?.["focus"]());
  }, 0x1f4);
(safeIpcOn("click-customer-message", (a, b) => {
  throttledClickCustomerMessage(b);
}),
  safeIpcOn("get-shop-experience-score", (a) => {
    getShopExperienceScore();
  }),
  safeIpcOn("get-shop-status", (a) => {
    const b = document["querySelector"](".status");
    if (b) {
      const c = b["getAttribute"]("class");
      let d = "离线";
      if (c["includes"]("offline")) d = "离线";
      else c["includes"]("busy") ? (d = "忙碌") : (d = "在线");
      ipcRenderer["send"]("shop-status-change", { status: d });
    }
  }),
  safeIpcOn("getShopInputStatus", (a, b) => {
    try {
      const c = document["getElementById"]("replyTextarea");
      if (c) {
        const d = c["value"] && c["value"]["trim"]()["length"] > 0x0,
          f = (windowHasFocus && isUserOperating) || d,
          g = document["querySelector"](".msg-content")["getAttribute"]("currentuid");
        ipcRenderer["send"]("shopInputStatus", {
          shopId: b,
          hasContent: f,
          currentUserId: g,
        });
      } else
        ipcRenderer["send"]("shopInputStatus", {
          shopId: b,
          hasContent: ![],
        });
    } catch (h) {
      (console["error"]("检测店铺\x20" + b + "\x20输入框状态失败:", h),
        ipcRenderer["send"]("shopInputStatus", {
          shopId: b,
          hasContent: ![],
        }));
    }
  }));
const getShopExperienceScore = () => {
    fetch("https://mms.pinduoduo.com/sydney/api/mallService/getMallServeScoreV2", {
      mode: "cors",
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON["stringify"]({}),
    })
      ["then"]((a) => a["json"]())
      ["then"]((a) => {
        const { errorCode: b, success: c, result: d } = a;
        b === 0xf4240 && c && d && ipcRenderer["send"]("getShopExperienceScore", d);
      });
  },
  getTodoCount = () => {
    fetch("https://mms.pinduoduo.com/strickland/sop/mms/statusCount", {
      mode: "cors",
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON["stringify"]({}),
    })
      ["then"]((a) => a["json"]())
      ["then"]((a) => {
        const { errorCode: b, success: c, result: d } = a;
        if (b === 0xf4240 && c) {
          const f = d["filter"]((h) => h["status"] === 0x0),
            g = f["length"] ? f[0x0]["count"] : 0x0;
          getTodoList(g);
        }
      });
  },
  getTodoList = (a) => {
    fetch("https://mms.pinduoduo.com/strickland/sop/mms/todoList", {
      mode: "cors",
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON["stringify"]({
        serviceStatus: [0x0],
        problemType: [null],
        createStartTime: Math["floor"](
          new Date(Date["now"]() - 0x7 * 0x18 * 0x3c * 0x3c * 0x3e8)["setHours"](
            0x0,
            0x0,
            0x0,
            0x0,
          ) / 0x3e8,
        ),
        createEndTime: Math["floor"](
          new Date(new Date()["setHours"](0x17, 0x3b, 0x3b, 0x0))["getTime"]() / 0x3e8,
        ),
        pageNum: 0x1,
        pageSize: a < 0xa ? 0xa : a,
      }),
    })
      ["then"]((b) => b["json"]())
      ["then"]((b) => {
        const { errorCode: c, success: d, result: f } = b;
        c === 0xf4240 && d && ipcRenderer["send"]("get-todo-list", f["dataList"] || []);
      });
  };
let message,
  isProcessing = ![];
const preloadOrderAndGoodsByNeedOrder = async (a) => {
  if (!shopId || !a) return;
  try {
    await ipcRenderer["invoke"]("enrich-user-profile", {
      shopId: Number(shopId),
      item: a,
    });
  } catch (b) {
    console["log"]("[needOrder]\x20pdd主动拉取订单商品失败:", b);
  }
};
safeIpcOn("reply-message", (a, b) => {
  let c = [];
  try {
    if (typeof b === "object") c = [...b];
    else {
      const d = JSON["parse"](b);
      c = d;
    }
  } catch {
    b["isBottomLineAutoReply"] && (c = [...b]);
  }
  if (c["length"] > 0x0) {
    if (sendInsert && c[0x0]["messageId"]) {
      const f = c[0x0],
        g = Date["now"](),
        h = {
          ...f,
          messageId: f["messageId"] || f["userId"],
          userId: f["userId"] || f["messageId"],
          isAiAutoReply: !f["isBottomLineAutoReply"],
          isBottomLineAutoReply: f["isBottomLineAutoReply"] || ![],
          isReminderReply: f?.["isReminderReply"] || ![],
          isAiInviteReply: f?.["isAiInviteReply"] || ![],
        };
      ((c[0x0]?.["imageBase64"] || c[0x0]?.["imageUrl"]) &&
        (c[0x0]?.["imageBase64"]
          ? sendImageToUser(c[0x0]["imageBase64"], f["messageId"] || f["userId"])
          : imageUrlToBase64(c[0x0]["imageUrl"])
              ["then"]((i) => {
                sendImageToUser(i["base64"], f["messageId"] || f["userId"]);
              })
              ["catch"]((i) => {
                console["error"]("[图片发送]\x20下载图片失败:", i);
              })),
        f?.["needOrder"] && f?.["needOrder"] >= 0x3 && preloadOrderAndGoodsByNeedOrder(f),
        window["postMessage"](
          {
            type: "SET_AI_REPLY_INFO",
            data: h,
          },
          "*",
        ),
        setTimeout(() => {
          window["postMessage"](
            {
              type: "send-message",
              data: {
                cmd: "send_message",
                anti_content: antigain(),
                request_id: g,
                message: {
                  to: {
                    role: "user",
                    uid: c[0x0]["messageId"],
                  },
                  from: { role: "mall_cs" },
                  ts: g,
                  content: c[0x0]["replyContent"],
                  msg_id: null,
                  type: 0x0,
                  is_aut: 0x0,
                  manual_reply: 0x1,
                  status: "read",
                  is_read: 0x1,
                },
              },
            },
            "*",
          );
        }, 0x1f4));
    }
  }
});
const processNextMessage = async (a) => {
    if (isProcessing || a["length"] === 0x0) return;
    isProcessing = !![];
    const b = a["shift"]();
    ((message = b),
      await handleReplyMessage(b)
        ["catch"]((c) => console["error"]("处理消息异常", c))
        ["finally"](async () => {
          ((isProcessing = ![]), await ms_delay(0x64), processNextMessage(a));
        }));
  },
  handleReplyMessage = async (a) => {
    const b = document["querySelector"](
      ".chat-item-box[data-random^=\x22" + a["messageId"] + "\x22]",
    );
    if (!b) {
      window["postMessage"](
        {
          type: "CLEAR_AI_REPLY_INFO",
          data: { messageId: a["messageId"] },
        },
        "*",
      );
      return;
    }
    if (a["isBottomLineAutoReply"]) {
      if (_key) {
        window["postMessage"](
          {
            type: "CLEAR_AI_REPLY_INFO",
            data: { messageId: a["messageId"] },
          },
          "*",
        );
        return;
      }
      const f = b["getAttribute"]("data-random");
      if (f && f["includes"]("-reply")) {
        window["postMessage"](
          {
            type: "CLEAR_AI_REPLY_INFO",
            data: { messageId: a["messageId"] },
          },
          "*",
        );
        return;
      }
    }
    (b["dispatchEvent"](mouseDown), b["dispatchEvent"](mouseUp), await ms_delay(0x1f4));
    (a?.["imageBase64"] || a?.["imageUrl"]) &&
      (await sendImageMessage(a["messageId"], a["imageBase64"], a["imageMimeType"], a["imageUrl"]));
    const c = document["getElementById"]("replyTextarea");
    (c["blur"](),
      c["focus"](),
      (c["value"] = a["replyContent"]),
      c["dispatchEvent"](new Event("input", { bubbles: ![] })),
      c["dispatchEvent"](enterDownEvent),
      c["dispatchEvent"](enterUpEvent),
      await ms_delay(0x1f4));
    const d = document["querySelector"](".repeat-interceptor-popup");
    if (d) {
      const g = d["querySelector"]("button");
      g && g["click"]();
    }
    await ms_delay(0x1f4);
    if (c["value"] === "") return;
  };
safeIpcOn("send-image-message", async (a, b) => {
  console["log"]("[图片发送]\x20收到图片发送请求:", b);
  const { messageId: c, imageBase64: d, imageMimeType: f, imageUrl: g } = b;
  try {
    await sendImageMessage(c, d, f, g);
  } catch (h) {
    console["error"]("[图片发送]\x20图片发送失败:", h);
  }
});
async function imageUrlToBase64(a) {
  const b = await fetch(a);
  if (!b["ok"]) throw new Error("下载图片失败:\x20" + b["status"]);
  const c = await b["blob"]();
  return new Promise((d, f) => {
    const g = new FileReader();
    ((g["onloadend"] = () => {
      const h = g["result"];
      d({
        base64: h["split"](",")[0x1],
        mimeType: c["type"] || "image/jpeg",
      });
    }),
      (g["onerror"] = () => f(new Error("读取图片失败"))),
      g["readAsDataURL"](c));
  });
}
async function sendImageMessage(a, b, c, d) {
  const f = document["querySelector"]("input[type=\x22file\x22][accept*=\x22image\x22]");
  if (!f) return (console["error"]("[图片发送]\x20未找到图片上传input"), ![]);
  if (!b && d) {
    const q = await imageUrlToBase64(d);
    ((b = q["base64"]), (c = c || q["mimeType"]));
  }
  if (!b || !c) return (console["error"]("[图片发送]\x20缺少图片数据"), ![]);
  const g = atob(b),
    h = new Uint8Array(g["length"]);
  for (let r = 0x0; r < g["length"]; r++) {
    h[r] = g["charCodeAt"](r);
  }
  const j = new Blob([h], { type: c }),
    k = c["split"]("/")[0x1] || "jpg",
    l = new File([j], "image_" + Date["now"]() + "." + k, { type: c }),
    m = new DataTransfer();
  (m["items"]["add"](l),
    (f["files"] = m["files"]),
    f["dispatchEvent"](new Event("change", { bubbles: !![] })));
  let n = 0x0;
  const o = 0x14,
    p = setInterval(() => {
      n++;
      const t = document["querySelector"](".modal");
      if (t) {
        const u = t["querySelector"](".modal-header");
        if (u && u["textContent"]?.["includes"]("是否发送图片")) {
          const v = t["querySelector"](".btn-ok");
          v &&
            (v["click"](),
            setTimeout(() => {
              t["parentNode"] && t["parentNode"]["removeChild"](t);
            }, 0x64));
          clearInterval(p);
          return;
        }
      }
      n >= o && clearInterval(p);
    }, 0x64);
  return !![];
}
(safeIpcOn("open-todo-list", (a, b) => {
  const c = document["createElement"]("a");
  ((c["href"] = "https://mms.pinduoduo.com/aftersales/work_order/tododetail?id=" + b),
    (c["target"] = "_blank"),
    c["click"]());
}),
  safeIpcOn("star", (a, b) => {
    const c = document["querySelector"]("[title=\x22收藏该用户\x22]");
    if (b && b?.["type"] == "AI" && c) !c["classList"]["contains"]("active") && c["click"]();
    else c && c["click"]();
  }),
  safeIpcOn("change-shop-status", (a, b) => {
    console["log"]("change-shop-status");
    const c = getStatusMenuDom();
    if (c) {
      if (b === "online") {
        const d = c["querySelector"]("li");
        d && triggerStatusOptionClick(d);
      } else {
        if (b === "offline") {
          const f = c["querySelectorAll"]("li")[c["querySelectorAll"]("li")["length"] - 0x1];
          f && triggerStatusOptionClick(f);
        } else {
          const g = c["querySelectorAll"]("li")[c["querySelectorAll"]("li")["length"] - 0x2];
          g && triggerStatusOptionClick(g);
        }
      }
    }
  }),
  safeIpcOn("get-goods-detail", async (a, b) => {
    let c = [];
    const d = b["ids"]["map"](async (f) => {
      const g = await processGoodsDetail(f, b);
      return g;
    });
    ((c = await Promise["all"](d)), ipcRenderer["send"]("get-goods-detail", c));
  }),
  safeIpcOn("get-goods-all-detail", async (a, b) => {
    getGoodsList(b);
  }));
async function getGoodsList(a) {
  try {
    const b = await fetch("https://mms.pinduoduo.com/latitude/goods/recommendGoods", {
        mode: "cors",
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          pageNum: 0x1,
          pageSize: 0x32,
          uid: "",
        }),
      }),
      c = await b["json"]();
    if (!c["success"]) {
      console["error"]("获取商品列表失败:", c);
      return;
    }
    const d = c["result"]["total"];
    ipcRenderer["send"]("get-goods-all-detail-total", {
      userId: a["userId"],
      total: d,
    });
    const f = 0x32,
      g = Math["ceil"](d / f);
    if (c["result"]["onSaleGoods"]) {
      const i = g === 0x1;
      await h(c["result"]["onSaleGoods"], 0x1, a, i);
    }
    for (let j = 0x2; j <= g; j++) {
      try {
        const k = await fetch("https://mms.pinduoduo.com/latitude/goods/recommendGoods", {
            mode: "cors",
            credentials: "include",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON["stringify"]({
              pageNum: j,
              pageSize: f,
              uid: "",
            }),
          }),
          l = await k["json"]();
        if (l["success"] && l["result"]["onSaleGoods"]) {
          const m = j === g;
          await h(l["result"]["onSaleGoods"], j, a, m);
        }
        await new Promise((n) => setTimeout(n, 0x64));
      } catch (n) {
        console["error"]("获取第\x20" + j + "\x20页商品列表失败:", n);
      }
    }
    async function h(o, p, q, r = ![]) {
      try {
        const t = [];
        for (let u = 0x0; u < o["length"]; u++) {
          const v = o[u]["goodsId"],
            w = await processGoodsDetail(v, q, r);
          (w && t["push"](w),
            u < o["length"] - 0x1 && (await new Promise((x) => setTimeout(x, 0x1388))));
        }
        (t["length"] > 0x0 && ipcRenderer["send"]("get-goods-detail", t),
          await new Promise((x) => setTimeout(x, 0x3e8)));
      } catch (x) {
        console["error"]("处理第\x20" + p + "\x20页时出错:", x);
      }
    }
  } catch (o) {
    console["error"]("获取全部商品详情时出错:", o);
  }
}
async function processGoodsDetail(a, b, c = ![]) {
  try {
    const d = await fetch("https://mms.pinduoduo.com/glide/v2/mms/query/commit/on_shop/detail", {
        mode: "cors",
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({ goods_id: a }),
      }),
      f = await fetch("https://mms.pinduoduo.com/draco-ms/mms/query-goods-property", {
        mode: "cors",
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({ goods_id: a }),
      }),
      g = await d["json"](),
      h = await f["json"]();
    if (!g["success"] || !g["result"])
      return (console["warn"]("商品\x20" + item["goodsId"] + "\x20详情获取失败"), null);
    const i = g["result"];
    let j = [];
    const k = g?.["result"]?.["skus"];
    if (k?.["length"] > 0x0) {
      const o = {};
      for (const p of k) {
        p["spec"]?.["forEach"]((q) => {
          const r = q["parent_name"],
            t = q["spec_name"];
          if (!r || !t) return;
          (!o[r] && (o[r] = new Set()), o[r]["add"](t));
        });
      }
      j = Object["entries"](o)["map"](([q, r]) => {
        const t = [...r]["join"]("/");
        return q + ":" + t;
      });
    }
    const l = i["cats"] ? [...new Set(i["cats"]["filter"](Boolean))]["join"]("/") : "";
    let m = "";
    if (h["success"] && h["result"] && h["result"]["goods_properties"]) {
      const q = h["result"]["goods_properties"];
      m = q["map"]((r) => {
        if (r["values"] && r["values"]["length"] > 0x0) {
          const t = r["values"]["map"]((u) => u["value"])["join"](",");
          return r["name"] + ":" + t;
        }
        return "";
      })["filter"]((r) => r !== "");
    }
    const n = {
      goodId: i["goods_id"],
      goodName: i["goods_name"],
      detailImages: i["detail_gallery"] ? i["detail_gallery"]["map"]((r) => r["url"]) : [],
      mainImage: i["thumb_url"],
      type: b?.["type"],
      id: b?.["id"],
      goodProperties: m,
      goodCat: l,
      goodSku: j,
    };
    return (c && b?.["aiTaskId"] && (n["aiTaskId"] = b?.["aiTaskId"]), n);
  } catch (r) {
    return (console["error"]("处理商品\x20" + a + "\x20\x20时出错:", r), null);
  }
}
(safeIpcOn("init-shop-info", (a, b) => {
  fetch("https://mms.pinduoduo.com/earth/api/merchant/queryMerchantInfoByMallId", {
    mode: "cors",
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anti-content": antigain(),
    },
  })
    ["then"]((c) => c["json"]())
    ["then"]((c) => {
      const { errorCode: d, success: f, result: g } = c;
      if (d === 0xf4240 && f) {
        const h = g["categoryStr"],
          i = {
            shopClass: h,
            goodName: "",
          };
        ipcRenderer["send"]("init-shop-info", i);
      }
    });
}),
  safeIpcOn("set-ai-to-human-reply", () => {
    Array["from"](
      document["querySelectorAll"](".chat-list")[0x0]?.["querySelectorAll"](".active") || [],
    )["map"]((a) => {
      a["getAttribute"]("data-random") &&
        ipcRenderer["send"]("set-ai-to-human-reply-customer", {
          messageId: a["getAttribute"]("data-random")["split"]("-")[0x0],
        });
    });
  }),
  window["addEventListener"]("error", (a) => {
    (console["error"]("全局错误", a), reportGlobalPreloadError("全局错误", a["error"] || a));
  }),
  window["addEventListener"]("unhandledrejection", (a) => {
    (console["error"]("未捕获的promise错误", a),
      reportGlobalPreloadError("未捕获的promise错误", a["reason"] || a));
  }));
function antigain() {
  var a;
  !(function (g) {
    function h(A) {
      for (var B, C, D = A[0x0], E = A[0x1], F = A[0x2], G = 0x0, H = []; G < D["length"]; G++)
        ((C = D[G]),
          Object["prototype"]["hasOwnProperty"]["call"](p, C) && p[C] && H["push"](p[C][0x0]),
          (p[C] = 0x0));
      for (B in E) Object["prototype"]["hasOwnProperty"]["call"](E, B) && (g[B] = E[B]);
      for (z && z(A); H["length"]; ) H["shift"]()();
      return (q["push"]["apply"](q, F || []), j());
    }
    function j() {
      for (var A, B = 0x0; B < q["length"]; B++) {
        for (var C = q[B], D = !0x0, E = 0x1; E < C["length"]; E++) {
          var F = C[E];
          0x0 !== p[F] && (D = !0x1);
        }
        D && (q["splice"](B--, 0x1), (A = v((v["s"] = C[0x0]))));
      }
      return A;
    }
    var k = {},
      m = { 0x15: 0x0 },
      p = { 0x15: 0x0 },
      q = [];
    function v(A) {
      if (k[A]) return k[A]["exports"];
      var B = (k[A] = {
        i: A,
        l: !0x1,
        exports: {},
      });
      return (g[A]["call"](B["exports"], B, B["exports"], v), (B["l"] = !0x0), B["exports"]);
    }
    ((v["e"] = function (A) {
      var B = [];
      m[A]
        ? B["push"](m[A])
        : 0x0 !== m[A] &&
          {
            0x1: 0x1,
            0xa: 0x1,
            0xb: 0x1,
            0xc: 0x1,
            0xe: 0x1,
            0xf: 0x1,
            0x11: 0x1,
          }[A] &&
          B["push"](
            (m[A] = new Promise(function (I, J) {
              for (
                var K =
                    "static/css/" +
                    ({
                      0x7: "AccountCenter",
                      0x8: "Activity",
                      0x9: "BestGoods",
                      0xa: "Cart",
                      0xb: "GoodsDetail",
                      0xc: "GoodsDropShipping",
                      0xd: "Home",
                      0xe: "Mall",
                      0xf: "MallSearch",
                      0x10: "NotFound",
                      0x11: "Order",
                      0x12: "Payment",
                      0x13: "Search",
                    }[A] || A) +
                    "." +
                    {
                      0x0: "31d6cfe0d",
                      0x1: "1bb732cb7",
                      0x2: "31d6cfe0d",
                      0x3: "31d6cfe0d",
                      0x4: "31d6cfe0d",
                      0x5: "31d6cfe0d",
                      0x6: "31d6cfe0d",
                      0x7: "31d6cfe0d",
                      0x8: "31d6cfe0d",
                      0x9: "31d6cfe0d",
                      0xa: "86909bf59",
                      0xb: "1405928aa",
                      0xc: "9eff41d5d",
                      0xd: "31d6cfe0d",
                      0xe: "941e90c52",
                      0xf: "86909bf59",
                      0x10: "31d6cfe0d",
                      0x11: "07dca30ce",
                      0x12: "31d6cfe0d",
                      0x13: "31d6cfe0d",
                      0x17: "31d6cfe0d",
                      0x18: "31d6cfe0d",
                      0x19: "31d6cfe0d",
                      0x1a: "31d6cfe0d",
                      0x1b: "31d6cfe0d",
                      0x1c: "31d6cfe0d",
                      0x1d: "31d6cfe0d",
                      0x1e: "31d6cfe0d",
                    }[A] +
                    ".chunk.css",
                  L = v["p"] + K,
                  M = document["getElementsByTagName"]("link"),
                  N = 0x0;
                N < M["length"];
                N++
              ) {
                var O = (Q = M[N])["getAttribute"]("data-href") || Q["getAttribute"]("href");
                if ("stylesheet" === Q["rel"] && (O === K || O === L)) return I();
              }
              var P = document["getElementsByTagName"]("style");
              for (N = 0x0; N < P["length"]; N++) {
                var Q;
                if ((O = (Q = P[N])["getAttribute"]("data-href")) === K || O === L) return I();
              }
              var R = document["createElement"]("link");
              ((R["rel"] = "stylesheet"),
                (R["type"] = "text/css"),
                (R["onload"] = I),
                (R["onerror"] = function (S) {
                  var T = (S && S["target"] && S["target"]["src"]) || L,
                    U = new Error("Loading\x20CSS\x20chunk\x20" + A + "\x20failed.\x0a(" + T + ")");
                  ((U["request"] = T), J(U));
                }),
                (R["href"] = L),
                document["getElementsByTagName"]("head")[0x0]["appendChild"](R));
            })["then"](function () {
              m[A] = 0x0;
            })),
          );
      var C = p[A];
      if (0x0 !== C) {
        if (C) B["push"](C[0x2]);
        else {
          var D = new Promise(function (I, J) {
            C = p[A] = [I, J];
          });
          B["push"]((C[0x2] = D));
          var E,
            F = document["createElement"]("script");
          ((F["charset"] = "utf-8"),
            (F["timeout"] = 0x78),
            v["nc"] && F["setAttribute"]("nonce", v["nc"]),
            (F["src"] = (function (I) {
              return (
                v["p"] +
                "static/js/" +
                ({
                  0x7: "AccountCenter",
                  0x8: "Activity",
                  0x9: "BestGoods",
                  0xa: "Cart",
                  0xb: "GoodsDetail",
                  0xc: "GoodsDropShipping",
                  0xd: "Home",
                  0xe: "Mall",
                  0xf: "MallSearch",
                  0x10: "NotFound",
                  0x11: "Order",
                  0x12: "Payment",
                  0x13: "Search",
                }[I] || I) +
                "." +
                {
                  0x0: "73affeb9",
                  0x1: "95bcd243",
                  0x2: "90790f29",
                  0x3: "83215cc2",
                  0x4: "2e05c9fd",
                  0x5: "376319a7",
                  0x6: "989946a6",
                  0x7: "122ef4b3",
                  0x8: "d2665e11",
                  0x9: "29797479",
                  0xa: "6db25d59",
                  0xb: "df6df89f",
                  0xc: "658d2efd",
                  0xd: "86e1d209",
                  0xe: "f7561289",
                  0xf: "7c394e98",
                  0x10: "9c3fd526",
                  0x11: "6949727a",
                  0x12: "1dc52d10",
                  0x13: "70cc3637",
                  0x17: "d6a6042a",
                  0x18: "ced7d2c9",
                  0x19: "58cc2a86",
                  0x1a: "71745484",
                  0x1b: "d470dd7f",
                  0x1c: "e5189849",
                  0x1d: "d67ed71c",
                  0x1e: "d20b68bc",
                }[I] +
                ".chunk.v20240716150741_849ca94f.js"
              );
            })(A)));
          var G = new Error();
          E = function (I) {
            ((F["onerror"] = F["onload"] = null), clearTimeout(H));
            var J = p[A];
            if (0x0 !== J) {
              if (J) {
                var K = I && ("load" === I["type"] ? "missing" : I["type"]),
                  L = I && I["target"] && I["target"]["src"];
                ((G["message"] =
                  "Loading\x20chunk\x20" + A + "\x20failed.\x0a(" + K + ":\x20" + L + ")"),
                  (G["name"] = "ChunkLoadError"),
                  (G["type"] = K),
                  (G["request"] = L),
                  J[0x1](G));
              }
              p[A] = void 0x0;
            }
          };
          var H = setTimeout(function () {
            E({
              type: "timeout",
              target: F,
            });
          }, 0x1d4c0);
          ((F["onerror"] = F["onload"] = E), document["head"]["appendChild"](F));
        }
      }
      return Promise["all"](B);
    }),
      (v["m"] = g),
      (v["c"] = k),
      (v["d"] = function (A, B, C) {
        v["o"](A, B) ||
          Object["defineProperty"](A, B, {
            enumerable: !0x0,
            get: C,
          });
      }),
      (v["r"] = function (A) {
        ("undefined" !== typeof Symbol &&
          Symbol["toStringTag"] &&
          Object["defineProperty"](A, Symbol["toStringTag"], { value: "Module" }),
          Object["defineProperty"](A, "__esModule", { value: !0x0 }));
      }),
      (v["t"] = function (A, B) {
        if ((0x1 & B && (A = v(A)), 0x8 & B)) return A;
        if (0x4 & B && "object" === typeof A && A && A["__esModule"]) return A;
        var C = Object["create"](null);
        if (
          (v["r"](C),
          Object["defineProperty"](C, "default", {
            enumerable: !0x0,
            value: A,
          }),
          0x2 & B && "string" != typeof A)
        ) {
          for (var D in A)
            v["d"](
              C,
              D,
              function (E) {
                return A[E];
              }["bind"](null, D),
            );
        }
        return C;
      }),
      (v["n"] = function (A) {
        var B =
          A && A["__esModule"]
            ? function () {
                return A["default"];
              }
            : function () {
                return A;
              };
        return (v["d"](B, "a", B), B);
      }),
      (v["o"] = function (A, B) {
        return Object["prototype"]["hasOwnProperty"]["call"](A, B);
      }),
      (v["p"] = "https://mms-static.pddpic.com/wholesale/"),
      (v["oe"] = function (A) {
        throw (console["error"](A), A);
      }));
    var w = (window["webpackJsonp"] = window["webpackJsonp"] || []),
      x = w["push"]["bind"](w);
    ((w["push"] = h), (w = w["slice"]()));
    for (var y = 0x0; y < w["length"]; y++) h(w[y]);
    var z = x;
    a = v;
  })({
    fbeZ: function (d, f, g) {
      (function (h) {
        ("undefined" != typeof self && self,
          (d["exports"] = (function (i) {
            var j = {};
            function k(l) {
              if (j[l]) return j[l]["exports"];
              var m = (j[l] = {
                i: l,
                l: !0x1,
                exports: {},
              });
              return (
                i[l]["call"](m["exports"], m, m["exports"], k),
                (m["l"] = !0x0),
                m["exports"]
              );
            }
            return (
              (k["m"] = i),
              (k["c"] = j),
              (k["d"] = function (l, m, o) {
                k["o"](l, m) ||
                  Object["defineProperty"](l, m, {
                    enumerable: !0x0,
                    get: o,
                  });
              }),
              (k["r"] = function (l) {
                ("undefined" != typeof Symbol &&
                  Symbol["toStringTag"] &&
                  Object["defineProperty"](l, Symbol["toStringTag"], { value: "Module" }),
                  Object["defineProperty"](l, "__esModule", { value: !0x0 }));
              }),
              (k["t"] = function (l, m) {
                if ((0x1 & m && (l = k(l)), 0x8 & m)) return l;
                if (0x4 & m && "object" == typeof l && l && l["__esModule"]) return l;
                var p = Object["create"](null);
                if (
                  (k["r"](p),
                  Object["defineProperty"](p, "default", {
                    enumerable: !0x0,
                    value: l,
                  }),
                  0x2 & m && "string" != typeof l)
                ) {
                  for (var q in l)
                    k["d"](
                      p,
                      q,
                      function (u) {
                        return l[u];
                      }["bind"](null, q),
                    );
                }
                return p;
              }),
              (k["n"] = function (l) {
                var m =
                  l && l["__esModule"]
                    ? function () {
                        return l["default"];
                      }
                    : function () {
                        return l;
                      };
                return (k["d"](m, "a", m), m);
              }),
              (k["o"] = function (l, m) {
                return Object["prototype"]["hasOwnProperty"]["call"](l, m);
              }),
              (k["p"] = ""),
              k((k["s"] = 0x4))
            );
          })([
            function (j, k, l) {
              "use strict";
              var m =
                  "function" == typeof Symbol && "symbol" == typeof Symbol["iterator"]
                    ? function (w) {
                        return typeof w;
                      }
                    : function (w) {
                        return w &&
                          "function" == typeof Symbol &&
                          w["constructor"] === Symbol &&
                          w !== Symbol["prototype"]
                          ? "symbol"
                          : typeof w;
                      },
                p =
                  "undefined" != typeof Uint8Array &&
                  "undefined" != typeof Uint16Array &&
                  "undefined" != typeof Int32Array;
              function q(w, x) {
                return Object["prototype"]["hasOwnProperty"]["call"](w, x);
              }
              ((k["assign"] = function (w) {
                for (var x = Array["prototype"]["slice"]["call"](arguments, 0x1); x["length"]; ) {
                  var y = x["shift"]();
                  if (y) {
                    if ("object" !== (void 0x0 === y ? "undefined" : m(y)))
                      throw new TypeError(y + "must\x20be\x20non-object");
                    for (var z in y) q(y, z) && (w[z] = y[z]);
                  }
                }
                return w;
              }),
                (k["shrinkBuf"] = function (w, x) {
                  return w["length"] === x
                    ? w
                    : w["subarray"]
                      ? w["subarray"](0x0, x)
                      : ((w["length"] = x), w);
                }));
              var u = {
                  arraySet: function (w, x, y, z, A) {
                    if (x["subarray"] && w["subarray"]) w["set"](x["subarray"](y, y + z), A);
                    else {
                      for (var B = 0x0; B < z; B++) w[A + B] = x[y + B];
                    }
                  },
                  flattenChunks: function (w) {
                    var x, y, z, A, B, C;
                    for (z = 0x0, x = 0x0, y = w["length"]; x < y; x++) z += w[x]["length"];
                    for (C = new Uint8Array(z), A = 0x0, x = 0x0, y = w["length"]; x < y; x++)
                      ((B = w[x]), C["set"](B, A), (A += B["length"]));
                    return C;
                  },
                },
                v = {
                  arraySet: function (w, x, y, z, A) {
                    for (var B = 0x0; B < z; B++) w[A + B] = x[y + B];
                  },
                  flattenChunks: function (w) {
                    return []["concat"]["apply"]([], w);
                  },
                };
              ((k["setTyped"] = function (w) {
                w
                  ? ((k["Buf8"] = Uint8Array),
                    (k["Buf16"] = Uint16Array),
                    (k["Buf32"] = Int32Array),
                    k["assign"](k, u))
                  : ((k["Buf8"] = Array),
                    (k["Buf16"] = Array),
                    (k["Buf32"] = Array),
                    k["assign"](k, v));
              }),
                k["setTyped"](p));
            },
            function (i, j, k) {
              "use strict";
              i["exports"] = function (l) {
                return (
                  l["webpackPolyfill"] ||
                    ((l["deprecate"] = function () {}),
                    (l["paths"] = []),
                    l["children"] || (l["children"] = []),
                    Object["defineProperty"](l, "loaded", {
                      enumerable: !0x0,
                      get: function () {
                        return l["l"];
                      },
                    }),
                    Object["defineProperty"](l, "id", {
                      enumerable: !0x0,
                      get: function () {
                        return l["i"];
                      },
                    }),
                    (l["webpackPolyfill"] = 0x1)),
                  l
                );
              };
            },
            function (i, j, k) {
              "use strict";
              i["exports"] = {
                0x2: "need\x20dictionary",
                0x1: "stream\x20end",
                0x0: "",
                "-1": "file\x20error",
                "-2": "stream\x20error",
                "-3": "data\x20error",
                "-4": "insufficient\x20memory",
                "-5": "buffer\x20error",
                "-6": "incompatible\x20version",
              };
            },
            function (i, j, k) {
              "use strict";
              (function (m) {
                var q =
                  "function" == typeof Symbol && "symbol" == typeof Symbol["iterator"]
                    ? function (H) {
                        return typeof H;
                      }
                    : function (H) {
                        return H &&
                          "function" == typeof Symbol &&
                          H["constructor"] === Symbol &&
                          H !== Symbol["prototype"]
                          ? "symbol"
                          : typeof H;
                      };
                !(function (H, I) {
                  var J = E();
                  function K(M, N) {
                    return z(M - -0x1a0, N);
                  }
                  function L(M, N) {
                    return z(N - -0xd1, M);
                  }
                  for (;;)
                    try {
                      if (
                        (-parseInt(L("@b)w", 0x1e9)) / 0x1) * (-parseInt(L("iU!(", 0xbc)) / 0x2) +
                          (parseInt(L("ea1u", 0x185)) / 0x3) * (parseInt(L("(5h(", 0x1de)) / 0x4) +
                          (-parseInt(K(0x102, "IUs7")) / 0x5) * (parseInt(L("K)F[", 0x1d9)) / 0x6) +
                          (-parseInt(L("#FdB", 0x1dd)) / 0x7) * (parseInt(L("M#pd", 0x150)) / 0x8) +
                          (-parseInt(L("ea1u", 0xe3)) / 0x9) * (-parseInt(L("iSBn", 0x16b)) / 0xa) +
                          (-parseInt(K(0x131, "d2&5")) / 0xb) *
                            (-parseInt(L("bmAe", 0x169)) / 0xc) +
                          parseInt(L("hAY8", 0x177)) / 0xd ===
                        0xba740
                      )
                        break;
                      J["push"](J["shift"]());
                    } catch (M) {
                      J["push"](J["shift"]());
                    }
                })();
                var v = k(0xc),
                  w = k(0xd)[A(0x5ae, "2)u3")],
                  x = (A(0x5ac, "lqr!") +
                    C(-0x169, "lxO1") +
                    A(0x559, "wReF") +
                    A(0x56b, "(5h(") +
                    C(-0xac, "1F4e") +
                    A(0x5ec, "l3WP") +
                    A(0x612, "qy3r"))[C(-0xcf, "eyzX")](""),
                  y = {};
                function z(H, I) {
                  var J = E();
                  return (z = function (K, L) {
                    var M = J[(K -= 0x189)];
                    void 0x0 === z["AVPLwW"] &&
                      ((z["jhmVoH"] = function (P, Q) {
                        var R = [],
                          S = 0x0,
                          T = void 0x0,
                          U = "";
                        P = (function (X) {
                          for (
                            var Y, Z, a0 = "", a1 = "", a2 = 0x0, a3 = 0x0;
                            (Z = X["charAt"](a3++));
                            ~Z && ((Y = a2 % 0x4 ? 0x40 * Y + Z : Z), a2++ % 0x4)
                              ? (a0 += String["fromCharCode"](0xff & (Y >> ((-0x2 * a2) & 0x6))))
                              : 0x0
                          )
                            Z = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/="[
                              "indexOf"
                            ](Z);
                          for (var a4 = 0x0, a5 = a0["length"]; a4 < a5; a4++)
                            a1 +=
                              "%" + ("00" + a0["charCodeAt"](a4)["toString"](0x10))["slice"](-0x2);
                          return decodeURIComponent(a1);
                        })(P);
                        var V = void 0x0;
                        for (V = 0x0; V < 0x100; V++) R[V] = V;
                        for (V = 0x0; V < 0x100; V++)
                          ((S = (S + R[V] + Q["charCodeAt"](V % Q["length"])) % 0x100),
                            (T = R[V]),
                            (R[V] = R[S]),
                            (R[S] = T));
                        ((V = 0x0), (S = 0x0));
                        for (var W = 0x0; W < P["length"]; W++)
                          ((S = (S + R[(V = (V + 0x1) % 0x100)]) % 0x100),
                            (T = R[V]),
                            (R[V] = R[S]),
                            (R[S] = T),
                            (U += String["fromCharCode"](
                              P["charCodeAt"](W) ^ R[(R[V] + R[S]) % 0x100],
                            )));
                        return U;
                      }),
                      (H = arguments),
                      (z["AVPLwW"] = !0x0));
                    var N = K + J[0x0],
                      O = H[N];
                    return (
                      O
                        ? (M = O)
                        : (void 0x0 === z["QkLBNM"] && (z["QkLBNM"] = !0x0),
                          (M = z["jhmVoH"](M, L)),
                          (H[N] = M)),
                      M
                    );
                  })(H, I);
                }
                function A(H, I) {
                  return z(H - 0x3c6, I);
                }
                ((y["+"] = "-"), (y["/"] = "_"), (y["="] = ""));
                var B = y;
                function C(H, I) {
                  return z(H - -0x334, I);
                }
                function D(H) {
                  return H[A(0x5be, "pKX5")](/[+\/=]/g, function (I) {
                    return B[I];
                  });
                }
                function E() {
                  var H = [
                    "vqJcNKCb",
                    "D8oDW54",
                    "W41HW4ldJXu",
                    "o8ovuJbn",
                    "a8o+lbpdUCkWuCk6W54",
                    "hCkdWRTfW4G",
                    "WQXoz8oCEmkZFJKVWPZcMmo7",
                    "w8ocAxe",
                    "FmkkW5/cL21c",
                    "W6PAW67dTJ0Yj8oRWQ3dHW",
                    "W4GyW77cOqa",
                    "W7pcOCkMWQZcKW",
                    "kmoFW6xcTvnMeHq",
                    "WR5fqmk4ja",
                    "W4JcMmkpWQOR",
                    "W7FcMGe",
                    "WRRdHmotWRRcLvddTcG",
                    "W6LmWPVdKCoB",
                    "WQrUq8ksW4O",
                    "qSouqNX6",
                    "W7BcTmk/WO0",
                    "WOdcJmkJWQyj",
                    "v8k0W6VdLSoY",
                    "aSodvtbEW4dcKCk9",
                    "WPb8A8ksW4K",
                    "WQ7dK8oBW77cTxZdSrJdGCoz",
                    "W4GlWRSvW6O",
                    "W6ZcJqJcThm",
                    "WPRdT8k5jmky",
                    "WQTrW4m",
                    "dMeAW7flW4K",
                    "pCk8WQ5RW6JdH8kZWPm",
                    "ySoHsev6",
                    "W4FcIbBcLNFdONRdQmolW7y",
                    "W7VdRCoeWOpcUxhdQG",
                    "hCkJWQrTW7S",
                    "x8o0WQJdLe8",
                    "WP7cK8oDgLldKrOb",
                    "xCkHW68uW48",
                    "jGzyWPFdG1NcPSkLEG",
                    "WRNcJSkxWOe",
                    "hCkpWQzzW5i",
                    "WOVdOSkRbSkm",
                    "WQvqrmk4W6ZcLSowW5C4cq",
                    "WRFcTmoXa8k+",
                    "t8k9W7NdJSoR",
                    "oSo0pJ/dLq",
                    "vf9rW5ng",
                    "W5RdGXCKW5i",
                    "BXRcRMaH",
                    "hmodBYO",
                    "WQddVCoeWOTm",
                    "FCotsv5t",
                    "xK/cN8kEWQq",
                    "rCoTx0Pw",
                    "xwVcNCkJWObB",
                    "W4maW5tcNJi",
                    "W7FdRSkVvmkuW6ZcGcpdPCkT",
                    "WODkW6tcP8kl",
                    "EmoMW44QW7tdN8k1WPNcTCkj",
                    "WPqbWRBdH8oH",
                    "dSkQWRv3W65vWPjIWRtdJa",
                    "dCoZemkRWOO",
                    "WRDhWOSYhq",
                    "FSowW5yzmq",
                    "omojv8kFBfuaiSoWrmk7WPy",
                    "WPBcMsG",
                    "rmoVW583WRqjWPTpW4ddTtG",
                    "WQhdGmoyWRO",
                    "rmkeW7in",
                    "s1Ccrvi",
                    "WRldSCo4W5XXW6n0i8kzWRqeb8kX",
                    "AWTvW40lwmkDW5G",
                    "BMW/",
                    "WPddKSoOWRb+",
                    "fSkXWPS",
                    "WRJdQmoNsSkP",
                    "W6VdSXWVW6a",
                    "W7pdKSk1",
                    "uSoBWRW",
                    "lSoFoWldMG",
                    "WQVdH8os",
                    "W6ZcNIm7W7q",
                    "W4ZcS8oziLJdLG4",
                    "rSojW5eVlq",
                    "W5ldTZ3dSwK",
                    "W6FcLWJcQK0",
                    "qWFcPwKe",
                    "W7yChCkJlq",
                    "CHNcPSk6W6hdSZ3dVq",
                    "AmkbW7hdPCoR",
                    "iSkKWR5pW5u",
                    "WPn8ACkQeG",
                    "WRRcSSosmxy",
                    "WRLgW5lcOmkEECoRW6ddJW",
                    "iSoCxZzn",
                    "W4DOW4pdHXnV",
                    "DmkoWRtdMCk8",
                    "WRBdTSoDW7RcQ8oegNCbW5y",
                    "WQD8DCks",
                    "W7NdI8ou",
                    "WOhdQmoNWOT+",
                    "W5BdSse3W5C",
                    "nCouWO7cUmkXlu4SW5RdNcLhgG",
                    "z8kvamojkqK",
                    "WQJcVCo2b8kVW7C",
                    "WQPlACoEbSoZCs0cWRm",
                    "WRnDs8kkca",
                    "n1bEW7yw",
                    "WO3dKSkleG",
                    "WQn/W7BcKCkR",
                    "W5JcJrtcJa",
                    "W67dTruPW5O",
                    "WOFdKmoT",
                    "xWiM",
                    "aZ/dHSo3W4CaWPBdTdW2tgRcVa",
                    "W47cTmkPWOdcGW",
                    "W5T/W4ldLaHZc8oDW6u",
                    "uMhcNCkNWPvh",
                    "dSkAWPngW70",
                    "eCk/WQLWW4W",
                    "vtBcVxymWOldM3alWOK",
                    "WQW9WOJdG8o0",
                    "FCoCuSkzvbtdV8onW6vGWQBdS8ob",
                    "wx3cUCkRWOe",
                    "mCk2WO1yW6y",
                    "W7uWoCkIdW",
                    "vmkdW4JdKSoc",
                    "Fmo8W64Fl8k2",
                    "qCkfW7aTW7C",
                    "eSo9iZtdRa",
                    "rCoyAgiL",
                    "WO7dUCk3mmkW",
                    "W5VcIaVcJxa",
                    "WRvnr8k5W5VcI8oBW5WE",
                    "WPldK8krpCk7EGa",
                    "qSkoW7ueW4Gc",
                    "WOrRW6JcUSkD",
                    "oCkMWO53",
                    "p1TqW6Gwu8kmW60MWQS",
                    "gSo1jHhdQ8kX",
                    "W43dUbZdQLW",
                    "W6/cQCkpWOdcLG",
                    "WQbhuCkkcq",
                    "nCkzlmoBfa",
                    "x8o4W5iSkW",
                    "WRRdPmoaWP9J",
                    "jmkZWO50W60",
                    "WQBdM2q0tG",
                    "W6XeW4pdUqa",
                    "WQfrsmkEba",
                    "rCkCW4KZW7q",
                    "WR3dN8osWOvk",
                    "WR7dNmohWOLw",
                    "W7ubhmo7WP7dJCodW5CHeGi1",
                    "zmknWRpdMCk4WO8",
                    "W4yvWQaqW74",
                    "W6CXqCksfq",
                    "W5L8W67dRGW",
                    "EmoPWOZdPuC",
                    "WQ3cICo3bmkS",
                    "o8kkWOPuW6S",
                    "rCklW4pcU0G",
                    "sCoDyq",
                    "btbSWPZdSG",
                    "WRhcTSoRcmkYW7NcUG",
                    "WQxcNSkkWO47lW",
                    "xSoyWRC",
                    "sSolCv5ZWPG",
                    "bKuUW65j",
                    "emkpWQS",
                    "WPhdHCoHWOHa",
                    "CbxcMuy",
                    "vJdcU3KJ",
                    "B2H6W5i",
                    "W4ziW4pdQq4",
                    "g8k6WPW",
                    "cgpcICk5W5RdGHBdTSoIW7e",
                    "W4JcLSkSWQpcIa",
                    "kCoYWOq",
                    "W6GuWRetW7NcUGO9",
                    "W5ypWRqLW40",
                    "WOFdS8ojxCkx",
                    "WRFcRCo6e8kVW63cPXVdHq",
                    "dCodemkdWQ8",
                    "W7n2WPVdR8ol",
                    "WPhdGSkwhwlcNW",
                    "eguAW7jqW4W",
                    "W5WIBCkieq",
                    "CCkrW4NdQq",
                    "vfRcGCk8WR0",
                    "DCk7WQRdSCkO",
                    "W67dSqKvW4i",
                    "W5tcJ8kbWP0H",
                    "wmokyv8",
                    "WOxcICo2gCk4",
                    "BmoBaW",
                    "eCojkYZdLG",
                    "W4W9W7FcStddSW",
                    "lCk8WOroW78",
                    "f8ogAGDb",
                    "W6RcK8kbWQKN",
                    "kCoFf8kE",
                    "W7SHW4/cVXu",
                    "n8oscZldMSkFEmkxW7pcRG",
                    "W6j+W5JdSre",
                    "WPSHWPJcUmkW",
                    "WQ9DBSkUW4a",
                    "WOL+WOa9mG",
                    "pSoqW6NcISk+WOHXW63cOSow",
                    "W6WoWPep",
                    "DSobDG",
                    "iNZcGmkhW78",
                    "WOHhW4dcKCkh",
                    "W68pWPaoW6xcTa",
                    "eH5BWRldLq",
                    "s8o1DNrx",
                    "W6CgySk5aSkL",
                    "W4HqWQhdGSooW4u",
                    "wuZcMG",
                    "W5vfWQZdICos",
                    "wSoXE2u",
                    "WPhdM8oXWR96WQpcLW",
                    "WOZdGSo/WRvN",
                    "i8oiDa99",
                    "sCouW6ymha",
                    "WRJdL8kMe8kQ",
                    "W7Gtymk3aG",
                    "bSozDsW",
                    "WP1xr8kGW4RcMSogWPi4dW",
                    "W43dOrC6W5O",
                    "w8kmW50UW70",
                    "W4dcSJeGW4C",
                    "BmkOW7Xbj8oQW4PWec4",
                    "CSooWQxdT3S",
                    "W5lcQ8kAWQBcKq",
                    "xComq1HaWOuIW48",
                    "W50imCk6pG",
                    "W4tdSaBdJ2q+",
                    "WPLAW6K",
                    "mKdcO8kJW50",
                    "zCkfa8omobm",
                    "e8k2WPHmW4G",
                    "WRtdKKGcxGS",
                    "ASkEW7qZW4S",
                    "pCo7pmk6WOe",
                    "jSoFemkvWPNdVq",
                    "gCk1WODaW48",
                    "WRjCW7xcICkK",
                    "WRzzv8k5W4RcSmoCW4y",
                    "WPL4WOhcMSkIrmoHW6BdH8kH",
                    "WR3cLmk3WP09lHf6",
                    "wCowy0q",
                    "AKS4vKDj",
                    "WQNdISopWQRcKw0",
                    "WQvDtmkM",
                    "x8o3WOddUM0",
                    "W64EWPilW6RcSae",
                    "xmo4sLKiig/dMmkQWRO",
                    "W4ZcMrpcHq",
                    "A8kgW68VW44",
                    "WQFdRCoNWPXA",
                    "F8k1pCoSlG",
                    "W6ZdLSokySkjWORdGa",
                    "ESkgW6JcTNO",
                    "W7CNe8k7gq",
                    "W7msn8ke",
                    "EcRcHhqC",
                    "WR3cOSkOuCoPWQZdUKdcLmoE",
                    "vmkSW7dcMu4",
                    "iCkyWQPrW5W",
                    "W7uymmknpCoO",
                    "W7fDWRVdJmoU",
                    "rwhcOmkWWOzAW4ddOG",
                    "oSkkiCoNjG",
                    "WO7dN8oX",
                    "msD3WPtdMG",
                    "W5O8W6RcUJJdOre",
                    "n8kciSoWkq",
                    "WQlcMCo3",
                    "W5akgCkLdW",
                    "bv/dUW",
                    "W4BcKJqZW4K",
                    "WQ5EW5VcKCkz",
                    "WPddI8oJWQbVWRlcM8kkW78",
                    "WPhcNSosd2xdLG",
                    "bSoLoX4",
                    "nCowW67cG8oPWP9WWPtcTCofra",
                    "r8kzmNWCW6xcU8kXW5ZcTJu",
                    "uMBcKSk2WRDCW4RdObqX",
                    "W685uSk/l8orWOFcHG",
                    "sCoBWPRdHxa",
                    "WOddN8oTWR8",
                    "WO9CW4lcP8kq",
                    "W6yeDSklnW",
                    "zmkaW6lcHgTdkJq",
                    "dmkvamoela",
                    "WRtcRCoRca",
                    "jSkGWRPVW4K",
                    "WO1xWQWspG",
                    "WOddLSoGWQfyWQ/cLSkb",
                    "W6BcJr9qd0BdKLFdRbRdHau",
                    "E8kkr8odW53cRmkPW6SoW7GUW7e",
                    "lSo9FWn+",
                    "W73cUrazW7i",
                    "WQhdImomsCkRWQBdPsZdJW",
                    "WPWmW6tcIG",
                    "W7pcR8k/WO0TWRe5",
                    "cHhdTG",
                    "W6NdSrCWW4q",
                    "WOxdJSkrpSkOBry",
                    "W4X+WPJdQ8o8",
                    "WRFdICogx8k5W68",
                    "WOpcTCo5nSk5",
                    "W48VW4pdT8kZWQdcPK/dHs4",
                    "W5/cR8k6WQdcKW",
                    "W7mlhmo8WP7dISoZW7atfIuD",
                    "WRb1W4JcPCk7",
                    "FM/cOCkqWOq",
                    "W5bAWPZdKCoiW4r1oG",
                    "W7NdLaSjW4q",
                    "qWNcGvq7",
                    "kuHvW7mls8koW68S",
                    "he0i",
                    "m0GsW6Xf",
                    "W4aJWPNdHCogW5xcKq",
                    "W7ddPWhdVwi",
                    "lSkvbSoseW",
                    "FmolzevM",
                    "WOpcUSkcWQai",
                    "W4Svpmkqia",
                    "DmksWRhdK8kT",
                    "fCo/jHxdVSkT",
                  ];
                  return (E = function () {
                    return H;
                  })();
                }
                var F =
                    ("undefined" == typeof window ? "undefined" : q(window)) !== A(0x631, "lqr!") &&
                    window[C(-0xbd, "LPAx")]
                      ? window[A(0x5d9, "ea1u")]
                      : parseInt,
                  G = {
                    base64: function (H) {
                      var I = {
                          ztKqs: function (T, U) {
                            return T * U;
                          },
                          xJnZI: function (T, U) {
                            return T(U);
                          },
                          PCVxE: function (T, U) {
                            return T / U;
                          },
                          JAfIG: function (T, U) {
                            return T < U;
                          },
                          OUBlM: function (T, U) {
                            return T + U;
                          },
                          UdrKQ: function (T, U) {
                            return T + U;
                          },
                          DuoPw: function (T, U) {
                            return T >>> U;
                          },
                          kwCPO: function (T, U) {
                            return T & U;
                          },
                          xObLJ: function (T, U) {
                            return T | U;
                          },
                          MyTta: function (T, U) {
                            return T << U;
                          },
                          JtVBF: function (T, U) {
                            return T & U;
                          },
                          kwRPH: function (T, U) {
                            return T | U;
                          },
                          UhtiT: function (T, U) {
                            return T & U;
                          },
                          CxgnK: function (T, U) {
                            return T - U;
                          },
                          kTJWV: function (T, U) {
                            return T === U;
                          },
                          aSDpj: function (T, U) {
                            return T + U;
                          },
                          ugFMA: function (T, U) {
                            return T + U;
                          },
                          nZMQP: function (T, U) {
                            return T >>> U;
                          },
                          QLfzz: function (T, U) {
                            return T(U);
                          },
                        },
                        J = void 0x0,
                        K = void 0x0,
                        L = void 0x0,
                        M = "";
                      function N(T, U) {
                        return A(U - -0x45a, T);
                      }
                      var O = H[P(0x356, "ehxd")];
                      function P(T, U) {
                        return C(T - 0x4ca, U);
                      }
                      for (
                        var Q = 0x0,
                          R = I[N("5m^J", 0x116)](
                            I[P(0x3bb, "wReF")](F, I[N("QQD8", 0x12a)](O, 0x3)),
                            0x3,
                          );
                        I[P(0x3f9, "ehxd")](Q, R);
                      )
                        ((J = H[Q++]),
                          (K = H[Q++]),
                          (L = H[Q++]),
                          (M += I[P(0x362, "7s0V")](
                            I[N("Wfi4", 0x1b6)](
                              I[N("FYnO", 0x128)](
                                x[I[P(0x3a4, "qa*a")](J, 0x2)],
                                x[
                                  I[N("IUs7", 0x22e)](
                                    I[P(0x430, "8Oiv")](
                                      I[N("eoa[", 0x219)](J, 0x4),
                                      I[P(0x459, "iSBn")](K, 0x4),
                                    ),
                                    0x3f,
                                  )
                                ],
                              ),
                              x[
                                I[N("icaT", 0x13b)](
                                  I[P(0x347, "qa*a")](
                                    I[N("bmAe", 0x1d6)](K, 0x2),
                                    I[N("iSBn", 0x22f)](L, 0x6),
                                  ),
                                  0x3f,
                                )
                              ],
                            ),
                            x[I[N("wReF", 0x1d3)](L, 0x3f)],
                          )));
                      var S = I[P(0x3d8, "5m^J")](O, R);
                      return (
                        I[N("K)F[", 0x1fc)](S, 0x1)
                          ? ((J = H[Q]),
                            (M += I[P(0x390, "bmAe")](
                              I[P(0x3f0, "!&EH")](
                                x[I[N("d2&5", 0x173)](J, 0x2)],
                                x[I[N("7s0V", 0x171)](I[N("v6]c", 0x20d)](J, 0x4), 0x3f)],
                              ),
                              "==",
                            )))
                          : I[P(0x427, "b!D8")](S, 0x2) &&
                            ((J = H[Q++]),
                            (K = H[Q]),
                            (M += I[N("lxO1", 0x15a)](
                              I[P(0x397, "qa*a")](
                                I[N("5m^J", 0x198)](
                                  x[I[N("1F4e", 0x1ee)](J, 0x2)],
                                  x[
                                    I[P(0x3f8, ")goq")](
                                      I[P(0x410, ")goq")](
                                        I[N("qy3r", 0x1e4)](J, 0x4),
                                        I[N("d2&5", 0x18f)](K, 0x4),
                                      ),
                                      0x3f,
                                    )
                                  ],
                                ),
                                x[I[P(0x3c0, "qy3r")](I[N("qy3r", 0x1e4)](K, 0x2), 0x3f)],
                              ),
                              "=",
                            ))),
                        I[P(0x3f4, "Wbwc")](D, M)
                      );
                    },
                    charCode: function (H) {
                      var I = {};
                      function J(R, S) {
                        return C(S - 0x4a5, R);
                      }
                      ((I[J("(X98", 0x407)] = function (R, S) {
                        return R < S;
                      }),
                        (I[P(0x59d, "Wfi4")] = function (R, S) {
                          return R >= S;
                        }),
                        (I[J("8Oiv", 0x31d)] = function (R, S) {
                          return R <= S;
                        }),
                        (I[P(0x608, ")FA3")] = function (R, S) {
                          return R | S;
                        }),
                        (I[J("eyzX", 0x34a)] = function (R, S) {
                          return R & S;
                        }),
                        (I[J("icaT", 0x3f2)] = function (R, S) {
                          return R >> S;
                        }),
                        (I[J("ehxd", 0x3ed)] = function (R, S) {
                          return R & S;
                        }),
                        (I[P(0x4fa, "IUs7")] = function (R, S) {
                          return R <= S;
                        }),
                        (I[P(0x597, "QQD8")] = function (R, S) {
                          return R >= S;
                        }),
                        (I[P(0x510, "Pi4q")] = function (R, S) {
                          return R | S;
                        }),
                        (I[P(0x506, "HmRp")] = function (R, S) {
                          return R < S;
                        }),
                        (I[J("5m^J", 0x3a1)] = function (R, S) {
                          return R & S;
                        }));
                      for (
                        var K = I, L = [], M = 0x0, N = 0x0;
                        K[J(")goq", 0x3f8)](N, H[J("&QZ4", 0x364)]);
                        N += 0x1
                      ) {
                        var O = H[P(0x5a4, "iU!(")](N);
                        K[P(0x610, "k([F")](O, 0x0) && K[J(")goq", 0x363)](O, 0x7f)
                          ? (L[J("iSBn", 0x43b)](O), (M += 0x1))
                          : K[P(0x635, "pKX5")](0x80, 0x50) && K[P(0x5e2, "ea1u")](O, 0x7ff)
                            ? ((M += 0x2),
                              L[J("l3WP", 0x3b4)](
                                K[J("2)u3", 0x414)](
                                  0xc0,
                                  K[J("IUs7", 0x32c)](0x1f, K[J("bmAe", 0x437)](O, 0x6)),
                                ),
                              ),
                              L[P(0x545, "HmRp")](
                                K[J("#FdB", 0x354)](0x80, K[P(0x59b, "d2&5")](0x3f, O)),
                              ))
                            : ((K[J("b!D8", 0x30f)](O, 0x800) && K[P(0x62d, "@b)w")](O, 0xd7ff)) ||
                                (K[J("iSBn", 0x443)](O, 0xe000) &&
                                  K[P(0x518, "5**I")](O, 0xffff))) &&
                              ((M += 0x3),
                              L[P(0x50d, "IUs7")](
                                K[J("&QZ4", 0x328)](
                                  0xe0,
                                  K[P(0x4f7, "7s0V")](0xf, K[P(0x5f3, "IUs7")](O, 0xc)),
                                ),
                              ),
                              L[P(0x567, "bmAe")](
                                K[J("K)F[", 0x37d)](
                                  0x80,
                                  K[J("8Oiv", 0x336)](0x3f, K[J(")goq", 0x40c)](O, 0x6)),
                                ),
                              ),
                              L[P(0x5f8, "ehxd")](
                                K[P(0x51b, "8Oiv")](0x80, K[J("7s0V", 0x2ff)](0x3f, O)),
                              ));
                      }
                      function P(R, S) {
                        return A(R - -0x5d, S);
                      }
                      for (var Q = 0x0; K[P(0x5a9, "&QZ4")](Q, L[J("iU!(", 0x40f)]); Q += 0x1)
                        L[Q] &= 0xff;
                      return K[P(0x60e, "hAY8")](M, 0xff)
                        ? [0x0, M][J("lqr!", 0x3d7)](L)
                        : [K[J("8Oiv", 0x36a)](M, 0x8), K[J("v6]c", 0x383)](M, 0xff)][
                            P(0x51e, "eyzX")
                          ](L);
                    },
                    es: function (H) {
                      function I(N, O) {
                        return C(O - 0x259, N);
                      }
                      function J(N, O) {
                        return C(O - 0x51b, N);
                      }
                      H || (H = "");
                      var K = H[I("pKX5", 0x15b)](0x0, 0xff),
                        L = [],
                        M = G[I("pKX5", 0x16b)](K)[I("l3WP", 0x1b8)](0x2);
                      return (L[I("(X98", 0xed)](M[J("FYnO", 0x456)]), L[J("b$p#", 0x3f4)](M));
                    },
                    en: function (H) {
                      var I = {
                        qfBUq: function (T, U) {
                          return T(U);
                        },
                        dAZxv: function (T, U) {
                          return T > U;
                        },
                        Awjkr: function (T, U) {
                          return T !== U;
                        },
                        iQodw: function (T, U) {
                          return T % U;
                        },
                        osGpS: function (T, U) {
                          return T / U;
                        },
                        WAaVg: function (T, U) {
                          return T < U;
                        },
                        zAXuB: function (T, U) {
                          return T * U;
                        },
                        ajlCm: function (T, U) {
                          return T + U;
                        },
                        rqCNk: function (T, U, V) {
                          return T(U, V);
                        },
                      };
                      H || (H = 0x0);
                      var J = I[S("b$p#", -0x165)](F, H),
                        K = [];
                      I[N("Wbwc", -0x220)](J, 0x0)
                        ? K[S("1F4e", -0x18a)](0x0)
                        : K[S("icaT", -0x127)](0x1);
                      for (
                        var L = Math[S("v6]c", -0x8f)](J)
                            [N(")goq", -0x1dd)](0x2)
                            [N("1F4e", -0x244)](""),
                          M = 0x0;
                        I[N("S$EH", -0x1df)](I[N("l3WP", -0x229)](L[S("eoa[", -0xfc)], 0x8), 0x0);
                        M += 0x1
                      )
                        L[N("#FdB", -0x196)]("0");
                      function N(T, U) {
                        return C(U - -0xaf, T);
                      }
                      L = L[S("bmAe", -0x7a)]("");
                      for (
                        var O = Math[S("ea1u", -0xfa)](
                            I[N("IUs7", -0x19f)](L[S("@b)w", -0xdc)], 0x8),
                          ),
                          P = 0x0;
                        I[N("&QZ4", -0x20d)](P, O);
                        P += 0x1
                      ) {
                        var Q = L[N("ea1u", -0x243)](
                          I[N("!&EH", -0x116)](P, 0x8),
                          I[N("b!D8", -0x160)](I[N("bmAe", -0x201)](P, 0x1), 0x8),
                        );
                        K[S(")goq", -0xfd)](I[N("5**I", -0x22b)](F, Q, 0x2));
                      }
                      var R = K[S("qy3r", -0x11f)];
                      function S(T, U) {
                        return A(U - -0x6d9, T);
                      }
                      return (K[N("l3WP", -0x224)](R), K);
                    },
                    sc: function (H) {
                      var I = {};
                      ((I[K("qa*a", 0x3d5)] = function (M, N) {
                        return M > N;
                      }),
                        H || (H = ""));
                      var J = I[K("K)F[", 0x44b)](H[L(0x231, "hAY8")], 0xff)
                        ? H[L(0x1f2, "l3WP")](0x0, 0xff)
                        : H;
                      function K(M, N) {
                        return C(N - 0x56e, M);
                      }
                      function L(M, N) {
                        return A(M - -0x3a5, N);
                      }
                      return G[K("@b)w", 0x4c6)](J)[L(0x2d2, "pKX5")](0x2);
                    },
                    nc: function (H) {
                      var I = {
                        DSfOA: function (Q, R) {
                          return Q(R);
                        },
                        lQiuF: function (Q, R) {
                          return Q / R;
                        },
                        wABHl: function (Q, R, S, T) {
                          return Q(R, S, T);
                        },
                        hKWNF: function (Q, R) {
                          return Q * R;
                        },
                        TPFZR: function (Q, R) {
                          return Q < R;
                        },
                        gYcZI: function (Q, R) {
                          return Q * R;
                        },
                        BApWW: function (Q, R) {
                          return Q + R;
                        },
                        jiYFc: function (Q, R, S) {
                          return Q(R, S);
                        },
                      };
                      H || (H = 0x0);
                      var J = Math[L(0x48d, "LPAx")](I[L(0x3f4, "pKX5")](F, H))[L(0x3a3, "icaT")](
                          0x2,
                        ),
                        K = Math[L(0x3ee, "ea1u")](I[L(0x47b, "tCmq")](J[N(0x41c, "iU!(")], 0x8));
                      function L(Q, R) {
                        return C(Q - 0x509, R);
                      }
                      J = I[L(0x3e4, "hAY8")](v, J, I[N(0x3cf, "qy3r")](K, 0x8), "0");
                      var M = [];
                      function N(Q, R) {
                        return A(Q - -0x248, R);
                      }
                      for (var O = 0x0; I[L(0x441, "IUs7")](O, K); O += 0x1) {
                        var P = J[L(0x49a, "v6]c")](
                          I[L(0x3fd, "IUs7")](O, 0x8),
                          I[L(0x3b4, "lqr!")](I[L(0x3af, "!&EH")](O, 0x1), 0x8),
                        );
                        M[L(0x40d, "lqr!")](I[N(0x3a0, "FYnO")](F, P, 0x2));
                      }
                      return M;
                    },
                    va: function (H) {
                      var I = {
                        ozDNt: function (Q, R) {
                          return Q(R);
                        },
                        qogTH: function (Q, R, S, T) {
                          return Q(R, S, T);
                        },
                        oAlZP: function (Q, R) {
                          return Q * R;
                        },
                        XQyGR: function (Q, R) {
                          return Q / R;
                        },
                        oaCId: function (Q, R) {
                          return Q >= R;
                        },
                        tESBs: function (Q, R) {
                          return Q - R;
                        },
                        LdvIJ: function (Q, R) {
                          return Q === R;
                        },
                        tbHcV: function (Q, R) {
                          return Q & R;
                        },
                        OooNI: function (Q, R) {
                          return Q + R;
                        },
                        BtpBm: function (Q, R) {
                          return Q + R;
                        },
                        RNMxe: function (Q, R) {
                          return Q >>> R;
                        },
                      };
                      H || (H = 0x0);
                      var J = Math[M(0x573, "S$EH")](I[M(0x555, "wReF")](F, H));
                      function K(Q, R) {
                        return C(Q - 0x114, R);
                      }
                      var L = J[M(0x53b, "bmAe")](0x2);
                      function M(Q, R) {
                        return A(Q - -0x109, R);
                      }
                      for (
                        var N = [],
                          O = (L = I[K(-0x16, "lxO1")](
                            v,
                            L,
                            I[M(0x559, "iU!(")](
                              Math[M(0x4a1, "hAY8")](I[K(0x29, "bmAe")](L[M(0x491, "(1SR")], 0x7)),
                              0x7,
                            ),
                            "0",
                          ))[M(0x4c5, "Pi4q")];
                        I[K(0x9f, "d2&5")](O, 0x0);
                        O -= 0x7
                      ) {
                        var P = L[K(0x3c, "(5h(")](I[M(0x4dd, "HyKD")](O, 0x7), O);
                        if (I[K(0x75, "lqr!")](I[K(0x52, "7s0V")](J, -0x80), 0x0)) {
                          N[K(-0x5a, "wReF")](I[K(0x9d, "1F4e")]("0", P));
                          break;
                        }
                        (N[K(-0x49, "FH!j")](I[K(-0x31, "v6]c")]("1", P)),
                          (J = I[M(0x498, "#FdB")](J, 0x7)));
                      }
                      return N[M(0x4ea, "pKX5")](function (Q) {
                        return F(Q, 0x2);
                      });
                    },
                    ek: function (H) {
                      var I =
                          arguments["length"] > 0x1 && void 0x0 !== arguments[0x1]
                            ? arguments[0x1]
                            : "",
                        J = {
                          doyQe: function (R, S) {
                            return R !== S;
                          },
                          ZnBwu: function (R, S) {
                            return R === S;
                          },
                          wNWpl: O("ea1u", 0xe8) + O(")goq", 0x157),
                          DCAiW: function (R, S) {
                            return R === S;
                          },
                          CgOGQ: O("icaT", 0xd9),
                          XriUr: Q("HyKD", 0x35a),
                          UgrSF: function (R, S) {
                            return R > S;
                          },
                          AQnyc: function (R, S) {
                            return R <= S;
                          },
                          EmtLr: function (R, S) {
                            return R + S;
                          },
                          GynqB: function (R, S, T, U) {
                            return R(S, T, U);
                          },
                          IsuQv: function (R, S) {
                            return R + S;
                          },
                          hoSrd: O("ehxd", 0x1b4),
                          TnsHv: function (R, S, T) {
                            return R(S, T);
                          },
                          zFxvQ: function (R, S) {
                            return R - S;
                          },
                          qpclh: function (R, S) {
                            return R > S;
                          },
                        };
                      if (!H) return [];
                      var K = [],
                        L = 0x0;
                      J[O("IUs7", 0xca)](I, "") &&
                        (J[O("icaT", 0x9f)](
                          Object[Q("5**I", 0x2de)][Q("iU!(", 0x37a)][Q("pKX5", 0x38d)](I),
                          J[Q("iSBn", 0x2f8)],
                        ) && (L = I[Q("5**I", 0x416)]),
                        J[O("Wfi4", 0x1a2)](
                          void 0x0 === I ? "undefined" : q(I),
                          J[Q("wReF", 0x40d)],
                        ) && (L = (K = G["sc"](I))[O("Wbwc", 0x16e)]),
                        J[Q("FYnO", 0x376)](
                          void 0x0 === I ? "undefined" : q(I),
                          J[Q("Pi4q", 0x3af)],
                        ) && (L = (K = G["nc"](I))[Q("lqr!", 0x2f5)]));
                      var M = Math[O("HmRp", 0xa6)](H)[Q("IUs7", 0x3d5)](0x2),
                        N = "";
                      function O(R, S) {
                        return C(S - 0x21d, R);
                      }
                      N =
                        J[O("FH!j", 0x82)](L, 0x0) && J[O("l3WP", 0xc6)](L, 0x7)
                          ? J[Q("qa*a", 0x36d)](
                              M,
                              J[Q("hAY8", 0x321)](v, L[Q("ehxd", 0x364)](0x2), 0x3, "0"),
                            )
                          : J[Q("5**I", 0x336)](M, J[Q("Wfi4", 0x351)]);
                      var P = [
                        J[Q("2)u3", 0x2e3)](
                          F,
                          N[O("eyzX", 0x1b1)](
                            Math[Q("S$EH", 0x310)](
                              J[Q("v6]c", 0x3a6)](N[O("HyKD", 0x1b8)], 0x8),
                              0x0,
                            ),
                          ),
                          0x2,
                        ),
                      ];
                      if (J[Q("qy3r", 0x345)](L, 0x7)) return P[Q(")FA3", 0x32f)](G["va"](L), K);
                      function Q(R, S) {
                        return C(S - 0x483, R);
                      }
                      return P[O("iU!(", 0x79)](K);
                    },
                    ecl: function (H) {
                      function I(O, P) {
                        return C(P - 0x2a9, O);
                      }
                      var J = {
                          XaGBp: function (O, P) {
                            return O < P;
                          },
                          YMftG: function (O, P, Q) {
                            return O(P, Q);
                          },
                          VANUe: function (O, P, Q) {
                            return O(P, Q);
                          },
                        },
                        K = [],
                        L = H[I("FYnO", 0x1b6)](0x2)[I("&QZ4", 0x172)]("");
                      function M(O, P) {
                        return A(P - -0x75, O);
                      }
                      for (var N = 0x0; J[I("b!D8", 0x171)](L[I("l3WP", 0x245)], 0x10); N += 0x1)
                        L[I(")FA3", 0x1a4)](0x0);
                      return (
                        (L = L[M("d2&5", 0x575)]("")),
                        K[M("(1SR", 0x625)](
                          J[I("k([F", 0x170)](F, L[I("v6]c", 0x23a)](0x0, 0x8), 0x2),
                          J[I("tCmq", 0x1ba)](F, L[M("QQD8", 0x5df)](0x8, 0x10), 0x2),
                        ),
                        K
                      );
                    },
                    pbc: function () {
                      var H =
                          arguments["length"] > 0x0 && void 0x0 !== arguments[0x0]
                            ? arguments[0x0]
                            : "",
                        I = {
                          aQnxO: function (O, P) {
                            return O(P);
                          },
                          NXXiw: function (O, P) {
                            return O < P;
                          },
                          axaxt: function (O, P) {
                            return O < P;
                          },
                          BElkO: function (O, P) {
                            return O - P;
                          },
                        };
                      function J(O, P) {
                        return C(O - -0x1, P);
                      }
                      var K = [],
                        L = G["nc"](I[J(-0x135, "!&EH")](w, H[M(-0x126, "b!D8")](/\s/g, "")));
                      function M(O, P) {
                        return A(O - -0x68d, P);
                      }
                      if (I[J(-0x192, "v6]c")](L[J(-0x193, "qa*a")], 0x4)) {
                        for (
                          var N = 0x0;
                          I[M(-0x66, "5m^J")](N, I[J(-0x1ab, "!&EH")](0x4, L[J(-0x10c, "d2&5")]));
                          N++
                        )
                          K[M(-0x4c, "#FdB")](0x0);
                      }
                      return K[M(-0xaf, "LPAx")](L);
                    },
                    gos: function (H, I) {
                      function J(O, P) {
                        return A(O - -0x2b0, P);
                      }
                      var K = {};
                      function L(O, P) {
                        return A(P - -0x71d, O);
                      }
                      ((K[L("wReF", -0x190)] = function (O, P) {
                        return O === P;
                      }),
                        (K[J(0x3d2, "Pi4q")] = L("1F4e", -0x13a)));
                      var M = K,
                        N = Object[J(0x3c1, "LPAx")](H)
                          [J(0x2e0, "K)F[")](function (O) {
                            function P(R, S) {
                              return J(S - -0x19, R);
                            }
                            function Q(R, S) {
                              return L(S, R - 0x5fd);
                            }
                            return M[Q(0x523, "FH!j")](O, M[P("S$EH", 0x33a)]) ||
                              M[Q(0x561, "k([F")](O, "c")
                              ? ""
                              : O + ":" + H[O][P("qy3r", 0x356)]() + ",";
                          })
                          [J(0x3c2, "qa*a")]("");
                      return L("M#pd", -0x105) + I + "={" + N + "}";
                    },
                    budget: function (H, I) {
                      function J(N, O) {
                        return C(O - 0x709, N);
                      }
                      var K = {};
                      function L(N, O) {
                        return C(O - -0x12, N);
                      }
                      ((K[L("K)F[", -0x199)] = function (N, O) {
                        return N === O;
                      }),
                        (K[L("v6]c", -0x111)] = function (N, O) {
                          return N >= O;
                        }),
                        (K[L("S$EH", -0xbb)] = function (N, O) {
                          return N + O;
                        }));
                      var M = K;
                      return M[J("d2&5", 0x639)](H, 0x40)
                        ? 0x40
                        : M[J("tCmq", 0x5bf)](H, 0x3f)
                          ? I
                          : M[J("lqr!", 0x571)](H, I)
                            ? M[L("d2&5", -0x1ae)](H, 0x1)
                            : H;
                    },
                    encode: function (H, I) {
                      var J = {
                          EAnrQ: function (Y, Z) {
                            return Y < Z;
                          },
                          sJtws:
                            O(-0x12a, "eyzX") +
                            O(-0xf9, "HmRp") +
                            O(-0x95, "LPAx") +
                            O(-0xa5, "5**I") +
                            L(0x219, "v6]c") +
                            O(-0x71, "K)F[") +
                            O(-0x11e, "HmRp"),
                          ieKdo: function (Y, Z) {
                            return Y < Z;
                          },
                          mmivi: function (Y, Z) {
                            return Y !== Z;
                          },
                          OaRTp: O(-0xca, "M#pd"),
                          hjaOS: function (Y, Z) {
                            return Y * Z;
                          },
                          GCemu: L(0x259, "2)u3") + L(0x208, "k([F") + "|2",
                          GmaVb: function (Y, Z) {
                            return Y >> Z;
                          },
                          NYCOo: function (Y, Z) {
                            return Y - Z;
                          },
                          eTrxI: function (Y, Z) {
                            return Y | Z;
                          },
                          XOstE: function (Y, Z) {
                            return Y << Z;
                          },
                          mEnIi: function (Y, Z) {
                            return Y & Z;
                          },
                          gJgsQ: function (Y, Z) {
                            return Y + Z;
                          },
                          KPCyN: function (Y, Z) {
                            return Y + Z;
                          },
                          vsnfG: function (Y, Z) {
                            return Y + Z;
                          },
                          XlToV: function (Y, Z) {
                            return Y + Z;
                          },
                          VDNXf: function (Y, Z) {
                            return Y | Z;
                          },
                          fnaNP: function (Y, Z) {
                            return Y << Z;
                          },
                          WCTJq: function (Y, Z) {
                            return Y & Z;
                          },
                          lNOfd: function (Y, Z) {
                            return Y - Z;
                          },
                          SUaqZ: function (Y, Z) {
                            return Y(Z);
                          },
                          Eortz: function (Y, Z) {
                            return Y(Z);
                          },
                          TsVmD: function (Y, Z) {
                            return Y !== Z;
                          },
                          vXNda: function (Y, Z, a0) {
                            return Y(Z, a0);
                          },
                          hsJou: function (Y, Z, a0) {
                            return Y(Z, a0);
                          },
                          iLFBA: function (Y, Z, a0) {
                            return Y(Z, a0);
                          },
                          Cikzn: function (Y, Z) {
                            return Y & Z;
                          },
                        },
                        K = {
                          _bÇ: (H = H),
                          _bK: 0x0,
                          _bf: function () {
                            function Y(Z, a0) {
                              return O(Z - 0x1f9, a0);
                            }
                            return H[Y(0x176, "ea1u")](K[Y(0x115, "@b)w")]++);
                          },
                        };
                      function L(Y, Z) {
                        return C(Y - 0x339, Z);
                      }
                      var M = {
                          _ê: [],
                          _bÌ: -0x1,
                          _á: function (Y) {
                            (M[L(0x1c9, "5m^J")]++, (M["_ê"][M[L(0x1e3, "S$EH")]] = Y));
                          },
                          _bÝ: function () {
                            function Y(Z, a0) {
                              return O(a0 - 0x65c, Z);
                            }
                            return (
                              _bÝ[Y("ea1u", 0x550)]--,
                              J[Y("!&EH", 0x596)](_bÝ[Y("lxO1", 0x5a4)], 0x0) &&
                                (_bÝ[O(-0x148, "lqr!")] = 0x0),
                              _bÝ["_ê"][_bÝ[Y("QQD8", 0x595)]]
                            );
                          },
                        },
                        N = "";
                      function O(Y, Z) {
                        return A(Y - -0x6db, Z);
                      }
                      for (
                        var P, Q, R, S, T = J[O(-0x88, "qa*a")], U = 0x0;
                        J[L(0x2c6, "FH!j")](U, T[O(-0x17b, "k([F")]);
                        U++
                      )
                        M["_á"](T[L(0x1c7, ")goq")](U));
                      M["_á"]("=");
                      var V = J[L(0x2d8, "(5h(")](
                        void 0x0 === I ? "undefined" : q(I),
                        J[L(0x1b0, "k([F")],
                      )
                        ? Math[O(-0xac, "5**I")](
                            J[O(-0x16d, "7s0V")](Math[L(0x1da, "Wbwc")](), 0x40),
                          )
                        : -0x1;
                      for (
                        U = 0x0;
                        J[L(0x1ee, "ea1u")](U, H[O(-0x46, "HyKD")]);
                        U = K[O(-0x18a, "8Oiv")]
                      )
                        for (var W = J[L(0x2b9, "!&EH")][O(-0x176, "1F4e")]("|"), X = 0x0; ; ) {
                          switch (W[X++]) {
                            case "0":
                              P = J[L(0x19c, "K)F[")](
                                M["_ê"][J[L(0x299, "FH!j")](M[O(-0x120, "eoa[")], 0x2)],
                                0x2,
                              );
                              continue;
                            case "1":
                              R = J[O(-0x13d, "iU!(")](
                                J[L(0x2bc, "lqr!")](
                                  J[O(-0x14c, "5**I")](
                                    M["_ê"][J[L(0x27a, "#FdB")](M[L(0x238, "(5h(")], 0x1)],
                                    0xf,
                                  ),
                                  0x2,
                                ),
                                J[O(-0x124, "QQD8")](M["_ê"][M[L(0x2ba, "!&EH")]], 0x6),
                              );
                              continue;
                            case "2":
                              N = J[O(-0xa4, ")FA3")](
                                J[L(0x1be, "S$EH")](
                                  J[O(-0x7e, "!&EH")](
                                    J[O(-0x183, "IUs7")](N, M["_ê"][P]),
                                    M["_ê"][Q],
                                  ),
                                  M["_ê"][R],
                                ),
                                M["_ê"][S],
                              );
                              continue;
                            case "3":
                              Q = J[O(-0x96, "ea1u")](
                                J[L(0x1b8, "8Oiv")](
                                  J[O(-0x142, "qy3r")](
                                    M["_ê"][J[O(-0x78, ")goq")](M[L(0x2ae, "ehxd")], 0x2)],
                                    0x3,
                                  ),
                                  0x4,
                                ),
                                J[O(-0xc2, "l3WP")](
                                  M["_ê"][J[L(0x2b8, "M#pd")](M[O(-0x65, "iU!(")], 0x1)],
                                  0x4,
                                ),
                              );
                              continue;
                            case "4":
                              J[L(0x1d5, "M#pd")](
                                isNaN,
                                M["_ê"][J[L(0x21f, "S$EH")](M[O(-0x148, "lqr!")], 0x1)],
                              )
                                ? (R = S = 0x40)
                                : J[L(0x244, "v6]c")](isNaN, M["_ê"][M[L(0x26d, "HmRp")]]) &&
                                  (S = 0x40);
                              continue;
                            case "5":
                              M[O(-0x189, "wReF")] -= 0x3;
                              continue;
                            case "6":
                              J[L(0x1ea, ")FA3")](
                                void 0x0 === I ? "undefined" : q(I),
                                J[L(0x25d, "iU!(")],
                              ) &&
                                ((P = J[L(0x1b5, "iSBn")](I, P, V)),
                                (Q = J[L(0x19b, "iU!(")](I, Q, V)),
                                (R = J[O(-0xa1, "iSBn")](I, R, V)),
                                (S = J[O(-0x40, "v6]c")](I, S, V)));
                              continue;
                            case "7":
                              M["_á"](K[L(0x27b, "1F4e")]());
                              continue;
                            case "8":
                              M["_á"](K[O(-0x128, ")goq")]());
                              continue;
                            case "9":
                              S = J[L(0x260, "wReF")](M["_ê"][M[O(-0xb8, "lxO1")]], 0x3f);
                              continue;
                            case "10":
                              M["_á"](K[L(0x2b7, "IUs7")]());
                              continue;
                          }
                          break;
                        }
                      return J[L(0x25a, "7s0V")](N[L(0x220, "icaT")](/=/g, ""), T[V] || "");
                    },
                  };
                m[C(-0xe4, "b!D8")] = G;
              })["call"](this, k(0x1)(i));
            },
            function (i, j, k) {
              "use strict";
              (function (a0) {
                var a1 =
                  "function" == typeof Symbol && "symbol" == typeof Symbol["iterator"]
                    ? function (aZ) {
                        return typeof aZ;
                      }
                    : function (aZ) {
                        return aZ &&
                          "function" == typeof Symbol &&
                          aZ["constructor"] === Symbol &&
                          aZ !== Symbol["prototype"]
                          ? "symbol"
                          : typeof aZ;
                      };
                function a2(aZ, b0, b1) {
                  return (
                    b0 in aZ
                      ? Object["defineProperty"](aZ, b0, {
                          value: b1,
                          enumerable: !0x0,
                          configurable: !0x0,
                          writable: !0x0,
                        })
                      : (aZ[b0] = b1),
                    aZ
                  );
                }
                !(function (aZ, b0) {
                  function b1(b4, b5) {
                    return aR(b5 - 0x6b, b4);
                  }
                  function b2(b4, b5) {
                    return aR(b5 - 0x387, b4);
                  }
                  for (var b3 = aV(); ; )
                    try {
                      if (
                        parseInt(b1("S@lO", 0x2f5)) / 0x1 +
                          (parseInt(b2("QovG", 0x67d)) / 0x2) *
                            (parseInt(b2("(meS", 0x482)) / 0x3) +
                          (-parseInt(b2("hIzm", 0x5ad)) / 0x4) *
                            (parseInt(b2("3(AN", 0x6e1)) / 0x5) +
                          (parseInt(b2("C6fO", 0x5a4)) / 0x6) *
                            (-parseInt(b2("$nFE", 0x5da)) / 0x7) +
                          (-parseInt(b2("Y]ar", 0x71b)) / 0x8) *
                            (-parseInt(b2("Pt@f", 0x49d)) / 0x9) +
                          parseInt(b1("3(AN", 0x302)) / 0xa +
                          (-parseInt(b2("N)xu", 0x517)) / 0xb) *
                            (parseInt(b2("AcT^", 0x504)) / 0xc) ===
                        0xd3886
                      )
                        break;
                      b3["push"](b3["shift"]());
                    } catch (b4) {
                      b3["push"](b3["shift"]());
                    }
                })();
                var a3 = k(0x5),
                  a4 = k(0x3),
                  a5 = k(0xe),
                  a6 = 0x0,
                  a7 = void 0x0,
                  a8 = void 0x0,
                  a9 = 0x0,
                  aa = [],
                  ab = function () {},
                  ac = void 0x0,
                  ad = void 0x0,
                  af = void 0x0,
                  ag = void 0x0,
                  ah = void 0x0,
                  ai = void 0x0,
                  aj =
                    ("undefined" == typeof h ? "undefined" : a1(h)) === aA("S@lO", -0x22d)
                      ? null
                      : h;
                if (("undefined" == typeof window ? "undefined" : a1(window)) !== aX(0x287, "griD"))
                  for (var ak = (aX(0x3b3, "q]CY") + "0")[aA("YYv%", -0x15c)]("|"), al = 0x0; ; ) {
                    switch (ak[al++]) {
                      case "0":
                        ai = aA("ChZ!", -0x15) + "rt" in ac[aA("q]CY", -0x11f)];
                        continue;
                      case "1":
                        ad = ac[aX(0x206, "AcT^")];
                        continue;
                      case "2":
                        ac = window;
                        continue;
                      case "3":
                        ag = ac[aX(0x381, "@xF@")];
                        continue;
                      case "4":
                        ah = ac[aX(0x342, "Imsz")];
                        continue;
                      case "5":
                        af = ac[aA("54^6", -0x1ac)];
                        continue;
                    }
                    break;
                  }
                var am = function () {
                  var aZ = {};
                  function b0(b4, b5) {
                    return aA(b5, b4 - 0x88);
                  }
                  function b1(b4, b5) {
                    return aX(b5 - -0x18d, b4);
                  }
                  ((aZ[b1("dE%z", 0x28c)] = function (b4, b5) {
                    return b4 !== b5;
                  }),
                    (aZ[b0(0x83, "Q2Sc")] = b0(-0x14a, "wAHi")),
                    (aZ[b1("l!WU", 0x134)] = function (b4, b5) {
                      return b4 < b5;
                    }),
                    (aZ[b0(-0x7b, "Imsz")] = b1(")8Bu", 0x12f)),
                    (aZ[b1("SYaz", 0xc7)] = function (b4, b5) {
                      return b4 !== b5;
                    }),
                    (aZ[b0(-0xa0, "N)xu")] = function (b4, b5) {
                      return b4 === b5;
                    }),
                    (aZ[b1("l!WU", -0x35)] = function (b4, b5) {
                      return b4 !== b5;
                    }),
                    (aZ[b1("jU*K", 0x1ca)] = b0(0x20, "hIzm")),
                    (aZ[b1("(f2U", 0xa3)] = function (b4, b5) {
                      return b4 !== b5;
                    }),
                    (aZ[b0(-0x11e, "36]w")] = function (b4, b5) {
                      return b4 === b5;
                    }),
                    (aZ[b1("PZV1", 0x1ba)] = function (b4, b5) {
                      return b4 === b5;
                    }),
                    (aZ[b0(0x5a, "Pt@f")] = b0(-0xb7, "]HJo")),
                    (aZ[b1("WWJ$", 0x1cf)] = function (b4, b5) {
                      return b4 === b5;
                    }),
                    (aZ[b0(-0x8, "AcT^")] = b0(0x51, "tt&(") + b1("ChZ!", 0xea)),
                    (aZ[b1("(meS", 0xb)] = function (b4, b5) {
                      return b4 === b5;
                    }),
                    (aZ[b1("Uj2C", 0x2)] = function (b4, b5) {
                      return b4 in b5;
                    }),
                    (aZ[b1("wAHi", 0xb0)] = b0(-0x148, "l1Y6")),
                    (aZ[b1("DKL#", 0x18c)] = function (b4, b5) {
                      return b4 > b5;
                    }),
                    (aZ[b1("(f2U", 0x143)] = b1("36]w", 0x1c7) + "r"),
                    (aZ[b1(")8Bu", 0x196)] = function (b4, b5) {
                      return b4 > b5;
                    }),
                    (aZ[b0(0x5, "Acl^")] = b1("l!WU", 0x1a9) + "e"));
                  var b2 = aZ,
                    b3 = [];
                  (b2[b1("QYdW", 0x5f)](a1(ac[b1("3(AN", 0xda) + "t"]), b2[b0(0xab, "QYdW")]) ||
                  b2[b1("7hxe", 0x1bd)](a1(ac[b1("Q2Sc", 0x87)]), b2[b1("8RnY", 0x286)])
                    ? (b3[0x0] = 0x1)
                    : (b3[0x0] =
                        b2[b0(-0xf8, "tt&(")](ac[b1("k&f(", 0xb5) + "t"], 0x1) ||
                        b2[b1("(8!5", 0x21b)](ac[b1("Q2Sc", 0x87)], 0x1)
                          ? 0x1
                          : 0x0),
                    (b3[0x1] =
                      b2[b1("jU*K", 0x257)](
                        a1(ac[b0(-0x3b, "(8!5") + "m"]),
                        b2[b1("Q2Sc", 0x276)],
                      ) || b2[b1("(8!5", -0x34)](a1(ac[b0(-0x14f, "Imsz")]), b2[b1("SlDP", 0x22b)])
                        ? 0x1
                        : 0x0),
                    (b3[0x2] = b2[b0(-0x1de, "3(AN")](
                      a1(ac[b1("U02M", 0xdd)]),
                      b2[b1("l!WU", 0x168)],
                    )
                      ? 0x0
                      : 0x1),
                    (b3[0x3] = b2[b1("griD", 0x94)](a1(ac[b1("PZV1", 0xe2)]), b2[b1("Imsz", 0x164)])
                      ? 0x0
                      : 0x1),
                    (b3[0x4] = b2[b1("(9D4", 0x104)](
                      a1(ac[b0(-0x18e, "DKL#")]),
                      b2[b0(-0xf6, "U02M")],
                    )
                      ? 0x0
                      : 0x1),
                    (b3[0x5] = b2[b1("Q2Sc", 0x28e)](ad[b0(-0x1a7, "54^6")], !0x0) ? 0x1 : 0x0),
                    (b3[0x6] =
                      b2[b0(-0x94, "wAHi")](
                        a1(ac[b1("hIzm", 0x29) + b0(-0x175, "wAHi")]),
                        b2[b1("wAHi", 0x188)],
                      ) &&
                      b2[b1("WWJ$", 0x17d)](
                        a1(ac[b1("SYaz", 0x16b) + b0(-0x68, "k&f(") + b0(0x7b, "PZV1")]),
                        b2[b0(0x74, "PZV1")],
                      )
                        ? 0x0
                        : 0x1));
                  try {
                    (b2[b1("WWJ$", 0x17d)](
                      a1(Function[b0(-0x17f, "(f2U")][b1("C6fO", 0x121)]),
                      b2[b0(-0x1dc, "l1Y6")],
                    ) && (b3[0x7] = 0x1),
                      b2[b1(")8Bu", 0x159)](
                        Function[b1("wAHi", 0x282)][b1("l1Y6", 0x71)]
                          [b0(-0x153, "36]w")]()
                          [b1("griD", 0xa9)](/bind/g, b2[b0(-0x45, "ChZ!")]),
                        Error[b0(-0x5c, "PZV1")](),
                      ) && (b3[0x7] = 0x1),
                      b2[b1("U02M", 0x1eb)](
                        Function[b1("1*rM", 0x237)][b1("YxiJ", 0x1af)]
                          [b1("YYv%", 0x225)]()
                          [b0(-0x10e, "Acl^")](/toString/g, b2[b0(-0x140, "Q2Sc")]),
                        Error[b0(-0x1a2, "Acl^")](),
                      ) && (b3[0x7] = 0x1));
                  } catch (b4) {
                    b3[0x7] = 0x0;
                  }
                  ((b3[0x8] =
                    ad[b0(-0x10a, "dE%z")] &&
                    b2[b0(-0x19f, "SlDP")](ad[b1("S@lO", -0x27)][b0(-0x1d1, "C6fO")], 0x0)
                      ? 0x1
                      : 0x0),
                    (b3[0x9] = b2[b0(-0x4d, "DKL#")](ad[b1("C6fO", 0x18e)], "") ? 0x1 : 0x0),
                    (b3[0xa] =
                      b2[b0(0x72, "7hxe")](ac[b0(-0x1c5, "Acl^")], b2[b0(-0x197, "(9D4")]) &&
                      b2[b0(-0x10, "WWJ$")](ac[b1("QovG", 0x265)], b2[b0(0x68, "SlDP")])
                        ? 0x1
                        : 0x0),
                    (b3[0xb] =
                      ac[b0(-0x1e6, "QYdW")] && !ac[b0(-0xb3, "S@lO")][b1("54^6", 0x20)]
                        ? 0x1
                        : 0x0),
                    (b3[0xc] = b2[b0(-0xae, "YYv%")](ac[b1("q]CY", 0x1d8)], void 0x0) ? 0x1 : 0x0),
                    (b3[0xd] = b2[b0(-0x32, "YYv%")](b2[b0(-0x1b2, "EGti")], ad) ? 0x1 : 0x0),
                    (b3[0xe] = ad[b1("1*rM", 0x24e) + b0(-0x4f, "%4m!")](b2[b1("AcT^", -0x10)])
                      ? 0x1
                      : 0x0),
                    (b3[0xf] =
                      ah[b1("(meS", 0x275)] &&
                      b2[b1("(9D4", 0x47)](
                        ah[b1("3(AN", 0x18f)]
                          [b1("U02M", 0x5d)]()
                          [b1("q]CY", 0x229)](b2[b0(-0xc7, "36]w")]),
                        -0x1,
                      )
                        ? 0x1
                        : 0x0));
                  try {
                    b3[0x10] = k(
                      !(function () {
                        var b5 = new Error("Cannot\x20find\x20module\x20\x27child_process\x27");
                        throw ((b5["code"] = "MODULE_NOT_FOUND"), b5);
                      })(),
                    )
                      ? 0x1
                      : 0x0;
                  } catch (b5) {
                    b3[0x10] = 0x0;
                  }
                  try {
                    b3[0x11] = b2[b0(-0x20f, "dE%z")](
                      ac[b0(-0x151, "(9D4")][b1("griD", 0x7b) + b0(0x52, "k&f(")]
                        [b1("ChZ!", 0x209)]()
                        [b1("54^6", 0x120)](b2[b0(-0xdf, "7hxe")]),
                      -0x1,
                    )
                      ? 0x0
                      : 0x1;
                  } catch (b6) {
                    b3[0x11] = 0x0;
                  }
                  return b3;
                };
                function an(aZ) {
                  var b0 = {
                      fvzIs: function (b7, b8) {
                        return b7(b8);
                      },
                      mblsy: b2("54^6", 0x4b2),
                    },
                    b1 = function (b7) {
                      var b8;
                      return (
                        a2(
                          (b8 = {}),
                          b4(0x342, "N)xu") + b7 + (b4(0x374, "Y]ar") + b4(0x41e, "Uj2C")),
                          !0x0,
                        ),
                        a2(
                          b8,
                          b2("WWJ$", 0x4fc) +
                            b2("QovG", 0x6ee) +
                            b7 +
                            (b4(0x37e, "U02M") + b2("Uj2C", 0x602)),
                          !0x0,
                        ),
                        a2(b8, b4(0x4ca, "(8!5") + b2(")8Bu", 0x6ea) + b4(0x432, "YxiJ"), !0x0),
                        a2(
                          b8,
                          b4(0x3ca, "@xF@") +
                            b7 +
                            (b4(0x55f, "YxiJ") + b2("36]w", 0x4b8) + b2("PZV1", 0x6ed)),
                          !0x0,
                        ),
                        a2(
                          b8,
                          b4(0x4db, "54^6") +
                            b4(0x362, "Uj2C") +
                            b7 +
                            (b4(0x3b7, "Pt@f") + b2("aDkK", 0x6a6) + b4(0x3f0, "N)xu")),
                          !0x0,
                        ),
                        a2(
                          b8,
                          b2("Pt@f", 0x53a) +
                            b2("tt&(", 0x62d) +
                            b2("jU*K", 0x5e0) +
                            b2("k&f(", 0x563),
                          !0x0,
                        ),
                        b8
                      );
                    };
                  function b2(b7, b8) {
                    return aA(b7, b8 - 0x74a);
                  }
                  var b3 = Function[b4(0x351, "SlDP")][b4(0x38b, "36]w")][b4(0x398, "U02M")](aZ);
                  function b4(b7, b8) {
                    return aA(b8, b7 - 0x566);
                  }
                  var b5 = Function[b2("SYaz", 0x4bf)][b4(0x2ce, "54^6")][b2("N)xu", 0x6d8)](
                      aZ[b4(0x389, "Uj2C")],
                    ),
                    b6 = aZ[b4(0x361, ")8Bu")][b2("l!WU", 0x64f)](/get\s/, "");
                  return (
                    (b0[b2("%4m!", 0x537)](b1, b6)[b3] &&
                      b0[b4(0x44f, "l1Y6")](b1, b0[b4(0x522, "hIzm")])[b5]) ||
                    !0x1
                  );
                }
                function ao(aZ, b0, b1) {
                  var b2 = {};
                  ((b2[b4(0xaa, "Pt@f")] = function (b9, ba) {
                    return b9 > ba;
                  }),
                    (b2[b7("]HJo", 0x491)] = function (b9, ba) {
                      return b9 < ba;
                    }),
                    (b2[b4(0x22e, "YxiJ")] = function (b9, ba) {
                      return b9 - ba;
                    }),
                    (b2[b4(0x1b8, "SYaz")] = function (b9, ba) {
                      return b9 - ba;
                    }),
                    (b2[b4(0x100, "jU*K")] = function (b9, ba) {
                      return b9 !== ba;
                    }),
                    (b2[b7("QYdW", 0x4ae)] = b4(0xb2, "Acl^")),
                    (b2[b4(0x1a0, "N)xu")] = function (b9, ba) {
                      return b9 > ba;
                    }),
                    (b2[b7("Q2Sc", 0x33b)] = function (b9, ba) {
                      return b9 > ba;
                    }));
                  var b3 = b2;
                  function b4(b9, ba) {
                    return aA(ba, b9 - 0x2f5);
                  }
                  var b5 = b0 || ac[b4(0xc2, "Imsz")];
                  if (b3[b7("YYv%", 0x2c0)](b5[b4(0x28b, "$nFE")], 0x0)) {
                    if (
                      aZ[b4(0xd3, "YYv%") + "mp"] &&
                      b3[b4(0x1ca, "U02M")](
                        b3[b7("griD", 0x550)](b5[b4(0xf7, "l1Y6")], aZ[b7("Y]ar", 0x2da) + "mp"]),
                        0xf,
                      )
                    )
                      return;
                    aZ[b7("griD", 0x36d) + "mp"] = b5[b7("YxiJ", 0x4c9)];
                  }
                  var b6 = {};
                  function b7(b9, ba) {
                    return aX(ba - 0x13b, b9);
                  }
                  ((b6[b7("ChZ!", 0x53f)] = b5[b4(0x8c, "griD")]["id"] || ""),
                    (b6[b7("C6fO", 0x397)] = b3[b7(")8Bu", 0x31d)](af[b4(0x138, "(9D4")](), a6)));
                  var b8 = b5[b7("griD", 0x364) + b4(0x16d, "dE%z")];
                  (b8 && b8[b7(")8Bu", 0x513)]
                    ? ((b6[b7("AcT^", 0x39b)] = b8[0x0][b7("1*rM", 0x336)]),
                      (b6[b7("%4m!", 0x4af)] = b8[0x0][b7("YxiJ", 0x33e)]))
                    : ((b6[b4(0x293, "aDkK")] = b5[b7("U02M", 0x448)]),
                      (b6[b7("Q2Sc", 0x549)] = b5[b7("wAHi", 0x3bd)])),
                    b3[b4(0x2f9, "EGti")](
                      void 0x0 === b1 ? "undefined" : a1(b1),
                      b3[b4(0x2aa, "griD")],
                    )
                      ? (aZ[b4(0x2c2, "Uj2C")][b1][b7("wAHi", 0x529)](b6),
                        b3[b7("Y]ar", 0x46d)](
                          aZ[b7("(8!5", 0x2ee)][b1][b7("l!WU", 0x2ad)],
                          aZ[b7("jU*K", 0x437)],
                        ) && aZ[b4(0x1d7, "1*rM")][b1][b7("C6fO", 0x405)]())
                      : (aZ[b7("WWJ$", 0x31e)][b7("1*rM", 0x375)](b6),
                        b3[b7("7hxe", 0x476)](
                          aZ[b4(0xa2, "7hxe")][b7("N)xu", 0x4f7)],
                          aZ[b7("%4m!", 0x47c)],
                        ) && aZ[b4(0x130, "SYaz")][b7("hIzm", 0x4e6)]()));
                }
                function ap(aZ) {
                  var b0 = {};
                  function b1(b5, b6) {
                    return aA(b6, b5 - 0x3af);
                  }
                  b0[b1(0x12a, "U02M")] = function (b5, b6) {
                    return b5 === b6;
                  };
                  var b2 = b0,
                    b3 = {};
                  function b4(b5, b6) {
                    return aA(b6, b5 - 0x426);
                  }
                  return (
                    (ac[b4(0x3e3, "k&f(")][b4(0x2d4, "PZV1")]
                      ? ac[b1(0x20b, "(meS")][b1(0x2d5, "hIzm")][b1(0x296, "Imsz")](";\x20")
                      : [])[b4(0x384, "k&f(")](function (b5) {
                      var b6 = b5[b9("YxiJ", -0x28d)]("="),
                        b7 = b6[ba("jU*K", 0x434)](0x1)[b9("griD", -0xf3)]("="),
                        b8 = b6[0x0][ba("ChZ!", 0x45f)](/(%[0-9A-Z]{2})+/g, decodeURIComponent);
                      function b9(bb, bc) {
                        return b1(bc - -0x3cf, bb);
                      }
                      function ba(bb, bc) {
                        return b4(bc - 0x9c, bb);
                      }
                      return (
                        (b7 = b7[ba("aDkK", 0x3e2)](/(%[0-9A-Z]{2})+/g, decodeURIComponent)),
                        (b3[b8] = b7),
                        b2[ba("3(AN", 0x276)](aZ, b8)
                      );
                    }),
                    aZ ? b3[aZ] || "" : b3
                  );
                }
                function aq(aZ) {
                  function b0(b3, b4) {
                    return aX(b4 - 0x1e0, b3);
                  }
                  if (!aZ || !aZ[b1("q]CY", -0x183)]) return [];
                  function b1(b3, b4) {
                    return aX(b4 - -0x3da, b3);
                  }
                  var b2 = [];
                  return (
                    aZ[b0("C6fO", 0x5d3)](function (b3) {
                      function b4(b7, b8) {
                        return b1(b8, b7 - 0x67e);
                      }
                      function b5(b7, b8) {
                        return b0(b8, b7 - -0x234);
                      }
                      var b6 = a4["sc"](b3[b5(0x254, "1[03")]);
                      b2 = b2[b4(0x555, "Pt@f")](
                        a4["va"](b3[b4(0x4b5, "Uj2C")]),
                        a4["va"](b3[b4(0x60c, "Uj2C")]),
                        a4["va"](b3[b4(0x4f5, "k&f(")]),
                        a4["va"](b6[b5(0x319, "Acl^")]),
                        b6,
                      );
                    }),
                    b2
                  );
                }
                var ar = {
                    data: [],
                    maxLength: 0x1,
                    init: function () {
                      var aZ = {};
                      function b0(b5, b6) {
                        return aX(b5 - 0x207, b6);
                      }
                      ((aZ[b3("8RnY", -0x4c)] = b3("griD", 0x1f6) + b3("(meS", 0x1c8)),
                        (aZ[b3("1[03", -0x18)] = b0(0x431, "Uj2C") + b3("DKL#", 0x103)),
                        (aZ[b0(0x4ca, "hIzm")] = b3("F[!2", 0x1da) + b0(0x600, "tt&(")),
                        (aZ[b3("S@lO", 0xcd)] = function (b5, b6) {
                          return b5 + b6;
                        }));
                      var b1 = aZ,
                        b2 = a4[b3("dE%z", 0x3c)](this, b1[b0(0x3c4, "AcT^")]);
                      function b3(b5, b6) {
                        return aX(b6 - -0x200, b5);
                      }
                      var b4 = a4[b0(0x530, "l!WU")](
                        as,
                        ai ? b1[b0(0x3cf, "YYv%")] : b1[b0(0x35e, "Uj2C")],
                      );
                      this["c"] = a4[b3("YYv%", 0x90)](b1[b0(0x421, "QovG")](b2, b4));
                    },
                    handleEvent: function (aZ) {
                      ({
                        vIhoK: function (b0, b1, b2) {
                          return b0(b1, b2);
                        },
                      })[aA("l!WU", -0x12d)](ao, this, aZ);
                    },
                    packN: function () {
                      var aZ = {
                        uzOqT: function (b3, b4) {
                          return b3 === b4;
                        },
                        pDSzS: function (b3, b4) {
                          return b3(b4);
                        },
                      };
                      if (aZ[b1("(8!5", 0x54d)](this[b1("jU*K", 0x373)][b1("N)xu", 0x53b)], 0x0))
                        return [];
                      var b0 = [][b1("S@lO", 0x316)](
                        a4["ek"](0x4, this[b1("Y]ar", 0x33a)]),
                        aZ[b2(0x74a, "]HJo")](aq, this[b1("QYdW", 0x459)]),
                      );
                      function b1(b3, b4) {
                        return aX(b4 - 0x17f, b3);
                      }
                      function b2(b3, b4) {
                        return aA(b4, b3 - 0x755);
                      }
                      return b0[b2(0x50f, "N)xu")](this["c"]);
                    },
                  },
                  as = {
                    data: [],
                    maxLength: 0x1,
                    handleEvent: function (aZ) {
                      (a9++,
                        {
                          KvmCh: function (b0, b1, b2) {
                            return b0(b1, b2);
                          },
                        }[aX(0x353, "Imsz")](ao, this, aZ));
                    },
                    packN: function () {
                      var aZ = {
                        lsbtf: function (b2, b3) {
                          return b2 === b3;
                        },
                        BtfTk: function (b2, b3) {
                          return b2(b3);
                        },
                      };
                      function b0(b2, b3) {
                        return aA(b3, b2 - 0x610);
                      }
                      function b1(b2, b3) {
                        return aX(b3 - 0x1e9, b2);
                      }
                      return aZ[b0(0x3f6, "q]CY")](this[b1("dE%z", 0x5d5)][b1("]HJo", 0x5fb)], 0x0)
                        ? []
                        : [][b1("ChZ!", 0x5a9)](
                            a4["ek"](ai ? 0x1 : 0x2, this[b0(0x58a, "l1Y6")]),
                            aZ[b0(0x553, "3(AN")](aq, this[b1("@xF@", 0x37d)]),
                          );
                    },
                  },
                  at = {
                    data: [],
                    maxLength: 0x1e,
                    handleEvent: function (aZ) {
                      function b0(b2, b3) {
                        return aX(b3 - -0x100, b2);
                      }
                      var b1 = {
                        WJglf: function (b2, b3, b4, b5) {
                          return b2(b3, b4, b5);
                        },
                        Zssyc: function (b2, b3, b4) {
                          return b2(b3, b4);
                        },
                      };
                      ai
                        ? (!this[b0("YxiJ", 0xfc)][a9] && (this[aX(0x334, "Acl^")][a9] = []),
                          b1[b0("@xF@", 0x149)](ao, this, aZ, a9))
                        : b1[b0("l!WU", 0x216)](ao, this, aZ);
                    },
                    packN: function () {
                      function aZ(b7, b8) {
                        return aA(b7, b8 - 0x61e);
                      }
                      var b0 = {
                          XHUBd: function (b7, b8) {
                            return b7(b8);
                          },
                          GaTmm: function (b7, b8) {
                            return b7 - b8;
                          },
                          pBLVb: function (b7, b8) {
                            return b7 >= b8;
                          },
                          tKBtH: function (b7, b8) {
                            return b7 > b8;
                          },
                          isYjN: function (b7, b8) {
                            return b7 >= b8;
                          },
                          XeHnc: function (b7, b8) {
                            return b7 === b8;
                          },
                          JJTky: function (b7, b8) {
                            return b7(b8);
                          },
                        },
                        b1 = [];
                      if (ai) {
                        b1 = this[aZ("griD", 0x63a)][b6(0x483, "WWJ$")](function (b7) {
                          return b7 && b7[b6(0x6c6, ")8Bu")] > 0x0;
                        });
                        for (
                          var b2 = 0x0, b3 = b0[b6(0x559, "DKL#")](b1[b6(0x480, "EGti")], 0x1);
                          b0[aZ("54^6", 0x4c7)](b3, 0x0);
                          b3--
                        ) {
                          b2 += b1[b3][aZ("$nFE", 0x640)];
                          var b4 = b0[b6(0x56f, "U02M")](b2, this[aZ("jU*K", 0x526)]);
                          if (
                            (b0[b6(0x547, "Q2Sc")](b4, 0x0) &&
                              (b1[b3] = b1[b3][b6(0x553, ")8Bu")](b4)),
                            b0[b6(0x597, "AcT^")](b4, 0x0))
                          ) {
                            b1 = b1[aZ("3(AN", 0x575)](b3);
                            break;
                          }
                        }
                      } else b1 = this[b6(0x5d6, "k&f(")];
                      if (b0[b6(0x4f9, "WWJ$")](b1[aZ("jU*K", 0x538)], 0x0)) return [];
                      var b5 = [][aZ("1[03", 0x3ea)](a4["ek"](ai ? 0x18 : 0x19, b1));
                      function b6(b7, b8) {
                        return aX(b7 - 0x2ee, b8);
                      }
                      return (
                        ai
                          ? b1[aZ("1*rM", 0x48b)](function (b7) {
                              function b8(b9, ba) {
                                return b6(ba - -0x118, b9);
                              }
                              b5 = (b5 = b5[b8("N)xu", 0x384)](a4["va"](b7[aZ("36]w", 0x541)])))[
                                b8("griD", 0x5ee)
                              ](b0[b8("l!WU", 0x415)](aq, b7));
                            })
                          : (b5 = b5[b6(0x62b, "3(AN")](
                              b0[aZ("@xF@", 0x548)](aq, this[b6(0x5f9, "8RnY")]),
                            )),
                        b5
                      );
                    },
                  },
                  au = {
                    data: [],
                    maxLength: 0x3,
                    handleEvent: function () {
                      var aZ = {};
                      function b0(b5, b6) {
                        return aX(b5 - 0x16a, b6);
                      }
                      ((aZ[b0(0x510, "q]CY")] = function (b5, b6) {
                        return b5 > b6;
                      }),
                        (aZ[b4("Uj2C", 0x12c)] = function (b5, b6) {
                          return b5 - b6;
                        }),
                        (aZ[b4("]HJo", 0x14d)] = function (b5, b6) {
                          return b5 > b6;
                        }));
                      var b1 = aZ,
                        b2 = {},
                        b3 =
                          ac[b4("SlDP", 0x18b)][b0(0x504, "dE%z") + b0(0x54d, "YxiJ")][
                            b4("WWJ$", 0xfa)
                          ] || ac[b0(0x546, "Uj2C")][b4("U02M", -0x32)][b0(0x2fb, "QYdW")];
                      function b4(b5, b6) {
                        return aA(b5, b6 - 0x255);
                      }
                      b1[b0(0x53d, "8RnY")](b3, 0x0) &&
                        ((b2[b0(0x3dd, "QovG")] = b3),
                        (b2[b4("Acl^", 0x110)] = b1[b0(0x3dc, "54^6")](
                          af[b0(0x345, ")8Bu")](),
                          a6,
                        )),
                        this[b4("8RnY", 0x16c)][b0(0x4a9, "@xF@")](b2),
                        b1[b4("U02M", 0x74)](
                          this[b4("S@lO", 0x141)][b0(0x499, "@xF@")],
                          this[b4("AcT^", 0x132)],
                        ) && this[b4("(f2U", 0x1ec)][b4("]HJo", 0x1da)]());
                    },
                    packN: function () {
                      function aZ(b2, b3) {
                        return aA(b2, b3 - 0x554);
                      }
                      if (
                        (ai && this[aZ("YYv%", 0x352) + "t"](),
                        !this[aZ("YYv%", 0x336)][aZ("jU*K", 0x46e)])
                      )
                        return [];
                      var b0 = [][b1(0xcd, ")8Bu")](a4["ek"](0x3, this[b1(-0x32, "1[03")]));
                      function b1(b2, b3) {
                        return aX(b2 - -0x2a3, b3);
                      }
                      return (
                        this[b1(-0x12a, "l!WU")][b1(0x1c, "QovG")](function (b2) {
                          function b3(b4, b5) {
                            return aZ(b5, b4 - -0x554);
                          }
                          b0 = b0[aZ("3(AN", 0x49d)](
                            a4["va"](b2[b3(-0x2a1, "wAHi")]),
                            a4["va"](b2[b3(0x26, "aDkK")]),
                          );
                        }),
                        b0
                      );
                    },
                  },
                  av = {
                    init: function () {
                      var aZ = {};
                      aZ[b2("(8!5", 0x566)] = b1("dE%z", 0x4b) + "fo";
                      var b0 = aZ;
                      function b1(b3, b4) {
                        return aA(b3, b4 - 0x5a);
                      }
                      function b2(b3, b4) {
                        return aA(b3, b4 - 0x5dd);
                      }
                      ((this[b1("l!WU", -0x221)] = {}),
                        (this[b2("Q2Sc", 0x3de)][b1("EGti", -0x23f)] =
                          ac[b1("griD", -0x4b)][b2("Pt@f", 0x54a)]),
                        (this[b1("QYdW", -0xc0)][b1("EGti", 0x2d)] =
                          ac[b1("@xF@", -0x220)][b2("1[03", 0x5f3)]),
                        (this["c"] = a4[b1("(8!5", -0x230)](
                          a4[b1("EGti", -0xd4)](this, b0[b2("Imsz", 0x376)]),
                        )));
                    },
                    packN: function () {
                      var aZ = {};
                      function b0(bb, bc) {
                        return aA(bc, bb - 0x156);
                      }
                      ((aZ[b0(0x46, "C6fO")] = function (bb, bc) {
                        return bb && bc;
                      }),
                        (aZ[b9("griD", 0x1b5)] = function (bb, bc) {
                          return bb > bc;
                        }),
                        (aZ[b9("EGti", 0x1a3)] = function (bb, bc) {
                          return bb === bc;
                        }));
                      var b1 = aZ,
                        b2 = a4["ek"](0x7),
                        b3 = this[b9("l1Y6", 0x19a)],
                        b4 = b3["href"],
                        b5 = void 0x0 === b4 ? "" : b4,
                        b6 = b3["port"],
                        b7 = void 0x0 === b6 ? "" : b6;
                      if (b1[b9("l!WU", 0x11b)](!b5, !b7))
                        return [][b0(-0xd0, "8RnY")](b2, this["c"]);
                      var b8 = b1[b9("YxiJ", 0x6d)](b5[b0(-0xfb, "3(AN")], 0x80)
                        ? b5[b0(0x153, "C6fO")](0x0, 0x80)
                        : b5;
                      function b9(bb, bc) {
                        return aX(bc - -0x1d4, bb);
                      }
                      var ba = a4["sc"](b8);
                      return [][b0(-0x18, "k&f(")](
                        b2,
                        a4["va"](ba[b9("DKL#", 0x12c)]),
                        ba,
                        a4["va"](b7[b0(0x13a, ")8Bu")]),
                        b1[b9("Acl^", 0x223)](b7[b0(0x11e, "N)xu")], 0x0)
                          ? []
                          : a4["sc"](this[b0(-0x6f, "SYaz")][b0(-0x102, "YxiJ")]),
                        this["c"],
                      );
                    },
                  },
                  aw = {
                    init: function () {
                      function aZ(b1, b2) {
                        return aA(b1, b2 - 0x16);
                      }
                      function b0(b1, b2) {
                        return aA(b1, b2 - 0x723);
                      }
                      ((this[aZ("U02M", 0x23)] = {}),
                        (this[b0("QYdW", 0x609)][aZ("54^6", -0x15a)] =
                          ac[aZ("1*rM", -0x1bf)][aZ("EGti", -0x279)]),
                        (this[b0("F[!2", 0x5be)][b0("54^6", 0x53d) + "t"] =
                          ac[aZ("Uj2C", -0x215)][aZ("8RnY", -0x164) + "t"]));
                    },
                    packN: function () {
                      function aZ(b0, b1) {
                        return aA(b0, b1 - 0x1c2);
                      }
                      return [][aZ("Uj2C", 0x153)](
                        a4["ek"](0x8),
                        a4["va"](this[aZ("l1Y6", 0x13c)][aZ("SYaz", 0x6)]),
                        a4["va"](this[aX(0x333, "N)xu")][aZ("SlDP", -0x70) + "t"]),
                      );
                    },
                  },
                  ax = {
                    init: function () {
                      var aZ = {};
                      function b0(b3, b4) {
                        return aX(b4 - -0x423, b3);
                      }
                      function b1(b3, b4) {
                        return aA(b3, b4 - 0x18e);
                      }
                      ((aZ[b1("3(AN", 0x84)] = function (b3, b4) {
                        return b3 + b4;
                      }),
                        (aZ[b0("(8!5", -0x13c)] = function (b3, b4) {
                          return b3 * b4;
                        }),
                        (aZ[b1("Y]ar", 0xdf)] = function (b3, b4) {
                          return b3 + b4;
                        }));
                      var b2 = aZ;
                      this[b0("U02M", -0x22)] =
                        b2[b1("F[!2", 0x105)](
                          ac[b1("]HJo", 0x83)](
                            b2[b0("54^6", -0xce)](
                              ag[b0("Acl^", -0x271)](),
                              b2[b1("k&f(", -0x4e)](ag[b1("tt&(", -0xe5)](0x2, 0x34), 0x1)[
                                b1("1*rM", -0xc9)
                              ](),
                            ),
                            0xa,
                          ),
                          ac[b1("N)xu", 0x0)](
                            b2[b1("jU*K", 0x15f)](
                              ag[b0("Y]ar", -0x11e)](),
                              b2[b0("Q2Sc", -0x16f)](ag[b1("ChZ!", -0xc4)](0x2, 0x1e), 0x1)[
                                b0("3(AN", -0x56)
                              ](),
                            ),
                            0xa,
                          ),
                        ) +
                        "-" +
                        a7;
                    },
                    packN: function () {
                      function aZ(b0, b1) {
                        return aX(b1 - 0x205, b0);
                      }
                      return (
                        this[aZ("QYdW", 0x4fb)](),
                        [][aZ("8RnY", 0x3d3)](a4["ek"](0x9, this[aA("(8!5", -0x241)]))
                      );
                    },
                  },
                  ay = {
                    data: [],
                    init: function () {
                      function aZ(b0, b1) {
                        return aA(b0, b1 - 0x66c);
                      }
                      this[aZ("N)xu", 0x5ab)] = {
                        PqHow: function (b0) {
                          return b0();
                        },
                      }[aZ("YYv%", 0x637)](am);
                    },
                    packN: function () {
                      var aZ = {
                        crWSj: b0(0x307, "Acl^") + b1(0x572, "tt&(") + b1(0x42c, "@xF@") + "ay",
                        mCtYb:
                          b1(0x439, "$nFE") +
                          b0(0x249, "Imsz") +
                          b1(0x3cd, "S@lO") +
                          b1(0x661, ")8Bu"),
                        PwKCs:
                          b0(0x258, "(8!5") +
                          b1(0x55c, "(8!5") +
                          b0(0x30b, "wAHi") +
                          b1(0x666, "]HJo"),
                        Xrlbt: function (b4, b5) {
                          return b4(b5);
                        },
                        aONGn: function (b4, b5) {
                          return b4 < b5;
                        },
                        IHMQg: function (b4, b5) {
                          return b4 << b5;
                        },
                      };
                      try {
                        this[b1(0x549, "k&f(")][0x12] = Object[b1(0x58f, "AcT^")](
                          ac[b0(0x305, "C6fO")],
                        )[b0(0x164, "l!WU")](function (b4) {
                          return (
                            ac[b1(0x405, "PZV1")][b4] &&
                            ac[b1(0x470, "]HJo")][b4][b0(0x124, "WWJ$")]
                          );
                        })
                          ? 0x1
                          : 0x0;
                      } catch (b4) {
                        this[b1(0x622, "Uj2C")][0x12] = 0x0;
                      }
                      function b0(b5, b6) {
                        return aX(b5 - -0xca, b6);
                      }
                      function b1(b5, b6) {
                        return aA(b6, b5 - 0x655);
                      }
                      try {
                        this[b0(0x132, "YxiJ")][0x13] = [
                          aZ[b0(0x22a, "hIzm")],
                          aZ[b1(0x3cf, "Uj2C")],
                          aZ[b0(0x308, "Imsz")],
                        ][b0(0x199, "YYv%")](function (b5) {
                          return !!ac[b5];
                        })
                          ? 0x1
                          : 0x0;
                      } catch (b5) {
                        this[b0(0xeb, "(meS")][0x13] = 0x0;
                      }
                      if (Element[b1(0x558, "]HJo")][b1(0x64c, "36]w") + "ow"])
                        try {
                          this[b1(0x656, "]HJo")][0x14] = aZ[b1(0x616, "N)xu")](
                            an,
                            Element[b0(0x25e, "hIzm")][b1(0x5c8, "YYv%") + "ow"],
                          )
                            ? 0x0
                            : 0x1;
                        } catch (b6) {
                          this[b1(0x58d, "DKL#")][0x14] = 0x1;
                        }
                      else this[b0(0x2b0, "%4m!")][0x14] = 0x0;
                      for (
                        var b2 = 0x0, b3 = 0x0;
                        aZ[b0(0x1d6, "36]w")](b3, this[b0(0x21e, "k&f(")][b0(0x102, "ChZ!")]);
                        b3++
                      )
                        b2 += aZ[b1(0x535, "%4m!")](this[b0(0x32b, "]HJo")][b3], b3);
                      return [][b1(0x4e7, "k&f(")](a4["ek"](0xa), a4["va"](b2));
                    },
                  },
                  az = {
                    init: function () {
                      function aZ(b0, b1) {
                        return aA(b0, b1 - -0x3a);
                      }
                      this[aZ("Imsz", -0xeb)] = a4[aZ("1*rM", -0x22)](
                        ac[aZ("AcT^", -0x257)][aX(0x209, ")8Bu")]
                          ? ac[aZ("hIzm", -0x2d0)][aZ("Pt@f", -0xcd)]
                          : "",
                      );
                    },
                    packN: function () {
                      function aZ(b1, b2) {
                        return aA(b1, b2 - 0x28e);
                      }
                      if (!this[b0(0x46e, "SlDP")][aZ("]HJo", 0x145)]()[b0(0x412, "Pt@f")])
                        return [];
                      function b0(b1, b2) {
                        return aA(b2, b1 - 0x5d9);
                      }
                      return [][b0(0x44d, "(f2U")](a4["ek"](0xb), this[aZ("54^6", 0xed)]);
                    },
                  };
                function aA(aZ, b0) {
                  return aR(b0 - -0x38c, aZ);
                }
                var aB = {
                    init: function () {
                      function aZ(b0, b1) {
                        return aX(b1 - 0x321, b0);
                      }
                      this[aZ("PZV1", 0x57e)] = ac[aZ("Acl^", 0x501) + aZ("QovG", 0x6b6) + "nt"]
                        ? "y"
                        : "n";
                    },
                    packN: function () {
                      function aZ(b0, b1) {
                        return aX(b0 - -0x41e, b1);
                      }
                      return [][aZ(-0x3c, "U02M")](a4["ek"](0xc, this[aZ(-0x27d, "7hxe")]));
                    },
                  },
                  aC = {
                    init: function () {
                      function aZ(b0, b1) {
                        return aX(b0 - -0x449, b1);
                      }
                      this[aZ(-0x1ec, "PZV1")] = ac[aZ(-0xee, "(9D4") + aA("1*rM", -0x15a)]
                        ? "y"
                        : "n";
                    },
                    packN: function () {
                      function aZ(b0, b1) {
                        return aX(b1 - 0x31e, b0);
                      }
                      return [][aZ("k&f(", 0x5a4)](a4["ek"](0xd, this[aZ("(f2U", 0x6a9)]));
                    },
                  },
                  aD = {
                    init: function () {
                      function aZ(b2, b3) {
                        return aX(b2 - 0x2ec, b3);
                      }
                      var b0 = {};
                      b0[aZ(0x4bf, "54^6")] = function (b2, b3) {
                        return b2 - b3;
                      };
                      var b1 = b0;
                      this[aA("aDkK", -0x51)] = b1[aZ(0x4e6, "%4m!")](af[aZ(0x550, "QYdW")](), a8);
                    },
                    packN: function () {
                      function aZ(b0, b1) {
                        return aX(b1 - 0x36e, b0);
                      }
                      return (
                        this[aZ("tt&(", 0x650)](),
                        [][aZ("aDkK", 0x54b)](a4["ek"](0xe, this[aA("hIzm", -0x23c)]))
                      );
                    },
                  },
                  aE = {
                    init: function () {
                      this[aX(0x302, "Pt@f")] = ad[aX(0x40d, "(f2U")];
                    },
                    packN: function () {
                      function aZ(b1, b2) {
                        return aA(b1, b2 - 0x5bb);
                      }
                      if (!this[aZ("1[03", 0x438)][b0("36]w", 0x573)]) return [];
                      function b0(b1, b2) {
                        return aX(b2 - 0x25c, b1);
                      }
                      return [][b0("(f2U", 0x4c4)](a4["ek"](0xf, this[aZ("wAHi", 0x332)]));
                    },
                  },
                  aF = {
                    init: function () {
                      function aZ(b0, b1) {
                        return aA(b0, b1 - 0x29d);
                      }
                      this[aZ("36]w", 0x280)] = {
                        LmvHQ: function (b0) {
                          return b0();
                        },
                      }[aZ("3(AN", 0x1e)](a5);
                    },
                    packN: function () {
                      var aZ = this,
                        b0 = {};
                      ((b0[b2(-0x6a, "(meS")] = b5("aDkK", 0x4cf) + b2(0x21c, "WWJ$")),
                        (b0[b5("dE%z", 0x5f6)] = b5("U02M", 0x48a) + b2(-0x5f, "]HJo")));
                      var b1 = b0;
                      function b2(b6, b7) {
                        return aX(b6 - -0x1de, b7);
                      }
                      var b3 = [],
                        b4 = {};
                      function b5(b6, b7) {
                        return aX(b7 - 0x24c, b6);
                      }
                      return (
                        (b4[b1[b5("N)xu", 0x435)]] = 0x10),
                        (b4[b1[b5("l1Y6", 0x490)]] = 0x11),
                        Object[b2(0x68, "S@lO")](this[b5("1[03", 0x4bd)])[b2(0xea, "Uj2C")](
                          function (b6) {
                            function b7(b9, ba) {
                              return b2(b9 - 0x325, ba);
                            }
                            var b8 = [][b7(0x2da, "(meS")](
                              aZ[b7(0x452, "8RnY")][b6]
                                ? a4["ek"](b4[b6], aZ[b5("1[03", 0x4bd)][b6])
                                : [],
                            );
                            b3[b7(0x513, "1[03")](b8);
                          },
                        ),
                        b3
                      );
                    },
                  },
                  aG = {
                    init: function () {
                      var aZ = {};
                      function b0(b5, b6) {
                        return aX(b6 - -0x3c1, b5);
                      }
                      aZ[b2("54^6", 0x49b)] = function (b5, b6) {
                        return b5 > b6;
                      };
                      var b1 = aZ;
                      function b2(b5, b6) {
                        return aX(b6 - 0x33a, b5);
                      }
                      var b3 = ac[b0("QYdW", -0x261)][b0("1*rM", -0x250)] || "",
                        b4 = b3[b0("hIzm", -0x190)]("?");
                      this[b2("YxiJ", 0x536)] = b3[b0("jU*K", -0x5b)](
                        0x0,
                        b1[b2("ChZ!", 0x649)](b4, -0x1) ? b4 : b3[b2("l1Y6", 0x586)],
                      );
                    },
                    packN: function () {
                      if (!this[aZ("l!WU", -0x140)][aZ("Uj2C", 0xeb)]) return [];
                      function aZ(b0, b1) {
                        return aX(b1 - -0x2b9, b0);
                      }
                      return [][aZ("DKL#", 0xee)](a4["ek"](0x12, this[aX(0x3a3, "aDkK")]));
                    },
                  },
                  aH = {
                    init: function () {
                      var aZ = {
                        bExfy: function (b2, b3) {
                          return b2(b3);
                        },
                        uGOfA: b0("Uj2C", 0x334) + "d",
                      };
                      function b0(b2, b3) {
                        return aA(b2, b3 - 0x3db);
                      }
                      function b1(b2, b3) {
                        return aA(b2, b3 - 0x301);
                      }
                      this[b1("(9D4", 0x2e3)] = aZ[b1("S@lO", 0x270)](ap, aZ[b0("SlDP", 0x193)]);
                    },
                    packN: function () {
                      if (!this[aZ(0x693, "DKL#")][aZ(0x692, "7hxe")]) return [];
                      function aZ(b1, b2) {
                        return aA(b2, b1 - 0x75b);
                      }
                      function b0(b1, b2) {
                        return aX(b1 - -0x23f, b2);
                      }
                      return [][b0(0xa0, "F[!2")](a4["ek"](0x13, this[b0(-0x9e, "7hxe")]));
                    },
                  },
                  aI = {
                    init: function () {
                      var aZ = {
                        QrEON: function (b1, b2) {
                          return b1(b2);
                        },
                        RnUlE: b0("1*rM", -0xd9),
                      };
                      function b0(b1, b2) {
                        return aX(b2 - -0x349, b1);
                      }
                      this[b0("Y]ar", -0x18e)] = aZ[b0("l!WU", -0x10)](ap, aZ[b0("Pt@f", 0x10)]);
                    },
                    packN: function () {
                      if (!this[aZ(0x615, "DKL#")][aX(0x1cc, "ChZ!")]) return [];
                      function aZ(b0, b1) {
                        return aX(b0 - 0x2e9, b1);
                      }
                      return [][aZ(0x4da, "1*rM")](a4["ek"](0x14, this[aZ(0x6d5, "dE%z")]));
                    },
                  },
                  aJ = {
                    data: 0x0,
                    packN: function () {
                      return [][aA("(f2U", -0x18c)](a4["ek"](0x15, this[aX(0x1b5, "(meS")]));
                    },
                  },
                  aK = {
                    init: function (aZ) {
                      this[aA("U02M", 0xd)] = aZ;
                    },
                    packN: function () {
                      return [][aX(0x33e, "SlDP")](a4["ek"](0x16, this[aX(0x343, "Imsz")]));
                    },
                  },
                  aL = {
                    init: function () {
                      function aZ(b2, b3) {
                        return aX(b2 - 0x347, b3);
                      }
                      var b0 = {
                        GmmJd: function (b2, b3) {
                          return b2(b3);
                        },
                        ztZTD: b1(0x48c, "(meS"),
                      };
                      function b1(b2, b3) {
                        return aA(b3, b2 - 0x526);
                      }
                      this[b1(0x4f3, "Uj2C")] = b0[aZ(0x4c3, "%4m!")](ap, b0[aZ(0x601, "1[03")]);
                    },
                    packN: function () {
                      if (!this[aZ(-0xea, ")8Bu")][aZ(-0xbf, "EGti")]) return [];
                      function aZ(b1, b2) {
                        return aA(b2, b1 - 0x1a3);
                      }
                      function b0(b1, b2) {
                        return aX(b1 - -0x260, b2);
                      }
                      return [][b0(-0xa0, "1[03")](a4["ek"](0x17, this[b0(-0x3, "PZV1")]));
                    },
                  },
                  aM = {
                    init: function () {
                      var aZ = {};
                      function b0(b6, b7) {
                        return aX(b7 - -0x203, b6);
                      }
                      function b1(b6, b7) {
                        return aX(b6 - 0x5f, b7);
                      }
                      ((aZ[b0("1*rM", 0x9b)] = function (b6, b7) {
                        return b6 > b7;
                      }),
                        (aZ[b1(0x23b, "3(AN")] = b0("YYv%", 0x19e)),
                        (aZ[b1(0x3df, "EGti")] = function (b6, b7) {
                          return b6 !== b7;
                        }),
                        (aZ[b1(0x331, "QYdW")] = b0("7hxe", 0x1b1)),
                        (aZ[b1(0x41a, ")8Bu")] = function (b6, b7) {
                          return b6 === b7;
                        }),
                        (aZ[b1(0x1c3, "tt&(")] =
                          b0("Pt@f", 0xb3) +
                          b1(0x238, "36]w") +
                          b0("8RnY", 0x1da) +
                          b1(0x2cc, "(f2U")),
                        (aZ[b1(0x225, "l1Y6")] = function (b6, b7) {
                          return b6 < b7;
                        }),
                        (aZ[b0("DKL#", 0x141)] = function (b6, b7) {
                          return b6 << b7;
                        }));
                      for (
                        var b2 = aZ,
                          b3 = [
                            ac[b1(0x1b5, "PZV1")] ||
                            ac[b1(0x3bf, "l!WU")] ||
                            (ad[b0("Q2Sc", 0x7)] &&
                              b2[b1(0x45e, "SYaz")](
                                ad[b1(0x3ee, "(8!5")][b1(0x2a2, "SlDP")](b2[b1(0x1d6, "S@lO")]),
                                -0x1,
                              ))
                              ? 0x1
                              : 0x0,
                            b2[b1(0x260, "(9D4")](
                              "undefined" == typeof InstallTrigger
                                ? "undefined"
                                : a1(InstallTrigger),
                              b2[b1(0x2b1, ")8Bu")],
                            )
                              ? 0x1
                              : 0x0,
                            /constructor/i[b1(0x1d5, "aDkK")](ac[b0("QovG", 0x1ac) + "t"]) ||
                            b2[b0("EGti", 0x20e)](
                              ((ac[b1(0x1b4, "1[03")] &&
                                ac[b0("8RnY", 0xe8)][b1(0x2f4, "C6fO") + b0("7hxe", 0x3d)]) ||
                                "")[b0("Uj2C", 0x14)](),
                              b2[b0("YxiJ", 0x14e)],
                            )
                              ? 0x1
                              : 0x0,
                            (ac[b1(0x2d7, "S@lO")] &&
                              ac[b1(0x305, "Acl^")][b0("q]CY", 0x12) + "de"]) ||
                            ac[b0("Imsz", 0x1de)] ||
                            ac[b1(0x438, "3(AN")]
                              ? 0x1
                              : 0x0,
                            ac[b1(0x340, "(8!5")] &&
                            (ac[b1(0x3fb, "1[03")][b0("aDkK", 0x169)] ||
                              ac[b0("griD", 0x28)][b0("(f2U", -0x4c)])
                              ? 0x1
                              : 0x0,
                          ],
                          b4 = 0x0,
                          b5 = 0x0;
                        b2[b0("aDkK", 0x1cd)](b5, b3[b1(0x468, "WWJ$")]);
                        b5++
                      )
                        b4 += b2[b1(0x447, "Q2Sc")](b3[b5], b5);
                      this[b1(0x292, "EGti")] = b4;
                    },
                    packN: function () {
                      function aZ(b0, b1) {
                        return aA(b1, b0 - 0x470);
                      }
                      return [][aZ(0x320, "Y]ar")](
                        a4["ek"](0x1a),
                        a4["va"](this[aZ(0x305, "SlDP")]),
                      );
                    },
                  },
                  aN = {
                    packN: function () {
                      var aZ = {};
                      function b0(b3, b4) {
                        return aX(b4 - -0x1e3, b3);
                      }
                      ((aZ[b0("hIzm", -0x3e)] = function (b3, b4) {
                        return b3 === b4;
                      }),
                        (aZ[b0("N)xu", 0xb0)] = b0(")8Bu", -0x4d)));
                      var b1 = aZ;
                      function b2(b3, b4) {
                        return aX(b3 - -0x40d, b4);
                      }
                      return (
                        (this[b2(-0x36, "36]w")] = b1[b2(-0xd5, "Imsz")](
                          ac[b0("WWJ$", 0x10a)][b2(-0x191, "8RnY") + b2(-0x6b, "SYaz")],
                          b1[b2(-0x262, "jU*K")],
                        )
                          ? 0x1
                          : 0x0),
                        [][b0("F[!2", 0xfc)](a4["ek"](0x1b), a4["va"](this[b2(-0x263, "q]CY")]))
                      );
                    },
                  },
                  aO = {
                    init: function () {
                      var aZ = {
                        vCBGn: function (b5, b6) {
                          return b5 === b6;
                        },
                        tQicC: b0("hIzm", 0x181),
                        fkJEI: function (b5, b6) {
                          return b5 === b6;
                        },
                        UHWex: b0("aDkK", 0x13b),
                        Ouhaj: b1("8RnY", 0x464),
                        EZGjD: function (b5, b6) {
                          return b5(b6);
                        },
                        yBBXE: b1("U02M", 0x5a5),
                        hKIUR: function (b5, b6) {
                          return b5(b6);
                        },
                        eLoGi:
                          b1("Imsz", 0x3cf) +
                          b1("%4m!", 0x514) +
                          b1("dE%z", 0x5b8) +
                          b1("Y]ar", 0x491) +
                          "2\x22",
                      };
                      function b0(b5, b6) {
                        return aA(b5, b6 - 0x277);
                      }
                      function b1(b5, b6) {
                        return aA(b5, b6 - 0x63a);
                      }
                      try {
                        var b2 = ac[b0("36]w", 0x221)][b1("AcT^", 0x5b0) + b0("(9D4", 0x100)](
                            aZ[b1("7hxe", 0x58e)],
                          ),
                          b3 = function (b5) {
                            function b6(b9, ba) {
                              return b0(ba, b9 - 0x396);
                            }
                            function b7(b9, ba) {
                              return b1(ba, b9 - -0x6b);
                            }
                            try {
                              var b8 = b2[b6(0x48e, "AcT^") + "e"](b5);
                              return aZ[b6(0x3ea, "Imsz")](b8, aZ[b6(0x468, "]HJo")])
                                ? 0x1
                                : aZ[b6(0x46e, "(8!5")](b8, aZ[b7(0x49d, "YYv%")])
                                  ? 0x2
                                  : MediaSource[b7(0x34b, "(8!5") + b7(0x444, ")8Bu")](b5)
                                    ? 0x3
                                    : 0x0;
                            } catch (b9) {
                              return 0x0;
                            }
                          };
                        this[b1("@xF@", 0x3da)] = {
                          mp3: aZ[b0("YYv%", 0x28b)](b3, aZ[b0("l!WU", 0x23d)]),
                          mp4: aZ[b0("S@lO", 0x222)](b3, aZ[b0("Acl^", 0x1e0)]),
                        };
                      } catch (b5) {
                        var b4 = {};
                        ((b4[b1("SlDP", 0x44d)] = 0x0),
                          (b4[b1("]HJo", 0x45c)] = 0x0),
                          (this[b0("]HJo", 0x278)] = b4));
                      }
                    },
                    packN: function () {
                      function aZ(b0, b1) {
                        return aX(b1 - -0xd7, b0);
                      }
                      return [][aX(0x25a, "q]CY")](
                        a4["ek"](0x1c),
                        a4["va"](this[aZ("54^6", 0x17c)][aZ("AcT^", 0x326)]),
                        a4["va"](this[aZ("EGti", 0x15c)][aZ("EGti", 0x91)]),
                      );
                    },
                  };
                function aP(aZ) {
                  function b0(b1, b2) {
                    return aA(b2, b1 - -0x19);
                  }
                  [aw, ay, az, aB, aC, aE, aF, aG, aH, aI, aK, aL, av, aM, ar, aO][
                    b0(-0x60, ")8Bu")
                  ](function (b1) {
                    b1[b0(-0x163, "3(AN")](aZ);
                  });
                }
                function aQ() {
                  var aZ = {};
                  function b0(b5, b6) {
                    return aX(b6 - -0x27b, b5);
                  }
                  ((aZ[b4("PZV1", 0x53f)] = b4("QovG", 0x67b)),
                    (aZ[b0("dE%z", -0xf1)] = b4("aDkK", 0x4f9)),
                    (aZ[b0("C6fO", 0x8d)] = b4("]HJo", 0x478)),
                    (aZ[b0("Pt@f", -0x7e)] = b4("(9D4", 0x679)),
                    (aZ[b0("jU*K", 0x10d)] = b0("8RnY", 0x9d)),
                    (aZ[b0("dE%z", -0xb8)] = b0("Acl^", -0x90)));
                  var b1 = aZ,
                    b2 = b1[b4("C6fO", 0x44f)],
                    b3 = b1[b0("SlDP", 0x35)];
                  function b4(b5, b6) {
                    return aX(b6 - 0x2f5, b5);
                  }
                  (ai && ((b2 = b1[b0("54^6", 0xfb)]), (b3 = b1[b0("7hxe", 0x58)])),
                    ac[b0("8RnY", 0x14f)][b4("dE%z", 0x54b) + b0("hIzm", -0x42)](b2, as, !0x0),
                    ac[b4("PZV1", 0x499)][b4("YYv%", 0x641) + b0("hIzm", -0x42)](b3, at, !0x0),
                    ac[b4("YxiJ", 0x4ee)][b4("YYv%", 0x641) + b4(")8Bu", 0x530)](
                      b1[b0("l!WU", 0x183)],
                      ar,
                      !0x0,
                    ),
                    !ai &&
                      ac[b4("S@lO", 0x56d)][b4("QovG", 0x4b9) + b4("PZV1", 0x625)](
                        b1[b0("EGti", 0x148)],
                        au,
                        !0x0,
                      ));
                }
                function aR(aZ, b0) {
                  var b1 = aV();
                  return (aR = function (b2, b3) {
                    var b4 = b1[(b2 -= 0xeb)];
                    void 0x0 === aR["zBlqyY"] &&
                      ((aR["AroTHC"] = function (b7, b8) {
                        var b9 = [],
                          ba = 0x0,
                          bb = void 0x0,
                          bc = "";
                        b7 = (function (bf) {
                          for (
                            var bg, bh, bi = "", bj = "", bk = 0x0, bl = 0x0;
                            (bh = bf["charAt"](bl++));
                            ~bh && ((bg = bk % 0x4 ? 0x40 * bg + bh : bh), bk++ % 0x4)
                              ? (bi += String["fromCharCode"](0xff & (bg >> ((-0x2 * bk) & 0x6))))
                              : 0x0
                          )
                            bh =
                              "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/="[
                                "indexOf"
                              ](bh);
                          for (var bm = 0x0, bn = bi["length"]; bm < bn; bm++)
                            bj +=
                              "%" + ("00" + bi["charCodeAt"](bm)["toString"](0x10))["slice"](-0x2);
                          return decodeURIComponent(bj);
                        })(b7);
                        var bd = void 0x0;
                        for (bd = 0x0; bd < 0x100; bd++) b9[bd] = bd;
                        for (bd = 0x0; bd < 0x100; bd++)
                          ((ba = (ba + b9[bd] + b8["charCodeAt"](bd % b8["length"])) % 0x100),
                            (bb = b9[bd]),
                            (b9[bd] = b9[ba]),
                            (b9[ba] = bb));
                        ((bd = 0x0), (ba = 0x0));
                        for (var be = 0x0; be < b7["length"]; be++)
                          ((ba = (ba + b9[(bd = (bd + 0x1) % 0x100)]) % 0x100),
                            (bb = b9[bd]),
                            (b9[bd] = b9[ba]),
                            (b9[ba] = bb),
                            (bc += String["fromCharCode"](
                              b7["charCodeAt"](be) ^ b9[(b9[bd] + b9[ba]) % 0x100],
                            )));
                        return bc;
                      }),
                      (aZ = arguments),
                      (aR["zBlqyY"] = !0x0));
                    var b5 = b2 + b1[0x0],
                      b6 = aZ[b5];
                    return (
                      b6
                        ? (b4 = b6)
                        : (void 0x0 === aR["IXvKws"] && (aR["IXvKws"] = !0x0),
                          (b4 = aR["AroTHC"](b4, b3)),
                          (aZ[b5] = b4)),
                      b4
                    );
                  })(aZ, b0);
                }
                function aS() {
                  function aZ(b0, b1) {
                    return aA(b1, b0 - 0x540);
                  }
                  ((a9 = 0x0),
                    [as, at, ar, au][aZ(0x2c7, "QYdW")](function (b0) {
                      b0[aZ(0x4ae, "tt&(")] = [];
                    }));
                }
                function aT() {
                  var aZ = {};
                  aZ[aA("(meS", -0x1ad)] = function (b3, b4) {
                    return b3 + b4;
                  };
                  var b0 = aZ;
                  function b1(b3, b4) {
                    return aA(b3, b4 - -0x21);
                  }
                  var b2 = a4[b1("(f2U", -0x16e)](
                    b0[b1("YxiJ", -0x18d)](am[b1("Q2Sc", -0x10e)](), aU[b1("YYv%", -0x63)]()),
                  );
                  aa = b2[b1("q]CY", -0x1a7)](function (b3) {
                    return String[b1("(f2U", -0x75) + "de"](b3);
                  });
                }
                function aU() {
                  var aZ,
                    b0 = {
                      JSeyi: function (ba) {
                        return ba();
                      },
                      CTxCC: b9(0x545, "QYdW"),
                      npRBP: function (ba, bb, bc) {
                        return ba(bb, bc);
                      },
                      iSDtI: function (ba, bb) {
                        return ba < bb;
                      },
                      hNmVQ: function (ba, bb) {
                        return ba === bb;
                      },
                      xfDub: function (ba, bb) {
                        return ba > bb;
                      },
                      HvucD: function (ba, bb) {
                        return ba <= bb;
                      },
                      kbnzE: function (ba, bb) {
                        return ba - bb;
                      },
                      YrazO: function (ba, bb) {
                        return ba << bb;
                      },
                      fBcAN: function (ba, bb) {
                        return ba > bb;
                      },
                      dhItA: function (ba, bb) {
                        return ba + bb;
                      },
                      yQQNR: b1(0x2e7, "PZV1"),
                    };
                  if (!ac) return "";
                  function b1(ba, bb) {
                    return aA(bb, ba - 0x428);
                  }
                  var b2 = b0[b1(0x374, "1*rM")],
                    b3 = (aZ = [])[b9(0x4a4, "(meS")]["apply"](
                      aZ,
                      [
                        as[b2](),
                        at[b2](),
                        ar[b2](),
                        au[b2](),
                        av[b2](),
                        aw[b2](),
                        ax[b2](),
                        ay[b2](),
                        az[b2](),
                        aB[b2](),
                        aC[b2](),
                        aD[b2](),
                        aE[b2](),
                      ]["concat"](
                        (function (ba) {
                          if (Array["isArray"](ba)) {
                            for (var bb = 0x0, bc = Array(ba["length"]); bb < ba["length"]; bb++)
                              bc[bb] = ba[bb];
                            return bc;
                          }
                          return Array["from"](ba);
                        })(aF[b2]()),
                        [
                          aG[b2](),
                          aH[b2](),
                          aI[b2](),
                          aJ[b2](),
                          aK[b2](),
                          aL[b2](),
                          aM[b2](),
                          aN[b2](),
                          aO[b2](),
                        ],
                      ),
                    );
                  b0[b1(0x3cf, "@xF@")](
                    setTimeout,
                    function () {
                      b0[b1(0x2cf, "QovG")](aS);
                    },
                    0x0,
                  );
                  for (
                    var b4 = b3[b9(0x483, "l!WU")][b9(0x621, "PZV1")](0x2)[b9(0x538, "]HJo")](""),
                      b5 = 0x0;
                    b0[b1(0x1f2, "$nFE")](b4[b1(0x40c, ")8Bu")], 0x10);
                    b5 += 0x1
                  )
                    b4[b9(0x491, "jU*K")]("0");
                  b4 = b4[b9(0x55e, "YYv%")]("");
                  var b6 = [];
                  (b0[b9(0x5c3, "YYv%")](b3[b1(0x369, "k&f(")], 0x0)
                    ? b6[b9(0x4ca, "YxiJ")](0x0, 0x0)
                    : b0[b9(0x59d, "U02M")](b3[b1(0x200, "ChZ!")], 0x0) &&
                        b0[b1(0x1c0, "(f2U")](
                          b3[b1(0x250, "U02M")],
                          b0[b1(0x37d, "ChZ!")](b0[b9(0x521, "54^6")](0x1, 0x8), 0x1),
                        )
                      ? b6[b9(0x5ed, "PZV1")](0x0, b3[b1(0x280, "l1Y6")])
                      : b0[b1(0x382, "k&f(")](
                          b3[b1(0x33a, "(f2U")],
                          b0[b1(0x25c, "QovG")](b0[b1(0x322, "%4m!")](0x1, 0x8), 0x1),
                        ) &&
                        b6[b9(0x465, "%4m!")](
                          ac[b9(0x6b6, "@xF@")](b4[b1(0x269, "jU*K")](0x0, 0x8), 0x2),
                          ac[b1(0x303, "$nFE")](b4[b1(0x227, "AcT^")](0x8, 0x10), 0x2),
                        ),
                    (b3 = [][b1(0x2b4, "dE%z")]([0x1], [0x1, 0x0, 0x0], b6, b3)));
                  var b7 = a3[b9(0x680, "ChZ!")](b3),
                    b8 = [][b1(0x257, "aDkK")][b1(0x319, "F[!2")](b7, function (ba) {
                      return String[b1(0x1b6, "Pt@f") + "de"](ba);
                    });
                  function b9(ba, bb) {
                    return aA(bb, ba - 0x705);
                  }
                  return b0[b1(0x1e4, "WWJ$")](
                    b0[b1(0x1f0, "SlDP")],
                    a4[b9(0x59c, "jU*K")](
                      b0[b9(0x5a5, "36]w")](b8[b1(0x2cb, "l!WU")](""), aa[b9(0x623, "@xF@")]("")),
                      a4[b1(0x358, "ChZ!")],
                    ),
                  );
                }
                function aV() {
                  var aZ = [
                    "abXDW7myW6aBfSofoa",
                    "lxjMWPddTCoLCmoGm8kP",
                    "W4dcPG7cJx4",
                    "sZyjWRlcL8ogis0",
                    "WRNdM8ocW4j3WRZcKHNdKW",
                    "W5qXmSoBW7m",
                    "DmoAWRtdRColWR/dQWz5lCkq",
                    "qConqg/cOmkwetmQ",
                    "uaS3WQTZ",
                    "ySokW77dImk1",
                    "WPfSWR3dLCkZWQtdVq",
                    "WRddG2rhW4aDFmo5FW",
                    "n8kKW4WSWOK",
                    "vmodW4ZdNSkz",
                    "hCkSgtZcVq",
                    "tSkpbCkEW6SRWQZcO17cKW",
                    "WP/cTmooWPqTW4i+CSkmW4y",
                    "wZ/dHG",
                    "gmkeW6mwWO8",
                    "WQxcO3ipW5pdN00",
                    "AtyQWQBcUa",
                    "W7ddSZCaW4W",
                    "WOVcUKenW5W",
                    "WPtcOCkgWPbY",
                    "WOxdH8oCW6fO",
                    "WR5/m1TFbItcLCk+vq",
                    "nCkoW7BcRSkFWPhdSGS",
                    "ubK3WP9J",
                    "bhBdICkNigi/nCoG",
                    "i8o4W57cJYC",
                    "uSkkdmk+W5C",
                    "W5Duew5D",
                    "WRagW53dOsRdRmovgq",
                    "W6bGkXu",
                    "WPvaWQq/WRRcHWCdW5/dUq",
                    "WPCxASk9W7a",
                    "iX7cNmoTEHlcVSoobCo0W6NcRq",
                    "i8oGW5/cJq",
                    "W4O+Afu2",
                    "CflcQSkz",
                    "WPOEr0JcLG",
                    "W691tfSWmSo+WRiJ",
                    "EexdISk+i14",
                    "WPddLCosW4y",
                    "W5pcPCo/W6v7W4C",
                    "W5uoWRzb",
                    "W4WxChyT",
                    "W5pdMdaFW7u",
                    "EeVdImkX",
                    "xSoOD0dcPW",
                    "W7xcLCoFW4HV",
                    "W4ZdP8kiW4i",
                    "mG9gW6etWOKLaW",
                    "WQ7dRmk5kSk8",
                    "WOOoW6xdJSozfG",
                    "cab7W6mC",
                    "W7zkoI7dSCk3W5JcIG",
                    "W4DUpuv1",
                    "pSkoW6uaWOK",
                    "WQmxAw3dUSk4W7dcU8opWOa",
                    "W4mmvwqA",
                    "W4xcGmkxWP89W6BdJG7dMX/dTbKr",
                    "W7DMtuSZi8ocWRqJxG",
                    "jSkFbJZcUa",
                    "fmkpW5OHWPW",
                    "lSoVW4lcMa",
                    "mHXBW6yzWRqYb8ov",
                    "W7ZcPalcIe7dN157gxu",
                    "hmkOW7SvWQxdICki",
                    "W7vFdrFdIW",
                    "W5hcVSoJW6X3WPvuW6tcOdK",
                    "dCkHoSoQWPWTpsjC",
                    "WR55W4ayqsZcVwddL8km",
                    "kmkmka3cTW",
                    "W4lcG8oODSo7WQtdMSoEacz9WOJdQW",
                    "d8kVmmkKW6KB",
                    "hKHMWO3dOW",
                    "eNXWWPS",
                    "jSk8o8kTW6K3C8ohvW",
                    "W4hdQCksW6auW40eECkcW40",
                    "t8kEcCkRySkJ",
                    "BHqxWP9HEa",
                    "w3RcM8kOWPddSCoZWRC",
                    "W4JdQcyaW5y",
                    "WQVcMmkwWOHZ",
                    "W4bRmrNdTa",
                    "WP0oW7FdJG",
                    "xContx4",
                    "zbiMWPhcRSodBG",
                    "dmkLlmobWO0R",
                    "W5lcGmk9wf4",
                    "DeJcISkfgSkHtga",
                    "W50tWRftW7VcKbftW6ldTa",
                    "bSkTWRq3",
                    "W5G9ALOJW4qaWRaKW6q",
                    "ssewWRZcL8ohka",
                    "WR8Bu8kNW4a",
                    "nmk+W7GaWQC",
                    "FCoPW4GjySoN",
                    "WPOdW6RdJmoa",
                    "bCkngSkLW4u",
                    "jSkcpGtcUXq",
                    "W6/dUJabW43dTCkaymki",
                    "WPBdLmkZka",
                    "W7TUkey",
                    "jSkiWOKYWPG",
                    "nCkNnSkXW78",
                    "WRZdSSoLW5nn",
                    "WQBdNSogW7q",
                    "W5pcQCoUW5v3W4ynW4xcTJu",
                    "uCo0BM/cNG",
                    "W7RcRCkjDKL0",
                    "r3tcPSk4WO7dVCoyWQzmqq",
                    "W7NcHmkFWQJcImkkbmotvYVcSW",
                    "W43cTmkLzum",
                    "nCkFpHVcVquSWPT0",
                    "cCkIW7G",
                    "E8kIu8kcW5/dRxRcRa",
                    "v8kAd8kyW6SM",
                    "b8kRkSkI",
                    "WOFcJurTW6a",
                    "aNldImky",
                    "amkNWRm+WPxcSa",
                    "C1pcVmkFdCk6",
                    "W5pcRmoHW6zgW4OdW7RcSJu",
                    "AmkjnSkLsG",
                    "WQlcJSkAWRm",
                    "pepcHmo8",
                    "W4tdO8ksW4qpW4S",
                    "amkSW78qWRldJ8onWPTCyG",
                    "WRBdGCk2f8kG",
                    "W443B1Sy",
                    "p8k/W442WOO",
                    "wCokW5NdTmko",
                    "ESk+iSkqW5C",
                    "WQhcJfrCW5yrt8k+",
                    "WPFdMSk+imkQW6K",
                    "FmkIxSkuW5pdVa",
                    "hmk3WQ4X",
                    "W4DvjZCG",
                    "W7n9jhnFcZddNmo0",
                    "W5eND0GTWOfp",
                    "W50VCf0",
                    "jmkVnSkAW5O",
                    "w8kgfmkdxq",
                    "tmoHW78zW7hdQeldPsm",
                    "rKxcVSkBpq",
                    "DmkkcCkEW7u",
                    "W7pcUSkdA2K",
                    "v8kSamktW6y",
                    "WOFdMCk5imkU",
                    "ymoVW7/dVSkxWOBcObxdTNS",
                    "WRpcQgqvW4FdJ0dcQSkECW",
                    "W47dHmkFW6i1",
                    "WQddNSomW7VdHmknaSo6",
                    "vsusWRNcGmobBtFcPMS",
                    "WOpcGgrVW7C",
                    "W5VdQCkrW4y",
                    "W7i4Ax8Q",
                    "Emo8W4u8C8oHBX0MWOq",
                    "W5PFCw0M",
                    "lczrW4ao",
                    "nCkScSosWPy",
                    "W5BcUmoJW6LIW4SnW7RdPNi",
                    "jhnrWPBdLq",
                    "smoQW64LW6/dOv4",
                    "W4WQWOvdCYxcP0ldUCkQ",
                    "W4b3fXZdTa",
                    "pw7cN8oAga",
                    "W4i1W7ZcQmkIWQNdRrXDWQe",
                    "zGSRWP3cR8kyw8oQW54",
                    "aCk9W64lWQu",
                    "hM9HWPW",
                    "W5GbWQTu",
                    "WPBdSCoEW4f8",
                    "lxhdTmkfmG",
                    "WRCbW4ZdUYRdRa",
                    "e8kSk8ofWPW",
                    "ymo/W6/dMSkcWOVcNqNdM3y",
                    "WQdcOgKVW5ZdIhW",
                    "W7LYtuWRl8oOWQXMvW",
                    "cMxdLmkkmwKDlCoTWPy",
                    "qxpdJCk0nq",
                    "tceeWQpcGSolpZe",
                    "neFcNSo6bwW",
                    "WPGjswa",
                    "W7ZcVCklFu10WRi",
                    "v8omsMNcP8kl",
                    "guJcNmo+ea",
                    "W4iGx8k8W6xcMs49WQJcSG",
                    "hCoiW63cQIa",
                    "W71WnvPueq4",
                    "WReWW5/dHbe",
                    "W5r0w0KX",
                    "BsddOCktW4u",
                    "vdSRWOdcKG",
                    "mqzDW7qc",
                    "W7P9kf4",
                    "WPNdM8otW5rGWR/cLbxdHa",
                    "jCkzf8oTWQK",
                    "W5JcMSo/W751",
                    "fmkVn8ofWPeWlJDgdq",
                    "w8oeW4/dMCky",
                    "EIJdMmkcW60",
                    "iCkJWQKX",
                    "WQxcJSkcWR4",
                    "zWmTWPf4Dq",
                    "W7WGWOzjEc3cHvVdQa",
                    "WQdcO24PW5pdIa",
                    "WPPSWRRdO8k3WQpdUIvY",
                    "WPP0WRFdISk7",
                    "iCknemoZWP4",
                    "WR7dS8oyW7hdUa",
                    "mCkgW6NcUmkPWQZdVrjr",
                    "zHanWPK",
                    "amkFiWdcOa",
                    "FKtdKG",
                    "WQhcIMPnW7Cmqmk0CG",
                    "W4xcVSoOW7HxW4uhW7RcSG",
                    "utxdHSkhW6jCWPWBpmk2",
                    "W6RcVCkDFu1JWRi",
                    "wcGpWRxcMmoqfq",
                    "W543b8o7W5HQW7ZcUgS",
                    "hCkdxYRcNCkrhIiNwW",
                    "WPL3WQ7dPmk7WQJdUXDQWPm",
                    "W6ZcT8k+zv5PWRK3",
                    "zxRdK8km",
                    "WPj3W68",
                    "W6Xupqmq",
                    "W5aSdCoNWRZdJGv5W5ZcMW",
                    "aSkYWO8BWRe",
                    "W40TgSoGW5P7",
                    "DmkEsCkzW5e",
                    "DCoJW4uBE8oQzqW",
                    "WPZdV8oVW7jx",
                    "zamwWPvwEmkXW4ePyq",
                    "iCoeW4VdQCoo",
                    "W4VcVW7cVv4",
                    "xYusWRe",
                    "WQ/cQw4TW4BdLa",
                    "hmkJWQ8QWOtcKv7cNq",
                    "WPSZW4/dVWm",
                    "amkLmmkGW7Wh",
                    "W6NcPmokW59B",
                    "WPBdUmoPW5ZdHq",
                    "W74Ld8oqWP8",
                    "nSkfoaNcPG",
                    "W47cGmkpDhy",
                    "uSomvK/cP8kCfW",
                    "WPWbW7u",
                    "WR9xWOldNmkxWQVdSd95WPG",
                    "kmkpprZcQW",
                    "W4ZdQCkFW5ywW4yEFW",
                    "DCoKW4JdJ8ktWORcOay",
                    "W6yvWO/dQhldTCkieCooba",
                    "tSkrbCkAW7KNWPhcO0G",
                    "WP7cNCkcWRbU",
                    "WR0hW5RdSt/dHSoD",
                    "WPNcQ248W7y",
                    "zCkpyCkVW6O",
                    "W4BdQCkl",
                    "f8kpW4KHWOe",
                    "r8oSs2hcTa",
                    "WQRcISkaWRvUiq",
                    "W7efWQXuWRRdQeffW5FdTa",
                    "W6RdV8k1W4C",
                    "uCo6W5pdLmkw",
                    "W7VcT8kdCK10",
                    "WQFcRxqR",
                    "W4FcJmoLeSktW5ZcG8ozkG",
                    "CXRdTmkxW5K",
                    "W7rZmaamW4DXzrW",
                    "jCkyemoKWOa",
                    "b1DnWRNdGa",
                    "td/dH8ka",
                    "FmoVW74B",
                    "WRldP2OAWOVdQmovECol",
                    "WP0aW6ddMSoggHOH",
                    "WRBcOMqVW5tdLuVcVCkL",
                    "W54Wg8oN",
                    "WOddMSkdn8k5W7tcHmoC",
                    "W4xcT8ocW7Tc",
                    "W6FdTd0tW5xdSCkjCq",
                    "uG43WQdcSG",
                    "o0BcK8ocegbCag3cQW",
                    "W6K5t38X",
                    "WRy1W7ldHmoV",
                    "w8kRDCkzW4u",
                    "WP8vB8kCW77cHfNcOZLU",
                    "W6WUWODl",
                    "DCoTW5ip",
                    "wmogsM3cSSkx",
                    "WPRdLmkMkSkSW7ZcNSoE",
                    "vKxdKCkUj27cVCoBkSoi",
                    "W6XGldSuW51yzXBcVG",
                    "WQFcO2m/W5/dMuVcRa",
                    "WRCaW7FdHSonfHC0ymkr",
                    "FCkDbSkvW4O",
                    "W7FcTSkzFLLJWR8JDSkx",
                    "EMxcImkPma",
                    "W6O6FvaNWR5tWQqRW6y",
                    "zbeHWPFcOCod",
                    "WRdcJMjgW5a",
                    "dmkti8okWOa",
                    "W5GSdCoZWQxdGGrJW5dcMq",
                    "WP9IWQhdTmk+WQldKcr5WPG",
                    "BelcQW",
                    "AhdcOmkfWQu",
                    "mIPNW6GL",
                    "WQqBW5hdOcJdVCochCkF",
                    "Cmo4W5ipDCoNwba1WOu",
                    "W5aIgSoZ",
                    "W73dIIDtWQ5yaCo5iIi",
                    "WRuSCCkx",
                    "sfBcI8kSWO8",
                    "WQ4YeX9UiCoWWRSExSoZ",
                    "W7ddTZCfW50",
                    "WOvMWQhdTmk3WRxdSca",
                    "W6xdTcWJW5NdT8kp",
                    "WR/dLmoDW6ZdLCkwoCo9AaC",
                    "jG9aW7m",
                    "WQ/dNCogW7NdM8kHg8oXAXy",
                    "cvlcPmo6nW",
                    "zdtdOCkcW5y",
                    "W4OfWRfbW57dHLnc",
                    "W7D6pYS",
                    "W4bFfWJdUG",
                    "c8ojvmo9xmkIxvxdVx8",
                    "bgFcGG",
                    "l8kaW5KSWQm",
                    "W5lcJapcSve",
                    "wCokv28",
                    "yX87WPu",
                    "wSoVW6Kr",
                    "vvFcMCkeWRO",
                    "W73cTmkiFeLUWQmzzG",
                    "iafy",
                    "nSkkW7BcQ8kFWQRdIbzmjG",
                    "smkiamktW7mHWOG",
                    "rmorW5ZdKCkL",
                    "W75anZZdQmk6",
                    "W54QgSo7",
                    "e8kLmmoqWPWXdJ9zha",
                    "W7rJpa",
                    "DWiCWOPuD8k1W50E",
                    "thNcOCk5WOZdRmoe",
                    "WRuRBCklW7FcNh/cGcu",
                    "WQJdKmoBW7S",
                    "tX/dMSkFW7e",
                    "lGTAW7ucWQG",
                    "WP4SW4ddN8og",
                    "taS/WP9/",
                    "WP7dN8oSW5/dTa",
                    "kCkkW6RcUSkoWRa",
                    "imocW6JcNdG",
                    "WQ/dNSobW7NdKCkq",
                    "W5Gqd8o+WQG",
                    "tY0lWRxcHCoqldNcUq",
                    "FvVcOmkEWOO",
                    "WRy6CmkqW7tcHflcNZa",
                    "W65Pl1C",
                    "W50KdSoUW4v3",
                    "B1FcQW",
                    "WPVcJuGzW50",
                    "bmkgW5GZWQu",
                    "W7NcJmo1W61D",
                    "W6FdJWWXW4S",
                    "vcldKmks",
                    "W6TOCfSTl8oPWQu",
                    "W5eujmo3WOK",
                    "kCkcmG7cPHG6WOu",
                    "W6jxnI/dS8kMW4/cJSoz",
                    "i8oUW4JcMtJcH1y5",
                    "W5vFC2yT",
                    "F8oTW5ihymoQkXS7WOu",
                    "dCk2WR8oW7hdNhxdOGG",
                    "W6OdWRXYW4K",
                    "xsBdLmkDW69SWPaVkCk9",
                    "WOtdMmotW4bSWRZcIa",
                    "umocugS",
                    "usdcGq",
                    "W6JcUqdcVvtdN0HMhq",
                    "W4dcR8oU",
                    "WQe4DSkE",
                    "WQ7dUmolW4rJWR7cPdpdKYu",
                    "zreRWO0",
                    "WQ7cJ3qtW5a",
                    "xHW8WRpcPa",
                    "W5NcVSozW7nMW4CXW6hcTIO",
                    "W7zKorerW4fTzW",
                    "aSkOW6uEWRddGG",
                    "BK7dRSkNeG",
                    "xmoiW70UW4W",
                    "WRJdMmkMc8kA",
                    "tYevWQq",
                    "WRFdV8oGW7zM",
                    "W5dcLSkHzM0",
                    "cSkSW78y",
                    "amkTWR44WPxcSv/cHW",
                    "iCoUW5NcQttcGva",
                    "W5LXmxvE",
                    "m2FdMCkeia",
                    "qs82W43dHSoNsSk5aCkV",
                    "jqTRW7qg",
                    "fCkUmCooWPaLlG",
                    "W4WpWQG",
                    "eg9RWPFdK8oUzCkYi8kN",
                    "nGfbW7eEWRm/fSocia",
                    "jmoTW47cJsFcOvKUpIa",
                    "A8oYW7ZdTCkI",
                    "cSoUW4/cIsFcJfe3ja",
                    "WQBcK2TbW5a",
                    "DSk1WPJcLbBcGu0fgq",
                    "W48NyfKTW5XBWRb2WRW",
                    "W5yzc8o9WOi",
                    "WRJdKmoDW73dLCkq",
                    "sGCmWPTr",
                    "W5ezDKGH",
                    "WQBdU8k4aCkJ",
                    "WPVcJuifW50",
                    "WOyQBfNcVq",
                    "nmoIW5NcGZNcJMWIjG",
                    "udxdM8ktW7Dt",
                    "w8oHW6qzW7JdSq",
                    "cmkJWQK4",
                    "W7rmns/dUCkG",
                    "qSokv2pcPmktgG",
                    "WPFdM8oiW4rKWQy",
                    "w8opW68jW40",
                    "WQCzW5ldVtm",
                    "W7DxdtldSCk3",
                    "W6/dVJabW4ZdVa",
                    "WQxcJhvC",
                    "W7bUdaarW5PMCG",
                    "WRpcVM8+W53dIfZcQmkK",
                    "tCknaSkBzmkJB0VdK1e",
                    "W63cUWVcQe/dJMjZcNC",
                    "x8kEfCkE",
                    "W6JcT8kA",
                    "WPJdKmk+jmk/W7u",
                    "zeJcUSkebCkTthm",
                    "mSkuoGJcIa",
                    "W7rqnZJdQmk7W5NcKmkCWQa",
                    "lKFcNSo5hNy",
                    "WQ3dL8kJbmkV",
                    "hgrJWRtdKW",
                    "WRaiW4RdTq",
                    "lmkNdCoSWQ4",
                    "ASkkF8krW7m",
                    "W7DMsL0Zl8oPWQC",
                    "WQxcGmkaWRf7pq",
                    "WRpcN8kkWRnUlebxW6hdGq",
                    "W7znec/dNq",
                    "luZcLmo4f21DnhK",
                    "kKpcNSo5hMK",
                    "W5tcRmo5W6S",
                    "WOeSW5xdQSob",
                    "xmoVW74B",
                    "iCkcpc7cPWu6WOzWbG",
                    "CaqxWOX8FCk1",
                    "iCkmjq4",
                    "WQxcLNra",
                    "zIddNCkBW6y",
                    "wCkEe8kU",
                    "zSkCyCk5W6a",
                    "evtdP8kUlW",
                    "lmk8W4dcQCkZ",
                    "vSoHW70",
                    "W40QbSoSW5zQ",
                    "W5W4yvi2",
                    "FSk7uCkEW57dGhhcStOk",
                    "W7Sjl8oXWOS",
                    "WPzNWQVdLCkKWQldUYzqWP8",
                    "W6HIquSTl8oXWQC0",
                    "WPuIBhhcOq",
                    "WOhdMSocW4jJWRVcLqBdHq",
                    "vCofW5FdLSkW",
                    "WRdcR3iVW5FdKG",
                    "le3cO8oPa21DnG",
                    "nSkoWRa6WOFcTg/cQmkWWQe",
                    "W7tcVCkdDLHO",
                    "sCkGwmkfW5a",
                    "WPOaW63dJmokcW",
                    "W7SLhmoGWPy",
                    "WQdcMSkaWRfUihXCWRm",
                    "W48nrNSS",
                    "CCo5W77dR8kiWO7cQZldJNm",
                    "W7zbDKWi",
                    "W64iWRDmsa",
                    "W7KfWRPPqa",
                    "zCoQW6/dMG",
                    "bxJdKSkkmwu3lW",
                    "jSklW6FcGSkBWRZdSY5rla",
                    "D8oTW5qhrmoQzHCGWOq",
                    "WRGAW5ZdOce",
                    "wSomuW",
                    "WRFdVSkweSkO",
                    "wcSiWRpcL8oq",
                    "emk6p8k0W7m",
                    "B8k/x8kdW53dVg3cQdG",
                    "heFcHSo0eMf8i3tcOq",
                    "W7HQjNzj",
                    "Bmooru7cGW",
                    "W7zeltO",
                    "egHQWPNdPmoVA8kUqmoG",
                    "uspcICoBFtq0i8ojWOi1W6S",
                    "W7D8oaVdIG",
                    "CmoByLFcOH8TWQvqjq",
                    "W7OljmoIW6y",
                    "WQlcQCkzWOzp",
                    "CXeCWOdcSSoEwmo9",
                    "k0hcGSoYhwG",
                    "k8osW4RcGcW",
                    "CGmwWOX6zmkPW4mp",
                    "W7feoJpdUCkn",
                    "wSocsw8",
                    "WQBcUca",
                    "W6DUmrCcW4C",
                    "ACoQW7xdN8knWOBcIXFdN3W",
                    "gMldK8kymx4Xl8oV",
                    "bmkHnSoh",
                    "s3tcVmk9",
                    "WOGbugtcTSkoWR8IfW",
                    "WQW2Ba",
                    "W7FdM8oDWQPzkMz6W5W",
                    "WRhcJgrDW4KDt8kT",
                    "W7DAcvXT",
                    "W6DTnHenW4Dq",
                    "WRhcGNnj",
                    "h2HPWRVdMa",
                    "WP4bu2u",
                    "omkKfSoqWQW",
                    "BLtcI8kZWQO",
                    "W443WP5CFG",
                    "fCowr8k0lCkvzhNdK1K",
                    "WRBcJ25nW4OmEa",
                    "vIStWQpcK8ojiIlcRa",
                    "WRBcJ25lW48",
                    "b3BdH8kciM0SlSo6",
                    "CSk9aW",
                    "WQVdLmoBW5/dNmkbamoXAXy",
                    "xmorqwW",
                    "wMBcRCkUWQpdV8o4WR5D",
                    "W4PaetxdVW",
                    "l1DVWO/dOmoSwmo7WPNcTa",
                    "W7xcJmkb",
                    "W75XqKyZdSoIWQSHwa",
                    "jGfxW6CBWQuLaW",
                    "W4z1qLuq",
                    "WQdcOgKVW5ZdIh0",
                    "lHlcKCkPkNpcISoDcG",
                    "traaWOxcQG",
                    "qgdcVmk5WPddJ8o0WRrDrW",
                    "WRagW53dOsRdRmovgCk3fW",
                    "lX4a",
                    "WRFcO1m+W4ddLuVcVW",
                    "W47dV8kpW68R",
                    "zCoJW7uAzmoMzr8",
                    "WOzWWRxdLSk/",
                    "W6WGWPbFFsxcHfK",
                    "AXSHWPpcTmoF",
                    "W6y+Bf0SWODzWQ0",
                    "WO8gW6FdISoe",
                    "W7DIlregW50",
                    "bSkYlSkSW68hyq",
                    "WP7dV8ohW5JdMa",
                    "WQSSB8kDW73cMG",
                    "vIuw",
                    "WOSnx2xcL8ktWQGQfq",
                    "W7pcS8k4DKS",
                    "zb8JWPG",
                    "mr5yW7Sc",
                    "WPXHWQhdQSkx",
                    "WQ/dMCooW7tdL8kbcCoaAHC",
                    "WRFcO3uPW5RdR1hcUCkZBG",
                    "WQ/dMCoDW7xdNCkb",
                    "ENNcGmkOWO0",
                    "gNHQWP3dPmoU",
                    "hCkIW6yC",
                    "W7ZcQHVcQa",
                    "utqDWOXh",
                    "lmkdnqRcQJ4Z",
                    "WRZdG8okW47dMCkjcmohCqm",
                    "wdhdGCkv",
                    "n8oGW4JcHXS",
                    "e8k1imovWO0XmZHt",
                    "WR7dLmoFW7BdKCkhca",
                    "W6yGWOq",
                    "W7NcVq7cOfFdVfHYdgK",
                    "nSkznahcTWm",
                    "W7r0lbW",
                    "r8oxqwtcO8kn",
                    "W5mShq",
                    "WP8PASkqW70",
                    "Ar8HWPVcN8oeqSo1WP/cVa",
                    "nSkfW547WQa",
                    "wmkEfCkwW7aG",
                    "WQFcOxbdW6W",
                    "W4FdS8kiW4yjW6SvySkkW4K",
                    "DSkJvmksW4RdH3i",
                    "WRyoxepcQW",
                    "xJqKWOhcMSkMjmoGqmkt",
                    "WP/dKCoFW5q",
                    "wSoCW78sW7u",
                    "W5TMv0O",
                    "o8kiWRO1WOC",
                    "zhpcI8kMgW",
                    "eCoFcSk/oCkVjcZcLX4",
                    "WPanu2BcKCks",
                    "A8oKW7ldLq",
                    "r8oHW44CDa",
                    "nJ9DW7e1",
                    "xmoHW6KpW7tdOepdPW",
                    "W5ZdR8krW4yiW5CrzSkD",
                    "umoAuwNcTa",
                    "W7TMv04",
                    "W5hcIHFcRNa",
                    "W5BcPSohW49F",
                    "W5uNcSoxWQFdJGv5W5xcNG",
                    "WRGmW5ddSZpdOq",
                    "cSk3WRm6WPxcSv/cH8oI",
                    "w17cISkOWQO",
                    "WRCgW5ddTYBdVq",
                    "uGe8WP9s",
                    "W7FdSJmdW4VdOmkgAmkl",
                    "zeBcRCkq",
                    "kKFcGmoXegDw",
                    "WPxcLgiVW6G",
                    "cNVdMmkok3Ga",
                    "W6jUltecW5bG",
                    "W4qVg8o1WRJdHrG",
                    "CSoKW7BdNG",
                    "kCoUW5W",
                    "r8optwNcOW",
                    "WRBcJSkCWQf/ah1g",
                    "WPVdGmkKjSk5W5xcJ8oscWC",
                    "yr4xWPT0za",
                    "w8orug/cOG",
                    "rqSPWPlcPCof",
                    "jmkRcSkUW7a",
                    "W5CRc8oH",
                    "Br8K",
                    "WRKiW44",
                    "zuRcSmkf",
                    "W6vXnISwW5PS",
                    "W4OKhmoU",
                    "W5DXyMGX",
                    "WOrGWR3dV8k+WQVdGt1S",
                    "W6ujWPHGW5C",
                    "cNBdN8k7kw0HfCoXWOS",
                    "FtWEWQZcMa",
                    "W6RcVCkiFW",
                    "WPddM8ofW5jOWRFcLrC",
                    "WPHZumk6WOCNWRxcRwjnC0/cVW",
                    "WPGzW6ldHSohnXe8C8kq",
                    "kmkiiHZcSXyWWRTWeq",
                    "WO8gW7ddHSojfHG8ymkb",
                    "W60HWOC",
                    "WQpcSSoKWQ8",
                    "W5KsWOTCW7FdGG",
                    "W5CSamoXWRddNW",
                    "qb8BWPNcRq",
                    "WQy1A8kAW7BcNf8",
                    "vsuiWR/cQCohiJVcOMy",
                    "W75XqKyZeCoUWQyYwa",
                    "WRlcQw5qW57dVSkHqmkibW",
                    "W4VdQCksW4aAW5C",
                    "WRNdN8olW7/dLSkna8oXyq",
                    "WRFcSxjaW4G",
                    "E8kSrmkw",
                    "aCk0k8oqWPXJotLqha",
                    "bCkUiCojWP0M",
                    "FXGlWOhcOG",
                    "ESkvdCkCW74",
                    "Cmoyyv3dQH88WQXdoWO",
                    "F0VdKmk8",
                    "CCoPW7G",
                    "W5ObWPTOEa",
                    "n8oZW4tcMdRcLKe9mW",
                    "WORcImkHWPHn",
                    "DCoKW68AvW",
                    "W7pdRI0oW7BdU8ktBmkDkq",
                    "WOCltCkOW4VcRvq",
                    "bmkIW6ix",
                    "CSo7W7FdKSkv",
                    "W6fgkZtdSmk+W6lcKCom",
                    "W6TVgGigW518",
                    "WR1qWQRdQCk7",
                    "CSkIrCkeW5FdRhVcRZm",
                    "W69fB3K9",
                    "W45gmWWj",
                    "WPpcMCk/WRHD",
                    "CmodW6GPEa",
                    "W6vDWO/cRh/cVCkoamkalCoVW4O5",
                    "y0JcTSkAaCkT",
                    "C8oHy2tcGG",
                    "xSkqcCkSBmk6",
                    "q8oKW6Gjya",
                    "pe3cK8oOhgfDjq",
                    "CHmA",
                    "W4SPdCoIW5jWW7hcGwO",
                    "agtdQmkbcW",
                    "WP3dM8k5nW",
                    "nGfNW6yeWQKLea",
                    "WRxcQsaPW53dMedcHCoHzW",
                    "W7zPr0ONcCoH",
                    "W6hdSJac",
                    "leVcNCo4aNbspg0",
                    "FCkxvCkyW6e",
                    "fxjQWPNdSCoY",
                    "ACofW7BdRCkW",
                    "meBcQW",
                    "swZcU8kqWRi",
                  ];
                  return (aV = function () {
                    return aZ;
                  })();
                }
                function aW() {
                  var aZ =
                    arguments["length"] > 0x0 && void 0x0 !== arguments[0x0] ? arguments[0x0] : {};
                  function b0(b5, b6) {
                    return aA(b5, b6 - 0xfa);
                  }
                  var b1 = {
                    GBGnD: function (b5, b6) {
                      return b5 !== b6;
                    },
                    udJzP: b2(0x135, "Uj2C"),
                    ZgnvD: b0("C6fO", 0xcf),
                    OfrrG: function (b5) {
                      return b5();
                    },
                    kkUgg: function (b5, b6) {
                      return b5 + b6;
                    },
                    HFCtH: function (b5, b6) {
                      return b5 + b6;
                    },
                    HNLwA: function (b5, b6) {
                      return b5 * b6;
                    },
                    EYUKP: function (b5, b6) {
                      return b5 * b6;
                    },
                    gzTLW: function (b5) {
                      return b5();
                    },
                    uYtJo: function (b5, b6, b7) {
                      return b5(b6, b7);
                    },
                  };
                  function b2(b5, b6) {
                    return aX(b5 - -0x296, b6);
                  }
                  if (
                    b1[b0(")8Bu", -0x57)](
                      void 0x0 === ac ? "undefined" : a1(ac),
                      b1[b2(-0x123, "F[!2")],
                    )
                  )
                    for (var b3 = b1[b2(0x121, "Uj2C")][b2(-0xfd, "q]CY")]("|"), b4 = 0x0; ; ) {
                      switch (b3[b4++]) {
                        case "0":
                          b1[b2(-0xc7, "dE%z")](aT);
                          continue;
                        case "1":
                          this[b0("7hxe", -0x36) + b0("(f2U", 0x89)](
                            aZ[b2(0x175, "jU*K")] ||
                              b1[b2(-0x71, "ChZ!")](
                                b1[b2(0x8a, "S@lO")](
                                  0xa2072fa666,
                                  b1[b0("ChZ!", -0x182)](0x6e07da5999, -0x1),
                                ),
                                b1[b2(0xe6, "jU*K")](-0x3, -0x32ef27d555),
                              ),
                          );
                          continue;
                        case "2":
                          b1[b0("WWJ$", 0x0)](aQ);
                          continue;
                        case "3":
                          b1[b0("Imsz", -0x17)](aP, a6, ac);
                          continue;
                        case "4":
                          a6 = af[b2(-0xd7, "(meS")]();
                          continue;
                      }
                      break;
                    }
                }
                function aX(aZ, b0) {
                  return aR(aZ - 0x68, b0);
                }
                ((aW[aA("54^6", -0x116)][aA("N)xu", -0x245) + aX(0x27f, "tt&(")] = function (aZ) {
                  ((a8 = af[aA("k&f(", -0x3b)]()), (a7 = aZ));
                }),
                  (aW[aA("1[03", -0x61)][aA(")8Bu", -0xe8)] = ab),
                  (aW[aA("WWJ$", -0x295)][aX(0x184, "QYdW")] = ab),
                  (aW[aX(0x292, "QYdW")][aX(0x390, "EGti") + "k"] = function () {
                    return (
                      aJ[aA("l1Y6", -0x86)]++,
                      {
                        PpEgG: function (aZ) {
                          return aZ();
                        },
                      }[aX(0x25b, "(f2U")](aU)
                    );
                  }),
                  (aW[aA("q]CY", -0xa)][aA("hIzm", -0x179) + aA("SlDP", -0x57)] = function () {
                    var aZ = {
                      NzFgj: function (b0, b1) {
                        return b0(b1);
                      },
                      ZOTby: function (b0) {
                        return b0();
                      },
                    };
                    return new Promise(function (b0) {
                      function b1(b2, b3) {
                        return aR(b2 - -0x249, b3);
                      }
                      (aJ[aR(0x2c4, "DKL#")]++,
                        aZ[b1(0x163, "(f2U")](b0, aZ[b1(0xce, "YYv%")](aU)));
                    });
                  }),
                  aj &&
                    aj[aA("8RnY", -0x46)] &&
                    aj[aX(0x38d, "F[!2")][aX(0x296, "wAHi")] &&
                    (aW[aA("Uj2C", -0x256)][aA("7hxe", 0x13)] = function (aZ) {
                      var b0 = {};
                      function b1(b4, b5) {
                        return aX(b4 - -0x35e, b5);
                      }
                      function b2(b4, b5) {
                        return aX(b5 - -0x41d, b4);
                      }
                      ((b0[b1(0x9d, "WWJ$")] = b1(-0x159, "YxiJ")),
                        (b0[b2("N)xu", -0x114)] = b2("jU*K", -0x9f)),
                        (b0[b2("Uj2C", -0x1be)] = b2("SlDP", -0x181)),
                        (b0[b2("WWJ$", -0x237)] = b1(-0x18, "(meS")),
                        (b0[b1(0x3b, "1*rM")] = b1(0x1d, "S@lO")));
                      var b3 = b0;
                      switch (aZ["type"]) {
                        case b3[b1(-0xa1, "(f2U")]:
                          ar[b2("QovG", -0x37) + "t"](aZ);
                          break;
                        case b3[b1(0x29, "QovG")]:
                        case b3[b2("ChZ!", -0x71)]:
                          as[b1(-0x39, "Q2Sc") + "t"](aZ);
                          break;
                        case b3[b2("q]CY", -0xa8)]:
                        case b3[b2("Pt@f", -0x11c)]:
                          at[b2("54^6", -0x12a) + "t"](aZ);
                      }
                    }));
                var aY = new aW();
                a0[aX(0x220, "DKL#")] = function () {
                  var aZ =
                    arguments["length"] > 0x0 && void 0x0 !== arguments[0x0] ? arguments[0x0] : {};
                  function b0(b1, b2) {
                    return aX(b1 - -0x6e, b2);
                  }
                  return (
                    aZ[b0(0x398, "$nFE")] &&
                      ac &&
                      aY[b0(0x132, "SYaz") + b0(0x12c, "WWJ$")](aZ[b0(0x386, "griD")]),
                    aY
                  );
                };
              })["call"](this, k(0x1)(i));
            },
            function (j, k, m) {
              "use strict";
              var p = m(0x6),
                q = m(0x0),
                v = m(0xa),
                w = m(0x2),
                x = m(0xb),
                y = Object["prototype"]["toString"];
              function z(B) {
                if (!(this instanceof z)) return new z(B);
                this["options"] = q["assign"](
                  {
                    level: -0x1,
                    method: 0x8,
                    chunkSize: 0x4000,
                    windowBits: 0xf,
                    memLevel: 0x8,
                    strategy: 0x0,
                    to: "",
                  },
                  B || {},
                );
                var C = this["options"];
                (C["raw"] && C["windowBits"] > 0x0
                  ? (C["windowBits"] = -C["windowBits"])
                  : C["gzip"] &&
                    C["windowBits"] > 0x0 &&
                    C["windowBits"] < 0x10 &&
                    (C["windowBits"] += 0x10),
                  (this["err"] = 0x0),
                  (this["msg"] = ""),
                  (this["ended"] = !0x1),
                  (this["chunks"] = []),
                  (this["strm"] = new x()),
                  (this["strm"]["avail_out"] = 0x0));
                var D = p["deflateInit2"](
                  this["strm"],
                  C["level"],
                  C["method"],
                  C["windowBits"],
                  C["memLevel"],
                  C["strategy"],
                );
                if (0x0 !== D) throw new Error(w[D]);
                if (
                  (C["header"] && p["deflateSetHeader"](this["strm"], C["header"]), C["dictionary"])
                ) {
                  var E;
                  if (
                    ((E =
                      "string" == typeof C["dictionary"]
                        ? v["string2buf"](C["dictionary"])
                        : "[object\x20ArrayBuffer]" === y["call"](C["dictionary"])
                          ? new Uint8Array(C["dictionary"])
                          : C["dictionary"]),
                    0x0 !== (D = p["deflateSetDictionary"](this["strm"], E)))
                  )
                    throw new Error(w[D]);
                  this["_dict_set"] = !0x0;
                }
              }
              function A(B, C) {
                var D = new z(C);
                if ((D["push"](B, !0x0), D["err"])) throw D["msg"] || w[D["err"]];
                return D["result"];
              }
              ((z["prototype"]["push"] = function (B, C) {
                var D,
                  E,
                  F = this["strm"],
                  G = this["options"]["chunkSize"];
                if (this["ended"]) return !0x1;
                ((E = C === ~~C ? C : !0x0 === C ? 0x4 : 0x0),
                  "string" == typeof B
                    ? (F["input"] = v["string2buf"](B))
                    : "[object\x20ArrayBuffer]" === y["call"](B)
                      ? (F["input"] = new Uint8Array(B))
                      : (F["input"] = B),
                  (F["next_in"] = 0x0),
                  (F["avail_in"] = F["input"]["length"]));
                do {
                  if (
                    (0x0 === F["avail_out"] &&
                      ((F["output"] = new q["Buf8"](G)),
                      (F["next_out"] = 0x0),
                      (F["avail_out"] = G)),
                    0x1 !== (D = p["deflate"](F, E)) && 0x0 !== D)
                  )
                    return (this["onEnd"](D), (this["ended"] = !0x0), !0x1);
                  (0x0 !== F["avail_out"] && (0x0 !== F["avail_in"] || (0x4 !== E && 0x2 !== E))) ||
                    ("string" === this["options"]["to"]
                      ? this["onData"](
                          v["buf2binstring"](q["shrinkBuf"](F["output"], F["next_out"])),
                        )
                      : this["onData"](q["shrinkBuf"](F["output"], F["next_out"])));
                } while ((F["avail_in"] > 0x0 || 0x0 === F["avail_out"]) && 0x1 !== D);
                return 0x4 === E
                  ? ((D = p["deflateEnd"](this["strm"])),
                    this["onEnd"](D),
                    (this["ended"] = !0x0),
                    0x0 === D)
                  : 0x2 !== E || (this["onEnd"](0x0), (F["avail_out"] = 0x0), !0x0);
              }),
                (z["prototype"]["onData"] = function (B) {
                  this["chunks"]["push"](B);
                }),
                (z["prototype"]["onEnd"] = function (B) {
                  (0x0 === B &&
                    ("string" === this["options"]["to"]
                      ? (this["result"] = this["chunks"]["join"](""))
                      : (this["result"] = q["flattenChunks"](this["chunks"]))),
                    (this["chunks"] = []),
                    (this["err"] = B),
                    (this["msg"] = this["strm"]["msg"]));
                }),
                (k["Deflate"] = z),
                (k["deflate"] = A),
                (k["deflateRaw"] = function (B, C) {
                  return (((C = C || {})["raw"] = !0x0), A(B, C));
                }),
                (k["gzip"] = function (B, C) {
                  return (((C = C || {})["gzip"] = !0x0), A(B, C));
                }));
            },
            function (j, q, z) {
              "use strict";
              var A,
                B = z(0x0),
                D = z(0x7),
                F = z(0x8),
                G = z(0x9),
                H = z(0x2),
                I = -0x2,
                J = 0x102,
                K = 0x106,
                L = 0x67,
                M = 0x71,
                N = 0x29a;
              function P(a7, a8) {
                return ((a7["msg"] = H[a8]), a8);
              }
              function Q(a7) {
                return (a7 << 0x1) - (a7 > 0x4 ? 0x9 : 0x0);
              }
              function R(a7) {
                for (var a8 = a7["length"]; --a8 >= 0x0; ) a7[a8] = 0x0;
              }
              function U(a7) {
                var a8 = a7["state"],
                  a9 = a8["pending"];
                (a9 > a7["avail_out"] && (a9 = a7["avail_out"]),
                  0x0 !== a9 &&
                    (B["arraySet"](
                      a7["output"],
                      a8["pending_buf"],
                      a8["pending_out"],
                      a9,
                      a7["next_out"],
                    ),
                    (a7["next_out"] += a9),
                    (a8["pending_out"] += a9),
                    (a7["total_out"] += a9),
                    (a7["avail_out"] -= a9),
                    (a8["pending"] -= a9),
                    0x0 === a8["pending"] && (a8["pending_out"] = 0x0)));
              }
              function V(a7, a8) {
                (D["_tr_flush_block"](
                  a7,
                  a7["block_start"] >= 0x0 ? a7["block_start"] : -0x1,
                  a7["strstart"] - a7["block_start"],
                  a8,
                ),
                  (a7["block_start"] = a7["strstart"]),
                  U(a7["strm"]));
              }
              function X(a7, a8) {
                a7["pending_buf"][a7["pending"]++] = a8;
              }
              function Y(a7, a8) {
                ((a7["pending_buf"][a7["pending"]++] = (a8 >>> 0x8) & 0xff),
                  (a7["pending_buf"][a7["pending"]++] = 0xff & a8));
              }
              function Z(a7, a8) {
                var a9,
                  aa,
                  ab = a7["max_chain_length"],
                  ac = a7["strstart"],
                  ad = a7["prev_length"],
                  ae = a7["nice_match"],
                  af =
                    a7["strstart"] > a7["w_size"] - K ? a7["strstart"] - (a7["w_size"] - K) : 0x0,
                  ag = a7["window"],
                  ah = a7["w_mask"],
                  ai = a7["prev"],
                  aj = a7["strstart"] + J,
                  ak = ag[ac + ad - 0x1],
                  al = ag[ac + ad];
                (a7["prev_length"] >= a7["good_match"] && (ab >>= 0x2),
                  ae > a7["lookahead"] && (ae = a7["lookahead"]));
                do {
                  if (
                    ag[(a9 = a8) + ad] === al &&
                    ag[a9 + ad - 0x1] === ak &&
                    ag[a9] === ag[ac] &&
                    ag[++a9] === ag[ac + 0x1]
                  ) {
                    ((ac += 0x2), a9++);
                    do {} while (
                      ag[++ac] === ag[++a9] &&
                      ag[++ac] === ag[++a9] &&
                      ag[++ac] === ag[++a9] &&
                      ag[++ac] === ag[++a9] &&
                      ag[++ac] === ag[++a9] &&
                      ag[++ac] === ag[++a9] &&
                      ag[++ac] === ag[++a9] &&
                      ag[++ac] === ag[++a9] &&
                      ac < aj
                    );
                    if (((aa = J - (aj - ac)), (ac = aj - J), aa > ad)) {
                      if (((a7["match_start"] = a8), (ad = aa), aa >= ae)) break;
                      ((ak = ag[ac + ad - 0x1]), (al = ag[ac + ad]));
                    }
                  }
                } while ((a8 = ai[a8 & ah]) > af && 0x0 != --ab);
                return ad <= a7["lookahead"] ? ad : a7["lookahead"];
              }
              function a0(a7) {
                var a8,
                  a9,
                  aa,
                  ab,
                  ac,
                  ad,
                  ae,
                  af,
                  ag,
                  ah,
                  ai = a7["w_size"];
                do {
                  if (
                    ((ab = a7["window_size"] - a7["lookahead"] - a7["strstart"]),
                    a7["strstart"] >= ai + (ai - K))
                  ) {
                    (B["arraySet"](a7["window"], a7["window"], ai, ai, 0x0),
                      (a7["match_start"] -= ai),
                      (a7["strstart"] -= ai),
                      (a7["block_start"] -= ai),
                      (a8 = a9 = a7["hash_size"]));
                    do {
                      ((aa = a7["head"][--a8]), (a7["head"][a8] = aa >= ai ? aa - ai : 0x0));
                    } while (--a9);
                    a8 = a9 = ai;
                    do {
                      ((aa = a7["prev"][--a8]), (a7["prev"][a8] = aa >= ai ? aa - ai : 0x0));
                    } while (--a9);
                    ab += ai;
                  }
                  if (0x0 === a7["strm"]["avail_in"]) break;
                  if (
                    ((ad = a7["strm"]),
                    (ae = a7["window"]),
                    (af = a7["strstart"] + a7["lookahead"]),
                    (ag = ab),
                    (ah = void 0x0),
                    (ah = ad["avail_in"]) > ag && (ah = ag),
                    (a9 =
                      0x0 === ah
                        ? 0x0
                        : ((ad["avail_in"] -= ah),
                          B["arraySet"](ae, ad["input"], ad["next_in"], ah, af),
                          0x1 === ad["state"]["wrap"]
                            ? (ad["adler"] = F(ad["adler"], ae, ah, af))
                            : 0x2 === ad["state"]["wrap"] &&
                              (ad["adler"] = G(ad["adler"], ae, ah, af)),
                          (ad["next_in"] += ah),
                          (ad["total_in"] += ah),
                          ah)),
                    (a7["lookahead"] += a9),
                    a7["lookahead"] + a7["insert"] >= 0x3)
                  ) {
                    for (
                      ac = a7["strstart"] - a7["insert"],
                        a7["ins_h"] = a7["window"][ac],
                        a7["ins_h"] =
                          ((a7["ins_h"] << a7["hash_shift"]) ^ a7["window"][ac + 0x1]) &
                          a7["hash_mask"];
                      a7["insert"] &&
                      ((a7["ins_h"] =
                        ((a7["ins_h"] << a7["hash_shift"]) ^ a7["window"][ac + 0x3 - 0x1]) &
                        a7["hash_mask"]),
                      (a7["prev"][ac & a7["w_mask"]] = a7["head"][a7["ins_h"]]),
                      (a7["head"][a7["ins_h"]] = ac),
                      ac++,
                      a7["insert"]--,
                      !(a7["lookahead"] + a7["insert"] < 0x3));
                    );
                  }
                } while (a7["lookahead"] < K && 0x0 !== a7["strm"]["avail_in"]);
              }
              function a1(a7, a8) {
                for (var a9, aa; ; ) {
                  if (a7["lookahead"] < K) {
                    if ((a0(a7), a7["lookahead"] < K && 0x0 === a8)) return 0x1;
                    if (0x0 === a7["lookahead"]) break;
                  }
                  if (
                    ((a9 = 0x0),
                    a7["lookahead"] >= 0x3 &&
                      ((a7["ins_h"] =
                        ((a7["ins_h"] << a7["hash_shift"]) ^
                          a7["window"][a7["strstart"] + 0x3 - 0x1]) &
                        a7["hash_mask"]),
                      (a9 = a7["prev"][a7["strstart"] & a7["w_mask"]] = a7["head"][a7["ins_h"]]),
                      (a7["head"][a7["ins_h"]] = a7["strstart"])),
                    0x0 !== a9 &&
                      a7["strstart"] - a9 <= a7["w_size"] - K &&
                      (a7["match_length"] = Z(a7, a9)),
                    a7["match_length"] >= 0x3)
                  ) {
                    if (
                      ((aa = D["_tr_tally"](
                        a7,
                        a7["strstart"] - a7["match_start"],
                        a7["match_length"] - 0x3,
                      )),
                      (a7["lookahead"] -= a7["match_length"]),
                      a7["match_length"] <= a7["max_lazy_match"] && a7["lookahead"] >= 0x3)
                    ) {
                      a7["match_length"]--;
                      do {
                        (a7["strstart"]++,
                          (a7["ins_h"] =
                            ((a7["ins_h"] << a7["hash_shift"]) ^
                              a7["window"][a7["strstart"] + 0x3 - 0x1]) &
                            a7["hash_mask"]),
                          (a9 = a7["prev"][a7["strstart"] & a7["w_mask"]] =
                            a7["head"][a7["ins_h"]]),
                          (a7["head"][a7["ins_h"]] = a7["strstart"]));
                      } while (0x0 != --a7["match_length"]);
                      a7["strstart"]++;
                    } else
                      ((a7["strstart"] += a7["match_length"]),
                        (a7["match_length"] = 0x0),
                        (a7["ins_h"] = a7["window"][a7["strstart"]]),
                        (a7["ins_h"] =
                          ((a7["ins_h"] << a7["hash_shift"]) ^ a7["window"][a7["strstart"] + 0x1]) &
                          a7["hash_mask"]));
                  } else
                    ((aa = D["_tr_tally"](a7, 0x0, a7["window"][a7["strstart"]])),
                      a7["lookahead"]--,
                      a7["strstart"]++);
                  if (aa && (V(a7, !0x1), 0x0 === a7["strm"]["avail_out"])) return 0x1;
                }
                return (
                  (a7["insert"] = a7["strstart"] < 0x2 ? a7["strstart"] : 0x2),
                  0x4 === a8
                    ? (V(a7, !0x0), 0x0 === a7["strm"]["avail_out"] ? 0x3 : 0x4)
                    : a7["last_lit"] && (V(a7, !0x1), 0x0 === a7["strm"]["avail_out"])
                      ? 0x1
                      : 0x2
                );
              }
              function a2(a7, a8) {
                for (var a9, aa, ab; ; ) {
                  if (a7["lookahead"] < K) {
                    if ((a0(a7), a7["lookahead"] < K && 0x0 === a8)) return 0x1;
                    if (0x0 === a7["lookahead"]) break;
                  }
                  if (
                    ((a9 = 0x0),
                    a7["lookahead"] >= 0x3 &&
                      ((a7["ins_h"] =
                        ((a7["ins_h"] << a7["hash_shift"]) ^
                          a7["window"][a7["strstart"] + 0x3 - 0x1]) &
                        a7["hash_mask"]),
                      (a9 = a7["prev"][a7["strstart"] & a7["w_mask"]] = a7["head"][a7["ins_h"]]),
                      (a7["head"][a7["ins_h"]] = a7["strstart"])),
                    (a7["prev_length"] = a7["match_length"]),
                    (a7["prev_match"] = a7["match_start"]),
                    (a7["match_length"] = 0x2),
                    0x0 !== a9 &&
                      a7["prev_length"] < a7["max_lazy_match"] &&
                      a7["strstart"] - a9 <= a7["w_size"] - K &&
                      ((a7["match_length"] = Z(a7, a9)),
                      a7["match_length"] <= 0x5 &&
                        (0x1 === a7["strategy"] ||
                          (0x3 === a7["match_length"] &&
                            a7["strstart"] - a7["match_start"] > 0x1000)) &&
                        (a7["match_length"] = 0x2)),
                    a7["prev_length"] >= 0x3 && a7["match_length"] <= a7["prev_length"])
                  ) {
                    ((ab = a7["strstart"] + a7["lookahead"] - 0x3),
                      (aa = D["_tr_tally"](
                        a7,
                        a7["strstart"] - 0x1 - a7["prev_match"],
                        a7["prev_length"] - 0x3,
                      )),
                      (a7["lookahead"] -= a7["prev_length"] - 0x1),
                      (a7["prev_length"] -= 0x2));
                    do {
                      ++a7["strstart"] <= ab &&
                        ((a7["ins_h"] =
                          ((a7["ins_h"] << a7["hash_shift"]) ^
                            a7["window"][a7["strstart"] + 0x3 - 0x1]) &
                          a7["hash_mask"]),
                        (a9 = a7["prev"][a7["strstart"] & a7["w_mask"]] = a7["head"][a7["ins_h"]]),
                        (a7["head"][a7["ins_h"]] = a7["strstart"]));
                    } while (0x0 != --a7["prev_length"]);
                    if (
                      ((a7["match_available"] = 0x0),
                      (a7["match_length"] = 0x2),
                      a7["strstart"]++,
                      aa && (V(a7, !0x1), 0x0 === a7["strm"]["avail_out"]))
                    )
                      return 0x1;
                  } else {
                    if (a7["match_available"]) {
                      if (
                        ((aa = D["_tr_tally"](a7, 0x0, a7["window"][a7["strstart"] - 0x1])) &&
                          V(a7, !0x1),
                        a7["strstart"]++,
                        a7["lookahead"]--,
                        0x0 === a7["strm"]["avail_out"])
                      )
                        return 0x1;
                    } else ((a7["match_available"] = 0x1), a7["strstart"]++, a7["lookahead"]--);
                  }
                }
                return (
                  a7["match_available"] &&
                    ((aa = D["_tr_tally"](a7, 0x0, a7["window"][a7["strstart"] - 0x1])),
                    (a7["match_available"] = 0x0)),
                  (a7["insert"] = a7["strstart"] < 0x2 ? a7["strstart"] : 0x2),
                  0x4 === a8
                    ? (V(a7, !0x0), 0x0 === a7["strm"]["avail_out"] ? 0x3 : 0x4)
                    : a7["last_lit"] && (V(a7, !0x1), 0x0 === a7["strm"]["avail_out"])
                      ? 0x1
                      : 0x2
                );
              }
              function a3(a7, a8, a9, aa, ab) {
                ((this["good_length"] = a7),
                  (this["max_lazy"] = a8),
                  (this["nice_length"] = a9),
                  (this["max_chain"] = aa),
                  (this["func"] = ab));
              }
              function a4(a7) {
                var a8;
                return a7 && a7["state"]
                  ? ((a7["total_in"] = a7["total_out"] = 0x0),
                    (a7["data_type"] = 0x2),
                    ((a8 = a7["state"])["pending"] = 0x0),
                    (a8["pending_out"] = 0x0),
                    a8["wrap"] < 0x0 && (a8["wrap"] = -a8["wrap"]),
                    (a8["status"] = a8["wrap"] ? 0x2a : M),
                    (a7["adler"] = 0x2 === a8["wrap"] ? 0x0 : 0x1),
                    (a8["last_flush"] = 0x0),
                    D["_tr_init"](a8),
                    0x0)
                  : P(a7, I);
              }
              function a5(a7) {
                var a8,
                  a9 = a4(a7);
                return (
                  0x0 === a9 &&
                    (((a8 = a7["state"])["window_size"] = 0x2 * a8["w_size"]),
                    R(a8["head"]),
                    (a8["max_lazy_match"] = A[a8["level"]]["max_lazy"]),
                    (a8["good_match"] = A[a8["level"]]["good_length"]),
                    (a8["nice_match"] = A[a8["level"]]["nice_length"]),
                    (a8["max_chain_length"] = A[a8["level"]]["max_chain"]),
                    (a8["strstart"] = 0x0),
                    (a8["block_start"] = 0x0),
                    (a8["lookahead"] = 0x0),
                    (a8["insert"] = 0x0),
                    (a8["match_length"] = a8["prev_length"] = 0x2),
                    (a8["match_available"] = 0x0),
                    (a8["ins_h"] = 0x0)),
                  a9
                );
              }
              function a6(a7, a8, a9, aa, ab, ac) {
                if (!a7) return I;
                var ad = 0x1;
                if (
                  (-0x1 === a8 && (a8 = 0x6),
                  aa < 0x0 ? ((ad = 0x0), (aa = -aa)) : aa > 0xf && ((ad = 0x2), (aa -= 0x10)),
                  ab < 0x1 ||
                    ab > 0x9 ||
                    0x8 !== a9 ||
                    aa < 0x8 ||
                    aa > 0xf ||
                    a8 < 0x0 ||
                    a8 > 0x9 ||
                    ac < 0x0 ||
                    ac > 0x4)
                )
                  return P(a7, I);
                0x8 === aa && (aa = 0x9);
                var ae = new (function () {
                  ((this["strm"] = null),
                    (this["status"] = 0x0),
                    (this["pending_buf"] = null),
                    (this["pending_buf_size"] = 0x0),
                    (this["pending_out"] = 0x0),
                    (this["pending"] = 0x0),
                    (this["wrap"] = 0x0),
                    (this["gzhead"] = null),
                    (this["gzindex"] = 0x0),
                    (this["method"] = 0x8),
                    (this["last_flush"] = -0x1),
                    (this["w_size"] = 0x0),
                    (this["w_bits"] = 0x0),
                    (this["w_mask"] = 0x0),
                    (this["window"] = null),
                    (this["window_size"] = 0x0),
                    (this["prev"] = null),
                    (this["head"] = null),
                    (this["ins_h"] = 0x0),
                    (this["hash_size"] = 0x0),
                    (this["hash_bits"] = 0x0),
                    (this["hash_mask"] = 0x0),
                    (this["hash_shift"] = 0x0),
                    (this["block_start"] = 0x0),
                    (this["match_length"] = 0x0),
                    (this["prev_match"] = 0x0),
                    (this["match_available"] = 0x0),
                    (this["strstart"] = 0x0),
                    (this["match_start"] = 0x0),
                    (this["lookahead"] = 0x0),
                    (this["prev_length"] = 0x0),
                    (this["max_chain_length"] = 0x0),
                    (this["max_lazy_match"] = 0x0),
                    (this["level"] = 0x0),
                    (this["strategy"] = 0x0),
                    (this["good_match"] = 0x0),
                    (this["nice_match"] = 0x0),
                    (this["dyn_ltree"] = new B["Buf16"](0x47a)),
                    (this["dyn_dtree"] = new B["Buf16"](0x7a)),
                    (this["bl_tree"] = new B["Buf16"](0x4e)),
                    R(this["dyn_ltree"]),
                    R(this["dyn_dtree"]),
                    R(this["bl_tree"]),
                    (this["l_desc"] = null),
                    (this["d_desc"] = null),
                    (this["bl_desc"] = null),
                    (this["bl_count"] = new B["Buf16"](0x10)),
                    (this["heap"] = new B["Buf16"](0x23d)),
                    R(this["heap"]),
                    (this["heap_len"] = 0x0),
                    (this["heap_max"] = 0x0),
                    (this["depth"] = new B["Buf16"](0x23d)),
                    R(this["depth"]),
                    (this["l_buf"] = 0x0),
                    (this["lit_bufsize"] = 0x0),
                    (this["last_lit"] = 0x0),
                    (this["d_buf"] = 0x0),
                    (this["opt_len"] = 0x0),
                    (this["static_len"] = 0x0),
                    (this["matches"] = 0x0),
                    (this["insert"] = 0x0),
                    (this["bi_buf"] = 0x0),
                    (this["bi_valid"] = 0x0));
                })();
                return (
                  (a7["state"] = ae),
                  (ae["strm"] = a7),
                  (ae["wrap"] = ad),
                  (ae["gzhead"] = null),
                  (ae["w_bits"] = aa),
                  (ae["w_size"] = 0x1 << ae["w_bits"]),
                  (ae["w_mask"] = ae["w_size"] - 0x1),
                  (ae["hash_bits"] = ab + 0x7),
                  (ae["hash_size"] = 0x1 << ae["hash_bits"]),
                  (ae["hash_mask"] = ae["hash_size"] - 0x1),
                  (ae["hash_shift"] = ~~((ae["hash_bits"] + 0x3 - 0x1) / 0x3)),
                  (ae["window"] = new B["Buf8"](0x2 * ae["w_size"])),
                  (ae["head"] = new B["Buf16"](ae["hash_size"])),
                  (ae["prev"] = new B["Buf16"](ae["w_size"])),
                  (ae["lit_bufsize"] = 0x1 << (ab + 0x6)),
                  (ae["pending_buf_size"] = 0x4 * ae["lit_bufsize"]),
                  (ae["pending_buf"] = new B["Buf8"](ae["pending_buf_size"])),
                  (ae["d_buf"] = 0x1 * ae["lit_bufsize"]),
                  (ae["l_buf"] = 0x3 * ae["lit_bufsize"]),
                  (ae["level"] = a8),
                  (ae["strategy"] = ac),
                  (ae["method"] = a9),
                  a5(a7)
                );
              }
              ((A = [
                new a3(0x0, 0x0, 0x0, 0x0, function (a7, a8) {
                  var a9 = 0xffff;
                  for (
                    a9 > a7["pending_buf_size"] - 0x5 && (a9 = a7["pending_buf_size"] - 0x5);
                    ;
                  ) {
                    if (a7["lookahead"] <= 0x1) {
                      if ((a0(a7), 0x0 === a7["lookahead"] && 0x0 === a8)) return 0x1;
                      if (0x0 === a7["lookahead"]) break;
                    }
                    ((a7["strstart"] += a7["lookahead"]), (a7["lookahead"] = 0x0));
                    var aa = a7["block_start"] + a9;
                    if (
                      (0x0 === a7["strstart"] || a7["strstart"] >= aa) &&
                      ((a7["lookahead"] = a7["strstart"] - aa),
                      (a7["strstart"] = aa),
                      V(a7, !0x1),
                      0x0 === a7["strm"]["avail_out"])
                    )
                      return 0x1;
                    if (
                      a7["strstart"] - a7["block_start"] >= a7["w_size"] - K &&
                      (V(a7, !0x1), 0x0 === a7["strm"]["avail_out"])
                    )
                      return 0x1;
                  }
                  return (
                    (a7["insert"] = 0x0),
                    0x4 === a8
                      ? (V(a7, !0x0), 0x0 === a7["strm"]["avail_out"] ? 0x3 : 0x4)
                      : (a7["strstart"] > a7["block_start"] &&
                          (V(a7, !0x1), a7["strm"]["avail_out"]),
                        0x1)
                  );
                }),
                new a3(0x4, 0x4, 0x8, 0x4, a1),
                new a3(0x4, 0x5, 0x10, 0x8, a1),
                new a3(0x4, 0x6, 0x20, 0x20, a1),
                new a3(0x4, 0x4, 0x10, 0x10, a2),
                new a3(0x8, 0x10, 0x20, 0x20, a2),
                new a3(0x8, 0x10, 0x80, 0x80, a2),
                new a3(0x8, 0x20, 0x80, 0x100, a2),
                new a3(0x20, 0x80, 0x102, 0x400, a2),
                new a3(0x20, 0x102, 0x102, 0x1000, a2),
              ]),
                (q["deflateInit"] = function (a7, a8) {
                  return a6(a7, a8, 0x8, 0xf, 0x8, 0x0);
                }),
                (q["deflateInit2"] = a6),
                (q["deflateReset"] = a5),
                (q["deflateResetKeep"] = a4),
                (q["deflateSetHeader"] = function (a7, a8) {
                  return a7 && a7["state"]
                    ? 0x2 !== a7["state"]["wrap"]
                      ? I
                      : ((a7["state"]["gzhead"] = a8), 0x0)
                    : I;
                }),
                (q["deflate"] = function (a7, a8) {
                  var a9, aa, ab, ac;
                  if (!a7 || !a7["state"] || a8 > 0x5 || a8 < 0x0) return a7 ? P(a7, I) : I;
                  if (
                    ((aa = a7["state"]),
                    !a7["output"] ||
                      (!a7["input"] && 0x0 !== a7["avail_in"]) ||
                      (aa["status"] === N && 0x4 !== a8))
                  )
                    return P(a7, 0x0 === a7["avail_out"] ? -0x5 : I);
                  if (
                    ((aa["strm"] = a7),
                    (a9 = aa["last_flush"]),
                    (aa["last_flush"] = a8),
                    0x2a === aa["status"])
                  ) {
                    if (0x2 === aa["wrap"])
                      ((a7["adler"] = 0x0),
                        X(aa, 0x1f),
                        X(aa, 0x8b),
                        X(aa, 0x8),
                        aa["gzhead"]
                          ? (X(
                              aa,
                              (aa["gzhead"]["text"] ? 0x1 : 0x0) +
                                (aa["gzhead"]["hcrc"] ? 0x2 : 0x0) +
                                (aa["gzhead"]["extra"] ? 0x4 : 0x0) +
                                (aa["gzhead"]["name"] ? 0x8 : 0x0) +
                                (aa["gzhead"]["comment"] ? 0x10 : 0x0),
                            ),
                            X(aa, 0xff & aa["gzhead"]["time"]),
                            X(aa, (aa["gzhead"]["time"] >> 0x8) & 0xff),
                            X(aa, (aa["gzhead"]["time"] >> 0x10) & 0xff),
                            X(aa, (aa["gzhead"]["time"] >> 0x18) & 0xff),
                            X(
                              aa,
                              0x9 === aa["level"]
                                ? 0x2
                                : aa["strategy"] >= 0x2 || aa["level"] < 0x2
                                  ? 0x4
                                  : 0x0,
                            ),
                            X(aa, 0xff & aa["gzhead"]["os"]),
                            aa["gzhead"]["extra"] &&
                              aa["gzhead"]["extra"]["length"] &&
                              (X(aa, 0xff & aa["gzhead"]["extra"]["length"]),
                              X(aa, (aa["gzhead"]["extra"]["length"] >> 0x8) & 0xff)),
                            aa["gzhead"]["hcrc"] &&
                              (a7["adler"] = G(a7["adler"], aa["pending_buf"], aa["pending"], 0x0)),
                            (aa["gzindex"] = 0x0),
                            (aa["status"] = 0x45))
                          : (X(aa, 0x0),
                            X(aa, 0x0),
                            X(aa, 0x0),
                            X(aa, 0x0),
                            X(aa, 0x0),
                            X(
                              aa,
                              0x9 === aa["level"]
                                ? 0x2
                                : aa["strategy"] >= 0x2 || aa["level"] < 0x2
                                  ? 0x4
                                  : 0x0,
                            ),
                            X(aa, 0x3),
                            (aa["status"] = M)));
                    else {
                      var ad = (0x8 + ((aa["w_bits"] - 0x8) << 0x4)) << 0x8;
                      ((ad |=
                        (aa["strategy"] >= 0x2 || aa["level"] < 0x2
                          ? 0x0
                          : aa["level"] < 0x6
                            ? 0x1
                            : 0x6 === aa["level"]
                              ? 0x2
                              : 0x3) << 0x6),
                        0x0 !== aa["strstart"] && (ad |= 0x20),
                        (ad += 0x1f - (ad % 0x1f)),
                        (aa["status"] = M),
                        Y(aa, ad),
                        0x0 !== aa["strstart"] &&
                          (Y(aa, a7["adler"] >>> 0x10), Y(aa, 0xffff & a7["adler"])),
                        (a7["adler"] = 0x1));
                    }
                  }
                  if (0x45 === aa["status"]) {
                    if (aa["gzhead"]["extra"]) {
                      for (
                        ab = aa["pending"];
                        aa["gzindex"] < (0xffff & aa["gzhead"]["extra"]["length"]) &&
                        (aa["pending"] !== aa["pending_buf_size"] ||
                          (aa["gzhead"]["hcrc"] &&
                            aa["pending"] > ab &&
                            (a7["adler"] = G(
                              a7["adler"],
                              aa["pending_buf"],
                              aa["pending"] - ab,
                              ab,
                            )),
                          U(a7),
                          (ab = aa["pending"]),
                          aa["pending"] !== aa["pending_buf_size"]));
                      )
                        (X(aa, 0xff & aa["gzhead"]["extra"][aa["gzindex"]]), aa["gzindex"]++);
                      (aa["gzhead"]["hcrc"] &&
                        aa["pending"] > ab &&
                        (a7["adler"] = G(a7["adler"], aa["pending_buf"], aa["pending"] - ab, ab)),
                        aa["gzindex"] === aa["gzhead"]["extra"]["length"] &&
                          ((aa["gzindex"] = 0x0), (aa["status"] = 0x49)));
                    } else aa["status"] = 0x49;
                  }
                  if (0x49 === aa["status"]) {
                    if (aa["gzhead"]["name"]) {
                      ab = aa["pending"];
                      do {
                        if (
                          aa["pending"] === aa["pending_buf_size"] &&
                          (aa["gzhead"]["hcrc"] &&
                            aa["pending"] > ab &&
                            (a7["adler"] = G(
                              a7["adler"],
                              aa["pending_buf"],
                              aa["pending"] - ab,
                              ab,
                            )),
                          U(a7),
                          (ab = aa["pending"]),
                          aa["pending"] === aa["pending_buf_size"])
                        ) {
                          ac = 0x1;
                          break;
                        }
                        ((ac =
                          aa["gzindex"] < aa["gzhead"]["name"]["length"]
                            ? 0xff & aa["gzhead"]["name"]["charCodeAt"](aa["gzindex"]++)
                            : 0x0),
                          X(aa, ac));
                      } while (0x0 !== ac);
                      (aa["gzhead"]["hcrc"] &&
                        aa["pending"] > ab &&
                        (a7["adler"] = G(a7["adler"], aa["pending_buf"], aa["pending"] - ab, ab)),
                        0x0 === ac && ((aa["gzindex"] = 0x0), (aa["status"] = 0x5b)));
                    } else aa["status"] = 0x5b;
                  }
                  if (0x5b === aa["status"]) {
                    if (aa["gzhead"]["comment"]) {
                      ab = aa["pending"];
                      do {
                        if (
                          aa["pending"] === aa["pending_buf_size"] &&
                          (aa["gzhead"]["hcrc"] &&
                            aa["pending"] > ab &&
                            (a7["adler"] = G(
                              a7["adler"],
                              aa["pending_buf"],
                              aa["pending"] - ab,
                              ab,
                            )),
                          U(a7),
                          (ab = aa["pending"]),
                          aa["pending"] === aa["pending_buf_size"])
                        ) {
                          ac = 0x1;
                          break;
                        }
                        ((ac =
                          aa["gzindex"] < aa["gzhead"]["comment"]["length"]
                            ? 0xff & aa["gzhead"]["comment"]["charCodeAt"](aa["gzindex"]++)
                            : 0x0),
                          X(aa, ac));
                      } while (0x0 !== ac);
                      (aa["gzhead"]["hcrc"] &&
                        aa["pending"] > ab &&
                        (a7["adler"] = G(a7["adler"], aa["pending_buf"], aa["pending"] - ab, ab)),
                        0x0 === ac && (aa["status"] = L));
                    } else aa["status"] = L;
                  }
                  if (
                    (aa["status"] === L &&
                      (aa["gzhead"]["hcrc"]
                        ? (aa["pending"] + 0x2 > aa["pending_buf_size"] && U(a7),
                          aa["pending"] + 0x2 <= aa["pending_buf_size"] &&
                            (X(aa, 0xff & a7["adler"]),
                            X(aa, (a7["adler"] >> 0x8) & 0xff),
                            (a7["adler"] = 0x0),
                            (aa["status"] = M)))
                        : (aa["status"] = M)),
                    0x0 !== aa["pending"])
                  ) {
                    if ((U(a7), 0x0 === a7["avail_out"])) return ((aa["last_flush"] = -0x1), 0x0);
                  } else {
                    if (0x0 === a7["avail_in"] && Q(a8) <= Q(a9) && 0x4 !== a8) return P(a7, -0x5);
                  }
                  if (aa["status"] === N && 0x0 !== a7["avail_in"]) return P(a7, -0x5);
                  if (
                    0x0 !== a7["avail_in"] ||
                    0x0 !== aa["lookahead"] ||
                    (0x0 !== a8 && aa["status"] !== N)
                  ) {
                    var ae =
                      0x2 === aa["strategy"]
                        ? (function (af, ag) {
                            for (var ah; ; ) {
                              if (0x0 === af["lookahead"] && (a0(af), 0x0 === af["lookahead"])) {
                                if (0x0 === ag) return 0x1;
                                break;
                              }
                              if (
                                ((af["match_length"] = 0x0),
                                (ah = D["_tr_tally"](af, 0x0, af["window"][af["strstart"]])),
                                af["lookahead"]--,
                                af["strstart"]++,
                                ah && (V(af, !0x1), 0x0 === af["strm"]["avail_out"]))
                              )
                                return 0x1;
                            }
                            return (
                              (af["insert"] = 0x0),
                              0x4 === ag
                                ? (V(af, !0x0), 0x0 === af["strm"]["avail_out"] ? 0x3 : 0x4)
                                : af["last_lit"] && (V(af, !0x1), 0x0 === af["strm"]["avail_out"])
                                  ? 0x1
                                  : 0x2
                            );
                          })(aa, a8)
                        : 0x3 === aa["strategy"]
                          ? (function (af, ag) {
                              for (var ah, ai, aj, ak, al = af["window"]; ; ) {
                                if (af["lookahead"] <= J) {
                                  if ((a0(af), af["lookahead"] <= J && 0x0 === ag)) return 0x1;
                                  if (0x0 === af["lookahead"]) break;
                                }
                                if (
                                  ((af["match_length"] = 0x0),
                                  af["lookahead"] >= 0x3 &&
                                    af["strstart"] > 0x0 &&
                                    (ai = al[(aj = af["strstart"] - 0x1)]) === al[++aj] &&
                                    ai === al[++aj] &&
                                    ai === al[++aj])
                                ) {
                                  ak = af["strstart"] + J;
                                  do {} while (
                                    ai === al[++aj] &&
                                    ai === al[++aj] &&
                                    ai === al[++aj] &&
                                    ai === al[++aj] &&
                                    ai === al[++aj] &&
                                    ai === al[++aj] &&
                                    ai === al[++aj] &&
                                    ai === al[++aj] &&
                                    aj < ak
                                  );
                                  ((af["match_length"] = J - (ak - aj)),
                                    af["match_length"] > af["lookahead"] &&
                                      (af["match_length"] = af["lookahead"]));
                                }
                                if (
                                  (af["match_length"] >= 0x3
                                    ? ((ah = D["_tr_tally"](af, 0x1, af["match_length"] - 0x3)),
                                      (af["lookahead"] -= af["match_length"]),
                                      (af["strstart"] += af["match_length"]),
                                      (af["match_length"] = 0x0))
                                    : ((ah = D["_tr_tally"](af, 0x0, af["window"][af["strstart"]])),
                                      af["lookahead"]--,
                                      af["strstart"]++),
                                  ah && (V(af, !0x1), 0x0 === af["strm"]["avail_out"]))
                                )
                                  return 0x1;
                              }
                              return (
                                (af["insert"] = 0x0),
                                0x4 === ag
                                  ? (V(af, !0x0), 0x0 === af["strm"]["avail_out"] ? 0x3 : 0x4)
                                  : af["last_lit"] && (V(af, !0x1), 0x0 === af["strm"]["avail_out"])
                                    ? 0x1
                                    : 0x2
                              );
                            })(aa, a8)
                          : A[aa["level"]]["func"](aa, a8);
                    if (
                      ((0x3 !== ae && 0x4 !== ae) || (aa["status"] = N), 0x1 === ae || 0x3 === ae)
                    )
                      return (0x0 === a7["avail_out"] && (aa["last_flush"] = -0x1), 0x0);
                    if (
                      0x2 === ae &&
                      (0x1 === a8
                        ? D["_tr_align"](aa)
                        : 0x5 !== a8 &&
                          (D["_tr_stored_block"](aa, 0x0, 0x0, !0x1),
                          0x3 === a8 &&
                            (R(aa["head"]),
                            0x0 === aa["lookahead"] &&
                              ((aa["strstart"] = 0x0),
                              (aa["block_start"] = 0x0),
                              (aa["insert"] = 0x0)))),
                      U(a7),
                      0x0 === a7["avail_out"])
                    )
                      return ((aa["last_flush"] = -0x1), 0x0);
                  }
                  return 0x4 !== a8
                    ? 0x0
                    : aa["wrap"] <= 0x0
                      ? 0x1
                      : (0x2 === aa["wrap"]
                          ? (X(aa, 0xff & a7["adler"]),
                            X(aa, (a7["adler"] >> 0x8) & 0xff),
                            X(aa, (a7["adler"] >> 0x10) & 0xff),
                            X(aa, (a7["adler"] >> 0x18) & 0xff),
                            X(aa, 0xff & a7["total_in"]),
                            X(aa, (a7["total_in"] >> 0x8) & 0xff),
                            X(aa, (a7["total_in"] >> 0x10) & 0xff),
                            X(aa, (a7["total_in"] >> 0x18) & 0xff))
                          : (Y(aa, a7["adler"] >>> 0x10), Y(aa, 0xffff & a7["adler"])),
                        U(a7),
                        aa["wrap"] > 0x0 && (aa["wrap"] = -aa["wrap"]),
                        0x0 !== aa["pending"] ? 0x0 : 0x1);
                }),
                (q["deflateEnd"] = function (a7) {
                  var a8;
                  return a7 && a7["state"]
                    ? 0x2a !== (a8 = a7["state"]["status"]) &&
                      0x45 !== a8 &&
                      0x49 !== a8 &&
                      0x5b !== a8 &&
                      a8 !== L &&
                      a8 !== M &&
                      a8 !== N
                      ? P(a7, I)
                      : ((a7["state"] = null), a8 === M ? P(a7, -0x3) : 0x0)
                    : I;
                }),
                (q["deflateSetDictionary"] = function (a7, a8) {
                  var a9,
                    aa,
                    ab,
                    ac,
                    ad,
                    ae,
                    af,
                    ag,
                    ah = a8["length"];
                  if (!a7 || !a7["state"]) return I;
                  if (
                    0x2 === (ac = (a9 = a7["state"])["wrap"]) ||
                    (0x1 === ac && 0x2a !== a9["status"]) ||
                    a9["lookahead"]
                  )
                    return I;
                  for (
                    0x1 === ac && (a7["adler"] = F(a7["adler"], a8, ah, 0x0)),
                      a9["wrap"] = 0x0,
                      ah >= a9["w_size"] &&
                        (0x0 === ac &&
                          (R(a9["head"]),
                          (a9["strstart"] = 0x0),
                          (a9["block_start"] = 0x0),
                          (a9["insert"] = 0x0)),
                        (ag = new B["Buf8"](a9["w_size"])),
                        B["arraySet"](ag, a8, ah - a9["w_size"], a9["w_size"], 0x0),
                        (a8 = ag),
                        (ah = a9["w_size"])),
                      ad = a7["avail_in"],
                      ae = a7["next_in"],
                      af = a7["input"],
                      a7["avail_in"] = ah,
                      a7["next_in"] = 0x0,
                      a7["input"] = a8,
                      a0(a9);
                    a9["lookahead"] >= 0x3;
                  ) {
                    ((aa = a9["strstart"]), (ab = a9["lookahead"] - 0x2));
                    do {
                      ((a9["ins_h"] =
                        ((a9["ins_h"] << a9["hash_shift"]) ^ a9["window"][aa + 0x3 - 0x1]) &
                        a9["hash_mask"]),
                        (a9["prev"][aa & a9["w_mask"]] = a9["head"][a9["ins_h"]]),
                        (a9["head"][a9["ins_h"]] = aa),
                        aa++);
                    } while (--ab);
                    ((a9["strstart"] = aa), (a9["lookahead"] = 0x2), a0(a9));
                  }
                  return (
                    (a9["strstart"] += a9["lookahead"]),
                    (a9["block_start"] = a9["strstart"]),
                    (a9["insert"] = a9["lookahead"]),
                    (a9["lookahead"] = 0x0),
                    (a9["match_length"] = a9["prev_length"] = 0x2),
                    (a9["match_available"] = 0x0),
                    (a7["next_in"] = ae),
                    (a7["input"] = af),
                    (a7["avail_in"] = ad),
                    (a9["wrap"] = ac),
                    0x0
                  );
                }),
                (q["deflateInfo"] = "pako\x20deflate\x20(from\x20Nodeca\x20project)"));
            },
            function (q, F, G) {
              "use strict";
              var H = G(0x0);
              function J(ar) {
                for (var as = ar["length"]; --as >= 0x0; ) ar[as] = 0x0;
              }
              var K = 0x100,
                L = 0x11e,
                Q = 0x1e,
                U = 0xf,
                V = [
                  0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x1, 0x1, 0x1, 0x1, 0x2, 0x2, 0x2, 0x2,
                  0x3, 0x3, 0x3, 0x3, 0x4, 0x4, 0x4, 0x4, 0x5, 0x5, 0x5, 0x5, 0x0,
                ],
                X = [
                  0x0, 0x0, 0x0, 0x0, 0x1, 0x1, 0x2, 0x2, 0x3, 0x3, 0x4, 0x4, 0x5, 0x5, 0x6, 0x6,
                  0x7, 0x7, 0x8, 0x8, 0x9, 0x9, 0xa, 0xa, 0xb, 0xb, 0xc, 0xc, 0xd, 0xd,
                ],
                Y = [
                  0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0,
                  0x2, 0x3, 0x7,
                ],
                Z = [
                  0x10, 0x11, 0x12, 0x0, 0x8, 0x7, 0x9, 0x6, 0xa, 0x5, 0xb, 0x4, 0xc, 0x3, 0xd, 0x2,
                  0xe, 0x1, 0xf,
                ],
                a0 = new Array(0x240);
              J(a0);
              var a1 = new Array(0x3c);
              J(a1);
              var a2 = new Array(0x200);
              J(a2);
              var a3 = new Array(0x100);
              J(a3);
              var a4 = new Array(0x1d);
              J(a4);
              var a5,
                a6,
                a7,
                a8 = new Array(Q);
              function a9(ar, as, at, au, av) {
                ((this["static_tree"] = ar),
                  (this["extra_bits"] = as),
                  (this["extra_base"] = at),
                  (this["elems"] = au),
                  (this["max_length"] = av),
                  (this["has_stree"] = ar && ar["length"]));
              }
              function aa(ar, as) {
                ((this["dyn_tree"] = ar), (this["max_code"] = 0x0), (this["stat_desc"] = as));
              }
              function ab(ar) {
                return ar < 0x100 ? a2[ar] : a2[0x100 + (ar >>> 0x7)];
              }
              function ac(ar, as) {
                ((ar["pending_buf"][ar["pending"]++] = 0xff & as),
                  (ar["pending_buf"][ar["pending"]++] = (as >>> 0x8) & 0xff));
              }
              function ad(ar, as, at) {
                ar["bi_valid"] > 0x10 - at
                  ? ((ar["bi_buf"] |= (as << ar["bi_valid"]) & 0xffff),
                    ac(ar, ar["bi_buf"]),
                    (ar["bi_buf"] = as >> (0x10 - ar["bi_valid"])),
                    (ar["bi_valid"] += at - 0x10))
                  : ((ar["bi_buf"] |= (as << ar["bi_valid"]) & 0xffff), (ar["bi_valid"] += at));
              }
              function ae(ar, as, at) {
                ad(ar, at[0x2 * as], at[0x2 * as + 0x1]);
              }
              function af(ar, as) {
                var at = 0x0;
                do {
                  ((at |= 0x1 & ar), (ar >>>= 0x1), (at <<= 0x1));
                } while (--as > 0x0);
                return at >>> 0x1;
              }
              function ag(ar, as, at) {
                var au,
                  av,
                  aw = new Array(0x10),
                  ax = 0x0;
                for (au = 0x1; au <= U; au++) aw[au] = ax = (ax + at[au - 0x1]) << 0x1;
                for (av = 0x0; av <= as; av++) {
                  var ay = ar[0x2 * av + 0x1];
                  0x0 !== ay && (ar[0x2 * av] = af(aw[ay]++, ay));
                }
              }
              function ah(ar) {
                var as;
                for (as = 0x0; as < L; as++) ar["dyn_ltree"][0x2 * as] = 0x0;
                for (as = 0x0; as < Q; as++) ar["dyn_dtree"][0x2 * as] = 0x0;
                for (as = 0x0; as < 0x13; as++) ar["bl_tree"][0x2 * as] = 0x0;
                ((ar["dyn_ltree"][0x200] = 0x1),
                  (ar["opt_len"] = ar["static_len"] = 0x0),
                  (ar["last_lit"] = ar["matches"] = 0x0));
              }
              function ai(ar) {
                (ar["bi_valid"] > 0x8
                  ? ac(ar, ar["bi_buf"])
                  : ar["bi_valid"] > 0x0 && (ar["pending_buf"][ar["pending"]++] = ar["bi_buf"]),
                  (ar["bi_buf"] = 0x0),
                  (ar["bi_valid"] = 0x0));
              }
              function aj(ar, as, at, au) {
                var av = 0x2 * as,
                  aw = 0x2 * at;
                return ar[av] < ar[aw] || (ar[av] === ar[aw] && au[as] <= au[at]);
              }
              function ak(ar, as, at) {
                for (
                  var au = ar["heap"][at], av = at << 0x1;
                  av <= ar["heap_len"] &&
                  (av < ar["heap_len"] &&
                    aj(as, ar["heap"][av + 0x1], ar["heap"][av], ar["depth"]) &&
                    av++,
                  !aj(as, au, ar["heap"][av], ar["depth"]));
                )
                  ((ar["heap"][at] = ar["heap"][av]), (at = av), (av <<= 0x1));
                ar["heap"][at] = au;
              }
              function al(ar, as, at) {
                var au,
                  av,
                  aw,
                  ax,
                  ay = 0x0;
                if (0x0 !== ar["last_lit"])
                  do {
                    ((au =
                      (ar["pending_buf"][ar["d_buf"] + 0x2 * ay] << 0x8) |
                      ar["pending_buf"][ar["d_buf"] + 0x2 * ay + 0x1]),
                      (av = ar["pending_buf"][ar["l_buf"] + ay]),
                      ay++,
                      0x0 === au
                        ? ae(ar, av, as)
                        : (ae(ar, (aw = a3[av]) + K + 0x1, as),
                          0x0 !== (ax = V[aw]) && ad(ar, (av -= a4[aw]), ax),
                          ae(ar, (aw = ab(--au)), at),
                          0x0 !== (ax = X[aw]) && ad(ar, (au -= a8[aw]), ax)));
                  } while (ay < ar["last_lit"]);
                ae(ar, 0x100, as);
              }
              function am(ar, as) {
                var at,
                  au,
                  av,
                  aw = as["dyn_tree"],
                  ax = as["stat_desc"]["static_tree"],
                  ay = as["stat_desc"]["has_stree"],
                  az = as["stat_desc"]["elems"],
                  aA = -0x1;
                for (ar["heap_len"] = 0x0, ar["heap_max"] = 0x23d, at = 0x0; at < az; at++)
                  0x0 !== aw[0x2 * at]
                    ? ((ar["heap"][++ar["heap_len"]] = aA = at), (ar["depth"][at] = 0x0))
                    : (aw[0x2 * at + 0x1] = 0x0);
                for (; ar["heap_len"] < 0x2; )
                  ((aw[0x2 * (av = ar["heap"][++ar["heap_len"]] = aA < 0x2 ? ++aA : 0x0)] = 0x1),
                    (ar["depth"][av] = 0x0),
                    ar["opt_len"]--,
                    ay && (ar["static_len"] -= ax[0x2 * av + 0x1]));
                for (as["max_code"] = aA, at = ar["heap_len"] >> 0x1; at >= 0x1; at--)
                  ak(ar, aw, at);
                av = az;
                do {
                  ((at = ar["heap"][0x1]),
                    (ar["heap"][0x1] = ar["heap"][ar["heap_len"]--]),
                    ak(ar, aw, 0x1),
                    (au = ar["heap"][0x1]),
                    (ar["heap"][--ar["heap_max"]] = at),
                    (ar["heap"][--ar["heap_max"]] = au),
                    (aw[0x2 * av] = aw[0x2 * at] + aw[0x2 * au]),
                    (ar["depth"][av] =
                      (ar["depth"][at] >= ar["depth"][au] ? ar["depth"][at] : ar["depth"][au]) +
                      0x1),
                    (aw[0x2 * at + 0x1] = aw[0x2 * au + 0x1] = av),
                    (ar["heap"][0x1] = av++),
                    ak(ar, aw, 0x1));
                } while (ar["heap_len"] >= 0x2);
                ((ar["heap"][--ar["heap_max"]] = ar["heap"][0x1]),
                  (function (aB, aC) {
                    var aD,
                      aE,
                      aF,
                      aG,
                      aH,
                      aI,
                      aJ = aC["dyn_tree"],
                      aK = aC["max_code"],
                      aL = aC["stat_desc"]["static_tree"],
                      aM = aC["stat_desc"]["has_stree"],
                      aN = aC["stat_desc"]["extra_bits"],
                      aO = aC["stat_desc"]["extra_base"],
                      aP = aC["stat_desc"]["max_length"],
                      aQ = 0x0;
                    for (aG = 0x0; aG <= U; aG++) aB["bl_count"][aG] = 0x0;
                    for (
                      aJ[0x2 * aB["heap"][aB["heap_max"]] + 0x1] = 0x0, aD = aB["heap_max"] + 0x1;
                      aD < 0x23d;
                      aD++
                    )
                      ((aG = aJ[0x2 * aJ[0x2 * (aE = aB["heap"][aD]) + 0x1] + 0x1] + 0x1) > aP &&
                        ((aG = aP), aQ++),
                        (aJ[0x2 * aE + 0x1] = aG),
                        aE > aK ||
                          (aB["bl_count"][aG]++,
                          (aH = 0x0),
                          aE >= aO && (aH = aN[aE - aO]),
                          (aI = aJ[0x2 * aE]),
                          (aB["opt_len"] += aI * (aG + aH)),
                          aM && (aB["static_len"] += aI * (aL[0x2 * aE + 0x1] + aH))));
                    if (0x0 !== aQ) {
                      do {
                        for (aG = aP - 0x1; 0x0 === aB["bl_count"][aG]; ) aG--;
                        (aB["bl_count"][aG]--,
                          (aB["bl_count"][aG + 0x1] += 0x2),
                          aB["bl_count"][aP]--,
                          (aQ -= 0x2));
                      } while (aQ > 0x0);
                      for (aG = aP; 0x0 !== aG; aG--)
                        for (aE = aB["bl_count"][aG]; 0x0 !== aE; )
                          (aF = aB["heap"][--aD]) > aK ||
                            (aJ[0x2 * aF + 0x1] !== aG &&
                              ((aB["opt_len"] += (aG - aJ[0x2 * aF + 0x1]) * aJ[0x2 * aF]),
                              (aJ[0x2 * aF + 0x1] = aG)),
                            aE--);
                    }
                  })(ar, as),
                  ag(aw, aA, ar["bl_count"]));
              }
              function an(ar, as, at) {
                var au,
                  av,
                  aw = -0x1,
                  ax = as[0x1],
                  ay = 0x0,
                  az = 0x7,
                  aA = 0x4;
                for (
                  0x0 === ax && ((az = 0x8a), (aA = 0x3)),
                    as[0x2 * (at + 0x1) + 0x1] = 0xffff,
                    au = 0x0;
                  au <= at;
                  au++
                )
                  ((av = ax),
                    (ax = as[0x2 * (au + 0x1) + 0x1]),
                    (++ay < az && av === ax) ||
                      (ay < aA
                        ? (ar["bl_tree"][0x2 * av] += ay)
                        : 0x0 !== av
                          ? (av !== aw && ar["bl_tree"][0x2 * av]++, ar["bl_tree"][0x20]++)
                          : ay <= 0xa
                            ? ar["bl_tree"][0x22]++
                            : ar["bl_tree"][0x24]++,
                      (ay = 0x0),
                      (aw = av),
                      0x0 === ax
                        ? ((az = 0x8a), (aA = 0x3))
                        : av === ax
                          ? ((az = 0x6), (aA = 0x3))
                          : ((az = 0x7), (aA = 0x4))));
              }
              function ao(ar, as, at) {
                var au,
                  av,
                  aw = -0x1,
                  ax = as[0x1],
                  ay = 0x0,
                  az = 0x7,
                  aA = 0x4;
                for (0x0 === ax && ((az = 0x8a), (aA = 0x3)), au = 0x0; au <= at; au++)
                  if (((av = ax), (ax = as[0x2 * (au + 0x1) + 0x1]), !(++ay < az && av === ax))) {
                    if (ay < aA)
                      do {
                        ae(ar, av, ar["bl_tree"]);
                      } while (0x0 != --ay);
                    else
                      0x0 !== av
                        ? (av !== aw && (ae(ar, av, ar["bl_tree"]), ay--),
                          ae(ar, 0x10, ar["bl_tree"]),
                          ad(ar, ay - 0x3, 0x2))
                        : ay <= 0xa
                          ? (ae(ar, 0x11, ar["bl_tree"]), ad(ar, ay - 0x3, 0x3))
                          : (ae(ar, 0x12, ar["bl_tree"]), ad(ar, ay - 0xb, 0x7));
                    ((ay = 0x0),
                      (aw = av),
                      0x0 === ax
                        ? ((az = 0x8a), (aA = 0x3))
                        : av === ax
                          ? ((az = 0x6), (aA = 0x3))
                          : ((az = 0x7), (aA = 0x4)));
                  }
              }
              J(a8);
              var ap = !0x1;
              function aq(ar, as, at, au) {
                (ad(ar, 0x0 + (au ? 0x1 : 0x0), 0x3),
                  (function (av, aw, ax, ay) {
                    (ai(av),
                      ac(av, ax),
                      ac(av, ~ax),
                      H["arraySet"](av["pending_buf"], av["window"], aw, ax, av["pending"]),
                      (av["pending"] += ax));
                  })(ar, as, at));
              }
              ((F["_tr_init"] = function (ar) {
                (ap ||
                  ((function () {
                    var as,
                      at,
                      au,
                      av,
                      aw,
                      ax = new Array(0x10);
                    for (au = 0x0, av = 0x0; av < 0x1c; av++)
                      for (a4[av] = au, as = 0x0; as < 0x1 << V[av]; as++) a3[au++] = av;
                    for (a3[au - 0x1] = av, aw = 0x0, av = 0x0; av < 0x10; av++)
                      for (a8[av] = aw, as = 0x0; as < 0x1 << X[av]; as++) a2[aw++] = av;
                    for (aw >>= 0x7; av < Q; av++)
                      for (a8[av] = aw << 0x7, as = 0x0; as < 0x1 << (X[av] - 0x7); as++)
                        a2[0x100 + aw++] = av;
                    for (at = 0x0; at <= U; at++) ax[at] = 0x0;
                    for (as = 0x0; as <= 0x8f; ) ((a0[0x2 * as + 0x1] = 0x8), as++, ax[0x8]++);
                    for (; as <= 0xff; ) ((a0[0x2 * as + 0x1] = 0x9), as++, ax[0x9]++);
                    for (; as <= 0x117; ) ((a0[0x2 * as + 0x1] = 0x7), as++, ax[0x7]++);
                    for (; as <= 0x11f; ) ((a0[0x2 * as + 0x1] = 0x8), as++, ax[0x8]++);
                    for (ag(a0, 0x11f, ax), as = 0x0; as < Q; as++)
                      ((a1[0x2 * as + 0x1] = 0x5), (a1[0x2 * as] = af(as, 0x5)));
                    ((a5 = new a9(a0, V, 0x101, L, U)),
                      (a6 = new a9(a1, X, 0x0, Q, U)),
                      (a7 = new a9(new Array(0x0), Y, 0x0, 0x13, 0x7)));
                  })(),
                  (ap = !0x0)),
                  (ar["l_desc"] = new aa(ar["dyn_ltree"], a5)),
                  (ar["d_desc"] = new aa(ar["dyn_dtree"], a6)),
                  (ar["bl_desc"] = new aa(ar["bl_tree"], a7)),
                  (ar["bi_buf"] = 0x0),
                  (ar["bi_valid"] = 0x0),
                  ah(ar));
              }),
                (F["_tr_stored_block"] = aq),
                (F["_tr_flush_block"] = function (ar, as, at, au) {
                  var av,
                    aw,
                    ax = 0x0;
                  (ar["level"] > 0x0
                    ? (0x2 === ar["strm"]["data_type"] &&
                        (ar["strm"]["data_type"] = (function (ay) {
                          var az,
                            aA = 0xf3ffc07f;
                          for (az = 0x0; az <= 0x1f; az++, aA >>>= 0x1)
                            if (0x1 & aA && 0x0 !== ay["dyn_ltree"][0x2 * az]) return 0x0;
                          if (
                            0x0 !== ay["dyn_ltree"][0x12] ||
                            0x0 !== ay["dyn_ltree"][0x14] ||
                            0x0 !== ay["dyn_ltree"][0x1a]
                          )
                            return 0x1;
                          for (az = 0x20; az < K; az++)
                            if (0x0 !== ay["dyn_ltree"][0x2 * az]) return 0x1;
                          return 0x0;
                        })(ar)),
                      am(ar, ar["l_desc"]),
                      am(ar, ar["d_desc"]),
                      (ax = (function (ay) {
                        var az;
                        for (
                          an(ay, ay["dyn_ltree"], ay["l_desc"]["max_code"]),
                            an(ay, ay["dyn_dtree"], ay["d_desc"]["max_code"]),
                            am(ay, ay["bl_desc"]),
                            az = 0x12;
                          az >= 0x3 && 0x0 === ay["bl_tree"][0x2 * Z[az] + 0x1];
                          az--
                        );
                        return ((ay["opt_len"] += 0x3 * (az + 0x1) + 0x5 + 0x5 + 0x4), az);
                      })(ar)),
                      (av = (ar["opt_len"] + 0x3 + 0x7) >>> 0x3),
                      (aw = (ar["static_len"] + 0x3 + 0x7) >>> 0x3) <= av && (av = aw))
                    : (av = aw = at + 0x5),
                    at + 0x4 <= av && -0x1 !== as
                      ? aq(ar, as, at, au)
                      : 0x4 === ar["strategy"] || aw === av
                        ? (ad(ar, 0x2 + (au ? 0x1 : 0x0), 0x3), al(ar, a0, a1))
                        : (ad(ar, 0x4 + (au ? 0x1 : 0x0), 0x3),
                          (function (ay, az, aA, aB) {
                            var aC;
                            for (
                              ad(ay, az - 0x101, 0x5),
                                ad(ay, aA - 0x1, 0x5),
                                ad(ay, aB - 0x4, 0x4),
                                aC = 0x0;
                              aC < aB;
                              aC++
                            )
                              ad(ay, ay["bl_tree"][0x2 * Z[aC] + 0x1], 0x3);
                            (ao(ay, ay["dyn_ltree"], az - 0x1), ao(ay, ay["dyn_dtree"], aA - 0x1));
                          })(
                            ar,
                            ar["l_desc"]["max_code"] + 0x1,
                            ar["d_desc"]["max_code"] + 0x1,
                            ax + 0x1,
                          ),
                          al(ar, ar["dyn_ltree"], ar["dyn_dtree"])),
                    ah(ar),
                    au && ai(ar));
                }),
                (F["_tr_tally"] = function (ar, as, at) {
                  return (
                    (ar["pending_buf"][ar["d_buf"] + 0x2 * ar["last_lit"]] = (as >>> 0x8) & 0xff),
                    (ar["pending_buf"][ar["d_buf"] + 0x2 * ar["last_lit"] + 0x1] = 0xff & as),
                    (ar["pending_buf"][ar["l_buf"] + ar["last_lit"]] = 0xff & at),
                    ar["last_lit"]++,
                    0x0 === as
                      ? ar["dyn_ltree"][0x2 * at]++
                      : (ar["matches"]++,
                        as--,
                        ar["dyn_ltree"][0x2 * (a3[at] + K + 0x1)]++,
                        ar["dyn_dtree"][0x2 * ab(as)]++),
                    ar["last_lit"] === ar["lit_bufsize"] - 0x1
                  );
                }),
                (F["_tr_align"] = function (ar) {
                  (ad(ar, 0x2, 0x3),
                    ae(ar, 0x100, a0),
                    (function (as) {
                      0x10 === as["bi_valid"]
                        ? (ac(as, as["bi_buf"]), (as["bi_buf"] = 0x0), (as["bi_valid"] = 0x0))
                        : as["bi_valid"] >= 0x8 &&
                          ((as["pending_buf"][as["pending"]++] = 0xff & as["bi_buf"]),
                          (as["bi_buf"] >>= 0x8),
                          (as["bi_valid"] -= 0x8));
                    })(ar));
                }));
            },
            function (i, j, k) {
              "use strict";
              i["exports"] = function (l, m, p, q) {
                for (
                  var u = (0xffff & l) | 0x0, v = ((l >>> 0x10) & 0xffff) | 0x0, w = 0x0;
                  0x0 !== p;
                ) {
                  p -= w = p > 0x7d0 ? 0x7d0 : p;
                  do {
                    v = (v + (u = (u + m[q++]) | 0x0)) | 0x0;
                  } while (--w);
                  ((u %= 0xfff1), (v %= 0xfff1));
                }
                return u | (v << 0x10) | 0x0;
              };
            },
            function (i, j, k) {
              "use strict";
              var l = (function () {
                for (var m, o = [], p = 0x0; p < 0x100; p++) {
                  m = p;
                  for (var q = 0x0; q < 0x8; q++)
                    m = 0x1 & m ? 0xedb88320 ^ (m >>> 0x1) : m >>> 0x1;
                  o[p] = m;
                }
                return o;
              })();
              i["exports"] = function (m, p, q, u) {
                var v = l,
                  w = u + q;
                m ^= -0x1;
                for (var x = u; x < w; x++) m = (m >>> 0x8) ^ v[0xff & (m ^ p[x])];
                return -0x1 ^ m;
              };
            },
            function (j, k, l) {
              "use strict";
              var m = l(0x0),
                p = !0x0,
                q = !0x0;
              try {
                String["fromCharCode"]["apply"](null, [0x0]);
              } catch (y) {
                p = !0x1;
              }
              try {
                String["fromCharCode"]["apply"](null, new Uint8Array(0x1));
              } catch (z) {
                q = !0x1;
              }
              for (var v = new m["Buf8"](0x100), w = 0x0; w < 0x100; w++)
                v[w] =
                  w >= 0xfc
                    ? 0x6
                    : w >= 0xf8
                      ? 0x5
                      : w >= 0xf0
                        ? 0x4
                        : w >= 0xe0
                          ? 0x3
                          : w >= 0xc0
                            ? 0x2
                            : 0x1;
              function x(A, B) {
                if (B < 0xfffe && ((A["subarray"] && q) || (!A["subarray"] && p)))
                  return String["fromCharCode"]["apply"](null, m["shrinkBuf"](A, B));
                for (var C = "", D = 0x0; D < B; D++) C += String["fromCharCode"](A[D]);
                return C;
              }
              ((v[0xfe] = v[0xfe] = 0x1),
                (k["string2buf"] = function (A) {
                  var B,
                    C,
                    D,
                    E,
                    F,
                    G = A["length"],
                    H = 0x0;
                  for (E = 0x0; E < G; E++)
                    (0xd800 == (0xfc00 & (C = A["charCodeAt"](E))) &&
                      E + 0x1 < G &&
                      0xdc00 == (0xfc00 & (D = A["charCodeAt"](E + 0x1))) &&
                      ((C = 0x10000 + ((C - 0xd800) << 0xa) + (D - 0xdc00)), E++),
                      (H += C < 0x80 ? 0x1 : C < 0x800 ? 0x2 : C < 0x10000 ? 0x3 : 0x4));
                  for (B = new m["Buf8"](H), F = 0x0, E = 0x0; F < H; E++)
                    (0xd800 == (0xfc00 & (C = A["charCodeAt"](E))) &&
                      E + 0x1 < G &&
                      0xdc00 == (0xfc00 & (D = A["charCodeAt"](E + 0x1))) &&
                      ((C = 0x10000 + ((C - 0xd800) << 0xa) + (D - 0xdc00)), E++),
                      C < 0x80
                        ? (B[F++] = C)
                        : C < 0x800
                          ? ((B[F++] = 0xc0 | (C >>> 0x6)), (B[F++] = 0x80 | (0x3f & C)))
                          : C < 0x10000
                            ? ((B[F++] = 0xe0 | (C >>> 0xc)),
                              (B[F++] = 0x80 | ((C >>> 0x6) & 0x3f)),
                              (B[F++] = 0x80 | (0x3f & C)))
                            : ((B[F++] = 0xf0 | (C >>> 0x12)),
                              (B[F++] = 0x80 | ((C >>> 0xc) & 0x3f)),
                              (B[F++] = 0x80 | ((C >>> 0x6) & 0x3f)),
                              (B[F++] = 0x80 | (0x3f & C))));
                  return B;
                }),
                (k["buf2binstring"] = function (A) {
                  return x(A, A["length"]);
                }),
                (k["binstring2buf"] = function (A) {
                  for (var B = new m["Buf8"](A["length"]), C = 0x0, D = B["length"]; C < D; C++)
                    B[C] = A["charCodeAt"](C);
                  return B;
                }),
                (k["buf2string"] = function (A, B) {
                  var C,
                    D,
                    E,
                    F,
                    G = B || A["length"],
                    H = new Array(0x2 * G);
                  for (D = 0x0, C = 0x0; C < G; )
                    if ((E = A[C++]) < 0x80) H[D++] = E;
                    else {
                      if ((F = v[E]) > 0x4) ((H[D++] = 0xfffd), (C += F - 0x1));
                      else {
                        for (E &= 0x2 === F ? 0x1f : 0x3 === F ? 0xf : 0x7; F > 0x1 && C < G; )
                          ((E = (E << 0x6) | (0x3f & A[C++])), F--);
                        F > 0x1
                          ? (H[D++] = 0xfffd)
                          : E < 0x10000
                            ? (H[D++] = E)
                            : ((E -= 0x10000),
                              (H[D++] = 0xd800 | ((E >> 0xa) & 0x3ff)),
                              (H[D++] = 0xdc00 | (0x3ff & E)));
                      }
                    }
                  return x(H, D);
                }),
                (k["utf8border"] = function (A, B) {
                  var C;
                  for (
                    (B = B || A["length"]) > A["length"] && (B = A["length"]), C = B - 0x1;
                    C >= 0x0 && 0x80 == (0xc0 & A[C]);
                  )
                    C--;
                  return C < 0x0 || 0x0 === C ? B : C + v[A[C]] > B ? C : B;
                }));
            },
            function (i, j, k) {
              "use strict";
              i["exports"] = function () {
                ((this["input"] = null),
                  (this["next_in"] = 0x0),
                  (this["avail_in"] = 0x0),
                  (this["total_in"] = 0x0),
                  (this["output"] = null),
                  (this["next_out"] = 0x0),
                  (this["avail_out"] = 0x0),
                  (this["total_out"] = 0x0),
                  (this["msg"] = ""),
                  (this["state"] = null),
                  (this["data_type"] = 0x2),
                  (this["adler"] = 0x0));
              };
            },
            function (i, j, k) {
              "use strict";
              i["exports"] = function (m, p, q) {
                if ((p -= (m += "")["length"]) <= 0x0) return m;
                if ((q || 0x0 === q || (q = "\x20"), "\x20" == (q += "") && p < 0xa))
                  return l[p] + m;
                for (var u = ""; 0x1 & p && (u += q), (p >>= 0x1); ) q += q;
                return u + m;
              };
              var l = [
                "",
                "\x20",
                "\x20\x20",
                "\x20\x20\x20",
                "\x20\x20\x20\x20",
                "\x20\x20\x20\x20\x20",
                "\x20\x20\x20\x20\x20\x20",
                "\x20\x20\x20\x20\x20\x20\x20",
                "\x20\x20\x20\x20\x20\x20\x20\x20",
                "\x20\x20\x20\x20\x20\x20\x20\x20\x20",
              ];
            },
            function (i, j, k) {
              "use strict";
              (Object["defineProperty"](j, "__esModule", { value: !0x0 }),
                (j["crc32"] = function (m) {
                  var o =
                    arguments["length"] > 0x1 && void 0x0 !== arguments[0x1] ? arguments[0x1] : 0x0;
                  ((m = (function (q) {
                    for (var u = "", v = 0x0; v < q["length"]; v++) {
                      var w = q["charCodeAt"](v);
                      w < 0x80
                        ? (u += String["fromCharCode"](w))
                        : w < 0x800
                          ? (u +=
                              String["fromCharCode"](0xc0 | (w >> 0x6)) +
                              String["fromCharCode"](0x80 | (0x3f & w)))
                          : w < 0xd800 || w >= 0xe000
                            ? (u +=
                                String["fromCharCode"](0xe0 | (w >> 0xc)) +
                                String["fromCharCode"](0x80 | ((w >> 0x6) & 0x3f)) +
                                String["fromCharCode"](0x80 | (0x3f & w)))
                            : ((w =
                                0x10000 + (((0x3ff & w) << 0xa) | (0x3ff & q["charCodeAt"](++v)))),
                              (u +=
                                String["fromCharCode"](0xf0 | (w >> 0x12)) +
                                String["fromCharCode"](0x80 | ((w >> 0xc) & 0x3f)) +
                                String["fromCharCode"](0x80 | ((w >> 0x6) & 0x3f)) +
                                String["fromCharCode"](0x80 | (0x3f & w))));
                    }
                    return u;
                  })(m)),
                    (o ^= -0x1));
                  for (var p = 0x0; p < m["length"]; p++)
                    o = (o >>> 0x8) ^ l[0xff & (o ^ m["charCodeAt"](p))];
                  return (-0x1 ^ o) >>> 0x0;
                }));
              var l = (function () {
                for (var m = [], o = void 0x0, p = 0x0; p < 0x100; p++) {
                  o = p;
                  for (var q = 0x0; q < 0x8; q++)
                    o = 0x1 & o ? 0xedb88320 ^ (o >>> 0x1) : o >>> 0x1;
                  m[p] = o;
                }
                return m;
              })();
            },
            function (i, j, k) {
              "use strict";
              (function (m) {
                var q =
                  "function" == typeof Symbol && "symbol" == typeof Symbol["iterator"]
                    ? function (G) {
                        return typeof G;
                      }
                    : function (G) {
                        return G &&
                          "function" == typeof Symbol &&
                          G["constructor"] === Symbol &&
                          G !== Symbol["prototype"]
                          ? "symbol"
                          : typeof G;
                      };
                !(function (G, H) {
                  function I(L, M) {
                    return x(M - 0x387, L);
                  }
                  var J = B();
                  function K(L, M) {
                    return x(L - 0x142, M);
                  }
                  for (;;)
                    try {
                      if (
                        parseInt(I("o#BD", 0x54d)) / 0x1 +
                          parseInt(K(0x2e0, "o#BD")) / 0x2 +
                          (parseInt(K(0x2d5, "iRCa")) / 0x3) * (parseInt(K(0x2d0, "v&9t")) / 0x4) +
                          -parseInt(K(0x2db, "CYra")) / 0x5 +
                          (-parseInt(K(0x2d6, "6BJ9")) / 0x6) * (parseInt(K(0x312, "ZGHp")) / 0x7) +
                          (parseInt(K(0x2e9, "w@1k")) / 0x8) * (-parseInt(I("ZGHp", 0x539)) / 0x9) +
                          (parseInt(I("$i(c", 0x550)) / 0xa) *
                            (parseInt(K(0x2dd, "7@@f")) / 0xb) ===
                        0xd98ca
                      )
                        break;
                      J["push"](J["shift"]());
                    } catch (L) {
                      J["push"](J["shift"]());
                    }
                })();
                var v = k(0x3),
                  w = k(0xf);
                function x(G, H) {
                  var I = B();
                  return (x = function (J, K) {
                    var L = I[(J -= 0x18a)];
                    void 0x0 === x["EeeRFy"] &&
                      ((x["EsJeQI"] = function (O, P) {
                        var Q = [],
                          R = 0x0,
                          S = void 0x0,
                          T = "";
                        O = (function (W) {
                          for (
                            var X, Y, Z = "", a0 = "", a1 = 0x0, a2 = 0x0;
                            (Y = W["charAt"](a2++));
                            ~Y && ((X = a1 % 0x4 ? 0x40 * X + Y : Y), a1++ % 0x4)
                              ? (Z += String["fromCharCode"](0xff & (X >> ((-0x2 * a1) & 0x6))))
                              : 0x0
                          )
                            Y = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/="[
                              "indexOf"
                            ](Y);
                          for (var a3 = 0x0, a4 = Z["length"]; a3 < a4; a3++)
                            a0 +=
                              "%" + ("00" + Z["charCodeAt"](a3)["toString"](0x10))["slice"](-0x2);
                          return decodeURIComponent(a0);
                        })(O);
                        var U = void 0x0;
                        for (U = 0x0; U < 0x100; U++) Q[U] = U;
                        for (U = 0x0; U < 0x100; U++)
                          ((R = (R + Q[U] + P["charCodeAt"](U % P["length"])) % 0x100),
                            (S = Q[U]),
                            (Q[U] = Q[R]),
                            (Q[R] = S));
                        ((U = 0x0), (R = 0x0));
                        for (var V = 0x0; V < O["length"]; V++)
                          ((R = (R + Q[(U = (U + 0x1) % 0x100)]) % 0x100),
                            (S = Q[U]),
                            (Q[U] = Q[R]),
                            (Q[R] = S),
                            (T += String["fromCharCode"](
                              O["charCodeAt"](V) ^ Q[(Q[U] + Q[R]) % 0x100],
                            )));
                        return T;
                      }),
                      (G = arguments),
                      (x["EeeRFy"] = !0x0));
                    var M = J + I[0x0],
                      N = G[M];
                    return (
                      N
                        ? (L = N)
                        : (void 0x0 === x["PjxVvf"] && (x["PjxVvf"] = !0x0),
                          (L = x["EsJeQI"](L, K)),
                          (G[M] = L)),
                      L
                    );
                  })(G, H);
                }
                function y(G, H) {
                  return x(G - -0xe3, H);
                }
                var z = k(0x10),
                  A = void 0x0;
                function B() {
                  var G = [
                    "CCoIWRaSnW",
                    "B1ldNd4mWOu",
                    "W6jCxW",
                    "WO/dJmo+q8kf",
                    "W53cHMxcR8oVW5/cMmkMvCkq",
                    "WPKCW7m",
                    "WQdcUmkQCCkPoCkVW7RdUCkIWRhcVhG",
                    "W48SW5pcGgpdSmkR",
                    "pvPlxW8",
                    "lvDCxcCz",
                    "dSkVWQhdUaG",
                    "d0XaBrq",
                    "hSo8WPBcUSkK",
                    "WOJdTSkCW5vk",
                    "mmomW7XpBG",
                    "t3BdQGWL",
                    "fHmfemoubq",
                    "mK0qhhu",
                    "FKCAd8om",
                    "W4PZodFdQIhdMq",
                    "W4RdJ8onW5/dVZCD",
                    "WQJdTSkGWPjrWRm",
                    "W54hW5a",
                    "kLe+jvhdN8oqda4",
                    "W60oW4nxW4xcSCkGW5rAAa",
                    "gfLywZC",
                    "dSkHW4neBSkKsmonbCoFEa",
                    "yCoAWRugga",
                    "W7i9W6RdR8kN",
                    "ldqEWRdcICky",
                    "W4BdJCkEW5H3",
                    "yCoMWP8ipW",
                    "zeZdHHmdzWpcStC",
                    "W5tcMwxcNHO",
                    "WPhcJv4Uwq",
                    "WQBcUCkIDCkUomkRW6/dVSkQWO3cHh8",
                    "qtX+caNcHH8",
                    "quPAsmkljSkUWQWVW4aU",
                    "WPiay8kjDG",
                    "aJCwWRhcOW",
                    "WO/cNCobWRKE",
                    "W5lcQ0ldV8kwhCovd1ddGh9wxG",
                    "W7NdQJC6qmkvmCkkFa",
                    "eWpcUYKLhxJdKsW",
                    "W6ldQmotW4FdQW",
                    "W7hdPmoPaCo9ACo3",
                    "W5iGW5z0W7K",
                    "oCohWQhcNmkAWPrtW6Hv",
                    "WP9LyW7dL05NW4RcNSoSWQpcQx8",
                    "EGFdNcTpWQldMq",
                    "WQBcU8kVCCoYsCoiW53dSSkT",
                    "WOtcH8k6cHRcGemroW8",
                    "l8kXWPZdSSk5WQ3cNG",
                    "fY5GmCoIW5TDWQ5SzmkCW4BcPa",
                    "sSoHWPyvlq",
                    "W4veWR3dPGLVk8kGqW",
                    "u2/dPISr",
                    "fWZcRSkPW7hcMmob",
                    "fSkJWPNdUYW8W6a",
                    "W6RcJNxcVWhcLW9sW4OG",
                    "W7JdMmorW5yVWPdcMq8",
                    "WQeKbe1S",
                    "W7BdJmkqWOeZWRpdH1aYza",
                    "W4HUpbhdRdddHW",
                    "oCooWQVdT8oS",
                    "WRFdImo6rSkp",
                    "W4hdQSoWkmoL",
                    "W5BdLYi",
                    "hg1GDby",
                    "W7xdQGpcMSk1",
                    "qNm6DCk9WOWhWP0",
                    "WQdcV3xcRCkHW6tdHWX1",
                    "d1qJk8kY",
                    "WOdcGM9PWOZcQSkbgaDrWOW",
                    "vCo0WPqBlCkO",
                    "hgqQxKFcJZ4MWRzcW7u",
                    "ybNdPWT4",
                    "W6lcGGr+ra",
                    "CmoPW4tcR8ouW7VcQ8kqWO05W4BdRW",
                    "pqRcHh57WPtdK8oBp8odxq",
                    "y3xdQGK6",
                    "WQpcRSoQWOCb",
                    "WRCAz8kDya",
                    "smoLWRWrpq",
                    "eYHOnSk4WQikWPLHxW",
                    "WQjCs8kcia",
                    "rmoJwCoyW7q",
                    "EmoJzmoUW4BcIW",
                    "naZcICkSW54",
                    "W4hdGaJcSmkm",
                    "W6hcS8kHWP9cWR/cIKuTta",
                    "W7ePW4xdVCkJ",
                    "zWrFjqa",
                    "fY1HomoHW59DWQXJtCk2W6BcIq",
                    "WQ7dTCoey8k4",
                    "W7JcIMtdJdy",
                    "W6Tkh8oRkN/cNJqJWRz0W5K",
                    "WRNdVmkRWOXBWRm",
                    "fKiefeG",
                    "vK3dLZOT",
                    "emo1WQpdTSoA",
                    "dsZcOSkPW44",
                    "rJn0aI4",
                    "WOBcGM9JWO3cQ8k5pcj7WRu",
                    "pSolW5nQwJe",
                    "WO/dVXtcOmotqW",
                    "fYSAWRBcRG",
                    "etaXw3Cjve4gtG",
                    "gr0Uk8of",
                    "WR4CsSkSDsRcTri",
                    "W6RcJNxcMZlcOqLJW4i9",
                    "W6SCW5hdGmkb",
                  ];
                  return (B = function () {
                    return G;
                  })();
                }
                ("undefined" == typeof window ? "undefined" : q(window)) !== y(0xb5, "nr7e") &&
                  (A = window);
                var C = {
                  setCookie: function (G, H) {
                    var I =
                        arguments["length"] > 0x2 && void 0x0 !== arguments[0x2]
                          ? arguments[0x2]
                          : 0x270f,
                      J = {};
                    function K(P, Q) {
                      return y(Q - -0xaf, P);
                    }
                    function L(P, Q) {
                      return y(P - -0x2da, Q);
                    }
                    ((J[K("YYIM", 0xf)] = function (P, Q) {
                      return P + Q;
                    }),
                      (J[K("7@@f", 0x19)] = function (P, Q) {
                        return P * Q;
                      }),
                      (J[L(-0x1d3, "n0#9")] = function (P, Q) {
                        return P * Q;
                      }),
                      (J[L(-0x1fe, "2K@$")] = function (P, Q) {
                        return P + Q;
                      }),
                      (J[K("YYIM", 0x3a)] = K("#0dY", 0x31)),
                      (J[L(-0x1ea, "v*Co")] = function (P, Q) {
                        return P + Q;
                      }),
                      (J[L(-0x1f5, "sLNE")] = function (P, Q) {
                        return P + Q;
                      }),
                      (J[L(-0x217, "V$Xd")] = function (P, Q) {
                        return P + Q;
                      }),
                      (J[K("P@!o", 0x62)] = function (P, Q) {
                        return P || Q;
                      }),
                      (J[L(-0x20f, "ji2B")] = K("w@1k", 0x13)));
                    var M = J;
                    G = M[K("gLJv", 0x65)]("_", G);
                    var N = "";
                    if (I) {
                      var O = new Date();
                      (O[K("kO^J", 0x10)](
                        M[L(-0x1ff, "YB3^")](
                          O[K("NW9H", 0x4e)](),
                          M[L(-0x1cb, "295h")](
                            M[K("6JT5", 0x55)](
                              M[K("N6Wx", 0x1f)](M[K("VWEi", 0x51)](I, 0x18), 0x3c),
                              0x3c,
                            ),
                            0x3e8,
                          ),
                        ),
                      ),
                        (N = M[L(-0x1fc, "kO^J")](
                          M[K("295h", 0x52)],
                          O[L(-0x1e6, "4)[B") + "g"](),
                        )));
                    }
                    A[K("o#BD", 0x1d)][L(-0x1d4, "v&9t")] = M[L(-0x1c5, "P@!o")](
                      M[L(-0x1d2, "pGSi")](
                        M[K("295h", 0x4f)](M[L(-0x22d, "v*Co")](G, "="), M[K("ji2B", 0x30)](H, "")),
                        N,
                      ),
                      M[K("v&9t", 0x43)],
                    );
                  },
                  getCookie: function (G) {
                    var H = {};
                    function I(P, Q) {
                      return y(Q - 0x2f0, P);
                    }
                    ((H[I("nr7e", 0x3f2)] = function (P, Q) {
                      return P + Q;
                    }),
                      (H[K(0xc5, "xvVC")] = function (P, Q) {
                        return P < Q;
                      }),
                      (H[K(0xbc, "xde7")] = function (P, Q) {
                        return P === Q;
                      }));
                    var J = H;
                    function K(P, Q) {
                      return y(P - -0x25, Q);
                    }
                    G = J[K(0xa5, "295h")]("_", G);
                    for (
                      var L = J[I("%J@R", 0x3e9)](G, "="),
                        M = A[I("$i(c", 0x3e3)][I("#0dY", 0x3d7)][I("xde7", 0x3e5)](";"),
                        N = 0x0;
                      J[K(0xe0, "YYIM")](N, M[I("[*([", 0x3df)]);
                      N++
                    ) {
                      for (var O = M[N]; J[K(0x89, "(UiB")](O[K(0xee, "v*Co")](0x0), "\x20"); )
                        O = O[I("YYIM", 0x406)](0x1, O[I("2K@$", 0x3cd)]);
                      if (J[I("kO^J", 0x3db)](O[I("wtDD", 0x39a)](L), 0x0))
                        return O[I("n0#9", 0x3fd)](L[I("2K@$", 0x3cd)], O[I("P@!o", 0x3c0)]);
                    }
                    return null;
                  },
                  setStorage: function (G, H) {
                    function I(L, M) {
                      return y(M - -0x22c, L);
                    }
                    var J = {};
                    function K(L, M) {
                      return y(M - 0x14, L);
                    }
                    ((J[K("xvVC", 0xda)] = function (L, M) {
                      return L + M;
                    }),
                      (G = J[I("P@!o", -0x153)]("_", G)),
                      A[K("D&YH", 0x122) + "ge"][I("VWEi", -0x16c)](G, H));
                  },
                  getStorage: function (G) {
                    var H = {};
                    function I(J, K) {
                      return y(J - 0x3d6, K);
                    }
                    return (
                      (H[I(0x4e8, "xde7")] = function (J, K) {
                        return J + K;
                      }),
                      (G = H[I(0x49d, "%J@R")]("_", G)),
                      A[y(0xf1, "Ql%4") + "ge"][I(0x49b, "ACM^")](G)
                    );
                  },
                };
                function D(G, H) {
                  return x(H - 0x87, G);
                }
                function E() {
                  var G =
                      arguments["length"] > 0x0 && void 0x0 !== arguments[0x0]
                        ? arguments[0x0]
                        : Date[y(0xfb, "k6jB")](),
                    H = {
                      EvSjI: function (O, P) {
                        return O(P);
                      },
                      ZPPMU: function (O) {
                        return O();
                      },
                      OVEHq: function (O, P) {
                        return O % P;
                      },
                      XKmds: function (O, P, Q, R) {
                        return O(P, Q, R);
                      },
                      OfXBm: function (O, P) {
                        return O(P);
                      },
                    },
                    I = H[K(-0x11f, "(UiB")](String, G)[N("%J@R", 0x282)](0x0, 0xa),
                    J = H[N("iRCa", 0x246)](w);
                  function K(O, P) {
                    return D(P, O - -0x360);
                  }
                  var L = H[N("wtDD", 0x280)](
                      (I + "_" + J)[K(-0x13a, "P@!o")]("")[N("#0dY", 0x2a9)](function (O, P) {
                        return O + P[N("6bD!", 0x257)](0x0);
                      }, 0x0),
                      0x3e8,
                    ),
                    M = H[K(-0xf3, "zRjX")](z, H[K(-0x10e, "n0#9")](String, L), 0x3, "0");
                  function N(O, P) {
                    return D(O, P - 0x34);
                  }
                  return v[K(-0x108, "6JT5")]("" + I + M)[N("IxPg", 0x2a8)](/=/g, "") + "_" + J;
                }
                function F(G) {
                  var H = {};
                  function I(K, L) {
                    return y(L - 0x2a6, K);
                  }
                  function J(K, L) {
                    return D(L, K - -0x2d0);
                  }
                  return (
                    (H[J(-0xba, "$i(c")] = function (K, L) {
                      return K + L;
                    }),
                    H[J(-0x70, "P@!o")](
                      G[I("tJ0$", 0x39d)](0x0)[I("4)[B", 0x367) + "e"](),
                      G[I("O4hK", 0x379)](0x1),
                    )
                  );
                }
                m[D("ACM^", 0x273)] = function () {
                  var G = {
                      oOWEw: function (M, N) {
                        return M(N);
                      },
                      ZBntu: function (M, N) {
                        return M(N);
                      },
                      ijTRV: J("L*(*", 0x353),
                      SAvBP: function (M) {
                        return M();
                      },
                      JxEQk: L(0x9c, "295h"),
                      miNDx: J("$h^o", 0x350),
                    },
                    H = G[L(0x6f, "$h^o")],
                    I = {};
                  function J(M, N) {
                    return D(M, N - 0x12f);
                  }
                  var K = G[J("D&YH", 0x34d)](E);
                  function L(M, N) {
                    return y(M - -0x63, N);
                  }
                  return (
                    [G[J("4)[B", 0x340)], G[L(0x75, "$i(c")]][L(0x50, "7@@f")](function (M) {
                      function N(Q, R) {
                        return J(Q, R - 0x11b);
                      }
                      function O(Q, R) {
                        return L(R - -0x146, Q);
                      }
                      try {
                        var P = N("wtDD", 0x4a0) + M + O("D&YH", -0x9d);
                        ((I[P] = C[O("ZGHp", -0xe0) + G[O("tJ0$", -0xd3)](F, M)](H)),
                          !I[P] &&
                            (C[N(")pXx", 0x4ac) + G[O("IxPg", -0xf7)](F, M)](H, K), (I[P] = K)));
                      } catch (Q) {}
                    }),
                    I
                  );
                };
              })["call"](this, k(0x1)(i));
            },
            function (i, j, k) {
              "use strict";
              i["exports"] = function (l) {
                l = l || 0x15;
                for (var m = ""; 0x0 < l--; )
                  m += "_~varfunctio0125634789bdegjhklmpqswxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"[
                    (0x40 * Math["random"]()) | 0x0
                  ];
                return m;
              };
            },
            function (i, j, k) {
              "use strict";
              i["exports"] = function (l, m, o) {
                if ("string" != typeof l)
                  throw new Error("The\x20string\x20parameter\x20must\x20be\x20a\x20string.");
                if (l["length"] < 0x1)
                  throw new Error(
                    "The\x20string\x20parameter\x20must\x20be\x201\x20character\x20or\x20longer.",
                  );
                if ("number" != typeof m)
                  throw new Error("The\x20length\x20parameter\x20must\x20be\x20a\x20number.");
                if ("string" != typeof o && o)
                  throw new Error("The\x20character\x20parameter\x20must\x20be\x20a\x20string.");
                var p = -0x1;
                for (m -= l["length"], o || 0x0 === o || (o = "\x20"); ++p < m; ) l += o;
                return l;
              };
            },
          ])));
      })["call"](this, g("8oxB"));
    },
    "8oxB": function (g, j) {
      var k,
        m,
        q = (g["exports"] = {});
      function w() {
        throw new Error("setTimeout\x20has\x20not\x20been\x20defined");
      }
      function x() {
        throw new Error("clearTimeout\x20has\x20not\x20been\x20defined");
      }
      function y(H) {
        if (k === setTimeout) return setTimeout(H, 0x0);
        if ((k === w || !k) && setTimeout) return ((k = setTimeout), setTimeout(H, 0x0));
        try {
          return k(H, 0x0);
        } catch (I) {
          try {
            return k["call"](null, H, 0x0);
          } catch (J) {
            return k["call"](this, H, 0x0);
          }
        }
      }
      !(function () {
        try {
          k = "function" === typeof setTimeout ? setTimeout : w;
        } catch (H) {
          k = w;
        }
        try {
          m = "function" === typeof clearTimeout ? clearTimeout : x;
        } catch (I) {
          m = x;
        }
      })();
      var z,
        A = [],
        B = !0x1,
        C = -0x1;
      function D() {
        B && z && ((B = !0x1), z["length"] ? (A = z["concat"](A)) : (C = -0x1), A["length"] && E());
      }
      function E() {
        if (!B) {
          var H = y(D);
          B = !0x0;
          for (var I = A["length"]; I; ) {
            for (z = A, A = []; ++C < I; ) z && z[C]["run"]();
            ((C = -0x1), (I = A["length"]));
          }
          ((z = null),
            (B = !0x1),
            (function (J) {
              if (m === clearTimeout) return clearTimeout(J);
              if ((m === x || !m) && clearTimeout) return ((m = clearTimeout), clearTimeout(J));
              try {
                m(J);
              } catch (K) {
                try {
                  return m["call"](null, J);
                } catch (L) {
                  return m["call"](this, J);
                }
              }
            })(H));
        }
      }
      function F(H, I) {
        ((this["fun"] = H), (this["array"] = I));
      }
      function G() {}
      ((q["nextTick"] = function (H) {
        var I = new Array(arguments["length"] - 0x1);
        if (arguments["length"] > 0x1) {
          for (var J = 0x1; J < arguments["length"]; J++) I[J - 0x1] = arguments[J];
        }
        (A["push"](new F(H, I)), 0x1 !== A["length"] || B || y(E));
      }),
        (F["prototype"]["run"] = function () {
          this["fun"]["apply"](null, this["array"]);
        }),
        (q["title"] = "browser"),
        (q["browser"] = !0x0),
        (q["env"] = {}),
        (q["argv"] = []),
        (q["version"] = ""),
        (q["versions"] = {}),
        (q["on"] = G),
        (q["addListener"] = G),
        (q["once"] = G),
        (q["off"] = G),
        (q["removeListener"] = G),
        (q["removeAllListeners"] = G),
        (q["emit"] = G),
        (q["prependListener"] = G),
        (q["prependOnceListener"] = G),
        (q["listeners"] = function (H) {
          return [];
        }),
        (q["binding"] = function (H) {
          throw new Error("process.binding\x20is\x20not\x20supported");
        }),
        (q["cwd"] = function () {
          return "/";
        }),
        (q["chdir"] = function (H) {
          throw new Error("process.chdir\x20is\x20not\x20supported");
        }),
        (q["umask"] = function () {
          return 0x0;
        }));
    },
  });
  var b = new Date()["getTime"](),
    c = new (a("fbeZ"))({ serverTime: b })["messagePack"]();
  return c;
}
function khaiPddRuntimeLog(a, b = {}, c = "info") {
  try {
    ipcRenderer["send"]("khai-runtime-log", {
      source: "pdd-preload",
      event: a,
      level: c,
      data: b,
    });
  } catch (d) {}
}
function khaiPddFormatMoney(a) {
  if (a == null || a === "") return "";
  if (typeof a === "string") {
    const b = a["trim"]();
    if (!b) return "";
    if (/¥|￥|\d+\.\d{1,2}/["test"](b)) return b["replace"](/^¥/, "￥");
    a = b["replace"](/[^\d.-]/g, "");
  }
  const c = Number(a);
  return Number["isNaN"](c) ? String(a)["trim"]() : "￥" + (c >= 0x64 && Number["isInteger"](c) ? c / 0x64 : c)["toFixed"](0x2);
}
function khaiPddParseDateSecond(a) {
  const b = String(a || "")["match"](/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (!b) return 0x0;
  const c = new Date(
    Number(b[0x1]),
    Number(b[0x2]) - 0x1,
    Number(b[0x3]),
    Number(b[0x4] || 0x0),
    Number(b[0x5] || 0x0),
    Number(b[0x6] || 0x0),
  );
  const d = Math["floor"](c["getTime"]() / 0x3e8);
  return Number["isFinite"](d) ? d : 0x0;
}
function khaiPddPickValue(a, b) {
  const c = [a],
    d = new Set();
  while (c["length"]) {
    const f = c["shift"]();
    if (!f || typeof f !== "object" || d["has"](f)) continue;
    d["add"](f);
    for (const [g, h] of Object["entries"](f)) {
      if (b["includes"](g) && h != null && h !== "") return h;
      if (h && typeof h === "object") c["push"](h);
    }
  }
  return "";
}
function khaiPddFindArray(a, b) {
  const c = [a],
    d = new Set();
  while (c["length"]) {
    const f = c["shift"]();
    if (!f || typeof f !== "object" || d["has"](f)) continue;
    d["add"](f);
    for (const [g, h] of Object["entries"](f)) {
      if (Array["isArray"](h) && h["length"] && (!b || b["some"]((j) => g["toLowerCase"]()["includes"](j)))) return h;
      if (h && typeof h === "object") c["push"](h);
    }
  }
  return [];
}
function khaiPddPickTraceDescription(a) {
  const b = ["context", "desc", "description", "traceDesc", "content", "text", "message", "logisticsStateDesc", "stateDesc", "remark", "opDesc"],
    c = [a],
    d = new Set(),
    f = [];
  while (c["length"]) {
    const g = c["shift"]();
    if (!g || typeof g !== "object" || d["has"](g)) continue;
    d["add"](g);
    for (const [h, j] of Object["entries"](g)) {
      typeof j === "string" && b["includes"](h) && j["trim"]() && f["push"](j["trim"]());
      j && typeof j === "object" && c["push"](j);
    }
  }
  const g = (h) =>
    h &&
    h["length"] > 0x8 &&
    !/^[\u4e00-\u9fa5]{2,8}快递$/.test(h) &&
    /(包裹|快件|物流|快递|签收|发货|揽收|派件|中转|目的地|已到达|已离开|已送达|已验收|已收取|商家已发货)/.test(h);
  return f["filter"](g)["sort"]((h, j) => j["length"] - h["length"])[0x0] || "";
}
function khaiPddExtractRefundInfo(a) {
  if (!a) return { refundAmount: "", afterSaleStatus: "" };
  const b = [
      "refundAmountStr",
      "refund_amount_str",
      "refundFeeStr",
      "refund_fee_str",
      "actualRefundAmount",
      "realRefundAmount",
      "applyRefundAmount",
      "afterSalesRefundAmount",
      "refundAmount",
      "refund_amount",
      "refundFee",
      "refund_fee",
    ],
    c = [
      "afterSaleStatusDesc",
      "afterSalesStatusDesc",
      "refundStatusDesc",
      "serviceStatusDesc",
      "statusDesc",
      "afterSaleStatus",
      "afterSalesStatus",
      "refundStatus",
    ];
  return {
    refundAmount: khaiPddFormatMoney(khaiPddPickValue(a, b)),
    afterSaleStatus: String(khaiPddPickValue(a, c) || "")["trim"](),
  };
}
function khaiPddTraceEntryText(a) {
  if (a == null) return "";
  if (typeof a === "string") return a["trim"]();
  const b = [
      "time",
      "timeStr",
      "ftime",
      "traceTime",
      "operateTime",
      "acceptTime",
      "createTime",
      "createdAt",
    ],
    d = String(khaiPddPickValue(a, b) || "")["trim"](),
    f = khaiPddPickTraceDescription(a);
  return f ? (f + (d ? "\n" + d : ""))["trim"]() : "";
}
function khaiPddExtractTraceList(...a) {
  for (const b of a) {
    if (!b) continue;
    const c =
      b["traceInfoList"] ||
      b["trace_info_list"] ||
      b["logisticsTraceList"] ||
      b["logistics_trace_list"] ||
      b["trackingInfoList"] ||
      b["tracking_info_list"] ||
      b["logisticsInfo"]?.["traceInfoList"] ||
      b["shippingInfo"]?.["traceInfoList"] ||
      khaiPddFindArray(b, ["trace", "logistics", "tracking"]);
    if (Array["isArray"](c) && c["length"]) {
      return c["map"](khaiPddTraceEntryText)["filter"](Boolean)["slice"](0x0, 0x14);
    }
  }
  return [];
}
function khaiPddBuildLogisticsTrace(...a) {
  return khaiPddExtractTraceList(...a)["join"]("\n");
}
async function khaiPddFetchOrderExtra(a, b, c) {
  const d = { refundAmount: "", afterSaleStatus: "", logisticsTraceList: khaiPddExtractTraceList(b, c), detailFields: [] };
  d["logisticsTrace"] = d["logisticsTraceList"]["join"]("\n");
  if (!a) return d;
  try {
    const f = Math["floor"](Date["now"]() / 0x3e8),
      g = f - 0x16d * 0x18 * 0x3c * 0x3c,
      h = await fetch("https://mms.pinduoduo.com/mercury/mms/afterSales/queryList", {
        method: "post",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          pageSize: 0xa,
          pageNumber: 0x1,
          orderByCreatedAtDesc: !![],
          mallRemarkStatus: null,
          mallRemarkTag: null,
          orderSn: String(a),
          orderNo: String(a),
          startCreatedTime: g,
          endCreatedTime: f,
        }),
      });
    if (h["ok"]) {
      const j = await h["json"](),
        k = khaiPddFindArray(j, ["list", "data", "item", "record", "after"]);
      if (k["length"]) {
        const l = k["find"]((m) => {
          try {
            return JSON["stringify"](m)["includes"](String(a));
          } catch (n) {
            return ![];
          }
        }) || k[0x0],
          m = khaiPddExtractRefundInfo(l);
        ((d["refundAmount"] = m["refundAmount"]), (d["afterSaleStatus"] = m["afterSaleStatus"]), (d["detailFields"] = khaiPddExtractAftersaleFieldsFromRecord(l)));
      }
    }
    khaiPddRuntimeLog("pdd-order-extra-fetch", {
      orderSnTail: String(a)["slice"](-0x6),
      hasRefundAmount: !!d["refundAmount"],
      hasAfterSaleStatus: !!d["afterSaleStatus"],
      logisticsTraceCount: d["logisticsTraceList"]["length"],
      detailFieldCount: d["detailFields"]["length"],
    });
  } catch (f) {
    khaiPddRuntimeLog(
      "pdd-order-extra-fetch-error",
      { orderSnTail: String(a)["slice"](-0x6), message: f?.["message"] || String(f) },
      "warn",
    );
  }
  return d;
}
function khaiPddTextOf(a) {
  return String((a && (a["innerText"] || a["textContent"])) || "")["replace"](/\r/g, "")["trim"]();
}
function khaiPddCountTraceEntries(a) {
  return (String(a || "")["match"](/\d{4}[-/]\d{2}[-/]\d{2}\s+\d{2}:\d{2}:\d{2}/g) || [])["length"];
}
function khaiPddLooksLikeAftersaleOrder(a) {
  const b = String((a && (a["afterSaleStatus"] || a["orderStatus"])) || "")["trim"]();
  return !!(a?.["orderSn"] && /(售后|退款|退货|退差价|换货|退款成功|退款中|仅退款)/.test(b));
}
function khaiPddReadNextLineValue(a, b, c = 0x0) {
  for (let d = c; d < a["length"]; d++) {
    const f = a[d];
    for (const g of b) {
      if (f === g || f === g + "：" || f === g + ":") {
        for (let h = d + 0x1; h < a["length"]; h++) {
          if (!a[h] || a[h] === "复制" || a[h] === "-") continue;
          return a[h];
        }
      }
      if (f["startsWith"](g + "：") || f["startsWith"](g + ":")) {
        const h = f["replace"](new RegExp("^" + g + "[：:]\\s*"), "")["trim"]();
        if (h) return h;
      }
    }
  }
  return "";
}
const khaiPddAftersaleExtraLabels = [
  "售后单号",
  "售后编号",
  "售后类型",
  "申请原因",
  "退款原因",
  "退货原因",
  "申请时间",
  "退款时间",
  "退货包运费",
  "退货物流",
  "物流公司",
  "快递公司",
  "快递单号",
  "运单号",
  "处理结果",
  "商家处理",
  "平台处理",
  "责任方",
  "退款去向",
];
function khaiPddIsAftersaleExtraLabel(a) {
  const b = String(a || "")["trim"](),
    c = b["replace"](/[：:]\s*$/, "")["trim"](),
    d = ["订单编号", "下单时间", "售后状态", "退款金额", "物流轨迹", "协商详情", "聊天记录", ...khaiPddAftersaleExtraLabels];
  return d["some"]((f) => c === f || b["startsWith"](f + "：") || b["startsWith"](f + ":"));
}
function khaiPddCleanAftersaleExtraValue(a) {
  const b = String(a == null ? "" : a)
    ["replace"](/\r/g, "")
    ["replace"](/\s+/g, " ")
    ["trim"]();
  if (!b || b === "-" || /^(复制|关闭|查看全部|点击查看更多|修改备注|物流信息|查看说明书|新增额外包裹|查看视频)$/.test(b)) return "";
  if (khaiPddIsAftersaleExtraLabel(b)) return "";
  return b;
}
function khaiPddReadAftersaleExtraValue(a, b) {
  for (let c = 0x0; c < a["length"]; c++) {
    const d = String(a[c] || "")["trim"](),
      f = d["match"](new RegExp("^" + b + "[：:]\\s*(.+)$"));
    if (f?.[0x1]) {
      const g = khaiPddCleanAftersaleExtraValue(f[0x1]);
      if (g) return g;
    }
    if (d === b || d === b + "：" || d === b + ":") {
      for (let g = c + 0x1; g < Math["min"](a["length"], c + 0x5); g++) {
        if (khaiPddIsAftersaleExtraLabel(a[g])) break;
        const h = khaiPddCleanAftersaleExtraValue(a[g]);
        if (h) return h;
      }
    }
  }
  return "";
}
function khaiPddPushAftersaleExtraField(a, b, c) {
  const d = khaiPddCleanAftersaleExtraValue(c);
  if (!d) return;
  const f = b === "售后编号" ? "售后单号" : b;
  if (a["some"]((g) => g["label"] === f || g["value"] === d)) return;
  a["push"]({ label: f, value: d });
}
function khaiPddMergeAftersaleExtraFields(...a) {
  const b = [];
  for (const c of a) {
    if (!Array["isArray"](c)) continue;
    c["forEach"]((d) => khaiPddPushAftersaleExtraField(b, d?.["label"] || "", d?.["value"] || ""));
  }
  return b["slice"](0x0, 0x10);
}
function khaiPddExtractAftersaleFieldsFromLines(a, b = {}) {
  const c = [];
  khaiPddPushAftersaleExtraField(c, "售后单号", b["id"] || b["afterSaleId"] || b["aftersaleId"] || "");
  for (const d of khaiPddAftersaleExtraLabels) khaiPddPushAftersaleExtraField(c, d, khaiPddReadAftersaleExtraValue(a, d));
  return c;
}
function khaiPddExtractAftersaleFieldsFromRecord(a) {
  if (!a) return [];
  const b = [];
  khaiPddPushAftersaleExtraField(b, "售后单号", a["id"] || a["afterSalesId"] || a["afterSaleId"] || "");
  khaiPddPushAftersaleExtraField(b, "售后类型", khaiPddPickValue(a, ["afterSalesTypeName", "afterSaleTypeName", "serviceTypeName", "typeName"]));
  khaiPddPushAftersaleExtraField(b, "申请原因", khaiPddPickValue(a, ["reason", "applyReason", "afterSalesReason", "refundReason"]));
  khaiPddPushAftersaleExtraField(b, "申请时间", khaiPddPickValue(a, ["createdAtStr", "createdTimeStr", "applyTimeStr", "applyCreatedAtStr"]));
  khaiPddPushAftersaleExtraField(b, "退款时间", khaiPddPickValue(a, ["refundTimeStr", "successTimeStr"]));
  khaiPddPushAftersaleExtraField(b, "退货包运费", khaiPddFormatMoney(khaiPddPickValue(a, ["freightAmount", "returnFreightAmount", "shippingFee"])));
  return b;
}
function khaiPddExtractAftersaleDetailHint(a, b) {
  if (!a) return {};
  const c = String(b || "")["trim"](),
    d = [];
  Array["from"](a["querySelectorAll"]("a[href],[href],[data-href],[data-url],[data-link],[data-router],[data-route]"))["forEach"]((f) => {
    Array["from"](f["attributes"] || [])["forEach"]((g) => {
      if (!/(href|url|link|router|route)/i.test(g["name"])) return;
      const h = String(g["value"] || "")["trim"]();
      /after/i.test(h) && d["push"](h);
    });
  });
  for (const f of d) {
    let g = f;
    try {
      g = new URL(f, location["origin"])["href"];
    } catch (h) {}
    if (!/aftersales/i.test(g) || !/detail/i.test(g)) continue;
    if (c && !g["includes"](c) && !/id=\d+/.test(g)) continue;
    const h = g["match"](/[?&]id=(\d+)/)?.[0x1] || "";
    return { aftersaleId: h, aftersaleDetailUrl: g };
  }
  return {};
}
function khaiPddCleanAftersaleTrace(a) {
  return String(a || "")
    ["replace"](/\r/g, "")
    ["replace"](/去修改物流信息/g, "")
    ["split"](/\n+/)
    ["map"]((b) => b["trim"]())
    ["filter"]((b) => b && !/^(查看全部|点击查看更多|复制|关闭)$/.test(b))
    ["join"]("\n")
    ["replace"](/\n{3,}/g, "\n\n")
    ["trim"]();
}
function khaiPddParseAftersaleDetailDocument(a, b = {}, c = {}) {
  if (!a?.["body"]) return null;
  const d = khaiPddTextOf(a["body"]),
    f = d["split"](/\n+/)["map"]((p) => p["trim"]())["filter"](Boolean),
    g = String(b["orderSn"] || c["orderSn"] || (d["match"](/订单编号[:：]?\s*([0-9-]+)/) || [])[0x1] || "")["trim"]();
  if (!g) return null;
  const h = a["querySelector"]("#detail-express-box"),
    j = khaiPddCleanAftersaleTrace(h ? khaiPddTextOf(h) : "");
  let k = khaiPddFormatMoney(khaiPddReadNextLineValue(f, ["退款金额"]));
  !k && (k = khaiPddFormatMoney((d["match"](/退款金额[:：]?\s*([￥¥]?\s*\d+(?:\.\d{1,2})?)/) || [])[0x1] || ""));
  const l = khaiPddReadNextLineValue(f, ["售后类型"]) || c["afterSalesTypeName"] || "";
  let m = "";
  const n = f["findIndex"]((p) => p === "售后状态" || p === "售后状态：" || p === "售后状态:");
  if (n >= 0x0) {
    for (let p = n + 0x1; p < f["length"]; p++) {
      const q = f[p];
      if (/^(退款金额|协商详情|聊天记录|联系消费者|备注|订单权益|物流轨迹)/.test(q)) break;
      if (/如何降低|查看整改建议|平台邀请|本单商品/.test(q)) continue;
      if (/(退款|退货|成功|关闭|处理中|驳回|同意|拒绝)/.test(q)) {
        m = q;
        break;
      }
    }
  }
  !m && (m = String(c["afterSalesTitle"] || b["afterSaleStatus"] || "")["trim"]());
  l && m && !m["includes"](l) && (m = l + "，" + m);
  !m && (m = l);
  return {
    orderSn: g,
    aftersaleId: c["id"] || "",
    refundAmount: k || khaiPddFormatMoney(c["refundAmount"]),
    afterSaleStatus: m,
    logisticsTrace: j,
    detailFields: khaiPddMergeAftersaleExtraFields(khaiPddExtractAftersaleFieldsFromRecord(c), khaiPddExtractAftersaleFieldsFromLines(f, c)),
    traceCount: khaiPddCountTraceEntries(j),
  };
}
function khaiPddBuildAftersaleSearchRanges(a) {
  const b = Math["floor"](Date["now"]() / 0x3e8),
    c = Number(a?.["orderCreatedAtSec"] || 0x0),
    d = [];
  if (c) {
    d["push"]([Math["max"](0x0, c - 0x18 * 0xe10), Math["min"](b + 0x18 * 0xe10, c + 0xf * 0x18 * 0xe10), 0x6]);
    d["push"]([Math["max"](0x0, c - 0x18 * 0xe10), Math["min"](b + 0x18 * 0xe10, c + 0x2d * 0x18 * 0xe10), 0x8]);
  } else d["push"]([b - 0x78 * 0x18 * 0xe10, b, 0x8]);
  return d;
}
async function khaiPddFindAftersaleRecordForOrder(a) {
  const b = String(a?.["orderSn"] || "")["trim"]();
  if (!b) return null;
  if (a?.["aftersaleId"]) {
    return {
      id: a["aftersaleId"],
      orderSn: b,
      refundAmount: a["refundAmount"] || "",
      afterSalesTitle: a["afterSaleStatus"] || "",
      detailUrl: a["aftersaleDetailUrl"] || "",
      detailFields: a["detailFields"] || [],
    };
  }
  const c = new Set();
  for (const [d, f, g] of khaiPddBuildAftersaleSearchRanges(a)) {
    const h = d + ":" + f;
    if (c["has"](h)) continue;
    c["add"](h);
    for (let j = 0x1; j <= g; j++) {
      const k = await fetch("https://mms.pinduoduo.com/mercury/mms/afterSales/queryList", {
        method: "post",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          pageSize: 0x64,
          pageNumber: j,
          orderByCreatedAtDesc: !![],
          mallRemarkStatus: null,
          mallRemarkTag: null,
          startCreatedTime: d,
          endCreatedTime: f,
        }),
      });
      if (!k["ok"]) break;
      const l = await k["json"](),
        m = l?.["result"]?.["list"] || khaiPddFindArray(l, ["list", "data", "item", "record", "after"]);
      if (!Array["isArray"](m) || !m["length"]) break;
      const n = m["find"]((p) => String(p?.["orderSn"] || "") === b) || m["find"]((p) => {
        try {
          return JSON["stringify"](p)["includes"](b);
        } catch (q) {
          return ![];
        }
      });
      if (n) {
        khaiPddRuntimeLog("pdd-chat-auto-aftersale-find-record", {
          orderSnTail: b["slice"](-0x6),
          aftersaleIdTail: String(n["id"] || "")["slice"](-0x6),
          pageNumber: j,
          hasRefundAmount: !!n["refundAmount"],
        });
        return n;
      }
      if (m["length"] < 0x64) break;
    }
  }
  return null;
}
async function khaiPddFetchAftersaleDetailByFrame(a, b) {
  const c = String(a?.["orderSn"] || b?.["orderSn"] || "")["trim"](),
    d = String(b?.["id"] || "")["trim"]();
  if (!c || !d) return null;
  const f = "khai-pdd-aftersale-detail-frame",
    g = b?.["detailUrl"] || "https://mms.pinduoduo.com/aftersales-ssr/detail?id=" + encodeURIComponent(d) + "&orderSn=" + encodeURIComponent(c);
  let k = null;
  try {
    const l = await fetch(g, { method: "GET", credentials: "include", mode: "cors" });
    if (l["ok"]) {
      const m = await l["text"](),
        n = new DOMParser()["parseFromString"](m, "text/html");
      k = khaiPddParseAftersaleDetailDocument(n, a, b);
      if (k?.["refundAmount"] && k?.["logisticsTrace"] && k["traceCount"] >= 0x2) return k;
    }
  } catch (l) {}
  document["getElementById"](f)?.["remove"]();
  const h = document["createElement"]("iframe");
  ((h["id"] = f),
    (h["style"]["cssText"] =
      "position:fixed;left:-10000px;top:-10000px;width:1200px;height:900px;opacity:0;pointer-events:none;z-index:-1;"),
    h["setAttribute"]("aria-hidden", "true"),
    (h["src"] = g),
    document["body"]["appendChild"](h));
  const j = (l) => new Promise((m) => setTimeout(m, l));
  try {
    for (let l = 0x0; l < 0x1e; l++) {
      await j(0x12c);
      const m = h["contentDocument"],
        n = h["contentWindow"];
      if (!m?.["body"]) continue;
      try {
        n?.["scrollTo"]?.(0x0, 0x1869f);
      } catch (p) {}
      const p = m["querySelector"]("#detail-express-box");
      if (p) {
        try {
          p["scrollTop"] = p["scrollHeight"] || 0x1869f;
        } catch (q) {}
        Array["from"](p["querySelectorAll"]("button,a,span,div"))["forEach"]((q) => {
          const r = khaiPddTextOf(q);
          if (/^(查看全部|点击查看更多)$/.test(r) && !q["__khaiPddClickedViewAll"]) {
            q["__khaiPddClickedViewAll"] = !![];
            try {
              q["click"]();
            } catch (s) {}
          }
        });
      }
      k = khaiPddParseAftersaleDetailDocument(m, a, b);
      if (k?.["refundAmount"] && k?.["logisticsTrace"] && k["traceCount"] >= 0x2) break;
    }
  } finally {
    h["remove"]();
  }
  return k;
}
const khaiPddAutoAftersaleDetailCache = {},
  khaiPddAutoAftersaleDetailInflight = {};
function khaiPddGetCachedAutoAftersaleDetail(a) {
  const b = khaiPddAutoAftersaleDetailCache[String(a || "")];
  return b && Date["now"]() - b["time"] < 0x927c0 ? b["data"] : null;
}
function khaiPddRequestAutoAftersaleDetail(a) {
  const b = String(a?.["orderSn"] || "")["trim"]();
  if (!b || !khaiPddLooksLikeAftersaleOrder(a)) return null;
  const c = khaiPddGetCachedAutoAftersaleDetail(b);
  if (c?.["logisticsTrace"]) return Promise["resolve"](c);
  if (khaiPddAutoAftersaleDetailInflight[b]) return khaiPddAutoAftersaleDetailInflight[b];
  khaiPddRuntimeLog("pdd-chat-auto-aftersale-fetch-start", {
    orderSnTail: b["slice"](-0x6),
    hasOrderTime: !!a["orderCreatedAtSec"],
  });
  khaiPddAutoAftersaleDetailInflight[b] = (async () => {
    const d = await khaiPddFindAftersaleRecordForOrder(a);
    if (!d?.["id"]) {
      khaiPddRuntimeLog("pdd-chat-auto-aftersale-fetch-error", { orderSnTail: b["slice"](-0x6), reason: "record-not-found" }, "warn");
      return null;
    }
    const provisional = {
      orderSn: b,
      aftersaleId: d["id"],
      refundAmount: khaiPddFormatMoney(d["refundAmount"]) || a["refundAmount"] || "",
      afterSaleStatus: d["afterSalesTitle"] || a["afterSaleStatus"] || "",
      logisticsTrace: "",
      detailFields: khaiPddMergeAftersaleExtraFields(d["detailFields"], khaiPddExtractAftersaleFieldsFromRecord(d), a["detailFields"]),
      traceCount: 0x0,
    };
    khaiPddAutoAftersaleDetailCache[b] = { time: Date["now"](), data: provisional };
    const f = await khaiPddFetchAftersaleDetailByFrame(a, d),
      g = {
        orderSn: b,
        aftersaleId: d["id"],
        refundAmount: f?.["refundAmount"] || provisional["refundAmount"] || "",
        afterSaleStatus: f?.["afterSaleStatus"] || d["afterSalesTitle"] || a["afterSaleStatus"] || "",
        logisticsTrace: f?.["logisticsTrace"] || "",
        detailFields: khaiPddMergeAftersaleExtraFields(f?.["detailFields"], provisional["detailFields"]),
        traceCount: f?.["traceCount"] || 0x0,
      };
    khaiPddAutoAftersaleDetailCache[b] = { time: Date["now"](), data: g };
    khaiPddRuntimeLog("pdd-chat-auto-aftersale-fetch-success", {
      orderSnTail: b["slice"](-0x6),
      aftersaleIdTail: String(d["id"] || "")["slice"](-0x6),
      hasRefundAmount: !!g["refundAmount"],
      traceCount: g["traceCount"] || khaiPddCountTraceEntries(g["logisticsTrace"]),
      detailFieldCount: g["detailFields"]["length"],
      detailLoaded: !!f,
    });
    return g;
  })()["catch"]((d) => {
    khaiPddRuntimeLog("pdd-chat-auto-aftersale-fetch-error", { orderSnTail: b["slice"](-0x6), message: d?.["message"] || String(d) }, "warn");
    return null;
  })["finally"](() => {
    delete khaiPddAutoAftersaleDetailInflight[b];
  });
  return khaiPddAutoAftersaleDetailInflight[b];
}
function khaiPddGetActiveChatId() {
  const a = [
    ".chat-list-box\x20.chat-item-box.transition.active[data-random]",
    ".chat-item-box.transition.active[data-random]",
    ".chat-item-box.active[data-random]",
    "[data-random].active",
  ];
  for (const b of a) {
    const c = document["querySelector"](b),
      d = c?.["getAttribute"]("data-random")?.["split"]("-")?.[0x0] || "";
    if (d) return d;
  }
  return "";
}
function khaiPddReadVisibleLogisticsTrace() {
  const a = document["querySelector"](".right-panel-container"),
    b = [a, document["body"]]["filter"](Boolean);
  const cleanTraceText = (c) =>
    String(c || "")
      ["replace"](/\r/g, "")
      ["replace"](/(^|\n)\s*\d+(?=您的包裹|您的快件|【)/g, "$1")
      ["replace"](/([^\n])(\d{4}[-/]\d{2}[-/]\d{2}\s+\d{2}:\d{2}:\d{2})/g, "$1\n$2")
      ["replace"](/\n{3,}/g, "\n\n")
      ["split"](/\n+/)
      ["map"]((d) => d["trim"]())
      ["filter"]((d) => d && !/^\d+$/.test(d) && !/^(点击查看更多|查看全部|关闭|复制)$/.test(d))
      ["join"]("\n")
      ["trim"]();
  const isVisible = (c) => {
      const d = c?.["getBoundingClientRect"]?.();
      return !!d && d["width"] > 0x0 && d["height"] > 0x0;
    },
    detailLooksUseful = (c) =>
      c &&
      !/^\d{4}[-/]\d{2}[-/]\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(c) &&
      !/^(点击查看更多|查看全部|关闭|复制)$/.test(c) &&
      /(包裹|快件|物流|快递|签收|发货|揽收|派件|中转|目的地|已到达|已离开|已送达|已验收|已收取)/.test(c);
  const c = [];
  for (const d of b) {
    c["push"](
      ...Array["from"](
        d["querySelectorAll"](
          ".shipping-box .shipping-item, .shipping-history .shipping-item, .shipping-item, .logistics-item, .express-item, .timeline-item, .ant-timeline-item, .el-timeline-item",
        ),
      ),
    );
  }
  const d = Array["from"](new Set(c))["filter"](isVisible);
  if (d["length"]) {
    return d
      ["map"]((f) => cleanTraceText(f["innerText"] || f["textContent"] || ""))
      ["filter"]((f) => /\d{4}[-/]\d{2}[-/]\d{2}/["test"](f) && f["length"] > 0xa && detailLooksUseful(f))
      ["slice"](0x0, 0x14)
      ["join"]("\n\n");
  }
  const e = b
      ["map"]((f) => (f["innerText"] || f["textContent"] || "")["replace"](/\r/g, "")["trim"]())
      ["filter"]((f) => f["includes"]("快递信息") || f["includes"]("物流信息") || f["includes"]("您的包裹") || f["includes"]("您的快件"))
      ["sort"]((f, g) => f["length"] - g["length"])[0x0];
  if (!e) return "";
  const f = e["split"](/\n+/)["map"]((g) => g["trim"]())["filter"](Boolean),
    g = [];
  for (let h = 0x0; h < f["length"]; h++) {
    if (/^\d{4}[-/]\d{2}[-/]\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(f[h])) {
      const j = f[h + 0x1] || "",
        k = f[h - 0x1] || "",
        l = detailLooksUseful(k) ? k : detailLooksUseful(j) ? j : "";
      l && g["push"](l + "\n" + f[h]);
    }
  }
  return g["slice"](0x0, 0x14)["join"]("\n\n");
}
const khaiPddLastVisibleOrderSnapshotByChat = {};
function khaiPddReadVisibleOrderPanel(a) {
  const b = khaiPddReadVisibleLogisticsTrace(),
    c = a ? khaiPddLastVisibleOrderSnapshotByChat[a] : null,
    d = document["querySelector"](".right-panel-container");
  if (!d) return b && c ? { ...c, logisticsTrace: b } : null;
  const rawText = (d["innerText"] || d["textContent"] || "")["replace"](/\r/g, ""),
    lines = rawText["split"](/\n+/)["map"]((k) => k["trim"]())["filter"](Boolean),
    e = rawText["replace"](/\s+/g, " ")["trim"]();
  if (!e || !e["includes"]("订单编号")) return b && c ? { ...c, logisticsTrace: b } : null;
  const f = e["match"](/订单编号[:：]\s*([0-9-]+)/),
    h =
      e["match"](/退款金额[:：]?\s*([￥¥]?\s*\d+(?:\.\d{1,2})?)/) ||
      e["match"](/实退(?:金额)?[:：]?\s*([￥¥]?\s*\d+(?:\.\d{1,2})?)/),
    n = e["match"](/下单时间[:：]?\s*(\d{4}[\/-]\d{1,2}[\/-]\d{1,2}(?:\s+\d{1,2}:\d{1,2}(?::\d{1,2})?)?)/);
  if (!f?.[0x1]) return b && c ? { ...c, logisticsTrace: b } : null;
  const detailHint = khaiPddExtractAftersaleDetailHint(d, f[0x1]),
    detailFields = khaiPddExtractAftersaleFieldsFromLines(lines, { id: detailHint["aftersaleId"] || "" });
  let g = "";
  for (let k = 0x0; k < lines["length"]; k++) {
    const l = lines[k]["match"](/^售后状态[:：]?\s*(.*)$/);
    if (!l) continue;
    g = (l[0x1] || "")["trim"]();
    if (!g) {
      for (let m = k + 0x1; m < lines["length"]; m++) {
        if (/^(订单编号|下单时间|复制|退货包运费|修改备注|物流信息|小额打款|查看说明书|新增额外包裹|查看视频)/.test(lines[m])) break;
        g = lines[m];
        break;
      }
    }
    break;
  }
  !g && (g = e["match"](/售后状态[:：]\s*(.{1,40}?)(?=\s+(退款金额|退货金额|退货包运费|物流信息|快递信息|订单编号|下单时间|复制)|$)/)?.[0x1]?.["trim"]() || "");
  const j = {
    orderSn: f[0x1],
    afterSaleStatus: g || "",
    refundAmount: h?.[0x1] ? khaiPddFormatMoney(h[0x1]) : "",
    logisticsTrace: b,
    orderCreatedAtSec: n?.[0x1] ? khaiPddParseDateSecond(n[0x1]) : c?.["orderCreatedAtSec"] || 0x0,
    orderCreatedAtText: n?.[0x1] || "",
    aftersaleId: detailHint["aftersaleId"] || "",
    aftersaleDetailUrl: detailHint["aftersaleDetailUrl"] || "",
    detailFields,
  };
  a && (khaiPddLastVisibleOrderSnapshotByChat[a] = j);
  return j;
}
function khaiPddEnsureOrderExtraStyle() {
  if (document["getElementById"]("khai-pdd-order-extra-style")) return;
  const a = document["createElement"]("style");
  ((a["id"] = "khai-pdd-order-extra-style"),
    (a["textContent"] = `
      #khai-pdd-order-extra-panel {
        position: fixed;
        top: 118px;
        right: 390px;
        width: 390px;
        height: 440px;
        min-width: 360px;
        min-height: 240px;
        max-width: calc(100vw - 430px);
        max-height: calc(100vh - 140px);
        overflow: hidden;
        z-index: 2147483646;
        padding: 12px 14px 18px;
        background: #fff;
        border: 1px solid #dbeafe;
        border-left: 4px solid #3b82f6;
        border-radius: 8px;
        color: #1f2937;
        font-size: 12px;
        line-height: 1.55;
        box-shadow: 0 12px 34px rgba(15, 23, 42, .16);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }
      #khai-pdd-order-extra-panel .khai-order-extra-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
        font-weight: 700;
        color: #2563eb;
      }
      #khai-pdd-order-extra-panel .khai-order-extra-close {
        border: 0;
        background: #eff6ff;
        color: #2563eb;
        border-radius: 4px;
        padding: 2px 7px;
        cursor: pointer;
        font-size: 12px;
      }
      #khai-pdd-order-extra-panel .khai-order-extra-body {
        display: flex;
        flex: 1 1 auto;
        min-height: 0;
        flex-direction: column;
      }
      #khai-pdd-order-extra-panel .khai-order-extra-line {
        margin: 3px 0;
        word-break: break-word;
      }
      #khai-pdd-order-extra-panel .khai-order-extra-trace-line {
        display: flex;
        flex: 1 1 auto;
        min-height: 0;
        flex-direction: column;
      }
      #khai-pdd-order-extra-panel .khai-order-extra-label {
        color: #6b7280;
      }
      #khai-pdd-order-extra-panel .khai-order-extra-money {
        color: #ef4444;
        font-weight: 700;
      }
      #khai-pdd-order-extra-panel .khai-order-extra-fields {
        margin: 5px 0 6px;
        padding: 6px 8px;
        background: #f9fafb;
        border: 1px solid #eef2ff;
        border-radius: 4px;
      }
      #khai-pdd-order-extra-panel .khai-order-extra-field {
        display: flex;
        gap: 6px;
        margin: 2px 0;
      }
      #khai-pdd-order-extra-panel .khai-order-extra-field .khai-order-extra-label {
        flex: 0 0 auto;
      }
      #khai-pdd-order-extra-panel .khai-order-extra-value {
        flex: 1 1 auto;
        min-width: 0;
        color: #374151;
      }
      #khai-pdd-order-extra-panel .khai-order-extra-trace {
        margin-top: 4px;
        padding: 6px 8px;
        background: #f8fafc;
        border-radius: 4px;
        white-space: pre-wrap;
        color: #374151;
        flex: 1 1 auto;
        min-height: 120px;
        max-height: none;
        overflow: auto;
      }
      #khai-pdd-order-extra-panel .khai-order-extra-resize {
        position: absolute;
        right: 5px;
        bottom: 5px;
        width: 16px;
        height: 16px;
        cursor: nwse-resize;
        opacity: .72;
      }
      #khai-pdd-order-extra-panel .khai-order-extra-resize::after {
        content: "";
        position: absolute;
        right: 1px;
        bottom: 1px;
        width: 10px;
        height: 10px;
        border-right: 2px solid #93c5fd;
        border-bottom: 2px solid #93c5fd;
        border-radius: 2px;
      }
      #khai-pdd-order-extra-panel.khai-order-extra-resizing {
        user-select: none;
      }
      #khai-pdd-order-extra-panel.khai-order-extra-collapsed {
        width: 236px !important;
        height: auto !important;
        min-width: 0;
        min-height: 0;
        padding: 9px 12px;
        cursor: pointer;
      }
      #khai-pdd-order-extra-panel.khai-order-extra-collapsed .khai-order-extra-title {
        margin-bottom: 0;
      }
      #khai-pdd-order-extra-panel.khai-order-extra-collapsed .khai-order-extra-body,
      #khai-pdd-order-extra-panel.khai-order-extra-collapsed .khai-order-extra-resize {
        display: none;
      }
      @media (max-width: 1200px) {
        #khai-pdd-order-extra-panel {
          right: 24px;
          top: 106px;
          max-width: calc(100vw - 48px);
        }
      }
    `),
    document["head"]["appendChild"](a));
}
function khaiPddEscapeHtml(a) {
  return String(a == null ? "" : a)["replace"](/[&<>"']/g, (b) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[b]);
}
function khaiPddRenderAftersaleExtraFields(a) {
  const b = khaiPddMergeAftersaleExtraFields(a);
  if (!b["length"]) return "";
  return `
      <div class="khai-order-extra-fields">
        ${b["map"]((c) => `
        <div class="khai-order-extra-field">
          <span class="khai-order-extra-label">${khaiPddEscapeHtml(c["label"])}：</span>
          <span class="khai-order-extra-value">${khaiPddEscapeHtml(c["value"])}</span>
        </div>`)["join"]("")}
      </div>`;
}
function khaiPddClampNumber(a, b, c) {
  return Math["max"](b, Math["min"](c, Number(a) || b));
}
function khaiPddApplyOrderExtraPanelSize(a) {
  try {
    const b = JSON["parse"](localStorage["getItem"]("khai-pdd-order-extra-size") || "{}"),
      c = window["innerWidth"] > 0x4b0 ? window["innerWidth"] - 0x1ae : window["innerWidth"] - 0x30,
      d = window["innerHeight"] - 0x8c;
    b["width"] && (a["style"]["width"] = khaiPddClampNumber(b["width"], 0x168, Math["max"](0x168, c)) + "px");
    b["height"] && (a["style"]["height"] = khaiPddClampNumber(b["height"], 0xf0, Math["max"](0xf0, d)) + "px");
  } catch (b) {}
}
function khaiPddBindOrderExtraPanelResize(a) {
  if (!a || a["__khaiPddResizeBound"]) return;
  a["__khaiPddResizeBound"] = !![];
  a["addEventListener"]("pointerdown", (b) => {
    const c = b["target"]?.["closest"]?.(".khai-order-extra-resize");
    if (!c) return;
    b["preventDefault"]();
    const d = a["getBoundingClientRect"](),
      f = b["clientX"],
      g = b["clientY"],
      h = window["innerWidth"] > 0x4b0 ? window["innerWidth"] - 0x1ae : window["innerWidth"] - 0x30,
      j = window["innerHeight"] - 0x8c;
    let resizeWidth = d["width"],
      resizeHeight = d["height"];
    a["classList"]["add"]("khai-order-extra-resizing");
    const k = (l) => {
        resizeWidth = khaiPddClampNumber(d["width"] + l["clientX"] - f, 0x168, Math["max"](0x168, h));
        resizeHeight = khaiPddClampNumber(d["height"] + l["clientY"] - g, 0xf0, Math["max"](0xf0, j));
        a["style"]["width"] = resizeWidth + "px";
        a["style"]["height"] = resizeHeight + "px";
      },
      l = () => {
        document["removeEventListener"]("pointermove", k, !![]);
        document["removeEventListener"]("pointerup", l, !![]);
        a["classList"]["remove"]("khai-order-extra-resizing");
        try {
          localStorage["setItem"]("khai-pdd-order-extra-size", JSON["stringify"]({ width: Math["round"](resizeWidth), height: Math["round"](resizeHeight) }));
        } catch (m) {}
      };
    document["addEventListener"]("pointermove", k, !![]);
    document["addEventListener"]("pointerup", l, !![]);
  });
}
let khaiPddCollapsedOrderExtraKey = "";
function khaiPddRenderOrderExtraPanel(a, b) {
  khaiPddEnsureOrderExtraStyle();
  if (!a?.["orderSn"]) return;
  const afterSaleStatus =
    b?.["afterSaleStatus"] && !/^\d+$/.test(String(b["afterSaleStatus"]))
      ? b["afterSaleStatus"]
      : a["afterSaleStatus"] || b?.["afterSaleStatus"] || "";
  if (!khaiPddLooksLikeAftersaleOrder({ ...a, afterSaleStatus })) return;
  const c =
    a["orderSn"] +
    ":" +
    afterSaleStatus;
  const isCollapsed = khaiPddCollapsedOrderExtraKey === c;
  let d = document["getElementById"]("khai-pdd-order-extra-panel");
  d ||
    ((d = document["createElement"]("div")),
    (d["id"] = "khai-pdd-order-extra-panel"),
    khaiPddApplyOrderExtraPanelSize(d));
  khaiPddBindOrderExtraPanelResize(d);
  d["classList"]["toggle"]("khai-order-extra-collapsed", isCollapsed);
  const f = b?.["refundAmount"] || "",
    g = afterSaleStatus,
    h = b?.["logisticsTrace"] || "",
    j = h || (b?.["loading"] ? "正在从售后详情读取完整物流..." : "暂无物流轨迹，正在继续监听更新"),
    k = b?.["loading"] && !f ? "加载中..." : f || "获取中",
    l = khaiPddMergeAftersaleExtraFields(
      b?.["detailFields"],
      a?.["detailFields"],
      a?.["orderCreatedAtText"] ? [{ label: "下单时间", value: a["orderCreatedAtText"] }] : [],
      a?.["aftersaleId"] ? [{ label: "售后单号", value: a["aftersaleId"] }] : [],
    ),
    m = khaiPddRenderAftersaleExtraFields(l);
  d["innerHTML"] = `
    <div class="khai-order-extra-title">
      <span>${isCollapsed ? "售后信息已收起" : "快回检测到售后状态"}</span>
      <button class="khai-order-extra-close" type="button">${isCollapsed ? "展开" : "收起"}</button>
    </div>
    <div class="khai-order-extra-body">
      <div class="khai-order-extra-line">
        <span class="khai-order-extra-label">订单编号：</span>
        <span>${khaiPddEscapeHtml(a["orderSn"])}</span>
      </div>
      <div class="khai-order-extra-line">
        <span class="khai-order-extra-label">售后状态：</span>
        <span>${khaiPddEscapeHtml(g || "获取中")}</span>
      </div>
      <div class="khai-order-extra-line">
        <span class="khai-order-extra-label">退款金额：</span>
        <span class="khai-order-extra-money">${khaiPddEscapeHtml(k)}</span>
      </div>
      ${m}
      <div class="khai-order-extra-line khai-order-extra-trace-line">
        <span class="khai-order-extra-label">物流轨迹：</span>
        <div class="khai-order-extra-trace">${khaiPddEscapeHtml(j)}</div>
      </div>
    </div>
    <div class="khai-order-extra-resize" title="拖动调整大小"></div>
  `;
  const togglePanel = () => {
    const l = khaiPddCollapsedOrderExtraKey === c;
    khaiPddCollapsedOrderExtraKey = l ? "" : c;
    khaiPddRuntimeLog(l ? "pdd-order-extra-expand" : "pdd-order-extra-collapse", { orderSnTail: String(a["orderSn"])["slice"](-0x6) });
    khaiPddRenderOrderExtraPanel(a, b);
  };
  d["querySelector"](".khai-order-extra-close")?.["addEventListener"]("click", (l) => {
    l["stopPropagation"]();
    togglePanel();
  });
  isCollapsed &&
    d["querySelector"](".khai-order-extra-title")?.["addEventListener"]("click", () => {
      togglePanel();
    });
  document["body"]["appendChild"](d);
}
async function khaiPddFetchOrderContext(a, b) {
  try {
    const c = await fetch("https://mms.pinduoduo.com/latitude/order/userAllOrder", {
      method: "POST",
      credentials: "include",
      mode: "cors",
      headers: { "Content-Type": "application/json", "anti-content": antigain() },
      body: JSON["stringify"]({ showHistory: !![], pageNo: 0x1, pageSize: 0xa, uid: a }),
    });
    if (!c["ok"]) return { orderItem: null, orderDetail: null };
    const d = await c["json"](),
      f = d?.["result"]?.["orders"] || [],
      g = f["find"]((h) => String(h?.["orderSn"] || "") === String(b)) || null;
    if (!g) return { orderItem: null, orderDetail: null };
    try {
      const h = await fetch("https://mms.pinduoduo.com/fopen/order/detail", {
        method: "POST",
        credentials: "include",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          biz_code: "chat",
          order_sn: b,
          receiver_info: ["mobile", "name", "address"],
          scene_code: "mall_customer_wait_shipping_sign",
        }),
      });
      if (h["ok"]) {
        const j = await h["json"]();
        return { orderItem: g, orderDetail: j?.["result"] || null };
      }
    } catch (h) {}
    return { orderItem: g, orderDetail: null };
  } catch (c) {
    return { orderItem: null, orderDetail: null };
  }
}
let khaiPddLastVisibleOrderKey = "";
async function khaiPddSyncVisibleOrderExtra() {
  const activeChatId = khaiPddGetActiveChatId(),
    b = khaiPddReadVisibleOrderPanel(activeChatId);
  if (!b?.["orderSn"]) return;
  if (!khaiPddLooksLikeAftersaleOrder(b)) {
    khaiPddLastVisibleOrderKey = "";
    khaiPddCollapsedOrderExtraKey = "";
    document["getElementById"]("khai-pdd-order-extra-panel")?.["remove"]();
    return;
  }
  const a = activeChatId || "order:" + b["orderSn"];
  const cachedDetail = khaiPddGetCachedAutoAftersaleDetail(b["orderSn"]),
    visibleTrace = b["logisticsTrace"] || "",
    visibleTraceKey = visibleTrace ? visibleTrace["slice"](0x0, 0x78) + ":" + visibleTrace["length"] : "",
    detailKey = cachedDetail
      ? [
          cachedDetail["refundAmount"] || "",
          cachedDetail["afterSaleStatus"] || "",
          String(cachedDetail["logisticsTrace"] || "")["length"],
          (cachedDetail["detailFields"] || [])["length"],
        ]["join"](":")
      : "",
    c = a + ":" + b["orderSn"] + ":" + b["afterSaleStatus"] + ":" + visibleTraceKey + ":" + detailKey;
  if (c === khaiPddLastVisibleOrderKey) return;
  khaiPddLastVisibleOrderKey = c;
  const detailRefundAmount = cachedDetail?.["refundAmount"] || "",
    detailAfterSaleStatus = cachedDetail?.["afterSaleStatus"] || b["afterSaleStatus"] || "",
    detailLogisticsTrace = cachedDetail?.["logisticsTrace"] || "",
    detailFields = khaiPddMergeAftersaleExtraFields(cachedDetail?.["detailFields"], b["detailFields"]),
    m = khaiPddRequestAutoAftersaleDetail({
      ...b,
      refundAmount: detailRefundAmount || b["refundAmount"] || "",
      afterSaleStatus: detailAfterSaleStatus,
      detailFields,
    });
  khaiPddRenderOrderExtraPanel(b, {
    afterSaleStatus: detailAfterSaleStatus,
    refundAmount: detailRefundAmount || b["refundAmount"] || "",
    logisticsTrace: detailLogisticsTrace || visibleTrace,
    detailFields,
    loading: !detailRefundAmount || !detailLogisticsTrace,
  });
  const d = activeChatId ? await khaiPddFetchOrderContext(activeChatId, b["orderSn"]) : { orderItem: null, orderDetail: null },
    f = await khaiPddFetchOrderExtra(b["orderSn"], d["orderItem"], d["orderDetail"]),
    g = d["orderItem"]?.["orderStatusStr"] || "",
    h =
      f["afterSaleStatus"] && !/^\d+$/.test(String(f["afterSaleStatus"]))
        ? f["afterSaleStatus"]
        : b["afterSaleStatus"] || f["afterSaleStatus"] || "",
    j = detailLogisticsTrace || f["logisticsTrace"] || visibleTrace,
    k = detailRefundAmount || f["refundAmount"] || b["refundAmount"] || "",
    l = detailAfterSaleStatus || h,
    orderFields = khaiPddMergeAftersaleExtraFields(cachedDetail?.["detailFields"], f["detailFields"], b["detailFields"]);
  khaiPddRenderOrderExtraPanel(b, {
    refundAmount: k,
    afterSaleStatus: l,
    logisticsTrace: j,
    detailFields: orderFields,
    loading: !k || !j,
  });
  activeChatId &&
    ipcRenderer["send"]("update-customer-message-order", {
      messageId: activeChatId,
      orderId: b["orderSn"],
      orderStatus: g || b["afterSaleStatus"] || "",
      refundAmount: k,
      afterSaleStatus: l,
      logisticsTrace: j,
    });
  m &&
    m["then"]((n) => {
      if (!n?.["orderSn"] || String(n["orderSn"]) !== String(b["orderSn"])) return;
      const currentOrder = khaiPddReadVisibleOrderPanel(activeChatId);
      if (!currentOrder?.["orderSn"] || String(currentOrder["orderSn"]) !== String(b["orderSn"])) return;
      if (!khaiPddLooksLikeAftersaleOrder(currentOrder)) return;
      const p = n["logisticsTrace"] || j,
        q = n["refundAmount"] || k,
        r = n["afterSaleStatus"] || l,
        s = khaiPddMergeAftersaleExtraFields(n["detailFields"], orderFields, currentOrder["detailFields"]);
      khaiPddRenderOrderExtraPanel(b, {
        refundAmount: q,
        afterSaleStatus: r,
        logisticsTrace: p,
        detailFields: s,
      });
      activeChatId &&
        ipcRenderer["send"]("update-customer-message-order", {
          messageId: activeChatId,
          orderId: b["orderSn"],
          orderStatus: g || b["afterSaleStatus"] || "",
          refundAmount: q,
          afterSaleStatus: r,
          logisticsTrace: p,
        });
    });
  khaiPddRuntimeLog("pdd-visible-order-extra-sync", {
    orderSnTail: String(b["orderSn"])["slice"](-0x6),
    hasRefundAmount: !!k,
    hasVisibleRefundAmount: !!b["refundAmount"],
    hasAfterSaleStatus: !!(f["afterSaleStatus"] || b["afterSaleStatus"] || cachedDetail?.["afterSaleStatus"]),
    hasVisibleLogisticsTrace: !!visibleTrace,
    hasLogisticsTrace: !!j,
    detailFieldCount: orderFields["length"],
  });
}
setInterval(() => {
  khaiPddSyncVisibleOrderExtra()["catch"]((a) => {
    khaiPddRuntimeLog("pdd-visible-order-extra-sync-error", { message: a?.["message"] || String(a) }, "warn");
  });
}, 0x5dc);
(safeIpcOn("create-workorder", async (a, b) => {
  let c = [];
  try {
    const d = document["querySelector"](".chat-list-box\x20.chat-item-box.transition.active");
    if (!d) {
      ipcRenderer["send"]("get-create-workorder", c);
      return;
    }
    const f = d["getAttribute"]("data-random");
    if (!f) {
      ipcRenderer["send"]("get-create-workorder", c);
      return;
    }
    const g = f["split"]("-")[0x0],
      h = document["querySelector"](".right-panel-container");
    if (!h) {
      ipcRenderer["send"]("get-create-workorder", c);
      return;
    }
    const j = h["querySelectorAll"](".bar-item");
    if (j["length"] < 0x2) {
      ipcRenderer["send"]("get-create-workorder", c);
      return;
    }
    (j[0x1]["click"](), await new Promise((r) => setTimeout(r, 0x3e8)));
    const k = document["querySelector"](".order-panel-header");
    if (!k || !k["children"][0x1]) {
      ipcRenderer["send"]("get-create-workorder", c);
      return;
    }
    (k["children"][0x1]["click"](), await new Promise((r) => setTimeout(r, 0x3e8)));
    const l = h["querySelector"](".indexPages"),
      m = l?.["value"] || 0x1,
      n = await fetch("https://mms.pinduoduo.com/latitude/order/userAllOrder", {
        method: "POST",
        credentials: "include",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "anti-content": antigain(),
        },
        body: JSON["stringify"]({
          showHistory: !![],
          pageNo: m,
          pageSize: 0xa,
          uid: g,
        }),
      });
    if (!n["ok"]) {
      (console["error"]("获取订单列表失败:", n["status"], n["statusText"]),
        ipcRenderer["send"]("get-create-workorder", c));
      return;
    }
    const o = await n["json"]();
    if (!o["success"] || !o["result"]?.["orders"]) {
      ipcRenderer["send"]("get-create-workorder", c);
      return;
    }
    const p = o["result"]["orders"],
      q = 0x3;
    for (let r = 0x0; r < p["length"]; r += q) {
      const t = p["slice"](r, r + q),
        u = t["map"](async (x) => {
          try {
            const y = x["orderGoodsList"];
            if (!y) return (console["warn"]("订单\x20" + x["orderSn"] + "\x20无商品信息"), null);
            const z = await fetch("https://mms.pinduoduo.com/fopen/order/detail", {
              method: "POST",
              credentials: "include",
              mode: "cors",
              headers: { "Content-Type": "application/json" },
              body: JSON["stringify"]({
                biz_code: "chat",
                order_sn: x["orderSn"],
                receiver_info: ["mobile", "name", "address"],
                scene_code: "mall_customer_wait_shipping_sign",
              }),
            });
            if (!z["ok"])
              return (
                console["warn"]("获取订单\x20" + x["orderSn"] + "\x20详情失败:", z["status"]),
                null
              );
            const A = await z["json"](),
              B = A["result"];
            if (!B) return (console["warn"]("订单\x20" + x["orderSn"] + "\x20无地址信息"), null);
            const D = await khaiPddFetchOrderExtra(x["orderSn"], x, B);
            return {
              orderId: x["orderSn"] || "",
              type: x["orderStatusStr"] || "未知状态",
              orderName: y["goodsName"] || "未知商品",
              sku: ((y["spec"] || "") + "\x20" + (y["goodsNumber"] || ""))["trim"]() || "无规格",
              name: ((B["name"] || "") + "\x20" + (B["mobile"] || ""))["trim"]() || "无姓名",
              trackingNumber: x["trackingNumber"] || "",
              expressCompany:
                x["traceInfoList"] && x["traceInfoList"]["length"] > 0x0
                  ? x["traceInfoList"][0x0]["shippingName"]
                  : "",
              address:
                ("" +
                  (B["province"] || "") +
                  (B["city"] || "") +
                  (B["district"] || "") +
                  (B["address"] || ""))["trim"]() || "无地址",
              refundAmount: D["refundAmount"] || "",
              afterSaleStatus: D["afterSaleStatus"] || "",
              logisticsTrace: D["logisticsTrace"] || "",
              logisticsTraceList: D["logisticsTraceList"] || [],
              expanded: !![],
            };
          } catch (C) {
            return (console["error"]("处理订单\x20" + x["orderSn"] + "\x20时出错:", C), null);
          }
        }),
        v = await Promise["all"](u),
        w = v["filter"]((x) => x !== null);
      (c["push"](...w), r + q < p["length"] && (await new Promise((x) => setTimeout(x, 0xc8))));
    }
  } catch (x) {
    console["error"]("获取工单信息时发生错误:", x);
  } finally {
    ipcRenderer["send"]("get-create-workorder", c);
  }
}),
  safeIpcOn("currnt-page", (a, b) => {
    _key = b;
    if (_key) (ipcRenderer["send"]("get-currnt-page", ![]), clearTimeout(hearTimer));
    else {
      _sendHeartbeat(currentInterval);
      return;
    }
  }));
const _sendHeartbeat = (a) => {
  (hearTimer && clearTimeout(hearTimer),
    (hearTimer = setTimeout(async () => {
      if (_key && info) return;
      (ipcRenderer["send"]("reload-page"), (a = 0x0), _sendHeartbeat());
    }, a || currentInterval)));
};
safeIpcOn("get-shop-user", getUserHistory);
async function getUserHistory(a, b) {
  const c = document["querySelector"]("#replyTextarea");
  if (c) {
    const f = c["value"] && c["value"]["trim"]()["length"] > 0x0,
      g = Date["now"](),
      h = g - lastMouseActivity,
      i = g - lastKeyboardActivity,
      j = Math["min"](h, i),
      k = windowHasFocus && j < USER_ACTIVITY_TIMEOUT,
      l = f || k;
    ipcRenderer["send"]("get-shop-isuser-status", { hasContent: l });
    if (l) {
      console["log"]("用户正在操作，跳过AI处理");
      return;
    }
  }
  (throttledClickCustomerMessage(b), await ms_delay(0x3e8));
  const d = getUserHistoryData();
  if (d && d["length"] > 0x0) {
    let m = d["map"]((n) => ({
      ...n,
      orderStatus: n["orderStatus"] || b["orderStatus"],
      messageId: b["messageId"],
    }));
    ((m = m["filter"]((n) => n["content"] !== "")),
      (b["history"] = m),
      ipcRenderer["send"]("get-historical-records", JSON["stringify"](b)));
  }
}
const getUserHistoryData = () => {
    function a(l) {
      return l["split"]("/")
        ["pop"]()
        ["replace"](/\.[^.]+$/, "");
    }
    function b(l) {
      let m = "";
      for (const n of l["childNodes"]) {
        if (n["nodeType"] === Node["TEXT_NODE"]) m += n["textContent"];
        else {
          if (n["nodeType"] === Node["ELEMENT_NODE"]) {
            const o = n["tagName"]["toLowerCase"](),
              p = n["className"] || "",
              q = typeof n["onclick"] === "function" || n["hasAttribute"]("onclick"),
              r = window["getComputedStyle"](n),
              t =
                q ||
                o === "button" ||
                r["cursor"] === "pointer" ||
                /(btn|copy|operate|action|link)/i["test"](p);
            if (t) continue;
            m += b(n);
          }
        }
      }
      return m["trim"]();
    }
    function c() {
      try {
        const l = document["querySelectorAll"](".bar-item"),
          m = Array["from"](l)["find"]((t) => t["textContent"]["includes"]("商品推荐")),
          n =
            m && m["classList"]["contains"]("bar-item") && m["classList"]["contains"]("bar-select");
        !n && m && m["click"]();
        const o = document["querySelectorAll"](".one-category"),
          p = Array["from"](o)["find"]((t) => t["textContent"]["includes"]("全部商品")),
          q = p && p["classList"]["contains"]("category-selected");
        !q && p && p["click"]();
        const r = document["querySelector"](".goodsRecommendItem.add-blue-border\x20.goods-name");
        return r ? r["innerHTML"] : "";
      } catch (t) {
        return (console["error"]("执行失败:", t), "");
      }
    }
    const d = document["querySelector"](".chat-item-box.active"),
      f = d["querySelector"](".chat-nickname")["innerText"],
      g = document["querySelector"]("ul.msg-list");
    if (!g) return "[]";
    let h = [],
      i = null,
      j = null,
      k = null;
    g["querySelectorAll"]("li")["forEach"]((l) => {
      try {
        const m = l["querySelector"](
          ".buyer-item,\x20.cs-item,\x20.notify-card,\x20.msg-system,\x20.lego-card,\x20.commonCard,\x20.commonCardTemp",
        );
        if (!m) return;
        const n = Array["from"](m["classList"]),
          o = l["id"]["split"]("_")["pop"](),
          q = {
            role: "user",
            content: "",
            timestamp: o,
            image: null,
            video_cover: null,
            duration: null,
            emoji: null,
            orderId: j,
            goodsTitle: i,
            orderStatus: k,
            isOrder: null,
            username: f,
          };
        if (n["includes"]("notify-card")) {
          const r = m["querySelector"]("p");
          if (r) {
            const t = b(r);
            ((i = t),
              h["push"]({
                ...q,
                content: "用户咨询商品：:" + t,
                goodsTitle: t,
              }));
          }
          return;
        }
        if (n["includes"]("commonCardTemp")) {
          h["push"]({
            ...q,
            content: b(m),
          });
          return;
        }
        if (n["includes"]("buyer-item")) {
          const u = m["querySelector"](".apply-card");
          if (u) {
            try {
              const x = b(u["querySelector"](".goods-card\x20.goods-name"));
              ((i = x),
                (k = "售后申请中"),
                h["push"]({
                  ...q,
                  content: b(u),
                  goodsTitle: x,
                  orderStatus: k,
                  isOrder: !![],
                }));
            } catch (y) {
              console["warn"]("解析售后申请卡片出错:", y);
            }
            return;
          }
          const v = m["querySelector"](".msg-content.order-card");
          if (v) {
            try {
              const z = b(v["querySelector"]("p.good-name"));
              let A = b(v["querySelector"]("p.order-id"));
              A = A["replace"](/^订单编号：/, "")["trim"]();
              const B = v["querySelector"]("p.status-info");
              (B && (k = B["innerText"]["trim"]()),
                (i = z),
                (j = A),
                h["push"]({
                  ...q,
                  content: b(m),
                  orderId: A,
                  goodsTitle: z,
                  orderStatus: k,
                  isOrder: !![],
                }));
            } catch (C) {}
            return;
          }
          const w = m["querySelector"]("p.good-name");
          if (w) {
            const D = b(w);
            ((i = D),
              h["push"]({
                ...q,
                content: "用户咨询商品：" + D,
                goodsTitle: D,
              }));
            return;
          }
        }
        if (n["includes"]("buyer-item")) {
          const E = m["querySelector"](".msg-content.quote-msg-template");
          if (E) {
            const L = E["querySelector"](".be-quote-user"),
              M = L ? b(L)["replace"]("：", "")["trim"]() : "",
              N = E["querySelector"](".be-quote-content"),
              O = N ? b(N) : "",
              P = E["querySelector"](".quote-new-msg-text"),
              Q = P ? b(P) : "";
            Q &&
              h["push"]({
                ...q,
                content: "用户回复：“" + Q + "”，引用了\x20" + M + "\x20的消息：“" + O + "”",
              });
            return;
          }
          const F = m["querySelector"](".image-msg\x20img");
          if (F && F["src"]) {
            h["push"]({
              ...q,
              image: F["src"],
              content: "用户发送了图片",
            });
            return;
          }
          const G = m["querySelector"](".video-content\x20.video-box");
          if (G) {
            const R = G["querySelector"]("img"),
              S = G["querySelector"](".video-duration");
            if (R && R["src"]) {
              h["push"]({
                ...q,
                video_cover: R["src"],
                duration: S ? b(S) : "",
                content: "用户发送了视频",
              });
              return;
            }
          }
          const H = m["querySelectorAll"]("img.emojione");
          if (H["length"]) {
            const T = m["querySelector"]("p.msg-content-box"),
              U = T ? b(T) : "";
            if (U) {
              h["push"]({
                ...q,
                content: U,
              });
              return;
            }
            const V = Array["from"](H)["map"]((X) => X["src"]),
              W = V["map"]((X) => a(X))
                ["filter"](Boolean)
                ["join"](";");
            h["push"]({
              ...q,
              content: (V["length"] > 0x1 ? "用户发送了多个表情:" : "用户发送了表情:") + W,
              emoji: V,
            });
            return;
          }
          const I = m["querySelector"](".msg-content.sticker-msg\x20img");
          if (I && I["src"]) {
            const X = a(I["src"]);
            h["push"]({
              ...q,
              content: "用户发送了动态表情:" + X,
              emoji: [I["src"]],
            });
            return;
          }
          const J = m["querySelector"](".msg-content.lego-card.clear-style");
          if (J) {
            const Y = J["querySelector"](
              ".mskefu_aladdin_merchant_message_service__goodsSpec___O84qG",
            );
            Y &&
              h["push"]({
                ...q,
                content: "用户咨询了商品规格:\x20" + b(Y),
              });
            return;
          }
          const K = m["querySelector"]("p.msg-content-box");
          h["push"]({
            ...q,
            content: K ? b(K) : "",
          });
          return;
        }
        if (n["includes"]("cs-item")) {
          const Z = m["querySelector"]("p.msg-content-box");
          if (Z)
            h["push"]({
              ...q,
              role: "assistant",
              content: b(Z),
            });
          else {
            const a0 = m["querySelector"]("div.msg-content.image-msg");
            a0 &&
              h["push"]({
                ...q,
                role: "assistant",
                content: "图片已发送",
              });
          }
          return;
        }
        if (n["includes"]("msg-system")) {
          h["push"]({ ...q });
          return;
        }
        if (n["includes"]("lego-card")) {
          h["push"]({
            ...q,
            role: "system",
            content: b(m),
          });
          return;
        }
        h["push"]({ ...q });
      } catch (a1) {
        console["warn"]("解析单条消息出错:", a1);
      }
    });
    if (i) h["forEach"]((l) => (l["goodsTitle"] = i));
    if (j) h["forEach"]((l) => (l["orderId"] = j));
    if (k) h["forEach"]((l) => (l["orderStatus"] = k));
    if (h && h["length"] > 0x0) {
      const l = [...h]["reverse"](),
        m = l["findIndex"]((n) => n["role"] == "assistant" || n["role"] == "system");
      h = m >= 0x0 ? l["slice"](0x0, m)["reverse"]() : [];
    }
    return h;
  },
  ms_delay = (a) => {
    return new Promise((b) => setTimeout(b, a));
  };
(safeIpcOn("goto-order-user", async (a, b) => {
  const c = document["querySelector"](".add-new-con");
  if (c) {
    (c["click"](), await ms_delay(0x1f4));
    const d = document["querySelector"](
      "[aria-label=\x22添加会话\x22]\x20\x20\x20input[placeholder=\x22请输入订单号\x22]",
    );
    if (d) {
      ((d["value"] = b["ordersn"]), d["dispatchEvent"](new Event("input", { bubbles: !![] })));
      const f = document["querySelector"](
        "[aria-label=\x22添加会话\x22]\x20\x20.el-dialog__footer\x20.el-button--primary",
      );
      f["click"]();
    }
  }
}),
  safeIpcOn("get-after-sale-total-order", async (a, b) => {
    const c = b;
    try {
      let d = 0x0;
      const f = new Date(c["info"]["month"][0x0]);
      f["setHours"](0x0, 0x0, 0x0, 0x0);
      const g = new Date(c["info"]["month"][0x1]);
      g["setHours"](0x17, 0x3b, 0x3b, 0x3e7);
      const h = Math["floor"](f["getTime"]() / 0x3e8),
        i = Math["floor"](g["getTime"]() / 0x3e8),
        j = await fetch("https://mms.pinduoduo.com/mercury/mms/afterSales/queryList", {
          method: "post",
          mode: "cors",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON["stringify"]({
            pageSize: 0xa,
            pageNumber: 0x1,
            orderByCreatedAtDesc: !![],
            mallRemarkStatus: null,
            mallRemarkTag: null,
            startCreatedTime: h,
            endCreatedTime: i,
          }),
        })["then"]((t) => t["json"]()),
        k = await fetch("https://mms.pinduoduo.com/mercury/mms/afterSales/queryGroupCount", {
          mode: "cors",
          credentials: "include",
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: JSON["stringify"]({
            orderByCreatedAtDesc: !![],
            pageNumber: 0x1,
            endCreatedTime: i,
            startCreatedTime: h,
          }),
        })["then"]((t) => t["json"]()),
        l = j["result"]["total"],
        m = k["result"]["unshippedOnlyRefund"],
        n = k["result"]["shippedOnlyRefund"] + k["result"]["returnRefund"],
        o = await fetch("https://mms.pinduoduo.com/strickland/sop/mms/todoList", {
          mode: "cors",
          credentials: "include",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON["stringify"]({
            serviceStatus: [null],
            problemType: [null],
            createStartTime: h,
            createEndTime: i,
            pageNum: 0x1,
            pageSize: 0xa,
          }),
        })["then"]((t) => t["json"]()),
        { errorCode: p, success: q, result: r } = o;
      if (p == 0xf4240 && q) {
        const t = j["result"]["total"],
          u = r["total"],
          v = k["result"]["unshippedOnlyRefund"],
          w = k["result"]["shippedOnlyRefund"] + k["result"]["returnRefund"] + u;
        ipcRenderer["send"]("get-after-sale-total-order-result", {
          applyCount: t,
          workOrderCount: u,
          refundOnlyCount: v,
          realCount: w,
          id: c["info"]["id"],
        });
      }
    } catch (x) {
      ipcRenderer["send"]("web-scoker-error-callback", {
        info: c,
        errormsg: "查询月总工单失败,失败原因:" + JSON["stringify"](x),
        shopId: c["info"]["shopId"],
      });
    }
  }));
const insertScriptStr = () => {
  let a = {},
    b = "在线",
    c = new Map();
  document["addEventListener"]("keydown", (F) => {
    const G = document["querySelector"]("[currentuid]");
    console["info"]("keydown2", F, G);
    if (G) {
      const H = G["getAttribute"]("currentuid");
      c["set"](H, !![]);
    }
  });
  let d = ![];
  async function f() {
    if (!a?.["username"]) return null;
    const F = await fetch(
      "https://mms.pinduoduo.com/chats/chatStatusUsers?csname=" + a["username"],
      {
        method: "get",
        headers: { "Content-Type": "application/json" },
      },
    )["then"]((G) => G["json"]());
    return F["length"] ? F[F["length"] - 0x1]["status"] : null;
  }
  function g() {
    const F = document["querySelector"](".conv-today");
    if (F) {
      if (F["textContent"]) {
        const G = F["textContent"]["match"](/\((\d+)\)/);
        if (G) return G[0x1] || 0x0;
      }
    }
    return 0x0;
  }
  let h = 0x0,
    i = 0x0,
    j = null,
    k = new Map(),
    l = new Map();
  const m = () => {
      let F = "";
      return (
        k["forEach"]((G, H) => {
          G["timestamp"] && (G["timestampString"] = new Date(G["timestamp"])["toLocaleString"]());
          G["linkBrokenTime"] != null &&
            (G["linkBrokenTimeString"] = Math["round"](G["linkBrokenTime"] / 0x3e8));
          const I = G?.["linkBrokenTimeString"] != null ? G["linkBrokenTimeString"] : "--",
            J = G?.["downlink"] != null ? G["downlink"] : "--",
            K = G?.["effectiveType"] || "--",
            L = G?.["rtt"] != null ? G["rtt"] : "--";
          F +=
            "第" +
            H +
            "次中断\x20断开时间：" +
            I +
            "s\x20记录时间：" +
            G?.["timestampString"] +
            "\x20是否触发强制在线\x20" +
            G?.["triggeOnline"] +
            "\x20\x0a[当前网络情况]\x20网速:" +
            J +
            "\x20MBps\x20网络:" +
            K +
            "\x20延迟:" +
            L +
            "\x20\x20\x0a\x20";
        }),
        F
      );
    },
    n = navigator["connection"] || navigator["mozConnection"] || navigator["webkitConnection"];
  function o() {
    if (j) clearTimeout(j);
    j = setTimeout(
      () => {
        ((h = 0x0), (i = Date["now"]()), k["clear"](), l["clear"](), o());
      },
      0x3c * 0x3c * 0x3e8,
    );
  }
  async function p(F) {
    let G = {
      totalBytes: 0x0,
      durationSec: 0x0,
      speedMbps: 0x0,
      latencyMs: 0x0,
    };
    try {
      const H = performance["now"](),
        I = await fetch(F, { cache: "no-store" }),
        J = I["body"]["getReader"]();
      let K = 0x0;
      while (!![]) {
        const { done: P, value: Q } = await J["read"]();
        if (P) break;
        K += Q["length"];
      }
      const L = performance["now"](),
        M = (L - H) / 0x3e8,
        N = K / M,
        O = (N * 0x8) / 0x400 / 0x400;
      G = {
        totalBytes: K,
        durationSec: M,
        speedMbps: O["toFixed"](0x2),
        latencyMs: I["headers"]["get"]("x-mskefu-latency") || 0x0,
      };
    } catch (R) {
      console["warn"]("测速失败", R);
    }
    return G;
  }
  const q = window["WebSocket"],
    r = new Map();
  function t(F, G) {
    if (F != b) {
      const H = document["querySelectorAll"](".status-box\x20li");
      let I = ![];
      return (
        H["forEach"]((J) => {
          J["innerText"] == b && (J["click"](), (I = !![]));
        }),
        I
      );
    }
  }
  window["addEventListener"]("message", function (F) {
    if (F["data"]["type"] == "get-unreply-conversations")
      fetch("https://mms.pinduoduo.com/plateau/chat/unreply_conversations", {
        credentials: "include",
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          size: 0x64,
          page: 0x1,
        }),
      })
        ["then"]((G) => G["json"]())
        ["then"]((G) => {
          console["log"]("res======>", G);
          if (G["success"]) {
            if (G?.["result"]?.["conversations"]["lnegth"] > 0x0) {
              const H = [];
              G?.["result"]?.["conversations"]["forEach"]((I) => {
                H["push"]({
                  messageId: I["user_info"]["messageId"],
                  userId: I["user_info"]["uid"],
                  username: I["user_info"]["nickname"],
                  content: I["content"],
                  timeout: I["last_unreply_time"] + 0xb4,
                  type: "code",
                });
              });
              if (H["length"]) window["context_bridge"]["send"]("get-customer-message-list", H);
            }
          }
        });
    else {
      if (F["data"]["type"] == "shop-status-change") b = F["data"]["data"];
      else {
        if (F["data"]["type"] === "close-socket")
          r["forEach"]((G) => {
            if (G["ws"])
              try {
                G["ws"]["close"]();
              } catch {}
          });
        else {
          if (F["data"]["type"] === "sync-shop-info") a = F["data"]["data"];
          else {
            if (F["data"]["type"] === "SYNC_AUTO_ONLINE_BLOCK")
              d = !!F["data"]?.["data"]?.["blocked"];
            else {
              if (F["data"]["type"] === "CHANGE_PDD_SHOW_ROBOT_REPLY")
                window["_pddShowRobotReply"] = F["data"]["data"]["isPDDShowRobotReply"];
              else {
                if (F["data"]["type"] === "SET_AI_REPLY_INFO") {
                  const { messageId: G } = F["data"]["data"],
                    H = window["_aiReplyCountMap"]["get"](G) || {
                      count: 0x0,
                      ...F["data"]["data"],
                    };
                  (H["count"]++, window["_aiReplyCountMap"]["set"](G, H));
                } else {
                  if (F["data"]["type"] === "CLEAR_AI_REPLY_INFO") {
                    const I = F?.["data"]?.["data"]?.["messageId"];
                    if (I) {
                      const J = window["_aiReplyCountMap"]["get"](I);
                      J &&
                        ((J["count"] -= 0x1),
                        J["count"] <= 0x0
                          ? window["_aiReplyCountMap"]["delete"](I)
                          : window["_aiReplyCountMap"]["set"](I, J));
                    }
                  } else
                    F["data"]["type"] === "test-click-user" &&
                      fetch("https://api.pinduoduo.com/api/v1/user/get", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON["stringify"]({ user_id: F["data"] }),
                      });
                }
              }
            }
          }
        }
      }
    }
  });
  let u = null;
  const v = 0x3c * 0x3e8;
  function w() {
    if (u) clearTimeout(u);
    u = setTimeout(() => {
      (window["postMessage"]({ type: "pull-message" }), w());
    }, v);
  }
  (w(),
    (window["WebSocket"] = function (F, G) {
      const H = F + "|" + (G || ""),
        I = (L) => {
          window["postMessage"](
            {
              type: "WS_STATE_CHANGE",
              state: L,
              url: F,
            },
            "*",
          );
        },
        J = (L = null) => {
          let M = r["get"](H);
          const N = (M?.["version"] || 0x0) + 0x1,
            O = new q(F, G),
            P = {
              ws: O,
              url: F,
              version: N,
              reconnectTimer: null,
              reconnectId: L,
            };
          return (r["set"](H, P), K(P, L), O);
        },
        K = (L) => {
          const { ws: M, version: N } = L;
          (M["addEventListener"]("open", async function () {
            I(0x1);
            const O = await f();
            (t(O, "ws-open-reconnect"),
              setTimeout(() => {
                window["postMessage"]({ type: "pull-message" });
              }, 0xa * 0x3e8));
            L["reconnectTimer"] &&
              (clearTimeout(L["reconnectTimer"]), (L["reconnectTimer"] = null));
            (window["context_bridge"]["send"]("wss-connect-open"), o());
            let P = L["reconnectId"];
            !P && (P = l["get"](H) || null);
            if (P && k["has"](P)) {
              const Q = k["get"](P);
              ((Q["linkBrokenTime"] = Date["now"]() - Q["disconnectAt"]), l["delete"](H));
            }
            if (h >= 0x5) {
              const R = m();
              (window["context_bridge"]["send"]("wss-connect-reported", R),
                (h = 0x0),
                k["clear"](),
                l["clear"]());
            }
          }),
            M["addEventListener"]("close", function () {
              (setTimeout(() => {
                window["postMessage"]({ type: "pull-message" });
              }, 0x1e * 0x3e8),
                I(0x3),
                h++);
              const O = h;
              L["reconnectId"] = O;
              const P = Date["now"]();
              (k["set"](O, {
                disconnectAt: P,
                triggeOnline: "否",
                timestamp: P,
                downlink: n?.["downlink"] ?? null,
                effectiveType: n?.["effectiveType"] ?? null,
                rtt: n?.["rtt"] ?? null,
              }),
                l["set"](H, O));
              L["reconnectTimer"] && clearTimeout(L["reconnectTimer"]);
              L["reconnectTimer"] = setTimeout(async () => {
                const R = r["get"](H);
                let S = await p(
                  "https://mms-static.pinduoduo.com/mskefu/aladdin-chat-risk-captcha-modal/0.1.0/index.js",
                );
                const T = k["get"](O);
                T &&
                  ((T["downlink"] = S["speedMbps"]),
                  (T["effectiveType"] = n?.["effectiveType"]),
                  (T["rtt"] = S["durationSec"]));
                if (R && R["version"] === N) {
                  const U = await f();
                  if (t(U, "ws-health-check") && T) {
                    T["triggeOnline"] = "是";
                    const V = m();
                    (window["context_bridge"]["send"]("wss-connect-reported", V),
                      window["postMessage"]({ type: "pull-message" }));
                  }
                  J(O);
                }
              }, 0x3c * 0x3e8);
              const Q = m();
              window["context_bridge"]["send"]("wss-connect-reported", Q);
            }),
            M["addEventListener"]("message", function (O) {
              w();
              if (typeof O["data"] === "string") {
                if (O["data"]["includes"]("message") && O["data"]["includes"]("msg_id"))
                  try {
                    const P = JSON["parse"](O["data"]);
                    P?.["message"]?.["to"] &&
                      P?.["message"]?.["content"] &&
                      P?.["message"]?.["manual_reply"] === 0x1 &&
                      window["context_bridge"]["send"]("reply-customer-message", {
                        messageId: P["message"]["to"]["uid"],
                        content: P["message"]["content"],
                        shopMsgTotal: g(),
                        sendTarget: "pdd9",
                      });
                  } catch {}
              } else {
                const Q = new Uint8Array(O["data"]),
                  R = new TextDecoder()["decode"](Q);
                if (
                  R["includes"](
                    "bizType\x22:\x22merchant-robot\x22,\x22subType\x22:\x22replyState",
                  ) &&
                  window["_pddShowRobotReply"]
                ) {
                  const S = R["match"](/{.*}/);
                  if (S?.["length"])
                    try {
                      const T = JSON["parse"](S[0x0]);
                      setTimeout(() => {
                        window["context_bridge"]["send"]("reply-customer-message", {
                          messageId: T["body"]["uid"],
                          content: "",
                          shopMsgTotal: g(),
                          sendTarget: "pdd10",
                        });
                      }, 0x3e8);
                    } catch {}
                }
              }
            }));
        };
      return J();
    }));
  let x = null,
    y = null;
  function z() {
    return Math["random"]() * 0x28 * 0x3e8;
  }
  function A(F) {
    x = F;
    if (y) return;
    const G = z();
    y = setTimeout(() => {
      (x && window["context_bridge"]["send"]("get-quality-testing", x), (x = null), (y = null));
    }, G);
  }
  ((window["_aiReplyCountMap"] = new Map()), (window["_pddShowRobotReply"] = ![]));
  function g() {
    const F = document["querySelector"](".conv-today");
    if (F) {
      if (F["textContent"]) {
        const G = F["textContent"]["match"](/\((\d+)\)/);
        if (G) return G[0x1] || 0x0;
      }
    }
    return 0x0;
  }
  setInterval(function () {
    window["_aiReplyInfo"] &&
      Date["now"]() - window["_aiReplyInfo"]["timestamp"] > 0x2710 &&
      (window["_aiReplyInfo"] = null);
  }, 0x1388);
  function B() {
    if (!window["_aiReplyInfo"]) return;
    const F = 0x2710,
      G = Math["max"](0x0, F - (Date["now"]() - window["_aiReplyInfo"]["timestamp"]));
    setTimeout(() => {
      window["_aiReplyInfo"] &&
        Date["now"]() - window["_aiReplyInfo"]["timestamp"] >= F &&
        (window["_aiReplyInfo"] = null);
    }, G);
  }
  B();
  const C = window["fetch"];
  window["fetch"] = async function (...F) {
    return (console["log"]("FETCH:", F[0x0]), C["apply"](this, F));
  };
  const D = XMLHttpRequest["prototype"]["open"],
    E = XMLHttpRequest["prototype"]["send"];
  ((XMLHttpRequest["prototype"]["open"] = function (F, G) {
    ((this["_method"] = F), (this["_url"] = G), D["apply"](this, arguments));
  }),
    (XMLHttpRequest["prototype"]["send"] = function (F) {
      (this["addEventListener"](
        "load",
        function () {
          if (
            this["_method"] === "post" &&
            this["_url"] === "/plateau/chat/send_message" &&
            this["response"]["includes"]("result\x22:\x22ok\x22")
          ) {
            const {
              data: { message: G },
            } = JSON["parse"](F);
            console["info"]("body==================", JSON["parse"](F));
            const H = G["to"]["uid"],
              I = G["content"],
              J = window["_aiReplyCountMap"]["get"](H),
              K = J && J["count"] > 0x0,
              L = {
                messageId: H,
                ...J,
                isAiAutoReply: K && J && J?.["isAiAutoReply"],
                isBottomLineAutoReply: K && J && J?.["isBottomLineAutoReply"],
                isReminderReply: J && J?.["isReminderReply"],
                isAiInviteReply: J && J?.["isAiInviteReply"],
              };
            (K &&
              J &&
              (J?.["isAiInviteReply"] ||
                J?.["isReminderReply"] ||
                J?.["isAiAutoReply"] ||
                J?.["isBottomLineAutoReply"]) &&
              ((L["shopMsgTotal"] = g()),
              window["context_bridge"]["send"]("get-customer-callback-result", L),
              window["_aiReplyCountMap"]["delete"](H)),
              c["has"](H) &&
                (c["delete"](H),
                (L["sendTarget"] = "pdd3"),
                (L["shopMsgTotal"] = g()),
                (L["content"] = I),
                window["context_bridge"]["send"]("reply-customer-message", L)),
              window["postMessage"](
                {
                  type: "CLEAR_AI_REPLY_INFO",
                  data: { messageId: H },
                },
                "*",
              ));
          }
          if (
            this["_method"] === "POST" &&
            this["_url"] ===
              "https://mms.pinduoduo.com/refraction/robot/mall/trusteeshipState/sendPendingConfirmDataNew" &&
            this["response"]["includes"]("success\x22:true")
          ) {
            const { uid: M } = JSON["parse"](F);
            window["context_bridge"]["send"]("reply-customer-message", {
              messageId: M,
              content: "",
              shopMsgTotal: g(),
              sendTarget: "pdd4",
            });
          }
          if (
            this["_method"] === "POST" &&
            this["_url"] === "https://mms.pinduoduo.com/plateau/message/library_file/send" &&
            this["response"]["includes"]("success\x22:true")
          ) {
            const { uid: N, url: O } = JSON["parse"](F);
            window["context_bridge"]["send"]("reply-customer-message", {
              messageId: N,
              content: O,
              shopMsgTotal: g(),
              sendTarget: "pdd5",
            });
          }
          if (this["_method"] === "POST" && this["_url"]["includes"]("mallGoodsCard")) {
            const P = JSON["parse"](F);
            window["context_bridge"]["send"]("reply-customer-message", {
              messageId: P["uid"],
              shopMsgTotal: g(),
              sendTarget: "pdd6",
            });
          }
          if (
            this["_method"] === "POST" &&
            this["_url"] === "https://mms.pinduoduo.com/plateau/message/ask_refund_apply/send" &&
            this["response"]["includes"]("success\x22:true")
          ) {
            const { uid: Q, url: R } = JSON["parse"](F);
            window["context_bridge"]["send"]("reply-customer-message", {
              messageId: Q,
              shopMsgTotal: g(),
              content: R,
              sendTarget: "pdd7",
            });
          }
          if (this["_url"]["includes"]("getRealTimeReplyRate3Min/mallAndCs")) {
            const S = document["querySelectorAll"](".detail-ctn")[0x0];
            S &&
              setTimeout(() => {
                const T = S["querySelectorAll"](".item"),
                  U = T[0x0]["children"][0x1]?.["textContent"]["replace"]("\x20", ""),
                  V = T[0x1]["children"][0x1]?.["textContent"]["replace"]("\x20", "");
                A({
                  inquiryCount: V,
                  responseRateWithinThreeMin: U,
                  averageRate: "",
                  dissatisfiedRate: "",
                  recoverRate: "",
                });
              }, 0x7d0);
          }
          if (
            this["_method"] === "POST" &&
            this["_url"] === "https://apm.pinduoduo.com/api/pmm/defined"
          ) {
          }
          if (
            this["_method"] === "post" &&
            this["_url"] === "/plateau/chat/close_conversation" &&
            this["response"]["includes"]("success\x22:true")
          ) {
            const {
              result: { uid: T },
            } = JSON["parse"](this["response"]);
            window["context_bridge"]["send"]("reply-customer-message", {
              messageId: T,
              shopMsgTotal: g(),
              content: "",
              sendTarget: "pdd8",
            });
          }
          if (
            this["_method"] === "POST" &&
            this["_url"] === "https://mms.pinduoduo.com/plateau/chat/set_csstatus" &&
            this["response"]["includes"]("success\x22:true")
          ) {
            const { result: U } = JSON["parse"](this["response"]);
            fetch("https://mms.pinduoduo.com/chats/userinfo/realtime?get_response=true")
              ["then"]((V) => V["json"]())
              ["then"]((V) => {
                const W = {
                  logo: V["mall"]["logo"],
                  id: V["mall"]["mall_id"]["toString"](),
                  name: V["mall"]["mall_name"],
                  username: V["username"],
                };
                let X = "";
                switch (U["status"]) {
                  case 0x1:
                    X = "在线";
                    break;
                  case 0x0:
                    X = "忙碌";
                    break;
                  case 0x3:
                    X = "离线";
                    break;
                }
                (window["context_bridge"]["send"]("log", {
                  type: "info",
                  message: "拼多多店铺：" + V["mall"]["mall_name"] + "\x20状态为：" + X,
                }),
                  window["context_bridge"]["send"]("shop-status-change", { status: X }));
              });
          }
        },
        { once: !![] },
      ),
        E["apply"](this, arguments));
    }));
};
ipcRenderer["on"]("quality-socket-message", (a, b) => {
  console["log"]("ws质检传递数据", b);
});
function getMessageCont() {
  const a = document["querySelector"](".conv-today");
  if (a) {
    if (a["textContent"]) {
      const b = a["textContent"]["match"](/\((\d+)\)/);
      if (b) return b[0x1] || 0x0;
    }
  }
  return 0x0;
}
let examObserver = null,
  globalAnsweringState = {
    isAnswering: ![],
    currentExamId: null,
    pendingClicks: [],
  };
async function autoAnswerQuestion() {
  const a = document["querySelector"](".exam-question");
  if (!a) return ![];
  const b = a["querySelector"](".question-content\x20.question-title"),
    c = b ? b["textContent"]["trim"]() : "unknown";
  if (globalAnsweringState["isAnswering"] && globalAnsweringState["currentExamId"] !== c)
    return ![];
  const d = a["querySelector"](".el-radio-group\x20.el-radio.is-checked"),
    f = a["querySelectorAll"](".el-checkbox-group\x20.el-checkbox.is-checked");
  if (d || f["length"] > 0x0) return !![];
  const g = a["querySelector"](".el-checkbox-group") !== null,
    h = a["querySelector"](".question-content");
  if (!h) return ![];
  const i = h["querySelector"](".question-title");
  if (!i) return ![];
  const j = i["textContent"]["trim"]();
  await new Promise((q) => setTimeout(q, 0x1f4));
  const k = a["querySelectorAll"](".option-item");
  if (k["length"] === 0x0) return ![];
  const l = [
    {
      question: "商家行为是否违反了平台运营规则",
      answers: ["存在违规情况", "会判定违规。"],
    },
    {
      question: "哪种做法是违反平台运营规范",
      answers: [
        "索要消费者微信或支付宝账号打款",
        "索要消费者收款二维码打款",
        "索要消费者电话联系打款",
        "引导买家扫描微信收款码转钱",
        "让买家联系电话打款",
      ],
    },
    {
      question: "做法或回复是符合平台运营规范",
      answers: [
        "使用“发视频”功能给买家发送短视频。",
        "“您点击右下角‘+’号，里面有个‘拍视频’，从那拍个视频给我看看。”",
        "使用“语音通话”功能给买家发送语音请求。",
        "“您点击右下角‘+’号，里面有个‘语音通话’，从那可以语音联系。”",
      ],
    },
    {
      question: "哪些回复是违反平台运营规范",
      answers: [
        "“麻烦您提供下真实的手机号码，便于后续的安装联系哦。”",
        "“您可以加下我微信吗，我到时候微信告知您具体上门时间，我的微信号是xxxxxx。”",
        "“如果约定的时间没有上门安装的话，您可以拨打下我的电话151xxxxxxxx。”",
      ],
    },
    {
      question: "哪些行为，是存在服务态度问题",
      answers: [
        "对消费者进行人身攻击，使用不文明用语辱骂",
        "阴阳怪气地嘲讽消费者，嘲讽年龄、收入及地域等",
        "态度蛮横、不耐烦，用命令语气回复消费者",
        "消费者先开始骂人，于是辱骂、威胁或者骚扰消费者",
      ],
    },
    {
      question: "哪些属于不好的服务行为",
      answers: [
        "以重复语句敷衍回复，答非所问，无有效对话内容",
        "编造各种无根据、虚假理由搪塞消费者",
        "工作时间内（8:00-23:00）超过30分钟不回复",
      ],
    },
    {
      question: "哪些服务问题可能会被消费者投诉",
      answers: [
        "消费者询问到货时间，回复消费者，你去问快递公司啊，我又不是送快递的",
        "消费者对商品产生一些质量相关的疑问时，回复消费者，这个东西就是这样的，这个价格就就是这样的货",
      ],
    },
    {
      question: "哪些措施",
      answers: ["不要恶意揣测消费者，尝试使用举报功能", "与消费者友好沟通，化解消费者的误会"],
    },
    {
      question: "消费者突然申请仅退款，以下哪些处理方式是合理的",
      answers: [
        "联系消费者并了解原因，若消费者明确表示不想要，尝试联系快递进行拦截，并及时告知消费者拦截进度",
      ],
    },
    {
      question: "商家承诺服务未履约",
      answers: [
        "商品详情页、快递宣传资料、聊天等描述中出现承诺赠送赠品，消费者反馈未收到时，商家不处理或拖延处理",
        "商品详情页、快递宣传资料、聊天等描述中出现承诺保修等服务，消费者索取服务时，商家不处理或拖延处理",
        "商品详情页、快递宣传资料、聊天等描述中出现承诺评价有礼，消费者索要时，商家不处理或拖延处理",
        "消费者反馈商品存在问题，商家聊天中承诺补寄，但实际未提供补发单号或提供虚假单号",
      ],
    },
    {
      question: "商家违规诱导行为",
      answers: [
        "消费者遇到商品质量问题，要求消费者修改为无理由发起售后，才进行处理",
        "要求消费者确认收货并好评后，才提供赠品、服务等福利",
      ],
    },
    {
      question: "处理方式是合理",
      answers: ["联系消费者并了解原因，尝试联系快递进行拦截"],
    },
    {
      question: "处理方式是不合理",
      answers: ["不联系消费者，等收到退货后再决定退不退"],
    },
    {
      question: "严重敷衍行为",
      answers: [
        "机械重复回复，例如，无视消费者诉求，连续重复相同的内容多次",
        "答非所问：例如，消费者询问衣柜怎么安装，商家回复，嗯嗯，我们的质量是不错的呢",
        "回复慢，消极应对：例如，超过30分钟不回复或者仅单条回复“在的”“好的”“我看一下”等没有下文的敷衍信息",
      ],
    },
    {
      question: "哪些语句是存在服务态度问题",
      answers: [
        "没见过这么没素质的人",
        "别耽误我时间，我还有好多人要接待，自己去搞",
        "卖了几万件，从来没见过有人这样反馈的，只有你自己这样",
        "这你都看不懂？你眼瞎吗？",
      ],
    },
    {
      question: "平台将严肃处理的",
      answers: [
        "线下给消费者寄送不良包裹，包括但不限于冥币、寿衣等引起消费者不适类物品",
        "通过电话、短信、微信等渠道，对消费者进行轰炸、骚扰、辱骂、人身攻击等行为",
        "获取消费者手机号、地址等个人隐私信息，进行曝光、售卖等非法行为",
        "诱导消费者线下交易、规避平台各类规则，以欺诈消费者、获取非法利益",
      ],
    },
  ];
  let m = [],
    n = [],
    o = null;
  for (const q of l) {
    if (j["includes"](q["question"])) {
      o = q;
      break;
    }
  }
  if (o)
    for (const r of o["answers"]) {
      for (const t of k) {
        const u = t["textContent"]["trim"](),
          v = u["replace"](/^[A-Z][、.]/, "")["trim"]();
        v === r && !m["includes"](t) && (m["push"](t), n["push"](r));
      }
    }
  else console["log"]("未匹配到任何题目！");
  const p = () => {
    const w = a["querySelectorAll"](".question-footer\x20.btn-item");
    for (const x of w) {
      const y = window["getComputedStyle"](x);
      if (y["display"] !== "none" && !x["classList"]["contains"]("disabled"))
        return (x["click"](), !![]);
    }
    return ![];
  };
  if (g) {
    const w = async () => {
      for (const x of m) {
        const y = x["querySelector"]("input"),
          z = y || x;
        z["click"]();
        const A = x["classList"]["contains"]("is-checked") || (y && y["checked"]);
        await new Promise((B) => setTimeout(B, 0xc8));
      }
      await new Promise((B) => setTimeout(B, 0x12c));
      for (const B of m) {
        const C = B["querySelector"]("input"),
          D = B["classList"]["contains"]("is-checked") || (C && C["checked"]);
        !D &&
          (C
            ? (Object["getOwnPropertyDescriptor"](HTMLInputElement["prototype"], "checked")["set"][
                "call"
              ](C, !![]),
              B["classList"]["add"]("is-checked"))
            : B["click"]());
      }
      p() && setTimeout(p, 0x1f4);
    };
    w()["catch"]((x) => {
      console["error"]("多选题点击出错:", x);
    });
  } else {
    if (m["length"] > 0x0) {
      const x = m[0x0],
        y = x["querySelector"]("input"),
        z = y || x;
      z["click"]();
      const A = x["classList"]["contains"]("is-checked") || (y && y["checked"]);
    } else console["log"]("警告：未匹配到任何答案！");
    setTimeout(() => {
      p() && setTimeout(p, 0x1f4);
    }, 0x1f4);
  }
  return !![];
}
function startExamObserver() {
  let a = ![],
    b = "";
  const c = new MutationObserver((g) => {
      const h = document["querySelector"](".exam-question");
      if (!h) return;
      if (h["style"]["display"] === "none") {
        const k = document["querySelectorAll"](".btn-item");
        for (const l of k) {
          if (l["textContent"]["includes"]("返回商家客服平台")) {
            const m = window["getComputedStyle"](l);
            if (m["display"] !== "none") {
              (c["disconnect"](), l["click"]());
              return;
            }
          }
        }
        return;
      }
      const i = h["querySelector"](".question-content\x20.question-title");
      if (!i) return;
      const j = i["textContent"]["trim"]();
      if (j === b) return;
      if (a) return;
      ((a = !![]),
        (b = j),
        setTimeout(async () => {
          (await autoAnswerQuestion(), (a = ![]));
        }, 0x3e8));
    }),
    d = document["querySelector"](".question-title");
  d &&
    c["observe"](d, {
      childList: !![],
      subtree: !![],
      characterData: !![],
    });
  const f = document["querySelector"](".exam-question");
  return (
    f &&
      c["observe"](f, {
        attributes: !![],
        attributeFilter: ["style"],
      }),
    c
  );
}
function initExamPageObserver() {
  ((examObserver = new MutationObserver((a) => {
    for (const b of a) {
      for (const c of b["addedNodes"]) {
        if (c["nodeType"] === Node["ELEMENT_NODE"]) {
          const d = c["classList"]?.["contains"]("exam-page")
            ? c
            : c["querySelector"]?.(".exam-page");
          d &&
            setTimeout(() => {
              const f = d["querySelector"](".btn-item");
              f && f["textContent"]["includes"]("我已了解") && (f["click"](), startExamObserver());
            }, 0x7d0);
        }
      }
    }
  })),
    examObserver["observe"](document["body"], {
      childList: !![],
      subtree: !![],
    }));
}
function initExamPopupObserver() {
  ((examObserver = new MutationObserver((a) => {
    for (const b of a) {
      for (const c of b["addedNodes"]) {
        if (c["nodeType"] === Node["ELEMENT_NODE"]) {
          const d = c["classList"]?.["contains"]("new-cs-exam-content")
            ? c
            : c["querySelector"]?.(".new-cs-exam-content");
          d &&
            setTimeout(() => {
              const f = d["querySelector"](".btn-item");
              f &&
                f["textContent"] === "参加考试" &&
                (f["click"](), examObserver["disconnect"](), initExamPageObserver());
            }, 0x1388);
        }
      }
    }
  })),
    examObserver["observe"](document["body"], {
      childList: !![],
      subtree: !![],
    }));
}
document["readyState"] === "loading"
  ? document["addEventListener"]("DOMContentLoaded", initExamPopupObserver)
  : initExamPopupObserver();
window["addEventListener"](
  "keydown",
  (a) => {
    a["key"] == "Escape" && a["stopPropagation"]();
  },
  !![],
);
let audioCtx = null,
  oscillator = null,
  gainNode = null;
(ipcRenderer["on"]("heartbeat", () => {
  ipcRenderer["send"]("web-heartbeat-ping");
}),
  window["addEventListener"]("beforeunload", function (a) {
    (!loginInfo["password"] || loginInfo["password"]["length"] < 0x8) &&
      ipcRenderer["send"]("account-login-expired");
  }));
async function sendImageToUser(a, b) {
  const c = await fetch("https://mms.pinduoduo.com/plateau/file/pre_upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON["stringify"]({
      chat_type_id: 0x1,
      file_usage: 0x1,
    }),
  })["then"]((d) => d["json"]());
  if (c?.["success"]) {
    const d = c?.["result"]?.["upload_signature"],
      f = await fetch("https://file.pinduoduo.com/v2/store_image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON["stringify"]({
          image: a,
          upload_sign: d,
        }),
      })["then"]((g) => g["json"]());
    window["postMessage"]({
      type: "send-message",
      data: {
        cmd: "send_message",
        request_id: 0x19d90175be2,
        message: {
          to: {
            role: "user",
            uid: b,
          },
          from: { role: "mall_cs" },
          ts: Math["floor"](Date["now"]() / 0x3e8),
          content: f["url"],
          msg_id: null,
          type: 0x1,
          is_aut: 0x0,
          manual_reply: 0x1,
          status: "read",
          is_read: 0x1,
          size: {
            height: f["height"],
            width: f["width"],
            image_size: Math["floor"]((a["length"] * 0x3) / 0x4 / 0x400),
          },
          info: { thumb_data: a },
        },
      },
    });
  }
}
(safeIpcOn("ai-transfer-human-mark", (a, b) => {
  window["postMessage"](
    {
      type: "pdd-mark-chat",
      data: {
        markType: 0x1,
        logId: b["userId"],
      },
    },
    "*",
  );
}),
  safeIpcOn("ai-transfer-human-sub", async (a, b) => {
    const c = await getCsidByName(b["subAccount"]);
    if (!c) return;
    window["postMessage"]({
      type: "move-to-chat",
      data: {
        cmd: "move_conversation",
        request_id: Date["now"](),
        conversation: {
          csid: c,
          uid: b["userId"],
          need_wx: ![],
          remark: "无原因直接转移",
        },
      },
    });
  }));
const getCsidByName = async (a) => {
  const b = await fetch("https://mms.pinduoduo.com/latitude/assign/getAssignCsList", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON["stringify"]({ wechatCheck: !![] }),
    })["then"]((g) => g["json"]()),
    c = b?.["result"]?.["csList"];
  if (!b?.["success"] || !c || !a) return null;
  const d = String(a)["trim"](),
    f = Object["entries"](c)["find"](([g, h]) => {
      if (!h || typeof h !== "object") return ![];
      return [g, h["nickname"], h["username"]]
        ["filter"](Boolean)
        ["some"]((i) => String(i)["trim"]() === d);
    });
  return f ? f[0x0] : null;
};
function triggerRealMouse(a) {
  if (!a) return;
  const b = a["getBoundingClientRect"](),
    c = b["left"] + b["width"] / 0x2,
    d = b["top"] + b["height"] / 0x2,
    f = {
      view: window,
      bubbles: !![],
      cancelable: !![],
      composed: !![],
      clientX: c,
      clientY: d,
      screenX: c,
      screenY: d,
      button: 0x0,
      buttons: 0x1,
    },
    g = {
      ...f,
      pointerId: 0x1,
      pointerType: "mouse",
      isPrimary: !![],
    };
  (a["dispatchEvent"](new PointerEvent("pointerover", g)),
    a["dispatchEvent"](new PointerEvent("pointerenter", g)),
    a["dispatchEvent"](new MouseEvent("mouseover", f)),
    a["dispatchEvent"](new MouseEvent("mouseenter", f)),
    a["dispatchEvent"](new PointerEvent("pointerdown", g)),
    a["dispatchEvent"](new MouseEvent("mousedown", f)),
    a["dispatchEvent"](new PointerEvent("pointerup", g)),
    a["dispatchEvent"](new MouseEvent("mouseup", f)),
    a["dispatchEvent"](new MouseEvent("click", f)));
}
