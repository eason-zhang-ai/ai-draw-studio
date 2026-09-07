"use server";

import {Buffer} from "node:buffer";
import {spawn} from "node:child_process";
import {encode as encodePlantUml} from "plantuml-encoder";
import {NextRequest, NextResponse} from "next/server";

// Kroki renderers to try in order. kroki.io is the public default; a
// custom KROKI_RENDER_BASE can override/prefix it.
const DEFAULT_RENDERERS = [
    process.env.KROKI_RENDER_BASE?.replace(/\/$/, ""),
    "https://kroki.io",
].filter(Boolean) as string[];

// The public kroki.io instance is frequently overloaded/slow; cap each
// renderer request so we fail fast with a clear error instead of hanging
// behind a reverse proxy until it returns 502.
const KROKI_TIMEOUT_MS = 20000;

// PlantUML is rendered via plantuml.com (its own URL encoding, not Kroki's
// deflate/base64url), which is reachable even when kroki.io is down.
const PLANTUML_RENDERERS = [
    process.env.PLANTUML_RENDER_BASE?.replace(/\/$/, ""),
    "https://www.plantuml.com/plantuml/svg",
].filter((value): value is string => Boolean(value && value.trim().length > 0));

// Graphviz is rendered locally with the `dot` binary (installed in the
// runtime image). This removes the network dependency entirely for the
// graphviz diagram type, which is the most common kroki workload here.
async function renderGraphvizLocal(definition: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const child = spawn("dot", ["-Tsvg"], {
            stdio: ["pipe", "pipe", "pipe"],
        });
        let stdout = "";
        let stderr = "";
        // stdio is ["pipe", "pipe", "pipe"], so these streams are non-null.
        child.stdout!.setEncoding("utf8");
        child.stderr!.setEncoding("utf8");
        child.stdout!.on("data", (chunk: string) => {
            stdout += chunk;
        });
        child.stderr!.on("data", (chunk: string) => {
            stderr += chunk;
        });

        const killTimer = setTimeout(() => child.kill("SIGKILL"), 20000);

        child.on("error", (error) => {
            clearTimeout(killTimer);
            reject(error);
        });
        child.on("close", (code) => {
            clearTimeout(killTimer);
            if (code !== 0) {
                reject(new Error(`dot exited with code ${code}: ${stderr}`));
            } else if (!stdout.trim()) {
                reject(new Error("dot produced empty output"));
            } else {
                resolve(stdout);
            }
        });

        // Ignore EPIPE when dot exits early without consuming stdin.
        child.stdin!.on("error", () => {});
        child.stdin!.end(definition);
    });
}

// Render PlantUML through the reachable plantuml.com endpoint(s). Accepts
// definitions with or without the @startuml/@enduml wrappers (plantuml.com
// handles both).
async function renderPlantUmlRemote(
    definition: string,
): Promise<{svg: string; renderer: string}> {
    const encoded = encodePlantUml(definition);
    let lastError = "No PlantUML renderer available";
    for (const renderer of PLANTUML_RENDERERS) {
        try {
            const response = await fetch(`${renderer}/${encoded}`, {
                cache: "no-store",
                signal: AbortSignal.timeout(KROKI_TIMEOUT_MS),
            });
            if (!response.ok) {
                lastError = `${renderer} responded with ${response.status} ${response.statusText || ""}`.trim();
                continue;
            }
            const contentType = response.headers.get("content-type") ?? "image/svg+xml";
            if (!contentType.includes("svg")) {
                const buffer = Buffer.from(await response.arrayBuffer());
                return {
                    svg: `data:${contentType};base64,${buffer.toString("base64")}`,
                    renderer,
                };
            }
            return {svg: await response.text(), renderer};
        } catch (error) {
            lastError = error instanceof Error ? error.message : "Unknown PlantUML renderer error.";
        }
    }
    throw new Error(lastError);
}

// Supported diagram types and their endpoints
// Reference: https://kroki.io/#support
const DIAGRAM_TYPES: Record<string, string> = {
    "actdiag": "actdiag",
    "blockdiag": "blockdiag",
    "bpmn": "bpmn",
    "bytefield": "bytefield",
    "c4plantuml": "c4plantuml",
    "ditaa": "ditaa",
    "erd": "erd",
    "excalidraw": "excalidraw",
    "graphviz": "graphviz",
    "mermaid": "mermaid",
    "nomnoml": "nomnoml",
    "nwdiag": "nwdiag",
    "packetdiag": "packetdiag",
    "pikchr": "pikchr",
    "plantuml": "plantuml",
    "rackdiag": "rackdiag",
    "seqdiag": "seqdiag",
    "structurizr": "structurizr",
    "svgbob": "svgbob",
    "umlet": "umlet",
    "vega": "vega",
    "d2": "d2",
    "dbml": "dbml",
    "tikz": "tikz",
    "vegalite": "vegalite",
    "wavedrom": "wavedrom",
    "wireviz": "wireviz",
    "symbolator": "symbolator",
};

function detectDiagramType(definition: string): string {
    const trimmed = definition.trim().toLowerCase();
    
    // First check if the definition starts with an explicit diagram type marker
    for (const [marker, type] of Object.entries(DIAGRAM_TYPES)) {
        const directMarker = marker.toLowerCase();
        if (trimmed.startsWith(directMarker)) {
            // Skip the marker line and any empty lines after it when determining the actual diagram type
            const lines = definition.trim().split('\n');
            let startIndex = 1; // Skip the first line which is the marker
            while (startIndex < lines.length && lines[startIndex].trim() === '') {
                startIndex++; // Skip empty lines after marker
            }
            
            // If we have content after the marker, use that to determine the real type
            if (startIndex < lines.length) {
                const contentAfterMarker = lines.slice(startIndex).join('\n');
                return detectActualDiagramType(contentAfterMarker, type);
            }
            
            // If no content after marker, return the marker type
            return type;
        }
    }
    
    // If no explicit marker, try to detect from content
    return detectActualDiagramType(definition, "plantuml");
}

function detectActualDiagramType(definition: string, defaultType: string): string {
    const trimmed = definition.trim();
    if (!trimmed) return defaultType;
    
    // Check for specific content patterns to identify diagram types
    if (trimmed.includes('@startuml') || trimmed.includes('skinparam')) {
        return "plantuml";
    }
    if (trimmed.includes('graph ') && (trimmed.includes('{') || trimmed.includes('->'))) {
        return "graphviz";
    }
    if (trimmed.includes('graph') && trimmed.includes('TD') || trimmed.includes('LR') || trimmed.includes('BT') || trimmed.includes('RL')) {
        return "mermaid";
    }
    if (trimmed.includes('blockdiag') || trimmed.includes('->') && trimmed.includes(';') && !trimmed.includes('@startuml')) {
        return "blockdiag";
    }
    if (trimmed.includes('seqdiag') && trimmed.includes('->')) {
        return "seqdiag";
    }
    if (trimmed.includes('actdiag')) {
        return "actdiag";
    }
    if (trimmed.includes('nwdiag')) {
        return "nwdiag";
    }
    if (trimmed.includes('packetdiag')) {
        return "packetdiag";
    }
    if (trimmed.includes('rackdiag')) {
        return "rackdiag";
    }
    if (trimmed.includes('bytefield') || trimmed.includes('(defattrs') || trimmed.includes('(defn') || trimmed.includes('draw-box')) {
        return "bytefield";
    }
    if (trimmed.includes('<?xml') && trimmed.includes('semantic:definitions')) {
        return "bpmn";
    }
    if (trimmed.includes('|') && trimmed.includes('--') && trimmed.includes('==') && !trimmed.includes('{')) {
        return "erd";
    }
    if (trimmed.includes('d2 Parser') || trimmed.includes('shape:') || (trimmed.includes(':') && trimmed.includes('{') && trimmed.includes('}'))) {
        return "d2";
    }
    
    // Default to the provided default type if no specific patterns are found
    return defaultType;
}

function encodeDiagram(definition: string): string {
    // Encode in deflate + base64 format as expected by Kroki
    const zlib = require('zlib');
    const buffer = Buffer.from(definition, 'utf8');
    const compressed = zlib.deflateSync(buffer);
    return Buffer.from(compressed).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

export async function POST(request: NextRequest) {
    let definition: string | undefined;
    let diagramType: string | undefined;

    try {
        const body = await request.json();
        definition = body?.definition;
        diagramType = body?.diagramType;
    } catch {
        return NextResponse.json(
            {error: "Invalid request body. Expected JSON with a definition field."},
            {status: 400}
        );
    }

    if (!definition || !definition.trim()) {
        return NextResponse.json(
            {error: "Diagram definition cannot be empty."},
            {status: 400}
        );
    }

    // Use provided diagram type or auto-detect if not specified or set to "auto"
    const finalDiagramType = (diagramType && diagramType !== "auto")
        ? diagramType
        : detectDiagramType(definition);

    // Render Graphviz locally with `dot` first — fast, deterministic and
    // offline. Only fall back to the network renderers if that fails.
    let lastError: string | undefined;
    if (finalDiagramType === "graphviz") {
        try {
            const svg = await renderGraphvizLocal(definition);
            return NextResponse.json({svg, renderer: "local-graphviz"});
        } catch (localError) {
            // Continue to the Kroki fallback below.
            lastError = `Local Graphviz failed (${localError instanceof Error ? localError.message : "unknown"}); trying Kroki.`;
        }
    }

    // PlantUML goes through plantuml.com (reachable even when kroki.io is
    // down). This is also the default definition of the Kroki workspace.
    if (finalDiagramType === "plantuml") {
        try {
            const {svg, renderer} = await renderPlantUmlRemote(definition);
            return NextResponse.json({svg, renderer});
        } catch (plantError) {
            lastError = `PlantUML renderer failed (${plantError instanceof Error ? plantError.message : "unknown"}); trying Kroki.`;
        }
    }

    const encoded = encodeDiagram(definition);

    // Try each renderer in order until one succeeds.
    if (!lastError) lastError = "No Kroki renderer available";
    for (const renderer of DEFAULT_RENDERERS) {
        const url = `${renderer}/${finalDiagramType}/svg/${encoded}`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'image/svg+xml',
                },
                cache: "no-store",
                signal: AbortSignal.timeout(KROKI_TIMEOUT_MS),
            });

            if (!response.ok) {
                lastError = `Kroki service responded with ${response.status} ${response.statusText || ""}`.trim();
                continue;
            }

            const contentType = response.headers.get("content-type") ?? "image/svg+xml";
            if (!contentType.includes("svg")) {
                const buffer = Buffer.from(await response.arrayBuffer());
                const dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
                return NextResponse.json({
                    svgDataUrl: dataUrl,
                    renderer,
                });
            }

            const svg = await response.text();
            return NextResponse.json({
                svg,
                renderer,
            });
        } catch (error) {
            lastError = error instanceof Error ? error.message : "Unknown error contacting Kroki service.";
        }
    }

    return NextResponse.json({ error: lastError }, { status: 502 });
}