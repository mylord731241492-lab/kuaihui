import {
  e as a,
  i as e,
  B as l,
  V as s,
  c as i,
  b5 as t,
  bl as c,
  b6 as r,
  b7 as o,
  d as n,
} from "./index-Ct5UuHQN.js";
import { Q as u } from "./browser-BoMzA0it.js";
import { u as v } from "./useNaiveUI-B-ed9kcf.js";
import {
  j as d,
  r as m,
  c as p,
  d as f,
  z as L,
  Z as y,
  _ as g,
  U as h,
  h as C,
  S as A,
  a0 as w,
  X as _,
  V as k,
  F as b,
  a4 as M,
  E as x,
  R as z,
  x as V,
} from "./vendor-DHo7BzsC.js";
import { N as E } from "./Icon-BkVA54F2.js";
import { b as S, _ as B } from "./Tabs-D6a5U_fy.js";
import { _ as H } from "./Spin-liNla5t4.js";
import "./_commonjsHelpers-Dvrxj_Zk.js";
import "./format-length-l2rsThpR.js";
import "./Add-DB3n_hTA.js";
import "./cssr-fugg8Rje.js";
import "./use-compitable-BbI6cQbC.js";
import "./use-merged-state-mPE1JA5r.js";
const I = { class: "recharge-container" },
  N = { class: "window-header draggable-area" },
  R = { class: "title" },
  T = { class: "main-content" },
  Z = { class: "header-card" },
  D = { class: "header-content" },
  U = { class: "title-section" },
  j = { class: "main-title" },
  O = { class: "user-info-card" },
  Y = { class: "expire-section" },
  q = { class: "expire-value" },
  P = { class: "tabs-container" },
  $ = { class: "tab-content" },
  F = { class: "section-header" },
  G = { class: "section-title" },
  K = { class: "package-grid" },
  W = ["onClick"],
  Q = { key: 0, class: "recommended-badge" },
  X = { class: "package-header" },
  J = { class: "package-name" },
  aa = { class: "package-price" },
  ea = { class: "amount" },
  la = { class: "package-desc" },
  sa = { class: "package-features" },
  ia = { class: "feature-item" },
  ta = { class: "feature-item" },
  ca = { key: 0, class: "payment-section" },
  ra = { class: "payment-header" },
  oa = { class: "payment-title" },
  na = { class: "payment-methods" },
  ua = { class: "payment-icon" },
  va = { class: "payment-check" },
  da = { class: "payment-icon" },
  ma = { class: "payment-check" },
  pa = { class: "order-summary" },
  fa = { class: "summary-content" },
  La = { class: "summary-item" },
  ya = { class: "value" },
  ga = { class: "summary-item" },
  ha = { class: "value" },
  Ca = { class: "summary-item total" },
  Aa = { class: "value price" },
  wa = { class: "tab-content" },
  _a = { class: "section-header" },
  ka = { class: "section-title" },
  ba = { class: "ai-power-grid" },
  Ma = ["onClick"],
  xa = { key: 0, class: "recommended-badge" },
  za = { class: "ai-power-header" },
  Va = { class: "ai-power-name" },
  Ea = { class: "ai-power-tokens" },
  Sa = { class: "ai-power-price" },
  Ba = { class: "amount" },
  Ha = { class: "ai-power-desc" },
  Ia = { key: 0, class: "payment-section" },
  Na = { class: "payment-header" },
  Ra = { class: "payment-title" },
  Ta = { class: "payment-methods" },
  Za = { class: "payment-icon" },
  Da = { class: "payment-check" },
  Ua = { class: "payment-icon" },
  ja = { class: "payment-check" },
  Oa = { class: "order-summary" },
  Ya = { class: "summary-content" },
  qa = { class: "summary-item" },
  Pa = { class: "value" },
  $a = { class: "summary-item" },
  Fa = { class: "value" },
  Ga = { class: "summary-item total" },
  Ka = { class: "value price" },
  Wa = { class: "qr-code-content" },
  Qa = { class: "qr-code-container" },
  Xa = { class: "payment-info-section" },
  Ja = { class: "payment-amount" },
  ae = { class: "amount-value" },
  ee = { class: "payment-tips" },
  le = { class: "tip-item" },
  se = { class: "tip-item" },
  ie = { class: "payment-status" },
  te = { class: "modal-footer" },
  ce = n(
    d({
      __name: "index",
      setup(n) {
        const { showMessage: d, showNotification: ce } = v(),
          re = a(),
          oe = m("package"),
          ne = m([]),
          ue = m(null),
          ve = m(1),
          de = m(!1),
          me = m(null),
          pe = m(1),
          fe = m(!1),
          Le = m(!1),
          ye = m(null),
          ge = m(""),
          he = m(0),
          Ce = m(null),
          Ae = m("package"),
          we = m(null),
          _e = m(!1),
          ke = m([]),
          be = p(() => re.userInfo),
          Me = (a) =>
            ({
              月卡: "30天使用期限",
              季卡: "90天使用期限",
              年卡: "365天使用期限",
              体验卡: "7天使用期限",
            })[a] || "套餐说明",
          xe = () => {
            e.postMessage("close-recharge-window");
          },
          ze = () => (1 === ("package" === Ae.value ? ve.value : pe.value) ? "微信" : "支付宝"),
          Ve = async (a) => {
            if (ye.value)
              try {
                await u.toCanvas(ye.value, a, {
                  width: 200,
                  margin: 1,
                  color: { dark: "#000000", light: "#ffffff" },
                });
              } catch (e) {
                d.error("二维码生成失败");
              }
          },
          Ee = async () => {
            ge.value && (await Ve(ge.value));
          },
          Se = () => {
            ((Le.value = !1),
              (_e.value = !0),
              we.value && (clearTimeout(we.value), (we.value = null)));
          },
          Be = () => {
            ((ge.value = ""),
              (he.value = 0),
              (Ce.value = null),
              (_e.value = !1),
              we.value && (clearTimeout(we.value), (we.value = null)));
          },
          He = (a) => "SUCCESS" === a || "TRADE_SUCCESS" === a || "TRADE_FINISHED" === a,
          Ie = (a) => ["REFUND", "CLOSED", "REVOKED", "PAYERROR", "TRADE_CLOSED"].includes(a),
          Ne = (a) => ["NOTPAY", "USERPAYING", "WAIT_BUYER_PAY"].includes(a),
          Re = (a) =>
            ({
              SUCCESS: "支付成功",
              REFUND: "转入退款",
              NOTPAY: "未支付",
              CLOSED: "已关闭",
              REVOKED: "已撤销",
              USERPAYING: "用户支付中",
              PAYERROR: "支付失败",
              WAIT_BUYER_PAY: "等待买家付款",
              TRADE_CLOSED: "交易已关闭",
              TRADE_SUCCESS: "交易支付成功",
              TRADE_FINISHED: "交易结束",
            })[a] || a,
          Te = async () => {
            if (ue.value) {
              (Be(), (de.value = !0));
              try {
                const a = await t({ money: ue.value.dictValue, type: ve.value });
                a.url &&
                  ((ge.value = a.url),
                  (he.value = Number(ue.value.dictValue)),
                  (Ce.value = a.orderId),
                  (Ae.value = "package"),
                  (Le.value = !0),
                  await V(),
                  await Ve(a.url),
                  De(a.orderId));
              } catch (a) {
                d.error("支付失败，请重试");
              } finally {
                de.value = !1;
              }
            } else d.warning("请选择套餐");
          },
          Ze = async () => {
            if (me.value) {
              (Be(), (fe.value = !0));
              try {
                const a = await t({ aiconfigId: me.value.id, type: pe.value });
                a.url &&
                  ((ge.value = a.url),
                  (he.value = Number(me.value.aiMoney)),
                  (Ce.value = a.orderId),
                  (Ae.value = "ai"),
                  (Le.value = !0),
                  await V(),
                  await Ve(a.url),
                  Ue(a.orderId));
              } catch (a) {
                d.error("购买失败，请重试");
              } finally {
                fe.value = !1;
              }
            } else d.warning("请选择AI算力套餐");
          },
          De = async (a) => {
            _e.value = !1;
            let e = 0;
            const l = async () => {
              if (!_e.value) {
                if (e >= 30) return (d.warning("支付超时，请手动确认支付状态"), void Se());
                try {
                  const s = await o(a);
                  if (_e.value) return;
                  const i = s || s.tradeState;
                  He(i)
                    ? (Se(),
                      ce.success("支付成功", "套餐已激活"),
                      await re.getUserInfo(),
                      (ue.value = null),
                      Be())
                    : Ie(i)
                      ? (Se(), d.error(`支付失败：${Re(i)}`), Be())
                      : (Ne(i), e++, _e.value || (we.value = setTimeout(l, 3e3)));
                } catch (s) {
                  if (_e.value) return;
                  (e++, _e.value || (we.value = setTimeout(l, 3e3)));
                }
              }
            };
            l();
          },
          Ue = async (a) => {
            _e.value = !1;
            let e = 0;
            const l = async () => {
              if (!_e.value) {
                if (e >= 30) return (d.warning("支付超时，请手动确认支付状态"), void Se());
                try {
                  const s = await o(a);
                  if (_e.value) return;
                  const i = s.tradeState || s;
                  He(i)
                    ? (Se(),
                      ce.success(
                        "AI算力购买成功",
                        `已为您充值 ${(me.value.aiNum || 0).toLocaleString()} Token`,
                      ),
                      await re.getUserInfo(),
                      (me.value = null),
                      Be())
                    : Ie(i)
                      ? (Se(), d.error(`支付失败：${Re(i)}`), Be())
                      : (Ne(i), e++, _e.value || (we.value = setTimeout(l, 3e3)));
                } catch (s) {
                  if (_e.value) return;
                  (e++, _e.value || (we.value = setTimeout(l, 3e3)));
                }
              }
            };
            l();
          },
          je = async () => {
            try {
              const a = await c();
              ne.value = a;
              const e = await r();
              ke.value = e;
            } catch (a) {
              d.error("加载套餐列表失败");
            }
          };
        return (
          f(async () => {
            (e.on("set-token", async (a, e) => {
              e && ((re.token = e), await re.getUserInfo(), je());
            }),
              re.token && (await re.getUserInfo(), je()));
          }),
          L(() => {
            Be();
          }),
          (a, e) => {
            const t = E,
              c = l,
              r = S,
              o = B,
              n = H,
              u = s,
              v = i;
            return (
              k(),
              y("div", I, [
                g("div", N, [
                  g("div", R, [
                    h(
                      t,
                      { size: "16", color: "#1677ff", style: { "margin-right": "8px" } },
                      {
                        default: A(() => [
                          ...(e[6] ||
                            (e[6] = [
                              g(
                                "svg",
                                { viewBox: "0 0 24 24" },
                                [
                                  g("path", {
                                    fill: "currentColor",
                                    d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
                                  }),
                                ],
                                -1,
                              ),
                            ])),
                        ]),
                        _: 1,
                      },
                    ),
                    e[7] || (e[7] = C(" 充值中心 ", -1)),
                  ]),
                  h(
                    c,
                    {
                      size: "tiny",
                      quaternary: "",
                      circle: "",
                      class: "close-button",
                      onClick: xe,
                    },
                    {
                      icon: A(() => [
                        h(t, null, {
                          default: A(() => [
                            ...(e[8] ||
                              (e[8] = [
                                g(
                                  "svg",
                                  { viewBox: "0 0 24 24" },
                                  [
                                    g("path", {
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
                g("div", T, [
                  g("div", Z, [
                    g("div", D, [
                      g("div", U, [
                        g("h1", j, [
                          h(
                            t,
                            { size: "24", color: "#1677ff", style: { "margin-right": "12px" } },
                            {
                              default: A(() => [
                                ...(e[9] ||
                                  (e[9] = [
                                    g(
                                      "svg",
                                      { viewBox: "0 0 24 24" },
                                      [
                                        g("path", {
                                          fill: "currentColor",
                                          d: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
                                        }),
                                      ],
                                      -1,
                                    ),
                                  ])),
                              ]),
                              _: 1,
                            },
                          ),
                          e[10] || (e[10] = C(" 充值中心 ", -1)),
                        ]),
                        e[11] ||
                          (e[11] = g(
                            "p",
                            { class: "subtitle" },
                            "选择合适的套餐，享受更好的服务体验",
                            -1,
                          )),
                      ]),
                      g("div", O, [
                        g("div", Y, [
                          e[12] || (e[12] = g("div", { class: "expire-label" }, "到期时间", -1)),
                          g(
                            "div",
                            q,
                            w(
                              ((d = be.value.expireTime),
                              d ? new Date(d).toLocaleDateString() : "暂无"),
                            ),
                            1,
                          ),
                        ]),
                      ]),
                    ]),
                  ]),
                  g("div", P, [
                    h(
                      o,
                      {
                        value: oe.value,
                        "onUpdate:value": e[4] || (e[4] = (a) => (oe.value = a)),
                        class: "custom-tabs",
                        type: "line",
                        animated: "",
                      },
                      {
                        default: A(() => [
                          h(
                            r,
                            { name: "package", tab: "套餐购买" },
                            {
                              default: A(() => [
                                g("div", $, [
                                  g("div", F, [
                                    g("h2", G, [
                                      h(
                                        t,
                                        {
                                          size: "20",
                                          color: "#1677ff",
                                          style: { "margin-right": "8px" },
                                        },
                                        {
                                          default: A(() => [
                                            ...(e[13] ||
                                              (e[13] = [
                                                g(
                                                  "svg",
                                                  { viewBox: "0 0 24 24" },
                                                  [
                                                    g("path", {
                                                      fill: "currentColor",
                                                      d: "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z",
                                                    }),
                                                  ],
                                                  -1,
                                                ),
                                              ])),
                                          ]),
                                          _: 1,
                                        },
                                      ),
                                      e[14] || (e[14] = C(" 选择套餐 ", -1)),
                                    ]),
                                    e[15] ||
                                      (e[15] = g(
                                        "p",
                                        { class: "section-desc" },
                                        "选择最适合您需求的套餐方案",
                                        -1,
                                      )),
                                  ]),
                                  g("div", K, [
                                    (k(!0),
                                    y(
                                      b,
                                      null,
                                      M(ne.value, (a) => {
                                        var l;
                                        return (
                                          k(),
                                          y(
                                            "div",
                                            {
                                              key: a.dictCode,
                                              class: x([
                                                "package-card",
                                                {
                                                  active:
                                                    (null == (l = ue.value)
                                                      ? void 0
                                                      : l.dictCode) === a.dictCode,
                                                  recommended: "季卡" === a.dictLabel,
                                                },
                                              ]),
                                              onClick: (e) =>
                                                ((a) => {
                                                  ue.value = a;
                                                })(a),
                                            },
                                            [
                                              "季卡" === a.dictLabel
                                                ? (k(),
                                                  y("div", Q, [
                                                    h(
                                                      t,
                                                      { size: "12", color: "#fff" },
                                                      {
                                                        default: A(() => [
                                                          ...(e[16] ||
                                                            (e[16] = [
                                                              g(
                                                                "svg",
                                                                { viewBox: "0 0 24 24" },
                                                                [
                                                                  g("path", {
                                                                    fill: "currentColor",
                                                                    d: "M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.46,13.97L5.82,21L12,17.27Z",
                                                                  }),
                                                                ],
                                                                -1,
                                                              ),
                                                            ])),
                                                        ]),
                                                        _: 1,
                                                      },
                                                    ),
                                                    e[17] || (e[17] = C(" 推荐 ", -1)),
                                                  ]))
                                                : _("", !0),
                                              g("div", X, [
                                                g("div", J, w(a.dictLabel), 1),
                                                g("div", aa, [
                                                  e[18] ||
                                                    (e[18] = g(
                                                      "span",
                                                      { class: "currency" },
                                                      "¥",
                                                      -1,
                                                    )),
                                                  g("span", ea, w(a.dictValue), 1),
                                                ]),
                                              ]),
                                              g("div", la, w(Me(a.dictLabel)), 1),
                                              g("div", sa, [
                                                g("div", ia, [
                                                  h(
                                                    t,
                                                    { size: "14", color: "#52c41a" },
                                                    {
                                                      default: A(() => [
                                                        ...(e[19] ||
                                                          (e[19] = [
                                                            g(
                                                              "svg",
                                                              { viewBox: "0 0 24 24" },
                                                              [
                                                                g("path", {
                                                                  fill: "currentColor",
                                                                  d: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
                                                                }),
                                                              ],
                                                              -1,
                                                            ),
                                                          ])),
                                                      ]),
                                                      _: 1,
                                                    },
                                                  ),
                                                  e[20] ||
                                                    (e[20] = g("span", null, "全功能访问", -1)),
                                                ]),
                                                g("div", ta, [
                                                  h(
                                                    t,
                                                    { size: "14", color: "#52c41a" },
                                                    {
                                                      default: A(() => [
                                                        ...(e[21] ||
                                                          (e[21] = [
                                                            g(
                                                              "svg",
                                                              { viewBox: "0 0 24 24" },
                                                              [
                                                                g("path", {
                                                                  fill: "currentColor",
                                                                  d: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
                                                                }),
                                                              ],
                                                              -1,
                                                            ),
                                                          ])),
                                                      ]),
                                                      _: 1,
                                                    },
                                                  ),
                                                  e[22] ||
                                                    (e[22] = g("span", null, "24/7 技术支持", -1)),
                                                ]),
                                              ]),
                                            ],
                                            10,
                                            W,
                                          )
                                        );
                                      }),
                                      128,
                                    )),
                                  ]),
                                  ue.value
                                    ? (k(),
                                      y("div", ca, [
                                        g("div", ra, [
                                          g("h3", oa, [
                                            h(
                                              t,
                                              {
                                                size: "18",
                                                color: "#1677ff",
                                                style: { "margin-right": "8px" },
                                              },
                                              {
                                                default: A(() => [
                                                  ...(e[23] ||
                                                    (e[23] = [
                                                      g(
                                                        "svg",
                                                        { viewBox: "0 0 24 24" },
                                                        [
                                                          g("path", {
                                                            fill: "currentColor",
                                                            d: "M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.11,4 20,4Z",
                                                          }),
                                                        ],
                                                        -1,
                                                      ),
                                                    ])),
                                                ]),
                                                _: 1,
                                              },
                                            ),
                                            e[24] || (e[24] = C(" 选择支付方式 ", -1)),
                                          ]),
                                        ]),
                                        g("div", na, [
                                          g(
                                            "div",
                                            {
                                              class: x([
                                                "payment-method",
                                                { active: 1 === ve.value },
                                              ]),
                                              onClick: e[0] || (e[0] = (a) => (ve.value = 1)),
                                            },
                                            [
                                              g("div", ua, [
                                                h(
                                                  t,
                                                  { size: "24", color: "#09bb07" },
                                                  {
                                                    default: A(() => [
                                                      ...(e[25] ||
                                                        (e[25] = [
                                                          g(
                                                            "svg",
                                                            { viewBox: "0 0 1024 1024" },
                                                            [
                                                              g("path", {
                                                                fill: "currentColor",
                                                                d: "M690.1 377.4c5.9 0 11.8.2 17.6.5-24.4-128.7-158.3-227.1-319.9-227.1C209 150.8 64 271.4 64 420.2c0 81.1 43.6 154.2 111.9 203.6a21.5 21.5 0 0 1 9.1 17.6c0 2.4-.5 4.6-1.1 6.9-5.5 20.3-14.2 52.8-14.2 52.8s-.1.3-.1.3c-.7 2.8-.9 5.4-.9 7.9 0 11.9 9.7 21.5 21.5 21.5 2.6 0 5.1-.5 7.4-1.3l52.8-14.2c.8-.2 1.5-.3 2.3-.3 7.2 0 13.6 3.7 17.2 9.4 48.6 77.8 132.1 130.2 228.7 130.2 29.1 0 57.3-4.4 83.9-12.9l37.9 10.2c2.3.8 4.8 1.3 7.4 1.3 11.9 0 21.5-9.6 21.5-21.5 0-2.5-.2-5.1-.9-7.9 0 0 0-.1-.1-.2l-14.2-52.8c-.6-2.3-1.1-4.5-1.1-6.9 0-7.2 3.7-13.6 9.4-17.4 68.5-77.9 110.1-178.2 110.1-286.6 0-14.3-.8-28.5-2.4-42.5z",
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
                                              e[27] ||
                                                (e[27] = g(
                                                  "div",
                                                  { class: "payment-info" },
                                                  [
                                                    g("div", { class: "payment-name" }, "微信支付"),
                                                    g(
                                                      "div",
                                                      { class: "payment-desc" },
                                                      "安全便捷，支持微信扫码支付",
                                                    ),
                                                  ],
                                                  -1,
                                                )),
                                              g("div", va, [
                                                1 === ve.value
                                                  ? (k(),
                                                    z(
                                                      t,
                                                      { key: 0, size: "18", color: "#1677ff" },
                                                      {
                                                        default: A(() => [
                                                          ...(e[26] ||
                                                            (e[26] = [
                                                              g(
                                                                "svg",
                                                                { viewBox: "0 0 24 24" },
                                                                [
                                                                  g("path", {
                                                                    fill: "currentColor",
                                                                    d: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
                                                                  }),
                                                                ],
                                                                -1,
                                                              ),
                                                            ])),
                                                        ]),
                                                        _: 1,
                                                      },
                                                    ))
                                                  : _("", !0),
                                              ]),
                                            ],
                                            2,
                                          ),
                                          g(
                                            "div",
                                            {
                                              class: x([
                                                "payment-method",
                                                { active: 2 === ve.value },
                                              ]),
                                              onClick: e[1] || (e[1] = (a) => (ve.value = 2)),
                                            },
                                            [
                                              g("div", da, [
                                                h(
                                                  t,
                                                  { size: "24", color: "#1677ff" },
                                                  {
                                                    default: A(() => [
                                                      ...(e[28] ||
                                                        (e[28] = [
                                                          g(
                                                            "svg",
                                                            { viewBox: "0 0 1024 1024" },
                                                            [
                                                              g("path", {
                                                                fill: "currentColor",
                                                                d: "M256 124.48A124.48 124.48 0 0 0 131.52 249.024V774.976A124.48 124.48 0 0 0 256 899.52h512a124.48 124.48 0 0 0 124.48-124.544V249.024A124.48 124.48 0 0 0 768 124.48H256z m0-64h512a188.48 188.48 0 0 1 188.48 188.544V774.976A188.48 188.48 0 0 1 768 963.52H256a188.48 188.48 0 0 1-188.48-188.544V249.024A188.48 188.48 0 0 1 256 60.48z",
                                                              }),
                                                              g("path", {
                                                                fill: "currentColor",
                                                                d: "M512 704a192 192 0 1 0 0-384 192 192 0 0 0 0 384zm0 64a256 256 0 1 1 0-512 256 256 0 0 1 0 512z",
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
                                              e[30] ||
                                                (e[30] = g(
                                                  "div",
                                                  { class: "payment-info" },
                                                  [
                                                    g("div", { class: "payment-name" }, "支付宝"),
                                                    g(
                                                      "div",
                                                      { class: "payment-desc" },
                                                      " 快速支付，支持支付宝扫码支付 ",
                                                    ),
                                                  ],
                                                  -1,
                                                )),
                                              g("div", ma, [
                                                2 === ve.value
                                                  ? (k(),
                                                    z(
                                                      t,
                                                      { key: 0, size: "18", color: "#1677ff" },
                                                      {
                                                        default: A(() => [
                                                          ...(e[29] ||
                                                            (e[29] = [
                                                              g(
                                                                "svg",
                                                                { viewBox: "0 0 24 24" },
                                                                [
                                                                  g("path", {
                                                                    fill: "currentColor",
                                                                    d: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
                                                                  }),
                                                                ],
                                                                -1,
                                                              ),
                                                            ])),
                                                        ]),
                                                        _: 1,
                                                      },
                                                    ))
                                                  : _("", !0),
                                              ]),
                                            ],
                                            2,
                                          ),
                                        ]),
                                        g("div", pa, [
                                          e[34] ||
                                            (e[34] = g(
                                              "div",
                                              { class: "summary-header" },
                                              [g("h4", null, "订单详情")],
                                              -1,
                                            )),
                                          g("div", fa, [
                                            g("div", La, [
                                              e[31] ||
                                                (e[31] = g(
                                                  "span",
                                                  { class: "label" },
                                                  "套餐名称",
                                                  -1,
                                                )),
                                              g("span", ya, w(ue.value.dictLabel), 1),
                                            ]),
                                            g("div", ga, [
                                              e[32] ||
                                                (e[32] = g(
                                                  "span",
                                                  { class: "label" },
                                                  "有效期",
                                                  -1,
                                                )),
                                              g("span", ha, w(Me(ue.value.dictLabel)), 1),
                                            ]),
                                            g("div", Ca, [
                                              e[33] ||
                                                (e[33] = g(
                                                  "span",
                                                  { class: "label" },
                                                  "支付金额",
                                                  -1,
                                                )),
                                              g("span", Aa, "¥" + w(ue.value.dictValue), 1),
                                            ]),
                                          ]),
                                        ]),
                                        h(
                                          c,
                                          {
                                            type: "primary",
                                            size: "large",
                                            class: "pay-button",
                                            loading: de.value,
                                            onClick: Te,
                                          },
                                          {
                                            icon: A(() => [
                                              h(t, null, {
                                                default: A(() => [
                                                  ...(e[35] ||
                                                    (e[35] = [
                                                      g(
                                                        "svg",
                                                        { viewBox: "0 0 24 24" },
                                                        [
                                                          g("path", {
                                                            fill: "currentColor",
                                                            d: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
                                                          }),
                                                        ],
                                                        -1,
                                                      ),
                                                    ])),
                                                ]),
                                                _: 1,
                                              }),
                                            ]),
                                            default: A(() => [
                                              C(" 立即支付 ¥" + w(ue.value.dictValue), 1),
                                            ]),
                                            _: 1,
                                          },
                                          8,
                                          ["loading"],
                                        ),
                                      ]))
                                    : _("", !0),
                                ]),
                              ]),
                              _: 1,
                            },
                          ),
                          h(
                            r,
                            { name: "ai-power", tab: "AI算力购买" },
                            {
                              default: A(() => [
                                g("div", wa, [
                                  g("div", _a, [
                                    g("h2", ka, [
                                      h(
                                        t,
                                        {
                                          size: "20",
                                          color: "#1677ff",
                                          style: { "margin-right": "8px" },
                                        },
                                        {
                                          default: A(() => [
                                            ...(e[36] ||
                                              (e[36] = [
                                                g(
                                                  "svg",
                                                  { viewBox: "0 0 24 24" },
                                                  [
                                                    g("path", {
                                                      fill: "currentColor",
                                                      d: "M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z",
                                                    }),
                                                  ],
                                                  -1,
                                                ),
                                              ])),
                                          ]),
                                          _: 1,
                                        },
                                      ),
                                      e[37] || (e[37] = C(" AI算力套餐 ", -1)),
                                    ]),
                                    e[38] ||
                                      (e[38] = g(
                                        "p",
                                        { class: "section-desc" },
                                        "选择AI算力包，享受智能化服务",
                                        -1,
                                      )),
                                  ]),
                                  g("div", ba, [
                                    (k(!0),
                                    y(
                                      b,
                                      null,
                                      M(ke.value, (a) => {
                                        var l;
                                        return (
                                          k(),
                                          y(
                                            "div",
                                            {
                                              key: a.id,
                                              class: x([
                                                "ai-power-card",
                                                {
                                                  active:
                                                    (null == (l = me.value) ? void 0 : l.id) ===
                                                    a.id,
                                                  recommended: "标准套餐" === a.aiConfigName,
                                                },
                                              ]),
                                              onClick: (e) => {
                                                return ((l = a), void (me.value = l));
                                                var l;
                                              },
                                            },
                                            [
                                              "标准套餐" === a.aiConfigName
                                                ? (k(),
                                                  y("div", xa, [
                                                    h(
                                                      t,
                                                      { size: "12", color: "#fff" },
                                                      {
                                                        default: A(() => [
                                                          ...(e[39] ||
                                                            (e[39] = [
                                                              g(
                                                                "svg",
                                                                { viewBox: "0 0 24 24" },
                                                                [
                                                                  g("path", {
                                                                    fill: "currentColor",
                                                                    d: "M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.46,13.97L5.82,21L12,17.27Z",
                                                                  }),
                                                                ],
                                                                -1,
                                                              ),
                                                            ])),
                                                        ]),
                                                        _: 1,
                                                      },
                                                    ),
                                                    e[40] || (e[40] = C(" 推荐 ", -1)),
                                                  ]))
                                                : _("", !0),
                                              g("div", za, [
                                                g("div", Va, w(a.aiConfigName), 1),
                                                g(
                                                  "div",
                                                  Ea,
                                                  w((a.aiNum || 0).toLocaleString()) + " 算力 ",
                                                  1,
                                                ),
                                              ]),
                                              g("div", Sa, [
                                                e[41] ||
                                                  (e[41] = g(
                                                    "span",
                                                    { class: "currency" },
                                                    "¥",
                                                    -1,
                                                  )),
                                                g("span", Ba, w(a.aiMoney), 1),
                                              ]),
                                              g("div", Ha, w(a.remark), 1),
                                            ],
                                            10,
                                            Ma,
                                          )
                                        );
                                      }),
                                      128,
                                    )),
                                  ]),
                                  me.value
                                    ? (k(),
                                      y("div", Ia, [
                                        g("div", Na, [
                                          g("h3", Ra, [
                                            h(
                                              t,
                                              {
                                                size: "18",
                                                color: "#1677ff",
                                                style: { "margin-right": "8px" },
                                              },
                                              {
                                                default: A(() => [
                                                  ...(e[42] ||
                                                    (e[42] = [
                                                      g(
                                                        "svg",
                                                        { viewBox: "0 0 24 24" },
                                                        [
                                                          g("path", {
                                                            fill: "currentColor",
                                                            d: "M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.11,4 20,4Z",
                                                          }),
                                                        ],
                                                        -1,
                                                      ),
                                                    ])),
                                                ]),
                                                _: 1,
                                              },
                                            ),
                                            e[43] || (e[43] = C(" 选择支付方式 ", -1)),
                                          ]),
                                        ]),
                                        g("div", Ta, [
                                          g(
                                            "div",
                                            {
                                              class: x([
                                                "payment-method",
                                                { active: 1 === pe.value },
                                              ]),
                                              onClick: e[2] || (e[2] = (a) => (pe.value = 1)),
                                            },
                                            [
                                              g("div", Za, [
                                                h(
                                                  t,
                                                  { size: "24", color: "#09bb07" },
                                                  {
                                                    default: A(() => [
                                                      ...(e[44] ||
                                                        (e[44] = [
                                                          g(
                                                            "svg",
                                                            { viewBox: "0 0 1024 1024" },
                                                            [
                                                              g("path", {
                                                                fill: "currentColor",
                                                                d: "M690.1 377.4c5.9 0 11.8.2 17.6.5-24.4-128.7-158.3-227.1-319.9-227.1C209 150.8 64 271.4 64 420.2c0 81.1 43.6 154.2 111.9 203.6a21.5 21.5 0 0 1 9.1 17.6c0 2.4-.5 4.6-1.1 6.9-5.5 20.3-14.2 52.8-14.2 52.8s-.1.3-.1.3c-.7 2.8-.9 5.4-.9 7.9 0 11.9 9.7 21.5 21.5 21.5 2.6 0 5.1-.5 7.4-1.3l52.8-14.2c.8-.2 1.5-.3 2.3-.3 7.2 0 13.6 3.7 17.2 9.4 48.6 77.8 132.1 130.2 228.7 130.2 29.1 0 57.3-4.4 83.9-12.9l37.9 10.2c2.3.8 4.8 1.3 7.4 1.3 11.9 0 21.5-9.6 21.5-21.5 0-2.5-.2-5.1-.9-7.9 0 0 0-.1-.1-.2l-14.2-52.8c-.6-2.3-1.1-4.5-1.1-6.9 0-7.2 3.7-13.6 9.4-17.4 68.5-77.9 110.1-178.2 110.1-286.6 0-14.3-.8-28.5-2.4-42.5z",
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
                                              e[46] ||
                                                (e[46] = g(
                                                  "div",
                                                  { class: "payment-info" },
                                                  [
                                                    g("div", { class: "payment-name" }, "微信支付"),
                                                    g(
                                                      "div",
                                                      { class: "payment-desc" },
                                                      "安全便捷，支持微信扫码支付",
                                                    ),
                                                  ],
                                                  -1,
                                                )),
                                              g("div", Da, [
                                                1 === pe.value
                                                  ? (k(),
                                                    z(
                                                      t,
                                                      { key: 0, size: "18", color: "#1677ff" },
                                                      {
                                                        default: A(() => [
                                                          ...(e[45] ||
                                                            (e[45] = [
                                                              g(
                                                                "svg",
                                                                { viewBox: "0 0 24 24" },
                                                                [
                                                                  g("path", {
                                                                    fill: "currentColor",
                                                                    d: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
                                                                  }),
                                                                ],
                                                                -1,
                                                              ),
                                                            ])),
                                                        ]),
                                                        _: 1,
                                                      },
                                                    ))
                                                  : _("", !0),
                                              ]),
                                            ],
                                            2,
                                          ),
                                          g(
                                            "div",
                                            {
                                              class: x([
                                                "payment-method",
                                                { active: 2 === pe.value },
                                              ]),
                                              onClick: e[3] || (e[3] = (a) => (pe.value = 2)),
                                            },
                                            [
                                              g("div", Ua, [
                                                h(
                                                  t,
                                                  { size: "24", color: "#1677ff" },
                                                  {
                                                    default: A(() => [
                                                      ...(e[47] ||
                                                        (e[47] = [
                                                          g(
                                                            "svg",
                                                            { viewBox: "0 0 1024 1024" },
                                                            [
                                                              g("path", {
                                                                fill: "currentColor",
                                                                d: "M256 124.48A124.48 124.48 0 0 0 131.52 249.024V774.976A124.48 124.48 0 0 0 256 899.52h512a124.48 124.48 0 0 0 124.48-124.544V249.024A124.48 124.48 0 0 0 768 124.48H256z m0-64h512a188.48 188.48 0 0 1 188.48 188.544V774.976A188.48 188.48 0 0 1 768 963.52H256a188.48 188.48 0 0 1-188.48-188.544V249.024A188.48 188.48 0 0 1 256 60.48z",
                                                              }),
                                                              g("path", {
                                                                fill: "currentColor",
                                                                d: "M512 704a192 192 0 1 0 0-384 192 192 0 0 0 0 384zm0 64a256 256 0 1 1 0-512 256 256 0 0 1 0 512z",
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
                                              e[49] ||
                                                (e[49] = g(
                                                  "div",
                                                  { class: "payment-info" },
                                                  [
                                                    g("div", { class: "payment-name" }, "支付宝"),
                                                    g(
                                                      "div",
                                                      { class: "payment-desc" },
                                                      " 快速支付，支持支付宝扫码支付 ",
                                                    ),
                                                  ],
                                                  -1,
                                                )),
                                              g("div", ja, [
                                                2 === pe.value
                                                  ? (k(),
                                                    z(
                                                      t,
                                                      { key: 0, size: "18", color: "#1677ff" },
                                                      {
                                                        default: A(() => [
                                                          ...(e[48] ||
                                                            (e[48] = [
                                                              g(
                                                                "svg",
                                                                { viewBox: "0 0 24 24" },
                                                                [
                                                                  g("path", {
                                                                    fill: "currentColor",
                                                                    d: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
                                                                  }),
                                                                ],
                                                                -1,
                                                              ),
                                                            ])),
                                                        ]),
                                                        _: 1,
                                                      },
                                                    ))
                                                  : _("", !0),
                                              ]),
                                            ],
                                            2,
                                          ),
                                        ]),
                                        g("div", Oa, [
                                          e[53] ||
                                            (e[53] = g(
                                              "div",
                                              { class: "summary-header" },
                                              [g("h4", null, "订单详情")],
                                              -1,
                                            )),
                                          g("div", Ya, [
                                            g("div", qa, [
                                              e[50] ||
                                                (e[50] = g(
                                                  "span",
                                                  { class: "label" },
                                                  "套餐名称",
                                                  -1,
                                                )),
                                              g("span", Pa, w(me.value.aiConfigName), 1),
                                            ]),
                                            g("div", $a, [
                                              e[51] ||
                                                (e[51] = g(
                                                  "span",
                                                  { class: "label" },
                                                  "Token数量",
                                                  -1,
                                                )),
                                              g(
                                                "span",
                                                Fa,
                                                w((me.value.aiNum || 0).toLocaleString()) +
                                                  " Token",
                                                1,
                                              ),
                                            ]),
                                            g("div", Ga, [
                                              e[52] ||
                                                (e[52] = g(
                                                  "span",
                                                  { class: "label" },
                                                  "支付金额",
                                                  -1,
                                                )),
                                              g("span", Ka, "¥" + w(me.value.aiMoney), 1),
                                            ]),
                                          ]),
                                        ]),
                                        h(
                                          c,
                                          {
                                            type: "primary",
                                            size: "large",
                                            class: "pay-button",
                                            loading: fe.value,
                                            onClick: Ze,
                                          },
                                          {
                                            icon: A(() => [
                                              h(t, null, {
                                                default: A(() => [
                                                  ...(e[54] ||
                                                    (e[54] = [
                                                      g(
                                                        "svg",
                                                        { viewBox: "0 0 24 24" },
                                                        [
                                                          g("path", {
                                                            fill: "currentColor",
                                                            d: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
                                                          }),
                                                        ],
                                                        -1,
                                                      ),
                                                    ])),
                                                ]),
                                                _: 1,
                                              }),
                                            ]),
                                            default: A(() => [
                                              C(" 立即购买 ¥" + w(me.value.aiMoney), 1),
                                            ]),
                                            _: 1,
                                          },
                                          8,
                                          ["loading"],
                                        ),
                                      ]))
                                    : _("", !0),
                                ]),
                              ]),
                              _: 1,
                            },
                          ),
                        ]),
                        _: 1,
                      },
                      8,
                      ["value"],
                    ),
                  ]),
                ]),
                h(
                  v,
                  {
                    show: Le.value,
                    "onUpdate:show": e[5] || (e[5] = (a) => (Le.value = a)),
                    "mask-closable": !1,
                    "transform-origin": "center",
                    class: "qr-code-modal",
                  },
                  {
                    default: A(() => {
                      return [
                        h(
                          u,
                          {
                            style: { width: "400px" },
                            title:
                              "package" === Ae.value
                                ? `${ze()}支付 - ${null == (a = ue.value) ? void 0 : a.dictLabel}`
                                : `${ze()}支付 - ${null == (l = me.value) ? void 0 : l.aiConfigName}`,
                            bordered: !1,
                            size: "huge",
                            role: "dialog",
                            "aria-modal": "true",
                          },
                          {
                            "header-extra": A(() => [
                              h(
                                c,
                                { quaternary: "", circle: "", onClick: Se },
                                {
                                  icon: A(() => [
                                    h(t, null, {
                                      default: A(() => [
                                        ...(e[55] ||
                                          (e[55] = [
                                            g(
                                              "svg",
                                              { viewBox: "0 0 24 24" },
                                              [
                                                g("path", {
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
                            footer: A(() => [
                              g("div", te, [
                                h(
                                  c,
                                  { quaternary: "", onClick: Se },
                                  {
                                    default: A(() => [
                                      ...(e[61] || (e[61] = [C(" 取消支付 ", -1)])),
                                    ]),
                                    _: 1,
                                  },
                                ),
                                h(
                                  c,
                                  { type: "primary", onClick: Ee },
                                  {
                                    default: A(() => [
                                      ...(e[62] || (e[62] = [C(" 刷新二维码 ", -1)])),
                                    ]),
                                    _: 1,
                                  },
                                ),
                              ]),
                            ]),
                            default: A(() => [
                              g("div", Wa, [
                                g("div", Qa, [
                                  g(
                                    "canvas",
                                    { ref_key: "qrCanvas", ref: ye, class: "qr-code-canvas" },
                                    null,
                                    512,
                                  ),
                                ]),
                                g("div", Xa, [
                                  g("div", Ja, [
                                    e[56] ||
                                      (e[56] = g(
                                        "span",
                                        { class: "amount-label" },
                                        "支付金额",
                                        -1,
                                      )),
                                    g("span", ae, "¥" + w(he.value), 1),
                                  ]),
                                  g("div", ee, [
                                    g("div", le, [
                                      h(
                                        t,
                                        { size: "14", color: "#52c41a" },
                                        {
                                          default: A(() => [
                                            ...(e[57] ||
                                              (e[57] = [
                                                g(
                                                  "svg",
                                                  { viewBox: "0 0 24 24" },
                                                  [
                                                    g("path", {
                                                      fill: "currentColor",
                                                      d: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
                                                    }),
                                                  ],
                                                  -1,
                                                ),
                                              ])),
                                          ]),
                                          _: 1,
                                        },
                                      ),
                                      g("span", null, "请使用" + w(ze()) + "扫码支付", 1),
                                    ]),
                                    g("div", se, [
                                      h(
                                        t,
                                        { size: "14", color: "#52c41a" },
                                        {
                                          default: A(() => [
                                            ...(e[58] ||
                                              (e[58] = [
                                                g(
                                                  "svg",
                                                  { viewBox: "0 0 24 24" },
                                                  [
                                                    g("path", {
                                                      fill: "currentColor",
                                                      d: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
                                                    }),
                                                  ],
                                                  -1,
                                                ),
                                              ])),
                                          ]),
                                          _: 1,
                                        },
                                      ),
                                      e[59] ||
                                        (e[59] = g("span", null, "支付完成后会自动跳转", -1)),
                                    ]),
                                  ]),
                                ]),
                                g("div", ie, [
                                  h(
                                    n,
                                    { show: !0, size: "small" },
                                    {
                                      description: A(() => [
                                        ...(e[60] || (e[60] = [C("等待支付中...", -1)])),
                                      ]),
                                      _: 1,
                                    },
                                  ),
                                ]),
                              ]),
                            ]),
                            _: 1,
                          },
                          8,
                          ["title"],
                        ),
                      ];
                      var a, l;
                    }),
                    _: 1,
                  },
                  8,
                  ["show"],
                ),
              ])
            );
            var d;
          }
        );
      },
    }),
    [["__scopeId", "data-v-812b5862"]],
  );
export { ce as default };
