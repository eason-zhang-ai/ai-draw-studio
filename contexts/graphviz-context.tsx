"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

// Default Graphviz definition
const DEFAULT_DEFINITION = `digraph code_structure {
    rankdir=TB;
    main -> parse -> execute;
    main -> init;
    main -> cleanup;
    execute -> make_string;
    execute -> printf;
    init -> make_string;
    main -> printf;
    execute -> compare;
}
`;

/** Keep the newest N versions — the history otherwise grows without bound. */
export const MAX_HISTORY_ENTRIES = 100;

export interface GraphvizHistoryEntry {
    id: string;
    definition: string;
    summary?: string;
    createdAt: number;
}

interface GraphvizContextType {
    definition: string;
    history: GraphvizHistoryEntry[];
    setDefinition: (definition: string) => void;
    defaultDefinition: string;
    clearDefinition: () => void;
    updateDefinition: (definition: string, summary?: string) => void;
}

const GraphvizContext = createContext<GraphvizContextType | undefined>(undefined);

function createHistoryEntry(
    definition: string,
    summary?: string
): GraphvizHistoryEntry {
    const id =
        typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return { id, definition, summary, createdAt: Date.now() };
}

function appendHistory(
    prev: GraphvizHistoryEntry[],
    definition: string,
    summary?: string
): GraphvizHistoryEntry[] {
    // Streaming re-submits the same definition many times — only record a
    // new version when the content actually changed.
    if (prev[prev.length - 1]?.definition === definition) return prev;
    return [...prev, createHistoryEntry(definition, summary)].slice(
        -MAX_HISTORY_ENTRIES
    );
}

export function GraphvizProvider({ children }: { children: React.ReactNode }) {
    const [definition, setDefinition] = useState<string>(DEFAULT_DEFINITION);
    const [history, setHistory] = useState<GraphvizHistoryEntry[]>(() => [
        createHistoryEntry(DEFAULT_DEFINITION, "Initial sample diagram"),
    ]);

    const clearDefinition = useCallback(() => {
        setDefinition(DEFAULT_DEFINITION);
        setHistory([createHistoryEntry(DEFAULT_DEFINITION, "Diagram reset")]);
    }, []);

    const updateDefinition = useCallback((newDefinition: string, summary?: string) => {
        if (!newDefinition.trim()) return;
        setDefinition(newDefinition);
        setHistory((prev) => appendHistory(prev, newDefinition, summary));
    }, []);

    const contextValue = useMemo(
        () => ({
            definition,
            history,
            setDefinition,
            defaultDefinition: DEFAULT_DEFINITION,
            clearDefinition,
            updateDefinition,
        }),
        [definition, history, clearDefinition, updateDefinition]
    );

    return (
        <GraphvizContext.Provider value={contextValue}>
            {children}
        </GraphvizContext.Provider>
    );
}

export function useGraphviz() {
    const context = useContext(GraphvizContext);
    if (context === undefined) {
        throw new Error("useGraphviz must be used within a GraphvizProvider");
    }
    return context;
}
