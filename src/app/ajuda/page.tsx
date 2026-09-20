export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { PageContainer, SectionHeader, Stack, Text, Heading } from "@/components/ui";

/**
 * What the app is and the rules nobody can see. Behind the login like
 * everything else (`access.ts` names nothing here, so the proxy closes it),
 * and one page rather than a sheet so a hint can link to a section.
 */
export default async function HelpPage() {
  const t = await getTranslations("help");

  // Written out key by key so a missing translation is a type error, not a
  // blank paragraph. The ids double as anchors: the hints link to
  // `/ajuda#<id>`.
  const sections = [
    {
      id: "what",
      title: t("sections.what.title"),
      paragraphs: [t("sections.what.p1"), t("sections.what.p2")],
    },
    {
      id: "flow",
      title: t("sections.flow.title"),
      paragraphs: [
        t("sections.flow.p1"),
        t("sections.flow.p2"),
        t("sections.flow.p3"),
        t("sections.flow.p4"),
      ],
    },
    {
      id: "colours",
      title: t("sections.colours.title"),
      paragraphs: [t("sections.colours.p1"), t("sections.colours.p2"), t("sections.colours.p3")],
    },
    {
      id: "numbers",
      title: t("sections.numbers.title"),
      paragraphs: [t("sections.numbers.p1"), t("sections.numbers.p2")],
    },
    {
      id: "rules",
      title: t("sections.rules.title"),
      paragraphs: [
        t("sections.rules.r1"),
        t("sections.rules.r2"),
        t("sections.rules.r3"),
        t("sections.rules.r4"),
        t("sections.rules.r5"),
      ],
    },
  ];

  return (
    <PageContainer width="reading">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />
      <Stack gap={8}>
        {sections.map(({ id, title, paragraphs }) => (
          <Stack key={id} as="section" id={id} gap={3} className="scroll-mt-20">
            <Heading level="title">{title}</Heading>
            {paragraphs.map((text, i) => (
              <Text key={i} as="p" className="font-serif leading-relaxed">
                {text}
              </Text>
            ))}
          </Stack>
        ))}
      </Stack>
    </PageContainer>
  );
}
