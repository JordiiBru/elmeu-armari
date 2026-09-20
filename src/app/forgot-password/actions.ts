"use server";

import { MIN_PASSWORD_LENGTH } from "@/lib/auth/policy";
import { recoverAccount } from "@/lib/auth/service";

export type ForgotPasswordState =
  | {
      error:
        | "missingFields"
        | "mismatch"
        | "invalid"
        | "busy"
        | "tooShort"
        | "tooLong";
      username: string;
    }
  | { recoveryCode: string }
  | null;

/**
 * Public on purpose: it is what someone who cannot sign in reaches. It
 * proves possession of the recovery code instead of the old password, and
 * `recoverAccount` spends from the same attempt budget as the login.
 */
export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const username = String(formData.get("username") ?? "");
  const code = String(formData.get("code") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (!username.trim() || !code.trim() || !next || !confirmation) {
    return { error: "missingFields", username };
  }
  if (next !== confirmation) return { error: "mismatch", username };
  if (next.length < MIN_PASSWORD_LENGTH) return { error: "tooShort", username };

  const result = await recoverAccount(username, code, next);
  if (!result.ok) return { error: result.error, username };
  return { recoveryCode: result.recoveryCode };
}
