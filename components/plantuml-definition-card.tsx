"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {ClipboardCopy, ClipboardCheck, RefreshCcw, ChevronsDown, ChevronsUp, Copy} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlantUMLDefinitionCardProps {
    definition: string;
    onDefinitionChange?: (definition: string) => void;
    onReset?: () => void;
    isCollapsed?: boolean;
    onToggle?: () => void;
}

export function PlantUMLDefinitionCard({
    definition,
    onDefinitionChange,
    onReset,
    isCollapsed,
    onToggle,
}: PlantUMLDefinitionCardProps) {
    const [copied, setCopied] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(timer);
    }, [copied]);

    const handleCopy = async () => {
        if (!definition) return;
        await copyToClipboard(definition);
        setCopied(true);
    };
    
    const handleReset = () => {
        if (onReset) {
            setIsResetting(true);
            onReset();
            // 添加一个短暂的延迟来显示重置动画效果
            setTimeout(() => setIsResetting(false), 300);
        }
    };

    return (
        <div className="bg-white rounded-lg border shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
                <div>
                    <p className="text-sm font-medium">PlantUML 定义</p>
                    <p className="text-xs text-muted-foreground">
                        由 <a href=" https://www.plantuml.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"> https://www.plantuml.com</a> 提供支持
                    </p>
                </div>
                <div className="flex gap-1 items-center">
                    {onToggle && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onToggle}
                            title="折叠"
                            aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
                        >
                            {isCollapsed ? (
                                <ChevronsUp className="h-4 w-4" />
                            ) : (
                                <ChevronsDown className="h-4 w-4" />
                            )}
                        </Button>
                    )}
                    {onReset && (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleReset}
                            title="重置"
                            disabled={!definition}
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
                    )}
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleCopy}
                        title="复制"
                        disabled={!definition}
                    >
                        {copied ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
            {!isCollapsed && (
                <div className="flex-1 bg-muted/10 flex flex-col overflow-hidden">
                    <Textarea
                        value={definition}
                        onChange={(event) => onDefinitionChange?.(event.target.value)}
                        placeholder="Describe a diagram or type PlantUML directly..."
                        className="flex-1 min-h-0 text-xs resize-none bg-white/70 focus-visible:ring-2 overflow-auto"
                        spellCheck={false}
                        disabled={!onDefinitionChange}
                    />
                </div>
            )}
        </div>
    );
}

/**
 * 安全复制文本到剪贴板（TypeScript 版本）
 * 兼容现代剪贴板 API 和降级方案
 * @param {string} text - 需要复制的文本
 * @returns {Promise<boolean>} - 是否复制成功
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        // 尝试使用现代剪贴板 API
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(text);
            return true;
        }

        // 降级兼容方案：使用 document.execCommand
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        const success = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (!success) {
            throw new Error('复制失败');
        }
        return true;
    } catch (error) {
        console.error('复制失败:', error);
        return false;
    }
};