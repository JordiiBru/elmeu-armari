"use client";

import { useState } from "react";
import Link from "next/link";
import { UI } from "@/lib/prendas/ui-strings";
import { Icon, IconButton, Sheet, Stack, Text } from "@/components/ui";

const ENTRIES = [
  { href: "/stats", label: UI.menu.stats },
  { href: "/settings", label: UI.menu.settings },
];

/**
 * Everything that is *about* the app rather than in it.
 *
 * These two used to be a row of small links at the foot of the home
 * page, under the column of primary entries. Three words on one line
 * beneath a stacked column gave the page two competing centre axes, and
 * because the words are of very different lengths the row never looked
 * centred however it was aligned. Moving them off the page removes the
 * problem rather than balancing it, and leaves the home a single column.
 *
 * It reuses `Sheet` instead of introducing a popover: the app already
 * has exactly one overlay, and a second one would be a second physics
 * for the same gesture. When there are accounts, the profile, the
 * session and the language switch are rows in this same list.
 */
export function AppMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton label={UI.menu.label} size="sm" onClick={() => setOpen(true)}>
        <Icon name="ellipsis" size={18} />
      </IconButton>

      {open && (
        <Sheet
          onClose={() => setOpen(false)}
          size="md"
          label={UI.menu.label}
          header={
            <Stack gap={1}>
              <h2 className="type-title lowercase">{UI.menu.title}</h2>
              <Text variant="small" italic tone="secondary">
                {UI.menu.subtitle}
              </Text>
            </Stack>
          }
        >
          <nav className="flex flex-col divide-y divide-border">
            {ENTRIES.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                onClick={() => setOpen(false)}
                className="group flex min-h-14 items-center justify-between gap-4 outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-elevated"
              >
                <span className="font-serif type-body">{entry.label}</span>
                <span className="text-text-secondary transition-colors duration-[var(--duration-base)] group-hover:text-text-primary">
                  <Icon name="arrow-right" size={14} />
                </span>
              </Link>
            ))}
          </nav>
        </Sheet>
      )}
    </>
  );
}
