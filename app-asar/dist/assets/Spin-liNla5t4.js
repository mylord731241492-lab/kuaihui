import { j as n, k as e, q as t, c as s, r as i, n as o } from "./vendor-DHo7BzsC.js";
import {
  z as r,
  x as a,
  bJ as l,
  G as c,
  bS as p,
  t as d,
  D as m,
  cE as u,
  bA as v,
  aU as f,
  v as h,
} from "./index-Ct5UuHQN.js";
import { u as y } from "./use-compitable-BbI6cQbC.js";
const b = r([
    r(
      "@keyframes spin-rotate",
      "\n from {\n transform: rotate(0);\n }\n to {\n transform: rotate(360deg);\n }\n ",
    ),
    a("spin-container", "\n position: relative;\n ", [
      a(
        "spin-body",
        "\n position: absolute;\n top: 50%;\n left: 50%;\n transform: translateX(-50%) translateY(-50%);\n ",
        [l()],
      ),
    ]),
    a(
      "spin-body",
      "\n display: inline-flex;\n align-items: center;\n justify-content: center;\n flex-direction: column;\n ",
    ),
    a(
      "spin",
      "\n display: inline-flex;\n height: var(--n-size);\n width: var(--n-size);\n font-size: var(--n-size);\n color: var(--n-color);\n ",
      [c("rotate", "\n animation: spin-rotate 2s linear infinite;\n ")],
    ),
    a(
      "spin-description",
      "\n display: inline-block;\n font-size: var(--n-font-size);\n color: var(--n-text-color);\n transition: color .3s var(--n-bezier);\n margin-top: 8px;\n ",
    ),
    a(
      "spin-content",
      "\n opacity: 1;\n transition: opacity .3s var(--n-bezier);\n pointer-events: all;\n ",
      [
        c(
          "spinning",
          "\n user-select: none;\n -webkit-user-select: none;\n pointer-events: none;\n opacity: var(--n-opacity-spinning);\n ",
        ),
      ],
    ),
  ]),
  g = { small: 20, medium: 18, large: 16 },
  z = n({
    name: "Spin",
    props: Object.assign(Object.assign({}, m.props), {
      contentClass: String,
      contentStyle: [Object, String],
      description: String,
      stroke: String,
      size: { type: [String, Number], default: "medium" },
      show: { type: Boolean, default: !0 },
      strokeWidth: Number,
      rotate: { type: Boolean, default: !0 },
      spinning: { type: Boolean, validator: () => !0, default: void 0 },
      delay: Number,
    }),
    slots: Object,
    setup(n) {
      const { mergedClsPrefixRef: e, inlineThemeDisabled: t } = d(n),
        r = m("Spin", "-spin", b, u, n, e),
        a = s(() => {
          const { size: e } = n,
            {
              common: { cubicBezierEaseInOut: t },
              self: s,
            } = r.value,
            { opacitySpinning: i, color: o, textColor: a } = s;
          return {
            "--n-bezier": t,
            "--n-opacity-spinning": i,
            "--n-size": "number" == typeof e ? v(e) : s[f("size", e)],
            "--n-color": o,
            "--n-text-color": a,
          };
        }),
        l = t
          ? h(
              "spin",
              s(() => {
                const { size: e } = n;
                return "number" == typeof e ? String(e) : e[0];
              }),
              a,
              n,
            )
          : void 0,
        c = y(n, ["spinning", "show"]),
        p = i(!1);
      return (
        o((e) => {
          let t;
          if (c.value) {
            const { delay: s } = n;
            if (s)
              return (
                (t = window.setTimeout(() => {
                  p.value = !0;
                }, s)),
                void e(() => {
                  clearTimeout(t);
                })
              );
          }
          p.value = c.value;
        }),
        {
          mergedClsPrefix: e,
          active: p,
          mergedStrokeWidth: s(() => {
            const { strokeWidth: e } = n;
            if (void 0 !== e) return e;
            const { size: t } = n;
            return g["number" == typeof t ? "medium" : t];
          }),
          cssVars: t ? void 0 : a,
          themeClass: null == l ? void 0 : l.themeClass,
          onRender: null == l ? void 0 : l.onRender,
        }
      );
    },
    render() {
      var n, s;
      const { $slots: i, mergedClsPrefix: o, description: r } = this,
        a = i.icon && this.rotate,
        l =
          (r || i.description) &&
          e(
            "div",
            { class: `${o}-spin-description` },
            r || (null === (n = i.description) || void 0 === n ? void 0 : n.call(i)),
          ),
        c = i.icon
          ? e(
              "div",
              { class: [`${o}-spin-body`, this.themeClass] },
              e(
                "div",
                {
                  class: [`${o}-spin`, a && `${o}-spin--rotate`],
                  style: i.default ? "" : this.cssVars,
                },
                i.icon(),
              ),
              l,
            )
          : e(
              "div",
              { class: [`${o}-spin-body`, this.themeClass] },
              e(p, {
                clsPrefix: o,
                style: i.default ? "" : this.cssVars,
                stroke: this.stroke,
                "stroke-width": this.mergedStrokeWidth,
                class: `${o}-spin`,
              }),
              l,
            );
      return (
        null === (s = this.onRender) || void 0 === s || s.call(this),
        i.default
          ? e(
              "div",
              { class: [`${o}-spin-container`, this.themeClass], style: this.cssVars },
              e(
                "div",
                {
                  class: [
                    `${o}-spin-content`,
                    this.active && `${o}-spin-content--spinning`,
                    this.contentClass,
                  ],
                  style: this.contentStyle,
                },
                i,
              ),
              e(t, { name: "fade-in-transition" }, { default: () => (this.active ? c : null) }),
            )
          : c
      );
    },
  });
export { z as _ };
