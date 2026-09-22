import { streamText, convertToModelMessages } from "ai";
import { z } from "zod/v3";
import { resolveModel } from "@/lib/model-provider";
import {
    estimateTokens,
    budgetMessages,
} from "@/lib/context-budget";
import {
    DIAGRAM_QUALITY_GUIDELINES,
    getProfessionalDiagramGuidelines,
} from "@/lib/diagram-prompt-guidelines";

export const maxDuration = 60;
const MAX_CONTEXT_MESSAGES = 8;

export async function POST(req: Request) {
    try {
        const requestStartedAt = Date.now();
        const { messages, definition, modelConfig } = await req.json();

        const systemMessage = `
You are an expert Graphviz (DOT language) diagram assistant.
Your job is to translate user intent into clean, well-organized Graphviz syntax.

Graphviz Rules:
- Always use proper DOT syntax (digraph, graph, or subgraph)
- Use meaningful node and edge labels
- Keep layouts clean and readable
- Use appropriate graph attributes for styling
- Add helpful comments when needed

${DIAGRAM_QUALITY_GUIDELINES}

Graphviz excellence rules:
- Select digraph or graph correctly based on whether relationships are directional.
- Use graph, node, and edge defaults to keep styling consistent and concise.
- Use rankdir, rank=same, clusters, and compound edges when they improve structure and reading order.
- Use splines=ortho, splines=curved, or splines=true based on graph density; prefer curved splines for cross-cluster or feedback relationships that would overlap with straight/orthogonal lines.
- Use constraint=false for secondary/cross-cutting edges when they would distort the main layout, and use ltail/lhead for cluster-aware routing when appropriate.
- Prefer stable node IDs with human-readable labels; quote IDs or labels when needed for DOT syntax.
- Avoid dense hairballs: group nodes, reduce unnecessary edges, and use concise labels.
- Validate braces, semicolons, quoted strings, node references, and cluster boundaries before calling the tool.

Rules of engagement:
- Always reason about the provided "Current Graphviz definition" before replying.
- Respond conversationally but deliver the final code via the display_graphviz tool.
- Prefer incremental edits unless the user asks to rebuild from scratch.
- Keep labels concise, ensure indentation is consistent.
- Never return diagram code directly in text responses.

Tool contract:
- You must trigger exactly one display_graphviz tool call per assistant turn.
- Include the full Graphviz definition inside that tool call.
- Optionally include a short summary describing the key changes.
`;

        const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
        const lastMessage = recentMessages[recentMessages.length - 1];
        const lastMessageText =
            lastMessage.parts?.find((part: any) => part.type === "text")
                ?.text || "";
        const fileParts =
            lastMessage.parts?.filter((part: any) => part.type === "file") ||
            [];

        const formattedTextContent = `
Current Graphviz definition:
"""dot
${definition || "digraph G {\n  A -> B\n}"}
"""
User input:
"""md
${lastMessageText}
"""

${getProfessionalDiagramGuidelines(lastMessageText)}
`;

        const modelMessages = convertToModelMessages(recentMessages);
        let enhancedMessages = [...modelMessages];

        if (enhancedMessages.length > 0) {
            const lastModelMessage = enhancedMessages[enhancedMessages.length - 1];
            if (lastModelMessage.role === "user") {
                const contentParts: any[] = [
                    { type: "text", text: formattedTextContent },
                ];

                for (const filePart of fileParts) {
                    contentParts.push({
                        type: "image",
                        image: filePart.url,
                        mimeType: filePart.mediaType,
                    });
                }

                enhancedMessages = [
                    ...enhancedMessages.slice(0, -1),
                    { ...lastModelMessage, content: contentParts },
                ];
            }
        }

        const { client, model, maxOutputTokens, contextLength, providerOptions } = resolveModel(modelConfig);

        // Context-length budget (front-end > env AI_CONTEXT_LENGTH > no trim)
        let finalMessages = enhancedMessages;
        if (contextLength) {
            const systemTokens = estimateTokens(systemMessage);
            finalMessages = budgetMessages(
                enhancedMessages,
                Math.max(0, contextLength - systemTokens)
            );
        }

        // The fullStream's `finish` part carries no usage, but each
        // `finish-step` part does. Accumulate them and forward via
        // messageMetadata — the only channel DefaultChatTransport passes
        // through to the client.
        let accUsage: {
            inputTokens?: number;
            outputTokens?: number;
            totalTokens?: number;
            reasoningTokens?: number;
        } | null = null;
        const addUsage = (u?: typeof accUsage) => {
            if (!u) return;
            accUsage = {
                inputTokens: (accUsage?.inputTokens ?? 0) + (u.inputTokens ?? 0),
                outputTokens: (accUsage?.outputTokens ?? 0) + (u.outputTokens ?? 0),
                totalTokens: (accUsage?.totalTokens ?? 0) + (u.totalTokens ?? 0),
                reasoningTokens:
                    (accUsage?.reasoningTokens ?? 0) + (u.reasoningTokens ?? 0),
            };
        };
        const result = streamText({
            system: systemMessage,
            model: client.chat(model),
            messages: finalMessages,
            temperature: 0.2,
            ...(maxOutputTokens ? { maxOutputTokens } : {}),
            providerOptions,
            tools: {
                display_graphviz: {
                    description:
                        "Render a Graphviz diagram by providing the full DOT definition.",
                    inputSchema: z.object({
                        definition: z
                            .string()
                            .describe(
                                "Complete Graphviz DOT definition for the diagram"
                            ),
                        summary: z
                            .string()
                            .optional()
                            .describe(
                                "Optional short explanation of what changed"
                            ),
                    }),
                },
            },
        });

        function errorHandler(error: unknown) {
            if (error == null) {
                return "unknown error";
            }
            if (typeof error === "string") {
                return error;
            }
            if (error instanceof Error) {
                return error.message;
            }
            return JSON.stringify(error);
        }

        return result.toUIMessageStreamResponse({
            onError: errorHandler,
            // usage + elapsed time → message metadata, shown under the reply
            messageMetadata: ({ part }) => {
                if (part.type === "finish-step") {
                    addUsage((part as { usage?: typeof accUsage }).usage);
                    return { usage: accUsage, elapsedMs: Date.now() - requestStartedAt };
                }
                if (part.type === "finish") {
                    return { usage: accUsage, elapsedMs: Date.now() - requestStartedAt };
                }
                return undefined;
            },
        });
    } catch (error) {
        console.error("Error in graphviz route:", error);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
