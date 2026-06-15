import { g as e, e as a, i as l, B as t, b0 as s, a2 as o, d as i } from "./index-Ct5UuHQN.js";
import { u as n } from "./useNaiveUI-B-ed9kcf.js";
import {
  j as r,
  r as u,
  d as v,
  b as p,
  z as c,
  Z as d,
  _ as m,
  U as f,
  S as h,
  R as g,
  X as y,
  V as w,
  h as b,
} from "./vendor-DHo7BzsC.js";
import { _ as x } from "./Avatar-DGwaOewp.js";
import { _ } from "./Tag-DD6D_Gyq.js";
import { N as z } from "./Icon-BkVA54F2.js";
import { _ as L } from "./Flex-BpAU42l_.js";
import { _ as j, a as B } from "./FormItem-Cbk0HU13.js";
import { _ as S } from "./InputNumber-DBfWk17i.js";
import { _ as C } from "./Switch-B6Z6IYn_.js";
import { _ as I } from "./Alert-Ckwi3yVQ.js";
import { _ as k } from "./Input-BbH8ts9k.js";
import { _ as M } from "./Space-D6L4c5Pi.js";
import "./utils-CPcGhtGy.js";
import "./format-length-l2rsThpR.js";
import "./get-slot-BjAOOWF7.js";
import "./get-BluUyD2c.js";
import "./use-locale-BcUKARuA.js";
import "./use-merged-state-mPE1JA5r.js";
import "./Add-DB3n_hTA.js";
const A = { class: "modal-box" },
  U = { class: "header-bar" },
  E = { key: 1, class: "header-icon" },
  N = { class: "content-area" },
  R = { class: "form-card" },
  T = { class: "form-label" },
  F = { class: "form-card", style: { padding: "15px 20px" } },
  H = { key: 0, class: "form-card" },
  V = { class: "form-label" },
  q = { class: "footer-bar" },
  O = { class: "footer-actions" },
  J = { class: "config-switch" },
  Z = i(
    r({
      __name: "index",
      setup(i, { expose: r }) {
        const { showMessage: Z } = n(),
          D = e(),
          X = a(),
          Y = u(0),
          G = u(),
          K = u(!1),
          P = u(null),
          Q = u({
            status: !1,
            time: 30,
            content: [],
            replyExpirationTime: 60,
            replyFrequency: 3,
            aibtstatus: !1,
          }),
          W = u(""),
          $ = (e) => {
            if (void 0 !== Y.value) {
              const a = { ...Q.value, time: null === e ? 0 : e };
              D.singleShopBottomLineReplyList[Y.value] = a;
            }
          },
          ee = async () => {
            var e;
            const a = Q.value.status,
              t = (W.value || "")
                .split("\n")
                .map((e) => e.trim())
                .filter(Boolean);
            if (((Q.value.content = t), a)) {
              if (!(null == (e = G.value) ? void 0 : e.loginStatus))
                return void Z.error("该店铺未登录");
              if (Q.value.time < 0 || Q.value.time > 180)
                return void Z.error("兜底回复时间必须在0-180之间");
              if ("" === W.value) return void Z.error("兜底回复内容不能为空");
              if (t.length > 3) return void Z.error("兜底回复内容不能超过3条");
            }
            if (Y.value) {
              ((Q.value.status = a), (K.value = !0));
              try {
                await s({
                  id: P.value,
                  type: 3,
                  shopId: Y.value,
                  isEnabled: a,
                  responseContent: W.value,
                  responseSeconds: Q.value.time,
                  saveType: 1,
                  shopIdList: [Y.value],
                  aibtstatus: Q.value.aibtstatus,
                });
                const e = { ...Q.value };
                ((D.singleShopBottomLineReplyList[Y.value] = e),
                  l.postMessage("save-single-shop-fallback-config", {
                    shopId: Y.value,
                    config: JSON.parse(JSON.stringify(e)),
                  }));
              } catch (o) {
                return ((Q.value.status = !a), void Z.error("保存失败，请稍后重试"));
              } finally {
                K.value = !1;
              }
              (Z.success("保存成功"), ae());
            }
          },
          ae = () => {
            (l.postMessage("close-bottom-line-reply-modal", !1),
              (Y.value = 0),
              (W.value = ""),
              (G.value = null));
          };
        r({
          openModal: (e) => {
            ((Y.value = e),
              (() => {
                var e;
                const a =
                  null == (e = D.singleShopBottomLineReplyList[Y.value]) ? void 0 : e.content;
                a && a.length > 0 ? (W.value = a.join("\n")) : (W.value = "");
              })());
          },
          closeModal: ae,
        });
        const le = async (e) => {
          try {
            const a = await o({ type: 3, shopId: Y.value });
            if (a) {
              P.value = "number" == typeof a.id ? a.id : Number(a.id || 0) || null;
              const l = ((e) => (Array.isArray(e) ? e.map((e) => e.trim()).filter(Boolean) : []))(
                a.responseContentList,
              );
              return (
                (Q.value = {
                  status: Boolean(a.isEnabled),
                  time: Number(a.responseSeconds) || 0,
                  content: l,
                  replyExpirationTime: (null == e ? void 0 : e.replyExpirationTime) ?? 60,
                  replyFrequency: (null == e ? void 0 : e.replyFrequency) ?? 3,
                  aibtstatus: Boolean(a.aibtstatus),
                }),
                (W.value = l.join("\n")),
                void (D.singleShopBottomLineReplyList[Y.value] = { ...Q.value })
              );
            }
          } catch (a) {}
          ((P.value = null),
            (Q.value = e
              ? {
                  status: !1,
                  time: 30,
                  content: [],
                  replyExpirationTime: 60,
                  replyFrequency: 3,
                  aibtstatus: !1,
                  ...e,
                }
              : {
                  status: !1,
                  time: 30,
                  content: [],
                  replyExpirationTime: 60,
                  replyFrequency: 3,
                  aibtstatus: !1,
                }),
            (W.value = Array.isArray(Q.value.content) ? Q.value.content.join("\n") : ""),
            (D.singleShopBottomLineReplyList[Y.value] = { ...Q.value }));
        };
        return (
          v(async () => {
            const e = await l.invoke("tool-window-ready", "SingleShopBottomLineReply");
            if ((e.token && (X.setToken(e.token), await X.getUserInfo().catch(() => {})), e.data)) {
              const a = "string" == typeof e.data ? JSON.parse(e.data) : e.data;
              ((G.value = a.shop), (Y.value = a.shop.id), await le(a.shopBottomLineReply));
            }
          }),
          p(() => {}),
          c(() => {}),
          (e, a) => {
            const l = x,
              s = z,
              o = _,
              i = L,
              n = t,
              r = S,
              u = j,
              v = C,
              p = I,
              c = k,
              Z = B,
              D = M;
            return (
              w(),
              d("div", A, [
                m("div", U, [
                  f(
                    i,
                    { align: "center", size: 12 },
                    {
                      default: h(() => {
                        var e, t, i, n;
                        return [
                          (null == (e = G.value) ? void 0 : e.loginUrl) ||
                          (null == (t = G.value) ? void 0 : t.shopLogo)
                            ? (w(),
                              g(
                                l,
                                {
                                  key: 0,
                                  size: 36,
                                  round: "",
                                  src:
                                    (null == (i = G.value) ? void 0 : i.loginUrl) ||
                                    (null == (n = G.value) ? void 0 : n.shopLogo),
                                  class: "shop-avatar",
                                },
                                null,
                                8,
                                ["src"],
                              ))
                            : (w(),
                              d("div", E, [
                                ...(a[4] ||
                                  (a[4] = [
                                    m(
                                      "svg",
                                      {
                                        xmlns: "http://www.w3.org/2000/svg",
                                        viewBox: "0 0 24 24",
                                        width: "20",
                                        height: "20",
                                      },
                                      [
                                        m("path", {
                                          fill: "currentColor",
                                          d: "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z",
                                        }),
                                      ],
                                      -1,
                                    ),
                                  ])),
                              ])),
                          a[7] ||
                            (a[7] = m("h2", { class: "header-title" }, "店铺兜底回复设置", -1)),
                          Q.value && Q.value.status
                            ? (w(),
                              g(
                                o,
                                { key: 2, bordered: !1, type: "success", size: "small", round: "" },
                                {
                                  icon: h(() => [
                                    f(s, null, {
                                      default: h(() => [
                                        ...(a[5] ||
                                          (a[5] = [
                                            m(
                                              "svg",
                                              {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                viewBox: "0 0 24 24",
                                              },
                                              [
                                                m("path", {
                                                  fill: "currentColor",
                                                  d: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
                                                }),
                                              ],
                                              -1,
                                            ),
                                          ])),
                                      ]),
                                      _: 1,
                                    }),
                                  ]),
                                  default: h(() => [a[6] || (a[6] = b(" 已开启 ", -1))]),
                                  _: 1,
                                },
                              ))
                            : y("", !0),
                        ];
                      }),
                      _: 1,
                    },
                  ),
                  f(
                    n,
                    { text: "", class: "close-btn", onClick: ae },
                    {
                      icon: h(() => [
                        f(
                          s,
                          { size: "18" },
                          {
                            default: h(() => [
                              ...(a[8] ||
                                (a[8] = [
                                  m(
                                    "svg",
                                    { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24" },
                                    [
                                      m("path", {
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
                m("div", N, [
                  f(
                    Z,
                    { "label-placement": "top", "show-feedback": !1 },
                    {
                      default: h(() => [
                        m("div", R, [
                          f(u, null, {
                            label: h(() => [
                              m("div", T, [
                                f(
                                  s,
                                  { size: "16", class: "label-icon" },
                                  {
                                    default: h(() => [
                                      ...(a[9] ||
                                        (a[9] = [
                                          m(
                                            "svg",
                                            {
                                              xmlns: "http://www.w3.org/2000/svg",
                                              viewBox: "0 0 24 24",
                                            },
                                            [
                                              m("path", {
                                                fill: "currentColor",
                                                d: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
                                              }),
                                            ],
                                            -1,
                                          ),
                                        ])),
                                    ]),
                                    _: 1,
                                  },
                                ),
                                a[10] || (a[10] = m("span", null, "兜底回复时间", -1)),
                              ]),
                            ]),
                            default: h(() => [
                              f(
                                r,
                                {
                                  value: Q.value.time,
                                  "onUpdate:value": [a[0] || (a[0] = (e) => (Q.value.time = e)), $],
                                  min: 0,
                                  max: 180,
                                  placeholder: "请输入0-180之间的数字",
                                  size: "large",
                                  class: "time-input",
                                },
                                {
                                  prefix: h(() => [
                                    ...(a[11] ||
                                      (a[11] = [
                                        m("span", { class: "input-prefix" }, "收到消息后剩余", -1),
                                      ])),
                                  ]),
                                  suffix: h(() => [
                                    ...(a[12] ||
                                      (a[12] = [
                                        m("span", { class: "input-suffix" }, "秒回复", -1),
                                      ])),
                                  ]),
                                  _: 1,
                                },
                                8,
                                ["value"],
                              ),
                            ]),
                            _: 1,
                          }),
                        ]),
                        m("div", F, [
                          m("div", null, [
                            a[13] ||
                              (a[13] = m(
                                "span",
                                {
                                  style: {
                                    "font-size": "14px",
                                    "font-weight": "600",
                                    color: "#262626",
                                  },
                                },
                                "是否启用AI兜底回复   ",
                                -1,
                              )),
                            f(
                              v,
                              {
                                value: Q.value.aibtstatus,
                                "onUpdate:value": a[1] || (a[1] = (e) => (Q.value.aibtstatus = e)),
                                size: "small",
                              },
                              null,
                              8,
                              ["value"],
                            ),
                          ]),
                          f(
                            p,
                            { type: "warning", style: { "margin-top": "20px" }, bordered: !1 },
                            {
                              default: h(() => [
                                ...(a[14] ||
                                  (a[14] = [
                                    m(
                                      "span",
                                      { style: { color: "#ffb651", "font-size": "12px" } },
                                      " 到达预设时间之后，将使用AI进行回复（开启之后，AI进行回复将消耗一定算力） ",
                                      -1,
                                    ),
                                  ])),
                              ]),
                              _: 1,
                            },
                          ),
                        ]),
                        Q.value.aibtstatus
                          ? y("", !0)
                          : (w(),
                            d("div", H, [
                              f(u, null, {
                                label: h(() => [
                                  m("div", V, [
                                    f(
                                      s,
                                      { size: "16", class: "label-icon" },
                                      {
                                        default: h(() => [
                                          ...(a[15] ||
                                            (a[15] = [
                                              m(
                                                "svg",
                                                {
                                                  xmlns: "http://www.w3.org/2000/svg",
                                                  viewBox: "0 0 24 24",
                                                },
                                                [
                                                  m("path", {
                                                    fill: "currentColor",
                                                    d: "M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z",
                                                  }),
                                                ],
                                                -1,
                                              ),
                                            ])),
                                        ]),
                                        _: 1,
                                      },
                                    ),
                                    a[16] || (a[16] = m("span", null, "回复内容", -1)),
                                  ]),
                                ]),
                                default: h(() => [
                                  f(
                                    c,
                                    {
                                      value: W.value,
                                      "onUpdate:value": a[2] || (a[2] = (e) => (W.value = e)),
                                      type: "textarea",
                                      placeholder: "请输入回复内容，一行代表一个回复（最多3条）",
                                      rows: 6,
                                      size: "large",
                                      "show-count": "",
                                      maxlength: "500",
                                      class: "content-textarea",
                                    },
                                    null,
                                    8,
                                    ["value"],
                                  ),
                                ]),
                                _: 1,
                              }),
                            ])),
                        f(
                          p,
                          { type: "info", bordered: !1, class: "info-alert" },
                          {
                            icon: h(() => [
                              f(s, null, {
                                default: h(() => [
                                  ...(a[17] ||
                                    (a[17] = [
                                      m(
                                        "svg",
                                        {
                                          xmlns: "http://www.w3.org/2000/svg",
                                          viewBox: "0 0 24 24",
                                        },
                                        [
                                          m("path", {
                                            fill: "currentColor",
                                            d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
                                          }),
                                        ],
                                        -1,
                                      ),
                                    ])),
                                ]),
                                _: 1,
                              }),
                            ]),
                            default: h(() => [
                              a[18] ||
                                (a[18] = b(
                                  " 店铺兜底回复优先级高于全局兜底回复，开启后将覆盖全局设置。 ",
                                  -1,
                                )),
                            ]),
                            _: 1,
                          },
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                ]),
                m("div", q, [
                  m("div", O, [
                    m("div", J, [
                      a[19] || (a[19] = m("span", { class: "switch-label" }, "启用配置   ", -1)),
                      f(
                        v,
                        {
                          value: Q.value.status,
                          "onUpdate:value": a[3] || (a[3] = (e) => (Q.value.status = e)),
                          size: "medium",
                        },
                        null,
                        8,
                        ["value"],
                      ),
                    ]),
                    f(
                      D,
                      { size: 12, justify: "end" },
                      {
                        default: h(() => [
                          f(
                            n,
                            { size: "large", class: "action-btn", onClick: ae },
                            { default: h(() => [...(a[20] || (a[20] = [b(" 取消 ", -1)]))]), _: 1 },
                          ),
                          f(
                            n,
                            {
                              type: "primary",
                              size: "large",
                              loading: K.value,
                              class: "action-btn primary-btn",
                              onClick: ee,
                            },
                            {
                              default: h(() => [...(a[21] || (a[21] = [b(" 保存配置 ", -1)]))]),
                              _: 1,
                            },
                            8,
                            ["loading"],
                          ),
                        ]),
                        _: 1,
                      },
                    ),
                  ]),
                ]),
              ])
            );
          }
        );
      },
    }),
    [["__scopeId", "data-v-849e1808"]],
  );
export { Z as default };
