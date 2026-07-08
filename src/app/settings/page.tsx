import { ImportForm } from "@/components/ImportForm";
import { findAllGarments } from "@/lib/prendas/service";

export default async function SettingsPage() {
  const garments = await findAllGarments();

  return (
    <div className="max-w-2xl mx-auto w-full px-6 md:px-10 pb-24">
      <header className="pt-2 pb-8 flex flex-col gap-2">
        <span className="type-caption">
          arxiu
        </span>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-[0.95]">
          configuració
        </h1>
      </header>

      <div className="flex flex-col divide-y divide-border">
        <section className="flex flex-col gap-4 py-10">
          <h2 className="type-caption">
            exportar
          </h2>
          <p className="font-serif italic text-base text-foreground-secondary max-w-md">
            descarrega totes les teves peces en format json. útil com a còpia de seguretat o per migrar a un altre dispositiu.
          </p>
          <p className="type-caption tabular-nums">
            {garments.length} peces a l&apos;arxiu
          </p>
          <a
            href="/api/export"
            download
            className="group relative self-start font-serif italic text-base text-foreground active:scale-[0.98]"
          >
            <span>→ descarregar json</span>
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 -bottom-1 h-px w-full bg-foreground origin-left transition-transform duration-500 ease-out scale-x-0 group-hover:scale-x-100"
            />
          </a>
        </section>

        <section className="flex flex-col gap-4 py-10">
          <h2 className="type-caption">
            importar
          </h2>
          <p className="font-serif italic text-base text-foreground-secondary max-w-md">
            puja un fitxer json exportat prèviament.
          </p>
          <ImportForm />
        </section>
      </div>
    </div>
  );
}
