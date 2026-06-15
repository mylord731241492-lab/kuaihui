import { i as s, B as e, V as a, d as t } from "./index-Ct5UuHQN.js";
import {
  j as o,
  r as l,
  d as r,
  z as i,
  w as n,
  Z as c,
  _ as p,
  U as d,
  S as m,
  h as u,
  a0 as g,
  R as v,
  F as h,
  a4 as f,
  V as j,
} from "./vendor-DHo7BzsC.js";
import { N as y } from "./Ellipsis-B_bopKoR.js";
import { _ } from "./Empty-BURlTLhl.js";
import "./Tooltip-DYS7RCZ0.js";
import "./Popover-Z03uJL-I.js";
import "./get-BluUyD2c.js";
import "./cssr-fugg8Rje.js";
import "./format-length-l2rsThpR.js";
import "./use-merged-state-mPE1JA5r.js";
import "./use-compitable-BbI6cQbC.js";
import "./use-locale-BcUKARuA.js";
const w = { class: "ai-error-message-popup" },
  x = { class: "popup-header draggable-area" },
  b = { class: "title" },
  k = { class: "popup-content" },
  z = { key: 1, class: "message-list-container" },
  I = { class: "message-list" },
  C = { class: "message-content" },
  M = { class: "card-header" },
  A = { class: "title" },
  E = { class: "card-content" },
  q = { class: "card-content-item" },
  B = { class: "ai-content" },
  N = { class: "message-list-bottom" },
  P = { style: { color: "#467efd", "font-weight": "600" } },
  S = t(
    o({
      __name: "index",
      setup(t) {
        const o = l([]),
          S = l([]),
          V = l({});
        (r(() => {
          (s.on("add-ai-error-message", D), s.on("get-aierror-select-shop", F));
        }),
          i(() => {
            (s.removeListener("add-ai-error-message", D), s.on("get-aierror-select-shop", F));
          }));
        const D = (s, e) => {
            (o.value.push(e), V.value && F(null, V.value));
          },
          F = (s, e) => {
            ((V.value = e),
              (S.value = o.value
                .filter((s) => s.shopSystemId === e.shopId)
                .sort((s, e) => e.time - s.time)));
          };
        n(
          () => S.value.length,
          (e) => {
            const a = Math.max(200, Math.min(600, 100 * (e || 1)));
            s.postMessage("resize-error-message-window", { height: a }), s.postMessage("toggle-message-window", { platform: "ai-error", show: e > 0 });
          },
        );
        const L = () => {
          s.postMessage("toggle-message-window", { platform: "ai-error", show: !1 });
        };
        return (t, o) => {
          const l = y,
            r = e,
            i = _,
            n = a;
          return (
            j(),
            c("div", w, [
              p("div", x, [
                p("div", b, [
                  o[0] || (o[0] = p("span", null, "AI纠错 ", -1)),
                  d(
                    l,
                    { style: { "max-width": "120px" } },
                    { default: m(() => [u(g(V.value.shopName), 1)]), _: 1 },
                  ),
                ]),
                d(
                  r,
                  { size: "tiny", quaternary: "", circle: "", class: "close-button", onClick: L },
                  { default: m(() => [...(o[1] || (o[1] = [u(" x ", -1)]))]), _: 1 },
                ),
              ]),
              p("div", k, [
                0 === S.value.length
                  ? (j(), v(i, { key: 0, description: "暂无AI消息", size: "small" }))
                  : (j(),
                    c("div", z, [
                      p("div", I, [
                        (j(!0),
                        c(
                          h,
                          null,
                          f(
                            S.value,
                            (e, a) => (
                              j(),
                              c("div", { key: a, class: "message-item" }, [
                                p("div", C, [
                                  d(
                                    n,
                                    { hoverable: "" },
                                    {
                                      header: m(() => [
                                        p("div", M, [
                                          p("div", A, g(e.username) + ": " + g(e.userContent), 1),
                                          d(
                                            r,
                                            {
                                              size: "tiny",
                                              quaternary: "",
                                              class: "correction-button",
                                              onClick: (a) =>
                                                ((e) => {
                                                  s.postMessage("open-aierror-edit-message", !0, e);
                                                })(e),
                                            },
                                            {
                                              default: m(() => [
                                                ...(o[2] || (o[2] = [u(" 纠错 ", -1)])),
                                              ]),
                                              _: 1,
                                            },
                                            8,
                                            ["onClick"],
                                          ),
                                        ]),
                                      ]),
                                      default: m(() => [
                                        p("div", E, [
                                          p("div", q, [
                                            p("p", B, [
                                              o[3] ||
                                                (o[3] = p(
                                                  "span",
                                                  {
                                                    style: {
                                                      color: "#565656",
                                                      "font-weight": "600",
                                                      fontsize: "14px",
                                                    },
                                                  },
                                                  "AI回复:   ",
                                                  -1,
                                                )),
                                              d(
                                                l,
                                                {
                                                  style: { "max-width": "240px" },
                                                  "line-clamp": "2",
                                                },
                                                { default: m(() => [u(g(e.content), 1)]), _: 2 },
                                                1024,
                                              ),
                                            ]),
                                            o[4] || (o[4] = p("span", null, "时间：", -1)),
                                            p("span", null, g(e.timestring), 1),
                                          ]),
                                        ]),
                                      ]),
                                      _: 2,
                                    },
                                    1024,
                                  ),
                                ]),
                              ])
                            ),
                          ),
                          128,
                        )),
                      ]),
                      p("div", N, [
                        o[5] || (o[5] = u(" 当前店铺条数: ", -1)),
                        p("span", P, g(S.value.length), 1),
                        o[6] || (o[6] = u(" 条 ", -1)),
                      ]),
                    ])),
              ]),
            ])
          );
        };
      },
    }),
    [["__scopeId", "data-v-632bdeb8"]],
  );
export { S as default };
