import {
  i as e,
  r as t,
  d as r,
  b as n,
  j as o,
  p as a,
  g as l,
  B as s,
  k as i,
  w as u,
  t as d,
  x as c,
  q as p,
  n as f,
  c as h,
  D as v,
  v as g,
  F as b,
  A as m,
  aw as w,
} from "./vendor-DHo7BzsC.js";
import {
  o as y,
  ap as $,
  aq as x,
  P as S,
  bI as M,
  bG as j,
  bH as B,
  cL as C,
  cM as z,
  bL as O,
  bK as _,
  bm as E,
  aR as T,
  cN as k,
  bp as R,
  cO as A,
  cP as P,
  cQ as I,
  cR as W,
  cS as N,
  cT as F,
  cU as L,
  cV as D,
  cW as X,
  cX as Y,
  cY as H,
  cZ as V,
  c_ as U,
  c$ as q,
  d0 as K,
  d1 as G,
  bo as Q,
  d2 as Z,
  d3 as J,
  d4 as ee,
  d5 as te,
  d6 as re,
  d7 as ne,
  z as oe,
  x as ae,
  aP as le,
  y as se,
  G as ie,
  d8 as ue,
  t as de,
  D as ce,
  d9 as pe,
  S as fe,
  aM as he,
  v as ve,
  aN as ge,
  bi as be,
  bD as me,
  q as we,
  bk as ye,
  da as $e,
  A as xe,
  F as Se,
} from "./index-Ct5UuHQN.js";
import { c as Me, t as je, i as Be, g as Ce, b as ze } from "./get-BluUyD2c.js";
import { c as Oe, a as _e, o as Ee } from "./cssr-fugg8Rje.js";
import { f as Te } from "./format-length-l2rsThpR.js";
import { u as ke } from "./use-merged-state-mPE1JA5r.js";
import { u as Re } from "./use-compitable-BbI6cQbC.js";
let Ae = [];
const Pe = new WeakMap();
function Ie() {
  (Ae.forEach((e) => e(...Pe.get(e))), (Ae = []));
}
function We(e, ...t) {
  (Pe.set(e, t), Ae.includes(e) || (1 === Ae.push(e) && requestAnimationFrame(Ie)));
}
const Ne = y("n-internal-select-menu"),
  Fe = y("n-internal-select-menu-body"),
  Le = "__disabled__";
function De(o) {
  const a = e(M, null),
    l = e(j, null),
    s = e(B, null),
    i = e(Fe, null),
    u = t();
  if ("undefined" != typeof document) {
    u.value = document.fullscreenElement;
    const e = () => {
      u.value = document.fullscreenElement;
    };
    (r(() => {
      $("fullscreenchange", document, e);
    }),
      n(() => {
        x("fullscreenchange", document, e);
      }));
  }
  return S(() => {
    var e;
    const { to: t } = o;
    return void 0 !== t
      ? !1 === t
        ? Le
        : !0 === t
          ? u.value || "body"
          : t
      : (null == a ? void 0 : a.value)
        ? null !== (e = a.value.$el) && void 0 !== e
          ? e
          : a.value
        : (null == l ? void 0 : l.value)
          ? l.value
          : (null == s ? void 0 : s.value)
            ? s.value
            : (null == i ? void 0 : i.value)
              ? i.value
              : null != t
                ? t
                : u.value || "body";
  });
}
((De.tdkey = Le), (De.propTo = { type: [String, Object, Boolean], default: void 0 }));
let Xe = null;
function Ye() {
  if (null === Xe && ((Xe = document.getElementById("v-binder-view-measurer")), null === Xe)) {
    ((Xe = document.createElement("div")), (Xe.id = "v-binder-view-measurer"));
    const { style: e } = Xe;
    ((e.position = "fixed"),
      (e.left = "0"),
      (e.right = "0"),
      (e.top = "0"),
      (e.bottom = "0"),
      (e.pointerEvents = "none"),
      (e.visibility = "hidden"),
      document.body.appendChild(Xe));
  }
  return Xe.getBoundingClientRect();
}
function He(e) {
  const t = e.getBoundingClientRect(),
    r = Ye();
  return {
    left: t.left - r.left,
    top: t.top - r.top,
    bottom: r.height + r.top - t.bottom,
    right: r.width + r.left - t.right,
    width: t.width,
    height: t.height,
  };
}
function Ve(e) {
  if (null === e) return null;
  const t = (function (e) {
    return 9 === e.nodeType ? null : e.parentNode;
  })(e);
  if (null === t) return null;
  if (9 === t.nodeType) return document;
  if (1 === t.nodeType) {
    const { overflow: e, overflowX: r, overflowY: n } = getComputedStyle(t);
    if (/(auto|scroll|overlay)/.test(e + n + r)) return t;
  }
  return Ve(t);
}
const Ue = o({
    name: "Binder",
    props: { syncTargetWithParent: Boolean, syncTarget: { type: Boolean, default: !0 } },
    setup(r) {
      var o;
      a("VBinder", null === (o = l()) || void 0 === o ? void 0 : o.proxy);
      const s = e("VBinder", null),
        i = t(null);
      let u = [];
      const d = () => {
          for (const e of u) x("scroll", e, p, !0);
          u = [];
        },
        c = new Set(),
        p = () => {
          We(f);
        },
        f = () => {
          c.forEach((e) => e());
        },
        h = new Set(),
        v = () => {
          h.forEach((e) => e());
        };
      return (
        n(() => {
          (x("resize", window, v), d());
        }),
        {
          targetRef: i,
          setTargetRef: (e) => {
            ((i.value = e), s && r.syncTargetWithParent && s.setTargetRef(e));
          },
          addScrollListener: (e) => {
            (0 === c.size &&
              (() => {
                let e = i.value;
                for (; (e = Ve(e)), null !== e; ) u.push(e);
                for (const t of u) $("scroll", t, p, !0);
              })(),
              c.has(e) || c.add(e));
          },
          removeScrollListener: (e) => {
            (c.has(e) && c.delete(e), 0 === c.size && d());
          },
          addResizeListener: (e) => {
            (0 === h.size && $("resize", window, v), h.has(e) || h.add(e));
          },
          removeResizeListener: (e) => {
            (h.has(e) && h.delete(e), 0 === h.size && x("resize", window, v));
          },
        }
      );
    },
    render() {
      return C("binder", this.$slots);
    },
  }),
  qe = o({
    name: "Target",
    setup() {
      const { setTargetRef: t, syncTarget: r } = e("VBinder");
      return { syncTarget: r, setTargetDirective: { mounted: t, updated: t } };
    },
    render() {
      const { syncTarget: e, setTargetDirective: t } = this;
      return e ? s(z("follower", this.$slots), [[t]]) : z("follower", this.$slots);
    },
  }),
  Ke = "@@mmoContext",
  Ge = {
    mounted(e, { value: t }) {
      ((e[Ke] = { handler: void 0 }),
        "function" == typeof t && ((e[Ke].handler = t), $("mousemoveoutside", e, t)));
    },
    updated(e, { value: t }) {
      const r = e[Ke];
      "function" == typeof t
        ? r.handler
          ? r.handler !== t &&
            (x("mousemoveoutside", e, r.handler), (r.handler = t), $("mousemoveoutside", e, t))
          : ((e[Ke].handler = t), $("mousemoveoutside", e, t))
        : r.handler && (x("mousemoveoutside", e, r.handler), (r.handler = void 0));
    },
    unmounted(e) {
      const { handler: t } = e[Ke];
      (t && x("mousemoveoutside", e, t), (e[Ke].handler = void 0));
    },
  },
  Qe = { top: "bottom", bottom: "top", left: "right", right: "left" },
  Ze = { start: "end", center: "center", end: "start" },
  Je = { top: "height", bottom: "height", left: "width", right: "width" },
  et = {
    "bottom-start": "top left",
    bottom: "top center",
    "bottom-end": "top right",
    "top-start": "bottom left",
    top: "bottom center",
    "top-end": "bottom right",
    "right-start": "top left",
    right: "center left",
    "right-end": "bottom left",
    "left-start": "top right",
    left: "center right",
    "left-end": "bottom right",
  },
  tt = {
    "bottom-start": "bottom left",
    bottom: "bottom center",
    "bottom-end": "bottom right",
    "top-start": "top left",
    top: "top center",
    "top-end": "top right",
    "right-start": "top right",
    right: "center right",
    "right-end": "bottom right",
    "left-start": "top left",
    left: "center left",
    "left-end": "bottom left",
  },
  rt = {
    "bottom-start": "right",
    "bottom-end": "left",
    "top-start": "right",
    "top-end": "left",
    "right-start": "bottom",
    "right-end": "top",
    "left-start": "bottom",
    "left-end": "top",
  },
  nt = { top: !0, bottom: !1, left: !0, right: !1 },
  ot = { top: "end", bottom: "start", left: "end", right: "start" };
const at = Oe([
    Oe(".v-binder-follower-container", {
      position: "absolute",
      left: "0",
      right: "0",
      top: "0",
      height: "0",
      pointerEvents: "none",
      zIndex: "auto",
    }),
    Oe(".v-binder-follower-content", { position: "absolute", zIndex: "auto" }, [
      Oe("> *", { pointerEvents: "all" }),
    ]),
  ]),
  lt = o({
    name: "Follower",
    inheritAttrs: !1,
    props: {
      show: Boolean,
      enabled: { type: Boolean, default: void 0 },
      placement: { type: String, default: "bottom" },
      syncTrigger: { type: Array, default: ["resize", "scroll"] },
      to: [String, Object],
      flip: { type: Boolean, default: !0 },
      internalShift: Boolean,
      x: Number,
      y: Number,
      width: String,
      minWidth: String,
      containerClass: String,
      teleportDisabled: Boolean,
      zindexable: { type: Boolean, default: !0 },
      zIndex: Number,
      overlap: Boolean,
    },
    setup(o) {
      const a = e("VBinder"),
        l = S(() => (void 0 !== o.enabled ? o.enabled : o.show)),
        s = t(null),
        i = t(null),
        p = () => {
          const { syncTrigger: e } = o;
          (e.includes("scroll") && a.addScrollListener(v),
            e.includes("resize") && a.addResizeListener(v));
        },
        f = () => {
          (a.removeScrollListener(v), a.removeResizeListener(v));
        };
      r(() => {
        l.value && (v(), p());
      });
      const h = E();
      (at.mount({ id: "vueuc/binder", head: !0, anchorMetaName: _e, ssr: h }),
        n(() => {
          f();
        }),
        Ee(() => {
          l.value && v();
        }));
      const v = () => {
        if (!l.value) return;
        const e = s.value;
        if (null === e) return;
        const t = a.targetRef,
          { x: r, y: n, overlap: u } = o,
          d =
            void 0 !== r && void 0 !== n
              ? (function (e, t) {
                  const r = Ye();
                  return {
                    top: t,
                    left: e,
                    height: 0,
                    width: 0,
                    right: r.width - e,
                    bottom: r.height - t,
                  };
                })(r, n)
              : He(t);
        (e.style.setProperty("--v-target-width", `${Math.round(d.width)}px`),
          e.style.setProperty("--v-target-height", `${Math.round(d.height)}px`));
        const { width: c, minWidth: p, placement: f, internalShift: h, flip: v } = o;
        (e.setAttribute("v-placement", f),
          u ? e.setAttribute("v-overlap", "") : e.removeAttribute("v-overlap"));
        const { style: g } = e;
        ((g.width = "target" === c ? `${d.width}px` : void 0 !== c ? c : ""),
          (g.minWidth = "target" === p ? `${d.width}px` : void 0 !== p ? p : ""));
        const b = He(e),
          m = He(i.value),
          {
            left: w,
            top: y,
            placement: $,
          } = (function (e, t, r, n, o, a) {
            if (!o || a) return { placement: e, top: 0, left: 0 };
            const [l, s] = e.split("-");
            let i = null != s ? s : "center",
              u = { top: 0, left: 0 };
            const d = (e, o, a) => {
                let l = 0,
                  s = 0;
                const i = r[e] - t[o] - t[e];
                return (
                  i > 0 && n && (a ? (s = nt[o] ? i : -i) : (l = nt[o] ? i : -i)),
                  { left: l, top: s }
                );
              },
              c = "left" === l || "right" === l;
            if ("center" !== i) {
              const n = rt[e],
                o = Qe[n],
                a = Je[n];
              if (r[a] > t[a]) {
                if (t[n] + t[a] < r[a]) {
                  const e = (r[a] - t[a]) / 2;
                  t[n] < e || t[o] < e
                    ? t[n] < t[o]
                      ? ((i = Ze[s]), (u = d(a, o, c)))
                      : (u = d(a, n, c))
                    : (i = "center");
                }
              } else r[a] < t[a] && t[o] < 0 && t[n] > t[o] && (i = Ze[s]);
            } else {
              const e = "bottom" === l || "top" === l ? "left" : "top",
                n = Qe[e],
                o = Je[e],
                a = (r[o] - t[o]) / 2;
              (t[e] < a || t[n] < a) &&
                (t[e] > t[n] ? ((i = ot[e]), (u = d(o, e, c))) : ((i = ot[n]), (u = d(o, n, c))));
            }
            let p = l;
            return (
              t[l] < r[Je[l]] && t[l] < t[Qe[l]] && (p = Qe[l]),
              { placement: "center" !== i ? `${p}-${i}` : p, left: u.left, top: u.top }
            );
          })(f, d, b, h, v, u),
          x = (function (e, t) {
            return t ? tt[e] : et[e];
          })($, u),
          {
            left: S,
            top: M,
            transform: j,
          } = (function (e, t, r, n, o, a) {
            if (a)
              switch (e) {
                case "bottom-start":
                case "left-end":
                  return {
                    top: `${Math.round(r.top - t.top + r.height)}px`,
                    left: `${Math.round(r.left - t.left)}px`,
                    transform: "translateY(-100%)",
                  };
                case "bottom-end":
                case "right-end":
                  return {
                    top: `${Math.round(r.top - t.top + r.height)}px`,
                    left: `${Math.round(r.left - t.left + r.width)}px`,
                    transform: "translateX(-100%) translateY(-100%)",
                  };
                case "top-start":
                case "left-start":
                  return {
                    top: `${Math.round(r.top - t.top)}px`,
                    left: `${Math.round(r.left - t.left)}px`,
                    transform: "",
                  };
                case "top-end":
                case "right-start":
                  return {
                    top: `${Math.round(r.top - t.top)}px`,
                    left: `${Math.round(r.left - t.left + r.width)}px`,
                    transform: "translateX(-100%)",
                  };
                case "top":
                  return {
                    top: `${Math.round(r.top - t.top)}px`,
                    left: `${Math.round(r.left - t.left + r.width / 2)}px`,
                    transform: "translateX(-50%)",
                  };
                case "right":
                  return {
                    top: `${Math.round(r.top - t.top + r.height / 2)}px`,
                    left: `${Math.round(r.left - t.left + r.width)}px`,
                    transform: "translateX(-100%) translateY(-50%)",
                  };
                case "left":
                  return {
                    top: `${Math.round(r.top - t.top + r.height / 2)}px`,
                    left: `${Math.round(r.left - t.left)}px`,
                    transform: "translateY(-50%)",
                  };
                default:
                  return {
                    top: `${Math.round(r.top - t.top + r.height)}px`,
                    left: `${Math.round(r.left - t.left + r.width / 2)}px`,
                    transform: "translateX(-50%) translateY(-100%)",
                  };
              }
            switch (e) {
              case "bottom-start":
                return {
                  top: `${Math.round(r.top - t.top + r.height + n)}px`,
                  left: `${Math.round(r.left - t.left + o)}px`,
                  transform: "",
                };
              case "bottom-end":
                return {
                  top: `${Math.round(r.top - t.top + r.height + n)}px`,
                  left: `${Math.round(r.left - t.left + r.width + o)}px`,
                  transform: "translateX(-100%)",
                };
              case "top-start":
                return {
                  top: `${Math.round(r.top - t.top + n)}px`,
                  left: `${Math.round(r.left - t.left + o)}px`,
                  transform: "translateY(-100%)",
                };
              case "top-end":
                return {
                  top: `${Math.round(r.top - t.top + n)}px`,
                  left: `${Math.round(r.left - t.left + r.width + o)}px`,
                  transform: "translateX(-100%) translateY(-100%)",
                };
              case "right-start":
                return {
                  top: `${Math.round(r.top - t.top + n)}px`,
                  left: `${Math.round(r.left - t.left + r.width + o)}px`,
                  transform: "",
                };
              case "right-end":
                return {
                  top: `${Math.round(r.top - t.top + r.height + n)}px`,
                  left: `${Math.round(r.left - t.left + r.width + o)}px`,
                  transform: "translateY(-100%)",
                };
              case "left-start":
                return {
                  top: `${Math.round(r.top - t.top + n)}px`,
                  left: `${Math.round(r.left - t.left + o)}px`,
                  transform: "translateX(-100%)",
                };
              case "left-end":
                return {
                  top: `${Math.round(r.top - t.top + r.height + n)}px`,
                  left: `${Math.round(r.left - t.left + o)}px`,
                  transform: "translateX(-100%) translateY(-100%)",
                };
              case "top":
                return {
                  top: `${Math.round(r.top - t.top + n)}px`,
                  left: `${Math.round(r.left - t.left + r.width / 2 + o)}px`,
                  transform: "translateY(-100%) translateX(-50%)",
                };
              case "right":
                return {
                  top: `${Math.round(r.top - t.top + r.height / 2 + n)}px`,
                  left: `${Math.round(r.left - t.left + r.width + o)}px`,
                  transform: "translateY(-50%)",
                };
              case "left":
                return {
                  top: `${Math.round(r.top - t.top + r.height / 2 + n)}px`,
                  left: `${Math.round(r.left - t.left + o)}px`,
                  transform: "translateY(-50%) translateX(-100%)",
                };
              default:
                return {
                  top: `${Math.round(r.top - t.top + r.height + n)}px`,
                  left: `${Math.round(r.left - t.left + r.width / 2 + o)}px`,
                  transform: "translateX(-50%)",
                };
            }
          })($, m, d, y, w, u);
        (e.setAttribute("v-placement", $),
          e.style.setProperty("--v-offset-left", `${Math.round(w)}px`),
          e.style.setProperty("--v-offset-top", `${Math.round(y)}px`),
          (e.style.transform = `translateX(${S}) translateY(${M}) ${j}`),
          e.style.setProperty("--v-transform-origin", x),
          (e.style.transformOrigin = x));
      };
      u(l, (e) => {
        e ? (p(), g()) : f();
      });
      const g = () => {
        c()
          .then(v)
          .catch((e) => {});
      };
      (["placement", "x", "y", "internalShift", "flip", "width", "overlap", "minWidth"].forEach(
        (e) => {
          u(d(o, e), v);
        },
      ),
        ["teleportDisabled"].forEach((e) => {
          u(d(o, e), g);
        }),
        u(d(o, "syncTrigger"), (e) => {
          (e.includes("resize") ? a.addResizeListener(v) : a.removeResizeListener(v),
            e.includes("scroll") ? a.addScrollListener(v) : a.removeScrollListener(v));
        }));
      const b = T(),
        m = S(() => {
          const { to: e } = o;
          if (void 0 !== e) return e;
          b.value;
        });
      return {
        VBinder: a,
        mergedEnabled: l,
        offsetContainerRef: i,
        followerRef: s,
        mergedTo: m,
        syncPosition: v,
      };
    },
    render() {
      return i(
        O,
        { show: this.show, to: this.mergedTo, disabled: this.teleportDisabled },
        {
          default: () => {
            var e, t;
            const r = i(
              "div",
              {
                class: ["v-binder-follower-container", this.containerClass],
                ref: "offsetContainerRef",
              },
              [
                i(
                  "div",
                  { class: "v-binder-follower-content", ref: "followerRef" },
                  null === (t = (e = this.$slots).default) || void 0 === t ? void 0 : t.call(e),
                ),
              ],
            );
            return this.zindexable
              ? s(r, [[_, { enabled: this.mergedEnabled, zIndex: this.zIndex }]])
              : r;
          },
        },
      );
    },
  });
let st;
var it = k(R, "WeakMap"),
  ut = A(Object.keys, Object),
  dt = Object.prototype.hasOwnProperty;
function ct(e) {
  return W(e)
    ? I(e)
    : (function (e) {
        if (!P(e)) return ut(e);
        var t = [];
        for (var r in Object(e)) dt.call(e, r) && "constructor" != r && t.push(r);
        return t;
      })(e);
}
var pt = Object.prototype.propertyIsEnumerable,
  ft = Object.getOwnPropertySymbols,
  ht = ft
    ? function (e) {
        return null == e
          ? []
          : ((e = Object(e)),
            (function (e, t) {
              for (var r = -1, n = null == e ? 0 : e.length, o = 0, a = []; ++r < n; ) {
                var l = e[r];
                t(l, r, e) && (a[o++] = l);
              }
              return a;
            })(ft(e), function (t) {
              return pt.call(e, t);
            }));
      }
    : function () {
        return [];
      };
function vt(e) {
  return (function (e, t, r) {
    var n = t(e);
    return N(e)
      ? n
      : (function (e, t) {
          for (var r = -1, n = t.length, o = e.length; ++r < n; ) e[o + r] = t[r];
          return e;
        })(n, r(e));
  })(e, ct, ht);
}
var gt = k(R, "DataView"),
  bt = k(R, "Promise"),
  mt = k(R, "Set"),
  wt = "[object Map]",
  yt = "[object Promise]",
  $t = "[object Set]",
  xt = "[object WeakMap]",
  St = "[object DataView]",
  Mt = L(gt),
  jt = L(D),
  Bt = L(bt),
  Ct = L(mt),
  zt = L(it),
  Ot = F;
((gt && Ot(new gt(new ArrayBuffer(1))) != St) ||
  (D && Ot(new D()) != wt) ||
  (bt && Ot(bt.resolve()) != yt) ||
  (mt && Ot(new mt()) != $t) ||
  (it && Ot(new it()) != xt)) &&
  (Ot = function (e) {
    var t = F(e),
      r = "[object Object]" == t ? e.constructor : void 0,
      n = r ? L(r) : "";
    if (n)
      switch (n) {
        case Mt:
          return St;
        case jt:
          return wt;
        case Bt:
          return yt;
        case Ct:
          return $t;
        case zt:
          return xt;
      }
    return t;
  });
function _t(e) {
  var t = -1,
    r = null == e ? 0 : e.length;
  for (this.__data__ = new X(); ++t < r; ) this.add(e[t]);
}
function Et(e, t) {
  for (var r = -1, n = null == e ? 0 : e.length; ++r < n; ) if (t(e[r], r, e)) return !0;
  return !1;
}
((_t.prototype.add = _t.prototype.push =
  function (e) {
    return (this.__data__.set(e, "__lodash_hash_undefined__"), this);
  }),
  (_t.prototype.has = function (e) {
    return this.__data__.has(e);
  }));
function Tt(e, t, r, n, o, a) {
  var l = 1 & r,
    s = e.length,
    i = t.length;
  if (s != i && !(l && i > s)) return !1;
  var u = a.get(e),
    d = a.get(t);
  if (u && d) return u == t && d == e;
  var c = -1,
    p = !0,
    f = 2 & r ? new _t() : void 0;
  for (a.set(e, t), a.set(t, e); ++c < s; ) {
    var h = e[c],
      v = t[c];
    if (n) var g = l ? n(v, h, c, t, e, a) : n(h, v, c, e, t, a);
    if (void 0 !== g) {
      if (g) continue;
      p = !1;
      break;
    }
    if (f) {
      if (
        !Et(t, function (e, t) {
          if (((l = t), !f.has(l) && (h === e || o(h, e, r, n, a)))) return f.push(t);
          var l;
        })
      ) {
        p = !1;
        break;
      }
    } else if (h !== v && !o(h, v, r, n, a)) {
      p = !1;
      break;
    }
  }
  return (a.delete(e), a.delete(t), p);
}
function kt(e) {
  var t = -1,
    r = Array(e.size);
  return (
    e.forEach(function (e, n) {
      r[++t] = [n, e];
    }),
    r
  );
}
function Rt(e) {
  var t = -1,
    r = Array(e.size);
  return (
    e.forEach(function (e) {
      r[++t] = e;
    }),
    r
  );
}
var At = Y ? Y.prototype : void 0,
  Pt = At ? At.valueOf : void 0;
var It = Object.prototype.hasOwnProperty;
var Wt = "[object Arguments]",
  Nt = "[object Array]",
  Ft = "[object Object]",
  Lt = Object.prototype.hasOwnProperty;
function Dt(e, t, r, n, o, a) {
  var l = N(e),
    s = N(t),
    i = l ? Nt : Ot(e),
    u = s ? Nt : Ot(t),
    d = (i = i == Wt ? Ft : i) == Ft,
    c = (u = u == Wt ? Ft : u) == Ft,
    p = i == u;
  if (p && U(e)) {
    if (!U(t)) return !1;
    ((l = !0), (d = !1));
  }
  if (p && !d)
    return (
      a || (a = new q()),
      l || K(e)
        ? Tt(e, t, r, n, o, a)
        : (function (e, t, r, n, o, a, l) {
            switch (r) {
              case "[object DataView]":
                if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset) return !1;
                ((e = e.buffer), (t = t.buffer));
              case "[object ArrayBuffer]":
                return !(e.byteLength != t.byteLength || !a(new V(e), new V(t)));
              case "[object Boolean]":
              case "[object Date]":
              case "[object Number]":
                return H(+e, +t);
              case "[object Error]":
                return e.name == t.name && e.message == t.message;
              case "[object RegExp]":
              case "[object String]":
                return e == t + "";
              case "[object Map]":
                var s = kt;
              case "[object Set]":
                var i = 1 & n;
                if ((s || (s = Rt), e.size != t.size && !i)) return !1;
                var u = l.get(e);
                if (u) return u == t;
                ((n |= 2), l.set(e, t));
                var d = Tt(s(e), s(t), n, o, a, l);
                return (l.delete(e), d);
              case "[object Symbol]":
                if (Pt) return Pt.call(e) == Pt.call(t);
            }
            return !1;
          })(e, t, i, r, n, o, a)
    );
  if (!(1 & r)) {
    var f = d && Lt.call(e, "__wrapped__"),
      h = c && Lt.call(t, "__wrapped__");
    if (f || h) {
      var v = f ? e.value() : e,
        g = h ? t.value() : t;
      return (a || (a = new q()), o(v, g, r, n, a));
    }
  }
  return (
    !!p &&
    (a || (a = new q()),
    (function (e, t, r, n, o, a) {
      var l = 1 & r,
        s = vt(e),
        i = s.length;
      if (i != vt(t).length && !l) return !1;
      for (var u = i; u--; ) {
        var d = s[u];
        if (!(l ? d in t : It.call(t, d))) return !1;
      }
      var c = a.get(e),
        p = a.get(t);
      if (c && p) return c == t && p == e;
      var f = !0;
      (a.set(e, t), a.set(t, e));
      for (var h = l; ++u < i; ) {
        var v = e[(d = s[u])],
          g = t[d];
        if (n) var b = l ? n(g, v, d, t, e, a) : n(v, g, d, e, t, a);
        if (!(void 0 === b ? v === g || o(v, g, r, n, a) : b)) {
          f = !1;
          break;
        }
        h || (h = "constructor" == d);
      }
      if (f && !h) {
        var m = e.constructor,
          w = t.constructor;
        m == w ||
          !("constructor" in e) ||
          !("constructor" in t) ||
          ("function" == typeof m && m instanceof m && "function" == typeof w && w instanceof w) ||
          (f = !1);
      }
      return (a.delete(e), a.delete(t), f);
    })(e, t, r, n, o, a))
  );
}
function Xt(e, t, r, n, o) {
  return (
    e === t ||
    (null == e || null == t || (!G(e) && !G(t)) ? e != e && t != t : Dt(e, t, r, n, Xt, o))
  );
}
function Yt(e) {
  return e == e && !Q(e);
}
function Ht(e, t) {
  return function (r) {
    return null != r && r[e] === t && (void 0 !== t || e in Object(r));
  };
}
function Vt(e) {
  var t = (function (e) {
    for (var t = ct(e), r = t.length; r--; ) {
      var n = t[r],
        o = e[n];
      t[r] = [n, o, Yt(o)];
    }
    return t;
  })(e);
  return 1 == t.length && t[0][2]
    ? Ht(t[0][0], t[0][1])
    : function (r) {
        return (
          r === e ||
          (function (e, t, r, n) {
            var o = r.length,
              a = o;
            if (null == e) return !a;
            for (e = Object(e); o--; ) {
              var l = r[o];
              if (l[2] ? l[1] !== e[l[0]] : !(l[0] in e)) return !1;
            }
            for (; ++o < a; ) {
              var s = (l = r[o])[0],
                i = e[s],
                u = l[1];
              if (l[2]) {
                if (void 0 === i && !(s in e)) return !1;
              } else if (!Xt(u, i, 3, n, new q())) return !1;
            }
            return !0;
          })(r, 0, t)
        );
      };
}
function Ut(e, t) {
  return null != e && t in Object(e);
}
function qt(e, t) {
  return (
    null != e &&
    (function (e, t, r) {
      for (var n = -1, o = (t = Me(t, e)).length, a = !1; ++n < o; ) {
        var l = je(t[n]);
        if (!(a = null != e && r(e, l))) break;
        e = e[l];
      }
      return a || ++n != o
        ? a
        : !!(o = null == e ? 0 : e.length) && Z(o) && J(l, o) && (N(e) || ee(e));
    })(e, t, Ut)
  );
}
function Kt(e) {
  return Be(e)
    ? ((t = je(e)),
      function (e) {
        return null == e ? void 0 : e[t];
      })
    : (function (e) {
        return function (t) {
          return ze(t, e);
        };
      })(e);
  var t;
}
function Gt(e) {
  return "function" == typeof e
    ? e
    : null == e
      ? te
      : "object" == typeof e
        ? N(e)
          ? ((t = e[0]),
            (r = e[1]),
            Be(t) && Yt(r)
              ? Ht(je(t), r)
              : function (e) {
                  var n = Ce(e, t);
                  return void 0 === n && n === r ? qt(e, t) : Xt(r, n, 3);
                })
          : Vt(e)
        : Kt(e);
  var t, r;
}
var Qt,
  Zt =
    ((Qt = function (e, t) {
      return e && re(e, t, ct);
    }),
    function (e, t) {
      if (null == e) return e;
      if (!W(e)) return Qt(e, t);
      for (var r = e.length, n = -1, o = Object(e); ++n < r && !1 !== t(o[n], n, o); );
      return e;
    });
function Jt(e, t) {
  var r = -1,
    n = W(e) ? Array(e.length) : [];
  return (
    Zt(e, function (e, o, a) {
      n[++r] = t(e, o, a);
    }),
    n
  );
}
const er = { top: "bottom", bottom: "top", left: "right", right: "left" },
  tr = "var(--n-arrow-height) * 1.414",
  rr = oe([
    ae(
      "popover",
      "\n transition:\n box-shadow .3s var(--n-bezier),\n background-color .3s var(--n-bezier),\n color .3s var(--n-bezier);\n position: relative;\n font-size: var(--n-font-size);\n color: var(--n-text-color);\n box-shadow: var(--n-box-shadow);\n word-break: break-word;\n ",
      [
        oe(">", [ae("scrollbar", "\n height: inherit;\n max-height: inherit;\n ")]),
        le(
          "raw",
          "\n background-color: var(--n-color);\n border-radius: var(--n-border-radius);\n ",
          [le("scrollable", [le("show-header-or-footer", "padding: var(--n-padding);")])],
        ),
        se(
          "header",
          "\n padding: var(--n-padding);\n border-bottom: 1px solid var(--n-divider-color);\n transition: border-color .3s var(--n-bezier);\n ",
        ),
        se(
          "footer",
          "\n padding: var(--n-padding);\n border-top: 1px solid var(--n-divider-color);\n transition: border-color .3s var(--n-bezier);\n ",
        ),
        ie("scrollable, show-header-or-footer", [
          se("content", "\n padding: var(--n-padding);\n "),
        ]),
      ],
    ),
    ae("popover-shared", "\n transform-origin: inherit;\n ", [
      ae(
        "popover-arrow-wrapper",
        "\n position: absolute;\n overflow: hidden;\n pointer-events: none;\n ",
        [
          ae(
            "popover-arrow",
            `\n transition: background-color .3s var(--n-bezier);\n position: absolute;\n display: block;\n width: calc(${tr});\n height: calc(${tr});\n box-shadow: 0 0 8px 0 rgba(0, 0, 0, .12);\n transform: rotate(45deg);\n background-color: var(--n-color);\n pointer-events: all;\n `,
          ),
        ],
      ),
      oe(
        "&.popover-transition-enter-from, &.popover-transition-leave-to",
        "\n opacity: 0;\n transform: scale(.85);\n ",
      ),
      oe(
        "&.popover-transition-enter-to, &.popover-transition-leave-from",
        "\n transform: scale(1);\n opacity: 1;\n ",
      ),
      oe(
        "&.popover-transition-enter-active",
        "\n transition:\n box-shadow .3s var(--n-bezier),\n background-color .3s var(--n-bezier),\n color .3s var(--n-bezier),\n opacity .15s var(--n-bezier-ease-out),\n transform .15s var(--n-bezier-ease-out);\n ",
      ),
      oe(
        "&.popover-transition-leave-active",
        "\n transition:\n box-shadow .3s var(--n-bezier),\n background-color .3s var(--n-bezier),\n color .3s var(--n-bezier),\n opacity .15s var(--n-bezier-ease-in),\n transform .15s var(--n-bezier-ease-in);\n ",
      ),
    ]),
    lr(
      "top-start",
      `\n top: calc(${tr} / -2);\n left: calc(${ar("top-start")} - var(--v-offset-left));\n `,
    ),
    lr(
      "top",
      `\n top: calc(${tr} / -2);\n transform: translateX(calc(${tr} / -2)) rotate(45deg);\n left: 50%;\n `,
    ),
    lr(
      "top-end",
      `\n top: calc(${tr} / -2);\n right: calc(${ar("top-end")} + var(--v-offset-left));\n `,
    ),
    lr(
      "bottom-start",
      `\n bottom: calc(${tr} / -2);\n left: calc(${ar("bottom-start")} - var(--v-offset-left));\n `,
    ),
    lr(
      "bottom",
      `\n bottom: calc(${tr} / -2);\n transform: translateX(calc(${tr} / -2)) rotate(45deg);\n left: 50%;\n `,
    ),
    lr(
      "bottom-end",
      `\n bottom: calc(${tr} / -2);\n right: calc(${ar("bottom-end")} + var(--v-offset-left));\n `,
    ),
    lr(
      "left-start",
      `\n left: calc(${tr} / -2);\n top: calc(${ar("left-start")} - var(--v-offset-top));\n `,
    ),
    lr(
      "left",
      `\n left: calc(${tr} / -2);\n transform: translateY(calc(${tr} / -2)) rotate(45deg);\n top: 50%;\n `,
    ),
    lr(
      "left-end",
      `\n left: calc(${tr} / -2);\n bottom: calc(${ar("left-end")} + var(--v-offset-top));\n `,
    ),
    lr(
      "right-start",
      `\n right: calc(${tr} / -2);\n top: calc(${ar("right-start")} - var(--v-offset-top));\n `,
    ),
    lr(
      "right",
      `\n right: calc(${tr} / -2);\n transform: translateY(calc(${tr} / -2)) rotate(45deg);\n top: 50%;\n `,
    ),
    lr(
      "right-end",
      `\n right: calc(${tr} / -2);\n bottom: calc(${ar("right-end")} + var(--v-offset-top));\n `,
    ),
    ...((nr = {
      top: ["right-start", "left-start"],
      right: ["top-end", "bottom-end"],
      bottom: ["right-end", "left-end"],
      left: ["top-start", "bottom-start"],
    }),
    (or = (e, t) => {
      const r = ["right", "left"].includes(t),
        n = r ? "width" : "height";
      return e.map((e) => {
        const o = "end" === e.split("-")[1],
          a = `calc((var(--v-target-${n}, 0px) - ${tr}) / 2)`,
          l = ar(e);
        return oe(`[v-placement="${e}"] >`, [
          ae("popover-shared", [
            ie("center-arrow", [
              ae(
                "popover-arrow",
                `${t}: calc(max(${a}, ${l}) ${o ? "+" : "-"} var(--v-offset-${r ? "left" : "top"}));`,
              ),
            ]),
          ]),
        ]);
      });
    }),
    (N(nr) ? ne : Jt)(nr, Gt(or))),
  ]);
var nr, or;
function ar(e) {
  return ["top", "bottom"].includes(e.split("-")[0])
    ? "var(--n-arrow-offset)"
    : "var(--n-arrow-offset-vertical)";
}
function lr(e, t) {
  const r = e.split("-")[0],
    n = ["top", "bottom"].includes(r)
      ? "height: var(--n-space-arrow);"
      : "width: var(--n-space-arrow);";
  return oe(`[v-placement="${e}"] >`, [
    ae("popover-shared", `\n margin-${er[r]}: var(--n-space);\n `, [
      ie("show-arrow", `\n margin-${er[r]}: var(--n-space-arrow);\n `),
      ie("overlap", "\n margin: 0;\n "),
      ue(
        "popover-arrow-wrapper",
        `\n right: 0;\n left: 0;\n top: 0;\n bottom: 0;\n ${r}: 100%;\n ${er[r]}: auto;\n ${n}\n `,
        [ae("popover-arrow", t)],
      ),
    ]),
  ]);
}
const sr = Object.assign(Object.assign({}, ce.props), {
  to: De.propTo,
  show: Boolean,
  trigger: String,
  showArrow: Boolean,
  delay: Number,
  duration: Number,
  raw: Boolean,
  arrowPointToCenter: Boolean,
  arrowClass: String,
  arrowStyle: [String, Object],
  arrowWrapperClass: String,
  arrowWrapperStyle: [String, Object],
  displayDirective: String,
  x: Number,
  y: Number,
  flip: Boolean,
  overlap: Boolean,
  placement: String,
  width: [Number, String],
  keepAliveOnHover: Boolean,
  scrollable: Boolean,
  contentClass: String,
  contentStyle: [Object, String],
  headerClass: String,
  headerStyle: [Object, String],
  footerClass: String,
  footerStyle: [Object, String],
  internalDeactivateImmediately: Boolean,
  animated: Boolean,
  onClickoutside: Function,
  internalTrapFocus: Boolean,
  internalOnAfterLeave: Function,
  minWidth: Number,
  maxWidth: Number,
});
function ir({
  arrowClass: e,
  arrowStyle: t,
  arrowWrapperClass: r,
  arrowWrapperStyle: n,
  clsPrefix: o,
}) {
  return i(
    "div",
    { key: "__popover-arrow__", style: n, class: [`${o}-popover-arrow-wrapper`, r] },
    i("div", { class: [`${o}-popover-arrow`, e], style: t }),
  );
}
const ur = o({
    name: "PopoverBody",
    inheritAttrs: !1,
    props: sr,
    setup(r, { slots: o, attrs: l }) {
      const {
          namespaceRef: c,
          mergedClsPrefixRef: p,
          inlineThemeDisabled: m,
          mergedRtlRef: w,
        } = de(r),
        y = ce("Popover", "-popover", rr, pe, r, p),
        $ = fe("Popover", w, p),
        x = t(null),
        S = e("NPopover"),
        C = t(null),
        z = t(r.show),
        O = t(!1);
      f(() => {
        const { show: e } = r;
        !e ||
          (void 0 === st &&
            (st = navigator.userAgent.includes("Node.js") || navigator.userAgent.includes("jsdom")),
          st) ||
          r.internalDeactivateImmediately ||
          (O.value = !0);
      });
      const _ = h(() => {
          const { trigger: e, onClickoutside: t } = r,
            n = [],
            {
              positionManuallyRef: { value: o },
            } = S;
          return (
            o ||
              ("click" !== e || t || n.push([he, I, void 0, { capture: !0 }]),
              "hover" === e && n.push([Ge, P])),
            t && n.push([he, I, void 0, { capture: !0 }]),
            ("show" === r.displayDirective || (r.animated && O.value)) && n.push([v, r.show]),
            n
          );
        }),
        E = h(() => {
          const {
            common: { cubicBezierEaseInOut: e, cubicBezierEaseIn: t, cubicBezierEaseOut: r },
            self: {
              space: n,
              spaceArrow: o,
              padding: a,
              fontSize: l,
              textColor: s,
              dividerColor: i,
              color: u,
              boxShadow: d,
              borderRadius: c,
              arrowHeight: p,
              arrowOffset: f,
              arrowOffsetVertical: h,
            },
          } = y.value;
          return {
            "--n-box-shadow": d,
            "--n-bezier": e,
            "--n-bezier-ease-in": t,
            "--n-bezier-ease-out": r,
            "--n-font-size": l,
            "--n-text-color": s,
            "--n-color": u,
            "--n-divider-color": i,
            "--n-border-radius": c,
            "--n-arrow-height": p,
            "--n-arrow-offset": f,
            "--n-arrow-offset-vertical": h,
            "--n-padding": a,
            "--n-space": n,
            "--n-space-arrow": o,
          };
        }),
        T = h(() => {
          const e = "trigger" === r.width ? void 0 : Te(r.width),
            t = [];
          e && t.push({ width: e });
          const { maxWidth: n, minWidth: o } = r;
          return (
            n && t.push({ maxWidth: Te(n) }),
            o && t.push({ maxWidth: Te(o) }),
            m || t.push(E.value),
            t
          );
        }),
        k = m ? ve("popover", void 0, E, r) : void 0;
      function R(e) {
        "hover" === r.trigger && r.keepAliveOnHover && r.show && S.handleMouseEnter(e);
      }
      function A(e) {
        "hover" === r.trigger && r.keepAliveOnHover && S.handleMouseLeave(e);
      }
      function P(e) {
        "hover" !== r.trigger || W().contains(ge(e)) || S.handleMouseMoveOutside(e);
      }
      function I(e) {
        (("click" === r.trigger && !W().contains(ge(e))) || r.onClickoutside) &&
          S.handleClickOutside(e);
      }
      function W() {
        return S.getTriggerElement();
      }
      return (
        S.setBodyInstance({
          syncPosition: function () {
            var e;
            null === (e = x.value) || void 0 === e || e.syncPosition();
          },
        }),
        n(() => {
          S.setBodyInstance(null);
        }),
        u(d(r, "show"), (e) => {
          r.animated || (z.value = !!e);
        }),
        a(B, C),
        a(j, null),
        a(M, null),
        {
          displayed: O,
          namespace: c,
          isMounted: S.isMountedRef,
          zIndex: S.zIndexRef,
          followerRef: x,
          adjustedTo: De(r),
          followerEnabled: z,
          renderContentNode: function () {
            if (
              (null == k || k.onRender(),
              !("show" === r.displayDirective || r.show || (r.animated && O.value)))
            )
              return null;
            let e;
            const t = S.internalRenderBodyRef.value,
              { value: n } = p;
            if (t)
              e = t(
                [
                  `${n}-popover-shared`,
                  (null == $ ? void 0 : $.value) && `${n}-popover--rtl`,
                  null == k ? void 0 : k.themeClass.value,
                  r.overlap && `${n}-popover-shared--overlap`,
                  r.showArrow && `${n}-popover-shared--show-arrow`,
                  r.arrowPointToCenter && `${n}-popover-shared--center-arrow`,
                ],
                C,
                T.value,
                R,
                A,
              );
            else {
              const { value: t } = S.extraClassRef,
                { internalTrapFocus: a } = r,
                s = !be(o.header) || !be(o.footer),
                u = () => {
                  var e, t;
                  const a = s
                    ? i(
                        b,
                        null,
                        we(o.header, (e) =>
                          e
                            ? i(
                                "div",
                                {
                                  class: [`${n}-popover__header`, r.headerClass],
                                  style: r.headerStyle,
                                },
                                e,
                              )
                            : null,
                        ),
                        we(o.default, (e) =>
                          e
                            ? i(
                                "div",
                                {
                                  class: [`${n}-popover__content`, r.contentClass],
                                  style: r.contentStyle,
                                },
                                o,
                              )
                            : null,
                        ),
                        we(o.footer, (e) =>
                          e
                            ? i(
                                "div",
                                {
                                  class: [`${n}-popover__footer`, r.footerClass],
                                  style: r.footerStyle,
                                },
                                e,
                              )
                            : null,
                        ),
                      )
                    : r.scrollable
                      ? null === (e = o.default) || void 0 === e
                        ? void 0
                        : e.call(o)
                      : i(
                          "div",
                          {
                            class: [`${n}-popover__content`, r.contentClass],
                            style: r.contentStyle,
                          },
                          o,
                        );
                  return [
                    r.scrollable
                      ? i(
                          ye,
                          {
                            themeOverrides: y.value.peerOverrides.Scrollbar,
                            theme: y.value.peers.Scrollbar,
                            contentClass: s
                              ? void 0
                              : `${n}-popover__content ${null !== (t = r.contentClass) && void 0 !== t ? t : ""}`,
                            contentStyle: s ? void 0 : r.contentStyle,
                          },
                          { default: () => a },
                        )
                      : a,
                    r.showArrow
                      ? ir({
                          arrowClass: r.arrowClass,
                          arrowStyle: r.arrowStyle,
                          arrowWrapperClass: r.arrowWrapperClass,
                          arrowWrapperStyle: r.arrowWrapperStyle,
                          clsPrefix: n,
                        })
                      : null,
                  ];
                };
              e = i(
                "div",
                g(
                  {
                    class: [
                      `${n}-popover`,
                      `${n}-popover-shared`,
                      (null == $ ? void 0 : $.value) && `${n}-popover--rtl`,
                      null == k ? void 0 : k.themeClass.value,
                      t.map((e) => `${n}-${e}`),
                      {
                        [`${n}-popover--scrollable`]: r.scrollable,
                        [`${n}-popover--show-header-or-footer`]: s,
                        [`${n}-popover--raw`]: r.raw,
                        [`${n}-popover-shared--overlap`]: r.overlap,
                        [`${n}-popover-shared--show-arrow`]: r.showArrow,
                        [`${n}-popover-shared--center-arrow`]: r.arrowPointToCenter,
                      },
                    ],
                    ref: C,
                    style: T.value,
                    onKeydown: S.handleKeydown,
                    onMouseenter: R,
                    onMouseleave: A,
                  },
                  l,
                ),
                a ? i(me, { active: r.show, autoFocus: !0 }, { default: u }) : u(),
              );
            }
            return s(e, _.value);
          },
        }
      );
    },
    render() {
      return i(
        lt,
        {
          ref: "followerRef",
          zIndex: this.zIndex,
          show: this.show,
          enabled: this.followerEnabled,
          to: this.adjustedTo,
          x: this.x,
          y: this.y,
          flip: this.flip,
          placement: this.placement,
          containerClass: this.namespace,
          overlap: this.overlap,
          width: "trigger" === this.width ? "target" : void 0,
          teleportDisabled: this.adjustedTo === De.tdkey,
        },
        {
          default: () =>
            this.animated
              ? i(
                  p,
                  {
                    name: "popover-transition",
                    appear: this.isMounted,
                    onEnter: () => {
                      this.followerEnabled = !0;
                    },
                    onAfterLeave: () => {
                      var e;
                      (null === (e = this.internalOnAfterLeave) || void 0 === e || e.call(this),
                        (this.followerEnabled = !1),
                        (this.displayed = !1));
                    },
                  },
                  { default: this.renderContentNode },
                )
              : this.renderContentNode(),
        },
      );
    },
  }),
  dr = Object.keys(sr),
  cr = {
    focus: ["onFocus", "onBlur"],
    click: ["onClick"],
    hover: ["onMouseenter", "onMouseleave"],
    manual: [],
    nested: ["onFocus", "onBlur", "onMouseenter", "onMouseleave", "onClick"],
  };
const pr = {
    show: { type: Boolean, default: void 0 },
    defaultShow: Boolean,
    showArrow: { type: Boolean, default: !0 },
    trigger: { type: String, default: "hover" },
    delay: { type: Number, default: 100 },
    duration: { type: Number, default: 100 },
    raw: Boolean,
    placement: { type: String, default: "top" },
    x: Number,
    y: Number,
    arrowPointToCenter: Boolean,
    disabled: Boolean,
    getDisabled: Function,
    displayDirective: { type: String, default: "if" },
    arrowClass: String,
    arrowStyle: [String, Object],
    arrowWrapperClass: String,
    arrowWrapperStyle: [String, Object],
    flip: { type: Boolean, default: !0 },
    animated: { type: Boolean, default: !0 },
    width: { type: [Number, String], default: void 0 },
    overlap: Boolean,
    keepAliveOnHover: { type: Boolean, default: !0 },
    zIndex: Number,
    to: De.propTo,
    scrollable: Boolean,
    contentClass: String,
    contentStyle: [Object, String],
    headerClass: String,
    headerStyle: [Object, String],
    footerClass: String,
    footerStyle: [Object, String],
    onClickoutside: Function,
    "onUpdate:show": [Function, Array],
    onUpdateShow: [Function, Array],
    internalDeactivateImmediately: Boolean,
    internalSyncTargetWithParent: Boolean,
    internalInheritedEventHandlers: { type: Array, default: () => [] },
    internalTrapFocus: Boolean,
    internalExtraClass: { type: Array, default: () => [] },
    onShow: [Function, Array],
    onHide: [Function, Array],
    arrow: { type: Boolean, default: void 0 },
    minWidth: Number,
    maxWidth: Number,
  },
  fr = o({
    name: "Popover",
    inheritAttrs: !1,
    props: Object.assign(Object.assign(Object.assign({}, ce.props), pr), {
      internalOnAfterLeave: Function,
      internalRenderBody: Function,
    }),
    slots: Object,
    __popover__: !0,
    setup(e) {
      const r = T(),
        n = t(null),
        o = h(() => e.show),
        l = t(e.defaultShow),
        s = ke(o, l),
        i = S(() => !e.disabled && s.value),
        u = () => {
          if (e.disabled) return !0;
          const { getDisabled: t } = e;
          return !!(null == t ? void 0 : t());
        },
        c = () => !u() && s.value,
        p = Re(e, ["arrow", "showArrow"]),
        v = h(() => !e.overlap && p.value);
      let g = null;
      const b = t(null),
        m = t(null),
        w = S(() => void 0 !== e.x && void 0 !== e.y);
      function y(t) {
        const { "onUpdate:show": r, onUpdateShow: n, onShow: o, onHide: a } = e;
        ((l.value = t), r && Se(r, t), n && Se(n, t), t && o && Se(o, !0), t && a && Se(a, !1));
      }
      function $() {
        const { value: e } = b;
        e && (window.clearTimeout(e), (b.value = null));
      }
      function x() {
        const { value: e } = m;
        e && (window.clearTimeout(e), (m.value = null));
      }
      function M() {
        const t = u();
        if ("hover" === e.trigger && !t) {
          if ((x(), null !== b.value)) return;
          if (c()) return;
          const t = () => {
              (y(!0), (b.value = null));
            },
            { delay: r } = e;
          0 === r ? t() : (b.value = window.setTimeout(t, r));
        }
      }
      function j() {
        const t = u();
        if ("hover" === e.trigger && !t) {
          if (($(), null !== m.value)) return;
          if (!c()) return;
          const t = () => {
              (y(!1), (m.value = null));
            },
            { duration: r } = e;
          0 === r ? t() : (m.value = window.setTimeout(t, r));
        }
      }
      (a("NPopover", {
        getTriggerElement: function () {
          var e;
          return null === (e = n.value) || void 0 === e ? void 0 : e.targetRef;
        },
        handleKeydown: function (t) {
          e.internalTrapFocus && "Escape" === t.key && ($(), x(), y(!1));
        },
        handleMouseEnter: M,
        handleMouseLeave: j,
        handleClickOutside: function (t) {
          var r;
          c() &&
            ("click" === e.trigger && ($(), x(), y(!1)),
            null === (r = e.onClickoutside) || void 0 === r || r.call(e, t));
        },
        handleMouseMoveOutside: function () {
          j();
        },
        setBodyInstance: function (e) {
          g = e;
        },
        positionManuallyRef: w,
        isMountedRef: r,
        zIndexRef: d(e, "zIndex"),
        extraClassRef: d(e, "internalExtraClass"),
        internalRenderBodyRef: d(e, "internalRenderBody"),
      }),
        f(() => {
          s.value && u() && y(!1);
        }));
      return {
        binderInstRef: n,
        positionManually: w,
        mergedShowConsideringDisabledProp: i,
        uncontrolledShow: l,
        mergedShowArrow: v,
        getMergedShow: c,
        setShow: function (e) {
          l.value = e;
        },
        handleClick: function () {
          if ("click" === e.trigger && !u()) {
            ($(), x());
            y(!c());
          }
        },
        handleMouseEnter: M,
        handleMouseLeave: j,
        handleFocus: function () {
          const t = u();
          if ("focus" === e.trigger && !t) {
            if (c()) return;
            y(!0);
          }
        },
        handleBlur: function () {
          const t = u();
          if ("focus" === e.trigger && !t) {
            if (!c()) return;
            y(!1);
          }
        },
        syncPosition: function () {
          g && g.syncPosition();
        },
      };
    },
    render() {
      var e;
      const { positionManually: t, $slots: r } = this;
      let n,
        o = !1;
      if (!t && ((n = $e(r, "trigger")), n)) {
        ((n = m(n)), (n = n.type === w ? i("span", [n]) : n));
        const r = {
          onClick: this.handleClick,
          onMouseenter: this.handleMouseEnter,
          onMouseleave: this.handleMouseLeave,
          onFocus: this.handleFocus,
          onBlur: this.handleBlur,
        };
        if (null === (e = n.type) || void 0 === e ? void 0 : e.__popover__)
          ((o = !0),
            n.props ||
              (n.props = { internalSyncTargetWithParent: !0, internalInheritedEventHandlers: [] }),
            (n.props.internalSyncTargetWithParent = !0),
            n.props.internalInheritedEventHandlers
              ? (n.props.internalInheritedEventHandlers = [
                  r,
                  ...n.props.internalInheritedEventHandlers,
                ])
              : (n.props.internalInheritedEventHandlers = [r]));
        else {
          const { internalInheritedEventHandlers: e } = this,
            o = [r, ...e],
            s = {
              onBlur: (e) => {
                o.forEach((t) => {
                  t.onBlur(e);
                });
              },
              onFocus: (e) => {
                o.forEach((t) => {
                  t.onFocus(e);
                });
              },
              onClick: (e) => {
                o.forEach((t) => {
                  t.onClick(e);
                });
              },
              onMouseenter: (e) => {
                o.forEach((t) => {
                  t.onMouseenter(e);
                });
              },
              onMouseleave: (e) => {
                o.forEach((t) => {
                  t.onMouseleave(e);
                });
              },
            };
          ((a = n),
            (l = e ? "nested" : t ? "manual" : this.trigger),
            (u = s),
            cr[l].forEach((e) => {
              a.props ? (a.props = Object.assign({}, a.props)) : (a.props = {});
              const t = a.props[e],
                r = u[e];
              a.props[e] = t
                ? (...e) => {
                    (t(...e), r(...e));
                  }
                : r;
            }));
        }
      }
      var a, l, u;
      return i(
        Ue,
        {
          ref: "binderInstRef",
          syncTarget: !o,
          syncTargetWithParent: this.internalSyncTargetWithParent,
        },
        {
          default: () => {
            this.mergedShowConsideringDisabledProp;
            const e = this.getMergedShow();
            return [
              this.internalTrapFocus && e
                ? s(
                    i("div", {
                      style: { position: "fixed", top: 0, right: 0, bottom: 0, left: 0 },
                    }),
                    [[_, { enabled: e, zIndex: this.zIndex }]],
                  )
                : null,
              t ? null : i(qe, null, { default: () => n }),
              i(
                ur,
                xe(
                  this.$props,
                  dr,
                  Object.assign(Object.assign({}, this.$attrs), {
                    showArrow: this.mergedShowArrow,
                    show: e,
                  }),
                ),
                {
                  default: () => {
                    var e, t;
                    return null === (t = (e = this.$slots).default) || void 0 === t
                      ? void 0
                      : t.call(e);
                  },
                  header: () => {
                    var e, t;
                    return null === (t = (e = this.$slots).header) || void 0 === t
                      ? void 0
                      : t.call(e);
                  },
                  footer: () => {
                    var e, t;
                    return null === (t = (e = this.$slots).footer) || void 0 === t
                      ? void 0
                      : t.call(e);
                  },
                },
              ),
            ];
          },
        },
      );
    },
  });
export { Ue as B, qe as V, fr as _, lt as a, We as b, Fe as c, Ne as i, pr as p, ir as r, De as u };
