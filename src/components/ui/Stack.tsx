import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

type Gap = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type Align = "start" | "center" | "end" | "baseline" | "stretch";

const GAP_CLASS: Record<Gap, string> = {
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-6",
  6: "gap-8",
  7: "gap-12",
  8: "gap-16",
  9: "gap-24",
};

const ALIGN_CLASS: Record<Align, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
  stretch: "items-stretch",
};

type StackOwnProps<E extends ElementType> = {
  as?: E;
  gap?: Gap;
  align?: Align;
  className?: string;
  children?: ReactNode;
};

type StackProps<E extends ElementType> = StackOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof StackOwnProps<E>>;

export function Stack<E extends ElementType = "div">({
  as,
  gap = 4,
  align,
  className,
  ...rest
}: StackProps<E>) {
  const Tag = (as ?? "div") as ElementType;
  const classes = [
    "flex flex-col",
    GAP_CLASS[gap],
    align ? ALIGN_CLASS[align] : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <Tag className={classes} {...rest} />;
}
