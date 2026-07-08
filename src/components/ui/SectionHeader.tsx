import type { ReactNode } from "react";
import { Heading } from "./Heading";
import { Text } from "./Text";
import { Stack } from "./Stack";

type Level = "hero" | "title-xl" | "title";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  level?: Level;
  className?: string;
}

/**
 * Canonical page header: optional caption eyebrow, serif heading, and
 * optional italic subtitle. Used by every top-level route.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  level = "hero",
  className,
}: Props) {
  return (
    <Stack as="header" gap={2} className={`pt-2 pb-8 md:pb-10 ${className ?? ""}`}>
      {eyebrow && <Text variant="caption">{eyebrow}</Text>}
      <Heading level={level}>{title}</Heading>
      {subtitle && (
        <Text variant="subtitle" tone="secondary" as="p" className="max-w-lg leading-relaxed">
          {subtitle}
        </Text>
      )}
    </Stack>
  );
}
