import {
  b9 as e,
  N as r,
  aY as i,
  W as n,
  aW as t,
  aX as o,
  z as l,
  x as s,
  G as a,
  t as c,
  D as p,
  ba as d,
  aU as g,
  v as u,
} from "./index-Ct5UuHQN.js";
import { j as f, c as h, k as v } from "./vendor-DHo7BzsC.js";
import { f as y } from "./format-length-l2rsThpR.js";
const b = { success: v(o, null), error: v(t, null), warning: v(n, null), info: v(i, null) },
  x = f({
    name: "ProgressCircle",
    props: {
      clsPrefix: { type: String, required: !0 },
      status: { type: String, required: !0 },
      strokeWidth: { type: Number, required: !0 },
      fillColor: [String, Object],
      railColor: String,
      railStyle: [String, Object],
      percentage: { type: Number, default: 0 },
      offsetDegree: { type: Number, default: 0 },
      showIndicator: { type: Boolean, required: !0 },
      indicatorTextColor: String,
      unit: String,
      viewBoxWidth: { type: Number, required: !0 },
      gapDegree: { type: Number, required: !0 },
      gapOffsetDegree: { type: Number, default: 0 },
    },
    setup(i, { slots: n }) {
      const t = h(() => {
        const r = "gradient",
          { fillColor: n } = i;
        return "object" == typeof n ? `${r}-${e(JSON.stringify(n))}` : r;
      });
      function o(e, r, n, o) {
        const { gapDegree: l, viewBoxWidth: s, strokeWidth: a } = i,
          c = 50,
          p = 50 + a / 2,
          d = `M ${p},${p} m 0,50\n      a 50,50 0 1 1 0,-100\n      a 50,50 0 1 1 0,100`,
          g = 2 * Math.PI * c;
        return {
          pathString: d,
          pathStyle: {
            stroke: "rail" === o ? n : "object" == typeof i.fillColor ? `url(#${t.value})` : n,
            strokeDasharray: `${(Math.min(e, 100) / 100) * (g - l)}px ${8 * s}px`,
            strokeDashoffset: `-${l / 2}px`,
            transformOrigin: r ? "center" : void 0,
            transform: r ? `rotate(${r}deg)` : void 0,
          },
        };
      }
      return () => {
        const {
            fillColor: e,
            railColor: l,
            strokeWidth: s,
            offsetDegree: a,
            status: c,
            percentage: p,
            showIndicator: d,
            indicatorTextColor: g,
            unit: u,
            gapOffsetDegree: f,
            clsPrefix: h,
          } = i,
          { pathString: y, pathStyle: x } = o(100, 0, l, "rail"),
          { pathString: m, pathStyle: $ } = o(p, a, e, "fill"),
          C = 100 + s;
        return v(
          "div",
          { class: `${h}-progress-content`, role: "none" },
          v(
            "div",
            { class: `${h}-progress-graph`, "aria-hidden": !0 },
            v(
              "div",
              {
                class: `${h}-progress-graph-circle`,
                style: { transform: f ? `rotate(${f}deg)` : void 0 },
              },
              v(
                "svg",
                { viewBox: `0 0 ${C} ${C}` },
                (() => {
                  const e = "object" == typeof i.fillColor,
                    r = e ? i.fillColor.stops[0] : "",
                    n = e ? i.fillColor.stops[1] : "";
                  return (
                    e &&
                    v(
                      "defs",
                      null,
                      v(
                        "linearGradient",
                        { id: t.value, x1: "0%", y1: "100%", x2: "100%", y2: "0%" },
                        v("stop", { offset: "0%", "stop-color": r }),
                        v("stop", { offset: "100%", "stop-color": n }),
                      ),
                    )
                  );
                })(),
                v(
                  "g",
                  null,
                  v("path", {
                    class: `${h}-progress-graph-circle-rail`,
                    d: y,
                    "stroke-width": s,
                    "stroke-linecap": "round",
                    fill: "none",
                    style: x,
                  }),
                ),
                v(
                  "g",
                  null,
                  v("path", {
                    class: [
                      `${h}-progress-graph-circle-fill`,
                      0 === p && `${h}-progress-graph-circle-fill--empty`,
                    ],
                    d: m,
                    "stroke-width": s,
                    "stroke-linecap": "round",
                    fill: "none",
                    style: $,
                  }),
                ),
              ),
            ),
          ),
          d
            ? v(
                "div",
                null,
                n.default
                  ? v("div", { class: `${h}-progress-custom-content`, role: "none" }, n.default())
                  : "default" !== c
                    ? v(
                        "div",
                        { class: `${h}-progress-icon`, "aria-hidden": !0 },
                        v(r, { clsPrefix: h }, { default: () => b[c] }),
                      )
                    : v(
                        "div",
                        { class: `${h}-progress-text`, style: { color: g }, role: "none" },
                        v("span", { class: `${h}-progress-text__percentage` }, p),
                        v("span", { class: `${h}-progress-text__unit` }, u),
                      ),
              )
            : null,
        );
      };
    },
  }),
  m = { success: v(o, null), error: v(t, null), warning: v(n, null), info: v(i, null) },
  $ = f({
    name: "ProgressLine",
    props: {
      clsPrefix: { type: String, required: !0 },
      percentage: { type: Number, default: 0 },
      railColor: String,
      railStyle: [String, Object],
      fillColor: [String, Object],
      status: { type: String, required: !0 },
      indicatorPlacement: { type: String, required: !0 },
      indicatorTextColor: String,
      unit: { type: String, default: "%" },
      processing: { type: Boolean, required: !0 },
      showIndicator: { type: Boolean, required: !0 },
      height: [String, Number],
      railBorderRadius: [String, Number],
      fillBorderRadius: [String, Number],
    },
    setup(e, { slots: i }) {
      const n = h(() => y(e.height)),
        t = h(() => {
          var r, i;
          return "object" == typeof e.fillColor
            ? `linear-gradient(to right, ${null === (r = e.fillColor) || void 0 === r ? void 0 : r.stops[0]} , ${null === (i = e.fillColor) || void 0 === i ? void 0 : i.stops[1]})`
            : e.fillColor;
        }),
        o = h(() =>
          void 0 !== e.railBorderRadius
            ? y(e.railBorderRadius)
            : void 0 !== e.height
              ? y(e.height, { c: 0.5 })
              : "",
        ),
        l = h(() =>
          void 0 !== e.fillBorderRadius
            ? y(e.fillBorderRadius)
            : void 0 !== e.railBorderRadius
              ? y(e.railBorderRadius)
              : void 0 !== e.height
                ? y(e.height, { c: 0.5 })
                : "",
        );
      return () => {
        const {
          indicatorPlacement: s,
          railColor: a,
          railStyle: c,
          percentage: p,
          unit: d,
          indicatorTextColor: g,
          status: u,
          showIndicator: f,
          processing: h,
          clsPrefix: y,
        } = e;
        return v(
          "div",
          { class: `${y}-progress-content`, role: "none" },
          v(
            "div",
            { class: `${y}-progress-graph`, "aria-hidden": !0 },
            v(
              "div",
              {
                class: [
                  `${y}-progress-graph-line`,
                  { [`${y}-progress-graph-line--indicator-${s}`]: !0 },
                ],
              },
              v(
                "div",
                {
                  class: `${y}-progress-graph-line-rail`,
                  style: [{ backgroundColor: a, height: n.value, borderRadius: o.value }, c],
                },
                v(
                  "div",
                  {
                    class: [
                      `${y}-progress-graph-line-fill`,
                      h && `${y}-progress-graph-line-fill--processing`,
                    ],
                    style: {
                      maxWidth: `${e.percentage}%`,
                      background: t.value,
                      height: n.value,
                      lineHeight: n.value,
                      borderRadius: l.value,
                    },
                  },
                  "inside" === s
                    ? v(
                        "div",
                        { class: `${y}-progress-graph-line-indicator`, style: { color: g } },
                        i.default ? i.default() : `${p}${d}`,
                      )
                    : null,
                ),
              ),
            ),
          ),
          f && "outside" === s
            ? v(
                "div",
                null,
                i.default
                  ? v(
                      "div",
                      { class: `${y}-progress-custom-content`, style: { color: g }, role: "none" },
                      i.default(),
                    )
                  : "default" === u
                    ? v(
                        "div",
                        {
                          role: "none",
                          class: `${y}-progress-icon ${y}-progress-icon--as-text`,
                          style: { color: g },
                        },
                        p,
                        d,
                      )
                    : v(
                        "div",
                        { class: `${y}-progress-icon`, "aria-hidden": !0 },
                        v(r, { clsPrefix: y }, { default: () => m[u] }),
                      ),
              )
            : null,
        );
      };
    },
  });
function C(e, r, i = 100) {
  return `m ${i / 2} ${i / 2 - e} a ${e} ${e} 0 1 1 0 ${2 * e} a ${e} ${e} 0 1 1 0 -${2 * e}`;
}
const w = f({
    name: "ProgressMultipleCircle",
    props: {
      clsPrefix: { type: String, required: !0 },
      viewBoxWidth: { type: Number, required: !0 },
      percentage: { type: Array, default: [0] },
      strokeWidth: { type: Number, required: !0 },
      circleGap: { type: Number, required: !0 },
      showIndicator: { type: Boolean, required: !0 },
      fillColor: { type: Array, default: () => [] },
      railColor: { type: Array, default: () => [] },
      railStyle: { type: Array, default: () => [] },
    },
    setup(e, { slots: r }) {
      const i = h(() =>
        e.percentage.map(
          (r, i) =>
            `${((Math.PI * r) / 100) * (e.viewBoxWidth / 2 - (e.strokeWidth / 2) * (1 + 2 * i) - e.circleGap * i) * 2}, ${8 * e.viewBoxWidth}`,
        ),
      );
      return () => {
        const {
          viewBoxWidth: n,
          strokeWidth: t,
          circleGap: o,
          showIndicator: l,
          fillColor: s,
          railColor: a,
          railStyle: c,
          percentage: p,
          clsPrefix: d,
        } = e;
        return v(
          "div",
          { class: `${d}-progress-content`, role: "none" },
          v(
            "div",
            { class: `${d}-progress-graph`, "aria-hidden": !0 },
            v(
              "div",
              { class: `${d}-progress-graph-circle` },
              v(
                "svg",
                { viewBox: `0 0 ${n} ${n}` },
                v(
                  "defs",
                  null,
                  p.map((r, i) =>
                    ((r, i) => {
                      const n = e.fillColor[i],
                        t = "object" == typeof n ? n.stops[0] : "",
                        o = "object" == typeof n ? n.stops[1] : "";
                      return (
                        "object" == typeof e.fillColor[i] &&
                        v(
                          "linearGradient",
                          { id: `gradient-${i}`, x1: "100%", y1: "0%", x2: "0%", y2: "100%" },
                          v("stop", { offset: "0%", "stop-color": t }),
                          v("stop", { offset: "100%", "stop-color": o }),
                        )
                      );
                    })(0, i),
                  ),
                ),
                p.map((e, r) =>
                  v(
                    "g",
                    { key: r },
                    v("path", {
                      class: `${d}-progress-graph-circle-rail`,
                      d: C(n / 2 - (t / 2) * (1 + 2 * r) - o * r, 0, n),
                      "stroke-width": t,
                      "stroke-linecap": "round",
                      fill: "none",
                      style: [{ strokeDashoffset: 0, stroke: a[r] }, c[r]],
                    }),
                    v("path", {
                      class: [
                        `${d}-progress-graph-circle-fill`,
                        0 === e && `${d}-progress-graph-circle-fill--empty`,
                      ],
                      d: C(n / 2 - (t / 2) * (1 + 2 * r) - o * r, 0, n),
                      "stroke-width": t,
                      "stroke-linecap": "round",
                      fill: "none",
                      style: {
                        strokeDasharray: i.value[r],
                        strokeDashoffset: 0,
                        stroke: "object" == typeof s[r] ? `url(#gradient-${r})` : s[r],
                      },
                    }),
                  ),
                ),
              ),
            ),
          ),
          l && r.default
            ? v("div", null, v("div", { class: `${d}-progress-text` }, r.default()))
            : null,
        );
      };
    },
  }),
  S = l([
    s("progress", { display: "inline-block" }, [
      s(
        "progress-icon",
        "\n color: var(--n-icon-color);\n transition: color .3s var(--n-bezier);\n ",
      ),
      a("line", "\n width: 100%;\n display: block;\n ", [
        s("progress-content", "\n display: flex;\n align-items: center;\n ", [
          s("progress-graph", { flex: 1 }),
        ]),
        s("progress-custom-content", { marginLeft: "14px" }),
        s(
          "progress-icon",
          "\n width: 30px;\n padding-left: 14px;\n height: var(--n-icon-size-line);\n line-height: var(--n-icon-size-line);\n font-size: var(--n-icon-size-line);\n ",
          [
            a(
              "as-text",
              "\n color: var(--n-text-color-line-outer);\n text-align: center;\n width: 40px;\n font-size: var(--n-font-size);\n padding-left: 4px;\n transition: color .3s var(--n-bezier);\n ",
            ),
          ],
        ),
      ]),
      a("circle, dashboard", { width: "120px" }, [
        s(
          "progress-custom-content",
          "\n position: absolute;\n left: 50%;\n top: 50%;\n transform: translateX(-50%) translateY(-50%);\n display: flex;\n align-items: center;\n justify-content: center;\n ",
        ),
        s(
          "progress-text",
          "\n position: absolute;\n left: 50%;\n top: 50%;\n transform: translateX(-50%) translateY(-50%);\n display: flex;\n align-items: center;\n color: inherit;\n font-size: var(--n-font-size-circle);\n color: var(--n-text-color-circle);\n font-weight: var(--n-font-weight-circle);\n transition: color .3s var(--n-bezier);\n white-space: nowrap;\n ",
        ),
        s(
          "progress-icon",
          "\n position: absolute;\n left: 50%;\n top: 50%;\n transform: translateX(-50%) translateY(-50%);\n display: flex;\n align-items: center;\n color: var(--n-icon-color);\n font-size: var(--n-icon-size-circle);\n ",
        ),
      ]),
      a("multiple-circle", "\n width: 200px;\n color: inherit;\n ", [
        s(
          "progress-text",
          "\n font-weight: var(--n-font-weight-circle);\n color: var(--n-text-color-circle);\n position: absolute;\n left: 50%;\n top: 50%;\n transform: translateX(-50%) translateY(-50%);\n display: flex;\n align-items: center;\n justify-content: center;\n transition: color .3s var(--n-bezier);\n ",
        ),
      ]),
      s("progress-content", { position: "relative" }),
      s("progress-graph", { position: "relative" }, [
        s("progress-graph-circle", [
          l("svg", { verticalAlign: "bottom" }),
          s(
            "progress-graph-circle-fill",
            "\n stroke: var(--n-fill-color);\n transition:\n opacity .3s var(--n-bezier),\n stroke .3s var(--n-bezier),\n stroke-dasharray .3s var(--n-bezier);\n ",
            [a("empty", { opacity: 0 })],
          ),
          s(
            "progress-graph-circle-rail",
            "\n transition: stroke .3s var(--n-bezier);\n overflow: hidden;\n stroke: var(--n-rail-color);\n ",
          ),
        ]),
        s("progress-graph-line", [
          a("indicator-inside", [
            s(
              "progress-graph-line-rail",
              "\n height: 16px;\n line-height: 16px;\n border-radius: 10px;\n ",
              [
                s("progress-graph-line-fill", "\n height: inherit;\n border-radius: 10px;\n "),
                s(
                  "progress-graph-line-indicator",
                  "\n background: #0000;\n white-space: nowrap;\n text-align: right;\n margin-left: 14px;\n margin-right: 14px;\n height: inherit;\n font-size: 12px;\n color: var(--n-text-color-line-inner);\n transition: color .3s var(--n-bezier);\n ",
                ),
              ],
            ),
          ]),
          a(
            "indicator-inside-label",
            "\n height: 16px;\n display: flex;\n align-items: center;\n ",
            [
              s(
                "progress-graph-line-rail",
                "\n flex: 1;\n transition: background-color .3s var(--n-bezier);\n ",
              ),
              s(
                "progress-graph-line-indicator",
                "\n background: var(--n-fill-color);\n font-size: 12px;\n transform: translateZ(0);\n display: flex;\n vertical-align: middle;\n height: 16px;\n line-height: 16px;\n padding: 0 10px;\n border-radius: 10px;\n position: absolute;\n white-space: nowrap;\n color: var(--n-text-color-line-inner);\n transition:\n right .2s var(--n-bezier),\n color .3s var(--n-bezier),\n background-color .3s var(--n-bezier);\n ",
              ),
            ],
          ),
          s(
            "progress-graph-line-rail",
            "\n position: relative;\n overflow: hidden;\n height: var(--n-rail-height);\n border-radius: 5px;\n background-color: var(--n-rail-color);\n transition: background-color .3s var(--n-bezier);\n ",
            [
              s(
                "progress-graph-line-fill",
                "\n background: var(--n-fill-color);\n position: relative;\n border-radius: 5px;\n height: inherit;\n width: 100%;\n max-width: 0%;\n transition:\n background-color .3s var(--n-bezier),\n max-width .2s var(--n-bezier);\n ",
                [
                  a("processing", [
                    l(
                      "&::after",
                      '\n content: "";\n background-image: var(--n-line-bg-processing);\n animation: progress-processing-animation 2s var(--n-bezier) infinite;\n ',
                    ),
                  ]),
                ],
              ),
            ],
          ),
        ]),
      ]),
    ]),
    l(
      "@keyframes progress-processing-animation",
      "\n 0% {\n position: absolute;\n left: 0;\n top: 0;\n bottom: 0;\n right: 100%;\n opacity: 1;\n }\n 66% {\n position: absolute;\n left: 0;\n top: 0;\n bottom: 0;\n right: 0;\n opacity: 0;\n }\n 100% {\n position: absolute;\n left: 0;\n top: 0;\n bottom: 0;\n right: 0;\n opacity: 0;\n }\n ",
    ),
  ]),
  k = f({
    name: "Progress",
    props: Object.assign(Object.assign({}, p.props), {
      processing: Boolean,
      type: { type: String, default: "line" },
      gapDegree: Number,
      gapOffsetDegree: Number,
      status: { type: String, default: "default" },
      railColor: [String, Array],
      railStyle: [String, Array],
      color: [String, Array, Object],
      viewBoxWidth: { type: Number, default: 100 },
      strokeWidth: { type: Number, default: 7 },
      percentage: [Number, Array],
      unit: { type: String, default: "%" },
      showIndicator: { type: Boolean, default: !0 },
      indicatorPosition: { type: String, default: "outside" },
      indicatorPlacement: { type: String, default: "outside" },
      indicatorTextColor: String,
      circleGap: { type: Number, default: 1 },
      height: Number,
      borderRadius: [String, Number],
      fillBorderRadius: [String, Number],
      offsetDegree: Number,
    }),
    setup(e) {
      const r = h(() => e.indicatorPlacement || e.indicatorPosition),
        i = h(() =>
          e.gapDegree || 0 === e.gapDegree ? e.gapDegree : "dashboard" === e.type ? 75 : void 0,
        ),
        { mergedClsPrefixRef: n, inlineThemeDisabled: t } = c(e),
        o = p("Progress", "-progress", S, d, e, n),
        l = h(() => {
          const { status: r } = e,
            {
              common: { cubicBezierEaseInOut: i },
              self: {
                fontSize: n,
                fontSizeCircle: t,
                railColor: l,
                railHeight: s,
                iconSizeCircle: a,
                iconSizeLine: c,
                textColorCircle: p,
                textColorLineInner: d,
                textColorLineOuter: u,
                lineBgProcessing: f,
                fontWeightCircle: h,
                [g("iconColor", r)]: v,
                [g("fillColor", r)]: y,
              },
            } = o.value;
          return {
            "--n-bezier": i,
            "--n-fill-color": y,
            "--n-font-size": n,
            "--n-font-size-circle": t,
            "--n-font-weight-circle": h,
            "--n-icon-color": v,
            "--n-icon-size-circle": a,
            "--n-icon-size-line": c,
            "--n-line-bg-processing": f,
            "--n-rail-color": l,
            "--n-rail-height": s,
            "--n-text-color-circle": p,
            "--n-text-color-line-inner": d,
            "--n-text-color-line-outer": u,
          };
        }),
        s = t
          ? u(
              "progress",
              h(() => e.status[0]),
              l,
              e,
            )
          : void 0;
      return {
        mergedClsPrefix: n,
        mergedIndicatorPlacement: r,
        gapDeg: i,
        cssVars: t ? void 0 : l,
        themeClass: null == s ? void 0 : s.themeClass,
        onRender: null == s ? void 0 : s.onRender,
      };
    },
    render() {
      const {
        type: e,
        cssVars: r,
        indicatorTextColor: i,
        showIndicator: n,
        status: t,
        railColor: o,
        railStyle: l,
        color: s,
        percentage: a,
        viewBoxWidth: c,
        strokeWidth: p,
        mergedIndicatorPlacement: d,
        unit: g,
        borderRadius: u,
        fillBorderRadius: f,
        height: h,
        processing: y,
        circleGap: b,
        mergedClsPrefix: m,
        gapDeg: C,
        gapOffsetDegree: S,
        themeClass: k,
        $slots: z,
        onRender: B,
      } = this;
      return (
        null == B || B(),
        v(
          "div",
          {
            class: [k, `${m}-progress`, `${m}-progress--${e}`, `${m}-progress--${t}`],
            style: r,
            "aria-valuemax": 100,
            "aria-valuemin": 0,
            "aria-valuenow": a,
            role: "circle" === e || "line" === e || "dashboard" === e ? "progressbar" : "none",
          },
          "circle" === e || "dashboard" === e
            ? v(
                x,
                {
                  clsPrefix: m,
                  status: t,
                  showIndicator: n,
                  indicatorTextColor: i,
                  railColor: o,
                  fillColor: s,
                  railStyle: l,
                  offsetDegree: this.offsetDegree,
                  percentage: a,
                  viewBoxWidth: c,
                  strokeWidth: p,
                  gapDegree: void 0 === C ? ("dashboard" === e ? 75 : 0) : C,
                  gapOffsetDegree: S,
                  unit: g,
                },
                z,
              )
            : "line" === e
              ? v(
                  $,
                  {
                    clsPrefix: m,
                    status: t,
                    showIndicator: n,
                    indicatorTextColor: i,
                    railColor: o,
                    fillColor: s,
                    railStyle: l,
                    percentage: a,
                    processing: y,
                    indicatorPlacement: d,
                    unit: g,
                    fillBorderRadius: f,
                    railBorderRadius: u,
                    height: h,
                  },
                  z,
                )
              : "multiple-circle" === e
                ? v(
                    w,
                    {
                      clsPrefix: m,
                      strokeWidth: p,
                      railColor: o,
                      fillColor: s,
                      railStyle: l,
                      viewBoxWidth: c,
                      percentage: a,
                      showIndicator: n,
                      circleGap: b,
                    },
                    z,
                  )
                : null,
        )
      );
    },
  });
export { k as _ };
