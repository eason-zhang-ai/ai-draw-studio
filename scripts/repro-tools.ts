// Minimal repro: AI SDK streamText + server-executed tool against the erix API.
// Usage: npx tsx scripts/repro-tools.ts
import { createDeepSeek } from "@ai-sdk/deepseek";
import { streamText, stepCountIs } from "ai";
import { z } from "zod";

const realFetch = globalThis.fetch;
let callNo = 0;
const loggingFetch: typeof fetch = async (input, init) => {
    callNo += 1;
    const n = callNo;
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : init?.body;
    const msgs = (body as any)?.messages;
    console.log(`[fetch #${n}] ${init?.method || "GET"} ${String(input)} model=${(body as any)?.model}`);
    if (msgs) {
        msgs.forEach((m: any, i: number) => {
            const hasReasoning = typeof m.reasoning_content === "string" ? `reasoning=${m.reasoning_content.length}ch` : "reasoning=ABSENT";
            const hasToolCalls = m.tool_calls ? `tool_calls=${m.tool_calls.length}` : "";
            console.log(`   msg[${i}] role=${m.role} content=${JSON.stringify(m.content).slice(0, 40)} ${hasReasoning} ${hasToolCalls}`);
        });
    }
    const res = await realFetch(input, init);
    console.log(`[fetch #${n}] status=${res.status}`);
    return res;
};
const client = createDeepSeek({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL || "https://code-api.erix.vip/v1",
    fetch: loggingFetch,
});

const model = process.argv[2] || "deepseek-v4-pro";
const t0 = Date.now();
const log = (msg: string) =>
    console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, msg);

async function main() {
    log(`start model=${model}`);
    const result = streamText({
        model: client.chat(model),
        system: "You are a diagram assistant. Call the tool when needed.",
        messages: [
            {
                role: "user",
                content:
                    "Use the lookup tool to find styles for 'aws lambda' and 'aws s3', then output a tiny <mxCell> XML with both.",
            },
        ],
        maxOutputTokens: 4000,
        maxRetries: 0,
        stopWhen: stepCountIs(3),
        tools: {
            lookup: {
                description: "lookup shape styles",
                inputSchema: z.object({
                    queries: z.array(z.string()),
                }),
                execute: async ({ queries }: { queries: string[] }) => {
                    log(`TOOL EXEC ${JSON.stringify(queries)}`);
                    return queries
                        .map(
                            (q) =>
                                `${q} => shape=mxgraph.aws3.lambda;fillColor=#F58534;`
                        )
                        .join("\n");
                },
            },
        },
        onStepFinish: (s) => {
            log(
                `STEP finish: finishReason=${s.finishReason} usage=${JSON.stringify(s.usage)}`
            );
        },
        onError: (e) => {
            log(`onError: ${String(e.error)}`);
        },
    });

    log("awaiting text stream...");
    let text = "";
    for await (const part of result.fullStream as AsyncIterable<any>) {
        if (part.type === "text-delta") text += part.text;
        if (part.type === "tool-call") log(`TOOL CALL part: ${part.toolName}`);
        if (part.type === "tool-result") log(`TOOL RESULT part: ${part.toolName}`);
        if (part.type === "error") log(`STREAM error part: ${String(part.error)}`);
    }
    log(`final text (${text.length} chars): ${text.slice(0, 300)}`);
    try {
        const t = await result.text;
        log(`result.text resolved: ${t.slice(0, 300)}`);
    } catch (e) {
        log(`result.text THREW: ${String(e)}`);
    }
    const steps = await result.steps;
    log(`total steps: ${steps.length}`);
    steps.forEach((st: any, i: number) => {
        log(`step ${i}: finishReason=${st.finishReason} textLen=${st.text.length} toolResults=${st.toolResults.length}`);
    });
    log("DONE");
}

main().catch((e) => {
    console.error("FATAL", e);
    process.exit(1);
});
