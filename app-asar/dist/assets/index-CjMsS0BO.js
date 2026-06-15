import { e as a, i as e, B as s, bx as t, d as o } from "./index-Ct5UuHQN.js";
import {
  j as r,
  G as i,
  d as m,
  b as n,
  z as l,
  Z as d,
  U as p,
  _ as c,
  S as u,
  a0 as f,
  I as k,
  h,
  V as w,
} from "./vendor-DHo7BzsC.js";
import { _ as v } from "./Flex-BpAU42l_.js";
import { N as _ } from "./Icon-BkVA54F2.js";
import { _ as g } from "./Input-BbH8ts9k.js";
import "./get-slot-BjAOOWF7.js";
import "./format-length-l2rsThpR.js";
import "./use-locale-BcUKARuA.js";
import "./use-merged-state-mPE1JA5r.js";
const j = { class: "modal-box" },
  x = { class: "title-bar" },
  L = { class: "mb-4" },
  y = o(
    r({
      __name: "index",
      setup(o) {
        const r = a();
        let y = i({ shopName: "", remark: "", id: null });
        m(async () => {
          const a = await e.invoke("tool-window-ready", "memo");
          if ((a.token && r.setToken(a.token), a.data)) {
            const e = "string" == typeof a.data ? JSON.parse(a.data) : a.data;
            ((y.shopName = e.shopName), (y.remark = e.remark), (y.id = e.id));
          }
        });
        const N = () => {
            e.send("memo-view-isopen", JSON.stringify({ memoViewshow: !1 }));
          },
          b = () => {
            y.shopName &&
              t({ id: y.id, remark: y.remark }).then(() => {
                (e.postMessage(
                  "update-shop-remark",
                  JSON.stringify({ id: y.id, remark: y.remark }),
                ),
                  N());
              });
          };
        return (
          n(() => {}),
          l(() => {}),
          (a, e) => {
            const t = _,
              o = s,
              r = v,
              i = g;
            return (
              w(),
              d("div", j, [
                p(
                  r,
                  { justify: "space-between", align: "center", class: "mb-4" },
                  {
                    default: u(() => [
                      c("h2", x, "备忘录-" + f(k(y).shopName), 1),
                      p(
                        o,
                        { text: "", onClick: N },
                        {
                          icon: u(() => [
                            p(
                              t,
                              { size: "20" },
                              {
                                default: u(() => [
                                  ...(e[1] ||
                                    (e[1] = [
                                      c(
                                        "svg",
                                        {
                                          xmlns: "http://www.w3.org/2000/svg",
                                          viewBox: "0 0 24 24",
                                        },
                                        [
                                          c("path", {
                                            fill: "currentColor",
                                            d: "M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z",
                                          }),
                                        ],
                                        -1,
                                      ),
                                    ])),
                                ]),
                                _: 1,
                              },
                            ),
                          ]),
                          _: 1,
                        },
                      ),
                    ]),
                    _: 1,
                  },
                ),
                c("div", L, [
                  p(
                    i,
                    {
                      value: k(y).remark,
                      "onUpdate:value": e[0] || (e[0] = (a) => (k(y).remark = a)),
                      clearable: "",
                      type: "textarea",
                      placeholder: "请输入内容",
                      rows: 10,
                      "show-count": "",
                      maxlength: "255",
                    },
                    null,
                    8,
                    ["value"],
                  ),
                ]),
                p(
                  r,
                  { justify: "end", class: "mt-4" },
                  {
                    default: u(() => [
                      p(
                        o,
                        { onClick: N },
                        { default: u(() => [...(e[2] || (e[2] = [h("取消", -1)]))]), _: 1 },
                      ),
                      p(
                        o,
                        { type: "primary", onClick: b },
                        { default: u(() => [...(e[3] || (e[3] = [h("保存", -1)]))]), _: 1 },
                      ),
                    ]),
                    _: 1,
                  },
                ),
              ])
            );
          }
        );
      },
    }),
    [["__scopeId", "data-v-2301a6d8"]],
  );
export { y as default };
