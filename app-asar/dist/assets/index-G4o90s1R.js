import { c7 as o, i as e, B as t, c8 as i, c9 as n, d as a } from "./index-Ct5UuHQN.js";
import {
  j as l,
  k as s,
  b as r,
  z as d,
  R as c,
  S as p,
  U as u,
  _ as v,
  V as m,
} from "./vendor-DHo7BzsC.js";
import { _ as f } from "./Space-D6L4c5Pi.js";
import "./get-slot-BjAOOWF7.js";
const y = a(
  l({
    __name: "index",
    setup(a) {
      const { notification: l } = o(["notification"]),
        y = {
          common: {
            primaryColor: "#007bff",
            primaryColorHover: "#0056b3",
            primaryColorPressed: "#004085",
            primaryColorSuppl: "#007bff",
          },
        };
      e.removeAllListeners();
      const w = new Map();
      e.on("show-ImportantNotice", (o, i) => {
        if (w.has(null == i ? void 0 : i.id)) return;
        const { type: n, title: a, content: r, duration: d } = i,
          c = (l[n] || l.info)({
            id: (null == i ? void 0 : i.id) || Date.now(),
            title: a || "提示",
            content: "string" == typeof r ? () => s("span", { innerHTML: r }) : r,
            duration: void 0 !== d ? d : void 0,
            action:
              "ws-close" === i.typekey
                ? () =>
                    s(f, {}, () => [
                      s(
                        t,
                        {
                          size: "small",
                          onClick: () => {
                            var o;
                            return null == (o = w.get(i.id)) ? void 0 : o.destroy();
                          },
                        },
                        { default: () => "暂不刷新" },
                      ),
                      s(
                        t,
                        {
                          type: "primary",
                          size: "small",
                          onClick: () => h(null == i ? void 0 : i.id, null == i ? void 0 : i.data),
                        },
                        { default: () => "一键刷新" },
                      ),
                    ])
                : void 0,
            onClose: (o) => {
              (w.has(null == i ? void 0 : i.id) && w.delete(null == i ? void 0 : i.id),
                e.postMessage("update-ImportantNotice-view", null == i ? void 0 : i.id));
            },
          });
        c && (null == i ? void 0 : i.id) && w.set(null == i ? void 0 : i.id, c);
      });
      const h = (o, t) => {
        (w.has(null == t ? void 0 : t.id) && w.delete(null == t ? void 0 : t.id),
          e.send("update-ImportantNotice-view", o, t));
      };
      return (
        e.on("destroy-ImportantNotice", (o, t) => {
          var i;
          w.has(t) &&
            (null == (i = w.get(t)) || i.destroy(),
            w.delete(t),
            e.postMessage("update-ImportantNotice-view", t));
        }),
        e.on("clear-ImportantNotice", () => {
          (w.forEach((o) => {
            var e;
            null == (e = null == o ? void 0 : o.destroy) || e.call(o);
          }),
            w.clear());
        }),
        e.send("notification-window-ready"),
        r(() => {
          e.removeAllListeners();
        }),
        d(() => {
          e.removeAllListeners();
        }),
        (o, e) => {
          const t = i,
            a = n;
          return (
            m(),
            c(
              a,
              { "theme-overrides": y },
              {
                default: p(() => [
                  u(
                    t,
                    { placement: "top-right", max: 3 },
                    {
                      default: p(() => [
                        ...(e[0] ||
                          (e[0] = [v("div", { class: "notification-container" }, null, -1)])),
                      ]),
                      _: 1,
                    },
                  ),
                ]),
                _: 1,
              },
            )
          );
        }
      );
    },
  }),
  [["__scopeId", "data-v-d0365893"]],
);
export { y as default };
