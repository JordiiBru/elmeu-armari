import { notFound } from "next/navigation";
import { findGarmentById } from "@/lib/prendas/service";
import { EditForm } from "@/components/EditForm";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const garment = await findGarmentById(id);
  if (!garment) notFound();

  return (
    <div className="max-w-lg mx-auto w-full px-6 md:px-10 pb-24">
      <header className="pt-2 pb-8 flex flex-col gap-2">
        <span className="text-[11px] tracking-[0.25em] uppercase text-foreground-secondary">
          editar peça
        </span>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-[0.95]">
          revisar la fitxa
        </h1>
      </header>
      <EditForm
        garment={garment}
        defaultSeasons={garment.seasons.map((s) => s.season)}
        defaultHexColors={garment.colors.map((c) => c.hex)}
      />
    </div>
  );
}
