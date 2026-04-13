# Atlas Proxy Pro Iteration Log

## 本次公开仓库保留范围
- 保留：Chrome extension 前端与扩展运行逻辑
- 不公开：Cloudflare Worker 源码、Atlas Mini 本地代理源码、`.ai/` 恢复上下文、打包产物
- 目的：公开仓库只保留可发布、可审查、可维护的 extension 代码

## 主要迭代

### 1. 核心代理与节点体验
- 修复节点切换后出口 IP 不联动的问题
- 补齐 `Paste URL` 剪贴板解析，支持 `curl --proxy ...`、标准 proxy URL、`host:port:user:pass`
- 修复代理鉴权 `onAuthRequired` 对 `proxyServer` / `challenger` 的兼容问题
- 导入 ZeroOmega 节点并转为当前插件可导入格式
- 用 Webshare 节点清单校准账号密码并修正错误 host 展示

### 2. 时区 / 语言联动
- 支持 timezone / language 随 IP 跟随
- 保留手动覆盖：用户手动选定后不再被自动改写
- 扩充 timezone 与 language 列表，并按大洲 / 分组展示
- 在 popup 中加入页面环境与 IP 环境的一致性展示

### 3. Popup 性能与交互
- 首屏改为优先读取本地 snapshot，减少 popup 打开卡顿
- 去掉 popup 打开时的自动重探测，改为手动触发完整扫描
- 修复 light / dark / auto 主题切换与首屏闪黑问题
- 新增 hero 手动刷新按钮，用于卡住时主动刷新出口 IP
- 优化当前节点和延迟展示，避免长节点名导致布局挤压

### 4. Claude / 网络 / 诊断能力
- Claude 检测改为手动触发，避免每次打开 popup 自动打接口
- 补齐 trust score、IP attributes、DNS / WebRTC / Trace / 连通性等展示
- 诊断中心与 popup 共享核心数据逻辑
- 增加目标页环境检测能力，用于检查页面 timezone / language / WebRTC / WebGL

### 5. 节点测速与快照
- 新增当前生效节点延迟记录 `profileLatencyMap`
- 在 popup 与 options 中展示最近测速结果与时间
- 代理切换 / 保存应用后，后台自动刷新当前节点延迟
- 手动测试连接不再弹 `alert`，改为写入状态记录
- 对缺少用户名 / 密码的远程 proxy 给出显式提醒

### 6. 发布与合规准备
- 补齐 GitHub Pages 隐私页
- 整理 Chrome Web Store 所需权限说明、单一用途说明、数据收集说明
- 准备 store assets 与截图资源
- 增加公开仓库打包脚本，便于后续生成上架 zip

### 7. 用户自带配额
- 新增 `AbuseIPDB API Key` 设置入口
- 用户可填写自己的 `API Key`，风险评分优先走个人配额
- 保持默认公共接口作为 fallback

## 当前公开仓库不包含的内容
- `cf-worker.js`
- `mini-proxy/`
- `.ai/`
- `dist/`

## 打包说明
- 使用 `scripts/package_extension.sh`
- 输出目录：`dist/`
- 输出文件名：`atlas-proxy-pro-cws-<version>.zip`
