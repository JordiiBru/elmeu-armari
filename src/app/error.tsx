"use client";

import { useTranslations } from "next-intl";
import { EdgePage } from "@/components/EdgePage";
import { Button, TextLink } from "@/components/ui";

/**
 * Deliberately shows nothing about what failed: the message of a server
 * error is for the logs, and Next already puts it there.
 */
export default function ErrorPage({ reset }: { reset: () => void }) {
  const t = useTranslations("errorPages.error");

  return (
    <EdgePage title={t("title")} note={t("note")}>
      <Button variant="primary" onClick={reset}>
        {t("retry")}
      </Button>
      <TextLink href="/">{t("home")}</TextLink>
    </EdgePage>
  );
}
