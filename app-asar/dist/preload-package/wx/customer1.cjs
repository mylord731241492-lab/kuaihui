const { ipcRenderer, contextBridge, webFrame } = require("electron");
contextBridge["exposeInMainWorld"]("context_bridge", {
  send: (a, b) => ipcRenderer["send"](a, b),
  invoke: (a, b) => ipcRenderer["invoke"](a, b),
});
function safeIpcOn(a, b) {
  (ipcRenderer["removeAllListeners"](a), ipcRenderer["on"](a, b));
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
  ordersKeyValue = null;
class Info {
  constructor(a, b, c, d, e) {
    ((this["name"] = a), (this["username"] = b), (this["kf"] = c), (this["logo"] = d));
  }
}
class Message {
  constructor(a, b, c, d, e, f, g, h = ![]) {
    ((this["messageId"] = a),
      (this["content"] = c),
      (this["timeout"] = d),
      (this["avatar"] = e),
      (this["username"] = b),
      (this["isTimeout"] = f),
      (this["timeNote"] = g),
      (this["api"] = h));
  }
}
let wsConnectState = -0x1;
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
const eventKey = new KeyboardEvent("keydown", {
  key: "Enter",
  code: "Enter",
  keyCode: 0xd,
  which: 0xd,
  bubbles: !![],
});
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
  console["log"]("加载完成--------------");
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
  const c = async (x) => {
    const y = await fetch(
      "https://store.weixin.qq.com/shop/commkf/room?action=get_room_recommend_info",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json,\x20text/plain,\x20*/*",
          biz_magic: key,
        },
        body: JSON["stringify"]({ room_id: x }),
      },
    )["then"]((z) => z["json"]());
    console["log"]("res", y);
    if (y?.["base_resp"]?.["ret"] == 0x0) {
      const z = y?.["recommend_product_infos"][0x0]["product_id"];
      return z;
    }
    return null;
  };
  window["addEventListener"]("message", (x) => {
    x["data"]["type"] == "update-shop-bot-status" && (b = x["data"]["data"]);
  });
  const d = (x) => {
    const y = Date["now"](),
      z = y - 0x2 * 0x18 * 0x3c * 0x3c * 0x3e8;
    return x * 0x3e8 < z;
  };
  setTimeout(() => {
    const x = document["querySelector"](".avatar-img");
    (console["log"]("dom>>>>>>>", x),
      x &&
        x["addEventListener"]("click", async (y) => {
          console["log"]("点击头像");
          const z = await s(0x918570eb436);
          console["log"]("获取商品信息", z);
        }));
  }, 0xbb8);
  const e = (x) => {
      return new Promise((y, z) => {
        const A = x["split"](",")[0x1],
          B = Math["ceil"]((A["length"] * 0x3) / 0x4),
          C = new Image();
        ((C["onload"] = () => {
          y({
            width: C["width"],
            height: C["height"],
            size: B,
            sizeKB: (B / 0x400)["toFixed"](0x2) + "\x20KB",
          });
        }),
          (C["onerror"] = z),
          (C["src"] = x));
      });
    },
    f = async (x, y, z) => {
      console["log"]("发送图片", x, y, z);
      if (!z || !y || !x) return;
      const A = await e(x);
      console["log"]("图片信息", A);
      const [B, C] = x["split"](","),
        D = B["match"](/:(.*?);/)[0x1],
        E = atob(C),
        F = new Uint8Array(E["length"]);
      for (let J = 0x0; J < E["length"]; J++) {
        F[J] = E["charCodeAt"](J);
      }
      const G = new Blob([F], { type: D }),
        H = new FormData();
      (H["append"]("image", G, "image.png"),
        H["append"]("msg_type", 0x2),
        console["log"]("获取\x20key", z));
      const I = await fetch("https://store.weixin.qq.com/shop/commkf/cos_upload", {
        method: "POST",
        credentials: "include",
        headers: { biz_magic: z },
        body: H,
      })["then"]((K) => K["json"]());
      (console["log"]("cosUrl", I),
        I?.["cos_url"] &&
          fetch("https://store.weixin.qq.com/shop/commkf/msg?action=send_room_msg", {
            method: "POST",
            credentials: "include",
            headers: { biz_magic: z },
            body: JSON["stringify"]({
              room_id: y,
              msg_type: 0x2,
              msg_content:
                "{\x22name\x22:\x22图片.jpg\x22,\x22ld_img\x22:{\x22img_uri\x22:{\x22url\x22:\x22" +
                I?.["cos_url"] +
                "\x22,\x22size\x22:" +
                A["size"] +
                ",\x22aeskey\x22:\x22\x22,\x22authkey\x22:\x22\x22,\x22md5sum\x22:\x22\x22},\x22width\x22:" +
                A["width"] +
                ",\x22height\x22:" +
                A["height"] +
                "},\x22hd_img\x22:{\x22img_uri\x22:{\x22url\x22:\x22" +
                I?.["cos_url"] +
                "\x22,\x22size\x22:" +
                A["size"] +
                ",\x22aeskey\x22:\x22\x22,\x22authkey\x22:\x22\x22,\x22md5sum\x22:\x22\x22},\x22width\x22:" +
                A["width"] +
                ",\x22height\x22:" +
                A["height"] +
                "}}",
              extra_info:
                "{\x22head_img\x22:\x22" +
                g["logo"] +
                "\x22,\x22nickname\x22:\x22" +
                g["username"] +
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
  let g = null;
  class h {
    constructor() {
      ((this["db"] = null),
        (this["DB_NAME"] = "userByOrderInfo"),
        (this["STORE_NAME"] = "value"),
        (this["VERSION"] = 0x1));
    }
    async ["init"]() {
      if (this["db"]) return this["db"];
      return (
        (this["db"] = await new Promise((x, y) => {
          const z = indexedDB["open"](this["DB_NAME"], this["VERSION"]);
          ((z["onupgradeneeded"] = (A) => {
            const B = A["target"]["result"];
            !B["objectStoreNames"]["contains"](this["STORE_NAME"]) &&
              B["createObjectStore"](this["STORE_NAME"], { keyPath: "id" });
          }),
            (z["onsuccess"] = () => x(z["result"])),
            (z["onerror"] = () => y(z["error"])));
        })),
        this["db"]
      );
    }
    async ["save"](x) {
      const y = await this["init"]();
      return new Promise((z, A) => {
        const B = y["transaction"](this["STORE_NAME"], "readwrite"),
          C = B["objectStore"](this["STORE_NAME"]),
          D = C["put"](x);
        ((D["onsuccess"] = () => z(!![])), (D["onerror"] = () => A(D["error"])));
      });
    }
    async ["get"](x) {
      const y = await this["init"]();
      return new Promise((z, A) => {
        const B = y["transaction"](this["STORE_NAME"], "readonly"),
          C = B["objectStore"](this["STORE_NAME"]),
          D = C["get"](x);
        ((D["onsuccess"] = () => z(D["result"] || null)), (D["onerror"] = () => A(D["error"])));
      });
    }
    async ["getAll"]() {
      const x = await this["init"]();
      return new Promise((y, z) => {
        const A = x["transaction"](this["STORE_NAME"], "readonly"),
          B = A["objectStore"](this["STORE_NAME"]),
          C = B["getAll"]();
        ((C["onsuccess"] = () => y(C["result"] || [])), (C["onerror"] = () => z(C["error"])));
      });
    }
    async ["delete"](x) {
      const y = await this["init"]();
      return new Promise((z, A) => {
        const B = y["transaction"](this["STORE_NAME"], "readwrite"),
          C = B["objectStore"](this["STORE_NAME"]),
          D = C["delete"](x);
        ((D["onsuccess"] = () => z(!![])), (D["onerror"] = () => A(D["error"])));
      });
    }
  }
  const i = new h();
  class j {
    constructor(x, y, z, A, B, C = ![], D, E, F, G, H, I) {
      ((this["messageId"] = x),
        (this["username"] = y),
        (this["timeout"] = A),
        (this["avatar"] = B),
        (this["content"] = z),
        (this["api"] = C),
        (this["msg_id"] = D),
        (this["send_openid"] = E),
        (this["goodId"] = F),
        (this["goodName"] = G),
        (this["orderId"] = H),
        (this["orderStatus"] = I),
        (this["type"] = "code"));
    }
  }
  class k {
    constructor(x, y, z, A, B) {
      ((this["name"] = x),
        (this["username"] = y),
        (this["kf"] = z),
        (this["logo"] = A),
        (this["id"] = B));
    }
  }
  const l = (x) => {
      const y = Number(x);
      return y > 0xe8d4a51000 ? Math["floor"](y / 0x3e8) : y;
    },
    m = window["WebSocket"];
  window["WebSocket"] = function (x, y) {
    const z = new m(x, y),
      A = z["send"];
    return (
      (z["send"] = function (B) {
        A["apply"](this, arguments);
      }),
      z["addEventListener"]("error", function (B) {
        console["info"]("wss断开");
      }),
      z["addEventListener"]("open", function (B) {
        console["info"]("打开ws");
      }),
      z["addEventListener"]("close", function (B) {
        console["info"]("WebSocket连接关闭");
      }),
      z
    );
  };
  const n = [
      {
        name: "获取鉴权信息1",
        match: (x, y) => x === "POST" && y["includes"]("/shop/commkf/room?action=get_room_info"),
        onResponse: (x, y, z) => {
          x?.["base_resp"]?.["ret"] === 0xbb8 &&
            (console["log"]("cookie过期\x20鉴权失败=============", x),
            window["context_bridge"]["send"]("account-login-expired"));
        },
      },
      {
        name: "获取鉴权信息",
        match: (x, y) => x === "POST" && y["includes"]("/shop/commkf/web?action=wss_login"),
        onResponse: (x, y, z) => {
          x["base_resp"]["ret"] === 0xbb8 &&
            (console["log"]("cookie过期\x20鉴权失败=============", x),
            window["context_bridge"]["send"]("account-login-expired"));
        },
      },
      {
        name: "获取用户历史信息",
        match: (x, y) => x === "POST" && y["includes"]("/shop/commkf/msg?action=get_room_msg"),
        onResponse: (x, y, z) => {
          const A = JSON["parse"](z);
          if (A && A["num"] == 0x1e && A["op"] == 0x0) {
            const B = x["list"] || null;
            window["postMessage"]({
              type: "get-history-message",
              value: B,
            });
          }
        },
      },
      {
        name: "店铺状态",
        match: (x, y) => x === "POST" && y == "/shop/commkf/acct?action=get_kf_acct",
        onResponse: (x, y, z) => {
          console["log"]("店铺状态=============", x);
          const { kf_acct_info_list: A } = x,
            B = A[0x0];
          x["acct_num"] == "1" &&
            ((g = new k(
              B["account_name"],
              B["nick_name"],
              B["openid"],
              B["account_head_url"],
              B["open_account"],
            )),
            window["postMessage"]({
              type: "get-shop-info",
              data: g,
            }),
            console["log"]("shopInfo============", g));
          if (a && a != "null" && a != g["name"] && !a["includes"]("未登录"))
            (window["context_bridge"]["send"]("refresh-shop", a),
              window["location"]["replace"]("https://store.weixin.qq.com/shop/home?shopName=" + a));
          else {
            window["context_bridge"]["send"]("get-shop-info", g);
            let C = null;
            switch (B["status"]) {
              case "0":
                ((C = "离线"),
                  window["context_bridge"]["send"]("shop-status-change", { status: C }));
                break;
              case "1":
                ((C = "在线"),
                  window["context_bridge"]["send"]("shop-status-change", { status: C }));
                break;
              case "2":
                ((C = "忙碌"),
                  window["context_bridge"]["send"]("shop-status-change", { status: C }));
                break;
            }
          }
        },
      },
      {
        name: "结束会话",
        match: (x, y) => x === "POST" && y["includes"]("/shop/commkf/room?action=end_room"),
        onResponse: (x, y, z) => {
          const A = JSON["parse"](z);
          console["log"]("结束会话");
        },
      },
      {
        name: "删除信息",
        match: (x, y) => x === "POST" && y["includes"]("/shop/commkf/msg?action=send_room_msg"),
        onResponse: (x, y, z) => {
          const A = JSON["parse"](z);
          console["info"]("删除信息", A);
          let B = null;
          try {
            const C = A?.["msg_content"],
              D = typeof C === "string" ? JSON["parse"](C) : C;
            B = D?.["content"] || null;
          } catch (E) {
            console["warn"]("解析\x20msg_content\x20失败", E, A);
          }
          window["context_bridge"]["send"]("reply-customer-message", {
            messageId: A?.["room_id"],
            content: B,
          });
        },
      },
      {
        name: "获取同步消息",
        match: (x, y) => x === "POST" && y["includes"]("/shop/commkf/msg?action=get_sync_msg"),
        onResponse: (x, y) => {
          const { list: z } = x;
          z &&
            z["length"] > 0x0 &&
            z["forEach"](async (A) => {
              const B = JSON["parse"](A["extra_info"]),
                C = JSON["parse"](A["msg_kf_content"]);
              if (B?.["unread_msg_num"] || C?.["summary_content"]) {
                let D = "",
                  E = "",
                  F = "",
                  G = "";
                if (C["type"] === 0xd) {
                  const N = JSON["parse"](C["content"] || "{}");
                  (console["log"]("goodRes", N),
                    (content = "用户发送商品"),
                    (D = N["product_id"]),
                    (E = N["product_title"]));
                } else {
                  if (C["type"] === 0xe) {
                    const O = JSON["parse"](C["content"] || "{}");
                    (console["log"]("orderRes", O),
                      (content = "用户发送订单"),
                      (F = O?.["order_id"] || ""),
                      (G = O?.["state_wording"] || ""));
                  } else {
                    if (C["hd_img"] || C["img_uri"]) content = "用户发送了图片";
                    else {
                      if (C["video_uri"]) content = "用户发送了视频";
                      else {
                        if (C["mp3_voice_buf"]) content = C["translated_word"] || "语音消息";
                        else {
                          if (C["content"])
                            try {
                              const P = JSON["parse"](C["content"]);
                              content = P["content"] || C["content"];
                            } catch {
                              content = C["content"];
                            }
                        }
                      }
                    }
                  }
                }
                const H = Number(A["update_time"]) + 0xb4;
                let I = new j(
                    A["room_id"],
                    B["nickname"],
                    content,
                    H,
                    B["head_img"],
                    !![],
                    A["msg_id"],
                    A["send_openid"],
                    D,
                    E,
                    F,
                    G,
                  ),
                  J = new q(I);
                const K = await i["get"](I["messageId"]);
                console["log"]("dbValue==========", K);
                let L = ![],
                  M = null;
                if (K) {
                  I = new r(I, K);
                  if (I["orderId"] && I["orderId"] !== K["orderId"]) ((L = !![]), (M = "orderId"));
                  else {
                    if (I["goodId"] && I["goodId"] !== K["goodId"]) ((L = !![]), (M = "goodId"));
                    else
                      I["orderStatus"] &&
                        I["orderStatus"] !== K["orderStatus"] &&
                        ((L = !![]), (M = "orderStatus"));
                  }
                  if (M === "orderId") {
                    console["log"]("订单ID发生变化，刷新订单详情");
                    const Q = await u(I["orderId"]);
                    (Q &&
                      ((I["orderStatus"] = Q["orderStatus"] || ""),
                      (I["orderId"] = Q["orderId"] || "")),
                      (J = new q(I)));
                  } else {
                    if (M === "goodId") {
                      console["log"]("商品ID发生变化，刷新商品详情");
                      const R = await s(I["goodId"]);
                      (console["log"]("data==========", R),
                        (I["sku"] = R?.["goods_sku"] || ""),
                        (I["goodInfo"] = R?.["goods_properties"] + "" + R?.["goods_sku"]),
                        (I["goodName"] = R?.["goods_name"] || ""),
                        (J = new q(I)));
                    } else {
                      if (M === "orderStatus") {
                        console["log"]("订单状态发生变化，刷新订单状态");
                        const S = await u(I["orderId"]);
                        (S &&
                          ((I["orderStatus"] = S["orderStatus"] || ""),
                          (I["orderId"] = S["orderId"] || "")),
                          (J = new q(I)));
                      }
                    }
                  }
                  L && (await i["save"](J));
                } else {
                  console["log"](
                    "!params.orderId\x20&&\x20params.goodId",
                    !I["orderId"],
                    I["goodId"],
                  );
                  if (!I["orderId"] && I["goodId"]) {
                    const U = await s(I["goodId"]);
                    (console["log"]("data==========", U),
                      (I["goodInfo"] = U?.["goods_properties"] + "" + U?.["goods_sku"]),
                      (I["sku"] = U?.["goods_sku"] || ""),
                      (I["goodName"] = U?.["goods_name"] || ""));
                  } else
                    !I["goodId"] &&
                      !I["orderId"] &&
                      (console["log"]("无商品ID无订单ID"), (I["goodId"] = await c()));
                  const T = await t(I["messageId"], I["send_openid"]);
                  (console["log"]("orderResult==========", T),
                    T &&
                      ((I["orderStatus"] = T["orderStatus"] || ""),
                      (I["orderId"] = T["orderId"] || ""),
                      (I["goodId"] = T["goodId"] || "")),
                    (J = new q(I)),
                    await i["save"](J),
                    (I = new r(I, J)));
                }
                ((I["type"] = "code"),
                  console["log"]("message=============", A, I, I["content"]),
                  window["context_bridge"]["send"]("get-customer-message-list", [I]));
              }
            });
        },
      },
      {
        name: "初始化页面消息列",
        match: (x, y) =>
          x === "POST" && y["includes"]("/shop/commkf/summary?action=get_session_summary"),
        onResponse: (x, y) => {
          (console["log"]("data==========", x),
            x &&
              x["summary_list"]["forEach"](async (z) => {
                if (!z["lastest_msg_kf_content"]) return;
                const A = JSON["parse"](z["lastest_msg_kf_content"]);
                if (
                  z["unreplied_msg_time"] != "0" &&
                  A?.["type"] != "EndRoom" &&
                  !d(z["update_time"])
                ) {
                  cont = JSON["parse"](z["extra_info"]);
                  const { content: B } = A;
                  console["log"]("item==========", z);
                  const C = await t(z["room_id"], z["send_openid"]);
                  console["log"]("orderResult==========", C);
                  let D = new j(
                    z["room_id"],
                    cont["nickname"],
                    B,
                    l(z["unreplied_msg_time"]) + 0xb4,
                    cont["head_img"],
                    !![],
                    z["lastest_msg_id"],
                    z["send_openid"],
                  );
                  ((D["goodId"] = C?.["goodId"] || ""),
                    (D["goodName"] = C?.["goodInfo"] || ""),
                    (D["goodCat"] = C?.["goodCat"] || ""),
                    (D["goodInfo"] = (C?.["goodInfo"] || "") + C?.["goodCat"] + C?.["sku"]),
                    (D["orderStatus"] = C?.["orderStatus"] || ""),
                    console["log"]("params=====", D, C?.["sku"]),
                    window["context_bridge"]["send"]("get-customer-message-list", [D]));
                }
              }));
        },
      },
    ],
    o = XMLHttpRequest["prototype"]["open"],
    p = XMLHttpRequest["prototype"]["send"];
  ((XMLHttpRequest["prototype"]["open"] = function (x, y, ...z) {
    return ((this["_hook_rule"] = n["find"]((A) => A["match"](x, y))), o["call"](this, x, y, ...z));
  }),
    (XMLHttpRequest["prototype"]["send"] = function (x) {
      const y = this["_hook_rule"];
      if (y) {
        this["_hook_body"] = x;
        y["onRequest"] && (x = y["onRequest"](x));
        const z = this["onreadystatechange"];
        this["onreadystatechange"] = function (...A) {
          if (this["readyState"] === 0x4 && y["onResponse"])
            try {
              const B = JSON["parse"](this["responseText"]);
              (B?.["base_resp"]?.["ret"] == 0x7530 &&
                (console["log"]("登录过期", B),
                window["context_bridge"]["send"]("account-login-expired")),
                B?.["base_resp"]["ret"] == 0x7530 &&
                  (console["log"]("登录过期", B),
                  window["context_bridge"]["send"]("account-login-expired")),
                y["onResponse"](B, this, this["_hook_body"]));
            } catch (C) {
              console["error"]("[拦截错误]\x20" + y["name"] + ":", C);
            }
          if (z) z["apply"](this, A);
        };
      }
      return p["call"](this, x);
    }),
    window["addEventListener"]("message", (x) => {
      if (x["data"] && x["data"]["type"] === "WS_STATE_CHANGE") wsConnectState = x["data"]["state"];
      else {
        if (x["data"]["type"] === "sendProduct") {
          const y = x["data"]["value"]["messageId"],
            z = x["data"]["value"]["msgId"];
        } else {
          if (x["data"]["type"] === "get-key")
            (console["log"]("get-key", x["data"]["value"]), (window["_key"] = x["data"]["value"]));
          else {
            if (x["data"]["type"] == "select-user")
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
              if (x["data"]["type"] === "send-message")
                (console["log"]("send-message=============", x["data"], window["_key"]),
                  fetch("https://store.weixin.qq.com/shop/commkf/msg?action=send_room_msg", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json,\x20text/plain",
                      biz_magic: window["_key"],
                    },
                    body: JSON["stringify"]({
                      room_id: "" + x["data"]["data"]["messageId"],
                      msg_type: 0x1,
                      msg_content: "{\x22content\x22:\x22" + x["data"]["data"]["content"] + "\x22}",
                      extra_info:
                        "{\x22head_img\x22:\x22" +
                        g["logo"] +
                        "\x22,\x22nickname\x22:\x22" +
                        g["username"] +
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
                if (x["data"]["type"] === "send-image") {
                  const A = x["data"]["data"];
                  (console["log"]("send-image=============", x["data"], window["_key"]),
                    f(A["base64"], A?.["userId"] || A?.["messageId"], A["key"] || window["_key"]));
                }
              }
            }
          }
        }
      }
    }));
  class q {
    constructor(x) {
      ((this["id"] = x["messageId"]),
        (this["orderId"] = x["orderId"]),
        (this["orderStatus"] = x["orderStatus"]),
        (this["goodId"] = x["goodId"]),
        (this["goodName"] = x["goodName"] || ""),
        (this["goodInfo"] = x["goodInfo"] || ""),
        (this["sku"] = x["sku"] || ""),
        (this["InfoTimerout"] = Date["now"]()));
    }
  }
  class r {
    constructor(x, y) {
      Object["assign"](this, x);
      for (const z in y) {
        if (y[z]) {
          const A = this[z];
          (A === "" || A === null || A === undefined) && (this[z] = y[z]);
        }
      }
    }
  }
  async function s(x) {
    console["log"]("获取商品详情，goodId=", x, window["_key"]);
    if (window["_key"])
      try {
        const y = await fetch(
          "https://store.weixin.qq.com/shop-faas/mmchannelstradeproductcore/cgi/goods/getEditProductV2?token=&lang=zh_CN&productKey=%7B%22productId%22:" +
            x +
            "%7D&needRealStock=true&preview=false&release=false\x0a",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              biz_magic: window["_key"] || "",
            },
          },
        )["then"]((z) => z["json"]());
        console["log"]("商品详情数据==========", y);
        if (y["success"]) {
          const z = y["product"]["info"];
          let A = null;
          y["product"]["productSkus"] &&
            Array["isArray"](y["product"]["productSkus"]) &&
            ((A = w(y["product"]["productSkus"])), console["log"]("商品sku==========", A));
          const B = {
            goodId: x,
            goodName: z["title"],
            goodProperties: z["param"] ? v(z["param"]) : [],
            goodSku: A,
            goodCat: z?.["recommendCategory"]?.["categoryNames"]["join"]("/"),
            mainImage: z["productHeadimgInfo"][0x0]["imgUrl"],
            detailImages: z["detail"]["detailImg"],
          };
          return (console["log"]("商品详情数据==========", B), B);
        } else return null;
      } catch (C) {
        console["error"]("获取商品详情失败", C);
      }
  }
  const t = async (x, y) => {
      const z = await fetch(
          "https://store.weixin.qq.com/shop/kf/cgi/order/getOrderListV2?tabType=0&userOpenid=" +
            y +
            "&roomId=" +
            x +
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
        A = await z["json"]();
      let B = {
        orderStatus: "暂无订单",
        orderId: "",
        goodInfo: "",
        goodId: "",
        sku: "",
        goodCat: "",
      };
      console["log"]("主动请求用户的订单", A);
      if (A["orders"]?.["length"]) {
        const C = A["orders"][0x0],
          D = C?.["orderInfo"]?.["orderProductInfo"]?.[0x0],
          E = D?.["extInfo"];
        ((B["orderStatus"] = C?.["statusWording"] || "暂无订单"),
          (B["orderId"] = C?.["orderId"] || ""),
          console["log"]("订单详情数据==========", E));
        E && (B["goodId"] = D?.["productId"] || "");
        if (B["orderId"]) {
          const F = await s(B["goodId"]);
          console["log"]("goodItem", F);
        }
      }
      return (console["log"]("返回的\x20订单", B, B["orderStatus"]), B);
    },
    u = async (x, y, z) => {
      const A = await fetch("https://store.weixin.qq.com/shop/kf/cgi/order/searchOrderV2", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          keyword: z,
          lastIndex: "0",
          pageNum: 0x1,
          pageSize: 0xa,
          roomId: x,
          userOpenid: y,
          tabType: 0x0,
        }),
      })["then"]((B) => B["json"]());
      if (A?.["orders"])
        return (
          console["log"]("订单详情数据==========", A),
          {
            orderId: z,
            orderStatus: A["orders"][0x0]["statusWording"],
          }
        );
    };
  function v(x) {
    return x["map"]((y) => {
      const z = y["categorys"];
      if (!Array["isArray"](z) || z["length"] < 0x2) return null;
      const A = z[0x0]?.["name"]?.["trim"](),
        B = z[0x1]?.["name"]?.["trim"]();
      if (!A || !B) return null;
      return A + ":" + B;
    })["filter"](Boolean);
  }
  function w(x) {
    const y = new Map();
    return (
      console["log"]("商品sku数据==========", x),
      x["forEach"]((z) => {
        const A = z?.["productSkuInfo"]?.["saleParam"] || [];
        A["forEach"]((B) => {
          const C = B["categorys"] || [];
          if (C["length"] < 0x2) return;
          const D = C[0x0]?.["name"],
            E = C[0x1]?.["name"];
          if (!D || !E) return;
          (!y["has"](D) && y["set"](D, new Set()), y["get"](D)["add"](E));
        });
      }),
      { goodSku: [...y["entries"]()]["map"](([z, A]) => z + ":" + [...A]["join"]("/")) }
    );
  }
};
(webFrame["executeJavaScript"]("(" + HOOK_CODE + ")(\x27" + shop_Name + "\x27);"),
  safeIpcOn("click-customer-message", async (a, b) => {
    console["log"]("跳转用户", b);
    const { messageId: c, username: d, avatar: e } = b;
    getUnReplyMessage(c, d, e);
  }));
let isProcessing = ![];
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
});
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
  },
  handleReplyMessage = async (a) => {
    console["log"]("需要处理信息==========", a);
    const b =
      document["querySelector"](".chat-customer-name")?.["textContent"] == a["username"] ||
      (await getUnReplyMessage(a["messageId"], a["username"], a["avatar"]));
    console["log"]("isSuccess", b);
    if (b) {
      const c = document["querySelector"]("#input-textarea");
      console["log"]("进入会话页面成功", c);
      if (a["imageBase64"] || a["imageUrl"]) {
        console["log"]("[handleReplyMessage]\x20检测到图片数据，开始发送图片");
        try {
          (await sendImageMessage(
            a["messageId"],
            a["imageBase64"],
            a["imageMimeType"],
            a["imageUrl"],
          ),
            console["log"]("[handleReplyMessage]\x20图片发送成功"),
            await delay(0x1f4));
        } catch (d) {
          console["error"]("[handleReplyMessage]\x20图片发送失败:", d);
        }
      }
      if (a["isImageOnly"])
        return (console["log"]("[handleReplyMessage]\x20纯图片消息，跳过文本发送"), !![]);
      if (!a["content"] || a["content"]["trim"]() === "")
        return (console["log"]("[handleReplyMessage]\x20无文本内容，跳过"), !![]);
      return (
        c["focus"](),
        (c["value"] = a["content"]),
        c["dispatchEvent"](new Event("input", { bubbles: !![] })),
        c["dispatchEvent"](eventKey),
        await delay(0xc8),
        c["value"] ? ![] : !![]
      );
    } else {
      const e = document["querySelector"](".weui-desktop-form__input");
      ((e["value"] = a?.["orderId"] || a["username"]),
        e["dispatchEvent"](new Event("input", { bubbles: !![] })));
      const f = await getElementRecursive(".result-panel", 0x14, 0x32);
      await delay(0x1f4);
      const g = f["querySelector"]("[data-src=\x22" + a["avatar"] + "\x22]");
      (g["click"](), await delay(0x1f4));
      const h = document["querySelector"](".chat-customer-name")?.["textContent"] == a["username"];
      if (h) {
        const i = document["querySelector"]("#input-textarea");
        if (a["imageBase64"] || a["imageUrl"]) {
          console["log"]("[handleReplyMessage]\x20检测到图片数据，开始发送图片(搜索路径)");
          try {
            (await sendImageMessage(
              a["messageId"],
              a["imageBase64"],
              a["imageMimeType"],
              a["imageUrl"],
            ),
              console["log"]("[handleReplyMessage]\x20图片发送成功"),
              await delay(0x1f4));
          } catch (j) {
            console["error"]("[handleReplyMessage]\x20图片发送失败:", j);
          }
        }
        if (a["isImageOnly"])
          return (console["log"]("[handleReplyMessage]\x20纯图片消息，跳过文本发送"), !![]);
        if (!a["content"] || a["content"]["trim"]() === "")
          return (console["log"]("[handleReplyMessage]\x20无文本内容，跳过"), !![]);
        return (
          i["focus"](),
          (i["value"] = a["content"]),
          i["dispatchEvent"](new Event("input", { bubbles: !![] })),
          i["dispatchEvent"](eventKey),
          await delay(0xc8),
          i["value"] ? ![] : !![]
        );
      }
    }
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
      ((e["history"] = n), ipcRenderer["send"]("get-historical-records", JSON["stringify"](e)));
      return;
    }
    e = await getDomHistoryMessage(b);
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
      ((e["history"] = w), ipcRenderer["send"]("get-historical-records", JSON["stringify"](e)));
    } else ipcRenderer["send"]("get-historical-records", JSON["stringify"](e));
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
function extractTextFromTabSync() {
  try {
    const a = document["querySelector"](".recommend-product-block\x20.product-item");
    if (!a) return (console["log"]("未找到商品元素"), "");
    a?.["click"]();
    const b = document["querySelector"](
      ".t-drawer__content-wrapper\x20.product-content-wrap\x20.title.line-clamp-1",
    );
    return b?.["innerText"]?.["trim"]() || "";
  } catch (c) {
    return (console["warn"]("extractTextFromTabSync\x20执行失败:", c), "");
  }
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
function getCategoryChain(a, b) {
  const c = String(b),
    d = new Map();
  for (const g of a) {
    const h = String(g["id"] ?? g["value"]),
      i =
        g["fId"] != null ? String(g["fId"]) : g["parentId"] != null ? String(g["parentId"]) : null;
    d["set"](h, {
      id: h,
      fId: i,
      name: g["name"] ?? g["label"] ?? "",
    });
  }
  if (!d["has"](c)) return null;
  const e = [];
  let f = d["get"](c);
  while (f) {
    e["unshift"]({
      id: f["id"],
      name: f["name"],
    });
    if (!f["fId"] || f["fId"] === "0") break;
    f = d["get"](f["fId"]);
  }
  return e;
}
function getCategoryPath(a, b) {
  const c = getCategoryChain(a, b);
  if (!c) return null;
  return c["map"]((d) => d["name"])["join"](">");
}
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
  }));
async function getElementRecursive(a, b = 0x1e, c = 0x64) {
  const d = document["body"]["querySelector"](a);
  if (d) return d;
  if (b <= 0x1) return null;
  return (await new Promise((e) => setTimeout(e, c)), getElementRecursive(a, b - 0x1, c));
}
const urlReminder = (a) => {
  (console["log"]("urlReminder", message),
    fetch("https://store.weixin.qq.com/shop/commkf/room?action=get_room_recommend_info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json,\x20text/plain,\x20*/*",
        biz_magic: key,
      },
      body: JSON["stringify"]({ room_id: a }),
    })
      ["then"]((b) => b["json"]())
      ["then"]((b) => {
        console["log"]("获取推荐信息", b);
        if (b["recommend_product_infos"] && b["recommend_product_infos"]["length"] > 0x0) {
          const c = b["recommend_product_infos"][0x0];
          function d() {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"["replace"](/[xy]/g, function (e) {
              const f = (Math["random"]() * 0x10) | 0x0,
                g = e === "x" ? f : (f & 0x3) | 0x8;
              return g["toString"](0x10);
            });
          }
          fetch("https://store.weixin.qq.com/shop/commkf/msg?action=send_room_msg", {
            method: "POST",
            headers: {
              "Content-Type": "application/json,\x20text/plain",
              biz_magic: key,
            },
            body: JSON["stringify"]({
              room_id: message["messageId"],
              msg_type: 0x14,
              msg_content:
                "{\x22template_id\x22:18,\x22type\x22:7,\x22title\x22:\x22邀请下单\x22,\x22check_req\x22:\x22{\x5c\x22product_id\x5c\x22:\x5c\x22" +
                c["product_id"] +
                "\x5c\x22,\x5c\x22product_num\x5c\x22:1,\x5c\x22unique_id\x5c\x22:\x5c\x22" +
                d() +
                "\x5c\x22}\x22,\x22order_info\x22:{\x22products\x22:\x22" +
                c["product_name"] +
                "\x22,\x22products_count\x22:1,\x22product_image_url\x22:\x22" +
                c["head_imgs"][0x0] +
                "\x22,\x22price_wording\x22:\x22¥" +
                (c["min_product_price"] / 0x64)["toFixed"](0x2) +
                "\x22},\x22use_custom_key_value\x22:true}",
              msg_id: message?.["msg_id"],
              send_source: 0x2,
              send_tools: 0x5,
              create_time_ms: Date["now"](),
              client_ms: Date["now"](),
            }),
          })
            ["then"]((e) => e["json"]())
            ["then"]((e) => {
              console["log"]("发送商品信息", e);
            });
        }
      }));
};
(window["addEventListener"]("message", (a) => {
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
safeIpcOn("get-customer-performance-info", (a, b) => {
  getCustomerPerformanceInfo(b);
});
const getCustomerPerformanceInfo = (a) => {
  a = JSON["parse"](a);
  try {
    const b = new Date();
    (b["setDate"](b["getDate"]() - 0x1), b["setHours"](0x0, 0x0, 0x0, 0x0));
    let c = Math["floor"](b["getTime"]() / 0x3e8),
      d = Math["floor"](b["getTime"]() / 0x3e8);
    if (a["info"]) {
      if (typeof a["info"]["month"] === "string") {
        const e = new Date(a["info"]["month"]);
        (e["setHours"](0x0, 0x0, 0x0, 0x0),
          (c = Math["floor"](e["getTime"]() / 0x3e8)),
          (d = Math["floor"](e["getTime"]() / 0x3e8)));
      } else {
        const f = new Date(a["info"]["month"][0x0]);
        f["setHours"](0x0, 0x0, 0x0, 0x0);
        const g = new Date(a["info"]["month"][0x1]);
        (g["setHours"](0x0, 0x0, 0x0, 0x0),
          (c = Math["floor"](f["getTime"]() / 0x3e8)),
          (d = Math["floor"](g["getTime"]() / 0x3e8)));
      }
    }
    fetch(mainUrl + "shop/kf/cgi/data/getOfflineKfV2?beginDate=" + c + "&endDate=" + d, {
      credentials: "include",
      method: "GET",
    })
      ["then"]((h) => h["json"]())
      ["then"](async (h) => {
        console["log"]("微信小店绩效数据返回:", h);
        if (h["ret"] === 0x0 && h["cardResp"]) {
          const i = h["cardResp"]["objects"]?.["tableValueLine"]?.[0x0]?.["columnValue"] || [];
          let j = "0%";
          try {
            const m = await fetch(
                mainUrl +
                  "shop/kf/cgi/data/getKfSales?beginDate=" +
                  c +
                  "&endDate=" +
                  d +
                  "&realTime=false",
                {
                  credentials: "include",
                  method: "GET",
                },
              ),
              n = await m["json"]();
            console["log"]("询单转化率数据返回:", n);
            if (n["ret"] === 0x0 && n["cardResp"]) {
              const o = n["cardResp"]["find"]((p) => p["dataKey"] === "conversionRate");
              o && (j = o["value"] + "%");
            }
          } catch (p) {
            console["log"]("获取询单转化率失败:", p);
          }
          const k = a["info"]["type"] ? a["info"]["type"] : "1",
            l = [
              (() => {
                return k === "1"
                  ? {
                      volume: i[0x1] || "0",
                      minuteResp: formatRate(i[0x3]),
                      averageResp: formatTimeToMinutes(i[0x4]),
                      satisfactionRate: formatRate(i[0x6]),
                      conversionRate: j,
                      month:
                        a?.["info"]?.["month"] ||
                        (() => {
                          const q = new Date();
                          return (
                            q["setDate"](q["getDate"]() - 0x1),
                            q["getFullYear"]() +
                              "-" +
                              (q["getMonth"]() + 0x1) +
                              "-" +
                              String(q["getDate"]())["padStart"](0x2, "0")
                          );
                        })(),
                      type: k,
                      shopId: a["info"]["shopId"],
                      id: a?.["info"]?.["id"] || "",
                    }
                  : {
                      id: a["info"]["id"],
                      volume: i[0x1] || "0",
                      threeMinRespRate: formatRate(i[0x3]),
                      averageResp: formatTimeToMinutes(i[0x4]),
                      satisfaction: formatRate(i[0x6]),
                      conversionRate: j,
                      type: k,
                    };
              })(),
            ];
          ipcRenderer["send"]("set-customer-performance-info", l);
        } else throw new Error("API\x20返回错误:\x20" + h["ret"]);
      });
  } catch (h) {
    (console["log"]("error", h),
      ipcRenderer["send"]("web-scoker-error-callback", {
        info: a,
        errormsg: "查询店铺绩效数据失败,失败原因:" + h,
        shopId: a["info"]?.["shopId"],
      }));
  }
};
function formatRate(a) {
  if (!a || a === "0") return "0%";
  return Math["round"](parseFloat(a) * 0x64) + "%";
}
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
