const { ipcRenderer, contextBridge, webFrame } = require("electron"),
  shouldDisablePreloadConsole = process["argv"]["includes"]("--kh-disable-preload-console");
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
      e = a["lineno"] ? ":" + a["lineno"] : "",
      f = a["colno"] ? ":" + a["colno"] : "",
      g = d ? "\x20" + d + e + f : "";
    if (b || c) return ("" + b + g + (c ? "\x0a" + c : ""))["trim"]();
  }
  return String(a);
}
function reportGlobalPreloadError(a, b) {
  const c = getQueryParams();
  ipcRenderer["send"]("write-preload-error-log", {
    shopName: c["shopName"] || "未知店铺",
    platform: "doudian",
    errorMessage: a + ":\x20" + getReadableErrorMessage(b),
    time: new Date()["toLocaleString"]("zh-CN", { hour12: ![] }),
  });
}
let visibilitychange = !![],
  isLowVersion = ![],
  _key = null;
const HEARTBEAT_INTERVAL =
  0x3e8 * 0x3c * 0x3c * Number((Math["random"]() * 0x1 + 0x2)["toFixed"](0x2));
let currentInterval = HEARTBEAT_INTERVAL,
  hearTimer = null,
  shopInfo = null,
  shopBotStatus = 0x0;
const timeReg = />(\d+\s*(?:小时|分钟|分|秒))+<\/div>/;
let isUserOperating = ![],
  lastMouseActivity = 0x0,
  lastKeyboardActivity = 0x0,
  windowHasFocus = ![],
  userActivityTimer = null;
const USER_ACTIVITY_TIMEOUT = 0xbb8;
let sendInsert = ![],
  linkonInsert = ![],
  selectuserInsert = ![];
const _originalFocus = HTMLElement["prototype"]["focus"];
HTMLElement["prototype"]["focus"] = function (a) {
  return _originalFocus["call"](this, a);
};
const _originalBlur = HTMLElement["prototype"]["blur"];
HTMLElement["prototype"]["blur"] = function () {
  return _originalBlur["call"](this);
};
let replyMessage = null,
  replyMessagekey = null;
const keylock = new Map(),
  pending = new Map();
function waitSendSuccess(a, b = 0x2710) {
  return new Promise((c, d) => {
    const e = {
      resolve: c,
      reject: d,
    };
    (!pending["has"](a) && pending["set"](a, []),
      pending["get"](a)["push"](e),
      setTimeout(() => {
        const f = pending["get"](a);
        if (!f) return;
        const g = f["indexOf"](e);
        (g !== -0x1 && (f["splice"](g, 0x1), d(new Error("wait\x20timeout:\x20" + a))),
          f["length"] === 0x0 && pending["delete"](a));
      }, b));
  });
}
window["addEventListener"]("message", async (a) => {
  if (a["data"] && a["data"]["type"] === "shop-info")
    (console["log"]("主窗口收到店铺信息：", a["data"]["data"]), (shopInfo = a["data"]["data"]));
  else {
    if (a["data"] && a["data"]["type"] === "productDetail")
      console["log"]("主窗口收到商品详情：", a["data"]["data"]);
    else {
      if (a["data"] && a["data"]["type"] === "WS_STATE_CHANGE") wsConnectState = 0x1;
      else {
        if (a["data"] && a["data"]["type"] === "get-message") {
          let b = JSON["parse"](a["data"]["data"]);
          if (!linkonInsert) linkonInsert = !![];
          console["log"]("主窗口接收消息》》》》》》》", b);
          !/^\d+$/["test"](b["messageId"]) && (b["messageId"] = b["userId"]);
          if (b["type"] || b["senderRole"] == "1") {
            try {
              const c = await getIndexedDBValue(b["userId"], 0x1f4);
              if (c) {
                const { value: d } = c;
                b["username"] = d["name"];
              } else {
                if (!isLowVersion)
                  try {
                    const f = await fetch(
                      "https://pigeon.jinritemai.com/backstage/getuserinfo?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&FUSION=true&_v=1.0.1.1852&uids=" +
                        b["userId"] +
                        "&_ts=" +
                        Date["now"](),
                      {
                        mode: "cors",
                        credentials: "include",
                      },
                    )["then"]((g) => g["json"]());
                    if (f?.["code"] == 0x0 && f?.["data"])
                      ((b["username"] = f?.["data"][0x0]?.["screen_name"]),
                        (b["messageId"] = b["messageId"]));
                    else
                      f?.["code"] == 0x2af9 &&
                        ((isLowVersion = !![]),
                        (b["username"] = b["username"] ? b["username"] : "用户" + b["userId"]));
                  } catch (g) {
                    console["log"]("获取用户名失败", g);
                  }
                else
                  isLowVersion &&
                    (b["username"] = b["username"] ? b["username"] : "用户" + b["userId"]);
              }
            } catch (h) {
              console["log"]("IndexedDB\x20获取失败", h);
            }
            shopBotStatus == 0x1 &&
              ((b["messageId"] = b["userId"]),
              (b["content"] = b?.["orderStatus"]
                ? "用户发送订单"
                : b?.["goodId"]
                  ? "用户发送商品"
                  : b?.["content"]),
              console["log"]("主窗口发送消息==========", b),
              (b["shopMsgTotal"] = getMsgTotal() || 0x0));
            (console["log"]("最终发送到渲染进程的消息数据==========", b),
              (b["source"] = "code"),
              (b["type"] = "code"));
            b["content"]?.["endsWith"]("接入") && (b["content"] = "用户接入");
            switch (b["content"]) {
              case "[图片]":
                b["content"] = "用户发送了图片";
                break;
              case "[视频]":
                b["content"] = "用户发送了视频";
                break;
            }
            try {
              ipcRenderer["send"]("get-customer-message-list", [b]);
            } catch (i) {
              console["log"]("ipc发送失败", i);
            }
          }
        } else {
          if (a["data"] && a["data"]["type"] === "insert-sucesss") {
            switch (a["data"]["data"]["type"]) {
              case "sendmessage":
                sendInsert = a["data"]["data"]["bool"];
                break;
              case "getmessage":
                linkonInsert = a["data"]["data"]["bool"];
                break;
              case "selectuser":
                selectuserInsert = a["data"]["data"]["bool"];
              default:
                break;
            }
            console["log"](
              "主窗口插入状态==========",
              "sendInsert",
              sendInsert,
              "linkonInsert",
              linkonInsert,
              "selectuserInsert",
              selectuserInsert,
            );
          } else {
            if (a["data"]["type"] === "send-success") {
              console["log"]("发送成功==========", a["data"]["data"]);
              const j = a["data"]?.["data"]?.["userId"],
                k = a["data"]?.["data"]?.["userId2"];
              if (!j && !k) return;
              const l = (m) => {
                const n = pending["get"](m);
                if (!n?.["length"]) return ![];
                const o = n["shift"]();
                return (
                  o["resolve"](a["data"]["data"]),
                  n["length"] === 0x0 && pending["delete"](m),
                  !![]
                );
              };
              l(j) || l(k);
            }
          }
        }
      }
    }
  }
});
function throttle(a, b) {
  let c,
    d = 0x0;
  return function (...e) {
    const f = Date["now"]();
    f - d > b
      ? (a["apply"](this, e), (d = f))
      : (clearTimeout(c),
        (c = setTimeout(
          () => {
            (a["apply"](this, e), (d = Date["now"]()));
          },
          b - (f - d),
        )));
  };
}
class GetSendMessage {
  constructor({ userId: a, username: b, content: c, timeout: d, avatar: e }) {
    ((this["userId"] = a),
      (this["messageId"] = a),
      (this["username"] = b),
      (this["content"] = c),
      (this["timeout"] = d),
      (this["source"] = "dom"));
  }
  static async ["create"]({ userId: a, username: b, content: c, timeout: d, avatar: e }) {
    !a && (a = await getUserIdByUsername(e, b));
    const f = new GetSendMessage({
      userId: a,
      username: b,
      content: c,
      timeout: 0x0,
      avatar: e,
    });
    return ((f["timeout"] = f["durationToMs"](d)), f);
  }
  ["durationToMs"](a) {
    if (!a) return Math["floor"](Date["now"]() / 0x3e8) + 0xb4;
    if (typeof a === "number") return a + 0xb4;
    let b = 0x0;
    const c = a["match"](/(\d+)\s*天/),
      e = a["match"](/(\d+)\s*小时/),
      f = a["match"](/(\d+)\s*(?:分钟|分)/),
      g = a["match"](/(\d+)\s*秒/);
    if (c) b += +c[0x1] * 0x15180;
    if (e) b += +e[0x1] * 0xe10;
    if (f) b += +f[0x1] * 0x3c;
    if (g) b += +g[0x1];
    return Math["floor"](Date["now"]() / 0x3e8 - b) + 0xb4;
  }
}
class OrderByUserInfo {
  constructor(a) {
    ((this["id"] = a["messageId"]),
      (this["convId"] = a["convId"] || ""),
      (this["orderId"] = a["orderId"]),
      (this["ordersku"] = a["ordersku"] || ""),
      (this["orderStatus"] = a["orderStatus"]),
      (this["orderInfo"] = a["orderInfo"] || ""),
      (this["goodId"] = a["goodId"]),
      (this["goodName"] = a["goodName"] || ""),
      (this["goodInfo"] = a["goodInfo"] || ""),
      (this["sku"] = a["sku"] || ""),
      (this["InfoTimerout"] = Date["now"]()));
  }
}
contextBridge["exposeInMainWorld"]("context_bridge", {
  postMessage: (a, b) => ipcRenderer["postMessage"](a, b),
  invoke: (a, b) => ipcRenderer["invoke"](a, b),
  send: (a, b) => ipcRenderer["send"](a, b),
  on: (a, b) => safeIpcOn(a, b),
  getABogus: (a) => {
    if (window["byted_acrawler"] && window["byted_acrawler"]["sign"])
      return window["byted_acrawler"]["sign"]({ url: a });
    return "";
  },
});
const mouseActivityHandler = (a) => {
    windowHasFocus && ((lastMouseActivity = Date["now"]()), (isUserOperating = !![]));
  },
  mouseMoveHandler = throttle(() => mouseActivityHandler("移动"), 0xc8),
  mouseDownHandler = () => mouseActivityHandler("按下"),
  mouseUpHandler = () => mouseActivityHandler("释放"),
  clickHandler = () => mouseActivityHandler("点击");
function addMouseListeners() {
  (document["addEventListener"]("mousemove", mouseMoveHandler),
    document["addEventListener"]("mousedown", mouseDownHandler),
    document["addEventListener"]("mouseup", mouseUpHandler),
    document["addEventListener"]("click", clickHandler));
}
function removeMouseListeners() {
  (document["removeEventListener"]("mousemove", mouseMoveHandler),
    document["removeEventListener"]("mousedown", mouseDownHandler),
    document["removeEventListener"]("mouseup", mouseUpHandler),
    document["removeEventListener"]("click", clickHandler));
}
const keyboardActivityHandler = () => {
  windowHasFocus && ((lastKeyboardActivity = Date["now"]()), (isUserOperating = !![]));
};
function addKeyboardListeners() {
  (document["addEventListener"]("keydown", keyboardActivityHandler),
    document["addEventListener"]("keyup", keyboardActivityHandler),
    document["addEventListener"]("keypress", keyboardActivityHandler));
}
function removeKeyboardListeners() {
  (document["removeEventListener"]("keydown", keyboardActivityHandler),
    document["removeEventListener"]("keyup", keyboardActivityHandler),
    document["removeEventListener"]("keypress", keyboardActivityHandler));
}
const focusHandler = () => {
    (console["log"]("获得焦点"), (windowHasFocus = !![]), startUserActivityTimer());
  },
  blurHandler = () => {
    (console["log"]("失去焦点\x20-\x20停止用户操作检测，清除定时器"),
      (windowHasFocus = ![]),
      (isUserOperating = ![]),
      stopUserActivityTimer());
  };
function addFocusListeners() {
  (window["addEventListener"]("focus", focusHandler),
    window["addEventListener"]("blur", blurHandler));
}
function removeFocusListeners() {
  (window["removeEventListener"]("focus", focusHandler),
    window["removeEventListener"]("blur", blurHandler));
}
function addAllUserActivityListeners() {
  (addMouseListeners(), addKeyboardListeners(), addFocusListeners());
}
function removeAllUserActivityListeners() {
  (removeMouseListeners(), removeKeyboardListeners(), removeFocusListeners());
}
function startUserActivityTimer() {
  (userActivityTimer && clearInterval(userActivityTimer),
    (userActivityTimer = setInterval(() => {
      const a = Date["now"]() - lastMouseActivity,
        b = Date["now"]() - lastKeyboardActivity,
        c = Math["min"](a, b);
      c > USER_ACTIVITY_TIMEOUT && isUserOperating && (isUserOperating = ![]);
    }, 0x3e8)));
}
function stopUserActivityTimer() {
  userActivityTimer &&
    (console["log"]("停止用户活动检查定时器"),
    clearInterval(userActivityTimer),
    (userActivityTimer = null));
}
let logoInfo = {
  username: "",
  password: "",
  shopId: null,
};
const pickLogin = (a) => {
  if (typeof a !== "string") return "";
  return ((a = a["trim"]()), a && a !== "null" && a !== "undefined" ? a : "");
};
safeIpcOn("get-shop-pwd", (a, b) => {
  if (!logoInfo["username"]) logoInfo["username"] = pickLogin(b?.["userName"]);
  if (!logoInfo["password"]) logoInfo["password"] = pickLogin(b?.["password"]);
});
async function refreshLogin() {
  for (const a of process["argv"]) {
    if (a["startsWith"]("--username"))
      logoInfo["username"] = pickLogin(a["slice"]("--username"["length"]));
    else
      a["startsWith"]("--password") &&
        (logoInfo["password"] = pickLogin(a["slice"]("--password"["length"])));
  }
  if (logoInfo["username"] && logoInfo["password"]) return logoInfo;
  return (
    ipcRenderer["send"]("get-shop-pwd"),
    await new Promise((b) => setTimeout(b, 0x1f4)),
    logoInfo
  );
}
window["addEventListener"]("popstate", () => {
  const a = window["location"]["href"];
  if (a["includes"]("homepage"))
    window["location"]["href"] = "https://im.jinritemai.com/pc_seller_v2/main/workspace";
  else a["includes"]("error") && (console["log"]("页面错误"), window["location"]["reload"]());
});
const oldRAF = window["requestAnimationFrame"];
((window["requestAnimationFrame"] = (a) => {
  return oldRAF((b) => {
    setTimeout(() => a(b), 0x20);
  });
}),
  window["addEventListener"]("load", async () => {
    (setTimeout(() => {
      const h = document["querySelector"]("[alt=\x22测试小牛\x22]");
      (console["log"]("testdom====", h),
        h &&
          h["addEventListener"]("click", async (i) => {
            (console["log"]("点击头像"), window["postMessage"]({ type: "pull-message" }));
          }));
    }, 0x1388),
      document["addEventListener"](
        "keydown",
        (h) => {
          if (h["key"] !== "Enter" || h["shiftKey"]) return;
          const i = h["target"]["closest"]("[data-qa-id=\x22qa-send-message-textarea\x22]");
          if (!i) return;
          const j = (i["className"] || "")["toString"](),
            k = j["match"](/inputArea_([^\s]+)/);
          if (!k) return;
          const l = k[0x1],
            m = i["textContent"];
          console["log"]("发送消息\x20dyDom1", l, m);
          const n = keylock["get"](l);
          n && clearTimeout(n);
          const o = setTimeout(() => {
            keylock["delete"](l);
          }, 0x7d0);
          (keylock["set"](l, o),
            ipcRenderer["send"]("reply-customer-message", {
              messageId: l,
              userId: l,
              shopMsgTotal: getMsgTotal(),
              sendTarget: "dyDom1",
              content: m,
              platformType: "抖店",
            }));
        },
        !![],
      ));
    const a = Date["now"](),
      b = setInterval(() => {
        const h = document["querySelector"](".auxo-modal-wrap"),
          i = document["querySelector"](".auxo-modal-mask");
        (h &&
          i &&
          (console["log"]("modal\x20命中，已隐藏", h),
          (h["style"]["display"] = "none"),
          (i["style"]["display"] = "none"),
          clearInterval(b)),
          Date["now"]() - a > 0x2710 && (clearInterval(b), console["log"]("10s\x20检查结束")));
      }, 0xc8),
      c = document["querySelector"]("#garfishModuleInfo");
    if (c) {
      const h = JSON["parse"](c["textContent"]);
      if (h["app:@ecom-vmok/pigeon-im-pc"]) {
        if (h["app:@ecom-vmok/pigeon-im-pc"]["shared"][0x0]["assets"]["css"]["sync"]) {
          const i = getPreviousByPrefix(
            h["app:@ecom-vmok/pigeon-im-pc"]["shared"][0x0]["assets"]["css"]["sync"],
            "pages/view_exams/index",
          );
          i && ipcRenderer["send"]("get-page-load-js", i["split"](".")[0x0]);
        }
      }
    }
    (ipcRenderer["send"]("get-shop-page-loaded"),
      (windowHasFocus = document["hasFocus"]()),
      console["log"]("页面加载完成，当前焦点状态:", windowHasFocus),
      console["log"]("页面加载时间:", new Date()["toLocaleString"]()));
    const d = document["createElement"]("style");
    ((d["innerHTML"] =
      "\x0a\x20\x20\x20\x20*,\x0a\x20\x20\x20\x20*::before,\x0a\x20\x20\x20\x20*::after\x20{\x0a\x20\x20\x20\x20\x20\x20animation-delay:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20animation-duration:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20animation-iteration-count:\x201\x20!important;\x0a\x20\x20\x20\x20\x20\x20transition-duration:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20transition-delay:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20scroll-behavior:\x20auto\x20!important;\x0a\x20\x20\x20\x20}\x0a\x20\x20"),
      document["head"]?.["appendChild"](d),
      setTimeout(() => {
        (ipcRenderer["send"]("request-shop-bot-status"),
          shopBotStatus === 0x1 && addAllUserActivityListeners());
      }, 0x3e8),
      ipcRenderer["send"]("get-currnt-page", !![]));
    const e = new MutationObserver(async (j) => {
      for (let k of j) {
        if (k["type"] === "childList") {
          const l = document["querySelector"](".email");
          if (l) {
            (l["click"](),
              setTimeout(async () => {
                const { username: m, password: n } = await refreshLogin(),
                  o = document["querySelector"](
                    "#ecomLoginForm\x20>\x20section\x20>\x20div.account-center-sdk-form\x20>\x20div:nth-child(1)\x20>\x20div\x20>\x20div\x20>\x20span\x20>\x20input",
                  );
                if (!o) return;
                o["value"] = m;
                const p = document["querySelector"](
                  "#ecomLoginForm\x20>\x20section\x20>\x20div.account-center-sdk-form\x20>\x20div.account-center-input-row.ac-input-last-item\x20>\x20div\x20>\x20div\x20>\x20span\x20>\x20input",
                );
                if (!p) return;
                p["value"] = n;
                const q = document["createEvent"]("HTMLEvents");
                (q["initEvent"]("input", !![], !![]),
                  (q["eventType"] = "message"),
                  o["dispatchEvent"](q),
                  p["dispatchEvent"](q),
                  o["addEventListener"]("input", () => {
                    logoInfo["username"] = o["value"];
                  }),
                  p["addEventListener"]("input", () => {
                    logoInfo["password"] = p["value"];
                  }));
                const s = document["querySelector"](".auxo-checkbox-input");
                s?.["click"]();
                const t = document["querySelector"](
                  "#ecomLoginForm\x20>\x20section\x20>\x20div.account-center-submit\x20>\x20button",
                );
                (t?.["addEventListener"]("click", () => {
                  ipcRenderer["send"]("loginInfo", logoInfo);
                }),
                  t &&
                    n &&
                    m &&
                    setTimeout(() => {
                      t["click"]();
                    }, 0x708));
              }, 0x3e8),
              e["disconnect"]());
            break;
          }
        }
      }
    });
    e["observe"](document["body"], { childList: !![] });
    const f = new MutationObserver(async (j) => {
      for (let k of j) {
        k["type"] === "childList" &&
          setTimeout(() => {
            const l = document["querySelector"](
              ".auxo-modal-wrap.auxo-modal-confirm-centered.auxo-modal-centered",
            );
            if (l) {
              const m = l["querySelector"](".auxo-modal-confirm-title");
              if (m["textContent"] == "检测到登录账号发生变化") {
                const n = document["querySelector"](".auxo-modal-root");
                n["remove"]();
              }
            }
          }, 0xa);
      }
    });
    f["observe"](document["body"], { childList: !![] });
    let g = null;
    (document["addEventListener"]("visibilitychange", () => {
      (console["log"]("页面变为可见", document, document["visibilityState"], document["hidden"]),
        document["visibilityState"] === "visible"
          ? ((visibilitychange = !![]), g && (g = null))
          : (visibilitychange = ![]));
    }),
      setTimeout(() => {
        getShopInfo();
      }, 0xbb8));
  }));
const mycode = () => {
  let a = [];
  class b {
    constructor(f, g, h, i, j, k, l, m, n, o) {
      ((this["schemeTaskConfigId"] = f),
        (this["beginTime"] = g),
        (this["customerName"] = h || "默认客户"),
        (this["customerId"] = i),
        (this["customerServiceName"] = j),
        (this["customerServiceId"] = k),
        (this["tid"] = l),
        (this["remark1"] = m),
        (this["remark2"] = n),
        (this["remark3"] = o),
        (this["remark4"] = k),
        (this["dialogue"] = []));
    }
    async ["init"](f) {
      if (!f) return;
      const g = Array["isArray"](f) ? f : [f];
      this["dialogue"] = await Promise["all"](g["map"]((h) => this["normalizeDialogue"](h)));
    }
    async ["normalizeDialogue"](f) {
      const g = f?.["ext"]?.["sender_role"];
      return {
        beginTime: new Date(f?.["create_time"])
          ["toISOString"]()
          ["replace"]("T", "\x20")
          ["slice"](0x0, 0x13),
        role: g == 0x1 ? "客户" : "客服",
        identity:
          g == 0x1 ? this["customerName"] : g == 0x2 ? this["customerServiceName"] : "平台客服",
        emotionValue: 0x6,
        speechRate: 0x99,
        words:
          f?.["content"] == "[图片]"
            ? f["ext"]?.["imageUrl"]
            : f?.["content"] == "[视频]"
              ? await this["getVideo"](f["ext"]?.["msg_render_model"])
              : f?.["content"],
        begin: 0x3e8,
        end: 0x3e8,
        channelId: g == 0x1 ? 0x0 : 0x1,
        type: f?.["content"] == "[图片]" ? "IMAGE" : f?.["content"] == "[视频]" ? "AUDIO" : "TEXT",
      };
    }
    async ["getVideo"](f) {
      const g = JSON["parse"](f),
        h = g?.["render_body"]?.["vid"];
      if (!h) return "[视频]";
      const i = await fetch(
        "https://pigeon.jinritemai.com/backstage/video/getPlayToken?vid=" + h + "&_pms=1",
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      )["then"]((k) => k["json"]());
      if (!i?.["data"]?.["token"]) return "[视频]";
      const j = await fetch("https://open.bytedanceapi.com/?" + i["data"]["token"], {
        method: "GET",
      })["then"]((k) => k["json"]());
      return (
        j?.["Result"]?.["Data"]?.["PlayInfoList"]?.[0x0]?.["BackupPlayUrl"] ||
        j?.["Result"]?.["Data"]?.["PlayInfoList"]?.[0x0]?.["MainPlayUrl"] ||
        "[视频]"
      );
    }
    static async ["create"](...f) {
      const g = new b(...f["slice"](0x0, 0xa));
      return (await g["init"](f[0xa]), g);
    }
  }
  window["addEventListener"]("message", (f) => {
    if (f["data"]["type"] == "quality-socket-message") {
      console["log"]("quality-socket-message", f["data"]["data"]);
      const g = f["data"]["data"];
      c(0x1, g);
    } else
      f["data"]["type"] == "test" &&
        fetch(
          "https://pigeon.jinritemai.com/chat/api/backstage/conversation/can_start_conversation?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&device_platform=web&FUSION=true&verifyFp=verify_mki3vlqo_Gno7VUjv_oYrj_4EB1_9xCV_awPSJbtqj9SA&_v=1.0.1.6362&pigeonUid=" +
            f["data"]["data"] +
            "&render=backend\x0a\x20\x20\x20\x20\x20\x20",
          {
            method: "GET",
            credentials: "include",
          },
        );
  });
  function c(f, g) {
    fetch("https://pigeon.jinritemai.com/backstage/fuzzySearchConversation?_pms=1", {
      method: "POST",
      credentials: "include",
      body: JSON["stringify"]({
        evaluationTypeList: [],
        commentType: [],
        sessionTypeList: [],
        conversation_server_type: [0x3, 0x1, 0x2, 0x0],
        page: f,
        size: 0x64,
        evaluationLabelList: [],
        workTimeType: 0x0,
        isFirstResolutionConversation: ![],
        inquiryOrderTypes: [],
        isInquiryOrders: [-0x1, 0x0, 0x1],
        turn2_labor_type_agg: [],
        conversationEvaluationType: [],
        robot_evaluation_type: [],
        humanEvaluationType: [],
        conv_source: [],
        dispatch_group_id: [],
        startTime: g["startTime"],
        endTime: g["endTime"],
        startSceneTypeList: [0x1, 0x2, 0x3, 0x4, 0x5, 0x8, 0x0],
        endSceneTypeList: [0x1, 0x2, 0x6, 0x7, 0x8, 0x9, 0xa, 0xb],
        staffQuery: "",
        userQuery: "",
        conversationId: "",
        content: "",
      }),
    })
      ["then"]((h) => h["json"]())
      ["then"](async (h) => {
        console["log"]("res=============", h, h["total"] > f * 0x64);
        if (h["code"] == 0x0 && h["data"] && h["data"]["length"] > 0x0)
          for (const i of h["data"]) {
            if (i["staffId"]) {
              const j = await b["create"](
                g["taskId"],
                i["laborStartTime"],
                i["userName"],
                i["userId"],
                i?.["first_staff_name"] || i?.["staffName"] || i?.["staff_username"] || "默认客服",
                g["groupId"],
                i["conversationId"],
                g["shopId"],
                g["merchantId"],
                g["platformType"],
                i["chats"],
              );
              a["push"](j);
            }
          }
        h["total"] > f * 0x64
          ? (console["log"]("进入total判断", f * 0x64), c(++f, g))
          : (console["log"]("结束total判断", a, "\x0a", JSON["stringify"](a), g),
            window["context_bridge"]["send"]("send-quality-socket-message", JSON["stringify"](a)),
            (a = []));
      });
  }
  const d = 0xea60;
  let e = null;
};
(webFrame["executeJavaScript"]("(" + mycode + ")()"),
  webFrame["executeJavaScript"]("(" + injectScript + ")()"),
  safeIpcOn("update-shop-bot-status", (a, b) => {
    console["log"]("收到店铺bot状态更新:", b);
    const c = shopBotStatus;
    shopBotStatus = b["botStatus"];
    if (shopBotStatus === 0x1 && c !== 0x1) addAllUserActivityListeners();
    else shopBotStatus !== 0x1 && c === 0x1 && removeAllUserActivityListeners();
  }),
  safeIpcOn("get-shop-status", (a) => {
    const b = (document["querySelector"]("img[alt=\x22下箭头\x22]")?.["parentElement"]?.[
      "firstChild"
    ]?.["textContent"]?.["trim"]() || "")["replace"]("小休", "忙碌");
    b && ipcRenderer["send"]("shop-status-change", { status: b });
  }));
const startListenShopStatus = (a) => {
  const b = new MutationObserver(async (c) => {
    for (let d of c) {
      if (d["type"] === "characterData") {
        let e = d["target"]["nodeValue"]["trim"]();
        (e === "小休" && (e = "忙碌"), ipcRenderer["send"]("shop-status-change", { status: e }));
      }
    }
  });
  (b["observe"](a, {
    characterData: !![],
    subtree: !![],
    childList: ![],
    attributes: ![],
  }),
    (window["_observers"] = window["_observers"] || []),
    window["_observers"]["push"](b));
};
function disconnectAllObservers() {
  window["_observers"] &&
    window["_observers"]["length"] &&
    (window["_observers"]["forEach"]((a) => {
      a["disconnect"]();
    }),
    (window["_observers"] = []));
}
window["addEventListener"]("beforeunload", disconnectAllObservers);
let pushedMessageInfo = new Map(),
  isLoginSuccess = ![],
  canGetShopInfo = !![],
  currentServiceId = "";
function getShopInfo() {
  (pollUnReplyMessage(),
    fetch(
      "https://pigeon.jinritemai.com/backstage/currentuser?_ts=" +
        Date["now"]() +
        "&biz_type=4&_pms=1",
      {
        mode: "cors",
        credentials: "include",
      },
    )
      ["then"]((a) => a["json"]())
      ["then"]((a) => {
        const { code: b, data: c } = a;
        b === 0x0 &&
          ((shopInfo = {
            id: c["ShopId"]["toString"](),
            name: c["ShopName"],
            logo: c["ShopLogo"],
            username: c["CustomerServiceInfo"]["screen_name"],
            kf: c["CustomerServiceInfo"]["id"],
          }),
          console["log"]("获取店铺信息成功:", a, shopInfo),
          getUnReplyMessage(),
          _renewCookie(),
          canGetShopInfo &&
            (ipcRenderer["send"]("get-shop-info", shopInfo),
            (isLoginSuccess = !![]),
            (canGetShopInfo = ![]),
            fetch(
              "https://pigeon.jinritemai.com/backstage/onlineservice?busy=1&_ts=" +
                Date["now"]() +
                "&biz_type=4&_pms=1",
              {
                mode: "cors",
                credentials: "include",
              },
            )
              ["then"]((d) => d["json"]())
              ["then"]((d) => {
                d["code"] === 0x0
                  ? d["data"]["forEach"]((e) => {
                      if (e["service_toutiao_id_str"] === shopInfo["kf"]) {
                        let f = "";
                        switch (e["online_status"]) {
                          case 0x0:
                            f = "忙碌";
                            break;
                          case 0x1:
                            f = "在线";
                            break;
                          case 0x2:
                            f = "离线";
                            break;
                        }
                        ipcRenderer["send"]("shop-status-change", { status: f });
                      }
                    })
                  : (console["log"]("低版本==========="), (isLowVersion = !![]));
              })));
      }));
}
function getUnReplyMessage(a = !![]) {
  try {
    fetch(
      "https://pigeon.jinritemai.com/chat/api/backstage/conversation/get_current_conversation_list?_ts=" +
        Date["now"]() +
        "&biz_type=4&PIGEON_BIZ_TYPE=2&pageNo=0&pageSize=200&_pms=1&FUSION=true",
      {
        mode: "cors",
        credentials: "include",
      },
    )
      ["then"]((b) => b["json"]())
      ["then"](async (b) => {
        const { code: c, data: d } = b;
        if (c === 0x0) {
          let e = [];
          for (let f of d) {
            const { countdown: g, countdown_time: h } = f["coreInfoMap"];
            if (g === "true") {
              let i = {
                userId: "",
                username: "",
                isTimeout: ![],
                timeNote: "",
                content: "",
                avatar: "",
                timeout: parseInt(h) + 0xb4,
                messageId: "",
              };
              const j = f["msgList"]
                ? f["msgList"]
                    ["filter"]((k) => {
                      return (
                        k["messageBody"]["ext"]["s:sender_biz_role"] === "Buyer" &&
                        k["messageBody"]["ext"]["attention"] === "true" &&
                        !k["messageBody"]?.["content"]?.["endsWith"]("接入")
                      );
                    })
                    ["sort"]((k, l) => {
                      const m = parseInt(k["messageBody"]["createTime"]),
                        n = parseInt(l["messageBody"]["createTime"]);
                      return n - m;
                    })
                : [];
              console["log"]("buyerMessage+=======", j);
              for (let k of j) {
                const { uname: l } = k["messageBody"]["ext"];
                l && (i["username"] = l);
                if (i["username"]) break;
              }
              if (j["length"] > 0x0) {
                let m = j[0x0];
                const n = await getIndexedDBFirstChar(),
                  o = /^\d+$/["test"](n?.["key"]);
                (console["log"]("lastMessage", m, o),
                  (i["userId"] = o
                    ? m["messageBody"]["sender"]
                    : m["messageBody"]?.["ext"]?.["security_src_user_id"]),
                  (i["messageId"] = o
                    ? m["messageBody"]["sender"]
                    : m["messageBody"]?.["ext"]?.["security_src_user_id"]),
                  (i["content"] = m["messageBody"]["content"]),
                  (i["api"] = !![]),
                  console["log"]("inf============1", i));
                if (!i["username"])
                  try {
                    const p = await fetch(
                      "https://pigeon.jinritemai.com/backstage/getuserinfo?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&FUSION=true&_v=1.0.1.1852&uids=" +
                        i["userId"] +
                        "&_ts=" +
                        Date["now"](),
                      {
                        mode: "cors",
                        credentials: "include",
                      },
                    )["then"]((q) => q["json"]());
                    if (p["code"] === 0x0 && p["data"] && p["data"]["length"] > 0x0) {
                      const { avatar_url: q, screen_name: r } = p["data"][0x0];
                      i["username"] = r;
                      if (i["userId"]) i["messageId"] = i["userId"];
                      if (!i["messageId"]) continue;
                      if (i["content"]["endsWith"]("接入")) continue;
                      e["push"](i);
                    } else
                      ((i["username"] = "用户" + i["userId"]),
                        (i["messageId"] = i["userId"]),
                        e["push"](i));
                  } catch (s) {
                    (console["log"](s),
                      (i["username"] = "用户" + i["userId"]),
                      (i["messageId"] = i["userId"]),
                      e["push"](i));
                  }
                else {
                  if (!i["messageId"]) continue;
                  if (i["content"]["endsWith"]("接入")) continue;
                  (console["log"]("inf=============", i), (i["source"] = "url"), e["push"](i));
                }
              }
            }
          }
          (console["log"]("unReplyMessageList", e),
            e["length"] > 0x0 && ipcRenderer["send"]("get-customer-message-list", e));
        } else
          c === 0x2715 &&
            !window["location"]["href"]["includes"]("https://fxg.jinritemai.com/login/common") &&
            shopInfo?.["id"] &&
            (ipcRenderer["send"]("account-login-expired"),
            console["log"]("登录过期，请重新登录"),
            (window["location"]["href"] = "https://fxg.jinritemai.com/login/common"));
      });
  } catch (b) {
    console["log"]("获取未回复消息失败", b);
  }
}
const secondCompensationMessage = () => {
  const a = document["querySelector"]("#chantListScrollArea");
  if (!a) return;
  let b = [];
  const c = a["querySelector"](".list_items");
  if (!c) return;
  (c["querySelectorAll"]("div")["forEach"]((d) => {
    if (d && d["querySelector"]("[data-qa-id=\x22qa-conversation-chat-item\x22]")) {
      const e = d["querySelector"]("[data-qa-id=\x22qa-conversation-chat-item\x22]"),
        f = e["lastChild"]["firstChild"];
      if (["时", "分", "秒"]["some"]((g) => f["textContent"]["includes"](g))) {
        const g = e["childNodes"][0x1]["querySelector"]("img[alt=\x22头像\x22]")?.["src"] || "";
        if (g)
          try {
            const h = e["querySelector"]("[data-btm=\x22d089038\x22]"),
              i = h["previousSibling"]["firstChild"],
              j = i["textContent"],
              k = e["childNodes"][0x2]["childNodes"][0x1]["textContent"];
            let l = "";
            j["includes"]("用户") && (l = j["split"]("用户")[0x1]);
            const m = {
              messageId: j,
              content: k,
              username: j,
              timeout: Math["floor"](new Date() / 0x3e8) + 0xb4,
              isTimeout: ![],
              timeNote: "",
              api: ![],
              userId: l,
            };
            (b["push"](m), console["log"]("二次补偿", m));
          } catch (n) {}
      }
    }
  }),
    b["length"] > 0x0 && pushMessagesIfNeeded(b));
};
async function getUserOrderFromInject(a, b) {
  return new Promise((c) => {
    const d = (e) => {
      e["data"] &&
        e["data"]["type"] === "get-user-order-result" &&
        (window["removeEventListener"]("message", d), c(e["data"]["data"]));
    };
    (window["addEventListener"]("message", d),
      window["postMessage"](
        {
          type: "get-user-order",
          data: {
            userId: a,
            orderId: b,
          },
        },
        "*",
      ),
      setTimeout(() => {
        (window["removeEventListener"]("message", d), c(null));
      }, 0x1388));
  });
}
async function getGoodsMessage(a, b) {
  const c = await fetch(
    "\x20\x20https://pigeon.jinritemai.com/backstage/workstation/get_consulting_products?user_id=" +
      a +
      "&conv_id=" +
      b +
      "&_ts=" +
      Date["now"](),
    {
      mode: "cors",
      credentials: "include",
    },
  )["then"]((e) => e["json"]());
  console["log"]("咨询商品", c);
  if (!c["data"]["consulting_product"] || c["data"]["consulting_product"]["length"] === 0x0)
    return "";
  const d = c["data"]["consulting_product"][0x0];
  return {
    goodId: d["product_id"],
    goodName: d["product_name"],
    goodImage: d["img"],
  };
}
(safeIpcOn("set-ai-to-human-reply", () => {
  const a = document["querySelector"]("[data-btm-id=\x22a9034.b39122.c0467.d4350\x22]");
  a && ipcRenderer["send"]("set-ai-to-human-reply-customer", { messageId: a["textContent"] || "" });
}),
  safeIpcOn("get-shop-experience-score", (a) => {
    (console["log"]("获取抖店体验分"), getShopExperienceScore());
  }));
const getShopExperienceScore = () => {
  fetch(
    "https://fxg.jinritemai.com/governance/shop/experiencescore/getOverviewByVersion?exp_version=release&source=1",
    {
      mode: "cors",
      credentials: "include",
    },
  )
    ["then"]((a) => a["json"]())
    ["then"]((a) => {
      const { data: b } = a;
      if (b) {
        const c = {
          consumerDivide: b["experience_score"]["value"],
          serviceDivide: b["goods_score"]["value"],
          foundationDivide: b["logistics_score"]["value"],
          deliveryDivide: b["service_score"]["value"],
          goodDivide: "0",
          logisticsDivide: "0",
        };
        ipcRenderer["send"]("getShopExperienceScore", c);
      }
    });
};
function formatDoudianExperienceMetricValue(a) {
  if (a?.["value_type"] === 0x2)
    return Number(((a?.["value_figure"] || 0x0) * 0x64)["toFixed"](0x4));
  return a?.["value_figure"] ?? "";
}
function buildDoudianExperienceScoreData(a) {
  const b = Array["isArray"](a?.["shop_analysis"]) ? a["shop_analysis"] : [],
    c = Array["isArray"](a?.["shop_sub_score"]) ? a["shop_sub_score"] : [],
    d = (f) => {
      const g = c["find"]((h) => h?.["sub_score_name"] === f);
      return g?.["sub_score"] ?? "";
    },
    e = (f) => {
      const g = b["find"]((h) => h?.["title"] === f);
      if (!g)
        return {
          score: "",
          shopValue: "",
        };
      return {
        score: g?.["node_score_info"]?.["node_score"] ?? "",
        shopValue: formatDoudianExperienceMetricValue(g?.["value"]),
      };
    };
  return {
    shopId: a?.["shop_id"] ?? "",
    shopName: a?.["shop_name"] ?? "",
    beginDate: a?.["begin_date"] ?? "",
    currentDate: a?.["current_date"] ?? "",
    shopOrderLatest30Cnt: a?.["shop_order_latest_30_cnt"] ?? "",
    productScore: d("商品体验得分"),
    logisticsScore: d("物流体验得分"),
    serviceScore: d("服务体验得分"),
    badBehaviorScore: d("差行为扣分"),
    productMetrics: {
      goodsRating: e("商品综合评分"),
      goodsRefundRate: e("商品品质退货率"),
    },
    logisticsMetrics: {
      pickupInTimeRate: e("揽收时效达成率"),
      pickupAvgScore: e("揽收时长平均得分"),
      deliveryInTimeRate: e("运单配送时效达成率"),
      logisticsRefundRate: e("发货物流品退率"),
    },
    serviceMetrics: {
      imReplyDuration: e("飞鸽平均响应时长"),
      afterSaleHandleInTimeRate: e("售后处理时长达成率"),
    },
    badBehaviorMetrics: {
      fakeTradeScore: e("虚假交易刷体验分"),
      affectConsumerExperienceScore: e("影响消费者体验"),
    },
  };
}
const getShopEXperienceScoreNew = async () => {
  const a = await fetch(
      "https://fxg.jinritemai.com/governance/shop/experiencescore/getAnalysisScore?exp_version=release&number_type=30+&new_shop_version=release",
      {
        mode: "cors",
        credentials: "include",
      },
    ),
    b = await a["json"](),
    c = buildDoudianExperienceScoreData(b?.["data"]);
  return (console["log"]("抖店体验分分析数据", c), c);
};
let messageList = new Map(),
  isFirstLoad = !![],
  pendingMessages = [],
  batchTimer = null,
  timerIds = {
    messageCheck: null,
    statusCheck: null,
    unReplyMessage: null,
    shopObserver: null,
    cleanup: null,
    memoryCheck: null,
    batchSend: null,
  };
function getQueryParams() {
  const a = window["location"]["href"],
    b = new URL(a),
    c = new URLSearchParams(b["search"]),
    d = c["get"]("shopName");
  return { shopName: d };
}
const getUserWatchGoodsMessage = async (a) => {
  if (a["length"] === 0x0) return;
  const b = a["find"]((h) => h["messageBody"]["content"] === "用户正在查看商品");
  if (!b) return null;
  const c = JSON["parse"](b["messageBody"]["ext"]["static_data"]),
    d = c["b_goods"][0x0],
    e = await getGoodDesc(d["product_id"]),
    f = e["map"]((h) => h["name"] + ":" + h["values"])["join"](","),
    g = {
      goodName: d["product_name"],
      goodId: d["product_id"],
      goodDesc: f,
    };
  return JSON["stringify"](g);
};
async function getGoodDesc(a) {
  const b = await fetch(
      "https://haohuo.jinritemai.com/aweme/v2/shop/promotion/pack/detail/?is_h5=1&origin_type=1337&_ts=" +
        Date["now"](),
      {
        mode: "cors",
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "promotion_id=" + a + "&enter_from=&meta_param=&is_h5=1",
      },
    ),
    c = await b["json"]();
  console["log"]("detail>>>>>>>", c);
  const d = c["detail_info"];
  let e = [];
  return (
    d?.["product_format"] &&
      Array["isArray"](d?.["product_format"]) &&
      d?.["product_format"]["forEach"]((f, g) => {
        if (f["name"] && f["message"] && Array["isArray"](f["message"])) {
          const h = f["message"]["map"]((i) => i["desc"])["filter"](Boolean);
          h["length"] > 0x0 &&
            e["push"]({
              name: f["name"],
              values: h["join"](","),
            });
        }
        f["format"] &&
          Array["isArray"](f["format"]) &&
          f["format"]["forEach"]((i) => {
            if (i["name"] && i["message"] && Array["isArray"](i["message"])) {
              const j = i["message"]["map"]((k) => k["desc"])["filter"](Boolean);
              j["length"] > 0x0 &&
                e["push"]({
                  name: i["name"],
                  values: j["join"](","),
                });
            }
          });
      }),
    e
  );
}
function getOrderStatusWithRetry(a, b = 0xbb8) {
  return new Promise((c) => {
    let d = ![],
      e = 0x0;
    const f = 0x3;
    let g = null,
      h = null;
    const i = (j) => {
      if (j["data"]?.["type"] === "order_status" && !d) {
        ((d = !![]), window["removeEventListener"]("message", i));
        if (g) clearInterval(g);
        if (h) clearTimeout(h);
        (console["log"]("[订单]\x20拦截到订单状态:", j["data"]["data"]?.["orderStatus"]),
          c(j["data"]["data"]?.["orderStatus"] || null));
      }
    };
    (window["addEventListener"]("message", i),
      (g = setInterval(() => {
        if (d) {
          clearInterval(g);
          return;
        }
        (e++,
          e <= f
            ? (console["log"]("[订单]\x20第\x20" + e + "\x20次点击刷新"), clickOrderRefresh())
            : clearInterval(g));
      }, 0x1f4)),
      (h = setTimeout(() => {
        if (!d) {
          ((d = !![]), window["removeEventListener"]("message", i));
          if (g) clearInterval(g);
          (console["log"]("[订单]\x20超时未获取到订单状态"), c(null));
        }
      }, b)));
  });
}
function clickOrderRefresh() {
  const a = document["getElementById"]("qa-order-refresh-icon");
  a && (a["click"](), console["log"]("[订单]\x20已点击刷新按钮"));
}
(safeIpcOn("get-shop-user", async (a, b) => {
  console["log"]("获取用户信息", b);
  if (linkonInsert) {
    ipcRenderer["send"]("get-shop-isuser-status", { hasContent: ![] });
    return;
  }
  const c = document["querySelector"]("[data-qa-id=\x22qa-send-message-textarea\x22]");
  if (c) {
    const k = c["value"] && c["value"]["trim"]()["length"] > 0x0,
      l = Date["now"](),
      m = l - lastMouseActivity,
      n = l - lastKeyboardActivity,
      o = Math["min"](m, n),
      p = windowHasFocus && o < USER_ACTIVITY_TIMEOUT,
      q = k || p;
    ipcRenderer["send"]("get-shop-isuser-status", { hasContent: q });
    if (q) {
      console["log"]("用户正在操作，跳过AI处理");
      return;
    }
  } else {
    ipcRenderer["send"]("get-shop-isuser-status", { hasContent: ![] });
    return;
  }
  const d = { ...b },
    { shopId: e, messageId: f, userId: g, username: h } = b,
    i = document["querySelector"]("[data-qa-id=\x22qa-chat-tab\x22]");
  if (i) i["click"]();
  else {
    const r = document["querySelector"]("[class=\x22auxo-badge\x20auxo-badge-top-right\x22]");
    if (r) {
      const s = r?.["nextSibling"];
      s && s["textContent"]["includes"]("会话") && s["click"]();
    }
  }
  (await new Promise((t) => {
    setTimeout(() => {
      try {
        const u = document["querySelector"]("[data-qa-id=\x22qa-active-chat-tab\x22]");
        (u && u["click"](), t());
      } catch (v) {
        t();
      }
    }, 0x64);
  }),
    await new Promise((t) => setTimeout(t, 0x12c)));
  let j = null;
  j = document["querySelector"]("[title=\x22" + h + "\x22]");
  if (!j) {
    console["log"]("没有找到titleDom");
    const t = Array["from"](
      document["querySelectorAll"]("[data-qa-id=\x22qa-conversation-chat-item\x22]"),
    );
    t["forEach"]((u) => {
      const v = u["querySelector"]("[data-btm=\x22d089038\x22]"),
        w = v?.["previousSibling"];
      w && w["firstChild"]?.["textContent"]["includes"](g) && (j = w);
    });
  }
  if (j) {
    const u = j["parentElement"]["parentElement"];
    if (u) {
      (u["click"](), await new Promise((C) => setTimeout(C, 0x12c)));
      const v = getMsgList(),
        w = [...v]["reverse"](),
        x = w["findIndex"]((C) => C["role"] === "assistant");
      let y = x >= 0x0 ? w["slice"](0x0, x)["reverse"]() : [];
      d["history"] = y["filter"]((C) => C["content"] != "");
      const z = d["history"]["filter"](
        (C, D, E) => E["findIndex"]((F) => F["content"] === C["content"]) === D,
      );
      d["history"] = z;
      const A = v["find"]((C) => C["orderStatus"] && C["orderStatus"] !== "暂无订单")?.[
        "orderStatus"
      ];
      if (A) ((d["orderStatus"] = A), console["log"]("[订单]\x20从消息列表获取订单状态:", A));
      else {
        const C = await getOrderStatusWithRetry(f, 0x5dc);
        C &&
          ((d["orderStatus"] = C),
          d["history"]["forEach"]((D) => {
            (!D["orderStatus"] || D["orderStatus"] === "暂无订单") && (D["orderStatus"] = C);
          }),
          console["log"]("[订单]\x20主动获取订单状态:", C));
      }
      const B = JSON["stringify"](d);
      (console["log"]("用户发送内容", B), ipcRenderer["send"]("get-historical-records", B));
    }
  }
}),
  safeIpcOn("click-customer-message", async (a, b) => {
    console["log"]("点击用户信息为", b, linkonInsert);
    let c = b["userId"] || b["messageId"];
    const d = document["querySelector"](".pigeonChatNotScrollBox\x20.scroller"),
      e = d["querySelector"]("[title=\x22" + b["username"] + "\x22]");
    if (e) {
      e["click"]();
      return;
    }
    if (c) {
      (window["postMessage"]({
        type: "select-user",
        data: c,
      }),
        console["log"]("退出后续dom查找======"));
      return;
    }
    const f = document["querySelector"]("[aria-controls=\x22rc-tabs-0-panel-current\x22]");
    if (f) f?.["click"]();
    await new Promise((g) => setTimeout(g, 0x12c));
    if (d) {
      const g = d["querySelector"]("[title=\x22" + b["username"] + "\x22]");
      console["log"]("chatScrollBox", g);
      if (g) g["click"]();
      else {
        if (b["type"] === "ai") {
          const h = document["querySelector"]("[data-qa-id=\x22qa-user-order-search\x22]");
          h &&
            ((h["value"] = b["username"]),
            h["dispatchEvent"](new Event("input", { bubbles: !![] })),
            setTimeout(() => {
              document["querySelectorAll"]("[data-qa-id=\x22qa-user-order-search-result-item\x22]")[
                "forEach"
              ]((i) => {
                const j = i["innerText"];
                if (j === b["username"]) {
                  i["firstChild"]["click"]();
                  return;
                }
              });
            }, 0x1f4));
        } else {
          await new Promise((j) => setTimeout(j, 0x12c));
          const i = document["querySelectorAll"](".auxo-dropdown-trigger");
          if (i) {
            const j = Array["from"](i)["find"]((k) => {
              const l = k["innerHTML"];
              return (
                (b["messageId"] && l["includes"](b["messageId"])) ||
                (b["userId"] && l["includes"]("用户" + b["userId"]))
              );
            });
            j && j["children"][0x0] && j["children"][0x0]["click"]();
          } else
            (console["log"]("发送消息\x20dy2", b),
              ipcRenderer["send"]("reply-customer-message", {
                messageId: b["messageId"],
                userId: b["userId"],
                compensate: !![],
                shopMsgTotal: getMsgTotal(),
                sendTarget: "dy2",
                platformType: "抖店",
              }));
        }
      }
    }
  }),
  safeIpcOn("change-shop-status", (a, b) => {
    (console["log"]("改变店铺状态为", b),
      window["postMessage"]({
        type: "update-status",
        status: b,
      }),
      setTimeout(() => {
        const c = document["querySelector"]("[alt=\x22下箭头\x22]");
        if (c) {
          const d = c?.["parentElement"];
          console["log"]("kindex");
          if (d) {
            const e = d?.["textContent"]?.["trim"]();
            console["log"]("statusText", e);
            const f = d["parentElement"]?.["parentElement"]?.["parentElement"];
            if (f)
              switch (b) {
                case "online":
                  e != "在线" &&
                    (f["click"](),
                    setTimeout(() => {
                      const g = document["querySelector"](".auxo-popover-inner-content");
                      if (g) {
                        const h = g["querySelector"]("[role=\x22button\x22]");
                        if (h) {
                          console["log"]("statusList", h);
                          const i = h["querySelectorAll"]("[role=\x22button\x22]");
                          console["log"]("online", i);
                          if (i) i[0x0]["click"]();
                        }
                      }
                    }, 0x3e8));
                  break;
                case "busy":
                  e != "忙碌" &&
                    (f["click"](),
                    setTimeout(() => {
                      const g = document["querySelector"](".auxo-popover-inner-content");
                      if (g) {
                        const h = g["querySelector"]("[role=\x22button\x22]");
                        if (h) {
                          console["log"]("statusList", h);
                          const i = h["querySelectorAll"]("[role=\x22button\x22]");
                          console["log"]("online", i);
                          if (i) i[0x1]["click"]();
                          setTimeout(() => {
                            const j = document["querySelector"](".auxo-btn.auxo-btn-primary");
                            if (j) j["click"]();
                          }, 0x3e8);
                        }
                      }
                    }, 0x3e8));
                  console["log"]("忙碌");
                  break;
                case "offline":
                  e != "下线" &&
                    (f["click"](),
                    setTimeout(() => {
                      const g = document["querySelector"](".auxo-popover-inner-content");
                      if (g) {
                        const h = g["querySelector"]("[role=\x22button\x22]");
                        if (h) {
                          console["log"]("statusList", h);
                          const i = h["querySelectorAll"]("[role=\x22button\x22]");
                          console["log"]("online", i);
                          if (i) i[0x2]["click"]();
                          setTimeout(() => {
                            const j = document["querySelector"](".auxo-btn.auxo-btn-primary");
                            if (j) j["click"]();
                          }, 0x3e8);
                        }
                      }
                    }, 0x3e8));
                  console["log"]("下线");
                  break;
              }
          }
        }
      }, 0x5 * 0x3e8));
  }));
function injectScript() {
  console["log"]("inject================");
  const a = async (u) => {
    const [v, w, x] = await Promise["all"]([
      fetch(
        "https://fxg.jinritemai.com/product/tproduct/list?page=0&pageSize=20&id_name_code=" +
          u +
          "&draft_status=0&comment_percent=&group_id=&sku_type=&tab=onSale&business_type=4&is_online=1&not_for_sale_search_type=1&from_mng=1&check_status=3&status=0&supply_status=&need_auto_rectify_info=true&need_pay_no_stock_skus=true&order_field=audit_time&sort=desc&appid=1",
        {
          method: "GET",
          credentials: "include",
        },
      )["then"]((C) => C["json"]()),
      fetch(
        "https://pigeon.jinritemai.com/backstage/workstation/get_skuinfo_list?PIGEON_BIZ_TYPE=2&product_id=" +
          u +
          "&security_user_id=&_pms=1",
        {
          method: "GET",
          credentials: "include",
        },
      )["then"]((C) => C["json"]()),
      fetch(
        "https://haohuo.jinritemai.com/aweme/v2/shop/promotion/pack/detail/?is_h5=1&origin_type=1337&_ts=" +
          Date["now"](),
        {
          mode: "cors",
          credentials: "include",
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "promotion_id=" + u + "&enter_from=&meta_param=&is_h5=1",
        },
      )["then"]((C) => C["json"]()),
    ]);
    console["log"]("sku\x20AND\x20detailRes============", v, w, x);
    let y = {},
      z = {},
      A = null;
    v["code"] == 0x0 &&
      v["data"]?.["length"] > 0x0 &&
      (A = v?.["data"][0x0]?.["category_name"]
        ?.["split"](">")
        ["map"]((C) => C["trim"]())
        ["join"]("/"));
    if (w["code"] == 0x0 && w?.["data"]?.["product_info"]) {
      const C = w?.["data"]?.["product_info"];
      (console["log"]("productInfo", C?.["product_name"]),
        (y["mainImage"] = C?.["img"]),
        (y["goodName"] = C?.["product_name"]),
        (y["goodId"] = C?.["product_id"]),
        (y["goodSku"] = C?.["spec_detail_info"]["map"](
          (D) => D["name"] + ":" + D["spec_details"]["map"]((E) => E["name"])["join"]("/"),
        )));
    }
    x?.["status_code"] == 0x0 &&
      (console["log"]("detailRes", x?.["detail_info"]["product_format"][0x0]),
      (z["goodProperties"] = x?.["detail_info"]?.["product_format"][0x0]?.["format"]["map"](
        (D) => D?.["name"] + ":" + D?.["message"][0x0]?.["desc"],
      )),
      (z["detailImages"] = x?.["detail_info"]?.["detail_imgs_new"]["map"](
        (D) => D?.["image"]?.["url_list"][0x0],
      )));
    const B = {
      ...y,
      ...z,
      goodCat: A,
    };
    return (console["log"]("good=======>", B), B);
  };
  class b {
    constructor(u, v) {
      Object["assign"](this, u);
      for (const w in v) {
        if (v[w]) {
          const x = this[w];
          (x === "" || x === null || x === undefined) && (this[w] = v[w]);
        }
      }
    }
  }
  class c {
    constructor() {
      ((this["db"] = null),
        (this["initPromise"] = null),
        (this["DB_NAME"] = "userByOrderInfo"),
        (this["STORE_NAME"] = "value"),
        (this["VERSION"] = 0x1));
    }
    async ["init"]() {
      if (this["initPromise"]) return this["initPromise"];
      return (
        (this["initPromise"] = (async () => {
          if (this["db"]) return this["db"];
          return (
            (this["db"] = await new Promise((u, v) => {
              const w = indexedDB["open"](this["DB_NAME"], this["VERSION"]);
              ((w["onupgradeneeded"] = (x) => {
                const y = x["target"]["result"];
                !y["objectStoreNames"]["contains"](this["STORE_NAME"]) &&
                  y["createObjectStore"](this["STORE_NAME"], { keyPath: "id" });
              }),
                (w["onsuccess"] = () => {
                  const x = w["result"];
                  ((x["onversionchange"] = () => {
                    (x["close"](), (this["db"] = null), (this["initPromise"] = null));
                  }),
                    u(x));
                }),
                (w["onerror"] = () => v(w["error"])),
                (w["onblocked"] = () => v(new Error("indexedDB\x20blocked"))));
            })),
            this["db"]
          );
        })()["catch"]((u) => {
          ((this["initPromise"] = null), (this["db"] = null));
          throw u;
        })),
        this["initPromise"]
      );
    }
    async ["save"](u) {
      const v = await this["init"]();
      return new Promise((w, x) => {
        const y = v["transaction"](this["STORE_NAME"], "readwrite"),
          z = y["objectStore"](this["STORE_NAME"]),
          A = z["put"](u);
        ((A["onsuccess"] = () => w(!![])), (A["onerror"] = () => x(A["error"])));
      });
    }
    async ["get"](u) {
      const v = await this["init"]();
      return new Promise((w, x) => {
        const y = v["transaction"](this["STORE_NAME"], "readonly"),
          z = y["objectStore"](this["STORE_NAME"]),
          A = z["get"](u);
        ((A["onsuccess"] = () => w(A["result"] || null)), (A["onerror"] = () => x(A["error"])));
      });
    }
    async ["getAll"]() {
      const u = await this["init"]();
      return new Promise((v, w) => {
        const x = u["transaction"](this["STORE_NAME"], "readonly"),
          y = x["objectStore"](this["STORE_NAME"]),
          z = y["getAll"]();
        ((z["onsuccess"] = () => v(z["result"] || [])), (z["onerror"] = () => w(z["error"])));
      });
    }
    async ["delete"](u) {
      const v = await this["init"]();
      return new Promise((w, x) => {
        const y = v["transaction"](this["STORE_NAME"], "readwrite"),
          z = y["objectStore"](this["STORE_NAME"]),
          A = z["delete"](u);
        ((A["onsuccess"] = () => w(!![])), (A["onerror"] = () => x(A["error"])));
      });
    }
  }
  let d = {},
    e = new Map();
  (window["context_bridge"]["on"]("create-workorder", async (u, v) => {
    console["log"]("接收获取工单信息");
    const w = document["querySelector"]("[data-qa-id=\x22qa-send-message-textarea\x22]");
    if (!w) {
      console["error"]("未找到用户id");
      return;
    }
    const x = w["classList"]["value"]["split"]("inputArea_")[0x1]["split"]("\x20")[0x0];
    (console["log"]("userId", x),
      x &&
        fetch(
          "https://pigeon.jinritemai.com/backstage/cmpoent/order/query?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&device_platform=web&FUSION=true",
          {
            mode: "cors",
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON["stringify"]({
              biz_type: 0x2,
              is_init_tab: 0x0,
              open_params: {},
              page_no: 0x0,
              page_size: 0x5,
              search_words: "",
              tab_type: 0x0,
              security_user_id: x,
              service_entity_id: "",
              version: "1.0",
              workstation_opt_gray: !![],
              workstation_opt_version: "v2",
            }),
          },
        )
          ["then"]((y) => y["json"]())
          ["then"]((y) => {
            console["log"]("data", y);
            const z = y["data"]["map"]((A) => {
              return {
                orderId: A["order_id"],
                type: A["aftersale_sum_status_desc"],
                orderName: A["sku_order_list"][0x0]["product_name"],
                sku: A["sku_order_list"][0x0]["sku_space_text"],
                name: A["post_receiver"] + "," + A["mobile"],
                address:
                  A["post_address"]["province"]["name"] +
                  A["post_address"]["city"]["name"] +
                  A["post_address"]["town"]["name"] +
                  A["post_address"]["street"]["name"],
                expressCompany: A["logistics_info"]["express_company"],
                trackingNumber: A["logistics_info"]["tracking_no"],
                expanded: !![],
              };
            });
            window["context_bridge"]["send"]("get-create-workorder", z);
          }));
  }),
    window["context_bridge"]["on"]("get-goods-detail", async (u, v) => {
      console["log"]("开始获取商品信息...", v);
      try {
        const w = v["ids"]["map"](async (y) => {
            const z = await a(y),
              A = {
                ...z,
                aiTaskId: v["aiTaskId"],
                id: v["id"],
                type: v["type"],
              };
            return (console["log"]("params", A), A);
          }),
          x = (await Promise["all"](w))["filter"](Boolean);
        (console["log"]("paramsArray", x), window["context_bridge"]["send"]("get-goods-detail", x));
      } catch (y) {
        (console["error"]("获取商品信息时发生错误:", y),
          ipcRenderer["send"]("upload-server-log", {
            type: "error",
            message: "抖店获取商品信息时发生错误",
          }),
          window["context_bridge"]["send"]("get-goods-url", {
            data: [],
            count: 0x0,
            error: y["message"] || "网络请求失败",
          }));
      }
    }),
    window["context_bridge"]["on"]("get-goods-all-detail", async (u, v) => {
      try {
        console["log"]("开始获取全部商品信息...", v);
        const w = await fetch(
            "https://pigeon.jinritemai.com/backstage/workstation/get_product_list?busy=1&_ts=" +
              Date["now"]() +
              "&biz_type=4&_pms=1",
            {
              mode: "cors",
              credentials: "include",
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON["stringify"]({
                search_words: "",
                biz_type: 0x4,
                business_type: 0x4,
                check_status: 0x3,
                hot_style: 0x0,
                is_channel: 0x0,
                page_no: 0x0,
                page_size: 0x14,
                presale_biz_scene: "b_product_list",
                status: 0x0,
                user_id: "",
              }),
            },
          )["then"]((D) => D["json"]()),
          x = w;
        if (x["code"] == -0x1) return null;
        const y = x["total"];
        (window["context_bridge"]["send"]("get-goods-all-detail-total", {
          userId: v["userId"],
          total: y,
        }),
          console["log"]("总共有\x20" + y + "\x20个商品"));
        const z = 0x14,
          A = Math["ceil"](y / z);
        console["log"]("需要请求\x20" + A + "\x20页");
        if (x["data"]) {
          const D = A === 0x1;
          await B(x["data"], 0x1, v, D);
        }
        for (let E = 0x2; E <= A; E++) {
          try {
            const F = await fetch(
                "https://pigeon.jinritemai.com/backstage/workstation/get_product_list?busy=1&_ts=" +
                  Date["now"]() +
                  "&biz_type=4&_pms=1",
                {
                  mode: "cors",
                  credentials: "include",
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON["stringify"]({
                    biz_type: 0x4,
                    business_type: 0x4,
                    check_status: 0x3,
                    hot_style: 0x0,
                    is_channel: 0x0,
                    page_no: E - 0x1,
                    page_size: 0x14,
                    presale_biz_scene: "b_product_list",
                    search_words: "",
                    status: 0x0,
                    user_id: "",
                  }),
                },
              ),
              G = await F["json"]();
            if (G["data"]) {
              const H = E === A;
              await B(G["data"], E, v, H);
            }
            await new Promise((I) => setTimeout(I, 0x64));
          } catch (I) {
            (ipcRenderer["send"]("upload-server-log", {
              type: "error",
              message: "抖店获取第\x20" + E + "\x20页商品列表失败:" + I,
            }),
              console["error"]("获取第\x20" + E + "\x20页商品列表失败:", I));
          }
        }
        console["log"]("所有商品详情获取完成");
        async function B(J, K, L, M = ![]) {
          try {
            const N = [];
            for (let O = 0x0; O < J["length"]; O++) {
              const P = J[O],
                Q = P["product_item"]["product_id"],
                R = await C(Q, L, M);
              (R && (console["log"]("商品\x20单个抓取完成"), N["push"](R)),
                O < J["length"] - 0x1 && (await new Promise((S) => setTimeout(S, 0x1388))));
            }
            (N["length"] > 0x0 && window["context_bridge"]["send"]("get-goods-detail", N),
              await new Promise((S) => setTimeout(S, 0x3e8)));
          } catch (S) {
            ipcRenderer["send"]("upload-server-log", {
              type: "error",
              message: "抖店处理第\x20" + K + "\x20页时出错:" + S,
            });
          }
        }
        async function C(J, K, L = ![]) {
          try {
            const M = await a(J);
            console["log"]("good======", M);
            const N = {
              ...M,
              type: K["type"],
              id: K["id"],
            };
            return (L && (N["aiTaskId"] = K["aiTaskId"]), console["log"]("result=====", N), N);
          } catch (O) {
            return (
              console["error"](
                "处理商品\x20" + item["product_item"]["product_id"] + "\x20时出错:",
                O,
              ),
              ipcRenderer["send"]("upload-server-log", {
                type: "error",
                message:
                  "抖店处理商品\x20" + item["product_item"]["product_id"] + "\x20时出错:" + O,
              }),
              null
            );
          }
        }
      } catch (J) {
        (console["error"]("获取全部商品详情时出错:", J),
          ipcRenderer["send"]("upload-server-log", {
            type: "error",
            message: "抖店获取全部商品详情时出错:" + J,
          }));
      }
    }),
    window["context_bridge"]["on"]("init-goods", (u, v) => {
      fetch(
        "https://pigeon.jinritemai.com/backstage/workstation/get_product_list?busy=1&_ts=" +
          Date["now"]() +
          "&biz_type=4&_pms=1",
        {
          mode: "cors",
          credentials: "include",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON["stringify"]({
            search_words: "",
            biz_type: 0x4,
            business_type: 0x4,
            check_status: 0x3,
            hot_style: 0x0,
            is_channel: 0x0,
            page_no: 0x0,
            page_size: 0x14,
            presale_biz_scene: "b_product_list",
            search_words: "",
            status: 0x0,
            user_id: "",
          }),
        },
      )
        ["then"]((w) => w["json"]())
        ["then"]((w) => {
          const x = w["data"]["map"]((y) => ({
            name: y["product_item"]["product_base_info"]["title"],
            id: y["product_item"]["product_id"],
            url: y["product_item"]["product_base_info"]["main_img"],
          }));
          window["context_bridge"]["send"]("init-goods", x);
        });
    }),
    window["context_bridge"]["on"]("init-shop-info", (u, v) => {
      fetch(
        "https://pigeon.jinritemai.com/backstage/workstation/get_product_list?busy=1&_ts=" +
          Date["now"]() +
          "&biz_type=4&_pms=1",
        {
          mode: "cors",
          credentials: "include",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON["stringify"]({
            search_words: "",
            biz_type: 0x4,
            business_type: 0x4,
            check_status: 0x3,
            hot_style: 0x0,
            is_channel: 0x0,
            page_no: 0x0,
            page_size: 0x14,
            presale_biz_scene: "b_product_list",
            search_words: "",
            status: 0x0,
            user_id: "",
          }),
        },
      )
        ["then"]((w) => w["json"]())
        ["then"]((w) => {
          if (w["data"] && w["data"]["length"] > 0x0) {
            const x = w["data"][0x0];
            if (x) {
              const y = {
                shopClass:
                  x["product_item"]["product_base_info"]["new_category_detail_"]["first_cname"],
                goodName: x["product_item"]["product_base_info"]["title"],
              };
              window["context_bridge"]["send"]("init-shop-info", y);
            }
          }
        });
    }));
  let f = ![];
  function g() {
    if (f) return;
    try {
      const u = new MouseEvent("mousemove", {
        view: window,
        bubbles: !![],
        cancelable: !![],
        clientX: Math["floor"](Math["random"]() * 0x64),
        clientY: Math["floor"](Math["random"]() * 0x64),
      });
      document["dispatchEvent"](u);
      const v = window["scrollY"];
      (window["scrollTo"](0x0, v + 0x1), setTimeout(() => window["scrollTo"](0x0, v), 0x12c));
    } catch (w) {
      console["error"]("保持页面活跃失败", w);
    }
    setTimeout(g, 0x2710);
  }
  g();
  let h = null,
    i = null;
  function j(u = 0x3e8) {
    const v = "buyerInfo",
      w = "keyvaluepairs";
    return new Promise((x, y) => {
      setTimeout(() => {
        const z = indexedDB["open"](v);
        ((z["onerror"] = () => y(z["error"])),
          (z["onsuccess"] = () => {
            const A = z["result"],
              B = A["transaction"](w, "readonly"),
              C = B["objectStore"](w),
              D = C["openCursor"]();
            ((D["onsuccess"] = (E) => {
              const F = E["target"]["result"];
              (F
                ? x({
                    key: F["key"],
                    value: F["value"],
                  })
                : x(undefined),
                A["close"]());
            }),
              (D["onerror"] = () => y(D["error"])));
          }));
      }, u);
    });
  }
  function k() {
    return Math["random"]() * 0x28 * 0x3e8;
  }
  function l(u) {
    h = u;
    if (i) {
      console["log"]("[质检]\x20数据已缓存，等待发送");
      return;
    }
    const v = k();
    (console["log"]("[质检]\x20将在", Math["round"](v / 0x3e8), "秒后发送质检数据"),
      (i = setTimeout(() => {
        (h &&
          (console["log"]("[质检]\x20发送质检数据:", h),
          window["context_bridge"]["send"]("get-quality-testing", h)),
          (h = null),
          (i = null));
      }, v)));
  }
  window["addEventListener"]("message", async function (u) {
    if (u["source"] !== window) return;
    if (u["data"]["type"] === "update-status") {
      console["info"]("页面上下文：更新状态", u["data"]["status"]);
      if (u["data"]["status"] == "offline")
        fetch(
          "https://pigeon.jinritemai.com/backstage/uponlineservice?_ts=" +
            Date["now"]() +
            "&biz_type=4&_pms=1",
          {
            mode: "cors",
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON["stringify"]({
              status: 0x2,
              cid: 0x6861afe3e5cd6000,
              cid_str: "7521486246033317376",
            }),
          },
        )
          ["then"]((v) => v["json"]())
          ["then"]((v) => {
            (console["info"]("res", v),
              window["context_bridge"]["send"]("shop-status-change", { status: "离线" }));
          });
      else
        u["data"]["status"] == "online"
          ? fetch(
              "https://pigeon.jinritemai.com/backstage/uponlineservice?biz_type=4&PIGEON_BIZ_TYPE=2&_ts=" +
                Date["now"]() +
                "&_pms=1&FUSION=true",
              {
                mode: "cors",
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON["stringify"]({ status: 0x1 }),
              },
            )
              ["then"]((v) => v["json"]())
              ["then"]((v) => {
                (console["info"]("res", v),
                  window["context_bridge"]["send"]("shop-status-change", { status: "在线" }));
              })
          : fetch(
              "https://pigeon.jinritemai.com/backstage/uponlineservice?biz_type=4&PIGEON_BIZ_TYPE=2&_ts=" +
                Date["now"]() +
                "&_pms=1&FUSION=true",
              {
                mode: "cors",
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON["stringify"]({ status: 0x0 }),
              },
            )
              ["then"]((v) => v["json"]())
              ["then"]((v) => {
                (console["info"]("res", v),
                  window["context_bridge"]["send"]("shop-status-change", { status: "忙碌" }));
              });
    } else {
      if (u["data"]["type"] === "SET_AI_REPLY_INFO") {
        const {
          messageId: v,
          userId: w,
          isAiAutoReply: x,
          isBottomLineAutoReply: y,
          isReminderReply: z,
          isAiInviteReply: A,
        } = u["data"]["data"];
        console["log"]("页面上下文：AI\x20回复计数\x20+1", typeof v, v);
        const B = e["get"](v) || {
          count: 0x0,
          messageId: v,
          userId: w,
          isAiAutoReply: x,
          isBottomLineAutoReply: y,
          isReminderReply: z,
          isAiInviteReply: A,
          timestamp: Date["now"](),
        };
        (B["count"]++, e["set"](v, B), console["log"]("存入成功====", e, typeof v, B));
      } else {
        if (u["data"]["type"] === "CLEAR_AI_REPLY_INFO") {
          const C = u["data"]["data"]?.["messageId"];
          console["log"]("页面上下文：AI\x20回复计数\x20-1", C);
          if (C) {
            const D = e["get"](C);
            D &&
              ((D["count"] -= 0x1),
              D["count"] <= 0x0
                ? console["log"](
                    "页面上下文：用户\x20${messageId}\x20所有\x20AI\x20回复已完成，删除记录",
                    C,
                  )
                : console["log"]("页面上下文CUN", D));
          }
        } else {
          if (u["data"]["type"] == "send-reminder") {
            const E = u["data"]["value"]["userId"];
            fetch(
              "https://pigeon.jinritemai.com/backstage/workstation/get_product_list?biz_type=4&PIGEON_BIZ_TYPE=2&_ts=" +
                Date["now"]() +
                "&_pms=1&FUSION=true",
              {
                mode: "cors",
                credentials: "include",
                method: "POST",
                headers: { "Content-Type": "application/json;charset=UTF-8" },
                body: JSON["stringify"]({
                  app_id: 0x468,
                  user_id: E,
                  page_no: 0x0,
                  page_size: 0x1,
                  presale_biz_scene: "b_user_footprint",
                }),
              },
            )
              ["then"]((F) => F["json"]())
              ["then"]((F) => {
                const { data: G } = F;
                if (G["length"] > 0x0) {
                  const H =
                    G[0x0]["product_id"] ||
                    (G[0x0]["product_item"] && G[0x0]["product_item"]["product_id"]) ||
                    "";
                  fetch(
                    "https://pigeon.jinritemai.com/backstage/workstation/order_create_care?biz_type=4&PIGEON_BIZ_TYPE=2&_ts=" +
                      Date["now"]() +
                      "&_pms=1&FUSION=true",
                    {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json;charset=UTF-8" },
                      body: JSON["stringify"]({
                        product_id: H,
                        user_id: E,
                        source: "goods_view",
                        sku_id: "",
                        sku_num: 0x1,
                        content: "您看中的商品享受7天无理由退货，早买早发货，赶快下单迎接宝贝吧~",
                      }),
                    },
                  )
                    ["then"]((I) => I["json"]())
                    ["then"]((I) => {
                      console["log"]("res======", I);
                    });
                }
              });
          } else {
            if (u["data"]["type"] == "get-user-order") {
              const F = u["data"]["data"]?.["userId"],
                G = u["data"]["data"]?.["orderId"],
                H = await fetch(
                  "https://pigeon.jinritemai.com/backstage/cmpoent/order/query?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&FUSION=true&_ts=" +
                    Date["now"](),
                  {
                    method: "POST",
                    mode: "cors",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON["stringify"]({
                      security_user_id: F,
                      page_no: 0x0,
                      page_size: 0x5,
                      tab_type: 0x0,
                      search_words: "",
                      is_init_tab: 0x0,
                      biz_type: 0x2,
                      version: "1.0",
                      open_params: {},
                      workstation_opt_version: "v2",
                      service_entity_id: "",
                      order_id: G,
                      workstation_opt_gray: !![],
                    }),
                  },
                )["then"]((L) => L["json"]());
              console["log"]("获取商品\x20==\x20===\x20res", H);
              let I = null,
                J = null,
                K = null;
              if (H["code"] === 0x0 && H["data"] && H["data"]["length"] > 0x0)
                ((I =
                  H["data"][0x0]["order_status_desc"] +
                  H["data"][0x0]["aftersale_sum_status_desc"]),
                  (J = H["data"][0x0]["order_id"]),
                  (K = H["data"][0x0]?.["sku_order_list"][0x0]?.["product_id"]));
              else
                H["code"] === 0x0 &&
                  (!H["data"] || H["data"]["length"] === 0x0) &&
                  (I = "暂无订单");
              window["parent"]["postMessage"](
                {
                  type: "get-user-order-result",
                  data: {
                    userId: F,
                    orderStatus: I,
                    orderId: J,
                    goodId: K,
                  },
                },
                "*",
              );
            } else {
              if (u["data"]["type"] == "test-goodId") {
                const L = await fetch(
                    "https://haohuo.jinritemai.com/aweme/v2/shop/promotion/pack/detail/?is_h5=1&origin_type=1337&_ts=" +
                      Date["now"](),
                    {
                      mode: "cors",
                      credentials: "include",
                      method: "POST",
                      headers: { "Content-Type": "application/x-www-form-urlencoded" },
                      body:
                        "promotion_id=" + 0x3430f8a38e020200 + "&enter_from=&meta_param=&is_h5=1",
                    },
                  ),
                  M = await L["json"]();
                console["log"]("detail???????", M);
              } else {
                if (u["data"]["type"] == "get-good-info") {
                  console["log"]("get-good-info", u["data"]);
                  const N = u?.["data"]?.["goodId"];
                  if (!N) return;
                  const O = await a(N);
                  (window["postMessage"]({
                    type: "get-good-info-cb",
                    data: O,
                  }),
                    console["log"]("good=====>", O));
                }
              }
            }
          }
        }
      }
    }
  });
  let m = ![];
  function n() {
    if (m) return;
    try {
      const u = Date["now"](),
        v = 0x2710,
        w = e;
      if (!w || w["size"] === 0x0) {
        o(0x1f40);
        return;
      }
      for (const [x, y] of w) {
        if (!y || !y["timestamp"]) {
          w["delete"](x);
          continue;
        }
        u - y["timestamp"] > v &&
          (console["log"]("页面上下文：清理过期的\x20AI\x20回复标记:", x), w["delete"](x));
      }
    } catch (z) {
      console["error"]("cleanupAiReplyCountMap\x20error:", z);
    }
    o(0x1388);
  }
  function o(u) {
    setTimeout(n, u);
  }
  function p() {
    const u = document["querySelector"]("[data-btm=\x22message_group_name_waitReply\x22]"),
      v = document["querySelector"]("[data-btm=\x22message_group_name_overThreemins\x22]");
    let w = 0x0,
      x = 0x0;
    return (u && (w = q(u)), v && (x = q(v)), x + w);
  }
  function q(u) {
    const v = u["parentElement"];
    if (v) {
      const w = v["textContent"]["match"](/\((\d+)\)/);
      if (w) return Number(w[0x1]);
    }
    return 0x0;
  }
  n();
  const r = XMLHttpRequest["prototype"]["open"],
    s = XMLHttpRequest["prototype"]["send"];
  XMLHttpRequest["prototype"]["open"] = function (u, v) {
    ((this["_method"] = u), (this["_url"] = v));
    if (v["includes"]("get_current_conversation_list")) console["log"]("url=========", u, v);
    r["apply"](this, arguments);
  };
  const t = new WeakMap();
  XMLHttpRequest["prototype"]["send"] = function (u) {
    const v =
      (this["_method"] === "POST" &&
        this["_url"]["startsWith"](
          "https://doudian-sso.jinritemai.com/passport/sso/account_login/v2",
        )) ||
      (this["_method"] === "GET" &&
        this["_url"]["startsWith"]("https://pigeon.jinritemai.com/backstage/currentuser")) ||
      (this["_method"] === "GET" &&
        this["_url"]["startsWith"](
          "https://pigeon.jinritemai.com/backstage/data/conversationAreaRealtimeData",
        )) ||
      (this["_method"] === "POST" &&
        this["_url"]["startsWith"](
          "https://pigeon.jinritemai.com/backstage/robot/assistant/answerRecommend",
        )) ||
      (this["_method"] === "POST" &&
        this["_url"]["startsWith"](
          "https://pigeon.jinritemai.com/backstage/getTemplateCardDataV2",
        )) ||
      (this["_method"] === "POST" &&
        this["_url"]["startsWith"]("https://pigeon.jinritemai.com/backstage/uponlineservice")) ||
      (this["_method"] === "GET" && this["_url"]["includes"]("get_current_conversation_list"));
    if (v) {
      const w = t["get"](this);
      w &&
        (console["log"]("移除已存在的监听器"),
        this["removeEventListener"]("load", w),
        t["delete"](this));
      const x = this["_method"],
        y = this["_url"],
        z = async function () {
          function A(B, C, D, E) {
            console["log"]("is_subscribe", D, E);
            const F = D && D["count"] > 0x0,
              G = {
                messageId: B,
                userId: B,
                content: C,
                isAiAutoReply: F && D?.["isAiAutoReply"],
                isBottomLineAutoReply: F && D?.["isBottomLineAutoReply"],
                isReminderReply: F && D?.["isReminderReply"],
                isAiInviteReply: F && D?.["isAiInviteReply"],
              };
            (E == 0x1
              ? window["context_bridge"]["send"]("get-customer-callback-result", G)
              : (console["log"]("\x20走删除\x20人工回复", G),
                (G["sendTarget"] = "dy3"),
                (G["shopMsgTotal"] = p() || 0x0),
                (G["platformType"] = "抖店"),
                console["log"]("发送消息\x20dy3", G),
                window["context_bridge"]["send"]("reply-customer-message", G)),
              console["log"]("CLEAR_AI_REPLY_INFO删除回复标记"),
              window["postMessage"](
                {
                  type: "CLEAR_AI_REPLY_INFO",
                  data: { messageId: B },
                },
                "*",
              ));
          }
          try {
            if (x === "GET" && y["includes"]("/backstage/onlineservice")) {
              const { code: B, data: C } = JSON["parse"](this["response"]);
              (console["log"]("在线状态=======", B),
                B === 0x0 &&
                  C["forEach"]((D) => {
                    if (D["service_toutiao_id_str"] === d["kf"]) {
                      let E = "";
                      switch (D["online_status"]) {
                        case 0x0:
                          E = "忙碌";
                          break;
                        case 0x1:
                          E = "在线";
                          break;
                        case 0x2:
                          E = "离线";
                          break;
                      }
                      window["context_bridge"]["send"]("shop-status-change", { status: E });
                    }
                  }));
            } else {
              if (x === "POST" && y["includes"]("backstage/uponlineservice")) {
                const D = JSON["parse"](u);
                console["log"]("data", JSON["parse"](u));
                if (D) {
                  let E = "";
                  switch (D["status"]) {
                    case 0x0:
                      E = "忙碌";
                      break;
                    case 0x1:
                      E = "在线";
                      break;
                    case 0x2:
                      E = "离线";
                      break;
                  }
                  window["context_bridge"]["send"]("shop-status-change", { status: E });
                }
              } else {
                if (
                  x === "GET" &&
                  y["startsWith"](
                    "https://pigeon.jinritemai.com/backstage/data/conversationAreaRealtimeData",
                  )
                ) {
                  const { code: F, data: G } = JSON["parse"](this["response"]);
                  if (F === 0x0) {
                    const {
                        tradeCompound: H,
                        laborUserAmount: I,
                        threeMinResponseConRate: J,
                        avgResponseDuration: K,
                        dissatisfactionRate: L,
                      } = G,
                      M = H["amount"]["split"]("/"),
                      N = parseInt(M[0x0], 0xa),
                      O = parseInt(M[0x1], 0xa);
                    let P = 0x0;
                    (O > 0x0 && (P = (N / O) * 0x64),
                      l({
                        inquiryCount: I["amount"] + "人",
                        responseRateWithinThreeMin: J["amount"],
                        averageRate: K["amount"],
                        dissatisfiedRate: L["amount"],
                        recoverRate: P["toFixed"](0x2) + "%",
                      }));
                  }
                } else {
                  if (x === "POST" && y["includes"]("backstage/robot/assistant/answerRecommend"))
                    try {
                      const Q = JSON["parse"](u);
                      if (Q["msg_body_list"]["length"] > 0x0) {
                        if (Q["msg_body_list"][0x0]["sender_role"] === "2") {
                          const R = Q["msg_body_list"][0x0]["content"] || "",
                            S = Q?.["uid"] || Q?.["security_uid"];
                          (console["log"]("发送消息\x20dy4", Q, S, R),
                            window["context_bridge"]["send"]("reply-customer-message", {
                              messageId: S,
                              userId: S,
                              content: R,
                              platformType: "抖店",
                              sendTarget: "dy4",
                              compensate: !![],
                            }));
                        }
                      }
                    } catch (T) {
                      (typeof u === "string" && (replyContent = u),
                        console["error"]("解析客服发送内容失败:", T));
                    }
                  else {
                    if (x === "POST" && y["includes"]("/backstage/getTemplateCardDataV2")) {
                      const { code: U, data: V } = JSON["parse"](this["response"]);
                      if (U === 0x0) {
                        const W = await fetch(
                          "https://pigeon.jinritemai.com/backstage/getuserinfo?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&FUSION=true&_v=1.0.1.1852&uids=" +
                            V["uid"] +
                            "&_ts=" +
                            Date["now"](),
                          {
                            mode: "cors",
                            credentials: "include",
                          },
                        )["then"]((X) => X["json"]());
                        W &&
                          W["data"] &&
                          W["data"]["length"] > 0x0 &&
                          window["context_bridge"]["send"]("update-customer-message-order", {
                            messageId: W["data"][0x0]["screen_name"],
                            istihuan: !![],
                            orderStatus: V["tag_content"],
                          });
                      }
                    } else {
                      if (x === "POST" && y["includes"]("backstage/cmpoent/order/query")) {
                        const { code: X, data: Y } = JSON["parse"](this["response"]),
                          Z = document["querySelector"](
                            "[data-btm-id=\x22a9034.b39122.c0467.d4350\x22]",
                          );
                        if (X === 0x0 && Y && Y["length"] > 0x0) {
                          const a0 = Y[0x0]["pay_time_sec"],
                            a1 = new Date(a0 * 0x3e8),
                            a2 = new Date(),
                            a3 = Math["abs"](a2 - a1),
                            a4 = Math["ceil"](a3 / (0x3e8 * 0x3c * 0x3c * 0x18));
                          let a5 = null;
                          a4 > 0x1e
                            ? (a5 = "暂无订单")
                            : (a5 =
                                Y[0x0]["order_status_desc"] + Y[0x0]["aftersale_sum_status_desc"]);
                          if (Z) {
                            const a6 = {
                              messageId: Z["textContent"],
                              orderStatus: a5,
                            };
                            (console["log"]("[订单拦截]\x20发送订单状态:", a6),
                              window["postMessage"](
                                {
                                  type: "order_status",
                                  data: a6,
                                },
                                "*",
                              ));
                          }
                        } else {
                          if (X === 0x0 && (!Y || Y["length"] === 0x0)) {
                            if (Z) {
                              const a7 = {
                                messageId: Z["textContent"],
                                orderStatus: "暂无订单",
                              };
                              (console["log"]("[订单拦截]\x20无订单数据:", a7),
                                window["postMessage"](
                                  {
                                    type: "order_status",
                                    data: a7,
                                  },
                                  "*",
                                ));
                            }
                          }
                        }
                      } else {
                        if (x === "GET" && y["includes"]("backstage/currentuser")) {
                          const a8 = JSON["parse"](this["response"]),
                            { code: a9, data: aa } = a8;
                          if (a9 === 0x0)
                            ((d = {
                              id: aa?.["ShopId"]["toString"](),
                              name: aa?.["ShopName"],
                              logo: aa?.["ShopLogo"],
                              username: aa?.["CustomerServiceInfo"]?.["screen_name"],
                              kf: aa["CustomerServiceInfo"]["id"],
                            }),
                              window["context_bridge"]["send"]("get-shop-info", d),
                              window["postMessage"]({
                                type: "shop-info",
                                data: d,
                              }));
                          else
                            a8?.["msg"] === "登录过期，请重新登录" &&
                              window["context_bridge"]["send"]("account-login-expired");
                        } else {
                          if (
                            x === "POST" &&
                            y["includes"](
                              "https://doudian-sso.jinritemai.com/passport/sso/account_login/v2/",
                            )
                          ) {
                            const ab = JSON["parse"](this["response"]);
                            (console["log"]("登录结果:", ab),
                              ab?.["error_code"] != 0x0 &&
                                window["context_bridge"]["send"]("account-login-expired"));
                          } else {
                            if (x === "GET" && y["includes"]("get_current_conversation_list"))
                              try {
                                const ac = JSON["parse"](this["response"]);
                                if (ac["data"] && ac["data"]["length"] > 0x0) {
                                  let ad = [];
                                  for (let ae of ac["data"]) {
                                    const { countdown: af, countdown_time: ag } =
                                      ae["coreInfoMap"] || {};
                                    if (af === "true") {
                                      let ah = {
                                        userId: "",
                                        messageId: "",
                                        username: "",
                                        isTimeout: ![],
                                        timeNote: "",
                                        content: "",
                                        avatar: "",
                                        timeout: parseInt(ag || 0x0) + 0xb4,
                                      };
                                      const ai = ae["msgList"]
                                        ? ae["msgList"]
                                            ["filter"]((aj) => {
                                              return (
                                                aj["messageBody"]?.["ext"]?.[
                                                  "s:sender_biz_role"
                                                ] === "Buyer" &&
                                                aj["messageBody"]?.["ext"]?.["attention"] ===
                                                  "true" &&
                                                !aj["messageBody"]?.["content"]?.["endsWith"](
                                                  "接入",
                                                )
                                              );
                                            })
                                            ["sort"]((aj, ak) => {
                                              return (
                                                parseInt(ak["messageBody"]["createTime"] || 0x0) -
                                                parseInt(aj["messageBody"]["createTime"] || 0x0)
                                              );
                                            })
                                        : [];
                                      for (let aj of ai) {
                                        const { uname: ak } = aj["messageBody"]?.["ext"] || {};
                                        if (ak) {
                                          ah["username"] = ak;
                                          break;
                                        }
                                      }
                                      if (ai["length"] > 0x0) {
                                        const al = ai[0x0];
                                        try {
                                          const { key: am } = await j(),
                                            an = /^\d+$/["test"](am || "");
                                          ((ah["userId"] = an
                                            ? al["messageBody"]["sender"]
                                            : al["messageBody"]?.["securitySender"]),
                                            (ah["messageId"] = ah["userId"]),
                                            (ah["content"] = al["messageBody"]?.["content"] || ""),
                                            (ah["api"] = !![]));
                                          !ah["username"] && (ah["username"] = ah["userId"]);
                                          if (!ah["messageId"]) continue;
                                          if (ah["content"]?.["endsWith"]("接入")) continue;
                                          ((ah["source"] = ah["source"] || "url"), ad["push"](ah));
                                        } catch (ao) {
                                          (console["log"]("inner\x20error:", ao),
                                            ah["userId"] &&
                                              ((ah["username"] = ah["username"] || ah["userId"]),
                                              (ah["messageId"] = ah["messageId"] || ah["userId"]),
                                              (ah["source"] = "fallback"),
                                              ad["push"](ah)));
                                        }
                                      }
                                    }
                                  }
                                  console["log"]("unReplyMessageList", ad);
                                  try {
                                    ad["length"] > 0x0 &&
                                      window["context_bridge"]["send"](
                                        "get-customer-message-list",
                                        ad,
                                      );
                                  } catch (ap) {
                                    console["log"]("IPC\x20send\x20failed:", ap);
                                  }
                                }
                              } catch (aq) {
                                console["log"]("parse\x20error:", aq);
                              }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            (this["removeEventListener"]("load", t["get"](this)), t["delete"](this));
          } catch (ar) {
            console["error"]("XHR监听器处理出错:", ar);
          }
        };
      (t["set"](this, z), this["addEventListener"]("load", z));
    }
    s["apply"](this, arguments);
  };
}
(safeIpcOn("star", () => {
  const a = document["querySelector"]("[data-btm-id=\x22a9034.b39122.c0467.d6168\x22]")[
    "querySelector"
  ]("span");
  a && a["click"]();
}),
  safeIpcOn("get-cookie", () => {
    fetch("https://pigeon.jinritemai.com/backstage/token", {
      mode: "cors",
      credentials: "include",
    })
      ["then"]((a) => a["json"]())
      ["then"]((a) => {});
  }));
let isProcessingReply = ![];
async function waitForTextareaClear(a, b = 0xbb8) {
  const c = Date["now"]();
  while (Date["now"]() - c < b) {
    if (a["value"] === "") return !![];
    await delay(0xc8);
  }
  return ![];
}
async function sendMessageToDoudian(a) {
  const b = document["querySelector"]("[data-qa-id=\x22qa-send-message-textarea\x22]");
  if (!b) {
    console["log"]("未找到输入框");
    return;
  }
  ((b["value"] = a["replyContent"]),
    b["dispatchEvent"](new Event("input", { bubbles: !![] })),
    await delay(0xc8));
  const c = document["querySelector"]("[data-qa-id=\x22qa-send-message-button\x22]");
  c
    ? c["click"]()
    : (b["dispatchEvent"](
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: !![],
        }),
      ),
      b["dispatchEvent"](
        new KeyboardEvent("keyup", {
          key: "Enter",
          bubbles: !![],
        }),
      ));
}
function getCustomerId() {
  const a = document["querySelector"]("textarea[data-qa-id=\x22qa-send-message-textarea\x22]"),
    b = a?.["className"]?.["match"](/inputArea_(\d+)/);
  return b ? b[0x1] : "";
}
async function handleReplyMessageForDoudian(a) {
  console["log"]("开始处理消息:", a);
  const b = document["querySelector"]("[data-qa-id=\x22qa-chat-tab\x22]");
  if (b) b["click"]();
  else {
    const e = document["querySelector"]("[class=\x22auxo-badge\x20auxo-badge-top-right\x22]"),
      f = e?.["nextSibling"];
    f && f["textContent"]["includes"]("会话") && f["click"]();
  }
  await delay(0x64);
  let c = document["querySelector"]("[title=\x22" + a["messageId"] + "\x22]");
  const d = getCustomerId();
  if (d && (d == a["messageId"] || a["userId"] == d) && c) {
    if (a["isBottomLineAutoReply"]) {
      const g = c["parentElement"]["parentElement"]["lastChild"]["firstChild"];
      if (!["时", "分", "秒"]["some"]((h) => g["textContent"]["includes"](h))) {
        (c["click"](),
          console["log"]("CLEAR_AI_REPLY_INFO该消息已回复，跳过"),
          window["postMessage"](
            {
              type: "CLEAR_AI_REPLY_INFO",
              data: { messageId: a["messageId"] },
            },
            "*",
          ));
        return;
      }
    }
    (await sendMessageToDoudian(a),
      (a["imageBase64"] || a["imageUrl"]) &&
        (await sendImageMessage(
          a["messageId"],
          a["imageBase64"],
          a["imageMimeType"],
          a["imageUrl"],
        )));
  } else {
    if (!c) {
      const h = document["querySelectorAll"](".auxo-dropdown-trigger");
      if (h) {
        const i = Array["from"](h)["find"]((j) => {
          const k = j["innerText"];
          return (
            (a["messageId"] && k["includes"](a["messageId"])) ||
            (a["userId"] && k["includes"]("用户" + a["userId"]))
          );
        });
        i && i["children"][0x0] && (i["children"][0x0]["click"](), (c = i["children"][0x0]));
        if (!c) {
          const j = document["querySelector"]("[data-qa-id=\x22qa-user-order-search\x22]");
          j &&
            ((j["value"] = a["messageId"]),
            j["dispatchEvent"](new Event("input", { bubbles: !![] })),
            await new Promise((k) => setTimeout(k, 0x1f4)),
            document["querySelectorAll"]("[data-qa-id=\x22qa-user-order-search-result-item\x22]")[
              "forEach"
            ]((k) => {
              const l = k["innerText"];
              l === a["messageId"] && k["firstChild"]["click"]();
            }),
            await new Promise((k) => setTimeout(k, 0xc8)),
            await sendMessageToDoudian(a),
            (a["imageBase64"] || a["imageUrl"]) &&
              (await sendImageMessage(
                a["messageId"],
                a["imageBase64"],
                a["imageMimeType"],
                a["imageUrl"],
              )));
        }
      }
    }
    if (!c) {
      (console["log"]("CLEAR_AI_REPLY_INFO未找到目标用户:", a["messageId"]),
        window["postMessage"](
          {
            type: "CLEAR_AI_REPLY_INFO",
            data: { messageId: a["messageId"] },
          },
          "*",
        ));
      return;
    }
    if (a["isBottomLineAutoReply"]) {
      const k = c["parentElement"]["parentElement"]["lastChild"]["firstChild"];
      console["log"]("开始处理兜底信息:", k["textContent"]);
      if (!["时", "分", "秒"]["some"]((l) => k["textContent"]["includes"](l))) {
        (console["log"]("CLEAR_AI_REPLY_INFO删除标记"),
          window["postMessage"](
            {
              type: "CLEAR_AI_REPLY_INFO",
              data: { messageId: a["messageId"] },
            },
            "*",
          ));
        return;
      }
    }
    (c["click"](),
      await delay(0x1f4),
      await sendMessageToDoudian(a),
      (a["imageBase64"] || a["imageUrl"]) &&
        (await sendImageMessage(
          a["messageId"],
          a["imageBase64"],
          a["imageMimeType"],
          a["imageUrl"],
        )));
  }
}
async function processNextReplyMessage(a) {
  if (isProcessingReply || a["length"] === 0x0) {
    replyMessagekey = null;
    replyMessage["isReminderReply"] &&
      window["postMessage"](
        {
          type: "send-reminder",
          value: { userId: message["userId"] },
        },
        "*",
      );
    return;
  }
  isProcessingReply = !![];
  const b = a["shift"]();
  ((replyMessage = b),
    await handleReplyMessageForDoudian(replyMessage)
      ["catch"]((c) => console["error"]("处理消息异常", c))
      ["finally"](async () => {
        ((isProcessingReply = ![]), await delay(0xc8), processNextReplyMessage(a));
      }));
}
(safeIpcOn("reply-message", async (a, b) => {
  console["log"]("reply-message", b);
  let c = [];
  try {
    if (typeof b === "object") c = [...b];
    else {
      const d = JSON["parse"](b);
      c = d;
    }
    console["log"]("解析消息", c);
  } catch {
    b["isBottomLineAutoReply"] && (c = [...b]);
  }
  if (c["length"] > 0x0) {
    const e = c[0x0];
    console["log"]("查看发送", shopInfo, sendInsert, e);
    if (e && (e["userId"] || e["messageId"]) && shopInfo["id"]) {
      (e?.["imageBase64"] || e?.["imageUrl"]) &&
        (await sendImage(
          e["imageBase64"],
          e["userId"] || e["messageId"],
          shopInfo["id"],
          e["imageUrl"],
        ),
        await delay(0x1f4));
      const f = {
        ...e,
        isReminderReply: e["isReminderReply"] || ![],
        isAiInviteReply: e["isAiInviteReply"] || ![],
        isAiAutoReply: !e["isBottomLineAutoReply"],
        isBottomLineAutoReply: e["isBottomLineAutoReply"] || ![],
      };
      if (e?.["needOrder"] && e?.["needOrder"] >= 0x3) {
      }
      (window["postMessage"]({
        type: "send-message",
        data: {
          shopId: shopInfo["id"],
          userId: e["userId"] || e["messageId"],
          content: e["replyContent"],
        },
      }),
        console["log"]("发送消息:", f),
        waitSendSuccess(f["messageId"])["then"]((g) => {
          ((f["shopMsgTotal"] = getMsgTotal() || 0x0),
            console["log"]("发送成功:", g),
            ipcRenderer["send"]("get-customer-callback-result", f),
            (replyMessagekey = null));
        }));
    }
  }
}),
  window["addEventListener"]("error", (a) => {
    (console["error"]("全局错误", a), reportGlobalPreloadError("全局错误", a["error"] || a));
  }),
  window["addEventListener"]("unhandledrejection", (a) => {
    (console["error"]("未捕获的promise错误", a),
      reportGlobalPreloadError("未捕获的promise错误", a["reason"] || a));
  }));
function clearAllTimers() {
  (Object["values"](timerIds)["forEach"]((a) => {
    if (a) clearInterval(a);
  }),
    batchTimer && (clearTimeout(batchTimer), (batchTimer = null)),
    pendingMessages["length"] > 0x0 && sendMessagesBatch(),
    (timerIds = {
      messageCheck: null,
      statusCheck: null,
      unReplyMessage: null,
      shopObserver: null,
      cleanup: null,
      memoryCheck: null,
      batchSend: null,
    }));
}
(window["addEventListener"]("beforeunload", clearAllTimers),
  safeIpcOn("getShopInputStatus", (a, b) => {
    try {
      startUserActivityTimer();
      const c = document["querySelector"]("[data-qa-id=\x22qa-send-message-textarea\x22]");
      if (c) {
        const d = c["value"] && c["value"]["trim"]()["length"] > 0x0,
          e = (windowHasFocus && isUserOperating) || d,
          f = document["querySelector"]("[data-btm-id=\x22a9034.b39122.c0467.d4350\x22]");
        ipcRenderer["send"]("shopInputStatus", {
          shopId: b,
          hasContent: e,
          currentUserId: f?.["textContent"],
        });
      } else
        (console["log"]("店铺\x20" + b + "\x20未找到输入框元素"),
          ipcRenderer["send"]("shopInputStatus", {
            shopId: b,
            hasContent: ![],
            userIsOperating: ![],
          }));
    } catch (g) {
      (console["error"]("检测店铺\x20" + b + "\x20输入框状态失败:", g),
        ipcRenderer["send"]("shopInputStatus", {
          shopId: b,
          hasContent: ![],
          userIsOperating: ![],
        }));
    }
  }));
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
safeIpcOn("currnt-page", (a, b) => {
  _key = b;
  if (_key) (ipcRenderer["send"]("get-currnt-page", ![]), clearTimeout(hearTimer));
  else {
    _sendHeartbeat(currentInterval);
    return;
  }
});
const _sendHeartbeat = (a) => {
  (hearTimer && clearTimeout(hearTimer),
    (hearTimer = setTimeout(async () => {
      if (_key && info) return;
      (await ipcRenderer["send"]("reload-page"), (a = 0x0), _sendHeartbeat());
    }, a || currentInterval)));
};
safeIpcOn("reload-page", () => {
  ipcRenderer["send"]("reload-page");
});
function getCookieValue(a) {
  const b = ";\x20" + document["cookie"],
    c = b["split"](";\x20" + a + "=");
  if (c["length"] === 0x2) return c["pop"]()["split"](";")["shift"]();
  return null;
}
const _getOrderStatusByDom = () => {
  const a = document["querySelector"](".ecom-collapse-header");
  let b = null;
  if (a)
    try {
      const c = document["querySelector"](".ecom-dorami-tag-group-wrapper");
      console["log"]("_tagcont", c);
      if (c) {
        const d = c["querySelectorAll"](".sp-tag-content");
        b = Array["from"](d)
          ["map"]((e) => e["textContent"]["trim"]())
          ["join"]();
      } else b = a["lastChild"]["firstChild"]["firstChild"]["textContent"]["trim"]();
    } catch (e) {
      console["log"]("订单dom\x20错误", e);
    }
  else b = "暂无订单";
  return b;
};
function getMsgList() {
  try {
    const a = [];
    function b() {
      const l = document["querySelector"]("textarea[data-qa-id=\x22qa-send-message-textarea\x22]"),
        m = l?.["getAttribute"]("placeholder") || "",
        n = m["match"](/^发送给 (.+?)，使用Enter/);
      return n ? n[0x1] : "";
    }
    function c() {
      try {
        const l = document["querySelector"]("#rc-tabs-0-tab-footprint");
        l?.["click"]();
        const m = document["querySelector"]("#rc-tabs-0-tab-combination");
        m?.["click"]();
        const n = document["querySelector"]("._2af0c552fa1648884aa36735c8775c6b-less");
        return n?.["innerText"]?.["trim"]() || "";
      } catch (o) {
        return (console["warn"]("extractTextFromTabSync\x20执行失败:", o), "");
      }
    }
    function d(l) {
      const m = l["querySelector"](".iD7SHBvMhm4OhfCsBGr1");
      if (m) {
        if (m["classList"]["contains"]("messageIsMe")) return "assistant";
        if (m["classList"]["contains"]("messageNotMe")) return "user";
      }
      const n = l["querySelector"](".messageNotMe"),
        o = l["querySelector"](".messageIsMe");
      if (n) return "user";
      if (o) return "assistant";
      const p = l["querySelector"](".Ie29C7uLyEjZzd8JeS8A");
      if (p) {
        const q = window["getComputedStyle"](p);
        if (q["flexDirection"] === "row") return "user";
        if (q["flexDirection"] === "row-reverse") return "assistant";
      }
      return "user";
    }
    const f = getCustomerId(),
      g = b(),
      h = g,
      i = Array["from"](document["querySelectorAll"](".msgItemWrap"))["filter"]((l) => {
        const m = l["querySelector"]("[data-id]")?.["getAttribute"]("data-id") || "";
        return !m["includes"]("_Welcome_");
      });
    let j = "",
      k = "暂无订单";
    return (
      i["forEach"]((l) => {
        try {
          const m = d(l),
            n = l["querySelector"](".Vry36sSLfjhqZr9MfWnO\x20.O4UWWFoQxgMq4AWHMq25"),
            o = n ? n["textContent"]["trim"]() : "";
          let p = "",
            q = ![],
            r = "暂无订单";
          const s = l["innerText"]["trim"]();
          if (s["includes"]("将该会话转移给") || s["includes"]("将会话转移给您")) {
            a["push"]({
              role: "user",
              time: undefined,
              shopTitle: "",
              content: "",
              userId: f,
              username: h,
              messageId: g,
              isOrder: ![],
            });
            return;
          }
          if (
            (s["includes"]("消息") && s["includes"]("系统")) ||
            s["includes"]("自动消息") ||
            s["includes"]("由机器人发送")
          )
            return;
          const t = l["querySelector"](".auxo-dropdown-trigger.I7ZfagWiu5KfRxXX0opn");
          if (t) {
            const y = Array["from"](t["querySelectorAll"]("img")),
              z = y["find"]((D) => !D["src"]["startsWith"]("data:")),
              A = z?.["src"] || "",
              B = l["querySelector"](".UxSmMdIBLhWInjTN6l7s\x20.wi4ZmACMgatEJ1pWdEw1"),
              C = B?.["textContent"]["trim"]() || "";
            a["push"]({
              rple: rple,
              time: o,
              shopTitle: j,
              content: "用户发送了视频",
              videoUrl: A,
              videoDuration: C,
              userId: f,
              username: h,
              messageId: g,
              isOrder: q,
              orderStatus: k || "",
            });
            return;
          }
          const u = l["querySelector"]("img.auxo-dropdown-trigger");
          if (u && u["src"] && !u["src"]["startsWith"]("data:")) {
            a["push"]({
              role: m,
              time: o,
              shopTitle: j,
              content: "用户发送了图片",
              imageUrl: u["src"],
              userId: f,
              username: h,
              messageId: g,
              isOrder: ![],
              orderStatus: k || "",
            });
            return;
          }
          const v = l["querySelector"](".chatd-card-main");
          if (v) {
            const D = v["innerText"],
              E = D["trim"]()["split"]("\x0a");
            E[0x1] &&
              E[0x1]["startsWith"]("订单") &&
              ((r = E[0x1]["replace"](/^订单/, "")["trim"]()),
              (k = r),
              (q = !![]),
              console["log"]("订单状态:", r));
            const F = v["querySelectorAll"](
              ".pigeon-card-place-holder-text\x20.content.max-line\x20span",
            );
            if (!q && F["length"] >= 0x2) {
              if (F[0x1]["textContent"]["trim"]()["includes"]("您看中的商品")) return;
              if (F[0x1]["textContent"]["trim"]()["includes"]("退款")) return;
              j = F[0x1]["textContent"]["trim"]();
              if (j["includes"]("已售")) {
                if (F[0x0]["textContent"]["trim"]()["includes"]("您看中的商品")) return;
                if (F[0x0]["textContent"]["trim"]()["includes"]("退款")) return;
                j = F[0x0]["textContent"]["trim"]();
              }
              p = "用户咨询商品：" + j;
            }
            a["push"]({
              role: m,
              time: o,
              shopTitle: j,
              content: p,
              userId: f,
              username: h,
              messageId: g,
              isOrder: q,
              orderStatus: r,
            });
            return;
          }
          const w = l["querySelectorAll"](".content.max-line\x20span");
          if (w["length"] > 0x1 && w[0x0]["innerText"]["includes"]("用户正在查看商品")) {
            if (w[0x1]["innerText"]["trim"]()["includes"]("您看中的商品")) return;
            j = w[0x1]["innerText"]["trim"]();
          }
          const x = l["querySelector"](".iD7SHBvMhm4OhfCsBGr1");
          (x && (p = x["innerText"]["trim"]()),
            (o || j || p) &&
              a["push"]({
                role: m,
                time: o,
                shopTitle: j,
                content: p,
                userId: f,
                username: h,
                messageId: g,
                isOrder: q,
                orderStatus: k || "",
              }));
        } catch (G) {
          console["warn"]("单条消息处理异常：", G);
        }
      }),
      j !== "" && a["forEach"]((l) => (l["shopTitle"] = j)),
      k !== ""
        ? a["forEach"]((l) => {
            if (!l["orderStatus"]) l["orderStatus"] = k;
          })
        : ((k = _getOrderStatusByDom()),
          a["forEach"]((l) => {
            if (!l["orderStatus"]) l["orderStatus"] = k;
          })),
      console["log"]("result", a),
      a
    );
  } catch (l) {
    return (console["error"]("脚本整体执行失败：", l), JSON["stringify"]([]));
  }
}
const checkAndFocusInput = (a = 0x32, b = 0x64) => {
  let c = 0x0;
  const d = setInterval(() => {
    const e = document["querySelector"]("[data-qa-id=\x22qa-send-message-textarea\x22]");
    if (e) (e["focus"](), e["blur"](), e["focus"](), clearInterval(d));
    else
      ++c >= a &&
        (console["log"]("input\x20not\x20found\x20after", a, "attempts"), clearInterval(d));
  }, b);
};
safeIpcOn("goto-human-reply", async (a, b) => {
  const c = document["querySelector"]("[data-qa-id=\x22qa-transfer-conversation\x22]");
  c && c["click"]();
  await ms_delay(0x1f4);
  const d = document["querySelector"]("input[placeholder=请输入在线客服昵称]");
  d &&
    ((d["value"] = b["subAccount"]),
    d["dispatchEvent"](new Event("input", { bubbles: !![] })),
    d["dispatchEvent"](new Event("change", { bubbles: !![] })));
  await ms_delay(0x1f4);
  const e = document["querySelectorAll"]("[data-qa-id=\x22qa-transfer-customer\x22]");
  if (e["length"] > 0x0) {
    (e[0x0]["click"](), await ms_delay(0x1f4));
    const f = document["querySelector"](".sp-popconfirm-content"),
      g = f?.["textContent"]?.["trim"]();
    if (g && g["includes"]("存在未完成待办")) {
      const h = document["querySelector"](".auxo-btn-primary\x20span");
      h &&
        h["textContent"]["includes"]("仍要转接") &&
        (h["click"](), console["log"]("已点击\x20\x27仍要转接\x27"));
    }
  }
});
const ms_delay = (a) => {
  return new Promise((b) => setTimeout(b, a));
};
let loopCount = 0x0,
  loginOutFlag = ![];
async function pollUnReplyMessage() {
  try {
    const a = document["querySelector"]("[data-btm=\x22c852687\x22]");
    if (a) {
      const b = a["querySelector"]("span[style=\x22color:\x20rgb(26,\x20102,\x20255);\x22]");
      if (b) b?.["click"]();
    }
  } catch (c) {
    console["warn"]("pollUnReplyMessage\x20error:", c);
  }
  try {
    loopCount++;
    loopCount >= 0x12 && (window["postMessage"]({ type: "pull-message" }), (loopCount = 0x0));
    const d = document["querySelectorAll"](".sp-icon-parcel[size=\x2216\x22]");
    for (const h of d) {
      try {
        const i = h["parentElement"];
        if (!i) continue;
        const j = i["children"]?.[0x1];
        if (!j) continue;
        const k = j["textContent"]?.["trim"]();
        if (!k) continue;
        if (k["includes"]("登录已过期") && !loginOutFlag) {
          (ipcRenderer["send"]("account-login-expired"),
            console["log"]("登录已过期==========="),
            (loginOutFlag = !![]));
          break;
        }
      } catch (l) {
        console["warn"]("unLogin\x20detect\x20error:", l);
      }
    }
    let f = [];
    if (shopInfo["id"]) {
      const m = document["querySelectorAll"]("[data-qa-id=\x22qa-conversation-chat-item\x22]");
      let n = ![];
      for (const o of m) {
        if (o["children"][0x0]) {
          const p = o["innerHTML"];
          if (timeReg["test"](p)) {
            const q = o["querySelector"]("[title]:not(.auxo-scroll-number)");
            if (q) {
              const r = q["getAttribute"]("title"),
                s = o?.["children"][0x2]?.["children"][0x1]?.["children"][0x1];
              if (s) {
                const t = s["textContent"],
                  u = o?.["children"][0x2]["children"][0x0]["children"];
                let v = Math["floor"](new Date() / 0x3e8);
                u[u["length"] - 0x1]["textContent"] && (v = u[u["length"] - 0x1]["textContent"]);
                const w = o["querySelector"]("[src]"),
                  x = w?.["src"];
                console["log"]("发送消息", r, t, v);
                const y = await GetSendMessage["create"]({
                  userId: "",
                  username: r,
                  content: t,
                  timeout: v,
                  avatar: x,
                });
                !y?.["userId"] && !n && (getUnReplyMessage(), (n = !![]));
                console["log"]("发送消息", r, t, v, y);
                if (y["messageId"]) f["push"](y);
              }
            } else {
              if (o["children"][0x2]) {
                const z = o["children"][0x2],
                  A = z["children"][0x0]["querySelector"]("span:first-child"),
                  B = z?.["children"][0x1]?.["children"][0x1];
                if (A && A["textContent"]) {
                  let C = "";
                  /^用户.+$/["test"](A?.["textContent"]) &&
                    ((C = A["textContent"]["split"]("用户")[0x1]),
                    console["log"]("用户id", C, A["textContent"]["split"]("用户")));
                  let D = await GetSendMessage["create"]({
                    userId: C,
                    username: A["textContent"],
                    content: B["textContent"],
                    timeout:
                      z["children"][0x0]?.["children"][0x2]?.["textContent"] ||
                      Math["floor"](Date["now"]() / 0x3e8),
                  });
                  (console["log"]("dom=========", D, shopBotStatus), f["push"](D));
                }
              }
            }
          }
        }
      }
    }
    console["log"]("sendMessageList", f);
    const g = getMsgTotal();
    (ipcRenderer["send"]("get-message-total", g),
      f["length"] &&
        ((f = f["filter"]((E) => !keylock["get"](E?.["messageId"]))),
        ipcRenderer["send"]("get-customer-message-list", f)));
  } catch (E) {
    console["error"]("pollUnReplyMessage\x20error:", E);
  }
  setTimeout(pollUnReplyMessage, 0xa * 0x3e8);
}
safeIpcOn("send-image-message", async (a, b) => {
  console["log"]("[图片发送]\x20收到图片发送请求:", b);
  const { messageId: c, imageBase64: d, imageMimeType: e, imageUrl: f } = b;
  try {
    (await sendImageMessage(c, d, e, f), console["log"]("[图片发送]\x20图片发送成功"));
  } catch (g) {
    console["error"]("[图片发送]\x20图片发送失败:", g);
  }
});
async function sendImageMessage(a, b, c, d) {
  const e = document["querySelector"]("input[type=\x22file\x22][accept*=\x22.png\x22]");
  if (!e) return (console["error"]("[图片发送]\x20未找到图片上传input"), ![]);
  let f,
    g = c;
  if (d) {
    const o = await fetch(d);
    if (!o["ok"]) throw new Error("下载图片失败:\x20" + o["status"]);
    ((f = await o["blob"]()), (g = g || f["type"] || "image/jpeg"));
  } else {
    if (b) {
      const p = atob(b),
        q = new Uint8Array(p["length"]);
      for (let r = 0x0; r < p["length"]; r++) {
        q[r] = p["charCodeAt"](r);
      }
      f = new Blob([q], { type: g });
    } else return (console["error"]("[图片发送]\x20缺少图片数据"), ![]);
  }
  const h = (g || "image/jpeg")["split"]("/")[0x1] || "jpg",
    j = new File([f], "image_" + Date["now"]() + "." + h, { type: g });
  console["log"]("[图片发送]\x20创建文件成功:", j["name"], j["size"], "bytes");
  const k = new DataTransfer();
  (k["items"]["add"](j),
    (e["files"] = k["files"]),
    e["dispatchEvent"](new Event("change", { bubbles: !![] })),
    console["log"]("[图片发送]\x20已触发\x20change\x20事件"));
  let l = 0x0;
  const m = 0x14,
    n = setInterval(() => {
      l++;
      const s = document["querySelector"]("[data-qa-id=\x22qa-send-img-popup-submit\x22]");
      if (s) {
        (s["click"](), clearInterval(n));
        return;
      }
      l >= m && (clearInterval(n), console["log"]("[图片发送]\x20弹窗检测超时"));
    }, 0x64);
  return !![];
}
function getPreviousByPrefix(a, b) {
  for (let c = 0x0; c < a["length"]; c++) {
    if (a[c]["startsWith"](b)) return c > 0x0 ? a[c - 0x1] : null;
  }
  return null;
}
ipcRenderer["on"]("quality-socket-message", (a, b) => {
  console["log"]("ws\x20接收消息", b);
  const c = new Date();
  c["setDate"](c["getDate"]() - 0x2);
  const d = new Date(c["setHours"](0x0, 0x0, 0x0, 0x0))["getTime"](),
    e = new Date(c["setHours"](0x17, 0x3b, 0x3b, 0x3e7))["getTime"](),
    f = {
      ...b,
      startTime: d,
      endTime: e,
    };
  window["postMessage"]({
    type: "quality-socket-message",
    data: f,
  });
});
const original = navigator["serviceWorker"]?.["register"];
original &&
  (navigator["serviceWorker"]["register"] = () => Promise["reject"](new Error("blocked")));
"serviceWorker" in navigator &&
  navigator["serviceWorker"]["getRegistrations"]()["then"]((a) => {
    for (const b of a) {
      (console["log"]("卸载serverWorker\x20unregistering", b),
        b?.["active"]?.["scriptURL"] == "https://im.jinritemai.com/sw_v1.js" &&
          (b["unregister"](), ipcRenderer["send"]("reload-shop")));
    }
  });
function getIndexedDBValue(a, b = 0x3e8) {
  const c = "buyerInfo",
    d = "keyvaluepairs";
  return new Promise((e, f) => {
    setTimeout(() => {
      try {
        const g = indexedDB["open"](c);
        ((g["onerror"] = () => {
          f(g["error"]);
        }),
          (g["onsuccess"] = () => {
            try {
              const h = g["result"];
              if (!h["objectStoreNames"]["contains"](d)) {
                (h["close"](), f(new Error("objectStore\x20\x22" + d + "\x22\x20not\x20found")));
                return;
              }
              const i = h["transaction"](d, "readonly"),
                j = i["objectStore"](d),
                k = j["get"](a);
              ((k["onsuccess"] = () => {
                (e(k["result"]), h["close"]());
              }),
                (k["onerror"] = () => {
                  (f(k["error"]), h["close"]());
                }));
            } catch (l) {
              f(l);
            }
          }));
      } catch (h) {
        f(h);
      }
    }, b);
  });
}
function getUserIdByUsername(a, b) {
  const c = "buyerInfo",
    d = "keyvaluepairs";
  return new Promise((e, f) => {
    const g = indexedDB["open"](c);
    ((g["onerror"] = () => {
      f(g["error"]);
    }),
      (g["onsuccess"] = () => {
        let h = null;
        try {
          h = g["result"];
          if (!h["objectStoreNames"]["contains"](d)) {
            (h["close"](), e(null));
            return;
          }
          const i = h["transaction"](d, "readonly"),
            j = i["objectStore"](d),
            k = j["openCursor"]();
          ((k["onerror"] = () => {
            (h["close"](), f(k["error"]));
          }),
            (k["onsuccess"] = (l) => {
              try {
                const m = l["target"]["result"];
                if (!m) {
                  (h["close"](), e(null));
                  return;
                }
                const n = m["value"];
                if (n?.["value"]?.["avatar"] === a) {
                  const o = n?.["value"]?.["id"];
                  (h["close"](), e(o || null));
                  return;
                } else {
                  if (!a && n?.["value"]?.["username"] === b) {
                    const p = n?.["value"]?.["id"];
                    (h["close"](), e(p || null));
                    return;
                  }
                }
                m["continue"]();
              } catch (q) {
                (h["close"](), f(q));
              }
            }));
        } catch (l) {
          if (h) h["close"]();
          f(l);
        }
      }));
  });
}
function delay(a) {
  return new Promise((b) => setTimeout(b, a));
}
function getIndexedDBFirstChar(a = 0x3e8) {
  const b = "buyerInfo",
    c = "keyvaluepairs";
  return new Promise((d, e) => {
    setTimeout(() => {
      const f = indexedDB["open"](b);
      ((f["onerror"] = () => e(f["error"])),
        (f["onsuccess"] = () => {
          let g;
          try {
            g = f["result"];
            if (!g["objectStoreNames"]["contains"](c)) {
              (g["close"](), d(undefined));
              return;
            }
            const h = g["transaction"](c, "readonly"),
              i = h["objectStore"](c),
              j = i["openCursor"]();
            ((j["onerror"] = () => {
              (g["close"](), e(j["error"]));
            }),
              (j["onsuccess"] = (k) => {
                const l = k["target"]["result"],
                  m = l
                    ? {
                        key: l["key"],
                        value: l["value"],
                      }
                    : undefined;
                (g["close"](), d(m));
              }));
          } catch (k) {
            if (g) g["close"]();
            e(k);
          }
        }));
    }, a);
  });
}
function getMsgTotal() {
  const a = document["querySelector"]("[data-btm=\x22message_group_name_waitReply\x22]"),
    b = document["querySelector"]("[data-btm=\x22message_group_name_overThreemins\x22]");
  let c = 0x0,
    d = 0x0;
  return (a && (c = getnumber(a)), b && (d = getnumber(b)), d + c);
}
function getnumber(a) {
  const b = a["parentElement"];
  if (b) {
    const c = b["textContent"]["match"](/\((\d+)\)/);
    if (c) return Number(c[0x1]);
  }
  return 0x0;
}
(ipcRenderer["on"]("paste-to-shop", (a, b) => {
  const c = document["querySelector"]("[data-qa-id=\x22qa-send-message-textarea\x22]");
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
}),
  ipcRenderer["on"]("open-order-id", (a, b) => {
    console["log"]("orderId=================", b);
    const c = document["querySelector"]("[data-qa-id=\x22qa-user-order-search\x22]");
    c &&
      ((c["value"] = b),
      c["dispatchEvent"](new Event("input", { bubbles: !![] })),
      setTimeout(() => {
        document["querySelectorAll"]("[data-qa-id=\x22qa-user-order-search-result-item\x22]")[
          "forEach"
        ]((d) => {
          const e = d["innerText"];
          console["log"]("text", e);
          if (e?.["includes"](b)) {
            d["firstChild"]["click"]();
            return;
          }
        });
      }, 0x320));
  }));
let audioCtx = null,
  oscillator = null,
  gainNode = null;
function startAudioKeepAlive() {
  if (audioCtx && audioCtx["state"] === "running") return;
  ((audioCtx = new (window["AudioContext"] || window["webkitAudioContext"])()),
    (oscillator = audioCtx["createOscillator"]()),
    (gainNode = audioCtx["createGain"]()),
    (gainNode["gain"]["value"] = 0x0),
    (oscillator["type"] = "sine"),
    (oscillator["frequency"]["value"] = 0xc8),
    oscillator["connect"](gainNode),
    gainNode["connect"](audioCtx["destination"]),
    oscillator["start"](),
    console["log"]("音频保活启动"));
}
function resumeAudio() {
  audioCtx &&
    audioCtx["state"] === "suspended" &&
    (audioCtx["resume"](), console["log"]("音频恢复"));
}
(safeIpcOn("ai-transfer-human-mark", (a, b) => {
  (console["log"]("AI转人工星标", b),
    window["postMessage"](
      {
        type: "set-user-tag",
        data: { uid: b["userId"] },
      },
      "*",
    ));
}),
  safeIpcOn("ai-transfer-human-sub", async (a, b) => {
    console["log"]("AI转人工转接子账号", b);
    const c =
      b["serviceId"] || (b["subAccount"] ? await getSubAccountIdByName(b["subAccount"]) : "");
    if (!c) {
      console["warn"]("[抖店]\x20未找到匹配的客服账号:", b["subAccount"]);
      return;
    }
    window["postMessage"]({
      type: "move-to-chat",
      data: {
        conversationId: b["originConversationId"],
        serviceId: c,
      },
    });
  }));
const getSubAccountIdByName = async (a) => {
  if (!a) return null;
  const b = await fetch("https://pigeon.jinritemai.com/backstage/getCanAssignStaffList", {
      method: "GET",
      credentials: "include",
    })["then"]((f) => f["json"]()),
    c = Array["isArray"](b?.["data"]) ? b["data"] : [],
    d = String(a)["trim"](),
    e = c["find"]((f) => {
      if (!f || typeof f !== "object") return ![];
      return [f["staffName"], f["staff_username"]]
        ["filter"](Boolean)
        ["some"]((g) => String(g)["trim"]() === d);
    });
  return e?.["staffId"] || null;
};
function base64ToBlob(a) {
  const [b, c] = a["split"](","),
    d = b["match"](/:(.*?);/)[0x1],
    e = Buffer["from"](c, "base64");
  return new Blob([e], { type: d });
}
const getImageInfo = (a) => {
    return new Promise((b, c) => {
      const d = new Image(),
        e = URL["createObjectURL"](a);
      ((d["onload"] = () => {
        (b({
          width: d["width"],
          height: d["height"],
        }),
          URL["revokeObjectURL"](e));
      }),
        (d["onerror"] = c),
        (d["src"] = e));
    });
  },
  sendImage = async (a, b, c, d) => {
    const e = d
        ? await fetch(d)["then"]((i) => {
            if (!i["ok"]) throw new Error("下载图片失败:\x20" + i["status"]);
            return i["blob"]();
          })
        : base64ToBlob(a),
      { width: f, height: g } = getImageInfo(e),
      h = new FormData();
    (h["append"]("images[]", e, "1.png"),
      fetch(
        "https://pigeon.jinritemai.com/backstage/uploadimg?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&",
        {
          method: "POST",
          credentials: "include",
          body: h,
        },
      )
        ["then"]((i) => i["json"]())
        ["then"](async (i) => {
          console["log"]("res===========>", i);
          if (i["code"] == 0x0) {
            await fetch(
              "https://pigeon.jinritemai.com/backstage/getURLForURI?biz_type=4&PIGEON_BIZ_TYPE=2&_pms=1&uri=" +
                i["data"][0x0]["uri"] +
                ".png",
              {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
              },
            );
            const j = i["data"][0x0]["url"];
            (console["log"]("res===========>", j, shopInfo),
              window["postMessage"](
                {
                  type: "send-img",
                  data: {
                    url: j,
                    userId: b,
                    shopId: c,
                    width: f,
                    height: g,
                    size: e["size"],
                  },
                },
                "*",
              ));
          }
        }));
  };
(ipcRenderer["on"]("get-user-chatting-records", async (a, b) => {
  console["log"]("get-user-chatting-records", b);
}),
  safeIpcOn("get-after-sale-total-order", async (a, b) => {
    console["log"]("get-after-sale-total-order==============>", b);
    const c = b;
    try {
      const d = new Date(c["info"]["month"][0x0]);
      d["setHours"](0x0, 0x0, 0x0, 0x0);
      const e = new Date(c["info"]["month"][0x1]);
      e["setHours"](0x17, 0x3b, 0x3b, 0x3e7);
      const f = Math["floor"](d["getTime"]() / 0x3e8),
        g = Math["floor"](e["getTime"]() / 0x3e8);
      console["log"]("startTimeSec============>", f, g);
      const h = await fetch("https://fxg.jinritemai.com/after_sale/pc/list", {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          after_sale_status: "",
          after_sale_type: "",
          aftersale_platform_source: "fxg",
          apply_time_end: g,
          apply_time_start: f,
          conf_version: "v12",
          negotiate_status: "",
          order_by: ["status_deadline\x20asc"],
          order_flag: [],
          order_logistics_state: [],
          page: 0x1,
          pageSize: 0xa,
          reason: "",
          search_receiver: "",
        }),
      })["then"]((o) => o["json"]());
      console["log"]("totalCountRes", h);
      const i = await fetch("https://fxg.jinritemai.com/after_sale/pc/list", {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          after_sale_status: "",
          after_sale_type: "presale_all",
          aftersale_platform_source: "fxg",
          apply_time_end: g,
          apply_time_start: f,
          conf_version: "v12",
          negotiate_status: "",
          order_by: ["status_deadline\x20asc"],
          order_flag: [],
          order_logistics_state: [],
          page: 0x1,
          pageSize: 0xa,
          reason: "",
          search_receiver: "",
        }),
      })["then"]((o) => o["json"]());
      console["log"]("awaitingShipmentRefundRes", i);
      const j = await fetch("https://pigeon.jinritemai.com/backstage/task_order/list", {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          createTimeStart: f,
          createTimeEnd: g,
          page: 0x1,
          businessType: 0x0,
          pageSize: 0xa,
          queryForMixTaskOrder: !![],
        }),
      })["then"]((o) => o["json"]());
      console["log"]("workOrderRes", j);
      const k = h["total"] || 0x0,
        l = i["total"] || 0x0,
        m = j["data"]?.["taskOrderStatusConfigs"][0x0]["count"] || 0x0,
        n = k - l + m;
      (console["log"]("applyCount", k),
        console["log"]("refundOnlyCount", l),
        console["log"]("workOrderCount", m),
        console["log"]("realCount", n),
        ipcRenderer["send"]("get-after-sale-total-order-result", {
          applyCount: k,
          refundOnlyCount: l,
          workOrderCount: m,
          realCount: n,
          id: c["info"]["id"],
        }));
    } catch (o) {
      (console["log"]("error", o),
        ipcRenderer["send"]("web-scoker-error-callback", {
          info: c,
          errormsg: "查询月总工单失败,失败原因:" + JSON["stringify"](o),
          shopId: c["info"]?.["shopId"],
        }));
    }
  }),
  ipcRenderer["on"]("heartbeat", (a, b) => {
    (document["dispatchEvent"](new Event("visibilitychange")),
      window["dispatchEvent"](new Event("focus")),
      window["dispatchEvent"](new Event("online")),
      window["scrollBy"](0x0, 0x1),
      window["scrollBy"](0x0, -0x1),
      startAudioKeepAlive(),
      resumeAudio(),
      ipcRenderer["send"]("web-heartbeat-ping"),
      getUnReplyMessage());
  }));
