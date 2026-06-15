import {
  o as e,
  x as r,
  G as t,
  z as n,
  t as i,
  D as a,
  b_ as o,
  w as s,
  bd as l,
  y as u,
  q as d,
  U as f,
  b$ as c,
  aU as p,
  v as m,
  Q as g,
} from "./index-Ct5UuHQN.js";
import {
  i as h,
  g as v,
  w as b,
  b as y,
  j as w,
  k,
  r as x,
  p as q,
  c as F,
  q as O,
  t as P,
  d as S,
} from "./vendor-DHo7BzsC.js";
import { f as $ } from "./format-length-l2rsThpR.js";
import { g as j } from "./get-BluUyD2c.js";
function A(e, r, t) {
  var n;
  const i = h(e, null);
  if (null === i) return;
  const a = null === (n = v()) || void 0 === n ? void 0 : n.proxy;
  function o(e, t) {
    if (!i) return;
    const n = i[r];
    (void 0 !== t &&
      (function (e, r) {
        e[r] || (e[r] = []);
        e[r].splice(
          e[r].findIndex((e) => e === a),
          1,
        );
      })(n, t),
      void 0 !== e &&
        (function (e, r) {
          e[r] || (e[r] = []);
          ~e[r].findIndex((e) => e === a) || e[r].push(a);
        })(n, e));
  }
  (b(t, o),
    o(t.value),
    y(() => {
      o(void 0, t.value);
    }));
}
const _ = e("n-form"),
  E = e("n-form-item-insts"),
  R = r("form", [
    t(
      "inline",
      "\n width: 100%;\n display: inline-flex;\n align-items: flex-start;\n align-content: space-around;\n ",
      [
        r("form-item", { width: "auto", marginRight: "18px" }, [
          n("&:last-child", { marginRight: 0 }),
        ]),
      ],
    ),
  ]);
var z = function (e, r, t, n) {
  return new (t || (t = Promise))(function (i, a) {
    function o(e) {
      try {
        l(n.next(e));
      } catch (r) {
        a(r);
      }
    }
    function s(e) {
      try {
        l(n.throw(e));
      } catch (r) {
        a(r);
      }
    }
    function l(e) {
      var r;
      e.done
        ? i(e.value)
        : ((r = e.value),
          r instanceof t
            ? r
            : new t(function (e) {
                e(r);
              })).then(o, s);
    }
    l((n = n.apply(e, r || [])).next());
  });
};
const C = w({
  name: "Form",
  props: Object.assign(Object.assign({}, a.props), {
    inline: Boolean,
    labelWidth: [Number, String],
    labelAlign: String,
    labelPlacement: { type: String, default: "top" },
    model: { type: Object, default: () => {} },
    rules: Object,
    disabled: Boolean,
    size: String,
    showRequireMark: { type: Boolean, default: void 0 },
    requireMarkPlacement: String,
    showFeedback: { type: Boolean, default: !0 },
    onSubmit: {
      type: Function,
      default: (e) => {
        e.preventDefault();
      },
    },
    showLabel: { type: Boolean, default: void 0 },
    validateMessages: Object,
  }),
  setup(e) {
    const { mergedClsPrefixRef: r } = i(e);
    a("Form", "-form", R, o, e, r);
    const t = {},
      n = x(void 0);
    (q(_, {
      props: e,
      maxChildLabelWidthRef: n,
      deriveMaxChildLabelWidth: (e) => {
        const r = n.value;
        (void 0 === r || e >= r) && (n.value = e);
      },
    }),
      q(E, { formItems: t }));
    const l = {
      validate: function (e) {
        return z(this, arguments, void 0, function* (e, r = () => !0) {
          return yield new Promise((n, i) => {
            const a = [];
            for (const e of s(t)) {
              const n = t[e];
              for (const e of n) e.path && a.push(e.internalValidate(null, r));
            }
            Promise.all(a).then((r) => {
              const t = r.some((e) => !e.valid),
                a = [],
                o = [];
              (r.forEach((e) => {
                var r, t;
                ((null === (r = e.errors) || void 0 === r ? void 0 : r.length) && a.push(e.errors),
                  (null === (t = e.warnings) || void 0 === t ? void 0 : t.length) &&
                    o.push(e.warnings));
              }),
                e && e(a.length ? a : void 0, { warnings: o.length ? o : void 0 }),
                t ? i(a.length ? a : void 0) : n({ warnings: o.length ? o : void 0 }));
            });
          });
        });
      },
      restoreValidation: function () {
        for (const e of s(t)) {
          const r = t[e];
          for (const e of r) e.restoreValidation();
        }
      },
    };
    return Object.assign(l, { mergedClsPrefix: r });
  },
  render() {
    const { mergedClsPrefix: e } = this;
    return k(
      "form",
      { class: [`${e}-form`, this.inline && `${e}-form--inline`], onSubmit: this.onSubmit },
      this.$slots,
    );
  },
});
function M() {
  return (
    (M = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var r = 1; r < arguments.length; r++) {
            var t = arguments[r];
            for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
          }
          return e;
        }),
    M.apply(this, arguments)
  );
}
function V(e) {
  return (V = Object.setPrototypeOf
    ? Object.getPrototypeOf.bind()
    : function (e) {
        return e.__proto__ || Object.getPrototypeOf(e);
      })(e);
}
function B(e, r) {
  return (B = Object.setPrototypeOf
    ? Object.setPrototypeOf.bind()
    : function (e, r) {
        return ((e.__proto__ = r), e);
      })(e, r);
}
function W(e, r, t) {
  return (W = (function () {
    if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
    if (Reflect.construct.sham) return !1;
    if ("function" == typeof Proxy) return !0;
    try {
      return (Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})), !0);
    } catch (e) {
      return !1;
    }
  })()
    ? Reflect.construct.bind()
    : function (e, r, t) {
        var n = [null];
        n.push.apply(n, r);
        var i = new (Function.bind.apply(e, n))();
        return (t && B(i, t.prototype), i);
      }).apply(null, arguments);
}
function L(e) {
  var r = "function" == typeof Map ? new Map() : void 0;
  return (
    (L = function (e) {
      if (null === e || ((t = e), -1 === Function.toString.call(t).indexOf("[native code]")))
        return e;
      var t;
      if ("function" != typeof e)
        throw new TypeError("Super expression must either be null or a function");
      if (void 0 !== r) {
        if (r.has(e)) return r.get(e);
        r.set(e, n);
      }
      function n() {
        return W(e, arguments, V(this).constructor);
      }
      return (
        (n.prototype = Object.create(e.prototype, {
          constructor: { value: n, enumerable: !1, writable: !0, configurable: !0 },
        })),
        B(n, e)
      );
    }),
    L(e)
  );
}
var D = /%[sdj%]/g;
function T(e) {
  if (!e || !e.length) return null;
  var r = {};
  return (
    e.forEach(function (e) {
      var t = e.field;
      ((r[t] = r[t] || []), r[t].push(e));
    }),
    r
  );
}
function I(e) {
  for (var r = arguments.length, t = new Array(r > 1 ? r - 1 : 0), n = 1; n < r; n++)
    t[n - 1] = arguments[n];
  var i = 0,
    a = t.length;
  return "function" == typeof e
    ? e.apply(null, t)
    : "string" == typeof e
      ? e.replace(D, function (e) {
          if ("%%" === e) return "%";
          if (i >= a) return e;
          switch (e) {
            case "%s":
              return String(t[i++]);
            case "%d":
              return Number(t[i++]);
            case "%j":
              try {
                return JSON.stringify(t[i++]);
              } catch (r) {
                return "[Circular]";
              }
              break;
            default:
              return e;
          }
        })
      : e;
}
function N(e, r) {
  return (
    null == e ||
    !("array" !== r || !Array.isArray(e) || e.length) ||
    !(
      !(function (e) {
        return (
          "string" === e ||
          "url" === e ||
          "hex" === e ||
          "email" === e ||
          "date" === e ||
          "pattern" === e
        );
      })(r) ||
      "string" != typeof e ||
      e
    )
  );
}
function Y(e, r, t) {
  var n = 0,
    i = e.length;
  !(function a(o) {
    if (o && o.length) t(o);
    else {
      var s = n;
      ((n += 1), s < i ? r(e[s], a) : t([]));
    }
  })([]);
}
var H = (function (e) {
  var r, t;
  function n(r, t) {
    var n;
    return (((n = e.call(this, "Async Validation Error") || this).errors = r), (n.fields = t), n);
  }
  return (
    (t = e),
    ((r = n).prototype = Object.create(t.prototype)),
    (r.prototype.constructor = r),
    B(r, t),
    n
  );
})(L(Error));
function J(e, r, t, n, i) {
  if (r.first) {
    var a = new Promise(function (r, a) {
      var o = (function (e) {
        var r = [];
        return (
          Object.keys(e).forEach(function (t) {
            r.push.apply(r, e[t] || []);
          }),
          r
        );
      })(e);
      Y(o, t, function (e) {
        return (n(e), e.length ? a(new H(e, T(e))) : r(i));
      });
    });
    return (
      a.catch(function (e) {
        return e;
      }),
      a
    );
  }
  var o = !0 === r.firstFields ? Object.keys(e) : r.firstFields || [],
    s = Object.keys(e),
    l = s.length,
    u = 0,
    d = [],
    f = new Promise(function (r, a) {
      var f = function (e) {
        if ((d.push.apply(d, e), ++u === l)) return (n(d), d.length ? a(new H(d, T(d))) : r(i));
      };
      (s.length || (n(d), r(i)),
        s.forEach(function (r) {
          var n = e[r];
          -1 !== o.indexOf(r)
            ? Y(n, t, f)
            : (function (e, r, t) {
                var n = [],
                  i = 0,
                  a = e.length;
                function o(e) {
                  (n.push.apply(n, e || []), ++i === a && t(n));
                }
                e.forEach(function (e) {
                  r(e, o);
                });
              })(n, t, f);
        }));
    });
  return (
    f.catch(function (e) {
      return e;
    }),
    f
  );
}
function U(e, r) {
  return function (t) {
    var n, i;
    return (
      (n = e.fullFields
        ? (function (e, r) {
            for (var t = e, n = 0; n < r.length; n++) {
              if (null == t) return t;
              t = t[r[n]];
            }
            return t;
          })(r, e.fullFields)
        : r[t.field || e.fullField]),
      (i = t) && void 0 !== i.message
        ? ((t.field = t.field || e.fullField), (t.fieldValue = n), t)
        : {
            message: "function" == typeof t ? t() : t,
            fieldValue: n,
            field: t.field || e.fullField,
          }
    );
  };
}
function Z(e, r) {
  if (r)
    for (var t in r)
      if (r.hasOwnProperty(t)) {
        var n = r[t];
        "object" == typeof n && "object" == typeof e[t] ? (e[t] = M({}, e[t], n)) : (e[t] = n);
      }
  return e;
}
var G,
  Q = function (e, r, t, n, i, a) {
    !e.required ||
      (t.hasOwnProperty(e.field) && !N(r, a || e.type)) ||
      n.push(I(i.messages.required, e.fullField));
  },
  K =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\.)+[a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}))$/,
  X = /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i,
  ee = {
    integer: function (e) {
      return ee.number(e) && parseInt(e, 10) === e;
    },
    float: function (e) {
      return ee.number(e) && !ee.integer(e);
    },
    array: function (e) {
      return Array.isArray(e);
    },
    regexp: function (e) {
      if (e instanceof RegExp) return !0;
      try {
        return !!new RegExp(e);
      } catch (r) {
        return !1;
      }
    },
    date: function (e) {
      return (
        "function" == typeof e.getTime &&
        "function" == typeof e.getMonth &&
        "function" == typeof e.getYear &&
        !isNaN(e.getTime())
      );
    },
    number: function (e) {
      return !isNaN(e) && "number" == typeof e;
    },
    object: function (e) {
      return "object" == typeof e && !ee.array(e);
    },
    method: function (e) {
      return "function" == typeof e;
    },
    email: function (e) {
      return "string" == typeof e && e.length <= 320 && !!e.match(K);
    },
    url: function (e) {
      return (
        "string" == typeof e &&
        e.length <= 2048 &&
        !!e.match(
          (function () {
            if (G) return G;
            var e = "[a-fA-F\\d:]",
              r = function (r) {
                return r && r.includeBoundaries
                  ? "(?:(?<=\\s|^)(?=" + e + ")|(?<=" + e + ")(?=\\s|$))"
                  : "";
              },
              t =
                "(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}",
              n = "[a-fA-F\\d]{1,4}",
              i = (
                "\n(?:\n(?:" +
                n +
                ":){7}(?:" +
                n +
                "|:)|                                    // 1:2:3:4:5:6:7::  1:2:3:4:5:6:7:8\n(?:" +
                n +
                ":){6}(?:" +
                t +
                "|:" +
                n +
                "|:)|                             // 1:2:3:4:5:6::    1:2:3:4:5:6::8   1:2:3:4:5:6::8  1:2:3:4:5:6::1.2.3.4\n(?:" +
                n +
                ":){5}(?::" +
                t +
                "|(?::" +
                n +
                "){1,2}|:)|                   // 1:2:3:4:5::      1:2:3:4:5::7:8   1:2:3:4:5::8    1:2:3:4:5::7:1.2.3.4\n(?:" +
                n +
                ":){4}(?:(?::" +
                n +
                "){0,1}:" +
                t +
                "|(?::" +
                n +
                "){1,3}|:)| // 1:2:3:4::        1:2:3:4::6:7:8   1:2:3:4::8      1:2:3:4::6:7:1.2.3.4\n(?:" +
                n +
                ":){3}(?:(?::" +
                n +
                "){0,2}:" +
                t +
                "|(?::" +
                n +
                "){1,4}|:)| // 1:2:3::          1:2:3::5:6:7:8   1:2:3::8        1:2:3::5:6:7:1.2.3.4\n(?:" +
                n +
                ":){2}(?:(?::" +
                n +
                "){0,3}:" +
                t +
                "|(?::" +
                n +
                "){1,5}|:)| // 1:2::            1:2::4:5:6:7:8   1:2::8          1:2::4:5:6:7:1.2.3.4\n(?:" +
                n +
                ":){1}(?:(?::" +
                n +
                "){0,4}:" +
                t +
                "|(?::" +
                n +
                "){1,6}|:)| // 1::              1::3:4:5:6:7:8   1::8            1::3:4:5:6:7:1.2.3.4\n(?::(?:(?::" +
                n +
                "){0,5}:" +
                t +
                "|(?::" +
                n +
                "){1,7}|:))             // ::2:3:4:5:6:7:8  ::2:3:4:5:6:7:8  ::8             ::1.2.3.4\n)(?:%[0-9a-zA-Z]{1,})?                                             // %eth0            %1\n"
              )
                .replace(/\s*\/\/.*$/gm, "")
                .replace(/\n/g, "")
                .trim(),
              a = new RegExp("(?:^" + t + "$)|(?:^" + i + "$)"),
              o = new RegExp("^" + t + "$"),
              s = new RegExp("^" + i + "$"),
              l = function (e) {
                return e && e.exact
                  ? a
                  : new RegExp("(?:" + r(e) + t + r(e) + ")|(?:" + r(e) + i + r(e) + ")", "g");
              };
            ((l.v4 = function (e) {
              return e && e.exact ? o : new RegExp("" + r(e) + t + r(e), "g");
            }),
              (l.v6 = function (e) {
                return e && e.exact ? s : new RegExp("" + r(e) + i + r(e), "g");
              }));
            var u = l.v4().source,
              d = l.v6().source;
            return (G = new RegExp(
              "(?:^(?:(?:(?:[a-z]+:)?//)|www\\.)(?:\\S+(?::\\S*)?@)?(?:localhost|" +
                u +
                "|" +
                d +
                '|(?:(?:[a-z\\u00a1-\\uffff0-9][-_]*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))(?::\\d{2,5})?(?:[/?#][^\\s"]*)?$)',
              "i",
            ));
          })(),
        )
      );
    },
    hex: function (e) {
      return "string" == typeof e && !!e.match(X);
    },
  },
  re = "enum",
  te = {
    required: Q,
    whitespace: function (e, r, t, n, i) {
      (/^\s+$/.test(r) || "" === r) && n.push(I(i.messages.whitespace, e.fullField));
    },
    type: function (e, r, t, n, i) {
      if (e.required && void 0 === r) Q(e, r, t, n, i);
      else {
        var a = e.type;
        [
          "integer",
          "float",
          "array",
          "regexp",
          "object",
          "method",
          "email",
          "number",
          "date",
          "url",
          "hex",
        ].indexOf(a) > -1
          ? ee[a](r) || n.push(I(i.messages.types[a], e.fullField, e.type))
          : a && typeof r !== e.type && n.push(I(i.messages.types[a], e.fullField, e.type));
      }
    },
    range: function (e, r, t, n, i) {
      var a = "number" == typeof e.len,
        o = "number" == typeof e.min,
        s = "number" == typeof e.max,
        l = r,
        u = null,
        d = "number" == typeof r,
        f = "string" == typeof r,
        c = Array.isArray(r);
      if ((d ? (u = "number") : f ? (u = "string") : c && (u = "array"), !u)) return !1;
      (c && (l = r.length),
        f && (l = r.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "_").length),
        a
          ? l !== e.len && n.push(I(i.messages[u].len, e.fullField, e.len))
          : o && !s && l < e.min
            ? n.push(I(i.messages[u].min, e.fullField, e.min))
            : s && !o && l > e.max
              ? n.push(I(i.messages[u].max, e.fullField, e.max))
              : o &&
                s &&
                (l < e.min || l > e.max) &&
                n.push(I(i.messages[u].range, e.fullField, e.min, e.max)));
    },
    enum: function (e, r, t, n, i) {
      ((e[re] = Array.isArray(e[re]) ? e[re] : []),
        -1 === e[re].indexOf(r) && n.push(I(i.messages[re], e.fullField, e[re].join(", "))));
    },
    pattern: function (e, r, t, n, i) {
      if (e.pattern)
        if (e.pattern instanceof RegExp)
          ((e.pattern.lastIndex = 0),
            e.pattern.test(r) || n.push(I(i.messages.pattern.mismatch, e.fullField, r, e.pattern)));
        else if ("string" == typeof e.pattern) {
          new RegExp(e.pattern).test(r) ||
            n.push(I(i.messages.pattern.mismatch, e.fullField, r, e.pattern));
        }
    },
  },
  ne = function (e, r, t, n, i) {
    var a = e.type,
      o = [];
    if (e.required || (!e.required && n.hasOwnProperty(e.field))) {
      if (N(r, a) && !e.required) return t();
      (te.required(e, r, n, o, i, a), N(r, a) || te.type(e, r, n, o, i));
    }
    t(o);
  },
  ie = {
    string: function (e, r, t, n, i) {
      var a = [];
      if (e.required || (!e.required && n.hasOwnProperty(e.field))) {
        if (N(r, "string") && !e.required) return t();
        (te.required(e, r, n, a, i, "string"),
          N(r, "string") ||
            (te.type(e, r, n, a, i),
            te.range(e, r, n, a, i),
            te.pattern(e, r, n, a, i),
            !0 === e.whitespace && te.whitespace(e, r, n, a, i)));
      }
      t(a);
    },
    method: function (e, r, t, n, i) {
      var a = [];
      if (e.required || (!e.required && n.hasOwnProperty(e.field))) {
        if (N(r) && !e.required) return t();
        (te.required(e, r, n, a, i), void 0 !== r && te.type(e, r, n, a, i));
      }
      t(a);
    },
    number: function (e, r, t, n, i) {
      var a = [];
      if (e.required || (!e.required && n.hasOwnProperty(e.field))) {
        if (("" === r && (r = void 0), N(r) && !e.required)) return t();
        (te.required(e, r, n, a, i),
          void 0 !== r && (te.type(e, r, n, a, i), te.range(e, r, n, a, i)));
      }
      t(a);
    },
    boolean: function (e, r, t, n, i) {
      var a = [];
      if (e.required || (!e.required && n.hasOwnProperty(e.field))) {
        if (N(r) && !e.required) return t();
        (te.required(e, r, n, a, i), void 0 !== r && te.type(e, r, n, a, i));
      }
      t(a);
    },
    regexp: function (e, r, t, n, i) {
      var a = [];
      if (e.required || (!e.required && n.hasOwnProperty(e.field))) {
        if (N(r) && !e.required) return t();
        (te.required(e, r, n, a, i), N(r) || te.type(e, r, n, a, i));
      }
      t(a);
    },
    integer: function (e, r, t, n, i) {
      var a = [];
      if (e.required || (!e.required && n.hasOwnProperty(e.field))) {
        if (N(r) && !e.required) return t();
        (te.required(e, r, n, a, i),
          void 0 !== r && (te.type(e, r, n, a, i), te.range(e, r, n, a, i)));
      }
      t(a);
    },
    float: function (e, r, t, n, i) {
      var a = [];
      if (e.required || (!e.required && n.hasOwnProperty(e.field))) {
        if (N(r) && !e.required) return t();
        (te.required(e, r, n, a, i),
          void 0 !== r && (te.type(e, r, n, a, i), te.range(e, r, n, a, i)));
      }
      t(a);
    },
    array: function (e, r, t, n, i) {
      var a = [];
      if (e.required || (!e.required && n.hasOwnProperty(e.field))) {
        if (null == r && !e.required) return t();
        (te.required(e, r, n, a, i, "array"),
          null != r && (te.type(e, r, n, a, i), te.range(e, r, n, a, i)));
      }
      t(a);
    },
    object: function (e, r, t, n, i) {
      var a = [];
      if (e.required || (!e.required && n.hasOwnProperty(e.field))) {
        if (N(r) && !e.required) return t();
        (te.required(e, r, n, a, i), void 0 !== r && te.type(e, r, n, a, i));
      }
      t(a);
    },
    enum: function (e, r, t, n, i) {
      var a = [];
      if (e.required || (!e.required && n.hasOwnProperty(e.field))) {
        if (N(r) && !e.required) return t();
        (te.required(e, r, n, a, i), void 0 !== r && te.enum(e, r, n, a, i));
      }
      t(a);
    },
    pattern: function (e, r, t, n, i) {
      var a = [];
      if (e.required || (!e.required && n.hasOwnProperty(e.field))) {
        if (N(r, "string") && !e.required) return t();
        (te.required(e, r, n, a, i), N(r, "string") || te.pattern(e, r, n, a, i));
      }
      t(a);
    },
    date: function (e, r, t, n, i) {
      var a = [];
      if (e.required || (!e.required && n.hasOwnProperty(e.field))) {
        if (N(r, "date") && !e.required) return t();
        var o;
        if ((te.required(e, r, n, a, i), !N(r, "date")))
          ((o = r instanceof Date ? r : new Date(r)),
            te.type(e, o, n, a, i),
            o && te.range(e, o.getTime(), n, a, i));
      }
      t(a);
    },
    url: ne,
    hex: ne,
    email: ne,
    required: function (e, r, t, n, i) {
      var a = [],
        o = Array.isArray(r) ? "array" : typeof r;
      (te.required(e, r, n, a, i, o), t(a));
    },
    any: function (e, r, t, n, i) {
      var a = [];
      if (e.required || (!e.required && n.hasOwnProperty(e.field))) {
        if (N(r) && !e.required) return t();
        te.required(e, r, n, a, i);
      }
      t(a);
    },
  };
function ae() {
  return {
    default: "Validation error on field %s",
    required: "%s is required",
    enum: "%s must be one of %s",
    whitespace: "%s cannot be empty",
    date: {
      format: "%s date %s is invalid for format %s",
      parse: "%s date could not be parsed, %s is invalid ",
      invalid: "%s date %s is invalid",
    },
    types: {
      string: "%s is not a %s",
      method: "%s is not a %s (function)",
      array: "%s is not an %s",
      object: "%s is not an %s",
      number: "%s is not a %s",
      date: "%s is not a %s",
      boolean: "%s is not a %s",
      integer: "%s is not an %s",
      float: "%s is not a %s",
      regexp: "%s is not a valid %s",
      email: "%s is not a valid %s",
      url: "%s is not a valid %s",
      hex: "%s is not a valid %s",
    },
    string: {
      len: "%s must be exactly %s characters",
      min: "%s must be at least %s characters",
      max: "%s cannot be longer than %s characters",
      range: "%s must be between %s and %s characters",
    },
    number: {
      len: "%s must equal %s",
      min: "%s cannot be less than %s",
      max: "%s cannot be greater than %s",
      range: "%s must be between %s and %s",
    },
    array: {
      len: "%s must be exactly %s in length",
      min: "%s cannot be less than %s in length",
      max: "%s cannot be greater than %s in length",
      range: "%s must be between %s and %s in length",
    },
    pattern: { mismatch: "%s value %s does not match pattern %s" },
    clone: function () {
      var e = JSON.parse(JSON.stringify(this));
      return ((e.clone = this.clone), e);
    },
  };
}
var oe = ae(),
  se = (function () {
    function e(e) {
      ((this.rules = null), (this._messages = oe), this.define(e));
    }
    var r = e.prototype;
    return (
      (r.define = function (e) {
        var r = this;
        if (!e) throw new Error("Cannot configure a schema with no rules");
        if ("object" != typeof e || Array.isArray(e)) throw new Error("Rules must be an object");
        ((this.rules = {}),
          Object.keys(e).forEach(function (t) {
            var n = e[t];
            r.rules[t] = Array.isArray(n) ? n : [n];
          }));
      }),
      (r.messages = function (e) {
        return (e && (this._messages = Z(ae(), e)), this._messages);
      }),
      (r.validate = function (r, t, n) {
        var i = this;
        (void 0 === t && (t = {}), void 0 === n && (n = function () {}));
        var a = r,
          o = t,
          s = n;
        if (
          ("function" == typeof o && ((s = o), (o = {})),
          !this.rules || 0 === Object.keys(this.rules).length)
        )
          return (s && s(null, a), Promise.resolve(a));
        if (o.messages) {
          var l = this.messages();
          (l === oe && (l = ae()), Z(l, o.messages), (o.messages = l));
        } else o.messages = this.messages();
        var u = {};
        (o.keys || Object.keys(this.rules)).forEach(function (e) {
          var t = i.rules[e],
            n = a[e];
          t.forEach(function (t) {
            var o = t;
            ("function" == typeof o.transform &&
              (a === r && (a = M({}, a)), (n = a[e] = o.transform(n))),
              ((o = "function" == typeof o ? { validator: o } : M({}, o)).validator =
                i.getValidationMethod(o)),
              o.validator &&
                ((o.field = e),
                (o.fullField = o.fullField || e),
                (o.type = i.getType(o)),
                (u[e] = u[e] || []),
                u[e].push({ rule: o, value: n, source: a, field: e })));
          });
        });
        var d = {};
        return J(
          u,
          o,
          function (r, t) {
            var n,
              i = r.rule,
              s = !(
                ("object" !== i.type && "array" !== i.type) ||
                ("object" != typeof i.fields && "object" != typeof i.defaultField)
              );
            function l(e, r) {
              return M({}, r, {
                fullField: i.fullField + "." + e,
                fullFields: i.fullFields ? [].concat(i.fullFields, [e]) : [e],
              });
            }
            function u(n) {
              void 0 === n && (n = []);
              var u = Array.isArray(n) ? n : [n];
              (!o.suppressWarning && u.length && e.warning("async-validator:", u),
                u.length && void 0 !== i.message && (u = [].concat(i.message)));
              var f = u.map(U(i, a));
              if (o.first && f.length) return ((d[i.field] = 1), t(f));
              if (s) {
                if (i.required && !r.value)
                  return (
                    void 0 !== i.message
                      ? (f = [].concat(i.message).map(U(i, a)))
                      : o.error && (f = [o.error(i, I(o.messages.required, i.field))]),
                    t(f)
                  );
                var c = {};
                (i.defaultField &&
                  Object.keys(r.value).map(function (e) {
                    c[e] = i.defaultField;
                  }),
                  (c = M({}, c, r.rule.fields)));
                var p = {};
                Object.keys(c).forEach(function (e) {
                  var r = c[e],
                    t = Array.isArray(r) ? r : [r];
                  p[e] = t.map(l.bind(null, e));
                });
                var m = new e(p);
                (m.messages(o.messages),
                  r.rule.options &&
                    ((r.rule.options.messages = o.messages), (r.rule.options.error = o.error)),
                  m.validate(r.value, r.rule.options || o, function (e) {
                    var r = [];
                    (f && f.length && r.push.apply(r, f),
                      e && e.length && r.push.apply(r, e),
                      t(r.length ? r : null));
                  }));
              } else t(f);
            }
            if (
              ((s = s && (i.required || (!i.required && r.value))),
              (i.field = r.field),
              i.asyncValidator)
            )
              n = i.asyncValidator(i, r.value, u, r.source, o);
            else if (i.validator) {
              try {
                n = i.validator(i, r.value, u, r.source, o);
              } catch (f) {
                (console.error,
                  o.suppressValidatorError ||
                    setTimeout(function () {
                      throw f;
                    }, 0),
                  u(f.message));
              }
              !0 === n
                ? u()
                : !1 === n
                  ? u(
                      "function" == typeof i.message
                        ? i.message(i.fullField || i.field)
                        : i.message || (i.fullField || i.field) + " fails",
                    )
                  : n instanceof Array
                    ? u(n)
                    : n instanceof Error && u(n.message);
            }
            n &&
              n.then &&
              n.then(
                function () {
                  return u();
                },
                function (e) {
                  return u(e);
                },
              );
          },
          function (e) {
            !(function (e) {
              var r = [],
                t = {};
              function n(e) {
                var t;
                Array.isArray(e) ? (r = (t = r).concat.apply(t, e)) : r.push(e);
              }
              for (var i = 0; i < e.length; i++) n(e[i]);
              r.length ? ((t = T(r)), s(r, t)) : s(null, a);
            })(e);
          },
          a,
        );
      }),
      (r.getType = function (e) {
        if (
          (void 0 === e.type && e.pattern instanceof RegExp && (e.type = "pattern"),
          "function" != typeof e.validator && e.type && !ie.hasOwnProperty(e.type))
        )
          throw new Error(I("Unknown rule type %s", e.type));
        return e.type || "string";
      }),
      (r.getValidationMethod = function (e) {
        if ("function" == typeof e.validator) return e.validator;
        var r = Object.keys(e),
          t = r.indexOf("message");
        return (
          -1 !== t && r.splice(t, 1),
          1 === r.length && "required" === r[0] ? ie.required : ie[this.getType(e)] || void 0
        );
      }),
      e
    );
  })();
((se.register = function (e, r) {
  if ("function" != typeof r)
    throw new Error("Cannot register a validator by type, validator is not a function");
  ie[e] = r;
}),
  (se.warning = function () {}),
  (se.messages = oe),
  (se.validators = ie));
const { cubicBezierEaseInOut: le } = l;
const ue = r("form-item", "\n display: grid;\n line-height: var(--n-line-height);\n", [
  r(
    "form-item-label",
    "\n grid-area: label;\n align-items: center;\n line-height: 1.25;\n text-align: var(--n-label-text-align);\n font-size: var(--n-label-font-size);\n min-height: var(--n-label-height);\n padding: var(--n-label-padding);\n color: var(--n-label-text-color);\n transition: color .3s var(--n-bezier);\n box-sizing: border-box;\n font-weight: var(--n-label-font-weight);\n ",
    [
      u(
        "asterisk",
        "\n white-space: nowrap;\n user-select: none;\n -webkit-user-select: none;\n color: var(--n-asterisk-color);\n transition: color .3s var(--n-bezier);\n ",
      ),
      u(
        "asterisk-placeholder",
        "\n grid-area: mark;\n user-select: none;\n -webkit-user-select: none;\n visibility: hidden; \n ",
      ),
    ],
  ),
  r("form-item-blank", "\n grid-area: blank;\n min-height: var(--n-blank-height);\n "),
  t("auto-label-width", [r("form-item-label", "white-space: nowrap;")]),
  t(
    "left-labelled",
    '\n grid-template-areas:\n "label blank"\n "label feedback";\n grid-template-columns: auto minmax(0, 1fr);\n grid-template-rows: auto 1fr;\n align-items: flex-start;\n ',
    [
      r(
        "form-item-label",
        "\n display: grid;\n grid-template-columns: 1fr auto;\n min-height: var(--n-blank-height);\n height: auto;\n box-sizing: border-box;\n flex-shrink: 0;\n flex-grow: 0;\n ",
        [
          t("reverse-columns-space", "\n grid-template-columns: auto 1fr;\n "),
          t("left-mark", '\n grid-template-areas:\n "mark text"\n ". text";\n '),
          t("right-mark", '\n grid-template-areas: \n "text mark"\n "text .";\n '),
          t("right-hanging-mark", '\n grid-template-areas: \n "text mark"\n "text .";\n '),
          u("text", "\n grid-area: text; \n "),
          u("asterisk", "\n grid-area: mark; \n align-self: end;\n "),
        ],
      ),
    ],
  ),
  t(
    "top-labelled",
    '\n grid-template-areas:\n "label"\n "blank"\n "feedback";\n grid-template-rows: minmax(var(--n-label-height), auto) 1fr;\n grid-template-columns: minmax(0, 100%);\n ',
    [
      t(
        "no-label",
        '\n grid-template-areas:\n "blank"\n "feedback";\n grid-template-rows: 1fr;\n ',
      ),
      r(
        "form-item-label",
        "\n display: flex;\n align-items: flex-start;\n justify-content: var(--n-label-text-align);\n ",
      ),
    ],
  ),
  r(
    "form-item-blank",
    "\n box-sizing: border-box;\n display: flex;\n align-items: center;\n position: relative;\n ",
  ),
  r(
    "form-item-feedback-wrapper",
    "\n grid-area: feedback;\n box-sizing: border-box;\n min-height: var(--n-feedback-height);\n font-size: var(--n-feedback-font-size);\n line-height: 1.25;\n transform-origin: top left;\n ",
    [
      n("&:not(:empty)", "\n padding: var(--n-feedback-padding);\n "),
      r(
        "form-item-feedback",
        { transition: "color .3s var(--n-bezier)", color: "var(--n-feedback-text-color)" },
        [
          t("warning", { color: "var(--n-feedback-text-color-warning)" }),
          t("error", { color: "var(--n-feedback-text-color-error)" }),
          (function ({
            name: e = "fade-down",
            fromOffset: r = "-4px",
            enterDuration: t = ".3s",
            leaveDuration: i = ".3s",
            enterCubicBezier: a = le,
            leaveCubicBezier: o = le,
          } = {}) {
            return [
              n(`&.${e}-transition-enter-from, &.${e}-transition-leave-to`, {
                opacity: 0,
                transform: `translateY(${r})`,
              }),
              n(`&.${e}-transition-enter-to, &.${e}-transition-leave-from`, {
                opacity: 1,
                transform: "translateY(0)",
              }),
              n(`&.${e}-transition-leave-active`, {
                transition: `opacity ${i} ${o}, transform ${i} ${o}`,
              }),
              n(`&.${e}-transition-enter-active`, {
                transition: `opacity ${t} ${a}, transform ${t} ${a}`,
              }),
            ];
          })({ fromOffset: "-3px", enterDuration: ".3s", leaveDuration: ".2s" }),
        ],
      ),
    ],
  ),
]);
var de = function (e, r, t, n) {
  return new (t || (t = Promise))(function (i, a) {
    function o(e) {
      try {
        l(n.next(e));
      } catch (r) {
        a(r);
      }
    }
    function s(e) {
      try {
        l(n.throw(e));
      } catch (r) {
        a(r);
      }
    }
    function l(e) {
      var r;
      e.done
        ? i(e.value)
        : ((r = e.value),
          r instanceof t
            ? r
            : new t(function (e) {
                e(r);
              })).then(o, s);
    }
    l((n = n.apply(e, r || [])).next());
  });
};
function fe(e, r) {
  return (...t) => {
    try {
      const n = e(...t);
      return (!r && ("boolean" == typeof n || n instanceof Error || Array.isArray(n))) ||
        (null == n ? void 0 : n.then)
        ? n
        : (void 0 === n ||
            g(
              "form-item/validate",
              `You return a ${typeof n} typed value in the validator method, which is not recommended. Please use ${r ? "`Promise`" : "`boolean`, `Error` or `Promise`"} typed value instead.`,
            ),
          !0);
    } catch (n) {
      return void g(
        "form-item/validate",
        "An error is catched in the validation, so the validation won't be done. Your callback in `validate` method of `n-form` or `n-form-item` won't be called in this validation.",
      );
    }
  };
}
const ce = w({
  name: "FormItem",
  props: Object.assign(Object.assign({}, a.props), {
    label: String,
    labelWidth: [Number, String],
    labelStyle: [String, Object],
    labelAlign: String,
    labelPlacement: String,
    path: String,
    first: Boolean,
    rulePath: String,
    required: Boolean,
    showRequireMark: { type: Boolean, default: void 0 },
    requireMarkPlacement: String,
    showFeedback: { type: Boolean, default: void 0 },
    rule: [Object, Array],
    size: String,
    ignorePathChange: Boolean,
    validationStatus: String,
    feedback: String,
    feedbackClass: String,
    feedbackStyle: [String, Object],
    showLabel: { type: Boolean, default: void 0 },
    labelProps: Object,
    contentClass: String,
    contentStyle: [String, Object],
  }),
  setup(e) {
    A(E, "formItems", P(e, "path"));
    const { mergedClsPrefixRef: r, inlineThemeDisabled: t } = i(e),
      n = h(_, null),
      s = (function (e) {
        const r = h(_, null);
        return {
          mergedSize: F(() =>
            void 0 !== e.size
              ? e.size
              : void 0 !== (null == r ? void 0 : r.props.size)
                ? r.props.size
                : "medium",
          ),
        };
      })(e),
      l = (function (e) {
        const r = h(_, null),
          t = F(() => {
            const { labelPlacement: t } = e;
            return void 0 !== t
              ? t
              : (null == r ? void 0 : r.props.labelPlacement)
                ? r.props.labelPlacement
                : "top";
          }),
          n = F(
            () =>
              "left" === t.value &&
              ("auto" === e.labelWidth || "auto" === (null == r ? void 0 : r.props.labelWidth)),
          ),
          i = F(() => {
            if ("top" === t.value) return;
            const { labelWidth: i } = e;
            if (void 0 !== i && "auto" !== i) return $(i);
            if (n.value) {
              const e = null == r ? void 0 : r.maxChildLabelWidthRef.value;
              return void 0 !== e ? $(e) : void 0;
            }
            return void 0 !== (null == r ? void 0 : r.props.labelWidth)
              ? $(r.props.labelWidth)
              : void 0;
          }),
          a = F(() => {
            const { labelAlign: t } = e;
            return t || ((null == r ? void 0 : r.props.labelAlign) ? r.props.labelAlign : void 0);
          }),
          o = F(() => {
            var r;
            return [
              null === (r = e.labelProps) || void 0 === r ? void 0 : r.style,
              e.labelStyle,
              { width: i.value },
            ];
          }),
          s = F(() => {
            const { showRequireMark: t } = e;
            return void 0 !== t ? t : null == r ? void 0 : r.props.showRequireMark;
          }),
          l = F(() => {
            const { requireMarkPlacement: t } = e;
            return void 0 !== t
              ? t
              : (null == r ? void 0 : r.props.requireMarkPlacement) || "right";
          }),
          u = x(!1),
          d = x(!1),
          f = F(() => {
            const { validationStatus: r } = e;
            return void 0 !== r ? r : u.value ? "error" : d.value ? "warning" : void 0;
          }),
          c = F(() => {
            const { showFeedback: t } = e;
            return void 0 !== t
              ? t
              : void 0 === (null == r ? void 0 : r.props.showFeedback) || r.props.showFeedback;
          }),
          p = F(() => {
            const { showLabel: t } = e;
            return void 0 !== t
              ? t
              : void 0 === (null == r ? void 0 : r.props.showLabel) || r.props.showLabel;
          });
        return {
          validationErrored: u,
          validationWarned: d,
          mergedLabelStyle: o,
          mergedLabelPlacement: t,
          mergedLabelAlign: a,
          mergedShowRequireMark: s,
          mergedRequireMarkPlacement: l,
          mergedValidationStatus: f,
          mergedShowFeedback: c,
          mergedShowLabel: p,
          isAutoLabelWidth: n,
        };
      })(e),
      { validationErrored: u, validationWarned: d } = l,
      { mergedRequired: g, mergedRules: v } = (function (e) {
        const r = h(_, null),
          t = F(() => {
            const { rulePath: r } = e;
            if (void 0 !== r) return r;
            const { path: t } = e;
            return void 0 !== t ? t : void 0;
          }),
          n = F(() => {
            const n = [],
              { rule: i } = e;
            if ((void 0 !== i && (Array.isArray(i) ? n.push(...i) : n.push(i)), r)) {
              const { rules: e } = r.props,
                { value: i } = t;
              if (void 0 !== e && void 0 !== i) {
                const r = j(e, i);
                void 0 !== r && (Array.isArray(r) ? n.push(...r) : n.push(r));
              }
            }
            return n;
          }),
          i = F(() => n.value.some((e) => e.required)),
          a = F(() => i.value || e.required);
        return { mergedRules: n, mergedRequired: a };
      })(e),
      { mergedSize: y } = s,
      { mergedLabelPlacement: w, mergedLabelAlign: k, mergedRequireMarkPlacement: O } = l,
      R = x([]),
      z = x(f()),
      C = n ? P(n.props, "disabled") : x(!1),
      M = a("Form", "-form-item", ue, o, e, r);
    function V() {
      ((R.value = []), (u.value = !1), (d.value = !1), e.feedback && (z.value = f()));
    }
    b(P(e, "path"), () => {
      e.ignorePathChange || V();
    });
    const B = (...r) =>
      de(this, [...r], void 0, function* (r = null, t = () => !0, i = { suppressWarning: !0 }) {
        const { path: a } = e;
        i ? i.first || (i.first = e.first) : (i = {});
        const { value: o } = v,
          s = n ? j(n.props.model, a || "") : void 0,
          l = {},
          f = {},
          c = (
            r
              ? o.filter((e) =>
                  Array.isArray(e.trigger) ? e.trigger.includes(r) : e.trigger === r,
                )
              : o
          )
            .filter(t)
            .map((e, r) => {
              const t = Object.assign({}, e);
              if (
                (t.validator && (t.validator = fe(t.validator, !1)),
                t.asyncValidator && (t.asyncValidator = fe(t.asyncValidator, !0)),
                t.renderMessage)
              ) {
                const e = `__renderMessage__${r}`;
                ((f[e] = t.message), (t.message = e), (l[e] = t.renderMessage));
              }
              return t;
            }),
          p = c.filter((e) => "warning" !== e.level),
          m = c.filter((e) => "warning" === e.level),
          g = { valid: !0, errors: void 0, warnings: void 0 };
        if (!c.length) return g;
        const h = null != a ? a : "__n_no_path__",
          b = new se({ [h]: p }),
          y = new se({ [h]: m }),
          { validateMessages: w } = (null == n ? void 0 : n.props) || {};
        w && (b.messages(w), y.messages(w));
        const k = (e) => {
          ((R.value = e.map((e) => {
            const r = (null == e ? void 0 : e.message) || "";
            return { key: r, render: () => (r.startsWith("__renderMessage__") ? l[r]() : r) };
          })),
            e.forEach((e) => {
              var r;
              (null === (r = e.message) || void 0 === r
                ? void 0
                : r.startsWith("__renderMessage__")) && (e.message = f[e.message]);
            }));
        };
        if (p.length) {
          const e = yield new Promise((e) => {
            b.validate({ [h]: s }, i, e);
          });
          (null == e ? void 0 : e.length) && ((g.valid = !1), (g.errors = e), k(e));
        }
        if (m.length && !g.errors) {
          const e = yield new Promise((e) => {
            y.validate({ [h]: s }, i, e);
          });
          (null == e ? void 0 : e.length) && (k(e), (g.warnings = e));
        }
        return (
          g.errors || g.warnings ? ((u.value = !!g.errors), (d.value = !!g.warnings)) : V(),
          g
        );
      });
    q(c, {
      path: P(e, "path"),
      disabled: C,
      mergedSize: s.mergedSize,
      mergedValidationStatus: l.mergedValidationStatus,
      restoreValidation: V,
      handleContentBlur: function () {
        B("blur");
      },
      handleContentChange: function () {
        B("change");
      },
      handleContentFocus: function () {
        B("focus");
      },
      handleContentInput: function () {
        B("input");
      },
    });
    const W = {
        validate: function (e, r) {
          return de(this, void 0, void 0, function* () {
            let t, n, i, a;
            return (
              "string" == typeof e
                ? ((t = e), (n = r))
                : null !== e &&
                  "object" == typeof e &&
                  ((t = e.trigger), (n = e.callback), (i = e.shouldRuleBeApplied), (a = e.options)),
              yield new Promise((e, r) => {
                B(t, i, a).then(({ valid: t, errors: i, warnings: a }) => {
                  t
                    ? (n && n(void 0, { warnings: a }), e({ warnings: a }))
                    : (n && n(i, { warnings: a }), r(i));
                });
              })
            );
          });
        },
        restoreValidation: V,
        internalValidate: B,
      },
      L = x(null);
    S(() => {
      if (!l.isAutoLabelWidth.value) return;
      const e = L.value;
      if (null !== e) {
        const r = e.style.whiteSpace;
        ((e.style.whiteSpace = "nowrap"),
          (e.style.width = ""),
          null == n || n.deriveMaxChildLabelWidth(Number(getComputedStyle(e).width.slice(0, -2))),
          (e.style.whiteSpace = r));
      }
    });
    const D = F(() => {
        var e;
        const { value: r } = y,
          { value: t } = w,
          n = "top" === t ? "vertical" : "horizontal",
          {
            common: { cubicBezierEaseInOut: i },
            self: {
              labelTextColor: a,
              asteriskColor: o,
              lineHeight: s,
              feedbackTextColor: l,
              feedbackTextColorWarning: u,
              feedbackTextColorError: d,
              feedbackPadding: f,
              labelFontWeight: c,
              [p("labelHeight", r)]: m,
              [p("blankHeight", r)]: g,
              [p("feedbackFontSize", r)]: h,
              [p("feedbackHeight", r)]: v,
              [p("labelPadding", n)]: b,
              [p("labelTextAlign", n)]: x,
              [p(p("labelFontSize", t), r)]: q,
            },
          } = M.value;
        let F = null !== (e = k.value) && void 0 !== e ? e : x;
        "top" === t && (F = "right" === F ? "flex-end" : "flex-start");
        return {
          "--n-bezier": i,
          "--n-line-height": s,
          "--n-blank-height": g,
          "--n-label-font-size": q,
          "--n-label-text-align": F,
          "--n-label-height": m,
          "--n-label-padding": b,
          "--n-label-font-weight": c,
          "--n-asterisk-color": o,
          "--n-label-text-color": a,
          "--n-feedback-padding": f,
          "--n-feedback-font-size": h,
          "--n-feedback-height": v,
          "--n-feedback-text-color": l,
          "--n-feedback-text-color-warning": u,
          "--n-feedback-text-color-error": d,
        };
      }),
      T = t
        ? m(
            "form-item",
            F(() => {
              var e;
              return `${y.value[0]}${w.value[0]}${(null === (e = k.value) || void 0 === e ? void 0 : e[0]) || ""}`;
            }),
            D,
            e,
          )
        : void 0,
      I = F(() => "left" === w.value && "left" === O.value && "left" === k.value);
    return Object.assign(
      Object.assign(
        Object.assign(
          Object.assign(
            {
              labelElementRef: L,
              mergedClsPrefix: r,
              mergedRequired: g,
              feedbackId: z,
              renderExplains: R,
              reverseColSpace: I,
            },
            l,
          ),
          s,
        ),
        W,
      ),
      {
        cssVars: t ? void 0 : D,
        themeClass: null == T ? void 0 : T.themeClass,
        onRender: null == T ? void 0 : T.onRender,
      },
    );
  },
  render() {
    const {
        $slots: e,
        mergedClsPrefix: r,
        mergedShowLabel: t,
        mergedShowRequireMark: n,
        mergedRequireMarkPlacement: i,
        onRender: a,
      } = this,
      o = void 0 !== n ? n : this.mergedRequired;
    null == a || a();
    return k(
      "div",
      {
        class: [
          `${r}-form-item`,
          this.themeClass,
          `${r}-form-item--${this.mergedSize}-size`,
          `${r}-form-item--${this.mergedLabelPlacement}-labelled`,
          this.isAutoLabelWidth && `${r}-form-item--auto-label-width`,
          !t && `${r}-form-item--no-label`,
        ],
        style: this.cssVars,
      },
      t &&
        (() => {
          const e = this.$slots.label ? this.$slots.label() : this.label;
          if (!e) return null;
          const t = k("span", { class: `${r}-form-item-label__text` }, e),
            n = o
              ? k("span", { class: `${r}-form-item-label__asterisk` }, "left" !== i ? " *" : "* ")
              : "right-hanging" === i &&
                k("span", { class: `${r}-form-item-label__asterisk-placeholder` }, " *"),
            { labelProps: a } = this;
          return k(
            "label",
            Object.assign({}, a, {
              class: [
                null == a ? void 0 : a.class,
                `${r}-form-item-label`,
                `${r}-form-item-label--${i}-mark`,
                this.reverseColSpace && `${r}-form-item-label--reverse-columns-space`,
              ],
              style: this.mergedLabelStyle,
              ref: "labelElementRef",
            }),
            "left" === i ? [n, t] : [t, n],
          );
        })(),
      k(
        "div",
        {
          class: [
            `${r}-form-item-blank`,
            this.contentClass,
            this.mergedValidationStatus && `${r}-form-item-blank--${this.mergedValidationStatus}`,
          ],
          style: this.contentStyle,
        },
        e,
      ),
      this.mergedShowFeedback
        ? k(
            "div",
            {
              key: this.feedbackId,
              style: this.feedbackStyle,
              class: [`${r}-form-item-feedback-wrapper`, this.feedbackClass],
            },
            k(
              O,
              { name: "fade-down-transition", mode: "out-in" },
              {
                default: () => {
                  const { mergedValidationStatus: t } = this;
                  return d(e.feedback, (e) => {
                    var n;
                    const { feedback: i } = this,
                      a =
                        e || i
                          ? k(
                              "div",
                              { key: "__feedback__", class: `${r}-form-item-feedback__line` },
                              e || i,
                            )
                          : this.renderExplains.length
                            ? null === (n = this.renderExplains) || void 0 === n
                              ? void 0
                              : n.map(({ key: e, render: t }) =>
                                  k("div", { key: e, class: `${r}-form-item-feedback__line` }, t()),
                                )
                            : null;
                    return a
                      ? k(
                          "div",
                          "warning" === t
                            ? {
                                key: "controlled-warning",
                                class: `${r}-form-item-feedback ${r}-form-item-feedback--warning`,
                              }
                            : "error" === t
                              ? {
                                  key: "controlled-error",
                                  class: `${r}-form-item-feedback ${r}-form-item-feedback--error`,
                                }
                              : "success" === t
                                ? {
                                    key: "controlled-success",
                                    class: `${r}-form-item-feedback ${r}-form-item-feedback--success`,
                                  }
                                : { key: "controlled-default", class: `${r}-form-item-feedback` },
                          a,
                        )
                      : null;
                  });
                },
              },
            ),
          )
        : null,
    );
  },
});
export { ce as _, C as a };
