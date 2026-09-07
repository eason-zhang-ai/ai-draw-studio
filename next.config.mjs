/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
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
