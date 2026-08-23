import type { ReactNode } from "react";
import { Heading, Stack, Text } from "@/components/ui";

/**
 * The frame the two signed-out screens share. It centres one narrow
 * column in the viewport instead of hanging a page header off the top
 * like every other route: there is nothing else on these pages for a
 * header to sit above, and a form floating under an eyebrow read as a
 * section of a page that was not there.
 *
 * Everything the screen does not need is gone. What is left is the
 * name of the action, the fields, and the button — the same serif
 * heading and microcaps labels as the rest of the app, only alone.
 */
export function AuthScreen({
  title,
  note,
  children,
}: {
  title: string;
  /** One line, and only when the screen would otherwise be a surprise. */
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 pb-16">
      <div className="w-full max-w-[19rem]">
        <Stack as="header" gap={2} className="pb-10 text-center">
          <Heading level="title-xl">{title}</Heading>
          {note && (
            <Text variant="small" tone="secondary" italic as="p" className="font-serif">
              {note}
            </Text>
          )}
        </Stack>
        {children}
      </div>
    </div>
  );
}
