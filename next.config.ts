import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  // Dev only: `next dev` refuses a cross-origin request it does not
  // recognise, and a refused origin never finishes hydrating — the page
  // paints but nothing is clickable. Testing on a phone means the LAN
  // address, and DHCP moves it, so allow the subnet rather than pinning
  // one host and rediscovering this every few weeks.
  allowedDevOrigins: ["192.168.1.*", "172.20.10.*", "*.local"],
  // "Què em poso?" moved to the root of the hierarchy. The NFC tag by the
  // wardrobe still points at the old path, and reprogramming a sticker is
  // not a deploy step anyone remembers.
  async redirects() {
    return [
      { source: "/bugaderia/avui", destination: "/avui", permanent: true },
    ];
  },
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

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
