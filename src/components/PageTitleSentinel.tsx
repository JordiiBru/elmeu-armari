"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePageTitleContext } from "@/lib/PageTitleContext";

// Roughly the sticky header's own height (pt-6 + 44px content + pb-4):
// shrinking the observed root by this much means "in view" turns false
// the moment the real title would start sliding in behind the header,
// not only once it is fully gone.
const HEADER_HEIGHT_PX = 88;

/**
 * Wraps a page's real title and reports it — text and visibility — to
 * `PageTitleProvider`, so `SiteHeader` knows what to fade in once this
 * one scrolls away. A thin client boundary around an otherwise
 * server-renderable heading, not a reason to make the whole
 * `SectionHeader` a client component.
 */
export function PageTitleSentinel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { setPageTitle, setTitleVisible } = usePageTitleContext();

  useEffect(() => {
    setPageTitle(title);
    return () => setPageTitle(null);
  }, [title, setPageTitle]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setTitleVisible(entry.isIntersecting),
      { rootMargin: `-${HEADER_HEIGHT_PX}px 0px 0px 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // setTitleVisible is stable for the provider's lifetime; re-running
    // this per render would tear down and rebuild the observer on every
    // scroll-driven state change elsewhere in the tree.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref}>{children}</div>;
}
