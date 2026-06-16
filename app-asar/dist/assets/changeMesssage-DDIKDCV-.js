var e = Object.defineProperty,
  t = (t, s, o) =>
    ((t, s, o) =>
      s in t ? e(t, s, { enumerable: !0, configurable: !0, writable: !0, value: o }) : (t[s] = o))(
      t,
      "symbol" != typeof s ? s + "" : s,
      o,
    );
import {
  i as s,
  e as o,
  f as i,
  g as n,
  Z as a,
  u as r,
  ac as l,
  ca as d,
  cb as u,
  cc as c,
  cd as p,
  ce as m,
  cf as g,
  cg as h,
  ch as f,
  ci as y,
  cj as v,
  ag as I,
  af as S,
  ae as T,
  ck as w,
  a3 as R,
  cl as k,
  cm as b,
  cn as A,
  aj as D,
  co as N,
} from "./index-Ct5UuHQN.js";
import { G as M, c as L, P as $, r as C } from "./vendor-DHo7BzsC.js";
import { d as O } from "./dayjs.min-D__CVkhT.js";
import { s as U, t as x, f as _, u as q, v as E } from "./newAi-BxbCXy2V.js";
import { g as H } from "./_commonjsHelpers-Dvrxj_Zk.js";
import { u as j } from "./ai-CALWm0qr.js";
const K = M({});
function P() {
  return {
    shopMessageCount: K,
    increase: (e, t, s) => {
      e &&
        (K[e] || (K[e] = []),
        (K[e] = K[e].filter((e) => e.messageId != t || (null == e ? void 0 : e.userId) != s)),
        K[e].push({ messageId: t, userId: s }));
    },
    remove: (e) => {
      e && delete K[e];
    },
    decrease: (e, t, s) => {
      e && (K[e] = K[e].filter((e) => e.messageId != t.messageId));
    },
    clear: () => {
      Object.keys(K).forEach((e) => delete K[e]);
    },
    total: () => Object.values(K).reduce((e, t) => e + (t.length ?? 0), 0),
  };
}
const Q = "shopQueryRecord",
  J = [
    { taskKey: "doudian-performance", platformType: "抖店", taskType: "performance", hour: 9 },
    { taskKey: "pdd-performance", platformType: "拼多多", taskType: "performance", hour: 10 },
    { taskKey: "kh-performance", platformType: "快手", taskType: "performance", hour: 11 },
    { taskKey: "sph-performance", platformType: "视频号", taskType: "performance", hour: 13 },
    { taskKey: "xhs-performance", platformType: "小红书", taskType: "performance", hour: 14 },
    { taskKey: "tb-performance", platformType: "淘宝/天猫", taskType: "performance", hour: 15 },
    { taskKey: "doudian-experience", platformType: "抖店", taskType: "experience", hour: 12 },
    { taskKey: "pdd-experience", platformType: "拼多多", taskType: "experience", hour: 8 },
  ],
  B = (e = new Date()) =>
    `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`,
  F = () => {
    const e = new Date();
    return (e.setDate(e.getDate() - 1), B(e));
  };
const W = new (class {
    constructor() {
      (t(this, "timers", new Map()),
        t(this, "midnightResetTimer", null),
        t(this, "queue", []),
        t(this, "queuedKeys", new Set()),
        t(this, "runningKeys", new Set()),
        t(this, "lastTriggerAt", new Map()),
        t(this, "pendingTimeouts", new Map()),
        t(this, "runningTaskDates", new Map()),
        t(this, "processing", !1),
        t(this, "initialized", !1),
        t(this, "options", null),
        t(this, "queueIntervalMs", 5e3));
    }
    init(e) {
      (this.dispose(),
        (this.options = e),
        (this.queueIntervalMs = e.queueIntervalMs ?? 5e3),
        (this.initialized = !0),
        this.catchUpMissedTasks(),
        J.forEach((e) => this.registerTaskTimer(e)),
        this.registerMidnightResetTimer());
    }
    dispose() {
      (this.timers.forEach((e) => {
        window.clearTimeout(e);
      }),
        this.timers.clear(),
        "number" == typeof this.midnightResetTimer && window.clearTimeout(this.midnightResetTimer),
        (this.midnightResetTimer = null),
        (this.queue = []),
        this.queuedKeys.clear(),
        this.runningKeys.clear(),
        this.lastTriggerAt.clear(),
        this.pendingTimeouts.forEach((e) => {
          window.clearTimeout(e);
        }),
        this.pendingTimeouts.clear(),
        this.runningTaskDates.clear(),
        (this.processing = !1),
        (this.initialized = !1),
        (this.options = null));
    }
    handleShopLoginCatchUp(e) {
      if (!this.initialized) return;
      const t = this.getAllShops().find((t) => t.id === e);
      t &&
        t.loginStatus &&
        J.forEach((e) => {
          e.platformType === t.platformType &&
            this.hasReachedTaskTime(e) &&
            (this.hasSucceededToday(t.id, e.taskType) ||
              this.isRecentlyTriggered(t.id, e.taskType) ||
              this.enqueueTask({
                shopId: t.id,
                taskKey: e.taskKey,
                taskType: e.taskType,
                platformType: e.platformType,
                triggerSource: "login_catchup",
              }));
        });
    }
    markTaskSuccess(e, t) {
      const s = this.getStateKey(e, t),
        o = this.runningTaskDates.get(s),
        i = B();
      if (!o || o === i) {
        const s = this.getShopQueryRecord(),
          o = String(e);
        (s[o] || (s[o] = {}), (s[o][t] = i), localStorage.setItem(Q, JSON.stringify(s)));
      }
      (this.runningKeys.delete(s),
        this.queuedKeys.delete(s),
        this.lastTriggerAt.delete(s),
        this.runningTaskDates.delete(s),
        this.clearPendingTimeout(s));
    }
    clearQueryRecords() {
      localStorage.removeItem(Q);
    }
    hasSucceededToday(e, t) {
      var s;
      return (null == (s = this.getShopQueryRecord()[String(e)]) ? void 0 : s[t]) === B();
    }
    registerTaskTimer(e) {
      const t = this.timers.get(e.taskKey);
      "number" == typeof t && window.clearTimeout(t);
      const s = new Date(),
        o = new Date(s);
      (o.setHours(e.hour, 0, 0, 0), s >= o && o.setDate(o.getDate() + 1));
      const i = o.getTime() - s.getTime(),
        n = window.setTimeout(() => {
          (this.runDailyTask(e), this.registerTaskTimer(e));
        }, i);
      this.timers.set(e.taskKey, n);
    }
    catchUpMissedTasks() {
      J.forEach((e) => {
        this.hasReachedTaskTime(e) && this.runDailyTask(e);
      });
    }
    runDailyTask(e) {
      this.getAllShops()
        .filter((t) => t.platformType === e.platformType)
        .forEach((t) => {
          t.loginStatus &&
            (this.hasSucceededToday(t.id, e.taskType) ||
              this.enqueueTask({
                shopId: t.id,
                taskKey: e.taskKey,
                taskType: e.taskType,
                platformType: e.platformType,
                triggerSource: "schedule",
              }));
        });
    }
    enqueueTask(e) {
      const t = this.getStateKey(e.shopId, e.taskType);
      this.queuedKeys.has(t) ||
        this.runningKeys.has(t) ||
        this.hasSucceededToday(e.shopId, e.taskType) ||
        (this.queue.push(e), this.queuedKeys.add(t), this.consumeQueue());
    }
    async consumeQueue() {
      if (!this.processing) {
        for (this.processing = !0; this.queue.length > 0; ) {
          const e = this.queue.shift();
          if (!e) continue;
          const t = this.getStateKey(e.shopId, e.taskType);
          this.queuedKeys.delete(t);
          const s = this.getAllShops().find((t) => t.id === e.shopId);
          if (!s || !s.loginStatus) continue;
          if (this.hasSucceededToday(s.id, e.taskType)) continue;
          (this.runningKeys.add(t),
            this.lastTriggerAt.set(t, Date.now()),
            this.runningTaskDates.set(t, B()));
          ((await this.sendTask(s, e.taskType))
            ? this.startPendingTimeout(t)
            : (this.runningKeys.delete(t),
              this.lastTriggerAt.delete(t),
              this.runningTaskDates.delete(t),
              this.clearPendingTimeout(t)),
            await this.delay(this.queueIntervalMs));
        }
        this.processing = !1;
      }
    }
    async sendTask(e, t) {
      return "performance" === t
        ? this.sendPerformanceQuery(e)
        : "afterSale" === t
          ? this.sendAfterSaleQuery(e)
          : this.sendExperienceQuery(e);
    }
    async sendPerformanceQuery(e) {
      try {
        return (
          s.send("send-to-webcontents-view-js", {
            shopId: e.id,
            channel: "customerServicePerformance",
            data: JSON.stringify({ name: e.customerName, info: "" }),
          }),
          !0
        );
      } catch (t) {
        return !1;
      }
    }
    async sendAfterSaleQuery(e) {
      try {
        const t = F();
        return (
          s.send("send-to-webcontents-view-js", {
            shopId: e.id,
            channel: "afterSaleTotalOrder",
            data: JSON.stringify({ info: { shopId: e.id, month: [t, t], fromDailyTask: !0 } }),
          }),
          !0
        );
      } catch (t) {
        return !1;
      }
    }
    async sendExperienceQuery(e) {
      try {
        return (
          s.send("send-to-webcontents-view-js", {
            shopId: e.id,
            channel: "experienceScore",
            data: JSON.stringify({}),
          }),
          !0
        );
      } catch (t) {
        return !1;
      }
    }
    getShopQueryRecord() {
      try {
        const e = localStorage.getItem(Q);
        return e ? JSON.parse(e) : {};
      } catch (e) {
        return {};
      }
    }
    hasReachedTaskTime(e) {
      return new Date().getHours() >= e.hour;
    }
    isRecentlyTriggered(e, t) {
      const s = this.getStateKey(e, t),
        o = this.lastTriggerAt.get(s);
      return !!o && Date.now() - o < this.queueIntervalMs;
    }
    getStateKey(e, t) {
      return `${e}:${t}`;
    }
    getAllShops() {
      var e;
      return (null == (e = this.options) ? void 0 : e.getAllShops()) ?? [];
    }
    registerMidnightResetTimer() {
      "number" == typeof this.midnightResetTimer && window.clearTimeout(this.midnightResetTimer);
      const e = new Date(),
        t = new Date(e);
      t.setHours(24, 0, 0, 0);
      const s = t.getTime() - e.getTime();
      this.midnightResetTimer = window.setTimeout(() => {
        (this.resetExpiredDailyTasks(), this.registerMidnightResetTimer());
      }, s);
    }
    resetExpiredDailyTasks() {
      ((this.queue = []),
        this.queuedKeys.clear(),
        this.runningKeys.clear(),
        this.lastTriggerAt.clear(),
        this.runningTaskDates.clear(),
        this.pendingTimeouts.forEach((e) => {
          window.clearTimeout(e);
        }),
        this.pendingTimeouts.clear());
    }
    startPendingTimeout(e) {
      this.clearPendingTimeout(e);
      const t = window.setTimeout(() => {
        (this.runningKeys.delete(e),
          this.lastTriggerAt.delete(e),
          this.runningTaskDates.delete(e),
          this.pendingTimeouts.delete(e));
      }, 18e4);
      this.pendingTimeouts.set(e, t);
    }
    clearPendingTimeout(e) {
      const t = this.pendingTimeouts.get(e);
      ("number" == typeof t && window.clearTimeout(t), this.pendingTimeouts.delete(e));
    }
    delay(e) {
      return new Promise((t) => {
        window.setTimeout(t, e);
      });
    }
  })(),
  Y = 2;
let z = null;
function G() {
  return (z || (z = o()), z);
}
function V(e) {
  return !!(function () {
    var e;
    try {
      return (null == (e = G().userInfo) ? void 0 : e.status) == Y;
    } catch (t) {
      return !1;
    }
  })();
}
L(() => {
  var e;
  try {
    return (null == (e = G().userInfo) ? void 0 : e.status) == Y;
  } catch {
    return !1;
  }
});
const Z = i(),
  X = n();
let ee = null,
  te = null;
async function se() {
  if (!te) {
    const e = await a(() => Promise.resolve().then(() => Fe), void 0, import.meta.url);
    te = e.processQueue;
  }
  return te;
}
const oe = {
  start() {
    if (
      0 == Object.keys(Z.serviceReplyTime).length &&
      0 == Object.keys(Z.serviceAiInvite).length &&
      ee
    )
      return (clearInterval(ee), void (ee = null));
    ee ||
      (ee = setInterval(() => {
        this.checkReminderMessages();
      }, 1e4));
  },
  stop() {
    ee && (clearInterval(ee), (ee = null));
  },
  init() {
    (Z.reminderReply.status || Z.aiAutoReview.status) && this.start();
  },
  async checkReminderMessages() {
    if (V()) return;
    if (!Z.reminderReply.status && !Z.aiAutoReview.status) return;
    const e = Date.now(),
      t = 1e3 * Z.reminderReply.time,
      s = 1e3 * Z.aiAutoReview.time;
    if (
      0 === Object.keys(Z.serviceAiInvite).length &&
      0 === Object.keys(Z.serviceReplyTime).length &&
      ee
    )
      return (clearInterval(ee), void (ee = null));
    (Z.reminderReply.status &&
      Object.keys(Z.serviceReplyTime).forEach((s) => {
        const o = Z.serviceReplyTime[s];
        if (!o || !o.timestamp) return void delete Z.serviceReplyTime[s];
        const i = o.timestamp < 1e12 ? 1e3 * o.timestamp : o.timestamp;
        if (e - i < t) return;
        const [n] = s.split("_"),
          a = Number(n),
          r = o.message;
        r
          ? r.isReminderReply
            ? delete Z.serviceReplyTime[s]
            : this.addReminderToQueue(r, a, s)
          : delete Z.serviceReplyTime[s];
      }),
      Z.aiAutoReview.status &&
        Object.keys(Z.serviceAiInvite).forEach((t) => {
          const o = Z.serviceAiInvite[t];
          if (!o || !o.timestamp) return void delete Z.serviceAiInvite[t];
          const i = o.timestamp < 1e12 ? 1e3 * o.timestamp : o.timestamp;
          if (e - i < s) return;
          const [n] = t.split("_"),
            a = Number(n),
            r = o.message;
          r
            ? r.isAiInviteReply
              ? delete Z.serviceAiInvite[t]
              : this.addAutoReviewToQueue(r, a, t)
            : delete Z.serviceAiInvite[t];
        }));
  },
  async addReminderToQueue(e, t, s) {
    const o = Z.reminderReply.content;
    if (!o) return;
    const i = Z.serviceReplyTime[s],
      n =
        (i && Math.floor((Date.now() - i.timestamp) / 1e3),
        { ...e, content: o, isReminderReply: !0, isBottomLineAutoReply: !1, isAiAutoReply: !1 });
    ((await se())(t, n), delete Z.serviceReplyTime[s]);
  },
  async addAutoReviewToQueue(e, t, s) {
    const o = Z.aiAutoReview.content;
    if (!o) return;
    const i = Z.serviceAiInvite[s],
      n =
        (i && Math.floor((Date.now() - i.timestamp) / 1e3),
        { ...e, content: o, isAiInviteReply: !0, isBottomLineAutoReply: !1, isAiAutoReply: !1 });
    ((await se())(t, n), delete Z.serviceAiInvite[s]);
  },
  recordServiceReply(e, t, s) {
    if (!Z.reminderReply.status) return;
    const o = `${e}_${t}`;
    let i = s;
    (i || (i = X.messages.find((s) => s.messageId === t && s.shopSystemId === e)),
      i && (Z.serviceReplyTime[o] = { timestamp: Date.now(), message: { ...s } }),
      this.init());
  },
  recordAutoReviewServiceReply(e, t, s) {
    if (!Z.aiAutoReview.status) return;
    const o = `${e}_${t}`;
    let i = s;
    (i || (i = X.messages.find((s) => s.messageId === t && s.shopSystemId === e)),
      i && ((Z.serviceAiInvite[o] = { timestamp: Date.now(), message: { ...i } }), this.init()));
  },
  clearRecords(e, t) {
    const s = `${e}_${t}`;
    (delete Z.serviceReplyTime[s], delete Z.serviceAiInvite[s]);
  },
};
var ie, ne;
const ae = H(
    ne
      ? ie
      : ((ne = 1),
        (ie = async function* (e, t, s) {
          const o = new Set();
          async function i() {
            const [e, t] = await Promise.race(o);
            return (o.delete(e), t);
          }
          for (const n of t) {
            const a = (async () => await s(n, t))().then((e) => [a, e]);
            (o.add(a), o.size >= e && (yield await i()));
          }
          for (; o.size; ) yield await i();
        })),
  ),
  re = n(),
  le = i();
function de(e, t) {
  let s = null,
    o = 0;
  const i = re.singleShopBottomLineReplyList[e];
  if (
    (i && re.isSingleShopBottomLineEnabled(e)
      ? ((s = i), (o = re.singleShopBottomLineReplyFrequency[t] || 0))
      : le.bottomLineReply.status &&
        ((s = le.bottomLineReply), (o = le.bottomLineReplyFrequency[t] || 0)),
    s && s.content && s.content.length > 0)
  ) {
    Math.min(o, s.content.length - 1);
    return s.content[o];
  }
  return ".亲亲非常抱歉,让您久等了,这边马上看下您发的问题,您稍等哈";
}
function ue(e, t) {
  if (V()) return;
  if (!0 === e.isBottomLineAutoReply) {
    !(function (e, t) {
      t && re.isSingleShopBottomLineEnabled(t)
        ? (re.addSingleShopBottomLineRepliedUser(t, e),
          s.send(
            "update-bottom-line-reply-frequency",
            r.deepClone({ freq: re.singleShopBottomLineReplyFrequency, type: "single" }),
          ))
        : le.bottomLineReply.status &&
          (le.addBottomLineRepliedUser(e),
          s.send(
            "update-bottom-line-reply-frequency",
            r.deepClone({ freq: le.bottomLineReplyFrequency, type: "global" }),
          ));
    })(e.messageId, t);
    const o = Us.value.find((s) => s.messageId === e.messageId && s.shopSystemId === t);
    _s({ messageId: e.messageId, shopSystemId: t, userId: e.userId });
    const i = re.shops,
      n = i.findIndex((e) => e.id === t),
      a = i[n];
    (e.isReminderReply ||
      e.isAiInviteReply ||
      (oe.recordServiceReply(t, e.messageId, e),
      oe.recordAutoReviewServiceReply(t, e.messageId, e)),
      s.send("get-ai-replied-message", {
        messageId: e.messageId,
        username: (null == o ? void 0 : o.username) || (null == e ? void 0 : e.username),
        content: e.content,
        shopSystemId: t,
        shopName: null == a ? void 0 : a.shopName,
        loginUrl: null == a ? void 0 : a.loginUrl,
        platformLogo: null == a ? void 0 : a.platformLogo,
        platformType: null == a ? void 0 : a.platformType,
      }));
  }
}
const ce = n(),
  pe = i(),
  me = j(),
  ge = new Map(),
  he = new Map(),
  fe = new Map(),
  ye = new Map(),
  ve = new Map(),
  Ie = new Map();
function Se(e) {
  return ce.shops.findIndex((t) => t.id === e);
}
function Te(e) {
  const t = e.match(/[?&](goods_id|id)=(\d+)/);
  return t ? Number(t[2]) : null;
}
function we(e, t, s) {
  const o = t && t.trim().length > 0,
    i = s && s.imageUrl;
  if (o && !i) return [{ ...e, content: t }];
  if (!o && i)
    return [
      { ...e, content: "", imageUrl: s.imageUrl, imageMimeType: s.imageMimeType, isImageOnly: !0 },
    ];
  if (o && i) {
    const o = {
        ...e,
        content: "",
        imageUrl: s.imageUrl,
        imageMimeType: s.imageMimeType,
        isImageOnly: !0,
      },
      i = { ...e, content: t };
    return (delete i.imageUrl, delete i.imageMimeType, delete i.isImageOnly, [o, i]);
  }
  return [];
}
function Re(e, t) {
  ve.set(e, t);
}
function ke(e, t, s = 5e3) {
  return new Promise((o) => {
    const i = {
      channels: t,
      resolve: o,
      timeout: setTimeout(() => {
        const t = Ie.get(e);
        if (t) {
          const e = t.indexOf(i);
          e > -1 && t.splice(e, 1);
        }
        o(null);
      }, s),
    };
    (Ie.has(e) || Ie.set(e, []), Ie.get(e).push(i));
  });
}
function be(e, t, s) {
  (he.delete(e), ge.delete(e), fe.delete(e), s(t));
}
const Ae = new Map(),
  De = new Map(),
  Ne = new Map(),
  Me = new Map(),
  Le = new Set(),
  $e = new Set(),
  Ce = new Map(),
  Oe = new Map(),
  Ue = new Map(),
  xe = o(),
  _e = async (e) => {
    const t = Ae.get(e);
    if (t) {
      if (Me.has(t.messageId)) return;
      if ((Me.set(t.messageId, !0), fe.has(e))) return;
      if (Ne.has(t.shopSystemId)) return;
      Ne.set(t.shopSystemId, !0);
      const s = setTimeout(() => {
        je(t.shopSystemId, t);
      }, 3e4);
      Ce.set(t.shopSystemId, s);
      return await Ee(t.shopSystemId, t);
    }
  },
  qe = async (e) => {
    const t = De.get(e);
    if (t) {
      const e = setTimeout(() => {
        je(t.shopSystemId, t);
      }, 3e4);
      if ((Oe.set(t.messageId, e), Me.has(t.messageId))) return;
      Me.set(t.messageId, !0);
      return await He(t);
    }
  },
  Ee = async (e, t) => {
    s.postMessage("main-process-relay", { channel: "get-shop-user", shopId: e, data: t });
    const o = await Qe.wait(e);
    if ((Ke.delete(e), null == o ? void 0 : o.hasContent))
      return (
        fe.set(e, !0),
        setTimeout(() => {
          je(e, t);
        }, 1e4),
        !1
      );
    {
      const o = ce.shops[Se(e)];
      let n = JSON.parse(JSON.stringify(t));
      const a = [];
      if ("AI" == t.tempSendType) {
        if ("code" != (null == t ? void 0 : t.type)) {
          const s = await Je.wait(t.messageId);
          (Pe.delete(e), s ? ((n = s), n.history.length || (n.history = [t])) : (n.history = [t]));
        } else n.history = [t];
        const s = ht(e, [n.history[n.history.length - 1]]),
          r = ut(e, s);
        for (const n of r) {
          ct(e, n.messageId, n.content);
          const s = ce.singleShopAiReplyConfig[e],
            r =
              (null == s ? void 0 : s.isEnabled) && (null == s ? void 0 : s.aiReplyStrategy)
                ? s.aiReplyStrategy
                : pe.aiReplyConfig.aiReplyStrategy,
            l = new nt(n, o.id.toString(), r, me, o.shopCategory, n.goodId, n.goodInfo, n.content);
          try {
            const s = await St(l);
            if (s) {
              Tt(e, n.messageId, s.sessionId);
              const o = ft(s, e, n);
              let i = null;
              o.imageUrl && "null" != o.imageUrl && (i = { imageUrl: o.imageUrl });
              const r = we(n, o.text, i);
              for (const e of r) ((e.isOpen = o.isOpen ?? "0"), a.push(e));
              if (o.isOpen && "null" != o.isOpen) {
                const s = t.platformType == `${e}_${t.messageId}`;
                ye.set(s, o.isOpen);
              }
            }
          } catch (i) {
            a.push(null);
          }
        }
      } else
        t.isBottomLineAutoReply
          ? ((t.content = de(e, t.messageId)), a.push(t))
          : (t.isReminderReply || t.isAiInviteReply) && a.push(t);
      a.length > 0 &&
        null != a[0] &&
        s.postMessage("main-process-relay", { channel: "reply-message", shopId: e, data: a });
    }
  },
  He = async (e) => {
    const t = JSON.parse(JSON.stringify(e));
    t.history = [e];
    const o = e.shopSystemId,
      i = ce.shops[Se(o)],
      n = [];
    if ("AI" == e.tempSendType) {
      const s = ut(o, ht(o, [t.history[t.history.length - 1]]));
      for (const t of s) {
        ct(o, t.messageId, t.content);
        const s = ce.singleShopAiReplyConfig[o],
          r =
            (null == s ? void 0 : s.isEnabled) && (null == s ? void 0 : s.aiReplyStrategy)
              ? s.aiReplyStrategy
              : pe.aiReplyConfig.aiReplyStrategy,
          l = new nt(t, i.id.toString(), r, me, i.shopCategory, t.goodId, t.goodInfo, t.content);
        try {
          const s = await St(l);
          if (s) {
            Tt(o, t.messageId, s.sessionId);
            const i = ft(s, o, t);
            let a = null;
            i.imageUrl && "null" != i.imageUrl && (a = { imageUrl: i.imageUrl });
            const r = we(t, i.text, a);
            for (const e of r) ((e.isOpen = i.isOpen ?? "0"), n.push(e));
            if (i.isOpen && "null" != i.isOpen) {
              const t = e.platformType == `${o}_${e.messageId}`;
              ye.set(t, i.isOpen);
            }
          }
        } catch (a) {
          n.push(null);
        }
      }
    } else
      e.isBottomLineAutoReply
        ? ((e.content = de(o, e.messageId)), n.push(e))
        : (e.isReminderReply || e.isAiInviteReply) && n.push(e);
    n.length > 0 &&
      null != n[0] &&
      s.postMessage("main-process-relay", {
        channel: "reply-message",
        shopId: o,
        data: JSON.stringify(n),
      });
  };
s.on("get-customer-callback-result", (e, t) => {
  var s;
  if (t) {
    const { id: e, data: o } = t;
    let i = null;
    o.isBottomLineAutoReply
      ? (i = "get-ai-replied-message")
      : (null == o ? void 0 : o.isAiAutoReply) && (i = "get-ai-replied-message-api");
    const n = Se(e),
      a = ce.shops[n],
      r = null == (s = ce.aiToHumanReplyList) ? void 0 : s[e],
      l = null == r ? void 0 : r.find((e) => e.messageId === o.messageId),
      d = (null == o ? void 0 : o.isAiToHuman) ?? (null == l ? void 0 : l.isAiToHuman) ?? !1,
      u = `${e}_${o.messageId}`,
      c = "1" !== ye.get(u);
    if (i) {
      const t = {
        userId: o.userId,
        messageId: o.messageId,
        username: o.username,
        content: o.content,
        isAiToHuman: d,
        shopSystemId: e,
        shopName: null == a ? void 0 : a.shopName,
        loginUrl: null == a ? void 0 : a.loginUrl,
        platformLogo: null == a ? void 0 : a.platformLogo,
        platformType: null == a ? void 0 : a.platformType,
        shouldShowModal: c,
      };
      (st.postMessage({ type: i, data: t }),
        o.isBottomLineAutoReply ? ue(o, e) : o.isAiAutoReply && yt(o, e, _s, Us),
        null != (null == o ? void 0 : o.shopMsgTotal) && xt.set(e, o.shopMsgTotal),
        je(e, o));
    }
  }
});
const je = (e, t, s = 0) => {
    setTimeout(() => {
      if (
        (Ae.delete(e),
        $e.delete(e),
        Ce.delete(e),
        Ne.delete(e),
        fe.delete(e),
        De.delete(t.messageId),
        Me.delete(t.messageId),
        Le.delete(t.messageId),
        Oe.has(t.messageId))
      ) {
        const e = Oe.get(t.messageId);
        (clearTimeout(e), Oe.delete(t.messageId));
      }
    }, s);
  },
  Ke = new Map(),
  Pe = new Map(),
  Qe = Be(3e3),
  Je = Be(8e3);
function Be(e) {
  const t = new Map();
  return {
    wait: function (s, o) {
      const i = o ?? e;
      return new Promise((e) => {
        const o = setTimeout(() => {
            const o = t.get(s);
            if (o) {
              for (const t of o)
                if (t.resolve === e) {
                  o.delete(t);
                  break;
                }
              (0 === o.size && t.delete(s), e(null));
            }
          }, i),
          n = { resolve: e, timer: o };
        (t.has(s) || t.set(s, new Set()), t.get(s).add(n));
      });
    },
    notify: function (e, s) {
      const o = t.get(e);
      if (o) {
        for (const { resolve: e, timer: t } of o) (clearTimeout(t), e(s));
        t.delete(e);
      }
    },
  };
}
(s.on("get-shop-isuser-status", (e, t) => {
  if (!t) return;
  const { id: s, data: o } = t;
  (Ke.set(s, o), Qe.notify(s, o));
}),
  s.on("get-historical-records", (e, t) => {
    if (!t) return;
    const { data: s } = t;
    (Pe.set(s.messageId, s), Je.notify(s.messageId, s));
  }));
const Fe = Object.defineProperty(
    {
      __proto__: null,
      Fast: Le,
      clearRefMap: function (e) {
        ve.delete(e);
      },
      clearShopQueue: function (e) {
        (ge.delete(e), he.delete(e), fe.delete(e));
      },
      getQueueStatus: function (e) {
        var t;
        return {
          queueLength: (null == (t = ge.get(e)) ? void 0 : t.length) || 0,
          isProcessing: he.has(e),
          isUserOperating: fe.has(e),
        };
      },
      getRefMap: function (e) {
        return ve.get(e);
      },
      getWebviewMessage: ke,
      handleWebviewResponse: function (e, t, s) {
        const o = Ie.get(e);
        if (o && o.length > 0) {
          for (let e = o.length - 1; e >= 0; e--) {
            const i = o[e];
            if (i.channels.includes(t)) {
              clearTimeout(i.timeout);
              try {
                const e = s[0],
                  t = "string" == typeof e ? JSON.parse(e) : e;
                i.resolve(t);
              } catch {
                i.resolve(s[0]);
              }
              o.splice(e, 1);
              break;
            }
          }
          0 === o.length && Ie.delete(e);
        }
      },
      historicalWaiter: Je,
      messageBuffer: Me,
      msgTimeout: Oe,
      newProcessQueue: async (e) => {
        if (V()) return;
        if (!e.content) return;
        const t = ce.shops[Se(e.shopSystemId)];
        if (e.isBottomLineAutoReply || e.isReminderReply || e.isAiInviteReply)
          e.tempSendType = "BT";
        else {
          if (xe.userInfo.aiNumber <= 0 || 1 != t.botStatus) return;
          if (((e.tempSendType = "AI"), Ue.has(t.id))) {
            if (Ue.get(t.id).has(e.content)) return;
          } else Ue.set(t.id, new Set());
        }
        if (Me.has(e.messageId)) return;
        if (Ae.has(e.shopSystemId)) return;
        Ae.set(e.shopSystemId, e);
        Array.from(Ae.keys())
          .filter((e) => !$e.has(e))
          .forEach((e) => $e.add(e));
        const s = await ae(5, $e, async (e) => await _e(e));
        for await (const o of s);
      },
      newProcessQueueF: async (e) => {
        if (V()) return;
        if (!e.content) return;
        const t = ce.shops[Se(e.shopSystemId)];
        if (e.isBottomLineAutoReply || e.isReminderReply || e.isAiInviteReply)
          e.tempSendType = "BT";
        else {
          if (xe.userInfo.aiNumber <= 0 || 1 != t.botStatus) return;
          if (((e.tempSendType = "AI"), Ue.has(t.id))) {
            if (Ue.get(t.id).has(e.content)) return;
          } else Ue.set(t.id, new Set());
        }
        if (Me.has(e.messageId)) return;
        De.set(e.messageId, e);
        Array.from(De.keys())
          .filter((e) => !Le.has(e))
          .forEach((e) => Le.add(e));
        const s = await ae(5, Le, async (e) => await qe(e));
        for await (const o of s);
      },
      noledgeCache: Ue,
      pendingRequests: Ie,
      plainList: $e,
      processQueue: async function (e, t) {
        var s, o, i, n, a;
        if (V()) return;
        if (t.isBottomLineAutoReply || t.isReminderReply || t.isAiInviteReply) {
          let s;
          if (
            ("code" != (null == t ? void 0 : t.type) && (s = he.get(e)),
            s && s.messageId === t.messageId)
          )
            return;
        } else {
          const n = Se(e),
            a = ce.shops;
          if (1 !== (null == (s = a[n]) ? void 0 : s.botStatus)) return;
          if (mt(t.messageId, e)) return;
          if (fe.get(e)) return;
          const r = he.get(e);
          if (r && r.messageId == t.messageId && r.content == t.content) return;
          if (Te(t.content) && "拼多多" === (null == (o = a[n]) ? void 0 : o.platformType))
            try {
              const s = await (async (e, t, s) => {
                const o = await l(s.id);
                if (o) {
                  const t = o.map((e) => `${e.name}=${e.value}`).join("; "),
                    s = await fetch(
                      "https://mms.pinduoduo.com/glide/v2/mms/query/commit/on_shop/detail",
                      {
                        mode: "cors",
                        credentials: "include",
                        method: "POST",
                        headers: { "Content-Type": "application/json", x_cookie: t },
                        body: JSON.stringify({ goods_id: e }),
                      },
                    ).then((e) => e.json());
                  let i = "";
                  if (s.result.skus && s.result.skus.length > 0) {
                    const e = [];
                    (s.result.skus.forEach((t) => {
                      if (t.spec && t.spec.length > 0) {
                        const s = t.spec.map((e) => `${e.parent_name}:${e.spec_name}`).join(",");
                        s && e.push(s);
                      }
                    }),
                      (i = e.join(";")));
                  }
                  const n = await fetch(
                    "https://mms.pinduoduo.com/draco-ms/mms/query-goods-property",
                    {
                      mode: "cors",
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json", x_cookie: t },
                      body: JSON.stringify({ goods_id: e }),
                    },
                  ).then((e) => e.json());
                  if (s.success) {
                    let e = "";
                    return (
                      n.success &&
                        n.result &&
                        n.result.goods_properties &&
                        (e = n.result.goods_properties
                          .map((e) => {
                            if (e.values && e.values.length > 0) {
                              const t = e.values.map((e) => e.value).join(",");
                              return `${e.name}:${t}`;
                            }
                            return "";
                          })
                          .filter((e) => "" !== e)
                          .join(",")),
                      {
                        goodName: s.result.goods_name,
                        goodId: s.result.goods_id,
                        goodImage: s.result.hd_thumb_url,
                        goodDesc: e,
                        goodSku: i,
                      }
                    );
                  }
                  return { goodName: "", goodId: "", goodImage: "", goodDesc: "", goodSku: "" };
                }
              })((null == (i = Te(t.content)) ? void 0 : i.toString()) || "", t.messageId, a[n]);
              if (s) {
                const o = `商品名称：${s.goodName}，商品详情：${s.goodDesc}，商品规格：${s.goodSku}`;
                dt(e, t.messageId, o, s.goodId);
              }
            } catch (c) {}
        }
        if (
          null == (a = null == (n = ce.aiToHumanReplyList) ? void 0 : n[e])
            ? void 0
            : a.some((e) => e.messageId === (null == t ? void 0 : t.messageId))
        )
          return;
        ge.has(e) || ge.set(e, []);
        const r = ge.get(e);
        if (r.some((e) => e.messageId === t.messageId)) return;
        r.push({ shopId: e, ...t });
        const d = [];
        for (const [l, p] of ge) p && p.length > 0 && d.push(l);
        const u = await ae(
          5,
          d,
          async (e) =>
            await (async function (e) {
              const t = ge.get(e);
              if (!t || 0 === t.length) return !1;
              if (fe.has(e))
                return (
                  await ((e = 5) => new Promise((t) => setTimeout(t, 1e3 * e)))(5),
                  fe.delete(e),
                  !1
                );
              if (he.has(e)) return !1;
              const s = t.shift();
              if (!s) return !1;
              const o = await (async function (e, t) {
                return (
                  !!t &&
                  (he.set(e, t),
                  new Promise(async (s) => {
                    var o, i, n;
                    try {
                      const r = t.isBottomLineAutoReply || t.isReminderReply || t.isAiInviteReply,
                        l = ce.shops,
                        d = Se(e);
                      if (!r) {
                        const t = l[d];
                        if (1 !== (null == t ? void 0 : t.botStatus))
                          return (be(e, !1, s), void s(!1));
                      }
                      const u = ve.get(e);
                      if (!u) return (be(e, !1, s), void s(!1));
                      if (!r) {
                        u.send("get-shop-user", t);
                        const o = await ke(e, ["get-shop-isuser-status"], 5e3);
                        if (null == o ? void 0 : o.hasContent)
                          return (
                            fe.set(e, !0),
                            ge.delete(e),
                            he.delete(e),
                            setTimeout(() => fe.delete(e), 1e4),
                            void s(!1)
                          );
                      }
                      let c;
                      if (
                        ((c =
                          r || "code" == t.type
                            ? { ...t, history: [t] }
                            : (await ke(e, ["get-historical-records"], 5e3)) || {
                                ...t,
                                history: [],
                              }),
                        0 === (null == (o = null == c ? void 0 : c.history) ? void 0 : o.length) &&
                          (c = { ...c, history: [t] }),
                        (null == (i = null == c ? void 0 : c.history) ? void 0 : i.length) > 0)
                      ) {
                        c.history = [c.history[c.history.length - 1]];
                        let o = [];
                        const i = l[d];
                        if (r) o = c.history;
                        else {
                          const t = ht(e, c.history);
                          o = ut(e, t);
                        }
                        const p = [];
                        for (const t of o)
                          if (t.isBottomLineAutoReply || t.isReminderReply || t.isAiInviteReply)
                            t.isBottomLineAutoReply
                              ? ((t.content = de(e, t.messageId)), p.push(t))
                              : (t.isReminderReply || t.isAiInviteReply) && p.push(t);
                          else {
                            ct(e, t.messageId, t.content);
                            const s = ce.singleShopAiReplyConfig[e],
                              o =
                                (null == s ? void 0 : s.isEnabled) &&
                                (null == s ? void 0 : s.aiReplyStrategy)
                                  ? s.aiReplyStrategy
                                  : pe.aiReplyConfig.aiReplyStrategy,
                              n = new nt(
                                t,
                                e.toString(),
                                o,
                                me,
                                null == i ? void 0 : i.shopCategory,
                                t.goodId,
                                t.goodInfo,
                                t.content,
                              );
                            try {
                              if (pt(e, t.messageId, t.content)) continue;
                              const s = await St(n);
                              if (s) {
                                Tt(e, t.messageId, s.output.sessionId);
                                const o = ft(s, e, t);
                                let i = null;
                                o.imageUrl &&
                                  "null" != o.imageUrl &&
                                  (i = { imageUrl: o.imageUrl });
                                const n = we(t, o.text, i);
                                for (const e of n) ((e.isOpen = o.isOpen ?? "0"), p.push(e));
                                if (o.isOpen && "null" != o.isOpen) {
                                  const s = `${e}_${t.messageId}`;
                                  ye.set(s, o.isOpen);
                                }
                              }
                            } catch (a) {
                              p.push(null);
                            }
                          }
                        u.send("reply-message", JSON.stringify(p));
                        const m = await ke(
                          e,
                          [
                            "reply-bottom-line-customer-message",
                            "reply-ai-auto-customer-message",
                            "reply-reminder-customer-message",
                            "reply-aiinvite-customer-message",
                          ],
                          2e4,
                        );
                        if (m) {
                          let o = null;
                          m.isBottomLineAutoReply
                            ? (o = "get-ai-replied-message")
                            : (null == m ? void 0 : m.isAiAutoReply) &&
                              (o = "get-ai-replied-message-api");
                          const a = null == (n = ce.aiToHumanReplyList) ? void 0 : n[e],
                            r = null == a ? void 0 : a.find((e) => e.messageId === t.messageId),
                            l =
                              (null == m ? void 0 : m.isAiToHuman) ??
                              (null == r ? void 0 : r.isAiToHuman) ??
                              !1,
                            d = `${e}_${t.messageId}`,
                            u = "1" !== ye.get(d);
                          if ((ge.delete(t.messageId), o)) {
                            const s = {
                              userId: t.userId,
                              messageId: t.messageId,
                              username: t.username,
                              content: m.content,
                              isAiToHuman: l,
                              shopSystemId: e,
                              shopName: null == i ? void 0 : i.shopName,
                              loginUrl: null == i ? void 0 : i.loginUrl,
                              platformLogo: null == i ? void 0 : i.platformLogo,
                              platformType: null == i ? void 0 : i.platformType,
                              shouldShowModal: u,
                            };
                            st.postMessage({ type: o, data: s });
                          }
                          return (ye.delete(d), he.delete(e), oe.start(), void s(!0));
                        }
                        return (be(e, !1, s), void s(!1));
                      }
                    } catch (c) {
                      return (be(e, !1, s), void s(!1));
                    }
                  }))
                );
              })(e, s);
              return (he.delete(e), o);
            })(e),
        );
        for await (const l of u) l && (he.delete(e), fe.delete(e));
      },
      queueList: Ae,
      quicklyList: De,
      setRefMap: Re,
      shopTimeout: Ce,
      shopToDo: Ne,
      unlock: je,
      userHistorical: Pe,
      userOperatingShops: fe,
    },
    Symbol.toStringTag,
    { value: "Module" },
  ),
  { VITE_API_URL: We } = { VITE_API_URL: "http://khai.shihuib.cn/prod-api" },
  Ye = n(),
  ze = i(),
  Ge = j(),
  Ve = new Map(),
  Ze = new Map(),
  Xe = new Map(),
  et = new Map(),
  tt = new Map();
let st,
  ot = null;
function it(e) {
  const t = Ye.singleShopAiReplyConfig[e];
  if (t && t.isEnabled)
    return {
      aiReplyStrategy: t.aiReplyStrategy || "AI_RGA",
      aiHumanReplyType: t.aiHumanReplyType ?? 0,
      subAccount: t.subAccount || "",
      aiSensitiveWords: Array.isArray(t.aiSensitiveWords) ? t.aiSensitiveWords : [],
      aiReplyFlag: t.aiReplyFlag ?? "",
      configSource: "single",
    };
  const s = Ye.shopList.find((t) => t.id === e);
  return {
    aiReplyStrategy: ze.aiReplyConfig.aiReplyStrategy || "AI_RGA",
    aiHumanReplyType: ze.aiReplyConfig.aiHumanReplyType ?? 0,
    subAccount: ze.aiReplyConfig.subAccount || (null == s ? void 0 : s.subAccountInfo) || "",
    aiSensitiveWords: Array.isArray(ze.aiReplyConfig.aiSensitiveWords)
      ? ze.aiReplyConfig.aiSensitiveWords
      : [],
    aiReplyFlag: ze.aiReplyConfig.aiReplyFlag ?? ".",
    configSource: "global",
  };
}
class nt {
  constructor(e, s, o, i, n, a, r, l = "") {
    var d;
    (t(this, "sessionId"),
      t(this, "vectorParam"),
      t(this, "messages"),
      t(this, "message"),
      t(this, "shopId"),
      t(this, "aitype"),
      t(this, "goodId"),
      t(this, "goodInfo"),
      t(this, "appUrl"),
      t(this, "shopCategory"),
      t(this, "orderStatus"),
      t(this, "checkUser"),
      t(this, "checkUserId"));
    const u = We,
      c = `${s}_${e.messageId}`;
    ((this.sessionId = (null == (d = i.conversationMap[c]) ? void 0 : d.sessionId) || ""),
      (this.vectorParam = ""),
      (this.messages = []),
      (this.message = l || ""),
      (this.shopId = s.toString()),
      (this.aitype = o),
      (this.goodId = a || ""),
      (this.goodInfo = r || ""),
      (this.appUrl = u + "/milvus/queryVector"),
      (this.shopCategory = n),
      (this.orderStatus = e.orderStatus || "暂无订单"),
      (this.checkUser = e.username),
      (this.checkUserId = e.messageId),
      l && this.addMessage(l));
  }
  addMessage(e) {
    this.messages.push({ role: "user", content: e });
  }
}
function at(e, t) {
  return `${e}_${t}`;
}
function rt(e, t) {
  const s = at(e, t),
    o = Ve.get(s);
  return o ? o.orderStatus || "暂无订单" : null;
}
function lt(e, t) {
  const s = at(e, t),
    o = Ze.get(s);
  return o || null;
}
function dt(e, t, s, o) {
  const i = at(e, t);
  Ze.set(i, { goodid: o, goodInfo: s, time: Date.now() });
}
function ut(e, t) {
  if (t.length > 0) {
    const s = t[0];
    if (null == s ? void 0 : s.orderStatus) {
      const o = rt(e, s.messageId);
      o && "暂无订单" === (null == s ? void 0 : s.orderStatus)
        ? (t = t.map((e) => ({ ...e, orderStatus: o })))
        : (function (e, t, s) {
            const o = at(e, t);
            Ve.set(o, { orderStatus: s, time: Date.now() });
          })(e, s.messageId, null == s ? void 0 : s.orderStatus);
    } else {
      const o = rt(e, s.messageId);
      o && (t = t.map((e) => ({ ...e, orderStatus: o })));
    }
    if (!(null == s ? void 0 : s.goodInfo)) {
      const o = lt(e, s.messageId);
      o && (t = t.map((e) => ({ ...e, goodInfo: o.goodInfo, goodId: o.goodid })));
    }
    return t;
  }
  return [];
}
function ct(e, t, s) {
  const o = `${e}_${t}`;
  Xe.set(o, { content: s, time: Date.now() });
}
function pt(e, t, s) {
  const o = et.get(`${e}:${t}`);
  return !!o && o.some((e) => e.query === s);
}
function mt(e, t) {
  var s;
  return null == (s = Ye.aiToHumanReplyList[t])
    ? void 0
    : s.some((t) => t.messageId === e && t.isAiToHuman);
}
function gt(e, t) {
  var o;
  Ye.aiToHumanReplyList[t] || (Ye.aiToHumanReplyList[t] = []);
  const i = Ye.aiToHumanReplyList[t].findIndex((t) => t.messageId === e.messageId);
  let n;
  -1 === i
    ? (Ye.aiToHumanReplyList[t].push({ messageId: e.messageId, isAiToHuman: !0 }), (n = !0))
    : ((Ye.aiToHumanReplyList[t][i].isAiToHuman = !Ye.aiToHumanReplyList[t][i].isAiToHuman),
      (n = Ye.aiToHumanReplyList[t][i].isAiToHuman));
  const a = Ye.singleShopAiReplyConfig[t];
  let l, d, u;
  a && a.isEnabled
    ? ((l = a.aiHumanReplyType), (d = a.subAccount), (u = "单店配置"))
    : ((l = ze.aiReplyConfig.aiHumanReplyType),
      (d =
        ze.aiReplyConfig.subAccount ||
        (null == (o = Ye.shopList.find((e) => e.id === t)) ? void 0 : o.subAccountInfo) ||
        ""),
      (u = "全局配置"));
  new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: !1,
  });
  (0 === l
    ? s.send("set-ai-reply", { messageId: e.messageId, shopId: t, isAiToHuman: n })
    : 1 === l
      ? s.send("send-to-webcontents-view", {
          shopId: t,
          channel: "goto-human-reply",
          data: { type: 1, subAccount: d },
        })
      : 2 === l && s.send("send-to-webcontents-view", { shopId: t, channel: "star", data: {} }),
    s.send("set-ai-to-human-reply-message", r.deepClone(Ye.aiToHumanReplyList)));
}
function ht(e, t) {
  let s = [];
  return (
    (s = (function (e, t) {
      const s = t.filter(
          (e) => e.content.includes("用户发送了图片") || e.content.includes("用户发送了视频"),
        ),
        o = it(e);
      return s.length > 0 && "AI_RGA_FILTER" === o.aiReplyStrategy
        ? (gt({ messageId: s[0].messageId }, e), (s[0].isAiToHuman = !0), [s[0]])
        : [];
    })(e, t)),
    s.length > 0
      ? s
      : ((s = (function (e, t) {
          const s = it(e).aiSensitiveWords;
          return s && 0 !== s.length
            ? (t.forEach((t) => {
                if (s.some((e) => t.content.includes(e)))
                  return (gt({ messageId: t.messageId }, e), (t.isAiToHuman = !0), [t]);
              }),
              [])
            : [];
        })(e, t)),
        s.length > 0 ? s : t)
  );
}
function ft(e, t, s) {
  let o;
  try {
    const i = e.output.text;
    if ("string" == typeof i) {
      const e = JSON.parse(i);
      if (e.output && "string" == typeof e.output)
        try {
          o = JSON.parse(e.output);
        } catch (a) {
          o = {
            output: e.output,
            isAdd: e.isAdd || 0,
            aiText: e.aiText || "",
            floatArray: e.floatArray || [],
            imageUrl: e.imageUrl,
            isOpen: e.isOpen,
          };
        }
      else o = e;
    } else o = e.output;
    if (1 == o.isAdd)
      try {
        Ye.shopList[Ye.shopList.findIndex((e) => e.id === t)].hasAiQuestion = !0;
        if ("AI_RGA_FILTER" === it(t).aiReplyStrategy) {
          if (Ue.has(t)) {
            (Ue.get(t).add(s.content), je(t, s, 1e3));
          }
          if ("" !== o.output)
            return { text: "", imageUrl: void 0, isOpen: void 0, shouldTransferToHuman: !0 };
        }
      } catch (r) {}
  } catch (l) {
    o = { output: e.output.text || ".亲亲，请问有什么可以帮助您的？", isAdd: 0 };
  }
  let i = o.output ? o.output : "";
  (i.includes("运费险") && (i = i.replace("运费险", " 运费 险")),
    (i.includes("qq") || i.includes("QQ")) &&
      ((i = i.replace("qq", "")), (i = i.replace("QQ", ""))),
    i.includes("好评返现") && (i = i.replace("好评返现", "")));
  const n = it(t).aiReplyFlag || ze.aiReplyConfig.aiReplyFlag || ".";
  return {
    text: i ? n + i : "",
    imageUrl: o.imageUrl,
    isOpen: o.isOpen,
    shouldTransferToHuman: !1,
  };
}
function yt(e, t, o, i) {
  var n, a, r, l;
  if (V()) return;
  if (e.isReminderReply || e.isAiInviteReply) return;
  const d = i.value.find((s) => s.messageId === e.messageId && s.shopSystemId === t);
  o({ messageId: e.messageId, shopSystemId: t, userId: e.userId });
  const u = mt(e.messageId, t),
    c = Ye.shops;
  s.send("get-ai-replied-message-api", {
    messageId: e.messageId,
    username: null == d ? void 0 : d.username,
    content: e.content,
    shopSystemId: t,
    shopName: null == (n = c[vt(t)]) ? void 0 : n.shopName,
    loginUrl: null == (a = c[vt(t)]) ? void 0 : a.loginUrl,
    platformLogo: null == (r = c[vt(t)]) ? void 0 : r.platformLogo,
    platformType: null == (l = c[vt(t)]) ? void 0 : l.platformType,
    isAiToHuman: u,
  });
}
function vt(e) {
  return Ye.shops.findIndex((t) => t.id === e);
}
function It() {
  (null !== ot && clearInterval(ot),
    (ot = setInterval(() => {
      const e = O();
      Object.keys(Ge.conversationMap).forEach((t) => {
        const s = Ge.conversationMap[t];
        if (s && s.modifyTime) {
          const o = O(s.modifyTime);
          e.diff(o, "minute") > 15 && delete Ge.conversationMap[t];
        }
      });
      for (const [t, s] of tt.entries()) e.diff(O(s.time), "minute") > 5 && tt.delete(t);
      (Ve.forEach((t, s) => {
        e.diff(O(t.time), "minute") > 15 && Ve.delete(s);
      }),
        et.forEach((t, s) => {
          t.forEach((t) => {
            e.diff(O(t.time), "minute") > 15 && et.delete(s);
          });
        }),
        Xe.forEach((t, s) => {
          e.diff(O(t.time), "minute") > 15 && Xe.delete(s);
        }));
    }, 3e5)));
}
async function St(e) {
  return await U(e);
}
function Tt(e, t, s) {
  const o = `${e}_${t}`;
  Ge.conversationMap[o] = { sessionId: s, modifyTime: O().format("YYYY-MM-DD HH:mm:ss") };
}
const wt = new Map();
let Rt = null,
  kt = !1;
const bt = n(),
  At = i(),
  { shops: Dt } = $(bt),
  Nt = o(),
  Mt = new Map();
let Lt = null;
const $t = C(!1),
  Ct = new Map(),
  Ot = Math.floor(60 * Math.random() * 60 * 1e3) + 36e5,
  Ut = [],
  xt = M(new Map()),
  _t = (e, t) => {
    (s.on(e, t), Ut.push({ channel: e, handler: t }));
  },
  qt = () => {
    Ut.length &&
      (Ut.forEach(({ channel: e, handler: t }) => {
        s.removeListener(e, t);
      }),
      (Ut.length = 0));
  };
"undefined" != typeof window && window.addEventListener("beforeunload", () => qt());
class Et {
  constructor(e) {
    (t(this, "shopId"), (this.shopId = e));
  }
  send(e, t) {
    s.send("send-to-webcontents-view", { shopId: this.shopId, channel: e, data: t });
  }
  getWebContentsId() {
    return this.shopId;
  }
  reload() {
    s.send("reload-webcontents-view", { shopId: this.shopId });
  }
  setAttribute(e, t) {
    "src" === e && s.send("load-url-webcontents-view", { shopId: this.shopId, url: t });
  }
}
const Ht = new Map();
function jt(e) {
  return (Ht.has(e) || Ht.set(e, new Et(e)), Ht.get(e));
}
_t("shop-webview-message", (e, t) => {
  const { shopId: s, channel: o, args: i } = t,
    n = Ie.get(s);
  if (n && n.length > 0) {
    for (let e = n.length - 1; e >= 0; e--) {
      const t = n[e];
      if (t.channels.includes(o)) {
        clearTimeout(t.timeout);
        try {
          const e = i[0],
            s = "string" == typeof e ? JSON.parse(e) : e;
          t.resolve(s);
        } catch {
          t.resolve(i[0]);
        }
        n.splice(e, 1);
        break;
      }
    }
    0 === n.length && Ie.delete(s);
  }
  Jt({ channel: o, args: i }, s, jt(s));
});
(Lt && clearInterval(Lt),
  (Lt = setInterval(() => {
    const e = new Set(Dt.value.map((e) => e.id)),
      t = Array.from(Mt.entries())
        .filter(([t]) => e.has(t))
        .map(([, { param: e }]) => e);
    for (const s of Mt.keys()) e.has(s) || Mt.delete(s);
    t.length > 0 &&
      w(t).then(() => {
        Mt.clear();
      });
  }, 18e4)),
  It(),
  oe.init(),
  _t("set-bottom-line-reply-status", (e, t) => {
    $t.value = t;
  }),
  _t("change-pdd-show-robot-reply", (e, t) => {
    At.settings.PDDShowRobotReply = t;
    bt.shopList
      .filter((e) => "拼多多" === e.platformType)
      .map((e) => e.id)
      .forEach((e) => {
        jt(e).send("change-pdd-show-robot-reply", At.settings.PDDShowRobotReply);
      });
  }),
  _t("set-reminder-reply-config", (e, t) => {
    ((At.reminderReply.status = t.status),
      (At.reminderReply.time = t.time),
      (At.reminderReply.content = t.content),
      t.status ? oe.start() : oe.stop());
  }),
  _t("set-aiauto-review-config", (e, t) => {
    ((At.aiAutoReview.status = t.status),
      (At.aiAutoReview.time = t.time),
      (At.aiAutoReview.content = t.content),
      t.status ? oe.start() : oe.stop());
  }),
  _t("shop-status-mismatch", (e, t) => {
    bt.setShopStatus({ id: t.shopId, status: t.remoteStatus });
  }));
const Kt = {
  checkTimerId: null,
  debugMode: !1,
  stats: { checkCount: 0, uploadSuccess: 0, uploadFailed: 0 },
  getCurrentTimestamp: () => Math.floor(Date.now() / 1e3),
  isCookieExpiringSoon(e, t = 30) {
    if (!e.expirationDate) return !1;
    const s = this.getCurrentTimestamp() + 60 * t;
    return e.expirationDate < s;
  },
  init() {
    this.setupCookieChecker();
  },
  setupCookieChecker() {
    null !== this.checkTimerId && clearInterval(this.checkTimerId);
    this.checkTimerId = setInterval(() => {
      (this.stats.checkCount++, this.checkAllShopsCookies());
    }, 27e5);
  },
  async checkAllShopsCookies() {
    for (const e of Dt.value) e.loginStatus && (await this.checkShopCookies(e.id));
  },
  async checkShopCookies(e) {
    try {
      const o = Ft(e);
      if (-1 === o) return (this.log(`未找到ID为 ${e} 的店铺`, "error"), !1);
      const i = Dt.value[o];
      this.log(`检查店铺 ${i.shopName} (ID: ${e}) 的 Cookie`);
      const n = await s.invoke("get-webview-cookie", e, i.platformType);
      if (n) {
        R(e, n);
        try {
          (await d({ id: e, loginToken: JSON.stringify(n) }), this.stats.uploadSuccess++);
        } catch (t) {
          (this.stats.uploadFailed++,
            this.log(`店铺 ${i.shopName} Cookie 上传失败: ${t}`, "error"));
        }
        return !0;
      }
    } catch (o) {
      return (this.log(`检测店铺 ${e} 的 Cookie 时出错: ${o}`, "error"), !1);
    }
  },
  log(e, t = "info") {
    this.debugMode;
  },
};
(It(), Kt.init());
const Pt = new Map(),
  Qt = new Map();
function Jt(e, t, s) {
  switch (e.channel) {
    case "get-shop-pwd":
      const o = Ft(t),
        i = Dt.value[o];
      s.send("get-shop-pwd", {
        password: i.password || "",
        userName: i.subAccount || "",
        customerName: i.customerName || "",
      });
      break;
    case "cookie-expired":
      zt(t);
      break;
    case "reply-bottom-line-customer-message":
      Zt(e.args[0], t);
      break;
    case "reply-ai-auto-customer-message":
      Xt(e.args[0], t);
      break;
    case "get-quality-testing":
      es(e.args[0], t);
      break;
    case "http-request":
      ts(e.args[0], t);
      break;
    case "get-todo-list":
      os(e.args[0], t);
      break;
    case "set-customer-performance-info":
      ls(e.args[0], t);
      break;
    case "set-experience-score-info":
      ds(e.args[0], t);
      break;
    case "getShopExperienceScore":
      us(e.args[0], t);
      break;
    case "get-goods-detail":
      cs(e.args[0], t);
      break;
    case "set-ai-to-human-reply-customer":
      gt(e.args[0], t);
      break;
    case "init-goods":
      ps(e.args[0], t);
      break;
    case "loginInfo":
      Wt(e.args[0], t);
      break;
    case "shop-login-success":
      Yt(t);
      break;
    case "heartbeat":
      break;
    case "init-shop-info":
      ms(e.args[0], t);
      break;
    case "init-shop-set":
      gs(s);
      break;
    case "window-title":
      ys(t);
      break;
    case "request-shop-bot-status":
      vs(t, s);
      break;
    case "change-pdd-statu-online":
      Is(e.args[0]);
      break;
    case "update-customer-message-order":
      Gt(e.args[0], t);
      break;
    case "upload-server-log":
      Bt(e.args[0], t);
      break;
    case "update-customer-message-goodInfo":
      Vt(e.args[0], t);
      break;
    case "get-after-sale-total-order-result":
      Ts(e.args[0], t);
      break;
    case "refresh-shop":
      ws(e.args[0], t);
      break;
    case "web-scoker-error-callback":
      ks(e.args[0], t);
      break;
    case "get-message-total":
      As(t, e.args[0]);
  }
}
const Bt = (e, t) => {
    ((e.shopId = t), r.uploadServerLog(e));
  },
  Ft = (e) => Dt.value.findIndex((t) => t.id === e),
  Wt = (e, t) => {
    var s, o;
    const i = Ft(t);
    -1 === i ||
      ("" === e.username && "" === e.password) ||
      "null" === e.username ||
      "null" === e.password ||
      ((Dt.value[i].subAccount = e.username),
      (Dt.value[i].password = e.password),
      "main" !==
        (null == (o = null == (s = Nt.userInfo) ? void 0 : s.roles[0]) ? void 0 : o.roleKey) &&
        m({ id: t, subAccount: e.username, password: e.password }));
  },
  Yt = async (e) => {
    const t = Ft(e);
    if (-1 === t) return;
    const o = Dt.value[t];
    ((o.loginStatus = !0),
      (o.loginExpiredWarning = !1),
      (o.hasReloadedAfterCookie = !1),
      (o.cookieRetryCount = 0),
      (o.hasInitializedCookie = !0),
      W.handleShopLoginCatchUp(e));
    const i = await s.invoke("get-webview-cookie", e, o.platformType),
      n = Array.from(new Map(i.map((e) => [e.name, e])).values());
    d({ id: e, loginToken: JSON.stringify(n) });
  },
  zt = (e) => {
    s.invoke("clear-webview-cookie", e);
  },
  Gt = async (e, t) => {
    xs({ ...e, shopSystemId: t });
  },
  Vt = async (e, t) => {
    if (!lt(t, e.messageId) && e) {
      const s = `商品名称：${e.goodName}，商品id：${e.goodId}，商品详情：${e.goodDesc}`;
      dt(t, e.messageId, s || "无 ", e.goodId);
    }
  },
  Zt = (e, t) => {
    ue(e, t);
  },
  Xt = (e, t) => {
    yt(e, t, _s, Us);
  };
_t("PDDgetSku", async (e, t) => {
  const { shopId: s, messageid: o, goodName: i, goodid: n, goods_spec: a } = t,
    r = `${s}_${o}`;
  let l = Qt.get(r),
    d = 0;
  for (; !l && d < 10; ) (await new Promise((e) => setTimeout(e, 1e3)), (l = Qt.get(r)), d++);
  if (!l) return;
  const { message: u } = l;
  await Ss(n, s);
  Qt.delete(r);
});
const es = (e, t) => {
    const s = O().format("YYYY-MM-DD");
    localStorage.getItem("shopConsultationLastResetDate") !== s &&
      (Pt.clear(), localStorage.setItem("shopConsultationLastResetDate", s));
    const o = Ft(t);
    switch (
      (("抖店" !== Dt.value[o].platformType && "拼多多" !== Dt.value[o].platformType) ||
        (bt.shopActiveList[t] = Date.now()),
      Dt.value[o].platformType)
    ) {
      case "拼多多":
        const t = e.responseRateWithinThreeMin.replace("%", "");
        Number(t) < 98 ? (Dt.value[o].isStandard = !1) : (Dt.value[o].isStandard = !0);
        break;
      case "抖店":
        if (e.averageRate.includes("分")) {
          const t = e.averageRate.split("分"),
            s = 60 * Number(t[0]) + Number(t[1] ? t[1].replace("秒", "") : 0);
          Dt.value[o].isStandard = !(s > 25);
        } else {
          const t = Number(e.averageRate.replace("秒", ""));
          Dt.value[o].isStandard = !(t > 25);
        }
        break;
      case "快手":
        Number(e.averageRate) > 30 ? (Dt.value[o].isStandard = !1) : (Dt.value[o].isStandard = !0);
    }
    let i = e.inquiryCount;
    "string" == typeof i && i.endsWith("人") && (i = i.slice(0, -1));
    const n = Number(i);
    if (
      (isNaN(n) || Pt.set(t, n),
      (At.todayTotalConsultation = Array.from(Pt.values()).reduce((e, t) => e + t, 0)),
      "server" === At.loginType)
    ) {
      const s = {
        shopId: t,
        inquiryCount: rs(e.inquiryCount),
        responseRateWithinThreeMin: ns(e.responseRateWithinThreeMin) || "0",
        averageRate: as(e.averageRate) || "0",
        dissatisfiedRate: ns(e.dissatisfiedRate) || "0",
        recoverRate: ns(e.recoverRate) || "0",
      };
      Mt.set(t, { param: s, updatedAt: Date.now() });
    }
  },
  ts = (e, t) => {},
  ss = (e, t) => {
    s.send("show-notification", {
      notificationId: Date.now(),
      type: t,
      title: "提示",
      content: e,
      meta: O().format("YYYY-MM-DD HH:mm:ss"),
      duration: 5e3,
    });
  },
  os = (e, t) => {
    const o = Ft(t);
    if (-1 === o) return;
    const i = {
      shopSystemId: t,
      shopName: Dt.value[o].shopName,
      loginUrl: Dt.value[o].loginUrl,
      platformLogo: Dt.value[o].platformLogo,
      platformType: Dt.value[o].platformType,
      list: e,
    };
    if ((s.postMessage("get-todo-list", i), "1" === Dt.value[o].handleWorkbench)) {
      (Ds({ shopSystemId: t, list: i.list }), Ms());
    }
  },
  is = (e) => {
    if (null == e) return !0;
    const t = String(e).trim().toLowerCase();
    return !t || ["null", "undefined", "nan"].some((e) => t.includes(e));
  },
  ns = (e) => {
    if (is(e)) return "";
    const t = String(e).trim(),
      s = t.includes("%"),
      o = t.replace(/%/g, "");
    if (!o) return "";
    const i = Number(o);
    if (!Number.isFinite(i)) return "";
    const n = s || i > 1 ? i : 100 * i;
    return Number.isFinite(n) ? String(Number(n.toFixed(2))) : "";
  },
  as = (e) => {
    if (is(e)) return "";
    const t = String(e).replace(/\s+/g, "");
    if (!t) return "";
    if (/^\d+(?:\.\d+)?$/.test(t)) {
      const e = Number(t);
      return Number.isFinite(e) ? String(e) : "";
    }
    const s = t.match(/(\d+(?:\.\d+)?)\s*(?:小时|时)/),
      o = t.match(/(\d+(?:\.\d+)?)\s*(?:分钟|分)/),
      i = t.match(/(\d+(?:\.\d+)?)\s*秒/);
    if (!s && !o && !i) return "";
    const n = s ? Number(s[1]) : 0,
      a = o ? Number(o[1]) : 0,
      r = i ? Number(i[1]) : 0;
    return [n, a, r].every(Number.isFinite) ? String(3600 * n + 60 * a + r) : "";
  },
  rs = (e) => {
    if (is(e)) return "0";
    const t = String(e).replace(/[^\d.-]/g, "");
    if (!t) return "0";
    const s = Number(t);
    return Number.isFinite(s) && s >= 0 ? String(s) : "0";
  },
  ls = (e, t) => {
    if (
      (r.log.info(`店铺${Dt.value[Ft(t)].shopName}客服绩效数据,数据yuan:${JSON.stringify(e)}`),
      e.length > 0)
    ) {
      const s = e[0] || {};
      if ("1" === s.type) {
        const e = {
          shopId: s.shopId || t,
          volume: s.volume || "",
          minuteResp: ns(s.minuteResp),
          averageResp: as(s.averageResp),
          satisfactionRate: ns(s.satisfactionRate),
          conversionRate: ns(s.conversionRate),
          month: s.month || "",
          updateStatus: "2",
        };
        ((null == s ? void 0 : s.id) && (e.id = s.id),
          f(e),
          s.fromWebSocket || W.markTaskSuccess(t, "performance"));
      } else {
        const e = {
          id: s.id,
          volume: s.volume || "",
          threeMinRespRate: ns(s.threeMinRespRate),
          thirtySecondRespRate2: ns(s.thirtySecondRespRate2),
          firstResp: as(s.firstResp),
          averageResp: as(s.averageResp),
          satisfaction: ns(s.satisfaction),
          conversionRate: ns(s.conversionRate),
          updateStatus: "2",
        };
        (y(e), (At.thismessageQueue = At.thismessageQueue.filter((e) => e.id !== s.id)));
      }
    }
  },
  ds = async (e, t) => {
    var s, o, i, n, a, r;
    if (!e) return;
    const l = Ft(t),
      d = null == (s = Dt.value[l]) ? void 0 : s.platformType;
    if ("拼多多" === d)
      await h({
        shopId: t,
        param: e.cstmrServScore ?? 0,
        param1: e.attiLmScore ?? 0,
        param2: e.jcfwLmScore ?? 0,
        param3: e.fhLmScore ?? 0,
        param4: e.spLmScore ?? 0,
        param5: e.wlLmScore ?? 0,
        paramjson: JSON.stringify(e),
      });
    else {
      if ("抖店" !== d) return;
      {
        const s = Number((null == (o = e.totalScore) ? void 0 : o.score) ?? 0),
          l = Number((null == (i = e.productScore) ? void 0 : i.score) ?? 0),
          d = Number((null == (n = e.logisticsScore) ? void 0 : n.score) ?? 0),
          u = Number((null == (a = e.serviceScore) ? void 0 : a.score) ?? 0),
          c = Number((null == (r = e.badBehaviorScore) ? void 0 : r.score) ?? 0);
        await h({
          shopId: t,
          param: String(s),
          param1: l,
          param2: d,
          param3: u,
          param4: c,
          paramjson: JSON.stringify(e),
        });
      }
    }
    W.markTaskSuccess(t, "experience");
  },
  us = (e, t) => {
    if (e) {
      const s = Ft(t),
        o = {
          shopId: t,
          consumerDivide: "",
          serviceDivide: "",
          foundationDivide: "",
          deliveryDivide: "",
          goodDivide: "",
          logisticsDivide: "",
          updateStatus: 2,
        };
      ("拼多多" === Dt.value[s].platformType
        ? ((o.consumerDivide = e.cstmrServScore),
          (o.serviceDivide = e.attiLmScore),
          (o.foundationDivide = e.jcfwLmScore),
          (o.deliveryDivide = e.fhLmScore),
          (o.goodDivide = e.spLmScore),
          (o.logisticsDivide = e.wlLmScore))
        : ((o.consumerDivide = e.consumerDivide < 0 ? "0" : e.consumerDivide),
          (o.serviceDivide = e.serviceDivide < 0 ? "0" : e.serviceDivide),
          (o.foundationDivide = e.foundationDivide < 0 ? "0" : e.foundationDivide),
          (o.deliveryDivide = e.deliveryDivide < 0 ? "0" : e.deliveryDivide),
          (o.goodDivide = e.goodDivide < 0 ? "0" : e.goodDivide),
          (o.logisticsDivide = e.logisticsDivide < 0 ? "0" : e.logisticsDivide)),
        g(o),
        W.markTaskSuccess(t, "experience"));
    }
  },
  cs = async (e, t) => {
    const s = Nt.userInfo.userId,
      o = [],
      i = e[0].aiTaskId || "",
      n = e[0].type;
    for (const r of e) {
      if (!(null == r ? void 0 : r.goodName))
        return void (await _({
          id: i,
          status: 2,
          failureReason: `没有找到商品id为${r.goodId}的商品`,
        }));
      const e = `商品名称:${r.goodName}商品ID:${r.goodId}商品类目:${r.goodCat}商品属性:${r.goodProperties}商品SKU:${r.goodSku}`,
        { aiTaskId: i, type: n, ...a } = r || {},
        l = {
          shopId: t,
          userId: Number(s),
          goodName: r.goodName,
          goodUrl: r.mainImage,
          goodId: r.goodId,
          content: JSON.stringify({ text: e, pathlist: r.detailImages }),
          rawdata: JSON.stringify(a),
        };
      o.push(l);
    }
    if (o.length > 0)
      if (1 === n)
        try {
          1 === (await x(o)) && i && (await _({ id: i, status: 1, failureReason: "" }));
        } catch (a) {
          await _({ id: i, status: 2, failureReason: a.message });
        }
      else {
        for (const e of o) {
          const s = { goodId: e.goodId, content: e.content };
          try {
            await q(s);
            const o = {
              pathlist: (null == e ? void 0 : e.detailImages) || e.urls,
              text: e.goodsDetail + ",根据图片对前面商品描述做一个补充",
              shopId: t,
              goodName: e.goodName,
              goodId: e.goodId,
            };
            await E(o);
          } catch (a) {
            return void (await _({ id: i, status: 2, failureReason: a.message }));
          }
        }
        await _({ id: i, status: 1, failureReason: "" });
      }
  },
  ps = (e, t) => {
    const s = Ft(t),
      o = Nt.userInfo.userId,
      i = e.map((e) => ({
        shopId: t,
        userId: Number(o),
        goodName: e.name,
        goodUrl: e.url,
        goodId: e.id,
      }));
    x(i).then((e) => {
      1 === e && (Dt.value[s].isAigood = 1);
    });
  },
  ms = (e, t) => {
    if (!e.shopClass && !e.goodName) return;
    const s = `店铺名称：${Dt.value[Ft(t)].shopName}，店铺的主营类目是${e.shopClass}`;
    (p({ id: t, aiShopinfo: s }), (Dt.value[Ft(t)].aiShopinfo = s));
  },
  gs = (e) => {
    hs(e, "change-pdd-statu-online", At.settings.PDDStatuOnline);
  },
  hs = (e, t, s) => {
    if (
      !((e) => {
        try {
          if (!e) return !1;
          const t = e,
            s = "function" == typeof t.send,
            o = "function" != typeof t.getWebContentsId || !!t.getWebContentsId();
          return s && o;
        } catch {
          return !1;
        }
      })(e)
    )
      return !1;
    try {
      return (e.send(t, s), !0);
    } catch (o) {
      return !1;
    }
  },
  fs = async (e, t, o) => {
    (await s.invoke("clear-webview-storage", t),
      await D(t),
      (e.cookies = []),
      (e.loginStatus = !1),
      s.send("show-ImportantNotice-view", {
        id: null == e ? void 0 : e.id,
        notificationId: Date.now(),
        type: "error",
        title: "提示",
        content: `${e.platformType}店铺登录失败：${o}`,
        meta: O().format("YYYY-MM-DD HH:mm:ss"),
      }));
  },
  ys = (e) => {
    const t = Ft(e);
    t && (Dt.value[t].isPageLoadingCompleted = !0);
  },
  vs = (e, t) => {
    try {
      const s = Ft(e);
      if (-1 === s) return;
      const o = { shopSystemId: e, botStatus: Dt.value[s].botStatus };
      (hs(t, "update-shop-bot-status", o),
        "拼多多" === Dt.value[s].platformType &&
          hs(t, "change-pdd-show-robot-reply", At.settings.PDDShowRobotReply));
    } catch (s) {}
  },
  Is = (e) => {
    At.settings.PDDStatuOnline = e;
  },
  Ss = async (e, t) => {
    const s = Ft(t),
      o = Dt.value[s].cookies.map((e) => `${e.name}=${e.value}`).join("; "),
      i = await fetch("https://mms.pinduoduo.com/draco-ms/mms/query-goods-property", {
        mode: "cors",
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", x_cookie: o },
        body: JSON.stringify({ goods_id: e }),
      }).then((e) => e.json());
    let n = "";
    if (i.success && i.result && i.result.goods_properties) {
      n = i.result.goods_properties
        .map((e) => {
          if (e.values && e.values.length > 0) {
            const t = e.values.map((e) => e.value).join(",");
            return `${e.name}:${t}`;
          }
          return "";
        })
        .filter((e) => "" !== e)
        .join(",");
    }
    return n;
  };
_t("get-pdd-goods", async (e, t) => {
  const s = await Ss(t.goodId, t.shopId),
    o = `商品名称：${t.goodName}，商品id：${t.goodd}，商品详情：${s}`;
  dt(t.shopId, t.uid, o, t.goodId);
});
const Ts = async (e, t) => {
    if (e.fromDailyTask)
      try {
        (await u({
          shopId: t,
          realCount: e.realCount,
          applyCount: e.applyCount,
          refundOnlyCount: e.refundOnlyCount,
          workOrderCount: e.workOrderCount,
          summaryDate: F(),
        }),
          W.markTaskSuccess(t, "afterSale"));
      } catch (s) {}
    else if (e.id)
      try {
        (await c({ ...e, shopId: t, id: e.id, updateStatus: "2" }),
          W.markTaskSuccess(t, "afterSale"),
          (At.thismessageQueue = At.thismessageQueue.filter((t) => t.id != e.id)));
      } catch (s) {}
  },
  ws = async (e, t) => {
    const o = Ft(t),
      i = Dt.value[o];
    (await s.invoke("remove-webview-cookie", {
      id: t,
      cookie: r.deepClone(i.cookies),
      domainUrl: i.domainUrl,
    }),
      d({ id: t, loginToken: "" }),
      s.send("show-notification", {
        notificationId: Date.now(),
        type: "error",
        title: "提示",
        content: `${i.platformType}：${i.shopName}与登录账号${e}不一致，已为您重新返回登录页面`,
        meta: O().format("YYYY-MM-DD HH:mm:ss"),
      }));
  },
  Rs = {
    "shop-status-change": (e, t) => {
      const {
          id: o,
          data: { status: i },
        } = t,
        n = Ft(o);
      if (-1 === n) return;
      const { shopName: a, platformType: l } = Dt.value[n];
      if (
        (bt.setShopStatus({ id: o, status: i }),
        r.log.info(`店铺${a}被设置成${i}`),
        r.uploadServerLog({
          bugType: "info",
          shopId: o.toString(),
          bugContent: `店铺${a}被设置成${i}`,
        }),
        !["接线", "在线", "离线"].includes(i))
      )
        if (
          ("拼多多" === l && At.settings.PDDStatuOnline) ||
          ("抖店" === l && At.settings.doudianStatuOnline)
        )
          s.send("send-to-webcontents-view", {
            shopId: o,
            channel: "change-shop-status",
            data: "online",
          });
        else {
          ss(`${l}店铺：${a}被设置为 ${i} 状态，请手动设置店铺为在线状态！`, "error");
        }
    },
    "get-shop-info": async (e, t) => {
      var o, i, n, a, d, u, c, p, m, g, h, f, y, v;
      const { id: I, data: S } = t,
        T = Ft(I);
      if (-1 === T) return;
      const w = Dt.value[T];
      if (
        (Ct.set(I, Date.now() + Ot),
        (null == (o = S.name) ? void 0 : o.trim()) !==
          (null == (i = w.shopName) ? void 0 : i.trim()) &&
          "zikf" ===
            (null == (a = null == (n = Nt.userInfo) ? void 0 : n.roles[0]) ? void 0 : a.roleKey))
      )
        return (
          s.send("show-ImportantNotice-view", {
            id: null == w ? void 0 : w.id,
            notificationId: Date.now(),
            type: "error",
            title: "提示",
            content: `${w.platformType}店铺登录失败：当前登录的店铺名称：${S.name}与系统录入的店铺名称：${w.shopName}不一致`,
            meta: "请检查店铺信息是否正确，如有问题请联系运维",
          }),
          void s.invoke("clear-webview-cookie", I)
        );
      if (
        (null == (d = S.username) ? void 0 : d.trim()) !=
          (null == (u = Dt.value[T].customerName) ? void 0 : u.trim()) &&
        "zikf" ===
          (null == (p = null == (c = Nt.userInfo) ? void 0 : c.roles[0]) ? void 0 : p.roleKey)
      )
        return (
          s.send("show-ImportantNotice-view", {
            id: null == w ? void 0 : w.id,
            notificationId: Date.now(),
            type: "error",
            content: `${w.platformType}店铺登录失败：当前登录的客服昵称：${S.username}与系统录入的客服昵称：${Dt.value[T].customerName}不一致`,
            meta: "请检查店铺信息是否正确，如有问题请联系运维",
          }),
          void s.invoke("clear-webview-cookie", I)
        );
      const R = S.logo ? S.logo : w.loginUrl,
        D = S.name ? S.name : Dt.value[T].shopName,
        N = S.username ? S.username : Dt.value[T].customerName,
        M = S.id ? S.id : Dt.value[T].platformShopId;
      ("快手" !== w.platformType && s.invoke("remove-duplicate-cookie", I),
        "拼多多" === w.platformType && s.postMessage("setup-webview-interceptor", I));
      try {
        const e = await s.invoke("get-webview-cookie", I, w.platformType),
          t = Array.from(new Map(e.map((e) => [e.name, e])).values());
        ((e && "快手" === w.platformType) ||
          (e && "淘工厂" === w.platformType) ||
          (e && "视频号" === w.platformType)) &&
          s.postMessage("get-shop-cookie", { id: I, data: t });
        const o = jt(I);
        if ((Re(I, o), "server" === At.loginType)) {
          let e;
          switch (w.platformType) {
            case "拼多多":
            default:
              e = "4";
              break;
            case "抖店":
              e = "5";
              break;
            case "快手":
              e = "6";
              break;
            case "淘工厂":
              e = "11";
              break;
            case "视频号":
              e = "8";
              break;
            case "小红书":
              e = "7";
          }
          if (
            "saaszikf" ===
            (null == (g = null == (m = Nt.userInfo) ? void 0 : m.roles[0]) ? void 0 : g.roleKey)
          )
            try {
              const s =
                  "string" == typeof S.subAccount && S.subAccount.trim() && "null" !== S.subAccount
                    ? S.subAccount.trim()
                    : "string" == typeof w.subAccount &&
                        w.subAccount.trim() &&
                        "null" !== w.subAccount
                      ? w.subAccount.trim()
                      : "",
                o =
                  "string" == typeof S.password && S.password.trim() && "null" !== S.password
                    ? S.password.trim()
                    : "string" == typeof w.password && w.password.trim() && "null" !== w.password
                      ? w.password.trim()
                      : "",
                i = {
                  id: I,
                  loginToken: JSON.stringify(t),
                  loginUrl: R,
                  platformType: e,
                  shopName: D,
                  kfNickName: N,
                  merchantName: w.merchantName || "",
                  botId: w.botId,
                  botIndexId: w.indexId,
                  remark: w.remark,
                  botStatus: w.botStatus,
                  isAigood: w.isAigood,
                  aiShopinfo: w.aiShopinfo,
                  status: w.status,
                  platformShopId: S.id,
                  shopCategory: w.shopCategory,
                  knowledgeText: w.knowledgeText,
                  subAccountInfo: w.subAccountInfo,
                };
              (s && (i.subAccount = s), o && (i.password = o));
              const n = await k(i);
              Dt.value[T].baseqa = n.baseqa ?? Dt.value[T].baseqa;
            } catch (L) {
              const e =
                (null == L ? void 0 : L.msg) ||
                (null == L ? void 0 : L.message) ||
                "店铺信息同步失败，请重试";
              return void (await fs(w, I, e));
            }
          else
            "zikf" ===
            (null == (f = null == (h = Nt.userInfo) ? void 0 : h.roles[0]) ? void 0 : f.roleKey)
              ? await b({
                  id: I,
                  loginToken: JSON.stringify(t),
                  loginUrl: R,
                  botId: w.botId,
                  botIndexId: w.indexId,
                  remark: w.remark,
                  botStatus: w.botStatus,
                  isAigood: w.isAigood,
                  aiShopinfo: w.aiShopinfo,
                  status: w.status,
                  platformShopId: S.id,
                  shopCategory: w.shopCategory,
                  knowledgeText: w.knowledgeText,
                  subAccountInfo: w.subAccountInfo,
                })
              : "main" ===
                  (null == (v = null == (y = Nt.userInfo) ? void 0 : y.roles[0])
                    ? void 0
                    : v.roleKey) &&
                (await A({
                  loginToken: JSON.stringify(t),
                  loginUrl: R,
                  platformType: w.platformType,
                  shopName: D,
                  kfNickName: N,
                  subAccount: w.subAccount,
                  password: w.password,
                  mobile: "",
                }));
        } else {
          const e = bt.localDataList.findIndex((e) => e.id === I);
          -1 !== e &&
            ((bt.localDataList[e].loginUrl = S.logo),
            (bt.localDataList[e].shopName = S.name),
            (bt.localDataList[e].customerName = S.username),
            (bt.localDataList[e].platformShopId = S.id));
        }
        if (
          ((w.loginUrl = R),
          (w.shopName = D),
          (w.customerName = N),
          (w.platformShopId = M),
          (w.loginStatus = !0),
          (w.loginExpiredWarning = !1),
          (w.hasReloadedAfterCookie = !1),
          (w.cookieRetryCount = 0),
          (w.hasInitializedCookie = !0),
          r.uploadServerLog({
            bugType: "info",
            shopId: I.toString(),
            bugContent: `店铺${D}登录成功`,
          }),
          W.handleShopLoginCatchUp(I),
          !w.aiShopinfo)
        ) {
          const e = await l(I);
          s.postMessage("init-shop-info", { id: I, data: e });
        }
        (w.isFirstLoginSuccess &&
          (s.postMessage("currnt-page", { id: I, data: !0 }),
          setTimeout(() => {
            s.postMessage("currnt-page", { id: I, data: !1 });
          }, 3e3),
          (Dt.value[T].isFirstLoginSuccess = !1)),
          setTimeout(() => {
            var e;
            (null == (e = Dt.value[T]) ? void 0 : e.loginStatus) &&
              s.send("get-shop-status", { id: I });
          }, 1e4));
      } catch (L) {}
    },
    "change-shop-in-status": (e, t) => {
      const s = Ft(t);
      Dt.value[s].loginStatus = !1;
    },
    "update-shop-login-warning": (e, t) => {
      const s = Ft(t.id);
      if (-1 === s) return;
      Dt.value[s].loginExpiredWarning = Boolean(t.loginExpiredWarning);
    },
  };
Object.entries(Rs).forEach(([e, t]) => {
  s.on(e, t);
});
const ks = (e, t) => {
  var s, o;
  if (null == (o = null == (s = e.info) ? void 0 : s.info) ? void 0 : o.fromDailyTask) return;
  let i = null;
  (1 == e.info.info.type
    ? (i = I)
    : 2 == e.info.info.type
      ? (i = S)
      : 3 == e.info.info.type && (i = T),
    i &&
      ((At.thismessageQueue = At.thismessageQueue.filter((t) => t.id != e.info.info.id)),
      i({ id: e.info.info.id, shopId: t, errormsg: e.errormsg, updateStatus: "3" })));
};
s.on("transfer-port-message", (e, t) => {
  bs();
});
const bs = () => {
    try {
      const e = new MessageChannel();
      ((st = e.port2),
        st && e.port1 && s.postMessage("transfer-port-message", null, [e.port1]),
        st.start(),
        (st.onmessage = (e) => {}));
    } catch (e) {
      setTimeout(() => {
        bs();
      }, 5e3);
    }
  },
  As = (e, t) => {
    xt.set(e, t);
  },
  Ds = (e) => {
    (null == e ? void 0 : e.shopSystemId) &&
      Array.isArray(e.list) &&
      e.list.forEach((t) => {
        const s = Ls(e.shopSystemId, t);
        s && wt.set(s.orderSn, s);
      });
  },
  Ns = async () => {
    if (kt || 0 === wt.size) return;
    kt = !0;
    const e = Array.from(wt.values());
    wt.clear();
    try {
      await v(e);
    } catch (t) {
      e.forEach((e) => {
        wt.set(e.orderSn, e);
      });
    } finally {
      ((kt = !1),
        wt.size > 0 &&
          !Rt &&
          (Rt = setTimeout(() => {
            ((Rt = null), Ns());
          }, 15e3)));
    }
  },
  Ms = () => {
    Rt ||
      kt ||
      (Rt = setTimeout(() => {
        ((Rt = null), Ns());
      }, 15e3));
  },
  Ls = (e, t) =>
    (null == t ? void 0 : t.orderSn)
      ? {
          deadline: String(t.deadline ?? ""),
          createdAt: String(t.createdAt ?? ""),
          problemTitle: t.problemTitle || "",
          orderSn: t.orderSn,
          todoStatue: t.status ?? 0,
          shopId: e,
          instanceId: t.instanceId,
        }
      : null,
  { remove: $s, clear: Cs } = P(),
  Os = n(),
  Us = C([]),
  xs = (e) => {
    if (!e.messageId) return;
    const t = Us.value.findIndex(
      (t) => t.messageId == e.messageId && t.shopSystemId == e.shopSystemId,
    );
    -1 !== t &&
      ((Us.value[t].orderStatus = e.orderStatus),
      e.refundAmount && (Us.value[t].refundAmount = e.refundAmount),
      e.afterSaleStatus && (Us.value[t].afterSaleStatus = e.afterSaleStatus),
      e.logisticsTrace && (Us.value[t].logisticsTrace = e.logisticsTrace),
      st.postMessage({ type: "update-customer-message", data: JSON.stringify(Us.value[t]) }));
  },
  _s = async (e) => {
    if (!e.messageId) return;
    let t = Us.value.find(
        (t) =>
          String(t.messageId) == String(e.messageId) &&
          String(t.shopSystemId) == String(e.shopSystemId),
      ),
      s = e.messageId;
    const o = Os.shops.find((t) => t.id == e.shopSystemId);
    if (!t && "抖店" === (null == o ? void 0 : o.platformType)) {
      ((t = Us.value
        .filter((t) => String(t.shopSystemId) == String(e.shopSystemId))
        .find(
          (t) => String(t.userId) == String(e.messageId) || String(t.userId) == String(e.userId),
        )),
        t && (s = t.messageId));
    }
    t &&
      String(t.shopSystemId) == String(e.shopSystemId) &&
      ((Us.value = Us.value.filter(
        (t) => String(t.shopSystemId) != String(e.shopSystemId) || String(t.messageId) != String(s),
      )),
      await N({ ...e, platformType: (null == o ? void 0 : o.platformType) || t.platformType }));
  },
  qs = (e) => {
    try {
      ((Us.value = Us.value.filter((t) => t.shopSystemId !== e)),
        s.send("clear-shop-message", JSON.stringify(e)),
        $s(e.toString()));
    } catch (t) {}
  },
  Es = async () => {
    try {
      ((Us.value = []), s.send("clear-all-messages"), Cs());
    } catch (e) {}
  };
export {
  W as a,
  Es as b,
  bs as c,
  qt as d,
  je as e,
  qs as f,
  V as g,
  Jt as h,
  Ue as n,
  _s as r,
  xt as s,
  P as u,
};
