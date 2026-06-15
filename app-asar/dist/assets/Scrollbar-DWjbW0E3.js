import { au as r, D as t } from "./index-Ct5UuHQN.js";
import { j as s, k as e, r as l } from "./vendor-DHo7BzsC.js";
const n = s({
  name: "Scrollbar",
  props: Object.assign(Object.assign({}, t.props), {
    trigger: String,
    xScrollable: Boolean,
    onScroll: Function,
    contentClass: String,
    contentStyle: [Object, String],
    size: Number,
    yPlacement: { type: String, default: "right" },
    xPlacement: { type: String, default: "bottom" },
  }),
  setup() {
    const r = l(null),
      t = {
        scrollTo: (...t) => {
          var s;
          null === (s = r.value) || void 0 === s || s.scrollTo(t[0], t[1]);
        },
        scrollBy: (...t) => {
          var s;
          null === (s = r.value) || void 0 === s || s.scrollBy(t[0], t[1]);
        },
      };
    return Object.assign(Object.assign({}, t), { scrollbarInstRef: r });
  },
  render() {
    return e(r, Object.assign({ ref: "scrollbarInstRef" }, this.$props), this.$slots);
  },
});
export { n as S };
