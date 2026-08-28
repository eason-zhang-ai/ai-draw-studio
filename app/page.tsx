"use client";
import React, { useState, useEffect, useRef } from "react";
import { DrawIoEmbed } from "react-drawio";
import { CollapsibleChatPanel } from "@/components/collapsible-chat-panel";
import { useDiagram } from "@/contexts/diagram-context";
import { Button } from "@/components/ui/button";
import { Upload, Download, LayoutGrid } from "lucide-react";
import { extractDiagramXML } from "@/lib/utils";
import { xmlToGraph } from "@/lib/xml-graph";

export default function Home() {
    const { drawioRef, handleDiagramExport, importDiagramFile, exportDiagramFile, chartXML, exportPurpose, exportXml, loadDiagram } = useDiagram();
    const [isMobile, setIsMobile] = useState(false);
    const [isChatCollapsed, setIsChatCollapsed] = useState(false);
    const [isDrawIoLoaded, setIsDrawIoLoaded] = useState(false);
    const [layoutBusy, setLayoutBusy] = useState(false);
    const [layoutNotice, setLayoutNotice] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const runAutoLayout = async () => {
        if (layoutBusy) return;
        setLayoutBusy(true);
        setLayoutNotice(null);
        try {
            const xml = await exportXml();
            const graph = xmlToGraph(xml);
            if (graph.nodes.length === 0) {
                setLayoutNotice("画布上还没有可布局的节点");
                return;
            }
            const res = await fetch("/api/layout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ graph, tune: true }),
            });
            const data = await res.json();
            if (res.ok && data.xml) {
                loadDiagram(data.xml);
                setLayoutNotice(
                    `✅ Graphviz 自动布局完成：${graph.nodes.length} 节点 / ${graph.edges.length} 连线`
                );
            } else {
                setLayoutNotice(`自动布局失败：${data?.error || res.status}`);
            }
        } catch (error) {
            setLayoutNotice(
                `自动布局失败：${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            setLayoutBusy(false);
            setTimeout(() => setLayoutNotice(null), 6000);
        }
    };

    const applyStylePreset = async (preset: string) => {
        if (layoutBusy) return;
        setLayoutBusy(true);
        setLayoutNotice(null);
        try {
            const xml = await exportXml();
            const res = await fetch("/api/restyle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ xml, preset }),
            });
            const data = await res.json();
            if (res.ok && data.xml) {
                loadDiagram(data.xml);
                setLayoutNotice(`✅ 已应用「${preset}」样式（布局不变）`);
            } else {
                setLayoutNotice(`样式应用失败：${data?.error || res.status}`);
            }
        } catch (error) {
            setLayoutNotice(
                `样式应用失败：${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            setLayoutBusy(false);
            setTimeout(() => setLayoutNotice(null), 6000);
        }
    };

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Check on mount
        checkMobile();

        // Add event listener for resize
        window.addEventListener("resize", checkMobile);

        // Cleanup
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            importDiagramFile(file);
        }
        // Reset the file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    // Handle the load event from draw.io
    const handleDrawioLoad = (data: any) => {
        setIsDrawIoLoaded(true);
    };

    // Handle the export event from draw.io
    const handleDrawioExport = (data: any) => {
        // Check both the state and the document attribute for the export purpose
        const exportPurposeFromAttr = document.body.getAttribute('data-export-purpose');
        const isFileExport = exportPurpose === 'file' || exportPurposeFromAttr === 'file';
        
        // Call the original export handler first
        handleDiagramExport(data);
        
        // Only handle file download when purpose is 'file'
        if (isFileExport) {
            try {
                // Extract the XML part for .drawio file
                const xmlContent = extractDiagramXML(data.data);
                
                // Create a Blob with the XML content
                const blob = new Blob([xmlContent], { type: 'application/xml' });
                
                // Create a download link
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `diagram.drawio`;
                document.body.appendChild(a);
                a.click();
                
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 0);
            } catch (error) {
                console.error("Error exporting diagram:", error);
                // Fallback: use the chartXML from context
                if (chartXML) {
                    const blob = new Blob([chartXML], { type: 'application/xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `diagram.drawio`;
                    document.body.appendChild(a);
                    a.click();
                    
                    // Clean up
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 0);
                }
            }
        }
    };

    if (isMobile) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center p-8">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Please open this application on a desktop or laptop
                    </h1>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <div className={`h-full p-1 transition-all duration-300 ${isChatCollapsed ? 'w-full' : 'w-3/4'}`}>
                <div className="h-full flex flex-col relative">
                    {/* Import/Export buttons overlayed on top of Draw.io, positioned to look like part of the toolbar */}
                    {isDrawIoLoaded && (
                        <div className="absolute top-2.5 right-20 z-10 flex gap-2 animate-in fade-in duration-300">
                            <select
                                className="h-7.5 rounded-[4px] border border-[#b8d4e8] bg-[#c2e7ff] px-1.5 text-[#3F3F3F] shadow-sm hover:bg-[#abcfe7]/90"
                                style={{ fontSize: "14px", fontWeight: 550 }}
                                title="应用样式预设（暗色/企业/手绘/色盲安全）"
                                defaultValue=""
                                disabled={layoutBusy}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        applyStylePreset(e.target.value);
                                        e.target.value = "";
                                    }
                                }}
                            >
                                <option value="" disabled>
                                    样式
                                </option>
                                <option value="default">默认</option>
                                <option value="corporate">企业风</option>
                                <option value="handdrawn">手绘风</option>
                                <option value="colorblind-safe">色盲安全</option>
                                <option value="dark">暗色</option>
                            </select>
                            <Button 
                                onClick={runAutoLayout} 
                                variant="secondary" 
                                size="sm" 
                                disabled={layoutBusy}
                                className="h-7.5 bg-[#c2e7ff] hover:bg-[#abcfe7]/90 text-[#3F3F3F] shadow-sm rounded-[4px]"
                                title="用 Graphviz 重新自动布局当前图表"
                                style={{ fontSize: '14px', fontWeight: 550}}
                            >
                                <LayoutGrid className="h-3 w-3 mr-1" />
                                <span className="text-xs" style={{ fontSize: '14px' }}>自动布局</span>
                            </Button>
                            {layoutNotice && (
                                <div className="absolute top-10 right-0 z-20 rounded-md bg-black/80 px-3 py-1.5 text-xs text-white shadow">
                                    {layoutNotice}
                                </div>
                            )}
                            <Button 
                                onClick={triggerFileInput} 
                                variant="secondary" 
                                size="sm" 
                                className="h-7.5 bg-[#c2e7ff] hover:bg-[#abcfe7]/90 text-[#3F3F3F] shadow-sm rounded-[4px]"
                                title="Import .drawio file"
                                style={{ fontSize: '14px', fontWeight: 550}}
                            >
                                <Upload className="h-3 w-3 mr-1" />
                                <span className="text-xs" style={{ fontSize: '14px' }}>导入</span>
                            </Button>
                            <Button 
                                onClick={exportDiagramFile} 
                                variant="secondary" 
                                size="sm" 
                                className="h-7.5 bg-[#c2e7ff] hover:bg-[#abcfe7]/90 text-[#3F3F3F] shadow-sm rounded-[4px]"
                                title="Export as .drawio file"
                                style={{ fontSize: '14px', fontWeight: 550}}
                            >
                                <Download className="h-3 w-3 mr-1" />
                                <span className="text-xs" style={{ fontSize: '14px' }}>导出</span>
                            </Button>
                        </div>
                    )}
                    
                    {/* File input (hidden) */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".drawio,.xml"
                    />
                    
                    {/* Draw.io editor */}
                    <div className="flex-1">
                        <DrawIoEmbed
                            ref={drawioRef}
                            onLoad={handleDrawioLoad}
                            onExport={handleDrawioExport}
                            urlParameters={{
                                ui: "simple",
                                spin: true,
                                libraries: false,
                                noSaveBtn: true,
                                saveAndExit: false,
                                noExitBtn: true,
                                grid: true,
                            }}
                        />
                    </div>
                </div>
            </div>
            <div className={`h-full p-1 transition-all duration-300 ${isChatCollapsed ? 'w-0' : 'w-1/4'}`}>
                <CollapsibleChatPanel type="drawio" onCollapseChange={setIsChatCollapsed} />
            </div>
        </div>
    );
}
