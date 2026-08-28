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
            <CardFooter className="p-2">
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
