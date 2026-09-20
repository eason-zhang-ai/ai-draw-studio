import { getServerDefaults } from "@/lib/model-provider";

// Runtime env (docker compose `environment` / shell) must be read per request,
// not baked into a build-time static response.
export const dynamic = "force-dynamic";

/**
 * Non-secret view of the server-side defaults.
 *
 * The model config dialog leaves fields empty to mean "use the server
 * default", so it needs to display what that default actually is —
 * otherwise an empty Base URL reads as "OpenAI" while requests really go
 * to the env-configured gateway. The API key itself is never returned,
 * only whether one is configured.
 */
export async function GET() {
    const defaults = getServerDefaults();
    return Response.json({
        baseUrl: defaults.baseUrl ?? "",
        model: defaults.model ?? "",
        hasApiKey: defaults.hasApiKey,
        maxOutputTokens: defaults.maxOutputTokens ?? null,
        // "" = endpoint default (no reasoning_effort sent)
        thinkingLevel: defaults.thinkingLevel ?? "",
        // env AI_MODEL_SUPPORTS_VISION — client default for the "supports image input" toggle
        visionEnabled: defaults.visionEnabled,
    });
}
