"use client";

import type React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import ExamplePanel from "./chat-example-panel";
import { UIMessage } from "ai";
import { usePlantUML } from "@/contexts/plantuml-context";

interface PlantUMLChatMessageDisplayProps {
    messages: UIMessage[];
    error?: Error | null;
    setInput: (input: string) => void;
    setFiles: (files: File[]) => void;
}

export function PlantUMLChatMessageDisplay({
    messages,
    error,
    setInput,
    setFiles,
}: PlantUMLChatMessageDisplayProps) {
    const { updateDefinition } = usePlantUML();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const processedToolCalls = useRef<Set<string>>(new Set());
    const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>(
        {}
    );

    const handleDisplay = useCallback(
        (definition: string, summary?: string) => {
            updateDefinition(definition, summary);
        },
        [updateDefinition]
    );

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        messages.forEach((message) => {
            message.parts?.forEach((part: any) => {
                if (typeof part?.type !== "string") return;
                if (!part.type.startsWith("tool-")) return;

                const { toolCallId, state } = part;

                if (state === "output-available") {
                    setExpandedTools((prev) => ({
                        ...prev,
                        [toolCallId]: false,
                    }));
                }

                if (
                    part.type === "tool-display_plantuml" &&
                    part.input?.definition
                ) {
                    if (state === "input-streaming") {
                        handleDisplay(part.input.definition, part.input.summary);
                    } else if (
                        state === "output-available" &&
                        !processedToolCalls.current.has(toolCallId)
                    ) {
                        handleDisplay(part.input.definition, part.input.summary);
                        processedToolCalls.current.add(toolCallId);
                    }
                }
            });
        });
    }, [messages, handleDisplay]);

    const renderToolPart = (part: any) => {
        const callId = part.toolCallId;
        const { state, input, output } = part;
        const isExpanded = expandedTools[callId] ?? false;
        const toolName = part.type?.replace("tool-", "");

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
                                onClick={() =>
                                    setExpandedTools((prev) => ({
                                        ...prev,
                                        [callId]: !isExpanded,
                                    }))
                                }
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
                                {output || "Diagram generated"}
                            </div>
                        ) : state === "output-error" ? (
                            <div className="text-red-600">
                                {output || "Tool error"}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    };

    // New function to render an immediate tool preview when user sends a message
    const renderImmediateToolPreview = () => {
        return (
            <div className="p-4 my-2 text-gray-500 border border-gray-300 rounded" style={{ maxWidth: "300px" }}>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="text-xs">工具: send_message</div>
                    </div>
                    <div className="mt-2 text-sm">
                        <div className="flex items-center text-blue-600">
                            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                            正在努力生成回答请稍候...
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
                                            <div key={index}>{part.text}</div>
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
                    Error: {error.message}
                </div>
            )}
            <div ref={messagesEndRef} />
        </ScrollArea>
    );
}