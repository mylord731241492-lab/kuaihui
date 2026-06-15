import { P as e, bt as t, bm as l, bw as n, bA as i } from "./index-Ct5UuHQN.js";
import {
  r as o,
  c as r,
  p as s,
  j as u,
  i as a,
  k as d,
  v as c,
  d as f,
  e as h,
  f as m,
  t as v,
} from "./vendor-DHo7BzsC.js";
import { c as p, a as g } from "./cssr-fugg8Rje.js";
import { b } from "./Popover-Z03uJL-I.js";
function R(e) {
  return e & -e;
}
class y {
  constructor(e, t) {
    ((this.l = e), (this.min = t));
    const l = new Array(e + 1);
    for (let n = 0; n < e + 1; ++n) l[n] = 0;
    this.ft = l;
  }
  add(e, t) {
    if (0 === t) return;
    const { l: l, ft: n } = this;
    for (e += 1; e <= l; ) ((n[e] += t), (e += R(e)));
  }
  get(e) {
    return this.sum(e + 1) - this.sum(e);
  }
  sum(e) {
    if ((void 0 === e && (e = this.l), e <= 0)) return 0;
    const { ft: t, min: l, l: n } = this;
    if (e > n) throw new Error("[FinweckTree.sum]: `i` is larger than length.");
    let i = e * l;
    for (; e > 0; ) ((i += t[e]), (e -= R(e)));
    return i;
  }
  getBound(e) {
    let t = 0,
      l = this.l;
    for (; l > t; ) {
      const n = Math.floor((t + l) / 2),
        i = this.sum(n);
      if (i > e) l = n;
      else {
        if (!(i < e)) return n;
        if (t === n) return this.sum(t + 1) <= e ? t + 1 : n;
        t = n;
      }
    }
    return t;
  }
}
let I, w;
function S() {
  return "undefined" == typeof document
    ? 1
    : (void 0 === w && (w = "chrome" in window ? window.devicePixelRatio : 1), w);
}
const x = "VVirtualListXScroll";
const C = u({
    name: "VirtualListRow",
    props: { index: { type: Number, required: !0 }, item: { type: Object, required: !0 } },
    setup() {
      const {
        startIndexRef: e,
        endIndexRef: t,
        columnsRef: l,
        getLeft: n,
        renderColRef: i,
        renderItemWithColsRef: o,
      } = a(x);
      return {
        startIndex: e,
        endIndex: t,
        columns: l,
        renderCol: i,
        renderItemWithCols: o,
        getLeft: n,
      };
    },
    render() {
      const {
        startIndex: e,
        endIndex: t,
        columns: l,
        renderCol: n,
        renderItemWithCols: i,
        getLeft: o,
        item: r,
      } = this;
      if (null != i)
        return i({
          itemIndex: this.index,
          startColIndex: e,
          endColIndex: t,
          allColumns: l,
          item: r,
          getLeft: o,
        });
      if (null != n) {
        const i = [];
        for (let s = e; s <= t; ++s) {
          const e = l[s];
          i.push(n({ column: e, left: o(s), item: r }));
        }
        return i;
      }
      return null;
    },
  }),
  T = p(".v-vl", { maxHeight: "inherit", height: "100%", overflow: "auto", minWidth: "1px" }, [
    p("&:not(.v-vl--show-scrollbar)", { scrollbarWidth: "none" }, [
      p("&::-webkit-scrollbar, &::-webkit-scrollbar-track-piece, &::-webkit-scrollbar-thumb", {
        width: 0,
        height: 0,
        display: "none",
      }),
    ]),
  ]),
  z = u({
    name: "VirtualList",
    inheritAttrs: !1,
    props: {
      showScrollbar: { type: Boolean, default: !0 },
      columns: { type: Array, default: () => [] },
      renderCol: Function,
      renderItemWithCols: Function,
      items: { type: Array, default: () => [] },
      itemSize: { type: Number, required: !0 },
      itemResizable: Boolean,
      itemsStyle: [String, Object],
      visibleItemsTag: { type: [String, Object], default: "div" },
      visibleItemsProps: Object,
      ignoreItemResize: Boolean,
      onScroll: Function,
      onWheel: Function,
      onResize: Function,
      defaultScrollKey: [Number, String],
      defaultScrollIndex: Number,
      keyField: { type: String, default: "key" },
      paddingTop: { type: [Number, String], default: 0 },
      paddingBottom: { type: [Number, String], default: 0 },
    },
    setup(t) {
      const u = l();
      (T.mount({ id: "vueuc/virtual-list", head: !0, anchorMetaName: g, ssr: u }),
        f(() => {
          const { defaultScrollIndex: e, defaultScrollKey: l } = t;
          null != e ? F({ index: e }) : null != l && F({ key: l });
        }));
      let a = !1,
        d = !1;
      (h(() => {
        ((a = !1), d ? F({ top: B.value, left: R.value }) : (d = !0));
      }),
        m(() => {
          ((a = !0), d || (d = !0));
        }));
      const c = e(() => {
          if (null == t.renderCol && null == t.renderItemWithCols) return;
          if (0 === t.columns.length) return;
          let e = 0;
          return (
            t.columns.forEach((t) => {
              e += t.width;
            }),
            e
          );
        }),
        p = r(() => {
          const e = new Map(),
            { keyField: l } = t;
          return (
            t.items.forEach((t, n) => {
              e.set(t[l], n);
            }),
            e
          );
        }),
        { scrollLeftRef: R, listWidthRef: w } = (function ({
          columnsRef: t,
          renderColRef: l,
          renderItemWithColsRef: n,
        }) {
          const i = o(0),
            u = o(0),
            a = r(() => {
              const e = t.value;
              if (0 === e.length) return null;
              const l = new y(e.length, 0);
              return (
                e.forEach((e, t) => {
                  l.add(t, e.width);
                }),
                l
              );
            }),
            d = e(() => {
              const e = a.value;
              return null !== e ? Math.max(e.getBound(u.value) - 1, 0) : 0;
            }),
            c = e(() => {
              const e = a.value;
              return null !== e
                ? Math.min(e.getBound(u.value + i.value) + 1, t.value.length - 1)
                : 0;
            });
          return (
            s(x, {
              startIndexRef: d,
              endIndexRef: c,
              columnsRef: t,
              renderColRef: l,
              renderItemWithColsRef: n,
              getLeft: (e) => {
                const t = a.value;
                return null !== t ? t.sum(e) : 0;
              },
            }),
            { listWidthRef: i, scrollLeftRef: u }
          );
        })({
          columnsRef: v(t, "columns"),
          renderColRef: v(t, "renderCol"),
          renderItemWithColsRef: v(t, "renderItemWithCols"),
        }),
        C = o(null),
        z = o(void 0),
        W = new Map(),
        k = r(() => {
          const { items: e, itemSize: l, keyField: n } = t,
            i = new y(e.length, l);
          return (
            e.forEach((e, t) => {
              const l = e[n],
                o = W.get(l);
              void 0 !== o && i.add(t, o);
            }),
            i
          );
        }),
        L = o(0),
        B = o(0),
        E = e(() => Math.max(k.value.getBound(B.value - n(t.paddingTop)) - 1, 0)),
        M = r(() => {
          const { value: e } = z;
          if (void 0 === e) return [];
          const { items: l, itemSize: n } = t,
            i = E.value,
            o = Math.min(i + Math.ceil(e / n + 1), l.length - 1),
            r = [];
          for (let t = i; t <= o; ++t) r.push(l[t]);
          return r;
        }),
        F = (e, t) => {
          if ("number" == typeof e) return void H(e, t, "auto");
          const {
            left: l,
            top: n,
            index: i,
            key: o,
            position: r,
            behavior: s,
            debounce: u = !0,
          } = e;
          if (void 0 !== l || void 0 !== n) H(l, n, s);
          else if (void 0 !== i) A(i, s, u);
          else if (void 0 !== o) {
            const e = p.value.get(o);
            void 0 !== e && A(e, s, u);
          } else "bottom" === r ? H(0, Number.MAX_SAFE_INTEGER, s) : "top" === r && H(0, 0, s);
        };
      let j,
        N = null;
      function A(e, l, i) {
        const { value: o } = k,
          r = o.sum(e) + n(t.paddingTop);
        if (i) {
          ((j = e),
            null !== N && window.clearTimeout(N),
            (N = window.setTimeout(() => {
              ((j = void 0), (N = null));
            }, 16)));
          const { scrollTop: t, offsetHeight: n } = C.value;
          if (r > t) {
            const i = o.get(e);
            r + i <= t + n || C.value.scrollTo({ left: 0, top: r + i - n, behavior: l });
          } else C.value.scrollTo({ left: 0, top: r, behavior: l });
        } else C.value.scrollTo({ left: 0, top: r, behavior: l });
      }
      function H(e, t, l) {
        C.value.scrollTo({ left: e, top: t, behavior: l });
      }
      const P = !(
        "undefined" != typeof document &&
        (void 0 === I &&
          (I = "matchMedia" in window && window.matchMedia("(pointer:coarse)").matches),
        I)
      );
      let O = !1;
      function V() {
        const { value: e } = C;
        null != e && ((B.value = e.scrollTop), (R.value = e.scrollLeft));
      }
      function X(e) {
        let t = e;
        for (; null !== t; ) {
          if ("none" === t.style.display) return !0;
          t = t.parentElement;
        }
        return !1;
      }
      return {
        listHeight: z,
        listStyle: { overflow: "auto" },
        keyToIndex: p,
        itemsStyle: r(() => {
          const { itemResizable: e } = t,
            l = i(k.value.sum());
          return (
            L.value,
            [
              t.itemsStyle,
              {
                boxSizing: "content-box",
                width: i(c.value),
                height: e ? "" : l,
                minHeight: e ? l : "",
                paddingTop: i(t.paddingTop),
                paddingBottom: i(t.paddingBottom),
              },
            ]
          );
        }),
        visibleItemsStyle: r(
          () => (L.value, { transform: `translateY(${i(k.value.sum(E.value))})` }),
        ),
        viewportItems: M,
        listElRef: C,
        itemsElRef: o(null),
        scrollTo: F,
        handleListResize: function (e) {
          if (a) return;
          if (X(e.target)) return;
          if (null == t.renderCol && null == t.renderItemWithCols) {
            if (e.contentRect.height === z.value) return;
          } else if (e.contentRect.height === z.value && e.contentRect.width === w.value) return;
          ((z.value = e.contentRect.height), (w.value = e.contentRect.width));
          const { onResize: l } = t;
          void 0 !== l && l(e);
        },
        handleListScroll: function (e) {
          var l;
          (null === (l = t.onScroll) || void 0 === l || l.call(t, e), (P && O) || V());
        },
        handleListWheel: function (e) {
          var l;
          if ((null === (l = t.onWheel) || void 0 === l || l.call(t, e), P)) {
            const t = C.value;
            if (null != t) {
              if (0 === e.deltaX) {
                if (0 === t.scrollTop && e.deltaY <= 0) return;
                if (t.scrollTop + t.offsetHeight >= t.scrollHeight && e.deltaY >= 0) return;
              }
              (e.preventDefault(),
                (t.scrollTop += e.deltaY / S()),
                (t.scrollLeft += e.deltaX / S()),
                V(),
                (O = !0),
                b(() => {
                  O = !1;
                }));
            }
          }
        },
        handleItemResize: function (e, l) {
          var n, i, o;
          if (a) return;
          if (t.ignoreItemResize) return;
          if (X(l.target)) return;
          const { value: r } = k,
            s = p.value.get(e),
            u = r.get(s),
            d =
              null !==
                (o =
                  null === (i = null === (n = l.borderBoxSize) || void 0 === n ? void 0 : n[0]) ||
                  void 0 === i
                    ? void 0
                    : i.blockSize) && void 0 !== o
                ? o
                : l.contentRect.height;
          if (d === u) return;
          0 === d - t.itemSize ? W.delete(e) : W.set(e, d - t.itemSize);
          const c = d - u;
          if (0 === c) return;
          r.add(s, c);
          const f = C.value;
          if (null != f) {
            if (void 0 === j) {
              const e = r.sum(s);
              f.scrollTop > e && f.scrollBy(0, c);
            } else if (s < j) f.scrollBy(0, c);
            else if (s === j) {
              d + r.sum(s) > f.scrollTop + f.offsetHeight && f.scrollBy(0, c);
            }
            V();
          }
          L.value++;
        },
      };
    },
    render() {
      const { itemResizable: e, keyField: l, keyToIndex: n, visibleItemsTag: i } = this;
      return d(
        t,
        { onResize: this.handleListResize },
        {
          default: () => {
            var o, r;
            return d(
              "div",
              c(this.$attrs, {
                class: ["v-vl", this.showScrollbar && "v-vl--show-scrollbar"],
                onScroll: this.handleListScroll,
                onWheel: this.handleListWheel,
                ref: "listElRef",
              }),
              [
                0 !== this.items.length
                  ? d("div", { ref: "itemsElRef", class: "v-vl-items", style: this.itemsStyle }, [
                      d(
                        i,
                        Object.assign(
                          { class: "v-vl-visible-items", style: this.visibleItemsStyle },
                          this.visibleItemsProps,
                        ),
                        {
                          default: () => {
                            const { renderCol: i, renderItemWithCols: o } = this;
                            return this.viewportItems.map((r) => {
                              const s = r[l],
                                u = n.get(s),
                                a = null != i ? d(C, { index: u, item: r }) : void 0,
                                c = null != o ? d(C, { index: u, item: r }) : void 0,
                                f = this.$slots.default({
                                  item: r,
                                  renderedCols: a,
                                  renderedItemWithCols: c,
                                  index: u,
                                })[0];
                              return e
                                ? d(
                                    t,
                                    { key: s, onResize: (e) => this.handleItemResize(s, e) },
                                    { default: () => f },
                                  )
                                : ((f.key = s), f);
                            });
                          },
                        },
                      ),
                    ])
                  : null === (r = (o = this.$slots).empty) || void 0 === r
                    ? void 0
                    : r.call(o),
              ],
            );
          },
        },
      );
    },
  });
export { z as V };
