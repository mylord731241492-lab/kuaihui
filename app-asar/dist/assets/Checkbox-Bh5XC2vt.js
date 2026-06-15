import {
  t as e,
  T as o,
  o as n,
  F as r,
  z as a,
  x as c,
  aZ as l,
  a_ as i,
  G as d,
  y as t,
  I as s,
  q as b,
  O as u,
  ap as h,
  P as v,
  D as k,
  bX as f,
  S as x,
  aU as p,
  v as m,
  U as g,
} from "./index-Ct5UuHQN.js";
import { u as y } from "./use-merged-state-mPE1JA5r.js";
import { j as C, k as w, r as z, c as R, p as S, t as T, i as D } from "./vendor-DHo7BzsC.js";
const $ = n("n-checkbox-group"),
  F = C({
    name: "CheckboxGroup",
    props: {
      min: Number,
      max: Number,
      size: String,
      value: Array,
      defaultValue: { type: Array, default: null },
      disabled: { type: Boolean, default: void 0 },
      "onUpdate:value": [Function, Array],
      onUpdateValue: [Function, Array],
      onChange: [Function, Array],
    },
    setup(n) {
      const { mergedClsPrefixRef: a } = e(n),
        c = o(n),
        { mergedSizeRef: l, mergedDisabledRef: i } = c,
        d = z(n.defaultValue),
        t = R(() => n.value),
        s = y(t, d),
        b = R(() => {
          var e;
          return (null === (e = s.value) || void 0 === e ? void 0 : e.length) || 0;
        }),
        u = R(() => (Array.isArray(s.value) ? new Set(s.value) : new Set()));
      return (
        S($, {
          checkedCountRef: b,
          maxRef: T(n, "max"),
          minRef: T(n, "min"),
          valueSetRef: u,
          disabledRef: i,
          mergedSizeRef: l,
          toggleCheckbox: function (e, o) {
            const { nTriggerFormInput: a, nTriggerFormChange: l } = c,
              { onChange: i, "onUpdate:value": t, onUpdateValue: b } = n;
            if (Array.isArray(s.value)) {
              const n = Array.from(s.value),
                c = n.findIndex((e) => e === o);
              e
                ? ~c ||
                  (n.push(o),
                  b && r(b, n, { actionType: "check", value: o }),
                  t && r(t, n, { actionType: "check", value: o }),
                  a(),
                  l(),
                  (d.value = n),
                  i && r(i, n))
                : ~c &&
                  (n.splice(c, 1),
                  b && r(b, n, { actionType: "uncheck", value: o }),
                  t && r(t, n, { actionType: "uncheck", value: o }),
                  i && r(i, n),
                  (d.value = n),
                  a(),
                  l());
            } else
              e
                ? (b && r(b, [o], { actionType: "check", value: o }),
                  t && r(t, [o], { actionType: "check", value: o }),
                  i && r(i, [o]),
                  (d.value = [o]),
                  a(),
                  l())
                : (b && r(b, [], { actionType: "uncheck", value: o }),
                  t && r(t, [], { actionType: "uncheck", value: o }),
                  i && r(i, []),
                  (d.value = []),
                  a(),
                  l());
          },
        }),
        { mergedClsPrefix: a }
      );
    },
    render() {
      return w(
        "div",
        { class: `${this.mergedClsPrefix}-checkbox-group`, role: "group" },
        this.$slots,
      );
    },
  }),
  A = a([
    c(
      "checkbox",
      "\n font-size: var(--n-font-size);\n outline: none;\n cursor: pointer;\n display: inline-flex;\n flex-wrap: nowrap;\n align-items: flex-start;\n word-break: break-word;\n line-height: var(--n-size);\n --n-merged-color-table: var(--n-color-table);\n ",
      [
        d("show-label", "line-height: var(--n-label-line-height);"),
        a("&:hover", [c("checkbox-box", [t("border", "border: var(--n-border-checked);")])]),
        a("&:focus:not(:active)", [
          c("checkbox-box", [
            t(
              "border",
              "\n border: var(--n-border-focus);\n box-shadow: var(--n-box-shadow-focus);\n ",
            ),
          ]),
        ]),
        d("inside-table", [
          c("checkbox-box", "\n background-color: var(--n-merged-color-table);\n "),
        ]),
        d("checked", [
          c("checkbox-box", "\n background-color: var(--n-color-checked);\n ", [
            c("checkbox-icon", [a(".check-icon", "\n opacity: 1;\n transform: scale(1);\n ")]),
          ]),
        ]),
        d("indeterminate", [
          c("checkbox-box", [
            c("checkbox-icon", [
              a(".check-icon", "\n opacity: 0;\n transform: scale(.5);\n "),
              a(".line-icon", "\n opacity: 1;\n transform: scale(1);\n "),
            ]),
          ]),
        ]),
        d("checked, indeterminate", [
          a("&:focus:not(:active)", [
            c("checkbox-box", [
              t(
                "border",
                "\n border: var(--n-border-checked);\n box-shadow: var(--n-box-shadow-focus);\n ",
              ),
            ]),
          ]),
          c(
            "checkbox-box",
            "\n background-color: var(--n-color-checked);\n border-left: 0;\n border-top: 0;\n ",
            [t("border", { border: "var(--n-border-checked)" })],
          ),
        ]),
        d("disabled", { cursor: "not-allowed" }, [
          d("checked", [
            c("checkbox-box", "\n background-color: var(--n-color-disabled-checked);\n ", [
              t("border", { border: "var(--n-border-disabled-checked)" }),
              c("checkbox-icon", [
                a(".check-icon, .line-icon", {
                  fill: "var(--n-check-mark-color-disabled-checked)",
                }),
              ]),
            ]),
          ]),
          c("checkbox-box", "\n background-color: var(--n-color-disabled);\n ", [
            t("border", "\n border: var(--n-border-disabled);\n "),
            c("checkbox-icon", [
              a(".check-icon, .line-icon", "\n fill: var(--n-check-mark-color-disabled);\n "),
            ]),
          ]),
          t("label", "\n color: var(--n-text-color-disabled);\n "),
        ]),
        c(
          "checkbox-box-wrapper",
          "\n position: relative;\n width: var(--n-size);\n flex-shrink: 0;\n flex-grow: 0;\n user-select: none;\n -webkit-user-select: none;\n ",
        ),
        c(
          "checkbox-box",
          "\n position: absolute;\n left: 0;\n top: 50%;\n transform: translateY(-50%);\n height: var(--n-size);\n width: var(--n-size);\n display: inline-block;\n box-sizing: border-box;\n border-radius: var(--n-border-radius);\n background-color: var(--n-color);\n transition: background-color 0.3s var(--n-bezier);\n ",
          [
            t(
              "border",
              "\n transition:\n border-color .3s var(--n-bezier),\n box-shadow .3s var(--n-bezier);\n border-radius: inherit;\n position: absolute;\n left: 0;\n right: 0;\n top: 0;\n bottom: 0;\n border: var(--n-border);\n ",
            ),
            c(
              "checkbox-icon",
              "\n display: flex;\n align-items: center;\n justify-content: center;\n position: absolute;\n left: 1px;\n right: 1px;\n top: 1px;\n bottom: 1px;\n ",
              [
                a(
                  ".check-icon, .line-icon",
                  "\n width: 100%;\n fill: var(--n-check-mark-color);\n opacity: 0;\n transform: scale(0.5);\n transform-origin: center;\n transition:\n fill 0.3s var(--n-bezier),\n transform 0.3s var(--n-bezier),\n opacity 0.3s var(--n-bezier),\n border-color 0.3s var(--n-bezier);\n ",
                ),
                s({ left: "1px", top: "1px" }),
              ],
            ),
          ],
        ),
        t(
          "label",
          "\n color: var(--n-text-color);\n transition: color .3s var(--n-bezier);\n user-select: none;\n -webkit-user-select: none;\n padding: var(--n-label-padding);\n font-weight: var(--n-label-font-weight);\n ",
          [a("&:empty", { display: "none" })],
        ),
      ],
    ),
    l(c("checkbox", "\n --n-merged-color-table: var(--n-color-table-modal);\n ")),
    i(c("checkbox", "\n --n-merged-color-table: var(--n-color-table-popover);\n ")),
  ]),
  B = C({
    name: "Checkbox",
    props: Object.assign(Object.assign({}, k.props), {
      size: String,
      checked: { type: [Boolean, String, Number], default: void 0 },
      defaultChecked: { type: [Boolean, String, Number], default: !1 },
      value: [String, Number],
      disabled: { type: Boolean, default: void 0 },
      indeterminate: Boolean,
      label: String,
      focusable: { type: Boolean, default: !0 },
      checkedValue: { type: [Boolean, String, Number], default: !0 },
      uncheckedValue: { type: [Boolean, String, Number], default: !1 },
      "onUpdate:checked": [Function, Array],
      onUpdateChecked: [Function, Array],
      privateInsideTable: Boolean,
      onChange: [Function, Array],
    }),
    setup(n) {
      const a = D($, null),
        c = z(null),
        { mergedClsPrefixRef: l, inlineThemeDisabled: i, mergedRtlRef: d } = e(n),
        t = z(n.defaultChecked),
        s = T(n, "checked"),
        b = y(s, t),
        u = v(() => {
          if (a) {
            const e = a.valueSetRef.value;
            return !(!e || void 0 === n.value) && e.has(n.value);
          }
          return b.value === n.checkedValue;
        }),
        h = o(n, {
          mergedSize(e) {
            const { size: o } = n;
            if (void 0 !== o) return o;
            if (a) {
              const { value: e } = a.mergedSizeRef;
              if (void 0 !== e) return e;
            }
            if (e) {
              const { mergedSize: o } = e;
              if (void 0 !== o) return o.value;
            }
            return "medium";
          },
          mergedDisabled(e) {
            const { disabled: o } = n;
            if (void 0 !== o) return o;
            if (a) {
              if (a.disabledRef.value) return !0;
              const {
                maxRef: { value: e },
                checkedCountRef: o,
              } = a;
              if (void 0 !== e && o.value >= e && !u.value) return !0;
              const {
                minRef: { value: n },
              } = a;
              if (void 0 !== n && o.value <= n && u.value) return !0;
            }
            return !!e && e.disabled.value;
          },
        }),
        { mergedDisabledRef: C, mergedSizeRef: w } = h,
        S = k("Checkbox", "-checkbox", A, f, n, l);
      function F(e) {
        if (a && void 0 !== n.value) a.toggleCheckbox(!u.value, n.value);
        else {
          const { onChange: o, "onUpdate:checked": a, onUpdateChecked: c } = n,
            { nTriggerFormInput: l, nTriggerFormChange: i } = h,
            d = u.value ? n.uncheckedValue : n.checkedValue;
          (a && r(a, d, e), c && r(c, d, e), o && r(o, d, e), l(), i(), (t.value = d));
        }
      }
      const B = {
          focus: () => {
            var e;
            null === (e = c.value) || void 0 === e || e.focus();
          },
          blur: () => {
            var e;
            null === (e = c.value) || void 0 === e || e.blur();
          },
        },
        U = x("Checkbox", d, l),
        V = R(() => {
          const { value: e } = w,
            {
              common: { cubicBezierEaseInOut: o },
              self: {
                borderRadius: n,
                color: r,
                colorChecked: a,
                colorDisabled: c,
                colorTableHeader: l,
                colorTableHeaderModal: i,
                colorTableHeaderPopover: d,
                checkMarkColor: t,
                checkMarkColorDisabled: s,
                border: b,
                borderFocus: u,
                borderDisabled: h,
                borderChecked: v,
                boxShadowFocus: k,
                textColor: f,
                textColorDisabled: x,
                checkMarkColorDisabledChecked: m,
                colorDisabledChecked: g,
                borderDisabledChecked: y,
                labelPadding: C,
                labelLineHeight: z,
                labelFontWeight: R,
                [p("fontSize", e)]: T,
                [p("size", e)]: D,
              },
            } = S.value;
          return {
            "--n-label-line-height": z,
            "--n-label-font-weight": R,
            "--n-size": D,
            "--n-bezier": o,
            "--n-border-radius": n,
            "--n-border": b,
            "--n-border-checked": v,
            "--n-border-focus": u,
            "--n-border-disabled": h,
            "--n-border-disabled-checked": y,
            "--n-box-shadow-focus": k,
            "--n-color": r,
            "--n-color-checked": a,
            "--n-color-table": l,
            "--n-color-table-modal": i,
            "--n-color-table-popover": d,
            "--n-color-disabled": c,
            "--n-color-disabled-checked": g,
            "--n-text-color": f,
            "--n-text-color-disabled": x,
            "--n-check-mark-color": t,
            "--n-check-mark-color-disabled": s,
            "--n-check-mark-color-disabled-checked": m,
            "--n-font-size": T,
            "--n-label-padding": C,
          };
        }),
        I = i
          ? m(
              "checkbox",
              R(() => w.value[0]),
              V,
              n,
            )
          : void 0;
      return Object.assign(h, B, {
        rtlEnabled: U,
        selfRef: c,
        mergedClsPrefix: l,
        mergedDisabled: C,
        renderedChecked: u,
        mergedTheme: S,
        labelId: g(),
        handleClick: function (e) {
          C.value || F(e);
        },
        handleKeyUp: function (e) {
          if (!C.value)
            switch (e.key) {
              case " ":
              case "Enter":
                F(e);
            }
        },
        handleKeyDown: function (e) {
          if (" " === e.key) e.preventDefault();
        },
        cssVars: i ? void 0 : V,
        themeClass: null == I ? void 0 : I.themeClass,
        onRender: null == I ? void 0 : I.onRender,
      });
    },
    render() {
      var e;
      const {
        $slots: o,
        renderedChecked: n,
        mergedDisabled: r,
        indeterminate: a,
        privateInsideTable: c,
        cssVars: l,
        labelId: i,
        label: d,
        mergedClsPrefix: t,
        focusable: s,
        handleKeyUp: v,
        handleKeyDown: k,
        handleClick: f,
      } = this;
      null === (e = this.onRender) || void 0 === e || e.call(this);
      const x = b(o.default, (e) =>
        d || e ? w("span", { class: `${t}-checkbox__label`, id: i }, d || e) : null,
      );
      return w(
        "div",
        {
          ref: "selfRef",
          class: [
            `${t}-checkbox`,
            this.themeClass,
            this.rtlEnabled && `${t}-checkbox--rtl`,
            n && `${t}-checkbox--checked`,
            r && `${t}-checkbox--disabled`,
            a && `${t}-checkbox--indeterminate`,
            c && `${t}-checkbox--inside-table`,
            x && `${t}-checkbox--show-label`,
          ],
          tabindex: r || !s ? void 0 : 0,
          role: "checkbox",
          "aria-checked": a ? "mixed" : n,
          "aria-labelledby": i,
          style: l,
          onKeyup: v,
          onKeydown: k,
          onClick: f,
          onMousedown: () => {
            h(
              "selectstart",
              window,
              (e) => {
                e.preventDefault();
              },
              { once: !0 },
            );
          },
        },
        w(
          "div",
          { class: `${t}-checkbox-box-wrapper` },
          " ",
          w(
            "div",
            { class: `${t}-checkbox-box` },
            w(u, null, {
              default: () =>
                this.indeterminate
                  ? w(
                      "div",
                      { key: "indeterminate", class: `${t}-checkbox-icon` },
                      w(
                        "svg",
                        { viewBox: "0 0 100 100", class: "line-icon" },
                        w("path", {
                          d: "M80.2,55.5H21.4c-2.8,0-5.1-2.5-5.1-5.5l0,0c0-3,2.3-5.5,5.1-5.5h58.7c2.8,0,5.1,2.5,5.1,5.5l0,0C85.2,53.1,82.9,55.5,80.2,55.5z",
                        }),
                      ),
                    )
                  : w(
                      "div",
                      { key: "check", class: `${t}-checkbox-icon` },
                      w(
                        "svg",
                        { viewBox: "0 0 64 64", class: "check-icon" },
                        w("path", {
                          d: "M50.42,16.76L22.34,39.45l-8.1-11.46c-1.12-1.58-3.3-1.96-4.88-0.84c-1.58,1.12-1.95,3.3-0.84,4.88l10.26,14.51  c0.56,0.79,1.42,1.31,2.38,1.45c0.16,0.02,0.32,0.03,0.48,0.03c0.8,0,1.57-0.27,2.2-0.78l30.99-25.03c1.5-1.21,1.74-3.42,0.52-4.92  C54.13,15.78,51.93,15.55,50.42,16.76z",
                        }),
                      ),
                    ),
            }),
            w("div", { class: `${t}-checkbox-box__border` }),
          ),
        ),
        x,
      );
    },
  });
export { B as _, F as a };
