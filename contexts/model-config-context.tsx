"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface ModelConfig {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    /** Whether the configured model accepts image (vision) input. False = image upload disabled. */
    visionEnabled?: boolean;
    maxOutputTokens?: number;
    /** Reasoning effort: none | minimal | low | medium | high. Empty = endpoint default. */
    thinkingLevel?: string;
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
    createProfile: (name?: string, configPatch?: Partial<ModelConfig>) => void;
    renameProfile: (id: string, name: string) => void;
    deleteProfile: (id: string) => void;
    reset: () => void;
}

const STORAGE_KEY = "ai-model-config-v3";
const LEGACY_STORAGE_KEY = "ai-model-config-v2"; // profiles array, visionEnabled era
const LEGACY_STORAGE_KEY_V1 = "ai-model-config"; // single config, visionModel era

export const defaultModelConfig: ModelConfig = {
    apiKey: "",
    baseUrl: "",
    model: "",
    // undefined = "not set explicitly" → falls back to the server default
    // (env AI_MODEL_SUPPORTS_VISION).
    visionEnabled: undefined,
    maxOutputTokens: undefined,
    thinkingLevel: "",
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

/**
 * One-off migration from older schemas. A stored `visionEnabled: false` was
 * the previous HARD-CODED default (not a deliberate user choice), so it is
 * reset to `undefined` to fall back to the server env default
 * (AI_MODEL_SUPPORTS_VISION). An explicit `true` is kept.
 */
function migrateVision(config?: ModelConfig): ModelConfig {
    const next: ModelConfig = { ...(config || defaultModelConfig) };
    if (next.visionEnabled === false) next.visionEnabled = undefined;
    // v1 era stored `visionModel` (a string); it no longer exists.
    delete (next as Record<string, unknown>).visionModel;
    return next;
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
        // v3 (current)
        const current = localStorage.getItem(STORAGE_KEY);
        if (current) {
            const parsed = JSON.parse(current) as {
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

        // v2 → v3 (profiles array; may carry the old hard-coded false)
        const v2 = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (v2) {
            const parsed = JSON.parse(v2) as {
                profiles: ModelProfile[];
                activeProfileId: string;
            };
            if (parsed?.profiles?.length) {
                return {
                    profiles: parsed.profiles.map((p) => ({
                        ...p,
                        config: migrateVision(p.config),
                    })),
                    activeProfileId: parsed.activeProfileId || parsed.profiles[0].id,
                };
            }
        }

        // v1 → v3 (single config from the visionModel era)
        const v1 = localStorage.getItem(LEGACY_STORAGE_KEY_V1);
        if (v1) {
            const parsedLegacy = JSON.parse(v1) as ModelConfig;
            const migrated: ModelProfile = {
                ...defaultProfile,
                config: migrateVision({ ...defaultModelConfig, ...parsedLegacy }),
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

    // Server default for the "model supports image input" toggle
    // (env AI_MODEL_SUPPORTS_VISION). Used only when a profile hasn't
    // explicitly set visionEnabled.
    const [serverVision, setServerVision] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/settings")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!cancelled && data) {
                    setServerVision(
                        typeof data.visionEnabled === "boolean"
                            ? data.visionEnabled
                            : false
                    );
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    const activeProfile = useMemo(() => {
        return profiles.find((p) => p.id === activeProfileId) || profiles[0];
    }, [profiles, activeProfileId]);

    // Effective config: visionEnabled falls back to the server default when
    // the profile hasn't set it explicitly.
    const config = useMemo(() => {
        const base = activeProfile?.config || defaultModelConfig;
        if (base.visionEnabled !== undefined || serverVision === null) {
            return base;
        }
        return { ...base, visionEnabled: serverVision };
    }, [activeProfile, serverVision]);

    const value = useMemo<ModelConfigContextValue>(() => {
        const updateProfileList = (updater: (prev: ModelProfile[]) => ModelProfile[]) => {
            setProfiles((prev) => updater(prev));
        };

        return {
            config,
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
            createProfile: (name, configPatch) => {
                // Start from the active profile (keeps model / generation
                // params) and let the caller override e.g. the base URL when
                // the new profile targets a different endpoint.
                const baseConfig = activeProfile?.config ?? defaultModelConfig;
                const newProfile: ModelProfile = {
                    id: generateId(),
                    name: name?.trim() || `配置${profiles.length + 1}`,
                    config: { ...baseConfig, ...configPatch },
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
    }, [activeProfile, activeProfileId, profiles, config]);

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
