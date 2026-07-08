import type { ElementType, ComponentPropsWithoutRef } from "react";

type Variant =
  | "body"
  | "small"
  | "caption"
  | "caption-strong"
  | "subtitle"
  | "mono";

type Tone = "primary" | "secondary" | "muted" | "inverse";

const VARIANT_CLASS: Record<Variant, string> = {
  body: "type-body",
  small: "type-small",
  caption: "type-caption",
  "caption-strong": "type-caption-strong",
  subtitle: "type-subtitle",
  mono: "type-mono",
};

const TONE_CLASS: Record<Tone, string> = {
  primary: "text-text-primary",
  secondary: "text-text-secondary",
  muted: "text-text-muted",
  inverse: "text-text-inverse",
};

type TextOwnProps<E extends ElementType> = {
  as?: E;
  variant?: Variant;
  tone?: Tone;
  italic?: boolean;
  tabular?: boolean;
  truncate?: boolean;
  className?: string;
};

type TextProps<E extends ElementType> = TextOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof TextOwnProps<E>>;

export function Text<E extends ElementType = "span">({
  as,
  variant = "body",
  tone,
  italic,
  tabular,
  truncate,
  className,
  ...rest
}: TextProps<E>) {
  const Tag = (as ?? "span") as ElementType;
  const classes = [
    VARIANT_CLASS[variant],
    tone ? TONE_CLASS[tone] : null,
    italic ? "italic font-serif" : null,
    tabular ? "tabular-nums" : null,
    truncate ? "truncate" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <Tag className={classes} {...rest} />;
}
