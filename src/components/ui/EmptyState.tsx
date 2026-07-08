import type { ReactNode } from "react";
import { Stack } from "./Stack";
import { Text } from "./Text";

interface Props {
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Editorial empty state — a centered italic line with an optional
 * caption hint and one action underneath. Never a warning, never a
 * spinner. Aligns with the app's calm.
 */
export function EmptyState({ title, hint, action, className }: Props) {
  return (
    <Stack
      gap={4}
      align="center"
      className={`text-center py-16 max-w-md mx-auto ${className ?? ""}`}
    >
      <Text
        as="p"
        italic
        tone="secondary"
        className="font-serif type-subtitle"
      >
        {title}
      </Text>
      {hint && (
        <Text as="p" variant="small" tone="muted" italic className="font-serif">
          {hint}
        </Text>
      )}
      {action}
    </Stack>
  );
}
