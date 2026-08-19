import type { ReactNode } from "react";
import { settlePastWornEvents } from "@/lib/outfits/service";

/**
 * Same reason as `bugaderia/layout.tsx`: this screen reads clean/dirty
 * state, so a stale "yesterday" has to be settled before any outfit's
 * availability is displayed. There is no cron — settling is lazy, and
 * these two layouts are the only places that trigger it.
 */
export default async function AvuiLayout({ children }: { children: ReactNode }) {
  await settlePastWornEvents();
  return <>{children}</>;
}
