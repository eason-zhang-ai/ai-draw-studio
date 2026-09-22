import { streamText, convertToModelMessages } from "ai";
import { z } from "zod/v3";
import { resolveModel } from "@/lib/model-provider";
import {
    DIAGRAM_QUALITY_GUIDELINES,
    getProfessionalDiagramGuidelines,
} from "@/lib/diagram-prompt-guidelines";
import { buildExcalidrawSkillContext } from "@/lib/domain-skills";
import {
    estimateTokens,
    budgetMessages,
    messageTokens,
    trimTextToTokens,
    type BudgetableMessage,
} from "@/lib/context-budget";

const MIN_OUTPUT_TOKENS = 2_000;
const MAX_CONTEXT_MESSAGES = 8;

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const requestStartedAt = Date.now();
        const { messages, scene, modelConfig } = await req.json();

        const systemMessage = `
You are an Excalidraw scene architect.
Your job is to translate user requests into Excalidraw scenes with elements, styling, and layout.

Rules for interaction:
- Always provide a brief explanation of what you're creating or modifying before using the tool
- Respond conversationally but deliver the final scene via the display_excalidraw tool
- Prefer incremental changes unless the user asks for a complete rebuild
- Keep layouts clean, well-organized, and visually balanced
- Use meaningful text labels and appropriate colors for elements
- Maintain consistent styling across related elements

${DIAGRAM_QUALITY_GUIDELINES}

Excalidraw excellence rules:
- Use Excalidraw's strengths: clean hand-drawn structure, readable labels, arrows, grouping, and lightweight annotations.
- Build scenes with complete, valid element objects; include required fields consistently so the scene can render.
- Keep related elements visually grouped and aligned; use arrows with clear start/end bindings when possible.
- Use font sizes, stroke widths, fill colors, and roughness consistently to create a polished scene.
- Keep the canvas focused within a reasonable viewport and avoid tiny text or far-away elements.
- When transforming an existing scene, preserve element intent and update only the requested parts.

Tool usage:
- ALWAYS include a complete object: { "elements": [...], "appState": {...}, "files": {...} }
- Provide the scene payload as a structured JSON object inside the tool call
- If unsure, reuse the current scene and apply small changes instead of rebuilding
- Keep coordinates reasonable (within a 1200x800 canvas)
- Never stream raw JSON in text replies; only send it through the tool call
- Exactly ONE display_excalidraw tool call per response

Refer to the Excalidraw format guide for detailed information about the scene structure:
- Elements should have proper coordinates and styling
- Use appropriate element types (rectangle, ellipse, arrow, text, etc.)
- Include descriptive text labels for elements
- Maintain consistent styling across related elements
- Use appState to define canvas properties like background color
`;

        const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
        const lastMessage = recentMessages[recentMessages.length - 1];
        const lastMessageText =
            lastMessage.parts?.find((part: any) => part.type === "text")
                ?.text || "";
        const fileParts =
            lastMessage.parts?.filter((part: any) => part.type === "file") ||
            [];

        const modelMessages = convertToModelMessages(recentMessages);
        const historyModelMessages = modelMessages.slice(0, -1);
        const lastModelMessage = modelMessages[modelMessages.length - 1];

        const { client, model, maxOutputTokens, contextLength, providerOptions } =
            resolveModel(modelConfig);

        const composedSystem = `${systemMessage}

## excalidraw-skill schema reference
${buildExcalidrawSkillContext(lastMessageText)}`;

        // Context-length budget: system + user text + images first, then
        // history (≤40% of the remainder), then the scene JSON.
        let sceneForContext =
            typeof scene === "string"
                ? scene
                : '{"elements": [], "appState": {}, "files": {}}';
        let historyMessages = historyModelMessages;
        if (contextLength) {
            const systemTokens = estimateTokens(composedSystem);
            const userTokens = estimateTokens(lastMessageText);
            const imageTokens = fileParts.length * 1000;
            let remaining = Math.max(
                0,
                contextLength - systemTokens - userTokens - imageTokens
            );
            const historyBudget = Math.floor(remaining * 0.4);
            historyMessages = budgetMessages(historyMessages, historyBudget);
            const historyUsed = historyMessages.reduce(
                (sum, m) => sum + messageTokens(m as BudgetableMessage),
                0
            );
            const sceneTokens = Math.max(0, remaining - historyUsed);
            sceneForContext = trimTextToTokens(
                sceneForContext,
                Math.max(200, sceneTokens)
            );
        }

        const formattedTextContent = `
Current scene JSON:
"""json
${sceneForContext}
"""
User input:
"""md
${lastMessageText}
"""

${getProfessionalDiagramGuidelines(lastMessageText)}
`;

        let enhancedMessages = [...historyMessages];
        if (lastModelMessage?.role === "user") {
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
                ...historyMessages,
                { ...lastModelMessage, content: contentParts },
            ];
        } else {
            enhancedMessages = [...historyMessages, lastModelMessage];
        }

        // Unset → don't send max_tokens (model default applies).
        const outputTokenBudget =
            maxOutputTokens && Number.isFinite(maxOutputTokens)
                ? Math.max(MIN_OUTPUT_TOKENS, Math.floor(maxOutputTokens))
                : undefined;

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
            system: composedSystem,
            model: client.chat(model),
            messages: enhancedMessages,
            temperature: 0,
            ...(outputTokenBudget
                ? { maxOutputTokens: outputTokenBudget }
                : {}),
            providerOptions,
            tools: {
                display_excalidraw: {
                    description:
                        "Render an Excalidraw scene by supplying a structured scene payload.",
                    inputSchema: z.object({
                        scene: z.object({
                            elements: z
                                .array(z.record(z.any()))
                                .describe(
                                    "List of Excalidraw elements with coordinates, styles, etc."
                                ),
                            appState: z
                                .record(z.any())
                                .describe("Excalidraw appState object")
                                .optional()
                                .default({}),
                            files: z
                                .record(z.any())
                                .describe("Files map keyed by element ids")
                                .optional()
                                .default({}),
                        }),
                        summary: z
                            .string()
                            .optional()
                            .describe(
                                "Optional short description of what changed"
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
        console.error("Error in excalidraw route:", error);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
