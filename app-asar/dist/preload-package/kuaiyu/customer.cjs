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
const mainUrl = "https://im.kwaixiaodian.com/";
let weekTime = 0x1e * 0x18 * 0x3c * 0x3c * 0x3e8,
  logoInfo = {
    username: "",
    password: "",
  };
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
    shopName: info["shopName"] || "未知店铺",
    platform: "doudian",
    errorMessage: a + ":\x20" + getReadableErrorMessage(b),
    time: new Date()["toLocaleString"]("zh-CN", { hour12: ![] }),
  });
}
const blockKeywords = [
  "发货验收提醒",
  "催付卡片",
  "寄回商品提醒",
  "寄回商品二次提醒",
  "用户已经评价",
  "快手官方保障",
  "评价邀请",
  "订单卡片",
  "核单卡片",
  "猜你想问",
  "猜您想问",
  "会话关闭",
  "核对订单提醒",
];
class customerMsg {
  constructor(a, b, c) {
    ((this["messageId"] = a),
      (this["username"] = a),
      (this["content"] = b),
      (this["timeout"] = this["parseChineseTimeToTimestamp"](c)),
      (this["source"] = "dom"));
  }
  ["parseChineseTimeToTimestamp"](a) {
    let b = 0x0,
      c = 0x0,
      d = 0x0,
      e = ![];
    /已?超时/["test"](a) && !/后超时/["test"](a) && (e = !![]);
    const f = a["match"](/(\d+)\s*小时/);
    if (f) b = parseInt(f[0x1], 0xa);
    const g = a["match"](/(\d+)\s*分钟|(\d+)\s*分/);
    if (g) c = parseInt(g[0x1] || g[0x2], 0xa);
    const h = a["match"](/(\d+)\s*秒/);
    if (h) d = parseInt(h[0x1], 0xa);
    const i = b * 0xe10 + c * 0x3c + d,
      j = Math["floor"](Date["now"]() / 0x3e8),
      k = e ? j : j + i;
    return k;
  }
}
class UserByOrderDB {
  constructor() {
    ((this["db"] = null),
      (this["DB_NAME"] = "userByOrderInfo"),
      (this["STORE_NAME"] = "value"),
      (this["VERSION"] = 0x1));
  }
  async ["init"]() {
    if (this["db"]) return (await this["clearExpired"](this["db"]), this["db"]);
    return (
      (this["db"] = await new Promise((a, b) => {
        const c = indexedDB["open"](this["DB_NAME"], this["VERSION"]);
        ((c["onupgradeneeded"] = (d) => {
          const e = d["target"]["result"];
          !e["objectStoreNames"]["contains"](this["STORE_NAME"]) &&
            e["createObjectStore"](this["STORE_NAME"], { keyPath: "id" });
        }),
          (c["onsuccess"] = () => a(c["result"])),
          (c["onerror"] = () => b(c["error"])));
      })),
      await this["clearExpired"](this["db"]),
      this["db"]
    );
  }
  async ["clearExpired"](a) {
    const b = 0x19e0d3e9d83;
    return new Promise((c, d) => {
      const e = a["transaction"](this["STORE_NAME"], "readwrite"),
        f = e["objectStore"](this["STORE_NAME"]),
        g = f["openCursor"]();
      ((g["onsuccess"] = (h) => {
        const i = h["target"]["result"];
        console["log"]("cursor", h);
        if (!i) return c();
        const j = i["value"];
        (j?.["time"] && j["time"] < b && i["delete"](), i["continue"]());
      }),
        (g["onerror"] = () => d(g["error"])));
    });
  }
  async ["save"](a) {
    if (!a?.["id"]) throw new Error("IDB:\x20id\x20不能为空");
    const b = await this["init"]();
    return new Promise((c, d) => {
      const e = b["transaction"](this["STORE_NAME"], "readwrite"),
        f = e["objectStore"](this["STORE_NAME"]),
        g = f["put"](a);
      ((g["onsuccess"] = () => c(!![])), (g["onerror"] = () => d(g["error"])));
    });
  }
  async ["get"](a) {
    if (!a) return null;
    const b = await this["init"]();
    return new Promise((c, d) => {
      const e = b["transaction"](this["STORE_NAME"], "readonly"),
        f = e["objectStore"](this["STORE_NAME"]),
        g = f["get"](a);
      ((g["onsuccess"] = () => c(g["result"] || null)), (g["onerror"] = () => d(g["error"])));
    });
  }
  async ["getAll"]() {
    const a = await this["init"]();
    return new Promise((b, c) => {
      const d = a["transaction"](this["STORE_NAME"], "readonly"),
        e = d["objectStore"](this["STORE_NAME"]),
        f = e["getAll"]();
      ((f["onsuccess"] = () => b(f["result"] || [])), (f["onerror"] = () => c(f["error"])));
    });
  }
  async ["delete"](a) {
    if (!a) return null;
    const b = await this["init"]();
    return new Promise((c, d) => {
      const e = b["transaction"](this["STORE_NAME"], "readwrite"),
        f = e["objectStore"](this["STORE_NAME"]),
        g = f["delete"](a);
      ((g["onsuccess"] = () => c(!![])), (g["onerror"] = () => d(g["error"])));
    });
  }
}
let shoperMessage = null,
  customerMessage = null,
  timeIndex = 0x0,
  cookie = null,
  shopBotStatus = 0x0,
  pausedTime = 0x0,
  startTime = 0x0,
  _key = null;
const HEARTBEAT_INTERVAL =
  0x3e8 * 0x3c * 0x3c * Number((Math["random"]() * 0x1 + 0x4)["toFixed"](0x2));
let currentInterval = HEARTBEAT_INTERVAL,
  hearTimer = null,
  info = null,
  editCustomrMessage;
const clickEvent = new MouseEvent("click", {
  bubbles: !![],
  cancelable: !![],
  view: window,
});
let myDB = null,
  addMessageList = [],
  isload = ![],
  inviteMap = new Map(),
  unReplyMessageStopped = ![],
  loginIndex = 0x0;
const MAX_LOGIN_INDEX = 0x3c;
(contextBridge["exposeInMainWorld"]("context_bridge", {
  postMessage: (a, b) => ipcRenderer["postMessage"](a, b),
  send: (a, b) => ipcRenderer["send"](a, b),
  invoke: (a, b) => ipcRenderer["invoke"](a, b),
}),
  safeIpcOn("kc-quality-result", (a, b) => {
    if (b["result"] == 0x1) {
      const c = b["data"]["stat"][0x0],
        d = c["avgReplySeconds"],
        e = c["imBadEvaluateRate"],
        f = c["timely3RepliedPercentFrom8"],
        g = c["createSessionTimes"] != null ? c["createSessionTimes"] : 0x0;
      ipcRenderer["send"]("get-quality-testing", {
        responseRateWithinThreeMin: f,
        averageRate: d,
        dissatisfiedRate: e,
        inquiryCount: g,
      });
    }
  }),
  window["addEventListener"]("load", () => {
    console["log"]("页面加载成功", window["location"]["href"]);
    window["location"]["href"]["includes"]("https://login.kwaixiaodian.com/") &&
      ipcRenderer["send"]("account-login-expired");
    ipcRenderer["send"]("get-shop-page-loaded");
    const a = document["querySelector"]("main"),
      b = document["createElement"]("style");
    (b["setAttribute"]("data-disable-anim", "true"),
      (b["innerHTML"] =
        "\x0a\x20\x20\x20\x20*,\x0a\x20\x20\x20\x20*::before,\x0a\x20\x20\x20\x20*::after\x20{\x0a\x20\x20\x20\x20\x20\x20animation-delay:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20animation-duration:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20animation-iteration-count:\x201\x20!important;\x0a\x20\x20\x20\x20\x20\x20transition-duration:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20transition-delay:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20scroll-behavior:\x20auto\x20!important;\x0a\x20\x20\x20\x20}\x0a\x20\x20"),
      document["head"]?.["appendChild"](b));
    const c = new MutationObserver((h) => {
      for (const i of h) {
        i["type"] === "childList" &&
          i["target"]["className"] == "SessionListGroup" &&
          i["addedNodes"][0x0]?.["className"] == "SessionListGroup-FolderSessions" &&
          ((isload = !![]), c["disconnect"]());
      }
    });
    if (a)
      c["observe"](a, {
        subtree: !![],
        childList: !![],
      });
    setTimeout(() => {
      ipcRenderer["send"]("request-shop-bot-status");
    }, 0x3e8);
    function d() {
      if (unReplyMessageStopped) return;
      loginIndex++;
      if (loginIndex > MAX_LOGIN_INDEX) {
        console["warn"]("登录尝试次数过多，停止轮询");
        return;
      }
      try {
        const h = document["querySelector"](".goLogin\x20>\x20.container\x20>\x20.btn\x20>\x20a");
        if (h) {
          (h["click"](), e());
          return;
        }
        const i = document["querySelector"](".leftContainer___hCfkc");
        if (!i) {
          e();
          return;
        }
        const j = document["querySelector"](".contentWrap___KJNdr"),
          k = j["querySelector"](".tabWrap___cTnFS");
        let l;
        if (k["firstChild"]["className"]["includes"]("activeLeft___NTISE")) l = k["lastChild"];
        else {
          if (k["lastChild"]["className"]["includes"]("activeRight___KmLB7")) l = k["lastChild"];
          else {
            (console["warn"]("无法识别登录选项卡"), e());
            return;
          }
        }
        l["click"]();
        const m = j["querySelector"](".loginWrapper___HPU9M");
        setTimeout(() => {
          const n = m["querySelector"](".justify-between");
          (n?.["firstChild"]?.["firstChild"] && n["firstChild"]["firstChild"]["click"](),
            setTimeout(() => {
              const o = m["querySelector"](".password-form-wrapper");
              if (!o) {
                e();
                return;
              }
              const p = o["firstChild"]["querySelector"]("input"),
                q = o["children"][0x1]["querySelector"]("input"),
                r = new URLSearchParams(window["location"]["search"]),
                s = decodeURIComponent(r["get"]("redirect_url") || ""),
                t = new URLSearchParams(s["split"]("?")[0x1] || ""),
                u = t["get"]("username") || "",
                v = t["get"]("password") || "",
                w = t["get"]("shopName") || "";
              ((p["value"] = u),
                (q["value"] = v),
                p["dispatchEvent"](new Event("input", { bubbles: !![] })),
                q["dispatchEvent"](new Event("input", { bubbles: !![] })),
                p["addEventListener"]("input", () => {
                  logoInfo["username"] = p["value"];
                }),
                q["addEventListener"]("input", () => {
                  logoInfo["password"] = q["value"];
                }));
              const x = o["querySelector"](".svelte-am7f5d");
              x &&
                (x["addEventListener"]("click", () => {
                  (ipcRenderer["send"]("loginInfo", logoInfo),
                    setTimeout(() => {
                      const y = document["querySelector"](".accountSubListWrap___DCHed");
                      if (y) {
                        const z = y["querySelector"](".accountItemWrap___p8tg6");
                        z &&
                          z["childNodes"]["forEach"]((A) => {
                            const B = A["querySelector"](".kshopName___eNPZr");
                            if (B && B["textContent"] === w) {
                              (A["click"](), (unReplyMessageStopped = !![]));
                              return;
                            }
                          });
                      }
                    }, 0x1f4));
                }),
                x["click"](),
                (unReplyMessageStopped = !![]));
            }, 0x1f4));
        }, 0x1f4);
      } catch (n) {
        console["error"]("checkLoginAndAutoFill\x20error:", n);
      }
      e();
    }
    d();
    function e() {
      !unReplyMessageStopped && setTimeout(d, 0x1f4);
    }
    const f = setInterval(() => {
        timeIndex++;
        if (timeIndex < 0x3c) {
          const h = document["querySelector"]("#main_root");
          h && (clearInterval(f), shopInfo(), pathUrl(), g());
        } else clearInterval(f);
      }, 0x3e8),
      g = (() => {
        let h = 0x0;
        const i = 0x5;
        return function j() {
          setTimeout(() => {
            const k = document["querySelector"](".statusTag");
            k
              ? startListenShopStatus(k)
              : (h++,
                h < i
                  ? j()
                  : console["warn"]("获取\x20subStatus\x20元素失败，已重试\x205\x20次，放弃。"));
          }, 0x3e8);
        };
      })();
  }),
  window["addEventListener"]("error", (a) => {
    (console["error"]("全局错误", a), reportGlobalPreloadError("全局错误", a["error"] || a));
  }),
  window["addEventListener"]("unhandledrejection", (a) => {
    (console["error"]("未捕获的promise错误", a),
      reportGlobalPreloadError("未捕获的promise错误", a["reason"] || a));
  }),
  safeIpcOn("get-shop-cookie", (a, b) => {
    const c = JSON["parse"](b);
    cookie = cookieArrayToHeaderString(c);
  }));
function getKsValue(a) {
  return a?.["value"] ?? "";
}
function getKsDimCard(a, b) {
  return a["find"]((c) => c?.["title"] === b);
}
function buildKsMetricMap(a) {
  const b = {},
    c = Array["isArray"](a) ? a : [];
  return (
    c["forEach"]((d) => {
      const e = d?.["portalIndexTitleVO"]?.["text"] || "";
      if (!e) return;
      b[e] = {
        score: getKsValue(d?.["portalIndexScoreVO"]?.["value"]),
        shopValue: getKsValue(d?.["portalIndexValueVO"]?.["value"]),
      };
    }),
    b
  );
}
function buildKsExperienceScoreData(a) {
  const b = Array["isArray"](a?.["dimInfoCardVOList"]) ? a["dimInfoCardVOList"] : [],
    c = getKsDimCard(b, "商品体验"),
    d = getKsDimCard(b, "物流体验"),
    e = getKsDimCard(b, "售后服务");
  return {
    consumerDivide: a?.["kwaishopScoreMainVO"]?.["value"] ?? "",
    serviceDivide: getKsValue(e?.["cardData"]?.["baseValue"]),
    foundationDivide: "",
    deliveryDivide: "",
    goodDivide: getKsValue(c?.["cardData"]?.["baseValue"]),
    logisticsDivide: getKsValue(d?.["cardData"]?.["baseValue"]),
    consumerScore: a?.["kwaishopScoreMainVO"]?.["value"] ?? "",
    productScore: getKsValue(c?.["cardData"]?.["baseValue"]),
    logisticsScore: getKsValue(d?.["cardData"]?.["baseValue"]),
    serviceScore: getKsValue(e?.["cardData"]?.["baseValue"]),
    productMetrics: buildKsMetricMap(c?.["indexCardVOList"]),
    logisticsMetrics: buildKsMetricMap(d?.["indexCardVOList"]),
    serviceMetrics: buildKsMetricMap(e?.["indexCardVOList"]),
  };
}
const getKsshopScore = () => {
  if (cookie)
    fetch("http://localhost:1121/ks-experience-score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cookie": cookie,
      },
      body: JSON["stringify"]({
        api: "getKwaishopScoreDetailV5",
        param: JSON["stringify"]({ scoreSinkType: 0x1 }),
        sellerId: null,
      }),
      credentials: "include",
    })
      ["then"]((a) => a["json"]())
      ["then"]((a) => {
        console["log"]("res==========", a);
        const b = a["data"];
        try {
          const c = buildKsExperienceScoreData(b);
          (console["log"]("快手体验分", c), ipcRenderer["send"]("getShopExperienceScore", c));
        } catch (d) {
          console["error"]("快手体验分", d);
        }
      });
};
let wsConnectState = -0x1;
function pathUrl(a = 0x3a98) {
  let b = null;
  const c =
    "https://s.kwaixiaodian.com/rest/app/tts/cs/session/list?maxSize=100&pullOffset=1&sortType=1&role=0&containTags=false&containReportTags=true";
  setTimeout(async () => {
    try {
      b = await testXmlTool(c, "GET");
      if (b) getMsgHandler(b);
    } catch (d) {
      console["error"]("接口报错:", d);
    } finally {
      pathUrl(0xa * 0x3e8);
    }
  }, a);
}
async function getMsgHandler(a) {
  a?.["error_msg"]?.["includes"]("重新登录") &&
    (console["log"]("重新登录"), ipcRenderer["send"]("account-login-expired"));
  let b = getMessageTotal();
  console["log"]("messageTotal", b);
  if (a["result"] == 0x1) {
    const c = a["data"]["sessionList"];
    if (!c || c["length"] == 0x0) return;
    for (const d of c) {
      const e = d["targetUserInfo"],
        f = d["chatSession"]["latestMessage"][0x0],
        g = d["sessionShowTag"],
        h = isBetweenYesterday23AndNow(d["chatSession"]["activeTime"]),
        i = [0xc, 0xd]["includes"](g),
        j = [
          "发货验收提醒",
          "催付卡片",
          "寄回商品提醒",
          "寄回商品二次提醒",
          "快手官方保障",
          "评价邀请",
          "订单卡片",
          "核单卡片",
          "猜你想问",
          "猜您想问",
          "会话关闭",
          "核对订单提醒",
        ],
        k = f["title"] || "",
        l = !j["some"]((m) => k["includes"](m));
      if (h && i && l && e["nickname"] !== "官方极致保障") {
        console["log"]("原始数据", d);
        const m = f["timestampMs"] + 0x2bf20,
          n = m > Date["now"]() ? Math["floor"](m / 0x3e8) : Math["floor"](Date["now"]() / 0x3e8);
        let o = null,
          p = "暂无订单",
          q = null,
          s = null;
        if (f["title"] === "") {
          const u = extractNameAndId(f["content"]);
          (console["log"]("r>>>>", u),
            (s = u?.["itemId"] ? "用户发送了商品" : "用户发送了订单"),
            (o = u?.["itemId"]),
            (p = u?.["orderStatusDesc"]),
            (q = u?.["orderid"]));
        }
        const t = {
          goodId: o,
          userId: e["userId"],
          messageId: e["userId"],
          username: e["nickname"],
          content: s || f["title"],
          timeout: n,
          avatar: e["avatar"],
          api: !![],
          timeNote: "",
        };
        addMessageList["push"](t);
      }
    }
  } else
    a?.["error_msg"]?.["includes"]("请重新登录") && ipcRenderer["send"]("account-login-expired");
  ipcRenderer["send"]("get-message-total", b);
  if (addMessageList && addMessageList["length"] > 0x0) {
    (console["log"]("发送\x20接口获取\x20数据\x20列表\x20", addMessageList),
      ipcRenderer["send"]("get-customer-message-list", addMessageList));
    if (!b) b = addMessageList["length"];
    (ipcRenderer["send"]("get-message-total", b), (addMessageList = []));
  }
}
function getUnReplyMessage() {
  const a = document["body"]["querySelectorAll"](".SessionListGroup\x20.SessionBaseCard-Static");
  if (a) {
    const b = [];
    for (const c of a) {
      const d = c["querySelector"](".SessionBaseCard-topHeadTime");
      if (d && d["textContent"]["includes"]("超时")) {
        const e = c["querySelector"](".SessionBaseCard-topHeadName"),
          f = c["querySelector"](".SessionBaseCard-lastMessage"),
          g = d["textContent"],
          h = new customerMsg(e["textContent"], f["textContent"], g);
        b["push"](h);
      }
    }
    b["length"] > 0x0 && ipcRenderer["send"]("get-customer-message-list", b);
  }
}
function isBetweenYesterday23AndNow(a) {
  const b = new Date(),
    c = new Date(b["getFullYear"](), b["getMonth"](), b["getDate"]()),
    d = new Date(c["getTime"]());
  return (
    d["setDate"](c["getDate"]() - 0x1),
    d["setHours"](0x17, 0x0, 0x0, 0x0),
    a >= d["getTime"]() && a <= b["getTime"]()
  );
}
const testXmlTool = async (a, b) => {
  try {
    const c = await fetch(a, {
        credentials: "include",
        method: b,
        headers: { "Content-Type": "application/json" },
      }),
      d = await c["json"]();
    return d;
  } catch (e) {
    return (console["log"]("接口报错:", e), null);
  }
};
function shopInfo() {
  fetch("https://im.kwaixiaodian.com/gateway/business/cs/solution/login/user/info/get", {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })
    ["then"]((a) => a["json"]())
    ["then"]((a) => {
      const { result: b, data: c } = a;
      b == 0x1 &&
        ((info = {
          logo: c["avatar"],
          id: c["shopId"],
          kf: c["userId"],
          name: c["shopName"],
          username: c["nickname"],
        }),
        console["log"]("获取商家信息成功", a, info),
        ipcRenderer["send"]("get-shop-info", info),
        (shoperMessage = info),
        fetch("https://s.kwaixiaodian.com/rest/pc/cs/b/get/assistant/status", {
          credentials: "include",
        })
          ["then"]((d) => d["json"]())
          ["then"]((d) => {
            if (d["result"] == 0x1) {
              let e = d["data"]["statusDesc"];
              (console["log"]("店铺状态", e),
                ipcRenderer["send"]("shop-status-change", { status: e }));
            }
          }));
    });
}
const getGoodListSync = (a) => {
  return new Promise((b, c) => {
    fetch("https://s.kwaixiaodian.com/gateway/business/cs/metadata/card/list/data/query?caver=2", {
      credentials: "include",
      method: "POST",
      body: JSON["stringify"]({
        businessKey: "pc_goods_list",
        tenantKey: "merchant_cs",
        businessDataVersion: "9",
        params: JSON["stringify"]({
          $LIMIT$: 0xa,
          $OFF_SET$: 0x0,
          $SKU_ID$: "0",
          $SEARCH_KEY_WORD$: a ? a : "",
          $BUYER_ID_STR$: shoperMessage["id"],
          $VIEW_TAB$: 0x2,
          $MESSAGE_ID$: 0x0,
        }),
      }),
      headers: { "Content-Type": "application/json" },
    })
      ["then"]((d) => d["json"]())
      ["then"]((d) => {
        console["log"]("商品列表", d);
        if (d["result"] === 0x1) {
          const e = JSON["parse"](d["data"]);
          b(
            e["cardData"]["map"]((f) => ({
              productName: f["Text_goodsTitle@text"],
              productId: f["Text_itemId@text"],
              productDescribe: f["HoverComponent_uvwzxl6389k@hoverContent"],
              productImage: f["Image_umikt4dxz8b@uri"],
            })),
          );
        } else c(new Error("接口返回结果异常"));
      })
      ["catch"](c);
  });
};
(safeIpcOn("get-goods-detail", (a, b) => {
  (console["log"]("开始获取商品详情", b),
    b["ids"]["forEach"](async (c) => {
      getGoodListSync(c)
        ["then"]((d) => {
          ((d["aiTaskId"] = b["aiTaskId"]),
            (d["type"] = b["type"]),
            (d["id"] = b["id"]),
            console["log"]("商品详情", d),
            goodsDetail(d, b));
        })
        ["catch"]((d) => {});
    }));
}),
  safeIpcOn("get-goods-all-detail", async (a, b) => {
    console["log"]("开始获取商品列表", b);
    try {
      const c = await getGoodListSyncWithPagination(0x0, 0x14);
      if (!c || c["length"] === 0x0) {
        console["error"]("获取商品列表失败");
        return;
      }
      let d = [...c],
        e = 0x14,
        f = c["length"] === 0x14;
      while (f) {
        const j = await getGoodListSyncWithPagination(e, 0x14);
        (j && j["length"] > 0x0
          ? ((d = [...d, ...j]), (e += 0x14), j["length"] < 0x14 && (f = ![]))
          : (f = ![]),
          await new Promise((k) => setTimeout(k, 0x64)));
      }
      const g = d["length"];
      (console["log"]("总共有\x20" + g + "\x20个商品"),
        ipcRenderer["send"]("get-goods-all-detail-total", {
          userId: b["userId"],
          total: g,
        }));
      const h = 0x14,
        i = Math["ceil"](g / h);
      if (c["length"] > 0x0) {
        const k = i === 0x1;
        await processKuaiyuBatchGoods(c, 0x1, b, k);
      }
      for (let l = 0x2; l <= i; l++) {
        try {
          const m = (l - 0x1) * h,
            n = await getGoodListSyncWithPagination(m, h);
          if (n && n["length"] > 0x0) {
            const o = l === i;
            await processKuaiyuBatchGoods(n, l, b, o);
          }
          await new Promise((p) => setTimeout(p, 0x3e8));
        } catch (p) {
          (console["error"]("获取第\x20" + l + "\x20页商品列表失败:", p),
            ipcRenderer["send"]("upload-server-log", {
              type: "error",
              message: "快语获取第\x20" + l + "\x20页商品列表失败:" + p,
            }));
        }
      }
      console["log"]("所有商品详情获取完成");
    } catch (q) {
      (ipcRenderer["send"]("upload-server-log", {
        type: "error",
        message: "快语获取全部商品详情时出错:" + q,
      }),
        console["error"]("获取全部商品详情时出错:", q));
    }
  }));
const goodsDetail = (a, b, c = 0x1) => {
  concurrentFetch(a)["then"](async (d) => {
    console["log"]("线程请求结果", d);
    let e = [];
    (d["forEach"]((f) => {
      console["log"]("item", f);
      const g = f["global"],
        h = f["data"];
      console["log"]("detailData", h);
      const i = h["mainImage"]["fields"]["detailValue"][0x0],
        j = g["itemId"],
        k = h["title"]["fields"]["detailValue"],
        l = h["goodsAttrs"]["fields"]["detailValue"][0x0]["list"],
        m =
          l?.["map"]((t) => ({
            propAlias: t["label"],
            propValue: t["value"],
          })) || [],
        n = m["map"]((t) => t["propAlias"] + ":\x20" + t["propValue"]),
        o = new Map();
      h["skuList"]["fields"]["detailValue"]["forEach"]((t) => {
        t["relationSpecificationList"]?.["forEach"]((u) => {
          const v = u["propName"];
          (!o["has"](v) && o["set"](v, new Set()), o["get"](v)["add"](u["propValueName"]));
        });
      });
      const p = Array["from"](o["entries"]())["map"](([t, u]) => {
          return t + ":" + Array["from"](u)["join"]("/");
        }),
        q = g["categoryNamePath"]["join"]("/"),
        r = h["decorate"]["fields"]["detailValue"];
      let s = {
        goodId: j,
        goodName: k,
        goodSku: p,
        goodCat: q,
        mainImage: i,
        detailImages: r,
        goodProperties: n,
      };
      (c == 0x1 && ((s["aiTaskId"] = b["aiTaskId"]), (s["type"] = b["type"]), (s["id"] = b["id"])),
        e["push"](s));
    }),
      ipcRenderer["send"]("get-goods-detail", e));
  });
};
async function sleep(a) {
  return new Promise((b) => setTimeout(b, a));
}
const startListenShopStatus = (a) => {
  const b = new MutationObserver(async (c) => {
    for (let d of c) {
      if (d["type"] === "characterData") {
        let e = d["target"]["nodeValue"]["trim"]();
        (e == "挂起" && (e = "忙碌"), ipcRenderer["send"]("shop-status-change", { status: e }));
      }
    }
  });
  b["observe"](a, {
    characterData: !![],
    subtree: !![],
    childList: !![],
    attributes: ![],
  });
};
async function concurrentFetch(a, b = 0x3) {
  b = Math["min"](b, a["length"]);
  const c = [];
  let d = 0x0;
  async function e(h, i = 0x3) {
    for (let j = 0x0; j <= i; j++) {
      console["log"]("开始请求商品", {
        productId: h["productId"],
        shopId: info["id"],
      });
      try {
        return await ipcRenderer["invoke"]("get-good-info", {
          goodId: h["productId"],
          platformShopId: info["id"],
        });
      } catch (k) {
        console["warn"]("请求失败（尝试\x20" + (j + 0x1) + "）：", k);
        if (j < i) await sleep(0x1f4 + j * 0x12c);
        else
          return {
            error: !![],
            product: h,
          };
      }
    }
  }
  async function f() {
    while (!![]) {
      const h = d++;
      if (h >= a["length"]) break;
      const i = a[h],
        j = await e(i);
      (console["log"]("请求结果======>", j), (c[h] = j), await sleep(0x1f4));
    }
  }
  const g = Array["from"]({ length: b }, () => f());
  return (await Promise["all"](g), c);
}
function formatDate(a) {
  const b = new Date(a),
    c = b["getFullYear"](),
    e = String(b["getMonth"]() + 0x1)["padStart"](0x2, "0"),
    f = String(b["getDate"]())["padStart"](0x2, "0");
  return c + "-" + e + "-" + f;
}
function formatKsAvgReplyDurManual(a) {
  const b = Math["floor"](a / 0x3e8);
  if (b < 0x3c) return b + "秒";
  else {
    const c = Math["floor"](b / 0x3c),
      d = b % 0x3c;
    return c + "分" + d + "秒";
  }
}
function generateDateRanges(a, b) {
  const c = new Date(a),
    d = new Date(b),
    e = Math["round"]((d - c) / (0x3e8 * 0x3c * 0x3c * 0x18)) + 0x1,
    f = new Date(c["getTime"]() - 0x18 * 0x3c * 0x3c * 0x3e8),
    g = new Date(f["getTime"]() - (e - 0x1) * 0x18 * 0x3c * 0x3c * 0x3e8),
    h = (i) => i["toISOString"]()["slice"](0x0, 0xa);
  return {
    currentStartDay: h(c),
    currentEndDay: h(d),
    compareStartDay: h(g),
    compareEndDay: h(f),
  };
}
(safeIpcOn("set-ai-to-human-reply", () => {
  const a = document["getElementsByClassName"]("LoginUserInfo-mainTitle-text")[0x0];
  a && ipcRenderer["send"]("set-ai-to-human-reply-customer", { messageId: a["textContent"] || "" });
}),
  safeIpcOn("init-goods", (a, b) => {
    getGoodListSync()["then"]((c) => {
      const d = c["map"]((e) => ({
        name: e["productName"],
        id: e["productId"],
        url: e["productImage"],
      }));
      ipcRenderer["send"]("init-goods", d);
    });
  }),
  safeIpcOn("init-shop-info", async (a, b) => {
    const c = await getGoodListSync();
    (console["log"]("init-shop-info", c),
      fetch("http://localhost:1121/render", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-cookie": cookieArrayToHeaderString(b),
        },
        body: JSON["stringify"]({
          isCopy: ![],
          itemId: c[0x0]["productId"],
          model: "detail",
          profileBiz: null,
          profileTopicId: null,
          step: 0x1,
        }),
      })
        ["then"]((d) => d["json"]())
        ["then"]((d) => {
          console["log"]("店铺信息", d);
          const e = {
            shopClass: d["data"]["global"]["categoryNamePath"]["map"]((f) => f)["join"]("/"),
            goodName: c[0x0]["productName"],
          };
          ipcRenderer["send"]("init-shop-info", e);
        })
        ["catch"]((d) => {
          console["error"]("获取最近使用分类失败:", d);
        }));
  }));
const selectinput = new MutationObserver(async (a) => {
  for (const b of a) {
    const c = b["target"]["querySelector"](".ImSearch-drop-panel-item");
    if (c)
      try {
        c["click"]();
        const d = document["querySelector"]("[contenteditable=\x22true\x22]");
        d["click"]();
      } catch (e) {
        console["log"]("搜索监听器error============", e);
      } finally {
        selectinput["disconnect"]();
      }
  }
});
(safeIpcOn("click-customer-message", async (a, b) => {
  console["log"]("点击发送消息按钮", b);
  if (b?.["userId"] || b?.["messageId"]) {
    (console["log"]("发送====="),
      window["postMessage"]({
        type: "select-user",
        data: b["userId"] || b["messageId"],
      }));
    return;
  }
  customerMessage = b;
  const c = document["querySelector"](".ant-tabs-nav-list");
  (c && c["querySelector"](".ant-tabs-tab\x20.ant-tabs-tab-btn")["click"](),
    setTimeout(async () => {
      const d = document["querySelector"](".new-workbench-container");
      let e = ![];
      if (d) {
        const f = document["querySelector"](".leftBottom");
        f["querySelector"](".tabs\x20>\x20.SessionTab\x20\x20.tabItem")["click"]();
        const g = f["querySelector"](".SessionListGroup-FolderSessions");
        let h = ![];
        for (let j = 0x0; j < g["children"]["length"]; j++) {
          if (g["children"][j]["children"]["length"] <= 0x1) {
            const k = g["children"][j]["querySelector"](".SessionListGroupItem-title\x20");
            k["click"]();
          } else {
            const l = g["children"][j]["querySelector"](".ant-checkbox-group");
            if (l) {
              const m = l["querySelectorAll"](".SessionStarCard");
              m["forEach"](async (n) => {
                if (
                  n["querySelector"](".SessionBaseCard-topHeadName")["textContent"] == b["username"]
                ) {
                  const o = n["querySelector"](".SessionBaseCard-Static");
                  (o["setAttribute"]("data-message-id", b["username"]),
                    o["click"](),
                    (h = !![]),
                    await delay(0x12c));
                  const p = document["querySelector"]("[contenteditable=\x22true\x22]");
                  (p["click"](), (e = !![]));
                }
              });
            }
          }
        }
        if ((!e && b["userId"]) || (!e && !b["userId"] && /^\d+$/["test"](b["username"]))) {
          const n = document["querySelector"](".ant-select-selection-search-input");
          if (n) {
            (n["focus"](),
              (n["value"] = b["userId"] || b["username"]),
              n["dispatchEvent"](new Event("input", { bubbles: !![] })));
            const o = await getElementRecursive(
              ".ant-select-dropdown-placement-bottomLeft",
              0x14,
              0x32,
            );
            selectinput["observe"](o, {
              childList: !![],
              characterData: !![],
              subtree: !![],
            });
          }
        }
      }
    }, 0x64));
}),
  safeIpcOn("change-shop-status", (a, b) => {
    console["log"]("change-shop-status=============>", b);
    const c = document["querySelector"](".statusTag");
    c &&
      setTimeout(() => {
        (c["click"](),
          setTimeout(() => {
            if (b === "online") {
              const d = document["getElementsByClassName"]("ant-menu-item-only-child")[0x0];
              d && d["click"]();
            } else {
              if (b === "offline") {
                const e = document["getElementsByClassName"]("ant-menu-item-only-child")[0x2];
                e &&
                  (e["click"](),
                  setTimeout(() => {
                    const f = document["querySelector"]("div.ant-modal-body");
                    if (f) {
                      const g = f["querySelector"]("button.ant-btn.ant-btn-primary");
                      g && g["click"]();
                    }
                  }, 0x3e8));
              } else {
                const f = document["getElementsByClassName"]("ant-menu-item-only-child")[0x1];
                f &&
                  (f["click"](),
                  setTimeout(() => {
                    const g = document["querySelector"]("div.ant-modal-body");
                    if (g) {
                      const h = g["querySelector"]("button.ant-btn.ant-btn-primary");
                      h && h["click"]();
                    }
                  }, 0x3e8));
              }
            }
          }, 0x1f4));
      }, 0x1f4);
  }),
  safeIpcOn("get-shop-status", () => {
    const a = document["querySelector"](".statusTag");
    if (a) {
      const b = a["textContent"]["trim"]() == "挂起" ? "忙碌" : a["textContent"]["trim"]();
      ipcRenderer["send"]("shop-status-change", { status: b });
    }
  }));
let isProcessing = ![];
safeIpcOn("reply-message", (a, b) => {
  console["log"]("兜底回复信息", b);
  try {
    let c = [];
    if (typeof b[0x0] === "object") c = [b[0x0]];
    else {
      const d = JSON["parse"](b);
      c = d;
    }
    (console["log"]("[reply-message]\x20解析后消息数量:", c, c["length"]), processNextMessage(c));
  } catch (f) {
    (console["error"]("[reply-message]\x20解析失败:", f),
      b["isBottomLineAutoReply"] && processNextMessage([b]));
  }
});
let tMessage = null;
async function processNextMessage(a) {
  const b = a["shift"]();
  tMessage = b;
  if (tMessage["userId"] && tMessage["content"] && info && info["kf"]) {
    if (tMessage?.["needOrder"] && tMessage?.["needOrder"] >= 0x3) {
      const c = await getOrderInfoByApi(tMessage["messageId"]);
      if (c) {
        ((tMessage["orderStatus"] = c["orderStatus"]),
          (tMessage["orderId"] = c["orderId"]),
          (tMessage["goodId"] = c["goodId"]),
          (tMessage["goodName"] = c["goodName"]));
        if (tMessage["goodId"]) {
          const d = await getGoodInfo(tMessage["goodId"]);
          (console["log"]("good============", d),
            d &&
              ((tMessage = {
                ...tMessage,
                ...d,
              }),
              console["log"]("obj=====>", tMessage)));
        }
      }
    }
    (sendImage(
      tMessage["imageBase64"],
      tMessage?.["userId"] || tMessage["messageId"],
      tMessage["imageUrl"],
    ),
      await sleep(0x1f4),
      window["postMessage"]({
        type: "send-message",
        data: {
          text: tMessage["replyContent"],
          targetType: 0x0,
          targetId: tMessage["userId"],
          extra: {
            device: 0x2,
            sellerId: info["kf"] || null,
            from: null,
            senderId: info["kf"] || null,
            senderUserId: info["kf"] || null,
            senderNickName: info["username"] || null,
            role: 0x3,
            realFromRole: 0x3,
            sourcePage: 0x0,
          },
        },
      }),
      setTimeout(async () => {
        let e = getMessageTotal();
        (ipcRenderer["send"]("get-message-total", e),
          ipcRenderer["send"]("get-customer-callback-result", {
            ...tMessage,
            isAiInviteReply: tMessage["isAiInviteReply"],
            isReminderReply: tMessage["isReminderReply"],
            isBottomLineAutoReply: tMessage["isBottomLineAutoReply"],
            isAiAutoReply: !tMessage["isBottomLineAutoReply"],
          }));
      }, 0x7d0));
    tMessage["isAiInviteReply"] &&
      tMessage["userId"] &&
      fetch("https://s.kwaixiaodian.com/gateway/business/cs/pc/invite/evaluation", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({ targetId: tMessage["userId"] }),
      })
        ["then"]((e) => e["json"]())
        ["then"]((e) => {
          e["result"] == 0x1 &&
            (console["log"]("邀评成功", e), inviteMap["set"](tMessage["userId"], !![]));
        });
    tMessage["isReminderReply"] &&
      tMessage["userId"] &&
      fetch("https://s.kwaixiaodian.com/gateway/business/cs/metadata/card/list/data/query", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          businessKey: "pc_goods_list",
          tenantKey: "merchant_cs",
          businessDataVersion: "9",
          params:
            "{\x22$LIMIT$\x22:10,\x22$OFF_SET$\x22:0,\x22$SKU_ID$\x22:\x220\x22,\x22$SEARCH_KEY_WORD$\x22:\x22\x22,\x22$BUYER_ID_STR$\x22:\x22" +
            tMessage["userId"] +
            "\x22,\x22$VIEW_TAB$\x22:2,\x22$MESSAGE_ID$\x22:0}",
        }),
      })
        ["then"]((e) => e["json"]())
        ["then"]((e) => {
          const { data: f } = e,
            g = JSON["parse"](f);
          if (g) {
            const { cardData: h } = g;
            if (h && h["length"] > 0x0) {
              const i = h[0x0]["Text_itemId@text"];
              (console["log"]("itemId", i),
                fetch("https://s.kwaixiaodian.com/gateway/business/cs/card/commodity/send", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON["stringify"]({
                    buyerId: tMessage["userId"],
                    commodityId: i,
                    sendScene: 0x2,
                    invitationExtra: {
                      folderId: 0x3,
                      source: 0x2,
                    },
                  }),
                }));
            }
          }
        });
    return;
  }
}
async function handleReplyMessage(a) {
  console["log"]("开始处理信息:", a);
  const b = document["querySelector"](".ant-tabs-nav-list");
  if (b) {
    (b["querySelector"](".ant-tabs-tab\x20.ant-tabs-tab-btn")["click"](), await delay(0x32));
    const c = document["querySelector"](".new-workbench-container");
    if (c) {
      const d = document["querySelector"](".leftBottom"),
        e = d["querySelector"](".tabs\x20>\x20.SessionTab\x20.tabItem");
      if (e) {
        e["click"]();
        const f = d["querySelector"](".SessionListGroup-FolderSessions"),
          g = document["querySelector"](".LoginUserInfo-mainTitle-text");
        if (g?.["textContent"] === a["username"]) {
          (console["log"]("找到用户"), await sendmessage(a));
          return;
        }
        let h = ![];
        for (let j = 0x0; j < f["children"]["length"]; j++) {
          if (f["children"][j]["children"]["length"] <= 0x1) {
            const m = f["children"][j]["querySelector"](".SessionListGroupItem-title");
            m["dispatchEvent"](clickEvent);
          }
          const k = f["children"][j]["querySelector"](".ant-checkbox-group");
          if (!k) continue;
          const l = k["querySelectorAll"](".SessionStarCard");
          for (const n of l) {
            const o = n["querySelector"](".SessionBaseCard-topHeadName");
            if (o?.["textContent"] === a["username"]) {
              h = !![];
              const p = n["querySelector"](".SessionBaseCard-Static");
              (p["dispatchEvent"](clickEvent), await sendmessage(a));
              return;
            }
          }
        }
        if (!h && a["userId"]) {
          (console["log"]("最终未找到用户\x20,启用搜索功能"),
            window["postMessage"]({
              type: "select-user",
              data: a["userId"],
            }));
          const q = await waitForTextMatch(
            ".LoginUserInfo-mainTitle-text",
            a["messageId"],
            0x14,
            0x32,
          );
          if (q == a["messageId"]) await sendmessage(a);
        }
      }
    }
  }
}
safeIpcOn("star", () => {
  const a = document["querySelector"](
    ".TargetUserHeader>\x20.LoginUserInfo\x20>\x20.LoginUserInfo-mainTitle\x20>.LoginUserInfo-mainTitle-text",
  );
  if (a) {
    const b = a["textContent"]["trim"](),
      c = document["querySelectorAll"](".SessionListGroupItem"),
      d = document["querySelector"](".AllSessionList-Sessions");
    if (c["length"] > 0x0) {
      let e = null;
      for (const f of c) {
        if (f["children"] && f["children"]["length"] >= 0x2) {
          for (const g of Array["from"](f["children"])) {
            if (g["className"] === "ant-checkbox-group") {
              const h = g["children"][0x0]["querySelectorAll"](".SessionStarCard");
              for (const i of h) {
                const j = i["innerText"]["split"]("\x0a")[0x0]["trim"]();
                if (j == b) {
                  ((e = i),
                    i["dispatchEvent"](
                      new MouseEvent("mouseover", {
                        bubbles: !![],
                        cancelable: !![],
                        view: window,
                      }),
                    ));
                  i["children"][0x1]
                    ? (i["children"][0x1]["children"][0x0]["dispatchEvent"](
                        new MouseEvent("mouseout", {
                          bubbles: !![],
                          cancelable: !![],
                          view: window,
                        }),
                      ),
                      i["children"][0x1]["children"][0x0]["dispatchEvent"](
                        new MouseEvent("mouseover", {
                          bubbles: !![],
                          cancelable: !![],
                          view: window,
                        }),
                      ),
                      waitForPopoverMenuAndClick(i["children"][0x1]["children"][0x0]))
                    : observeNodeInsert(i, (k) => {
                        (k["children"][0x0]["dispatchEvent"](
                          new MouseEvent("mouseover", {
                            bubbles: !![],
                            cancelable: !![],
                            view: window,
                          }),
                        ),
                          waitForPopoverMenuAndClick(k["children"][0x0], !![]));
                      });
                  break;
                }
              }
              if (e) break;
            }
          }
          if (e) break;
        }
      }
    } else {
      if (d) {
        const k = document["querySelectorAll"](".SessionStarCard");
        for (const l of k) {
          if (b == l["querySelector"](".SessionBaseCard-topHeadName")["textContent"]["trim"]()) {
            l["children"][0x0]["dispatchEvent"](
              new MouseEvent("mouseover", {
                bubbles: !![],
                cancelable: !![],
                view: window,
              }),
            );
            l["children"][0x1]
              ? (l["children"][0x1]["children"][0x0]["dispatchEvent"](
                  new MouseEvent("mouseout", {
                    bubbles: !![],
                    cancelable: !![],
                    view: window,
                  }),
                ),
                l["children"][0x1]["children"][0x0]["dispatchEvent"](
                  new MouseEvent("mouseover", {
                    bubbles: !![],
                    cancelable: !![],
                    view: window,
                  }),
                ),
                waitForPopoverMenuAndClick(l["children"][0x1]["children"][0x0]))
              : observeNodeInsert(l, (m) => {
                  (m["children"][0x0]["dispatchEvent"](
                    new MouseEvent("mouseover", {
                      bubbles: !![],
                      cancelable: !![],
                      view: window,
                    }),
                  ),
                    waitForPopoverMenuAndClick(m["children"][0x0], !![]));
                });
            break;
          }
        }
      }
    }
  }
});
function observeNodeInsert(a, b) {
  const c = new MutationObserver((d, e) => {
    for (const f of d) {
      for (const g of f["addedNodes"]) {
        if (g["nodeType"] === 0x1) {
          if (g["classList"]["contains"]("SessionStarCard-TagWrap")) {
            (e["disconnect"](), b(g));
            return;
          }
        }
      }
    }
  });
  c["observe"](a, {
    childList: !![],
    subtree: !![],
  });
}
function waitForPopoverMenuAndClick(a, b = ![]) {
  const c = document["body"],
    d = new MutationObserver((e, f) => {
      const g = document["querySelector"](".star-pop");
      if (g) {
        g["style"]["visibility"] = "hidden";
        if (b) {
          const h = document["querySelector"](".star-pop\x20ul\x20li");
          if (h) {
            (h["click"](),
              a["dispatchEvent"](
                new MouseEvent("mouseout", {
                  bubbles: !![],
                  cancelable: !![],
                  view: window,
                }),
              ),
              f["disconnect"]());
            return;
          }
        } else {
          const i = document["querySelector"](".star-pop\x20ul\x20li:last-child");
          if (i) {
            (i["click"](),
              a["dispatchEvent"](
                new MouseEvent("mouseout", {
                  bubbles: !![],
                  cancelable: !![],
                  view: window,
                }),
              ),
              f["disconnect"]());
            return;
          }
        }
      }
    });
  d["observe"](c, {
    childList: !![],
    subtree: !![],
  });
}
function waitForEditorToClear(a, b = 0xbb8) {
  return new Promise((c) => {
    const d = 0x64;
    let e = 0x0;
    const f = setInterval(() => {
      const g = a["innerText"]["trim"]() === "";
      ((g || e >= b) && (clearInterval(f), c(!![])), (e += d));
    }, d);
  });
}
const delay = (a) => new Promise((b) => setTimeout(b, a));
function debounce(a, b = 0x64, c = ![]) {
  let d = null;
  return function (...e) {
    const f = this;
    if (d) clearTimeout(d);
    if (c) {
      const g = !d;
      d = setTimeout(() => {
        d = null;
      }, b);
      if (g) a["apply"](f, e);
    } else
      d = setTimeout(() => {
        a["apply"](f, e);
      }, b);
  };
}
function cookieArrayToHeaderString(a) {
  return a["map"]((b) => b["name"] + "=" + b["value"])["join"](";\x20");
}
function extractNameAndId(a) {
  const b = a["match"](/"orderStatusDesc":"([^"]*)"/)?.[0x1] || null,
    c = a["match"](/"order_id":"?(\d+)"?/)?.[0x1] || null,
    d = a["match"](/"item_id":"?(\d+)"?/)?.[0x1] || null;
  return {
    ...(b && { orderStatusDesc: b }),
    ...(c && { orderid: c }),
    ...(d && { itemId: d }),
  };
}
(safeIpcOn("create-workorder", async (a, b) => {
  let c = [];
  try {
    const d = document["querySelector"]("#OrderListDom");
    if (!d) {
      ipcRenderer["send"]("get-create-workorder", []);
      return;
    }
    const e = d["querySelector"](".list");
    if (!e) {
      ipcRenderer["send"]("get-create-workorder", []);
      return;
    }
    const f = e["querySelectorAll"](".OrderCard");
    for (let g = 0x0; g < f["length"]; g++) {
      const h = f[g];
      try {
        const j = h["querySelector"](".oid"),
          k = h["querySelector"](".tag-first"),
          l = h["querySelector"](".itemTitle");
        if (!j || !k || !l) continue;
        const m = j["textContent"]["trim"](),
          n = k["textContent"]["trim"](),
          o = l["textContent"]["trim"]();
        let p = "",
          q = "",
          r = "",
          s = "",
          t = "",
          u = "";
        const v = h["querySelector"](".ant-collapse-item-active");
        if (v) {
          const x = h["querySelector"](".skuInfo\x20>\x20.skuContain\x20>\x20.sku");
          console["log"]("skuEl", x);
          x && (p = x["textContent"]["trim"]());
          const y = h["querySelector"](".receiver-value-wrapper\x20.receiver-value\x20>\x20span");
          y && (q = y["textContent"]["trim"]());
          const z = h["querySelector"](
            ".receiver-value-wrapper\x20.receiver-value\x20>\x20.content",
          );
          z && (r = z["textContent"]["trim"]());
          const A = h["querySelector"](".receiver-address");
          A && (s = A["textContent"]["trim"]());
          const B = v["querySelector"](
            ".consigneePackageListContain\x20\x20.consigneePackageListPackage",
          );
          if (B) {
            const C = B["textContent"]["trim"]();
            if (C) {
              const D = C["match"](/^(.+?)\s*([A-Za-z0-9]+)$/);
              ((t = D[0x1]), (u = D[0x2]));
            }
          }
        } else console["warn"]("订单\x20" + m + "：未找到详细信息");
        const w = {
          orderId: m,
          type: n,
          orderName: o,
          sku: p,
          name: q && r ? q + "\x20" + r : q || r || "",
          address: s,
          expressCompany: t,
          trackingNumber: u,
          expanded: !![],
        };
        c["push"](w);
      } catch (E) {
        console["error"]("处理第\x20" + (g + 0x1) + "\x20个订单时出错:", E);
        continue;
      }
    }
  } catch (F) {
    console["error"]("获取工单信息失败:", F);
  }
  ipcRenderer["send"]("get-create-workorder", c);
}),
  safeIpcOn("currnt-page", (a, b) => {
    _key = b;
    if (_key) {
      ipcRenderer["send"]("get-currnt-page", ![]);
      if (hearTimer) {
        const c = Date["now"]() - startTime;
        ((pausedTime = c), clearTimeout(hearTimer));
      }
    } else {
      if (pausedTime == 0x0) {
        _sendHeartbeat(currentInterval);
        return;
      }
      (HEARTBEAT_INTERVAL > pausedTime
        ? (currentInterval = HEARTBEAT_INTERVAL - pausedTime)
        : (currentInterval = pausedTime - HEARTBEAT_INTERVAL),
        _sendHeartbeat(currentInterval));
    }
  }));
const _sendHeartbeat = (a) => {
    ((startTime = Date["now"]()),
      clearTimeout(hearTimer),
      (hearTimer = setTimeout(async () => {
        if (_key && info) return;
        (await ipcRenderer["send"]("reload-page"), (a = 0x0), _sendHeartbeat());
      }, a || currentInterval)));
  },
  getGoodListSyncWithPagination = (a = 0x0, b = 0x14) => {
    return new Promise((c, d) => {
      fetch("https://s.kwaixiaodian.com/gateway/business/cs/metadata/card/list/data/query?", {
        credentials: "include",
        method: "POST",
        body: JSON["stringify"]({
          businessKey: "pc_goods_list",
          tenantKey: "merchant_cs",
          businessDataVersion: "9",
          params: JSON["stringify"]({
            $LIMIT$: b,
            $OFF_SET$: a,
            $SKU_ID$: "0",
            $SEARCH_KEY_WORD$: "",
            $BUYER_ID_STR$: shoperMessage["id"],
            $VIEW_TAB$: 0x1,
          }),
        }),
        headers: { "Content-Type": "application/json" },
      })
        ["then"]((e) => e["json"]())
        ["then"]((e) => {
          if (e["result"] === 0x1) {
            const f = JSON["parse"](e["data"]);
            c(
              f["cardData"]["map"]((g) => ({
                productName: g["Text_goodsTitle@text"],
                productId: g["Text_itemId@text"],
                productDescribe: g["HoverComponent_uvwzxl6389k@hoverContent"],
                productImage: g["Image_umikt4dxz8b@uri"],
              })),
            );
          } else d(e["msg"]);
        })
        ["catch"]((e) => {
          (console["error"]("获取商品列表失败:", e), d(e));
        });
    });
  };
async function processKuaiyuBatchGoods(a, b, c, d = ![]) {
  console["log"]("goodsItems", a);
  try {
    const e = a["map"]((h) => ({
        ...h,
        aiTaskId: c["aiTaskId"],
        type: c["type"],
        id: c["id"],
      })),
      f = await concurrentFetch(e, 0x3);
    let g = [];
    (f["forEach"]((h) => {
      console["log"]("item", h);
      const i = h["global"],
        j = h["data"],
        k = j["mainImage"]["fields"]["detailValue"][0x0],
        l = i["itemId"],
        m = j["title"]["fields"]["detailValue"],
        n = j["goodsAttrs"]["fields"]["detailValue"][0x0]["list"],
        o =
          n?.["map"]((v) => ({
            propAlias: v["label"],
            propValue: v["value"],
          })) || [],
        p = o["map"]((v) => v["propAlias"] + ":\x20" + v["propValue"]),
        q = new Map();
      j["skuList"]["fields"]["detailValue"]["forEach"]((v) => {
        v["relationSpecificationList"]?.["forEach"]((w) => {
          const x = w["propName"];
          (!q["has"](x) && q["set"](x, new Set()), q["get"](x)["add"](w["propValueName"]));
        });
      });
      const r = Array["from"](q["entries"]())["map"](([v, w]) => {
          return v + ":" + Array["from"](w)["join"]("/");
        }),
        s = i["categoryNamePath"]["join"]("/"),
        t = j["decorate"]["fields"]["detailValue"];
      let u = {
        goodId: l,
        goodName: m,
        goodSku: r,
        goodCat: s,
        mainImage: k,
        detailImages: t,
        goodProperties: p,
        aiTaskId: c["aiTaskId"],
        type: c["type"],
        id: c["id"],
      };
      (console["log"]("product==========》", u), g["push"](u));
    }),
      g["length"] > 0x0 && ipcRenderer["send"]("get-goods-detail", g),
      !d && (await new Promise((h) => setTimeout(h, 0x1388))));
  } catch (h) {
    (console["error"]("处理第\x20" + b + "\x20页时出错:", h),
      ipcRenderer["send"]("upload-server-log", {
        type: "error",
        message: "快语处理第\x20" + b + "\x20页时出错:" + h,
      }));
  }
}
(document["addEventListener"](
  "keydown",
  (a) => {
    if (a["key"] === "Enter" && !a["shiftKey"]) {
      const b = document["querySelector"](".SendBox-Editor\x20.ql-editor\x20p"),
        c = document["querySelector"](".LoginUserInfo-mainTitle-text");
      if (b) editCustomrMessage = b?.["textContent"]?.["trim"]() || "";
      c &&
        c["textContent"] &&
        editCustomrMessage &&
        ipcRenderer["send"]("reply-customer-message", {
          username: c["textContent"],
          content: editCustomrMessage,
          type: "dom",
        });
    }
  },
  !![],
),
  document["addEventListener"]("keyup", (a) => {
    a["key"] === "Enter" &&
      !a["shiftKey"] &&
      setTimeout(() => {
        editCustomrMessage = null;
      }, 0x3e8);
  }));
function parseTimeoutToTimestamp(a) {
  if (!a["endsWith"]("后超时")) return null;
  const b = Math["floor"](Date["now"]() / 0x3e8);
  let c = 0x0,
    d = 0x0;
  const e = a["match"](/(\d+)分(\d+)秒/),
    f = a["match"](/(\d+)分/),
    g = a["match"](/(\d+)秒/);
  if (e) ((c = parseInt(e[0x1], 0xa)), (d = parseInt(e[0x2], 0xa)));
  else {
    if (f) c = parseInt(f[0x1], 0xa);
    else {
      if (g) d = parseInt(g[0x1], 0xa);
      else return null;
    }
  }
  const h = c * 0x3c + d;
  return b + h;
}
async function waitForUsername(a, b = 0x1388) {
  return new Promise((c) => {
    const d = a["textContent"];
    let e = ![];
    if (!/^\d+$/["test"](d)) return c(d);
    const f = new MutationObserver((g) => {
      for (const h of g) {
        if (h["type"] == "characterData") {
          const i = h["target"];
          !/^\d+$/["test"](i["data"]) && ((e = !![]), f["disconnect"](), c(i["data"]));
        }
      }
    });
    (f["observe"](a, {
      childList: !![],
      characterData: !![],
      subtree: !![],
    }),
      setTimeout(() => {
        !e && (f["disconnect"](), c(d));
      }, b));
  });
}
safeIpcOn("update-shop-bot-status", (a, b) => {
  shopBotStatus = b["botStatus"];
});
function getOrderInfo() {
  return new Promise((a) => {
    (safeIpcOn("user-order-result", (b, c) => {
      console["log"]("kuaiyu-order-result___拦截到的信息\x20\x20\x20", c);
      try {
        if (c && c["data"]) {
          const { orderInfoList: d } = c["data"];
          if (d["length"] <= 0x0) return;
          const f = d[0x0],
            { orderBaseInfo: g } = f,
            {
              payTime: h,
              orderStatusTag: { text: i },
            } = g;
          h + weekTime > Date["now"]() && a(i);
        }
      } catch (j) {
        a(null);
      }
    }),
      setTimeout(() => a(null), 0x1388));
  });
}
async function getElementRecursive(a, b = 0x1e, c = 0x64) {
  const d = document["body"]["querySelector"](a);
  if (d) return d;
  if (b <= 0x1) return null;
  return (await new Promise((e) => setTimeout(e, c)), getElementRecursive(a, b - 0x1, c));
}
function parseFullTime(a) {
  if (!a) return null;
  const [b, c] = a["split"]("\x20");
  if (!b || !c) return null;
  const [d, e] = b["split"]("-")["map"](Number),
    [f, g, h] = c["split"](":")["map"](Number);
  return {
    month: d,
    day: e,
    hour: f,
    minute: g,
    second: h,
    datePart: b,
  };
}
function calculateInquiryTime(a) {
  const b = parseFullTime(a);
  if (!b) return null;
  let { month: c, day: d, hour: e, minute: f, second: g, datePart: h } = b;
  g += 0x1;
  g >= 0x3c &&
    ((g = 0x0), (f += 0x1), f >= 0x3c && ((f = 0x0), (e += 0x1), e >= 0x18 && (e = 0x0)));
  const i = e["toString"]()["padStart"](0x2, "0"),
    j = f["toString"]()["padStart"](0x2, "0"),
    k = g["toString"]()["padStart"](0x2, "0");
  return h + "\x20" + i + ":" + j + ":" + k;
}
function getCustomerId() {
  try {
    const a = document["querySelector"](".ChatMessageList-ContentWrap");
    if (!a) return "";
    const b = a["querySelector"]("div[id^=\x220_\x22]");
    if (!b || !b["id"]) return "";
    const c = b["id"]["split"]("_");
    return c["length"] >= 0x3 ? c[0x1]["trim"]() : "";
  } catch (d) {
    return (console["warn"]("获取客户ID失败:", d), "");
  }
}
function getCustomerName() {
  try {
    const a = document["querySelector"](".LoginUserInfo-mainTitle-text");
    return a ? a["textContent"]["trim"]() : "";
  } catch (b) {
    return (console["warn"]("获取客户名称失败:", b), "");
  }
}
function detectSender(a) {
  try {
    const b = a["querySelector"](".kwaishop-cs-BizNoticeCard");
    if (b) return "user";
    const c = a["querySelector"](".kwaishop-cs-LayoutDefaultWrapper_lrWrapper");
    if (c) {
      if (c["classList"]["contains"]("kwaishop-cs-LayoutDefaultWrapper__isMine")) {
        const e = a["textContent"];
        if (e["includes"]("立省") || e["includes"]("券后价") || e["includes"]("支持新人特权"))
          return "unknown";
        return "assistant";
      }
      if (c["classList"]["contains"]("kwaishop-cs-LayoutDefaultWrapper__notMe")) return "user";
    }
    const d = a["querySelector"](".kwaishop-cs-bizBuyerFromCard");
    return d ? "unknown" : "unknown";
  } catch (f) {
    return (console["warn"]("判断发送者失败:", f), "unknown");
  }
}
const getKsOrderStatus = () => {
  try {
    const a = [],
      b = document["querySelectorAll"](".OrderCard");
    return (
      b["forEach"]((c) => {
        const d = c["querySelector"](".pay-tag");
        if (d) {
          const e = c["querySelector"](".oid"),
            f = e ? e["innerText"]["trim"]() : "未知订单号",
            g = c["querySelectorAll"](".tag-contain\x20.order-tag,\x20.order-tag-last");
          let h = "未知状态";
          (g["length"] > 0x0 &&
            (h = Array["from"](g)
              ["map"]((i) => i["innerText"]["trim"]()["replace"](/\s+/g, "\x20"))
              ["join"]("\x20")),
            f !== "未知订单号" &&
              a["push"]({
                orderId: f,
                status: h,
              }));
        }
      }),
      a
    );
  } catch (c) {
    return (console["error"]("快手订单提取脚本执行出错：", c), []);
  }
};
function triggerInput(a, b) {
  (a["focus"](), (a["innerHTML"] = "<p>" + b + "</p>"));
  const c = new InputEvent("input", {
    bubbles: !![],
    inputType: "insertText",
    data: b,
  });
  a["dispatchEvent"](c);
  const d = new KeyboardEvent("keyup", {
    bubbles: !![],
    key: "Enter",
  });
  a["dispatchEvent"](d);
}
const sendmessage = async (a) => {
  await delay(0x3e8);
  const b = document["querySelector"](".SendBox"),
    c = b["querySelector"](".SendBox-Editor\x20.ql-editor");
  if (!c) return;
  if (a["imageBase64"] || a["imageUrl"])
    try {
      (await sendImageMessage(a["messageId"], a["imageBase64"], a["imageMimeType"], a["imageUrl"]),
        await delay(0x1f4));
    } catch (f) {
      console["error"]("[sendmessage]\x20图片发送失败:", f);
    }
  if (a["isImageOnly"]) return;
  if (!a["content"] || a["content"]["trim"]() === "") return;
  (triggerInput(c, a["content"]), await delay(0x64));
  const d = b["querySelector"](".SendBox-buttonRight\x20.ant-btn-primary");
  d && !d["disabled"]
    ? d["click"]()
    : (c["dispatchEvent"](
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: !![],
        }),
      ),
      c["dispatchEvent"](
        new KeyboardEvent("keyup", {
          key: "Enter",
          bubbles: !![],
        }),
      ));
  const e = await waitForEditorToClear(c);
  e
    ? console["log"]("编辑框清空==========>", a["content"])
    : console["log"]("编辑框未清空==========>", a["content"]);
};
safeIpcOn("goto-human-reply", async (a, b) => {
  const c = document["querySelector"](
    "img[src*=\x22icon-session-transfer\x22][style*=\x22grayscale\x22]",
  );
  if (c) {
    (c["click"](), await ms_delay(0xbb8));
    const d = document["querySelector"]("input[placeholder=\x22请输入客服昵称\x22]");
    if (d) {
      ((d["value"] = b["subAccount"]),
        d["dispatchEvent"](new Event("input", { bubbles: !![] })),
        d["dispatchEvent"](new Event("change", { bubbles: !![] })),
        await ms_delay(0xbb8));
      const e = document["querySelector"](".ant-modal-body");
      if (e) {
        const f = document["querySelector"](".ant-btn.ant-btn-link.ant-btn-block");
        if (f) {
          (console["log"]("confirmButton", f), f["click"](), await ms_delay(0x3e8));
          const g = document["querySelector"](".ant-popover-inner-content");
          if (g) {
            const h = document["querySelectorAll"](".reasonList\x20.reasonItem");
            for (const i of h) {
              if (i["textContent"]["includes"]("无原因直接转移")) {
                const j = i["querySelector"]("button.reasonItem-button");
                j && (j["click"](), console["log"]("已点击‘无原因直接转移’的发送按钮"));
              }
            }
          }
          console["log"]("已点击弹框中的‘确定’按钮");
          return;
        }
      }
    }
  }
});
async function waitForTextMatch(a, b, c = 0x1e, d = 0x64) {
  while (c-- > 0x0) {
    const e = document["querySelector"](a),
      f = e?.["textContent"]?.["trim"]();
    if (f && f === b) return f;
    await new Promise((g) => setTimeout(g, d));
  }
  return null;
}
const HOOK_CODE = function () {
  const a = window["WebSocket"];
  let b = 0x0;
  ((window["__wsState"] = -0x1),
    (window["WebSocket"] = function (c, d) {
      const e = new a(c, d),
        f = e["send"];
      return (
        (e["send"] = function (g) {
          f["apply"](this, arguments);
        }),
        e["addEventListener"]("error", function (g) {
          console["log"]("wss断开");
        }),
        e["addEventListener"]("open", function (g) {
          console["log"]("打开ws");
        }),
        e["addEventListener"]("close", function (g) {
          console["log"]("WebSocket连接关闭");
        }),
        e
      );
    }));
};
(webFrame["executeJavaScript"]("(" + HOOK_CODE + ")();"),
  safeIpcOn("send-image-message", async (a, b) => {
    console["log"]("[图片发送]\x20收到图片发送请求:", b);
    const { messageId: c, imageBase64: d, imageMimeType: e, imageUrl: f } = b;
    try {
      (await sendImageMessage(c, d, e, f), console["log"]("[图片发送]\x20图片发送成功"));
    } catch (g) {
      console["error"]("[图片发送]\x20图片发送失败:", g);
    }
  }));
async function sendImageMessage(a, b, c, d) {
  const e = document["querySelector"](".SendBox"),
    f = e?.["querySelector"](".SendBox-Editor\x20.ql-editor");
  if (!f) return (console["error"]("[图片发送]\x20未找到编辑框"), ![]);
  let g = "";
  if (b && c) g = "data:" + c + ";base64," + b;
  else {
    if (d) {
      const k = await fetch(d);
      if (!k["ok"]) throw new Error("下载图片失败:\x20" + k["status"]);
      const l = await k["blob"]();
      g = await new Promise((m, n) => {
        const o = new FileReader();
        ((o["onloadend"] = () => m(o["result"])),
          (o["onerror"] = () => n(new Error("读取图片失败"))),
          o["readAsDataURL"](l));
      });
    } else return (console["error"]("[图片发送]\x20缺少图片数据"), ![]);
  }
  const h = document["createElement"]("img");
  h["src"] = g;
  let i = f["querySelector"]("p");
  !i && ((i = document["createElement"]("p")), f["appendChild"](i));
  ((i["innerHTML"] = ""),
    i["appendChild"](h),
    f["dispatchEvent"](new Event("input", { bubbles: !![] })),
    await delay(0xc8));
  const j = e["querySelector"](".SendBox-buttonRight\x20.ant-btn-primary");
  return (
    j && !j["disabled"]
      ? (j["click"](), console["log"]("[图片发送]\x20点击发送按钮"))
      : (f["dispatchEvent"](
          new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: !![],
          }),
        ),
        f["dispatchEvent"](
          new KeyboardEvent("keyup", {
            key: "Enter",
            bubbles: !![],
          }),
        ),
        console["log"]("[图片发送]\x20触发回车发送")),
    await delay(0x12c),
    console["log"]("[图片发送]\x20图片发送完成"),
    !![]
  );
}
safeIpcOn("get-after-sale-total-order", async (a, b) => {
  const c = b;
  try {
    const d = new Date(c["info"]["month"][0x0]);
    d["setHours"](0x0, 0x0, 0x0, 0x0);
    const e = new Date(c["info"]["month"][0x1]);
    e["setHours"](0x17, 0x3b, 0x3b, 0x3e7);
    const f = d["getTime"](),
      g = e["getTime"](),
      h = await fetch(
        "https://s.kwaixiaodian.com/rest/pc/aftersales/schema/refund/list/pagination?caver=2",
        {
          method: "post",
          mode: "cors",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON["stringify"]({
            applyTimeRange: [f, g],
            limit: 0x14,
            offset: 0x0,
            sortWay: 0x3,
          }),
        },
      )["then"]((o) => o["json"]()),
      i = await fetch(
        "https://s.kwaixiaodian.com/rest/pc/aftersales/schema/refund/list/pagination?caver=2",
        {
          method: "post",
          mode: "cors",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON["stringify"]({
            boolCondition: [],
            applyTimeRange: [f, g],
            limit: 0x14,
            offset: 0x0,
            sortWay: 0x3,
            handlingWay: 0x14,
          }),
        },
      )["then"]((o) => o["json"]()),
      j = await fetch("https://s.kwaixiaodian.com/gateway/business/cs/issue/search", {
        method: "post",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          pageNum: 0x1,
          pageSize: 0xa,
          searchCondition: {
            createTime: "[" + f + "," + g + "]",
            quickFilter: 0x2,
          },
        }),
      })["then"]((o) => o["json"]()),
      k = h["data"]?.["total"] || 0x0,
      l = i["data"]?.["total"] || 0x0,
      m = j["data"]?.["total"] || 0x0,
      n = k - l + m;
    ipcRenderer["send"]("get-after-sale-total-order-result", {
      applyCount: k,
      refundOnlyCount: l,
      workOrderCount: m,
      realCount: n,
      id: c["info"]["id"],
    });
  } catch (o) {
    (console["log"]("error", o),
      ipcRenderer["send"]("web-scoker-error-callback", {
        info: c,
        errormsg: "查询月总工单失败,失败原因:" + JSON["stringify"](o),
        shopId: c["info"]?.["shopId"],
      }));
  }
});
const windowOnMessageHandler = async (a) => {
    if (!a?.["data"]?.["type"]) return;
    if (a["data"]["type"] === "report-call") {
      console["log"]("收到\x20report\x20调用:", a["data"]["args"]);
      return;
    }
    if (a["data"]["type"] === "WS_STATE_CHANGE") {
      wsConnectState = a["data"]["state"];
      return;
    }
    if (a["data"]["type"] == "get-message") {
      const b = a["data"]["data"];
      console["log"]("sendMessage>>>>>>", b);
      if (["2", "5"]["includes"](a["data"]["key"]) && a["data"]["msgType"] == "update") {
        b["timeout"] = Math["floor"](b["timeout"] / 0x3e8) + 0xb4;
        if (b["msgType"] == "mp4") b["content"] = "用户发送了视频";
        else b["msgType"] == "img" && (b["content"] = "用户发送了图片");
        if (shopBotStatus == 0x1) {
          let c = ![];
          if (b["goodId"]) b["content"] = "用户发送商品";
          else b["orderId"] && (b["content"] = "用户发送订单");
        }
        ((b["type"] = "code"), ipcRenderer["send"]("get-customer-message-list", [b]));
      } else {
        if (["3", "4"]["includes"](a["data"]["key"]) && a["data"]["msgType"] == "update") {
          const d = b?.["messageId"] ?? b?.["userId"];
          editCustomrMessage
            ? ipcRenderer["send"]("reply-customer-message", {
                messageId: b?.["messageId"],
                content: b?.["content"],
                type: "ksdel1",
              })
            : ipcRenderer["send"]("reply-customer-message", {
                messageId: b?.["messageId"],
                content: b?.["content"],
                compensate: !![],
                type: "ksdel2",
              });
          let e = await getMessageTotal();
          if (e) ipcRenderer["send"]("get-message-total", e);
        }
      }
      return;
    }
  },
  getGoodbyOrderId = async (a, b) => {
    const c = await fetch("https://s.kwaixiaodian.com/gateway/business/cs/order/list?caver=2", {
      method: "post",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON["stringify"]({
        buyerId: a,
        itemTitle: "",
        limit: 0xa,
        offset: 0x0,
        oid: b,
        orderStatus: 0x0,
        searchCondition: null,
        grayMap: { aftersaleIssue: "true" },
      }),
    })["then"]((d) => d["json"]());
    if (c["result"] != 0x1) return null;
    return (
      {
        goodId: c?.["data"]?.["orderInfoList"][0x0]?.["itemAndPriceInfo"]?.["itemId"],
        orderStatus:
          c?.["data"]?.["orderInfoList"][0x0]?.["orderBaseInfo"]?.["orderStatusTag"]?.["text"],
      } || null
    );
  };
window["addEventListener"]("message", windowOnMessageHandler);
const getMessageTotal = () => {
    const a = document["querySelectorAll"](".SessionListGroupItem-count");
    let b = 0x0,
      c = 0x0;
    return (
      a["length"] > 0x0 &&
        (a[0x0]["textContent"] && (b = getnum(a[0x0]["textContent"])),
        a[0x1]["textContent"] && (c = getnum(a[0x1]["textContent"]))),
      b + c
    );
  },
  getnum = (a) => {
    const b = a["match"](/[\(（](\d+)[\)）]/);
    if (b) {
      const c = b ? Number(b[0x1]) : 0x0;
      return c;
    }
    return 0x0;
  };
class DB {
  constructor() {
    ((this["db"] = null),
      (this["DB_NAME"] = "AIREPLY"),
      (this["STORE_NAME"] = "value"),
      (this["VERSION"] = 0x2));
  }
  async ["init"]() {
    if (this["db"]) return this["db"];
    return (
      (this["db"] = await new Promise((a, b) => {
        const c = indexedDB["open"](this["DB_NAME"], this["VERSION"]);
        ((c["onupgradeneeded"] = (d) => {
          const e = d["target"]["result"],
            f = d["target"]["transaction"];
          if (!e["objectStoreNames"]["contains"](this["STORE_NAME"])) {
            const g = e["createObjectStore"](this["STORE_NAME"], { keyPath: "messageId" });
            (g["createIndex"]("timestamp", "timestamp", { unique: ![] }),
              console["log"]("创建对象存储和索引"));
          } else {
            const h = f["objectStore"](this["STORE_NAME"]);
            !h["indexNames"]["contains"]("timestamp") &&
              (h["createIndex"]("timestamp", "timestamp", { unique: ![] }),
              console["log"]("创建\x20timestamp\x20索引"));
          }
        }),
          (c["onsuccess"] = () => {
            (console["log"]("数据库连接成功"), a(c["result"]));
          }),
          (c["onerror"] = () => {
            (console["error"]("数据库连接失败", c["error"]), b(c["error"]));
          }));
      })),
      this["db"]
    );
  }
  async ["save"](a) {
    if (!a?.["messageId"]) throw new Error("IDB:\x20messageId\x20不能为空");
    !a["timestamp"] && (a["timestamp"] = Date["now"]());
    const b = await this["init"]();
    return new Promise((c, d) => {
      const e = b["transaction"](this["STORE_NAME"], "readwrite"),
        f = e["objectStore"](this["STORE_NAME"]),
        g = f["put"](a);
      ((g["onsuccess"] = () => c(!![])), (g["onerror"] = () => d(g["error"])));
    });
  }
  async ["get"](a) {
    if (!a) return null;
    const b = await this["init"]();
    return new Promise((c, d) => {
      const e = b["transaction"](this["STORE_NAME"], "readonly"),
        f = e["objectStore"](this["STORE_NAME"]),
        g = f["get"](a);
      ((g["onsuccess"] = () => c(g["result"] || null)), (g["onerror"] = () => d(g["error"])));
    });
  }
  async ["delete"](a) {
    if (!a) return null;
    const b = await this["init"]();
    return new Promise((c, d) => {
      const e = b["transaction"](this["STORE_NAME"], "readwrite"),
        f = e["objectStore"](this["STORE_NAME"]),
        g = f["delete"](a);
      ((g["onsuccess"] = () => c(!![])), (g["onerror"] = () => d(g["error"])));
    });
  }
  async ["deleteExpired"](a = 0x2) {
    const b = await this["init"](),
      c = Date["now"]() - a * 0x18 * 0x3c * 0x3c * 0x3e8;
    return new Promise((d, e) => {
      const f = b["transaction"](this["STORE_NAME"], "readwrite"),
        g = f["objectStore"](this["STORE_NAME"]);
      if (!g["indexNames"]["contains"]("timestamp")) {
        (console["warn"]("timestamp\x20索引不存在，使用遍历方式删除"),
          this["deleteExpiredByTraversal"](a, f, g, d, e));
        return;
      }
      const h = g["index"]("timestamp"),
        i = IDBKeyRange["upperBound"](c),
        j = h["openCursor"](i);
      let k = 0x0;
      const l = [];
      ((j["onsuccess"] = (m) => {
        const n = m["target"]["result"];
        if (n) (l["push"](n["value"]["messageId"]), n["continue"]());
        else {
          if (l["length"] === 0x0) {
            d({
              deletedCount: 0x0,
              message: "没有过期数据",
            });
            return;
          }
          let o = 0x0;
          l["forEach"]((p) => {
            const q = g["delete"](p);
            ((q["onsuccess"] = () => {
              (o++,
                k++,
                o === l["length"] &&
                  d({
                    deletedCount: k,
                    message: "成功删除\x20" + k + "\x20条过期数据",
                  }));
            }),
              (q["onerror"] = (r) => {
                (o++,
                  console["error"]("删除失败", p, r),
                  o === l["length"] &&
                    d({
                      deletedCount: k,
                      message: "成功删除\x20" + k + "\x20条过期数据（部分失败）",
                      error: r,
                    }));
              }));
          });
        }
      }),
        (j["onerror"] = () => e(j["error"])));
    });
  }
  async ["deleteExpiredByTraversal"](a, b, c, d, e) {
    const f = Date["now"]() - a * 0x18 * 0x3c * 0x3c * 0x3e8,
      g = c["openCursor"]();
    let h = 0x0;
    const i = [];
    ((g["onsuccess"] = (j) => {
      const k = j["target"]["result"];
      if (k) {
        const l = k["value"];
        (l["timestamp"] && l["timestamp"] < f && i["push"](l["messageId"]), k["continue"]());
      } else {
        if (i["length"] === 0x0) {
          d({
            deletedCount: 0x0,
            message: "没有过期数据",
          });
          return;
        }
        let m = 0x0;
        i["forEach"]((n) => {
          const o = c["delete"](n);
          ((o["onsuccess"] = () => {
            (m++,
              h++,
              m === i["length"] &&
                d({
                  deletedCount: h,
                  message: "成功删除\x20" + h + "\x20条过期数据（降级模式）",
                }));
          }),
            (o["onerror"] = (p) => {
              (m++,
                console["error"]("删除失败", n, p),
                m === i["length"] &&
                  d({
                    deletedCount: h,
                    message: "成功删除\x20" + h + "\x20条过期数据（部分失败）",
                  }));
            }));
        });
      }
    }),
      (g["onerror"] = () => e(g["error"])));
  }
  async ["getExpired"](a = 0x2) {
    const b = await this["init"](),
      c = Date["now"]() - a * 0x18 * 0x3c * 0x3c * 0x3e8;
    return new Promise((d, e) => {
      const f = b["transaction"](this["STORE_NAME"], "readonly"),
        g = f["objectStore"](this["STORE_NAME"]);
      if (!g["indexNames"]["contains"]("timestamp")) {
        const l = g["openCursor"](),
          m = [];
        ((l["onsuccess"] = (n) => {
          const o = n["target"]["result"];
          o
            ? (o["value"]["timestamp"] && o["value"]["timestamp"] < c && m["push"](o["value"]),
              o["continue"]())
            : d(m);
        }),
          (l["onerror"] = () => e(l["error"])));
        return;
      }
      const h = g["index"]("timestamp"),
        i = IDBKeyRange["upperBound"](c),
        j = h["openCursor"](i),
        k = [];
      ((j["onsuccess"] = (n) => {
        const o = n["target"]["result"];
        o ? (k["push"](o["value"]), o["continue"]()) : d(k);
      }),
        (j["onerror"] = () => e(j["error"])));
    });
  }
}
async function getOrderInfoByApi(a) {
  const b = await fetch("https://s.kwaixiaodian.com/gateway/business/cs/order/list", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON["stringify"]({
      buyerId: a,
      limit: 0xa,
    }),
  })["then"]((h) => h["json"]());
  console["log"]("res============", b);
  if (b["result"] !== 0x1) return null;
  const c = b["data"]?.["orderInfoList"];
  if (!c?.["length"]) return null;
  const d = c[0x0],
    e = d?.["itemAndPriceInfo"]?.["itemId"] ?? "",
    f = d?.["orderBaseInfo"]?.["topTagList"],
    g = Array["isArray"](f) ? f["map"]((h) => h["text"])["join"](",") : "";
  return {
    orderStatus: g,
    goodId: e,
  };
}
const getGoodInfo = async (a) => {
  try {
    const b = await fetch("https://s.kwaixiaodian.com/rest/pc/product/manage/item/publish/render", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          step: 0x1,
          model: "detail",
          itemId: a,
          isCopy: ![],
          profileBiz: null,
          profileTopicId: null,
        }),
      })["then"]((d) => d["json"]()),
      c = {
        goodId: a,
        goodName: "",
        sku: "",
        goodCat: "",
        goodInfo: "",
      };
    if (b["result"] == 0x1) {
      const d = b["data"]["data"];
      d &&
        ((c["goodName"] = d["title"]["fields"]["detailValue"]),
        (c["sku"] = d["skuList"]["fields"]["detailValue"]
          ["map"]((f) => f["specification"])
          ["join"](",")),
        d["goodsAttrs"]["fields"]["detailValue"][0x0]["list"]["map"]((f) => {
          c["goodCat"] += f["label"] + ":" + f["value"] + ",";
        }),
        (c["goodInfo"] = c?.["goodName"] + c?.["goodCat"] + c?.["sku"]),
        console["log"]("product\x20=====", c));
    }
    return c;
  } catch (f) {
    return (console["log"]("数据抓取失败", f), null);
  }
};
ipcRenderer["on"]("paste-to-shop", (a, b) => {
  const c = document["querySelector"](".SendBox-Editor\x20.ql-editor");
  if (!c) return;
  ((c["innerHTML"] = "<p>" + b + "</p>"),
    c["dispatchEvent"](new Event("input", { bubbles: !![] })));
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
const base64ToImageObject = (a, b = "image.png") => {
    const [c, d] = a["split"](","),
      e = c["match"](/:(.*?);/)[0x1],
      f = atob(d),
      g = f["length"],
      h = new ArrayBuffer(g),
      j = new Uint8Array(h);
    for (let k = 0x0; k < g; k++) {
      j[k] = f["charCodeAt"](k);
    }
    return {
      fileName: b,
      arrayBuffer: h,
      mimeType: e,
    };
  },
  getImageSize = (a) => {
    return new Promise((b, c) => {
      const d = new Image();
      ((d["onload"] = () => {
        b({
          width: d["width"],
          height: d["height"],
        });
      }),
        (d["onerror"] = c),
        (d["src"] = a));
    });
  },
  sendImage = async (a, b, c) => {
    if (!b || (!a && !c)) return;
    let d = a;
    if (!d && c) {
      const i = await fetch(c);
      if (!i["ok"]) throw new Error("下载图片失败:\x20" + i["status"]);
      const j = await i["blob"]();
      d = await new Promise((k, l) => {
        const m = new FileReader();
        ((m["onloadend"] = () => k(m["result"])),
          (m["onerror"] = () => l(new Error("读取图片失败"))),
          m["readAsDataURL"](j));
      });
    }
    const e = base64ToImageObject(d),
      { width: f, height: g } = await getImageSize(d),
      h = {
        targetType: 0x0,
        targetId: b,
        image: e,
        width: f,
        height: g,
        extra: {
          device: 0x2,
          sellerId: info["kf"],
          from: null,
          senderId: info["kf"],
          senderUserId: info["kf"],
          senderNickName: info["id"],
          role: 0x3,
          realFromRole: 0x3,
          sourcePage: 0x0,
        },
      };
    window["postMessage"]({
      type: "send-image",
      data: h,
    });
  },
  starUpdata = (a, b) => {
    window["postMessage"]({
      type: "user-star",
      data: {
        userId: a,
        type: b,
      },
    });
  };
(safeIpcOn("ai-transfer-human-mark", (a, b) => {
  (console["log"]("AI转人工星标", b), starUpdata(b["userId"], 0x1));
}),
  ipcRenderer["on"]("heartbeat", () => {
    ipcRenderer["send"]("web-heartbeat-ping");
  }));
