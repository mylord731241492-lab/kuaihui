import {
  j as s,
  r as t,
  b as a,
  d as o,
  Z as i,
  _ as e,
  h as l,
  U as d,
  I as n,
  S as c,
  a2 as r,
  a3 as p,
  V as m,
} from "./vendor-DHo7BzsC.js";
import { i as u, B as v, d as f } from "./index-Ct5UuHQN.js";
import { s as h, i as j } from "./icon-D4an9sg1.js";
import { N as g } from "./Image-C374KhUF.js";
import "./utils-CPcGhtGy.js";
import "./use-locale-BcUKARuA.js";
import "./use-merged-state-mPE1JA5r.js";
import "./Tooltip-DYS7RCZ0.js";
import "./Popover-Z03uJL-I.js";
import "./get-BluUyD2c.js";
import "./cssr-fugg8Rje.js";
import "./format-length-l2rsThpR.js";
import "./use-compitable-BbI6cQbC.js";
import "./download-CfHz9NLm.js";
const x = { class: "guide-fullscreen" },
  w = { class: "pituduh-content" },
  M = { class: "hand-icon" },
  _ = { class: "guide-popover" },
  b = { class: "success-toast" },
  I = { class: "toast-content" },
  y = { class: "toast-text" },
  C = { class: "toast-title" },
  k = { class: "toast-actions" },
  A = f(
    s({
      __name: "index",
      setup(s) {
        const f = t({ left: "875px", top: "13px" }),
          A = (s, t) => {
            const a = Math.max(0, window.innerWidth - 90),
              o = Math.max(0, window.innerHeight - 34);
            f.value = {
              left: `${Math.min(Math.max(t.left, 0), a)}px`,
              top: `${Math.min(Math.max(t.top, 0), o)}px`,
            };
          };
        (u.on("update-ai-config-position", A),
          a(() => {
            u.off("update-ai-config-position", A);
          }));
        const B = () => {
            u.send("close-guide-window");
          },
          H = () => {
            u.send("close-guide-window");
          };
        return (
          o(() => {
            u.send("scroll-menu-to-ai-config");
          }),
          (s, t) => (
            m(),
            i("div", x, [
              e("div", { class: "guide-overlay", onClick: H }),
              e(
                "div",
                {
                  class: "pituduh-box",
                  style: p(f.value),
                  onClick: t[0] || (t[0] = r(() => {}, ["stop"])),
                },
                [
                  e("div", w, [
                    e("div", M, [d(n(g), { src: n(h), width: "30" }, null, 8, ["src"])]),
                    t[1] || (t[1] = l(" AI配置 ", -1)),
                  ]),
                  e("div", _, [
                    t[6] || (t[6] = e("div", { class: "guide-popover-arrow" }, null, -1)),
                    e("div", b, [
                      e("div", I, [
                        e("div", y, [
                          e("div", C, [
                            d(n(g), { src: n(j), width: "28" }, null, 8, ["src"]),
                            t[2] || (t[2] = l()),
                            t[3] || (t[3] = e("span", null, "开启Ai成功", -1)),
                          ]),
                          t[4] ||
                            (t[4] = e(
                              "div",
                              { class: "toast-desc" },
                              " 后续如有修改，请到顶部菜单Ai配置里修改 ",
                              -1,
                            )),
                        ]),
                        e("div", k, [
                          d(
                            n(v),
                            { type: "primary", size: "small", onClick: B },
                            { default: c(() => [...(t[5] || (t[5] = [l(" 确认 ", -1)]))]), _: 1 },
                          ),
                        ]),
                      ]),
                    ]),
                  ]),
                ],
                4,
              ),
            ])
          )
        );
      },
    }),
    [["__scopeId", "data-v-b2a13eb2"]],
  );
export { A as default };
