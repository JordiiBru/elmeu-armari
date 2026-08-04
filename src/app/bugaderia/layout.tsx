import type { ReactNode } from "react";
import { settlePastWornEvents } from "@/lib/outfits/service";

/**
 * Every bugaderia route reads clean/dirty state, so this is the one place
 * that's guaranteed to run before any of them render — settling past
 * WornEvents here means a stale "yesterday" is dirtied before its badge
 * or its outfit's availability is ever displayed.
 */
export default async function BugaderiaLayout({ children }: { children: ReactNode }) {
  await settlePastWornEvents();
  return <>{children}</>;
}
