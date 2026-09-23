import type { Metadata } from "next";
import { DiagramProvider } from "@/contexts/diagram-context";
import { ModelConfigProvider } from "@/contexts/model-config-context";
import { ExcalidrawProvider } from "@/contexts/excalidraw-context";
import { GraphvizProvider } from "@/contexts/graphviz-context";
import { KrokiProvider } from "@/contexts/kroki-context";
import { MermaidProvider } from "@/contexts/mermaid-context";
import { PlantUMLProvider } from "@/contexts/plantuml-context";
import "@excalidraw/excalidraw/index.css";

import "./globals.css";

export const metadata: Metadata = {
    title: "AI Smart Draw",
    description: "An AI-powered drawing tool that integrates with draw.io, Mermaid, PlantUML, Excalidraw and more",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                {/*
                 * Every canvas provider lives at the root, not inside its page.
                 * Mounting them per-page meant navigating between diagram modes
                 * unmounted the provider and wiped that canvas; here the state
                 * survives route changes.
                 */}
                <DiagramProvider>
                    <ModelConfigProvider>
                        <ExcalidrawProvider>
                            <MermaidProvider>
                                <PlantUMLProvider>
                                    <KrokiProvider>
                                        <GraphvizProvider>
                                            {children}
                                        </GraphvizProvider>
                                    </KrokiProvider>
                                </PlantUMLProvider>
                            </MermaidProvider>
                        </ExcalidrawProvider>
                    </ModelConfigProvider>
                </DiagramProvider>
            </body>
        </html>
    );
}
