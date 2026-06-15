var e = Object.defineProperty,
  o = (o, t, l) =>
    ((o, t, l) =>
      t in o ? e(o, t, { enumerable: !0, configurable: !0, writable: !0, value: l }) : (o[t] = l))(
      o,
      "symbol" != typeof t ? t + "" : t,
      l,
    );
import {
  x as t,
  H as l,
  K as r,
  t as a,
  D as s,
  at as n,
  S as i,
  v as c,
  o as d,
  G as u,
  au as h,
  av as p,
  aw as m,
  y as f,
  z as v,
  N as g,
  F as b,
  d as y,
  e as x,
  g as w,
  f as C,
  i as k,
  ax as S,
  ay as L,
} from "./index-Ct5UuHQN.js";
import {
  j as T,
  k as z,
  v as I,
  c as _,
  r as N,
  p as P,
  i as j,
  t as B,
  Z as M,
  _ as U,
  V as $,
  d as R,
  z as E,
  U as O,
  S as A,
  a3 as D,
  I as V,
  a0 as q,
  E as H,
  R as Y,
  X as F,
  w as W,
  a2 as Z,
  F as G,
  a4 as X,
  Y as K,
  x as J,
} from "./vendor-DHo7BzsC.js";
import { C as Q, _ as ee } from "./Dropdown-De4FdQJF.js";
import { f as oe } from "./format-length-l2rsThpR.js";
import { u as te } from "./use-merged-state-mPE1JA5r.js";
import { d as le } from "./dayjs.min-D__CVkhT.js";
import { p as re } from "./package-kTMkYQUO.js";
import { _ as ae } from "./Popover-Z03uJL-I.js";
import { _ as se } from "./Spin-liNla5t4.js";
import { s as ne } from "./changeMesssage-DDIKDCV-.js";
import { _ as ie } from "./Avatar-DGwaOewp.js";
import { _ as ce } from "./Badge-CoCZ1ULG.js";
import { N as de } from "./Icon-BkVA54F2.js";
import { t as ue, x as he } from "./小红书-jZwggzOL.js";
const pe = t("collapse-transition", { width: "100%" }, [l()]),
  me = Object.assign(Object.assign({}, s.props), {
    show: { type: Boolean, default: !0 },
    appear: Boolean,
    collapsed: { type: Boolean, default: void 0 },
  }),
  fe = T({
    name: "CollapseTransition",
    props: me,
    inheritAttrs: !1,
    setup(e) {
      const { mergedClsPrefixRef: o, inlineThemeDisabled: t, mergedRtlRef: l } = a(e),
        r = s("CollapseTransition", "-collapse-transition", pe, n, e, o),
        d = i("CollapseTransition", l, o),
        u = _(() => (void 0 !== e.collapsed ? e.collapsed : e.show)),
        h = _(() => {
          const {
            self: { bezier: e },
          } = r.value;
          return { "--n-bezier": e };
        }),
        p = t ? c("collapse-transition", void 0, h, e) : void 0;
      return {
        rtlEnabled: d,
        mergedShow: u,
        mergedClsPrefix: o,
        cssVars: t ? void 0 : h,
        themeClass: null == p ? void 0 : p.themeClass,
        onRender: null == p ? void 0 : p.onRender,
      };
    },
    render() {
      return z(
        r,
        { appear: this.appear },
        {
          default: () => {
            var e;
            if (this.mergedShow)
              return (
                null === (e = this.onRender) || void 0 === e || e.call(this),
                z(
                  "div",
                  I(
                    {
                      class: [
                        `${this.mergedClsPrefix}-collapse-transition`,
                        this.rtlEnabled && `${this.mergedClsPrefix}-collapse-transition--rtl`,
                        this.themeClass,
                      ],
                      style: this.cssVars,
                    },
                    this.$attrs,
                  ),
                  this.$slots,
                )
              );
          },
        },
      );
    },
  }),
  ve = d("n-layout-sider"),
  ge = { type: String, default: "static" },
  be = t(
    "layout",
    "\n color: var(--n-text-color);\n background-color: var(--n-color);\n box-sizing: border-box;\n position: relative;\n z-index: auto;\n flex: auto;\n overflow: hidden;\n transition:\n box-shadow .3s var(--n-bezier),\n background-color .3s var(--n-bezier),\n color .3s var(--n-bezier);\n",
    [
      t(
        "layout-scroll-container",
        "\n overflow-x: hidden;\n box-sizing: border-box;\n height: 100%;\n ",
      ),
      u(
        "absolute-positioned",
        "\n position: absolute;\n left: 0;\n right: 0;\n top: 0;\n bottom: 0;\n ",
      ),
    ],
  ),
  ye = {
    embedded: Boolean,
    position: ge,
    nativeScrollbar: { type: Boolean, default: !0 },
    scrollbarProps: Object,
    onScroll: Function,
    contentClass: String,
    contentStyle: { type: [String, Object], default: "" },
    hasSider: Boolean,
    siderPlacement: { type: String, default: "left" },
  },
  xe = d("n-layout");
function we(e) {
  return T({
    name: e ? "LayoutContent" : "Layout",
    props: Object.assign(Object.assign({}, s.props), ye),
    setup(e) {
      const o = N(null),
        t = N(null),
        { mergedClsPrefixRef: l, inlineThemeDisabled: r } = a(e),
        n = s("Layout", "-layout", be, p, e, l);
      P(xe, e);
      let i = 0,
        d = 0;
      m(() => {
        if (e.nativeScrollbar) {
          const e = o.value;
          e && ((e.scrollTop = d), (e.scrollLeft = i));
        }
      });
      const u = {
          scrollTo: function (l, r) {
            if (e.nativeScrollbar) {
              const { value: e } = o;
              e && (void 0 === r ? e.scrollTo(l) : e.scrollTo(l, r));
            } else {
              const { value: e } = t;
              e && e.scrollTo(l, r);
            }
          },
        },
        h = _(() => {
          const {
            common: { cubicBezierEaseInOut: o },
            self: t,
          } = n.value;
          return {
            "--n-bezier": o,
            "--n-color": e.embedded ? t.colorEmbedded : t.color,
            "--n-text-color": t.textColor,
          };
        }),
        f = r
          ? c(
              "layout",
              _(() => (e.embedded ? "e" : "")),
              h,
              e,
            )
          : void 0;
      return Object.assign(
        {
          mergedClsPrefix: l,
          scrollableElRef: o,
          scrollbarInstRef: t,
          hasSiderStyle: {
            display: "flex",
            flexWrap: "nowrap",
            width: "100%",
            flexDirection: "row",
          },
          mergedTheme: n,
          handleNativeElScroll: (o) => {
            var t;
            const l = o.target;
            ((i = l.scrollLeft),
              (d = l.scrollTop),
              null === (t = e.onScroll) || void 0 === t || t.call(e, o));
          },
          cssVars: r ? void 0 : h,
          themeClass: null == f ? void 0 : f.themeClass,
          onRender: null == f ? void 0 : f.onRender,
        },
        u,
      );
    },
    render() {
      var o;
      const { mergedClsPrefix: t, hasSider: l } = this;
      null === (o = this.onRender) || void 0 === o || o.call(this);
      const r = l ? this.hasSiderStyle : void 0,
        a = [
          this.themeClass,
          e && `${t}-layout-content`,
          `${t}-layout`,
          `${t}-layout--${this.position}-positioned`,
        ];
      return z(
        "div",
        { class: a, style: this.cssVars },
        this.nativeScrollbar
          ? z(
              "div",
              {
                ref: "scrollableElRef",
                class: [`${t}-layout-scroll-container`, this.contentClass],
                style: [this.contentStyle, r],
                onScroll: this.handleNativeElScroll,
              },
              this.$slots,
            )
          : z(
              h,
              Object.assign({}, this.scrollbarProps, {
                onScroll: this.onScroll,
                ref: "scrollbarInstRef",
                theme: this.mergedTheme.peers.Scrollbar,
                themeOverrides: this.mergedTheme.peerOverrides.Scrollbar,
                contentClass: this.contentClass,
                contentStyle: [this.contentStyle, r],
              }),
              this.$slots,
            ),
      );
    },
  });
}
const Ce = we(!1),
  ke = we(!0),
  Se = t(
    "layout-header",
    "\n transition:\n color .3s var(--n-bezier),\n background-color .3s var(--n-bezier),\n box-shadow .3s var(--n-bezier),\n border-color .3s var(--n-bezier);\n box-sizing: border-box;\n width: 100%;\n background-color: var(--n-color);\n color: var(--n-text-color);\n",
    [
      u("absolute-positioned", "\n position: absolute;\n left: 0;\n right: 0;\n top: 0;\n "),
      u("bordered", "\n border-bottom: solid 1px var(--n-border-color);\n "),
    ],
  ),
  Le = { position: ge, inverted: Boolean, bordered: { type: Boolean, default: !1 } },
  Te = T({
    name: "LayoutHeader",
    props: Object.assign(Object.assign({}, s.props), Le),
    setup(e) {
      const { mergedClsPrefixRef: o, inlineThemeDisabled: t } = a(e),
        l = s("Layout", "-layout-header", Se, p, e, o),
        r = _(() => {
          const {
              common: { cubicBezierEaseInOut: o },
              self: t,
            } = l.value,
            r = { "--n-bezier": o };
          return (
            e.inverted
              ? ((r["--n-color"] = t.headerColorInverted),
                (r["--n-text-color"] = t.textColorInverted),
                (r["--n-border-color"] = t.headerBorderColorInverted))
              : ((r["--n-color"] = t.headerColor),
                (r["--n-text-color"] = t.textColor),
                (r["--n-border-color"] = t.headerBorderColor)),
            r
          );
        }),
        n = t
          ? c(
              "layout-header",
              _(() => (e.inverted ? "a" : "b")),
              r,
              e,
            )
          : void 0;
      return {
        mergedClsPrefix: o,
        cssVars: t ? void 0 : r,
        themeClass: null == n ? void 0 : n.themeClass,
        onRender: null == n ? void 0 : n.onRender,
      };
    },
    render() {
      var e;
      const { mergedClsPrefix: o } = this;
      return (
        null === (e = this.onRender) || void 0 === e || e.call(this),
        z(
          "div",
          {
            class: [
              `${o}-layout-header`,
              this.themeClass,
              this.position && `${o}-layout-header--${this.position}-positioned`,
              this.bordered && `${o}-layout-header--bordered`,
            ],
            style: this.cssVars,
          },
          this.$slots,
        )
      );
    },
  }),
  ze = t(
    "layout-sider",
    "\n flex-shrink: 0;\n box-sizing: border-box;\n position: relative;\n z-index: 1;\n color: var(--n-text-color);\n transition:\n color .3s var(--n-bezier),\n border-color .3s var(--n-bezier),\n min-width .3s var(--n-bezier),\n max-width .3s var(--n-bezier),\n transform .3s var(--n-bezier),\n background-color .3s var(--n-bezier);\n background-color: var(--n-color);\n display: flex;\n justify-content: flex-end;\n",
    [
      u("bordered", [
        f(
          "border",
          '\n content: "";\n position: absolute;\n top: 0;\n bottom: 0;\n width: 1px;\n background-color: var(--n-border-color);\n transition: background-color .3s var(--n-bezier);\n ',
        ),
      ]),
      f("left-placement", [u("bordered", [f("border", "\n right: 0;\n ")])]),
      u("right-placement", "\n justify-content: flex-start;\n ", [
        u("bordered", [f("border", "\n left: 0;\n ")]),
        u("collapsed", [
          t("layout-toggle-button", [t("base-icon", "\n transform: rotate(180deg);\n ")]),
          t("layout-toggle-bar", [
            v("&:hover", [
              f("top", { transform: "rotate(-12deg) scale(1.15) translateY(-2px)" }),
              f("bottom", { transform: "rotate(12deg) scale(1.15) translateY(2px)" }),
            ]),
          ]),
        ]),
        t(
          "layout-toggle-button",
          "\n left: 0;\n transform: translateX(-50%) translateY(-50%);\n ",
          [t("base-icon", "\n transform: rotate(0);\n ")],
        ),
        t("layout-toggle-bar", "\n left: -28px;\n transform: rotate(180deg);\n ", [
          v("&:hover", [
            f("top", { transform: "rotate(12deg) scale(1.15) translateY(-2px)" }),
            f("bottom", { transform: "rotate(-12deg) scale(1.15) translateY(2px)" }),
          ]),
        ]),
      ]),
      u("collapsed", [
        t("layout-toggle-bar", [
          v("&:hover", [
            f("top", { transform: "rotate(-12deg) scale(1.15) translateY(-2px)" }),
            f("bottom", { transform: "rotate(12deg) scale(1.15) translateY(2px)" }),
          ]),
        ]),
        t("layout-toggle-button", [t("base-icon", "\n transform: rotate(0);\n ")]),
      ]),
      t(
        "layout-toggle-button",
        "\n transition:\n color .3s var(--n-bezier),\n right .3s var(--n-bezier),\n left .3s var(--n-bezier),\n border-color .3s var(--n-bezier),\n background-color .3s var(--n-bezier);\n cursor: pointer;\n width: 24px;\n height: 24px;\n position: absolute;\n top: 50%;\n right: 0;\n border-radius: 50%;\n display: flex;\n align-items: center;\n justify-content: center;\n font-size: 18px;\n color: var(--n-toggle-button-icon-color);\n border: var(--n-toggle-button-border);\n background-color: var(--n-toggle-button-color);\n box-shadow: 0 2px 4px 0px rgba(0, 0, 0, .06);\n transform: translateX(50%) translateY(-50%);\n z-index: 1;\n ",
        [
          t(
            "base-icon",
            "\n transition: transform .3s var(--n-bezier);\n transform: rotate(180deg);\n ",
          ),
        ],
      ),
      t(
        "layout-toggle-bar",
        "\n cursor: pointer;\n height: 72px;\n width: 32px;\n position: absolute;\n top: calc(50% - 36px);\n right: -28px;\n ",
        [
          f(
            "top, bottom",
            "\n position: absolute;\n width: 4px;\n border-radius: 2px;\n height: 38px;\n left: 14px;\n transition: \n background-color .3s var(--n-bezier),\n transform .3s var(--n-bezier);\n ",
          ),
          f("bottom", "\n position: absolute;\n top: 34px;\n "),
          v("&:hover", [
            f("top", { transform: "rotate(12deg) scale(1.15) translateY(-2px)" }),
            f("bottom", { transform: "rotate(-12deg) scale(1.15) translateY(2px)" }),
          ]),
          f("top, bottom", { backgroundColor: "var(--n-toggle-bar-color)" }),
          v("&:hover", [f("top, bottom", { backgroundColor: "var(--n-toggle-bar-color-hover)" })]),
        ],
      ),
      f(
        "border",
        "\n position: absolute;\n top: 0;\n right: 0;\n bottom: 0;\n width: 1px;\n transition: background-color .3s var(--n-bezier);\n ",
      ),
      t(
        "layout-sider-scroll-container",
        "\n flex-grow: 1;\n flex-shrink: 0;\n box-sizing: border-box;\n height: 100%;\n opacity: 0;\n transition: opacity .3s var(--n-bezier);\n max-width: 100%;\n ",
      ),
      u("show-content", [t("layout-sider-scroll-container", { opacity: 1 })]),
      u("absolute-positioned", "\n position: absolute;\n left: 0;\n top: 0;\n bottom: 0;\n "),
    ],
  ),
  Ie = T({
    props: { clsPrefix: { type: String, required: !0 }, onClick: Function },
    render() {
      const { clsPrefix: e } = this;
      return z(
        "div",
        { onClick: this.onClick, class: `${e}-layout-toggle-bar` },
        z("div", { class: `${e}-layout-toggle-bar__top` }),
        z("div", { class: `${e}-layout-toggle-bar__bottom` }),
      );
    },
  }),
  _e = T({
    name: "LayoutToggleButton",
    props: { clsPrefix: { type: String, required: !0 }, onClick: Function },
    render() {
      const { clsPrefix: e } = this;
      return z(
        "div",
        { class: `${e}-layout-toggle-button`, onClick: this.onClick },
        z(g, { clsPrefix: e }, { default: () => z(Q, null) }),
      );
    },
  }),
  Ne = {
    position: ge,
    bordered: Boolean,
    collapsedWidth: { type: Number, default: 48 },
    width: { type: [Number, String], default: 272 },
    contentClass: String,
    contentStyle: { type: [String, Object], default: "" },
    collapseMode: { type: String, default: "transform" },
    collapsed: { type: Boolean, default: void 0 },
    defaultCollapsed: Boolean,
    showCollapsedContent: { type: Boolean, default: !0 },
    showTrigger: { type: [Boolean, String], default: !1 },
    nativeScrollbar: { type: Boolean, default: !0 },
    inverted: Boolean,
    scrollbarProps: Object,
    triggerClass: String,
    triggerStyle: [String, Object],
    collapsedTriggerClass: String,
    collapsedTriggerStyle: [String, Object],
    "onUpdate:collapsed": [Function, Array],
    onUpdateCollapsed: [Function, Array],
    onAfterEnter: Function,
    onAfterLeave: Function,
    onExpand: [Function, Array],
    onCollapse: [Function, Array],
    onScroll: Function,
  },
  Pe = T({
    name: "LayoutSider",
    props: Object.assign(Object.assign({}, s.props), Ne),
    setup(e) {
      const o = j(xe),
        t = N(null),
        l = N(null),
        r = N(e.defaultCollapsed),
        n = te(B(e, "collapsed"), r),
        i = _(() => oe(n.value ? e.collapsedWidth : e.width)),
        d = _(() => ("transform" !== e.collapseMode ? {} : { minWidth: oe(e.width) })),
        u = _(() => (o ? o.siderPlacement : "left"));
      let h = 0,
        f = 0;
      (m(() => {
        if (e.nativeScrollbar) {
          const e = t.value;
          e && ((e.scrollTop = f), (e.scrollLeft = h));
        }
      }),
        P(ve, { collapsedRef: n, collapseModeRef: B(e, "collapseMode") }));
      const { mergedClsPrefixRef: v, inlineThemeDisabled: g } = a(e),
        y = s("Layout", "-layout-sider", ze, p, e, v);
      const x = {
          scrollTo: function (o, r) {
            if (e.nativeScrollbar) {
              const { value: e } = t;
              e && (void 0 === r ? e.scrollTo(o) : e.scrollTo(o, r));
            } else {
              const { value: e } = l;
              e && e.scrollTo(o, r);
            }
          },
        },
        w = _(() => {
          const {
              common: { cubicBezierEaseInOut: o },
              self: t,
            } = y.value,
            {
              siderToggleButtonColor: l,
              siderToggleButtonBorder: r,
              siderToggleBarColor: a,
              siderToggleBarColorHover: s,
            } = t,
            n = {
              "--n-bezier": o,
              "--n-toggle-button-color": l,
              "--n-toggle-button-border": r,
              "--n-toggle-bar-color": a,
              "--n-toggle-bar-color-hover": s,
            };
          return (
            e.inverted
              ? ((n["--n-color"] = t.siderColorInverted),
                (n["--n-text-color"] = t.textColorInverted),
                (n["--n-border-color"] = t.siderBorderColorInverted),
                (n["--n-toggle-button-icon-color"] = t.siderToggleButtonIconColorInverted),
                (n.__invertScrollbar = t.__invertScrollbar))
              : ((n["--n-color"] = t.siderColor),
                (n["--n-text-color"] = t.textColor),
                (n["--n-border-color"] = t.siderBorderColor),
                (n["--n-toggle-button-icon-color"] = t.siderToggleButtonIconColor)),
            n
          );
        }),
        C = g
          ? c(
              "layout-sider",
              _(() => (e.inverted ? "a" : "b")),
              w,
              e,
            )
          : void 0;
      return Object.assign(
        {
          scrollableElRef: t,
          scrollbarInstRef: l,
          mergedClsPrefix: v,
          mergedTheme: y,
          styleMaxWidth: i,
          mergedCollapsed: n,
          scrollContainerStyle: d,
          siderPlacement: u,
          handleNativeElScroll: (o) => {
            var t;
            const l = o.target;
            ((h = l.scrollLeft),
              (f = l.scrollTop),
              null === (t = e.onScroll) || void 0 === t || t.call(e, o));
          },
          handleTransitionend: function (o) {
            var t, l;
            "max-width" === o.propertyName &&
              (n.value
                ? null === (t = e.onAfterLeave) || void 0 === t || t.call(e)
                : null === (l = e.onAfterEnter) || void 0 === l || l.call(e));
          },
          handleTriggerClick: function () {
            const { "onUpdate:collapsed": o, onUpdateCollapsed: t, onExpand: l, onCollapse: a } = e,
              { value: s } = n;
            (t && b(t, !s), o && b(o, !s), (r.value = !s), s ? l && b(l) : a && b(a));
          },
          inlineThemeDisabled: g,
          cssVars: w,
          themeClass: null == C ? void 0 : C.themeClass,
          onRender: null == C ? void 0 : C.onRender,
        },
        x,
      );
    },
    render() {
      var e;
      const { mergedClsPrefix: o, mergedCollapsed: t, showTrigger: l } = this;
      return (
        null === (e = this.onRender) || void 0 === e || e.call(this),
        z(
          "aside",
          {
            class: [
              `${o}-layout-sider`,
              this.themeClass,
              `${o}-layout-sider--${this.position}-positioned`,
              `${o}-layout-sider--${this.siderPlacement}-placement`,
              this.bordered && `${o}-layout-sider--bordered`,
              t && `${o}-layout-sider--collapsed`,
              (!t || this.showCollapsedContent) && `${o}-layout-sider--show-content`,
            ],
            onTransitionend: this.handleTransitionend,
            style: [
              this.inlineThemeDisabled ? void 0 : this.cssVars,
              { maxWidth: this.styleMaxWidth, width: oe(this.width) },
            ],
          },
          this.nativeScrollbar
            ? z(
                "div",
                {
                  class: [`${o}-layout-sider-scroll-container`, this.contentClass],
                  onScroll: this.handleNativeElScroll,
                  style: [this.scrollContainerStyle, { overflow: "auto" }, this.contentStyle],
                  ref: "scrollableElRef",
                },
                this.$slots,
              )
            : z(
                h,
                Object.assign({}, this.scrollbarProps, {
                  onScroll: this.onScroll,
                  ref: "scrollbarInstRef",
                  style: this.scrollContainerStyle,
                  contentStyle: this.contentStyle,
                  contentClass: this.contentClass,
                  theme: this.mergedTheme.peers.Scrollbar,
                  themeOverrides: this.mergedTheme.peerOverrides.Scrollbar,
                  builtinThemeOverrides:
                    this.inverted && "true" === this.cssVars.__invertScrollbar
                      ? { colorHover: "rgba(255, 255, 255, .4)", color: "rgba(255, 255, 255, .3)" }
                      : void 0,
                }),
                this.$slots,
              ),
          l
            ? z("bar" === l ? Ie : _e, {
                clsPrefix: o,
                class: t ? this.collapsedTriggerClass : this.triggerClass,
                style: t ? this.collapsedTriggerStyle : this.triggerStyle,
                onClick: this.handleTriggerClick,
              })
            : null,
          this.bordered ? z("div", { class: `${o}-layout-sider__border` }) : null,
        )
      );
    },
  }),
  je = {
    xmlns: "http://www.w3.org/2000/svg",
    "xmlns:xlink": "http://www.w3.org/1999/xlink",
    viewBox: "0 0 512 512",
  },
  Be = [
    U("circle", { cx: "256", cy: "256", r: "64", fill: "currentColor" }, null, -1),
    U(
      "path",
      {
        d: "M490.84 238.6c-26.46-40.92-60.79-75.68-99.27-100.53C349 110.55 302 96 255.66 96c-42.52 0-84.33 12.15-124.27 36.11c-40.73 24.43-77.63 60.12-109.68 106.07a31.92 31.92 0 0 0-.64 35.54c26.41 41.33 60.4 76.14 98.28 100.65C162 402 207.9 416 255.66 416c46.71 0 93.81-14.43 136.2-41.72c38.46-24.77 72.72-59.66 99.08-100.92a32.2 32.2 0 0 0-.1-34.76zM256 352a96 96 0 1 1 96-96a96.11 96.11 0 0 1-96 96z",
        fill: "currentColor",
      },
      null,
      -1,
    ),
  ],
  Me = T({
    name: "Eye",
    render: function (e, o) {
      return ($(), M("svg", je, Be));
    },
  }),
  Ue = "" + new URL("pdd-mg17eMDm.png", import.meta.url).href,
  $e = "" + new URL("douyin-BWazth0d.png", import.meta.url).href,
  Re = "" + new URL("kuaishou-Cn1VDOm_.png", import.meta.url).href,
  Ee = "" + new URL("淘宝天猫-DyakUfcZ.png", import.meta.url).href,
  Oe = "" + new URL("Group 155-DHauvRTS.png", import.meta.url).href,
  Ae = "" + new URL("defautAvatar-B4Hh6fOD.png", import.meta.url).href,
  De = [];
let Ve = navigator.onLine;
"undefined" != typeof window &&
  (window.addEventListener("online", () => {
    Ve || ((Ve = !0), De.forEach((e) => e(!0)));
  }),
  window.addEventListener("offline", () => {
    Ve && ((Ve = !1), De.forEach((e) => e(!1)));
  }));
class qe {
  static getPingUrl() {
    return "https://www.baidu.com/favicon.ico";
  }
  static async ping() {
    const e = this.getPingUrl();
    try {
      const o = new AbortController(),
        t = setTimeout(() => o.abort(), 5e3);
      return (
        await fetch(e, { method: "HEAD", mode: "no-cors", cache: "no-store", signal: o.signal }),
        clearTimeout(t),
        !0
      );
    } catch (o) {
      return !1;
    }
  }
  static async pingWithRetry(e = 3, o = 5e3, t) {
    for (let l = 1; l <= e; l++) {
      if (await this.ping()) return !0;
      l < e && (null == t || t(l, e), await this.sleep(o));
    }
    return !1;
  }
  static async waitForNetwork(e = 12e4, o = 5e3, t) {
    const l = Date.now();
    for (; Date.now() - l < e; ) {
      const r = Date.now() - l;
      null == t || t(r);
      if (await this.ping()) return !0;
      if (Date.now() - l + o >= e) break;
      await this.sleep(o);
    }
    Math.round((Date.now() - l) / 1e3);
    return !1;
  }
  static sleep(e) {
    return new Promise((o) => setTimeout(o, e));
  }
  static isOnline() {
    return Ve;
  }
  static onStatusChange(e) {
    return (
      De.push(e),
      () => {
        const o = De.indexOf(e);
        -1 !== o && De.splice(o, 1);
      }
    );
  }
  static removeAllListeners() {
    De.length = 0;
  }
}
const He = 100,
  Ye = 300,
  Fe = 500,
  We = { excellent: "优秀", good: "良好", fair: "一般", poor: "较差", offline: "离线" },
  Ze = {
    excellent: "#52c41a",
    good: "#1890ff",
    fair: "#faad14",
    poor: "#f5222d",
    offline: "#8c8c8c",
  };
class Ge {
  constructor() {
    (o(this, "state"),
      o(this, "subscribers", new Set()),
      o(this, "checkInterval", null),
      o(this, "isMonitoring", !1),
      (this.state = {
        status: "offline",
        latency: null,
        qualityLevel: "offline",
        lastCheckTime: null,
      }));
  }
  getState() {
    return { ...this.state };
  }
  async check() {
    this.updateState({ status: "checking" });
    try {
      const e = performance.now(),
        o = await qe.ping(),
        t = performance.now();
      if (o) {
        const o = Math.round(t - e),
          l = (function (e) {
            return null === e
              ? "offline"
              : e < He
                ? "excellent"
                : e < Ye
                  ? "good"
                  : e < Fe
                    ? "fair"
                    : "poor";
          })(o);
        this.updateState({
          status: "online",
          latency: o,
          qualityLevel: l,
          lastCheckTime: new Date(),
        });
      } else
        this.updateState({
          status: "offline",
          latency: null,
          qualityLevel: "offline",
          lastCheckTime: new Date(),
        });
    } catch (e) {
      this.updateState({
        status: "offline",
        latency: null,
        qualityLevel: "offline",
        lastCheckTime: new Date(),
      });
    }
    return this.getState();
  }
  startMonitoring(e = 3e4) {
    this.isMonitoring ||
      ((this.isMonitoring = !0),
      this.check(),
      (this.checkInterval = setInterval(() => {
        this.check();
      }, e)));
  }
  stopMonitoring() {
    (this.checkInterval && (clearInterval(this.checkInterval), (this.checkInterval = null)),
      (this.isMonitoring = !1));
  }
  subscribe(e) {
    return (
      this.subscribers.add(e),
      e(this.getState()),
      () => {
        this.subscribers.delete(e);
      }
    );
  }
  updateState(e) {
    ((this.state = { ...this.state, ...e }), this.notifySubscribers());
  }
  notifySubscribers() {
    const e = this.getState();
    this.subscribers.forEach((o) => {
      try {
        o(e);
      } catch (t) {}
    });
  }
  destroy() {
    (this.stopMonitoring(), this.subscribers.clear());
  }
}
let Xe = null;
function Ke(e = !0, o = 3e4) {
  const t = (Xe || (Xe = new Ge()), Xe),
    l = N("offline"),
    r = N(null),
    a = N("offline"),
    s = N(null),
    n = _(() => "checking" === l.value),
    i = _(() => {
      return ((e = a.value), We[e]);
      var e;
    }),
    c = _(() => {
      return ((e = a.value), Ze[e]);
      var e;
    }),
    d = _(() => (s.value ? le(s.value).format("HH:mm:ss") : "未检测")),
    u = (e) => {
      ((l.value = e.status),
        (r.value = e.latency),
        (a.value = e.qualityLevel),
        (s.value = e.lastCheckTime));
    };
  let h = null;
  return (
    R(() => {
      ((h = t.subscribe(u)), e && t.startMonitoring(o));
    }),
    E(() => {
      h && h();
    }),
    {
      status: l,
      latency: r,
      qualityLevel: a,
      lastCheckTime: s,
      isChecking: n,
      qualityText: i,
      qualityColor: c,
      lastCheckTimeFormatted: d,
      checkNow: async () => {
        await t.check();
      },
    }
  );
}
const Je = { key: 0, width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor" },
  Qe = ["opacity"],
  eo = ["opacity"],
  oo = ["opacity"],
  to = ["opacity"],
  lo = { key: 1, width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor" },
  ro = { class: "network-tooltip-inline" },
  ao = y(
    T({
      __name: "index",
      setup(e) {
        const {
            status: o,
            latency: t,
            qualityLevel: l,
            isChecking: r,
            qualityText: a,
            qualityColor: s,
            checkNow: n,
          } = Ke(),
          i = _(() => {
            switch (l.value) {
              case "excellent":
                return 4;
              case "good":
                return 3;
              case "fair":
                return 2;
              case "poor":
                return 1;
              default:
                return 0;
            }
          }),
          c = async () => {
            r.value || (await n());
          };
        return (e, l) => {
          const n = se,
            d = ae;
          return (
            $(),
            M("div", { class: "network-quality-indicator", onClick: c }, [
              O(
                d,
                { trigger: "hover", placement: "left", "z-index": 9999, to: "body" },
                {
                  trigger: A(() => [
                    U(
                      "div",
                      { class: H(["indicator-container", { checking: V(r) }]) },
                      [
                        U(
                          "div",
                          { class: "signal-icon", style: D({ color: V(s) }) },
                          [
                            "offline" !== V(o)
                              ? ($(),
                                M("svg", Je, [
                                  U(
                                    "rect",
                                    {
                                      x: "2",
                                      y: "16",
                                      width: "4",
                                      height: "6",
                                      rx: "1",
                                      opacity: i.value >= 1 ? 1 : 0.3,
                                    },
                                    null,
                                    8,
                                    Qe,
                                  ),
                                  U(
                                    "rect",
                                    {
                                      x: "8",
                                      y: "12",
                                      width: "4",
                                      height: "10",
                                      rx: "1",
                                      opacity: i.value >= 2 ? 1 : 0.3,
                                    },
                                    null,
                                    8,
                                    eo,
                                  ),
                                  U(
                                    "rect",
                                    {
                                      x: "14",
                                      y: "8",
                                      width: "4",
                                      height: "14",
                                      rx: "1",
                                      opacity: i.value >= 3 ? 1 : 0.3,
                                    },
                                    null,
                                    8,
                                    oo,
                                  ),
                                  U(
                                    "rect",
                                    {
                                      x: "20",
                                      y: "4",
                                      width: "4",
                                      height: "18",
                                      rx: "1",
                                      opacity: i.value >= 4 ? 1 : 0.3,
                                    },
                                    null,
                                    8,
                                    to,
                                  ),
                                ]))
                              : ($(),
                                M("svg", lo, [
                                  ...(l[0] ||
                                    (l[0] = [
                                      U(
                                        "rect",
                                        {
                                          x: "2",
                                          y: "16",
                                          width: "4",
                                          height: "6",
                                          rx: "1",
                                          opacity: "0.3",
                                        },
                                        null,
                                        -1,
                                      ),
                                      U(
                                        "rect",
                                        {
                                          x: "8",
                                          y: "12",
                                          width: "4",
                                          height: "10",
                                          rx: "1",
                                          opacity: "0.3",
                                        },
                                        null,
                                        -1,
                                      ),
                                      U(
                                        "rect",
                                        {
                                          x: "14",
                                          y: "8",
                                          width: "4",
                                          height: "14",
                                          rx: "1",
                                          opacity: "0.3",
                                        },
                                        null,
                                        -1,
                                      ),
                                      U(
                                        "rect",
                                        {
                                          x: "20",
                                          y: "4",
                                          width: "4",
                                          height: "18",
                                          rx: "1",
                                          opacity: "0.3",
                                        },
                                        null,
                                        -1,
                                      ),
                                      U(
                                        "line",
                                        {
                                          x1: "2",
                                          y1: "2",
                                          x2: "22",
                                          y2: "22",
                                          stroke: "currentColor",
                                          "stroke-width": "2",
                                        },
                                        null,
                                        -1,
                                      ),
                                    ])),
                                ])),
                          ],
                          4,
                        ),
                        V(r)
                          ? ($(), Y(n, { key: 0, size: 12, class: "checking-spin" }))
                          : F("", !0),
                      ],
                      2,
                    ),
                  ]),
                  default: A(() => [
                    U("div", ro, [
                      U("span", { style: D({ color: V(s), fontWeight: 500 }) }, q(V(a)), 5),
                      l[1] || (l[1] = U("span", { class: "divider" }, "|", -1)),
                      U("span", null, q(null !== V(t) ? `${V(t)}ms` : "--"), 1),
                    ]),
                  ]),
                  _: 1,
                },
              ),
            ])
          );
        };
      },
    }),
    [["__scopeId", "data-v-63f75940"]],
  ),
  so = { class: "menu-items" },
  no = ["onClick"],
  io = y(
    T({
      __name: "index",
      props: { options: {}, noShowMenu: { default: () => [] } },
      emits: ["select", "scrollChange"],
      setup(e, { expose: o, emit: t }) {
        const l = e,
          r = t,
          a = N(null),
          s = (e) => {
            a.value && a.value.scrollBy({ left: e, behavior: "smooth" });
          },
          n = () => {
            s(200);
          },
          i = () => {
            if (a.value) {
              const { scrollLeft: e, scrollWidth: o, clientWidth: t } = a.value;
              r("scrollChange", e > 0, e + t < o - 1);
            }
          },
          c = () => {
            i();
          };
        (R(() => {
          setTimeout(() => {
            i();
          }, 100);
        }),
          W(
            () => l.options,
            () => {
              setTimeout(() => {
                i();
              }, 100);
            },
            { deep: !0 },
          ),
          o({
            scrollBy: s,
            scrollLeft: () => {
              s(-200);
            },
            scrollRight: n,
            checkScroll: i,
            getContainer: () => a.value,
            scrollToKey: (e) => {
              if (!a.value) return;
              const o = a.value.querySelectorAll(".menu-item");
              for (let t = 0; t < o.length; t++) {
                const r = o[t],
                  a = l.options;
                if (a[t] && a[t].key === e)
                  return void r.scrollIntoView({
                    behavior: "instant",
                    block: "nearest",
                    inline: "center",
                  });
              }
              n();
            },
          }));
        const d = N(!1),
          u = N(0),
          h = N(0),
          p = _(() => l.options.filter((e) => !l.noShowMenu.includes(e.key))),
          m = (e) => ("function" == typeof e.label ? e.label() : z("span", e.label || "")),
          f = (e) => {
            a.value && (a.value.scrollLeft += e.deltaY);
          },
          v = (e) => {
            a.value &&
              ((d.value = !1),
              (u.value = e.pageX - a.value.offsetLeft),
              (h.value = a.value.scrollLeft),
              document.addEventListener("mousemove", g),
              document.addEventListener("mouseup", b));
          },
          g = (e) => {
            if (!a.value) return;
            const o = e.pageX - a.value.offsetLeft - u.value;
            (Math.abs(o) > 5 && (d.value = !0), (a.value.scrollLeft = h.value - o));
          },
          b = () => {
            (document.removeEventListener("mousemove", g),
              document.removeEventListener("mouseup", b),
              setTimeout(() => {
                d.value = !1;
              }, 10));
          };
        return (
          E(() => {
            (document.removeEventListener("mousemove", g),
              document.removeEventListener("mouseup", b));
          }),
          (e, o) => (
            $(),
            M(
              "div",
              {
                class: "scrollable-menu-container",
                ref_key: "menuContainerRef",
                ref: a,
                onWheel: Z(f, ["prevent"]),
                onMousedown: v,
                onScroll: c,
              },
              [
                U("div", so, [
                  ($(!0),
                  M(
                    G,
                    null,
                    X(
                      p.value,
                      (e) => (
                        $(),
                        M(
                          "div",
                          {
                            key: e.key,
                            class: "menu-item",
                            onClick: (o) =>
                              ((e) => {
                                d.value || r("select", e.key, e);
                              })(e),
                          },
                          [($(), Y(K(m(e))))],
                          8,
                          no,
                        )
                      ),
                    ),
                    128,
                  )),
                ]),
              ],
              544,
            )
          )
        );
      },
    }),
    [["__scopeId", "data-v-40037f27"]],
  ),
  co = { VITE_API_URL: "http://khai.shihuib.cn/prod-api" },
  uo = { class: "body" },
  ho = { class: "header-container" },
  po = { class: "user-info-section" },
  mo = { class: "flex items-center space-x-3" },
  fo = { class: "text-xs text-gray-400 mr-2", style: { color: "#ffffff" } },
  vo = { class: "ai-power-orb mr-3" },
  go = { class: "orb-container" },
  bo = { class: "orb-inner" },
  yo = { class: "power-text" },
  xo = { class: "power-tooltip" },
  wo = { class: "power-details" },
  Co = { class: "power-item" },
  ko = { class: "value" },
  So = { class: "power-item" },
  Lo = { class: "value" },
  To = { class: "power-item" },
  zo = { class: "value" },
  Io = { class: "nav-section" },
  _o = { class: "flex items-center" },
  No = { class: "mr-3 flex items-center" },
  Po = { key: 0, class: "mr-4 mt-1 text-[#f0a020]" },
  jo = { key: 1, class: "text-base", style: { "margin-right": "10px" } },
  Bo = { class: "blue-circle" },
  Mo = { class: "text-base" },
  Uo = { class: "eye-icon-container" },
  $o = { class: "blue-circle" },
  Ro = { id: "notification-icon-placeholder", class: "notification-icon-placeholder" },
  Eo = { class: "user-info-display" },
  Oo = { class: "flex items-center space-x-3" },
  Ao = { key: 1, class: "w-[32px] h-[32px] rounded-full", src: Ae, alt: "" },
  Do = { class: "flex flex-col" },
  Vo = { class: "flex items-center space-x-2" },
  qo = { class: "text-base font-semibold text-white" },
  Ho = {
    class: "text-xs text-white font-medium cursor-pointer hover:text-gray-200 transition-colors",
  },
  Yo = y(
    T({
      __name: "index",
      props: { noShowMenu: { default: () => [] } },
      emits: ["clickMenu", "startGuide"],
      setup(e, { expose: o, emit: t }) {
        const l = N(null),
          r = N(null),
          a = N(!1),
          s = N(!1),
          n = N(!1),
          i = (e, o) => {
            ((s.value = e), (n.value = o));
          },
          c = () => {
            J(() => {
              var e;
              null == (e = l.value) || e.checkScroll();
            });
          },
          d = _(() => {
            var e, o, t;
            return (
              "saaszikf" ==
              (null ==
              (t = null == (o = null == (e = v.userInfo) ? void 0 : e.roles) ? void 0 : o[0])
                ? void 0
                : t.roleKey)
            );
          });
        let u = null;
        (R(() => {
          r.value &&
            ((u = new ResizeObserver(() => {
              c();
            })),
            u.observe(r.value));
        }),
          E(() => {
            u && u.disconnect();
          }));
        const h = (e) => {
            var o, t;
            "left" === e
              ? null == (o = l.value) || o.scrollLeft()
              : null == (t = l.value) || t.scrollRight();
          },
          p = _(() => {
            let e = 0;
            return (
              ne.forEach((o) => {
                e += Number(o);
              }),
              e
            );
          }),
          { VITE_API_URL: m } = co,
          f = w(),
          v = x(),
          g = C(),
          b = re.version,
          y = _(() =>
            0 === v.userInfo.aiNumberMax
              ? 0
              : Math.round((v.userInfo.aiNumber / v.userInfo.aiNumberMax) * 100),
          );
        let T = null;
        const I = e,
          P = () => {
            k.send("minimize-window");
          },
          j = () => {
            k.send("toggle-maximize-window");
          },
          B = () => {
            k.send("close-window");
          };
        (R(() => {
          (v.getUserInfo(),
            setTimeout(() => {
              c();
            }, 200),
            (T = setInterval(() => {
              v.getUserInfo();
            }, 3e4)),
            k.on("clear-all-messages", () => {
              (S(), f.clearAllMessages());
            }));
        }),
          E(() => {
            (k.removeAllListeners("clear-all-messages"),
              k.removeAllListeners("update-message"),
              T && (clearInterval(T), (T = null)));
          }));
        const W = [
            {
              label: () =>
                z(
                  ce,
                  { value: p.value, offset: [10, -1], showZero: !0 },
                  { default: () => z("span", { style: { color: "#ffffff" } }, "客服消息") },
                ),
              key: "customer_service",
            },
            { label: () => z("span", { style: { color: "#ffffff" } }, "店铺首页"), key: "home" },
            {
              label: () => z("span", { style: { color: "#ffffff" } }, "一键上线/下线店铺"),
              key: "offlineOrOnline",
            },
            {
              label: () => z("span", { style: { color: "#ffffff" } }, "知识库管理"),
              key: "knowledge",
            },
            {
              label: () => z("span", { style: { color: "#ffffff" } }, "通用设置"),
              key: "settings",
            },
            {
              label: () => z("span", { style: { color: "#ffffff" } }, "刷新店铺列表"),
              key: "refreshShopList",
            },
            { label: () => z("span", { style: { color: "#ffffff" } }, "AI配置"), key: "aiConfig" },
            {
              label: () => z("span", { style: { color: "#ffffff" } }, "新建工单"),
              key: "create-workOrder",
            },
            {
              label: () =>
                z(
                  ce,
                  { dot: !0, type: "success", offset: [8, 5] },
                  { default: () => z("span", { style: { color: "#ffffff" } }, "使用说明书") },
                ),
              key: "manual",
            },
          ].filter((e) => !I.noShowMenu.includes(e.key)),
          Z = t,
          G = (e, o) => {
            Z("clickMenu", o);
          },
          X = _(() => I.noShowMenu),
          K = async () => {
            (L().catch(() => {}),
              f.clearAllMessages(),
              await k.invoke("logout"),
              v.logout(),
              T && (clearInterval(T), (T = null)));
          },
          Q = () => {
            Z("clickMenu", { key: "shopJj" });
          };
        return (
          o({
            scrollMenuToAIConfig: () => {
              var e;
              null == (e = l.value) || e.scrollToKey("aiConfig");
            },
          }),
          (e, o) => {
            const t = ae,
              c = de,
              u = ie,
              p = ee,
              f = Te;
            return (
              $(),
              M("div", uo, [
                U("div", ho, [
                  U("div", po, [
                    U("div", mo, [
                      o[13] ||
                        (o[13] = U("img", { src: Oe, alt: "", class: "w-[172px]" }, null, -1)),
                      U("span", fo, "v" + q(V(b)), 1),
                      U("div", vo, [
                        O(
                          t,
                          { trigger: "hover", placement: "left-start" },
                          {
                            trigger: A(() => [
                              U("div", go, [
                                U(
                                  "div",
                                  { class: "orb", style: D({ "--power-level": y.value + "%" }) },
                                  [
                                    U("div", bo, [
                                      U(
                                        "div",
                                        {
                                          class: "water-level",
                                          style: D({ "--water-height": y.value + "%" }),
                                        },
                                        [
                                          ...(o[5] ||
                                            (o[5] = [U("div", { class: "water-wave" }, null, -1)])),
                                        ],
                                        4,
                                      ),
                                      o[6] ||
                                        (o[6] = U("div", { class: "power-particles" }, null, -1)),
                                      o[7] ||
                                        (o[7] = U("div", { class: "power-particles" }, null, -1)),
                                      o[8] ||
                                        (o[8] = U("div", { class: "power-particles" }, null, -1)),
                                    ]),
                                  ],
                                  4,
                                ),
                                U("div", yo, q(y.value) + "%", 1),
                              ]),
                            ]),
                            default: A(() => [
                              U("div", xo, [
                                o[12] ||
                                  (o[12] = U("div", { class: "power-title" }, "AI算力状态", -1)),
                                U("div", wo, [
                                  U("div", Co, [
                                    o[9] ||
                                      (o[9] = U("span", { class: "label" }, "当前算力：", -1)),
                                    U("span", ko, q(y.value) + "%", 1),
                                  ]),
                                  U("div", So, [
                                    o[10] ||
                                      (o[10] = U("span", { class: "label" }, "未使用：", -1)),
                                    U("span", Lo, q(V(v).userInfo.aiNumber), 1),
                                  ]),
                                  U("div", To, [
                                    o[11] ||
                                      (o[11] = U("span", { class: "label" }, "总容量：", -1)),
                                    U("span", zo, q(V(v).userInfo.aiNumberMax), 1),
                                  ]),
                                ]),
                              ]),
                            ]),
                            _: 1,
                          },
                        ),
                      ]),
                    ]),
                  ]),
                  U("div", Io, [
                    O(
                      f,
                      { bordered: "", class: "nav select-none" },
                      {
                        default: A(() => [
                          U(
                            "div",
                            {
                              ref_key: "menuWrapperRef",
                              ref: r,
                              class:
                                "flex items-center overflow-hidden flex-1 relative menu-wrapper",
                              onMouseenter: o[2] || (o[2] = (e) => (a.value = !0)),
                              onMouseleave: o[3] || (o[3] = (e) => (a.value = !1)),
                            },
                            [
                              U(
                                "div",
                                {
                                  class: H([
                                    "menu-scroll-arrow left-arrow",
                                    { visible: a.value && s.value },
                                  ]),
                                  onClick: o[0] || (o[0] = (e) => h("left")),
                                },
                                [
                                  ...(o[14] ||
                                    (o[14] = [
                                      U(
                                        "svg",
                                        {
                                          width: "28",
                                          height: "28",
                                          viewBox: "0 0 28 28",
                                          fill: "none",
                                          xmlns: "http://www.w3.org/2000/svg",
                                        },
                                        [
                                          U("circle", {
                                            opacity: "0.2",
                                            cx: "14",
                                            cy: "14",
                                            r: "14",
                                            fill: "white",
                                          }),
                                          U("path", {
                                            d: "M8.37888 14.8023C7.7461 14.4104 7.74797 13.4893 8.38234 13.0999L17.1288 7.73183C17.9727 7.21392 18.9754 8.10587 18.5593 9.00432L16.4195 13.6252C16.2946 13.8949 16.2962 14.2062 16.4237 14.4746L18.5421 18.9321C18.9702 19.8329 17.9602 20.7366 17.1123 20.2115L8.37888 14.8023Z",
                                            fill: "white",
                                          }),
                                        ],
                                        -1,
                                      ),
                                    ])),
                                ],
                                2,
                              ),
                              O(
                                io,
                                {
                                  ref_key: "scrollableMenuRef",
                                  ref: l,
                                  options: V(W),
                                  "no-show-menu": X.value,
                                  onSelect: G,
                                  onScrollChange: i,
                                },
                                null,
                                8,
                                ["options", "no-show-menu"],
                              ),
                              U(
                                "div",
                                {
                                  class: H([
                                    "menu-scroll-arrow right-arrow",
                                    { visible: a.value && n.value },
                                  ]),
                                  onClick: o[1] || (o[1] = (e) => h("right")),
                                  style: { "margin-right": "10px" },
                                },
                                [
                                  ...(o[15] ||
                                    (o[15] = [
                                      U(
                                        "svg",
                                        {
                                          width: "28",
                                          height: "28",
                                          viewBox: "0 0 28 28",
                                          fill: "none",
                                          xmlns: "http://www.w3.org/2000/svg",
                                        },
                                        [
                                          U("circle", {
                                            opacity: "0.2",
                                            cx: "14",
                                            cy: "14",
                                            r: "14",
                                            transform: "matrix(-1 0 0 1 28 0)",
                                            fill: "white",
                                          }),
                                          U("path", {
                                            d: "M19.6211 14.8023C20.2539 14.4104 20.252 13.4893 19.6177 13.0999L10.8712 7.73183C10.0273 7.21392 9.02463 8.10587 9.44068 9.00432L11.5805 13.6252C11.7054 13.8949 11.7038 14.2062 11.5763 14.4746L9.45794 18.9321C9.02984 19.8329 10.0398 20.7366 10.8877 20.2115L19.6211 14.8023Z",
                                            fill: "white",
                                          }),
                                        ],
                                        -1,
                                      ),
                                    ])),
                                ],
                                2,
                              ),
                            ],
                            544,
                          ),
                          U("div", _o, [
                            U("div", No, [
                              "local" === V(g).loginType
                                ? ($(), M("span", Po, "当前为本地数据模式，无法同步服务器数据"))
                                : F("", !0),
                              d.value
                                ? ($(),
                                  M("span", jo, [
                                    O(
                                      t,
                                      { trigger: "hover", placement: "left-start" },
                                      {
                                        trigger: A(() => [
                                          U(
                                            "div",
                                            {
                                              class: "eye-icon-container",
                                              onClick: o[4] || (o[4] = (e) => Z("startGuide")),
                                            },
                                            [
                                              U("div", Bo, [
                                                O(c, null, {
                                                  default: A(() => [
                                                    ...(o[16] ||
                                                      (o[16] = [
                                                        U(
                                                          "svg",
                                                          {
                                                            t: "1773803851267",
                                                            class: "icon",
                                                            viewBox: "0 0 1024 1024",
                                                            version: "1.1",
                                                            xmlns: "http://www.w3.org/2000/svg",
                                                            "p-id": "1824",
                                                            width: "200",
                                                            height: "200",
                                                          },
                                                          [
                                                            U("path", {
                                                              d: "M843.230744 310.551273c0 120.040727-58.647273 181.061818-150.993454 244.084363-52.689455 35.933091-80.058182 84.712727-77.917091 122.88 1.163636 20.247273 4.561455 36.072727-28.299636 25.553455-52.130909-20.526545-119.994182-23.691636-168.587637 4.421818-26.763636 12.939636-44.730182-12.846545-49.570909-35.234909-21.643636-100.817455 43.938909-162.397091 171.985455-248.645818 47.150545-31.790545 80.570182-81.454545 85.550545-117.061818 17.547636-125.765818-175.662545-169.797818-239.802182-42.356364-25.925818 51.479273-50.269091 74.472727-88.715636 81.128727C208.211108 359.330909 159.198744 297.565091 189.96529 219.275636 279.332562-7.540364 498.747835-0.698182 534.867108 0.279273c170.123636 0.139636 308.130909 138.891636 308.363636 310.272z m-193.489454 567.435636c-0.418909 80.709818-65.582545 145.687273-145.733818 145.314909a145.547636 145.547636 0 0 1-144.337455-146.711273c0.698182-79.127273 65.024-143.872 143.639273-144.570181a145.547636 145.547636 0 0 1 146.432 144.709818v1.256727z",
                                                              fill: "#cdcdcd",
                                                              "p-id": "1825",
                                                            }),
                                                          ],
                                                          -1,
                                                        ),
                                                      ])),
                                                  ]),
                                                  _: 1,
                                                }),
                                              ]),
                                            ],
                                          ),
                                        ]),
                                        default: A(() => [
                                          o[17] || (o[17] = U("span", null, "新手引导", -1)),
                                        ]),
                                        _: 1,
                                      },
                                    ),
                                  ]))
                                : F("", !0),
                              O(ao, { class: "mr-2" }),
                              U("span", Mo, [
                                O(
                                  t,
                                  { trigger: "hover", placement: "left-start" },
                                  {
                                    trigger: A(() => [
                                      U("div", Uo, [
                                        U("div", $o, [
                                          O(c, null, { default: A(() => [O(V(Me))]), _: 1 }),
                                        ]),
                                      ]),
                                    ]),
                                    default: A(() => [
                                      U(
                                        "span",
                                        null,
                                        "今日总咨询：" + q(V(g).todayTotalConsultation) + "人",
                                        1,
                                      ),
                                    ]),
                                    _: 1,
                                  },
                                ),
                              ]),
                            ]),
                            U("div", Ro, [
                              O(
                                c,
                                { size: "20" },
                                {
                                  default: A(() => [
                                    ...(o[18] ||
                                      (o[18] = [
                                        U(
                                          "svg",
                                          {
                                            xmlns: "http://www.w3.org/2000/svg",
                                            viewBox: "0 0 24 24",
                                            fill: "currentColor",
                                          },
                                          [
                                            U("path", {
                                              d: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
                                            }),
                                          ],
                                          -1,
                                        ),
                                      ])),
                                  ]),
                                  _: 1,
                                },
                              ),
                            ]),
                            U("div", { class: "flex items-center shop-handover-btn", onClick: Q }, [
                              O(
                                c,
                                { size: "16", class: "mr-1" },
                                {
                                  default: A(() => [
                                    ...(o[19] ||
                                      (o[19] = [
                                        U(
                                          "svg",
                                          {
                                            xmlns: "http://www.w3.org/2000/svg",
                                            viewBox: "0 0 24 24",
                                            fill: "currentColor",
                                          },
                                          [
                                            U("path", {
                                              d: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
                                            }),
                                          ],
                                          -1,
                                        ),
                                      ])),
                                  ]),
                                  _: 1,
                                },
                              ),
                              o[20] || (o[20] = U("span", null, "店铺交接表", -1)),
                            ]),
                            U("div", Eo, [
                              U("div", Oo, [
                                V(v).userInfo.avatar
                                  ? ($(),
                                    Y(
                                      u,
                                      {
                                        key: 0,
                                        round: "",
                                        size: 36,
                                        src: V(m) + V(v).userInfo.avatar,
                                      },
                                      null,
                                      8,
                                      ["src"],
                                    ))
                                  : ($(), M("img", Ao)),
                                U("div", Do, [
                                  U("div", Vo, [
                                    U(
                                      "span",
                                      qo,
                                      q(V(v).userInfo.userName || V(v).userInfo.phone),
                                      1,
                                    ),
                                  ]),
                                  O(
                                    p,
                                    {
                                      trigger: "hover",
                                      placement: "left-start",
                                      options: [{ label: "退出登录", key: "logout" }],
                                      onSelect: K,
                                    },
                                    {
                                      default: A(() => [
                                        U(
                                          "div",
                                          Ho,
                                          " 到期时间：" +
                                            q(
                                              V(v).userInfo.expireTime
                                                ? V(le)(V(v).userInfo.expireTime).format(
                                                    "YYYY-MM-DD",
                                                  )
                                                : "∞",
                                            ),
                                          1,
                                        ),
                                      ]),
                                      _: 1,
                                    },
                                  ),
                                ]),
                              ]),
                            ]),
                          ]),
                        ]),
                        _: 1,
                      },
                    ),
                  ]),
                  U("div", { class: "titlebar-controls" }, [
                    U("button", { class: "titlebar-button minimize-btn", onClick: P }, [
                      ...(o[21] ||
                        (o[21] = [
                          U(
                            "svg",
                            { width: "12", height: "12", viewBox: "0 0 12 12" },
                            [
                              U("rect", {
                                x: "2",
                                y: "5",
                                width: "8",
                                height: "2",
                                fill: "currentColor",
                              }),
                            ],
                            -1,
                          ),
                        ])),
                    ]),
                    U("button", { class: "titlebar-button maximize-btn", onClick: j }, [
                      ...(o[22] ||
                        (o[22] = [
                          U(
                            "svg",
                            { width: "12", height: "12", viewBox: "0 0 12 12" },
                            [
                              U("rect", {
                                x: "2",
                                y: "2",
                                width: "8",
                                height: "8",
                                stroke: "currentColor",
                                "stroke-width": "1",
                                fill: "none",
                              }),
                            ],
                            -1,
                          ),
                        ])),
                    ]),
                    U("button", { class: "titlebar-button close-btn", onClick: B }, [
                      ...(o[23] ||
                        (o[23] = [
                          U(
                            "svg",
                            { width: "12", height: "12", viewBox: "0 0 12 12" },
                            [
                              U("path", {
                                d: "M2 2 L10 10 M10 2 L2 10",
                                stroke: "currentColor",
                                "stroke-width": "1.5",
                              }),
                            ],
                            -1,
                          ),
                        ])),
                    ]),
                  ]),
                ]),
              ])
            );
          }
        );
      },
    }),
    [["__scopeId", "data-v-67047983"]],
  ),
  Fo = require("path");
(Fo.resolve,
  Fo.normalize,
  Fo.isAbsolute,
  Fo.join,
  Fo.relative,
  Fo.toNamespacedPath,
  Fo.dirname,
  Fo.basename,
  Fo.extname,
  Fo.format,
  Fo.parse,
  Fo.matchesGlob,
  Fo.sep,
  Fo.delimiter,
  Fo.win32,
  Fo.posix,
  Fo._makeLong);
const Wo = Fo.default || Fo,
  Zo = (e) => `file://${Wo.resolve(`resources/app.asar/dist/preload-package/pdd/${e}.cjs`)}`,
  Go = (e) => `file://${Wo.resolve(`resources/app.asar/dist/preload-package/doudian/${e}.cjs`)}`,
  Xo = (e) => `file://${Wo.resolve(`resources/app.asar/dist/preload-package/kuaiyu/${e}.cjs`)}`,
  Ko = (e) => `file://${Wo.resolve(`resources/app.asar/dist/preload-package/tgc/${e}.cjs`)}`,
  Jo = (e) => `file://${Wo.resolve(`resources/app.asar/dist/preload-package/wx/${e}.cjs`)}`,
  Qo = (e) => `file://${Wo.resolve(`resources/app.asar/dist/preload-package/xhs/${e}.cjs`)}`;
function et(e) {
  return (
    {
      1: {
        platformName: "淘宝/天猫",
        platformLogo: Ee,
        chatUrl: "https://myseller.taobao.com/home.htm/op-sycm-svc/overview",
        preload:
          ((o = "home"),
          `file://${Wo.resolve(`resources/app.asar/dist/preload-package/tbsj/${o}.cjs`)}`),
        homePreload: "",
        domain: "",
        domainUrl: "",
        loginCookieName: ["JSESSIONID"],
        homeNeedCookieValue: ["JSESSIONID"],
      },
      2: {
        platformName: "阿里巴巴",
        platformLogo: "",
        chatUrl: "",
        homeUrl: "",
        preload: "",
        homePreload: "",
        domain: "",
        domainUrl: "",
        loginCookieName: [],
        homeNeedCookieValue: [],
      },
      3: {
        platformName: "京东",
        platformLogo: "",
        chatUrl: "",
        homeUrl: "",
        preload: "",
        homePreload: "",
        domain: "",
        domainUrl: "",
        loginCookieName: [],
        homeNeedCookieValue: [],
      },
      4: {
        platformName: "拼多多",
        platformLogo: Ue,
        chatUrl: "https://mms.pinduoduo.com/chat-merchant/index.html",
        homeUrl: "https://mms.pinduoduo.com/home/",
        preload: Zo("customer"),
        homePreload: Zo("home"),
        domain: ".pinduoduo.com",
        domainUrl: "https://pinduoduo.com",
        loginCookieName: ["PASS_ID"],
        homeNeedCookieValue: ["PASS_ID"],
      },
      5: {
        platformName: "抖店",
        platformLogo: $e,
        chatUrl: "https://im.jinritemai.com/pc_seller_v2/main/workspace",
        homeUrl: "https://fxg.jinritemai.com/ffa/mshop/homepage/index",
        preload: Go("customer"),
        homePreload: Go("home"),
        domain: ".jinritemai.com",
        domainUrl: "https://fxg.jinritemai.com",
        loginCookieName: ["PHPSESSID"],
        homeNeedCookieValue: ["PHPSESSID"],
      },
      6: {
        platformName: "快手",
        platformLogo: Re,
        chatUrl: "https://im.kwaixiaodian.com/",
        homeUrl: "https://s.kwaixiaodian.com/zone/home",
        preload: Xo("customer"),
        homePreload: Xo("home"),
        domain: "kwaixiaodian.com",
        domainUrl: "https://im.kwaixiaodian.com",
        loginCookieName: ["userId"],
        homeNeedCookieValue: ["userId"],
      },
      7: {
        platformName: "小红书",
        platformLogo: he,
        chatUrl: "https://walle.xiaohongshu.com/cstools/seller/dashboard",
        homeUrl: "https://ark.xiaohongshu.com/app-item/comment/analysis",
        preload: Qo("customer"),
        homePreload: "",
        domain: ".xiaohongshu.com",
        domainUrl: "https://xiaohongshu.com",
        loginCookieName: ["access-token-walle.xiaohongshu.com"],
        homeNeedCookieValue: ["access-token-walle.xiaohongshu.com"],
      },
      8: {
        platformName: "视频号",
        platformLogo:
          "data:image/svg+xml,%3csvg%20width='24'%20height='24'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M22%209.82559C22%2011.112%2020.936%2012.1936%2019.5024%2012.4928C19.2464%2012.5472%2018.976%2012.5744%2018.7008%2012.5744C18.3328%2012.5744%2017.9792%2012.5248%2017.6464%2012.4304C16.6256%2012.1424%2015.8288%2011.4512%2015.528%2010.584C15.4992%2010.504%2015.4784%2010.4224%2015.4592%2010.3408C15.4384%2010.3984%2015.4176%2010.456%2015.392%2010.5152C14.8928%2011.6736%2013.56%2012.5056%2012%2012.5056C10.44%2012.5056%209.10881%2011.6736%208.60641%2010.5152C8.58401%2010.4592%208.56001%2010.4032%208.54241%2010.3456C8.52481%2010.4256%208.50241%2010.5056%208.47361%2010.584C8.17761%2011.4576%207.37281%2012.1536%206.34721%2012.4416C6.01921%2012.5328%205.66561%2012.584%205.29921%2012.584C5.02081%2012.584%204.75361%2012.5552%204.49441%2012.5024C3.06241%2012.2%201.99841%2011.1184%201.99841%209.83519C1.99841%209.49919%202.07041%209.17759%202.20481%208.87839L2.20961%208.86879L4.25761%204.27839H4.25921C4.72801%203.23039%205.77761%202.50079%207.00001%202.50079H17C18.2208%202.50079%2019.2704%203.23039%2019.7376%204.27679C19.7472%204.29439%2019.7552%204.31199%2019.7632%204.33279L21.7936%208.86719C21.9264%209.16479%2022%209.48959%2022%209.82719V9.82559Z'%20fill='%230AB8A6'%20style='fill:%230AB8A6;fill:color(display-p3%200.0380%200.7220%200.6528);fill-opacity:1;'/%3e%3cpath%20d='M19.976%2015.2992C19.976%2015.3184%2019.976%2015.3408%2019.9712%2015.3616C19.9712%2015.376%2019.9712%2015.392%2019.9664%2015.4064V15.4144C19.6064%2018.8272%2016.176%2021.5008%2011.9984%2021.5008C7.8208%2021.5008%204.3904%2018.8272%204.0304%2015.4144V15.4064C4.0272%2015.392%204.0272%2015.376%204.0272%2015.3616C4.0224%2015.3424%204.0224%2015.32%204.0224%2015.2992C4.0224%2014.8576%204.3808%2014.4992%204.8224%2014.4992C5.2304%2014.4992%205.5664%2014.8048%205.616%2015.2C5.6176%2015.2112%205.6176%2015.2256%205.6208%2015.24C5.8912%2017.8464%208.6464%2019.9008%2011.9984%2019.9008C15.3504%2019.9008%2018.1072%2017.8464%2018.376%2015.24C18.3776%2015.2256%2018.3776%2015.2112%2018.3792%2015.2C18.4288%2014.8064%2018.7648%2014.4992%2019.1728%2014.4992C19.6144%2014.4992%2019.9728%2014.8576%2019.9728%2015.2992H19.976Z'%20fill='%230AB8A6'%20style='fill:%230AB8A6;fill:color(display-p3%200.0380%200.7220%200.6528);fill-opacity:1;'/%3e%3c/svg%3e",
        chatUrl: "https://store.weixin.qq.com/shop/home",
        homeUrl: "https://store.weixin.qq.com/shop/home",
        preload: Jo("customer"),
        homePreload: Jo("home"),
        domain: "store.weixin.qq.com",
        domainUrl: "https://store.weixin.qq.com",
        loginCookieName: ["biz_token"],
        homeNeedCookieValue: ["biz_token"],
      },
      9: {
        platformName: "唯品会",
        platformLogo: "",
        chatUrl: "",
        homeUrl: "",
        preload: "",
        homePreload: "",
        domain: "",
        domainUrl: "",
        loginCookieName: [],
        homeNeedCookieValue: [],
      },
      11: {
        platformName: "淘工厂",
        platformLogo: ue,
        chatUrl: "https://c2mbc.service.xixikf.cn/im-desk",
        homeUrl: "https://tgc.tmall.com/ds/page/supplier/supplier-engage-category-new",
        preload: Ko("customer"),
        homePreload: "",
        domain: ".xixikf.cn",
        domainUrl: "https://c2mbc.service.xixikf.cn/",
        loginCookieName: ["fuyun_s2"],
        homeNeedCookieValue: ["fuyun_s2"],
      },
    }[e] || {
      platformName: "",
      platformLogo: "",
      chatUrl: "",
      homeUrl: "",
      preload: "",
      homePreload: "",
      domain: "",
      domainUrl: "",
      loginCookieName: [],
      homeNeedCookieValue: [],
    }
  );
  var o;
}
export { Yo as H, et as S, Pe as _, Ce as a, Ue as b, $e as c, Re as d, Ee as e, ke as f, fe as g };
