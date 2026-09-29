# ai-draw-studio 纯前端化部署到 GitHub Pages —— 可行性调研

调研日期：2026-09-24 ｜ 调研对象：本仓库当前 `main` 分支（9fffb21）
调研方式：源码审计 + 真实静态导出构建 + 浏览器内运行时验证（未改动仓库任何源码，实验在 `/tmp` 副本进行）

---

## 0. 结论（TL;DR）

**技术上可行，且已完成端到端验证**；但"纯前端"意味着三笔必须付的账：

1. **必须改为 BYOK（用户自带 API Key）**。浏览器里没有服务端可以藏 key，`AI_API_KEY` 这类环境变量的"开箱即用"体验在 Pages 上无法保留。
2. **5 处依赖服务端子进程（`python3` / `dot`）的功能必须 JS 重写或砍掉**：自动布局、C4 多页图、样式重映射、5 个文件导入器、Graphviz 本地渲染。
3. **少数平台能力确定丢失**：自定义响应头（Excalidraw 的 `beforeunload` 未保存提醒）、服务端日志与超时兜底。

实测结果摘要：

| 验证项 | 结果 |
|---|---|
| `next build` + `output: 'export'` | ✅ EXIT=0，6 个页面全部预渲染成功 |
| 产物体积 | ✅ `out/` = **15 MB / 230 文件**（Pages 上限 1 GB） |
| 子路径 `/ai-draw-studio/` 下运行 | ✅ 页面正常渲染（draw.io / Excalidraw / Mermaid 三个模式已截图确认） |
| AI SDK 在浏览器内运行 | ✅ `streamText` / `createOpenAI` 打包成功并在运行时可用 |
| 浏览器直连 AI 网关 | ✅ `POST https://code-api.erix.vip/v1/chat/completions` 收到**可读的 401**（无效 key），CORS 全通 |
| 浏览器直连渲染服务 | ✅ kroki.io / plantuml.com / cdn.simpleicons.org 均返回 `access-control-allow-origin: *` |
| 浏览器直连 OpenAI 官方 API | ❌ 无任何 CORS 头，请求 `ERR_ABORTED` |

---

## 1. 实测证据

### 1.1 静态导出构建（在 `/tmp/ai-draw-static` 副本上）

改动仅 4 行配置 + 移除 `app/api/`：

```js
// next.config.mjs（测试用）
const nextConfig = {
  output: 'export',
  basePath: '/ai-draw-studio',
  images: { unoptimized: true },
  trailingSlash: true,
};
```

结果：

```
✓ Compiled successfully in 27.0s
✓ Generating static pages (10/10)
✓ Exporting (3/3)                                EXIT=0

Route (app)                    Size  First Load JS
┌ ○ /                       34.2 kB         206 kB
├ ○ /_not-found               999 B         104 kB
├ ○ /excalidraw             4.37 kB         180 kB
├ ○ /graphviz               3.81 kB         180 kB
├ ○ /kroki                  3.73 kB         192 kB
├ ○ /mermaid                 6.8 kB         179 kB
└ ○ /plantuml               3.73 kB         180 kB
+ First Load JS shared by all     103 kB
```

- 产物：`out/` 15 MB、230 个文件（含 `public/` 的 2.9 MB 截图）。
- **子路径前缀自动正确**：HTML 内为 `/ai-draw-studio/_next/static/chunks/...`；
  Excalidraw 字体 CSS 也自动变成 `url(/ai-draw-studio/_next/static/media/Assistant-Bold.*.woff2)`
  —— 这是原先最担心的一处资源加载路径，实测无问题。

### 1.2 浏览器冒烟测试

把 `out/` 挂到 `python3 -m http.server` 的 `/ai-draw-studio/` 子目录下，用 Playwright 打开：

- `/`（draw.io 模式）：正常渲染，draw.io 画布由 `embed.diagrams.net` iframe 提供，工作正常
  （控制台里 `embed.diagrams.net/notifications` 的 404 是上游既有噪声，与部署方式无关）。
- `/excalidraw/`：完整渲染，字体、手绘风画布、右侧聊天面板、历史/导出按钮均正常。
- `/mermaid/`：Mermaid 实时预览正常渲染。
- **唯一失败的请求**：`GET /api/settings` → 404。原因是它写成根绝对路径 `/api/settings`，
  `fetch()` **不会**自动应用 `basePath`。这正是下文的改造点之一。

### 1.3 AI SDK 浏览器运行时验证（决定性证据）

在静态站里临时加了一个客户端页面，`await import("ai")` + `await import("@ai-sdk/openai")`：

```json
{
  "bundled": { "streamText": "function", "createOpenAI": "function" },
  "call": { "ok": false, "error": "No output generated. Check the stream for errors." }
}
```

同时抓到的网络请求：

```
[POST] https://code-api.erix.vip/v1/chat/completions => [401]
```

**含义**：webpack 能把 AI SDK 打进浏览器包、运行时可用，并且浏览器**真的发出了**对网关的
`chat/completions` 请求，且拿到了**内容可读的**响应体（401 是无效 key 导致，不是 CORS 网络错误）。
即"把 `/api/chat` 搬到浏览器里跑 `streamText`"这条路线在传输层是完全成立的。

### 1.4 CORS 探测结果（`Origin: https://eason-zhang-ai.github.io`）

| 目标 | 预检/响应头 | 浏览器可直连 |
|---|---|---|
| `code-api.erix.vip`（当前生产网关） | `access-control-allow-origin: *`、`allow-headers: *`、`allow-methods: GET,POST,PUT,DELETE` | ✅ |
| `api.deepseek.com` | 回显 Origin、`allow-headers: authorization,content-type` | ✅ |
| `openrouter.ai` | `access-control-allow-origin: *` | ✅ |
| `kroki.io` | `access-control-allow-origin: *` | ✅ |
| `www.plantuml.com/plantuml/svg` | GET 带 Origin 时 `access-control-allow-origin: *` | ✅ |
| `cdn.simpleicons.org` | `access-control-allow-origin: *` | ✅ |
| `api.openai.com` | **无任何 CORS 头** | ❌ |

### 1.5 代码结构审计

- 16 个 route handler（`app/api/**/route.ts`），其中 15 个是 POST；客户端共 **20 个调用点**。
- **所有 6 个页面已经是 `"use client"`**；`app/layout.tsx` 是唯一服务端组件，且不做任何 I/O。
- **不存在**：`middleware.ts`、动态路由段、`headers()`/`cookies()`/`draftMode()`、server actions、
  `next/font`、Web Worker、WASM、`generateStaticParams`、`revalidate`。
- **没有 Node 内置模块泄漏进客户端包**（`ai` / `@ai-sdk/openai` / `@ai-sdk/provider-utils` 的 dist 里
  对 `node:*` 的引用为 0）。
- 唯一服务端依赖集中在：`app/api/**` + 3 个读盘模块（`lib/skill-assets.ts`、`lib/domain-skills.ts`、
  `lib/shape-search.ts`）+ 5 处子进程调用。
- 死代码：`lib/cached-responses.ts`（608 行）、`lib/ai-providers.ts`（199 行）**无人引用**；
  后者读 `process.env.AI_PROVIDER`，是将来误引入客户端包的隐患。

---

## 2. 改造清单（按工作量分级）

| # | 现状 | 纯前端方案 | 工作量 | 风险 |
|---|---|---|---|---|
| **A** | 6 条 AI 对话路由：`/api/{chat,mermaid,plantuml,graphviz,kroki,excalidraw}`，各自 `streamText` + 系统提示 | 把 `lib/model-provider.ts` 的 `resolveModel()` 搬成一个客户端 provider 模块：`createOpenAI({apiKey, baseURL, fetch: createBufferedFetch()})` + `streamText` 在页面内执行，用自定义 `ChatTransport` 把 UI message stream 喂给现有 `useChat`。客户端**已经在传** `{baseUrl, apiKey, model}`（9 个调用点、localStorage 档案），改动集中在 transport 层 | 中 | CORS 只对允许的网关成立，需要预检 + 明确报错文案 |
| **B** | `search_shapes` / `ai_icon` 两个服务端工具读 `shape-index.json.gz`(436 KB) + `lobe-icons.json` | 数据移入 `public/`，浏览器 `fetch` + `DecompressionStream('gzip')`（或已有的 `pako`）解压；10,446 条内存搜索无压力；图标走 `cdn.simpleicons.org`（CORS ✅） | 小 | 首次多一次 ~436 KB 下载（可缓存） |
| **C** | `lib/skill-assets.ts` / `lib/domain-skills.ts` 用 `fs` 读 `skills/**/*.md` | `compact` 模式本来就是代码内常量 → 零改动；`full` 模式把 md 放进 `public/` 按需 fetch，或构建期 `import` 成字符串 | 小 | 无明显风险 |
| **D** | `/api/kroki/render`、`/api/plantuml/render`：本地 `plantuml-encoder` 编码 + 远程渲染，Graphviz 优先本地 `dot` | 编码与请求整体搬到浏览器（两者 CORS ✅）。Graphviz 的"本地 dot"路径去掉，改走 kroki.io；若要保留离线渲染，引入 WASM Graphviz（`@viz-js/viz` / `@hpcc-js/wasm`，惰性加载 ~1.5–3 MB） | 小 / 中（含 WASM） | 失去 Graphviz 本地渲染的"无网络依赖"特性 |
| **E** | `/api/layout`：`python3 autolayout.py`（410 行，内部再调 `dot`）生成 drawio XML | ① Graphviz-WASM + 把 XML 生成逻辑移植为 TS；② 或改用纯 JS 布局（`@dagrejs/dagre` / `elkjs`）重写；③ 或一期先降级为"模型直接输出坐标" | **中大** | 纯前端化最重的一块，建议二期处理 |
| **F** | `/api/restyle`(161 行)、`/api/c4`(163 行)、`/api/import`（5 个导入器，约 900 行） | restyle/c4 是纯 XML/字符串处理 → 移植为 TS 不难；5 个导入器（SQL/Terraform/OpenAPI/Python/JS）建议一期先下线，或改由模型生成 | 中 / 大 | 功能取舍需产品决策 |
| **G** | `/api/models`（列模型）、`/api/settings`（暴露服务端默认值） | `/models`：浏览器直接 `GET ${baseUrl}/models`。`/settings`：服务端没了 → env 默认值消失，模型配置面板的 placeholder 逻辑要改，必须改为"首次进入引导用户填 key" | 小 | 需要产品上明确"无服务端默认值" |
| **H** | `next.config.mjs` 的 `headers()`（`Permissions-Policy: unload=(self)`） | 静态导出时被丢弃（Next 只打警告，`out/` 里没有该头）→ Excalidraw 的"未保存提醒"在 Chromium 115+ 不再弹出 | — | 功能降级，不影响主流程。Pages 无法配置自定义响应头 |

**其他必须改的细节**：22 处根绝对路径（`fetch("/api/...")` ×14 + 6 个 `useChat` transport + 2 个 `/example.png`），
在子路径部署下必须改为相对路径或统一前缀 helper（实测 `/api/settings` 已 404）。

---

## 3. GitHub Pages 平台约束核对

依据 [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)：

| 约束 | 数值 | 本项目影响 |
|---|---|---|
| 站点体积 | ≤ 1 GB | `out/` 15 MB，余量极大 |
| 源仓库 | 建议 ≤ 1 GB | 当前不含 `node_modules` 约 7 MB |
| 带宽 | 100 GB/月（软限制） | 单次首屏 ~1–2 MB（Excalidraw/Mermaid 惰性），可支撑约 5 万+ 次访问/月 |
| 部署超时 | 10 分钟 | 本机构建 27 s 编译，CI 上预计 2–4 分钟，安全 |
| 构建次数 | 10 次/小时（**用自定义 Actions workflow 不受此限**） | 用 `actions/upload-pages-artifact` + `deploy-pages` |
| 服务端能力 | 无（纯静态托管） | 16 个 route handler 全部不可用，见第 2 节 |
| 自定义响应头 | 不支持 | 见 H 项 |
| 站点地址 | 项目页 `https://<user>.github.io/<repo>/` | 必须 `basePath`；用户页 `<user>.github.io` 或自定义域名则不需要 |
| 私有仓库 | Free 计划不支持 Pages | 本仓库是 public fork → OK |
| ToS | 明确"不是给商业交易/SaaS 用的免费主机" | 作为开源演示/内部工具合规 |

部署形态（Actions 草图）：

```yaml
# .github/workflows/pages.yml
on: { push: { branches: [main] } }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build          # 需要 pages 专用 next.config（output: export + basePath）
      - run: touch out/.nojekyll    # 关键：否则 Jekyll 会吞掉 _next 目录
      - uses: actions/upload-pages-artifact@v3
        with: { path: out }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

---

## 4. 得到 / 失去对照

**得到**：零服务器成本、免运维、天然 CDN、可下线 Docker/1Panel、无并发与 `maxDuration` 约束、
用户数据（画布、历史、key）全部留在本地浏览器。

**失去**：
- 共享 key 的"打开即用"体验 → 改为 BYOK；
- Graphviz/PlantUML 的本地渲染（PlantUML 本来就走远程，Graphviz 的离线能力会丢，除非加 WASM）；
- Python 生态能力：自动布局、C4 多页图、SQL/TF/OpenAPI/Python/JS 导入器、样式预设重映射；
- OpenAI 官方 API 直连（无 CORS）；Azure/Bedrock/Vertex 基本不可用；
- 服务端可观测性（`console.info("[chat] request")` 这套诊断日志会消失）；
- 自定义响应头。

---

## 5. 风险与尚未验证项

1. **CORS 是硬约束**。已确认 erix 网关可用；但若将来换到 OpenAI 官方/Azure/Bedrock，
   纯前端方案直接失效。建议在 UI 上对不支持的端点给出明确提示。
2. **本地 Ollama 场景**：从 HTTPS 页面请求 `http://localhost:11434` 还需注意 Chrome 的
   Private Network Access —— 服务端需返回 `Access-Control-Allow-Private-Network: true`，
   Ollama 默认不返回；同时需 `OLLAMA_ORIGINS` 白名单。预设列表里的 `http://localhost:11434` 需实测。
3. **真实流式未端到端验证**：本次只有无效 key，无法验证网关 `stream: true` + CORS 的完整行为。
   好消息是现有设计本来就用 `createBufferedFetch()` 强制**非流式**再合成 SSE，该逻辑是纯 fetch/Response，
   浏览器行为一致；但仍建议用真实 key 跑一次。
4. **Key 暴露面**：key 存 localStorage，站点无服务端兜底，XSS 即失窃；需要提示用户使用低权限/限额 key。
5. **Graphviz-WASM 体积**对首屏的影响需实测（可 `dynamic import` 惰性加载）。
6. 移动端长会话的内存 / IndexedDB 行为未测。

---

## 6. 建议路线（分阶段）

- **阶段 0（PoC，1–2 天）**：抽出客户端 `resolveModel`（A 项）+ 只改造 Mermaid 一个模式；
  静态导出 + Actions 部署到 `gh-pages`，用真实 key 验证 CORS/流式。
- **阶段 1（3–5 天）**：A/B/C/D/G 全部前端化 —— 6 个对话模式、渲染代理、shape/icon 工具、
  模型配置；同步修掉 22 处根绝对路径、`images.unoptimized`、`.nojekyll`。此时"纯前端版"已完整可用。
- **阶段 2（按需）**：E/F 的 TS 移植；或在纯前端版里隐藏这些入口，功能保留在 Docker 自托管版。

**推荐形态：双轨**。保留 Docker 版（全功能、共享 key、服务端日志）+ 新增纯前端版（BYOK、
无子进程功能、零成本），两者共用组件层，仅替换 transport 与工具实现。这样"纯前端化"不是一次性
替换，而是多一个分发渠道。

---

## 附：本次实验未改动仓库

所有构建/页面/运行时实验均在 `/tmp/ai-draw-static`、`/tmp/site` 副本上进行；
仓库源码除本文件外未做任何修改。
