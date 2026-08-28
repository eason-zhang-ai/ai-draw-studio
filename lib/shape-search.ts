import { existsSync, readFileSync } from "fs";
import { gunzipSync } from "zlib";
import path from "path";

/**
 * Server-side reimplementation of the drawio-skill scripts:
 *   - shapesearch.py  → searchShapes()   (10,446 official draw.io shapes)
 *   - aiicons.py      → searchAiIcons()  (lobe-icons brand logos via CDN)
 * Reads the same vendored data files (skills/drawio-skill/data/*).
 */

const DATA_DIR = path.join(process.cwd(), "skills", "drawio-skill", "data");
const SHAPE_INDEX_GZ = path.join(DATA_DIR, "shape-index.json.gz");
const LOBE_ICONS = path.join(DATA_DIR, "lobe-icons.json");

const ICON_STYLE_PREFIX = "shape=image;html=1;imageAspect=0;aspect=fixed;";
const SIMPLEICONS_CDN = "https://cdn.simpleicons.org/";

// simple-icons supplements for common RAG/LLM data stores lobe-icons lacks
const SUPPLEMENT: Record<string, string> = {
    redis: "redis",
    postgres: "postgresql",
    mongodb: "mongodb",
    qdrant: "qdrant",
    milvus: "milvus",
    supabase: "supabase",
    databricks: "databricks",
    couchbase: "couchbase",
    elasticsearch: "elasticsearch",
    neo4j: "neo4j",
    mysql: "mysql",
    sqlite: "sqlite",
    kafka: "apachekafka",
    rabbitmq: "rabbitmq",
};

interface ShapeEntry {
    style: string;
    w: number;
    h: number;
    title: string;
    tags: string;
    type: string;
}

let shapeIndex: ShapeEntry[] | null = null;

function loadShapeIndex(): ShapeEntry[] {
    if (shapeIndex) return shapeIndex;
    if (!existsSync(SHAPE_INDEX_GZ)) return [];
    const raw = gunzipSync(readFileSync(SHAPE_INDEX_GZ)).toString("utf-8");
    // Normalize upstream data noise (some titles carry leading/trailing spaces)
    shapeIndex = (JSON.parse(raw) as ShapeEntry[]).map((e) => ({
        ...e,
        title: e.title.trim(),
        tags: e.tags.trim(),
    }));
    return shapeIndex!;
}

const squish = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");

export interface ShapeResult {
    style: string;
    w: number;
    h: number;
    title: string;
    type: string;
}

export function searchShapes(query: string, limit = 6): ShapeResult[] {
    const q = squish(query);
    if (!q) return [];
    const tokens = query
        .toLowerCase()
        .split(/[^a-z0-9\u4e00-\u9fff]+/)
        .filter((t) => t.length >= 3);

    const scored: { entry: ShapeEntry; score: number }[] = [];
    for (const entry of loadShapeIndex()) {
        const title = squish(entry.title);
        const hay = squish(`${entry.title} ${entry.tags}`);
        let score = 0;
        if (title === q) score += 60;
        if (hay === q) score += 20;
        else if (hay.includes(q)) score += 10;
        for (const t of tokens) {
            if (title === t) score += 30;
            else if (hay.includes(t)) score += 15;
        }
        if (score > 0) scored.push({ entry, score });
    }
    scored.sort(
        (a, b) =>
            b.score - a.score || a.entry.title.localeCompare(b.entry.title)
    );
    return scored.slice(0, limit).map(({ entry }) => ({
        style: entry.style,
        w: entry.w,
        h: entry.h,
        title: entry.title,
        type: entry.type,
    }));
}

interface IconsManifest {
    cdn: string;
    icons: string[];
}

let iconsManifest: IconsManifest | null = null;

function loadIconsManifest(): IconsManifest | null {
    if (iconsManifest) return iconsManifest;
    if (!existsSync(LOBE_ICONS)) return null;
    iconsManifest = JSON.parse(readFileSync(LOBE_ICONS, "utf-8")) as IconsManifest;
    return iconsManifest;
}

// Group "openai-color" / "openai-text" … into base families like the original script.
function iconFamilies(names: string[]): Map<string, Set<string>> {
    const fam = new Map<string, Set<string>>();
    for (const name of names) {
        const base = name.replace(/(-color|-brand|-brand-color|-text|-text-cn)$/, "");
        const set = fam.get(base) || new Set<string>();
        set.add(name);
        fam.set(base, set);
    }
    return fam;
}

export interface IconResult {
    brand: string;
    file: string;
    w: number;
    h: number;
    style: string;
}

const VARIANT_ORDER = ["-color", "-brand-color", "", "-brand", "-text", "-text-cn"];

export function searchAiIcons(query: string, size = 48, limit = 6): IconResult[] {
    const manifest = loadIconsManifest();
    const results: IconResult[] = [];
    const q = squish(query);
    if (!q || !manifest) return results;

    const fam = iconFamilies(manifest.icons);
    const scored: { base: string; score: number }[] = [];
    for (const base of fam.keys()) {
        const b = squish(base);
        let score = 0;
        if (b === q) score = 100;
        else if (b.startsWith(q)) score = 60;
        else if (b.includes(q)) score = 40;
        if (score > 0) scored.push({ base, score });
    }
    scored.sort((a, b) => b.score - a.score || a.base.localeCompare(b.base));
    const top = scored.slice(0, limit).map((s) => s.base);

    for (const base of top) {
        const variants = fam.get(base)!;
        let file = "";
        for (const suffix of VARIANT_ORDER) {
            if (variants.has(base + suffix)) {
                file = base + suffix;
                break;
            }
        }
        if (!file) file = [...variants].sort()[0];
        const url = `${manifest.cdn}${file}.svg`;
        results.push({
            brand: base,
            file,
            w: size,
            h: size,
            style: ICON_STYLE_PREFIX + url,
        });
    }

    if (results.length === 0) {
        const brand = Object.keys(SUPPLEMENT).find(
            (b) => q === squish(b) || b.includes(q) || q.includes(b)
        );
        if (brand) {
            const url = SIMPLEICONS_CDN + SUPPLEMENT[brand];
            results.push({
                brand,
                file: `simpleicons:${SUPPLEMENT[brand]}`,
                w: size,
                h: size,
                style: ICON_STYLE_PREFIX + url,
            });
        }
    }
    return results;
}
