import type { ComponentPropsWithoutRef } from "react";

const BASE =
  "w-full h-10 bg-transparent border-0 border-b border-border px-0 " +
  "font-serif text-base text-text-primary " +
  "placeholder:text-text-secondary placeholder:italic placeholder:font-serif " +
  "focus:outline-none focus:border-text-primary " +
  "transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] " +
  "disabled:opacity-40 disabled:cursor-not-allowed";

type Props = ComponentPropsWithoutRef<"input"> & {
  invalid?: boolean;
};

export function Input({ invalid, className, ...rest }: Props) {
  const classes = [BASE, invalid ? "border-danger" : "", className]
    .filter(Boolean)
    .join(" ");
  return <input className={classes} {...rest} />;
}
