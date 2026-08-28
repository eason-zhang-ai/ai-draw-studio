"use client";

import React, { createContext, useContext, useRef, useState } from "react";
import type { DrawIoEmbedRef } from "react-drawio";
import { extractDiagramXML } from "../lib/utils";

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
}

const DiagramContext = createContext<DiagramContextType | undefined>(undefined);

export function DiagramProvider({ children }: { children: React.ReactNode }) {
    const [chartXML, setChartXML] = useState<string>("");
    const [latestSvg, setLatestSvg] = useState<string>("");
    const [diagramHistory, setDiagramHistory] = useState<
        { svg: string; xml: string }[]
    >([]);
    const [exportPurpose, setExportPurpose] = useState<'chat' | 'file'>('chat');
    const drawioRef = useRef<DrawIoEmbedRef | null>(null);
    const resolverRef = useRef<((value: string) => void) | null>(null);

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
    };

    const handleDiagramExport = (data: any) => {
        const extractedXML = extractDiagramXML(data.data);
        
        // 只有在聊天导出时才更新状态，避免文件导出时干扰
        if (exportPurpose === 'chat') {
            setChartXML(extractedXML);
            setLatestSvg(data.data);
            setDiagramHistory((prev) => [
                ...prev,
                {
                    svg: data.data,
                    xml: extractedXML,
                },
            ]);
        }
        
        // 对于聊天导出，通过 resolver 返回结果
        if (exportPurpose === 'chat' && resolverRef.current) {
            resolverRef.current(extractedXML);
            resolverRef.current = null;
        }
    };

    const clearDiagram = () => {
        const emptyDiagram = `<mxfile><diagram name="Page-1" id="page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>`;
        loadDiagram(emptyDiagram);
        setChartXML(emptyDiagram);
        setLatestSvg("");
        setDiagramHistory([]);
    };

    const importDiagramFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (drawioRef.current) {
                // Try to load as XML directly
                drawioRef.current.load({
                    xml: content,
                });
            }
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
