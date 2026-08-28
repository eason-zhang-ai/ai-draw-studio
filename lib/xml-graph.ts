import { DOMParser } from "@xmldom/xmldom";
import type { Element as XmlElement } from "@xmldom/xmldom";

/**
 * Parse a .drawio mxGraphModel into an autolayout graph.json:
 * vertices become nodes (children of swimlanes/containers get grouped),
 * edges keep their labels.
 */
export interface GraphNode {
    id: string;
    label: string;
    style?: string;
    group?: string;
    width?: number;
    height?: number;
}

export interface GraphEdge {
    source: string;
    target: string;
    label?: string;
}

export interface Graph {
    direction?: "TB" | "LR";
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export function xmlToGraph(xml: string): Graph {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const cells = Array.from(doc.getElementsByTagName("mxCell"));

    const byId = new Map<string, XmlElement>();
    for (const cell of cells) {
        const id = cell.getAttribute("id");
        if (id) byId.set(id, cell);
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const containerGroup = new Map<string, string>();

    const groupFor = (cell: XmlElement): string | undefined => {
        const parentId = cell.getAttribute("parent") || "1";
        if (parentId === "1" || parentId === "0") return undefined;
        const parent = byId.get(parentId);
        if (!parent) return undefined;
        if (containerGroup.has(parentId)) return containerGroup.get(parentId);
        const label = (parent.getAttribute("value") || parentId).replace(
            /\s+/g,
            " "
        );
        containerGroup.set(parentId, label);
        return label;
    };

    for (const cell of cells) {
        const id = cell.getAttribute("id");
        if (!id || id === "0" || id === "1") continue;
        const isEdge = cell.getAttribute("edge") === "1";
        if (isEdge) {
            const source = cell.getAttribute("source");
            const target = cell.getAttribute("target");
            if (!source || !target) continue;
            edges.push({
                source,
                target,
                label: cell.getAttribute("value") || undefined,
            });
        } else if (cell.getAttribute("vertex") === "1") {
            const value = cell.getAttribute("value") || "";
            // Skip pure containers (swimlanes/groups) as nodes; their
            // children carry the group.
            const style = cell.getAttribute("style") || "";
            if (/\b(swimlane|group)\b/.test(style)) continue;
            const geometry = cell.getElementsByTagName("mxGeometry")[0];
            const width = geometry
                ? Number(geometry.getAttribute("width")) || undefined
                : undefined;
            const height = geometry
                ? Number(geometry.getAttribute("height")) || undefined
                : undefined;
            nodes.push({
                id,
                label: value,
                style: style || undefined,
                group: groupFor(cell),
                width,
                height,
            });
        }
    }
    return { nodes, edges };
}
