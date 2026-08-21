import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Width = "narrow" | "form" | "reading" | "wide" | "full";

const WIDTH_CLASS: Record<Width, string> = {
  narrow: "max-w-lg",
  form: "max-w-2xl",
  reading: "max-w-2xl",
  wide: "max-w-5xl",
  // For grids that must hold a fixed number of columns whatever the
  // screen: seven days do not get to be seven slivers because the
  // reading measure of a page of prose is 64rem.
  full: "max-w-7xl",
};

interface Props extends ComponentPropsWithoutRef<"div"> {
  width?: Width;
  className?: string;
  children?: ReactNode;
}

export function PageContainer({
  width = "wide",
  className,
  ...rest
}: Props) {
  const classes = [
    WIDTH_CLASS[width],
    "mx-auto w-full px-6 md:px-10 pb-24",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <div className={classes} {...rest} />;
}
