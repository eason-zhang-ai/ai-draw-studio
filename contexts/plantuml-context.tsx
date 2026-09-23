"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

import { PANEL_KEYS } from "@/lib/panel-storage";
import { usePersistedPanel } from "@/lib/use-persisted-panel";

const DEFAULT_SNIPPET = `@startjson
<style>
  .h1 {
    BackGroundColor green
    FontColor white
    FontStyle italic
  }
  .h2 {
    BackGroundColor red
    FontColor white
    FontStyle bold
  }
</style>
#highlight "lastName"
#highlight "address" / "city" <<h1>>
#highlight "phoneNumbers" / "0" / "number" <<h2>>
{
  "firstName": "John",
  "lastName": "Smith",
  "isAlive": true,
  "age": 28,
  "address": {
    "streetAddress": "21 2nd Street",
    "city": "New York",
    "state": "NY",
    "postalCode": "10021-3100"
  },
  "phoneNumbers": [
    {
      "type": "home",
      "number": "212 555-1234"
    },
    {
      "type": "office",
      "number": "646 555-4567"
    }
  ],
  "children": [],
  "spouse": null
}
@endjson
`;

interface PlantUMLHistoryEntry {
    id: string;
    definition: string;
    summary?: string;
    createdAt: number;
}

interface PlantUMLContextValue {
    definition: string;
    history: PlantUMLHistoryEntry[];
    updateDefinition: (definition: string, summary?: string) => void;
    setDefinition: (definition: string) => void;
    clearDefinition: () => void;
    initialDefinition: string;
}

const PlantUMLContext = createContext<PlantUMLContextValue | undefined>(
    undefined
);

/** 只保留最近 N 个版本，避免历史无限增长。 */
const MAX_HISTORY_ENTRIES = 100;

function createEntry(
    definition: string,
    summary?: string
): PlantUMLHistoryEntry {
    const id =
        typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return {
        id,
        definition,
        summary,
        createdAt: Date.now(),
    };
}

export function PlantUMLProvider({ children }: { children: React.ReactNode }) {
    const [definition, setDefinitionState] = useState(DEFAULT_SNIPPET);

    // 刷新后恢复上次的内容（IndexedDB）。
    usePersistedPanel<string>({
        storageKey: PANEL_KEYS.plantuml,
        value: definition,
        onRestore: (saved) => {
            if (saved) setDefinitionState(saved);
        },
    });
    const [history, setHistory] = useState<PlantUMLHistoryEntry[]>(() => [
        createEntry(DEFAULT_SNIPPET, "Initial snippet"),
    ]);

    const updateDefinition = useCallback(
        (nextDefinition: string, summary?: string) => {
            if (!nextDefinition.trim()) return;
            setDefinitionState(nextDefinition);
            setHistory((prev) => {
                // streaming 期间同一内容会被反复提交，只在内容变化时记一条
                if (prev[prev.length - 1]?.definition === nextDefinition) {
                    return prev;
                }
                return [...prev, createEntry(nextDefinition, summary)].slice(
                    -MAX_HISTORY_ENTRIES
                );
            });
        },
        []
    );

    const setDefinition = useCallback((nextDefinition: string) => {
        setDefinitionState(nextDefinition);
    }, []);

    const clearDefinition = useCallback(() => {
        setDefinitionState(DEFAULT_SNIPPET);
        setHistory([createEntry(DEFAULT_SNIPPET, "Snippet reset")]);
    }, []);

    const value = useMemo(
        () => ({
            definition,
            history,
            updateDefinition,
            setDefinition,
            clearDefinition,
            initialDefinition: DEFAULT_SNIPPET,
        }),
        [definition, history, updateDefinition, setDefinition, clearDefinition]
    );

    return (
        <PlantUMLContext.Provider value={value}>
            {children}
        </PlantUMLContext.Provider>
    );
}

export function usePlantUML() {
    const context = useContext(PlantUMLContext);
    if (!context) {
        throw new Error("usePlantUML must be used within PlantUMLProvider");
    }
    return context;
}
