const { ipcRenderer, contextBridge, webFrame } = require("electron");
const shouldDisablePreloadConsole = process.argv.includes("--kh-disable-preload-console");

if (shouldDisablePreloadConsole) {
  const noop = () => {};
  [
    "log",
    "info",
    "warn",
    "debug",
    "trace",
    "dir",
    "dirxml",
    "group",
    "groupCollapsed",
    "groupEnd",
    "table",
  ].forEach((method) => {
    try {
      console[method] = noop;
    } catch {}
  });
}

// 通知主进程已经准备好
// 安全注册 IPC 监听器（自动移除旧监听，防止刷新时重复注册）
function safeIpcOn(channel, handler) {
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, handler);
}

// 把不同来源的异常整理成可读文本，避免日志里出现 [object Event]。
function getReadableErrorMessage(errorLike) {
  if (!errorLike) return "未知错误";
  if (typeof errorLike === "string") return errorLike;
  if (errorLike instanceof Error) {
    return errorLike.stack || errorLike.message || String(errorLike);
  }
  if (typeof errorLike === "object") {
    const message = errorLike.message || errorLike.reason?.message || "";
    const stack = errorLike.stack || errorLike.reason?.stack || "";
    const filename = errorLike.filename || "";
    const lineno = errorLike.lineno ? `:${errorLike.lineno}` : "";
    const colno = errorLike.colno ? `:${errorLike.colno}` : "";
    const location = filename ? ` ${filename}${lineno}${colno}` : "";
    if (message || stack) {
      return `${message}${location}${stack ? `\n${stack}` : ""}`.trim();
    }
  }
  return String(errorLike);
}

// 统一上报拼多多 preload 的全局错误。
function reportGlobalPreloadError(type, errorLike) {
  const queryInfo = getQueryParams(window.location.href);
  const shopName = queryInfo.shopName || thatshopName || "未知店铺";

  ipcRenderer.send("write-preload-error-log", {
    shopName,
    platform: "pdd",
    errorMessage: `${type}: ${getReadableErrorMessage(errorLike)}`,
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
  });
}

// ============ API 健康监控 ============
// const apiHealthMonitor = {
//   recentRequests: [], // 最近的请求结果 [true=成功, false=失败]
//   MAX_RECORDS: 10, // 最多记录 10 次
//   initialized: false,

//   // 记录请求结果
//   record(success) {
//     this.recentRequests.push(success)
//     if (this.recentRequests.length > this.MAX_RECORDS) {
//       this.recentRequests.shift()
//     }
//   },

//   // 获取 API 健康状态
//   isHealthy() {
//     // 样本太少不判断
//     if (this.recentRequests.length < 3) return true
//     const failCount = this.recentRequests.filter((ok) => !ok).length
//     // 失败率 >= 50% 视为不健康
//     return failCount / this.recentRequests.length < 0.5
//   },

//   // 初始化 fetch 拦截
//   init() {
//     if (this.initialized) return
//     this.initialized = true

//     const self = this
//     const originalFetch = window.fetch

//     window.fetch = async function (...args) {
//       try {
//         const response = await originalFetch.apply(this, args)
//         // 只记录业务接口，忽略静态资源
//         const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || ''
//         if (
//           url.includes('pinduoduo.com') &&
//           !url.includes('.js') &&
//           !url.includes('.css')
//         ) {
//           self.record(response.ok)
//         }
//         return response
//       } catch (e) {
//         const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || ''
//         if (url.includes('pinduoduo.com')) {
//           self.record(false)
//         }
//         throw e
//       }
//     }

//     console.log('[API健康监控] 已初始化')
//   }
// }

// // 初始化 API 监控
// apiHealthMonitor.init()

// ============ WebSocket 状态追踪 ============
let wsConnectState = -1; // -1=未知, 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
let linkonInsert = false; // 是否链接成功
let sendInsert = false; // 是否插入成功
// 上报数据数组
// let reportedList = [] //上报数据
let thatshopName = "";
// 是否登录成功
let isLoginSuccess = false;
let isPDDShowRobotReply = false; // 默认获取机器人信息'
let hasSentLoginInfo = false;
let isAutoOnlineBlocked = false; // 当前店铺是否禁止自动切回在线

class AutoOnlineBlockDB {
  constructor() {
    this.db = null;
    this.DB_NAME = "pddAutoOnlineBlockDB";
    this.STORE_NAME = "autoOnlineBlock";
    this.VERSION = 1;
  }

  // 初始化数据库，只保存每个店铺是否禁止自动上线的布尔值。
  async init() {
    if (this.db) return this.db;

    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.db;
  }

  // 读取当前店铺是否禁止自动上线。
  async get(shopId) {
    if (!shopId) return false;

    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readonly");
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.get(String(shopId));

      request.onsuccess = () => resolve(!!request.result?.blocked);
      request.onerror = () => reject(request.error);
    });
  }

  // 写入当前店铺是否禁止自动上线，只存一个布尔值。
  async set(shopId, blocked) {
    if (!shopId) return false;

    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readwrite");
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.put({
        id: String(shopId),
        blocked: !!blocked,
      });

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

const autoOnlineBlockDB = new AutoOnlineBlockDB();

class ShopMessage {
  constructor(message, mode) {
    if (mode == "ordinary") {
      this.commonInit(message);
    } else if (mode == "push") {
      this.commonInit2(message);
    } else if (mode == "Turn") {
      this.commonInit3(message);
    }
    this.orderId = message?.info?.orderSequenceNo;
    this.ordersku = message?.info?.orderSequenceNo ? message?.info?.spec : "";
    this.orderGoodSku = this.ordersku ? String(this.ordersku) : "";
    this.orderInfo = "";
    // goodsID 可能是 number 或 "562189085105.0"，统一成整数字符串
    const rawGoodId = message?.info?.goodsID
      ? String(message.info.goodsID)
          .trim()
          .replace(/^(\d+)\.0+$/, "$1")
      : "";
    if (this.orderId) {
      this.orderGoodId = rawGoodId;
      this.goodId = "";
    } else {
      this.orderGoodId = "";
      this.goodId = rawGoodId;
    }
    this.goodInfo = "";
    this.goodName = message?.info?.goodsName;
    this.content = message?.info?.orderSequenceNo
      ? "用户发送订单"
      : message?.info?.goodsName
        ? "用户发送商品"
        : message?.content;
    this.timeout = this.formatTimeout(message?.ts);
    this.type = "code";
  }
  commonInit(message) {
    this.messageId = message?.from?.uid;
    this.userId = message?.from?.uid;
    this.username = message?.nickname || message?.from?.uid;
  }
  commonInit2(message) {
    this.messageId = message?.from?.csid ? message?.to?.uid : message?.from?.uid;
    this.username = message?.nickname
      ? message.nickname
      : message?.from?.csid
        ? message?.to?.uid
        : message?.from?.uid;
    this.userId = message?.from?.csid ? message?.to?.uid : message?.from?.uid;
  }

  commonInit3(message) {
    this.messageId =
      message?.from?.csid && message?.to?.role == "user" ? message?.to?.uid : message?.from?.uid;
    this.username = message?.nickname
      ? message.nickname
      : message?.from?.csid
        ? message?.to?.uid
        : message?.from?.uid;
    this.userId =
      message?.from?.csid && message?.to?.role == "user" ? message?.to?.uid : message?.from?.uid;
  }

  formatTimeout(ts) {
    const now = Date.now() / 1000;
    if (!ts) return Math.floor(now) + 180;
    const timestamp = ts > 1e12 ? ts / 1000 : ts;
    return Math.floor(timestamp) + 180;
  }
}
// 从消息内容里提取拼多多商品链接中的 goods_id。
function extractGoodIdFromContent(content) {
  // content 可能为空，先兜底成空字符串，避免后续匹配报错。
  const text = String(content || "");
  // 先从文本里拿到链接，再用 URL 解析参数，避免直接切字符串。
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  if (!urlMatch) return "";

  try {
    // 去掉链接尾部可能夹带的中文标点或括号，避免 URL 解析失败。
    const cleanUrl = urlMatch[0].replace(/[)\]}>，。；、】【'"]+$/g, "");
    const url = new URL(cleanUrl);
    const goodId = url.searchParams.get("goods_id");
    if (!goodId) return "";
    return String(goodId)
      .trim()
      .replace(/^(\d+)\.0+$/, "$1");
  } catch (error) {
    console.warn("[PDD] 解析商品链接失败:", error);
    return "";
  }
}

let visibilitychange = true; // 定义参数 窗口是否可见
// [
//   'user_goods_card',   // 用户发送商品卡片
//   'mall_location',    // 位置信息卡片
//   'user_send_red_envelope',   // 用户发送红包
//   'aftersales_hosting_warning_card',  // 售后托管预警卡（进行中）
//   'no_aftersales_hosting_warning_card',  // 未进入售后托管的风险提示卡
//   'dispute_warning',     //  纠纷预警卡
//   'order_confirm_agree_new',   // 订单确认-用户同意类卡片
//   'mall_order_confirm_new',    // 商城订单确认卡
//   'service_todo_system_hint',  // 系统提示工单
// 'prompt_delivery_user_text',  // 催发货文本提示
//   'urge_process_text_card',  // 帮助售后卡片
//   'mall_answer_with_text' ,  // 自动回复
//   'modify_for_aftersale_card',  // 消费者已修改售后信息，请您及时处理
//  'mall_faq_question'  // 常见问题
// ].includes(message?.template_name))  // 特定卡片信息通过

// 监听 WebSocket 状态变化（从注入脚本发送）

window.addEventListener("message", async (event) => {
  if (event.data.type == "reminder-reply") {
    // 用于催单
    // console.log('event=======', event)
    const { messageId } = event.data.data;
    fetch(`https://mms.pinduoduo.com/latitude/goods/singleRecommendGoods`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: 2,
        uid: messageId,
        pageNum: 1,
        pageSize: 10,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        console.log("推荐商品数据:", res);
        const { result } = res;
        if (result && result.headGoods) {
          const goodId = result.headGoods.goodsId || result.goodsList[0].goodsId;
          fetch("https://mms.pinduoduo.com/plateau/message/send/mallGoodsCard", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uid: messageId,
              goods_id: goodId,
              biz_type: 5,
            }),
          });
        }
      });
  } else if (event.data && event.data.type === "WS_STATE_CHANGE") {
    wsConnectState = event.data.state;
  } else if (event.data && event.data.type === "get-message") {
    const data = JSON.parse(event.data.data);
    // const time = new Date().toTimeString().slice(0, 8)
    if (!linkonInsert) linkonInsert = true;
    const { message } = data || {};

    // ===== 转店铺信息 =====
    if (data?.response === "push") {
      console.log("【push 转店铺】", message?.content, data);
      const obj = new ShopMessage(message, "push");
      obj.source = "code1";
      if (!obj.content.includes("平台客服已处理本次售后"))
        ipcRenderer.send("get-customer-message-list", [obj]);
      // push 已处理完，不再继续走 chat_type
      return;
    }
    // ===== （普通会话）=====
    else if (data?.chat_type_id === 1) {
      if (message?.from?.role === "user") {
        // 这里先判断是否是商品详情进线
        // if (['user_source'].includes(message?.template_name)) {
        //   console.log('商品详情进线', message)
        //   const data = await getUserSendGood(
        //     message?.info?.goods_info?.goods_id
        //   )
        //   const obj = new ShopMessage(message, 'ordinary')
        //   obj.goodInfo = data.goodInfo
        //   obj.sku = data.sku
        //   obj.goodId = data.goodId
        //   obj.goodName = data.goodName
        //   pendingGoodIdFromUserSource = message?.info?.goods_info?.goods_id // 暂存goodId供后续消息使用
        // }
        if (
          ![
            "enter_manual_823_offline", //"8-23点间，店铺需有客服在线，机器人才会接待消费者"
            "merchant_robot_system_hint_to_merchant_alone_text", // 机器人
            "mall_robot_man_intervention_and_restart", // 商家履行承诺提醒
            "merchant_promise_not_fulfilled_remind", //  您向用户做出了确认商品信息的额外承诺，请保持关注及时履约，避免纠纷
            "user_source", // 用户来自商品详情页  用户来源
            "merchant_add_as_robot_reply", // 让机器人学会此回复 ↑
            "guide_merchant_tips", // 您好像还没有配置消费者问到的常见问题回答，为了提升您的接待效率、减少顾客流失，建议您尽快完善此配置 立即配置
            "mall_deliver_description_for_b", // 该商品提供以下发货服务
            "mall_answer_with_text", // 自动回复
            "remind_help_order", // 使用“邀请下单”，可提前备注订单，轻松提升转化率！
            "service_todo_system_hint",
          ].includes(message?.template_name)
        ) {
          const obj = new ShopMessage(message, "ordinary");
          const uid = message?.from?.uid;
          if (!uid) return;

          obj.source = "code2";
          switch (message?.type) {
            case 1:
              obj.content = "用户发送了图片";
              break;
            case 14:
              obj.content = "用户发送了视频";
          }
          // if(message?.type == '1' ) obj.content =
          if (!obj.content.includes("平台客服已处理本次售后"))
            ipcRenderer.send("get-customer-message-list", [obj]);
        }
        return;
      } else if (
        message?.from?.role != "user" &&
        message?.from?.mall_id &&
        message?.from?.uid &&
        message?.from?.csid &&
        message?.need_reply
      ) {
        if (
          ![
            "mall_answer_with_text", // 自动回复
          ].includes(message?.template_name)
        ) {
          return;
        }
        const obj = new ShopMessage(message, "Turn");

        obj.source = "code3";
        if (!obj?.content?.includes("平台客服已处理本次售后"))
          ipcRenderer.send("get-customer-message-list ", [obj]);
      }
      // 机器人回复清理逻辑
      if (isPDDShowRobotReply && ["mall_robot_text_msg"].includes(message?.template_name)) {
        const targetUser =
          document.querySelector(`[data-random="${message?.to?.uid}-0-unTimeout"]`) ||
          document.querySelector(`[data-random="${message?.to?.uid}-0-unRead"]`);

        if (
          targetUser &&
          !(
            targetUser.querySelector(".chat-unreply-over-time") ||
            targetUser.querySelector(".chat-unreply-time")
          )
        ) {
          const shopMessageCont = document.querySelector(".conv-today");
          let total = 0;
          if (shopMessageCont) {
            if (shopMessageCont.textContent) {
              const match = shopMessageCont.textContent.match(/\((\d+)\)/);
              if (match) {
                total = match[1];
              } else {
                total = 0;
              }
            }
          }

          ipcRenderer.send("reply-customer-message", {
            messageId: message?.to?.uid,
            sendTarget: "pddRobot",
            shopMsgTotal: total,
          });
          return;
        }
      }
    }

    // ===== 官方客服 =====
    else if (data?.chat_type_id == 5 && message?.from?.role == "platform") {
      const obj = {
        messageId: message?.to?.uid,
        username: message?.nickname || message?.from?.uid,
        content: message?.content,
        timeout:
          Math.floor(
            message?.ts ? (message.ts > 1e12 ? message.ts / 1000 : message.ts) : Date.now() / 1000,
          ) + 180,
        userId: message?.to?.uid,
        type: "code",
      };
      const shopMessageCont = document.querySelector(".conv-today");
      if (shopMessageCont) {
        if (shopMessageCont.textContent) {
          const match = shopMessageCont.textContent.match(/\((\d+)\)/);
          if (match) {
            obj.shopMsgTotal = match[1];
          } else {
            obj.shopMsgTotal = 0;
          }
        }
      }
      // reportedList.push(lookmesage)
      obj.source = "code5";
      if (!obj?.content.includes("平台客服已处理本次售后"))
        ipcRenderer.send("get-customer-message-list", [obj]);
    }

    //   ======回复消息========
    // else if (data.response == 'mall_system_msg' && data.message.data.user_id) {
    //   console.log('官方客服回复消息', data, data.message.data.user_id)
    //   ipcRenderer.send('reply-customer-message', {
    //     messageId: data?.message?.data?.user_id,
    //     sendTarget: 'pddcode',
    //     compensate: true
    //   })
    // }
  } else if (event.data && event.data.type === "insert-sucesss") {
    if (event.data.data.type == "sendmessage") {
      sendInsert = event.data.data.bool;
    }
  } else if (event?.data?.type === "get-good-info") {
    const goodId = event?.data?.goodId;
    if (!goodId) return;
    const good = await processGoodsDetail(goodId);

    window.postMessage({
      type: "get-good-info-cb",
      data: good,
    });
  }
});

let _key = false; //  页面隐藏状态，true=可见,false=隐藏
let mallName = "";
// const HEARTBEAT_INTERVAL = 10000
const HEARTBEAT_INTERVAL = 1000 * 60 * (30 + Math.random() * 20);
let currentInterval = HEARTBEAT_INTERVAL; // 临时变量：当前使用的间隔时间
let hearTimer = null;
let info = null;
const observerConfig = {
  childList: true, // 监听子节点的变化
  subtree: true, // 在所有后代节点中观察变化
  characterData: true, // 监听字符数据的变化
  attributes: true, // 监听属性的变化
  attributeOldValue: true, // 监听属性值的变化
  characterDataOldValue: true, // 监听字符数据的旧值
  // 其他选项：attributes, characterData, attributeOldValue, characterDataOldValue
};
// 指纹伪装：分辨率、平台、语言、硬件、webdriver
let shopId = null;
let shopBotStatus = 0; // 默认关闭
// 添加用户操作状态跟踪变量
let isUserOperating = false; // 用户是否正在操作
let lastMouseActivity = 0; // 最后一次鼠标活动时间
let lastKeyboardActivity = 0; // 最后一次键盘活动时间
let windowHasFocus = false; // 窗口是否有焦点（改为false，只有真正获得焦点才设为true）
let userActivityTimer = null; // 用户活动检查定时器
const USER_ACTIVITY_TIMEOUT = 3000; // 3秒内有鼠标/键盘活动认为用户在操作

// 节流函数
function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(
        () => {
          func.apply(this, args);
          lastExecTime = Date.now();
        },
        delay - (currentTime - lastExecTime),
      );
    }
  };
}
try {
  const params = new URLSearchParams(window.location.search);
  shopId = params.get("shopId");
} catch (e) {}

// 把 preload 中的自动上线拦截状态同步到页面注入层，避免跨作用域直接读变量。
function syncAutoOnlineBlockToPage() {
  window.postMessage(
    {
      type: "SYNC_AUTO_ONLINE_BLOCK",
      data: {
        blocked: isAutoOnlineBlocked,
      },
    },
    "*",
  );
}

// 启动时从 IndexedDB 恢复当前店铺的自动上线拦截状态，解决刷新后状态丢失问题。
async function loadAutoOnlineBlockState() {
  try {
    isAutoOnlineBlocked = await autoOnlineBlockDB.get(shopId);
  } catch (error) {
    isAutoOnlineBlocked = false;
  }
  syncAutoOnlineBlockToPage();
}

// 根据当前状态更新自动上线拦截开关：忙碌/离线拦截，在线解除拦截。
async function persistAutoOnlineBlockState(status) {
  const blocked = ["忙碌", "离线"].includes(status);
  isAutoOnlineBlocked = blocked;
  try {
    await autoOnlineBlockDB.set(shopId, blocked);
  } catch (error) {
    console.error("保存自动上线拦截状态失败", error);
  }
  syncAutoOnlineBlockToPage();
}

// 统一查找状态切换菜单，供手动/自动切换状态复用。
function getStatusMenuDom() {
  return document.querySelector('[class="status-box sel-box"]');
}

// 统一执行状态按钮点击，供自动恢复和外部切换复用。
function triggerStatusOptionClick(optionDom) {
  if (!optionDom) return false;
  optionDom.click();
  return true;
}

// 自动恢复在线前先检查拦截状态；只要当前不是在线，就允许恢复。
function tryAutoSwitchOnline(currentStatus, reason) {
  if (currentStatus != globStatus) {
    const allLi = document.querySelectorAll(".status-box li");
    let key = false;
    allLi.forEach((li) => {
      if (li.innerText == globStatus) {
        li.click();
        key = true;
      }
    });
    return key;
  }
}

let width = 1920,
  height = 1080;
if (shopId) {
  width = 1920 + (parseInt(shopId) % 100);
  height = 1080 + (parseInt(shopId) % 100);
}
Object.defineProperty(window, "screen", {
  value: { width, height },
  configurable: true,
});
Object.defineProperty(navigator, "platform", {
  value: "Win32",
  configurable: true,
});
Object.defineProperty(navigator, "hardwareConcurrency", {
  value: 8,
  configurable: true,
});
Object.defineProperty(navigator, "deviceMemory", {
  value: 8,
  configurable: true,
});
Object.defineProperty(navigator, "language", {
  value: "zh-CN",
  configurable: true,
});
Object.defineProperty(navigator, "languages", {
  value: ["zh-CN", "zh"],
  configurable: true,
});
Object.defineProperty(navigator, "webdriver", {
  value: false,
  configurable: true,
});

// 鼠标事件处理函数
const mouseActivityHandler = (eventType) => {
  if (windowHasFocus) {
    lastMouseActivity = Date.now();
    isUserOperating = true;
    // console.log(`鼠标${eventType} - 用户正在操作`)
  }
};

const messageList = [];
contextBridge.exposeInMainWorld("context_bridge", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
});
// // 动态分辨率指纹注入

// 监听店铺bot状态更新
safeIpcOn("update-shop-bot-status", (_, data) => {
  const previousStatus = shopBotStatus;
  shopBotStatus = data.botStatus;
  // if (shopBotStatus === 1 && previousStatus !== 1) {
  //   // AI开启，添加所有用户活动监听器
  //   addAllUserActivityListeners()
  // } else if (shopBotStatus !== 1 && previousStatus === 1) {
  //   // AI关闭，移除所有用户活动监听器
  //   removeAllUserActivityListeners()
  // }
});
// 是否要弹出机器人信息
safeIpcOn("change-pdd-show-robot-reply", (_, data) => {
  isPDDShowRobotReply = data;
  window.postMessage({
    type: "CHANGE_PDD_SHOW_ROBOT_REPLY",
    data: {
      isPDDShowRobotReply: data,
    },
  });
});

// 监听页面dom加载完成
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(async () => {
    await loadAutoOnlineBlockState();
    ipcRenderer.send("request-shop-bot-status");
    // 初始化店铺配置
    ipcRenderer.send("init-shop-set");
  }, 1000);
});

let loginInfo = {
  username: "",
  password: "",
};
let loginRetryTimer = null;
let loginRetryCount = 0;
const loginRetryDelays = [2000, 4000, 6000];

const pickLogin = (v) => {
  if (typeof v !== "string") return "";
  v = v.trim();
  return v && v !== "null" && v !== "undefined" ? v : "";
};

safeIpcOn("get-shop-pwd", (_, args) => {
  console.log("get-shop-pwd", args);
  if (!loginInfo.username && args.userName != "") loginInfo.username = pickLogin(args?.userName);
  if (!loginInfo.password && args.password != "") loginInfo.password = pickLogin(args?.password);
});

async function refreshLogin() {
  for (const arg of process.argv) {
    if (arg.startsWith("--username")) {
      loginInfo.username = pickLogin(arg.slice("--username".length));
    } else if (arg.startsWith("--password")) {
      loginInfo.password = pickLogin(arg.slice("--password".length));
    }
  }
  if (loginInfo.username && loginInfo.password) return loginInfo;
  ipcRenderer.send("get-shop-pwd");
  await new Promise((r) => setTimeout(r, 500));
  return loginInfo;
}

function clearLoginRetryTimer() {
  if (loginRetryTimer) {
    clearTimeout(loginRetryTimer);
    loginRetryTimer = null;
  }
}

ipcRenderer.on("paste-to-shop", (event, text) => {
  const input = document.querySelector("#replyTextarea");
  if (!input)
    // 未找到 #replyTextarea 元素
    return;
  input.value = text;

  // 触发 input 事件（如果页面有监听 input 事件做实时处理）
  input.dispatchEvent(new Event("input", { bubbles: true }));

  //  模拟回车键（keydown + keyup 可选）
  const enterEvent = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  });
  input.dispatchEvent(enterEvent);

  // 如果提交后需要清除焦点或其他操作，可在此添加
  // input.blur(); // 例如失焦
});

const KHAI_REPLY_TEXTAREA_DEFAULT_HEIGHT = 128;
const KHAI_REPLY_TEXTAREA_MIN_HEIGHT = 72;
const KHAI_REPLY_TEXTAREA_MAX_HEIGHT = 260;
const KHAI_REPLY_TEXTAREA_STORAGE_KEY = "khai-pdd-reply-textarea-height";
let khaiReplyAreaObserver = null;
function getKhaiReplyTextareaHeight() {
  const stored = Number(localStorage.getItem(KHAI_REPLY_TEXTAREA_STORAGE_KEY));
  return Math.min(
    KHAI_REPLY_TEXTAREA_MAX_HEIGHT,
    Math.max(
      KHAI_REPLY_TEXTAREA_MIN_HEIGHT,
      Number.isFinite(stored) ? stored : KHAI_REPLY_TEXTAREA_DEFAULT_HEIGHT,
    ),
  );
}
function setKhaiReplyTextareaHeight(height) {
  const nextHeight = Math.min(
    KHAI_REPLY_TEXTAREA_MAX_HEIGHT,
    Math.max(KHAI_REPLY_TEXTAREA_MIN_HEIGHT, Math.round(height)),
  );
  localStorage.setItem(KHAI_REPLY_TEXTAREA_STORAGE_KEY, String(nextHeight));
  document.documentElement.style.setProperty("--khai-pdd-reply-textarea-height", `${nextHeight}px`);
  return nextHeight;
}
function findKhaiReplyPanel(input) {
  let node = input.parentElement;
  let fallback = node;
  for (let i = 0; node && i < 7; i += 1, node = node.parentElement) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 300 && rect.height > 20 && rect.height < 320) fallback = node;
    if (rect.width > 300 && rect.height > 20 && rect.height < 320 && rect.bottom > window.innerHeight - 80) {
      return node;
    }
  }
  return fallback;
}
function ensureKhaiReplyResizeHandle(panel, input) {
  if (!panel) return;
  if (window.getComputedStyle(panel).position === "static") panel.style.position = "relative";
  let handle = document.getElementById("khai-pdd-reply-resize-handle");
  if (!handle) {
    handle = document.createElement("div");
    handle.id = "khai-pdd-reply-resize-handle";
    handle.title = "拖动调整发送窗口高度，双击恢复默认";
    handle.textContent = "拖动调整高度";
    handle.addEventListener("mousedown", (event) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = input.getBoundingClientRect().height || getKhaiReplyTextareaHeight();
      const onMove = (moveEvent) => {
        setKhaiReplyTextareaHeight(startHeight - (moveEvent.clientY - startY));
        ensureKhaiReplyAreaHeight();
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove, true);
        window.removeEventListener("mouseup", onUp, true);
      };
      window.addEventListener("mousemove", onMove, true);
      window.addEventListener("mouseup", onUp, true);
    });
    handle.addEventListener("dblclick", (event) => {
      event.preventDefault();
      setKhaiReplyTextareaHeight(KHAI_REPLY_TEXTAREA_DEFAULT_HEIGHT);
      ensureKhaiReplyAreaHeight();
    });
  }
  if (handle.parentElement !== panel) panel.prepend(handle);
}
function ensureKhaiReplyAreaHeight() {
  const styleId = "khai-pdd-reply-area-height";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      #replyTextarea {
        min-height: var(--khai-pdd-reply-textarea-height, ${KHAI_REPLY_TEXTAREA_DEFAULT_HEIGHT}px) !important;
        height: var(--khai-pdd-reply-textarea-height, ${KHAI_REPLY_TEXTAREA_DEFAULT_HEIGHT}px) !important;
        max-height: var(--khai-pdd-reply-textarea-height, ${KHAI_REPLY_TEXTAREA_DEFAULT_HEIGHT}px) !important;
        resize: none !important;
        overflow-y: auto !important;
        line-height: 20px !important;
        box-sizing: border-box !important;
      }
      #replyTextarea:focus {
        height: var(--khai-pdd-reply-textarea-height, ${KHAI_REPLY_TEXTAREA_DEFAULT_HEIGHT}px) !important;
      }
      #khai-pdd-reply-resize-handle {
        position: absolute !important;
        left: 50% !important;
        top: 2px !important;
        width: 96px !important;
        height: 18px !important;
        transform: translateX(-50%) !important;
        cursor: ns-resize !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 999px !important;
        background: rgba(37, 99, 235, 0.88) !important;
        color: #fff !important;
        font-size: 12px !important;
        line-height: 18px !important;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.28) !important;
        user-select: none !important;
        pointer-events: auto !important;
      }
    `;
    document.head?.appendChild(style);
  }
  const input = document.querySelector("#replyTextarea");
  if (!input) return;
  const heightValue = setKhaiReplyTextareaHeight(getKhaiReplyTextareaHeight());
  const height = `${heightValue}px`;
  input.style.minHeight = height;
  input.style.height = height;
  input.style.maxHeight = height;
  input.style.resize = "none";
  input.style.overflowY = "auto";
  const panel = findKhaiReplyPanel(input);
  ensureKhaiReplyResizeHandle(panel, input);
  let node = input.parentElement;
  const nextMinHeight = `${heightValue + 50}px`;
  for (let i = 0; node && i < 5; i += 1, node = node.parentElement) {
    const rect = node.getBoundingClientRect();
    if (
      node.dataset.khaiReplyHeightPanel === "1" ||
      node.style.minHeight ||
      (rect.width > 300 && rect.height > 20 && rect.height < KHAI_REPLY_TEXTAREA_MAX_HEIGHT + 70)
    ) {
      node.dataset.khaiReplyHeightPanel = "1";
      node.style.minHeight = nextMinHeight;
    }
  }
}
function startKhaiReplyAreaHeightObserver() {
  ensureKhaiReplyAreaHeight();
  let count = 0;
  const timer = setInterval(() => {
    ensureKhaiReplyAreaHeight();
    count += 1;
    if (count >= 60) clearInterval(timer);
  }, 1000);
  if (khaiReplyAreaObserver || !document.body) return;
  khaiReplyAreaObserver = new MutationObserver(() => ensureKhaiReplyAreaHeight());
  khaiReplyAreaObserver.observe(document.body, { childList: true, subtree: true });
}

let globStatus = "在线"; // 全局在线状态

// 监听页面所有资源加载完成
window.addEventListener("load", async () => {
  startKhaiReplyAreaHeightObserver();
  setTimeout(() => {
    const testdom = document.querySelector(".avatar");

    if (testdom) {
      // 562191682078   562189085105
      testdom.addEventListener("click", async (e) => {
        // window.postMessage({
        //   type: 'close-socket'
        // })

        window.postMessage({
          type: "get-unreply-conversations",
        });

        // fetch(
        //   `https://mms.pinduoduo.com/chats/chatStatusUsers?csname=${info?.username}`,
        //   {
        //     method: 'get',
        //     headers: {
        //       'Content-Type': 'application/json'
        //     }
        //     // obj:{}
        //   }
        // )
        //   .then((r) => r.json())
        //   .then((res) => {
        //     console.log('res======>', res)
        //     if (res.length) {
        //       tryAutoSwitchOnline(
        //         res[res.length - 1].status,
        //         'status-history-check'
        //       )
        //     }
        //   })
        //   .catch((err) => {
        //     console.log('err', err)
        //   })
      });
    }
  }, 5000);

  let count = 0;
  const max = 10;

  const timer = setInterval(() => {
    const el = document.querySelector(".panel-tab-header .status");

    if (el) {
      clearInterval(timer);

      let status = "忙碌";
      const classes = [...el.classList];

      if (classes.includes("online")) status = "在线";
      else if (classes.includes("offline")) status = "离线";

      globStatus = status;
      ipcRenderer.send("shop-status-change", { status });
      window.postMessage({
        type: "shop-status-change",
        data: globStatus,
      });
      el.addEventListener("mousedown", async (e) => {
        const li = e.target.closest("li");
        if (li) {
          globStatus = li.textContent.trim();
          window.postMessage({
            type: "shop-status-change",
            data: globStatus,
          });
        }
      });
      // })

      return;
    }
    if (++count >= max) {
      clearInterval(timer);
      console.warn("status 获取失败（已达上限）");
    }
  }, 3000);

  const start1 = Date.now();
  const timer1 = setInterval(() => {
    const modal =
      document.querySelector(".installerContact") || document.querySelector(".pickupServiceGuide");
    if (modal) {
      modal.style.display = "none";
      clearInterval(timer1);
    }
    // 10 秒后自动停止检查
    if (Date.now() - start1 > 10 * 1000) {
      clearInterval(timer1);
    }
  }, 200);
  const url = window.location.href;

  ipcRenderer.send("get-shop-page-loaded");
  const style = document.createElement("style");
  style.setAttribute("data-disable-anim", "true");
  // 动画延迟  animation-delay: 0.01ms !important;
  // 动画时长  animation-duration: 0.01ms !important;
  // 动画次数  animation-iteration-count: 1 !important;
  // 过渡时长  transition-duration: 0.01ms !important;
  // 过渡延迟  transition-delay: 0.01ms !important;
  // 滚动行为  scroll-behavior: auto !important;
  style.innerHTML = `
    *,
    *::before,
    *::after {
      animation-delay: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      transition-delay: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  `;
  document.head?.appendChild(style);

  const meta = document.createElement("meta");
  meta.setAttribute("httpEquiv", "Content-Security-Policy");
  meta.setAttribute("content", "default-src 'self'  app-local://js/;");
  document.head?.appendChild(meta);

  windowHasFocus = document.hasFocus();
  console.log("页面加载完成，当前焦点状态:", windowHasFocus);

  // if (shopBotStatus === 1) {
  //   addAllUserActivityListeners()
  // }
  const fillLoginForm = async () => {
    if (!window.location.href.includes("login") || isLoginSuccess) {
      clearLoginRetryTimer();
      return false;
    }

    const { username, password } = await refreshLogin();

    const loginElement = document.querySelector(".login-info-section");
    if (!loginElement) return false;

    const tabDom =
      loginElement.querySelectorAll(".tab-item")[1] ||
      loginElement.querySelector(".Common_item__3diIn");
    tabDom?.click();

    const usernameDom = document.querySelector("#usernameId");
    const passwordDom = document.querySelector("#passwordId");
    const loginBtn = loginElement.querySelector(".info-content > button");
    if (!usernameDom || !passwordDom || !loginBtn) return false;

    if (!usernameDom.value && username) {
      usernameDom.value = username;
      usernameDom.dispatchEvent(new Event("input", { bubbles: true }));
      usernameDom.dispatchEvent(new Event("change", { bubbles: true }));
    }

    if (!passwordDom.value && password) {
      passwordDom.value = password;
      passwordDom.dispatchEvent(new Event("input", { bubbles: true }));
      passwordDom.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (usernameDom) {
      usernameDom.addEventListener("input", async () => {
        console.log("usernameDom input:", usernameDom.value);
        loginInfo.username = usernameDom.value;
      });
    }

    if (passwordDom) {
      passwordDom.addEventListener("input", async () => {
        console.log("passwordDom input:", passwordDom.value);
        loginInfo.password = passwordDom.value;
      });
    }
    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        clearLoginRetryTimer();
        ipcRenderer.send("loginInfo", loginInfo);
      });
    }

    if (username && password) {
      setTimeout(() => {
        if (
          window.location.href.includes("login") &&
          !isLoginSuccess &&
          usernameDom.value &&
          passwordDom.value
        ) {
          loginBtn.click();
        }
      }, 1500);
      return true;
    }

    return false;
  };

  // 判断是否登录
  const loginObserver = new MutationObserver(async (mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type !== "childList") continue;

      const loginElement = document.querySelector(".login-info-section");
      // console.log("校验之前=========",window.location.href)

      if (!window.location.href.includes("login")) loginObserver.disconnect();

      if (!loginElement) continue;
      loginObserver.disconnect();
      try {
        loginRetryCount = 0;
        await fillLoginForm();
        clearLoginRetryTimer();
        const runRetry = () => {
          if (
            loginRetryCount >= loginRetryDelays.length ||
            !window.location.href.includes("login") ||
            isLoginSuccess
          ) {
            clearLoginRetryTimer();
            return;
          }

          const delay = loginRetryDelays[loginRetryCount];
          loginRetryTimer = setTimeout(async () => {
            loginRetryTimer = null;
            if (!window.location.href.includes("login") || isLoginSuccess) {
              clearLoginRetryTimer();
              return;
            }

            loginRetryCount += 1;
            await fillLoginForm();

            if (
              loginRetryCount < loginRetryDelays.length &&
              window.location.href.includes("login") &&
              !isLoginSuccess
            ) {
              runRetry();
            }
          }, delay);
        };
        runRetry();
      } catch (err) {
        console.error("loginObserver error:", err);
      }

      break;
    }
  });
  loginObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // 监听是否退出(登录过期)或在别处登录
  const logoutObserver = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList") {
        // 判断是否退出登录(登录过期)
        const loginElement = document.querySelector("body > div.el-message-box__wrapper > div");
        if (
          loginElement &&
          loginElement.querySelector(".el-message-box__title").textContent === "登录过期"
        ) {
          loginElement.querySelectorAll("button")[0].click();
          clearLoginRetryTimer();
          hasSentLoginInfo = false;
          console.log("登录过期");
          ipcRenderer.send("account-login-expired");
          logoutObserver.disconnect();
          // setTimeout(() => {
          //     loginObserver.observe()
          // }, 1000)
          // window.location.reload()
          break;
        }
        // 判断是否在别处登录
        const loginOtherElement = document.querySelector(".head");
        if (loginOtherElement && loginOtherElement.textContent == "账户在别处登录") {
          clearLoginRetryTimer();
          hasSentLoginInfo = false;
          ipcRenderer.send("account-login-other");
          logoutObserver.disconnect();
          // window.location.reload()
          break;
        }
      }
    }
  });
  logoutObserver.observe(document.body, observerConfig);
  // 获取店铺信息
  const shopInfoObserver = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList") {
        const shopInfoElement = document.querySelector(
          "#app > div > div.app-container > div.left-panel > div.header.panel-tab-header",
        );
        if (shopInfoElement) {
          fetch("https://mms.pinduoduo.com/chats/userinfo/realtime?get_response=true")
            .then((res) => res.json())
            .then(async (res) => {
              // console.log('res==============>', res)
              mallName = res.mall.mall_name;
              info = {
                logo: res.mall.logo,
                id: res.mall.mall_id.toString(),
                name: res.mall.mall_name,
                username: res.username,
                categoryStr: "",
              };
              clearLoginRetryTimer();
              ipcRenderer.send("get-shop-info", info);

              if (info)
                setTimeout(() => {
                  window.postMessage({
                    type: "sync-shop-info",
                    data: info,
                  });
                }, 3000);

              isLoginSuccess = true;
              getTodoCount();
              setIntervalF(); // dom补偿
              // _sendHeartbeat() // 启动心跳定时器
              // 定时获取工单数量
              let todoPollStopped = false;
              async function pollTodoCount() {
                if (todoPollStopped) return;

                try {
                  await getTodoCount();
                } catch (e) {
                  console.error("getTodoCount error", e);
                }

                setTimeout(pollTodoCount, 5 * 60 * 1000);
              }
              pollTodoCount();
            });
          shopInfoObserver.disconnect();
          break;
        }
      }
    }
  });
  shopInfoObserver.observe(document.body, { childList: true });
  //  查找list

  load();

  await webFrame.executeJavaScript(`(${insertScriptStr})()`);
  // await webFrame.executeJavaScript(`(${insertScriptStr2})()`)
  syncAutoOnlineBlockToPage();
  let visibilityTimer = null;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      visibilitychange = true;
      //  重新拉取数据
    } else {
      visibilitychange = false;
    }
  });
});
// 获取url参数
function getQueryParams(url) {
  try {
    const urlObj = new URL(url);

    let params = urlObj.searchParams;

    // ===== 处理 redirectUrl 嵌套 =====
    const redirectUrl = params.get("redirectUrl");

    if (redirectUrl) {
      try {
        const redirectUrlObj = new URL(redirectUrl);
        params = redirectUrlObj.searchParams;
      } catch (e) {
        console.warn("redirectUrl 解析失败，尝试兜底修复");

        // ===== 兜底（极端情况：没 encode）=====
        const fixed = redirectUrl.replace(/\+/g, "%2B");
        const redirectUrlObj = new URL(decodeURIComponent(fixed));
        params = redirectUrlObj.searchParams;
      }
    }

    // ===== 安全获取（修复 + 丢失问题）=====
    const safeGet = (key) => {
      let val = params.get(key);
      if (!val) return val;

      //  修复：+ 被浏览器转成空格
      // 这里只能“猜测修复”
      if (val.includes(" ")) {
        val = val.replace(/ /g, "+");
      }

      return val;
    };

    return {
      shopId: safeGet("shopId"),
      shopName: safeGet("shopName"),
    };
  } catch (e) {
    console.error("getQueryParams error:", e);
    return {
      shopId: null,
      shopName: null,
    };
  }
}
// 休眠
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
function load() {
  let waitDomStopped = false;

  function waitForConvTab() {
    if (waitDomStopped) return;

    const dom1 = document.querySelector(
      "#app > div > div.app-container > div.left-panel > div.content > div.conv-tab-wrapper > div > div.conv-today.sel",
    );

    if (!dom1) {
      // 没找到，继续等
      setTimeout(waitForConvTab, 200);
      return;
    }

    //  找到后只执行一次
    try {
      // 禁用搜索输入用户名
      const searchInput = document.querySelector(
        "#app > div > div.app-container > div.left-panel > div.content > div.operate-bar > div.search-box > input[type=text]",
      );

      if (searchInput) {
        searchInput.setAttribute("placeholder", '请点击右侧"+"号使用此功能');
        searchInput.disabled = true;
      }

      // 加载更多会话
      const loadMoreButton = document.getElementsByClassName("more-btn-box")[4];

      if (loadMoreButton && loadMoreButton.textContent.trim() === "加载更多会话") {
        loadMoreButton.click();
      }

      startShopStatusObserver();
    } catch (e) {
      console.error("waitForConvTab error", e);
    }

    // 终止等待
    waitDomStopped = true;
  }

  // 启动
  waitForConvTab();
}
function startShopStatusObserver() {
  const shopStatusObserver = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === "attributes" && mutation.attributeName === "class") {
        const statusClass = mutation.target.classList[1];
        if (statusClass !== "online") {
          // 如果开启了忙碌自动切换在线，且当前是忙碌状态，自动点击切换到在线
          ipcRenderer.send("shop-status-change", {
            status: statusClass === "offline" ? "离线" : "忙碌",
          });
        } else {
          ipcRenderer.send("shop-status-change", {
            status: "在线",
          });
        }
        break;
      }
    }
  });
  shopStatusObserver.observe(document.querySelector(".status"), observerConfig);
}

// 合并节流：500毫秒内收集所有新消息，500毫秒后批量发送
function createBatchThrottleSend(fn, interval = 500) {
  let timer = null;
  let batch = [];
  return function (messages) {
    // 合并去重
    if (Array.isArray(messages)) {
      batch.push(...messages);
    } else {
      batch.push(messages);
    }
    // 按messageId去重
    const map = new Map();
    batch.forEach((msg) => map.set(msg.messageId, msg));
    batch = Array.from(map.values());
    if (!timer) {
      timer = setTimeout(() => {
        fn(batch);
        batch = [];
        timer = null;
      }, interval);
    }
  };
}
const throttledSendCustomerMessageList = createBatchThrottleSend(async (data) => {
  // 只推送还在未回复区域的消息
  const filtered = [];
  // console.log('data', data)
  for (const msg of data) {
    const selector = `.chat-item-box[data-random^="${msg.messageId}"]`;
    const dom = document.querySelector(selector);
    if (dom) {
      // DOM存在，明确标记为false，触发状态重置
      msg.isNoTime = false;

      // 判断是否还有倒计时（表示未回复）
      // const timeElement =
      //   dom.querySelector('.chat-unreply-time') ||
      //   dom.querySelector('.chat-unreply-over-time')

      const content =
        dom.querySelector(".is-argue")?.textContent ||
        dom.querySelector(".chat-message-content")?.textContent ||
        "";

      // 如果存在倒计时元素，说明消息未回复，需要推送
      // if (content.includes('纠纷预警') || msg.argue) {
      if (msg.content?.includes("订单编号:")) {
        const match = msg.content.match(/:(\d+-\d+)/);
        if (match) msg.orderId = match[1];
      }
      // filtered.push(msg)
      // }
      filtered.push(msg);
    } else {
      // DOM不存在，标记为true，只标记不决定是否刷新
      msg.isNoTime = true;
      filtered.push(msg);
    }
  }

  if (filtered.length > 0) {
    // 模拟100条信息
    // filtered.forEach((msg) => {
    //   if (sendInsert) msg.type = 'code'
    // })
    ipcRenderer.send("get-customer-message-list", filtered);
  }
}, 500);
// 新增：统一推送去重和内容变化检测逻辑
// let pushedMessageIds = new Set()
// let pushedMessageContents = new Map()
// 新实现：只用一个 Map 存储 content 和 lastPushTime
let pushedMessageInfo = new Map();
function pushMessagesIfNeeded(messages) {
  const now = Date.now();
  // 先过滤掉 null/undefined，再判断是否需要推送
  const newOrChanged = messages
    .filter((msg) => msg && msg.messageId) // ✅ 过滤掉空值和没有messageId的消息
    .filter((msg) => {
      const info = pushedMessageInfo.get(msg.messageId);
      if (!info) return true;
      if (now - info.lastPushTime > 10000) return true;
      if (info.content !== msg.content) return true;
      return false;
    });

  if (newOrChanged.length) {
    throttledSendCustomerMessageList(newOrChanged);
    newOrChanged.forEach((msg) => {
      pushedMessageInfo.set(msg.messageId, {
        content: msg.content,
        lastPushTime: now,
      });
    });
  }
}
// 获取未回复消息
let isFirst = true; // 如果为true，则表示是第一次获取到未回复消息,第一次推list
async function getUnreplyMessage() {
  // 如果未回复消息数量增加了大于等于5个，则等待5秒，不然会出现获取到的未回复消息不全
  const data = Array.from(
    document.querySelectorAll(".five-minute")[0]?.querySelectorAll(".chat-item-box") || [],
  ).map((item) => ({
    username: item.querySelector(".nickname-span")?.textContent,
    isTimeout: false,
    timeNote: item.querySelector(".chat-unreply-time")?.textContent,
    content:
      item.querySelector(".is-argue")?.textContent ??
      item.querySelector(".chat-message-content")?.textContent,
    avatar: item.querySelector(".chat-portrait img")?.src,
    timeout: calculateTimeoutTimestamp(item.querySelector(".chat-unreply-time")?.textContent),
    messageId: item.getAttribute("data-random").split("-")[0],
  }));
  // 如果是第一次获取到未回复消息，则推list
  if (isFirst) {
    const message = data.concat(
      Array.from(
        document.querySelectorAll(".timeout-unreply")[0]?.querySelectorAll(".chat-item-box") || [],
      ).map((item) => ({
        username: item.querySelector(".nickname-span")?.textContent,
        isTimeout: true,
        // timeNote: item.querySelector('.chat-unreply-over-time')?.textContent,
        timeNote: "已超时",
        content: item.querySelector(".chat-message-content")?.textContent,
        avatar: item.querySelector(".chat-portrait img")?.src,
        timeout: null,
        messageId: item.getAttribute("data-random").split("-")[0],
      })),
    );
    // messageList.push.apply(messageList, message)
    isFirst = false;
    pushMessagesIfNeeded(message);
  } else {
    pushMessagesIfNeeded(data);
  }
}
// 递归定时器控制变量
let isPollingActive = true;
let pollingTimeoutId = null;
let forcont = 0;
const POLLING_INTERVAL = 5000;
// let linter = 0
let pullCont = 0;
let chekCont = 0;
let loginoutFlag = false;

//  消息获取
const combc = async () => {
  let data = [];
  const time = Math.floor(Date.now() / 1000);
  pullCont++;
  chekCont++;
  if (chekCont >= 60) {
    fetch(`https://mms.pinduoduo.com/chats/chatStatusUsers?csname=${info?.username}`, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
      },
      // obj:{}
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.length) {
          tryAutoSwitchOnline(res[res.length - 1].status, "status-history-check");
        }
      })
      .catch((err) => {
        console.log("err", err);
      });
    chekCont = 0;
  }

  if (pullCont >= 18) {
    window.postMessage({
      type: "pull-message",
    }); // 强行推送
    window.postMessage({
      type: "get-unreply-conversations",
    });
    pullCont = 0;
  }
  const loginout = document.querySelector(".layer-box p");
  // account-login-expired
  const text = loginout?.textContent || "";
  if (text && text.includes("登录已过期") && !loginoutFlag) {
    ipcRenderer.send("account-login-expired");
    loginoutFlag = true; //  店铺登录过期标识
  } else if (text && text.includes("账户在别处登录")) {
    ipcRenderer.send("account-login-other");
  }

  const alreadyUnreply = document.querySelectorAll(".already-unreply");

  const threeMinutes = document.querySelector(".five-minute");
  const timeOut = document.querySelector(".timeout-unreply");

  if (threeMinutes) {
    const alldom = threeMinutes.querySelectorAll(".chat-item-box");

    if (alldom && alldom.length > 0) {
      for (const item of alldom) {
        const obj = {
          username: item.querySelector(".nickname-span")?.textContent,
          isTimeout: false,
          timeNote: item.querySelector(".chat-unreply-time")?.textContent,
          content:
            item.querySelector(".is-argue")?.textContent ??
            item.querySelector(".chat-message-content")?.textContent,
          avatar: item.querySelector(".chat-portrait img")?.src,
          timeout: item.querySelector(".chat-unreply-time")?.textContent
            ? calculateTimeoutTimestamp(item.querySelector(".chat-unreply-time")?.textContent)
            : Math.floor(Date.now() / 1000), // 没有则使用当前时间
          messageId: item.getAttribute("data-random")?.split("-")[0],
        };
        if (obj.content.includes("[纠纷预警")) {
          // 为纠纷预警这类的弹窗 添加180秒超时倒计时
          obj.timeout = obj.timeout + 180;
        }
        if (!obj?.content?.includes("平台客服已处理本次售后")) data.push(obj);
      }
      console.log("data==========", data);
    }
  }

  // 第2步：获取超时消息数据
  if (timeOut) {
    const alldom = timeOut.querySelectorAll(".chat-item-box");
    if (alldom) {
      for (const item of alldom) {
        if (
          !item
            ?.querySelector(".chat-message-content")
            ?.textContent?.includes("平台客服已处理本次售后")
        )
          data.push({
            username: item.querySelector(".nickname-span")?.textContent,
            isTimeout: true,
            timeNote: "已超时",
            content: item.querySelector(".chat-message-content")?.textContent,
            avatar: item.querySelector(".chat-portrait img")?.src,
            timeout: time,
            messageId: item.getAttribute("data-random")?.split("-")[0],
          });
      }
    }
  }

  if (alreadyUnreply && !visibilitychange) {
    alreadyUnreply.forEach((item) => {
      const titleElement = item.querySelector(".chat-list-title");
      if (titleElement && titleElement.textContent.trim() === "已被自动回复") {
        const dom = item.querySelector(".chat-item-box");
        if (dom) triggerRealMouse(dom);
      }
    });
  }
  try {
    const alMessage = document.querySelectorAll(".already-unreply");
    for (let i = 0; i < alMessage.length; i++) {
      const element = alMessage[i];
      const titleElement = element.querySelector(".chat-list-title");
      if (titleElement && titleElement.textContent.trim() === "非工作时间留言") {
        for (let chatItem of element.querySelectorAll(".chat-item-box")) {
          try {
            if (
              !chatItem
                ?.querySelector(".chat-message-content")
                ?.textContent?.includes("平台客服已处理本次售后")
            )
              data.push({
                username: chatItem.querySelector(".nickname-span")?.textContent,
                isTimeout: true,
                timeNote: "非工作时间留言",
                content: chatItem.querySelector(".chat-message-content")?.textContent,
                avatar: chatItem.querySelector(".chat-portrait img")?.src,
                timeout: time,
                messageId: chatItem.getAttribute("data-random")?.split("-")[0],
              });
          } catch (error) {
            ipcRenderer.send("upload-server-log", {
              bugType: "error",
              bugContent: `拼多多解析非工作时间留言时出错:${error}`,
            });
          }
        }
        break;
      }
    }
  } catch (error) {
    ipcRenderer.send("upload-server-log", {
      bugType: "error",
      bugContent: `拼多多获取非工作时间留言时出错:${error}`,
    });
  }
  // const shopMessageCont = document.querySelector('.conv-today')

  if (data.length > 0) {
    // if (sendInsert) {
    //   data.forEach((item) => {
    //     item.type = 'code'
    //     item.source = 'dom'
    //   })
    // }
    for (const item of data) {
      if (!item.messageId) continue;
      const goodIdFromContent = extractGoodIdFromContent(item.content);
      if (goodIdFromContent) {
        item.goodId = goodIdFromContent;
      }
    }

    // 如果 obj 带有效订单状态，优先覆盖缓存
    ipcRenderer.send("get-customer-message-list", data);
  }
  const total = getMessageCont();
  ipcRenderer.send("get-message-total", total);
  return data;
};

const setIntervalF = async () => {
  await combc();
  setTimeout(() => {
    setIntervalF();
    // }, 10000)
  }, 10 * 1000);
};
// 递归轮询函数
const pollCustomerMessages = async () => {
  // 检查是否应该继续轮询
  if (!isPollingActive) {
    return;
  }
  let data = await combc();
  if (!data) data = (await getMessageByApi()) || [];
  // 第5步：推送消息
  try {
    pushMessagesIfNeeded(data);
  } catch (error) {
    ipcRenderer.send("upload-server-log", {
      bugType: "error",
      bugContent: `拼多多推送消息失败:${error}`,
    });
  }

  // 第6步：同步消息ID
  try {
    const currentIds = new Set(data.map((msg) => msg?.messageId).filter((id) => id));

    for (const id of Array.from(pushedMessageInfo.keys())) {
      if (!currentIds.has(id)) {
        pushedMessageInfo.delete(id);
      }
    }
  } catch (error) {
    console.warn("同步消息ID时出错:", error);
  }

  // 第7步：点击加载更多按钮
  try {
    const loadMoreButton = document.querySelectorAll(".more-unreply");
    for (let buttonContainer of loadMoreButton) {
      const btn = buttonContainer.querySelector("span:nth-child(2) > span");
      if (btn && btn.textContent.trim() === "加载未回复会话") {
        btn.click();
        window.postMessage({
          type: "get-unreply-conversations",
        });
      }
    }
  } catch (error) {
    console.warn("点击加载更多按钮时出错:", error);
  }

  // 第8步：检查登录状态
  try {
    if (isLoginSuccess) {
      const currentUrl = window.location.href;
      if (currentUrl.startsWith("https://mms.pinduoduo.com/login")) {
        isLoginSuccess = false;
        ipcRenderer.send("account-login-expired");
      }
    }
  } catch (error) {
    console.warn("检查登录状态时出错:", error);
  }
  if (forcont == 1 && linkonInsert) {
    console.log("初始化巡查结束", forcont);
  }
  // 如果轮询仍然活跃，设置下一次执行
  if (isPollingActive && forcont <= 1) {
    // 清除之前的定时器（虽然理论上不应该存在，但为了安全起见）
    if (pollingTimeoutId) {
      clearTimeout(pollingTimeoutId);
    }
    if (linkonInsert) {
      forcont++;
    }
    pollingTimeoutId = setTimeout(pollCustomerMessages, POLLING_INTERVAL);
  }
};

// 启动轮询
pollCustomerMessages();

// 提供停止轮询的方法（可以在需要时调用）
const stopPolling = () => {
  isPollingActive = false;
  if (pollingTimeoutId) {
    clearTimeout(pollingTimeoutId);
    pollingTimeoutId = null;
  }
  // console.log('客户消息轮询已停止')
};

let autoReplyLoopStopped = false;

// 提取 DOM 解析消息的逻辑
const parseMessageFromDOM = (item, isTimeout = false) => {
  return {
    username: item.querySelector(".nickname-span")?.textContent,
    isTimeout,
    timeNote: isTimeout ? "已超时" : item.querySelector(".chat-unreply-time")?.textContent,
    content: isTimeout
      ? item.querySelector(".chat-message-content")?.textContent
      : (item.querySelector(".is-argue")?.textContent ??
        item.querySelector(".chat-message-content")?.textContent),
    avatar: item.querySelector(".chat-portrait img")?.src,
    timeout: isTimeout
      ? null
      : calculateTimeoutTimestamp(item.querySelector(".chat-unreply-time")?.textContent),
    messageId: item.getAttribute("data-random")?.split("-")[0],
  };
};

// 接口获取
async function getMessageByApi() {
  // getUserInfoByUid(9025486792)
  // 提取公共的消息处理逻辑
  const processMessage = (item, uid, argue = false) => {
    // 只处理今天的消息
    if (!isToday(item.ts)) return null;

    const currentTime = Math.floor(Date.now() / 1000);
    const messageTime = Number(item.ts);
    const timeDiff = currentTime - messageTime;
    const isTimeout = timeDiff > 180;
    const remainingSeconds = Math.max(0, 180 - timeDiff);

    return {
      username: "游客",
      isTimeout,
      timeNote: isTimeout ? "已超时" : `${remainingSeconds}秒后超时`,
      content: item.content,
      avatar: "",
      timeout: messageTime + 180,
      messageId: uid,
      argue,
    };
  };

  try {
    const res = await fetch("https://mms.pinduoduo.com/plateau/chat/latest_conversations", {
      method: "POST",
      credentials: "include",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: 1,
        data: { offset: 0, size: 50 },
      }),
    }).then((res) => res.json());
    if (!res.success || !res.result?.conversations) return [];

    const { conversations } = res.result;
    // console.log('conversations', conversations)
    // 处理普通消息 (from.role === 'user')
    // 注意：no_unreply_hint=1 表示拼多多平台标记为"无需回复提示"的消息（通常是不友好言论）
    // https://mms.pinduoduo.com/plateau/chat/latest_conversations
    const normalMessages = conversations
      .filter((item) => {
        if (!item) return false;
        const isUser = item.from?.role === "user";
        const hint = item.no_unreply_hint ?? 0; // 没字段 = 当 0
        // 售后调解消息不过滤，即使 no_unreply_hint=1 也要弹窗
        const isAftersaleMediation = item.info?.key === "aftersale-mediation";
        return isUser && (hint == 0 || isAftersaleMediation);
      })
      .map((item) => processMessage(item, item.from?.uid))
      .filter((item) => item !== null);
    // 处理自动回复消息 (show_auto && to.role === 'user')
    let autoMessages = [];
    // if (!isPDDShowRobotReply) {
    // 将数据切片 查看
    const list1 = conversations.filter(
      (
        item, // 卖家
      ) => item.mallName !== mallName,
    );
    const list2 = list1.filter((item) => item.show_auto && item.to?.role === "user"); // 机器人

    autoMessages = list2
      .map((item) => processMessage(item, item.to?.uid, true)) // 数据处理
      .filter((item) => item !== null);
    // 拼多多有个很奇怪的现象，机器人回复了还会继续倒计时所以，要判断一下倒计时，如果有倒计时就算不弹机器人已回复也要弹窗
    autoMessages = autoMessages.filter((item) => {
      const msgItem = document.querySelector(`.chat-item-box[data-random^="${item.messageId}"]`);
      const hasCountdown =
        msgItem?.querySelector(".chat-unreply-time") ||
        msgItem?.querySelector(".chat-unreply-over-time");

      // 有倒计时必弹，没倒计时看配置
      return hasCountdown || !isPDDShowRobotReply;
    });
    return [...normalMessages, ...autoMessages];
  } catch (error) {
    console.log("error", error);
    // API 失败时降级到 DOM 解析
    const normalItems = Array.from(
      document.querySelectorAll(".five-minute")[0]?.querySelectorAll(".chat-item-box") || [],
    ).map((item) => parseMessageFromDOM(item, false));

    const timeoutItems = Array.from(
      document.querySelectorAll(".timeout-unreply")[0]?.querySelectorAll(".chat-item-box") || [],
    ).map((item) => parseMessageFromDOM(item, true));

    return [...normalItems, ...timeoutItems];
  }
}

// 根据用户id获取用户信息
async function getUserInfoByUid(uid) {
  const res = await fetch(`https://mms.pinduoduo.com/latitude/user/userInfoWithTags`, {
    method: "POST",
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "anti-content": antigain(),
    },
    body: JSON.stringify({
      uid,
    }),
  }).then((res) => res.json());
  if (res.errorCode === 1000000) {
    return {
      userName: res.result.nickname,
      avatar: res.result.avatar,
    };
  } else {
    return {
      userName: "",
      avatar: "",
    };
  }
}
// 判断是否为今天的时间函数（秒级时间戳）
const isToday = (timestamp) => {
  if (!timestamp) return false;
  // 秒级时间戳需要乘以1000转换为毫秒
  const messageDate = new Date(Number(timestamp) * 1000);
  const today = new Date();
  return (
    messageDate.getDate() === today.getDate() &&
    messageDate.getMonth() === today.getMonth() &&
    messageDate.getFullYear() === today.getFullYear()
  );
};

// 根据商品id获取商品信息
function getGoodsInfo(goodId, uid) {
  return fetch(`https://mms.pinduoduo.com/latitude/goods/recommendGoods`, {
    method: "POST",
    mode: "cors",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      goodId,
      uid,
      pageN: 1,
      pageSize: 10,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      return res.data;
    });
}
// 计算超时的时间戳
function calculateTimeoutTimestamp(timeoutString) {
  if (!timeoutString) {
    return "";
  }
  // 使用正则表达式提取秒数
  const match = timeoutString.match(/(\d+)秒/);
  if (match) {
    const seconds = parseInt(match[1], 10); // 获取秒数并转换为整数
    // 计算超时的时间戳
    const timeoutTimestamp = Math.floor(Date.now() / 1000) + seconds; // 当前时间戳（秒） + 秒数
    return timeoutTimestamp;
  } else {
    return timeoutString;
  }
}
const mouseDown = new MouseEvent("mousedown", {
  bubbles: true,
  cancelable: true,
  view: window,
});
const mouseUp = new MouseEvent("mouseup", {
  bubbles: true,
  cancelable: true,
  view: window,
});
const enterDownEvent = new KeyboardEvent("keydown", {
  key: "Enter",
  keyCode: 13,
  which: 13,
  bubbles: false,
});

const enterUpEvent = new KeyboardEvent("keyup", {
  key: "Enter",
  keyCode: 13,
  which: 13,
  bubbles: false,
});
const clickEvent = new MouseEvent("click", {
  bubbles: true,
  cancelable: true,
  view: window,
});
// 创建节流版本的点击客户消息处理函数
const throttledClickCustomerMessage = throttle((args) => {
  // 点击个人订单
  const personalOrder = document.querySelector(
    "#right-panel > div.content > div > ul > li:nth-child(2)",
  );
  if (personalOrder) {
    personalOrder.click();
  }
  // 点击对应的消息
  const dom = document.querySelector(`.chat-item-box[data-random^="${args.messageId}"]`);
  if (!dom && !linkonInsert) {
    // 如果是 写入js 的方式 写入成功则不执行  如果 使用原 5s 轮询 则保持原方式
    // alert('未找到对应的消息，请点击全部会话中的咨询下单等选项刷新')
    // 刷新页面
    // window.location.reload()
    const shopMessageCont = document.querySelector(".conv-today");
    let total = 0;
    if (shopMessageCont) {
      if (shopMessageCont.textContent) {
        const match = shopMessageCont.textContent.match(/\((\d+)\)/);
        total = match[1] || 0;
      }
    }
    ipcRenderer.send("reply-customer-message", {
      messageId: args.messageId,
      sendTarget: "pdd1",
      shopMsgTotal: total,
    });
    return;
  }

  dom.dispatchEvent(mouseDown);
  dom.dispatchEvent(mouseUp);
  // 给输入框焦点
  const replyTextarea = document.getElementById("replyTextarea");
  replyTextarea?.blur(); // 先失去焦点，不然输入法打第一个字符会自动回车
  replyTextarea?.focus();
}, 500); // 0.5秒内最多执行一次，防止频繁点击

safeIpcOn("click-customer-message", (_, args) => {
  throttledClickCustomerMessage(args);
});
// 获取店铺体验分
safeIpcOn("get-shop-experience-score", (_) => {
  getShopExperienceScore();
});

// 获取店铺的状态
safeIpcOn("get-shop-status", (_) => {
  // 获取dom元素
  const dom = document.querySelector(".status");
  if (dom) {
    // 取出这个dom的全部class
    const clalist = dom.getAttribute("class");
    let status = "离线";
    if (clalist.includes("offline")) {
      status = "离线";
    } else if (clalist.includes("busy")) {
      status = "忙碌";
    } else {
      status = "在线";
    }
    ipcRenderer.send("shop-status-change", { status });
  }
});

// 检测输入框状态
safeIpcOn("getShopInputStatus", (_, shopId) => {
  try {
    // 获取输入框元素
    const replyTextarea = document.getElementById("replyTextarea");
    if (replyTextarea) {
      // 检查输入框是否有内容
      const hasContent = replyTextarea.value && replyTextarea.value.trim().length > 0;

      const userIsOperating = (windowHasFocus && isUserOperating) || hasContent;

      const currentUserId = document.querySelector(".msg-content").getAttribute("currentuid");

      // 发送输入框状态回主进程
      ipcRenderer.send("shopInputStatus", {
        shopId: shopId,
        hasContent: userIsOperating,
        currentUserId,
      });
    } else {
      // 如果找不到输入框，默认认为没有内容
      ipcRenderer.send("shopInputStatus", {
        shopId: shopId,
        hasContent: false,
      });
    }
  } catch (error) {
    console.error(`检测店铺 ${shopId} 输入框状态失败:`, error);
    // 出错时默认认为没有内容
    ipcRenderer.send("shopInputStatus", {
      shopId: shopId,
      hasContent: false,
    });
  }
});
// 获取对应店铺的体验分
const getShopExperienceScore = () => {
  fetch("https://mms.pinduoduo.com/sydney/api/mallService/getMallServeScoreV2", {
    mode: "cors",
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })
    .then((_res) => _res.json())
    .then((_res) => {
      const { errorCode, success, result } = _res;
      if (errorCode === 1000000 && success) {
        if (result) {
          ipcRenderer.send("getShopExperienceScore", result);
        }
      }
    });
};
// 获取工单数量
const getTodoCount = () => {
  // 获取待处理工单数量
  fetch("https://mms.pinduoduo.com/strickland/sop/mms/statusCount", {
    mode: "cors",
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })
    .then((_res) => _res.json())
    .then((_res) => {
      const { errorCode, success, result } = _res;
      if (errorCode === 1000000 && success) {
        const data = result.filter((item) => item.status === 0);
        const unprocessedWorkOrder = data.length ? data[0].count : 0;
        // if (unprocessedWorkOrder > 0) {
        getTodoList(unprocessedWorkOrder);
        // }
      }
    });
};
// 获取工单列表
const getTodoList = (count) => {
  fetch("https://mms.pinduoduo.com/strickland/sop/mms/todoList", {
    mode: "cors",
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serviceStatus: [0],
      problemType: [null],
      createStartTime: Math.floor(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0) / 1000,
      ),
      createEndTime: Math.floor(new Date(new Date().setHours(23, 59, 59, 0)).getTime() / 1000),
      pageNum: 1,
      pageSize: count < 10 ? 10 : count,
    }),
  })
    .then((_res) => _res.json())
    .then((_res) => {
      const { errorCode, success, result } = _res;
      if (errorCode === 1000000 && success) {
        ipcRenderer.send("get-todo-list", result.dataList || []);
      }
    });
};
// todo 定时fetch('https://mms.pinduoduo.com/chats/userinfo/realtime?get_response=true')来判断是否退出登录

let message;
let isProcessing = false;
// 获取条数计数

const preloadOrderAndGoodsByNeedOrder = async (item) => {
  if (!shopId || !item) return;
  try {
    await ipcRenderer.invoke("enrich-user-profile", {
      shopId: Number(shopId),
      item,
    });
  } catch (error) {
    console.log("[needOrder] pdd主动拉取订单商品失败:", error);
  }
};

safeIpcOn("reply-message", (_, args) => {
  let data = [];
  try {
    // 是不是对象
    if (typeof args === "object") {
      data = [...args];
    } else {
      const sendlist = JSON.parse(args);
      data = sendlist;
    }
  } catch {
    if (args.isBottomLineAutoReply) {
      data = [...args];
    }
  }
  if (data.length > 0) {
    if (sendInsert && data[0].messageId) {
      // 发送
      const item = data[0];
      const time = Date.now();
      const replyResult = {
        ...item,
        messageId: item.messageId || item.userId,
        userId: item.userId || item.messageId,
        isAiAutoReply: !item.isBottomLineAutoReply,
        isBottomLineAutoReply: item.isBottomLineAutoReply || false,
        isReminderReply: item?.isReminderReply || false,
        isAiInviteReply: item?.isAiInviteReply || false,
      };
      if (data[0]?.imageBase64 || data[0]?.imageUrl) {
        if (data[0]?.imageBase64) {
          sendImageToUser(data[0].imageBase64, item.messageId || item.userId);
        } else {
          imageUrlToBase64(data[0].imageUrl)
            .then((imageResult) => {
              sendImageToUser(imageResult.base64, item.messageId || item.userId);
            })
            .catch((error) => {
              console.error("[图片发送] 下载图片失败:", error);
            });
        }
      }
      // 如果needOrder >=3的话就主动去获取一次商品信息
      if (item?.needOrder && item?.needOrder >= 3) {
        // 主动拿一次订单和商品并存在db里面
        preloadOrderAndGoodsByNeedOrder(item);
      }
      window.postMessage(
        {
          type: "SET_AI_REPLY_INFO",
          data: replyResult,
        },
        "*",
      );
      setTimeout(() => {
        window.postMessage(
          {
            type: "send-message",
            data: {
              cmd: "send_message",
              anti_content: antigain(), // 可以不带内部会自动生成
              request_id: time,
              message: {
                to: {
                  role: "user",
                  uid: data[0].messageId,
                },
                from: {
                  role: "mall_cs",
                },
                ts: time,
                content: data[0].replyContent,
                msg_id: null,
                type: 0,
                is_aut: 0,
                manual_reply: 1,
                status: "read",
                is_read: 1,
                // hash: '1ad1ca41db07190786d4ba1984ee1f7d6d246d2410585a72e7dc9addeda2f027'
              },
              // random: 'fab0ff22ae348ead71e916c464b9526e'
            },
          },
          "*",
        );
      }, 500);
    }
    // else {
    //   for (let item of data) {
    //     // 如果needOrder >=3的话就主动去获取一次商品信息
    //     if (item?.needOrder && item?.needOrder >= 3) {
    //       // 主动拿一次订单和商品并存在db里面
    //       preloadOrderAndGoodsByNeedOrder(item)
    //     }
    //     window.postMessage(
    //       {
    //         type: 'SET_AI_REPLY_INFO',
    //         data: {
    //           messageId: item.messageId || item.userId,
    //           userId: item.userId,
    //           isAiAutoReply: !item.isBottomLineAutoReply,
    //           isBottomLineAutoReply: item.isBottomLineAutoReply || false,
    //           isReminderReply: item?.isReminderReply || false,
    //           isAiInviteReply: item?.isAiInviteReply || false
    //         }
    //       },
    //       '*'
    //     )
    //   }
    //   processNextMessage(data)
    // }
  }
});
// 串行处理消息
const processNextMessage = async (sendlist) => {
  if (isProcessing || sendlist.length === 0) {
    //   // 处理完成返回
    //   // console.log('处理完成=========>', message)
    //   if (message.isAiInviteReply) {
    //     ipcRenderer.send('reply-aiinvite-customer-message', {
    //       ...message,
    //       isAiInviteReply: true
    //     })
    //   } else if (message.isReminderReply) {
    //     ipcRenderer.send('reply-reminder-customer-message', {
    //       ...message,
    //       isReminderReply: true
    //     })
    //   } else if (message.isBottomLineAutoReply) {
    //     // 兜底
    //
    //     ipcRenderer.send('reply-bottom-line-customer-message', {
    //       ...message,
    //       isBottomLineAutoReply: true
    //     })
    //
    //   } else {
    //     ipcRenderer.send('reply-ai-auto-customer-message', {
    //       ...message,
    //       messageId: message.messageId,
    //       isAiAutoReply: true
    //     })
    //   }
    return;
  }

  isProcessing = true;
  const args = sendlist.shift(); // 将数据从数组中排出
  message = args;
  await handleReplyMessage(args)
    .catch((err) => console.error("处理消息异常", err))
    .finally(async () => {
      isProcessing = false;
      await ms_delay(100); // 等待一小会
      processNextMessage(sendlist); // 串行处理下一条
    });
};
// 开始处理单条信息
const handleReplyMessage = async (args) => {
  const dom = document.querySelector(`.chat-item-box[data-random^="${args.messageId}"]`);

  if (!dom) {
    // alert('未找到对应的消息，请点击全部会话中的咨询下单等选项刷新')
    // ipcRenderer.postMessage('clear-no-message', {
    //   userId: args.userId || args.messageId,
    //   messageId: args.messageId
    // })
    // 撤销 AI 回复标记
    window.postMessage({ type: "CLEAR_AI_REPLY_INFO", data: { messageId: args.messageId } }, "*");
    return;
  }

  // 如果是兜底回复，进行特殊判断
  if (args.isBottomLineAutoReply) {
    // 判断1: 当前页面是否选中（页面可见时不回复）
    if (_key) {
      // 撤销 AI 回复标记
      window.postMessage({ type: "CLEAR_AI_REPLY_INFO", data: { messageId: args.messageId } }, "*");
      return;
    }

    // 判断2: 检查消息是否已被回复（通过 data-random 是否包含 -reply）
    const dataRandom = dom.getAttribute("data-random");
    if (dataRandom && dataRandom.includes("-reply")) {
      // 撤销 AI 回复标记
      window.postMessage({ type: "CLEAR_AI_REPLY_INFO", data: { messageId: args.messageId } }, "*");
      return;
    }
  }
  dom.dispatchEvent(mouseDown);
  dom.dispatchEvent(mouseUp);
  await ms_delay(500);
  // 判断是否是图片信息
  if (args?.imageBase64 || args?.imageUrl) {
    await sendImageMessage(args.messageId, args.imageBase64, args.imageMimeType, args.imageUrl);
  }
  // 给输入框焦点
  const replyTextarea = document.getElementById("replyTextarea");
  replyTextarea.blur(); // 先失去焦点，不然输入法打第一个字符会自动回车
  replyTextarea.focus();
  replyTextarea.value = args.replyContent;
  replyTextarea.dispatchEvent(new Event("input", { bubbles: false }));
  // if (args.autoSendAiReply) {
  // 保存兜底标记

  // const isBottomLineAutoReply = args.isBottomLineAutoReply === true
  replyTextarea.dispatchEvent(enterDownEvent);
  replyTextarea.dispatchEvent(enterUpEvent);
  await ms_delay(500);
  // 判断是否有警告
  const warningDom = document.querySelector(".repeat-interceptor-popup");
  if (warningDom) {
    // 直接选择按钮元素
    const continueBtn = warningDom.querySelector("button");
    if (continueBtn) {
      continueBtn.click();
    }
  }
  await ms_delay(500);
  if (replyTextarea.value === "") {
    // 信息为空
    return;
  }
  // }
};

// ============ 图片发送功能 ============
// 监听图片发送消息
safeIpcOn("send-image-message", async (_, args) => {
  console.log("[图片发送] 收到图片发送请求:", args);
  const { messageId, imageBase64, imageMimeType, imageUrl } = args;

  try {
    await sendImageMessage(messageId, imageBase64, imageMimeType, imageUrl);
  } catch (error) {
    console.error("[图片发送] 图片发送失败:", error);
  }
});

async function imageUrlToBase64(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`下载图片失败: ${response.status}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      resolve({
        base64: dataUrl.split(",")[1],
        mimeType: blob.type || "image/jpeg",
      });
    };
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.readAsDataURL(blob);
  });
}

// 发送图片消息
async function sendImageMessage(messageId, imageBase64, imageMimeType, imageUrl) {
  // // 1. 先切换到对应会话
  // const dom = document.querySelector(
  //   `.chat-item-box[data-random^="${messageId}"]`
  // )

  // if (!dom) {
  //   console.error('[图片发送] 未找到对应的消息DOM:', messageId)
  //   return false
  // }

  // dom.dispatchEvent(mouseDown)
  // dom.dispatchEvent(mouseUp)
  // await ms_delay(500)

  // 2. 找到隐藏的图片上传 input
  const fileInput = document.querySelector('input[type="file"][accept*="image"]');
  if (!fileInput) {
    console.error("[图片发送] 未找到图片上传input");
    return false;
  }

  if (!imageBase64 && imageUrl) {
    const result = await imageUrlToBase64(imageUrl);
    imageBase64 = result.base64;
    imageMimeType = imageMimeType || result.mimeType;
  }
  if (!imageBase64 || !imageMimeType) {
    console.error("[图片发送] 缺少图片数据");
    return false;
  }

  // 3. base64 转 File
  const byteCharacters = atob(imageBase64);
  const byteArray = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }
  const blob = new Blob([byteArray], { type: imageMimeType });
  const ext = imageMimeType.split("/")[1] || "jpg";
  const file = new File([blob], `image_${Date.now()}.${ext}`, {
    type: imageMimeType,
  });

  // 4. 用 DataTransfer 设置文件
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;

  // 5. 触发 change 事件
  fileInput.dispatchEvent(new Event("change", { bubbles: true }));

  // 6. 轮询检测图片发送确认弹窗并自动点击发送
  let checkCount = 0;
  const maxChecks = 20; // 最多检测20次，共2秒
  const checkInterval = setInterval(() => {
    checkCount++;
    const modal = document.querySelector(".modal");
    if (modal) {
      const header = modal.querySelector(".modal-header");
      if (header && header.textContent?.includes("是否发送图片")) {
        const sendBtn = modal.querySelector(".btn-ok");
        if (sendBtn) {
          sendBtn.click();
          // 点击后删除弹窗
          setTimeout(() => {
            if (modal.parentNode) {
              modal.parentNode.removeChild(modal);
            }
          }, 100);
        }
        clearInterval(checkInterval);
        return;
      }
    }
    if (checkCount >= maxChecks) {
      clearInterval(checkInterval);
    }
  }, 100);
  return true;
}

// 打开工单列表
safeIpcOn("open-todo-list", (_, id) => {
  const link = document.createElement("a");

  // 'https://mms.pinduoduo.com/aftersales/work_order/list?msfrom=mms_sidenav'
  link.href = `https://mms.pinduoduo.com/aftersales/work_order/tododetail?id=${id}`;
  link.target = "_blank";
  link.click();
});
// 星标
// 星标
safeIpcOn("star", (e, data) => {
  const starDom = document.querySelector('[title="收藏该用户"]');

  if (data && data?.type == "AI" && starDom) {
    //  如果是ai  识别 则需要先判断是否是已有星标
    if (!starDom.classList.contains("active")) {
      starDom.click();
    }
  } else if (starDom) {
    starDom.click();
  }
});
// 上下线
safeIpcOn("change-shop-status", (_, status) => {
  console.log("change-shop-status");
  // 获取dom
  const dom = getStatusMenuDom();
  if (dom) {
    // 上线
    if (status === "online") {
      const liDom = dom.querySelector("li");
      if (liDom) {
        triggerStatusOptionClick(liDom);
      }
    } else if (status === "offline") {
      // 下线，最后一个li
      const liDom = dom.querySelectorAll("li")[dom.querySelectorAll("li").length - 1];
      if (liDom) {
        triggerStatusOptionClick(liDom);
      }
    } else {
      // 忙碌，第二个个li
      const liDom = dom.querySelectorAll("li")[dom.querySelectorAll("li").length - 2];
      if (liDom) {
        triggerStatusOptionClick(liDom);
      }
    }
  }
});
// 获取商品详情
safeIpcOn("get-goods-detail", async (_, args) => {
  let paramsArray = [];
  const promises = args.ids.map(async (id) => {
    // 获取商品详情
    const good = await processGoodsDetail(id, args);

    return good;
  });
  paramsArray = await Promise.all(promises);
  ipcRenderer.send("get-goods-detail", paramsArray);
});
// 根据商品id爬取
// safeIpcOn('get-goods-detail-by-id', async (_, args) => {
//   let paramsArray = []
//   console.log('根据商品id爬取', args)
//   return // todo
//   const promises = [args.ids].map(async (id) => {
//     // 获取商品详情
//     const good = await processGoodsDetail(id)
//     console.log(' 获取商品详情', id, good)
//     paramsArray.push(good)
//     return paramsArray
//   })
//   const result = await Promise.all(promises)
//   console.log('11111111111', result)
//   ipcRenderer.send('goods-crawl-complete', result)
// })

// 获取全部商品详情
safeIpcOn("get-goods-all-detail", async (_, args) => {
  getGoodsList(args);
});

async function getGoodsList(args) {
  try {
    // 第一步：获取总条数
    const firstPageRes = await fetch(
      // 'https://mms.pinduoduo.com/vodka/v2/mms/query/display/mall/goodsList',
      "https://mms.pinduoduo.com/latitude/goods/recommendGoods",
      {
        mode: "cors",
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // body: JSON.stringify({
        //   is_onsale: 1,
        //   out_goods_sn_gray_flag: true,
        //   page: 1,
        //   pre_sale_type: 4,
        //   shipment_time_type: 3,
        //   size: 100,
        //   sold_out: 0
        // })
        body: JSON.stringify({
          pageNum: 1,
          pageSize: 50,
          uid: "",
        }),
      },
    );
    const firstPageData = await firstPageRes.json();
    if (!firstPageData.success) {
      console.error("获取商品列表失败:", firstPageData);
      return;
    }
    const total = firstPageData.result.total;
    // 发送总条数
    ipcRenderer.send("get-goods-all-detail-total", {
      userId: args.userId,
      total: total,
    });
    // console.log(`总共有 ${total} 个商品`)
    // 计算需要请求的页数
    const pageSize = 50;
    const totalPages = Math.ceil(total / pageSize);
    // console.log(`需要请求 ${totalPages} 页`)
    // 第二步：边获取列表边处理详情
    // 先处理第一页的商品
    if (firstPageData.result.onSaleGoods) {
      // console.log(
      //   `第 1 页获取到 ${firstPageData.result.goods_list.length} 个商品，开始处理详情`
      // )
      // 判断第一页是否也是最后一页
      const isFirstPageLastBatch = totalPages === 1;

      await processBatchGoods(firstPageData.result.onSaleGoods, 1, args, isFirstPageLastBatch);
    }
    // 循环获取剩余页面并立即处理
    for (let page = 2; page <= totalPages; page++) {
      try {
        const pageRes = await fetch("https://mms.pinduoduo.com/latitude/goods/recommendGoods", {
          mode: "cors",
          credentials: "include",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            pageNum: page,
            pageSize: pageSize,
            uid: "",
          }),
        });
        const pageData = await pageRes.json();
        if (pageData.success && pageData.result.onSaleGoods) {
          // 判断是否为最后一页
          const isLastBatch = page === totalPages;
          await processBatchGoods(pageData.result.onSaleGoods, page, args, isLastBatch);
        }
        // 添加延迟避免请求过快
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`获取第 ${page} 页商品列表失败:`, error);
      }
    }
    // 处理商品详情的函数
    async function processBatchGoods(goodsItems, pageNum, args, isLastBatch = false) {
      try {
        // 串行处理商品详情，每个商品间隔30秒
        const batchResults = [];
        for (let i = 0; i < goodsItems.length; i++) {
          const goodId = goodsItems[i].goodsId;
          const result = await processGoodsDetail(goodId, args, isLastBatch);
          if (result) {
            batchResults.push(result);
          }
          // 如果不是最后一个商品，等待30秒
          if (i < goodsItems.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        }
        // 一页处理完后，批量发送所有商品详情数据
        if (batchResults.length > 0) {
          ipcRenderer.send("get-goods-detail", batchResults);
          // console.log(
          //   `第 ${pageNum} 页处理完成，批量发送 ${batchResults.length} 个商品详情${isLastBatch ? '（最后一批）' : ''}`
          // )
        }
        // 添加页面间延迟避免请求过快
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`处理第 ${pageNum} 页时出错:`, error);
      }
    }
    // 处理单个商品详情的函数
  } catch (error) {
    console.error("获取全部商品详情时出错:", error);
  }
}

// 根据商品ID获取商品详情
async function processGoodsDetail(Id, args, isLastBatch = false) {
  try {
    // 获取商品详情
    const detailRes = await fetch(
      "https://mms.pinduoduo.com/glide/v2/mms/query/commit/on_shop/detail",
      {
        mode: "cors",
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goods_id: Id,
        }),
      },
    );
    // 获取商品属性
    const propertyRes = await fetch("https://mms.pinduoduo.com/draco-ms/mms/query-goods-property", {
      mode: "cors",
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ goods_id: Id }),
    });
    const detailData = await detailRes.json();
    const propertyData = await propertyRes.json();
    if (!detailData.success || !detailData.result) {
      console.warn(`商品 ${item.goodsId} 详情获取失败`);
      return null;
    }
    const data = detailData.result;
    // 处理商品SKU信息
    let goodSku = [];
    const skus = detailData?.result?.skus;

    // 存在 SKU 数据才处理
    if (skus?.length > 0) {
      // 用于存储规格分组
      const specGroupMap = {};

      // 遍历所有 SKU
      for (const skuItem of skus) {
        // 遍历当前 SKU 的规格
        skuItem.spec?.forEach((spec) => {
          // 规格组名称
          // 例如：颜色分类、尺码大小
          const groupName = spec.parent_name;

          // 规格值
          // 例如：白色、3XL
          const specValue = spec.spec_name;

          // 过滤空数据
          if (!groupName || !specValue) return;

          // 不存在则初始化 Set
          if (!specGroupMap[groupName]) {
            specGroupMap[groupName] = new Set();
          }

          // Set 自动去重
          specGroupMap[groupName].add(specValue);
        });
      }

      // 转成数组格式
      // 最终：
      // [
      //   "颜色分类:白色/黑色",
      //   "尺码大小:3XL/2XL"
      // ]
      goodSku = Object.entries(specGroupMap).map(([groupName, specSet]) => {
        // Set 转数组后用 / 拼接
        const specValues = [...specSet].join("/");

        // 返回：
        // 颜色分类:白色/黑色
        return `${groupName}:${specValues}`;
      });
    }
    // 处理商品类目

    const goodCat = data.cats ? [...new Set(data.cats.filter(Boolean))].join("/") : "";
    // 处理商品属性
    let goodProperties = "";

    if (propertyData.success && propertyData.result && propertyData.result.goods_properties) {
      const properties = propertyData.result.goods_properties;
      goodProperties = properties
        .map((prop) => {
          if (prop.values && prop.values.length > 0) {
            const values = prop.values.map((val) => val.value).join(",");
            return `${prop.name}:${values}`;
          }
          return "";
        })
        .filter((str) => str !== "");
    }
    const result = {
      goodId: data.goods_id,
      goodName: data.goods_name,
      detailImages: data.detail_gallery ? data.detail_gallery.map((urlItem) => urlItem.url) : [],
      mainImage: data.thumb_url,
      type: args?.type,
      id: args?.id,
      goodProperties,
      goodCat,
      goodSku,
    };
    // 只有最后一批才添加 aiTaskId
    if (isLastBatch && args?.aiTaskId) {
      result.aiTaskId = args?.aiTaskId;
    }
    return result;
  } catch (error) {
    console.error(`处理商品 ${Id}  时出错:`, error);
    return null;
  }
}

safeIpcOn("init-shop-info", (_, args) => {
  // 先获取商品列表
  fetch("https://mms.pinduoduo.com/earth/api/merchant/queryMerchantInfoByMallId", {
    mode: "cors",
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anti-content": antigain(),
    },
  })
    .then((_res) => _res.json())
    .then((_res) => {
      const { errorCode, success, result } = _res;
      if (errorCode === 1000000 && success) {
        // console.log(result)
        const goodsList = result.categoryStr;
        const params = {
          shopClass: goodsList,
          goodName: "",
        };
        ipcRenderer.send("init-shop-info", params);
      }
    });
});
// 收到设置AI是否回复
safeIpcOn("set-ai-to-human-reply", () => {
  // console.log('收到设置AI是否回复')
  Array.from(document.querySelectorAll(".chat-list")[0]?.querySelectorAll(".active") || []).map(
    (item) => {
      // 给主进程发送选中的消息id
      if (item.getAttribute("data-random")) {
        ipcRenderer.send("set-ai-to-human-reply-customer", {
          messageId: item.getAttribute("data-random").split("-")[0],
        });
      }
    },
  );
});
//   }
// })
// console.log(args)
// })
window.addEventListener("error", (event) => {
  console.error("全局错误", event);
  reportGlobalPreloadError("全局错误", event.error || event);
});
window.addEventListener("unhandledrejection", (event) => {
  console.error("未捕获的promise错误", event);
  reportGlobalPreloadError("未捕获的promise错误", event.reason || event);
});

function antigain() {
  var xx;
  !(function (e) {
    function t(t) {
      for (var n, o, a = t[0], f = t[1], i = t[2], u = 0, s = []; u < a.length; u++)
        ((o = a[u]),
          Object.prototype.hasOwnProperty.call(d, o) && d[o] && s.push(d[o][0]),
          (d[o] = 0));
      for (n in f) Object.prototype.hasOwnProperty.call(f, n) && (e[n] = f[n]);
      for (l && l(t); s.length; ) s.shift()();
      return (c.push.apply(c, i || []), r());
    }
    function r() {
      for (var e, t = 0; t < c.length; t++) {
        for (var r = c[t], n = !0, o = 1; o < r.length; o++) {
          var f = r[o];
          0 !== d[f] && (n = !1);
        }
        n && (c.splice(t--, 1), (e = a((a.s = r[0]))));
      }
      return e;
    }
    var n = {},
      o = {
        21: 0,
      },
      d = {
        21: 0,
      },
      c = [];
    function a(t) {
      if (n[t]) return n[t].exports;
      var r = (n[t] = {
        i: t,
        l: !1,
        exports: {},
      });
      return (e[t].call(r.exports, r, r.exports, a), (r.l = !0), r.exports);
    }
    ((a.e = function (e) {
      var t = [];
      o[e]
        ? t.push(o[e])
        : 0 !== o[e] &&
          {
            1: 1,
            10: 1,
            11: 1,
            12: 1,
            14: 1,
            15: 1,
            17: 1,
          }[e] &&
          t.push(
            (o[e] = new Promise(function (t, r) {
              for (
                var n =
                    "static/css/" +
                    ({
                      7: "AccountCenter",
                      8: "Activity",
                      9: "BestGoods",
                      10: "Cart",
                      11: "GoodsDetail",
                      12: "GoodsDropShipping",
                      13: "Home",
                      14: "Mall",
                      15: "MallSearch",
                      16: "NotFound",
                      17: "Order",
                      18: "Payment",
                      19: "Search",
                    }[e] || e) +
                    "." +
                    {
                      0: "31d6cfe0d",
                      1: "1bb732cb7",
                      2: "31d6cfe0d",
                      3: "31d6cfe0d",
                      4: "31d6cfe0d",
                      5: "31d6cfe0d",
                      6: "31d6cfe0d",
                      7: "31d6cfe0d",
                      8: "31d6cfe0d",
                      9: "31d6cfe0d",
                      10: "86909bf59",
                      11: "1405928aa",
                      12: "9eff41d5d",
                      13: "31d6cfe0d",
                      14: "941e90c52",
                      15: "86909bf59",
                      16: "31d6cfe0d",
                      17: "07dca30ce",
                      18: "31d6cfe0d",
                      19: "31d6cfe0d",
                      23: "31d6cfe0d",
                      24: "31d6cfe0d",
                      25: "31d6cfe0d",
                      26: "31d6cfe0d",
                      27: "31d6cfe0d",
                      28: "31d6cfe0d",
                      29: "31d6cfe0d",
                      30: "31d6cfe0d",
                    }[e] +
                    ".chunk.css",
                  o = a.p + n,
                  d = document.getElementsByTagName("link"),
                  c = 0;
                c < d.length;
                c++
              ) {
                var f = (u = d[c]).getAttribute("data-href") || u.getAttribute("href");
                if ("stylesheet" === u.rel && (f === n || f === o)) return t();
              }
              var i = document.getElementsByTagName("style");
              for (c = 0; c < i.length; c++) {
                var u;
                if ((f = (u = i[c]).getAttribute("data-href")) === n || f === o) return t();
              }
              var l = document.createElement("link");
              ((l.rel = "stylesheet"),
                (l.type = "text/css"),
                (l.onload = t),
                (l.onerror = function (t) {
                  var n = (t && t.target && t.target.src) || o,
                    d = new Error("Loading CSS chunk " + e + " failed.\n(" + n + ")");
                  ((d.request = n), r(d));
                }),
                (l.href = o),
                document.getElementsByTagName("head")[0].appendChild(l));
            }).then(function () {
              o[e] = 0;
            })),
          );
      var r = d[e];
      if (0 !== r)
        if (r) t.push(r[2]);
        else {
          var n = new Promise(function (t, n) {
            r = d[e] = [t, n];
          });
          t.push((r[2] = n));
          var c,
            f = document.createElement("script");
          ((f.charset = "utf-8"),
            (f.timeout = 120),
            a.nc && f.setAttribute("nonce", a.nc),
            (f.src = (function (e) {
              return (
                a.p +
                "static/js/" +
                ({
                  7: "AccountCenter",
                  8: "Activity",
                  9: "BestGoods",
                  10: "Cart",
                  11: "GoodsDetail",
                  12: "GoodsDropShipping",
                  13: "Home",
                  14: "Mall",
                  15: "MallSearch",
                  16: "NotFound",
                  17: "Order",
                  18: "Payment",
                  19: "Search",
                }[e] || e) +
                "." +
                {
                  0: "73affeb9",
                  1: "95bcd243",
                  2: "90790f29",
                  3: "83215cc2",
                  4: "2e05c9fd",
                  5: "376319a7",
                  6: "989946a6",
                  7: "122ef4b3",
                  8: "d2665e11",
                  9: "29797479",
                  10: "6db25d59",
                  11: "df6df89f",
                  12: "658d2efd",
                  13: "86e1d209",
                  14: "f7561289",
                  15: "7c394e98",
                  16: "9c3fd526",
                  17: "6949727a",
                  18: "1dc52d10",
                  19: "70cc3637",
                  23: "d6a6042a",
                  24: "ced7d2c9",
                  25: "58cc2a86",
                  26: "71745484",
                  27: "d470dd7f",
                  28: "e5189849",
                  29: "d67ed71c",
                  30: "d20b68bc",
                }[e] +
                ".chunk.v20240716150741_849ca94f.js"
              );
            })(e)));
          var i = new Error();
          c = function (t) {
            ((f.onerror = f.onload = null), clearTimeout(u));
            var r = d[e];
            if (0 !== r) {
              if (r) {
                var n = t && ("load" === t.type ? "missing" : t.type),
                  o = t && t.target && t.target.src;
                ((i.message = "Loading chunk " + e + " failed.\n(" + n + ": " + o + ")"),
                  (i.name = "ChunkLoadError"),
                  (i.type = n),
                  (i.request = o),
                  r[1](i));
              }
              d[e] = void 0;
            }
          };
          var u = setTimeout(function () {
            c({
              type: "timeout",
              target: f,
            });
          }, 12e4);
          ((f.onerror = f.onload = c), document.head.appendChild(f));
        }
      return Promise.all(t);
    }),
      (a.m = e),
      (a.c = n),
      (a.d = function (e, t, r) {
        a.o(e, t) ||
          Object.defineProperty(e, t, {
            enumerable: !0,
            get: r,
          });
      }),
      (a.r = function (e) {
        ("undefined" !== typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(e, Symbol.toStringTag, {
            value: "Module",
          }),
          Object.defineProperty(e, "__esModule", {
            value: !0,
          }));
      }),
      (a.t = function (e, t) {
        if ((1 & t && (e = a(e)), 8 & t)) return e;
        if (4 & t && "object" === typeof e && e && e.__esModule) return e;
        var r = Object.create(null);
        if (
          (a.r(r),
          Object.defineProperty(r, "default", {
            enumerable: !0,
            value: e,
          }),
          2 & t && "string" != typeof e)
        )
          for (var n in e)
            a.d(
              r,
              n,
              function (t) {
                return e[t];
              }.bind(null, n),
            );
        return r;
      }),
      (a.n = function (e) {
        var t =
          e && e.__esModule
            ? function () {
                return e.default;
              }
            : function () {
                return e;
              };
        return (a.d(t, "a", t), t);
      }),
      (a.o = function (e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
      }),
      (a.p = "https://mms-static.pddpic.com/wholesale/"),
      (a.oe = function (e) {
        throw (console.error(e), e);
      }));
    var f = (window.webpackJsonp = window.webpackJsonp || []),
      i = f.push.bind(f);
    ((f.push = t), (f = f.slice()));
    for (var u = 0; u < f.length; u++) t(f[u]);
    var l = i;
    //r()
    xx = a;
  })({
    fbeZ: function (e, t, n) {
      (function (t) {
        ("undefined" != typeof self && self,
          (e.exports = (function (e) {
            var t = {};
            function n(r) {
              if (t[r]) return t[r].exports;
              var o = (t[r] = {
                i: r,
                l: !1,
                exports: {},
              });
              return (e[r].call(o.exports, o, o.exports, n), (o.l = !0), o.exports);
            }
            return (
              (n.m = e),
              (n.c = t),
              (n.d = function (e, t, r) {
                n.o(e, t) ||
                  Object.defineProperty(e, t, {
                    enumerable: !0,
                    get: r,
                  });
              }),
              (n.r = function (e) {
                ("undefined" != typeof Symbol &&
                  Symbol.toStringTag &&
                  Object.defineProperty(e, Symbol.toStringTag, {
                    value: "Module",
                  }),
                  Object.defineProperty(e, "__esModule", {
                    value: !0,
                  }));
              }),
              (n.t = function (e, t) {
                if ((1 & t && (e = n(e)), 8 & t)) return e;
                if (4 & t && "object" == typeof e && e && e.__esModule) return e;
                var r = Object.create(null);
                if (
                  (n.r(r),
                  Object.defineProperty(r, "default", {
                    enumerable: !0,
                    value: e,
                  }),
                  2 & t && "string" != typeof e)
                )
                  for (var o in e)
                    n.d(
                      r,
                      o,
                      function (t) {
                        return e[t];
                      }.bind(null, o),
                    );
                return r;
              }),
              (n.n = function (e) {
                var t =
                  e && e.__esModule
                    ? function () {
                        return e.default;
                      }
                    : function () {
                        return e;
                      };
                return (n.d(t, "a", t), t);
              }),
              (n.o = function (e, t) {
                return Object.prototype.hasOwnProperty.call(e, t);
              }),
              (n.p = ""),
              n((n.s = 4))
            );
          })([
            function (e, t, n) {
              "use strict";
              var r =
                  "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
                    ? function (e) {
                        return typeof e;
                      }
                    : function (e) {
                        return e &&
                          "function" == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? "symbol"
                          : typeof e;
                      },
                o =
                  "undefined" != typeof Uint8Array &&
                  "undefined" != typeof Uint16Array &&
                  "undefined" != typeof Int32Array;
              function i(e, t) {
                return Object.prototype.hasOwnProperty.call(e, t);
              }
              ((t.assign = function (e) {
                for (var t = Array.prototype.slice.call(arguments, 1); t.length; ) {
                  var n = t.shift();
                  if (n) {
                    if ("object" !== (void 0 === n ? "undefined" : r(n)))
                      throw new TypeError(n + "must be non-object");
                    for (var o in n) i(n, o) && (e[o] = n[o]);
                  }
                }
                return e;
              }),
                (t.shrinkBuf = function (e, t) {
                  return e.length === t ? e : e.subarray ? e.subarray(0, t) : ((e.length = t), e);
                }));
              var a = {
                  arraySet: function (e, t, n, r, o) {
                    if (t.subarray && e.subarray) e.set(t.subarray(n, n + r), o);
                    else for (var i = 0; i < r; i++) e[o + i] = t[n + i];
                  },
                  flattenChunks: function (e) {
                    var t, n, r, o, i, a;
                    for (r = 0, t = 0, n = e.length; t < n; t++) r += e[t].length;
                    for (a = new Uint8Array(r), o = 0, t = 0, n = e.length; t < n; t++)
                      ((i = e[t]), a.set(i, o), (o += i.length));
                    return a;
                  },
                },
                c = {
                  arraySet: function (e, t, n, r, o) {
                    for (var i = 0; i < r; i++) e[o + i] = t[n + i];
                  },
                  flattenChunks: function (e) {
                    return [].concat.apply([], e);
                  },
                };
              ((t.setTyped = function (e) {
                e
                  ? ((t.Buf8 = Uint8Array),
                    (t.Buf16 = Uint16Array),
                    (t.Buf32 = Int32Array),
                    t.assign(t, a))
                  : ((t.Buf8 = Array), (t.Buf16 = Array), (t.Buf32 = Array), t.assign(t, c));
              }),
                t.setTyped(o));
            },
            function (e, t, n) {
              "use strict";
              e.exports = function (e) {
                return (
                  e.webpackPolyfill ||
                    ((e.deprecate = function () {}),
                    (e.paths = []),
                    e.children || (e.children = []),
                    Object.defineProperty(e, "loaded", {
                      enumerable: !0,
                      get: function () {
                        return e.l;
                      },
                    }),
                    Object.defineProperty(e, "id", {
                      enumerable: !0,
                      get: function () {
                        return e.i;
                      },
                    }),
                    (e.webpackPolyfill = 1)),
                  e
                );
              };
            },
            function (e, t, n) {
              "use strict";
              e.exports = {
                2: "need dictionary",
                1: "stream end",
                0: "",
                "-1": "file error",
                "-2": "stream error",
                "-3": "data error",
                "-4": "insufficient memory",
                "-5": "buffer error",
                "-6": "incompatible version",
              };
            },
            function (e, t, n) {
              "use strict";
              (function (e) {
                var t =
                  "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
                    ? function (e) {
                        return typeof e;
                      }
                    : function (e) {
                        return e &&
                          "function" == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? "symbol"
                          : typeof e;
                      };
                !(function (e, t) {
                  var n = d();
                  function r(e, t) {
                    return c(e - -416, t);
                  }
                  function o(e, t) {
                    return c(t - -209, e);
                  }
                  for (;;)
                    try {
                      if (
                        (-parseInt(o("@b)w", 489)) / 1) * (-parseInt(o("iU!(", 188)) / 2) +
                          (parseInt(o("ea1u", 389)) / 3) * (parseInt(o("(5h(", 478)) / 4) +
                          (-parseInt(r(258, "IUs7")) / 5) * (parseInt(o("K)F[", 473)) / 6) +
                          (-parseInt(o("#FdB", 477)) / 7) * (parseInt(o("M#pd", 336)) / 8) +
                          (-parseInt(o("ea1u", 227)) / 9) * (-parseInt(o("iSBn", 363)) / 10) +
                          (-parseInt(r(305, "d2&5")) / 11) * (-parseInt(o("bmAe", 361)) / 12) +
                          parseInt(o("hAY8", 375)) / 13 ===
                        763712
                      )
                        break;
                      n.push(n.shift());
                    } catch (e) {
                      n.push(n.shift());
                    }
                })();
                var r = n(12),
                  o = n(13)[u(1454, "2)u3")],
                  i = (u(1452, "lqr!") +
                    l(-361, "lxO1") +
                    u(1369, "wReF") +
                    u(1387, "(5h(") +
                    l(-172, "1F4e") +
                    u(1516, "l3WP") +
                    u(1554, "qy3r"))[l(-207, "eyzX")](""),
                  a = {};
                function c(e, t) {
                  var n = d();
                  return (c = function (t, r) {
                    var o = n[(t -= 393)];
                    void 0 === c.AVPLwW &&
                      ((c.jhmVoH = function (e, t) {
                        var n = [],
                          r = 0,
                          o = void 0,
                          i = "";
                        e = (function (e) {
                          for (
                            var t, n, r = "", o = "", i = 0, a = 0;
                            (n = e.charAt(a++));
                            ~n && ((t = i % 4 ? 64 * t + n : n), i++ % 4)
                              ? (r += String.fromCharCode(255 & (t >> ((-2 * i) & 6))))
                              : 0
                          )
                            n =
                              "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=".indexOf(
                                n,
                              );
                          for (var c = 0, u = r.length; c < u; c++)
                            o += "%" + ("00" + r.charCodeAt(c).toString(16)).slice(-2);
                          return decodeURIComponent(o);
                        })(e);
                        var a = void 0;
                        for (a = 0; a < 256; a++) n[a] = a;
                        for (a = 0; a < 256; a++)
                          ((r = (r + n[a] + t.charCodeAt(a % t.length)) % 256),
                            (o = n[a]),
                            (n[a] = n[r]),
                            (n[r] = o));
                        ((a = 0), (r = 0));
                        for (var c = 0; c < e.length; c++)
                          ((r = (r + n[(a = (a + 1) % 256)]) % 256),
                            (o = n[a]),
                            (n[a] = n[r]),
                            (n[r] = o),
                            (i += String.fromCharCode(e.charCodeAt(c) ^ n[(n[a] + n[r]) % 256])));
                        return i;
                      }),
                      (e = arguments),
                      (c.AVPLwW = !0));
                    var i = t + n[0],
                      a = e[i];
                    return (
                      a
                        ? (o = a)
                        : (void 0 === c.QkLBNM && (c.QkLBNM = !0),
                          (o = c.jhmVoH(o, r)),
                          (e[i] = o)),
                      o
                    );
                  })(e, t);
                }
                function u(e, t) {
                  return c(e - 966, t);
                }
                ((a["+"] = "-"), (a["/"] = "_"), (a["="] = ""));
                var s = a;
                function l(e, t) {
                  return c(e - -820, t);
                }
                function f(e) {
                  return e[u(1470, "pKX5")](/[+\/=]/g, function (e) {
                    return s[e];
                  });
                }
                function d() {
                  var e = [
                    "vqJcNKCb",
                    "D8oDW54",
                    "W41HW4ldJXu",
                    "o8ovuJbn",
                    "a8o+lbpdUCkWuCk6W54",
                    "hCkdWRTfW4G",
                    "WQXoz8oCEmkZFJKVWPZcMmo7",
                    "w8ocAxe",
                    "FmkkW5/cL21c",
                    "W6PAW67dTJ0Yj8oRWQ3dHW",
                    "W4GyW77cOqa",
                    "W7pcOCkMWQZcKW",
                    "kmoFW6xcTvnMeHq",
                    "WR5fqmk4ja",
                    "W4JcMmkpWQOR",
                    "W7FcMGe",
                    "WRRdHmotWRRcLvddTcG",
                    "W6LmWPVdKCoB",
                    "WQrUq8ksW4O",
                    "qSouqNX6",
                    "W7BcTmk/WO0",
                    "WOdcJmkJWQyj",
                    "v8k0W6VdLSoY",
                    "aSodvtbEW4dcKCk9",
                    "WPb8A8ksW4K",
                    "WQ7dK8oBW77cTxZdSrJdGCoz",
                    "W4GlWRSvW6O",
                    "W6ZcJqJcThm",
                    "WPRdT8k5jmky",
                    "WQTrW4m",
                    "dMeAW7flW4K",
                    "pCk8WQ5RW6JdH8kZWPm",
                    "ySoHsev6",
                    "W4FcIbBcLNFdONRdQmolW7y",
                    "W7VdRCoeWOpcUxhdQG",
                    "hCkJWQrTW7S",
                    "x8o0WQJdLe8",
                    "WP7cK8oDgLldKrOb",
                    "xCkHW68uW48",
                    "jGzyWPFdG1NcPSkLEG",
                    "WRNcJSkxWOe",
                    "hCkpWQzzW5i",
                    "WOVdOSkRbSkm",
                    "WQvqrmk4W6ZcLSowW5C4cq",
                    "WRFcTmoXa8k+",
                    "t8k9W7NdJSoR",
                    "oSo0pJ/dLq",
                    "vf9rW5ng",
                    "W5RdGXCKW5i",
                    "BXRcRMaH",
                    "hmodBYO",
                    "WQddVCoeWOTm",
                    "FCotsv5t",
                    "xK/cN8kEWQq",
                    "rCoTx0Pw",
                    "xwVcNCkJWObB",
                    "W4maW5tcNJi",
                    "W7FdRSkVvmkuW6ZcGcpdPCkT",
                    "WODkW6tcP8kl",
                    "EmoMW44QW7tdN8k1WPNcTCkj",
                    "WPqbWRBdH8oH",
                    "dSkQWRv3W65vWPjIWRtdJa",
                    "dCoZemkRWOO",
                    "WRDhWOSYhq",
                    "FSowW5yzmq",
                    "omojv8kFBfuaiSoWrmk7WPy",
                    "WPBcMsG",
                    "rmoVW583WRqjWPTpW4ddTtG",
                    "WQhdGmoyWRO",
                    "rmkeW7in",
                    "s1Ccrvi",
                    "WRldSCo4W5XXW6n0i8kzWRqeb8kX",
                    "AWTvW40lwmkDW5G",
                    "BMW/",
                    "WPddKSoOWRb+",
                    "fSkXWPS",
                    "WRJdQmoNsSkP",
                    "W6VdSXWVW6a",
                    "W7pdKSk1",
                    "uSoBWRW",
                    "lSoFoWldMG",
                    "WQVdH8os",
                    "W6ZcNIm7W7q",
                    "W4ZcS8oziLJdLG4",
                    "rSojW5eVlq",
                    "W5ldTZ3dSwK",
                    "W6FcLWJcQK0",
                    "qWFcPwKe",
                    "W7yChCkJlq",
                    "CHNcPSk6W6hdSZ3dVq",
                    "AmkbW7hdPCoR",
                    "iSkKWR5pW5u",
                    "WPn8ACkQeG",
                    "WRRcSSosmxy",
                    "WRLgW5lcOmkEECoRW6ddJW",
                    "iSoCxZzn",
                    "W4DOW4pdHXnV",
                    "DmkoWRtdMCk8",
                    "WRBdTSoDW7RcQ8oegNCbW5y",
                    "WQD8DCks",
                    "W7NdI8ou",
                    "WOhdQmoNWOT+",
                    "W5BdSse3W5C",
                    "nCouWO7cUmkXlu4SW5RdNcLhgG",
                    "z8kvamojkqK",
                    "WQJcVCo2b8kVW7C",
                    "WQPlACoEbSoZCs0cWRm",
                    "WRnDs8kkca",
                    "n1bEW7yw",
                    "WO3dKSkleG",
                    "WQn/W7BcKCkR",
                    "W5JcJrtcJa",
                    "W67dTruPW5O",
                    "WOFdKmoT",
                    "xWiM",
                    "aZ/dHSo3W4CaWPBdTdW2tgRcVa",
                    "W47cTmkPWOdcGW",
                    "W5T/W4ldLaHZc8oDW6u",
                    "uMhcNCkNWPvh",
                    "dSkAWPngW70",
                    "eCk/WQLWW4W",
                    "vtBcVxymWOldM3alWOK",
                    "WQW9WOJdG8o0",
                    "FCoCuSkzvbtdV8onW6vGWQBdS8ob",
                    "wx3cUCkRWOe",
                    "mCk2WO1yW6y",
                    "W7uWoCkIdW",
                    "vmkdW4JdKSoc",
                    "Fmo8W64Fl8k2",
                    "qCkfW7aTW7C",
                    "eSo9iZtdRa",
                    "rCoyAgiL",
                    "WO7dUCk3mmkW",
                    "W5VcIaVcJxa",
                    "WRvnr8k5W5VcI8oBW5WE",
                    "WPldK8krpCk7EGa",
                    "qSkoW7ueW4Gc",
                    "WOrRW6JcUSkD",
                    "oCkMWO53",
                    "p1TqW6Gwu8kmW60MWQS",
                    "gSo1jHhdQ8kX",
                    "W43dUbZdQLW",
                    "W6/cQCkpWOdcLG",
                    "WQbhuCkkcq",
                    "nCkzlmoBfa",
                    "x8o4W5iSkW",
                    "WRRdPmoaWP9J",
                    "jmkZWO50W60",
                    "WQBdM2q0tG",
                    "W6XeW4pdUqa",
                    "WQfrsmkEba",
                    "rCkCW4KZW7q",
                    "WR3dN8osWOvk",
                    "WR7dNmohWOLw",
                    "W7ubhmo7WP7dJCodW5CHeGi1",
                    "zmknWRpdMCk4WO8",
                    "W4yvWQaqW74",
                    "W6CXqCksfq",
                    "W5L8W67dRGW",
                    "EmoPWOZdPuC",
                    "WQ3cICo3bmkS",
                    "o8kkWOPuW6S",
                    "rCklW4pcU0G",
                    "sCoDyq",
                    "btbSWPZdSG",
                    "WRhcTSoRcmkYW7NcUG",
                    "WQxcNSkkWO47lW",
                    "xSoyWRC",
                    "sSolCv5ZWPG",
                    "bKuUW65j",
                    "emkpWQS",
                    "WPhdHCoHWOHa",
                    "CbxcMuy",
                    "vJdcU3KJ",
                    "B2H6W5i",
                    "W4ziW4pdQq4",
                    "g8k6WPW",
                    "cgpcICk5W5RdGHBdTSoIW7e",
                    "W4JcLSkSWQpcIa",
                    "kCoYWOq",
                    "W6GuWRetW7NcUGO9",
                    "W5ypWRqLW40",
                    "WOFdS8ojxCkx",
                    "WRFcRCo6e8kVW63cPXVdHq",
                    "dCodemkdWQ8",
                    "W7n2WPVdR8ol",
                    "WPhdGSkwhwlcNW",
                    "eguAW7jqW4W",
                    "W5WIBCkieq",
                    "CCkrW4NdQq",
                    "vfRcGCk8WR0",
                    "DCk7WQRdSCkO",
                    "W67dSqKvW4i",
                    "W5tcJ8kbWP0H",
                    "wmokyv8",
                    "WOxcICo2gCk4",
                    "BmoBaW",
                    "eCojkYZdLG",
                    "W4W9W7FcStddSW",
                    "lCk8WOroW78",
                    "f8ogAGDb",
                    "W6RcK8kbWQKN",
                    "kCoFf8kE",
                    "W7SHW4/cVXu",
                    "n8oscZldMSkFEmkxW7pcRG",
                    "W6j+W5JdSre",
                    "WPSHWPJcUmkW",
                    "WQ9DBSkUW4a",
                    "WOL+WOa9mG",
                    "pSoqW6NcISk+WOHXW63cOSow",
                    "W6WoWPep",
                    "DSobDG",
                    "iNZcGmkhW78",
                    "WOHhW4dcKCkh",
                    "W68pWPaoW6xcTa",
                    "eH5BWRldLq",
                    "s8o1DNrx",
                    "W6CgySk5aSkL",
                    "W4HqWQhdGSooW4u",
                    "wuZcMG",
                    "W5vfWQZdICos",
                    "wSoXE2u",
                    "WPhdM8oXWR96WQpcLW",
                    "WOZdGSo/WRvN",
                    "i8oiDa99",
                    "sCouW6ymha",
                    "WRJdL8kMe8kQ",
                    "W7Gtymk3aG",
                    "bSozDsW",
                    "WP1xr8kGW4RcMSogWPi4dW",
                    "W43dOrC6W5O",
                    "w8kmW50UW70",
                    "W4dcSJeGW4C",
                    "BmkOW7Xbj8oQW4PWec4",
                    "CSooWQxdT3S",
                    "W5lcQ8kAWQBcKq",
                    "xComq1HaWOuIW48",
                    "W50imCk6pG",
                    "W4tdSaBdJ2q+",
                    "WPLAW6K",
                    "mKdcO8kJW50",
                    "zCkfa8omobm",
                    "e8k2WPHmW4G",
                    "WRtdKKGcxGS",
                    "ASkEW7qZW4S",
                    "pCo7pmk6WOe",
                    "jSoFemkvWPNdVq",
                    "gCk1WODaW48",
                    "WRjCW7xcICkK",
                    "WRzzv8k5W4RcSmoCW4y",
                    "WPL4WOhcMSkIrmoHW6BdH8kH",
                    "WR3cLmk3WP09lHf6",
                    "wCowy0q",
                    "AKS4vKDj",
                    "WQNdISopWQRcKw0",
                    "WQvDtmkM",
                    "x8o3WOddUM0",
                    "W64EWPilW6RcSae",
                    "xmo4sLKiig/dMmkQWRO",
                    "W4ZcMrpcHq",
                    "A8kgW68VW44",
                    "WQFdRCoNWPXA",
                    "F8k1pCoSlG",
                    "W6ZdLSokySkjWORdGa",
                    "ESkgW6JcTNO",
                    "W7CNe8k7gq",
                    "W7msn8ke",
                    "EcRcHhqC",
                    "WR3cOSkOuCoPWQZdUKdcLmoE",
                    "vmkSW7dcMu4",
                    "iCkyWQPrW5W",
                    "W7uymmknpCoO",
                    "W7fDWRVdJmoU",
                    "rwhcOmkWWOzAW4ddOG",
                    "oSkkiCoNjG",
                    "WO7dN8oX",
                    "msD3WPtdMG",
                    "W5O8W6RcUJJdOre",
                    "n8kciSoWkq",
                    "WQlcMCo3",
                    "W5akgCkLdW",
                    "bv/dUW",
                    "W4BcKJqZW4K",
                    "WQ5EW5VcKCkz",
                    "WPddI8oJWQbVWRlcM8kkW78",
                    "WPhcNSosd2xdLG",
                    "bSoLoX4",
                    "nCowW67cG8oPWP9WWPtcTCofra",
                    "r8kzmNWCW6xcU8kXW5ZcTJu",
                    "uMBcKSk2WRDCW4RdObqX",
                    "W685uSk/l8orWOFcHG",
                    "sCoBWPRdHxa",
                    "WOddN8oTWR8",
                    "WO9CW4lcP8kq",
                    "W6yeDSklnW",
                    "zmkaW6lcHgTdkJq",
                    "dmkvamoela",
                    "WRtcRCoRca",
                    "jSkGWRPVW4K",
                    "WO1xWQWspG",
                    "WOddLSoGWQfyWQ/cLSkb",
                    "W6BcJr9qd0BdKLFdRbRdHau",
                    "E8kkr8odW53cRmkPW6SoW7GUW7e",
                    "lSo9FWn+",
                    "W73cUrazW7i",
                    "WQhdImomsCkRWQBdPsZdJW",
                    "WPWmW6tcIG",
                    "W7pcR8k/WO0TWRe5",
                    "cHhdTG",
                    "W6NdSrCWW4q",
                    "WOxdJSkrpSkOBry",
                    "W4X+WPJdQ8o8",
                    "WRFdICogx8k5W68",
                    "WOpcTCo5nSk5",
                    "W48VW4pdT8kZWQdcPK/dHs4",
                    "W5/cR8k6WQdcKW",
                    "W7mlhmo8WP7dISoZW7atfIuD",
                    "WRb1W4JcPCk7",
                    "FM/cOCkqWOq",
                    "W5bAWPZdKCoiW4r1oG",
                    "W7NdLaSjW4q",
                    "qWNcGvq7",
                    "kuHvW7mls8koW68S",
                    "he0i",
                    "m0GsW6Xf",
                    "W4aJWPNdHCogW5xcKq",
                    "W7ddPWhdVwi",
                    "lSkvbSoseW",
                    "FmolzevM",
                    "WOpcUSkcWQai",
                    "W4Svpmkqia",
                    "DmksWRhdK8kT",
                    "fCo/jHxdVSkT",
                  ];
                  return (d = function () {
                    return e;
                  })();
                }
                var p =
                    ("undefined" == typeof window ? "undefined" : t(window)) !== u(1585, "lqr!") &&
                    window[l(-189, "LPAx")]
                      ? window[u(1497, "ea1u")]
                      : parseInt,
                  h = {
                    base64: function (e) {
                      var t = {
                          ztKqs: function (e, t) {
                            return e * t;
                          },
                          xJnZI: function (e, t) {
                            return e(t);
                          },
                          PCVxE: function (e, t) {
                            return e / t;
                          },
                          JAfIG: function (e, t) {
                            return e < t;
                          },
                          OUBlM: function (e, t) {
                            return e + t;
                          },
                          UdrKQ: function (e, t) {
                            return e + t;
                          },
                          DuoPw: function (e, t) {
                            return e >>> t;
                          },
                          kwCPO: function (e, t) {
                            return e & t;
                          },
                          xObLJ: function (e, t) {
                            return e | t;
                          },
                          MyTta: function (e, t) {
                            return e << t;
                          },
                          JtVBF: function (e, t) {
                            return e & t;
                          },
                          kwRPH: function (e, t) {
                            return e | t;
                          },
                          UhtiT: function (e, t) {
                            return e & t;
                          },
                          CxgnK: function (e, t) {
                            return e - t;
                          },
                          kTJWV: function (e, t) {
                            return e === t;
                          },
                          aSDpj: function (e, t) {
                            return e + t;
                          },
                          ugFMA: function (e, t) {
                            return e + t;
                          },
                          nZMQP: function (e, t) {
                            return e >>> t;
                          },
                          QLfzz: function (e, t) {
                            return e(t);
                          },
                        },
                        n = void 0,
                        r = void 0,
                        o = void 0,
                        a = "";
                      function c(e, t) {
                        return u(t - -1114, e);
                      }
                      var s = e[d(854, "ehxd")];
                      function d(e, t) {
                        return l(e - 1226, t);
                      }
                      for (
                        var h = 0,
                          v = t[c("5m^J", 278)](t[d(955, "wReF")](p, t[c("QQD8", 298)](s, 3)), 3);
                        t[d(1017, "ehxd")](h, v);
                      )
                        ((n = e[h++]),
                          (r = e[h++]),
                          (o = e[h++]),
                          (a += t[d(866, "7s0V")](
                            t[c("Wfi4", 438)](
                              t[c("FYnO", 296)](
                                i[t[d(932, "qa*a")](n, 2)],
                                i[
                                  t[c("IUs7", 558)](
                                    t[d(1072, "8Oiv")](
                                      t[c("eoa[", 537)](n, 4),
                                      t[d(1113, "iSBn")](r, 4),
                                    ),
                                    63,
                                  )
                                ],
                              ),
                              i[
                                t[c("icaT", 315)](
                                  t[d(839, "qa*a")](
                                    t[c("bmAe", 470)](r, 2),
                                    t[c("iSBn", 559)](o, 6),
                                  ),
                                  63,
                                )
                              ],
                            ),
                            i[t[c("wReF", 467)](o, 63)],
                          )));
                      var m = t[d(984, "5m^J")](s, v);
                      return (
                        t[c("K)F[", 508)](m, 1)
                          ? ((n = e[h]),
                            (a += t[d(912, "bmAe")](
                              t[d(1008, "!&EH")](
                                i[t[c("d2&5", 371)](n, 2)],
                                i[t[c("7s0V", 369)](t[c("v6]c", 525)](n, 4), 63)],
                              ),
                              "==",
                            )))
                          : t[d(1063, "b!D8")](m, 2) &&
                            ((n = e[h++]),
                            (r = e[h]),
                            (a += t[c("lxO1", 346)](
                              t[d(919, "qa*a")](
                                t[c("5m^J", 408)](
                                  i[t[c("1F4e", 494)](n, 2)],
                                  i[
                                    t[d(1016, ")goq")](
                                      t[d(1040, ")goq")](
                                        t[c("qy3r", 484)](n, 4),
                                        t[c("d2&5", 399)](r, 4),
                                      ),
                                      63,
                                    )
                                  ],
                                ),
                                i[t[d(960, "qy3r")](t[c("qy3r", 484)](r, 2), 63)],
                              ),
                              "=",
                            ))),
                        t[d(1012, "Wbwc")](f, a)
                      );
                    },
                    charCode: function (e) {
                      var t = {};
                      function n(e, t) {
                        return l(t - 1189, e);
                      }
                      ((t[n("(X98", 1031)] = function (e, t) {
                        return e < t;
                      }),
                        (t[s(1437, "Wfi4")] = function (e, t) {
                          return e >= t;
                        }),
                        (t[n("8Oiv", 797)] = function (e, t) {
                          return e <= t;
                        }),
                        (t[s(1544, ")FA3")] = function (e, t) {
                          return e | t;
                        }),
                        (t[n("eyzX", 842)] = function (e, t) {
                          return e & t;
                        }),
                        (t[n("icaT", 1010)] = function (e, t) {
                          return e >> t;
                        }),
                        (t[n("ehxd", 1005)] = function (e, t) {
                          return e & t;
                        }),
                        (t[s(1274, "IUs7")] = function (e, t) {
                          return e <= t;
                        }),
                        (t[s(1431, "QQD8")] = function (e, t) {
                          return e >= t;
                        }),
                        (t[s(1296, "Pi4q")] = function (e, t) {
                          return e | t;
                        }),
                        (t[s(1286, "HmRp")] = function (e, t) {
                          return e < t;
                        }),
                        (t[n("5m^J", 929)] = function (e, t) {
                          return e & t;
                        }));
                      for (
                        var r = t, o = [], i = 0, a = 0;
                        r[n(")goq", 1016)](a, e[n("&QZ4", 868)]);
                        a += 1
                      ) {
                        var c = e[s(1444, "iU!(")](a);
                        r[s(1552, "k([F")](c, 0) && r[n(")goq", 867)](c, 127)
                          ? (o[n("iSBn", 1083)](c), (i += 1))
                          : r[s(1589, "pKX5")](128, 80) && r[s(1506, "ea1u")](c, 2047)
                            ? ((i += 2),
                              o[n("l3WP", 948)](
                                r[n("2)u3", 1044)](
                                  192,
                                  r[n("IUs7", 812)](31, r[n("bmAe", 1079)](c, 6)),
                                ),
                              ),
                              o[s(1349, "HmRp")](r[n("#FdB", 852)](128, r[s(1435, "d2&5")](63, c))))
                            : ((r[n("b!D8", 783)](c, 2048) && r[s(1581, "@b)w")](c, 55295)) ||
                                (r[n("iSBn", 1091)](c, 57344) && r[s(1304, "5**I")](c, 65535))) &&
                              ((i += 3),
                              o[s(1293, "IUs7")](
                                r[n("&QZ4", 808)](
                                  224,
                                  r[s(1271, "7s0V")](15, r[s(1523, "IUs7")](c, 12)),
                                ),
                              ),
                              o[s(1383, "bmAe")](
                                r[n("K)F[", 893)](
                                  128,
                                  r[n("8Oiv", 822)](63, r[n(")goq", 1036)](c, 6)),
                                ),
                              ),
                              o[s(1528, "ehxd")](
                                r[s(1307, "8Oiv")](128, r[n("7s0V", 767)](63, c)),
                              ));
                      }
                      function s(e, t) {
                        return u(e - -93, t);
                      }
                      for (var f = 0; r[s(1449, "&QZ4")](f, o[n("iU!(", 1039)]); f += 1)
                        o[f] &= 255;
                      return r[s(1550, "hAY8")](i, 255)
                        ? [0, i][n("lqr!", 983)](o)
                        : [r[n("8Oiv", 874)](i, 8), r[n("v6]c", 899)](i, 255)][s(1310, "eyzX")](o);
                    },
                    es: function (e) {
                      function t(e, t) {
                        return l(t - 601, e);
                      }
                      function n(e, t) {
                        return l(t - 1307, e);
                      }
                      e || (e = "");
                      var r = e[t("pKX5", 347)](0, 255),
                        o = [],
                        i = h[t("pKX5", 363)](r)[t("l3WP", 440)](2);
                      return (o[t("(X98", 237)](i[n("FYnO", 1110)]), o[n("b$p#", 1012)](i));
                    },
                    en: function (e) {
                      var t = {
                        qfBUq: function (e, t) {
                          return e(t);
                        },
                        dAZxv: function (e, t) {
                          return e > t;
                        },
                        Awjkr: function (e, t) {
                          return e !== t;
                        },
                        iQodw: function (e, t) {
                          return e % t;
                        },
                        osGpS: function (e, t) {
                          return e / t;
                        },
                        WAaVg: function (e, t) {
                          return e < t;
                        },
                        zAXuB: function (e, t) {
                          return e * t;
                        },
                        ajlCm: function (e, t) {
                          return e + t;
                        },
                        rqCNk: function (e, t, n) {
                          return e(t, n);
                        },
                      };
                      e || (e = 0);
                      var n = t[h("b$p#", -357)](p, e),
                        r = [];
                      t[a("Wbwc", -544)](n, 0) ? r[h("1F4e", -394)](0) : r[h("icaT", -295)](1);
                      for (
                        var o = Math[h("v6]c", -143)](n)[a(")goq", -477)](2)[a("1F4e", -580)](""),
                          i = 0;
                        t[a("S$EH", -479)](t[a("l3WP", -553)](o[h("eoa[", -252)], 8), 0);
                        i += 1
                      )
                        o[a("#FdB", -406)]("0");
                      function a(e, t) {
                        return l(t - -175, e);
                      }
                      o = o[h("bmAe", -122)]("");
                      for (
                        var c = Math[h("ea1u", -250)](t[a("IUs7", -415)](o[h("@b)w", -220)], 8)),
                          s = 0;
                        t[a("&QZ4", -525)](s, c);
                        s += 1
                      ) {
                        var f = o[a("ea1u", -579)](
                          t[a("!&EH", -278)](s, 8),
                          t[a("b!D8", -352)](t[a("bmAe", -513)](s, 1), 8),
                        );
                        r[h(")goq", -253)](t[a("5**I", -555)](p, f, 2));
                      }
                      var d = r[h("qy3r", -287)];
                      function h(e, t) {
                        return u(t - -1753, e);
                      }
                      return (r[a("l3WP", -548)](d), r);
                    },
                    sc: function (e) {
                      var t = {};
                      ((t[r("qa*a", 981)] = function (e, t) {
                        return e > t;
                      }),
                        e || (e = ""));
                      var n = t[r("K)F[", 1099)](e[o(561, "hAY8")], 255)
                        ? e[o(498, "l3WP")](0, 255)
                        : e;
                      function r(e, t) {
                        return l(t - 1390, e);
                      }
                      function o(e, t) {
                        return u(e - -933, t);
                      }
                      return h[r("@b)w", 1222)](n)[o(722, "pKX5")](2);
                    },
                    nc: function (e) {
                      var t = {
                        DSfOA: function (e, t) {
                          return e(t);
                        },
                        lQiuF: function (e, t) {
                          return e / t;
                        },
                        wABHl: function (e, t, n, r) {
                          return e(t, n, r);
                        },
                        hKWNF: function (e, t) {
                          return e * t;
                        },
                        TPFZR: function (e, t) {
                          return e < t;
                        },
                        gYcZI: function (e, t) {
                          return e * t;
                        },
                        BApWW: function (e, t) {
                          return e + t;
                        },
                        jiYFc: function (e, t, n) {
                          return e(t, n);
                        },
                      };
                      e || (e = 0);
                      var n = Math[i(1165, "LPAx")](t[i(1012, "pKX5")](p, e))[i(931, "icaT")](2),
                        o = Math[i(1006, "ea1u")](t[i(1147, "tCmq")](n[c(1052, "iU!(")], 8));
                      function i(e, t) {
                        return l(e - 1289, t);
                      }
                      n = t[i(996, "hAY8")](r, n, t[c(975, "qy3r")](o, 8), "0");
                      var a = [];
                      function c(e, t) {
                        return u(e - -584, t);
                      }
                      for (var s = 0; t[i(1089, "IUs7")](s, o); s += 1) {
                        var f = n[i(1178, "v6]c")](
                          t[i(1021, "IUs7")](s, 8),
                          t[i(948, "lqr!")](t[i(943, "!&EH")](s, 1), 8),
                        );
                        a[i(1037, "lqr!")](t[c(928, "FYnO")](p, f, 2));
                      }
                      return a;
                    },
                    va: function (e) {
                      var t = {
                        ozDNt: function (e, t) {
                          return e(t);
                        },
                        qogTH: function (e, t, n, r) {
                          return e(t, n, r);
                        },
                        oAlZP: function (e, t) {
                          return e * t;
                        },
                        XQyGR: function (e, t) {
                          return e / t;
                        },
                        oaCId: function (e, t) {
                          return e >= t;
                        },
                        tESBs: function (e, t) {
                          return e - t;
                        },
                        LdvIJ: function (e, t) {
                          return e === t;
                        },
                        tbHcV: function (e, t) {
                          return e & t;
                        },
                        OooNI: function (e, t) {
                          return e + t;
                        },
                        BtpBm: function (e, t) {
                          return e + t;
                        },
                        RNMxe: function (e, t) {
                          return e >>> t;
                        },
                      };
                      e || (e = 0);
                      var n = Math[a(1395, "S$EH")](t[a(1365, "wReF")](p, e));
                      function o(e, t) {
                        return l(e - 276, t);
                      }
                      var i = n[a(1339, "bmAe")](2);
                      function a(e, t) {
                        return u(e - -265, t);
                      }
                      for (
                        var c = [],
                          s = (i = t[o(-22, "lxO1")](
                            r,
                            i,
                            t[a(1369, "iU!(")](
                              Math[a(1185, "hAY8")](t[o(41, "bmAe")](i[a(1169, "(1SR")], 7)),
                              7,
                            ),
                            "0",
                          ))[a(1221, "Pi4q")];
                        t[o(159, "d2&5")](s, 0);
                        s -= 7
                      ) {
                        var f = i[o(60, "(5h(")](t[a(1245, "HyKD")](s, 7), s);
                        if (t[o(117, "lqr!")](t[o(82, "7s0V")](n, -128), 0)) {
                          c[o(-90, "wReF")](t[o(157, "1F4e")]("0", f));
                          break;
                        }
                        (c[o(-73, "FH!j")](t[o(-49, "v6]c")]("1", f)),
                          (n = t[a(1176, "#FdB")](n, 7)));
                      }
                      return c[a(1258, "pKX5")](function (e) {
                        return p(e, 2);
                      });
                    },
                    ek: function (e) {
                      var n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "",
                        o = {
                          doyQe: function (e, t) {
                            return e !== t;
                          },
                          ZnBwu: function (e, t) {
                            return e === t;
                          },
                          wNWpl: s("ea1u", 232) + s(")goq", 343),
                          DCAiW: function (e, t) {
                            return e === t;
                          },
                          CgOGQ: s("icaT", 217),
                          XriUr: d("HyKD", 858),
                          UgrSF: function (e, t) {
                            return e > t;
                          },
                          AQnyc: function (e, t) {
                            return e <= t;
                          },
                          EmtLr: function (e, t) {
                            return e + t;
                          },
                          GynqB: function (e, t, n, r) {
                            return e(t, n, r);
                          },
                          IsuQv: function (e, t) {
                            return e + t;
                          },
                          hoSrd: s("ehxd", 436),
                          TnsHv: function (e, t, n) {
                            return e(t, n);
                          },
                          zFxvQ: function (e, t) {
                            return e - t;
                          },
                          qpclh: function (e, t) {
                            return e > t;
                          },
                        };
                      if (!e) return [];
                      var i = [],
                        a = 0;
                      o[s("IUs7", 202)](n, "") &&
                        (o[s("icaT", 159)](
                          Object[d("5**I", 734)][d("iU!(", 890)][d("pKX5", 909)](n),
                          o[d("iSBn", 760)],
                        ) && (a = n[d("5**I", 1046)]),
                        o[s("Wfi4", 418)](void 0 === n ? "undefined" : t(n), o[d("wReF", 1037)]) &&
                          (a = (i = h.sc(n))[s("Wbwc", 366)]),
                        o[d("FYnO", 886)](void 0 === n ? "undefined" : t(n), o[d("Pi4q", 943)]) &&
                          (a = (i = h.nc(n))[d("lqr!", 757)]));
                      var c = Math[s("HmRp", 166)](e)[d("IUs7", 981)](2),
                        u = "";
                      function s(e, t) {
                        return l(t - 541, e);
                      }
                      u =
                        o[s("FH!j", 130)](a, 0) && o[s("l3WP", 198)](a, 7)
                          ? o[d("qa*a", 877)](c, o[d("hAY8", 801)](r, a[d("ehxd", 868)](2), 3, "0"))
                          : o[d("5**I", 822)](c, o[d("Wfi4", 849)]);
                      var f = [
                        o[d("2)u3", 739)](
                          p,
                          u[s("eyzX", 433)](
                            Math[d("S$EH", 784)](o[d("v6]c", 934)](u[s("HyKD", 440)], 8), 0),
                          ),
                          2,
                        ),
                      ];
                      if (o[d("qy3r", 837)](a, 7)) return f[d(")FA3", 815)](h.va(a), i);
                      function d(e, t) {
                        return l(t - 1155, e);
                      }
                      return f[s("iU!(", 121)](i);
                    },
                    ecl: function (e) {
                      function t(e, t) {
                        return l(t - 681, e);
                      }
                      var n = {
                          XaGBp: function (e, t) {
                            return e < t;
                          },
                          YMftG: function (e, t, n) {
                            return e(t, n);
                          },
                          VANUe: function (e, t, n) {
                            return e(t, n);
                          },
                        },
                        r = [],
                        o = e[t("FYnO", 438)](2)[t("&QZ4", 370)]("");
                      function i(e, t) {
                        return u(t - -117, e);
                      }
                      for (var a = 0; n[t("b!D8", 369)](o[t("l3WP", 581)], 16); a += 1)
                        o[t(")FA3", 420)](0);
                      return (
                        (o = o[i("d2&5", 1397)]("")),
                        r[i("(1SR", 1573)](
                          n[t("k([F", 368)](p, o[t("v6]c", 570)](0, 8), 2),
                          n[t("tCmq", 442)](p, o[i("QQD8", 1503)](8, 16), 2),
                        ),
                        r
                      );
                    },
                    pbc: function () {
                      var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "",
                        t = {
                          aQnxO: function (e, t) {
                            return e(t);
                          },
                          NXXiw: function (e, t) {
                            return e < t;
                          },
                          axaxt: function (e, t) {
                            return e < t;
                          },
                          BElkO: function (e, t) {
                            return e - t;
                          },
                        };
                      function n(e, t) {
                        return l(e - -1, t);
                      }
                      var r = [],
                        i = h.nc(t[n(-309, "!&EH")](o, e[a(-294, "b!D8")](/\s/g, "")));
                      function a(e, t) {
                        return u(e - -1677, t);
                      }
                      if (t[n(-402, "v6]c")](i[n(-403, "qa*a")], 4))
                        for (
                          var c = 0;
                          t[a(-102, "5m^J")](c, t[n(-427, "!&EH")](4, i[n(-268, "d2&5")]));
                          c++
                        )
                          r[a(-76, "#FdB")](0);
                      return r[a(-175, "LPAx")](i);
                    },
                    gos: function (e, t) {
                      function n(e, t) {
                        return u(e - -688, t);
                      }
                      var r = {};
                      function o(e, t) {
                        return u(t - -1821, e);
                      }
                      ((r[o("wReF", -400)] = function (e, t) {
                        return e === t;
                      }),
                        (r[n(978, "Pi4q")] = o("1F4e", -314)));
                      var i = r,
                        a = Object[n(961, "LPAx")](e)
                          [n(736, "K)F[")](function (t) {
                            function r(e, t) {
                              return n(t - -25, e);
                            }
                            function a(e, t) {
                              return o(t, e - 1533);
                            }
                            return i[a(1315, "FH!j")](t, i[r("S$EH", 826)]) ||
                              i[a(1377, "k([F")](t, "c")
                              ? ""
                              : t + ":" + e[t][r("qy3r", 854)]() + ",";
                          })
                          [n(962, "qa*a")]("");
                      return o("M#pd", -261) + t + "={" + a + "}";
                    },
                    budget: function (e, t) {
                      function n(e, t) {
                        return l(t - 1801, e);
                      }
                      var r = {};
                      function o(e, t) {
                        return l(t - -18, e);
                      }
                      ((r[o("K)F[", -409)] = function (e, t) {
                        return e === t;
                      }),
                        (r[o("v6]c", -273)] = function (e, t) {
                          return e >= t;
                        }),
                        (r[o("S$EH", -187)] = function (e, t) {
                          return e + t;
                        }));
                      var i = r;
                      return i[n("d2&5", 1593)](e, 64)
                        ? 64
                        : i[n("tCmq", 1471)](e, 63)
                          ? t
                          : i[n("lqr!", 1393)](e, t)
                            ? i[o("d2&5", -430)](e, 1)
                            : e;
                    },
                    encode: function (e, n) {
                      var r = {
                          EAnrQ: function (e, t) {
                            return e < t;
                          },
                          sJtws:
                            s(-298, "eyzX") +
                            s(-249, "HmRp") +
                            s(-149, "LPAx") +
                            s(-165, "5**I") +
                            i(537, "v6]c") +
                            s(-113, "K)F[") +
                            s(-286, "HmRp"),
                          ieKdo: function (e, t) {
                            return e < t;
                          },
                          mmivi: function (e, t) {
                            return e !== t;
                          },
                          OaRTp: s(-202, "M#pd"),
                          hjaOS: function (e, t) {
                            return e * t;
                          },
                          GCemu: i(601, "2)u3") + i(520, "k([F") + "|2",
                          GmaVb: function (e, t) {
                            return e >> t;
                          },
                          NYCOo: function (e, t) {
                            return e - t;
                          },
                          eTrxI: function (e, t) {
                            return e | t;
                          },
                          XOstE: function (e, t) {
                            return e << t;
                          },
                          mEnIi: function (e, t) {
                            return e & t;
                          },
                          gJgsQ: function (e, t) {
                            return e + t;
                          },
                          KPCyN: function (e, t) {
                            return e + t;
                          },
                          vsnfG: function (e, t) {
                            return e + t;
                          },
                          XlToV: function (e, t) {
                            return e + t;
                          },
                          VDNXf: function (e, t) {
                            return e | t;
                          },
                          fnaNP: function (e, t) {
                            return e << t;
                          },
                          WCTJq: function (e, t) {
                            return e & t;
                          },
                          lNOfd: function (e, t) {
                            return e - t;
                          },
                          SUaqZ: function (e, t) {
                            return e(t);
                          },
                          Eortz: function (e, t) {
                            return e(t);
                          },
                          TsVmD: function (e, t) {
                            return e !== t;
                          },
                          vXNda: function (e, t, n) {
                            return e(t, n);
                          },
                          hsJou: function (e, t, n) {
                            return e(t, n);
                          },
                          iLFBA: function (e, t, n) {
                            return e(t, n);
                          },
                          Cikzn: function (e, t) {
                            return e & t;
                          },
                        },
                        o = {
                          "_b\xc7": (e = e),
                          _bK: 0,
                          _bf: function () {
                            function t(e, t) {
                              return s(e - 505, t);
                            }
                            return e[t(374, "ea1u")](o[t(277, "@b)w")]++);
                          },
                        };
                      function i(e, t) {
                        return l(e - 825, t);
                      }
                      var a = {
                          "_\xea": [],
                          "_b\xcc": -1,
                          "_\xe1": function (e) {
                            (a[i(457, "5m^J")]++, (a["_\xea"][a[i(483, "S$EH")]] = e));
                          },
                          "_b\xdd": function () {
                            function e(e, t) {
                              return s(t - 1628, e);
                            }
                            return (
                              _bÝ[e("ea1u", 1360)]--,
                              r[e("!&EH", 1430)](_bÝ[e("lxO1", 1444)], 0) &&
                                (_bÝ[s(-328, "lqr!")] = 0),
                              _bÝ["_\xea"][_bÝ[e("QQD8", 1429)]]
                            );
                          },
                        },
                        c = "";
                      function s(e, t) {
                        return u(e - -1755, t);
                      }
                      for (
                        var f, d, p, h, v = r[s(-136, "qa*a")], m = 0;
                        r[i(710, "FH!j")](m, v[s(-379, "k([F")]);
                        m++
                      )
                        a["_\xe1"](v[i(455, ")goq")](m));
                      a["_\xe1"]("=");
                      var x = r[i(728, "(5h(")](
                        void 0 === n ? "undefined" : t(n),
                        r[i(432, "k([F")],
                      )
                        ? Math[s(-172, "5**I")](r[s(-365, "7s0V")](Math[i(474, "Wbwc")](), 64))
                        : -1;
                      for (m = 0; r[i(494, "ea1u")](m, e[s(-70, "HyKD")]); m = o[s(-394, "8Oiv")])
                        for (var g = r[i(697, "!&EH")][s(-374, "1F4e")]("|"), b = 0; ; ) {
                          switch (g[b++]) {
                            case "0":
                              f = r[i(412, "K)F[")](
                                a["_\xea"][r[i(665, "FH!j")](a[s(-288, "eoa[")], 2)],
                                2,
                              );
                              continue;
                            case "1":
                              p = r[s(-317, "iU!(")](
                                r[i(700, "lqr!")](
                                  r[s(-332, "5**I")](
                                    a["_\xea"][r[i(634, "#FdB")](a[i(568, "(5h(")], 1)],
                                    15,
                                  ),
                                  2,
                                ),
                                r[s(-292, "QQD8")](a["_\xea"][a[i(698, "!&EH")]], 6),
                              );
                              continue;
                            case "2":
                              c = r[s(-164, ")FA3")](
                                r[i(446, "S$EH")](
                                  r[s(-126, "!&EH")](
                                    r[s(-387, "IUs7")](c, a["_\xea"][f]),
                                    a["_\xea"][d],
                                  ),
                                  a["_\xea"][p],
                                ),
                                a["_\xea"][h],
                              );
                              continue;
                            case "3":
                              d = r[s(-150, "ea1u")](
                                r[i(440, "8Oiv")](
                                  r[s(-322, "qy3r")](
                                    a["_\xea"][r[s(-120, ")goq")](a[i(686, "ehxd")], 2)],
                                    3,
                                  ),
                                  4,
                                ),
                                r[s(-194, "l3WP")](
                                  a["_\xea"][r[i(696, "M#pd")](a[s(-101, "iU!(")], 1)],
                                  4,
                                ),
                              );
                              continue;
                            case "4":
                              r[i(469, "M#pd")](
                                isNaN,
                                a["_\xea"][r[i(543, "S$EH")](a[s(-328, "lqr!")], 1)],
                              )
                                ? (p = h = 64)
                                : r[i(580, "v6]c")](isNaN, a["_\xea"][a[i(621, "HmRp")]]) &&
                                  (h = 64);
                              continue;
                            case "5":
                              a[s(-393, "wReF")] -= 3;
                              continue;
                            case "6":
                              r[i(490, ")FA3")](
                                void 0 === n ? "undefined" : t(n),
                                r[i(605, "iU!(")],
                              ) &&
                                ((f = r[i(437, "iSBn")](n, f, x)),
                                (d = r[i(411, "iU!(")](n, d, x)),
                                (p = r[s(-161, "iSBn")](n, p, x)),
                                (h = r[s(-64, "v6]c")](n, h, x)));
                              continue;
                            case "7":
                              a["_\xe1"](o[i(635, "1F4e")]());
                              continue;
                            case "8":
                              a["_\xe1"](o[s(-296, ")goq")]());
                              continue;
                            case "9":
                              h = r[i(608, "wReF")](a["_\xea"][a[s(-184, "lxO1")]], 63);
                              continue;
                            case "10":
                              a["_\xe1"](o[i(695, "IUs7")]());
                              continue;
                          }
                          break;
                        }
                      return r[i(602, "7s0V")](c[i(544, "icaT")](/=/g, ""), v[x] || "");
                    },
                  };
                e[l(-228, "b!D8")] = h;
              }).call(this, n(1)(e));
            },
            function (e, n, r) {
              "use strict";
              (function (e) {
                var n =
                  "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
                    ? function (e) {
                        return typeof e;
                      }
                    : function (e) {
                        return e &&
                          "function" == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? "symbol"
                          : typeof e;
                      };
                function o(e, t, n) {
                  return (
                    t in e
                      ? Object.defineProperty(e, t, {
                          value: n,
                          enumerable: !0,
                          configurable: !0,
                          writable: !0,
                        })
                      : (e[t] = n),
                    e
                  );
                }
                !(function (e, t) {
                  function n(e, t) {
                    return ee(t - 107, e);
                  }
                  function r(e, t) {
                    return ee(t - 903, e);
                  }
                  for (var o = oe(); ; )
                    try {
                      if (
                        parseInt(n("S@lO", 757)) / 1 +
                          (parseInt(r("QovG", 1661)) / 2) * (parseInt(r("(meS", 1154)) / 3) +
                          (-parseInt(r("hIzm", 1453)) / 4) * (parseInt(r("3(AN", 1761)) / 5) +
                          (parseInt(r("C6fO", 1444)) / 6) * (-parseInt(r("$nFE", 1498)) / 7) +
                          (-parseInt(r("Y]ar", 1819)) / 8) * (-parseInt(r("Pt@f", 1181)) / 9) +
                          parseInt(n("3(AN", 770)) / 10 +
                          (-parseInt(r("N)xu", 1303)) / 11) * (parseInt(r("AcT^", 1284)) / 12) ===
                        866438
                      )
                        break;
                      o.push(o.shift());
                    } catch (e) {
                      o.push(o.shift());
                    }
                })();
                var i = r(5),
                  a = r(3),
                  c = r(14),
                  u = 0,
                  s = void 0,
                  l = void 0,
                  f = 0,
                  d = [],
                  p = function () {},
                  h = void 0,
                  v = void 0,
                  m = void 0,
                  x = void 0,
                  g = void 0,
                  b = void 0,
                  y = ("undefined" == typeof t ? "undefined" : n(t)) === N("S@lO", -557) ? null : t;
                if (("undefined" == typeof window ? "undefined" : n(window)) !== ae(647, "griD"))
                  for (var w = (ae(947, "q]CY") + "0")[N("YYv%", -348)]("|"), C = 0; ; ) {
                    switch (w[C++]) {
                      case "0":
                        b = N("ChZ!", -21) + "rt" in h[N("q]CY", -287)];
                        continue;
                      case "1":
                        v = h[ae(518, "AcT^")];
                        continue;
                      case "2":
                        h = window;
                        continue;
                      case "3":
                        x = h[ae(897, "@xF@")];
                        continue;
                      case "4":
                        g = h[ae(834, "Imsz")];
                        continue;
                      case "5":
                        m = h[N("54^6", -428)];
                        continue;
                    }
                    break;
                  }
                var S = function () {
                  var e = {};
                  function t(e, t) {
                    return N(t, e - 136);
                  }
                  function o(e, t) {
                    return ae(t - -397, e);
                  }
                  ((e[o("dE%z", 652)] = function (e, t) {
                    return e !== t;
                  }),
                    (e[t(131, "Q2Sc")] = t(-330, "wAHi")),
                    (e[o("l!WU", 308)] = function (e, t) {
                      return e < t;
                    }),
                    (e[t(-123, "Imsz")] = o(")8Bu", 303)),
                    (e[o("SYaz", 199)] = function (e, t) {
                      return e !== t;
                    }),
                    (e[t(-160, "N)xu")] = function (e, t) {
                      return e === t;
                    }),
                    (e[o("l!WU", -53)] = function (e, t) {
                      return e !== t;
                    }),
                    (e[o("jU*K", 458)] = t(32, "hIzm")),
                    (e[o("(f2U", 163)] = function (e, t) {
                      return e !== t;
                    }),
                    (e[t(-286, "36]w")] = function (e, t) {
                      return e === t;
                    }),
                    (e[o("PZV1", 442)] = function (e, t) {
                      return e === t;
                    }),
                    (e[t(90, "Pt@f")] = t(-183, "]HJo")),
                    (e[o("WWJ$", 463)] = function (e, t) {
                      return e === t;
                    }),
                    (e[t(-8, "AcT^")] = t(81, "tt&(") + o("ChZ!", 234)),
                    (e[o("(meS", 11)] = function (e, t) {
                      return e === t;
                    }),
                    (e[o("Uj2C", 2)] = function (e, t) {
                      return e in t;
                    }),
                    (e[o("wAHi", 176)] = t(-328, "l1Y6")),
                    (e[o("DKL#", 396)] = function (e, t) {
                      return e > t;
                    }),
                    (e[o("(f2U", 323)] = o("36]w", 455) + "r"),
                    (e[o(")8Bu", 406)] = function (e, t) {
                      return e > t;
                    }),
                    (e[t(5, "Acl^")] = o("l!WU", 425) + "e"));
                  var i = e,
                    a = [];
                  (i[o("QYdW", 95)](n(h[o("3(AN", 218) + "t"]), i[t(171, "QYdW")]) ||
                  i[o("7hxe", 445)](n(h[o("Q2Sc", 135)]), i[o("8RnY", 646)])
                    ? (a[0] = 1)
                    : (a[0] =
                        i[t(-248, "tt&(")](h[o("k&f(", 181) + "t"], 1) ||
                        i[o("(8!5", 539)](h[o("Q2Sc", 135)], 1)
                          ? 1
                          : 0),
                    (a[1] =
                      i[o("jU*K", 599)](n(h[t(-59, "(8!5") + "m"]), i[o("Q2Sc", 630)]) ||
                      i[o("(8!5", -52)](n(h[t(-335, "Imsz")]), i[o("SlDP", 555)])
                        ? 1
                        : 0),
                    (a[2] = i[t(-478, "3(AN")](n(h[o("U02M", 221)]), i[o("l!WU", 360)]) ? 0 : 1),
                    (a[3] = i[o("griD", 148)](n(h[o("PZV1", 226)]), i[o("Imsz", 356)]) ? 0 : 1),
                    (a[4] = i[o("(9D4", 260)](n(h[t(-398, "DKL#")]), i[t(-246, "U02M")]) ? 0 : 1),
                    (a[5] = i[o("Q2Sc", 654)](v[t(-423, "54^6")], !0) ? 1 : 0),
                    (a[6] =
                      i[t(-148, "wAHi")](
                        n(h[o("hIzm", 41) + t(-373, "wAHi")]),
                        i[o("wAHi", 392)],
                      ) &&
                      i[o("WWJ$", 381)](
                        n(h[o("SYaz", 363) + t(-104, "k&f(") + t(123, "PZV1")]),
                        i[t(116, "PZV1")],
                      )
                        ? 0
                        : 1));
                  try {
                    (i[o("WWJ$", 381)](
                      n(Function[t(-383, "(f2U")][o("C6fO", 289)]),
                      i[t(-476, "l1Y6")],
                    ) && (a[7] = 1),
                      i[o(")8Bu", 345)](
                        Function[o("wAHi", 642)][o("l1Y6", 113)]
                          [t(-339, "36]w")]()
                          [o("griD", 169)](/bind/g, i[t(-69, "ChZ!")]),
                        Error[t(-92, "PZV1")](),
                      ) && (a[7] = 1),
                      i[o("U02M", 491)](
                        Function[o("1*rM", 567)][o("YxiJ", 431)]
                          [o("YYv%", 549)]()
                          [t(-270, "Acl^")](/toString/g, i[t(-320, "Q2Sc")]),
                        Error[t(-418, "Acl^")](),
                      ) && (a[7] = 1));
                  } catch (e) {
                    a[7] = 0;
                  }
                  ((a[8] =
                    v[t(-266, "dE%z")] && i[t(-415, "SlDP")](v[o("S@lO", -39)][t(-465, "C6fO")], 0)
                      ? 1
                      : 0),
                    (a[9] = i[t(-77, "DKL#")](v[o("C6fO", 398)], "") ? 1 : 0),
                    (a[10] =
                      i[t(114, "7hxe")](h[t(-453, "Acl^")], i[t(-407, "(9D4")]) &&
                      i[t(-16, "WWJ$")](h[o("QovG", 613)], i[t(104, "SlDP")])
                        ? 1
                        : 0),
                    (a[11] = h[t(-486, "QYdW")] && !h[t(-179, "S@lO")][o("54^6", 32)] ? 1 : 0),
                    (a[12] = i[t(-174, "YYv%")](h[o("q]CY", 472)], void 0) ? 1 : 0),
                    (a[13] = i[t(-50, "YYv%")](i[t(-434, "EGti")], v) ? 1 : 0),
                    (a[14] = v[o("1*rM", 590) + t(-79, "%4m!")](i[o("AcT^", -16)]) ? 1 : 0),
                    (a[15] =
                      g[o("(meS", 629)] &&
                      i[o("(9D4", 71)](
                        g[o("3(AN", 399)][o("U02M", 93)]()[o("q]CY", 553)](i[t(-199, "36]w")]),
                        -1,
                      )
                        ? 1
                        : 0));
                  try {
                    a[16] = r(
                      !(function () {
                        var e = new Error("Cannot find module 'child_process'");
                        throw ((e.code = "MODULE_NOT_FOUND"), e);
                      })(),
                    )
                      ? 1
                      : 0;
                  } catch (e) {
                    a[16] = 0;
                  }
                  try {
                    a[17] = i[t(-527, "dE%z")](
                      h[t(-337, "(9D4")][o("griD", 123) + t(82, "k&f(")]
                        [o("ChZ!", 521)]()
                        [o("54^6", 288)](i[t(-223, "7hxe")]),
                      -1,
                    )
                      ? 0
                      : 1;
                  } catch (e) {
                    a[17] = 0;
                  }
                  return a;
                };
                function k(e) {
                  var t = {
                      fvzIs: function (e, t) {
                        return e(t);
                      },
                      mblsy: r("54^6", 1202),
                    },
                    n = function (e) {
                      var t;
                      return (
                        o((t = {}), a(834, "N)xu") + e + (a(884, "Y]ar") + a(1054, "Uj2C")), !0),
                        o(
                          t,
                          r("WWJ$", 1276) +
                            r("QovG", 1774) +
                            e +
                            (a(894, "U02M") + r("Uj2C", 1538)),
                          !0,
                        ),
                        o(t, a(1226, "(8!5") + r(")8Bu", 1770) + a(1074, "YxiJ"), !0),
                        o(
                          t,
                          a(970, "@xF@") +
                            e +
                            (a(1375, "YxiJ") + r("36]w", 1208) + r("PZV1", 1773)),
                          !0,
                        ),
                        o(
                          t,
                          a(1243, "54^6") +
                            a(866, "Uj2C") +
                            e +
                            (a(951, "Pt@f") + r("aDkK", 1702) + a(1008, "N)xu")),
                          !0,
                        ),
                        o(
                          t,
                          r("Pt@f", 1338) + r("tt&(", 1581) + r("jU*K", 1504) + r("k&f(", 1379),
                          !0,
                        ),
                        t
                      );
                    };
                  function r(e, t) {
                    return N(e, t - 1866);
                  }
                  var i = Function[a(849, "SlDP")][a(907, "36]w")][a(920, "U02M")](e);
                  function a(e, t) {
                    return N(t, e - 1382);
                  }
                  var c = Function[r("SYaz", 1215)][a(718, "54^6")][r("N)xu", 1752)](
                      e[a(905, "Uj2C")],
                    ),
                    u = e[a(865, ")8Bu")][r("l!WU", 1615)](/get\s/, "");
                  return (
                    (t[r("%4m!", 1335)](n, u)[i] && t[a(1103, "l1Y6")](n, t[a(1314, "hIzm")])[c]) ||
                    !1
                  );
                }
                function O(e, t, r) {
                  var o = {};
                  ((o[a(170, "Pt@f")] = function (e, t) {
                    return e > t;
                  }),
                    (o[l("]HJo", 1169)] = function (e, t) {
                      return e < t;
                    }),
                    (o[a(558, "YxiJ")] = function (e, t) {
                      return e - t;
                    }),
                    (o[a(440, "SYaz")] = function (e, t) {
                      return e - t;
                    }),
                    (o[a(256, "jU*K")] = function (e, t) {
                      return e !== t;
                    }),
                    (o[l("QYdW", 1198)] = a(178, "Acl^")),
                    (o[a(416, "N)xu")] = function (e, t) {
                      return e > t;
                    }),
                    (o[l("Q2Sc", 827)] = function (e, t) {
                      return e > t;
                    }));
                  var i = o;
                  function a(e, t) {
                    return N(t, e - 757);
                  }
                  var c = t || h[a(194, "Imsz")];
                  if (i[l("YYv%", 704)](c[a(651, "$nFE")], 0)) {
                    if (
                      e[a(211, "YYv%") + "mp"] &&
                      i[a(458, "U02M")](
                        i[l("griD", 1360)](c[a(247, "l1Y6")], e[l("Y]ar", 730) + "mp"]),
                        15,
                      )
                    )
                      return;
                    e[l("griD", 877) + "mp"] = c[l("YxiJ", 1225)];
                  }
                  var s = {};
                  function l(e, t) {
                    return ae(t - 315, e);
                  }
                  ((s[l("ChZ!", 1343)] = c[a(140, "griD")].id || ""),
                    (s[l("C6fO", 919)] = i[l(")8Bu", 797)](m[a(312, "(9D4")](), u)));
                  var f = c[l("griD", 868) + a(365, "dE%z")];
                  (f && f[l(")8Bu", 1299)]
                    ? ((s[l("AcT^", 923)] = f[0][l("1*rM", 822)]),
                      (s[l("%4m!", 1199)] = f[0][l("YxiJ", 830)]))
                    : ((s[a(659, "aDkK")] = c[l("U02M", 1096)]),
                      (s[l("Q2Sc", 1353)] = c[l("wAHi", 957)])),
                    i[a(761, "EGti")](void 0 === r ? "undefined" : n(r), i[a(682, "griD")])
                      ? (e[a(706, "Uj2C")][r][l("wAHi", 1321)](s),
                        i[l("Y]ar", 1133)](
                          e[l("(8!5", 750)][r][l("l!WU", 685)],
                          e[l("jU*K", 1079)],
                        ) && e[a(471, "1*rM")][r][l("C6fO", 1029)]())
                      : (e[l("WWJ$", 798)][l("1*rM", 885)](s),
                        i[l("7hxe", 1142)](
                          e[a(162, "7hxe")][l("N)xu", 1271)],
                          e[l("%4m!", 1148)],
                        ) && e[a(304, "SYaz")][l("hIzm", 1254)]()));
                }
                function E(e) {
                  var t = {};
                  function n(e, t) {
                    return N(t, e - 943);
                  }
                  t[n(298, "U02M")] = function (e, t) {
                    return e === t;
                  };
                  var r = t,
                    o = {};
                  function i(e, t) {
                    return N(t, e - 1062);
                  }
                  return (
                    (h[i(995, "k&f(")][i(724, "PZV1")]
                      ? h[n(523, "(meS")][n(725, "hIzm")][n(662, "Imsz")]("; ")
                      : [])[i(900, "k&f(")](function (t) {
                      var a = t[s("YxiJ", -653)]("="),
                        c = a[l("jU*K", 1076)](1)[s("griD", -243)]("="),
                        u = a[0][l("ChZ!", 1119)](/(%[0-9A-Z]{2})+/g, decodeURIComponent);
                      function s(e, t) {
                        return n(t - -975, e);
                      }
                      function l(e, t) {
                        return i(t - 156, e);
                      }
                      return (
                        (c = c[l("aDkK", 994)](/(%[0-9A-Z]{2})+/g, decodeURIComponent)),
                        (o[u] = c),
                        r[l("3(AN", 630)](e, u)
                      );
                    }),
                    e ? o[e] || "" : o
                  );
                }
                function _(e) {
                  function t(e, t) {
                    return ae(t - 480, e);
                  }
                  if (!e || !e[n("q]CY", -387)]) return [];
                  function n(e, t) {
                    return ae(t - -986, e);
                  }
                  var r = [];
                  return (
                    e[t("C6fO", 1491)](function (e) {
                      function o(e, t) {
                        return n(t, e - 1662);
                      }
                      function i(e, n) {
                        return t(n, e - -564);
                      }
                      var c = a.sc(e[i(596, "1[03")]);
                      r = r[o(1365, "Pt@f")](
                        a.va(e[o(1205, "Uj2C")]),
                        a.va(e[o(1548, "Uj2C")]),
                        a.va(e[o(1269, "k&f(")]),
                        a.va(c[i(793, "Acl^")]),
                        c,
                      );
                    }),
                    r
                  );
                }
                var W = {
                    data: [],
                    maxLength: 1,
                    init: function () {
                      var e = {};
                      function t(e, t) {
                        return ae(e - 519, t);
                      }
                      ((e[o("8RnY", -76)] = o("griD", 502) + o("(meS", 456)),
                        (e[o("1[03", -24)] = t(1073, "Uj2C") + o("DKL#", 259)),
                        (e[t(1226, "hIzm")] = o("F[!2", 474) + t(1536, "tt&(")),
                        (e[o("S@lO", 205)] = function (e, t) {
                          return e + t;
                        }));
                      var n = e,
                        r = a[o("dE%z", 60)](this, n[t(964, "AcT^")]);
                      function o(e, t) {
                        return ae(t - -512, e);
                      }
                      var i = a[t(1328, "l!WU")](T, b ? n[t(975, "YYv%")] : n[t(862, "Uj2C")]);
                      this.c = a[o("YYv%", 144)](n[t(1057, "QovG")](r, i));
                    },
                    handleEvent: function (e) {
                      ({
                        vIhoK: function (e, t, n) {
                          return e(t, n);
                        },
                      })[N("l!WU", -301)](O, this, e);
                    },
                    packN: function () {
                      var e = {
                        uzOqT: function (e, t) {
                          return e === t;
                        },
                        pDSzS: function (e, t) {
                          return e(t);
                        },
                      };
                      if (e[n("(8!5", 1357)](this[n("jU*K", 883)][n("N)xu", 1339)], 0)) return [];
                      var t = [][n("S@lO", 790)](
                        a.ek(4, this[n("Y]ar", 826)]),
                        e[r(1866, "]HJo")](_, this[n("QYdW", 1113)]),
                      );
                      function n(e, t) {
                        return ae(t - 383, e);
                      }
                      function r(e, t) {
                        return N(t, e - 1877);
                      }
                      return t[r(1295, "N)xu")](this.c);
                    },
                  },
                  T = {
                    data: [],
                    maxLength: 1,
                    handleEvent: function (e) {
                      (f++,
                        {
                          KvmCh: function (e, t, n) {
                            return e(t, n);
                          },
                        }[ae(851, "Imsz")](O, this, e));
                    },
                    packN: function () {
                      var e = {
                        lsbtf: function (e, t) {
                          return e === t;
                        },
                        BtfTk: function (e, t) {
                          return e(t);
                        },
                      };
                      function t(e, t) {
                        return N(t, e - 1552);
                      }
                      function n(e, t) {
                        return ae(t - 489, e);
                      }
                      return e[t(1014, "q]CY")](this[n("dE%z", 1493)][n("]HJo", 1531)], 0)
                        ? []
                        : [][n("ChZ!", 1449)](
                            a.ek(b ? 1 : 2, this[t(1418, "l1Y6")]),
                            e[t(1363, "3(AN")](_, this[n("@xF@", 893)]),
                          );
                    },
                  },
                  P = {
                    data: [],
                    maxLength: 30,
                    handleEvent: function (e) {
                      function t(e, t) {
                        return ae(t - -256, e);
                      }
                      var n = {
                        WJglf: function (e, t, n, r) {
                          return e(t, n, r);
                        },
                        Zssyc: function (e, t, n) {
                          return e(t, n);
                        },
                      };
                      b
                        ? (!this[t("YxiJ", 252)][f] && (this[ae(820, "Acl^")][f] = []),
                          n[t("@xF@", 329)](O, this, e, f))
                        : n[t("l!WU", 534)](O, this, e);
                    },
                    packN: function () {
                      function e(e, t) {
                        return N(e, t - 1566);
                      }
                      var t = {
                          XHUBd: function (e, t) {
                            return e(t);
                          },
                          GaTmm: function (e, t) {
                            return e - t;
                          },
                          pBLVb: function (e, t) {
                            return e >= t;
                          },
                          tKBtH: function (e, t) {
                            return e > t;
                          },
                          isYjN: function (e, t) {
                            return e >= t;
                          },
                          XeHnc: function (e, t) {
                            return e === t;
                          },
                          JJTky: function (e, t) {
                            return e(t);
                          },
                        },
                        n = [];
                      if (b) {
                        n = this[e("griD", 1594)][u(1155, "WWJ$")](function (e) {
                          return e && e[u(1734, ")8Bu")] > 0;
                        });
                        for (
                          var r = 0, o = t[u(1369, "DKL#")](n[u(1152, "EGti")], 1);
                          t[e("54^6", 1223)](o, 0);
                          o--
                        ) {
                          r += n[o][e("$nFE", 1600)];
                          var i = t[u(1391, "U02M")](r, this[e("jU*K", 1318)]);
                          if (
                            (t[u(1351, "Q2Sc")](i, 0) && (n[o] = n[o][u(1363, ")8Bu")](i)),
                            t[u(1431, "AcT^")](i, 0))
                          ) {
                            n = n[e("3(AN", 1397)](o);
                            break;
                          }
                        }
                      } else n = this[u(1494, "k&f(")];
                      if (t[u(1273, "WWJ$")](n[e("jU*K", 1336)], 0)) return [];
                      var c = [][e("1[03", 1002)](a.ek(b ? 24 : 25, n));
                      function u(e, t) {
                        return ae(e - 750, t);
                      }
                      return (
                        b
                          ? n[e("1*rM", 1163)](function (n) {
                              function r(e, t) {
                                return u(t - -280, e);
                              }
                              c = (c = c[r("N)xu", 900)](a.va(n[e("36]w", 1345)])))[
                                r("griD", 1518)
                              ](t[r("l!WU", 1045)](_, n));
                            })
                          : (c = c[u(1579, "3(AN")](t[e("@xF@", 1352)](_, this[u(1529, "8RnY")]))),
                        c
                      );
                    },
                  },
                  R = {
                    data: [],
                    maxLength: 3,
                    handleEvent: function () {
                      var e = {};
                      function t(e, t) {
                        return ae(e - 362, t);
                      }
                      ((e[t(1296, "q]CY")] = function (e, t) {
                        return e > t;
                      }),
                        (e[i("Uj2C", 300)] = function (e, t) {
                          return e - t;
                        }),
                        (e[i("]HJo", 333)] = function (e, t) {
                          return e > t;
                        }));
                      var n = e,
                        r = {},
                        o =
                          h[i("SlDP", 395)][t(1284, "dE%z") + t(1357, "YxiJ")][i("WWJ$", 250)] ||
                          h[t(1350, "Uj2C")][i("U02M", -50)][t(763, "QYdW")];
                      function i(e, t) {
                        return N(e, t - 597);
                      }
                      n[t(1341, "8RnY")](o, 0) &&
                        ((r[t(989, "QovG")] = o),
                        (r[i("Acl^", 272)] = n[t(988, "54^6")](m[t(837, ")8Bu")](), u)),
                        this[i("8RnY", 364)][t(1193, "@xF@")](r),
                        n[i("U02M", 116)](
                          this[i("S@lO", 321)][t(1177, "@xF@")],
                          this[i("AcT^", 306)],
                        ) && this[i("(f2U", 492)][i("]HJo", 474)]());
                    },
                    packN: function () {
                      function e(e, t) {
                        return N(e, t - 1364);
                      }
                      if (
                        (b && this[e("YYv%", 850) + "t"](), !this[e("YYv%", 822)][e("jU*K", 1134)])
                      )
                        return [];
                      var t = [][n(205, ")8Bu")](a.ek(3, this[n(-50, "1[03")]));
                      function n(e, t) {
                        return ae(e - -675, t);
                      }
                      return (
                        this[n(-298, "l!WU")][n(28, "QovG")](function (n) {
                          function r(t, n) {
                            return e(n, t - -1364);
                          }
                          t = t[e("3(AN", 1181)](a.va(n[r(-673, "wAHi")]), a.va(n[r(38, "aDkK")]));
                        }),
                        t
                      );
                    },
                  },
                  A = {
                    init: function () {
                      var e = {};
                      e[r("(8!5", 1382)] = n("dE%z", 75) + "fo";
                      var t = e;
                      function n(e, t) {
                        return N(e, t - 90);
                      }
                      function r(e, t) {
                        return N(e, t - 1501);
                      }
                      ((this[n("l!WU", -545)] = {}),
                        (this[r("Q2Sc", 990)][n("EGti", -575)] =
                          h[n("griD", -75)][r("Pt@f", 1354)]),
                        (this[n("QYdW", -192)][n("EGti", 45)] =
                          h[n("@xF@", -544)][r("1[03", 1523)]),
                        (this.c = a[n("(8!5", -560)](a[n("EGti", -212)](this, t[r("Imsz", 886)]))));
                    },
                    packN: function () {
                      var e = {};
                      function t(e, t) {
                        return N(t, e - 342);
                      }
                      ((e[t(70, "C6fO")] = function (e, t) {
                        return e && t;
                      }),
                        (e[f("griD", 437)] = function (e, t) {
                          return e > t;
                        }),
                        (e[f("EGti", 419)] = function (e, t) {
                          return e === t;
                        }));
                      var n = e,
                        r = a.ek(7),
                        o = this[f("l1Y6", 410)],
                        i = o.href,
                        c = void 0 === i ? "" : i,
                        u = o.port,
                        s = void 0 === u ? "" : u;
                      if (n[f("l!WU", 283)](!c, !s)) return [][t(-208, "8RnY")](r, this.c);
                      var l = n[f("YxiJ", 109)](c[t(-251, "3(AN")], 128)
                        ? c[t(339, "C6fO")](0, 128)
                        : c;
                      function f(e, t) {
                        return ae(t - -468, e);
                      }
                      var d = a.sc(l);
                      return [][t(-24, "k&f(")](
                        r,
                        a.va(d[f("DKL#", 300)]),
                        d,
                        a.va(s[t(314, ")8Bu")]),
                        n[f("Acl^", 547)](s[t(286, "N)xu")], 0)
                          ? []
                          : a.sc(this[t(-111, "SYaz")][t(-258, "YxiJ")]),
                        this.c,
                      );
                    },
                  },
                  I = {
                    init: function () {
                      function e(e, t) {
                        return N(e, t - 22);
                      }
                      function t(e, t) {
                        return N(e, t - 1827);
                      }
                      ((this[e("U02M", 35)] = {}),
                        (this[t("QYdW", 1545)][e("54^6", -346)] =
                          h[e("1*rM", -447)][e("EGti", -633)]),
                        (this[t("F[!2", 1470)][t("54^6", 1341) + "t"] =
                          h[e("Uj2C", -533)][e("8RnY", -356) + "t"]));
                    },
                    packN: function () {
                      function e(e, t) {
                        return N(e, t - 450);
                      }
                      return [][e("Uj2C", 339)](
                        a.ek(8),
                        a.va(this[e("l1Y6", 316)][e("SYaz", 6)]),
                        a.va(this[ae(819, "N)xu")][e("SlDP", -112) + "t"]),
                      );
                    },
                  },
                  j = {
                    init: function () {
                      var e = {};
                      function t(e, t) {
                        return ae(t - -1059, e);
                      }
                      function n(e, t) {
                        return N(e, t - 398);
                      }
                      ((e[n("3(AN", 132)] = function (e, t) {
                        return e + t;
                      }),
                        (e[t("(8!5", -316)] = function (e, t) {
                          return e * t;
                        }),
                        (e[n("Y]ar", 223)] = function (e, t) {
                          return e + t;
                        }));
                      var r = e;
                      this[t("U02M", -34)] =
                        r[n("F[!2", 261)](
                          h[n("]HJo", 131)](
                            r[t("54^6", -206)](
                              x[t("Acl^", -625)](),
                              r[n("k&f(", -78)](x[n("tt&(", -229)](2, 52), 1)[n("1*rM", -201)](),
                            ),
                            10,
                          ),
                          h[n("N)xu", 0)](
                            r[n("jU*K", 351)](
                              x[t("Y]ar", -286)](),
                              r[t("Q2Sc", -367)](x[n("ChZ!", -196)](2, 30), 1)[t("3(AN", -86)](),
                            ),
                            10,
                          ),
                        ) +
                        "-" +
                        s;
                    },
                    packN: function () {
                      function e(e, t) {
                        return ae(t - 517, e);
                      }
                      return (
                        this[e("QYdW", 1275)](),
                        [][e("8RnY", 979)](a.ek(9, this[N("(8!5", -577)]))
                      );
                    },
                  },
                  M = {
                    data: [],
                    init: function () {
                      function e(e, t) {
                        return N(e, t - 1644);
                      }
                      this[e("N)xu", 1451)] = {
                        PqHow: function (e) {
                          return e();
                        },
                      }[e("YYv%", 1591)](S);
                    },
                    packN: function () {
                      var e = {
                        crWSj: t(775, "Acl^") + n(1394, "tt&(") + n(1068, "@xF@") + "ay",
                        mCtYb: n(1081, "$nFE") + t(585, "Imsz") + n(973, "S@lO") + n(1633, ")8Bu"),
                        PwKCs: t(600, "(8!5") + n(1372, "(8!5") + t(779, "wAHi") + n(1638, "]HJo"),
                        Xrlbt: function (e, t) {
                          return e(t);
                        },
                        aONGn: function (e, t) {
                          return e < t;
                        },
                        IHMQg: function (e, t) {
                          return e << t;
                        },
                      };
                      try {
                        this[n(1353, "k&f(")][18] = Object[n(1423, "AcT^")](h[t(773, "C6fO")])[
                          t(356, "l!WU")
                        ](function (e) {
                          return h[n(1029, "PZV1")][e] && h[n(1136, "]HJo")][e][t(292, "WWJ$")];
                        })
                          ? 1
                          : 0;
                      } catch (e) {
                        this[n(1570, "Uj2C")][18] = 0;
                      }
                      function t(e, t) {
                        return ae(e - -202, t);
                      }
                      function n(e, t) {
                        return N(t, e - 1621);
                      }
                      try {
                        this[t(306, "YxiJ")][19] = [
                          e[t(554, "hIzm")],
                          e[n(975, "Uj2C")],
                          e[t(776, "Imsz")],
                        ][t(409, "YYv%")](function (e) {
                          return !!h[e];
                        })
                          ? 1
                          : 0;
                      } catch (e) {
                        this[t(235, "(meS")][19] = 0;
                      }
                      if (Element[n(1368, "]HJo")][n(1612, "36]w") + "ow"])
                        try {
                          this[n(1622, "]HJo")][20] = e[n(1558, "N)xu")](
                            k,
                            Element[t(606, "hIzm")][n(1480, "YYv%") + "ow"],
                          )
                            ? 0
                            : 1;
                        } catch (e) {
                          this[n(1421, "DKL#")][20] = 1;
                        }
                      else this[t(688, "%4m!")][20] = 0;
                      for (
                        var r = 0, o = 0;
                        e[t(470, "36]w")](o, this[t(542, "k&f(")][t(258, "ChZ!")]);
                        o++
                      )
                        r += e[n(1333, "%4m!")](this[t(811, "]HJo")][o], o);
                      return [][n(1255, "k&f(")](a.ek(10), a.va(r));
                    },
                  },
                  B = {
                    init: function () {
                      function e(e, t) {
                        return N(e, t - -58);
                      }
                      this[e("Imsz", -235)] = a[e("1*rM", -34)](
                        h[e("AcT^", -599)][ae(521, ")8Bu")]
                          ? h[e("hIzm", -720)][e("Pt@f", -205)]
                          : "",
                      );
                    },
                    packN: function () {
                      function e(e, t) {
                        return N(e, t - 654);
                      }
                      if (!this[t(1134, "SlDP")][e("]HJo", 325)]()[t(1042, "Pt@f")]) return [];
                      function t(e, t) {
                        return N(t, e - 1497);
                      }
                      return [][t(1101, "(f2U")](a.ek(11), this[e("54^6", 237)]);
                    },
                  };
                function N(e, t) {
                  return ee(t - -908, e);
                }
                var D = {
                    init: function () {
                      function e(e, t) {
                        return ae(t - 801, e);
                      }
                      this[e("PZV1", 1406)] = h[e("Acl^", 1281) + e("QovG", 1718) + "nt"]
                        ? "y"
                        : "n";
                    },
                    packN: function () {
                      function e(e, t) {
                        return ae(e - -1054, t);
                      }
                      return [][e(-60, "U02M")](a.ek(12, this[e(-637, "7hxe")]));
                    },
                  },
                  z = {
                    init: function () {
                      function e(e, t) {
                        return ae(e - -1097, t);
                      }
                      this[e(-492, "PZV1")] = h[e(-238, "(9D4") + N("1*rM", -346)] ? "y" : "n";
                    },
                    packN: function () {
                      function e(e, t) {
                        return ae(t - 798, e);
                      }
                      return [][e("k&f(", 1444)](a.ek(13, this[e("(f2U", 1705)]));
                    },
                  },
                  L = {
                    init: function () {
                      function e(e, t) {
                        return ae(e - 748, t);
                      }
                      var t = {};
                      t[e(1215, "54^6")] = function (e, t) {
                        return e - t;
                      };
                      var n = t;
                      this[N("aDkK", -81)] = n[e(1254, "%4m!")](m[e(1360, "QYdW")](), l);
                    },
                    packN: function () {
                      function e(e, t) {
                        return ae(t - 878, e);
                      }
                      return (
                        this[e("tt&(", 1616)](),
                        [][e("aDkK", 1355)](a.ek(14, this[N("hIzm", -572)]))
                      );
                    },
                  },
                  F = {
                    init: function () {
                      this[ae(770, "Pt@f")] = v[ae(1037, "(f2U")];
                    },
                    packN: function () {
                      function e(e, t) {
                        return N(e, t - 1467);
                      }
                      if (!this[e("1[03", 1080)][t("36]w", 1395)]) return [];
                      function t(e, t) {
                        return ae(t - 604, e);
                      }
                      return [][t("(f2U", 1220)](a.ek(15, this[e("wAHi", 818)]));
                    },
                  },
                  H = {
                    init: function () {
                      function e(e, t) {
                        return N(e, t - 669);
                      }
                      this[e("36]w", 640)] = {
                        LmvHQ: function (e) {
                          return e();
                        },
                      }[e("3(AN", 30)](c);
                    },
                    packN: function () {
                      var e = this,
                        t = {};
                      ((t[r(-106, "(meS")] = c("aDkK", 1231) + r(540, "WWJ$")),
                        (t[c("dE%z", 1526)] = c("U02M", 1162) + r(-95, "]HJo")));
                      var n = t;
                      function r(e, t) {
                        return ae(e - -478, t);
                      }
                      var o = [],
                        i = {};
                      function c(e, t) {
                        return ae(t - 588, e);
                      }
                      return (
                        (i[n[c("N)xu", 1077)]] = 16),
                        (i[n[c("l1Y6", 1168)]] = 17),
                        Object[r(104, "S@lO")](this[c("1[03", 1213)])[r(234, "Uj2C")](function (t) {
                          function n(e, t) {
                            return r(e - 805, t);
                          }
                          var u = [][n(730, "(meS")](
                            e[n(1106, "8RnY")][t] ? a.ek(i[t], e[c("1[03", 1213)][t]) : [],
                          );
                          o[n(1299, "1[03")](u);
                        }),
                        o
                      );
                    },
                  },
                  V = {
                    init: function () {
                      var e = {};
                      function t(e, t) {
                        return ae(t - -961, e);
                      }
                      e[r("54^6", 1179)] = function (e, t) {
                        return e > t;
                      };
                      var n = e;
                      function r(e, t) {
                        return ae(t - 826, e);
                      }
                      var o = h[t("QYdW", -609)][t("1*rM", -592)] || "",
                        i = o[t("hIzm", -400)]("?");
                      this[r("YxiJ", 1334)] = o[t("jU*K", -91)](
                        0,
                        n[r("ChZ!", 1609)](i, -1) ? i : o[r("l1Y6", 1414)],
                      );
                    },
                    packN: function () {
                      if (!this[e("l!WU", -320)][e("Uj2C", 235)]) return [];
                      function e(e, t) {
                        return ae(t - -697, e);
                      }
                      return [][e("DKL#", 238)](a.ek(18, this[ae(931, "aDkK")]));
                    },
                  },
                  U = {
                    init: function () {
                      var e = {
                        bExfy: function (e, t) {
                          return e(t);
                        },
                        uGOfA: t("Uj2C", 820) + "d",
                      };
                      function t(e, t) {
                        return N(e, t - 987);
                      }
                      function n(e, t) {
                        return N(e, t - 769);
                      }
                      this[n("(9D4", 739)] = e[n("S@lO", 624)](E, e[t("SlDP", 403)]);
                    },
                    packN: function () {
                      if (!this[e(1683, "DKL#")][e(1682, "7hxe")]) return [];
                      function e(e, t) {
                        return N(t, e - 1883);
                      }
                      function t(e, t) {
                        return ae(e - -575, t);
                      }
                      return [][t(160, "F[!2")](a.ek(19, this[t(-158, "7hxe")]));
                    },
                  },
                  q = {
                    init: function () {
                      var e = {
                        QrEON: function (e, t) {
                          return e(t);
                        },
                        RnUlE: t("1*rM", -217),
                      };
                      function t(e, t) {
                        return ae(t - -841, e);
                      }
                      this[t("Y]ar", -398)] = e[t("l!WU", -16)](E, e[t("Pt@f", 16)]);
                    },
                    packN: function () {
                      if (!this[e(1557, "DKL#")][ae(460, "ChZ!")]) return [];
                      function e(e, t) {
                        return ae(e - 745, t);
                      }
                      return [][e(1242, "1*rM")](a.ek(20, this[e(1749, "dE%z")]));
                    },
                  },
                  G = {
                    data: 0,
                    packN: function () {
                      return [][N("(f2U", -396)](a.ek(21, this[ae(437, "(meS")]));
                    },
                  },
                  $ = {
                    init: function (e) {
                      this[N("U02M", 13)] = e;
                    },
                    packN: function () {
                      return [][ae(830, "SlDP")](a.ek(22, this[ae(835, "Imsz")]));
                    },
                  },
                  Q = {
                    init: function () {
                      function e(e, t) {
                        return ae(e - 839, t);
                      }
                      var t = {
                        GmmJd: function (e, t) {
                          return e(t);
                        },
                        ztZTD: n(1164, "(meS"),
                      };
                      function n(e, t) {
                        return N(t, e - 1318);
                      }
                      this[n(1267, "Uj2C")] = t[e(1219, "%4m!")](E, t[e(1537, "1[03")]);
                    },
                    packN: function () {
                      if (!this[e(-234, ")8Bu")][e(-191, "EGti")]) return [];
                      function e(e, t) {
                        return N(t, e - 419);
                      }
                      function t(e, t) {
                        return ae(e - -608, t);
                      }
                      return [][t(-160, "1[03")](a.ek(23, this[t(-3, "PZV1")]));
                    },
                  },
                  J = {
                    init: function () {
                      var e = {};
                      function t(e, t) {
                        return ae(t - -515, e);
                      }
                      function r(e, t) {
                        return ae(e - 95, t);
                      }
                      ((e[t("1*rM", 155)] = function (e, t) {
                        return e > t;
                      }),
                        (e[r(571, "3(AN")] = t("YYv%", 414)),
                        (e[r(991, "EGti")] = function (e, t) {
                          return e !== t;
                        }),
                        (e[r(817, "QYdW")] = t("7hxe", 433)),
                        (e[r(1050, ")8Bu")] = function (e, t) {
                          return e === t;
                        }),
                        (e[r(451, "tt&(")] =
                          t("Pt@f", 179) + r(568, "36]w") + t("8RnY", 474) + r(716, "(f2U")),
                        (e[r(549, "l1Y6")] = function (e, t) {
                          return e < t;
                        }),
                        (e[t("DKL#", 321)] = function (e, t) {
                          return e << t;
                        }));
                      for (
                        var o = e,
                          i = [
                            h[r(437, "PZV1")] ||
                            h[r(959, "l!WU")] ||
                            (v[t("Q2Sc", 7)] &&
                              o[r(1118, "SYaz")](
                                v[r(1006, "(8!5")][r(674, "SlDP")](o[r(470, "S@lO")]),
                                -1,
                              ))
                              ? 1
                              : 0,
                            o[r(608, "(9D4")](
                              "undefined" == typeof InstallTrigger
                                ? "undefined"
                                : n(InstallTrigger),
                              o[r(689, ")8Bu")],
                            )
                              ? 1
                              : 0,
                            /constructor/i[r(469, "aDkK")](h[t("QovG", 428) + "t"]) ||
                            o[t("EGti", 526)](
                              ((h[r(436, "1[03")] &&
                                h[t("8RnY", 232)][r(756, "C6fO") + t("7hxe", 61)]) ||
                                "")[t("Uj2C", 20)](),
                              o[t("YxiJ", 334)],
                            )
                              ? 1
                              : 0,
                            (h[r(727, "S@lO")] && h[r(773, "Acl^")][t("q]CY", 18) + "de"]) ||
                            h[t("Imsz", 478)] ||
                            h[r(1080, "3(AN")]
                              ? 1
                              : 0,
                            h[r(832, "(8!5")] &&
                            (h[r(1019, "1[03")][t("aDkK", 361)] || h[t("griD", 40)][t("(f2U", -76)])
                              ? 1
                              : 0,
                          ],
                          a = 0,
                          c = 0;
                        o[t("aDkK", 461)](c, i[r(1128, "WWJ$")]);
                        c++
                      )
                        a += o[r(1095, "Q2Sc")](i[c], c);
                      this[r(658, "EGti")] = a;
                    },
                    packN: function () {
                      function e(e, t) {
                        return N(t, e - 1136);
                      }
                      return [][e(800, "Y]ar")](a.ek(26), a.va(this[e(773, "SlDP")]));
                    },
                  },
                  K = {
                    packN: function () {
                      var e = {};
                      function t(e, t) {
                        return ae(t - -483, e);
                      }
                      ((e[t("hIzm", -62)] = function (e, t) {
                        return e === t;
                      }),
                        (e[t("N)xu", 176)] = t(")8Bu", -77)));
                      var n = e;
                      function r(e, t) {
                        return ae(e - -1037, t);
                      }
                      return (
                        (this[r(-54, "36]w")] = n[r(-213, "Imsz")](
                          h[t("WWJ$", 266)][r(-401, "8RnY") + r(-107, "SYaz")],
                          n[r(-610, "jU*K")],
                        )
                          ? 1
                          : 0),
                        [][t("F[!2", 252)](a.ek(27), a.va(this[r(-611, "q]CY")]))
                      );
                    },
                  },
                  Y = {
                    init: function () {
                      var e = {
                        vCBGn: function (e, t) {
                          return e === t;
                        },
                        tQicC: t("hIzm", 385),
                        fkJEI: function (e, t) {
                          return e === t;
                        },
                        UHWex: t("aDkK", 315),
                        Ouhaj: n("8RnY", 1124),
                        EZGjD: function (e, t) {
                          return e(t);
                        },
                        yBBXE: n("U02M", 1445),
                        hKIUR: function (e, t) {
                          return e(t);
                        },
                        eLoGi:
                          n("Imsz", 975) +
                          n("%4m!", 1300) +
                          n("dE%z", 1464) +
                          n("Y]ar", 1169) +
                          '2"',
                      };
                      function t(e, t) {
                        return N(e, t - 631);
                      }
                      function n(e, t) {
                        return N(e, t - 1594);
                      }
                      try {
                        var r = h[t("36]w", 545)][n("AcT^", 1456) + t("(9D4", 256)](
                            e[n("7hxe", 1422)],
                          ),
                          o = function (o) {
                            function i(e, n) {
                              return t(n, e - 918);
                            }
                            function a(e, t) {
                              return n(t, e - -107);
                            }
                            try {
                              var c = r[i(1166, "AcT^") + "e"](o);
                              return e[i(1002, "Imsz")](c, e[i(1128, "]HJo")])
                                ? 1
                                : e[i(1134, "(8!5")](c, e[a(1181, "YYv%")])
                                  ? 2
                                  : MediaSource[a(843, "(8!5") + a(1092, ")8Bu")](o)
                                    ? 3
                                    : 0;
                            } catch (e) {
                              return 0;
                            }
                          };
                        this[n("@xF@", 986)] = {
                          mp3: e[t("YYv%", 651)](o, e[t("l!WU", 573)]),
                          mp4: e[t("S@lO", 546)](o, e[t("Acl^", 480)]),
                        };
                      } catch (e) {
                        var i = {};
                        ((i[n("SlDP", 1101)] = 0),
                          (i[n("]HJo", 1116)] = 0),
                          (this[t("]HJo", 632)] = i));
                      }
                    },
                    packN: function () {
                      function e(e, t) {
                        return ae(t - -215, e);
                      }
                      return [][ae(602, "q]CY")](
                        a.ek(28),
                        a.va(this[e("54^6", 380)][e("AcT^", 806)]),
                        a.va(this[e("EGti", 348)][e("EGti", 145)]),
                      );
                    },
                  };
                function X(e) {
                  function t(e, t) {
                    return N(t, e - -25);
                  }
                  [I, M, B, D, z, F, H, V, U, q, $, Q, A, J, W, Y][t(-96, ")8Bu")](function (n) {
                    n[t(-355, "3(AN")](e);
                  });
                }
                function Z() {
                  var e = {};
                  function t(e, t) {
                    return ae(t - -635, e);
                  }
                  ((e[i("PZV1", 1343)] = i("QovG", 1659)),
                    (e[t("dE%z", -241)] = i("aDkK", 1273)),
                    (e[t("C6fO", 141)] = i("]HJo", 1144)),
                    (e[t("Pt@f", -126)] = i("(9D4", 1657)),
                    (e[t("jU*K", 269)] = t("8RnY", 157)),
                    (e[t("dE%z", -184)] = t("Acl^", -144)));
                  var n = e,
                    r = n[i("C6fO", 1103)],
                    o = n[t("SlDP", 53)];
                  function i(e, t) {
                    return ae(t - 757, e);
                  }
                  (b && ((r = n[t("54^6", 251)]), (o = n[t("7hxe", 88)])),
                    h[t("8RnY", 335)][i("dE%z", 1355) + t("hIzm", -66)](r, T, !0),
                    h[i("PZV1", 1177)][i("YYv%", 1601) + t("hIzm", -66)](o, P, !0),
                    h[i("YxiJ", 1262)][i("YYv%", 1601) + i(")8Bu", 1328)](n[t("l!WU", 387)], W, !0),
                    !b &&
                      h[i("S@lO", 1389)][i("QovG", 1209) + i("PZV1", 1573)](
                        n[t("EGti", 328)],
                        R,
                        !0,
                      ));
                }
                function ee(e, t) {
                  var n = oe();
                  return (ee = function (t, r) {
                    var o = n[(t -= 235)];
                    void 0 === ee.zBlqyY &&
                      ((ee.AroTHC = function (e, t) {
                        var n = [],
                          r = 0,
                          o = void 0,
                          i = "";
                        e = (function (e) {
                          for (
                            var t, n, r = "", o = "", i = 0, a = 0;
                            (n = e.charAt(a++));
                            ~n && ((t = i % 4 ? 64 * t + n : n), i++ % 4)
                              ? (r += String.fromCharCode(255 & (t >> ((-2 * i) & 6))))
                              : 0
                          )
                            n =
                              "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=".indexOf(
                                n,
                              );
                          for (var c = 0, u = r.length; c < u; c++)
                            o += "%" + ("00" + r.charCodeAt(c).toString(16)).slice(-2);
                          return decodeURIComponent(o);
                        })(e);
                        var a = void 0;
                        for (a = 0; a < 256; a++) n[a] = a;
                        for (a = 0; a < 256; a++)
                          ((r = (r + n[a] + t.charCodeAt(a % t.length)) % 256),
                            (o = n[a]),
                            (n[a] = n[r]),
                            (n[r] = o));
                        ((a = 0), (r = 0));
                        for (var c = 0; c < e.length; c++)
                          ((r = (r + n[(a = (a + 1) % 256)]) % 256),
                            (o = n[a]),
                            (n[a] = n[r]),
                            (n[r] = o),
                            (i += String.fromCharCode(e.charCodeAt(c) ^ n[(n[a] + n[r]) % 256])));
                        return i;
                      }),
                      (e = arguments),
                      (ee.zBlqyY = !0));
                    var i = t + n[0],
                      a = e[i];
                    return (
                      a
                        ? (o = a)
                        : (void 0 === ee.IXvKws && (ee.IXvKws = !0),
                          (o = ee.AroTHC(o, r)),
                          (e[i] = o)),
                      o
                    );
                  })(e, t);
                }
                function te() {
                  function e(e, t) {
                    return N(t, e - 1344);
                  }
                  ((f = 0),
                    [T, P, W, R][e(711, "QYdW")](function (t) {
                      t[e(1198, "tt&(")] = [];
                    }));
                }
                function ne() {
                  var e = {};
                  e[N("(meS", -429)] = function (e, t) {
                    return e + t;
                  };
                  var t = e;
                  function n(e, t) {
                    return N(e, t - -33);
                  }
                  var r = a[n("(f2U", -366)](
                    t[n("YxiJ", -397)](S[n("Q2Sc", -270)](), re[n("YYv%", -99)]()),
                  );
                  d = r[n("q]CY", -423)](function (e) {
                    return String[n("(f2U", -117) + "de"](e);
                  });
                }
                function re() {
                  var e,
                    t = {
                      JSeyi: function (e) {
                        return e();
                      },
                      CTxCC: p(1349, "QYdW"),
                      npRBP: function (e, t, n) {
                        return e(t, n);
                      },
                      iSDtI: function (e, t) {
                        return e < t;
                      },
                      hNmVQ: function (e, t) {
                        return e === t;
                      },
                      xfDub: function (e, t) {
                        return e > t;
                      },
                      HvucD: function (e, t) {
                        return e <= t;
                      },
                      kbnzE: function (e, t) {
                        return e - t;
                      },
                      YrazO: function (e, t) {
                        return e << t;
                      },
                      fBcAN: function (e, t) {
                        return e > t;
                      },
                      dhItA: function (e, t) {
                        return e + t;
                      },
                      yQQNR: n(743, "PZV1"),
                    };
                  if (!h) return "";
                  function n(e, t) {
                    return N(t, e - 1064);
                  }
                  var r = t[n(884, "1*rM")],
                    o = (e = [])[p(1188, "(meS")].apply(
                      e,
                      [
                        T[r](),
                        P[r](),
                        W[r](),
                        R[r](),
                        A[r](),
                        I[r](),
                        j[r](),
                        M[r](),
                        B[r](),
                        D[r](),
                        z[r](),
                        L[r](),
                        F[r](),
                      ].concat(
                        (function (e) {
                          if (Array.isArray(e)) {
                            for (var t = 0, n = Array(e.length); t < e.length; t++) n[t] = e[t];
                            return n;
                          }
                          return Array.from(e);
                        })(H[r]()),
                        [V[r](), U[r](), q[r](), G[r](), $[r](), Q[r](), J[r](), K[r](), Y[r]()],
                      ),
                    );
                  t[n(975, "@xF@")](
                    setTimeout,
                    function () {
                      t[n(719, "QovG")](te);
                    },
                    0,
                  );
                  for (
                    var c = o[p(1155, "l!WU")][p(1569, "PZV1")](2)[p(1336, "]HJo")](""), u = 0;
                    t[n(498, "$nFE")](c[n(1036, ")8Bu")], 16);
                    u += 1
                  )
                    c[p(1169, "jU*K")]("0");
                  c = c[p(1374, "YYv%")]("");
                  var s = [];
                  (t[p(1475, "YYv%")](o[n(873, "k&f(")], 0)
                    ? s[p(1226, "YxiJ")](0, 0)
                    : t[p(1437, "U02M")](o[n(512, "ChZ!")], 0) &&
                        t[n(448, "(f2U")](
                          o[n(592, "U02M")],
                          t[n(893, "ChZ!")](t[p(1313, "54^6")](1, 8), 1),
                        )
                      ? s[p(1517, "PZV1")](0, o[n(640, "l1Y6")])
                      : t[n(898, "k&f(")](
                          o[n(826, "(f2U")],
                          t[n(604, "QovG")](t[n(802, "%4m!")](1, 8), 1),
                        ) &&
                        s[p(1125, "%4m!")](
                          h[p(1718, "@xF@")](c[n(617, "jU*K")](0, 8), 2),
                          h[n(771, "$nFE")](c[n(551, "AcT^")](8, 16), 2),
                        ),
                    (o = [][n(692, "dE%z")]([1], [1, 0, 0], s, o)));
                  var l = i[p(1664, "ChZ!")](o),
                    f = [][n(599, "aDkK")][n(793, "F[!2")](l, function (e) {
                      return String[n(438, "Pt@f") + "de"](e);
                    });
                  function p(e, t) {
                    return N(t, e - 1797);
                  }
                  return t[n(484, "WWJ$")](
                    t[n(496, "SlDP")],
                    a[p(1436, "jU*K")](
                      t[p(1445, "36]w")](f[n(715, "l!WU")](""), d[p(1571, "@xF@")]("")),
                      a[n(856, "ChZ!")],
                    ),
                  );
                }
                function oe() {
                  var e = [
                    "abXDW7myW6aBfSofoa",
                    "lxjMWPddTCoLCmoGm8kP",
                    "W4dcPG7cJx4",
                    "sZyjWRlcL8ogis0",
                    "WRNdM8ocW4j3WRZcKHNdKW",
                    "W5qXmSoBW7m",
                    "DmoAWRtdRColWR/dQWz5lCkq",
                    "qConqg/cOmkwetmQ",
                    "uaS3WQTZ",
                    "ySokW77dImk1",
                    "WPfSWR3dLCkZWQtdVq",
                    "WRddG2rhW4aDFmo5FW",
                    "n8kKW4WSWOK",
                    "vmodW4ZdNSkz",
                    "hCkSgtZcVq",
                    "tSkpbCkEW6SRWQZcO17cKW",
                    "WP/cTmooWPqTW4i+CSkmW4y",
                    "wZ/dHG",
                    "gmkeW6mwWO8",
                    "WQxcO3ipW5pdN00",
                    "AtyQWQBcUa",
                    "W7ddSZCaW4W",
                    "WOVcUKenW5W",
                    "WPtcOCkgWPbY",
                    "WOxdH8oCW6fO",
                    "WR5/m1TFbItcLCk+vq",
                    "nCkoW7BcRSkFWPhdSGS",
                    "ubK3WP9J",
                    "bhBdICkNigi/nCoG",
                    "i8o4W57cJYC",
                    "uSkkdmk+W5C",
                    "W5Duew5D",
                    "WRagW53dOsRdRmovgq",
                    "W6bGkXu",
                    "WPvaWQq/WRRcHWCdW5/dUq",
                    "WPCxASk9W7a",
                    "iX7cNmoTEHlcVSoobCo0W6NcRq",
                    "i8oGW5/cJq",
                    "W4O+Afu2",
                    "CflcQSkz",
                    "WPOEr0JcLG",
                    "W691tfSWmSo+WRiJ",
                    "EexdISk+i14",
                    "WPddLCosW4y",
                    "W5pcPCo/W6v7W4C",
                    "W5uoWRzb",
                    "W4WxChyT",
                    "W5pdMdaFW7u",
                    "EeVdImkX",
                    "xSoOD0dcPW",
                    "W7xcLCoFW4HV",
                    "W4ZdP8kiW4i",
                    "mG9gW6etWOKLaW",
                    "WQ7dRmk5kSk8",
                    "WOOoW6xdJSozfG",
                    "cab7W6mC",
                    "W7zkoI7dSCk3W5JcIG",
                    "W4DUpuv1",
                    "pSkoW6uaWOK",
                    "WQmxAw3dUSk4W7dcU8opWOa",
                    "W4mmvwqA",
                    "W4xcGmkxWP89W6BdJG7dMX/dTbKr",
                    "W7DMtuSZi8ocWRqJxG",
                    "jSkFbJZcUa",
                    "fmkpW5OHWPW",
                    "lSoVW4lcMa",
                    "mHXBW6yzWRqYb8ov",
                    "W7ZcPalcIe7dN157gxu",
                    "hmkOW7SvWQxdICki",
                    "W7vFdrFdIW",
                    "W5hcVSoJW6X3WPvuW6tcOdK",
                    "dCkHoSoQWPWTpsjC",
                    "WR55W4ayqsZcVwddL8km",
                    "kmkmka3cTW",
                    "W4lcG8oODSo7WQtdMSoEacz9WOJdQW",
                    "d8kVmmkKW6KB",
                    "hKHMWO3dOW",
                    "eNXWWPS",
                    "jSk8o8kTW6K3C8ohvW",
                    "W4hdQCksW6auW40eECkcW40",
                    "t8kEcCkRySkJ",
                    "BHqxWP9HEa",
                    "w3RcM8kOWPddSCoZWRC",
                    "W4JdQcyaW5y",
                    "WQVcMmkwWOHZ",
                    "W4bRmrNdTa",
                    "WP0oW7FdJG",
                    "xContx4",
                    "zbiMWPhcRSodBG",
                    "dmkLlmobWO0R",
                    "W5lcGmk9wf4",
                    "DeJcISkfgSkHtga",
                    "W50tWRftW7VcKbftW6ldTa",
                    "bSkTWRq3",
                    "W5G9ALOJW4qaWRaKW6q",
                    "ssewWRZcL8ohka",
                    "WR8Bu8kNW4a",
                    "nmk+W7GaWQC",
                    "FCoPW4GjySoN",
                    "WPOdW6RdJmoa",
                    "bCkngSkLW4u",
                    "jSkcpGtcUXq",
                    "W6/dUJabW43dTCkaymki",
                    "WPBdLmkZka",
                    "W7TUkey",
                    "jSkiWOKYWPG",
                    "nCkNnSkXW78",
                    "WRZdSSoLW5nn",
                    "WQBdNSogW7q",
                    "W5pcQCoUW5v3W4ynW4xcTJu",
                    "uCo0BM/cNG",
                    "W7RcRCkjDKL0",
                    "r3tcPSk4WO7dVCoyWQzmqq",
                    "W7NcHmkFWQJcImkkbmotvYVcSW",
                    "W43cTmkLzum",
                    "nCkFpHVcVquSWPT0",
                    "cCkIW7G",
                    "E8kIu8kcW5/dRxRcRa",
                    "v8kAd8kyW6SM",
                    "b8kRkSkI",
                    "WOFcJurTW6a",
                    "aNldImky",
                    "amkNWRm+WPxcSa",
                    "C1pcVmkFdCk6",
                    "W5pcRmoHW6zgW4OdW7RcSJu",
                    "AmkjnSkLsG",
                    "WQlcJSkAWRm",
                    "pepcHmo8",
                    "W4tdO8ksW4qpW4S",
                    "amkSW78qWRldJ8onWPTCyG",
                    "WRBdGCk2f8kG",
                    "W443B1Sy",
                    "p8k/W442WOO",
                    "wCokW5NdTmko",
                    "ESk+iSkqW5C",
                    "WQhcJfrCW5yrt8k+",
                    "WPFdMSk+imkQW6K",
                    "FmkIxSkuW5pdVa",
                    "hmk3WQ4X",
                    "W4DvjZCG",
                    "W7n9jhnFcZddNmo0",
                    "W5eND0GTWOfp",
                    "W50VCf0",
                    "jmkVnSkAW5O",
                    "w8kgfmkdxq",
                    "tmoHW78zW7hdQeldPsm",
                    "rKxcVSkBpq",
                    "DmkkcCkEW7u",
                    "W7pcUSkdA2K",
                    "v8kSamktW6y",
                    "WOFdMCk5imkU",
                    "ymoVW7/dVSkxWOBcObxdTNS",
                    "WRpcQgqvW4FdJ0dcQSkECW",
                    "W47dHmkFW6i1",
                    "WQddNSomW7VdHmknaSo6",
                    "vsusWRNcGmobBtFcPMS",
                    "WOpcGgrVW7C",
                    "W5VdQCkrW4y",
                    "W7i4Ax8Q",
                    "Emo8W4u8C8oHBX0MWOq",
                    "W5PFCw0M",
                    "lczrW4ao",
                    "nCkScSosWPy",
                    "W5BcUmoJW6LIW4SnW7RdPNi",
                    "jhnrWPBdLq",
                    "smoQW64LW6/dOv4",
                    "W4WQWOvdCYxcP0ldUCkQ",
                    "W4b3fXZdTa",
                    "pw7cN8oAga",
                    "W4i1W7ZcQmkIWQNdRrXDWQe",
                    "zGSRWP3cR8kyw8oQW54",
                    "aCk9W64lWQu",
                    "hM9HWPW",
                    "W5GbWQTu",
                    "WPBdSCoEW4f8",
                    "lxhdTmkfmG",
                    "WRCbW4ZdUYRdRa",
                    "e8kSk8ofWPW",
                    "ymo/W6/dMSkcWOVcNqNdM3y",
                    "WQdcOgKVW5ZdIhW",
                    "W7LYtuWRl8oOWQXMvW",
                    "cMxdLmkkmwKDlCoTWPy",
                    "qxpdJCk0nq",
                    "tceeWQpcGSolpZe",
                    "neFcNSo6bwW",
                    "WPGjswa",
                    "W7ZcVCklFu10WRi",
                    "v8omsMNcP8kl",
                    "guJcNmo+ea",
                    "W4iGx8k8W6xcMs49WQJcSG",
                    "hCoiW63cQIa",
                    "W71WnvPueq4",
                    "WReWW5/dHbe",
                    "W5r0w0KX",
                    "BsddOCktW4u",
                    "vdSRWOdcKG",
                    "mqzDW7qc",
                    "W7P9kf4",
                    "WPNdM8otW5rGWR/cLbxdHa",
                    "jCkzf8oTWQK",
                    "W5JcMSo/W751",
                    "fmkVn8ofWPeWlJDgdq",
                    "w8oeW4/dMCky",
                    "EIJdMmkcW60",
                    "iCkJWQKX",
                    "WQxcJSkcWR4",
                    "zWmTWPf4Dq",
                    "W7WGWOzjEc3cHvVdQa",
                    "WQdcO24PW5pdIa",
                    "WPPSWRRdO8k3WQpdUIvY",
                    "WPP0WRFdISk7",
                    "iCknemoZWP4",
                    "WR7dS8oyW7hdUa",
                    "mCkgW6NcUmkPWQZdVrjr",
                    "zHanWPK",
                    "amkFiWdcOa",
                    "FKtdKG",
                    "WQhcIMPnW7Cmqmk0CG",
                    "W4xcVSoOW7HxW4uhW7RcSG",
                    "utxdHSkhW6jCWPWBpmk2",
                    "W6RcVCkDFu1JWRi",
                    "wcGpWRxcMmoqfq",
                    "W543b8o7W5HQW7ZcUgS",
                    "hCkdxYRcNCkrhIiNwW",
                    "WPL3WQ7dPmk7WQJdUXDQWPm",
                    "W6ZcT8k+zv5PWRK3",
                    "zxRdK8km",
                    "WPj3W68",
                    "W6Xupqmq",
                    "W5aSdCoNWRZdJGv5W5ZcMW",
                    "aSkYWO8BWRe",
                    "W40TgSoGW5P7",
                    "DmkEsCkzW5e",
                    "DCoJW4uBE8oQzqW",
                    "WPZdV8oVW7jx",
                    "zamwWPvwEmkXW4ePyq",
                    "iCoeW4VdQCoo",
                    "W4VcVW7cVv4",
                    "xYusWRe",
                    "WQ/cQw4TW4BdLa",
                    "hmkJWQ8QWOtcKv7cNq",
                    "WPSZW4/dVWm",
                    "amkLmmkGW7Wh",
                    "W6NcPmokW59B",
                    "WPBdUmoPW5ZdHq",
                    "W74Ld8oqWP8",
                    "nSkfoaNcPG",
                    "W47cGmkpDhy",
                    "uSomvK/cP8kCfW",
                    "WPWbW7u",
                    "WR9xWOldNmkxWQVdSd95WPG",
                    "kmkpprZcQW",
                    "W4ZdQCkFW5ywW4yEFW",
                    "DCoKW4JdJ8ktWORcOay",
                    "W6yvWO/dQhldTCkieCooba",
                    "tSkrbCkAW7KNWPhcO0G",
                    "WP7cNCkcWRbU",
                    "WR0hW5RdSt/dHSoD",
                    "WPNcQ248W7y",
                    "zCkpyCkVW6O",
                    "W4BdQCkl",
                    "f8kpW4KHWOe",
                    "r8oSs2hcTa",
                    "WQRcISkaWRvUiq",
                    "W7efWQXuWRRdQeffW5FdTa",
                    "W6RdV8k1W4C",
                    "uCo6W5pdLmkw",
                    "W7VcT8kdCK10",
                    "WQFcRxqR",
                    "W4FcJmoLeSktW5ZcG8ozkG",
                    "CXRdTmkxW5K",
                    "W7rZmaamW4DXzrW",
                    "jCkyemoKWOa",
                    "b1DnWRNdGa",
                    "td/dH8ka",
                    "FmoVW74B",
                    "WRldP2OAWOVdQmovECol",
                    "WP0aW6ddMSoggHOH",
                    "WRBcOMqVW5tdLuVcVCkL",
                    "W54Wg8oN",
                    "WOddMSkdn8k5W7tcHmoC",
                    "W4xcT8ocW7Tc",
                    "W6FdTd0tW5xdSCkjCq",
                    "uG43WQdcSG",
                    "o0BcK8ocegbCag3cQW",
                    "W6K5t38X",
                    "WRy1W7ldHmoV",
                    "w8kRDCkzW4u",
                    "WP8vB8kCW77cHfNcOZLU",
                    "W6WUWODl",
                    "DCoTW5ip",
                    "wmogsM3cSSkx",
                    "WPRdLmkMkSkSW7ZcNSoE",
                    "vKxdKCkUj27cVCoBkSoi",
                    "W6XGldSuW51yzXBcVG",
                    "WQFcO2m/W5/dMuVcRa",
                    "WRCaW7FdHSonfHC0ymkr",
                    "FCkDbSkvW4O",
                    "W7FcTSkzFLLJWR8JDSkx",
                    "EMxcImkPma",
                    "W6O6FvaNWR5tWQqRW6y",
                    "zbeHWPFcOCod",
                    "WRdcJMjgW5a",
                    "dmkti8okWOa",
                    "W5GSdCoZWQxdGGrJW5dcMq",
                    "WP9IWQhdTmk+WQldKcr5WPG",
                    "BelcQW",
                    "AhdcOmkfWQu",
                    "mIPNW6GL",
                    "WQqBW5hdOcJdVCochCkF",
                    "Cmo4W5ipDCoNwba1WOu",
                    "W5aIgSoZ",
                    "W73dIIDtWQ5yaCo5iIi",
                    "WRuSCCkx",
                    "sfBcI8kSWO8",
                    "WQ4YeX9UiCoWWRSExSoZ",
                    "W7ddTZCfW50",
                    "WOvMWQhdTmk3WRxdSca",
                    "W6xdTcWJW5NdT8kp",
                    "WR/dLmoDW6ZdLCkwoCo9AaC",
                    "jG9aW7m",
                    "WQ/dNCogW7NdM8kHg8oXAXy",
                    "cvlcPmo6nW",
                    "zdtdOCkcW5y",
                    "W4OfWRfbW57dHLnc",
                    "W7D6pYS",
                    "W4bFfWJdUG",
                    "c8ojvmo9xmkIxvxdVx8",
                    "bgFcGG",
                    "l8kaW5KSWQm",
                    "W5lcJapcSve",
                    "wCokv28",
                    "yX87WPu",
                    "wSoVW6Kr",
                    "vvFcMCkeWRO",
                    "W73cTmkiFeLUWQmzzG",
                    "iafy",
                    "nSkkW7BcQ8kFWQRdIbzmjG",
                    "smkiamktW7mHWOG",
                    "rmorW5ZdKCkL",
                    "W75anZZdQmk6",
                    "W54QgSo7",
                    "e8kLmmoqWPWXdJ9zha",
                    "W7rJpa",
                    "DWiCWOPuD8k1W50E",
                    "thNcOCk5WOZdRmoe",
                    "WRuRBCklW7FcNh/cGcu",
                    "WQJdKmoBW7S",
                    "tX/dMSkFW7e",
                    "lGTAW7ucWQG",
                    "WP4SW4ddN8og",
                    "taS/WP9/",
                    "WP7dN8oSW5/dTa",
                    "kCkkW6RcUSkoWRa",
                    "imocW6JcNdG",
                    "WQ/dNSobW7NdKCkq",
                    "W5Gqd8o+WQG",
                    "tY0lWRxcHCoqldNcUq",
                    "FvVcOmkEWOO",
                    "WRy6CmkqW7tcHflcNZa",
                    "W65Pl1C",
                    "W50KdSoUW4v3",
                    "B1FcQW",
                    "WPVcJuGzW50",
                    "bmkgW5GZWQu",
                    "W7NcJmo1W61D",
                    "W6FdJWWXW4S",
                    "vcldKmks",
                    "W6TOCfSTl8oPWQu",
                    "W5eujmo3WOK",
                    "kCkcmG7cPHG6WOu",
                    "W6jxnI/dS8kMW4/cJSoz",
                    "i8oUW4JcMtJcH1y5",
                    "W5vFC2yT",
                    "F8oTW5ihymoQkXS7WOu",
                    "dCk2WR8oW7hdNhxdOGG",
                    "W6OdWRXYW4K",
                    "xsBdLmkDW69SWPaVkCk9",
                    "WOtdMmotW4bSWRZcIa",
                    "umocugS",
                    "usdcGq",
                    "W6JcUqdcVvtdN0HMhq",
                    "W4dcR8oU",
                    "WQe4DSkE",
                    "WQ7dUmolW4rJWR7cPdpdKYu",
                    "zreRWO0",
                    "WQ7cJ3qtW5a",
                    "xHW8WRpcPa",
                    "W5NcVSozW7nMW4CXW6hcTIO",
                    "W7zKorerW4fTzW",
                    "aSkOW6uEWRddGG",
                    "BK7dRSkNeG",
                    "xmoiW70UW4W",
                    "WRJdMmkMc8kA",
                    "tYevWQq",
                    "WRFdV8oGW7zM",
                    "W5dcLSkHzM0",
                    "cSkSW78y",
                    "amkTWR44WPxcSv/cHW",
                    "iCoUW5NcQttcGva",
                    "W5LXmxvE",
                    "m2FdMCkeia",
                    "qs82W43dHSoNsSk5aCkV",
                    "jqTRW7qg",
                    "fCkUmCooWPaLlG",
                    "W4WpWQG",
                    "eg9RWPFdK8oUzCkYi8kN",
                    "nGfbW7eEWRm/fSocia",
                    "jmoTW47cJsFcOvKUpIa",
                    "A8oYW7ZdTCkI",
                    "cSoUW4/cIsFcJfe3ja",
                    "WQBcK2TbW5a",
                    "DSk1WPJcLbBcGu0fgq",
                    "W48NyfKTW5XBWRb2WRW",
                    "W5yzc8o9WOi",
                    "WRJdKmoDW73dLCkq",
                    "sGCmWPTr",
                    "W5ezDKGH",
                    "WQBdU8k4aCkJ",
                    "WPVcJuifW50",
                    "WOyQBfNcVq",
                    "nmoIW5NcGZNcJMWIjG",
                    "udxdM8ktW7Dt",
                    "w8oHW6qzW7JdSq",
                    "cmkJWQK4",
                    "W7rmns/dUCkG",
                    "qSokv2pcPmktgG",
                    "WPFdM8oiW4rKWQy",
                    "w8opW68jW40",
                    "WQCzW5ldVtm",
                    "W7DxdtldSCk3",
                    "W6/dVJabW4ZdVa",
                    "WQxcJhvC",
                    "W7bUdaarW5PMCG",
                    "WRpcVM8+W53dIfZcQmkK",
                    "tCknaSkBzmkJB0VdK1e",
                    "W63cUWVcQe/dJMjZcNC",
                    "x8kEfCkE",
                    "W6JcT8kA",
                    "WPJdKmk+jmk/W7u",
                    "zeJcUSkebCkTthm",
                    "mSkuoGJcIa",
                    "W7rqnZJdQmk7W5NcKmkCWQa",
                    "lKFcNSo5hNy",
                    "WQ3dL8kJbmkV",
                    "hgrJWRtdKW",
                    "WRaiW4RdTq",
                    "lmkNdCoSWQ4",
                    "ASkkF8krW7m",
                    "W7DMsL0Zl8oPWQC",
                    "WQxcGmkaWRf7pq",
                    "WRpcN8kkWRnUlebxW6hdGq",
                    "W7znec/dNq",
                    "luZcLmo4f21DnhK",
                    "kKpcNSo5hMK",
                    "W5tcRmo5W6S",
                    "WOeSW5xdQSob",
                    "xmoVW74B",
                    "iCkcpc7cPWu6WOzWbG",
                    "CaqxWOX8FCk1",
                    "iCkmjq4",
                    "WQxcLNra",
                    "zIddNCkBW6y",
                    "wCkEe8kU",
                    "zSkCyCk5W6a",
                    "evtdP8kUlW",
                    "lmk8W4dcQCkZ",
                    "vSoHW70",
                    "W40QbSoSW5zQ",
                    "W5W4yvi2",
                    "FSk7uCkEW57dGhhcStOk",
                    "W7Sjl8oXWOS",
                    "WPzNWQVdLCkKWQldUYzqWP8",
                    "W6HIquSTl8oXWQC0",
                    "WPuIBhhcOq",
                    "WOhdMSocW4jJWRVcLqBdHq",
                    "vCofW5FdLSkW",
                    "WRdcR3iVW5FdKG",
                    "le3cO8oPa21DnG",
                    "nSkoWRa6WOFcTg/cQmkWWQe",
                    "W7tcVCkdDLHO",
                    "sCkGwmkfW5a",
                    "WPOaW63dJmokcW",
                    "W7SLhmoGWPy",
                    "WQdcMSkaWRfUihXCWRm",
                    "W48nrNSS",
                    "CCo5W77dR8kiWO7cQZldJNm",
                    "W7zbDKWi",
                    "W64iWRDmsa",
                    "W7KfWRPPqa",
                    "zCoQW6/dMG",
                    "bxJdKSkkmwu3lW",
                    "jSklW6FcGSkBWRZdSY5rla",
                    "D8oTW5qhrmoQzHCGWOq",
                    "WRGAW5ZdOce",
                    "wSomuW",
                    "WRFdVSkweSkO",
                    "wcSiWRpcL8oq",
                    "emk6p8k0W7m",
                    "B8k/x8kdW53dVg3cQdG",
                    "heFcHSo0eMf8i3tcOq",
                    "W7HQjNzj",
                    "Bmooru7cGW",
                    "W7zeltO",
                    "egHQWPNdPmoVA8kUqmoG",
                    "uspcICoBFtq0i8ojWOi1W6S",
                    "W7D8oaVdIG",
                    "CmoByLFcOH8TWQvqjq",
                    "W7OljmoIW6y",
                    "WQlcQCkzWOzp",
                    "CXeCWOdcSSoEwmo9",
                    "k0hcGSoYhwG",
                    "k8osW4RcGcW",
                    "CGmwWOX6zmkPW4mp",
                    "W7feoJpdUCkn",
                    "wSocsw8",
                    "WQBcUca",
                    "W6DUmrCcW4C",
                    "ACoQW7xdN8knWOBcIXFdN3W",
                    "gMldK8kymx4Xl8oV",
                    "bmkHnSoh",
                    "s3tcVmk9",
                    "WOGbugtcTSkoWR8IfW",
                    "WQW2Ba",
                    "W7FdM8oDWQPzkMz6W5W",
                    "WRhcJgrDW4KDt8kT",
                    "W7DAcvXT",
                    "W6DTnHenW4Dq",
                    "WRhcGNnj",
                    "h2HPWRVdMa",
                    "WP4bu2u",
                    "omkKfSoqWQW",
                    "BLtcI8kZWQO",
                    "W443WP5CFG",
                    "fCowr8k0lCkvzhNdK1K",
                    "WRBcJ25nW4OmEa",
                    "vIStWQpcK8ojiIlcRa",
                    "WRBcJ25lW48",
                    "b3BdH8kciM0SlSo6",
                    "CSk9aW",
                    "WQVdLmoBW5/dNmkbamoXAXy",
                    "xmorqwW",
                    "wMBcRCkUWQpdV8o4WR5D",
                    "W4PaetxdVW",
                    "l1DVWO/dOmoSwmo7WPNcTa",
                    "W7xcJmkb",
                    "W75XqKyZdSoIWQSHwa",
                    "jGfxW6CBWQuLaW",
                    "W4z1qLuq",
                    "WQdcOgKVW5ZdIh0",
                    "lHlcKCkPkNpcISoDcG",
                    "traaWOxcQG",
                    "qgdcVmk5WPddJ8o0WRrDrW",
                    "WRagW53dOsRdRmovgCk3fW",
                    "lX4a",
                    "WRFcO1m+W4ddLuVcVW",
                    "W47dV8kpW68R",
                    "zCoJW7uAzmoMzr8",
                    "WOzWWRxdLSk/",
                    "W6WGWPbFFsxcHfK",
                    "AXSHWPpcTmoF",
                    "W6y+Bf0SWODzWQ0",
                    "WO8gW6FdISoe",
                    "W7DIlregW50",
                    "bSkYlSkSW68hyq",
                    "WP7dV8ohW5JdMa",
                    "WQSSB8kDW73cMG",
                    "vIuw",
                    "WOSnx2xcL8ktWQGQfq",
                    "W7pcS8k4DKS",
                    "zb8JWPG",
                    "mr5yW7Sc",
                    "WPXHWQhdQSkx",
                    "WQ/dMCooW7tdL8kbcCoaAHC",
                    "WRFcO3uPW5RdR1hcUCkZBG",
                    "WQ/dMCoDW7xdNCkb",
                    "ENNcGmkOWO0",
                    "gNHQWP3dPmoU",
                    "hCkIW6yC",
                    "W7ZcQHVcQa",
                    "utqDWOXh",
                    "lmkdnqRcQJ4Z",
                    "WRZdG8okW47dMCkjcmohCqm",
                    "wdhdGCkv",
                    "n8oGW4JcHXS",
                    "e8k1imovWO0XmZHt",
                    "WR7dLmoFW7BdKCkhca",
                    "W6yGWOq",
                    "W7NcVq7cOfFdVfHYdgK",
                    "nSkznahcTWm",
                    "W7r0lbW",
                    "r8oxqwtcO8kn",
                    "W5mShq",
                    "WP8PASkqW70",
                    "Ar8HWPVcN8oeqSo1WP/cVa",
                    "nSkfW547WQa",
                    "wmkEfCkwW7aG",
                    "WQFcOxbdW6W",
                    "W4FdS8kiW4yjW6SvySkkW4K",
                    "DSkJvmksW4RdH3i",
                    "WRyoxepcQW",
                    "xJqKWOhcMSkMjmoGqmkt",
                    "WP/dKCoFW5q",
                    "wSoCW78sW7u",
                    "W5TMv0O",
                    "o8kiWRO1WOC",
                    "zhpcI8kMgW",
                    "eCoFcSk/oCkVjcZcLX4",
                    "WPanu2BcKCks",
                    "A8oKW7ldLq",
                    "r8oHW44CDa",
                    "nJ9DW7e1",
                    "xmoHW6KpW7tdOepdPW",
                    "W5ZdR8krW4yiW5CrzSkD",
                    "umoAuwNcTa",
                    "W7TMv04",
                    "W5hcIHFcRNa",
                    "W5BcPSohW49F",
                    "W5uNcSoxWQFdJGv5W5xcNG",
                    "WRGmW5ddSZpdOq",
                    "cSk3WRm6WPxcSv/cH8oI",
                    "w17cISkOWQO",
                    "WRCgW5ddTYBdVq",
                    "uGe8WP9s",
                    "W7FdSJmdW4VdOmkgAmkl",
                    "zeBcRCkq",
                    "kKFcGmoXegDw",
                    "WPxcLgiVW6G",
                    "cNVdMmkok3Ga",
                    "W6jUltecW5bG",
                    "W4qVg8o1WRJdHrG",
                    "CSoKW7BdNG",
                    "kCoUW5W",
                    "r8optwNcOW",
                    "WRBcJSkCWQf/ah1g",
                    "WPVdGmkKjSk5W5xcJ8oscWC",
                    "yr4xWPT0za",
                    "w8orug/cOG",
                    "rqSPWPlcPCof",
                    "jmkRcSkUW7a",
                    "W5CRc8oH",
                    "Br8K",
                    "WRKiW44",
                    "zuRcSmkf",
                    "W6vXnISwW5PS",
                    "W4OKhmoU",
                    "W5DXyMGX",
                    "WOrGWR3dV8k+WQVdGt1S",
                    "W6ujWPHGW5C",
                    "cNBdN8k7kw0HfCoXWOS",
                    "FtWEWQZcMa",
                    "W6RcVCkiFW",
                    "WPddM8ofW5jOWRFcLrC",
                    "WPHZumk6WOCNWRxcRwjnC0/cVW",
                    "WPGzW6ldHSohnXe8C8kq",
                    "kmkiiHZcSXyWWRTWeq",
                    "WO8gW7ddHSojfHG8ymkb",
                    "W60HWOC",
                    "WQpcSSoKWQ8",
                    "W5KsWOTCW7FdGG",
                    "W5CSamoXWRddNW",
                    "qb8BWPNcRq",
                    "WQy1A8kAW7BcNf8",
                    "vsuiWR/cQCohiJVcOMy",
                    "W75XqKyZeCoUWQyYwa",
                    "WRlcQw5qW57dVSkHqmkibW",
                    "W4VdQCksW4aAW5C",
                    "WRNdN8olW7/dLSkna8oXyq",
                    "WRFcSxjaW4G",
                    "E8kSrmkw",
                    "aCk0k8oqWPXJotLqha",
                    "bCkUiCojWP0M",
                    "FXGlWOhcOG",
                    "ESkvdCkCW74",
                    "Cmoyyv3dQH88WQXdoWO",
                    "F0VdKmk8",
                    "CCoPW7G",
                    "W5ObWPTOEa",
                    "n8oZW4tcMdRcLKe9mW",
                    "WORcImkHWPHn",
                    "DCoKW68AvW",
                    "W7pdRI0oW7BdU8ktBmkDkq",
                    "WOCltCkOW4VcRvq",
                    "bmkIW6ix",
                    "CSo7W7FdKSkv",
                    "W6fgkZtdSmk+W6lcKCom",
                    "W6TVgGigW518",
                    "WR1qWQRdQCk7",
                    "CSkIrCkeW5FdRhVcRZm",
                    "W69fB3K9",
                    "W45gmWWj",
                    "WPpcMCk/WRHD",
                    "CmodW6GPEa",
                    "W6vDWO/cRh/cVCkoamkalCoVW4O5",
                    "y0JcTSkAaCkT",
                    "C8oHy2tcGG",
                    "xSkqcCkSBmk6",
                    "q8oKW6Gjya",
                    "pe3cK8oOhgfDjq",
                    "CHmA",
                    "W4SPdCoIW5jWW7hcGwO",
                    "agtdQmkbcW",
                    "WP3dM8k5nW",
                    "nGfNW6yeWQKLea",
                    "WRxcQsaPW53dMedcHCoHzW",
                    "W7zPr0ONcCoH",
                    "W6hdSJac",
                    "leVcNCo4aNbspg0",
                    "FCkxvCkyW6e",
                    "fxjQWPNdSCoY",
                    "ACofW7BdRCkW",
                    "meBcQW",
                    "swZcU8kqWRi",
                  ];
                  return (oe = function () {
                    return e;
                  })();
                }
                function ie() {
                  var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                  function t(e, t) {
                    return N(e, t - 250);
                  }
                  var r = {
                    GBGnD: function (e, t) {
                      return e !== t;
                    },
                    udJzP: o(309, "Uj2C"),
                    ZgnvD: t("C6fO", 207),
                    OfrrG: function (e) {
                      return e();
                    },
                    kkUgg: function (e, t) {
                      return e + t;
                    },
                    HFCtH: function (e, t) {
                      return e + t;
                    },
                    HNLwA: function (e, t) {
                      return e * t;
                    },
                    EYUKP: function (e, t) {
                      return e * t;
                    },
                    gzTLW: function (e) {
                      return e();
                    },
                    uYtJo: function (e, t, n) {
                      return e(t, n);
                    },
                  };
                  function o(e, t) {
                    return ae(e - -662, t);
                  }
                  if (r[t(")8Bu", -87)](void 0 === h ? "undefined" : n(h), r[o(-291, "F[!2")]))
                    for (var i = r[o(289, "Uj2C")][o(-253, "q]CY")]("|"), a = 0; ; ) {
                      switch (i[a++]) {
                        case "0":
                          r[o(-199, "dE%z")](ne);
                          continue;
                        case "1":
                          this[t("7hxe", -54) + t("(f2U", 137)](
                            e[o(373, "jU*K")] ||
                              r[o(-113, "ChZ!")](
                                r[o(138, "S@lO")](
                                  695905265254,
                                  r[t("ChZ!", -386)](472578152857, -1),
                                ),
                                r[o(230, "jU*K")](-3, -218760729941),
                              ),
                          );
                          continue;
                        case "2":
                          r[t("WWJ$", 0)](Z);
                          continue;
                        case "3":
                          r[t("Imsz", -23)](X, u, h);
                          continue;
                        case "4":
                          u = m[o(-215, "(meS")]();
                          continue;
                      }
                      break;
                    }
                }
                function ae(e, t) {
                  return ee(e - 104, t);
                }
                ((ie[N("54^6", -278)][N("N)xu", -581) + ae(639, "tt&(")] = function (e) {
                  ((l = m[N("k&f(", -59)]()), (s = e));
                }),
                  (ie[N("1[03", -97)][N(")8Bu", -232)] = p),
                  (ie[N("WWJ$", -661)][ae(388, "QYdW")] = p),
                  (ie[ae(658, "QYdW")][ae(912, "EGti") + "k"] = function () {
                    return (
                      G[N("l1Y6", -134)]++,
                      {
                        PpEgG: function (e) {
                          return e();
                        },
                      }[ae(603, "(f2U")](re)
                    );
                  }),
                  (ie[N("q]CY", -10)][N("hIzm", -377) + N("SlDP", -87)] = function () {
                    var e = {
                      NzFgj: function (e, t) {
                        return e(t);
                      },
                      ZOTby: function (e) {
                        return e();
                      },
                    };
                    return new Promise(function (t) {
                      function n(e, t) {
                        return ee(e - -585, t);
                      }
                      (G[ee(708, "DKL#")]++, e[n(355, "(f2U")](t, e[n(206, "YYv%")](re)));
                    });
                  }),
                  y &&
                    y[N("8RnY", -70)] &&
                    y[ae(909, "F[!2")][ae(662, "wAHi")] &&
                    (ie[N("Uj2C", -598)][N("7hxe", 19)] = function (e) {
                      var t = {};
                      function n(e, t) {
                        return ae(e - -862, t);
                      }
                      function r(e, t) {
                        return ae(t - -1053, e);
                      }
                      ((t[n(157, "WWJ$")] = n(-345, "YxiJ")),
                        (t[r("N)xu", -276)] = r("jU*K", -159)),
                        (t[r("Uj2C", -446)] = r("SlDP", -385)),
                        (t[r("WWJ$", -567)] = n(-24, "(meS")),
                        (t[n(59, "1*rM")] = n(29, "S@lO")));
                      var o = t;
                      switch (e.type) {
                        case o[n(-161, "(f2U")]:
                          W[r("QovG", -55) + "t"](e);
                          break;
                        case o[n(41, "QovG")]:
                        case o[r("ChZ!", -113)]:
                          T[n(-57, "Q2Sc") + "t"](e);
                          break;
                        case o[r("q]CY", -168)]:
                        case o[r("Pt@f", -284)]:
                          P[r("54^6", -298) + "t"](e);
                      }
                    }));
                var ce = new ie();
                e[ae(544, "DKL#")] = function () {
                  var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                  function t(e, t) {
                    return ae(e - -110, t);
                  }
                  return (
                    e[t(920, "$nFE")] &&
                      h &&
                      ce[t(306, "SYaz") + t(300, "WWJ$")](e[t(902, "griD")]),
                    ce
                  );
                };
              }).call(this, r(1)(e));
            },
            function (e, t, n) {
              "use strict";
              var r = n(6),
                o = n(0),
                i = n(10),
                a = n(2),
                c = n(11),
                u = Object.prototype.toString;
              function s(e) {
                if (!(this instanceof s)) return new s(e);
                this.options = o.assign(
                  {
                    level: -1,
                    method: 8,
                    chunkSize: 16384,
                    windowBits: 15,
                    memLevel: 8,
                    strategy: 0,
                    to: "",
                  },
                  e || {},
                );
                var t = this.options;
                (t.raw && t.windowBits > 0
                  ? (t.windowBits = -t.windowBits)
                  : t.gzip && t.windowBits > 0 && t.windowBits < 16 && (t.windowBits += 16),
                  (this.err = 0),
                  (this.msg = ""),
                  (this.ended = !1),
                  (this.chunks = []),
                  (this.strm = new c()),
                  (this.strm.avail_out = 0));
                var n = r.deflateInit2(
                  this.strm,
                  t.level,
                  t.method,
                  t.windowBits,
                  t.memLevel,
                  t.strategy,
                );
                if (0 !== n) throw new Error(a[n]);
                if ((t.header && r.deflateSetHeader(this.strm, t.header), t.dictionary)) {
                  var l;
                  if (
                    ((l =
                      "string" == typeof t.dictionary
                        ? i.string2buf(t.dictionary)
                        : "[object ArrayBuffer]" === u.call(t.dictionary)
                          ? new Uint8Array(t.dictionary)
                          : t.dictionary),
                    0 !== (n = r.deflateSetDictionary(this.strm, l)))
                  )
                    throw new Error(a[n]);
                  this._dict_set = !0;
                }
              }
              function l(e, t) {
                var n = new s(t);
                if ((n.push(e, !0), n.err)) throw n.msg || a[n.err];
                return n.result;
              }
              ((s.prototype.push = function (e, t) {
                var n,
                  a,
                  c = this.strm,
                  s = this.options.chunkSize;
                if (this.ended) return !1;
                ((a = t === ~~t ? t : !0 === t ? 4 : 0),
                  "string" == typeof e
                    ? (c.input = i.string2buf(e))
                    : "[object ArrayBuffer]" === u.call(e)
                      ? (c.input = new Uint8Array(e))
                      : (c.input = e),
                  (c.next_in = 0),
                  (c.avail_in = c.input.length));
                do {
                  if (
                    (0 === c.avail_out &&
                      ((c.output = new o.Buf8(s)), (c.next_out = 0), (c.avail_out = s)),
                    1 !== (n = r.deflate(c, a)) && 0 !== n)
                  )
                    return (this.onEnd(n), (this.ended = !0), !1);
                  (0 !== c.avail_out && (0 !== c.avail_in || (4 !== a && 2 !== a))) ||
                    ("string" === this.options.to
                      ? this.onData(i.buf2binstring(o.shrinkBuf(c.output, c.next_out)))
                      : this.onData(o.shrinkBuf(c.output, c.next_out)));
                } while ((c.avail_in > 0 || 0 === c.avail_out) && 1 !== n);
                return 4 === a
                  ? ((n = r.deflateEnd(this.strm)), this.onEnd(n), (this.ended = !0), 0 === n)
                  : 2 !== a || (this.onEnd(0), (c.avail_out = 0), !0);
              }),
                (s.prototype.onData = function (e) {
                  this.chunks.push(e);
                }),
                (s.prototype.onEnd = function (e) {
                  (0 === e &&
                    ("string" === this.options.to
                      ? (this.result = this.chunks.join(""))
                      : (this.result = o.flattenChunks(this.chunks))),
                    (this.chunks = []),
                    (this.err = e),
                    (this.msg = this.strm.msg));
                }),
                (t.Deflate = s),
                (t.deflate = l),
                (t.deflateRaw = function (e, t) {
                  return (((t = t || {}).raw = !0), l(e, t));
                }),
                (t.gzip = function (e, t) {
                  return (((t = t || {}).gzip = !0), l(e, t));
                }));
            },
            function (e, t, n) {
              "use strict";
              var r,
                o = n(0),
                i = n(7),
                a = n(8),
                c = n(9),
                u = n(2),
                s = -2,
                l = 258,
                f = 262,
                d = 103,
                p = 113,
                h = 666;
              function v(e, t) {
                return ((e.msg = u[t]), t);
              }
              function m(e) {
                return (e << 1) - (e > 4 ? 9 : 0);
              }
              function x(e) {
                for (var t = e.length; --t >= 0; ) e[t] = 0;
              }
              function g(e) {
                var t = e.state,
                  n = t.pending;
                (n > e.avail_out && (n = e.avail_out),
                  0 !== n &&
                    (o.arraySet(e.output, t.pending_buf, t.pending_out, n, e.next_out),
                    (e.next_out += n),
                    (t.pending_out += n),
                    (e.total_out += n),
                    (e.avail_out -= n),
                    (t.pending -= n),
                    0 === t.pending && (t.pending_out = 0)));
              }
              function b(e, t) {
                (i._tr_flush_block(
                  e,
                  e.block_start >= 0 ? e.block_start : -1,
                  e.strstart - e.block_start,
                  t,
                ),
                  (e.block_start = e.strstart),
                  g(e.strm));
              }
              function y(e, t) {
                e.pending_buf[e.pending++] = t;
              }
              function w(e, t) {
                ((e.pending_buf[e.pending++] = (t >>> 8) & 255),
                  (e.pending_buf[e.pending++] = 255 & t));
              }
              function C(e, t) {
                var n,
                  r,
                  o = e.max_chain_length,
                  i = e.strstart,
                  a = e.prev_length,
                  c = e.nice_match,
                  u = e.strstart > e.w_size - f ? e.strstart - (e.w_size - f) : 0,
                  s = e.window,
                  d = e.w_mask,
                  p = e.prev,
                  h = e.strstart + l,
                  v = s[i + a - 1],
                  m = s[i + a];
                (e.prev_length >= e.good_match && (o >>= 2), c > e.lookahead && (c = e.lookahead));
                do {
                  if (
                    s[(n = t) + a] === m &&
                    s[n + a - 1] === v &&
                    s[n] === s[i] &&
                    s[++n] === s[i + 1]
                  ) {
                    ((i += 2), n++);
                    do {} while (
                      s[++i] === s[++n] &&
                      s[++i] === s[++n] &&
                      s[++i] === s[++n] &&
                      s[++i] === s[++n] &&
                      s[++i] === s[++n] &&
                      s[++i] === s[++n] &&
                      s[++i] === s[++n] &&
                      s[++i] === s[++n] &&
                      i < h
                    );
                    if (((r = l - (h - i)), (i = h - l), r > a)) {
                      if (((e.match_start = t), (a = r), r >= c)) break;
                      ((v = s[i + a - 1]), (m = s[i + a]));
                    }
                  }
                } while ((t = p[t & d]) > u && 0 != --o);
                return a <= e.lookahead ? a : e.lookahead;
              }
              function S(e) {
                var t,
                  n,
                  r,
                  i,
                  u,
                  s,
                  l,
                  d,
                  p,
                  h,
                  v = e.w_size;
                do {
                  if (((i = e.window_size - e.lookahead - e.strstart), e.strstart >= v + (v - f))) {
                    (o.arraySet(e.window, e.window, v, v, 0),
                      (e.match_start -= v),
                      (e.strstart -= v),
                      (e.block_start -= v),
                      (t = n = e.hash_size));
                    do {
                      ((r = e.head[--t]), (e.head[t] = r >= v ? r - v : 0));
                    } while (--n);
                    t = n = v;
                    do {
                      ((r = e.prev[--t]), (e.prev[t] = r >= v ? r - v : 0));
                    } while (--n);
                    i += v;
                  }
                  if (0 === e.strm.avail_in) break;
                  if (
                    ((s = e.strm),
                    (l = e.window),
                    (d = e.strstart + e.lookahead),
                    (p = i),
                    (h = void 0),
                    (h = s.avail_in) > p && (h = p),
                    (n =
                      0 === h
                        ? 0
                        : ((s.avail_in -= h),
                          o.arraySet(l, s.input, s.next_in, h, d),
                          1 === s.state.wrap
                            ? (s.adler = a(s.adler, l, h, d))
                            : 2 === s.state.wrap && (s.adler = c(s.adler, l, h, d)),
                          (s.next_in += h),
                          (s.total_in += h),
                          h)),
                    (e.lookahead += n),
                    e.lookahead + e.insert >= 3)
                  )
                    for (
                      u = e.strstart - e.insert,
                        e.ins_h = e.window[u],
                        e.ins_h = ((e.ins_h << e.hash_shift) ^ e.window[u + 1]) & e.hash_mask;
                      e.insert &&
                      ((e.ins_h = ((e.ins_h << e.hash_shift) ^ e.window[u + 3 - 1]) & e.hash_mask),
                      (e.prev[u & e.w_mask] = e.head[e.ins_h]),
                      (e.head[e.ins_h] = u),
                      u++,
                      e.insert--,
                      !(e.lookahead + e.insert < 3));
                    );
                } while (e.lookahead < f && 0 !== e.strm.avail_in);
              }
              function k(e, t) {
                for (var n, r; ; ) {
                  if (e.lookahead < f) {
                    if ((S(e), e.lookahead < f && 0 === t)) return 1;
                    if (0 === e.lookahead) break;
                  }
                  if (
                    ((n = 0),
                    e.lookahead >= 3 &&
                      ((e.ins_h =
                        ((e.ins_h << e.hash_shift) ^ e.window[e.strstart + 3 - 1]) & e.hash_mask),
                      (n = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h]),
                      (e.head[e.ins_h] = e.strstart)),
                    0 !== n && e.strstart - n <= e.w_size - f && (e.match_length = C(e, n)),
                    e.match_length >= 3)
                  )
                    if (
                      ((r = i._tr_tally(e, e.strstart - e.match_start, e.match_length - 3)),
                      (e.lookahead -= e.match_length),
                      e.match_length <= e.max_lazy_match && e.lookahead >= 3)
                    ) {
                      e.match_length--;
                      do {
                        (e.strstart++,
                          (e.ins_h =
                            ((e.ins_h << e.hash_shift) ^ e.window[e.strstart + 3 - 1]) &
                            e.hash_mask),
                          (n = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h]),
                          (e.head[e.ins_h] = e.strstart));
                      } while (0 != --e.match_length);
                      e.strstart++;
                    } else
                      ((e.strstart += e.match_length),
                        (e.match_length = 0),
                        (e.ins_h = e.window[e.strstart]),
                        (e.ins_h =
                          ((e.ins_h << e.hash_shift) ^ e.window[e.strstart + 1]) & e.hash_mask));
                  else ((r = i._tr_tally(e, 0, e.window[e.strstart])), e.lookahead--, e.strstart++);
                  if (r && (b(e, !1), 0 === e.strm.avail_out)) return 1;
                }
                return (
                  (e.insert = e.strstart < 2 ? e.strstart : 2),
                  4 === t
                    ? (b(e, !0), 0 === e.strm.avail_out ? 3 : 4)
                    : e.last_lit && (b(e, !1), 0 === e.strm.avail_out)
                      ? 1
                      : 2
                );
              }
              function O(e, t) {
                for (var n, r, o; ; ) {
                  if (e.lookahead < f) {
                    if ((S(e), e.lookahead < f && 0 === t)) return 1;
                    if (0 === e.lookahead) break;
                  }
                  if (
                    ((n = 0),
                    e.lookahead >= 3 &&
                      ((e.ins_h =
                        ((e.ins_h << e.hash_shift) ^ e.window[e.strstart + 3 - 1]) & e.hash_mask),
                      (n = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h]),
                      (e.head[e.ins_h] = e.strstart)),
                    (e.prev_length = e.match_length),
                    (e.prev_match = e.match_start),
                    (e.match_length = 2),
                    0 !== n &&
                      e.prev_length < e.max_lazy_match &&
                      e.strstart - n <= e.w_size - f &&
                      ((e.match_length = C(e, n)),
                      e.match_length <= 5 &&
                        (1 === e.strategy ||
                          (3 === e.match_length && e.strstart - e.match_start > 4096)) &&
                        (e.match_length = 2)),
                    e.prev_length >= 3 && e.match_length <= e.prev_length)
                  ) {
                    ((o = e.strstart + e.lookahead - 3),
                      (r = i._tr_tally(e, e.strstart - 1 - e.prev_match, e.prev_length - 3)),
                      (e.lookahead -= e.prev_length - 1),
                      (e.prev_length -= 2));
                    do {
                      ++e.strstart <= o &&
                        ((e.ins_h =
                          ((e.ins_h << e.hash_shift) ^ e.window[e.strstart + 3 - 1]) & e.hash_mask),
                        (n = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h]),
                        (e.head[e.ins_h] = e.strstart));
                    } while (0 != --e.prev_length);
                    if (
                      ((e.match_available = 0),
                      (e.match_length = 2),
                      e.strstart++,
                      r && (b(e, !1), 0 === e.strm.avail_out))
                    )
                      return 1;
                  } else if (e.match_available) {
                    if (
                      ((r = i._tr_tally(e, 0, e.window[e.strstart - 1])) && b(e, !1),
                      e.strstart++,
                      e.lookahead--,
                      0 === e.strm.avail_out)
                    )
                      return 1;
                  } else ((e.match_available = 1), e.strstart++, e.lookahead--);
                }
                return (
                  e.match_available &&
                    ((r = i._tr_tally(e, 0, e.window[e.strstart - 1])), (e.match_available = 0)),
                  (e.insert = e.strstart < 2 ? e.strstart : 2),
                  4 === t
                    ? (b(e, !0), 0 === e.strm.avail_out ? 3 : 4)
                    : e.last_lit && (b(e, !1), 0 === e.strm.avail_out)
                      ? 1
                      : 2
                );
              }
              function E(e, t, n, r, o) {
                ((this.good_length = e),
                  (this.max_lazy = t),
                  (this.nice_length = n),
                  (this.max_chain = r),
                  (this.func = o));
              }
              function _(e) {
                var t;
                return e && e.state
                  ? ((e.total_in = e.total_out = 0),
                    (e.data_type = 2),
                    ((t = e.state).pending = 0),
                    (t.pending_out = 0),
                    t.wrap < 0 && (t.wrap = -t.wrap),
                    (t.status = t.wrap ? 42 : p),
                    (e.adler = 2 === t.wrap ? 0 : 1),
                    (t.last_flush = 0),
                    i._tr_init(t),
                    0)
                  : v(e, s);
              }
              function W(e) {
                var t,
                  n = _(e);
                return (
                  0 === n &&
                    (((t = e.state).window_size = 2 * t.w_size),
                    x(t.head),
                    (t.max_lazy_match = r[t.level].max_lazy),
                    (t.good_match = r[t.level].good_length),
                    (t.nice_match = r[t.level].nice_length),
                    (t.max_chain_length = r[t.level].max_chain),
                    (t.strstart = 0),
                    (t.block_start = 0),
                    (t.lookahead = 0),
                    (t.insert = 0),
                    (t.match_length = t.prev_length = 2),
                    (t.match_available = 0),
                    (t.ins_h = 0)),
                  n
                );
              }
              function T(e, t, n, r, i, a) {
                if (!e) return s;
                var c = 1;
                if (
                  (-1 === t && (t = 6),
                  r < 0 ? ((c = 0), (r = -r)) : r > 15 && ((c = 2), (r -= 16)),
                  i < 1 || i > 9 || 8 !== n || r < 8 || r > 15 || t < 0 || t > 9 || a < 0 || a > 4)
                )
                  return v(e, s);
                8 === r && (r = 9);
                var u = new (function () {
                  ((this.strm = null),
                    (this.status = 0),
                    (this.pending_buf = null),
                    (this.pending_buf_size = 0),
                    (this.pending_out = 0),
                    (this.pending = 0),
                    (this.wrap = 0),
                    (this.gzhead = null),
                    (this.gzindex = 0),
                    (this.method = 8),
                    (this.last_flush = -1),
                    (this.w_size = 0),
                    (this.w_bits = 0),
                    (this.w_mask = 0),
                    (this.window = null),
                    (this.window_size = 0),
                    (this.prev = null),
                    (this.head = null),
                    (this.ins_h = 0),
                    (this.hash_size = 0),
                    (this.hash_bits = 0),
                    (this.hash_mask = 0),
                    (this.hash_shift = 0),
                    (this.block_start = 0),
                    (this.match_length = 0),
                    (this.prev_match = 0),
                    (this.match_available = 0),
                    (this.strstart = 0),
                    (this.match_start = 0),
                    (this.lookahead = 0),
                    (this.prev_length = 0),
                    (this.max_chain_length = 0),
                    (this.max_lazy_match = 0),
                    (this.level = 0),
                    (this.strategy = 0),
                    (this.good_match = 0),
                    (this.nice_match = 0),
                    (this.dyn_ltree = new o.Buf16(1146)),
                    (this.dyn_dtree = new o.Buf16(122)),
                    (this.bl_tree = new o.Buf16(78)),
                    x(this.dyn_ltree),
                    x(this.dyn_dtree),
                    x(this.bl_tree),
                    (this.l_desc = null),
                    (this.d_desc = null),
                    (this.bl_desc = null),
                    (this.bl_count = new o.Buf16(16)),
                    (this.heap = new o.Buf16(573)),
                    x(this.heap),
                    (this.heap_len = 0),
                    (this.heap_max = 0),
                    (this.depth = new o.Buf16(573)),
                    x(this.depth),
                    (this.l_buf = 0),
                    (this.lit_bufsize = 0),
                    (this.last_lit = 0),
                    (this.d_buf = 0),
                    (this.opt_len = 0),
                    (this.static_len = 0),
                    (this.matches = 0),
                    (this.insert = 0),
                    (this.bi_buf = 0),
                    (this.bi_valid = 0));
                })();
                return (
                  (e.state = u),
                  (u.strm = e),
                  (u.wrap = c),
                  (u.gzhead = null),
                  (u.w_bits = r),
                  (u.w_size = 1 << u.w_bits),
                  (u.w_mask = u.w_size - 1),
                  (u.hash_bits = i + 7),
                  (u.hash_size = 1 << u.hash_bits),
                  (u.hash_mask = u.hash_size - 1),
                  (u.hash_shift = ~~((u.hash_bits + 3 - 1) / 3)),
                  (u.window = new o.Buf8(2 * u.w_size)),
                  (u.head = new o.Buf16(u.hash_size)),
                  (u.prev = new o.Buf16(u.w_size)),
                  (u.lit_bufsize = 1 << (i + 6)),
                  (u.pending_buf_size = 4 * u.lit_bufsize),
                  (u.pending_buf = new o.Buf8(u.pending_buf_size)),
                  (u.d_buf = 1 * u.lit_bufsize),
                  (u.l_buf = 3 * u.lit_bufsize),
                  (u.level = t),
                  (u.strategy = a),
                  (u.method = n),
                  W(e)
                );
              }
              ((r = [
                new E(0, 0, 0, 0, function (e, t) {
                  var n = 65535;
                  for (n > e.pending_buf_size - 5 && (n = e.pending_buf_size - 5); ; ) {
                    if (e.lookahead <= 1) {
                      if ((S(e), 0 === e.lookahead && 0 === t)) return 1;
                      if (0 === e.lookahead) break;
                    }
                    ((e.strstart += e.lookahead), (e.lookahead = 0));
                    var r = e.block_start + n;
                    if (
                      (0 === e.strstart || e.strstart >= r) &&
                      ((e.lookahead = e.strstart - r),
                      (e.strstart = r),
                      b(e, !1),
                      0 === e.strm.avail_out)
                    )
                      return 1;
                    if (
                      e.strstart - e.block_start >= e.w_size - f &&
                      (b(e, !1), 0 === e.strm.avail_out)
                    )
                      return 1;
                  }
                  return (
                    (e.insert = 0),
                    4 === t
                      ? (b(e, !0), 0 === e.strm.avail_out ? 3 : 4)
                      : (e.strstart > e.block_start && (b(e, !1), e.strm.avail_out), 1)
                  );
                }),
                new E(4, 4, 8, 4, k),
                new E(4, 5, 16, 8, k),
                new E(4, 6, 32, 32, k),
                new E(4, 4, 16, 16, O),
                new E(8, 16, 32, 32, O),
                new E(8, 16, 128, 128, O),
                new E(8, 32, 128, 256, O),
                new E(32, 128, 258, 1024, O),
                new E(32, 258, 258, 4096, O),
              ]),
                (t.deflateInit = function (e, t) {
                  return T(e, t, 8, 15, 8, 0);
                }),
                (t.deflateInit2 = T),
                (t.deflateReset = W),
                (t.deflateResetKeep = _),
                (t.deflateSetHeader = function (e, t) {
                  return e && e.state ? (2 !== e.state.wrap ? s : ((e.state.gzhead = t), 0)) : s;
                }),
                (t.deflate = function (e, t) {
                  var n, o, a, u;
                  if (!e || !e.state || t > 5 || t < 0) return e ? v(e, s) : s;
                  if (
                    ((o = e.state),
                    !e.output || (!e.input && 0 !== e.avail_in) || (o.status === h && 4 !== t))
                  )
                    return v(e, 0 === e.avail_out ? -5 : s);
                  if (((o.strm = e), (n = o.last_flush), (o.last_flush = t), 42 === o.status))
                    if (2 === o.wrap)
                      ((e.adler = 0),
                        y(o, 31),
                        y(o, 139),
                        y(o, 8),
                        o.gzhead
                          ? (y(
                              o,
                              (o.gzhead.text ? 1 : 0) +
                                (o.gzhead.hcrc ? 2 : 0) +
                                (o.gzhead.extra ? 4 : 0) +
                                (o.gzhead.name ? 8 : 0) +
                                (o.gzhead.comment ? 16 : 0),
                            ),
                            y(o, 255 & o.gzhead.time),
                            y(o, (o.gzhead.time >> 8) & 255),
                            y(o, (o.gzhead.time >> 16) & 255),
                            y(o, (o.gzhead.time >> 24) & 255),
                            y(o, 9 === o.level ? 2 : o.strategy >= 2 || o.level < 2 ? 4 : 0),
                            y(o, 255 & o.gzhead.os),
                            o.gzhead.extra &&
                              o.gzhead.extra.length &&
                              (y(o, 255 & o.gzhead.extra.length),
                              y(o, (o.gzhead.extra.length >> 8) & 255)),
                            o.gzhead.hcrc && (e.adler = c(e.adler, o.pending_buf, o.pending, 0)),
                            (o.gzindex = 0),
                            (o.status = 69))
                          : (y(o, 0),
                            y(o, 0),
                            y(o, 0),
                            y(o, 0),
                            y(o, 0),
                            y(o, 9 === o.level ? 2 : o.strategy >= 2 || o.level < 2 ? 4 : 0),
                            y(o, 3),
                            (o.status = p)));
                    else {
                      var f = (8 + ((o.w_bits - 8) << 4)) << 8;
                      ((f |=
                        (o.strategy >= 2 || o.level < 2
                          ? 0
                          : o.level < 6
                            ? 1
                            : 6 === o.level
                              ? 2
                              : 3) << 6),
                        0 !== o.strstart && (f |= 32),
                        (f += 31 - (f % 31)),
                        (o.status = p),
                        w(o, f),
                        0 !== o.strstart && (w(o, e.adler >>> 16), w(o, 65535 & e.adler)),
                        (e.adler = 1));
                    }
                  if (69 === o.status)
                    if (o.gzhead.extra) {
                      for (
                        a = o.pending;
                        o.gzindex < (65535 & o.gzhead.extra.length) &&
                        (o.pending !== o.pending_buf_size ||
                          (o.gzhead.hcrc &&
                            o.pending > a &&
                            (e.adler = c(e.adler, o.pending_buf, o.pending - a, a)),
                          g(e),
                          (a = o.pending),
                          o.pending !== o.pending_buf_size));
                      )
                        (y(o, 255 & o.gzhead.extra[o.gzindex]), o.gzindex++);
                      (o.gzhead.hcrc &&
                        o.pending > a &&
                        (e.adler = c(e.adler, o.pending_buf, o.pending - a, a)),
                        o.gzindex === o.gzhead.extra.length && ((o.gzindex = 0), (o.status = 73)));
                    } else o.status = 73;
                  if (73 === o.status)
                    if (o.gzhead.name) {
                      a = o.pending;
                      do {
                        if (
                          o.pending === o.pending_buf_size &&
                          (o.gzhead.hcrc &&
                            o.pending > a &&
                            (e.adler = c(e.adler, o.pending_buf, o.pending - a, a)),
                          g(e),
                          (a = o.pending),
                          o.pending === o.pending_buf_size)
                        ) {
                          u = 1;
                          break;
                        }
                        ((u =
                          o.gzindex < o.gzhead.name.length
                            ? 255 & o.gzhead.name.charCodeAt(o.gzindex++)
                            : 0),
                          y(o, u));
                      } while (0 !== u);
                      (o.gzhead.hcrc &&
                        o.pending > a &&
                        (e.adler = c(e.adler, o.pending_buf, o.pending - a, a)),
                        0 === u && ((o.gzindex = 0), (o.status = 91)));
                    } else o.status = 91;
                  if (91 === o.status)
                    if (o.gzhead.comment) {
                      a = o.pending;
                      do {
                        if (
                          o.pending === o.pending_buf_size &&
                          (o.gzhead.hcrc &&
                            o.pending > a &&
                            (e.adler = c(e.adler, o.pending_buf, o.pending - a, a)),
                          g(e),
                          (a = o.pending),
                          o.pending === o.pending_buf_size)
                        ) {
                          u = 1;
                          break;
                        }
                        ((u =
                          o.gzindex < o.gzhead.comment.length
                            ? 255 & o.gzhead.comment.charCodeAt(o.gzindex++)
                            : 0),
                          y(o, u));
                      } while (0 !== u);
                      (o.gzhead.hcrc &&
                        o.pending > a &&
                        (e.adler = c(e.adler, o.pending_buf, o.pending - a, a)),
                        0 === u && (o.status = d));
                    } else o.status = d;
                  if (
                    (o.status === d &&
                      (o.gzhead.hcrc
                        ? (o.pending + 2 > o.pending_buf_size && g(e),
                          o.pending + 2 <= o.pending_buf_size &&
                            (y(o, 255 & e.adler),
                            y(o, (e.adler >> 8) & 255),
                            (e.adler = 0),
                            (o.status = p)))
                        : (o.status = p)),
                    0 !== o.pending)
                  ) {
                    if ((g(e), 0 === e.avail_out)) return ((o.last_flush = -1), 0);
                  } else if (0 === e.avail_in && m(t) <= m(n) && 4 !== t) return v(e, -5);
                  if (o.status === h && 0 !== e.avail_in) return v(e, -5);
                  if (0 !== e.avail_in || 0 !== o.lookahead || (0 !== t && o.status !== h)) {
                    var C =
                      2 === o.strategy
                        ? (function (e, t) {
                            for (var n; ; ) {
                              if (0 === e.lookahead && (S(e), 0 === e.lookahead)) {
                                if (0 === t) return 1;
                                break;
                              }
                              if (
                                ((e.match_length = 0),
                                (n = i._tr_tally(e, 0, e.window[e.strstart])),
                                e.lookahead--,
                                e.strstart++,
                                n && (b(e, !1), 0 === e.strm.avail_out))
                              )
                                return 1;
                            }
                            return (
                              (e.insert = 0),
                              4 === t
                                ? (b(e, !0), 0 === e.strm.avail_out ? 3 : 4)
                                : e.last_lit && (b(e, !1), 0 === e.strm.avail_out)
                                  ? 1
                                  : 2
                            );
                          })(o, t)
                        : 3 === o.strategy
                          ? (function (e, t) {
                              for (var n, r, o, a, c = e.window; ; ) {
                                if (e.lookahead <= l) {
                                  if ((S(e), e.lookahead <= l && 0 === t)) return 1;
                                  if (0 === e.lookahead) break;
                                }
                                if (
                                  ((e.match_length = 0),
                                  e.lookahead >= 3 &&
                                    e.strstart > 0 &&
                                    (r = c[(o = e.strstart - 1)]) === c[++o] &&
                                    r === c[++o] &&
                                    r === c[++o])
                                ) {
                                  a = e.strstart + l;
                                  do {} while (
                                    r === c[++o] &&
                                    r === c[++o] &&
                                    r === c[++o] &&
                                    r === c[++o] &&
                                    r === c[++o] &&
                                    r === c[++o] &&
                                    r === c[++o] &&
                                    r === c[++o] &&
                                    o < a
                                  );
                                  ((e.match_length = l - (a - o)),
                                    e.match_length > e.lookahead && (e.match_length = e.lookahead));
                                }
                                if (
                                  (e.match_length >= 3
                                    ? ((n = i._tr_tally(e, 1, e.match_length - 3)),
                                      (e.lookahead -= e.match_length),
                                      (e.strstart += e.match_length),
                                      (e.match_length = 0))
                                    : ((n = i._tr_tally(e, 0, e.window[e.strstart])),
                                      e.lookahead--,
                                      e.strstart++),
                                  n && (b(e, !1), 0 === e.strm.avail_out))
                                )
                                  return 1;
                              }
                              return (
                                (e.insert = 0),
                                4 === t
                                  ? (b(e, !0), 0 === e.strm.avail_out ? 3 : 4)
                                  : e.last_lit && (b(e, !1), 0 === e.strm.avail_out)
                                    ? 1
                                    : 2
                              );
                            })(o, t)
                          : r[o.level].func(o, t);
                    if (((3 !== C && 4 !== C) || (o.status = h), 1 === C || 3 === C))
                      return (0 === e.avail_out && (o.last_flush = -1), 0);
                    if (
                      2 === C &&
                      (1 === t
                        ? i._tr_align(o)
                        : 5 !== t &&
                          (i._tr_stored_block(o, 0, 0, !1),
                          3 === t &&
                            (x(o.head),
                            0 === o.lookahead &&
                              ((o.strstart = 0), (o.block_start = 0), (o.insert = 0)))),
                      g(e),
                      0 === e.avail_out)
                    )
                      return ((o.last_flush = -1), 0);
                  }
                  return 4 !== t
                    ? 0
                    : o.wrap <= 0
                      ? 1
                      : (2 === o.wrap
                          ? (y(o, 255 & e.adler),
                            y(o, (e.adler >> 8) & 255),
                            y(o, (e.adler >> 16) & 255),
                            y(o, (e.adler >> 24) & 255),
                            y(o, 255 & e.total_in),
                            y(o, (e.total_in >> 8) & 255),
                            y(o, (e.total_in >> 16) & 255),
                            y(o, (e.total_in >> 24) & 255))
                          : (w(o, e.adler >>> 16), w(o, 65535 & e.adler)),
                        g(e),
                        o.wrap > 0 && (o.wrap = -o.wrap),
                        0 !== o.pending ? 0 : 1);
                }),
                (t.deflateEnd = function (e) {
                  var t;
                  return e && e.state
                    ? 42 !== (t = e.state.status) &&
                      69 !== t &&
                      73 !== t &&
                      91 !== t &&
                      t !== d &&
                      t !== p &&
                      t !== h
                      ? v(e, s)
                      : ((e.state = null), t === p ? v(e, -3) : 0)
                    : s;
                }),
                (t.deflateSetDictionary = function (e, t) {
                  var n,
                    r,
                    i,
                    c,
                    u,
                    l,
                    f,
                    d,
                    p = t.length;
                  if (!e || !e.state) return s;
                  if (2 === (c = (n = e.state).wrap) || (1 === c && 42 !== n.status) || n.lookahead)
                    return s;
                  for (
                    1 === c && (e.adler = a(e.adler, t, p, 0)),
                      n.wrap = 0,
                      p >= n.w_size &&
                        (0 === c &&
                          (x(n.head), (n.strstart = 0), (n.block_start = 0), (n.insert = 0)),
                        (d = new o.Buf8(n.w_size)),
                        o.arraySet(d, t, p - n.w_size, n.w_size, 0),
                        (t = d),
                        (p = n.w_size)),
                      u = e.avail_in,
                      l = e.next_in,
                      f = e.input,
                      e.avail_in = p,
                      e.next_in = 0,
                      e.input = t,
                      S(n);
                    n.lookahead >= 3;
                  ) {
                    ((r = n.strstart), (i = n.lookahead - 2));
                    do {
                      ((n.ins_h = ((n.ins_h << n.hash_shift) ^ n.window[r + 3 - 1]) & n.hash_mask),
                        (n.prev[r & n.w_mask] = n.head[n.ins_h]),
                        (n.head[n.ins_h] = r),
                        r++);
                    } while (--i);
                    ((n.strstart = r), (n.lookahead = 2), S(n));
                  }
                  return (
                    (n.strstart += n.lookahead),
                    (n.block_start = n.strstart),
                    (n.insert = n.lookahead),
                    (n.lookahead = 0),
                    (n.match_length = n.prev_length = 2),
                    (n.match_available = 0),
                    (e.next_in = l),
                    (e.input = f),
                    (e.avail_in = u),
                    (n.wrap = c),
                    0
                  );
                }),
                (t.deflateInfo = "pako deflate (from Nodeca project)"));
            },
            function (e, t, n) {
              "use strict";
              var r = n(0);
              function o(e) {
                for (var t = e.length; --t >= 0; ) e[t] = 0;
              }
              var i = 256,
                a = 286,
                c = 30,
                u = 15,
                s = [
                  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5,
                  5, 0,
                ],
                l = [
                  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11,
                  12, 12, 13, 13,
                ],
                f = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7],
                d = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15],
                p = new Array(576);
              o(p);
              var h = new Array(60);
              o(h);
              var v = new Array(512);
              o(v);
              var m = new Array(256);
              o(m);
              var x = new Array(29);
              o(x);
              var g,
                b,
                y,
                w = new Array(c);
              function C(e, t, n, r, o) {
                ((this.static_tree = e),
                  (this.extra_bits = t),
                  (this.extra_base = n),
                  (this.elems = r),
                  (this.max_length = o),
                  (this.has_stree = e && e.length));
              }
              function S(e, t) {
                ((this.dyn_tree = e), (this.max_code = 0), (this.stat_desc = t));
              }
              function k(e) {
                return e < 256 ? v[e] : v[256 + (e >>> 7)];
              }
              function O(e, t) {
                ((e.pending_buf[e.pending++] = 255 & t),
                  (e.pending_buf[e.pending++] = (t >>> 8) & 255));
              }
              function E(e, t, n) {
                e.bi_valid > 16 - n
                  ? ((e.bi_buf |= (t << e.bi_valid) & 65535),
                    O(e, e.bi_buf),
                    (e.bi_buf = t >> (16 - e.bi_valid)),
                    (e.bi_valid += n - 16))
                  : ((e.bi_buf |= (t << e.bi_valid) & 65535), (e.bi_valid += n));
              }
              function _(e, t, n) {
                E(e, n[2 * t], n[2 * t + 1]);
              }
              function W(e, t) {
                var n = 0;
                do {
                  ((n |= 1 & e), (e >>>= 1), (n <<= 1));
                } while (--t > 0);
                return n >>> 1;
              }
              function T(e, t, n) {
                var r,
                  o,
                  i = new Array(16),
                  a = 0;
                for (r = 1; r <= u; r++) i[r] = a = (a + n[r - 1]) << 1;
                for (o = 0; o <= t; o++) {
                  var c = e[2 * o + 1];
                  0 !== c && (e[2 * o] = W(i[c]++, c));
                }
              }
              function P(e) {
                var t;
                for (t = 0; t < a; t++) e.dyn_ltree[2 * t] = 0;
                for (t = 0; t < c; t++) e.dyn_dtree[2 * t] = 0;
                for (t = 0; t < 19; t++) e.bl_tree[2 * t] = 0;
                ((e.dyn_ltree[512] = 1),
                  (e.opt_len = e.static_len = 0),
                  (e.last_lit = e.matches = 0));
              }
              function R(e) {
                (e.bi_valid > 8
                  ? O(e, e.bi_buf)
                  : e.bi_valid > 0 && (e.pending_buf[e.pending++] = e.bi_buf),
                  (e.bi_buf = 0),
                  (e.bi_valid = 0));
              }
              function A(e, t, n, r) {
                var o = 2 * t,
                  i = 2 * n;
                return e[o] < e[i] || (e[o] === e[i] && r[t] <= r[n]);
              }
              function I(e, t, n) {
                for (
                  var r = e.heap[n], o = n << 1;
                  o <= e.heap_len &&
                  (o < e.heap_len && A(t, e.heap[o + 1], e.heap[o], e.depth) && o++,
                  !A(t, r, e.heap[o], e.depth));
                )
                  ((e.heap[n] = e.heap[o]), (n = o), (o <<= 1));
                e.heap[n] = r;
              }
              function j(e, t, n) {
                var r,
                  o,
                  a,
                  c,
                  u = 0;
                if (0 !== e.last_lit)
                  do {
                    ((r =
                      (e.pending_buf[e.d_buf + 2 * u] << 8) | e.pending_buf[e.d_buf + 2 * u + 1]),
                      (o = e.pending_buf[e.l_buf + u]),
                      u++,
                      0 === r
                        ? _(e, o, t)
                        : (_(e, (a = m[o]) + i + 1, t),
                          0 !== (c = s[a]) && E(e, (o -= x[a]), c),
                          _(e, (a = k(--r)), n),
                          0 !== (c = l[a]) && E(e, (r -= w[a]), c)));
                  } while (u < e.last_lit);
                _(e, 256, t);
              }
              function M(e, t) {
                var n,
                  r,
                  o,
                  i = t.dyn_tree,
                  a = t.stat_desc.static_tree,
                  c = t.stat_desc.has_stree,
                  s = t.stat_desc.elems,
                  l = -1;
                for (e.heap_len = 0, e.heap_max = 573, n = 0; n < s; n++)
                  0 !== i[2 * n]
                    ? ((e.heap[++e.heap_len] = l = n), (e.depth[n] = 0))
                    : (i[2 * n + 1] = 0);
                for (; e.heap_len < 2; )
                  ((i[2 * (o = e.heap[++e.heap_len] = l < 2 ? ++l : 0)] = 1),
                    (e.depth[o] = 0),
                    e.opt_len--,
                    c && (e.static_len -= a[2 * o + 1]));
                for (t.max_code = l, n = e.heap_len >> 1; n >= 1; n--) I(e, i, n);
                o = s;
                do {
                  ((n = e.heap[1]),
                    (e.heap[1] = e.heap[e.heap_len--]),
                    I(e, i, 1),
                    (r = e.heap[1]),
                    (e.heap[--e.heap_max] = n),
                    (e.heap[--e.heap_max] = r),
                    (i[2 * o] = i[2 * n] + i[2 * r]),
                    (e.depth[o] = (e.depth[n] >= e.depth[r] ? e.depth[n] : e.depth[r]) + 1),
                    (i[2 * n + 1] = i[2 * r + 1] = o),
                    (e.heap[1] = o++),
                    I(e, i, 1));
                } while (e.heap_len >= 2);
                ((e.heap[--e.heap_max] = e.heap[1]),
                  (function (e, t) {
                    var n,
                      r,
                      o,
                      i,
                      a,
                      c,
                      s = t.dyn_tree,
                      l = t.max_code,
                      f = t.stat_desc.static_tree,
                      d = t.stat_desc.has_stree,
                      p = t.stat_desc.extra_bits,
                      h = t.stat_desc.extra_base,
                      v = t.stat_desc.max_length,
                      m = 0;
                    for (i = 0; i <= u; i++) e.bl_count[i] = 0;
                    for (s[2 * e.heap[e.heap_max] + 1] = 0, n = e.heap_max + 1; n < 573; n++)
                      ((i = s[2 * s[2 * (r = e.heap[n]) + 1] + 1] + 1) > v && ((i = v), m++),
                        (s[2 * r + 1] = i),
                        r > l ||
                          (e.bl_count[i]++,
                          (a = 0),
                          r >= h && (a = p[r - h]),
                          (c = s[2 * r]),
                          (e.opt_len += c * (i + a)),
                          d && (e.static_len += c * (f[2 * r + 1] + a))));
                    if (0 !== m) {
                      do {
                        for (i = v - 1; 0 === e.bl_count[i]; ) i--;
                        (e.bl_count[i]--, (e.bl_count[i + 1] += 2), e.bl_count[v]--, (m -= 2));
                      } while (m > 0);
                      for (i = v; 0 !== i; i--)
                        for (r = e.bl_count[i]; 0 !== r; )
                          (o = e.heap[--n]) > l ||
                            (s[2 * o + 1] !== i &&
                              ((e.opt_len += (i - s[2 * o + 1]) * s[2 * o]), (s[2 * o + 1] = i)),
                            r--);
                    }
                  })(e, t),
                  T(i, l, e.bl_count));
              }
              function B(e, t, n) {
                var r,
                  o,
                  i = -1,
                  a = t[1],
                  c = 0,
                  u = 7,
                  s = 4;
                for (
                  0 === a && ((u = 138), (s = 3)), t[2 * (n + 1) + 1] = 65535, r = 0;
                  r <= n;
                  r++
                )
                  ((o = a),
                    (a = t[2 * (r + 1) + 1]),
                    (++c < u && o === a) ||
                      (c < s
                        ? (e.bl_tree[2 * o] += c)
                        : 0 !== o
                          ? (o !== i && e.bl_tree[2 * o]++, e.bl_tree[32]++)
                          : c <= 10
                            ? e.bl_tree[34]++
                            : e.bl_tree[36]++,
                      (c = 0),
                      (i = o),
                      0 === a
                        ? ((u = 138), (s = 3))
                        : o === a
                          ? ((u = 6), (s = 3))
                          : ((u = 7), (s = 4))));
              }
              function N(e, t, n) {
                var r,
                  o,
                  i = -1,
                  a = t[1],
                  c = 0,
                  u = 7,
                  s = 4;
                for (0 === a && ((u = 138), (s = 3)), r = 0; r <= n; r++)
                  if (((o = a), (a = t[2 * (r + 1) + 1]), !(++c < u && o === a))) {
                    if (c < s)
                      do {
                        _(e, o, e.bl_tree);
                      } while (0 != --c);
                    else
                      0 !== o
                        ? (o !== i && (_(e, o, e.bl_tree), c--),
                          _(e, 16, e.bl_tree),
                          E(e, c - 3, 2))
                        : c <= 10
                          ? (_(e, 17, e.bl_tree), E(e, c - 3, 3))
                          : (_(e, 18, e.bl_tree), E(e, c - 11, 7));
                    ((c = 0),
                      (i = o),
                      0 === a
                        ? ((u = 138), (s = 3))
                        : o === a
                          ? ((u = 6), (s = 3))
                          : ((u = 7), (s = 4)));
                  }
              }
              o(w);
              var D = !1;
              function z(e, t, n, o) {
                (E(e, 0 + (o ? 1 : 0), 3),
                  (function (e, t, n, o) {
                    (R(e),
                      O(e, n),
                      O(e, ~n),
                      r.arraySet(e.pending_buf, e.window, t, n, e.pending),
                      (e.pending += n));
                  })(e, t, n));
              }
              ((t._tr_init = function (e) {
                (D ||
                  ((function () {
                    var e,
                      t,
                      n,
                      r,
                      o,
                      i = new Array(16);
                    for (n = 0, r = 0; r < 28; r++)
                      for (x[r] = n, e = 0; e < 1 << s[r]; e++) m[n++] = r;
                    for (m[n - 1] = r, o = 0, r = 0; r < 16; r++)
                      for (w[r] = o, e = 0; e < 1 << l[r]; e++) v[o++] = r;
                    for (o >>= 7; r < c; r++)
                      for (w[r] = o << 7, e = 0; e < 1 << (l[r] - 7); e++) v[256 + o++] = r;
                    for (t = 0; t <= u; t++) i[t] = 0;
                    for (e = 0; e <= 143; ) ((p[2 * e + 1] = 8), e++, i[8]++);
                    for (; e <= 255; ) ((p[2 * e + 1] = 9), e++, i[9]++);
                    for (; e <= 279; ) ((p[2 * e + 1] = 7), e++, i[7]++);
                    for (; e <= 287; ) ((p[2 * e + 1] = 8), e++, i[8]++);
                    for (T(p, 287, i), e = 0; e < c; e++)
                      ((h[2 * e + 1] = 5), (h[2 * e] = W(e, 5)));
                    ((g = new C(p, s, 257, a, u)),
                      (b = new C(h, l, 0, c, u)),
                      (y = new C(new Array(0), f, 0, 19, 7)));
                  })(),
                  (D = !0)),
                  (e.l_desc = new S(e.dyn_ltree, g)),
                  (e.d_desc = new S(e.dyn_dtree, b)),
                  (e.bl_desc = new S(e.bl_tree, y)),
                  (e.bi_buf = 0),
                  (e.bi_valid = 0),
                  P(e));
              }),
                (t._tr_stored_block = z),
                (t._tr_flush_block = function (e, t, n, r) {
                  var o,
                    a,
                    c = 0;
                  (e.level > 0
                    ? (2 === e.strm.data_type &&
                        (e.strm.data_type = (function (e) {
                          var t,
                            n = 4093624447;
                          for (t = 0; t <= 31; t++, n >>>= 1)
                            if (1 & n && 0 !== e.dyn_ltree[2 * t]) return 0;
                          if (
                            0 !== e.dyn_ltree[18] ||
                            0 !== e.dyn_ltree[20] ||
                            0 !== e.dyn_ltree[26]
                          )
                            return 1;
                          for (t = 32; t < i; t++) if (0 !== e.dyn_ltree[2 * t]) return 1;
                          return 0;
                        })(e)),
                      M(e, e.l_desc),
                      M(e, e.d_desc),
                      (c = (function (e) {
                        var t;
                        for (
                          B(e, e.dyn_ltree, e.l_desc.max_code),
                            B(e, e.dyn_dtree, e.d_desc.max_code),
                            M(e, e.bl_desc),
                            t = 18;
                          t >= 3 && 0 === e.bl_tree[2 * d[t] + 1];
                          t--
                        );
                        return ((e.opt_len += 3 * (t + 1) + 5 + 5 + 4), t);
                      })(e)),
                      (o = (e.opt_len + 3 + 7) >>> 3),
                      (a = (e.static_len + 3 + 7) >>> 3) <= o && (o = a))
                    : (o = a = n + 5),
                    n + 4 <= o && -1 !== t
                      ? z(e, t, n, r)
                      : 4 === e.strategy || a === o
                        ? (E(e, 2 + (r ? 1 : 0), 3), j(e, p, h))
                        : (E(e, 4 + (r ? 1 : 0), 3),
                          (function (e, t, n, r) {
                            var o;
                            for (
                              E(e, t - 257, 5), E(e, n - 1, 5), E(e, r - 4, 4), o = 0;
                              o < r;
                              o++
                            )
                              E(e, e.bl_tree[2 * d[o] + 1], 3);
                            (N(e, e.dyn_ltree, t - 1), N(e, e.dyn_dtree, n - 1));
                          })(e, e.l_desc.max_code + 1, e.d_desc.max_code + 1, c + 1),
                          j(e, e.dyn_ltree, e.dyn_dtree)),
                    P(e),
                    r && R(e));
                }),
                (t._tr_tally = function (e, t, n) {
                  return (
                    (e.pending_buf[e.d_buf + 2 * e.last_lit] = (t >>> 8) & 255),
                    (e.pending_buf[e.d_buf + 2 * e.last_lit + 1] = 255 & t),
                    (e.pending_buf[e.l_buf + e.last_lit] = 255 & n),
                    e.last_lit++,
                    0 === t
                      ? e.dyn_ltree[2 * n]++
                      : (e.matches++,
                        t--,
                        e.dyn_ltree[2 * (m[n] + i + 1)]++,
                        e.dyn_dtree[2 * k(t)]++),
                    e.last_lit === e.lit_bufsize - 1
                  );
                }),
                (t._tr_align = function (e) {
                  (E(e, 2, 3),
                    _(e, 256, p),
                    (function (e) {
                      16 === e.bi_valid
                        ? (O(e, e.bi_buf), (e.bi_buf = 0), (e.bi_valid = 0))
                        : e.bi_valid >= 8 &&
                          ((e.pending_buf[e.pending++] = 255 & e.bi_buf),
                          (e.bi_buf >>= 8),
                          (e.bi_valid -= 8));
                    })(e));
                }));
            },
            function (e, t, n) {
              "use strict";
              e.exports = function (e, t, n, r) {
                for (var o = (65535 & e) | 0, i = ((e >>> 16) & 65535) | 0, a = 0; 0 !== n; ) {
                  n -= a = n > 2e3 ? 2e3 : n;
                  do {
                    i = (i + (o = (o + t[r++]) | 0)) | 0;
                  } while (--a);
                  ((o %= 65521), (i %= 65521));
                }
                return o | (i << 16) | 0;
              };
            },
            function (e, t, n) {
              "use strict";
              var r = (function () {
                for (var e, t = [], n = 0; n < 256; n++) {
                  e = n;
                  for (var r = 0; r < 8; r++) e = 1 & e ? 3988292384 ^ (e >>> 1) : e >>> 1;
                  t[n] = e;
                }
                return t;
              })();
              e.exports = function (e, t, n, o) {
                var i = r,
                  a = o + n;
                e ^= -1;
                for (var c = o; c < a; c++) e = (e >>> 8) ^ i[255 & (e ^ t[c])];
                return -1 ^ e;
              };
            },
            function (e, t, n) {
              "use strict";
              var r = n(0),
                o = !0,
                i = !0;
              try {
                String.fromCharCode.apply(null, [0]);
              } catch (e) {
                o = !1;
              }
              try {
                String.fromCharCode.apply(null, new Uint8Array(1));
              } catch (e) {
                i = !1;
              }
              for (var a = new r.Buf8(256), c = 0; c < 256; c++)
                a[c] = c >= 252 ? 6 : c >= 248 ? 5 : c >= 240 ? 4 : c >= 224 ? 3 : c >= 192 ? 2 : 1;
              function u(e, t) {
                if (t < 65534 && ((e.subarray && i) || (!e.subarray && o)))
                  return String.fromCharCode.apply(null, r.shrinkBuf(e, t));
                for (var n = "", a = 0; a < t; a++) n += String.fromCharCode(e[a]);
                return n;
              }
              ((a[254] = a[254] = 1),
                (t.string2buf = function (e) {
                  var t,
                    n,
                    o,
                    i,
                    a,
                    c = e.length,
                    u = 0;
                  for (i = 0; i < c; i++)
                    (55296 == (64512 & (n = e.charCodeAt(i))) &&
                      i + 1 < c &&
                      56320 == (64512 & (o = e.charCodeAt(i + 1))) &&
                      ((n = 65536 + ((n - 55296) << 10) + (o - 56320)), i++),
                      (u += n < 128 ? 1 : n < 2048 ? 2 : n < 65536 ? 3 : 4));
                  for (t = new r.Buf8(u), a = 0, i = 0; a < u; i++)
                    (55296 == (64512 & (n = e.charCodeAt(i))) &&
                      i + 1 < c &&
                      56320 == (64512 & (o = e.charCodeAt(i + 1))) &&
                      ((n = 65536 + ((n - 55296) << 10) + (o - 56320)), i++),
                      n < 128
                        ? (t[a++] = n)
                        : n < 2048
                          ? ((t[a++] = 192 | (n >>> 6)), (t[a++] = 128 | (63 & n)))
                          : n < 65536
                            ? ((t[a++] = 224 | (n >>> 12)),
                              (t[a++] = 128 | ((n >>> 6) & 63)),
                              (t[a++] = 128 | (63 & n)))
                            : ((t[a++] = 240 | (n >>> 18)),
                              (t[a++] = 128 | ((n >>> 12) & 63)),
                              (t[a++] = 128 | ((n >>> 6) & 63)),
                              (t[a++] = 128 | (63 & n))));
                  return t;
                }),
                (t.buf2binstring = function (e) {
                  return u(e, e.length);
                }),
                (t.binstring2buf = function (e) {
                  for (var t = new r.Buf8(e.length), n = 0, o = t.length; n < o; n++)
                    t[n] = e.charCodeAt(n);
                  return t;
                }),
                (t.buf2string = function (e, t) {
                  var n,
                    r,
                    o,
                    i,
                    c = t || e.length,
                    s = new Array(2 * c);
                  for (r = 0, n = 0; n < c; )
                    if ((o = e[n++]) < 128) s[r++] = o;
                    else if ((i = a[o]) > 4) ((s[r++] = 65533), (n += i - 1));
                    else {
                      for (o &= 2 === i ? 31 : 3 === i ? 15 : 7; i > 1 && n < c; )
                        ((o = (o << 6) | (63 & e[n++])), i--);
                      i > 1
                        ? (s[r++] = 65533)
                        : o < 65536
                          ? (s[r++] = o)
                          : ((o -= 65536),
                            (s[r++] = 55296 | ((o >> 10) & 1023)),
                            (s[r++] = 56320 | (1023 & o)));
                    }
                  return u(s, r);
                }),
                (t.utf8border = function (e, t) {
                  var n;
                  for (
                    (t = t || e.length) > e.length && (t = e.length), n = t - 1;
                    n >= 0 && 128 == (192 & e[n]);
                  )
                    n--;
                  return n < 0 || 0 === n ? t : n + a[e[n]] > t ? n : t;
                }));
            },
            function (e, t, n) {
              "use strict";
              e.exports = function () {
                ((this.input = null),
                  (this.next_in = 0),
                  (this.avail_in = 0),
                  (this.total_in = 0),
                  (this.output = null),
                  (this.next_out = 0),
                  (this.avail_out = 0),
                  (this.total_out = 0),
                  (this.msg = ""),
                  (this.state = null),
                  (this.data_type = 2),
                  (this.adler = 0));
              };
            },
            function (e, t, n) {
              "use strict";
              e.exports = function (e, t, n) {
                if ((t -= (e += "").length) <= 0) return e;
                if ((n || 0 === n || (n = " "), " " == (n += "") && t < 10)) return r[t] + e;
                for (var o = ""; 1 & t && (o += n), (t >>= 1); ) n += n;
                return o + e;
              };
              var r = [
                "",
                " ",
                "  ",
                "   ",
                "    ",
                "     ",
                "      ",
                "       ",
                "        ",
                "         ",
              ];
            },
            function (e, t, n) {
              "use strict";
              (Object.defineProperty(t, "__esModule", {
                value: !0,
              }),
                (t.crc32 = function (e) {
                  var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0;
                  ((e = (function (e) {
                    for (var t = "", n = 0; n < e.length; n++) {
                      var r = e.charCodeAt(n);
                      r < 128
                        ? (t += String.fromCharCode(r))
                        : r < 2048
                          ? (t +=
                              String.fromCharCode(192 | (r >> 6)) +
                              String.fromCharCode(128 | (63 & r)))
                          : r < 55296 || r >= 57344
                            ? (t +=
                                String.fromCharCode(224 | (r >> 12)) +
                                String.fromCharCode(128 | ((r >> 6) & 63)) +
                                String.fromCharCode(128 | (63 & r)))
                            : ((r = 65536 + (((1023 & r) << 10) | (1023 & e.charCodeAt(++n)))),
                              (t +=
                                String.fromCharCode(240 | (r >> 18)) +
                                String.fromCharCode(128 | ((r >> 12) & 63)) +
                                String.fromCharCode(128 | ((r >> 6) & 63)) +
                                String.fromCharCode(128 | (63 & r))));
                    }
                    return t;
                  })(e)),
                    (t ^= -1));
                  for (var n = 0; n < e.length; n++) t = (t >>> 8) ^ r[255 & (t ^ e.charCodeAt(n))];
                  return (-1 ^ t) >>> 0;
                }));
              var r = (function () {
                for (var e = [], t = void 0, n = 0; n < 256; n++) {
                  t = n;
                  for (var r = 0; r < 8; r++) t = 1 & t ? 3988292384 ^ (t >>> 1) : t >>> 1;
                  e[n] = t;
                }
                return e;
              })();
            },
            function (e, t, n) {
              "use strict";
              (function (e) {
                var t =
                  "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
                    ? function (e) {
                        return typeof e;
                      }
                    : function (e) {
                        return e &&
                          "function" == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? "symbol"
                          : typeof e;
                      };
                !(function (e, t) {
                  function n(e, t) {
                    return i(t - 903, e);
                  }
                  var r = s();
                  function o(e, t) {
                    return i(e - 322, t);
                  }
                  for (;;)
                    try {
                      if (
                        parseInt(n("o#BD", 1357)) / 1 +
                          parseInt(o(736, "o#BD")) / 2 +
                          (parseInt(o(725, "iRCa")) / 3) * (parseInt(o(720, "v&9t")) / 4) +
                          -parseInt(o(731, "CYra")) / 5 +
                          (-parseInt(o(726, "6BJ9")) / 6) * (parseInt(o(786, "ZGHp")) / 7) +
                          (parseInt(o(745, "w@1k")) / 8) * (-parseInt(n("ZGHp", 1337)) / 9) +
                          (parseInt(n("$i(c", 1360)) / 10) * (parseInt(o(733, "7@@f")) / 11) ===
                        891082
                      )
                        break;
                      r.push(r.shift());
                    } catch (e) {
                      r.push(r.shift());
                    }
                })();
                var r = n(3),
                  o = n(15);
                function i(e, t) {
                  var n = s();
                  return (i = function (t, r) {
                    var o = n[(t -= 394)];
                    void 0 === i.EeeRFy &&
                      ((i.EsJeQI = function (e, t) {
                        var n = [],
                          r = 0,
                          o = void 0,
                          i = "";
                        e = (function (e) {
                          for (
                            var t, n, r = "", o = "", i = 0, a = 0;
                            (n = e.charAt(a++));
                            ~n && ((t = i % 4 ? 64 * t + n : n), i++ % 4)
                              ? (r += String.fromCharCode(255 & (t >> ((-2 * i) & 6))))
                              : 0
                          )
                            n =
                              "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=".indexOf(
                                n,
                              );
                          for (var c = 0, u = r.length; c < u; c++)
                            o += "%" + ("00" + r.charCodeAt(c).toString(16)).slice(-2);
                          return decodeURIComponent(o);
                        })(e);
                        var a = void 0;
                        for (a = 0; a < 256; a++) n[a] = a;
                        for (a = 0; a < 256; a++)
                          ((r = (r + n[a] + t.charCodeAt(a % t.length)) % 256),
                            (o = n[a]),
                            (n[a] = n[r]),
                            (n[r] = o));
                        ((a = 0), (r = 0));
                        for (var c = 0; c < e.length; c++)
                          ((r = (r + n[(a = (a + 1) % 256)]) % 256),
                            (o = n[a]),
                            (n[a] = n[r]),
                            (n[r] = o),
                            (i += String.fromCharCode(e.charCodeAt(c) ^ n[(n[a] + n[r]) % 256])));
                        return i;
                      }),
                      (e = arguments),
                      (i.EeeRFy = !0));
                    var a = t + n[0],
                      c = e[a];
                    return (
                      c
                        ? (o = c)
                        : (void 0 === i.PjxVvf && (i.PjxVvf = !0),
                          (o = i.EsJeQI(o, r)),
                          (e[a] = o)),
                      o
                    );
                  })(e, t);
                }
                function a(e, t) {
                  return i(e - -227, t);
                }
                var c = n(16),
                  u = void 0;
                function s() {
                  var e = [
                    "CCoIWRaSnW",
                    "B1ldNd4mWOu",
                    "W6jCxW",
                    "WO/dJmo+q8kf",
                    "W53cHMxcR8oVW5/cMmkMvCkq",
                    "WPKCW7m",
                    "WQdcUmkQCCkPoCkVW7RdUCkIWRhcVhG",
                    "W48SW5pcGgpdSmkR",
                    "pvPlxW8",
                    "lvDCxcCz",
                    "dSkVWQhdUaG",
                    "d0XaBrq",
                    "hSo8WPBcUSkK",
                    "WOJdTSkCW5vk",
                    "mmomW7XpBG",
                    "t3BdQGWL",
                    "fHmfemoubq",
                    "mK0qhhu",
                    "FKCAd8om",
                    "W4PZodFdQIhdMq",
                    "W4RdJ8onW5/dVZCD",
                    "WQJdTSkGWPjrWRm",
                    "W54hW5a",
                    "kLe+jvhdN8oqda4",
                    "W60oW4nxW4xcSCkGW5rAAa",
                    "gfLywZC",
                    "dSkHW4neBSkKsmonbCoFEa",
                    "yCoAWRugga",
                    "W7i9W6RdR8kN",
                    "ldqEWRdcICky",
                    "W4BdJCkEW5H3",
                    "yCoMWP8ipW",
                    "zeZdHHmdzWpcStC",
                    "W5tcMwxcNHO",
                    "WPhcJv4Uwq",
                    "WQBcUCkIDCkUomkRW6/dVSkQWO3cHh8",
                    "qtX+caNcHH8",
                    "quPAsmkljSkUWQWVW4aU",
                    "WPiay8kjDG",
                    "aJCwWRhcOW",
                    "WO/cNCobWRKE",
                    "W5lcQ0ldV8kwhCovd1ddGh9wxG",
                    "W7NdQJC6qmkvmCkkFa",
                    "eWpcUYKLhxJdKsW",
                    "W6ldQmotW4FdQW",
                    "W7hdPmoPaCo9ACo3",
                    "W5iGW5z0W7K",
                    "oCohWQhcNmkAWPrtW6Hv",
                    "WP9LyW7dL05NW4RcNSoSWQpcQx8",
                    "EGFdNcTpWQldMq",
                    "WQBcU8kVCCoYsCoiW53dSSkT",
                    "WOtcH8k6cHRcGemroW8",
                    "l8kXWPZdSSk5WQ3cNG",
                    "fY5GmCoIW5TDWQ5SzmkCW4BcPa",
                    "sSoHWPyvlq",
                    "W4veWR3dPGLVk8kGqW",
                    "u2/dPISr",
                    "fWZcRSkPW7hcMmob",
                    "fSkJWPNdUYW8W6a",
                    "W6RcJNxcVWhcLW9sW4OG",
                    "W7JdMmorW5yVWPdcMq8",
                    "WQeKbe1S",
                    "W7BdJmkqWOeZWRpdH1aYza",
                    "W4HUpbhdRdddHW",
                    "oCooWQVdT8oS",
                    "WRFdImo6rSkp",
                    "W4hdQSoWkmoL",
                    "W5BdLYi",
                    "hg1GDby",
                    "W7xdQGpcMSk1",
                    "qNm6DCk9WOWhWP0",
                    "WQdcV3xcRCkHW6tdHWX1",
                    "d1qJk8kY",
                    "WOdcGM9PWOZcQSkbgaDrWOW",
                    "vCo0WPqBlCkO",
                    "hgqQxKFcJZ4MWRzcW7u",
                    "ybNdPWT4",
                    "W6lcGGr+ra",
                    "CmoPW4tcR8ouW7VcQ8kqWO05W4BdRW",
                    "pqRcHh57WPtdK8oBp8odxq",
                    "y3xdQGK6",
                    "WQpcRSoQWOCb",
                    "WRCAz8kDya",
                    "smoLWRWrpq",
                    "eYHOnSk4WQikWPLHxW",
                    "WQjCs8kcia",
                    "rmoJwCoyW7q",
                    "EmoJzmoUW4BcIW",
                    "naZcICkSW54",
                    "W4hdGaJcSmkm",
                    "W6hcS8kHWP9cWR/cIKuTta",
                    "W7ePW4xdVCkJ",
                    "zWrFjqa",
                    "fY1HomoHW59DWQXJtCk2W6BcIq",
                    "WQ7dTCoey8k4",
                    "W7JcIMtdJdy",
                    "W6Tkh8oRkN/cNJqJWRz0W5K",
                    "WRNdVmkRWOXBWRm",
                    "fKiefeG",
                    "vK3dLZOT",
                    "emo1WQpdTSoA",
                    "dsZcOSkPW44",
                    "rJn0aI4",
                    "WOBcGM9JWO3cQ8k5pcj7WRu",
                    "pSolW5nQwJe",
                    "WO/dVXtcOmotqW",
                    "fYSAWRBcRG",
                    "etaXw3Cjve4gtG",
                    "gr0Uk8of",
                    "WR4CsSkSDsRcTri",
                    "W6RcJNxcMZlcOqLJW4i9",
                    "W6SCW5hdGmkb",
                  ];
                  return (s = function () {
                    return e;
                  })();
                }
                ("undefined" == typeof window ? "undefined" : t(window)) !== a(181, "nr7e") &&
                  (u = window);
                var l = {
                  setCookie: function (e, t) {
                    var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 9999,
                      r = {};
                    function o(e, t) {
                      return a(t - -175, e);
                    }
                    function i(e, t) {
                      return a(e - -730, t);
                    }
                    ((r[o("YYIM", 15)] = function (e, t) {
                      return e + t;
                    }),
                      (r[o("7@@f", 25)] = function (e, t) {
                        return e * t;
                      }),
                      (r[i(-467, "n0#9")] = function (e, t) {
                        return e * t;
                      }),
                      (r[i(-510, "2K@$")] = function (e, t) {
                        return e + t;
                      }),
                      (r[o("YYIM", 58)] = o("#0dY", 49)),
                      (r[i(-490, "v*Co")] = function (e, t) {
                        return e + t;
                      }),
                      (r[i(-501, "sLNE")] = function (e, t) {
                        return e + t;
                      }),
                      (r[i(-535, "V$Xd")] = function (e, t) {
                        return e + t;
                      }),
                      (r[o("P@!o", 98)] = function (e, t) {
                        return e || t;
                      }),
                      (r[i(-527, "ji2B")] = o("w@1k", 19)));
                    var c = r;
                    e = c[o("gLJv", 101)]("_", e);
                    var s = "";
                    if (n) {
                      var l = new Date();
                      (l[o("kO^J", 16)](
                        c[i(-511, "YB3^")](
                          l[o("NW9H", 78)](),
                          c[i(-459, "295h")](
                            c[o("6JT5", 85)](c[o("N6Wx", 31)](c[o("VWEi", 81)](n, 24), 60), 60),
                            1e3,
                          ),
                        ),
                      ),
                        (s = c[i(-508, "kO^J")](c[o("295h", 82)], l[i(-486, "4)[B") + "g"]())));
                    }
                    u[o("o#BD", 29)][i(-468, "v&9t")] = c[i(-453, "P@!o")](
                      c[i(-466, "pGSi")](
                        c[o("295h", 79)](c[i(-557, "v*Co")](e, "="), c[o("ji2B", 48)](t, "")),
                        s,
                      ),
                      c[o("v&9t", 67)],
                    );
                  },
                  getCookie: function (e) {
                    var t = {};
                    function n(e, t) {
                      return a(t - 752, e);
                    }
                    ((t[n("nr7e", 1010)] = function (e, t) {
                      return e + t;
                    }),
                      (t[o(197, "xvVC")] = function (e, t) {
                        return e < t;
                      }),
                      (t[o(188, "xde7")] = function (e, t) {
                        return e === t;
                      }));
                    var r = t;
                    function o(e, t) {
                      return a(e - -37, t);
                    }
                    e = r[o(165, "295h")]("_", e);
                    for (
                      var i = r[n("%J@R", 1001)](e, "="),
                        c = u[n("$i(c", 995)][n("#0dY", 983)][n("xde7", 997)](";"),
                        s = 0;
                      r[o(224, "YYIM")](s, c[n("[*([", 991)]);
                      s++
                    ) {
                      for (var l = c[s]; r[o(137, "(UiB")](l[o(238, "v*Co")](0), " "); )
                        l = l[n("YYIM", 1030)](1, l[n("2K@$", 973)]);
                      if (r[n("kO^J", 987)](l[n("wtDD", 922)](i), 0))
                        return l[n("n0#9", 1021)](i[n("2K@$", 973)], l[n("P@!o", 960)]);
                    }
                    return null;
                  },
                  setStorage: function (e, t) {
                    function n(e, t) {
                      return a(t - -556, e);
                    }
                    var r = {};
                    function o(e, t) {
                      return a(t - 20, e);
                    }
                    ((r[o("xvVC", 218)] = function (e, t) {
                      return e + t;
                    }),
                      (e = r[n("P@!o", -339)]("_", e)),
                      u[o("D&YH", 290) + "ge"][n("VWEi", -364)](e, t));
                  },
                  getStorage: function (e) {
                    var t = {};
                    function n(e, t) {
                      return a(e - 982, t);
                    }
                    return (
                      (t[n(1256, "xde7")] = function (e, t) {
                        return e + t;
                      }),
                      (e = t[n(1181, "%J@R")]("_", e)),
                      u[a(241, "Ql%4") + "ge"][n(1179, "ACM^")](e)
                    );
                  },
                };
                function f(e, t) {
                  return i(t - 135, e);
                }
                function d() {
                  var e =
                      arguments.length > 0 && void 0 !== arguments[0]
                        ? arguments[0]
                        : Date[a(251, "k6jB")](),
                    t = {
                      EvSjI: function (e, t) {
                        return e(t);
                      },
                      ZPPMU: function (e) {
                        return e();
                      },
                      OVEHq: function (e, t) {
                        return e % t;
                      },
                      XKmds: function (e, t, n, r) {
                        return e(t, n, r);
                      },
                      OfXBm: function (e, t) {
                        return e(t);
                      },
                    },
                    n = t[u(-287, "(UiB")](String, e)[d("%J@R", 642)](0, 10),
                    i = t[d("iRCa", 582)](o);
                  function u(e, t) {
                    return f(t, e - -864);
                  }
                  var s = t[d("wtDD", 640)](
                      (n + "_" + i)[u(-314, "P@!o")]("")[d("#0dY", 681)](function (e, t) {
                        return e + t[d("6bD!", 599)](0);
                      }, 0),
                      1e3,
                    ),
                    l = t[u(-243, "zRjX")](c, t[u(-270, "n0#9")](String, s), 3, "0");
                  function d(e, t) {
                    return f(e, t - 52);
                  }
                  return r[u(-264, "6JT5")]("" + n + l)[d("IxPg", 680)](/=/g, "") + "_" + i;
                }
                function p(e) {
                  var t = {};
                  function n(e, t) {
                    return a(t - 678, e);
                  }
                  function r(e, t) {
                    return f(t, e - -720);
                  }
                  return (
                    (t[r(-186, "$i(c")] = function (e, t) {
                      return e + t;
                    }),
                    t[r(-112, "P@!o")](
                      e[n("tJ0$", 925)](0)[n("4)[B", 871) + "e"](),
                      e[n("O4hK", 889)](1),
                    )
                  );
                }
                e[f("ACM^", 627)] = function () {
                  var e = {
                      oOWEw: function (e, t) {
                        return e(t);
                      },
                      ZBntu: function (e, t) {
                        return e(t);
                      },
                      ijTRV: r("L*(*", 851),
                      SAvBP: function (e) {
                        return e();
                      },
                      JxEQk: i(156, "295h"),
                      miNDx: r("$h^o", 848),
                    },
                    t = e[i(111, "$h^o")],
                    n = {};
                  function r(e, t) {
                    return f(e, t - 303);
                  }
                  var o = e[r("D&YH", 845)](d);
                  function i(e, t) {
                    return a(e - -99, t);
                  }
                  return (
                    [e[r("4)[B", 832)], e[i(117, "$i(c")]][i(80, "7@@f")](function (a) {
                      function c(e, t) {
                        return r(e, t - 283);
                      }
                      function u(e, t) {
                        return i(t - -326, e);
                      }
                      try {
                        var s = c("wtDD", 1184) + a + u("D&YH", -157);
                        ((n[s] = l[u("ZGHp", -224) + e[u("tJ0$", -211)](p, a)](t)),
                          !n[s] &&
                            (l[c(")pXx", 1196) + e[u("IxPg", -247)](p, a)](t, o), (n[s] = o)));
                      } catch (e) {}
                    }),
                    n
                  );
                };
              }).call(this, n(1)(e));
            },
            function (e, t, n) {
              "use strict";
              e.exports = function (e) {
                e = e || 21;
                for (var t = ""; 0 < e--; )
                  t += "_~varfunctio0125634789bdegjhklmpqswxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"[
                    (64 * Math.random()) | 0
                  ];
                return t;
              };
            },
            function (e, t, n) {
              "use strict";
              e.exports = function (e, t, n) {
                if ("string" != typeof e) throw new Error("The string parameter must be a string.");
                if (e.length < 1)
                  throw new Error("The string parameter must be 1 character or longer.");
                if ("number" != typeof t) throw new Error("The length parameter must be a number.");
                if ("string" != typeof n && n)
                  throw new Error("The character parameter must be a string.");
                var r = -1;
                for (t -= e.length, n || 0 === n || (n = " "); ++r < t; ) e += n;
                return e;
              };
            },
          ])));
      }).call(this, n("8oxB"));
    },
    "8oxB": function (e, t) {
      var n,
        r,
        o = (e.exports = {});
      function i() {
        throw new Error("setTimeout has not been defined");
      }
      function a() {
        throw new Error("clearTimeout has not been defined");
      }
      function c(e) {
        if (n === setTimeout) return setTimeout(e, 0);
        if ((n === i || !n) && setTimeout) return ((n = setTimeout), setTimeout(e, 0));
        try {
          return n(e, 0);
        } catch (t) {
          try {
            return n.call(null, e, 0);
          } catch (t) {
            return n.call(this, e, 0);
          }
        }
      }
      !(function () {
        try {
          n = "function" === typeof setTimeout ? setTimeout : i;
        } catch (e) {
          n = i;
        }
        try {
          r = "function" === typeof clearTimeout ? clearTimeout : a;
        } catch (e) {
          r = a;
        }
      })();
      var u,
        s = [],
        l = !1,
        f = -1;
      function d() {
        l && u && ((l = !1), u.length ? (s = u.concat(s)) : (f = -1), s.length && p());
      }
      function p() {
        if (!l) {
          var e = c(d);
          l = !0;
          for (var t = s.length; t; ) {
            for (u = s, s = []; ++f < t; ) u && u[f].run();
            ((f = -1), (t = s.length));
          }
          ((u = null),
            (l = !1),
            (function (e) {
              if (r === clearTimeout) return clearTimeout(e);
              if ((r === a || !r) && clearTimeout) return ((r = clearTimeout), clearTimeout(e));
              try {
                r(e);
              } catch (t) {
                try {
                  return r.call(null, e);
                } catch (t) {
                  return r.call(this, e);
                }
              }
            })(e));
        }
      }
      function h(e, t) {
        ((this.fun = e), (this.array = t));
      }
      function v() {}
      ((o.nextTick = function (e) {
        var t = new Array(arguments.length - 1);
        if (arguments.length > 1)
          for (var n = 1; n < arguments.length; n++) t[n - 1] = arguments[n];
        (s.push(new h(e, t)), 1 !== s.length || l || c(p));
      }),
        (h.prototype.run = function () {
          this.fun.apply(null, this.array);
        }),
        (o.title = "browser"),
        (o.browser = !0),
        (o.env = {}),
        (o.argv = []),
        (o.version = ""),
        (o.versions = {}),
        (o.on = v),
        (o.addListener = v),
        (o.once = v),
        (o.off = v),
        (o.removeListener = v),
        (o.removeAllListeners = v),
        (o.emit = v),
        (o.prependListener = v),
        (o.prependOnceListener = v),
        (o.listeners = function (e) {
          return [];
        }),
        (o.binding = function (e) {
          throw new Error("process.binding is not supported");
        }),
        (o.cwd = function () {
          return "/";
        }),
        (o.chdir = function (e) {
          throw new Error("process.chdir is not supported");
        }),
        (o.umask = function () {
          return 0;
        }));
    },
  });
  //# sourceMappingURL=http://esxftfvh.com/msfe/sourcemap/wholesale/static/js/runtime~main.7847e63d.v20240716150741_849ca94f.js.map
  var e = new Date().getTime();
  var anti___content = new (xx("fbeZ"))({ serverTime: e }).messagePack();
  return anti___content;
}
//  创建获取工单
safeIpcOn("create-workorder", async (_, args) => {
  let datalist = [];
  try {
    // 获取当前选中的聊天用户ID
    const selectIdDom = document.querySelector(".chat-list-box .chat-item-box.transition.active");
    if (!selectIdDom) {
      ipcRenderer.send("get-create-workorder", datalist);
      return;
    }
    const selectId = selectIdDom.getAttribute("data-random");
    if (!selectId) {
      ipcRenderer.send("get-create-workorder", datalist);
      return;
    }
    const id = selectId.split("-")[0];
    // console.log('获取到用户ID:', id)
    // 切换到订单面板
    const tab = document.querySelector(".right-panel-container");
    if (!tab) {
      ipcRenderer.send("get-create-workorder", datalist);
      return;
    }
    const lilist = tab.querySelectorAll(".bar-item");
    if (lilist.length < 2) {
      ipcRenderer.send("get-create-workorder", datalist);
      return;
    }
    // 点击订单标签
    lilist[1].click();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // 点击全部订单
    const orderpanel = document.querySelector(".order-panel-header");
    if (!orderpanel || !orderpanel.children[1]) {
      ipcRenderer.send("get-create-workorder", datalist);
      return;
    }
    orderpanel.children[1].click();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // 获取页码信息
    const input = tab.querySelector(".indexPages");
    const pageNo = input?.value || 1;
    // 获取订单列表
    // console.log('正在获取订单列表...')
    const response = await fetch(`https://mms.pinduoduo.com/latitude/order/userAllOrder`, {
      method: "POST",
      credentials: "include",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "anti-content": antigain(),
      },
      body: JSON.stringify({
        showHistory: true,
        pageNo: pageNo,
        pageSize: 10,
        uid: id,
      }),
    });
    if (!response.ok) {
      console.error("获取订单列表失败:", response.status, response.statusText);
      ipcRenderer.send("get-create-workorder", datalist);
      return;
    }
    const data = await response.json();
    // console.log('订单列表数据:', data)
    if (!data.success || !data.result?.orders) {
      // console.warn('订单数据格式错误或无订单')
      ipcRenderer.send("get-create-workorder", datalist);
      return;
    }
    const orders = data.result.orders;
    // console.log(`找到 ${orders.length} 个订单，开始获取详细信息...`)
    // 并发获取订单详情（限制并发数）
    const batchSize = 3; // 限制并发数避免请求过多
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);
      const promises = batch.map(async (item) => {
        try {
          const good = item.orderGoodsList;
          if (!good) {
            console.warn(`订单 ${item.orderSn} 无商品信息`);
            return null;
          }
          // 获取订单详细地址信息
          const res = await fetch("https://mms.pinduoduo.com/fopen/order/detail", {
            method: "POST",
            credentials: "include",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              biz_code: "chat",
              order_sn: item.orderSn,
              receiver_info: ["mobile", "name", "address"],
              scene_code: "mall_customer_wait_shipping_sign",
            }),
          });
          if (!res.ok) {
            console.warn(`获取订单 ${item.orderSn} 详情失败:`, res.status);
            return null;
          }
          const resaddress = await res.json();
          const addressdata = resaddress.result;
          if (!addressdata) {
            console.warn(`订单 ${item.orderSn} 无地址信息`);
            return null;
          }
          return {
            orderId: item.orderSn || "",
            type: item.orderStatusStr || "未知状态",
            orderName: good.goodsName || "未知商品",
            sku: `${good.spec || ""} ${good.goodsNumber || ""}`.trim() || "无规格",
            name: `${addressdata.name || ""} ${addressdata.mobile || ""}`.trim() || "无姓名",
            trackingNumber: item.trackingNumber || "",
            expressCompany:
              item.traceInfoList && item.traceInfoList.length > 0
                ? item.traceInfoList[0].shippingName
                : "",
            address:
              `${addressdata.province || ""}${addressdata.city || ""}${addressdata.district || ""}${addressdata.address || ""}`.trim() ||
              "无地址",
            expanded: true,
          };
        } catch (error) {
          console.error(`处理订单 ${item.orderSn} 时出错:`, error);
          return null;
        }
      });
      const batchResults = await Promise.all(promises);
      const validResults = batchResults.filter((result) => result !== null);
      datalist.push(...validResults);
      // 批次之间添加小延迟
      if (i + batchSize < orders.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  } catch (error) {
    console.error("获取工单信息时发生错误:", error);
  } finally {
    ipcRenderer.send("get-create-workorder", datalist);
  }
});
safeIpcOn("currnt-page", (_, key) => {
  _key = key;
  if (_key) {
    // key为true时暂停定时器
    ipcRenderer.send("get-currnt-page", false);
    clearTimeout(hearTimer); // 清除当前定时器
  } else {
    // sendHeartbeat
    // console.log('继续11111111')
    _sendHeartbeat(currentInterval);
    return;
  }
});
const _sendHeartbeat = (time) => {
  if (hearTimer) {
    clearTimeout(hearTimer);
  }
  hearTimer = setTimeout(async () => {
    // console.log('执行11111========', _key)
    if (_key && info) return;
    ipcRenderer.send("reload-page");
    time = 0;
    // location.reload();
    _sendHeartbeat();
  }, time || currentInterval); // 使用临时变量
};
//  获取指定用户历史记录
safeIpcOn("get-shop-user", getUserHistory);
async function getUserHistory(_, arg) {
  const replyTextarea = document.querySelector("#replyTextarea");
  if (replyTextarea) {
    // 检查输入框是否有内容
    const hasContent = replyTextarea.value && replyTextarea.value.trim().length > 0;
    // 立即计算用户是否在操作（不依赖定时器）
    const now = Date.now();
    const timeSinceMouseActivity = now - lastMouseActivity;
    const timeSinceKeyboardActivity = now - lastKeyboardActivity;
    const timeSinceLastActivity = Math.min(timeSinceMouseActivity, timeSinceKeyboardActivity);

    // 用户是否在最近1秒内有活动
    const hasRecentActivity = windowHasFocus && timeSinceLastActivity < USER_ACTIVITY_TIMEOUT;

    // 综合判断：输入框有内容 或 最近有活动（输入框有焦点不算操作，只要没内容就行）
    const userIsOperating = hasContent || hasRecentActivity;

    // 发送用户操作状态
    ipcRenderer.send("get-shop-isuser-status", {
      hasContent: userIsOperating,
    });

    if (userIsOperating) {
      console.log("用户正在操作，跳过AI处理");
      return; // 停止获取用户历史记录
    }
  }
  throttledClickCustomerMessage(arg); // 点击客户消息
  await ms_delay(1000); // 等待内容渲染
  const userHistoryData = getUserHistoryData();
  if (userHistoryData && userHistoryData.length > 0) {
    let processedData = userHistoryData.map((item) => ({
      ...item,
      orderStatus: item.orderStatus || arg.orderStatus, // 返回订单状态
      messageId: arg.messageId,
    }));
    processedData = processedData.filter((item) => item.content !== "");
    arg.history = processedData;
    //  将内容 转为字符串 传输
    ipcRenderer.send("get-historical-records", JSON.stringify(arg));
  }
}
const getUserHistoryData = () => {
  function emojiUrlToName(url) {
    return url
      .split("/")
      .pop()
      .replace(/\.[^.]+$/, "");
  }

  function getTextWithoutButtons(el) {
    let text = "";
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        const classList = node.className || "";
        const hasClickEvent = typeof node.onclick === "function" || node.hasAttribute("onclick");

        const style = window.getComputedStyle(node);
        const isClickable =
          hasClickEvent ||
          tag === "button" ||
          style.cursor === "pointer" ||
          /(btn|copy|operate|action|link)/i.test(classList);

        if (isClickable) continue;
        text += getTextWithoutButtons(node);
      }
    }
    return text.trim();
  }

  function extractTextFromTabSync() {
    try {
      const barItems = document.querySelectorAll(".bar-item");
      const recommendTab = Array.from(barItems).find((el) => el.textContent.includes("商品推荐"));

      // 如果已经在“商品推荐”界面就不点击
      const isRecommendSelected =
        recommendTab &&
        recommendTab.classList.contains("bar-item") &&
        recommendTab.classList.contains("bar-select");
      if (!isRecommendSelected && recommendTab) {
        recommendTab.click();
      }

      const categories = document.querySelectorAll(".one-category");
      const allGoodsTab = Array.from(categories).find((el) => el.textContent.includes("全部商品"));

      // 如果已经是“全部商品”就不点击
      const isAllGoodsSelected = allGoodsTab && allGoodsTab.classList.contains("category-selected");
      if (!isAllGoodsSelected && allGoodsTab) {
        allGoodsTab.click();
      }

      const goodsNameEl = document.querySelector(".goodsRecommendItem.add-blue-border .goods-name");
      if (goodsNameEl) {
        return goodsNameEl.innerHTML;
      } else {
        // 没获取到，说明不是这个界面
        return "";
      }
    } catch (err) {
      console.error("执行失败:", err);
      return "";
    }
  }

  // 获取激活的会话元素
  const activeChat = document.querySelector(".chat-item-box.active");

  // 获取用户名
  const username = activeChat.querySelector(".chat-nickname").innerText;

  const msgul = document.querySelector("ul.msg-list");
  if (!msgul) return "[]";

  let msgList = [];
  let lastGoodsTitle = null;
  let lastOrderId = null;
  let lastOrderStatus = null; // ✅ 新增全局状态变量

  msgul.querySelectorAll("li").forEach((msgli) => {
    try {
      const d = msgli.querySelector(
        ".buyer-item, .cs-item, .notify-card, .msg-system, .lego-card, .commonCard, .commonCardTemp",
      );
      if (!d) return;

      const classes = Array.from(d.classList);
      const timestamp = msgli.id.split("_").pop();

      const baseMsg = {
        role: "user",
        content: "",
        timestamp,
        image: null,
        video_cover: null,
        duration: null,
        emoji: null,
        orderId: lastOrderId,
        goodsTitle: lastGoodsTitle,
        orderStatus: lastOrderStatus, // ✅ 基础结构中补充字段
        isOrder: null,
        username: username,
      };

      if (classes.includes("notify-card")) {
        const p = d.querySelector("p");
        if (p) {
          const title = getTextWithoutButtons(p);
          lastGoodsTitle = title;
          msgList.push({
            ...baseMsg,
            // msg: `用户发送商品卡片:${title}`,
            content: `用户咨询商品：:${title}`,
            goodsTitle: title,
          });
        }
        return;
      }

      if (classes.includes("commonCardTemp")) {
        msgList.push({
          ...baseMsg,
          content: getTextWithoutButtons(d), // ✅ 和订单一样直接取整个卡片文本
        });
        return;
      }

      if (classes.includes("buyer-item")) {
        // 售后申请卡片 (apply-card)
        const applyCard = d.querySelector(".apply-card");
        if (applyCard) {
          try {
            const title = getTextWithoutButtons(applyCard.querySelector(".goods-card .goods-name"));
            lastGoodsTitle = title;
            lastOrderStatus = "售后申请中";

            msgList.push({
              ...baseMsg,
              content: getTextWithoutButtons(applyCard), // ✅ 和订单一样直接取整个卡片文本
              goodsTitle: title,
              orderStatus: lastOrderStatus,
              isOrder: true,
            });
          } catch (e) {
            console.warn("解析售后申请卡片出错:", e);
          }
          return;
        }
        const orderCard = d.querySelector(".msg-content.order-card");
        if (orderCard) {
          try {
            const title = getTextWithoutButtons(orderCard.querySelector("p.good-name"));
            let orderText = getTextWithoutButtons(orderCard.querySelector("p.order-id"));
            orderText = orderText.replace(/^订单编号：/, "").trim();

            const statusInfoP = orderCard.querySelector("p.status-info"); // ✅ 提取订单状态
            if (statusInfoP) {
              lastOrderStatus = statusInfoP.innerText.trim();
            }

            lastGoodsTitle = title;
            lastOrderId = orderText;

            msgList.push({
              ...baseMsg,
              content: getTextWithoutButtons(d),
              orderId: orderText,
              goodsTitle: title,
              orderStatus: lastOrderStatus, // ✅ 设置状态字段
              isOrder: true,
            });
          } catch (e) {}
          return;
        }

        const goodTitleP = d.querySelector("p.good-name");
        if (goodTitleP) {
          const title = getTextWithoutButtons(goodTitleP);
          lastGoodsTitle = title;

          msgList.push({
            ...baseMsg,
            // msg: `用户发送了商品卡片:${title}`,
            content: `用户咨询商品：${title}`,
            goodsTitle: title,
          });
          return;
        }
      }

      if (classes.includes("buyer-item")) {
        const quoteMsgDiv = d.querySelector(".msg-content.quote-msg-template");
        if (quoteMsgDiv) {
          const quoteUserDiv = quoteMsgDiv.querySelector(".be-quote-user");
          const quoteUser = quoteUserDiv
            ? getTextWithoutButtons(quoteUserDiv).replace("：", "").trim()
            : "";
          const quoteTextDiv = quoteMsgDiv.querySelector(".be-quote-content");
          const quoteText = quoteTextDiv ? getTextWithoutButtons(quoteTextDiv) : "";
          const replyDiv = quoteMsgDiv.querySelector(".quote-new-msg-text");
          const replyText = replyDiv ? getTextWithoutButtons(replyDiv) : "";
          if (replyText) {
            msgList.push({
              ...baseMsg,
              content: `用户回复：“${replyText}”，引用了 ${quoteUser} 的消息：“${quoteText}”`,
            });
          }
          return;
        }

        const imageDiv = d.querySelector(".image-msg img");
        if (imageDiv && imageDiv.src) {
          msgList.push({
            ...baseMsg,
            image: imageDiv.src,
            content: `用户发送了图片`,
          });
          return;
        }

        const videoBox = d.querySelector(".video-content .video-box");
        if (videoBox) {
          const coverImg = videoBox.querySelector("img");
          const durationSpan = videoBox.querySelector(".video-duration");
          if (coverImg && coverImg.src) {
            msgList.push({
              ...baseMsg,
              video_cover: coverImg.src,
              duration: durationSpan ? getTextWithoutButtons(durationSpan) : "",
              content: `用户发送了视频`,
            });
            return;
          }
        }

        const emojiImgs = d.querySelectorAll("img.emojione");
        if (emojiImgs.length) {
          const pText = d.querySelector("p.msg-content-box");
          const tempMsg = pText ? getTextWithoutButtons(pText) : "";
          if (tempMsg) {
            msgList.push({
              ...baseMsg,
              content: tempMsg,
            });
            return;
          }
          const emojis = Array.from(emojiImgs).map((img) => img.src);
          const names = emojis
            .map((url) => emojiUrlToName(url))
            .filter(Boolean)
            .join(";");
          msgList.push({
            ...baseMsg,
            content: (emojis.length > 1 ? "用户发送了多个表情:" : "用户发送了表情:") + names,
            emoji: emojis,
          });
          return;
        }

        const stickerImg = d.querySelector(".msg-content.sticker-msg img");
        if (stickerImg && stickerImg.src) {
          const name = emojiUrlToName(stickerImg.src);
          msgList.push({
            ...baseMsg,
            content: `用户发送了动态表情:${name}`,
            emoji: [stickerImg.src],
          });
          return;
        }

        const specBox = d.querySelector(".msg-content.lego-card.clear-style");
        if (specBox) {
          const spec = specBox.querySelector(
            ".mskefu_aladdin_merchant_message_service__goodsSpec___O84qG",
          );
          if (spec) {
            msgList.push({
              ...baseMsg,
              content: `用户咨询了商品规格: ${getTextWithoutButtons(spec)}`,
            });
          }
          return;
        }

        const pText = d.querySelector("p.msg-content-box");
        msgList.push({
          ...baseMsg,
          content: pText ? getTextWithoutButtons(pText) : "",
        });
        return;
      }

      if (classes.includes("cs-item")) {
        const pText = d.querySelector("p.msg-content-box");
        if (pText) {
          msgList.push({
            ...baseMsg,
            role: "assistant",
            content: getTextWithoutButtons(pText),
          });
        } else {
          const imageDiv = d.querySelector("div.msg-content.image-msg");
          if (imageDiv) {
            msgList.push({
              ...baseMsg,
              role: "assistant",
              content: "图片已发送",
            });
          }
        }
        return;
      }

      if (classes.includes("msg-system")) {
        msgList.push({ ...baseMsg });
        return;
      }

      if (classes.includes("lego-card")) {
        msgList.push({
          ...baseMsg,
          role: "system",
          content: getTextWithoutButtons(d),
        });
        return;
      }

      msgList.push({ ...baseMsg });
    } catch (e) {
      console.warn("解析单条消息出错:", e);
    }
  });

  // if (!lastGoodsTitle) lastGoodsTitle = extractTextFromTabSync();
  if (lastGoodsTitle) msgList.forEach((item) => (item.goodsTitle = lastGoodsTitle));
  if (lastOrderId) msgList.forEach((item) => (item.orderId = lastOrderId));
  if (lastOrderStatus) msgList.forEach((item) => (item.orderStatus = lastOrderStatus)); // ✅ 最终同步
  if (msgList && msgList.length > 0) {
    const reversed = [...msgList].reverse();
    const index = reversed.findIndex((item) => item.role == "assistant" || item.role == "system");
    msgList = index >= 0 ? reversed.slice(0, index).reverse() : [];
  }
  return msgList;
};

// // 创建工具函数
const ms_delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// 接收拦截订单用户
safeIpcOn("goto-order-user", async (_, arg) => {
  const more = document.querySelector(".add-new-con");
  if (more) {
    more.click();
    await ms_delay(500);
    const input = document.querySelector(
      '[aria-label="添加会话"]   input[placeholder="请输入订单号"]',
    );
    if (input) {
      input.value = arg.ordersn;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      const button = document.querySelector(
        '[aria-label="添加会话"]  .el-dialog__footer .el-button--primary',
      );
      button.click();
    }
  }
});

// 获取售后月总工单
safeIpcOn("get-after-sale-total-order", async (_, arg) => {
  const info = arg;
  try {
    let totalTodoList = 0;
    // 现获取接口
    const monthStart = new Date(info.info.month[0]);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(info.info.month[1]);
    monthEnd.setHours(23, 59, 59, 999);
    // 计算自定义日期
    const start = Math.floor(monthStart.getTime() / 1000);
    const end = Math.floor(monthEnd.getTime() / 1000);
    // 先获取售后订单
    const aqueryList = await fetch(`https://mms.pinduoduo.com/mercury/mms/afterSales/queryList`, {
      method: "post",
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pageSize: 10,
        pageNumber: 1,
        orderByCreatedAtDesc: true,
        mallRemarkStatus: null,
        mallRemarkTag: null,
        startCreatedTime: start,
        endCreatedTime: end,
      }),
    }).then((res) => res.json());

    const afterSaleOrder = await fetch(
      "https://mms.pinduoduo.com/mercury/mms/afterSales/queryGroupCount",
      {
        mode: "cors",
        credentials: "include",
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderByCreatedAtDesc: true,
          pageNumber: 1,
          endCreatedTime: end,
          startCreatedTime: start,
        }),
      },
    ).then((_res) => _res.json());
    // 算出总收售后订单
    // queryGroupCount
    //
    const applyCount = aqueryList.result.total; //  总数
    // const  workOrderCount = ''   // 工单订单数
    const refundOnlyCount = afterSaleOrder.result.unshippedOnlyRefund; // 未发货
    // const  noNeedHandleCount = afterSaleOrder.result.unshippedOnlyRefund   //
    const realCount = afterSaleOrder.result.shippedOnlyRefund + afterSaleOrder.result.returnRefund; // 实际订单数
    // 拿出工单数量
    const todoList = await fetch("https://mms.pinduoduo.com/strickland/sop/mms/todoList", {
      mode: "cors",
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serviceStatus: [null], // 查询工单  全部
        problemType: [null],
        createStartTime: start,
        createEndTime: end,
        pageNum: 1,
        pageSize: 10,
      }),
    }).then((_res) => _res.json());
    const { errorCode, success, result } = todoList;
    if (errorCode == 1000000 && success) {
      // console.log('进入判断========')
      const applyCount = aqueryList.result.total; //  总数
      const workOrderCount = result.total; // 工单订单数
      const refundOnlyCount = afterSaleOrder.result.unshippedOnlyRefund; // 未发货
      // const  noNeedHandleCount = afterSaleOrder.result.unshippedOnlyRefund   //
      const realCount =
        afterSaleOrder.result.shippedOnlyRefund +
        afterSaleOrder.result.returnRefund +
        workOrderCount; // 实际订单数
      ipcRenderer.send("get-after-sale-total-order-result", {
        applyCount,
        workOrderCount,
        refundOnlyCount,
        realCount,
        id: info.info.id,
      });
    }
  } catch (error) {
    // 发送错误信息回调
    ipcRenderer.send("web-scoker-error-callback", {
      info: info,
      errormsg: "查询月总工单失败,失败原因:" + JSON.stringify(error),
      shopId: info.info.shopId,
    });
  }
});

// 转接子账号或者星标   todo  暂时注释 功能未完善 后续完善
// safeIpcOn('goto-human-reply', async (_, arg) => {
//   console.log('goto-human-reply==============>', arg)
//   if (arg.type === 1) {
//     // 转接子账号
//     const transferChatSpan = document.querySelector('.transfer-chat-wrap span')
//     if (!transferChatSpan) {
//       console.error('未找到"转移聊天"的span元素')
//       return
//     }
//
//     transferChatSpan.click()
//
//     setTimeout(async () => {
//       try {
//         const searchInput = document.querySelector(
//           '.el-input__inner[type="text"][placeholder="请输入内容"]'
//         )
//         if (!searchInput) {
//           console.error('未找到搜索输入框')
//           return
//         }
//         searchInput.value = arg.subAccount
//         searchInput.dispatchEvent(new Event('input', { bubbles: true }))
//         await ms_delay(500)
//         const server_ids = document.querySelectorAll(
//           '.el-table__row .el-table_1_column_1 .cell'
//         )
//         const transferButtons = document.querySelectorAll(
//           '.el-table__row .item-btn-transfer'
//         )
//         // 从server_ids中找到对应的id
//         const server_id = Array.from(server_ids).findIndex(
//           (id) => id.textContent === arg.subAccount
//         )
//         if (server_id < 0) {
//           console.error('未找到对应的子账号')
//           return
//         }
//         transferButtons[server_id].click()
//         await ms_delay(1000)
//         try {
//           const otherReasonInput = document.querySelector(
//             '.el-popover[aria-hidden=false] .transfer-remark-edit-box .el-input__inner[placeholder="其它转移原因"]'
//           )
//           const sendBtn = document.querySelector(
//             '.el-popover[aria-hidden=false] .transfer-remark-edit-box .edit-submit-span'
//           )
//
//           if (otherReasonInput && sendBtn) {
//             otherReasonInput.value = 'AI转接'
//             otherReasonInput.dispatchEvent(
//               new Event('input', { bubbles: true })
//             )
//             otherReasonInput.dispatchEvent(
//               new Event('change', { bubbles: true })
//             )
//
//             setTimeout(() => {
//               sendBtn.click()
//               console.log('成功转移给客服: ${currentName}')
//             }, 500)
//           } else {
//             console.error('未找到对应输入框或发送按钮不可用')
//           }
//         } catch (e) {
//           console.error('填写转移原因出错', e)
//         }
//       } catch (e) {
//         console.error('转接子账号或者星标出错:', e)
//       }
//     }, 1000)
//   }
// })

// document.addEventListener('keydown', (e) => {
//   console.log('keydown1', e, e.target)
// })

const insertScriptStr = () => {
  let shopinfo = {};
  let globStatus = "在线";
  let delectDatalistById = new Map();
  document.addEventListener("keydown", (e) => {
    const element = document.querySelector("[currentuid]");
    console.info("keydown2", e, element);
    if (element) {
      const userId = element.getAttribute("currentuid");
      delectDatalistById.set(userId, true);
    }
  });

  let isAutoOnlineBlockedInPage = false; // 页面注入层同步保存自动上线拦截状态
  async function getBackstageStatus() {
    if (!shopinfo?.username) return null;
    const res = await fetch(
      `https://mms.pinduoduo.com/chats/chatStatusUsers?csname=${shopinfo.username}`,
      {
        method: "get",
        headers: {
          "Content-Type": "application/json",
        },
        // obj:{}
      },
    ).then((r) => r.json());
    return res.length ? res[res.length - 1].status : null; // 获取最后一条记录
  }

  // WebSocket 状态追踪
  function getMessageCont() {
    const shopMessageCont = document.querySelector(".conv-today");
    if (shopMessageCont) {
      if (shopMessageCont.textContent) {
        const match = shopMessageCont.textContent.match(/\((\d+)\)/);
        if (match) return match[1] || 0;
      }
    }
    return 0;
  }
  let reconnectCount = 0;
  let windowStartTime = 0;
  let resetTimer = null;
  // let fireMin = 0
  // let fireMinTimer = null

  let reconnectMap = new Map();
  let pendingReconnectByKey = new Map();

  const reportedData = () => {
    let resultString = "";
    reconnectMap.forEach((value, key) => {
      if (value.timestamp) {
        value.timestampString = new Date(value.timestamp).toLocaleString();
      }
      if (value.linkBrokenTime != null) {
        value.linkBrokenTimeString = Math.round(value.linkBrokenTime / 1000);
      }
      const linkBrokenSeconds =
        value?.linkBrokenTimeString != null ? value.linkBrokenTimeString : "--";
      const downlink = value?.downlink != null ? value.downlink : "--";
      const effectiveType = value?.effectiveType || "--";
      const rtt = value?.rtt != null ? value.rtt : "--";
      // \n原始数据${JSON.stringify(value)} \n
      resultString += `第${key}次中断 断开时间：${linkBrokenSeconds}s 记录时间：${value?.timestampString} 是否触发强制在线 ${value?.triggeOnline} \n[当前网络情况] 网速:${downlink} MBps 网络:${effectiveType} 延迟:${rtt}  \n `;
    });
    return resultString;
  };

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  function startReportTimer() {
    if (resetTimer) clearTimeout(resetTimer);

    resetTimer = setTimeout(
      () => {
        reconnectCount = 0;
        windowStartTime = Date.now();

        reconnectMap.clear();
        pendingReconnectByKey.clear();

        startReportTimer();
      },
      // 60 * 1000
      60 * 60 * 1000,
    );
  }

  async function measureJsSpeed(url) {
    let result = {
      totalBytes: 0,
      durationSec: 0,
      speedMbps: 0,
      latencyMs: 0,
    };

    try {
      const startTime = performance.now();

      const res = await fetch(url, { cache: "no-store" });
      const reader = res.body.getReader();
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.length;
      }

      const endTime = performance.now();
      const durationSec = (endTime - startTime) / 1000;
      const speedBps = totalBytes / durationSec;
      const speedMbps = (speedBps * 8) / 1024 / 1024;

      result = {
        totalBytes,
        durationSec: durationSec,
        speedMbps: speedMbps.toFixed(2),
        latencyMs: res.headers.get("x-mskefu-latency") || 0,
      };
    } catch (e) {
      console.warn("测速失败", e);
    }

    return result;
  }

  const OriginalWebSocket = window.WebSocket;
  const WS_POOL = new Map();

  // 注入层自己判断是否允许自动回在线，避免直接访问 preload 作用域里的函数。
  function tryAutoSwitchOnlineInPage(currentStatus, reason) {
    if (currentStatus != globStatus) {
      const allLi = document.querySelectorAll(".status-box li");
      let key = false;
      allLi.forEach((li) => {
        if (li.innerText == globStatus) {
          li.click();
          key = true;
        }
      });
      return key;
    }
    // if (isAutoOnlineBlockedInPage) {
    //   console.info(`页面层自动上线已被拦截，跳过自动上线: ${reason}`)
    //   return false
    // }
    //
    // // 页面层和 preload 层保持同一规则：只要当前不是在线，就允许尝试恢复。
    // if (currentStatus === '在线') {
    //   return false
    // }
    //
    // const statusDom = document.querySelector('.status')
    // if (!statusDom) return false
    //
    // const onlineDom = statusDom.querySelector('.online')
    // if (!onlineDom) return false
    //
    // console.info(`页面层触发自动上线: ${reason}`)
    // onlineDom.click()
    // return true
  }

  window.addEventListener("message", function (event) {
    // console.info('event',event)

    if (event.data.type == "get-unreply-conversations") {
      fetch(`https://mms.pinduoduo.com/plateau/chat/unreply_conversations`, {
        credentials: "include",
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          size: 100,
          page: 1,
        }),
      })
        .then((r) => r.json())
        .then((res) => {
          console.log("res======>", res);
          if (res.success) {
            if (res?.result?.conversations.lnegth > 0) {
              const sendlist = [];
              res?.result?.conversations.forEach((item) => {
                sendlist.push({
                  messageId: item.user_info.messageId,
                  userId: item.user_info.uid,
                  username: item.user_info.nickname,
                  content: item.content,
                  timeout: item.last_unreply_time + 180,
                  type: "code",
                });
              });
              if (sendlist.length)
                window.context_bridge.send("get-customer-message-list", sendlist);
            }
          }
        });
    } else if (event.data.type == "shop-status-change") {
      globStatus = event.data.data;
    } else if (event.data.type === "close-socket") {
      WS_POOL.forEach((value) => {
        if (value.ws) {
          try {
            // value.manualClose = true
            value.ws.close();
          } catch {}
        }
      });
    } else if (event.data.type === "sync-shop-info") {
      shopinfo = event.data.data;
    } else if (event.data.type === "SYNC_AUTO_ONLINE_BLOCK") {
      isAutoOnlineBlockedInPage = !!event.data?.data?.blocked;
    } else if (event.data.type === "CHANGE_PDD_SHOW_ROBOT_REPLY") {
      window._pddShowRobotReply = event.data.data.isPDDShowRobotReply;
    } else if (event.data.type === "SET_AI_REPLY_INFO") {
      const { messageId } = event.data.data;

      // 🔥 获取当前计数，如果不存在则初始化
      const currentInfo = window._aiReplyCountMap.get(messageId) || {
        count: 0,
        ...event.data.data,
      };
      currentInfo.count++;
      window._aiReplyCountMap.set(messageId, currentInfo);
    } else if (event.data.type === "CLEAR_AI_REPLY_INFO") {
      const messageId = event?.data?.data?.messageId;

      if (messageId) {
        const currentInfo = window._aiReplyCountMap.get(messageId);
        if (currentInfo) {
          currentInfo.count -= 1;

          // 🔥 如果计数归零，删除该用户的记录
          if (currentInfo.count <= 0) {
            window._aiReplyCountMap.delete(messageId);
          } else {
            window._aiReplyCountMap.set(messageId, currentInfo);
          }
        }
      }
    } else if (event.data.type === "test-click-user") {
      fetch("https://api.pinduoduo.com/api/v1/user/get", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: event.data,
        }),
      });
    }
  });
  let timeout = null;
  const TIMEOUT = 60 * 1000; // 1分钟
  function resetTimerPull() {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      // 超过1分钟没收到消息
      window.postMessage({
        type: "pull-message",
      }); // 你的操作
      resetTimerPull();
    }, TIMEOUT);
  }

  resetTimerPull();
  window.WebSocket = function (url, protocols) {
    const key = url + "|" + (protocols || "");

    const updateWsState = (state) => {
      window.postMessage({ type: "WS_STATE_CHANGE", state, url }, "*");
    };

    const create = (reconnectId = null) => {
      let old = WS_POOL.get(key);
      const version = (old?.version || 0) + 1;

      // if (old?.ws) {
      //   try {
      //     old.manualClose = true
      //     old.ws.close()
      //   } catch {}
      // }

      const ws = new OriginalWebSocket(url, protocols);

      const state = {
        ws,
        url,
        version,
        reconnectTimer: null,
        // isReconnecting: false,
        // manualClose: false,
        reconnectId,
      };

      WS_POOL.set(key, state);
      bind(state, reconnectId);

      return ws;
    };

    const bind = (state) => {
      const { ws, version } = state;

      // ===== open =====
      ws.addEventListener("open", async function () {
        updateWsState(1);

        // state.isReconnecting = false
        // state.manualClose = false
        // 获取店铺在线状态
        const status = await getBackstageStatus(); // 获取店铺是否掉线
        tryAutoSwitchOnlineInPage(status, "ws-open-reconnect");
        setTimeout(() => {
          window.postMessage({
            type: "pull-message",
          });
        }, 10 * 1000);

        if (state.reconnectTimer) {
          clearTimeout(state.reconnectTimer);
          state.reconnectTimer = null;
        }

        window.context_bridge.send("wss-connect-open");

        startReportTimer();
        let id = state.reconnectId;
        if (!id) {
          id = pendingReconnectByKey.get(key) || null;
        }
        if (id && reconnectMap.has(id)) {
          const record = reconnectMap.get(id);
          record.linkBrokenTime = Date.now() - record.disconnectAt;
          pendingReconnectByKey.delete(key);
        }
        if (reconnectCount >= 5) {
          const resultString = reportedData();
          window.context_bridge.send("wss-connect-reported", resultString);

          reconnectCount = 0;
          reconnectMap.clear();
          pendingReconnectByKey.clear();
        }
      });

      // ===== close =====
      ws.addEventListener("close", function () {
        setTimeout(() => {
          window.postMessage({
            type: "pull-message",
          });
        }, 30 * 1000);
        // if (state.manualClose) return
        // if (state.isReconnecting) return

        // state.isReconnecting = true
        updateWsState(3);

        reconnectCount++;

        const reconnectId = reconnectCount;
        state.reconnectId = reconnectId;
        const disconnectAt = Date.now();

        reconnectMap.set(reconnectId, {
          disconnectAt,
          triggeOnline: "否", // 是否强制更新状态
          timestamp: disconnectAt,
          downlink: conn?.downlink ?? null,
          effectiveType: conn?.effectiveType ?? null,
          rtt: conn?.rtt ?? null,
        });
        pendingReconnectByKey.set(key, reconnectId);

        if (state.reconnectTimer) {
          clearTimeout(state.reconnectTimer);
        }

        state.reconnectTimer = setTimeout(async () => {
          const latest = WS_POOL.get(key);

          let speed = await measureJsSpeed(
            "https://mms-static.pinduoduo.com/mskefu/aladdin-chat-risk-captcha-modal/0.1.0/index.js",
          );

          const record = reconnectMap.get(reconnectId);
          if (record) {
            record.downlink = speed.speedMbps;
            record.effectiveType = conn?.effectiveType;
            record.rtt = speed.durationSec;
          }

          if (latest && latest.version === version) {
            const zt = await getBackstageStatus();
            if (tryAutoSwitchOnlineInPage(zt, "ws-health-check") && record) {
              record.triggeOnline = "是";
              const resultString = reportedData();

              window.context_bridge.send("wss-connect-reported", resultString);
              // fireMin++
              // if (fireMin >= 6) {
              // window.context_bridge.send('shop-in-socket-close-rebuild')
              // }
              window.postMessage({
                type: "pull-message",
              });
            }
            create(reconnectId);
          }
        }, 60 * 1000);
        const resultString = reportedData();
        window.context_bridge.send("wss-connect-reported", resultString);
      });

      // ===== message=====
      ws.addEventListener("message", function (event) {
        resetTimerPull();

        if (typeof event.data === "string") {
          if (event.data.includes("message") && event.data.includes("msg_id")) {
            try {
              const data = JSON.parse(event.data);

              if (
                data?.message?.to &&
                data?.message?.content &&
                data?.message?.manual_reply === 1
              ) {
                window.context_bridge.send("reply-customer-message", {
                  messageId: data.message.to.uid,
                  content: data.message.content,
                  shopMsgTotal: getMessageCont(),
                  sendTarget: "pdd9",
                });
              }
            } catch {}
          }
        } else {
          const utf8 = new Uint8Array(event.data);
          const decodedString = new TextDecoder().decode(utf8);

          if (
            decodedString.includes('bizType":"merchant-robot","subType":"replyState') &&
            window._pddShowRobotReply
          ) {
            const match = decodedString.match(/{.*}/);

            if (match?.length) {
              try {
                const jsonObject = JSON.parse(match[0]);

                setTimeout(() => {
                  window.context_bridge.send("reply-customer-message", {
                    messageId: jsonObject.body.uid,
                    content: "",
                    shopMsgTotal: getMessageCont(),
                    sendTarget: "pdd10",
                  });
                }, 1000);
              } catch {}
            }
          }
        }
      });
    };

    return create();
  };

  // ==================== 质检数据随机延迟发送 ====================
  let cachedQualityData = null;
  let qualityDataTimer = null;

  // 根据店铺ID生成0-60秒的随机延迟
  function getRandomDelay() {
    return Math.random() * 40 * 1000; // 0-40秒随机
  }

  // 延迟发送质检数据
  function sendQualityDataWithDelay(data) {
    // 缓存最新数据
    cachedQualityData = data;

    // 如果已有定时器，不重新设置（避免频繁重置）
    if (qualityDataTimer) {
      return;
    }

    const delay = getRandomDelay();

    qualityDataTimer = setTimeout(() => {
      if (cachedQualityData) {
        window.context_bridge.send("get-quality-testing", cachedQualityData);
        // 或者对于使用ipcRenderer的：
        // ipcRenderer.send('get-quality-testing', cachedQualityData)
      }
      cachedQualityData = null;
      qualityDataTimer = null;
    }, delay);
  }
  // ==================== 质检数据随机延迟发送结束 ====================
  // 🔥 使用 Map 记录每个用户正在处理的 AI 回复数量
  window._aiReplyCountMap = new Map();
  // 机器人回复是否要删除的标记（默认获取机器人信息）
  window._pddShowRobotReply = false;
  // console.info('===============================')
  // 🔥 监听来自 preload 脚本的 postMessage 消息

  function getMessageCont() {
    const shopMessageCont = document.querySelector(".conv-today");
    if (shopMessageCont) {
      if (shopMessageCont.textContent) {
        const match = shopMessageCont.textContent.match(/\((\d+)\)/);
        if (match) return match[1] || 0;
      }
    }
    return 0;
  }

  // 🔥 定期清理过期的 AI 回复标记（防止残留）
  setInterval(function () {
    if (window._aiReplyInfo && Date.now() - window._aiReplyInfo.timestamp > 10000) {
      window._aiReplyInfo = null;
    }
  }, 5000);
  function scheduleAiReplyInfoCleanup() {
    if (!window._aiReplyInfo) return;

    const expireIn = 10000;
    const delay = Math.max(0, expireIn - (Date.now() - window._aiReplyInfo.timestamp));

    setTimeout(() => {
      if (window._aiReplyInfo && Date.now() - window._aiReplyInfo.timestamp >= expireIn) {
        window._aiReplyInfo = null;
      }
    }, delay);
  }

  scheduleAiReplyInfoCleanup();
  const originFetch = window.fetch;

  window.fetch = async function (...args) {
    console.log("FETCH:", args[0]);

    return originFetch.apply(this, args);
  };
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  // 重写 open 方法
  XMLHttpRequest.prototype.open = function (method, url) {
    this._method = method; // 保存请求方法
    this._url = url; // 保存请求 URL
    // 调用原始的 open 方法
    originalXhrOpen.apply(this, arguments);
  };
  // 重写 send 方法
  XMLHttpRequest.prototype.send = function (body) {
    // 在请求发送之前，添加一个事件监听器
    this.addEventListener(
      "load",
      function () {
        // console.info( 'this._url=========',this._url)
        // if(this._method === 'post' &&  this._url.includes('/plateau/chat/unreply_conversations')  ){
        //   console.info('原始参数', body)
        //   // data.page_size = 100
        //   // data.page_num = 1
        //
        // }
        // 手动回复消息
        if (
          this._method === "post" &&
          this._url === "/plateau/chat/send_message" &&
          this.response.includes('result":"ok"')
        ) {
          const {
            data: { message },
          } = JSON.parse(body);
          console.info("body==================", JSON.parse(body));
          const messageId = message.to.uid;
          const content = message.content;

          // 🔥 检查是否是 AI 回复
          const aiReplyInfo = window._aiReplyCountMap.get(messageId);

          const isAiReply = aiReplyInfo && aiReplyInfo.count > 0;

          const baseMessage = {
            messageId,
            ...aiReplyInfo,

            isAiAutoReply: isAiReply && aiReplyInfo && aiReplyInfo?.isAiAutoReply,
            isBottomLineAutoReply: isAiReply && aiReplyInfo && aiReplyInfo?.isBottomLineAutoReply,
            isReminderReply: aiReplyInfo && aiReplyInfo?.isReminderReply,
            isAiInviteReply: aiReplyInfo && aiReplyInfo?.isAiInviteReply,
          };
          if (
            isAiReply &&
            aiReplyInfo &&
            (aiReplyInfo?.isAiInviteReply ||
              aiReplyInfo?.isReminderReply ||
              aiReplyInfo?.isAiAutoReply ||
              aiReplyInfo?.isBottomLineAutoReply)
          ) {
            baseMessage.shopMsgTotal = getMessageCont();
            window.context_bridge.send("get-customer-callback-result", baseMessage);
            window._aiReplyCountMap.delete(messageId);
          }
          if (delectDatalistById.has(messageId)) {
            // 人工正常dom 回复
            delectDatalistById.delete(messageId);
            baseMessage.sendTarget = "pdd3";
            baseMessage.shopMsgTotal = getMessageCont();

            baseMessage.content = content;
            window.context_bridge.send("reply-customer-message", baseMessage);
          }

          // 🔥 清理 AI 回复标记
          window.postMessage(
            {
              type: "CLEAR_AI_REPLY_INFO",
              data: { messageId },
            },
            "*",
          );
        }
        // 点击发送并恢复接待
        if (
          this._method === "POST" &&
          this._url ===
            "https://mms.pinduoduo.com/refraction/robot/mall/trusteeshipState/sendPendingConfirmDataNew" &&
          this.response.includes('success":true')
        ) {
          const { uid } = JSON.parse(body);

          window.context_bridge.send("reply-customer-message", {
            messageId: uid,
            content: "",
            shopMsgTotal: getMessageCont(),
            sendTarget: "pdd4",
          });
        }
        // 发送视频
        if (
          this._method === "POST" &&
          this._url === "https://mms.pinduoduo.com/plateau/message/library_file/send" &&
          this.response.includes('success":true')
        ) {
          const { uid, url } = JSON.parse(body);
          window.context_bridge.send("reply-customer-message", {
            messageId: uid,
            content: url,
            shopMsgTotal: getMessageCont(),
            sendTarget: "pdd5",
          });
        }
        // 获取客户发送的商品信息
        if (this._method === "POST" && this._url.includes("mallGoodsCard")) {
          const data = JSON.parse(body);
          window.context_bridge.send("reply-customer-message", {
            messageId: data.uid,
            shopMsgTotal: getMessageCont(),
            sendTarget: "pdd6",
          });
        }
        // 帮助消费者售后
        if (
          this._method === "POST" &&
          this._url === "https://mms.pinduoduo.com/plateau/message/ask_refund_apply/send" &&
          this.response.includes('success":true')
        ) {
          const { uid, url } = JSON.parse(body);
          window.context_bridge.send("reply-customer-message", {
            messageId: uid,
            shopMsgTotal: getMessageCont(),
            content: url,
            sendTarget: "pdd7",
          });
        }
        // 实时质检
        if (this._url.includes("getRealTimeReplyRate3Min/mallAndCs")) {
          const data = document.querySelectorAll(".detail-ctn")[0];

          if (data) {
            setTimeout(() => {
              const item = data.querySelectorAll(".item");
              const responseRateWithinThreeMin = item[0].children[1]?.textContent.replace(" ", "");
              const inquiryCount = item[1].children[1]?.textContent.replace(" ", "");
              sendQualityDataWithDelay({
                inquiryCount,
                responseRateWithinThreeMin,
                averageRate: "",
                dissatisfiedRate: "",
                recoverRate: "",
              });
            }, 2000);
          }
        }
        // 获取客户发送的商品信息
        if (this._method === "POST" && this._url === "https://apm.pinduoduo.com/api/pmm/defined") {
          // console.log(JSON.parse(body))
          // const { result } = JSON.parse(this.response)
        }
        // 关闭会话
        if (
          this._method === "post" &&
          this._url === "/plateau/chat/close_conversation" &&
          this.response.includes('success":true')
        ) {
          const {
            result: { uid },
          } = JSON.parse(this.response);
          window.context_bridge.send("reply-customer-message", {
            messageId: uid,
            shopMsgTotal: getMessageCont(),
            content: "",
            sendTarget: "pdd8",
          });
        }

        // 店铺状态修改
        if (
          this._method === "POST" &&
          this._url === "https://mms.pinduoduo.com/plateau/chat/set_csstatus" &&
          this.response.includes('success":true')
        ) {
          const { result } = JSON.parse(this.response);
          fetch("https://mms.pinduoduo.com/chats/userinfo/realtime?get_response=true")
            .then((res) => res.json())
            .then((res) => {
              const info = {
                logo: res.mall.logo,
                id: res.mall.mall_id.toString(),
                name: res.mall.mall_name,
                username: res.username,
              };
              let status = "";
              switch (result.status) {
                case 1:
                  status = "在线";
                  break;
                case 0:
                  status = "忙碌";
                  break;
                case 3:
                  status = "离线";
                  break;
              }
              window.context_bridge.send("log", {
                type: "info",
                message: "拼多多店铺：" + res.mall.mall_name + " 状态为：" + status,
              });
              window.context_bridge.send("shop-status-change", {
                status,
              });
            });
        }
      },
      { once: true },
    );
    // 调用原始的 send 方法
    originalXhrSend.apply(this, arguments);
  };
};

ipcRenderer.on("quality-socket-message", (_, args) => {
  console.log("ws质检传递数据", args);
});

// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.getRegistrations().then((regs) => {
//     for (const reg of regs) {
//       console.log('卸载serverWorker unregistering', reg.scope)
//       reg.unregister()
//       //   发送重载  serverworker被卸载  重载
//       ipcRenderer.send('reload-shop')
//     }
//   })
// }
//  获取店铺消息数量
function getMessageCont() {
  const shopMessageCont = document.querySelector(".conv-today");
  if (shopMessageCont) {
    if (shopMessageCont.textContent) {
      const match = shopMessageCont.textContent.match(/\((\d+)\)/);
      if (match) return match[1] || 0;
    }
  }
  return 0;
}

// 监听岗前须知弹窗并自动参加考试
let examObserver = null;

// 全局答题状态管理（防止多店铺干扰）
let globalAnsweringState = {
  isAnswering: false,
  currentExamId: null,
  pendingClicks: [], // 待执行的点击操作
};

// 自动答题函数
async function autoAnswerQuestion() {
  const examQuestion = document.querySelector(".exam-question");
  if (!examQuestion) return false;

  // 生成当前考试的唯一ID（基于题目内容）
  const questionTitleForId = examQuestion.querySelector(".question-content .question-title");
  const currentExamId = questionTitleForId ? questionTitleForId.textContent.trim() : "unknown";

  // 如果正在答另一道题，则跳过
  if (globalAnsweringState.isAnswering && globalAnsweringState.currentExamId !== currentExamId) {
    return false;
  }

  // 检查是否已经有答案（单选或多选）
  const selectedRadio = examQuestion.querySelector(".el-radio-group .el-radio.is-checked");
  const selectedCheckboxes = examQuestion.querySelectorAll(
    ".el-checkbox-group .el-checkbox.is-checked",
  );
  if (selectedRadio || selectedCheckboxes.length > 0) {
    return true;
  }

  // 判断是多选还是单选
  const isMultiSelect = examQuestion.querySelector(".el-checkbox-group") !== null;

  // 获取题目内容 - 更精确的选择器
  const questionContent = examQuestion.querySelector(".question-content");
  if (!questionContent) return false;

  const questionTitleEl = questionContent.querySelector(".question-title");
  if (!questionTitleEl) return false;

  const questionText = questionTitleEl.textContent.trim();

  // 等待500毫秒让选项加载完成
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 获取选项
  const options = examQuestion.querySelectorAll(".option-item");
  if (options.length === 0) {
    return false;
  }

  // 答案数据库（使用数组解决重复key问题）
  // 每个元素包含 question（问题关键词）和 answers（正确答案数组）
  const pddExamData = [
    {
      question: "商家行为是否违反了平台运营规则",
      answers: ["存在违规情况", "会判定违规。"],
    },
    {
      question: "哪种做法是违反平台运营规范",
      answers: [
        "索要消费者微信或支付宝账号打款",
        "索要消费者收款二维码打款",
        "索要消费者电话联系打款",
        "引导买家扫描微信收款码转钱",
        "让买家联系电话打款",
      ],
    },
    {
      question: "做法或回复是符合平台运营规范",
      answers: [
        "使用“发视频”功能给买家发送短视频。",
        "“您点击右下角‘+’号，里面有个‘拍视频’，从那拍个视频给我看看。”",
        "使用“语音通话”功能给买家发送语音请求。",
        "“您点击右下角‘+’号，里面有个‘语音通话’，从那可以语音联系。”",
      ],
    },
    {
      question: "哪些回复是违反平台运营规范",
      answers: [
        "“麻烦您提供下真实的手机号码，便于后续的安装联系哦。”",
        "“您可以加下我微信吗，我到时候微信告知您具体上门时间，我的微信号是xxxxxx。”",
        "“如果约定的时间没有上门安装的话，您可以拨打下我的电话151xxxxxxxx。”",
      ],
    },
    {
      question: "哪些行为，是存在服务态度问题",
      answers: [
        "对消费者进行人身攻击，使用不文明用语辱骂",
        "阴阳怪气地嘲讽消费者，嘲讽年龄、收入及地域等",
        "态度蛮横、不耐烦，用命令语气回复消费者",
        "消费者先开始骂人，于是辱骂、威胁或者骚扰消费者",
      ],
    },
    {
      question: "哪些属于不好的服务行为",
      answers: [
        "以重复语句敷衍回复，答非所问，无有效对话内容",
        "编造各种无根据、虚假理由搪塞消费者",
        "工作时间内（8:00-23:00）超过30分钟不回复",
      ],
    },
    {
      question: "哪些服务问题可能会被消费者投诉",
      answers: [
        "消费者询问到货时间，回复消费者，你去问快递公司啊，我又不是送快递的",
        "消费者对商品产生一些质量相关的疑问时，回复消费者，这个东西就是这样的，这个价格就就是这样的货",
      ],
    },
    {
      question: "哪些措施",
      answers: ["不要恶意揣测消费者，尝试使用举报功能", "与消费者友好沟通，化解消费者的误会"],
    },
    {
      question: "消费者突然申请仅退款，以下哪些处理方式是合理的",
      answers: [
        "联系消费者并了解原因，若消费者明确表示不想要，尝试联系快递进行拦截，并及时告知消费者拦截进度",
      ],
    },
    {
      question: "商家承诺服务未履约",
      answers: [
        "商品详情页、快递宣传资料、聊天等描述中出现承诺赠送赠品，消费者反馈未收到时，商家不处理或拖延处理",
        "商品详情页、快递宣传资料、聊天等描述中出现承诺保修等服务，消费者索取服务时，商家不处理或拖延处理",
        "商品详情页、快递宣传资料、聊天等描述中出现承诺评价有礼，消费者索要时，商家不处理或拖延处理",
        "消费者反馈商品存在问题，商家聊天中承诺补寄，但实际未提供补发单号或提供虚假单号",
      ],
    },
    {
      question: "商家违规诱导行为",
      answers: [
        "消费者遇到商品质量问题，要求消费者修改为无理由发起售后，才进行处理",
        "要求消费者确认收货并好评后，才提供赠品、服务等福利",
      ],
    },
    {
      question: "处理方式是合理",
      answers: ["联系消费者并了解原因，尝试联系快递进行拦截"],
    },
    {
      question: "处理方式是不合理",
      answers: ["不联系消费者，等收到退货后再决定退不退"],
    },
    {
      question: "严重敷衍行为",
      answers: [
        "机械重复回复，例如，无视消费者诉求，连续重复相同的内容多次",
        "答非所问：例如，消费者询问衣柜怎么安装，商家回复，嗯嗯，我们的质量是不错的呢",
        "回复慢，消极应对：例如，超过30分钟不回复或者仅单条回复“在的”“好的”“我看一下”等没有下文的敷衍信息",
      ],
    },
    {
      question: "哪些语句是存在服务态度问题",
      answers: [
        "没见过这么没素质的人",
        "别耽误我时间，我还有好多人要接待，自己去搞",
        "卖了几万件，从来没见过有人这样反馈的，只有你自己这样",
        "这你都看不懂？你眼瞎吗？",
      ],
    },
    {
      question: "平台将严肃处理的",
      answers: [
        "线下给消费者寄送不良包裹，包括但不限于冥币、寿衣等引起消费者不适类物品",
        "通过电话、短信、微信等渠道，对消费者进行轰炸、骚扰、辱骂、人身攻击等行为",
        "获取消费者手机号、地址等个人隐私信息，进行曝光、售卖等非法行为",
        "诱导消费者线下交易、规避平台各类规则，以欺诈消费者、获取非法利益",
      ],
    },
  ];

  // 先匹配题目，再匹配该题目的答案
  let matchedOptions = [];
  let matchedAnswers = []; // 记录匹配到的答案
  let matchedQuestion = null; // 记录匹配到的题目

  // 1. 先找到匹配的题目
  for (const item of pddExamData) {
    if (questionText.includes(item.question)) {
      matchedQuestion = item;
      break;
    }
  }

  // 2. 如果找到题目，再用该题目的答案去匹配选项
  if (matchedQuestion) {
    for (const answerText of matchedQuestion.answers) {
      for (const option of options) {
        const optionText = option.textContent.trim();
        // 去掉选项的A、B、C等前缀后再比较
        const cleanOptionText = optionText.replace(/^[A-Z][、.]/, "").trim();
        // 全等于匹配
        if (cleanOptionText === answerText) {
          // 避免重复添加
          if (!matchedOptions.includes(option)) {
            matchedOptions.push(option);
            matchedAnswers.push(answerText);
          }
        }
      }
    }
  } else {
    console.log("未匹配到任何题目！");
  }

  // 点击底部按钮 - 循环点击直到进入下一题
  const clickButton = () => {
    const buttons = examQuestion.querySelectorAll(".question-footer .btn-item");
    for (const btn of buttons) {
      const style = window.getComputedStyle(btn);
      if (style.display !== "none" && !btn.classList.contains("disabled")) {
        btn.click();
        return true;
      }
    }
    return false;
  };

  // 找到对应选项并点击
  if (isMultiSelect) {
    // 多选题：需要逐个点击，使用 Promise 确保顺序执行
    const clickMultipleOptions = async () => {
      for (const option of matchedOptions) {
        // 尝试点击 input 或者 option 本身
        const input = option.querySelector("input");
        const clickTarget = input || option;

        // 点击选项
        clickTarget.click();

        // 验证是否被选中
        const isChecked = option.classList.contains("is-checked") || (input && input.checked);
        // 等待200ms再点击下一个，给DOM更新时间
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // 所有选项都点完后，等待300ms再点击确定按钮
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 点击确定前，再次验证并补选漏选的答案
      for (const option of matchedOptions) {
        const input = option.querySelector("input");
        const isChecked = option.classList.contains("is-checked") || (input && input.checked);
        if (!isChecked) {
          if (input) {
            // 强制设置checked
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked").set.call(
              input,
              true,
            );
            option.classList.add("is-checked");
          } else {
            option.click();
          }
        }
      }

      // 点击确定按钮
      if (clickButton()) {
        // 再次尝试点击下一题
        setTimeout(clickButton, 500);
      }
    };

    // 启动异步点击流程
    clickMultipleOptions().catch((err) => {
      console.error("多选题点击出错:", err);
    });
  } else {
    // 单选题：直接点击选项，然后立即点击确定
    if (matchedOptions.length > 0) {
      const option = matchedOptions[0];
      const input = option.querySelector("input");
      const clickTarget = input || option;

      clickTarget.click();

      // 验证是否被选中
      const isChecked = option.classList.contains("is-checked") || (input && input.checked);
    } else {
      console.log("警告：未匹配到任何答案！");
    }
    // 单选题：选择后等待500ms再点击确定
    setTimeout(() => {
      if (clickButton()) {
        setTimeout(clickButton, 500); // 再次尝试点击下一题
      }
    }, 500);
  }

  return true;
}

// 启动自动答题监听器（使用 MutationObserver）
function startExamObserver() {
  let isAnswering = false; // 防止重复触发
  let lastQuestionText = ""; // 记录上一题题目

  // 监听题目变化
  const questionObserver = new MutationObserver((mutationsList) => {
    const examQuestion = document.querySelector(".exam-question");
    if (!examQuestion) return;

    // 检查考试是否完成（display: none）
    if (examQuestion.style.display === "none") {
      // 查找"返回商家客服平台"按钮
      const allButtons = document.querySelectorAll(".btn-item");
      for (const btn of allButtons) {
        if (btn.textContent.includes("返回商家客服平台")) {
          const style = window.getComputedStyle(btn);
          if (style.display !== "none") {
            questionObserver.disconnect();
            btn.click();
            return;
          }
        }
      }
      return;
    }

    // 获取当前题目
    const questionTitleEl = examQuestion.querySelector(".question-content .question-title");
    if (!questionTitleEl) return;

    const currentQuestionText = questionTitleEl.textContent.trim();

    // 如果题目没变化，跳过
    if (currentQuestionText === lastQuestionText) {
      return;
    }

    // 如果正在答题，跳过
    if (isAnswering) return;

    // 检测到新题目
    isAnswering = true;
    lastQuestionText = currentQuestionText;

    // 等待题目和选项加载完成后再答题
    setTimeout(async () => {
      await autoAnswerQuestion();
      // 答题完成后，重置标记，等待下一题
      isAnswering = false;
    }, 1000);
  });

  // 监听 .question-title 的变化
  const questionTitleEl = document.querySelector(".question-title");
  if (questionTitleEl) {
    questionObserver.observe(questionTitleEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  // 同时监听整个 exam-question 的 style 变化（用于检测考试完成）
  const examQuestion = document.querySelector(".exam-question");
  if (examQuestion) {
    questionObserver.observe(examQuestion, {
      attributes: true,
      attributeFilter: ["style"],
    });
  }

  return questionObserver;
}

function initExamPageObserver() {
  // 监听考试页面，点击"我已了解，开始考试"
  examObserver = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.nodeType === Node.ELEMENT_NODE) {
          const examPage = addedNode.classList?.contains("exam-page")
            ? addedNode
            : addedNode.querySelector?.(".exam-page");

          if (examPage) {
            setTimeout(() => {
              const startBtn = examPage.querySelector(".btn-item");
              if (startBtn && startBtn.textContent.includes("我已了解")) {
                startBtn.click();
                // 启动自动答题监听器
                startExamObserver();
              }
            }, 2000);
          }
        }
      }
    }
  });

  examObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function initExamPopupObserver() {
  examObserver = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.nodeType === Node.ELEMENT_NODE) {
          // 检查是否是弹窗本身或其子元素
          const popup = addedNode.classList?.contains("new-cs-exam-content")
            ? addedNode
            : addedNode.querySelector?.(".new-cs-exam-content");

          if (popup) {
            // 延迟一下确保元素完全渲染
            setTimeout(() => {
              const examBtn = popup.querySelector(".btn-item");
              if (examBtn && examBtn.textContent === "参加考试") {
                examBtn.click();
                // 停止当前监听器
                examObserver.disconnect();

                // 启动考试页面监听器
                initExamPageObserver();
              }
            }, 5000);
          }
        }
      }
    }
  });

  examObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
// // 页面加载后启动观察者
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initExamPopupObserver);
} else {
  initExamPopupObserver();
}
//   禁用快捷键
window.addEventListener(
  "keydown",
  (e) => {
    if (e.key == "Escape") {
      e.stopPropagation();
    }
  },
  true,
);

let audioCtx = null;
let oscillator = null;
let gainNode = null;

//   收到店铺心跳
ipcRenderer.on("heartbeat", () => {
  ipcRenderer.send("web-heartbeat-ping"); // 返回店铺心跳
});
//  监听页面跳转
window.addEventListener("beforeunload", function (e) {
  if (!loginInfo.password || loginInfo.password.length < 8) {
    // 不是密码登录直接 提示掉店

    ipcRenderer.send("account-login-expired");
  }
});
//  发送图片给用户
async function sendImageToUser(base64, userId) {
  const res = await fetch(`https://mms.pinduoduo.com/plateau/file/pre_upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      chat_type_id: 1,
      file_usage: 1,
    }),
  }).then((r) => r.json());

  if (res?.success) {
    const upload_sign = res?.result?.upload_signature;
    const imgUrlRawData = await fetch(`https://file.pinduoduo.com/v2/store_image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        image: base64, //base 64
        upload_sign, // 发送秘钥
      }),
    }).then((r) => r.json());
    window.postMessage({
      type: "send-message",
      data: {
        cmd: "send_message",
        // anti_content: antigain(),
        request_id: 1776238943202,
        message: {
          to: {
            role: "user",
            uid: userId,
          },
          from: {
            role: "mall_cs",
          },
          ts: Math.floor(Date.now() / 1000),
          content: imgUrlRawData.url, // 必填  图片地址
          msg_id: null,
          type: 1,
          is_aut: 0,
          manual_reply: 1,
          status: "read",
          is_read: 1,
          // hash: '2888a46f63380fa60333609dfd7f83714a14ef90f0824acb838c43d57761f055',
          size: {
            height: imgUrlRawData.height,
            width: imgUrlRawData.width,
            image_size: Math.floor((base64.length * 3) / 4 / 1024),
          },
          info: {
            thumb_data: base64, // base64 为图片
          },
        },
        // random: '5e81aa965288b1c640b3a1379c2acd6b'
      },
    });
  }
}

// AI转人工星标
safeIpcOn("ai-transfer-human-mark", (_, args) => {
  window.postMessage(
    {
      type: "pdd-mark-chat",
      data: {
        markType: 1,
        logId: args.userId,
      },
    },
    "*",
  );
});

// AI转人工转接子账号
safeIpcOn("ai-transfer-human-sub", async (_, args) => {
  const csid = await getCsidByName(args.subAccount);
  if (!csid) {
    return;
  }

  window.postMessage({
    type: "move-to-chat",
    data: {
      cmd: "move_conversation",
      // anti_content: antigain(),
      request_id: Date.now(),
      conversation: {
        csid,
        uid: args.userId,
        need_wx: false,
        remark: "无原因直接转移",
      },
      // random: '5e81aa965288b1c640b3a1379c2acd6b'
    },
  });
});

// 根据子账号获取csid
const getCsidByName = async (name) => {
  const res = await fetch(`https://mms.pinduoduo.com/latitude/assign/getAssignCsList`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      wechatCheck: true,
    }),
  }).then((r) => r.json());

  const csList = res?.result?.csList;
  if (!res?.success || !csList || !name) {
    return null;
  }

  const targetName = String(name).trim();
  const matchedEntry = Object.entries(csList).find(([csid, info]) => {
    if (!info || typeof info !== "object") {
      return false;
    }

    return [csid, info.nickname, info.username]
      .filter(Boolean)
      .some((value) => String(value).trim() === targetName);
  });

  return matchedEntry ? matchedEntry[0] : null;
};

// 模拟鼠标操作
function triggerRealMouse(el) {
  if (!el) return;

  const rect = el.getBoundingClientRect();

  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  const mouseOptions = {
    view: window,
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    button: 0,
    buttons: 1,
  };

  const pointerOptions = {
    ...mouseOptions,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
  };

  // 鼠标移入
  el.dispatchEvent(new PointerEvent("pointerover", pointerOptions));
  el.dispatchEvent(new PointerEvent("pointerenter", pointerOptions));

  el.dispatchEvent(new MouseEvent("mouseover", mouseOptions));
  el.dispatchEvent(new MouseEvent("mouseenter", mouseOptions));

  // 按下
  el.dispatchEvent(new PointerEvent("pointerdown", pointerOptions));
  el.dispatchEvent(new MouseEvent("mousedown", mouseOptions));

  // 抬起
  el.dispatchEvent(new PointerEvent("pointerup", pointerOptions));
  el.dispatchEvent(new MouseEvent("mouseup", mouseOptions));

  // 点击
  el.dispatchEvent(new MouseEvent("click", mouseOptions));
}
