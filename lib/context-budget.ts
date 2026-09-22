/**
 * Rough context-length budgeting without a tokenizer.
 *
 * The estimate deliberately over-estimates CJK text (1 char ≈ 1 token,
 * real models do ~0.6–1.6 chars/token) so trimming stays on the safe
 * side of the real budget. English is counted at the conventional
 * ~4 chars/token.
 *
 * Budget semantics (mirrors the model-config chain):
 *   front-end form > AI_CONTEXT_LENGTH env > no trimming (model default).
 */

export function estimateTokens(text: string): number {
    if (!text) return 0;
    let cjk = 0;
    let other = 0;
    for (const ch of text) {
        const code = ch.codePointAt(0) ?? 0;
        if (
            (code >= 0x4e00 && code <= 0x9fff) || // CJK 统一表意文字
            (code >= 0x3000 && code <= 0x303f) || // CJK 标点
            (code >= 0xff00 && code <= 0xffef) // 全角形式
        ) {
            cjk += 1;
        } else if (!/\s/.test(ch)) {
            other += 1;
        }
    }
    return Math.ceil(cjk + other / 4);
}

const TRIM_SUFFIX = "\n\n<!-- 内容因上下文预算被截断 -->";

/** Keep the HEAD of `text` so its token estimate fits `maxTokens`. */
export function trimTextToTokens(text: string, maxTokens: number): string {
    if (maxTokens <= 0) return "";
    if (estimateTokens(text) <= maxTokens) return text;
    // Binary search for the longest prefix within budget.
    let lo = 0;
    let hi = text.length;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (estimateTokens(text.slice(0, mid)) <= maxTokens) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    return text.slice(0, lo) + TRIM_SUFFIX;
}

type MessagePart = {
    type?: string;
    text?: string;
    [key: string]: unknown;
};

export type BudgetableMessage = {
    role: string;
    content: string | MessagePart[] | unknown;
};

/** Cost of one message: text tokens + a rough 1K tokens per image. */
export function messageTokens(message: BudgetableMessage): number {
    const content = message.content;
    if (typeof content === "string") return estimateTokens(content);
    if (Array.isArray(content)) {
        let total = 0;
        for (const part of content as (string | MessagePart)[]) {
            if (typeof part === "string") {
                total += estimateTokens(part);
            } else if (part && typeof part === "object") {
                if (part.type === "text" && typeof part.text === "string") {
                    total += estimateTokens(part.text);
                } else if (part.type === "image") {
                    total += 1000;
                }
            }
        }
        return total;
    }
    return 0;
}

function trimContentToTokens(content: unknown, maxTokens: number): unknown {
    if (typeof content === "string") return trimTextToTokens(content, maxTokens);
    if (Array.isArray(content)) {
        const parts = [...(content as (string | MessagePart)[])];
        let remaining = maxTokens;
        for (let i = 0; i < parts.length && remaining > 0; i++) {
            const part = parts[i];
            const cost =
                typeof part === "string"
                    ? estimateTokens(part)
                    : part?.type === "text"
                      ? estimateTokens(part.text ?? "")
                      : part?.type === "image"
                        ? 1000
                        : 0;
            if (cost <= remaining) {
                remaining -= cost;
                continue;
            }
            if (typeof part === "string") {
                parts[i] = trimTextToTokens(part, remaining);
            } else if (part?.type === "text") {
                parts[i] = { ...part, text: trimTextToTokens(part.text ?? "", remaining) };
            } else if (part?.type === "image") {
                parts.splice(i, 1); // image does not fit → drop it
                i -= 1;
            }
            remaining = 0;
        }
        return parts;
    }
    return content;
}

/**
 * Keep the newest messages that fit the budget (walking from the newest
 * backwards). The newest message is always kept — its content gets trimmed
 * if it alone exceeds the budget. Undefined budget = keep everything.
 */
export function budgetMessages<T extends BudgetableMessage>(
    messages: T[],
    budgetTokens: number | undefined
): T[] {
    if (!budgetTokens || budgetTokens <= 0) return messages;
    let remaining = budgetTokens;
    const kept: T[] = [];
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        const cost = messageTokens(msg);
        if (cost <= remaining) {
            kept.unshift(msg);
            remaining -= cost;
        } else if (kept.length === 0) {
            kept.unshift({
                ...msg,
                content: trimContentToTokens(msg.content, remaining),
            } as T);
            remaining = 0;
        }
        // older messages that no longer fit are dropped
    }
    return kept;
}
