# syntax=docker/dockerfile:1
#
# Dental Atelier — production image.
#
# Three stages so the runtime image carries no build toolchain, no source and
# no dev dependencies:
#   deps     — install node_modules (cached separately from the source)
#   builder  — generate the Prisma client and run `next build`
#   runner   — copy only what `next start` needs
#
# Build:
#   docker build -t dental-atelier .
# Run (Compose does this for you):
#   docker run -p 3031:3031 --env-file .env.production dental-atelier

# Prisma 7 requires Node 20.19+ / 22.12+ / 24+, so every stage pins 24.
ARG NODE_VERSION=24

# ---------------------------------------------------------------- deps stage
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app

# libc6-compat is required by the MariaDB client library on Alpine, and sharp
# links against it through its musl prebuilds.
RUN apk add --no-cache libc6-compat openssl

# Only the manifests first, so `npm ci` is cached until a dependency changes.
COPY package.json package-lock.json* ./
# `--ignore-scripts` because the postinstall of @prisma/client is not needed
# here; `prisma generate` runs explicitly in the builder stage.
RUN npm ci --no-audit --no-fund --ignore-scripts

# ------------------------------------------------------------- builder stage
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `prisma generate` must run after the schema is present.
RUN npx prisma generate

# `next build` reads DATABASE_URL/NEXTAUTH_SECRET only if the build itself
# needs them; pass build-safe placeholders so the image builds without secrets.
# Real values are injected at runtime (see the runner stage).
RUN DATABASE_URL="mysql://build:build@127.0.0.1:3306/build" \
    NEXTAUTH_SECRET="build-time-placeholder-not-used-at-runtime" \
    NEXT_OUTPUT_STANDALONE=true \
    npx next build

# -------------------------------------------------------------- runner stage
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl wget \
 && addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3031 \
    HOSTNAME=0.0.0.0

# `public` is copied separately because it is also bind-mounted in production
# to serve `public/uploads` without rebuilding the image.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Standalone output contains a pruned server and only the traced dependencies.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Uploads live here at runtime; mount a volume so admin uploads survive a
# container replacement. `.tmp-uploads` is where formidable stages an incoming
# file before it is transcoded — it is created and removed per request, but the
# app user needs write access to the directory itself.
RUN mkdir -p /app/public/uploads /app/.tmp-uploads \
 && chown -R nextjs:nodejs /app/public/uploads /app/.tmp-uploads
VOLUME ["/app/public/uploads"]

USER nextjs
EXPOSE 3031

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3031/api/health || exit 1

CMD ["node", "server.js"]