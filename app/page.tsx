"use client";
import React, { useState, useEffect, useRef } from "react";
import { DrawIoEmbed } from "react-drawio";
import { CollapsibleChatPanel } from "@/components/collapsible-chat-panel";
import { useDiagram } from "@/contexts/diagram-context";
import { Button } from "@/components/ui/button";
import { Upload, Download, LayoutGrid, Undo2, Info } from "lucide-react";
import { extractDiagramXML } from "@/lib/utils";
import { xmlToGraph } from "@/lib/xml-graph";
import { useRuntimeCapabilities } from "@/lib/use-runtime-capabilities";

/**
 * Style presets, in dropdown order. Kept in one place so the option labels and
 * the undo tooltip ("撤销「样式：暗色」") cannot drift apart.
 */
const STYLE_PRESETS: { value: string; label: string }[] = [
    { value: "default", label: "默认" },
    { value: "corporate", label: "企业风" },
    { value: "handdrawn", label: "手绘风" },
    { value: "colorblind-safe", label: "色盲安全" },
    { value: "dark", label: "暗色" },
];

const STYLE_PRESET_LABELS: Record<string, string> = Object.fromEntries(
    STYLE_PRESETS.map((p) => [p.value, p.label])
);

/**
 * draw.io reports canvas XML either raw or URL-encoded depending on the event;
 * normalise both and ignore anything that does not look like diagram XML
 * (rather than storing garbage that would overwrite a good canvas).
 */
function normalizeDrawioXml(raw: unknown): string | null {
    if (typeof raw !== "string" || !raw.trim()) return null;
    if (raw.includes("<mxfile") || raw.includes("<mxGraphModel")) return raw;
    try {
        const decoded = decodeURIComponent(raw);
        if (decoded.includes("<mxfile") || decoded.includes("<mxGraphModel")) {
            return decoded;
        }
    } catch {
        /* not URL-encoded — fall through */
    }
    return null;
}

export default function Home() {
    const { drawioRef, handleDiagramExport, importDiagramFile, exportDiagramFile, chartXML, exportPurpose, exportXml, loadDiagram, syncCanvasXml, transformCanvas, undoCanvasTransform, undoDepth, undoLabel, canvasEpoch } = useDiagram();
    const [isMobile, setIsMobile] = useState(false);
    const [isChatCollapsed, setIsChatCollapsed] = useState(false);
    const [isDrawIoLoaded, setIsDrawIoLoaded] = useState(false);
    const [layoutBusy, setLayoutBusy] = useState(false);
    const [layoutNotice, setLayoutNotice] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const undoButtonRef = useRef<HTMLButtonElement>(null);
    // Auto-layout and the style presets both drive the vendored Python scripts,
    // so they only exist where the runtime has python3 (+ Graphviz). A plain
    // Vercel deploy has neither and hides them instead of failing on click.
    const caps = useRuntimeCapabilities();
    // Style presets are a "switch", not a stack: every preset is remapped
    // from the ORIGINAL (pre-restyle) diagram so switching dark -> corporate
    // is a clean corporate, not corporate-over-dark. Snapshot the base on the
    // first style operation; reset it whenever a new diagram lands.
    const styleBaseXmlRef = useRef<string | null>(null);

    useEffect(() => {
        // A diagram arrived from OUTSIDE (AI generation, file import, history
        // restore) -> drop the stale style base.
        //
        // Keyed on canvasEpoch rather than chartXML on purpose: chartXML also
        // changes for our own layout/style pushes, so the old chartXML-based
        // effect cleared the base immediately after applying a preset. The next
        // preset then re-snapshotted the ALREADY-restyled diagram, making
        // presets compound (dark then corporate gave corporate-over-dark)
        // instead of every preset remapping from the original.
        styleBaseXmlRef.current = null;
    }, [canvasEpoch]);

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
            if (graph.edges.length === 0 && graph.nodes.length === 1) {
                setLayoutNotice("当前图表只有 1 个节点、没有连线，无需自动布局");
                return;
            }
            const res = await fetch("/api/layout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ graph, tune: true }),
            });
            const data = await res.json();
            if (res.ok && data.xml) {
                // `xml` is exactly what the canvas held before the transform,
                // so it doubles as the undo snapshot.
                transformCanvas(data.xml, xml, "自动布局");
                setLayoutNotice(
                    `✅ 自动布局完成：${graph.nodes.length} 节点 / ${graph.edges.length} 连线`
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
            // Snapshot the original diagram on the first style operation.
            if (!styleBaseXmlRef.current) {
                styleBaseXmlRef.current = await exportXml();
            }
            const presetLabel = STYLE_PRESET_LABELS[preset] ?? preset;
            // "默认" = restore the original, no remap needed.
            if (preset === "default") {
                transformCanvas(
                    styleBaseXmlRef.current,
                    await exportXml(),
                    "样式：默认"
                );
                setLayoutNotice("✅ 已恢复默认样式（原始配色）");
                return;
            }
            // Always remap from the ORIGINAL base, not the current (possibly
            // already-restyled) diagram, so switching presets is a clean
            // switch rather than a cumulative overlay.
            const res = await fetch("/api/restyle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ xml: styleBaseXmlRef.current, preset }),
            });
            const data = await res.json();
            if (res.ok && data.xml) {
                transformCanvas(data.xml, await exportXml(), `样式：${presetLabel}`);
                setLayoutNotice(`✅ 已应用「${presetLabel}」样式（布局不变）`);
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

    const undoTranform = () => {
        const label = undoCanvasTransform();
        setLayoutNotice(label ? `↩️ 已撤销「${label}」` : "没有可撤销的操作");
        setTimeout(() => setLayoutNotice(null), 6000);
    };

    useEffect(() => {
        // Right after pressing one of our transform buttons the focus is still
        // on THIS document, so Ctrl+Z lands here. Once the user clicks into the
        // canvas the iframe holds focus instead and draw.io's own undo handles
        // the shortcut — which is the correct split, because our transforms
        // never enter draw.io's history in the first place.
        const onKeyDown = (event: KeyboardEvent) => {
            if (
                (event.metaKey || event.ctrlKey) &&
                !event.shiftKey &&
                event.key.toLowerCase() === "z" &&
                undoDepth > 0
            ) {
                event.preventDefault();
                undoTranform();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [undoDepth, undoCanvasTransform]);

    // draw.io focuses its own canvas whenever we push XML into it, which would
    // route Ctrl+Z to the iframe — where our transform has no history entry at
    // all. Hand focus back to the undo button so the reflex works; clicking the
    // canvas resumes normal editing.
    const undoTrackingRef = useRef(0);
    useEffect(() => {
        if (undoDepth <= undoTrackingRef.current) {
            undoTrackingRef.current = undoDepth;
            return;
        }
        undoTrackingRef.current = undoDepth;
        const focusUndo = () =>
            undoButtonRef.current?.focus({ preventScroll: true });
        focusUndo();
        // draw.io's own focus grab lands a beat after the postMessage round-trip,
        // so re-assert once if it won the race.
        const timer = setTimeout(() => {
            if (document.activeElement !== undoButtonRef.current) focusUndo();
        }, 500);
        return () => clearTimeout(timer);
    }, [undoDepth]);

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
    const restoredRef = useRef(false);
    const handleDrawioLoad = (data: any) => {
        setIsDrawIoLoaded(true);
    };

    // Restore the remembered diagram once the iframe is ready AND chartXML has
    // arrived — after a reload those two finish in either order (the iframe
    // takes seconds, the IndexedDB read milliseconds).
    //
    // Doing this inside onLoad does NOT work: react-drawio registers its
    // message handler in a mount-only effect, so the callback forever holds the
    // FIRST render's closure — where chartXML is still empty on a fresh page
    // load. Reading it from an effect that depends on chartXML avoids that.
    useEffect(() => {
        if (!isDrawIoLoaded || restoredRef.current || !chartXML) return;
        restoredRef.current = true;
        loadDiagram(chartXML);
    }, [isDrawIoLoaded, chartXML, loadDiagram]);

    // draw.io autosaves the canvas after edits. Mirroring those saves into
    // chartXML is what makes manual edits survive a reload / mode switch —
    // they are otherwise only captured by an explicit export.
    const handleDrawioAutoSave = (data: any) => {
        const xml = normalizeDrawioXml(data?.xml ?? data?.data);
        if (xml) syncCanvasXml(xml);
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
                    {/* Floating toolbar — overlaid on the Draw.io editor the way
                        the upstream project does it, so it reads as part of
                        draw.io's own toolbar instead of pushing the canvas down
                        by a whole row. The right offset clears draw.io's own
                        top-right controls (they sit within ~70px of the right
                        edge), and the buttons stay compact so the whole strip
                        fits the empty stretch of draw.io's toolbar. */}
                    {isDrawIoLoaded && (
                        <div className="absolute top-2.5 right-20 z-10 flex items-center gap-1.5 animate-in fade-in duration-300">
                            {caps && !caps.autoLayout && !caps.stylePresets && (
                                <span
                                    className="flex size-7 items-center justify-center rounded-[4px] bg-amber-100 text-amber-700 shadow-sm"
                                    title="此运行环境没有 python3 / Graphviz，自动布局、样式预设、C4、代码文件导入均不可用（本部署不含容器镜像）。其余功能不受影响。"
                                >
                                    <Info className="h-3.5 w-3.5" />
                                </span>
                            )}
                            {caps?.stylePresets && (
                            <select
                                className="h-7 rounded-[4px] border border-[#b8d4e8] bg-[#c2e7ff] px-1.5 text-[#3F3F3F] shadow-sm hover:bg-[#abcfe7]/90"
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
                                {STYLE_PRESETS.map((p) => (
                                    <option key={p.value} value={p.value}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>
                            )}
                            <Button
                                ref={undoButtonRef}
                                onClick={undoTranform}
                                variant="secondary"
                                size="icon"
                                disabled={layoutBusy || undoDepth === 0}
                                className="size-7 bg-[#c2e7ff] hover:bg-[#abcfe7]/90 text-[#3F3F3F] shadow-sm rounded-[4px] disabled:opacity-40"
                                title={
                                    undoDepth > 0
                                        ? `撤销「${undoLabel}」（可撤销 ${undoDepth} 步）`
                                        : "没有可撤销的操作"
                                }
                            >
                                <Undo2 className="h-3.5 w-3.5" />
                            </Button>
                            {caps?.autoLayout && (
                            <Button
                                onClick={runAutoLayout}
                                variant="secondary"
                                size="icon"
                                disabled={layoutBusy}
                                className="size-7 bg-[#c2e7ff] hover:bg-[#abcfe7]/90 text-[#3F3F3F] shadow-sm rounded-[4px]"
                                title="用 Graphviz 重新自动布局当前图表"
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </Button>
                            )}
                            <Button
                                onClick={triggerFileInput}
                                variant="secondary"
                                size="icon"
                                className="size-7 bg-[#c2e7ff] hover:bg-[#abcfe7]/90 text-[#3F3F3F] shadow-sm rounded-[4px]"
                                title="导入 .drawio 文件"
                            >
                                <Upload className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                onClick={exportDiagramFile}
                                variant="secondary"
                                size="icon"
                                className="size-7 bg-[#c2e7ff] hover:bg-[#abcfe7]/90 text-[#3F3F3F] shadow-sm rounded-[4px]"
                                title="导出为 .drawio 文件"
                            >
                                <Download className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    )}

                    {/* Layout / restyle feedback — transient toast (auto-clears
                        after 6s), placed over the canvas so it covers neither
                        draw.io's toolbar row above nor its shape panel to the
                        left. */}
                    {layoutNotice && (
                        <div className="absolute top-11 left-60 z-20 rounded-md bg-black/80 px-3 py-1 text-xs text-white shadow animate-in fade-in duration-300">
                            {layoutNotice}
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
                    <div className="flex-1 min-h-0 relative">
                        <DrawIoEmbed
                            ref={drawioRef}
                            autosave
                            onAutoSave={handleDrawioAutoSave}
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
