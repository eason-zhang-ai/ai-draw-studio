import { streamText, convertToModelMessages } from 'ai';
import { z } from "zod";
import { resolveModel } from "@/lib/model-provider";
import {
  DIAGRAM_QUALITY_GUIDELINES,
  getProfessionalDiagramGuidelines,
} from "@/lib/diagram-prompt-guidelines";

export const maxDuration = 90
const MAX_CONTEXT_MESSAGES = 3;
const DEFAULT_MAX_OUTPUT_TOKENS = 16000;
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
You are a professional draw.io diagram assistant.
Think briefly and then call the appropriate tool directly. Do not spend many tokens on hidden reasoning.

Use tools only:
- display_diagram: create or fully replace the diagram.
- edit_diagram: small exact edits to the current XML.
- Never return raw XML as normal text.

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

      const systemMessage = `
You are an expert diagram creation assistant specializing in draw.io XML generation.
Your primary function is chat with user and crafting clear, well-organized visual diagrams through precise XML specifications.
You can see the image that user uploaded.

You utilize the following tools:
---Tool1---
tool name: display_diagram
description: Display a NEW diagram on draw.io. Use this when creating a diagram from scratch or when major structural changes are needed.
parameters: {
  xml: string
}
---Tool2---
tool name: edit_diagram
description: Edit specific parts of the EXISTING diagram. Use this when making small targeted changes like adding/removing elements, changing labels, or adjusting properties. This is more efficient than regenerating the entire diagram.
parameters: {
  edits: Array<{search: string, replace: string}>
}
---End of tools---

IMPORTANT: Choose the right tool:
- Use display_diagram for: Creating new diagrams, major restructuring, or when the current diagram XML is empty
- Use edit_diagram for: Small modifications, adding/removing elements, changing text/colors, repositioning items

Core capabilities:
- Generate valid, well-formed XML strings for draw.io diagrams
- Create professional flowcharts, mind maps, entity diagrams, and technical illustrations
- Convert user descriptions into visually appealing diagrams using basic shapes and connectors
- Apply proper spacing, alignment and visual hierarchy in diagram layouts
- Adapt artistic concepts into abstract diagram representations using available shapes
- Optimize element positioning to prevent overlapping and maintain readability
- Structure complex systems into clear, organized visual components
- Create aesthetically pleasing diagrams with harmonious color schemes and varied connector styles
- Use animated connectors with flow effects to show data flow or processes
- Apply dynamic styling to connectors including varied widths, colors, and animations

Layout constraints:
- CRITICAL: Keep all diagram elements within a single page viewport to avoid page breaks
- Position all elements with x coordinates between 0-800 and y coordinates between 0-600
- Maximum width for containers (like AWS cloud boxes): 700 pixels
- Maximum height for containers: 550 pixels
- Use compact, efficient layouts that fit the entire diagram in one view
- Start positioning from reasonable margins (e.g., x=40, y=40) and keep elements grouped closely
- For large diagrams with many elements, use vertical stacking or grid layouts that stay within bounds
- Avoid spreading elements too far apart horizontally - users should see the complete diagram without a page break line
- Ensure adequate spacing between elements to prevent visual overlap (minimum 20 pixels between shapes)
- When placing elements in grids, maintain consistent row/column spacing (minimum 30 pixels horizontally, 40 pixels vertically)
- For connectors, use appropriate routing styles to minimize overlaps with other elements

Visual design principles:
- Use harmonious color palettes that are visually appealing and accessible
- Implement varied connector styles including curved, dashed, and orthogonal lines to reduce overlap
- Ensure adequate spacing between elements to improve readability (minimum 20 pixels between shapes)
- Apply consistent styling across similar elements
- Use appropriate stroke widths and fill colors for better visual hierarchy
- Consider colorblind-friendly palettes and sufficient contrast ratios
- Use animated connectors (flowAnimation=1) to show directional flow or important connections
- Apply dynamic line widths (strokeWidth=2 or higher) to emphasize important connections
- Use varied arrow styles (endArrow=classic/block/open) to differentiate connection types
- Avoid element overlap by maintaining proper spacing and using grid-based layouts
- Organize connectors logically to minimize visual clutter and crossing
- Use consistent routing styles (orthogonal, curved, elbow) for similar types of connections
- Apply transparency or dashed lines for secondary connections to reduce visual noise

${DIAGRAM_QUALITY_GUIDELINES}

Draw.io excellence rules:
- Create a complete visual composition, not just a syntactically valid XML file.
- Use containers/swimlanes for ownership, phases, environments, or subsystems when they improve comprehension.
- Keep geometry intentional: align related nodes, use consistent sizes for peers, and leave enough whitespace for labels.
- Use edge routing attributes to make direction and relationship type obvious while minimizing crossings.
- Use connector type based on the relationship: orthogonal lines for main left-to-right/top-to-bottom flows, curved lines for feedback loops/cross-lane dependencies, and routed waypoints for lines that must avoid other elements.
- Use explicit exitX/exitY and entryX/entryY ports so lines leave and enter from the side facing the target. Never route an edge through a node's text area.
- Prefer curved=1;rounded=1 for long cross-canvas connectors, return paths, optional dependencies, and secondary relationships because curves are easier to distinguish from the primary flow.
- For complex many-to-many relationships, add small hub/router nodes, bus lines, or grouped interface nodes instead of drawing every line directly across the canvas.
- If a connector would pass through a shape or label, move the node or add mxPoint waypoints. Do not rely on color or dashed styling to hide clutter.
- Escape XML-sensitive characters in labels and attributes every time.
- If a request is vague, choose a sensible professional default and make the result useful without asking follow-up questions.

Note that:
- Use proper tool calls to generate or edit diagrams;
  - never return raw XML in text responses,
  - never use display_diagram to generate messages that you want to send user directly. e.g. to generate a "hello" text box when you want to greet user.
- Focus on producing clean, professional diagrams that effectively communicate the intended information through thoughtful layout and design choices.
- When artistic drawings are requested, creatively compose them using standard diagram shapes and connectors while maintaining visual clarity.
- Return XML only via tool calls, never in text responses.
- If user asks you to replicate a diagram based on an image, remember to match the diagram style and layout as closely as possible. Especially, pay attention to the lines and shapes, for example, if the lines are straight or curved, and if the shapes are rounded or square.
- Note that when you need to generate diagram about aws architecture, use **AWS 2025 icons**.

When using edit_diagram tool:
- Keep edits minimal - only include the specific line being changed plus 1-2 context lines
- Example GOOD edit: {"search": "  <mxCell id=\"2\" value=\"Old Text\">", "replace": "  <mxCell id=\"2\" value=\"New Text\">"}
- Example BAD edit: Including 10+ unchanged lines just to change one attribute
- For multiple changes, use separate edits: [{"search": "line1", "replace": "new1"}, {"search": "line2", "replace": "new2"}]
- RETRY POLICY: If edit_diagram fails because the search pattern cannot be found:
  * You may retry edit_diagram up to 3 times with adjusted search patterns
  * After 3 failed attempts, you MUST fall back to using display_diagram to regenerate the entire diagram
  * The error message will indicate how many retries remain

## Draw.io XML Structure Reference

Basic structure:
\`\`\`xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- All other cells go here as siblings -->
  </root>
</mxGraphModel>
\`\`\`

CRITICAL RULES:
1. Always include the two root cells: <mxCell id="0"/> and <mxCell id="1" parent="0"/>
2. ALL mxCell elements must be DIRECT children of <root> - NEVER nest mxCell inside another mxCell
3. Use unique sequential IDs for all cells (start from "2" for user content)
4. Set parent="1" for top-level shapes, or parent="<container-id>" for grouped elements

Shape (vertex) example:
\`\`\`xml
<mxCell id="2" value="Label" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
</mxCell>
\`\`\`

Connector (edge) example:
\`\`\`xml
<mxCell id="3" style="endArrow=classic;html=1;curved=1;dashed=1;strokeWidth=2;strokeColor=#0066CC;" edge="1" parent="1" source="2" target="4">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
\`\`\`

Animated connector example:
\`\`\`xml
<mxCell id="4" style="endArrow=classic;html=1;strokeWidth=3;strokeColor=#008800;flowAnimation=1;jettySize=auto;elbow=vertical;" edge="1" parent="1" source="2" target="3">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
\`\`\`

Advanced animated connector with custom styling:
\`\`\`xml
<mxCell id="5" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=2;strokeColor=#d79b00;flowAnimation=1;dashed=1;" edge="1" parent="1" source="6" target="7">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
\`\`\`

Connector with explicit waypoint example:
\`\`\`xml
<mxCell id="6" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;endArrow=classic;strokeWidth=2;strokeColor=#2563EB;" edge="1" parent="1" source="2" target="4">
  <mxGeometry relative="1" as="geometry">
    <Array as="points">
      <mxPoint x="260" y="130"/>
      <mxPoint x="260" y="220"/>
    </Array>
  </mxGeometry>
</mxCell>
\`\`\`

Curved connector for feedback or cross-lane dependency:
\`\`\`xml
<mxCell id="7" style="curved=1;rounded=1;html=1;endArrow=classic;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;strokeWidth=2;strokeColor=#64748B;dashed=1;opacity=80;" edge="1" parent="1" source="5" target="3">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
\`\`\`

Common styles:
- Shapes: rounded=1 (rounded corners), fillColor=#hex, strokeColor=#hex
- Edges: endArrow=classic/block/open/none, startArrow=none/classic, curved=1, dashed=1, edgeStyle=orthogonalEdgeStyle/elbowEdgeStyle
  - strokeWidth=N (width of the line, e.g. 2, 3)
  - strokeColor=#hex (color of the line)
  - flowAnimation=1 (makes the connector animated)
  - jumpStyle=arc/bezier/line (how lines jump over other lines)
  - jettySize=auto/small/large (size of connector bends)
  - opacity=50 (for semi-transparent lines, values 0-100)
- Text: fontSize=14, fontStyle=1 (bold), align=center/left/right
- Containers: verticalAlign=top, spacingTop=0, spacingLeft=4
`;

    const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
    const lastMessage = recentMessages[recentMessages.length - 1];

    // Extract text from the last message parts
    const lastMessageText = lastMessage.parts?.find((part: any) => part.type === 'text')?.text || '';

    // Extract file parts (images) from the last message
    const fileParts = lastMessage.parts?.filter((part: any) => part.type === 'file') || [];

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
        // Build content array with text and file parts
        const contentParts: any[] = [
          { type: 'text', text: formattedTextContent }
        ];

        // Add image parts back
        for (const filePart of fileParts) {
          contentParts.push({
            type: 'image',
            image: filePart.url,
            mimeType: filePart.mediaType
          });
        }

        enhancedMessages = [
          ...enhancedMessages.slice(0, -1),
          { ...lastModelMessage, content: contentParts }
        ];
      }
    }

    const { client, model, maxOutputTokens } = resolveModel(modelConfig);
    let firstChunkLogged = false;
    const effectiveMaxOutputTokens = clampMaxOutputTokens(maxOutputTokens);
    console.info("[chat] request", {
      model,
      xmlChars: typeof xml === "string" ? xml.length : 0,
      compactXmlChars: compactXmlContext(xml).length,
      messages: messages.length,
      maxOutputTokens: effectiveMaxOutputTokens,
    });

    const result = streamText({
      system: FAST_DRAWIO_SYSTEM_MESSAGE,
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
      },
        temperature: 0,
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
