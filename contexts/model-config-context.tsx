"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface ModelConfig {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    maxOutputTokens?: number;
}

export interface ModelProfile {
    id: string;
    name: string;
    config: ModelConfig;
}

interface ModelConfigContextValue {
    config: ModelConfig; // active profile config (backward compatible)
    profiles: ModelProfile[];
    activeProfileId: string;
    activeProfile: ModelProfile;
    setActiveProfile: (id: string) => void;
    setConfig: (value: ModelConfig) => void;
    updateConfig: (value: Partial<ModelConfig>) => void;
    createProfile: (name?: string) => void;
    renameProfile: (id: string, name: string) => void;
    deleteProfile: (id: string) => void;
    reset: () => void;
}

const STORAGE_KEY = "ai-model-config-v2";
const LEGACY_STORAGE_KEY = "ai-model-config";

export const defaultModelConfig: ModelConfig = {
    apiKey: "",
    baseUrl: "",
    model: "",
    maxOutputTokens: undefined,
};

const defaultProfile: ModelProfile = {
    id: "default",
    name: "默认配置",
    config: defaultModelConfig,
};

const ModelConfigContext = createContext<ModelConfigContextValue | undefined>(undefined);

function generateId() {
    return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadInitialModelConfig() {
    const fallback = {
        profiles: [defaultProfile],
        activeProfileId: defaultProfile.id,
    };

    if (typeof window === "undefined") {
        return fallback;
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as {
                profiles: ModelProfile[];
                activeProfileId: string;
            };
            if (parsed?.profiles?.length) {
                return {
                    profiles: parsed.profiles,
                    activeProfileId: parsed.activeProfileId || parsed.profiles[0].id,
                };
            }
        }

        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
            const parsedLegacy = JSON.parse(legacy) as ModelConfig;
            const migrated: ModelProfile = {
                ...defaultProfile,
                config: { ...defaultModelConfig, ...parsedLegacy },
            };
            return {
                profiles: [migrated],
                activeProfileId: migrated.id,
            };
        }
    } catch (error) {
        console.warn("Failed to load model config from storage", error);
    }

    return fallback;
}

export function ModelConfigProvider({ children }: { children: React.ReactNode }) {
    const [initialState] = useState(loadInitialModelConfig);
    const [profiles, setProfiles] = useState<ModelProfile[]>(initialState.profiles);
    const [activeProfileId, setActiveProfileId] = useState<string>(initialState.activeProfileId);

    // Persist to localStorage whenever profiles or activeProfileId changes
    useEffect(() => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ profiles, activeProfileId })
            );
        } catch (error) {
            console.warn("Failed to save model config to storage", error);
        }
    }, [profiles, activeProfileId]);

    const activeProfile = useMemo(() => {
        return profiles.find((p) => p.id === activeProfileId) || profiles[0];
    }, [profiles, activeProfileId]);

    const value = useMemo<ModelConfigContextValue>(() => {
        const updateProfileList = (updater: (prev: ModelProfile[]) => ModelProfile[]) => {
            setProfiles((prev) => updater(prev));
        };

        return {
            config: activeProfile?.config || defaultModelConfig,
            profiles,
            activeProfileId: activeProfile?.id || defaultProfile.id,
            activeProfile: activeProfile || defaultProfile,
            setActiveProfile: (id) => setActiveProfileId(id),
            setConfig: (value) => {
                updateProfileList((prev) =>
                    prev.map((p) =>
                        p.id === (activeProfile?.id || defaultProfile.id)
                            ? { ...p, config: value }
                            : p
                    )
                );
            },
            updateConfig: (value) => {
                updateProfileList((prev) =>
                    prev.map((p) =>
                        p.id === (activeProfile?.id || defaultProfile.id)
                            ? { ...p, config: { ...p.config, ...value } }
                            : p
                    )
                );
            },
            createProfile: (name) => {
                const newProfile: ModelProfile = {
                    id: generateId(),
                    name: name?.trim() || `配置${profiles.length + 1}`,
                    config: activeProfile?.config ? { ...activeProfile.config } : defaultModelConfig,
                };
                setProfiles((prev) => [...prev, newProfile]);
                setActiveProfileId(newProfile.id);
            },
            renameProfile: (id, name) => {
                const nextName = name.trim() || "未命名配置";
                updateProfileList((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, name: nextName } : p))
                );
            },
            deleteProfile: (id) => {
                if (profiles.length <= 1) return; // keep at least one profile
                const nextProfiles = profiles.filter((p) => p.id !== id);
                setProfiles(nextProfiles);
                if (id === activeProfileId) {
                    setActiveProfileId(nextProfiles[0].id);
                }
            },
            reset: () => {
                setProfiles([defaultProfile]);
                setActiveProfileId(defaultProfile.id);
            },
        };
    }, [activeProfile, activeProfileId, profiles]);

    return (
        <ModelConfigContext.Provider value={value}>
            {children}
        </ModelConfigContext.Provider>
    );
}

export function useModelConfig() {
    const ctx = useContext(ModelConfigContext);
    if (!ctx) {
        throw new Error("useModelConfig must be used within a ModelConfigProvider");
    }
    return ctx;
}
