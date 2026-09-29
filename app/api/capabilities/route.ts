import { getRuntimeCapabilities } from "@/lib/runtime-capabilities";

/**
 * Report which Python-backed drawio-skill features this deployment can serve.
 *
 * The UI uses this to hide the auto-layout / style-preset controls and to stop
 * accepting code-file attachments on runtimes without `python3` + Graphviz,
 * instead of letting those actions fail with a 500.
 */
export const dynamic = "force-dynamic";

export async function GET() {
    const caps = await getRuntimeCapabilities();
    return Response.json(caps, {
        headers: {
            // The answer is fixed for the lifetime of the process.
            "Cache-Control": "public, max-age=300",
        },
    });
}
