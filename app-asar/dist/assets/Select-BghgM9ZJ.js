import {
  j as e,
  x as n,
  k as o,
  l as t,
  r as l,
  d as i,
  w as r,
  b as a,
  i as s,
  q as d,
  t as u,
  c,
  p,
  F as h,
  n as v,
  B as f,
  D as b,
} from "./vendor-DHo7BzsC.js";
import {
  bm as g,
  cr as m,
  bq as w,
  P as y,
  N as x,
  x as C,
  y as F,
  G as O,
  z as S,
  aP as P,
  aO as z,
  q as k,
  bS as R,
  au as T,
  p as M,
  t as B,
  S as $,
  D as A,
  cs as I,
  bw as D,
  aU as j,
  bv as E,
  v as N,
  ct as _,
  cu as L,
  aM as W,
  cv as K,
  T as V,
  aR as U,
  aN as H,
  aS as q,
  F as G,
} from "./index-Ct5UuHQN.js";
import { i as Y, c as J, _ as Q, B as X, V as Z, a as ee, u as ne } from "./Popover-Z03uJL-I.js";
import { N as oe } from "./Input-BbH8ts9k.js";
import { _ as te } from "./Tag-DD6D_Gyq.js";
import { c as le, a as ie } from "./cssr-fugg8Rje.js";
import { g as re } from "./attribute-Cap6sGiE.js";
import { V as ae } from "./VirtualList-CHeV0Vz3.js";
import { a as se, h as de, c as ue } from "./create-D0sloWoF.js";
import { _ as ce } from "./Empty-BURlTLhl.js";
import { u as pe } from "./use-merged-state-mPE1JA5r.js";
import { u as he } from "./use-compitable-BbI6cQbC.js";
import { u as ve } from "./use-locale-BcUKARuA.js";
const fe = "v-hidden",
  be = le("[v-hidden]", { display: "none!important" }),
  ge = e({
    name: "Overflow",
    props: {
      getCounter: Function,
      getTail: Function,
      updateCounter: Function,
      onUpdateCount: Function,
      onUpdateOverflow: Function,
    },
    setup(e, { slots: n }) {
      const o = l(null),
        t = l(null);
      function r(l) {
        const { value: i } = o,
          { getCounter: r, getTail: a } = e;
        let s;
        if (((s = void 0 !== r ? r() : t.value), !i || !s)) return;
        s.hasAttribute(fe) && s.removeAttribute(fe);
        const { children: d } = i;
        if (l.showAllItemsBeforeCalculate)
          for (const e of d) e.hasAttribute(fe) && e.removeAttribute(fe);
        const u = i.offsetWidth,
          c = [],
          p = n.tail ? (null == a ? void 0 : a()) : null;
        let h = p ? p.offsetWidth : 0,
          v = !1;
        const f = i.children.length - (n.tail ? 1 : 0);
        for (let n = 0; n < f - 1; ++n) {
          if (n < 0) continue;
          const o = d[n];
          if (v) {
            o.hasAttribute(fe) || o.setAttribute(fe, "");
            continue;
          }
          o.hasAttribute(fe) && o.removeAttribute(fe);
          const t = o.offsetWidth;
          if (((h += t), (c[n] = t), h > u)) {
            const { updateCounter: o } = e;
            for (let t = n; t >= 0; --t) {
              const l = f - 1 - t;
              void 0 !== o ? o(l) : (s.textContent = `${l}`);
              const i = s.offsetWidth;
              if (((h -= c[t]), h + i <= u || 0 === t)) {
                ((v = !0),
                  (n = t - 1),
                  p &&
                    (-1 === n
                      ? ((p.style.maxWidth = u - i + "px"), (p.style.boxSizing = "border-box"))
                      : (p.style.maxWidth = "")));
                const { onUpdateCount: o } = e;
                o && o(l);
                break;
              }
            }
          }
        }
        const { onUpdateOverflow: b } = e;
        v ? void 0 !== b && b(!0) : (void 0 !== b && b(!1), s.setAttribute(fe, ""));
      }
      const a = g();
      return (
        be.mount({ id: "vueuc/overflow", head: !0, anchorMetaName: ie, ssr: a }),
        i(() => r({ showAllItemsBeforeCalculate: !1 })),
        { selfRef: o, counterRef: t, sync: r }
      );
    },
    render() {
      const { $slots: e } = this;
      return (
        n(() => this.sync({ showAllItemsBeforeCalculate: !1 })),
        o("div", { class: "v-overflow", ref: "selfRef" }, [
          t(e, "default"),
          e.counter
            ? e.counter()
            : o("span", { style: { display: "inline-block" }, ref: "counterRef" }),
          e.tail ? e.tail() : null,
        ])
      );
    },
  });
function me(e, n) {
  n &&
    (i(() => {
      const { value: o } = e;
      o && m.registerHandler(o, n);
    }),
    r(
      e,
      (e, n) => {
        n && m.unregisterHandler(n);
      },
      { deep: !1 },
    ),
    a(() => {
      const { value: n } = e;
      n && m.unregisterHandler(n);
    }));
}
function we(e) {
  const n = e.filter((e) => void 0 !== e);
  if (0 !== n.length)
    return 1 === n.length
      ? n[0]
      : (n) => {
          e.forEach((e) => {
            e && e(n);
          });
        };
}
const ye = e({
    name: "Checkmark",
    render: () =>
      o(
        "svg",
        { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 16 16" },
        o(
          "g",
          { fill: "none" },
          o("path", {
            d: "M14.046 3.486a.75.75 0 0 1-.032 1.06l-7.93 7.474a.85.85 0 0 1-1.188-.022l-2.68-2.72a.75.75 0 1 1 1.068-1.053l2.234 2.267l7.468-7.038a.75.75 0 0 1 1.06.032z",
            fill: "currentColor",
          }),
        ),
      ),
  }),
  xe = e({
    props: { onFocus: Function, onBlur: Function },
    setup: (e) => () =>
      o("div", { style: "width: 0; height: 0", tabindex: 0, onFocus: e.onFocus, onBlur: e.onBlur }),
  }),
  Ce = e({
    name: "NBaseSelectGroupHeader",
    props: { clsPrefix: { type: String, required: !0 }, tmNode: { type: Object, required: !0 } },
    setup() {
      const { renderLabelRef: e, renderOptionRef: n, labelFieldRef: o, nodePropsRef: t } = s(Y);
      return { labelField: o, nodeProps: t, renderLabel: e, renderOption: n };
    },
    render() {
      const {
          clsPrefix: e,
          renderLabel: n,
          renderOption: t,
          nodeProps: l,
          tmNode: { rawNode: i },
        } = this,
        r = null == l ? void 0 : l(i),
        a = n ? n(i, !1) : w(i[this.labelField], i, !1),
        s = o(
          "div",
          Object.assign({}, r, {
            class: [`${e}-base-select-group-header`, null == r ? void 0 : r.class],
          }),
          a,
        );
      return i.render
        ? i.render({ node: s, option: i })
        : t
          ? t({ node: s, option: i, selected: !1 })
          : s;
    },
  });
const Fe = e({
    name: "NBaseSelectOption",
    props: { clsPrefix: { type: String, required: !0 }, tmNode: { type: Object, required: !0 } },
    setup(e) {
      const {
          valueRef: n,
          pendingTmNodeRef: o,
          multipleRef: t,
          valueSetRef: l,
          renderLabelRef: i,
          renderOptionRef: r,
          labelFieldRef: a,
          valueFieldRef: d,
          showCheckmarkRef: u,
          nodePropsRef: c,
          handleOptionClick: p,
          handleOptionMouseEnter: h,
        } = s(Y),
        v = y(() => {
          const { value: n } = o;
          return !!n && e.tmNode.key === n.key;
        });
      return {
        multiple: t,
        isGrouped: y(() => {
          const { tmNode: n } = e,
            { parent: o } = n;
          return o && "group" === o.rawNode.type;
        }),
        showCheckmark: u,
        nodeProps: c,
        isPending: v,
        isSelected: y(() => {
          const { value: o } = n,
            { value: i } = t;
          if (null === o) return !1;
          const r = e.tmNode.rawNode[d.value];
          if (i) {
            const { value: e } = l;
            return e.has(r);
          }
          return o === r;
        }),
        labelField: a,
        renderLabel: i,
        renderOption: r,
        handleMouseMove: function (n) {
          const { tmNode: o } = e,
            { value: t } = v;
          o.disabled || t || h(n, o);
        },
        handleMouseEnter: function (n) {
          const { tmNode: o } = e;
          o.disabled || h(n, o);
        },
        handleClick: function (n) {
          const { tmNode: o } = e;
          o.disabled || p(n, o);
        },
      };
    },
    render() {
      const {
          clsPrefix: e,
          tmNode: { rawNode: n },
          isSelected: t,
          isPending: l,
          isGrouped: i,
          showCheckmark: r,
          nodeProps: a,
          renderOption: s,
          renderLabel: u,
          handleClick: c,
          handleMouseEnter: p,
          handleMouseMove: h,
        } = this,
        v = (function (e, n) {
          return o(
            d,
            { name: "fade-in-scale-up-transition" },
            {
              default: () =>
                e
                  ? o(
                      x,
                      { clsPrefix: n, class: `${n}-base-select-option__check` },
                      { default: () => o(ye) },
                    )
                  : null,
            },
          );
        })(t, e),
        f = u ? [u(n, t), r && v] : [w(n[this.labelField], n, t), r && v],
        b = null == a ? void 0 : a(n),
        g = o(
          "div",
          Object.assign({}, b, {
            class: [
              `${e}-base-select-option`,
              n.class,
              null == b ? void 0 : b.class,
              {
                [`${e}-base-select-option--disabled`]: n.disabled,
                [`${e}-base-select-option--selected`]: t,
                [`${e}-base-select-option--grouped`]: i,
                [`${e}-base-select-option--pending`]: l,
                [`${e}-base-select-option--show-checkmark`]: r,
              },
            ],
            style: [(null == b ? void 0 : b.style) || "", n.style || ""],
            onClick: we([c, null == b ? void 0 : b.onClick]),
            onMouseenter: we([p, null == b ? void 0 : b.onMouseenter]),
            onMousemove: we([h, null == b ? void 0 : b.onMousemove]),
          }),
          o("div", { class: `${e}-base-select-option__content` }, f),
        );
      return n.render
        ? n.render({ node: g, option: n, selected: t })
        : s
          ? s({ node: g, option: n, selected: t })
          : g;
    },
  }),
  Oe = C(
    "base-select-menu",
    "\n line-height: 1.5;\n outline: none;\n z-index: 0;\n position: relative;\n border-radius: var(--n-border-radius);\n transition:\n background-color .3s var(--n-bezier),\n box-shadow .3s var(--n-bezier);\n background-color: var(--n-color);\n",
    [
      C("scrollbar", "\n max-height: var(--n-height);\n "),
      C("virtual-list", "\n max-height: var(--n-height);\n "),
      C(
        "base-select-option",
        "\n min-height: var(--n-option-height);\n font-size: var(--n-option-font-size);\n display: flex;\n align-items: center;\n ",
        [
          F(
            "content",
            "\n z-index: 1;\n white-space: nowrap;\n text-overflow: ellipsis;\n overflow: hidden;\n ",
          ),
        ],
      ),
      C(
        "base-select-group-header",
        "\n min-height: var(--n-option-height);\n font-size: .93em;\n display: flex;\n align-items: center;\n ",
      ),
      C("base-select-menu-option-wrapper", "\n position: relative;\n width: 100%;\n "),
      F(
        "loading, empty",
        "\n display: flex;\n padding: 12px 32px;\n flex: 1;\n justify-content: center;\n ",
      ),
      F("loading", "\n color: var(--n-loading-color);\n font-size: var(--n-loading-size);\n "),
      F(
        "header",
        "\n padding: 8px var(--n-option-padding-left);\n font-size: var(--n-option-font-size);\n transition: \n color .3s var(--n-bezier),\n border-color .3s var(--n-bezier);\n border-bottom: 1px solid var(--n-action-divider-color);\n color: var(--n-action-text-color);\n ",
      ),
      F(
        "action",
        "\n padding: 8px var(--n-option-padding-left);\n font-size: var(--n-option-font-size);\n transition: \n color .3s var(--n-bezier),\n border-color .3s var(--n-bezier);\n border-top: 1px solid var(--n-action-divider-color);\n color: var(--n-action-text-color);\n ",
      ),
      C(
        "base-select-group-header",
        "\n position: relative;\n cursor: default;\n padding: var(--n-option-padding);\n color: var(--n-group-header-text-color);\n ",
      ),
      C(
        "base-select-option",
        "\n cursor: pointer;\n position: relative;\n padding: var(--n-option-padding);\n transition:\n color .3s var(--n-bezier),\n opacity .3s var(--n-bezier);\n box-sizing: border-box;\n color: var(--n-option-text-color);\n opacity: 1;\n ",
        [
          O("show-checkmark", "\n padding-right: calc(var(--n-option-padding-right) + 20px);\n "),
          S(
            "&::before",
            '\n content: "";\n position: absolute;\n left: 4px;\n right: 4px;\n top: 0;\n bottom: 0;\n border-radius: var(--n-border-radius);\n transition: background-color .3s var(--n-bezier);\n ',
          ),
          S("&:active", "\n color: var(--n-option-text-color-pressed);\n "),
          O("grouped", "\n padding-left: calc(var(--n-option-padding-left) * 1.5);\n "),
          O("pending", [S("&::before", "\n background-color: var(--n-option-color-pending);\n ")]),
          O("selected", "\n color: var(--n-option-text-color-active);\n ", [
            S("&::before", "\n background-color: var(--n-option-color-active);\n "),
            O("pending", [
              S("&::before", "\n background-color: var(--n-option-color-active-pending);\n "),
            ]),
          ]),
          O("disabled", "\n cursor: not-allowed;\n ", [
            P("selected", "\n color: var(--n-option-text-color-disabled);\n "),
            O("selected", "\n opacity: var(--n-option-opacity-disabled);\n "),
          ]),
          F(
            "check",
            "\n font-size: 16px;\n position: absolute;\n right: calc(var(--n-option-padding-right) - 4px);\n top: calc(50% - 7px);\n color: var(--n-option-check-color);\n transition: color .3s var(--n-bezier);\n ",
            [z({ enterScale: "0.5" })],
          ),
        ],
      ),
    ],
  ),
  Se = e({
    name: "InternalSelectMenu",
    props: Object.assign(Object.assign({}, A.props), {
      clsPrefix: { type: String, required: !0 },
      scrollable: { type: Boolean, default: !0 },
      treeMate: { type: Object, required: !0 },
      multiple: Boolean,
      size: { type: String, default: "medium" },
      value: { type: [String, Number, Array], default: null },
      autoPending: Boolean,
      virtualScroll: { type: Boolean, default: !0 },
      show: { type: Boolean, default: !0 },
      labelField: { type: String, default: "label" },
      valueField: { type: String, default: "value" },
      loading: Boolean,
      focusable: Boolean,
      renderLabel: Function,
      renderOption: Function,
      nodeProps: Function,
      showCheckmark: { type: Boolean, default: !0 },
      onMousedown: Function,
      onScroll: Function,
      onFocus: Function,
      onBlur: Function,
      onKeyup: Function,
      onKeydown: Function,
      onTabOut: Function,
      onMouseenter: Function,
      onMouseleave: Function,
      onResize: Function,
      resetMenuOnOptionsChange: { type: Boolean, default: !0 },
      inlineThemeDisabled: Boolean,
      onToggle: Function,
    }),
    setup(e) {
      const { mergedClsPrefixRef: o, mergedRtlRef: t } = B(e),
        s = $("InternalSelectMenu", t, o),
        d = A("InternalSelectMenu", "-internal-select-menu", Oe, I, e, u(e, "clsPrefix")),
        h = l(null),
        v = l(null),
        f = l(null),
        b = c(() => e.treeMate.getFlattenedNodes()),
        g = c(() => se(b.value)),
        m = l(null);
      function w() {
        const { value: n } = m;
        n && !e.treeMate.getNode(n.key) && (m.value = null);
      }
      let y;
      (r(
        () => e.show,
        (o) => {
          o
            ? (y = r(
                () => e.treeMate,
                () => {
                  e.resetMenuOnOptionsChange
                    ? (e.autoPending
                        ? (function () {
                            const { treeMate: n } = e;
                            let o = null;
                            const { value: t } = e;
                            (null === t
                              ? (o = n.getFirstAvailableNode())
                              : ((o = e.multiple
                                  ? n.getNode((t || [])[(t || []).length - 1])
                                  : n.getNode(t)),
                                (o && !o.disabled) || (o = n.getFirstAvailableNode())),
                              P(o || null));
                          })()
                        : w(),
                      n(z))
                    : w();
                },
                { immediate: !0 },
              ))
            : null == y || y();
        },
        { immediate: !0 },
      ),
        a(() => {
          null == y || y();
        }));
      const x = c(() => D(d.value.self[j("optionHeight", e.size)])),
        C = c(() => E(d.value.self[j("padding", e.size)])),
        F = c(() => (e.multiple && Array.isArray(e.value) ? new Set(e.value) : new Set())),
        O = c(() => {
          const e = b.value;
          return e && 0 === e.length;
        });
      function S(n) {
        const { onScroll: o } = e;
        o && o(n);
      }
      function P(e, n = !1) {
        ((m.value = e), n && z());
      }
      function z() {
        var n, o;
        const t = m.value;
        if (!t) return;
        const l = g.value(t.key);
        null !== l &&
          (e.virtualScroll
            ? null === (n = v.value) || void 0 === n || n.scrollTo({ index: l })
            : null === (o = f.value) || void 0 === o || o.scrollTo({ index: l, elSize: x.value }));
      }
      (p(Y, {
        handleOptionMouseEnter: function (e, n) {
          n.disabled || P(n, !1);
        },
        handleOptionClick: function (n, o) {
          o.disabled ||
            (function (n) {
              const { onToggle: o } = e;
              o && o(n);
            })(o);
        },
        valueSetRef: F,
        pendingTmNodeRef: m,
        nodePropsRef: u(e, "nodeProps"),
        showCheckmarkRef: u(e, "showCheckmark"),
        multipleRef: u(e, "multiple"),
        valueRef: u(e, "value"),
        renderLabelRef: u(e, "renderLabel"),
        renderOptionRef: u(e, "renderOption"),
        labelFieldRef: u(e, "labelField"),
        valueFieldRef: u(e, "valueField"),
      }),
        p(J, h),
        i(() => {
          const { value: e } = f;
          e && e.sync();
        }));
      const k = c(() => {
          const { size: n } = e,
            {
              common: { cubicBezierEaseInOut: o },
              self: {
                height: t,
                borderRadius: l,
                color: i,
                groupHeaderTextColor: r,
                actionDividerColor: a,
                optionTextColorPressed: s,
                optionTextColor: u,
                optionTextColorDisabled: c,
                optionTextColorActive: p,
                optionOpacityDisabled: h,
                optionCheckColor: v,
                actionTextColor: f,
                optionColorPending: b,
                optionColorActive: g,
                loadingColor: m,
                loadingSize: w,
                optionColorActivePending: y,
                [j("optionFontSize", n)]: x,
                [j("optionHeight", n)]: C,
                [j("optionPadding", n)]: F,
              },
            } = d.value;
          return {
            "--n-height": t,
            "--n-action-divider-color": a,
            "--n-action-text-color": f,
            "--n-bezier": o,
            "--n-border-radius": l,
            "--n-color": i,
            "--n-option-font-size": x,
            "--n-group-header-text-color": r,
            "--n-option-check-color": v,
            "--n-option-color-pending": b,
            "--n-option-color-active": g,
            "--n-option-color-active-pending": y,
            "--n-option-height": C,
            "--n-option-opacity-disabled": h,
            "--n-option-text-color": u,
            "--n-option-text-color-active": p,
            "--n-option-text-color-disabled": c,
            "--n-option-text-color-pressed": s,
            "--n-option-padding": F,
            "--n-option-padding-left": E(F, "left"),
            "--n-option-padding-right": E(F, "right"),
            "--n-loading-color": m,
            "--n-loading-size": w,
          };
        }),
        { inlineThemeDisabled: R } = e,
        T = R
          ? N(
              "internal-select-menu",
              c(() => e.size[0]),
              k,
              e,
            )
          : void 0,
        M = {
          selfRef: h,
          next: function () {
            const { value: e } = m;
            e && P(e.getNext({ loop: !0 }), !0);
          },
          prev: function () {
            const { value: e } = m;
            e && P(e.getPrev({ loop: !0 }), !0);
          },
          getPendingTmNode: function () {
            const { value: e } = m;
            return e || null;
          },
        };
      return (
        me(h, e.onResize),
        Object.assign(
          {
            mergedTheme: d,
            mergedClsPrefix: o,
            rtlEnabled: s,
            virtualListRef: v,
            scrollbarRef: f,
            itemSize: x,
            padding: C,
            flattenedNodes: b,
            empty: O,
            virtualListContainer() {
              const { value: e } = v;
              return null == e ? void 0 : e.listElRef;
            },
            virtualListContent() {
              const { value: e } = v;
              return null == e ? void 0 : e.itemsElRef;
            },
            doScroll: S,
            handleFocusin: function (n) {
              var o, t;
              (null === (o = h.value) || void 0 === o ? void 0 : o.contains(n.target)) &&
                (null === (t = e.onFocus) || void 0 === t || t.call(e, n));
            },
            handleFocusout: function (n) {
              var o, t;
              (null === (o = h.value) || void 0 === o ? void 0 : o.contains(n.relatedTarget)) ||
                null === (t = e.onBlur) ||
                void 0 === t ||
                t.call(e, n);
            },
            handleKeyUp: function (n) {
              var o;
              de(n, "action") || null === (o = e.onKeyup) || void 0 === o || o.call(e, n);
            },
            handleKeyDown: function (n) {
              var o;
              de(n, "action") || null === (o = e.onKeydown) || void 0 === o || o.call(e, n);
            },
            handleMouseDown: function (n) {
              var o;
              (null === (o = e.onMousedown) || void 0 === o || o.call(e, n),
                e.focusable || n.preventDefault());
            },
            handleVirtualListResize: function () {
              var e;
              null === (e = f.value) || void 0 === e || e.sync();
            },
            handleVirtualListScroll: function (e) {
              var n;
              (null === (n = f.value) || void 0 === n || n.sync(), S(e));
            },
            cssVars: R ? void 0 : k,
            themeClass: null == T ? void 0 : T.themeClass,
            onRender: null == T ? void 0 : T.onRender,
          },
          M,
        )
      );
    },
    render() {
      const {
        $slots: e,
        virtualScroll: n,
        clsPrefix: t,
        mergedTheme: l,
        themeClass: i,
        onRender: r,
      } = this;
      return (
        null == r || r(),
        o(
          "div",
          {
            ref: "selfRef",
            tabindex: this.focusable ? 0 : -1,
            class: [
              `${t}-base-select-menu`,
              this.rtlEnabled && `${t}-base-select-menu--rtl`,
              i,
              this.multiple && `${t}-base-select-menu--multiple`,
            ],
            style: this.cssVars,
            onFocusin: this.handleFocusin,
            onFocusout: this.handleFocusout,
            onKeyup: this.handleKeyUp,
            onKeydown: this.handleKeyDown,
            onMousedown: this.handleMouseDown,
            onMouseenter: this.onMouseenter,
            onMouseleave: this.onMouseleave,
          },
          k(
            e.header,
            (e) =>
              e &&
              o(
                "div",
                { class: `${t}-base-select-menu__header`, "data-header": !0, key: "header" },
                e,
              ),
          ),
          this.loading
            ? o(
                "div",
                { class: `${t}-base-select-menu__loading` },
                o(R, { clsPrefix: t, strokeWidth: 20 }),
              )
            : this.empty
              ? o(
                  "div",
                  { class: `${t}-base-select-menu__empty`, "data-empty": !0 },
                  M(e.empty, () => [
                    o(ce, {
                      theme: l.peers.Empty,
                      themeOverrides: l.peerOverrides.Empty,
                      size: this.size,
                    }),
                  ]),
                )
              : o(
                  T,
                  {
                    ref: "scrollbarRef",
                    theme: l.peers.Scrollbar,
                    themeOverrides: l.peerOverrides.Scrollbar,
                    scrollable: this.scrollable,
                    container: n ? this.virtualListContainer : void 0,
                    content: n ? this.virtualListContent : void 0,
                    onScroll: n ? void 0 : this.doScroll,
                  },
                  {
                    default: () =>
                      n
                        ? o(
                            ae,
                            {
                              ref: "virtualListRef",
                              class: `${t}-virtual-list`,
                              items: this.flattenedNodes,
                              itemSize: this.itemSize,
                              showScrollbar: !1,
                              paddingTop: this.padding.top,
                              paddingBottom: this.padding.bottom,
                              onResize: this.handleVirtualListResize,
                              onScroll: this.handleVirtualListScroll,
                              itemResizable: !0,
                            },
                            {
                              default: ({ item: e }) =>
                                e.isGroup
                                  ? o(Ce, { key: e.key, clsPrefix: t, tmNode: e })
                                  : e.ignored
                                    ? null
                                    : o(Fe, { clsPrefix: t, key: e.key, tmNode: e }),
                            },
                          )
                        : o(
                            "div",
                            {
                              class: `${t}-base-select-menu-option-wrapper`,
                              style: {
                                paddingTop: this.padding.top,
                                paddingBottom: this.padding.bottom,
                              },
                            },
                            this.flattenedNodes.map((e) =>
                              e.isGroup
                                ? o(Ce, { key: e.key, clsPrefix: t, tmNode: e })
                                : o(Fe, { clsPrefix: t, key: e.key, tmNode: e }),
                            ),
                          ),
                  },
                ),
          k(
            e.action,
            (e) =>
              e && [
                o(
                  "div",
                  { class: `${t}-base-select-menu__action`, "data-action": !0, key: "action" },
                  e,
                ),
                o(xe, { onFocus: this.onTabOut, key: "focus-detector" }),
              ],
          ),
        )
      );
    },
  }),
  Pe = S([
    C(
      "base-selection",
      "\n --n-padding-single: var(--n-padding-single-top) var(--n-padding-single-right) var(--n-padding-single-bottom) var(--n-padding-single-left);\n --n-padding-multiple: var(--n-padding-multiple-top) var(--n-padding-multiple-right) var(--n-padding-multiple-bottom) var(--n-padding-multiple-left);\n position: relative;\n z-index: auto;\n box-shadow: none;\n width: 100%;\n max-width: 100%;\n display: inline-block;\n vertical-align: bottom;\n border-radius: var(--n-border-radius);\n min-height: var(--n-height);\n line-height: 1.5;\n font-size: var(--n-font-size);\n ",
      [
        C("base-loading", "\n color: var(--n-loading-color);\n "),
        C("base-selection-tags", "min-height: var(--n-height);"),
        F(
          "border, state-border",
          "\n position: absolute;\n left: 0;\n right: 0;\n top: 0;\n bottom: 0;\n pointer-events: none;\n border: var(--n-border);\n border-radius: inherit;\n transition:\n box-shadow .3s var(--n-bezier),\n border-color .3s var(--n-bezier);\n ",
        ),
        F("state-border", "\n z-index: 1;\n border-color: #0000;\n "),
        C(
          "base-suffix",
          "\n cursor: pointer;\n position: absolute;\n top: 50%;\n transform: translateY(-50%);\n right: 10px;\n ",
          [
            F(
              "arrow",
              "\n font-size: var(--n-arrow-size);\n color: var(--n-arrow-color);\n transition: color .3s var(--n-bezier);\n ",
            ),
          ],
        ),
        C(
          "base-selection-overlay",
          "\n display: flex;\n align-items: center;\n white-space: nowrap;\n pointer-events: none;\n position: absolute;\n top: 0;\n right: 0;\n bottom: 0;\n left: 0;\n padding: var(--n-padding-single);\n transition: color .3s var(--n-bezier);\n ",
          [
            F(
              "wrapper",
              "\n flex-basis: 0;\n flex-grow: 1;\n overflow: hidden;\n text-overflow: ellipsis;\n ",
            ),
          ],
        ),
        C("base-selection-placeholder", "\n color: var(--n-placeholder-color);\n ", [
          F("inner", "\n max-width: 100%;\n overflow: hidden;\n "),
        ]),
        C(
          "base-selection-tags",
          "\n cursor: pointer;\n outline: none;\n box-sizing: border-box;\n position: relative;\n z-index: auto;\n display: flex;\n padding: var(--n-padding-multiple);\n flex-wrap: wrap;\n align-items: center;\n width: 100%;\n vertical-align: bottom;\n background-color: var(--n-color);\n border-radius: inherit;\n transition:\n color .3s var(--n-bezier),\n box-shadow .3s var(--n-bezier),\n background-color .3s var(--n-bezier);\n ",
        ),
        C(
          "base-selection-label",
          "\n height: var(--n-height);\n display: inline-flex;\n width: 100%;\n vertical-align: bottom;\n cursor: pointer;\n outline: none;\n z-index: auto;\n box-sizing: border-box;\n position: relative;\n transition:\n color .3s var(--n-bezier),\n box-shadow .3s var(--n-bezier),\n background-color .3s var(--n-bezier);\n border-radius: inherit;\n background-color: var(--n-color);\n align-items: center;\n ",
          [
            C(
              "base-selection-input",
              "\n font-size: inherit;\n line-height: inherit;\n outline: none;\n cursor: pointer;\n box-sizing: border-box;\n border:none;\n width: 100%;\n padding: var(--n-padding-single);\n background-color: #0000;\n color: var(--n-text-color);\n transition: color .3s var(--n-bezier);\n caret-color: var(--n-caret-color);\n ",
              [
                F(
                  "content",
                  "\n text-overflow: ellipsis;\n overflow: hidden;\n white-space: nowrap; \n ",
                ),
              ],
            ),
            F("render-label", "\n color: var(--n-text-color);\n "),
          ],
        ),
        P("disabled", [
          S("&:hover", [
            F(
              "state-border",
              "\n box-shadow: var(--n-box-shadow-hover);\n border: var(--n-border-hover);\n ",
            ),
          ]),
          O("focus", [
            F(
              "state-border",
              "\n box-shadow: var(--n-box-shadow-focus);\n border: var(--n-border-focus);\n ",
            ),
          ]),
          O("active", [
            F(
              "state-border",
              "\n box-shadow: var(--n-box-shadow-active);\n border: var(--n-border-active);\n ",
            ),
            C("base-selection-label", "background-color: var(--n-color-active);"),
            C("base-selection-tags", "background-color: var(--n-color-active);"),
          ]),
        ]),
        O("disabled", "cursor: not-allowed;", [
          F("arrow", "\n color: var(--n-arrow-color-disabled);\n "),
          C(
            "base-selection-label",
            "\n cursor: not-allowed;\n background-color: var(--n-color-disabled);\n ",
            [
              C(
                "base-selection-input",
                "\n cursor: not-allowed;\n color: var(--n-text-color-disabled);\n ",
              ),
              F("render-label", "\n color: var(--n-text-color-disabled);\n "),
            ],
          ),
          C(
            "base-selection-tags",
            "\n cursor: not-allowed;\n background-color: var(--n-color-disabled);\n ",
          ),
          C(
            "base-selection-placeholder",
            "\n cursor: not-allowed;\n color: var(--n-placeholder-color-disabled);\n ",
          ),
        ]),
        C(
          "base-selection-input-tag",
          "\n height: calc(var(--n-height) - 6px);\n line-height: calc(var(--n-height) - 6px);\n outline: none;\n display: none;\n position: relative;\n margin-bottom: 3px;\n max-width: 100%;\n vertical-align: bottom;\n ",
          [
            F(
              "input",
              "\n font-size: inherit;\n font-family: inherit;\n min-width: 1px;\n padding: 0;\n background-color: #0000;\n outline: none;\n border: none;\n max-width: 100%;\n overflow: hidden;\n width: 1em;\n line-height: inherit;\n cursor: pointer;\n color: var(--n-text-color);\n caret-color: var(--n-caret-color);\n ",
            ),
            F(
              "mirror",
              "\n position: absolute;\n left: 0;\n top: 0;\n white-space: pre;\n visibility: hidden;\n user-select: none;\n -webkit-user-select: none;\n opacity: 0;\n ",
            ),
          ],
        ),
        ["warning", "error"].map((e) =>
          O(`${e}-status`, [
            F("state-border", `border: var(--n-border-${e});`),
            P("disabled", [
              S("&:hover", [
                F(
                  "state-border",
                  `\n box-shadow: var(--n-box-shadow-hover-${e});\n border: var(--n-border-hover-${e});\n `,
                ),
              ]),
              O("active", [
                F(
                  "state-border",
                  `\n box-shadow: var(--n-box-shadow-active-${e});\n border: var(--n-border-active-${e});\n `,
                ),
                C("base-selection-label", `background-color: var(--n-color-active-${e});`),
                C("base-selection-tags", `background-color: var(--n-color-active-${e});`),
              ]),
              O("focus", [
                F(
                  "state-border",
                  `\n box-shadow: var(--n-box-shadow-focus-${e});\n border: var(--n-border-focus-${e});\n `,
                ),
              ]),
            ]),
          ]),
        ),
      ],
    ),
    C(
      "base-selection-popover",
      "\n margin-bottom: -3px;\n display: flex;\n flex-wrap: wrap;\n margin-right: -8px;\n ",
    ),
    C(
      "base-selection-tag-wrapper",
      "\n max-width: 100%;\n display: inline-flex;\n padding: 0 7px 3px 0;\n ",
      [
        S("&:last-child", "padding-right: 0;"),
        C("tag", "\n font-size: 14px;\n max-width: 100%;\n ", [
          F("content", "\n line-height: 1.25;\n text-overflow: ellipsis;\n overflow: hidden;\n "),
        ]),
      ],
    ),
  ]),
  ze = e({
    name: "InternalSelection",
    props: Object.assign(Object.assign({}, A.props), {
      clsPrefix: { type: String, required: !0 },
      bordered: { type: Boolean, default: void 0 },
      active: Boolean,
      pattern: { type: String, default: "" },
      placeholder: String,
      selectedOption: { type: Object, default: null },
      selectedOptions: { type: Array, default: null },
      labelField: { type: String, default: "label" },
      valueField: { type: String, default: "value" },
      multiple: Boolean,
      filterable: Boolean,
      clearable: Boolean,
      disabled: Boolean,
      size: { type: String, default: "medium" },
      loading: Boolean,
      autofocus: Boolean,
      showArrow: { type: Boolean, default: !0 },
      inputProps: Object,
      focused: Boolean,
      renderTag: Function,
      onKeydown: Function,
      onClick: Function,
      onBlur: Function,
      onFocus: Function,
      onDeleteOption: Function,
      maxTagCount: [String, Number],
      ellipsisTagPopoverProps: Object,
      onClear: Function,
      onPatternInput: Function,
      onPatternFocus: Function,
      onPatternBlur: Function,
      renderLabel: Function,
      status: String,
      inlineThemeDisabled: Boolean,
      ignoreComposition: { type: Boolean, default: !0 },
      onResize: Function,
    }),
    setup(e) {
      const { mergedClsPrefixRef: o, mergedRtlRef: t } = B(e),
        a = $("InternalSelection", t, o),
        s = l(null),
        d = l(null),
        p = l(null),
        h = l(null),
        f = l(null),
        b = l(null),
        g = l(null),
        m = l(null),
        y = l(null),
        x = l(null),
        C = l(!1),
        F = l(!1),
        O = l(!1),
        S = A("InternalSelection", "-internal-selection", Pe, L, e, u(e, "clsPrefix")),
        P = c(() => e.clearable && !e.disabled && (O.value || e.active)),
        z = c(() =>
          e.selectedOption
            ? e.renderTag
              ? e.renderTag({ option: e.selectedOption, handleClose: () => {} })
              : e.renderLabel
                ? e.renderLabel(e.selectedOption, !0)
                : w(e.selectedOption[e.labelField], e.selectedOption, !0)
            : e.placeholder,
        ),
        k = c(() => {
          const n = e.selectedOption;
          if (n) return n[e.labelField];
        }),
        R = c(() =>
          e.multiple
            ? !(!Array.isArray(e.selectedOptions) || !e.selectedOptions.length)
            : null !== e.selectedOption,
        );
      function T() {
        var n;
        const { value: o } = s;
        if (o) {
          const { value: t } = d;
          t &&
            ((t.style.width = `${o.offsetWidth}px`),
            "responsive" !== e.maxTagCount &&
              (null === (n = y.value) ||
                void 0 === n ||
                n.sync({ showAllItemsBeforeCalculate: !1 })));
        }
      }
      function M(n) {
        const { onPatternInput: o } = e;
        o && o(n);
      }
      function I(n) {
        !(function (n) {
          const { onDeleteOption: o } = e;
          o && o(n);
        })(n);
      }
      (r(u(e, "active"), (e) => {
        e ||
          (function () {
            const { value: e } = x;
            e && (e.style.display = "none");
          })();
      }),
        r(u(e, "pattern"), () => {
          e.multiple && n(T);
        }));
      const D = l(!1);
      let _ = null;
      let W = null;
      function K() {
        null !== W && window.clearTimeout(W);
      }
      (r(R, (e) => {
        e || (C.value = !1);
      }),
        i(() => {
          v(() => {
            const n = b.value;
            n && (e.disabled ? n.removeAttribute("tabindex") : (n.tabIndex = F.value ? -1 : 0));
          });
        }),
        me(p, e.onResize));
      const { inlineThemeDisabled: V } = e,
        U = c(() => {
          const { size: n } = e,
            {
              common: { cubicBezierEaseInOut: o },
              self: {
                fontWeight: t,
                borderRadius: l,
                color: i,
                placeholderColor: r,
                textColor: a,
                paddingSingle: s,
                paddingMultiple: d,
                caretColor: u,
                colorDisabled: c,
                textColorDisabled: p,
                placeholderColorDisabled: h,
                colorActive: v,
                boxShadowFocus: f,
                boxShadowActive: b,
                boxShadowHover: g,
                border: m,
                borderFocus: w,
                borderHover: y,
                borderActive: x,
                arrowColor: C,
                arrowColorDisabled: F,
                loadingColor: O,
                colorActiveWarning: P,
                boxShadowFocusWarning: z,
                boxShadowActiveWarning: k,
                boxShadowHoverWarning: R,
                borderWarning: T,
                borderFocusWarning: M,
                borderHoverWarning: B,
                borderActiveWarning: $,
                colorActiveError: A,
                boxShadowFocusError: I,
                boxShadowActiveError: D,
                boxShadowHoverError: N,
                borderError: _,
                borderFocusError: L,
                borderHoverError: W,
                borderActiveError: K,
                clearColor: V,
                clearColorHover: U,
                clearColorPressed: H,
                clearSize: q,
                arrowSize: G,
                [j("height", n)]: Y,
                [j("fontSize", n)]: J,
              },
            } = S.value,
            Q = E(s),
            X = E(d);
          return {
            "--n-bezier": o,
            "--n-border": m,
            "--n-border-active": x,
            "--n-border-focus": w,
            "--n-border-hover": y,
            "--n-border-radius": l,
            "--n-box-shadow-active": b,
            "--n-box-shadow-focus": f,
            "--n-box-shadow-hover": g,
            "--n-caret-color": u,
            "--n-color": i,
            "--n-color-active": v,
            "--n-color-disabled": c,
            "--n-font-size": J,
            "--n-height": Y,
            "--n-padding-single-top": Q.top,
            "--n-padding-multiple-top": X.top,
            "--n-padding-single-right": Q.right,
            "--n-padding-multiple-right": X.right,
            "--n-padding-single-left": Q.left,
            "--n-padding-multiple-left": X.left,
            "--n-padding-single-bottom": Q.bottom,
            "--n-padding-multiple-bottom": X.bottom,
            "--n-placeholder-color": r,
            "--n-placeholder-color-disabled": h,
            "--n-text-color": a,
            "--n-text-color-disabled": p,
            "--n-arrow-color": C,
            "--n-arrow-color-disabled": F,
            "--n-loading-color": O,
            "--n-color-active-warning": P,
            "--n-box-shadow-focus-warning": z,
            "--n-box-shadow-active-warning": k,
            "--n-box-shadow-hover-warning": R,
            "--n-border-warning": T,
            "--n-border-focus-warning": M,
            "--n-border-hover-warning": B,
            "--n-border-active-warning": $,
            "--n-color-active-error": A,
            "--n-box-shadow-focus-error": I,
            "--n-box-shadow-active-error": D,
            "--n-box-shadow-hover-error": N,
            "--n-border-error": _,
            "--n-border-focus-error": L,
            "--n-border-hover-error": W,
            "--n-border-active-error": K,
            "--n-clear-size": q,
            "--n-clear-color": V,
            "--n-clear-color-hover": U,
            "--n-clear-color-pressed": H,
            "--n-arrow-size": G,
            "--n-font-weight": t,
          };
        }),
        H = V
          ? N(
              "internal-selection",
              c(() => e.size[0]),
              U,
              e,
            )
          : void 0;
      return {
        mergedTheme: S,
        mergedClearable: P,
        mergedClsPrefix: o,
        rtlEnabled: a,
        patternInputFocused: F,
        filterablePlaceholder: z,
        label: k,
        selected: R,
        showTagsPanel: C,
        isComposing: D,
        counterRef: g,
        counterWrapperRef: m,
        patternInputMirrorRef: s,
        patternInputRef: d,
        selfRef: p,
        multipleElRef: h,
        singleElRef: f,
        patternInputWrapperRef: b,
        overflowRef: y,
        inputTagElRef: x,
        handleMouseDown: function (n) {
          e.active && e.filterable && n.target !== d.value && n.preventDefault();
        },
        handleFocusin: function (n) {
          var o;
          (n.relatedTarget &&
            (null === (o = p.value) || void 0 === o ? void 0 : o.contains(n.relatedTarget))) ||
            (function (n) {
              const { onFocus: o } = e;
              o && o(n);
            })(n);
        },
        handleClear: function (n) {
          !(function (n) {
            const { onClear: o } = e;
            o && o(n);
          })(n);
        },
        handleMouseEnter: function () {
          O.value = !0;
        },
        handleMouseLeave: function () {
          O.value = !1;
        },
        handleDeleteOption: I,
        handlePatternKeyDown: function (n) {
          if ("Backspace" === n.key && !D.value && !e.pattern.length) {
            const { selectedOptions: n } = e;
            (null == n ? void 0 : n.length) && I(n[n.length - 1]);
          }
        },
        handlePatternInputInput: function (n) {
          const { value: o } = s;
          if (o) {
            const e = n.target.value;
            ((o.textContent = e), T());
          }
          e.ignoreComposition && D.value ? (_ = n) : M(n);
        },
        handlePatternInputBlur: function (n) {
          var o;
          ((F.value = !1), null === (o = e.onPatternBlur) || void 0 === o || o.call(e, n));
        },
        handlePatternInputFocus: function (n) {
          var o;
          ((F.value = !0), null === (o = e.onPatternFocus) || void 0 === o || o.call(e, n));
        },
        handleMouseEnterCounter: function () {
          e.active ||
            (K(),
            (W = window.setTimeout(() => {
              R.value && (C.value = !0);
            }, 100)));
        },
        handleMouseLeaveCounter: function () {
          K();
        },
        handleFocusout: function (n) {
          var o;
          (null === (o = p.value) || void 0 === o ? void 0 : o.contains(n.relatedTarget)) ||
            (function (n) {
              const { onBlur: o } = e;
              o && o(n);
            })(n);
        },
        handleCompositionEnd: function () {
          ((D.value = !1), e.ignoreComposition && M(_), (_ = null));
        },
        handleCompositionStart: function () {
          D.value = !0;
        },
        onPopoverUpdateShow: function (e) {
          e || (K(), (C.value = !1));
        },
        focus: function () {
          var n, o, t;
          e.filterable
            ? ((F.value = !1), null === (n = b.value) || void 0 === n || n.focus())
            : e.multiple
              ? null === (o = h.value) || void 0 === o || o.focus()
              : null === (t = f.value) || void 0 === t || t.focus();
        },
        focusInput: function () {
          const { value: e } = d;
          e &&
            (!(function () {
              const { value: e } = x;
              e && (e.style.display = "inline-block");
            })(),
            e.focus());
        },
        blur: function () {
          var n, o;
          if (e.filterable)
            ((F.value = !1),
              null === (n = b.value) || void 0 === n || n.blur(),
              null === (o = d.value) || void 0 === o || o.blur());
          else if (e.multiple) {
            const { value: e } = h;
            null == e || e.blur();
          } else {
            const { value: e } = f;
            null == e || e.blur();
          }
        },
        blurInput: function () {
          const { value: e } = d;
          e && e.blur();
        },
        updateCounter: function (e) {
          const { value: n } = g;
          n && n.setTextContent(`+${e}`);
        },
        getCounter: function () {
          const { value: e } = m;
          return e;
        },
        getTail: function () {
          return d.value;
        },
        renderLabel: e.renderLabel,
        cssVars: V ? void 0 : U,
        themeClass: null == H ? void 0 : H.themeClass,
        onRender: null == H ? void 0 : H.onRender,
      };
    },
    render() {
      const {
        status: e,
        multiple: n,
        size: t,
        disabled: l,
        filterable: i,
        maxTagCount: r,
        bordered: a,
        clsPrefix: s,
        ellipsisTagPopoverProps: d,
        onRender: u,
        renderTag: c,
        renderLabel: p,
      } = this;
      null == u || u();
      const v = "responsive" === r,
        f = "number" == typeof r,
        b = v || f,
        g = o(_, null, {
          default: () =>
            o(
              oe,
              {
                clsPrefix: s,
                loading: this.loading,
                showArrow: this.showArrow,
                showClear: this.mergedClearable && this.selected,
                onClear: this.handleClear,
              },
              {
                default: () => {
                  var e, n;
                  return null === (n = (e = this.$slots).arrow) || void 0 === n
                    ? void 0
                    : n.call(e);
                },
              },
            ),
        });
      let m;
      if (n) {
        const { labelField: e } = this,
          n = (n) =>
            o(
              "div",
              { class: `${s}-base-selection-tag-wrapper`, key: n.value },
              c
                ? c({
                    option: n,
                    handleClose: () => {
                      this.handleDeleteOption(n);
                    },
                  })
                : o(
                    te,
                    {
                      size: t,
                      closable: !n.disabled,
                      disabled: l,
                      onClose: () => {
                        this.handleDeleteOption(n);
                      },
                      internalCloseIsButtonTag: !1,
                      internalCloseFocusable: !1,
                    },
                    { default: () => (p ? p(n, !0) : w(n[e], n, !0)) },
                  ),
            ),
          a = () => (f ? this.selectedOptions.slice(0, r) : this.selectedOptions).map(n),
          u = i
            ? o(
                "div",
                {
                  class: `${s}-base-selection-input-tag`,
                  ref: "inputTagElRef",
                  key: "__input-tag__",
                },
                o(
                  "input",
                  Object.assign({}, this.inputProps, {
                    ref: "patternInputRef",
                    tabindex: -1,
                    disabled: l,
                    value: this.pattern,
                    autofocus: this.autofocus,
                    class: `${s}-base-selection-input-tag__input`,
                    onBlur: this.handlePatternInputBlur,
                    onFocus: this.handlePatternInputFocus,
                    onKeydown: this.handlePatternKeyDown,
                    onInput: this.handlePatternInputInput,
                    onCompositionstart: this.handleCompositionStart,
                    onCompositionend: this.handleCompositionEnd,
                  }),
                ),
                o(
                  "span",
                  { ref: "patternInputMirrorRef", class: `${s}-base-selection-input-tag__mirror` },
                  this.pattern,
                ),
              )
            : null,
          y = v
            ? () =>
                o(
                  "div",
                  { class: `${s}-base-selection-tag-wrapper`, ref: "counterWrapperRef" },
                  o(te, {
                    size: t,
                    ref: "counterRef",
                    onMouseenter: this.handleMouseEnterCounter,
                    onMouseleave: this.handleMouseLeaveCounter,
                    disabled: l,
                  }),
                )
            : void 0;
        let x;
        if (f) {
          const e = this.selectedOptions.length - r;
          e > 0 &&
            (x = o(
              "div",
              { class: `${s}-base-selection-tag-wrapper`, key: "__counter__" },
              o(
                te,
                {
                  size: t,
                  ref: "counterRef",
                  onMouseenter: this.handleMouseEnterCounter,
                  disabled: l,
                },
                { default: () => `+${e}` },
              ),
            ));
        }
        const C = v
            ? i
              ? o(
                  ge,
                  {
                    ref: "overflowRef",
                    updateCounter: this.updateCounter,
                    getCounter: this.getCounter,
                    getTail: this.getTail,
                    style: { width: "100%", display: "flex", overflow: "hidden" },
                  },
                  { default: a, counter: y, tail: () => u },
                )
              : o(
                  ge,
                  {
                    ref: "overflowRef",
                    updateCounter: this.updateCounter,
                    getCounter: this.getCounter,
                    style: { width: "100%", display: "flex", overflow: "hidden" },
                  },
                  { default: a, counter: y },
                )
            : f && x
              ? a().concat(x)
              : a(),
          F = b
            ? () =>
                o(
                  "div",
                  { class: `${s}-base-selection-popover` },
                  v ? a() : this.selectedOptions.map(n),
                )
            : void 0,
          O = b
            ? Object.assign(
                {
                  show: this.showTagsPanel,
                  trigger: "hover",
                  overlap: !0,
                  placement: "top",
                  width: "trigger",
                  onUpdateShow: this.onPopoverUpdateShow,
                  theme: this.mergedTheme.peers.Popover,
                  themeOverrides: this.mergedTheme.peerOverrides.Popover,
                },
                d,
              )
            : null,
          S =
            !this.selected && (!this.active || (!this.pattern && !this.isComposing))
              ? o(
                  "div",
                  { class: `${s}-base-selection-placeholder ${s}-base-selection-overlay` },
                  o("div", { class: `${s}-base-selection-placeholder__inner` }, this.placeholder),
                )
              : null,
          P = i
            ? o(
                "div",
                { ref: "patternInputWrapperRef", class: `${s}-base-selection-tags` },
                C,
                v ? null : u,
                g,
              )
            : o(
                "div",
                {
                  ref: "multipleElRef",
                  class: `${s}-base-selection-tags`,
                  tabindex: l ? void 0 : 0,
                },
                C,
                g,
              );
        m = o(
          h,
          null,
          b
            ? o(
                Q,
                Object.assign({}, O, {
                  scrollable: !0,
                  style: "max-height: calc(var(--v-target-height) * 6.6);",
                }),
                { trigger: () => P, default: F },
              )
            : P,
          S,
        );
      } else if (i) {
        const e = this.pattern || this.isComposing,
          n = this.active ? !e : !this.selected,
          t = !this.active && this.selected;
        m = o(
          "div",
          {
            ref: "patternInputWrapperRef",
            class: `${s}-base-selection-label`,
            title: this.patternInputFocused ? void 0 : re(this.label),
          },
          o(
            "input",
            Object.assign({}, this.inputProps, {
              ref: "patternInputRef",
              class: `${s}-base-selection-input`,
              value: this.active ? this.pattern : "",
              placeholder: "",
              readonly: l,
              disabled: l,
              tabindex: -1,
              autofocus: this.autofocus,
              onFocus: this.handlePatternInputFocus,
              onBlur: this.handlePatternInputBlur,
              onInput: this.handlePatternInputInput,
              onCompositionstart: this.handleCompositionStart,
              onCompositionend: this.handleCompositionEnd,
            }),
          ),
          t
            ? o(
                "div",
                {
                  class: `${s}-base-selection-label__render-label ${s}-base-selection-overlay`,
                  key: "input",
                },
                o(
                  "div",
                  { class: `${s}-base-selection-overlay__wrapper` },
                  c
                    ? c({ option: this.selectedOption, handleClose: () => {} })
                    : p
                      ? p(this.selectedOption, !0)
                      : w(this.label, this.selectedOption, !0),
                ),
              )
            : null,
          n
            ? o(
                "div",
                {
                  class: `${s}-base-selection-placeholder ${s}-base-selection-overlay`,
                  key: "placeholder",
                },
                o(
                  "div",
                  { class: `${s}-base-selection-overlay__wrapper` },
                  this.filterablePlaceholder,
                ),
              )
            : null,
          g,
        );
      } else
        m = o(
          "div",
          {
            ref: "singleElRef",
            class: `${s}-base-selection-label`,
            tabindex: this.disabled ? void 0 : 0,
          },
          void 0 !== this.label
            ? o(
                "div",
                { class: `${s}-base-selection-input`, title: re(this.label), key: "input" },
                o(
                  "div",
                  { class: `${s}-base-selection-input__content` },
                  c
                    ? c({ option: this.selectedOption, handleClose: () => {} })
                    : p
                      ? p(this.selectedOption, !0)
                      : w(this.label, this.selectedOption, !0),
                ),
              )
            : o(
                "div",
                {
                  class: `${s}-base-selection-placeholder ${s}-base-selection-overlay`,
                  key: "placeholder",
                },
                o("div", { class: `${s}-base-selection-placeholder__inner` }, this.placeholder),
              ),
          g,
        );
      return o(
        "div",
        {
          ref: "selfRef",
          class: [
            `${s}-base-selection`,
            this.rtlEnabled && `${s}-base-selection--rtl`,
            this.themeClass,
            e && `${s}-base-selection--${e}-status`,
            {
              [`${s}-base-selection--active`]: this.active,
              [`${s}-base-selection--selected`]: this.selected || (this.active && this.pattern),
              [`${s}-base-selection--disabled`]: this.disabled,
              [`${s}-base-selection--multiple`]: this.multiple,
              [`${s}-base-selection--focus`]: this.focused,
            },
          ],
          style: this.cssVars,
          onClick: this.onClick,
          onMouseenter: this.handleMouseEnter,
          onMouseleave: this.handleMouseLeave,
          onKeydown: this.onKeydown,
          onFocusin: this.handleFocusin,
          onFocusout: this.handleFocusout,
          onMousedown: this.handleMouseDown,
        },
        m,
        a ? o("div", { class: `${s}-base-selection__border` }) : null,
        a ? o("div", { class: `${s}-base-selection__state-border` }) : null,
      );
    },
  });
function ke(e) {
  return "group" === e.type;
}
function Re(e) {
  return "ignored" === e.type;
}
function Te(e, n) {
  try {
    return !!(1 + n.toString().toLowerCase().indexOf(e.trim().toLowerCase()));
  } catch (o) {
    return !1;
  }
}
function Me(e, n) {
  return {
    getIsGroup: ke,
    getIgnored: Re,
    getKey: (n) => (ke(n) ? n.name || n.key || "key-required" : n[e]),
    getChildren: (e) => e[n],
  };
}
const Be = S([
    C(
      "select",
      "\n z-index: auto;\n outline: none;\n width: 100%;\n position: relative;\n font-weight: var(--n-font-weight);\n ",
    ),
    C("select-menu", "\n margin: 4px 0;\n box-shadow: var(--n-menu-box-shadow);\n ", [
      z({
        originalTransition: "background-color .3s var(--n-bezier), box-shadow .3s var(--n-bezier)",
      }),
    ]),
  ]),
  $e = e({
    name: "Select",
    props: Object.assign(Object.assign({}, A.props), {
      to: ne.propTo,
      bordered: { type: Boolean, default: void 0 },
      clearable: Boolean,
      clearFilterAfterSelect: { type: Boolean, default: !0 },
      options: { type: Array, default: () => [] },
      defaultValue: { type: [String, Number, Array], default: null },
      keyboard: { type: Boolean, default: !0 },
      value: [String, Number, Array],
      placeholder: String,
      menuProps: Object,
      multiple: Boolean,
      size: String,
      menuSize: { type: String },
      filterable: Boolean,
      disabled: { type: Boolean, default: void 0 },
      remote: Boolean,
      loading: Boolean,
      filter: Function,
      placement: { type: String, default: "bottom-start" },
      widthMode: { type: String, default: "trigger" },
      tag: Boolean,
      onCreate: Function,
      fallbackOption: { type: [Function, Boolean], default: void 0 },
      show: { type: Boolean, default: void 0 },
      showArrow: { type: Boolean, default: !0 },
      maxTagCount: [Number, String],
      ellipsisTagPopoverProps: Object,
      consistentMenuWidth: { type: Boolean, default: !0 },
      virtualScroll: { type: Boolean, default: !0 },
      labelField: { type: String, default: "label" },
      valueField: { type: String, default: "value" },
      childrenField: { type: String, default: "children" },
      renderLabel: Function,
      renderOption: Function,
      renderTag: Function,
      "onUpdate:value": [Function, Array],
      inputProps: Object,
      nodeProps: Function,
      ignoreComposition: { type: Boolean, default: !0 },
      showOnFocus: Boolean,
      onUpdateValue: [Function, Array],
      onBlur: [Function, Array],
      onClear: [Function, Array],
      onFocus: [Function, Array],
      onScroll: [Function, Array],
      onSearch: [Function, Array],
      onUpdateShow: [Function, Array],
      "onUpdate:show": [Function, Array],
      displayDirective: { type: String, default: "show" },
      resetMenuOnOptionsChange: { type: Boolean, default: !0 },
      status: String,
      showCheckmark: { type: Boolean, default: !0 },
      onChange: [Function, Array],
      items: Array,
    }),
    slots: Object,
    setup(e) {
      const {
          mergedClsPrefixRef: n,
          mergedBorderedRef: o,
          namespaceRef: t,
          inlineThemeDisabled: i,
        } = B(e),
        a = A("Select", "-select", Be, K, e, n),
        s = l(e.defaultValue),
        d = u(e, "value"),
        p = pe(d, s),
        h = l(!1),
        v = l(""),
        f = he(e, ["items", "options"]),
        b = l([]),
        g = l([]),
        m = c(() => g.value.concat(b.value).concat(f.value)),
        w = c(() => {
          const { filter: n } = e;
          if (n) return n;
          const { labelField: o, valueField: t } = e;
          return (e, n) => {
            if (!n) return !1;
            const l = n[o];
            if ("string" == typeof l) return Te(e, l);
            const i = n[t];
            return "string" == typeof i ? Te(e, i) : "number" == typeof i && Te(e, String(i));
          };
        }),
        y = c(() => {
          if (e.remote) return f.value;
          {
            const { value: n } = m,
              { value: o } = v;
            return o.length && e.filterable
              ? (function (e, n, o, t) {
                  return n
                    ? (function e(l) {
                        if (!Array.isArray(l)) return [];
                        const i = [];
                        for (const r of l)
                          if (ke(r)) {
                            const n = e(r[t]);
                            n.length && i.push(Object.assign({}, r, { [t]: n }));
                          } else {
                            if (Re(r)) continue;
                            n(o, r) && i.push(r);
                          }
                        return i;
                      })(e)
                    : e;
                })(n, w.value, o, e.childrenField)
              : n;
          }
        }),
        x = c(() => {
          const { valueField: n, childrenField: o } = e,
            t = Me(n, o);
          return ue(y.value, t);
        }),
        C = c(() =>
          (function (e, n, o) {
            const t = new Map();
            return (
              e.forEach((e) => {
                ke(e)
                  ? e[o].forEach((e) => {
                      t.set(e[n], e);
                    })
                  : t.set(e[n], e);
              }),
              t
            );
          })(m.value, e.valueField, e.childrenField),
        ),
        F = l(!1),
        O = pe(u(e, "show"), F),
        S = l(null),
        P = l(null),
        z = l(null),
        { localeRef: k } = ve("Select"),
        R = c(() => {
          var n;
          return null !== (n = e.placeholder) && void 0 !== n ? n : k.value.placeholder;
        }),
        T = [],
        M = l(new Map()),
        $ = c(() => {
          const { fallbackOption: n } = e;
          if (void 0 === n) {
            const { labelField: n, valueField: o } = e;
            return (e) => ({ [n]: String(e), [o]: e });
          }
          return !1 !== n && ((e) => Object.assign(n(e), { value: e }));
        });
      function I(n) {
        const o = e.remote,
          { value: t } = M,
          { value: l } = C,
          { value: i } = $,
          r = [];
        return (
          n.forEach((e) => {
            if (l.has(e)) r.push(l.get(e));
            else if (o && t.has(e)) r.push(t.get(e));
            else if (i) {
              const n = i(e);
              n && r.push(n);
            }
          }),
          r
        );
      }
      const D = c(() => {
          if (e.multiple) {
            const { value: e } = p;
            return Array.isArray(e) ? I(e) : [];
          }
          return null;
        }),
        j = c(() => {
          const { value: n } = p;
          return e.multiple || Array.isArray(n) || null === n ? null : I([n])[0] || null;
        }),
        E = V(e),
        { mergedSizeRef: _, mergedDisabledRef: L, mergedStatusRef: W } = E;
      function Y(n, o) {
        const { onChange: t, "onUpdate:value": l, onUpdateValue: i } = e,
          { nTriggerFormChange: r, nTriggerFormInput: a } = E;
        (t && G(t, n, o), i && G(i, n, o), l && G(l, n, o), (s.value = n), r(), a());
      }
      function J(n) {
        const { onBlur: o } = e,
          { nTriggerFormBlur: t } = E;
        (o && G(o, n), t());
      }
      function Q() {
        var n;
        const { remote: o, multiple: t } = e;
        if (o) {
          const { value: o } = M;
          if (t) {
            const { valueField: t } = e;
            null === (n = D.value) ||
              void 0 === n ||
              n.forEach((e) => {
                o.set(e[t], e);
              });
          } else {
            const n = j.value;
            n && o.set(n[e.valueField], n);
          }
        }
      }
      function X(n) {
        const { onUpdateShow: o, "onUpdate:show": t } = e;
        (o && G(o, n), t && G(t, n), (F.value = n));
      }
      function Z() {
        L.value || (X(!0), (F.value = !0), e.filterable && ce());
      }
      function ee() {
        X(!1);
      }
      function oe() {
        ((v.value = ""), (g.value = T));
      }
      const te = l(!1);
      function le(e) {
        ie(e.rawNode);
      }
      function ie(n) {
        if (L.value) return;
        const { tag: o, remote: t, clearFilterAfterSelect: l, valueField: i } = e;
        if (o && !t) {
          const { value: e } = g,
            n = e[0] || null;
          if (n) {
            const e = b.value;
            (e.length ? e.push(n) : (b.value = [n]), (g.value = T));
          }
        }
        if ((t && M.value.set(n[i], n), e.multiple)) {
          const r = (function (n) {
              if (!Array.isArray(n)) return [];
              if ($.value) return Array.from(n);
              {
                const { remote: o } = e,
                  { value: t } = C;
                if (o) {
                  const { value: e } = M;
                  return n.filter((n) => t.has(n) || e.has(n));
                }
                return n.filter((e) => t.has(e));
              }
            })(p.value),
            a = r.findIndex((e) => e === n[i]);
          if (~a) {
            if ((r.splice(a, 1), o && !t)) {
              const e = re(n[i]);
              ~e && (b.value.splice(e, 1), l && (v.value = ""));
            }
          } else (r.push(n[i]), l && (v.value = ""));
          Y(r, I(r));
        } else {
          if (o && !t) {
            const e = re(n[i]);
            b.value = ~e ? [b.value[e]] : T;
          }
          (se(), ee(), Y(n[i], n));
        }
      }
      function re(n) {
        return b.value.findIndex((o) => o[e.valueField] === n);
      }
      function ae(n) {
        var o, t, l, i, r;
        if (e.keyboard)
          switch (n.key) {
            case " ":
              if (e.filterable) break;
              n.preventDefault();
            case "Enter":
              if (!(null === (o = S.value) || void 0 === o ? void 0 : o.isComposing))
                if (O.value) {
                  const n = null === (t = z.value) || void 0 === t ? void 0 : t.getPendingTmNode();
                  n ? le(n) : e.filterable || (ee(), se());
                } else if ((Z(), e.tag && te.value)) {
                  const n = g.value[0];
                  if (n) {
                    const o = n[e.valueField],
                      { value: t } = p;
                    (e.multiple && Array.isArray(t) && t.includes(o)) || ie(n);
                  }
                }
              n.preventDefault();
              break;
            case "ArrowUp":
              if ((n.preventDefault(), e.loading)) return;
              O.value && (null === (l = z.value) || void 0 === l || l.prev());
              break;
            case "ArrowDown":
              if ((n.preventDefault(), e.loading)) return;
              O.value ? null === (i = z.value) || void 0 === i || i.next() : Z();
              break;
            case "Escape":
              (O.value && (q(n), ee()), null === (r = S.value) || void 0 === r || r.focus());
          }
        else n.preventDefault();
      }
      function se() {
        var e;
        null === (e = S.value) || void 0 === e || e.focus();
      }
      function ce() {
        var e;
        null === (e = S.value) || void 0 === e || e.focusInput();
      }
      (Q(), r(u(e, "options"), Q));
      const fe = {
          focus: () => {
            var e;
            null === (e = S.value) || void 0 === e || e.focus();
          },
          focusInput: () => {
            var e;
            null === (e = S.value) || void 0 === e || e.focusInput();
          },
          blur: () => {
            var e;
            null === (e = S.value) || void 0 === e || e.blur();
          },
          blurInput: () => {
            var e;
            null === (e = S.value) || void 0 === e || e.blurInput();
          },
        },
        be = c(() => {
          const {
            self: { menuBoxShadow: e },
          } = a.value;
          return { "--n-menu-box-shadow": e };
        }),
        ge = i ? N("select", void 0, be, e) : void 0;
      return Object.assign(Object.assign({}, fe), {
        mergedStatus: W,
        mergedClsPrefix: n,
        mergedBordered: o,
        namespace: t,
        treeMate: x,
        isMounted: U(),
        triggerRef: S,
        menuRef: z,
        pattern: v,
        uncontrolledShow: F,
        mergedShow: O,
        adjustedTo: ne(e),
        uncontrolledValue: s,
        mergedValue: p,
        followerRef: P,
        localizedPlaceholder: R,
        selectedOption: j,
        selectedOptions: D,
        mergedSize: _,
        mergedDisabled: L,
        focused: h,
        activeWithoutMenuOpen: te,
        inlineThemeDisabled: i,
        onTriggerInputFocus: function () {
          e.filterable && (te.value = !0);
        },
        onTriggerInputBlur: function () {
          e.filterable && ((te.value = !1), O.value || oe());
        },
        handleTriggerOrMenuResize: function () {
          var e;
          O.value && (null === (e = P.value) || void 0 === e || e.syncPosition());
        },
        handleMenuFocus: function () {
          h.value = !0;
        },
        handleMenuBlur: function (e) {
          var n;
          (null === (n = S.value) || void 0 === n ? void 0 : n.$el.contains(e.relatedTarget)) ||
            ((h.value = !1), J(e), ee());
        },
        handleMenuTabOut: function () {
          var e;
          (null === (e = S.value) || void 0 === e || e.focus(), ee());
        },
        handleTriggerClick: function () {
          L.value || (O.value ? (e.filterable ? ce() : ee()) : Z());
        },
        handleToggle: le,
        handleDeleteOption: ie,
        handlePatternInput: function (n) {
          O.value || Z();
          const { value: o } = n.target;
          v.value = o;
          const { tag: t, remote: l } = e;
          if (
            ((function (n) {
              const { onSearch: o } = e;
              o && G(o, n);
            })(o),
            t && !l)
          ) {
            if (!o) return void (g.value = T);
            const { onCreate: n } = e,
              t = n ? n(o) : { [e.labelField]: o, [e.valueField]: o },
              { valueField: l, labelField: i } = e;
            f.value.some((e) => e[l] === t[l] || e[i] === t[i]) ||
            b.value.some((e) => e[l] === t[l] || e[i] === t[i])
              ? (g.value = T)
              : (g.value = [t]);
          }
        },
        handleClear: function (n) {
          n.stopPropagation();
          const { multiple: o } = e;
          (!o && e.filterable && ee(),
            (function () {
              const { onClear: n } = e;
              n && G(n);
            })(),
            o ? Y([], []) : Y(null, null));
        },
        handleTriggerBlur: function (e) {
          var n, o;
          (null === (o = null === (n = z.value) || void 0 === n ? void 0 : n.selfRef) ||
          void 0 === o
            ? void 0
            : o.contains(e.relatedTarget)) || ((h.value = !1), J(e), ee());
        },
        handleTriggerFocus: function (n) {
          (!(function (n) {
            const { onFocus: o, showOnFocus: t } = e,
              { nTriggerFormFocus: l } = E;
            (o && G(o, n), l(), t && Z());
          })(n),
            (h.value = !0));
        },
        handleKeydown: ae,
        handleMenuAfterLeave: oe,
        handleMenuClickOutside: function (e) {
          var n;
          O.value &&
            ((null === (n = S.value) || void 0 === n ? void 0 : n.$el.contains(H(e))) || ee());
        },
        handleMenuScroll: function (n) {
          !(function (n) {
            const { onScroll: o } = e;
            o && G(o, n);
          })(n);
        },
        handleMenuKeydown: ae,
        handleMenuMousedown: function (e) {
          de(e, "action") || de(e, "empty") || de(e, "header") || e.preventDefault();
        },
        mergedTheme: a,
        cssVars: i ? void 0 : be,
        themeClass: null == ge ? void 0 : ge.themeClass,
        onRender: null == ge ? void 0 : ge.onRender,
      });
    },
    render() {
      return o(
        "div",
        { class: `${this.mergedClsPrefix}-select` },
        o(X, null, {
          default: () => [
            o(Z, null, {
              default: () =>
                o(
                  ze,
                  {
                    ref: "triggerRef",
                    inlineThemeDisabled: this.inlineThemeDisabled,
                    status: this.mergedStatus,
                    inputProps: this.inputProps,
                    clsPrefix: this.mergedClsPrefix,
                    showArrow: this.showArrow,
                    maxTagCount: this.maxTagCount,
                    ellipsisTagPopoverProps: this.ellipsisTagPopoverProps,
                    bordered: this.mergedBordered,
                    active: this.activeWithoutMenuOpen || this.mergedShow,
                    pattern: this.pattern,
                    placeholder: this.localizedPlaceholder,
                    selectedOption: this.selectedOption,
                    selectedOptions: this.selectedOptions,
                    multiple: this.multiple,
                    renderTag: this.renderTag,
                    renderLabel: this.renderLabel,
                    filterable: this.filterable,
                    clearable: this.clearable,
                    disabled: this.mergedDisabled,
                    size: this.mergedSize,
                    theme: this.mergedTheme.peers.InternalSelection,
                    labelField: this.labelField,
                    valueField: this.valueField,
                    themeOverrides: this.mergedTheme.peerOverrides.InternalSelection,
                    loading: this.loading,
                    focused: this.focused,
                    onClick: this.handleTriggerClick,
                    onDeleteOption: this.handleDeleteOption,
                    onPatternInput: this.handlePatternInput,
                    onClear: this.handleClear,
                    onBlur: this.handleTriggerBlur,
                    onFocus: this.handleTriggerFocus,
                    onKeydown: this.handleKeydown,
                    onPatternBlur: this.onTriggerInputBlur,
                    onPatternFocus: this.onTriggerInputFocus,
                    onResize: this.handleTriggerOrMenuResize,
                    ignoreComposition: this.ignoreComposition,
                  },
                  {
                    arrow: () => {
                      var e, n;
                      return [
                        null === (n = (e = this.$slots).arrow) || void 0 === n ? void 0 : n.call(e),
                      ];
                    },
                  },
                ),
            }),
            o(
              ee,
              {
                ref: "followerRef",
                show: this.mergedShow,
                to: this.adjustedTo,
                teleportDisabled: this.adjustedTo === ne.tdkey,
                containerClass: this.namespace,
                width: this.consistentMenuWidth ? "target" : void 0,
                minWidth: "target",
                placement: this.placement,
              },
              {
                default: () =>
                  o(
                    d,
                    {
                      name: "fade-in-scale-up-transition",
                      appear: this.isMounted,
                      onAfterLeave: this.handleMenuAfterLeave,
                    },
                    {
                      default: () => {
                        var e, n, t;
                        return this.mergedShow || "show" === this.displayDirective
                          ? (null === (e = this.onRender) || void 0 === e || e.call(this),
                            f(
                              o(
                                Se,
                                Object.assign({}, this.menuProps, {
                                  ref: "menuRef",
                                  onResize: this.handleTriggerOrMenuResize,
                                  inlineThemeDisabled: this.inlineThemeDisabled,
                                  virtualScroll: this.consistentMenuWidth && this.virtualScroll,
                                  class: [
                                    `${this.mergedClsPrefix}-select-menu`,
                                    this.themeClass,
                                    null === (n = this.menuProps) || void 0 === n
                                      ? void 0
                                      : n.class,
                                  ],
                                  clsPrefix: this.mergedClsPrefix,
                                  focusable: !0,
                                  labelField: this.labelField,
                                  valueField: this.valueField,
                                  autoPending: !0,
                                  nodeProps: this.nodeProps,
                                  theme: this.mergedTheme.peers.InternalSelectMenu,
                                  themeOverrides: this.mergedTheme.peerOverrides.InternalSelectMenu,
                                  treeMate: this.treeMate,
                                  multiple: this.multiple,
                                  size: this.menuSize,
                                  renderOption: this.renderOption,
                                  renderLabel: this.renderLabel,
                                  value: this.mergedValue,
                                  style: [
                                    null === (t = this.menuProps) || void 0 === t
                                      ? void 0
                                      : t.style,
                                    this.cssVars,
                                  ],
                                  onToggle: this.handleToggle,
                                  onScroll: this.handleMenuScroll,
                                  onFocus: this.handleMenuFocus,
                                  onBlur: this.handleMenuBlur,
                                  onKeydown: this.handleMenuKeydown,
                                  onTabOut: this.handleMenuTabOut,
                                  onMousedown: this.handleMenuMousedown,
                                  show: this.mergedShow,
                                  showCheckmark: this.showCheckmark,
                                  resetMenuOnOptionsChange: this.resetMenuOnOptionsChange,
                                }),
                                {
                                  empty: () => {
                                    var e, n;
                                    return [
                                      null === (n = (e = this.$slots).empty) || void 0 === n
                                        ? void 0
                                        : n.call(e),
                                    ];
                                  },
                                  header: () => {
                                    var e, n;
                                    return [
                                      null === (n = (e = this.$slots).header) || void 0 === n
                                        ? void 0
                                        : n.call(e),
                                    ];
                                  },
                                  action: () => {
                                    var e, n;
                                    return [
                                      null === (n = (e = this.$slots).action) || void 0 === n
                                        ? void 0
                                        : n.call(e),
                                    ];
                                  },
                                },
                              ),
                              "show" === this.displayDirective
                                ? [
                                    [b, this.mergedShow],
                                    [W, this.handleMenuClickOutside, void 0, { capture: !0 }],
                                  ]
                                : [[W, this.handleMenuClickOutside, void 0, { capture: !0 }]],
                            ))
                          : null;
                      },
                    },
                  ),
              },
            ),
          ],
        }),
      );
    },
  });
export { xe as F, Se as N, $e as _, Me as c, we as m };
