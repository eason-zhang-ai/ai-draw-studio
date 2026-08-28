import { streamText, convertToModelMessages } from "ai";
import { z } from "zod/v3";
import { resolveModel } from "@/lib/model-provider";
import {
    DIAGRAM_QUALITY_GUIDELINES,
    getProfessionalDiagramGuidelines,
} from "@/lib/diagram-prompt-guidelines";

export const maxDuration = 60;
const MAX_CONTEXT_MESSAGES = 8;

export async function POST(req: Request) {
    try {
        const { messages, definition, modelConfig } = await req.json();

        const systemMessage = `
You are an expert Mermaid diagram assistant.
Your job is to translate user intent into clean, well-organized Mermaid syntax for flowcharts, sequence diagrams, ERDs, architecture views, and more.

Rules of engagement:
- Always reason about the provided "Current Mermaid definition" before replying.
- Respond conversationally but deliver the final code via the display_mermaid tool.
- Prefer incremental edits unless the user asks to rebuild from scratch.
- Keep node labels concise, ensure indentation is consistent, and add helpful comments sparingly.
- Use subgraphs/sections to keep complex diagrams readable.
- Never return Mermaid code directly in text responses.

${DIAGRAM_QUALITY_GUIDELINES}

Mermaid excellence rules:
- Choose the Mermaid diagram type that best matches the user's intent instead of defaulting to flowchart.
- For flowcharts, prefer a single clear direction (TD/LR) and use subgraph blocks for phases, teams, layers, or bounded contexts.
- Order node declarations and edges to match the visual reading direction, keeping related nodes inside the same subgraph to reduce crossing edges.
- For dense relationships, introduce aggregator nodes such as Gateway, Event Bus, Queue, or Shared Interface instead of connecting every node to every other node.
- Use Mermaid link variants intentionally: reserve thick/solid arrows for primary flow, dotted arrows for secondary/optional dependencies, and avoid long diagonal-looking cross-subgraph links when a hub node would be clearer.
- Quote labels that contain punctuation, parentheses, slashes, or non-trivial text to avoid parse errors.
- Use classDef/class assignments sparingly to create consistent visual hierarchy without making the code noisy.
- Avoid unsupported syntax for the likely Mermaid renderer; favor broadly compatible Mermaid constructs.
- Validate mentally that every edge references an existing node and every subgraph is closed.

Tool contract:
- You must trigger exactly one display_mermaid tool call per assistant turn.
- Include the full diagram definition inside that tool call.
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
Current Mermaid definition:
"""mermaid
${definition || "graph TD\n    Start --> Stop"}
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

        const { client, model } = resolveModel(modelConfig);

        const result = streamText({
            system: systemMessage,
            model: client.chat(model),
            messages: enhancedMessages,
            temperature: 0.2,
            tools: {
                display_mermaid: {
                    description:
                        "Render a Mermaid diagram by providing the full definition.",
                    inputSchema: z.object({
                        definition: z
                            .string()
                            .describe(
                                "Complete Mermaid definition for the diagram"
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
        });
    } catch (error) {
        console.error("Error in mermaid route:", error);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
