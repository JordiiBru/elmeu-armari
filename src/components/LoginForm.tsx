"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction, type LoginState } from "@/app/login/actions";
import { Button, Field, Input, Stack, Text } from "@/components/ui";

function errorMessage(
  state: LoginState,
  t: ReturnType<typeof useTranslations<"auth.login">>,
): string | null {
  if (!state) return null;
  if (state.error === "lockedOut") {
    return t("errors.lockedOut", { seconds: state.seconds });
  }
  return t(`errors.${state.error}`);
}

export function LoginForm({ next }: { next: string | null }) {
  const t = useTranslations("auth.login");
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const message = errorMessage(state, t);

  return (
    <form action={formAction} className="flex flex-col gap-7">
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

      <Stack gap={3}>
        {message && (
          <Text variant="small" italic className="text-danger font-serif" role="alert">
            {message}
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
