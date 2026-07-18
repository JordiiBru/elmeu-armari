"use client";

import { useRouter } from "next/navigation";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { GarmentModal } from "./GarmentModal";

/**
 * Thin route-driven wrapper around `GarmentModal`. Closing navigates back
 * in history instead of clearing local state, so the browser back button
 * closes the modal and the URL always reflects whether it's open.
 */
export function GarmentModalRoute({ garment }: { garment: GarmentWithColors }) {
  const router = useRouter();
  return <GarmentModal garment={garment} onClose={() => router.back()} />;
}
