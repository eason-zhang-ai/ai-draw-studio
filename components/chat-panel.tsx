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
                const issues: unknown[] =
                    checkRes.ok && Array.isArray(checkData.issues)
                        ? checkData.issues
                        : [];
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
            appendNotice(
                setMessages,
                fixedCount > 0
                    ? `🔧 已自动修复 ${fixedCount} 处问题，请在画布上复核`
                    : "🔍 自检发现少量问题，建议手动微调"
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

    // Remove the currentXmlRef and related useEffect
    const { messages, sendMessage, addToolResult, status, error, setMessages } =
        useChat({
            transport: new DefaultChatTransport({
                api: "/api/chat",
            }),
            async onToolCall({ toolCall }) {
                if (toolCall.toolName === "display_diagram") {
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
                // Fetch chart data before sending message
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
                const parts: any[] = [{ type: "text", text: input }];

                // Add file parts if files exist
                if (files.length > 0) {
                    for (const file of files) {
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

                sendMessage(
                    { parts },
                    {
                        body: {
                            xml: chartXml,
                            modelConfig,
                        },
                    }
                );

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
                <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2 items-center">
                        <ModeSelector active="drawio" />
                    </div>
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
