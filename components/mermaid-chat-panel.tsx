"use client";

import type React from "react";
import { useState } from "react";
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
import { MermaidChatMessageDisplay } from "@/components/mermaid-chat-message-display";
import { useMermaid } from "@/contexts/mermaid-context";
import { ModeSelector } from "@/components/mode-selector";
import { ModelConfigDialog } from "@/components/model-config-dialog";
import { useModelConfig } from "@/contexts/model-config-context";

// Quick actions for the current diagram, aligned with the mermaid2img
// skill hub guidance (preview refinement + architecture review).
const QUICK_ACTIONS = [
    {
        label: "适配移动端",
        prompt:
            "图太宽了，帮我适配移动端竖屏（约 390px 宽）：优先调整布局方向与结构，不要缩小字体。",
    },
    {
        label: "优化可读性",
        prompt:
            "请优化这张图的可读性：按「方向 → 标签 → 分组 → 重排 → 拆图 → 换型 → 样式」的顺序做最小结构修改，不要用缩小字体或加颜色掩盖结构问题。",
    },
    {
        label: "架构审查",
        prompt:
            "请对当前图做一次架构审查：检查系统边界、数据归属、组件读写、人工批准、正常/失败路径，区分事实与推测；先简要列出发现，再给出改进后的图。",
    },
];

export default function MermaidChatPanel() {
    const { definition, clearDefinition } = useMermaid();
    const [files, setFiles] = useState<File[]>([]);
    const [input, setInput] = useState("");
    const { config: modelConfig } = useModelConfig();

    const { messages, sendMessage, addToolResult, status, error, setMessages } =
        useChat({
            transport: new DefaultChatTransport({
                api: "/api/mermaid",
            }),
            async onToolCall({ toolCall }) {
                if (toolCall.toolName === "display_mermaid") {
                    addToolResult({
                        tool: "display_mermaid",
                        toolCallId: toolCall.toolCallId,
                        output: "生成完成.",
                    });
                }
            },
        });

    const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || status === "streaming") return;

        try {
            const parts: any[] = [{ type: "text", text: input }];

            if (files.length > 0) {
                for (const file of files) {
                    const reader = new FileReader();
                    const dataUrl = await new Promise<string>((resolve) => {
                        reader.onload = () => resolve(reader.result as string);
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
                        definition,
                        modelConfig,
                    },
                }
            );

            setInput("");
            setFiles([]);
        } catch (err) {
            console.error("Failed to submit Mermaid prompt:", err);
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setInput(e.target.value);
    };

    const handleFileChange = (newFiles: File[]) => {
        setFiles(newFiles);
    };

    return (
        <Card className="h-full flex flex-col rounded-none py-0 gap-0 overflow-hidden">
            <CardHeader className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2 items-center">
                        <ModeSelector active="mermaid" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden px-2">
                <MermaidChatMessageDisplay
                    messages={messages}
                    error={error}
                    setInput={setInput}
                    setFiles={handleFileChange}
                />
            </CardContent>
            <CardFooter className="p-2 flex flex-col items-stretch gap-1">
                {definition?.trim() && (
                    <div className="flex flex-wrap gap-1.5 px-1">
                        {QUICK_ACTIONS.map((action) => (
                            <button
                                key={action.label}
                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-2 rounded"
                                onClick={() => setInput(action.prompt)}
                                title={action.prompt}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
                <ChatInput
                    input={input}
                    status={status}
                    onSubmit={onFormSubmit}
                    onChange={handleInputChange}
                    onClearChat={() => {
                        setMessages([]);
                        clearDefinition();
                    }}
                    files={files}
                    onFileChange={handleFileChange}
                    enableHistoryControls={false}
                />
            </CardFooter>
        </Card>
    );
}
