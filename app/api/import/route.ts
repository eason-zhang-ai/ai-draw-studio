import { execFile } from "child_process";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const maxDuration = 120;

/**
 * File importers from drawio-skill: SQL DDL -> ER, Terraform -> architecture,
 * OpenAPI -> API diagram, Python / JS-TS -> import graph. Each importer emits
 * graph.json which is then laid out by autolayout.py (Graphviz).
 */

const KIND_CONFIG: Record<
    string,
    { script: string; ext: string; args: string[]; label: string }
> = {
    sql: { script: "sqlerd.py", ext: ".sql", args: ["--group"], label: "SQL DDL → ER 图" },
    terraform: { script: "tfimports.py", ext: ".tf", args: [], label: "Terraform → 架构图" },
    openapi: { script: "openapiimports.py", ext: ".yaml", args: ["--group"], label: "OpenAPI → API 图" },
    python: { script: "pyimports.py", ext: ".py", args: ["--group"], label: "Python → 模块依赖图" },
    javascript: { script: "jsimports.py", ext: ".js", args: ["--group"], label: "JS/TS → 模块依赖图" },
};

function detectKind(filename: string): string | null {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".sql")) return "sql";
    if (lower.endsWith(".tf")) return "terraform";
    if (lower.endsWith(".py")) return "python";
    if (lower.endsWith(".js") || lower.endsWith(".ts") || lower.endsWith(".jsx") || lower.endsWith(".tsx")) return "javascript";
    if (lower.endsWith(".yaml") || lower.endsWith(".yml")) return "openapi";
    if (lower.endsWith(".json")) return "openapi"; // likely an OpenAPI spec
    return null;
}

export async function POST(req: Request) {
    try {
        const { kind, content, filename } = await req.json();
        const resolvedKind = KIND_CONFIG[kind] ? kind : filename ? detectKind(String(filename)) : null;
        if (!resolvedKind) {
            return Response.json(
                { error: "不支持的文件类型（支持 .sql / .tf / .yaml / .py / .js / .ts）" },
                { status: 400 }
            );
        }
        if (!content || String(content).length > 2_000_000) {
            return Response.json({ error: "文件内容为空或超过 2MB" }, { status: 400 });
        }

        const scriptsDir = path.join(
            process.cwd(),
            "skills",
            "drawio-skill",
            "scripts"
        );
        const cfg = KIND_CONFIG[resolvedKind];
        const dir = mkdtempSync(path.join(tmpdir(), "import-"));
        const inputFile = path.join(dir, `input${cfg.ext}`);
        const graphFile = path.join(dir, "graph.json");
        writeFileSync(inputFile, String(content), "utf-8");

        try {
            const run = (args: string[]) =>
                execFileAsync("python3", args, {
                    timeout: 90000,
                    maxBuffer: 20 * 1024 * 1024,
                });

            // 1) importer: file -> graph.json
            await run([path.join(scriptsDir, cfg.script), inputFile, "-o", graphFile, ...cfg.args]);

            // 2) autolayout: graph.json -> .drawio XML (stdout)
            const { stdout } = await run([
                path.join(scriptsDir, "autolayout.py"),
                graphFile,
                "--tune",
            ]);
            const xml = stdout.trim();
            if (!xml.startsWith("<")) {
                return Response.json(
                    { error: `布局失败: ${xml.slice(0, 300)}` },
                    { status: 500 }
                );
            }
            console.info("[import]", JSON.stringify({ kind: resolvedKind, bytes: String(content).length }));
            return Response.json({ xml, kind: resolvedKind, label: cfg.label });
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    } catch (error) {
        console.error("import route error", error);
        return Response.json(
            { error: error instanceof Error ? error.message : "import failed" },
            { status: 500 }
        );
    }
}
