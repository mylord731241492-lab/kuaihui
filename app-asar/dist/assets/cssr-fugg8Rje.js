import { bC as o, db as n } from "./index-Ct5UuHQN.js";
import { d as t, b as d } from "./vendor-DHo7BzsC.js";
let e, i;
var s, r;
function a(o) {
  if (i) return;
  let n = !1;
  (t(() => {
    i ||
      null == e ||
      e.then(() => {
        n || o();
      });
  }),
    d(() => {
      n = !0;
    }));
}
((e = o
  ? null === (r = null === (s = document) || void 0 === s ? void 0 : s.fonts) || void 0 === r
    ? void 0
    : r.ready
  : void 0),
  (i = !1),
  void 0 !== e
    ? e.then(() => {
        i = !0;
      })
    : (i = !0));
const { c: l } = n(),
  v = "vueuc-style";
export { v as a, l as c, a as o };
