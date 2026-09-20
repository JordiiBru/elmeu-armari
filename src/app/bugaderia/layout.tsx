import type { ReactNode } from "react";
import { settlePastWornEvents } from "@/lib/outfits/service";
import { requireUserId } from "@/lib/auth/session";

/**
 * The bugaderia screen reads clean/dirty state, so this is the place
 * that's guaranteed to run before it renders — settling past WornEvents
 * here means a stale "yesterday" is dirtied before its badge or its
 * outfit's availability is ever displayed.
 */
export default async function BugaderiaLayout({ children }: { children: ReactNode }) {
  await settlePastWornEvents(await requireUserId());
  return <>{children}</>;
}
