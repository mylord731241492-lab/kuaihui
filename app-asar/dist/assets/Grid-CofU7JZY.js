import {
  c as e,
  r as t,
  b as r,
  D as n,
  j as o,
  B as i,
  k as s,
  q as a,
  v as l,
  i as d,
  n as c,
  w as u,
  p as h,
  t as p,
  g as f,
  d as v,
  A as m,
} from "./vendor-DHo7BzsC.js";
import {
  bC as b,
  bD as g,
  au as w,
  t as y,
  S,
  aM as $,
  bE as x,
  bF as C,
  bG as z,
  bH as R,
  bI as E,
  z as k,
  bd as B,
  x as O,
  G as D,
  y as M,
  bJ as N,
  bK as F,
  bL as P,
  aR as A,
  D as j,
  bM as T,
  bN as H,
  v as G,
  bO as _,
  F as L,
  br as I,
  J as U,
  o as W,
  bA as X,
  bt as Y,
  P as q,
  L as J,
  bs as Q,
} from "./index-Ct5UuHQN.js";
import { u as V } from "./use-merged-state-mPE1JA5r.js";
import { f as K } from "./format-length-l2rsThpR.js";
import { g as Z } from "./get-slot-BjAOOWF7.js";
import { b as ee } from "./Popover-Z03uJL-I.js";
function te(e, t) {
  var r;
  if (null == e) return;
  const n = (function (e) {
    if ("number" == typeof e) return { "": e.toString() };
    const t = {};
    return (
      e.split(/ +/).forEach((e) => {
        if ("" === e) return;
        const [r, n] = e.split(":");
        void 0 === n ? (t[""] = r) : (t[r] = n);
      }),
      t
    );
  })(e);
  if (void 0 === t) return n[""];
  if ("string" == typeof t) return null !== (r = n[t]) && void 0 !== r ? r : n[""];
  if (Array.isArray(t)) {
    for (let e = t.length - 1; e >= 0; --e) {
      const r = t[e];
      if (r in n) return n[r];
    }
    return n[""];
  }
  {
    let e,
      r = -1;
    return (
      Object.keys(n).forEach((o) => {
        const i = Number(o);
        !Number.isNaN(i) && t >= i && i >= r && ((r = i), (e = n[o]));
      }),
      e
    );
  }
}
const re = { xs: 0, s: 640, m: 1024, l: 1280, xl: 1536, "2xl": 1920 };
const ne = {};
const oe = o({
    name: "NDrawerContent",
    inheritAttrs: !1,
    props: {
      blockScroll: Boolean,
      show: { type: Boolean, default: void 0 },
      displayDirective: { type: String, required: !0 },
      placement: { type: String, required: !0 },
      contentClass: String,
      contentStyle: [Object, String],
      nativeScrollbar: { type: Boolean, required: !0 },
      scrollbarProps: Object,
      trapFocus: { type: Boolean, default: !0 },
      autoFocus: { type: Boolean, default: !0 },
      showMask: { type: [Boolean, String], required: !0 },
      maxWidth: Number,
      maxHeight: Number,
      minWidth: Number,
      minHeight: Number,
      resizable: Boolean,
      onClickoutside: Function,
      onAfterLeave: Function,
      onAfterEnter: Function,
      onEsc: Function,
    },
    setup(o) {
      const i = t(!!o.show),
        s = t(null),
        a = d(C);
      let l = 0,
        p = "",
        f = null;
      const v = t(!1),
        m = t(!1),
        b = e(() => "top" === o.placement || "bottom" === o.placement),
        { mergedClsPrefixRef: g, mergedRtlRef: w } = y(o),
        k = S("Drawer", w, g),
        B = N,
        { doUpdateHeight: O, doUpdateWidth: D } = a;
      function M(e) {
        var t, r;
        if (m.value)
          if (b.value) {
            let r = (null === (t = s.value) || void 0 === t ? void 0 : t.offsetHeight) || 0;
            const n = l - e.clientY;
            ((r += "bottom" === o.placement ? n : -n),
              (r = ((e) => {
                const { maxHeight: t } = o;
                if (t && e > t) return t;
                const { minHeight: r } = o;
                return r && e < r ? r : e;
              })(r)),
              O(r),
              (l = e.clientY));
          } else {
            let t = (null === (r = s.value) || void 0 === r ? void 0 : r.offsetWidth) || 0;
            const n = l - e.clientX;
            ((t += "right" === o.placement ? n : -n),
              (t = ((e) => {
                const { maxWidth: t } = o;
                if (t && e > t) return t;
                const { minWidth: r } = o;
                return r && e < r ? r : e;
              })(t)),
              D(t),
              (l = e.clientX));
          }
      }
      function N() {
        m.value &&
          ((l = 0),
          (m.value = !1),
          (document.body.style.cursor = p),
          document.body.removeEventListener("mousemove", M),
          document.body.removeEventListener("mouseup", N),
          document.body.removeEventListener("mouseleave", B));
      }
      (c(() => {
        o.show && (i.value = !0);
      }),
        u(
          () => o.show,
          (e) => {
            e || N();
          },
        ),
        r(() => {
          N();
        }));
      const F = e(() => {
        const { show: e } = o,
          t = [[n, e]];
        return (o.showMask || t.push([$, o.onClickoutside, void 0, { capture: !0 }]), t);
      });
      return (
        x(e(() => o.blockScroll && i.value)),
        h(z, s),
        h(R, null),
        h(E, null),
        {
          bodyRef: s,
          rtlEnabled: k,
          mergedClsPrefix: a.mergedClsPrefixRef,
          isMounted: a.isMountedRef,
          mergedTheme: a.mergedThemeRef,
          displayed: i,
          transitionName: e(
            () =>
              ({
                right: "slide-in-from-right-transition",
                left: "slide-in-from-left-transition",
                top: "slide-in-from-top-transition",
                bottom: "slide-in-from-bottom-transition",
              })[o.placement],
          ),
          handleAfterLeave: function () {
            var e;
            ((i.value = !1), null === (e = o.onAfterLeave) || void 0 === e || e.call(o));
          },
          bodyDirectives: F,
          handleMousedownResizeTrigger: (e) => {
            ((m.value = !0),
              (l = b.value ? e.clientY : e.clientX),
              (p = document.body.style.cursor),
              (document.body.style.cursor = b.value ? "ns-resize" : "ew-resize"),
              document.body.addEventListener("mousemove", M),
              document.body.addEventListener("mouseleave", B),
              document.body.addEventListener("mouseup", N));
          },
          handleMouseenterResizeTrigger: () => {
            (null !== f && (window.clearTimeout(f), (f = null)),
              m.value
                ? (v.value = !0)
                : (f = window.setTimeout(() => {
                    v.value = !0;
                  }, 300)));
          },
          handleMouseleaveResizeTrigger: () => {
            (null !== f && (window.clearTimeout(f), (f = null)), (v.value = !1));
          },
          isDragging: m,
          isHoverOnResizeTrigger: v,
        }
      );
    },
    render() {
      const { $slots: e, mergedClsPrefix: t } = this;
      return "show" === this.displayDirective || this.displayed || this.show
        ? i(
            s(
              "div",
              { role: "none" },
              s(
                g,
                {
                  disabled: !this.showMask || !this.trapFocus,
                  active: this.show,
                  autoFocus: this.autoFocus,
                  onEsc: this.onEsc,
                },
                {
                  default: () =>
                    s(
                      a,
                      {
                        name: this.transitionName,
                        appear: this.isMounted,
                        onAfterEnter: this.onAfterEnter,
                        onAfterLeave: this.handleAfterLeave,
                      },
                      {
                        default: () =>
                          i(
                            s(
                              "div",
                              l(this.$attrs, {
                                role: "dialog",
                                ref: "bodyRef",
                                "aria-modal": "true",
                                class: [
                                  `${t}-drawer`,
                                  this.rtlEnabled && `${t}-drawer--rtl`,
                                  `${t}-drawer--${this.placement}-placement`,
                                  this.isDragging && `${t}-drawer--unselectable`,
                                  this.nativeScrollbar && `${t}-drawer--native-scrollbar`,
                                ],
                              }),
                              [
                                this.resizable
                                  ? s("div", {
                                      class: [
                                        `${t}-drawer__resize-trigger`,
                                        (this.isDragging || this.isHoverOnResizeTrigger) &&
                                          `${t}-drawer__resize-trigger--hover`,
                                      ],
                                      onMouseenter: this.handleMouseenterResizeTrigger,
                                      onMouseleave: this.handleMouseleaveResizeTrigger,
                                      onMousedown: this.handleMousedownResizeTrigger,
                                    })
                                  : null,
                                this.nativeScrollbar
                                  ? s(
                                      "div",
                                      {
                                        class: [`${t}-drawer-content-wrapper`, this.contentClass],
                                        style: this.contentStyle,
                                        role: "none",
                                      },
                                      e,
                                    )
                                  : s(
                                      w,
                                      Object.assign({}, this.scrollbarProps, {
                                        contentStyle: this.contentStyle,
                                        contentClass: [
                                          `${t}-drawer-content-wrapper`,
                                          this.contentClass,
                                        ],
                                        theme: this.mergedTheme.peers.Scrollbar,
                                        themeOverrides: this.mergedTheme.peerOverrides.Scrollbar,
                                      }),
                                      e,
                                    ),
                              ],
                            ),
                            this.bodyDirectives,
                          ),
                      },
                    ),
                },
              ),
            ),
            [[n, "if" === this.displayDirective || this.displayed || this.show]],
          )
        : null;
    },
  }),
  { cubicBezierEaseIn: ie, cubicBezierEaseOut: se } = B;
const { cubicBezierEaseIn: ae, cubicBezierEaseOut: le } = B;
const { cubicBezierEaseIn: de, cubicBezierEaseOut: ce } = B;
const { cubicBezierEaseIn: ue, cubicBezierEaseOut: he } = B;
const pe = k([
    O(
      "drawer",
      "\n word-break: break-word;\n line-height: var(--n-line-height);\n position: absolute;\n pointer-events: all;\n box-shadow: var(--n-box-shadow);\n transition:\n background-color .3s var(--n-bezier),\n color .3s var(--n-bezier);\n background-color: var(--n-color);\n color: var(--n-text-color);\n box-sizing: border-box;\n ",
      [
        (function ({
          duration: e = "0.3s",
          leaveDuration: t = "0.2s",
          name: r = "slide-in-from-right",
        } = {}) {
          return [
            k(`&.${r}-transition-leave-active`, { transition: `transform ${t} ${de}` }),
            k(`&.${r}-transition-enter-active`, { transition: `transform ${e} ${ce}` }),
            k(`&.${r}-transition-enter-to`, { transform: "translateX(0)" }),
            k(`&.${r}-transition-enter-from`, { transform: "translateX(100%)" }),
            k(`&.${r}-transition-leave-from`, { transform: "translateX(0)" }),
            k(`&.${r}-transition-leave-to`, { transform: "translateX(100%)" }),
          ];
        })(),
        (function ({
          duration: e = "0.3s",
          leaveDuration: t = "0.2s",
          name: r = "slide-in-from-left",
        } = {}) {
          return [
            k(`&.${r}-transition-leave-active`, { transition: `transform ${t} ${ae}` }),
            k(`&.${r}-transition-enter-active`, { transition: `transform ${e} ${le}` }),
            k(`&.${r}-transition-enter-to`, { transform: "translateX(0)" }),
            k(`&.${r}-transition-enter-from`, { transform: "translateX(-100%)" }),
            k(`&.${r}-transition-leave-from`, { transform: "translateX(0)" }),
            k(`&.${r}-transition-leave-to`, { transform: "translateX(-100%)" }),
          ];
        })(),
        (function ({
          duration: e = "0.3s",
          leaveDuration: t = "0.2s",
          name: r = "slide-in-from-top",
        } = {}) {
          return [
            k(`&.${r}-transition-leave-active`, { transition: `transform ${t} ${ue}` }),
            k(`&.${r}-transition-enter-active`, { transition: `transform ${e} ${he}` }),
            k(`&.${r}-transition-enter-to`, { transform: "translateY(0)" }),
            k(`&.${r}-transition-enter-from`, { transform: "translateY(-100%)" }),
            k(`&.${r}-transition-leave-from`, { transform: "translateY(0)" }),
            k(`&.${r}-transition-leave-to`, { transform: "translateY(-100%)" }),
          ];
        })(),
        (function ({
          duration: e = "0.3s",
          leaveDuration: t = "0.2s",
          name: r = "slide-in-from-bottom",
        } = {}) {
          return [
            k(`&.${r}-transition-leave-active`, { transition: `transform ${t} ${ie}` }),
            k(`&.${r}-transition-enter-active`, { transition: `transform ${e} ${se}` }),
            k(`&.${r}-transition-enter-to`, { transform: "translateY(0)" }),
            k(`&.${r}-transition-enter-from`, { transform: "translateY(100%)" }),
            k(`&.${r}-transition-leave-from`, { transform: "translateY(0)" }),
            k(`&.${r}-transition-leave-to`, { transform: "translateY(100%)" }),
          ];
        })(),
        D("unselectable", "\n user-select: none; \n -webkit-user-select: none;\n "),
        D("native-scrollbar", [
          O("drawer-content-wrapper", "\n overflow: auto;\n height: 100%;\n "),
        ]),
        M(
          "resize-trigger",
          "\n position: absolute;\n background-color: #0000;\n transition: background-color .3s var(--n-bezier);\n ",
          [D("hover", "\n background-color: var(--n-resize-trigger-color-hover);\n ")],
        ),
        O("drawer-content-wrapper", "\n box-sizing: border-box;\n "),
        O("drawer-content", "\n height: 100%;\n display: flex;\n flex-direction: column;\n ", [
          D("native-scrollbar", [
            O("drawer-body-content-wrapper", "\n height: 100%;\n overflow: auto;\n "),
          ]),
          O("drawer-body", "\n flex: 1 0 0;\n overflow: hidden;\n "),
          O(
            "drawer-body-content-wrapper",
            "\n box-sizing: border-box;\n padding: var(--n-body-padding);\n ",
          ),
          O(
            "drawer-header",
            "\n font-weight: var(--n-title-font-weight);\n line-height: 1;\n font-size: var(--n-title-font-size);\n color: var(--n-title-text-color);\n padding: var(--n-header-padding);\n transition: border .3s var(--n-bezier);\n border-bottom: 1px solid var(--n-divider-color);\n border-bottom: var(--n-header-border-bottom);\n display: flex;\n justify-content: space-between;\n align-items: center;\n ",
            [
              M("main", "\n flex: 1;\n "),
              M(
                "close",
                "\n margin-left: 6px;\n transition:\n background-color .3s var(--n-bezier),\n color .3s var(--n-bezier);\n ",
              ),
            ],
          ),
          O(
            "drawer-footer",
            "\n display: flex;\n justify-content: flex-end;\n border-top: var(--n-footer-border-top);\n transition: border .3s var(--n-bezier);\n padding: var(--n-footer-padding);\n ",
          ),
        ]),
        D(
          "right-placement",
          "\n top: 0;\n bottom: 0;\n right: 0;\n border-top-left-radius: var(--n-border-radius);\n border-bottom-left-radius: var(--n-border-radius);\n ",
          [
            M(
              "resize-trigger",
              "\n width: 3px;\n height: 100%;\n top: 0;\n left: 0;\n transform: translateX(-1.5px);\n cursor: ew-resize;\n ",
            ),
          ],
        ),
        D(
          "left-placement",
          "\n top: 0;\n bottom: 0;\n left: 0;\n border-top-right-radius: var(--n-border-radius);\n border-bottom-right-radius: var(--n-border-radius);\n ",
          [
            M(
              "resize-trigger",
              "\n width: 3px;\n height: 100%;\n top: 0;\n right: 0;\n transform: translateX(1.5px);\n cursor: ew-resize;\n ",
            ),
          ],
        ),
        D(
          "top-placement",
          "\n top: 0;\n left: 0;\n right: 0;\n border-bottom-left-radius: var(--n-border-radius);\n border-bottom-right-radius: var(--n-border-radius);\n ",
          [
            M(
              "resize-trigger",
              "\n width: 100%;\n height: 3px;\n bottom: 0;\n left: 0;\n transform: translateY(1.5px);\n cursor: ns-resize;\n ",
            ),
          ],
        ),
        D(
          "bottom-placement",
          "\n left: 0;\n bottom: 0;\n right: 0;\n border-top-left-radius: var(--n-border-radius);\n border-top-right-radius: var(--n-border-radius);\n ",
          [
            M(
              "resize-trigger",
              "\n width: 100%;\n height: 3px;\n top: 0;\n left: 0;\n transform: translateY(-1.5px);\n cursor: ns-resize;\n ",
            ),
          ],
        ),
      ],
    ),
    k("body", [k(">", [O("drawer-container", "\n position: fixed;\n ")])]),
    O(
      "drawer-container",
      "\n position: relative;\n position: absolute;\n left: 0;\n right: 0;\n top: 0;\n bottom: 0;\n pointer-events: none;\n ",
      [k("> *", "\n pointer-events: all;\n ")],
    ),
    O(
      "drawer-mask",
      "\n background-color: rgba(0, 0, 0, .3);\n position: absolute;\n left: 0;\n right: 0;\n top: 0;\n bottom: 0;\n ",
      [
        D("invisible", "\n background-color: rgba(0, 0, 0, 0)\n "),
        N({
          enterDuration: "0.2s",
          leaveDuration: "0.2s",
          enterCubicBezier: "var(--n-bezier-in)",
          leaveCubicBezier: "var(--n-bezier-out)",
        }),
      ],
    ),
  ]),
  fe = o({
    name: "Drawer",
    inheritAttrs: !1,
    props: Object.assign(Object.assign({}, j.props), {
      show: Boolean,
      width: [Number, String],
      height: [Number, String],
      placement: { type: String, default: "right" },
      maskClosable: { type: Boolean, default: !0 },
      showMask: { type: [Boolean, String], default: !0 },
      to: [String, Object],
      displayDirective: { type: String, default: "if" },
      nativeScrollbar: { type: Boolean, default: !0 },
      zIndex: Number,
      onMaskClick: Function,
      scrollbarProps: Object,
      contentClass: String,
      contentStyle: [Object, String],
      trapFocus: { type: Boolean, default: !0 },
      onEsc: Function,
      autoFocus: { type: Boolean, default: !0 },
      closeOnEsc: { type: Boolean, default: !0 },
      blockScroll: { type: Boolean, default: !0 },
      maxWidth: Number,
      maxHeight: Number,
      minWidth: Number,
      minHeight: Number,
      resizable: Boolean,
      defaultWidth: { type: [Number, String], default: 251 },
      defaultHeight: { type: [Number, String], default: 251 },
      onUpdateWidth: [Function, Array],
      onUpdateHeight: [Function, Array],
      "onUpdate:width": [Function, Array],
      "onUpdate:height": [Function, Array],
      "onUpdate:show": [Function, Array],
      onUpdateShow: [Function, Array],
      onAfterEnter: Function,
      onAfterLeave: Function,
      drawerStyle: [String, Object],
      drawerClass: String,
      target: null,
      onShow: Function,
      onHide: Function,
    }),
    setup(r) {
      const { mergedClsPrefixRef: n, namespaceRef: o, inlineThemeDisabled: i } = y(r),
        s = A(),
        a = j("Drawer", "-drawer", pe, T, r, n),
        l = t(r.defaultWidth),
        d = t(r.defaultHeight),
        c = V(p(r, "width"), l),
        u = V(p(r, "height"), d),
        f = e(() => {
          const { placement: e } = r;
          return "top" === e || "bottom" === e ? "" : K(c.value);
        }),
        v = e(() => {
          const { placement: e } = r;
          return "left" === e || "right" === e ? "" : K(u.value);
        }),
        m = e(() => [{ width: f.value, height: v.value }, r.drawerStyle || ""]);
      function b(e) {
        const { onMaskClick: t, maskClosable: n } = r;
        (n && w(!1), t && t(e));
      }
      const g = H();
      function w(e) {
        const { onHide: t, onUpdateShow: n, "onUpdate:show": o } = r;
        (n && L(n, e), o && L(o, e), t && !e && L(t, e));
      }
      h(C, {
        isMountedRef: s,
        mergedThemeRef: a,
        mergedClsPrefixRef: n,
        doUpdateShow: w,
        doUpdateHeight: (e) => {
          const { onUpdateHeight: t, "onUpdate:width": n } = r;
          (t && L(t, e), n && L(n, e), (d.value = e));
        },
        doUpdateWidth: (e) => {
          const { onUpdateWidth: t, "onUpdate:width": n } = r;
          (t && L(t, e), n && L(n, e), (l.value = e));
        },
      });
      const S = e(() => {
          const {
            common: { cubicBezierEaseInOut: e, cubicBezierEaseIn: t, cubicBezierEaseOut: r },
            self: {
              color: n,
              textColor: o,
              boxShadow: i,
              lineHeight: s,
              headerPadding: l,
              footerPadding: d,
              borderRadius: c,
              bodyPadding: u,
              titleFontSize: h,
              titleTextColor: p,
              titleFontWeight: f,
              headerBorderBottom: v,
              footerBorderTop: m,
              closeIconColor: b,
              closeIconColorHover: g,
              closeIconColorPressed: w,
              closeColorHover: y,
              closeColorPressed: S,
              closeIconSize: $,
              closeSize: x,
              closeBorderRadius: C,
              resizableTriggerColorHover: z,
            },
          } = a.value;
          return {
            "--n-line-height": s,
            "--n-color": n,
            "--n-border-radius": c,
            "--n-text-color": o,
            "--n-box-shadow": i,
            "--n-bezier": e,
            "--n-bezier-out": r,
            "--n-bezier-in": t,
            "--n-header-padding": l,
            "--n-body-padding": u,
            "--n-footer-padding": d,
            "--n-title-text-color": p,
            "--n-title-font-size": h,
            "--n-title-font-weight": f,
            "--n-header-border-bottom": v,
            "--n-footer-border-top": m,
            "--n-close-icon-color": b,
            "--n-close-icon-color-hover": g,
            "--n-close-icon-color-pressed": w,
            "--n-close-size": x,
            "--n-close-color-hover": y,
            "--n-close-color-pressed": S,
            "--n-close-icon-size": $,
            "--n-close-border-radius": C,
            "--n-resize-trigger-color-hover": z,
          };
        }),
        $ = i ? G("drawer", void 0, S, r) : void 0;
      return {
        mergedClsPrefix: n,
        namespace: o,
        mergedBodyStyle: m,
        handleOutsideClick: function (e) {
          b(e);
        },
        handleMaskClick: b,
        handleEsc: function (e) {
          var t;
          (null === (t = r.onEsc) || void 0 === t || t.call(r),
            r.show && r.closeOnEsc && _(e) && (g.value || w(!1)));
        },
        mergedTheme: a,
        cssVars: i ? void 0 : S,
        themeClass: null == $ ? void 0 : $.themeClass,
        onRender: null == $ ? void 0 : $.onRender,
        isMounted: s,
      };
    },
    render() {
      const { mergedClsPrefix: e } = this;
      return s(
        P,
        { to: this.to, show: this.show },
        {
          default: () => {
            var t;
            return (
              null === (t = this.onRender) || void 0 === t || t.call(this),
              i(
                s(
                  "div",
                  {
                    class: [`${e}-drawer-container`, this.namespace, this.themeClass],
                    style: this.cssVars,
                    role: "none",
                  },
                  this.showMask
                    ? s(
                        a,
                        { name: "fade-in-transition", appear: this.isMounted },
                        {
                          default: () =>
                            this.show
                              ? s("div", {
                                  "aria-hidden": !0,
                                  class: [
                                    `${e}-drawer-mask`,
                                    "transparent" === this.showMask &&
                                      `${e}-drawer-mask--invisible`,
                                  ],
                                  onClick: this.handleMaskClick,
                                })
                              : null,
                        },
                      )
                    : null,
                  s(
                    oe,
                    Object.assign({}, this.$attrs, {
                      class: [this.drawerClass, this.$attrs.class],
                      style: [this.mergedBodyStyle, this.$attrs.style],
                      blockScroll: this.blockScroll,
                      contentStyle: this.contentStyle,
                      contentClass: this.contentClass,
                      placement: this.placement,
                      scrollbarProps: this.scrollbarProps,
                      show: this.show,
                      displayDirective: this.displayDirective,
                      nativeScrollbar: this.nativeScrollbar,
                      onAfterEnter: this.onAfterEnter,
                      onAfterLeave: this.onAfterLeave,
                      trapFocus: this.trapFocus,
                      autoFocus: this.autoFocus,
                      resizable: this.resizable,
                      maxHeight: this.maxHeight,
                      minHeight: this.minHeight,
                      maxWidth: this.maxWidth,
                      minWidth: this.minWidth,
                      showMask: this.showMask,
                      onEsc: this.handleEsc,
                      onClickoutside: this.handleOutsideClick,
                    }),
                    this.$slots,
                  ),
                ),
                [[F, { zIndex: this.zIndex, enabled: this.show }]],
              )
            );
          },
        },
      );
    },
  }),
  ve = o({
    name: "DrawerContent",
    props: {
      title: String,
      headerClass: String,
      headerStyle: [Object, String],
      footerClass: String,
      footerStyle: [Object, String],
      bodyClass: String,
      bodyStyle: [Object, String],
      bodyContentClass: String,
      bodyContentStyle: [Object, String],
      nativeScrollbar: { type: Boolean, default: !0 },
      scrollbarProps: Object,
      closable: Boolean,
    },
    slots: Object,
    setup() {
      const e = d(C, null);
      e || U("drawer-content", "`n-drawer-content` must be placed inside `n-drawer`.");
      const { doUpdateShow: t } = e;
      return {
        handleCloseClick: function () {
          t(!1);
        },
        mergedTheme: e.mergedThemeRef,
        mergedClsPrefix: e.mergedClsPrefixRef,
      };
    },
    render() {
      const {
        title: e,
        mergedClsPrefix: t,
        nativeScrollbar: r,
        mergedTheme: n,
        bodyClass: o,
        bodyStyle: i,
        bodyContentClass: a,
        bodyContentStyle: l,
        headerClass: d,
        headerStyle: c,
        footerClass: u,
        footerStyle: h,
        scrollbarProps: p,
        closable: f,
        $slots: v,
      } = this;
      return s(
        "div",
        {
          role: "none",
          class: [`${t}-drawer-content`, r && `${t}-drawer-content--native-scrollbar`],
        },
        v.header || e || f
          ? s(
              "div",
              { class: [`${t}-drawer-header`, d], style: c, role: "none" },
              s(
                "div",
                { class: `${t}-drawer-header__main`, role: "heading", "aria-level": "1" },
                void 0 !== v.header ? v.header() : e,
              ),
              f &&
                s(I, {
                  onClick: this.handleCloseClick,
                  clsPrefix: t,
                  class: `${t}-drawer-header__close`,
                  absolute: !0,
                }),
            )
          : null,
        r
          ? s(
              "div",
              { class: [`${t}-drawer-body`, o], style: i, role: "none" },
              s(
                "div",
                { class: [`${t}-drawer-body-content-wrapper`, a], style: l, role: "none" },
                v,
              ),
            )
          : s(
              w,
              Object.assign(
                { themeOverrides: n.peerOverrides.Scrollbar, theme: n.peers.Scrollbar },
                p,
                {
                  class: `${t}-drawer-body`,
                  contentClass: [`${t}-drawer-body-content-wrapper`, a],
                  contentStyle: l,
                },
              ),
              v,
            ),
        v.footer
          ? s("div", { class: [`${t}-drawer-footer`, u], style: h, role: "none" }, v.footer())
          : null,
      );
    },
  }),
  me = W("n-grid"),
  be = 1,
  ge = o({
    __GRID_ITEM__: !0,
    name: "GridItem",
    alias: ["Gi"],
    props: {
      span: { type: [Number, String], default: be },
      offset: { type: [Number, String], default: 0 },
      suffix: Boolean,
      privateOffset: Number,
      privateSpan: Number,
      privateColStart: Number,
      privateShow: { type: Boolean, default: !0 },
    },
    setup() {
      const {
          isSsrRef: t,
          xGapRef: r,
          itemStyleRef: n,
          overflowRef: o,
          layoutShiftDisabledRef: i,
        } = d(me),
        s = f();
      return {
        overflow: o,
        itemStyle: n,
        layoutShiftDisabled: i,
        mergedXGap: e(() => X(r.value || 0)),
        deriveStyle: () => {
          t.value;
          const {
              privateSpan: e = be,
              privateShow: n = !0,
              privateColStart: o,
              privateOffset: i = 0,
            } = s.vnode.props,
            { value: a } = r,
            l = X(a || 0);
          return {
            display: n ? "" : "none",
            gridColumn: `${null != o ? o : `span ${e}`} / span ${e}`,
            marginLeft: i ? `calc((100% - (${e} - 1) * ${l}) / ${e} * ${i} + ${l} * ${i})` : "",
          };
        },
      };
    },
    render() {
      var e, t;
      if (this.layoutShiftDisabled) {
        const { span: e, offset: t, mergedXGap: r } = this;
        return s(
          "div",
          {
            style: {
              gridColumn: `span ${e} / span ${e}`,
              marginLeft: t ? `calc((100% - (${e} - 1) * ${r}) / ${e} * ${t} + ${r} * ${t})` : "",
            },
          },
          this.$slots,
        );
      }
      return s(
        "div",
        { style: [this.itemStyle, this.deriveStyle()] },
        null === (t = (e = this.$slots).default) || void 0 === t
          ? void 0
          : t.call(e, { overflow: this.overflow }),
      );
    },
  }),
  we = { xs: 0, s: 640, m: 1024, l: 1280, xl: 1536, xxl: 1920 },
  ye = "__ssr__",
  Se = o({
    name: "Grid",
    inheritAttrs: !1,
    props: {
      layoutShiftDisabled: Boolean,
      responsive: { type: [String, Boolean], default: "self" },
      cols: { type: [Number, String], default: 24 },
      itemResponsive: Boolean,
      collapsed: Boolean,
      collapsedRows: { type: Number, default: 1 },
      itemStyle: [Object, String],
      xGap: { type: [Number, String], default: 0 },
      yGap: { type: [Number, String], default: 0 },
    },
    setup(n) {
      const { mergedClsPrefixRef: o, mergedBreakpointsRef: i } = y(n),
        s = /^\d+$/,
        a = t(void 0),
        l = (function (n = re) {
          if (!b) return e(() => []);
          if ("function" != typeof window.matchMedia) return e(() => []);
          const o = t({}),
            i = Object.keys(n),
            s = (e, t) => {
              e.matches ? (o.value[t] = !0) : (o.value[t] = !1);
            };
          return (
            i.forEach((e) => {
              const t = n[e];
              let r, o;
              (void 0 === ne[t]
                ? ((r = window.matchMedia(`(min-width: ${t}px)`)),
                  r.addEventListener
                    ? r.addEventListener("change", (t) => {
                        o.forEach((r) => {
                          r(t, e);
                        });
                      })
                    : r.addListener &&
                      r.addListener((t) => {
                        o.forEach((r) => {
                          r(t, e);
                        });
                      }),
                  (o = new Set()),
                  (ne[t] = { mql: r, cbs: o }))
                : ((r = ne[t].mql), (o = ne[t].cbs)),
                o.add(s),
                r.matches &&
                  o.forEach((t) => {
                    t(r, e);
                  }));
            }),
            r(() => {
              i.forEach((e) => {
                const { cbs: t } = ne[n[e]];
                t.has(s) && t.delete(s);
              });
            }),
            e(() => {
              const { value: e } = o;
              return i.filter((t) => e[t]);
            })
          );
        })((null == i ? void 0 : i.value) || we),
        d = q(
          () =>
            !!n.itemResponsive ||
            !s.test(n.cols.toString()) ||
            !s.test(n.xGap.toString()) ||
            !s.test(n.yGap.toString()),
        ),
        c = e(() => {
          if (d.value) return "self" === n.responsive ? a.value : l.value;
        }),
        u = q(() => {
          var e;
          return null !== (e = Number(te(n.cols.toString(), c.value))) && void 0 !== e ? e : 24;
        }),
        f = q(() => te(n.xGap.toString(), c.value)),
        m = q(() => te(n.yGap.toString(), c.value)),
        g = (e) => {
          a.value = e.contentRect.width;
        },
        w = (e) => {
          ee(g, e);
        },
        S = t(!1),
        $ = e(() => {
          if ("self" === n.responsive) return w;
        }),
        x = t(!1),
        C = t();
      return (
        v(() => {
          const { value: e } = C;
          e && e.hasAttribute(ye) && (e.removeAttribute(ye), (x.value = !0));
        }),
        h(me, {
          layoutShiftDisabledRef: p(n, "layoutShiftDisabled"),
          isSsrRef: x,
          itemStyleRef: p(n, "itemStyle"),
          xGapRef: f,
          overflowRef: S,
        }),
        {
          isSsr: !J,
          contentEl: C,
          mergedClsPrefix: o,
          style: e(() =>
            n.layoutShiftDisabled
              ? {
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: `repeat(${n.cols}, minmax(0, 1fr))`,
                  columnGap: X(n.xGap),
                  rowGap: X(n.yGap),
                }
              : {
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: `repeat(${u.value}, minmax(0, 1fr))`,
                  columnGap: X(f.value),
                  rowGap: X(m.value),
                },
          ),
          isResponsive: d,
          responsiveQuery: c,
          responsiveCols: u,
          handleResize: $,
          overflow: S,
        }
      );
    },
    render() {
      if (this.layoutShiftDisabled)
        return s(
          "div",
          l(
            { ref: "contentEl", class: `${this.mergedClsPrefix}-grid`, style: this.style },
            this.$attrs,
          ),
          this.$slots,
        );
      const e = () => {
        var e, t, r, o, i, a, d;
        this.overflow = !1;
        const c = Q(Z(this)),
          u = [],
          { collapsed: h, collapsedRows: p, responsiveCols: f, responsiveQuery: v } = this;
        c.forEach((e) => {
          var t, r, o, i, s;
          if (
            !0 !==
            (null === (t = null == e ? void 0 : e.type) || void 0 === t ? void 0 : t.__GRID_ITEM__)
          )
            return;
          if (
            (function (e) {
              var t;
              const r =
                null === (t = e.dirs) || void 0 === t ? void 0 : t.find(({ dir: e }) => e === n);
              return !(!r || !1 !== r.value);
            })(e)
          ) {
            const t = m(e);
            return (
              t.props ? (t.props.privateShow = !1) : (t.props = { privateShow: !1 }),
              void u.push({ child: t, rawChildSpan: 0 })
            );
          }
          ((e.dirs =
            (null === (r = e.dirs) || void 0 === r ? void 0 : r.filter(({ dir: e }) => e !== n)) ||
            null),
            0 === (null === (o = e.dirs) || void 0 === o ? void 0 : o.length) && (e.dirs = null));
          const a = m(e),
            l = Number(
              null !== (s = te(null === (i = a.props) || void 0 === i ? void 0 : i.span, v)) &&
                void 0 !== s
                ? s
                : 1,
            );
          0 !== l && u.push({ child: a, rawChildSpan: l });
        });
        let b = 0;
        const g = null === (e = u[u.length - 1]) || void 0 === e ? void 0 : e.child;
        if (null == g ? void 0 : g.props) {
          const e = null === (t = g.props) || void 0 === t ? void 0 : t.suffix;
          void 0 !== e &&
            !1 !== e &&
            ((b = Number(
              null !== (o = te(null === (r = g.props) || void 0 === r ? void 0 : r.span, v)) &&
                void 0 !== o
                ? o
                : 1,
            )),
            (g.props.privateSpan = b),
            (g.props.privateColStart = f + 1 - b),
            (g.props.privateShow = null === (i = g.props.privateShow) || void 0 === i || i));
        }
        let w = 0,
          y = !1;
        for (const { child: n, rawChildSpan: s } of u) {
          if ((y && (this.overflow = !0), !y)) {
            const e = Number(
                null !== (d = te(null === (a = n.props) || void 0 === a ? void 0 : a.offset, v)) &&
                  void 0 !== d
                  ? d
                  : 0,
              ),
              t = Math.min(s + e, f);
            if (
              (n.props
                ? ((n.props.privateSpan = t), (n.props.privateOffset = e))
                : (n.props = { privateSpan: t, privateOffset: e }),
              h)
            ) {
              const e = w % f;
              (t + e > f && (w += f - e), t + w + b > p * f ? (y = !0) : (w += t));
            }
          }
          y &&
            (n.props
              ? !0 !== n.props.privateShow && (n.props.privateShow = !1)
              : (n.props = { privateShow: !1 }));
        }
        return s(
          "div",
          l(
            {
              ref: "contentEl",
              class: `${this.mergedClsPrefix}-grid`,
              style: this.style,
              [ye]: this.isSsr || void 0,
            },
            this.$attrs,
          ),
          u.map(({ child: e }) => e),
        );
      };
      return this.isResponsive && "self" === this.responsive
        ? s(Y, { onResize: this.handleResize }, { default: e })
        : e();
    },
  });
export { fe as _, ve as a, Se as b, ge as c };
