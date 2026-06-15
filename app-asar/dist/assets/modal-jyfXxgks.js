import {
  j as e,
  k as l,
  v as t,
  F as a,
  c as s,
  Z as n,
  _ as o,
  a4 as i,
  V as r,
  E as c,
  X as u,
  a0 as d,
  r as p,
  w as v,
  R as m,
  S as g,
  U as h,
  h as C,
  d as y,
  z as f,
  I as w,
  B as k,
  a2 as b,
  a6 as x,
  a5 as I,
  a3 as _,
  $ as A,
  x as S,
} from "./vendor-DHo7BzsC.js";
import {
  L as j,
  z as M,
  x as T,
  by as B,
  t as P,
  D as L,
  bz as U,
  aU as z,
  bA as R,
  d as V,
  b1 as H,
  e as N,
  B as Z,
  a0 as q,
  i as W,
  ak as D,
  V as E,
  bB as K,
} from "./index-Ct5UuHQN.js";
import { r as Q, A as O, _ as G } from "./Add-DzxqObxE.js";
import { g as $ } from "./_commonjsHelpers-Dvrxj_Zk.js";
import { _ as F, c as J } from "./DataTable-o5v8Tguj.js";
import { a as X, _ as Y, c as ee, b as le } from "./Grid-CofU7JZY.js";
import { _ as te } from "./Select-BghgM9ZJ.js";
import { _ as ae } from "./Input-BbH8ts9k.js";
import { _ as se } from "./Avatar-DGwaOewp.js";
import { N as ne } from "./Ellipsis-B_bopKoR.js";
import { _ as oe } from "./Tag-DD6D_Gyq.js";
import { w as ie, k as re, d as ce, p as ue } from "./wx-CIJpY1kB.js";
import { x as de, t as pe } from "./小红书-jZwggzOL.js";
import { u as ve } from "./useNaiveUI-B-ed9kcf.js";
import { o as me, p as ge, q as he } from "./newAi-BxbCXy2V.js";
import { N as Ce } from "./Icon-BkVA54F2.js";
import { N as ye } from "./Image-C374KhUF.js";
import { _ as fe } from "./Flex-BpAU42l_.js";
import { _ as we } from "./Dropdown-De4FdQJF.js";
import { _ as ke } from "./Divider-CDdOMQYZ.js";
import { _ as be } from "./Radio-TrxH5Uot.js";
import { _ as xe } from "./RadioGroup-DTKS4VfV.js";
import "./Add-DB3n_hTA.js";
import "./Space-D6L4c5Pi.js";
import "./get-slot-BjAOOWF7.js";
import "./use-locale-BcUKARuA.js";
import "./use-merged-state-mPE1JA5r.js";
import "./format-length-l2rsThpR.js";
import "./Checkbox-Bh5XC2vt.js";
import "./get-BluUyD2c.js";
import "./Popover-Z03uJL-I.js";
import "./cssr-fugg8Rje.js";
import "./use-compitable-BbI6cQbC.js";
import "./VirtualList-CHeV0Vz3.js";
import "./create-D0sloWoF.js";
import "./Empty-BURlTLhl.js";
import "./download-CfHz9NLm.js";
import "./attribute-Cap6sGiE.js";
import "./utils-CPcGhtGy.js";
import "./Tooltip-DYS7RCZ0.js";
let Ie = !1;
const _e = M([
    T(
      "skeleton",
      "\n height: 1em;\n width: 100%;\n transition:\n --n-color-start .3s var(--n-bezier),\n --n-color-end .3s var(--n-bezier),\n background-color .3s var(--n-bezier);\n animation: 2s skeleton-loading infinite cubic-bezier(0.36, 0, 0.64, 1);\n background-color: var(--n-color-start);\n ",
    ),
    M(
      "@keyframes skeleton-loading",
      "\n 0% {\n background: var(--n-color-start);\n }\n 40% {\n background: var(--n-color-end);\n }\n 80% {\n background: var(--n-color-start);\n }\n 100% {\n background: var(--n-color-start);\n }\n ",
    ),
  ]),
  Ae = e({
    name: "Skeleton",
    inheritAttrs: !1,
    props: Object.assign(Object.assign({}, L.props), {
      text: Boolean,
      round: Boolean,
      circle: Boolean,
      height: [String, Number],
      width: [String, Number],
      size: String,
      repeat: { type: Number, default: 1 },
      animated: { type: Boolean, default: !0 },
      sharp: { type: Boolean, default: !0 },
    }),
    setup(e) {
      !(function () {
        if (
          j &&
          window.CSS &&
          !Ie &&
          ((Ie = !0),
          "registerProperty" in (null === window || void 0 === window ? void 0 : window.CSS))
        )
          try {
            (CSS.registerProperty({
              name: "--n-color-start",
              syntax: "<color>",
              inherits: !1,
              initialValue: "#0000",
            }),
              CSS.registerProperty({
                name: "--n-color-end",
                syntax: "<color>",
                inherits: !1,
                initialValue: "#0000",
              }));
          } catch (e) {}
      })();
      const { mergedClsPrefixRef: l } = P(e),
        t = L("Skeleton", "-skeleton", _e, U, e, l);
      return {
        mergedClsPrefix: l,
        style: s(() => {
          var l, a;
          const s = t.value,
            {
              common: { cubicBezierEaseInOut: n },
            } = s,
            o = s.self,
            { color: i, colorEnd: r, borderRadius: c } = o;
          let u;
          const {
            circle: d,
            sharp: p,
            round: v,
            width: m,
            height: g,
            size: h,
            text: C,
            animated: y,
          } = e;
          void 0 !== h && (u = o[z("height", h)]);
          const f = d ? (null !== (l = null != m ? m : g) && void 0 !== l ? l : u) : m,
            w = null !== (a = d && null != m ? m : g) && void 0 !== a ? a : u;
          return {
            display: C ? "inline-block" : "",
            verticalAlign: C ? "-0.125em" : "",
            borderRadius: d ? "50%" : v ? "4096px" : p ? "" : c,
            width: "number" == typeof f ? R(f) : f,
            height: "number" == typeof w ? R(w) : w,
            animation: y ? "" : "none",
            "--n-bezier": n,
            "--n-color-start": i,
            "--n-color-end": r,
          };
        }),
      };
    },
    render() {
      const { repeat: e, style: s, mergedClsPrefix: n, $attrs: o } = this,
        i = l("div", t({ class: `${n}-skeleton`, style: s }, o));
      return e > 1
        ? l(
            a,
            null,
            B(e, null).map((e) => [i, "\n"]),
          )
        : i;
    },
  });
var Se,
  je = {};
function Me() {
  if (Se) return je;
  ((Se = 1), Object.defineProperty(je, "__esModule", { value: !0 }));
  const e = Q(),
    l = {
      xmlns: "http://www.w3.org/2000/svg",
      "xmlns:xlink": "http://www.w3.org/1999/xlink",
      viewBox: "0 0 512 512",
    },
    t = [
      (0, e.createStaticVNode)(
        '<path d="M112 112l20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></path><path stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M80 112h352" fill="currentColor"></path><path d="M192 112V72h0a23.93 23.93 0 0 1 24-24h80a23.93 23.93 0 0 1 24 24h0v40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></path><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 176v224"></path><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M184 176l8 224"></path><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M328 176l-8 224"></path>',
        6,
      ),
    ];
  return (
    (je.default = (0, e.defineComponent)({
      name: "TrashOutline",
      render: function (a, s) {
        return ((0, e.openBlock)(), (0, e.createElementBlock)("svg", l, t));
      },
    })),
    je
  );
}
const Te = $(Me()),
  Be = { class: "kh-stepbar" },
  Pe = { class: "kh-stepbar__list" },
  Le = { class: "kh-stepbar__row" },
  Ue = { class: "kh-stepbar__main" },
  ze = { class: "kh-stepbar__dot" },
  Re = ["innerHTML"],
  Ve = { class: "kh-stepbar__title" },
  He = { key: 0, class: "kh-stepbar__line" },
  Ne = { class: "kh-stepbar__desc" },
  Ze = V(
    e({
      __name: "index",
      props: { currentStep: { type: Number, default: 1 } },
      setup(e) {
        const l = e,
          t = s(() => [
            {
              key: "guide",
              title: "引导页面",
              desc: "3分钟开启智能客服",
              icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M6.48 8.32C6.42819 8.13038 6.4151 7.93227 6.4415 7.73749C6.46791 7.5427 6.53327 7.35523 6.63369 7.18625C6.7341 7.01726 6.86752 6.87023 7.02599 6.75393C7.18445 6.63762 7.36472 6.55441 7.55603 6.50927C7.74734 6.46413 7.94579 6.45798 8.13953 6.49118C8.33327 6.52438 8.51834 6.59626 8.68371 6.70253C8.84907 6.8088 8.99134 6.94728 9.10204 7.10972C9.21273 7.27216 9.28958 7.45522 9.328 7.648C9.37981 7.83762 9.3929 8.03572 9.36649 8.23051C9.34009 8.42529 9.27473 8.61277 9.17431 8.78175C9.07389 8.95073 8.94047 9.09776 8.78201 9.21407C8.62355 9.33038 8.44328 9.41358 8.25197 9.45873C8.06065 9.50387 7.86221 9.51002 7.66847 9.47682C7.47472 9.44361 7.28965 9.37173 7.12429 9.26546C6.95892 9.15919 6.81665 9.02071 6.70596 8.85828C6.59527 8.69584 6.51842 8.51277 6.48 8.32ZM12.52 4C12.5618 3.93679 12.5792 3.86053 12.5689 3.78545C12.5586 3.71037 12.5213 3.6416 12.464 3.592C12.416 3.496 12.208 3.496 12.056 3.544L5.872 5.552C5.7898 5.58288 5.71516 5.63098 5.65307 5.69307C5.59098 5.75516 5.54288 5.8298 5.512 5.912L3.48 12.104C3.43551 12.1657 3.41577 12.2418 3.42465 12.3173C3.43354 12.3929 3.47041 12.4623 3.528 12.512C3.576 12.608 3.784 12.608 3.936 12.56L10.128 10.528C10.2102 10.4971 10.2848 10.449 10.3469 10.3869C10.409 10.3248 10.4571 10.2502 10.488 10.168L12.52 4ZM8 0C9.58225 0 11.129 0.469192 12.4446 1.34824C13.7602 2.22729 14.7855 3.47672 15.391 4.93853C15.9965 6.40034 16.155 8.00887 15.8463 9.56072C15.5376 11.1126 14.7757 12.538 13.6569 13.6569C12.538 14.7757 11.1126 15.5376 9.56072 15.8463C8.00887 16.155 6.40034 15.9965 4.93853 15.391C3.47672 14.7855 2.22729 13.7602 1.34824 12.4446C0.469192 11.129 0 9.58225 0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0Z" fill="currentColor"/>\n</svg>\n',
            },
            {
              key: "presale",
              title: "售前配置",
              desc: "配置售前基本信息",
              icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M8 0C3.584 0 0 3.584 0 8C0 12.416 3.584 16 8 16C12.416 16 16 12.416 16 8C16 3.584 12.416 0 8 0ZM9.112 4.944C7.432 4.328 5.568 5.2 4.952 6.88C4.336 8.568 5.208 10.432 6.896 11.04C8.04 11.456 9.328 11.2 10.224 10.36C10.44 10.152 10.792 10.16 11.008 10.368L11.992 11.352C12.216 11.568 12.224 11.928 12.008 12.152C11.792 12.376 11.432 12.384 11.208 12.168C11.2 12.168 11.2 12.16 11.192 12.152L10.568 11.528C9.824 12.072 8.928 12.36 8 12.36C5.584 12.36 3.624 10.4 3.624 7.984C3.624 5.568 5.584 3.624 8 3.624C10.416 3.624 12.376 5.584 12.376 8C12.376 8.512 12.288 9.016 12.112 9.496C12.008 9.792 11.68 9.936 11.384 9.832C11.088 9.728 10.944 9.4 11.048 9.104C11.664 7.424 10.8 5.56 9.112 4.944ZM7.432 6.376C7.608 6.312 7.8 6.28 7.992 6.28C8.944 6.28 9.712 7.048 9.712 8C9.712 8.952 8.944 9.72 7.992 9.72C7.04 9.72 6.272 8.952 6.272 8C6.272 7.832 6.296 7.672 6.336 7.52C6.472 7.648 6.656 7.72 6.864 7.72C7.304 7.72 7.656 7.368 7.656 6.928C7.664 6.72 7.576 6.52 7.432 6.376Z" fill="currentColor"/>\n</svg>\n',
            },
            {
              key: "aftersale",
              title: "售后配置",
              desc: "配置售后基本问题",
              icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M6.00063 9H9.75V8H5.99625L6.48931 7.437C6.57141 7.34325 6.61755 7.21606 6.61759 7.08343C6.61763 6.95079 6.57157 6.82357 6.48953 6.72975C6.4075 6.63593 6.29621 6.5832 6.18015 6.58315C6.0641 6.5831 5.95278 6.63575 5.87069 6.7295L4.65925 8.1145C4.6077 8.16283 4.56652 8.22401 4.53887 8.29335C4.51122 8.36269 4.49783 8.43835 4.49973 8.51452C4.50163 8.59069 4.51877 8.66535 4.54983 8.73278C4.5809 8.80021 4.62506 8.8586 4.67894 8.9035L5.87069 10.2655C5.91134 10.3119 5.95959 10.3487 6.01269 10.3739C6.06578 10.399 6.12269 10.4119 6.18015 10.4119C6.23762 10.4118 6.29452 10.3989 6.3476 10.3737C6.40068 10.3486 6.44891 10.3117 6.48953 10.2653C6.53015 10.2188 6.56237 10.1637 6.58434 10.103C6.60631 10.0423 6.61761 9.97725 6.61759 9.91157C6.61757 9.8459 6.60623 9.78087 6.58422 9.72021C6.56221 9.65954 6.52996 9.60442 6.48931 9.558L6.00106 9H6.00063ZM1 5H15V13C15 13.2626 14.9547 13.5227 14.8668 13.7654C14.7788 14.008 14.6499 14.2285 14.4874 14.4142C14.3249 14.5999 14.132 14.7472 13.9197 14.8478C13.7074 14.9483 13.4798 15 13.25 15H2.75C2.52019 15 2.29262 14.9483 2.0803 14.8478C1.86798 14.7472 1.67507 14.5999 1.51256 14.4142C1.35006 14.2285 1.22116 14.008 1.13321 13.7654C1.04526 13.5227 1 13.2626 1 13V5ZM4.00694 1H11.9931C12.2496 1.00011 12.5029 1.06466 12.7352 1.18908C12.9674 1.3135 13.1729 1.49475 13.3371 1.72L15 4H1L2.6625 1.72C2.82676 1.49462 3.03238 1.3133 3.26479 1.18887C3.49721 1.06444 3.75072 0.999963 4.00738 1H4.00694ZM9.75 8V9C9.86492 8.99998 9.97871 9.02583 10.0849 9.07608C10.1911 9.12632 10.2875 9.19998 10.3688 9.29284C10.4501 9.3857 10.5145 9.49595 10.5585 9.61728C10.6025 9.73862 10.6251 9.86866 10.6251 10C10.6251 10.1313 10.6025 10.2614 10.5585 10.3827C10.5145 10.5041 10.4501 10.6143 10.3688 10.7072C10.2875 10.8 10.1911 10.8737 10.0849 10.9239C9.97871 10.9742 9.86492 11 9.75 11V12C10.2141 12 10.6592 11.7893 10.9874 11.4142C11.3156 11.0391 11.5 10.5304 11.5 10C11.5 9.46957 11.3156 8.96086 10.9874 8.58579C10.6592 8.21071 10.2141 8 9.75 8ZM8.4375 11C8.32147 11 8.21019 11.0527 8.12814 11.1464C8.04609 11.2402 8 11.3674 8 11.5C8 11.6326 8.04609 11.7598 8.12814 11.8536C8.21019 11.9473 8.32147 12 8.4375 12H9.75V11H8.4375Z" fill="currentColor"/>\n</svg>\n',
            },
            {
              key: "human",
              title: "转人工设置",
              desc: "AI转接人工时配置",
              icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M4.52424 5.93079C2.96268 5.93079 1.69652 4.7064 1.69652 3.19602C1.69652 1.68565 2.96268 0.461254 4.52452 0.461254C6.08608 0.461254 7.35196 1.68565 7.35196 3.19602C7.35196 4.7064 6.08608 5.93079 4.52424 5.93079ZM4.52424 11.4003C2.02552 11.4003 0 10.7968 0 9.26009C0 7.72334 2.02552 6.47775 4.52424 6.47775C7.02296 6.47775 9.04876 7.72334 9.04876 9.26009C9.04876 10.7968 7.02296 11.4003 4.52424 11.4003ZM3.28244 13.1638C3.21622 13.1308 3.15744 13.0854 3.10952 13.0301C3.06161 12.9748 3.02552 12.9108 3.00337 12.8418C2.98122 12.7729 2.97346 12.7003 2.98053 12.6284C2.9876 12.5564 3.00936 12.4866 3.04455 12.4229C3.07974 12.3593 3.12764 12.3031 3.18546 12.2576C3.24328 12.2121 3.30986 12.1783 3.38131 12.158C3.45275 12.1378 3.52763 12.1316 3.60157 12.1398C3.6755 12.148 3.74701 12.1705 3.81192 12.2058C4.70609 12.6715 5.70533 12.9143 6.72 12.9126C10.122 12.9126 12.88 10.2349 12.88 6.932C12.88 4.08414 10.8139 1.64732 7.97804 1.07617C7.8326 1.04686 7.70511 0.962661 7.62361 0.842091C7.54212 0.721521 7.51329 0.574458 7.54348 0.433254C7.57367 0.29205 7.66039 0.168272 7.78458 0.0891495C7.90877 0.010027 8.06024 -0.0179586 8.20568 0.0113493C11.5584 0.686614 14 3.56655 14 6.932C14 10.8357 10.7408 14 6.72 14C5.52054 14.0016 4.3394 13.7143 3.28244 13.1638ZM10.99 8.25154C10.945 8.38896 10.8455 8.50338 10.7136 8.56963C10.5817 8.63588 10.428 8.64853 10.2865 8.6048C10.145 8.56108 10.0271 8.46455 9.95887 8.33646C9.89063 8.20837 9.8776 8.05921 9.92264 7.92179C10.0268 7.60482 10.08 7.27208 10.08 6.932C10.08 5.7424 9.4192 4.66562 8.37144 4.09012C8.24514 4.01768 8.15316 3.90002 8.11528 3.76243C8.07739 3.62483 8.09663 3.4783 8.16886 3.35434C8.24108 3.23037 8.36052 3.13887 8.5015 3.09951C8.64248 3.06014 8.79374 3.07606 8.92276 3.14383C9.61412 3.52261 10.1893 4.07302 10.5895 4.73867C10.9896 5.40432 11.2003 6.16128 11.2 6.932C11.2 7.38435 11.1286 7.82828 10.99 8.25154Z" fill="currentColor"/>\n</svg>\n',
            },
            {
              key: "ai",
              title: "AI设置",
              desc: "AI的基本信息配置",
              icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M8.875 1.87807C8.875 2.13797 8.76242 2.37153 8.58333 2.53251V3.63416H11.5C11.9641 3.63416 12.4092 3.81918 12.7374 4.14851C13.0656 4.47784 13.25 4.92451 13.25 5.39026V11.2439C13.25 11.7097 13.0656 12.1563 12.7374 12.4857C12.4092 12.815 11.9641 13 11.5 13H4.5C4.03587 13 3.59075 12.815 3.26256 12.4857C2.93437 12.1563 2.75 11.7097 2.75 11.2439V5.39026C2.75 4.92451 2.93437 4.47784 3.26256 4.14851C3.59075 3.81918 4.03587 3.63416 4.5 3.63416H7.41667V2.53251C7.30788 2.43486 7.22516 2.31146 7.17604 2.17354C7.12692 2.03562 7.11296 1.88756 7.13544 1.74284C7.15791 1.59812 7.21611 1.46134 7.30472 1.34496C7.39333 1.22858 7.50955 1.13629 7.64279 1.0765C7.77603 1.01671 7.92206 0.991311 8.06758 1.00262C8.2131 1.01394 8.35349 1.0616 8.47596 1.14127C8.59844 1.22094 8.69911 1.33009 8.7688 1.45878C8.8385 1.58746 8.875 1.7316 8.875 1.87807ZM1 6.56099H2.16667V10.0732H1V6.56099ZM15 6.56099H13.8333V10.0732H15V6.56099ZM6.25 9.19513C6.48206 9.19513 6.70462 9.10262 6.86872 8.93795C7.03281 8.77329 7.125 8.54995 7.125 8.31708C7.125 8.08421 7.03281 7.86087 6.86872 7.69621C6.70462 7.53154 6.48206 7.43903 6.25 7.43903C6.01794 7.43903 5.79538 7.53154 5.63128 7.69621C5.46719 7.86087 5.375 8.08421 5.375 8.31708C5.375 8.54995 5.46719 8.77329 5.63128 8.93795C5.79538 9.10262 6.01794 9.19513 6.25 9.19513ZM10.625 8.31708C10.625 8.08421 10.5328 7.86087 10.3687 7.69621C10.2046 7.53154 9.98206 7.43903 9.75 7.43903C9.51794 7.43903 9.29538 7.53154 9.13128 7.69621C8.96719 7.86087 8.875 8.08421 8.875 8.31708C8.875 8.54995 8.96719 8.77329 9.13128 8.93795C9.29538 9.10262 9.51794 9.19513 9.75 9.19513C9.98206 9.19513 10.2046 9.10262 10.3687 8.93795C10.5328 8.77329 10.625 8.54995 10.625 8.31708Z" fill="currentColor"/>\n</svg>\n',
            },
            {
              key: "done",
              title: "完成配置",
              desc: "您的AI客服已上线",
              icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M8 1C11.8661 1 15 4.1339 15 8C15 11.8661 11.8661 15 8 15C4.1339 15 1 11.8661 1 8C1 4.1339 4.1339 1 8 1ZM10.94 5.76001C10.6663 5.48669 10.2228 5.48702 9.94952 5.76075L6.8674 8.8477L5.97986 7.96061C5.70648 7.68737 5.26337 7.68743 4.99006 7.96074C4.7167 8.2341 4.7167 8.6773 4.99006 8.95066L6.57129 10.5319C6.73518 10.6958 7.00092 10.6957 7.1647 10.5317L10.9407 6.75048C11.214 6.47678 11.2137 6.03333 10.94 5.76001Z" fill="currentColor"/>\n</svg>\n',
            },
          ]),
          p = (e) => {
            const t = Math.max(l.currentStep - 1, 0);
            return e < t ? "done" : e === t ? "active" : "wait";
          };
        return (e, l) => (
          r(),
          n("div", Be, [
            o("div", Pe, [
              (r(!0),
              n(
                a,
                null,
                i(
                  t.value,
                  (e, l) => (
                    r(),
                    n(
                      "div",
                      {
                        key: e.key,
                        class: c([
                          "kh-stepbar__item",
                          [`is-${p(l)}`, { "is-before-last": l === t.value.length - 2 }],
                        ]),
                      },
                      [
                        o("div", Le, [
                          o("div", Ue, [
                            o("div", ze, [o("span", { innerHTML: e.icon }, null, 8, Re)]),
                            o("div", Ve, d(e.title), 1),
                          ]),
                          l < t.value.length - 1 ? (r(), n("div", He)) : u("", !0),
                        ]),
                        o("div", Ne, d(e.desc), 1),
                      ],
                      2,
                    )
                  ),
                ),
                128,
              )),
            ]),
          ])
        );
      },
    }),
    [["__scopeId", "data-v-96f9c84f"]],
  ),
  qe = { class: "shop-copy-content" },
  We = { class: "filter-bar" },
  De = { class: "pagination-bar" },
  Ee = { class: "selected-count" },
  Ke = { class: "modal-actions" },
  Qe = V(
    e({
      __name: "ShopCopyModal",
      props: { show: { type: Boolean }, sourceShopId: {}, loading: { type: Boolean } },
      emits: ["update:show", "confirm"],
      setup(e, { emit: t }) {
        const a = e,
          n = t,
          i = H(),
          c = N(),
          y = s({ get: () => a.show, set: (e) => n("update:show", e) }),
          f = p(!1),
          w = p([]),
          k = p("all"),
          b = p(null),
          x = p(""),
          I = p(1),
          _ = p(10),
          A = p([]),
          S = s(() => "zikf" === c.userInfo.roles[0].roleKey),
          j = [
            { label: "全部", value: "all" },
            { label: "已登录", value: "true" },
            { label: "未登录", value: "false" },
          ],
          M = s(() =>
            [...new Set(w.value.map((e) => e.merchantName).filter(Boolean))].map((e) => ({
              label: e,
              value: e,
            })),
          ),
          T = s(() => {
            let e = w.value.filter((e) => e.id !== a.sourceShopId);
            if ("all" !== k.value) {
              const l = "true" === k.value;
              e = e.filter((e) => e.loginStatus === l);
            }
            if ((b.value && (e = e.filter((e) => e.merchantName === b.value)), x.value)) {
              const l = x.value.toLowerCase();
              e = e.filter((e) => {
                var t, a;
                return (
                  (null == (t = e.shopName) ? void 0 : t.toLowerCase().includes(l)) ||
                  (null == (a = e.customerName) ? void 0 : a.toLowerCase().includes(l))
                );
              });
            }
            return e;
          }),
          B = s(() => {
            const e = (I.value - 1) * _.value,
              l = e + _.value;
            return T.value.slice(e, l);
          }),
          P = [
            { type: "selection", width: 50, align: "center" },
            {
              title: "店铺",
              key: "shopName",
              width: 200,
              render: (e) =>
                l("div", { style: "display: flex; align-items: center; gap: 8px;" }, [
                  l(se, {
                    src: e.loginUrl,
                    round: !0,
                    size: 32,
                    imgProps: { referrerpolicy: "no-referrer" },
                  }),
                  l("div", { style: "flex: 1; min-width: 0;" }, [
                    l(ne, { style: "font-weight: 500;" }, { default: () => e.shopName || "-" }),
                    e.merchantName
                      ? l("div", { style: "font-size: 12px; color: #999;" }, e.merchantName)
                      : null,
                  ]),
                ]),
            },
            { title: "平台", key: "platformType", width: 80, render: (e) => L(e.platformType) },
            {
              title: "状态",
              key: "loginStatus",
              width: 80,
              render: (e) =>
                l(
                  oe,
                  { type: e.loginStatus ? "success" : "default", size: "small" },
                  { default: () => (e.loginStatus ? "已登录" : "未登录") },
                ),
            },
          ],
          L = (e) =>
            ({ 4: "拼多多", 5: "抖店", 6: "快手", 7: "小红书", 8: "视频号", 11: "淘工厂" })[e] ||
            "未知",
          U = () => {
            I.value = 1;
          },
          z = (e) => {
            I.value = e;
          },
          R = (e) => {
            ((_.value = e), (I.value = 1));
          },
          V = (e) => {
            A.value = e;
          },
          W = () => {
            (n("update:show", !1),
              n("close"),
              (A.value = []),
              (k.value = "all"),
              (b.value = null),
              (x.value = ""),
              (I.value = 1));
          },
          D = () => {
            if (0 === A.value.length) return void i.warning("请选择目标店铺");
            const e = A.value
              .map((e) => {
                const l = w.value.find((l) => l.platformShopId === e);
                return {
                  id: null == l ? void 0 : l.id,
                  platformShopId: String(e),
                  platformType: (null == l ? void 0 : l.platformType) || "",
                };
              })
              .filter((e) => e.id);
            ((A.value = []),
              (k.value = "all"),
              (b.value = null),
              (x.value = ""),
              (I.value = 1),
              n("confirm", e));
          };
        return (
          v(
            () => a.show,
            (e) => {
              e &&
                (async () => {
                  f.value = !0;
                  try {
                    let e = await q();
                    ((e = e.filter((e) => 1 !== e.status && (!e.baseqa || "2" != e.baseqa))),
                      (e = e.filter(
                        (e) =>
                          "7" == e.platformType ||
                          "8" == e.platformType ||
                          "11" == e.platformType ||
                          "6" == e.platformType ||
                          "5" == e.platformType ||
                          "4" == e.platformType,
                      )),
                      (w.value = e || []));
                  } catch (e) {
                    w.value = [];
                  } finally {
                    f.value = !1;
                  }
                })();
            },
          ),
          (e, l) => {
            const t = te,
              s = ae,
              n = F,
              i = J,
              c = Z,
              p = X,
              v = Y;
            return (
              r(),
              m(
                v,
                {
                  show: y.value,
                  "onUpdate:show": l[5] || (l[5] = (e) => (y.value = e)),
                  width: 700,
                  placement: "right",
                  closable: !0,
                  "mask-closable": !1,
                },
                {
                  default: g(() => [
                    h(
                      p,
                      { title: "复制基础到其他店铺" },
                      {
                        default: g(() => [
                          o("div", qe, [
                            o("div", We, [
                              h(
                                t,
                                {
                                  value: k.value,
                                  "onUpdate:value": [l[0] || (l[0] = (e) => (k.value = e)), U],
                                  placeholder: "登录状态",
                                  options: j,
                                  clearable: "",
                                  style: { width: "140px" },
                                },
                                null,
                                8,
                                ["value"],
                              ),
                              S.value
                                ? (r(),
                                  m(
                                    t,
                                    {
                                      key: 0,
                                      value: b.value,
                                      "onUpdate:value": [l[1] || (l[1] = (e) => (b.value = e)), U],
                                      placeholder: "选择商家",
                                      options: M.value,
                                      clearable: "",
                                      filterable: "",
                                      style: { width: "160px" },
                                    },
                                    null,
                                    8,
                                    ["value", "options"],
                                  ))
                                : u("", !0),
                              h(
                                s,
                                {
                                  value: x.value,
                                  "onUpdate:value": [l[2] || (l[2] = (e) => (x.value = e)), U],
                                  placeholder: "搜索店铺名称",
                                  clearable: "",
                                  style: { width: "200px" },
                                },
                                null,
                                8,
                                ["value"],
                              ),
                            ]),
                            h(
                              n,
                              {
                                "checked-row-keys": A.value,
                                "onUpdate:checkedRowKeys": [
                                  l[3] || (l[3] = (e) => (A.value = e)),
                                  V,
                                ],
                                columns: P,
                                data: B.value,
                                loading: f.value,
                                "row-key": (e) => e.platformShopId,
                                bordered: !1,
                                "flex-height": "",
                                size: "small",
                                class: "shop-table",
                              },
                              null,
                              8,
                              ["checked-row-keys", "data", "loading", "row-key"],
                            ),
                            o("div", De, [
                              o("span", Ee, "已选择 " + d(A.value.length) + " 个店铺", 1),
                              h(
                                i,
                                {
                                  page: I.value,
                                  "onUpdate:page": [l[4] || (l[4] = (e) => (I.value = e)), z],
                                  "page-size": _.value,
                                  "item-count": T.value.length,
                                  "page-sizes": [10, 20, 50],
                                  "show-size-picker": "",
                                  "onUpdate:pageSize": R,
                                },
                                null,
                                8,
                                ["page", "page-size", "item-count"],
                              ),
                            ]),
                          ]),
                        ]),
                        footer: g(() => [
                          o("div", Ke, [
                            h(
                              c,
                              { quaternary: "", disabled: a.loading, onClick: W },
                              { default: g(() => [...(l[6] || (l[6] = [C("取消", -1)]))]), _: 1 },
                              8,
                              ["disabled"],
                            ),
                            h(
                              c,
                              {
                                type: "primary",
                                disabled: 0 === A.value.length,
                                loading: a.loading,
                                onClick: D,
                              },
                              {
                                default: g(() => [...(l[7] || (l[7] = [C(" 确认复制 ", -1)]))]),
                                _: 1,
                              },
                              8,
                              ["disabled", "loading"],
                            ),
                          ]),
                        ]),
                        _: 1,
                      },
                    ),
                  ]),
                  _: 1,
                },
                8,
                ["show"],
              )
            );
          }
        );
      },
    }),
    [["__scopeId", "data-v-9eec7fc0"]],
  ),
  Oe = "" + new URL("peizhi-DmG8OEHk.png", import.meta.url).href,
  Ge = "" + new URL("overBj-BEwgnx-Z.png", import.meta.url).href,
  $e = "" + new URL("overIcon-pgf_kw0d.png", import.meta.url).href,
  Fe = { class: "fullscreen-container" },
  Je = { class: "modal-box" },
  Xe = { class: "shop-info-header" },
  Ye = { class: "shop-info-main" },
  el = { class: "shop-info-text" },
  ll = { class: "shop-info-row" },
  tl = { class: "shop-name" },
  al = { class: "shop-platform" },
  sl = ["src", "alt"],
  nl = { class: "stepBar" },
  ol = { class: "knowledge-modal-content" },
  il = { class: "configuration" },
  rl = { key: 1, class: "guide-panel content-animate" },
  cl = { class: "guide-hero" },
  ul = { class: "guide-copy" },
  dl = { class: "baseqa-index" },
  pl = { class: "baseqa-title" },
  vl = { class: "table-content" },
  ml = ["onClick"],
  gl = { class: "selected-tags" },
  hl = ["onClick"],
  Cl = ["onUpdate:modelValue", "placeholder", "onBlur", "onKeydown"],
  yl = ["onMousedown"],
  fl = { key: 1, class: "single-select-group" },
  wl = ["onClick"],
  kl = { key: 1, class: "single-select-group" },
  bl = ["onClick"],
  xl = { class: "baseqa-index" },
  Il = { class: "baseqa-title" },
  _l = { class: "table-content" },
  Al = ["onClick"],
  Sl = { class: "selected-tags" },
  jl = ["onClick"],
  Ml = ["onUpdate:modelValue", "placeholder", "onBlur", "onKeydown"],
  Tl = ["onMousedown"],
  Bl = { key: 1, class: "single-select-group" },
  Pl = ["onClick"],
  Ll = { key: 1, class: "single-select-group" },
  Ul = ["onClick"],
  zl = { key: 4, class: "content-animate zhuanren-gong-config" },
  Rl = { class: "config-section" },
  Vl = { class: "section-header" },
  Hl = { class: "section-actions" },
  Nl = { class: "section-body" },
  Zl = { class: "config-section" },
  ql = { class: "section-body" },
  Wl = { class: "single-select-group human-reply-options" },
  Dl = ["disabled"],
  El = { key: 0, class: "sub-config" },
  Kl = { key: 5, class: "config-sections content-animate zhuanren-gong-config" },
  Ql = { class: "config-section" },
  Ol = { class: "section-body ai-setting-body" },
  Gl = { class: "radio-item" },
  $l = { class: "radio-item" },
  Fl = { class: "config-section" },
  Jl = { class: "section-body ai-setting-body" },
  Xl = { class: "guide-hero" },
  Yl = { class: "guide-copy complete-copy" },
  et = { class: "modal-footer" },
  lt = { class: "modal-actions" },
  tt = V(
    e({
      __name: "modal",
      setup(e) {
        const t = N(),
          v = p([]),
          j = H(),
          M = p(1),
          T = p({
            id: 0,
            shopName: "",
            platformType: "",
            loginUrl: "",
            platformShopId: "",
            baseqa: "",
          }),
          B = p(""),
          P = p(!1),
          { showMessage: L } = ve(),
          U = ["淘工厂", "视频号"],
          z = p({
            isEnabled: !1,
            aiReplyStrategy: "AI_RGA",
            aiHumanReplyType: 0,
            subAccount: "",
            aiSensitiveWords: [],
            aiReplyFlag: "~",
            aiWorkMode: 0,
          }),
          R = {
            afterSales: {
              name: "售后服务",
              keywords: ["退货", "退款", "换货", "发错货", "少发", "破损", "退差价", "申请售后"],
            },
            complaint: {
              name: "投诉相关",
              keywords: ["投诉", "差评", "举报", "骗人", "欺诈", "虚假宣传", "态度差", "不满意"],
            },
          },
          V = (e) => {
            switch (e) {
              case "拼多多":
                return ue;
              case "抖店":
                return ce;
              case "快手":
                return re;
              case "淘工厂":
                return pe;
              case "视频号":
                return ie;
              case "小红书":
                return de;
            }
          },
          q = s(() => st(T.value.platformType)),
          Q = s(() => U.includes(q.value)),
          $ = p(!1),
          F = p([]),
          J = p([]),
          X = p([]),
          Y = p(!1),
          te = p(null),
          ne = new Map(),
          Ie = (e) =>
            2 === e.optionType
              ? e.selectedPreset || []
              : e.selectedPreset
                ? [e.selectedPreset]
                : [],
          _e = (e) => {
            var l, t;
            const a =
              (null == (t = null == (l = null == e ? void 0 : e.title) ? void 0 : l.trim)
                ? void 0
                : t.call(l)) || "";
            return a
              ? a.startsWith("请选择") || a.startsWith("请输入")
                ? a
                : `请选择${a}`
              : "请选择答案";
          },
          Se = (e, l) =>
            2 === e.optionType ? (e.selectedPreset || []).includes(l) : e.selectedPreset === l,
          je = (e, l) =>
            "自定义" === l
              ? e.isCustomInputting || Me(e)
              : e.selectedPreset === l && !e.isCustomInputting,
          Me = (e) => {
            var l;
            return (
              !(2 === e.optionType || e.isCustomInputting || !e.selectedPreset) &&
              !(null == (l = e.presetAnswers)
                ? void 0
                : l.some((l) => l.value === e.selectedPreset))
            );
          },
          Be = (e, l) => ("自定义" === l && Me(e) ? e.selectedPreset : l),
          Pe = (e) => {
            (e.showDropdown ||
              [...J.value, ...X.value].forEach((l) => {
                l !== e && (l.showDropdown = !1);
              }),
              (e.showDropdown = !e.showDropdown));
          },
          Le = (e, l) => {
            (null == e ? void 0 : e.id) && (l ? ne.set(e.id, l) : ne.delete(e.id));
          },
          Ue = async (e, l = "") => {
            var t, a;
            ((e.isCustomInputting = !0),
              (e.customInput = l),
              (e.selectedPreset = ""),
              (e.QAcontent = ""),
              await S(),
              null == (a = null == (t = ne.get(e.id)) ? void 0 : t.focus) || a.call(t));
          },
          ze = (e, l) => {
            if ("自定义" === l) return Me(e) ? void qe(e) : void Ue(e);
            ((e.isCustomInputting = !1), (e.customInput = ""), Re(e, l));
          },
          Re = (e, l) => {
            if (2 === e.optionType) {
              e.selectedPreset || (e.selectedPreset = []);
              const t = e.selectedPreset.indexOf(l);
              (t > -1 ? e.selectedPreset.splice(t, 1) : e.selectedPreset.push(l),
                (e.QAcontent = e.selectedPreset.join(",")),
                (e.customInput = ""));
            } else {
              if ("自定义" === l)
                return (
                  (e.isCustomInputting = !0),
                  (e.selectedPreset = ""),
                  void (e.QAcontent = "")
                );
              ((e.isCustomInputting = !1),
                (e.selectedPreset = l),
                (e.QAcontent = l),
                (e.showDropdown = !1));
            }
          },
          Ve = (e, l) => {
            if (2 === e.optionType) {
              const t = e.selectedPreset.indexOf(l);
              (t > -1 && e.selectedPreset.splice(t, 1), (e.QAcontent = e.selectedPreset.join(",")));
            } else ((e.selectedPreset = ""), (e.QAcontent = ""));
          },
          He = (e) => {
            var l;
            const t = (null == (l = e.customInput) ? void 0 : l.trim().toLowerCase()) || "",
              a = (e.presetAnswers || []).filter((e) => "自定义" !== e.value);
            return t ? a.filter((e) => String(e.value).toLowerCase().includes(t)) : a;
          },
          Ne = (e) => {
            var l;
            const t = null == (l = e.customInput) ? void 0 : l.trim();
            if (!t && 2 !== e.optionType)
              return (
                (e.QAcontent = ""),
                (e.selectedPreset = ""),
                (e.isCustomInputting = !1),
                (e.customInput = ""),
                void (e.showDropdown = !1)
              );
            t &&
              (2 === e.optionType
                ? (e.selectedPreset || (e.selectedPreset = []),
                  e.selectedPreset.includes(t) ||
                    (e.selectedPreset.push(t), (e.QAcontent = e.selectedPreset.join(","))))
                : ((e.isCustomInputting = !1),
                  (e.selectedPreset = t),
                  (e.QAcontent = t),
                  (e.customInput = t)),
              (e.showDropdown = !1),
              2 === e.optionType && (e.customInput = ""));
          },
          qe = (e) => {
            Ue(e, e.selectedPreset || "");
          },
          We = (e, l) => {
            if (!e.customInput && e.selectedPreset && e.selectedPreset.length > 0) {
              l.preventDefault();
              const t = e.selectedPreset[e.selectedPreset.length - 1];
              Ve(e, t);
            }
          },
          De = (e) => {
            try {
              if (!e) return [];
              const l = JSON.parse(e);
              if (Array.isArray(l)) {
                const e = l
                  .map((e) => {
                    var l, t;
                    return null ==
                      (t = null == (l = null == e ? void 0 : e.answer) ? void 0 : l.trim)
                      ? void 0
                      : t.call(l);
                  })
                  .filter((e) => Boolean(e))
                  .map((e) => ({ label: e, value: e }));
                if (0 === e.length) return [];
                return [...[{ label: "自定义", value: "自定义" }], ...e];
              }
            } catch (l) {}
            return [];
          },
          Ee = s(() =>
            Object.entries(R).map(([e, t]) => ({
              key: e,
              label: t.name,
              children: [
                {
                  key: `${e}-preview`,
                  type: "render",
                  render: () =>
                    l("div", { style: { padding: "8px 12px", maxWidth: "300px" } }, [
                      l(
                        "div",
                        { style: { fontSize: "12px", color: "#666", marginBottom: "6px" } },
                        "包含关键词：",
                      ),
                      l(
                        "div",
                        { style: { display: "flex", flexWrap: "wrap", gap: "4px" } },
                        t.keywords.map((e) =>
                          l(
                            oe,
                            { size: "small", type: "info", bordered: !1 },
                            { default: () => e },
                          ),
                        ),
                      ),
                    ]),
                },
                { key: `${e}-add`, label: `✓ 添加这组关键词（${t.keywords.length}个）` },
              ],
            })),
          ),
          Ke = (e) => {
            if (e.endsWith("-add")) {
              const l = e.replace("-add", ""),
                t = R[l];
              if (t) {
                Array.isArray(z.value.aiSensitiveWords) || (z.value.aiSensitiveWords = []);
                const e = t.keywords.filter((e) => !z.value.aiSensitiveWords.includes(e));
                (z.value.aiSensitiveWords.push(...e), L.success(`已添加 ${e.length} 个关键词`));
              }
            }
          },
          tt = () => {
            var e;
            const l = (null == (e = z.value.aiSensitiveWords) ? void 0 : e.length) || 0;
            ((z.value.aiSensitiveWords = []), L.success(`已清空 ${l} 个关键词`));
          },
          at = async (e) => {
            P.value = !0;
            try {
              if (((F.value = [...J.value, ...X.value]), v.value.length > 0)) {
                const e = await ge(v.value);
                if (e.length > 0) {
                  const l = e || [];
                  F.value = l.map((e) => ({
                    title: e.title,
                    content: e.content,
                    status: "1",
                    titleType: e.titleType,
                    titleVector: e.titleVector,
                  }));
                }
              }
              const l = e.flatMap((e) =>
                F.value.map((l) => ({
                  shopId: e.platformShopId,
                  platformType: e.platformType,
                  ...l,
                })),
              );
              l.length > 0 && (await K({ ids: e.map((e) => e.id), baseqa: "2" }), await he(l));
              const t = e.map((e) => e.id);
              ((Y.value = !1),
                (z.value.isEnabled = !0),
                W.postMessage(
                  "close-modal-save-data",
                  JSON.stringify({
                    ids: [T.value.id, ...t],
                    config: z.value,
                    success: !0,
                    showGuide: !0,
                  }),
                ),
                gt());
            } catch (l) {
              j.error("复制失败，请重试");
            } finally {
              P.value = !1;
            }
          },
          st = (e) =>
            ({ 4: "拼多多", 5: "抖店", 6: "快手", 7: "小红书", 11: "淘工厂", 8: "视频号" })[e] ||
            "拼多多",
          nt = (e) => {
            Q.value && 2 === e ? (z.value.aiHumanReplyType = 0) : (z.value.aiHumanReplyType = e);
          },
          ot = p(!1),
          it = async () => {
            ot.value ||
              ((ot.value = !0),
              (ot.value = !1),
              (M.value = 1),
              W.postMessage("close-modal-save-data", "false"),
              gt());
          },
          rt = async () => {
            P.value = !0;
            try {
              return (
                (F.value = [...J.value, ...X.value]),
                F.value.filter((e) => {
                  var l;
                  return !(null == (l = e.QAcontent) ? void 0 : l.trim());
                }).length > 0 && (j.warning("请填写所有问答项的答案"), 1)
                  ? void (P.value = !1)
                  : (await ct(), !0)
              );
            } catch (e) {
              return (j.error("保存失败，请重试"), !1);
            } finally {
              P.value = !1;
            }
          },
          ct = async () => {
            F.value = [...J.value, ...X.value];
            const e = F.value.map((e) => ({
                shopId: T.value.platformShopId.toString(),
                title: e.title,
                content: e.QAcontent,
                status: "1",
                titleType: e.dictValue,
                platformType: T.value.platformType,
              })),
              l = await he(e);
            (l.primaryKeys.length > 0 && (v.value = l.primaryKeys),
              (T.value.baseqa = "2"),
              await K({ ids: [T.value.id], baseqa: "2" }));
          },
          ut = async () => {
            Y.value = !0;
          },
          dt = async () => {
            ((z.value.isEnabled = !0),
              W.postMessage(
                "close-modal-save-data",
                JSON.stringify({ ids: [T.value.id], config: z.value, success: !0, showGuide: !0 }),
              ),
              gt());
          },
          pt = () => {
            ((z.value.isEnabled = !0),
              W.postMessage(
                "close-modal-save-data",
                JSON.stringify({ ids: [T.value.id], config: z.value, success: !0, showGuide: !0 }),
              ),
              gt());
          },
          vt = async () => {
            var e;
            if (5 === M.value) {
              if (!(await rt())) return;
            }
            ((M.value += 1),
              await S(),
              null == (e = te.value) || e.scrollTo({ top: 0, behavior: "auto" }));
          },
          mt = async () => {
            var e;
            M.value > 1 &&
              ((M.value -= 1),
              await S(),
              null == (e = te.value) || e.scrollTo({ top: 0, behavior: "auto" }));
          },
          gt = () => {
            ((M.value = 1),
              (F.value = []),
              ($.value = !1),
              (z.value = {
                isEnabled: !1,
                aiReplyStrategy: "AI_RGA",
                aiHumanReplyType: 0,
                subAccount: "",
                aiSensitiveWords: [],
                aiReplyFlag: "~",
                aiWorkMode: 0,
              }));
          },
          ht = (e) => {
            !e.target.closest(".multi-select-box") &&
              [...J.value, ...X.value].forEach((e) => {
                e.showDropdown = !1;
              });
          };
        return (
          y(async () => {
            document.addEventListener("click", ht);
            const e = await W.invoke("tool-window-ready", "modal");
            if ((e.token && (t.setToken(e.token), await t.getUserInfo().catch(() => {})), e.data)) {
              const l = "string" == typeof e.data ? JSON.parse(e.data) : e.data,
                { form: t, title: a } = l,
                s = "string" == typeof t ? JSON.parse(t) : t,
                n = await D(s.id);
              ((T.value = {
                id: n.id,
                platformShopId: n.platformShopId,
                shopName: n.shopName || "",
                platformType: n.platformType || "",
                loginUrl: n.loginUrl,
                baseqa: n.baseqa || "0",
              }),
                (B.value = a),
                (async () => {
                  $.value = !0;
                  try {
                    const [e, l] = await Promise.all([me(1), me(2)]);
                    ((J.value = (e || []).map((e) => ({
                      ...e,
                      QAcontent: "",
                      selectedPreset: 2 === e.optionType ? [] : "",
                      presetAnswers: De(e.content),
                      showDropdown: !1,
                      customInput: "",
                      isCustomInputting: !1,
                    }))),
                      (X.value = (l || []).map((e) => ({
                        ...e,
                        QAcontent: "",
                        selectedPreset: 2 === e.optionType ? [] : "",
                        presetAnswers: De(e.content),
                        showDropdown: !1,
                        customInput: "",
                        isCustomInputting: !1,
                      }))));
                  } catch (e) {
                    ((J.value = []), (X.value = []));
                  } finally {
                    $.value = !1;
                  }
                })());
            }
          }),
          f(() => {
            document.removeEventListener("click", ht);
          }),
          (e, l) => {
            var t, s;
            const p = se,
              v = Ae,
              y = E,
              f = ee,
              S = le,
              j = ye,
              L = fe,
              U = ae,
              R = we,
              H = ke,
              N = G,
              W = be,
              D = xe;
            return (
              r(),
              n("div", Fe, [
                o("div", Je, [
                  o("div", Xe, [
                    o("div", Ye, [
                      h(
                        p,
                        {
                          "img-props": { referrerpolicy: "no-referrer" },
                          round: "",
                          size: 22,
                          src: null == (t = T.value) ? void 0 : t.loginUrl,
                        },
                        null,
                        8,
                        ["src"],
                      ),
                      o("div", el, [
                        o("div", ll, [
                          o(
                            "h3",
                            tl,
                            d((null == (s = T.value) ? void 0 : s.shopName) || B.value),
                            1,
                          ),
                          o("p", al, [
                            V(q.value)
                              ? (r(),
                                n(
                                  "img",
                                  {
                                    key: 0,
                                    class: "shop-platform-logo",
                                    src: V(q.value),
                                    alt: q.value,
                                  },
                                  null,
                                  8,
                                  sl,
                                ))
                              : u("", !0),
                            o("span", null, d(q.value), 1),
                          ]),
                        ]),
                      ]),
                    ]),
                    h(
                      w(Z),
                      { quaternary: "", circle: "", class: "close-btn", onClick: it },
                      {
                        icon: g(() => [
                          h(
                            w(Ce),
                            { size: "20" },
                            {
                              default: g(() => [
                                ...(l[10] ||
                                  (l[10] = [
                                    o(
                                      "svg",
                                      {
                                        xmlns: "http://www.w3.org/2000/svg",
                                        viewBox: "0 0 24 24",
                                        fill: "none",
                                        stroke: "currentColor",
                                        "stroke-width": "2",
                                        "stroke-linecap": "round",
                                        "stroke-linejoin": "round",
                                      },
                                      [
                                        o("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                                        o("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
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
                  o("div", nl, [h(Ze, { "current-step": M.value }, null, 8, ["current-step"])]),
                  o("div", ol, [
                    o("div", il, [
                      o(
                        "div",
                        { ref_key: "questionsGridRef", ref: te, class: "questions-grid" },
                        [
                          $.value
                            ? (r(),
                              m(
                                S,
                                { key: 0, "x-gap": 12, "y-gap": 8, cols: 2, class: "table-box" },
                                {
                                  default: g(() => [
                                    (r(),
                                    n(
                                      a,
                                      null,
                                      i(6, (e) =>
                                        h(
                                          f,
                                          { key: e },
                                          {
                                            default: g(() => [
                                              h(
                                                y,
                                                { class: "baseqa-card" },
                                                {
                                                  default: g(() => [
                                                    h(v, { text: "", repeat: 1, height: "20px" }),
                                                    h(v, {
                                                      text: "",
                                                      repeat: 2,
                                                      height: "60px",
                                                      style: { "margin-top": "12px" },
                                                    }),
                                                  ]),
                                                  _: 1,
                                                },
                                              ),
                                            ]),
                                            _: 1,
                                          },
                                        ),
                                      ),
                                      64,
                                    )),
                                  ]),
                                  _: 1,
                                },
                              ))
                            : 1 === M.value
                              ? (r(),
                                n("div", rl, [
                                  o("div", cl, [
                                    o("div", ul, [
                                      h(
                                        j,
                                        { src: w(Oe), width: "328", style: { height: "250px" } },
                                        null,
                                        8,
                                        ["src"],
                                      ),
                                      l[11] ||
                                        (l[11] = o(
                                          "div",
                                          { class: "guide-title" },
                                          "店铺AI训练",
                                          -1,
                                        )),
                                      l[12] ||
                                        (l[12] = o(
                                          "div",
                                          { class: "guide-desc" },
                                          " 只需几分钟，完成以下设置，让AI更好地了解你的店铺，为你提供更贴心的服务和建议～ ",
                                          -1,
                                        )),
                                    ]),
                                  ]),
                                ]))
                              : 2 === M.value
                                ? (r(),
                                  m(
                                    S,
                                    {
                                      key: 2,
                                      "x-gap": 12,
                                      "y-gap": 0,
                                      cols: 1,
                                      class: "table-box content-animate",
                                    },
                                    {
                                      default: g(() => [
                                        (r(!0),
                                        n(
                                          a,
                                          null,
                                          i(
                                            J.value,
                                            (e, t) => (
                                              r(),
                                              m(
                                                f,
                                                { key: e.id },
                                                {
                                                  default: g(() => [
                                                    h(
                                                      y,
                                                      { class: "baseqa-card", bordered: !1 },
                                                      {
                                                        default: g(() => [
                                                          h(
                                                            L,
                                                            {
                                                              class: "baseqa-title-box",
                                                              align: "center",
                                                            },
                                                            {
                                                              default: g(() => [
                                                                o("span", dl, d(t + 1), 1),
                                                                o(
                                                                  "span",
                                                                  pl,
                                                                  "问题：" + d(e.title),
                                                                  1,
                                                                ),
                                                              ]),
                                                              _: 2,
                                                            },
                                                            1024,
                                                          ),
                                                          o("div", vl, [
                                                            e.presetAnswers &&
                                                            e.presetAnswers.length > 0
                                                              ? (r(),
                                                                n(
                                                                  a,
                                                                  { key: 0 },
                                                                  [
                                                                    2 === e.optionType
                                                                      ? (r(),
                                                                        n(
                                                                          "div",
                                                                          {
                                                                            key: 0,
                                                                            class:
                                                                              "multi-select-box",
                                                                            onClick: (l) => Pe(e),
                                                                          },
                                                                          [
                                                                            o("div", gl, [
                                                                              (r(!0),
                                                                              n(
                                                                                a,
                                                                                null,
                                                                                i(
                                                                                  Ie(e),
                                                                                  (t, a) => (
                                                                                    r(),
                                                                                    n(
                                                                                      "span",
                                                                                      {
                                                                                        key: a,
                                                                                        class:
                                                                                          "selected-tag",
                                                                                      },
                                                                                      [
                                                                                        o(
                                                                                          "span",
                                                                                          null,
                                                                                          d(t),
                                                                                          1,
                                                                                        ),
                                                                                        o(
                                                                                          "span",
                                                                                          {
                                                                                            class:
                                                                                              "tag-remove",
                                                                                            onClick:
                                                                                              b(
                                                                                                (
                                                                                                  l,
                                                                                                ) =>
                                                                                                  Ve(
                                                                                                    e,
                                                                                                    t,
                                                                                                  ),
                                                                                                [
                                                                                                  "stop",
                                                                                                ],
                                                                                              ),
                                                                                          },
                                                                                          [
                                                                                            ...(l[13] ||
                                                                                              (l[13] =
                                                                                                [
                                                                                                  o(
                                                                                                    "svg",
                                                                                                    {
                                                                                                      width:
                                                                                                        "16",
                                                                                                      height:
                                                                                                        "16",
                                                                                                      viewBox:
                                                                                                        "0 0 14 14",
                                                                                                      fill: "none",
                                                                                                      xmlns:
                                                                                                        "http://www.w3.org/2000/svg",
                                                                                                    },
                                                                                                    [
                                                                                                      o(
                                                                                                        "rect",
                                                                                                        {
                                                                                                          x: "11.2358",
                                                                                                          y: "1.55469",
                                                                                                          width:
                                                                                                            "1.71126",
                                                                                                          height:
                                                                                                            "13.6901",
                                                                                                          rx: "0.85563",
                                                                                                          transform:
                                                                                                            "rotate(45 11.2358 1.55469)",
                                                                                                          fill: "currentColor",
                                                                                                        },
                                                                                                      ),
                                                                                                      o(
                                                                                                        "rect",
                                                                                                        {
                                                                                                          x: "12.4453",
                                                                                                          y: "11.2383",
                                                                                                          width:
                                                                                                            "1.71126",
                                                                                                          height:
                                                                                                            "13.6901",
                                                                                                          rx: "0.85563",
                                                                                                          transform:
                                                                                                            "rotate(135 12.4453 11.2383)",
                                                                                                          fill: "currentColor",
                                                                                                        },
                                                                                                      ),
                                                                                                    ],
                                                                                                    -1,
                                                                                                  ),
                                                                                                ])),
                                                                                          ],
                                                                                          8,
                                                                                          hl,
                                                                                        ),
                                                                                      ],
                                                                                    )
                                                                                  ),
                                                                                ),
                                                                                128,
                                                                              )),
                                                                              k(
                                                                                o(
                                                                                  "input",
                                                                                  {
                                                                                    type: "text",
                                                                                    class:
                                                                                      "inline-custom-input",
                                                                                    "onUpdate:modelValue":
                                                                                      (l) =>
                                                                                        (e.customInput =
                                                                                          l),
                                                                                    placeholder:
                                                                                      Ie(e).length >
                                                                                      0
                                                                                        ? ""
                                                                                        : _e(e),
                                                                                    onBlur: (l) =>
                                                                                      Ne(e),
                                                                                    onKeydown: [
                                                                                      x(
                                                                                        (l) =>
                                                                                          Ne(e),
                                                                                        ["enter"],
                                                                                      ),
                                                                                      x(
                                                                                        (l) =>
                                                                                          We(e, l),
                                                                                        [
                                                                                          "backspace",
                                                                                        ],
                                                                                      ),
                                                                                    ],
                                                                                  },
                                                                                  null,
                                                                                  40,
                                                                                  Cl,
                                                                                ),
                                                                                [
                                                                                  [
                                                                                    I,
                                                                                    e.customInput,
                                                                                  ],
                                                                                ],
                                                                              ),
                                                                            ]),
                                                                            l[15] ||
                                                                              (l[15] = o(
                                                                                "div",
                                                                                {
                                                                                  class:
                                                                                    "dropdown-trigger",
                                                                                },
                                                                                [
                                                                                  o("span", null, [
                                                                                    o(
                                                                                      "svg",
                                                                                      {
                                                                                        width: "11",
                                                                                        height: "8",
                                                                                        viewBox:
                                                                                          "0 0 11 8",
                                                                                        fill: "none",
                                                                                        xmlns:
                                                                                          "http://www.w3.org/2000/svg",
                                                                                      },
                                                                                      [
                                                                                        o("path", {
                                                                                          d: "M4.56142 7.14667C4.88142 7.57333 5.52142 7.57333 5.84142 7.14667L10.2414 1.28C10.637 0.752614 10.2607 2.88733e-06 9.60142 2.77207e-06L0.801418 1.23343e-06C0.142182 1.11816e-06 -0.234124 0.752612 0.161417 1.28L4.56142 7.14667Z",
                                                                                          fill: "#999999",
                                                                                        }),
                                                                                      ],
                                                                                    ),
                                                                                  ]),
                                                                                ],
                                                                                -1,
                                                                              )),
                                                                            e.showDropdown
                                                                              ? (r(),
                                                                                n(
                                                                                  "div",
                                                                                  {
                                                                                    key: 0,
                                                                                    class:
                                                                                      "dropdown-options",
                                                                                    onClick:
                                                                                      l[0] ||
                                                                                      (l[0] =
                                                                                        b(() => {}, [
                                                                                          "stop",
                                                                                        ])),
                                                                                  },
                                                                                  [
                                                                                    (r(!0),
                                                                                    n(
                                                                                      a,
                                                                                      null,
                                                                                      i(
                                                                                        He(e),
                                                                                        (t) => (
                                                                                          r(),
                                                                                          n(
                                                                                            "label",
                                                                                            {
                                                                                              key: t.value,
                                                                                              class:
                                                                                                c([
                                                                                                  "dropdown-option",
                                                                                                  {
                                                                                                    selected:
                                                                                                      Se(
                                                                                                        e,
                                                                                                        t.value,
                                                                                                      ),
                                                                                                  },
                                                                                                ]),
                                                                                              onMousedown:
                                                                                                b(
                                                                                                  (
                                                                                                    l,
                                                                                                  ) =>
                                                                                                    Re(
                                                                                                      e,
                                                                                                      t.value,
                                                                                                    ),
                                                                                                  [
                                                                                                    "prevent",
                                                                                                  ],
                                                                                                ),
                                                                                            },
                                                                                            [
                                                                                              o(
                                                                                                "span",
                                                                                                null,
                                                                                                d(
                                                                                                  t.value,
                                                                                                ),
                                                                                                1,
                                                                                              ),
                                                                                              l[14] ||
                                                                                                (l[14] =
                                                                                                  o(
                                                                                                    "span",
                                                                                                    {
                                                                                                      class:
                                                                                                        "check-icon",
                                                                                                    },
                                                                                                    [
                                                                                                      o(
                                                                                                        "svg",
                                                                                                        {
                                                                                                          t: "1773969613985",
                                                                                                          class:
                                                                                                            "icon",
                                                                                                          viewBox:
                                                                                                            "0 0 1879 1024",
                                                                                                          version:
                                                                                                            "1.1",
                                                                                                          xmlns:
                                                                                                            "http://www.w3.org/2000/svg",
                                                                                                          "p-id":
                                                                                                            "5840",
                                                                                                          width:
                                                                                                            "16",
                                                                                                          height:
                                                                                                            "16",
                                                                                                        },
                                                                                                        [
                                                                                                          o(
                                                                                                            "path",
                                                                                                            {
                                                                                                              d: "M801.590751 981.530636c-19.384971 0-38.030058-7.250867-52.087861-20.420809L348.337572 587.024277c-30.039306-27.96763-31.075145-74.43237-2.36763-103.731791s76.504046-30.187283 106.543353-2.219654L795.079769 800.554913 1416.434682 65.257803c26.487861-31.223121 73.988439-35.810405 106.099422-10.062427 32.110983 25.747977 36.698266 71.916763 10.358382 103.287861L859.893642 954.894798c-13.317919 15.833526-32.850867 25.452023-53.715607 26.635838h-4.587284z",
                                                                                                              fill: "#1890ff",
                                                                                                              "p-id":
                                                                                                                "5841",
                                                                                                            },
                                                                                                          ),
                                                                                                        ],
                                                                                                      ),
                                                                                                    ],
                                                                                                    -1,
                                                                                                  )),
                                                                                            ],
                                                                                            42,
                                                                                            yl,
                                                                                          )
                                                                                        ),
                                                                                      ),
                                                                                      128,
                                                                                    )),
                                                                                  ],
                                                                                ))
                                                                              : u("", !0),
                                                                          ],
                                                                          8,
                                                                          ml,
                                                                        ))
                                                                      : (r(),
                                                                        n("div", fl, [
                                                                          (r(!0),
                                                                          n(
                                                                            a,
                                                                            null,
                                                                            i(
                                                                              e.presetAnswers,
                                                                              (t) => (
                                                                                r(),
                                                                                n(
                                                                                  "button",
                                                                                  {
                                                                                    key: t.value,
                                                                                    type: "button",
                                                                                    class: c([
                                                                                      "single-select-btn",
                                                                                      {
                                                                                        "is-active":
                                                                                          je(
                                                                                            e,
                                                                                            t.value,
                                                                                          ),
                                                                                      },
                                                                                    ]),
                                                                                    onClick: (l) =>
                                                                                      ze(
                                                                                        e,
                                                                                        t.value,
                                                                                      ),
                                                                                  },
                                                                                  [
                                                                                    l[16] ||
                                                                                      (l[16] = o(
                                                                                        "span",
                                                                                        {
                                                                                          class:
                                                                                            "single-select-icon",
                                                                                        },
                                                                                        null,
                                                                                        -1,
                                                                                      )),
                                                                                    o(
                                                                                      "span",
                                                                                      null,
                                                                                      d(
                                                                                        Be(
                                                                                          e,
                                                                                          t.value,
                                                                                        ),
                                                                                      ),
                                                                                      1,
                                                                                    ),
                                                                                  ],
                                                                                  10,
                                                                                  wl,
                                                                                )
                                                                              ),
                                                                            ),
                                                                            128,
                                                                          )),
                                                                          e.isCustomInputting
                                                                            ? (r(),
                                                                              m(
                                                                                U,
                                                                                {
                                                                                  key: 0,
                                                                                  value:
                                                                                    e.customInput,
                                                                                  "onUpdate:value":
                                                                                    (l) =>
                                                                                      (e.customInput =
                                                                                        l),
                                                                                  ref_for: !0,
                                                                                  ref: (l) =>
                                                                                    Le(e, l),
                                                                                  class:
                                                                                    "single-select-input",
                                                                                  placeholder:
                                                                                    "请输入自定义答案",
                                                                                  onBlur: (l) =>
                                                                                    Ne(e),
                                                                                  onKeydown: x(
                                                                                    b(
                                                                                      (l) => Ne(e),
                                                                                      ["prevent"],
                                                                                    ),
                                                                                    ["enter"],
                                                                                  ),
                                                                                },
                                                                                null,
                                                                                8,
                                                                                [
                                                                                  "value",
                                                                                  "onUpdate:value",
                                                                                  "onBlur",
                                                                                  "onKeydown",
                                                                                ],
                                                                              ))
                                                                            : u("", !0),
                                                                        ])),
                                                                  ],
                                                                  64,
                                                                ))
                                                              : (r(),
                                                                n("div", kl, [
                                                                  e.QAcontent &&
                                                                  !e.isCustomInputting
                                                                    ? (r(),
                                                                      n(
                                                                        "button",
                                                                        {
                                                                          key: 0,
                                                                          type: "button",
                                                                          class:
                                                                            "single-select-btn is-active",
                                                                          onClick: (l) => qe(e),
                                                                        },
                                                                        [
                                                                          l[17] ||
                                                                            (l[17] = o(
                                                                              "span",
                                                                              {
                                                                                class:
                                                                                  "single-select-icon",
                                                                              },
                                                                              null,
                                                                              -1,
                                                                            )),
                                                                          o(
                                                                            "span",
                                                                            null,
                                                                            d(e.QAcontent),
                                                                            1,
                                                                          ),
                                                                        ],
                                                                        8,
                                                                        bl,
                                                                      ))
                                                                    : (r(),
                                                                      m(
                                                                        U,
                                                                        {
                                                                          key: 1,
                                                                          value: e.customInput,
                                                                          "onUpdate:value": (l) =>
                                                                            (e.customInput = l),
                                                                          class:
                                                                            "single-select-input",
                                                                          placeholder: "请输入答案",
                                                                          onBlur: (l) => Ne(e),
                                                                          onKeydown: x(
                                                                            b(
                                                                              (l) => Ne(e),
                                                                              ["prevent"],
                                                                            ),
                                                                            ["enter"],
                                                                          ),
                                                                        },
                                                                        null,
                                                                        8,
                                                                        [
                                                                          "value",
                                                                          "onUpdate:value",
                                                                          "onBlur",
                                                                          "onKeydown",
                                                                        ],
                                                                      )),
                                                                ])),
                                                          ]),
                                                        ]),
                                                        _: 2,
                                                      },
                                                      1024,
                                                    ),
                                                  ]),
                                                  _: 2,
                                                },
                                                1024,
                                              )
                                            ),
                                          ),
                                          128,
                                        )),
                                      ]),
                                      _: 1,
                                    },
                                  ))
                                : u("", !0),
                          3 === M.value
                            ? (r(),
                              m(
                                S,
                                {
                                  key: 3,
                                  "x-gap": 12,
                                  "y-gap": 0,
                                  cols: 1,
                                  class: "table-box content-animate",
                                },
                                {
                                  default: g(() => [
                                    (r(!0),
                                    n(
                                      a,
                                      null,
                                      i(
                                        X.value,
                                        (e, t) => (
                                          r(),
                                          m(
                                            f,
                                            { key: e.id },
                                            {
                                              default: g(() => [
                                                h(
                                                  y,
                                                  { class: "baseqa-card", bordered: !1 },
                                                  {
                                                    default: g(() => [
                                                      h(
                                                        L,
                                                        {
                                                          class: "baseqa-title-box",
                                                          align: "center",
                                                        },
                                                        {
                                                          default: g(() => [
                                                            o("span", xl, d(t + 1), 1),
                                                            o("span", Il, "问题：" + d(e.title), 1),
                                                          ]),
                                                          _: 2,
                                                        },
                                                        1024,
                                                      ),
                                                      o("div", _l, [
                                                        e.presetAnswers &&
                                                        e.presetAnswers.length > 0
                                                          ? (r(),
                                                            n(
                                                              a,
                                                              { key: 0 },
                                                              [
                                                                2 === e.optionType
                                                                  ? (r(),
                                                                    n(
                                                                      "div",
                                                                      {
                                                                        key: 0,
                                                                        class: "multi-select-box",
                                                                        onClick: (l) => Pe(e),
                                                                      },
                                                                      [
                                                                        o("div", Sl, [
                                                                          (r(!0),
                                                                          n(
                                                                            a,
                                                                            null,
                                                                            i(
                                                                              Ie(e),
                                                                              (t, a) => (
                                                                                r(),
                                                                                n(
                                                                                  "span",
                                                                                  {
                                                                                    key: a,
                                                                                    class:
                                                                                      "selected-tag",
                                                                                  },
                                                                                  [
                                                                                    o(
                                                                                      "span",
                                                                                      null,
                                                                                      d(t),
                                                                                      1,
                                                                                    ),
                                                                                    o(
                                                                                      "span",
                                                                                      {
                                                                                        class:
                                                                                          "tag-remove",
                                                                                        onClick: b(
                                                                                          (l) =>
                                                                                            Ve(
                                                                                              e,
                                                                                              t,
                                                                                            ),
                                                                                          ["stop"],
                                                                                        ),
                                                                                      },
                                                                                      [
                                                                                        ...(l[18] ||
                                                                                          (l[18] = [
                                                                                            o(
                                                                                              "svg",
                                                                                              {
                                                                                                width:
                                                                                                  "16",
                                                                                                height:
                                                                                                  "16",
                                                                                                viewBox:
                                                                                                  "0 0 14 14",
                                                                                                fill: "none",
                                                                                                xmlns:
                                                                                                  "http://www.w3.org/2000/svg",
                                                                                              },
                                                                                              [
                                                                                                o(
                                                                                                  "rect",
                                                                                                  {
                                                                                                    x: "11.2358",
                                                                                                    y: "1.55469",
                                                                                                    width:
                                                                                                      "1.71126",
                                                                                                    height:
                                                                                                      "13.6901",
                                                                                                    rx: "0.85563",
                                                                                                    transform:
                                                                                                      "rotate(45 11.2358 1.55469)",
                                                                                                    fill: "currentColor",
                                                                                                  },
                                                                                                ),
                                                                                                o(
                                                                                                  "rect",
                                                                                                  {
                                                                                                    x: "12.4453",
                                                                                                    y: "11.2383",
                                                                                                    width:
                                                                                                      "1.71126",
                                                                                                    height:
                                                                                                      "13.6901",
                                                                                                    rx: "0.85563",
                                                                                                    transform:
                                                                                                      "rotate(135 12.4453 11.2383)",
                                                                                                    fill: "currentColor",
                                                                                                  },
                                                                                                ),
                                                                                              ],
                                                                                              -1,
                                                                                            ),
                                                                                          ])),
                                                                                      ],
                                                                                      8,
                                                                                      jl,
                                                                                    ),
                                                                                  ],
                                                                                )
                                                                              ),
                                                                            ),
                                                                            128,
                                                                          )),
                                                                          k(
                                                                            o(
                                                                              "input",
                                                                              {
                                                                                type: "text",
                                                                                class:
                                                                                  "inline-custom-input",
                                                                                "onUpdate:modelValue":
                                                                                  (l) =>
                                                                                    (e.customInput =
                                                                                      l),
                                                                                placeholder:
                                                                                  Ie(e).length > 0
                                                                                    ? ""
                                                                                    : _e(e),
                                                                                onBlur: (l) =>
                                                                                  Ne(e),
                                                                                onKeydown: [
                                                                                  x(
                                                                                    (l) => Ne(e),
                                                                                    ["enter"],
                                                                                  ),
                                                                                  x(
                                                                                    (l) => We(e, l),
                                                                                    ["backspace"],
                                                                                  ),
                                                                                ],
                                                                              },
                                                                              null,
                                                                              40,
                                                                              Ml,
                                                                            ),
                                                                            [[I, e.customInput]],
                                                                          ),
                                                                        ]),
                                                                        l[20] ||
                                                                          (l[20] = o(
                                                                            "div",
                                                                            {
                                                                              class:
                                                                                "dropdown-trigger",
                                                                            },
                                                                            [o("span", null, "▼")],
                                                                            -1,
                                                                          )),
                                                                        e.showDropdown
                                                                          ? (r(),
                                                                            n(
                                                                              "div",
                                                                              {
                                                                                key: 0,
                                                                                class:
                                                                                  "dropdown-options",
                                                                                onClick:
                                                                                  l[1] ||
                                                                                  (l[1] =
                                                                                    b(() => {}, [
                                                                                      "stop",
                                                                                    ])),
                                                                              },
                                                                              [
                                                                                (r(!0),
                                                                                n(
                                                                                  a,
                                                                                  null,
                                                                                  i(
                                                                                    He(e),
                                                                                    (t) => (
                                                                                      r(),
                                                                                      n(
                                                                                        "label",
                                                                                        {
                                                                                          key: t.value,
                                                                                          class: c([
                                                                                            "dropdown-option",
                                                                                            {
                                                                                              selected:
                                                                                                Se(
                                                                                                  e,
                                                                                                  t.value,
                                                                                                ),
                                                                                            },
                                                                                          ]),
                                                                                          onMousedown:
                                                                                            b(
                                                                                              (l) =>
                                                                                                Re(
                                                                                                  e,
                                                                                                  t.value,
                                                                                                ),
                                                                                              [
                                                                                                "prevent",
                                                                                              ],
                                                                                            ),
                                                                                        },
                                                                                        [
                                                                                          o(
                                                                                            "span",
                                                                                            null,
                                                                                            d(
                                                                                              t.value,
                                                                                            ),
                                                                                            1,
                                                                                          ),
                                                                                          l[19] ||
                                                                                            (l[19] =
                                                                                              o(
                                                                                                "span",
                                                                                                {
                                                                                                  class:
                                                                                                    "check-icon",
                                                                                                },
                                                                                                [
                                                                                                  o(
                                                                                                    "svg",
                                                                                                    {
                                                                                                      t: "1773969613985",
                                                                                                      class:
                                                                                                        "icon",
                                                                                                      viewBox:
                                                                                                        "0 0 1879 1024",
                                                                                                      version:
                                                                                                        "1.1",
                                                                                                      xmlns:
                                                                                                        "http://www.w3.org/2000/svg",
                                                                                                      "p-id":
                                                                                                        "5840",
                                                                                                      width:
                                                                                                        "16",
                                                                                                      height:
                                                                                                        "16",
                                                                                                    },
                                                                                                    [
                                                                                                      o(
                                                                                                        "path",
                                                                                                        {
                                                                                                          d: "M801.590751 981.530636c-19.384971 0-38.030058-7.250867-52.087861-20.420809L348.337572 587.024277c-30.039306-27.96763-31.075145-74.43237-2.36763-103.731791s76.504046-30.187283 106.543353-2.219654L795.079769 800.554913 1416.434682 65.257803c26.487861-31.223121 73.988439-35.810405 106.099422-10.062427 32.110983 25.747977 36.698266 71.916763 10.358382 103.287861L859.893642 954.894798c-13.317919 15.833526-32.850867 25.452023-53.715607 26.635838h-4.587284z",
                                                                                                          fill: "#1890ff",
                                                                                                          "p-id":
                                                                                                            "5841",
                                                                                                        },
                                                                                                      ),
                                                                                                    ],
                                                                                                  ),
                                                                                                ],
                                                                                                -1,
                                                                                              )),
                                                                                        ],
                                                                                        42,
                                                                                        Tl,
                                                                                      )
                                                                                    ),
                                                                                  ),
                                                                                  128,
                                                                                )),
                                                                              ],
                                                                            ))
                                                                          : u("", !0),
                                                                      ],
                                                                      8,
                                                                      Al,
                                                                    ))
                                                                  : (r(),
                                                                    n("div", Bl, [
                                                                      (r(!0),
                                                                      n(
                                                                        a,
                                                                        null,
                                                                        i(
                                                                          e.presetAnswers,
                                                                          (t) => (
                                                                            r(),
                                                                            n(
                                                                              "button",
                                                                              {
                                                                                key: t.value,
                                                                                type: "button",
                                                                                class: c([
                                                                                  "single-select-btn",
                                                                                  {
                                                                                    "is-active": je(
                                                                                      e,
                                                                                      t.value,
                                                                                    ),
                                                                                  },
                                                                                ]),
                                                                                onClick: (l) =>
                                                                                  ze(e, t.value),
                                                                              },
                                                                              [
                                                                                l[21] ||
                                                                                  (l[21] = o(
                                                                                    "span",
                                                                                    {
                                                                                      class:
                                                                                        "single-select-icon",
                                                                                    },
                                                                                    null,
                                                                                    -1,
                                                                                  )),
                                                                                o(
                                                                                  "span",
                                                                                  null,
                                                                                  d(Be(e, t.value)),
                                                                                  1,
                                                                                ),
                                                                              ],
                                                                              10,
                                                                              Pl,
                                                                            )
                                                                          ),
                                                                        ),
                                                                        128,
                                                                      )),
                                                                      e.isCustomInputting
                                                                        ? (r(),
                                                                          m(
                                                                            U,
                                                                            {
                                                                              key: 0,
                                                                              value: e.customInput,
                                                                              "onUpdate:value": (
                                                                                l,
                                                                              ) =>
                                                                                (e.customInput = l),
                                                                              ref_for: !0,
                                                                              ref: (l) => Le(e, l),
                                                                              class:
                                                                                "single-select-input",
                                                                              placeholder:
                                                                                "请输入自定义答案",
                                                                              onBlur: (l) => Ne(e),
                                                                              onKeydown: x(
                                                                                b(
                                                                                  (l) => Ne(e),
                                                                                  ["prevent"],
                                                                                ),
                                                                                ["enter"],
                                                                              ),
                                                                            },
                                                                            null,
                                                                            8,
                                                                            [
                                                                              "value",
                                                                              "onUpdate:value",
                                                                              "onBlur",
                                                                              "onKeydown",
                                                                            ],
                                                                          ))
                                                                        : u("", !0),
                                                                    ])),
                                                              ],
                                                              64,
                                                            ))
                                                          : (r(),
                                                            n("div", Ll, [
                                                              e.QAcontent && !e.isCustomInputting
                                                                ? (r(),
                                                                  n(
                                                                    "button",
                                                                    {
                                                                      key: 0,
                                                                      type: "button",
                                                                      class:
                                                                        "single-select-btn is-active",
                                                                      onClick: (l) => qe(e),
                                                                    },
                                                                    [
                                                                      l[22] ||
                                                                        (l[22] = o(
                                                                          "span",
                                                                          {
                                                                            class:
                                                                              "single-select-icon",
                                                                          },
                                                                          null,
                                                                          -1,
                                                                        )),
                                                                      o(
                                                                        "span",
                                                                        null,
                                                                        d(e.QAcontent),
                                                                        1,
                                                                      ),
                                                                    ],
                                                                    8,
                                                                    Ul,
                                                                  ))
                                                                : (r(),
                                                                  m(
                                                                    U,
                                                                    {
                                                                      key: 1,
                                                                      value: e.customInput,
                                                                      "onUpdate:value": (l) =>
                                                                        (e.customInput = l),
                                                                      class: "single-select-input",
                                                                      placeholder: "请输入答案",
                                                                      onBlur: (l) => Ne(e),
                                                                      onKeydown: x(
                                                                        b(
                                                                          (l) => Ne(e),
                                                                          ["prevent"],
                                                                        ),
                                                                        ["enter"],
                                                                      ),
                                                                    },
                                                                    null,
                                                                    8,
                                                                    [
                                                                      "value",
                                                                      "onUpdate:value",
                                                                      "onBlur",
                                                                      "onKeydown",
                                                                    ],
                                                                  )),
                                                            ])),
                                                      ]),
                                                    ]),
                                                    _: 2,
                                                  },
                                                  1024,
                                                ),
                                              ]),
                                              _: 2,
                                            },
                                            1024,
                                          )
                                        ),
                                      ),
                                      128,
                                    )),
                                  ]),
                                  _: 1,
                                },
                              ))
                            : u("", !0),
                          4 === M.value
                            ? (r(),
                              n("div", zl, [
                                o("div", Rl, [
                                  o("div", Vl, [
                                    l[25] ||
                                      (l[25] = o(
                                        "div",
                                        { class: "section-title-group" },
                                        [
                                          o("div", { class: "section-title" }, "关键词转人工"),
                                          o(
                                            "div",
                                            { class: "section-desc section-desc-inline" },
                                            " 设置需要转人工的关键词 ",
                                          ),
                                        ],
                                        -1,
                                      )),
                                    o("div", Hl, [
                                      h(
                                        R,
                                        { trigger: "click", options: Ee.value, onSelect: Ke },
                                        {
                                          default: g(() => [
                                            h(
                                              w(Z),
                                              { size: "small", type: "primary", text: "" },
                                              {
                                                icon: g(() => [
                                                  h(w(Ce), null, {
                                                    default: g(() => [h(w(O))]),
                                                    _: 1,
                                                  }),
                                                ]),
                                                default: g(() => [
                                                  l[23] || (l[23] = C(" 添加预设词组 ", -1)),
                                                ]),
                                                _: 1,
                                              },
                                            ),
                                          ]),
                                          _: 1,
                                        },
                                        8,
                                        ["options"],
                                      ),
                                      h(H, { vertical: "" }),
                                      h(
                                        w(Z),
                                        {
                                          class: "clear-keywords-btn",
                                          size: "small",
                                          type: "error",
                                          text: "",
                                          disabled:
                                            !z.value.aiSensitiveWords ||
                                            0 === z.value.aiSensitiveWords.length,
                                          onClick: tt,
                                        },
                                        {
                                          icon: g(() => [
                                            h(w(Ce), null, { default: g(() => [h(w(Te))]), _: 1 }),
                                          ]),
                                          default: g(() => [
                                            l[24] || (l[24] = C(" 一键清空 ", -1)),
                                          ]),
                                          _: 1,
                                        },
                                        8,
                                        ["disabled"],
                                      ),
                                    ]),
                                  ]),
                                  o("div", Nl, [
                                    h(
                                      N,
                                      {
                                        value: z.value.aiSensitiveWords,
                                        "onUpdate:value":
                                          l[2] || (l[2] = (e) => (z.value.aiSensitiveWords = e)),
                                        type: "primary",
                                        class: "keyword-tags",
                                      },
                                      {
                                        trigger: g(({ activate: e, disabled: t }) => [
                                          h(
                                            w(Z),
                                            {
                                              size: "small",
                                              type: "info",
                                              dashed: "",
                                              disabled: t,
                                              onClick: (l) => e(),
                                            },
                                            {
                                              icon: g(() => [
                                                h(w(Ce), null, {
                                                  default: g(() => [h(w(O))]),
                                                  _: 1,
                                                }),
                                              ]),
                                              default: g(() => [
                                                l[26] || (l[26] = C(" 添加关键词 ", -1)),
                                              ]),
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
                                o("div", Zl, [
                                  l[31] ||
                                    (l[31] = o(
                                      "div",
                                      { class: "section-header" },
                                      [
                                        o("div", { class: "section-title-group" }, [
                                          o("div", { class: "section-title" }, "转人工"),
                                          o(
                                            "div",
                                            { class: "section-desc section-desc-inline" },
                                            " 设置触发转人工时的处理方式，可选择弹窗提醒、直接转接子账号或对会话加星标 ",
                                          ),
                                        ]),
                                      ],
                                      -1,
                                    )),
                                  o("div", ql, [
                                    o("div", Wl, [
                                      o(
                                        "button",
                                        {
                                          type: "button",
                                          class: c([
                                            "single-select-btn",
                                            { "is-active": 0 === z.value.aiHumanReplyType },
                                          ]),
                                          onClick: l[3] || (l[3] = (e) => nt(0)),
                                        },
                                        [
                                          ...(l[27] ||
                                            (l[27] = [
                                              o("span", { class: "single-select-icon" }, null, -1),
                                              o("span", null, "弹窗提示（推荐）", -1),
                                            ])),
                                        ],
                                        2,
                                      ),
                                      o(
                                        "button",
                                        {
                                          type: "button",
                                          class: c([
                                            "single-select-btn",
                                            { "is-active": 1 === z.value.aiHumanReplyType },
                                          ]),
                                          onClick: l[4] || (l[4] = (e) => nt(1)),
                                        },
                                        [
                                          ...(l[28] ||
                                            (l[28] = [
                                              o("span", { class: "single-select-icon" }, null, -1),
                                              o("span", null, "直接转接到指定子账号", -1),
                                            ])),
                                        ],
                                        2,
                                      ),
                                      o(
                                        "button",
                                        {
                                          type: "button",
                                          class: c([
                                            "single-select-btn",
                                            {
                                              "is-active": 2 === z.value.aiHumanReplyType,
                                              "is-disabled": Q.value,
                                            },
                                          ]),
                                          disabled: Q.value,
                                          onClick: l[5] || (l[5] = (e) => nt(2)),
                                        },
                                        [
                                          ...(l[29] ||
                                            (l[29] = [
                                              o("span", { class: "single-select-icon" }, null, -1),
                                              o("span", null, "仅做星标标记", -1),
                                            ])),
                                        ],
                                        10,
                                        Dl,
                                      ),
                                    ]),
                                    1 === z.value.aiHumanReplyType
                                      ? (r(),
                                        n("div", El, [
                                          l[30] ||
                                            (l[30] = o(
                                              "div",
                                              { class: "sub-config-label" },
                                              "子账号昵称",
                                              -1,
                                            )),
                                          h(
                                            U,
                                            {
                                              value: z.value.subAccount,
                                              "onUpdate:value":
                                                l[6] || (l[6] = (e) => (z.value.subAccount = e)),
                                              placeholder: "请输入子账号昵称",
                                              clearable: "",
                                            },
                                            null,
                                            8,
                                            ["value"],
                                          ),
                                        ]))
                                      : u("", !0),
                                  ]),
                                ]),
                              ]))
                            : u("", !0),
                          5 === M.value
                            ? (r(),
                              n("div", Kl, [
                                o("div", Ql, [
                                  l[34] ||
                                    (l[34] = o(
                                      "div",
                                      { class: "section-header" },
                                      [o("div", { class: "section-title" }, "AI回复模式")],
                                      -1,
                                    )),
                                  o("div", Ol, [
                                    h(
                                      D,
                                      {
                                        value: z.value.aiReplyStrategy,
                                        "onUpdate:value":
                                          l[7] || (l[7] = (e) => (z.value.aiReplyStrategy = e)),
                                        class: "ai-mode-radio",
                                      },
                                      {
                                        default: g(() => [
                                          o("div", Gl, [
                                            h(
                                              W,
                                              { value: "AI_RGA" },
                                              {
                                                default: g(() => [
                                                  ...(l[32] ||
                                                    (l[32] = [
                                                      o(
                                                        "span",
                                                        { class: "radio-label" },
                                                        "AI全自动接待",
                                                        -1,
                                                      ),
                                                      o(
                                                        "span",
                                                        { class: "radio-desc" },
                                                        "AI会根据客户的消息进行回复",
                                                        -1,
                                                      ),
                                                    ])),
                                                ]),
                                                _: 1,
                                              },
                                            ),
                                          ]),
                                          o("div", $l, [
                                            h(
                                              W,
                                              { value: "AI_RGA_FILTER" },
                                              {
                                                default: g(() => [
                                                  ...(l[33] ||
                                                    (l[33] = [
                                                      o(
                                                        "span",
                                                        { class: "radio-label" },
                                                        "AI人机协同",
                                                        -1,
                                                      ),
                                                      o(
                                                        "span",
                                                        { class: "radio-desc" },
                                                        "AI会根据客户的消息进行回复，只回复知识库中存在的问题",
                                                        -1,
                                                      ),
                                                    ])),
                                                ]),
                                                _: 1,
                                              },
                                            ),
                                          ]),
                                        ]),
                                        _: 1,
                                      },
                                      8,
                                      ["value"],
                                    ),
                                  ]),
                                ]),
                                o("div", Fl, [
                                  l[35] ||
                                    (l[35] = o(
                                      "div",
                                      { class: "section-header" },
                                      [
                                        o("div", { class: "section-title-group" }, [
                                          o("div", { class: "section-title" }, "AI回复标识"),
                                          o(
                                            "div",
                                            { class: "section-desc section-desc-inline" },
                                            " AI每次回复都会在内容前加上这个标识符 ",
                                          ),
                                        ]),
                                      ],
                                      -1,
                                    )),
                                  o("div", Jl, [
                                    h(
                                      U,
                                      {
                                        value: z.value.aiReplyFlag,
                                        "onUpdate:value":
                                          l[8] || (l[8] = (e) => (z.value.aiReplyFlag = e)),
                                        placeholder: "请输入AI回复标识符",
                                        clearable: "",
                                        class: "ai-reply-flag-input",
                                      },
                                      null,
                                      8,
                                      ["value"],
                                    ),
                                  ]),
                                ]),
                              ]))
                            : u("", !0),
                          6 === M.value
                            ? (r(),
                              n(
                                "div",
                                {
                                  key: 6,
                                  class: "complete-step content-animate",
                                  style: _({ backgroundImage: `url(${w(Ge)})` }),
                                },
                                [
                                  o("div", Xl, [
                                    o("div", Yl, [
                                      h(
                                        j,
                                        { src: w($e), width: "328", style: { height: "250px" } },
                                        null,
                                        8,
                                        ["src"],
                                      ),
                                      l[36] ||
                                        (l[36] = o(
                                          "div",
                                          { class: "guide-title complete-title" },
                                          "太棒了！配置完成",
                                          -1,
                                        )),
                                      l[37] ||
                                        (l[37] = o(
                                          "div",
                                          { class: "guide-desc complete-desc" },
                                          " 店铺信息已完善，AI现在能更准确地回答客户问题，现在可以7×24小时智能接待客户啦 ",
                                          -1,
                                        )),
                                    ]),
                                  ]),
                                ],
                                4,
                              ))
                            : u("", !0),
                        ],
                        512,
                      ),
                    ]),
                  ]),
                  o("div", et, [
                    l[41] ||
                      (l[41] = A(
                        '<div class="warning-alert" data-v-2096a251><span class="warning-icon" data-v-2096a251><svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-2096a251><circle cx="8" cy="8" r="8" fill="#FFB72B" data-v-2096a251></circle><path d="M8 4.1C8.3866 4.1 8.7 4.4134 8.7 4.8V8.1C8.7 8.4866 8.3866 8.8 8 8.8C7.6134 8.8 7.3 8.4866 7.3 8.1V4.8C7.3 4.4134 7.6134 4.1 8 4.1Z" fill="white" data-v-2096a251></path><circle cx="8" cy="11.25" r="0.9" fill="white" data-v-2096a251></circle></svg></span><span class="warning-text" data-v-2096a251> 单店AI设置优先级高于全局设置。开启后，该店铺的AI回复和转人工将使用此配置，而不使用全局配置。 </span></div>',
                        1,
                      )),
                    o("div", lt, [
                      M.value > 1 && 6 !== M.value
                        ? (r(),
                          m(
                            w(Z),
                            { key: 0, quaternary: "", class: "cancel-btn", onClick: mt },
                            {
                              default: g(() => [...(l[38] || (l[38] = [C(" 上一步 ", -1)]))]),
                              _: 1,
                            },
                          ))
                        : u("", !0),
                      M.value < 6
                        ? (r(),
                          m(
                            w(Z),
                            {
                              key: 1,
                              type: "primary",
                              class: "save-btn",
                              loading: P.value,
                              onClick: vt,
                            },
                            {
                              default: g(() => [C(d(1 === M.value ? "开始配置" : "下一步"), 1)]),
                              _: 1,
                            },
                            8,
                            ["loading"],
                          ))
                        : u("", !0),
                      6 === M.value
                        ? (r(),
                          m(
                            w(Z),
                            {
                              key: 2,
                              quaternary: "",
                              class: "btn-cancel",
                              loading: P.value,
                              onClick: dt,
                            },
                            {
                              default: g(() => [...(l[39] || (l[39] = [C(" 直接使用 ", -1)]))]),
                              _: 1,
                            },
                            8,
                            ["loading"],
                          ))
                        : u("", !0),
                      6 === M.value
                        ? (r(),
                          m(
                            w(Z),
                            {
                              key: 3,
                              type: "primary",
                              class: "btn-confirm",
                              loading: P.value,
                              onClick: ut,
                            },
                            {
                              default: g(() => [
                                ...(l[40] || (l[40] = [C(" 复制到其他店铺 ", -1)])),
                              ]),
                              _: 1,
                            },
                            8,
                            ["loading"],
                          ))
                        : u("", !0),
                    ]),
                  ]),
                ]),
                h(
                  Qe,
                  {
                    show: Y.value,
                    "onUpdate:show": l[9] || (l[9] = (e) => (Y.value = e)),
                    "source-shop-id": T.value.id,
                    loading: P.value,
                    onConfirm: at,
                    onClose: pt,
                  },
                  null,
                  8,
                  ["show", "source-shop-id", "loading"],
                ),
              ])
            );
          }
        );
      },
    }),
    [["__scopeId", "data-v-2096a251"]],
  );
export { tt as default };
