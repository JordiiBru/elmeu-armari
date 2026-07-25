import type { ReactNode } from "react";

/**
 * `@modal` is a parallel route slot: `default.tsx` renders `null` on any
 * `/armari/*` URL that doesn't have a matching modal route, and
 * `@modal/(.)[slug]/page.tsx` intercepts client-side navigation to
 * `/armari/[slug]` to render the garment as an overlay instead of a full
 * page swap. Direct/hard navigation to `/armari/[slug]` isn't intercepted —
 * it falls through to `[slug]/page.tsx`, which renders the same list-behind-
 * modal layout so deep links look identical either way.
 */
export default function ArmariLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
