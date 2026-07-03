import Link from "next/link";
import SeasonSelector from "@/components/SeasonSelector";

const ENTRIES = [
  { href: "/armari", label: "El meu armari" },
  { href: "/paleta", label: "Paletes" },
];

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-between px-6 py-12 md:py-20">
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-4 mt-8 md:mt-16">
        <h1 className="font-serif text-5xl md:text-7xl tracking-tight text-foreground">
          el meu armari
        </h1>
        <p className="font-serif italic text-base md:text-lg text-foreground-secondary max-w-md">
          un estudi d&apos;harmonia visual
        </p>
      </section>

      {/* Selector d'estacio integrat a la composicio */}
      <section className="w-full max-w-2xl my-16 md:my-24">
        <SeasonSelector />
      </section>

      {/* Navegacio minima */}
      <nav className="flex flex-col items-center gap-5">
        {ENTRIES.map((entry) => (
          <Link
            key={entry.href}
            href={entry.href}
            className="group inline-flex items-center gap-3 text-foreground hover:text-accent transition-colors duration-300"
          >
            <span className="font-serif text-lg">{entry.label}</span>
            <span
              aria-hidden
              className="inline-block transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
