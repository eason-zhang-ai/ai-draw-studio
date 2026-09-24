# AI Smart Draw

English | [中文](README.md)

> **This project is a fork of [shenpeiheng/ai-smart-draw](https://github.com/shenpeiheng/ai-smart-draw) (MIT)** with the following enhancements:
>
> - **DeepSeek V4 model family support**: `deepseek-v4-flash`, `deepseek-v4-pro`, `deepseek-v4-flash-vision-exp` and other OpenAI-compatible endpoints, multiple config profiles (localStorage), and a **single model + image-capability toggle** (no separate model for images anymore). The default model comes from the `AI_MODEL` env var.
> - **Injected [Agents365-ai/drawio-skill](https://github.com/Agents365-ai/drawio-skill) (MIT) content assets**: XML rules / diagram-type presets / style references injected into the model context; deterministic server-side tools `search_shapes` (10,446 official shape styles) and `ai_icon` (AI/LLM brand logos).
> - **Practices adapted from the [mermaid2img Skill Hub](https://mermaid2img.com/zh-CN/skills)**: the Mermaid mode ships "Fit mobile / Improve readability / Architecture review" quick actions; the structure-first refinement order and review protocol come from the hub's curated `mermaid-preview-refinement` and `mermaid-architecture-review`, and the anti-fabrication + 12-node split rules are adapted from `mermaid-diagram-builder` (source: [mermaid2img/mermaid-skills](https://github.com/mermaid2img/mermaid-skills)).
> - **Visual self-check**: after generating a diagram, the same model reviews the rendered image and attempts to fix layout issues; available once you tick "model supports image input" in Model Settings.
> - **Adjustable thinking level**: set a default via the `AI_THINKING_LEVEL` env var (`none`/`minimal`/`low`/`medium`/`high`), overridable per browser in Model Settings — useful for suppressing long reasoning loops that cause degeneration and latency.

An intelligent diagramming application built with Next.js that harnesses the power of AI to create and manipulate various types of diagrams including Draw.io (diagrams.net), Mermaid, PlantUML, Excalidraw, and over 20 other diagram formats through natural language commands.

🔗 **Live Demo**:
- https://ai-smart-draw.vercel.app/

![de5e647f-a83a-4b28-bd56-b449f587e472.png](public/de5e647f-a83a-4b28-bd56-b449f587e472.png)
![01669c29-60a7-4777-af14-0982d6c6daa8.png](public/01669c29-60a7-4777-af14-0982d6c6daa8.png)
![409fd263-800f-4183-8df9-71691307633c.png](public/409fd263-800f-4183-8df9-71691307633c.png)
![6dd5b5c1-1e25-4d33-a45f-d10eb0fbb804.png](public/6dd5b5c1-1e25-4d33-a45f-d10eb0fbb804.png)
![7736141c-e820-450d-8260-5f5b0c846388.png](public/7736141c-e820-450d-8260-5f5b0c846388.png)
![e59f7980-ac2f-4c57-b9a7-8b7c75feed58.png](public/e59f7980-ac2f-4c57-b9a7-8b7c75feed58.png)

## 🌟 Key Features

- **AI-Powered Diagram Creation**: Transform natural language descriptions into professional diagrams
- **Multi-Format Support**: Work with Draw.io XML, Mermaid, PlantUML, Excalidraw, and 20+ other formats via Kroki
- **Intelligent Editing**: Modify existing diagrams through conversational AI prompts
- **Real-time Preview**: See changes as you interact with the AI
- **Version History**: Track and restore previous versions of your diagrams
- **Collapsible Chat Panel**: Expand or collapse the chat interface to maximize workspace
- **Flexible Rendering**: Multiple rendering options with fallback mechanisms
- **Model Configuration**: Customize AI models directly from the browser
- **Mermaid Smart Enhancements**: one-click "Fit mobile / Improve readability / Architecture review" quick actions with structure-first refinement and review protocols
- **Code / Config Import**: Upload SQL DDL, Terraform, OpenAPI (JSON/YAML), Python or JS/TS files and let the deterministic `drawio-skill` importers build the diagram directly (no model tokens spent). **Files of the same kind selected together merge into a single diagram**, so cross-file module dependencies and table foreign keys actually show up

## 🎯 Supported Diagram Types

### Draw.io (diagrams.net)
Create and edit professional flowcharts, process diagrams, and complex visualizations using AI-powered XML generation and modification.

### Mermaid
Generate flowcharts, sequence diagrams, Gantt charts, and more with live SVG previews in a dedicated workspace. The chat panel ships quick actions — **Fit mobile / Improve readability / Architecture review** — that apply structure-first refinement (direction → labels → grouping → split → styling) and a fact-vs-speculation architecture review.

### PlantUML
Create UML diagrams with a built-in rendering proxy that supports plantuml.com, kroki.io, or custom endpoints.

### Excalidraw
Freehand-style sketching combined with AI assistance for organic diagram creation.

### Graphviz
Create graph diagrams with the DOT language. Graphviz is rendered **locally by the built-in `dot` engine** (offline, no network dependency), falling back to kroki.io only if local rendering fails.

### Kroki (20+ Formats)
Generate diagrams in various formats using the kroki.io service with a single interface. **Graphviz types are rendered by the local `dot` engine and PlantUML types go directly to plantuml.com**, while the remaining types use kroki.io (with a 20s timeout that fails fast); set `KROKI_RENDER_BASE` to point at a self-hosted Kroki instance. The type dropdown defaults to "Auto-detect". Supports:

- **PlantUML**: UML diagrams, activity diagrams, sequence diagrams, etc.
- **Mermaid**: Flowcharts, sequence diagrams, Gantt charts, etc.
- **BPMN**: Business Process Modeling Notation for workflow diagrams
- **Graphviz**: Graph visualization and network diagrams
- **BlockDiag**: Block diagrams
- **C4-PlantUML**: Software architecture diagrams
- **Ditaa**: ASCII art to image conversion
- **Erd**: Entity relationship diagrams
- **Vega/Vega-Lite**: Data visualizations
- **And 15+ more formats**

## 🛠 How It Works

AI Smart Draw leverages modern web technologies to bridge natural language and diagrammatic representations:

- **Next.js App Router**: Fast, modern React framework with server-side rendering
- **AI SDK Integration**: Seamless communication with OpenAI-compatible APIs
- **Context-Aware Prompts**: Intelligent prompt engineering for each diagram type
- **Real-time Streaming**: Instant feedback with streaming responses
- **Format-Specific Tools**: Dedicated tools for each diagram format (`display_mermaid`, `display_plantuml`, etc.)

The application converts your natural language requests into structured diagram code, which is then rendered in real-time.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/eason-zhang-ai/ai-draw-studio.git
cd ai-draw-studio
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory. You can use `env.example` as a template:
```bash
cp env.example .env.local
```

Then fill in your model-service credentials.

### Model Service Configuration

Every variable supports both the `AI_*` (preferred) and `OPENAI_*` (fallback) prefixes; `AI_*` wins.

| Variable | Required | Description |
| --- | --- | --- |
| `AI_BASE_URL` | yes | OpenAI-compatible endpoint, e.g. `https://code-api.erix.vip/v1`, `https://api.deepseek.com/v1` |
| `AI_API_KEY` | yes | Endpoint key |
| `AI_MODEL` | yes | Default model. Diagram generation and image input **share the same model** |
| `AI_MAX_OUTPUT_TOKENS` | no | Max output tokens. **Empty = don't send the parameter, use the model's default ceiling** (measured [1, 393216] on this endpoint) |
| `AI_CONTEXT_LENGTH` | no | Input token budget (rough estimate). Empty = no trimming, model default window (measured ≥250K); when set, history / diagram context is trimmed to fit |
| `AI_THINKING_LEVEL` | no | Reasoning effort `none` / `minimal` / `low` / `medium` / `high`; empty = keep the endpoint default |
| `AI_MODEL_SUPPORTS_VISION` | no | `true` / `false`: whether the default model accepts image input; server default for the client's "model supports image input" toggle |

Example snippet:
```bash
AI_BASE_URL="https://code-api.erix.vip/v1"
AI_API_KEY="sk-your-key"
AI_MODEL="deepseek-v4-flash"
AI_MAX_OUTPUT_TOKENS="384000"
# AI_CONTEXT_LENGTH="64000"
AI_THINKING_LEVEL="low"
AI_MODEL_SUPPORTS_VISION="true"
```

> `AI_*` variables are read at **server runtime** — restart the container after changing them, **no image rebuild needed**.
> This project does not use `NEXT_PUBLIC_*`: those are inlined into the browser bundle by `next build`, so changing them at runtime has no effect.

#### Optional: Configure from the browser (Model Settings)

Click the **模型设置** (gear) button in the workspace header:

- **Profiles**: keep several configs (e.g. "production gateway", "local Ollama"), each with its own Base URL / API Key / model / generation params. Clicking 「新增配置」 first opens a dialog where you **pick a starting endpoint preset** (server default / Erix gateway / OpenAI / DeepSeek / Moonshot / Zhipu / Qwen / Ollama / custom … 25 in total); the profile name auto-fills from the preset and everything stays editable afterwards. Rename via 「改名」, remove via 「删除」.
- **Blank = use the server default**: leaving Base URL, API Key, model, max output tokens, or thinking level empty falls back to the server env vars above, and each input's **placeholder shows the currently effective server value** — what you see is what gets used.
- **Model supports image input (vision)**: only when ticked can you upload/paste reference images; images are then sent to that same model. Unticked disables image upload.
- **Fetch model list from gateway**: calls `/api/models`, which forwards your current credentials to the endpoint's `GET /models` and lists the real selectable model IDs (no hard-coded guesses).

The config lives in browser `localStorage` and is only sent to the server with a chat request.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.
    - `/` -> Draw.io (XML workflows, diagram history, file upload)
    - `/mermaid` -> Mermaid (live preview + definition card powered by your configured OpenAI-compatible model)
    - `/plantuml` -> PlantUML (text-based diagrams with remote preview)
    - `/excalidraw` -> Excalidraw (freeform canvas powered by the same model)
    - `/kroki` -> Kroki (multi-format diagrams powered by kroki.io)
    - `/graphviz` -> Graphviz (rendered locally by the built-in dot engine, kroki.io fallback)

## 🌐 User Interface Features

### Collapsible Chat Panel
- Toggle the chat panel to maximize your workspace
- When collapsed, a floating button provides quick access to restore the chat panel
- Smooth animations for a seamless user experience

### Responsive Design
- Optimized for desktop and laptop usage
- Mobile-friendly interface with appropriate messaging

### Unified Navigation
- Easy switching between different diagram types
- Consistent interface across all diagram workspaces

## 🚀 Deployment

### Option 1: Docker (recommended — one-command deploy)

The project ships with a `Dockerfile` and `docker-compose.yaml`; the image already includes Node.js, Python 3, Graphviz (`dot` / `tred`) and PyYAML — the complete runtime dependency set for the `drawio-skill` scripts (auto-layout / restyle / C4 / file import).

**1. Prerequisites**

- [Docker](https://docs.docker.com/engine/install/) (with the `docker compose` plugin, or the standalone `docker-compose` binary)

**2. Configure environment variables**

The default model and API key are injected through **docker compose environment variables** — `docker-compose.yaml` only holds `${VAR}` references:

```yaml
services:
  ai-draw-studio:
    environment:
      AI_BASE_URL: ${AI_BASE_URL}
      AI_API_KEY: ${AI_API_KEY}
      AI_MODEL: ${AI_MODEL}
      AI_MAX_OUTPUT_TOKENS: ${AI_MAX_OUTPUT_TOKENS}
      AI_THINKING_LEVEL: ${AI_THINKING_LEVEL}
      AI_MODEL_SUPPORTS_VISION: ${AI_MODEL_SUPPORTS_VISION}
      AI_CONTEXT_LENGTH: ${AI_CONTEXT_LENGTH}
```

Values can come from either of these:

- **Plain `docker compose`**: put a `.env` file in the project root (Compose reads it automatically for `${VAR}` interpolation); base it on `env.example`:

  ```bash
  cp env.example .env
  # fill in AI_BASE_URL / AI_API_KEY / AI_MODEL / AI_THINKING_LEVEL ...
  ```

- **Deploying with 1Panel**: fill these key/value pairs in the orchestration's **"Environment Variables" tab**. 1Panel will

  1. write them into the project root `.env` (Compose's interpolation file);
  2. normalize `docker-compose.yaml`'s `environment` into plain `${VAR}` references.

  So **put your defaults in 1Panel's environment tab, not hard-coded in the compose file** — even `${VAR:-default}` gets rewritten by 1Panel.

> See `env.example` for the full list. `AI_*` is read at runtime: after changing it just recreate the container with `docker compose up -d` — **no image rebuild needed**.

**3. Build and start**

```bash
docker compose up -d --build
```

**4. Open**

Visit http://localhost:6001

**5. Common commands**

```bash
docker compose logs -f          # view logs
docker compose up -d            # recreate the container after env changes (no --build)
docker compose down             # stop and remove the container
docker compose up -d --build    # rebuild the image after pulling new code
```

> The default port is `6001`; change it in the `ports` section of `docker-compose.yaml` (e.g. `"8080:6001"`).

### Option 2: Vercel (container image)

> ⚠️ **Do not import this repository into Vercel as a plain Next.js project.**
>
> Auto-layout, restyle, C4 and file import all `execFile("python3", …)` the vendored `skills/drawio-skill` scripts, and auto-layout pipes through the Graphviz `dot` binary (the importers also use `tred` for transitive reduction). Neither exists in Vercel's default serverless runtime, so a plain deploy makes every one of those routes return 500.

Use Vercel's **Container Images** instead. A `Dockerfile.vercel` at the project root is detected automatically and **all traffic** is routed to the resulting image (Vercel adds the rewrite rule for you). The image is built on Vercel's builders and pushed to the [Vercel Container Registry](https://vercel.com/docs/container-registry) (VCR), so the `python3` / `graphviz` / `py3-yaml` inside it are all available — the Python side keeps full parity with the Docker deployment.

**1. Prerequisites**

- The account/team needs the **Container Images (Beta)** permission. This is the one prerequisite that can actually block you — the feature is documented as `🔒 Permissions Required` and is unusable without it. Step 5 shows how to tell whether it is enabled.
- Billing follows **Active CPU + provisioned memory** (same as regular Functions), and images stored in VCR cost `$0.10/GB/month`. This image is ~1.54 GB uncompressed and ~456 MB compressed, i.e. **roughly `$0.045/month` per retained image**.

**2. Import the project**

Import this repository at [vercel.com/new](https://vercel.com/new). **Do not** change the Framework Preset — the container image takes over all traffic, and the Next.js framework build is not used.

**3. Configure environment variables**

These values do **not** ship inside the image: `.gitignore` (`.env*`) and `.dockerignore` (`.env`, `.env.local`, …) both exclude them, and `.env` has never been tracked by git — so the image contains no secrets. The code reads `process.env` **at runtime** (`lib/model-provider.ts`), there are no `NEXT_PUBLIC_*` build-time-inlined variables anywhere, and no page reads env. The values can therefore only be injected by the platform **when the container starts** — the equivalent of `docker run -e`, just configured in the Vercel dashboard instead.

Go to Project → Settings → Environment Variables and add the same `AI_*` set the Docker deployment uses (see `env.example` for full meanings):

```
AI_BASE_URL=https://code-api.erix.vip/v1
AI_API_KEY=sk-...
AI_MODEL=deepseek-v4-flash
AI_MAX_OUTPUT_TOKENS=384000
AI_THINKING_LEVEL=medium
AI_MODEL_SUPPORTS_VISION=true
AI_CONTEXT_LENGTH=1000000
```

> Mark `AI_API_KEY` as **Sensitive** (it cannot be viewed again afterwards). `AI_SKILL_CONTEXT` may be left empty; empty is treated as `compact`.

Three things that trip people up:

1. **Every variable needs its environments ticked** (Production / Preview / Development). Ticking only Production leaves PR preview deployments without a key, and the app reports "no default model configured". Tick Preview too if you want previews to work.
2. **Changing a variable requires a redeploy.** Env vars are injected when the container **starts**, and a long-running process does not pick up new values — Vercel prompts you to Redeploy; one click is enough.
3. **Do not set `PORT`** — see below.

**On the port (why 80)**

Vercel's edge forwards incoming requests to **port 80 inside the container** (docs: *"Vercel routes traffic to port `80` by default, which you can override with the `PORT` environment variable"*). If the container listens elsewhere, nothing accepts the forwarded connection and users get a bare 502 — **this is Vercel's networking contract, not a preference of this project.**

The two Dockerfiles each own one deployment target, and a single start command picks the port from `PORT`:

| File | Used by | `ENV PORT` | Container listens on |
| --- | --- | --- | --- |
| `Dockerfile` | Local / VPS (referenced by `docker-compose.yaml`) | `6001` | 6001 |
| `Dockerfile.vercel` | **Vercel** (Vercel only looks for this filename, never `Dockerfile`) | `80` | 80 |

```jsonc
// package.json — the port is no longer hard-coded; both targets share one command
"start": "next start --port ${PORT:-6001}"
```

`ENV PORT=80` is already set in `Dockerfile.vercel`, so **no port configuration is needed on the Vercel side**. If you genuinely need a different port, change **both** (`Dockerfile.vercel`'s `ENV PORT` and Vercel's `PORT`), or the mismatch turns into a 502 again.

> `EXPOSE` is image metadata only and publishes nothing; what actually decides the listening port is `next start --port`.

**4. Deploy**

Pushing to `main` triggers "build image → push to VCR → go live"; the CLI works too:

```bash
npx vercel link
npx vercel --prod
```

**5. Post-deploy self-check**

```bash
DOMAIN=https://<your-domain>
curl -s -o /dev/null -w "page %{http_code}\n" "$DOMAIN/"
curl -s "$DOMAIN/api/settings"
```

`/api/settings` should echo the `model` / `baseUrl` you configured on Vercel, with `hasApiKey` set to `true`. If it is `false`, you hit pitfall 1 or 2 above: the variable's environment is not ticked, or you changed it without redeploying.

Then press **auto-layout** once in the UI — if it produces a diagram, `python3` + Graphviz `dot` inside the image are working and the container really is serving traffic. **This is also the only reliable signal that the Container Images permission is actually enabled**: without it Vercel silently degrades to a plain Next.js build, where the page looks fine but every Python-backed route returns 500.

**6. Deployment checklist**

| # | Check | Symptom when it fails |
| --- | --- | --- |
| 1 | Account/team has **Container Images (Beta)** enabled | Auto-layout / restyle / C4 / import all return 500 (confirm via step 5) |
| 2 | All 7 `AI_*` variables present, **Production ticked** | Chat reports "no default model configured"; `/api/settings` shows `hasApiKey: false` |
| 3 | `PORT` is **not** set | The whole site returns 502 |
| 4 | Redeployed after changing variables or code | Still the old behaviour / old config |
| 5 | `curl /api/settings` + one auto-layout after deploying | — (see above) |

**7. Differences from the Docker deployment (known constraints)**

| Item | Docker / VPS | Vercel container image |
| --- | --- | --- |
| Request / response body limit | none | **4.5 MB** (`413 FUNCTION_PAYLOAD_TOO_LARGE` beyond that) |
| Max request duration | none | Hobby 300s (default is also the max) |
| Instance lifecycle | long-running container | scales to zero after **5 minutes** idle; the next request cold-starts |
| Container writability | writable | container is **stateless** (`/tmp` is still writable and the Python scripts use `os.tmpdir()`, so they are unaffected) |
| Persistence | writable container | all persistence already lives in **browser-side IndexedDB**, independent of the server |

About the 4.5 MB limit: this project has ample headroom — the largest exported diagram PNG measured 207 KB, 276 KB once base64-encoded, roughly 16× under the cap. Only uploading an exceptionally large OpenAPI / Terraform file through "file import" could reach it.

About `maxDuration`: in container mode Vercel no longer reads `export const maxDuration` from the route files, so request timeouts fall back to the plan default (300s on Hobby). Every route here finishes well under 120s, so this does not matter.

To reproduce Vercel's behaviour locally with Docker:

```bash
docker build -f Dockerfile.vercel -t ai-draw-studio:vercel .
docker run --rm -p 8080:80 ai-draw-studio:vercel   # listens on 80, matching Vercel
```

### Option 3: Local development

```bash
npm run dev     # http://localhost:6002
```

You need `python3`, Graphviz (`dot` / `tred`) and PyYAML installed locally, otherwise the Python-backed routes are unavailable.

## 📁 Project Structure

```
app/                  # Next.js application routes and pages
  api/                # API routes for different diagram types
  [diagram-type]/     # Individual pages for each diagram type
components/           # React components
  ui/                 # Reusable UI components
  [feature]/          # Feature-specific components
contexts/             # React context providers
lib/                  # Utility functions and helpers
public/               # Static assets including example images
skills/               # Vendored Agents365-ai diagram skill family (MIT)
  drawio-skill/       # XML authoring rules / scripts / shape index / style presets
  mermaid-skill/
  excalidraw-skill/
  plantuml-skill/
```

## ❓ FAQ

### Q1: How does `Agents365-ai/drawio-skill` work in this project?

It is **not a "run" plugin or an MCP service** — it's two kinds of assets ported into the web app:

1. **Injected as prompt knowledge** (`lib/skill-assets.ts`): `buildDrawioSkillContext()` returns a ~1.5KB compact reference (XML skeleton, shape keywords, edge rules, palette, diagram-type hints) appended to the drawio chat route's system prompt (`app/api/chat/route.ts`).
   > Note: originally the full 13KB `xml-authoring.md` was injected, but it made the deepseek reasoning model "over-think" (1/5 success rate), so it was reduced to a 1.5KB compact version (6/6 success rate).

2. **Called as deterministic scripts via backend routes**:

| skill script | Implementation | Exposed as |
|---|---|---|
| `shapesearch.py` (10k+ official shape styles) | TS port `lib/shape-search.ts`, reads `data/shape-index.json.gz` | `search_shapes` tool |
| `aiicons.py` (AI brand logos) | TS port, reads `data/lobe-icons.json` | `ai_icon` tool |
| `autolayout.py` (Graphviz layout) | `python3` call | `layout_diagram` tool + "Auto layout" button |
| `restyle.py` (re-theme) | `python3` call | `apply_style` tool + "Style" dropdown |
| `c4.py` (C4 multi-page drill-down) | `python3` call | `c4_diagram` tool |
| `sqlerd/tfimports/openapiimports/pyimports/jsimports` | `python3` call | file upload → `/api/import` |

3. **Integrated as model tools**: these capabilities are registered as AI SDK tools, so the model can invoke them directly in a conversation (e.g. "draw an AWS architecture with official icons" triggers `search_shapes` automatically).

**What's NOT used**: the draw.io desktop CLI (headless PNG export) is replaced by the iframe's in-browser export, so this project **does not require installing draw.io desktop**.

### Q2: How does the visual self-check work, and what does it do?

This is a browser version of drawio-skill's "Step 5 Self-Check" — **letting the model "see" its own output, find layout issues, and fix them** (the text model that generates the XML is "blind" to the rendered result).

**Flow** (`components/chat-panel.tsx` + `app/api/selfcheck/*`):

```
Diagram generated (display_diagram)
  → ① self-check toggle ON & "model supports image input" ticked in Model Settings?
       ↓ yes
  → ② export PNG from the canvas (exportPng in contexts/diagram-context.tsx)
  → ③ send the PNG to the same model (/api/selfcheck)
       checks: overlaps / clipped labels / arrows missing targets /
               edges crossing nodes / off-canvas / edge-label overlaps
       → returns a JSON issue list
  → ④ issues found? issues + a cell catalog go to the model (/api/selfcheck-fix)
       which emits id-based directives (move/nudge/relabel/restyle/delete)
       → lib/xml-edit.ts applies them deterministically → loop back to ② (max 2 rounds)
  → ⑤ feedback in chat: passed / auto-fixed N issues / issue list
```

**Purpose**: a quality safety net — the text model "guesses" coordinates and tends to produce overlaps, clipped labels, and tangled edges; inspecting the real render catches visible problems, and the model then attempts to fix them automatically.

**Limits**: detection is reliable; auto-fix is limited by the upstream model (~50-67% success per attempt, with 3 retries; on failure it degrades to listing the issues for manual fixing).

### Q3: How do the Mermaid quick actions (Fit mobile / Improve readability / Architecture review) work?

These entry points adapt the `mermaid-preview-refinement` and `mermaid-architecture-review` practices from the [mermaid2img Skill Hub](https://mermaid2img.com/zh-CN/skills):

- Clicking a quick action fills the matching instruction into the input; on send, `lib/diagram-prompt-guidelines.ts` injects the corresponding protocol **only when its keywords match** (keeps the prompt lean).
- **Refinement protocol**: minimal structural fixes in the order direction → labels → grouping → reorder → split → type change → styling; never hide structural problems with smaller fonts or extra colors; at most 2 autonomous rounds.
- **Review protocol**: checks system boundaries, data ownership, component read/write, human approval gates, and normal/failure paths; **distinguishes facts from speculation**, listing findings in text before delivering the improved diagram.
- All diagram modes also share two always-on rules (`DIAGRAM_QUALITY_GUIDELINES`): never invent components/flows the user's material doesn't support (mark gaps as assumptions), and treat ~12 top-level nodes as a split/aggregation trigger.

### Q4: What rendering backends and fallbacks do Graphviz / Kroki use?

The public `kroki.io` instance is frequently overloaded and its render endpoints are unstable, so `app/api/kroki/render/route.ts` uses layered fallbacks:

| Diagram type | Rendering path | Fallback |
|---|---|---|
| Graphviz | built-in `dot -Tsvg`, rendered **locally** (offline) | kroki.io |
| PlantUML (the Kroki workspace default) | `plantuml.com` (override with `PLANTUML_RENDER_BASE`) | kroki.io |
| Other 20+ types | kroki.io (20s timeout, fails fast with a clear error) | `KROKI_RENDER_BASE` → self-hosted instance |

To render all types fully offline, add a self-hosted Kroki service to `docker-compose.yaml` and point `KROKI_RENDER_BASE` at it.

## ✅ TODOs

- [x] Allow the LLM to modify the XML instead of generating it from scratch everytime.
- [x] Improve the smoothness of shape streaming updates.
- [x] Add collapsible chat panel for better workspace utilization.

## 📄 License

This project is licensed under the MIT License.

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=eason-zhang-ai%2Fai-draw-studio&type=date&legend=top-left)](https://www.star-history.com/?repos=eason-zhang-ai%2Fai-draw-studio&type=date&legend=top-left)
