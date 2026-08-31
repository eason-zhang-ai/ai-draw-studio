import { generateText } from "ai";
import { resolveModel } from "@/lib/model-provider";
import { buildCatalog, applyDirectives } from "@/lib/xml-edit";

export const maxDuration = 120;

/**
 * Self-check fixer: given the current diagram XML and a list of issues
 * from the vision model, ask the text model for layout fix directives and
 * apply them deterministically by cell id.
 *
 * The model reliably emits id-based directives (move/nudge/relabel/restyle/
 * delete) when given a COMPACT catalog, but degenerates into empty output
 * when asked for exact search/replace strings on the full XML — so we never
 * ask it to write raw XML.
 */
export async function POST(req: Request) {
    try {
        const { xml, issues, modelConfig } = await req.json();
        if (!xml || !Array.isArray(issues) || issues.length === 0) {
            return Response.json({ xml });
        }

        const { client, model } = resolveModel(modelConfig);

        const catalog = buildCatalog(xml);

        const system = `You are a diagram layout fixer. Given a list of issues (referenced by node/edge label) and a catalog of cells (id, kind, label, x, y), output ONLY a JSON array of fix directives.
Allowed actions: move (x,y), nudge (dx,dy), relabel (value), restyle (style), delete.
Example: [{"id":"3","action":"move","x":300,"y":200}]. Keep coordinates on a 10px grid, within x 0-900 / y 0-650.`;

        const user = `Issues found by the vision reviewer:
${issues
    .map(
        (i: any, n: number) =>
            `${n + 1}. [${i.severity || "medium"}] ${i.location || ""}: ${i.description || ""}`
    )
    .join("\n")}

Cell catalog:
${JSON.stringify(catalog)}

Output the JSON array of fix directives now.`;

        let text = "";
        for (let attempt = 0; attempt < 3 && !text.trim(); attempt++) {
            const result = await generateText({
                model: client.chat(model),
                system,
                messages: [{ role: "user", content: user }],
                maxOutputTokens: 2000,
                temperature: 0,
            });
            text = result.text || "";
            if (!text.trim()) {
                console.warn("[selfcheck-fix] empty output, retrying", attempt);
            }
        }

        // Tolerant extraction: first [ ... ] block, stripped of code fences.
        text = text.replace(/```(?:json)?/g, "");
        const start = text.indexOf("[");
        const end = text.lastIndexOf("]");
        let directives: { id: string; action: string }[] = [];
        if (start !== -1 && end > start) {
            try {
                const parsed = JSON.parse(text.slice(start, end + 1));
                if (Array.isArray(parsed)) {
                    directives = parsed.filter(
                        (d: any) => d && typeof d.id === "string" && typeof d.action === "string"
                    );
                }
            } catch {
                directives = [];
            }
        }

        const fixedXml = applyDirectives(
            xml,
            directives as import("@/lib/xml-edit").FixDirective[]
        );

        console.info("[selfcheck-fix]", {
            model,
            issues: issues.length,
            cells: catalog.length,
            directives: directives.length,
        });
        return Response.json({ xml: fixedXml, directives: directives.length });
    } catch (error) {
        console.error("selfcheck-fix route error", error);
        return Response.json(
            { error: error instanceof Error ? error.message : "fix failed" },
            { status: 500 }
        );
    }
}
