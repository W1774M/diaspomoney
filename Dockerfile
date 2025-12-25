###############################
# STAGE 1: Builder
###############################
FROM node:20-alpine AS builder

# Install system deps
RUN apk add --no-cache python3 make g++ git libc6-compat

WORKDIR /app

# Enable pnpm from package.json
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack install

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy app files
# Note: COPY . . invalide le cache si les fichiers changent
# Pour forcer un rebuild complet, utiliser --no-cache lors du docker build
COPY . .

# Build Next.js
# Accept build args for NEXT_PUBLIC_* variables
ARG NEXTAUTH_URL
ARG APP_URL
ARG API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV APP_URL=${APP_URL}
ENV API_URL=${API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# Note: Le nettoyage des guillemets est fait dans le code JavaScript (StripeCheckout.tsx)
# pour s'assurer que la clé est correcte même si elle contient des guillemets dans l'image
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}

RUN pnpm run build

###############################
# STAGE 2: Runner
###############################
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack install && pnpm fetch

# Install production deps
RUN pnpm install --prod --offline --ignore-scripts

# Copy build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# Copy data directory if it exists
COPY --from=builder /app/data ./data

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["pnpm", "start"]
