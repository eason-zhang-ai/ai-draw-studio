import { execFile } from "child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const maxDuration = 60;

const slug = (s: string) =>
    String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * c4.py rejects duplicate element ids across levels; models occasionally
 * reuse an id (e.g. "customer") in every level. Rename later duplicates to
 * level-scoped ids and rewrite that level's relation references.
 */
function dedupeLevels(levels: any[]) {
    const seen = new Set<string>();
    for (const lv of levels) {
        const renames = new Map<string, string>();
        for (const el of lv.elements || []) {
            let id = String(el.id ?? "");
            if (!id) {
                id = `el-${Math.random().toString(36).slice(2, 8)}`;
                el.id = id;
            }
            if (seen.has(id)) {
                let unique = `${slug(lv.name || "level")}-${id}`;
                let n = 2;
                while (seen.has(unique)) {
                    unique = `${slug(lv.name || "level")}-${id}-${n++}`;
                }
                renames.set(id, unique);
                el.id = unique;
            }
            seen.add(el.id);
        }
        for (const rel of lv.relations || []) {
            if (renames.has(rel.from)) rel.from = renames.get(rel.from);
            if (renames.has(rel.to)) rel.to = renames.get(rel.to);
        }
    }
    return levels;
}

/**
 * C4 model generator (drawio-skill c4.py): levels JSON in -> multi-page
 * .drawio with click-to-drill-down links between System Context / Container /
 * Component pages.
 */
export async function POST(req: Request) {
    try {
        const { c4 } = await req.json();
        const levels = dedupeLevels(c4?.levels || []);
        if (levels.length === 0) {
            return Response.json(
                { error: "c4.levels 不能为空" },
                { status: 400 }
            );
        }

        const script = path.join(
            process.cwd(),
            "skills",
            "drawio-skill",
            "scripts",
            "c4.py"
        );
        const dir = mkdtempSync(path.join(tmpdir(), "c4-"));
        const input = path.join(dir, "c4.json");
        const output = path.join(dir, "c4.drawio");
        writeFileSync(input, JSON.stringify({ levels }), "utf-8");

        try {
            await execFileAsync("python3", [script, input, "-o", output], {
                timeout: 60000,
                maxBuffer: 10 * 1024 * 1024,
            });
            const xml = readFileSync(output, "utf-8");
            const pages = (xml.match(/<diagram /g) || []).length;
            console.info("[c4]", JSON.stringify({ levels: levels.length, pages }));
            return Response.json({ xml, pages });
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    } catch (error) {
        console.error("c4 route error", error);
        return Response.json(
            { error: error instanceof Error ? error.message : "c4 failed" },
            { status: 500 }
        );
    }
}
