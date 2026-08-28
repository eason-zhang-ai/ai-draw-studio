"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

const DEFAULT_DEFINITION = `graph TB
    %% ===== 房顶部分：用户接入层 =====
    Web[🌐 Web界面]:::roof
    App[📱 移动App]:::roof
    API[🔌 API接口]:::roof
    
    %% ===== 房顶装饰 =====
    Roof1[╱]:::roofDec
    Roof2[╲]:::roofDec
    
    %% ===== 二层：AI服务层（主卧室） =====
    subgraph "🏠 AI服务层"
        LLM[🧠 大语言模型<br/>GPT/LLaMA]:::aiService
        Agent[🤖 智能体框架<br/>LangChain]:::aiService
    end
    
    %% ===== 三层：数据处理层（客厅） =====
    subgraph "📊 数据处理层"
        VectorDB[🗃️ 向量数据库<br/>Pinecone]:::data
        RAG[🔍 RAG检索]:::data
    end
    
    %% ===== 四层：模型层（书房） =====
    subgraph "📚 模型管理层"
        ModelHub[🔄 模型仓库<br/>HuggingFace]:::model
        FineTune[🎯 模型微调]:::model
    end
    
    %% ===== 底层：基础设施（地基） =====
    subgraph "⚡ 基础设施层"
        GPU[🎮 GPU集群]:::infra
        K8S[🐳 Kubernetes]:::infra
    end
    
    %% ===== 左右窗户：监控评估 =====
    PromptStudio[💡 Prompt工作室]:::window
    Eval[📈 模型评估]:::window
    
    %% ===== 烟囱：外部数据 =====
    External[🌐 外部数据源]:::chimney
    
    %% ===== 房屋结构连接 =====
    %% 房顶
    Web --> Roof1
    App --> Roof1
    API --> Roof2
    Roof1 --> LLM
    Roof2 --> LLM
    
    %% 楼层连接
    LLM --> Agent
    Agent --> VectorDB
    Agent --> RAG
    VectorDB --> ModelHub
    RAG --> ModelHub
    ModelHub --> FineTune
    FineTune --> GPU
    FineTune --> K8S
    
    %% 窗户连接
    LLM --> PromptStudio
    LLM --> Eval
    
    %% 烟囱连接
    External --> VectorDB
    External --> ModelHub
    
    %% ===== 样式定义 =====
    classDef roof fill:#ff6b6b,stroke:#c44569,stroke-width:3px,color:white
    classDef roofDec fill:#ff6b6b,stroke:#c44569,stroke-width:1px,color:white
    classDef aiService fill:#74b9ff,stroke:#0984e3,stroke-width:2px,color:white
    classDef data fill:#55efc4,stroke:#00b894,stroke-width:2px,color:black
    classDef model fill:#ffeaa7,stroke:#fdcb6e,stroke-width:2px,color:black
    classDef infra fill:#dfe6e9,stroke:#b2bec3,stroke-width:2px,color:black
    classDef window fill:#a29bfe,stroke:#6c5ce7,stroke-width:2px,color:white
    classDef chimney fill:#636e72,stroke:#2d3436,stroke-width:2px,color:white

    %% ===== 房屋装饰元素 =====
    %% 门
    Door[🚪 MLOps平台]:::infra
    K8S --> Door
    
    %% 花园
    Garden1[🌱 数据清洗]:::window
    Garden2[🌿 文档处理]:::window
    VectorDB --> Garden1
    RAG --> Garden2
`;

export interface MermaidHistoryEntry {
    id: string;
    definition: string;
    summary?: string;
    createdAt: number;
}

interface MermaidContextValue {
    definition: string;
    history: MermaidHistoryEntry[];
    updateDefinition: (definition: string, summary?: string) => void;
    setDefinition: (definition: string) => void;
    clearDefinition: () => void;
    initialDefinition: string;
}

const MermaidContext = createContext<MermaidContextValue | undefined>(
    undefined
);

function createHistoryEntry(
    definition: string,
    summary?: string
): MermaidHistoryEntry {
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

export function MermaidProvider({ children }: { children: React.ReactNode }) {
    const [definition, setDefinitionState] = useState(DEFAULT_DEFINITION);
    const [history, setHistory] = useState<MermaidHistoryEntry[]>(() => [
        createHistoryEntry(DEFAULT_DEFINITION, "Initial sample diagram"),
    ]);

    const updateDefinition = useCallback(
        (nextDefinition: string, summary?: string) => {
            if (!nextDefinition.trim()) return;
            setDefinitionState(nextDefinition);
            setHistory((prev) => [
                ...prev,
                createHistoryEntry(nextDefinition, summary),
            ]);
        },
        []
    );

    const setDefinition = useCallback((nextDefinition: string) => {
        setDefinitionState(nextDefinition);
    }, []);

    const clearDefinition = useCallback(() => {
        setDefinitionState(DEFAULT_DEFINITION);
        setHistory([
            createHistoryEntry(DEFAULT_DEFINITION, "Diagram reset"),
        ]);
    }, []);

    const value = useMemo(
        () => ({
            definition,
            history,
            updateDefinition,
            setDefinition,
            clearDefinition,
            initialDefinition: DEFAULT_DEFINITION,
        }),
        [definition, history, updateDefinition, setDefinition, clearDefinition]
    );

    return (
        <MermaidContext.Provider value={value}>
            {children}
        </MermaidContext.Provider>
    );
}

export function useMermaid() {
    const context = useContext(MermaidContext);
    if (!context) {
        throw new Error("useMermaid must be used within a MermaidProvider");
    }
    return context;
}
