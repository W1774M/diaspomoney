###############################
# STAGE 1: Builder
###############################
FROM node:24-alpine AS builder

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
ARG NEXT_PUBLIC_HOME_DIALOG_ENABLED
ARG NEXT_PUBLIC_HOME_DIALOG_TITLE
ARG NEXT_PUBLIC_HOME_DIALOG_MESSAGE
ARG NEXT_PUBLIC_HOME_DIALOG_CTA_LABEL
ARG NEXT_PUBLIC_HOME_DIALOG_CTA_HREF
ARG NEXT_PUBLIC_HOME_DIALOG_IMAGE_SRC
ARG NEXT_PUBLIC_HOME_DIALOG_IMAGE_HREF
ARG NEXT_PUBLIC_HOME_DIALOG_IMAGE_ALT

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV APP_URL=${APP_URL}
ENV API_URL=${API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# Note: Le nettoyage des guillemets est fait dans le code JavaScript (StripeCheckout.tsx)
# pour s'assurer que la clé est correcte même si elle contient des guillemets dans l'image
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_HOME_DIALOG_ENABLED=${NEXT_PUBLIC_HOME_DIALOG_ENABLED}
ENV NEXT_PUBLIC_HOME_DIALOG_TITLE=${NEXT_PUBLIC_HOME_DIALOG_TITLE}
ENV NEXT_PUBLIC_HOME_DIALOG_MESSAGE=${NEXT_PUBLIC_HOME_DIALOG_MESSAGE}
ENV NEXT_PUBLIC_HOME_DIALOG_CTA_LABEL=${NEXT_PUBLIC_HOME_DIALOG_CTA_LABEL}
ENV NEXT_PUBLIC_HOME_DIALOG_CTA_HREF=${NEXT_PUBLIC_HOME_DIALOG_CTA_HREF}
ENV NEXT_PUBLIC_HOME_DIALOG_IMAGE_SRC=${NEXT_PUBLIC_HOME_DIALOG_IMAGE_SRC}
ENV NEXT_PUBLIC_HOME_DIALOG_IMAGE_HREF=${NEXT_PUBLIC_HOME_DIALOG_IMAGE_HREF}
ENV NEXT_PUBLIC_HOME_DIALOG_IMAGE_ALT=${NEXT_PUBLIC_HOME_DIALOG_IMAGE_ALT}

RUN pnpm run build

###############################
# STAGE 2: Runner
###############################
FROM node:24-alpine AS runner

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
