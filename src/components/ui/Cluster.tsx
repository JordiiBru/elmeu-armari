import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

type Gap = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type Align = "start" | "center" | "end" | "baseline" | "stretch";
type Justify = "start" | "center" | "end" | "between";

const GAP_CLASS: Record<Gap, string> = {
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-6",
  6: "gap-8",
  7: "gap-12",
  8: "gap-16",
};

const ALIGN_CLASS: Record<Align, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
  stretch: "items-stretch",
};

const JUSTIFY_CLASS: Record<Justify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

type ClusterOwnProps<E extends ElementType> = {
  as?: E;
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  className?: string;
  children?: ReactNode;
};

type ClusterProps<E extends ElementType> = ClusterOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof ClusterOwnProps<E>>;

export function Cluster<E extends ElementType = "div">({
  as,
  gap = 4,
  align = "center",
  justify,
  wrap,
  className,
  ...rest
}: ClusterProps<E>) {
  const Tag = (as ?? "div") as ElementType;
  const classes = [
    "flex",
    wrap ? "flex-wrap" : null,
    GAP_CLASS[gap],
    ALIGN_CLASS[align],
    justify ? JUSTIFY_CLASS[justify] : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <Tag className={classes} {...rest} />;
}
