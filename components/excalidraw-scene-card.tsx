"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    ClipboardCopy,
    ClipboardCheck,
    RefreshCcw,
    ChevronsDown,
    ChevronsUp,
    Copy,
    BookCopy,
    CopySlash, CopyX, CopyMinus, AlarmClockCheck, Airplay
} from "lucide-react";
import { useExcalidraw } from "@/contexts/excalidraw-context";
import {copyToClipboard} from "@/components/plantuml-definition-card";
import { cn } from "@/lib/utils";

interface Props {
    onClear: () => void;
    onHistory: () => void;
    historyDisabled?: boolean;
    isCollapsed?: boolean;
    onToggle?: () => void;
}

export function ExcalidrawSceneCard({ onClear, onHistory, historyDisabled, isCollapsed, onToggle }: Props) {
    const { sceneData, sceneDraft, setSceneDraft, applyScene } = useExcalidraw();
    const [draft, setDraft] = useState(sceneDraft ?? sceneData);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        setDraft(sceneDraft ?? sceneData);
    }, [sceneData, sceneDraft]);

    useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(timer);
    }, [copied]);

    const handleApply = () => {
        try {
            JSON.parse(draft);
            applyScene(draft, "手动编辑");
            setError(null);
            setSceneDraft(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    const handleFormat = () => {
        try {
            const formatted = JSON.stringify(JSON.parse(draft), null, 2);
            setDraft(formatted);
            setError(null);
            setSceneDraft(formatted);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    const handleCopy = async () => {
        if (!draft) return;
        try {
            await copyToClipboard(draft);
            setCopied(true);
        } catch (e) {
            console.warn("Copy failed", e);
        }
    };
    
    const handleReset = () => {
        setIsResetting(true);
        onClear();
        // 添加一个短暂的延迟来显示重置动画效果
        setTimeout(() => setIsResetting(false), 300);
    };

    return (
        <div className="bg-white rounded-lg border shadow-sm flex flex-col h-full">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b bg-muted/50">
                <div>
                    <p className="text-sm font-medium">Excalidraw 定义</p>
                    <p className="text-xs text-muted-foreground">
                        由 <a href="https://excalidraw.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://excalidraw.com</a> 提供支持
                    </p>
                </div>
                <div className="flex gap-1 flex-wrap items-center">
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
                    <Button 
                        type="button" 
                        size="sm" 
                        title="重置" 
                        variant="outline" 
                        onClick={handleReset}
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
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleCopy}
                        title="复制"
                        disabled={!draft}
                    >
                        {copied ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onHistory}
                        title="历史记录"
                        disabled={historyDisabled}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        title="格式化"
                        onClick={handleFormat}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M16 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
                            <path d="M10 5v4a2 2 0 0 0 2 2h2" />
                            <path d="M10 9h4" />
                            <path d="M8 15h8" />
                            <path d="M8 19h8" />
                        </svg>
                    </Button>
                    <Button type="button" size="sm" title="应用" onClick={handleApply} variant="outline">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </Button>
                </div>
            </div>
            {!isCollapsed && (
                <div className="flex-1 bg-muted/10 flex flex-col overflow-hidden">
                    <Textarea
                        value={draft}
                        onChange={(event) => {
                            setDraft(event.target.value);
                            setSceneDraft(event.target.value);
                        }}
                        spellCheck={false}
                        className="flex-1 min-h-0 text-xs font-mono resize-none bg-white/80 focus-visible:ring-2 overflow-auto"
                        placeholder="粘贴或编辑 Excalidraw 场景 JSON..."
                    />
                    {error && (
                        <p className="text-xs text-destructive p-1">
                            解析失败：{error}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}