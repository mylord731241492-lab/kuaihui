import {
  z as e,
  x as n,
  q as t,
  t as i,
  D as l,
  bY as r,
  T as o,
  P as u,
  S as a,
  bZ as s,
  p as d,
  N as f,
  aK as c,
  F as p,
  ap as v,
} from "./index-Ct5UuHQN.js";
import { _ as m } from "./Input-BbH8ts9k.js";
import { u as h } from "./use-locale-BcUKARuA.js";
import { u as g } from "./use-merged-state-mPE1JA5r.js";
import { j as b, k as x, r as w, t as y, w as I, c as B, x as V } from "./vendor-DHo7BzsC.js";
import { A as P } from "./Add-DB3n_hTA.js";
const T = b({
    name: "Remove",
    render: () =>
      x(
        "svg",
        { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 512 512" },
        x("line", {
          x1: "400",
          y1: "256",
          x2: "112",
          y2: "256",
          style:
            "\n        fill: none;\n        stroke: currentColor;\n        stroke-linecap: round;\n        stroke-linejoin: round;\n        stroke-width: 32px;\n      ",
        }),
      ),
  }),
  O = e([
    n("input-number-suffix", "\n display: inline-block;\n margin-right: 10px;\n "),
    n("input-number-prefix", "\n display: inline-block;\n margin-left: 10px;\n "),
  ]);
function D(e) {
  return null == e || ("string" == typeof e && "" === e.trim()) ? null : Number(e);
}
function F(e) {
  return null == e || !Number.isNaN(e);
}
function C(e, n) {
  return "number" != typeof e ? "" : void 0 === n ? String(e) : e.toFixed(n);
}
function N(e) {
  if (null === e) return null;
  if ("number" == typeof e) return e;
  {
    const n = Number(e);
    return Number.isNaN(n) ? null : n;
  }
}
const S = b({
  name: "InputNumber",
  props: Object.assign(Object.assign({}, l.props), {
    autofocus: Boolean,
    loading: { type: Boolean, default: void 0 },
    placeholder: String,
    defaultValue: { type: Number, default: null },
    value: Number,
    step: { type: [Number, String], default: 1 },
    min: [Number, String],
    max: [Number, String],
    size: String,
    disabled: { type: Boolean, default: void 0 },
    validator: Function,
    bordered: { type: Boolean, default: void 0 },
    showButton: { type: Boolean, default: !0 },
    buttonPlacement: { type: String, default: "right" },
    inputProps: Object,
    readonly: Boolean,
    clearable: Boolean,
    keyboard: { type: Object, default: {} },
    updateValueOnInput: { type: Boolean, default: !0 },
    round: { type: Boolean, default: void 0 },
    parse: Function,
    format: Function,
    precision: Number,
    status: String,
    "onUpdate:value": [Function, Array],
    onUpdateValue: [Function, Array],
    onFocus: [Function, Array],
    onBlur: [Function, Array],
    onClear: [Function, Array],
    onChange: [Function, Array],
  }),
  slots: Object,
  setup(e) {
    const { mergedBorderedRef: n, mergedClsPrefixRef: t, mergedRtlRef: d } = i(e),
      f = l("InputNumber", "-input-number", O, r, e, t),
      { localeRef: c } = h("InputNumber"),
      m = o(e),
      { mergedSizeRef: b, mergedDisabledRef: x, mergedStatusRef: P } = m,
      T = w(null),
      S = w(null),
      U = w(null),
      k = w(e.defaultValue),
      M = y(e, "value"),
      R = g(M, k),
      A = w(""),
      j = (e) => {
        const n = String(e).split(".")[1];
        return n ? n.length : 0;
      },
      $ = u(() => {
        const { placeholder: n } = e;
        return void 0 !== n ? n : c.value.placeholder;
      }),
      E = u(() => {
        const n = N(e.step);
        return null !== n ? (0 === n ? 1 : Math.abs(n)) : 1;
      }),
      z = u(() => {
        const n = N(e.min);
        return null !== n ? n : null;
      }),
      K = u(() => {
        const n = N(e.max);
        return null !== n ? n : null;
      }),
      L = () => {
        const { value: n } = R;
        if (F(n)) {
          const { format: t, precision: i } = e;
          t
            ? (A.value = t(n))
            : null === n || void 0 === i || j(n) > i
              ? (A.value = C(n, void 0))
              : (A.value = C(n, i));
        } else A.value = String(n);
      };
    L();
    const _ = (n) => {
        const { value: t } = R;
        if (n === t) return void L();
        const { "onUpdate:value": i, onUpdateValue: l, onChange: r } = e,
          { nTriggerFormInput: o, nTriggerFormChange: u } = m;
        (r && p(r, n), l && p(l, n), i && p(i, n), (k.value = n), o(), u());
      },
      q = ({ offset: n, doUpdateIfValid: t, fixPrecision: i, isInputing: l }) => {
        const { value: r } = A;
        if (
          l &&
          (((o = r).includes(".") && (/^(-)?\d+.*(\.|0)$/.test(o) || /^-?\d*$/.test(o))) ||
            "-" === o ||
            "-0" === o)
        )
          return !1;
        var o;
        const u = (e.parse || D)(r);
        if (null === u) return (t && _(null), null);
        if (F(u)) {
          const r = j(u),
            { precision: o } = e;
          if (void 0 !== o && o < r && !i) return !1;
          let a = Number.parseFloat(
            (u + n).toFixed(
              null != o
                ? o
                : ((n) => {
                    const t = [e.min, e.max, e.step, n].map((e) => (void 0 === e ? 0 : j(e)));
                    return Math.max(...t);
                  })(u),
            ),
          );
          if (F(a)) {
            const { value: n } = K,
              { value: i } = z;
            if (null !== n && a > n) {
              if (!t || l) return !1;
              a = n;
            }
            if (null !== i && a < i) {
              if (!t || l) return !1;
              a = i;
            }
            return !(e.validator && !e.validator(a)) && (t && _(a), a);
          }
        }
        return !1;
      },
      Y = u(() => !1 === q({ offset: 0, doUpdateIfValid: !1, isInputing: !1, fixPrecision: !1 })),
      Z = u(() => {
        const { value: n } = R;
        if (e.validator && null === n) return !1;
        const { value: t } = E;
        return !1 !== q({ offset: -t, doUpdateIfValid: !1, isInputing: !1, fixPrecision: !1 });
      }),
      G = u(() => {
        const { value: n } = R;
        if (e.validator && null === n) return !1;
        const { value: t } = E;
        return !1 !== q({ offset: +t, doUpdateIfValid: !1, isInputing: !1, fixPrecision: !1 });
      });
    function H() {
      const { value: n } = G;
      if (!n) return void re();
      const { value: t } = R;
      if (null === t) e.validator || _(X());
      else {
        const { value: e } = E;
        q({ offset: e, doUpdateIfValid: !0, isInputing: !1, fixPrecision: !0 });
      }
    }
    function J() {
      const { value: n } = Z;
      if (!n) return void ie();
      const { value: t } = R;
      if (null === t) e.validator || _(X());
      else {
        const { value: e } = E;
        q({ offset: -e, doUpdateIfValid: !0, isInputing: !1, fixPrecision: !0 });
      }
    }
    const Q = function (n) {
        const { onFocus: t } = e,
          { nTriggerFormFocus: i } = m;
        (t && p(t, n), i());
      },
      W = function (n) {
        var t, i;
        if (n.target === (null === (t = T.value) || void 0 === t ? void 0 : t.wrapperElRef)) return;
        const l = q({ offset: 0, doUpdateIfValid: !0, isInputing: !1, fixPrecision: !0 });
        if (!1 !== l) {
          const e = null === (i = T.value) || void 0 === i ? void 0 : i.inputElRef;
          (e && (e.value = String(l || "")), R.value === l && L());
        } else L();
        const { onBlur: r } = e,
          { nTriggerFormBlur: o } = m;
        (r && p(r, n),
          o(),
          V(() => {
            L();
          }));
      };
    function X() {
      if (e.validator) return null;
      const { value: n } = z,
        { value: t } = K;
      return null !== n ? Math.max(0, n) : null !== t ? Math.min(0, t) : 0;
    }
    let ee = null,
      ne = null,
      te = null;
    function ie() {
      (te && (window.clearTimeout(te), (te = null)), ee && (window.clearInterval(ee), (ee = null)));
    }
    let le = null;
    function re() {
      (le && (window.clearTimeout(le), (le = null)), ne && (window.clearInterval(ne), (ne = null)));
    }
    I(R, () => {
      L();
    });
    const oe = {
        focus: () => {
          var e;
          return null === (e = T.value) || void 0 === e ? void 0 : e.focus();
        },
        blur: () => {
          var e;
          return null === (e = T.value) || void 0 === e ? void 0 : e.blur();
        },
        select: () => {
          var e;
          return null === (e = T.value) || void 0 === e ? void 0 : e.select();
        },
      },
      ue = a("InputNumber", d, t);
    return Object.assign(Object.assign({}, oe), {
      rtlEnabled: ue,
      inputInstRef: T,
      minusButtonInstRef: S,
      addButtonInstRef: U,
      mergedClsPrefix: t,
      mergedBordered: n,
      uncontrolledValue: k,
      mergedValue: R,
      mergedPlaceholder: $,
      displayedValueInvalid: Y,
      mergedSize: b,
      mergedDisabled: x,
      displayedValue: A,
      addable: G,
      minusable: Z,
      mergedStatus: P,
      handleFocus: Q,
      handleBlur: W,
      handleClear: function (n) {
        (!(function (n) {
          const { onClear: t } = e;
          t && p(t, n);
        })(n),
          _(null));
      },
      handleMouseDown: function (e) {
        var n, t, i;
        ((null === (n = U.value) || void 0 === n ? void 0 : n.$el.contains(e.target)) &&
          e.preventDefault(),
          (null === (t = S.value) || void 0 === t ? void 0 : t.$el.contains(e.target)) &&
            e.preventDefault(),
          null === (i = T.value) || void 0 === i || i.activate());
      },
      handleAddClick: () => {
        ne || H();
      },
      handleMinusClick: () => {
        ee || J();
      },
      handleAddMousedown: function () {
        (re(),
          (le = window.setTimeout(() => {
            ne = window.setInterval(() => {
              H();
            }, 100);
          }, 800)),
          v("mouseup", document, re, { once: !0 }));
      },
      handleMinusMousedown: function () {
        (ie(),
          (te = window.setTimeout(() => {
            ee = window.setInterval(() => {
              J();
            }, 100);
          }, 800)),
          v("mouseup", document, ie, { once: !0 }));
      },
      handleKeyDown: function (n) {
        var t, i;
        if ("Enter" === n.key) {
          if (n.target === (null === (t = T.value) || void 0 === t ? void 0 : t.wrapperElRef))
            return;
          !1 !== q({ offset: 0, doUpdateIfValid: !0, isInputing: !1, fixPrecision: !0 }) &&
            (null === (i = T.value) || void 0 === i || i.deactivate());
        } else if ("ArrowUp" === n.key) {
          if (!G.value) return;
          if (!1 === e.keyboard.ArrowUp) return;
          n.preventDefault();
          !1 !== q({ offset: 0, doUpdateIfValid: !0, isInputing: !1, fixPrecision: !0 }) && H();
        } else if ("ArrowDown" === n.key) {
          if (!Z.value) return;
          if (!1 === e.keyboard.ArrowDown) return;
          n.preventDefault();
          !1 !== q({ offset: 0, doUpdateIfValid: !0, isInputing: !1, fixPrecision: !0 }) && J();
        }
      },
      handleUpdateDisplayedValue: function (n) {
        ((A.value = n),
          !e.updateValueOnInput ||
            e.format ||
            e.parse ||
            void 0 !== e.precision ||
            q({ offset: 0, doUpdateIfValid: !0, isInputing: !0, fixPrecision: !1 }));
      },
      mergedTheme: f,
      inputThemeOverrides: {
        paddingSmall: "0 8px 0 10px",
        paddingMedium: "0 8px 0 12px",
        paddingLarge: "0 8px 0 14px",
      },
      buttonThemeOverrides: B(() => {
        const {
            self: { iconColorDisabled: e },
          } = f.value,
          [n, t, i, l] = s(e);
        return { textColorTextDisabled: `rgb(${n}, ${t}, ${i})`, opacityDisabled: `${l}` };
      }),
    });
  },
  render() {
    const { mergedClsPrefix: e, $slots: n } = this,
      i = () =>
        x(
          c,
          {
            text: !0,
            disabled: !this.minusable || this.mergedDisabled || this.readonly,
            focusable: !1,
            theme: this.mergedTheme.peers.Button,
            themeOverrides: this.mergedTheme.peerOverrides.Button,
            builtinThemeOverrides: this.buttonThemeOverrides,
            onClick: this.handleMinusClick,
            onMousedown: this.handleMinusMousedown,
            ref: "minusButtonInstRef",
          },
          {
            icon: () =>
              d(n["minus-icon"], () => [x(f, { clsPrefix: e }, { default: () => x(T, null) })]),
          },
        ),
      l = () =>
        x(
          c,
          {
            text: !0,
            disabled: !this.addable || this.mergedDisabled || this.readonly,
            focusable: !1,
            theme: this.mergedTheme.peers.Button,
            themeOverrides: this.mergedTheme.peerOverrides.Button,
            builtinThemeOverrides: this.buttonThemeOverrides,
            onClick: this.handleAddClick,
            onMousedown: this.handleAddMousedown,
            ref: "addButtonInstRef",
          },
          {
            icon: () =>
              d(n["add-icon"], () => [x(f, { clsPrefix: e }, { default: () => x(P, null) })]),
          },
        );
    return x(
      "div",
      { class: [`${e}-input-number`, this.rtlEnabled && `${e}-input-number--rtl`] },
      x(
        m,
        {
          ref: "inputInstRef",
          autofocus: this.autofocus,
          status: this.mergedStatus,
          bordered: this.mergedBordered,
          loading: this.loading,
          value: this.displayedValue,
          onUpdateValue: this.handleUpdateDisplayedValue,
          theme: this.mergedTheme.peers.Input,
          themeOverrides: this.mergedTheme.peerOverrides.Input,
          builtinThemeOverrides: this.inputThemeOverrides,
          size: this.mergedSize,
          placeholder: this.mergedPlaceholder,
          disabled: this.mergedDisabled,
          readonly: this.readonly,
          round: this.round,
          textDecoration: this.displayedValueInvalid ? "line-through" : void 0,
          onFocus: this.handleFocus,
          onBlur: this.handleBlur,
          onKeydown: this.handleKeyDown,
          onMousedown: this.handleMouseDown,
          onClear: this.handleClear,
          clearable: this.clearable,
          inputProps: this.inputProps,
          internalLoadingBeforeSuffix: !0,
        },
        {
          prefix: () => {
            var l;
            return this.showButton && "both" === this.buttonPlacement
              ? [
                  i(),
                  t(n.prefix, (n) =>
                    n ? x("span", { class: `${e}-input-number-prefix` }, n) : null,
                  ),
                ]
              : null === (l = n.prefix) || void 0 === l
                ? void 0
                : l.call(n);
          },
          suffix: () => {
            var r;
            return this.showButton
              ? [
                  t(n.suffix, (n) =>
                    n ? x("span", { class: `${e}-input-number-suffix` }, n) : null,
                  ),
                  "right" === this.buttonPlacement ? i() : null,
                  l(),
                ]
              : null === (r = n.suffix) || void 0 === r
                ? void 0
                : r.call(n);
          },
        },
      ),
    );
  },
});
export { S as _ };
