# 🌐 Chrome Proxy & Timezone Manager

一个为跨境开发者/安全研究员设计的**高阶 Chrome 代理管理扩展**。
它不仅提供纯粹、极速的代理切换体验，还独创了基于 **Cloudflare Workers** 的私有边缘诊断引擎，能够完美处理时区伪装、IP 风险审计与 DNS 泄漏检测，避免使用公共检测接口泄露用户隐私。

---

## ✨ 核心特性

- **🚀 零感代理切换**
  - 支持 System / Direct / Fixed Proxy / PAC 自动规则
  - 毫秒级规则匹配，并支持当前域名一键加入「直连白名单」
- **🕰️ 深度时区伪装**
  - 不依赖不稳定的 Content Script
  - 直接在 `MAIN` World 重写 `Intl.DateTimeFormat` 与原生 `Date` 方法，彻底屏蔽时区检测
- **🛡️ 边缘情报引擎 (Cloudflare Worker 驱动)**
  - 摆脱公共 API 的隐私泄露与限流问题
  - 部署自己的后端检测节点，1秒内聚合完成：
    - **IP 地理与 ISP 信息**
    - **IP 信任评分 (AbuseIPDB)**
    - **代理/VPN/IDC 机房属性识别**
    - **WebRTC 及 DNS 泄漏追踪**
- **🤖 AI 服务连通性专检**
  - 专为 Claude 等高防服务优化的独立连通性/封锁探测模块

---

## 🛠️ 安装与部署指南

本项目采用前后端分离架构，你需要先部署后端 API，再安装 Chrome 扩展。

### Step 1: 部署后端诊断引擎 (Cloudflare Worker)

由于涉及到用户 IP 隐私与请求限制，本项目将网络诊断的后端抽离。你可以**完全免费**地部署自己的诊断节点：

1. 注册并登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 导航至 **Workers & Pages** -> 点击 **Create Worker**。
3. 命名你的 Worker (例如 `proxy-check-api`) 并点击 **Deploy**。
4. 点击 **Edit code**，将本项目根目录下的 `cf-worker.js` 代码全部复制并粘贴进去。
5. 点击右上角的 **Save and deploy**，获取你的私有 Worker 域名（例如 `https://proxy-api.xxxx.workers.dev`）。

> **可选进阶配置：** 为了获得准确的 IP 风险评分，请前往 [AbuseIPDB](https://www.abuseipdb.com/) 申请免费 API Key，并在 Worker 的 Settings -> Variables 中添加环境变量 `ABUSEIPDB_KEY`。

### Step 2: 配置并安装 Chrome 扩展

1. `git clone` 本仓库或下载 ZIP 解压到本地。
2. 打开核心文件 `background.js`。
3. 找到第 8 行附近的 `API_BASE`，将其替换为你刚才获取的 **Cloudflare Worker 域名**：
   ```javascript
   const API_BASE = 'https://YOUR_WORKER_DOMAIN.workers.dev';
   ```
4. 保存文件。
5. 打开 Chrome 浏览器，在地址栏输入 `chrome://extensions/` 进入扩展管理页。
6. 打开右上角的 **开发者模式 (Developer mode)**。
7. 点击左上角的 **加载已解压的扩展程序 (Load unpacked)**，选择本项目文件夹即可！

---

## 🤝 参与贡献

欢迎任何形式的 Pull Request。如果您发现了 Bugs，或者有集成更多检测服务（如 ChatGPT 连通性、Netflix 解锁检测）的好主意，请随时提交 Issue！

## 📄 License

基于 [MIT License](LICENSE) 开源。您可以自由地在个人或商业项目中使用。
