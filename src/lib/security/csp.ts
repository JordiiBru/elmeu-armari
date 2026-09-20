/**
 * The Content-Security-Policy of every page, with a per-request nonce.
 *
 * Pure so it can be tested: the proxy mints the nonce, builds the policy
 * here and sends it both as the response header and as a request header,
 * which is where Next reads the nonce from to stamp its own inline
 * bootstrap scripts. next-themes' pre-paint script gets it from the layout
 * (`x-nonce`).
 *
 * `script-src` carries no `'unsafe-inline'` in production: an inline
 * script the page did not stamp with this request's nonce is refused, which
 * is the whole point of a CSP against XSS. `'strict-dynamic'` lets the
 * nonced bootstrap load the chunks it needs without listing hosts.
 *
 * `style-src` keeps `'unsafe-inline'`, and that is deliberate rather than an
 * oversight: `next/font` injects a `<style>` that Next does not nonce, and
 * the app sets `style="background-color: ..."` on colour swatches all over.
 * Inline styles cannot run script; they are a much smaller risk than
 * inline scripts.
 *
 * Dev needs `'unsafe-eval'` (React's debugging) and a websocket for HMR;
 * production gets neither.
 */
export function buildContentSecurityPolicy(nonce: string, dev: boolean): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "manifest-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self'${dev ? " ws: wss:" : ""}`,
  ].join("; ");
}

/** A fresh, unguessable value for one request. */
export function newNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}
