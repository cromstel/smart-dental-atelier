# Dental Atelier

A re-implementation of [dentalatelier.co](https://www.dentalatelier.co) — a
state-of-the-art dental laboratory in Uccle, Brussels — as a modern Next.js
application with an **admin portal** and a **client portal**.

All copy is taken verbatim from the live site. The legacy Bootstrap/HTML build
is replaced with React + Tailwind, Prisma + MySQL, and NextAuth.

---

## Contents

- [What this is](#what-this-is)
- [Quick start](#quick-start)
- [Architecture](#architecture)
- [Routes](#routes)
- [Design tokens](#design-tokens)
- [Data model](#data-model)
- [Authentication](#authentication)
- [Content: bundled vs database](#content-bundled-vs-database)
- [Testing](#testing)
- [Deploying](#deploying)
- [Operations](#operations)
- [Decisions worth knowing](#decisions-worth-knowing)

---

## What this is

The original site is a single-page-per-topic static site: marketing copy, a
before/after portfolio, an FAQ list and several contact forms. Everything a
visitor reads is hard-coded HTML; nothing can be changed without a developer.

This version keeps every page and every sentence, and adds:

| Area | Legacy | Now |
| --- | --- | --- |
| Content | hard-coded HTML | editable from `/admin` |
| Appointments | not tracked | `Appointment` table + admin list |
| Inquiries | emailed, then lost | `ContactMessage` inbox with statuses |
| Testimonials | hard-coded carousel | managed records, reordered |
| Gallery | two before/after images | upload, categorise, alt text enforced |
| Client accounts | none | `/portal` with history and cancellation |
| SEO | one shared description, no OG tags | per-page title/description/canonical/OG/JSON-LD |
| Images | no `alt` attributes | required by schema and form |
| Accessibility | focus outlines removed globally | visible focus, keyboard carousel, ARIA |
| Spam | none | honeypot + timing check + rate limiting |

---

## Quick start

Requires **Node.js 20+** and a **MySQL 8** (or MariaDB 10.6+) instance.

```bash
git clone <repo> dental-atelier && cd dental-atelier
npm install

cp .env.example .env
# then edit .env — at minimum DATABASE_URL, NEXTAUTH_SECRET and ADMIN_PASSWORD

npx prisma migrate deploy   # create the schema
npm run db:seed             # load the copy, FAQs, testimonials, gallery + an admin

npm run dev                 # http://localhost:3031
```

Sign in at `/login` with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.

### With Docker instead

```bash
cp .env.example .env        # set NEXTAUTH_SECRET + ADMIN_PASSWORD
docker compose up --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

The Compose stack brings up MySQL 8 and the app on `http://localhost:3031`, and
keeps uploads in a named volume.

### Scripts

The app listens on **port 3031** (chosen to avoid a clash with anything already
on 3000). The port is set in three places that are kept in sync: the `dev` and
`start` scripts, `PORT` in `next.config.js` — which Playwright imports — and
`EXPOSE`/`ENV PORT` in the Dockerfile.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server on :3031 with hot reload |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm test` | Jest: unit, API and lib suites |
| `npm run test:e2e` | Playwright against a running build |
| `npm run db:migrate` | Create and apply a migration in development |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:seed` | Load/refresh the bundled content |
| `npm run db:reset` | Drop, re-migrate and re-seed |
| `npm run db:studio` | Prisma Studio |
| `npm run create-admin` | Create or reset an administrator |

---

## Architecture

```
Browser
  │
  ▼
Next.js (Pages Router)
  ├── /pages            public pages  ── getStaticProps + ISR
  ├── /pages/admin/*    admin portal  ── getServerSideProps, role-gated
  ├── /pages/portal/*   client portal ── getServerSideProps, session-gated
  └── /pages/api        route handlers
        ├── /api/auth/*  NextAuth (JWT)
        ├── public       contact, smile-check, request-info, appointments
        ├── /admin/*     CRUD, ADMIN only
        └── /portal/*    scoped to the session user
                  │
                  ▼
             Prisma ──► MySQL
```

**Pages Router, not App Router.** The specification in `Executive Summary.md`
describes `/pages`, `getStaticProps` and `/pages/api`, and NextAuth v4's Pages
Router integration is the well-trodden path. The Pages Router is also stable in
Next 15.

### Layout

```
components/
  layout/      Navbar, Footer, Layout (site chrome + skip link)
  marketing/   HeroSection, InfoCard, TestimonialsSlider, FAQAccordion,
               ImageGallery, GoogleMapEmbed, BeforeAfter, Timeline, CtaBanner
  forms/       ContactForm, RequestInfoForm, SmileCheckForm, AppointmentForm,
               NewsletterSignup, useFormSubmit (shared submit/validation hook)
  ui/          PrimaryButton, FormInput/TextArea/Select, Alert, Badge, Section
  admin/       AdminShell, ResourceManager (schema-driven CRUD), DataTable,
               StatCard, StatusBadge, ConfirmButton, Pagination
  portal/      PortalShell

lib/           prisma, auth, authOptions, api (handler wrapper), guards,
               validation (Zod), cms (content access), seo, format, serialize,
               mailer, audit, content (bundled copy)
prisma/        schema.prisma, migrations, seed.mjs
pages/         routes + api/
styles/        globals.css (Tailwind layers, a11y defaults)
tests/         unit, api, lib, e2e
```

### Cross-cutting API concerns

`lib/api.js` wraps every route handler with:

- **method routing** with a correct `Allow` header on 405
- **Zod validation** → 422 with a `{ field: message }` map the forms bind to
  individual inputs
- **same-origin enforcement** on `POST`/`PUT`/`PATCH`/`DELETE` (CSRF hardening;
  NextAuth's `SameSite=Lax` cookie is the underlying boundary)
- **in-memory fixed-window rate limiting** on public POST routes
- **one JSON error shape**, and no stack traces in production responses

---

## Routes

### Public (ISR, statically generated)

| Route | Notes |
| --- | --- |
| `/` | Three feature banners, facial-analysis intro, testimonial carousel |
| `/about-us` | Mission, director CV, courses, laboratory gallery |
| `/products-and-materials` | Seven product cards + the Materials statement |
| `/services` | Seven services, each with expanded detail |
| `/portfolio` | Before/after, case gallery, request-full-portfolio form |
| `/faqs` | Accordion, live search, category filter, `FAQPage` JSON-LD |
| `/testimonials` | Full testimonial wall |
| `/contact-us` | Contact details, directions, lazy map, contact form |
| `/book-appointment` | Appointment request (guests allowed) |
| `/smile-check-form` | The eleven-question checklist |
| `/sexy-and-powerful-smile` | Thematic subpage |
| `/comfort-and-self-confidence` | Thematic subpage |
| `/looking-young-feeling-healthy` | Thematic subpage |
| `/facial-analysis-and-digital-smile-design` | Technical subpage |
| `/login` | Credentials sign-in |

### Portals

| Route | Notes |
| --- | --- |
| `/portal` | Client overview: next appointment, history, quick actions |
| `/portal/appointments` | Book and cancel own requests |
| `/portal/inquiries` | Own messages + new message |
| `/portal/profile` | Name, e-mail, phone, password |
| `/admin` | Metrics, "needs attention", content checklist |
| `/admin/appointments` | Filter, paginate, set status/slot, internal notes |
| `/admin/messages` | Shared inbox for every form, with status workflow |
| `/admin/testimonials` | CRUD + publish toggle |
| `/admin/faqs` | CRUD + categories |
| `/admin/services` | Products & services CRUD |
| `/admin/gallery` | Upload + metadata + alt text |
| `/admin/content` | Per-page title, description, H1, OG image, noindex |
| `/admin/users` | Roles, activation, password resets |
| `/admin/settings` | Site-wide values, grouped |

`/admin` and `/portal` send `X-Robots-Tag: noindex, nofollow` and are excluded
from `sitemap.xml` and disallowed in `robots.txt`.

---

## Design tokens

The specification proposed Navy `#0B3D91` / Coral-Gold `#DAA520` / Sky `#79B4F9`
on off-white, on the premise that the original CSS was unavailable. It was in
fact recoverable, and the real brand is **gold on near-black**:

| Token | Value | Source |
| --- | --- | --- |
| `brand-400` | `#D7AE15` | legacy headings, primary button |
| `brand-800` | `#3A300C` | legacy primary hover |
| `ink` | `#020202` | legacy `body` background |
| `silver-400` | `#C9CBCB` | legacy body text |
| `error-500` | `#D82424` | legacy error border/text |
| `accent-400` | `#79B4F9` | report's accent, used for focus rings |
| `navy-800` | `#0B3D91` | report's primary, reserved for informational UI |

The token *structure* from the report is kept; the values now match the client's
actual identity, so the existing gold logo and photography stay consistent. See
the comment at the top of `tailwind.config.js`.

**Typography** — `Inter` for body, `Playfair Display` for display headings, both
as system stacks so there is no build-time or runtime font fetch. To self-host
them, swap the stacks for `next/font/google` variables.

**Accessibility specifics** — the legacy stylesheet contained
`a:focus, button:focus, input:focus { outline: none }`, removing keyboard focus
entirely. This build replaces it with a visible `:focus-visible` ring, adds a
skip link, gives every input a real `<label>`, wires errors through
`aria-describedby`, and makes the FAQ and testimonial carousels keyboard
operable (the legacy ones were not).

---

## Data model

`prisma/schema.prisma`. The models from the specification plus what the portals
actually need:

| Model | Purpose |
| --- | --- |
| `User` | Portal clients and staff; `role` is `ADMIN` or `CLIENT` |
| `Account`, `Session`, `VerificationToken` | NextAuth-compatible (JWT strategy) |
| `Appointment` | Requests with preferred date, type, status workflow |
| `ContactMessage` | Every form, discriminated by `source` + `smileCheckAnswers` |
| `Page`, `PageBlock` | Per-page SEO fields and optional content blocks |
| `Service` | Products & Materials **and** Services catalogue |
| `Faq`, `Testimonial`, `GalleryImage` | Editable public content |
| `SmileCheckQuestion`, `DirectorMilestone` | Checklist and CV entries |
| `Setting` | Site-wide key/value, admin-editable |
| `NewsletterSubscriber` | Double opt-in list with hashed unsubscribe tokens |
| `AuditLog` | Who changed what, for the admin trail |

Enums are used where the set of values is closed (`AppointmentStatus`,
`AppointmentType`, `MessageSource`, `MessageStatus`, `FaqCategory`, `UserRole`)
and `String` where it is open-ended.

Migrations are committed under `prisma/migrations/`. In CI and production use
`prisma migrate deploy`; reserve `migrate dev` for local schema work.

---

## Authentication

NextAuth v4 on the Pages Router, **JWT strategy** (the Credentials provider
cannot use database sessions).

- `CredentialsProvider` checks a bcrypt hash in `User.password`; an account with
  no hash cannot be logged into with a blank password
- `role` and `uid` are copied onto the JWT and exposed as `session.user.role` /
  `session.user.id`
- Google OAuth is registered only when `GOOGLE_CLIENT_ID`/`SECRET` are set, and
  always provisions as `CLIENT` — the provider is never trusted for a role
- `NEXTAUTH_SECRET` is required; `trustHost` is on for proxy deployments

Two independent gates, both tested:

1. **Pages** — `requireAdminPage` / `requireClientPage` in `lib/guards.js` run in
   `getServerSideProps`, so a redirect happens before any private data is
   serialised.
2. **API** — `requireAdmin` / `requireUser` in `lib/api.js` run inside every
   handler.

Deliberate safety rails in `/api/admin/users/[id]`: an admin cannot delete or
demote themselves, and the last active administrator cannot be removed or
demoted. Portal queries are always scoped `where: { userId }`, so one client
cannot read or cancel another's records by guessing an id.

---

## Content: bundled vs database

`lib/content.js` holds the site's copy verbatim from the live site and serves
three purposes:

1. the seed source for `prisma/seed.mjs`
2. the fallback when MySQL is unreachable, so the marketing site still renders
   (and still builds) on a fresh clone or in CI without a database
3. the canonical place for long-form page bodies

Once a `Service`, `Faq`, `Testimonial` or `GalleryImage` row exists, the
database wins. `lib/cms.js` does that merge through `safeQuery`.

Long-form page copy still lives in the page components; `/admin/content` edits
the parts that change most often and that search engines read on every crawl
(title, description, H1, OG image, noindex). That is a deliberately small
surface with an obvious effect rather than a WYSIWYG editor.

---

## Testing

```bash
npm test              # 163 tests: unit, API, lib
npm run test:e2e      # Playwright (needs a database and a production build)
```

| Suite | Location | Covers |
| --- | --- | --- |
| unit | `tests/unit` | Components, form interaction, a11y wiring |
| api | `tests/api` | Route handlers with Prisma mocked |
| lib | `tests/lib` | Validation schemas, serialisation, formatting, SEO helpers |
| e2e | `tests/e2e` | Real browser flows on the production build |

Points worth knowing:

- **Prisma is mocked at the module boundary** in API tests, so they verify
  handler behaviour without a database. A sweep (`it.each`) asserts that all 16
  admin routes answer 401/403 correctly — one forgotten guard would fail it.
- **Tenant isolation is tested explicitly**: portal tests assert the `userId`
  filter, that `internalNotes` is never selected for a client, and that a
  cancelled appointment belonging to someone else returns 404.
- **The rate limiter is reset between tests** (`buckets.clear()`); otherwise the
  suites would be order-dependent once they exceed five POSTs per endpoint.
- `jest.config.js` enables the JSX parser for `.js` files explicitly, because
  this project keeps JSX in `.js`.

The rate limiter is in-memory per process. On serverless, each warm instance
keeps its own bucket, so pair it with an edge rule (Vercel WAF, Cloudflare) for
hard guarantees — noted in the comment on `assertRateLimit`.

---

## Deploying

### Vercel (recommended)

1. Import the repository; the framework preset is detected automatically
   (`vercel.json` pins the region to `brussels1`).
2. Add the environment variables from `.env.example`. **DATABASE_URL must be a
   reachable host**, not `127.0.0.1`.
3. The build runs `prisma generate && next build`.

Managed MySQL (PlanetScale, Aiven, RDS) works as-is. For uploads, note that
Vercel's filesystem is ephemeral except `/tmp`: replace `persistUpload` in
`pages/api/admin/gallery.js` with a Blob/S3 write. The database record shape
does not change.

### Docker

`Dockerfile` is a three-stage build (deps → builder → runner) ending in
Next's `output: 'standalone'`, so the runtime image contains no source, no build
toolchain and no dev dependencies. `docker-compose.yml` adds MySQL 8.

Production notes:

- run `prisma migrate deploy` as a release step, before switching traffic
- mount a volume at `/app/public/uploads` for gallery uploads
- `GET /api/health` returns 503 when the database is unreachable — point your
  uptime monitor at it
- the app runs as the unprivileged `nextjs` user

### Kubernetes

`k8s/` contains manifests for the deployment, service, ingress, config and the
database secret reference. Apply with `kubectl apply -f k8s/`, after filling in
the ingress host and creating the secret named in `k8s/secret.example.yaml`.

### Going live checklist

- [ ] `NEXTAUTH_SECRET` generated with `openssl rand -base64 32`
- [ ] `ADMIN_PASSWORD` changed, or the seeded admin re-created
- [ ] `NEXT_PUBLIC_SITE_URL` set to the real origin (canonical URLs, sitemap,
      OG tags)
- [ ] `prisma migrate deploy` run
- [ ] `HTTPS` enforced and `NEXTAUTH_URL` uses `https://`
- [ ] `ALLOWED_ORIGINS` set if forms are posted from another origin
- [ ] `SMTP_*` configured, otherwise notifications are only logged
- [ ] Google Search Console: submit `sitemap.xml`, keep the `msvalidate.01` and
      `google-site-verification` meta tags (still present via `_document`/`Seo`)

---

## Operations

**Health check** — `GET /api/health` returns `{"status":"ok","database":"ok",…}`,
or 503 with a reason when the database is down.

**Notifications** — `lib/mailer.js` logs a preview of every notification when
`SMTP_*` is unset, so local development needs no mail server. With it set, the
same code sends over SMTP.

**Audit trail** — every admin mutation writes an `AuditLog` row (actor, action,
entity, changed fields, never secrets). Failures are logged, never thrown, so a
logging problem cannot break a write.

**Rate limits** — contact 5 / 10 min, smile-check 5 / 10 min, request-info
6 / 10 min, appointments 4 / 10 min, newsletter 5 / 10 min, per IP and path.

**Backups** — the database is the only stateful component. Back up MySQL
nightly; uploads live on a volume that needs backing up separately.

---

## Decisions worth knowing

Places where this implementation departs from a literal reading of the
specification, and why:

1. **Palette.** The report's navy/coral/sky values assume the original CSS was
   missing. It was recoverable, so the real gold-on-black brand is used and the
   report's blues remain available as `accent`/`navy`.

2. **`getServerSession` needs the shared options.** The auth config lives in
   `lib/authOptions.js` and is imported by the route handler *and* by
   `lib/guards.js`. Calling `getServerSession(req, res)` without it skips the
   session callback, `session.user.id` is `undefined`, and every portal page
   redirects — which is exactly what happened during development.

3. **`serializeDates` on every `getStaticProps`.** Next.js refuses to serialise
   `Date` instances into static props. Any page reading rows from Prisma runs
   its props through `lib/serialize.js`.

4. **Client-side and server-side phone rules are identical.** An optional phone
   field that only validated in the browser let junk into the database; both
   sides now use the same character rules.

5. **The profile route uses its own Zod schema.** `profileSchema` has no `role`
   field at all, so a client cannot post their way to admin even if the handler
   forgot to strip it.

6. **`zod` date validation avoids `.transform()` before `.refine()`.** Chaining
   them runs the refinement against the *pre-transform* value, so
   `date.getTime()` received a string and threw a `TypeError` (HTTP 500) instead
   of producing a clean 422.

7. **Anti-bot timing check tolerates a missing value.** `_t` is read from the raw
   body (Zod strips unknown keys) and a missing value is ignored, so an API
   client or a privacy-stripping proxy is not silently discarded.

8. **`/admin` uses one schema-driven `ResourceManager`** for the six simple
   resources instead of six near-identical CRUD pages. Appointments, messages,
   gallery upload, page content and settings are bespoke where the interaction
   genuinely differs.

9. **Next 15.5.27, not the 14.2.x line in the report.** The report predates the
   Next.js security advisory; 14.2.35 is the patched 14.x release but that line
   is frozen. 15.5.27 is the maintained backport, and `next lint` was replaced by
   a direct `eslint` call since it is deprecated in 15.

10. **`getStaticProps` + ISR, with a database fallback.** Content that changes
    rarely is revalidated every 5–10 minutes, and a database outage degrades to
    the bundled copy rather than a 500.

---

## Sources

Copy, images and structure come from [dentalatelier.co](https://www.dentalatelier.co)
(© Dental Atelier Michal Siakel, VAT BE 0504872627). Patient photographs remain
the property of the studio and are included here for the purpose of rebuilding
their own site.