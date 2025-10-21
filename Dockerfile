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

# Installer les dépendances (incluant dev dependencies pour Tailwind CSS)
RUN pnpm install --frozen-lockfile

# Copier le code source
COPY . .

# Nettoyer le cache .next et build pour la production avec compilation Tailwind CSS
ENV NODE_ENV=production
RUN rm -rf .next
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

# Copier le build Next.js depuis le builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copier les fichiers de configuration s'ils existent
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# Installer pnpm et les dépendances (production + dev pour Tailwind)
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Créer le dossier public et copier s'il existe
RUN mkdir -p ./public

# Copier le dossier public s'il existe, sinon laisser vide
COPY --from=builder /app/public ./public

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

# Commande par défaut (production) - utiliser pnpm pour utiliser la version correcte
CMD ["pnpm", "start"]
