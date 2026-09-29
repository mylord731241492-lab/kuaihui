# 抖音协议资源来源

这 3 个 `.proto` 文件逐字节提取自原发布渠道的 **快茴AI客服 3.6.9** 安装包，没有根据字段名重新编造协议，也没有修改内容。

- 发布渠道：仓库原 `app-asar/dist/builder-effective-config.yaml` 的 `publish.url`。
- 名称线索：原主进程 `VersionRollback` 引用的 [历史版本清单](https://xiaoniukefuzhushou.oss-cn-shenzhen.aliyuncs.com/saas3/versions.json)。清单提供产品安装包名称格式；3.6.9 文件另行直接验证存在。
- [3.6.9 安装包](https://xiaoniukefuzhushou.oss-cn-shenzhen.aliyuncs.com/saas3/%E5%BF%AB%E8%8C%B4AI%E5%AE%A2%E6%9C%8D%20Setup%203.6.9.exe)，大小 `100410943` 字节。
- 下载时间：2026-09-19。
- 安装包 SHA-256：`8D73251A2C78F4EE0222831290BB7F9FFAA913B0D582C5AE596EC23F4096ED66`。
- 安装包 MD5：`38B4EC8043B805F95F68671855623380`，匹配发布服务器的 HTTP ETag。
- 原安装包未进行 Authenticode 签名；没有获得旧版 SHA-512 清单。以上校验仅证明当前下载与该发布源一致，不代表代码签名验证。

仅用 7-Zip 静态解包，没有运行安装程序。文件原路径均为 `resources/protobuf/protoFile/`。

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `douyin_first_message.proto` | 1274 | `56DF4018D7117CB6A33AE7ECF267D6ECDD9D4DE86EFDF027FD1DB489088F7FA3` |
| `douyin_second_message.proto` | 953 | `400093B8D8B4C79523C4F71C32B735BDBB97DA7EF9EC961DDFABAFDA0CC813AD` |
| `douyin_send_message.proto` | 258 | `1E9DAB058038A2CE718C5A1B8D40C39AB9900F291AAE062F8E2B51CC8F960C18` |

原包内 `package.json` 版本是 `3.6.9`，`builder-effective-config.yaml` 明确使用 Electron `34.0.0`。原包主进程中从 `const protoFilePath$2 =` 至第三个消息解码处理结束的 5372 字符代码，与本仓库对应区段完全一致（只统一换行符后比较）。这确认了协议资源与本仓库解码实现的版本匹配；不替代真实店铺消息的端到端验收。
