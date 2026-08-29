import { createOpenAI } from "@ai-sdk/openai";
import { createBufferedFetch } from "@/lib/buffered-fetch";
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

    // NOTE on provider choice: @ai-sdk/openai is used (not @ai-sdk/deepseek)
    // because it converts image parts to image_url for the vision model, AND
    // it passes through the real tool-call ids on round-trips. The erix
    // gateway validates tool-call ids against its own records — fabricated
    // ids fail with a misleading "reasoning_content must be passed back"
    // error, which was tracked down via scripts/repro-tools.ts.
    //
    // A buffered fetch forces non-streaming upstream (the endpoint's
    // streaming mode degenerates the reasoning model) and replays the full
    // response as SSE so streamText still works.
    const client = createOpenAI({
        apiKey,
        baseURL: baseUrl,
        name: "openai",
        fetch: createBufferedFetch(),
    });
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
