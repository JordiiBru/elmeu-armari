"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/app/change-password/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/policy";
import { Button, Field, Input, Stack, Text } from "@/components/ui";

export function ChangePasswordForm() {
  const t = useTranslations("auth.changePassword");
  const [state, formAction, isPending] = useActionState<
    ChangePasswordState,
    FormData
  >(changePasswordAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-7">
      <Field label={t("current")} htmlFor="current">
        <Input
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          required
          invalid={state?.error === "wrongPassword"}
        />
      </Field>

      <Field
        label={t("next")}
        htmlFor="next"
        hint={t("hint", { count: MIN_PASSWORD_LENGTH })}
      >
        <Input
          id="next"
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </Field>

      <Field label={t("confirmation")} htmlFor="confirmation">
        <Input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          invalid={state?.error === "mismatch"}
        />
      </Field>

      <Stack gap={3}>
        {state && (
          <Text variant="small" italic className="text-danger font-serif" role="alert">
            {t(`errors.${state.error}`)}
          </Text>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="self-start"
          loading={isPending}
          loadingText={t("submitting")}
        >
          {t("submit")}
        </Button>
      </Stack>
    </form>
  );
}
