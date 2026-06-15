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

// 安全注册 IPC 监听器（自动移除旧监听，防止刷新时重复注册）
function safeIpcOn(channel, handler) {
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, handler);
}
// import { ipcRenderer, contextBridge, webFrame } from 'electron'
const mainUrl = "https://im.kwaixiaodian.com/";

let weekTime = 30 * 24 * 60 * 60 * 1000; // 三十天

let logoInfo = {
  username: "",
  password: "",
};
// const mapdata = new Map()
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

// 统一上报抖店 preload 的全局错误，便于在主进程日志里按店铺定位。
function reportGlobalPreloadError(type, errorLike) {
  ipcRenderer.send("write-preload-error-log", {
    shopName: info.shopName || "未知店铺",
    platform: "doudian",
    errorMessage: `${type}: ${getReadableErrorMessage(errorLike)}`,
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
  });
}
const blockKeywords = [
  "发货验收提醒",
  "催付卡片",
  "寄回商品提醒",
  "寄回商品二次提醒",
  "用户已经评价",
  "快手官方保障",
  "评价邀请",
  "订单卡片",
  "核单卡片",
  "猜你想问",
  "猜您想问",
  "会话关闭",
  "核对订单提醒",
];

class customerMsg {
  constructor(username, content, timeString) {
    this.messageId = username; // todo 后续改成userid
    this.username = username;
    this.content = content;
    this.timeout = this.parseChineseTimeToTimestamp(timeString);
    this.source = "dom";
  }
  parseChineseTimeToTimestamp(str) {
    let hours = 0,
      minutes = 0,
      seconds = 0;
    let isTimeout = false;

    // 判断是否已超时
    if (/已?超时/.test(str) && !/后超时/.test(str)) {
      isTimeout = true;
    }
    // 提取时间
    const hMatch = str.match(/(\d+)\s*小时/);
    if (hMatch) hours = parseInt(hMatch[1], 10);

    const mMatch = str.match(/(\d+)\s*分钟|(\d+)\s*分/);
    if (mMatch) minutes = parseInt(mMatch[1] || mMatch[2], 10);

    const sMatch = str.match(/(\d+)\s*秒/);
    if (sMatch) seconds = parseInt(sMatch[1], 10);

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    // 秒级时间戳（基于当前时间）
    const now = Math.floor(Date.now() / 1000);
    const timestamp = isTimeout ? now : now + totalSeconds;

    return timestamp;
  }
}
/**
 *  结构 key ：id
 *  {
 *    id:userId   //  用户id
 *    orderId,   // 订单编号
 *    orderStatus,  // 订单状态
 *    orderInfo,  // 订单详情
 *    goodId,   // 商品id
 *    goodName,  // 商品名称
 *    goodInfo,  // 商品详情
 *    sku      //  sku
 *    ordersku  // 订单 sku
 *    timerout,  //  超时时间  超时时间为 24小时  更具情况调整
 *  }
 *
 */
class UserByOrderDB {
  constructor() {
    this.db = null;
    this.DB_NAME = "userByOrderInfo";
    this.STORE_NAME = "value";
    this.VERSION = 1;
  }
  // 初始化 DB
  async init() {
    if (this.db) {
      await this.clearExpired(this.db);
      return this.db;
    }

    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await this.clearExpired(this.db);
    return this.db;
  }
  async clearExpired(db) {
    // const temptimer = Date.now() // 或你外部传入的 1778337563825
    const temptimer = 1778338667907;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readwrite");
      const store = tx.objectStore(this.STORE_NAME);
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        console.log("cursor", e);
        if (!cursor) return resolve();

        const value = cursor.value;

        // 关键：按你的字段判断
        if (value?.time && value.time < temptimer) {
          cursor.delete();
        }
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
  }

  // 新增 / 修改
  async save(data) {
    if (!data?.id) {
      throw new Error("IDB: id 不能为空");
    }
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readwrite");
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.put(data);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
  // 更具id 查询
  async get(id) {
    if (!id) return null;
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readonly");
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  // 查询所有
  async getAll() {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readonly");
      const store = tx.objectStore(this.STORE_NAME);

      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
  // 删除指定 id
  async delete(id) {
    if (!id) return null;
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readwrite");
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

let shoperMessage = null; // 商家信息
let customerMessage = null; // 用户信息

// let loginIndex = 0
let timeIndex = 0;
let cookie = null;
let shopBotStatus = 0; // 店铺 bot 机器人状态
let pausedTime = 0; // 记录暂停时已经过去的时间
let startTime = 0; // 记录定时器开始时间
let _key = null; //  页面隐藏状态，true=隐藏，false=可见
const HEARTBEAT_INTERVAL = 1000 * 60 * 60 * Number((Math.random() * 1 + 4).toFixed(2));
let currentInterval = HEARTBEAT_INTERVAL; // 临时变量：当前使用的间隔时间
let hearTimer = null;
let info = null;
let editCustomrMessage;
const clickEvent = new MouseEvent("click", {
  bubbles: true, // 允许事件冒泡
  cancelable: true, // 允许事件被取消
  view: window, // 关联的 window 对象
});
// let idlist = new Set()
let myDB = null;

let addMessageList = []; // 获取信息
// https://s.kwaixiaodian.com/gateway/business/cs/order/lis
let isload = false;
let inviteMap = new Map();

let unReplyMessageStopped = false;
let loginIndex = 0; // 控制最大尝试次数
const MAX_LOGIN_INDEX = 60; // 30秒 / 500ms

contextBridge.exposeInMainWorld("context_bridge", {
  postMessage: (channel, data) => ipcRenderer.postMessage(channel, data),
  send: (channel, data) => ipcRenderer.send(channel, data),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
});

safeIpcOn("kc-quality-result", (event, data) => {
  if (data.result == 1) {
    const qualityData = data.data.stat[0];
    // console.log('kcQuality》》》》》', qualityData)
    const averageRate = qualityData.avgReplySeconds; // 均响
    // const goodEvaluateRate = qualityData.goodEvaluateRate // 满意
    const dissatisfiedRate = qualityData.imBadEvaluateRate; // 不满意
    const responseRateWithinThreeMin = qualityData.timely3RepliedPercentFrom8; // 3分钟回复率
    const inquiryCount =
      qualityData.createSessionTimes != null ? qualityData.createSessionTimes : 0; // 咨询次数
    // const recoverRate = qualityData.consultPayInfo.value // 转换   0/4
    ipcRenderer.send("get-quality-testing", {
      responseRateWithinThreeMin,
      averageRate,
      // goodEvaluateRate,
      dissatisfiedRate,
      inquiryCount,
    });
    // const
  }
});
// ============ API 健康监控 ============

// 监听页面是否加载成功
window.addEventListener("load", () => {
  console.log("页面加载成功", window.location.href);
  if (window.location.href.includes("https://login.kwaixiaodian.com/")) {
    ipcRenderer.send("account-login-expired");
  }
  ipcRenderer.send("get-shop-page-loaded");
  const mainDom = document.querySelector("main");
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
  // setTimeout(() => {
  //   const testdom = document.querySelector('.avatarHover')
  //   // getuserOrderList
  //   if (testdom) {
  //     console.log('testdom', testdom)
  //     testdom.addEventListener('click', async () => {
  //       const num = Math.floor(Math.random() * 100)
  //       window.postMessage({
  //         type: 'send-message',
  //         data: {
  //           text: num + '',
  //           targetType: 0,
  //           targetId: 1410644614,
  //           extra: {
  //             device: 2,
  //             sellerId: null, // info.kf,
  //             from: null,
  //             senderId: null, //info.kf,
  //             senderUserId: null, // info.kf,
  //             senderNickName: null,
  //             role: 3,
  //             realFromRole: 3,
  //             sourcePage: 0
  //           }
  //         }
  //       })
  //     })
  //   }
  // }, 5000)
  // // console.log('mainDom===========', mainDom)
  const loadObserver = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      // console.log('mutation===========', mutation)
      if (
        mutation.type === "childList" &&
        mutation.target.className == "SessionListGroup" &&
        mutation.addedNodes[0]?.className == "SessionListGroup-FolderSessions"
      ) {
        isload = true;
        loadObserver.disconnect();
      }
    }
  });
  if (mainDom)
    loadObserver.observe(mainDom, {
      subtree: true,
      childList: true,
    });

  setTimeout(() => {
    ipcRenderer.send("request-shop-bot-status"); // 页面成功
  }, 1000);

  function checkLoginAndAutoFill() {
    if (unReplyMessageStopped) return;

    loginIndex++;
    if (loginIndex > MAX_LOGIN_INDEX) {
      console.warn("登录尝试次数过多，停止轮询");
      return;
    }

    try {
      const goLogin = document.querySelector(".goLogin > .container > .btn > a");
      if (goLogin) {
        // 点击进入登录页面
        goLogin.click();
        scheduleNext();
        return;
      }

      const loginCont = document.querySelector(".leftContainer___hCfkc");
      if (!loginCont) {
        // 登录页面尚未加载，继续轮询
        scheduleNext();
        return;
      }

      const contentWrap = document.querySelector(".contentWrap___KJNdr");
      const tabWrap = contentWrap.querySelector(".tabWrap___cTnFS");

      let activeTab;
      if (tabWrap.firstChild.className.includes("activeLeft___NTISE")) {
        activeTab = tabWrap.lastChild;
      } else if (tabWrap.lastChild.className.includes("activeRight___KmLB7")) {
        activeTab = tabWrap.lastChild;
      } else {
        console.warn("无法识别登录选项卡");
        scheduleNext();
        return;
      }

      activeTab.click(); // 切换到员工登录内容块
      const loginWrapper = contentWrap.querySelector(".loginWrapper___HPU9M");

      setTimeout(() => {
        const employeeLoginType = loginWrapper.querySelector(".justify-between");
        if (employeeLoginType?.firstChild?.firstChild) {
          employeeLoginType.firstChild.firstChild.click(); // 点击账号密码登录
        }

        setTimeout(() => {
          const longinPasswordContent = loginWrapper.querySelector(".password-form-wrapper");

          if (!longinPasswordContent) {
            scheduleNext();
            return;
          }

          const loginAccount = longinPasswordContent.firstChild.querySelector("input");
          const loginPassword = longinPasswordContent.children[1].querySelector("input");

          const urlParams = new URLSearchParams(window.location.search);
          const redirectUrl = decodeURIComponent(urlParams.get("redirect_url") || "");
          const redirectParams = new URLSearchParams(redirectUrl.split("?")[1] || "");

          const username = redirectParams.get("username") || "";
          const password = redirectParams.get("password") || "";
          const shopName = redirectParams.get("shopName") || "";

          // 填写账号密码
          loginAccount.value = username;
          loginPassword.value = password;

          loginAccount.dispatchEvent(new Event("input", { bubbles: true }));
          loginPassword.dispatchEvent(new Event("input", { bubbles: true }));

          // 保存到 logoInfo
          loginAccount.addEventListener("input", () => {
            logoInfo.username = loginAccount.value;
          });
          loginPassword.addEventListener("input", () => {
            logoInfo.password = loginPassword.value;
          });

          const loginBtn = longinPasswordContent.querySelector(".svelte-am7f5d");
          if (loginBtn) {
            loginBtn.addEventListener("click", () => {
              ipcRenderer.send("loginInfo", logoInfo);

              setTimeout(() => {
                const subList = document.querySelector(".accountSubListWrap___DCHed");
                if (subList) {
                  const itemWrap = subList.querySelector(".accountItemWrap___p8tg6");
                  if (itemWrap) {
                    itemWrap.childNodes.forEach((item) => {
                      const shopTitle = item.querySelector(".kshopName___eNPZr");
                      if (shopTitle && shopTitle.textContent === shopName) {
                        item.click();
                        unReplyMessageStopped = true;
                        return;
                      }
                    });
                  }
                }
              }, 500);
            });

            loginBtn.click();
            unReplyMessageStopped = true; // 登录点击后停止轮询
          }
        }, 500);
      }, 500);
    } catch (e) {
      console.error("checkLoginAndAutoFill error:", e);
    }

    // 安全继续下一轮
    scheduleNext();
  }
  // function scheduleNext() {
  //   if (!unReplyMessageStopped) {
  //     setTimeout(checkLoginAndAutoFill, 500)
  //   }
  // }
  // 启动轮询
  checkLoginAndAutoFill();
  function scheduleNext() {
    if (!unReplyMessageStopped) {
      setTimeout(checkLoginAndAutoFill, 500);
    }
  }

  const loginSuess = setInterval(() => {
    // 超过30秒监听就清除 防止死循环
    timeIndex++;
    if (timeIndex < 60) {
      const content = document.querySelector("#main_root"); // 成功登录
      if (content) {
        // injectCspMeta()
        clearInterval(loginSuess); // 清除定时器
        // getUnReplyMessage() // 获取未回复消息列表
        shopInfo(); // 启用获取商家信息
        pathUrl(); // 启用接口补偿
        getStatus(); // 获取店铺状态
      }
    } else {
      clearInterval(loginSuess);
    }
  }, 1000);

  const getStatus = (() => {
    let retryCount = 0;
    const maxRetries = 5;

    return function tryGetStatus() {
      setTimeout(() => {
        const changeStatusDom = document.querySelector(".statusTag");
        // console.log('changeStatusDom', changeStatusDom);

        if (changeStatusDom) {
          startListenShopStatus(changeStatusDom); // 监听店铺在线状态
        } else {
          retryCount++;
          if (retryCount < maxRetries) {
            tryGetStatus();
          } else {
            console.warn("获取 subStatus 元素失败，已重试 5 次，放弃。");
          }
        }
      }, 1000);
    };
  })();

  // myDB = new DB()
  // if (myDB) {
  //   myDB.deleteExpired(2) //删除两天前 的缓存数据
  // }
});

// 改进错误处理
window.addEventListener("error", (event) => {
  console.error("全局错误", event);
  reportGlobalPreloadError("全局错误", event.error || event);
});
window.addEventListener("unhandledrejection", (event) => {
  console.error("未捕获的promise错误", event);
  reportGlobalPreloadError("未捕获的promise错误", event.reason || event);
});
safeIpcOn("get-shop-cookie", (_, cookieStr) => {
  const cookies = JSON.parse(cookieStr);

  cookie = cookieArrayToHeaderString(cookies); // 获取处理cookie
});

// 统一读取快手数值对象里的 value，缺失时返回空字符串，避免上传前出现 null。
function getKsValue(valueInfo) {
  return valueInfo?.value ?? "";
}

// 按一级维度标题取卡片，后续统一从 dimInfoCardVOList 中抽取一级分和二级指标。
function getKsDimCard(dimInfoCardVOList, title) {
  return dimInfoCardVOList.find((item) => item?.title === title);
}

// 将某个一级维度下的 indexCardVOList 整理成 “二级名字 + 得分 + 店铺表现” 结构。
function buildKsMetricMap(indexCardVOList) {
  const metricMap = {};
  const metricList = Array.isArray(indexCardVOList) ? indexCardVOList : [];

  metricList.forEach((item) => {
    // 二级指标名称取 portalIndexTitleVO.text。
    const metricTitle = item?.portalIndexTitleVO?.text || "";
    if (!metricTitle) {
      return;
    }

    // 得分取 portalIndexScoreVO.value.value，店铺表现取 portalIndexValueVO.value.value。
    metricMap[metricTitle] = {
      score: getKsValue(item?.portalIndexScoreVO?.value),
      shopValue: getKsValue(item?.portalIndexValueVO?.value),
    };
  });

  return metricMap;
}

// 将快手体验分接口返回整理成当前可兼容上传的一层分数结构，并附带二级指标明细。
function buildKsExperienceScoreData(data) {
  // 一级和二级都在 dimInfoCardVOList 中，后续上传格式化再统一处理数值和单位。
  const dimInfoCardVOList = Array.isArray(data?.dimInfoCardVOList) ? data.dimInfoCardVOList : [];
  const productCard = getKsDimCard(dimInfoCardVOList, "商品体验");
  const logisticsCard = getKsDimCard(dimInfoCardVOList, "物流体验");
  const serviceCard = getKsDimCard(dimInfoCardVOList, "售后服务");

  return {
    // 保留现有上传链路使用的一层字段，避免现在改 customer 后直接影响 shopIpcMessage.ts。
    consumerDivide: data?.kwaishopScoreMainVO?.value ?? "",
    serviceDivide: getKsValue(serviceCard?.cardData?.baseValue),
    foundationDivide: "",
    deliveryDivide: "",
    goodDivide: getKsValue(productCard?.cardData?.baseValue),
    logisticsDivide: getKsValue(logisticsCard?.cardData?.baseValue),

    // 补充一份更清晰的一层分数字段，方便后续改上传层时直接消费。
    consumerScore: data?.kwaishopScoreMainVO?.value ?? "",
    productScore: getKsValue(productCard?.cardData?.baseValue),
    logisticsScore: getKsValue(logisticsCard?.cardData?.baseValue),
    serviceScore: getKsValue(serviceCard?.cardData?.baseValue),

    // 二级指标统一保留原始值，不在采集层做百分比和时间单位转换。
    productMetrics: buildKsMetricMap(productCard?.indexCardVOList),
    logisticsMetrics: buildKsMetricMap(logisticsCard?.indexCardVOList),
    serviceMetrics: buildKsMetricMap(serviceCard?.indexCardVOList),
  };
}

// 获取快手店铺体验分。
const getKsshopScore = () => {
  if (cookie)
    fetch(`http://localhost:1121/ks-experience-score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cookie": cookie, //  自定义 header 携带 cookie
      },
      body: JSON.stringify({
        api: "getKwaishopScoreDetailV5",
        param: JSON.stringify({
          scoreSinkType: 1,
        }),
        sellerId: null,
      }),

      credentials: "include", // 🔥带上 im 页面 cookie（如果 s 接口用到了它）
    })
      .then((res) => res.json())
      .then((res) => {
        console.log("res==========", res);
        const data = res.data;
        try {
          // 将快手接口返回整理成一级分 + 二级指标结构，方便先校验取值是否正确。
          const info = buildKsExperienceScoreData(data);

          console.log("快手体验分", info);
          ipcRenderer.send("getShopExperienceScore", info);
        } catch (error) {
          console.error("快手体验分", error);
        }
      });
};
let wsConnectState = -1;

function pathUrl(_timeout = 15000) {
  let result = null;
  const url =
    "https://s.kwaixiaodian.com/rest/app/tts/cs/session/list?maxSize=100&pullOffset=1&sortType=1&role=0&containTags=false&containReportTags=true";
  setTimeout(async () => {
    try {
      result = await testXmlTool(url, "GET");
      if (result) getMsgHandler(result);
      // getUnReplyMessage()
    } catch (err) {
      console.error("接口报错:", err);
    } finally {
      pathUrl(10 * 1000);
    }
  }, _timeout);
}

//  接口补偿请求处理   接口处理
async function getMsgHandler(result) {
  // console.log('result=====', result)
  if (result?.error_msg?.includes("重新登录")) {
    console.log("重新登录");
    ipcRenderer.send("account-login-expired");
  }
  let messageTotal = getMessageTotal();
  console.log("messageTotal", messageTotal);
  if (result.result == 1) {
    // 请求成功
    const alldata = result.data.sessionList;

    if (!alldata || alldata.length == 0) return;

    for (const item of alldata) {
      const targetUserInfo = item.targetUserInfo; // 用户基信息

      const messageCont = item.chatSession.latestMessage[0];
      const sessionShowTag = item.sessionShowTag;

      const isRecentMessage = isBetweenYesterday23AndNow(item.chatSession.activeTime);
      const needsReply = [12, 13].includes(sessionShowTag);
      const blockKeywords = [
        "发货验收提醒",
        "催付卡片",
        "寄回商品提醒",
        "寄回商品二次提醒",
        "快手官方保障",
        "评价邀请",
        "订单卡片",
        "核单卡片",
        "猜你想问",
        "猜您想问",
        "会话关闭",
        "核对订单提醒",
      ];

      const title = messageCont.title || "";
      const isNotShippingNotice = !blockKeywords.some((keyword) => title.includes(keyword));
      const antiSpamResult = messageCont.extra.includes("antiSpamResult");
      if (
        antiSpamResult &&
        isRecentMessage &&
        needsReply &&
        isNotShippingNotice &&
        targetUserInfo.nickname !== "官方极致保障"
        // || needsReply(item.chatSession.unreadMsgCount && messageCont.notCountUnread) // 未读
      ) {
        console.log("原始数据", item);

        const expireTimeMs = messageCont.timestampMs + 180000;
        const timeout =
          expireTimeMs > Date.now()
            ? Math.floor(expireTimeMs / 1000)
            : Math.floor(Date.now() / 1000);
        let goodId = null;
        let orderStatus = "暂无订单";
        let orderId = null;
        let content = null;
        if (messageCont.title === "") {
          const r = extractNameAndId(messageCont.content);
          if (r) {
            content = r?.itemId ? "用户发送了商品" : "用户发送了订单";
            goodId = r?.itemId; //  商品id
            orderStatus = r?.orderStatusDesc; // 订单状态
            orderId = r?.orderid;
          }
        }
        const message = {
          goodId,
          userId: targetUserInfo.userId,
          messageId: targetUserInfo.userId, // 暂时使用用户名称替代id
          username: targetUserInfo.nickname,
          content: content || messageCont.title || messageCont.content,
          timeout, // 超时检测
          avatar: targetUserInfo.avatar,
          api: true,
          // isTimeout: expireTimeMs < Date.now(),
          // type: 'code',
          timeNote: "",
        };
        addMessageList.push(message);
      }
    }
    // 只有拥有信息才进行发送处理
  } else if (result?.error_msg?.includes("请重新登录")) {
    ipcRenderer.send("account-login-expired");
  }
  ipcRenderer.send("get-message-total", messageTotal);
  if (addMessageList && addMessageList.length > 0) {
    console.log("发送 接口获取 数据 列表 ", addMessageList);
    ipcRenderer.send("get-customer-message-list", addMessageList); // 发送消息

    if (!messageTotal) messageTotal = addMessageList.length;
    // console.log('发送 店铺消息总数 ', messageTotal)
    ipcRenderer.send("get-message-total", messageTotal);
    addMessageList = [];
  }
}
// 使用dom 获取列表消息   暂时未用上
function getUnReplyMessage() {
  // 获取dom消息
  const list = document.body.querySelectorAll(".SessionListGroup .SessionBaseCard-Static");

  if (list) {
    // SessionBaseCard-topHeadTime
    const pushlist = [];
    for (const item of list) {
      const timeDom = item.querySelector(".SessionBaseCard-topHeadTime");
      if (timeDom && timeDom.textContent.includes("超时")) {
        const nameDom = item.querySelector(".SessionBaseCard-topHeadName");
        const contentDom = item.querySelector(".SessionBaseCard-lastMessage");
        const timeString = timeDom.textContent;
        const message = new customerMsg(nameDom.textContent, contentDom.textContent, timeString);
        pushlist.push(message);
      }
    }
    if (pushlist.length > 0) {
      // console.log('发送 dom 获取 数据 列表 ', pushlist)
      ipcRenderer.send("get-customer-message-list", pushlist);
    }
  }
}

function isBetweenYesterday23AndNow(timestampMs) {
  const now = new Date();
  // 今天 0 点
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 昨天 23:00
  const yesterday23 = new Date(todayStart.getTime());
  yesterday23.setDate(todayStart.getDate() - 1);
  yesterday23.setHours(23, 0, 0, 0);

  // 判断 timestamp 是否在 [昨天23点, 当前时间] 之间
  return timestampMs >= yesterday23.getTime() && timestampMs <= now.getTime();
}
//  测试接口工具
const testXmlTool = async (url, method) => {
  try {
    const res = await fetch(url, {
      credentials: "include",
      method,
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    // console.log('接口返回:', data);
    return data; // ✅ 把数据 return 出去
  } catch (err) {
    console.log("接口报错:", err);
    return null;
  }
};

// 初始化获取店铺信息
function shopInfo() {
  // console.log('获取店铺信息')
  //  获取店铺信息
  fetch("https://im.kwaixiaodian.com/gateway/business/cs/solution/login/user/info/get", {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((res) => {
      const { result, data } = res;

      if (result == 1) {
        // 请求商家信息成功
        info = {
          logo: data.avatar, //用户头像
          id: data.shopId, // 店铺id
          kf: data.userId, // 客服id
          name: data.shopName, // 店铺名称
          username: data.nickname, //用户名
        };
        // _sendHeartbeat() // 启动心跳定时器
        console.log("获取商家信息成功", res, info);
        ipcRenderer.send("get-shop-info", info);
        // getUnReplyMessage()
        shoperMessage = info; // 获取保存商家全局信息
        fetch("https://s.kwaixiaodian.com/rest/pc/cs/b/get/assistant/status", {
          credentials: "include", // 关键点附带 cookie
        })
          .then((res) => res.json())
          .then((res) => {
            // console.log('店铺状态',  res)
            if (res.result == 1) {
              // 成功获取到信息
              let status = res.data.statusDesc;
              console.log("店铺状态", status);
              ipcRenderer.send("shop-status-change", { status });
            }
          });
        // getGoodList()
        // ipcRenderer.postMessage('get-webview-session', shoperMessage)  // 将商家发送给主进程
      }
    });
  // loginObserver.disconnect() // 断开登录成功状态的监听
}

// 获取店铺商品信息
const getGoodListSync = (goodsId) => {
  return new Promise((resolve, reject) => {
    fetch(
      "https://s.kwaixiaodian.com/gateway/business/cs/metadata/card/list/data/query?caver=2",

      {
        credentials: "include",
        method: "POST",

        body: JSON.stringify({
          businessKey: "pc_goods_list",
          tenantKey: "merchant_cs",
          businessDataVersion: "9",
          params: JSON.stringify({
            $LIMIT$: 10,
            $OFF_SET$: 0,
            $SKU_ID$: "0",
            $SEARCH_KEY_WORD$: goodsId ? goodsId : "",
            $BUYER_ID_STR$: shoperMessage.id,
            $VIEW_TAB$: 2,
            $MESSAGE_ID$: 0,
          }),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
      .then((res) => res.json())
      .then((res) => {
        console.log("商品列表", res);
        if (res.result === 1) {
          const shopData = JSON.parse(res.data);

          resolve(
            shopData.cardData.map((item) => ({
              productName: item["Text_goodsTitle@text"],
              productId: item["Text_itemId@text"],
              productDescribe: item["HoverComponent_uvwzxl6389k@hoverContent"],
              productImage: item["Image_umikt4dxz8b@uri"],
            })),
          );
        } else {
          reject(new Error("接口返回结果异常"));
        }
      })
      .catch(reject);
  });
};
// 商品学习
safeIpcOn("get-goods-detail", (event, args) => {
  console.log("开始获取商品详情", args);
  args.ids.forEach(async (id) => {
    getGoodListSync(id)
      .then((res) => {
        res.aiTaskId = args.aiTaskId;
        res.type = args.type;
        res.id = args.id;
        console.log("商品详情", res);
        // ipcRenderer.send('get-goods-url', res) // 获取详情
        goodsDetail(res, args);
      })
      .catch((err) => {});
  });
});

// 根据商品id获取商品详情
// safeIpcOn('get-goods-detail-by-id', (event, args) => {
//   getGoodListSync(args.id).then((res) => {
//     if (!res) {
//       ipcRenderer.send('goods-crawl-error', {
//         id: args.id,
//         error: '商品不存在'
//       })
//       return
//     }
//     goodsDetail(res, 2)
//   })
// })

// 商品学习全部
safeIpcOn("get-goods-all-detail", async (event, args) => {
  console.log("开始获取商品列表", args);
  try {
    // 第一步：获取第一页商品数据来确定总数
    const firstPageRes = await getGoodListSyncWithPagination(0, 20);

    if (!firstPageRes || firstPageRes.length === 0) {
      console.error("获取商品列表失败");
      return;
    }

    // 模拟总数计算，快语API没有直接返回总数，我们先获取更多页来估算
    let allGoods = [...firstPageRes];
    let offset = 20;
    let hasMore = firstPageRes.length === 20; // 只有当第一页满20个时才可能有更多页

    // 继续获取所有页面的商品来计算总数
    while (hasMore) {
      const pageRes = await getGoodListSyncWithPagination(offset, 20);
      if (pageRes && pageRes.length > 0) {
        allGoods = [...allGoods, ...pageRes];
        offset += 20;
        // 如果返回的商品数少于20，说明已是最后一页
        if (pageRes.length < 20) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }

      // 添加小延迟避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const total = allGoods.length;
    console.log(`总共有 ${total} 个商品`);

    // 发送总条数
    ipcRenderer.send("get-goods-all-detail-total", {
      userId: args.userId,
      total: total,
    });

    // 第二步：边获取边处理详情（避免重复获取）
    const pageSize = 20;
    const totalPages = Math.ceil(total / pageSize);

    // 先处理第一页（已经获取过了）
    if (firstPageRes.length > 0) {
      const isFirstPageLastBatch = totalPages === 1;
      await processKuaiyuBatchGoods(firstPageRes, 1, args, isFirstPageLastBatch);
    }

    // 处理剩余页面（从第2页开始）
    for (let page = 2; page <= totalPages; page++) {
      try {
        const offset = (page - 1) * pageSize;
        const pageRes = await getGoodListSyncWithPagination(offset, pageSize);

        if (pageRes && pageRes.length > 0) {
          const isLastBatch = page === totalPages;
          await processKuaiyuBatchGoods(pageRes, page, args, isLastBatch);
        }

        // 添加延迟避免请求过快
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`获取第 ${page} 页商品列表失败:`, error);
        ipcRenderer.send("upload-server-log", {
          type: "error",
          message: `快语获取第 ${page} 页商品列表失败:${error}`,
        });
      }
    }

    console.log("所有商品详情获取完成");
  } catch (error) {
    ipcRenderer.send("upload-server-log", {
      type: "error",
      message: `快语获取全部商品详情时出错:${error}`,
    });
    console.error("获取全部商品详情时出错:", error);
  }
});
const goodsDetail = (goodlist, args, type = 1) => {
  concurrentFetch(goodlist).then(async (res) => {
    console.log("线程请求结果", res);
    // global

    let productlist = [];
    res.forEach((item) => {
      console.log("item", item);

      // 成功
      const productMsg = item.global;
      const detailData = item.data;
      console.log("detailData", detailData);
      const mainImage = detailData.mainImage.fields.detailValue[0];
      const goodId = productMsg.itemId;

      // 商品简介
      const goodName = detailData.title.fields.detailValue;

      // 获取商品基本信息
      const goods_properties = detailData.goodsAttrs.fields.detailValue[0].list;

      // 提取商品属性的propAlias和propValue
      const extractedProperties =
        goods_properties?.map((prop) => ({
          propAlias: prop.label,
          propValue: prop.value,
        })) || [];

      // 将属性转换为更易读的格式
      const goodProperties = extractedProperties.map(
        (prop) => `${prop.propAlias}: ${prop.propValue}`,
      );

      // 获取商品sku
      // const goodSku = .map(
      //   (item) => item.specification
      // )

      const propMap = new Map();
      detailData.skuList.fields.detailValue.forEach((sku) => {
        sku.relationSpecificationList?.forEach((spec) => {
          const key = spec.propName;

          if (!propMap.has(key)) {
            propMap.set(key, new Set());
          }

          propMap.get(key).add(spec.propValueName);
        });
      });

      const goodSku = Array.from(propMap.entries()).map(([key, values]) => {
        return `${key}:${Array.from(values).join("/")}`;
      });
      // 获取商品类目
      const goodCat = productMsg.categoryNamePath.join("/");

      // 获取商品详情图片
      const detailImages = detailData.decorate.fields.detailValue;

      let product = {
        goodId,
        goodName,
        goodSku,
        goodCat,
        mainImage,
        detailImages,
        goodProperties,
      };

      if (type == 1) {
        product.aiTaskId = args.aiTaskId;
        product.type = args.type;
        product.id = args.id;
      }
      productlist.push(product);
    });
    ipcRenderer.send("get-goods-detail", productlist);
    // if (type == 1) {
    //   ipcRenderer.send('get-goods-detail', productlist)
    // } else {
    //   ipcRenderer.send('goods-crawl-complete', productlist)
    // }
  });
};
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 修改startListenShopStatus函数
const startListenShopStatus = (dom) => {
  // 监听店铺在线状态
  const onlineStatusObserver = new MutationObserver(async (mutationsList) => {
    for (let mutation of mutationsList) {
      // console.log('mutation', mutation)
      if (mutation.type === "characterData") {
        // console.log('mutation', mutation.target.nodeValue.trim())
        let status = mutation.target.nodeValue.trim();
        if (status == "挂起") {
          status = "忙碌";
        }
        ipcRenderer.send("shop-status-change", { status });
      }
    }
  });

  // 使用更精确的配置
  onlineStatusObserver.observe(dom, {
    characterData: true,
    subtree: true,
    childList: true,
    attributes: false,
  });
};

async function concurrentFetch(list, limit = 3) {
  limit = Math.min(limit, list.length);
  const results = [];
  let index = 0;

  async function safeFetchWithRetry(product, retries = 3) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      console.log("开始请求商品", {
        productId: product.productId,
        shopId: info.id,
      });
      try {
        return await ipcRenderer.invoke("get-good-info", {
          goodId: product.productId,
          platformShopId: info.id,
        });
      } catch (err) {
        console.warn(`请求失败（尝试 ${attempt + 1}）：`, err);
        if (attempt < retries) {
          await sleep(500 + attempt * 300);
        } else {
          return { error: true, product };
        }
      }
    }
  }
  async function worker() {
    while (true) {
      const currentIndex = index++;
      if (currentIndex >= list.length) break;
      const product = list[currentIndex];
      const data = await safeFetchWithRetry(product);
      console.log("请求结果======>", data);
      results[currentIndex] = data;
      await sleep(500); // 节流防风控
    }
  }
  const workers = Array.from({ length: limit }, () => worker());

  await Promise.all(workers);

  return results;
}

// 获取快手体验分
// safeIpcOn('get-shop-experience-score', (_) => {
//   // getShopExperienceScore()
//   getKsshopScore()
// })

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 格式化快手平均响应时间
function formatKsAvgReplyDurManual(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) {
    return totalSeconds + "秒";
  } else {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes + "分" + seconds + "秒";
  }
}

/**
 * 生成查询区间和对比区间
 * @param {string} currentStartDay - 查询区间开始日期（格式：YYYY-MM-DD）
 * @param {string} currentEndDay - 查询区间结束日期（格式：YYYY-MM-DD）
 * @returns {object} - 包含 currentStartDay、currentEndDay、compareStartDay、compareEndDay
 */
function generateDateRanges(currentStartDay, currentEndDay) {
  // 计算查询区间天数
  const start = new Date(currentStartDay);
  const end = new Date(currentEndDay);
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // 计算对比区间
  const compareEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const compareStart = new Date(compareEnd.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

  // 格式化日期
  const format = (d) => d.toISOString().slice(0, 10);

  return {
    currentStartDay: format(start),
    currentEndDay: format(end),
    compareStartDay: format(compareStart),
    compareEndDay: format(compareEnd),
  };
}

// 收到设置AI是否回复
safeIpcOn("set-ai-to-human-reply", () => {
  // console.log('收到设置AI是否回复')
  const dom = document.getElementsByClassName("LoginUserInfo-mainTitle-text")[0];
  if (dom) {
    // dom.click()
    ipcRenderer.send("set-ai-to-human-reply-customer", {
      messageId: dom.textContent || "",
    });
  }
});
// 初始化商品
safeIpcOn("init-goods", (event, args) => {
  // console.log('初始化商品', args)
  getGoodListSync().then((res) => {
    // console.log('初始化商品', res)
    const goodsList = res.map((item) => ({
      name: item.productName,
      id: item.productId,
      url: item.productImage,
    }));
    ipcRenderer.send("init-goods", goodsList);
  });
});

// 初始化店铺基本信息
safeIpcOn("init-shop-info", async (event, args) => {
  const goodres = await getGoodListSync();
  console.log("init-shop-info", goodres);
  fetch("http://localhost:1121/render", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-cookie": cookieArrayToHeaderString(args),
    },
    body: JSON.stringify({
      isCopy: false,
      itemId: goodres[0].productId,
      model: "detail",
      profileBiz: null,
      profileTopicId: null,
      step: 1,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      console.log("店铺信息", res);
      const params = {
        shopClass: res.data.global.categoryNamePath.map((item) => item).join("/"),
        goodName: goodres[0].productName,
      };
      ipcRenderer.send("init-shop-info", params);
    })
    .catch((error) => {
      console.error("获取最近使用分类失败:", error);
      // 在这里处理错误，防止未捕获的Promise拒绝
    });
});

const selectinput = new MutationObserver(async (mutationsList) => {
  for (const mutation of mutationsList) {
    // console.log('inputmutation============', mutation)
    const user = mutation.target.querySelector(".ImSearch-drop-panel-item");
    // console.log('user============', user)
    if (user) {
      try {
        user.click();
        // await delay(300)
        const edit = document.querySelector('[contenteditable="true"]');
        edit.click();
      } catch (error) {
        console.log("搜索监听器error============", error);
      } finally {
        selectinput.disconnect(); // 停止监听
      }
    }
  }
});

safeIpcOn("click-customer-message", async (event, arg) => {
  console.log("点击发送消息按钮", arg);
  if (arg?.userId || arg?.messageId) {
    console.log("发送=====");
    window.postMessage({
      type: "select-user",
      data: arg.userId || arg.messageId,
    });
    return;
  }
  customerMessage = arg; // 将获取的用户信息保存到全局变量

  const leftlist = document.querySelector(".ant-tabs-nav-list");
  if (leftlist) {
    // console.log('leftlist', leftlist)
    leftlist.querySelector(".ant-tabs-tab .ant-tabs-tab-btn").click(); // 切换到消息列表
  }
  setTimeout(async () => {
    // 延迟执行
    const workbenchContainer = document.querySelector(".new-workbench-container"); // 客服工作台
    let flagKey = false;
    if (workbenchContainer) {
      const SessionListGroup = document.querySelector(".leftBottom");
      SessionListGroup.querySelector(".tabs > .SessionTab  .tabItem").click(); // 切换到当前会话列
      const leftSession = SessionListGroup.querySelector(".SessionListGroup-FolderSessions");
      let key = false;
      for (let i = 0; i < leftSession.children.length; i++) {
        if (leftSession.children[i].children.length <= 1) {
          // 展开
          const unfoldTitle = leftSession.children[i].querySelector(".SessionListGroupItem-title ");
          unfoldTitle.click();
        } else {
          // 已展开
          const sessionGroup = leftSession.children[i].querySelector(".ant-checkbox-group");
          if (sessionGroup) {
            const sessionItem = sessionGroup.querySelectorAll(".SessionStarCard");
            sessionItem.forEach(async (item) => {
              if (item.querySelector(".SessionBaseCard-topHeadName").textContent == arg.username) {
                const targetItem = item.querySelector(".SessionBaseCard-Static");
                targetItem.setAttribute("data-message-id", arg.username);
                targetItem.click();
                key = true;
                await delay(300);
                const edit = document.querySelector('[contenteditable="true"]');
                // console.log('edit============', edit)
                edit.click();
                flagKey = true;
              }
            });
          }
        }
      }

      if ((!flagKey && arg.userId) || (!flagKey && !arg.userId && /^\d+$/.test(arg.username))) {
        // window.postMessage({
        //   type: 'select-user',
        //   data: arg.userId
        // })
        // 如果消息没有出现在 当前接待中
        const search = document.querySelector(".ant-select-selection-search-input");
        if (search) {
          // 获取焦点
          search.focus();
          search.value = arg.userId || arg.username; // 模拟手动输入
          search.dispatchEvent(new Event("input", { bubbles: true }));
          // 递归获取元素
          const dom = await getElementRecursive(
            ".ant-select-dropdown-placement-bottomLeft",
            20,
            50,
          );
          selectinput.observe(dom, {
            childList: true,
            characterData: true,
            subtree: true,
          });
        }
      }
    }
  }, 100);
});
// 一键上下线
safeIpcOn("change-shop-status", (_, status) => {
  console.log("change-shop-status=============>", status);
  const changeStatusDom = document.querySelector(".statusTag");
  // console.log('changeStatusDom', changeStatusDom)
  if (changeStatusDom) {
    setTimeout(() => {
      changeStatusDom.click();
      // console.log('status========', status)
      setTimeout(() => {
        if (status === "online") {
          // 点击在线
          const switchOnline = document.getElementsByClassName("ant-menu-item-only-child")[0];
          // console.log('switchOnline', switchOnline)
          if (switchOnline) {
            switchOnline.click();
          }
        } else if (status === "offline") {
          // 点击离线
          const switchOffline = document.getElementsByClassName("ant-menu-item-only-child")[2];
          // console.log('switchOffline', switchOffline)
          if (switchOffline) {
            switchOffline.click();
            setTimeout(() => {
              const modal = document.querySelector("div.ant-modal-body");
              if (modal) {
                const confirmButton = modal.querySelector("button.ant-btn.ant-btn-primary");
                if (confirmButton) {
                  confirmButton.click();
                }
              }
            }, 1000);
          }
        } else {
          // 点击忙碌
          const switchOffline = document.getElementsByClassName("ant-menu-item-only-child")[1];
          if (switchOffline) {
            switchOffline.click();
            setTimeout(() => {
              const modal = document.querySelector("div.ant-modal-body");
              if (modal) {
                const confirmButton = modal.querySelector("button.ant-btn.ant-btn-primary");
                if (confirmButton) {
                  confirmButton.click();
                }
              }
            }, 1000);
          }
        }
      }, 500);
    }, 500);
  }
});

safeIpcOn("get-shop-status", () => {
  // 获取dom
  const dom = document.querySelector(".statusTag");
  if (dom) {
    const status = dom.textContent.trim() == "挂起" ? "忙碌" : dom.textContent.trim();
    ipcRenderer.send("shop-status-change", { status });
  }
});

let isProcessing = false;
safeIpcOn("reply-message", (_, args) => {
  console.log("兜底回复信息", args);

  try {
    let data = [];
    // 是不是对象
    if (typeof args[0] === "object") {
      data = [args[0]];
    } else {
      const sendlist = JSON.parse(args);
      data = sendlist;
    }
    console.log("[reply-message] 解析后消息数量:", data, data.length);
    processNextMessage(data);
  } catch (e) {
    console.error("[reply-message] 解析失败:", e);
    if (args.isBottomLineAutoReply) {
      processNextMessage([args]);
    }
  }
});

let tMessage = null;

async function processNextMessage(sendlist) {
  const args = sendlist.shift();
  tMessage = args;
  // mapdata.set(tMessage.messageId, tMessage)
  if (tMessage.userId && tMessage.content && info && info.kf) {
    // 如果needOrder >=3的话就主动去获取一次商品信息
    if (tMessage?.needOrder && tMessage?.needOrder >= 3) {
      // 主动拿一次订单和商品并存在db里面
      const orderResult = await getOrderInfoByApi(tMessage.messageId);
      if (orderResult) {
        tMessage.orderStatus = orderResult.orderStatus;
        tMessage.orderId = orderResult.orderId;
        tMessage.goodId = orderResult.goodId;
        tMessage.goodName = orderResult.goodName;

        if (tMessage.goodId) {
          const good = await getGoodInfo(tMessage.goodId);
          console.log("good============", good);
          if (good) {
            tMessage = {
              ...tMessage,
              ...good,
            };

            console.log("obj=====>", tMessage);
          }
        }
      }
    }

    sendImage(tMessage.imageBase64, tMessage?.userId || tMessage.messageId, tMessage.imageUrl);
    await sleep(500);
    window.postMessage({
      type: "send-message",
      data: {
        text: tMessage.replyContent,
        targetType: 0,
        targetId: tMessage.userId,
        extra: {
          device: 2,
          sellerId: info.kf || null,
          from: null,
          senderId: info.kf || null,
          senderUserId: info.kf || null,
          senderNickName: info.username || null,
          role: 3,
          realFromRole: 3,
          sourcePage: 0,
        },
      },
    });

    setTimeout(async () => {
      let messageTotal = getMessageTotal();
      ipcRenderer.send("get-message-total", messageTotal);
      ipcRenderer.send("get-customer-callback-result", {
        ...tMessage,
        isAiInviteReply: tMessage.isAiInviteReply,
        isReminderReply: tMessage.isReminderReply,
        isBottomLineAutoReply: tMessage.isBottomLineAutoReply,
        isAiAutoReply: !tMessage.isBottomLineAutoReply,
      });
      // const messageId = tMessage?.messageId ?? tMessage?.userId
      // if (messageId)
      // await myDB.save({
      //   messageId: String(messageId),
      //   timestamp: Date.now()
      // })
    }, 2000);
    if (tMessage.isAiInviteReply && tMessage.userId) {
      fetch("https://s.kwaixiaodian.com/gateway/business/cs/pc/invite/evaluation", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetId: tMessage.userId,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.result == 1) {
            console.log("邀评成功", res);
            inviteMap.set(tMessage.userId, true);
          }
        });
    }
    if (tMessage.isReminderReply && tMessage.userId) {
      fetch("https://s.kwaixiaodian.com/gateway/business/cs/metadata/card/list/data/query", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessKey: "pc_goods_list",
          tenantKey: "merchant_cs",
          businessDataVersion: "9",
          params: `{\"$LIMIT$\":10,\"$OFF_SET$\":0,\"$SKU_ID$\":\"0\",\"$SEARCH_KEY_WORD$\":\"\",\"$BUYER_ID_STR$\":\"${tMessage.userId}\",\"$VIEW_TAB$\":2,\"$MESSAGE_ID$\":0}`,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          const { data } = res;
          const resultData = JSON.parse(data);
          // console.log('resultData=====', resultData)
          if (resultData) {
            const { cardData } = resultData;
            if (cardData && cardData.length > 0) {
              const itemId = cardData[0]["Text_itemId@text"];
              console.log("itemId", itemId);
              fetch("https://s.kwaixiaodian.com/gateway/business/cs/card/commodity/send", {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  buyerId: tMessage.userId,
                  commodityId: itemId,
                  sendScene: 2,
                  invitationExtra: {
                    folderId: 3,
                    source: 2,
                  },
                }),
              });
            }
          }
        });
    }
    return;
  }
}

async function handleReplyMessage(args) {
  console.log("开始处理信息:", args);

  const leftlist = document.querySelector(".ant-tabs-nav-list");
  if (leftlist) {
    leftlist.querySelector(".ant-tabs-tab .ant-tabs-tab-btn").click();
    await delay(50);

    const workbenchContainer = document.querySelector(".new-workbench-container");
    if (workbenchContainer) {
      const SessionListGroup = document.querySelector(".leftBottom");
      const tabItem = SessionListGroup.querySelector(".tabs > .SessionTab .tabItem");
      if (tabItem) {
        tabItem.click();
        const leftSession = SessionListGroup.querySelector(".SessionListGroup-FolderSessions");
        const title = document.querySelector(".LoginUserInfo-mainTitle-text");
        if (title?.textContent === args.username) {
          console.log("找到用户");
          await sendmessage(args); // 处理发送
          return;
        }

        let getuserfalge = false; // 是否寻找到用户标识
        for (let i = 0; i < leftSession.children.length; i++) {
          if (leftSession.children[i].children.length <= 1) {
            const unfoldTitle = leftSession.children[i].querySelector(
              ".SessionListGroupItem-title",
            );
            unfoldTitle.dispatchEvent(clickEvent);
          }

          const sessionGroup = leftSession.children[i].querySelector(".ant-checkbox-group");
          if (!sessionGroup) continue;

          const sessionItems = sessionGroup.querySelectorAll(".SessionStarCard");
          for (const item of sessionItems) {
            const topname = item.querySelector(".SessionBaseCard-topHeadName");
            if (topname?.textContent === args.username) {
              getuserfalge = true; // 找到目标用户
              // console.log('找到目标用户==========>', args.username, topname)
              const targetItem = item.querySelector(".SessionBaseCard-Static");
              targetItem.dispatchEvent(clickEvent);
              await sendmessage(args);
              return; // 当前消息处理完
            }
          }
        }
        // console.log('未找到用户继续========', title)
        if (!getuserfalge && args.userId) {
          console.log("最终未找到用户 ,启用搜索功能");

          window.postMessage({
            type: "select-user",
            data: args.userId,
          });

          // 排查是否进入
          const user = await waitForTextMatch(
            ".LoginUserInfo-mainTitle-text",
            args.messageId,
            20,
            50,
          );

          if (user == args.messageId)
            // console.log('准备发送')

            await sendmessage(args); // 处理发送
        }
      }
    }
  }
}

//  星标
safeIpcOn("star", () => {
  // console.log('Current star ')

  const CurrentUser = document.querySelector(
    ".TargetUserHeader> .LoginUserInfo > .LoginUserInfo-mainTitle >.LoginUserInfo-mainTitle-text",
  );
  if (CurrentUser) {
    const name = CurrentUser.textContent.trim();
    // console.log('Current star  name', name)
    const FolderSessions = document.querySelectorAll(".SessionListGroupItem");
    const AllSessions = document.querySelector(".AllSessionList-Sessions");
    // console.log('AllSessions', AllSessions, FolderSessions)

    if (FolderSessions.length > 0) {
      // console.log('AllSessions', AllSessions, FolderSessions)

      let matchedNode = null;
      for (const item of FolderSessions) {
        // console.log(item.children)
        if (item.children && item.children.length >= 2) {
          for (const child of Array.from(item.children)) {
            if (child.className === "ant-checkbox-group") {
              const list = child.children[0].querySelectorAll(".SessionStarCard");
              for (const node of list) {
                const firstLine = node.innerText.split("\n")[0].trim();
                if (firstLine == name) {
                  matchedNode = node;
                  // console.log('找到目标节点:', node)
                  // const rect = node.getBoundingClientRect();
                  node.dispatchEvent(
                    new MouseEvent("mouseover", {
                      bubbles: true,
                      cancelable: true,
                      view: window,
                    }),
                  );
                  // console.log('找到目标节点:', node.children[0]);

                  if (node.children[1]) {
                    // console.log('找到目标节点:', node.children[1].children[0])
                    node.children[1].children[0].dispatchEvent(
                      new MouseEvent("mouseout", {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                      }),
                    );
                    node.children[1].children[0].dispatchEvent(
                      new MouseEvent("mouseover", {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                      }),
                    );
                    waitForPopoverMenuAndClick(node.children[1].children[0]);
                  } else {
                    observeNodeInsert(node, (insertedNode) => {
                      insertedNode.children[0].dispatchEvent(
                        new MouseEvent("mouseover", {
                          bubbles: true,
                          cancelable: true,
                          view: window,
                        }),
                      );
                      waitForPopoverMenuAndClick(insertedNode.children[0], true);
                    });
                  }
                  break; // 退出内层循环
                }
              }
              if (matchedNode) break; // 退出中间循环
            }
          }
          if (matchedNode) break; // 退出外层循环
        }
      }
    } else if (AllSessions) {
      const SessionStarCardList = document.querySelectorAll(".SessionStarCard");
      for (const node of SessionStarCardList) {
        if (name == node.querySelector(".SessionBaseCard-topHeadName").textContent.trim()) {
          node.children[0].dispatchEvent(
            new MouseEvent("mouseover", {
              bubbles: true,
              cancelable: true,
              view: window,
            }),
          );
          if (node.children[1]) {
            node.children[1].children[0].dispatchEvent(
              new MouseEvent("mouseout", {
                bubbles: true,
                cancelable: true,
                view: window,
              }),
            );
            node.children[1].children[0].dispatchEvent(
              new MouseEvent("mouseover", {
                bubbles: true,
                cancelable: true,
                view: window,
              }),
            );
            waitForPopoverMenuAndClick(node.children[1].children[0]);
          } else {
            observeNodeInsert(node, (insertedNode) => {
              insertedNode.children[0].dispatchEvent(
                new MouseEvent("mouseover", {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                }),
              );
              waitForPopoverMenuAndClick(insertedNode.children[0], true);
            });
          }
          break;
        }
      }
    }
  }
});

function observeNodeInsert(targetNode, onInserted) {
  const observer = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          if (node.classList.contains("SessionStarCard-TagWrap")) {
            observer.disconnect();
            onInserted(node);
            return;
          }
        }
      }
    }
  });
  observer.observe(targetNode, { childList: true, subtree: true });
}
// 星标监听
function waitForPopoverMenuAndClick(node, flag = false) {
  const popoverRoot = document.body;
  const observer = new MutationObserver((mutations, obs) => {
    // document.querySelector
    const starPop = document.querySelector(".star-pop");
    if (starPop) {
      starPop.style.visibility = "hidden";
      if (flag) {
        const star = document.querySelector(".star-pop ul li");
        if (star) {
          star.click();
          node.dispatchEvent(
            new MouseEvent("mouseout", {
              bubbles: true,
              cancelable: true,
              view: window,
            }),
          );
          obs.disconnect(); // 断开监听，避免重复触发
          return;
        }
      } else {
        const star = document.querySelector(".star-pop ul li:last-child");
        if (star) {
          star.click();
          node.dispatchEvent(
            new MouseEvent("mouseout", {
              bubbles: true,
              cancelable: true,
              view: window,
            }),
          );
          obs.disconnect(); // 断开监听，避免重复触发
          return;
        }
      }
    }
  });
  observer.observe(popoverRoot, { childList: true, subtree: true });
}

// 等待编辑器清空
function waitForEditorToClear(editorEl, maxWait = 3000) {
  return new Promise((resolve) => {
    const checkInterval = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      const isCleared = editorEl.innerText.trim() === "";
      if (isCleared || elapsed >= maxWait) {
        clearInterval(timer);
        resolve(true);
      }
      elapsed += checkInterval;
    }, checkInterval);
  });
}
//  工具函数  await 延迟函数
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// 工具函数 防抖函数
function debounce(func, wait = 100, immediate = false) {
  let timeoutId = null;

  return function (...args) {
    const context = this;

    // 清除之前的定时器
    if (timeoutId) clearTimeout(timeoutId);

    if (immediate) {
      // 如果已经执行过，不再执行
      const callNow = !timeoutId;
      timeoutId = setTimeout(() => {
        timeoutId = null;
      }, wait);
      if (callNow) func.apply(context, args);
    } else {
      // 设置新的定时器
      timeoutId = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    }
  };
}
// 工具函数 将cookie数组转换为header字符串
function cookieArrayToHeaderString(cookieArray) {
  return cookieArray.map((c) => `${c.name}=${c.value}`).join("; ");
}
// 工具函数 提取商品名称和ID
function extractNameAndId(content) {
  const orderStatusDesc = content.match(/"orderStatusDesc":"([^"]*)"/)?.[1] || null;

  const orderid = content.match(/"order_id":"?(\d+)"?/)?.[1] || null;

  const itemId = content.match(/"item_id":"?(\d+)"?/)?.[1] || null;

  const result = {
    ...(orderStatusDesc && { orderStatusDesc }),
    ...(orderid && { orderid }),
    ...(itemId && { itemId }),
  };

  return Object.keys(result).length ? result : null;
}

// 创建获取快手工单信息
safeIpcOn("create-workorder", async (_, args) => {
  // console.log('接收获取工单信息')
  let datalist = [];

  try {
    const OrderListDom = document.querySelector("#OrderListDom");
    if (!OrderListDom) {
      // console.error('未找到订单容器')
      ipcRenderer.send("get-create-workorder", []);
      return;
    }

    const list = OrderListDom.querySelector(".list");
    if (!list) {
      // console.error('未找到订单列表')
      ipcRenderer.send("get-create-workorder", []);
      return;
    }

    const OrderCardList = list.querySelectorAll(".OrderCard");
    // console.log('找到订单数量:', OrderCardList.length)

    for (let i = 0; i < OrderCardList.length; i++) {
      const node = OrderCardList[i];
      try {
        // console.log(`处理第 ${i + 1} 个订单`)

        // 获取基本信息
        const orderIdEl = node.querySelector(".oid");
        const typeEl = node.querySelector(".tag-first");
        const orderNameEl = node.querySelector(".itemTitle");
        // console.log('node==========', node)

        if (!orderIdEl || !typeEl || !orderNameEl) {
          // console.warn(`第 ${i + 1} 个订单：缺少基本信息`)
          continue;
        }

        const orderId = orderIdEl.textContent.trim();
        const type = typeEl.textContent.trim();
        const orderName = orderNameEl.textContent.trim();

        // console.log(`订单 ${orderId} 类型: ${type}`)

        // 初始化变量
        let sku = "";
        let name = "";
        let phone = "";
        let address = "";
        let expressCompany = "";
        let trackingNumber = "";
        // 获取详细信息
        // console.log('node======== ', node)
        // const content = node.querySelector('.ant-collapse')
        const content = node.querySelector(".ant-collapse-item-active");
        if (content) {
          // 获取SKU
          const skuEl = node.querySelector(".skuInfo > .skuContain > .sku");
          console.log("skuEl", skuEl);
          if (skuEl) {
            sku = skuEl.textContent.trim();
          }

          // 获取收件人
          const nameEl = node.querySelector(".receiver-value-wrapper .receiver-value > span");
          if (nameEl) {
            name = nameEl.textContent.trim();
          }

          const phoneEl = node.querySelector(".receiver-value-wrapper .receiver-value > .content");
          if (phoneEl) {
            phone = phoneEl.textContent.trim();
          }

          // 获取地址
          const addressEl = node.querySelector(".receiver-address");
          if (addressEl) {
            address = addressEl.textContent.trim();
          }

          // 获取快递单号
          // console.log('content======== ', content)
          const expressNumberEl = content.querySelector(
            ".consigneePackageListContain  .consigneePackageListPackage",
          );
          // console.log('expressNumberEl======== ', expressNumberEl)

          if (expressNumberEl) {
            const express = expressNumberEl.textContent.trim();
            // console.log('express======== ', express)
            if (express) {
              const result = express.match(/^(.+?)\s*([A-Za-z0-9]+)$/);
              expressCompany = result[1]; // 快递类型
              trackingNumber = result[2]; // 快递单号
            }
          }

          // console.log(
          //   `订单 ${orderId} 详细信息: SKU=${sku}, 收件人=${name}, 电话=${phone}`
          // )
        } else {
          console.warn(`订单 ${orderId}：未找到详细信息`);
        }

        const data = {
          orderId,
          type,
          orderName,
          sku,
          name: name && phone ? `${name} ${phone}` : name || phone || "",
          address,
          expressCompany,
          trackingNumber,
          expanded: true,
        };

        datalist.push(data);
        // console.log(`成功处理订单 ${orderId}:`, data)
      } catch (error) {
        console.error(`处理第 ${i + 1} 个订单时出错:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error("获取工单信息失败:", error);
  }

  // console.log('最终处理结果，共', datalist.length, '个订单:', datalist)
  ipcRenderer.send("get-create-workorder", datalist);
});

safeIpcOn("currnt-page", (_, key) => {
  _key = key;
  if (_key) {
    ipcRenderer.send("get-currnt-page", false);
    // key为true时暂停定时器
    if (hearTimer) {
      const elapsedTime = Date.now() - startTime;
      pausedTime = elapsedTime; // +
      clearTimeout(hearTimer); // 清除当前定时器
    }
    // console.log('暂停========', key)
  } else {
    // sendHeartbeat
    if (pausedTime == 0) {
      // console.log('继续11111111')

      _sendHeartbeat(currentInterval);
      return;
    }
    // console.log('222222222')

    HEARTBEAT_INTERVAL > pausedTime
      ? (currentInterval = HEARTBEAT_INTERVAL - pausedTime)
      : (currentInterval = pausedTime - HEARTBEAT_INTERVAL);
    _sendHeartbeat(currentInterval);
  }
});

const _sendHeartbeat = (time) => {
  startTime = Date.now();
  clearTimeout(hearTimer);
  hearTimer = setTimeout(async () => {
    // console.log('执行11111========', _key)
    if (_key && info) return;
    await ipcRenderer.send("reload-page");
    // console.log('执行========22222222', _key)
    time = 0;
    // location.reload();
    _sendHeartbeat();
  }, time || currentInterval); // 使用临时变量
};

// 支持分页的商品列表获取函数
const getGoodListSyncWithPagination = (offset = 0, limit = 20) => {
  return new Promise((resolve, reject) => {
    fetch("https://s.kwaixiaodian.com/gateway/business/cs/metadata/card/list/data/query?", {
      credentials: "include",
      method: "POST",
      body: JSON.stringify({
        businessKey: "pc_goods_list",
        tenantKey: "merchant_cs",
        businessDataVersion: "9",
        params: JSON.stringify({
          $LIMIT$: limit,
          $OFF_SET$: offset,
          $SKU_ID$: "0",
          $SEARCH_KEY_WORD$: "",
          $BUYER_ID_STR$: shoperMessage.id,
          $VIEW_TAB$: 1,
        }),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.result === 1) {
          const shopData = JSON.parse(res.data);
          // console.log(
          //   `获取商品列表分页数据 offset:${offset}, limit:${limit}`,
          //   shopData
          // )
          resolve(
            shopData.cardData.map((item) => ({
              productName: item["Text_goodsTitle@text"],
              productId: item["Text_itemId@text"],
              productDescribe: item["HoverComponent_uvwzxl6389k@hoverContent"],
              productImage: item["Image_umikt4dxz8b@uri"],
            })),
          );
        } else {
          reject(res.msg);
        }
      })
      .catch((error) => {
        console.error("获取商品列表失败:", error);
        reject(error);
      });
  });
};

// 处理单页商品详情的函数
async function processKuaiyuBatchGoods(goodsItems, pageNum, args, isLastBatch = false) {
  console.log("goodsItems", goodsItems);
  try {
    // 为商品添加任务信息
    const enrichedGoods = goodsItems.map((item) => ({
      ...item,
      aiTaskId: args.aiTaskId,
      type: args.type,
      id: args.id,
    }));
    // 使用concurrentFetch并发获取商品详情
    const detailResults = await concurrentFetch(enrichedGoods, 3);

    // 处理获取的商品详情数据
    let productlist = [];
    detailResults.forEach((item) => {
      console.log("item", item);

      // 成功
      const productMsg = item.global;
      const detailData = item.data;

      const mainImage = detailData.mainImage.fields.detailValue[0];
      const goodId = productMsg.itemId;

      // 商品简介
      const goodName = detailData.title.fields.detailValue;

      // 获取商品基本信息
      const goods_properties = detailData.goodsAttrs.fields.detailValue[0].list;

      // 提取商品属性的propAlias和propValue
      const extractedProperties =
        goods_properties?.map((prop) => ({
          propAlias: prop.label,
          propValue: prop.value,
        })) || [];

      // 将属性转换为更易读的格式
      const goodProperties = extractedProperties.map(
        (prop) => `${prop.propAlias}: ${prop.propValue}`,
      );

      // 获取商品sku
      // const goodSku = .map(
      //   (item) => item.specification
      // )

      const propMap = new Map();
      detailData.skuList.fields.detailValue.forEach((sku) => {
        sku.relationSpecificationList?.forEach((spec) => {
          const key = spec.propName;

          if (!propMap.has(key)) {
            propMap.set(key, new Set());
          }

          propMap.get(key).add(spec.propValueName);
        });
      });

      const goodSku = Array.from(propMap.entries()).map(([key, values]) => {
        return `${key}:${Array.from(values).join("/")}`;
      });
      // 获取商品类目
      const goodCat = productMsg.categoryNamePath.join("/");

      // 获取商品详情图片
      const detailImages = detailData.decorate.fields.detailValue;

      let product = {
        goodId,
        goodName,
        goodSku,
        goodCat,
        mainImage,
        detailImages,
        goodProperties,
        aiTaskId: args.aiTaskId,
        type: args.type,
        id: args.id,
      };
      console.log("product==========》", product);
      productlist.push(product);
    });

    // 一页处理完后，批量发送所有商品详情数据
    if (productlist.length > 0) {
      ipcRenderer.send("get-goods-detail", productlist);
    }

    // 添加延迟避免请求过快，每页处理完成后等待30秒
    if (!isLastBatch) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  } catch (error) {
    console.error(`处理第 ${pageNum} 页时出错:`, error);
    ipcRenderer.send("upload-server-log", {
      type: "error",
      message: `快语处理第 ${pageNum} 页时出错:${error}`,
    });
  }
}

document.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const editordom = document.querySelector(".SendBox-Editor .ql-editor p");
      const name = document.querySelector(".LoginUserInfo-mainTitle-text");
      if (editordom) editCustomrMessage = editordom?.textContent?.trim() || "";
      if (name && name.textContent && editCustomrMessage) {
        ipcRenderer.send("reply-customer-message", {
          username: name.textContent,
          content: editCustomrMessage,
          type: "dom",
        });
      }
    }
  },
  true,
);
document.addEventListener("keyup", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    setTimeout(() => {
      editCustomrMessage = null;
    }, 1000);
  }
});

//  解析时间
function parseTimeoutToTimestamp(text) {
  if (!text.endsWith("后超时")) return null;
  const now = Math.floor(Date.now() / 1000); // 当前时间戳 (秒)

  let minutes = 0,
    seconds = 0;

  const matchFull = text.match(/(\d+)分(\d+)秒/);
  const matchMin = text.match(/(\d+)分/);
  const matchSec = text.match(/(\d+)秒/);

  if (matchFull) {
    minutes = parseInt(matchFull[1], 10);
    seconds = parseInt(matchFull[2], 10);
  } else if (matchMin) {
    minutes = parseInt(matchMin[1], 10);
  } else if (matchSec) {
    seconds = parseInt(matchSec[1], 10);
  } else {
    return null; // 不能识别
  }

  const offset = minutes * 60 + seconds;
  return now + offset; // 返回超时时间戳
}

async function waitForUsername(el, timeout = 5000) {
  return new Promise((resolve) => {
    const initial = el.textContent;
    // console.log('initial', initial)
    let resolved = false;
    // 如果一开始就不是数字，直接返回
    if (!/^\d+$/.test(initial)) {
      return resolve(initial);
    }
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // console.log('mutationnumver', mutation)
        if (mutation.type == "characterData") {
          const target = mutation.target;
          if (!/^\d+$/.test(target.data)) {
            resolved = true;
            observer.disconnect();
            resolve(target.data); // 变成昵称
          }
        }
      }
    });

    observer.observe(el, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    // 超时兜底：认为就是数字昵称
    setTimeout(() => {
      if (!resolved) {
        observer.disconnect();
        resolve(initial);
      }
    }, timeout);
  });
}

//  是否开启 ai
safeIpcOn("update-shop-bot-status", (_, data) => {
  // console.log('收到店铺bot状态更新:', data)
  shopBotStatus = data.botStatus;
});

// 工具函数 获取订单信息
function getOrderInfo() {
  return new Promise((resolve) => {
    // document.querySelector()
    safeIpcOn("user-order-result", (_, data) => {
      console.log("kuaiyu-order-result___拦截到的信息   ", data);
      try {
        if (data && data.data) {
          const { orderInfoList } = data.data; // 获取list 列表信息
          if (orderInfoList.length <= 0) return;
          const frastorder = orderInfoList[0]; // 获取最新订单信息
          // console.log('frastorder', frastorder)
          const { orderBaseInfo } = frastorder; //  获取订单基本信息
          // console.log('最新订单信息', orderBaseInfo)
          const {
            payTime,
            orderStatusTag: { text },
          } = orderBaseInfo; // 获取订单时间与 订单状态
          // console.log('payTime', payTime)
          // console.log('text', text)
          if (payTime + weekTime > Date.now()) {
            resolve(text);
          }
        }
      } catch (e) {
        resolve(null);
      }
    });
    setTimeout(() => resolve(null), 5000); // 如果实在没有获取到信息 则 5s 之后 正常返回
  });
}

/**
 * 尝试获取元素，最多 attempts 次，每次等待 interval 毫秒
 * @param {string} selector CSS 选择器
 * @param {number} attempts 剩余尝试次数（初始传 30）
 * @param {number} interval 毫秒，默认 100
 * @returns {Promise<Element|null>}
 */
async function getElementRecursive(selector, attempts = 30, interval = 100) {
  const el = document.body.querySelector(selector);
  if (el) return el;
  if (attempts <= 1) return null;
  await new Promise((res) => setTimeout(res, interval));
  return getElementRecursive(selector, attempts - 1, interval);
}

// 解析完整时间字符串为年月日时分秒（如"8-19 11:01:08"）
function parseFullTime(fullTime) {
  if (!fullTime) return null;
  const [datePart, timePart] = fullTime.split(" ");
  if (!datePart || !timePart) return null;
  const [month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  return { month, day, hour, minute, second, datePart };
}

// 计算"在吗？"消息的时间（基于上一条消息时间的秒数+1）
function calculateInquiryTime(lastTimeStr) {
  const lastTime = parseFullTime(lastTimeStr);
  if (!lastTime) return null;

  // 解构上一条消息的时间参数
  let { month, day, hour, minute, second, datePart } = lastTime;

  // 秒数+1，处理进位
  second += 1;
  if (second >= 60) {
    second = 0; // 秒数归零
    minute += 1; // 分钟+1
    if (minute >= 60) {
      minute = 0; // 分钟归零
      hour += 1; // 小时+1
      if (hour >= 24) {
        hour = 0; // 小时归零（简单处理，暂不考虑日期进位）
      }
    }
  }

  // 格式化时分秒为两位数（补零）
  const formattedHour = hour.toString().padStart(2, "0");
  const formattedMinute = minute.toString().padStart(2, "0");
  const formattedSecond = second.toString().padStart(2, "0");

  // 拼接完整时间字符串（如"8-19 10:45:04"）
  return `${datePart} ${formattedHour}:${formattedMinute}:${formattedSecond}`;
}

// 获取客户ID
function getCustomerId() {
  try {
    const messageContainer = document.querySelector(".ChatMessageList-ContentWrap");
    if (!messageContainer) return "";
    const targetDiv = messageContainer.querySelector('div[id^="0_"]');
    if (!targetDiv || !targetDiv.id) return "";
    const idSegments = targetDiv.id.split("_");
    return idSegments.length >= 3 ? idSegments[1].trim() : "";
  } catch (err) {
    console.warn("获取客户ID失败:", err);
    return "";
  }
}

// 获取客户名称
function getCustomerName() {
  try {
    const userDiv = document.querySelector(".LoginUserInfo-mainTitle-text");
    return userDiv ? userDiv.textContent.trim() : "";
  } catch (err) {
    console.warn("获取客户名称失败:", err);
    return "";
  }
}

// 判断消息发送者
function detectSender(msg) {
  try {
    const noticeCard = msg.querySelector(".kwaishop-cs-BizNoticeCard");
    if (noticeCard) return "user";

    const layoutWrapper = msg.querySelector(".kwaishop-cs-LayoutDefaultWrapper_lrWrapper");
    if (layoutWrapper) {
      // if (layoutWrapper.classList.contains('kwaishop-cs-LayoutDefaultWrapper__isMine')) return 'assistant';
      if (layoutWrapper.classList.contains("kwaishop-cs-LayoutDefaultWrapper__isMine")) {
        // 检测优惠类营销消息
        const promoText = msg.textContent;
        if (
          promoText.includes("立省") ||
          promoText.includes("券后价") ||
          promoText.includes("支持新人特权")
        ) {
          return "unknown";
        }
        return "assistant";
      }
      if (layoutWrapper.classList.contains("kwaishop-cs-LayoutDefaultWrapper__notMe"))
        return "user";
    }
    const systemCard = msg.querySelector(".kwaishop-cs-bizBuyerFromCard");
    return systemCard ? "unknown" : "unknown";
  } catch (err) {
    console.warn("判断发送者失败:", err);
    return "unknown";
  }
}

//  获取快手用户订单信息
const getKsOrderStatus = () => {
  try {
    const orders = [];
    // 定位所有订单卡片容器
    const orderCards = document.querySelectorAll(".OrderCard");
    orderCards.forEach((card) => {
      // 提取订单号 - 从oid类元素中获取
      const payTag = card.querySelector(".pay-tag");
      if (payTag) {
        const orderIdEl = card.querySelector(".oid");
        const orderId = orderIdEl ? orderIdEl.innerText.trim() : "未知订单号";
        // 提取订单状态 - 处理单个或多个状态的情况
        const statusTags = card.querySelectorAll(".tag-contain .order-tag, .order-tag-last");
        let status = "未知状态";

        if (statusTags.length > 0) {
          // 收集所有状态标签文本并拼接
          status = Array.from(statusTags)
            .map((tag) => tag.innerText.trim().replace(/\s+/g, " "))
            .join(" ");
        }

        // 只添加有有效订单号的订单
        if (orderId !== "未知订单号") {
          orders.push({ orderId, status });
        }
      }
    });

    return orders;
  } catch (err) {
    console.error("快手订单提取脚本执行出错：", err);
    return [];
  }
};
// 工具函数 触发输入事件
function triggerInput(editableDiv, text) {
  editableDiv.focus();
  editableDiv.innerHTML = `<p>${text}</p>`;
  // 触发输入事件
  const inputEvent = new InputEvent("input", {
    bubbles: true,
    inputType: "insertText",
    data: text,
  });
  editableDiv.dispatchEvent(inputEvent);
  // 先将按键按下，再释放
  const keyboardEvent = new KeyboardEvent("keyup", {
    bubbles: true,
    key: "Enter",
  });
  editableDiv.dispatchEvent(keyboardEvent);
}

//  将发送单独 发送消息
const sendmessage = async (args) => {
  // sendmessage
  await delay(1000);
  const sendBox = document.querySelector(".SendBox");
  const editableDiv = sendBox.querySelector(".SendBox-Editor .ql-editor");
  if (!editableDiv) return;

  // 如果有图片，先发送图片
  if (args.imageBase64 || args.imageUrl) {
    try {
      await sendImageMessage(args.messageId, args.imageBase64, args.imageMimeType, args.imageUrl);
      await delay(500); // 图片发送后等待一下
    } catch (error) {
      console.error("[sendmessage] 图片发送失败:", error);
    }
  }

  // 如果是纯图片消息（isImageOnly），不需要发送文本
  if (args.isImageOnly) {
    return;
  }

  // 如果没有文本内容，直接返回
  if (!args.content || args.content.trim() === "") {
    return;
  }

  triggerInput(editableDiv, args.content);
  await delay(100);

  const sendBtn = sendBox.querySelector(".SendBox-buttonRight .ant-btn-primary");
  if (sendBtn && !sendBtn.disabled) {
    sendBtn.click();
  } else {
    // 如果按钮仍禁用，就触发回车发送
    editableDiv.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    editableDiv.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
  }
  //   等待编辑框清空（或者手动延迟一段时间）
  const isClear = await waitForEditorToClear(editableDiv);
  if (isClear) {
    console.log("编辑框清空==========>", args.content);
  } else {
    console.log("编辑框未清空==========>", args.content);
  }
};

// const ms_delay = (ms) => {
//   return new Promise((resolve) => setTimeout(resolve, ms))
// }
// 转接子账号或者星标
safeIpcOn("goto-human-reply", async (_, arg) => {
  const trigger = document.querySelector('img[src*="icon-session-transfer"][style*="grayscale"]');
  if (trigger) {
    trigger.click();
    await ms_delay(3000);
    const input = document.querySelector(`input[placeholder="请输入客服昵称"]`);

    if (input) {
      input.value = arg.subAccount;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await ms_delay(3000);
      const modal = document.querySelector(".ant-modal-body");
      if (modal) {
        const confirmButton = document.querySelector(".ant-btn.ant-btn-link.ant-btn-block");
        if (confirmButton) {
          console.log("confirmButton", confirmButton);
          confirmButton.click();
          await ms_delay(1000);
          const reasonDialog = document.querySelector(".ant-popover-inner-content");
          if (reasonDialog) {
            const reasonItems = document.querySelectorAll(".reasonList .reasonItem");
            for (const item of reasonItems) {
              if (item.textContent.includes("无原因直接转移")) {
                const button = item.querySelector("button.reasonItem-button");
                if (button) {
                  button.click();
                  console.log("已点击‘无原因直接转移’的发送按钮");
                }
              }
            }
          }
          console.log("已点击弹框中的‘确定’按钮");
          return;
        }
      }
    }
  }
});

// 工具函数 匹配dom指定文字
async function waitForTextMatch(selector, targetText, attempts = 30, interval = 100) {
  while (attempts-- > 0) {
    const el = document.querySelector(selector);
    const txt = el?.textContent?.trim();

    if (txt && txt === targetText) {
      return txt; // 匹配成功
    }

    await new Promise((r) => setTimeout(r, interval));
  }

  return null; // 超时
}

const HOOK_CODE = function () {
  const OriginalWebSocket = window.WebSocket;
  let retry = 0;
  window.__wsState = -1;
  window.WebSocket = function (url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    // 更新状态并通知 preload

    // 拦截发送消息
    const originalSend = ws.send;
    ws.send = function (data) {
      originalSend.apply(this, arguments); // 调用原始 send 方法
    };
    ws.addEventListener("error", function (event) {
      console.log("wss断开");
    });
    ws.addEventListener("open", function (event) {
      console.log("打开ws");
    });
    ws.addEventListener("close", function (event) {
      console.log("WebSocket连接关闭");
    });
    return ws; // 返回 WebSocket 实例
  };
};
// 执行HOOK_CODE
webFrame.executeJavaScript(`(${HOOK_CODE})();`);

// ============ 图片发送功能 ============
// 监听图片发送消息
safeIpcOn("send-image-message", async (_, args) => {
  console.log("[图片发送] 收到图片发送请求:", args);
  const { messageId, imageBase64, imageMimeType, imageUrl } = args;

  try {
    await sendImageMessage(messageId, imageBase64, imageMimeType, imageUrl);
    console.log("[图片发送] 图片发送成功");
  } catch (error) {
    console.error("[图片发送] 图片发送失败:", error);
  }
});

// 发送图片消息 - 在编辑框中创建 img 元素并发送
async function sendImageMessage(messageId, imageBase64, imageMimeType, imageUrl) {
  const sendBox = document.querySelector(".SendBox");
  const editableDiv = sendBox?.querySelector(".SendBox-Editor .ql-editor");

  if (!editableDiv) {
    console.error("[图片发送] 未找到编辑框");
    return false;
  }

  let imageSrc = "";
  if (imageBase64 && imageMimeType) {
    imageSrc = `data:${imageMimeType};base64,${imageBase64}`;
  } else if (imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status}`);
    }
    const blob = await response.blob();
    imageSrc = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("读取图片失败"));
      reader.readAsDataURL(blob);
    });
  } else {
    console.error("[图片发送] 缺少图片数据");
    return false;
  }

  // 创建 img 元素
  const img = document.createElement("img");
  img.src = imageSrc;

  // 找到或创建 p 标签
  let pTag = editableDiv.querySelector("p");
  if (!pTag) {
    pTag = document.createElement("p");
    editableDiv.appendChild(pTag);
  }

  // 清空 p 标签内容，插入图片
  pTag.innerHTML = "";
  pTag.appendChild(img);

  // 触发 input 事件，让编辑器感知到内容变化
  editableDiv.dispatchEvent(new Event("input", { bubbles: true }));

  await delay(200);

  // 点击发送按钮
  const sendBtn = sendBox.querySelector(".SendBox-buttonRight .ant-btn-primary");
  if (sendBtn && !sendBtn.disabled) {
    sendBtn.click();
    console.log("[图片发送] 点击发送按钮");
  } else {
    // 触发回车发送
    editableDiv.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    editableDiv.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
    console.log("[图片发送] 触发回车发送");
  }

  await delay(300);
  console.log("[图片发送] 图片发送完成");
  return true;
}

safeIpcOn("get-after-sale-total-order", async (_, arg) => {
  const info = arg;
  try {
    const monthStart = new Date(info.info.month[0]);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(info.info.month[1]);
    monthEnd.setHours(23, 59, 59, 999);
    const startTimeMs = monthStart.getTime();
    const endTimeMs = monthEnd.getTime();

    // 1. 获取总售后工单
    const totalCountRes = await fetch(
      "https://s.kwaixiaodian.com/rest/pc/aftersales/schema/refund/list/pagination?caver=2",
      {
        method: "post",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applyTimeRange: [startTimeMs, endTimeMs],
          limit: 20,
          offset: 0,
          sortWay: 3,
        }),
      },
    ).then((res) => res.json());

    // 2. 获取未发货仅退款
    const awaitingShipmentRefundRes = await fetch(
      "https://s.kwaixiaodian.com/rest/pc/aftersales/schema/refund/list/pagination?caver=2",
      {
        method: "post",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boolCondition: [],
          applyTimeRange: [startTimeMs, endTimeMs],
          limit: 20,
          offset: 0,
          sortWay: 3,
          handlingWay: 20,
        }),
      },
    ).then((res) => res.json());

    // 3. 获取工单条数
    const workOrderRes = await fetch(
      "https://s.kwaixiaodian.com/gateway/business/cs/issue/search",
      {
        method: "post",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageNum: 1,
          pageSize: 10,
          searchCondition: {
            createTime: `[${startTimeMs},${endTimeMs}]`,
            quickFilter: 2,
          },
        }),
      },
    ).then((res) => res.json());

    const applyCount = totalCountRes.data?.total || 0; // 总售后工单数
    const refundOnlyCount = awaitingShipmentRefundRes.data?.total || 0; // 未发货仅退款
    const workOrderCount = workOrderRes.data?.total || 0; // 工单条数
    const realCount = applyCount - refundOnlyCount + workOrderCount; // 实际订单数

    ipcRenderer.send("get-after-sale-total-order-result", {
      applyCount,
      refundOnlyCount,
      workOrderCount,
      realCount,
      id: info.info.id,
    });
  } catch (error) {
    console.log("error", error);
    ipcRenderer.send("web-scoker-error-callback", {
      info: info,
      errormsg: "查询月总工单失败,失败原因:" + JSON.stringify(error),
      shopId: info.info?.shopId,
    });
  }
});

const windowOnMessageHandler = async (event) => {
  if (!event?.data?.type) return; // 没有携带 type直接过滤
  if (event.data.type === "report-call") {
    console.log("收到 report 调用:", event.data.args);
    return;
  }

  if (event.data.type === "WS_STATE_CHANGE") {
    wsConnectState = event.data.state;
    return;
  }
  if (event.data.type == "get-message") {
    const sendMessage = event.data.data;

    console.log("sendMessage>>>>>>", sendMessage);

    if (["2", "5"].includes(event.data.key) && event.data.msgType == "update") {
      // console.log('进入111111')
      sendMessage.timeout = Math.floor(sendMessage.timeout / 1000) + 180;
      if (sendMessage.msgType == "mp4") {
        sendMessage.content = "用户发送了视频";
      } else if (sendMessage.msgType == "img") {
        sendMessage.content = "用户发送了图片";
      }

      if (shopBotStatus == 1) {
        let needSave = false;
        if (sendMessage.goodId) {
          sendMessage.content = "用户发送商品";
        } else if (sendMessage.orderId) {
          sendMessage.content = "用户发送订单";
        }
      }

      sendMessage.type = "code";
      ipcRenderer.send("get-customer-message-list", [sendMessage]);
    } else if (["3", "4"].includes(event.data.key) && event.data.msgType == "update") {
      const messageId = sendMessage?.messageId ?? sendMessage?.userId;
      // 删除DB 所存数据

      if (editCustomrMessage) {
        ipcRenderer.send("reply-customer-message", {
          messageId: sendMessage?.messageId,
          content: sendMessage?.content,
          type: "ksdel1",
        });
      } else {
        ipcRenderer.send("reply-customer-message", {
          messageId: sendMessage?.messageId,
          content: sendMessage?.content,
          compensate: true,
          type: "ksdel2",
        });
      }
      let messageTotal = await getMessageTotal();
      if (messageTotal) ipcRenderer.send("get-message-total", messageTotal);
    }
    return;
  }
};

//  更具 订单 获取商品基础信息
const getGoodbyOrderId = async (userId, orderId) => {
  const res = await fetch(`https://s.kwaixiaodian.com/gateway/business/cs/order/list?caver=2`, {
    method: "post",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      buyerId: userId,
      itemTitle: "",
      limit: 10,
      offset: 0,
      oid: orderId,
      orderStatus: 0,
      searchCondition: null,
      grayMap: {
        aftersaleIssue: "true",
      },
    }),
  }).then((res) => res.json());
  if (res.result != 1) return null;
  return (
    {
      goodId: res?.data?.orderInfoList[0]?.itemAndPriceInfo?.itemId,
      orderStatus: res?.data?.orderInfoList[0]?.orderBaseInfo?.orderStatusTag?.text,
    } || null
  );
};

window.addEventListener("message", windowOnMessageHandler);
// 获取消息数量
const getMessageTotal = () => {
  const cont = document.querySelectorAll(".SessionListGroupItem-count");
  let num1 = 0;
  let num2 = 0;

  if (cont.length > 0) {
    // console.log('cont========', cont[0].textContent, cont[1].textContent)

    if (cont[0].textContent) {
      num1 = getnum(cont[0].textContent);
    }
    if (cont[1].textContent) {
      num2 = getnum(cont[1].textContent);
    }
  }
  return num1 + num2;
};
const getnum = (str) => {
  const match = str.match(/[\(（](\d+)[\)）]/);
  if (match) {
    const num = match ? Number(match[1]) : 0;
    return num;
  }
  return 0;
};

// 创建 全局 db 库   用于保存AI已回复内容

class DB {
  constructor() {
    this.db = null;
    this.DB_NAME = "AIREPLY";
    this.STORE_NAME = "value";
    this.VERSION = 2;
  }

  // 初始化渲染 DB 库
  async init() {
    if (this.db) return this.db;

    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const transaction = event.target.transaction;

        // 检查是否需要创建对象存储
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          // 创建对象存储
          const store = db.createObjectStore(this.STORE_NAME, {
            keyPath: "messageId",
          });
          // 创建时间戳索引
          store.createIndex("timestamp", "timestamp", { unique: false });
          console.log("创建对象存储和索引");
        } else {
          // 对象存储已存在，检查是否需要创建索引
          const store = transaction.objectStore(this.STORE_NAME);
          if (!store.indexNames.contains("timestamp")) {
            store.createIndex("timestamp", "timestamp", { unique: false });
            console.log("创建 timestamp 索引");
          }
        }
      };

      request.onsuccess = () => {
        console.log("数据库连接成功");
        resolve(request.result);
      };

      request.onerror = () => {
        console.error("数据库连接失败", request.error);
        reject(request.error);
      };
    });

    return this.db;
  }

  // 新增/修改
  async save(data) {
    if (!data?.messageId) {
      throw new Error("IDB: messageId 不能为空");
    }
    // 如果没有 timestamp，自动添加当前时间戳
    if (!data.timestamp) {
      data.timestamp = Date.now();
    }

    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readwrite");
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.put(data);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // 根据 ID 查询
  async get(messageId) {
    if (!messageId) return null;
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readonly");
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.get(messageId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // 根据指定 ID 删除
  async delete(messageId) {
    if (!messageId) return null;
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readwrite");
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.delete(messageId);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // 删除两天前过期数据
  async deleteExpired(days = 2) {
    const db = await this.init();
    const expiredTime = Date.now() - days * 24 * 60 * 60 * 1000;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readwrite");
      const store = tx.objectStore(this.STORE_NAME);

      // 检查索引是否存在
      if (!store.indexNames.contains("timestamp")) {
        console.warn("timestamp 索引不存在，使用遍历方式删除");
        this.deleteExpiredByTraversal(days, tx, store, resolve, reject);
        return;
      }

      const index = store.index("timestamp");
      const range = IDBKeyRange.upperBound(expiredTime);
      const request = index.openCursor(range);

      let deletedCount = 0;
      const toDelete = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          toDelete.push(cursor.value.messageId);
          cursor.continue();
        } else {
          if (toDelete.length === 0) {
            resolve({ deletedCount: 0, message: "没有过期数据" });
            return;
          }

          let completed = 0;
          toDelete.forEach((messageId) => {
            const deleteRequest = store.delete(messageId);
            deleteRequest.onsuccess = () => {
              completed++;
              deletedCount++;
              if (completed === toDelete.length) {
                resolve({
                  deletedCount,
                  message: `成功删除 ${deletedCount} 条过期数据`,
                });
              }
            };
            deleteRequest.onerror = (err) => {
              completed++;
              console.error("删除失败", messageId, err);
              if (completed === toDelete.length) {
                resolve({
                  deletedCount,
                  message: `成功删除 ${deletedCount} 条过期数据（部分失败）`,
                  error: err,
                });
              }
            };
          });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 降级方案：通过遍历所有数据删除过期数据
  async deleteExpiredByTraversal(days, tx, store, resolve, reject) {
    const expiredTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const request = store.openCursor();

    let deletedCount = 0;
    const toDelete = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const data = cursor.value;
        // 检查是否有 timestamp 字段且过期
        if (data.timestamp && data.timestamp < expiredTime) {
          toDelete.push(data.messageId);
        }
        cursor.continue();
      } else {
        if (toDelete.length === 0) {
          resolve({ deletedCount: 0, message: "没有过期数据" });
          return;
        }

        let completed = 0;
        toDelete.forEach((messageId) => {
          const deleteRequest = store.delete(messageId);
          deleteRequest.onsuccess = () => {
            completed++;
            deletedCount++;
            if (completed === toDelete.length) {
              resolve({
                deletedCount,
                message: `成功删除 ${deletedCount} 条过期数据（降级模式）`,
              });
            }
          };
          deleteRequest.onerror = (err) => {
            completed++;
            console.error("删除失败", messageId, err);
            if (completed === toDelete.length) {
              resolve({
                deletedCount,
                message: `成功删除 ${deletedCount} 条过期数据（部分失败）`,
              });
            }
          };
        });
      }
    };

    request.onerror = () => reject(request.error);
  }

  // 获取所有过期数据（不删除）
  async getExpired(days = 2) {
    const db = await this.init();
    const expiredTime = Date.now() - days * 24 * 60 * 60 * 1000;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readonly");
      const store = tx.objectStore(this.STORE_NAME);

      if (!store.indexNames.contains("timestamp")) {
        // 使用遍历方式
        const request = store.openCursor();
        const expiredData = [];

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            if (cursor.value.timestamp && cursor.value.timestamp < expiredTime) {
              expiredData.push(cursor.value);
            }
            cursor.continue();
          } else {
            resolve(expiredData);
          }
        };
        request.onerror = () => reject(request.error);
        return;
      }

      const index = store.index("timestamp");
      const range = IDBKeyRange.upperBound(expiredTime);
      const request = index.openCursor(range);

      const expiredData = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          expiredData.push(cursor.value);
          cursor.continue();
        } else {
          resolve(expiredData);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// 接口获取用户最新订单
async function getOrderInfoByApi(params) {
  const res = await fetch(`https://s.kwaixiaodian.com/gateway/business/cs/order/list`, {
    // return await fetch(`https://s.kwaixiaodian.com/gateway/business/cs/order/lis?caver=2`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      buyerId: params,
      limit: 10,
    }),
  }).then((res) => res.json());
  console.log("res============", res);
  if (res.result !== 1) {
    return null;
  }

  const orderList = res.data?.orderInfoList;
  if (!orderList?.length) {
    return null;
  }

  const data = orderList[0];
  // 安全提取字段
  // const goodName = data?.itemAndPriceInfo?.itemTitle ?? ''
  // const orderId = data?.logParamData?.order_id ?? ''
  const goodId = data?.itemAndPriceInfo?.itemId ?? "";

  // 安全处理 topTagList
  const topTagList = data?.orderBaseInfo?.topTagList;
  const orderStatus = Array.isArray(topTagList)
    ? topTagList.map((item) => item.text).join(",")
    : "";

  return {
    // goodName,
    // orderId,
    orderStatus,
    goodId,
  };
}

// 获取商品详情
const getGoodInfo = async (id) => {
  try {
    const goodData = await fetch(
      "https://s.kwaixiaodian.com/rest/pc/product/manage/item/publish/render",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          step: 1,
          model: "detail",
          itemId: id,
          isCopy: false,
          profileBiz: null,
          profileTopicId: null,
        }),
      },
    ).then((r) => r.json());
    // console.log('gooditem======', goodData)
    const product = {
      goodId: id,
      goodName: "",
      sku: "",
      goodCat: "",
      goodInfo: "",
    };
    if (goodData.result == 1) {
      const detailData = goodData.data.data;
      if (detailData) {
        product.goodName = detailData.title.fields.detailValue;
        product.sku = detailData.skuList.fields.detailValue
          .map((item) => item.specification)
          .join(",");
        detailData.goodsAttrs.fields.detailValue[0].list.map((item) => {
          product.goodCat += item.label + ":" + item.value + ",";
        });
        product.goodInfo = product?.goodName + product?.goodCat + product?.sku;
        console.log("product =====", product);
      }
    }
    return product;
  } catch (e) {
    console.log("数据抓取失败", e);
    return null;
  }
};

//  发送粘贴
ipcRenderer.on("paste-to-shop", (event, text) => {
  // 获取编辑器容器和 Quill 实例
  const editorElement = document.querySelector(".SendBox-Editor .ql-editor");
  if (!editorElement) return;
  editorElement.innerHTML = `<p>${text}</p>`;
  editorElement.dispatchEvent(new Event("input", { bubbles: true }));
  const enterEvent = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  });
  editorElement.dispatchEvent(enterEvent);
});
//  将图片 转为 二进制数据
const base64ToImageObject = (base64, fileName = "image.png") => {
  const [header, data] = base64.split(",");
  const mimeType = header.match(/:(.*?);/)[1];

  // base64 → binary
  const binary = atob(data);
  const len = binary.length;
  const buffer = new ArrayBuffer(len);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < len; i++) {
    view[i] = binary.charCodeAt(i);
  }

  return {
    fileName,
    arrayBuffer: buffer,
    mimeType,
  };
};
//  获取 base64 图 尺寸
const getImageSize = (base64) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = reject;
    img.src = base64;
  });
};
// 封装统一方法  发送图片
const sendImage = async (base64, userId, imageUrl) => {
  if (!userId || (!base64 && !imageUrl)) return;
  let imageDataUrl = base64;
  if (!imageDataUrl && imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status}`);
    }
    const blob = await response.blob();
    imageDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("读取图片失败"));
      reader.readAsDataURL(blob);
    });
  }
  const targetObj = base64ToImageObject(imageDataUrl);
  const { width, height } = await getImageSize(imageDataUrl);
  const sendObj = {
    targetType: 0,
    targetId: userId,
    image: targetObj,
    width,
    height,
    extra: {
      device: 2,
      sellerId: info.kf,
      from: null,
      senderId: info.kf,
      senderUserId: info.kf,
      senderNickName: info.id,
      role: 3,
      realFromRole: 3,
      sourcePage: 0,
    },
  };
  window.postMessage({
    type: "send-image",
    data: sendObj,
  });
};

//  星标
const starUpdata = (userId, type) => {
  window.postMessage({
    type: "user-star",
    data: {
      userId, // 1410644614, // 用户id
      type, //   NaN/ 1 2 3 4   // 对应参数对应不同星标 NaN取消
    },
  });
};
// AI转人工星标
safeIpcOn("ai-transfer-human-mark", (_, args) => {
  console.log("AI转人工星标", args);
  starUpdata(args.userId, 1);
  // window.postMessage({
  //   type: 'user-star',
  //   data: {
  //     userId: args.userId, // 1410644614, // 用户id
  //     type: 1 //   NaN/ 1 2 3 4   // 对应参数对应不同星标 NaN取消
  //   }
  // })
});

//   收到店铺心跳
ipcRenderer.on("heartbeat", () => {
  ipcRenderer.send("web-heartbeat-ping"); // 返回店铺心跳
});
