export const dynamic = "force-dynamic";

import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { palettes, paletteColors } from "@/lib/colors";
import { PageContainer, SectionHeader, Text } from "@/components/ui";

/** The combination shown in "how a colour reaches a palette": three colours,
 * so the strip reads as a palette rather than a pair. */
const EXAMPLE_PALETTE_ID = 122;

/**
 * One row of the page: a big numeral and the title on the left, the text on
 * the right, a hairline above. On a phone it stacks; on a desktop it uses the
 * width the way a printed page would, instead of a single narrow column. The
 * id is the anchor the hints link to (`/ajuda#colours`).
 */
function Row({
  id,
  number,
  title,
  children,
}: {
  id: string;
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

function P({ children }: { children: ReactNode }) {
  return <Text as="p" className="font-serif leading-relaxed">{children}</Text>;
}

/**
 * What the app is and the rules nobody can see. Behind the login like
 * everything else (`access.ts` names nothing here, so the proxy closes it),
 * and one page rather than a sheet so a hint can link to a section.
 */
export default async function HelpPage() {
  const t = await getTranslations("help");

  const example = palettes.find((p) => p.id === EXAMPLE_PALETTE_ID);
  const exampleColours = example ? paletteColors(example) : [];

  const steps = [
    { label: t("sections.flow.steps.s1"), text: t("sections.flow.p1") },
    { label: t("sections.flow.steps.s2"), text: t("sections.flow.p2") },
    { label: t("sections.flow.steps.s3"), text: t("sections.flow.p3") },
    { label: t("sections.flow.steps.s4"), text: t("sections.flow.p4") },
  ];
  const rules = [
    t("sections.rules.r1"),
    t("sections.rules.r2"),
    t("sections.rules.r3"),
    t("sections.rules.r4"),
    t("sections.rules.r5"),
  ];

  return (
    <PageContainer width="wide">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />

      <Row id="what" number="01" title={t("sections.what.title")}>
        {/* The one idea of the whole app, said large and once. */}
        <Text variant="subtitle" as="p" className="text-2xl leading-snug md:text-3xl">
          {t("sections.what.p1")}
        </Text>
        <P>{t("sections.what.p2")}</P>
      </Row>

      <Row id="flow" number="02" title={t("sections.flow.title")}>
        <ol className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {steps.map((step, i) => (
            <li key={step.label} className="flex flex-col gap-2 border-t border-border pt-3">
              <Text variant="caption" as="span" tabular>
                {String(i + 1).padStart(2, "0")} · {step.label}
              </Text>
              <P>{step.text}</P>
            </li>
          ))}
        </ol>
      </Row>

      <Row id="colours" number="03" title={t("sections.colours.title")}>
        <P>{t("sections.colours.p1")}</P>
        {example && (
          <figure className="flex flex-col gap-3">
            {/* A real combination from the dictionary: what a palette is,
                shown as itself. Flat blocks, the names underneath. */}
            <div className="flex h-24 w-full overflow-hidden border border-border md:h-32" aria-hidden>
              {exampleColours.map((c) => (
                <div key={c.hex} className="flex-1" style={{ backgroundColor: c.hex }} />
              ))}
            </div>
            <figcaption className="flex flex-col gap-1">
              <Text variant="caption" as="span">
                {exampleColours.map((c) => c.name).filter(Boolean).join(" · ")}
              </Text>
              <Text variant="small" italic tone="secondary" as="span" className="font-serif">
                {t("paletteExample", { id: String(EXAMPLE_PALETTE_ID).padStart(3, "0") })}
              </Text>
            </figcaption>
          </figure>
        )}
        <P>{t("sections.colours.p2")}</P>
        <P>{t("sections.colours.p3")}</P>
      </Row>

      <Row id="numbers" number="04" title={t("sections.numbers.title")}>
        <P>{t("sections.numbers.p1")}</P>
        <P>{t("sections.numbers.p2")}</P>
      </Row>

      <Row id="rules" number="05" title={t("sections.rules.title")}>
        <ol className="flex flex-col">
          {rules.map((rule, i) => (
            <li
              key={i}
              className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-border py-4 first:pt-0 last:border-b-0"
            >
              <Text variant="caption" as="span" tabular className="pt-1">
                {String(i + 1).padStart(2, "0")}
              </Text>
              <P>{rule}</P>
            </li>
          ))}
        </ol>
      </Row>
    </PageContainer>
  );
}
