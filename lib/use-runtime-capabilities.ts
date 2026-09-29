"use client";

import { useEffect, useState } from "react";
// Type-only import: erased at compile time, so this module stays client-safe
// even though lib/runtime-capabilities.ts spawns processes on the server.
import type { RuntimeCapabilities } from "@/lib/runtime-capabilities";

const NONE: RuntimeCapabilities = {
    python3: false,
    dot: false,
    autoLayout: false,
    stylePresets: false,
    c4: false,
    fileImport: false,
};

/**
 * Which Python-backed drawio-skill features this deployment can serve.
 *
 * Returns `null` until the answer arrives. Callers should keep the dependent
 * controls hidden while it is `null` rather than optimistically showing them —
 * the common container deployment would otherwise flash controls that then
 * vanish, and the toolbar only appears once draw.io has loaded anyway, so the
 * wait is invisible in practice.
 */
export function useRuntimeCapabilities(): RuntimeCapabilities | null {
    const [caps, setCaps] = useState<RuntimeCapabilities | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/capabilities")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (cancelled) return;
                // A probe that cannot be reached is treated as "no Python
                // features": failing closed beats offering buttons that would
                // only produce a 500.
                setCaps(data ?? NONE);
            })
            .catch(() => {
                if (!cancelled) setCaps(NONE);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return caps;
}
