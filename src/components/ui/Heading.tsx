import type { ComponentPropsWithoutRef } from "react";

type Level = "display-xl" | "display" | "hero" | "title-xl" | "title";

const LEVEL_CLASS: Record<Level, string> = {
  "display-xl": "type-display-xl",
  display: "type-display",
  hero: "type-hero",
  "title-xl": "type-title-xl",
  title: "type-title",
};

const LEVEL_TAG: Record<Level, "h1" | "h2" | "h3"> = {
  "display-xl": "h1",
  display: "h1",
  hero: "h1",
  "title-xl": "h2",
  title: "h2",
};

interface Props extends ComponentPropsWithoutRef<"h1"> {
  level: Level;
  as?: "h1" | "h2" | "h3" | "h4";
  className?: string;
}

export function Heading({ level, as, className, ...rest }: Props) {
  const Tag = as ?? LEVEL_TAG[level];
  const classes = [LEVEL_CLASS[level], className].filter(Boolean).join(" ");
  return <Tag className={classes} {...rest} />;
}
