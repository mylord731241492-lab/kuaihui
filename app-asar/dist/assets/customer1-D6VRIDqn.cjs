const { ipcRenderer, contextBridge, webFrame } = require("electron");
contextBridge.exposeInMainWorld("context_bridge", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
});
// 安全注册 IPC 监听器（自动移除旧监听，防止刷新时重复注册）
function safeIpcOn(channel, handler) {
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, handler);
}

let mainUrl = "https://store.weixin.qq.com/";
let isUserOperating = false; // 用户是否正在操作
let lastMouseActivity = 0; // 最后一次鼠标活动时间
let windowHasFocus = false; // 窗口是否有焦点
let userActivityTimer = null; // 用户活动检查定时器
let USER_ACTIVITY_TIMEOUT = 3000; // 3秒内有鼠标活动认为用户在操作
const threeMinResponse = 3 * 60 * 1000; // 质检时间 3分钟
let shopBotStatus = null; // 店铺bot状态
let key = null; // biz_magic 秘钥
let allProducts = []; // 商品列表
let allCategories = []; // 所有类目
let is_key = null; //  页面隐藏状态，true=隐藏，false=可见
let ordersKeyValue = null; // 订单key值 秘钥
//  全局变量 定义
class Info {
  constructor(name, username, kf, logo, id) {
    this.name = name; // 店铺名称
    this.username = username; // 客服名称
    this.kf = kf; // 客服id
    this.logo = logo; // 店铺logo
    // this.id = id  // 店铺id
  }
}
class Message {
  constructor(messageId, username, content, timeout, avatar, isTimeout, timeNote, api = false) {
    this.messageId = messageId; // 消息id
    this.content = content; // 消息内容
    this.timeout = timeout; // 超时时间
    this.avatar = avatar; // 头像
    this.username = username; // 用户名
    this.isTimeout = isTimeout; // 是否超时
    this.timeNote = timeNote; // 时间备注
    this.api = api; // 是否是接口信息
  }
}

let wsConnectState = -1;

// ============ API 健康监控 ============
const apiHealthMonitor = {
  recentRequests: [], // 最近的请求结果 [true=成功, false=失败]
  MAX_RECORDS: 10, // 最多记录 10 次
  initialized: false,

  // 记录请求结果
  record(success) {
    this.recentRequests.push(success);
    if (this.recentRequests.length > this.MAX_RECORDS) {
      this.recentRequests.shift();
    }
  },

  // 获取 API 健康状态
  isHealthy() {
    // 样本太少不判断
    if (this.recentRequests.length < 3) return true;
    const failCount = this.recentRequests.filter((ok) => !ok).length;
    // 失败率 >= 50% 视为不健康
    return failCount / this.recentRequests.length < 0.5;
  },

  // 初始化 fetch 拦截
  init() {
    if (this.initialized) return;
    this.initialized = true;

    const self = this;
    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
      try {
        const response = await originalFetch.apply(this, args);
        // 只记录业务接口，忽略静态资源
        const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
        if (!url.includes(".js") && !url.includes(".css")) {
          self.record(response.ok);
        }
        return response;
      } catch (e) {
        const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";

        self.record(false);

        throw e;
      }
    };

    console.log("[API健康监控] 已初始化");
  },
};

// 初始化 API 监控
apiHealthMonitor.init();
//  回车事件
const eventKey = new KeyboardEvent("keydown", {
  key: "Enter",
  code: "Enter",
  keyCode: 13,
  which: 13,
  bubbles: true,
});

let shop_Name = null;

//  初始化
const url = window.location.href;
if (url.includes(mainUrl + "shop/home")) {
  console.log("跳转客服页面");
  // url
  const { shopName } = getHttpAccountPassword();

  window.location.replace(mainUrl + "shop/kf?shopName=" + shopName);
}
if (url.includes(mainUrl + "shop/kf")) {
  const { shopName } = getHttpAccountPassword();
  shop_Name = shopName;
}

window.addEventListener("load", () => {
  // modulepreload
  console.log("加载完成--------------");
  // document.querySelectorAll('link[rel="modulepreload"]').forEach((link) => {
  //   if (
  //     link.href.includes('//static.wxqcloud.qq.com.cn/mp/kf/client/assets/main')
  //   ) {
  //     console.log('modulepreload', link)

  //     ipcRenderer.send('get-page-load-js', link.href)
  //   }
  // })
  // setTimeout(() => {
  //   const logo = document.querySelector('.avatar-wrap')
  //   logo.addEventListener('click', async (e) => {
  //     fetch(
  //       `https://store.weixin.qq.com/shop/commkf/room?action=transfer_session`,
  //       {
  //         method: 'POST',
  //
  //         headers: {
  //           'Content-Type': 'application/json, text/plain',
  //           biz_magic: window._key
  //         },
  //         body: JSON.stringify({
  //           recv_openid: 'o9cq800zSwmNR34pS7V9SiOy3VgU',
  //           room_id: '4193859927428448256',
  //           msg_content: '留言：',
  //           msg_type: 1,
  //           need_return_msg_id: true
  //         })
  //       }
  //     )
  //   })
  //
  if (document.cookie) {
    const ma = document.cookie.split("=");
    if (ma) {
      key = ma[1];
    }
  }
  console.log("key==============", key);
  window.postMessage({ type: "get-key", value: key }, "*");
  // }, 3000)
  setTimeout(() => {
    ipcRenderer.send("request-shop-bot-status");
  }, 1000);

  const loginTypeContainer = document.querySelector(".login__type__container");
  if (loginTypeContainer) {
    // 登录过期
    console.log("登录过期", loginTypeContainer);
    ipcRenderer.send("account-login-expired");
  }

  ipcRenderer.send("get-shop-page-loaded"); //页面加载完成
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
  console.log("微信小店页面加载完成");
  if (url.includes(mainUrl + "shop/kf")) {
    // 进入客服页面登录成功
    // console.log('执行质检')
    threeMinResponseTime();
  }
});

//  定义 fetch 拦击器
const HOOK_CODE = (shopName) => {
  let shopBotStatus = null;
  // 获取用户咨询商品
  const getUserConsultGoods = async (messageId) => {
    const res = await fetch(
      `https://store.weixin.qq.com/shop/commkf/room?action=get_room_recommend_info`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json, text/plain, */*",
          biz_magic: key,
        },
        body: JSON.stringify({
          room_id: messageId,
        }),
      },
    ).then((res) => res.json());

    console.log("res", res);
    if (res?.base_resp?.ret == 0) {
      const productId = res?.recommend_product_infos[0].product_id;
      return productId;
    }
    return null;
  };
  // console.log('hook=========', shopName)
  window.addEventListener("message", (event) => {
    // console.log('message', event)
    if (event.data.type == "update-shop-bot-status") {
      shopBotStatus = event.data.data;
    }
  });
  const isBeforeTwoDays = (timestamp) => {
    const now = Date.now(); // 毫秒
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    return timestamp * 1000 < twoDaysAgo;
  };

  // 10000828165363
  setTimeout(() => {
    const dom = document.querySelector(".avatar-img");
    console.log("dom>>>>>>>", dom);
    if (dom) {
      dom.addEventListener("click", async (e) => {
        console.log("点击头像");
        const res = await getGoodInfo(10000144446518);
        console.log("获取商品信息", res);
      });
    }
  }, 3000);

  //  获取图片信息
  const getBase64ImageInfo = (base64) => {
    return new Promise((resolve, reject) => {
      // 1️计算大小（字节）
      const pureBase64 = base64.split(",")[1];
      const size = Math.ceil((pureBase64.length * 3) / 4); // bytes

      // 2️ 读取图片宽高
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size, // 字节
          sizeKB: (size / 1024).toFixed(2) + " KB",
        });
      };
      img.onerror = reject;
      img.src = base64;
    });
  };

  const sendImage = async (base64, userId, key) => {
    console.log("发送图片", base64, userId, key);
    if (!key || !userId || !base64) return; // 没有key值直接退出
    const imgSize = await getBase64ImageInfo(base64);
    console.log("图片信息", imgSize);

    const [header, data] = base64.split(",");
    const mime = header.match(/:(.*?);/)[1];

    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mime });
    const formData = new FormData();
    formData.append("image", blob, "image.png"); // 👈 这里不再用 file
    formData.append("msg_type", 2);
    console.log("获取 key", key);
    const cosUrl = await fetch(`https://store.weixin.qq.com/shop/commkf/cos_upload`, {
      method: "POST",
      credentials: "include",
      headers: {
        biz_magic: key,
      },
      body: formData, // 传入图片 binary
    }).then((r) => r.json());
    console.log("cosUrl", cosUrl);
    if (cosUrl?.cos_url) {
      fetch(`https://store.weixin.qq.com/shop/commkf/msg?action=send_room_msg`, {
        method: "POST",
        credentials: "include",
        headers: {
          biz_magic: key,
        },
        body: JSON.stringify({
          room_id: userId,
          msg_type: 2,
          msg_content: `{"name":"图片.jpg","ld_img":{"img_uri":{"url":"${cosUrl?.cos_url}","size":${imgSize.size},"aeskey":"","authkey":"","md5sum":""},"width":${imgSize.width},"height":${imgSize.height}},"hd_img":{"img_uri":{"url":"${cosUrl?.cos_url}","size":${imgSize.size},"aeskey":"","authkey":"","md5sum":""},"width":${imgSize.width},"height":${imgSize.height}}}`,
          extra_info: `{"head_img":"${shopInfo.logo}","nickname":"${shopInfo.username}"}`,
          send_source: 2,
          send_tools: 0,
          create_time_ms: Date.now(),
          imunion_msg_id: `mmec-commkf-v2-994433${Date.now()}`,
          client_ms: Date.now(),
          async_check_spam_stage: 1,
        }),
      });
    }
  };

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
   *    timerout,  //  超时时间  超时时间为 24小时  更具情况调整
   *  }
   *
   */
  let shopInfo = null;

  class UserByOrderDB {
    constructor() {
      this.db = null;
      this.DB_NAME = "userByOrderInfo";
      this.STORE_NAME = "value";
      this.VERSION = 1;
    }
    // 初始化 DB
    async init() {
      if (this.db) return this.db;

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

      return this.db;
    }
    // 新增 / 修改
    async save(data) {
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
  const myIndexDB = new UserByOrderDB();
  class Message {
    constructor(
      messageId,
      username,
      content,
      timeout,
      avatar,
      api = false,
      msg_id,
      send_openid,
      goodId,
      goodName,
      orderId,
      orderStatus,
    ) {
      this.messageId = messageId;
      this.username = username;
      this.timeout = timeout;
      this.avatar = avatar;
      this.content = content;
      this.api = api;
      this.msg_id = msg_id;
      this.send_openid = send_openid;
      this.goodId = goodId;
      this.goodName = goodName;
      this.orderId = orderId;
      this.orderStatus = orderStatus;
      this.type = "code";
    }
  }

  class Info {
    constructor(name, username, kf, logo, id) {
      this.name = name; // 店铺名称
      this.username = username; // 客服名称
      this.kf = kf; // 客服id
      this.logo = logo; // 店铺logo
      this.id = id; // 店铺id
    }
  }

  const formatTime = (t) => {
    const num = Number(t);
    return num > 1e12 ? Math.floor(num / 1000) : num;
  };

  const OriginalWebSocket = window.WebSocket;
  window.WebSocket = function (url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    // 更新状态并通知 preload

    // 拦截发送消息
    const originalSend = ws.send;
    ws.send = function (data) {
      originalSend.apply(this, arguments); // 调用原始 send 方法
    };
    ws.addEventListener("error", function (event) {
      console.info("wss断开");

      // window.context_bridge.send('wss-connect-close')
    });
    ws.addEventListener("open", function (event) {
      console.info("打开ws");

      // window.context_bridge.send('wss-connect-open')
    });
    ws.addEventListener("close", function (event) {
      console.info("WebSocket连接关闭");

      // window.context_bridge.send('wss-connect-close')
    });
    return ws; // 返回 WebSocket 实例
  };

  // 拦截规则配置 https://store.weixin.qq.com
  const interceptRules = [
    {
      name: "获取鉴权信息1",
      match: (method, url) =>
        method === "POST" && url.includes("/shop/commkf/room?action=get_room_info"),
      onResponse: (data, xhr, body) => {
        if (data?.base_resp?.ret === 3000) {
          console.log("cookie过期 鉴权失败=============", data);
          window.context_bridge.send("account-login-expired");
        }
      },
    },
    {
      name: "获取鉴权信息",
      match: (method, url) =>
        method === "POST" && url.includes("/shop/commkf/web?action=wss_login"),
      onResponse: (data, xhr, body) => {
        if (data.base_resp.ret === 3000) {
          console.log("cookie过期 鉴权失败=============", data);
          window.context_bridge.send("account-login-expired");
        }
      },
    },
    {
      name: "获取用户历史信息",
      match: (method, url) =>
        method === "POST" && url.includes("/shop/commkf/msg?action=get_room_msg"),
      onResponse: (data, xhr, body) => {
        const bodydata = JSON.parse(body);
        if (bodydata && bodydata.num == 30 && bodydata.op == 0) {
          // 将信息 发送出去
          const result = data.list || null;
          window.postMessage({
            type: "get-history-message",
            value: result,
          });
        }
      },
    },
    // {
    //   name: '获取用户来源',
    //   match: (method, url) =>
    //     method === 'POST' &&
    //     url.includes('/shop/commkf/room?action=get_room_recommend_info'),
    //   onResponse: (data, xhr, body) => {
    //     // console.log('用户来源=============', data)
    //     const {
    //       basic_info: { user_source_desc }
    //     } = data
    //     console.log('用户来源=============', user_source_desc)
    //   }
    // },
    // {
    //   name: '获取用户订单信息',
    //   match: (method, url) =>
    //     method === 'GET' && url.includes('/shop/kf/cgi/order/getOrderListV2'),
    //   onResponse: (data, xhr, body) => {
    //     // console.log('获取用户订单信息=============', data)
    //     const { orders } = data
    //     const params = new URLSearchParams(xhr._hook_url.split('?')[1])
    //     const roomId = params.get('roomId')
    //     const userOpenid = params.get('userOpenid')
    //     if (orders && orders.length > 0) {
    //       const order = orders[0]

    //       window.context_bridge.send('get-customer-message', {
    //         messageId: roomId,
    //         orderStatus: order.statusWording,
    //         orderId: order.orderId
    //       })

    //       window.postMessage({
    //         type: 'user-order',
    //         value: {
    //           orderStatus: order.statusWording,
    //           orderId: order.orderId
    //         }
    //       })
    //     } else {
    //       window.context_bridge.send('get-customer-message', {
    //         messageId: roomId,
    //         orderStatus: '暂无订单'
    //       })
    //       // window
    //       window.postMessage({
    //         type: 'user-order',
    //         value: {
    //           orderStatus: '暂无订单',
    //           orderId: null
    //         }
    //       })
    //     }
    //     // console.log('body=============', roomId, userOpenid)
    //     window.postMessage({
    //       type: 'user-order-key',
    //       value: {
    //         roomId,
    //         userOpenid
    //       }
    //     })
    //   }
    // },
    // 店铺状态
    {
      name: "店铺状态",
      match: (method, url) => method === "POST" && url == "/shop/commkf/acct?action=get_kf_acct",
      onResponse: (data, xhr, body) => {
        // const bodydata = JSON.parse(body)
        console.log("店铺状态=============", data);
        // 可以在这里处理响应数据
        const { kf_acct_info_list } = data;

        const resData = kf_acct_info_list[0];
        if (data.acct_num == "1") {
          shopInfo = new Info(
            resData.account_name,
            resData.nick_name,
            resData.openid,
            resData.account_head_url,
            resData.open_account,
          );
          window.postMessage({
            type: "get-shop-info",
            data: shopInfo,
          });
          console.log("shopInfo============", shopInfo);
        }

        // 判断扫码账号是 这个
        if (
          shopName &&
          shopName != "null" &&
          shopName != shopInfo.name &&
          !shopName.includes("未登录")
        ) {
          window.context_bridge.send("refresh-shop", shopName);
          window.location.replace("https://store.weixin.qq.com/shop/home?shopName=" + shopName);
        } else {
          window.context_bridge.send("get-shop-info", shopInfo);
          let status = null;
          switch (resData.status) {
            case "0":
              status = "离线";
              window.context_bridge.send("shop-status-change", { status });
              break;
            case "1":
              status = "在线";
              window.context_bridge.send("shop-status-change", { status });
              break;
            case "2":
              status = "忙碌";
              window.context_bridge.send("shop-status-change", { status });
              break;
          }
        }
      },
    },
    // 结束会话
    {
      name: "结束会话",
      match: (method, url) =>
        method === "POST" && url.includes("/shop/commkf/room?action=end_room"),
      onResponse: (data, xhr, body) => {
        const bodydata = JSON.parse(body);
        // const index = allMessageList.findIndex(i => i.messageId == bodydata.room_id)
        // if (index != -1) {
        //   allMessageList.splice(index, 1)
        // }
        console.log("结束会话");
        // window.context_bridge.send('reply-customer-message', {
        //   messageId: bodydata.room_id
        // })
      },
    },
    // 删除信息
    {
      name: "删除信息",
      match: (method, url) =>
        method === "POST" && url.includes("/shop/commkf/msg?action=send_room_msg"),
      onResponse: (data, xhr, body) => {
        const bodydata = JSON.parse(body);
        console.info("删除信息", bodydata);
        let content = null;
        try {
          const msgContent = bodydata?.msg_content;
          const parsed = typeof msgContent === "string" ? JSON.parse(msgContent) : msgContent;
          content = parsed?.content || null;
        } catch (e) {
          console.warn("解析 msg_content 失败", e, bodydata);
        }
        window.context_bridge.send("reply-customer-message", {
          messageId: bodydata?.room_id,
          content,
        });
      },
    },
    // 获取同步消息
    {
      name: "获取同步消息",
      match: (method, url) =>
        method === "POST" && url.includes("/shop/commkf/msg?action=get_sync_msg"),
      onResponse: (data, xhr) => {
        const { list } = data;
        if (list && list.length > 0) {
          // console.log('获取同步消息', list)
          list.forEach(async (item) => {
            // console.log('item', item, item.msg_direction, item.msg_type)
            // const cont = JSON.parse(item.extra_info)
            // if(cont?.unread_msg_num){
            //   console.log('判断1进入', item , item.msg_direction )
            // }
            // if (
            //   item.msg_kf_content.includes('AcceptRoom') ||
            //   (item.session_id != 0 && item.recv_openid !== item.send_openid) ||
            //   ![2, 3].includes(item.msg_direction)
            // ) {

            const cont = JSON.parse(item.extra_info);
            const msg = JSON.parse(item.msg_kf_content);
            // console.log('cont msg =======', cont , msg)
            if (cont?.unread_msg_num || msg?.summary_content) {
              // get-customer-message-list  msg_type 24  msg_kf_content : "{\"type\":\"SessionTimeoutRedDot\",\"content\":\"你已超过90秒未回复该会话，请及时处理   保留该字段 可能会在判断使用 作为 AI发送兜底方案
              let goodId = "";
              let goodName = "";
              let orderId = "";
              let orderStatus = "";
              if (msg.type === 13) {
                const goodRes = JSON.parse(msg.content || "{}");
                console.log("goodRes", goodRes);
                content = "用户发送商品";
                goodId = goodRes.product_id;
                goodName = goodRes.product_title;
              } else if (msg.type === 14) {
                // 订单信息
                const orderRes = JSON.parse(msg.content || "{}");
                console.log("orderRes", orderRes);
                content = "用户发送订单";
                orderId = orderRes?.order_id || "";
                orderStatus = orderRes?.state_wording || "";
              } else if (msg.hd_img || msg.img_uri) {
                content = "用户发送了图片";
              } else if (msg.video_uri) {
                content = "用户发送了视频";
              } else if (msg.mp3_voice_buf) {
                content = msg.translated_word || "语音消息";
              } else if (msg.content) {
                try {
                  const parsed = JSON.parse(msg.content);
                  content = parsed.content || msg.content;
                } catch {
                  content = msg.content;
                }
              }
              // console.log('item', item)
              // console.log('content', content)
              // console.log('cont', cont)
              const timer = Number(item.update_time) + 180;
              let params = new Message(
                item.room_id,
                cont.nickname,
                content,
                timer,
                cont.head_img,

                true, // api 你自己决定是否 true/false
                item.msg_id,
                item.send_openid,
                goodId,
                goodName,
                orderId,
                orderStatus,
              );
              // if (shopBotStatus == 1) {
              let orderInfo = new OrderByUserInfo(params);
              const dbValue = await myIndexDB.get(params.messageId);
              console.log("dbValue==========", dbValue);
              let needUpdate = false;
              let refreshType = null; // 'orderId' | 'goodId' | null

              if (dbValue) {
                params = new OrderFromDB(params, dbValue);
                // 判断是否需要更新，并区分变化类型
                if (params.orderId && params.orderId !== dbValue.orderId) {
                  needUpdate = true;
                  refreshType = "orderId";
                } else if (params.goodId && params.goodId !== dbValue.goodId) {
                  needUpdate = true;
                  refreshType = "goodId";
                } else if (params.orderStatus && params.orderStatus !== dbValue.orderStatus) {
                  needUpdate = true;
                  refreshType = "orderStatus";
                }
                // 根据不同的变化类型处理接口和数据
                if (refreshType === "orderId") {
                  console.log("订单ID发生变化，刷新订单详情");
                  const orderResult = await getOrderInfo(params.orderId);
                  if (orderResult) {
                    params.orderStatus = orderResult.orderStatus || "";
                    params.orderId = orderResult.orderId || "";
                  }
                  orderInfo = new OrderByUserInfo(params); // 重新赋值
                } else if (refreshType === "goodId") {
                  console.log("商品ID发生变化，刷新商品详情");
                  const data = await getGoodInfo(params.goodId);
                  // console.log
                  console.log("data==========", data);
                  params.sku = data?.goods_sku || "";
                  params.goodInfo = data?.goods_properties + "" + data?.goods_sku;
                  params.goodName = data?.goods_name || "";
                  orderInfo = new OrderByUserInfo(params); // 重新赋值
                } else if (refreshType === "orderStatus") {
                  console.log("订单状态发生变化，刷新订单状态");
                  // orderStatus 改变，可以根据需求决定是否额外处理
                  const orderResult = await getOrderInfo(params.orderId);
                  if (orderResult) {
                    params.orderStatus = orderResult.orderStatus || "";
                    params.orderId = orderResult.orderId || "";
                  }
                  orderInfo = new OrderByUserInfo(params); // 重新赋值
                }
                // console.log('订单详情数据==========', orderInfo)
                // 保存到数据库
                if (needUpdate) {
                  await myIndexDB.save(orderInfo);
                }
              } else {
                // console.log('params=====', params)
                console.log("!params.orderId && params.goodId", !params.orderId, params.goodId);
                // 缓存不存在，默认请求订单接口
                if (!params.orderId && params.goodId) {
                  const data = await getGoodInfo(params.goodId);
                  console.log("data==========", data);
                  params.goodInfo = data?.goods_properties + "" + data?.goods_sku;
                  params.sku = data?.goods_sku || "";
                  params.goodName = data?.goods_name || "";
                } else if (!params.goodId && !params.orderId) {
                  console.log("无商品ID无订单ID");
                  params.goodId = await getUserConsultGoods();
                }
                // 直接请求接口
                const orderResult = await getuserOrderListHook(
                  params.messageId,
                  params.send_openid,
                );
                console.log("orderResult==========", orderResult);
                if (orderResult) {
                  params.orderStatus = orderResult.orderStatus || "";
                  params.orderId = orderResult.orderId || "";
                  // params.Cat = orderResult?.goodCat || ''
                  // params.goodInfo =
                  //   (orderResult.goodInfo || '') +
                  //   orderResult?.goodCat +
                  //   orderResult?.sku
                  // params.goodName = orderResult.goodInfo || ''
                  params.goodId = orderResult.goodId || "";
                  // params.sku = orderResult.sku || ''
                }
                // 发送请求并等待代码注入层返回订单结果，设置5秒超时
                orderInfo = new OrderByUserInfo(params);
                await myIndexDB.save(orderInfo);
                params = new OrderFromDB(params, orderInfo);
              }
              // }
              params.type = "code";
              console.log("message=============", item, params, params.content);
              window.context_bridge.send("get-customer-message-list", [params]);
            }
          });
        }
        // 可以在这里处理响应数据
      },
    },
    {
      name: "初始化页面消息列",
      match: (method, url) =>
        method === "POST" && url.includes("/shop/commkf/summary?action=get_session_summary"),
      onResponse: (data, xhr) => {
        console.log("data==========", data);
        if (data) {
          data.summary_list.forEach(async (item) => {
            if (!item.lastest_msg_kf_content) {
              //   跳过
              return;
            }
            const lastest_msg_kf_content = JSON.parse(item.lastest_msg_kf_content);
            if (
              item.unreplied_msg_time != "0" &&
              lastest_msg_kf_content?.type != "EndRoom" &&
              !isBeforeTwoDays(item.update_time)
            ) {
              cont = JSON.parse(item.extra_info);
              const { content } = lastest_msg_kf_content;
              console.log("item==========", item);
              const orderResult = await getuserOrderListHook(item.room_id, item.send_openid);
              console.log("orderResult==========", orderResult);
              let params = new Message(
                item.room_id,
                cont.nickname,
                content,
                formatTime(item.unreplied_msg_time) + 180,
                cont.head_img,
                true, // api 你自己决定是否 true/false
                item.lastest_msg_id,
                item.send_openid,
              );
              params.goodId = orderResult?.goodId || "";
              params.goodName = orderResult?.goodInfo || "";
              params.goodCat = orderResult?.goodCat || "";
              params.goodInfo =
                (orderResult?.goodInfo || "") + orderResult?.goodCat + orderResult?.sku;
              params.orderStatus = orderResult?.orderStatus || "";

              console.log("params=====", params, orderResult?.sku);
              window.context_bridge.send("get-customer-message-list", [params]);
            }
          });
        }
      },
    },
  ];

  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  // 重写 open
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    // this._hook_url = url
    // this._hook_method = method
    // 查找匹配的拦截规则
    // console.log('url=============', method, url)
    this._hook_rule = interceptRules.find((rule) => rule.match(method, url));
    return origOpen.call(this, method, url, ...rest);
  };

  // 重写 send
  XMLHttpRequest.prototype.send = function (body) {
    const rule = this._hook_rule;

    if (rule) {
      // console.log(`[拦截] ${rule.name}`, this._hook_method, this._hook_url)

      // 保存 body，供响应回调使用
      this._hook_body = body;

      // 处理请求
      if (rule.onRequest) {
        body = rule.onRequest(body);
      }

      // 保存原始回调
      const origOnReady = this.onreadystatechange;
      this.onreadystatechange = function (...args) {
        if (this.readyState === 4 && rule.onResponse) {
          try {
            const data = JSON.parse(this.responseText);
            if (data?.base_resp?.ret == 30000) {
              console.log("登录过期", data);
              window.context_bridge.send("account-login-expired");
            }
            // 将 body 也传递给 onResponse
            // console.log('data=====', data)
            if (data?.base_resp.ret == 30000) {
              console.log("登录过期", data);
              window.context_bridge.send("account-login-expired");
            }
            rule.onResponse(data, this, this._hook_body);
          } catch (err) {
            console.error(`[拦截错误] ${rule.name}:`, err);
          }
        }
        if (origOnReady) origOnReady.apply(this, args);
      };
    }
    return origSend.call(this, body);
  };
  window.addEventListener("message", (event) => {
    // console.log('message', event)
    if (event.data && event.data.type === "WS_STATE_CHANGE") {
      wsConnectState = event.data.state;
    } else if (event.data.type === "sendProduct") {
      const roomId = event.data.value.messageId; // 房间id  会话id
      const msgId = event.data.value.msgId; // 消息id
    } else if (event.data.type === "get-key") {
      console.log("get-key", event.data.value);
      window._key = event.data.value;
    } else if (event.data.type == "select-user") {
      fetch(`https://store.weixin.qq.com/shop/commkf/summary?action=update_room_cursor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_id: "4443520799768133636",
          max_receive_msg_id: "4443560955230109704",
          max_seen_msg_id: "4443560955230109704",
        }),
      });
    } else if (event.data.type === "send-message") {
      // 发送消息
      console.log("send-message=============", event.data, window._key);
      fetch("https://store.weixin.qq.com/shop/commkf/msg?action=send_room_msg", {
        method: "POST",

        headers: {
          "Content-Type": "application/json, text/plain",
          biz_magic: window._key,
        },
        body: JSON.stringify({
          room_id: `${event.data.data.messageId}`,
          msg_type: 1,
          msg_content: `{"content":"${event.data.data.content}"}`,
          extra_info: `{"head_img":"${shopInfo.logo}","nickname":"${shopInfo.username}"}`,
          send_source: 2,
          send_tools: 0,
          create_time_ms: Date.now(),
          imunion_msg_id: `mmec-commkf-v2-994433${Date.now()}`, // 模拟参数
          client_ms: Date.now(),
          async_check_spam_stage: 1,
        }),
      });
    } else if (event.data.type === "send-image") {
      const data = event.data.data;
      console.log("send-image=============", event.data, window._key);
      sendImage(data.base64, data?.userId || data?.messageId, data.key || window._key);
    }
  });

  class OrderByUserInfo {
    constructor(obj) {
      this.id = obj.messageId;
      this.orderId = obj.orderId;
      // this.ordersku = obj.ordersku || ''
      this.orderStatus = obj.orderStatus;
      // this.orderInfo = obj.orderInfo || ''
      this.goodId = obj.goodId;
      this.goodName = obj.goodName || "";
      this.goodInfo = obj.goodInfo || "";
      this.sku = obj.sku || "";
      this.InfoTimerout = Date.now();
    }
  }

  // 合并数据库值的类，有值就用params的，没有就补充dbValue的
  class OrderFromDB {
    constructor(params, dbValue) {
      // 先复制params的所有字段
      Object.assign(this, params);
      // 遍历dbValue，如果params中该字段为空，就用dbValue的值填充
      for (const key in dbValue) {
        if (dbValue[key]) {
          // 检查params中该字段是否为空（空字符串、null、undefined）
          const myValue = this[key];
          if (myValue === "" || myValue === null || myValue === undefined) {
            this[key] = dbValue[key];
          }
        }
      }
    }
  }

  // 根据商品id获取商品信息
  async function getGoodInfo(goodId) {
    console.log("获取商品详情，goodId=", goodId, window._key);
    if (window._key) {
      try {
        const res = await fetch(
          `https://store.weixin.qq.com/shop-faas/mmchannelstradeproductcore/cgi/goods/getEditProductV2?token=&lang=zh_CN&productKey=%7B%22productId%22:${goodId}%7D&needRealStock=true&preview=false&release=false
`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              biz_magic: window._key || "",
            },
          },
        ).then((res) => res.json());
        console.log("商品详情数据==========", res);
        if (res.success) {
          const info = res.product.info;
          let goodSku = null;
          // 安全检查 productSaleAttrs 是否存在
          if (res.product.productSkus && Array.isArray(res.product.productSkus)) {
            goodSku = formatGoodSku(res.product.productSkus);
            console.log("商品sku==========", goodSku);
          }
          const product = {
            goodId: goodId, //商品id
            goodName: info.title, //商品名称
            goodProperties: info.param ? formatCategory(info.param) : [], //属性
            goodSku: goodSku,
            goodCat: info?.recommendCategory?.categoryNames.join("/"),
            mainImage: info.productHeadimgInfo[0].imgUrl,
            detailImages: info.detail.detailImg,
          };
          console.log("商品详情数据==========", product);
          return product;
        } else {
          return null;
        }
      } catch (error) {
        console.error("获取商品详情失败", error);
      }
    }
  }
  // 主动请求获取用户订单
  const getuserOrderListHook = async (room_id, send_openid) => {
    const res = await fetch(
      `https://store.weixin.qq.com/shop/kf/cgi/order/getOrderListV2?tabType=0&userOpenid=${send_openid}&roomId=${room_id}&lastIndex=${0}&pageSize=${10}&pageNum=${1}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
    const data = await res.json();
    let order = {
      orderStatus: "暂无订单",
      orderId: "",
      goodInfo: "",
      goodId: "",
      sku: "",
      goodCat: "",
    };
    console.log("主动请求用户的订单", data);
    if (data.orders?.length) {
      const firstOrder = data.orders[0];
      const product = firstOrder?.orderInfo?.orderProductInfo?.[0];
      const Info = product?.extInfo;
      order.orderStatus = firstOrder?.statusWording || "暂无订单";
      order.orderId = firstOrder?.orderId || "";
      console.log("订单详情数据==========", Info);
      if (Info) {
        // order.goodInfo = Info.title || ''
        order.goodId = product?.productId || "";

        // 安全 + 高效拼接
        // order.sku = (Info.saleParam || [])
        //   .map((item) => {
        //     const c0 = item.categorys?.[0]?.name || ''
        //     const c1 = item.categorys?.[1]?.name || ''
        //     return c0 && c1 ? `${c0}:${c1}` : ''
        //   })
        //   .filter(Boolean)
        //   .join(',')
      }
      if (order.orderId) {
        const goodItem = await getGoodInfo(order.goodId);
        console.log("goodItem", goodItem);
        // order.goodCat = goodItem?.goods_properties || ''
      }
    }
    console.log("返回的 订单", order, order.orderStatus);

    return order;
  };

  // 根据orderId获取用户订单
  const getOrderInfo = async (room_id, send_openid, orderId) => {
    const res = await fetch("https://store.weixin.qq.com/shop/kf/cgi/order/searchOrderV2", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        keyword: orderId,
        lastIndex: "0",
        pageNum: 1,
        pageSize: 10,
        roomId: room_id,
        userOpenid: send_openid,
        tabType: 0,
      }),
    }).then((res) => res.json());
    if (res?.orders) {
      console.log("订单详情数据==========", res);
      return {
        orderId,
        orderStatus: res.orders[0].statusWording,
      };
    }
  };
  // 属性处理
  function formatCategory(data) {
    return data
      .map((item) => {
        const cats = item.categorys;
        if (!Array.isArray(cats) || cats.length < 2) return null;

        const key = cats[0]?.name?.trim();
        const val = cats[1]?.name?.trim();

        if (!key || !val) return null;
        return `${key}:${val}`;
      })
      .filter(Boolean);
  }

  // 获取商品 sku 工具函数
  function formatGoodSku(data) {
    const specMap = new Map();
    console.log("商品sku数据==========", data);
    data.forEach((item) => {
      const saleParams = item?.productSkuInfo?.saleParam || [];

      saleParams.forEach((param) => {
        const categorys = param.categorys || [];

        if (categorys.length < 2) return;

        const specName = categorys[0]?.name;
        const specValue = categorys[1]?.name;

        if (!specName || !specValue) return;

        if (!specMap.has(specName)) {
          specMap.set(specName, new Set());
        }

        specMap.get(specName).add(specValue);
      });
    });

    return {
      goodSku: [...specMap.entries()].map(([key, values]) => `${key}:${[...values].join("/")}`),
    };
  }
};

// 写入拦截器
webFrame.executeJavaScript(`(${HOOK_CODE})('${shop_Name}');`);

safeIpcOn("click-customer-message", async (_, arg) => {
  console.log("跳转用户", arg);
  const { messageId, username, avatar } = arg;
  // window.postMessage({ type: 'click-user', data: messageId })

  getUnReplyMessage(messageId, username, avatar);
});

let isProcessing = false; //处理完成 标识
//  ai兜底回复处理
safeIpcOn("reply-message", async (_, arg) => {
  console.log("ai兜底回复处理", arg);
  // if (arg.username !== '轻语.') return
  try {
    let data = [];
    // 是不是对象
    if (typeof arg === "object") {
      data = [arg];
    } else {
      const sendlist = JSON.parse(arg);
      data = sendlist;
    }
    processNextMessage(data);
  } catch {
    if (arg.isBottomLineAutoReply) {
      processNextMessage([arg]);
    }
  }
});
// 串行处理消息
let message = null;
const processNextMessage = async (sendlist) => {
  message = sendlist.shift();
  const tdata = Array.isArray(message) ? message[0] : message;
  if (tdata) {
    if (tdata?.imageBase64) {
      window.postMessage({
        type: "send-image",
        data: {
          base64: tdata?.imageBase64,
          userId: tdata.userId || tdata?.messageId,
          key,
        },
      });
      await delay(500);
    }
    window.postMessage({
      type: "send-message",
      data: {
        messageId: tdata.messageId,
        content: tdata.replyContent,
      },
    });
    await delay(500);
    ipcRenderer.send("get-customer-callback-result", {
      ...tdata,
      isAiInviteReply: tdata.isAiInviteReply,
      isReminderReply: tdata.isReminderReply,
      isBottomLineAutoReply: tdata.isBottomLineAutoReply,
      isAiAutoReply: !tdata.isBottomLineAutoReply,
    });
  }
};
//  发送处理信息
const handleReplyMessage = async (message) => {
  // const { messageId } = arg
  console.log("需要处理信息==========", message);
  const isSuccess =
    document.querySelector(".chat-customer-name")?.textContent == message.username ||
    (await getUnReplyMessage(message.messageId, message.username, message.avatar));
  console.log("isSuccess", isSuccess);
  if (isSuccess) {
    const editdom = document.querySelector("#input-textarea");
    console.log("进入会话页面成功", editdom);

    // 如果有图片，先发送图片
    if (message.imageBase64 || message.imageUrl) {
      console.log("[handleReplyMessage] 检测到图片数据，开始发送图片");
      try {
        await sendImageMessage(
          message.messageId,
          message.imageBase64,
          message.imageMimeType,
          message.imageUrl,
        );
        console.log("[handleReplyMessage] 图片发送成功");
        await delay(500); // 图片发送后等待一下
      } catch (error) {
        console.error("[handleReplyMessage] 图片发送失败:", error);
      }
    }

    // 如果是纯图片消息，不需要发送文本
    if (message.isImageOnly) {
      console.log("[handleReplyMessage] 纯图片消息，跳过文本发送");
      return true;
    }

    // 如果没有文本内容，直接返回
    if (!message.content || message.content.trim() === "") {
      console.log("[handleReplyMessage] 无文本内容，跳过");
      return true;
    }

    editdom.focus();
    editdom.value = message.content;
    editdom.dispatchEvent(new Event("input", { bubbles: true }));
    // 绑定回车
    editdom.dispatchEvent(eventKey);
    await delay(200); //
    //  预留 严格获取是否发送成功
    if (editdom.value) {
      return false;
    } else {
      return true;
    }
  } else {
    // console.log('未进入会话页面 , 启用搜索功能')
    //  找到搜索输入框
    const inputDom = document.querySelector(".weui-desktop-form__input");
    // console.log('inputDom', inputDom)
    inputDom.value = message?.orderId || message.username;
    // 主动触发 input事件
    inputDom.dispatchEvent(new Event("input", { bubbles: true })); // 触发input冒泡
    const panel = await getElementRecursive(".result-panel", 20, 50);
    // console.log('.result-panel', panel)
    await delay(500);
    const thatUserAvatar = panel.querySelector(`[data-src="${message.avatar}"]`);
    // console.log('thatUserAvatar', thatUserAvatar)
    thatUserAvatar.click();
    // result-panel
    await delay(500); // 等待dom
    const isSuccess =
      document.querySelector(".chat-customer-name")?.textContent == message.username;
    // console.log('isSuccess', isSuccess)
    if (isSuccess) {
      const editdom = document.querySelector("#input-textarea");
      // console.log('进入会话页面成功2', editdom)

      // 如果有图片，先发送图片
      if (message.imageBase64 || message.imageUrl) {
        console.log("[handleReplyMessage] 检测到图片数据，开始发送图片(搜索路径)");
        try {
          await sendImageMessage(
            message.messageId,
            message.imageBase64,
            message.imageMimeType,
            message.imageUrl,
          );
          console.log("[handleReplyMessage] 图片发送成功");
          await delay(500);
        } catch (error) {
          console.error("[handleReplyMessage] 图片发送失败:", error);
        }
      }

      // 如果是纯图片消息，不需要发送文本
      if (message.isImageOnly) {
        console.log("[handleReplyMessage] 纯图片消息，跳过文本发送");
        return true;
      }

      // 如果没有文本内容，直接返回
      if (!message.content || message.content.trim() === "") {
        console.log("[handleReplyMessage] 无文本内容，跳过");
        return true;
      }

      editdom.focus();
      editdom.value = message.content;
      editdom.dispatchEvent(new Event("input", { bubbles: true }));
      // 绑定回车
      editdom.dispatchEvent(eventKey);
      await delay(200); //
      //  预留 严格获取是否发送成功
      if (editdom.value) {
        return false;
      } else {
        return true;
      }
    }
  }
};
//  是否开启 ai
safeIpcOn("update-shop-bot-status", (_, data) => {
  console.log("收到店铺bot状态更新:", data);
  shopBotStatus = data.botStatus;
  window.postMessage({ type: "update-shop-bot-status", data: shopBotStatus });
});

// 获取用户订单
const getUserOrderInfo = async (messageId) => {
  return new Promise((resolve) => {
    try {
      window.addEventListener("message", (event) => {
        if (event.data.type === "user-order") {
          resolve(event.data.value);
          // console.log('event.data.value>>>>>>>>>', event.data.value)
        }
      });
      setTimeout(() => {
        const dom = document.querySelector(".order-status");
        // console.log('dom>>>>>>>>>', dom)
        const orderId = dom.querySelector(".order-id-wrap .num");
        if (dom && orderId) {
          const status = dom.getAttribute("data-wording");
          // console.log('status>>>>>>>>>', status)
          resolve({
            orderStatus: status,
            orderId: orderId.textContent.trim(),
          });
        } else {
          console.log("未获取到订单状态");
          resolve({
            orderStatus: "暂无订单",
            orderId: null,
          });
        }
      }, 3000);
    } catch (error) {
      resolve({
        orderStatus: "暂无订单",
        orderId: null,
      });
    }
  });
};

//  进入对应用户
const getUnReplyMessage = async (messageId, username, avatar) => {
  const targetDom = document.querySelector(`[data-room-id="${messageId}"]`);
  // console.log('targetDom=============', targetDom)
  // chat-customer-name
  // if ()
  // 进入会话页面
  if (targetDom) {
    targetDom.click();
    console.log("listener", targetDom.onclick);
    return true;
  } else {
    const kfbtn = document.querySelector(".menu-list-tab");
    console.log("kfbtn=============", kfbtn);
    if (!kfbtn) return;
    kfbtn.click();
    // await delay(500)
    const targetDom = document.querySelector(`[data-room-id="${messageId}"]`);
    // console.log('targetDom=============', targetDom)
    if (targetDom) {
      targetDom.click();
      return true;
    } else {
      const title = document.querySelector(".chat-customer-name");
      if (title && title?.textContent == username) return;
      const inputdom = document.querySelector(".weui-desktop-form__input");
      if (inputdom) {
        inputdom.value = username;
        inputdom.dispatchEvent(new Event("input", { bubbles: true }));

        // const url = avatar
        //   .replace(/^https?:/, '') // 去掉 http: 或 https:
        //   .replace(/\/\d+$/, '/0') // 尺寸统一改为 /0
        // console.log('url=============', url)
        const tempobserver = new MutationObserver((mutationsList) => {
          for (let mutation of mutationsList) {
            const thatUserAvatar = document.querySelector(`[data-src="${avatar}"]`);

            if (thatUserAvatar) {
              thatUserAvatar.click();
              tempobserver.disconnect();
            }
          }
        });
        tempobserver.observe(document.body, { childList: true, subtree: true });
      }
    }
  }
  return false;
};

// 工具函数: 防抖
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

document.addEventListener("mousemove", () => {
  if (windowHasFocus && shopBotStatus == 1) {
    lastMouseActivity = Date.now();
    isUserOperating = true;
    // console.log('鼠标移动 - 用户正在操作')
  }
});

document.addEventListener("mousedown", () => {
  if (windowHasFocus && shopBotStatus == 1) {
    lastMouseActivity = Date.now();
    isUserOperating = true;
    // console.log('鼠标按下 - 用户正在操作')
  }
});

document.addEventListener("mouseup", () => {
  if (windowHasFocus && shopBotStatus == 1) {
    lastMouseActivity = Date.now();
    isUserOperating = true;
    // console.log('鼠标释放 - 用户正在操作')
  }
});
window.addEventListener("focus", () => {
  // console.log('获得焦点')
  windowHasFocus = true;
});

window.addEventListener("blur", () => {
  // console.log('失去焦点 - 停止用户操作检测，清除定时器')
  windowHasFocus = false;
  isUserOperating = false;
  // 页面失去焦点时删除定时器
  stopUserActivityTimer();
});

// 启动用户活动检查定时器
function startUserActivityTimer() {
  // 如果定时器已经存在，先清除
  if (userActivityTimer) {
    // console.log('清除已存在的用户活动检查定时器')
    clearInterval(userActivityTimer);
  }

  // console.log('启动用户活动检查定时器')
  // 启动新的定时器
  userActivityTimer = setInterval(() => {
    const timeSinceLastActivity = Date.now() - lastMouseActivity;
    if (timeSinceLastActivity > USER_ACTIVITY_TIMEOUT) {
      if (isUserOperating) {
        // console.log(`用户停止操作 - 距离上次活动: ${timeSinceLastActivity}ms`)
        isUserOperating = false;
      }
    }
  }, 1000);
}

// 停止用户活动检查定时器
function stopUserActivityTimer() {
  if (userActivityTimer) {
    // console.log('停止用户活动检查定时器')
    clearInterval(userActivityTimer);
    userActivityTimer = null;
  }
}

function getHttpAccountPassword() {
  const urlObject = new URL(window.location.href);
  // 先尝试从直接URL参数获取
  const redirectParams = new URLSearchParams(urlObject.search);
  let shopName = redirectParams.get("shopName");
  // 如果直接参数中没有，尝试从redirect_url中获取
  // console.log('shopName>>>>>>>>>1', shopName)
  return {
    shopName,
  };
}

// 实时质检
const threeMinResponseTime = () => {
  const run = async () => {
    try {
      // 当前时间
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
      // 今天 23:59:59
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const endTimestamp = Math.floor(endOfDay.getTime() / 1000);
      const res = await fetch(
        `${mainUrl}shop/kf/cgi/data/getRealTimeKf?beginDate=${startTimestamp}&endDate=${endTimestamp}`,
      );
      const data = await res.json();
      // console.log('threeMinResponseTime', data)
      const { cardResp } = data;
      if (cardResp.objects.tableValueLine) {
        const resdata = cardResp.objects.tableValueLine[0]?.columnValue || [];
        console.log("100 - resdata[6]", {
          responseRateWithinThreeMin: Math.round(resdata[3] * 100) + "%",
          averageRate: resdata[4] + "秒",
          dissatisfiedRate: resdata[6] == "NaN" ? 0 + "%" : 100 - resdata[6] + "%",
          inquiryCount: resdata[1] + "人",
        });
        ipcRenderer.send("get-quality-testing", {
          responseRateWithinThreeMin: Math.round(resdata[3] * 100) + "%",
          averageRate: resdata[4] + "秒",
          dissatisfiedRate: resdata[6] == "NaN" ? 0 : 100 - resdata[6] + "%",
          inquiryCount: resdata[1] + "人",
        });
      } else {
        ipcRenderer.sendToHost("get-quality-testing", {
          responseRateWithinThreeMin: 0,
          averageRate: 0,
          dissatisfiedRate: 0,
          inquiryCount: 0,
        });
      }
      //  主动续期  3分钟向服务器发送 用户操作信息 让服务器主动续期
      fetch(`https://store.weixin.qq.com/shop/kfreport/cgi/mmdata`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            actionId: "a07",
            actionType: 1,
            kfClient: 2,
            moduleId: 203,
            subModuleId: 2031,
          },
        ]),
      })
        .then((res) => res.json())
        .then((res) => {
          console.log("模拟操作强行续期", res);
        });
    } catch (err) {
      console.log("质检报错信息", err);
    } finally {
      console.log("质检定时器执行");
      // 定时再次执行
      setTimeout(run, threeMinResponse);
    }
  };
  //  第一次立即执行
  run();
};
// 一键上下线
safeIpcOn("change-shop-status", (_, shop_status) => {
  console.log("change-shop-status", shop_status);
  let status = null;
  switch (shop_status) {
    case "online":
      status = 1;
      break;
    case "offline":
      status = 0;
      break;
    case "busy":
      status = 2;
      break;
  }

  if (status !== null)
    fetch(`${mainUrl}shop/commkf/acct?action=update_kf_acct`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        status,
      }),
    });
});

// 心跳请求处理 - 返回当前店铺状态
safeIpcOn("request-heartbeat", async () => {
  // 视频号的状态通过 currentShopStatus 变量获取
  let status = "";
  let domExists = true;
  const dom = document.querySelector(".account-status-icon");
  try {
    const data = await fetch("https://store.weixin.qq.com/shop/commkf/acct?action=get_kf_acct", {
      method: "POST",
      credentials: "include",
    }).then((res) => res.json());

    // 可以在这里处理响应数据
    const { kf_acct_info_list } = data;

    const resData = kf_acct_info_list[0];
    switch (resData.status) {
      case "0":
        status = "离线";
        break;
      case "1":
        status = "在线";
        break;
      case "2":
        status = "忙碌";
        break;
    }
  } catch (err) {
    // 降级用dom处理
    if (dom) {
      const clalist = dom.getAttribute("class");
      if (clalist.includes("offline")) {
        status = "离线";
      } else if (clalist.includes("on-break")) {
        status = "忙碌";
      } else {
        status = "在线";
      }
    }
  } finally {
    // 获取 API 健康状态
    const apiHealthy = apiHealthMonitor.isHealthy();
    const avatar = document.getElementsByClassName("avatar-wrap");
    const domExists = avatar ? true : false;
    // 发送健康检测响应
    ipcRenderer.send("heartbeat-response", {
      status,
      apiHealthy,
      webSocketState: wsConnectState,
      domExists: domExists,
    });
  }
});

safeIpcOn("get-shop-user", gethistoryMessage); // 获取用户历史信息

// 获取用户历史信息
async function gethistoryMessage(_, data) {
  console.log("接收发送过来的信息 get-shop-user", data);
  // 主动请求
  const editdom = document.querySelector("#input-textarea");
  console.log("editdom", editdom);
  let userIsOperating = (windowHasFocus && isUserOperating) || (editdom && editdom.value);
  //  先判断用户是否正在操作
  if (userIsOperating) {
    ipcRenderer.send("get-shop-isuser-status", {
      hasContent: userIsOperating,
    });
    console.log("用户正在操作");
    return; //停止向下
  }
  console.log("开始获取");

  ipcRenderer.send("get-shop-isuser-status", { hasContent: false });

  let historyMessageString = { ...data, history: [] };
  const isSuccess = await getUnReplyMessage(data.messageId, data.username, data.avatar); // 跳转对应用户
  if (isSuccess) {
    console.log("进入会话页面成功");

    let historyMessage = await getUrlHistoryMessage(); // 获取用户历史信息
    const orderlistFrist = await getUserOrderInfo(data.messageId); // 获取用户订单状态

    if (historyMessage) {
      // 从拦截中获取
      historyMessage = historyMessage.filter(
        (item) => item.client_ms !== "0" && item.create_time_ms !== "0",
      ); // 过滤信息
      //
      let orderStatus = null;
      let orderId = null;
      const matchedMessage = historyMessage.find((item) => {
        try {
          const content = JSON.parse(item.msg_kf_content.content);
          return content.order_id && content.state_wording;
        } catch (err) {
          // 如果不是 JSON 就直接跳过
          return false;
        }
      });
      if (matchedMessage) {
        const content = JSON.parse(item.msg_kf_content.content);
        orderId = content?.order_id;
        orderStatus = content?.state_wording;
      }

      const indx = historyMessage.findIndex((item) => item.send_open_account); // 返回信息索引
      const urlHistoryMessage = indx >= 0 ? historyMessage.slice(0, indx) : []; // 截取信息
      const result = urlHistoryMessage.map((item) => {
        // 处理数据
        const content = JSON.parse(item.msg_kf_content)?.content || "";
        if (content) {
          console.log("item=========>", item);
          return {
            content,
            role: "user",
            time: item.create_time_ms || data.timeout,
            username: JSON.parse(item.extra_info).nickname || data.username,
            messageId: item.room_id || data.messageId,
            orderStatus: orderStatus || orderlistFrist?.orderStatus || "",
            orderId: orderId || orderlistFrist?.orderId || "",
            msg_id: item?.msg_id,
          };
        }
      });
      // console.log('result=========>', result)
      historyMessageString.history = result;

      ipcRenderer.send("get-historical-records", JSON.stringify(historyMessageString)); // 使用接口数据
      return; //停止向下
    }
    historyMessageString = await getDomHistoryMessage(data);
    if (historyMessageString.history.length == 0) {
      let historyMessage = await getuserHistoryMessage(data.messageId, data.msg_id);
      const orderInfo = await getuserOrderList(data.messageId, data.send_openid);

      historyMessage = historyMessage.filter(
        (item) => item.client_ms !== "0" && item.create_time_ms !== "0",
      ); // 过滤信息
      //
      let orderStatus = null;
      let orderId = null;
      const matchedMessage = historyMessage.find((item) => {
        try {
          const content = JSON.parse(item.msg_kf_content.content);
          return content.order_id && content.state_wording;
        } catch (err) {
          // 如果不是 JSON 就直接跳过
          return false;
        }
      });
      if (matchedMessage) {
        const content = JSON.parse(item.msg_kf_content.content);
        orderId = content?.order_id;
        orderStatus = content?.state_wording;
      }

      const indx = historyMessage.findIndex((item) => item.send_open_account); // 返回信息索引
      const urlHistoryMessage = indx >= 0 ? historyMessage.slice(0, indx) : []; // 截取信息
      const result = urlHistoryMessage.map((item) => {
        // 处理数据
        const content = JSON.parse(item.msg_kf_content)?.content || "";
        if (content) {
          console.log("item=========>1111", item);
          return {
            content,
            role: "user",
            time: item.create_time_ms || data.timeout,
            username: JSON.parse(item.extra_info).nickname || data.username,
            messageId: item.room_id || data.messageId,
            orderStatus: orderStatus || orderInfo?.orderStatus || "",
            orderId: orderId || orderInfo?.orderId || "",
            msg_id: item?.msg_id,
          };
        }
      });
      historyMessageString.history = result;
      ipcRenderer.send("get-historical-records", JSON.stringify(historyMessageString)); // 主动请求数据
    } else {
      // 从dom中获取到了数据
      ipcRenderer.send("get-historical-records", JSON.stringify(historyMessageString)); // 使用dom数据
    }
  } else {
    console.log("进入会话页面失败");
  }
}
// 主动请求获取聊天记录     messageId   msg_id
const getuserHistoryMessage = async (room_id, msg_id) => {
  const res = await fetch(`${mainUrl}shop/commkf/msg?action=get_room_msg`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      room_id,
      msg_id,
      op: 0,
      num: 15, // 只获取15条
    }),
  });
  const data = await res.json();
  return data.list;
};
// 主动请求获取用户订单
const getuserOrderList = async (room_id, send_openid) => {
  const res = await fetch(
    `${mainUrl}shop/kf/cgi/order/getOrderListV2?tabType=0&userOpenid=${send_openid}&roomId=${room_id}&lastIndex=${0}&pageSize=${10}&pageNum=${1}`,
    {
      method: "GET",
      credentials: "include",
    },
  );
  const data = await res.json();
  console.log("主动请求获取用户订单", data);
  const order = {
    orderStatus: data.orders[0]?.statusWording || "",
    orderId: data.orders[0]?.orderId || "",
  };
  return order;
};

//   获取dom 聊天记录
const getDomHistoryMessage = async (data) => {
  try {
    const newdata = { ...data };

    let result = [];
    // 时间计数器：键为"YYYY-MM-DD HH:MM"，值为当前秒数
    const secondCounter = Object.create(null);
    // 存储上一条消息的完整时间，用于处理转接手消息
    let lastFullTime = null;

    // 过滤关键词
    const FILTER_KEYWORDS = ["正在接入中，人工客服马上为你提供服务"];

    const username = getCustomerId();
    // 获取消息（调整过滤条件，保留特殊转接手消息）
    const messages = Array.from(document.querySelectorAll(".msg")).filter((msg) => {
      // 保留no-content但data-type="6"且包含"转给你"的消息
      const isTransferMsg =
        msg.classList.contains("no-content") &&
        msg.getAttribute("data-type") === "6" &&
        msg.innerText.includes("转给你");

      // 排除其他no-content消息
      if (msg.classList.contains("no-content") && !isTransferMsg) {
        return false;
      }

      const id = msg.getAttribute("id") || "";
      if (id.includes("_Welcome_")) return false;

      const senderName = getSenderName(msg);
      if (senderName === "智能助手") return false; // ★ 新增过滤智能助手

      const text = msg.innerText.trim();
      return !FILTER_KEYWORDS.some((k) => text.trim() === k);
    });

    let shopTitle = "";
    let lastOrderId = "";
    let orderStatus = "";
    // console.log('messages', messages)

    messages.forEach((msg, index) => {
      try {
        // 处理特殊转接手消息：<div class="msg no-content" data-type="6">包含"转给你"</div>
        const isTransferMsg =
          msg.classList.contains("no-content") &&
          msg.getAttribute("data-type") === "6" &&
          msg.innerText.includes("转给你");

        if (isTransferMsg) {
          // 时间用上一条消息时间+1秒
          let fullTime = addOneSecondToTime(lastFullTime) || "";

          // 如果没有上一条消息时间，使用当前时间
          if (!fullTime && lastFullTime === null) {
            const now = new Date();
            fullTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
          }

          const transferMsg = {
            role: "user", // 改为用户消息
            time: fullTime,
            shopTitle,
            content: "在吗？", // 改为指定内容
            username,
            isOrder: false,
            orderId: lastOrderId || "",
          };

          result.push(transferMsg);
          // 更新上一条消息时间
          lastFullTime = fullTime;
          return;
        }

        // 非转接手消息，使用原有逻辑
        const role = detectSender(msg);
        const timeEl = msg.querySelector(".message-time-text");
        const timeText = timeEl ? timeEl.textContent.trim() : "";
        let fullTime = "";

        if (timeText) {
          const now = new Date();
          let year = now.getFullYear();
          let month = now.getMonth() + 1;
          let date = now.getDate();
          let hours, minutes;

          if (!timeText.includes(" ") && timeText.includes(":")) {
            [hours, minutes] = timeText.split(":").map(Number);
          } else if (timeText.startsWith("昨天 ")) {
            const [_, part] = timeText.split(" ");
            [hours, minutes] = part.split(":").map(Number);
            const yesterday = new Date(now);
            yesterday.setDate(date - 1);
            year = yesterday.getFullYear();
            month = yesterday.getMonth() + 1;
            date = yesterday.getDate();
          } else if (timeText.includes("星期")) {
            const [week, part] = timeText.split(" ");
            const weekMap = {
              星期日: 0,
              星期一: 1,
              星期二: 2,
              星期三: 3,
              星期四: 4,
              星期五: 5,
              星期六: 6,
            };
            const targetDay = weekMap[week] || now.getDay();
            [hours, minutes] = part.split(":").map(Number);

            let dayDiff = targetDay - now.getDay();
            dayDiff = dayDiff >= 0 ? dayDiff - 7 : dayDiff;
            const target = new Date(now);
            target.setDate(date + dayDiff);
            year = target.getFullYear();
            month = target.getMonth() + 1;
            date = target.getDate();
          }

          hours = isNaN(hours) ? now.getHours() : hours;
          minutes = isNaN(minutes) ? now.getMinutes() : minutes;

          const y = year;
          const m = String(month).padStart(2, "0");
          const d = String(date).padStart(2, "0");
          const h = String(hours).padStart(2, "0");
          const min = String(minutes).padStart(2, "0");
          const minuteKey = `${y}-${m}-${d} ${h}:${min}`;

          const currentSecond = secondCounter[minuteKey] ?? 0;
          secondCounter[minuteKey] = (currentSecond + 1) % 60;
          fullTime = `${minuteKey}:${String(currentSecond).padStart(2, "0")}`;
        }

        let content = "";
        let isOrder = false;
        let orderId = "";

        const transferText = msg.innerText.trim();
        if (transferText.includes("将该会话转移给") || transferText.includes("将会话转移给您")) {
          result.push({
            role: "user",
            time: fullTime,
            shopTitle: "",
            content: "",
            username,
            isOrder: false,
            orderId: lastOrderId || "",
          });
          lastFullTime = fullTime;
          return;
        }

        const videoBox = msg.querySelector(
          '[data-type="video"], .auxo-dropdown-trigger.I7ZfagWiu5KfRxXX0opn',
        );
        if (videoBox) {
          const img = Array.from(videoBox.querySelectorAll("img")).find(
            (i) => !i.src.startsWith("data:"),
          );
          result.push({
            role,
            time: fullTime,
            shopTitle,
            content: "用户发送了视频",
            videoUrl: img?.src || "",
            username,
            isOrder: false,
            orderId: lastOrderId || "",
          });
          lastFullTime = fullTime;
          return;
        }

        const imgEl = msg.querySelector('[data-type="image"] img, img.auxo-dropdown-trigger');
        if (imgEl && imgEl.src && !imgEl.src.startsWith("data:")) {
          result.push({
            role,
            time: fullTime,
            shopTitle,
            content: "用户发送了图片",
            imageUrl: imgEl.src,
            username,
            isOrder: false,
            orderId: lastOrderId || "",
          });
          lastFullTime = fullTime;
          return;
        }

        const fileBox = msg.querySelector('[data-type="file"]');
        if (fileBox) {
          const nameEl = fileBox.querySelector("p:first-child");
          const sizeEl = fileBox.querySelector("p:nth-child(2)");
          const name = nameEl ? nameEl.textContent.trim() : "未知文件";
          const size = sizeEl ? sizeEl.textContent.trim() : "未知大小";
          result.push({
            role,
            time: fullTime,
            shopTitle,
            content: `用户发送文件：${name}（${size}）`,
            fileName: name,
            fileSize: size,
            username,
            isOrder: false,
            orderId: lastOrderId || "",
          });
          lastFullTime = fullTime;
          return;
        }

        const orderCard = msg.querySelector('[data-type="order"]');
        if (orderCard) {
          const idWrap = orderCard.querySelector(".wrap");
          if (idWrap) {
            const spans = idWrap.querySelectorAll("span");
            if (spans.length >= 2 && spans[0].textContent.trim() === "订单号") {
              orderId = spans[1].textContent.trim();
              if (orderId) {
                lastOrderId = orderId;
                isOrder = true;
              }
            }
          }
          // const orderStatusEl = orderCard.querySelector('.text-\\[var\\(--weui-FG-1\\)\\] .text-\\[12px\\]');
          // console.log('orderStatusEl=====>', orderStatusEl)
          // if (orderStatusEl) {
          //   // 获取下一个兄弟节点
          //   const nextSibling = orderStatusEl.nextSibling;
          //   console.log('nextSibling=====>', nextSibling)

          //   if (nextSibling) {
          //     orderStatus = nextSibling.textContent.trim();
          //     console.log('orderStatus=====>', orderStatus)

          //   }
          // };
          const titleEl = orderCard.querySelector("p:first-child");
          if (titleEl) shopTitle = titleEl.textContent.trim() || shopTitle;
          content = isOrder
            ? `用户发送订单：${shopTitle} 请介绍核心卖点`
            : `用户发送订单：${shopTitle || "未知商品"}`;
          result.push({
            role,
            time: fullTime,
            shopTitle,
            content,
            username,
            isOrder,
            orderId,
          });
          lastFullTime = fullTime;
          return;
        }

        const productCard = msg.querySelector('[data-type="product"]');
        if (productCard) {
          const titles = productCard.querySelectorAll(
            "p, .pigeon-card-place-holder-text .content.max-line span",
          );
          if (titles.length >= 1) {
            let title = titles[0].textContent.trim();
            if (title.includes("您看中的商品")) return;
            if (title.includes("已售") && titles.length >= 2) title = titles[1].textContent.trim();
            shopTitle = title;
            content = `用户发送商品卡片：${shopTitle} 请简短介绍一下它的核心卖点`;
          }
          result.push({
            role,
            time: fullTime,
            shopTitle,
            content,
            username,
            isOrder: false,
            orderId: lastOrderId || "",
          });
          lastFullTime = fullTime;
          return;
        }

        const voiceBox = msg.querySelector('[data-type="voice"]');
        if (voiceBox) {
          const durationEl = voiceBox.querySelector(".text-sm");
          const duration = durationEl ? durationEl.textContent.trim().replace(/"/g, "秒") : "";
          const textEl = voiceBox.querySelector(".whitespace-pre-wrap.break-words.text-left");
          const text = textEl ? textEl.textContent.trim() : "";
          content = text ? `用户发送语音（${duration}）：${text}` : `用户发送语音（${duration}）`;
          result.push({
            role,
            time: fullTime,
            shopTitle,
            content,
            username,
            isOrder: false,
            orderId: lastOrderId || "",
          });
          lastFullTime = fullTime;
          return;
        }

        const textEl = msg.querySelector(".text-msg span, .iD7SHBvMhm4OhfCsBGr1");
        if (textEl) content = textEl.innerText.trim();

        if (fullTime || shopTitle || content) {
          result.push({
            role,
            time: fullTime,
            shopTitle,
            content,
            username,
            isOrder,
            orderId: lastOrderId || "",
          });
        }

        // 更新上一条消息时间
        lastFullTime = fullTime;
      } catch (e) {
        console.warn(`第${index}条消息处理失败：`, e);
      }
    });
    await delay(1000); // 等待1秒，确保历史记录已经获取
    const orderList = await getOrderList();
    if (lastOrderId) {
      result.forEach((item) => {
        if (!item.orderId) item.orderId = lastOrderId;
        let orderStatus = "";
        if (orderList && orderList.length > 0) {
          const orderItem = orderList.find((item) => item.orderId === lastOrderId);
          if (orderItem) {
            item.orderStatus = orderItem.status;
          } else {
            item.orderStatus = orderList[0].status;
          }
        }
      });
    } else if (!lastOrderId && orderList && orderList.length > 0) {
      const orderItem = orderList[0];
      result.forEach((item) => {
        item.orderStatus = orderItem.status;
        item.orderId = orderItem.orderId;
      });
    }

    const reversed = [...result].reverse();
    const index = reversed.findIndex((item) => item.role === "assistant");
    const historyList = index >= 0 ? reversed.slice(0, index).reverse() : [];
    if (historyList.length > 0) {
      historyList.forEach((item) => (item.messageId = data.messageId));
    }
    newdata.history = historyList;
    console.log("dom结果=========>", newdata);
    return newdata; // 只返回数组，而不是整个对象
    // ipcRenderer.send('get-historical-records', JSON.stringify(newdata)) // 将历史记录发送给主进程处理
  } catch (e) {
    console.error("脚本执行失败：", e);
    return [];
  }
};

//  获取订单列表
const getOrderList = async () => {
  try {
    const orders = [];
    // 定位所有订单卡片容器
    const orderCards = document.querySelectorAll(".order-card");

    orderCards.forEach((card) => {
      // 提取订单号
      const orderIdEl = card.querySelector(".order-id-wrap .num");
      const orderId = orderIdEl ? orderIdEl.innerText.trim() : "未知订单号";

      // 提取订单状态
      const statusEl = card.querySelector(".order-status");
      const status = statusEl ? statusEl.innerText.trim().replace(/\s+/g, " ") : "未知状态";

      // 只添加有有效订单号的订单
      if (orderId !== "未知订单号") {
        orders.push({ orderId, status });
      }
    });

    return orders;
  } catch (err) {
    console.error("订单提取脚本执行出错：", err);
    return [];
  }
};
// 解析时间并加1秒
function addOneSecondToTime(timeStr) {
  if (!timeStr) return "";
  // 时间格式: YYYY-MM-DD HH:MM:SS
  const [datePart, timePart] = timeStr.split(" ");
  if (!datePart || !timePart) return timeStr;

  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  let newSeconds = seconds + 1;
  let newMinutes = minutes;
  let newHours = hours;

  // 处理秒进位
  if (newSeconds >= 60) {
    newSeconds = 0;
    newMinutes += 1;
  }

  // 处理分进位
  if (newMinutes >= 60) {
    newMinutes = 0;
    newHours += 1;
  }

  // 处理时进位（简单处理，未考虑日期进位）
  if (newHours >= 24) {
    newHours = 0;
  }

  // 格式化
  return `${datePart} ${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}:${String(newSeconds).padStart(2, "0")}`;
}

// 获取客户ID
function getCustomerId() {
  const el = document.querySelector(".chat-customer-name");
  return el ? el.textContent.trim() : "";
}

function extractTextFromTabSync() {
  try {
    const productEl = document.querySelector(".recommend-product-block .product-item");
    if (!productEl) {
      console.log("未找到商品元素");
      return "";
    }
    productEl?.click();

    const titleEl = document.querySelector(
      ".t-drawer__content-wrapper .product-content-wrap .title.line-clamp-1",
    );
    return titleEl?.innerText?.trim() || "";
  } catch (err) {
    console.warn("extractTextFromTabSync 执行失败:", err);
    return "";
  }
}

// 检测发送者
function detectSender(msg) {
  const item = msg.querySelector(".message-item");
  return item?.classList.contains("justify-end") ? "assistant" : "user";
}

// 获取发送者昵称
function getSenderName(msg) {
  const nameEl = msg.querySelector(".message-time-text + span");
  return nameEl ? nameEl.textContent.trim() : "";
}

// 工具函数
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 主动请求获取历史信息

// 获取拦截接口数据解析
const getUrlHistoryMessage = () => {
  return new Promise((resolve) => {
    const handleMessage = (e) => {
      if (e.data && e.data.type === "get-history-message") {
        clearTimeout(timeout);
        window.removeEventListener("message", handleMessage);
        // console.log('获取用户历史信息 result', e.data.value);
        resolve(e.data.value);
      }
    };
    // 超时处理
    const timeout = setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      resolve(null);
    }, 1000);
    window.addEventListener("message", handleMessage);
  });
};

// 获取全部商品
safeIpcOn("get-goods-all-detail", async (_, args) => {
  allProducts = [];
  console.log("获取全部商品=======");
  // if (allCategories.length === 0) {
  //   const res1 = await fetch(`${mainUrl}shop-faas/mmchannelstradecategory/cgi/category/getFullCategoryTree?token=&lang=zh_CN`, {
  //     method: 'GET',
  //     credentials: 'include',
  //     headers: {
  //       'biz_magic': key,
  //       'Content-Type': 'application/json'
  //     }
  //   }).then(res => res.json())
  //   allCategories = res1.originCats
  // }

  const products = await getAllProducts();
  // console.log('products', products)
  // console.log('allCategories', allCategories)

  const result = await Promise.all(
    products.map(async (item) => {
      const r = {};

      if (item.productSaleAttrs && Array.isArray(item.productSaleAttrs)) {
        item.productSaleAttrs.forEach((group) => {
          if (group && group.key && Array.isArray(group.items)) {
            r[group.key] = group.items.map((v) => v.value);
          }
        });
      }

      const catIdList = item.category?.map((c) => c.catId) ?? [];
      const category = await getGoodcatIdList(catIdList);

      return {
        goods_id: item.productId,
        goods_name: item.title,
        goods_desc: item.detail?.desc,
        urls: Array.isArray(item.headImgInfos) ? item.headImgInfos.map((img) => img.imgUrl) : [],
        goods_url: item.headImg || item.headImage,
        type: args.type,
        id: args.id,
        goods_properties: JSON.stringify(item.param ? formatCategory(item.param) : []),
        goods_cat: category ? category.map((c) => c.name).join(">") : "",
        goods_sku: JSON.stringify(r),
      };
    }),
  );
  console.log("result", result);
  // console.log('allProducts', allProducts)
  ipcRenderer.send("get-goods-all-detail-total", {
    userId: args.userId,
    total: result.length,
  });
  ipcRenderer.send("get-goods-detail", result);
});

// 获取店铺商品列表
const getAllProducts = async (index = 1, _nextKey = null) => {
  let pageNum = index;

  // console.log('pageNum', pageNum)
  const res = await fetch(
    `${mainUrl}shop-faas/mmchannelstradeproductcore/cgi/goods/scanProductPreview?token=&lang=zh_CN`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        biz_magic: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nextKey: _nextKey,
        pageSize: 10,
        pageNum,
        status: [5],
      }),
    },
  ).then((res) => res.json());

  // console.log('获取商品结果 ', res);
  const { totalNum, nextKey, productList } = res;

  allProducts.push(...productList);

  // 如果 nextKey 存在，递归调用下一页
  if (nextKey && allProducts.length <= totalNum) {
    // console.log('下一页', res.nextKey)
    return getAllProducts(pageNum + 1, res.nextKey);
  } else {
    console.log("全部商品数量", allProducts.length);
    return allProducts;
  }
};

function getCategoryChain(flatList, targetId) {
  const tid = String(targetId);

  const map = new Map();
  for (const item of flatList) {
    const id = String(item.id ?? item.value);
    const fId =
      item.fId != null ? String(item.fId) : item.parentId != null ? String(item.parentId) : null;

    map.set(id, {
      id,
      fId,
      name: item.name ?? item.label ?? "",
    });
  }

  if (!map.has(tid)) return null;

  const chain = [];
  let current = map.get(tid);

  while (current) {
    chain.unshift({ id: current.id, name: current.name });
    if (!current.fId || current.fId === "0") break;
    current = map.get(current.fId);
  }

  return chain;
}

//  新增：一行拿到 `name1 > name2 > name3` 字符串
function getCategoryPath(flatList, targetId) {
  const chain = getCategoryChain(flatList, targetId);
  if (!chain) return null;
  return chain.map((item) => item.name).join(">");
}
// 属性处理
function formatCategory(data) {
  return data
    .map((item) => {
      const cats = item.categorys;
      if (!Array.isArray(cats) || cats.length < 2) return null;

      const key = cats[0]?.name?.trim();
      const val = cats[1]?.name?.trim();

      if (!key || !val) return null;
      return `${key}:${val}`;
    })
    .filter(Boolean);
}

// safeIpcOn('get-goods-detail-by-id', async (_, data) => {
//   console.log('get-goods-detail-by-id', data)
//   const res = await fetch(
//     `${mainUrl}shop-faas/mmchannelstradeproductcore/cgi/goods/getEditProductV2?token=&lang=zh_CN&productKey={productId:${data.id}}&needRealStock=true&preview=false&release=false
// `,
//     {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         biz_magic: key
//       }
//     }
//   ).then((res) => res.json())
//   const {
//     product: { info }
//   } = res
//   const catIdList = info.category.map((item) => item.catId)
//
//   const category = await getGoodcatIdList(catIdList)
//
//   const r = {}
//   // 安全检查 productSaleAttrs 是否存在
//   if (info.productSaleAttrs && Array.isArray(info.productSaleAttrs)) {
//     info.productSaleAttrs.forEach((group) => {
//       if (group && group.key && group.items && Array.isArray(group.items)) {
//         r[group.key] = group.items.map((item) => item.value)
//       }
//     }) //规格
//   }
//   const product = {
//     goods_id: data.id, //商品id
//     goods_name: info.title, //商品名称
//     goods_desc: info.detail?.desc, //商品描述
//     urls:
//       info.headImgInfos && Array.isArray(info.headImgInfos)
//         ? info.headImgInfos.map((img) => img.imgUrl)
//         : [], //商品详情图片s
//     goods_url: info.productHeadimgInfo[0].imgUrl || info?.headImg[0], // 商品首图
//     goods_properties: JSON.stringify(
//       info.param ? formatCategory(info.param) : []
//     ), //属性
//     goods_cat: category.map((item) => item.name).join('>'), // 类目
//     goods_sku: JSON.stringify(r)
//   }
//
//   ipcRenderer.send('goods-crawl-complete', [product])
//   console.log('发送成功')
// })

const getGoodcatIdList = async (ids) => {
  const res2 = await fetch(
    `${mainUrl}shop-faas/mmchannelstradecategory/cgi/product/getCategoryOnShelfV2?token=&lang=zh_CN`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        biz_magic: key,
      },
      body: JSON.stringify({
        catIdList: ids,
      }),
    },
  ).then((res) => res.json());
  const { category } = res2;
  return category || null;
};

safeIpcOn("goto-human-reply", async (_, arg) => {
  try {
    // 客服名称列表（需提前定义）
    const YK_kefuNames = [arg.subAccount]; // 示例名称，需替换为实际需要匹配的客服名
    // 转接失败时发送的消息（需提前定义）

    // 点击转接按钮，打开转接弹框
    const openTransferPanel = () => {
      // 查找包含"转接"文本的功能按钮
      const transferBtn = Array.from(document.querySelectorAll(".func-wrap.bold")).find((el) =>
        el.textContent.includes("转接"),
      );

      if (transferBtn) {
        transferBtn.click();
        console.log("已点击转接按钮，打开弹框");
        return 1.0;
      } else {
        console.error("未找到转接按钮");
        return 2.0;
      }
    };

    // 等待转接弹框加载并获取客服列表
    const waitForCustomerList = (timeout = 3000) =>
      new Promise((resolve, reject) => {
        const start = Date.now();
        const timer = setInterval(() => {
          // 查找客服列表容器
          const listContainer = document.querySelector(".transfer-popover2 .list");
          if (listContainer) {
            // 获取所有客服项及名称
            const customerItems = Array.from(listContainer.querySelectorAll(".item"))
              .map((item) => ({
                element: item,
                name: item.querySelector(".nickname")?.textContent?.trim() || "",
              }))
              .filter((item) => item.name); // 过滤无效项

            if (customerItems.length > 0) {
              clearInterval(timer);
              console.log(`找到${customerItems.length}个客服选项`);
              resolve(customerItems);
              return;
            } else {
              // 列表存在但无有效客服
              clearInterval(timer);
              resolve([]);
              return;
            }
          }

          // 超时处理
          if (Date.now() - start > timeout) {
            clearInterval(timer);
            reject("等待客服列表超时");
          }
        }, 200);
      });

    // 匹配客服并点击
    const selectCustomer = (customerList) => {
      let targetItem = null;

      // 优先匹配目标客服列表
      for (const targetName of YK_kefuNames) {
        targetItem = customerList.find((item) => item.name.includes(targetName));
        if (targetItem) {
          console.log(`找到匹配的客服：${targetItem.name}`);
          break;
        }
      }

      return targetItem;
    };

    // 等待并点击转接按钮
    const clickTransferConfirm = (timeout = 2000) =>
      new Promise((resolve, reject) => {
        const start = Date.now();
        const timer = setInterval(() => {
          // 查找转接确认按钮（非禁用状态）
          const confirmBtn = document.querySelector(
            ".transfer-popover2 .button_area .weui-desktop-btn_primary:not(.weui-desktop-btn_disabled)",
          );

          if (confirmBtn) {
            confirmBtn.click();
            clearInterval(timer);
            console.log("已点击转接确认按钮");
            resolve(true);
            return;
          }

          // 超时处理
          if (Date.now() - start > timeout) {
            clearInterval(timer);
            reject("等待转接按钮超时或按钮未启用");
          }
        }, 200);
      });

    // 发送失败消息
    const sendFailMessage = () => {
      try {
        // 在这里添加你的判断条件，作为发送前的前置检查
        if (
          !YK_failTransfer ||
          String(YK_failTransfer).trim() === "" ||
          String(YK_failTransfer).trim().toLowerCase() === "none"
        ) {
          console.log("YK_failTransfer内容无效，不发送失败消息");
          return; // 不执行后续发送逻辑
        }
        // 优化选择器逻辑，使用更直接的定位方式
        const textarea = document.querySelector("textarea.text-area");
        const textAreaWrap = document.querySelector(".text-area-wrap");

        // 双重验证确保找到输入框及其容器
        if (!textarea || !textAreaWrap) {
          console.warn("未找到输入框或输入容器");
          // 调试信息：输出页面中所有textarea帮助诊断
          const allTextareas = document.querySelectorAll("textarea");
          console.log("页面中找到的textarea元素:", allTextareas);
          return;
        }

        // 聚焦输入框
        textarea.focus();

        // 清空输入框（处理可能的默认内容）
        textarea.value = "";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));

        // 写入消息内容
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value",
        )?.set;

        if (nativeSetter) {
          nativeSetter.call(textarea, YK_failTransfer);
        } else {
          textarea.value = YK_failTransfer;
        }

        // 触发输入事件更新UI
        textarea.dispatchEvent(
          new Event("input", {
            bubbles: true,
            cancelable: true,
          }),
        );

        // 尝试多种发送方式确保兼容性
        setTimeout(() => {
          try {
            // 方式1: 触发Enter键
            const enterEvent = new KeyboardEvent("keydown", {
              key: "Enter",
              code: "Enter",
              keyCode: 13,
              bubbles: true,
              cancelable: true,
            });
            textarea.dispatchEvent(enterEvent);

            // 方式2: 同时触发keyup确保事件被捕获
            setTimeout(() => {
              textarea.dispatchEvent(
                new KeyboardEvent("keyup", {
                  key: "Enter",
                  code: "Enter",
                  keyCode: 13,
                  bubbles: true,
                }),
              );
              console.log("已尝试通过Enter发送失败消息");
            }, 50);
          } catch (err) {
            console.error("发送失败消息时出错：", err);
          }
        }, 100);
      } catch (e) {
        console.error("发送失败消息脚本执行出错：", e);
      }
    };

    // 关闭转接弹框
    const closeTransferPanel = () => {
      const cancelBtn = document.querySelector(
        ".transfer-popover2 .button_area .weui-desktop-btn_default",
      );
      if (cancelBtn) {
        cancelBtn.click();
        console.log("已关闭转接弹框");
        return 1.0;
      }
      return 2.0;
    };

    // 主流程
    const tryTransfer = async () => {
      // 1. 打开转接弹框
      if (!openTransferPanel()) {
        console.log("无法打开转接面板，直接发送失败消息");
        // sendFailMessage()
        return;
      }

      try {
        // 2. 获取客服列表
        const customerList = await waitForCustomerList();

        // 检查是否有可转接的客服
        if (customerList.length === 0) {
          console.log("没有可转接的客服");
          closeTransferPanel();
          // sendFailMessage()
          return;
        }

        // 3. 选择匹配的客服
        let targetItem = selectCustomer(customerList);

        // 4. 如果没有匹配项，尝试选择第一个客服
        if (!targetItem) {
          console.log("没有匹配的客服，尝试选择第一个客服");
          targetItem = customerList[0];
        }

        if (targetItem) {
          targetItem.element.click();
          console.log(`已选择客服：${targetItem.name}`);

          // 5. 点击转接按钮
          try {
            await clickTransferConfirm();
            console.log("转接流程完成");
            return;
          } catch (confirmErr) {
            console.error("确认转接失败：", confirmErr);
          }
        }

        // 如果到这里，说明转接失败
        console.log("转接失败，发送失败消息");
        closeTransferPanel();
        // sendFailMessage()
      } catch (e) {
        console.error("转接过程出错：", e);
        closeTransferPanel();
        // sendFailMessage()
      }
    };

    // 执行转接流程
    tryTransfer();
  } catch (error) {
    console.error("脚本执行异常：", error);
  }
});

// 星标
safeIpcOn("star", () => {
  console.log("星标");
  const starBtn = document.querySelector(".star-btn");
  if (starBtn) {
    starBtn.click();
    console.log("已点击星标按钮");
  }
});

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

const urlReminder = (messageId) => {
  console.log("urlReminder", message);
  fetch(`https://store.weixin.qq.com/shop/commkf/room?action=get_room_recommend_info`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json, text/plain, */*",
      biz_magic: key,
    },
    body: JSON.stringify({
      room_id: messageId,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      console.log("获取推荐信息", res);
      if (res.recommend_product_infos && res.recommend_product_infos.length > 0) {
        const productInfo = res.recommend_product_infos[0];
        // 生成 uuid
        function uuidv4() {
          return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        }
        fetch(`https://store.weixin.qq.com/shop/commkf/msg?action=send_room_msg`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json, text/plain",
            biz_magic: key,
          },
          body: JSON.stringify({
            room_id: message.messageId,
            msg_type: 20,
            // \"sku_id\":\"4447822347\",
            msg_content: `{\"template_id\":18,\"type\":7,\"title\":\"邀请下单\",\"check_req\":\"{\\\"product_id\\\":\\\"${productInfo.product_id}\\\",\\\"product_num\\\":1,\\\"unique_id\\\":\\\"${uuidv4()}\\\"}\",\"order_info\":{\"products\":\"${productInfo.product_name}\",\"products_count\":1,\"product_image_url\":\"${productInfo.head_imgs[0]}\",\"price_wording\":\"¥${(productInfo.min_product_price / 100).toFixed(2)}\"},\"use_custom_key_value\":true}`,
            msg_id: message?.msg_id,
            send_source: 2,
            send_tools: 5,
            create_time_ms: Date.now(), //  发送时间信息
            client_ms: Date.now(), //  服务器响应时间
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("发送商品信息", data);
          });
      }
    });
};

//
window.addEventListener("message", (event) => {
  if (event.data.type === "user-order-key") {
    ordersKeyValue = {
      roomId: event.data.value.roomId,
      userOpenid: event.data.value.userOpenid,
    };
  }
});

// orders.map(item => {

// })
// 接收工单参数
safeIpcOn("create-workorder", async (_, args) => {
  console.log("接收工单参数", args);
  if (ordersKeyValue) {
    const { roomId, userOpenid } = ordersKeyValue;
    const res = await fetch(
      `${mainUrl}shop/kf/cgi/order/getOrderListV2?tabType=0&userOpenid=${userOpenid}&roomId=${roomId}&lastIndex=${0}&pageSize=${10}&pageNum=${1}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
    const data = await res.json();
    console.log("获取工单信息", data);
    const { orders } = data;
    if (orders && orders.length > 0) {
      // https://store.weixin.qq.com/shop-faas/mmchannelstradeorder/detail/cgi/orderDetail?token=&lang=zh_CN
      const tasks = orders.map((item) => {
        return fetch(
          `${mainUrl}shop-faas/mmchannelstradeorder/detail/cgi/orderDetail?token=&lang=zh_CN`,
          {
            method: "POST",
            headers: {
              Accept: "application/json, text/plain, */*",
              "Content-Type": "application/json",
              biz_magic: key,
            },
            credentials: "include",
            body: JSON.stringify({ id: item.orderId }),
          },
        ).then((res) => res.json());
      });

      const results = await Promise.allSettled(tasks);
      const orderList = [];
      for (const r of results) {
        if (r.status === "fulfilled") {
          console.log("成功：", r.value);
          try {
            const data = r.value;
            const name = data?.acceptInfo?.addressInfo?.userName;
            const telNumber = data?.acceptInfo?.addressInfo?.telNumber;
            const address = (
              data?.buyerInfo?.addr + data?.acceptInfo?.addressInfo?.detailInfo
            ).replace(/\s+/g, "");
            // console.log('name', name)
            // console.log('telNumber', telNumber)
            // console.log('provinceName', data?.acceptInfo?.addressInfo?.provinceName)
            // console.log('cityName', data?.acceptInfo?.addressInfo?.cityName)
            // console.log('districtName', data?.acceptInfo?.addressInfo?.districtName)
            const res = {
              orderId: data?.commonInfo?.orderId, // 订单号
              type: data?.commonInfo?.statusStr, // 订单状态
              orderName: data?.orderProducts?.orderProductInfo[0].title, // 订单名称
              sku: data?.orderProducts?.orderProductInfo[0].saleParam.join(","), // 商品sku
              name: name && telNumber ? `${name}${telNumber}` : name || telNumber || "", // 收件人
              address: address, // 收件地址
              expressCompany: data?.expressInfo?.deliveryProductInfo[0]?.deliveryName, // 快递公司
              trackingNumber: data?.expressInfo?.deliveryProductInfo[0]?.waybillId, // 快递单号
              expanded: true,
            };
            // console.log('res====', res)
            orderList.push(res);
          } catch (error) {
            console.error("失败：", error);
          }
        } else {
          console.warn("失败：", r.reason);
        }
      }
      console.log("orderList", orderList);
      ipcRenderer.send("get-create-workorder", orderList);
    }
  }
});

safeIpcOn("currnt-page", (_, key) => {
  is_key = key;
  if (is_key) {
    ipcRenderer.send("get-currnt-page", false);
  }
});

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
  const fileInput = document.querySelector('input[type="file"][accept*=".jpg,.png"]');
  if (!fileInput) {
    console.error("[图片发送] 未找到图片上传input");
    return false;
  }

  let blob;
  let mimeType = imageMimeType;
  if (imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status}`);
    }
    blob = await response.blob();
    mimeType = mimeType || blob.type || "image/jpeg";
  } else if (imageBase64) {
    const byteCharacters = atob(imageBase64);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    blob = new Blob([byteArray], { type: mimeType });
  } else {
    console.error("[图片发送] 缺少图片数据");
    return false;
  }
  const ext = (mimeType || "image/jpeg").split("/")[1] || "jpg";
  const file = new File([blob], `image_${Date.now()}.${ext}`, {
    type: mimeType,
  });

  console.log("[图片发送] 创建文件成功:", file.name, file.size, "bytes");

  // 4. 用 DataTransfer 设置文件
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;

  // 5. 触发 change 事件
  fileInput.dispatchEvent(new Event("change", { bubbles: true }));

  // 6. 延迟点击确定发送
  let checkCount = 0;
  const maxChecks = 20; // 最多检测20次，共2秒
  const checkInterval = setInterval(() => {
    checkCount++;
    const modal = document.querySelector(".t-dialog__footer");
    if (modal) {
      const btmDom = modal.querySelector(".weui-desktop-btn_primary");
      btmDom.click();
      clearInterval(checkInterval);
      return;
    }
    if (checkCount >= maxChecks) {
      clearInterval(checkInterval);
      console.log("[图片发送] 弹窗检测超时");
    }
  }, 100);

  console.log("[图片发送] 已触发 change 事件");
  return true;
}

// 接收信息获取客服账号绩效数据
safeIpcOn("get-customer-performance-info", (_, args) => {
  getCustomerPerformanceInfo(args);
});

const getCustomerPerformanceInfo = (info) => {
  info = JSON.parse(info);
  try {
    // 获取当前时间
    const yesterdayStart = new Date();
    // 获取昨天的0点
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    // 转换为秒级时间戳
    let start = Math.floor(yesterdayStart.getTime() / 1000);
    let end = Math.floor(yesterdayStart.getTime() / 1000);
    // 判断是否带了时间
    if (info.info) {
      if (typeof info.info.month === "string") {
        // 计算month的0点
        const monthEnd = new Date(info.info.month);
        monthEnd.setHours(0, 0, 0, 0);
        // 计算传递时间的0点到24点的时间戳
        start = Math.floor(monthEnd.getTime() / 1000);
        end = Math.floor(monthEnd.getTime() / 1000);
      } else {
        const monthStart = new Date(info.info.month[0]);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(info.info.month[1]);
        monthEnd.setHours(0, 0, 0, 0);
        // 计算自定义日期
        start = Math.floor(monthStart.getTime() / 1000);
        end = Math.floor(monthEnd.getTime() / 1000);
      }
    }

    // 微信小店 API - 获取客服绩效数据
    fetch(`${mainUrl}shop/kf/cgi/data/getOfflineKfV2?beginDate=${start}&endDate=${end}`, {
      credentials: "include",
      method: "GET",
    })
      .then((res) => res.json())
      .then(async (res) => {
        console.log("微信小店绩效数据返回:", res);

        // 处理微信小店返回的数据结构
        if (res.ret === 0 && res.cardResp) {
          const cardData = res.cardResp.objects?.tableValueLine?.[0]?.columnValue || [];

          // 获取询单转化率
          let conversionRate = "0%";
          try {
            const salesRes = await fetch(
              `${mainUrl}shop/kf/cgi/data/getKfSales?beginDate=${start}&endDate=${end}&realTime=false`,
              {
                credentials: "include",
                method: "GET",
              },
            );
            const salesData = await salesRes.json();
            console.log("询单转化率数据返回:", salesData);

            if (salesData.ret === 0 && salesData.cardResp) {
              const conversionItem = salesData.cardResp.find(
                (item) => item.dataKey === "conversionRate",
              );
              if (conversionItem) {
                conversionRate = conversionItem.value + "%";
              }
            }
          } catch (err) {
            console.log("获取询单转化率失败:", err);
          }

          // 格式化绩效数据
          const type = info.info.type ? info.info.type : "1";
          const result = [
            (() => {
              if (type === "1") {
                // 单日查询
                return {
                  volume: cardData[1] || "0",
                  minuteResp: formatRate(cardData[3]),
                  averageResp: formatTimeToMinutes(cardData[4]),
                  satisfactionRate: formatRate(cardData[6]),
                  conversionRate: conversionRate,
                  month:
                    info?.info?.month ||
                    (() => {
                      const date = new Date();
                      date.setDate(date.getDate() - 1);
                      return `${date.getFullYear()}-${date.getMonth() + 1}-${String(
                        date.getDate(),
                      ).padStart(2, "0")}`;
                    })(),
                  type: type,
                  shopId: info.info.shopId,
                  id: info?.info?.id || "",
                };
              } else {
                // 自定义日期查询
                return {
                  id: info.info.id,
                  volume: cardData[1] || "0",
                  threeMinRespRate: formatRate(cardData[3]),
                  averageResp: formatTimeToMinutes(cardData[4]),
                  satisfaction: formatRate(cardData[6]),
                  conversionRate: conversionRate,
                  type: type,
                };
              }
            })(),
          ];

          ipcRenderer.send("set-customer-performance-info", result);
        } else {
          throw new Error("API 返回错误: " + res.ret);
        }
      });
  } catch (error) {
    console.log("error", error);
    // 发送错误信息回调
    ipcRenderer.send("web-scoker-error-callback", {
      info: info,
      errormsg: "查询店铺绩效数据失败,失败原因:" + error,
      shopId: info.info?.shopId,
    });
  }
};

// 格式化百分比（如 0.8 -> 80%）
function formatRate(value) {
  if (!value || value === "0") return "0%";
  return Math.round(parseFloat(value) * 100) + "%";
}

// 格式化时间为分钟（如 34.774194秒 -> 0.6分钟）
function formatTimeToMinutes(value) {
  if (!value || value === "0") return "0分钟";
  const minutes = parseFloat(value) / 60;
  return minutes.toFixed(1) + "分钟";
}

// 获取售后月总工单
safeIpcOn("get-after-sale-total-order", async (_, arg) => {
  console.log("get-after-sale-total-order==============>", arg);
  const info = arg;
  try {
    const monthStart = new Date(info.info.month[0]);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(info.info.month[1]);
    monthEnd.setHours(23, 59, 59, 999);
    const startTimeMs = monthStart.getTime();
    const endTimeMs = monthEnd.getTime();
    const beginCreateTime = Math.floor(startTimeMs / 1000);
    const endCreateTime = Math.floor(endTimeMs / 1000);
    console.log("beginCreateTime============>", beginCreateTime, endCreateTime);

    // 1. 获取总售后工单
    const totalCountRes = await fetch(
      "https://store.weixin.qq.com/shop-faas/mmchannelstradeaftersale/cgi/esSearchAfterSaleOrder?token=&lang=zh_CN",
      {
        method: "post",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          biz_magic: key,
        },
        body: JSON.stringify({
          originalOrderIdList: [],
          orderIdList: [],
          waybillIdList: [],
          createTime: [startTimeMs, endTimeMs],
          completeTime: [null, null],
          moneyRange: ["", ""],
          status: "",
          type: "",
          reasonType: null,
          reason: null,
          receiverName: "",
          receiverTelNumberLast4: "",
          productMessage: "",
          orderClass: 0,
          suspectedRisk: 0,
          shipStatus: "",
          returnStatus: "",
          complaintOrderStatus: "",
          complaintOrderBlame: "",
          key: "",
          pendingForNSeconds: null,
          beginCreateTime: beginCreateTime,
          endCreateTime: endCreateTime,
          sortType: 11,
          pageSize: 10,
          afterSaleOpType: [0],
          pageNum: 1,
          orderId: "",
          aftersaleReason: [0],
          originalOrderId: "",
          waybillId: "",
          returnDiffPriceType: 0,
          refundTypeList: null,
          needFetchTabTotalNum: true,
          useTabSelfOptions: false,
        }),
      },
    ).then((res) => res.json());
    console.log("totalCountRes", totalCountRes);

    // 2. 获取未发货仅退款
    const awaitingShipmentRefundRes = await fetch(
      "https://store.weixin.qq.com/shop-faas/mmchannelstradeaftersale/cgi/esSearchAfterSaleOrder?token=&lang=zh_CN",
      {
        method: "post",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          biz_magic: key,
        },
        body: JSON.stringify({
          afterSaleOpType: [0],
          aftersaleReason: [0],
          beginCreateTime: beginCreateTime,
          complaintOrderBlame: "",
          complaintOrderStatus: "",
          completeTime: [null, null],
          createTime: [startTimeMs, endTimeMs],
          endCreateTime: endCreateTime,
          key: "",
          moneyRange: ["", ""],
          needFetchTabTotalNum: true,
          orderClass: 0,
          orderId: "",
          orderIdList: [],
          originalOrderId: "",
          originalOrderIdList: [],
          pageNum: 1,
          pageSize: 10,
          pendingForNSeconds: null,
          productMessage: "",
          reason: null,
          reasonType: null,
          receiverName: "",
          receiverTelNumberLast4: "",
          refundTypeList: null,
          returnDiffPriceType: 0,
          returnStatus: "",
          shipStatus: "awaitingShipment",
          sortType: 11,
          status: "",
          suspectedRisk: 0,
          totalNum: 0,
          totalPage: 0,
          type: "",
          useTabSelfOptions: false,
          waybillId: "",
          waybillIdList: [],
        }),
      },
    ).then((res) => res.json());
    console.log("awaitingShipmentRefundRes", awaitingShipmentRefundRes);

    // 3. 获取工单条数
    const workOrderRes = await fetch(
      "https://store.weixin.qq.com/shop-faas/mmchannelstradeaftersale/cgi/fetchGuaranteeOrders?token=&lang=zh_CN",
      {
        method: "post",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          biz_magic: key,
        },
        body: JSON.stringify({
          type: 0,
          beginTime: beginCreateTime,
          endTime: endCreateTime,
          needTotalNum: true,
          offset: 0,
          limit: 10,
        }),
      },
    ).then((res) => res.json());
    console.log("workOrderRes", workOrderRes);

    const applyCount = totalCountRes.totalNum || 0; // 总售后数
    const refundOnlyCount = awaitingShipmentRefundRes.totalNum || 0; // 未发货仅退款
    const workOrderCount = workOrderRes.totalNum || 0; // 工单条数
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
    // 发送错误信息回调
    ipcRenderer.send("web-scoker-error-callback", {
      info: info,
      errormsg: "查询月总工单失败,失败原因:" + JSON.stringify(error),
      shopId: info.info?.shopId,
    });
  }
});
//  发送粘贴
ipcRenderer.on("paste-to-shop", (event, text) => {
  const input = document.querySelector("#input-textarea");
  console.log("input", input);
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
// AI转人工转接子账号
safeIpcOn("ai-transfer-human-sub", async (_, args) => {
  console.log("AI转人工转接子账号", args);
  const send_openid = await getSubIdByName(args.subAccount);
  fetch(`https://store.weixin.qq.com/shop/commkf/room?action=transfer_session`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json, text/plain",
      biz_magic: window._key,
    },
    body: JSON.stringify({
      recv_openid: send_openid,
      room_id: args.messageId,
      msg_content: "留言：",
      msg_type: 1,
      need_return_msg_id: true,
    }),
  });
});

// 根据子账号名称来查询id
const getSubIdByName = async (name) => {
  const res = await fetch("https://store.weixin.qq.com/shop/commkf/acct?action=get_kf_acct", {
    method: "POST",

    headers: {
      "Content-Type": "application/json, text/plain",
      biz_magic: window._key,
    },
    body: JSON.stringify({
      status_list: [1, 2],
      offset: 0,
      limit: 20,
      disable_cache: 1,
      disable_svr_cache: 0,
    }),
  }).then((res) => res.json());

  const list = res?.kf_acct_info_list || [];
  const item = list.find(
    (it) =>
      it?.nick_name === name ||
      it?.account_name === name ||
      it?.user_name === name ||
      it?.remark === name,
  );

  return item?.openid || "";
};
