import {
  j as e,
  r as n,
  c as a,
  w as t,
  t as r,
  k as o,
  x as i,
  u as s,
  q as l,
  d as u,
} from "./vendor-DHo7BzsC.js";
import {
  z as d,
  bd as m,
  x as p,
  be as c,
  G as f,
  y as b,
  bf as v,
  K as h,
  aO as g,
  p as x,
  bg as y,
  t as w,
  D as $,
  bh as z,
  bi as N,
  S as k,
  aU as S,
  v as Y,
  bj as B,
} from "./index-Ct5UuHQN.js";
import { g as O } from "./attribute-Cap6sGiE.js";
const P = e({
    name: "SlotMachineNumber",
    props: {
      clsPrefix: { type: String, required: !0 },
      value: { type: [Number, String], required: !0 },
      oldOriginalNumber: { type: Number, default: void 0 },
      newOriginalNumber: { type: Number, default: void 0 },
    },
    setup(e) {
      const s = n(null),
        l = n(e.value),
        u = n(e.value),
        d = n("up"),
        m = n(!1),
        p = a(() =>
          m.value ? `${e.clsPrefix}-base-slot-machine-current-number--${d.value}-scroll` : null,
        ),
        c = a(() =>
          m.value ? `${e.clsPrefix}-base-slot-machine-old-number--${d.value}-scroll` : null,
        );
      function f() {
        const n = e.newOriginalNumber,
          a = e.oldOriginalNumber;
        void 0 !== a && void 0 !== n && (n > a ? b("up") : a > n && b("down"));
      }
      function b(e) {
        ((d.value = e),
          (m.value = !1),
          i(() => {
            var e;
            (null === (e = s.value) || void 0 === e || e.offsetWidth, (m.value = !0));
          }));
      }
      return (
        t(r(e, "value"), (e, n) => {
          ((l.value = n), (u.value = e), i(f));
        }),
        () => {
          const { clsPrefix: n } = e;
          return o(
            "span",
            { ref: s, class: `${n}-base-slot-machine-number` },
            null !== l.value
              ? o(
                  "span",
                  {
                    class: [
                      `${n}-base-slot-machine-old-number ${n}-base-slot-machine-old-number--top`,
                      c.value,
                    ],
                  },
                  l.value,
                )
              : null,
            o(
              "span",
              { class: [`${n}-base-slot-machine-current-number`, p.value] },
              o(
                "span",
                {
                  ref: "numberWrapper",
                  class: [
                    `${n}-base-slot-machine-current-number__inner`,
                    "number" != typeof e.value &&
                      `${n}-base-slot-machine-current-number__inner--not-number`,
                  ],
                },
                u.value,
              ),
            ),
            null !== l.value
              ? o(
                  "span",
                  {
                    class: [
                      `${n}-base-slot-machine-old-number ${n}-base-slot-machine-old-number--bottom`,
                      c.value,
                    ],
                  },
                  l.value,
                )
              : null,
          );
        }
      );
    },
  }),
  { cubicBezierEaseOut: C } = m;
const E = d([
    d(
      "@keyframes n-base-slot-machine-fade-up-in",
      "\n from {\n transform: translateY(60%);\n opacity: 0;\n }\n to {\n transform: translateY(0);\n opacity: 1;\n }\n ",
    ),
    d(
      "@keyframes n-base-slot-machine-fade-down-in",
      "\n from {\n transform: translateY(-60%);\n opacity: 0;\n }\n to {\n transform: translateY(0);\n opacity: 1;\n }\n ",
    ),
    d(
      "@keyframes n-base-slot-machine-fade-up-out",
      "\n from {\n transform: translateY(0%);\n opacity: 1;\n }\n to {\n transform: translateY(-60%);\n opacity: 0;\n }\n ",
    ),
    d(
      "@keyframes n-base-slot-machine-fade-down-out",
      "\n from {\n transform: translateY(0%);\n opacity: 1;\n }\n to {\n transform: translateY(60%);\n opacity: 0;\n }\n ",
    ),
    p(
      "base-slot-machine",
      "\n overflow: hidden;\n white-space: nowrap;\n display: inline-block;\n height: 18px;\n line-height: 18px;\n ",
      [
        p(
          "base-slot-machine-number",
          "\n display: inline-block;\n position: relative;\n height: 18px;\n width: .6em;\n max-width: .6em;\n ",
          [
            (function ({ duration: e = ".2s" } = {}) {
              return [
                d("&.fade-up-width-expand-transition-leave-active", {
                  transition: `\n opacity ${e} ${C},\n max-width ${e} ${C},\n transform ${e} ${C}\n `,
                }),
                d("&.fade-up-width-expand-transition-enter-active", {
                  transition: `\n opacity ${e} ${C},\n max-width ${e} ${C},\n transform ${e} ${C}\n `,
                }),
                d("&.fade-up-width-expand-transition-enter-to", {
                  opacity: 1,
                  transform: "translateX(0) translateY(0)",
                }),
                d("&.fade-up-width-expand-transition-enter-from", {
                  maxWidth: "0 !important",
                  opacity: 0,
                  transform: "translateY(60%)",
                }),
                d("&.fade-up-width-expand-transition-leave-from", {
                  opacity: 1,
                  transform: "translateY(0)",
                }),
                d("&.fade-up-width-expand-transition-leave-to", {
                  maxWidth: "0 !important",
                  opacity: 0,
                  transform: "translateY(60%)",
                }),
              ];
            })({ duration: ".2s" }),
            c({ duration: ".2s", delay: "0s" }),
            p(
              "base-slot-machine-old-number",
              "\n display: inline-block;\n opacity: 0;\n position: absolute;\n left: 0;\n right: 0;\n ",
              [
                f("top", { transform: "translateY(-100%)" }),
                f("bottom", { transform: "translateY(100%)" }),
                f("down-scroll", {
                  animation: "n-base-slot-machine-fade-down-out .2s cubic-bezier(0, 0, .2, 1)",
                  animationIterationCount: 1,
                }),
                f("up-scroll", {
                  animation: "n-base-slot-machine-fade-up-out .2s cubic-bezier(0, 0, .2, 1)",
                  animationIterationCount: 1,
                }),
              ],
            ),
            p(
              "base-slot-machine-current-number",
              "\n display: inline-block;\n position: absolute;\n left: 0;\n top: 0;\n bottom: 0;\n right: 0;\n opacity: 1;\n transform: translateY(0);\n width: .6em;\n ",
              [
                f("down-scroll", {
                  animation: "n-base-slot-machine-fade-down-in .2s cubic-bezier(0, 0, .2, 1)",
                  animationIterationCount: 1,
                }),
                f("up-scroll", {
                  animation: "n-base-slot-machine-fade-up-in .2s cubic-bezier(0, 0, .2, 1)",
                  animationIterationCount: 1,
                }),
                b(
                  "inner",
                  "\n display: inline-block;\n position: absolute;\n right: 0;\n top: 0;\n width: .6em;\n ",
                  [f("not-number", "\n right: unset;\n left: 0;\n ")],
                ),
              ],
            ),
          ],
        ),
      ],
    ),
  ]),
  j = e({
    name: "BaseSlotMachine",
    props: {
      clsPrefix: { type: String, required: !0 },
      value: { type: [Number, String], default: 0 },
      max: { type: Number, default: void 0 },
      appeared: { type: Boolean, required: !0 },
    },
    setup(e) {
      v("-base-slot-machine", E, r(e, "clsPrefix"));
      const i = n(),
        l = n(),
        u = a(() => {
          if ("string" == typeof e.value) return [];
          if (e.value < 1) return [0];
          const n = [];
          let a = e.value;
          for (void 0 !== e.max && (a = Math.min(e.max, a)); a >= 1; )
            (n.push(a % 10), (a /= 10), (a = Math.floor(a)));
          return (n.reverse(), n);
        });
      return (
        t(r(e, "value"), (e, n) => {
          "string" == typeof e
            ? ((l.value = void 0), (i.value = void 0))
            : "string" == typeof n
              ? ((l.value = e), (i.value = void 0))
              : ((l.value = e), (i.value = n));
        }),
        () => {
          const { value: n, clsPrefix: a } = e;
          return "number" == typeof n
            ? o(
                "span",
                { class: `${a}-base-slot-machine` },
                o(
                  s,
                  { name: "fade-up-width-expand-transition", tag: "span" },
                  {
                    default: () =>
                      u.value.map((e, n) =>
                        o(P, {
                          clsPrefix: a,
                          key: u.value.length - n - 1,
                          oldOriginalNumber: i.value,
                          newOriginalNumber: l.value,
                          value: e,
                        }),
                      ),
                  },
                ),
                o(
                  h,
                  { key: "+", width: !0 },
                  {
                    default: () =>
                      void 0 !== e.max && e.max < n ? o(P, { clsPrefix: a, value: "+" }) : null,
                  },
                ),
              )
            : o("span", { class: `${a}-base-slot-machine` }, n);
        }
      );
    },
  }),
  A = d([
    d("@keyframes badge-wave-spread", {
      from: { boxShadow: "0 0 0.5px 0px var(--n-ripple-color)", opacity: 0.6 },
      to: { boxShadow: "0 0 0.5px 4.5px var(--n-ripple-color)", opacity: 0 },
    }),
    p(
      "badge",
      "\n display: inline-flex;\n position: relative;\n vertical-align: middle;\n font-family: var(--n-font-family);\n ",
      [
        f("as-is", [
          p("badge-sup", { position: "static", transform: "translateX(0)" }, [
            g({ transformOrigin: "left bottom", originalTransform: "translateX(0)" }),
          ]),
        ]),
        f("dot", [
          p(
            "badge-sup",
            "\n height: 8px;\n width: 8px;\n padding: 0;\n min-width: 8px;\n left: 100%;\n bottom: calc(100% - 4px);\n ",
            [d("::before", "border-radius: 4px;")],
          ),
        ]),
        p(
          "badge-sup",
          "\n background: var(--n-color);\n transition:\n background-color .3s var(--n-bezier),\n color .3s var(--n-bezier);\n color: #FFF;\n position: absolute;\n height: 18px;\n line-height: 18px;\n border-radius: 9px;\n padding: 0 6px;\n text-align: center;\n font-size: var(--n-font-size);\n transform: translateX(-50%);\n left: 100%;\n bottom: calc(100% - 9px);\n font-variant-numeric: tabular-nums;\n z-index: 2;\n display: flex;\n align-items: center;\n ",
          [
            g({ transformOrigin: "left bottom", originalTransform: "translateX(-50%)" }),
            p("base-wave", {
              zIndex: 1,
              animationDuration: "2s",
              animationIterationCount: "infinite",
              animationDelay: "1s",
              animationTimingFunction: "var(--n-ripple-bezier)",
              animationName: "badge-wave-spread",
            }),
            d(
              "&::before",
              '\n opacity: 0;\n transform: scale(1);\n border-radius: 9px;\n content: "";\n position: absolute;\n left: 0;\n right: 0;\n top: 0;\n bottom: 0;\n ',
            ),
          ],
        ),
      ],
    ),
  ]),
  I = e({
    name: "Badge",
    props: Object.assign(Object.assign({}, $.props), {
      value: [String, Number],
      max: Number,
      dot: Boolean,
      type: { type: String, default: "default" },
      show: { type: Boolean, default: !0 },
      showZero: Boolean,
      processing: Boolean,
      color: String,
      offset: Array,
    }),
    setup(e, { slots: t }) {
      const { mergedClsPrefixRef: r, inlineThemeDisabled: o, mergedRtlRef: i } = w(e),
        s = $("Badge", "-badge", A, z, e, r),
        l = n(!1),
        d = a(
          () =>
            e.show &&
            (e.dot ||
              (void 0 !== e.value && !(!e.showZero && Number(e.value) <= 0)) ||
              !N(t.value)),
        );
      u(() => {
        d.value && (l.value = !0);
      });
      const m = k("Badge", i, r),
        p = a(() => {
          const { type: n, color: a } = e,
            {
              common: { cubicBezierEaseInOut: t, cubicBezierEaseOut: r },
              self: { [S("color", n)]: o, fontFamily: i, fontSize: l },
            } = s.value;
          return {
            "--n-font-size": l,
            "--n-font-family": i,
            "--n-color": a || o,
            "--n-ripple-color": a || o,
            "--n-bezier": t,
            "--n-ripple-bezier": r,
          };
        }),
        c = o
          ? Y(
              "badge",
              a(() => {
                let n = "";
                const { type: a, color: t } = e;
                return (a && (n += a[0]), t && (n += B(t)), n);
              }),
              p,
              e,
            )
          : void 0,
        f = a(() => {
          const { offset: n } = e;
          if (!n) return;
          const [a, t] = n,
            r = "number" == typeof a ? `${a}px` : a,
            o = "number" == typeof t ? `${t}px` : t;
          return {
            transform: `translate(calc(${(null == m ? void 0 : m.value) ? "50%" : "-50%"} + ${r}), ${o})`,
          };
        });
      return {
        rtlEnabled: m,
        mergedClsPrefix: r,
        appeared: l,
        showBadge: d,
        handleAfterEnter: () => {
          l.value = !0;
        },
        handleAfterLeave: () => {
          l.value = !1;
        },
        cssVars: o ? void 0 : p,
        themeClass: null == c ? void 0 : c.themeClass,
        onRender: null == c ? void 0 : c.onRender,
        offsetStyle: f,
      };
    },
    render() {
      var e;
      const { mergedClsPrefix: n, onRender: a, themeClass: t, $slots: r } = this;
      null == a || a();
      const i = null === (e = r.default) || void 0 === e ? void 0 : e.call(r);
      return o(
        "div",
        {
          class: [
            `${n}-badge`,
            this.rtlEnabled && `${n}-badge--rtl`,
            t,
            { [`${n}-badge--dot`]: this.dot, [`${n}-badge--as-is`]: !i },
          ],
          style: this.cssVars,
        },
        i,
        o(
          l,
          {
            name: "fade-in-scale-up-transition",
            onAfterEnter: this.handleAfterEnter,
            onAfterLeave: this.handleAfterLeave,
          },
          {
            default: () =>
              this.showBadge
                ? o(
                    "sup",
                    { class: `${n}-badge-sup`, title: O(this.value), style: this.offsetStyle },
                    x(r.value, () => [
                      this.dot
                        ? null
                        : o(j, {
                            clsPrefix: n,
                            appeared: this.appeared,
                            max: this.max,
                            value: this.value,
                          }),
                    ]),
                    this.processing ? o(y, { clsPrefix: n }) : null,
                  )
                : null,
          },
        ),
      );
    },
  });
export { I as _ };
