import { x as e, aP as i, G as t, bR as l, D as n, bW as s } from "./index-Ct5UuHQN.js";
import { _ as r } from "./Tooltip-DYS7RCZ0.js";
import { j as o, k as a, r as c, c as p, f as d, v as u } from "./vendor-DHo7BzsC.js";
const g = e("ellipsis", { overflow: "hidden" }, [
  i(
    "line-clamp",
    "\n white-space: nowrap;\n display: inline-block;\n vertical-align: bottom;\n max-width: 100%;\n ",
  ),
  t("line-clamp", "\n display: -webkit-inline-box;\n -webkit-box-orient: vertical;\n "),
  t("cursor-pointer", "\n cursor: pointer;\n "),
]);
function v(e) {
  return `${e}-ellipsis--line-clamp`;
}
function f(e, i) {
  return `${e}-ellipsis--cursor-${i}`;
}
const m = Object.assign(Object.assign({}, n.props), {
    expandTrigger: String,
    lineClamp: [Number, String],
    tooltip: { type: [Boolean, Object], default: !0 },
  }),
  b = o({
    name: "Ellipsis",
    inheritAttrs: !1,
    props: m,
    slots: Object,
    setup(e, { slots: i, attrs: t }) {
      const r = l(),
        o = n("Ellipsis", "-ellipsis", g, s, e, r),
        m = c(null),
        b = c(null),
        h = c(null),
        w = c(!1),
        T = p(() => {
          const { lineClamp: i } = e,
            { value: t } = w;
          return void 0 !== i
            ? { textOverflow: "", "-webkit-line-clamp": t ? "" : i }
            : { textOverflow: t ? "" : "ellipsis", "-webkit-line-clamp": "" };
        });
      function x() {
        let i = !1;
        const { value: t } = w;
        if (t) return !0;
        const { value: l } = m;
        if (l) {
          const { lineClamp: t } = e;
          if (
            ((function (i) {
              if (!i) return;
              const t = T.value,
                l = v(r.value);
              void 0 !== e.lineClamp ? j(i, l, "add") : j(i, l, "remove");
              for (const e in t) i.style[e] !== t[e] && (i.style[e] = t[e]);
            })(l),
            void 0 !== t)
          )
            i = l.scrollHeight <= l.offsetHeight;
          else {
            const { value: e } = b;
            e && (i = e.getBoundingClientRect().width <= l.getBoundingClientRect().width);
          }
          !(function (i, t) {
            const l = f(r.value, "pointer");
            "click" !== e.expandTrigger || t ? j(i, l, "remove") : j(i, l, "add");
          })(l, i);
        }
        return i;
      }
      const k = p(() =>
        "click" === e.expandTrigger
          ? () => {
              var e;
              const { value: i } = w;
              (i && (null === (e = h.value) || void 0 === e || e.setShow(!1)), (w.value = !i));
            }
          : void 0,
      );
      d(() => {
        var i;
        e.tooltip && (null === (i = h.value) || void 0 === i || i.setShow(!1));
      });
      function j(e, i, t) {
        "add" === t
          ? e.classList.contains(i) || e.classList.add(i)
          : e.classList.contains(i) && e.classList.remove(i);
      }
      return {
        mergedTheme: o,
        triggerRef: m,
        triggerInnerRef: b,
        tooltipRef: h,
        handleClick: k,
        renderTrigger: () =>
          a(
            "span",
            Object.assign(
              {},
              u(t, {
                class: [
                  `${r.value}-ellipsis`,
                  void 0 !== e.lineClamp ? v(r.value) : void 0,
                  "click" === e.expandTrigger ? f(r.value, "pointer") : void 0,
                ],
                style: T.value,
              }),
              {
                ref: "triggerRef",
                onClick: k.value,
                onMouseenter: "click" === e.expandTrigger ? x : void 0,
              },
            ),
            e.lineClamp ? i : a("span", { ref: "triggerInnerRef" }, i),
          ),
        getTooltipDisabled: x,
      };
    },
    render() {
      var e;
      const { tooltip: i, renderTrigger: t, $slots: l } = this;
      if (i) {
        const { mergedTheme: n } = this;
        return a(
          r,
          Object.assign({ ref: "tooltipRef", placement: "top" }, i, {
            getDisabled: this.getTooltipDisabled,
            theme: n.peers.Tooltip,
            themeOverrides: n.peerOverrides.Tooltip,
          }),
          { trigger: t, default: null !== (e = l.tooltip) && void 0 !== e ? e : l.default },
        );
      }
      return t();
    },
  });
export { b as N, f as a, v as c, m as e, g as s };
