"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { locales, type Locale } from "@/i18n/config";
import { setLocaleAction } from "@/i18n/actions";
import { Flag, Icon, IconButton, SegmentedControl, Text } from "@/components/ui";

type Theme = "light" | "dark";

/**
 * Everything that is *about* the app rather than in it: the two archive
 * screens, the theme and the language. When there are accounts, the
 * profile and the session are rows in this same list.
 *
 * A menu hung off its own button rather than a `Sheet`. Sheets in this
 * app are for content — a garment, an outfit, a palette — and they take
 * over the screen to show it. Using that same weight for two links and a
 * toggle put a modal in the middle of the page to answer a question
 * nobody had asked yet. Anchored under the ellipsis, the panel says
 * where it came from and costs nothing to dismiss.
 *
 * The theme lives in here now, so the header carries one control instead
 * of two. Its state is only read once the panel is open, which is also
 * why it can be a real two-way choice rather than the old icon swap:
 * `resolvedTheme` is undefined on the first paint, and by the time
 * anything here mounts it is not.
 */
function ThemeOption({ name, label }: { name: "sun" | "moon"; label: string }) {
  return (
    <>
      <Icon name={name} size={16} />
      <span className="sr-only">{label}</span>
    </>
  );
}

export function AppMenu() {
  const [open, setOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const root = useRef<HTMLDivElement>(null);
  const t = useTranslations("menu");
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const links = [
    { href: "/stats", label: t("stats") },
    { href: "/settings", label: t("settings") },
  ];

  // The cookie is read on the server, so the screen only changes once the
  // action has landed and the tree is re-rendered against it.
  const changeLocale = (next: Locale) => {
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={root} className="relative">
      <IconButton
        label={t("label")}
        size="sm"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={open ? "text-text-primary" : undefined}
      >
        <Icon name="ellipsis" size={18} />
      </IconButton>

      {open && (
        <>
          {/* Catches the click that dismisses, and nothing else: a
              backdrop you can see would make this read as a modal. */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="panel-enter absolute right-0 top-full z-50 mt-2 w-56 border border-border bg-floating shadow-[var(--shadow-2)]"
          >
            <div className="flex flex-col divide-y divide-border-subtle">
              {links.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="group flex min-h-11 items-center justify-between gap-4 px-4 outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-inset"
                >
                  <span className="font-serif type-body">{entry.label}</span>
                  <span className="text-text-muted transition-colors duration-[var(--duration-base)] group-hover:text-text-primary">
                    <Icon name="arrow-right" size={13} />
                  </span>
                </Link>
              ))}

              <div className="flex min-h-11 items-center justify-between gap-4 px-4 py-2">
                <Text variant="caption" as="span">
                  {t("theme")}
                </Text>
                {/* A sun and a moon say it faster than two words, and the
                    control already marks the active one twice: full-ink
                    label plus the hairline this app uses for "selected"
                    everywhere else. The names stay for screen readers. */}
                <SegmentedControl<Theme>
                  value={resolvedTheme === "dark" ? "dark" : "light"}
                  onChange={setTheme}
                  ariaLabel={t("theme")}
                  options={[
                    { value: "light", label: <ThemeOption name="sun" label={t("themeLight")} /> },
                    { value: "dark", label: <ThemeOption name="moon" label={t("themeDark")} /> },
                  ]}
                  className="gap-x-4"
                />
              </div>

              {/* Built like the theme row above it, which is what this row
                  was left space for. Three flags rather than three codes:
                  the row is recognised before it is read. */}
              <div className="flex min-h-11 items-center justify-between gap-4 px-4 py-2">
                <Text variant="caption" as="span">
                  {t("language")}
                </Text>
                <SegmentedControl<Locale>
                  value={locale}
                  onChange={changeLocale}
                  ariaLabel={t("language")}
                  options={locales.map((code) => ({
                    value: code,
                    label: <Flag locale={code} label={t(`languages.${code}`)} />,
                  }))}
                  className="gap-x-4"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
