"use client";

import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

type Interactive = "static" | "clickable";

const BASE_STATIC = "cv-auto flex flex-col text-left";
const BASE_INTERACTIVE =
  "cv-auto group flex flex-col text-left outline-none " +
  "transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] " +
  "active:scale-[0.99] " +
  "focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background";

type CardOwnProps<E extends ElementType> = {
  as?: E;
  interactive?: Interactive;
  className?: string;
  children?: ReactNode;
};

type CardProps<E extends ElementType> = CardOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof CardOwnProps<E>>;

/**
 * Editorial card container. Zero border, zero radius, zero shadow.
 * The hover lift lives on the child media (`group-hover:-translate-y-1`)
 * so type stays anchored — a card that flies apart is unrefined.
 */
export function Card<E extends ElementType = "div">({
  as,
  interactive = "static",
  className,
  ...rest
}: CardProps<E>) {
  const Tag = (as ?? (interactive === "clickable" ? "button" : "div")) as ElementType;
  const classes = [
    interactive === "clickable" ? BASE_INTERACTIVE : BASE_STATIC,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <Tag className={classes} {...rest} />;
}
