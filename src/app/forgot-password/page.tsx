import { getTranslations } from "next-intl/server";
import { AuthScreen } from "@/components/AuthScreen";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

/**
 * Reachable without a session, like the login it hangs off. There is no
 * e-mail behind it: the way back in is the recovery code the owner was
 * shown when they chose the password.
 */
export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgot");
  return (
    <AuthScreen title={t("title")} note={t("note")}>
      <ForgotPasswordForm />
    </AuthScreen>
  );
}
