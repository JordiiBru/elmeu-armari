import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { PageContainer, SectionHeader } from "@/components/ui";

/**
 * Reachable two ways: sent here by the proxy while the password is still
 * the temporary one the admin handed out, or opened on purpose from the
 * menu. The copy is the only difference.
 */
export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations("auth.changePassword");
  const forced = session.user.mustChangePw;

  return (
    <PageContainer width="narrow">
      <SectionHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={forced ? t("forcedSubtitle") : t("subtitle")}
        level="title-xl"
      />
      <ChangePasswordForm />
    </PageContainer>
  );
}
