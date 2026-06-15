import {
  x as e,
  G as o,
  y as n,
  aP as a,
  z as r,
  T as d,
  P as i,
  t as l,
  o as t,
  F as s,
  q as c,
  D as u,
  cp as b,
  aU as h,
  S as v,
  v as f,
} from "./index-Ct5UuHQN.js";
import { u as g } from "./use-merged-state-mPE1JA5r.js";
import { i as p, r as m, t as x, j as w, k, c as z } from "./vendor-DHo7BzsC.js";
const C = e(
    "radio",
    "\n line-height: var(--n-label-line-height);\n outline: none;\n position: relative;\n user-select: none;\n -webkit-user-select: none;\n display: inline-flex;\n align-items: flex-start;\n flex-wrap: nowrap;\n font-size: var(--n-font-size);\n word-break: break-word;\n",
    [
      o("checked", [n("dot", "\n background-color: var(--n-color-active);\n ")]),
      n(
        "dot-wrapper",
        "\n position: relative;\n flex-shrink: 0;\n flex-grow: 0;\n width: var(--n-radio-size);\n ",
      ),
      e(
        "radio-input",
        "\n position: absolute;\n border: 0;\n width: 0;\n height: 0;\n opacity: 0;\n margin: 0;\n ",
      ),
      n(
        "dot",
        "\n position: absolute;\n top: 50%;\n left: 0;\n transform: translateY(-50%);\n height: var(--n-radio-size);\n width: var(--n-radio-size);\n background: var(--n-color);\n box-shadow: var(--n-box-shadow);\n border-radius: 50%;\n transition:\n background-color .3s var(--n-bezier),\n box-shadow .3s var(--n-bezier);\n ",
        [
          r(
            "&::before",
            '\n content: "";\n opacity: 0;\n position: absolute;\n left: 4px;\n top: 4px;\n height: calc(100% - 8px);\n width: calc(100% - 8px);\n border-radius: 50%;\n transform: scale(.8);\n background: var(--n-dot-color-active);\n transition: \n opacity .3s var(--n-bezier),\n background-color .3s var(--n-bezier),\n transform .3s var(--n-bezier);\n ',
          ),
          o("checked", { boxShadow: "var(--n-box-shadow-active)" }, [
            r("&::before", "\n opacity: 1;\n transform: scale(1);\n "),
          ]),
        ],
      ),
      n(
        "label",
        "\n color: var(--n-text-color);\n padding: var(--n-label-padding);\n font-weight: var(--n-label-font-weight);\n display: inline-block;\n transition: color .3s var(--n-bezier);\n ",
      ),
      a("disabled", "\n cursor: pointer;\n ", [
        r("&:hover", [n("dot", { boxShadow: "var(--n-box-shadow-hover)" })]),
        o("focus", [r("&:not(:active)", [n("dot", { boxShadow: "var(--n-box-shadow-focus)" })])]),
      ]),
      o("disabled", "\n cursor: not-allowed;\n ", [
        n(
          "dot",
          { boxShadow: "var(--n-box-shadow-disabled)", backgroundColor: "var(--n-color-disabled)" },
          [
            r("&::before", { backgroundColor: "var(--n-dot-color-disabled)" }),
            o("checked", "\n opacity: 1;\n "),
          ],
        ),
        n("label", { color: "var(--n-text-color-disabled)" }),
        e("radio-input", "\n cursor: not-allowed;\n "),
      ]),
    ],
  ),
  R = {
    name: String,
    value: { type: [String, Number, Boolean], default: "on" },
    checked: { type: Boolean, default: void 0 },
    defaultChecked: Boolean,
    disabled: { type: Boolean, default: void 0 },
    label: String,
    size: String,
    onUpdateChecked: [Function, Array],
    "onUpdate:checked": [Function, Array],
    checkedValue: { type: Boolean, default: void 0 },
  },
  S = t("n-radio-group");
function y(e) {
  const o = p(S, null),
    n = d(e, {
      mergedSize(n) {
        const { size: a } = e;
        if (void 0 !== a) return a;
        if (o) {
          const {
            mergedSizeRef: { value: e },
          } = o;
          if (void 0 !== e) return e;
        }
        return n ? n.mergedSize.value : "medium";
      },
      mergedDisabled: (n) =>
        !!e.disabled ||
        !!(null == o ? void 0 : o.disabledRef.value) ||
        !!(null == n ? void 0 : n.disabled.value),
    }),
    { mergedSizeRef: a, mergedDisabledRef: r } = n,
    t = m(null),
    c = m(null),
    u = m(e.defaultChecked),
    b = x(e, "checked"),
    h = g(b, u),
    v = i(() => (o ? o.valueRef.value === e.value : h.value)),
    f = i(() => {
      const { name: n } = e;
      return void 0 !== n ? n : o ? o.nameRef.value : void 0;
    }),
    w = m(!1);
  function k() {
    r.value ||
      v.value ||
      (function () {
        if (o) {
          const { doUpdateValue: n } = o,
            { value: a } = e;
          s(n, a);
        } else {
          const { onUpdateChecked: o, "onUpdate:checked": a } = e,
            { nTriggerFormInput: r, nTriggerFormChange: d } = n;
          (o && s(o, !0), a && s(a, !0), r(), d(), (u.value = !0));
        }
      })();
  }
  return {
    mergedClsPrefix: o ? o.mergedClsPrefixRef : l(e).mergedClsPrefixRef,
    inputRef: t,
    labelRef: c,
    mergedName: f,
    mergedDisabled: r,
    renderSafeChecked: v,
    focus: w,
    mergedSize: a,
    handleRadioInputChange: function () {
      (k(), t.value && (t.value.checked = v.value));
    },
    handleRadioInputBlur: function () {
      w.value = !1;
    },
    handleRadioInputFocus: function () {
      w.value = !0;
    },
  };
}
const D = w({
  name: "Radio",
  props: Object.assign(Object.assign({}, u.props), R),
  setup(e) {
    const o = y(e),
      n = u("Radio", "-radio", C, b, e, o.mergedClsPrefix),
      a = z(() => {
        const {
            mergedSize: { value: e },
          } = o,
          {
            common: { cubicBezierEaseInOut: a },
            self: {
              boxShadow: r,
              boxShadowActive: d,
              boxShadowDisabled: i,
              boxShadowFocus: l,
              boxShadowHover: t,
              color: s,
              colorDisabled: c,
              colorActive: u,
              textColor: b,
              textColorDisabled: v,
              dotColorActive: f,
              dotColorDisabled: g,
              labelPadding: p,
              labelLineHeight: m,
              labelFontWeight: x,
              [h("fontSize", e)]: w,
              [h("radioSize", e)]: k,
            },
          } = n.value;
        return {
          "--n-bezier": a,
          "--n-label-line-height": m,
          "--n-label-font-weight": x,
          "--n-box-shadow": r,
          "--n-box-shadow-active": d,
          "--n-box-shadow-disabled": i,
          "--n-box-shadow-focus": l,
          "--n-box-shadow-hover": t,
          "--n-color": s,
          "--n-color-active": u,
          "--n-color-disabled": c,
          "--n-dot-color-active": f,
          "--n-dot-color-disabled": g,
          "--n-font-size": w,
          "--n-radio-size": k,
          "--n-text-color": b,
          "--n-text-color-disabled": v,
          "--n-label-padding": p,
        };
      }),
      { inlineThemeDisabled: r, mergedClsPrefixRef: d, mergedRtlRef: i } = l(e),
      t = v("Radio", i, d),
      s = r
        ? f(
            "radio",
            z(() => o.mergedSize.value[0]),
            a,
            e,
          )
        : void 0;
    return Object.assign(o, {
      rtlEnabled: t,
      cssVars: r ? void 0 : a,
      themeClass: null == s ? void 0 : s.themeClass,
      onRender: null == s ? void 0 : s.onRender,
    });
  },
  render() {
    const { $slots: e, mergedClsPrefix: o, onRender: n, label: a } = this;
    return (
      null == n || n(),
      k(
        "label",
        {
          class: [
            `${o}-radio`,
            this.themeClass,
            this.rtlEnabled && `${o}-radio--rtl`,
            this.mergedDisabled && `${o}-radio--disabled`,
            this.renderSafeChecked && `${o}-radio--checked`,
            this.focus && `${o}-radio--focus`,
          ],
          style: this.cssVars,
        },
        k(
          "div",
          { class: `${o}-radio__dot-wrapper` },
          " ",
          k("div", {
            class: [`${o}-radio__dot`, this.renderSafeChecked && `${o}-radio__dot--checked`],
          }),
          k("input", {
            ref: "inputRef",
            type: "radio",
            class: `${o}-radio-input`,
            value: this.value,
            name: this.mergedName,
            checked: this.renderSafeChecked,
            disabled: this.mergedDisabled,
            onChange: this.handleRadioInputChange,
            onFocus: this.handleRadioInputFocus,
            onBlur: this.handleRadioInputBlur,
          }),
        ),
        c(e.default, (e) =>
          e || a ? k("div", { ref: "labelRef", class: `${o}-radio__label` }, e || a) : null,
        ),
      )
    );
  },
});
export { D as _, S as r };
