import {
  L as e,
  bs as t,
  t as a,
  D as r,
  cA as n,
  S as i,
  aU as l,
  cB as s,
  bw as o,
} from "./index-Ct5UuHQN.js";
import { g as p } from "./get-slot-BjAOOWF7.js";
import { j as c, k as d, C as m, c as g } from "./vendor-DHo7BzsC.js";
let u;
function f() {
  if (!e) return !0;
  if (void 0 === u) {
    const e = document.createElement("div");
    ((e.style.display = "flex"),
      (e.style.flexDirection = "column"),
      (e.style.rowGap = "1px"),
      e.appendChild(document.createElement("div")),
      e.appendChild(document.createElement("div")),
      document.body.appendChild(e));
    const t = 1 === e.scrollHeight;
    return (document.body.removeChild(e), (u = t));
  }
  return u;
}
const y = c({
  name: "Space",
  props: Object.assign(Object.assign({}, r.props), {
    align: String,
    justify: { type: String, default: "start" },
    inline: Boolean,
    vertical: Boolean,
    reverse: Boolean,
    size: { type: [String, Number, Array], default: "medium" },
    wrapItem: { type: Boolean, default: !0 },
    itemClass: String,
    itemStyle: [String, Object],
    wrap: { type: Boolean, default: !0 },
    internalUseGap: { type: Boolean, default: void 0 },
  }),
  setup(e) {
    const { mergedClsPrefixRef: t, mergedRtlRef: p } = a(e),
      c = r("Space", "-space", void 0, n, e, t),
      d = i("Space", p, t);
    return {
      useGap: f(),
      rtlEnabled: d,
      mergedClsPrefix: t,
      margin: g(() => {
        const { size: t } = e;
        if (Array.isArray(t)) return { horizontal: t[0], vertical: t[1] };
        if ("number" == typeof t) return { horizontal: t, vertical: t };
        const {
            self: { [l("gap", t)]: a },
          } = c.value,
          { row: r, col: n } = s(a);
        return { horizontal: o(n), vertical: o(r) };
      }),
    };
  },
  render() {
    const {
        vertical: e,
        reverse: a,
        align: r,
        inline: n,
        justify: i,
        itemClass: l,
        itemStyle: s,
        margin: o,
        wrap: c,
        mergedClsPrefix: g,
        rtlEnabled: u,
        useGap: f,
        wrapItem: y,
        internalUseGap: v,
      } = this,
      x = t(p(this), !1);
    if (!x.length) return null;
    const h = `${o.horizontal}px`,
      b = o.horizontal / 2 + "px",
      w = `${o.vertical}px`,
      B = o.vertical / 2 + "px",
      C = x.length - 1,
      S = i.startsWith("space-");
    return d(
      "div",
      {
        role: "none",
        class: [`${g}-space`, u && `${g}-space--rtl`],
        style: {
          display: n ? "inline-flex" : "flex",
          flexDirection:
            e && !a ? "column" : e && a ? "column-reverse" : !e && a ? "row-reverse" : "row",
          justifyContent: ["start", "end"].includes(i) ? `flex-${i}` : i,
          flexWrap: !c || e ? "nowrap" : "wrap",
          marginTop: f || e ? "" : `-${B}`,
          marginBottom: f || e ? "" : `-${B}`,
          alignItems: r,
          gap: f ? `${o.vertical}px ${o.horizontal}px` : "",
        },
      },
      y || (!f && !v)
        ? x.map((t, a) =>
            t.type === m
              ? t
              : d(
                  "div",
                  {
                    role: "none",
                    class: l,
                    style: [
                      s,
                      { maxWidth: "100%" },
                      f
                        ? ""
                        : e
                          ? { marginBottom: a !== C ? w : "" }
                          : u
                            ? {
                                marginLeft: S
                                  ? "space-between" === i && a === C
                                    ? ""
                                    : b
                                  : a !== C
                                    ? h
                                    : "",
                                marginRight: S ? ("space-between" === i && 0 === a ? "" : b) : "",
                                paddingTop: B,
                                paddingBottom: B,
                              }
                            : {
                                marginRight: S
                                  ? "space-between" === i && a === C
                                    ? ""
                                    : b
                                  : a !== C
                                    ? h
                                    : "",
                                marginLeft: S ? ("space-between" === i && 0 === a ? "" : b) : "",
                                paddingTop: B,
                                paddingBottom: B,
                              },
                    ],
                  },
                  t,
                ),
          )
        : x,
    );
  },
});
export { y as _ };
