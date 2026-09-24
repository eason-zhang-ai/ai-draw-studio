/**
 * Shared map between uploaded file types and the vendored drawio-skill
 * importers.
 *
 * Both sides need it: the route picks the script to shell out to, and the chat
 * panel groups a multi-file selection so that one batch becomes ONE diagram
 * instead of N single-node diagrams overwriting each other.
 *
 * Deliberately free of Node built-ins — the client imports this too.
 */

export type ImportKind =
    | "sql"
    | "terraform"
    | "openapi"
    | "python"
    | "javascript";

export interface ImportKindSpec {
    /** Shown in the chat notice after a successful import. */
    label: string;
    /** Script under `skills/drawio-skill/scripts`. */
    script: string;
    /** Importer args, excluding the input path and `-o`. */
    args: string[];
    /** Canonical extension, used only when a filename is unusable. */
    ext: string;
    /**
     * Whether the importer accepts a directory.
     *
     * sqlerd / tfimports glob the tree, and pyimports / jsimports walk it — so
     * handing them a directory is what produces real cross-file edges (table
     * relationships, module dependencies). `openapiimports.py` takes a single
     * spec file and must be given a file.
     */
    takesDirectory: boolean;
}

export const IMPORT_KINDS: Record<ImportKind, ImportKindSpec> = {
    sql: {
        label: "SQL DDL → ER 图",
        script: "sqlerd.py",
        args: ["--group"],
        ext: ".sql",
        takesDirectory: true,
    },
    terraform: {
        label: "Terraform → 架构图",
        script: "tfimports.py",
        args: [],
        ext: ".tf",
        takesDirectory: true,
    },
    openapi: {
        label: "OpenAPI → API 图",
        script: "openapiimports.py",
        args: ["--group"],
        ext: ".yaml",
        takesDirectory: false,
    },
    python: {
        label: "Python → 模块依赖图",
        script: "pyimports.py",
        args: ["--group"],
        ext: ".py",
        takesDirectory: true,
    },
    javascript: {
        label: "JS/TS → 模块依赖图",
        script: "jsimports.py",
        args: ["--group"],
        ext: ".js",
        takesDirectory: true,
    },
};

/** Longest suffix wins, so `.d.ts` still resolves to javascript. */
const EXT_TO_KIND: Array<[string, ImportKind]> = [
    [".sql", "sql"],
    [".tf", "terraform"],
    [".yaml", "openapi"],
    [".yml", "openapi"],
    [".json", "openapi"],
    [".py", "python"],
    [".tsx", "javascript"],
    [".jsx", "javascript"],
    [".mjs", "javascript"],
    [".cjs", "javascript"],
    [".ts", "javascript"],
    [".js", "javascript"],
];

export function detectImportKind(filename: string): ImportKind | null {
    const lower = String(filename || "").toLowerCase();
    let best: ImportKind | null = null;
    let bestLen = 0;
    for (const [ext, kind] of EXT_TO_KIND) {
        if (lower.endsWith(ext) && ext.length > bestLen) {
            best = kind;
            bestLen = ext.length;
        }
    }
    return best;
}

/** `accept` string for the file picker, minus the `image/*` entry. */
export const IMPORT_ACCEPT = EXT_TO_KIND.map(([ext]) => ext).join(",");
