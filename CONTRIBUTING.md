# Contributing to elmeu-armari

How a change gets from a branch to `main`. Setup, scripts and environment variables are in the [README](./README.md); the rules for writing the code, and how the colour engine works, are in [`AGENTS.md`](./AGENTS.md). The UI ships in Catalan, Spanish and English; **code, comments, commit messages and PR descriptions are in English.**

## Branch, commit, PR

Nothing goes straight to `main`: every change is a pull request, squash-merged.

Branches are `feature/<slug>`, `fix/<slug>`, `chore/<slug>` or `refactor/<slug>`, with a short kebab-case slug (`fix/back-button-history`).

Commits use Conventional Commits: `feat(scope):`, `fix(scope):`, `chore(scope):`, `refactor(scope):`, `docs(scope):`, with `!` when it breaks something. The subject is imperative and at most 72 characters; the body says **why**, not what. The release workflow reads these prefixes to pick the version, so `feat` and `fix` matter.

Before opening a PR:

1. `npm run check` and `npm run test:unit` pass.
2. If the schema changed, `npx prisma migrate dev` created the migration and it is committed.
3. A new UI string is in `messages/ca.json`, `es.json` and `en.json`, not inline (a missing key fails `npm run typecheck`).
4. No `dev.db` or `.env` in the diff.
5. The description explains why and lists what to try by hand. Use `Closes #n` when merging finishes the issue, `Refs #n` when it still has to be checked after deploy.

## CI, releases and deploys

CI runs on pull requests only: lint, typecheck, unit tests and build. **Do not merge on red.** E2E (Playwright) and Lighthouse are not run in CI; run them locally when a change touches what they cover.

A merge to `main` tags a version and publishes the image, but **does not deploy it**: that is a separate pull request that bumps the image tag in the homelab repo, where merging is the deploy.

### Dependency updates

Renovate (`renovate.json`, the same style as the homelab repo) opens pull requests at night (Europe/Madrid) and keeps a Dependency Dashboard issue. Patch and minor updates, Next.js and Prisma included, merge by themselves once CI is green; security updates run at any hour. Majors, and anything that changes the Node runtime, open a PR with a warning and wait for a human. Node moves in one PR: the Dockerfile base images, `node-version` in `ci.yml` and `@types/node`. The Dockerfile reads the `prisma` and `dotenv` versions from `package-lock.json`, so bump them in `package.json`, never in the Dockerfile.

## Testing

Unit tests live in `tests/unit`, named after what they cover. Beyond them, after a UI change, try it by hand on desktop **and** at 375 px wide:

- `/login`: a wrong password, then the right one, and the return path after being bounced from a protected screen.
- `/armari`: the grid with several filter combinations; open a piece and use **què hi combina**.
- `/avui`: pick an outfit for today, and a day in the week.
- `/add` and `/edit/[id]`: validation errors, the colour picker, a photo upload.
- `/bugaderia`, `/paleta`, `/stats`.
- `/settings`: export a JSON, import it back.
- `/change-password`: from the menu, and the forced version a fresh account lands on.

## Style

Strict TypeScript, no `any`; narrow `unknown` at a boundary. Colours come from the tokens in `globals.css`, never a hex in a component. Comments only when the *why* is not obvious. The visual rules are in [`DESIGN-BIBLE.md`](./DESIGN-BIBLE.md).

## Reporting bugs and requesting features

Open an issue with the steps to reproduce (bugs) or the user problem (features: start from the problem, not a solution), a screenshot and the viewport for UI issues, and `git rev-parse --short HEAD` if you can. A vulnerability is not an issue: see [`SECURITY.md`](./SECURITY.md).

## Licence

By contributing you agree that your contribution is released under the MIT licence, like the rest of the project.
