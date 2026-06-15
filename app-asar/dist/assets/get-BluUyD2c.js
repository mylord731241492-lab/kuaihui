import { cS as n, bn as r, cW as t, cI as e } from "./index-Ct5UuHQN.js";
var a = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
  c = /^\w*$/;
function u(t, e) {
  if (n(t)) return !1;
  var u = typeof t;
  return (
    !("number" != u && "symbol" != u && "boolean" != u && null != t && !r(t)) ||
    c.test(t) ||
    !a.test(t) ||
    (null != e && t in Object(e))
  );
}
function o(n, r) {
  if ("function" != typeof n || (null != r && "function" != typeof r))
    throw new TypeError("Expected a function");
  var e = function () {
    var t = arguments,
      a = r ? r.apply(this, t) : t[0],
      c = e.cache;
    if (c.has(a)) return c.get(a);
    var u = n.apply(this, t);
    return ((e.cache = c.set(a, u) || c), u);
  };
  return ((e.cache = new (o.Cache || t)()), e);
}
o.Cache = t;
var i,
  f,
  s,
  l =
    /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
  p = /\\(\\)?/g,
  h =
    ((i = function (n) {
      var r = [];
      return (
        46 === n.charCodeAt(0) && r.push(""),
        n.replace(l, function (n, t, e, a) {
          r.push(e ? a.replace(p, "$1") : t || n);
        }),
        r
      );
    }),
    (f = o(i, function (n) {
      return (500 === s.size && s.clear(), n);
    })),
    (s = f.cache),
    f);
function v(r, t) {
  return n(r) ? r : u(r, t) ? [r] : h(e(r));
}
function d(n) {
  if ("string" == typeof n || r(n)) return n;
  var t = n + "";
  return "0" == t && 1 / n == -1 / 0 ? "-0" : t;
}
function y(n, r) {
  for (var t = 0, e = (r = v(r, n)).length; null != n && t < e; ) n = n[d(r[t++])];
  return t && t == e ? n : void 0;
}
function b(n, r, t) {
  var e = null == n ? void 0 : y(n, r);
  return void 0 === e ? t : e;
}
export { y as b, v as c, b as g, u as i, d as t };
