"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

type Mode = "drawio" | "mermaid" | "plantuml" | "excalidraw" | "kroki" | "graphviz";

const modes: { label: string; value: Mode; href: string }[] = [
  { value: "drawio", label: "Draw.io", href: "/" },
  { value: "mermaid", label: "Mermaid", href: "/mermaid" },
  { value: "plantuml", label: "PlantUML", href: "/plantuml" },
  { value: "excalidraw", label: "Excalidraw", href: "/excalidraw" },
  { value: "kroki", label: "Kroki", href: "/kroki" },
  { value: "graphviz", label: "Graphviz", href: "/graphviz" },
];

interface ModeSelectorProps {
  active: Mode;
}

export function ModeSelector({ active }: ModeSelectorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleChange = (value: string) => {
    const mode = modes.find((m) => m.value === value);
    if (mode) {
      setIsLoading(true);
      // 使用setTimeout让UI更新显示加载状态
      setTimeout(() => {
        router.push(mode.href);
        // 不要在这里设置setIsLoading(false)，因为页面会卸载
      }, 0);
    }
  };

  const activeMode = modes.find((m) => m.value === active);

  return (
    <div className="relative">
      <Select value={active} onValueChange={handleChange} disabled={isLoading}>
        <SelectTrigger className={`w-[120px] h-8 text-sm ${isLoading ? 'opacity-50' : ''}`}>
          <SelectValue>{activeMode?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {modes.map((mode) => (
            <SelectItem key={mode.value} value={mode.value}>
              {mode.label}
            </SelectItem>
        ))}
        </SelectContent>
      </Select>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}