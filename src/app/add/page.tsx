import Link from "next/link";
import { AddForm } from "@/components/AddForm";

export default function AddPage() {
  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Inici</Link>
        <h1 className="text-xl font-semibold">Afegir peça</h1>
      </div>
      <AddForm />
    </div>
  );
}
