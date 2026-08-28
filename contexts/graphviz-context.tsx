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

interface GraphvizContextType {
    definition: string;
    setDefinition: (definition: string) => void;
    defaultDefinition: string;
    clearDefinition: () => void;
    updateDefinition: (definition: string, summary?: string) => void;
}

const GraphvizContext = createContext<GraphvizContextType | undefined>(undefined);

export function GraphvizProvider({ children }: { children: React.ReactNode }) {
    const [definition, setDefinition] = useState<string>(DEFAULT_DEFINITION);

    const clearDefinition = useCallback(() => {
        setDefinition(DEFAULT_DEFINITION);
    }, []);

    const updateDefinition = useCallback((newDefinition: string, summary?: string) => {
        setDefinition(newDefinition);
    }, []);

    const contextValue = useMemo(
        () => ({
            definition,
            setDefinition,
            defaultDefinition: DEFAULT_DEFINITION,
            clearDefinition,
            updateDefinition,
        }),
        [definition, clearDefinition, updateDefinition]
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