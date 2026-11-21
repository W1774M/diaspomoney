# ⚡ Quick Start - Déploiement K3s

Guide rapide pour déployer DiaspoMoney sur K3s en 5 minutes.

## 🚀 Déploiement rapide

### 0. Configuration initiale (première fois seulement)

```bash
# Configurer kubectl pour K3s
./scripts/setup-kubectl.sh

# Initialiser le cluster
./scripts/init-k8s.sh
```

### 1. Vérifier le registry

```bash
./scripts/check-registry.sh
```

### 2. Build et push de l'image

```bash
# Dev
pnpm k8s:dev

# Recette
pnpm k8s:rct

# Production
pnpm k8s:prod
```

### 3. Déployer

```bash
# Utiliser le script automatisé
./scripts/deploy.sh dev
./scripts/deploy.sh rct
./scripts/deploy.sh prod

# Ou manuellement (Kustomize)
kubectl apply -f k8s/common/middlewares.yaml
kubectl apply -k k8s/app/overlays/dev
```

### 4. Vérifier

```bash
# Voir les pods
kubectl get pods -n diaspomoney

# Voir les logs
kubectl logs -l app=diaspomoney-dev -n diaspomoney --tail=200

# Vérifier le rollout
kubectl rollout status deploy/diaspomoney-dev -n diaspomoney
```

## 📚 Documentation complète

Pour plus de détails, consultez [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
