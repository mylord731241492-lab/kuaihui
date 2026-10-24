# AI 与设置回归测试

在仓库根目录使用 Node.js 22 或更新版本运行：

```powershell
node acceptance/run.cjs
```

也可单独执行，例如 `node acceptance/ai-runtime.cjs`。测试不需要安装额外依赖。

| 测试 | 范围 |
| --- | --- |
| `ai-knowledge-store.cjs` | 本地知识库读写、校验、账号和店铺隔离、原子写入失败 |
| `ai-products.cjs` | 商品采集数据、文字学习状态、原文证据校验、异步结果失效 |
| `ai-provider.cjs` | 模型接口请求格式、模拟加密保存、限流和错误处理 |
| `ai-runtime.cjs` | 知识检索、试答、转人工、商品学习队列和取消 |
| `ai-retrieval.cjs` | 电商词典分词、同义词扩展、高置信原话直答及其对模型来源校验的保留 |
| `ai-settings-controller.cjs` | 设置 IPC 权限、窗口生命周期、配置保存和迁移 |
| `ai-main-integration.cjs` | 主进程实际逻辑的消息去重、发送状态、回执和退出清理 |
| `ai-pdd-send-ack.cjs` | 拼多多预加载逻辑的请求与回执关联 |
| `ai-xhs-ack.cjs` | 小红书回执匹配与无法确认发送时的保守处理 |
| `local-ai-renderer.cjs` | 旧设置入口、配置保存及前端语法回归 |

测试读取当前 `app-asar` 代码，并使用临时目录、假店铺、模拟模型结果、模拟 Electron IPC 或模拟平台请求。不会读取实际中转密钥、访问模型网络服务或向买家发送消息。`ai-provider.cjs` 中的密钥为明确标记的测试假值；加密桥接使用测试实现，不代表验证了 Windows 系统加密服务。

部分测试会在此目录生成 `*-results.json`，这些报告已忽略。知识库、商品库和发送日志等测试数据写入系统临时目录并在测试结束后清理。

这些测试不替代安装包、真实 Electron 窗口、平台登录和真实发送验收。原来的 `popup-auth-boundary.cjs`、`popup-bootstrap-fallback.cjs` 及浏览器界面测试依赖本机 Playwright 的绝对路径，因此未纳入本组可移植测试。
