/**
 * Buffered (non-streaming) fetch for the erix DeepSeek endpoint.
 *
 * The endpoint's STREAMING mode makes the reasoning model degenerate into
 * long thinking loops — it frequently burns the whole token budget on
 * `reasoning_content` and emits no tool call (finish_reason=length). Its
 * NON-STREAMING mode is reliable (5/5 tool calls, ~200 reasoning tokens vs
 * ~2k+ and 3/5 length-failures when streaming, measured on the same prompt).
 *
 * This wrapper forces `stream:false` on the upstream request, reads the
 * complete response, and replays it as a synthetic SSE stream in the exact
 * OpenAI chunk shape the AI SDK's openai provider parses — so streamText,
 * server-executed tools, client tool round-trips, and useChat all keep
 * working unchanged.
 */

function toSseResponse(json: any): Response {
    const id = json.id;
    const created = json.created;
    const model = json.model;
    const choice = json.choices?.[0] ?? {};
    const message = choice.message ?? {};
    const finishReason = choice.finish_reason ?? "stop";
    const content = message.content ?? null;
    const toolCalls = message.tool_calls ?? [];
    const usage = json.usage;

    const chunks: any[] = [];

    if (content) {
        chunks.push({
            id,
            created,
            model,
            choices: [
                {
                    index: 0,
                    delta: { role: "assistant", content },
                    finish_reason: null,
                },
            ],
        });
    }

    if (toolCalls.length > 0) {
        chunks.push({
            id,
            created,
            model,
            choices: [
                {
                    index: 0,
                    delta: {
                        tool_calls: toolCalls.map((tc: any, index: number) => ({
                            index,
                            id: tc.id,
                            type: "function",
                            function: {
                                name: tc.function?.name,
                                arguments: tc.function?.arguments ?? "",
                            },
                        })),
                    },
                    finish_reason: null,
                },
            ],
        });
    }

    chunks.push({
        id,
        created,
        model,
        choices: [{ index: 0, delta: {}, finish_reason: finishReason }],
    });

    if (usage) {
        chunks.push({ id, created, model, choices: [], usage });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
                );
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
        },
    });

    return new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
    });
}

export function createBufferedFetch(): typeof fetch {
    const upstream = globalThis.fetch;
    return async (input, init) => {
        const url =
            typeof input === "string"
                ? input
                : input instanceof Request
                  ? input.url
                  : String(input);
        if (!url.includes("/chat/completions")) {
            return upstream(input, init);
        }

        let body: any = {};
        try {
            body = JSON.parse(String(init?.body ?? "{}"));
        } catch {
            return upstream(input, init);
        }
        if (!body.stream) {
            return upstream(input, init);
        }

        // Force non-streaming upstream.
        delete body.stream;
        delete body.stream_options;
        const headers = new Headers(init?.headers);
        headers.set("Content-Type", "application/json");
        const res = await upstream(input, {
            ...init,
            body: JSON.stringify(body),
            headers,
        });
        if (!res.ok) return res;

        const json = await res.json();
        return toSseResponse(json);
    };
}
