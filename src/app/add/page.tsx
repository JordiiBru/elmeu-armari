import { AddForm } from "@/components/AddForm";

export default function AddPage() {
  return (
    <div className="max-w-lg mx-auto w-full px-6 md:px-10 pb-24">
      <header className="pt-2 pb-8 flex flex-col gap-2">
        <span className="text-[11px] tracking-[0.25em] uppercase text-foreground-secondary">
          nova peça
        </span>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-[0.95]">
          afegir al catàleg
        </h1>
      </header>
      <AddForm />
    </div>
  );
}
