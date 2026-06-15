import { $ as s, i as o, d as a } from "./index-Ct5UuHQN.js";
import { u as n } from "./useNaiveUI-B-ed9kcf.js";
import { w as l, k as t, d as e, p as i } from "./wx-CIJpY1kB.js";
import { x as c, t as r } from "./小红书-jZwggzOL.js";
import {
  j as f,
  b as m,
  z as d,
  Z as p,
  _ as u,
  F as b,
  a4 as v,
  V as k,
  a0 as C,
} from "./vendor-DHo7BzsC.js";
const g = { class: "modal-container" },
  x = { class: "content" },
  j = { class: "platform-list" },
  w = { class: "platform-info" },
  _ = ["src", "alt"],
  h = { class: "platform-name" },
  y = { class: "btn-group" },
  $ = ["onClick"],
  A = ["onClick"],
  L = ["onClick"],
  M = a(
    f({
      __name: "onAndOffLine",
      setup(a) {
        const { showMessage: f } = n(),
          M = s(),
          I = ["拼多多", "抖店", "快手", "淘工厂", "视频号", "小红书"],
          T = () => {
            o.postMessage("close-on-and-off-line-modal", !1);
          },
          q = (s, a) => {
            const n = "online" === a ? "上线" : "offline" === a ? "下线" : "忙碌";
            M.info({
              title: "提示",
              content: `确定${n}所有${s}店铺？`,
              positiveText: "确定",
              negativeText: "取消",
              maskClosable: !1,
              onPositiveClick: () => {
                (f.success(`${n}成功，请在左侧店铺检查一遍`),
                  o.postMessage("close-on-and-off-line-modal", { type: s, status: a }));
              },
            });
          };
        return (
          m(() => {
            o.removeAllListeners("show-on-and-off-line-modal");
          }),
          d(() => {
            o.removeAllListeners("show-on-and-off-line-modal");
          }),
          (s, o) => (
            k(),
            p("div", g, [
              u("div", { class: "modal-header" }, [
                o[0] || (o[0] = u("span", null, "店铺状态管理", -1)),
                u("button", { class: "close-btn", onClick: T }, "×"),
              ]),
              u("div", x, [
                u("div", j, [
                  (k(),
                  p(
                    b,
                    null,
                    v(I, (s) => {
                      return u("div", { key: s, class: "platform-item" }, [
                        u("div", w, [
                          u(
                            "img",
                            {
                              src:
                                ((o = s),
                                { 拼多多: i, 抖店: e, 快手: t, 淘工厂: r, 视频号: l, 小红书: c }[
                                  o
                                ]),
                              alt: s,
                              class: "platform-logo",
                            },
                            null,
                            8,
                            _,
                          ),
                          u("span", h, C(s), 1),
                        ]),
                        u("div", y, [
                          u(
                            "button",
                            { class: "btn online-btn", onClick: (o) => q(s, "online") },
                            " 上线 ",
                            8,
                            $,
                          ),
                          u(
                            "button",
                            { class: "btn busy-btn", onClick: (o) => q(s, "busy") },
                            " 忙碌 ",
                            8,
                            A,
                          ),
                          u(
                            "button",
                            { class: "btn offline-btn", onClick: (o) => q(s, "offline") },
                            " 下线 ",
                            8,
                            L,
                          ),
                        ]),
                      ]);
                      var o;
                    }),
                    64,
                  )),
                ]),
                o[1] ||
                  (o[1] = u(
                    "p",
                    { class: "alert-text" },
                    "店铺切换状态后需要在左侧的店铺检查是否切换成功",
                    -1,
                  )),
              ]),
            ])
          )
        );
      },
    }),
    [["__scopeId", "data-v-946305bc"]],
  );
export { M as default };
