import { f as e, g as s, i as a, u as t } from "./index-Ct5UuHQN.js";
import {
  j as i,
  O as o,
  r as l,
  w as m,
  d as r,
  z as n,
  Z as p,
  _ as d,
  U as g,
  a0 as u,
  I as c,
  S as v,
  V as h,
  E as f,
  X as y,
  F as x,
  x as L,
} from "./vendor-DHo7BzsC.js";
import { _ as M } from "./Flex-BpAU42l_.js";
import { _ as I } from "./Divider-CDdOMQYZ.js";
import { _ as w } from "./VirtualList-DR2OI88f.js";
import { _ as R } from "./Dropdown-De4FdQJF.js";
import "./get-slot-BjAOOWF7.js";
import "./VirtualList-CHeV0Vz3.js";
import "./cssr-fugg8Rje.js";
import "./Popover-Z03uJL-I.js";
import "./get-BluUyD2c.js";
import "./format-length-l2rsThpR.js";
import "./use-merged-state-mPE1JA5r.js";
import "./use-compitable-BbI6cQbC.js";
import "./Icon-BkVA54F2.js";
import "./create-D0sloWoF.js";
const j = { class: "container" },
  T = { class: "header" },
  A = ["onContextmenu"],
  _ = ["onClick"],
  k = { key: 0, class: "ai-to-human-badge" },
  S = { class: "ml-2 flex-1 overflow-hidden" },
  b = { class: "font-bold text-[12px] line-clamp-1" },
  D = { class: "text-[9px] line-clamp-1 bg-gray-500 px-[3px] text-white shrink-0" },
  H = { class: "text-gray-500 text-md line-clamp-1 dark:text-gray-400" },
  C = i({
    __name: "index",
    setup(i) {
      const C = e(),
        E = s(),
        V = o(),
        z = l(!1);
      Array.isArray(E.aiRepliedMessageList) || (E.aiRepliedMessageList = []);
      (a.on("set-theme", (e, s) => {
        C.changeTheme(s);
      }),
        m(
          () => E.aiRepliedMessageList.length,
          (e) => {
            if ((e > 0 && !z.value) || (0 === e && z.value)) {
              const s = e > 0;
              (a.postMessage("toggle-message-window", { platform: "ai", show: s }), (z.value = s));
            }
          },
        ),
        r(() => {
          const e = E.aiRepliedMessageList.length > 0;
          (a.postMessage("toggle-message-window", { platform: "ai", show: e }), (z.value = e));
        }),
        a.on("get-ai-replied-message", (e, s) => {
          const a = E.aiRepliedMessageList.findIndex(
            (e) => e.messageId === s.messageId && e.shopSystemId === s.shopSystemId,
          );
          -1 !== a
            ? (E.aiRepliedMessageList[a].content = s.content)
            : ((s.timeout = Math.floor(Date.now() / 1e3) + 100), E.aiRepliedMessageList.push(s));
        }),
        a.on("reply-customer-message", (e, s) => {
          E.aiRepliedMessageList = E.aiRepliedMessageList.filter(
            (e) => e.messageId !== s.messageId || e.shopSystemId !== s.shopSystemId,
          );
        }),
        a.on("clear-ai-replied-message", () => {
          E.aiRepliedMessageList = [];
        }),
        a.on("clear-ai-replied-message_by_shopId", (e, s) => {
          E.aiRepliedMessageList = E.aiRepliedMessageList.filter((e) => e.shopSystemId !== s);
        }));
      const X = setInterval(() => {
        Array.isArray(E.aiRepliedMessageList) || (E.aiRepliedMessageList = []);
        E.aiRepliedMessageList.forEach((e) => {
          const s = Math.floor(Date.now() / 1e3),
            a = e.timeout ? e.timeout - s : 100;
          (e.timeout &&
            (a <= 0
              ? ((e.countDown = "已超时"), (e.isTimeout = !0))
              : ((e.countDown = `${a}秒后超时`), (e.isTimeout = !1))),
            E.aiRepliedMessageList.sort((e, s) =>
              e.isAiToHuman && !s.isAiToHuman
                ? -1
                : (!e.isAiToHuman && s.isAiToHuman) || (e.isTimeout && !s.isTimeout)
                  ? 1
                  : !e.isTimeout && s.isTimeout
                    ? -1
                    : e.isTimeout && s.isTimeout
                      ? 0
                      : (e.timeout || 0) - (s.timeout || 0),
            ));
        });
      }, 1e3);
      a.on("clear-message", () => {
        E.aiRepliedMessageList = [];
      });
      (a.on("open-ai-first-reply-message", () => {
        (t.log.info("收到选择第一个消息"),
          E.aiRepliedMessageList.length &&
            a.postMessage("click-customer-message", { ...E.aiRepliedMessageList[0], type: "ai" }));
      }),
        n(() => {
          (clearInterval(X),
            a.removeAllListeners("get-ai-replied-message"),
            a.removeAllListeners("reply-customer-message"),
            a.removeAllListeners("clear-ai-replied-message"),
            a.removeAllListeners("clear-message"),
            a.removeAllListeners("open-ai-first-reply-message"));
        }));
      const q = l(!1),
        F = l(0),
        P = l(0),
        B = l(),
        N = () => {
          (void 0 !== B.value &&
            (a.postMessage("remove-ai-replied-message", {
              messageId: B.value.messageId,
              shopSystemId: B.value.shopSystemId,
            }),
            (E.aiRepliedMessageList = E.aiRepliedMessageList.filter(
              (e) => e.messageId !== B.value.messageId || e.shopSystemId !== B.value.shopSystemId,
            ))),
            (q.value = !1));
        },
        O = () => {
          ((B.value = void 0), (q.value = !1));
        },
        U = l("");
      return (
        V.query.platform && (U.value = V.query.platform),
        (e, s) => {
          const t = M,
            i = I,
            o = w,
            l = R;
          return (
            h(),
            p(
              x,
              null,
              [
                d("div", j, [
                  d("div", T, [
                    d("span", null, "AI已回复的消息-" + u(c(E).aiRepliedMessageList.length), 1),
                  ]),
                  g(
                    o,
                    {
                      class: "flex-1",
                      "item-size": 51,
                      items: c(E).aiRepliedMessageList,
                      trigger: "none",
                    },
                    {
                      default: v(({ item: e }) => [
                        (h(),
                        p(
                          "div",
                          {
                            key: e.username,
                            onContextmenu: (s) => {
                              return (
                                (a = s),
                                (t = e),
                                (q.value = !1),
                                a.preventDefault(),
                                (B.value = t),
                                void L().then(() => {
                                  ((q.value = !0), (F.value = a.clientX), (P.value = a.clientY));
                                })
                              );
                              var a, t;
                            },
                          },
                          [
                            d(
                              "div",
                              {
                                class: f([
                                  "item hover:dark:!bg-[#2E3338E6]",
                                  { "ai-to-human-item": e.isAiToHuman },
                                ]),
                                onClick: (s) =>
                                  ((e) => {
                                    a.postMessage("click-customer-message", { ...e, type: "ai" });
                                  })(e),
                              },
                              [
                                g(
                                  t,
                                  { align: "center", class: "w-full" },
                                  {
                                    default: v(() => [
                                      e.isAiToHuman ? (h(), p("div", k, "人工")) : y("", !0),
                                      d("div", S, [
                                        g(
                                          t,
                                          { align: "center", size: "small", wrap: !1 },
                                          {
                                            default: v(() => [
                                              d("span", b, u(e.username), 1),
                                              d("div", D, u(e.shopName), 1),
                                            ]),
                                            _: 2,
                                          },
                                          1024,
                                        ),
                                        d("p", H, u(e.content), 1),
                                      ]),
                                      d(
                                        "span",
                                        {
                                          class: f([
                                            "text-xs",
                                            e.isTimeout ? "text-orange-400" : "text-red-500",
                                          ]),
                                        },
                                        u(e.countDown),
                                        3,
                                      ),
                                    ]),
                                    _: 2,
                                  },
                                  1024,
                                ),
                              ],
                              10,
                              _,
                            ),
                            g(i, { class: "!py-0 !my-0" }),
                          ],
                          40,
                          A,
                        )),
                      ]),
                      _: 1,
                    },
                    8,
                    ["items"],
                  ),
                ]),
                g(
                  l,
                  {
                    placement: "bottom-start",
                    trigger: "manual",
                    x: F.value,
                    y: P.value,
                    options: [{ label: "删除", key: "delete" }],
                    show: q.value,
                    "on-clickoutside": O,
                    onSelect: N,
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
export { C as default };
