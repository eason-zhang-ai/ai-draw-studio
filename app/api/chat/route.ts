import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { z } from "zod";
import { resolveModel } from "@/lib/model-provider";
import {
  DIAGRAM_QUALITY_GUIDELINES,
  getProfessionalDiagramGuidelines,
} from "@/lib/diagram-prompt-guidelines";
import { buildDrawioSkillContext } from "@/lib/skill-assets";
import { searchShapesBatch, searchAiIcons } from "@/lib/shape-search";

export const maxDuration = 90
const MAX_CONTEXT_MESSAGES = 3;
const DEFAULT_MAX_OUTPUT_TOKENS = 32000;
const MAX_OUTPUT_TOKENS = 64000;
const MAX_XML_CONTEXT_CHARS = 4000;

function clampMaxOutputTokens(value?: number) {
  if (!value) return DEFAULT_MAX_OUTPUT_TOKENS;
  return Math.min(Math.max(value, 1000), MAX_OUTPUT_TOKENS);
}

function compactXmlContext(xml?: string) {
  if (!xml) return "";
  if (xml.length <= MAX_XML_CONTEXT_CHARS) return xml;

  const headLength = Math.floor(MAX_XML_CONTEXT_CHARS * 0.65);
  const tailLength = MAX_XML_CONTEXT_CHARS - headLength;

  return `${xml.slice(0, headLength)}

<!-- XML context truncated for response speed. Regenerate with display_diagram if exact edit context is missing. -->

${xml.slice(-tailLength)}`;
}

const FAST_DRAWIO_SYSTEM_MESSAGE = `
You are a professional draw.io diagram assistant with STRICT tool discipline.
- Your FIRST output must be a tool call — never emit free text or long hidden reasoning before calling a tool.
- Keep hidden reasoning as short as possible; it consumes the output budget. Plan mentally in seconds, then act.
- When the user needs vendor icons or brand logos, call search_shapes / ai_icon FIRST (one batched call), then emit exactly ONE display_diagram or edit_diagram call.
- After emitting a tool call, stop and let the tool run. Do not duplicate tool calls.

Use tools only:
- display_diagram: create or fully replace the diagram.
- edit_diagram: small exact edits to the current XML.
- search_shapes: look up the exact official draw.io style for vendor/domain shapes (AWS/Azure/GCP/Cisco/Kubernetes/UML/BPMN/ER/network...). NEVER guess a shape=mxgraph.* name — a wrong name renders as a blank box. Look up every shape you need in ONE batched call (queries array), then never call it again in this turn.
- ai_icon: look up an AI/LLM or data-store brand logo style (OpenAI, Claude, DeepSeek, Redis, Postgres...). draw.io has no built-in AI logos.
- Never return raw XML as normal text.
- Minimize tool round-trips: plan which shapes/logos you need up front, batch them into ONE search_shapes / ai_icon call, then emit ONE display_diagram or edit_diagram call.

Draw.io XML rules:
- Return a complete <mxGraphModel><root>...</root></mxGraphModel> document through display_diagram.
- Include <mxCell id="0"/> and <mxCell id="1" parent="0"/>.
- Keep all mxCell elements as direct children of <root>; never nest mxCell elements.
- Use unique IDs, valid parent references, and valid edge source/target IDs.
- Escape XML-sensitive characters in labels and attributes.

Layout and design rules:
- Fit the diagram in a practical single viewport, roughly x=0-900 and y=0-650.
- Use grouped containers/swimlanes for layers, teams, phases, bounded contexts, or environments.
- Keep peer nodes aligned with consistent sizes, spacing, colors, and naming.
- Keep labels short and readable.
- Avoid overlaps. Leave whitespace around nodes, labels, containers, and arrowheads.
- Reduce connector clutter before styling: move nodes, introduce gateway/bus/hub nodes, and avoid many direct cross-canvas edges.
- Use orthogonal connectors for primary flows, curved connectors for feedback/cross-lane/secondary dependencies, and mxPoint waypoints when lines must route around shapes.
- Set exitX/exitY and entryX/entryY so lines leave and enter from clean sides.
- Use clear arrow direction, concise edge labels, and distinct styles for primary/secondary or sync/async paths.

For vague professional requests, infer a useful industry-standard layout and produce a complete diagram without follow-up questions.
`;

export async function POST(req: Request) {
  try {
    const requestStartedAt = Date.now();
    const { messages, xml, modelConfig } = await req.json();

    // Normalize UI messages: convert `file` UI parts to `image` parts so
    // convertToModelMessages can handle them (AI SDK v5 cannot convert file
    // parts to model messages).
    const recentMessages = messages
      .slice(-MAX_CONTEXT_MESSAGES)
      .map((m: any) => ({
        ...m,
        parts: (m.parts || []).map((p: any) =>
          p.type === "file"
            ? { type: "image", image: p.url, mediaType: p.mediaType }
            : p
        ),
      }));
    const lastMessage = recentMessages[recentMessages.length - 1];

    // Extract text from the last message parts
    const lastMessageText = lastMessage.parts?.find((part: any) => part.type === 'text')?.text || '';

    // Extract image parts from the last message
    const imageParts = lastMessage.parts?.filter((part: any) => part.type === 'image') || [];

    const formattedTextContent = `
Current diagram XML:
"""xml
${compactXmlContext(xml)}
"""
User input:
"""md
${lastMessageText}
"""

${getProfessionalDiagramGuidelines(lastMessageText)}`;

    // Convert UIMessages to ModelMessages and add system message
    const modelMessages = convertToModelMessages(recentMessages);
    let enhancedMessages = [...modelMessages];

    // Update the last message with formatted content if it's a user message
    if (enhancedMessages.length >= 1) {
      const lastModelMessage = enhancedMessages[enhancedMessages.length - 1];
      if (lastModelMessage.role === 'user') {
        // Build content array with text and image parts
        const contentParts: any[] = [
          { type: 'text', text: formattedTextContent }
        ];

        // Add image parts back
        for (const imagePart of imageParts) {
          contentParts.push({
            type: 'image',
            image: imagePart.image,
            mimeType: imagePart.mediaType
          });
        }

        enhancedMessages = [
          ...enhancedMessages.slice(0, -1),
          { ...lastModelMessage, content: contentParts }
        ];
      }
    }

    // Route to the vision model when the request carries images.
    const hasImages = imageParts.length > 0;
    const { client, model, maxOutputTokens } = resolveModel(modelConfig, {
      vision: hasImages,
    });

    const composedSystem = `${FAST_DRAWIO_SYSTEM_MESSAGE}

## drawio-skill authoring reference
The rules below come from the drawio-skill knowledge base. Follow them for XML structure, shapes, containers, edges, palette and layout.

${buildDrawioSkillContext(lastMessageText)}`;

    let firstChunkLogged = false;
    const effectiveMaxOutputTokens = clampMaxOutputTokens(maxOutputTokens);
    console.info("[chat] request", {
      model,
      vision: hasImages,
      xmlChars: typeof xml === "string" ? xml.length : 0,
      compactXmlChars: compactXmlContext(xml).length,
      messages: messages.length,
      maxOutputTokens: effectiveMaxOutputTokens,
    });

    const result = streamText({
      system: composedSystem,
      model: client.chat(model),
      messages: enhancedMessages,
      maxOutputTokens: effectiveMaxOutputTokens,
      maxRetries: 1,
      onChunk: () => {
        if (!firstChunkLogged) {
          firstChunkLogged = true;
          console.info("[chat] first chunk", {
            elapsedMs: Date.now() - requestStartedAt,
          });
        }
      },
      onFinish: (event) => {
        console.info("[chat] finished", {
          elapsedMs: Date.now() - requestStartedAt,
          finishReason: event.finishReason,
          usage: event.totalUsage,
        });
      },
      onError: (error) => {
        console.error("[chat] stream error", {
          elapsedMs: Date.now() - requestStartedAt,
          error,
        });
      },
      tools: {
        // Client-side tool that will be executed on the client
          display_diagram: {
              description: `Display a diagram on draw.io. Pass the XML content inside <root> tags.

VALIDATION RULES (XML will be rejected if violated):
1. All mxCell elements must be DIRECT children of <root> - never nested
2. Every mxCell needs a unique id
3. Every mxCell (except id="0") needs a valid parent attribute
4. Edge source/target must reference existing cell IDs
5. Escape special chars in values: &lt; &gt; &amp; &quot;
6. Always start with: <mxCell id="0"/><mxCell id="1" parent="0"/>

Example with swimlanes and edges (note: all mxCells are siblings):
<root>
  <mxCell id="0"/>
  <mxCell id="1" parent="0"/>
  <mxCell id="lane1" value="Frontend" style="swimlane;" vertex="1" parent="1">
    <mxGeometry x="40" y="40" width="200" height="200" as="geometry"/>
  </mxCell>
  <mxCell id="step1" value="Step 1" style="rounded=1;" vertex="1" parent="lane1">
    <mxGeometry x="20" y="60" width="160" height="40" as="geometry"/>
  </mxCell>
  <mxCell id="lane2" value="Backend" style="swimlane;" vertex="1" parent="1">
    <mxGeometry x="280" y="40" width="200" height="200" as="geometry"/>
  </mxCell>
  <mxCell id="step2" value="Step 2" style="rounded=1;" vertex="1" parent="lane2">
    <mxGeometry x="20" y="60" width="160" height="40" as="geometry"/>
  </mxCell>
  <mxCell id="edge1" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;strokeWidth=2;strokeColor=#0066CC;flowAnimation=1;" edge="1" parent="1" source="step1" target="step2">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>
</root>

Connector styling tips:
- Use strokeWidth=N to control line thickness (default is 1)
- Use strokeColor=#RRGGBB to set line color
- Add flowAnimation=1 to make connectors animated
- Use edgeStyle=orthogonalEdgeStyle for right-angle connectors
- Use exitX/exitY and entryX/entryY to anchor connectors on the correct side of each shape
- Use mxPoint waypoints when a line needs to route around a container, label, or sibling node
- Use curved=1;rounded=1 when a connector crosses lanes, returns to an earlier step, or represents secondary dependency; do not force every connector into a straight or orthogonal line
- Keep parallel connectors separated with different waypoints or route them through a shared bus/hub node
- Use elbow=vertical/horizontal for elbow-style connectors
- Use curved=1 for curved connectors
- Use dashed=1 for dashed lines
- Combine endArrow=classic with startArrow=classic for double-headed arrows
- Use opacity=30 to 50 for less important connections to reduce visual clutter
- Apply consistent connector styles for similar types of relationships
- Minimize crossings by using appropriate routing and jump styles

Notes:
- For AWS diagrams, use **AWS 2025 icons**.
- For animated connectors, add "flowAnimation=1" to edge style.
`,
              inputSchema: z.object({
                  xml: z.string().describe("XML string to be displayed on draw.io")
              })
          },
          edit_diagram: {
              description: `Edit specific parts of the current diagram by replacing exact line matches. Use this tool to make targeted fixes without regenerating the entire XML.
IMPORTANT: Keep edits concise:
- Only include the lines that are changing, plus 1-2 surrounding lines for context if needed
- Break large changes into multiple smaller edits
- Each search must contain complete lines (never truncate mid-line)
- First match only - be specific enough to target the right element`,
              inputSchema: z.object({
                  edits: z.array(z.object({
                      search: z.string().describe("Exact lines to search for (including whitespace and indentation)"),
                      replace: z.string().describe("Replacement lines")
                  })).describe("Array of search/replace pairs to apply sequentially")
              })
          },
          search_shapes: {
              description: `Search the 10,000+ official draw.io shape library for the exact style string of vendor/domain shapes (AWS/Azure/GCP/Cisco/Kubernetes/UML/BPMN/ER/network/electrical/P&ID...). ALWAYS use this instead of guessing a shape=mxgraph.* name — a wrong name renders as a blank box. IMPORTANT: look up ALL shapes you need in ONE call by passing every keyword as a queries array item (each extra call costs a full round-trip). Returns entries with title, size and the exact style string.`,
              inputSchema: z.object({
                  queries: z.array(z.string()).describe("all shape keywords to look up at once, e.g. ['aws lambda', 'aws api gateway', 'aws s3']"),
                  limit: z.number().optional().describe("max results per query, default 3"),
              }),
              execute: async ({ queries, limit }) => {
                  const byQuery = searchShapesBatch(queries, limit || 3);
                  const lines: string[] = [];
                  for (const [q, results] of Object.entries(byQuery)) {
                      if (results.length === 0) {
                          lines.push(`"${q}": no match — retry with fewer/more generic keywords`);
                          continue;
                      }
                      lines.push(
                          `"${q}":\n` +
                              results
                                  .map((r) => `  ${r.title} (${r.w}x${r.h})\n  style: ${r.style}`)
                                  .join("\n")
                      );
                  }
                  return lines.join("\n\n");
              },
          },
          ai_icon: {
              description: `Look up AI/LLM or data-store brand logos (OpenAI, Claude, Gemini, DeepSeek, Qwen, LangChain, Redis, Postgres, MongoDB, Kafka...) as draw.io image styles. draw.io has no built-in AI logos — use this tool instead of drawing a plain box. Look up ALL brands you need in ONE call via the brands array.`,
              inputSchema: z.object({
                  brands: z.array(z.string()).describe("all brand names to look up at once, e.g. ['openai', 'redis']"),
                  size: z.number().optional().describe("cell size in px, default 48"),
              }),
              execute: async ({ brands, size }) => {
                  const lines: string[] = [];
                  for (const brand of brands) {
                      const results = await searchAiIcons(brand, size || 48, 2);
                      lines.push(
                          results.length > 0
                              ? results
                                    .map((r) => `${r.brand} (${r.file})\nstyle: ${r.style}`)
                                    .join("\n")
                              : `"${brand}": no logo — consider a generic shape via search_shapes instead`
                      );
                  }
                  return lines.join("\n\n");
              },
          },
      },
        temperature: 0,
        // Server-executed tools (search_shapes / ai_icon) need follow-up model
        // calls; the default stopWhen=stepCountIs(1) would end the stream right
        // after the first tool round with no final answer.
        stopWhen: stepCountIs(3),
    });

    // Error handler function to provide detailed error messages
    function errorHandler(error: unknown) {
      if (error == null) {
        return 'unknown error';
      }

      if (typeof error === 'string') {
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
    console.error('Error in chat route:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
