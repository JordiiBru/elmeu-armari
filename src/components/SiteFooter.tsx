/**
 * Peu editorial minim amb cita del llibre font.
 * Present a totes les pagines.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full px-6 md:px-10 pt-8 pb-10 mt-auto border-t border-border">
      <div className="max-w-5xl mx-auto flex flex-col gap-3 md:flex-row md:items-baseline md:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="font-serif italic text-xs text-foreground-secondary">
            colors i combinacions extrets de
          </span>
          <span className="font-serif text-sm text-foreground">
            <span className="tracking-wide">配色事典</span>{" "}
            <span className="italic text-foreground-secondary">
              — a dictionary of color combinations
            </span>
          </span>
          <span className="font-serif italic text-xs text-foreground-secondary">
            wada sanzō (和田三造), tòquio, 1933–1934.
          </span>
        </div>
        <span className="text-[10px] tracking-[0.3em] uppercase text-foreground-secondary tabular-nums shrink-0">
          el meu armari · {year}
        </span>
      </div>
    </footer>
  );
}
