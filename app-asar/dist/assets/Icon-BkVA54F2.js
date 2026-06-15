import { x as n, G as e, z as o, Q as i, t, D as r, c6 as s, v as c } from "./index-Ct5UuHQN.js";
import { f as a } from "./format-length-l2rsThpR.js";
import { j as l, k as d, v as m, c as p } from "./vendor-DHo7BzsC.js";
const h = n(
    "icon",
    "\n height: 1em;\n width: 1em;\n line-height: 1em;\n text-align: center;\n display: inline-block;\n position: relative;\n fill: currentColor;\n",
    [
      e("color-transition", { transition: "color .3s var(--n-bezier)" }),
      e("depth", { color: "var(--n-color)" }, [
        o("svg", { opacity: "var(--n-opacity)", transition: "opacity .3s var(--n-bezier)" }),
      ]),
      o("svg", { height: "1em", width: "1em" }),
    ],
  ),
  v = l({
    _n_icon__: !0,
    name: "Icon",
    inheritAttrs: !1,
    props: Object.assign(Object.assign({}, r.props), {
      depth: [String, Number],
      size: [Number, String],
      color: String,
      component: [Object, Function],
    }),
    setup(n) {
      const { mergedClsPrefixRef: e, inlineThemeDisabled: o } = t(n),
        i = r("Icon", "-icon", h, s, n, e),
        l = p(() => {
          const { depth: e } = n,
            {
              common: { cubicBezierEaseInOut: o },
              self: t,
            } = i.value;
          if (void 0 !== e) {
            const { color: n, [`opacity${e}Depth`]: i } = t;
            return { "--n-bezier": o, "--n-color": n, "--n-opacity": i };
          }
          return { "--n-bezier": o, "--n-color": "", "--n-opacity": "" };
        }),
        d = o
          ? c(
              "icon",
              p(() => `${n.depth || "d"}`),
              l,
              n,
            )
          : void 0;
      return {
        mergedClsPrefix: e,
        mergedStyle: p(() => {
          const { size: e, color: o } = n;
          return { fontSize: a(e), color: o };
        }),
        cssVars: o ? void 0 : l,
        themeClass: null == d ? void 0 : d.themeClass,
        onRender: null == d ? void 0 : d.onRender,
      };
    },
    render() {
      var n;
      const {
        $parent: e,
        depth: o,
        mergedClsPrefix: t,
        component: r,
        onRender: s,
        themeClass: c,
      } = this;
      return (
        (null === (n = null == e ? void 0 : e.$options) || void 0 === n ? void 0 : n._n_icon__) &&
          i("icon", "don't wrap `n-icon` inside `n-icon`"),
        null == s || s(),
        d(
          "i",
          m(this.$attrs, {
            role: "img",
            class: [
              `${t}-icon`,
              c,
              { [`${t}-icon--depth`]: o, [`${t}-icon--color-transition`]: void 0 !== o },
            ],
            style: [this.cssVars, this.mergedStyle],
          }),
          r ? d(r) : this.$slots,
        )
      );
    },
  });
export { v as N };
