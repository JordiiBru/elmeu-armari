"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction } from "@/app/login/actions";
import { Button, Field, Input, Stack, Text } from "@/components/ui";

export function LoginForm({ next }: { next: string | null }) {
  const t = useTranslations("auth.login");
  const [state, formAction, isPending] = useActionState(loginAction, null);

  const message = !state
    ? null
    : state.error === "lockedOut"
      ? t("errors.lockedOut", { seconds: state.seconds })
      : t(`errors.${state.error}`);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {next && <input type="hidden" name="next" value={next} />}

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
          invalid={Boolean(message)}
        />
      </Field>

      <Field label={t("password")} htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          invalid={Boolean(message)}
        />
      </Field>

      <Stack gap={4} className="pt-2">
        {message && (
          <Text
            variant="small"
            italic
            as="p"
            className="text-danger font-serif text-center"
            role="alert"
          >
            {message}
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
      </Stack>
    </form>
  );
}
