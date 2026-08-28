/**
 * Client & server safe model presets for the DeepSeek v4 series
 * (served by the code-api.erix.vip OpenAI-compatible endpoint).
 */

export interface ModelPreset {
    id: string;
    label: string;
    vision: boolean;
}

export const DEEPSEEK_MODEL_PRESETS: ModelPreset[] = [
    { id: "deepseek-v4-flash", label: "V4 Flash · 快速", vision: false },
    { id: "deepseek-v4-pro", label: "V4 Pro · 强力", vision: false },
    {
        id: "deepseek-v4-flash-vision-exp",
        label: "V4 Flash Vision · 视觉",
        vision: true,
    },
];

export const DEFAULT_BASE_URL = "https://code-api.erix.vip/v1";
export const DEFAULT_MODEL = "deepseek-v4-flash";
export const DEFAULT_VISION_MODEL = "deepseek-v4-flash-vision-exp";

export function isVisionModel(model: string): boolean {
    return /vision/i.test(model);
}
