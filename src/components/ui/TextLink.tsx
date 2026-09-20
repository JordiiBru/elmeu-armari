import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

/**
 * The link twin of `TextButton`: the quiet italic way to go somewhere.
 * Exported as a class string too, for the one place that cannot use
 * `next/link` (`global-error.tsx` renders outside the router).
 */
export const TEXT_LINK_CLASS =
  "group inline-flex min-h-11 items-center font-serif italic type-small text-text-secondary outline-none " +
  "transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:text-text-primary " +
  "focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function TextLink({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      className={[TEXT_LINK_CLASS, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
