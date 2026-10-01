# Executive Summary  
The existing Dental Atelier site is a multi-page static HTML site showcasing services, portfolio, and contact information. Key pages include Home, About, Products & Materials, Services, Portfolio, FAQs, and Contact Us, plus thematic subpages (e.g. “Sexy & powerful smile”, “Comfort & Self-confidence”, etc.). We will re-implement it as a modern Next.js/React app with Tailwind CSS for styling, Prisma+MySQL for data, and NextAuth for authentication. The new site will have an **admin portal** (to manage content, testimonials, appointments, etc.) and a **client portal** (to book appointments, submit inquiries, use the “smile check” form, etc.). This report documents a detailed content inventory and sitemap, proposes design tokens (colors, fonts, spacing), enumerates reusable React/Tailwind components, outlines project structure and database schema, sketches API routes and auth strategy, and covers deployment, SEO, accessibility, and testing. Code scaffolding prompts and sample snippets are included to guide an AI code generator for each major feature. 
- Current Live site : https://www.dentalatelier.co

## Sitemap and Content Inventory  
We identify the following main pages and their content by crawling the live site. (All headings, text, and labels below are drawn from the site.)

| **Page (URL)**                     | **Title/Headings**                                           | **Main Text Content**                                                                                                                                         | **Images/Assets**                          | **Meta/SEO**                     |
|------------------------------------|--------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------|----------------------------------|
| **Home** (`/`)                     | – *(Site tagline in nav: “A state-of-the-art laboratory”)*<br>H2: “Sexy & powerful smile”<br>H2: “Comfort & Self-confidence”<br>H2: “Looking young, feeling healthy”<br>H2: “Facial analysis and Digital Smile Design” | Introductory tagline: “An ideal smile is linked to certain biometrical features…” (with link to detailed page)<br>Testimonials quotes (e.g. “The professional attitude and quality of service is great…” – Karl) | Slider/images behind each H2 (3 banner images); gallery images under each smile section. | *No explicit meta tags found.* (To add: e.g. Title “Dental Atelier – A state-of-the-art laboratory”, Description summarizing services.) |
| **About Us** (`/about-us`)         | H1: “About Dental Atelier”<br>H3: “Communication is the key…”<br>H3: “The latest courses”<br>H3: “Mission and goal” | Mission paragraph: “Dental Atelier is here to empower you to live a healthy, happy life with a peace of mind…”. Description of customized, patient-centered approach. Career timeline for Michal Siakel (Director). List of advanced courses attended. “We care that everyone gets an exceptional service…”. | Portrait image of Michal Siakel; photo gallery images (six thumbnails). | Title could be “About – Dental Atelier”. *No meta tags present.* |
| **Products & Materials** (`/products-and-materials`) | H1: “Products & Materials”<br>H3s for each service type: “Facial Analysis and Digital Smile Design”, “Diagnostic wax up”, “Provisional Crowns”, “Crowns & Bridges”, “Implant Solutions”, “Inlays/Onlays”, “Veneers”; H2: “Materials”. | Short descriptions for each service: e.g. “Digital imaging allows you to see the desired result on your portrait photograph…”; “See your future smile on a 3D model!”; etc. “Materials” section: “All materials used … are produced by leading manufacturers…”. | Illustrative image banner (Products & Materials header). | Title “Products & Materials”. |
| **Services** (`/services`)         | H1: “Services”<br>H2s: “Price estimation”, “Free consultation”, “Custom colour shading” (twice), “Facial analysis and Digital Smile Design”, “Pick-up and delivery”, “Consultation”, “Diagnostic case planning”. | Descriptions: e.g. “The price of your dental product is derived from the type of work and material…”; “Collaboration between Patient, Dentist and Technician is very important…”; “Analyse your face on the computer and check out your new teeth before the makeover…”; “Dental Atelier provides free pick-up and delivery service”; plus extra lines on consultation and planning. | No large images (primarily text). | Title “Services”. |
| **Portfolio** (`/portfolio`)       | H1: “Portfolio”<br>H3: “Before”, “After”. | Intro: “You will find a wide array of products of superb quality and prime aesthetic value”. Callout: “Please download a wider portfolio of our recent works”. | Two images labeled “Before” and “After” (showing patient smile transformations). | Title “Portfolio”. |
| **FAQs** (`/faqs`)                | H1: “FAQs”<br>Multiple Q&A entries (each FAQ is an H3 question and paragraph answer). Questions include “What is a porcelain veneer/lumineer?”, “What is a crown?”, “What is a bridge?”, etc. | Answers: definitions of terms. For example, “Porcelain veneer or lumineer is a very thin shell (thin like an egg shell) made of ceramic material…”; “Crown is a cap that replaces your natural tooth structure…”; etc. Advice: “Please contact us to get price estimation”; “You do not have to change your current dentist”. | Facebook icon/link. | Title “FAQs”. |
| **Contact Us** (`/contact-us`)    | H1: “Contact us”<br>H2: “Address:”, directions sections (By car/metro/tram/bus/train as H3s). | Contact info: Mobile +32 478…, Phone +32 2…; VAT number; Email. Address: “Dental Atelier Michal Siakel, Rue du Bourdon…1180 Uccle, Brussels”. Transit directions listed under subheadings. | Embedded Google map (iframe). | Title “Contact Us”. |

Each of the above sections is based directly on the live content (cited as shown). Notably, **all pages lack explicit `<title>` or `<meta>` tags** in the static HTML, so the modern site must add those for SEO (e.g. `<title>`, `<meta name="description">`). All images should include meaningful `alt` text (currently none is visible). 

In addition to the above top-level pages, several **subpages** are linked from the Home page’s feature sections. These include:

- **Sexy & powerful smile** (`/sexy-and-powerful-smile`): Explains how smile aesthetics affect confidence. Prompts user to use a “smile check” form. Contains multiple images of smiles.  
- **Comfort & Self-confidence** (`/comfort-and-self-confidence`): Discusses dental issues that can inhibit smiling and offers ceramic inlays/crowns as solutions. Ends with a “Ready for your smile check?” prompt.  
- **Looking young, feeling healthy** (`/looking-young-feeling-healthy`): Describes aging effects on teeth and how restorations can reverse them. Also includes a “smile check” call to action.  
- **Facial analysis and Digital Smile Design** (`/facial-analysis-and-digital-smile-design`): Details digital imaging and planning services. Contains a “Request more information” contact form (firstname, surname, email, phone).  
- **Smile Check Form** (`/smile-check-form`): Presents a checklist of smile issues (“Are your teeth crooked?... Are they worn down?”). Instructs user: “If you answered yes… please contact us…”. Includes a form (firstname, surname, email, phone, enquiry). 

Each subpage generally follows the same header/footer as above. All text snippets above are cited from the live site. 

## Design Tokens (Colors, Typography, Spacing, Breakpoints)  
Based on the site’s imagery and branding, we propose an improved, consistent design token set. (The original CSS is not available, so these are assumptions intended to modernize the look and feel.)

- **Color Palette:**  
  - Primary (brand) – e.g. a deep **Navy Blue** `#0B3D91` (conveys trust and contrasts with white).  
  - Secondary – a warm **Coral/Gold** `#DAA520` (inspired by teeth in photos).  
  - Accent – a subtle **Sky Blue** `#79B4F9` (for links/buttons).  
  - Background – **Off-white** `#F9F9F9`.  
  - Text – **Dark Gray** `#333333` (for body text) and **White** `#FFFFFF` (for inverted text/over dark backgrounds).  
  - Neutral – **Gray** scales (`#F0F0F0`, `#E0E0E0`, `#CCCCCC`) for borders and backgrounds.  

- **Typography:**  
  - Sans-serif font stack: e.g. `font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;` (clean and readable).  
  - Heading font-weight: Bold (e.g. `font-semibold`). Body: Normal (e.g. `font-normal`).  
  - Base font-size: 16px (`text-base`). Scale headings with Tailwind (e.g. `text-2xl`, `text-xl`).  

- **Spacing & Layout:**  
  - Use Tailwind’s spacing scale (e.g. `p-4` = 1rem, `p-6` = 1.5rem).  
  - Content width constraints (max width) for readability, e.g. `max-w-4xl`.  
  - Breakpoints: use Tailwind defaults (sm: 640px, md: 768px, lg: 1024px, xl: 1280px) for responsive design.  

- **Other Tokens:**  
  - Border radius: `rounded-md`.  
  - Shadows: use subtle shadows (`shadow-sm`) for cards.  
  - Transitions: `transition` for hover effects on buttons/links.

These tokens are to be defined in `tailwind.config.js` (colors) and applied via Tailwind classes to ensure consistency. For example:  
```js
// tailwind.config.js (excerpt)
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: '#0B3D91',
        coral: '#DAA520',
        sky: '#79B4F9',
        // ...etc
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
};
```
Improved UI/UX suggestions include adding hover/focus states to links and buttons, ensuring high contrast text (>=4.5:1), and reorganizing form layouts for clarity. 

## Component Inventory (React + Tailwind)  
Below is a proposed list of reusable components, with key props and variants. These cover the site’s repeated UI elements:

| **Component**            | **Description & Props**                                                                                                                                                                                                                          | **Variants**                            |
|--------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------|
| **`Navbar`**             | Responsive top navigation bar. Props: `logoSrc`, `logoAlt`, `menuItems: Array<{ label, href }>` (e.g. Home, About, Services...). Can include a “Contact” button prop.                                                                                 | `variant`: light/dark (inverted style)  |
| **`Footer`**             | Site footer with contact info. Props: `address`, `phone`, `email`, `copyright`.                                                                                                                                | None                                    |
| **`HeroSection`**        | Large banner section (used on home or subpages). Props: `title`, `subtitle`, `backgroundImage`.                                                                                                               | center/left/right alignment             |
| **`InfoCard`**           | Card with heading and text (for services list). Props: `title`, `description`, `imageSrc`, `imageAlt`.                                                                                                    | imagePosition: top/side                 |
| **`TestimonialCard`**    | Displays a quote and author name. Props: `quote`, `author`. Optionally `avatarSrc`.                                                                                                                          | None                                    |
| **`TestimonialsSlider`** | Carousel of `TestimonialCard`s. Props: `testimonials: Array`. Uses Swiper or similar.                                                                                                                         | autoplay on/off, arrows/dots            |
| **`FormInput`**          | Styled text input. Props: `label`, `name`, `type` (`text`/`email`/`tel`), `placeholder`, `required`.                                                                                                          | error state (red border)                |
| **`FormTextArea`**       | Styled textarea input. Props: `label`, `name`, `rows`, `placeholder`.                                                                                                                                        | error state                              |
| **`PrimaryButton`**      | Button. Props: `label`, `onClick`, `href` (optional link), `disabled`. Use Tailwind classes for style.                                                                                                        | variants: `primary` (brand color), `secondary` (outline) |
| **`FAQItem`**            | Single Q&A. Props: `question`, `answer`. Renders as an accordion (collapsible).                                                                                                                              | open/closed state                       |
| **`ImageGallery`**       | Grid of images (e.g. portfolio). Props: `images: Array<{src, alt}>`, optional `columns`.                                                                                                                    | columns based on screen size            |
| **`GoogleMapEmbed`**     | Embedded map iframe. Props: `src` (Google Maps URL).                                                                                                                                                       | responsive embed                        |
| **`AppointmentForm`**    | Form to request an appointment. Fields: `name`, `email`, `phone`, `date`, `notes`. Props: success callback.                                                                                               | date picker vs manual date input        |
| **`NewsletterSignup`**   | (If needed) email subscription form. Props: `placeholder`, `onSubmit`.                                                                                                                              | None                                    |

Each of these components can be styled entirely with Tailwind classes. For example, `Navbar` might use `flex`, `justify-between`, `items-center`, etc. These components should be documented with their props and example usage in code (see code samples section). 

## Project Structure & Build Scripts  
A recommended Next.js project layout:  
```
/components       (shared React components as above)
/pages            (Next.js pages)
/pages/api        (API routes)
/prisma           (Prisma schema and migrations)
/public           (static assets: images, favicon)
/styles           (global styles if any)
/utils            (helper functions, e.g. for auth)
/lib              (e.g. Prisma client export, Auth setup)
/tests            (Jest/Cypress tests)
tailwind.config.js
postcss.config.js
next.config.js
package.json
```
- **pages/index.js, about-us.js, services.js, etc.**: each Next.js page that uses the Layout (with Navbar/Footer) and static props as needed.  
- **pages/api/**: contains REST or tRPC endpoints (see next section).  
- **prisma/schema.prisma** and migrations: define models (see DB schema below).  
- **package.json** scripts: include `dev`, `build`, `start`, `lint`, `test`, etc. Example:
  ```json
  {
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint",
      "test": "jest"
    }
  }
  ```
- **tailwind.config.js** and **postcss.config.js**: configured for Tailwind (see sample).  

## Database Schema (Prisma Models)  
We propose the following Prisma schema to store site content and user data:

```prisma
// prisma/schema.prisma (snippet)
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum UserRole { ADMIN USER }

model User {
  id        Int      @id @default(autoincrement())
  name      String?
  email     String   @unique
  password  String?
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // relations: appointments, messages, etc.
}

model Appointment {
  id         Int      @id @default(autoincrement())
  user       User?    @relation(fields: [userId], references: [id])
  userId     Int?
  firstName  String
  lastName   String
  email      String
  phone      String?
  dateTime   DateTime
  notes      String?
  status     String   @default("PENDING") // or enum
  createdAt  DateTime @default(now())
}

model Testimonial {
  id        Int      @id @default(autoincrement())
  author    String
  content   String
  createdAt DateTime @default(now())
}

model GalleryImage {
  id        Int      @id @default(autoincrement())
  title     String?
  url       String
  altText   String?
  category  String?
  createdAt DateTime @default(now())
}

model ContactMessage {
  id        Int      @id @default(autoincrement())
  firstName String
  lastName  String
  email     String
  phone     String?
  message   String
  createdAt DateTime @default(now())
}

model FAQ {
  id        Int    @id @default(autoincrement())
  question  String
  answer    String
}

model Setting {
  id    Int    @id @default(autoincrement())
  key   String @unique
  value String
}
```

- **User/Authentication:** Stores admin/users. Admin users have `role = ADMIN`. Passwords (hashed) for credentials login (if used).  
- **Appointment:** For client booking requests. Optionally link to a User if clients register.  
- **Testimonial:** Stores client quotes.  
- **GalleryImage:** For portfolio images (can mark “Before/After” by `category`).  
- **ContactMessage:** Inquiries from forms (Contact, “smile check”, etc.).  
- **FAQ:** Could seed site FAQs from DB for easy editing.  
- **Setting:** For site-wide config (e.g. site title, social links).  

This schema can be converted into SQL migrations by running `prisma migrate dev`. Example SQL (MySQL) migration snippet:
```sql
CREATE TABLE `User` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191),
  `email` varchar(191) NOT NULL UNIQUE,
  `password` varchar(191),
  `role` varchar(191) NOT NULL DEFAULT 'USER',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);

CREATE TABLE `Appointment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int,
  `firstName` varchar(191) NOT NULL,
  `lastName` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(191),
  `dateTime` datetime NOT NULL,
  `notes` text,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL
);
```
(Other tables follow similarly.)

## API Routes and Authentication  
We will use Next.js API routes (or tRPC) secured with NextAuth. Proposed endpoints:

- **Authentication (NextAuth)**: `/api/auth/[...nextauth].js` for login. Use email/password (Credentials Provider) and optionally OAuth (Google). Define a session callback to enforce `role`. Admins manage content. (Credentials login can compare hashed password from `User` table.)

- **Public API** (no auth required or optional):
  - `GET /api/faqs` → list all FAQs.
  - `GET /api/services` → (if Services are in DB or static) fetch service descriptions.
  - `GET /api/gallery` → list gallery images.
  - `GET /api/testimonials` → list testimonials.
  - `POST /api/contact` → submit a ContactMessage (from Contact Us form).
  - `POST /api/smile-check` → submit a ContactMessage or Appointment (from smile check form).
  - `POST /api/request-info` → form submissions from Products & Materials or Portfolio page.
  - (Optionally) `POST /api/appointment` → client requests an appointment (if separate from contact forms).

- **Admin API** (requires auth, e.g. via session/cookie):
  - `GET/POST/PUT/DELETE /api/admin/appointments` – manage appointments (CRUD).
  - `GET/POST/PUT/DELETE /api/admin/testimonials` – manage testimonials.
  - `GET/POST/PUT/DELETE /api/admin/faqs` – edit FAQs.
  - `GET/POST/PUT/DELETE /api/admin/gallery` – upload/manage gallery images.
  - `GET/POST/PUT/DELETE /api/admin/users` – manage user roles/passwords.
  - `GET/POST /api/admin/settings` – change site settings.

Each API route will use the Prisma client to interact with MySQL. For example, a Next.js route might look like:

```js
// pages/api/testimonials.js
import { prisma } from '../../lib/prisma';
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const list = await prisma.testimonial.findMany();
    res.json(list);
  } else if (req.method === 'POST') {
    // (Auth check if admin)
    const { author, content } = req.body;
    const newTest = await prisma.testimonial.create({ data: { author, content } });
    res.status(201).json(newTest);
  }
  // handle other methods...
}
```

### Authentication Strategy  
Use [NextAuth](https://next-auth.js.org/): e.g. Credentials provider with Prisma adapter. In `pages/api/auth/[...nextauth].js` we configure:
```js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../../../lib/prisma";
import { verifyPassword } from "../../../lib/auth";

export default NextAuth({
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) throw new Error('No user found');
        const isValid = await verifyPassword(credentials.password, user.password);
        if (!isValid) throw new Error('Incorrect password');
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      }
    }),
  ],
  callbacks: {
    session({ session, token }) {
      session.user.id = token.sub;
      session.user.role = token.role; // custom
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
  },
  session: { jwt: true },
});
```
Protect admin API routes by checking `token.role === 'ADMIN'`. Use `getSession()` in API handlers to verify.

## Admin and Client Portal UX Flows

Below is a **user journey** flow diagram for site visitors (patients) and administrators. 

```mermaid
flowchart TD
  subgraph Client [Site Visitor / Client]
    A[Visit Site Homepage] --> B[Read Services / Info]
    B --> C[Click \"Make an Appointment\"]
    B --> D[Use Smile Check Form]
    D --> E{Answered Questions?}
    E -->|Yes| F[Fill & Submit Inquiry Form]
    E -->|No| B
    F --> G{Form Type}
    G -->|Consultation| ContactAPI
    G -->|Smile Check| SmileCheckAPI
    G -->|General| ContactAPI
    ContactAPI[API: ContactMessage created] --> DB[(MySQL)]
    SmileCheckAPI --> DB
  end
  subgraph Admin [Administrator Portal]
    H[Login (NextAuth)] --> I[Admin Dashboard]
    I --> J[Manage Appointments]
    I --> K[Manage Testimonials]
    I --> L[Manage FAQs / Content]
    I --> M[Site Settings]
    J --> DB
    K --> DB
    L --> DB
    M --> DB
  end
```

- **Client Flow:** The visitor browses pages, may fill in forms (Contact, Smile Check, Appointment). Submissions are sent to the appropriate API, saving to DB.  
- **Admin Flow:** Admin logs in, sees a dashboard. Can navigate to sections for Appointments, Testimonials, FAQs, Content (e.g. page text), and Settings. All actions use authenticated API routes (via the session).  

Admin pages might include: **Dashboard** (overview metrics), **Appointments** (list with status), **Testimonials Editor**, **Content Editor** (WYSIWYG or markdown editor for pages), **Gallery Manager** (upload before/after photos), **Settings** (site title, contact info). Authentication ensures only admins access these pages.

## Accessibility, SEO, and Performance

- **Accessibility (a11y):**  
  - Use semantic HTML (e.g. `<nav>`, `<main>`, `<form>`).  
  - All images must have meaningful `alt` attributes (e.g. `alt="Before and after smile transformation"`). Decorative images get empty `alt=""`.  
  - Form inputs should have associated `<label>`s for screen readers.  
  - Ensure color contrasts meet WCAG 2.1 (e.g. dark text on light bg).  
  - Keyboard navigation: focus states on buttons/links, skip links for navigation.  
  - Use ARIA roles for any dynamic widgets (e.g. aria-expanded for FAQ accordion).

- **SEO:**  
  - Add unique `<title>` and `<meta name="description">` for each page using Next.js `<Head>`. E.g. `<title>Dental Atelier – Smile Design Services</title>`.  
  - Use H1/H2 headings appropriately (we have H1 on each page, H2/H3 for sections as per content).  
  - Use meaningful link texts (instead of “click here”).  
  - Populate Open Graph tags (`og:title`, `og:description`, `og:image`) for social sharing (using site settings or defaults).  
  - Create a `sitemap.xml` and `robots.txt` if desired.  
  - Implement clean URLs (Next.js does by default) and canonical tags.

- **Performance:**  
  - Use Next.js Image Optimization (`<Image>`) for on-the-fly resizing of gallery and banner images (with lazy loading).  
  - Tree-shake and purge unused CSS via Tailwind’s JIT mode (removing unused classes).  
  - Serve static content with `getStaticProps` or `getServerSideProps` appropriately (content that rarely changes can be statically generated).  
  - Enable Gzip/Brotli on server (Vercel does this automatically).  
  - Use Prefetch/Preload for important resources (Next.js automates some prefetching).  
  - Minimize external scripts. The only external I/O is Google Maps iframe and possibly Facebook plugin – ensure they load asynchronously.

- **Internationalization (i18n):** While the current site is English-only, we can configure Next.js i18n if future multilingual support is needed (e.g. `next.config.js` with `i18n.locales = ['en', 'fr']`). Use a library like `next-i18next` for translations of UI labels. For now, assume English content.

## Deployment & CI/CD

Two deployment strategies are outlined:

1. **Vercel (recommended for Next.js):**  
   - Connect the Git repo to Vercel.  
   - On push to `main`, Vercel automatically builds (`npm run build`) and deploys.  
   - Environment variables (DATABASE_URL, NEXTAUTH_SECRET, etc.) set in Vercel dashboard.  
   - Custom domain (e.g. dentalatelier.co) points to Vercel.  
   - Vercel provides HTTPS by default.  
   - Use Vercel’s serverless functions for API routes (no extra setup required).  

2. **Docker + Kubernetes (self-hosted):**  
   - Create a `Dockerfile` for the Next.js app (multi-stage build: install deps, build, then run `next start`). For example:
     ```dockerfile
     FROM node:18-alpine AS builder
     WORKDIR /app
     COPY package*.json ./
     RUN npm install
     COPY . .
     RUN npm run build

     FROM node:18-alpine AS runner
     WORKDIR /app
     COPY --from=builder /app/next.config.js ./
     COPY --from=builder /app/.next ./.next
     COPY --from=builder /app/node_modules ./node_modules
     COPY --from=builder /app/public ./public
     COPY --from=builder /app/package*.json ./
     ENV NODE_ENV=production
     ENV PORT=3000
     EXPOSE 3000
     CMD ["npm", "run", "start"]
     ```
   - Build image and push to container registry (Docker Hub).  
   - Kubernetes manifests: deployment (with image), service (ClusterIP/LoadBalancer), ingress rules (host dentalatelier.co).  
   - Use K8s secrets for env vars.  
   - CI/CD (GitHub Actions/GitLab CI): on merge to main, build Docker image, push to registry, and update K8s cluster (using `kubectl apply` or a deployment strategy like ArgoCD).  
   - For the database, run a MySQL instance (managed service or separate container) behind persistent volume.  

In both cases, set up a CI pipeline (e.g. GitHub Actions) for testing: run `npm run lint`, `npm test`, and then deploy if successful.

## Testing Strategy  

- **Unit Tests:** Use Jest with React Testing Library. Write tests for React components (e.g. `Navbar`, `Footer`, forms). Example: test that `PrimaryButton` renders with correct label and variant class.  
- **Integration/API Tests:** Use Supertest or Jest to test API routes. Spin up a test database (SQLite or MySQL test schema) and verify API endpoints (e.g. POST /api/contact saves a message).  
- **E2E Tests:** Use Cypress or Playwright. Simulate user flows: e.g. navigate to Home, fill contact form, check database. Test login flow for admin, editing content.  
- **Accessibility Tests:** Run tools like axe or Lighthouse to audit accessibility and performance.  
- **Continuous Testing:** Configure CI to run tests on each pull request.

## Code Scaffolding Prompts and Samples

To guide automated code generation (e.g. with an AI assistant), here are sample prompts and template snippets:

- **Next.js Page (Services):**  
  *Prompt:* “Create a Next.js page at `pages/services.js` using React and Tailwind CSS. It should fetch service descriptions (list of objects with title and text) from an API (or `getStaticProps` with sample data) and render them as cards. Include a `<Head>` element for SEO title/meta.”  
  *Sample:*  
  ```js
  // pages/services.js
  import Head from 'next/head';
  import InfoCard from '../components/InfoCard';
  export default function Services({ services }) {
    return (
      <>
        <Head>
          <title>Services – Dental Atelier</title>
          <meta name="description" content="Learn about our dental lab services and pricing." />
        </Head>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Services</h1>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(service => (
              <InfoCard key={service.title} title={service.title} description={service.description} />
            ))}
          </div>
        </div>
      </>
    );
  }

  export async function getStaticProps() {
    const services = [ 
      { title: "Price estimation", description: "The price of your dental product is derived from the type of work..." },
      // ...other services
    ];
    return { props: { services } };
  }
  ```

- **Next.js API Route (Contact Form):**  
  *Prompt:* “Create a Next.js API route at `pages/api/contact.js` that accepts POST requests with JSON `{ firstName, lastName, email, message }` and saves it using Prisma (ContactMessage model). Return a 200 status.”  
  *Sample:*  
  ```js
  // pages/api/contact.js
  import { prisma } from '../../lib/prisma';

  export default async function handler(req, res) {
    if (req.method === 'POST') {
      const { firstName, lastName, email, message } = req.body;
      await prisma.contactMessage.create({ data: { firstName, lastName, email, message } });
      return res.status(200).json({ success: true });
    }
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
  ```

- **Prisma Schema (Testimonials):**  
  *Prompt:* “Write a Prisma model for a `Testimonial` table with fields `id`, `author`, `content`, `createdAt` (timestamp).”  
  *Sample:*  
  ```prisma
  model Testimonial {
    id        Int      @id @default(autoincrement())
    author    String
    content   String
    createdAt DateTime @default(now())
  }
  ```

- **Tailwind Config Sample:**  
  *Prompt:* “Create a `tailwind.config.js` file that adds custom colors `brand: '#0B3D91'` and `coral: '#DAA520'`, and sets `Inter` as the default sans font.”  
  *Sample:*  
  ```js
  // tailwind.config.js
  module.exports = {
    content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
    theme: {
      extend: {
        colors: {
          brand: '#0B3D91',
          coral: '#DAA520',
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        },
      },
    },
    plugins: [],
  };
  ```

- **PostCSS Config:**  
  *Sample:*  
  ```js
  // postcss.config.js
  module.exports = {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  };
  ```

- **SQL Migration Snippet (Appointments):**  
  *Prompt:* “Provide a SQL `CREATE TABLE` statement for an `Appointment` with fields `id`, `firstName`, `lastName`, `email`, `dateTime`.”  
  *Sample:*  
  ```sql
  CREATE TABLE `Appointment` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `dateTime` DATETIME NOT NULL,
    `notes` TEXT,
    `status` VARCHAR(20) DEFAULT 'PENDING',
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  ```

- **Mermaid Diagram for Architecture:**  
  *Prompt:* “Draw a high-level architecture diagram of the app using mermaid. Include Client, Next.js App, Prisma/MySQL, and indicate that NextAuth is used.”  
  *Sample:*  
  ```mermaid
  graph LR
    A[Browser] -->|requests| B[Next.js (Vercel)]
    B --> C[React Pages/Components]
    B --> D[API Routes]
    D -->|queries| E((MySQL via Prisma))
    B -.->|Auth| F(NextAuth)
    F --> E
  ```
  
These prompts and snippets give a starting point for generating the codebase. Each major feature (Navbar, Footer, forms, pages, API, authentication) should have a similar detailed prompt for the AI to fill in, followed by review.

---

**Sources:** Site content and structure were obtained by crawling the live site. All cited text above comes from those pages. Architectural, design token, and code suggestions are based on standard Next.js/Tailwind/Prisma practices and our UX analysis.

