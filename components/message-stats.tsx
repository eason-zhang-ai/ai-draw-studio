"use client";

import type { UIMessage } from "ai";

/**
 * Per-turn stats attached by the API route via the message-metadata stream
 * channel: { usage, elapsedMs }. DefaultChatTransport drops the finish
 * chunk's usage, so the server forwards it as message metadata instead.
 */

interface TurnStats {
    usage?: {
        inputTokens?: number;
        outputTokens?: number;
        reasoningTokens?: number;
    } | null;
    elapsedMs?: number;
}

export function MessageStats({ message }: { message: UIMessage }) {
    const meta = (message as unknown as { metadata?: TurnStats }).metadata;
    if (!meta) return null;

    const { usage, elapsedMs } = meta;
    if (!usage && typeof elapsedMs !== "number") return null;

    const fmt = (n: unknown) =>
        typeof n === "number" ? n.toLocaleString("en-US") : null;
    const input = fmt(usage?.inputTokens);
    const output = fmt(usage?.outputTokens);
    const reasoning = fmt(usage?.reasoningTokens);

    return (
        <div className="mt-1.5 text-left text-[11px] leading-4 text-muted-foreground/70">
            {typeof elapsedMs === "number" && (
                <span>耗时 {(elapsedMs / 1000).toFixed(1)} 秒</span>
            )}
            {input !== null && output !== null && (
                <span>
                    {typeof elapsedMs === "number" ? " · " : ""}
                    输入 {input} / 输出 {output} tokens
                </span>
            )}
            {reasoning !== null && (usage?.reasoningTokens ?? 0) > 0 && (
                <span> · 思考 {reasoning}</span>
            )}
        </div>
    );
}
