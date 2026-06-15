import { B as e, V as o, a as n, r, _ as t, p as i } from "./Popover-Z03uJL-I.js";
import {
  c2 as d,
  aq as l,
  ap as a,
  o as s,
  bq as u,
  P as p,
  bH as c,
  Q as v,
  bk as f,
  bI as h,
  bG as b,
  x as m,
  aO as w,
  z as y,
  aP as g,
  G as x,
  y as k,
  A as S,
  t as N,
  D as P,
  c3 as R,
  aU as C,
  v as O,
  F as I,
} from "./index-Ct5UuHQN.js";
import {
  G as $,
  o as z,
  b as A,
  a as F,
  w as j,
  r as _,
  j as K,
  k as L,
  i as T,
  v as D,
  q as M,
  c as B,
  p as E,
  F as H,
  t as q,
} from "./vendor-DHo7BzsC.js";
import { N as U } from "./Icon-BkVA54F2.js";
import { h as G, c as W } from "./create-D0sloWoF.js";
import { u as V } from "./use-merged-state-mPE1JA5r.js";
function Q(e = {}, o) {
  const n = $({ ctrl: !1, command: !1, win: !1, shift: !1, tab: !1 }),
    { keydown: r, keyup: t } = e,
    i = (e) => {
      switch (e.key) {
        case "Control":
          n.ctrl = !0;
          break;
        case "Meta":
          ((n.command = !0), (n.win = !0));
          break;
        case "Shift":
          n.shift = !0;
          break;
        case "Tab":
          n.tab = !0;
      }
      void 0 !== r &&
        Object.keys(r).forEach((o) => {
          if (o !== e.key) return;
          const n = r[o];
          if ("function" == typeof n) n(e);
          else {
            const { stop: o = !1, prevent: r = !1 } = n;
            (o && e.stopPropagation(), r && e.preventDefault(), n.handler(e));
          }
        });
    },
    s = (e) => {
      switch (e.key) {
        case "Control":
          n.ctrl = !1;
          break;
        case "Meta":
          ((n.command = !1), (n.win = !1));
          break;
        case "Shift":
          n.shift = !1;
          break;
        case "Tab":
          n.tab = !1;
      }
      void 0 !== t &&
        Object.keys(t).forEach((o) => {
          if (o !== e.key) return;
          const n = t[o];
          if ("function" == typeof n) n(e);
          else {
            const { stop: o = !1, prevent: r = !1 } = n;
            (o && e.stopPropagation(), r && e.preventDefault(), n.handler(e));
          }
        });
    },
    u = () => {
      ((void 0 === o || o.value) && (a("keydown", document, i), a("keyup", document, s)),
        void 0 !== o &&
          j(o, (e) => {
            e
              ? (a("keydown", document, i), a("keyup", document, s))
              : (l("keydown", document, i), l("keyup", document, s));
          }));
    };
  return (
    d()
      ? (z(u),
        A(() => {
          (void 0 === o || o.value) && (l("keydown", document, i), l("keyup", document, s));
        }))
      : u(),
    F(n)
  );
}
function Z(e) {
  return (o) => {
    e.value = o ? o.$el : null;
  };
}
const J = K({
    name: "ChevronRight",
    render: () =>
      L(
        "svg",
        { viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        L("path", {
          d: "M5.64645 3.14645C5.45118 3.34171 5.45118 3.65829 5.64645 3.85355L9.79289 8L5.64645 12.1464C5.45118 12.3417 5.45118 12.6583 5.64645 12.8536C5.84171 13.0488 6.15829 13.0488 6.35355 12.8536L10.8536 8.35355C11.0488 8.15829 11.0488 7.84171 10.8536 7.64645L6.35355 3.14645C6.15829 2.95118 5.84171 2.95118 5.64645 3.14645Z",
          fill: "currentColor",
        }),
      ),
  }),
  X = s("n-dropdown-menu"),
  Y = s("n-dropdown"),
  ee = s("n-dropdown-option"),
  oe = K({
    name: "DropdownDivider",
    props: { clsPrefix: { type: String, required: !0 } },
    render() {
      return L("div", { class: `${this.clsPrefix}-dropdown-divider` });
    },
  }),
  ne = K({
    name: "DropdownGroupHeader",
    props: { clsPrefix: { type: String, required: !0 }, tmNode: { type: Object, required: !0 } },
    setup() {
      const { showIconRef: e, hasSubmenuRef: o } = T(X),
        { renderLabelRef: n, labelFieldRef: r, nodePropsRef: t, renderOptionRef: i } = T(Y);
      return {
        labelField: r,
        showIcon: e,
        hasSubmenu: o,
        renderLabel: n,
        nodeProps: t,
        renderOption: i,
      };
    },
    render() {
      var e;
      const {
          clsPrefix: o,
          hasSubmenu: n,
          showIcon: r,
          nodeProps: t,
          renderLabel: i,
          renderOption: d,
        } = this,
        { rawNode: l } = this.tmNode,
        a = L(
          "div",
          Object.assign({ class: `${o}-dropdown-option` }, null == t ? void 0 : t(l)),
          L(
            "div",
            { class: `${o}-dropdown-option-body ${o}-dropdown-option-body--group` },
            L(
              "div",
              {
                "data-dropdown-option": !0,
                class: [
                  `${o}-dropdown-option-body__prefix`,
                  r && `${o}-dropdown-option-body__prefix--show-icon`,
                ],
              },
              u(l.icon),
            ),
            L(
              "div",
              { class: `${o}-dropdown-option-body__label`, "data-dropdown-option": !0 },
              i ? i(l) : u(null !== (e = l.title) && void 0 !== e ? e : l[this.labelField]),
            ),
            L("div", {
              class: [
                `${o}-dropdown-option-body__suffix`,
                n && `${o}-dropdown-option-body__suffix--has-submenu`,
              ],
              "data-dropdown-option": !0,
            }),
          ),
        );
      return d ? d({ node: a, option: l }) : a;
    },
  });
function re(e, o) {
  return "submenu" === e.type || (void 0 === e.type && void 0 !== e[o]);
}
function te(e) {
  return "divider" === e.type;
}
const ie = K({
    name: "DropdownOption",
    props: {
      clsPrefix: { type: String, required: !0 },
      tmNode: { type: Object, required: !0 },
      parentKey: { type: [String, Number], default: null },
      placement: { type: String, default: "right-start" },
      props: Object,
      scrollable: Boolean,
    },
    setup(e) {
      const o = T(Y),
        {
          hoverKeyRef: n,
          keyboardKeyRef: r,
          lastToggledSubmenuKeyRef: t,
          pendingKeyPathRef: i,
          activeKeyPathRef: d,
          animatedRef: l,
          mergedShowRef: a,
          renderLabelRef: s,
          renderIconRef: u,
          labelFieldRef: v,
          childrenFieldRef: f,
          renderOptionRef: h,
          nodePropsRef: b,
          menuPropsRef: m,
        } = o,
        w = T(ee, null),
        y = T(X),
        g = T(c),
        x = B(() => e.tmNode.rawNode),
        k = B(() => {
          const { value: o } = f;
          return re(e.tmNode.rawNode, o);
        }),
        S = B(() => {
          const { disabled: o } = e.tmNode;
          return o;
        }),
        N = (function (e, o, n) {
          const r = _(e.value);
          let t = null;
          return (
            j(e, (e) => {
              (null !== t && window.clearTimeout(t),
                !0 === e
                  ? n && !n.value
                    ? (r.value = !0)
                    : (t = window.setTimeout(() => {
                        r.value = !0;
                      }, o))
                  : (r.value = !1));
            }),
            r
          );
        })(
          B(() => {
            if (!k.value) return !1;
            const { key: o, disabled: d } = e.tmNode;
            if (d) return !1;
            const { value: l } = n,
              { value: a } = r,
              { value: s } = t,
              { value: u } = i;
            return null !== l
              ? u.includes(o)
              : null !== a
                ? u.includes(o) && u[u.length - 1] !== o
                : null !== s && u.includes(o);
          }),
          300,
          B(() => null === r.value && !l.value),
        ),
        P = B(() => !!(null == w ? void 0 : w.enteringSubmenuRef.value)),
        R = _(!1);
      function C() {
        const { parentKey: o, tmNode: i } = e;
        i.disabled || (a.value && ((t.value = o), (r.value = null), (n.value = i.key)));
      }
      return (
        E(ee, { enteringSubmenuRef: R }),
        {
          labelField: v,
          renderLabel: s,
          renderIcon: u,
          siblingHasIcon: y.showIconRef,
          siblingHasSubmenu: y.hasSubmenuRef,
          menuProps: m,
          popoverBody: g,
          animated: l,
          mergedShowSubmenu: B(() => N.value && !P.value),
          rawNode: x,
          hasSubmenu: k,
          pending: p(() => {
            const { value: o } = i,
              { key: n } = e.tmNode;
            return o.includes(n);
          }),
          childActive: p(() => {
            const { value: o } = d,
              { key: n } = e.tmNode,
              r = o.findIndex((e) => n === e);
            return -1 !== r && r < o.length - 1;
          }),
          active: p(() => {
            const { value: o } = d,
              { key: n } = e.tmNode,
              r = o.findIndex((e) => n === e);
            return -1 !== r && r === o.length - 1;
          }),
          mergedDisabled: S,
          renderOption: h,
          nodeProps: b,
          handleClick: function () {
            const { value: n } = k,
              { tmNode: r } = e;
            a.value && (n || r.disabled || (o.doSelect(r.key, r.rawNode), o.doUpdateShow(!1)));
          },
          handleMouseMove: function () {
            const { tmNode: o } = e;
            o.disabled || (a.value && n.value !== o.key && C());
          },
          handleMouseEnter: C,
          handleMouseLeave: function (o) {
            if (e.tmNode.disabled) return;
            if (!a.value) return;
            const { relatedTarget: r } = o;
            !r ||
              G({ target: r }, "dropdownOption") ||
              G({ target: r }, "scrollbarRail") ||
              (n.value = null);
          },
          handleSubmenuBeforeEnter: function () {
            R.value = !0;
          },
          handleSubmenuAfterEnter: function () {
            R.value = !1;
          },
        }
      );
    },
    render() {
      var r, t;
      const {
        animated: i,
        rawNode: d,
        mergedShowSubmenu: l,
        clsPrefix: a,
        siblingHasIcon: s,
        siblingHasSubmenu: p,
        renderLabel: c,
        renderIcon: v,
        renderOption: f,
        nodeProps: h,
        props: b,
        scrollable: m,
      } = this;
      let w = null;
      if (l) {
        const e =
          null === (r = this.menuProps) || void 0 === r ? void 0 : r.call(this, d, d.children);
        w = L(
          ae,
          Object.assign({}, e, {
            clsPrefix: a,
            scrollable: this.scrollable,
            tmNodes: this.tmNode.children,
            parentKey: this.tmNode.key,
          }),
        );
      }
      const y = {
          class: [
            `${a}-dropdown-option-body`,
            this.pending && `${a}-dropdown-option-body--pending`,
            this.active && `${a}-dropdown-option-body--active`,
            this.childActive && `${a}-dropdown-option-body--child-active`,
            this.mergedDisabled && `${a}-dropdown-option-body--disabled`,
          ],
          onMousemove: this.handleMouseMove,
          onMouseenter: this.handleMouseEnter,
          onMouseleave: this.handleMouseLeave,
          onClick: this.handleClick,
        },
        g = null == h ? void 0 : h(d),
        x = L(
          "div",
          Object.assign(
            {
              class: [`${a}-dropdown-option`, null == g ? void 0 : g.class],
              "data-dropdown-option": !0,
            },
            g,
          ),
          L("div", D(y, b), [
            L(
              "div",
              {
                class: [
                  `${a}-dropdown-option-body__prefix`,
                  s && `${a}-dropdown-option-body__prefix--show-icon`,
                ],
              },
              [v ? v(d) : u(d.icon)],
            ),
            L(
              "div",
              { "data-dropdown-option": !0, class: `${a}-dropdown-option-body__label` },
              c ? c(d) : u(null !== (t = d[this.labelField]) && void 0 !== t ? t : d.title),
            ),
            L(
              "div",
              {
                "data-dropdown-option": !0,
                class: [
                  `${a}-dropdown-option-body__suffix`,
                  p && `${a}-dropdown-option-body__suffix--has-submenu`,
                ],
              },
              this.hasSubmenu ? L(U, null, { default: () => L(J, null) }) : null,
            ),
          ]),
          this.hasSubmenu
            ? L(e, null, {
                default: () => [
                  L(o, null, {
                    default: () =>
                      L(
                        "div",
                        { class: `${a}-dropdown-offset-container` },
                        L(
                          n,
                          {
                            show: this.mergedShowSubmenu,
                            placement: this.placement,
                            to: (m && this.popoverBody) || void 0,
                            teleportDisabled: !m,
                          },
                          {
                            default: () =>
                              L(
                                "div",
                                { class: `${a}-dropdown-menu-wrapper` },
                                i
                                  ? L(
                                      M,
                                      {
                                        onBeforeEnter: this.handleSubmenuBeforeEnter,
                                        onAfterEnter: this.handleSubmenuAfterEnter,
                                        name: "fade-in-scale-up-transition",
                                        appear: !0,
                                      },
                                      { default: () => w },
                                    )
                                  : w,
                              ),
                          },
                        ),
                      ),
                  }),
                ],
              })
            : null,
        );
      return f ? f({ node: x, option: d }) : x;
    },
  }),
  de = K({
    name: "NDropdownGroup",
    props: {
      clsPrefix: { type: String, required: !0 },
      tmNode: { type: Object, required: !0 },
      parentKey: { type: [String, Number], default: null },
    },
    render() {
      const { tmNode: e, parentKey: o, clsPrefix: n } = this,
        { children: r } = e;
      return L(
        H,
        null,
        L(ne, { clsPrefix: n, tmNode: e, key: e.key }),
        null == r
          ? void 0
          : r.map((e) => {
              const { rawNode: r } = e;
              return !1 === r.show
                ? null
                : te(r)
                  ? L(oe, { clsPrefix: n, key: e.key })
                  : e.isGroup
                    ? (v("dropdown", "`group` node is not allowed to be put in `group` node."),
                      null)
                    : L(ie, { clsPrefix: n, tmNode: e, parentKey: o, key: e.key });
            }),
      );
    },
  }),
  le = K({
    name: "DropdownRenderOption",
    props: { tmNode: { type: Object, required: !0 } },
    render() {
      const {
        rawNode: { render: e, props: o },
      } = this.tmNode;
      return L("div", o, [null == e ? void 0 : e()]);
    },
  }),
  ae = K({
    name: "DropdownMenu",
    props: {
      scrollable: Boolean,
      showArrow: Boolean,
      arrowStyle: [String, Object],
      clsPrefix: { type: String, required: !0 },
      tmNodes: { type: Array, default: () => [] },
      parentKey: { type: [String, Number], default: null },
    },
    setup(e) {
      const { renderIconRef: o, childrenFieldRef: n } = T(Y);
      E(X, {
        showIconRef: B(() => {
          const n = o.value;
          return e.tmNodes.some((e) => {
            var o;
            if (e.isGroup)
              return null === (o = e.children) || void 0 === o
                ? void 0
                : o.some(({ rawNode: e }) => (n ? n(e) : e.icon));
            const { rawNode: r } = e;
            return n ? n(r) : r.icon;
          });
        }),
        hasSubmenuRef: B(() => {
          const { value: o } = n;
          return e.tmNodes.some((e) => {
            var n;
            if (e.isGroup)
              return null === (n = e.children) || void 0 === n
                ? void 0
                : n.some(({ rawNode: e }) => re(e, o));
            const { rawNode: r } = e;
            return re(r, o);
          });
        }),
      });
      const r = _(null);
      return (E(h, null), E(b, null), E(c, r), { bodyRef: r });
    },
    render() {
      const { parentKey: e, clsPrefix: o, scrollable: n } = this,
        t = this.tmNodes.map((r) => {
          const { rawNode: t } = r;
          return !1 === t.show
            ? null
            : (function (e) {
                  return "render" === e.type;
                })(t)
              ? L(le, { tmNode: r, key: r.key })
              : te(t)
                ? L(oe, { clsPrefix: o, key: r.key })
                : (function (e) {
                      return "group" === e.type;
                    })(t)
                  ? L(de, { clsPrefix: o, tmNode: r, parentKey: e, key: r.key })
                  : L(ie, {
                      clsPrefix: o,
                      tmNode: r,
                      parentKey: e,
                      key: r.key,
                      props: t.props,
                      scrollable: n,
                    });
        });
      return L(
        "div",
        { class: [`${o}-dropdown-menu`, n && `${o}-dropdown-menu--scrollable`], ref: "bodyRef" },
        n ? L(f, { contentClass: `${o}-dropdown-menu__content` }, { default: () => t }) : t,
        this.showArrow
          ? r({
              clsPrefix: o,
              arrowStyle: this.arrowStyle,
              arrowClass: void 0,
              arrowWrapperClass: void 0,
              arrowWrapperStyle: void 0,
            })
          : null,
      );
    },
  }),
  se = m(
    "dropdown-menu",
    "\n transform-origin: var(--v-transform-origin);\n background-color: var(--n-color);\n border-radius: var(--n-border-radius);\n box-shadow: var(--n-box-shadow);\n position: relative;\n transition:\n background-color .3s var(--n-bezier),\n box-shadow .3s var(--n-bezier);\n",
    [
      w(),
      m("dropdown-option", "\n position: relative;\n ", [
        y("a", "\n text-decoration: none;\n color: inherit;\n outline: none;\n ", [
          y(
            "&::before",
            '\n content: "";\n position: absolute;\n left: 0;\n right: 0;\n top: 0;\n bottom: 0;\n ',
          ),
        ]),
        m(
          "dropdown-option-body",
          "\n display: flex;\n cursor: pointer;\n position: relative;\n height: var(--n-option-height);\n line-height: var(--n-option-height);\n font-size: var(--n-font-size);\n color: var(--n-option-text-color);\n transition: color .3s var(--n-bezier);\n ",
          [
            y(
              "&::before",
              '\n content: "";\n position: absolute;\n top: 0;\n bottom: 0;\n left: 4px;\n right: 4px;\n transition: background-color .3s var(--n-bezier);\n border-radius: var(--n-border-radius);\n ',
            ),
            g("disabled", [
              x("pending", "\n color: var(--n-option-text-color-hover);\n ", [
                k("prefix, suffix", "\n color: var(--n-option-text-color-hover);\n "),
                y("&::before", "background-color: var(--n-option-color-hover);"),
              ]),
              x("active", "\n color: var(--n-option-text-color-active);\n ", [
                k("prefix, suffix", "\n color: var(--n-option-text-color-active);\n "),
                y("&::before", "background-color: var(--n-option-color-active);"),
              ]),
              x("child-active", "\n color: var(--n-option-text-color-child-active);\n ", [
                k("prefix, suffix", "\n color: var(--n-option-text-color-child-active);\n "),
              ]),
            ]),
            x(
              "disabled",
              "\n cursor: not-allowed;\n opacity: var(--n-option-opacity-disabled);\n ",
            ),
            x(
              "group",
              "\n font-size: calc(var(--n-font-size) - 1px);\n color: var(--n-group-header-text-color);\n ",
              [
                k("prefix", "\n width: calc(var(--n-option-prefix-width) / 2);\n ", [
                  x("show-icon", "\n width: calc(var(--n-option-icon-prefix-width) / 2);\n "),
                ]),
              ],
            ),
            k(
              "prefix",
              "\n width: var(--n-option-prefix-width);\n display: flex;\n justify-content: center;\n align-items: center;\n color: var(--n-prefix-color);\n transition: color .3s var(--n-bezier);\n z-index: 1;\n ",
              [
                x("show-icon", "\n width: var(--n-option-icon-prefix-width);\n "),
                m("icon", "\n font-size: var(--n-option-icon-size);\n "),
              ],
            ),
            k("label", "\n white-space: nowrap;\n flex: 1;\n z-index: 1;\n "),
            k(
              "suffix",
              "\n box-sizing: border-box;\n flex-grow: 0;\n flex-shrink: 0;\n display: flex;\n justify-content: flex-end;\n align-items: center;\n min-width: var(--n-option-suffix-width);\n padding: 0 8px;\n transition: color .3s var(--n-bezier);\n color: var(--n-suffix-color);\n z-index: 1;\n ",
              [
                x("has-submenu", "\n width: var(--n-option-icon-suffix-width);\n "),
                m("icon", "\n font-size: var(--n-option-icon-size);\n "),
              ],
            ),
            m("dropdown-menu", "pointer-events: all;"),
          ],
        ),
        m(
          "dropdown-offset-container",
          "\n pointer-events: none;\n position: absolute;\n left: 0;\n right: 0;\n top: -4px;\n bottom: -4px;\n ",
        ),
      ]),
      m(
        "dropdown-divider",
        "\n transition: background-color .3s var(--n-bezier);\n background-color: var(--n-divider-color);\n height: 1px;\n margin: 4px 0;\n ",
      ),
      m(
        "dropdown-menu-wrapper",
        "\n transform-origin: var(--v-transform-origin);\n width: fit-content;\n ",
      ),
      y(">", [m("scrollbar", "\n height: inherit;\n max-height: inherit;\n ")]),
      g("scrollable", "\n padding: var(--n-padding);\n "),
      x("scrollable", [k("content", "\n padding: var(--n-padding);\n ")]),
    ],
  ),
  ue = {
    animated: { type: Boolean, default: !0 },
    keyboard: { type: Boolean, default: !0 },
    size: { type: String, default: "medium" },
    inverted: Boolean,
    placement: { type: String, default: "bottom" },
    onSelect: [Function, Array],
    options: { type: Array, default: () => [] },
    menuProps: Function,
    showArrow: Boolean,
    renderLabel: Function,
    renderIcon: Function,
    renderOption: Function,
    nodeProps: Function,
    labelField: { type: String, default: "label" },
    keyField: { type: String, default: "key" },
    childrenField: { type: String, default: "children" },
    value: [String, Number],
  },
  pe = Object.keys(i),
  ce = K({
    name: "Dropdown",
    inheritAttrs: !1,
    props: Object.assign(Object.assign(Object.assign({}, i), ue), P.props),
    setup(e) {
      const o = _(!1),
        n = V(q(e, "show"), o),
        r = B(() => {
          const { keyField: o, childrenField: n } = e;
          return W(e.options, {
            getKey: (e) => e[o],
            getDisabled: (e) => !0 === e.disabled,
            getIgnored: (e) => "divider" === e.type || "render" === e.type,
            getChildren: (e) => e[n],
          });
        }),
        t = B(() => r.value.treeNodes),
        i = _(null),
        d = _(null),
        l = _(null),
        a = B(() => {
          var e, o, n;
          return null !==
            (n =
              null !== (o = null !== (e = i.value) && void 0 !== e ? e : d.value) && void 0 !== o
                ? o
                : l.value) && void 0 !== n
            ? n
            : null;
        }),
        s = B(() => r.value.getPath(a.value).keyPath),
        u = B(() => r.value.getPath(e.value).keyPath);
      Q(
        {
          keydown: {
            ArrowUp: {
              prevent: !0,
              handler: function () {
                y("up");
              },
            },
            ArrowRight: {
              prevent: !0,
              handler: function () {
                y("right");
              },
            },
            ArrowDown: {
              prevent: !0,
              handler: function () {
                y("down");
              },
            },
            ArrowLeft: {
              prevent: !0,
              handler: function () {
                y("left");
              },
            },
            Enter: {
              prevent: !0,
              handler: function () {
                const e = w();
                (null == e ? void 0 : e.isLeaf) && n.value && (h(e.key, e.rawNode), b(!1));
              },
            },
            Escape: function () {
              b(!1);
            },
          },
        },
        p(() => e.keyboard && n.value),
      );
      const { mergedClsPrefixRef: c, inlineThemeDisabled: v } = N(e),
        f = P("Dropdown", "-dropdown", se, R, e, c);
      function h(o, n) {
        const { onSelect: r } = e;
        r && I(r, o, n);
      }
      function b(n) {
        const { "onUpdate:show": r, onUpdateShow: t } = e;
        (r && I(r, n), t && I(t, n), (o.value = n));
      }
      function m() {
        ((i.value = null), (d.value = null), (l.value = null));
      }
      function w() {
        var e;
        const { value: o } = r,
          { value: n } = a;
        return o && null !== n && null !== (e = o.getNode(n)) && void 0 !== e ? e : null;
      }
      function y(e) {
        const { value: o } = a,
          {
            value: { getFirstAvailableNode: n },
          } = r;
        let t = null;
        if (null === o) {
          const e = n();
          null !== e && (t = e.key);
        } else {
          const o = w();
          if (o) {
            let n;
            switch (e) {
              case "down":
                n = o.getNext();
                break;
              case "up":
                n = o.getPrev();
                break;
              case "right":
                n = o.getChild();
                break;
              case "left":
                n = o.getParent();
            }
            n && (t = n.key);
          }
        }
        null !== t && ((i.value = null), (d.value = t));
      }
      (E(Y, {
        labelFieldRef: q(e, "labelField"),
        childrenFieldRef: q(e, "childrenField"),
        renderLabelRef: q(e, "renderLabel"),
        renderIconRef: q(e, "renderIcon"),
        hoverKeyRef: i,
        keyboardKeyRef: d,
        lastToggledSubmenuKeyRef: l,
        pendingKeyPathRef: s,
        activeKeyPathRef: u,
        animatedRef: q(e, "animated"),
        mergedShowRef: n,
        nodePropsRef: q(e, "nodeProps"),
        renderOptionRef: q(e, "renderOption"),
        menuPropsRef: q(e, "menuProps"),
        doSelect: h,
        doUpdateShow: b,
      }),
        j(n, (o) => {
          e.animated || o || m();
        }));
      const g = B(() => {
          const { size: o, inverted: n } = e,
            {
              common: { cubicBezierEaseInOut: r },
              self: t,
            } = f.value,
            {
              padding: i,
              dividerColor: d,
              borderRadius: l,
              optionOpacityDisabled: a,
              [C("optionIconSuffixWidth", o)]: s,
              [C("optionSuffixWidth", o)]: u,
              [C("optionIconPrefixWidth", o)]: p,
              [C("optionPrefixWidth", o)]: c,
              [C("fontSize", o)]: v,
              [C("optionHeight", o)]: h,
              [C("optionIconSize", o)]: b,
            } = t,
            m = {
              "--n-bezier": r,
              "--n-font-size": v,
              "--n-padding": i,
              "--n-border-radius": l,
              "--n-option-height": h,
              "--n-option-prefix-width": c,
              "--n-option-icon-prefix-width": p,
              "--n-option-suffix-width": u,
              "--n-option-icon-suffix-width": s,
              "--n-option-icon-size": b,
              "--n-divider-color": d,
              "--n-option-opacity-disabled": a,
            };
          return (
            n
              ? ((m["--n-color"] = t.colorInverted),
                (m["--n-option-color-hover"] = t.optionColorHoverInverted),
                (m["--n-option-color-active"] = t.optionColorActiveInverted),
                (m["--n-option-text-color"] = t.optionTextColorInverted),
                (m["--n-option-text-color-hover"] = t.optionTextColorHoverInverted),
                (m["--n-option-text-color-active"] = t.optionTextColorActiveInverted),
                (m["--n-option-text-color-child-active"] = t.optionTextColorChildActiveInverted),
                (m["--n-prefix-color"] = t.prefixColorInverted),
                (m["--n-suffix-color"] = t.suffixColorInverted),
                (m["--n-group-header-text-color"] = t.groupHeaderTextColorInverted))
              : ((m["--n-color"] = t.color),
                (m["--n-option-color-hover"] = t.optionColorHover),
                (m["--n-option-color-active"] = t.optionColorActive),
                (m["--n-option-text-color"] = t.optionTextColor),
                (m["--n-option-text-color-hover"] = t.optionTextColorHover),
                (m["--n-option-text-color-active"] = t.optionTextColorActive),
                (m["--n-option-text-color-child-active"] = t.optionTextColorChildActive),
                (m["--n-prefix-color"] = t.prefixColor),
                (m["--n-suffix-color"] = t.suffixColor),
                (m["--n-group-header-text-color"] = t.groupHeaderTextColor)),
            m
          );
        }),
        x = v
          ? O(
              "dropdown",
              B(() => `${e.size[0]}${e.inverted ? "i" : ""}`),
              g,
              e,
            )
          : void 0;
      return {
        mergedClsPrefix: c,
        mergedTheme: f,
        tmNodes: t,
        mergedShow: n,
        handleAfterLeave: () => {
          e.animated && m();
        },
        doUpdateShow: b,
        cssVars: v ? void 0 : g,
        themeClass: null == x ? void 0 : x.themeClass,
        onRender: null == x ? void 0 : x.onRender,
      };
    },
    render() {
      const { mergedTheme: e } = this,
        o = {
          show: this.mergedShow,
          theme: e.peers.Popover,
          themeOverrides: e.peerOverrides.Popover,
          internalOnAfterLeave: this.handleAfterLeave,
          internalRenderBody: (e, o, n, r, t) => {
            var i;
            const { mergedClsPrefix: d, menuProps: l } = this;
            null === (i = this.onRender) || void 0 === i || i.call(this);
            const a =
                (null == l
                  ? void 0
                  : l(
                      void 0,
                      this.tmNodes.map((e) => e.rawNode),
                    )) || {},
              s = {
                ref: Z(o),
                class: [e, `${d}-dropdown`, this.themeClass],
                clsPrefix: d,
                tmNodes: this.tmNodes,
                style: [...n, this.cssVars],
                showArrow: this.showArrow,
                arrowStyle: this.arrowStyle,
                scrollable: this.scrollable,
                onMouseenter: r,
                onMouseleave: t,
              };
            return L(ae, D(this.$attrs, s, a));
          },
          onUpdateShow: this.doUpdateShow,
          "onUpdate:show": void 0,
        };
      return L(t, Object.assign({}, S(this.$props, pe), o), {
        trigger: () => {
          var e, o;
          return null === (o = (e = this.$slots).default) || void 0 === o ? void 0 : o.call(e);
        },
      });
    },
  });
export { J as C, ce as _, Z as c, Q as u };
