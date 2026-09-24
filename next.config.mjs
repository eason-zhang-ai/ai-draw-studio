/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Force the vendored skill assets into the serverless bundle.
   *
   * They are read at runtime through fully dynamic paths
   * (`loadSkillFile(skill, ...parts)` -> `path.join(process.cwd(), "skills", ...)`),
   * which static file tracing cannot resolve on its own. Its directory-level
   * inference happens to cover us today, but a missed file fails SILENTLY —
   * the loader returns null and generation quietly loses the skill reference —
   * so declare it explicitly rather than depending on that inference.
   *
   * `/api/**` (rather than a per-route list) so newly added routes are covered
   * automatically; the whole directory is only ~1.3MB.
   */
  outputFileTracingIncludes: {
    "/api/**": ["./skills/**"],
  },
  async headers() {
    return [
      {
        // Excalidraw registers `beforeunload`/`unload` listeners to warn about
        // unsaved changes. Chromium 115+ gates these behind the `unload`
        // Permissions-Policy feature; without opting in it logs a console
        // violation: "Permissions policy violation: unload is not allowed in
        // this document." Allowing it for same-origin restores the intended
        // unsaved-changes prompt and silences the noise.
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "unload=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
