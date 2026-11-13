import type { NextConfig } from "next";

/*
 * GitHub Pages static export
 * --------------------------
 * The sandbox dev/prod path keeps the default "standalone" output.
 * Setting BUILD_TARGET=pages (done automatically in the GitHub Actions
 * deploy workflow) switches to "export", producing a fully static `out/`
 * directory that can be served by GitHub Pages.
 *
 * BASE_PATH is set automatically by the workflow:
 *   - User/org pages  (username.github.io)        -> ""   (served from root)
 *   - Project pages   (username.github.io/repo)    -> "/repo"
 */
const isPagesBuild = process.env.BUILD_TARGET === "pages";
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  output: isPagesBuild ? "export" : "standalone",
  // basePath/assetPrefix make Next-emitted assets (_next/*, fonts) resolve
  // correctly under a GitHub Pages project subpath.
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  // Static export requires unoptimized images (we use plain <img> tags).
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["*.space-z.ai", "*.chatglm.cn"],
};

export default nextConfig;
