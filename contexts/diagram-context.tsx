"use client";

import React, { createContext, useContext, useRef, useState } from "react";
import type { DrawIoEmbedRef } from "react-drawio";
import { extractDiagramXML } from "../lib/utils";
import { PANEL_KEYS } from "@/lib/panel-storage";
import { usePersistedPanel } from "@/lib/use-persisted-panel";

interface DiagramContextType {
    chartXML: string;
    latestSvg: string;
    diagramHistory: { svg: string; xml: string }[];
    loadDiagram: (chart: string) => void;
    handleExport: (purpose?: 'chat' | 'file') => void;
    resolverRef: React.Ref<((value: string) => void) | null>;
    drawioRef: React.Ref<DrawIoEmbedRef | null>;
    handleDiagramExport: (data: any) => void;
    clearDiagram: () => void;
    importDiagramFile: (file: File) => void;
    exportDiagramFile: () => void;
    exportPurpose: 'chat' | 'file';
    /** Export the current canvas as a PNG data URL (used by vision self-check). */
    exportPng: () => Promise<string>;
    /** Export the current canvas as .drawio XML (used by auto-layout). */
    exportXml: () => Promise<string>;
    /**
     * Remember canvas XML coming from a draw.io autosave. Unlike
     * handleDiagramExport this adds no history entry — it just keeps the
     * stored copy in step with manual edits.
     */
    syncCanvasXml: (xml: string) => void;
}

const DiagramContext = createContext<DiagramContextType | undefined>(undefined);

/**
 * Count the draw.io cells rendered inside an exported `xmlsvg` data URL.
 * An untouched canvas only contains the id=0 / id=1 skeleton (2 cells) and
 * exports as a 1x1 SVG, which is useless as a history entry AND renders as
 * a blank thumbnail — restoring it just wipes the canvas.
 */
function countSvgCells(dataUrl: unknown): number {
    if (typeof dataUrl !== "string") return Number.MAX_SAFE_INTEGER;
    try {
        const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
        const svg = atob(base64);
        return (svg.match(/data-cell-id=/g) || []).length;
    } catch {
        // Unparseable export: don't filter it out (better to keep than lose).
        return Number.MAX_SAFE_INTEGER;
    }
}

export function DiagramProvider({ children }: { children: React.ReactNode }) {
    const [chartXML, setChartXML] = useState<string>("");
    const [latestSvg, setLatestSvg] = useState<string>("");
    const [diagramHistory, setDiagramHistory] = useState<
        { svg: string; xml: string }[]
    >([]);
    const [exportPurpose, setExportPurpose] = useState<'chat' | 'file'>('chat');
    const drawioRef = useRef<DrawIoEmbedRef | null>(null);

    // Persist the canvas so a reload does not lose the diagram. The rendered
    // content lives in the draw.io iframe (rebuilt on mount), so app/page.tsx
    // feeds this value back into the iframe on its first load.
    usePersistedPanel<string>({
        storageKey: PANEL_KEYS.drawio,
        value: chartXML,
        onRestore: (saved) => {
            if (saved) setChartXML(saved);
        },
    });
    const resolverRef = useRef<((value: string) => void) | null>(null);
    const pngResolverRef = useRef<((value: string) => void) | null>(null);
    const pngExportPending = useRef(false);
    const xmlResolverRef = useRef<((value: string) => void) | null>(null);
    const xmlExportPending = useRef(false);

    const exportXml = () => {
        return new Promise<string>((resolve, reject) => {
            if (!drawioRef.current) {
                reject(new Error("drawio 编辑器尚未就绪"));
                return;
            }
            let settled = false;
            const timer = setTimeout(() => {
                if (settled) return;
                settled = true;
                xmlResolverRef.current = null;
                reject(new Error("XML 导出超时"));
            }, 8000);
            xmlResolverRef.current = (value: string) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(value);
            };
            xmlExportPending.current = true;
            drawioRef.current.exportDiagram({ format: "xmlsvg" });
        });
    };

    const exportPng = () => {
        return new Promise<string>((resolve, reject) => {
            if (!drawioRef.current) {
                reject(new Error("drawio 编辑器尚未就绪"));
                return;
            }
            let settled = false;
            const timer = setTimeout(() => {
                if (settled) return;
                settled = true;
                pngResolverRef.current = null;
                reject(new Error("PNG 导出超时"));
            }, 8000);
            pngResolverRef.current = (value: string) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(value);
            };
            pngExportPending.current = true;
            drawioRef.current.exportDiagram({ format: "png" });
        });
    };

    const handleExport = (purpose: 'chat' | 'file' = 'chat') => {
        // Store the purpose for the export handler
        setExportPurpose(purpose);
        
        // For file export, we need a different approach to ensure the export event
        // handler knows this is a file export
        if (purpose === 'file') {
            // Add a special flag to the document that can be checked in the export handler
            document.body.setAttribute('data-export-purpose', 'file');
            
            // Set a timeout to remove the flag after a reasonable time
            setTimeout(() => {
                document.body.removeAttribute('data-export-purpose');
            }, 2000);
        }
        
        if (drawioRef.current) {
            drawioRef.current.exportDiagram({
                format: "xmlsvg",
            });
        }
    };

    const loadDiagram = (chart: string) => {
        if (drawioRef.current) {
            drawioRef.current.load({
                xml: chart,
            });
        }
        // The rendered diagram lives inside the draw.io iframe, which is
        // destroyed when this page unmounts (e.g. switching diagram mode).
        // Everything we push into the canvas is therefore also recorded here,
        // so the iframe can be restored when the page mounts again. Without
        // this, chartXML only tracked EXPORTS — so a freshly generated diagram
        // was never remembered and came back blank.
        if (chart) {
            setChartXML(chart);
        }
    };

    const handleDiagramExport = (data: any) => {
        // PNG export for the vision self-check: resolve the pending promise
        // with the raw data URL and leave chart state untouched.
        if (pngExportPending.current) {
            pngExportPending.current = false;
            const resolver = pngResolverRef.current;
            pngResolverRef.current = null;
            if (resolver) {
                resolver(
                    typeof data?.data === "string"
                        ? data.data
                        : `data:image/png;base64,${data?.data || ""}`
                );
            }
            return;
        }

        // XML export for auto-layout: resolve with the extracted XML.
        if (xmlExportPending.current) {
            xmlExportPending.current = false;
            const resolver = xmlResolverRef.current;
            xmlResolverRef.current = null;
            if (resolver) {
                resolver(extractDiagramXML(data?.data || ""));
            }
            return;
        }

        const extractedXML = extractDiagramXML(data.data);
        
        // 只有在聊天导出时才更新状态，避免文件导出时干扰
        if (exportPurpose === 'chat') {
            setChartXML(extractedXML);
            setLatestSvg(data.data);
            setDiagramHistory((prev) => {
                // The history entry is the canvas snapshot taken BEFORE the
                // turn runs. On the very first generation the canvas is still
                // empty, so that snapshot would be a blank 1x1 SVG — skip it.
                if (countSvgCells(data.data) <= 2) return prev;
                // The self-check (and other export-triggered paths) can export
                // the same unchanged canvas again; don't stack duplicates.
                if (prev.length > 0 && prev[prev.length - 1].xml === extractedXML) {
                    return prev;
                }
                return [
                    ...prev,
                    {
                        svg: data.data,
                        xml: extractedXML,
                    },
                ];
            });
        }
        
        // 对于聊天导出，通过 resolver 返回结果
        if (exportPurpose === 'chat' && resolverRef.current) {
            resolverRef.current(extractedXML);
            resolverRef.current = null;
        }
    };

    /**
     * Mirror draw.io autosave XML into the stored copy. Manual edits on the
     * canvas are otherwise only captured by an explicit export, so without this
     * "edit, then reload (or switch mode)" loses them. No history entry is
     * added here — autosave fires constantly while editing.
     */
    const syncCanvasXml = (xml: string) => {
        if (!xml || !xml.trim()) return;
        setChartXML(xml);
    };

    const clearDiagram = () => {
        const emptyDiagram = `<mxfile><diagram name="Page-1" id="page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>`;
        loadDiagram(emptyDiagram);
        setLatestSvg("");
        setDiagramHistory([]);
    };

    const importDiagramFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            // Go through loadDiagram so the imported XML is remembered too.
            loadDiagram(content);
        };
        reader.readAsText(file);
    };

    const exportDiagramFile = () => {
        // Trigger the export from draw.io for file export
        handleExport('file');
    };

    return (
        <DiagramContext.Provider
            value={{
                chartXML,
                latestSvg,
                diagramHistory,
                loadDiagram,
                handleExport,
                resolverRef,
                drawioRef,
                handleDiagramExport,
                clearDiagram,
                importDiagramFile,
                exportDiagramFile,
                exportPurpose,
                exportPng,
                exportXml,
                syncCanvasXml,
            }}
        >
            {children}
        </DiagramContext.Provider>
    );
}

export function useDiagram() {
    const context = useContext(DiagramContext);
    if (context === undefined) {
        throw new Error("useDiagram must be used within a DiagramProvider");
    }
    return context;
}
