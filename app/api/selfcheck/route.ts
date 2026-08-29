import { generateText } from "ai";
import { z } from "zod/v3";
import { resolveModel } from "@/lib/model-provider";

export const maxDuration = 120;

/**
 * Vision self-check (drawio-skill Step 5 equivalent): send a rendered PNG
 * to the vision model and get back a structured list of layout issues.
 */
export async function POST(req: Request) {
    try {
        const { dataUrl, xml, modelConfig } = await req.json();
        if (!dataUrl) {
            return Response.json({ error: "缺少渲染图" }, { status: 400 });
        }

        const { client, model } = resolveModel(modelConfig, { vision: true });

        const system = `You are a diagram quality reviewer. Inspect the rendered diagram image for visual defects.
Respond ONLY with a JSON object in this exact shape:
{"issues":[{"severity":"high|medium|low","location":"the node or edge label","description":"what is wrong"}]}
If the diagram looks fine, respond with {"issues":[]}.
Check for: overlapping shapes, clipped/truncated labels, arrows that miss their target, edges crossing through unrelated shapes, off-canvas elements, stacked parallel edges, and edge labels overlapping shapes.`;

        // The vision model occasionally returns empty (reasoning eats the
        // budget); retry a few times for a usable answer.
        let text = "";
        for (let attempt = 0; attempt < 3 && !text.trim(); attempt++) {
            const result = await generateText({
                model: client.chat(model),
                system,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "image",
                                image: dataUrl,
                            },
                            {
                                type: "text",
                                text: "检查这张图。不要输出任何解释，只输出 JSON。",
                            },
                        ],
                    },
                ],
                maxOutputTokens: 2000,
                temperature: 0,
            });
            text = result.text || "";
        }

        // Tolerant JSON extraction: find the first {...} block.
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        let issues: unknown[] = [];
        if (start !== -1 && end > start) {
            try {
                const parsed = JSON.parse(text.slice(start, end + 1));
                issues = Array.isArray(parsed?.issues) ? parsed.issues : [];
            } catch {
                issues = [];
            }
        }

        void xml;
        console.info("[selfcheck]", {
            model,
            rawLen: text.length,
            issueCount: issues.length,
        });
        return Response.json({ issues });
    } catch (error) {
        console.error("selfcheck route error", error);
        return Response.json(
            { error: error instanceof Error ? error.message : "selfcheck failed" },
            { status: 500 }
        );
    }
}
