# Contributing to elmeu-armari

Thanks for considering a contribution. This document explains how to get the project running locally, what conventions the code follows, and how to submit a change that lands quickly.

The UI ships in Catalan, Spanish and English. Catalan is the source language. **Code, comments, commit messages and PR descriptions are in English.**

---

## 1. Local setup

Prerequisites: Node 20+, npm, git.

```bash
git clone https://github.com/JordiiBru/elmeu-armari.git
cd elmeu-armari
npm install
npx prisma migrate dev        # creates dev.db and generates the Prisma client
npm run dev                   # http://localhost:3000
```

The dev DB (`dev.db`) is git-ignored. Deleting it and re-running `npx prisma migrate dev` gives you a clean slate.

### Scripts you will use

| Command | When |
|---|---|
| `npm run dev` | Day-to-day. |
| `npm run typecheck` | While editing types; fast. |
| `npm run lint` | Before commit. |
| `npm run build` | To reproduce CI's build step. |
| `npm run check` | Runs lint + typecheck + build. **Run before opening a PR.** |
| `npm run test:unit` | Vitest unit tests. Runs in CI on every PR. |
| `npm run test:e2e` | Playwright e2e tests. Local only — not run in CI. |

---

## 2. Where things live

Read [`CLAUDE.md`](./CLAUDE.md) for the full architectural rules. The short version:

- Routes: `src/app/<route>/page.tsx` (Server Component by default).
- Server Actions: `src/app/<route>/actions.ts`, unless reused across routes.
- Domain logic: `src/lib/<domain>/service.ts`.
- DB access: `src/lib/<domain>/repository.ts` — **the only place** `prisma` is imported.
- UI strings: `messages/ca.json` (source of truth), `messages/es.json`, `messages/en.json`. Never inline translated strings in a component. A key missing from a locale fails `npm run typecheck`.

Client Components (`"use client"`) are the exception. Add one only when you need `useState`, event handlers, refs, or browser-only APIs.

---

## 3. Branch, commit, PR

### Branch naming

```
feature/<slug>          new feature
fix/<slug>              bug fix
chore/<slug>            tooling, deps, docs, tests
refactor/<slug>         no behaviour change
```

Slug is kebab-case and short: `feature/upload-progress`, `fix/back-button-history`.

### Commits

- Conventional-Commit style prefix: `feat(scope):`, `fix(scope):`, `chore(scope):`, `refactor(scope):`, `docs(scope):`.
- Subject in the imperative, ≤ 72 chars.
- Body explains **why**, not what.
- Prefer one focused commit per PR. Squash if you accumulate WIP commits.

Example:

```
feat(outfits): tighten palette matching against garment colours

Previously any palette that touched a garment's primary colour would
match. This over-matched neutrals against saturated palettes. Require
every non-neutral colour to have a Sanzo Wada peer within the OKLCH
tight-match threshold.
```

### Before opening a PR

1. `npm run check` passes locally.
2. If you touched the schema, `npx prisma migrate dev` created the migration and it is committed.
3. If you added a new UI string, it lives in `messages/ca.json` **and** in `es.json` and `en.json`, not inline.
4. No `dev.db` or `.env` in the diff.
5. Description explains the **why** and lists screens to test manually.

### PR template

```markdown
## Summary
<1–3 bullets>

## Test plan
- [ ] <first thing a reviewer should try>
- [ ] <edge case>
```

### CI

The CI workflow (PRs only) runs lint + typecheck + `npm run test:unit` + build. All must be green before merge. **Do not merge on red.** Docker build/push happens separately on `release.yml` after merge to `main`; e2e (Playwright) and Lighthouse are not run in CI — run them locally.

---

## 4. Testing

Run `npm run test:unit` for the Vitest suite (colour-matching engine, etc.) and `npm run test:e2e` for the Playwright suite before a PR that touches their covered areas. Beyond that, test manually against these paths after any UI change:

- `/` — home nav.
- `/armari` — grid with several filter combinations (empty / one category / one season / crossed).
- `/armari` → tab `Combinar` — pick a piece with colours, verify a palette appears, save, and check it lands in `Desats`.
- `/armari` → tab `Desats` — expand a group, delete an entry.
- `/add` and `/edit/[id]` — form validation errors, colour picker, season multi-select, photo upload.
- `/paleta` — browse, click a palette, see matching pieces.
- `/stats` — non-empty and empty DB.
- `/settings` — export a JSON, wipe DB, import it back.

Do this on desktop **and** a mobile viewport (375 px wide is a good baseline).

---

## 5. Style

- **TypeScript**: strict. Avoid `any`. If a boundary needs `unknown`, narrow it before use.
- **React**: no `useEffect` for data. Server Components + Server Actions. `useActionState` for form state.
- **Tailwind v4**: use CSS custom properties defined in `globals.css` (`text-foreground`, `bg-background`, `text-foreground-secondary`, `border-border`, `bg-card`). Do not hard-code hex colours.
- **Serif / italic / small-caps tracking** is the editorial tone. See existing components for patterns.
- **Comments**: only when the *why* is non-obvious. Well-named identifiers describe the *what*.

---

## 6. Reporting bugs / requesting features

Open a GitHub issue with:

- **Steps to reproduce** (for bugs) or **the user problem** (for features — start from a problem, not a solution).
- Screenshots for UI issues (device / viewport helps a lot).
- Version: `git rev-parse --short HEAD` output if you can.

---

## 7. Security

If you find a vulnerability, do **not** open a public issue. Email the maintainer directly. See the `SECURITY.md` file if one exists; otherwise message via the profile on GitHub.

---

## 8. Licence

By contributing you agree that your contribution is released under the MIT licence, the same as the rest of the project.
