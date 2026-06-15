import { _ as e, p as s } from "./Popover-Z03uJL-I.js";
import { t as o, D as r, cK as t } from "./index-Ct5UuHQN.js";
import { j as i, k as p, r as a, c as n } from "./vendor-DHo7BzsC.js";
const l = i({
  name: "Tooltip",
  props: Object.assign(Object.assign({}, s), r.props),
  slots: Object,
  __popover__: !0,
  setup(e) {
    const { mergedClsPrefixRef: s } = o(e),
      i = r("Tooltip", "-tooltip", void 0, t, e, s),
      p = a(null),
      l = {
        syncPosition() {
          p.value.syncPosition();
        },
        setShow(e) {
          p.value.setShow(e);
        },
      };
    return Object.assign(Object.assign({}, l), {
      popoverRef: p,
      mergedTheme: i,
      popoverThemeOverrides: n(() => i.value.self),
    });
  },
  render() {
    const { mergedTheme: s, internalExtraClass: o } = this;
    return p(
      e,
      Object.assign(Object.assign({}, this.$props), {
        theme: s.peers.Popover,
        themeOverrides: s.peerOverrides.Popover,
        builtinThemeOverrides: this.popoverThemeOverrides,
        internalExtraClass: o.concat("tooltip"),
        ref: "popoverRef",
      }),
      this.$slots,
    );
  },
});
export { l as _ };
