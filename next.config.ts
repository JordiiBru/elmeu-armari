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
  /**
   * Sent on every response. The app is published to the internet behind
   * a login now, so the cheap browser-side mitigations stop being
   * optional.
   *
   * `script-src` keeps `'unsafe-inline'`: Next inlines its own bootstrap
   * scripts and next-themes inlines the one that paints the right theme
   * before first paint. Tightening it means minting a nonce per request
   * in proxy.ts and threading it through both, which is a change worth
   * making on its own rather than smuggled into the auth work. Dev also
   * needs `'unsafe-eval'` and a websocket for HMR — production gets
   * neither. HSTS is not here: TLS is terminated upstream by Cloudflare,
   * which already sends it, and this app is still reachable over plain
   * HTTP on the LAN.
   */
  async headers() {
    const dev = process.env.NODE_ENV !== "production";
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "manifest-src 'self'",
      `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      `connect-src 'self'${dev ? " ws: wss:" : ""}`,
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
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
