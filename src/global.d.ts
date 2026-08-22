import type { DefaultSession } from "next-auth";
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

declare module "next-auth" {
  interface User {
    username?: string;
    /** A password the admin handed out is a one-use key: the session it
     * opens may do nothing but replace it. */
    mustChangePw?: boolean;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      mustChangePw: boolean;
    } & DefaultSession["user"];
  }
}

/** `next-auth/jwt` only re-exports this module, and it is the one the
 * callbacks are typed against. */
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    username: string;
    mustChangePw: boolean;
  }
}
