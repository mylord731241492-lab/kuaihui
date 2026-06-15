import { J as e } from "./vendor-DHo7BzsC.js";
const a = e("ai", {
  state: () => ({
    baseUrl: "http://xiaoniu.niushidai.cn/prod-api",
    apiKey: "LOCAL_TEST_API_KEY_PLACEHOLDER",
    model: "Doubao-pro-256k",
    api_context_length: 204800,
    max_token: 512,
    chunk_size: 800,
    temperature: 0.5,
    top_p: 1,
    top_k: 30,
    networking: !1,
    hybrid_search: !0,
    only_need_search_results: !1,
    rerank: !1,
    conversationMap: {},
  }),
  persist: [
    { paths: ["baseUrl"], storage: localStorage },
    { paths: ["conversationMap"], storage: sessionStorage },
  ],
  actions: {},
  getters: {},
});
export { a as u };
