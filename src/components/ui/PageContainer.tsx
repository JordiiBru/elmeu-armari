import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Width = "narrow" | "form" | "reading" | "wide";

const WIDTH_CLASS: Record<Width, string> = {
  narrow: "max-w-lg",
  form: "max-w-2xl",
  reading: "max-w-2xl",
  wide: "max-w-5xl",
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
