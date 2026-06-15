import {
  j as e,
  r as a,
  c as l,
  d as o,
  b as t,
  z as s,
  Z as i,
  _ as n,
  U as u,
  a0 as d,
  B as r,
  a5 as v,
  S as c,
  h as m,
  X as p,
  R as g,
  V as f,
  a6 as h,
  F as y,
  a4 as I,
} from "./vendor-DHo7BzsC.js";
import { e as w, $ as b, i as j, B as k, X as _, d as T } from "./index-Ct5UuHQN.js";
import { u as N } from "./useNaiveUI-B-ed9kcf.js";
import { r as x, a as U, b as C, c as A, e as z } from "./newAi-BxbCXy2V.js";
import { n as S } from "./changeMesssage-DDIKDCV-.js";
import { _ as $ } from "./Avatar-DGwaOewp.js";
import { _ as L } from "./Space-D6L4c5Pi.js";
import { _ as M } from "./Radio-TrxH5Uot.js";
import { _ as R } from "./RadioGroup-DTKS4VfV.js";
import { _ as B } from "./Input-BbH8ts9k.js";
import { N as q } from "./Image-C374KhUF.js";
import { _ as D } from "./Select-BghgM9ZJ.js";
import { _ as F } from "./Flex-BpAU42l_.js";
import { _ as E } from "./Spin-liNla5t4.js";
import "./dayjs.min-D__CVkhT.js";
import "./_commonjsHelpers-Dvrxj_Zk.js";
import "./ai-CALWm0qr.js";
import "./utils-CPcGhtGy.js";
import "./Tag-DD6D_Gyq.js";
import "./get-slot-BjAOOWF7.js";
import "./use-merged-state-mPE1JA5r.js";
import "./use-locale-BcUKARuA.js";
import "./Tooltip-DYS7RCZ0.js";
import "./Popover-Z03uJL-I.js";
import "./get-BluUyD2c.js";
import "./cssr-fugg8Rje.js";
import "./format-length-l2rsThpR.js";
import "./use-compitable-BbI6cQbC.js";
import "./download-CfHz9NLm.js";
import "./attribute-Cap6sGiE.js";
import "./VirtualList-CHeV0Vz3.js";
import "./create-D0sloWoF.js";
import "./Empty-BURlTLhl.js";
const G = { class: "ai-modal-container" },
  H = { class: "modal-content" },
  K = { class: "edit-form" },
  P = { class: "form-item" },
  V = { class: "shop-info" },
  X = { class: "shop-logo" },
  Z = { class: "shop-info-content" },
  J = { class: "shop-name" },
  O = { class: "customer-title" },
  Q = { class: "form-item" },
  Y = { class: "form-item send-type-form-item" },
  W = { class: "form-item" },
  ee = { class: "answer-tabs" },
  ae = { class: "answer-container" },
  le = { class: "image-upload-container" },
  oe = { class: "image-preview-area" },
  te = { key: 0, class: "preview-item" },
  se = { class: "form-item" },
  ie = { class: "form-item" },
  ne = { class: "goods-header" },
  ue = { class: "goods-operations" },
  de = { class: "add-goods-section" },
  re = { key: 0, class: "goods-input-inline" },
  ve = { class: "selected-goods-list" },
  ce = { class: "goods-grid" },
  me = { class: "goods-image" },
  pe = { class: "goods-details" },
  ge = { class: "goods-name" },
  fe = { class: "goods-id" },
  he = { key: 0, class: "loading-text" },
  ye = { key: 0, class: "empty-goods-state" },
  Ie = { class: "modal-footer" },
  we = T(
    e({
      __name: "AiModal",
      setup(e) {
        const T = w(),
          we = b();
        N();
        const be = a(),
          je = a({
            id: "",
            groupType: "shop",
            targetId: "",
            title: "",
            content: "",
            answerType: "text",
            scenarios: [],
            isHighPriority: !0,
            shopId: "",
            groupId: "",
            productId: "",
            wordtitle: "",
            sendType: 0,
            imageurls: "",
            images: [],
          }),
          ke = a([]),
          _e = a(""),
          Te = a(!1),
          Ne = a("");
        a("");
        const xe = a(!1),
          Ue = a([]),
          Ce = a([]),
          Ae = a(null),
          ze = a(null),
          Se = a(""),
          $e = a(1),
          Le = a(!1),
          Me = a(!0),
          Re = a(null),
          Be = l(() => {
            var e, a;
            return (
              (null == (e = je.value.title) ? void 0 : e.trim()) &&
              (null == (a = je.value.content) ? void 0 : a.trim())
            );
          });
        (o(async () => {
          var e;
          const a = await j.invoke("tool-window-ready", "AiModal");
          if (a.token) {
            (T.setToken(a.token), await T.getUserInfo().catch(() => {}));
            const e = await x({ pid: 0 });
            Ue.value = e.map((e) => ({ label: e.titleType, value: e.id }));
          }
          if (a.data) {
            const o = a.data,
              t = "string" == typeof o ? JSON.parse(o) : o,
              { shop: s, editForm: i } = t;
            ((be.value = s),
              (je.value = {
                ...je.value,
                ...i,
                sendType: 1 === i.sendType || "1" === i.sendType ? 1 : 0,
                images: [],
              }));
            const n = Array.isArray(i.imageurls)
              ? i.imageurls[0]
              : null == (e = `${i.imageurls || ""}`.split(",")[0])
                ? void 0
                : e.trim();
            if (
              (n &&
                ((je.value.imageurls = n),
                (je.value.images = [
                  { url: n, name: "已上传图片", type: "image", isUploaded: !0 },
                ])),
              i.titleType)
            ) {
              const e = Number(i.titleType);
              for (const a of Ue.value) {
                const l = await x({ pid: a.value });
                if (l.find((a) => a.id === e)) {
                  ((Ae.value = a.value),
                    (Ce.value = l.map((e) => ({ label: e.titleType, value: e.id }))),
                    (ze.value = e));
                  break;
                }
              }
            } else ((Ae.value = null), (ze.value = null), (Ce.value = []));
            const u = i.productId || i.goodId;
            if (u) {
              ke.value = [];
              try {
                const e = await U({ goodId: u });
                if (e && e.goodId) {
                  const a = {
                    goodId: e.goodId,
                    goodName: e.goodName || "未知商品",
                    goodUrl: e.goodUrl || "https://via.placeholder.com/50x50?text=商品",
                    isLoading: !1,
                  };
                  Pe(a);
                }
              } catch (l) {}
            }
          }
        }),
          t(() => {
            j.removeAllListeners("open-auto-reply-modal");
          }),
          s(() => {
            j.removeAllListeners("open-auto-reply-modal");
          }));
        const qe = a([]),
          De = l(() => {
            const e = ke.value.map((e) => e.goodId),
              a = qe.value
                .filter((a) => !e.includes(a.goodId))
                .map((e) => ({
                  label: `${e.goodName || "未知商品"} (ID: ${e.goodId})`,
                  value: e.goodId,
                  disabled: !1,
                }));
            return (
              Le.value &&
                $e.value > 1 &&
                a.push({ label: "正在加载更多...", value: "loading", disabled: !0 }),
              !Me.value &&
                qe.value.length > 0 &&
                !Le.value &&
                a.push({ label: "--- 没有更多商品了 ---", value: "no-more", disabled: !0 }),
              a
            );
          }),
          Fe = () => {
            j.postMessage("close-auto-reply-modal", !1);
          },
          Ee = () => {
            const e = document.createElement("input");
            ((e.type = "file"),
              (e.accept = "image/*"),
              (e.onchange = (e) => {
                var a;
                const l = null == (a = e.target.files) ? void 0 : a[0];
                if (!l) return;
                if (l.size > 10485760)
                  return void we.warning({
                    title: "提示",
                    content: `文件 ${l.name} 超过10MB，请重新选择`,
                  });
                const o = new FileReader();
                ((o.onload = (e) => {
                  var a;
                  ((je.value.images = [
                    {
                      url: null == (a = e.target) ? void 0 : a.result,
                      file: l,
                      name: l.name,
                      type: "image",
                      isUploaded: !1,
                    },
                  ]),
                    (je.value.imageurls = ""));
                }),
                  (o.onerror = () => {
                    we.error({ title: "失败", content: `读取文件 ${l.name} 失败` });
                  }),
                  o.readAsDataURL(l));
              }),
              e.click());
          },
          Ge = () => {
            ((je.value.images = []), (je.value.imageurls = ""));
          },
          He = async () => {
            if (Ae.value)
              if (ze.value)
                try {
                  await (async () => {
                    var e, a, l, o, t;
                    const s = null == (e = je.value.images) ? void 0 : e[0];
                    if (s) {
                      if (s.file && !s.isUploaded) {
                        const e = await _({
                            file: s.file,
                            merchantName:
                              (null == (a = be.value) ? void 0 : a.shopName) ||
                              (null == (l = be.value) ? void 0 : l.merchantName) ||
                              "",
                          }),
                          i = null == e ? void 0 : e.data,
                          n =
                            (null == i ? void 0 : i.url) ||
                            (null == i ? void 0 : i.fileName) ||
                            (null == (o = null == i ? void 0 : i.data) ? void 0 : o.url) ||
                            (null == (t = null == i ? void 0 : i.data) ? void 0 : t.fileName) ||
                            (null == i ? void 0 : i.data);
                        if (!n) throw new Error("图片上传成功，但未返回图片地址");
                        return (
                          (je.value.images = [
                            { url: n, name: s.name, type: "image", isUploaded: !0 },
                          ]),
                          void (je.value.imageurls = n)
                        );
                      }
                      je.value.imageurls = s.url || "";
                    } else je.value.imageurls = "";
                  })();
                  const a = {
                    shopId: be.value.id,
                    title: je.value.title,
                    content: je.value.content,
                    sendType: je.value.sendType,
                    status: "1",
                    userId: T.userInfo.userId.toString(),
                    titleType: ze.value ? ze.value.toString() : "",
                    imageurls: je.value.imageurls,
                  };
                  if (ke.value && 0 !== ke.value.length) {
                    let l = 0,
                      o = 0;
                    const t = ke.value.length;
                    let s = null;
                    t > 1 &&
                      (s = we.info({
                        title: "保存中",
                        content: `正在保存商品关联记录... (0/${t})`,
                        closable: !1,
                        maskClosable: !1,
                      }));
                    for (let i = 0; i < ke.value.length; i++) {
                      const n = ke.value[i].goodId;
                      try {
                        if (0 === i) {
                          const e = {
                              ...a,
                              shopId: be.value.id,
                              goodId: n,
                              id: je.value.id,
                              userId: T.userInfo.userId.toString(),
                            },
                            t = await C(e);
                          t && 1 === t.upsertCnt ? l++ : o++;
                        } else {
                          const e = T.userInfo.userId,
                            t = {
                              ...a,
                              goodId: n,
                              shopId: be.value.id,
                              userId: e.toString(),
                              scenarios: je.value.scenarios,
                            },
                            s = await A(t);
                          !s || (1 !== s.insertCnt && 1 !== s.upsertCnt) ? o++ : l++;
                        }
                      } catch (e) {
                        o++;
                      }
                      s && (s.content = `正在保存商品关联记录... (${i + 1}/${t})`);
                    }
                    (s && s.destroy(),
                      0 === o
                        ? we.success({
                            title: "成功",
                            content: 1 === t ? "编辑成功" : `成功保存 ${l} 个商品关联记录`,
                          })
                        : 0 === l
                          ? we.error({
                              title: "失败",
                              content: 1 === t ? "编辑失败" : `所有 ${o} 个商品关联记录保存失败`,
                            })
                          : we.warning({
                              title: "部分成功",
                              content: `成功保存 ${l} 个记录，失败 ${o} 个记录`,
                            }));
                  } else {
                    const e = {
                      ...a,
                      id: je.value.id,
                      shopId: be.value.id,
                      userId: T.userInfo.userId.toString(),
                      goodId: void 0,
                    };
                    if (1 === (await C(e)).upsertCnt) {
                      if (S.has(je.value.id)) {
                        S.get(je.value.id).delete(je.value.wordtitle);
                      }
                      we.success({ title: "成功", content: "编辑成功" });
                    } else we.error({ title: "失败", content: "编辑失败" });
                  }
                  (setTimeout(() => {}, 1e3),
                    j.postMessage("close-auto-reply-modal", {
                      shopId: be.value.id,
                      offset: 0,
                      limit: 10,
                    }));
                } catch (e) {
                  we.error({ title: "错误", content: "保存失败，请重试" });
                }
              else we.warning({ title: "提示", content: "请选择二级销售类型" });
            else we.warning({ title: "提示", content: "请选择一级销售类型" });
          },
          Ke = async (e) => {
            if (((ze.value = null), (Ce.value = []), e)) {
              const a = await x({ pid: e });
              Ce.value = a.map((e) => ({ label: e.titleType, value: e.id }));
            }
          },
          Pe = (e) => {
            ke.value.some((a) => a.goodId === e.goodId) || ke.value.push(e);
          },
          Ve = (e) => {
            if (!e) return;
            const a = qe.value.find((a) => a.goodId === e);
            a && (Pe(a), (_e.value = ""));
          },
          Xe = (e) => {
            ((Se.value = e),
              ($e.value = 1),
              (Me.value = !0),
              Re.value && clearTimeout(Re.value),
              (Re.value = setTimeout(() => {
                Je(!1);
              }, 300)));
          },
          Ze = (e) => {
            const a = e.target;
            if (!a) return;
            const l = a.scrollTop;
            a.scrollHeight - l - a.clientHeight < 50 && Me.value && !Le.value && Je(!0);
          },
          Je = async (e = !1) => {
            var a;
            if (!Le.value) {
              Le.value = !0;
              try {
                const l = {
                    shopName: (null == (a = be.value) ? void 0 : a.shopName) || "",
                    pageSize: 20,
                    pageNum: $e.value,
                    goodName: Se.value || "",
                  },
                  o = await z(l);
                ((qe.value = e ? [...qe.value, ...o] : o || []),
                  (Me.value = o && 20 === o.length),
                  o && o.length > 0 && $e.value++);
              } catch (l) {
                e || (qe.value = []);
              } finally {
                Le.value = !1;
              }
            }
          },
          Oe = () => {
            0 !== qe.value.length || Le.value || (($e.value = 1), (Se.value = ""), Je(!1));
          };
        return (e, a) => {
          var l, o, t, s;
          const w = $,
            b = M,
            j = L,
            _ = R,
            T = B,
            N = q,
            x = k,
            U = D,
            C = F,
            A = E;
          return (
            f(),
            i("div", G, [
              n("div", { class: "modal-header" }, [
                a[7] || (a[7] = n("h3", { class: "modal-title" }, "补充AI问答", -1)),
                n("button", { class: "close-btn", onClick: Fe }, "×"),
              ]),
              n("div", H, [
                n("div", K, [
                  n("div", P, [
                    n("div", V, [
                      n("div", X, [
                        u(
                          w,
                          {
                            size: 64,
                            round: "",
                            src: null == (l = be.value) ? void 0 : l.loginUrl,
                            alt: "",
                          },
                          null,
                          8,
                          ["src"],
                        ),
                      ]),
                      n("div", Z, [
                        n("p", J, d(null == (o = be.value) ? void 0 : o.shopName), 1),
                        n("div", O, [
                          u(
                            w,
                            {
                              style: { "background-color": "#fff" },
                              "object-fit": "contain",
                              size: 20,
                              src: null == (t = be.value) ? void 0 : t.platformLogo,
                            },
                            null,
                            8,
                            ["src"],
                          ),
                          n(
                            "span",
                            null,
                            "客服：" + d(null == (s = be.value) ? void 0 : s.customerName),
                            1,
                          ),
                        ]),
                      ]),
                    ]),
                  ]),
                  n("div", Q, [
                    a[8] || (a[8] = n("label", { class: "required" }, "问题", -1)),
                    r(
                      n(
                        "textarea",
                        {
                          "onUpdate:modelValue": a[0] || (a[0] = (e) => (je.value.title = e)),
                          class: "question-input",
                          placeholder: "请输入问题",
                          maxlength: "100",
                        },
                        null,
                        512,
                      ),
                      [[v, je.value.title]],
                    ),
                  ]),
                  n("div", Y, [
                    a[11] || (a[11] = n("label", { class: "required" }, "发送方式", -1)),
                    u(
                      _,
                      {
                        value: je.value.sendType,
                        "onUpdate:value": a[1] || (a[1] = (e) => (je.value.sendType = e)),
                      },
                      {
                        default: c(() => [
                          u(
                            j,
                            { size: 24 },
                            {
                              default: c(() => [
                                u(
                                  b,
                                  { value: 0 },
                                  {
                                    default: c(() => [...(a[9] || (a[9] = [m("AI润色发送", -1)]))]),
                                    _: 1,
                                  },
                                ),
                                u(
                                  b,
                                  { value: 1 },
                                  {
                                    default: c(() => [...(a[10] || (a[10] = [m("原话发送", -1)]))]),
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
                      8,
                      ["value"],
                    ),
                  ]),
                  n("div", W, [
                    a[13] || (a[13] = n("label", { class: "required" }, "答复", -1)),
                    n("div", ee, [
                      n("div", ae, [
                        u(
                          T,
                          {
                            value: je.value.content,
                            "onUpdate:value": a[2] || (a[2] = (e) => (je.value.content = e)),
                            type: "textarea",
                            autosize: { minRows: 4, maxRows: 8 },
                            placeholder: "请输入答复内容",
                            maxlength: 300,
                          },
                          null,
                          8,
                          ["value"],
                        ),
                        n("div", le, [
                          n("div", oe, [
                            je.value.images && je.value.images.length > 0
                              ? (f(),
                                i("div", te, [
                                  u(
                                    N,
                                    {
                                      src: je.value.images[0].url,
                                      alt: "预览图",
                                      "object-fit": "cover",
                                      width: "48",
                                      height: "48",
                                    },
                                    null,
                                    8,
                                    ["src"],
                                  ),
                                  n(
                                    "button",
                                    { type: "button", class: "remove-preview-btn", onClick: Ge },
                                    " × ",
                                  ),
                                ]))
                              : p("", !0),
                          ]),
                          u(
                            x,
                            { type: "primary", ghost: "", size: "small", onClick: Ee },
                            {
                              default: c(() => [...(a[12] || (a[12] = [m(" 插入图片 ", -1)]))]),
                              _: 1,
                            },
                          ),
                        ]),
                      ]),
                    ]),
                  ]),
                  n("div", se, [
                    a[14] || (a[14] = n("label", null, "场景", -1)),
                    u(
                      C,
                      { wrap: !1, gap: "10px", style: { width: "100%" }, align: "center" },
                      {
                        default: c(() => [
                          u(
                            U,
                            {
                              value: Ae.value,
                              "onUpdate:value": [a[3] || (a[3] = (e) => (Ae.value = e)), Ke],
                              style: { width: "200px" },
                              placeholder: "请选择一级销售类型",
                              options: Ue.value,
                            },
                            null,
                            8,
                            ["value", "options"],
                          ),
                          Ae.value
                            ? (f(),
                              g(
                                U,
                                {
                                  key: 0,
                                  value: ze.value,
                                  "onUpdate:value": a[4] || (a[4] = (e) => (ze.value = e)),
                                  style: { width: "400px" },
                                  placeholder: "请选择二级销售类型",
                                  options: Ce.value,
                                },
                                null,
                                8,
                                ["value", "options"],
                              ))
                            : p("", !0),
                        ]),
                        _: 1,
                      },
                    ),
                  ]),
                  n("div", ie, [
                    n("div", ne, [
                      a[17] || (a[17] = n("label", null, "商品信息", -1)),
                      n("div", ue, [
                        u(
                          U,
                          {
                            value: _e.value,
                            "onUpdate:value": [a[5] || (a[5] = (e) => (_e.value = e)), Ve],
                            placeholder: "从已有商品中选择",
                            options: De.value,
                            loading: Le.value,
                            clearable: "",
                            filterable: "",
                            remote: "",
                            filter: () => !0,
                            class: "goods-dropdown",
                            onSearch: Xe,
                            onScroll: Ze,
                            onFocus: Oe,
                          },
                          null,
                          8,
                          ["value", "options", "loading"],
                        ),
                        n("div", de, [
                          Te.value
                            ? (f(),
                              i("div", re, [
                                u(
                                  T,
                                  {
                                    value: Ne.value,
                                    "onUpdate:value": a[6] || (a[6] = (e) => (Ne.value = e)),
                                    placeholder: "请输入商品ID",
                                    clearable: "",
                                    size: "small",
                                    onKeyup: h(e.handleAddGoodsByInput, ["enter"]),
                                  },
                                  null,
                                  8,
                                  ["value", "onKeyup"],
                                ),
                                u(
                                  x,
                                  {
                                    type: "primary",
                                    size: "small",
                                    loading: xe.value,
                                    onClick: e.handleAddGoodsByInput,
                                  },
                                  {
                                    default: c(() => [...(a[15] || (a[15] = [m(" 确认 ", -1)]))]),
                                    _: 1,
                                  },
                                  8,
                                  ["loading", "onClick"],
                                ),
                                u(
                                  x,
                                  { size: "small", onClick: e.hideAddGoodsInput },
                                  {
                                    default: c(() => [...(a[16] || (a[16] = [m(" 取消 ", -1)]))]),
                                    _: 1,
                                  },
                                  8,
                                  ["onClick"],
                                ),
                              ]))
                            : p("", !0),
                        ]),
                      ]),
                    ]),
                    n("div", ve, [
                      n("div", ce, [
                        (f(!0),
                        i(
                          y,
                          null,
                          I(
                            ke.value,
                            (e, l) => (
                              f(),
                              i("div", { key: e.goodId, class: "goods-card" }, [
                                n("div", me, [
                                  u(
                                    N,
                                    {
                                      width: "36",
                                      height: "36",
                                      src: e.goodUrl,
                                      alt: "商品图片",
                                      "fallback-src": "/default-goods.png",
                                    },
                                    null,
                                    8,
                                    ["src"],
                                  ),
                                ]),
                                n("div", pe, [
                                  n("div", ge, [
                                    m(d(e.goodName) + " ", 1),
                                    e.isLoading
                                      ? (f(),
                                        g(A, { key: 0, size: 12, style: { "margin-left": "4px" } }))
                                      : p("", !0),
                                  ]),
                                  n("div", fe, "ID：" + d(e.goodId), 1),
                                  e.isLoading && e.loadingText
                                    ? (f(), i("div", he, d(e.loadingText), 1))
                                    : p("", !0),
                                ]),
                                u(
                                  x,
                                  {
                                    text: "",
                                    type: "error",
                                    size: "small",
                                    class: "remove-btn",
                                    onClick: (e) =>
                                      ((e) => {
                                        (ke.value.splice(e, 1),
                                          we.info({ title: "提示", content: "商品已移除" }));
                                      })(l),
                                  },
                                  {
                                    default: c(() => [...(a[18] || (a[18] = [m(" 移除 ", -1)]))]),
                                    _: 1,
                                  },
                                  8,
                                  ["onClick"],
                                ),
                              ])
                            ),
                          ),
                          128,
                        )),
                      ]),
                      0 === ke.value.length
                        ? (f(),
                          i("div", ye, [
                            ...(a[19] || (a[19] = [n("p", null, "暂未关联商品", -1)])),
                          ]))
                        : p("", !0),
                    ]),
                  ]),
                ]),
              ]),
              n("div", Ie, [
                u(j, null, {
                  default: c(() => [
                    u(
                      x,
                      { onClick: Fe },
                      { default: c(() => [...(a[20] || (a[20] = [m("取消", -1)]))]), _: 1 },
                    ),
                    u(
                      x,
                      { type: "primary", disabled: !Be.value, onClick: He },
                      { default: c(() => [...(a[21] || (a[21] = [m("确定", -1)]))]), _: 1 },
                      8,
                      ["disabled"],
                    ),
                  ]),
                  _: 1,
                }),
              ]),
            ])
          );
        };
      },
    }),
    [["__scopeId", "data-v-0a3058dc"]],
  );
export { we as default };
