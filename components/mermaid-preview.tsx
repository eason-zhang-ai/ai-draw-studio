"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RefreshCcw, Download, Grid3X3, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

const RENDER_DEBOUNCE_MS = 180;
let mermaidModulePromise: Promise<any> | null = null;

function loadMermaid() {
    mermaidModulePromise ??= import("mermaid").then((module) => {
        return (module as any)?.default ?? module;
    });
    return mermaidModulePromise;
}

interface MermaidPreviewProps {
    definition: string;
    className?: string;
}

export function MermaidPreview({
    definition,
    className,
}: MermaidPreviewProps) {
    const [mermaidAPI, setMermaidAPI] = useState<any>(null);
    const [svg, setSvg] = useState<string>("");
    const [renderError, setRenderError] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(false);

    const [zoom, setZoom] = useState(1);
    const [showGrid, setShowGrid] = useState(true);
    const [handDrawn, setHandDrawn] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const diagramId = useMemo(
        () => `mermaid-${Math.random().toString(36).slice(2, 10)}`,
        []
    );

    useEffect(() => {
        let isMounted = true;
        loadMermaid()
            .then((module) => {
                if (!isMounted) return;
                module.initialize({
                    startOnLoad: false,
                    securityLevel: "loose",
                    theme: "neutral",
                });
                setMermaidAPI(module);
            })
            .catch((error) => {
                console.error("Failed to load Mermaid:", error);
                if (isMounted) {
                    setRenderError("Mermaid 渲染器加载失败");
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!mermaidAPI) return;
        if (!definition.trim()) {
            setSvg("");
            setRenderError("等待 Mermaid 内容…");
            setIsRendering(false);
            return;
        }

        let cancelled = false;
        setIsRendering(true);
        setRenderError(null);

        const timer = setTimeout(() => {
            mermaidAPI.initialize({
                startOnLoad: false,
                securityLevel: "loose",
                theme: "neutral",
                look: handDrawn ? "handDrawn" : "classic",
            });
            
            mermaidAPI
                .render(diagramId, definition)
                .then(({ svg }: { svg: string }) => {
                    if (!cancelled) {
                        setSvg(svg);
                        setRenderError(null);
                        setIsRendering(false);
                    }
                })
                .catch((error: unknown) => {
                    console.error("Mermaid render error:", error);
                    if (!cancelled) {
                        setSvg("");
                        setRenderError(
                            error instanceof Error
                                ? error.message
                                : "无法渲染 Mermaid 图。"
                        );
                        setIsRendering(false);
                    }
                });
        }, RENDER_DEBOUNCE_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [definition, mermaidAPI, diagramId, handDrawn]);

    const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 3));
    const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.3));
    
    const resetZoom = () => {
        setIsResetting(true);
        setZoom(1);
        // 添加一个短暂的延迟来显示重置动画效果
        setTimeout(() => setIsResetting(false), 300);
    };
    
    const toggleGrid = () => setShowGrid(!showGrid);
    const toggleHandDrawn = () => setHandDrawn(!handDrawn);

    const handleDownload = () => {
        if (!svg) return;
        
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mermaid-diagram-${diagramId}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div
            className={cn(
                "flex flex-col h-full bg-white rounded-lg border shadow-sm overflow-hidden",
                className
            )}
        >
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
                <div>
                    <p className="text-sm font-medium">Mermaid 预览</p>
                    <p className="text-xs text-muted-foreground">
                        由 <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://mermaid.live</a> 提供支持
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end items-center">
                    <Button 
                        variant={handDrawn ? "default" : "outline"} 
                        title="手绘风格" 
                        size="sm" 
                        onClick={toggleHandDrawn}
                    >
                        <PenTool className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant={showGrid ? "default" : "outline"} 
                        title="网格点" 
                        size="sm" 
                        onClick={toggleGrid}
                    >
                        <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        title="重置" 
                        size="sm" 
                        onClick={resetZoom}
                        className={cn(
                            "transition-all duration-300",
                            isResetting && "bg-blue-500 text-white border-blue-500"
                        )}
                    >
                        <RefreshCcw className={cn(
                            "h-4 w-4",
                            isResetting && "animate-spin"
                        )} />
                    </Button>
                    <div className="flex rounded-md overflow-hidden border border-input shadow-sm">
                        <Button variant="outline" title="放小" size="sm" onClick={zoomOut} className="rounded-none border-0 px-3">
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="flex items-center justify-center text-xs w-16 bg-background">
                            {Math.round(zoom * 100)}%
                        </span>
                        <Button variant="outline" title="放大" size="sm" onClick={zoomIn} className="rounded-none border-0 px-3">
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button variant="outline" title="下载" size="sm" onClick={handleDownload} disabled={!svg}>
                        <Download className="h-4 w-4" />
                    </Button>
                </div>

            </div>

            <div 
                className="flex-1 overflow-auto p-4 bg-white relative"
                style={showGrid ? {
                    backgroundImage: "radial-gradient(circle, #ccc 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                } : {}}
            >
                <div
                    className={cn(
                        "absolute left-4 top-4 z-10 rounded border bg-white/90 px-2 py-1 text-xs text-muted-foreground shadow-sm transition-opacity pointer-events-none",
                        isRendering ? "opacity-100" : "opacity-0"
                    )}
                >
                    Rendering diagram...
                </div>
                {renderError ? (
                    <div className="h-full flex items-center justify-center text-red-500 text-sm text-center px-4">
                        {renderError}
                    </div>
                ) : svg ? (
                    <div
                        className="flex justify-center"
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: "top center",
                        }}
                        dangerouslySetInnerHTML={{ __html: svg }}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        Preparing preview...
                    </div>
                )}
            </div>
        </div>
    );
}
