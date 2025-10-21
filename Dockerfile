# DiaspoMoney - Dockerfile unique pour dev/prod
# Multi-stage build optimisé

# === BUILD STAGE ===
FROM node:18-alpine AS builder

# Installer les dépendances système
RUN apk add --no-cache libc6-compat

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Installer pnpm
RUN npm install -g pnpm

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Copier le code source
COPY . .

# Build pour la production
RUN pnpm run build

# === PRODUCTION STAGE ===
FROM node:18-alpine AS runner

# Installer les dépendances système
RUN apk add --no-cache libc6-compat dumb-init

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# Définir les permissions
RUN chown -R nextjs:nodejs /app

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Exposer le port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Utilisateur non-root
USER nextjs

# Point d'entrée avec dumb-init pour la gestion des signaux
ENTRYPOINT ["dumb-init", "--"]

# Commande par défaut (production)
CMD ["node", "server.js"]
