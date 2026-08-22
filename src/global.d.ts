import type { Locale } from "@/i18n/config";
import type messages from "../messages/ca.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    // Catalan is the source of truth for keys: an unknown key is a type
    // error everywhere it is used.
    Messages: typeof messages;
  }
}
