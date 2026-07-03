import Link from "next/link";
import SeasonMark from "@/components/SeasonMark";
import SeasonSelector from "@/components/SeasonSelector";

const PRIMARY = [
  { href: "/armari", label: "El meu armari" },
  { href: "/paleta", label: "Paletes" },
];

const SECONDARY = [
  { href: "/stats", label: "estadístiques" },
  { href: "/settings", label: "configuració" },
];

export default function HomePage() {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-between px-6 py-10 md:py-16">
      <SeasonMark />
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-4 mt-6 md:mt-12">
        <h1 className="font-serif text-5xl md:text-7xl tracking-tight text-foreground">
          el meu armari
        </h1>
        <p className="font-serif italic text-base md:text-lg text-foreground-secondary max-w-md">
          un estudi d&apos;harmonia visual
        </p>
      </section>

      {/* Navegacio primaria */}
      <nav className="flex flex-col items-center gap-5">
        {PRIMARY.map((entry) => (
          <Link
            key={entry.href}
            href={entry.href}
            className="group inline-flex items-center gap-3 text-foreground transition-colors duration-300"
          >
            <span className="font-serif text-lg">{entry.label}</span>
            <span
              aria-hidden
              className="inline-block transition-[transform,color] duration-500 group-hover:translate-x-1"
              style={{ color: "var(--accent)" }}
            >
              →
            </span>
          </Link>
        ))}
      </nav>

      {/* Peu: navegacio secundaria + selector d'estacio */}
      <footer className="w-full flex flex-col items-center gap-6">
        <nav className="flex items-center gap-6 text-sm tracking-wide text-foreground-secondary">
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

        <div
          aria-hidden
          className="h-px w-24 transition-colors duration-700"
          style={{ backgroundColor: "var(--accent)" }}
        />

        <SeasonSelector />
      </footer>
    </div>
  );
}
