import {
  x as e,
  y as n,
  z as t,
  G as a,
  aP as i,
  I as o,
  bi as r,
  q as l,
  t as s,
  D as c,
  c5 as d,
  T as h,
  aU as u,
  bA as b,
  bw as v,
  v as g,
  O as f,
  bS as p,
  F as w,
} from "./index-Ct5UuHQN.js";
import { u as m } from "./use-merged-state-mPE1JA5r.js";
import { j as k, k as y, r as x, t as $, c as _ } from "./vendor-DHo7BzsC.js";
const C = e(
  "switch",
  "\n height: var(--n-height);\n min-width: var(--n-width);\n vertical-align: middle;\n user-select: none;\n -webkit-user-select: none;\n display: inline-flex;\n outline: none;\n justify-content: center;\n align-items: center;\n",
  [
    n(
      "children-placeholder",
      "\n height: var(--n-rail-height);\n display: flex;\n flex-direction: column;\n overflow: hidden;\n pointer-events: none;\n visibility: hidden;\n ",
    ),
    n("rail-placeholder", "\n display: flex;\n flex-wrap: none;\n "),
    n(
      "button-placeholder",
      "\n width: calc(1.75 * var(--n-rail-height));\n height: var(--n-rail-height);\n ",
    ),
    e(
      "base-loading",
      "\n position: absolute;\n top: 50%;\n left: 50%;\n transform: translateX(-50%) translateY(-50%);\n font-size: calc(var(--n-button-width) - 4px);\n color: var(--n-loading-color);\n transition: color .3s var(--n-bezier);\n ",
      [o({ left: "50%", top: "50%", originalTransform: "translateX(-50%) translateY(-50%)" })],
    ),
    n(
      "checked, unchecked",
      "\n transition: color .3s var(--n-bezier);\n color: var(--n-text-color);\n box-sizing: border-box;\n position: absolute;\n white-space: nowrap;\n top: 0;\n bottom: 0;\n display: flex;\n align-items: center;\n line-height: 1;\n ",
    ),
    n(
      "checked",
      "\n right: 0;\n padding-right: calc(1.25 * var(--n-rail-height) - var(--n-offset));\n ",
    ),
    n(
      "unchecked",
      "\n left: 0;\n justify-content: flex-end;\n padding-left: calc(1.25 * var(--n-rail-height) - var(--n-offset));\n ",
    ),
    t("&:focus", [n("rail", "\n box-shadow: var(--n-box-shadow-focus);\n ")]),
    a("round", [
      n("rail", "border-radius: calc(var(--n-rail-height) / 2);", [
        n("button", "border-radius: calc(var(--n-button-height) / 2);"),
      ]),
    ]),
    i("disabled", [
      i("icon", [
        a("rubber-band", [
          a("pressed", [n("rail", [n("button", "max-width: var(--n-button-width-pressed);")])]),
          n("rail", [t("&:active", [n("button", "max-width: var(--n-button-width-pressed);")])]),
          a("active", [
            a("pressed", [
              n("rail", [
                n("button", "left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));"),
              ]),
            ]),
            n("rail", [
              t("&:active", [
                n("button", "left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));"),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]),
    a("active", [
      n("rail", [n("button", "left: calc(100% - var(--n-button-width) - var(--n-offset))")]),
    ]),
    n(
      "rail",
      "\n overflow: hidden;\n height: var(--n-rail-height);\n min-width: var(--n-rail-width);\n border-radius: var(--n-rail-border-radius);\n cursor: pointer;\n position: relative;\n transition:\n opacity .3s var(--n-bezier),\n background .3s var(--n-bezier),\n box-shadow .3s var(--n-bezier);\n background-color: var(--n-rail-color);\n ",
      [
        n(
          "button-icon",
          "\n color: var(--n-icon-color);\n transition: color .3s var(--n-bezier);\n font-size: calc(var(--n-button-height) - 4px);\n position: absolute;\n left: 0;\n right: 0;\n top: 0;\n bottom: 0;\n display: flex;\n justify-content: center;\n align-items: center;\n line-height: 1;\n ",
          [o()],
        ),
        n(
          "button",
          '\n align-items: center; \n top: var(--n-offset);\n left: var(--n-offset);\n height: var(--n-button-height);\n width: var(--n-button-width-pressed);\n max-width: var(--n-button-width);\n border-radius: var(--n-button-border-radius);\n background-color: var(--n-button-color);\n box-shadow: var(--n-button-box-shadow);\n box-sizing: border-box;\n cursor: inherit;\n content: "";\n position: absolute;\n transition:\n background-color .3s var(--n-bezier),\n left .3s var(--n-bezier),\n opacity .3s var(--n-bezier),\n max-width .3s var(--n-bezier),\n box-shadow .3s var(--n-bezier);\n ',
        ),
      ],
    ),
    a("active", [n("rail", "background-color: var(--n-rail-color-active);")]),
    a("loading", [n("rail", "\n cursor: wait;\n ")]),
    a("disabled", [n("rail", "\n cursor: not-allowed;\n opacity: .5;\n ")]),
  ],
);
let S;
const z = k({
  name: "Switch",
  props: Object.assign(Object.assign({}, c.props), {
    size: { type: String, default: "medium" },
    value: { type: [String, Number, Boolean], default: void 0 },
    loading: Boolean,
    defaultValue: { type: [String, Number, Boolean], default: !1 },
    disabled: { type: Boolean, default: void 0 },
    round: { type: Boolean, default: !0 },
    "onUpdate:value": [Function, Array],
    onUpdateValue: [Function, Array],
    checkedValue: { type: [String, Number, Boolean], default: !0 },
    uncheckedValue: { type: [String, Number, Boolean], default: !1 },
    railStyle: Function,
    rubberBand: { type: Boolean, default: !0 },
    onChange: [Function, Array],
  }),
  slots: Object,
  setup(e) {
    void 0 === S &&
      (S =
        "undefined" == typeof CSS ||
        (void 0 !== CSS.supports && CSS.supports("width", "max(1px)")));
    const { mergedClsPrefixRef: n, inlineThemeDisabled: t } = s(e),
      a = c("Switch", "-switch", C, d, e, n),
      i = h(e),
      { mergedSizeRef: o, mergedDisabledRef: r } = i,
      l = x(e.defaultValue),
      f = $(e, "value"),
      p = m(f, l),
      k = _(() => p.value === e.checkedValue),
      y = x(!1),
      z = x(!1),
      B = _(() => {
        const { railStyle: n } = e;
        if (n) return n({ focused: z.value, checked: k.value });
      });
    function V(n) {
      const { "onUpdate:value": t, onChange: a, onUpdateValue: o } = e,
        { nTriggerFormInput: r, nTriggerFormChange: s } = i;
      (t && w(t, n), o && w(o, n), a && w(a, n), (l.value = n), r(), s());
    }
    const F = _(() => {
        const { value: e } = o,
          {
            self: {
              opacityDisabled: n,
              railColor: t,
              railColorActive: i,
              buttonBoxShadow: r,
              buttonColor: l,
              boxShadowFocus: s,
              loadingColor: c,
              textColor: d,
              iconColor: h,
              [u("buttonHeight", e)]: g,
              [u("buttonWidth", e)]: f,
              [u("buttonWidthPressed", e)]: p,
              [u("railHeight", e)]: w,
              [u("railWidth", e)]: m,
              [u("railBorderRadius", e)]: k,
              [u("buttonBorderRadius", e)]: y,
            },
            common: { cubicBezierEaseInOut: x },
          } = a.value;
        let $, _, C;
        return (
          S
            ? (($ = `calc((${w} - ${g}) / 2)`),
              (_ = `max(${w}, ${g})`),
              (C = `max(${m}, calc(${m} + ${g} - ${w}))`))
            : (($ = b((v(w) - v(g)) / 2)),
              (_ = b(Math.max(v(w), v(g)))),
              (C = v(w) > v(g) ? m : b(v(m) + v(g) - v(w)))),
          {
            "--n-bezier": x,
            "--n-button-border-radius": y,
            "--n-button-box-shadow": r,
            "--n-button-color": l,
            "--n-button-width": f,
            "--n-button-width-pressed": p,
            "--n-button-height": g,
            "--n-height": _,
            "--n-offset": $,
            "--n-opacity-disabled": n,
            "--n-rail-border-radius": k,
            "--n-rail-color": t,
            "--n-rail-color-active": i,
            "--n-rail-height": w,
            "--n-rail-width": m,
            "--n-width": C,
            "--n-box-shadow-focus": s,
            "--n-loading-color": c,
            "--n-text-color": d,
            "--n-icon-color": h,
          }
        );
      }),
      j = t
        ? g(
            "switch",
            _(() => o.value[0]),
            F,
            e,
          )
        : void 0;
    return {
      handleClick: function () {
        e.loading ||
          r.value ||
          (p.value !== e.checkedValue ? V(e.checkedValue) : V(e.uncheckedValue));
      },
      handleBlur: function () {
        ((z.value = !1),
          (function () {
            const { nTriggerFormBlur: e } = i;
            e();
          })(),
          (y.value = !1));
      },
      handleFocus: function () {
        ((z.value = !0),
          (function () {
            const { nTriggerFormFocus: e } = i;
            e();
          })());
      },
      handleKeyup: function (n) {
        e.loading ||
          r.value ||
          (" " === n.key &&
            (p.value !== e.checkedValue ? V(e.checkedValue) : V(e.uncheckedValue), (y.value = !1)));
      },
      handleKeydown: function (n) {
        e.loading || r.value || (" " === n.key && (n.preventDefault(), (y.value = !0)));
      },
      mergedRailStyle: B,
      pressed: y,
      mergedClsPrefix: n,
      mergedValue: p,
      checked: k,
      mergedDisabled: r,
      cssVars: t ? void 0 : F,
      themeClass: null == j ? void 0 : j.themeClass,
      onRender: null == j ? void 0 : j.onRender,
    };
  },
  render() {
    const {
      mergedClsPrefix: e,
      mergedDisabled: n,
      checked: t,
      mergedRailStyle: a,
      onRender: i,
      $slots: o,
    } = this;
    null == i || i();
    const { checked: s, unchecked: c, icon: d, "checked-icon": h, "unchecked-icon": u } = o,
      b = !(r(d) && r(h) && r(u));
    return y(
      "div",
      {
        role: "switch",
        "aria-checked": t,
        class: [
          `${e}-switch`,
          this.themeClass,
          b && `${e}-switch--icon`,
          t && `${e}-switch--active`,
          n && `${e}-switch--disabled`,
          this.round && `${e}-switch--round`,
          this.loading && `${e}-switch--loading`,
          this.pressed && `${e}-switch--pressed`,
          this.rubberBand && `${e}-switch--rubber-band`,
        ],
        tabindex: this.mergedDisabled ? void 0 : 0,
        style: this.cssVars,
        onClick: this.handleClick,
        onFocus: this.handleFocus,
        onBlur: this.handleBlur,
        onKeyup: this.handleKeyup,
        onKeydown: this.handleKeydown,
      },
      y(
        "div",
        { class: `${e}-switch__rail`, "aria-hidden": "true", style: a },
        l(s, (n) =>
          l(c, (t) =>
            n || t
              ? y(
                  "div",
                  { "aria-hidden": !0, class: `${e}-switch__children-placeholder` },
                  y(
                    "div",
                    { class: `${e}-switch__rail-placeholder` },
                    y("div", { class: `${e}-switch__button-placeholder` }),
                    n,
                  ),
                  y(
                    "div",
                    { class: `${e}-switch__rail-placeholder` },
                    y("div", { class: `${e}-switch__button-placeholder` }),
                    t,
                  ),
                )
              : null,
          ),
        ),
        y(
          "div",
          { class: `${e}-switch__button` },
          l(d, (n) =>
            l(h, (t) =>
              l(u, (a) =>
                y(f, null, {
                  default: () =>
                    this.loading
                      ? y(p, { key: "loading", clsPrefix: e, strokeWidth: 20 })
                      : this.checked && (t || n)
                        ? y(
                            "div",
                            { class: `${e}-switch__button-icon`, key: t ? "checked-icon" : "icon" },
                            t || n,
                          )
                        : this.checked || (!a && !n)
                          ? null
                          : y(
                              "div",
                              {
                                class: `${e}-switch__button-icon`,
                                key: a ? "unchecked-icon" : "icon",
                              },
                              a || n,
                            ),
                }),
              ),
            ),
          ),
          l(s, (n) => n && y("div", { key: "checked", class: `${e}-switch__checked` }, n)),
          l(c, (n) => n && y("div", { key: "unchecked", class: `${e}-switch__unchecked` }, n)),
        ),
      ),
    );
  },
});
export { z as _ };
