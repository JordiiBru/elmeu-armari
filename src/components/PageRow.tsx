import type { ReactNode } from "react";

/**
 * One row of a page that reads like a printed one: a big numeral and the
 * title on the left, the content on the right, a strong hairline above. On
 * a phone it stacks; on a desktop it uses the width instead of a single
 * narrow column. Shared by `/ajuda`, `/stats` and `/settings`, so the three
 * feel like one book. The id is the anchor the help hints link to
 * (`/ajuda#colours`).
 */
export function PageRow({
  id,
  number,
  title,
  children,
}: {
  id?: string;
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20 grid gap-x-12 gap-y-6 border-t border-border-strong pt-8 pb-14 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:pt-10 md:pb-20"
    >
      <header className="flex items-baseline gap-5 md:flex-col md:items-start md:gap-3">
        <span
          aria-hidden
          className="font-serif text-5xl font-light leading-none tracking-tight text-text-secondary md:text-7xl"
        >
          {number}
        </span>
        <h2 className="type-title">{title}</h2>
      </header>
      <div className="flex max-w-[64ch] flex-col gap-5">{children}</div>
    </section>
  );
}
