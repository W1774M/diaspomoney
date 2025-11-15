# Étape 1 : Build de l'application
FROM node:20-alpine AS builder

# Installer pnpm
RUN npm install -g pnpm

# Dépendances système nécessaires (sharp, etc.)
RUN apk add --no-cache libc6-compat

# Définir le répertoire de travail
WORKDIR /app

# Copier uniquement les fichiers nécessaires pour installer les dépendances
COPY package.json pnpm-lock.yaml ./

# Installer toutes les dépendances (y compris devDependencies pour le build)
RUN pnpm install --frozen-lockfile

# Copier tout le projet
COPY . .

# Construire l'application Next.js
RUN pnpm run build

# Étape 2 : Image finale pour l'exécution
FROM node:20-alpine AS runner

# Installer pnpm et dépendances système (sharp, healthcheck)
RUN npm install -g pnpm && apk add --no-cache curl libc6-compat

# Définir le répertoire de travail
WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires depuis l'étape de build
COPY --from=builder --chown=nextjs:nodejs /app/package.json /app/pnpm-lock.yaml ./

# Installer uniquement les dépendances de production (en tant que root, puis chown)
RUN pnpm install --production --frozen-lockfile && \
    chown -R nextjs:nodejs /app

# Copier les fichiers build et config avec la bonne propriété
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

# Passer à l'utilisateur non-root
USER nextjs

# Exposer le port de l'application
EXPOSE 3000

# Variables d'environnement
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Démarrer l'application
CMD ["pnpm", "start"]