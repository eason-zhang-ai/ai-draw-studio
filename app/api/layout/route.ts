import { execFile } from "child_process";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const maxDuration = 120;

/**
 * Deterministic Graphviz auto-layout (drawio-skill autolayout.py):
 * graph JSON in -> .drawio XML out. Nodes are placed by `dot` and edges
 * routed orthogonally around nodes.
 */
export async function POST(req: Request) {
    try {
        const { graph, tune } = await req.json();
        if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length === 0) {
            return Response.json({ error: "graph.nodes 不能为空" }, { status: 400 });
        }
        if (graph.nodes.length > 300) {
            return Response.json({ error: "节点数超过 300，请拆分图表" }, { status: 400 });
        }

        const script = path.join(
            process.cwd(),
            "skills",
            "drawio-skill",
            "scripts",
            "autolayout.py"
        );
        const dir = mkdtempSync(path.join(tmpdir(), "layout-"));
        const input = path.join(dir, "graph.json");
        writeFileSync(input, JSON.stringify(graph), "utf-8");

        try {
            const args = [script, input];
            if (tune) args.push("--tune");
            const { stdout } = await execFileAsync("python3", args, {
                timeout: 60000,
                maxBuffer: 20 * 1024 * 1024,
            });
            const xml = stdout.trim();
            if (!xml.startsWith("<")) {
                return Response.json(
                    { error: `布局失败: ${xml.slice(0, 300)}` },
                    { status: 500 }
                );
            }
            console.info(
                "[layout]",
                JSON.stringify({ nodes: graph.nodes.length, edges: graph.edges?.length, tune: !!tune })
            );
            return Response.json({ xml });
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    } catch (error) {
        console.error("layout route error", error);
        return Response.json(
            { error: error instanceof Error ? error.message : "layout failed" },
            { status: 500 }
        );
    }
}
