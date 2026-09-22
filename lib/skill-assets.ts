import { existsSync, readFileSync } from "fs";
import path from "path";

/**
 * Server-only loader for the vendored drawio-skill reference markdown.
 * The skill (Agents365-ai/drawio-skill, MIT) is the canonical source of
 * draw.io XML authoring rules; these assets are injected into the model
 * system prompt so generation follows the same conventions.
 */

const SKILL_REFERENCES_DIR = path.join(
    process.cwd(),
    "skills",
    "drawio-skill",
    "references"
);

const cache = new Map<string, string>();

export function loadReference(name: string): string | null {
    if (cache.has(name)) return cache.get(name)!;
    const file = path.join(SKILL_REFERENCES_DIR, name);
    if (!existsSync(file)) {
        cache.set(name, "");
        return null;
    }
    const content = readFileSync(file, "utf-8");
    cache.set(name, content);
    return content;
}

interface Heading {
    index: number;
    level: number;
    title: string;
}

function collectHeadings(lines: string[]): Heading[] {
    const headings: Heading[] = [];
    lines.forEach((line, i) => {
        const m = line.match(/^(#{2,3})\s+(.+?)\s*$/);
        if (m) headings.push({ index: i, level: m[1].length, title: m[2].trim() });
    });
    return headings;
}

/** Extract the given top-level sections from a markdown doc (by ## / ### title). */
export function extractSections(md: string, headings: string[]): string {
    const lines = md.split("\n");
    const all = collectHeadings(lines);
    const wanted = headings.map((h) => h.toLowerCase());
    const parts: string[] = [];
    all.forEach((h, i) => {
        if (!wanted.includes(h.title.toLowerCase())) return;
        const next = all.slice(i + 1).find((n) => n.level <= h.level);
        const end = next ? next.index : lines.length;
        parts.push(lines.slice(h.index, end).join("\n").trim());
    });
    return parts.join("\n\n");
}

/** diagram-types.md section headings matched by user-request keywords. */
const DIAGRAM_TYPE_SECTIONS: { keywords: string[]; sections: string[] }[] = [
    {
        keywords: ["er图", "er 图", "实体关系", "数据模型", "数据库", "schema", "表结构", "erd"],
        sections: ["ERD (Entity-Relationship Diagram)"],
    },
    {
        keywords: ["uml", "类图", "class diagram", "类继承"],
        sections: ["UML Class Diagram"],
    },
    {
        keywords: ["序列", "时序", "sequence", "交互", "lifeline", "调用链"],
        sections: ["Sequence Diagram"],
    },
    {
        keywords: ["c4", "系统上下文", "container", "组件图"],
        sections: ["C4 Model (System Context / Container / Component)"],
    },
    {
        keywords: ["架构", "architecture", "系统设计", "微服务", "云原生", "aws", "azure", "gcp", "部署"],
        sections: ["Architecture Diagram"],
    },
    {
        keywords: ["神经网络", "machine learning", "deep learning", "transformer", "深度学习", "模型结构", "cnn", "lstm"],
        sections: ["ML / Deep Learning Model Diagram"],
    },
    {
        keywords: ["sysml", "bdd", "ibd", "需求图", "参数图"],
        sections: [
            "SysML (Block Definition / Internal Block / Requirement / Parametric)",
            "Block Definition Diagram (bdd)",
            "Internal Block Diagram (ibd)",
            "Requirement Diagram (req)",
            "Parametric Diagram (par)",
        ],
    },
    {
        keywords: ["bpmn", "业务流程", "business process", "泳池"],
        sections: ["BPMN (Business Process)"],
    },
    {
        keywords: ["网络", "拓扑", "network", "lan", "wan", "子网", "dmz", "防火墙"],
        sections: ["Network Topology"],
    },
    {
        keywords: ["泳道", "swimlane", "跨职能", "交接"],
        sections: ["Cross-Functional Flowchart (Swimlane)"],
    },
    {
        keywords: ["流程图", "flowchart", "流程", "决策树", "工作流", "状态机", "状态图"],
        sections: ["Flowchart (enhanced)"],
    },
];

/**
 * Compact draw.io authoring reference.
 *
 * The full 13KB xml-authoring guide makes the reasoning model degenerate
 * (7 tools + full context = 1/5 tool calls; 7 tools + no context = 5/5,
 * measured on the same prompt). Keep the essentials as a short hint and
 * let the search_shapes / ai_icon / layout_diagram tools cover the rest.
 */
const COMPACT_DRAWIO_REF = `## draw.io XML essentials
- Document: <mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/> ...user cells... </root></mxGraphModel>
- Every mxCell must be a DIRECT child of <root> (never nested). Unique ids from "2". Top-level cells use parent="1".
- Vertex: <mxCell id="2" value="Label" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1"><mxGeometry x=".." y=".." width=".." height=".." as="geometry"/></mxCell>
- Edge must carry a <mxGeometry relative="1" as="geometry"/> child (self-closing edges do NOT render): <mxCell id=".." style="edgeStyle=orthogonalEdgeStyle;rounded=1;endArrow=classic;" edge="1" parent="1" source=".." target="..">...</mxCell>
- Escape & < > " in values; multi-line labels use &#xa;.
- Shape keywords: rounded=1 (rounded rect/service), ellipse (start/end/oval), rhombus (decision), shape=cylinder3 (database), swimlane (titled container).
- Keep everything in one viewport (x 0-900, y 0-650); align peer nodes; consistent sizes; no overlaps; labels short.
- Palette (fill/stroke): blue #dae8fc/#6c8ebf, green #d5e8d4/#82b366, yellow #fff2cc/#d6b656, orange #ffe6cc/#d79b00, red #f8cecc/#b85450, purple #e1d5e7/#9673a6.
- For vendor/AI logos, use search_shapes / ai_icon — never guess a shape=mxgraph.* name.
- For large graphs (15+ nodes), use layout_diagram (structural nodes+edges) instead of hand-placing coordinates.`;

/** One-line diagram-type hints (kept tiny to avoid reasoning blow-up). */
const COMPACT_TYPE_HINTS: { keywords: string[]; hint: string }[] = [
    {
        keywords: ["架构", "architecture", "微服务", "系统", "部署"],
        hint: "架构图：分层（客户端/接入/服务/数据），同层水平、跨层垂直，服务用圆角矩形、数据库用圆柱。",
    },
    {
        keywords: ["流程图", "flowchart", "流程", "工作流", "审批"],
        hint: "流程图：开始/结束用椭圆，处理用圆角矩形，判断用菱形，主流程竖直。",
    },
    {
        keywords: ["序列", "时序", "sequence", "交互"],
        hint: "时序图：参与者顶部横向排列，生命线向下，消息用箭头按时间排序。",
    },
    {
        keywords: ["er", "实体", "数据库", "schema", "表"],
        hint: "ER 图：实体用矩形（或 swimlane 列字段），主键/外键标注，关系用连线。",
    },
    {
        keywords: ["uml", "类图", "class diagram"],
        hint: "类图：类用三格矩形（名/属性/方法），继承用空心三角箭头。",
    },
    {
        keywords: ["泳道", "swimlane", "跨职能"],
        hint: "泳道图：每个角色一条泳道（swimlane），活动横向排列，交接跨泳道。",
    },
];

/**
 * Skill-context mode.
 *
 * "compact" (default) injects the ~1.5KB essentials below. It was adopted
 * when the endpoint degenerated badly: streaming mode + a full 13KB
 * xml-authoring guide + 7 tools produced only 1/5 usable tool calls, while
 * the compact hint measured 6/6.
 *
 * That measurement predates three changes that all push the other way:
 *   1. createBufferedFetch forces NON-streaming upstream (the largest factor);
 *   2. AI_MAX_OUTPUT_TOKENS is no longer clamped to 8k, so a slow "thinking"
 *      pass is not truncated mid-reasoning;
 *   3. AI_THINKING_LEVEL can cap reasoning directly (none/low).
 *
 * Set AI_SKILL_CONTEXT=full to inject the complete vendored drawio-skill
 * references instead, and A/B it against compact on your own prompts.
 */
const SKILL_CONTEXT_MODE = (process.env.AI_SKILL_CONTEXT || "compact")
    .trim()
    .toLowerCase();

/** Full mode: the real vendored reference docs (xml-authoring + matching type sections). */
function buildFullDrawioSkillContext(userText: string, budget: number): string {
    const lower = userText.toLowerCase();
    const xmlAuthoring = loadReference("xml-authoring.md") ?? "";
    const diagramTypes = loadReference("diagram-types.md") ?? "";

    const sections = DIAGRAM_TYPE_SECTIONS.filter((entry) =>
        entry.keywords.some((k) => lower.includes(k))
    ).flatMap((entry) => entry.sections);

    const typeReference = sections.length
        ? extractSections(diagramTypes, sections)
        : "";

    const joined = [xmlAuthoring, typeReference]
        .filter((part) => part.trim().length > 0)
        .join("\n\n");

    return joined.length > budget ? joined.slice(0, budget) : joined;
}

export function buildDrawioSkillContext(userText: string, budget = 18000): string {
    if (SKILL_CONTEXT_MODE === "full") {
        return buildFullDrawioSkillContext(userText, budget);
    }

    const lower = userText.toLowerCase();
    const hints = COMPACT_TYPE_HINTS.filter((entry) =>
        entry.keywords.some((k) => lower.includes(k))
    )
        .slice(0, 2)
        .map((entry) => entry.hint);

    if (hints.length > 0) {
        return `${COMPACT_DRAWIO_REF}\n\n## Diagram type hints\n${hints
            .map((h) => `- ${h}`)
            .join("\n")}`;
    }
    return COMPACT_DRAWIO_REF;
}
