import { execFile } from "child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";
import { IMPORT_KINDS, detectImportKind, type ImportKind } from "@/lib/import-kinds";

const execFileAsync = promisify(execFile);

export const maxDuration = 120;

/**
 * Total upload budget for one request. Stays well under Vercel's 4.5 MB
 * request-body cap once JSON escaping is accounted for.
 */
const MAX_TOTAL_CHARS = 2_000_000;

interface UploadedFile {
    path: string;
    content: string;
}

/**
 * Turn a client-supplied relative path into something safe to join onto the
 * temp directory: strip directory traversal and any character that could
 * confuse the filesystem, while keeping real extensions intact so the
 * importers' globs and extension checks still match.
 */
function safeRelativePath(raw: string, fallback: string): string {
    const segments = String(raw || "")
        .split(/[\\/]+/)
        .map((s) => s.replace(/[^\w.\- ]+/g, "_").replace(/^\.+/, ""))
        .filter((s) => s.length > 0);
    return segments.length > 0 ? segments.join("/") : fallback;
}

/**
 * File importers from drawio-skill: SQL DDL -> ER, Terraform -> architecture,
 * OpenAPI -> API diagram, Python / JS-TS -> import graph. Each importer emits
 * graph.json which is then laid out by autolayout.py (Graphviz).
 *
 * Accepts either a batch of same-kind files:
 *
 *     { kind?: "python", files: [{ path, content }, ...] }
 *
 * or a single file:
 *
 *     { content, filename }
 *
 * A batch is written side by side into one temp directory and the *directory*
 * is handed to the importer, which is what the directory-walking scripts
 * (pyimports / jsimports / sqlerd / tfimports) expect. Passing them a lone file
 * path is what previously made those imports fail with
 * "no .py modules found under ...".
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        const files: UploadedFile[] = Array.isArray(body?.files)
            ? body.files.map((f: { path?: unknown; content?: unknown }) => ({
                  path: String(f?.path ?? ""),
                  content: String(f?.content ?? ""),
              }))
            : [{ path: String(body?.filename ?? ""), content: String(body?.content ?? "") }];

        if (files.length === 0) {
            return Response.json({ error: "没有可导入的文件" }, { status: 400 });
        }

        // Explicit kind wins; otherwise infer from the first recognisable name.
        const requested = String(body?.kind ?? "");
        let kind: ImportKind | null =
            requested in IMPORT_KINDS ? (requested as ImportKind) : null;
        if (!kind) {
            for (const file of files) {
                kind = detectImportKind(file.path);
                if (kind) break;
            }
        }
        if (!kind) {
            return Response.json(
                {
                    error: "不支持的文件类型（支持 .sql / .tf / .yaml / .yml / .json / .py / .js / .ts / .jsx / .tsx）",
                },
                { status: 400 }
            );
        }

        const totalChars = files.reduce((n, f) => n + f.content.length, 0);
        if (totalChars === 0) {
            return Response.json({ error: "文件内容为空" }, { status: 400 });
        }
        if (totalChars > MAX_TOTAL_CHARS) {
            return Response.json(
                { error: `文件内容合计超过 ${MAX_TOTAL_CHARS / 1_000_000}MB` },
                { status: 400 }
            );
        }

        const cfg = IMPORT_KINDS[kind];
        const scriptsDir = path.join(
            process.cwd(),
            "skills",
            "drawio-skill",
            "scripts"
        );
        const dir = mkdtempSync(path.join(tmpdir(), "import-"));
        const srcDir = path.join(dir, "src");
        mkdirSync(srcDir, { recursive: true });

        const written: string[] = [];
        for (let i = 0; i < files.length; i++) {
            const abs = path.join(
                srcDir,
                safeRelativePath(files[i].path, `input-${i}${cfg.ext}`)
            );
            mkdirSync(path.dirname(abs), { recursive: true });
            writeFileSync(abs, files[i].content, "utf-8");
            written.push(abs);
        }

        // Directory-walking importers get the tree; the OpenAPI importer only
        // reads one spec, so it gets the first file.
        const target = cfg.takesDirectory ? srcDir : written[0];

        try {
            const run = (args: string[]) =>
                execFileAsync("python3", args, {
                    timeout: 90000,
                    maxBuffer: 20 * 1024 * 1024,
                });

            const graphFile = path.join(dir, "graph.json");

            // 1) importer: source tree -> graph.json
            await run([
                path.join(scriptsDir, cfg.script),
                target,
                "-o",
                graphFile,
                ...cfg.args,
            ]);

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
            console.info(
                "[import]",
                JSON.stringify({
                    kind,
                    files: files.length,
                    used: cfg.takesDirectory ? files.length : 1,
                    bytes: totalChars,
                })
            );
            return Response.json({
                xml,
                kind,
                label: cfg.label,
                fileCount: cfg.takesDirectory ? files.length : 1,
            });
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
