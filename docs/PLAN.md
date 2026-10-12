# Dental Atelier — Plan

> Living roadmap. Updated 2026-10-12. Source of truth for *what comes next*;
> `TODO.md` tracks the actionable checklist, `MEMORY.md` the durable context.

## Where we are

The auth-routing split (`/auth/admin/*` for staff, `/auth/*` for clients) is
done, tested (172 unit + 76 e2e green), and documented. The P0–P4 audit
follow-ups are implemented in the working tree but **not yet committed**:

- P0: HSTS + CSP headers in `next.config.js`
- P1: deterministic `_t` injection replaces `waitForTimeout(2200)` in e2e
- P2: withdrawn — `lib/cms.js`, `lib/serialize.js`, `lib/format.js` are all
  heavily imported; `generated/` is gitignored. No dead code to delete.
- P3: README decision note 18 (headers rationale + rate-limiter caveat)
- P4a: bundle checked (largest chunk 233 KB framework — no bloat)
- P4b: `test:ci` script added (`--detectOpenHandles --forceExit`)

## Phases

### Phase 1 — Land the pending work (now)

1. Wire CI to the new `test:ci` script (keep `--coverage`).
2. Verify security headers live (curl HSTS + CSP off a production server;
   confirm no CSP breakage on key pages).
3. Run full verification: `lint` → `jest` → `build` → Playwright.
4. Commit everything (code + `docs/WIKI.md` + this plan set).

### Phase 2 — Harden (next)

- [ ] Edge rate-limit rule (Vercel WAF / Cloudflare) for horizontal-scale
      guarantees — the in-memory limiter is single-instance by design.
- [ ] Nonce-based CSP if the app ever migrates to the App Router
      (Pages Router requires `'unsafe-inline'` for hydration).
- [ ] `ANALYZE=true npx next build` one-off to confirm no surprise deps
      (manual chunk inspection already shows no bloat).

### Phase 3 — Maintain (ongoing)

- [ ] Keep Prisma on stable majors only (v8 skipped deliberately — RC tag).
- [ ] Regression-escape rate over coverage % as the quality signal.
- [ ] E2E sleeps stay banned — intercept or inject instead (`_t` pattern).

## Non-goals

- Microservices / sharding — load tier is Trickle/Steady; vertical + indexes win.
- Redis-backed rate limiter — only if horizontal scale actually happens.
- Deleting `lib/cms.js` / `lib/serialize.js` / `lib/format.js` — audited, alive.
