var e = Object.defineProperty,
  s = (s, t, a) =>
    ((s, t, a) =>
      t in s ? e(s, t, { enumerable: !0, configurable: !0, writable: !0, value: a }) : (s[t] = a))(
      s,
      "symbol" != typeof t ? t + "" : t,
      a,
    );
import {
  j as t,
  k as a,
  c as o,
  r as l,
  w as n,
  z as i,
  d as r,
  Z as m,
  _ as u,
  U as d,
  S as p,
  h as c,
  E as g,
  a0 as v,
  V as h,
  F as y,
  a4 as f,
  R as I,
  B as S,
  D as b,
  X as T,
  x as A,
} from "./vendor-DHo7BzsC.js";
import {
  x as w,
  G as R,
  t as L,
  D as x,
  bb as k,
  aU as B,
  v as H,
  g as M,
  f as _,
  e as C,
  b1 as z,
  i as D,
  u as j,
  B as F,
  V as N,
  a0 as E,
} from "./index-Ct5UuHQN.js";
import { r as $ } from "./replyMsgDB-CYty2_re.js";
import { w as O, k as U, d as V, p as P } from "./wx-CIJpY1kB.js";
import { x as q, t as J } from "./小红书-jZwggzOL.js";
import { k as Y, l as Q, i as K } from "./newAi-BxbCXy2V.js";
import { u as W } from "./use-compitable-BbI6cQbC.js";
import { b as X, _ as G } from "./Tabs-D6a5U_fy.js";
import { _ as Z } from "./Badge-CoCZ1ULG.js";
import { N as ee } from "./Icon-BkVA54F2.js";
import { _ as se } from "./Tooltip-DYS7RCZ0.js";
import { _ as te } from "./Flex-BpAU42l_.js";
import { _ as ae } from "./Avatar-DGwaOewp.js";
import { N as oe } from "./Ellipsis-B_bopKoR.js";
import { _ as le } from "./Tag-DD6D_Gyq.js";
import { _ as ne } from "./VirtualList-DR2OI88f.js";
import { _ as ie } from "./Dropdown-De4FdQJF.js";
import "./Add-DB3n_hTA.js";
import "./cssr-fugg8Rje.js";
import "./use-merged-state-mPE1JA5r.js";
import "./attribute-Cap6sGiE.js";
import "./format-length-l2rsThpR.js";
import "./Popover-Z03uJL-I.js";
import "./get-BluUyD2c.js";
import "./get-slot-BjAOOWF7.js";
import "./utils-CPcGhtGy.js";
import "./VirtualList-CHeV0Vz3.js";
import "./create-D0sloWoF.js";
const re = w("text", "\n transition: color .3s var(--n-bezier);\n color: var(--n-text-color);\n", [
    R("strong", "\n font-weight: var(--n-font-weight-strong);\n "),
    R("italic", { fontStyle: "italic" }),
    R("underline", { textDecoration: "underline" }),
    R(
      "code",
      "\n line-height: 1.4;\n display: inline-block;\n font-family: var(--n-font-famliy-mono);\n transition: \n color .3s var(--n-bezier),\n border-color .3s var(--n-bezier),\n background-color .3s var(--n-bezier);\n box-sizing: border-box;\n padding: .05em .35em 0 .35em;\n border-radius: var(--n-code-border-radius);\n font-size: .9em;\n color: var(--n-code-text-color);\n background-color: var(--n-code-color);\n border: var(--n-code-border);\n ",
    ),
  ]),
  me = t({
    name: "Text",
    props: Object.assign(Object.assign({}, x.props), {
      code: Boolean,
      type: { type: String, default: "default" },
      delete: Boolean,
      strong: Boolean,
      italic: Boolean,
      underline: Boolean,
      depth: [String, Number],
      tag: String,
      as: { type: String, validator: () => !0, default: void 0 },
    }),
    setup(e) {
      const { mergedClsPrefixRef: s, inlineThemeDisabled: t } = L(e),
        a = x("Typography", "-text", re, k, e, s),
        l = o(() => {
          const { depth: s, type: t } = e,
            o =
              "default" === t
                ? void 0 === s
                  ? "textColor"
                  : `textColor${s}Depth`
                : B("textColor", t),
            {
              common: { fontWeightStrong: l, fontFamilyMono: n, cubicBezierEaseInOut: i },
              self: { codeTextColor: r, codeBorderRadius: m, codeColor: u, codeBorder: d, [o]: p },
            } = a.value;
          return {
            "--n-bezier": i,
            "--n-text-color": p,
            "--n-font-weight-strong": l,
            "--n-font-famliy-mono": n,
            "--n-code-border-radius": m,
            "--n-code-text-color": r,
            "--n-code-color": u,
            "--n-code-border": d,
          };
        }),
        n = t
          ? H(
              "text",
              o(() => `${e.type[0]}${e.depth || ""}`),
              l,
              e,
            )
          : void 0;
      return {
        mergedClsPrefix: s,
        compitableTag: W(e, ["as", "tag"]),
        cssVars: t ? void 0 : l,
        themeClass: null == n ? void 0 : n.themeClass,
        onRender: null == n ? void 0 : n.onRender,
      };
    },
    render() {
      var e, s, t;
      const { mergedClsPrefix: o } = this;
      null === (e = this.onRender) || void 0 === e || e.call(this);
      const l = [
          `${o}-text`,
          this.themeClass,
          {
            [`${o}-text--code`]: this.code,
            [`${o}-text--delete`]: this.delete,
            [`${o}-text--strong`]: this.strong,
            [`${o}-text--italic`]: this.italic,
            [`${o}-text--underline`]: this.underline,
          },
        ],
        n = null === (t = (s = this.$slots).default) || void 0 === t ? void 0 : t.call(s);
      return this.code
        ? a("code", { class: l, style: this.cssVars }, this.delete ? a("del", null, n) : n)
        : this.delete
          ? a("del", { class: l, style: this.cssVars }, n)
          : a(this.compitableTag || "span", { class: l, style: this.cssVars }, n);
    },
  }),
  ue =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAKCAYAAACXDi8zAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACUSURBVHgBbY+9EQIhEIVvmRtiS7CEK8EObMEISK1AKMGIgQRbsAJL0FKMYQDfBsycN/cC/t7j293Je38KIdymjQR0xm5jjOnPkFI6Ivr03i/4aYdBvKSUDqWUF8wFV6e1tjQSbOac3zgea61XMe0IdbtYozjNjRhj7rThW/Adh2dweYYFnT2UUm7g5tbaE8zv+pH1A1Z+QzctkMSzAAAAAElFTkSuQmCC",
  de = "" + new URL("countdown_180S-yEF_jrnt.wav", import.meta.url).href,
  pe = "" + new URL("countdown_20S-ALBv_igB.wav", import.meta.url).href;
const ce = new (class {
    constructor() {
      s(this, "processingMap", new Map());
    }
    startProcessing(e, s) {
      if (!e) return;
      const t = {
        messageId: e,
        shopId: s,
        triggeredAt: Date.now(),
        updatedAt: Date.now(),
        status: "processing",
      };
      this.processingMap.set(e, t);
    }
    completeProcessing(e) {
      if (!e) return;
      const s = this.processingMap.get(e);
      s &&
        ((s.status = "completed"),
        (s.completedAt = Date.now()),
        (s.updatedAt = s.completedAt),
        this.processingMap.set(e, s));
    }
    isProcessing(e) {
      if (!e) return !1;
      const s = this.processingMap.get(e);
      return "processing" === (null == s ? void 0 : s.status);
    }
    isRecentlyCompleted(e, s = 3e4) {
      if (!e) return !1;
      const t = this.processingMap.get(e);
      return !(!t || "completed" !== t.status || !t.completedAt) && Date.now() - t.completedAt <= s;
    }
    isTimedOut(e, s = 3e4) {
      if (!e) return !1;
      const t = this.processingMap.get(e);
      if (!t) return !1;
      return Date.now() - t.triggeredAt > s;
    }
    resetIfTimedOut(e, s = 3e4) {
      return (
        !!e &&
        !(!this.isProcessing(e) || !this.isTimedOut(e, s)) &&
        (this.processingMap.delete(e), !0)
      );
    }
    cleanup(e = 3e5) {
      const s = Date.now();
      this.processingMap.forEach((t, a) => {
        s - t.updatedAt > e && this.processingMap.delete(a);
      });
    }
    getProcessingCount() {
      return this.processingMap.size;
    }
    getState(e) {
      return this.processingMap.get(e);
    }
  })(),
  ge = { class: "message-notification-container" },
  ve = { class: "header-card" },
  he = { class: "status-tabs-container" },
  ye = { class: "custom-tabs" },
  fe = { class: "sort-button-container" },
  Ie = { key: 0, viewBox: "0 0 24 24" },
  Se = { key: 1, viewBox: "0 0 24 24" },
  be = { class: "platform-tabs-container" },
  Te = { class: "message-list-container" },
  Ae = ["onContextmenu"],
  we = { class: "message-content" },
  Re = ["onContextmenu"],
  Le = { class: "message-content" },
  xe = t({
    __name: "index",
    setup(e) {
      const s = l(Math.floor(Date.now() / 1e3));
      let t = [];
      const a = setInterval(() => {
        ce.cleanup();
      }, 6e4);
      let w = null,
        R = !1,
        L = null;
      const x = l([]),
        k = l("all"),
        B = l("all"),
        H = l([]),
        W = l({}),
        re = (e) => 5 === (null == e ? void 0 : e.messageType),
        xe = o(() => H.value.filter((e) => !re(e))),
        ke = l("desc"),
        Be = o(() => {
          const e = He.value,
            s = {
              拼多多: e.filter((e) => "拼多多" === e.platformType).length,
              抖店: e.filter((e) => "抖店" === e.platformType).length,
              快手: e.filter((e) => "快手" === e.platformType).length,
              淘工厂: e.filter((e) => "淘工厂" === e.platformType).length,
              视频号: e.filter((e) => "视频号" === e.platformType).length,
              小红书: e.filter((e) => "小红书" === e.platformType).length,
            };
          return [
            { key: "all", label: "全部", count: e.length },
            { key: "拼多多", label: "拼多多", count: s["拼多多"] },
            { key: "抖店", label: "抖店飞鸽", count: s["抖店"] },
            { key: "快手", label: "快手小店", count: s["快手"] },
            { key: "淘工厂", label: "淘工厂", count: s["淘工厂"] },
            { key: "视频号", label: "视频号", count: s["视频号"] },
            { key: "小红书", label: "小红书", count: s["小红书"] },
          ];
        }),
        He = o(() => {
          let e;
          switch (B.value) {
            case "noTimeout":
              e = x.value.filter((e) => !e.isTimeout);
              break;
            case "timeout":
              e = x.value.filter((e) => e.isTimeout);
              break;
            case "aiReplied":
              e = xe.value;
              break;
            default:
              e = x.value;
          }
          return e;
        }),
        Me = o(() => {
          let e = He.value;
          return "all" !== k.value ? e.filter((e) => e.platformType === k.value) : e;
        }),
        _e = M(),
        Ce = _(),
        ze = C(),
        De = z(),
        je = [],
        Fe = (e, s) => {
          (D.on(e, s), je.push({ channel: e, listener: s }));
        },
        Ne = () => {
          (je.forEach(({ channel: e, listener: s }) => {
            D.removeListener(e, s);
          }),
            (je.length = 0));
        };
      const KH_MESSAGE_SIZE_KEY = "khai-message-window-size",
        KH_MESSAGE_MIN_WIDTH = 320,
        KH_MESSAGE_MAX_WIDTH = 680,
        KH_MESSAGE_MIN_HEIGHT = 260,
        KH_MESSAGE_MAX_HEIGHT = 900,
        KH_MESSAGE_DEFAULT_WIDTH = 340,
        KH_MESSAGE_DEFAULT_HEIGHT = 590,
        KH_MESSAGE_CLAMP = (e, s, t) => Math.min(Math.max(Number(e) || s, s), t),
        KH_MESSAGE_READ_SIZE = () => {
          try {
            return JSON.parse(localStorage.getItem(KH_MESSAGE_SIZE_KEY) || "{}");
          } catch {
            return {};
          }
        },
        KH_MESSAGE_SAVE_SIZE = (e) => {
          localStorage.setItem(KH_MESSAGE_SIZE_KEY, JSON.stringify(e));
        },
        KH_MESSAGE_APPLY_SIZE = (e) => {
          const s = {
            width: KH_MESSAGE_CLAMP(e.width, KH_MESSAGE_DEFAULT_WIDTH, KH_MESSAGE_MAX_WIDTH),
            height: KH_MESSAGE_CLAMP(e.height, KH_MESSAGE_DEFAULT_HEIGHT, KH_MESSAGE_MAX_HEIGHT),
          };
          return D.postMessage("resize-message-window", s), s;
        },
        KH_MESSAGE_AUTO_SIZE = () => {
          const e = KH_MESSAGE_READ_SIZE();
          if (e.manual) return KH_MESSAGE_APPLY_SIZE(e);
          const s = Math.max(1, Me.value.length || x.value.length || xe.value.length || 1),
            t = KH_MESSAGE_CLAMP(176 + Math.min(s, 8) * 58, 320, 720);
          return KH_MESSAGE_APPLY_SIZE({ width: e.width || KH_MESSAGE_DEFAULT_WIDTH, height: t });
        },
        KH_MESSAGE_ENSURE_RESIZER = () => {
          A(() => {
            const e = document.querySelector(".message-notification-container");
            if (!e) return;
            if (!document.getElementById("khai-message-window-resize-style")) {
              const s = document.createElement("style");
              ((s.id = "khai-message-window-resize-style"),
                (s.textContent =
                  ".khai-message-window-resize-handle{position:absolute;right:8px;bottom:8px;width:22px;height:22px;border-radius:6px;cursor:nwse-resize;z-index:2147483647;background:rgba(37,99,235,.9);box-shadow:0 2px 8px rgba(37,99,235,.32);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;line-height:1;user-select:none;-webkit-app-region:no-drag}.khai-message-window-resize-handle:before{content:'↘'}"));
              document.head.appendChild(s);
            }
            let s = document.getElementById("khai-message-window-resize-handle");
            s ||
              ((s = document.createElement("div")),
              (s.id = "khai-message-window-resize-handle"),
              (s.className = "khai-message-window-resize-handle"),
              (s.title = "拖动调整消息通知大小，双击恢复自动"),
              s.addEventListener("dblclick", (e) => {
                e.preventDefault(), localStorage.removeItem(KH_MESSAGE_SIZE_KEY), KH_MESSAGE_AUTO_SIZE();
              }),
              s.addEventListener("mousedown", (e) => {
                e.preventDefault();
                const s = e.clientX,
                  t = e.clientY,
                  a = window.innerWidth,
                  o = window.innerHeight,
                  l = (e) => {
                    const l = KH_MESSAGE_APPLY_SIZE({
                      width: a + e.clientX - s,
                      height: o + e.clientY - t,
                    });
                    KH_MESSAGE_SAVE_SIZE({ ...l, manual: !0 });
                  },
                  n = () => {
                    ((document.body.style.cursor = ""),
                      document.body.classList.remove("khai-message-window-resizing"),
                      window.removeEventListener("mousemove", l, !0),
                      window.removeEventListener("mouseup", n, !0));
                  };
                ((document.body.style.cursor = "nwse-resize"),
                  document.body.classList.add("khai-message-window-resizing"),
                  window.addEventListener("mousemove", l, !0),
                  window.addEventListener("mouseup", n, !0));
              }));
            s.parentElement !== e && e.appendChild(s);
          });
        };
      function Ee(e, t) {
        const a = s.value,
          o = e.timeout - a;
        if (!e.timeout || e.isTimeout) return "已超时";
        if (!(null == e ? void 0 : e.messageType)) {
          switch ((Zs(e), o)) {
            case 20:
              js(20);
              break;
            case 180:
              js(180);
          }
          o <= 0 &&
            (x.value.forEach((e) => {
              e.countDown = o <= 0;
            }),
            x.value.sort((e, s) => {
              const t = (e) => ("非工作时间留言" === e.countDown ? 2 : e.isTimeout ? 1 : 0),
                a = t(e),
                o = t(s);
              return a !== o ? a - o : (e.timeout ?? 0) - (s.timeout ?? 0);
            }));
        }
        return (
          o <= 0 &&
            H.value.sort((e, s) => {
              if (e.isAiToHuman && !s.isAiToHuman) return -1;
              if (!e.isAiToHuman && s.isAiToHuman) return 1;
              const t = Oe(e),
                a = Oe(s);
              return t !== a
                ? t - a
                : "asc" === ke.value
                  ? (e.timeout ?? 0) - (s.timeout ?? 0)
                  : (s.timeout ?? 0) - (e.timeout ?? 0);
            }),
          o <= 0 ? "已超时" : `${o}秒后超时`
        );
      }
      const $e = async (e) => {
        var s;
        if (e && 0 !== e.length && e[0])
          try {
            let t = [],
              a = [];
            for (const o of e) {
              const e = x.value.find((e) => {
                  const s = o.messageId && o.userId == e.messageId,
                    t = o.userId && o.userId && o.userId == e.userId,
                    a = o.messageId && o.messageId == e.messageId,
                    l = "快手" == o.platformType && o.username == e.username;
                  return s || t || a || l;
                }),
                l = _e.aiToHumanReplyList[o.shopSystemId] || [];
              if (
                (l.some((e) => e.messageId == o.messageId)
                  ? (o.isAiToHuman =
                      null == (s = l.find((e) => e.messageId == o.messageId))
                        ? void 0
                        : s.isAiToHuman)
                  : (o.isAiToHuman = !1),
                e)
              ) {
                (!e.type && o.type && (e.type = o.type),
                  !e.userId && o.userId && (e.userId = o.userId));
                const s = e.content !== o.content;
                if (
                  s &&
                  (("code" !== o.type && "code" === e.type) ||
                    ((e.content = o.content),
                    j.log.info(
                      `信息窗口更新消息${o.username}-店铺:${o.shopName}-内容:${o.content}`,
                    )),
                  o.isAiToHuman && (e.isAiToHuman = o.isAiToHuman),
                  o.isTimeout ||
                    "已超时" === o.countDown ||
                    ("非工作时间留言" === o.content && "拼多多" === o.platformType))
                ) {
                  const t = new Date().getHours() <= 9,
                    a = "拼多多" === o.platformType;
                  s && a && t
                    ? ((e.timeout = Math.floor(Date.now() / 1e3) + 180), (e.isTimeout = !1))
                    : (e.timeout = o.timeout);
                }
              } else
                (t.push(o),
                  o.timeNote && !o.countDown && (o.countDown = o.timeNote),
                  Pe(o),
                  o && "code" == o.type && a.push(o),
                  j.log.info(
                    `信息窗口添加新消息${o.username}-店铺:${o.shopName}-内容:${o.content}`,
                  ));
            }
            if (t.length > 0) {
              let e = t.map((e) => JSON.stringify(e) + "最终接收消息");
              (D.postMessage("reported-message-list", e),
                1 !== t.length || t[0].isTimeout || js(180));
            }
            (qe(), We());
          } catch (t) {}
      };
      function Oe(e) {
        return "非工作时间留言" === e.countDown ? 2 : e.isTimeout ? 1 : 0;
      }
      function Ue(e, s) {
        const t = Oe(e),
          a = Oe(s);
        return t !== a ? t - a : (e.timeout ?? 0) - (s.timeout ?? 0);
      }
      function Ve(e) {
        return 1e13 * Oe(e) + (e.timeout ?? 0);
      }
      function Pe(e) {
        let s = x.value;
        const t = Ve(e);
        let a = s.length;
        for (let o = 0; o < s.length; o++)
          if (Ve(s[o]) > t) {
            a = o;
            break;
          }
        s.splice(a, 0, e);
      }
      const qe = () => {
          let e = !1;
          const t = Math.floor(Date.now() / 1e3);
          ((s.value = t),
            x.value.length || xe.value.length
              ? (x.value.forEach((s) => {
                  if (!s.timeout) return void (s.countDown = s.timeNote);
                  const a = s.timeout - t,
                    o = a <= 0,
                    l = o ? "已超时" : `${a}秒后超时`;
                  (null != s._lastRemaining &&
                    (s._lastRemaining > 180 && a <= 180 && js(180),
                    s._lastRemaining > 20 && a <= 20 && js(20)),
                    (s._lastRemaining = a),
                    Zs(s),
                    s.isTimeout !== o && (e = !0),
                    (s.countDown = l),
                    (s.isTimeout = o));
                }),
                H.value.forEach((e) => {
                  if (!e.timeout) return;
                  const s = e.timeout - t;
                  ((e.isTimeout = s <= 0), (e.countDown = e.isTimeout ? "已超时" : `${s}秒后超时`));
                }),
                e && x.value.sort(Ue),
                H.value.sort((e, s) =>
                  e.isAiToHuman && !s.isAiToHuman
                    ? -1
                    : !e.isAiToHuman && s.isAiToHuman
                      ? 1
                      : "asc" === ke.value
                        ? (e.timeout ?? 0) - (s.timeout ?? 0)
                        : (s.timeout ?? 0) - (e.timeout ?? 0),
                ))
              : Qe());
        },
        Je = () => {
          L ||
            (L = setInterval(() => {
              s.value = Math.floor(Date.now() / 1e3);
            }, 1e3));
        },
        Ye = ((e = 3, s = 3e3) => {
          const t = [];
          return {
            canExecute() {
              const a = Date.now();
              for (; t.length > 0 && a - t[0] > s; ) t.shift();
              return !(t.length >= e) && (t.push(a), !0);
            },
            getRemainingCalls() {
              const a = Date.now();
              for (; t.length > 0 && a - t[0] > s; ) t.shift();
              return Math.max(0, e - t.length);
            },
          };
        })(3, 3e3),
        Qe = () => {
          L && (clearInterval(L), (L = null));
        },
        Ke = l(!1),
        We = () => {
          A(() => {
            const e = x.value.length + xe.value.length > 0;
            e !== Ke.value &&
              (D.postMessage("toggle-message-window", { platform: "all", show: e }),
              (Ke.value = e));
          });
        };
      (n(
        () => x.value.length + xe.value.length,
        (e) => {
          if ((KH_MESSAGE_AUTO_SIZE(), e > 0 ? Je() : Qe(), (e > 0 && !Ke.value) || (0 === e && Ke.value))) {
            const s = e > 0;
            (D.postMessage("toggle-message-window", { platform: "all", show: s }), (Ke.value = s));
          }
        },
      ),
        i(() => {
          (Qe(),
            a && clearInterval(a),
            w && (clearInterval(w), (w = null)),
            Ne(),
            (x.value = []),
            (H.value = []),
            Ke.value &&
              (D.postMessage("toggle-message-window", { platform: "all", show: !1 }),
              (Ke.value = !1)));
        }),
        r(async () => {
          (KH_MESSAGE_ENSURE_RESIZER(), KH_MESSAGE_AUTO_SIZE(), Je(), D.send("register-message-window"));
          const e = await D.invoke("get-config-sync-snapshot");
          ((null == e ? void 0 : e.bottomLineReply) &&
            (Ce.bottomLineReply = { ...Ce.bottomLineReply, ...e.bottomLineReply }),
            (null == e ? void 0 : e.globalAiReplyConfig) &&
              (Ce.aiReplyConfig = { ...Ce.aiReplyConfig, ...e.globalAiReplyConfig }),
            (null == e ? void 0 : e.singleShopAiReplyConfig) &&
              (_e.singleShopAiReplyConfig = {
                ..._e.singleShopAiReplyConfig,
                ...e.singleShopAiReplyConfig,
              }),
            (null == e ? void 0 : e.singleShopBottomLineReplyList) &&
              (_e.singleShopBottomLineReplyList = {
                ..._e.singleShopBottomLineReplyList,
                ...e.singleShopBottomLineReplyList,
              }),
            (W.value = await D.invoke("get-user-info")),
            ze.setToken(W.value.token),
            ls(),
            await (async () => {
              const e = await E();
              _e.shopList = e.map((e) => ({ ...e, policeBkstop: Boolean(e.policeBkstop) }));
            })(),
            await Ze(!0),
            await Xe(!1),
            w && (clearInterval(w), (w = null)),
            (w = setInterval(() => {
              Xe(!1);
            }, 3e4)),
            st());
        }));
      const Xe = async (e) => {
        if (!R) {
          R = !0;
          try {
            ((H.value = []), await Ze(!1, e));
            const [s, a] = await Promise.allSettled([
                Y({ messageType: 3, status: 0, userId: W.value.userId, isfilter: 1 }),
                Y({ messageType: 4, status: 0, userId: W.value.userId, isfilter: 1 }),
              ]),
              o = "fulfilled" === s.status ? s.value : [],
              l = "fulfilled" === a.status ? a.value : [];
            if (
              ((null == o ? void 0 : o.length) && H.value.push(...Ge(o)),
              (null == l ? void 0 : l.length) && H.value.push(...Ge(l)),
              null == t ? void 0 : t.length)
            ) {
              const e = t;
              ((t = []), Q(e).then((e) => {}));
            }
            const n = new Map();
            for (const e of H.value) {
              const s = e.messageId + "_" + e.shopSystemId;
              n.has(s) || n.set(s, e);
            }
            ((H.value = Array.from(n.values())), $.setListData(tt(H.value)));
          } finally {
            R = !1;
          }
        }
      };
      function Ge(e) {
        return (
          (t = e.map((e) => ({ id: e.id, status: 1 }))),
          e.map((e) => {
            let s = "";
            if (e.aimessage && e.aiMessage.startsWith("{") && e.aiMessage.endsWith("}")) {
              s = JSON.parse(e.aiMessage).output;
            } else s = e.aiMessage;
            return {
              shopSystemId: Number(e.shopId),
              messageId: e.checkUserId,
              username: e.checkUser,
              avatar: null == e ? void 0 : e.avatar,
              content: s,
              time: e.createTime,
              platformType: es(e.platformType),
              timeout: ss(e.createTime),
              shopName: e.shopName,
            };
          })
        );
      }
      const Ze = async (e = !0, s) => {
          e && (H.value = []);
          const t = await $.getAll();
          if (t) {
            if (s && s.length > 0) {
              const e = new Set();
              t.forEach((t) => {
                s.includes(t.shopSystemId) || e.add(t.shopSystemId);
              });
              for (const s of e) await $.deleteAllByShopId(s);
            }
            t.forEach((e) => {
              if (s && s.length > 0 && !s.includes(e.shopSystemId)) return;
              const t = H.value.findIndex(
                (s) => s.messageId === e.messageId && s.shopSystemId === e.shopSystemId,
              );
              -1 !== t ? (H.value[t] = e) : H.value.push(e);
            });
          }
        },
        es = (e) => {
          switch (e) {
            case "4":
            default:
              return "拼多多";
            case "5":
              return "抖店";
            case "6":
              return "快手";
            case "11":
              return "淘工厂";
            case "8":
              return "视频号";
          }
        },
        ss = (e) => {
          const s = new Date(e);
          return Math.floor(s.getTime() / 1e3) + 100;
        },
        ts = (e, s) => {
          const { messagelist: t, shopId: a } = s;
          ((_e.aiToHumanReplyList[a] = t),
            x.value.forEach((e) => {
              const s =
                null == t
                  ? void 0
                  : t.find((s) => e.messageId === s.messageId && e.shopSystemId === s.shopSystemId);
              s && (e.isAiToHuman = s.isAiToHuman);
            }));
        },
        as = (e, s) => {
          if (s.shopSystemId && s.messageId) {
            const e = s.messageId + "_" + s.shopSystemId;
            $.delete(e);
          }
        },
        os = (e, s) => {
          Ce.settings.volume = s;
        },
        ls = () => {
          (Ne(),
            Fe("select-first-all-message", hs),
            Fe("select-first-pdd-message", vs),
            Fe("select-first-douyin-message", ys),
            Fe("select-first-kuaishou-message", fs),
            Fe("select-first-tgc-message", Is),
            Fe("select-first-wx-message", Ss),
            Fe("set-shop-disable-status", Gs),
            Fe("get-customer-message-list", ns),
            Fe("get-customer-message", ms),
            Fe("update-customer-message", us),
            Fe("clear-shop-message", ds),
            Fe("clear-all-message", ps),
            Fe("reply-customer-message", gs),
            Fe("set-ai-reply", cs),
            Fe("set-ai-to-human-reply-message", ts),
            Fe("get-ai-replied-message", Ts),
            Fe("get-ai-replied-message-api", As),
            Fe("clear-ai-replied-message", ws),
            Fe("clear-ai-replied-message_by_shopId", Rs),
            Fe("sync-ai-replied-message-remove-message", Ls),
            Fe("sync-ai-replied-message-clear", xs),
            Fe("open-ai-first-reply-message", ks),
            Fe("delete-ai-first-reply-message", Bs),
            Fe("update-message-status", as),
            Fe("change-volume", os),
            Fe("set-theme", bs),
            Fe("set-bottom-line-reply-global", Hs),
            Fe("set-single-shop-bottom-line-reply-status", Ms),
            Fe("update-bottom-line-reply-frequency", _s),
            Fe("reported-messagelist", et),
            Fe("synchronize-list-data", (e, s) => {
              Xe(s);
            }),
            Fe("setBottomLineReplyTimeRangeStart", is),
            Fe("setBottomLineReplyTimeRangeEnd", rs),
            Fe("send-cmd-get-aimessage-for-message", st));
        },
        ns = (e, s) => {
          if ("string" == typeof s) {
            const e = JSON.parse(s);
            $e(e);
          } else $e(s);
        },
        is = (e, s) => {
          Ce.bottomLineReplyTimeRange.start = s;
        },
        rs = (e, s) => {
          Ce.bottomLineReplyTimeRange.end = s;
        },
        ms = (e, s) => {
          if ("string" == typeof s) {
            const e = JSON.parse(s);
            $e([e]);
          } else $e([s]);
        },
        us = (e, s) => {
          if ("string" == typeof s) {
            const e = JSON.parse(s);
            $e([e]);
          } else $e([s]);
        },
        ds = async (e, s) => {
          x.value = x.value.filter((e) => e.shopSystemId !== s);
          await $.deleteAllByShopId(s);
        },
        ps = () => {
          const e = H.value.length;
          ((x.value = []), (H.value = []), $.clear(), e > 0 && D.send("sync-ai-replied-message-clear"), We());
        },
        cs = (e, s) => {
          const { messageId: t, isAiToHuman: a, shopId: o } = s;
          _e.aiToHumanReplyList[o] || (_e.aiToHumanReplyList[o] = []);
          const l = _e.aiToHumanReplyList[o].findIndex((e) => e.messageId === t);
          -1 === l
            ? _e.aiToHumanReplyList[o].push({ messageId: s.messageId, isAiToHuman: !0 })
            : (_e.aiToHumanReplyList[o][l].isAiToHuman = a);
          const n = x.value.find((e) => e.shopSystemId === o && e.messageId === t);
          n && (n.isAiToHuman = a);
        },
        gs = (e, s) => {
          const t = x.value.find(
            (e) =>
              e.shopSystemId === s.shopSystemId &&
              (e.messageId === s.messageId || e.userId == s.userId || e.userId === s.messageId),
          );
          ((s.content = null == t ? void 0 : t.content),
            D.postMessage("reported-replymessage-list", JSON.stringify(s) + "message"));
          const a = x.value.findIndex((e) => {
            if (e.shopSystemId !== s.shopSystemId) return !1;
            const t = s.messageId && e.userId == s.messageId,
              a = s.userId && e.userId && e.userId == s.userId,
              o = s.messageId && e.messageId == s.messageId,
              l =
                "快手" == s.platformType &&
                (null == e ? void 0 : e.username) == (null == s ? void 0 : s.username);
            return t || a || o || l;
          });
          if ((-1 != a && x.value.splice(a, 1), !s.compensate)) {
            let e = null;
            const t = H.value.findIndex((t) => {
              if (t.shopSystemId !== s.shopSystemId) return !1;
              const a = s.messageId && t.userId == s.messageId,
                o = s.userId && t.userId && t.userId == s.userId,
                l = s.messageId && t.messageId == s.messageId,
                n =
                  "快手" == s.platformType &&
                  (null == t ? void 0 : t.username) == (null == s ? void 0 : s.username);
              return ((a || o || l || n) && (e = t.DBId), a || o || l || n);
            });
            (-1 != t &&
              (qs(s.messageId, s.shopSystemId),
              H.value.splice(t, 1),
              $.delete(e || at(s.shopSystemId, s.messageId))),
              zs(s.messageId, s.shopSystemId));
          }
          We();
        },
        vs = () => {
          Ns("拼多多");
        },
        hs = () => {
          Ns("全部信息");
        },
        ys = () => {
          Ns("抖店");
        },
        fs = () => {
          Ns("快手");
        },
        Is = () => {
          Ns("淘工厂");
        },
        Ss = () => {
          Ns("视频号");
        },
        bs = (e, s) => {
          Ce.changeTheme(s);
        },
        Ts = (e, s) => {
          (Cs(s.messageId), D.postMessage("get-end-dd-message", JSON.stringify(s) + "DD"));
          const t = H.value.findIndex(
            (e) => e.messageId == s.messageId && e.shopSystemId == s.shopSystemId,
          );
          ((s.DBId = at(s.shopSystemId, s.messageId)),
            (s.messageType = 3),
            -1 !== t
              ? ((H.value[t].content = s.content),
                (H.value[t].shopSystemId = s.shopSystemId),
                (H.value[t].shopName = s.shopName),
                (H.value[t].platformLogo = s.platformLogo),
                (H.value[t].platformType = s.platformType),
                (H.value[t].messageId = s.messageId),
                s.username && (H.value[t].username = s.username),
                (H.value[t].isAiToHuman = s.isAiToHuman),
                $.set(tt(H.value[t])))
              : ((s.timeout = Math.floor(Date.now() / 1e3) + 100), H.value.push(s)),
            $.set(tt(s)),
            ce.completeProcessing(s.messageId),
            gs(e, {
              messageId: s.messageId,
              shopSystemId: s.shopSystemId,
              compensate: !0,
              userId: s.userId,
              platformType: s.platformType,
            }));
        },
        As = (e, s) => {
          (D.postMessage("get-end-dd-message", JSON.stringify(s) + "AI"),
            j.log.info(`获得ai已回复消息${s.messageId}-店铺:${s.shopSystemId}-内容:${s.content}`));
          if (!(!1 !== (null == s ? void 0 : s.shouldShowModal)))
            return void gs(e, {
              messageId: s.messageId,
              shopSystemId: s.shopSystemId,
              compensate: !0,
              userId: s.userId,
              platformType: s.platformType,
            });
          s.messageType = 4;
          const t = H.value.findIndex(
            (e) => e.messageId == s.messageId && e.shopSystemId == s.shopSystemId,
          );
          (-1 !== t
            ? ((H.value[t].content = s.content),
              (H.value[t].messageId = s.messageId),
              s.username && (H.value[t].username = s.username),
              (H.value[t].shopSystemId = s.shopSystemId),
              (H.value[t].shopName = s.shopName),
              (H.value[t].platformLogo = s.platformLogo),
              (H.value[t].platformType = s.platformType),
              (H.value[t].isAiToHuman = s.isAiToHuman),
              (H.value[t].messageType = s.messageType),
              s.shopSystemId &&
                s.messageId &&
                ((H.value[t].DBId = at(s.shopSystemId, s.messageId)), $.set(tt(H.value[t]))))
            : ((s.timeout = Math.floor(Date.now() / 1e3) + 100),
              H.value.push(s),
              s.shopSystemId &&
                s.messageId &&
                ((s.DBId = at(s.shopSystemId, s.messageId)), $.set(s))),
            gs(e, {
              messageId: s.messageId,
              shopSystemId: s.shopSystemId,
              compensate: !0,
              userId: s.userId,
              platformType: s.platformType,
            }));
        },
        ws = () => {
          const e = H.value.map((e) => e.shopSystemId);
          (K({ shopIds: e, status: 1 }),
            H.value.forEach((e) => {
              e.isBottomLineAutoReply && zs(e.messageId, e.shopSystemId);
            }),
            (H.value = []),
            $.clear(),
            D.send("sync-ai-replied-message-clear"),
            We());
        },
        Rs = (e, s) => {
          K({ shopIds: [s], status: 1 });
          (H.value
            .filter((e) => e.shopSystemId === s && e.isBottomLineAutoReply)
            .forEach((e) => {
              zs(e.messageId, e.shopSystemId);
            }),
            (H.value = H.value.filter((e) => e.shopSystemId !== s)),
            $.deleteAllByShopId(s),
            D.send("sync-ai-replied-message-clear", s),
            We());
        },
        Ls = (e, s) => {
          (null == s ? void 0 : s.messageId) &&
            (null == s ? void 0 : s.shopSystemId) &&
            ((H.value = H.value.filter(
              (e) => e.messageId !== s.messageId || e.shopSystemId !== s.shopSystemId,
            )),
            $.deleteByMessageIdAndShopId(s.shopSystemId, s.messageId),
            We());
        },
        xs = (e, s) => {
          ("number" == typeof s
            ? ((H.value = H.value.filter((e) => e.shopSystemId !== s)), $.deleteAllByShopId(s))
            : ((H.value = []), $.clear()),
            We());
        },
        ks = () => {
          if (H.value.length) {
            const e = H.value.find((e) => re(e)) || H.value[0];
            (D.send("click-customer-message", {
              messageId: e.messageId,
              shopSystemId: e.shopSystemId,
              userId: null == e ? void 0 : e.userId,
              username: e.username,
              avatar: e.avatar || "",
              type: "ai",
            }),
              re(e) || Qs("aiReplied"));
          }
        },
        Bs = () => {
          if (!Ye.canExecute())
            return void De.warning("操作过于频繁，请认真过滤机器回复信息！3秒内最多执行3次操作");
          const e = H.value[0];
          e &&
            (qs(e.messageId, e.shopSystemId),
            e.isBottomLineAutoReply && zs(e.messageId, e.shopSystemId),
            (H.value = H.value.slice(1)),
            D.send("sync-ai-replied-message-remove", {
              messageId: e.messageId,
              shopSystemId: e.shopSystemId,
            }));
        },
        Hs = (e, s) => {
          Ce.bottomLineReply = { ...Ce.bottomLineReply, ...s };
        },
        Ms = (e, s) => {
          _e.singleShopBottomLineReplyList[s.shopId] = s.config;
        },
        _s = (e, s) => {},
        Cs = (e) => {
          var s;
          const t = Ce.bottomLineReplyFrequency[e] || 0;
          t < ((null == (s = Ce.bottomLineReply.content) ? void 0 : s.length) || 0) &&
            (Ce.bottomLineReplyFrequency = { ...Ce.bottomLineReplyFrequency, [e]: t + 1 });
        },
        zs = (e, s) => {
          var t, a;
          const o = Ce.bottomLineReplyFrequency[e] || 0,
            l = void 0 !== s ? _e.singleShopBottomLineReplyList[s] : void 0;
          if (
            o >=
            (void 0 !== s && _e.isSingleShopBottomLineEnabled(s) && l
              ? (null == (t = l.content) ? void 0 : t.length) || 0
              : (null == (a = Ce.bottomLineReply.content) ? void 0 : a.length) || 0)
          ) {
            const s = { ...Ce.bottomLineReplyFrequency };
            (delete s[e], (Ce.bottomLineReplyFrequency = s));
          }
        };
      let Ds = !1;
      const js = (e) => {
          if (Ds) return;
          Ds = !0;
          const s = new Audio();
          switch (((s.volume = Ce.settings.volume ? Ce.settings.volume / 100 : 0), e)) {
            case 180:
              s.src = de;
              break;
            case 20:
              s.src = pe;
          }
          ((s.onended = () => {
            ((Ds = !1), s.load());
          }),
            s.play());
        },
        Fs = (e) => {
          "aiReplied" === B.value
            ? D.postMessage("click-customer-message", {
                messageId: e.messageId,
                shopSystemId: e.shopSystemId,
                userId: e.userId,
                username: e.username,
                avatar: e.avatar || "",
                type: "ai",
              })
            : D.postMessage("click-customer-message", {
                messageId: e.messageId,
                shopSystemId: e.shopSystemId,
                username: e.username,
                userId: e.userId,
                avatar: e.avatar || "",
              });
        },
        Ns = (e) => {
          ((k.value = "all"), (B.value = "all"));
          let s = [];
          if (
            ("全部信息" === e
              ? ((s = x.value), 0 === s.length && (s = H.value))
              : ((s = x.value.filter((s) => s.platformType === e)),
                0 === s.length &&
                  ((s = H.value.filter((s) => s.platformType === e)),
                  s.length > 0 && s.some((e) => !re(e)) && (B.value = "aiReplied"))),
            0 === s.length)
          )
            return;
          let t = s[0];
          (j.log.info("信息窗口接收到信息跳转"),
            D.postMessage("click-customer-message", {
              messageId: t.messageId,
              shopSystemId: t.shopSystemId,
              userId: t.userId,
              username: t.username,
              avatar: (null == t ? void 0 : t.avatar) || "",
            }));
        },
        Es = l(!1),
        $s = l(0),
        Os = l(0),
        Us = l(),
        Vs = (e, s) => {
          ((Es.value = !1),
            e.preventDefault(),
            (Us.value = s),
            A().then(() => {
              ((Es.value = !0), ($s.value = e.clientX), (Os.value = e.clientY));
            }));
        },
        KH_MESSAGE_CLEAR_ONE = (e) => {
          var s;
          if (!e || e.messageId === void 0 || e.shopSystemId === void 0) return;
          const t = e.messageId, a = e.shopSystemId, o = (e) => e.messageId !== t || e.shopSystemId !== a, l = H.value.length, n = x.value.length;
          ((H.value = H.value.filter(o)),
            (x.value = x.value.filter(o)),
            qs(t, a),
            e.isBottomLineAutoReply && zs(t, a),
            l !== H.value.length &&
              D.send("sync-ai-replied-message-remove", {
                messageId: t,
                shopSystemId: a,
              }),
            n !== x.value.length &&
              D.postMessage("delete-message", {
                messageId: t,
                shopSystemId: a,
                userId: null == (s = e) ? void 0 : s.userId,
              }),
            We());
        },
        Ps = async (e) => {
          var s;
          if ("ai-to-human" === e) {
            if (Us.value) {
              const e = Us.value.shopSystemId,
                s = Us.value.messageId;
              _e.aiToHumanReplyList[e] || (_e.aiToHumanReplyList[e] = []);
              const t = _e.aiToHumanReplyList[e].findIndex((e) => e.messageId === s);
              let a = !1;
              -1 === t
                ? ((a = !0),
                  _e.aiToHumanReplyList[e].push({ messageId: s, isAiToHuman: !0 }),
                  D.send("set-ai-to-human-reply-message", { messageId: s, shopId: e, type: "add" }))
                : (D.send("set-ai-to-human-reply-message", {
                    messageId: _e.aiToHumanReplyList[e][t].messageId,
                    shopId: e,
                    type: "del",
                  }),
                  _e.aiToHumanReplyList[e].splice(t, 1));
              for (const o of H.value)
                if (o.messageId === s && o.shopSystemId === e) {
                  o.isAiToHuman = a;
                  break;
                }
              for (const o of x.value)
                if (o.messageId === s && o.shopSystemId === e) {
                  o.isAiToHuman = a;
                  break;
                }
            }
          } else "clear-all" === e ? ps() : "delete" === e && void 0 !== Us.value && KH_MESSAGE_CLEAR_ONE(Us.value);
          Es.value = !1;
        },
        qs = (e, s) => {
          if (s && e) {
            const t = at(s, e);
            $.delete(t);
          }
        },
        Js = () => {
          ((Us.value = void 0), (Es.value = !1));
        },
        Ys = o(() => (Us.value && Us.value.isAiToHuman ? "恢复接待" : "暂停接待")),
        Qs = (e) => {
          B.value = e;
        },
        Ks = () => {
          ((ke.value = "asc" === ke.value ? "desc" : "asc"), qe());
        },
        Ws = (e) => {
          switch (e) {
            case "拼多多":
              return P;
            case "抖店":
              return V;
            case "快手":
              return U;
            case "淘工厂":
              return J;
            case "视频号":
              return O;
            case "小红书":
              return q;
          }
        },
        Xs = (e) => {
          var s;
          return (
            !0 === (null == (s = _e.shopList.find((s) => s.id === e)) ? void 0 : s.policeBkstop)
          );
        },
        Gs = (e, s) => {
          if (!(null == s ? void 0 : s.shopId)) return;
          const t = _e.shopList.find((e) => e.id === s.shopId);
          t && (t.policeBkstop = Boolean(s.policeBkstop));
        },
        Zs = (e) => {
          if (!e.timeout) return;
          if (ce.isProcessing(e.messageId) && !ce.resetIfTimedOut(e.messageId)) return;
          const s = Math.floor(Date.now() / 1e3),
            t = e.timeout - s,
            a = e.shopSystemId,
            o = _e.isSingleShopBottomLineEnabled(a);
          if (Ce.bottomLineReply.status && !o && !Xs(a)) {
            const s = Ce.bottomLineReplyFrequency[e.messageId] || 0,
              o = Ce.bottomLineReply.content.length,
              l = new Date(),
              n = 60 * l.getHours() + l.getMinutes(),
              [i, r] = Ce.bottomLineReplyTimeRange.start.split(":").map(Number),
              [m, u] = Ce.bottomLineReplyTimeRange.end.split(":").map(Number),
              d = n >= 60 * i + r && n < 60 * m + u;
            if (t <= Ce.bottomLineReply.time && s < o && d)
              return (
                ce.startProcessing(e.messageId, a),
                (e.isBottomLineAutoReply = !0),
                (e.replyContent = Ce.bottomLineReply.content[s]),
                void D.postMessage(
                  "trigger-bottom-line-reply",
                  j.deepClone({
                    type: "global",
                    message: e,
                    config: Ce.bottomLineReply,
                    shopId: a,
                    currentFrequency: s,
                  }),
                )
              );
          }
          const l = _e.singleShopBottomLineReplyList[a];
          if (_e.isSingleShopBottomLineEnabled(a) && !Xs(a)) {
            const s = l.content.length,
              o = Ce.bottomLineReplyFrequency[e.messageId] ?? 0,
              n = new Date(),
              i = 60 * n.getHours() + n.getMinutes(),
              [r, m] = Ce.bottomLineReplyTimeRange.start.split(":").map(Number),
              [u, d] = Ce.bottomLineReplyTimeRange.end.split(":").map(Number),
              p = i >= 60 * r + m && i < 60 * u + d;
            t <= l.time &&
              o < s &&
              p &&
              (ce.startProcessing(e.messageId, a),
              (e.isBottomLineAutoReply = !0),
              (e.replyContent = l.content[o]),
              D.send(
                "trigger-bottom-line-reply",
                j.deepClone({
                  type: "single",
                  message: e,
                  config: l,
                  shopId: a,
                  currentFrequency: o,
                }),
              ));
          }
        },
        et = async (e, s) => {
          if (s && s.length > 0) {
            const e = H.value
              .filter((e) => s.includes(e.shopSystemId))
              .map((e) => ({
                message: e.content,
                shopId: e.shopSystemId,
                aiMessage: e.content,
                messageType: (null == e ? void 0 : e.messageType) || 3,
                checkUser: e.username,
                checkUserId: e.messageId,
                avatar: null == e ? void 0 : e.avatar,
              }));
            (H.value
              .filter((e) => s.includes(e.shopSystemId))
              .forEach((e) => {
                e.isBottomLineAutoReply && zs(e.messageId, e.shopSystemId);
              }),
              (H.value = H.value.filter((e) => !s.includes(e.shopSystemId))));
            for (const t of s) await $.deleteAllByShopId(t);
            (await $.setListData(tt(H.value)), e.length > 0 && (await Q(e)));
          } else {
            await $.setListData(tt(H.value));
            const e = await $.getAll();
            if (e && e.length > 0) {
              const s = e.map((e) => ({
                message: e.content,
                shopId: e.shopSystemId,
                aiMessage: e.content,
                messageType: (null == e ? void 0 : e.messageType) || 3,
                checkUser: e.username,
                checkUserId: e.messageId,
                avatar: null == e ? void 0 : e.avatar,
              }));
              await Q(s);
            }
          }
        },
        st = () => {
          D.postMessage("get-aimessage-for-message", j.deepClone(H.value));
        };
      function tt(e) {
        return JSON.parse(JSON.stringify(e));
      }
      function at(e, s) {
        return `${e}_${s}`;
      }
      return (
        D.on("send-cmd-get-aimessage-for-message", (e, s) => {
          st();
        }),
        (e, s) => {
          const t = me,
            a = Z,
            o = ee,
            l = F,
            n = se,
            i = X,
            r = G,
            A = ae,
            w = oe,
            R = le,
            L = te,
            H = N,
            M = ne,
            _ = ie;
          return (
            h(),
            m(
              y,
              null,
              [
                  u("div", ge, [
                    u("div", ve, [
                      d(
                        t,
                        { class: "platform-title", strong: "" },
                        { default: p(() => [...(s[5] || (s[5] = [c(" 消息通知", -1)]))]), _: 1 },
                      ),
                    ]),
                  u("div", he, [
                    u("div", ye, [
                      u(
                        "div",
                        {
                          class: g(["tab-item", { active: "all" === B.value }]),
                          onClick: s[0] || (s[0] = (e) => Qs("all")),
                        },
                        [
                          d(
                            a,
                            {
                              class: "badge",
                              value: x.value.length,
                              max: 999,
                              color: "#FF2F2F",
                              size: "tiny",
                            },
                            {
                              default: p(() => [
                                ...(s[6] ||
                                  (s[6] = [u("span", { class: "tab-text" }, "全部消息", -1)])),
                              ]),
                              _: 1,
                            },
                            8,
                            ["value"],
                          ),
                        ],
                        2,
                      ),
                      u(
                        "div",
                        {
                          class: g(["tab-item", { active: "noTimeout" === B.value }]),
                          onClick: s[1] || (s[1] = (e) => Qs("noTimeout")),
                        },
                        [
                          d(
                            a,
                            {
                              class: "badge",
                              value: x.value.filter((e) => !e.isTimeout).length,
                              max: 999,
                              color: "#FF2F2F",
                              size: "tiny",
                            },
                            {
                              default: p(() => [
                                ...(s[7] ||
                                  (s[7] = [u("span", { class: "tab-text" }, "未超时", -1)])),
                              ]),
                              _: 1,
                            },
                            8,
                            ["value"],
                          ),
                        ],
                        2,
                      ),
                      u(
                        "div",
                        {
                          class: g(["tab-item", { active: "timeout" === B.value }]),
                          onClick: s[2] || (s[2] = (e) => Qs("timeout")),
                        },
                        [
                          d(
                            a,
                            {
                              class: "badge",
                              value: x.value.filter((e) => e.isTimeout).length,
                              max: 999,
                              color: "#FF2F2F",
                              size: "tiny",
                            },
                            {
                              default: p(() => [
                                ...(s[8] ||
                                  (s[8] = [u("span", { class: "tab-text" }, "已超时", -1)])),
                              ]),
                              _: 1,
                            },
                            8,
                            ["value"],
                          ),
                        ],
                        2,
                      ),
                      u(
                        "div",
                        {
                          class: g(["tab-item", { active: "aiReplied" === B.value }]),
                          onClick: s[3] || (s[3] = (e) => Qs("aiReplied")),
                        },
                        [
                          d(
                            a,
                            {
                              class: "badge",
                              value: xe.value.length,
                              max: 999,
                              color: "#FF2F2F",
                              size: "tiny",
                            },
                            {
                              default: p(() => [
                                ...(s[9] ||
                                  (s[9] = [u("span", { class: "tab-text" }, "AI已回复", -1)])),
                              ]),
                              _: 1,
                            },
                            8,
                            ["value"],
                          ),
                        ],
                        2,
                      ),
                    ]),
                    u("div", fe, [
                      d(
                        n,
                        { trigger: "hover" },
                        {
                          trigger: p(() => [
                            d(
                              l,
                              { size: "small", quaternary: "", circle: "", onClick: Ks },
                              {
                                icon: p(() => [
                                  d(
                                    o,
                                    { size: "18" },
                                    {
                                      default: p(() => [
                                        "asc" === ke.value
                                          ? (h(),
                                            m("svg", Ie, [
                                              ...(s[10] ||
                                                (s[10] = [
                                                  u(
                                                    "path",
                                                    {
                                                      fill: "currentColor",
                                                      d: "M4 17h2.5l-3.5 3.5-3.5-3.5H2V4h2v13zm7-13h10v2H11V4zm0 14h7v2h-7v-2zm0-6h8.5v2H11v-2zm0-3h9.5v2H11V9z",
                                                    },
                                                    null,
                                                    -1,
                                                  ),
                                                ])),
                                            ]))
                                          : (h(),
                                            m("svg", Se, [
                                              ...(s[11] ||
                                                (s[11] = [
                                                  u(
                                                    "path",
                                                    {
                                                      fill: "currentColor",
                                                      d: "M4 4h2.5L3 .5-.5 4H2v13h2V4zm7 0h10v2H11V4zm0 14h7v2h-7v-2zm0-6h8.5v2H11v-2zm0-3h9.5v2H11V9z",
                                                    },
                                                    null,
                                                    -1,
                                                  ),
                                                ])),
                                            ])),
                                      ]),
                                      _: 1,
                                    },
                                  ),
                                ]),
                                _: 1,
                              },
                            ),
                          ]),
                          default: p(() => [
                            c(
                              " " +
                                v(
                                  "asc" === ke.value
                                    ? "正序：旧消息在前（仅AI已回复）"
                                    : "倒序：新消息在前（仅AI已回复）",
                                ),
                              1,
                            ),
                          ]),
                          _: 1,
                        },
                      ),
                    ]),
                  ]),
                  u("div", be, [
                    d(
                      r,
                      {
                        value: k.value,
                        "onUpdate:value": s[4] || (s[4] = (e) => (k.value = e)),
                        type: "line",
                        animated: "",
                      },
                      {
                        default: p(() => [
                          (h(!0),
                          m(
                            y,
                            null,
                            f(
                              Be.value,
                              (e) => (
                                h(),
                                I(
                                  i,
                                  { key: e.key, name: e.key },
                                  {
                                    tab: p(() => [
                                      d(
                                        a,
                                        {
                                          value: e.count,
                                          max: 999,
                                          color: "#FF2F2F",
                                          size: "tiny",
                                          class: "ml-1 badge",
                                          placement: "top",
                                        },
                                        { default: p(() => [c(v(e.label), 1)]), _: 2 },
                                        1032,
                                        ["value"],
                                      ),
                                    ]),
                                    _: 2,
                                  },
                                  1032,
                                  ["name"],
                                )
                              ),
                            ),
                            128,
                          )),
                        ]),
                        _: 1,
                      },
                      8,
                      ["value"],
                    ),
                  ]),
                  u("div", Te, [
                    S(
                      d(
                        M,
                        { class: "virtual-list", "item-size": 58, items: x.value, trigger: "none" },
                        {
                          default: p(({ item: e }) => [
                            (h(),
                            m(
                              "div",
                              {
                                key: `${e.username}-${e.messageId}`,
                                class: "message-item-wrapper",
                                onContextmenu: (s) => Vs(s, e),
                              },
                              [
                                d(
                                  H,
                                  {
                                    class: g([
                                      "message-card",
                                      { "ai-to-human-card": e.isAiToHuman },
                                    ]),
                                    size: "small",
                                    hoverable: "",
                                    onClick: (s) => Fs(e),
                                  },
                                  {
                                    default: p(() => [
                                      d(
                                        L,
                                        { align: "center", size: "medium" },
                                        {
                                          default: p(() => [
                                            d(
                                              A,
                                              {
                                                src: Ws(e.platformType),
                                                round: "",
                                                size: 40,
                                                "fallback-src":
                                                  "/src/assets/image/defautAvatar.png",
                                              },
                                              null,
                                              8,
                                              ["src"],
                                            ),
                                            u("div", we, [
                                              d(
                                                L,
                                                { align: "center", size: "small", wrap: !1 },
                                                {
                                                  default: p(() => [
                                                    d(
                                                      w,
                                                      { style: { "max-width": "240px" } },
                                                      {
                                                        default: p(() => [c(v(e.username), 1)]),
                                                        _: 2,
                                                      },
                                                      1024,
                                                    ),
                                                    d(
                                                      R,
                                                      {
                                                        color: {
                                                          color: "#4171FE",
                                                          textColor: "#fff",
                                                        },
                                                        size: "tiny",
                                                        round: "",
                                                      },
                                                      {
                                                        default: p(() => [c(v(e.shopName), 1)]),
                                                        _: 2,
                                                      },
                                                      1024,
                                                    ),
                                                  ]),
                                                  _: 2,
                                                },
                                                1024,
                                              ),
                                              d(
                                                w,
                                                {
                                                  class: "message-text",
                                                  "line-clamp": 1,
                                                  tooltip: { placement: "top" },
                                                },
                                                {
                                                  default: p(() => [
                                                    e.isAiToHuman
                                                      ? (h(),
                                                        I(
                                                          R,
                                                          {
                                                            key: 0,
                                                            bordered: !1,
                                                            type: "error",
                                                            size: "tiny",
                                                            round: "",
                                                          },
                                                          {
                                                            default: p(() => [
                                                              ...(s[12] ||
                                                                (s[12] = [c(" 人工 ", -1)])),
                                                            ]),
                                                            _: 1,
                                                          },
                                                        ))
                                                      : T("", !0),
                                                    c(" " + v(e.content), 1),
                                                  ]),
                                                  _: 2,
                                                },
                                                1024,
                                              ),
                                            ]),
                                            d(
                                              L,
                                              {
                                                align: "center",
                                                size: "small",
                                                style: { position: "relative", top: "-15px" },
                                              },
                                              {
                                                default: p(() => [
                                                  (null == e ? void 0 : e.timeout)
                                                    ? (h(),
                                                      I(
                                                        R,
                                                        {
                                                          key: 0,
                                                          type: e.isTimeout ? "error" : "warning",
                                                          size: "small",
                                                          round: "",
                                                        },
                                                        {
                                                          default: p(() => [c(v(Ee(e)), 1)]),
                                                          _: 2,
                                                        },
                                                        1032,
                                                        ["type"],
                                                      ))
                                                    : T("", !0),
                                                  s[13] ||
                                                    (s[13] = u(
                                                      "img",
                                                      { src: ue, alt: "" },
                                                      null,
                                                      -1,
                                                    )),
                                                ]),
                                                _: 2,
                                              },
                                              1024,
                                            ),
                                          ]),
                                          _: 2,
                                        },
                                        1024,
                                      ),
                                    ]),
                                    _: 2,
                                  },
                                  1032,
                                  ["class", "onClick"],
                                ),
                              ],
                              40,
                              Ae,
                            )),
                          ]),
                          _: 1,
                        },
                        8,
                        ["items"],
                      ),
                      [[b, !1]],
                    ),
                    d(
                      M,
                      { class: "virtual-list", "item-size": 58, items: Me.value, trigger: "none" },
                      {
                        default: p(({ item: e }) => [
                          (h(),
                          m(
                            "div",
                            {
                              key: `${e.username}-${e.messageId}`,
                              class: "message-item-wrapper",
                              onContextmenu: (s) => Vs(s, e),
                            },
                            [
                              d(
                                H,
                                {
                                  class: g(["message-card", { "ai-to-human-card": e.isAiToHuman }]),
                                  size: "small",
                                  hoverable: "",
                                  onClick: (s) => Fs(e),
                                },
                                {
                                  default: p(() => [
                                    d(
                                      L,
                                      { align: "center", size: "medium" },
                                      {
                                        default: p(() => [
                                          d(
                                            A,
                                            {
                                              src: Ws(e.platformType),
                                              round: "",
                                              size: 40,
                                              "fallback-src": "/src/assets/image/defautAvatar.png",
                                            },
                                            null,
                                            8,
                                            ["src"],
                                          ),
                                          u("div", Le, [
                                            d(
                                              L,
                                              { align: "center", size: "small", wrap: !1 },
                                              {
                                                default: p(() => [
                                                  d(
                                                    w,
                                                    { style: { "max-width": "240px" } },
                                                    {
                                                      default: p(() => [c(v(e.username), 1)]),
                                                      _: 2,
                                                    },
                                                    1024,
                                                  ),
                                                  d(
                                                    R,
                                                    {
                                                      color: {
                                                        color: "#4171FE",
                                                        textColor: "#fff",
                                                      },
                                                      size: "tiny",
                                                      round: "",
                                                    },
                                                    {
                                                      default: p(() => [c(v(e.shopName), 1)]),
                                                      _: 2,
                                                    },
                                                    1024,
                                                  ),
                                                ]),
                                                _: 2,
                                              },
                                              1024,
                                            ),
                                            d(
                                              w,
                                              {
                                                class: "message-text",
                                                "line-clamp": 1,
                                                tooltip: { placement: "top" },
                                              },
                                              {
                                                default: p(() => [
                                                  e.isAiToHuman
                                                    ? (h(),
                                                      I(
                                                        R,
                                                        {
                                                          key: 0,
                                                          bordered: !1,
                                                          type: "error",
                                                          size: "tiny",
                                                          round: "",
                                                        },
                                                        {
                                                          default: p(() => [
                                                            ...(s[14] ||
                                                              (s[14] = [c(" 人工 ", -1)])),
                                                          ]),
                                                          _: 1,
                                                        },
                                                      ))
                                                    : T("", !0),
                                                  c(" " + v(e.content), 1),
                                                ]),
                                                _: 2,
                                              },
                                              1024,
                                            ),
                                          ]),
                                          d(
                                            L,
                                            {
                                              align: "center",
                                              size: "small",
                                              style: { position: "relative", top: "-15px" },
                                            },
                                            {
                                              default: p(() => [
                                                (null == e ? void 0 : e.timeout)
                                                  ? (h(),
                                                    I(
                                                      R,
                                                      {
                                                        key: 0,
                                                        type: e.isTimeout ? "error" : "warning",
                                                        size: "small",
                                                        round: "",
                                                      },
                                                      { default: p(() => [c(v(Ee(e)), 1)]), _: 2 },
                                                      1032,
                                                      ["type"],
                                                    ))
                                                  : T("", !0),
                                                s[15] ||
                                                  (s[15] = u(
                                                    "img",
                                                    { src: ue, alt: "" },
                                                    null,
                                                    -1,
                                                  )),
                                              ]),
                                              _: 2,
                                            },
                                            1024,
                                          ),
                                        ]),
                                        _: 2,
                                      },
                                      1024,
                                    ),
                                  ]),
                                  _: 2,
                                },
                                1032,
                                ["class", "onClick"],
                              ),
                            ],
                            40,
                            Re,
                          )),
                        ]),
                        _: 1,
                      },
                      8,
                      ["items"],
                    ),
                  ]),
                ]),
                d(
                  _,
                  {
                    placement: "bottom-start",
                    trigger: "manual",
                    x: $s.value,
                    y: Os.value,
                    options: [
                      { label: "清理当前信息", key: "delete" },
                      { label: "一键清理全部", key: "clear-all" },
                      { label: Ys.value, key: "ai-to-human" },
                    ],
                    show: Es.value,
                    "on-clickoutside": Js,
                    onSelect: Ps,
                  },
                  null,
                  8,
                  ["x", "y", "options", "show"],
                ),
              ],
              64,
            )
          );
        }
      );
    },
  });
export { xe as default };
