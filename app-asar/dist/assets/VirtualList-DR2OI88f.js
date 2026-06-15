import { V as e } from "./VirtualList-CHeV0Vz3.js";
import { bk as t } from "./index-Ct5UuHQN.js";
import { j as l, k as i, r as n } from "./vendor-DHo7BzsC.js";
const o = l({
  name: "VirtualList",
  props: {
    scrollbarProps: Object,
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
  setup(e) {
    const t = n(null),
      l = n(null);
    function i() {
      const { value: e } = t;
      e && e.sync();
    }
    return {
      scrollTo: function (e, t) {
        var i, n;
        "number" == typeof e
          ? null === (i = l.value) || void 0 === i || i.scrollTo(e, null != t ? t : 0)
          : null === (n = l.value) || void 0 === n || n.scrollTo(e);
      },
      scrollbarInstRef: t,
      virtualListInstRef: l,
      getScrollContainer: function () {
        var e;
        return null === (e = l.value) || void 0 === e ? void 0 : e.listElRef;
      },
      getScrollContent: function () {
        var e;
        return null === (e = l.value) || void 0 === e ? void 0 : e.itemsElRef;
      },
      handleScroll: function (t) {
        var l;
        (i(), null === (l = e.onScroll) || void 0 === l || l.call(e, t));
      },
      handleResize: function (t) {
        var l;
        (i(), null === (l = e.onResize) || void 0 === l || l.call(e, t));
      },
      handleWheel: function (t) {
        var l;
        null === (l = e.onWheel) || void 0 === l || l.call(e, t);
      },
    };
  },
  render() {
    return i(
      t,
      Object.assign({}, this.scrollbarProps, {
        ref: "scrollbarInstRef",
        container: this.getScrollContainer,
        content: this.getScrollContent,
      }),
      {
        default: () =>
          i(
            e,
            {
              ref: "virtualListInstRef",
              showScrollbar: !1,
              items: this.items,
              itemSize: this.itemSize,
              itemResizable: this.itemResizable,
              itemsStyle: this.itemsStyle,
              visibleItemsTag: this.visibleItemsTag,
              visibleItemsProps: this.visibleItemsProps,
              ignoreItemResize: this.ignoreItemResize,
              keyField: this.keyField,
              defaultScrollKey: this.defaultScrollKey,
              defaultScrollIndex: this.defaultScrollIndex,
              paddingTop: this.paddingTop,
              paddingBottom: this.paddingBottom,
              onScroll: this.handleScroll,
              onResize: this.handleResize,
              onWheel: this.handleWheel,
            },
            {
              default: ({ item: e, index: t }) => {
                var l, i;
                return null === (i = (l = this.$slots).default) || void 0 === i
                  ? void 0
                  : i.call(l, { item: e, index: t });
              },
            },
          ),
      },
    );
  },
});
export { o as _ };
