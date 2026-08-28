"use client";

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
    } = useDiagram();
    const { config: modelConfig } = useModelConfig();

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
                />
            </CardFooter>
            <HistoryDialog
                showHistory={showHistory}
                onToggleHistory={setShowHistory}
            />
        </Card>
    );
}
