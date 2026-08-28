"use client";

import React, { useCallback, useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResetWarningModal } from "@/components/reset-warning-modal";
import {
    Loader2,
    Send,
    RotateCcw,
    Image as ImageIcon,
    History,
} from "lucide-react";
import { ButtonWithTooltip } from "@/components/button-with-tooltip";
import { FilePreviewList } from "./file-preview-list";

interface ChatInputProps {
    input: string;
    status: "submitted" | "streaming" | "ready" | "error";
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onClearChat: () => void;
    files?: File[];
    onFileChange?: (files: File[]) => void;
    onRequestHistory?: () => void;
    historyAvailable?: boolean;
    enableHistoryControls?: boolean;
    historyTooltip?: string;
}

export function ChatInput({
    input,
    status,
    onSubmit,
    onChange,
    onClearChat,
    files = [],
    onFileChange = () => {},
    onRequestHistory = () => {},
    historyAvailable = false,
    enableHistoryControls = true,
    historyTooltip = "View diagram history",
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const isBusy = status === "submitted" || status === "streaming";

    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, []);

    useEffect(() => {
        adjustTextareaHeight();
    }, [input, adjustTextareaHeight]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            const form = e.currentTarget.closest("form");
            if (form && input.trim() && !isBusy) {
                form.requestSubmit();
            }
        }
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        if (isBusy) return;

        const items = e.clipboardData.items;
        const imageItems = Array.from(items).filter((item) =>
            item.type.startsWith("image/")
        );

        if (imageItems.length > 0) {
            const imageFiles = await Promise.all(
                imageItems.map(async (item) => {
                    const file = item.getAsFile();
                    if (!file) return null;
                    return new File(
                        [file],
                        `pasted-image-${Date.now()}.${file.type.split("/")[1]}`,
                        {
                            type: file.type,
                        }
                    );
                })
            );

            const validFiles = imageFiles.filter(
                (file): file is File => file !== null
            );
            if (validFiles.length > 0) {
                onFileChange([...files, ...validFiles]);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        onFileChange([...files, ...newFiles]);
    };

    const handleRemoveFile = (fileToRemove: File) => {
        onFileChange(files.filter((file) => file !== fileToRemove));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleDragOver = (e: React.DragEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (isBusy) return;

        const droppedFiles = e.dataTransfer.files;
        const imageFiles = Array.from(droppedFiles).filter((file) =>
            file.type.startsWith("image/")
        );

        if (imageFiles.length > 0) {
            onFileChange([...files, ...imageFiles]);
        }
    };

    const handleClear = () => {
        onClearChat();
        setShowClearDialog(false);
    };

    return (
        <form
            onSubmit={onSubmit}
            className={`w-full space-y-2 ${
                isDragging
                    ? "border-2 border-dashed border-primary p-4 rounded-lg bg-muted/20"
                    : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <FilePreviewList files={files} onRemoveFile={handleRemoveFile} />

            <Textarea
                ref={textareaRef}
                value={input}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="描述您需要的图表修改内容，或粘贴/上传图片进行复制。按Cmd/Ctrl+Enter键发送。"
                disabled={isBusy}
                aria-label="Chat input"
                className="min-h-[80px] resize-none transition-all duration-200 px-1 py-0"
            />

            <div className="flex items-center gap-2">
                <div className="mr-auto flex items-center gap-2">
                    <ButtonWithTooltip
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowClearDialog(true)}
                        tooltipContent="清除当前对话和画布"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                    </ButtonWithTooltip>

                    <ResetWarningModal
                        open={showClearDialog}
                        onOpenChange={setShowClearDialog}
                        onClear={handleClear}
                    />

                    {enableHistoryControls && (
                        <ButtonWithTooltip
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={onRequestHistory}
                            disabled={isBusy || !historyAvailable}
                            tooltipContent={historyTooltip}
                        >
                            <History className="h-4 w-4" />
                        </ButtonWithTooltip>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={triggerFileInput}
                        disabled={isBusy}
                        title="Upload reference image"
                    >
                        <ImageIcon className="h-4 w-4" />
                    </Button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                        disabled={isBusy}
                    />
                </div>

                <Button
                    type="submit"
                    disabled={isBusy || !input.trim()}
                    className="transition-opacity"
                    aria-label={
                        isBusy
                            ? "Sending message..."
                            : "Send message"
                    }
                >
                    {isBusy ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="mr-2 h-4 w-4" />
                    )}
                    发送
                </Button>
            </div>
        </form>
    );
}
