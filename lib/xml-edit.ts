import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * Deterministic draw.io XML edits, used by the visual self-check fixer.
 *
 * The text model cannot reliably produce exact search/replace strings on a
 * large XML block (it degenerates into empty output); instead we send it a
 * COMPACT catalog (id/label/geometry per cell) and it emits directives
 * (move/nudge/relabel/restyle/delete), which we apply here by id.
 */

export interface CatalogEntry {
    id: string;
    kind: "node" | "edge";
    label: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    source?: string;
    target?: string;
}

export interface FixDirective {
    id: string;
    action: "move" | "nudge" | "relabel" | "restyle" | "delete";
    x?: number;
    y?: number;
    dx?: number;
    dy?: number;
    value?: string;
    style?: string;
}

export function buildCatalog(xml: string): CatalogEntry[] {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const cells = Array.from(doc.getElementsByTagName("mxCell"));
    const out: CatalogEntry[] = [];
    for (const cell of cells) {
        const id = cell.getAttribute("id");
        if (!id || id === "0" || id === "1") continue;
        const geometry = cell.getElementsByTagName("mxGeometry")[0];
        const isEdge = cell.getAttribute("edge") === "1";
        out.push({
            id,
            kind: isEdge ? "edge" : "node",
            label: cell.getAttribute("value") || "",
            x: geometry ? Number(geometry.getAttribute("x")) || undefined : undefined,
            y: geometry ? Number(geometry.getAttribute("y")) || undefined : undefined,
            width: geometry ? Number(geometry.getAttribute("width")) || undefined : undefined,
            height: geometry ? Number(geometry.getAttribute("height")) || undefined : undefined,
            source: cell.getAttribute("source") || undefined,
            target: cell.getAttribute("target") || undefined,
        });
    }
    return out;
}

function findCell(doc: any, id: string): any | null {
    const cells: any[] = Array.from(doc.getElementsByTagName("mxCell"));
    for (const cell of cells) {
        if (cell.getAttribute("id") === id) return cell;
    }
    return null;
}

function geometryOf(cell: any): any | null {
    return cell.getElementsByTagName("mxGeometry")[0] || null;
}

export function applyDirectives(xml: string, directives: FixDirective[]): string {
    if (!directives.length) return xml;
    const doc = new DOMParser().parseFromString(xml, "application/xml");

    for (const d of directives) {
        const cell = findCell(doc, d.id);
        if (!cell) continue;
        if (d.action === "delete") {
            cell.parentNode?.removeChild(cell);
            continue;
        }
        const geo = geometryOf(cell);
        if (d.action === "move") {
            if (geo && d.x !== undefined) geo.setAttribute("x", String(Math.round(d.x)));
            if (geo && d.y !== undefined) geo.setAttribute("y", String(Math.round(d.y)));
        } else if (d.action === "nudge") {
            if (geo && d.dx !== undefined) {
                const cur = Number(geo.getAttribute("x")) || 0;
                geo.setAttribute("x", String(Math.round(cur + d.dx)));
            }
            if (geo && d.dy !== undefined) {
                const cur = Number(geo.getAttribute("y")) || 0;
                geo.setAttribute("y", String(Math.round(cur + d.dy)));
            }
        } else if (d.action === "relabel") {
            if (d.value !== undefined) cell.setAttribute("value", d.value);
        } else if (d.action === "restyle") {
            if (d.style !== undefined) cell.setAttribute("style", d.style);
        }
    }

    return new XMLSerializer().serializeToString(doc);
}
