"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Settings, Trash2 } from "lucide-react";
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

const baseUrlPresets = [
    { label: "OpenAI", value: "https://api.openai.com/v1" },
    { label: "DeepSeek", value: "https://api.deepseek.com/v1" },
    { label: "Moonshot (Kimi)", value: "https://api.moonshot.cn/v1" },
    { label: "Groq", value: "https://api.groq.com/openai/v1" },
    { label: "SiliconFlow", value: "https://api.siliconflow.cn/v1" },
    { label: "OpenRouter", value: "https://openrouter.ai/api/v1" },
    { label: "零一万物", value: "https://api.lingyiwanwu.com/v1" },
    { label: "智谱AI", value: "https://open.bigmodel.cn/api/paas/v4" },
    { label: "通义千问", value: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
    { label: "百度千帆", value: "https://qianfan.baidubce.com/v2" },
    { label: "讯飞星火", value: "https://spark-api-open.xf-yun.com/v1" },
    { label: "腾讯混元", value: "https://hunyuan.tencentcloudapi.com" },
    { label: "Anthropic Claude", value: "https://api.anthropic.com/v1" },
    { label: "Google Gemini", value: "https://generativelanguage.googleapis.com/v1beta" },
    { label: "Together AI", value: "https://api.together.xyz/v1" },
    { label: "Perplexity", value: "https://api.perplexity.ai" },
    { label: "Mistral AI", value: "https://api.mistral.ai/v1" },
    { label: "Cohere", value: "https://api.cohere.ai/v1" },
    { label: "Hugging Face", value: "https://api-inference.huggingface.co" },
    { label: "Ollama", value: "http://localhost:11434/api" },
    { label: "LM Studio", value: "http://localhost:1234/v1" },
    { label: "Jan AI", value: "http://localhost:1337/v1" },
    { label: "OpenWebUI", value: "http://localhost:3000/ollama/api" },
    { label: "自定义", value: "http://" },
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

    const activeName = useMemo(() => activeProfile?.name || "默认配置", [activeProfile]);

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
                    <span className="text-xs text-muted-foreground truncate max-w-[96px] hidden sm:inline">
                        {activeName}
                    </span>
                    {/*<span className="hidden sm:inline">模型设置</span>*/}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>模型设置</DialogTitle>
                    <DialogDescription>
                        保存到本地浏览器，仅当前设备可见。为空时将使用.env环境变量。
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex flex-col gap-2 rounded-md border p-3 bg-muted/40">
                        <div className="flex items-center gap-2">
                            <Select
                                value={activeProfileId}
                                onValueChange={(id) => setActiveProfile(id)}
                            >
                                <SelectTrigger className="h-8 w-62 text-sm">
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
                                onClick={() => createProfile()}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                新增配置
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
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="text-sm space-y-1">
                            <label className="text-sm">
                                <span className="block font-medium">配置名称</span>
                                <Input
                                    value={activeProfile?.name || ""}
                                    placeholder="配置名称"
                                    onChange={(e) => renameProfile(activeProfileId, e.target.value)}
                                />
                            </label>
                        </label>
                        <label className="text-sm space-y-1">
                            <label className="text-sm">
                                <span className="block font-medium">API Key</span>
                                <Input
                                    value={draft.apiKey ?? ""}
                                    type="password"
                                    placeholder="sk- …… "
                                    onChange={(e) => handleFieldChange("apiKey", e.target.value)}
                                    className="w-full"
                                />
                            </label>
                        </label>

                        <label className="text-sm space-y-1 sm:col-span-2 flex flex-col gap-2 rounded-md border p-3 bg-muted/40">
                            <span className="block font-medium">Base URL</span>
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr] gap-2">
                                <Select
                                    value={
                                        baseUrlPresets.find((p) => p.value === (draft.baseUrl || ""))?.value ||
                                        (draft.baseUrl ? "" : "https://api.openai.com/v1")
                                    }
                                    onValueChange={(val) => {
                                        handleFieldChange("baseUrl", val);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-63 text-sm">
                                        <SelectValue placeholder="自定义" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {baseUrlPresets.map((preset) => (
                                            <SelectItem key={preset.value || "custom"} value={preset.value}>
                                                {preset.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    className="w-full"
                                    value={draft.baseUrl ?? ""}
                                    placeholder="https://api.openai.com/v1"
                                    onChange={(e) => handleFieldChange("baseUrl", e.target.value)}
                                />
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                                先选常用网关，必要时在右侧输入框微调或填自定义代理地址。
                            </span>
                        </label>

                        <label className="text-sm space-y-1">
                            <span className="block font-medium">模型名</span>
                            <Input
                                value={draft.model ?? ""}
                                placeholder="gpt-4o / gpt-4o-mini"
                                onChange={(e) => handleFieldChange("model", e.target.value)}
                            />
                            <div className="flex items-center gap-3">

                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={fetchModels}
                                    disabled={loadingModels}
                                    className="text-xs underline hover:no-underline"
                                >
                                    {loadingModels ? "获取中..." : "拉取列表"}
                                </Button>
                            </div>
                        </label>

                        <label className="text-sm space-y-1">
                            <span className="block font-medium">最大输出 Token</span>
                            <Input
                                type="number"
                                min={0}
                                step={500}
                                value={draft.maxOutputTokens ?? ""}
                                placeholder="默认 12000"
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
                                可根据模型限额调整，避免长 JSON 被截断
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
