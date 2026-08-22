import type { Locale } from "./config";
import ca from "../../messages/ca.json";
import es from "../../messages/es.json";
import en from "../../messages/en.json";

/**
 * Typing the map against `ca` is the whole safety net: a key present in
 * Catalan and missing from another locale is a type error, and
 * `npm run typecheck` is already a CI gate. "I forgot to translate that"
 * stops being something that can ship.
 */
export const messages: Record<Locale, typeof ca> = { ca, es, en };
