"use client";

import { useEffect, useRef, useState } from "react";
import { loadPanel, savePanel } from "@/lib/panel-storage";

interface UsePersistedPanelOptions<T> {
    /** Storage key (see PANEL_KEYS). */
    storageKey: string;
    /** The value to persist; written debounced whenever it changes. */
    value: T;
    /** Apply a value restored from storage. */
    onRestore: (saved: T) => void;
    enabled?: boolean;
}

/**
 * Persist one panel's current content to IndexedDB.
 *
 * Restoring is asynchronous, so the first render uses the in-memory default
 * and the stored value is applied afterwards (no hydration mismatch). Writing
 * is deliberately gated on the restore attempt having finished — otherwise the
 * initial default would immediately overwrite what is stored.
 *
 * `hydrated` tells callers when the restore has settled; canvases that take
 * their content once at mount (Excalidraw's `initialData`) use it to delay
 * mounting so they pick up the restored value directly.
 */
export function usePersistedPanel<T>({
    storageKey,
    value,
    onRestore,
    enabled = true,
}: UsePersistedPanelOptions<T>) {
    const [hydrated, setHydrated] = useState(!enabled);

    const onRestoreRef = useRef(onRestore);
    onRestoreRef.current = onRestore;

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;

        loadPanel<T>(storageKey)
            .then((saved) => {
                if (cancelled || saved === null || saved === undefined) return;
                onRestoreRef.current(saved);
            })
            .catch(() => {
                /* storage unavailable — fall back to the in-memory default */
            })
            .finally(() => {
                // Mark settled either way: a failed read must not block writes.
                if (!cancelled) setHydrated(true);
            });

        return () => {
            cancelled = true;
        };
    }, [storageKey, enabled]);

    useEffect(() => {
        if (!enabled || !hydrated) return;
        savePanel(storageKey, value);
    }, [storageKey, value, hydrated, enabled]);

    return { hydrated };
}
