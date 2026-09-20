import { randomInt } from "node:crypto";

/**
 * The recovery code: what lets someone who forgot the password choose a new
 * one without the person who runs the server.
 *
 * Twenty characters from a 32-letter alphabet is 100 bits, so it cannot be
 * guessed and needs no lockout of its own; the only cost of a wrong guess is
 * the hash it takes to refuse it, which the global attempt budget already
 * bounds. No look-alikes (0/O, 1/I): it gets written on paper and typed back.
 * Shown once, when the owner chooses a password, and stored only as an
 * Argon2id hash. It is single-use in effect: recovering the account issues a
 * new one.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 20;
const GROUP = 5;

export function generateRecoveryCode(): string {
  let raw = "";
  for (let i = 0; i < LENGTH; i++) raw += ALPHABET[randomInt(ALPHABET.length)];
  return formatRecoveryCode(raw);
}

/** `ABCDE-FGHJK-LMNPQ-RSTUV`, the way it is shown and written down. */
export function formatRecoveryCode(raw: string): string {
  const groups: string[] = [];
  for (let i = 0; i < raw.length; i += GROUP) groups.push(raw.slice(i, i + GROUP));
  return groups.join("-");
}

/** What is compared and hashed: case and separators do not matter, so a code
 * typed in lower case, with spaces, or without the dashes still works. */
export function normalizeRecoveryCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
