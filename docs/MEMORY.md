# Dental Atelier — Memory

> Durable project context for future sessions. Facts, not plans.
> Updated 2026-10-12.

## Stack facts

- Next.js 16.3.8 **Pages Router** (`/pages`, `getStaticProps`). No App Router.
- React 19.3, Prisma 7.10 (driver adapter `PrismaMariaDb`), Tailwind 4.3
  (CSS-first — tokens in `@theme`, no `tailwind.config.js`), Zod 4, Jest 30.
- Node ≥20.19.0; CI + Docker pin Node 24. Port **3005** everywhere
  (`next.config.js` exports `PORT`; Playwright reads it).
- DB + user both named `smart_dental_atelier`; MySQL 8.4 in CI.
- Prisma 8 deliberately skipped (`latest` = `8.0.0-rc.19`).

## Auth contract

- Staff → `/auth/admin/login`; clients → `/auth/login`. Never the reverse.
- Single NextAuth Credentials provider; the **page** enforces the split.
- `lib/authRoutes.js` is the single source of truth (`AUTH_ROUTES`,
  `safeCallbackUrl`, `withCallback`). `safeCallbackUrl` rejects absolute
  URLs, `//host`, `/auth/*`, `/api/*`.
- Guards re-fetch `User` from DB on every check (`role` + `isActive`) —
  token claims are never trusted alone.
- `getServerSession` **must** receive shared `authOptions` or
  `session.user.id` is `undefined` and every guard redirects.
- Sign-in ends with `window.location.assign` (full load), never `router.push`
  — the session cookie only reaches the server on a fresh document.
- `profileSchema` has no `role` field — privilege escalation blocked at schema.

## Anti-bot & rate limiting

- Public forms: hidden `website` honeypot + `_t` elapsed-seconds timing
  (`isTooFast` floor = 2 s; missing value tolerated for API/proxy clients).
- `assertRateLimit` is **in-memory per instance** — fine for single-pod, must
  be paired with an edge rule if horizontally scaled. Documented in README 18.
- E2E rule: **no sleeps** — intercept the request and stamp `_t: 10`
  (`tests/e2e/portals.spec.js` pattern).

## Data & rendering

- `safeQuery` falls back to bundled `lib/content.js` when MySQL is down —
  builds and renders work without a DB.
- `serializeDates()` on every static/server props return (Next refuses `Date`).
- `withWriteRetry` retries MariaDB 1020/1213/1205 with jittered backoff
  (sign-in double-writes `lastLoginAt` — authorize + signIn event).
- `lib/cms.js`, `lib/serialize.js`, `lib/format.js` are **all heavily
  imported** (audited 2026-10-12) — not dead code. `generated/` is gitignored.

## Security headers

- Set in `next.config.js#headers()`, not middleware — applies to API routes too.
- CSP keeps `script-src 'unsafe-inline' 'unsafe-eval'` (Pages Router hydration
  requirement). Tighten to nonces only on App Router migration.
- Portals + auth + api carry `X-Robots-Tag: noindex, nofollow`.

## Test environment gotchas

- Playwright does **not** load `.env` — export `ADMIN_EMAIL`/`ADMIN_PASSWORD`/
  `NEXTAUTH_URL` into the process first, or 24 portal tests skip.
- Let Playwright manage `webServer` (`npm run start`); ad-hoc `next start`
  servers die mid-run → `ERR_CONNECTION_REFUSED` flakes.
- Sign-in budget is 60 s (bcrypt + double write, 2 workers). Don't tighten.
- CI runs `npm test -- --ci --coverage`, then build, smoke-test, then e2e job.
- `test:ci` = `jest --passWithNoTests --detectOpenHandles --forceExit`.

## External edits

- README was edited externally ~12:31 during the auth-split session (test
  count 72→76, `safeCallbackUrl` paragraph). Other sources untouched.
