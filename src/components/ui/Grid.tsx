import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Gap = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const GAP_X_CLASS: Record<Gap, string> = {
  1: "gap-x-1",
  2: "gap-x-2",
  3: "gap-x-3",
  4: "gap-x-4",
  5: "gap-x-6",
  6: "gap-x-8",
  7: "gap-x-12",
  8: "gap-x-16",
};

const GAP_Y_CLASS: Record<Gap, string> = {
  1: "gap-y-1",
  2: "gap-y-2",
  3: "gap-y-3",
  4: "gap-y-4",
  5: "gap-y-6",
  6: "gap-y-8",
  7: "gap-y-12",
  8: "gap-y-16",
};

/**
 * Editorial responsive grid. Defaults to 2 / 3 / 4 columns at mobile /
 * sm / md breakpoints — the app's canonical density. Override with
 * `cols` for one-off layouts.
 */
interface Props extends ComponentPropsWithoutRef<"div"> {
  cols?: "editorial" | "stats" | "palette" | "library";
  gapX?: Gap;
  gapY?: Gap;
  className?: string;
  children?: ReactNode;
}

const COLS_CLASS = {
  // Editorial density: fewer columns at wide breakpoints so each piece
  // has real presence instead of feeling like a thumbnail wall.
  editorial: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4",
  stats: "grid grid-cols-4 sm:grid-cols-8",
  palette: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  // An outfit collage is two or three photographs in one frame, so it
  // needs more width than a single piece, not less: at five columns the
  // captions wrapped onto two lines and the row went ragged.
  library: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
} as const;

export function Grid({
  cols = "editorial",
  gapX = 5,
  gapY = 6,
  className,
  ...rest
}: Props) {
  const classes = [
    COLS_CLASS[cols],
    GAP_X_CLASS[gapX],
    GAP_Y_CLASS[gapY],
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <div className={classes} {...rest} />;
}
