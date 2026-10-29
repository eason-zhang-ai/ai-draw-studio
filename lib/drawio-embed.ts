/**
 * Public drawio editor host.
 *
 * Kept in its own module so client components can read the default without
 * pulling in lib/runtime-capabilities.ts, which spawns processes on the server.
 */
export const DEFAULT_DRAWIO_EMBED_BASE = "https://embed.diagrams.net";
