import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.1.47"],
  images: {
    // Every <Image> in the app already passes `unoptimized` — sharp
    // pre-processes uploads to final WebP, so Next's own optimizer would
    // just re-encode losslessly-produced output. Disabling it globally
    // also removes the /_next/image route entirely, closing off the
    // reachable attack surface for GHSA-q8wf-6r8g-63ch (image optimizer
    // DoS via SVG) and the nested sharp/postcss CVEs Next bundles for it
    // — none of which npm can currently patch via a version bump (see
    // package.json comment).
    unoptimized: true,
  },
};

export default nextConfig;
