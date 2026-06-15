import {
  j as e,
  r as t,
  w as s,
  d as o,
  z as a,
  b as l,
  Z as r,
  _ as n,
  U as i,
  a0 as m,
  S as c,
  V as d,
  R as u,
  X as v,
  B as p,
  D as g,
  F as f,
  x as h,
} from "./vendor-DHo7BzsC.js";
import { f as w, i as x } from "./index-Ct5UuHQN.js";
import { u as j } from "./useNaiveUI-B-ed9kcf.js";
import { _ as I } from "./Switch-B6Z6IYn_.js";
import { _ as L } from "./Flex-BpAU42l_.js";
import { _ as y } from "./Avatar-DGwaOewp.js";
import { _ as b } from "./Divider-CDdOMQYZ.js";
import { _ as A } from "./VirtualList-DR2OI88f.js";
import { _ as M } from "./Dropdown-De4FdQJF.js";
import "./use-merged-state-mPE1JA5r.js";
import "./get-slot-BjAOOWF7.js";
import "./utils-CPcGhtGy.js";
import "./Tag-DD6D_Gyq.js";
import "./VirtualList-CHeV0Vz3.js";
import "./cssr-fugg8Rje.js";
import "./Popover-Z03uJL-I.js";
import "./get-BluUyD2c.js";
import "./format-length-l2rsThpR.js";
import "./use-compitable-BbI6cQbC.js";
import "./Icon-BkVA54F2.js";
import "./create-D0sloWoF.js";
const _ = { class: "container" },
  S = { class: "header" },
  k = { class: "flex items-center ml-auto no-drag" },
  D = ["onContextmenu"],
  T = ["onClick"],
  E = { class: "relative flex items-center" },
  z = { class: "ml-2 flex-1 overflow-hidden" },
  C = { class: "text-[12px]" },
  V = { class: "text-[12px] my-1 line-clamp-1" },
  $ = { class: "text-gray-500 text-md line-clamp-1 dark:text-gray-400" },
  U = { class: "text-red-500 text-center" },
  X = { class: "text-[12px]" },
  B = { class: "text-xs" },
  F = e({
    __name: "index",
    setup(e) {
      const { showMessage: F } = j(),
        N = w(),
        P = t([]),
        Z = t(!0),
        q = t(!1);
      (x.on("set-theme", (e, t) => {
        N.changeTheme(t);
      }),
        x.on("remove-todo-item", (e, t) => {
          P.value = P.value.filter((e) => e.orderSn !== t);
        }),
        x.on("get-todo-list", (e, t) => {
          const s = P.value.filter((e) => e.shopSystemId !== t.shopSystemId),
            o = t.list.map((e) => ({ ...t, ...e, countdown: "" })),
            a = new Map();
          (s.forEach((e) => {
            a.set(e.instanceId, e);
          }),
            o.forEach((e) => {
              a.set(e.instanceId, e);
            }),
            (P.value = Array.from(a.values())),
            P.value.sort(
              (e, t) => new Date(e.deadline).getTime() - new Date(t.deadline).getTime(),
            ));
        }),
        x.on("clear-message", () => {
          P.value = [];
        }));
      const R = t(!1),
        Y = t(0),
        G = t(0),
        H = t(),
        J = () => {
          (void 0 !== H.value &&
            (P.value = P.value.filter((e) => e.instanceId !== H.value.instanceId)),
            (R.value = !1));
        },
        K = () => {
          ((H.value = void 0), (R.value = !1));
        },
        Q = {
          active: !1,
          moved: !1,
          startX: 0,
          startY: 0,
          lastX: 0,
          lastY: 0,
        },
        W = (e) => {
          e.button === 0 &&
            ((Q.active = !0),
            (Q.moved = !1),
            (Q.startX = e.screenX),
            (Q.startY = e.screenY),
            (Q.lastX = e.screenX),
            (Q.lastY = e.screenY),
            window.addEventListener("mousemove", ee),
            window.addEventListener("mouseup", te, { once: !0 }),
            e.preventDefault());
        },
        ee = (e) => {
          if (Q.active) {
            const t = e.screenX - Q.lastX,
              s = e.screenY - Q.lastY;
            ((Math.abs(e.screenX - Q.startX) > 3 || Math.abs(e.screenY - Q.startY) > 3) &&
              (Q.moved = !0),
              (Q.lastX = e.screenX),
              (Q.lastY = e.screenY),
              (0 === t && 0 === s) ||
                x.postMessage("move-todo-floating-window", { dx: t, dy: s }));
          }
        },
        te = () => {
          ((Q.active = !1), window.removeEventListener("mousemove", ee));
        },
        se = (e) => {
          Q.moved
            ? (e.preventDefault(), e.stopPropagation(), (Q.moved = !1))
            : (Z.value = !1);
        };
      s(
        () => P.value.length,
        (e) => {
          if ((e > 0 && !q.value) || (0 === e && q.value)) {
            const t = e > 0;
            (x.postMessage("toggle-message-window", { platform: "todo", show: t }), (q.value = t));
          }
        },
      );
      let O = null;
      return (
        o(() => {
          x.send("register-todo-list-window");
          const e = P.value.length > 0;
          (x.postMessage("toggle-message-window", { platform: "todo", show: e }),
            (q.value = e),
            (O = setInterval(() => {
              P.value.forEach((e) => {
                let t = 1e3 * e.deadline - new Date().getTime();
                if (t <= 0) e.countdown = "已超时未处理";
                else {
                  let s = Math.floor(t / 864e5),
                    o = Math.floor((t % 864e5) / 36e5),
                    a = Math.floor((t % 36e5) / 6e4),
                    l = Math.floor((t % 6e4) / 1e3);
                  e.countdown = `${s} 天 ${o} 小时 ${a} 分 ${l} 秒`;
                }
              });
            }, 1e3)));
        }),
        s(Z, (e) => {
          x.postMessage("todoList-collapse", e);
        }),
        a(() => {
          (O && clearInterval(O),
            window.removeEventListener("mousemove", ee),
            window.removeEventListener("mouseup", te),
            x.removeAllListeners("set-theme"),
            x.removeAllListeners("remove-todo-item"),
            x.removeAllListeners("get-todo-list"),
            x.removeAllListeners("clear-message"));
        }),
        l(() => {
          (O && clearInterval(O),
            window.removeEventListener("mousemove", ee),
            window.removeEventListener("mouseup", te),
            x.removeAllListeners("set-theme"),
            x.removeAllListeners("remove-todo-item"),
            x.removeAllListeners("get-todo-list"),
            x.removeAllListeners("clear-message"));
        }),
        (e, t) => {
          const s = I,
            o = y,
            a = L,
            l = b,
            w = A,
            j = M;
          return (
            d(),
            r(
              f,
              null,
              [
                n("div", _, [
                  p(
                    n(
                      "div",
                      {
                        class: "todo-floating-ball no-drag",
                        onMousedown: W,
                        onClick: se,
                      },
                      [
                        t[3] ||
                          (t[3] = n(
                            "span",
                            { class: "todo-floating-title" },
                            [n("b", null, "处理", -1), n("b", null, "工单", -1)],
                            -1,
                          )),
                        n("small", { class: "todo-floating-count" }, m(P.value.length), 1),
                      ],
                    ),
                    [[g, Z.value]],
                  ),
                  p(
                    n("div", S, [
                      n("span", null, m(P.value.length) + "条待处理工单", 1),
                      n("div", k, [
                        n(
                          "button",
                          {
                            class: "todo-collapse-btn",
                            onClick: t[0] || (t[0] = (e) => (Z.value = !0)),
                          },
                          "收起",
                        ),
                      ]),
                    ]),
                    [[g, !Z.value]],
                  ),
                  p(i(
                    w,
                    { class: "flex-1", "item-size": 81, items: P.value, trigger: "none" },
                    {
                      default: c(({ item: e }) => [
                        (d(),
                        r(
                          "div",
                          {
                            key: e.instanceId,
                            onContextmenu: (t) => {
                              return (
                                (s = t),
                                (o = e),
                                (R.value = !1),
                                s.preventDefault(),
                                (H.value = o),
                                void h().then(() => {
                                  ((R.value = !0), (Y.value = s.clientX), (G.value = s.clientY));
                                })
                              );
                              var s, o;
                            },
                          },
                          [
                            n(
                              "div",
                              {
                                class: "item hover:dark:!bg-[#2E3338E6]",
                                onClick: (t) =>
                                  ((e) => {
                                    (x.postMessage("open-todo-list", {
                                      shopId: e.shopSystemId,
                                      Id: e.instanceId,
                                    }),
                                      navigator.clipboard.writeText(e.orderSn).then(
                                        () => {
                                          F.success("订单号已复制到剪贴板");
                                        },
                                        () => {
                                          F.error("复制失败");
                                        },
                                      ));
                                  })(e),
                              },
                              [
                                i(
                                  a,
                                  { align: "center", class: "w-full" },
                                  {
                                    default: c(() => [
                                      n("div", E, [
                                        i(
                                          o,
                                          {
                                            "object-fit": "contain",
                                            size: "large",
                                            round: "",
                                            src: e.shopLogo || e.platformLogo,
                                          },
                                          null,
                                          8,
                                          ["src"],
                                        ),
                                        e.shopLogo
                                          ? (d(),
                                            u(
                                              o,
                                              {
                                                key: 0,
                                                class: "absolute -bottom-1 -right-2",
                                                "object-fit": "contain",
                                                size: 18,
                                                round: "",
                                                src: e.platformLogo,
                                              },
                                              null,
                                              8,
                                              ["src"],
                                            ))
                                          : v("", !0),
                                      ]),
                                      n("div", z, [
                                        n("p", C, m(e.shopName), 1),
                                        n("p", V, m(e.orderSn), 1),
                                        n("p", $, m(e.problemTitle), 1),
                                      ]),
                                      n("div", U, [
                                        p(n("p", X, " 剩余处理时间 ", 512), [
                                          [g, e.countdown && "已超时未处理" !== e.countdown],
                                        ]),
                                        n("p", B, m(e.countdown), 1),
                                      ]),
                                    ]),
                                    _: 2,
                                  },
                                  1024,
                                ),
                              ],
                              8,
                              T,
                            ),
                            i(l, { class: "!py-0 !my-0" }),
                          ],
                          40,
                          D,
                        )),
                      ]),
                      _: 1,
                    },
                    8,
                    ["items"],
                  ), [[g, !Z.value]]),
                ]),
                i(
                  j,
                  {
                    placement: "bottom-start",
                    trigger: "manual",
                    x: Y.value,
                    y: G.value,
                    options: [{ label: "不显示", key: "delete" }],
                    show: R.value,
                    "on-clickoutside": K,
                    onSelect: J,
                  },
                  null,
                  8,
                  ["x", "y", "show"],
                ),
              ],
              64,
            )
          );
        }
      );
    },
  });
export { F as default };
