import {
  j as e,
  k as t,
  r as n,
  i as a,
  v as r,
  F as o,
  c as i,
  w as s,
  d as l,
  p as d,
  t as b,
  n as c,
  B as p,
  D as f,
  u as v,
  A as u,
  x as h,
} from "./vendor-DHo7BzsC.js";
import {
  bm as g,
  bn as x,
  bo as m,
  bp as y,
  o as w,
  J as $,
  bq as C,
  N as z,
  br as R,
  C as S,
  x as T,
  G as P,
  z as W,
  y as A,
  aP as L,
  bs as j,
  q as B,
  bt as k,
  t as _,
  D as E,
  bu as N,
  aU as O,
  bv as H,
  v as F,
  bw as D,
  F as I,
} from "./index-Ct5UuHQN.js";
import { A as V } from "./Add-DB3n_hTA.js";
import { c as M, a as X, o as U } from "./cssr-fugg8Rje.js";
import { u as q } from "./use-compitable-BbI6cQbC.js";
import { u as G } from "./use-merged-state-mPE1JA5r.js";
const Y = M(".v-x-scroll", { overflow: "auto", scrollbarWidth: "none" }, [
    M("&::-webkit-scrollbar", { width: 0, height: 0 }),
  ]),
  J = e({
    name: "XScroll",
    props: { disabled: Boolean, onScroll: Function },
    setup() {
      const e = n(null);
      const t = g();
      Y.mount({ id: "vueuc/x-scroll", head: !0, anchorMetaName: X, ssr: t });
      const a = {
        scrollTo(...t) {
          var n;
          null === (n = e.value) || void 0 === n || n.scrollTo(...t);
        },
      };
      return Object.assign(
        {
          selfRef: e,
          handleWheel: function (e) {
            e.currentTarget.offsetWidth < e.currentTarget.scrollWidth &&
              0 !== e.deltaY &&
              ((e.currentTarget.scrollLeft += e.deltaY + e.deltaX), e.preventDefault());
          },
        },
        a,
      );
    },
    render() {
      return t(
        "div",
        {
          ref: "selfRef",
          onScroll: this.onScroll,
          onWheel: this.disabled ? void 0 : this.handleWheel,
          class: "v-x-scroll",
        },
        this.$slots,
      );
    },
  });
var K = /\s/;
var Q = /^\s+/;
function Z(e) {
  return e
    ? e
        .slice(
          0,
          (function (e) {
            for (var t = e.length; t-- && K.test(e.charAt(t)); );
            return t;
          })(e) + 1,
        )
        .replace(Q, "")
    : e;
}
var ee = /^[-+]0x[0-9a-f]+$/i,
  te = /^0b[01]+$/i,
  ne = /^0o[0-7]+$/i,
  ae = parseInt;
function re(e) {
  if ("number" == typeof e) return e;
  if (x(e)) return NaN;
  if (m(e)) {
    var t = "function" == typeof e.valueOf ? e.valueOf() : e;
    e = m(t) ? t + "" : t;
  }
  if ("string" != typeof e) return 0 === e ? e : +e;
  e = Z(e);
  var n = te.test(e);
  return n || ne.test(e) ? ae(e.slice(2), n ? 2 : 8) : ee.test(e) ? NaN : +e;
}
var oe = function () {
    return y.Date.now();
  },
  ie = Math.max,
  se = Math.min;
function le(e, t, n) {
  var a,
    r,
    o,
    i,
    s,
    l,
    d = 0,
    b = !1,
    c = !1,
    p = !0;
  if ("function" != typeof e) throw new TypeError("Expected a function");
  function f(t) {
    var n = a,
      o = r;
    return ((a = r = void 0), (d = t), (i = e.apply(o, n)));
  }
  function v(e) {
    var n = e - l;
    return void 0 === l || n >= t || n < 0 || (c && e - d >= o);
  }
  function u() {
    var e = oe();
    if (v(e)) return h(e);
    s = setTimeout(
      u,
      (function (e) {
        var n = t - (e - l);
        return c ? se(n, o - (e - d)) : n;
      })(e),
    );
  }
  function h(e) {
    return ((s = void 0), p && a ? f(e) : ((a = r = void 0), i));
  }
  function g() {
    var e = oe(),
      n = v(e);
    if (((a = arguments), (r = this), (l = e), n)) {
      if (void 0 === s)
        return (function (e) {
          return ((d = e), (s = setTimeout(u, t)), b ? f(e) : i);
        })(l);
      if (c) return (clearTimeout(s), (s = setTimeout(u, t)), f(l));
    }
    return (void 0 === s && (s = setTimeout(u, t)), i);
  }
  return (
    (t = re(t) || 0),
    m(n) &&
      ((b = !!n.leading),
      (o = (c = "maxWait" in n) ? ie(re(n.maxWait) || 0, t) : o),
      (p = "trailing" in n ? !!n.trailing : p)),
    (g.cancel = function () {
      (void 0 !== s && clearTimeout(s), (d = 0), (a = l = r = s = void 0));
    }),
    (g.flush = function () {
      return void 0 === s ? i : h(oe());
    }),
    g
  );
}
const de = w("n-tabs"),
  be = {
    tab: [String, Number, Object, Function],
    name: { type: [String, Number], required: !0 },
    disabled: Boolean,
    displayDirective: { type: String, default: "if" },
    closable: { type: Boolean, default: void 0 },
    tabProps: Object,
    label: [String, Number, Object, Function],
  },
  ce = e({
    __TAB_PANE__: !0,
    name: "TabPane",
    alias: ["TabPanel"],
    props: be,
    slots: Object,
    setup(e) {
      const t = a(de, null);
      return (
        t || $("tab-pane", "`n-tab-pane` must be placed inside `n-tabs`."),
        { style: t.paneStyleRef, class: t.paneClassRef, mergedClsPrefix: t.mergedClsPrefixRef }
      );
    },
    render() {
      return t(
        "div",
        { class: [`${this.mergedClsPrefix}-tab-pane`, this.class], style: this.style },
        this.$slots,
      );
    },
  }),
  pe = e({
    __TAB__: !0,
    inheritAttrs: !1,
    name: "Tab",
    props: Object.assign(
      { internalLeftPadded: Boolean, internalAddable: Boolean, internalCreatedByPane: Boolean },
      S(be, ["displayDirective"]),
    ),
    setup(e) {
      const {
        mergedClsPrefixRef: t,
        valueRef: n,
        typeRef: r,
        closableRef: o,
        tabStyleRef: s,
        addTabStyleRef: l,
        tabClassRef: d,
        addTabClassRef: b,
        tabChangeIdRef: c,
        onBeforeLeaveRef: p,
        triggerRef: f,
        handleAdd: v,
        activateTab: u,
        handleClose: h,
      } = a(de);
      return {
        trigger: f,
        mergedClosable: i(() => {
          if (e.internalAddable) return !1;
          const { closable: t } = e;
          return void 0 === t ? o.value : t;
        }),
        style: s,
        addStyle: l,
        tabClass: d,
        addTabClass: b,
        clsPrefix: t,
        value: n,
        type: r,
        handleClose(t) {
          (t.stopPropagation(), e.disabled || h(e.name));
        },
        activateTab() {
          if (e.disabled) return;
          if (e.internalAddable) return void v();
          const { name: t } = e,
            a = ++c.id;
          if (t !== n.value) {
            const { value: r } = p;
            r
              ? Promise.resolve(r(e.name, n.value)).then((e) => {
                  e && c.id === a && u(t);
                })
              : u(t);
          }
        },
      };
    },
    render() {
      const {
          internalAddable: e,
          clsPrefix: n,
          name: a,
          disabled: i,
          label: s,
          tab: l,
          value: d,
          mergedClosable: b,
          trigger: c,
          $slots: { default: p },
        } = this,
        f = null != s ? s : l;
      return t(
        "div",
        { class: `${n}-tabs-tab-wrapper` },
        this.internalLeftPadded ? t("div", { class: `${n}-tabs-tab-pad` }) : null,
        t(
          "div",
          Object.assign(
            { key: a, "data-name": a, "data-disabled": !!i || void 0 },
            r(
              {
                class: [
                  `${n}-tabs-tab`,
                  d === a && `${n}-tabs-tab--active`,
                  i && `${n}-tabs-tab--disabled`,
                  b && `${n}-tabs-tab--closable`,
                  e && `${n}-tabs-tab--addable`,
                  e ? this.addTabClass : this.tabClass,
                ],
                onClick: "click" === c ? this.activateTab : void 0,
                onMouseenter: "hover" === c ? this.activateTab : void 0,
                style: e ? this.addStyle : this.style,
              },
              this.internalCreatedByPane ? this.tabProps || {} : this.$attrs,
            ),
          ),
          t(
            "span",
            { class: `${n}-tabs-tab__label` },
            e
              ? t(
                  o,
                  null,
                  t("div", { class: `${n}-tabs-tab__height-placeholder` }, " "),
                  t(z, { clsPrefix: n }, { default: () => t(V, null) }),
                )
              : p
                ? p()
                : "object" == typeof f
                  ? f
                  : C(null != f ? f : a),
          ),
          b && "card" === this.type
            ? t(R, {
                clsPrefix: n,
                class: `${n}-tabs-tab__close`,
                onClick: this.handleClose,
                disabled: i,
              })
            : null,
        ),
      );
    },
  }),
  fe = T(
    "tabs",
    "\n box-sizing: border-box;\n width: 100%;\n display: flex;\n flex-direction: column;\n transition:\n background-color .3s var(--n-bezier),\n border-color .3s var(--n-bezier);\n",
    [
      P("segment-type", [
        T("tabs-rail", [
          W("&.transition-disabled", [T("tabs-capsule", "\n transition: none;\n ")]),
        ]),
      ]),
      P("top", [
        T(
          "tab-pane",
          "\n padding: var(--n-pane-padding-top) var(--n-pane-padding-right) var(--n-pane-padding-bottom) var(--n-pane-padding-left);\n ",
        ),
      ]),
      P("left", [
        T(
          "tab-pane",
          "\n padding: var(--n-pane-padding-right) var(--n-pane-padding-bottom) var(--n-pane-padding-left) var(--n-pane-padding-top);\n ",
        ),
      ]),
      P("left, right", "\n flex-direction: row;\n ", [
        T(
          "tabs-bar",
          "\n width: 2px;\n right: 0;\n transition:\n top .2s var(--n-bezier),\n max-height .2s var(--n-bezier),\n background-color .3s var(--n-bezier);\n ",
        ),
        T("tabs-tab", "\n padding: var(--n-tab-padding-vertical); \n "),
      ]),
      P("right", "\n flex-direction: row-reverse;\n ", [
        T(
          "tab-pane",
          "\n padding: var(--n-pane-padding-left) var(--n-pane-padding-top) var(--n-pane-padding-right) var(--n-pane-padding-bottom);\n ",
        ),
        T("tabs-bar", "\n left: 0;\n "),
      ]),
      P("bottom", "\n flex-direction: column-reverse;\n justify-content: flex-end;\n ", [
        T(
          "tab-pane",
          "\n padding: var(--n-pane-padding-bottom) var(--n-pane-padding-right) var(--n-pane-padding-top) var(--n-pane-padding-left);\n ",
        ),
        T("tabs-bar", "\n top: 0;\n "),
      ]),
      T(
        "tabs-rail",
        "\n position: relative;\n padding: 3px;\n border-radius: var(--n-tab-border-radius);\n width: 100%;\n background-color: var(--n-color-segment);\n transition: background-color .3s var(--n-bezier);\n display: flex;\n align-items: center;\n ",
        [
          T(
            "tabs-capsule",
            "\n border-radius: var(--n-tab-border-radius);\n position: absolute;\n pointer-events: none;\n background-color: var(--n-tab-color-segment);\n box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .08);\n transition: transform 0.3s var(--n-bezier);\n ",
          ),
          T(
            "tabs-tab-wrapper",
            "\n flex-basis: 0;\n flex-grow: 1;\n display: flex;\n align-items: center;\n justify-content: center;\n ",
            [
              T(
                "tabs-tab",
                "\n overflow: hidden;\n border-radius: var(--n-tab-border-radius);\n width: 100%;\n display: flex;\n align-items: center;\n justify-content: center;\n ",
                [
                  P(
                    "active",
                    "\n font-weight: var(--n-font-weight-strong);\n color: var(--n-tab-text-color-active);\n ",
                  ),
                  W("&:hover", "\n color: var(--n-tab-text-color-hover);\n "),
                ],
              ),
            ],
          ),
        ],
      ),
      P("flex", [
        T("tabs-nav", "\n width: 100%;\n position: relative;\n ", [
          T("tabs-wrapper", "\n width: 100%;\n ", [T("tabs-tab", "\n margin-right: 0;\n ")]),
        ]),
      ]),
      T(
        "tabs-nav",
        "\n box-sizing: border-box;\n line-height: 1.5;\n display: flex;\n transition: border-color .3s var(--n-bezier);\n ",
        [
          A("prefix, suffix", "\n display: flex;\n align-items: center;\n "),
          A("prefix", "padding-right: 16px;"),
          A("suffix", "padding-left: 16px;"),
        ],
      ),
      P("top, bottom", [
        W(">", [
          T("tabs-nav", [
            T("tabs-nav-scroll-wrapper", [
              W("&::before", "\n top: 0;\n bottom: 0;\n left: 0;\n width: 20px;\n "),
              W("&::after", "\n top: 0;\n bottom: 0;\n right: 0;\n width: 20px;\n "),
              P("shadow-start", [
                W("&::before", "\n box-shadow: inset 10px 0 8px -8px rgba(0, 0, 0, .12);\n "),
              ]),
              P("shadow-end", [
                W("&::after", "\n box-shadow: inset -10px 0 8px -8px rgba(0, 0, 0, .12);\n "),
              ]),
            ]),
          ]),
        ]),
      ]),
      P("left, right", [
        T("tabs-nav-scroll-content", "\n flex-direction: column;\n "),
        W(">", [
          T("tabs-nav", [
            T("tabs-nav-scroll-wrapper", [
              W("&::before", "\n top: 0;\n left: 0;\n right: 0;\n height: 20px;\n "),
              W("&::after", "\n bottom: 0;\n left: 0;\n right: 0;\n height: 20px;\n "),
              P("shadow-start", [
                W("&::before", "\n box-shadow: inset 0 10px 8px -8px rgba(0, 0, 0, .12);\n "),
              ]),
              P("shadow-end", [
                W("&::after", "\n box-shadow: inset 0 -10px 8px -8px rgba(0, 0, 0, .12);\n "),
              ]),
            ]),
          ]),
        ]),
      ]),
      T("tabs-nav-scroll-wrapper", "\n flex: 1;\n position: relative;\n overflow: hidden;\n ", [
        T(
          "tabs-nav-y-scroll",
          "\n height: 100%;\n width: 100%;\n overflow-y: auto; \n scrollbar-width: none;\n ",
          [
            W(
              "&::-webkit-scrollbar, &::-webkit-scrollbar-track-piece, &::-webkit-scrollbar-thumb",
              "\n width: 0;\n height: 0;\n display: none;\n ",
            ),
          ],
        ),
        W(
          "&::before, &::after",
          '\n transition: box-shadow .3s var(--n-bezier);\n pointer-events: none;\n content: "";\n position: absolute;\n z-index: 1;\n ',
        ),
      ]),
      T(
        "tabs-nav-scroll-content",
        "\n display: flex;\n position: relative;\n min-width: 100%;\n min-height: 100%;\n width: fit-content;\n box-sizing: border-box;\n ",
      ),
      T("tabs-wrapper", "\n display: inline-flex;\n flex-wrap: nowrap;\n position: relative;\n "),
      T(
        "tabs-tab-wrapper",
        "\n display: flex;\n flex-wrap: nowrap;\n flex-shrink: 0;\n flex-grow: 0;\n ",
      ),
      T(
        "tabs-tab",
        "\n cursor: pointer;\n white-space: nowrap;\n flex-wrap: nowrap;\n display: inline-flex;\n align-items: center;\n color: var(--n-tab-text-color);\n font-size: var(--n-tab-font-size);\n background-clip: padding-box;\n padding: var(--n-tab-padding);\n transition:\n box-shadow .3s var(--n-bezier),\n color .3s var(--n-bezier),\n background-color .3s var(--n-bezier),\n border-color .3s var(--n-bezier);\n ",
        [
          P("disabled", { cursor: "not-allowed" }),
          A(
            "close",
            "\n margin-left: 6px;\n transition:\n background-color .3s var(--n-bezier),\n color .3s var(--n-bezier);\n ",
          ),
          A("label", "\n display: flex;\n align-items: center;\n z-index: 1;\n "),
        ],
      ),
      T(
        "tabs-bar",
        "\n position: absolute;\n bottom: 0;\n height: 2px;\n border-radius: 1px;\n background-color: var(--n-bar-color);\n transition:\n left .2s var(--n-bezier),\n max-width .2s var(--n-bezier),\n opacity .3s var(--n-bezier),\n background-color .3s var(--n-bezier);\n ",
        [
          W("&.transition-disabled", "\n transition: none;\n "),
          P("disabled", "\n background-color: var(--n-tab-text-color-disabled)\n "),
        ],
      ),
      T(
        "tabs-pane-wrapper",
        "\n position: relative;\n overflow: hidden;\n transition: max-height .2s var(--n-bezier);\n ",
      ),
      T(
        "tab-pane",
        "\n color: var(--n-pane-text-color);\n width: 100%;\n transition:\n color .3s var(--n-bezier),\n background-color .3s var(--n-bezier),\n opacity .2s var(--n-bezier);\n left: 0;\n right: 0;\n top: 0;\n ",
        [
          W(
            "&.next-transition-leave-active, &.prev-transition-leave-active, &.next-transition-enter-active, &.prev-transition-enter-active",
            "\n transition:\n color .3s var(--n-bezier),\n background-color .3s var(--n-bezier),\n transform .2s var(--n-bezier),\n opacity .2s var(--n-bezier);\n ",
          ),
          W(
            "&.next-transition-leave-active, &.prev-transition-leave-active",
            "\n position: absolute;\n ",
          ),
          W(
            "&.next-transition-enter-from, &.prev-transition-leave-to",
            "\n transform: translateX(32px);\n opacity: 0;\n ",
          ),
          W(
            "&.next-transition-leave-to, &.prev-transition-enter-from",
            "\n transform: translateX(-32px);\n opacity: 0;\n ",
          ),
          W(
            "&.next-transition-leave-from, &.next-transition-enter-to, &.prev-transition-leave-from, &.prev-transition-enter-to",
            "\n transform: translateX(0);\n opacity: 1;\n ",
          ),
        ],
      ),
      T(
        "tabs-tab-pad",
        "\n box-sizing: border-box;\n width: var(--n-tab-gap);\n flex-grow: 0;\n flex-shrink: 0;\n ",
      ),
      P("line-type, bar-type", [
        T(
          "tabs-tab",
          "\n font-weight: var(--n-tab-font-weight);\n box-sizing: border-box;\n vertical-align: bottom;\n ",
          [
            W("&:hover", { color: "var(--n-tab-text-color-hover)" }),
            P(
              "active",
              "\n color: var(--n-tab-text-color-active);\n font-weight: var(--n-tab-font-weight-active);\n ",
            ),
            P("disabled", { color: "var(--n-tab-text-color-disabled)" }),
          ],
        ),
      ]),
      T("tabs-nav", [
        P("line-type", [
          P("top", [
            A("prefix, suffix", "\n border-bottom: 1px solid var(--n-tab-border-color);\n "),
            T(
              "tabs-nav-scroll-content",
              "\n border-bottom: 1px solid var(--n-tab-border-color);\n ",
            ),
            T("tabs-bar", "\n bottom: -1px;\n "),
          ]),
          P("left", [
            A("prefix, suffix", "\n border-right: 1px solid var(--n-tab-border-color);\n "),
            T(
              "tabs-nav-scroll-content",
              "\n border-right: 1px solid var(--n-tab-border-color);\n ",
            ),
            T("tabs-bar", "\n right: -1px;\n "),
          ]),
          P("right", [
            A("prefix, suffix", "\n border-left: 1px solid var(--n-tab-border-color);\n "),
            T("tabs-nav-scroll-content", "\n border-left: 1px solid var(--n-tab-border-color);\n "),
            T("tabs-bar", "\n left: -1px;\n "),
          ]),
          P("bottom", [
            A("prefix, suffix", "\n border-top: 1px solid var(--n-tab-border-color);\n "),
            T("tabs-nav-scroll-content", "\n border-top: 1px solid var(--n-tab-border-color);\n "),
            T("tabs-bar", "\n top: -1px;\n "),
          ]),
          A("prefix, suffix", "\n transition: border-color .3s var(--n-bezier);\n "),
          T("tabs-nav-scroll-content", "\n transition: border-color .3s var(--n-bezier);\n "),
          T("tabs-bar", "\n border-radius: 0;\n "),
        ]),
        P("card-type", [
          A("prefix, suffix", "\n transition: border-color .3s var(--n-bezier);\n "),
          T("tabs-pad", "\n flex-grow: 1;\n transition: border-color .3s var(--n-bezier);\n "),
          T("tabs-tab-pad", "\n transition: border-color .3s var(--n-bezier);\n "),
          T(
            "tabs-tab",
            "\n font-weight: var(--n-tab-font-weight);\n border: 1px solid var(--n-tab-border-color);\n background-color: var(--n-tab-color);\n box-sizing: border-box;\n position: relative;\n vertical-align: bottom;\n display: flex;\n justify-content: space-between;\n font-size: var(--n-tab-font-size);\n color: var(--n-tab-text-color);\n ",
            [
              P(
                "addable",
                "\n padding-left: 8px;\n padding-right: 8px;\n font-size: 16px;\n justify-content: center;\n ",
                [
                  A("height-placeholder", "\n width: 0;\n font-size: var(--n-tab-font-size);\n "),
                  L("disabled", [W("&:hover", "\n color: var(--n-tab-text-color-hover);\n ")]),
                ],
              ),
              P("closable", "padding-right: 8px;"),
              P(
                "active",
                "\n background-color: #0000;\n font-weight: var(--n-tab-font-weight-active);\n color: var(--n-tab-text-color-active);\n ",
              ),
              P("disabled", "color: var(--n-tab-text-color-disabled);"),
            ],
          ),
        ]),
        P("left, right", "\n flex-direction: column; \n ", [
          A("prefix, suffix", "\n padding: var(--n-tab-padding-vertical);\n "),
          T("tabs-wrapper", "\n flex-direction: column;\n "),
          T("tabs-tab-wrapper", "\n flex-direction: column;\n ", [
            T("tabs-tab-pad", "\n height: var(--n-tab-gap-vertical);\n width: 100%;\n "),
          ]),
        ]),
        P("top", [
          P("card-type", [
            T("tabs-scroll-padding", "border-bottom: 1px solid var(--n-tab-border-color);"),
            A("prefix, suffix", "\n border-bottom: 1px solid var(--n-tab-border-color);\n "),
            T(
              "tabs-tab",
              "\n border-top-left-radius: var(--n-tab-border-radius);\n border-top-right-radius: var(--n-tab-border-radius);\n ",
              [P("active", "\n border-bottom: 1px solid #0000;\n ")],
            ),
            T("tabs-tab-pad", "\n border-bottom: 1px solid var(--n-tab-border-color);\n "),
            T("tabs-pad", "\n border-bottom: 1px solid var(--n-tab-border-color);\n "),
          ]),
        ]),
        P("left", [
          P("card-type", [
            T("tabs-scroll-padding", "border-right: 1px solid var(--n-tab-border-color);"),
            A("prefix, suffix", "\n border-right: 1px solid var(--n-tab-border-color);\n "),
            T(
              "tabs-tab",
              "\n border-top-left-radius: var(--n-tab-border-radius);\n border-bottom-left-radius: var(--n-tab-border-radius);\n ",
              [P("active", "\n border-right: 1px solid #0000;\n ")],
            ),
            T("tabs-tab-pad", "\n border-right: 1px solid var(--n-tab-border-color);\n "),
            T("tabs-pad", "\n border-right: 1px solid var(--n-tab-border-color);\n "),
          ]),
        ]),
        P("right", [
          P("card-type", [
            T("tabs-scroll-padding", "border-left: 1px solid var(--n-tab-border-color);"),
            A("prefix, suffix", "\n border-left: 1px solid var(--n-tab-border-color);\n "),
            T(
              "tabs-tab",
              "\n border-top-right-radius: var(--n-tab-border-radius);\n border-bottom-right-radius: var(--n-tab-border-radius);\n ",
              [P("active", "\n border-left: 1px solid #0000;\n ")],
            ),
            T("tabs-tab-pad", "\n border-left: 1px solid var(--n-tab-border-color);\n "),
            T("tabs-pad", "\n border-left: 1px solid var(--n-tab-border-color);\n "),
          ]),
        ]),
        P("bottom", [
          P("card-type", [
            T("tabs-scroll-padding", "border-top: 1px solid var(--n-tab-border-color);"),
            A("prefix, suffix", "\n border-top: 1px solid var(--n-tab-border-color);\n "),
            T(
              "tabs-tab",
              "\n border-bottom-left-radius: var(--n-tab-border-radius);\n border-bottom-right-radius: var(--n-tab-border-radius);\n ",
              [P("active", "\n border-top: 1px solid #0000;\n ")],
            ),
            T("tabs-tab-pad", "\n border-top: 1px solid var(--n-tab-border-color);\n "),
            T("tabs-pad", "\n border-top: 1px solid var(--n-tab-border-color);\n "),
          ]),
        ]),
      ]),
    ],
  ),
  ve = function (e, t, n) {
    var a = !0,
      r = !0;
    if ("function" != typeof e) throw new TypeError("Expected a function");
    return (
      m(n) && ((a = "leading" in n ? !!n.leading : a), (r = "trailing" in n ? !!n.trailing : r)),
      le(e, t, { leading: a, maxWait: t, trailing: r })
    );
  },
  ue = e({
    name: "Tabs",
    props: Object.assign(Object.assign({}, E.props), {
      value: [String, Number],
      defaultValue: [String, Number],
      trigger: { type: String, default: "click" },
      type: { type: String, default: "bar" },
      closable: Boolean,
      justifyContent: String,
      size: { type: String, default: "medium" },
      placement: { type: String, default: "top" },
      tabStyle: [String, Object],
      tabClass: String,
      addTabStyle: [String, Object],
      addTabClass: String,
      barWidth: Number,
      paneClass: String,
      paneStyle: [String, Object],
      paneWrapperClass: String,
      paneWrapperStyle: [String, Object],
      addable: [Boolean, Object],
      tabsPadding: { type: Number, default: 0 },
      animated: Boolean,
      onBeforeLeave: Function,
      onAdd: Function,
      "onUpdate:value": [Function, Array],
      onUpdateValue: [Function, Array],
      onClose: [Function, Array],
      labelSize: String,
      activeName: [String, Number],
      onActiveNameChange: [Function, Array],
    }),
    slots: Object,
    setup(e, { slots: t }) {
      var a, r, o, p;
      const { mergedClsPrefixRef: f, inlineThemeDisabled: v } = _(e),
        u = E("Tabs", "-tabs", fe, N, e, f),
        g = n(null),
        x = n(null),
        m = n(null),
        y = n(null),
        w = n(null),
        $ = n(null),
        C = n(!0),
        z = n(!0),
        R = q(e, ["labelSize", "size"]),
        S = q(e, ["activeName", "value"]),
        T = n(
          null !== (r = null !== (a = S.value) && void 0 !== a ? a : e.defaultValue) && void 0 !== r
            ? r
            : t.default
              ? null ===
                  (p = null === (o = j(t.default())[0]) || void 0 === o ? void 0 : o.props) ||
                void 0 === p
                ? void 0
                : p.name
              : null,
        ),
        P = G(S, T),
        W = { id: 0 },
        A = i(() => {
          if (e.justifyContent && "card" !== e.type)
            return { display: "flex", justifyContent: e.justifyContent };
        });
      function L() {
        var e;
        const { value: t } = P;
        if (null === t) return null;
        return null === (e = g.value) || void 0 === e
          ? void 0
          : e.querySelector(`[data-name="${t}"]`);
      }
      function B(e) {
        const { value: t } = x;
        if (t) for (const n of e) t.style[n] = "";
      }
      function k() {
        if ("card" === e.type) return;
        const t = L();
        t
          ? (function (t) {
              if ("card" === e.type) return;
              const { value: n } = x;
              if (!n) return;
              const a = "0" === n.style.opacity;
              if (t) {
                const r = `${f.value}-tabs-bar--disabled`,
                  { barWidth: o, placement: i } = e;
                if (
                  ("true" === t.dataset.disabled ? n.classList.add(r) : n.classList.remove(r),
                  ["top", "bottom"].includes(i))
                ) {
                  if (
                    (B(["top", "maxHeight", "height"]), "number" == typeof o && t.offsetWidth >= o)
                  ) {
                    const e = Math.floor((t.offsetWidth - o) / 2) + t.offsetLeft;
                    ((n.style.left = `${e}px`), (n.style.maxWidth = `${o}px`));
                  } else
                    ((n.style.left = `${t.offsetLeft}px`),
                      (n.style.maxWidth = `${t.offsetWidth}px`));
                  ((n.style.width = "8192px"),
                    a && (n.style.transition = "none"),
                    n.offsetWidth,
                    a && ((n.style.transition = ""), (n.style.opacity = "1")));
                } else {
                  if (
                    (B(["left", "maxWidth", "width"]), "number" == typeof o && t.offsetHeight >= o)
                  ) {
                    const e = Math.floor((t.offsetHeight - o) / 2) + t.offsetTop;
                    ((n.style.top = `${e}px`), (n.style.maxHeight = `${o}px`));
                  } else
                    ((n.style.top = `${t.offsetTop}px`),
                      (n.style.maxHeight = `${t.offsetHeight}px`));
                  ((n.style.height = "8192px"),
                    a && (n.style.transition = "none"),
                    n.offsetHeight,
                    a && ((n.style.transition = ""), (n.style.opacity = "1")));
                }
              }
            })(t)
          : (function () {
              if ("card" === e.type) return;
              const { value: t } = x;
              t && (t.style.opacity = "0");
            })();
      }
      function V() {
        var e;
        const t = null === (e = w.value) || void 0 === e ? void 0 : e.$el;
        if (!t) return;
        const n = L();
        if (!n) return;
        const { scrollLeft: a, offsetWidth: r } = t,
          { offsetLeft: o, offsetWidth: i } = n;
        a > o
          ? t.scrollTo({ top: 0, left: o, behavior: "smooth" })
          : o + i > a + r && t.scrollTo({ top: 0, left: o + i - r, behavior: "smooth" });
      }
      s(P, () => {
        ((W.id = 0), k(), V());
      });
      const M = n(null);
      let X = 0,
        Y = null;
      const J = { value: [] },
        K = n("next");
      function Q() {
        const { value: e } = x;
        if (!e) return;
        const t = "transition-disabled";
        (e.classList.add(t), k(), e.classList.remove(t));
      }
      const Z = n(null);
      function ee({ transitionDisabled: e }) {
        const t = g.value;
        if (!t) return;
        e && t.classList.add("transition-disabled");
        const n = L();
        (n &&
          Z.value &&
          ((Z.value.style.width = `${n.offsetWidth}px`),
          (Z.value.style.height = `${n.offsetHeight}px`),
          (Z.value.style.transform = `translateX(${n.offsetLeft - D(getComputedStyle(t).paddingLeft)}px)`),
          e && Z.value.offsetWidth),
          e && t.classList.remove("transition-disabled"));
      }
      (s([P], () => {
        "segment" === e.type &&
          h(() => {
            ee({ transitionDisabled: !1 });
          });
      }),
        l(() => {
          "segment" === e.type && ee({ transitionDisabled: !0 });
        }));
      let te = 0;
      const ne = ve(function (t) {
        var n;
        if (0 === t.contentRect.width && 0 === t.contentRect.height) return;
        if (te === t.contentRect.width) return;
        te = t.contentRect.width;
        const { type: a } = e;
        if ((("line" !== a && "bar" !== a) || Q(), "segment" !== a)) {
          const { placement: t } = e;
          oe(
            ("top" === t || "bottom" === t
              ? null === (n = w.value) || void 0 === n
                ? void 0
                : n.$el
              : $.value) || null,
          );
        }
      }, 64);
      s([() => e.justifyContent, () => e.size], () => {
        h(() => {
          const { type: t } = e;
          ("line" !== t && "bar" !== t) || Q();
        });
      });
      const ae = n(!1);
      const re = ve(function (t) {
        var n;
        const {
            target: a,
            contentRect: { width: r, height: o },
          } = t,
          i = a.parentElement.parentElement.offsetWidth,
          s = a.parentElement.parentElement.offsetHeight,
          { placement: l } = e;
        if (ae.value) {
          const { value: e } = y;
          if (!e) return;
          "top" === l || "bottom" === l
            ? i - r > e.$el.offsetWidth && (ae.value = !1)
            : s - o > e.$el.offsetHeight && (ae.value = !1);
        } else "top" === l || "bottom" === l ? i < r && (ae.value = !0) : s < o && (ae.value = !0);
        oe((null === (n = w.value) || void 0 === n ? void 0 : n.$el) || null);
      }, 64);
      function oe(t) {
        if (!t) return;
        const { placement: n } = e;
        if ("top" === n || "bottom" === n) {
          const { scrollLeft: e, scrollWidth: n, offsetWidth: a } = t;
          ((C.value = e <= 0), (z.value = e + a >= n));
        } else {
          const { scrollTop: e, scrollHeight: n, offsetHeight: a } = t;
          ((C.value = e <= 0), (z.value = e + a >= n));
        }
      }
      const ie = ve((e) => {
        oe(e.target);
      }, 64);
      (d(de, {
        triggerRef: b(e, "trigger"),
        tabStyleRef: b(e, "tabStyle"),
        tabClassRef: b(e, "tabClass"),
        addTabStyleRef: b(e, "addTabStyle"),
        addTabClassRef: b(e, "addTabClass"),
        paneClassRef: b(e, "paneClass"),
        paneStyleRef: b(e, "paneStyle"),
        mergedClsPrefixRef: f,
        typeRef: b(e, "type"),
        closableRef: b(e, "closable"),
        valueRef: P,
        tabChangeIdRef: W,
        onBeforeLeaveRef: b(e, "onBeforeLeave"),
        activateTab: function (t) {
          const n = P.value;
          let a = "next";
          for (const e of J.value) {
            if (e === n) break;
            if (e === t) {
              a = "prev";
              break;
            }
          }
          ((K.value = a),
            (function (t) {
              const { onActiveNameChange: n, onUpdateValue: a, "onUpdate:value": r } = e;
              n && I(n, t);
              a && I(a, t);
              r && I(r, t);
              T.value = t;
            })(t));
        },
        handleClose: function (t) {
          const { onClose: n } = e;
          n && I(n, t);
        },
        handleAdd: function () {
          const { onAdd: t } = e;
          (t && t(),
            h(() => {
              const e = L(),
                { value: t } = w;
              e && t && t.scrollTo({ left: e.offsetLeft, top: 0, behavior: "smooth" });
            }));
        },
      }),
        U(() => {
          (k(), V());
        }),
        c(() => {
          const { value: e } = m;
          if (!e) return;
          const { value: t } = f,
            n = `${t}-tabs-nav-scroll-wrapper--shadow-start`,
            a = `${t}-tabs-nav-scroll-wrapper--shadow-end`;
          (C.value ? e.classList.remove(n) : e.classList.add(n),
            z.value ? e.classList.remove(a) : e.classList.add(a));
        }));
      const se = {
          syncBarPosition: () => {
            k();
          },
        },
        le = i(() => {
          const { value: t } = R,
            { type: n } = e,
            a = `${t}${{ card: "Card", bar: "Bar", line: "Line", segment: "Segment" }[n]}`,
            {
              self: {
                barColor: r,
                closeIconColor: o,
                closeIconColorHover: i,
                closeIconColorPressed: s,
                tabColor: l,
                tabBorderColor: d,
                paneTextColor: b,
                tabFontWeight: c,
                tabBorderRadius: p,
                tabFontWeightActive: f,
                colorSegment: v,
                fontWeightStrong: h,
                tabColorSegment: g,
                closeSize: x,
                closeIconSize: m,
                closeColorHover: y,
                closeColorPressed: w,
                closeBorderRadius: $,
                [O("panePadding", t)]: C,
                [O("tabPadding", a)]: z,
                [O("tabPaddingVertical", a)]: S,
                [O("tabGap", a)]: T,
                [O("tabGap", `${a}Vertical`)]: P,
                [O("tabTextColor", n)]: W,
                [O("tabTextColorActive", n)]: A,
                [O("tabTextColorHover", n)]: L,
                [O("tabTextColorDisabled", n)]: j,
                [O("tabFontSize", t)]: B,
              },
              common: { cubicBezierEaseInOut: k },
            } = u.value;
          return {
            "--n-bezier": k,
            "--n-color-segment": v,
            "--n-bar-color": r,
            "--n-tab-font-size": B,
            "--n-tab-text-color": W,
            "--n-tab-text-color-active": A,
            "--n-tab-text-color-disabled": j,
            "--n-tab-text-color-hover": L,
            "--n-pane-text-color": b,
            "--n-tab-border-color": d,
            "--n-tab-border-radius": p,
            "--n-close-size": x,
            "--n-close-icon-size": m,
            "--n-close-color-hover": y,
            "--n-close-color-pressed": w,
            "--n-close-border-radius": $,
            "--n-close-icon-color": o,
            "--n-close-icon-color-hover": i,
            "--n-close-icon-color-pressed": s,
            "--n-tab-color": l,
            "--n-tab-font-weight": c,
            "--n-tab-font-weight-active": f,
            "--n-tab-padding": z,
            "--n-tab-padding-vertical": S,
            "--n-tab-gap": T,
            "--n-tab-gap-vertical": P,
            "--n-pane-padding-left": H(C, "left"),
            "--n-pane-padding-right": H(C, "right"),
            "--n-pane-padding-top": H(C, "top"),
            "--n-pane-padding-bottom": H(C, "bottom"),
            "--n-font-weight-strong": h,
            "--n-tab-color-segment": g,
          };
        }),
        be = v
          ? F(
              "tabs",
              i(() => `${R.value[0]}${e.type[0]}`),
              le,
              e,
            )
          : void 0;
      return Object.assign(
        {
          mergedClsPrefix: f,
          mergedValue: P,
          renderedNames: new Set(),
          segmentCapsuleElRef: Z,
          tabsPaneWrapperRef: M,
          tabsElRef: g,
          barElRef: x,
          addTabInstRef: y,
          xScrollInstRef: w,
          scrollWrapperElRef: m,
          addTabFixed: ae,
          tabWrapperStyle: A,
          handleNavResize: ne,
          mergedSize: R,
          handleScroll: ie,
          handleTabsResize: re,
          cssVars: v ? void 0 : le,
          themeClass: null == be ? void 0 : be.themeClass,
          animationDirection: K,
          renderNameListRef: J,
          yScrollElRef: $,
          handleSegmentResize: () => {
            ee({ transitionDisabled: !0 });
          },
          onAnimationBeforeLeave: function (e) {
            const t = M.value;
            if (t) {
              X = e.getBoundingClientRect().height;
              const n = `${X}px`,
                a = () => {
                  ((t.style.height = n), (t.style.maxHeight = n));
                };
              Y ? (a(), Y(), (Y = null)) : (Y = a);
            }
          },
          onAnimationEnter: function (e) {
            const t = M.value;
            if (t) {
              const n = e.getBoundingClientRect().height,
                a = () => {
                  (document.body.offsetHeight,
                    (t.style.maxHeight = `${n}px`),
                    (t.style.height = `${Math.max(X, n)}px`));
                };
              Y ? (Y(), (Y = null), a()) : (Y = a);
            }
          },
          onAnimationAfterEnter: function () {
            const t = M.value;
            if (t) {
              ((t.style.maxHeight = ""), (t.style.height = ""));
              const { paneWrapperStyle: n } = e;
              if ("string" == typeof n) t.style.cssText = n;
              else if (n) {
                const { maxHeight: e, height: a } = n;
                (void 0 !== e && (t.style.maxHeight = e), void 0 !== a && (t.style.height = a));
              }
            }
          },
          onRender: null == be ? void 0 : be.onRender,
        },
        se,
      );
    },
    render() {
      const {
        mergedClsPrefix: e,
        type: n,
        placement: a,
        addTabFixed: r,
        addable: o,
        mergedSize: i,
        renderNameListRef: s,
        onRender: l,
        paneWrapperClass: d,
        paneWrapperStyle: b,
        $slots: { default: c, prefix: p, suffix: f },
      } = this;
      null == l || l();
      const v = c ? j(c()).filter((e) => !0 === e.type.__TAB_PANE__) : [],
        u = c ? j(c()).filter((e) => !0 === e.type.__TAB__) : [],
        h = !u.length,
        g = "card" === n,
        x = "segment" === n,
        m = !g && !x && this.justifyContent;
      s.value = [];
      const y = () => {
          const n = t(
            "div",
            { style: this.tabWrapperStyle, class: `${e}-tabs-wrapper` },
            m
              ? null
              : t("div", {
                  class: `${e}-tabs-scroll-padding`,
                  style:
                    "top" === a || "bottom" === a
                      ? { width: `${this.tabsPadding}px` }
                      : { height: `${this.tabsPadding}px` },
                }),
            h
              ? v.map(
                  (e, n) => (
                    s.value.push(e.props.name),
                    me(
                      t(
                        pe,
                        Object.assign({}, e.props, {
                          internalCreatedByPane: !0,
                          internalLeftPadded:
                            0 !== n && (!m || "center" === m || "start" === m || "end" === m),
                        }),
                        e.children ? { default: e.children.tab } : void 0,
                      ),
                    )
                  ),
                )
              : u.map((e, t) => (s.value.push(e.props.name), me(0 === t || m ? e : xe(e)))),
            !r && o && g ? ge(o, 0 !== (h ? v.length : u.length)) : null,
            m
              ? null
              : t("div", {
                  class: `${e}-tabs-scroll-padding`,
                  style: { width: `${this.tabsPadding}px` },
                }),
          );
          return t(
            "div",
            { ref: "tabsElRef", class: `${e}-tabs-nav-scroll-content` },
            g && o ? t(k, { onResize: this.handleTabsResize }, { default: () => n }) : n,
            g ? t("div", { class: `${e}-tabs-pad` }) : null,
            g ? null : t("div", { ref: "barElRef", class: `${e}-tabs-bar` }),
          );
        },
        w = x ? "top" : a;
      return t(
        "div",
        {
          class: [
            `${e}-tabs`,
            this.themeClass,
            `${e}-tabs--${n}-type`,
            `${e}-tabs--${i}-size`,
            m && `${e}-tabs--flex`,
            `${e}-tabs--${w}`,
          ],
          style: this.cssVars,
        },
        t(
          "div",
          { class: [`${e}-tabs-nav--${n}-type`, `${e}-tabs-nav--${w}`, `${e}-tabs-nav`] },
          B(p, (n) => n && t("div", { class: `${e}-tabs-nav__prefix` }, n)),
          x
            ? t(
                k,
                { onResize: this.handleSegmentResize },
                {
                  default: () =>
                    t(
                      "div",
                      { class: `${e}-tabs-rail`, ref: "tabsElRef" },
                      t(
                        "div",
                        { class: `${e}-tabs-capsule`, ref: "segmentCapsuleElRef" },
                        t(
                          "div",
                          { class: `${e}-tabs-wrapper` },
                          t("div", { class: `${e}-tabs-tab` }),
                        ),
                      ),
                      h
                        ? v.map(
                            (e, n) => (
                              s.value.push(e.props.name),
                              t(
                                pe,
                                Object.assign({}, e.props, {
                                  internalCreatedByPane: !0,
                                  internalLeftPadded: 0 !== n,
                                }),
                                e.children ? { default: e.children.tab } : void 0,
                              )
                            ),
                          )
                        : u.map((e, t) => (s.value.push(e.props.name), 0 === t ? e : xe(e))),
                    ),
                },
              )
            : t(
                k,
                { onResize: this.handleNavResize },
                {
                  default: () =>
                    t(
                      "div",
                      { class: `${e}-tabs-nav-scroll-wrapper`, ref: "scrollWrapperElRef" },
                      ["top", "bottom"].includes(w)
                        ? t(
                            J,
                            { ref: "xScrollInstRef", onScroll: this.handleScroll },
                            { default: y },
                          )
                        : t(
                            "div",
                            {
                              class: `${e}-tabs-nav-y-scroll`,
                              onScroll: this.handleScroll,
                              ref: "yScrollElRef",
                            },
                            y(),
                          ),
                    ),
                },
              ),
          r && o && g ? ge(o, !0) : null,
          B(f, (n) => n && t("div", { class: `${e}-tabs-nav__suffix` }, n)),
        ),
        h &&
          (!this.animated || ("top" !== w && "bottom" !== w)
            ? he(v, this.mergedValue, this.renderedNames)
            : t(
                "div",
                { ref: "tabsPaneWrapperRef", style: b, class: [`${e}-tabs-pane-wrapper`, d] },
                he(
                  v,
                  this.mergedValue,
                  this.renderedNames,
                  this.onAnimationBeforeLeave,
                  this.onAnimationEnter,
                  this.onAnimationAfterEnter,
                  this.animationDirection,
                ),
              )),
      );
    },
  });
function he(e, n, a, r, o, i, s) {
  const l = [];
  return (
    e.forEach((e) => {
      const { name: t, displayDirective: r, "display-directive": o } = e.props,
        i = (e) => r === e || o === e,
        s = n === t;
      if ((void 0 !== e.key && (e.key = t), s || i("show") || (i("show:lazy") && a.has(t)))) {
        a.has(t) || a.add(t);
        const n = !i("if");
        l.push(n ? p(e, [[f, s]]) : e);
      }
    }),
    s
      ? t(
          v,
          { name: `${s}-transition`, onBeforeLeave: r, onEnter: o, onAfterEnter: i },
          { default: () => l },
        )
      : l
  );
}
function ge(e, n) {
  return t(pe, {
    ref: "addTabInstRef",
    key: "__addable",
    name: "__addable",
    internalCreatedByPane: !0,
    internalAddable: !0,
    internalLeftPadded: n,
    disabled: "object" == typeof e && e.disabled,
  });
}
function xe(e) {
  const t = u(e);
  return (t.props ? (t.props.internalLeftPadded = !0) : (t.props = { internalLeftPadded: !0 }), t);
}
function me(e) {
  return (
    Array.isArray(e.dynamicProps)
      ? e.dynamicProps.includes("internalLeftPadded") || e.dynamicProps.push("internalLeftPadded")
      : (e.dynamicProps = ["internalLeftPadded"]),
    e
  );
}
export { ue as _, pe as a, ce as b };
