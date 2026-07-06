import type { Category } from "@/lib/prendas/types";

export type Bucket = "top" | "bottom" | "shoes";

export function bucketOf(category: Category): Bucket | null {
  if (category === "SHIRT" || category === "SWEATER") return "top";
  if (category === "PANTS") return "bottom";
  if (category === "SHOES") return "shoes";
  return null;
}
