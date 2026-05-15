/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // The /api/deploy route reads runtime sources (the kit + the
  // builder-runtime components) from disk to assemble a complete
  // Next.js project to ship via Vercel API or as a zip. Vercel's
  // serverless function bundler doesn't include them by default —
  // Next.js's file-tracing only pulls in files that are statically
  // imported. So we ask it explicitly.
  outputFileTracingIncludes: {
    "/api/deploy": [
      "./src/kit/**/*",
      "./src/lib/**/*",
      "./src/builder/components/**/*",
      "./src/builder/threeD/**/*",
      "./src/builder/types.ts",
      "./src/builder/componentMap.ts",
      "./src/app/globals.css",
      "./package.json",
      "./tailwind.config.ts",
      "./postcss.config.mjs",
      "./tsconfig.json",
    ],
  },
};

export default nextConfig;
