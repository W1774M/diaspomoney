# Étape 1 : Build de l'application
FROM node:latest AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier uniquement les fichiers nécessaires pour installer les dépendances
COPY package.json pnpm-lock.yaml ./

# Installer les dépendances
RUN npm install -g pnpm && pnpm install --no-frozen-lockfile

# Copier tout le projet
COPY . .

# S'assurer que le dossier public existe (au cas où .dockerignore ou le repo ne l'inclut pas)
RUN test -d public || mkdir -p public

# Construire l'application Next.js
RUN pnpm run build

# Étape 2 : Image finale pour l'exécution
FROM builder AS runner

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires depuis l'étape de build
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public
COPY --from=builder /app/next.config.mjs /app/

# Installer uniquement les dépendances nécessaires pour exécuter l'application
RUN npm install -g pnpm && pnpm install --production --no-frozen-lockfile --ignore-scripts

# Exposer le port de l'application
EXPOSE 3000

# Démarrer l'application
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
CMD ["pnpm", "start"]
