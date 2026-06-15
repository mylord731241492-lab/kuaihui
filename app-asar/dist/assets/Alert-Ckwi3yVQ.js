import {
  x as e,
  y as n,
  G as r,
  H as o,
  z as t,
  br as i,
  p as s,
  q as l,
  K as a,
  t as c,
  D as d,
  c4 as h,
  S as v,
  bv as b,
  aU as g,
  v as u,
  N as f,
  aW as p,
  W as m,
  aY as z,
  aX as x,
} from "./index-Ct5UuHQN.js";
import { j as C, k as y, v as $, c as w, r as R } from "./vendor-DHo7BzsC.js";
const A = e(
    "alert",
    "\n line-height: var(--n-line-height);\n border-radius: var(--n-border-radius);\n position: relative;\n transition: background-color .3s var(--n-bezier);\n background-color: var(--n-color);\n text-align: start;\n word-break: break-word;\n",
    [
      n(
        "border",
        "\n border-radius: inherit;\n position: absolute;\n left: 0;\n right: 0;\n top: 0;\n bottom: 0;\n transition: border-color .3s var(--n-bezier);\n border: var(--n-border);\n pointer-events: none;\n ",
      ),
      r("closable", [e("alert-body", [n("title", "\n padding-right: 24px;\n ")])]),
      n("icon", { color: "var(--n-icon-color)" }),
      e("alert-body", { padding: "var(--n-padding)" }, [
        n("title", { color: "var(--n-title-text-color)" }),
        n("content", { color: "var(--n-content-text-color)" }),
      ]),
      o({
        originalTransition: "transform .3s var(--n-bezier)",
        enterToProps: { transform: "scale(1)" },
        leaveToProps: { transform: "scale(0.9)" },
      }),
      n(
        "icon",
        "\n position: absolute;\n left: 0;\n top: 0;\n align-items: center;\n justify-content: center;\n display: flex;\n width: var(--n-icon-size);\n height: var(--n-icon-size);\n font-size: var(--n-icon-size);\n margin: var(--n-icon-margin);\n ",
      ),
      n(
        "close",
        "\n transition:\n color .3s var(--n-bezier),\n background-color .3s var(--n-bezier);\n position: absolute;\n right: 0;\n top: 0;\n margin: var(--n-close-margin);\n ",
      ),
      r("show-icon", [
        e("alert-body", {
          paddingLeft:
            "calc(var(--n-icon-margin-left) + var(--n-icon-size) + var(--n-icon-margin-right))",
        }),
      ]),
      r("right-adjust", [
        e("alert-body", { paddingRight: "calc(var(--n-close-size) + var(--n-padding) + 2px)" }),
      ]),
      e(
        "alert-body",
        "\n border-radius: var(--n-border-radius);\n transition: border-color .3s var(--n-bezier);\n ",
        [
          n(
            "title",
            "\n transition: color .3s var(--n-bezier);\n font-size: 16px;\n line-height: 19px;\n font-weight: var(--n-title-font-weight);\n ",
            [t("& +", [n("content", { marginTop: "9px" })])],
          ),
          n("content", { transition: "color .3s var(--n-bezier)", fontSize: "var(--n-font-size)" }),
        ],
      ),
      n("icon", { transition: "color .3s var(--n-bezier)" }),
    ],
  ),
  _ = C({
    name: "Alert",
    inheritAttrs: !1,
    props: Object.assign(Object.assign({}, d.props), {
      title: String,
      showIcon: { type: Boolean, default: !0 },
      type: { type: String, default: "default" },
      bordered: { type: Boolean, default: !0 },
      closable: Boolean,
      onClose: Function,
      onAfterLeave: Function,
      onAfterHide: Function,
    }),
    slots: Object,
    setup(e) {
      const {
          mergedClsPrefixRef: n,
          mergedBorderedRef: r,
          inlineThemeDisabled: o,
          mergedRtlRef: t,
        } = c(e),
        i = d("Alert", "-alert", A, h, e, n),
        s = v("Alert", t, n),
        l = w(() => {
          const {
              common: { cubicBezierEaseInOut: n },
              self: r,
            } = i.value,
            {
              fontSize: o,
              borderRadius: t,
              titleFontWeight: s,
              lineHeight: l,
              iconSize: a,
              iconMargin: c,
              iconMarginRtl: d,
              closeIconSize: h,
              closeBorderRadius: v,
              closeSize: u,
              closeMargin: f,
              closeMarginRtl: p,
              padding: m,
            } = r,
            { type: z } = e,
            { left: x, right: C } = b(c);
          return {
            "--n-bezier": n,
            "--n-color": r[g("color", z)],
            "--n-close-icon-size": h,
            "--n-close-border-radius": v,
            "--n-close-color-hover": r[g("closeColorHover", z)],
            "--n-close-color-pressed": r[g("closeColorPressed", z)],
            "--n-close-icon-color": r[g("closeIconColor", z)],
            "--n-close-icon-color-hover": r[g("closeIconColorHover", z)],
            "--n-close-icon-color-pressed": r[g("closeIconColorPressed", z)],
            "--n-icon-color": r[g("iconColor", z)],
            "--n-border": r[g("border", z)],
            "--n-title-text-color": r[g("titleTextColor", z)],
            "--n-content-text-color": r[g("contentTextColor", z)],
            "--n-line-height": l,
            "--n-border-radius": t,
            "--n-font-size": o,
            "--n-title-font-weight": s,
            "--n-icon-size": a,
            "--n-icon-margin": c,
            "--n-icon-margin-rtl": d,
            "--n-close-size": u,
            "--n-close-margin": f,
            "--n-close-margin-rtl": p,
            "--n-padding": m,
            "--n-icon-margin-left": x,
            "--n-icon-margin-right": C,
          };
        }),
        a = o
          ? u(
              "alert",
              w(() => e.type[0]),
              l,
              e,
            )
          : void 0,
        f = R(!0);
      return {
        rtlEnabled: s,
        mergedClsPrefix: n,
        mergedBordered: r,
        visible: f,
        handleCloseClick: () => {
          var n;
          Promise.resolve(null === (n = e.onClose) || void 0 === n ? void 0 : n.call(e)).then(
            (e) => {
              !1 !== e && (f.value = !1);
            },
          );
        },
        handleAfterLeave: () => {
          (() => {
            const { onAfterLeave: n, onAfterHide: r } = e;
            (n && n(), r && r());
          })();
        },
        mergedTheme: i,
        cssVars: o ? void 0 : l,
        themeClass: null == a ? void 0 : a.themeClass,
        onRender: null == a ? void 0 : a.onRender,
      };
    },
    render() {
      var e;
      return (
        null === (e = this.onRender) || void 0 === e || e.call(this),
        y(
          a,
          { onAfterLeave: this.handleAfterLeave },
          {
            default: () => {
              const { mergedClsPrefix: e, $slots: n } = this,
                r = {
                  class: [
                    `${e}-alert`,
                    this.themeClass,
                    this.closable && `${e}-alert--closable`,
                    this.showIcon && `${e}-alert--show-icon`,
                    !this.title && this.closable && `${e}-alert--right-adjust`,
                    this.rtlEnabled && `${e}-alert--rtl`,
                  ],
                  style: this.cssVars,
                  role: "alert",
                };
              return this.visible
                ? y(
                    "div",
                    Object.assign({}, $(this.$attrs, r)),
                    this.closable &&
                      y(i, {
                        clsPrefix: e,
                        class: `${e}-alert__close`,
                        onClick: this.handleCloseClick,
                      }),
                    this.bordered && y("div", { class: `${e}-alert__border` }),
                    this.showIcon &&
                      y(
                        "div",
                        { class: `${e}-alert__icon`, "aria-hidden": "true" },
                        s(n.icon, () => [
                          y(
                            f,
                            { clsPrefix: e },
                            {
                              default: () => {
                                switch (this.type) {
                                  case "success":
                                    return y(x, null);
                                  case "info":
                                    return y(z, null);
                                  case "warning":
                                    return y(m, null);
                                  case "error":
                                    return y(p, null);
                                  default:
                                    return null;
                                }
                              },
                            },
                          ),
                        ]),
                      ),
                    y(
                      "div",
                      {
                        class: [
                          `${e}-alert-body`,
                          this.mergedBordered && `${e}-alert-body--bordered`,
                        ],
                      },
                      l(n.header, (n) => {
                        const r = n || this.title;
                        return r ? y("div", { class: `${e}-alert-body__title` }, r) : null;
                      }),
                      n.default && y("div", { class: `${e}-alert-body__content` }, n),
                    ),
                  )
                : null;
            },
          },
        )
      );
    },
  });
export { _ };
