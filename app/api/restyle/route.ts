import { execFile } from "child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const maxDuration = 60;

const PRESETS = ["default", "corporate", "handdrawn", "colorblind-safe", "dark"];

/**
 * Apply a drawio-skill style preset to an existing diagram
 * (restyle.py remaps the palette; layout and edge routing untouched).
 */
export async function POST(req: Request) {
    try {
        const { xml, preset } = await req.json();
        if (!xml || typeof xml !== "string") {
            return Response.json({ error: "缺少图表 XML" }, { status: 400 });
        }
        const name = String(preset || "dark").toLowerCase();
        if (!PRESETS.includes(name)) {
            return Response.json(
                { error: `未知预设：${name}（可选：${PRESETS.join("/")}）` },
                { status: 400 }
            );
        }

        const script = path.join(
            process.cwd(),
            "skills",
            "drawio-skill",
            "scripts",
            "restyle.py"
        );
        const dir = mkdtempSync(path.join(tmpdir(), "restyle-"));
        const input = path.join(dir, "input.drawio");
        const output = path.join(dir, "output.drawio");

        // restyle.py expects a full <mxfile><diagram> document; canvas
        // exports are bare <mxGraphModel>, so wrap before and unwrap after.
        const isBareModel = xml.trim().startsWith("<mxGraphModel");
        const wrapped = isBareModel
            ? `<mxfile host="drawio"><diagram name="Page-1" id="p1">${xml}</diagram></mxfile>`
            : xml;
        writeFileSync(input, wrapped, "utf-8");

        try {
            await execFileAsync(
                "python3",
                [script, "--preset", name, "-o", output, input],
                { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
            );
            let restyled = readFileSync(output, "utf-8");
            if (isBareModel) {
                const start = restyled.indexOf("<mxGraphModel");
                const end = restyled.lastIndexOf("</mxGraphModel>") + "</mxGraphModel>".length;
                if (start !== -1 && end > start) {
                    restyled = restyled.slice(start, end);
                }
            }
            console.info("[restyle]", name);
            return Response.json({ xml: restyled, preset: name });
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    } catch (error) {
        console.error("restyle route error", error);
        return Response.json(
            { error: error instanceof Error ? error.message : "restyle failed" },
            { status: 500 }
        );
    }
}
