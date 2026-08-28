import { existsSync, readFileSync } from "fs";
import path from "path";

/**
 * Server-only loader for the vendored skill family (Agents365-ai, MIT):
 * drawio / mermaid / excalidraw / plantuml. Each skill's SKILL.md and
 * reference markdown is injected into the corresponding domain's system
 * prompt so generation follows the skill conventions.
 */

const SKILLS_ROOT = path.join(process.cwd(), "skills");

const cache = new Map<string, string>();

export function loadSkillFile(skill: string, ...parts: string[]): string | null {
    const key = [skill, ...parts].join("/");
    if (cache.has(key)) return cache.get(key)!;
    const file = path.join(SKILLS_ROOT, skill, ...parts);
    if (!existsSync(file)) {
        cache.set(key, "");
        return null;
    }
    const content = readFileSync(file, "utf-8");
    cache.set(key, content);
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
        const m = line.match(/^(#{1,3})\s+(.+?)\s*$/);
        if (m) headings.push({ index: i, level: m[1].length, title: m[2].trim() });
    });
    return headings;
}

/** Extract named sections (by heading title) from a markdown doc. */
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

/**
 * Assemble a domain skill context:
 * the SKILL.md body (frontmatter stripped) plus optionally matched
 * reference sections, capped to a byte budget (highest priority first).
 */
export function buildSkillContext(
    skill: string,
    opts: {
        /** SKILL.md sections to keep (by heading title); omit for full body */
        skillSections?: string[];
        referenceFiles?: string[];
        /** section headings to extract from the reference files */
        sections?: string[];
        budget?: number;
        /** strip lines that tell the model to run local scripts/CLI */
        stripScriptHints?: boolean;
    } = {}
): string {
    const parts: string[] = [];
    const budget = opts.budget ?? 16000;
    let used = 0;
    const push = (text: string) => {
        if (!text) return;
        if (used + text.length > budget) return;
        parts.push(text);
        used += text.length;
    };

    let skillMd = loadSkillFile(skill, "SKILL.md") || "";
    if (skillMd) {
        // strip YAML frontmatter
        skillMd = skillMd.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
        if (opts.skillSections?.length) {
            skillMd = extractSections(skillMd, opts.skillSections);
        }
        if (opts.stripScriptHints) {
            skillMd = skillMd
                .replace(/`?mmdc[^`\n]*`?/g, "the validator")
                .replace(/`?python3? [^`\n]*`?/g, "a bundled script");
        }
        push(skillMd);
    }

    for (const ref of opts.referenceFiles || []) {
        const md = loadSkillFile(skill, ...ref.split("/")) || "";
        if (!md) continue;
        push(opts.sections?.length ? extractSections(md, opts.sections) : md);
    }
    return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Per-domain context builders
// ---------------------------------------------------------------------------

const MERMAID_TYPE_REFERENCES: { keywords: string[]; file: string }[] = [
    {
        keywords: ["流程", "flowchart", "决策", "工作流", "状态机"],
        file: "reference/FLOWCHART.md",
    },
    {
        keywords: ["序列", "时序", "sequence", "交互", "调用", "lifeline"],
        file: "reference/SEQUENCE.md",
    },
    {
        keywords: ["类图", "class", "er", "实体", "数据库", "schema", "表结构"],
        file: "reference/CLASS-ER.md",
    },
    {
        keywords: ["架构", "architecture", "系统", "微服务", "云", "部署"],
        file: "reference/ARCHITECTURE.md",
    },
    {
        keywords: ["用例", "usecase", "use case"],
        file: "reference/USECASE.md",
    },
    {
        keywords: ["状态", "state", "甘特", "gantt", "饼图", "pie", "git", "思维导图", "mindmap"],
        file: "reference/OTHER-TYPES.md",
    },
];

export function buildMermaidSkillContext(userText: string): string {
    const lower = userText.toLowerCase();
    const refs: string[] = [];
    for (const entry of MERMAID_TYPE_REFERENCES) {
        if (entry.keywords.some((k) => lower.includes(k))) {
            refs.push(entry.file);
            if (refs.length >= 2) break;
        }
    }
    return buildSkillContext("mermaid-skill", {
        skillSections: ["Diagram Types", "Syntax Reference", "Validation (Required)"],
        referenceFiles: refs,
        budget: 12000,
        stripScriptHints: true,
    });
}

export function buildExcalidrawSkillContext(userText: string): string {
    void userText;
    return buildSkillContext("excalidraw-skill", {
        referenceFiles: ["references/schema-reference.md"],
        budget: 16000,
        stripScriptHints: true,
    });
}

export function buildPlantumlSkillContext(userText: string): string {
    void userText;
    return buildSkillContext("plantuml-skill", {
        budget: 12000,
        stripScriptHints: true,
    });
}
