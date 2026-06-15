const { clipboard, nativeImage, ipcRenderer, shell, webFrame, contextBridge } = require("electron");
contextBridge["exposeInMainWorld"]("context_bridge", {
  sendToHost: (a, b) => ipcRenderer["sendToHost"](a, b),
  invoke: (a, b) => ipcRenderer["invoke"](a, b),
  send: (a, b) => ipcRenderer["send"](a, b),
  on: (a, b) => ipcRenderer["on"](a, b),
  openExternal: (a) => shell["openExternal"](a),
  clipboard: {
    writeText: (a) => clipboard["writeText"](a),
    readText: () => clipboard["readText"](),
    readImage: () => clipboard["readImage"](),
    writeImage: (a) => clipboard["writeImage"](a),
  },
  nativeImage: {
    createFromPath: (a) => nativeImage["createFromPath"](a),
    createFromDataURL: (a) => nativeImage["createFromDataURL"](a),
    createFromBuffer: (a) => nativeImage["createFromBuffer"](a),
  },
});
const shouldDisablePreloadConsole = process["argv"]["includes"]("--kh-disable-preload-console");
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
let logoInfo = {
    username: "",
    password: "",
    shopId: null,
  },
  currentShopName = "",
  xhsSellerId = null;
(document["addEventListener"](
  "contextmenu",
  function (a) {
    const b = a["target"],
      c = b["closest"](
        "[id^=\x22jarvis-msg\x22],\x20.message-content,\x20.chat-message-content,\x20[class*=\x22message-content\x22]",
      );
    if (c) return (a["preventDefault"](), a["stopPropagation"](), ![]);
  },
  { capture: !![] },
),
  window["addEventListener"]("load", function () {
    (ipcRenderer["send"]("get-shop-page-loaded"),
      setTimeout(function () {
        (ipcRenderer["send"]("get-shop-pwd"), ipcRenderer["send"]("request-shop-bot-status"));
      }, 0x3e8));
    function a() {
      var c = document["querySelectorAll"](".d-modal");
      for (var d = 0x0; d < c["length"]; d++) {
        var e = c[d],
          f = e["querySelector"](".d-modal-header"),
          g = e["querySelector"](".d-modal-content"),
          h = f && f["textContent"] ? f["textContent"] : "",
          k = g && g["textContent"] ? g["textContent"] : "";
        if (h["indexOf"]("提示") !== -0x1 && k["indexOf"]("登录认证已过期") !== -0x1) {
          console["log"]("[XHS]\x20检测到登录过期弹窗，自动点击确定");
          var l = e["querySelectorAll"]("button"),
            m = null;
          for (var n = 0x0; n < l["length"]; n++) {
            var o = l[n],
              p = o["textContent"] ? o["textContent"]["trim"]() : "";
            if (p["indexOf"]("确定") !== -0x1 && o["style"]["display"] !== "none") {
              m = o;
              break;
            }
          }
          if (m)
            return (
              setTimeout(function () {
                (m["click"](), console["log"]("[XHS]\x20已点击确定按钮"));
              }, 0x1f4),
              !![]
            );
        }
      }
      return ![];
    }
    var b = new MutationObserver(function (c) {
      c["forEach"](function (d) {
        d["type"] === "childList" &&
          d["addedNodes"]["forEach"](function (e) {
            e["nodeType"] === 0x1 && a();
          });
      });
    });
    (b["observe"](document["body"], {
      childList: !![],
      subtree: !![],
    }),
      console["log"]("[XHS]\x20已启动登录过期弹窗监听"),
      setTimeout(function () {
        a();
      }, 0x3e8),
      setTimeout(function () {
        var c = document["querySelector"](".login-user-input[placeholder=\x22邮箱\x22]"),
          d = document["querySelector"](
            ".login-user-input[placeholder=\x22密码\x22],\x20.login-user-input[type=\x22password\x22]",
          ),
          e = document["querySelector"](".login-submit-btn");
        c && d && e
          ? (console["log"]("[XHS\x20Login]\x20检测到登录界面，准备自动登录"),
            setTimeout(function () {
              logoInfo["username"] && logoInfo["password"]
                ? (console["log"]("[XHS\x20Login]\x20开始填入账户密码:", logoInfo["username"]),
                  (c["value"] = logoInfo["username"]),
                  c["dispatchEvent"](new Event("input", { bubbles: !![] })),
                  c["dispatchEvent"](new Event("change", { bubbles: !![] })),
                  c["addEventListener"]("input", function (f) {
                    logoInfo["username"] = c["value"];
                  }),
                  (d["value"] = logoInfo["password"]),
                  d["dispatchEvent"](new Event("input", { bubbles: !![] })),
                  d["dispatchEvent"](new Event("change", { bubbles: !![] })),
                  d["addEventListener"]("input", function (f) {
                    logoInfo["password"] = d["value"];
                  }),
                  setTimeout(function () {
                    if (!e["hasAttribute"]("disabled") && !e["classList"]["contains"]("disabled"))
                      (console["log"]("[XHS\x20Login]\x20点击登录按钮"), e["click"]());
                    else {
                      console["log"]("[XHS\x20Login]\x20登录按钮不可用，等待启用");
                      var f = new MutationObserver(function (g) {
                        g["forEach"](function (h) {
                          h["type"] === "attributes" &&
                            h["attributeName"] === "disabled" &&
                            !e["hasAttribute"]("disabled") &&
                            (console["log"]("[XHS\x20Login]\x20登录按钮已启用，点击登录"),
                            e["click"](),
                            f["disconnect"]());
                        });
                      });
                      f["observe"](e, { attributes: !![] });
                    }
                  }, 0x1f4))
                : console["log"]("[XHS\x20Login]\x20账户密码信息不完整，无法自动登录");
            }, 0x1f4))
          : console["log"]("[XHS\x20Login]\x20不是登录界面");
      }, 0x7d0));
  }));
const insertScriptStr = function () {
  let a = null;
  (document["addEventListener"](
    "keydown",
    (w) => {
      if (w["key"] === "Enter" && !w["shiftKey"]) {
        const x = document["querySelector"]("#jarvis-reply-textarea");
        x && (console["log"]("\x20editordom?.value", x?.["value"]), (a = x?.["value"]));
      }
    },
    !![],
  ),
    document["addEventListener"]("keyup", (w) => {
      w["key"] === "Enter" &&
        !w["shiftKey"] &&
        setTimeout(() => {
          a = null;
        }, 0x3e8);
    }),
    window["addEventListener"]("load", function () {
      setTimeout(() => {
        const w = document["querySelector"](".info-box");
        w && w["addEventListener"]("click", function () {});
      }, 0xbb8);
    }),
    (window["_sellerId"] = ""),
    (window["csBridge"] = {
      getCurrentWindow: function () {
        return {
          on: function () {},
          setMaximumSize: function (w, x) {
            console["log"]("setMaximumSize\x20called\x20with:", w, x);
          },
          setMinimumSize: function (w, x) {
            console["log"]("setMinimumSize\x20called\x20with:", w, x);
          },
          setMaximizable: function (w) {
            console["log"]("setMaximizable\x20called\x20with:", w);
          },
          maximize: function () {
            console["log"]("maximize\x20called");
          },
          unmaximize: function () {
            console["log"]("unmaximize\x20called");
          },
          minimize: function () {
            console["log"]("minimize\x20called");
          },
          setBounds: function (w) {
            console["log"]("setBounds\x20called\x20with:", w);
          },
          focus: function () {
            console["log"]("focus\x20called");
          },
          show: function () {
            console["log"]("show\x20called");
          },
          hide: function () {
            console["log"]("hide\x20called");
          },
          restore: function () {
            console["log"]("restore\x20called");
          },
          showInactive: function () {
            console["log"]("showInactive\x20called");
          },
          isVisible: function () {
            return (console["log"]("isVisible\x20called"), !![]);
          },
          isMinimized: function () {
            return (console["log"]("isMinimized\x20called"), ![]);
          },
          isMaximized: function () {
            return (console["log"]("isMaximized\x20called"), ![]);
          },
          isFocused: function () {
            return (console["log"]("isFocused\x20called"), !![]);
          },
          setBackgroundColor: function (w) {
            console["log"]("setBackgroundColor\x20called\x20with:", w);
          },
          setFullScreenable: function (w) {
            console["log"]("setFullScreenable\x20called\x20with:", w);
          },
          setFullScreen: function (w) {
            console["log"]("setFullScreen\x20called\x20with:", w);
          },
          invokeCurrentWindowFn: function (w, ...x) {
            console["log"]("invokeCurrentWindowFn\x20called\x20with:", w, x);
          },
          getCurrentWindowData: function (w) {
            return (console["log"]("getCurrentWindowData\x20called\x20with:", w), null);
          },
        };
      },
      ipcRenderer: {
        invoke: function (w, ...x) {
          return window["context_bridge"]["invoke"](w, ...x);
        },
        send: function (w, ...x) {
          if (w === "logout") {
            window["location"]["href"] = "https://walle.xiaohongshu.com/cstools/login";
            return;
          }
          return window["context_bridge"]["send"](w, ...x);
        },
        on: function (w, x) {
          return window["context_bridge"]["on"](w, x);
        },
        sendToHost: function (w, ...x) {
          return window["context_bridge"]["sendToHost"](w, ...x);
        },
      },
      clipboard: {
        writeText: function (w) {
          return window["context_bridge"]["clipboard"]["writeText"](w);
        },
        readText: function () {
          return window["context_bridge"]["clipboard"]["readText"]();
        },
        readImage: function () {
          return window["context_bridge"]["clipboard"]["readImage"]();
        },
        writeImage: function (w) {
          return window["context_bridge"]["clipboard"]["writeImage"](w);
        },
      },
      nativeImage: {
        createFromPath: function (w) {
          return window["context_bridge"]["nativeImage"]["createFromPath"](w);
        },
        createFromDataURL: function (w) {
          return window["context_bridge"]["nativeImage"]["createFromDataURL"](w);
        },
        createFromBuffer: function (w) {
          return window["context_bridge"]["nativeImage"]["createFromBuffer"](w);
        },
      },
      shell: {
        openExternal: function (w) {
          (console["log"]("shell.openExternal\x20called\x20with:", w),
            window["context_bridge"]["openExternal"](w));
        },
      },
      screenshot: {
        capturePage: function (w) {
          console["log"]("screenshot.capturePage\x20called\x20with:", w);
        },
      },
      getRemote: !![],
      appInfo: {
        appVersion: "1.2.6",
        platform: "${process.platform}",
        electronVersion: "${process.versions.electron}",
        nodeVersion: "${process.versions.node}",
      },
      supportNewUI: !![],
      supportTab: !![],
      supportFloatPlayVoice: ![],
      supportFloatWin: !![],
      supportArkLogin: !![],
      supportBackgroundHigh: ![],
      openChildWindow: function (w) {
        w["url"] && w["type"] && w["width"] !== undefined && w["height"] !== undefined
          ? window["context_bridge"]["openExternal"](w["url"])
          : console["error"]("url,type,width,height必须传入");
      },
      performance: {
        getProcessMemoryInfo: function () {
          return {};
        },
        getProcessCPUUsage: function () {
          return "0";
        },
        getWindowCount: function () {
          return 0x1;
        },
        getDeviceId: function () {
          return new Promise((w) => w(crypto["randomBytes"](0xc)["toString"]("hex")));
        },
      },
      sitEnvDb: {
        updateSitUrl: function (w) {
          console["log"]("updateSitUrl\x20called\x20with:", w);
        },
      },
      clientDb: {
        registDb: function (w) {
          const x = {};
          if (x[w]) return x[w];
          console["log"]("db:registDb\x20called\x20with:", w);
          const y = ["insert", "update", "remove", "find", "findOne", "count"],
            z = {};
          return (
            y["forEach"]((A) => {
              z[A] = function (...B) {
                return (
                  console["log"]("db:invokeFn\x20called\x20with:", w, A, B),
                  Promise["resolve"]()
                );
              };
            }),
            (x[w] = z),
            z
          );
        },
      },
    }));
  class b {
    constructor() {
      ((this["db"] = null),
        (this["DB_NAME"] = "userByOrderInfo"),
        (this["STORE_NAME"] = "value"),
        (this["VERSION"] = 0x1));
    }
    async ["init"]() {
      if (this["db"]) return this["db"];
      return (
        (this["db"] = await new Promise((w, x) => {
          const y = indexedDB["open"](this["DB_NAME"], this["VERSION"]);
          ((y["onupgradeneeded"] = (z) => {
            const A = z["target"]["result"];
            !A["objectStoreNames"]["contains"](this["STORE_NAME"]) &&
              A["createObjectStore"](this["STORE_NAME"], { keyPath: "id" });
          }),
            (y["onsuccess"] = () => w(y["result"])),
            (y["onerror"] = () => x(y["error"])));
        })),
        this["db"]
      );
    }
    async ["save"](w) {
      const x = await this["init"]();
      return new Promise((y, z) => {
        const A = x["transaction"](this["STORE_NAME"], "readwrite"),
          B = A["objectStore"](this["STORE_NAME"]),
          C = B["put"](w);
        ((C["onsuccess"] = () => y(!![])), (C["onerror"] = () => z(C["error"])));
      });
    }
    async ["get"](w) {
      const x = await this["init"]();
      return new Promise((y, z) => {
        const A = x["transaction"](this["STORE_NAME"], "readonly"),
          B = A["objectStore"](this["STORE_NAME"]),
          C = B["get"](w);
        ((C["onsuccess"] = () => y(C["result"] || null)), (C["onerror"] = () => z(C["error"])));
      });
    }
    async ["getAll"]() {
      const w = await this["init"]();
      return new Promise((x, y) => {
        const z = w["transaction"](this["STORE_NAME"], "readonly"),
          A = z["objectStore"](this["STORE_NAME"]),
          B = A["getAll"]();
        ((B["onsuccess"] = () => x(B["result"] || [])), (B["onerror"] = () => y(B["error"])));
      });
    }
    async ["delete"](w) {
      const x = await this["init"]();
      return new Promise((y, z) => {
        const A = x["transaction"](this["STORE_NAME"], "readwrite"),
          B = A["objectStore"](this["STORE_NAME"]),
          C = B["delete"](w);
        ((C["onsuccess"] = () => y(!![])), (C["onerror"] = () => z(C["error"])));
      });
    }
  }
  Object["preventExtensions"] = function () {
    return !![];
  };
  const c = XMLHttpRequest["prototype"]["open"],
    d = XMLHttpRequest["prototype"]["send"],
    e = XMLHttpRequest["prototype"]["setRequestHeader"];
  let f = ![],
    g = null,
    h = null,
    i = ![];
  window["_xhsLogoInfo"] = {
    username: "",
    password: "",
  };
  const j = new Map();
  function k(w, x) {
    if (!w || !x) return;
    const y = x["userId"] || x["refUserId"] || "",
      z = x["username"] || x["nickName"] || "",
      A = x["avatar"] || x["avatarUrl"] || "";
    if (!y && !z && !A) return;
    j["set"](w, {
      userId: y,
      username: z,
      avatar: A,
    });
  }
  function l(w) {
    if (!w) return null;
    return j["get"](w) || null;
  }
  function m() {
    const w = document["querySelector"](".login-user-input[placeholder=\x22邮箱\x22]"),
      x = document["querySelector"](
        ".login-user-input[placeholder=\x22密码\x22],\x20.login-user-input[type=\x22password\x22]",
      ),
      y = document["querySelector"](".login-submit-btn");
    w &&
      x &&
      y &&
      (console["log"]("[XHS\x20Login]\x20检测到登录界面，设置监听"),
      w["addEventListener"]("input", function () {
        window["_xhsLogoInfo"]["username"] = w["value"];
      }),
      x["addEventListener"]("input", function () {
        window["_xhsLogoInfo"]["password"] = x["value"];
      }),
      y["addEventListener"]("click", function () {
        (console["log"]("[XHS\x20Login]\x20登录按钮被点击，保存账号密码"),
          (window["_xhsLogoInfo"]["username"] = w["value"]),
          (window["_xhsLogoInfo"]["password"] = x["value"]));
      }));
  }
  (setTimeout(m, 0x7d0),
    (XMLHttpRequest["prototype"]["open"] = function (w, x) {
      ((this["_method"] = w), (this["_url"] = x), c["apply"](this, arguments));
    }),
    (XMLHttpRequest["prototype"]["setRequestHeader"] = function (w, x) {
      if (w["toLowerCase"]() === "authorization") {
        if (x && x["startsWith"]("a1:"))
          ((g = x),
            console["log"](
              "[XHS]\x20捕获到\x20a1\x20authorization:",
              x["substring"](0x0, 0x32) + "...",
            ));
        else x && x["startsWith"]("AT-") && (h = x);
      }
      return e["apply"](this, arguments);
    }));
  window["axios"] &&
    window["axios"]["interceptors"] &&
    window["axios"]["interceptors"]["request"]["use"](function (w) {
      return (
        w["headers"] &&
          w["headers"]["Authorization"] &&
          w["headers"]["Authorization"]["startsWith"]("a1:") &&
          ((g = w["headers"]["Authorization"]),
          console["log"](
            "[XHS]\x20从\x20axios\x20捕获到\x20a1\x20authorization:",
            g["substring"](0x0, 0x32) + "...",
          )),
        w["headers"] &&
          w["headers"]["Authorization"] &&
          w["headers"]["Authorization"]["startsWith"]("AT-") &&
          (console["log"](
            "[XHS]\x20从\x20axios\x20捕获到\x20AT-\x20开头的\x20authorization:",
            w["headers"]["Authorization"],
          ),
          (h = w["headers"]["Authorization"])),
        w
      );
    });
  XMLHttpRequest["prototype"]["send"] = function (w) {
    (this["addEventListener"]("load", function () {
      if (this["_url"]["includes"]("https://walle.xiaohongshu.com/api/edith/cs/get_login_user")) {
        const x = JSON["parse"](this["response"]);
        x["success"] &&
          (console["log"]("result", x),
          window["context_bridge"]["sendToHost"]("set-xhs-customer", {
            access_token: x["access_token"],
          }));
      }
      if (
        !f &&
        this["_url"]["includes"]("https://edith.xiaohongshu.com/api/impaas/message/user/list/batch")
      ) {
        f = !![];
        try {
          const y = JSON["parse"](this["response"]);
          console["log"]("[XHS]\x20历史消息接口返回（首次）:", y);
          if (y["code"] === 0x0 && y["data"] && y["data"]["infos"]) {
            const z = y["data"]["infos"],
              A = [];
            (Object["keys"](z)["forEach"]((B) => {
              const C = z[B];
              if (C["userMessageInfos"] && Array["isArray"](C["userMessageInfos"])) {
                const D = C["userMessageInfos"];
                let E = null;
                const F = D["filter"]((G) => {
                  const H = G["senderAppUid"] || "";
                  let I = 0x0;
                  try {
                    const K = G["contentInfo"]?.["content"] || "{}",
                      L = JSON["parse"](K);
                    I = L["type"] || 0x0;
                  } catch (M) {
                    console["log"]("[XHS\x20Filter]\x20解析\x20contentType\x20失败:", M);
                  }
                  const J =
                    H["includes"]("system") || I === 0x9 || I === 0x13 || I === 0x66 || I === 0x7d;
                  if (J) return ![];
                  return !![];
                });
                if (F["length"] > 0x0) {
                  const G = F[0x0],
                    H = G["senderAppUid"] && G["senderAppUid"]["includes"]("#2#2#"),
                    I =
                      G["senderAppUid"] &&
                      (G["senderAppUid"]["includes"]("#1#1#4#") ||
                        G["senderAppUid"]["startsWith"]("1#1#4#"));
                  H && ((E = G), console["log"]("unrepliedMessage=====", E));
                }
                if (E)
                  try {
                    const J = JSON["parse"](E["contentInfo"]["content"]),
                      K = JSON["parse"](J["data"]),
                      L = JSON["parse"](E["extension"]["sender"]),
                      M = L["presentInfo"];
                    let N = "",
                      O = K["content_type"];
                    O === 0x1
                      ? (N = K["content"] || "")
                      : (N = J["summary"] || "用户发送了多媒体消息");
                    const P = 0xb4;
                    A["push"]({
                      messageId: E["appCid"],
                      userId: L["presentInfo"]["refUserId"] || "",
                      username: M["nickName"],
                      avatar: M["avatarUrl"],
                      content: N,
                      timeout: Math["floor"](E["createAt"] / 0x3e8) + P,
                      isTimeout: ![],
                      timeNote: "",
                      api: !![],
                      type: "code",
                      senderAppUid: E["senderAppUid"],
                    });
                  } catch (Q) {
                    console["error"]("[XHS]\x20解析未回复消息失败:", Q);
                  }
              }
            }),
              A["length"] > 0x0 &&
                window["context_bridge"]["send"]("get-customer-message-list", A));
          }
        } catch (B) {
          console["error"]("[XHS]\x20处理历史消息接口失败:", B);
        }
      }
      if (this["_url"]["includes"]("https://walle.xiaohongshu.com/api/edith/mcs/get_csa_info")) {
        const C = JSON["parse"](this["response"]);
        console["log"]("[XHS]\x20get_csa_info\x20返回:", C);
        if (C["success"] && C["data"]) {
          const D = C["data"];
          ((window["_sellerId"] = D["cs_provider_id"]),
            console["log"]("[XHS]\x20保存客服\x20sellerId:", window["_sellerId"]));
          let E = "离线";
          if (D["staff_status"] === "online") E = "在线";
          else D["staff_status"] === "busy" && (E = "忙碌");
          const F = {
            logo: D["seller_image"],
            id: D["id"],
            name: D["seller_name"],
            username: D["csa_real_name"],
          };
          ((currentShopName = F["name"] || ""),
            window["context_bridge"]["send"]("get-shop-info", F),
            window["context_bridge"]["send"]("shop-status-change", { status: E }),
            !i &&
              window["_xhsLogoInfo"]["username"] &&
              window["_xhsLogoInfo"]["password"] &&
              (console["log"]("[XHS]\x20登录成功，发送账号密码"),
              window["context_bridge"]["send"]("loginInfo", {
                username: window["_xhsLogoInfo"]["username"],
                password: window["_xhsLogoInfo"]["password"],
              }),
              (i = !![])));
        }
      }
      if (
        this["_url"]["includes"](
          "https://walle.xiaohongshu.com/api/edith/walle/mcs/csa_realtime_data",
        )
      ) {
        const G = JSON["parse"](this["response"]);
        console["log"]("[XHS]\x20csa_realtime_data\x20返回:", G);
        if (G["success"] && G["data"]) {
          const H = G["data"],
            I = {
              inquiryCount: H?.["consultCustomerCount"] || 0x0,
              responseRateWithinThreeMin: H?.["maxReplyIn3minRate"]
                ? (H["maxReplyIn3minRate"] * 0x64)["toFixed"](0x2) + "%"
                : "--",
              averageRate: H?.["daytimeAverageReplyInterval"] || 0x0,
            },
            J = Math["random"]() * 0x28 * 0x3e8;
          setTimeout(() => {
            window["context_bridge"]["send"]("get-quality-testing", I);
          }, J);
        }
      }
    }),
      d["apply"](this, arguments));
  };
  const n = window["WebSocket"],
    o = {
      CONNECTING: 0x0,
      OPEN: 0x1,
      CLOSING: 0x2,
      CLOSED: 0x3,
    };
  let p = {
    id: null,
    name: null,
  };
  window["WebSocket"] = function (w, x) {
    const y = new n(w, x);
    return (
      (w["includes"]("xiaohongshu.com") || w["includes"]("xhscdn.com")) &&
        console["log"]("[XHS]\x20已保存\x20WebSocket\x20连接引用"),
      y["addEventListener"]("open", function (z) {
        console["log"]("[XHS\x20WebSocket]\x20连接已打开", w);
      }),
      y["addEventListener"]("close", function (z) {
        console["log"]("[XHS\x20WebSocket]\x20连接已关闭");
      }),
      y["addEventListener"]("error", function (z) {
        console["error"]("[XHS\x20WebSocket]\x20连接错误");
      }),
      y["addEventListener"]("message", function (z) {
        try {
          const A = JSON["parse"](z["data"]),
            B = A["header"]?.["type"],
            C = A["header"]?.["action"];
          console["log"]("[XHS\x20WebSocket]\x20收到消息\x20type=", A, +B + "\x20action=" + C);
          if (
            A["header"] &&
            A["header"]["type"] === 0x83 &&
            A["header"]["action"] === "/message/send" &&
            A["body"] &&
            A["body"]["code"] === 0x0
          ) {
            console["log"]("[XHS\x20WebSocket]\x20客服回复成功:", A["body"]["data"]);
            const D = A["body"]["data"];
            (window["postMessage"](
              {
                type: "XHS_REPLY_SEND_SUCCESS",
                data: {
                  appCid: D["appCid"],
                  msgId: D["msgId"],
                },
              },
              "*",
            ),
              console["log"](
                "replyData.content",
                JSON["parse"](D?.["contentInfo"]?.["content"])?.["data"],
              ),
              window["context_bridge"]["send"]("reply-customer-message", {
                messageId: D["appCid"],
                msgId: D["msgId"],
                content: a,
              }));
          }
          A["header"] &&
            A["header"]["type"] === 0x4 &&
            A["header"]["domain"] === "cs" &&
            A["body"] &&
            A["body"]["payload"] &&
            A["body"]["payload"]["forEach"](async (E) => {
              (console["log"]("[XHS\x20WebSocket]\x20处理\x20payload:", E["type"]),
                console["log"]("JSON.parse(payloadItem.data)", JSON["parse"](E["data"])));
              if (E["type"] === "30001") {
                const F = JSON["parse"](E["data"]);
                if (F["userMessage"]) {
                  const G = F["userMessage"],
                    H = F["isSelfMsg"] || G["isSelfMsg"],
                    I = JSON["parse"](G["contentInfo"]["content"]),
                    J = JSON["parse"](I["data"]),
                    K = JSON["parse"](G["extension"]["sender"]),
                    L = K["presentInfo"],
                    M = G["senderAppUid"] || "",
                    N =
                      L["type"] === "SYSTEM" &&
                      M["includes"]("system") &&
                      (I["type"] === 0x26 || J["content_type"] === 0x26);
                  if (N && !H) {
                    const O = l(G["appCid"]),
                      P = {
                        messageId: G["appCid"],
                        userId: O?.["userId"] || "",
                        username: O?.["username"] || "",
                        avatar: O?.["avatar"] || "",
                        content: I["summary"] || "系统转交",
                        timeout: Math["floor"](G["createAt"] / 0x3e8) + 0xb4,
                        isTimeout: ![],
                        timeNote: "",
                        api: !![],
                        isSelfMsg: ![],
                        type: "code",
                        eventType: "transfer",
                        senderAppUid: M,
                        raw: F,
                      };
                    (console["log"]("[XHS\x20WebSocket]\x20捕获系统转交消息:", P),
                      window["context_bridge"]["send"]("get-customer-message-list", [P]));
                    return;
                  }
                  if (L["type"] === "CUSTOMER") {
                    k(G["appCid"], {
                      userId: K["presentInfo"]["refUserId"] || "",
                      username: L["nickName"],
                      avatar: L["avatarUrl"],
                    });
                    let Q = "",
                      R = "",
                      S = J["content_type"],
                      T = "",
                      U = "";
                    if (S === 0x1) Q = J["content"] || "";
                    else {
                      if (S === 0xc) {
                        const X = JSON["parse"](J["content"]);
                        (console["log"]("[XHS\x20WebSocket]\x20goodInfo:", X),
                          (Q = "用户发送商品"),
                          (R = X["id"] || ""));
                      } else {
                        if (S === 0x3) {
                          const Y = JSON["parse"](J["content"]);
                          (console["log"]("[XHS\x20WebSocket]\x20orderInfo:", Y),
                            (Q = "用户发送订单"),
                            (T = Y["packageid"] || ""),
                            (U = Y["erp_status_str"] || ""));
                        }
                      }
                    }
                    const V = 0xb4;
                    let W = {
                      messageId: G["appCid"],
                      userId: K["presentInfo"]["refUserId"] || "",
                      username: L["nickName"],
                      avatar: L["avatarUrl"],
                      content: Q,
                      goodId: R,
                      timeout: Math["floor"](G["createAt"] / 0x3e8) + V,
                      isTimeout: ![],
                      timeNote: "",
                      api: !![],
                      isSelfMsg: H,
                      orderId: T,
                      orderStatus: U,
                      type: "code",
                      senderAppUid: G["senderAppUid"] || "",
                    };
                    !H &&
                      (console["log"]("[XHS\x20WebSocket]\x20转发消息给主进程:", W),
                      console["log"]("发送=", W),
                      window["context_bridge"]["send"]("get-customer-message-list", [W]));
                  } else
                    (L["type"] === "BOT" || L["type"] === "SELLER") &&
                      (console["log"]("[XHS\x20WebSocket]\x20回复消息:", G),
                      window["context_bridge"]["send"]("reply-customer-message", {
                        messageId: G["appCid"],
                      }));
                }
              } else {
                if (E["type"] === "31010") {
                  const Z = JSON["parse"](E["data"]);
                } else {
                  if (E["type"] === "32012") {
                    const a0 = JSON["parse"](E["data"]);
                    if (a0["userConversation"]) {
                      console["log"]("userMessageData============", a0);
                      const a1 = a0["userConversation"],
                        a2 = a0["isSelfMsg"] || a1["isSelfMsg"];
                      console["log"]("userMessage============", a1);
                      if (a1["visible"]) {
                        const a3 = JSON["parse"](a1["userExtension"]["chatUser"]);
                        console["log"]("userMessageInfo===========", a3);
                        const a4 = a3["pairInfo"];
                        (console["log"]("sender============", a4),
                          k(a1["appCid"], {
                            userId: a4?.["presentInfo"]?.["refUserId"] || "",
                            username: a4?.["presentInfo"]?.["nickName"] || "",
                            avatar: a4?.["presentInfo"]?.["avatarUrl"] || "",
                          }));
                        const a5 = a1?.["userMessageInfo"] || {},
                          a6 = a5["extension"]?.["sender"]
                            ? JSON["parse"](a5["extension"]["sender"])
                            : null,
                          a7 = a6?.["presentInfo"]?.["type"] || "",
                          a8 = a5["createAt"] || 0x0,
                          a9 =
                            Array["isArray"](a1["ctagInfos"]) &&
                            a1["ctagInfos"]["some"]((ae) => {
                              const af = ae && Number(ae["modifyTime"]) === Number(a0["time"]),
                                ag = !a8 || a8 + 0xbb8 < Number(a0["time"]);
                              return af && ag;
                            });
                        if (a9) {
                          console["log"](
                            "[XHS\x20WebSocket]\x20跳过会话标签变更事件:",
                            a1["ctagInfos"],
                          );
                          return;
                        }
                        if (a7 && a7 !== "CUSTOMER") {
                          console["log"]("[XHS\x20WebSocket]\x20跳过非客户会话更新:", a7);
                          return;
                        }
                        const aa = a5["contentInfo"]?.["content"]
                          ? JSON["parse"](a5["contentInfo"]?.["content"])
                          : null;
                        console["log"]("contentInfo", aa);
                        const ab = aa ? aa["summary"] : "用户接入会话",
                          ac = 0xb4,
                          ad = {
                            messageId: a1["appCid"],
                            userId: a4 ? a4["presentInfo"]["refUserId"] : "",
                            username: a4 ? a4["presentInfo"]["nickName"] : "",
                            avatar: a4 ? a4["presentInfo"]["avatarUrl"] : "",
                            content: ab,
                            timeout: a5["createAt"]
                              ? Math["floor"](a0?.["time"] / 0x3e8) + ac
                              : Math["floor"](Date["now"]() / 0x3e8) + ac,
                            isTimeout: ![],
                            timeNote: "",
                            api: !![],
                            isSelfMsg: a2,
                            type: "code",
                            senderAppUid: a5["senderAppUid"] || "",
                          };
                        (console["log"]("发送===================", ad),
                          window["context_bridge"]["send"]("get-customer-message-list", [ad]));
                      }
                    }
                  }
                }
              }
            });
        } catch (E) {
          console["error"]("[XHS\x20WebSocket]\x20解析消息失败:", E);
        }
      }),
      y
    );
  };
  class q {
    constructor(w) {
      ((this["id"] = w["messageId"]),
        (this["orderId"] = w["orderId"]),
        (this["ordersku"] = w["ordersku"] || ""),
        (this["orderStatus"] = w["orderStatus"]),
        (this["orderInfo"] = w["orderInfo"] || ""),
        (this["goodId"] = w["goodId"]),
        (this["goodName"] = w["goodName"] || ""),
        (this["goodInfo"] = w["goodInfo"] || ""),
        (this["sku"] = w["sku"] || ""),
        (this["InfoTimerout"] = Date["now"]()));
    }
  }
  window["context_bridge"]["on"]("get-shop-user", async (w, x) => {
    console["log"]("[XHS]\x20get-shop-user\x20获取历史记录:", x);
    const y = r();
    console["log"]("[XHS]\x20历史消息数据:", y["length"], "条");
    if (y && y["length"] > 0x0) {
      let z = y["filter"]((B) => B["content"] !== ""),
        A = "暂无订单";
      if (x["userId"] && window["_sellerId"])
        try {
          console["log"]("[XHS]\x20获取到订单状态:", A);
        } catch (B) {
          console["error"]("[XHS]\x20获取订单状态失败:", B);
        }
      else
        console["log"](
          "[XHS]\x20缺少用户\x20ID\x20或客服\x20ID，跳过订单查询",
          x["userId"],
          window["_sellerId"],
        );
      ((z = z["map"]((C) => ({
        ...C,
        messageId: x["messageId"],
        orderStatus: C["orderStatus"] || A,
      }))),
        (x["history"] = z),
        window["context_bridge"]["send"]("get-historical-records", JSON["stringify"](x)),
        console["log"]("[XHS]\x20发送历史消息记录:", z["length"], "条"));
    } else console["log"]("[XHS]\x20没有有效的历史消息");
  });
  const r = () => {
    const w = document["querySelectorAll"]("[id^=\x22jarvis-msg-\x22]");
    if (!w || w["length"] === 0x0) return (console["log"]("[XHS]\x20没有找到消息元素"), []);
    const x = [];
    return (
      w["forEach"]((y) => {
        try {
          const z = y["getAttribute"]("data-sender-type"),
            A = y["getAttribute"]("id")["replace"]("jarvis-msg-", ""),
            B = y["getAttribute"]("data-timestamp"),
            C = y["getAttribute"]("data-chat-id"),
            D = y["getAttribute"]("data-self") === "self",
            E = y["getAttribute"]("data-msg-type");
          if (z === "bot" || z === "system") {
            console["log"]("[XHS]\x20过滤掉消息:", z, A);
            return;
          }
          let F = "";
          if (E === "goodCard") {
            const N = y["querySelector"](".goods-message-name-text"),
              O = y["querySelector"](".goods-message-price-int-value"),
              P = y["querySelector"](".goods-message-price-float-value");
            N &&
              ((F = "[商品]\x20" + N["textContent"]["trim"]()),
              (O || P) && (F += "\x20¥" + (O?.["textContent"] || "") + (P?.["textContent"] || "")));
          } else {
            const Q = y["querySelector"]("span\x20span");
            Q && (F = Q["textContent"]["trim"]());
          }
          const G = y["querySelector"](".single-msg-time"),
            H = G ? G["textContent"]["trim"]() : "",
            I = y["parentElement"]?.["querySelector"](".css-1b7ltxq\x20div"),
            J = I ? I["textContent"]["trim"]() : "",
            K = y["parentElement"]?.["querySelector"](".im-sender\x20img"),
            L = K ? K["getAttribute"]("src") || "" : "",
            M = z === "individual" ? "user" : "assistant";
          x["push"]({
            role: M,
            content: F,
            senderType: z,
            senderName: J,
            avatar: L,
            timestamp: B ? parseInt(B) : Date["now"](),
            timeStr: H,
            msgId: A,
            chatId: C,
            isSelf: D,
          });
        } catch (R) {
          console["warn"]("[XHS]\x20解析消息出错:", R);
        }
      }),
      x
    );
  };
  (window["context_bridge"]["on"]("ai-transfer-human-sub", async (w, x) => {
    await s(x);
  }),
    window["context_bridge"]["on"]("star-customer-message", async (w, x) => {
      await v(x);
    }));
  const s = async (w) => {
      console["log"]("AI转人工转接子账号", w);
      if (p["name"] !== w["subAccount"]) {
        const y = await t(w["subAccount"]);
        y && ((p["name"] = w["subAccount"]), (p["csa_user_id"] = y));
      }
      const x = await u(w["messageId"]);
      if (!x || !p["csa_user_id"]) return;
      fetch("https://walle.xiaohongshu.com/api/edith/mcs/transfer_conversation", {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-subsystem": "eva",
          "x-t": Date["now"]()["toString"](),
          authorization: h,
        },
        body: JSON["stringify"]({
          chat_id: x,
          csa_user_id: p["csa_user_id"],
        }),
      });
    },
    t = async (w) => {
      const x = await fetch(
          "https://eva.xiaohongshu.com/api/edith/seller/online/csas/desensitize",
          {
            method: "POST",
            mode: "cors",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "x-subsystem": "eva",
              "x-t": Date["now"]()["toString"](),
              authorization: h,
            },
            body: JSON["stringify"]({ seller_id: window["_sellerId"] || "" }),
          },
        )["then"]((A) => A["json"]()),
        y = Array["isArray"](x?.["data"]) ? x["data"] : [],
        z = y["find"]((A) => {
          return A?.["user_name"] === w || A?.["nick_name"] === w;
        });
      return z?.["user_id"] || null;
    },
    u = async (w) => {
      const x = await fetch("https://edith.xiaohongshu.com/api/impaas/conv/user/list", {
          method: "POST",
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-subsystem": "eva",
            "x-t": Date["now"]()["toString"](),
            authorization: g,
          },
          body: JSON["stringify"]({
            cursor: -0x1,
            count: 0x19,
            direction: ![],
            hasHide: !![],
            withCtag: !![],
            topPolicy: 0x0,
            offset: 0x0,
            byOffset: !![],
          }),
        })["then"]((B) => B["json"]()),
        y = Array["isArray"](x?.["data"]?.["userConversationInfos"])
          ? x["data"]["userConversationInfos"]
          : [],
        z = y["find"]((B) => B?.["appCid"] === w),
        A = z?.["bizExtension"]?.["downAdditionalInfo"];
      if (!A) return null;
      try {
        const B = JSON["parse"](A);
        return B?.["id"] || null;
      } catch (C) {
        return (console["log"]("解析会话\x20downAdditionalInfo\x20失败", C), null);
      }
    },
    v = (w) => {
      fetch("https://edith.xiaohongshu.com/api/impaas/conv/tag/set", {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-subsystem": "eva",
          "x-t": Date["now"]()["toString"](),
          authorization: g,
        },
        body: JSON["stringify"]({
          appCid: w["messageId"],
          ctag: "COLLECT",
          enable: !![],
          expireTime: -0x1,
          extension: { level: "0" },
        }),
      });
    };
};
webFrame["executeJavaScript"]("(" + insertScriptStr + ")()");
function safeIpcOn(a, b) {
  (ipcRenderer["removeAllListeners"](a), ipcRenderer["on"](a, b));
}
function writePreloadErrorLog(a) {
  ipcRenderer["send"]("write-preload-error-log", a);
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
  writePreloadErrorLog({
    shopName: currentShopName || "未知店铺",
    platform: "xhs",
    errorMessage: a + ":\x20" + getReadableErrorMessage(b),
    time: new Date()["toLocaleString"]("zh-CN", { hour12: ![] }),
  });
}
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
const throttledClickCustomerMessage = throttle((a) => {
  const b = document["querySelector"](".chat-item[data-key=\x22" + a["messageId"] + "\x22]");
  if (!b) {
    (console["log"]("[XHS]\x20未找到对应的聊天项:", a["messageId"]),
      window["context_bridge"]["send"]("reply-customer-message", { messageId: a["messageId"] }));
    return;
  }
  b["click"]();
}, 0x1f4);
(safeIpcOn("click-customer-message", (a, b) => {
  throttledClickCustomerMessage(b);
}),
  safeIpcOn("star", () => {
    const a = document["getElementsByClassName"]("tool-chat-icon")[0x1];
    a && a["click"]();
  }));
const delay = (a) => new Promise((b) => setTimeout(b, a)),
  xhsSendAckQueue = new Map(),
  xhsSendAckWaiters = new Map();
function pushXhsSendAck(a, b) {
  if (!a) return;
  const c = xhsSendAckWaiters["get"](a);
  if (c && c["length"] > 0x0) {
    const d = c["shift"]();
    if (d) d(b);
    c["length"] === 0x0 && xhsSendAckWaiters["delete"](a);
    return;
  }
  (!xhsSendAckQueue["has"](a) && xhsSendAckQueue["set"](a, []),
    xhsSendAckQueue["get"](a)["push"](b));
}
function waitForXhsSendAck(a, b = 0x1388) {
  if (!a) return Promise["resolve"](null);
  const c = xhsSendAckQueue["get"](a);
  if (c && c["length"] > 0x0) {
    const d = c["shift"]();
    return (c["length"] === 0x0 && xhsSendAckQueue["delete"](a), Promise["resolve"](d));
  }
  return new Promise((e) => {
    const f = setTimeout(() => {
        const h = xhsSendAckWaiters["get"](a) || [],
          i = h["indexOf"](g);
        if (i > -0x1) h["splice"](i, 0x1);
        (h["length"] === 0x0 ? xhsSendAckWaiters["delete"](a) : xhsSendAckWaiters["set"](a, h),
          e(null));
      }, b),
      g = (h) => {
        (clearTimeout(f), e(h));
      };
    (!xhsSendAckWaiters["has"](a) && xhsSendAckWaiters["set"](a, []),
      xhsSendAckWaiters["get"](a)["push"](g));
  });
}
async function waitForXhsSendAckCount(a, b, c = 0x1388) {
  if (!a || !b || b <= 0x0) return [];
  const d = [],
    e = Date["now"]() + c;
  while (d["length"] < b) {
    const f = e - Date["now"]();
    if (f <= 0x0) break;
    const g = await waitForXhsSendAck(a, f);
    if (!g) break;
    d["push"](g);
  }
  return d;
}
(safeIpcOn("reply-message", async (a, b) => {
  console["log"]("[XHS]\x20收到\x20reply-message:", b);
  let c = [];
  try {
    if (typeof b === "object") c = Array["isArray"](b) ? b : [b];
    else {
      const d = JSON["parse"](b);
      c = Array["isArray"](d) ? d : [d];
    }
  } catch (e) {
    (console["error"]("[XHS]\x20解析\x20reply-message\x20失败:", e), (c = [b]));
  }
  console["log"]("[XHS]\x20待发送文本消息列表:", c);
  for (const f of c) {
    if (!f) continue;
    if (f["videoUrl"] || f["file"]) {
      console["log"]("[XHS]\x20reply-message\x20暂跳过非文本消息:", f);
      continue;
    }
    const g = f["chatId"] || f["messageId"] || f["appCid"],
      h = f["replyContent"] || f["content"] || "",
      i = (f["imageBase64"] ? 0x1 : 0x0) + (h ? 0x1 : 0x0);
    if (!g) {
      console["error"]("[XHS]\x20无法获取会话\x20ID:", f);
      continue;
    }
    if (f["imageBase64"] || f["imageUrl"]) {
      const k = await sendImage({
        chatId: g,
        imageBase64: f["imageBase64"],
        imageMimeType: f["imageMimeType"],
        imageUrl: f["imageUrl"],
      });
      if (!k) {
        console["error"]("[XHS]\x20图片发送失败，跳过后续回调:", f);
        continue;
      }
      await delay(0x12c);
    }
    f?.["needOrder"] &&
      f?.["needOrder"] >= 0x3 &&
      window["postMessage"](
        {
          type: "XHS_NEED_ORDER_PREFETCH",
          data: {
            ...f,
            messageId: g,
          },
        },
        "*",
      );
    console["log"]("[XHS]\x20SDK\x20发送文本消息到会话:", g, "内容:", h);
    h &&
      window["postMessage"](
        {
          type: "send-message",
          data: {
            chatId: g,
            contentInfo: {
              contentType: 0x1,
              content: h,
              receiverAppUids: [f["senderAppUid"]],
            },
          },
        },
        "*",
      );
    const j = await waitForXhsSendAckCount(g, i, 0x1388);
    (console["log"]("[XHS]\x20发送成功回执列表:", j),
      j["length"] === i
        ? ipcRenderer["send"]("get-customer-callback-result", {
            ...f,
            isAiInviteReply: f["isAiInviteReply"],
            isReminderReply: f["isReminderReply"],
            isBottomLineAutoReply: f["isBottomLineAutoReply"] || ![],
            isAiAutoReply: !f["isBottomLineAutoReply"],
          })
        : console["error"](
            "[XHS]\x20未收到完整发送成功回执，跳过\x20get-customer-callback-result:",
            g,
            "expectedAckCount=",
            i,
            "actualAckCount=",
            j["length"],
          ),
      await delay(0x12c));
  }
}),
  safeIpcOn("get-shop-pwd", (a, b) => {
    ((logoInfo["password"] = b["password"]),
      (logoInfo["username"] = b["userName"]),
      (window["_xhsLogoInfo"] = {
        username: b["userName"],
        password: b["password"],
      }));
  }));
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
        h["includes"]("pinduoduo.com") && a["record"](![]);
        throw g;
      }
    }),
      console["log"]("[API健康监控]\x20已初始化"));
  },
};
apiHealthMonitor["init"]();
let wsConnectState = -0x1;
(safeIpcOn("request-heartbeat", (a, b) => {
  console["log"]("获取到心跳了");
  const c = Date["now"]();
  let d = "",
    e = !![];
  const f = document["querySelector"]("[data-menu-id=\x27side-dashboard\x27]");
  !f && (e = ![]);
  const g = apiHealthMonitor["isHealthy"]();
  ipcRenderer["send"]("heartbeat-response", {
    status: d,
    apiHealthy: g,
    webSocketState: wsConnectState,
    domExists: e,
  });
}),
  safeIpcOn("change-shop-status", (a, b) => {
    const c = document["querySelector"]("[class=\x22status-container\x22]");
    c &&
      (c["click"](),
      setTimeout(() => {
        const d = document["getElementsByClassName"]("el-dropdown-menu__item");
        if (b === "online") d[0x0]["click"]();
        else {
          if (b === "busy") d[0x1]["click"]();
          else b === "offline" && d[0x2]["click"]();
        }
      }, 0x3e8));
  }),
  window["addEventListener"]("message", (a) => {
    if (a["source"] !== window) return;
    if (a["data"] && a["data"]["type"] === "XHS_SELLER_ID") {
      const { sellerId: b } = a["data"]["data"];
      (console["log"]("[XHS]\x20接收到\x20seller_id:", b), (xhsSellerId = b));
    }
    if (a["data"] && a["data"]["type"] === "XHS_REPLY_SEND_SUCCESS") {
      const c = a["data"]?.["data"]?.["appCid"];
      c && pushXhsSendAck(c, a["data"]["data"]);
    }
    (a["data"] &&
      a["data"]["type"] === "XHS_HOOK_SUCCESS" &&
      ipcRenderer["send"]("xhs-hook-success", { success: !![] }),
      a["data"] &&
        a["data"]["type"] === "WS_STATE_CHANGE" &&
        (wsConnectState = a["data"]["state"]));
  }),
  safeIpcOn("get-goods-all-detail", async (a, b) => {
    getGoodsList(b);
  }));
async function getGoodsList(a) {
  try {
    console["log"]("[XHS]\x20开始获取全部商品详情,\x20args:", a);
    const b = window["_sellerId"] || "68b8e6e99265c7001527e9f1";
    console["log"]("[XHS]\x20sellerId:", b);
    const c = await fetch(
        "https://eva.xiaohongshu.com/api/edith/business/tools/search_seller_item_list",
        {
          method: "POST",
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-subsystem": "eva",
            "x-t": Date["now"]()["toString"](),
          },
          body: JSON["stringify"]({
            seller_id: b,
            page_no: 0x1,
            page_size: 0xa,
            order: "desc",
          }),
        },
      ),
      d = await c["json"]();
    console["log"]("[XHS]\x20商品列表返回:", d);
    if (!d["success"] || !d["data"] || !d["data"]["data"]) {
      console["error"]("[XHS]\x20获取商品列表失败:", d);
      return;
    }
    const e = d["data"]["data"],
      f = d["data"]["total"] || 0x0;
    (ipcRenderer["send"]("get-goods-all-detail-total", {
      userId: a["userId"],
      total: f,
    }),
      console["log"]("[XHS]\x20总共有\x20" + f + "\x20个商品"));
    const g = e || [],
      h = 0xa,
      j = Math["ceil"](f / h);
    for (let l = 0x2; l <= j; l++) {
      try {
        const m = await fetch(
            "https://eva.xiaohongshu.com/api/edith/business/tools/search_seller_item_list",
            {
              method: "POST",
              mode: "cors",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                "x-subsystem": "eva",
                "x-t": Date["now"]()["toString"](),
              },
              body: JSON["stringify"]({
                seller_id: b,
                page_no: l,
                page_size: h,
                order: "desc",
              }),
            },
          ),
          n = await m["json"]();
        (n["success"] && n["data"] && n["data"]["data"] && g["push"](...n["data"]["data"]),
          await new Promise((o) => setTimeout(o, 0x64)));
      } catch (o) {
        console["error"]("[XHS]\x20获取第\x20" + l + "\x20页商品列表失败:", o);
      }
    }
    console["log"]("[XHS]\x20共获取到\x20" + g["length"] + "\x20个商品，开始处理详情");
    const k = [];
    for (let p = 0x0; p < g["length"]; p++) {
      const q = g[p],
        r = q["item_id"];
      if (!r) {
        console["warn"]("[XHS]\x20商品缺少\x20item_id，跳过:", q);
        continue;
      }
      try {
        const s = await getGoodsSkuInfo(b, r);
        if (s) {
          const t = {
            goods_id: r,
            goods_name: q["name"],
            goods_properties: q["attribute_info_list"]
              ? q["attribute_info_list"]
                  ["map"]((u) => u["attribute_name"] + ":\x20" + u["attribute_value"])
                  ["join"](",\x20")
              : "",
            goods_url:
              q["image_info_list"] && q["image_info_list"][0x0]
                ? q["image_info_list"][0x0]["link"]
                : "",
            urls: q["image_info_list"] ? q["image_info_list"]["map"]((u) => u["link"]) : [],
            goods_sku: s,
            price_info: q["price_info"],
            stock: q["stock"],
            type: a["type"],
            id: a["id"],
            ...(p === g["length"] - 0x1 ? { aiTaskId: a["aiTaskId"] } : {}),
          };
          k["push"](t);
        }
      } catch (u) {
        console["error"]("[XHS]\x20处理商品\x20" + r + "\x20详情失败:", u);
      }
      (p < g["length"] - 0x1 && (await new Promise((v) => setTimeout(v, 0x1388))),
        k["length"] >= 0xa &&
          (ipcRenderer["send"]("get-goods-detail", [...k]), (k["length"] = 0x0)));
    }
    (k["length"] > 0x0 && ipcRenderer["send"]("get-goods-detail", k),
      console["log"]("[XHS]\x20所有商品详情获取完成"));
  } catch (v) {
    console["error"]("[XHS]\x20获取全部商品详情时出错:", v);
  }
}
async function getGoodsSkuInfo(a, b) {
  try {
    const c = await fetch(
        "https://eva.xiaohongshu.com/api/edith/cs-tools/goods-v4/get-seller-sku-list",
        {
          method: "POST",
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-subsystem": "eva",
            "x-t": Date["now"]()["toString"](),
          },
          body: JSON["stringify"]({
            seller_id: a,
            item_id: b,
          }),
        },
      ),
      d = await c["json"]();
    console["log"]("[XHS]\x20SKU返回:", d);
    if (!d["success"] || !d["data"] || !d["data"]["data"]) return "";
    const e = d["data"]["data"],
      f = e["map"]((g) => {
        const h = g["variant_info_list"]
            ? g["variant_info_list"]
                ["map"]((j) => j["name"] + ":\x20" + j["value"])
                ["join"](",\x20")
            : "",
          i = g["price_info"] ? (g["price_info"]["price"] / 0x64)["toFixed"](0x2) : "";
        return h + "\x20¥" + i;
      });
    return f["join"](";\x20");
  } catch (g) {
    return (console["error"]("[XHS]\x20获取SKU详情失败:", g), "");
  }
}
ipcRenderer["on"]("paste-to-shop", (a, b) => {
  const c = document["querySelector"](".reply-textarea");
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
const sendImage = async (a = {}) => {
  try {
    const b = a["chatId"] || a["appCid"] || a["messageId"];
    let c = a["imageBase64"] || "",
      d = a["imageMimeType"] || "image/jpeg";
    const e = a["imageUrl"] || "";
    if (!b) return (console["error"]("[XHS]\x20sendImage\x20缺少\x20chatId:", a), ![]);
    if (!c && e) {
      const g = await fetch(e);
      if (!g["ok"]) throw new Error("下载图片失败:\x20" + g["status"]);
      const h = await g["blob"](),
        i = await new Promise((j, k) => {
          const l = new FileReader();
          ((l["onloadend"] = () => j(l["result"])),
            (l["onerror"] = () => k(new Error("读取图片失败"))),
            l["readAsDataURL"](h));
        });
      ((c = i["split"](",")[0x1]), (d = h["type"] || d));
    }
    if (!c) return (console["error"]("[XHS]\x20sendImage\x20缺少\x20imageBase64:", a), ![]);
    const f = c["startsWith"]("data:") ? c : "data:" + d + ";base64," + c;
    return (
      window["postMessage"](
        {
          type: "send-img",
          data: {
            appCid: b,
            src: f,
          },
        },
        "*",
      ),
      !![]
    );
  } catch (j) {
    return (console["error"]("[XHS]\x20sendImage\x20失败:", j, a), ![]);
  }
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
