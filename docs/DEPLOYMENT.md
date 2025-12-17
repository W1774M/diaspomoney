# Guide de Déploiement - DiaspoMoney

## 📋 Structure des Environnements

- **dev** : Environnement de développement (`https://dev.diaspomoney.fr`)
- **rct** : Environnement de recette (`https://rct.diaspomoney.fr`)
- **prod** : Environnement de production (`https://app.diaspomoney.fr`)

## 🚀 Workflow de Déploiement

### Architecture

- **Docker Compose** : Build uniquement de l'application
- **Kubernetes** : Gère MongoDB, Redis, Traefik et le déploiement de l'application

### 1. Build de l'application

Les fichiers `docker-compose.{env}.yml` servent uniquement à builder les images Docker :

```bash
# Build dev
pnpm build:dev

# Build recette
pnpm build:rct

# Build production
pnpm build:prod
```

### 2. Push vers le registry Kubernetes

```bash
# Push dev
pnpm push:dev

# Push recette
pnpm push:rct

# Push production
pnpm push:prod
```

### 3. Déploiement complet (Build + Push)

```bash
# Dev
pnpm deploy:dev

# Recette
pnpm deploy:rct

# Production
pnpm deploy:prod
```

## 📝 Notes Importantes

1. **MongoDB et Redis** : Gérés par Kubernetes, pas dans Docker Compose
2. **Traefik** : Géré par Kubernetes
3. **Réseaux** : Gérés par Kubernetes
4. **Docker Compose** : Utilisé uniquement pour le build des images

## 🔧 Configuration par Environnement

Les URLs et configurations sont définies dans :
- `config/app.config.ts` : Configuration centralisée
- `lib/constants/index.ts` : Constantes de l'application

Les fichiers Docker Compose utilisent automatiquement les bonnes valeurs selon l'environnement via les build args.

## 🎯 Workflow Recommandé

1. **Développement local** : `pnpm dev` (sans Docker)
2. **Build pour K8s** : `pnpm deploy:dev` (build + push)
3. **Déploiement K8s** : Utiliser les manifests dans `k8s/`

