import Link from "next/link";

const PRIMARY = [
  { href: "/armari", label: "El meu armari" },
  { href: "/emprovador", label: "Emprovador" },
  { href: "/paleta", label: "Paletes" },
];

const SECONDARY = [
  { href: "/stats", label: "estadístiques" },
  { href: "/settings", label: "configuració" },
];

export default function HomePage() {
  return (
    <div className="flex-1 grid grid-rows-[1fr_auto_1fr] px-6 py-12 md:py-20">
      {/* Hero: wordmark + manifest, ancorats a la part inferior de la primera fila */}
      <section className="self-end flex flex-col items-center text-center gap-5">
        <h1 className="font-serif text-6xl md:text-8xl tracking-tight leading-[0.95] text-foreground">
          el meu armari
        </h1>
        <p className="font-serif italic text-base md:text-lg text-foreground-secondary">
          un estudi d&apos;harmonia visual
        </p>
      </section>

      {/* Divisor tipografic mid-page */}
      <div className="flex justify-center py-16 md:py-24">
        <div className="h-px w-16 bg-border" aria-hidden />
      </div>

      {/* Navegacio: primaria centrada, secundaria discreta al peu */}
      <section className="self-start flex flex-col items-center gap-14">
        <nav className="flex flex-col items-center gap-4">
          {PRIMARY.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="group relative font-serif text-xl text-foreground transition-transform duration-200 active:scale-[0.96]"
            >
              <span className="transition-opacity duration-200 group-active:opacity-70">
                {entry.label}
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 right-0 -bottom-1 h-px bg-foreground origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out will-change-transform"
              />
            </Link>
          ))}
        </nav>

        <nav className="flex items-center gap-6 font-serif italic text-sm text-foreground-secondary">
          {SECONDARY.map((entry, i) => (
            <span key={entry.href} className="inline-flex items-center gap-6">
              {i > 0 && (
                <span
                  aria-hidden
                  className="inline-block h-1 w-1 rounded-full bg-border"
                />
              )}
              <Link
                href={entry.href}
                className="hover:text-foreground transition-colors duration-300"
              >
                {entry.label}
              </Link>
            </span>
          ))}
        </nav>

      </section>
    </div>
  );
}
