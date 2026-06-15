import {
  j as e,
  r as o,
  G as s,
  d as a,
  z as l,
  Z as t,
  _ as d,
  U as i,
  S as n,
  h as r,
  R as p,
  a6 as c,
  X as u,
  F as m,
  a4 as g,
  V as v,
  a0 as f,
} from "./vendor-DHo7BzsC.js";
import { i as y, B as h, d as j } from "./index-Ct5UuHQN.js";
import { _ as I } from "./Input-BbH8ts9k.js";
import { _ } from "./Space-D6L4c5Pi.js";
import { _ as b, a as k } from "./Checkbox-Bh5XC2vt.js";
import { _ as x } from "./Select-BghgM9ZJ.js";
import { N as C } from "./Image-C374KhUF.js";
import { _ as G } from "./Spin-liNla5t4.js";
import "./use-locale-BcUKARuA.js";
import "./use-merged-state-mPE1JA5r.js";
import "./get-slot-BjAOOWF7.js";
import "./Popover-Z03uJL-I.js";
import "./get-BluUyD2c.js";
import "./cssr-fugg8Rje.js";
import "./format-length-l2rsThpR.js";
import "./use-compitable-BbI6cQbC.js";
import "./Tag-DD6D_Gyq.js";
import "./attribute-Cap6sGiE.js";
import "./VirtualList-CHeV0Vz3.js";
import "./create-D0sloWoF.js";
import "./Empty-BURlTLhl.js";
import "./utils-CPcGhtGy.js";
import "./Tooltip-DYS7RCZ0.js";
import "./download-CfHz9NLm.js";
const S = { class: "header" },
  w = { style: { padding: "10px 20px" } },
  A = { class: "content" },
  z = { class: "message" },
  U = { class: "item" },
  D = { class: "user-message" },
  F = { class: "item" },
  T = { class: "item" },
  L = { class: "item" },
  P = { class: "goods-operations" },
  B = { class: "add-goods-section" },
  K = { key: 0, class: "goods-input-inline" },
  N = { class: "item" },
  E = { class: "goods-operations" },
  H = { class: "selected-goods-list" },
  M = { class: "goods-grid" },
  R = { class: "goods-image" },
  V = { class: "goods-details" },
  q = { class: "goods-name" },
  O = { class: "goods-id" },
  X = { key: 0, class: "loading-text" },
  Y = { key: 0, class: "empty-goods-state" },
  Z = { class: "bottom" },
  J = j(
    e({
      __name: "edit",
      setup(e) {
        const j = o({
            username: "",
            userContent: "",
            shopSystemId: "",
            messageId: "",
            content: "",
            isAiAutoReply: !1,
            isAiToHuman: null,
            time: 0,
            timestring: "",
          }),
          J = o([]),
          Q = s({
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
          });
        (a(() => {
          y.on("open-aierror-edit-message", W);
        }),
          l(() => {
            y.removeListener("open-aierror-edit-message", W);
          }));
        const W = (e, o) => {
            j.value = o;
          },
          $ = () => {
            y.postMessage("open-aierror-edit-message", !1);
          };
        return (e, o) => {
          const s = h,
            a = I,
            l = b,
            y = _,
            W = k,
            ee = x,
            oe = C,
            se = G;
          return (
            v(),
            t(
              m,
              null,
              [
                d("div", S, [
                  o[6] || (o[6] = d("div", null, "AI纠错编辑窗口", -1)),
                  i(
                    s,
                    { size: "tiny", quaternary: "", circle: "", class: "close-button", onClick: $ },
                    { default: n(() => [...(o[5] || (o[5] = [r(" x ", -1)]))]), _: 1 },
                  ),
                ]),
                d("div", w, [
                  d("div", A, [
                    d("div", z, [
                      d("div", U, [
                        o[7] || (o[7] = d("label", { class: "title" }, "问题", -1)),
                        d("label", D, [
                          i(
                            a,
                            {
                              value: j.value.userContent,
                              "onUpdate:value": o[0] || (o[0] = (e) => (j.value.userContent = e)),
                              type: "textarea",
                              placeholder: "请输入问题",
                            },
                            null,
                            8,
                            ["value"],
                          ),
                        ]),
                      ]),
                      d("div", F, [
                        o[8] || (o[8] = d("label", { class: "title" }, "答复", -1)),
                        d("label", null, [
                          i(
                            a,
                            {
                              value: j.value.content,
                              "onUpdate:value": o[1] || (o[1] = (e) => (j.value.content = e)),
                              type: "textarea",
                              placeholder: "请输入回答",
                            },
                            null,
                            8,
                            ["value"],
                          ),
                        ]),
                      ]),
                      d("div", T, [
                        o[11] || (o[11] = d("label", null, "场景", -1)),
                        i(
                          W,
                          {
                            value: Q.scenarios,
                            "onUpdate:value": o[2] || (o[2] = (e) => (Q.scenarios = e)),
                            style: { background: "#f9fcff", padding: "5px" },
                          },
                          {
                            default: n(() => [
                              i(y, null, {
                                default: n(() => [
                                  i(
                                    l,
                                    { value: "售前" },
                                    {
                                      default: n(() => [...(o[9] || (o[9] = [r("售前", -1)]))]),
                                      _: 1,
                                    },
                                  ),
                                  i(
                                    l,
                                    { value: "售后" },
                                    {
                                      default: n(() => [...(o[10] || (o[10] = [r("售后", -1)]))]),
                                      _: 1,
                                    },
                                  ),
                                ]),
                                _: 1,
                              }),
                            ]),
                            _: 1,
                          },
                          8,
                          ["value"],
                        ),
                      ]),
                      d("div", L, [
                        d("div", P, [
                          o[15] || (o[15] = d("label", null, "商品信息", -1)),
                          i(
                            ee,
                            {
                              value: e.selectedGoodsFromDropdown,
                              "onUpdate:value": [
                                o[3] || (o[3] = (o) => (e.selectedGoodsFromDropdown = o)),
                                e.handleSelectFromDropdown,
                              ],
                              placeholder: "从已有商品中选择",
                              options: e.dropdownGoodsOptions,
                              loading: e.productLoading,
                              clearable: "",
                              filterable: "",
                              remote: "",
                              filter: () => !0,
                              class: "goods-dropdown",
                              onSearch: e.handleProductSearch,
                              onScroll: e.handleProductScroll,
                              onFocus: e.handleDropdownFocus,
                            },
                            null,
                            8,
                            [
                              "value",
                              "options",
                              "loading",
                              "onUpdate:value",
                              "onSearch",
                              "onScroll",
                              "onFocus",
                            ],
                          ),
                          d("div", B, [
                            e.showGoodsInput
                              ? (v(),
                                t("div", K, [
                                  i(
                                    a,
                                    {
                                      value: e.manualGoodsId,
                                      "onUpdate:value":
                                        o[4] || (o[4] = (o) => (e.manualGoodsId = o)),
                                      placeholder: "请输入商品ID",
                                      clearable: "",
                                      size: "small",
                                      onKeyup: c(e.handleAddGoodsByInput, ["enter"]),
                                    },
                                    null,
                                    8,
                                    ["value", "onKeyup"],
                                  ),
                                  i(
                                    s,
                                    {
                                      type: "primary",
                                      size: "small",
                                      loading: e.addGoodsLoading,
                                      onClick: e.handleAddGoodsByInput,
                                    },
                                    {
                                      default: n(() => [...(o[12] || (o[12] = [r(" 确认 ", -1)]))]),
                                      _: 1,
                                    },
                                    8,
                                    ["loading", "onClick"],
                                  ),
                                  i(
                                    s,
                                    { size: "small", onClick: e.hideAddGoodsInput },
                                    {
                                      default: n(() => [...(o[13] || (o[13] = [r(" 取消 ", -1)]))]),
                                      _: 1,
                                    },
                                    8,
                                    ["onClick"],
                                  ),
                                ]))
                              : (v(),
                                p(
                                  s,
                                  {
                                    key: 1,
                                    type: "primary",
                                    size: "small",
                                    onClick: e.showAddGoodsInput,
                                  },
                                  {
                                    default: n(() => [
                                      ...(o[14] || (o[14] = [r(" 添加商品 ", -1)])),
                                    ]),
                                    _: 1,
                                  },
                                  8,
                                  ["onClick"],
                                )),
                          ]),
                        ]),
                      ]),
                      d("div", N, [
                        d("div", E, [
                          d("div", H, [
                            d("div", M, [
                              (v(!0),
                              t(
                                m,
                                null,
                                g(
                                  J.value,
                                  (a, l) => (
                                    v(),
                                    t("div", { key: a.goodId, class: "goods-card" }, [
                                      d("div", R, [
                                        i(
                                          oe,
                                          {
                                            width: "36",
                                            height: "36",
                                            src: a.goodUrl,
                                            alt: "商品图片",
                                            "fallback-src": "/default-goods.png",
                                          },
                                          null,
                                          8,
                                          ["src"],
                                        ),
                                      ]),
                                      d("div", V, [
                                        d("div", q, [
                                          r(f(a.goodName) + " ", 1),
                                          a.isLoading
                                            ? (v(),
                                              p(se, {
                                                key: 0,
                                                size: 12,
                                                style: { "margin-left": "4px" },
                                              }))
                                            : u("", !0),
                                        ]),
                                        d("div", O, "ID：" + f(a.goodId), 1),
                                        a.isLoading && a.loadingText
                                          ? (v(), t("div", X, f(a.loadingText), 1))
                                          : u("", !0),
                                      ]),
                                      i(
                                        s,
                                        {
                                          text: "",
                                          type: "error",
                                          size: "small",
                                          class: "remove-btn",
                                          onClick: (o) => e.removeGoods(l),
                                        },
                                        {
                                          default: n(() => [
                                            ...(o[16] || (o[16] = [r(" 移除 ", -1)])),
                                          ]),
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
                            0 === J.value.length
                              ? (v(),
                                t("div", Y, [
                                  ...(o[17] || (o[17] = [d("p", null, "暂未关联商品", -1)])),
                                ]))
                              : u("", !0),
                          ]),
                        ]),
                      ]),
                    ]),
                  ]),
                  d("div", Z, [
                    i(s, null, {
                      default: n(() => [...(o[18] || (o[18] = [r("取消", -1)]))]),
                      _: 1,
                    }),
                    i(
                      s,
                      { type: "info" },
                      { default: n(() => [...(o[19] || (o[19] = [r("确定", -1)]))]), _: 1 },
                    ),
                  ]),
                ]),
              ],
              64,
            )
          );
        };
      },
    }),
    [["__scopeId", "data-v-9c77061b"]],
  );
export { J as default };
