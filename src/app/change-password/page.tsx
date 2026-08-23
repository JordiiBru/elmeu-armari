import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthScreen } from "@/components/AuthScreen";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

/**
 * Reachable two ways: sent here by the proxy while the password is still
 * the temporary one the admin handed out, or opened on purpose from the
 * menu. Only the first case needs a word of explanation.
 */
export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations("auth.changePassword");

  return (
    <AuthScreen
      title={t("title")}
      note={session.user.mustChangePw ? t("temporary") : undefined}
    >
      <ChangePasswordForm />
    </AuthScreen>
  );
}
