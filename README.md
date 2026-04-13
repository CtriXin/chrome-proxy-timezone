# Atlas Proxy Pro

一个聚焦 `proxy routing`、`timezone / language alignment`、`DNS / WebRTC / IP diagnostics` 的 Chrome extension。

## Quick Start

最快就位只要 3 步：

1. 打开 Chrome，进入 `chrome://extensions/`
2. 开启 `Developer mode`
3. 点击 `Load unpacked`，选择本项目目录

装好以后：

1. 在 `Options` 里导入你的节点 JSON，或手动新增节点
2. 在 popup 里切换 `System / Direct / Manual / Auto`
3. 如果要减少默认公共评分接口压力，可在 `Options -> 通用设置 -> 自定义 API Key` 填入你自己的 `AbuseIPDB API Key`

## What It Does

- 代理模式切换：`System` / `Direct` / `Manual` / `Auto`
- 节点管理：新增、更新、删除、剪贴板粘贴 proxy URL
- 路由规则：逐条编辑或源码导入
- 环境联动：timezone / language 可跟随出口 IP
- 网络诊断：出口 IP、Trace、DNS、WebRTC、Claude reachability
- 节点测速：记录当前生效节点最近一次 latency

## Packaging

后续要打包上架 zip，直接运行：

```bash
./scripts/package_extension.sh
```

输出位置：

- `dist/atlas-proxy-pro-cws-<version>.zip`

## Notes

- 公开仓库只保留 extension 侧代码
- 私有 backend / local tools 不在公开仓库里
- 变更记录见 `docs/ITERATIONS.md`

## License

MIT. See `LICENSE`.
