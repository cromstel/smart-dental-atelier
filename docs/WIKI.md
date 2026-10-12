# Dental Atelier — Codebase Wiki

> A modern rebuild of [dentalatelier.co](https://www.dentalatelier.co) — a dental laboratory in Uccle, Brussels — as a Next.js application with an **admin portal** and a **client portal**.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Project Structure](#3-project-structure)
4. [Core Components](#4-core-components)
5. [Data Flow](#5-data-flow)
6. [Data Model](#6-data-model)
7. [API Reference](#7-api-reference)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Configuration](#9-configuration)
10. [Getting Started](#10-getting-started)
11. [Development Guide](#11-development-guide)

---

## 1. Project Overview

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (Pages Router) | 16.3.8 |
| **UI** | React | 19.3.0 |
| **Styling** | Tailwind CSS | 4.3.3 (CSS-first) |
| **Database** | MySQL (MariaDB driver) | — |
| **ORM** | Prisma | 7.10.0 |
| **Authentication** | NextAuth | 4.24.15 |
| **Validation** | Zod | 4.6.5 |
| **Testing** | Jest + Playwright | 30.5.2 / 1.63.0 |
| **Runtime** | Node.js | ≥20.19.0 |

### Key Dependencies

- **bcryptjs** — password hashing (12 rounds)
- **formidable** — multipart upload parsing (gallery images)
- **sharp** — image optimization (WebP pipeline)
- **tsx** — TypeScript execution for seed/admin scripts
- **@prisma/adapter-mariadb** — Prisma 7 driver adapter

### What This App Does

| Feature | Description |
|---------|-------------|
| Marketing site | Full service pages, portfolio, FAQ, testimonials, contact forms |
| Admin portal | Manage appointments, inquiries, content, users, settings |
| Client portal | View appointments, cancel bookings, message history |
| Authentication | Credentials (email+password) + optional Google OAuth |
| Anti-spam | Honeypot fields, timing check, rate limiting |
| Content editor | Admin-editable page blocks stored in database with fallback |

---

## 2. Architecture

### High-Level Flowchart

```mermaid
flowchart TB
    subgraph "Client"
        Browser[Browser]
    end

    subgraph "Next.js Application"
        MW[Security Headers<br/>next.config.js]
        
        subgraph "Pages"
            Public[Public Pages<br/>/services, /faqs, /portfolio...]
            Admin[Admin Portal<br/>/admin/*]
            Portal[Client Portal<br/>/portal/*]
            Auth[Auth Pages<br/>/auth/login, /auth/admin/login]
        end

        subgraph "API Routes"
            PublicAPI[Public API<br/>/api/contact, /api/appointments...]
            AdminAPI[Admin API<br/>/api/admin/*]
            PortalAPI[Portal API<br/>/api/portal/*]
            NextAuthAPI[NextAuth<br/>/api/auth/*]
        end

        subgraph "Libraries"
            Guards[lib/guards.js<br/>Page guards]
            ApiLib[lib/api.js<br/>API guards + rate limiter]
            AuthLib[lib/auth.js<br/>Credentials + password]
            Prisma[lib/prisma.js<br/>DB client singleton]
            CMS[lib/cms.js<br/>Content access layer]
            AuthRoutes[lib/authRoutes.js<br/>URL contract]
        end
    end

    subgraph "Database"
        MySQL[(MySQL / MariaDB)]
    end

    subgraph "External"
        SMTP[SMTP Server]
        Google[Google OAuth]
    end

    Browser --> MW
    MW --> Pages
    MW --> API Routes
    
    Public --> CMS
    Admin --> Guards
    Portal --> Guards
    Auth --> AuthRoutes
    
    PublicAPI --> ApiLib
    AdminAPI --> ApiLib
    PortalAPI --> ApiLib
    NextAuthAPI --> AuthLib
    
    Guards --> Prisma
    ApiLib --> Prisma
    AuthLib --> Prisma
    CMS --> Prisma
    
    Prisma --> MySQL
    AuthLib -.-> SMTP
    AuthLib -.-> Google
```

### Security Headers Flow

```mermaid
flowchart LR
    Request[Incoming Request] --> Headers{next.config.js<br/>headers()}
    Headers --> HSTS[HSTS]
    Headers --> CSP[CSP]
    Headers --> Nosniff[X-Content-Type-Options]
    Headers --> Frame[X-Frame-Options]
    Headers --> Referrer[Referrer-Policy]
    Headers --> XRobots[X-Robots-Tag]
    HSTS --> Response[Response]
    CSP --> Response
    Nosniff --> Response
    Frame --> Response
    Referrer --> Response
    XRobots --> Response
```

---

## 3. Project Structure

```
smart-dental-atelier/
├── components/
│   ├── admin/              # Admin portal UI components
│   │   ├── AdminShell.js   # Sidebar + navigation wrapper
│   │   ├── ConfirmButton.js
│   │   ├── DataTable.js
│   │   ├── Pagination.js
│   │   ├── ResourceManager.js  # Generic CRUD for simple entities
│   │   ├── StatCard.js
│   │   └── StatusBadge.js
│   ├── auth/
│   │   └── CredentialsSignIn.js  # Shared sign-in form (client + admin variants)
│   ├── forms/
│   │   ├── AppointmentForm.js
│   │   ├── ContactForm.js
│   │   ├── Honeypot.js
│   │   ├── NewsletterSignup.js
│   │   ├── RequestInfoForm.js
│   │   ├── SmileCheckForm.js
│   │   └── useFormSubmit.js      # Shared submission hook
│   ├── layout/
│   │   ├── Footer.js
│   │   ├── Layout.js
│   │   └── Navbar.js
│   ├── marketing/          # Reusable marketing page sections
│   │   ├── BeforeAfter.js
│   │   ├── CtaBanner.js
│   │   ├── FAQAccordion.js
│   │   ├── FAQItem.js
│   │   ├── GoogleMapEmbed.js
│   │   ├── HeroSection.js
│   │   ├── ImageGallery.js
│   │   ├── InfoCard.js
│   │   ├── SectionHeading.js
│   │   ├── TestimonialCard.js
│   │   ├── TestimonialsSlider.js
│   │   └── Timeline.js
│   ├── portal/
│   │   └── PortalShell.js  # Client portal navigation wrapper
│   ├── ui/                 # Primitive UI components
│   │   ├── Alert.js
│   │   ├── Badge.js
│   │   ├── FormInput.js
│   │   ├── FormSelect.js
│   │   ├── FormTextArea.js
│   │   ├── PrimaryButton.js
│   │   ├── Section.js
│   │   └── Spinner.js
│   └── Seo.js              # Per-page metadata, OG tags, JSON-LD
├── docs/
│   └── WIKI.md
├── lib/
│   ├── api.js              # API wrapper: guards, rate limiter, CSRF, error shape
│   ├── audit.js            # Append-only audit trail
│   ├── auth.js             # Password hashing, credentials authorize, write retry
│   ├── authOptions.js      # NextAuth configuration (single source of truth)
│   ├── authRoutes.js       # URL contract between sign-in pages
│   ├── cms.js              # Content access layer with DB→bundled fallback
│   ├── content.js          # Bundled seed content (SITE, SERVICES, FAQS...)
│   ├── format.js           # Date, phone, initials, status style helpers
│   ├── guards.js           # Page-level auth guards (getServerSideProps)
│   ├── mailer.js           # SMTP notification (best-effort, dependency-free)
│   ├── prisma.js           # Prisma client singleton + safeQuery
│   ├── seo.js              # SEO helper functions
│   ├── serialize.js        # Date→ISO serialization for Next.js props
│   └── validation.js       # Zod schemas for all forms
├── pages/
│   ├── _app.js             # SessionProvider wrapper
│   ├── _document.js        # Custom HTML document (dark theme, preconnects)
│   ├── index.js            # Home page
│   ├── 404.js              # Styled 404
│   ├── about-us.js
│   ├── book-appointment.js
│   ├── comfort-and-self-confidence.js
│   ├── contact-us.js
│   ├── facial-analysis-and-digital-smile-design.js
│   ├── faqs.js
│   ├── looking-young-feeling-healthy.js
│   ├── portfolio.js
│   ├── products-and-materials.js
│   ├── services.js
│   ├── sexy-and-powerful-smile.js
│   ├── smile-check-form.js
│   ├── testimonials.js
│   ├── login.js            # Legacy /login → /auth/login redirect
│   ├── robots.txt.js       # Dynamic robots.txt (blocks portals)
│   ├── sitemap.xml.js      # Dynamic sitemap (excludes portals)
│   ├── auth/
│   │   ├── login.js        # Client sign-in
│   │   └── admin/
│   │       └── login.js    # Staff sign-in + SSR session forward
│   ├── admin/              # Admin portal pages (all guarded)
│   │   ├── index.js        # Dashboard
│   │   ├── appointments.js
│   │   ├── content.js
│   │   ├── faqs.js
│   │   ├── gallery.js
│   │   ├── messages.js
│   │   ├── services.js
│   │   ├── settings.js
│   │   ├── testimonials.js
│   │   └── users.js
│   ├── portal/             # Client portal pages (all guarded)
│   │   ├── index.js        # Overview
│   │   ├── appointments.js
│   │   ├── inquiries.js
│   │   └── profile.js
│   └── api/
│       ├── auth/
│       │   └── [...nextauth].js
│       ├── admin/          # Admin API routes (requireAdmin guard)
│       │   ├── appointments.js
│       │   ├── appointments/[id].js
│       │   ├── audit.js
│       │   ├── dashboard.js
│       │   ├── faqs.js
│       │   ├── faqs/[id].js
│       │   ├── gallery.js
│       │   ├── gallery/[id].js
│       │   ├── messages.js
│       │   ├── messages/[id].js
│       │   ├── pages.js
│       │   ├── services.js
│       │   ├── services/[id].js
│       │   ├── settings.js
│       │   ├── testimonials.js
│       │   ├── testimonials/[id].js
│       │   ├── users.js
│       │   └── users/[id].js
│       ├── portal/         # Client portal API (requireUser guard)
│       │   ├── appointments.js
│       │   ├── messages.js
│       │   └── profile.js
│       ├── appointments.js # Public booking
│       ├── contact.js      # Public contact form
│       ├── faqs.js         # Public FAQ read
│       ├── gallery.js      # Public gallery read
│       ├── health.js       # Health check
│       ├── newsletter.js   # Newsletter subscribe
│       ├── newsletter/
│       │   └── unsubscribe.js
│       ├── request-info.js # Portfolio request form
│       ├── services.js     # Public services read
│       ├── smile-check.js  # Smile-check form
│       └── testimonials.js # Public testimonials read
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.mjs            # Seed script
│   └── migrations/         # Database migrations
├── scripts/
│   ├── create-admin.mjs    # CLI to create admin user
│   └── optimize-images.mjs # Convert images to WebP
├── styles/
│   └── globals.css         # Tailwind 4 CSS-first config + design tokens
├── tests/
│   ├── api/                # API route tests (Prisma mocked)
│   ├── e2e/                # Playwright end-to-end tests
│   ├── lib/                # Pure function tests
│   ├── unit/               # React component tests
│   ├── helpers/
│   │   └── api-mock.js     # Request/response doubles
│   └── setup.js            # Jest setup
├── next.config.js
├── playwright.config.js
├── jest.config.js
├── tailwind.config.js      # Deleted (Tailwind 4 is CSS-first)
├── postcss.config.js
├── jsconfig.json
└── package.json
```

---

## 4. Core Components

### Authentication Layer

```mermaid
classDiagram
    class CredentialsSignIn {
        +variant: 'client' | 'admin'
        +onSubmit()
        +handleChange()
    }
    
    class AuthRoutes {
        +AUTH_ROUTES: {admin, client}
        +safeCallbackUrl(value, fallback)
        +withCallback(route, value)
    }
    
    class Guards {
        +getSessionUser(req, res)
        +requireAdminPage(ctx, extraProps)
        +requireClientPage(ctx, extraProps)
        +parsePagination(query, options)
    }
    
    class ApiLib {
        +requireAdmin(req, res)
        +requireUser(req, res)
        +apiHandler(handler, options)
        +assertSameOrigin(req)
        +assertRateLimit(req, config)
    }
    
    class AuthLib {
        +hashPassword(plain)
        +verifyPassword(plain, hash)
        +authorizeCredentials({email, password})
        +withWriteRetry(operation, options)
    }
    
    CredentialsSignIn --> AuthRoutes : uses
    Guards --> AuthLib : delegates
    ApiLib --> AuthLib : delegates
```

### Form Submission Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Component
    participant H as useFormSubmit
    participant A as API Route
    participant P as Prisma
    
    U->>C: Fills form, clicks submit
    C->>H: submit(event)
    H->>H: validate(values)
    alt Validation fails
        H-->>C: Set errors, show messages
    else Validation passes
        H->>H: Calculate _t (elapsed seconds)
        H->>A: POST JSON {values, _t, referrer}
        A->>A: apiHandler wraps: assertSameOrigin, assertBodySize, assertRateLimit
        A->>A: Zod schema.parse(body)
        A->>A: isHoneypotTripped + isTooFast check
        alt Spam detected
            A-->>H: 200 {success: true} (silently dropped)
        else Valid submission
            A->>P: prisma.create(...)
            A-->>H: 201 {success: true, message}
        end
        H-->>C: setStatus('success'), setMessage(...)
    end
```

### Rate Limiter

```mermaid
flowchart LR
    Request[Request] --> Key[Build key<br/>endpoint:ip]
    Key --> Bucket{Bucket exists<br/>and not expired?}
    Bucket -->|No| Create[Create bucket<br/>count=1]
    Bucket -->|Yes| Increment[count++]
    Increment --> Limit{count > limit?}
    Limit -->|Yes| Reject[429 Too Many Requests]
    Limit -->|No| Allow[Allow request]
    Create --> Allow
```

### Audit Trail

```mermaid
flowchart LR
    AdminAction[Admin mutation] --> AuditCall[audit\{action, entity, entityId, payload\}]
    AuditCall --> DB[(auditLog table)]
    AuditCall -.->|Failure logged,<br/>never blocks request| Console[console.error]
```

---

## 5. Data Flow

### Content Rendering (Public Pages)

```mermaid
sequenceDiagram
    participant B as Browser
    participant P as Next.js Page
    participant C as lib/cms.js
    participant S as lib/prisma.js
    participant D as Database
    participant F as lib/content.js<br/>(bundled fallback)
    
    B->>P: GET /services
    P->>C: getServices()
    C->>S: safeQuery(() => prisma.service.findMany(...))
    S->>D: SELECT * FROM Service WHERE published = true
    alt DB success
        D-->>S: Rows
        S-->>C: {data: rows, source: 'database'}
    else DB failure or not configured
        S-->>C: {data: SERVICES, source: 'fallback'}
    end
    C-->>P: services array
    P->>P: serializeDates(props)
    P-->>B: HTML with serialized props
```

### Admin Authentication

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as /auth/admin/login
    participant N as NextAuth
    participant G as lib/guards.js
    participant P as Prisma
    
    B->>A: POST credentials
    A->>N: signIn('credentials', {email, password, redirect: false})
    N->>P: authorizeCredentials → findUnique(User) → bcrypt.compare
    P-->>N: User row
    N-->>A: {error} or {ok: true}
    A->>A: getSession() → check role
    alt Admin
        A-->>B: window.location.assign('/admin')
        B->>G: GET /admin (getServerSideProps)
        G->>P: getSessionUser → findUnique(User)
        P-->>G: Active user with role=ADMIN
        G-->>B: Render admin dashboard
    else Not admin
        A-->>B: Show error "That is not a staff account"
    end
```

### Client Portal Data Isolation

```mermaid
sequenceDiagram
    participant B as Browser
    participant API as /api/portal/appointments
    participant G as requireUser
    participant P as Prisma
    
    B->>API: GET /api/portal/appointments (with session cookie)
    API->>G: requireUser(req, res)
    G->>P: getToken → prisma.user.findUnique
    P-->>G: User {id: 5, isActive: true}
    G-->>API: {user: {id: 5}}
    API->>P: prisma.appointment.findMany({where: {userId: 5}, select: {...}})
    Note over P: Query is scoped to user.id<br/>Client can never see another user's data
    P-->>API: Appointments
    API-->>B: {appointments: [...]}
```

---

## 6. Data Model

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Appointment : has
    User ||--o{ ContactMessage : has
    User ||--o{ Account : has
    User ||--o{ Session : has
    Appointment }o--|| Service : references
    Page ||--|{ PageBlock : contains
    AuditLog }o--|| User : "made by"

    User {
        Int id PK
        String name
        String email UK
        DateTime emailVerified
        String password "bcrypt hash"
        String phone
        UserRole role "ADMIN | CLIENT"
        String image
        DateTime lastLoginAt
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }

    Account {
        String id PK
        Int userId FK
        String type
        String provider
        String providerAccountId
        String refresh_token
        String access_token
        Int expires_at
        String token_type
        String scope
        String id_token
        String session_state
    }

    Session {
        String id PK
        String sessionToken UK
        Int userId FK
        DateTime expires
    }

    VerificationToken {
        String identifier
        String token UK
        DateTime expires
    }

    Appointment {
        Int id PK
        Int userId FK "nullable"
        String firstName
        String lastName
        String email
        String phone
        DateTime preferredDate
        DateTime scheduledAt
        AppointmentType type
        String notes
        AppointmentStatus status
        Int serviceId FK "nullable"
        String internalNotes
        String source
        DateTime createdAt
        DateTime updatedAt
    }

    ContactMessage {
        Int id PK
        Int userId FK "nullable"
        String firstName
        String lastName
        String email
        String phone
        String message
        MessageSource source
        MessageStatus status
        String smileCheckAnswers
        String referrer
        Boolean isSpam
        DateTime repliedAt
        DateTime createdAt
        DateTime updatedAt
    }

    Service {
        Int id PK
        String slug UK
        String title
        String summary
        String description
        String category "product | service"
        String image
        String icon
        String priceFrom
        Int order
        Boolean published
        DateTime createdAt
        DateTime updatedAt
    }

    Page {
        Int id PK
        String slug UK
        String title
        String description
        String heading
        String image
        Boolean noIndex
        Boolean published
        DateTime updatedAt
        DateTime createdAt
    }

    PageBlock {
        Int id PK
        Int pageId FK
        String type "hero | rich-text | cards | ..."
        Int position
        String title
        String subtitle
        String body
        Json data
        Boolean published
        DateTime createdAt
        DateTime updatedAt
    }

    Faq {
        Int id PK
        String question
        String answer
        FaqCategory category
        Int order
        Boolean published
        DateTime createdAt
        DateTime updatedAt
    }

    Testimonial {
        Int id PK
        String author
        String treatment
        String quote
        String image
        Int order
        Boolean published
        DateTime createdAt
        DateTime updatedAt
    }

    GalleryImage {
        Int id PK
        String title
        String url
        String altText
        String category
        Int width
        Int height
        Int order
        Boolean published
        DateTime createdAt
        DateTime updatedAt
    }

    SmileCheckQuestion {
        Int id PK
        String question
        Int order
        Boolean published
        DateTime createdAt
    }

    DirectorMilestone {
        Int id PK
        String period
        String role
        String place
        Int order
        Boolean published
    }

    Setting {
        Int id PK
        String key UK
        String value
        String group
        DateTime updatedAt
    }

    NewsletterSubscriber {
        Int id PK
        String email UK
        String name
        String source
        String unsubscribeToken UK
        Boolean active
        DateTime confirmedAt
        DateTime createdAt
        DateTime updatedAt
    }

    AuditLog {
        Int id PK
        Int userId FK "nullable"
        String action
        String entity
        String entityId
        Json payload
        DateTime createdAt
    }
```

### Enums

```mermaid
classDiagram
    class UserRole {
        <<enumeration>>
        ADMIN
        CLIENT
    }
    
    class AppointmentStatus {
        <<enumeration>>
        PENDING
        CONFIRMED
        COMPLETED
        CANCELLED
        NO_SHOW
    }
    
    class AppointmentType {
        <<enumeration>>
        CONSULTATION
        CUSTOM_SHADING
        FACIAL_ANALYSIS
        SMILE_DESIGN
        TREATMENT
        OTHER
    }
    
    class MessageSource {
        <<enumeration>>
        CONTACT
        SMILE_CHECK
        REQUEST_INFO
        PORTFOLIO_REQUEST
        FAQ_QUESTION
        PORTAL
    }
    
    class MessageStatus {
        <<enumeration>>
        NEW
        READ
        ANSWERED
        SPAM
    }
    
    class FaqCategory {
        <<enumeration>>
        GENERAL
        VENEERS
        CROWNS_BRIDGES
        IMPLANTS
        TREATMENT
        COST
    }
```

---

## 7. API Reference

### Public Endpoints (no auth)

| Method | Path | Body / Query | Rate Limit | Notes |
|--------|------|--------------|------------|-------|
| `POST` | `/api/contact` | `{firstName, lastName, email, phone?, message, website?, referrer?, _t?}` | 5 / 10 min / IP | Creates `ContactMessage`, sends notification |
| `POST` | `/api/smile-check` | `{firstName, lastName, email, phone?, message?, answers[], website?, _t?}` | 5 / 10 min / IP | Creates `ContactMessage` with `source=SMILE_CHECK` |
| `POST` | `/api/request-info` | `{firstName, lastName, email, phone, message?, topic?, website?, _t?}` | 5 / 10 min / IP | Phone required; maps topic to source |
| `POST` | `/api/appointments` | `{firstName, lastName, email, phone?, preferredDate, type?, notes?, website?, _t?}` | 5 / 10 min / IP | Creates `PENDING` appointment; duplicate check within 1 hour |
| `POST` | `/api/newsletter` | `{email, _t?}` | 5 / 10 min / IP | Upserts subscriber with SHA-256 unsubscribe token |
| `GET` | `/api/faqs` | — | — | Published FAQs, cached via ISR |
| `GET` | `/api/gallery` | `?category=` | — | Published gallery images |
| `GET` | `/api/services` | `?category=` | — | Published services |
| `GET` | `/api/testimonials` | — | — | Published testimonials, ordered |
| `GET` | `/api/health` | — | — | Health check endpoint |
| `GET` | `/api/auth/[...nextauth]` | — | — | NextAuth handler (sign-in, session, CSRF) |

### Admin Endpoints (`/api/admin/*` — require `role=ADMIN`)

| Method | Path | Body / Query | Notes |
|--------|------|--------------|-------|
| `GET` | `/api/admin/appointments` | `?status=&type=&q=&from=&to=&page=&pageSize=` | Paginated list + status counts |
| `POST` | `/api/admin/appointments` | `{firstName, lastName, email, phone?, preferredDate?, scheduledAt?, type?, notes?, internalNotes?, serviceId?}` | Create (status=CONFIRMED, source=admin) |
| `PATCH` | `/api/admin/appointments` | `{id, status?, scheduledAt?, internalNotes?, notes?, preferredDate?, phone?, serviceId?}` | Partial update |
| `GET` | `/api/admin/appointments/[id]` | — | Single appointment |
| `PUT` | `/api/admin/appointments/[id]` | Full replacement | |
| `DELETE` | `/api/admin/appointments/[id]` | — | |
| `GET` | `/api/admin/messages` | `?status=&source=&q=&page=&pageSize=` | Paginated inquiry inbox |
| `PATCH` | `/api/admin/messages/[id]` | `{status?, repliedAt?}` | Update status |
| `GET` | `/api/admin/users` | `?role=&q=&page=&pageSize=` | Paginated user list (password never selected) |
| `POST` | `/api/admin/users` | `{name?, email, phone?, role, isActive?, password}` | Create user (password required) |
| `PUT` | `/api/admin/users/[id]` | `{name?, email?, phone?, role?, isActive?, password?}` | Self-delete/demote blocked; last-admin blocked |
| `DELETE` | `/api/admin/users/[id]` | — | Self-delete blocked; last-admin blocked |
| `GET` | `/api/admin/faqs` | `?page=&pageSize=` | All FAQs (including unpublished) |
| `POST` | `/api/admin/faqs` | `{question, answer, category?, order?, published?}` | Create |
| `PUT` | `/api/admin/faqs/[id]` | Same | Update |
| `DELETE` | `/api/admin/faqs/[id]` | — | |
| `GET` | `/api/admin/services` | — | All services |
| `POST` | `/api/admin/services` | `{slug, title, summary, description, category?, image?, priceFrom?, order?, published?}` | Create |
| `PUT` | `/api/admin/services/[id]` | Same | Update; delete blocked if appointments reference it |
| `DELETE` | `/api/admin/services/[id]` | — | 409 if appointments reference it |
| `GET` | `/api/admin/gallery` | — | All gallery images |
| `POST` | `/api/admin/gallery` | `{title?, url, altText, category?, width?, height?, order?, published?}` | Create |
| `PUT` | `/api/admin/gallery/[id]` | Same | Update |
| `DELETE` | `/api/admin/gallery/[id]` | — | |
| `GET` | `/api/admin/testimonials` | — | All testimonials |
| `POST` | `/api/admin/testimonials` | `{author, treatment?, quote, image?, order?, published?}` | Create |
| `PUT` | `/api/admin/testimonials/[id]` | Same | Update |
| `DELETE` | `/api/admin/testimonials/[id]` | — | |
| `GET` | `/api/admin/pages` | — | All pages with blocks |
| `PUT` | `/api/admin/pages` | `{slug, title, description, heading?, image?, noIndex?, published?, blocks?}` | Upsert page + blocks; slug must be a known page |
| `GET` | `/api/admin/settings` | — | All settings |
| `PUT` | `/api/admin/settings` | `{settings: [{key, value, group?}]}` | Registry-validated; unknown keys → 422 |
| `GET` | `/api/admin/dashboard` | — | Aggregated stats (appointments, messages, clients, content) |
| `GET` | `/api/admin/audit` | `?page=&pageSize=` | Audit trail, newest first |

### Client Portal Endpoints (`/api/portal/*` — require active user)

| Method | Path | Body | Notes |
|--------|------|------|-------|
| `GET` | `/api/portal/appointments` | — | Scoped to `session.user.id`; never selects `internalNotes` or `email` |
| `PATCH` | `/api/portal/appointments` | `{id, action: 'cancel'}` | Only PENDING/CONFIRMED cancellable; 404 if not owner |
| `GET` | `/api/portal/messages` | — | Scoped to `session.user.id` |
| `POST` | `/api/portal/messages` | `{message}` | Email/userId from session, not body |
| `GET` | `/api/portal/profile` | — | Own profile |
| `PUT` | `/api/portal/profile` | `{name?, email?, phone?, password?}` | `profileSchema` has no `role` field; role change impossible |

### Error Response Shape

```json
// HttpError (manual)
{ "error": "Human-readable message", "details": { "field": "Specific issue" } }

// ZodError (validation)
{ "error": "Please check the highlighted fields.", "details": { "email": "Please enter a valid e-mail address." } }

// Unhandled (500)
{ "error": "Something went wrong on our side. Please try again." }
```

---

## 8. Authentication & Authorization

### Route Split

| Route | Purpose | Sign-in page |
|-------|---------|-------------|
| `/auth/login` | Client sign-in | `pages/auth/login.js` |
| `/auth/admin/login` | Staff sign-in | `pages/auth/admin/login.js` |
| `/admin/*` | Admin portal (guarded) | Redirects to `/auth/admin/login` |
| `/portal/*` | Client portal (guarded) | Redirects to `/auth/login` |
| `/login` | Legacy redirect (308) | → `/auth/login` |

### Guard Flow

```mermaid
flowchart TB
    Request[Request to protected page] --> Session[getServerSession]
    Session --> NoSession{Session exists?}
    NoSession -->|No| RedirectLogin[Redirect to sign-in<br/>with callbackUrl]
    NoSession -->|Yes| DBCheck[getSessionUser → DB lookup]
    DBCheck --> Active{User active?}
    Active -->|No| RedirectInactive[Redirect with ?error=inactive]
    Active -->|Yes| Role{Role check}
    Role -->|Non-admin on /admin| RedirectAccess[Redirect with ?error=AccessDenied]
    Role -->|Admin on /admin| Render[Render page props]
    Role -->|Any active on /portal| Render
```

### Security Properties

- **Passwords**: bcrypt, 12 rounds; never compared unless hash exists
- **Role from DB, not token**: Every guard re-fetches `User` and checks `role + isActive`
- **Mass assignment**: Zod schemas strip unknown fields; `profileSchema` has no `role`
- **Open redirect**: `safeCallbackUrl()` rejects absolute URLs, `//host`, `/auth/*`, `/api/*`
- **CSRF**: SameSite=Lax cookie (NextAuth) + `Origin` header check on unsafe methods
- **Rate limiting**: Fixed-window in-memory per IP+endpoint (single-instance; pair with edge WAF for horizontal scale)
- **Honeypot + timing**: Public forms include hidden `website` field and `_t` elapsed seconds
- **Audit trail**: Every admin mutation logged with actor, action, entity, and payload

---

## 9. Configuration

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | MySQL connection string (`mysql://user:pass@host:port/db`) |
| `NEXTAUTH_SECRET` | Yes | NextAuth JWT signing key |
| `NEXTAUTH_URL` | Yes | Canonical site URL (e.g., `https://example.com`) |
| `ADMIN_EMAIL` | Seed | Initial admin e-mail address |
| `ADMIN_PASSWORD` | Seed | Initial admin password |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (enables Google sign-in) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `SMTP_HOST` | No | SMTP server for notifications |
| `SMTP_PORT` | No | SMTP port (default 587) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASSWORD` | No | SMTP password |
| `NOTIFY_EMAIL` | No | Override notification recipient |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical site URL for client-side use |
| `ALLOWED_ORIGINS` | No | Comma-separated additional allowed origins for CSRF check |
| `NEXT_OUTPUT_STANDALONE` | No | Set `true` for Docker standalone output |

### Next.js Configuration (`next.config.js`)

| Setting | Value | Reason |
|---------|-------|--------|
| `reactStrictMode` | `true` | Catch side effects during development |
| `poweredByHeader` | `false` | Don't advertise framework |
| `output` | `standalone` (env-gated) | For Docker deployment |
| `images.formats` | `['image/avif']` | Sources are already WebP; only AVIF is worth negotiating |
| `images.minimumCacheTTL` | `14400` (4h) | Build-time assets change only on re-upload |
| Security headers | HSTS, CSP, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy | See [decision note 18](#18-security-headers) |
| Cache headers | `immutable` for `/images/*` and `/uploads/*` | Content-stable filenames |
| `X-Robots-Tag` | `noindex, nofollow` | Portals and auth pages never indexed |

### Playwright Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| `timeout` | 90 s | bcrypt verification + full page loads |
| `expect.timeout` | 30 s | Server round-trips (bcrypt is CPU-expensive) |
| `workers` | 2 (local) / 1 (CI) | Pinned to avoid host-dependent bcrypt load |
| `retries` | 0 (local) / 1 (CI) | Fail fast locally; one retry for CI flakes |
| `webServer` | `npm run start` (production build) | Catches optimization-only issues |

### Jest Configuration

| Project | Environment | Scope |
|---------|-------------|-------|
| `unit` | jsdom | React component tests (`tests/unit/`) |
| `api` | node | API route tests with Prisma mocked (`tests/api/`) |
| `lib` | node | Pure function tests (`tests/lib/`) |

---

## 10. Getting Started

### Prerequisites

- Node.js ≥20.19.0
- MySQL 8+ or MariaDB 10.6+

### Setup

```bash
# 1. Clone and install
git clone <repo>
cd smart-dental-atelier
npm install

# 2. Configure environment
cp .env.example .env   # or create manually
# Fill in DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# 3. Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate

# 4. Seed the database (creates admin user from ADMIN_EMAIL/ADMIN_PASSWORD)
npm run db:seed

# 5. Optimize images (runs automatically on dev/build)
npm run images:optimize

# 6. Start development server
npm run dev            # http://localhost:3005
```

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server on port 3005 |
| `npm run build` | Production build (Prisma generate + next build) |
| `npm run start` | Production server |
| `npm run lint` | ESLint check |
| `npm test` | Run all Jest tests |
| `npm run test:ci` | Jest with `--detectOpenHandles --forceExit` (CI) |
| `npm run test:e2e` | Playwright end-to-end suite |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Run development migrations |
| `npm run db:deploy` | Run production migrations |
| `npm run db:seed` | Seed database |
| `npm run db:reset` | Reset database + seed |
| `npm run db:studio` | Open Prisma Studio |
| `npm run create-admin` | Create admin user via CLI |
| `npm run images:optimize` | Convert images to WebP |

---

## 11. Development Guide

### Code Conventions

- **JSX in `.js` files** (not `.jsx`); SWC parser configured explicitly in Jest
- **Path alias**: `@/` maps to project root (see `jsconfig.json`)
- **Zod schemas** for all input validation; server always re-validates what the client validated
- **`serializeDates()`** on every `getStaticProps` / `getServerSideProps` that returns Prisma rows
- **`withWriteRetry()`** on writes that can race (e.g., `lastLoginAt` double-write on sign-in)
- **Security headers** in `next.config.js`, not middleware (one place, applies to API routes too)

### Adding a New Admin Resource

1. Add model to `prisma/schema.prisma` + migrate
2. Add Zod schema to `lib/validation.js`
3. Create `/api/admin/<resource>.js` (GET list, POST create) and `/api/admin/<resource>/[id].js` (PUT, DELETE) — both wrapped in `apiHandler` with `requireAdmin` guard
4. Add `audit()` calls on mutations
5. Add admin page at `pages/admin/<resource>.js` using `ResourceManager` (if simple CRUD) or bespoke layout
6. Add route to `ADMIN_ROUTES` in `tests/api/admin-auth.test.js` to sweep auth coverage

### Adding a New Public Form

1. Add Zod schema to `lib/validation.js` (include `website` honeypot field)
2. Create `/api/<form>.js` with `apiHandler` (set `rateLimit` option)
3. Check `isHoneypotTripped(req.body)` and `isTooFast(req.body?._t)` before persisting
4. Create form component using `useFormSubmit` hook
5. Add `Honeypot` component to the form
6. Add unit tests to `tests/api/public-forms.test.js`

### Testing Strategy

| Level | When | Speed | What to test |
|-------|------|-------|-------------|
| Unit (jsdom) | Component logic, form validation | Fast | User interactions, rendering, hooks |
| API (node, mocked Prisma) | Route handler logic | Fast | Guards, validation, status codes, error shapes |
| Integration (real DB) | Schema migrations, query plans | Medium | Constraint violations, index usage |
| E2E (Playwright) | Auth flows, portal CRUD | Slow | Full page loads, session cookies, redirects |

**Key rule**: A test that mocks the thing it tests is decoration. The `tests/api/` suite mocks Prisma (not the handler) and sweeps every admin route through `requireAdmin` — if any route forgets the guard, the sweep catches it.

### Debugging

- **Auth issues**: Check `session.user.id` is populated (requires shared `authOptions` in every `getServerSession` call)
- **Build failures without DB**: Ensure `DATABASE_URL` is unset or invalid — `safeQuery` falls back to bundled content
- **Rate limit false positives**: Clear `buckets` in test setup; the Map is module-level
- **Prisma 1020 (MariaDB)**: Transient stale-read; `withWriteRetry` handles it automatically
- **CSP violations**: Check browser console; Next.js inlines scripts so `script-src 'unsafe-inline'` is required

---

## Key Decisions (from README)

1. Gold-on-black brand palette (not the report's assumed blues)
2. `getServerSession` requires shared `authOptions` — without them, session callbacks are skipped
3. `serializeDates()` on every static props return
4. Client and server phone validation rules are identical
5. `profileSchema` has no `role` field — privilege escalation impossible at schema level
6. Zod `.transform()` before `.refine()` causes TypeError — split into separate rules
7. Anti-bot `_t` check tolerates missing values (privacy-stripping proxies)
8. One `ResourceManager` for six simple CRUD screens
9. Latest stable majors; Prisma 8 not taken (RC tag)
10. Tailwind 4 is CSS-first; tokens live in `@theme` in `globals.css`
11. Prisma 7 requires driver adapter (`PrismaMariaDb`, not `{connectionString}`)
12. Transient MariaDB 1020 is retried with jittered backoff
13. `getStaticProps` + ISR with database→bundled fallback
14. WebP everywhere; `formidable` needs `bodyParser=false` + `createDirsFromUploads=true`
15. Sign-in ends with full page load (session cookie only reaches server on fresh document)
16. Admin auth never completes on `/auth/login` — staff sessions are handed to `/auth/admin/login`
17. Every JavaScript-submitted form declares `method="post"` (pre-hydration fallback safety)
18. Security headers in `next.config.js`; rate limiter is single-instance by design (documented caveat)

---

*Generated from source analysis. Last updated: October 2026.*
