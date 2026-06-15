import {
  x as e,
  G as o,
  y as n,
  aP as r,
  z as a,
  q as c,
  br as l,
  t,
  D as s,
  cG as i,
  S as d,
  aU as h,
  bv as b,
  v as g,
  bj as v,
  F as u,
  o as k,
} from "./index-Ct5UuHQN.js";
import { j as p, k as C, r as f, p as x, t as m, c as z } from "./vendor-DHo7BzsC.js";
const y = {
    color: Object,
    type: { type: String, default: "default" },
    round: Boolean,
    size: { type: String, default: "medium" },
    closable: Boolean,
    disabled: { type: Boolean, default: void 0 },
  },
  $ = e(
    "tag",
    "\n --n-close-margin: var(--n-close-margin-top) var(--n-close-margin-right) var(--n-close-margin-bottom) var(--n-close-margin-left);\n white-space: nowrap;\n position: relative;\n box-sizing: border-box;\n cursor: default;\n display: inline-flex;\n align-items: center;\n flex-wrap: nowrap;\n padding: var(--n-padding);\n border-radius: var(--n-border-radius);\n color: var(--n-text-color);\n background-color: var(--n-color);\n transition: \n border-color .3s var(--n-bezier),\n background-color .3s var(--n-bezier),\n color .3s var(--n-bezier),\n box-shadow .3s var(--n-bezier),\n opacity .3s var(--n-bezier);\n line-height: 1;\n height: var(--n-height);\n font-size: var(--n-font-size);\n",
    [
      o("strong", "\n font-weight: var(--n-font-weight-strong);\n "),
      n(
        "border",
        "\n pointer-events: none;\n position: absolute;\n left: 0;\n right: 0;\n top: 0;\n bottom: 0;\n border-radius: inherit;\n border: var(--n-border);\n transition: border-color .3s var(--n-bezier);\n ",
      ),
      n(
        "icon",
        "\n display: flex;\n margin: 0 4px 0 0;\n color: var(--n-text-color);\n transition: color .3s var(--n-bezier);\n font-size: var(--n-avatar-size-override);\n ",
      ),
      n("avatar", "\n display: flex;\n margin: 0 6px 0 0;\n "),
      n(
        "close",
        "\n margin: var(--n-close-margin);\n transition:\n background-color .3s var(--n-bezier),\n color .3s var(--n-bezier);\n ",
      ),
      o(
        "round",
        "\n padding: 0 calc(var(--n-height) / 3);\n border-radius: calc(var(--n-height) / 2);\n ",
        [
          n("icon", "\n margin: 0 4px 0 calc((var(--n-height) - 8px) / -2);\n "),
          n("avatar", "\n margin: 0 6px 0 calc((var(--n-height) - 8px) / -2);\n "),
          o("closable", "\n padding: 0 calc(var(--n-height) / 4) 0 calc(var(--n-height) / 3);\n "),
        ],
      ),
      o("icon, avatar", [
        o("round", "\n padding: 0 calc(var(--n-height) / 3) 0 calc(var(--n-height) / 2);\n "),
      ]),
      o("disabled", "\n cursor: not-allowed !important;\n opacity: var(--n-opacity-disabled);\n "),
      o(
        "checkable",
        "\n cursor: pointer;\n box-shadow: none;\n color: var(--n-text-color-checkable);\n background-color: var(--n-color-checkable);\n ",
        [
          r("disabled", [
            a("&:hover", "background-color: var(--n-color-hover-checkable);", [
              r("checked", "color: var(--n-text-color-hover-checkable);"),
            ]),
            a("&:active", "background-color: var(--n-color-pressed-checkable);", [
              r("checked", "color: var(--n-text-color-pressed-checkable);"),
            ]),
          ]),
          o(
            "checked",
            "\n color: var(--n-text-color-checked);\n background-color: var(--n-color-checked);\n ",
            [
              r("disabled", [
                a("&:hover", "background-color: var(--n-color-checked-hover);"),
                a("&:active", "background-color: var(--n-color-checked-pressed);"),
              ]),
            ],
          ),
        ],
      ),
    ],
  ),
  B = Object.assign(Object.assign(Object.assign({}, s.props), y), {
    bordered: { type: Boolean, default: void 0 },
    checked: Boolean,
    checkable: Boolean,
    strong: Boolean,
    triggerClickOnClose: Boolean,
    onClose: [Array, Function],
    onMouseenter: Function,
    onMouseleave: Function,
    "onUpdate:checked": Function,
    onUpdateChecked: Function,
    internalCloseFocusable: { type: Boolean, default: !0 },
    internalCloseIsButtonTag: { type: Boolean, default: !0 },
    onCheckedChange: Function,
  }),
  R = k("n-tag"),
  j = p({
    name: "Tag",
    props: B,
    slots: Object,
    setup(e) {
      const o = f(null),
        {
          mergedBorderedRef: n,
          mergedClsPrefixRef: r,
          inlineThemeDisabled: a,
          mergedRtlRef: c,
        } = t(e),
        l = s("Tag", "-tag", $, i, e, r);
      x(R, { roundRef: m(e, "round") });
      const k = {
          setTextContent(e) {
            const { value: n } = o;
            n && (n.textContent = e);
          },
        },
        p = d("Tag", c, r),
        C = z(() => {
          const { type: o, size: r, color: { color: a, textColor: c } = {} } = e,
            {
              common: { cubicBezierEaseInOut: t },
              self: {
                padding: s,
                closeMargin: i,
                borderRadius: d,
                opacityDisabled: g,
                textColorCheckable: v,
                textColorHoverCheckable: u,
                textColorPressedCheckable: k,
                textColorChecked: p,
                colorCheckable: C,
                colorHoverCheckable: f,
                colorPressedCheckable: x,
                colorChecked: m,
                colorCheckedHover: z,
                colorCheckedPressed: y,
                closeBorderRadius: $,
                fontWeightStrong: B,
                [h("colorBordered", o)]: R,
                [h("closeSize", r)]: j,
                [h("closeIconSize", r)]: P,
                [h("fontSize", r)]: _,
                [h("height", r)]: w,
                [h("color", o)]: O,
                [h("textColor", o)]: F,
                [h("border", o)]: T,
                [h("closeIconColor", o)]: I,
                [h("closeIconColorHover", o)]: M,
                [h("closeIconColorPressed", o)]: S,
                [h("closeColorHover", o)]: H,
                [h("closeColorPressed", o)]: U,
              },
            } = l.value,
            D = b(i);
          return {
            "--n-font-weight-strong": B,
            "--n-avatar-size-override": `calc(${w} - 8px)`,
            "--n-bezier": t,
            "--n-border-radius": d,
            "--n-border": T,
            "--n-close-icon-size": P,
            "--n-close-color-pressed": U,
            "--n-close-color-hover": H,
            "--n-close-border-radius": $,
            "--n-close-icon-color": I,
            "--n-close-icon-color-hover": M,
            "--n-close-icon-color-pressed": S,
            "--n-close-icon-color-disabled": I,
            "--n-close-margin-top": D.top,
            "--n-close-margin-right": D.right,
            "--n-close-margin-bottom": D.bottom,
            "--n-close-margin-left": D.left,
            "--n-close-size": j,
            "--n-color": a || (n.value ? R : O),
            "--n-color-checkable": C,
            "--n-color-checked": m,
            "--n-color-checked-hover": z,
            "--n-color-checked-pressed": y,
            "--n-color-hover-checkable": f,
            "--n-color-pressed-checkable": x,
            "--n-font-size": _,
            "--n-height": w,
            "--n-opacity-disabled": g,
            "--n-padding": s,
            "--n-text-color": c || F,
            "--n-text-color-checkable": v,
            "--n-text-color-checked": p,
            "--n-text-color-hover-checkable": u,
            "--n-text-color-pressed-checkable": k,
          };
        }),
        y = a
          ? g(
              "tag",
              z(() => {
                let o = "";
                const { type: r, size: a, color: { color: c, textColor: l } = {} } = e;
                return (
                  (o += r[0]),
                  (o += a[0]),
                  c && (o += `a${v(c)}`),
                  l && (o += `b${v(l)}`),
                  n.value && (o += "c"),
                  o
                );
              }),
              C,
              e,
            )
          : void 0;
      return Object.assign(Object.assign({}, k), {
        rtlEnabled: p,
        mergedClsPrefix: r,
        contentRef: o,
        mergedBordered: n,
        handleClick: function () {
          if (!e.disabled && e.checkable) {
            const { checked: o, onCheckedChange: n, onUpdateChecked: r, "onUpdate:checked": a } = e;
            (r && r(!o), a && a(!o), n && n(!o));
          }
        },
        handleCloseClick: function (o) {
          if ((e.triggerClickOnClose || o.stopPropagation(), !e.disabled)) {
            const { onClose: n } = e;
            n && u(n, o);
          }
        },
        cssVars: a ? void 0 : C,
        themeClass: null == y ? void 0 : y.themeClass,
        onRender: null == y ? void 0 : y.onRender,
      });
    },
    render() {
      var e, o;
      const {
        mergedClsPrefix: n,
        rtlEnabled: r,
        closable: a,
        color: { borderColor: t } = {},
        round: s,
        onRender: i,
        $slots: d,
      } = this;
      null == i || i();
      const h = c(d.avatar, (e) => e && C("div", { class: `${n}-tag__avatar` }, e)),
        b = c(d.icon, (e) => e && C("div", { class: `${n}-tag__icon` }, e));
      return C(
        "div",
        {
          class: [
            `${n}-tag`,
            this.themeClass,
            {
              [`${n}-tag--rtl`]: r,
              [`${n}-tag--strong`]: this.strong,
              [`${n}-tag--disabled`]: this.disabled,
              [`${n}-tag--checkable`]: this.checkable,
              [`${n}-tag--checked`]: this.checkable && this.checked,
              [`${n}-tag--round`]: s,
              [`${n}-tag--avatar`]: h,
              [`${n}-tag--icon`]: b,
              [`${n}-tag--closable`]: a,
            },
          ],
          style: this.cssVars,
          onClick: this.handleClick,
          onMouseenter: this.onMouseenter,
          onMouseleave: this.onMouseleave,
        },
        b || h,
        C(
          "span",
          { class: `${n}-tag__content`, ref: "contentRef" },
          null === (o = (e = this.$slots).default) || void 0 === o ? void 0 : o.call(e),
        ),
        !this.checkable && a
          ? C(l, {
              clsPrefix: n,
              class: `${n}-tag__close`,
              disabled: this.disabled,
              onClick: this.handleCloseClick,
              focusable: this.internalCloseFocusable,
              round: s,
              isButtonTag: this.internalCloseIsButtonTag,
              absolute: !0,
            })
          : null,
        !this.checkable && this.mergedBordered
          ? C("div", { class: `${n}-tag__border`, style: { borderColor: t } })
          : null,
      );
    },
  });
export { j as _, y as c, R as t };
