import { e, i as s, B as a, cC as t, cD as l, d as o } from "./index-Ct5UuHQN.js";
import { u as n } from "./useNaiveUI-B-ed9kcf.js";
import { S as i } from "./Scrollbar-DWjbW0E3.js";
import {
  j as r,
  r as c,
  d as m,
  b as d,
  z as u,
  Z as p,
  U as v,
  _ as g,
  S as y,
  R as f,
  X as b,
  V as k,
  h as _,
  a0 as h,
  F as j,
  a4 as x,
} from "./vendor-DHo7BzsC.js";
import { _ as w } from "./Tag-DD6D_Gyq.js";
import { _ as T } from "./Flex-BpAU42l_.js";
import { _ as C } from "./Spin-liNla5t4.js";
import "./get-slot-BjAOOWF7.js";
import "./use-compitable-BbI6cQbC.js";
const I = { class: "modal-box" },
  S = { class: "mt-5" },
  z = { key: 0, class: "loading-container" },
  A = { key: 1, class: "empty-container" },
  M = { key: 2, class: "message-list-container" },
  F = { class: "message-header" },
  L = { class: "message-title" },
  U = { class: "message-time" },
  q = { class: "message-content" },
  B = { class: "button-container" },
  D = o(
    r({
      __name: "index",
      setup(o) {
        const { showMessage: r } = n(),
          D = e(),
          N = c(!1),
          R = c(!1),
          V = c([]);
        m(async () => {
          const e = await s.invoke("get-user-info");
          ((D.userInfo = e), D.setToken(e.token));
        });
        const X = async () => {
            if (0 !== V.value.length) {
              R.value = !0;
              try {
                const e = V.value.map((e) => e.noticeId);
                (await l(e), r.success("已标记为已读"), Z());
              } catch (e) {
                r.error("标记已读失败，请重试");
              } finally {
                R.value = !1;
              }
            } else Z();
          },
          Z = () => {
            (s.postMessage("close-background-message-modal", null), (V.value = []));
          };
        return (
          s.on("open-background-message-modal", () => {
            (async () => {
              N.value = !0;
              try {
                const e = await t({ noticeType: 2 });
                V.value = e || [];
              } catch (e) {
                (r.error("加载消息列表失败"), (V.value = []));
              } finally {
                N.value = !1;
              }
            })();
          }),
          d(() => {
            s.removeAllListeners("open-background-message-modal");
          }),
          u(() => {
            s.removeAllListeners("open-background-message-modal");
          }),
          (e, s) => {
            const t = w,
              l = T,
              o = C,
              n = a,
              r = i;
            return (
              k(),
              p("div", I, [
                v(
                  l,
                  { justify: "space-between", align: "center" },
                  {
                    default: y(() => [
                      s[0] || (s[0] = g("h2", { class: "title-bar" }, "后台消息通知", -1)),
                      V.value.length > 0
                        ? (k(),
                          f(
                            t,
                            { key: 0, bordered: !1, type: "info", size: "small" },
                            { default: y(() => [_(h(V.value.length) + " 条消息 ", 1)]), _: 1 },
                          ))
                        : b("", !0),
                    ]),
                    _: 1,
                  },
                ),
                g("div", S, [
                  N.value
                    ? (k(),
                      p("div", z, [
                        v(o, { size: "medium" }),
                        s[1] || (s[1] = g("p", { class: "loading-text" }, "加载中...", -1)),
                      ]))
                    : 0 === V.value.length
                      ? (k(),
                        p("div", A, [
                          s[3] || (s[3] = g("p", { class: "empty-text" }, "暂无消息", -1)),
                          v(
                            n,
                            { type: "primary", onClick: Z },
                            { default: y(() => [...(s[2] || (s[2] = [_("关闭", -1)]))]), _: 1 },
                          ),
                        ]))
                      : (k(),
                        p("div", M, [
                          v(
                            r,
                            { style: { "max-height": "400px" } },
                            {
                              default: y(() => [
                                (k(!0),
                                p(
                                  j,
                                  null,
                                  x(
                                    V.value,
                                    (e) => (
                                      k(),
                                      p("div", { key: e.id, class: "message-item" }, [
                                        g("div", F, [
                                          g("span", L, h(e.noticeTitle), 1),
                                          g("span", U, h(e.createTime), 1),
                                        ]),
                                        g("div", q, h(e.noticeContent), 1),
                                      ])
                                    ),
                                  ),
                                  128,
                                )),
                              ]),
                              _: 1,
                            },
                          ),
                          g("div", B, [
                            v(
                              n,
                              { type: "primary", loading: R.value, onClick: X },
                              { default: y(() => [...(s[4] || (s[4] = [_(" 已读 ", -1)]))]), _: 1 },
                              8,
                              ["loading"],
                            ),
                          ]),
                        ])),
                ]),
              ])
            );
          }
        );
      },
    }),
    [["__scopeId", "data-v-202cdb6b"]],
  );
export { D as default };
