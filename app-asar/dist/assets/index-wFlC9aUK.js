import {
  j as e,
  k as o,
  r as a,
  i as t,
  t as s,
  c as l,
  d as n,
  b as r,
  G as i,
  Z as u,
  a3 as d,
  U as c,
  S as p,
  _ as m,
  V as v,
  P as h,
  x as f,
  z as g,
  Q as b,
  a6 as y,
  h as x,
  a0 as w,
  I as k,
  R as S,
  X as _,
  F as N,
  a4 as j,
  B as C,
  E as L,
  D as U,
} from "./vendor-DHo7BzsC.js";
import {
  D as I,
  o as A,
  x as M,
  G as P,
  y as T,
  z,
  p as $,
  N as E,
  an as R,
  q as D,
  t as O,
  ao as F,
  v as q,
  ap as B,
  aq as V,
  F as H,
  i as X,
  d as J,
  g as Y,
  f as G,
  $ as Q,
  V as W,
  B as K,
  ar as Z,
  u as ee,
  as as oe,
} from "./index-Ct5UuHQN.js";
import ae from "./index-CjMsS0BO.js";
import { u as te } from "./use-merged-state-mPE1JA5r.js";
import { f as se } from "./format-length-l2rsThpR.js";
import { u as le } from "./useNaiveUI-B-ed9kcf.js";
import { H as ne, a as re, _ as ie, f as ue, g as de, S as ce } from "./shopPlatform-7nLl0lfh.js";
import { h as pe } from "./changeMesssage-DDIKDCV-.js";
import { S as me } from "./Scrollbar-DWjbW0E3.js";
import { _ as ve, a as he } from "./Tabs-D6a5U_fy.js";
import { _ as fe } from "./Empty-BURlTLhl.js";
import { _ as ge } from "./Divider-CDdOMQYZ.js";
import { _ as be } from "./Input-BbH8ts9k.js";
import { _ as ye } from "./Spin-liNla5t4.js";
import { _ as xe } from "./Tooltip-DYS7RCZ0.js";
import { _ as we } from "./Flex-BpAU42l_.js";
import { _ as ke } from "./Avatar-DGwaOewp.js";
import { _ as Se } from "./Progress-Buoz4lyV.js";
import { _ as _e } from "./Alert-Ckwi3yVQ.js";
import { _ as Ne } from "./Switch-B6Z6IYn_.js";
import { _ as je } from "./Dropdown-De4FdQJF.js";
import "./Icon-BkVA54F2.js";
import "./dayjs.min-D__CVkhT.js";
import "./_commonjsHelpers-Dvrxj_Zk.js";
import "./package-kTMkYQUO.js";
import "./Popover-Z03uJL-I.js";
import "./get-BluUyD2c.js";
import "./cssr-fugg8Rje.js";
import "./use-compitable-BbI6cQbC.js";
import "./Badge-CoCZ1ULG.js";
import "./attribute-Cap6sGiE.js";
import "./小红书-jZwggzOL.js";
import "./newAi-BxbCXy2V.js";
import "./ai-CALWm0qr.js";
import "./Add-DB3n_hTA.js";
import "./use-locale-BcUKARuA.js";
import "./get-slot-BjAOOWF7.js";
import "./utils-CPcGhtGy.js";
import "./Tag-DD6D_Gyq.js";
import "./create-D0sloWoF.js";
Object.assign(Object.assign({}, I.props), {
  left: [Number, String],
  right: [Number, String],
  top: [Number, String],
  bottom: [Number, String],
  shape: { type: String, default: "circle" },
  position: { type: String, default: "fixed" },
});
const Ce = A("n-float-button-group"),
  Le = M(
    "float-button",
    "\n user-select: none;\n cursor: pointer;\n color: var(--n-text-color);\n background-color: var(--n-color);\n font-size: 18px;\n transition:\n color .3s var(--n-bezier),\n border-color .3s var(--n-bezier),\n box-shadow .3s var(--n-bezier),\n background-color .3s var(--n-bezier);\n box-shadow: var(--n-box-shadow);\n display: flex;\n align-items: stretch;\n box-sizing: border-box;\n",
    [
      P("circle-shape", "\n border-radius: 4096px;\n "),
      P("square-shape", "\n border-radius: var(--n-border-radius-square);\n "),
      T(
        "fill",
        "\n position: absolute;\n top: 0;\n right: 0;\n bottom: 0\n left: 0;\n transition: background-color .3s var(--n-bezier);\n border-radius: inherit;\n ",
      ),
      T(
        "body",
        "\n position: relative;\n flex-grow: 1;\n display: flex;\n align-items: center;\n justify-content: center;\n transition: transform .3s var(--n-bezier), opacity .3s var(--n-bezier);\n border-radius: inherit;\n flex-direction: column;\n box-sizing: border-box;\n padding: 2px 4px;\n gap: 2px;\n transform: scale(1);\n ",
        [T("description", "\n font-size: 12px;\n text-align: center;\n line-height: 14px;\n ")],
      ),
      z("&:hover", "box-shadow: var(--n-box-shadow-hover);", [
        z(">", [T("fill", "\n background-color: var(--n-color-hover);\n ")]),
      ]),
      z("&:active", "box-shadow: var(--n-box-shadow-pressed);", [
        z(">", [T("fill", "\n background-color: var(--n-color-pressed);\n ")]),
      ]),
      P("show-menu", [
        z(">", [
          T("menu", "\n pointer-events: all;\n bottom: 100%;\n opacity: 1;\n "),
          T("close", "\n transform: scale(1);\n opacity: 1;\n "),
          T("body", "\n transform: scale(0.75);\n opacity: 0;\n "),
        ]),
      ]),
      T(
        "close",
        "\n opacity: 0;\n transform: scale(0.75);\n position: absolute;\n top: 0;\n right: 0;\n bottom: 0;\n left: 0;\n display: flex;\n align-items: center;\n justify-content: center;\n transition: transform .3s var(--n-bezier), opacity .3s var(--n-bezier);\n ",
      ),
      T(
        "menu",
        "\n position: absolute;\n bottom: calc(100% - 8px);\n display: flex;\n flex-direction: column;\n opacity: 0;\n pointer-events: none;\n transition:\n opacity .3s var(--n-bezier),\n bottom .3s var(--n-bezier); \n ",
        [
          z("> *", "\n margin-bottom: 16px;\n "),
          M("float-button", "\n position: relative !important;\n "),
        ],
      ),
    ],
  ),
  Ue = e({
    name: "FloatButton",
    props: Object.assign(Object.assign({}, I.props), {
      width: { type: [Number, String], default: 40 },
      height: { type: [Number, String], default: 40 },
      left: [Number, String],
      right: [Number, String],
      top: [Number, String],
      bottom: [Number, String],
      shape: { type: String, default: "circle" },
      position: { type: String, default: "fixed" },
      type: { type: String, default: "default" },
      menuTrigger: String,
      showMenu: { type: Boolean, default: void 0 },
      onUpdateShowMenu: { type: [Function, Array], default: void 0 },
      "onUpdate:showMenu": { type: [Function, Array], default: void 0 },
    }),
    slots: Object,
    setup(e) {
      const { mergedClsPrefixRef: o, inlineThemeDisabled: i } = O(e),
        u = a(null),
        d = I("FloatButton", "-float-button", Le, F, e, o),
        c = t(Ce, null),
        p = a(!1),
        m = s(e, "showMenu"),
        v = te(m, p);
      function h(o) {
        const { onUpdateShowMenu: a, "onUpdate:showMenu": t } = e;
        ((p.value = o), a && H(a, o), t && H(t, o));
      }
      const f = l(() => {
          const {
              self: {
                color: o,
                textColor: a,
                boxShadow: t,
                boxShadowHover: s,
                boxShadowPressed: l,
                colorHover: n,
                colorPrimary: r,
                colorPrimaryHover: i,
                textColorPrimary: u,
                borderRadiusSquare: c,
                colorPressed: p,
                colorPrimaryPressed: m,
              },
              common: { cubicBezierEaseInOut: v },
            } = d.value,
            { type: h } = e;
          return {
            "--n-bezier": v,
            "--n-box-shadow": t,
            "--n-box-shadow-hover": s,
            "--n-box-shadow-pressed": l,
            "--n-color": "primary" === h ? r : o,
            "--n-text-color": "primary" === h ? u : a,
            "--n-color-hover": "primary" === h ? i : n,
            "--n-color-pressed": "primary" === h ? m : p,
            "--n-border-radius-square": c,
          };
        }),
        g = l(() => {
          const { width: o, height: a } = e;
          return Object.assign(
            { position: c ? void 0 : e.position, width: se(o), minHeight: se(a) },
            c
              ? null
              : { left: se(e.left), right: se(e.right), top: se(e.top), bottom: se(e.bottom) },
          );
        }),
        b = l(() => (c ? c.shapeRef.value : e.shape)),
        y = () => {
          "hover" === e.menuTrigger && v.value && h(!1);
        },
        x = i
          ? q(
              "float-button",
              l(() => e.type[0]),
              f,
              e,
            )
          : void 0;
      return (
        n(() => {
          const e = u.value;
          e && B("mousemoveoutside", e, y);
        }),
        r(() => {
          const e = u.value;
          e && V("mousemoveoutside", e, y);
        }),
        {
          inlineStyle: g,
          selfElRef: u,
          cssVars: i ? void 0 : f,
          mergedClsPrefix: o,
          mergedShape: b,
          mergedShowMenu: v,
          themeClass: null == x ? void 0 : x.themeClass,
          onRender: null == x ? void 0 : x.onRender,
          Mouseenter: () => {
            "hover" === e.menuTrigger && h(!0);
          },
          handleMouseleave: y,
          handleClick: () => {
            "click" === e.menuTrigger && h(!v.value);
          },
        }
      );
    },
    render() {
      var e;
      const {
        mergedClsPrefix: a,
        cssVars: t,
        mergedShape: s,
        type: l,
        menuTrigger: n,
        mergedShowMenu: r,
        themeClass: i,
        $slots: u,
        inlineStyle: d,
        onRender: c,
      } = this;
      return (
        null == c || c(),
        o(
          "div",
          {
            ref: "selfElRef",
            class: [
              `${a}-float-button`,
              `${a}-float-button--${s}-shape`,
              `${a}-float-button--${l}-type`,
              r && `${a}-float-button--show-menu`,
              i,
            ],
            style: [t, d],
            onMouseenter: this.Mouseenter,
            onMouseleave: this.handleMouseleave,
            onClick: this.handleClick,
            role: "button",
          },
          o("div", { class: `${a}-float-button__fill`, "aria-hidden": !0 }),
          o(
            "div",
            { class: `${a}-float-button__body` },
            null === (e = u.default) || void 0 === e ? void 0 : e.call(u),
            D(u.description, (e) =>
              e ? o("div", { class: `${a}-float-button__description` }, e) : null,
            ),
          ),
          n
            ? o(
                "div",
                { class: `${a}-float-button__close` },
                o(E, { clsPrefix: a }, { default: () => o(R, null) }),
              )
            : null,
          n
            ? o(
                "div",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                  },
                  "data-float-button-menu": !0,
                  class: `${a}-float-button__menu`,
                },
                $(u.menu, () => []),
              )
            : null,
        )
      );
    },
  }),
  Ie = J(
    e({
      __name: "index",
      emits: ["clickFloatMenu"],
      setup(e, { emit: o }) {
        let t = a(null),
          s = a(!1);
        const l = i({ x: 0, y: 0 }),
          n = o;
        let r = 0,
          h = !1;
        const f = (e) => {
            var o;
            (X.sendSync("memo-start-drag", !0), (r = Date.now()), (h = !1), (s.value = !0));
            const a = e.clientX,
              n = e.clientY,
              i = null == (o = t.value) ? void 0 : o.getBoundingClientRect();
            if (!i) return;
            const u = a - i.left,
              d = n - i.top,
              c = (e) => {
                if (!s.value) return;
                const o = e.clientX,
                  a = e.clientY;
                let t = o - u,
                  n = a - d;
                const r = window.innerWidth - 74,
                  i = window.innerHeight - 74;
                (t < 0 && (t = 0),
                  n < 0 && (n = 0),
                  t > r && (t = r),
                  n > i && (n = i),
                  (l.x = t),
                  (l.y = n),
                  (h = !0));
              },
              p = () => {
                ((s.value = !1),
                  document.removeEventListener("mousemove", c),
                  document.removeEventListener("mouseup", p));
              };
            (document.addEventListener("mousemove", c),
              document.addEventListener("mouseup", p),
              e.preventDefault());
          },
          g = () => {
            h || Date.now() - r > 200 || n("clickFloatMenu", "remark");
          };
        return (e, o) => {
          const a = Ue;
          return (
            v(),
            u(
              "div",
              {
                ref_key: "floatButtonRef",
                ref: t,
                onMousedown: f,
                style: d([
                  {
                    left: l.x + "px",
                    top: l.y + "px",
                    right: "auto",
                    bottom: "auto",
                    position: "fixed",
                  },
                  { "z-index": "99" },
                ]),
              },
              [
                c(
                  a,
                  {
                    type: "primary",
                    shape: "square",
                    width: "90",
                    height: "50",
                    class: "ai-button-remark",
                    onClick: g,
                  },
                  {
                    default: p(() => [
                      ...(o[0] ||
                        (o[0] = [
                          m(
                            "div",
                            { id: "draggable-ai-button" },
                            [
                              m("div", { class: "drag-img" }),
                              m(
                                "span",
                                {
                                  style: {
                                    "font-size": "13px",
                                    "font-weight": "500",
                                    "white-space": "nowrap",
                                  },
                                },
                                "备忘录",
                              ),
                            ],
                            -1,
                          ),
                        ])),
                    ]),
                    _: 1,
                  },
                ),
              ],
              36,
            )
          );
        };
      },
    }),
    [["__scopeId", "data-v-7669b252"]],
  ),
  Ae = { class: "pt-[24px] mx-[24px] sticky top-0 z-[1] bg-white dark:bg-[#1a1a1a]" },
  Me = { class: "mb-4" },
  Pe = { class: "relative cursor-pointer" },
  Te = { class: "relative cursor-pointer" },
  ze = { class: "relative cursor-pointer" },
  $e = { class: "relative cursor-pointer" },
  Ee = { class: "mx-[24px] mb-[88.39px]" },
  Re = { class: "text-center" },
  De = { class: "mx-2 flex flex-col items-center justify-center" },
  Oe = { class: "relative flex items-center" },
  Fe = { class: "ml-1 flex-1 overflow-hidden" },
  qe = { class: "font-bold text-sm line-clamp-1" },
  Be = { key: 0, class: "text-gray-500 text-[11px] line-clamp-1" },
  Ve = { key: 0, class: "text-red-500 text-xs" },
  He = { key: 1, class: "text-red-500 text-xs" },
  Xe = { class: "bg-white h-full overflow-hidden" },
  Je = { class: "flex items-center" },
  Ye = { class: "line-clamp-1" },
  Ge = { class: "whitespace-pre" },
  Qe = J(
    e({
      __name: "index",
      setup(e) {
        const o = a([]),
          { showMessage: t } = le(),
          s = Y(),
          i = G(),
          { currentSelectShopId: d, shops: I, messageList: A } = h(s),
          M = a(""),
          P = a(),
          T = a(null),
          z = a("1"),
          $ = a("拼多多"),
          E = a([]),
          R = l(() =>
            I.value.length
              ? Number(
                  (
                    (I.value.filter((e) => e.isPageLoadingCompleted).length / I.value.length) *
                    100
                  ).toFixed(0),
                )
              : 0,
          ),
          D = (e) => {
            s.setSelectShopId(e);
          },
          O = a(!1);
        if ("server" === i.loginType)
          (async () => {
            O.value = !0;
            try {
              let e = [];
              const o = await Z({ platformType: 4 }),
                a = await Z({ platformType: 5 });
              e = o.concat(a);
              const t = [];
              for (let s of e) {
                const e = ce(s.platformType);
                t.push({
                  chatUrl: `${e.chatUrl}?username=${s.subAccount}&password=${s.password}`,
                  homeUrl: `${e.homeUrl}?loginInfo=true&username=${s.subAccount}&password=${s.password}`,
                  id: s.id,
                  shopId: "",
                  loginStatus: !1,
                  shopName: s.shopName,
                  shopLogo: s.loginUrl,
                  customerName: s.kfNickName,
                  subAccount: "商家扫码" === s.subAccount ? "" : s.subAccount,
                  password: "扫码" === s.password ? "" : s.password,
                  platformType: e.platformName,
                  platformLogo: e.platformLogo,
                  domain: e.domain,
                  domainUrl: e.domainUrl,
                  loginCookieName: e.loginCookieName,
                  homeNeedCookieValue: e.homeNeedCookieValue,
                  preload: e.preload,
                  homePreload: e.homePreload,
                  cookies: s.loginToken ? JSON.parse(s.loginToken) : [],
                  isPageLoadingCompleted: !1,
                  merchantName: s.userName,
                  isManuallyAdd: !1,
                  remark: s.remark,
                  isInfoCorrect: !0,
                  groupName: s.groupName,
                  botId: s.botId,
                  kbId: s.kbId,
                  shopStatus: "离线",
                  aiRecommendedReply: !1,
                  autoSendAiReply: !1,
                  isWssConnectClose: !1,
                });
              }
              ((s.localDataList = []),
                s.localDataList.push(...t),
                ee.log.info(`本地数据：${JSON.stringify(t)}`));
              for (let l of s.manuallyAddShopList)
                t.push({ ...l, isPageLoadingCompleted: !1, loginStatus: !1, shopStatus: "离线" });
              (s.pushShops(t),
                (E.value = new Array(t.length).fill(!0)),
                I.value.length > 0 &&
                  f(() => {
                    D(I.value[0].id);
                  }),
                (O.value = !1));
            } catch {
              O.value = !1;
            }
          })();
        else {
          const e = [];
          e.push.apply(
            e,
            s.localDataList.map((e) => ({
              ...e,
              loginStatus: !1,
              isPageLoadingCompleted: !1,
              shopStatus: "离线",
            })),
          );
          for (let o of s.manuallyAddShopList)
            e.push({ ...o, isPageLoadingCompleted: !1, loginStatus: !1, shopStatus: "离线" });
          (s.pushShops(e),
            (E.value = new Array(s.localDataList.length).fill(!0)),
            I.value.length > 0 &&
              f(() => {
                D(I.value[0].id);
              }));
        }
        r(() => {
          (o.value.forEach(async (e) => {
            e &&
              (e.removeEventListener("ipc-message", () => {}),
              e.removeEventListener("dom-ready", () => {}));
          }),
            s.setShops([]));
        });
        const F = () => {
            const e = ee.getUUID(),
              a = Number(
                e
                  .replace(/[^0-9]/gi, "")
                  .slice(0, 8)
                  .padEnd(8, "0"),
              );
            let t;
            switch ($.value) {
              case "拼多多":
              default:
                t = ce("4");
                break;
              case "抖店":
                t = ce("5");
            }
            const l = {
              id: a,
              chatUrl: `${t.chatUrl}?username=&password=`,
              homeUrl: `${t.homeUrl}?loginInfo=true&username=&password=`,
              shopId: "",
              loginStatus: !1,
              shopName: "未登录",
              shopLogo: "",
              customerName: "",
              subAccount: "",
              password: "",
              platformType: t.platformName,
              platformLogo: t.platformLogo,
              domain: t.domain,
              domainUrl: t.domainUrl,
              loginCookieName: t.loginCookieName,
              homeNeedCookieValue: t.homeNeedCookieValue,
              preload: t.preload,
              homePreload: t.homePreload,
              cookies: [],
              isPageLoadingCompleted: !1,
              merchantName: "",
              isManuallyAdd: !0,
              remark: "",
              isInfoCorrect: !0,
              groupName: "",
              botId: "",
              kbId: "",
              shopStatus: "离线",
              aiRecommendedReply: !1,
              autoSendAiReply: !1,
            };
            (s.addShop(l),
              s.addManuallyShop(l),
              ee.log.info(`手动添加店铺数据：${JSON.stringify(s.manuallyAddShopList)}`),
              f(() => {
                if (o.value.length) {
                  const e = o.value[a];
                  (e.addEventListener("ipc-message", (o) => pe(o, a, e)),
                    e.addEventListener("dom-ready", () => {
                      ((I.value[I.value.findIndex((e) => e.id === a)].isPageLoadingCompleted = !0),
                        l.cookies.length &&
                          X.invoke("set-webview-cookie", {
                            id: a,
                            domain: l.domain,
                            domainUrl: l.domainUrl,
                            cookies: l.cookies,
                            loginCookieName: l.loginCookieName,
                          }).then((o) => {
                            o &&
                              f(() => {
                                (e.setAttribute("src", l.chatUrl), e.reload);
                              });
                          }));
                    }));
                }
              }));
          },
          q = Q(),
          B = (e) => {
            switch (e.key) {
              case "relogin":
                q.info({
                  title: "提示",
                  content: "确定重新登录所有店铺？",
                  positiveText: "确定",
                  negativeText: "取消",
                  maskClosable: !1,
                  onPositiveClick: () => {
                    (s.clearMessage(), window.location.reload());
                  },
                });
                break;
              case "settings":
                X.postMessage("open-setting");
                break;
              case "faq":
                window.open(
                  "https://o6mg3uwlq1.feishu.cn/docx/LoIsdg8AHoSO41xQcIEcca9Anfc?from=from_copylink",
                );
                break;
              case "manual":
                window.open(
                  "https://o6mg3uwlq1.feishu.cn/docx/U8YEd4CEFox3eRxlrdmc4KNNnqe?from=from_copylink",
                );
                break;
              case "admin":
                window.open("http://xiaoniu.niushidai.cn/");
            }
          },
          V = a(null),
          H = (e) => {
            f(() => {
              var o, a;
              const t = null == (o = document.getElementById(`shop-${e}`)) ? void 0 : o.offsetTop;
              t &&
                "number" == typeof t &&
                (null == (a = V.value) || a.scrollTo({ top: t - 179, behavior: "smooth" }));
            });
          };
        (n(() => {
          (KhaiShopInitDragSort(),
            X.on("shop-select-up", () => {
            ((z.value = "1"), (T.value = null));
            const e = I.value.findIndex((e) => e.id === d.value);
            if (0 === e) {
              const e = I.value.length - 1;
              $.value = I.value[e].platformType;
              const o = I.value[e].id;
              (D(o), H(o));
            } else {
              const o = e - 1;
              $.value = I.value[o].platformType;
              const a = I.value[o].id;
              (D(a), H(a));
            }
          }),
            X.on("shop-select-down", () => {
              ((z.value = "1"), (T.value = null));
              const e = I.value.findIndex((e) => e.id === d.value);
              if (e === I.value.length - 1) {
                $.value = I.value[0].platformType;
                const e = I.value[0].id;
                (D(e), H(e));
              } else {
                const o = e + 1;
                $.value = I.value[o].platformType;
                const a = I.value[o].id;
                (D(a), H(a));
              }
            }),
            X.on("open-todo-list", (e, a) => {
              var t;
              null == (t = o.value[a]) || t.send("open-todo-list");
            }));
        }),
          g(() => {
            (X.removeAllListeners("shop-select-up"),
              X.removeAllListeners("shop-select-down"),
              X.removeAllListeners("open-todo-list"),
              KhaiShopDestroyDragSort());
          }));
        const J = () => {
            switch (M.value) {
              case "openwebviewdevtools":
                null == (e = o.value[d.value]) || e.openDevTools();
                break;
              case "opendevtools":
                X.postMessage("open-dev-tools");
                break;
              case "openlog":
                X.postMessage("open-log");
            }
            var e;
          },
          te = a(!1),
          se = a(0),
          Ce = a(0),
          Le = a(),
          Ue = (e) => {
            switch (e) {
              case "delete":
                if (void 0 !== Le.value) {
                  const e = o.value[Le.value.id];
                  (null == e || e.removeEventListener("ipc-message", () => {}),
                    null == e || e.removeEventListener("dom-ready", () => {}),
                    d.value === Le.value.id &&
                      (1 === I.value.length && 1 === s.manuallyAddShopList.length
                        ? s.setSelectShopId(-1)
                        : D(I.value[0].id)),
                    E.value.splice(
                      s.shopList.findIndex((e) => e.id === Le.value.id),
                      1,
                    ),
                    s.removeShop(Le.value.id),
                    s.removeManuallyShop(Le.value.id),
                    (Le.value = void 0));
                }
                break;
              case "refreshData":
                oe(Le.value.id).then((e) => {
                  const a = s.shopList.findIndex((e) => e.id === Le.value.id);
                  ((s.shopList[a].cookies = e.loginToken ? JSON.parse(e.loginToken) : []),
                    (s.shopList[a].shopName = e.shopName),
                    (s.shopList[a].remark = e.remark));
                  const l = s.shopList[a];
                  (t.success("刷新成功"),
                    X.invoke(
                      "set-webview-cookie",
                      {
                        id: `${Le.value.id}-shop-home`,
                        cookies: l.cookies,
                        domain: l.domain,
                        domainUrl: l.domainUrl,
                        loginCookieName: l.loginCookieName,
                      },
                      !1,
                    ).then((e) => {
                      if (e) {
                        const e = o.value[Le.value.id];
                        f(() => {
                          (e.setAttribute("src", l.homeUrl), e.reload);
                        });
                      }
                    }));
                });
                break;
              case "clearCache":
                const e = s.shopList.findIndex((e) => e.id === Le.value.id);
                ((s.shopList[e].cookies = []), (s.shopList[e].loginStatus = !1));
                const a = s.shopList[e];
                X.invoke("clear-webview-storage", Le.value.id).then(() => {
                  const e = o.value[Le.value.id];
                  (f(() => {
                    (e.setAttribute("src", a.homeUrl), e.reload);
                  }),
                    t.success("清除成功"));
                });
            }
            te.value = !1;
          },
          Qe = a([
            { label: "删除", key: "delete", disabled: !1 },
            { label: "刷新数据", key: "refreshData", disabled: !1 },
            { label: "清空缓存", key: "clearCache", disabled: !1 },
          ]),
          We = () => {
            ((Le.value = void 0), (te.value = !1));
          },
          Ke = a(!1);
        let KhaiShopDragId = null,
          KhaiShopDragObserver = null,
          KhaiShopPointerDrag = null,
          KhaiShopSuppressClickUntil = 0;
        const KhaiShopDragStyleId = "khai-shop-drag-sort-style",
          KhaiShopCardId = (e) => String(e == null ? void 0 : e.id).replace(/^shop-/, ""),
          KhaiShopSameId = (e, o) => String(e) === String(o),
          KhaiShopGetCard = (e) =>
            e && e.closest ? e.closest('[id^="shop-"]') : null,
          KhaiShopClearDragState = () => {
            KhaiShopPointerDrag &&
              KhaiShopPointerDrag.card &&
              ((KhaiShopPointerDrag.card.style.transform = ""),
              (KhaiShopPointerDrag.card.style.zIndex = ""),
              (KhaiShopPointerDrag.card.style.pointerEvents = ""));
            document
              .querySelectorAll(".khai-shop-dragging,.khai-shop-drag-over")
              .forEach((e) => e.classList.remove("khai-shop-dragging", "khai-shop-drag-over"));
            ((document.body.style.cursor = ""),
              (document.body.style.userSelect = ""),
              (KhaiShopDragId = null),
              (KhaiShopPointerDrag = null));
          },
          KhaiShopApplyDragAttrs = () => {
            document.getElementById(KhaiShopDragStyleId) ||
              (() => {
                const e = document.createElement("style");
                ((e.id = KhaiShopDragStyleId),
                  (e.textContent =
                    '[id^="shop-"].khai-shop-draggable{cursor:grab;user-select:none;touch-action:none;transition:box-shadow .16s ease,border-color .16s ease,background-color .16s ease}[id^="shop-"].khai-shop-draggable:active{cursor:grabbing}[id^="shop-"].khai-shop-dragging{opacity:.82;box-shadow:0 12px 26px rgba(37,99,235,.28)!important;position:relative;z-index:20;pointer-events:none}[id^="shop-"].khai-shop-drag-over{border-color:#2563eb!important;box-shadow:0 0 0 2px rgba(37,99,235,.22)!important;background:#eff6ff!important}'));
                document.head.appendChild(e);
              })();
            document.querySelectorAll('[id^="shop-"]').forEach((e) => {
              ((e.draggable = !0),
                e.classList.add("khai-shop-draggable"),
                e.setAttribute("title", "拖动调整店铺排序"));
            });
          },
          KhaiShopMoveToIndex = (e, o) => {
            if (null == e || null == o) return !1;
            const a = s.shopList.findIndex((o) => KhaiShopSameId(o.id, e));
            if (a < 0) return !1;
            let t = Math.max(0, Math.min(Number(o), s.shopList.length));
            if ((a < t && t--, a === t)) return !1;
            const [l] = s.shopList.splice(a, 1);
            return (
              s.shopList.splice(t, 0, l),
              s.saveShopDataToCache && s.saveShopDataToCache(),
              ee.log.info(`[listen-test][shop-drag-sort] shopId=${e}, from=${a}, to=${t}`),
              f(() => {
                KhaiShopApplyDragAttrs();
              }),
              !0
            );
          },
          KhaiShopGetVisibleCards = () =>
            Array.from(document.querySelectorAll('[id^="shop-"].khai-shop-draggable')).filter(
              (e) =>
                e.offsetParent &&
                (!KhaiShopPointerDrag || !KhaiShopSameId(KhaiShopCardId(e), KhaiShopPointerDrag.id)),
            ),
          KhaiShopGetInsertIndex = (e) => {
            let o = null;
            for (const a of KhaiShopGetVisibleCards()) {
              const t = s.shopList.findIndex((e) => KhaiShopSameId(e.id, KhaiShopCardId(a)));
              if (t < 0) continue;
              o = t;
              const l = a.getBoundingClientRect();
              if (e < l.top + l.height / 2) return t;
            }
            return null == o ? null : o + 1;
          },
          KhaiShopMove = (e, o) => {
            const a = s.shopList.findIndex((e) => KhaiShopSameId(e.id, o));
            a >= 0 && KhaiShopMoveToIndex(e, a);
          },
          KhaiShopIsInteractiveTarget = (e) =>
            Boolean(
              e &&
                e.closest &&
                e.closest("button,input,textarea,select,a,.n-switch,.n-button,.n-dropdown,.n-tabs-tab"),
            ),
          KhaiShopMarkDragOver = (e) => {
            document
              .querySelectorAll(".khai-shop-drag-over")
              .forEach((o) => o !== e && o.classList.remove("khai-shop-drag-over"));
            e && e.classList.add("khai-shop-drag-over");
          },
          KhaiShopOnMouseDown = (e) => {
            if (KhaiShopPointerDrag) return;
            if (e.button !== 0 || KhaiShopIsInteractiveTarget(e.target)) return;
            const o = KhaiShopGetCard(e.target);
            if (!o) return;
            ee.log.info(`[listen-test][shop-drag-down] shopId=${KhaiShopCardId(o)}`);
            KhaiShopPointerDrag = {
              id: KhaiShopCardId(o),
              startX: e.clientX,
              startY: e.clientY,
              overId: null,
              insertIndex: null,
              active: !1,
              card: o,
            };
          },
          KhaiShopOnMouseMove = (e) => {
            if (!KhaiShopPointerDrag) return;
            const o = e.clientX - KhaiShopPointerDrag.startX,
              a = e.clientY - KhaiShopPointerDrag.startY;
            if (!KhaiShopPointerDrag.active) {
              if (Math.abs(o) + Math.abs(a) < 6) return;
              ((KhaiShopPointerDrag.active = !0),
                (KhaiShopDragId = KhaiShopPointerDrag.id),
                KhaiShopPointerDrag.card.classList.add("khai-shop-dragging"),
                ee.log.info(`[listen-test][shop-drag-start] shopId=${KhaiShopPointerDrag.id}`),
                (KhaiShopPointerDrag.card.style.zIndex = "20"),
                (KhaiShopPointerDrag.card.style.pointerEvents = "none"),
                (document.body.style.userSelect = "none"),
                (document.body.style.cursor = "grabbing"));
            }
            e.preventDefault();
            KhaiShopPointerDrag.card.style.transform = `translateY(${a}px)`;
            const t = KhaiShopGetInsertIndex(e.clientY),
              l = KhaiShopGetCard(document.elementFromPoint(e.clientX, e.clientY));
            ((KhaiShopPointerDrag.insertIndex = t),
              l && KhaiShopCardId(l) !== KhaiShopPointerDrag.id
                ? ((KhaiShopPointerDrag.overId = KhaiShopCardId(l)), KhaiShopMarkDragOver(l))
                : ((KhaiShopPointerDrag.overId = null), KhaiShopMarkDragOver(null)));
          },
          KhaiShopOnMouseUp = (e) => {
            if (!KhaiShopPointerDrag) return;
            const o = KhaiShopPointerDrag,
              a = null == o.insertIndex ? KhaiShopGetInsertIndex(e.clientY) : o.insertIndex;
            o.active && ((KhaiShopSuppressClickUntil = Date.now() + 350), e.preventDefault());
            KhaiShopClearDragState();
            o.active &&
              (ee.log.info(`[listen-test][shop-drag-end] shopId=${o.id}, insertIndex=${a}`),
              null != a && KhaiShopMoveToIndex(o.id, a));
          },
          KhaiShopOnPointerDown = (e) => {
            const o = KhaiShopGetCard(e.target);
            if (o && o.setPointerCapture)
              try {
                o.setPointerCapture(e.pointerId);
              } catch (e) {}
            KhaiShopOnMouseDown(e);
          },
          KhaiShopOnPointerMove = (e) => {
            KhaiShopOnMouseMove(e);
          },
          KhaiShopOnPointerUp = (e) => {
            const o = KhaiShopGetCard(e.target);
            if (o && o.releasePointerCapture)
              try {
                o.releasePointerCapture(e.pointerId);
              } catch (e) {}
            KhaiShopOnMouseUp(e);
          },
          KhaiShopOnClick = (e) => {
            Date.now() < KhaiShopSuppressClickUntil && (e.preventDefault(), e.stopPropagation());
          },
          KhaiShopOnDragStart = (e) => {
            const o = KhaiShopGetCard(e.target);
            if (!o) return;
            ((KhaiShopDragId = KhaiShopCardId(o)),
              o.classList.add("khai-shop-dragging"),
              ee.log.info(`[listen-test][shop-native-drag-start] shopId=${KhaiShopDragId}`),
              e.dataTransfer &&
                ((e.dataTransfer.effectAllowed = "move"),
                e.dataTransfer.setData("text/plain", String(KhaiShopDragId))));
          },
          KhaiShopOnDragOver = (e) => {
            const o = KhaiShopGetCard(e.target);
            if (!o || KhaiShopSameId(KhaiShopCardId(o), KhaiShopDragId)) return;
            (e.preventDefault(),
              e.dataTransfer && (e.dataTransfer.dropEffect = "move"),
              document
                .querySelectorAll(".khai-shop-drag-over")
                .forEach((e) => e !== o && e.classList.remove("khai-shop-drag-over")),
              o.classList.add("khai-shop-drag-over"));
          },
          KhaiShopOnDrop = (e) => {
            const o = KhaiShopGetCard(e.target);
            if (!o) return;
            e.preventDefault();
            const a =
                (null == e.dataTransfer ? void 0 : e.dataTransfer.getData("text/plain")) ||
                KhaiShopDragId,
              t = KhaiShopCardId(o);
            (KhaiShopMove(a, t), KhaiShopClearDragState());
          },
          KhaiShopInitDragSort = () => {
            KhaiShopApplyDragAttrs();
            ee.log.info("[listen-test][shop-drag-init]");
            document.addEventListener("pointerdown", KhaiShopOnPointerDown, !0);
            document.addEventListener("pointermove", KhaiShopOnPointerMove, !0);
            document.addEventListener("pointerup", KhaiShopOnPointerUp, !0);
            document.addEventListener("mousedown", KhaiShopOnMouseDown, !0);
            document.addEventListener("mousemove", KhaiShopOnMouseMove, !0);
            document.addEventListener("mouseup", KhaiShopOnMouseUp, !0);
            document.addEventListener("click", KhaiShopOnClick, !0);
            document.addEventListener("dragstart", KhaiShopOnDragStart, !0);
            document.addEventListener("dragover", KhaiShopOnDragOver, !0);
            document.addEventListener("drop", KhaiShopOnDrop, !0);
            document.addEventListener("dragend", KhaiShopClearDragState, !0);
            KhaiShopDragObserver ||
              ((KhaiShopDragObserver = new MutationObserver(() => KhaiShopApplyDragAttrs())),
              KhaiShopDragObserver.observe(document.body, { childList: !0, subtree: !0 }));
          },
          KhaiShopDestroyDragSort = () => {
            (document.removeEventListener("pointerdown", KhaiShopOnPointerDown, !0),
              document.removeEventListener("pointermove", KhaiShopOnPointerMove, !0),
              document.removeEventListener("pointerup", KhaiShopOnPointerUp, !0),
              document.removeEventListener("mousedown", KhaiShopOnMouseDown, !0),
              document.removeEventListener("mousemove", KhaiShopOnMouseMove, !0),
              document.removeEventListener("mouseup", KhaiShopOnMouseUp, !0),
              document.removeEventListener("click", KhaiShopOnClick, !0),
              document.removeEventListener("dragstart", KhaiShopOnDragStart, !0),
              document.removeEventListener("dragover", KhaiShopOnDragOver, !0),
              document.removeEventListener("drop", KhaiShopOnDrop, !0),
              document.removeEventListener("dragend", KhaiShopClearDragState, !0),
              KhaiShopDragObserver && KhaiShopDragObserver.disconnect(),
              (KhaiShopDragObserver = null),
              KhaiShopClearDragState());
          };
        return (e, a) => {
          const t = ge,
            s = be,
            l = he,
            n = ve,
            r = ye,
            i = fe,
            h = ke,
            g = we,
            q = W,
            H = xe,
            X = K,
            Y = me,
            G = Se,
            Q = ie,
            Z = Ne,
            ee = de,
            oe = _e,
            le = b("webview"),
            ce = ue,
            pe = re,
            Ze = je;
          return (
            v(),
            u(
              N,
              null,
              [
                c(pe, null, {
                  default: p(() => [
                    c(t, { class: "!my-0" }),
                    c(ne, {
                      "no-show-menu": [
                        "knowledge",
                        "customer_service",
                        "home",
                        "settings",
                        "offlineOrOnline",
                      ],
                      onClickMenu: B,
                    }),
                    c(
                      pe,
                      {
                        "has-sider": "",
                        "native-scrollbar": !1,
                        "scrollbar-props": { trigger: "none" },
                        "content-style": "height: calc(100vh - 97px)",
                      },
                      {
                        default: p(() => [
                          c(
                            Q,
                            {
                              "has-sider": "",
                              class: "relative box-border",
                              width: 350,
                              "collapse-mode": "transform",
                              "collapsed-width": 24,
                              "show-trigger": "arrow-circle",
                              bordered: "",
                            },
                            {
                              default: p(() => [
                                c(
                                  Y,
                                  { ref_key: "scrollbarRef", ref: V },
                                  {
                                    default: p(() => [
                                      m("div", Ae, [
                                        c(
                                          s,
                                          {
                                            ref_key: "searchInputRef",
                                            ref: P,
                                            value: M.value,
                                            "onUpdate:value": a[0] || (a[0] = (e) => (M.value = e)),
                                            type: "text",
                                            placeholder: "请输入店铺/客服/商家名称",
                                            clearable: "",
                                            onClear: a[1] || (a[1] = (e) => (M.value = "")),
                                            onKeyup: y(J, ["enter"]),
                                          },
                                          null,
                                          8,
                                          ["value"],
                                        ),
                                        m("div", Me, [
                                          c(
                                            n,
                                            {
                                              value: z.value,
                                              "onUpdate:value": [
                                                a[2] || (a[2] = (e) => (z.value = e)),
                                                a[3] ||
                                                  (a[3] = (e) => {
                                                    switch (e) {
                                                      case "1":
                                                        T.value = null;
                                                        break;
                                                      case "2":
                                                        T.value = !1;
                                                        break;
                                                      case "3":
                                                        T.value = !0;
                                                    }
                                                  }),
                                              ],
                                              class: "mt-3",
                                              "tab-class": "z-0",
                                              "justify-content": "space-between",
                                              type: "line",
                                            },
                                            {
                                              default: p(() => [
                                                c(
                                                  l,
                                                  { name: "1" },
                                                  {
                                                    default: p(() => [
                                                      x(" 店铺数：" + w(k(I).length), 1),
                                                    ]),
                                                    _: 1,
                                                  },
                                                ),
                                                c(
                                                  l,
                                                  { name: "2" },
                                                  {
                                                    default: p(() => [
                                                      m("span", Pe, [
                                                        a[8] ||
                                                          (a[8] = m(
                                                            "i",
                                                            {
                                                              class:
                                                                "absolute top-2 -left-3 w-[6px] h-[6px] rounded-full block bg-red-500",
                                                            },
                                                            null,
                                                            -1,
                                                          )),
                                                        x(
                                                          " 未登录：" +
                                                            w(
                                                              k(I).filter((e) => !e.loginStatus)
                                                                .length,
                                                            ),
                                                          1,
                                                        ),
                                                      ]),
                                                    ]),
                                                    _: 1,
                                                  },
                                                ),
                                                c(
                                                  l,
                                                  { name: "3" },
                                                  {
                                                    default: p(() => [
                                                      m("span", Te, [
                                                        a[9] ||
                                                          (a[9] = m(
                                                            "i",
                                                            {
                                                              class:
                                                                "absolute top-2 -left-3 w-[6px] h-[6px] rounded-full block bg-green-500",
                                                            },
                                                            null,
                                                            -1,
                                                          )),
                                                        x(
                                                          " 已登录：" +
                                                            w(
                                                              k(I).filter((e) => e.loginStatus)
                                                                .length,
                                                            ),
                                                          1,
                                                        ),
                                                      ]),
                                                    ]),
                                                    _: 1,
                                                  },
                                                ),
                                              ]),
                                              _: 1,
                                            },
                                            8,
                                            ["value"],
                                          ),
                                          c(
                                            n,
                                            {
                                              value: $.value,
                                              "onUpdate:value": [
                                                a[4] || (a[4] = (e) => ($.value = e)),
                                                a[5] ||
                                                  (a[5] = (e) => {
                                                    $.value = e;
                                                  }),
                                              ],
                                              class: "mt-3",
                                              "tab-class": "z-0",
                                              type: "segment",
                                              animated: "",
                                            },
                                            {
                                              default: p(() => [
                                                c(
                                                  l,
                                                  { name: "拼多多" },
                                                  {
                                                    default: p(() => [
                                                      m(
                                                        "span",
                                                        ze,
                                                        " 拼多多：" +
                                                          w(
                                                            k(I).filter(
                                                              (e) =>
                                                                "拼多多" === e.platformType &&
                                                                (e.loginStatus === T.value ||
                                                                  null === T.value),
                                                            ).length,
                                                          ),
                                                        1,
                                                      ),
                                                    ]),
                                                    _: 1,
                                                  },
                                                ),
                                                c(
                                                  l,
                                                  { name: "抖店" },
                                                  {
                                                    default: p(() => [
                                                      m(
                                                        "span",
                                                        $e,
                                                        " 抖店：" +
                                                          w(
                                                            k(I).filter(
                                                              (e) =>
                                                                "抖店" === e.platformType &&
                                                                (e.loginStatus === T.value ||
                                                                  null === T.value),
                                                            ).length,
                                                          ),
                                                        1,
                                                      ),
                                                    ]),
                                                    _: 1,
                                                  },
                                                ),
                                              ]),
                                              _: 1,
                                            },
                                            8,
                                            ["value"],
                                          ),
                                        ]),
                                      ]),
                                      m("div", Ee, [
                                        m("div", null, [
                                          m("div", Re, [
                                            O.value ? (v(), S(r, { key: 0 })) : _("", !0),
                                          ]),
                                          k(I).length || O.value
                                            ? _("", !0)
                                            : (v(), S(i, { key: 0, description: "店铺数据为空" })),
                                          (v(!0),
                                          u(
                                            N,
                                            null,
                                            j(
                                              k(I),
                                              (e, o) => (
                                                v(),
                                                S(
                                                  H,
                                                  {
                                                    key: e.id,
                                                    placement: "right",
                                                    trigger: "hover",
                                                    disabled: e.loginStatus,
                                                  },
                                                  {
                                                    trigger: p(() => [
                                                      C(
                                                        c(
                                                          q,
                                                          {
                                                            id: `shop-${e.id}`,
                                                            class: L([
                                                              "cursor-pointer",
                                                              [
                                                                o ? "mt-[16px]" : "",
                                                                k(d) === e.id
                                                                  ? "!border-green-500"
                                                                  : "",
                                                              ],
                                                             ]),
                                                             size: "small",
                                                             hoverable: "",
                                                             draggable: !0,
                                                             onPointerdown: KhaiShopOnPointerDown,
                                                             onDragstart: KhaiShopOnDragStart,
                                                             onDragover: KhaiShopOnDragOver,
                                                             onDrop: KhaiShopOnDrop,
                                                             onClick: (o) => D(e.id),
                                                             onContextmenu: (o) => {
                                                              return (
                                                                (a = o),
                                                                (t = e),
                                                                (te.value = !1),
                                                                a.preventDefault(),
                                                                t.isManuallyAdd
                                                                  ? ((Qe.value[0].disabled = !1),
                                                                    (Qe.value[1].disabled = !0))
                                                                  : ((Qe.value[0].disabled = !0),
                                                                    (Qe.value[1].disabled = !1)),
                                                                (Le.value = t),
                                                                void f().then(() => {
                                                                  ((te.value = !0),
                                                                    (se.value = a.clientX),
                                                                    (Ce.value = a.clientY));
                                                                })
                                                              );
                                                              var a, t;
                                                            },
                                                          },
                                                          {
                                                            default: p(() => [
                                                              m(
                                                                "i",
                                                                {
                                                                  class: L([
                                                                    "absolute top-2 left-2 w-[6px] h-[6px] rounded-full block",
                                                                    e.loginStatus
                                                                      ? "bg-green-500"
                                                                      : "bg-red-500",
                                                                  ]),
                                                                },
                                                                null,
                                                                2,
                                                              ),
                                                              c(
                                                                g,
                                                                { align: "center" },
                                                                {
                                                                  default: p(() => [
                                                                    m("div", De, [
                                                                      m("div", Oe, [
                                                                        c(
                                                                          h,
                                                                          {
                                                                            "object-fit": "contain",
                                                                            size: 30,
                                                                            round: "",
                                                                            src:
                                                                              e.shopLogo ||
                                                                              e.platformLogo,
                                                                          },
                                                                          null,
                                                                          8,
                                                                          ["src"],
                                                                        ),
                                                                        e.shopLogo
                                                                          ? (v(),
                                                                            S(
                                                                              h,
                                                                              {
                                                                                key: 0,
                                                                                class:
                                                                                  "absolute -bottom-1 -right-2",
                                                                                "object-fit":
                                                                                  "contain",
                                                                                size: 14,
                                                                                round: "",
                                                                                src: e.platformLogo,
                                                                              },
                                                                              null,
                                                                              8,
                                                                              ["src"],
                                                                            ))
                                                                          : _("", !0),
                                                                      ]),
                                                                    ]),
                                                                    m("div", Fe, [
                                                                      m("p", qe, w(e.shopName), 1),
                                                                      C(
                                                                        m(
                                                                          "p",
                                                                          {
                                                                            class:
                                                                              "text-gray-500 text-[11px] line-clamp-1 my-1",
                                                                          },
                                                                          " 客服：" +
                                                                            w(e.customerName),
                                                                          513,
                                                                        ),
                                                                        [[U, e.customerName]],
                                                                      ),
                                                                      e.merchantName
                                                                        ? (v(),
                                                                          u(
                                                                            "p",
                                                                            Be,
                                                                            " 商家名称：" +
                                                                              w(e.merchantName),
                                                                            1,
                                                                          ))
                                                                        : _("", !0),
                                                                    ]),
                                                                    m("div", null, [
                                                                      e.loginStatus &&
                                                                      k(A).filter(
                                                                        (o) =>
                                                                          o.shopSystemId === e.id,
                                                                      ).length
                                                                        ? (v(),
                                                                          u(
                                                                            "span",
                                                                            Ve,
                                                                            w(
                                                                              k(A).filter(
                                                                                (o) =>
                                                                                  o.shopSystemId ===
                                                                                  e.id,
                                                                              ).length,
                                                                            ) + "条待回复",
                                                                            1,
                                                                          ))
                                                                        : _("", !0),
                                                                      e.isPageLoadingCompleted
                                                                        ? _("", !0)
                                                                        : (v(),
                                                                          u(
                                                                            "span",
                                                                            He,
                                                                            "加载中...",
                                                                          )),
                                                                    ]),
                                                                  ]),
                                                                  _: 2,
                                                                },
                                                                1024,
                                                              ),
                                                            ]),
                                                            _: 2,
                                                          },
                                                          1032,
                                                          [
                                                             "id",
                                                             "class",
                                                             "onPointerdown",
                                                             "onDragstart",
                                                             "onDragover",
                                                             "onDrop",
                                                             "onClick",
                                                             "onContextmenu",
                                                          ],
                                                        ),
                                                        [
                                                          [
                                                            U,
                                                            (e.shopName.includes(M.value) ||
                                                              e.customerName.includes(M.value) ||
                                                              e.merchantName.includes(M.value)) &&
                                                              (e.loginStatus === T.value ||
                                                                null === T.value) &&
                                                              $.value === e.platformType,
                                                          ],
                                                        ],
                                                      ),
                                                    ]),
                                                    default: p(() => [
                                                      a[10] || (a[10] = x(" 店铺未登录 ", -1)),
                                                    ]),
                                                    _: 2,
                                                  },
                                                  1032,
                                                  ["disabled"],
                                                )
                                              ),
                                            ),
                                            128,
                                          )),
                                          c(
                                            X,
                                            {
                                              class: "w-full mt-3",
                                              strong: "",
                                              secondary: "",
                                              onClick: F,
                                            },
                                            {
                                              default: p(() => [
                                                ...(a[11] || (a[11] = [x(" 添加店铺 ", -1)])),
                                              ]),
                                              _: 1,
                                            },
                                          ),
                                        ]),
                                      ]),
                                    ]),
                                    _: 1,
                                  },
                                  512,
                                ),
                                c(
                                  q,
                                  { class: "absolute bottom-0 left-0 right-0 overflow-hidden" },
                                  {
                                    default: p(() => [
                                      c(
                                        g,
                                        { align: "center", wrap: !1 },
                                        {
                                          default: p(() => [
                                            a[12] ||
                                              (a[12] = m(
                                                "span",
                                                { class: "shrink-0" },
                                                "店铺加载进度：",
                                                -1,
                                              )),
                                            c(
                                              G,
                                              {
                                                class: "w-full",
                                                type: "line",
                                                percentage: R.value,
                                                "indicator-placement": "inside",
                                                processing: R.value < 100,
                                              },
                                              null,
                                              8,
                                              ["percentage", "processing"],
                                            ),
                                          ]),
                                          _: 1,
                                        },
                                      ),
                                    ]),
                                    _: 1,
                                  },
                                ),
                              ]),
                              _: 1,
                            },
                          ),
                          c(
                            pe,
                            { "has-sider": "", "sider-placement": "right" },
                            {
                              default: p(() => [
                                c(ce, null, {
                                  default: p(() => [
                                    m("div", Xe, [
                                      (v(!0),
                                      u(
                                        N,
                                        null,
                                        j(k(I), (e, t) =>
                                          C(
                                            (v(),
                                            u("div", { key: t, class: "h-full flex flex-col" }, [
                                              e.remark
                                                ? (v(),
                                                  S(
                                                    q,
                                                    {
                                                      key: 0,
                                                      size: "small",
                                                      bordered: !1,
                                                      class: "!rounded-none",
                                                      "content-class": "!p-0 flex items-center",
                                                    },
                                                    {
                                                      default: p(() => [
                                                        c(
                                                          oe,
                                                          {
                                                            type: "info",
                                                            class: "w-full !rounded-none",
                                                            bordered: !1,
                                                          },
                                                          {
                                                            header: p(() => [
                                                              m("div", Je, [
                                                                m(
                                                                  "span",
                                                                  Ye,
                                                                  w(
                                                                    E.value[t]
                                                                      ? "备忘录"
                                                                      : e.remark,
                                                                  ),
                                                                  1,
                                                                ),
                                                                c(
                                                                  Z,
                                                                  {
                                                                    value: E.value[t],
                                                                    "onUpdate:value": (e) =>
                                                                      (E.value[t] = e),
                                                                    class: "ml-auto shrink-0",
                                                                  },
                                                                  {
                                                                    checked: p(() => [
                                                                      ...(a[13] ||
                                                                        (a[13] = [
                                                                          x(" 展开 ", -1),
                                                                        ])),
                                                                    ]),
                                                                    unchecked: p(() => [
                                                                      ...(a[14] ||
                                                                        (a[14] = [
                                                                          x(" 折叠 ", -1),
                                                                        ])),
                                                                    ]),
                                                                    _: 1,
                                                                  },
                                                                  8,
                                                                  ["value", "onUpdate:value"],
                                                                ),
                                                              ]),
                                                            ]),
                                                            default: p(() => [
                                                              c(
                                                                ee,
                                                                {
                                                                  show: E.value[t],
                                                                  "onUpdate:show": (e) =>
                                                                    (E.value[t] = e),
                                                                },
                                                                {
                                                                  default: p(() => [
                                                                    m("p", Ge, w(e.remark), 1),
                                                                  ]),
                                                                  _: 2,
                                                                },
                                                                1032,
                                                                ["show", "onUpdate:show"],
                                                              ),
                                                            ]),
                                                            _: 2,
                                                          },
                                                          1024,
                                                        ),
                                                      ]),
                                                      _: 2,
                                                    },
                                                    1024,
                                                  ))
                                                : _("", !0),
                                              c(
                                                le,
                                                {
                                                  ref_for: !0,
                                                  ref: (a) => {
                                                    o.value[e.id] = a;
                                                  },
                                                  partition: `persist:${e.id}`,
                                                  src: e.homeUrl,
                                                  "data-shop-id": e.id,
                                                  preload: e.homePreload,
                                                  class: "w-full flex-1",
                                                  allowpopups: "",
                                                  webpreferences:
                                                    "nativeWindowOpen=true,contextmenu=true",
                                                },
                                                null,
                                                8,
                                                ["partition", "src", "data-shop-id", "preload"],
                                              ),
                                            ])),
                                            [[U, e.id === k(d)]],
                                          ),
                                        ),
                                        128,
                                      )),
                                    ]),
                                  ]),
                                  _: 1,
                                }),
                              ]),
                              _: 1,
                            },
                          ),
                        ]),
                        _: 1,
                      },
                    ),
                  ]),
                  _: 1,
                }),
                c(
                  Ze,
                  {
                    placement: "bottom-start",
                    trigger: "manual",
                    x: se.value,
                    y: Ce.value,
                    options: Qe.value,
                    show: te.value,
                    "on-clickoutside": We,
                    onSelect: Ue,
                  },
                  null,
                  8,
                  ["x", "y", "options", "show"],
                ),
                c(
                  ae,
                  {
                    modelValue: Ke.value,
                    "onUpdate:modelValue": a[6] || (a[6] = (e) => (Ke.value = e)),
                  },
                  null,
                  8,
                  ["modelValue"],
                ),
                c(Ie, { onClickFloatMenu: a[7] || (a[7] = (e) => (Ke.value = !0)) }),
              ],
              64,
            )
          );
        };
      },
    }),
    [["__scopeId", "data-v-3a33d542"]],
  );
export { Qe as default };
