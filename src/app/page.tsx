import Link from "next/link";

const NAV_ITEMS = [
  {
    href: "/add",
    title: "Afegir peça",
    description: "Registra una nova peça al teu armari",
  },
  {
    href: "/armari",
    title: "El meu armari",
    description: "Veu i gestiona totes les teves peces",
  },
  {
    href: "/paleta",
    title: "Paletes de color",
    description: "Paletes Sanzo Wada per combinar colors",
  },
  {
    href: "/stats",
    title: "Estadístiques",
    description: "Distribució per categoria, temporada, fit i colors",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-2">
        <h1 className="text-2xl font-semibold mb-6">El meu armari</h1>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block border rounded p-4 hover:bg-gray-50 transition-colors"
          >
            <p className="font-medium text-sm">{item.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
