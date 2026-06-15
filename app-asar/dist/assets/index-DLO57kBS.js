import {
  J as t,
  j as i,
  r as o,
  c as n,
  d as s,
  z as e,
  Z as a,
  _ as r,
  B as l,
  U as c,
  X as d,
  S as f,
  I as m,
  a0 as u,
  D as h,
  V as p,
  F as v,
  a4 as y,
  E as w,
  a2 as _,
  h as g,
} from "./vendor-DHo7BzsC.js";
import { i as Y, B as x, d as M } from "./index-Ct5UuHQN.js";
import { r as z, d as k } from "./dayjs.min-D__CVkhT.js";
import { g as C } from "./_commonjsHelpers-Dvrxj_Zk.js";
import { S as L } from "./Scrollbar-DWjbW0E3.js";
import { N as j } from "./Icon-BkVA54F2.js";
import { _ as B } from "./Empty-BURlTLhl.js";
import "./format-length-l2rsThpR.js";
import "./use-locale-BcUKARuA.js";
const b = t("notification", {
  state: () => ({ notifications: [] }),
  getters: {
    count: (t) => t.notifications.length,
    errorCount: (t) => t.notifications.filter((t) => "error" === t.type).length,
    warningCount: (t) => t.notifications.filter((t) => "warning" === t.type).length,
    allNotifications: (t) => t.notifications.sort((t, i) => i.timestamp - t.timestamp),
    notificationsByType: (t) => {
      const i = { info: [], warning: [], error: [], success: [] };
      return (
        t.notifications.forEach((t) => {
          i[t.type].push(t);
        }),
        Object.keys(i).forEach((t) => {
          i[t].sort((t, i) => i.timestamp - t.timestamp);
        }),
        i
      );
    },
  },
  actions: {
    addNotification(t) {
      const i = this.notifications.findIndex((i) => i.content === t.content),
        o = { id: Date.now(), timestamp: Date.now(), ...t };
      i > -1 ? this.notifications.splice(i, 1, o) : this.notifications.unshift(o);
    },
    removeNotification(t) {
      const i = this.notifications.findIndex((i) => i.id === t);
      i > -1 && this.notifications.splice(i, 1);
    },
    removeByType(t) {
      this.notifications = this.notifications.filter((i) => i.type !== t);
    },
    clearAll() {
      this.notifications = [];
    },
  },
});
var D,
  H = { exports: {} };
const S = C(
  D
    ? H.exports
    : ((D = 1),
      (H.exports = function (t, i, o) {
        t = t || {};
        var n = i.prototype,
          s = {
            future: "in %s",
            past: "%s ago",
            s: "a few seconds",
            m: "a minute",
            mm: "%d minutes",
            h: "an hour",
            hh: "%d hours",
            d: "a day",
            dd: "%d days",
            M: "a month",
            MM: "%d months",
            y: "a year",
            yy: "%d years",
          };
        function e(t, i, o, s) {
          return n.fromToBase(t, i, o, s);
        }
        ((o.en.relativeTime = s),
          (n.fromToBase = function (i, n, e, a, r) {
            for (
              var l,
                c,
                d,
                f = e.$locale().relativeTime || s,
                m = t.thresholds || [
                  { l: "s", r: 44, d: "second" },
                  { l: "m", r: 89 },
                  { l: "mm", r: 44, d: "minute" },
                  { l: "h", r: 89 },
                  { l: "hh", r: 21, d: "hour" },
                  { l: "d", r: 35 },
                  { l: "dd", r: 25, d: "day" },
                  { l: "M", r: 45 },
                  { l: "MM", r: 10, d: "month" },
                  { l: "y", r: 17 },
                  { l: "yy", d: "year" },
                ],
                u = m.length,
                h = 0;
              h < u;
              h += 1
            ) {
              var p = m[h];
              p.d && (l = a ? o(i).diff(e, p.d, !0) : e.diff(i, p.d, !0));
              var v = (t.rounding || Math.round)(Math.abs(l));
              if (((d = l > 0), v <= p.r || !p.r)) {
                v <= 1 && h > 0 && (p = m[h - 1]);
                var y = f[p.l];
                (r && (v = r("" + v)),
                  (c = "string" == typeof y ? y.replace("%d", v) : y(v, n, p.l, d)));
                break;
              }
            }
            if (n) return c;
            var w = d ? f.future : f.past;
            return "function" == typeof w ? w(c) : w.replace("%s", c);
          }),
          (n.to = function (t, i) {
            return e(t, i, this, !0);
          }),
          (n.from = function (t, i) {
            return e(t, i, this);
          }));
        var a = function (t) {
          return t.$u ? o.utc() : o();
        };
        ((n.toNow = function (t) {
          return this.to(a(this), t);
        }),
          (n.fromNow = function (t) {
            return this.from(a(this), t);
          }));
      })),
);
var T,
  N = { exports: {} };
T ||
  ((T = 1),
  (N.exports = (function (t) {
    function i(t) {
      return t && "object" == typeof t && "default" in t ? t : { default: t };
    }
    var o = i(t),
      n = {
        name: "zh-cn",
        weekdays: "星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"),
        weekdaysShort: "周日_周一_周二_周三_周四_周五_周六".split("_"),
        weekdaysMin: "日_一_二_三_四_五_六".split("_"),
        months: "一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"),
        monthsShort: "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),
        ordinal: function (t, i) {
          return "W" === i ? t + "周" : t + "日";
        },
        weekStart: 1,
        yearStart: 4,
        formats: {
          LT: "HH:mm",
          LTS: "HH:mm:ss",
          L: "YYYY/MM/DD",
          LL: "YYYY年M月D日",
          LLL: "YYYY年M月D日Ah点mm分",
          LLLL: "YYYY年M月D日ddddAh点mm分",
          l: "YYYY/M/D",
          ll: "YYYY年M月D日",
          lll: "YYYY年M月D日 HH:mm",
          llll: "YYYY年M月D日dddd HH:mm",
        },
        relativeTime: {
          future: "%s内",
          past: "%s前",
          s: "几秒",
          m: "1 分钟",
          mm: "%d 分钟",
          h: "1 小时",
          hh: "%d 小时",
          d: "1 天",
          dd: "%d 天",
          M: "1 个月",
          MM: "%d 个月",
          y: "1 年",
          yy: "%d 年",
        },
        meridiem: function (t, i) {
          var o = 100 * t + i;
          return o < 600
            ? "凌晨"
            : o < 900
              ? "早上"
              : o < 1100
                ? "上午"
                : o < 1300
                  ? "中午"
                  : o < 1800
                    ? "下午"
                    : "晚上";
        },
      };
    return (o.default.locale(n, null, !0), n);
  })(z())));
const V = { class: "notification-container" },
  A = { key: 0, class: "notification-badge" },
  E = { class: "notification-panel" },
  $ = { class: "notification-list" },
  I = { key: 0, class: "empty-state" },
  O = { key: 1, class: "notification-items" },
  F = { class: "type-label" },
  J = { class: "type-count" },
  U = ["onClick"],
  W = { class: "notification-icon-wrapper" },
  X = { key: 0, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
  Z = { key: 1, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
  q = { key: 2, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
  G = { key: 3, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
  K = { class: "notification-content" },
  P = { class: "notification-title" },
  Q = { class: "notification-desc" },
  R = { class: "notification-time" },
  tt = ["onClick"],
  it = { key: 0, class: "notification-footer" },
  ot = { class: "footer-count" },
  nt = M(
    i({
      __name: "index",
      setup(t) {
        (k.extend(S), k.locale("zh-cn"));
        const i = b(),
          M = o(!1),
          z = n(() => {
            const t = { info: [], warning: [], error: [], success: [] };
            return (
              i.notifications.forEach((i) => {
                t[i.type].push(i);
              }),
              Object.keys(t).forEach((i) => {
                t[i].sort((t, i) => i.timestamp - t.timestamp);
              }),
              Object.entries(t)
                .filter(([t, i]) => i.length > 0)
                .sort(([t], [i]) => {
                  const o = { error: 0, warning: 1, success: 2, info: 3 };
                  return o[t] - o[i];
                })
            );
          }),
          C = (t) => ({ error: "错误", warning: "警告", success: "成功", info: "信息" })[t],
          D = () => {
            M.value
              ? (Y.send("notification-collapse"),
                setTimeout(() => {
                  M.value = !1;
                }, 350))
              : ((M.value = !0), Y.send("notification-expand"));
          },
          H = (t) => {
            i.removeNotification(t);
          },
          T = () => {
            i.clearAll();
          };
        return (
          s(() => {
            (Y.on("show-notification", (t, o) => {
              const { type: n, title: s, content: e, meta: a } = o;
              i.addNotification({ type: n, title: s, content: e, meta: a });
            }),
              Y.on("clear-notification", () => {
                (i.clearAll(), (M.value = !1));
              }));
          }),
          e(() => {
            (Y.removeAllListeners("show-notification"), Y.removeAllListeners("clear-notification"));
          }),
          (t, o) => {
            const n = j,
              s = B,
              e = x,
              Y = L;
            return (
              p(),
              a("div", V, [
                r("div", { class: "notification-icon-btn", onClick: D }, [
                  c(
                    n,
                    { size: "20" },
                    {
                      default: f(() => [
                        ...(o[0] ||
                          (o[0] = [
                            r(
                              "svg",
                              {
                                xmlns: "http://www.w3.org/2000/svg",
                                viewBox: "0 0 24 24",
                                fill: "currentColor",
                              },
                              [
                                r("path", {
                                  d: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
                                }),
                              ],
                              -1,
                            ),
                          ])),
                      ]),
                      _: 1,
                    },
                  ),
                  m(i).count > 0
                    ? (p(), a("div", A, u(m(i).count > 99 ? "99+" : m(i).count), 1))
                    : d("", !0),
                ]),
                l(
                  r(
                    "div",
                    E,
                    [
                      r("div", $, [
                        c(
                          Y,
                          { style: { height: "100%" } },
                          {
                            default: f(() => [
                              0 === m(i).count
                                ? (p(),
                                  a("div", I, [c(s, { description: "暂无通知", size: "small" })]))
                                : (p(),
                                  a("div", O, [
                                    (p(!0),
                                    a(
                                      v,
                                      null,
                                      y(
                                        z.value,
                                        ([t, s]) => (
                                          p(),
                                          a("div", { key: t, class: "notification-type-group" }, [
                                            r(
                                              "div",
                                              { class: w(["type-header", `header-${t}`]) },
                                              [
                                                r("span", F, u(C(t)), 1),
                                                r("span", J, "(" + u(s.length) + ")", 1),
                                                c(
                                                  e,
                                                  {
                                                    text: "",
                                                    size: "tiny",
                                                    onClick: _(
                                                      (o) =>
                                                        ((t) => {
                                                          i.removeByType(t);
                                                        })(t),
                                                      ["stop"],
                                                    ),
                                                    class: "type-clear-btn",
                                                  },
                                                  {
                                                    icon: f(() => [
                                                      c(
                                                        n,
                                                        { size: "12" },
                                                        {
                                                          default: f(() => [
                                                            ...(o[1] ||
                                                              (o[1] = [
                                                                r(
                                                                  "svg",
                                                                  {
                                                                    xmlns:
                                                                      "http://www.w3.org/2000/svg",
                                                                    viewBox: "0 0 24 24",
                                                                    fill: "currentColor",
                                                                  },
                                                                  [
                                                                    r("path", {
                                                                      d: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
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
                                                    default: f(() => [
                                                      o[2] || (o[2] = g(" 清空 ", -1)),
                                                    ]),
                                                    _: 1,
                                                  },
                                                  8,
                                                  ["onClick"],
                                                ),
                                              ],
                                              2,
                                            ),
                                            (p(!0),
                                            a(
                                              v,
                                              null,
                                              y(s, (t) => {
                                                return (
                                                  p(),
                                                  a(
                                                    "div",
                                                    {
                                                      key: t.id,
                                                      class: w([
                                                        "notification-item",
                                                        `type-${t.type}`,
                                                      ]),
                                                      onClick: (i) => H(t.id),
                                                    },
                                                    [
                                                      r("div", W, [
                                                        r(
                                                          "div",
                                                          {
                                                            class: w([
                                                              "icon-box",
                                                              `icon-${t.type}`,
                                                            ]),
                                                          },
                                                          [
                                                            c(
                                                              n,
                                                              { size: "14" },
                                                              {
                                                                default: f(() => [
                                                                  "error" === t.type
                                                                    ? (p(),
                                                                      a("svg", X, [
                                                                        ...(o[3] ||
                                                                          (o[3] = [
                                                                            r(
                                                                              "path",
                                                                              {
                                                                                d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
                                                                              },
                                                                              null,
                                                                              -1,
                                                                            ),
                                                                          ])),
                                                                      ]))
                                                                    : "warning" === t.type
                                                                      ? (p(),
                                                                        a("svg", Z, [
                                                                          ...(o[4] ||
                                                                            (o[4] = [
                                                                              r(
                                                                                "path",
                                                                                {
                                                                                  d: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
                                                                                },
                                                                                null,
                                                                                -1,
                                                                              ),
                                                                            ])),
                                                                        ]))
                                                                      : "success" === t.type
                                                                        ? (p(),
                                                                          a("svg", q, [
                                                                            ...(o[5] ||
                                                                              (o[5] = [
                                                                                r(
                                                                                  "path",
                                                                                  {
                                                                                    d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
                                                                                  },
                                                                                  null,
                                                                                  -1,
                                                                                ),
                                                                              ])),
                                                                          ]))
                                                                        : (p(),
                                                                          a("svg", G, [
                                                                            ...(o[6] ||
                                                                              (o[6] = [
                                                                                r(
                                                                                  "path",
                                                                                  {
                                                                                    d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
                                                                                  },
                                                                                  null,
                                                                                  -1,
                                                                                ),
                                                                              ])),
                                                                          ])),
                                                                ]),
                                                                _: 2,
                                                              },
                                                              1024,
                                                            ),
                                                          ],
                                                          2,
                                                        ),
                                                      ]),
                                                      r("div", K, [
                                                        r("div", P, u(t.title), 1),
                                                        r("div", Q, u(t.content), 1),
                                                        r(
                                                          "div",
                                                          R,
                                                          u(((i = t.timestamp), k(i).fromNow())),
                                                          1,
                                                        ),
                                                      ]),
                                                      r(
                                                        "div",
                                                        {
                                                          class: "notification-close",
                                                          onClick: _((i) => H(t.id), ["stop"]),
                                                        },
                                                        [
                                                          c(
                                                            n,
                                                            { size: "12" },
                                                            {
                                                              default: f(() => [
                                                                ...(o[7] ||
                                                                  (o[7] = [
                                                                    r(
                                                                      "svg",
                                                                      {
                                                                        xmlns:
                                                                          "http://www.w3.org/2000/svg",
                                                                        viewBox: "0 0 24 24",
                                                                        fill: "currentColor",
                                                                      },
                                                                      [
                                                                        r("path", {
                                                                          d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
                                                                        }),
                                                                      ],
                                                                      -1,
                                                                    ),
                                                                  ])),
                                                              ]),
                                                              _: 1,
                                                            },
                                                          ),
                                                        ],
                                                        8,
                                                        tt,
                                                      ),
                                                    ],
                                                    10,
                                                    U,
                                                  )
                                                );
                                                var i;
                                              }),
                                              128,
                                            )),
                                          ])
                                        ),
                                      ),
                                      128,
                                    )),
                                  ])),
                            ]),
                            _: 1,
                          },
                        ),
                      ]),
                      m(i).count > 0
                        ? (p(),
                          a("div", it, [
                            r("span", ot, u(m(i).count) + " 条通知", 1),
                            c(
                              e,
                              { text: "", size: "tiny", onClick: T, class: "clear-btn" },
                              {
                                icon: f(() => [
                                  c(
                                    n,
                                    { size: "12" },
                                    {
                                      default: f(() => [
                                        ...(o[8] ||
                                          (o[8] = [
                                            r(
                                              "svg",
                                              {
                                                xmlns: "http://www.w3.org/2000/svg",
                                                viewBox: "0 0 24 24",
                                                fill: "currentColor",
                                              },
                                              [
                                                r("path", {
                                                  d: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
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
                                default: f(() => [o[9] || (o[9] = g(" 清空全部 ", -1))]),
                                _: 1,
                              },
                            ),
                          ]))
                        : d("", !0),
                    ],
                    512,
                  ),
                  [[h, M.value]],
                ),
              ])
            );
          }
        );
      },
    }),
    [["__scopeId", "data-v-5a0d3d7d"]],
  );
export { nt as default };
