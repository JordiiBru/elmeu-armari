/**
 * Reference set for the colour engine's snap: garment hexes paired with
 * the Sanzo Wada names a person would accept as their anchor.
 *
 * The expected names are a judgement made from what the colour looks
 * like next to the catalogue (hue, lightness, how grey it is), not the
 * output of the code under test. Where the catalogue offers several
 * fair readings the entry lists all of them; where it offers none
 * (Sanzo Wada has no mid or dark grey) the entry says what a reader
 * would settle for.
 *
 * `failsToday` marks an entry the current engine gets wrong, with the
 * measured reason. `anchor-reference.test.ts` runs those with
 * `it.fails`, so fixing the engine turns the entry red until the flag
 * is removed: an expected failure can never become a silent one.
 */

export interface AnchorCase {
  hex: string;
  label: string;
  source: "wardrobe" | "synthetic";
  /** Sanzo Wada names that are fair anchors for this hex. */
  accept: readonly string[];
  /** Why the current engine misses, when it does. */
  failsToday?: string;
}

// Families, so a list reads as "any of these" instead of repeating names.
// Sanzo Wada has no taupe: a dull warm grey-brown that far from every
// canonical is better left outside the vocabulary than pinned to a blue.
export const OUTSIDE = "(outside the vocabulary)";
const NAVY = ["Dark Tyrian Blue", "Deep Indigo", "Dull Violet Black"];
const DARK_BROWN = ["Vandyke Brown", "Mars Brown / Tobacco", "Pale Raw Umber", "Sepia"];
const BROWN_OLIVE = [
  "Light Brownish Olive",
  "Pale Raw Umber",
  "Sepia",
  "Vandyke Brown",
  "Deep Grayish Olive",
  "Light Grayish Olive",
];
const WARM_LIGHT = ["Ecru", "Ivory Buff", "Seashell Pink"];
const LIGHT_GREY = ["Neutral Gray", "Warm Gray", "Mineral Gray"];
const MID_GREY = ["Black", ...LIGHT_GREY];
const DARK_GREEN = ["Blackish Olive", "Dusky Green", "Lincoln Green", "Deep Grayish Olive"];
const OLIVE = ["Light Brownish Olive", "Deep Grayish Olive", "Olive Green", "Lincoln Green"];
const BURGUNDY = ["Pale Burnt Lake", "Vandyke Red", "Hay's Russet", "Madder Brown"];
const MUSTARD = ["Yellow Ocher", "Isabella Color", "Khaki", "Sulphine Yellow"];
const RUST = ["Vinaceous Tawny", "Burnt Sienna", "Orange Rufous", "Cinnamon Rufous", "Brick Red"];
const CHARCOAL_SLATE = ["Slate Color", "Deep Slate Green"];
const SLATE_BLUE = ["Deep Violet / Plumbeous", "Slate Color"];

function wardrobe(
  hex: string,
  label: string,
  accept: readonly string[],
  failsToday?: string,
): AnchorCase {
  return { hex, label, source: "wardrobe", accept, failsToday };
}

function synthetic(
  hex: string,
  label: string,
  accept: readonly string[],
  failsToday?: string,
): AnchorCase {
  return { hex, label, source: "synthetic", accept, failsToday };
}

// Every distinct colour in the dev wardrobe (accessories included), so
// a regression on a piece the owner actually wears shows up by name.
const WARDROBE_CASES: AnchorCase[] = [
  wardrobe("#000000", "black", ["Black"]),
  wardrobe("#153f0a", "dark green", DARK_GREEN),
  wardrobe("#af82d9", "lavender", ["Lilac", "Grayish Lavender - B"]),
  wardrobe("#f1f8da", "pale green-white", ["White", "Sulpher Yellow"]),
  wardrobe("#fdfdfd", "near white", ["White"]),
  wardrobe("#ffffff", "white", ["White"]),
  wardrobe("#0f164d", "midnight navy", NAVY),
  wardrobe("#102b96", "royal blue", ["Violet Blue", "Vandar Poel's Blue"]),
  wardrobe("#3a2921", "dark brown", DARK_BROWN),
  wardrobe("#726052", "khaki chino", BROWN_OLIVE),
  wardrobe("#736251", "khaki cargo", BROWN_OLIVE),
  wardrobe("#7f8183", "mid grey trousers", MID_GREY),
  wardrobe("#d9cab8", "beige trousers", WARM_LIGHT,
    "snaps to Light Pinkish Cinnamon (a peach, chroma 0.09 against 0.03): a near tie with Ivory Buff and Ecru",
  ),
  wardrobe("#1b2c50", "navy", NAVY),
  wardrobe("#1c2f26", "black-green", ["Deep Slate Green", "Deep Slate Olive", "Blackish Olive"]),
  wardrobe("#524f52", "dark grey", ["Black"]),
  wardrobe("#546779", "slate blue", SLATE_BLUE),
  wardrobe("#5d5d5f", "dark grey", ["Black"]),
  wardrobe("#c2d3c0", "pale sage", [
    ...LIGHT_GREY,
    "Dark Greenish Glaucous",
    "Glaucous Green",
  ]),
  wardrobe("#d8ccb7", "beige shirt", WARM_LIGHT),
  wardrobe("#dad1cb", "light warm grey", ["White", "Seashell Pink", "Neutral Gray"]),
  wardrobe("#f9da82", "butter yellow", ["Ivory Buff", "Naples Yellow", "Cinnamon Buff"]),
  wardrobe("#121b3b", "ink navy", NAVY),
  wardrobe("#3d5a3d", "forest green", DARK_GREEN),
  wardrobe("#6b4423", "brown", ["Pale Raw Umber", "Brown", "Mars Brown / Tobacco"]),
  wardrobe("#716c63", "warm mid grey", ["Warm Gray", ...BROWN_OLIVE]),
  wardrobe("#d6d6d6", "light grey", [...LIGHT_GREY, "White"]),
  wardrobe("#000025", "blue-black", ["Deep Indigo", "Dull Violet Black", "Black"]),
  wardrobe("#214259", "petrol blue", ["Slate Color", "Vandar Poel's Blue", "Dark Tyrian Blue"]),
  wardrobe("#4e2a09", "espresso", DARK_BROWN),
  wardrobe("#4f0007", "oxblood", [...BURGUNDY, "Mars Brown / Tobacco"]),
  wardrobe("#fff0e0", "warm off-white", ["White", "Seashell Pink"]),
];

// The colours a wardrobe like this one is likely to grow: the
// neutrals and earth tones the engine has the most trouble with.
const SYNTHETIC_CASES: AnchorCase[] = [
  synthetic("#c3b091", "khaki", ["Ecru", "Ivory Buff"]),
  synthetic("#8a7d55", "olive khaki", [...BROWN_OLIVE, "Dark Citrine"]),
  synthetic("#a89a78", "greige khaki", ["Ecru", "Isabella Color", "Light Grayish Olive", "Maple"]),
  synthetic("#c19a6b", "camel", ["Maple", "Isabella Color", "Ochraceous Salmon"]),
  synthetic("#b48a5a", "dark camel", ["Maple", "Khaki", "Isabella Color"]),
  synthetic("#8b7d72", "taupe", [OUTSIDE, "Light Brownish Olive", "Light Grayish Olive", "Warm Gray", "Pale Raw Umber"]),
  synthetic("#483c32", "dark taupe", DARK_BROWN),
  synthetic("#b8a99a", "light taupe", ["Ecru", "Warm Gray", "Light Brown Drab"]),
  synthetic("#36454f", "blue charcoal", CHARCOAL_SLATE),
  synthetic("#3b3b3d", "charcoal", ["Black"]),
  synthetic("#2b2b2d", "dark charcoal", ["Black"]),
  synthetic("#4c5866", "marengo", SLATE_BLUE),
  synthetic("#3e4552", "dark marengo", SLATE_BLUE),
  synthetic("#1f2a44", "navy", NAVY),
  synthetic("#0b1f3a", "deep navy", NAVY),
  synthetic("#14213d", "night navy", NAVY),
  synthetic("#4a6fa5", "denim", ["Deep Violet / Plumbeous", "Olympic Blue"]),
  synthetic("#2e4a6b", "dark denim", [
    "Vandar Poel's Blue",
    "Slate Color",
    "Dark Tyrian Blue",
    "Deep Violet / Plumbeous",
  ]),
  synthetic("#6b8cae", "washed denim", ["Deep Violet / Plumbeous", "Olympic Blue", "Salvia Blue"]),
  synthetic("#6d1f2b", "burgundy", BURGUNDY),
  synthetic("#800020", "bordeaux", BURGUNDY),
  synthetic("#4a0e1a", "dark burgundy", [...BURGUNDY, "Violet Carmine", "Mars Brown / Tobacco"]),
  synthetic("#d4a017", "mustard", MUSTARD),
  synthetic("#c9a227", "dull mustard", MUSTARD),
  synthetic("#e1ad01", "bright mustard", [...MUSTARD, "Olive Ocher", "Orange Yellow"]),
  synthetic("#6b6b2f", "olive", OLIVE),
  synthetic("#556b2f", "olive drab", OLIVE),
  synthetic("#4b5320", "army green", OLIVE),
  synthetic("#f5ecd7", "cream", ["Ivory Buff", "White", "Sulpher Yellow"]),
  synthetic("#fffdd0", "pale cream", ["Sulpher Yellow", "Pale Lemon Yellow", "Ivory Buff"]),
  synthetic("#f4f1ea", "off-white", ["White"]),
  synthetic("#faf7f2", "warm white", ["White"]),
  synthetic("#eae6dd", "bone", ["White", "Seashell Pink"]),
  synthetic("#1f4d2b", "bottle green", DARK_GREEN),
  synthetic("#b7410e", "rust", RUST),
  synthetic("#c66b4a", "terracotta", ["Cinnamon Rufous", "Raw Sienna", "Vinaceous Tawny", "Ochraceous Salmon"]),
  synthetic("#dcc9a6", "sand", ["Ecru", "Ivory Buff", "Light Pinkish Cinnamon"]),
  synthetic("#1f6f6b", "teal", ["Dark Medici Blue"]),
  synthetic("#c8c8c8", "silver grey", LIGHT_GREY),
  synthetic("#e8e8e8", "pale grey", ["White", "Neutral Gray"]),
  synthetic("#9a9a9a", "mid grey", LIGHT_GREY),
  synthetic("#6e6e6e", "grey", MID_GREY),
  synthetic("#180808", "near-black maroon", ["Black", "Mars Brown / Tobacco", "Madder Brown"]),
  synthetic("#1a1a1a", "soft black", ["Black", "Deep Slate Green", "Deep Slate Olive"]),
];

export const ANCHOR_CASES: AnchorCase[] = [...WARDROBE_CASES, ...SYNTHETIC_CASES];
