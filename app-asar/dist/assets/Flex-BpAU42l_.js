import {
  bs as e,
  t as r,
  D as t,
  cF as a,
  S as l,
  aU as s,
  cB as n,
  bw as i,
} from "./index-Ct5UuHQN.js";
import { g as o } from "./get-slot-BjAOOWF7.js";
import { j as f, k as p, c } from "./vendor-DHo7BzsC.js";
const m = f({
  name: "Flex",
  props: Object.assign(Object.assign({}, t.props), {
    align: String,
    justify: { type: String, default: "start" },
    inline: Boolean,
    vertical: Boolean,
    reverse: Boolean,
    size: { type: [String, Number, Array], default: "medium" },
    wrap: { type: Boolean, default: !0 },
  }),
  setup(e) {
    const { mergedClsPrefixRef: o, mergedRtlRef: f } = r(e),
      p = t("Flex", "-flex", void 0, a, e, o);
    return {
      rtlEnabled: l("Flex", f, o),
      mergedClsPrefix: o,
      margin: c(() => {
        const { size: r } = e;
        if (Array.isArray(r)) return { horizontal: r[0], vertical: r[1] };
        if ("number" == typeof r) return { horizontal: r, vertical: r };
        const {
            self: { [s("gap", r)]: t },
          } = p.value,
          { row: a, col: l } = n(t);
        return { horizontal: i(l), vertical: i(a) };
      }),
    };
  },
  render() {
    const {
        vertical: r,
        reverse: t,
        align: a,
        inline: l,
        justify: s,
        margin: n,
        wrap: i,
        mergedClsPrefix: f,
        rtlEnabled: c,
      } = this,
      m = e(o(this), !1);
    return m.length
      ? p(
          "div",
          {
            role: "none",
            class: [`${f}-flex`, c && `${f}-flex--rtl`],
            style: {
              display: l ? "inline-flex" : "flex",
              flexDirection:
                r && !t ? "column" : r && t ? "column-reverse" : !r && t ? "row-reverse" : "row",
              justifyContent: s,
              flexWrap: !i || r ? "nowrap" : "wrap",
              alignItems: a,
              gap: `${n.vertical}px ${n.horizontal}px`,
            },
          },
          m,
        )
      : null;
  },
});
export { m as _ };
