import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/LoginForm";
import { safeNextPath } from "@/lib/auth/access";
import { PageContainer, SectionHeader } from "@/components/ui";

/**
 * The only screen anyone sees without a session, and the only one with
 * no way in from anywhere else: there is no public sign-up, so there is
 * nothing here but the two fields.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const t = await getTranslations("auth.login");
  const { next } = await searchParams;

  return (
    <PageContainer width="narrow">
      <SectionHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        level="title-xl"
      />
      <LoginForm next={safeNextPath(next)} />
    </PageContainer>
  );
}
