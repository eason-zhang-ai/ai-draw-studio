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

const SHAPESEARCH_PYTHON_HINT =
    /Run `python3 <this-skill-dir>\/scripts\/shapesearch\.py "<keywords>"` to get the exact official style \+ size, or see `references\/shapes\.md` for the hand-writable cheatsheet\. For \*\*AI\/LLM brand logos\*\* \([^)]*\), which draw\.io has none of, use `python3 <this-skill-dir>\/scripts\/aiicons\.py "<brand>"`\./;

/**
 * Build the drawio-skill context for a request:
 * - the full xml-authoring reference (skeleton/cells/containers/edges/palette/layout),
 *   with Python script hints rewritten to point at the search_shapes / ai_icon tools;
 * - sections of diagram-types.md matched by the user's request keywords;
 * - the hand-writable style cheat sheet from shapes.md, if budget allows.
 */
export function buildDrawioSkillContext(userText: string, budget = 18000): string {
    const parts: string[] = [];

    let xmlAuthoring = loadReference("xml-authoring.md") || "";
    if (xmlAuthoring) {
        xmlAuthoring = xmlAuthoring.replace(
            SHAPESEARCH_PYTHON_HINT,
            "Use the `search_shapes` tool with your keywords to get the exact official style + size. For **AI/LLM brand logos** (OpenAI, Claude, Gemini, …), which draw.io has none of, use the `ai_icon` tool with the brand name."
        );
        parts.push(xmlAuthoring);
    }

    const diagramTypes = loadReference("diagram-types.md");
    if (diagramTypes) {
        const text = userText.toLowerCase();
        const matched = DIAGRAM_TYPE_SECTIONS.filter((entry) =>
            entry.keywords.some((k) => text.includes(k))
        )
            .slice(0, 2)
            .flatMap((entry) => entry.sections);
        if (matched.length > 0) {
            parts.push(
                "## Diagram type presets (from drawio-skill)\n\n" +
                    extractSections(diagramTypes, matched)
            );
        }
    }

    const shapes = loadReference("shapes.md");
    if (shapes) {
        parts.push(
            "## Hand-writable style cheatsheet\n\n" +
                extractSections(shapes, [
                    "Cheatsheet — hand-writable styles",
                    "Common shapes (`shape=` keyword)",
                    "UML primitives",
                    "Containers (parent-child; children use relative coords)",
                    "Edges",
                    "Useful property knobs",
                ])
        );
    }

    // Budget-trim: keep parts in priority order while under the byte budget.
    // The first part is always kept (even if it alone exceeds the budget).
    const kept: string[] = [];
    let used = 0;
    for (const part of parts) {
        if (used > 0 && used + part.length > budget) break;
        kept.push(part);
        used += part.length;
    }
    return kept.join("\n\n");
}
