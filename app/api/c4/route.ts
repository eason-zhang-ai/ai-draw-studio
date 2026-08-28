import { execFile } from "child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const maxDuration = 60;

/**
 * C4 model generator (drawio-skill c4.py): levels JSON in -> multi-page
 * .drawio with click-to-drill-down links between System Context / Container /
 * Component pages.
 */
export async function POST(req: Request) {
    try {
        const { c4 } = await req.json();
        const levels = c4?.levels;
        if (!Array.isArray(levels) || levels.length === 0) {
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
