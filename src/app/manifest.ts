import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("app");

  return {
    name: t("title"),
    short_name: t("shortName"),
    description: t("manifestDescription"),
    start_url: "/",
    display: "standalone",
    // The app's own cream (`--_cream-100` in globals.css): the splash screen
    // and the browser bar match the page instead of flashing white or black.
    background_color: "#f5edcd",
    theme_color: "#f5edcd",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // The same drawing at 80% on the cream ground, so a round or squircle
      // mask never crops the wardrobe. Not the "any" file scaled by hand: a
      // mask on the full-bleed one would cut the corners of the frame.
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
