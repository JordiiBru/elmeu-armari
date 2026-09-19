"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface PageTitleContextValue {
  title: string | null;
  /** Whether the real, on-page title is currently in view. False once it
   * has scrolled up behind the sticky header — the signal `SiteHeader`
   * uses to fade in its own compact copy. */
  visible: boolean;
  setPageTitle: (title: string | null) => void;
  setTitleVisible: (visible: boolean) => void;
}

const PageTitleContext = createContext<PageTitleContextValue | null>(null);

/**
 * Bridges a page's own `SectionHeader` to the sticky `SiteHeader` above
 * it, so the header can fade in a compact copy of the title once the
 * real one scrolls out of view — the large-title-collapsing-into-the-
 * nav-bar pattern, without `SiteHeader` (rendered once, above every
 * route) needing to know what page it is on.
 */
export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setPageTitle] = useState<string | null>(null);
  const [visible, setTitleVisible] = useState(true);

  return (
    <PageTitleContext.Provider value={{ title, visible, setPageTitle, setTitleVisible }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitleContext(): PageTitleContextValue {
  const ctx = useContext(PageTitleContext);
  if (!ctx) {
    throw new Error("usePageTitleContext must be used within a PageTitleProvider");
  }
  return ctx;
}
