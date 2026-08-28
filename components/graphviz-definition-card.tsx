"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {ClipboardCopy, ClipboardCheck, RefreshCcw, ChevronsDown, ChevronsUp, Copy} from "lucide-react";
import { copyToClipboard } from "@/components/plantuml-definition-card";
import { cn } from "@/lib/utils";

interface GraphvizDefinitionCardProps {
    definition: string;
    onChange: (value: string) => void;
    onClear: () => void;
    defaultDefinition: string;
    isCollapsed?: boolean;
    onToggle?: () => void;
}

export function GraphvizDefinitionCard({
    definition,
    onChange,
    onClear,
    defaultDefinition,
    isCollapsed,
    onToggle,
}: GraphvizDefinitionCardProps) {
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
        setIsResetting(true);
        onChange(defaultDefinition);
        // 添加一个短暂的延迟来显示重置动画效果
        setTimeout(() => setIsResetting(false), 300);
    };

    return (
        <div className="bg-white rounded-lg border shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
                <div>
                    <p className="text-sm font-medium">Graphviz 定义</p>
                    <p className="text-xs text-muted-foreground">
                        由 <a href="https://www.graphviz.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.graphviz.org</a> 提供支持
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
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        title="重置"
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
                        variant="outline"
                        size="sm"
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
                        onChange={(event) => onChange(event.target.value)}
                        placeholder="Enter Graphviz definition (digraph, graph, etc.)..."
                        className="flex-1 min-h-0 text-xs resize-none bg-white/70 focus-visible:ring-2 overflow-auto font-mono"
                        spellCheck={false}
                    />
                </div>
            )}
        </div>
    );
}