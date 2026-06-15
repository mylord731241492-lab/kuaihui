var e = Object.defineProperty,
  t = (t, s, a) =>
    ((t, s, a) =>
      s in t ? e(t, s, { enumerable: !0, configurable: !0, writable: !0, value: a }) : (t[s] = a))(
      t,
      "symbol" != typeof s ? s + "" : s,
      a,
    );
import { bc as s } from "./index-Ct5UuHQN.js";
const a = new (class {
  constructor() {
    (t(this, "dbPromise"), (this.dbPromise = this.initDB()));
  }
  async initDB() {
    return s("replyMsgDB", 2, {
      upgrade(e, t, s, a) {
        if (e.objectStoreNames.contains("replyMsg")) {
          if (t < 2) {
            const e = a.objectStore("replyMsg");
            e.indexNames.contains("shopSystemId") ||
              e.createIndex("shopSystemId", "shopSystemId", { unique: !1 });
          }
        } else {
          e.createObjectStore("replyMsg", { keyPath: "DBId" }).createIndex(
            "shopSystemId",
            "shopSystemId",
            { unique: !1 },
          );
        }
      },
    });
  }
  async set(e) {
    const t = await this.dbPromise,
      s = (await t.get("replyMsg", e.DBId)) || {},
      a = {};
    for (const r in e) {
      const t = e[r];
      null != t && "" !== t && (a[r] = t);
    }
    const o = { ...s, ...a };
    await t.put("replyMsg", o);
  }
  async get(e) {
    return (await this.dbPromise).get("replyMsg", e);
  }
  async delete(e) {
    const t = await this.dbPromise;
    await t.delete("replyMsg", e);
  }
  async deleteByMessageIdAndShopId(e, t) {
    const s = (await this.dbPromise).transaction("replyMsg", "readwrite"),
      a = s.objectStore("replyMsg"),
      o = a.index("shopSystemId"),
      r = (await o.getAll(e)).filter((e) => e.messageId === t);
    for (const i of r) a.delete(i.DBId);
    return (await s.done, r.length);
  }
  async getAll() {
    return (await this.dbPromise).getAll("replyMsg");
  }
  async clear() {
    const e = await this.dbPromise;
    await e.clear("replyMsg");
  }
  async deleteAllByShopId(e) {
    const t = (await this.dbPromise).transaction("replyMsg", "readwrite"),
      s = t.objectStore("replyMsg"),
      a = s.index("shopSystemId"),
      o = await a.getAll(e);
    for (const r of o) s.delete(r.DBId);
    return (await t.done, o.length);
  }
  async setListData(e) {
    const t = await this.dbPromise;
    for (const s of e) {
      if (!s.shopSystemId || !s.messageId) continue;
      const e = s.DBId || s.shopSystemId + "_" + s.messageId;
      s.DBId = e;
      const a = (await t.get("replyMsg", e)) || {},
        o = {};
      for (const t in s) {
        const e = s[t];
        null != e && "" !== e && (o[t] = e);
      }
      const r = { ...a, ...o };
      await t.put("replyMsg", r);
    }
  }
})();
export { a as r };
