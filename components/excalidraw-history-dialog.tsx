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
import { useExcalidraw } from "@/contexts/excalidraw-context";

interface ExcalidrawHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ExcalidrawHistoryDialog({
    open,
    onOpenChange,
}: ExcalidrawHistoryDialogProps) {
    const { history, applyScene } = useExcalidraw();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>历史记录</DialogTitle>
                    <DialogDescription>
                        恢复本次会话期间生成的任何记录。
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
                    {history.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            尚无历史记录。
                        </p>
                    ) : (
                        history.map((entry) => (
                            <button
                                key={entry.id}
                                className="w-full text-left border rounded-md px-4 py-3 hover:border-primary transition-colors"
                                onClick={() => {
                                    applyScene(entry.scene, entry.summary, {
                                        skipHistory: true,
                                    });
                                    onOpenChange(false);
                                }}
                            >
                                <p className="text-sm font-medium">
                                    {entry.summary || "Snapshot"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(entry.createdAt).toLocaleString()}
                                </p>
                            </button>
                        ))
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        关闭
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
