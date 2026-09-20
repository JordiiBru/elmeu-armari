import { useTranslations } from "next-intl";
import { Stack, Text, TextLink } from "@/components/ui";

/**
 * The recovery code, on screen exactly once. It is not stored anywhere the
 * app can show it again (only its hash is), so the way out of this screen is
 * a deliberate "I have it" and not a redirect that would take it away.
 */
export function RecoveryCodeNotice({
  code,
  href,
  label,
}: {
  code: string;
  href: string;
  label: string;
}) {
  const t = useTranslations("auth.recoveryCode");
  return (
    <Stack gap={5} className="text-center">
      <Text variant="small" tone="secondary" italic as="p" className="font-serif">
        {t("body")}
      </Text>
      <p
        className="font-mono text-base tracking-wider text-text-primary tabular-nums select-all break-all"
        aria-label={t("codeLabel")}
      >
        {code}
      </p>
      <TextLink href={href} className="self-center">
        {label}
      </TextLink>
    </Stack>
  );
}
