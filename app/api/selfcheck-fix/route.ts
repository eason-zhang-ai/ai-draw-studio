import { generateText } from "ai";
import { resolveModel } from "@/lib/model-provider";

export const maxDuration = 120;

/**
 * Self-check fixer: given the current diagram XML and a list of issues
 * from the vision model, ask the text model for targeted search/replace
 * edit pairs (preserves layout; never full regeneration).
 *
 * The endpoint runs in "thinking mode" which rejects forced tool_choice,
 * so the edits are requested as a strict JSON array in plain text and
 * extracted tolerantly.
 */
export async function POST(req: Request) {
    try {
        const { xml, issues, modelConfig } = await req.json();
        if (!xml || !Array.isArray(issues) || issues.length === 0) {
            return Response.json({ edits: [] });
        }

        const { client, model } = resolveModel(modelConfig);

        const system = `You are a draw.io XML repair assistant. Fix ONLY the issues listed, with minimal
exact search/replace edits on the current XML. Preserve all ids, unrelated
geometry and styles. Output STRICTLY a JSON array and nothing else:

[{"search":"<exact original lines>","replace":"<replacement lines>"}]

Rules:
- each "search" must match a contiguous block of the current XML EXACTLY (complete lines)
- one edit pair per issue; merge adjacent changes into one pair
- if an issue cannot be fixed safely, skip it`;

        let text = "";
        for (let attempt = 0; attempt < 2 && !text.trim(); attempt++) {
            const result = await generateText({
                model: client.chat(model),
                system,
                messages: [
                    {
                        role: "user",
                        content: `Issues found by the vision reviewer:
${issues
    .map(
        (i: any, n: number) =>
            `${n + 1}. [${i.severity || "medium"}] ${i.location || ""}: ${i.description}`
    )
    .join("\n")}

Current diagram XML:
"""xml
${xml}
"""

Output the JSON array of search/replace edits now.`,
                    },
                ],
                maxOutputTokens: 4000,
                temperature: 0,
            });
            text = result.text || "";
            if (!text.trim()) {
                console.warn("[selfcheck-fix] empty output, retrying", attempt);
            }
        }

        // Tolerant extraction: first [ ... ] block, stripped of code fences.
        text = text.replace(/```(?:json|xml)?/g, "");
        const start = text.indexOf("[");
        const end = text.lastIndexOf("]");
        let edits: { search: string; replace: string }[] = [];
        if (start !== -1 && end > start) {
            try {
                const parsed = JSON.parse(text.slice(start, end + 1));
                if (Array.isArray(parsed)) {
                    edits = parsed.filter(
                        (e: any) =>
                            e &&
                            typeof e.search === "string" &&
                            typeof e.replace === "string"
                    );
                }
            } catch {
                edits = [];
            }
        }

        console.info("[selfcheck-fix]", {
            model,
            issues: JSON.stringify(issues),
            rawLen: text.length,
            rawText: text.slice(0, 200),
            edits: edits.length,
        });
        return Response.json({ edits });
    } catch (error) {
        console.error("selfcheck-fix route error", error);
        return Response.json(
            { error: error instanceof Error ? error.message : "fix failed" },
            { status: 500 }
        );
    }
}
