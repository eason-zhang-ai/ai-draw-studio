import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * What the current runtime can actually do.
 *
 * Four of this project's routes shell out to the vendored drawio-skill
 * scripts — auto-layout, style presets, C4 and file import — and those need
 * `python3` (every script) plus Graphviz `dot` (auto-layout, and the importers
 * pipe their result through it; `tred` for transitive reduction ships in the
 * same graphviz package).
 *
 * The Docker and Vercel container images install both, so everything is
 * available there. A plain Vercel deploy has neither, which would otherwise
 * turn those routes into bare 500s — so the server probes once and the UI
 * degrades instead.
 */
export interface RuntimeCapabilities {
    /** `python3` is on PATH — required by every vendored drawio-skill script. */
    python3: boolean;
    /** Graphviz `dot` is on PATH — auto-layout and the importers need it. */
    dot: boolean;
    /** Graphviz auto-layout button and the `layout_diagram` tool. */
    autoLayout: boolean;
    /** Style presets dropdown and the `apply_style` tool. */
    stylePresets: boolean;
    /** C4 multi-page generation and the `c4_diagram` tool. */
    c4: boolean;
    /** Code/config file import (SQL/Terraform/OpenAPI/Python/JS). */
    fileImport: boolean;
}

async function hasBinary(command: string, args: string[]): Promise<boolean> {
    try {
        await execFileAsync(command, args, { timeout: 5000 });
        return true;
    } catch {
        // ENOENT (not installed) and non-zero exits both land here, which is
        // what we want: either way the binary is not usable.
        return false;
    }
}

let cached: Promise<RuntimeCapabilities> | null = null;

/**
 * Probe once per process. The installed binaries cannot change while the
 * process lives, so repeating the spawns on every request would be waste —
 * and `execFile` on a missing binary is the slow path (it has to search PATH
 * and fail).
 */
export function getRuntimeCapabilities(): Promise<RuntimeCapabilities> {
    cached ??= (async () => {
        const [python3, dot] = await Promise.all([
            hasBinary("python3", ["--version"]),
            hasBinary("dot", ["-V"]),
        ]);
        return {
            python3,
            dot,
            // Auto-layout and the importers place nodes with `dot`.
            autoLayout: python3 && dot,
            // restyle.py is pure Python — no Graphviz involved.
            stylePresets: python3,
            // c4.py builds its XML through autolayout.py.
            c4: python3 && dot,
            fileImport: python3 && dot,
        };
    })();
    return cached;
}
