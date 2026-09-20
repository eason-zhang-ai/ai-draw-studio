import { createOpenAI } from "@ai-sdk/openai";
import { createBufferedFetch } from "@/lib/buffered-fetch";

/**
 * Reasoning ("thinking") levels accepted by the endpoint.
 *
 * Verified against code-api.erix.vip: `reasoning_effort` is the only
 * parameter that actually takes effect — `none` reliably drives
 * reasoning_tokens to 0, and low/medium/high scale the thinking length.
 * The DeepSeek-style spellings (`thinking`, `enable_thinking`,
 * `chat_template_kwargs`, `thinking_budget`) are silently ignored by the
 * gateway and had no measurable effect.
 */
export const THINKING_LEVELS = [
    "none",
    "minimal",
    "low",
    "medium",
    "high",
] as const;

export type ThinkingLevel = (typeof THINKING_LEVELS)[number];

/** undefined = leave the endpoint's own default alone ("auto"). */
export function parseThinkingLevel(value?: string | null): ThinkingLevel | undefined {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    return (THINKING_LEVELS as readonly string[]).includes(normalized)
        ? (normalized as ThinkingLevel)
        : undefined;
}

export interface ModelConfigInput {
    apiKey?: string;
    baseUrl?: string;
    /** Primary model used for diagram generation (also handles image input when the model supports vision). */
    model?: string;
    maxOutputTokens?: number;
    /** Reasoning effort; empty = endpoint default. */
    thinkingLevel?: string;
}

function parseEnvInt(value?: string) {
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseBool(value?: string): boolean | undefined {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
    return undefined;
}

const ENV = {
    baseUrl: process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL,
    apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
    model: process.env.AI_MODEL,
    maxOutputTokens: parseEnvInt(
        process.env.AI_MAX_OUTPUT_TOKENS || process.env.OPENAI_MAX_OUTPUT_TOKENS
    ),
    thinkingLevel: parseThinkingLevel(process.env.AI_THINKING_LEVEL),
    // Whether the default model accepts image input. This is a CLIENT-side
    // default only (the front-end "model supports image input" toggle falls
    // back to it); the server sends image parts to the single model as-is.
    modelSupportsVision: parseBool(process.env.AI_MODEL_SUPPORTS_VISION),
};

/**
 * Resolve an AI SDK model client for the active config.
 *
 * There is a single model: the configured primary model. Image (vision)
 * requests are sent to the SAME model — whether that model accepts images
 * is the operator's call (toggled by the client's "supports vision" flag),
 * not a separate model id. Client config wins; server env vars are the
 * fallback.
 *
 * NOTE on provider choice: @ai-sdk/openai is used (not @ai-sdk/deepseek)
 * because it converts image parts to image_url for the vision model, AND
 * it passes through the real tool-call ids on round-trips. The erix
 * gateway validates tool-call ids against its own records — fabricated
 * ids fail with a misleading "reasoning_content must be passed back"
 * error, which was tracked down via scripts/repro-tools.ts.
 *
 * A buffered fetch forces non-streaming upstream (the endpoint's
 * streaming mode degenerates the reasoning model) and replays the full
 * response as SSE so streamText still works.
 */
export function resolveModel(config?: ModelConfigInput) {
    const baseUrl = config?.baseUrl?.trim() || ENV.baseUrl;
    const apiKey = config?.apiKey?.trim() || ENV.apiKey;
    const model = config?.model?.trim() || ENV.model;
    const maxOutputTokens =
        typeof config?.maxOutputTokens === "number"
            ? config.maxOutputTokens
            : ENV.maxOutputTokens;
    const thinkingLevel =
        parseThinkingLevel(config?.thinkingLevel) ?? ENV.thinkingLevel;

    if (!model) {
        throw new Error(
            "未配置默认模型：请设置 AI_MODEL 环境变量（docker compose environment），或在前端模型设置面板填写模型名"
        );
    }

    const client = createOpenAI({
        apiKey,
        baseURL: baseUrl,
        name: "openai",
        fetch: createBufferedFetch(),
    });

    // Only send reasoning_effort when a level is configured, so "auto" keeps
    // the endpoint's own default instead of overriding it.
    const providerOptions = thinkingLevel
        ? { openai: { reasoningEffort: thinkingLevel } }
        : undefined;

    return { client, model, maxOutputTokens, thinkingLevel, providerOptions };
}

/** Server defaults, exposed for the UI to display effective settings. */
export function getServerDefaults() {
    return {
        baseUrl: ENV.baseUrl,
        hasApiKey: Boolean(ENV.apiKey),
        model: ENV.model,
        maxOutputTokens: ENV.maxOutputTokens,
        thinkingLevel: ENV.thinkingLevel,
        visionEnabled: Boolean(ENV.modelSupportsVision),
    };
}
