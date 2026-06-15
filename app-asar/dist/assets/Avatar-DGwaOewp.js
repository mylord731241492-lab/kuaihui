import { o as e, i as r } from "./utils-CPcGhtGy.js";
import { t as o } from "./Tag-DD6D_Gyq.js";
import {
  o as n,
  x as t,
  aZ as s,
  a_ as a,
  z as i,
  y as l,
  p as d,
  q as c,
  t as u,
  D as v,
  cw as f,
  aU as b,
  v as h,
  bj as m,
  bt as g,
} from "./index-Ct5UuHQN.js";
import {
  j as p,
  k as z,
  r as O,
  i as y,
  c as j,
  d as x,
  n as F,
  b as L,
  w as R,
} from "./vendor-DHo7BzsC.js";
const P = n("n-avatar-group"),
  k = t(
    "avatar",
    "\n width: var(--n-merged-size);\n height: var(--n-merged-size);\n color: #FFF;\n font-size: var(--n-font-size);\n display: inline-flex;\n position: relative;\n overflow: hidden;\n text-align: center;\n border: var(--n-border);\n border-radius: var(--n-border-radius);\n --n-merged-color: var(--n-color);\n background-color: var(--n-merged-color);\n transition:\n border-color .3s var(--n-bezier),\n background-color .3s var(--n-bezier),\n color .3s var(--n-bezier);\n",
    [
      s(i("&", "--n-merged-color: var(--n-color-modal);")),
      a(i("&", "--n-merged-color: var(--n-color-popover);")),
      i("img", "\n width: 100%;\n height: 100%;\n "),
      l(
        "text",
        "\n white-space: nowrap;\n display: inline-block;\n position: absolute;\n left: 50%;\n top: 50%;\n ",
      ),
      t("icon", "\n vertical-align: bottom;\n font-size: calc(var(--n-merged-size) - 6px);\n "),
      l("text", "line-height: 1.25"),
    ],
  ),
  E = p({
    name: "Avatar",
    props: Object.assign(Object.assign({}, v.props), {
      size: [String, Number],
      src: String,
      circle: { type: Boolean, default: void 0 },
      objectFit: String,
      round: { type: Boolean, default: void 0 },
      bordered: { type: Boolean, default: void 0 },
      onError: Function,
      fallbackSrc: String,
      intersectionObserverOptions: Object,
      lazy: Boolean,
      onLoad: Function,
      renderPlaceholder: Function,
      renderFallback: Function,
      imgProps: Object,
      color: String,
    }),
    slots: Object,
    setup(r) {
      const { mergedClsPrefixRef: n, inlineThemeDisabled: t } = u(r),
        s = O(!1);
      let a = null;
      const i = O(null),
        l = O(null),
        d = y(P, null),
        c = j(() => {
          const { size: e } = r;
          if (e) return e;
          const { size: o } = d || {};
          return o || "medium";
        }),
        g = v("Avatar", "-avatar", k, f, r, n),
        p = y(o, null),
        z = j(() => {
          if (d) return !0;
          const { round: e, circle: o } = r;
          return void 0 !== e || void 0 !== o ? e || o : !!p && p.roundRef.value;
        }),
        E = j(() => !!d || r.bordered || !1),
        S = j(() => {
          const e = c.value,
            o = z.value,
            n = E.value,
            { color: t } = r,
            {
              self: {
                borderRadius: s,
                fontSize: a,
                color: i,
                border: l,
                colorModal: d,
                colorPopover: u,
              },
              common: { cubicBezierEaseInOut: v },
            } = g.value;
          let f;
          return (
            (f = "number" == typeof e ? `${e}px` : g.value.self[b("height", e)]),
            {
              "--n-font-size": a,
              "--n-border": n ? l : "none",
              "--n-border-radius": o ? "50%" : s,
              "--n-color": t || i,
              "--n-color-modal": t || d,
              "--n-color-popover": t || u,
              "--n-bezier": v,
              "--n-merged-size": `var(--n-avatar-size-override, ${f})`,
            }
          );
        }),
        w = t
          ? h(
              "avatar",
              j(() => {
                const e = c.value,
                  o = z.value,
                  n = E.value,
                  { color: t } = r;
                let s = "";
                return (
                  e && (s += "number" == typeof e ? `a${e}` : e[0]),
                  o && (s += "b"),
                  n && (s += "c"),
                  t && (s += m(t)),
                  s
                );
              }),
              S,
              r,
            )
          : void 0,
        T = O(!r.lazy);
      (x(() => {
        if (r.lazy && r.intersectionObserverOptions) {
          let o;
          const n = F(() => {
            (null == o || o(),
              (o = void 0),
              r.lazy && (o = e(l.value, r.intersectionObserverOptions, T)));
          });
          L(() => {
            (n(), null == o || o());
          });
        }
      }),
        R(
          () => {
            var e;
            return r.src || (null === (e = r.imgProps) || void 0 === e ? void 0 : e.src);
          },
          () => {
            s.value = !1;
          },
        ));
      const $ = O(!r.lazy);
      return {
        textRef: i,
        selfRef: l,
        mergedRoundRef: z,
        mergedClsPrefix: n,
        fitTextTransform: () => {
          const { value: e } = i;
          if (e && (null === a || a !== e.innerHTML)) {
            a = e.innerHTML;
            const { value: r } = l;
            if (r) {
              const { offsetWidth: o, offsetHeight: n } = r,
                { offsetWidth: t, offsetHeight: s } = e,
                a = 0.9,
                i = Math.min((o / t) * a, (n / s) * a, 1);
              e.style.transform = `translateX(-50%) translateY(-50%) scale(${i})`;
            }
          }
        },
        cssVars: t ? void 0 : S,
        themeClass: null == w ? void 0 : w.themeClass,
        onRender: null == w ? void 0 : w.onRender,
        hasLoadError: s,
        shouldStartLoading: T,
        loaded: $,
        mergedOnError: (e) => {
          if (!T.value) return;
          s.value = !0;
          const { onError: o, imgProps: { onError: n } = {} } = r;
          (null == o || o(e), null == n || n(e));
        },
        mergedOnLoad: (e) => {
          const { onLoad: o, imgProps: { onLoad: n } = {} } = r;
          (null == o || o(e), null == n || n(e), ($.value = !0));
        },
      };
    },
    render() {
      var e, o;
      const {
        $slots: n,
        src: t,
        mergedClsPrefix: s,
        lazy: a,
        onRender: i,
        loaded: l,
        hasLoadError: u,
        imgProps: v = {},
      } = this;
      let f;
      null == i || i();
      const b =
        !l &&
        !u &&
        (this.renderPlaceholder
          ? this.renderPlaceholder()
          : null === (o = (e = this.$slots).placeholder) || void 0 === o
            ? void 0
            : o.call(e));
      return (
        (f = this.hasLoadError
          ? this.renderFallback
            ? this.renderFallback()
            : d(n.fallback, () => [
                z("img", { src: this.fallbackSrc, style: { objectFit: this.objectFit } }),
              ])
          : c(n.default, (e) => {
              if (e)
                return z(
                  g,
                  { onResize: this.fitTextTransform },
                  { default: () => z("span", { ref: "textRef", class: `${s}-avatar__text` }, e) },
                );
              if (t || v.src) {
                const e = this.src || v.src;
                return z(
                  "img",
                  Object.assign(Object.assign({}, v), {
                    loading: r && !this.intersectionObserverOptions && a ? "lazy" : "eager",
                    src:
                      a && this.intersectionObserverOptions
                        ? this.shouldStartLoading
                          ? e
                          : void 0
                        : e,
                    "data-image-src": e,
                    onLoad: this.mergedOnLoad,
                    onError: this.mergedOnError,
                    style: [
                      v.style || "",
                      { objectFit: this.objectFit },
                      b
                        ? { height: "0", width: "0", visibility: "hidden", position: "absolute" }
                        : "",
                    ],
                  }),
                );
              }
            })),
        z(
          "span",
          { ref: "selfRef", class: [`${s}-avatar`, this.themeClass], style: this.cssVars },
          f,
          a && b,
        )
      );
    },
  });
export { E as _ };
