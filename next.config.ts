import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep sharp's native binding out of the Turbopack bundle. The route also
  // imports it only when a photo is attached.
  serverExternalPackages: ["sharp"],
  // File tracing follows require() and misses libvips-cpp.so, which sharp
  // dlopens. Without that .so the serverless function throws while loading
  // the route. Include the Linux binaries the Vercel Node runtime can load.
  outputFileTracingIncludes: {
    "/api/meals/parse": [
      "./node_modules/sharp/**/*",
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-linuxmusl-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linuxmusl-x64/**/*",
    ],
  },
};

export default nextConfig;
