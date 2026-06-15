import {
  g as e,
  f as a,
  e as l,
  i as s,
  B as i,
  a1 as o,
  u as t,
  ab as n,
  d,
} from "./index-Ct5UuHQN.js";
import { A as r, _ as u } from "./Add-DzxqObxE.js";
import { u as c } from "./useNaiveUI-B-ed9kcf.js";
import {
  j as v,
  r as p,
  c as y,
  k as m,
  d as g,
  Z as f,
  _ as b,
  U as A,
  R as h,
  X as R,
  S as I,
  h as S,
  I as k,
  a0 as j,
  V as W,
} from "./vendor-DHo7BzsC.js";
import { _ } from "./Tag-DD6D_Gyq.js";
import { N as w } from "./Icon-BkVA54F2.js";
import { _ as C } from "./Avatar-DGwaOewp.js";
import { _ as x } from "./Select-BghgM9ZJ.js";
import { _ as T } from "./Input-BbH8ts9k.js";
import { _ as E } from "./Dropdown-De4FdQJF.js";
import { _ as M } from "./Divider-CDdOMQYZ.js";
import { _ as H } from "./Alert-Ckwi3yVQ.js";
import { _ as L } from "./Switch-B6Z6IYn_.js";
import "./Add-DB3n_hTA.js";
import "./Space-D6L4c5Pi.js";
import "./get-slot-BjAOOWF7.js";
import "./use-locale-BcUKARuA.js";
import "./use-merged-state-mPE1JA5r.js";
import "./_commonjsHelpers-Dvrxj_Zk.js";
import "./format-length-l2rsThpR.js";
import "./utils-CPcGhtGy.js";
import "./Popover-Z03uJL-I.js";
import "./get-BluUyD2c.js";
import "./cssr-fugg8Rje.js";
import "./use-compitable-BbI6cQbC.js";
import "./attribute-Cap6sGiE.js";
import "./VirtualList-CHeV0Vz3.js";
import "./create-D0sloWoF.js";
import "./Empty-BURlTLhl.js";
const z = { class: "modal-container" },
  F = { class: "modal-content" },
  U = { class: "modal-header" },
  B = { class: "header-main" },
  N = { class: "modal-body" },
  O = { key: 0, class: "shop-info-card" },
  $ = { class: "shop-info-text" },
  G = { class: "shop-name" },
  D = { class: "shop-platform" },
  J = { class: "config-sections" },
  P = { class: "config-section" },
  V = { class: "section-body" },
  X = { class: "section-tip" },
  Z = { key: 0 },
  q = { key: 1 },
  K = { class: "config-section" },
  Y = { class: "section-body" },
  Q = { class: "config-section" },
  ee = { class: "section-body" },
  ae = { class: "config-section" },
  le = { class: "section-header" },
  se = { class: "section-actions" },
  ie = { class: "section-body" },
  oe = { class: "config-section" },
  te = { class: "section-body" },
  ne = { key: 0, class: "sub-config" },
  de = { class: "modal-footer" },
  re = { class: "config-switch" },
  ue = { class: "footer-buttons" },
  ce = d(
    v({
      __name: "index",
      setup(d) {
        const { showMessage: v } = c(),
          ce = e(),
          ve = a(),
          pe = l(),
          ye = p(0),
          me = p(null),
          ge = p(!1),
          fe = p({
            isEnabled: !1,
            aiReplyStrategy: "AI_RGA",
            aiHumanReplyType: 0,
            subAccount: "",
            aiSensitiveWords: [],
            aiReplyFlag: "",
            aiWorkMode: 0,
          }),
          be = () => {
            var e;
            return {
              isEnabled: !1,
              aiReplyStrategy: ve.aiReplyConfig.aiReplyStrategy || "AI_RGA",
              aiHumanReplyType: ve.aiReplyConfig.aiHumanReplyType ?? 0,
              subAccount: (null == (e = me.value) ? void 0 : e.subAccountInfo) || "",
              aiSensitiveWords: [...(ve.aiReplyConfig.aiSensitiveWords || [])],
              aiReplyFlag: ve.aiReplyConfig.aiReplyFlag || ".",
              aiWorkMode: ve.aiReplyConfig.aiWorkMode ?? 0,
            };
          },
          Ae = ["视频号", "淘工厂"],
          he = y(() => {
            var e;
            return Ae.includes((null == (e = me.value) ? void 0 : e.platformType) || "");
          }),
          Re = y(() => [
            { label: "弹窗提示（推荐）", value: 0 },
            { label: "直接转接到指定子账号", value: 1 },
            { label: "仅做星标标记", value: 2, disabled: he.value },
          ]),
          Ie = (e) => {
            const a = be(),
              l = Number((null == e ? void 0 : e.aiHumanReplyType) ?? a.aiHumanReplyType);
            return {
              isEnabled: Boolean(null == e ? void 0 : e.isEnabled),
              aiReplyStrategy: (null == e ? void 0 : e.aiReplyStrategy) ?? a.aiReplyStrategy,
              aiHumanReplyType: he.value && 2 === l ? 0 : l,
              subAccount: (null == e ? void 0 : e.subAccount) ?? a.subAccount,
              aiSensitiveWords: Array.isArray(null == e ? void 0 : e.aiSensitiveWords)
                ? [...e.aiSensitiveWords]
                : [...a.aiSensitiveWords],
              aiReplyFlag: (null == e ? void 0 : e.aiReplyFlag) ?? a.aiReplyFlag,
              aiWorkMode: (null == e ? void 0 : e.aiWorkMode) ?? a.aiWorkMode,
            };
          },
          Se = {
            afterSales: {
              name: "售后服务",
              keywords: ["退货", "退款", "换货", "发错货", "少发", "破损", "退差价", "申请售后"],
            },
            complaint: {
              name: "投诉相关",
              keywords: ["投诉", "差评", "举报", "骗人", "欺诈", "虚假宣传", "态度差", "不满意"],
            },
          },
          ke = y(() =>
            Object.entries(Se).map(([e, a]) => ({
              key: e,
              label: a.name,
              children: [
                {
                  key: `${e}-preview`,
                  type: "render",
                  render: () =>
                    m("div", { style: { padding: "8px 12px", maxWidth: "300px" } }, [
                      m(
                        "div",
                        { style: { fontSize: "12px", color: "#666", marginBottom: "6px" } },
                        "包含关键词：",
                      ),
                      m(
                        "div",
                        { style: { display: "flex", flexWrap: "wrap", gap: "4px" } },
                        a.keywords.map((e) =>
                          m(_, { size: "small", type: "info", bordered: !1 }, { default: () => e }),
                        ),
                      ),
                    ]),
                },
                { key: `${e}-add`, label: `✓ 添加这组关键词（${a.keywords.length}个）` },
              ],
            })),
          ),
          je = (e) => {
            if (e.endsWith("-add")) {
              const a = e.replace("-add", ""),
                l = Se[a];
              if (l) {
                Array.isArray(fe.value.aiSensitiveWords) || (fe.value.aiSensitiveWords = []);
                const e = l.keywords.filter((e) => !fe.value.aiSensitiveWords.includes(e));
                (fe.value.aiSensitiveWords.push(...e), v.success(`已添加 ${e.length} 个关键词`));
              }
            }
          },
          We = () => {
            var e;
            const a = (null == (e = fe.value.aiSensitiveWords) ? void 0 : e.length) || 0;
            ((fe.value.aiSensitiveWords = []), v.success(`已清空 ${a} 个关键词`));
          },
          _e = async () => {
            const e = fe.value.isEnabled;
            if (!e || 1 !== fe.value.aiHumanReplyType || fe.value.subAccount.trim()) {
              if (ye.value) {
                ge.value = !0;
                try {
                  fe.value.isEnabled = e;
                  const a = [
                    {
                      shopId: ye.value,
                      userId: pe.userInfo.userId,
                      configType: 2,
                      configContent: JSON.stringify({
                        isEnabled: e,
                        aiReplyStrategy: fe.value.aiReplyStrategy,
                        aiHumanReplyType: fe.value.aiHumanReplyType,
                        subAccount: fe.value.subAccount || "",
                        aiSensitiveWords: t.deepClone(fe.value.aiSensitiveWords || []),
                        aiReplyFlag: fe.value.aiReplyFlag || ".",
                        aiWorkMode: fe.value.aiWorkMode,
                      }),
                    },
                  ];
                  await n(a);
                  const l = { ...fe.value };
                  ((ce.singleShopAiReplyConfig[ye.value] = l),
                    s.postMessage("save-single-shop-ai-config", {
                      shopId: ye.value,
                      config: t.deepClone(l),
                    }),
                    me.value && (me.value.subAccountInfo = fe.value.subAccount || ""),
                    v.success("保存成功"),
                    we());
                } catch (a) {
                  ((fe.value.isEnabled = !e), v.error("保存失败，请稍后重试"));
                } finally {
                  ge.value = !1;
                }
              }
            } else v.error("请输入子账号昵称");
          },
          we = () => {
            s.postMessage("close-shop-human-reply-modal", !1);
          };
        g(async () => {
          const e = await s.invoke("tool-window-ready", "SingleShopHumanReply");
          if ((e.token && (pe.setToken(e.token), await pe.getUserInfo().catch(() => {})), e.data)) {
            const a = "string" == typeof e.data ? JSON.parse(e.data) : e.data;
            ((me.value = a.shop),
              (ye.value = a.shop.id),
              await (async (e) => {
                try {
                  const a = await o({
                      configType: 2,
                      userId: pe.userInfo.userId,
                      shopId: ye.value,
                    }),
                    l =
                      (null == a ? void 0 : a.configContent) && "string" == typeof a.configContent
                        ? JSON.parse(a.configContent)
                        : null,
                    s = Ie(l),
                    i = l && "object" == typeof l && ("isEnabled" in l || "isEnabled" in l);
                  fe.value = {
                    ...s,
                    isEnabled: i ? s.isEnabled : Boolean((null == e ? void 0 : e.isEnabled) ?? !0),
                  };
                } catch (a) {
                  fe.value = e ? Ie(e) : be();
                }
                ce.singleShopAiReplyConfig[ye.value] = { ...fe.value };
              })(a.config));
          }
        });
        const Ce = (e) => {
          const a = "string" == typeof e ? Number(e) : e;
          he.value && 2 === a && (fe.value.aiHumanReplyType = 0);
        };
        return (e, a) => {
          const l = i,
            s = C,
            o = x,
            t = T,
            n = E,
            d = M,
            c = u,
            v = H,
            p = L;
          return (
            W(),
            f("div", z, [
              b("div", F, [
                b("div", U, [
                  b("div", B, [
                    a[8] || (a[8] = b("h2", { class: "title-bar" }, "单店AI设置", -1)),
                    fe.value && fe.value.isEnabled
                      ? (W(),
                        h(
                          k(_),
                          { key: 0, bordered: !1, type: "success", size: "small" },
                          { default: I(() => [...(a[7] || (a[7] = [S(" 已启用 ", -1)]))]), _: 1 },
                        ))
                      : R("", !0),
                  ]),
                  A(
                    l,
                    { text: "", class: "close-btn", onClick: we },
                    {
                      icon: I(() => [
                        A(
                          k(w),
                          { size: "18" },
                          {
                            default: I(() => [
                              ...(a[9] ||
                                (a[9] = [
                                  b(
                                    "svg",
                                    { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24" },
                                    [
                                      b("path", {
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
                b("div", N, [
                  me.value
                    ? (W(),
                      f("div", O, [
                        A(
                          s,
                          { size: 52, src: me.value.loginUrl || me.value.platformLogo, round: "" },
                          null,
                          8,
                          ["src"],
                        ),
                        b("div", $, [
                          b("div", G, j(me.value.shopName), 1),
                          b("div", D, j(me.value.platformType), 1),
                        ]),
                      ]))
                    : R("", !0),
                  b("div", J, [
                    b("div", P, [
                      a[10] ||
                        (a[10] = b(
                          "div",
                          { class: "section-header" },
                          [b("div", { class: "section-title" }, "AI工作流模型")],
                          -1,
                        )),
                      b("div", V, [
                        A(
                          o,
                          {
                            value: fe.value.aiWorkMode,
                            "onUpdate:value": a[0] || (a[0] = (e) => (fe.value.aiWorkMode = e)),
                            options: [
                              { label: "[默认] AI工作流模型", value: 0 },
                              { label: "[Beta版] AI工作流模型", value: 1 },
                            ],
                            placeholder: "请选择AI回复模式",
                          },
                          null,
                          8,
                          ["value"],
                        ),
                        b("div", X, [
                          1 == fe.value.aiWorkMode
                            ? (W(),
                              f(
                                "span",
                                Z,
                                "AI回复将以线上先行Beta版(先行测试体验版)模型进行回复(功能上有稍许差异,功能更先进,稳定性稍微比正式版稍低)",
                              ))
                            : (W(), f("span", q, "AI回复将以线上稳定版模型进行回复(更加稳定可靠)")),
                        ]),
                      ]),
                    ]),
                    b("div", K, [
                      a[12] ||
                        (a[12] = b(
                          "div",
                          { class: "section-header" },
                          [b("div", { class: "section-title" }, "AI回复模式")],
                          -1,
                        )),
                      b("div", Y, [
                        A(
                          o,
                          {
                            value: fe.value.aiReplyStrategy,
                            "onUpdate:value":
                              a[1] || (a[1] = (e) => (fe.value.aiReplyStrategy = e)),
                            options: [
                              { label: "AI全自动接待", value: "AI_RGA" },
                              { label: "AI人机协同", value: "AI_RGA_FILTER" },
                            ],
                            placeholder: "请选择AI回复模式",
                          },
                          null,
                          8,
                          ["value"],
                        ),
                        a[11] ||
                          (a[11] = b(
                            "div",
                            { class: "section-tip" },
                            [
                              b("strong", null, "AI全自动接待："),
                              S("AI 会根据客户的消息进行回复"),
                              b("br"),
                              b("strong", null, "AI人机协同："),
                              S("AI 会根据客户的消息进行回复，如果 AI 无法回答，则转接到人工客服 "),
                            ],
                            -1,
                          )),
                      ]),
                    ]),
                    b("div", Q, [
                      a[13] ||
                        (a[13] = b(
                          "div",
                          { class: "section-header" },
                          [
                            b("div", { class: "section-title" }, "AI回复标识符"),
                            b(
                              "div",
                              { class: "section-desc" },
                              " AI每次回复都会在内容前加上这个标识符 ",
                            ),
                          ],
                          -1,
                        )),
                      b("div", ee, [
                        A(
                          t,
                          {
                            value: fe.value.aiReplyFlag,
                            "onUpdate:value": a[2] || (a[2] = (e) => (fe.value.aiReplyFlag = e)),
                            placeholder: "请输入AI回复标识符",
                            clearable: "",
                            style: { width: "200px" },
                          },
                          null,
                          8,
                          ["value"],
                        ),
                      ]),
                    ]),
                    b("div", ae, [
                      b("div", le, [
                        a[16] || (a[16] = b("div", { class: "section-title" }, "关键词转人工", -1)),
                        b("div", se, [
                          A(
                            n,
                            { trigger: "click", options: ke.value, onSelect: je },
                            {
                              default: I(() => [
                                A(
                                  l,
                                  { size: "small", type: "primary", text: "" },
                                  {
                                    icon: I(() => [
                                      A(k(w), null, { default: I(() => [A(k(r))]), _: 1 }),
                                    ]),
                                    default: I(() => [a[14] || (a[14] = S(" 添加预设词组 ", -1))]),
                                    _: 1,
                                  },
                                ),
                              ]),
                              _: 1,
                            },
                            8,
                            ["options"],
                          ),
                          A(d, { vertical: "" }),
                          A(
                            l,
                            {
                              size: "small",
                              type: "error",
                              text: "",
                              disabled:
                                !fe.value.aiSensitiveWords ||
                                0 === fe.value.aiSensitiveWords.length,
                              onClick: We,
                            },
                            {
                              default: I(() => [...(a[15] || (a[15] = [S(" 一键清空 ", -1)]))]),
                              _: 1,
                            },
                            8,
                            ["disabled"],
                          ),
                        ]),
                      ]),
                      b("div", ie, [
                        A(
                          c,
                          {
                            value: fe.value.aiSensitiveWords,
                            "onUpdate:value":
                              a[3] || (a[3] = (e) => (fe.value.aiSensitiveWords = e)),
                            type: "primary",
                            class: "keyword-tags",
                          },
                          {
                            trigger: I(({ activate: e, disabled: s }) => [
                              A(
                                l,
                                {
                                  size: "small",
                                  type: "info",
                                  dashed: "",
                                  disabled: s,
                                  onClick: (a) => e(),
                                },
                                {
                                  icon: I(() => [
                                    A(k(w), null, { default: I(() => [A(k(r))]), _: 1 }),
                                  ]),
                                  default: I(() => [a[17] || (a[17] = S(" 添加关键词 ", -1))]),
                                  _: 1,
                                },
                                8,
                                ["disabled", "onClick"],
                              ),
                            ]),
                            _: 1,
                          },
                          8,
                          ["value"],
                        ),
                      ]),
                    ]),
                    b("div", oe, [
                      a[19] ||
                        (a[19] = b(
                          "div",
                          { class: "section-header" },
                          [
                            b("div", { class: "section-title" }, [
                              S(" 转人工方式 "),
                              b(
                                "span",
                                { class: "section-title-hint" },
                                " (视频号，淘工厂无星标，默认弹窗展示) ",
                              ),
                            ]),
                          ],
                          -1,
                        )),
                      b("div", te, [
                        A(
                          o,
                          {
                            value: fe.value.aiHumanReplyType,
                            "onUpdate:value": [
                              a[4] || (a[4] = (e) => (fe.value.aiHumanReplyType = e)),
                              Ce,
                            ],
                            options: Re.value,
                            placeholder: "请选择转人工方式",
                          },
                          null,
                          8,
                          ["value", "options"],
                        ),
                        1 === fe.value.aiHumanReplyType
                          ? (W(),
                            f("div", ne, [
                              a[18] ||
                                (a[18] = b("div", { class: "sub-config-label" }, "子账号昵称", -1)),
                              A(
                                t,
                                {
                                  value: fe.value.subAccount,
                                  "onUpdate:value":
                                    a[5] || (a[5] = (e) => (fe.value.subAccount = e)),
                                  placeholder: "请输入子账号昵称",
                                  clearable: "",
                                  onChange: Ce,
                                },
                                null,
                                8,
                                ["value"],
                              ),
                            ]))
                          : R("", !0),
                      ]),
                    ]),
                  ]),
                  A(
                    v,
                    { type: "warning", bordered: !1, class: "warning-alert" },
                    {
                      default: I(() => [
                        ...(a[20] ||
                          (a[20] = [
                            b(
                              "span",
                              { class: "warning-text" },
                              " 单店AI设置优先级高于全局设置。开启后，该店铺的AI回复和转人工将使用此配置，而不使用全局配置。 ",
                              -1,
                            ),
                          ])),
                      ]),
                      _: 1,
                    },
                  ),
                ]),
                b("div", de, [
                  b("div", re, [
                    a[21] || (a[21] = b("span", { class: "switch-label" }, "启用配置", -1)),
                    A(
                      p,
                      {
                        value: fe.value.isEnabled,
                        "onUpdate:value": a[6] || (a[6] = (e) => (fe.value.isEnabled = e)),
                        size: "medium",
                      },
                      null,
                      8,
                      ["value"],
                    ),
                  ]),
                  b("div", ue, [
                    A(
                      l,
                      { onClick: we },
                      { default: I(() => [...(a[22] || (a[22] = [S("取消", -1)]))]), _: 1 },
                    ),
                    A(
                      l,
                      { type: "primary", loading: ge.value, onClick: _e },
                      { default: I(() => [...(a[23] || (a[23] = [S(" 保存配置 ", -1)]))]), _: 1 },
                      8,
                      ["loading"],
                    ),
                  ]),
                ]),
              ]),
            ])
          );
        };
      },
    }),
    [["__scopeId", "data-v-05d39bc0"]],
  );
export { ce as default };
