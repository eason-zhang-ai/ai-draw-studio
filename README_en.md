# AI Smart Draw

English | [中文](README.md)

> **This project is a fork of [shenpeiheng/ai-smart-draw](https://github.com/shenpeiheng/ai-smart-draw) (MIT)** with the following enhancements:
>
> - **DeepSeek V4 model family support**: `deepseek-v4-flash` (fast), `deepseek-v4-pro` (strong), `deepseek-v4-flash-vision-exp` (vision), custom OpenAI-compatible API endpoints, multi-config management + capability routing (requests with images automatically switch to the vision model).
> - **Injected [Agents365-ai/drawio-skill](https://github.com/Agents365-ai/drawio-skill) (MIT) content assets**: XML rules / diagram-type presets / style references injected into the model context; deterministic server-side tools `search_shapes` (10,446 official shape styles) and `ai_icon` (AI/LLM brand logos).
> - **Practices adapted from the [mermaid2img Skill Hub](https://mermaid2img.com/zh-CN/skills)**: the Mermaid mode ships "Fit mobile / Improve readability / Architecture review" quick actions; the structure-first refinement order and review protocol come from the hub's curated `mermaid-preview-refinement` and `mermaid-architecture-review`, and the anti-fabrication + 12-node split rules are adapted from `mermaid-diagram-builder` (source: [mermaid2img/mermaid-skills](https://github.com/mermaid2img/mermaid-skills)).
> - **Visual self-check**: after generating a diagram, a vision model reviews the rendered image and attempts to fix layout issues; disabled automatically when no vision model is configured.

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

Then update `.env.local` with your OpenAI credentials.

### OpenAI Configuration

- `OPENAI_API_KEY` (required): Secret key from your OpenAI account.
- `OPENAI_MODEL` (optional): Defaults to `gpt-4o-mini`, override if you prefer another released variant.
- `OPENAI_BASE_URL` (optional): Defaults to `https://api.openai.com/v1`; set this if you are self-hosting a proxy or gateway.

Example snippet:
```bash
OPENAI_API_KEY="sk-your-key"
# OPENAI_MODEL="gpt-4o-mini"
# OPENAI_BASE_URL="https://api.openai.com/v1"
```

#### Optional: Configure from the browser

- Click the **模型设置** button in any workspace header to override API Key, Base URL, or model for the current browser. Values are stored in `localStorage` and only sent to the server when you submit a chat request.
- Leave any field blank to fall back to the server-side environment variables described above.
- Use the **拉取列表** button to call the `/api/models` helper, which forwards the current credentials to `GET /models` and lists selectable model IDs.

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

The project ships with a `Dockerfile` and `docker-compose.yaml`; the image already includes Node.js, Python 3, and Graphviz (required by the drawio-skill scripts).

**1. Prerequisites**

- [Docker](https://docs.docker.com/engine/install/) (with the `docker compose` plugin, or the standalone `docker-compose` binary)

**2. Configure environment variables**

Copy the example config to a local config (`.env.local` is gitignored and never committed):

```bash
cp env.example .env.local
```

Edit `.env.local` and fill in your model API:

```bash
# Required: server-side default model config (used when the browser leaves fields blank)
AI_BASE_URL="https://code-api.erix.vip/v1"   # or https://api.deepseek.com/v1 (any OpenAI-compatible endpoint)
AI_API_KEY="sk-your-key"
AI_MODEL="deepseek-v4-flash"
AI_VISION_MODEL="deepseek-v4-flash-vision-exp"   # used by visual self-check / image reference; leave empty to disable

# Optional: front-end defaults (inlined at build time; code defaults apply if unset)
# NEXT_PUBLIC_AI_BASE_URL="https://code-api.erix.vip/v1"
# NEXT_PUBLIC_AI_VISION_MODEL="deepseek-v4-flash-vision-exp"
```

> See `env.example` for the full list. `AI_API_KEY` is read at runtime — restart the container after editing it; no image rebuild needed.

**3. Build and start**

```bash
docker compose up -d --build
```

**4. Open**

Visit http://localhost:6001

**5. Common commands**

```bash
docker compose logs -f          # view logs
docker compose restart          # restart (after editing .env.local)
docker compose down             # stop and remove the container
docker compose up -d --build    # rebuild after pulling new code
```

> The default port is `6001`; change it in the `ports` section of `docker-compose.yaml` (e.g. `"8080:6001"`).

### Option 2: Vercel

You can also deploy with the [Vercel Platform](https://vercel.com/new), or develop locally with `npm run dev` / `npm run build && npm start`.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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
  → ① self-check toggle ON & a vision model configured?
       ↓ yes
  → ② export PNG from the canvas (exportPng in contexts/diagram-context.tsx)
  → ③ send the PNG to deepseek-v4-flash-vision-exp (/api/selfcheck)
       checks: overlaps / clipped labels / arrows missing targets /
               edges crossing nodes / off-canvas / edge-label overlaps
       → returns a JSON issue list
  → ④ issues found? issues + a cell catalog go to the text model (/api/selfcheck-fix)
       which emits id-based directives (move/nudge/relabel/restyle/delete)
       → lib/xml-edit.ts applies them deterministically → loop back to ② (max 2 rounds)
  → ⑤ feedback in chat: passed / auto-fixed N issues / issue list
```

**Purpose**: a quality safety net — the text model "guesses" coordinates and tends to produce overlaps, clipped labels, and tangled edges; the vision model inspects the real render, catches visible problems, and attempts to fix them automatically.

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
