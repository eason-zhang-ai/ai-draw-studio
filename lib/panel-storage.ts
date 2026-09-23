/**
 * Tiny IndexedDB wrapper that persists each panel's CURRENT content.
 *
 * Why IndexedDB instead of localStorage:
 *  - the Excalidraw scene embeds pasted images as base64 inside `files`, so a
 *    single scene can blow past the ~5MB localStorage quota;
 *  - Excalidraw commits on every `onChange` (i.e. every drag), and a
 *    synchronous multi-MB `localStorage.setItem` would jank the interaction.
 *
 * Writes are debounced per key. Every failure degrades to "no persistence"
 * (private mode, quota exceeded, blocked upgrade) rather than breaking the
 * canvas — the app must keep working with storage unavailable.
 */

const DB_NAME = "ai-draw-studio";
const DB_VERSION = 1;
const STORE = "panels";
const WRITE_DELAY_MS = 400;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === "undefined") return Promise.resolve(null);
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve) => {
        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    db.createObjectStore(STORE);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
            request.onblocked = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
    return dbPromise;
}

/** Read a previously stored panel value; null when absent or unavailable. */
export async function loadPanel<T>(key: string): Promise<T | null> {
    const db = await openDb();
    if (!db) return null;
    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE, "readonly");
            const request = tx.objectStore(STORE).get(key);
            request.onsuccess = () => resolve((request.result as T) ?? null);
            request.onerror = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
}

async function writePanel(key: string, value: unknown): Promise<void> {
    const db = await openDb();
    if (!db) return;
    return new Promise((resolve) => {
        const fail = (reason: unknown) => {
            console.warn(
                `[panel-storage] failed to persist "${key}" — the canvas keeps working, but it will not survive a reload.`,
                reason
            );
            resolve();
        };
        try {
            const tx = db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).put(value, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => fail(tx.error);
            tx.onabort = () => fail(tx.error);
        } catch (error) {
            fail(error);
        }
    });
}

const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Debounced write — safe to call on every keystroke / canvas change. */
export function savePanel(key: string, value: unknown): void {
    const pending = pendingTimers.get(key);
    if (pending) clearTimeout(pending);
    pendingTimers.set(
        key,
        setTimeout(() => {
            pendingTimers.delete(key);
            void writePanel(key, value);
        }, WRITE_DELAY_MS)
    );
}

/** Storage keys, kept in one place so they are easy to audit/reset. */
export const PANEL_KEYS = {
    drawio: "panel:drawio:xml",
    mermaid: "panel:mermaid:definition",
    plantuml: "panel:plantuml:definition",
    kroki: "panel:kroki:definition",
    graphviz: "panel:graphviz:definition",
    excalidraw: "panel:excalidraw:scene",
} as const;
