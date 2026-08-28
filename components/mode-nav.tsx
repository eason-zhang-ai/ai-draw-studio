"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Mode = "drawio" | "mermaid" | "plantuml" | "excalidraw" | "kroki" | "graphviz";

const modes: { label: string; href: string; id: Mode }[] = [
    { id: "drawio", label: "Draw.io", href: "/" },
    { id: "mermaid", label: "Mermaid", href: "/mermaid" },
    { id: "plantuml", label: "PlantUML", href: "/plantuml" },
    { id: "excalidraw", label: "Excalidraw", href: "/excalidraw" },
    { id: "kroki", label: "Kroki", href: "/kroki" },
    { id: "graphviz", label: "Graphviz", href: "/graphviz" },
];

interface ModeNavProps {
    active: Mode;
    className?: string;
}

export function ModeNav({ active, className }: ModeNavProps) {
    const getModeColor = (mode: Mode) => {
        switch (mode) {
            case "drawio":
                return "bg-blue-500 hover:bg-blue-600 text-white border-blue-600";
            case "mermaid":
                return "bg-green-500 hover:bg-green-600 text-white border-green-600";
            case "plantuml":
                return "bg-purple-500 hover:bg-purple-600 text-white border-purple-600";
            case "excalidraw":
                return "bg-orange-500 hover:bg-orange-600 text-white border-orange-600";
            case "kroki":
                return "bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-600";
            case "graphviz":
                return "bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-600";
            default:
                return "bg-gray-500 hover:bg-gray-600 text-white border-gray-600";
        }
    };

    return (
        <div
            className={cn(
                "flex flex-wrap gap-1 pointer-events-auto",
                className ?? "fixed top-4 right-4 z-50"
            )}
        >
            {modes.map((mode) => {
                const isActive = mode.id === active;
                if (isActive) {
                    return (
                        <span
                            key={mode.id}
                            className={cn(
                                "px-1 py-1 text-sm rounded-md border shadow font-medium",
                                getModeColor(mode.id),
                                "brightness-125"
                            )}
                        >
                            {mode.label}
                        </span>
                    );
                }
                return (
                    <Link
                        key={mode.id}
                        href={mode.href}
                        className={cn(
                            "px-1 py-1 text-sm rounded-md border shadow bg-white transition-all duration-200 font-medium",
                            getModeColor(mode.id)
                        )}
                    >
                        {mode.label}
                    </Link>
                );
            })}
        </div>
    );
}