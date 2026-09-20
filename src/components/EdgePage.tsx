import type { ReactNode } from "react";
import { Heading, Stack, Text } from "@/components/ui";

/**
 * The frame of the pages the app shows when something is missing or broke:
 * one centred column, a serif line, an italic note and the way out. It sits
 * under `SiteHeader` like any other screen, so the back arrow and the menu
 * are still there; only `global-error.tsx`, which replaces the layout,
 * renders it bare.
 */
export function EdgePage({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  /** The way out: a link or two, or the retry button. */
  children: ReactNode;
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 pb-24">
      <Stack gap={5} align="center" className="w-full max-w-md text-center">
        <Stack gap={3} align="center">
          <Heading level="title-xl" as="h1" className="text-balance">
            {title}
          </Heading>
          <Text
            variant="subtitle"
            tone="secondary"
            as="p"
            className="leading-relaxed text-balance"
          >
            {note}
          </Text>
        </Stack>
        <Stack gap={1} align="center">
          {children}
        </Stack>
      </Stack>
    </div>
  );
}
