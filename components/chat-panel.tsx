"use client";

import {
    Loader2,
    ScanEye,
} from "lucide-react";
import type React from "react";
import { useRef, useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatInput } from "@/components/chat-input";
import { ChatMessageDisplay } from "./chat-message-display";
import { useDiagram } from "@/contexts/diagram-context";
import { replaceNodes, formatXML } from "@/lib/utils";
import { HistoryDialog } from "@/components/history-dialog";
import { ModeSelector } from "@/components/mode-selector";
import { ModelConfigDialog } from "@/components/model-config-dialog";
import { useModelConfig } from "@/contexts/model-config-context";

export default function ChatPanel() {
    const {
        loadDiagram: onDisplayChart,
        handleExport: onExport,
        resolverRef,
        chartXML,
        clearDiagram,
        diagramHistory,
        exportPng,
    } = useDiagram();
    const { config: modelConfig } = useModelConfig();

    // Vision self-check (drawio-skill Step 5): after each display_diagram,
    // export a PNG, ask the vision model for layout issues, and apply
    // targeted fixes (max 2 rounds).
    const [selfCheckEnabled, setSelfCheckEnabled] = useState(() => {
        if (typeof window === "undefined") return true;
        return localStorage.getItem("self-check-enabled") !== "0";
    });
    const [selfCheckBusy, setSelfCheckBusy] = useState(false);
    const selfCheckBusyRef = useRef(false);

    const toggleSelfCheck = () => {
        setSelfCheckEnabled((prev) => {
            const next = !prev;
            localStorage.setItem("self-check-enabled", next ? "1" : "0");
            return next;
        });
    };

    const appendNotice = (
        setMessages: ReturnType<typeof useChat>["setMessages"],
        text: string
    ) => {
        setMessages((prev) => [
            ...prev,
            {
                id: `selfcheck-${Date.now()}`,
                role: "assistant" as const,
                parts: [{ type: "text" as const, text }],
            },
        ]);
    };

    const runSelfCheck = async (
        setMessages: ReturnType<typeof useChat>["setMessages"],
        currentXml: string
    ) => {
        if (selfCheckBusyRef.current) return;
        selfCheckBusyRef.current = true;
        setSelfCheckBusy(true);
        let fixedCount = 0;
        let xml = currentXml;
        let lastIssues: any[] = [];
        try {
            for (let round = 0; round < 2; round++) {
                const png = await exportPng();
                const checkRes = await fetch("/api/selfcheck", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        dataUrl: png,
                        xml,
                        modelConfig,
                    }),
                });
                const checkData = await checkRes.json();
                const issues: any[] =
                    checkRes.ok && Array.isArray(checkData.issues)
                        ? checkData.issues
                        : [];
                lastIssues = issues;
                if (issues.length === 0) {
                    appendNotice(
                        setMessages,
                        fixedCount > 0
                            ? `🔍 自检通过（已自动修复 ${fixedCount} 处）`
                            : "🔍 自检通过：未发现布局问题"
                    );
                    return;
                }
                const fixRes = await fetch("/api/selfcheck-fix", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ xml, issues, modelConfig }),
                });
                const fixData = await fixRes.json();
                const edits: { search: string; replace: string }[] =
                    fixRes.ok && Array.isArray(fixData.edits)
                        ? fixData.edits
                        : [];
                if (edits.length > 0) {
                    const { replaceXMLParts } = await import("@/lib/utils");
                    xml = replaceXMLParts(xml, edits);
                    onDisplayChart(xml);
                    fixedCount += edits.length;
                } else {
                    break;
                }
            }
            const issueList = lastIssues
                .slice(0, 6)
                .map(
                    (i: any) =>
                        `• [${i.severity || "?"}] ${i.location || ""}: ${i.description || ""}`
                )
                .join("\n");
            appendNotice(
                setMessages,
                fixedCount > 0
                    ? `🔧 已自动修复 ${fixedCount} 处，请在画布上复核`
                    : `🔍 自检发现 ${lastIssues.length} 处问题（自动修复未生效，建议手动调整）：\n${issueList}`
            );
        } catch (error) {
            appendNotice(
                setMessages,
                `⚠️ 自检失败：${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            selfCheckBusyRef.current = false;
            setSelfCheckBusy(false);
        }
    };

    const onFetchChart = (timeoutMs = 1500) => {
        return new Promise<string>((resolve, reject) => {
            let settled = false;
            const resolver = (value: string) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(value);
            };

            const timer = setTimeout(() => {
                if (settled) return;
                settled = true;
                if (resolverRef && "current" in resolverRef && resolverRef.current === resolver) {
                    resolverRef.current = null;
                }
                reject(new Error(`Chart export timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            if (resolverRef && "current" in resolverRef) {
                resolverRef.current = resolver;
            }
            onExport('chat');
        });
    };
    // Add a step counter to track updates

    // Add state for file attachments
    const [files, setFiles] = useState<File[]>([]);
    // Add state for showing the history dialog
    const [showHistory, setShowHistory] = useState(false);

    // Convert File[] to FileList for experimental_attachments
    const createFileList = (files: File[]): FileList => {
        const dt = new DataTransfer();
        files.forEach((file) => dt.items.add(file));
        return dt.files;
    };

    // Add state for input management
    const [input, setInput] = useState("");

    // Auto-retry: the erix endpoint intermittently degenerates into a pure
    // reasoning loop with zero output (~50% on some prompts). When a turn
    // finishes with no text and no tool calls, resend the last input once.
    const lastSubmitRef = useRef<{ parts: any[]; body: any } | null>(null);
    const autoRetryCountRef = useRef(0);
    const MAX_AUTO_RETRIES = 3;
    // C4 multi-page documents can be overwritten by a follow-up
    // display_diagram in the same turn; keep the XML to restore it when
    // this turn did NOT emit a display_diagram.
    const c4XmlRef = useRef<string | null>(null);
    const turnHadDisplayRef = useRef(false);

    // Remove the currentXmlRef and related useEffect
    const { messages, sendMessage, addToolResult, status, error, setMessages } =
        useChat({
            transport: new DefaultChatTransport({
                api: "/api/chat",
            }),
            onFinish: ({ message }) => {
                const hasOutput = (message.parts || []).some(
                    (p: any) =>
                        (p.type === "text" && p.text?.trim()) ||
                        p.type.startsWith("tool-")
                );
                if (!hasOutput && lastSubmitRef.current) {
                    if (autoRetryCountRef.current < MAX_AUTO_RETRIES) {
                        autoRetryCountRef.current += 1;
                        appendNotice(
                            setMessages,
                            `⏳ 模型深度思考耗时过长，正在自动重试（${autoRetryCountRef.current}/${MAX_AUTO_RETRIES}）…`
                        );
                        sendMessage(
                            { parts: lastSubmitRef.current.parts },
                            { body: lastSubmitRef.current.body }
                        );
                    } else {
                        autoRetryCountRef.current = 0;
                        lastSubmitRef.current = null;
                        appendNotice(
                            setMessages,
                            "❌ 多次尝试仍未返回结果，请重新发送或切换模型。"
                        );
                    }
                } else {
                    autoRetryCountRef.current = 0;
                    lastSubmitRef.current = null;
                }
                // Restore the C4 multi-page document if this turn loaded one
                // and no display_diagram overwrote it.
                if (c4XmlRef.current && !turnHadDisplayRef.current) {
                    onDisplayChart(c4XmlRef.current);
                }
                c4XmlRef.current = null;
                turnHadDisplayRef.current = false;
            },
            async onToolCall({ toolCall }) {
                if (toolCall.toolName === "display_diagram") {
                    turnHadDisplayRef.current = true;
                    // Diagram is handled streamingly in the ChatMessageDisplay component
                    addToolResult({
                        tool: "display_diagram",
                        toolCallId: toolCall.toolCallId,
                        output: "生成完成.",
                    });
                    // Auto self-check after the diagram lands on the canvas.
                    if (selfCheckEnabled && modelConfig.visionModel) {
                        setTimeout(() => {
                            onFetchChart(3000)
                                .then((xml) => runSelfCheck(setMessages, xml))
                                .catch(() => {});
                        }, 1500);
                    }
                } else if (toolCall.toolName === "layout_diagram") {
                    const graph = toolCall.input as {
                        nodes: unknown[];
                        edges: unknown[];
                        direction?: "TB" | "LR";
                    };
                    try {
                        const res = await fetch("/api/layout", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ graph, tune: true }),
                        });
                        const data = await res.json();
                        if (res.ok && data.xml) {
                            onDisplayChart(data.xml);
                            addToolResult({
                                tool: "layout_diagram",
                                toolCallId: toolCall.toolCallId,
                                output: `Graphviz 自动布局完成（${graph.nodes?.length || 0} 节点，${graph.edges?.length || 0} 连线）。`,
                            });
                        } else {
                            addToolResult({
                                tool: "layout_diagram",
                                toolCallId: toolCall.toolCallId,
                                output: `自动布局失败：${data?.error || res.status}`,
                            });
                        }
                    } catch (error) {
                        addToolResult({
                            tool: "layout_diagram",
                            toolCallId: toolCall.toolCallId,
                            output: `自动布局失败：${error instanceof Error ? error.message : String(error)}`,
                        });
                    }
                } else if (toolCall.toolName === "apply_style") {
                    const preset = (toolCall.input as { preset?: string })
                        ?.preset;
                    try {
                        const xml = await onFetchChart();
                        const res = await fetch("/api/restyle", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ xml, preset }),
                        });
                        const data = await res.json();
                        if (res.ok && data.xml) {
                            onDisplayChart(data.xml);
                            addToolResult({
                                tool: "apply_style",
                                toolCallId: toolCall.toolCallId,
                                output: `已应用 "${preset}" 样式预设（布局不变）。`,
                            });
                        } else {
                            addToolResult({
                                tool: "apply_style",
                                toolCallId: toolCall.toolCallId,
                                output: `样式应用失败：${data?.error || res.status}`,
                            });
                        }
                    } catch (error) {
                        addToolResult({
                            tool: "apply_style",
                            toolCallId: toolCall.toolCallId,
                            output: `样式应用失败：${error instanceof Error ? error.message : String(error)}`,
                        });
                    }
                } else if (toolCall.toolName === "c4_diagram") {
                    const c4 = toolCall.input as { levels: unknown[] };
                    try {
                        const res = await fetch("/api/c4", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ c4 }),
                        });
                        const data = await res.json();
                        if (res.ok && data.xml) {
                            c4XmlRef.current = data.xml;
                            onDisplayChart(data.xml);
                            addToolResult({
                                tool: "c4_diagram",
                                toolCallId: toolCall.toolCallId,
                                output: `C4 模型生成完成（${data.pages || c4.levels.length} 页，支持点击下钻）。`,
                            });
                        } else {
                            addToolResult({
                                tool: "c4_diagram",
                                toolCallId: toolCall.toolCallId,
                                output: `C4 生成失败：${data?.error || res.status}`,
                            });
                        }
                    } catch (error) {
                        addToolResult({
                            tool: "c4_diagram",
                            toolCallId: toolCall.toolCallId,
                            output: `C4 生成失败：${error instanceof Error ? error.message : String(error)}`,
                        });
                    }
                } else if (toolCall.toolName === "edit_diagram") {
                    const { edits } = toolCall.input as {
                        edits: Array<{ search: string; replace: string }>;
                    };

                    let currentXml = '';
                    try {
                        // Fetch current chart XML
                        currentXml = await onFetchChart();

                        // Apply edits using the utility function
                        const { replaceXMLParts } = await import("@/lib/utils");
                        const editedXml = replaceXMLParts(currentXml, edits);

                        // Load the edited diagram
                        onDisplayChart(editedXml);

                        addToolResult({
                            tool: "edit_diagram",
                            toolCallId: toolCall.toolCallId,
                            output: `Successfully applied ${edits.length} edit(s) to the diagram.`,
                        });
                    } catch (error) {
                        console.error("Edit diagram failed:", error);

                        const errorMessage = error instanceof Error ? error.message : String(error);

                        addToolResult({
                            tool: "edit_diagram",
                            toolCallId: toolCall.toolCallId,
                            output: `Failed to edit diagram: ${errorMessage}`,
                        });
                    }
                }
            },
            onError: (error) => {
                console.error("Chat error:", error);
            },
        });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (input.trim() && status !== "submitted" && status !== "streaming") {
            try {
                // Import code/config files (SQL/Terraform/OpenAPI/Python/JS)
                // through the deterministic importers BEFORE fetching the
                // canvas XML — the imported diagram lands on the canvas and
                // the model sees it as the current-diagram context.
                const codeFiles = files.filter(
                    (f) => !f.type.startsWith("image/")
                );
                const importNotes: string[] = [];
                for (const file of codeFiles) {
                    try {
                        const content = await file.text();
                        const res = await fetch("/api/import", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                content,
                                filename: file.name,
                            }),
                        });
                        const data = await res.json();
                        if (res.ok && data.xml) {
                            onDisplayChart(data.xml);
                            importNotes.push(
                                `✅ 已导入 ${file.name}（${data.label}）`
                            );
                        } else {
                            importNotes.push(
                                `❌ ${file.name} 导入失败：${data?.error || res.status}`
                            );
                        }
                    } catch (error) {
                        importNotes.push(
                            `❌ ${file.name} 导入失败：${error instanceof Error ? error.message : String(error)}`
                        );
                    }
                }

                // Fetch chart data before sending message (after imports so
                // the model context includes the imported diagram)
                let chartXml = chartXML;
                try {
                    chartXml = await onFetchChart();
                } catch (error) {
                    if (!chartXml) {
                        throw error;
                    }
                    console.warn("Using cached chart XML because live export failed", error);
                }

                // Format the XML to ensure consistency
                chartXml = formatXML(chartXml);

                // Create message parts
                const textWithNotes =
                    importNotes.length > 0
                        ? `${input}\n\n[文件导入结果]\n${importNotes.join("\n")}`
                        : input;
                const parts: any[] = [{ type: "text", text: textWithNotes }];

                // Add file parts if files exist
                if (files.length > 0) {
                    for (const file of files) {
                        if (!file.type.startsWith("image/")) continue;
                        const reader = new FileReader();
                        const dataUrl = await new Promise<string>((resolve) => {
                            reader.onload = () =>
                                resolve(reader.result as string);
                            reader.readAsDataURL(file);
                        });

                        parts.push({
                            type: "file",
                            url: dataUrl,
                            mediaType: file.type,
                        });
                    }
                }

                const body = {
                    xml: chartXml,
                    modelConfig,
                };
                lastSubmitRef.current = { parts, body };
                sendMessage({ parts }, { body });

                // Clear input and files after submission
                setInput("");
                setFiles([]);
            } catch (error) {
                console.error("Error fetching chart data:", error);
            }
        }
    };

    // Handle input change
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setInput(e.target.value);
    };

    // Helper function to handle file changes
    const handleFileChange = (newFiles: File[]) => {
        setFiles(newFiles);
    };

    return (
        <Card className="h-full flex flex-col rounded-none py-0 gap-0 overflow-hidden">
            <CardHeader className="p-4 flex flex-col gap-2">
                {/* Row 1: mode selector (top-left). The top-right corner is
                    reserved for the floating 默认配置/GitHub/关闭 buttons. */}
                <div className="flex items-center justify-between">
                    <ModeSelector active="drawio" />
                </div>
                {/* Row 2: self-check toggle, on its own row below so it never
                    sits under the floating buttons. */}
                <div className="flex items-center">
                    <button
                        type="button"
                        onClick={toggleSelfCheck}
                        disabled={selfCheckBusy || !modelConfig.visionModel}
                        title={
                            !modelConfig.visionModel
                                ? "未配置视觉模型，无法自检"
                                : selfCheckEnabled
                                  ? "视觉自检已开启（生成后自动检查布局）"
                                  : "视觉自检已关闭"
                        }
                        className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors ${
                            selfCheckEnabled
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                                : "border-border bg-muted/40 text-muted-foreground"
                        }`}
                    >
                        {selfCheckBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <ScanEye className="h-3.5 w-3.5" />
                        )}
                        视觉自检{selfCheckEnabled ? " · 开" : " · 关"}
                    </button>
                </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden px-2">
                <ChatMessageDisplay
                    messages={messages}
                    error={error}
                    status={status}
                    setInput={setInput}
                    setFiles={handleFileChange}
                />
            </CardContent>

            <CardFooter className="p-2">
                <ChatInput
                    input={input}
                    status={status}
                    onSubmit={onFormSubmit}
                    onChange={handleInputChange}
                    onClearChat={() => {
                        setMessages([]);
                        clearDiagram();
                    }}
                    files={files}
                    onFileChange={handleFileChange}
                    onRequestHistory={() => setShowHistory(true)}
                    historyAvailable={diagramHistory.length > 0}
                    enableHistoryControls
                    visionEnabled={!!modelConfig.visionModel}
                />
            </CardFooter>
            <HistoryDialog
                showHistory={showHistory}
                onToggleHistory={setShowHistory}
            />
        </Card>
    );
}
