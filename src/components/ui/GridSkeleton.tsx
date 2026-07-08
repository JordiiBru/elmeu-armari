/**
 * Placeholder grid used as a Suspense fallback for the armari route.
 * Same shape as the real grid so the layout doesn't jump when
 * content resolves.
 */
export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      aria-hidden
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-y-16"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="aspect-[3/4] w-full bg-surface animate-pulse" />
          <div className="h-3 w-24 bg-surface animate-pulse" />
          <div className="h-2 w-16 bg-surface animate-pulse" />
        </div>
      ))}
    </div>
  );
}
