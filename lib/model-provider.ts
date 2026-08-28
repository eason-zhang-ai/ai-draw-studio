import { createDeepSeek } from "@ai-sdk/deepseek";
import {
    DEFAULT_BASE_URL,
    DEFAULT_MODEL,
    DEFAULT_VISION_MODEL,
} from "@/lib/model-presets";

export interface ModelConfigInput {
    apiKey?: string;
    baseUrl?: string;
    /** Primary (text) model used for diagram generation. */
    model?: string;
    /** Vision model used when the request contains images. */
    visionModel?: string;
    maxOutputTokens?: number;
}

function parseEnvInt(value?: string) {
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

const ENV = {
    baseUrl:
        process.env.AI_BASE_URL ||
        process.env.OPENAI_BASE_URL ||
        DEFAULT_BASE_URL,
    apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
    model: process.env.AI_MODEL || DEFAULT_MODEL,
    visionModel: process.env.AI_VISION_MODEL || DEFAULT_VISION_MODEL,
    maxOutputTokens: parseEnvInt(
        process.env.AI_MAX_OUTPUT_TOKENS || process.env.OPENAI_MAX_OUTPUT_TOKENS
    ),
};

/**
 * Resolve an AI SDK model client for the active config.
 *
 * opts.vision=true routes to the configured vision model
 * (deepseek-v4-flash-vision-exp by default) instead of the text model.
 * Client config wins; server env vars are the fallback.
 */
export function resolveModel(
    config?: ModelConfigInput,
    opts?: { vision?: boolean }
) {
    const baseUrl = config?.baseUrl?.trim() || ENV.baseUrl;
    const apiKey = config?.apiKey?.trim() || ENV.apiKey;
    const model = opts?.vision
        ? config?.visionModel?.trim() || ENV.visionModel
        : config?.model?.trim() || ENV.model;
    const maxOutputTokens =
        typeof config?.maxOutputTokens === "number"
            ? config.maxOutputTokens
            : ENV.maxOutputTokens;

    // NOTE: use the dedicated DeepSeek provider (not the OpenAI-compatible one).
    // The erix endpoint runs models in "thinking mode" and REQUIRES the
    // assistant's reasoning_content to be echoed back on tool round-trips;
    // @ai-sdk/deepseek preserves reasoning parts across messages while
    // @ai-sdk/openai drops them, which makes the post-tool call fail with 400.
    const client = createDeepSeek({ apiKey, baseURL: baseUrl });
    return { client, model, maxOutputTokens };
}

/** Server defaults, exposed for the UI to display effective settings. */
export function getServerDefaults() {
    return {
        baseUrl: ENV.baseUrl,
        hasApiKey: Boolean(ENV.apiKey),
        model: ENV.model,
        visionModel: ENV.visionModel,
        maxOutputTokens: ENV.maxOutputTokens,
    };
}
