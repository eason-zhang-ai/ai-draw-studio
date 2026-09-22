"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Settings, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModelConfig, defaultModelConfig, ModelConfig } from "@/contexts/model-config-context";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/**
 * Server-side defaults (from the deployment env, e.g. 1Panel's compose env
 * tab). Every empty field below falls back to one of these, so they are
 * shown as the input placeholders instead of a separate "current value"
 * line — one source of truth, no chance of the form implying a value that
 * differs from what requests actually use.
 */
interface ServerDefaults {
    baseUrl: string;
    model: string;
    hasApiKey: boolean;
    maxOutputTokens: number | null;
    /** "" = endpoint default (no reasoning_effort is sent). */
    thinkingLevel: string;
    /** Input token budget; null = no trimming (model default window). */
    contextLength: number | null;
}

/**
 * Radix Select rejects "" as an item value, so the "use the server default"
 * choice needs a sentinel that maps back to an empty string.
 */
const SERVER_DEFAULT = "__server_default__";

/** Mirrors THINKING_LEVELS in lib/model-provider.ts. */
const THINKING_LEVEL_OPTIONS = [
    { value: "none", label: "none · 关闭思考" },
    { value: "minimal", label: "minimal · 最少" },
    { value: "low", label: "low · 低" },
    { value: "medium", label: "medium · 中" },
    { value: "high", label: "high · 高" },
];

/**
 * Starting points offered when CREATING a profile.
 *
 * Deliberately only shown at creation time — as a standing field on the form
 * an endpoint dropdown competes with "blank = use the server default" and
 * makes the effective Base URL ambiguous.
 *
 * `url: ""` means "leave it blank" (fall back to the server env default).
 */
const ENDPOINT_PRESETS = [
    { id: "server-default", label: "服务端默认（留空）", url: "" },
    { id: "erix", label: "Erix · DeepSeek V4 网关", url: "https://code-api.erix.vip/v1" },
    { id: "openai", label: "OpenAI", url: "https://api.openai.com/v1" },
    { id: "deepseek", label: "DeepSeek", url: "https://api.deepseek.com/v1" },
    { id: "moonshot", label: "Moonshot (Kimi)", url: "https://api.moonshot.cn/v1" },
    { id: "zhipu", label: "智谱 AI", url: "https://open.bigmodel.cn/api/paas/v4" },
    { id: "dashscope", label: "通义千问", url: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
    { id: "qianfan", label: "百度千帆", url: "https://qianfan.baidubce.com/v2" },
    { id: "spark", label: "讯飞星火", url: "https://spark-api-open.xf-yun.com/v1" },
    { id: "hunyuan", label: "腾讯混元", url: "https://hunyuan.tencentcloudapi.com" },
    { id: "lingyi", label: "零一万物", url: "https://api.lingyiwanwu.com/v1" },
    { id: "siliconflow", label: "SiliconFlow", url: "https://api.siliconflow.cn/v1" },
    { id: "groq", label: "Groq", url: "https://api.groq.com/openai/v1" },
    { id: "openrouter", label: "OpenRouter", url: "https://openrouter.ai/api/v1" },
    { id: "together", label: "Together AI", url: "https://api.together.xyz/v1" },
    { id: "perplexity", label: "Perplexity", url: "https://api.perplexity.ai" },
    { id: "mistral", label: "Mistral AI", url: "https://api.mistral.ai/v1" },
    { id: "cohere", label: "Cohere", url: "https://api.cohere.ai/v1" },
    { id: "anthropic", label: "Anthropic Claude", url: "https://api.anthropic.com/v1" },
    { id: "gemini", label: "Google Gemini", url: "https://generativelanguage.googleapis.com/v1beta" },
    { id: "huggingface", label: "Hugging Face", url: "https://api-inference.huggingface.co" },
    { id: "ollama", label: "Ollama", url: "http://localhost:11434/api" },
    { id: "lmstudio", label: "LM Studio", url: "http://localhost:1234/v1" },
    { id: "openwebui", label: "OpenWebUI", url: "http://localhost:3000/ollama/api" },
    { id: "custom", label: "自定义（留空手填）", url: "" },
];

interface ModelConfigDialogProps {
    className?: string;
    buttonVariant?: "outline" | "ghost";
    size?: "sm" | "md";
}

export function ModelConfigDialog({
    className,
    buttonVariant = "outline",
    size = "md",
}: ModelConfigDialogProps) {
    const {
        config,
        profiles,
        activeProfile,
        activeProfileId,
        setActiveProfile,
        setConfig,
        createProfile,
        renameProfile,
        deleteProfile,
        reset,
    } = useModelConfig();
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<ModelConfig>(config);
    const [models, setModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [modelsError, setModelsError] = useState<string | null>(null);
    const [serverDefaults, setServerDefaults] = useState<ServerDefaults | null>(null);
    // Rename happens inline in the profile row, so no standing name field.
    const [renaming, setRenaming] = useState(false);
    const [renameDraft, setRenameDraft] = useState("");
    // "New profile" dialog: choose a starting endpoint + a name.
    const [createOpen, setCreateOpen] = useState(false);
    const [createPresetId, setCreatePresetId] = useState(ENDPOINT_PRESETS[0].id);
    const [createName, setCreateName] = useState("");

    useEffect(() => {
        if (open) {
            setDraft(config);
        }
    }, [open, config]);

    useEffect(() => {
        if (open) {
            setDraft(activeProfile?.config || defaultModelConfig);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeProfileId]);

    // Show what an empty field actually falls back to, so the dialog never
    // implies a value that differs from what requests really use.
    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        fetch("/api/settings")
            .then((res) => (res.ok ? res.json() : null))
            .then((data: ServerDefaults | null) => {
                if (!cancelled && data) setServerDefaults(data);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [open]);

    const handleSave = () => {
        setConfig(draft);
        setOpen(false);
    };

    const handleReset = () => {
        reset();
        setDraft(defaultModelConfig);
        setOpen(false);
    };

    const handleFieldChange = <K extends keyof ModelConfig>(key: K, value: ModelConfig[K]) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    };

    const smallButton = size === "sm";

    const fetchModels = async () => {
        setLoadingModels(true);
        setModelsError(null);
        try {
            const res = await fetch("/api/models", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ modelConfig: draft }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || "获取模型失败");
            }
            setModels(data.models ?? []);
        } catch (error) {
            setModels([]);
            setModelsError(error instanceof Error ? error.message : String(error));
        } finally {
            setLoadingModels(false);
        }
    };

    const canDelete = profiles.length > 1;

    const startRename = () => {
        setRenameDraft(activeProfile?.name || "");
        setRenaming(true);
    };

    const commitRename = () => {
        if (renameDraft.trim()) renameProfile(activeProfileId, renameDraft);
        setRenaming(false);
    };

    /** "服务端默认（留空）" -> "服务端默认" as a profile name. */
    const presetName = (label: string) => label.replace(/（[^）]*）/g, "").trim();

    const openCreate = () => {
        const first = ENDPOINT_PRESETS[0];
        setCreatePresetId(first.id);
        setCreateName(presetName(first.label));
        setCreateOpen(true);
    };

    const handlePresetChange = (id: string) => {
        setCreatePresetId(id);
        const preset = ENDPOINT_PRESETS.find((p) => p.id === id);
        if (preset) setCreateName(presetName(preset.label));
    };

    const confirmCreate = () => {
        const preset =
            ENDPOINT_PRESETS.find((p) => p.id === createPresetId) ??
            ENDPOINT_PRESETS[0];
        createProfile(createName.trim() || presetName(preset.label), {
            baseUrl: preset.url,
        });
        setCreateOpen(false);
    };

    // Placeholders = the real server-side defaults, so an empty field always
    // shows exactly what it will fall back to.
    const ph = {
        apiKey:
            serverDefaults === null
                ? "读取中…"
                : serverDefaults.hasApiKey
                  ? "服务端已配置"
                  : "服务端未配置",
        baseUrl:
            serverDefaults === null
                ? "读取中…"
                : serverDefaults.baseUrl || "服务端未配置",
        model:
            serverDefaults === null
                ? "读取中…"
                : serverDefaults.model || "服务端未配置",
        maxOutputTokens:
            serverDefaults === null
                ? "读取中…"
                : serverDefaults.maxOutputTokens
                  ? String(serverDefaults.maxOutputTokens)
                  : "不设（模型默认）",
        thinkingLevel:
            serverDefaults === null
                ? "读取中…"
                : serverDefaults.thinkingLevel || "未设置（用接口默认）",
        contextLength:
            serverDefaults === null
                ? "读取中…"
                : serverDefaults.contextLength
                  ? String(serverDefaults.contextLength)
                  : "不设（模型默认）",
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={buttonVariant}
                    size={smallButton ? "sm" : "default"}
                    title="模型设置"
                    className={cn("flex items-center gap-2 h-8 px-2", className)}
                >
                    <Settings className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>模型设置</DialogTitle>
                    <DialogDescription>
                        保存到本地浏览器，仅当前设备可见。留空时使用服务端环境变量（docker compose 注入）。
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex flex-col gap-2 rounded-md border p-3 bg-muted/40">
                        <div>
                            <span className="block text-sm font-medium">配置档案</span>
                            <span className="block text-[11px] text-muted-foreground">
                                每个档案各自保存一套 Base URL / API Key / 模型；下面所有字段都属于当前选中的档案。
                            </span>
                        </div>
                        {/* flex-wrap + a narrower trigger keep this row inside the
                            dialog's content box — otherwise it overflows to the
                            right and the whole form looks off-centre. */}
                        <div className="flex flex-wrap items-center gap-2">
                            {renaming ? (
                                <>
                                    <Input
                                        value={renameDraft}
                                        autoFocus
                                        placeholder="配置名称"
                                        className="h-8 w-52 text-sm"
                                        onChange={(e) => setRenameDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") commitRename();
                                            if (e.key === "Escape") setRenaming(false);
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 px-2"
                                        onClick={commitRename}
                                    >
                                        确定
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 px-2"
                                        onClick={() => setRenaming(false)}
                                    >
                                        取消
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Select
                                        value={activeProfileId}
                                        onValueChange={(id) => setActiveProfile(id)}
                                    >
                                        <SelectTrigger className="h-8 w-52 text-sm">
                                            <SelectValue placeholder="选择配置" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {profiles.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 px-2"
                                        onClick={openCreate}
                                        title="新建配置档案，可先选一个预设端点"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        新增配置
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 px-2"
                                        onClick={startRename}
                                        title="重命名当前配置档案"
                                    >
                                        <Pencil className="h-4 w-4 mr-1" />
                                        改名
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 px-2 text-destructive"
                                        disabled={!canDelete}
                                        onClick={() => canDelete && deleteProfile(activeProfileId)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        删除
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="text-sm space-y-1 sm:col-span-2">
                            <span className="block font-medium">Base URL</span>
                            <Input
                                value={draft.baseUrl ?? ""}
                                placeholder={ph.baseUrl}
                                onChange={(e) => handleFieldChange("baseUrl", e.target.value)}
                            />
                        </label>

                        <label className="text-sm space-y-1 sm:col-span-2">
                            <label className="text-sm">
                                <span className="block font-medium">API Key</span>
                                <Input
                                    value={draft.apiKey ?? ""}
                                    type="password"
                                    placeholder={ph.apiKey}
                                    onChange={(e) => handleFieldChange("apiKey", e.target.value)}
                                    className="w-full"
                                />
                            </label>
                        </label>

                        <label className="text-sm space-y-1">
                            <span className="block font-medium">模型名</span>
                            <Input
                                value={draft.model ?? ""}
                                placeholder={ph.model}
                                onChange={(e) => handleFieldChange("model", e.target.value)}
                            />
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={fetchModels}
                                    disabled={loadingModels}
                                    className="h-6 px-2 text-xs underline hover:no-underline"
                                >
                                    {loadingModels ? "获取中..." : "从网关拉取模型列表"}
                                </Button>
                            </div>
                        </label>

                        <label className="flex items-start gap-2 rounded-md border p-3 bg-muted/40 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!draft.visionEnabled}
                                onChange={(e) => handleFieldChange("visionEnabled", e.target.checked)}
                                className="mt-0.5 h-4 w-4"
                            />
                            <span className="space-y-1">
                                <span className="block font-medium">模型支持图片输入（vision）</span>
                                <span className="block text-[11px] text-muted-foreground">
                                    勾选后允许上传/粘贴参考图片，图片会随请求发给上面的模型；不勾选则禁用图片上传。
                                </span>
                            </span>
                        </label>

                        <label className="text-sm space-y-1">
                            <span className="block font-medium">上下文长度</span>
                            <Input
                                type="number"
                                min={0}
                                step={1000}
                                value={draft.contextLength ?? ""}
                                placeholder={ph.contextLength}
                                onChange={(e) =>
                                    handleFieldChange(
                                        "contextLength",
                                        e.target.value
                                            ? Math.max(0, Number(e.target.value))
                                            : undefined
                                    )
                                }
                            />
                            <span className="text-[11px] text-muted-foreground">
                                留空 = 不裁剪输入，用模型默认窗口；设置后按预算裁剪历史/图表上下文
                            </span>
                        </label>

                        <label className="text-sm space-y-1">
                            <span className="block font-medium">最大输出 Token</span>
                            <Input
                                type="number"
                                min={0}
                                step={500}
                                value={draft.maxOutputTokens ?? ""}
                                placeholder={ph.maxOutputTokens}
                                onChange={(e) =>
                                    handleFieldChange(
                                        "maxOutputTokens",
                                        e.target.value
                                            ? Math.max(0, Number(e.target.value))
                                            : undefined
                                    )
                                }
                            />
                            <span className="text-[11px] text-muted-foreground">
                                留空 = 不传参数，用模型默认上限
                            </span>
                        </label>

                        <label className="text-sm space-y-1">
                            <span className="block font-medium">思考等级</span>
                            <Select
                                value={draft.thinkingLevel || SERVER_DEFAULT}
                                onValueChange={(val) =>
                                    handleFieldChange(
                                        "thinkingLevel",
                                        val === SERVER_DEFAULT ? "" : val
                                    )
                                }
                            >
                                <SelectTrigger className="h-8 w-full text-sm">
                                    <SelectValue placeholder={ph.thinkingLevel} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={SERVER_DEFAULT}>
                                        {serverDefaults?.thinkingLevel
                                            ? `服务端默认（${serverDefaults.thinkingLevel}）`
                                            : "服务端默认"}
                                    </SelectItem>
                                    {THINKING_LEVEL_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-[11px] text-muted-foreground">
                                越低越快、越不易跑偏；none 彻底关闭思考
                            </span>
                        </label>
                    </div>

                    <div className="space-y-2">
                        {modelsError && (
                            <p className="text-xs text-destructive">{modelsError}</p>
                        )}
                        {models.length > 0 && (
                            <ScrollArea className="h-32 border rounded-md p-2">
                                <div className="space-y-1">
                                    {models.map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            className={cn(
                                                "w-full text-left text-sm px-2 py-1 rounded hover:bg-accent",
                                                draft.model === m && "bg-primary/10 text-primary"
                                            )}
                                            onClick={() => handleFieldChange("model", m)}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>

                {/* Nested dialog: a new profile starts from an endpoint preset. */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>新建配置</DialogTitle>
                            <DialogDescription>
                                先选一个预设端点作为起点，创建后仍可随时修改。
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3">
                            <label className="block text-sm space-y-1">
                                <span className="block font-medium">端点预设</span>
                                <Select
                                    value={createPresetId}
                                    onValueChange={handlePresetChange}
                                >
                                    <SelectTrigger className="h-9 w-full text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ENDPOINT_PRESETS.map((preset) => (
                                            <SelectItem key={preset.id} value={preset.id}>
                                                {preset.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </label>

                            <label className="block text-sm space-y-1">
                                <span className="block font-medium">配置名称</span>
                                <Input
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") confirmCreate();
                                    }}
                                    placeholder="配置名称"
                                />
                            </label>

                            <p className="text-[11px] text-muted-foreground">
                                起点 Base URL：
                                {ENDPOINT_PRESETS.find((p) => p.id === createPresetId)?.url ||
                                    "（留空，使用服务端默认）"}
                            </p>
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                                取消
                            </Button>
                            <Button onClick={confirmCreate}>创建</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <DialogFooter>
                    <Button variant="ghost" onClick={handleReset}>
                        重置为空
                    </Button>
                    <Button onClick={handleSave}>保存</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
