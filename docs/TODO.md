# Dental Atelier — TODO

> Actionable checklist. Checked = done and verified. Updated 2026-10-12.

## Pending (Phase 2+)

- [ ] Edge rate-limit rule (Vercel WAF / Cloudflare)
- [ ] Nonce-based CSP on App Router migration
- [ ] One-off `next-bundle-analyzer` run

## Done

- [x] Wire `.github/workflows/ci.yml` to `test:ci` (keep `--coverage`)
- [x] Verify HSTS + CSP headers live on a production server
- [x] Confirm no CSP breakage (all key pages 200; guards 307 intact)
- [x] Full verification: `lint` → `jest` → `build` → Playwright (76 e2e)

## Done

- [x] P0: HSTS + CSP in `next.config.js` (`next.config.js:46-95`)
- [x] P1: deterministic `_t` injection in `tests/e2e/portals.spec.js`
- [x] P2: dead-code audit — withdrawn, all candidates alive (see MEMORY)
- [x] P3: README decision note 18 (headers + rate-limiter caveat)
- [x] P4a: bundle inspection — 233 KB framework chunk, no bloat
- [x] P4b: `test:ci` script in `package.json`
- [x] Auth split: `/auth/admin/*` staff, `/auth/*` clients (`c8b0eab`)
- [x] `docs/WIKI.md` created (965 lines, 11 sections)
- [x] `docs/PLAN.md`, `docs/TODO.md`, `docs/MEMORY.md` created

## Deferred

- [ ] Nonce-based CSP — only on App Router migration (impossible on Pages
      Router; hydration requires `'unsafe-inline'`). `unsafe-eval` already
      dropped from production CSP.

## Done

- [x] Edge rate-limit rule — documented as dashboard change (Vercel Firewall /
      Caddy / Cloudflare) in README Operations + going-live checklist; no
      Redis store (boring-by-default)
- [x] `vercel.json` headers synced with `next.config.js` (HSTS, CSP,
      Permissions-Policy; X-Robots-Tag extended to `/auth/*`, `/api/*`)
- [x] Production CSP drops `'unsafe-eval'` (dev keeps it for SWC);
      verified by 16/16 auth e2e under prod CSP
- [x] Bundle-analyzer run (`--experimental-analyze`, Turbopack native):
      first-load ~494–517 KB uncompressed/route, ~73 KB gzip shared framework
      chunk, no heavy third-party dep — no action needed
