/**
 * Estils base de formulari — editorial, sense caixes ni bordes lateral.
 * Nomes hairline inferior, tipografia neta.
 */
export const FORM_STYLES = {
  select:
    "w-full h-10 bg-transparent border-0 border-b border-border px-0 font-serif text-base text-foreground focus:outline-none focus:border-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed appearance-none pr-6 bg-no-repeat bg-[right_center] bg-[length:0.7rem_auto]",
  input:
    "w-full h-10 bg-transparent border-0 border-b border-border px-0 font-serif text-base text-foreground placeholder:text-foreground-secondary placeholder:italic placeholder:font-serif focus:outline-none focus:border-foreground transition-colors",
  label:
    "block text-[10px] tracking-[0.25em] uppercase text-foreground-secondary mb-2",
} as const;
