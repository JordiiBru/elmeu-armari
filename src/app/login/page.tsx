import { getTranslations } from "next-intl/server";
import { AuthScreen } from "@/components/AuthScreen";
import { LoginForm } from "@/components/LoginForm";
import { safeNextPath } from "@/lib/auth/access";

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
    <AuthScreen title={t("title")}>
      <LoginForm next={safeNextPath(next)} />
    </AuthScreen>
  );
}
