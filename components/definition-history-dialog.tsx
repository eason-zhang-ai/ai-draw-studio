"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface DefinitionHistoryEntry {
    id: string;
    /** The definition / snippet to restore. */
    value: string;
    /** Optional one-line description of what produced this version. */
    summary?: string;
    createdAt?: number;
}

interface DefinitionHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    /** Syntax label for the preview block, e.g. "mermaid". */
    language?: string;
    entries: DefinitionHistoryEntry[];
    /** The value currently on the canvas, used to mark the active version. */
    currentValue?: string;
    onRestore: (value: string) => void;
}

function formatTime(ts?: number): string | null {
    if (!ts) return null;
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function preview(value: string, maxLines = 6, maxChars = 400): string {
    const lines = value.split("\n").slice(0, maxLines);
    let text = lines.join("\n");
    if (text.length > maxChars) text = text.slice(0, maxChars);
    if (lines.length < value.split("\n").length || text.length < value.length) {
        text += "\n…";
    }
    return text;
}

/**
 * Version history for the text-definition diagrams (Mermaid / PlantUML /
 * Kroki / Graphviz). These contexts snapshot the definition on every update,
 * so restoring simply replays a previous value.
 */
export function DefinitionHistoryDialog({
    open,
    onOpenChange,
    title,
    description = "每次更新都会保存一个版本，点击可恢复。",
    language,
    entries,
    currentValue,
    onRestore,
}: DefinitionHistoryDialogProps) {
    // Newest first — the most recent versions are what people reach for.
    const items = [...entries].reverse();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                        {entries.length > 0 ? ` 共 ${entries.length} 个版本。` : ""}
                    </DialogDescription>
                </DialogHeader>

                {entries.length === 0 ? (
                    <div className="text-center p-4 text-sm text-muted-foreground">
                        暂无历史版本。发送消息生成图表后即可在此切换。
                    </div>
                ) : (
                    <ScrollArea className="flex-grow min-h-0 pr-3">
                        <div className="space-y-2 py-2">
                            {items.map((item, index) => {
                                const versionNo = entries.length - index;
                                const isCurrent =
                                    currentValue !== undefined &&
                                    item.value === currentValue;
                                const time = formatTime(item.createdAt);
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            onRestore(item.value);
                                            onOpenChange(false);
                                        }}
                                        className={`w-full text-left border rounded-md p-3 transition-colors ${
                                            isCurrent
                                                ? "border-primary/60 bg-primary/5"
                                                : "hover:border-primary"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium">
                                                Version {versionNo}
                                                {isCurrent && (
                                                    <span className="ml-2 text-xs text-primary">
                                                        当前
                                                    </span>
                                                )}
                                            </span>
                                            {time && (
                                                <span className="text-xs text-muted-foreground">
                                                    {time}
                                                </span>
                                            )}
                                        </div>
                                        {item.summary && (
                                            <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                                {item.summary}
                                            </div>
                                        )}
                                        <pre
                                            className={`mt-2 max-h-24 overflow-hidden rounded bg-muted/50 p-2 text-[11px] leading-4 whitespace-pre-wrap break-all font-mono${
                                                language ? ` language-${language}` : ""
                                            }`}
                                        >
                                            {preview(item.value)}
                                        </pre>
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        关闭
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
