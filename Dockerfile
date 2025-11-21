###############################
# 1. BUILD (Next.js) - Optionnel si USE_LOCAL_BUILD=true
###############################
FROM node:lts-alpine AS builder

# ---- ARGUMENTS D'ENVIRONNEMENT ----
ARG ENV=prod
ARG NODE_ENV=production
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ARG USE_LOCAL_BUILD=false

# ---- INSTALL PNPM SANS REGISTRY (local .tar ok) ----
RUN apk add --no-cache wget curl libc6-compat && \
    (wget -qO /bin/pnpm https://github.com/pnpm/pnpm/releases/latest/download/pnpm-linuxstatic-x64 \
    || curl -fsSL https://github.com/pnpm/pnpm/releases/latest/download/pnpm-linuxstatic-x64 -o /bin/pnpm) && \
    chmod +x /bin/pnpm

# ---- TRAVAIL ----
WORKDIR /app

# Copier les fichiers pour installation des deps
COPY package.json pnpm-lock.yaml ./

# Installer toutes les dépendances (mode build)
RUN pnpm install --frozen-lockfile --offline || pnpm install --frozen-lockfile

# Si USE_LOCAL_BUILD=true, copier seulement .next, sinon copier le code et builder
COPY . .

# ---- VARIABLES POUR LE BUILD ----
ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

# ---- BUILD NEXT.JS (seulement si USE_LOCAL_BUILD=false) ----
RUN if [ "$USE_LOCAL_BUILD" != "true" ]; then pnpm run build; fi


###############################
# 2. RUNTIME (Exécution)
###############################
FROM node:lts-alpine AS runner

# Copier pnpm depuis builder
COPY --from=builder /bin/pnpm /bin/pnpm

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Création user non root
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Copier uniquement les fichiers nécessaires
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# Installer seulement les deps de prod
RUN pnpm install --prod --frozen-lockfile --offline || pnpm install --prod --frozen-lockfile && \
    chown -R nextjs:nodejs /app

# Copier le build
# Si USE_LOCAL_BUILD=true, .next doit être dans le contexte (modifier .dockerignore avant build)
# Si USE_LOCAL_BUILD=false, copier depuis builder
ARG USE_LOCAL_BUILD=false
# Copier .next depuis le contexte (sera disponible si .dockerignore a été modifié)
COPY --chown=nextjs:nodejs .next ./.next
# Copier les autres fichiers depuis builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/proxy.ts ./proxy.ts

USER nextjs

# ---- VARIABLES RUNTIME (modifiable dans Kubernetes) ----
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Exposer le port
EXPOSE 3000

# Lancer Next.js
CMD ["pnpm", "start"]
