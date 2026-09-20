"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  forgotPasswordAction,
  type ForgotPasswordState,
} from "@/app/forgot-password/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/policy";
import { RecoveryCodeNotice } from "@/components/RecoveryCodeNotice";
import { Button, Field, Input, Stack, Text, TextLink } from "@/components/ui";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot");
  const [state, formAction, isPending] = useActionState<ForgotPasswordState, FormData>(
    forgotPasswordAction,
    null,
  );

  if (state && "recoveryCode" in state) {
    return (
      <Stack gap={5}>
        <Text variant="small" tone="secondary" italic as="p" className="font-serif text-center">
          {t("done")}
        </Text>
        <RecoveryCodeNotice code={state.recoveryCode} href="/login" label={t("signIn")} />
      </Stack>
    );
  }

  const error = state?.error;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Field label={t("username")} htmlFor="username">
        <Input
          id="username"
          name="username"
          defaultValue={state?.username}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          invalid={error === "invalid"}
        />
      </Field>

      <Field label={t("code")} htmlFor="code">
        <Input
          id="code"
          name="code"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          required
          invalid={error === "invalid"}
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
          invalid={error === "mismatch"}
        />
      </Field>

      <Stack gap={4} className="pt-2">
        {error && (
          <Text
            variant="small"
            italic
            as="p"
            className="text-danger font-serif text-center"
            role="alert"
          >
            {t(`errors.${error}`)}
          </Text>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          loading={isPending}
          loadingText={t("submitting")}
        >
          {t("submit")}
        </Button>
        <Text variant="small" tone="secondary" italic as="p" className="font-serif text-center">
          {t("noCode")}
        </Text>
        <TextLink href="/login" className="self-center">
          {t("back")}
        </TextLink>
      </Stack>
    </form>
  );
}
