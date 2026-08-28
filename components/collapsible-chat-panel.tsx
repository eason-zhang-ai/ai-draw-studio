"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Github } from "lucide-react";
import { ModelConfigDialog } from "@/components/model-config-dialog";
import { cn } from "@/lib/utils";

type PanelType = "drawio" | "excalidraw" | "mermaid" | "plantuml" | "kroki" | "graphviz";

interface CollapsibleChatPanelProps {
  type: PanelType;
  className?: string;
  onCollapseChange?: (collapsed: boolean) => void;
}

const ChatPanel = dynamic(() => import("@/components/chat-panel"), {
  loading: () => <PanelLoading />,
});
const ExcalidrawChatPanel = dynamic(() => import("@/components/excalidraw-chat-panel"), {
  loading: () => <PanelLoading />,
});
const MermaidChatPanel = dynamic(() => import("@/components/mermaid-chat-panel"), {
  loading: () => <PanelLoading />,
});
const PlantUMLChatPanel = dynamic(() => import("@/components/plantuml-chat-panel"), {
  loading: () => <PanelLoading />,
});
const KrokiChatPanel = dynamic(() => import("@/components/kroki-chat-panel"), {
  loading: () => <PanelLoading />,
});
const GraphvizChatPanel = dynamic(() => import("@/components/graphviz-chat-panel"), {
  loading: () => <PanelLoading />,
});

function PanelLoading() {
  return (
    <div className="h-full rounded-none border bg-white p-4">
      <div className="h-8 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-6 space-y-3">
        <div className="h-12 animate-pulse rounded bg-muted/70" />
        <div className="h-12 w-5/6 animate-pulse rounded bg-muted/70" />
      </div>
    </div>
  );
}

export function CollapsibleChatPanel({ 
  type,
  className = "",
  onCollapseChange
}: CollapsibleChatPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  const renderChatPanel = () => {
    switch (type) {
      case "drawio":
        return <ChatPanel />;
      case "excalidraw":
        return <ExcalidrawChatPanel />;
      case "mermaid":
        return <MermaidChatPanel />;
      case "plantuml":
        return <PlantUMLChatPanel />;
      case "kroki":
        return <KrokiChatPanel />;
      case "graphviz":
        return <GraphvizChatPanel />;
      default:
        return <ChatPanel />;
    }
  };

  return (
    <>
      {/* Floating AI button shown when panel is collapsed */}
      {isCollapsed && (
        <div className={cn("absolute right-4 top-20 z-50", className)}>
          <Button
            onClick={() => setIsCollapsed(false)}
            className="rounded-full shadow-lg h-12 w-12 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            size="icon"
            title="打开聊天区"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Main panel container - always rendered but visibility controlled by CSS */}
      <div 
        className={cn("flex h-full relative overflow-hidden", className)}
        style={{ 
          display: isCollapsed ? 'none' : 'flex',
          position: 'relative'
        }}
      >
        <div className="flex-1 h-full">
          {renderChatPanel()}
        </div>
        <div className="absolute right-2 top-4 z-50 flex gap-1">
          <ModelConfigDialog size="sm" />
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 h-8 px-2"
            title="GitHub shenpeiheng"
            onClick={() => window.open('https://github.com/shenpeiheng/ai-smart-draw', '_blank')}
          >
            <Github className="h-4 w-4" />
            {/*<span className="hidden sm:inline">GitHub</span>*/}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 h-8 px-2"
            title="关闭聊天区"
            onClick={() => setIsCollapsed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
