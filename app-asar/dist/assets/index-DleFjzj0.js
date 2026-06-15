import { e, i as a, B as s, d as t } from "./index-Ct5UuHQN.js";
import { m as n, n as l } from "./newAi-BxbCXy2V.js";
import {
  j as o,
  r as i,
  d as r,
  Z as u,
  _ as d,
  U as c,
  S as v,
  a0 as m,
  h as p,
  V as w,
} from "./vendor-DHo7BzsC.js";
import { N as f } from "./Icon-BkVA54F2.js";
import { _ as g } from "./Input-BbH8ts9k.js";
import "./format-length-l2rsThpR.js";
import "./use-locale-BcUKARuA.js";
import "./use-merged-state-mPE1JA5r.js";
const h = { class: "handle-message-window" },
  x = { class: "window-header draggable-area" },
  y = { class: "message-info" },
  L = { class: "info-row" },
  I = { class: "shop-info" },
  _ = { class: "shop-name" },
  j = { class: "time" },
  q = { class: "form-content" },
  k = { class: "form-item" },
  A = { class: "form-item" },
  M = { class: "window-footer" },
  b = t(
    o({
      __name: "index",
      setup(t) {
        const o = e(),
          b = i({}),
          C = i({ question: "", answer: "" });
        r(() => {
          (a.on("message-data", (e, a) => {
            ((b.value = a.message),
              (C.value.question = a.message.content),
              (C.value.answer = ""),
              (o.token = a.message.token));
          }),
            a.postMessage("request-message-data"));
        });
        const N = async () => {
            a.postMessage("save-handle-result", {
              messageId: b.value.id,
              question: C.value.question,
              answer: C.value.answer,
            });
            const e = (await n(b.value.shop.indexId)).documents[0].id;
            (await S(b.value.shop.indexId, e)).push({
              title: C.value.question,
              content: C.value.answer,
            });
          },
          S = async (e, a) => {
            let s = [],
              t = 0,
              n = 1;
            const o = i([]),
              r = { indexId: e, fileId: a, pageNum: 1, pageSize: 50 },
              { data: u } = await l(r);
            if (u && Array.isArray(u.nodes)) {
              let e = u.nodes.map((e) => {
                const a = (e.text || "").split("\n");
                return { title: a[0] || "无标题", content: a[1] || "无内容" };
              });
              ((s = s.concat(e)), (t = u.total || 0), (n = Math.ceil(t / 50)), (o.value = [...s]));
            }
            for (let i = 2; i <= n; i++) {
              const t = { indexId: e, fileId: a, pageNum: i, pageSize: 50 },
                { data: n } = await l(t);
              if (n && Array.isArray(n.nodes) && n.nodes.length > 0) {
                let e = n.nodes.map((e) => {
                  const a = (e.text || "").split("\n");
                  return { title: a[0] || "无标题", content: a[1] || "无内容" };
                });
                ((s = s.concat(e)), (o.value = [...s]));
              }
            }
            return ((o.value = s), o.value);
          },
          z = () => {
            a.postMessage("close-handle-window");
          };
        return (e, a) => {
          const t = f,
            n = s,
            l = g;
          return (
            w(),
            u("div", h, [
              d("div", x, [
                a[3] || (a[3] = d("div", { class: "title" }, "处理消息", -1)),
                c(
                  n,
                  { size: "tiny", quaternary: "", circle: "", class: "close-button", onClick: z },
                  {
                    icon: v(() => [
                      c(t, null, {
                        default: v(() => [
                          ...(a[2] ||
                            (a[2] = [
                              d(
                                "svg",
                                { viewBox: "0 0 24 24" },
                                [
                                  d("path", {
                                    d: "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",
                                    fill: "currentColor",
                                  }),
                                ],
                                -1,
                              ),
                            ])),
                        ]),
                        _: 1,
                      }),
                    ]),
                    _: 1,
                  },
                ),
              ]),
              d("div", y, [
                d("div", L, [
                  d("div", I, [
                    d("span", _, m(b.value.shopName), 1),
                    d("span", j, m(b.value.time), 1),
                  ]),
                ]),
              ]),
              d("div", q, [
                d("div", k, [
                  a[4] || (a[4] = d("label", null, "问题：", -1)),
                  c(
                    l,
                    {
                      value: C.value.question,
                      "onUpdate:value": a[0] || (a[0] = (e) => (C.value.question = e)),
                      type: "textarea",
                      placeholder: "请输入问题",
                      rows: 4,
                    },
                    null,
                    8,
                    ["value"],
                  ),
                ]),
                d("div", A, [
                  a[5] || (a[5] = d("label", null, "答案：", -1)),
                  c(
                    l,
                    {
                      value: C.value.answer,
                      "onUpdate:value": a[1] || (a[1] = (e) => (C.value.answer = e)),
                      type: "textarea",
                      placeholder: "请输入答案",
                      rows: 6,
                    },
                    null,
                    8,
                    ["value"],
                  ),
                ]),
              ]),
              d("div", M, [
                c(
                  n,
                  { onClick: z },
                  { default: v(() => [...(a[6] || (a[6] = [p("取消", -1)]))]), _: 1 },
                ),
                c(
                  n,
                  { type: "primary", onClick: N },
                  { default: v(() => [...(a[7] || (a[7] = [p("保存", -1)]))]), _: 1 },
                ),
              ]),
            ])
          );
        };
      },
    }),
    [["__scopeId", "data-v-f12c4a75"]],
  );
export { b as default };
