/**
 * Mermaid reserved-word sanitizer.
 *
 * LLMs frequently name a classDef / class after a reserved Mermaid keyword
 * (most commonly `end`, which also terminates subgraphs). `:::end` then
 * fails to parse with: "Expecting ... got 'end'". Rename reserved class
 * names consistently across classDef / inline class / class assignments
 * before rendering.
 */

const RESERVED = [
    "end",
    "class",
    "classdef",
    "style",
    "linkstyle",
    "direction",
    "subgraph",
    "graph",
    "flowchart",
    "click",
    "acctitle",
    "accdescr",
];

function reservedClassNames(definition: string): Set<string> {
    const names = new Set<string>();
    const re = /classDef\s+([A-Za-z_][\w-]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(definition)) !== null) {
        const name = m[1];
        if (RESERVED.includes(name.toLowerCase())) names.add(name);
    }
    return names;
}

export function sanitizeMermaid(definition: string): string {
    const bad = reservedClassNames(definition);
    if (bad.size === 0) return definition;

    let out = definition;
    for (const name of bad) {
        const safe = `${name}_c`;
        // classDef end  ->  classDef end_c
        out = out.replace(
            new RegExp(`classDef\\s+${name}\\b`, "g"),
            `classDef ${safe}`
        );
        // :::end  ->  :::end_c   (and legacy ::end)
        out = out.replace(new RegExp(`:::${name}\\b`, "g"), `:::${safe}`);
        out = out.replace(new RegExp(`::${name}\\b`, "g"), `::${safe}`);
        // class A,B end  ->  class A,B end_c   (id list is comma-separated, no spaces)
        out = out.replace(
            new RegExp(`(class\\s+[\\w,]+)\\s+${name}\\b`, "g"),
            `$1 ${safe}`
        );
    }
    return out;
}
