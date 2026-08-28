"use client";

import React, { useEffect, useState } from "react";
import { ExcalidrawProvider } from "@/contexts/excalidraw-context";
import { ExcalidrawWorkspace } from "@/components/excalidraw-workspace";
import { CollapsibleChatPanel } from "@/components/collapsible-chat-panel";
import { ExcalidrawHistoryDialog } from "@/components/excalidraw-history-dialog";

export default function ExcalidrawPage() {
    const [isMobile, setIsMobile] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isChatCollapsed, setIsChatCollapsed] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    if (isMobile) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center p-8">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Please open this application on a desktop or laptop
                    </h1>
                </div>
            </div>
        );
    }

    return (
        <ExcalidrawProvider>
            <div className="flex h-screen bg-gray-100 overflow-hidden">
                <div className={`h-full p-1 transition-all duration-300 ${isChatCollapsed ? 'w-full' : 'w-3/4'}`}>
                    <ExcalidrawWorkspace
                        onRequestHistory={() => setShowHistory(true)}
                    />
                </div>
                <div className={`h-full p-1 transition-all duration-300 ${isChatCollapsed ? 'w-0' : 'w-1/4'}`}>
                    <CollapsibleChatPanel type="excalidraw" onCollapseChange={setIsChatCollapsed} />
                </div>
                <ExcalidrawHistoryDialog
                    open={showHistory}
                    onOpenChange={setShowHistory}
                />
            </div>
        </ExcalidrawProvider>
    );
}