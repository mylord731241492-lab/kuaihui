import { _ as e, c as t } from "./Tag-DD6D_Gyq.js";
import {
  x as n,
  B as s,
  N as i,
  t as o,
  T as r,
  D as a,
  c0 as c,
  v as l,
  F as d,
} from "./index-Ct5UuHQN.js";
import { _ as h } from "./Input-BbH8ts9k.js";
import { A as p } from "./Add-DB3n_hTA.js";
import { _ as u } from "./Space-D6L4c5Pi.js";
import { u as f } from "./use-locale-BcUKARuA.js";
import { u as m } from "./use-merged-state-mPE1JA5r.js";
import {
  j as E,
  k as _,
  r as S,
  t as g,
  c as T,
  x as N,
  a8 as I,
  a9 as y,
  aa as O,
  ab as C,
  ac as A,
  ad as v,
  ae as b,
  af as R,
  ag as x,
  ah as L,
  ai as M,
  aj as P,
  ak as D,
  al as k,
  am as V,
  an as w,
  ao as X,
  ap as F,
  aq as U,
  ar as B,
  as as $,
  at as H,
  au as G,
} from "./vendor-DHo7BzsC.js";
import { a as j, g as q } from "./_commonjsHelpers-Dvrxj_Zk.js";
const J = { tiny: "mini", small: "tiny", medium: "small", large: "medium", huge: "large" };
function W(e) {
  const t = J[e];
  if (void 0 === t) throw new Error(`${e} has no smaller size.`);
  return t;
}
const K = n("dynamic-tags", [n("input", { minWidth: "var(--n-input-width)" })]),
  Y = E({
    name: "DynamicTags",
    props: Object.assign(Object.assign(Object.assign({}, a.props), t), {
      size: { type: String, default: "medium" },
      closable: { type: Boolean, default: !0 },
      defaultValue: { type: Array, default: () => [] },
      value: Array,
      inputClass: String,
      inputStyle: [String, Object],
      inputProps: Object,
      max: Number,
      tagClass: String,
      tagStyle: [String, Object],
      renderTag: Function,
      onCreate: { type: Function, default: (e) => e },
      "onUpdate:value": [Function, Array],
      onUpdateValue: [Function, Array],
      onChange: [Function, Array],
    }),
    slots: Object,
    setup(e) {
      const { mergedClsPrefixRef: t, inlineThemeDisabled: n } = o(e),
        { localeRef: s } = f("DynamicTags"),
        i = r(e),
        { mergedDisabledRef: h } = i,
        p = S(""),
        u = S(!1),
        E = S(!0),
        _ = S(null),
        I = a("DynamicTags", "-dynamic-tags", K, c, e, t),
        y = S(e.defaultValue),
        O = g(e, "value"),
        C = m(O, y),
        A = T(() => s.value.add),
        v = T(() => W(e.size)),
        b = T(() => h.value || (!!e.max && C.value.length >= e.max));
      function R(t) {
        const { onChange: n, "onUpdate:value": s, onUpdateValue: o } = e,
          { nTriggerFormInput: r, nTriggerFormChange: a } = i;
        (n && d(n, t), o && d(o, t), s && d(s, t), (y.value = t), r(), a());
      }
      function x(t) {
        const n = null != t ? t : p.value;
        if (n) {
          const t = C.value.slice(0);
          (t.push(e.onCreate(n)), R(t));
        }
        ((u.value = !1), (E.value = !0), (p.value = ""));
      }
      const L = T(() => {
          const {
            self: { inputWidth: e },
          } = I.value;
          return { "--n-input-width": e };
        }),
        M = n ? l("dynamic-tags", void 0, L, e) : void 0;
      return {
        mergedClsPrefix: t,
        inputInstRef: _,
        localizedAdd: A,
        inputSize: v,
        inputValue: p,
        showInput: u,
        inputForceFocused: E,
        mergedValue: C,
        mergedDisabled: h,
        triggerDisabled: b,
        handleInputKeyDown: function (e) {
          if ("Enter" === e.key) x();
        },
        handleAddClick: function () {
          ((u.value = !0),
            N(() => {
              var e;
              (null === (e = _.value) || void 0 === e || e.focus(), (E.value = !1));
            }));
        },
        handleInputBlur: function () {
          x();
        },
        handleCloseClick: function (e) {
          const t = C.value.slice(0);
          (t.splice(e, 1), R(t));
        },
        handleInputConfirm: x,
        mergedTheme: I,
        cssVars: n ? void 0 : L,
        themeClass: null == M ? void 0 : M.themeClass,
        onRender: null == M ? void 0 : M.onRender,
      };
    },
    render() {
      const { mergedTheme: t, cssVars: n, mergedClsPrefix: o, onRender: r, renderTag: a } = this;
      return (
        null == r || r(),
        _(
          u,
          {
            class: [`${o}-dynamic-tags`, this.themeClass],
            size: "small",
            style: n,
            theme: t.peers.Space,
            themeOverrides: t.peerOverrides.Space,
            itemStyle: "display: flex;",
          },
          {
            default: () => {
              const {
                mergedTheme: t,
                tagClass: n,
                tagStyle: r,
                type: c,
                round: l,
                size: d,
                color: u,
                closable: f,
                mergedDisabled: m,
                showInput: E,
                inputValue: S,
                inputClass: g,
                inputStyle: T,
                inputSize: N,
                inputForceFocused: I,
                triggerDisabled: y,
                handleInputKeyDown: O,
                handleInputBlur: C,
                handleAddClick: A,
                handleCloseClick: v,
                handleInputConfirm: b,
                $slots: R,
              } = this;
              return this.mergedValue
                .map((s, i) =>
                  a
                    ? a(s, i)
                    : _(
                        e,
                        {
                          key: i,
                          theme: t.peers.Tag,
                          themeOverrides: t.peerOverrides.Tag,
                          class: n,
                          style: r,
                          type: c,
                          round: l,
                          size: d,
                          color: u,
                          closable: f,
                          disabled: m,
                          onClose: () => {
                            v(i);
                          },
                        },
                        { default: () => ("string" == typeof s ? s : s.label) },
                      ),
                )
                .concat(
                  E
                    ? R.input
                      ? R.input({ submit: b, deactivate: C })
                      : _(
                          h,
                          Object.assign(
                            { placeholder: "", size: N, style: T, class: g, autosize: !0 },
                            this.inputProps,
                            {
                              ref: "inputInstRef",
                              value: S,
                              onUpdateValue: (e) => {
                                this.inputValue = e;
                              },
                              theme: t.peers.Input,
                              themeOverrides: t.peerOverrides.Input,
                              onKeydown: O,
                              onBlur: C,
                              internalForceFocus: I,
                            },
                          ),
                        )
                    : R.trigger
                      ? R.trigger({ activate: A, disabled: y })
                      : _(
                          s,
                          {
                            dashed: !0,
                            disabled: y,
                            theme: t.peers.Button,
                            themeOverrides: t.peerOverrides.Button,
                            size: N,
                            onClick: A,
                          },
                          { icon: () => _(i, { clsPrefix: o }, { default: () => _(p, null) }) },
                        ),
                );
            },
          },
        )
      );
    },
  });
var z = {},
  Q = { exports: {} },
  Z = {};
/**
 * @vue/compiler-core v3.5.25
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/
const ee = Symbol(""),
  te = Symbol(""),
  ne = Symbol(""),
  se = Symbol(""),
  ie = Symbol(""),
  oe = Symbol(""),
  re = Symbol(""),
  ae = Symbol(""),
  ce = Symbol(""),
  le = Symbol(""),
  de = Symbol(""),
  he = Symbol(""),
  pe = Symbol(""),
  ue = Symbol(""),
  fe = Symbol(""),
  me = Symbol(""),
  Ee = Symbol(""),
  _e = Symbol(""),
  Se = Symbol(""),
  ge = Symbol(""),
  Te = Symbol(""),
  Ne = Symbol(""),
  Ie = Symbol(""),
  ye = Symbol(""),
  Oe = Symbol(""),
  Ce = Symbol(""),
  Ae = Symbol(""),
  ve = Symbol(""),
  be = Symbol(""),
  Re = Symbol(""),
  xe = Symbol(""),
  Le = Symbol(""),
  Me = Symbol(""),
  Pe = Symbol(""),
  De = Symbol(""),
  ke = Symbol(""),
  Ve = Symbol(""),
  we = Symbol(""),
  Xe = Symbol(""),
  Fe = {
    [ee]: "Fragment",
    [te]: "Teleport",
    [ne]: "Suspense",
    [se]: "KeepAlive",
    [ie]: "BaseTransition",
    [oe]: "openBlock",
    [re]: "createBlock",
    [ae]: "createElementBlock",
    [ce]: "createVNode",
    [le]: "createElementVNode",
    [de]: "createCommentVNode",
    [he]: "createTextVNode",
    [pe]: "createStaticVNode",
    [ue]: "resolveComponent",
    [fe]: "resolveDynamicComponent",
    [me]: "resolveDirective",
    [Ee]: "resolveFilter",
    [_e]: "withDirectives",
    [Se]: "renderList",
    [ge]: "renderSlot",
    [Te]: "createSlots",
    [Ne]: "toDisplayString",
    [Ie]: "mergeProps",
    [ye]: "normalizeClass",
    [Oe]: "normalizeStyle",
    [Ce]: "normalizeProps",
    [Ae]: "guardReactiveProps",
    [ve]: "toHandlers",
    [be]: "camelize",
    [Re]: "capitalize",
    [xe]: "toHandlerKey",
    [Le]: "setBlockTracking",
    [Me]: "pushScopeId",
    [Pe]: "popScopeId",
    [De]: "withCtx",
    [ke]: "unref",
    [Ve]: "isRef",
    [we]: "withMemo",
    [Xe]: "isMemoSame",
  };
function Ue(e) {
  Object.getOwnPropertySymbols(e).forEach((t) => {
    Fe[t] = e[t];
  });
}
const Be = {
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 1, offset: 0 },
  source: "",
};
function $e(e, t = "") {
  return {
    type: 0,
    source: t,
    children: e,
    helpers: new Set(),
    components: [],
    directives: [],
    hoists: [],
    imports: [],
    cached: [],
    temps: 0,
    codegenNode: void 0,
    loc: Be,
  };
}
function He(e, t, n, s, i, o, r, a = !1, c = !1, l = !1, d = Be) {
  return (
    e &&
      (a ? (e.helper(oe), e.helper(tt(e.inSSR, l))) : e.helper(et(e.inSSR, l)), r && e.helper(_e)),
    {
      type: 13,
      tag: t,
      props: n,
      children: s,
      patchFlag: i,
      dynamicProps: o,
      directives: r,
      isBlock: a,
      disableTracking: c,
      isComponent: l,
      loc: d,
    }
  );
}
function Ge(e, t = Be) {
  return { type: 17, loc: t, elements: e };
}
function je(e, t = Be) {
  return { type: 15, loc: t, properties: e };
}
function qe(e, t) {
  return { type: 16, loc: Be, key: O(e) ? Je(e, !0) : e, value: t };
}
function Je(e, t = !1, n = Be, s = 0) {
  return { type: 4, loc: n, content: e, isStatic: t, constType: t ? 3 : s };
}
function We(e, t = Be) {
  return { type: 8, loc: t, children: e };
}
function Ke(e, t = [], n = Be) {
  return { type: 14, loc: n, callee: e, arguments: t };
}
function Ye(e, t = void 0, n = !1, s = !1, i = Be) {
  return { type: 18, params: e, returns: t, newline: n, isSlot: s, loc: i };
}
function ze(e, t, n, s = !0) {
  return { type: 19, test: e, consequent: t, alternate: n, newline: s, loc: Be };
}
function Qe(e, t, n = !1, s = !1) {
  return {
    type: 20,
    index: e,
    value: t,
    needPauseTracking: n,
    inVOnce: s,
    needArraySpread: !1,
    loc: Be,
  };
}
function Ze(e) {
  return { type: 21, body: e, loc: Be };
}
function et(e, t) {
  return e || t ? ce : le;
}
function tt(e, t) {
  return e || t ? re : ae;
}
function nt(e, { helper: t, removeHelper: n, inSSR: s }) {
  e.isBlock || ((e.isBlock = !0), n(et(s, e.isComponent)), t(oe), t(tt(s, e.isComponent)));
}
const st = new Uint8Array([123, 123]),
  it = new Uint8Array([125, 125]);
function ot(e) {
  return (e >= 97 && e <= 122) || (e >= 65 && e <= 90);
}
function rt(e) {
  return 32 === e || 10 === e || 9 === e || 12 === e || 13 === e;
}
function at(e) {
  return 47 === e || 62 === e || rt(e);
}
function ct(e) {
  const t = new Uint8Array(e.length);
  for (let n = 0; n < e.length; n++) t[n] = e.charCodeAt(n);
  return t;
}
const lt = {
  Cdata: new Uint8Array([67, 68, 65, 84, 65, 91]),
  CdataEnd: new Uint8Array([93, 93, 62]),
  CommentEnd: new Uint8Array([45, 45, 62]),
  ScriptEnd: new Uint8Array([60, 47, 115, 99, 114, 105, 112, 116]),
  StyleEnd: new Uint8Array([60, 47, 115, 116, 121, 108, 101]),
  TitleEnd: new Uint8Array([60, 47, 116, 105, 116, 108, 101]),
  TextareaEnd: new Uint8Array([60, 47, 116, 101, 120, 116, 97, 114, 101, 97]),
};
const dt = {
  COMPILER_IS_ON_ELEMENT: {
    message:
      'Platform-native elements with "is" prop will no longer be treated as components in Vue 3 unless the "is" value is explicitly prefixed with "vue:".',
    link: "https://v3-migration.vuejs.org/breaking-changes/custom-elements-interop.html",
  },
  COMPILER_V_BIND_SYNC: {
    message: (e) =>
      `.sync modifier for v-bind has been removed. Use v-model with argument instead. \`v-bind:${e}.sync\` should be changed to \`v-model:${e}\`.`,
    link: "https://v3-migration.vuejs.org/breaking-changes/v-model.html",
  },
  COMPILER_V_BIND_OBJECT_ORDER: {
    message:
      'v-bind="obj" usage is now order sensitive and behaves like JavaScript object spread: it will now overwrite an existing non-mergeable attribute that appears before v-bind in the case of conflict. To retain 2.x behavior, move v-bind to make it the first attribute. You can also suppress this warning if the usage is intended.',
    link: "https://v3-migration.vuejs.org/breaking-changes/v-bind.html",
  },
  COMPILER_V_ON_NATIVE: {
    message: ".native modifier for v-on has been removed as is no longer necessary.",
    link: "https://v3-migration.vuejs.org/breaking-changes/v-on-native-modifier-removed.html",
  },
  COMPILER_V_IF_V_FOR_PRECEDENCE: {
    message:
      "v-if / v-for precedence when used on the same element has changed in Vue 3: v-if now takes higher precedence and will no longer have access to v-for scope variables. It is best to avoid the ambiguity with <template> tags or use a computed property that filters v-for data source.",
    link: "https://v3-migration.vuejs.org/breaking-changes/v-if-v-for.html",
  },
  COMPILER_NATIVE_TEMPLATE: {
    message:
      "<template> with no special directives will render as a native template element instead of its inner content in Vue 3.",
  },
  COMPILER_INLINE_TEMPLATE: {
    message: '"inline-template" has been removed in Vue 3.',
    link: "https://v3-migration.vuejs.org/breaking-changes/inline-template-attribute.html",
  },
  COMPILER_FILTERS: {
    message:
      'filters have been removed in Vue 3. The "|" symbol will be treated as native JavaScript bitwise OR operator. Use method calls or computed properties instead.',
    link: "https://v3-migration.vuejs.org/breaking-changes/filters.html",
  },
};
function ht(e, { compatConfig: t }) {
  const n = t && t[e];
  return "MODE" === e ? n || 3 : n;
}
function pt(e, t) {
  const n = ht("MODE", t),
    s = ht(e, t);
  return 3 === n ? !0 === s : !1 !== s;
}
function ut(e, t, n, ...s) {
  return pt(e, t);
}
function ft(e) {
  throw e;
}
function mt(e) {}
function Et(e, t, n, s) {
  const i = new SyntaxError(String(`https://vuejs.org/error-reference/#compiler-${e}`));
  return ((i.code = e), (i.loc = t), i);
}
const _t = {
  0: "Illegal comment.",
  1: "CDATA section is allowed only in XML context.",
  2: "Duplicate attribute.",
  3: "End tag cannot have attributes.",
  4: "Illegal '/' in tags.",
  5: "Unexpected EOF in tag.",
  6: "Unexpected EOF in CDATA section.",
  7: "Unexpected EOF in comment.",
  8: "Unexpected EOF in script.",
  9: "Unexpected EOF in tag.",
  10: "Incorrectly closed comment.",
  11: "Incorrectly opened comment.",
  12: "Illegal tag name. Use '&lt;' to print '<'.",
  13: "Attribute value was expected.",
  14: "End tag name was expected.",
  15: "Whitespace was expected.",
  16: "Unexpected '\x3c!--' in comment.",
  17: "Attribute name cannot contain U+0022 (\"), U+0027 ('), and U+003C (<).",
  18: "Unquoted attribute value cannot contain U+0022 (\"), U+0027 ('), U+003C (<), U+003D (=), and U+0060 (`).",
  19: "Attribute name cannot start with '='.",
  21: "'<?' is allowed only in XML context.",
  20: "Unexpected null character.",
  22: "Illegal '/' in tags.",
  23: "Invalid end tag.",
  24: "Element is missing end tag.",
  25: "Interpolation end sign was not found.",
  27: "End bracket for dynamic directive argument was not found. Note that dynamic directive argument cannot contain spaces.",
  26: "Legal directive name was expected.",
  28: "v-if/v-else-if is missing expression.",
  29: "v-if/else branches must use unique keys.",
  30: "v-else/v-else-if has no adjacent v-if or v-else-if.",
  31: "v-for is missing expression.",
  32: "v-for has invalid expression.",
  33: "<template v-for> key should be placed on the <template> tag.",
  34: "v-bind is missing expression.",
  52: "v-bind with same-name shorthand only allows static argument.",
  35: "v-on is missing expression.",
  36: "Unexpected custom directive on <slot> outlet.",
  37: "Mixed v-slot usage on both the component and nested <template>. When there are multiple named slots, all slots should use <template> syntax to avoid scope ambiguity.",
  38: "Duplicate slot names found. ",
  39: "Extraneous children found when component already has explicitly named default slot. These children will be ignored.",
  40: "v-slot can only be used on components or <template> tags.",
  41: "v-model is missing expression.",
  42: "v-model value must be a valid JavaScript member expression.",
  43: "v-model cannot be used on v-for or v-slot scope variables because they are not writable.",
  44: "v-model cannot be used on a prop, because local prop bindings are not writable.\nUse a v-bind binding combined with a v-on listener that emits update:x event instead.",
  45: "Error parsing JavaScript expression: ",
  46: "<KeepAlive> expects exactly one child component.",
  51: "@vnode-* hooks in templates are no longer supported. Use the vue: prefix instead. For example, @vnode-mounted should be changed to @vue:mounted. @vnode-* hooks support has been removed in 3.4.",
  47: '"prefixIdentifiers" option is not supported in this build of compiler.',
  48: "ES module mode is not supported in this build of compiler.",
  49: '"cacheHandlers" option is only supported when the "prefixIdentifiers" option is enabled.',
  50: '"scopeId" option is only supported in module mode.',
  53: "",
};
function St(e, t) {
  const n = "SwitchCase" === e.type ? e.consequent : e.body;
  for (const s of n)
    if ("VariableDeclaration" === s.type) {
      if (s.declare) continue;
      for (const e of s.declarations) for (const n of It(e.id)) t(n);
    } else if ("FunctionDeclaration" === s.type || "ClassDeclaration" === s.type) {
      if (s.declare || !s.id) continue;
      t(s.id);
    } else gt(s) ? Tt(s, !0, t) : "SwitchStatement" === s.type && Nt(s, !0, t);
}
function gt(e) {
  return "ForOfStatement" === e.type || "ForInStatement" === e.type || "ForStatement" === e.type;
}
function Tt(e, t, n) {
  const s = "ForStatement" === e.type ? e.init : e.left;
  if (s && "VariableDeclaration" === s.type && ("var" === s.kind ? t : !t))
    for (const i of s.declarations) for (const e of It(i.id)) n(e);
}
function Nt(e, t, n) {
  for (const s of e.cases) {
    for (const e of s.consequent)
      if ("VariableDeclaration" === e.type && ("var" === e.kind ? t : !t))
        for (const t of e.declarations) for (const e of It(t.id)) n(e);
    St(s, n);
  }
}
function It(e, t = []) {
  switch (e.type) {
    case "Identifier":
      t.push(e);
      break;
    case "MemberExpression":
      let n = e;
      for (; "MemberExpression" === n.type; ) n = n.object;
      t.push(n);
      break;
    case "ObjectPattern":
      for (const s of e.properties) "RestElement" === s.type ? It(s.argument, t) : It(s.value, t);
      break;
    case "ArrayPattern":
      e.elements.forEach((e) => {
        e && It(e, t);
      });
      break;
    case "RestElement":
      It(e.argument, t);
      break;
    case "AssignmentPattern":
      It(e.left, t);
  }
  return t;
}
const yt = (e) => e && ("ObjectProperty" === e.type || "ObjectMethod" === e.type) && !e.computed,
  Ot = [
    "TSAsExpression",
    "TSTypeAssertion",
    "TSNonNullExpression",
    "TSInstantiationExpression",
    "TSSatisfiesExpression",
  ];
const Ct = (e) => 4 === e.type && e.isStatic;
function At(e) {
  switch (e) {
    case "Teleport":
    case "teleport":
      return te;
    case "Suspense":
    case "suspense":
      return ne;
    case "KeepAlive":
    case "keep-alive":
      return se;
    case "BaseTransition":
    case "base-transition":
      return ie;
  }
}
const vt = /^$|^\d|[^\$\w\xA0-\uFFFF]/,
  bt = (e) => !vt.test(e),
  Rt = /[A-Za-z_$\xA0-\uFFFF]/,
  xt = /[\.\?\w$\xA0-\uFFFF]/,
  Lt = /\s+[.[]\s*|\s*[.[]\s+/g,
  Mt = (e) => (4 === e.type ? e.content : e.loc.source),
  Pt = (e) => {
    const t = Mt(e)
      .trim()
      .replace(Lt, (e) => e.trim());
    let n = 0,
      s = [],
      i = 0,
      o = 0,
      r = null;
    for (let a = 0; a < t.length; a++) {
      const e = t.charAt(a);
      switch (n) {
        case 0:
          if ("[" === e) (s.push(n), (n = 1), i++);
          else if ("(" === e) (s.push(n), (n = 2), o++);
          else if (!(0 === a ? Rt : xt).test(e)) return !1;
          break;
        case 1:
          "'" === e || '"' === e || "`" === e
            ? (s.push(n), (n = 3), (r = e))
            : "[" === e
              ? i++
              : "]" === e && (--i || (n = s.pop()));
          break;
        case 2:
          if ("'" === e || '"' === e || "`" === e) (s.push(n), (n = 3), (r = e));
          else if ("(" === e) o++;
          else if (")" === e) {
            if (a === t.length - 1) return !1;
            --o || (n = s.pop());
          }
          break;
        case 3:
          e === r && ((n = s.pop()), (r = null));
      }
    }
    return !i && !o;
  },
  Dt = I,
  kt = Pt,
  Vt =
    /^\s*(?:async\s*)?(?:\([^)]*?\)|[\w$_]+)\s*(?::[^=]+)?=>|^\s*(?:async\s+)?function(?:\s+[\w$]+)?\s*\(/,
  wt = (e) => Vt.test(Mt(e)),
  Xt = I,
  Ft = wt;
function Ut(e, t, n = t.length) {
  let s = 0,
    i = -1;
  for (let o = 0; o < n; o++) 10 === t.charCodeAt(o) && (s++, (i = o));
  return ((e.offset += n), (e.line += s), (e.column = -1 === i ? e.column + n : n - i), e);
}
function Bt(e, t, n = !1) {
  for (let s = 0; s < e.props.length; s++) {
    const i = e.props[s];
    if (7 === i.type && (n || i.exp) && (O(t) ? i.name === t : t.test(i.name))) return i;
  }
}
function $t(e, t, n = !1, s = !1) {
  for (let i = 0; i < e.props.length; i++) {
    const o = e.props[i];
    if (6 === o.type) {
      if (n) continue;
      if (o.name === t && (o.value || s)) return o;
    } else if ("bind" === o.name && (o.exp || s) && Ht(o.arg, t)) return o;
  }
}
function Ht(e, t) {
  return !(!e || !Ct(e) || e.content !== t);
}
function Gt(e) {
  return e.props.some(
    (e) => !(7 !== e.type || "bind" !== e.name || (e.arg && 4 === e.arg.type && e.arg.isStatic)),
  );
}
function jt(e) {
  return 5 === e.type || 2 === e.type;
}
function qt(e) {
  return 7 === e.type && "pre" === e.name;
}
function Jt(e) {
  return 7 === e.type && "slot" === e.name;
}
function Wt(e) {
  return 1 === e.type && 3 === e.tagType;
}
function Kt(e) {
  return 1 === e.type && 2 === e.tagType;
}
const Yt = new Set([Ce, Ae]);
function zt(e, t = []) {
  if (e && !O(e) && 14 === e.type) {
    const n = e.callee;
    if (!O(n) && Yt.has(n)) return zt(e.arguments[0], t.concat(e));
  }
  return [e, t];
}
function Qt(e, t, n) {
  let s,
    i,
    o = 13 === e.type ? e.props : e.arguments[2],
    r = [];
  if (o && !O(o) && 14 === o.type) {
    const e = zt(o);
    ((o = e[0]), (r = e[1]), (i = r[r.length - 1]));
  }
  if (null == o || O(o)) s = je([t]);
  else if (14 === o.type) {
    const e = o.arguments[0];
    (O(e) || 15 !== e.type
      ? o.callee === ve
        ? (s = Ke(n.helper(Ie), [je([t]), o]))
        : o.arguments.unshift(je([t]))
      : Zt(t, e) || e.properties.unshift(t),
      !s && (s = o));
  } else
    15 === o.type
      ? (Zt(t, o) || o.properties.unshift(t), (s = o))
      : ((s = Ke(n.helper(Ie), [je([t]), o])), i && i.callee === Ae && (i = r[r.length - 2]));
  13 === e.type
    ? i
      ? (i.arguments[0] = s)
      : (e.props = s)
    : i
      ? (i.arguments[0] = s)
      : (e.arguments[2] = s);
}
function Zt(e, t) {
  let n = !1;
  if (4 === e.key.type) {
    const s = e.key.content;
    n = t.properties.some((e) => 4 === e.key.type && e.key.content === s);
  }
  return n;
}
function en(e, t) {
  return `_${t}_${e.replace(/[^\w]/g, (t, n) => ("-" === t ? "_" : e.charCodeAt(n).toString()))}`;
}
function tn(e) {
  return 14 === e.type && e.callee === we ? e.arguments[1].returns : e;
}
const nn = /([\s\S]*?)\s+(?:in|of)\s+(\S[\s\S]*)/;
function sn(e) {
  for (let t = 0; t < e.length; t++) if (!rt(e.charCodeAt(t))) return !1;
  return !0;
}
function on(e) {
  return (2 === e.type && sn(e.content)) || (12 === e.type && on(e.content));
}
function rn(e) {
  return 3 === e.type || on(e);
}
const an = {
  parseMode: "base",
  ns: 0,
  delimiters: ["{{", "}}"],
  getNamespace: () => 0,
  isVoidTag: C,
  isPreTag: C,
  isIgnoreNewlineTag: C,
  isCustomElement: C,
  onError: ft,
  onWarn: mt,
  comments: !1,
  prefixIdentifiers: !1,
};
let cn = an,
  ln = null,
  dn = "",
  hn = null,
  pn = null,
  un = "",
  fn = -1,
  mn = -1,
  En = 0,
  _n = !1,
  Sn = null;
const gn = [],
  Tn = new (class {
    constructor(e, t) {
      ((this.stack = e),
        (this.cbs = t),
        (this.state = 1),
        (this.buffer = ""),
        (this.sectionStart = 0),
        (this.index = 0),
        (this.entityStart = 0),
        (this.baseState = 1),
        (this.inRCDATA = !1),
        (this.inXML = !1),
        (this.inVPre = !1),
        (this.newlines = []),
        (this.mode = 0),
        (this.delimiterOpen = st),
        (this.delimiterClose = it),
        (this.delimiterIndex = -1),
        (this.currentSequence = void 0),
        (this.sequenceIndex = 0));
    }
    get inSFCRoot() {
      return 2 === this.mode && 0 === this.stack.length;
    }
    reset() {
      ((this.state = 1),
        (this.mode = 0),
        (this.buffer = ""),
        (this.sectionStart = 0),
        (this.index = 0),
        (this.baseState = 1),
        (this.inRCDATA = !1),
        (this.currentSequence = void 0),
        (this.newlines.length = 0),
        (this.delimiterOpen = st),
        (this.delimiterClose = it));
    }
    getPos(e) {
      let t = 1,
        n = e + 1;
      for (let s = this.newlines.length - 1; s >= 0; s--) {
        const i = this.newlines[s];
        if (e > i) {
          ((t = s + 2), (n = e - i));
          break;
        }
      }
      return { column: n, line: t, offset: e };
    }
    peek() {
      return this.buffer.charCodeAt(this.index + 1);
    }
    stateText(e) {
      60 === e
        ? (this.index > this.sectionStart && this.cbs.ontext(this.sectionStart, this.index),
          (this.state = 5),
          (this.sectionStart = this.index))
        : this.inVPre ||
          e !== this.delimiterOpen[0] ||
          ((this.state = 2), (this.delimiterIndex = 0), this.stateInterpolationOpen(e));
    }
    stateInterpolationOpen(e) {
      if (e === this.delimiterOpen[this.delimiterIndex])
        if (this.delimiterIndex === this.delimiterOpen.length - 1) {
          const e = this.index + 1 - this.delimiterOpen.length;
          (e > this.sectionStart && this.cbs.ontext(this.sectionStart, e),
            (this.state = 3),
            (this.sectionStart = e));
        } else this.delimiterIndex++;
      else
        this.inRCDATA
          ? ((this.state = 32), this.stateInRCDATA(e))
          : ((this.state = 1), this.stateText(e));
    }
    stateInterpolation(e) {
      e === this.delimiterClose[0] &&
        ((this.state = 4), (this.delimiterIndex = 0), this.stateInterpolationClose(e));
    }
    stateInterpolationClose(e) {
      e === this.delimiterClose[this.delimiterIndex]
        ? this.delimiterIndex === this.delimiterClose.length - 1
          ? (this.cbs.oninterpolation(this.sectionStart, this.index + 1),
            this.inRCDATA ? (this.state = 32) : (this.state = 1),
            (this.sectionStart = this.index + 1))
          : this.delimiterIndex++
        : ((this.state = 3), this.stateInterpolation(e));
    }
    stateSpecialStartSequence(e) {
      const t = this.sequenceIndex === this.currentSequence.length;
      if (t ? at(e) : (32 | e) === this.currentSequence[this.sequenceIndex]) {
        if (!t) return void this.sequenceIndex++;
      } else this.inRCDATA = !1;
      ((this.sequenceIndex = 0), (this.state = 6), this.stateInTagName(e));
    }
    stateInRCDATA(e) {
      if (this.sequenceIndex === this.currentSequence.length) {
        if (62 === e || rt(e)) {
          const t = this.index - this.currentSequence.length;
          if (this.sectionStart < t) {
            const e = this.index;
            ((this.index = t), this.cbs.ontext(this.sectionStart, t), (this.index = e));
          }
          return (
            (this.sectionStart = t + 2),
            this.stateInClosingTagName(e),
            void (this.inRCDATA = !1)
          );
        }
        this.sequenceIndex = 0;
      }
      (32 | e) === this.currentSequence[this.sequenceIndex]
        ? (this.sequenceIndex += 1)
        : 0 === this.sequenceIndex
          ? this.currentSequence === lt.TitleEnd ||
            (this.currentSequence === lt.TextareaEnd && !this.inSFCRoot)
            ? this.inVPre ||
              e !== this.delimiterOpen[0] ||
              ((this.state = 2), (this.delimiterIndex = 0), this.stateInterpolationOpen(e))
            : this.fastForwardTo(60) && (this.sequenceIndex = 1)
          : (this.sequenceIndex = Number(60 === e));
    }
    stateCDATASequence(e) {
      e === lt.Cdata[this.sequenceIndex]
        ? ++this.sequenceIndex === lt.Cdata.length &&
          ((this.state = 28),
          (this.currentSequence = lt.CdataEnd),
          (this.sequenceIndex = 0),
          (this.sectionStart = this.index + 1))
        : ((this.sequenceIndex = 0), (this.state = 23), this.stateInDeclaration(e));
    }
    fastForwardTo(e) {
      for (; ++this.index < this.buffer.length; ) {
        const t = this.buffer.charCodeAt(this.index);
        if ((10 === t && this.newlines.push(this.index), t === e)) return !0;
      }
      return ((this.index = this.buffer.length - 1), !1);
    }
    stateInCommentLike(e) {
      e === this.currentSequence[this.sequenceIndex]
        ? ++this.sequenceIndex === this.currentSequence.length &&
          (this.currentSequence === lt.CdataEnd
            ? this.cbs.oncdata(this.sectionStart, this.index - 2)
            : this.cbs.oncomment(this.sectionStart, this.index - 2),
          (this.sequenceIndex = 0),
          (this.sectionStart = this.index + 1),
          (this.state = 1))
        : 0 === this.sequenceIndex
          ? this.fastForwardTo(this.currentSequence[0]) && (this.sequenceIndex = 1)
          : e !== this.currentSequence[this.sequenceIndex - 1] && (this.sequenceIndex = 0);
    }
    startSpecial(e, t) {
      (this.enterRCDATA(e, t), (this.state = 31));
    }
    enterRCDATA(e, t) {
      ((this.inRCDATA = !0), (this.currentSequence = e), (this.sequenceIndex = t));
    }
    stateBeforeTagName(e) {
      33 === e
        ? ((this.state = 22), (this.sectionStart = this.index + 1))
        : 63 === e
          ? ((this.state = 24), (this.sectionStart = this.index + 1))
          : ot(e)
            ? ((this.sectionStart = this.index),
              0 === this.mode
                ? (this.state = 6)
                : this.inSFCRoot
                  ? (this.state = 34)
                  : this.inXML
                    ? (this.state = 6)
                    : (this.state = 116 === e ? 30 : 115 === e ? 29 : 6))
            : 47 === e
              ? (this.state = 8)
              : ((this.state = 1), this.stateText(e));
    }
    stateInTagName(e) {
      at(e) && this.handleTagName(e);
    }
    stateInSFCRootTagName(e) {
      if (at(e)) {
        const t = this.buffer.slice(this.sectionStart, this.index);
        ("template" !== t && this.enterRCDATA(ct("</" + t), 0), this.handleTagName(e));
      }
    }
    handleTagName(e) {
      (this.cbs.onopentagname(this.sectionStart, this.index),
        (this.sectionStart = -1),
        (this.state = 11),
        this.stateBeforeAttrName(e));
    }
    stateBeforeClosingTagName(e) {
      rt(e) ||
        (62 === e
          ? ((this.state = 1), (this.sectionStart = this.index + 1))
          : ((this.state = ot(e) ? 9 : 27), (this.sectionStart = this.index)));
    }
    stateInClosingTagName(e) {
      (62 === e || rt(e)) &&
        (this.cbs.onclosetag(this.sectionStart, this.index),
        (this.sectionStart = -1),
        (this.state = 10),
        this.stateAfterClosingTagName(e));
    }
    stateAfterClosingTagName(e) {
      62 === e && ((this.state = 1), (this.sectionStart = this.index + 1));
    }
    stateBeforeAttrName(e) {
      62 === e
        ? (this.cbs.onopentagend(this.index),
          this.inRCDATA ? (this.state = 32) : (this.state = 1),
          (this.sectionStart = this.index + 1))
        : 47 === e
          ? (this.state = 7)
          : 60 === e && 47 === this.peek()
            ? (this.cbs.onopentagend(this.index),
              (this.state = 5),
              (this.sectionStart = this.index))
            : rt(e) || this.handleAttrStart(e);
    }
    handleAttrStart(e) {
      118 === e && 45 === this.peek()
        ? ((this.state = 13), (this.sectionStart = this.index))
        : 46 === e || 58 === e || 64 === e || 35 === e
          ? (this.cbs.ondirname(this.index, this.index + 1),
            (this.state = 14),
            (this.sectionStart = this.index + 1))
          : ((this.state = 12), (this.sectionStart = this.index));
    }
    stateInSelfClosingTag(e) {
      62 === e
        ? (this.cbs.onselfclosingtag(this.index),
          (this.state = 1),
          (this.sectionStart = this.index + 1),
          (this.inRCDATA = !1))
        : rt(e) || ((this.state = 11), this.stateBeforeAttrName(e));
    }
    stateInAttrName(e) {
      (61 === e || at(e)) &&
        (this.cbs.onattribname(this.sectionStart, this.index), this.handleAttrNameEnd(e));
    }
    stateInDirName(e) {
      61 === e || at(e)
        ? (this.cbs.ondirname(this.sectionStart, this.index), this.handleAttrNameEnd(e))
        : 58 === e
          ? (this.cbs.ondirname(this.sectionStart, this.index),
            (this.state = 14),
            (this.sectionStart = this.index + 1))
          : 46 === e &&
            (this.cbs.ondirname(this.sectionStart, this.index),
            (this.state = 16),
            (this.sectionStart = this.index + 1));
    }
    stateInDirArg(e) {
      61 === e || at(e)
        ? (this.cbs.ondirarg(this.sectionStart, this.index), this.handleAttrNameEnd(e))
        : 91 === e
          ? (this.state = 15)
          : 46 === e &&
            (this.cbs.ondirarg(this.sectionStart, this.index),
            (this.state = 16),
            (this.sectionStart = this.index + 1));
    }
    stateInDynamicDirArg(e) {
      93 === e
        ? (this.state = 14)
        : (61 === e || at(e)) &&
          (this.cbs.ondirarg(this.sectionStart, this.index + 1), this.handleAttrNameEnd(e));
    }
    stateInDirModifier(e) {
      61 === e || at(e)
        ? (this.cbs.ondirmodifier(this.sectionStart, this.index), this.handleAttrNameEnd(e))
        : 46 === e &&
          (this.cbs.ondirmodifier(this.sectionStart, this.index),
          (this.sectionStart = this.index + 1));
    }
    handleAttrNameEnd(e) {
      ((this.sectionStart = this.index),
        (this.state = 17),
        this.cbs.onattribnameend(this.index),
        this.stateAfterAttrName(e));
    }
    stateAfterAttrName(e) {
      61 === e
        ? (this.state = 18)
        : 47 === e || 62 === e
          ? (this.cbs.onattribend(0, this.sectionStart),
            (this.sectionStart = -1),
            (this.state = 11),
            this.stateBeforeAttrName(e))
          : rt(e) || (this.cbs.onattribend(0, this.sectionStart), this.handleAttrStart(e));
    }
    stateBeforeAttrValue(e) {
      34 === e
        ? ((this.state = 19), (this.sectionStart = this.index + 1))
        : 39 === e
          ? ((this.state = 20), (this.sectionStart = this.index + 1))
          : rt(e) ||
            ((this.sectionStart = this.index), (this.state = 21), this.stateInAttrValueNoQuotes(e));
    }
    handleInAttrValue(e, t) {
      (e === t || this.fastForwardTo(t)) &&
        (this.cbs.onattribdata(this.sectionStart, this.index),
        (this.sectionStart = -1),
        this.cbs.onattribend(34 === t ? 3 : 2, this.index + 1),
        (this.state = 11));
    }
    stateInAttrValueDoubleQuotes(e) {
      this.handleInAttrValue(e, 34);
    }
    stateInAttrValueSingleQuotes(e) {
      this.handleInAttrValue(e, 39);
    }
    stateInAttrValueNoQuotes(e) {
      rt(e) || 62 === e
        ? (this.cbs.onattribdata(this.sectionStart, this.index),
          (this.sectionStart = -1),
          this.cbs.onattribend(1, this.index),
          (this.state = 11),
          this.stateBeforeAttrName(e))
        : (39 !== e && 60 !== e && 61 !== e && 96 !== e) || this.cbs.onerr(18, this.index);
    }
    stateBeforeDeclaration(e) {
      91 === e ? ((this.state = 26), (this.sequenceIndex = 0)) : (this.state = 45 === e ? 25 : 23);
    }
    stateInDeclaration(e) {
      (62 === e || this.fastForwardTo(62)) &&
        ((this.state = 1), (this.sectionStart = this.index + 1));
    }
    stateInProcessingInstruction(e) {
      (62 === e || this.fastForwardTo(62)) &&
        (this.cbs.onprocessinginstruction(this.sectionStart, this.index),
        (this.state = 1),
        (this.sectionStart = this.index + 1));
    }
    stateBeforeComment(e) {
      45 === e
        ? ((this.state = 28),
          (this.currentSequence = lt.CommentEnd),
          (this.sequenceIndex = 2),
          (this.sectionStart = this.index + 1))
        : (this.state = 23);
    }
    stateInSpecialComment(e) {
      (62 === e || this.fastForwardTo(62)) &&
        (this.cbs.oncomment(this.sectionStart, this.index),
        (this.state = 1),
        (this.sectionStart = this.index + 1));
    }
    stateBeforeSpecialS(e) {
      e === lt.ScriptEnd[3]
        ? this.startSpecial(lt.ScriptEnd, 4)
        : e === lt.StyleEnd[3]
          ? this.startSpecial(lt.StyleEnd, 4)
          : ((this.state = 6), this.stateInTagName(e));
    }
    stateBeforeSpecialT(e) {
      e === lt.TitleEnd[3]
        ? this.startSpecial(lt.TitleEnd, 4)
        : e === lt.TextareaEnd[3]
          ? this.startSpecial(lt.TextareaEnd, 4)
          : ((this.state = 6), this.stateInTagName(e));
    }
    startEntity() {}
    stateInEntity() {}
    parse(e) {
      for (this.buffer = e; this.index < this.buffer.length; ) {
        const e = this.buffer.charCodeAt(this.index);
        switch ((10 === e && 33 !== this.state && this.newlines.push(this.index), this.state)) {
          case 1:
            this.stateText(e);
            break;
          case 2:
            this.stateInterpolationOpen(e);
            break;
          case 3:
            this.stateInterpolation(e);
            break;
          case 4:
            this.stateInterpolationClose(e);
            break;
          case 31:
            this.stateSpecialStartSequence(e);
            break;
          case 32:
            this.stateInRCDATA(e);
            break;
          case 26:
            this.stateCDATASequence(e);
            break;
          case 19:
            this.stateInAttrValueDoubleQuotes(e);
            break;
          case 12:
            this.stateInAttrName(e);
            break;
          case 13:
            this.stateInDirName(e);
            break;
          case 14:
            this.stateInDirArg(e);
            break;
          case 15:
            this.stateInDynamicDirArg(e);
            break;
          case 16:
            this.stateInDirModifier(e);
            break;
          case 28:
            this.stateInCommentLike(e);
            break;
          case 27:
            this.stateInSpecialComment(e);
            break;
          case 11:
            this.stateBeforeAttrName(e);
            break;
          case 6:
            this.stateInTagName(e);
            break;
          case 34:
            this.stateInSFCRootTagName(e);
            break;
          case 9:
            this.stateInClosingTagName(e);
            break;
          case 5:
            this.stateBeforeTagName(e);
            break;
          case 17:
            this.stateAfterAttrName(e);
            break;
          case 20:
            this.stateInAttrValueSingleQuotes(e);
            break;
          case 18:
            this.stateBeforeAttrValue(e);
            break;
          case 8:
            this.stateBeforeClosingTagName(e);
            break;
          case 10:
            this.stateAfterClosingTagName(e);
            break;
          case 29:
            this.stateBeforeSpecialS(e);
            break;
          case 30:
            this.stateBeforeSpecialT(e);
            break;
          case 21:
            this.stateInAttrValueNoQuotes(e);
            break;
          case 7:
            this.stateInSelfClosingTag(e);
            break;
          case 23:
            this.stateInDeclaration(e);
            break;
          case 22:
            this.stateBeforeDeclaration(e);
            break;
          case 25:
            this.stateBeforeComment(e);
            break;
          case 24:
            this.stateInProcessingInstruction(e);
            break;
          case 33:
            this.stateInEntity();
        }
        this.index++;
      }
      (this.cleanup(), this.finish());
    }
    cleanup() {
      this.sectionStart !== this.index &&
        (1 === this.state || (32 === this.state && 0 === this.sequenceIndex)
          ? (this.cbs.ontext(this.sectionStart, this.index), (this.sectionStart = this.index))
          : (19 !== this.state && 20 !== this.state && 21 !== this.state) ||
            (this.cbs.onattribdata(this.sectionStart, this.index),
            (this.sectionStart = this.index)));
    }
    finish() {
      (this.handleTrailingData(), this.cbs.onend());
    }
    handleTrailingData() {
      const e = this.buffer.length;
      this.sectionStart >= e ||
        (28 === this.state
          ? this.currentSequence === lt.CdataEnd
            ? this.cbs.oncdata(this.sectionStart, e)
            : this.cbs.oncomment(this.sectionStart, e)
          : 6 === this.state ||
            11 === this.state ||
            18 === this.state ||
            17 === this.state ||
            12 === this.state ||
            13 === this.state ||
            14 === this.state ||
            15 === this.state ||
            16 === this.state ||
            20 === this.state ||
            19 === this.state ||
            21 === this.state ||
            9 === this.state ||
            this.cbs.ontext(this.sectionStart, e));
    }
    emitCodePoint(e, t) {}
  })(gn, {
    onerr: Fn,
    ontext(e, t) {
      Cn(yn(e, t), e, t);
    },
    ontextentity(e, t, n) {
      Cn(e, t, n);
    },
    oninterpolation(e, t) {
      if (_n) return Cn(yn(e, t), e, t);
      let n = e + Tn.delimiterOpen.length,
        s = t - Tn.delimiterClose.length;
      for (; rt(dn.charCodeAt(n)); ) n++;
      for (; rt(dn.charCodeAt(s - 1)); ) s--;
      let i = yn(n, s);
      (i.includes("&") && (i = cn.decodeEntities(i, !1)),
        Dn({ type: 5, content: Xn(i, !1, kn(n, s)), loc: kn(e, t) }));
    },
    onopentagname(e, t) {
      const n = yn(e, t);
      hn = {
        type: 1,
        tag: n,
        ns: cn.getNamespace(n, gn[0], cn.ns),
        tagType: 0,
        props: [],
        children: [],
        loc: kn(e - 1, t),
        codegenNode: void 0,
      };
    },
    onopentagend(e) {
      On(e);
    },
    onclosetag(e, t) {
      const n = yn(e, t);
      if (!cn.isVoidTag(n)) {
        let s = !1;
        for (let e = 0; e < gn.length; e++) {
          if (gn[e].tag.toLowerCase() === n.toLowerCase()) {
            ((s = !0), e > 0 && Fn(24, gn[0].loc.start.offset));
            for (let n = 0; n <= e; n++) {
              An(gn.shift(), t, n < e);
            }
            break;
          }
        }
        s || Fn(23, vn(e, 60));
      }
    },
    onselfclosingtag(e) {
      const t = hn.tag;
      ((hn.isSelfClosing = !0), On(e), gn[0] && gn[0].tag === t && An(gn.shift(), e));
    },
    onattribname(e, t) {
      pn = { type: 6, name: yn(e, t), nameLoc: kn(e, t), value: void 0, loc: kn(e) };
    },
    ondirname(e, t) {
      const n = yn(e, t),
        s = "." === n || ":" === n ? "bind" : "@" === n ? "on" : "#" === n ? "slot" : n.slice(2);
      if ((_n || "" !== s || Fn(26, e), _n || "" === s))
        pn = { type: 6, name: n, nameLoc: kn(e, t), value: void 0, loc: kn(e) };
      else if (
        ((pn = {
          type: 7,
          name: s,
          rawName: n,
          exp: void 0,
          arg: void 0,
          modifiers: "." === n ? [Je("prop")] : [],
          loc: kn(e),
        }),
        "pre" === s)
      ) {
        ((_n = Tn.inVPre = !0), (Sn = hn));
        const e = hn.props;
        for (let t = 0; t < e.length; t++) 7 === e[t].type && (e[t] = wn(e[t]));
      }
    },
    ondirarg(e, t) {
      if (e === t) return;
      const n = yn(e, t);
      if (_n && !qt(pn)) ((pn.name += n), Vn(pn.nameLoc, t));
      else {
        const s = "[" !== n[0];
        pn.arg = Xn(s ? n : n.slice(1, -1), s, kn(e, t), s ? 3 : 0);
      }
    },
    ondirmodifier(e, t) {
      const n = yn(e, t);
      if (_n && !qt(pn)) ((pn.name += "." + n), Vn(pn.nameLoc, t));
      else if ("slot" === pn.name) {
        const e = pn.arg;
        e && ((e.content += "." + n), Vn(e.loc, t));
      } else {
        const s = Je(n, !0, kn(e, t));
        pn.modifiers.push(s);
      }
    },
    onattribdata(e, t) {
      ((un += yn(e, t)), fn < 0 && (fn = e), (mn = t));
    },
    onattribentity(e, t, n) {
      ((un += e), fn < 0 && (fn = t), (mn = n));
    },
    onattribnameend(e) {
      const t = pn.loc.start.offset,
        n = yn(t, e);
      (7 === pn.type && (pn.rawName = n),
        hn.props.some((e) => (7 === e.type ? e.rawName : e.name) === n) && Fn(2, t));
    },
    onattribend(e, t) {
      if (hn && pn) {
        if ((Vn(pn.loc, t), 0 !== e))
          if ((un.includes("&") && (un = cn.decodeEntities(un, !0)), 6 === pn.type))
            ("class" === pn.name && (un = Pn(un).trim()),
              1 !== e || un || Fn(13, t),
              (pn.value = { type: 2, content: un, loc: 1 === e ? kn(fn, mn) : kn(fn - 1, mn + 1) }),
              Tn.inSFCRoot &&
                "template" === hn.tag &&
                "lang" === pn.name &&
                un &&
                "html" !== un &&
                Tn.enterRCDATA(ct("</template"), 0));
          else {
            let e = 0;
            ((pn.exp = Xn(un, !1, kn(fn, mn), 0, e)),
              "for" === pn.name &&
                (pn.forParseResult = (function (e) {
                  const t = e.loc,
                    n = e.content,
                    s = n.match(nn);
                  if (!s) return;
                  const [, i, o] = s,
                    r = (e, n, s = !1) => {
                      const i = t.start.offset + n;
                      return Xn(e, !1, kn(i, i + e.length), 0, s ? 1 : 0);
                    },
                    a = {
                      source: r(o.trim(), n.indexOf(o, i.length)),
                      value: void 0,
                      key: void 0,
                      index: void 0,
                      finalized: !1,
                    };
                  let c = i.trim().replace(In, "").trim();
                  const l = i.indexOf(c),
                    d = c.match(Nn);
                  if (d) {
                    c = c.replace(Nn, "").trim();
                    const e = d[1].trim();
                    let t;
                    if ((e && ((t = n.indexOf(e, l + c.length)), (a.key = r(e, t, !0))), d[2])) {
                      const s = d[2].trim();
                      s && (a.index = r(s, n.indexOf(s, a.key ? t + e.length : l + c.length), !0));
                    }
                  }
                  c && (a.value = r(c, l, !0));
                  return a;
                })(pn.exp)));
            let t = -1;
            "bind" === pn.name &&
              (t = pn.modifiers.findIndex((e) => "sync" === e.content)) > -1 &&
              ut("COMPILER_V_BIND_SYNC", cn, pn.loc, pn.arg.loc.source) &&
              ((pn.name = "model"), pn.modifiers.splice(t, 1));
          }
        (7 === pn.type && "pre" === pn.name) || hn.props.push(pn);
      }
      ((un = ""), (fn = mn = -1));
    },
    oncomment(e, t) {
      cn.comments && Dn({ type: 3, content: yn(e, t), loc: kn(e - 4, t + 3) });
    },
    onend() {
      const e = dn.length;
      for (let t = 0; t < gn.length; t++) (An(gn[t], e - 1), Fn(24, gn[t].loc.start.offset));
    },
    oncdata(e, t) {
      0 !== gn[0].ns ? Cn(yn(e, t), e, t) : Fn(1, e - 9);
    },
    onprocessinginstruction(e) {
      0 === (gn[0] ? gn[0].ns : cn.ns) && Fn(21, e - 1);
    },
  }),
  Nn = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/,
  In = /^\(|\)$/g;
function yn(e, t) {
  return dn.slice(e, t);
}
function On(e) {
  (Tn.inSFCRoot && (hn.innerLoc = kn(e + 1, e + 1)), Dn(hn));
  const { tag: t, ns: n } = hn;
  (0 === n && cn.isPreTag(t) && En++,
    cn.isVoidTag(t) ? An(hn, e) : (gn.unshift(hn), (1 !== n && 2 !== n) || (Tn.inXML = !0)),
    (hn = null));
}
function Cn(e, t, n) {
  {
    const t = gn[0] && gn[0].tag;
    "script" !== t && "style" !== t && e.includes("&") && (e = cn.decodeEntities(e, !1));
  }
  const s = gn[0] || ln,
    i = s.children[s.children.length - 1];
  i && 2 === i.type
    ? ((i.content += e), Vn(i.loc, n))
    : s.children.push({ type: 2, content: e, loc: kn(t, n) });
}
function An(e, t, n = !1) {
  (Vn(
    e.loc,
    n
      ? vn(t, 60)
      : (function (e, t) {
          let n = e;
          for (; dn.charCodeAt(n) !== t && n < dn.length - 1; ) n++;
          return n;
        })(t, 62) + 1,
  ),
    Tn.inSFCRoot &&
      (e.children.length
        ? (e.innerLoc.end = y({}, e.children[e.children.length - 1].loc.end))
        : (e.innerLoc.end = y({}, e.innerLoc.start)),
      (e.innerLoc.source = yn(e.innerLoc.start.offset, e.innerLoc.end.offset))));
  const { tag: s, ns: i, children: o } = e;
  if (
    (_n ||
      ("slot" === s
        ? (e.tagType = 2)
        : Rn(e)
          ? (e.tagType = 3)
          : (function ({ tag: e, props: t }) {
              if (cn.isCustomElement(e)) return !1;
              if (
                "component" === e ||
                ((n = e.charCodeAt(0)), n > 64 && n < 91) ||
                At(e) ||
                (cn.isBuiltInComponent && cn.isBuiltInComponent(e)) ||
                (cn.isNativeTag && !cn.isNativeTag(e))
              )
                return !0;
              var n;
              for (let s = 0; s < t.length; s++) {
                const e = t[s];
                if (6 === e.type) {
                  if ("is" === e.name && e.value) {
                    if (e.value.content.startsWith("vue:")) return !0;
                    if (ut("COMPILER_IS_ON_ELEMENT", cn, e.loc)) return !0;
                  }
                } else if (
                  "bind" === e.name &&
                  Ht(e.arg, "is") &&
                  ut("COMPILER_IS_ON_ELEMENT", cn, e.loc)
                )
                  return !0;
              }
              return !1;
            })(e) && (e.tagType = 1)),
    Tn.inRCDATA || (e.children = Ln(o)),
    0 === i && cn.isIgnoreNewlineTag(s))
  ) {
    const e = o[0];
    e && 2 === e.type && (e.content = e.content.replace(/^\r?\n/, ""));
  }
  (0 === i && cn.isPreTag(s) && En--,
    Sn === e && ((_n = Tn.inVPre = !1), (Sn = null)),
    Tn.inXML && 0 === (gn[0] ? gn[0].ns : cn.ns) && (Tn.inXML = !1));
  {
    const t = e.props;
    if (!Tn.inSFCRoot && pt("COMPILER_NATIVE_TEMPLATE", cn) && "template" === e.tag && !Rn(e)) {
      const t = gn[0] || ln,
        n = t.children.indexOf(e);
      t.children.splice(n, 1, ...e.children);
    }
    const n = t.find((e) => 6 === e.type && "inline-template" === e.name);
    n &&
      ut("COMPILER_INLINE_TEMPLATE", cn, n.loc) &&
      e.children.length &&
      (n.value = {
        type: 2,
        content: yn(
          e.children[0].loc.start.offset,
          e.children[e.children.length - 1].loc.end.offset,
        ),
        loc: n.loc,
      });
  }
}
function vn(e, t) {
  let n = e;
  for (; dn.charCodeAt(n) !== t && n >= 0; ) n--;
  return n;
}
const bn = new Set(["if", "else", "else-if", "for", "slot"]);
function Rn({ tag: e, props: t }) {
  if ("template" === e)
    for (let n = 0; n < t.length; n++) if (7 === t[n].type && bn.has(t[n].name)) return !0;
  return !1;
}
const xn = /\r\n/g;
function Ln(e) {
  const t = "preserve" !== cn.whitespace;
  let n = !1;
  for (let s = 0; s < e.length; s++) {
    const i = e[s];
    if (2 === i.type)
      if (En) i.content = i.content.replace(xn, "\n");
      else if (sn(i.content)) {
        const o = e[s - 1] && e[s - 1].type,
          r = e[s + 1] && e[s + 1].type;
        !o ||
        !r ||
        (t &&
          ((3 === o && (3 === r || 1 === r)) ||
            (1 === o && (3 === r || (1 === r && Mn(i.content))))))
          ? ((n = !0), (e[s] = null))
          : (i.content = " ");
      } else t && (i.content = Pn(i.content));
  }
  return n ? e.filter(Boolean) : e;
}
function Mn(e) {
  for (let t = 0; t < e.length; t++) {
    const n = e.charCodeAt(t);
    if (10 === n || 13 === n) return !0;
  }
  return !1;
}
function Pn(e) {
  let t = "",
    n = !1;
  for (let s = 0; s < e.length; s++)
    rt(e.charCodeAt(s)) ? n || ((t += " "), (n = !0)) : ((t += e[s]), (n = !1));
  return t;
}
function Dn(e) {
  (gn[0] || ln).children.push(e);
}
function kn(e, t) {
  return {
    start: Tn.getPos(e),
    end: null == t ? t : Tn.getPos(t),
    source: null == t ? t : yn(e, t),
  };
}
function Vn(e, t) {
  ((e.end = Tn.getPos(t)), (e.source = yn(e.start.offset, t)));
}
function wn(e) {
  const t = {
    type: 6,
    name: e.rawName,
    nameLoc: kn(e.loc.start.offset, e.loc.start.offset + e.rawName.length),
    value: void 0,
    loc: e.loc,
  };
  if (e.exp) {
    const n = e.exp.loc;
    (n.end.offset < e.loc.end.offset &&
      (n.start.offset--, n.start.column--, n.end.offset++, n.end.column++),
      (t.value = { type: 2, content: e.exp.content, loc: n }));
  }
  return t;
}
function Xn(e, t = !1, n, s = 0, i = 0) {
  return Je(e, t, n, s);
}
function Fn(e, t, n) {
  cn.onError(Et(e, kn(t, t)));
}
function Un(e, t) {
  if (
    (Tn.reset(),
    (hn = null),
    (pn = null),
    (un = ""),
    (fn = -1),
    (mn = -1),
    (gn.length = 0),
    (dn = e),
    (cn = y({}, an)),
    t)
  ) {
    let e;
    for (e in t) null != t[e] && (cn[e] = t[e]);
  }
  ((Tn.mode = "html" === cn.parseMode ? 1 : "sfc" === cn.parseMode ? 2 : 0),
    (Tn.inXML = 1 === cn.ns || 2 === cn.ns));
  const n = t && t.delimiters;
  n && ((Tn.delimiterOpen = ct(n[0])), (Tn.delimiterClose = ct(n[1])));
  const s = (ln = $e([], e));
  return (Tn.parse(dn), (s.loc = kn(0, e.length)), (s.children = Ln(s.children)), (ln = null), s);
}
function Bn(e, t) {
  Hn(e, void 0, t, !!$n(e));
}
function $n(e) {
  const t = e.children.filter((e) => 3 !== e.type);
  return 1 !== t.length || 1 !== t[0].type || Kt(t[0]) ? null : t[0];
}
function Hn(e, t, n, s = !1, i = !1) {
  const { children: o } = e,
    r = [];
  for (let d = 0; d < o.length; d++) {
    const t = o[d];
    if (1 === t.type && 0 === t.tagType) {
      const e = s ? 0 : Gn(t, n);
      if (e > 0) {
        if (e >= 2) {
          ((t.codegenNode.patchFlag = -1), r.push(t));
          continue;
        }
      } else {
        const e = t.codegenNode;
        if (13 === e.type) {
          const s = e.patchFlag;
          if ((void 0 === s || 512 === s || 1 === s) && Jn(t, n) >= 2) {
            const s = Wn(t);
            s && (e.props = n.hoist(s));
          }
          e.dynamicProps && (e.dynamicProps = n.hoist(e.dynamicProps));
        }
      }
    } else if (12 === t.type) {
      if ((s ? 0 : Gn(t, n)) >= 2) {
        (14 === t.codegenNode.type &&
          t.codegenNode.arguments.length > 0 &&
          t.codegenNode.arguments.push("-1"),
          r.push(t));
        continue;
      }
    }
    if (1 === t.type) {
      const s = 1 === t.tagType;
      (s && n.scopes.vSlot++, Hn(t, e, n, !1, i), s && n.scopes.vSlot--);
    } else if (11 === t.type) Hn(t, e, n, 1 === t.children.length, !0);
    else if (9 === t.type)
      for (let s = 0; s < t.branches.length; s++)
        Hn(t.branches[s], e, n, 1 === t.branches[s].children.length, i);
  }
  let a = !1;
  if (r.length === o.length && 1 === e.type)
    if (0 === e.tagType && e.codegenNode && 13 === e.codegenNode.type && P(e.codegenNode.children))
      ((e.codegenNode.children = c(Ge(e.codegenNode.children))), (a = !0));
    else if (
      1 === e.tagType &&
      e.codegenNode &&
      13 === e.codegenNode.type &&
      e.codegenNode.children &&
      !P(e.codegenNode.children) &&
      15 === e.codegenNode.children.type
    ) {
      const t = l(e.codegenNode, "default");
      t && ((t.returns = c(Ge(t.returns))), (a = !0));
    } else if (
      3 === e.tagType &&
      t &&
      1 === t.type &&
      1 === t.tagType &&
      t.codegenNode &&
      13 === t.codegenNode.type &&
      t.codegenNode.children &&
      !P(t.codegenNode.children) &&
      15 === t.codegenNode.children.type
    ) {
      const n = Bt(e, "slot", !0),
        s = n && n.arg && l(t.codegenNode, n.arg);
      s && ((s.returns = c(Ge(s.returns))), (a = !0));
    }
  if (!a) for (const d of r) d.codegenNode = n.cache(d.codegenNode);
  function c(e) {
    const t = n.cache(e);
    return ((t.needArraySpread = !0), t);
  }
  function l(e, t) {
    if (e.children && !P(e.children) && 15 === e.children.type) {
      const n = e.children.properties.find((e) => e.key === t || e.key.content === t);
      return n && n.value;
    }
  }
  r.length && n.transformHoist && n.transformHoist(o, n, e);
}
function Gn(e, t) {
  const { constantCache: n } = t;
  switch (e.type) {
    case 1:
      if (0 !== e.tagType) return 0;
      const s = n.get(e);
      if (void 0 !== s) return s;
      const i = e.codegenNode;
      if (13 !== i.type) return 0;
      if (i.isBlock && "svg" !== e.tag && "foreignObject" !== e.tag && "math" !== e.tag) return 0;
      if (void 0 === i.patchFlag) {
        let s = 3;
        const o = Jn(e, t);
        if (0 === o) return (n.set(e, 0), 0);
        o < s && (s = o);
        for (let i = 0; i < e.children.length; i++) {
          const o = Gn(e.children[i], t);
          if (0 === o) return (n.set(e, 0), 0);
          o < s && (s = o);
        }
        if (s > 1)
          for (let i = 0; i < e.props.length; i++) {
            const o = e.props[i];
            if (7 === o.type && "bind" === o.name && o.exp) {
              const i = Gn(o.exp, t);
              if (0 === i) return (n.set(e, 0), 0);
              i < s && (s = i);
            }
          }
        if (i.isBlock) {
          for (let t = 0; t < e.props.length; t++) {
            if (7 === e.props[t].type) return (n.set(e, 0), 0);
          }
          (t.removeHelper(oe),
            t.removeHelper(tt(t.inSSR, i.isComponent)),
            (i.isBlock = !1),
            t.helper(et(t.inSSR, i.isComponent)));
        }
        return (n.set(e, s), s);
      }
      return (n.set(e, 0), 0);
    case 2:
    case 3:
      return 3;
    case 9:
    case 11:
    case 10:
    default:
      return 0;
    case 5:
    case 12:
      return Gn(e.content, t);
    case 4:
      return e.constType;
    case 8:
      let o = 3;
      for (let n = 0; n < e.children.length; n++) {
        const s = e.children[n];
        if (O(s) || A(s)) continue;
        const i = Gn(s, t);
        if (0 === i) return 0;
        i < o && (o = i);
      }
      return o;
    case 20:
      return 2;
  }
}
const jn = new Set([ye, Oe, Ce, Ae]);
function qn(e, t) {
  if (14 === e.type && !O(e.callee) && jn.has(e.callee)) {
    const n = e.arguments[0];
    if (4 === n.type) return Gn(n, t);
    if (14 === n.type) return qn(n, t);
  }
  return 0;
}
function Jn(e, t) {
  let n = 3;
  const s = Wn(e);
  if (s && 15 === s.type) {
    const { properties: e } = s;
    for (let s = 0; s < e.length; s++) {
      const { key: i, value: o } = e[s],
        r = Gn(i, t);
      if (0 === r) return r;
      let a;
      if ((r < n && (n = r), (a = 4 === o.type ? Gn(o, t) : 14 === o.type ? qn(o, t) : 0), 0 === a))
        return a;
      a < n && (n = a);
    }
  }
  return n;
}
function Wn(e) {
  const t = e.codegenNode;
  if (13 === t.type) return t.props;
}
function Kn(
  e,
  {
    filename: t = "",
    prefixIdentifiers: n = !1,
    hoistStatic: s = !1,
    hmr: i = !1,
    cacheHandlers: o = !1,
    nodeTransforms: r = [],
    directiveTransforms: a = {},
    transformHoist: c = null,
    isBuiltInComponent: l = I,
    isCustomElement: d = I,
    expressionPlugins: h = [],
    scopeId: p = null,
    slotted: u = !0,
    ssr: f = !1,
    inSSR: m = !1,
    ssrCssVars: E = "",
    bindingMetadata: _ = x,
    inline: S = !1,
    isTS: g = !1,
    onError: T = ft,
    onWarn: N = mt,
    compatConfig: y,
  },
) {
  const C = t.replace(/\?.*$/, "").match(/([^/\\]+)\.\w+$/),
    A = {
      filename: t,
      selfName: C && b(R(C[1])),
      prefixIdentifiers: n,
      hoistStatic: s,
      hmr: i,
      cacheHandlers: o,
      nodeTransforms: r,
      directiveTransforms: a,
      transformHoist: c,
      isBuiltInComponent: l,
      isCustomElement: d,
      expressionPlugins: h,
      scopeId: p,
      slotted: u,
      ssr: f,
      inSSR: m,
      ssrCssVars: E,
      bindingMetadata: _,
      inline: S,
      isTS: g,
      onError: T,
      onWarn: N,
      compatConfig: y,
      root: e,
      helpers: new Map(),
      components: new Set(),
      directives: new Set(),
      hoists: [],
      imports: [],
      cached: [],
      constantCache: new WeakMap(),
      temps: 0,
      identifiers: Object.create(null),
      scopes: { vFor: 0, vSlot: 0, vPre: 0, vOnce: 0 },
      parent: null,
      grandParent: null,
      currentNode: e,
      childIndex: 0,
      inVOnce: !1,
      helper(e) {
        const t = A.helpers.get(e) || 0;
        return (A.helpers.set(e, t + 1), e);
      },
      removeHelper(e) {
        const t = A.helpers.get(e);
        if (t) {
          const n = t - 1;
          n ? A.helpers.set(e, n) : A.helpers.delete(e);
        }
      },
      helperString: (e) => `_${Fe[A.helper(e)]}`,
      replaceNode(e) {
        A.parent.children[A.childIndex] = A.currentNode = e;
      },
      removeNode(e) {
        const t = A.parent.children,
          n = e ? t.indexOf(e) : A.currentNode ? A.childIndex : -1;
        (e && e !== A.currentNode
          ? A.childIndex > n && (A.childIndex--, A.onNodeRemoved())
          : ((A.currentNode = null), A.onNodeRemoved()),
          A.parent.children.splice(n, 1));
      },
      onNodeRemoved: I,
      addIdentifiers(e) {},
      removeIdentifiers(e) {},
      hoist(e) {
        (O(e) && (e = Je(e)), A.hoists.push(e));
        const t = Je(`_hoisted_${A.hoists.length}`, !1, e.loc, 2);
        return ((t.hoisted = e), t);
      },
      cache(e, t = !1, n = !1) {
        const s = Qe(A.cached.length, e, t, n);
        return (A.cached.push(s), s);
      },
    };
  return ((A.filters = new Set()), A);
}
function Yn(e, t) {
  const n = Kn(e, t);
  (zn(e, n),
    t.hoistStatic && Bn(e, n),
    t.ssr ||
      (function (e, t) {
        const { helper: n } = t,
          { children: s } = e;
        if (1 === s.length) {
          const n = $n(e);
          if (n && n.codegenNode) {
            const s = n.codegenNode;
            (13 === s.type && nt(s, t), (e.codegenNode = s));
          } else e.codegenNode = s[0];
        } else if (s.length > 1) {
          let s = 64;
          e.codegenNode = He(t, n(ee), void 0, e.children, s, void 0, void 0, !0, void 0, !1);
        }
      })(e, n),
    (e.helpers = new Set([...n.helpers.keys()])),
    (e.components = [...n.components]),
    (e.directives = [...n.directives]),
    (e.imports = n.imports),
    (e.hoists = n.hoists),
    (e.temps = n.temps),
    (e.cached = n.cached),
    (e.transformed = !0),
    (e.filters = [...n.filters]));
}
function zn(e, t) {
  t.currentNode = e;
  const { nodeTransforms: n } = t,
    s = [];
  for (let o = 0; o < n.length; o++) {
    const i = n[o](e, t);
    if ((i && (P(i) ? s.push(...i) : s.push(i)), !t.currentNode)) return;
    e = t.currentNode;
  }
  switch (e.type) {
    case 3:
      t.ssr || t.helper(de);
      break;
    case 5:
      t.ssr || t.helper(Ne);
      break;
    case 9:
      for (let n = 0; n < e.branches.length; n++) zn(e.branches[n], t);
      break;
    case 10:
    case 11:
    case 1:
    case 0:
      !(function (e, t) {
        let n = 0;
        const s = () => {
          n--;
        };
        for (; n < e.children.length; n++) {
          const i = e.children[n];
          O(i) ||
            ((t.grandParent = t.parent),
            (t.parent = e),
            (t.childIndex = n),
            (t.onNodeRemoved = s),
            zn(i, t));
        }
      })(e, t);
  }
  t.currentNode = e;
  let i = s.length;
  for (; i--; ) s[i]();
}
function Qn(e, t) {
  const n = O(e) ? (t) => t === e : (t) => e.test(t);
  return (e, s) => {
    if (1 === e.type) {
      const { props: i } = e;
      if (3 === e.tagType && i.some(Jt)) return;
      const o = [];
      for (let r = 0; r < i.length; r++) {
        const a = i[r];
        if (7 === a.type && n(a.name)) {
          (i.splice(r, 1), r--);
          const n = t(e, a, s);
          n && o.push(n);
        }
      }
      return o;
    }
  };
}
const Zn = "/*@__PURE__*/",
  es = (e) => `${Fe[e]}: _${Fe[e]}`;
function ts(e, t = {}) {
  const n = (function (
    e,
    {
      mode: t = "function",
      prefixIdentifiers: n = "module" === t,
      sourceMap: s = !1,
      filename: i = "template.vue.html",
      scopeId: o = null,
      optimizeImports: r = !1,
      runtimeGlobalName: a = "Vue",
      runtimeModuleName: c = "vue",
      ssrRuntimeModuleName: l = "vue/server-renderer",
      ssr: d = !1,
      isTS: h = !1,
      inSSR: p = !1,
    },
  ) {
    const u = {
      mode: t,
      prefixIdentifiers: n,
      sourceMap: s,
      filename: i,
      scopeId: o,
      optimizeImports: r,
      runtimeGlobalName: a,
      runtimeModuleName: c,
      ssrRuntimeModuleName: l,
      ssr: d,
      isTS: h,
      inSSR: p,
      source: e.source,
      code: "",
      column: 1,
      line: 1,
      offset: 0,
      indentLevel: 0,
      pure: !1,
      map: void 0,
      helper: (e) => `_${Fe[e]}`,
      push(e, t = -2, n) {
        u.code += e;
      },
      indent() {
        f(++u.indentLevel);
      },
      deindent(e = !1) {
        e ? --u.indentLevel : f(--u.indentLevel);
      },
      newline() {
        f(u.indentLevel);
      },
    };
    function f(e) {
      u.push("\n" + "  ".repeat(e), 0);
    }
    return u;
  })(e, t);
  t.onContextCreated && t.onContextCreated(n);
  const {
      mode: s,
      push: i,
      prefixIdentifiers: o,
      indent: r,
      deindent: a,
      newline: c,
      scopeId: l,
      ssr: d,
    } = n,
    h = Array.from(e.helpers),
    p = h.length > 0,
    u = !o && "module" !== s;
  !(function (e, t) {
    const {
        ssr: n,
        prefixIdentifiers: s,
        push: i,
        newline: o,
        runtimeModuleName: r,
        runtimeGlobalName: a,
        ssrRuntimeModuleName: c,
      } = t,
      l = a,
      d = Array.from(e.helpers);
    if (d.length > 0 && (i(`const _Vue = ${l}\n`, -1), e.hoists.length)) {
      i(
        `const { ${[ce, le, de, he, pe]
          .filter((e) => d.includes(e))
          .map(es)
          .join(", ")} } = _Vue\n`,
        -1,
      );
    }
    ((function (e, t) {
      if (!e.length) return;
      t.pure = !0;
      const { push: n, newline: s } = t;
      s();
      for (let i = 0; i < e.length; i++) {
        const o = e[i];
        o && (n(`const _hoisted_${i + 1} = `), os(o, t), s());
      }
      t.pure = !1;
    })(e.hoists, t),
      o(),
      i("return "));
  })(e, n);
  if (
    (i(
      `function ${d ? "ssrRender" : "render"}(${(d ? ["_ctx", "_push", "_parent", "_attrs"] : ["_ctx", "_cache"]).join(", ")}) {`,
    ),
    r(),
    u && (i("with (_ctx) {"), r(), p && (i(`const { ${h.map(es).join(", ")} } = _Vue\n`, -1), c())),
    e.components.length &&
      (ns(e.components, "component", n), (e.directives.length || e.temps > 0) && c()),
    e.directives.length && (ns(e.directives, "directive", n), e.temps > 0 && c()),
    e.filters && e.filters.length && (c(), ns(e.filters, "filter", n), c()),
    e.temps > 0)
  ) {
    i("let ");
    for (let t = 0; t < e.temps; t++) i(`${t > 0 ? ", " : ""}_temp${t}`);
  }
  return (
    (e.components.length || e.directives.length || e.temps) && (i("\n", 0), c()),
    d || i("return "),
    e.codegenNode ? os(e.codegenNode, n) : i("null"),
    u && (a(), i("}")),
    a(),
    i("}"),
    { ast: e, code: n.code, preamble: "", map: n.map ? n.map.toJSON() : void 0 }
  );
}
function ns(e, t, { helper: n, push: s, newline: i, isTS: o }) {
  const r = n("filter" === t ? Ee : "component" === t ? ue : me);
  for (let a = 0; a < e.length; a++) {
    let n = e[a];
    const c = n.endsWith("__self");
    (c && (n = n.slice(0, -6)),
      s(`const ${en(n, t)} = ${r}(${JSON.stringify(n)}${c ? ", true" : ""})${o ? "!" : ""}`),
      a < e.length - 1 && i());
  }
}
function ss(e, t) {
  const n = e.length > 3 || !1;
  (t.push("["), n && t.indent(), is(e, t, n), n && t.deindent(), t.push("]"));
}
function is(e, t, n = !1, s = !0) {
  const { push: i, newline: o } = t;
  for (let r = 0; r < e.length; r++) {
    const a = e[r];
    (O(a) ? i(a, -3) : P(a) ? ss(a, t) : os(a, t),
      r < e.length - 1 && (n ? (s && i(","), o()) : s && i(", ")));
  }
}
function os(e, t) {
  if (O(e)) t.push(e, -3);
  else if (A(e)) t.push(t.helper(e));
  else
    switch (e.type) {
      case 1:
      case 9:
      case 11:
      case 12:
        os(e.codegenNode, t);
        break;
      case 2:
        !(function (e, t) {
          t.push(JSON.stringify(e.content), -3, e);
        })(e, t);
        break;
      case 4:
        rs(e, t);
        break;
      case 5:
        !(function (e, t) {
          const { push: n, helper: s, pure: i } = t;
          i && n(Zn);
          (n(`${s(Ne)}(`), os(e.content, t), n(")"));
        })(e, t);
        break;
      case 8:
        as(e, t);
        break;
      case 3:
        !(function (e, t) {
          const { push: n, helper: s, pure: i } = t;
          i && n(Zn);
          n(`${s(de)}(${JSON.stringify(e.content)})`, -3, e);
        })(e, t);
        break;
      case 13:
        !(function (e, t) {
          const { push: n, helper: s, pure: i } = t,
            {
              tag: o,
              props: r,
              children: a,
              patchFlag: c,
              dynamicProps: l,
              directives: d,
              isBlock: h,
              disableTracking: p,
              isComponent: u,
            } = e;
          let f;
          c && (f = String(c));
          d && n(s(_e) + "(");
          h && n(`(${s(oe)}(${p ? "true" : ""}), `);
          i && n(Zn);
          const m = h ? tt(t.inSSR, u) : et(t.inSSR, u);
          (n(s(m) + "(", -2, e),
            is(
              (function (e) {
                let t = e.length;
                for (; t-- && null == e[t]; );
                return e.slice(0, t + 1).map((e) => e || "null");
              })([o, r, a, f, l]),
              t,
            ),
            n(")"),
            h && n(")"));
          d && (n(", "), os(d, t), n(")"));
        })(e, t);
        break;
      case 14:
        !(function (e, t) {
          const { push: n, helper: s, pure: i } = t,
            o = O(e.callee) ? e.callee : s(e.callee);
          i && n(Zn);
          (n(o + "(", -2, e), is(e.arguments, t), n(")"));
        })(e, t);
        break;
      case 15:
        !(function (e, t) {
          const { push: n, indent: s, deindent: i, newline: o } = t,
            { properties: r } = e;
          if (!r.length) return void n("{}", -2, e);
          const a = r.length > 1 || !1;
          (n(a ? "{" : "{ "), a && s());
          for (let c = 0; c < r.length; c++) {
            const { key: e, value: s } = r[c];
            (cs(e, t), n(": "), os(s, t), c < r.length - 1 && (n(","), o()));
          }
          (a && i(), n(a ? "}" : " }"));
        })(e, t);
        break;
      case 17:
        !(function (e, t) {
          ss(e.elements, t);
        })(e, t);
        break;
      case 18:
        !(function (e, t) {
          const { push: n, indent: s, deindent: i } = t,
            { params: o, returns: r, body: a, newline: c, isSlot: l } = e;
          l && n(`_${Fe[De]}(`);
          (n("(", -2, e), P(o) ? is(o, t) : o && os(o, t));
          (n(") => "), (c || a) && (n("{"), s()));
          r ? (c && n("return "), P(r) ? ss(r, t) : os(r, t)) : a && os(a, t);
          (c || a) && (i(), n("}"));
          l && (e.isNonScopedSlot && n(", undefined, true"), n(")"));
        })(e, t);
        break;
      case 19:
        !(function (e, t) {
          const { test: n, consequent: s, alternate: i, newline: o } = e,
            { push: r, indent: a, deindent: c, newline: l } = t;
          if (4 === n.type) {
            const e = !bt(n.content);
            (e && r("("), rs(n, t), e && r(")"));
          } else (r("("), os(n, t), r(")"));
          (o && a(),
            t.indentLevel++,
            o || r(" "),
            r("? "),
            os(s, t),
            t.indentLevel--,
            o && l(),
            o || r(" "),
            r(": "));
          const d = 19 === i.type;
          d || t.indentLevel++;
          (os(i, t), d || t.indentLevel--);
          o && c(!0);
        })(e, t);
        break;
      case 20:
        !(function (e, t) {
          const { push: n, helper: s, indent: i, deindent: o, newline: r } = t,
            { needPauseTracking: a, needArraySpread: c } = e;
          c && n("[...(");
          (n(`_cache[${e.index}] || (`),
            a && (i(), n(`${s(Le)}(-1`), e.inVOnce && n(", true"), n("),"), r(), n("(")));
          (n(`_cache[${e.index}] = `),
            os(e.value, t),
            a &&
              (n(`).cacheIndex = ${e.index},`),
              r(),
              n(`${s(Le)}(1),`),
              r(),
              n(`_cache[${e.index}]`),
              o()));
          (n(")"), c && n(")]"));
        })(e, t);
        break;
      case 21:
        is(e.body, t, !0, !1);
    }
}
function rs(e, t) {
  const { content: n, isStatic: s } = e;
  t.push(s ? JSON.stringify(n) : n, -3, e);
}
function as(e, t) {
  for (let n = 0; n < e.children.length; n++) {
    const s = e.children[n];
    O(s) ? t.push(s, -3) : os(s, t);
  }
}
function cs(e, t) {
  const { push: n } = t;
  if (8 === e.type) (n("["), as(e, t), n("]"));
  else if (e.isStatic) {
    n(bt(e.content) ? e.content : JSON.stringify(e.content), -2, e);
  } else n(`[${e.content}]`, -3, e);
}
new RegExp(
  "\\b" +
    "arguments,await,break,case,catch,class,const,continue,debugger,default,delete,do,else,export,extends,finally,for,function,if,import,let,new,return,super,switch,throw,try,var,void,while,with,yield"
      .split(",")
      .join("\\b|\\b") +
    "\\b",
);
function ls(e, t, n = !1, s = !1, i = Object.create(t.identifiers)) {
  return e;
}
const ds = Qn(/^(?:if|else|else-if)$/, (e, t, n) =>
  hs(e, t, n, (e, t, s) => {
    const i = n.parent.children;
    let o = i.indexOf(e),
      r = 0;
    for (; o-- >= 0; ) {
      const e = i[o];
      e && 9 === e.type && (r += e.branches.length);
    }
    return () => {
      if (s) e.codegenNode = us(t, r, n);
      else {
        const s = (function (e) {
          for (;;)
            if (19 === e.type) {
              if (19 !== e.alternate.type) return e;
              e = e.alternate;
            } else 20 === e.type && (e = e.value);
        })(e.codegenNode);
        s.alternate = us(t, r + e.branches.length - 1, n);
      }
    };
  }),
);
function hs(e, t, n, s) {
  if (!("else" === t.name || (t.exp && t.exp.content.trim()))) {
    const s = t.exp ? t.exp.loc : e.loc;
    (n.onError(Et(28, t.loc)), (t.exp = Je("true", !1, s)));
  }
  if ("if" === t.name) {
    const o = ps(e, t),
      r = { type: 9, loc: ((i = e.loc), kn(i.start.offset, i.end.offset)), branches: [o] };
    if ((n.replaceNode(r), s)) return s(r, o, !0);
  } else {
    const i = n.parent.children;
    let o = i.indexOf(e);
    for (; o-- >= -1; ) {
      const r = i[o];
      if (!r || !rn(r)) {
        if (r && 9 === r.type) {
          (("else-if" !== t.name && "else" !== t.name) ||
            void 0 !== r.branches[r.branches.length - 1].condition ||
            n.onError(Et(30, e.loc)),
            n.removeNode());
          const i = ps(e, t);
          r.branches.push(i);
          const o = s && s(r, i, !1);
          (zn(i, n), o && o(), (n.currentNode = null));
        } else n.onError(Et(30, e.loc));
        break;
      }
      n.removeNode(r);
    }
  }
  var i;
}
function ps(e, t) {
  const n = 3 === e.tagType;
  return {
    type: 10,
    loc: e.loc,
    condition: "else" === t.name ? void 0 : t.exp,
    children: n && !Bt(e, "for") ? e.children : [e],
    userKey: $t(e, "key"),
    isTemplateIf: n,
  };
}
function us(e, t, n) {
  return e.condition ? ze(e.condition, fs(e, t, n), Ke(n.helper(de), ['""', "true"])) : fs(e, t, n);
}
function fs(e, t, n) {
  const { helper: s } = n,
    i = qe("key", Je(`${t}`, !1, Be, 2)),
    { children: o } = e,
    r = o[0];
  if (1 !== o.length || 1 !== r.type) {
    if (1 === o.length && 11 === r.type) {
      const e = r.codegenNode;
      return (Qt(e, i, n), e);
    }
    {
      let t = 64;
      return He(n, s(ee), je([i]), o, t, void 0, void 0, !0, !1, !1, e.loc);
    }
  }
  {
    const e = r.codegenNode,
      t = tn(e);
    return (13 === t.type && nt(t, n), Qt(t, i, n), e);
  }
}
const ms = Qn("for", (e, t, n) => {
  const { helper: s, removeHelper: i } = n;
  return Es(e, t, n, (t) => {
    const o = Ke(s(Se), [t.source]),
      r = Wt(e),
      a = Bt(e, "memo"),
      c = $t(e, "key", !1, !0);
    c && c.type;
    let l = c && (6 === c.type ? (c.value ? Je(c.value.content, !0) : void 0) : c.exp);
    const d = c && l ? qe("key", l) : null,
      h = 4 === t.source.type && t.source.constType > 0,
      p = h ? 64 : c ? 128 : 256;
    return (
      (t.codegenNode = He(n, s(ee), void 0, o, p, void 0, void 0, !0, !h, !1, e.loc)),
      () => {
        let c;
        const { children: p } = t,
          u = 1 !== p.length || 1 !== p[0].type,
          f = Kt(e) ? e : r && 1 === e.children.length && Kt(e.children[0]) ? e.children[0] : null;
        if (
          (f
            ? ((c = f.codegenNode), r && d && Qt(c, d, n))
            : u
              ? (c = He(
                  n,
                  s(ee),
                  d ? je([d]) : void 0,
                  e.children,
                  64,
                  void 0,
                  void 0,
                  !0,
                  void 0,
                  !1,
                ))
              : ((c = p[0].codegenNode),
                r && d && Qt(c, d, n),
                c.isBlock !== !h &&
                  (c.isBlock
                    ? (i(oe), i(tt(n.inSSR, c.isComponent)))
                    : i(et(n.inSSR, c.isComponent))),
                (c.isBlock = !h),
                c.isBlock ? (s(oe), s(tt(n.inSSR, c.isComponent))) : s(et(n.inSSR, c.isComponent))),
          a)
        ) {
          const e = Ye(Ss(t.parseResult, [Je("_cached")]));
          ((e.body = Ze([
            We(["const _memo = (", a.exp, ")"]),
            We([
              "if (_cached",
              ...(l ? [" && _cached.key === ", l] : []),
              ` && ${n.helperString(Xe)}(_cached, _memo)) return _cached`,
            ]),
            We(["const _item = ", c]),
            Je("_item.memo = _memo"),
            Je("return _item"),
          ])),
            o.arguments.push(e, Je("_cache"), Je(String(n.cached.length))),
            n.cached.push(null));
        } else o.arguments.push(Ye(Ss(t.parseResult), c, !0));
      }
    );
  });
});
function Es(e, t, n, s) {
  if (!t.exp) return void n.onError(Et(31, t.loc));
  const i = t.forParseResult;
  if (!i) return void n.onError(Et(32, t.loc));
  _s(i);
  const { addIdentifiers: o, removeIdentifiers: r, scopes: a } = n,
    { source: c, value: l, key: d, index: h } = i,
    p = {
      type: 11,
      loc: t.loc,
      source: c,
      valueAlias: l,
      keyAlias: d,
      objectIndexAlias: h,
      parseResult: i,
      children: Wt(e) ? e.children : [e],
    };
  (n.replaceNode(p), a.vFor++);
  const u = s && s(p);
  return () => {
    (a.vFor--, u && u());
  };
}
function _s(e, t) {
  e.finalized || (e.finalized = !0);
}
function Ss({ value: e, key: t, index: n }, s = []) {
  return (function (e) {
    let t = e.length;
    for (; t-- && !e[t]; );
    return e.slice(0, t + 1).map((e, t) => e || Je("_".repeat(t + 1), !1));
  })([e, t, n, ...s]);
}
const gs = Je("undefined", !1),
  Ts = (e, t) => {
    if (1 === e.type && (1 === e.tagType || 3 === e.tagType)) {
      const n = Bt(e, "slot");
      if (n)
        return (
          n.exp,
          t.scopes.vSlot++,
          () => {
            t.scopes.vSlot--;
          }
        );
    }
  },
  Ns = (e, t, n, s) => Ye(e, n, !1, !0, n.length ? n[0].loc : s);
function Is(e, t, n = Ns) {
  t.helper(De);
  const { children: s, loc: i } = e,
    o = [],
    r = [];
  let a = t.scopes.vSlot > 0 || t.scopes.vFor > 0;
  const c = Bt(e, "slot", !0);
  if (c) {
    const { arg: e, exp: t } = c;
    (e && !Ct(e) && (a = !0), o.push(qe(e || Je("default", !0), n(t, void 0, s, i))));
  }
  let l = !1,
    d = !1;
  const h = [],
    p = new Set();
  let u = 0;
  for (let E = 0; E < s.length; E++) {
    const e = s[E];
    let i;
    if (!Wt(e) || !(i = Bt(e, "slot", !0))) {
      3 !== e.type && h.push(e);
      continue;
    }
    if (c) {
      t.onError(Et(37, i.loc));
      break;
    }
    l = !0;
    const { children: f, loc: m } = e,
      { arg: _ = Je("default", !0), exp: S, loc: g } = i;
    let T;
    Ct(_) ? (T = _ ? _.content : "default") : (a = !0);
    const N = Bt(e, "for"),
      I = n(S, N, f, m);
    let y, O;
    if ((y = Bt(e, "if"))) ((a = !0), r.push(ze(y.exp, ys(_, I, u++), gs)));
    else if ((O = Bt(e, /^else(?:-if)?$/, !0))) {
      let e,
        n = E;
      for (; n-- && ((e = s[n]), rn(e)); );
      if (e && Wt(e) && Bt(e, /^(?:else-)?if$/)) {
        let e = r[r.length - 1];
        for (; 19 === e.alternate.type; ) e = e.alternate;
        e.alternate = O.exp ? ze(O.exp, ys(_, I, u++), gs) : ys(_, I, u++);
      } else t.onError(Et(30, O.loc));
    } else if (N) {
      a = !0;
      const e = N.forParseResult;
      e
        ? (_s(e), r.push(Ke(t.helper(Se), [e.source, Ye(Ss(e), ys(_, I), !0)])))
        : t.onError(Et(32, N.loc));
    } else {
      if (T) {
        if (p.has(T)) {
          t.onError(Et(38, g));
          continue;
        }
        (p.add(T), "default" === T && (d = !0));
      }
      o.push(qe(_, I));
    }
  }
  if (!c) {
    const e = (e, s) => {
      const o = n(e, void 0, s, i);
      return (t.compatConfig && (o.isNonScopedSlot = !0), qe("default", o));
    };
    l
      ? h.length && !h.every(on) && (d ? t.onError(Et(39, h[0].loc)) : o.push(e(void 0, h)))
      : o.push(e(void 0, s));
  }
  const f = a ? 2 : Os(e.children) ? 3 : 1;
  let m = je(o.concat(qe("_", Je(f + "", !1))), i);
  return (r.length && (m = Ke(t.helper(Te), [m, Ge(r)])), { slots: m, hasDynamicSlots: a });
}
function ys(e, t, n) {
  const s = [qe("name", e), qe("fn", t)];
  return (null != n && s.push(qe("key", Je(String(n), !0))), je(s));
}
function Os(e) {
  for (let t = 0; t < e.length; t++) {
    const n = e[t];
    switch (n.type) {
      case 1:
        if (2 === n.tagType || Os(n.children)) return !0;
        break;
      case 9:
        if (Os(n.branches)) return !0;
        break;
      case 10:
      case 11:
        if (Os(n.children)) return !0;
    }
  }
  return !1;
}
const Cs = new WeakMap(),
  As = (e, t) =>
    function () {
      if (1 !== (e = t.currentNode).type || (0 !== e.tagType && 1 !== e.tagType)) return;
      const { tag: n, props: s } = e,
        i = 1 === e.tagType;
      let o = i ? vs(e, t) : `"${n}"`;
      const r = L(o) && o.callee === fe;
      let a,
        c,
        l,
        d,
        h,
        p = 0,
        u =
          r ||
          o === te ||
          o === ne ||
          (!i && ("svg" === n || "foreignObject" === n || "math" === n));
      if (s.length > 0) {
        const n = bs(e, t, void 0, i, r);
        ((a = n.props), (p = n.patchFlag), (d = n.dynamicPropNames));
        const s = n.directives;
        ((h = s && s.length ? Ge(s.map((e) => Ls(e, t))) : void 0), n.shouldUseBlock && (u = !0));
      }
      if (e.children.length > 0) {
        o === se && ((u = !0), (p |= 1024));
        if (i && o !== te && o !== se) {
          const { slots: n, hasDynamicSlots: s } = Is(e, t);
          ((c = n), s && (p |= 1024));
        } else if (1 === e.children.length && o !== te) {
          const n = e.children[0],
            s = n.type,
            i = 5 === s || 8 === s;
          (i && 0 === Gn(n, t) && (p |= 1), (c = i || 2 === s ? n : e.children));
        } else c = e.children;
      }
      (d &&
        d.length &&
        (l = (function (e) {
          let t = "[";
          for (let n = 0, s = e.length; n < s; n++)
            ((t += JSON.stringify(e[n])), n < s - 1 && (t += ", "));
          return t + "]";
        })(d)),
        (e.codegenNode = He(t, o, a, c, 0 === p ? void 0 : p, l, h, !!u, !1, i, e.loc)));
    };
function vs(e, t, n = !1) {
  let { tag: s } = e;
  const i = Ms(s),
    o = $t(e, "is", !1, !0);
  if (o)
    if (i || pt("COMPILER_IS_ON_ELEMENT", t)) {
      let e;
      if (
        (6 === o.type
          ? (e = o.value && Je(o.value.content, !0))
          : ((e = o.exp), e || (e = Je("is", !1, o.arg.loc))),
        e)
      )
        return Ke(t.helper(fe), [e]);
    } else 6 === o.type && o.value.content.startsWith("vue:") && (s = o.value.content.slice(4));
  const r = At(s) || t.isBuiltInComponent(s);
  return r ? (n || t.helper(r), r) : (t.helper(ue), t.components.add(s), en(s, "component"));
}
function bs(e, t, n = e.props, s, i, o = !1) {
  const { tag: r, loc: a, children: c } = e;
  let l = [];
  const d = [],
    h = [],
    p = c.length > 0;
  let u = !1,
    f = 0,
    m = !1,
    E = !1,
    _ = !1,
    S = !1,
    g = !1,
    T = !1;
  const N = [],
    I = (e) => {
      (l.length && (d.push(je(Rs(l), a)), (l = [])), e && d.push(e));
    },
    y = () => {
      t.scopes.vFor > 0 && l.push(qe(Je("ref_for", !0), Je("true")));
    },
    O = ({ key: e, value: n }) => {
      if (Ct(e)) {
        const o = e.content,
          r = D(o);
        if (
          (!r ||
            (s && !i) ||
            "onclick" === o.toLowerCase() ||
            "onUpdate:modelValue" === o ||
            k(o) ||
            (S = !0),
          r && k(o) && (T = !0),
          r && 14 === n.type && (n = n.arguments[0]),
          20 === n.type || ((4 === n.type || 8 === n.type) && Gn(n, t) > 0))
        )
          return;
        ("ref" === o
          ? (m = !0)
          : "class" === o
            ? (E = !0)
            : "style" === o
              ? (_ = !0)
              : "key" === o || N.includes(o) || N.push(o),
          !s || ("class" !== o && "style" !== o) || N.includes(o) || N.push(o));
      } else g = !0;
    };
  for (let b = 0; b < n.length; b++) {
    const i = n[b];
    if (6 === i.type) {
      const { loc: e, name: n, nameLoc: s, value: o } = i;
      let a = !0;
      if (
        ("ref" === n && ((m = !0), y()),
        "is" === n &&
          (Ms(r) || (o && o.content.startsWith("vue:")) || pt("COMPILER_IS_ON_ELEMENT", t)))
      )
        continue;
      l.push(qe(Je(n, !0, s), Je(o ? o.content : "", a, o ? o.loc : e)));
    } else {
      const { name: n, arg: c, exp: m, loc: E, modifiers: _ } = i,
        S = "bind" === n,
        T = "on" === n;
      if ("slot" === n) {
        s || t.onError(Et(40, E));
        continue;
      }
      if ("once" === n || "memo" === n) continue;
      if ("is" === n || (S && Ht(c, "is") && (Ms(r) || pt("COMPILER_IS_ON_ELEMENT", t)))) continue;
      if (T && o) continue;
      if (
        (((S && Ht(c, "key")) || (T && p && Ht(c, "vue:before-update"))) && (u = !0),
        S && Ht(c, "ref") && y(),
        !c && (S || T))
      ) {
        if (((g = !0), m))
          if (S) {
            if ((I(), pt("COMPILER_V_BIND_OBJECT_ORDER", t))) {
              d.unshift(m);
              continue;
            }
            (y(), I(), d.push(m));
          } else I({ type: 14, loc: E, callee: t.helper(ve), arguments: s ? [m] : [m, "true"] });
        else t.onError(Et(S ? 34 : 35, E));
        continue;
      }
      S && _.some((e) => "prop" === e.content) && (f |= 32);
      const N = t.directiveTransforms[n];
      if (N) {
        const { props: n, needRuntime: s } = N(i, e, t);
        (!o && n.forEach(O),
          T && c && !Ct(c) ? I(je(n, a)) : l.push(...n),
          s && (h.push(i), A(s) && Cs.set(i, s)));
      } else v(n) || (h.push(i), p && (u = !0));
    }
  }
  let C;
  if (
    (d.length
      ? (I(), (C = d.length > 1 ? Ke(t.helper(Ie), d, a) : d[0]))
      : l.length && (C = je(Rs(l), a)),
    g
      ? (f |= 16)
      : (E && !s && (f |= 2), _ && !s && (f |= 4), N.length && (f |= 8), S && (f |= 32)),
    u || (0 !== f && 32 !== f) || !(m || T || h.length > 0) || (f |= 512),
    !t.inSSR && C)
  )
    switch (C.type) {
      case 15:
        let e = -1,
          n = -1,
          s = !1;
        for (let t = 0; t < C.properties.length; t++) {
          const i = C.properties[t].key;
          Ct(i)
            ? "class" === i.content
              ? (e = t)
              : "style" === i.content && (n = t)
            : i.isHandlerKey || (s = !0);
        }
        const i = C.properties[e],
          o = C.properties[n];
        s
          ? (C = Ke(t.helper(Ce), [C]))
          : (i && !Ct(i.value) && (i.value = Ke(t.helper(ye), [i.value])),
            o &&
              (_ ||
                (4 === o.value.type && "[" === o.value.content.trim()[0]) ||
                17 === o.value.type) &&
              (o.value = Ke(t.helper(Oe), [o.value])));
        break;
      case 14:
        break;
      default:
        C = Ke(t.helper(Ce), [Ke(t.helper(Ae), [C])]);
    }
  return { props: C, directives: h, patchFlag: f, dynamicPropNames: N, shouldUseBlock: u };
}
function Rs(e) {
  const t = new Map(),
    n = [];
  for (let s = 0; s < e.length; s++) {
    const i = e[s];
    if (8 === i.key.type || !i.key.isStatic) {
      n.push(i);
      continue;
    }
    const o = i.key.content,
      r = t.get(o);
    r ? ("style" === o || "class" === o || D(o)) && xs(r, i) : (t.set(o, i), n.push(i));
  }
  return n;
}
function xs(e, t) {
  17 === e.value.type ? e.value.elements.push(t.value) : (e.value = Ge([e.value, t.value], e.loc));
}
function Ls(e, t) {
  const n = [],
    s = Cs.get(e);
  s
    ? n.push(t.helperString(s))
    : (t.helper(me), t.directives.add(e.name), n.push(en(e.name, "directive")));
  const { loc: i } = e;
  if (
    (e.exp && n.push(e.exp),
    e.arg && (e.exp || n.push("void 0"), n.push(e.arg)),
    Object.keys(e.modifiers).length)
  ) {
    e.arg || (e.exp || n.push("void 0"), n.push("void 0"));
    const t = Je("true", !1, i);
    n.push(
      je(
        e.modifiers.map((e) => qe(e, t)),
        i,
      ),
    );
  }
  return Ge(n, e.loc);
}
function Ms(e) {
  return "component" === e || "Component" === e;
}
const Ps = (e, t) => {
  if (Kt(e)) {
    const { children: n, loc: s } = e,
      { slotName: i, slotProps: o } = Ds(e, t),
      r = [t.prefixIdentifiers ? "_ctx.$slots" : "$slots", i, "{}", "undefined", "true"];
    let a = 2;
    (o && ((r[2] = o), (a = 3)),
      n.length && ((r[3] = Ye([], n, !1, !1, s)), (a = 4)),
      t.scopeId && !t.slotted && (a = 5),
      r.splice(a),
      (e.codegenNode = Ke(t.helper(ge), r, s)));
  }
};
function Ds(e, t) {
  let n,
    s = '"default"';
  const i = [];
  for (let o = 0; o < e.props.length; o++) {
    const t = e.props[o];
    if (6 === t.type)
      t.value &&
        ("name" === t.name
          ? (s = JSON.stringify(t.value.content))
          : ((t.name = R(t.name)), i.push(t)));
    else if ("bind" === t.name && Ht(t.arg, "name")) {
      if (t.exp) s = t.exp;
      else if (t.arg && 4 === t.arg.type) {
        const e = R(t.arg.content);
        s = t.exp = Je(e, !1, t.arg.loc);
      }
    } else
      ("bind" === t.name && t.arg && Ct(t.arg) && (t.arg.content = R(t.arg.content)), i.push(t));
  }
  if (i.length > 0) {
    const { props: s, directives: o } = bs(e, t, i, !1, !1);
    ((n = s), o.length && t.onError(Et(36, o[0].loc)));
  }
  return { slotName: s, slotProps: n };
}
const ks = (e, t, n, s) => {
    const { loc: i, modifiers: o, arg: r } = e;
    let a;
    if ((e.exp || o.length || n.onError(Et(35, i)), 4 === r.type))
      if (r.isStatic) {
        let e = r.content;
        e.startsWith("vue:") && (e = `vnode-${e.slice(4)}`);
        a = Je(
          0 !== t.tagType || e.startsWith("vnode") || !/[A-Z]/.test(e) ? M(R(e)) : `on:${e}`,
          !0,
          r.loc,
        );
      } else a = We([`${n.helperString(xe)}(`, r, ")"]);
    else ((a = r), a.children.unshift(`${n.helperString(xe)}(`), a.children.push(")"));
    let c = e.exp;
    c && !c.content.trim() && (c = void 0);
    let l = n.cacheHandlers && !c && !n.inVOnce;
    if (c) {
      const e = kt(c),
        t = !(e || Ft(c)),
        n = c.content.includes(";");
      (t || (l && e)) &&
        (c = We([`${t ? "$event" : "(...args)"} => ${n ? "{" : "("}`, c, n ? "}" : ")"]));
    }
    let d = { props: [qe(a, c || Je("() => {}", !1, i))] };
    return (
      s && (d = s(d)),
      l && (d.props[0].value = n.cache(d.props[0].value)),
      d.props.forEach((e) => (e.key.isHandlerKey = !0)),
      d
    );
  },
  Vs = (e, t, n) => {
    const { modifiers: s, loc: i } = e,
      o = e.arg;
    let { exp: r } = e;
    return (
      r && 4 === r.type && !r.content.trim() && (r = void 0),
      4 !== o.type
        ? (o.children.unshift("("), o.children.push(') || ""'))
        : o.isStatic || (o.content = o.content ? `${o.content} || ""` : '""'),
      s.some((e) => "camel" === e.content) &&
        (4 === o.type
          ? o.isStatic
            ? (o.content = R(o.content))
            : (o.content = `${n.helperString(be)}(${o.content})`)
          : (o.children.unshift(`${n.helperString(be)}(`), o.children.push(")"))),
      n.inSSR ||
        (s.some((e) => "prop" === e.content) && ws(o, "."),
        s.some((e) => "attr" === e.content) && ws(o, "^")),
      { props: [qe(o, r)] }
    );
  },
  ws = (e, t) => {
    4 === e.type
      ? e.isStatic
        ? (e.content = t + e.content)
        : (e.content = `\`${t}\${${e.content}}\``)
      : (e.children.unshift(`'${t}' + (`), e.children.push(")"));
  },
  Xs = (e, t) => {
    if (0 === e.type || 1 === e.type || 11 === e.type || 10 === e.type)
      return () => {
        const n = e.children;
        let s,
          i = !1;
        for (let e = 0; e < n.length; e++) {
          const t = n[e];
          if (jt(t)) {
            i = !0;
            for (let i = e + 1; i < n.length; i++) {
              const o = n[i];
              if (!jt(o)) {
                s = void 0;
                break;
              }
              (s || (s = n[e] = We([t], t.loc)), s.children.push(" + ", o), n.splice(i, 1), i--);
            }
          }
        }
        if (
          i &&
          (1 !== n.length ||
            (0 !== e.type &&
              (1 !== e.type ||
                0 !== e.tagType ||
                e.props.find((e) => 7 === e.type && !t.directiveTransforms[e.name]) ||
                "template" === e.tag)))
        )
          for (let e = 0; e < n.length; e++) {
            const s = n[e];
            if (jt(s) || 8 === s.type) {
              const i = [];
              ((2 === s.type && " " === s.content) || i.push(s),
                t.ssr || 0 !== Gn(s, t) || i.push("1"),
                (n[e] = { type: 12, content: s, loc: s.loc, codegenNode: Ke(t.helper(he), i) }));
            }
          }
      };
  },
  Fs = new WeakSet(),
  Us = (e, t) => {
    if (1 === e.type && Bt(e, "once", !0)) {
      if (Fs.has(e) || t.inVOnce || t.inSSR) return;
      return (
        Fs.add(e),
        (t.inVOnce = !0),
        t.helper(Le),
        () => {
          t.inVOnce = !1;
          const e = t.currentNode;
          e.codegenNode && (e.codegenNode = t.cache(e.codegenNode, !0, !0));
        }
      );
    }
  },
  Bs = (e, t, n) => {
    const { exp: s, arg: i } = e;
    if (!s) return (n.onError(Et(41, e.loc)), $s());
    const o = s.loc.source.trim(),
      r = 4 === s.type ? s.content : o,
      a = n.bindingMetadata[o];
    if ("props" === a || "props-aliased" === a) return (n.onError(Et(44, s.loc)), $s());
    if (!r.trim() || !kt(s)) return (n.onError(Et(42, s.loc)), $s());
    const c = i || Je("modelValue", !0),
      l = i
        ? Ct(i)
          ? `onUpdate:${R(i.content)}`
          : We(['"onUpdate:" + ', i])
        : "onUpdate:modelValue";
    let d;
    d = We([`${n.isTS ? "($event: any)" : "$event"} => ((`, s, ") = $event)"]);
    const h = [qe(c, e.exp), qe(l, d)];
    if (e.modifiers.length && 1 === t.tagType) {
      const t = e.modifiers
          .map((e) => e.content)
          .map((e) => (bt(e) ? e : JSON.stringify(e)) + ": true")
          .join(", "),
        n = i ? (Ct(i) ? `${i.content}Modifiers` : We([i, ' + "Modifiers"'])) : "modelModifiers";
      h.push(qe(n, Je(`{ ${t} }`, !1, e.loc, 2)));
    }
    return $s(h);
  };
function $s(e = []) {
  return { props: e };
}
const Hs = /[\w).+\-_$\]]/,
  Gs = (e, t) => {
    pt("COMPILER_FILTERS", t) &&
      (5 === e.type
        ? js(e.content, t)
        : 1 === e.type &&
          e.props.forEach((e) => {
            7 === e.type && "for" !== e.name && e.exp && js(e.exp, t);
          }));
  };
function js(e, t) {
  if (4 === e.type) qs(e, t);
  else
    for (let n = 0; n < e.children.length; n++) {
      const s = e.children[n];
      "object" == typeof s &&
        (4 === s.type ? qs(s, t) : 8 === s.type ? js(e, t) : 5 === s.type && js(s.content, t));
    }
}
function qs(e, t) {
  const n = e.content;
  let s,
    i,
    o,
    r,
    a = !1,
    c = !1,
    l = !1,
    d = !1,
    h = 0,
    p = 0,
    u = 0,
    f = 0,
    m = [];
  for (o = 0; o < n.length; o++)
    if (((i = s), (s = n.charCodeAt(o)), a)) 39 === s && 92 !== i && (a = !1);
    else if (c) 34 === s && 92 !== i && (c = !1);
    else if (l) 96 === s && 92 !== i && (l = !1);
    else if (d) 47 === s && 92 !== i && (d = !1);
    else if (
      124 !== s ||
      124 === n.charCodeAt(o + 1) ||
      124 === n.charCodeAt(o - 1) ||
      h ||
      p ||
      u
    ) {
      switch (s) {
        case 34:
          c = !0;
          break;
        case 39:
          a = !0;
          break;
        case 96:
          l = !0;
          break;
        case 40:
          u++;
          break;
        case 41:
          u--;
          break;
        case 91:
          p++;
          break;
        case 93:
          p--;
          break;
        case 123:
          h++;
          break;
        case 125:
          h--;
      }
      if (47 === s) {
        let e,
          t = o - 1;
        for (; t >= 0 && ((e = n.charAt(t)), " " === e); t--);
        (e && Hs.test(e)) || (d = !0);
      }
    } else void 0 === r ? ((f = o + 1), (r = n.slice(0, o).trim())) : E();
  function E() {
    (m.push(n.slice(f, o).trim()), (f = o + 1));
  }
  if ((void 0 === r ? (r = n.slice(0, o).trim()) : 0 !== f && E(), m.length)) {
    for (o = 0; o < m.length; o++) r = Js(r, m[o], t);
    ((e.content = r), (e.ast = void 0));
  }
}
function Js(e, t, n) {
  n.helper(Ee);
  const s = t.indexOf("(");
  if (s < 0) return (n.filters.add(t), `${en(t, "filter")}(${e})`);
  {
    const i = t.slice(0, s),
      o = t.slice(s + 1);
    return (n.filters.add(i), `${en(i, "filter")}(${e}${")" !== o ? "," + o : o}`);
  }
}
const Ws = new WeakSet(),
  Ks = (e, t) => {
    if (1 === e.type) {
      const n = Bt(e, "memo");
      if (!n || Ws.has(e) || t.inSSR) return;
      return (
        Ws.add(e),
        () => {
          const s = e.codegenNode || t.currentNode.codegenNode;
          s &&
            13 === s.type &&
            (1 !== e.tagType && nt(s, t),
            (e.codegenNode = Ke(t.helper(we), [
              n.exp,
              Ye(void 0, s),
              "_cache",
              String(t.cached.length),
            ])),
            t.cached.push(null));
        }
      );
    }
  },
  Ys = (e, t) => {
    if (1 === e.type)
      for (const n of e.props)
        if (
          7 === n.type &&
          "bind" === n.name &&
          (!n.exp || (4 === n.exp.type && !n.exp.content.trim())) &&
          n.arg
        ) {
          const e = n.arg;
          if (4 === e.type && e.isStatic) {
            const t = R(e.content);
            (Rt.test(t[0]) || "-" === t[0]) && (n.exp = Je(t, !1, e.loc));
          } else (t.onError(Et(52, e.loc)), (n.exp = Je("", !0, e.loc)));
        }
  };
function zs(e) {
  return [[Ys, Us, ds, Ks, ms, Gs, Ps, As, Ts, Xs], { on: ks, bind: Vs, model: Bs }];
}
function Qs(e, t = {}) {
  const n = t.onError || ft,
    s = "module" === t.mode;
  !0 === t.prefixIdentifiers ? n(Et(47)) : s && n(Et(48));
  (t.cacheHandlers && n(Et(49)), t.scopeId && !s && n(Et(50)));
  const i = y({}, t, { prefixIdentifiers: !1 }),
    o = O(e) ? Un(e, i) : e,
    [r, a] = zs();
  return (
    Yn(
      o,
      y({}, i, {
        nodeTransforms: [...r, ...(t.nodeTransforms || [])],
        directiveTransforms: y({}, a, t.directiveTransforms || {}),
      }),
    ),
    ts(o, i)
  );
}
const Zs = () => ({ props: [] }),
  ei = Symbol(""),
  ti = Symbol(""),
  ni = Symbol(""),
  si = Symbol(""),
  ii = Symbol(""),
  oi = Symbol(""),
  ri = Symbol(""),
  ai = Symbol(""),
  ci = Symbol(""),
  li = Symbol("");
let di;
Ue({
  [ei]: "vModelRadio",
  [ti]: "vModelCheckbox",
  [ni]: "vModelText",
  [si]: "vModelSelect",
  [ii]: "vModelDynamic",
  [oi]: "withModifiers",
  [ri]: "withKeys",
  [ai]: "vShow",
  [ci]: "Transition",
  [li]: "TransitionGroup",
});
const hi = {
    parseMode: "html",
    isVoidTag: F,
    isNativeTag: (e) => V(e) || w(e) || X(e),
    isPreTag: (e) => "pre" === e,
    isIgnoreNewlineTag: (e) => "pre" === e || "textarea" === e,
    decodeEntities: function (e, t = !1) {
      return (
        di || (di = document.createElement("div")),
        t
          ? ((di.innerHTML = `<div foo="${e.replace(/"/g, "&quot;")}">`),
            di.children[0].getAttribute("foo"))
          : ((di.innerHTML = e), di.textContent)
      );
    },
    isBuiltInComponent: (e) =>
      "Transition" === e || "transition" === e
        ? ci
        : "TransitionGroup" === e || "transition-group" === e
          ? li
          : void 0,
    getNamespace(e, t, n) {
      let s = t ? t.ns : n;
      if (t && 2 === s)
        if ("annotation-xml" === t.tag) {
          if ("svg" === e) return 1;
          t.props.some(
            (e) =>
              6 === e.type &&
              "encoding" === e.name &&
              null != e.value &&
              ("text/html" === e.value.content || "application/xhtml+xml" === e.value.content),
          ) && (s = 0);
        } else /^m(?:[ions]|text)$/.test(t.tag) && "mglyph" !== e && "malignmark" !== e && (s = 0);
      else
        t &&
          1 === s &&
          (("foreignObject" !== t.tag && "desc" !== t.tag && "title" !== t.tag) || (s = 0));
      if (0 === s) {
        if ("svg" === e) return 1;
        if ("math" === e) return 2;
      }
      return s;
    },
  },
  pi = (e) => {
    1 === e.type &&
      e.props.forEach((t, n) => {
        6 === t.type &&
          "style" === t.name &&
          t.value &&
          (e.props[n] = {
            type: 7,
            name: "bind",
            arg: Je("style", !0, t.loc),
            exp: ui(t.value.content, t.loc),
            modifiers: [],
            loc: t.loc,
          });
      });
  },
  ui = (e, t) => {
    const n = U(e);
    return Je(JSON.stringify(n), !1, t, 3);
  };
function fi(e, t) {
  return Et(e, t);
}
const mi = {
    53: "v-html is missing expression.",
    54: "v-html will override element children.",
    55: "v-text is missing expression.",
    56: "v-text will override element children.",
    57: "v-model can only be used on <input>, <textarea> and <select> elements.",
    58: "v-model argument is not supported on plain elements.",
    59: "v-model cannot be used on file inputs since they are read-only. Use a v-on:change listener instead.",
    60: "Unnecessary value binding used alongside v-model. It will interfere with v-model's behavior.",
    61: "v-show is missing expression.",
    62: "<Transition> expects exactly one child element or component.",
    63: "Tags with side effect (<script> and <style>) are ignored in client component templates.",
  },
  Ei = B("passive,once,capture"),
  _i = B("stop,prevent,self,ctrl,shift,alt,meta,exact,middle"),
  Si = B("left,right"),
  gi = B("onkeyup,onkeydown,onkeypress"),
  Ti = (e, t) =>
    Ct(e) && "onclick" === e.content.toLowerCase()
      ? Je(t, !0)
      : 4 !== e.type
        ? We(["(", e, `) === "onClick" ? "${t}" : (`, e, ")"])
        : e,
  Ni = (e, t) => {
    1 !== e.type || 0 !== e.tagType || ("script" !== e.tag && "style" !== e.tag) || t.removeNode();
  },
  Ii = [pi],
  yi = {
    cloak: Zs,
    html: (e, t, n) => {
      const { exp: s, loc: i } = e;
      return (
        s || n.onError(fi(53, i)),
        t.children.length && (n.onError(fi(54, i)), (t.children.length = 0)),
        { props: [qe(Je("innerHTML", !0, i), s || Je("", !0))] }
      );
    },
    text: (e, t, n) => {
      const { exp: s, loc: i } = e;
      return (
        s || n.onError(fi(55, i)),
        t.children.length && (n.onError(fi(56, i)), (t.children.length = 0)),
        {
          props: [
            qe(
              Je("textContent", !0),
              s ? (Gn(s, n) > 0 ? s : Ke(n.helperString(Ne), [s], i)) : Je("", !0),
            ),
          ],
        }
      );
    },
    model: (e, t, n) => {
      const s = Bs(e, t, n);
      if (!s.props.length || 1 === t.tagType) return s;
      e.arg && n.onError(fi(58, e.arg.loc));
      const { tag: i } = t,
        o = n.isCustomElement(i);
      if ("input" === i || "textarea" === i || "select" === i || o) {
        let r = ni,
          a = !1;
        if ("input" === i || o) {
          const s = $t(t, "type");
          if (s) {
            if (7 === s.type) r = ii;
            else if (s.value)
              switch (s.value.content) {
                case "radio":
                  r = ei;
                  break;
                case "checkbox":
                  r = ti;
                  break;
                case "file":
                  ((a = !0), n.onError(fi(59, e.loc)));
              }
          } else Gt(t) && (r = ii);
        } else "select" === i && (r = si);
        a || (s.needRuntime = n.helper(r));
      } else n.onError(fi(57, e.loc));
      return (
        (s.props = s.props.filter((e) => !(4 === e.key.type && "modelValue" === e.key.content))),
        s
      );
    },
    on: (e, t, n) =>
      ks(e, t, n, (t) => {
        const { modifiers: s } = e;
        if (!s.length) return t;
        let { key: i, value: o } = t.props[0];
        const {
          keyModifiers: r,
          nonKeyModifiers: a,
          eventOptionModifiers: c,
        } = ((e, t, n) => {
          const s = [],
            i = [],
            o = [];
          for (let r = 0; r < t.length; r++) {
            const a = t[r].content;
            ("native" === a && ut("COMPILER_V_ON_NATIVE", n)) || Ei(a)
              ? o.push(a)
              : Si(a)
                ? Ct(e)
                  ? gi(e.content.toLowerCase())
                    ? s.push(a)
                    : i.push(a)
                  : (s.push(a), i.push(a))
                : _i(a)
                  ? i.push(a)
                  : s.push(a);
          }
          return { keyModifiers: s, nonKeyModifiers: i, eventOptionModifiers: o };
        })(i, s, n, e.loc);
        if (
          (a.includes("right") && (i = Ti(i, "onContextmenu")),
          a.includes("middle") && (i = Ti(i, "onMouseup")),
          a.length && (o = Ke(n.helper(oi), [o, JSON.stringify(a)])),
          !r.length ||
            (Ct(i) && !gi(i.content.toLowerCase())) ||
            (o = Ke(n.helper(ri), [o, JSON.stringify(r)])),
          c.length)
        ) {
          const e = c.map(b).join("");
          i = Ct(i) ? Je(`${i.content}${e}`, !0) : We(["(", i, `) + "${e}"`]);
        }
        return { props: [qe(i, o)] };
      }),
    show: (e, t, n) => {
      const { exp: s, loc: i } = e;
      return (s || n.onError(fi(61, i)), { props: [], needRuntime: n.helper(ai) });
    },
  };
const Oi = Object.defineProperty(
    {
      __proto__: null,
      BASE_TRANSITION: ie,
      BindingTypes: {
        DATA: "data",
        PROPS: "props",
        PROPS_ALIASED: "props-aliased",
        SETUP_LET: "setup-let",
        SETUP_CONST: "setup-const",
        SETUP_REACTIVE_CONST: "setup-reactive-const",
        SETUP_MAYBE_REF: "setup-maybe-ref",
        SETUP_REF: "setup-ref",
        OPTIONS: "options",
        LITERAL_CONST: "literal-const",
      },
      CAMELIZE: be,
      CAPITALIZE: Re,
      CREATE_BLOCK: re,
      CREATE_COMMENT: de,
      CREATE_ELEMENT_BLOCK: ae,
      CREATE_ELEMENT_VNODE: le,
      CREATE_SLOTS: Te,
      CREATE_STATIC: pe,
      CREATE_TEXT: he,
      CREATE_VNODE: ce,
      CompilerDeprecationTypes: {
        COMPILER_IS_ON_ELEMENT: "COMPILER_IS_ON_ELEMENT",
        COMPILER_V_BIND_SYNC: "COMPILER_V_BIND_SYNC",
        COMPILER_V_BIND_OBJECT_ORDER: "COMPILER_V_BIND_OBJECT_ORDER",
        COMPILER_V_ON_NATIVE: "COMPILER_V_ON_NATIVE",
        COMPILER_V_IF_V_FOR_PRECEDENCE: "COMPILER_V_IF_V_FOR_PRECEDENCE",
        COMPILER_NATIVE_TEMPLATE: "COMPILER_NATIVE_TEMPLATE",
        COMPILER_INLINE_TEMPLATE: "COMPILER_INLINE_TEMPLATE",
        COMPILER_FILTERS: "COMPILER_FILTERS",
      },
      ConstantTypes: {
        NOT_CONSTANT: 0,
        0: "NOT_CONSTANT",
        CAN_SKIP_PATCH: 1,
        1: "CAN_SKIP_PATCH",
        CAN_CACHE: 2,
        2: "CAN_CACHE",
        CAN_STRINGIFY: 3,
        3: "CAN_STRINGIFY",
      },
      DOMDirectiveTransforms: yi,
      DOMErrorCodes: {
        X_V_HTML_NO_EXPRESSION: 53,
        53: "X_V_HTML_NO_EXPRESSION",
        X_V_HTML_WITH_CHILDREN: 54,
        54: "X_V_HTML_WITH_CHILDREN",
        X_V_TEXT_NO_EXPRESSION: 55,
        55: "X_V_TEXT_NO_EXPRESSION",
        X_V_TEXT_WITH_CHILDREN: 56,
        56: "X_V_TEXT_WITH_CHILDREN",
        X_V_MODEL_ON_INVALID_ELEMENT: 57,
        57: "X_V_MODEL_ON_INVALID_ELEMENT",
        X_V_MODEL_ARG_ON_ELEMENT: 58,
        58: "X_V_MODEL_ARG_ON_ELEMENT",
        X_V_MODEL_ON_FILE_INPUT_ELEMENT: 59,
        59: "X_V_MODEL_ON_FILE_INPUT_ELEMENT",
        X_V_MODEL_UNNECESSARY_VALUE: 60,
        60: "X_V_MODEL_UNNECESSARY_VALUE",
        X_V_SHOW_NO_EXPRESSION: 61,
        61: "X_V_SHOW_NO_EXPRESSION",
        X_TRANSITION_INVALID_CHILDREN: 62,
        62: "X_TRANSITION_INVALID_CHILDREN",
        X_IGNORED_SIDE_EFFECT_TAG: 63,
        63: "X_IGNORED_SIDE_EFFECT_TAG",
        __EXTEND_POINT__: 64,
        64: "__EXTEND_POINT__",
      },
      DOMErrorMessages: mi,
      DOMNodeTransforms: Ii,
      ElementTypes: {
        ELEMENT: 0,
        0: "ELEMENT",
        COMPONENT: 1,
        1: "COMPONENT",
        SLOT: 2,
        2: "SLOT",
        TEMPLATE: 3,
        3: "TEMPLATE",
      },
      ErrorCodes: {
        ABRUPT_CLOSING_OF_EMPTY_COMMENT: 0,
        0: "ABRUPT_CLOSING_OF_EMPTY_COMMENT",
        CDATA_IN_HTML_CONTENT: 1,
        1: "CDATA_IN_HTML_CONTENT",
        DUPLICATE_ATTRIBUTE: 2,
        2: "DUPLICATE_ATTRIBUTE",
        END_TAG_WITH_ATTRIBUTES: 3,
        3: "END_TAG_WITH_ATTRIBUTES",
        END_TAG_WITH_TRAILING_SOLIDUS: 4,
        4: "END_TAG_WITH_TRAILING_SOLIDUS",
        EOF_BEFORE_TAG_NAME: 5,
        5: "EOF_BEFORE_TAG_NAME",
        EOF_IN_CDATA: 6,
        6: "EOF_IN_CDATA",
        EOF_IN_COMMENT: 7,
        7: "EOF_IN_COMMENT",
        EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT: 8,
        8: "EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT",
        EOF_IN_TAG: 9,
        9: "EOF_IN_TAG",
        INCORRECTLY_CLOSED_COMMENT: 10,
        10: "INCORRECTLY_CLOSED_COMMENT",
        INCORRECTLY_OPENED_COMMENT: 11,
        11: "INCORRECTLY_OPENED_COMMENT",
        INVALID_FIRST_CHARACTER_OF_TAG_NAME: 12,
        12: "INVALID_FIRST_CHARACTER_OF_TAG_NAME",
        MISSING_ATTRIBUTE_VALUE: 13,
        13: "MISSING_ATTRIBUTE_VALUE",
        MISSING_END_TAG_NAME: 14,
        14: "MISSING_END_TAG_NAME",
        MISSING_WHITESPACE_BETWEEN_ATTRIBUTES: 15,
        15: "MISSING_WHITESPACE_BETWEEN_ATTRIBUTES",
        NESTED_COMMENT: 16,
        16: "NESTED_COMMENT",
        UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME: 17,
        17: "UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME",
        UNEXPECTED_CHARACTER_IN_UNQUOTED_ATTRIBUTE_VALUE: 18,
        18: "UNEXPECTED_CHARACTER_IN_UNQUOTED_ATTRIBUTE_VALUE",
        UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME: 19,
        19: "UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME",
        UNEXPECTED_NULL_CHARACTER: 20,
        20: "UNEXPECTED_NULL_CHARACTER",
        UNEXPECTED_QUESTION_MARK_INSTEAD_OF_TAG_NAME: 21,
        21: "UNEXPECTED_QUESTION_MARK_INSTEAD_OF_TAG_NAME",
        UNEXPECTED_SOLIDUS_IN_TAG: 22,
        22: "UNEXPECTED_SOLIDUS_IN_TAG",
        X_INVALID_END_TAG: 23,
        23: "X_INVALID_END_TAG",
        X_MISSING_END_TAG: 24,
        24: "X_MISSING_END_TAG",
        X_MISSING_INTERPOLATION_END: 25,
        25: "X_MISSING_INTERPOLATION_END",
        X_MISSING_DIRECTIVE_NAME: 26,
        26: "X_MISSING_DIRECTIVE_NAME",
        X_MISSING_DYNAMIC_DIRECTIVE_ARGUMENT_END: 27,
        27: "X_MISSING_DYNAMIC_DIRECTIVE_ARGUMENT_END",
        X_V_IF_NO_EXPRESSION: 28,
        28: "X_V_IF_NO_EXPRESSION",
        X_V_IF_SAME_KEY: 29,
        29: "X_V_IF_SAME_KEY",
        X_V_ELSE_NO_ADJACENT_IF: 30,
        30: "X_V_ELSE_NO_ADJACENT_IF",
        X_V_FOR_NO_EXPRESSION: 31,
        31: "X_V_FOR_NO_EXPRESSION",
        X_V_FOR_MALFORMED_EXPRESSION: 32,
        32: "X_V_FOR_MALFORMED_EXPRESSION",
        X_V_FOR_TEMPLATE_KEY_PLACEMENT: 33,
        33: "X_V_FOR_TEMPLATE_KEY_PLACEMENT",
        X_V_BIND_NO_EXPRESSION: 34,
        34: "X_V_BIND_NO_EXPRESSION",
        X_V_ON_NO_EXPRESSION: 35,
        35: "X_V_ON_NO_EXPRESSION",
        X_V_SLOT_UNEXPECTED_DIRECTIVE_ON_SLOT_OUTLET: 36,
        36: "X_V_SLOT_UNEXPECTED_DIRECTIVE_ON_SLOT_OUTLET",
        X_V_SLOT_MIXED_SLOT_USAGE: 37,
        37: "X_V_SLOT_MIXED_SLOT_USAGE",
        X_V_SLOT_DUPLICATE_SLOT_NAMES: 38,
        38: "X_V_SLOT_DUPLICATE_SLOT_NAMES",
        X_V_SLOT_EXTRANEOUS_DEFAULT_SLOT_CHILDREN: 39,
        39: "X_V_SLOT_EXTRANEOUS_DEFAULT_SLOT_CHILDREN",
        X_V_SLOT_MISPLACED: 40,
        40: "X_V_SLOT_MISPLACED",
        X_V_MODEL_NO_EXPRESSION: 41,
        41: "X_V_MODEL_NO_EXPRESSION",
        X_V_MODEL_MALFORMED_EXPRESSION: 42,
        42: "X_V_MODEL_MALFORMED_EXPRESSION",
        X_V_MODEL_ON_SCOPE_VARIABLE: 43,
        43: "X_V_MODEL_ON_SCOPE_VARIABLE",
        X_V_MODEL_ON_PROPS: 44,
        44: "X_V_MODEL_ON_PROPS",
        X_INVALID_EXPRESSION: 45,
        45: "X_INVALID_EXPRESSION",
        X_KEEP_ALIVE_INVALID_CHILDREN: 46,
        46: "X_KEEP_ALIVE_INVALID_CHILDREN",
        X_PREFIX_ID_NOT_SUPPORTED: 47,
        47: "X_PREFIX_ID_NOT_SUPPORTED",
        X_MODULE_MODE_NOT_SUPPORTED: 48,
        48: "X_MODULE_MODE_NOT_SUPPORTED",
        X_CACHE_HANDLER_NOT_SUPPORTED: 49,
        49: "X_CACHE_HANDLER_NOT_SUPPORTED",
        X_SCOPE_ID_NOT_SUPPORTED: 50,
        50: "X_SCOPE_ID_NOT_SUPPORTED",
        X_VNODE_HOOKS: 51,
        51: "X_VNODE_HOOKS",
        X_V_BIND_INVALID_SAME_NAME_ARGUMENT: 52,
        52: "X_V_BIND_INVALID_SAME_NAME_ARGUMENT",
        __EXTEND_POINT__: 53,
        53: "__EXTEND_POINT__",
      },
      FRAGMENT: ee,
      GUARD_REACTIVE_PROPS: Ae,
      IS_MEMO_SAME: Xe,
      IS_REF: Ve,
      KEEP_ALIVE: se,
      MERGE_PROPS: Ie,
      NORMALIZE_CLASS: ye,
      NORMALIZE_PROPS: Ce,
      NORMALIZE_STYLE: Oe,
      Namespaces: { HTML: 0, 0: "HTML", SVG: 1, 1: "SVG", MATH_ML: 2, 2: "MATH_ML" },
      NodeTypes: {
        ROOT: 0,
        0: "ROOT",
        ELEMENT: 1,
        1: "ELEMENT",
        TEXT: 2,
        2: "TEXT",
        COMMENT: 3,
        3: "COMMENT",
        SIMPLE_EXPRESSION: 4,
        4: "SIMPLE_EXPRESSION",
        INTERPOLATION: 5,
        5: "INTERPOLATION",
        ATTRIBUTE: 6,
        6: "ATTRIBUTE",
        DIRECTIVE: 7,
        7: "DIRECTIVE",
        COMPOUND_EXPRESSION: 8,
        8: "COMPOUND_EXPRESSION",
        IF: 9,
        9: "IF",
        IF_BRANCH: 10,
        10: "IF_BRANCH",
        FOR: 11,
        11: "FOR",
        TEXT_CALL: 12,
        12: "TEXT_CALL",
        VNODE_CALL: 13,
        13: "VNODE_CALL",
        JS_CALL_EXPRESSION: 14,
        14: "JS_CALL_EXPRESSION",
        JS_OBJECT_EXPRESSION: 15,
        15: "JS_OBJECT_EXPRESSION",
        JS_PROPERTY: 16,
        16: "JS_PROPERTY",
        JS_ARRAY_EXPRESSION: 17,
        17: "JS_ARRAY_EXPRESSION",
        JS_FUNCTION_EXPRESSION: 18,
        18: "JS_FUNCTION_EXPRESSION",
        JS_CONDITIONAL_EXPRESSION: 19,
        19: "JS_CONDITIONAL_EXPRESSION",
        JS_CACHE_EXPRESSION: 20,
        20: "JS_CACHE_EXPRESSION",
        JS_BLOCK_STATEMENT: 21,
        21: "JS_BLOCK_STATEMENT",
        JS_TEMPLATE_LITERAL: 22,
        22: "JS_TEMPLATE_LITERAL",
        JS_IF_STATEMENT: 23,
        23: "JS_IF_STATEMENT",
        JS_ASSIGNMENT_EXPRESSION: 24,
        24: "JS_ASSIGNMENT_EXPRESSION",
        JS_SEQUENCE_EXPRESSION: 25,
        25: "JS_SEQUENCE_EXPRESSION",
        JS_RETURN_STATEMENT: 26,
        26: "JS_RETURN_STATEMENT",
      },
      OPEN_BLOCK: oe,
      POP_SCOPE_ID: Pe,
      PUSH_SCOPE_ID: Me,
      RENDER_LIST: Se,
      RENDER_SLOT: ge,
      RESOLVE_COMPONENT: ue,
      RESOLVE_DIRECTIVE: me,
      RESOLVE_DYNAMIC_COMPONENT: fe,
      RESOLVE_FILTER: Ee,
      SET_BLOCK_TRACKING: Le,
      SUSPENSE: ne,
      TELEPORT: te,
      TO_DISPLAY_STRING: Ne,
      TO_HANDLERS: ve,
      TO_HANDLER_KEY: xe,
      TRANSITION: ci,
      TRANSITION_GROUP: li,
      TS_NODE_TYPES: Ot,
      UNREF: ke,
      V_MODEL_CHECKBOX: ti,
      V_MODEL_DYNAMIC: ii,
      V_MODEL_RADIO: ei,
      V_MODEL_SELECT: si,
      V_MODEL_TEXT: ni,
      V_ON_WITH_KEYS: ri,
      V_ON_WITH_MODIFIERS: oi,
      V_SHOW: ai,
      WITH_CTX: De,
      WITH_DIRECTIVES: _e,
      WITH_MEMO: we,
      advancePositionWithClone: function (e, t, n = t.length) {
        return Ut({ offset: e.offset, line: e.line, column: e.column }, t, n);
      },
      advancePositionWithMutation: Ut,
      assert: function (e, t) {
        if (!e) throw new Error(t || "unexpected compiler condition");
      },
      baseCompile: Qs,
      baseParse: Un,
      buildDirectiveArgs: Ls,
      buildProps: bs,
      buildSlots: Is,
      checkCompatEnabled: ut,
      compile: function (e, t = {}) {
        return Qs(
          e,
          y({}, hi, t, {
            nodeTransforms: [Ni, ...Ii, ...(t.nodeTransforms || [])],
            directiveTransforms: y({}, yi, t.directiveTransforms || {}),
            transformHoist: null,
          }),
        );
      },
      convertToBlock: nt,
      createArrayExpression: Ge,
      createAssignmentExpression: function (e, t) {
        return { type: 24, left: e, right: t, loc: Be };
      },
      createBlockStatement: Ze,
      createCacheExpression: Qe,
      createCallExpression: Ke,
      createCompilerError: Et,
      createCompoundExpression: We,
      createConditionalExpression: ze,
      createDOMCompilerError: fi,
      createForLoopParams: Ss,
      createFunctionExpression: Ye,
      createIfStatement: function (e, t, n) {
        return { type: 23, test: e, consequent: t, alternate: n, loc: Be };
      },
      createInterpolation: function (e, t) {
        return { type: 5, loc: t, content: O(e) ? Je(e, !1, t) : e };
      },
      createObjectExpression: je,
      createObjectProperty: qe,
      createReturnStatement: function (e) {
        return { type: 26, returns: e, loc: Be };
      },
      createRoot: $e,
      createSequenceExpression: function (e) {
        return { type: 25, expressions: e, loc: Be };
      },
      createSimpleExpression: Je,
      createStructuralDirectiveTransform: Qn,
      createTemplateLiteral: function (e) {
        return { type: 22, elements: e, loc: Be };
      },
      createTransformContext: Kn,
      createVNodeCall: He,
      errorMessages: _t,
      extractIdentifiers: It,
      findDir: Bt,
      findProp: $t,
      forAliasRE: nn,
      generate: ts,
      generateCodeFrame: $,
      getBaseTransformPreset: zs,
      getConstantType: Gn,
      getMemoedVNodeCall: tn,
      getVNodeBlockHelper: tt,
      getVNodeHelper: et,
      hasDynamicKeyVBind: Gt,
      hasScopeRef: function e(t, n) {
        if (!t || 0 === Object.keys(n).length) return !1;
        switch (t.type) {
          case 1:
            for (let s = 0; s < t.props.length; s++) {
              const i = t.props[s];
              if (7 === i.type && (e(i.arg, n) || e(i.exp, n))) return !0;
            }
            return t.children.some((t) => e(t, n));
          case 11:
            return !!e(t.source, n) || t.children.some((t) => e(t, n));
          case 9:
            return t.branches.some((t) => e(t, n));
          case 10:
            return !!e(t.condition, n) || t.children.some((t) => e(t, n));
          case 4:
            return !t.isStatic && bt(t.content) && !!n[t.content];
          case 8:
            return t.children.some((t) => L(t) && e(t, n));
          case 5:
          case 12:
            return e(t.content, n);
          default:
            return !1;
        }
      },
      helperNameMap: Fe,
      injectProp: Qt,
      isAllWhitespace: sn,
      isCommentOrWhitespace: rn,
      isCoreComponent: At,
      isFnExpression: Ft,
      isFnExpressionBrowser: wt,
      isFnExpressionNode: Xt,
      isFunctionType: (e) => /Function(?:Expression|Declaration)$|Method$/.test(e.type),
      isInDestructureAssignment: function (e, t) {
        if (e && ("ObjectProperty" === e.type || "ArrayPattern" === e.type)) {
          let e = t.length;
          for (; e--; ) {
            const n = t[e];
            if ("AssignmentExpression" === n.type) return !0;
            if ("ObjectProperty" !== n.type && !n.type.endsWith("Pattern")) break;
          }
        }
        return !1;
      },
      isInNewExpression: function (e) {
        let t = e.length;
        for (; t--; ) {
          const n = e[t];
          if ("NewExpression" === n.type) return !0;
          if ("MemberExpression" !== n.type) break;
        }
        return !1;
      },
      isMemberExpression: kt,
      isMemberExpressionBrowser: Pt,
      isMemberExpressionNode: Dt,
      isReferencedIdentifier: function (e, t, n) {
        return !1;
      },
      isSimpleIdentifier: bt,
      isSlotOutlet: Kt,
      isStaticArgOf: Ht,
      isStaticExp: Ct,
      isStaticProperty: yt,
      isStaticPropertyKey: (e, t) => yt(t) && t.key === e,
      isTemplateNode: Wt,
      isText: jt,
      isVPre: qt,
      isVSlot: Jt,
      isWhitespaceText: on,
      locStub: Be,
      noopDirectiveTransform: Zs,
      parse: function (e, t = {}) {
        return Un(e, y({}, hi, t));
      },
      parserOptions: hi,
      processExpression: ls,
      processFor: Es,
      processIf: hs,
      processSlotOutlet: Ds,
      registerRuntimeHelpers: Ue,
      resolveComponentType: vs,
      stringifyExpression: function e(t) {
        return O(t) ? t : 4 === t.type ? t.content : t.children.map(e).join("");
      },
      toValidAssetId: en,
      trackSlotScopes: Ts,
      trackVForSlotScopes: (e, t) => {
        let n;
        if (Wt(e) && e.props.some(Jt) && (n = Bt(e, "for"))) {
          const e = n.forParseResult;
          if (e) {
            _s(e);
            const { value: n, key: s, index: i } = e,
              { addIdentifiers: o, removeIdentifiers: r } = t;
            return (
              n && o(n),
              s && o(s),
              i && o(i),
              () => {
                (n && r(n), s && r(s), i && r(i));
              }
            );
          }
        }
      },
      transform: Yn,
      transformBind: Vs,
      transformElement: As,
      transformExpression: (e, t) => {
        if (5 === e.type) e.content = ls(e.content, t);
        else if (1 === e.type) {
          const n = Bt(e, "memo");
          for (let s = 0; s < e.props.length; s++) {
            const i = e.props[s];
            if (7 === i.type && "for" !== i.name) {
              const e = i.exp,
                s = i.arg;
              (!e ||
                4 !== e.type ||
                ("on" === i.name && s) ||
                (n && s && 4 === s.type && "key" === s.content) ||
                (i.exp = ls(e, t, "slot" === i.name)),
                s && 4 === s.type && !s.isStatic && (i.arg = ls(s, t)));
            }
          }
        }
      },
      transformModel: Bs,
      transformOn: ks,
      transformStyle: pi,
      transformVBindShorthand: Ys,
      traverseNode: zn,
      unwrapTSNode: function e(t) {
        return Ot.includes(t.type) ? e(t.expression) : t;
      },
      validFirstIdentCharRE: Rt,
      walkBlockDeclarations: St,
      walkFunctionParams: function (e, t) {
        for (const n of e.params) for (const e of It(n)) t(e);
      },
      walkIdentifiers: function (e, t, n = !1, s = [], i = Object.create(null)) {},
      warnDeprecation: function (e, t, n, ...s) {
        if ("suppress-warning" === ht(e, t)) return;
        const { message: i, link: o } = dt[e],
          r = `(deprecation ${e}) ${"function" == typeof i ? i(...s) : i}${o ? `\n  Details: ${o}` : ""}`,
          a = new SyntaxError(r);
        ((a.code = e), n && (a.loc = n), t.onWarn(a));
      },
    },
    Symbol.toStringTag,
    { value: "Module" },
  ),
  Ci = j(Oi),
  Ai = j(H),
  vi = j(G);
/**
 * vue v3.5.25
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/
var bi, Ri, xi;
function Li() {
  return (
    Ri ||
      ((Ri = 1),
      (Q.exports =
        (bi ||
          ((bi = 1),
          (function (e) {
            Object.defineProperty(e, "__esModule", { value: !0 });
            var t = Ci,
              n = Ai,
              s = vi;
            function i(e) {
              var t = Object.create(null);
              if (e) for (var n in e) t[n] = e[n];
              return ((t.default = e), Object.freeze(t));
            }
            var o = i(n);
            const r = Object.create(null);
            function a(e, n) {
              if (!s.isString(e)) {
                if (!e.nodeType) return s.NOOP;
                e = e.innerHTML;
              }
              const i = s.genCacheKey(e, n),
                a = r[i];
              if (a) return a;
              if ("#" === e[0]) {
                const t = document.querySelector(e);
                e = t ? t.innerHTML : "";
              }
              const c = s.extend({ hoistStatic: !0, onError: void 0, onWarn: s.NOOP }, n);
              c.isCustomElement ||
                "undefined" == typeof customElements ||
                (c.isCustomElement = (e) => !!customElements.get(e));
              const { code: l } = t.compile(e, c),
                d = new Function("Vue", l)(o);
              return ((d._rc = !0), (r[i] = d));
            }
            (n.registerRuntimeCompiler(a),
              (e.compile = a),
              Object.keys(n).forEach(function (t) {
                "default" === t || Object.prototype.hasOwnProperty.call(e, t) || (e[t] = n[t]);
              }));
          })(Z)),
        Z))),
    Q.exports
  );
}
function Mi() {
  if (xi) return z;
  ((xi = 1), Object.defineProperty(z, "__esModule", { value: !0 }));
  const e = Li(),
    t = {
      xmlns: "http://www.w3.org/2000/svg",
      "xmlns:xlink": "http://www.w3.org/1999/xlink",
      viewBox: "0 0 512 512",
    },
    n = [
      (0, e.createElementVNode)(
        "path",
        {
          fill: "none",
          stroke: "currentColor",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "stroke-width": "32",
          d: "M256 112v288",
        },
        null,
        -1,
      ),
      (0, e.createElementVNode)(
        "path",
        {
          fill: "none",
          stroke: "currentColor",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "stroke-width": "32",
          d: "M400 256H112",
        },
        null,
        -1,
      ),
    ];
  return (
    (z.default = (0, e.defineComponent)({
      name: "Add",
      render: function (s, i) {
        return ((0, e.openBlock)(), (0, e.createElementBlock)("svg", t, n));
      },
    })),
    z
  );
}
const Pi = q(Mi());
export { Pi as A, Y as _, Li as r, W as s };
