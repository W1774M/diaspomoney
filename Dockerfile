# Étape 1 : Build de l'application
FROM node:latest AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier uniquement les fichiers nécessaires pour installer les dépendances
COPY package.json pnpm-lock.yaml ./

# Installer les dépendances
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copier tout le projet
COPY . .

# Construire l'application Next.js
RUN pnpm run build

# Étape 2 : Image finale pour l'exécution
FROM node:latest

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires depuis l'étape de build
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public
COPY --from=builder /app/next.config.ts /app/

# Installer uniquement les dépendances nécessaires pour exécuter l'application
RUN npm install -g pnpm && pnpm install --production --frozen-lockfile --ignore-scripts

# Exposer le port de l'application
EXPOSE 3000

# Démarrer l'application
CMD ["pnpm", "start"]
