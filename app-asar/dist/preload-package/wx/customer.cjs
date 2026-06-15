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
contextBridge["exposeInMainWorld"]("context_bridge", {
  send: (a, b) => ipcRenderer["send"](a, b),
  invoke: (a, b) => ipcRenderer["invoke"](a, b),
});
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
  ipcRenderer["send"]("write-preload-error-log", {
    shopName: shop_Name || "未知店铺",
    platform: "wx",
    errorMessage: a + ":\x20" + getReadableErrorMessage(b),
    time: new Date()["toLocaleString"]("zh-CN", { hour12: ![] }),
  });
}
let mainUrl = "https://store.weixin.qq.com/",
  isUserOperating = ![],
  lastMouseActivity = 0x0,
  windowHasFocus = ![],
  userActivityTimer = null,
  USER_ACTIVITY_TIMEOUT = 0xbb8;
const threeMinResponse = 0x3 * 0x3c * 0x3e8;
let shopBotStatus = null,
  key = null,
  allProducts = [],
  allCategories = [],
  is_key = null,
  ordersKeyValue = null,
  wsConnectState = -0x1;
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
let shop_Name = null;
const url = window["location"]["href"];
if (url["includes"](mainUrl + "shop/home")) {
  console["log"]("跳转客服页面");
  const { shopName } = getHttpAccountPassword();
  window["location"]["replace"](mainUrl + "shop/kf?shopName=" + shopName);
}
if (url["includes"](mainUrl + "shop/kf")) {
  const { shopName } = getHttpAccountPassword();
  shop_Name = shopName;
}
window["addEventListener"]("load", () => {
  if (document["cookie"]) {
    const c = document["cookie"]["split"]("=");
    c && (key = c[0x1]);
  }
  (console["log"]("key==============", key),
    window["postMessage"](
      {
        type: "get-key",
        value: key,
      },
      "*",
    ),
    setTimeout(() => {
      ipcRenderer["send"]("request-shop-bot-status");
    }, 0x3e8));
  const a = document["querySelector"](".login__type__container");
  a && (console["log"]("登录过期", a), ipcRenderer["send"]("account-login-expired"));
  ipcRenderer["send"]("get-shop-page-loaded");
  const b = document["createElement"]("style");
  (b["setAttribute"]("data-disable-anim", "true"),
    (b["innerHTML"] =
      "\x0a\x20\x20\x20\x20*,\x0a\x20\x20\x20\x20*::before,\x0a\x20\x20\x20\x20*::after\x20{\x0a\x20\x20\x20\x20\x20\x20animation-delay:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20animation-duration:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20animation-iteration-count:\x201\x20!important;\x0a\x20\x20\x20\x20\x20\x20transition-duration:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20transition-delay:\x200.01ms\x20!important;\x0a\x20\x20\x20\x20\x20\x20scroll-behavior:\x20auto\x20!important;\x0a\x20\x20\x20\x20}\x0a\x20\x20"),
    document["head"]?.["appendChild"](b),
    console["log"]("微信小店页面加载完成"),
    url["includes"](mainUrl + "shop/kf") && threeMinResponseTime());
});
const HOOK_CODE = (a) => {
  let b = null;
  window["addEventListener"]("message", (s) => {
    s["data"]["type"] == "update-shop-bot-status" && (b = s["data"]["data"]);
  });
  const c = (s) => {
      const t = Date["now"](),
        u = t - 0x2 * 0x18 * 0x3c * 0x3c * 0x3e8;
      return s * 0x3e8 < u;
    },
    d = (s) => {
      return new Promise((t, u) => {
        const v = s["split"](",")[0x1],
          w = Math["ceil"]((v["length"] * 0x3) / 0x4),
          x = new Image();
        ((x["onload"] = () => {
          t({
            width: x["width"],
            height: x["height"],
            size: w,
            sizeKB: (w / 0x400)["toFixed"](0x2) + "\x20KB",
          });
        }),
          (x["onerror"] = u),
          (x["src"] = s));
      });
    },
    e = async (s, t, u) => {
      console["log"]("发送图片", s, t, u);
      if (!u || !t || !s) return;
      const v = await d(s);
      console["log"]("图片信息", v);
      const [w, x] = s["split"](","),
        y = w["match"](/:(.*?);/)[0x1],
        z = atob(x),
        A = new Uint8Array(z["length"]);
      for (let E = 0x0; E < z["length"]; E++) {
        A[E] = z["charCodeAt"](E);
      }
      const B = new Blob([A], { type: y }),
        C = new FormData();
      (C["append"]("image", B, "image.png"),
        C["append"]("msg_type", 0x2),
        console["log"]("获取\x20key", u));
      const D = await fetch("https://store.weixin.qq.com/shop/commkf/cos_upload", {
        method: "POST",
        credentials: "include",
        headers: { biz_magic: u },
        body: C,
      })["then"]((F) => F["json"]());
      (console["log"]("cosUrl", D),
        D?.["cos_url"] &&
          fetch("https://store.weixin.qq.com/shop/commkf/msg?action=send_room_msg", {
            method: "POST",
            credentials: "include",
            headers: { biz_magic: u },
            body: JSON["stringify"]({
              room_id: t,
              msg_type: 0x2,
              msg_content:
                "{\x22name\x22:\x22图片.jpg\x22,\x22ld_img\x22:{\x22img_uri\x22:{\x22url\x22:\x22" +
                D?.["cos_url"] +
                "\x22,\x22size\x22:" +
                v["size"] +
                ",\x22aeskey\x22:\x22\x22,\x22authkey\x22:\x22\x22,\x22md5sum\x22:\x22\x22},\x22width\x22:" +
                v["width"] +
                ",\x22height\x22:" +
                v["height"] +
                "},\x22hd_img\x22:{\x22img_uri\x22:{\x22url\x22:\x22" +
                D?.["cos_url"] +
                "\x22,\x22size\x22:" +
                v["size"] +
                ",\x22aeskey\x22:\x22\x22,\x22authkey\x22:\x22\x22,\x22md5sum\x22:\x22\x22},\x22width\x22:" +
                v["width"] +
                ",\x22height\x22:" +
                v["height"] +
                "}}",
              extra_info:
                "{\x22head_img\x22:\x22" +
                f["logo"] +
                "\x22,\x22nickname\x22:\x22" +
                f["username"] +
                "\x22}",
              send_source: 0x2,
              send_tools: 0x0,
              create_time_ms: Date["now"](),
              imunion_msg_id: "mmec-commkf-v2-994433" + Date["now"](),
              client_ms: Date["now"](),
              async_check_spam_stage: 0x1,
            }),
          }));
    };
  let f = null;
  class g {
    constructor(s, t, u, v, w, x = ![], y, z, A, B, C, D) {
      ((this["messageId"] = s),
        (this["username"] = t),
        (this["timeout"] = v),
        (this["avatar"] = w),
        (this["content"] = u),
        (this["api"] = x),
        (this["msg_id"] = y),
        (this["send_openid"] = z),
        (this["goodId"] = A),
        (this["goodName"] = B),
        (this["orderId"] = C),
        (this["orderStatus"] = D),
        (this["type"] = "code"));
    }
  }
  class h {
    constructor(s, t, u, v, w) {
      ((this["name"] = s),
        (this["username"] = t),
        (this["kf"] = u),
        (this["logo"] = v),
        (this["id"] = w));
    }
  }
  const i = (s) => {
      const u = Number(s);
      return u > 0xe8d4a51000 ? Math["floor"](u / 0x3e8) : u;
    },
    j = window["WebSocket"];
  window["WebSocket"] = function (s, t) {
    const u = new j(s, t),
      v = u["send"];
    return (
      (u["send"] = function (w) {
        v["apply"](this, arguments);
      }),
      u["addEventListener"]("error", function (w) {
        console["info"]("wss断开");
      }),
      u["addEventListener"]("open", function (w) {
        console["info"]("打开ws");
      }),
      u["addEventListener"]("close", function (w) {
        console["info"]("WebSocket连接关闭");
      }),
      u
    );
  };
  const k = [
      {
        name: "获取鉴权信息1",
        match: (s, t) => s === "POST" && t["includes"]("/shop/commkf/room?action=get_room_info"),
        onResponse: (s, t, u) => {
          s?.["base_resp"]?.["ret"] === 0xbb8 &&
            (console["log"]("cookie过期\x20鉴权失败=============", s),
            window["context_bridge"]["send"]("account-login-expired"));
        },
      },
      {
        name: "获取鉴权信息",
        match: (s, t) => s === "POST" && t["includes"]("/shop/commkf/web?action=wss_login"),
        onResponse: (s, t, u) => {
          s["base_resp"]["ret"] === 0xbb8 &&
            (console["log"]("cookie过期\x20鉴权失败=============", s),
            window["context_bridge"]["send"]("account-login-expired"));
        },
      },
      {
        name: "获取用户历史信息",
        match: (s, t) => s === "POST" && t["includes"]("/shop/commkf/msg?action=get_room_msg"),
        onResponse: (s, t, u) => {
          const v = JSON["parse"](u);
          if (v && v["num"] == 0x1e && v["op"] == 0x0) {
            const w = s["list"] || null;
            window["postMessage"]({
              type: "get-history-message",
              value: w,
            });
          }
        },
      },
      {
        name: "店铺状态",
        match: (s, t) => s === "POST" && t == "/shop/commkf/acct?action=get_kf_acct",
        onResponse: (s, t, u) => {
          console["log"]("店铺状态=============", s);
          const { kf_acct_info_list: v } = s,
            w = v[0x0];
          s["acct_num"] == "1" &&
            ((f = new h(
              w["account_name"],
              w["nick_name"],
              w["openid"],
              w["account_head_url"],
              w["open_account"],
            )),
            window["postMessage"]({
              type: "get-shop-info",
              data: f,
            }),
            console["log"]("shopInfo============", f));
          if (a && a != "null" && a != f["name"] && !a["includes"]("未登录"))
            (window["context_bridge"]["send"]("refresh-shop", a),
              window["location"]["replace"]("https://store.weixin.qq.com/shop/home?shopName=" + a));
          else {
            window["context_bridge"]["send"]("get-shop-info", f);
            let x = null;
            switch (w["status"]) {
              case "0":
                ((x = "离线"),
                  window["context_bridge"]["send"]("shop-status-change", { status: x }));
                break;
              case "1":
                ((x = "在线"),
                  window["context_bridge"]["send"]("shop-status-change", { status: x }));
                break;
              case "2":
                ((x = "忙碌"),
                  window["context_bridge"]["send"]("shop-status-change", { status: x }));
                break;
            }
          }
        },
      },
      {
        name: "结束会话",
        match: (s, t) => s === "POST" && t["includes"]("/shop/commkf/room?action=end_room"),
        onResponse: (s, t, u) => {
          const v = JSON["parse"](u);
          console["log"]("结束会话");
        },
      },
      {
        name: "删除信息",
        match: (s, t) => s === "POST" && t["includes"]("/shop/commkf/msg?action=send_room_msg"),
        onResponse: (s, t, u) => {
          const v = JSON["parse"](u);
          console["info"]("删除信息", v);
          let w = null;
          try {
            const x = v?.["msg_content"],
              y = typeof x === "string" ? JSON["parse"](x) : x;
            w = y?.["content"] || null;
          } catch (z) {
            console["warn"]("解析\x20msg_content\x20失败", z, v);
          }
          window["context_bridge"]["send"]("reply-customer-message", {
            messageId: v?.["room_id"],
            content: w,
          });
        },
      },
      {
        name: "获取同步消息",
        match: (s, t) => s === "POST" && t["includes"]("/shop/commkf/msg?action=get_sync_msg"),
        onResponse: (s, t) => {
          const { list: u } = s;
          u &&
            u["length"] > 0x0 &&
            u["forEach"](async (v) => {
              const w = JSON["parse"](v["extra_info"]),
                x = JSON["parse"](v["msg_kf_content"]);
              if (w?.["unread_msg_num"] || x?.["summary_content"]) {
                let y = "",
                  z = "",
                  A = "",
                  B = "";
                if (x["type"] === 0xd) {
                  const E = JSON["parse"](x["content"] || "{}");
                  (console["log"]("goodRes", E),
                    (content = "用户发送商品"),
                    (y = E["product_id"]),
                    (z = E["product_title"]));
                } else {
                  if (x["type"] === 0xe) {
                    const F = JSON["parse"](x["content"] || "{}");
                    (console["log"]("orderRes", F),
                      (content = "用户发送订单"),
                      (A = F?.["order_id"] || ""),
                      (B = F?.["state_wording"] || ""));
                  } else {
                    if (x["hd_img"] || x["img_uri"]) content = "用户发送了图片";
                    else {
                      if (x["video_uri"]) content = "用户发送了视频";
                      else {
                        if (x["mp3_voice_buf"]) content = x["translated_word"] || "语音消息";
                        else {
                          if (x["content"])
                            try {
                              const G = JSON["parse"](x["content"]);
                              content = G["content"] || x["content"];
                            } catch {
                              content = x["content"];
                            }
                        }
                      }
                    }
                  }
                }
                const C = Number(v["update_time"]) + 0xb4;
                let D = new g(
                  v["room_id"],
                  w["nickname"],
                  content,
                  C,
                  w["head_img"],
                  !![],
                  v["msg_id"],
                  v["send_openid"],
                  y,
                  z,
                  A,
                  B,
                );
                ((D["type"] = "code"),
                  console["log"]("message=============", v, D, D["content"]),
                  window["context_bridge"]["send"]("get-customer-message-list", [D]));
              }
            });
        },
      },
      {
        name: "初始化页面消息列",
        match: (s, t) =>
          s === "POST" && t["includes"]("/shop/commkf/summary?action=get_session_summary"),
        onResponse: (s, t) => {
          (console["log"]("data==========", s),
            s &&
              s["summary_list"]["forEach"](async (u) => {
                if (!u["lastest_msg_kf_content"]) return;
                const v = JSON["parse"](u["lastest_msg_kf_content"]);
                if (
                  u["unreplied_msg_time"] != "0" &&
                  v?.["type"] != "EndRoom" &&
                  !c(u["update_time"])
                ) {
                  cont = JSON["parse"](u["extra_info"]);
                  const { content: w } = v;
                  console["log"]("item==========", u);
                  const x = await p(u["room_id"], u["send_openid"]);
                  console["log"]("orderResult==========", x);
                  let y = new g(
                    u["room_id"],
                    cont["nickname"],
                    w,
                    i(u["unreplied_msg_time"]) + 0xb4,
                    cont["head_img"],
                    !![],
                    u["lastest_msg_id"],
                    u["send_openid"],
                  );
                  ((y["goodId"] = x?.["goodId"] || ""),
                    (y["goodName"] = x?.["goodInfo"] || ""),
                    (y["goodCat"] = x?.["goodCat"] || ""),
                    (y["goodInfo"] = (x?.["goodInfo"] || "") + x?.["goodCat"] + x?.["sku"]),
                    (y["orderStatus"] = x?.["orderStatus"] || ""),
                    console["log"]("params=====", y, x?.["sku"]),
                    window["context_bridge"]["send"]("get-customer-message-list", [y]));
                }
              }));
        },
      },
    ],
    l = XMLHttpRequest["prototype"]["open"],
    m = XMLHttpRequest["prototype"]["send"];
  ((XMLHttpRequest["prototype"]["open"] = function (s, t, ...u) {
    return ((this["_hook_rule"] = k["find"]((v) => v["match"](s, t))), l["call"](this, s, t, ...u));
  }),
    (XMLHttpRequest["prototype"]["send"] = function (s) {
      const t = this["_hook_rule"];
      if (t) {
        this["_hook_body"] = s;
        t["onRequest"] && (s = t["onRequest"](s));
        const u = this["onreadystatechange"];
        this["onreadystatechange"] = function (...v) {
          if (this["readyState"] === 0x4 && t["onResponse"])
            try {
              const w = JSON["parse"](this["responseText"]);
              (w?.["base_resp"]?.["ret"] == 0x7530 &&
                (console["log"]("登录过期", w),
                window["context_bridge"]["send"]("account-login-expired")),
                w?.["base_resp"]["ret"] == 0x7530 &&
                  (console["log"]("登录过期", w),
                  window["context_bridge"]["send"]("account-login-expired")),
                t["onResponse"](w, this, this["_hook_body"]));
            } catch (x) {
              console["error"]("[拦截错误]\x20" + t["name"] + ":", x);
            }
          if (u) u["apply"](this, v);
        };
      }
      return m["call"](this, s);
    }),
    window["addEventListener"]("message", (s) => {
      if (s["data"] && s["data"]["type"] === "WS_STATE_CHANGE") wsConnectState = s["data"]["state"];
      else {
        if (s["data"]["type"] === "sendProduct") {
          const t = s["data"]["value"]["messageId"],
            u = s["data"]["value"]["msgId"];
        } else {
          if (s["data"]["type"] === "get-key")
            (console["log"]("get-key", s["data"]["value"]), (window["_key"] = s["data"]["value"]));
          else {
            if (s["data"]["type"] == "select-user")
              fetch("https://store.weixin.qq.com/shop/commkf/summary?action=update_room_cursor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON["stringify"]({
                  room_id: "4443520799768133636",
                  max_receive_msg_id: "4443560955230109704",
                  max_seen_msg_id: "4443560955230109704",
                }),
              });
            else {
              if (s["data"]["type"] === "send-message")
                (console["log"]("send-message=============", s["data"], window["_key"]),
                  fetch("https://store.weixin.qq.com/shop/commkf/msg?action=send_room_msg", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json,\x20text/plain",
                      biz_magic: window["_key"],
                    },
                    body: JSON["stringify"]({
                      room_id: "" + s["data"]["data"]["messageId"],
                      msg_type: 0x1,
                      msg_content: "{\x22content\x22:\x22" + s["data"]["data"]["content"] + "\x22}",
                      extra_info:
                        "{\x22head_img\x22:\x22" +
                        f["logo"] +
                        "\x22,\x22nickname\x22:\x22" +
                        f["username"] +
                        "\x22}",
                      send_source: 0x2,
                      send_tools: 0x0,
                      create_time_ms: Date["now"](),
                      imunion_msg_id: "mmec-commkf-v2-994433" + Date["now"](),
                      client_ms: Date["now"](),
                      async_check_spam_stage: 0x1,
                    }),
                  }));
              else {
                if (s["data"]["type"] === "send-image") {
                  const v = s["data"]["data"];
                  (console["log"]("send-image=============", s["data"], window["_key"]),
                    e(v["base64"], v?.["userId"] || v?.["messageId"], v["key"] || window["_key"]));
                }
              }
            }
          }
        }
      }
    }));
  class n {
    constructor(s, t) {
      Object["assign"](this, s);
      for (const u in t) {
        if (t[u]) {
          const v = this[u];
          (v === "" || v === null || v === undefined) && (this[u] = t[u]);
        }
      }
    }
  }
  async function o(s) {
    if (window["_key"])
      try {
        const t = await fetch(
          "https://store.weixin.qq.com/shop-faas/mmchannelstradeproductcore/cgi/goods/getEditProductV2?token=&lang=zh_CN&productKey=%7B%22productId%22:" +
            s +
            "%7D&needRealStock=true&preview=false&release=false\x0a",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              biz_magic: window["_key"] || "",
            },
          },
        )["then"]((u) => u["json"]());
        if (t["success"]) {
          const u = t["product"]["info"],
            v = {};
          u["productSaleAttrs"] &&
            Array["isArray"](u["productSaleAttrs"]) &&
            u["productSaleAttrs"]["forEach"]((x) => {
              x &&
                x["key"] &&
                x["items"] &&
                Array["isArray"](x["items"]) &&
                (v[x["key"]] = x["items"]["map"]((y) => y["value"]));
            });
          const w = {
            goods_id: s,
            goods_name: u["title"],
            goods_desc: u["detail"]?.["desc"],
            goods_properties: JSON["stringify"](u["param"] ? r(u["param"]) : []),
            goods_sku: JSON["stringify"](v),
          };
          return (console["log"]("商品详情数据==========", w), w);
        } else return null;
      } catch (x) {
        console["error"]("获取商品详情失败", x);
      }
  }
  const p = async (s, t) => {
      const u = await fetch(
          "https://store.weixin.qq.com/shop/kf/cgi/order/getOrderListV2?tabType=0&userOpenid=" +
            t +
            "&roomId=" +
            s +
            "&lastIndex=" +
            0x0 +
            "&pageSize=" +
            0xa +
            "&pageNum=" +
            0x1,
          {
            method: "GET",
            credentials: "include",
          },
        ),
        v = await u["json"]();
      let w = {
        orderStatus: "暂无订单",
        orderId: "",
        goodInfo: "",
        goodId: "",
        sku: "",
        goodCat: "",
      };
      console["log"]("主动请求用户的订单", v);
      if (v["orders"]?.["length"]) {
        const x = v["orders"][0x0],
          y = x?.["orderInfo"]?.["orderProductInfo"]?.[0x0],
          z = y?.["extInfo"];
        ((w["orderStatus"] = x?.["statusWording"] || "暂无订单"),
          (w["orderId"] = x?.["orderId"] || ""),
          console["log"]("订单详情数据==========", z));
        z &&
          ((w["goodInfo"] = z["title"] || ""),
          (w["goodId"] = y?.["productId"] || ""),
          (w["sku"] = (z["saleParam"] || [])
            ["map"]((A) => {
              const B = A["categorys"]?.[0x0]?.["name"] || "",
                C = A["categorys"]?.[0x1]?.["name"] || "";
              return B && C ? B + ":" + C : "";
            })
            ["filter"](Boolean)
            ["join"](",")));
        if (w["orderId"]) {
          const A = await o(w["goodId"]);
          (console["log"]("goodItem", A), (w["goodCat"] = A?.["goods_properties"] || ""));
        }
      }
      return (console["log"]("返回的\x20订单", w, w["orderStatus"]), w);
    },
    q = async (s, t, u) => {
      const v = await fetch("https://store.weixin.qq.com/shop/kf/cgi/order/searchOrderV2", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          keyword: u,
          lastIndex: "0",
          pageNum: 0x1,
          pageSize: 0xa,
          roomId: s,
          userOpenid: t,
          tabType: 0x0,
        }),
      })["then"]((w) => w["json"]());
      if (v?.["orders"])
        return (
          console["log"]("订单详情数据==========", v),
          {
            orderId: u,
            orderStatus: v["orders"][0x0]["statusWording"],
          }
        );
    };
  function r(s) {
    return s["map"]((t) => {
      const u = t["categorys"];
      if (!Array["isArray"](u) || u["length"] < 0x2) return null;
      const v = u[0x0]?.["name"]?.["trim"](),
        w = u[0x1]?.["name"]?.["trim"]();
      if (!v || !w) return null;
      return v + ":" + w;
    })["filter"](Boolean);
  }
};
(webFrame["executeJavaScript"]("(" + HOOK_CODE + ")(\x27" + shop_Name + "\x27);"),
  safeIpcOn("click-customer-message", async (a, b) => {
    console["log"]("点击发送消息按钮", b);
    const { messageId: c, username: d, avatar: e } = b;
    getUnReplyMessage(c, d, e);
  }),
  safeIpcOn("reply-message", async (a, b) => {
    console["log"]("ai兜底回复处理", b);
    try {
      let c = [];
      if (typeof b === "object") c = [b];
      else {
        const d = JSON["parse"](b);
        c = d;
      }
      processNextMessage(c);
    } catch {
      b["isBottomLineAutoReply"] && processNextMessage([b]);
    }
  }));
let message = null;
const processNextMessage = async (a) => {
  message = a["shift"]();
  const b = Array["isArray"](message) ? message[0x0] : message;
  b &&
    (b?.["imageBase64"] &&
      (window["postMessage"]({
        type: "send-image",
        data: {
          base64: b?.["imageBase64"],
          userId: b["userId"] || b?.["messageId"],
          key: key,
        },
      }),
      await delay(0x1f4)),
    window["postMessage"]({
      type: "send-message",
      data: {
        messageId: b["messageId"],
        content: b["replyContent"],
      },
    }),
    await delay(0x1f4),
    ipcRenderer["send"]("get-customer-callback-result", {
      ...b,
      isAiInviteReply: b["isAiInviteReply"],
      isReminderReply: b["isReminderReply"],
      isBottomLineAutoReply: b["isBottomLineAutoReply"],
      isAiAutoReply: !b["isBottomLineAutoReply"],
    }));
};
safeIpcOn("update-shop-bot-status", (a, b) => {
  (console["log"]("收到店铺bot状态更新:", b),
    (shopBotStatus = b["botStatus"]),
    window["postMessage"]({
      type: "update-shop-bot-status",
      data: shopBotStatus,
    }));
});
const getUserOrderInfo = async (a) => {
    return new Promise((b) => {
      try {
        (window["addEventListener"]("message", (c) => {
          c["data"]["type"] === "user-order" && b(c["data"]["value"]);
        }),
          setTimeout(() => {
            const c = document["querySelector"](".order-status"),
              d = c["querySelector"](".order-id-wrap\x20.num");
            if (c && d) {
              const e = c["getAttribute"]("data-wording");
              b({
                orderStatus: e,
                orderId: d["textContent"]["trim"](),
              });
            } else
              (console["log"]("未获取到订单状态"),
                b({
                  orderStatus: "暂无订单",
                  orderId: null,
                }));
          }, 0xbb8));
      } catch (c) {
        b({
          orderStatus: "暂无订单",
          orderId: null,
        });
      }
    });
  },
  getUnReplyMessage = async (a, b, c) => {
    const d = document["querySelector"]("[data-room-id=\x22" + a + "\x22]");
    if (d) return (d["click"](), console["log"]("listener", d["onclick"]), !![]);
    else {
      const e = document["querySelector"](".menu-list-tab");
      console["log"]("kfbtn=============", e);
      if (!e) return;
      e["click"]();
      const f = document["querySelector"]("[data-room-id=\x22" + a + "\x22]");
      if (f) return (f["click"](), !![]);
      else {
        const g = document["querySelector"](".chat-customer-name");
        if (g && g?.["textContent"] == b) return;
        const h = document["querySelector"](".weui-desktop-form__input");
        if (h) {
          ((h["value"] = b), h["dispatchEvent"](new Event("input", { bubbles: !![] })));
          const i = new MutationObserver((j) => {
            for (let k of j) {
              const l = document["querySelector"]("[data-src=\x22" + c + "\x22]");
              l && (l["click"](), i["disconnect"]());
            }
          });
          i["observe"](document["body"], {
            childList: !![],
            subtree: !![],
          });
        }
      }
    }
    return ![];
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
    windowHasFocus = !![];
  }),
  window["addEventListener"]("blur", () => {
    ((windowHasFocus = ![]), (isUserOperating = ![]), stopUserActivityTimer());
  }));
function stopUserActivityTimer() {
  userActivityTimer && (clearInterval(userActivityTimer), (userActivityTimer = null));
}
function getHttpAccountPassword() {
  const a = new URL(window["location"]["href"]),
    b = new URLSearchParams(a["search"]);
  let c = b["get"]("shopName");
  return { shopName: c };
}
const threeMinResponseTime = () => {
  const a = async () => {
    try {
      const b = new Date();
      b["setHours"](0x0, 0x0, 0x0, 0x0);
      const c = Math["floor"](b["getTime"]() / 0x3e8),
        d = new Date();
      d["setHours"](0x17, 0x3b, 0x3b, 0x3e7);
      const e = Math["floor"](d["getTime"]() / 0x3e8),
        f = await fetch(
          mainUrl + "shop/kf/cgi/data/getRealTimeKf?beginDate=" + c + "&endDate=" + e,
        ),
        g = await f["json"](),
        { cardResp: h } = g;
      if (h["objects"]["tableValueLine"]) {
        const i = h["objects"]["tableValueLine"][0x0]?.["columnValue"] || [];
        (console["log"]("100\x20-\x20resdata[6]", {
          responseRateWithinThreeMin: Math["round"](i[0x3] * 0x64) + "%",
          averageRate: i[0x4] + "秒",
          dissatisfiedRate: i[0x6] == "NaN" ? 0x0 + "%" : 0x64 - i[0x6] + "%",
          inquiryCount: i[0x1] + "人",
        }),
          ipcRenderer["send"]("get-quality-testing", {
            responseRateWithinThreeMin: Math["round"](i[0x3] * 0x64) + "%",
            averageRate: i[0x4] + "秒",
            dissatisfiedRate: i[0x6] == "NaN" ? 0x0 : 0x64 - i[0x6] + "%",
            inquiryCount: i[0x1] + "人",
          }));
      } else
        ipcRenderer["sendToHost"]("get-quality-testing", {
          responseRateWithinThreeMin: 0x0,
          averageRate: 0x0,
          dissatisfiedRate: 0x0,
          inquiryCount: 0x0,
        });
      fetch("https://store.weixin.qq.com/shop/kfreport/cgi/mmdata", {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json,\x20text/plain,\x20*/*",
          "Content-Type": "application/json",
        },
        body: JSON["stringify"]([
          {
            actionId: "a07",
            actionType: 0x1,
            kfClient: 0x2,
            moduleId: 0xcb,
            subModuleId: 0x7ef,
          },
        ]),
      })
        ["then"]((j) => j["json"]())
        ["then"]((j) => {
          console["log"]("模拟操作强行续期", j);
        });
    } catch (j) {
      console["log"]("质检报错信息", j);
    } finally {
      (console["log"]("质检定时器执行"), setTimeout(a, threeMinResponse));
    }
  };
  a();
};
(safeIpcOn("change-shop-status", (a, b) => {
  console["log"]("change-shop-status", b);
  let c = null;
  switch (b) {
    case "online":
      c = 0x1;
      break;
    case "offline":
      c = 0x0;
      break;
    case "busy":
      c = 0x2;
      break;
  }
  if (c !== null)
    fetch(mainUrl + "shop/commkf/acct?action=update_kf_acct", {
      method: "POST",
      credentials: "include",
      body: JSON["stringify"]({ status: c }),
    });
}),
  safeIpcOn("request-heartbeat", async () => {
    let a = "",
      b = !![];
    const c = document["querySelector"](".account-status-icon");
    try {
      const d = await fetch("https://store.weixin.qq.com/shop/commkf/acct?action=get_kf_acct", {
          method: "POST",
          credentials: "include",
        })["then"]((g) => g["json"]()),
        { kf_acct_info_list: e } = d,
        f = e[0x0];
      switch (f["status"]) {
        case "0":
          a = "离线";
          break;
        case "1":
          a = "在线";
          break;
        case "2":
          a = "忙碌";
          break;
      }
    } catch (g) {
      if (c) {
        const h = c["getAttribute"]("class");
        if (h["includes"]("offline")) a = "离线";
        else h["includes"]("on-break") ? (a = "忙碌") : (a = "在线");
      }
    } finally {
      const i = apiHealthMonitor["isHealthy"](),
        j = document["getElementsByClassName"]("avatar-wrap"),
        k = j ? !![] : ![];
      ipcRenderer["send"]("heartbeat-response", {
        status: a,
        apiHealthy: i,
        webSocketState: wsConnectState,
        domExists: k,
      });
    }
  }),
  safeIpcOn("get-shop-user", gethistoryMessage));
async function gethistoryMessage(a, b) {
  console["log"]("接收发送过来的信息\x20get-shop-user", b);
  const c = document["querySelector"]("#input-textarea");
  console["log"]("editdom", c);
  let d = (windowHasFocus && isUserOperating) || (c && c["value"]);
  if (d) {
    (ipcRenderer["send"]("get-shop-isuser-status", { hasContent: d }),
      console["log"]("用户正在操作"));
    return;
  }
  (console["log"]("开始获取"), ipcRenderer["send"]("get-shop-isuser-status", { hasContent: ![] }));
  let e = {
    ...b,
    history: [],
  };
  const f = await getUnReplyMessage(b["messageId"], b["username"], b["avatar"]);
  if (f) {
    console["log"]("进入会话页面成功");
    let g = await getUrlHistoryMessage();
    const h = await getUserOrderInfo(b["messageId"]);
    if (g) {
      g = g["filter"]((o) => o["client_ms"] !== "0" && o["create_time_ms"] !== "0");
      let i = null,
        j = null;
      const k = g["find"]((o) => {
        try {
          const p = JSON["parse"](o["msg_kf_content"]["content"]);
          return p["order_id"] && p["state_wording"];
        } catch (q) {
          return ![];
        }
      });
      if (k) {
        const o = JSON["parse"](item["msg_kf_content"]["content"]);
        ((j = o?.["order_id"]), (i = o?.["state_wording"]));
      }
      const l = g["findIndex"]((p) => p["send_open_account"]),
        m = l >= 0x0 ? g["slice"](0x0, l) : [],
        n = m["map"]((p) => {
          const q = JSON["parse"](p["msg_kf_content"])?.["content"] || "";
          if (q)
            return (
              console["log"]("item=========>", p),
              {
                content: q,
                role: "user",
                time: p["create_time_ms"] || b["timeout"],
                username: JSON["parse"](p["extra_info"])["nickname"] || b["username"],
                messageId: p["room_id"] || b["messageId"],
                orderStatus: i || h?.["orderStatus"] || "",
                orderId: j || h?.["orderId"] || "",
                msg_id: p?.["msg_id"],
              }
            );
        });
      ((e["history"] = n),
        console["log"]("主动拦截\x20历史记录", e["history"]),
        ipcRenderer["send"]("get-historical-records", JSON["stringify"](e)));
      return;
    }
    ((e = await getDomHistoryMessage(b)), console["log"]("historyMessageString=========>", e));
    if (e["history"]["length"] == 0x0) {
      let p = await getuserHistoryMessage(b["messageId"], b["msg_id"]);
      const q = await getuserOrderList(b["messageId"], b["send_openid"]);
      p = p["filter"]((x) => x["client_ms"] !== "0" && x["create_time_ms"] !== "0");
      let r = null,
        s = null;
      const t = p["find"]((x) => {
        try {
          const y = JSON["parse"](x["msg_kf_content"]["content"]);
          return y["order_id"] && y["state_wording"];
        } catch (z) {
          return ![];
        }
      });
      if (t) {
        const x = JSON["parse"](item["msg_kf_content"]["content"]);
        ((s = x?.["order_id"]), (r = x?.["state_wording"]));
      }
      const u = p["findIndex"]((y) => y["send_open_account"]),
        v = u >= 0x0 ? p["slice"](0x0, u) : [],
        w = v["map"]((y) => {
          const z = JSON["parse"](y["msg_kf_content"])?.["content"] || "";
          if (z)
            return (
              console["log"]("item=========>1111", y),
              {
                content: z,
                role: "user",
                time: y["create_time_ms"] || b["timeout"],
                username: JSON["parse"](y["extra_info"])["nickname"] || b["username"],
                messageId: y["room_id"] || b["messageId"],
                orderStatus: r || q?.["orderStatus"] || "",
                orderId: s || q?.["orderId"] || "",
                msg_id: y?.["msg_id"],
              }
            );
        });
      ((e["history"] = w),
        console["log"]("主动请求\x20历史记录", e["history"]),
        ipcRenderer["send"]("get-historical-records", JSON["stringify"](e)));
    } else
      (console["log"]("dom\x20历史记录", e["history"]),
        ipcRenderer["send"]("get-historical-records", JSON["stringify"](e)),
        console["log"]("dom\x20历史记录发送成功", e));
  } else console["log"]("进入会话页面失败");
}
const getuserHistoryMessage = async (a, b) => {
    const c = await fetch(mainUrl + "shop/commkf/msg?action=get_room_msg", {
        method: "POST",
        credentials: "include",
        body: JSON["stringify"]({
          room_id: a,
          msg_id: b,
          op: 0x0,
          num: 0xf,
        }),
      }),
      d = await c["json"]();
    return d["list"];
  },
  getuserOrderList = async (a, b) => {
    const c = await fetch(
        mainUrl +
          "shop/kf/cgi/order/getOrderListV2?tabType=0&userOpenid=" +
          b +
          "&roomId=" +
          a +
          "&lastIndex=" +
          0x0 +
          "&pageSize=" +
          0xa +
          "&pageNum=" +
          0x1,
        {
          method: "GET",
          credentials: "include",
        },
      ),
      d = await c["json"]();
    console["log"]("主动请求获取用户订单", d);
    const e = {
      orderStatus: d["orders"][0x0]?.["statusWording"] || "",
      orderId: d["orders"][0x0]?.["orderId"] || "",
    };
    return e;
  },
  getDomHistoryMessage = async (a) => {
    try {
      const b = { ...a };
      let c = [];
      const d = Object["create"](null);
      let f = null;
      const g = ["正在接入中，人工客服马上为你提供服务"],
        h = getCustomerId(),
        i = Array["from"](document["querySelectorAll"](".msg"))["filter"]((q) => {
          const r =
            q["classList"]["contains"]("no-content") &&
            q["getAttribute"]("data-type") === "6" &&
            q["innerText"]["includes"]("转给你");
          if (q["classList"]["contains"]("no-content") && !r) return ![];
          const s = q["getAttribute"]("id") || "";
          if (s["includes"]("_Welcome_")) return ![];
          const t = getSenderName(q);
          if (t === "智能助手") return ![];
          const u = q["innerText"]["trim"]();
          return !g["some"]((v) => u["trim"]() === v);
        });
      let j = "",
        k = "",
        l = "";
      (i["forEach"]((q, r) => {
        try {
          const s =
            q["classList"]["contains"]("no-content") &&
            q["getAttribute"]("data-type") === "6" &&
            q["innerText"]["includes"]("转给你");
          if (s) {
            let J = addOneSecondToTime(f) || "";
            if (!J && f === null) {
              const L = new Date();
              J =
                L["getFullYear"]() +
                "-" +
                String(L["getMonth"]() + 0x1)["padStart"](0x2, "0") +
                "-" +
                String(L["getDate"]())["padStart"](0x2, "0") +
                "\x20" +
                String(L["getHours"]())["padStart"](0x2, "0") +
                ":" +
                String(L["getMinutes"]())["padStart"](0x2, "0") +
                ":" +
                String(L["getSeconds"]())["padStart"](0x2, "0");
            }
            const K = {
              role: "user",
              time: J,
              shopTitle: j,
              content: "在吗？",
              username: h,
              isOrder: ![],
              orderId: k || "",
            };
            (c["push"](K), (f = J));
            return;
          }
          const t = detectSender(q),
            u = q["querySelector"](".message-time-text"),
            v = u ? u["textContent"]["trim"]() : "";
          let w = "";
          if (v) {
            const M = new Date();
            let N = M["getFullYear"](),
              O = M["getMonth"]() + 0x1,
              P = M["getDate"](),
              Q,
              R;
            if (!v["includes"]("\x20") && v["includes"](":")) {
              [Q, R] = v["split"](":")["map"](Number);
            } else {
              if (v["startsWith"]("昨天\x20")) {
                const [Z, a0] = v["split"]("\x20");
                [Q, R] = a0["split"](":")["map"](Number);
                const a1 = new Date(M);
                (a1["setDate"](P - 0x1),
                  (N = a1["getFullYear"]()),
                  (O = a1["getMonth"]() + 0x1),
                  (P = a1["getDate"]()));
              } else {
                if (v["includes"]("星期")) {
                  const [a2, a3] = v["split"]("\x20"),
                    a4 = {
                      星期日: 0x0,
                      星期一: 0x1,
                      星期二: 0x2,
                      星期三: 0x3,
                      星期四: 0x4,
                      星期五: 0x5,
                      星期六: 0x6,
                    },
                    a5 = a4[a2] || M["getDay"]();
                  [Q, R] = a3["split"](":")["map"](Number);
                  let a6 = a5 - M["getDay"]();
                  a6 = a6 >= 0x0 ? a6 - 0x7 : a6;
                  const a7 = new Date(M);
                  (a7["setDate"](P + a6),
                    (N = a7["getFullYear"]()),
                    (O = a7["getMonth"]() + 0x1),
                    (P = a7["getDate"]()));
                }
              }
            }
            ((Q = isNaN(Q) ? M["getHours"]() : Q), (R = isNaN(R) ? M["getMinutes"]() : R));
            const S = N,
              T = String(O)["padStart"](0x2, "0"),
              U = String(P)["padStart"](0x2, "0"),
              V = String(Q)["padStart"](0x2, "0"),
              W = String(R)["padStart"](0x2, "0"),
              X = S + "-" + T + "-" + U + "\x20" + V + ":" + W,
              Y = d[X] ?? 0x0;
            ((d[X] = (Y + 0x1) % 0x3c), (w = X + ":" + String(Y)["padStart"](0x2, "0")));
          }
          let x = "",
            z = ![],
            A = "";
          const B = q["innerText"]["trim"]();
          if (B["includes"]("将该会话转移给") || B["includes"]("将会话转移给您")) {
            (c["push"]({
              role: "user",
              time: w,
              shopTitle: "",
              content: "",
              username: h,
              isOrder: ![],
              orderId: k || "",
            }),
              (f = w));
            return;
          }
          const C = q["querySelector"](
            "[data-type=\x22video\x22],\x20.auxo-dropdown-trigger.I7ZfagWiu5KfRxXX0opn",
          );
          if (C) {
            const a8 = Array["from"](C["querySelectorAll"]("img"))["find"](
              (a9) => !a9["src"]["startsWith"]("data:"),
            );
            (c["push"]({
              role: t,
              time: w,
              shopTitle: j,
              content: "用户发送了视频",
              videoUrl: a8?.["src"] || "",
              username: h,
              isOrder: ![],
              orderId: k || "",
            }),
              (f = w));
            return;
          }
          const D = q["querySelector"](
            "[data-type=\x22image\x22]\x20img,\x20img.auxo-dropdown-trigger",
          );
          if (D && D["src"] && !D["src"]["startsWith"]("data:")) {
            (c["push"]({
              role: t,
              time: w,
              shopTitle: j,
              content: "用户发送了图片",
              imageUrl: D["src"],
              username: h,
              isOrder: ![],
              orderId: k || "",
            }),
              (f = w));
            return;
          }
          const E = q["querySelector"]("[data-type=\x22file\x22]");
          if (E) {
            const a9 = E["querySelector"]("p:first-child"),
              aa = E["querySelector"]("p:nth-child(2)"),
              ab = a9 ? a9["textContent"]["trim"]() : "未知文件",
              ac = aa ? aa["textContent"]["trim"]() : "未知大小";
            (c["push"]({
              role: t,
              time: w,
              shopTitle: j,
              content: "用户发送文件：" + ab + "（" + ac + "）",
              fileName: ab,
              fileSize: ac,
              username: h,
              isOrder: ![],
              orderId: k || "",
            }),
              (f = w));
            return;
          }
          const F = q["querySelector"]("[data-type=\x22order\x22]");
          if (F) {
            const ad = F["querySelector"](".wrap");
            if (ad) {
              const af = ad["querySelectorAll"]("span");
              af["length"] >= 0x2 &&
                af[0x0]["textContent"]["trim"]() === "订单号" &&
                ((A = af[0x1]["textContent"]["trim"]()), A && ((k = A), (z = !![])));
            }
            const ae = F["querySelector"]("p:first-child");
            if (ae) j = ae["textContent"]["trim"]() || j;
            ((x = z
              ? "用户发送订单：" + j + "\x20请介绍核心卖点"
              : "用户发送订单：" + (j || "未知商品")),
              c["push"]({
                role: t,
                time: w,
                shopTitle: j,
                content: x,
                username: h,
                isOrder: z,
                orderId: A,
              }),
              (f = w));
            return;
          }
          const G = q["querySelector"]("[data-type=\x22product\x22]");
          if (G) {
            const ag = G["querySelectorAll"](
              "p,\x20.pigeon-card-place-holder-text\x20.content.max-line\x20span",
            );
            if (ag["length"] >= 0x1) {
              let ah = ag[0x0]["textContent"]["trim"]();
              if (ah["includes"]("您看中的商品")) return;
              if (ah["includes"]("已售") && ag["length"] >= 0x2)
                ah = ag[0x1]["textContent"]["trim"]();
              ((j = ah), (x = "用户发送商品卡片：" + j + "\x20请简短介绍一下它的核心卖点"));
            }
            (c["push"]({
              role: t,
              time: w,
              shopTitle: j,
              content: x,
              username: h,
              isOrder: ![],
              orderId: k || "",
            }),
              (f = w));
            return;
          }
          const H = q["querySelector"]("[data-type=\x22voice\x22]");
          if (H) {
            const ai = H["querySelector"](".text-sm"),
              aj = ai ? ai["textContent"]["trim"]()["replace"](/"/g, "秒") : "",
              ak = H["querySelector"](".whitespace-pre-wrap.break-words.text-left"),
              al = ak ? ak["textContent"]["trim"]() : "";
            ((x = al ? "用户发送语音（" + aj + "）：" + al : "用户发送语音（" + aj + "）"),
              c["push"]({
                role: t,
                time: w,
                shopTitle: j,
                content: x,
                username: h,
                isOrder: ![],
                orderId: k || "",
              }),
              (f = w));
            return;
          }
          const I = q["querySelector"](".text-msg\x20span,\x20.iD7SHBvMhm4OhfCsBGr1");
          if (I) x = I["innerText"]["trim"]();
          ((w || j || x) &&
            c["push"]({
              role: t,
              time: w,
              shopTitle: j,
              content: x,
              username: h,
              isOrder: z,
              orderId: k || "",
            }),
            (f = w));
        } catch (am) {
          console["warn"]("第" + r + "条消息处理失败：", am);
        }
      }),
        await delay(0x3e8));
      const m = await getOrderList();
      if (k)
        c["forEach"]((q) => {
          if (!q["orderId"]) q["orderId"] = k;
          let r = "";
          if (m && m["length"] > 0x0) {
            const s = m["find"]((t) => t["orderId"] === k);
            s ? (q["orderStatus"] = s["status"]) : (q["orderStatus"] = m[0x0]["status"]);
          }
        });
      else {
        if (!k && m && m["length"] > 0x0) {
          const q = m[0x0];
          c["forEach"]((r) => {
            ((r["orderStatus"] = q["status"]), (r["orderId"] = q["orderId"]));
          });
        }
      }
      const n = [...c]["reverse"](),
        o = n["findIndex"]((r) => r["role"] === "assistant"),
        p = o >= 0x0 ? n["slice"](0x0, o)["reverse"]() : [];
      return (
        p["length"] > 0x0 && p["forEach"]((r) => (r["messageId"] = a["messageId"])),
        (b["history"] = p),
        console["log"]("dom结果=========>", b),
        b
      );
    } catch (r) {
      return (console["error"]("脚本执行失败：", r), []);
    }
  },
  getOrderList = async () => {
    try {
      const a = [],
        b = document["querySelectorAll"](".order-card");
      return (
        b["forEach"]((c) => {
          const d = c["querySelector"](".order-id-wrap\x20.num"),
            e = d ? d["innerText"]["trim"]() : "未知订单号",
            f = c["querySelector"](".order-status"),
            g = f ? f["innerText"]["trim"]()["replace"](/\s+/g, "\x20") : "未知状态";
          e !== "未知订单号" &&
            a["push"]({
              orderId: e,
              status: g,
            });
        }),
        a
      );
    } catch (c) {
      return (console["error"]("订单提取脚本执行出错：", c), []);
    }
  };
function addOneSecondToTime(a) {
  if (!a) return "";
  const [b, c] = a["split"]("\x20");
  if (!b || !c) return a;
  const [d, e, f] = c["split"](":")["map"](Number);
  let g = f + 0x1,
    h = e,
    i = d;
  return (
    g >= 0x3c && ((g = 0x0), (h += 0x1)),
    h >= 0x3c && ((h = 0x0), (i += 0x1)),
    i >= 0x18 && (i = 0x0),
    b +
      "\x20" +
      String(i)["padStart"](0x2, "0") +
      ":" +
      String(h)["padStart"](0x2, "0") +
      ":" +
      String(g)["padStart"](0x2, "0")
  );
}
function getCustomerId() {
  const a = document["querySelector"](".chat-customer-name");
  return a ? a["textContent"]["trim"]() : "";
}
function detectSender(a) {
  const b = a["querySelector"](".message-item");
  return b?.["classList"]["contains"]("justify-end") ? "assistant" : "user";
}
function getSenderName(a) {
  const b = a["querySelector"](".message-time-text\x20+\x20span");
  return b ? b["textContent"]["trim"]() : "";
}
const delay = (a) => new Promise((b) => setTimeout(b, a)),
  getUrlHistoryMessage = () => {
    return new Promise((a) => {
      const b = (d) => {
          d["data"] &&
            d["data"]["type"] === "get-history-message" &&
            (clearTimeout(c), window["removeEventListener"]("message", b), a(d["data"]["value"]));
        },
        c = setTimeout(() => {
          (window["removeEventListener"]("message", b), a(null));
        }, 0x3e8);
      window["addEventListener"]("message", b);
    });
  };
safeIpcOn("get-goods-all-detail", async (a, b) => {
  ((allProducts = []), console["log"]("获取全部商品======="));
  const c = await getAllProducts(),
    d = await Promise["all"](
      c["map"](async (e) => {
        const f = {};
        e["productSaleAttrs"] &&
          Array["isArray"](e["productSaleAttrs"]) &&
          e["productSaleAttrs"]["forEach"]((i) => {
            i &&
              i["key"] &&
              Array["isArray"](i["items"]) &&
              (f[i["key"]] = i["items"]["map"]((j) => j["value"]));
          });
        const g = e["category"]?.["map"]((i) => i["catId"]) ?? [],
          h = await getGoodcatIdList(g);
        return {
          goods_id: e["productId"],
          goods_name: e["title"],
          goods_desc: e["detail"]?.["desc"],
          urls: Array["isArray"](e["headImgInfos"])
            ? e["headImgInfos"]["map"]((i) => i["imgUrl"])
            : [],
          goods_url: e["headImg"] || e["headImage"],
          type: b["type"],
          id: b["id"],
          goods_properties: JSON["stringify"](e["param"] ? formatCategory(e["param"]) : []),
          goods_cat: h ? h["map"]((i) => i["name"])["join"](">") : "",
          goods_sku: JSON["stringify"](f),
        };
      }),
    );
  (console["log"]("result", d),
    ipcRenderer["send"]("get-goods-all-detail-total", {
      userId: b["userId"],
      total: d["length"],
    }),
    ipcRenderer["send"]("get-goods-detail", d));
});
const getAllProducts = async (a = 0x1, b = null) => {
  let c = a;
  const d = await fetch(
      mainUrl +
        "shop-faas/mmchannelstradeproductcore/cgi/goods/scanProductPreview?token=&lang=zh_CN",
      {
        method: "POST",
        credentials: "include",
        headers: {
          biz_magic: key,
          "Content-Type": "application/json",
        },
        body: JSON["stringify"]({
          nextKey: b,
          pageSize: 0xa,
          pageNum: c,
          status: [0x5],
        }),
      },
    )["then"]((h) => h["json"]()),
    { totalNum: e, nextKey: f, productList: g } = d;
  return (
    allProducts["push"](...g),
    f && allProducts["length"] <= e
      ? getAllProducts(c + 0x1, d["nextKey"])
      : (console["log"]("全部商品数量", allProducts["length"]), allProducts)
  );
};
function formatCategory(a) {
  return a["map"]((b) => {
    const c = b["categorys"];
    if (!Array["isArray"](c) || c["length"] < 0x2) return null;
    const d = c[0x0]?.["name"]?.["trim"](),
      e = c[0x1]?.["name"]?.["trim"]();
    if (!d || !e) return null;
    return d + ":" + e;
  })["filter"](Boolean);
}
const getGoodcatIdList = async (a) => {
  const b = await fetch(
      mainUrl +
        "shop-faas/mmchannelstradecategory/cgi/product/getCategoryOnShelfV2?token=&lang=zh_CN",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          biz_magic: key,
        },
        body: JSON["stringify"]({ catIdList: a }),
      },
    )["then"]((d) => d["json"]()),
    { category: c } = b;
  return c || null;
};
(safeIpcOn("goto-human-reply", async (a, b) => {
  try {
    const c = [b["subAccount"]],
      d = () => {
        const k = Array["from"](document["querySelectorAll"](".func-wrap.bold"))["find"]((l) =>
          l["textContent"]["includes"]("转接"),
        );
        return k
          ? (k["click"](), console["log"]("已点击转接按钮，打开弹框"), 0x1)
          : (console["error"]("未找到转接按钮"), 0x2);
      },
      e = (k = 0xbb8) =>
        new Promise((l, m) => {
          const n = Date["now"](),
            o = setInterval(() => {
              const p = document["querySelector"](".transfer-popover2\x20.list");
              if (p) {
                const q = Array["from"](p["querySelectorAll"](".item"))
                  ["map"]((r) => ({
                    element: r,
                    name: r["querySelector"](".nickname")?.["textContent"]?.["trim"]() || "",
                  }))
                  ["filter"]((r) => r["name"]);
                if (q["length"] > 0x0) {
                  (clearInterval(o), console["log"]("找到" + q["length"] + "个客服选项"), l(q));
                  return;
                } else {
                  (clearInterval(o), l([]));
                  return;
                }
              }
              Date["now"]() - n > k && (clearInterval(o), m("等待客服列表超时"));
            }, 0xc8);
        }),
      f = (k) => {
        let l = null;
        for (const m of c) {
          l = k["find"]((n) => n["name"]["includes"](m));
          if (l) {
            console["log"]("找到匹配的客服：" + l["name"]);
            break;
          }
        }
        return l;
      },
      g = (k = 0x7d0) =>
        new Promise((l, m) => {
          const n = Date["now"](),
            o = setInterval(() => {
              const p = document["querySelector"](
                ".transfer-popover2\x20.button_area\x20.weui-desktop-btn_primary:not(.weui-desktop-btn_disabled)",
              );
              if (p) {
                (p["click"](), clearInterval(o), console["log"]("已点击转接确认按钮"), l(!![]));
                return;
              }
              Date["now"]() - n > k && (clearInterval(o), m("等待转接按钮超时或按钮未启用"));
            }, 0xc8);
        }),
      h = () => {
        try {
          if (
            !YK_failTransfer ||
            String(YK_failTransfer)["trim"]() === "" ||
            String(YK_failTransfer)["trim"]()["toLowerCase"]() === "none"
          ) {
            console["log"]("YK_failTransfer内容无效，不发送失败消息");
            return;
          }
          const k = document["querySelector"]("textarea.text-area"),
            l = document["querySelector"](".text-area-wrap");
          if (!k || !l) {
            console["warn"]("未找到输入框或输入容器");
            const n = document["querySelectorAll"]("textarea");
            console["log"]("页面中找到的textarea元素:", n);
            return;
          }
          (k["focus"](),
            (k["value"] = ""),
            k["dispatchEvent"](new Event("input", { bubbles: !![] })));
          const m = Object["getOwnPropertyDescriptor"](
            window["HTMLTextAreaElement"]["prototype"],
            "value",
          )?.["set"];
          (m ? m["call"](k, YK_failTransfer) : (k["value"] = YK_failTransfer),
            k["dispatchEvent"](
              new Event("input", {
                bubbles: !![],
                cancelable: !![],
              }),
            ),
            setTimeout(() => {
              try {
                const o = new KeyboardEvent("keydown", {
                  key: "Enter",
                  code: "Enter",
                  keyCode: 0xd,
                  bubbles: !![],
                  cancelable: !![],
                });
                (k["dispatchEvent"](o),
                  setTimeout(() => {
                    (k["dispatchEvent"](
                      new KeyboardEvent("keyup", {
                        key: "Enter",
                        code: "Enter",
                        keyCode: 0xd,
                        bubbles: !![],
                      }),
                    ),
                      console["log"]("已尝试通过Enter发送失败消息"));
                  }, 0x32));
              } catch (p) {
                console["error"]("发送失败消息时出错：", p);
              }
            }, 0x64));
        } catch (o) {
          console["error"]("发送失败消息脚本执行出错：", o);
        }
      },
      i = () => {
        const k = document["querySelector"](
          ".transfer-popover2\x20.button_area\x20.weui-desktop-btn_default",
        );
        if (k) return (k["click"](), console["log"]("已关闭转接弹框"), 0x1);
        return 0x2;
      },
      j = async () => {
        if (!d()) {
          console["log"]("无法打开转接面板，直接发送失败消息");
          return;
        }
        try {
          const k = await e();
          if (k["length"] === 0x0) {
            (console["log"]("没有可转接的客服"), i());
            return;
          }
          let l = f(k);
          !l && (console["log"]("没有匹配的客服，尝试选择第一个客服"), (l = k[0x0]));
          if (l) {
            (l["element"]["click"](), console["log"]("已选择客服：" + l["name"]));
            try {
              (await g(), console["log"]("转接流程完成"));
              return;
            } catch (m) {
              console["error"]("确认转接失败：", m);
            }
          }
          (console["log"]("转接失败，发送失败消息"), i());
        } catch (n) {
          (console["error"]("转接过程出错：", n), i());
        }
      };
    j();
  } catch (k) {
    console["error"]("脚本执行异常：", k);
  }
}),
  safeIpcOn("star", () => {
    console["log"]("星标");
    const a = document["querySelector"](".star-btn");
    a && (a["click"](), console["log"]("已点击星标按钮"));
  }),
  window["addEventListener"]("message", (a) => {
    a["data"]["type"] === "user-order-key" &&
      (ordersKeyValue = {
        roomId: a["data"]["value"]["roomId"],
        userOpenid: a["data"]["value"]["userOpenid"],
      });
  }),
  safeIpcOn("create-workorder", async (a, b) => {
    console["log"]("接收工单参数", b);
    if (ordersKeyValue) {
      const { roomId: c, userOpenid: d } = ordersKeyValue,
        e = await fetch(
          mainUrl +
            "shop/kf/cgi/order/getOrderListV2?tabType=0&userOpenid=" +
            d +
            "&roomId=" +
            c +
            "&lastIndex=" +
            0x0 +
            "&pageSize=" +
            0xa +
            "&pageNum=" +
            0x1,
          {
            method: "GET",
            credentials: "include",
          },
        ),
        f = await e["json"]();
      console["log"]("获取工单信息", f);
      const { orders: g } = f;
      if (g && g["length"] > 0x0) {
        const h = g["map"]((k) => {
            return fetch(
              mainUrl + "shop-faas/mmchannelstradeorder/detail/cgi/orderDetail?token=&lang=zh_CN",
              {
                method: "POST",
                headers: {
                  Accept: "application/json,\x20text/plain,\x20*/*",
                  "Content-Type": "application/json",
                  biz_magic: key,
                },
                credentials: "include",
                body: JSON["stringify"]({ id: k["orderId"] }),
              },
            )["then"]((l) => l["json"]());
          }),
          i = await Promise["allSettled"](h),
          j = [];
        for (const k of i) {
          if (k["status"] === "fulfilled") {
            console["log"]("成功：", k["value"]);
            try {
              const l = k["value"],
                m = l?.["acceptInfo"]?.["addressInfo"]?.["userName"],
                n = l?.["acceptInfo"]?.["addressInfo"]?.["telNumber"],
                o = (l?.["buyerInfo"]?.["addr"] +
                  l?.["acceptInfo"]?.["addressInfo"]?.["detailInfo"])["replace"](/\s+/g, ""),
                p = {
                  orderId: l?.["commonInfo"]?.["orderId"],
                  type: l?.["commonInfo"]?.["statusStr"],
                  orderName: l?.["orderProducts"]?.["orderProductInfo"][0x0]["title"],
                  sku: l?.["orderProducts"]?.["orderProductInfo"][0x0]["saleParam"]["join"](","),
                  name: m && n ? "" + m + n : m || n || "",
                  address: o,
                  expressCompany:
                    l?.["expressInfo"]?.["deliveryProductInfo"][0x0]?.["deliveryName"],
                  trackingNumber: l?.["expressInfo"]?.["deliveryProductInfo"][0x0]?.["waybillId"],
                  expanded: !![],
                };
              j["push"](p);
            } catch (q) {
              console["error"]("失败：", q);
            }
          } else console["warn"]("失败：", k["reason"]);
        }
        (console["log"]("orderList", j), ipcRenderer["send"]("get-create-workorder", j));
      }
    }
  }),
  safeIpcOn("currnt-page", (a, b) => {
    ((is_key = b), is_key && ipcRenderer["send"]("get-currnt-page", ![]));
  }),
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
  const e = document["querySelector"]("input[type=\x22file\x22][accept*=\x22.jpg,.png\x22]");
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
    e["dispatchEvent"](new Event("change", { bubbles: !![] })));
  let l = 0x0;
  const m = 0x14,
    n = setInterval(() => {
      l++;
      const s = document["querySelector"](".t-dialog__footer");
      if (s) {
        const t = s["querySelector"](".weui-desktop-btn_primary");
        (t["click"](), clearInterval(n));
        return;
      }
      l >= m && (clearInterval(n), console["log"]("[图片发送]\x20弹窗检测超时"));
    }, 0x64);
  return (console["log"]("[图片发送]\x20已触发\x20change\x20事件"), !![]);
}
function formatWxExperienceMetricScore(a, b) {
  if (b === "percent") return Number(((a || 0x0) * 0x64)["toFixed"](0x4));
  return a ?? "";
}
function buildWxExperienceOverviewData(a) {
  return {
    consumerScore: a?.["dsrScore"]?.["curValue"] ?? "",
    productScore: a?.["productScore"]?.["curValue"] ?? "",
    logisticsScore: a?.["deliverScore"]?.["curValue"] ?? "",
    serviceScore: a?.["serviceScore"]?.["curValue"] ?? "",
  };
}
function buildWxProductMetrics(a) {
  return {
    品质退款率: {
      score: formatWxExperienceMetricScore(a?.["productQualityRatio_30d"]?.["curValue"], "percent"),
    },
    商品好评率: {
      score: formatWxExperienceMetricScore(a?.["proValidGoodEvalRatio"]?.["curValue"], "percent"),
    },
  };
}
function buildWxLogisticsMetrics(a) {
  return {
    次日及时揽收率: {
      score: formatWxExperienceMetricScore(a?.["collectInTimeRatio_30d"]?.["curValue"], "percent"),
    },
    线路配送达标率: {
      score: formatWxExperienceMetricScore(
        a?.["waybillArriveOntimeRatio_30d"]?.["curValue"],
        "percent",
      ),
    },
    物流负向反馈率: {
      score: formatWxExperienceMetricScore(
        a?.["waybillNegtiveOrdRatio_30d"]?.["curValue"],
        "percent",
      ),
    },
  };
}
function buildWxServiceMetrics(a) {
  return {
    平均回复时长: {
      score: formatWxExperienceMetricScore(a?.["serviceReplyLength_30d"]?.["curValue"], "number"),
    },
    不回复率: {
      score: formatWxExperienceMetricScore(a?.["serviceNoreplyRatio_30d"]?.["curValue"], "percent"),
    },
    售后首次操作时长: {
      score: formatWxExperienceMetricScore(
        a?.["aftersaleFirstOperationTime_30d"]?.["curValue"],
        "number",
      ),
    },
    退款自主完结时长: {
      score: formatWxExperienceMetricScore(a?.["onlyRefundDealSec_30d"]?.["curValue"], "number"),
    },
    退货退款自主完结时长: {
      score: formatWxExperienceMetricScore(a?.["returnRefundDealSec_30d"]?.["curValue"], "number"),
    },
    商责纠纷率: {
      score: formatWxExperienceMetricScore(
        a?.["serviceComplaintRatio_30d"]?.["curValue"],
        "percent",
      ),
    },
  };
}
function buildWxOtherMetrics(a) {
  return {
    售后满意度: {
      score: formatWxExperienceMetricScore(a?.["afterSaleNpsGoodRatio"]?.["curValue"], "percent"),
    },
  };
}
async function fetchWxExperienceScore(a) {
  const b = await fetch(
    "https://store.weixin.qq.com/shop-faas/statistic/cgi/search?token=&lang=zh_CN",
    {
      method: "POST",
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        biz_magic: key,
      },
      body: JSON["stringify"]({
        days: 0xe,
        scoreTypeList: a,
      }),
    },
  );
  return await b["json"]();
}
async function buildWxExperienceScoreData() {
  const a = await fetchWxExperienceScore([0xb, 0xc, 0xd, 0xe, 0x3e8]),
    b = await fetchWxExperienceScore([0x46, 0x40, 0x3e8]),
    c = await fetchWxExperienceScore([0x48, 0x49, 0x47, 0x19, 0x69, 0x4a, 0x4e, 0x3e8]),
    d = await fetchWxExperienceScore([0x4b, 0x4c, 0x4d, 0x43, 0x44, 0x45, 0x3e8]),
    e = await fetchWxExperienceScore([0x3f, 0x3e8]);
  return {
    ...buildWxExperienceOverviewData(a),
    productMetrics: buildWxProductMetrics(b),
    logisticsMetrics: buildWxLogisticsMetrics(c),
    serviceMetrics: buildWxServiceMetrics(d),
    otherMetrics: buildWxOtherMetrics(e),
  };
}
const getShopExperienceScore = async () => {
  try {
    const a = await buildWxExperienceScoreData();
    return (console["log"]("获取视频号店铺体验分返回:", a), a);
  } catch (b) {
    return (console["log"]("获取店铺体验分失败:", b), null);
  }
};
function formatTimeToMinutes(a) {
  if (!a || a === "0") return "0分钟";
  const b = parseFloat(a) / 0x3c;
  return b["toFixed"](0x1) + "分钟";
}
(safeIpcOn("get-after-sale-total-order", async (a, b) => {
  console["log"]("get-after-sale-total-order==============>", b);
  const c = b;
  try {
    const d = new Date(c["info"]["month"][0x0]);
    d["setHours"](0x0, 0x0, 0x0, 0x0);
    const e = new Date(c["info"]["month"][0x1]);
    e["setHours"](0x17, 0x3b, 0x3b, 0x3e7);
    const f = d["getTime"](),
      g = e["getTime"](),
      h = Math["floor"](f / 0x3e8),
      i = Math["floor"](g / 0x3e8);
    console["log"]("beginCreateTime============>", h, i);
    const j = await fetch(
      "https://store.weixin.qq.com/shop-faas/mmchannelstradeaftersale/cgi/esSearchAfterSaleOrder?token=&lang=zh_CN",
      {
        method: "post",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          biz_magic: key,
        },
        body: JSON["stringify"]({
          originalOrderIdList: [],
          orderIdList: [],
          waybillIdList: [],
          createTime: [f, g],
          completeTime: [null, null],
          moneyRange: ["", ""],
          status: "",
          type: "",
          reasonType: null,
          reason: null,
          receiverName: "",
          receiverTelNumberLast4: "",
          productMessage: "",
          orderClass: 0x0,
          suspectedRisk: 0x0,
          shipStatus: "",
          returnStatus: "",
          complaintOrderStatus: "",
          complaintOrderBlame: "",
          key: "",
          pendingForNSeconds: null,
          beginCreateTime: h,
          endCreateTime: i,
          sortType: 0xb,
          pageSize: 0xa,
          afterSaleOpType: [0x0],
          pageNum: 0x1,
          orderId: "",
          aftersaleReason: [0x0],
          originalOrderId: "",
          waybillId: "",
          returnDiffPriceType: 0x0,
          refundTypeList: null,
          needFetchTabTotalNum: !![],
          useTabSelfOptions: ![],
        }),
      },
    )["then"]((q) => q["json"]());
    console["log"]("totalCountRes", j);
    const k = await fetch(
      "https://store.weixin.qq.com/shop-faas/mmchannelstradeaftersale/cgi/esSearchAfterSaleOrder?token=&lang=zh_CN",
      {
        method: "post",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          biz_magic: key,
        },
        body: JSON["stringify"]({
          afterSaleOpType: [0x0],
          aftersaleReason: [0x0],
          beginCreateTime: h,
          complaintOrderBlame: "",
          complaintOrderStatus: "",
          completeTime: [null, null],
          createTime: [f, g],
          endCreateTime: i,
          key: "",
          moneyRange: ["", ""],
          needFetchTabTotalNum: !![],
          orderClass: 0x0,
          orderId: "",
          orderIdList: [],
          originalOrderId: "",
          originalOrderIdList: [],
          pageNum: 0x1,
          pageSize: 0xa,
          pendingForNSeconds: null,
          productMessage: "",
          reason: null,
          reasonType: null,
          receiverName: "",
          receiverTelNumberLast4: "",
          refundTypeList: null,
          returnDiffPriceType: 0x0,
          returnStatus: "",
          shipStatus: "awaitingShipment",
          sortType: 0xb,
          status: "",
          suspectedRisk: 0x0,
          totalNum: 0x0,
          totalPage: 0x0,
          type: "",
          useTabSelfOptions: ![],
          waybillId: "",
          waybillIdList: [],
        }),
      },
    )["then"]((q) => q["json"]());
    console["log"]("awaitingShipmentRefundRes", k);
    const l = await fetch(
      "https://store.weixin.qq.com/shop-faas/mmchannelstradeaftersale/cgi/fetchGuaranteeOrders?token=&lang=zh_CN",
      {
        method: "post",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          biz_magic: key,
        },
        body: JSON["stringify"]({
          type: 0x0,
          beginTime: h,
          endTime: i,
          needTotalNum: !![],
          offset: 0x0,
          limit: 0xa,
        }),
      },
    )["then"]((q) => q["json"]());
    console["log"]("workOrderRes", l);
    const m = j["totalNum"] || 0x0,
      n = k["totalNum"] || 0x0,
      o = l["totalNum"] || 0x0,
      p = m - n + o;
    ipcRenderer["send"]("get-after-sale-total-order-result", {
      applyCount: m,
      refundOnlyCount: n,
      workOrderCount: o,
      realCount: p,
      id: c["info"]["id"],
    });
  } catch (q) {
    (console["log"]("error", q),
      ipcRenderer["send"]("web-scoker-error-callback", {
        info: c,
        errormsg: "查询月总工单失败,失败原因:" + JSON["stringify"](q),
        shopId: c["info"]?.["shopId"],
      }));
  }
}),
  ipcRenderer["on"]("paste-to-shop", (a, b) => {
    const c = document["querySelector"]("#input-textarea");
    console["log"]("input", c);
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
  safeIpcOn("ai-transfer-human-sub", async (a, b) => {
    console["log"]("AI转人工转接子账号", b);
    const c = await getSubIdByName(b["subAccount"]);
    fetch("https://store.weixin.qq.com/shop/commkf/room?action=transfer_session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json,\x20text/plain",
        biz_magic: window["_key"],
      },
      body: JSON["stringify"]({
        recv_openid: c,
        room_id: b["messageId"],
        msg_content: "留言：",
        msg_type: 0x1,
        need_return_msg_id: !![],
      }),
    });
  }));
const getSubIdByName = async (a) => {
  const b = await fetch("https://store.weixin.qq.com/shop/commkf/acct?action=get_kf_acct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json,\x20text/plain",
        biz_magic: window["_key"],
      },
      body: JSON["stringify"]({
        status_list: [0x1, 0x2],
        offset: 0x0,
        limit: 0x14,
        disable_cache: 0x1,
        disable_svr_cache: 0x0,
      }),
    })["then"]((e) => e["json"]()),
    c = b?.["kf_acct_info_list"] || [],
    d = c["find"](
      (e) =>
        e?.["nick_name"] === a ||
        e?.["account_name"] === a ||
        e?.["user_name"] === a ||
        e?.["remark"] === a,
    );
  return d?.["openid"] || "";
};
(window["addEventListener"]("error", (a) => {
  (console["error"]("全局错误", a), reportGlobalPreloadError("全局错误", a["error"] || a));
}),
  window["addEventListener"]("unhandledrejection", (a) => {
    (console["error"]("未捕获的promise错误", a),
      reportGlobalPreloadError("未捕获的promise错误", a["reason"] || a));
  }),
  ipcRenderer["on"]("heartbeat", () => {
    ipcRenderer["send"]("web-heartbeat-ping");
  }));
