"use client";

import type React from "react";
import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import ExamplePanel from "./chat-example-panel";
import { UIMessage } from "ai";
import { convertToLegalXml, replaceNodes } from "@/lib/utils";

import { useDiagram } from "@/contexts/diagram-context";

interface ChatMessageDisplayProps {
    messages: UIMessage[];
    error?: Error | null;
    status: "submitted" | "streaming" | "ready" | "error";
    setInput: (input: string) => void;
    setFiles: (files: File[]) => void;
}

export function ChatMessageDisplay({
    messages,
    error,
    status,
    setInput,
    setFiles,
}: ChatMessageDisplayProps) {
    const { chartXML, loadDiagram: onDisplayChart } = useDiagram();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const previousXML = useRef<string>("");
    const processedToolCalls = useRef<Set<string>>(new Set());
    const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>(
        {}
    );
    const handleDisplayChart = useCallback(
        (xml: string) => {
            const currentXml = xml || "";
            const convertedXml = convertToLegalXml(currentXml);
            if (convertedXml !== previousXML.current) {
                previousXML.current = convertedXml;
                const replacedXML = replaceNodes(chartXML, convertedXml);
                onDisplayChart(replacedXML);
            }
        },
        [chartXML, onDisplayChart]
    );

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Handle tool invocations and update diagram when needed
    useEffect(() => {
        messages.forEach((message) => {
            if (message.parts) {
                message.parts.forEach((part: any) => {
                    if (part.type?.startsWith("tool-")) {
                        const { toolCallId, state } = part;

                        // Auto-collapse args when diagrams are generated
                        if (state === "output-available") {
                            setExpandedTools((prev) => ({
                                ...prev,
                                [toolCallId]: false,
                            }));
                        }

                        // Handle diagram updates for display_diagram tool
                        if (
                            part.type === "tool-display_diagram" &&
                            part.input?.xml
                        ) {
                            // For streaming input, always update to show streaming
                            if (
                                state === "input-streaming" ||
                                state === "input-available" ||
                                state === "output-streaming"
                            ) {
                                handleDisplayChart(part.input.xml);
                            }
                            // For completed calls, only update if not processed yet
                            else if (
                                state === "output-available" &&
                                !processedToolCalls.current.has(toolCallId)
                            ) {
                                handleDisplayChart(part.input.xml);
                                processedToolCalls.current.add(toolCallId);
                            }
                        }
                        
                        // Handle edit_diagram tool
                        if (
                            part.type === "tool-edit_diagram" &&
                            part.input?.edits
                        ) {
                            // For edit_diagram, we only care about the final output
                            if (
                                state === "output-available" &&
                                !processedToolCalls.current.has(toolCallId)
                            ) {
                                processedToolCalls.current.add(toolCallId);
                            }
                        }
                    }
                });
            }
        });
    }, [messages, handleDisplayChart]);

    const renderToolPart = (part: any) => {
        const callId = part.toolCallId;
        const { state, input, output } = part;
        const isExpanded = expandedTools[callId] ?? false;
        const toolName = part.type?.replace("tool-", "");

        const toggleExpanded = () => {
            setExpandedTools((prev) => ({
                ...prev,
                [callId]: !isExpanded,
            }));
        };

        return (
            <div
                key={callId}
                className="p-4 my-2 text-gray-500 border border-gray-300 rounded"
            >
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="text-xs">工具: {toolName}</div>
                        {input && Object.keys(input).length > 0 && (
                            <button
                                onClick={toggleExpanded}
                                className="ml-2 text-xs text-blue-500 hover:text-blue-700 px-1 py-1"
                            >
                                {isExpanded ? "隐藏" : "显示"}
                            </button>
                        )}
                    </div>
                    {input && isExpanded && (
                        <div className="mt-1 font-mono text-xs overflow-x-auto">
                            {typeof input === "object" &&
                                Object.keys(input).length > 0 &&
                                `Input: ${JSON.stringify(input, null, 2)}`}
                        </div>
                    )}
                    <div className="mt-2 text-sm">
                        {state === "input-streaming" || state === "output-streaming" ? (
                            <div className="flex items-center text-blue-600">
                                <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                                {state === "output-streaming" ? "正在生成..." : "正在生成..."}
                            </div>
                        ) : state === "output-available" ? (
                            <div className="text-green-600">
                                {output || (toolName === "display_diagram"
                                    ? "Diagram generated"
                                    : toolName === "edit_diagram"
                                    ? "Diagram edited"
                                    : "Tool executed")}
                            </div>
                        ) : state === "output-error" ? (
                            <div className="text-red-600">
                                {output || (toolName === "display_diagram"
                                    ? "Error generating diagram"
                                    : toolName === "edit_diagram"
                                    ? "Error editing diagram"
                                    : "Tool error")}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    };

    // New function to render an immediate tool preview when user sends a message
    const renderImmediateToolPreview = () => {
        const isWaiting = status === "submitted" || status === "streaming";

        if (!isWaiting || error) {
            return null;
        }

        return (
            <div className="p-4 my-2 text-gray-500 border border-gray-300 rounded" style={{ maxWidth: "300px" }}>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="text-xs">工具: send_message</div>
                    </div>
                    <div className="mt-2 text-sm">
                        <div className="flex items-center text-blue-600">
                            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                            正在生成，复杂专业图通常需要 10-60 秒...
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <ScrollArea className="h-full pr-4">
            {messages.length === 0 ? (
                <ExamplePanel setInput={setInput} setFiles={setFiles} />
            ) : (
                messages.map((message) => (
                    <div
                        key={message.id}
                        className={`mb-4 ${
                            message.role === "user" ? "text-right" : "text-left"
                        }`}
                    >
                        <div
                            className={`inline-block px-4 py-2 text-sm rounded-lg max-w-[300px] overflow-x-auto ${
                                message.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground w-full"
                            }`}
                            style={{ maxWidth: "300px" }}
                        >
                            {message.parts?.map((part: any, index: number) => {
                                switch (part.type) {
                                    case "text":
                                        return (
                                            <div 
                                                key={index} 
                                                className="whitespace-pre-wrap break-all"
                                            >
                                                {part.text}
                                            </div>
                                        );
                                    case "file":
                                        return (
                                            <div key={index} className="mt-2">
                                                <Image
                                                    src={part.url}
                                                    width={200}
                                                    height={200}
                                                    alt={`file-${index}`}
                                                    className="rounded-md border"
                                                    style={{
                                                        objectFit: "contain",
                                                    }}
                                                />
                                            </div>
                                        );
                                    default:
                                        if (part.type?.startsWith("tool-")) {
                                            return renderToolPart(part);
                                        }
                                        return null;
                                }
                            })}
                        </div>
                        {/* Show immediate tool preview for the last user message */}
                            {message.role === "user" && 
                             messages[messages.length - 1]?.id === message.id && 
                             renderImmediateToolPreview()}
                    </div>
                ))
            )}
            {error && (
                <div className="text-red-500 text-sm mt-2">
                    生成失败：{error.message || "请求超时或模型服务无响应，请稍后重试。"}
                </div>
            )}
            <div ref={messagesEndRef} />
        </ScrollArea>
    );
}
