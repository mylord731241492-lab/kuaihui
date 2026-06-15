import { i as s, B as e, d as a } from "./index-Ct5UuHQN.js";
import {
  j as t,
  r as o,
  w as l,
  d as n,
  Z as i,
  _ as m,
  U as c,
  R as p,
  X as d,
  F as r,
  a4 as u,
  V as g,
  a0 as v,
  S as h,
  h as w,
} from "./vendor-DHo7BzsC.js";
import { _ as f } from "./Badge-CoCZ1ULG.js";
import { _ as k } from "./Empty-BURlTLhl.js";
import "./attribute-Cap6sGiE.js";
import "./use-locale-BcUKARuA.js";
const y = { class: "ai-missed-message-popup" },
  _ = { class: "popup-header draggable-area" },
  j = { class: "title" },
  b = { class: "popup-content" },
  M = { key: 1, class: "message-list" },
  x = { class: "message-content" },
  z = { class: "content" },
  C = { class: "meta" },
  B = { class: "time" },
  I = { class: "shop" },
  q = { class: "actions" },
  A = a(
    t({
      __name: "index",
      setup(a) {
        const t = o([]),
          A = o(!1);
        (l(
          () => t.value.length,
          (e) => {
            if ((e > 0 && !A.value) || (0 === e && A.value)) {
              const a = e > 0;
              (s.postMessage("toggle-message-window", { platform: "ai-missed", show: a }),
                (A.value = a));
            }
          },
        ),
          n(() => {
            const e = t.value.length > 0;
            (s.postMessage("toggle-message-window", { platform: "ai-missed", show: e }),
              (A.value = e),
              s.on("message-handled", (s, e) => {}),
              s.on("add-ai-missed-message", (s, e) => {
                t.value.push(e);
              }));
          }));
        const D = () => {
          (s.postMessage("toggle-message-window", { platform: "ai-missed", show: !1 }),
            (A.value = !1));
        };
        return (a, o) => {
          const l = f,
            n = e,
            A = k;
          return (
            g(),
            i("div", y, [
              m("div", _, [
                m("div", j, [
                  o[0] || (o[0] = m("span", null, "AI未识别消息", -1)),
                  t.value.length > 0
                    ? (g(), p(l, { key: 0, value: t.value.length }, null, 8, ["value"]))
                    : d("", !0),
                ]),
                c(n, {
                  size: "tiny",
                  quaternary: "",
                  circle: "",
                  class: "close-button",
                  onClick: D,
                }),
              ]),
              m("div", b, [
                0 === t.value.length
                  ? (g(), p(A, { key: 0, description: "暂无未识别消息", size: "small" }))
                  : (g(),
                    i("div", M, [
                      (g(!0),
                      i(
                        r,
                        null,
                        u(t.value, (e, a) => {
                          return (
                            g(),
                            i("div", { key: a, class: "message-item" }, [
                              m("div", x, [
                                m("div", z, v(e.content), 1),
                                m("div", C, [
                                  m("span", B, v(((t = e.time), t.split(" ")[1].substr(0, 5))), 1),
                                  m("span", I, v(e.shop.shopName), 1),
                                ]),
                              ]),
                              m("div", q, [
                                c(
                                  n,
                                  {
                                    size: "tiny",
                                    onClick: (a) =>
                                      ((e) => {
                                        const a = {
                                          content: e.content,
                                          time: e.time,
                                          shop: e.shop,
                                          token: e.token,
                                        };
                                        s.postMessage("open-handle-message-window", { message: a });
                                      })(e),
                                  },
                                  {
                                    default: h(() => [...(o[1] || (o[1] = [w("处理", -1)]))]),
                                    _: 1,
                                  },
                                  8,
                                  ["onClick"],
                                ),
                              ]),
                            ])
                          );
                          var t;
                        }),
                        128,
                      )),
                    ])),
              ]),
            ])
          );
        };
      },
    }),
    [["__scopeId", "data-v-fcb8ab20"]],
  );
export { A as default };
