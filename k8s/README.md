# Configuration Kubernetes - DiaspoMoney

## 📁 Structure de l'architecture

```
k8s/
├── app/
│   ├── prod/
│   │   ├── deployment.yaml      # Déploiement production (app.diaspomoney.fr)
│   │   ├── service.yaml        # Service ClusterIP pour prod
│   │   └── ingress.yaml        # IngressRoute Traefik pour prod
│   ├── rct/
│   │   ├── deployment.yaml     # Déploiement recette (rct.diaspomoney.fr)
│   │   ├── service.yaml        # Service ClusterIP pour rct
│   │   └── ingress.yaml        # IngressRoute Traefik pour rct
│   ├── dev/
│   │   ├── deployment.yaml     # Déploiement développement (dev.diaspomoney.fr)
│   │   ├── service.yaml       # Service ClusterIP pour dev
│   │   └── ingress.yaml       # IngressRoute Traefik pour dev
│   └── secrets.yaml            # Secrets partagés (JWT, OAuth, API keys)
│
├── mongodb/
│   ├── deployment.yaml         # Déploiement MongoDB
│   ├── service.yaml            # Service MongoDB
│   ├── pvc.yaml                # PersistentVolumeClaim pour données
│   ├── ingress-mongo.yaml     # IngressRoute pour Mongo Express (mongo.diaspomoney.fr)
│   ├── configmap-init.yaml    # Script d'initialisation MongoDB
│   ├── mongo-express.yaml     # Déploiement Mongo Express
│   └── secrets.yaml            # Secrets MongoDB (credentials)
│
├── redis/
│   ├── deployment.yaml         # Déploiement Redis
│   ├── service.yaml            # Service Redis
│   └── secrets.yaml            # Secrets Redis (password)
│
├── monitoring/                 # Configurations de monitoring (Prometheus, Grafana, etc.)
│
└── traefik/                    # Configurations Traefik
    └── traefik-config.yaml
```

## 🚀 Déploiement

### 1. Créer le namespace

```bash
kubectl create namespace diaspomoney
```

### 2. Déployer les secrets

```bash
# Secrets MongoDB
kubectl apply -f k8s/mongodb/secrets.yaml

# Secrets Redis
kubectl apply -f k8s/redis/secrets.yaml

# Secrets Application (JWT, OAuth, API keys)
kubectl apply -f k8s/app/secrets.yaml
```

### 3. Déployer MongoDB

```bash
kubectl apply -f k8s/mongodb/
```

### 4. Déployer Redis

```bash
kubectl apply -f k8s/redis/
```

### 5. Déployer les applications

```bash
# Développement
kubectl apply -f k8s/app/dev/

# Recette
kubectl apply -f k8s/app/rct/

# Production
kubectl apply -f k8s/app/prod/
```

## 🌐 URLs d'accès

- **Production**: https://app.diaspomoney.fr
- **Recette**: https://rct.diaspomoney.fr
- **Développement**: https://dev.diaspomoney.fr
- **Mongo Express**: https://mongo.diaspomoney.fr

## 📝 Notes importantes

1. **Secrets**: Les fichiers `secrets.yaml` contiennent des valeurs sensibles. Ne jamais les commiter avec les vraies valeurs en production.

2. **TLS**: Les certificats TLS sont gérés via Kubernetes Secrets (`app-tls-cert`, `dev-tls-cert`, `rct-tls-cert`, `mongo-tls-cert`).

3. **Persistance**: MongoDB utilise un PersistentVolumeClaim pour la persistance des données. Redis utilise `emptyDir` (à migrer vers PVC en production).

4. **CDN**: Les variables CDN sont préparées dans les secrets mais désactivées par défaut. Voir `.env.example` pour l'activation.

## 🔧 Maintenance

### Vérifier les pods

```bash
kubectl get pods -n diaspomoney
```

### Vérifier les services

```bash
kubectl get svc -n diaspomoney
```

### Vérifier les ingress

```bash
kubectl get ingressroute -n diaspomoney
```

### Logs

```bash
# Application production
kubectl logs -f deployment/diaspomoney-app -n diaspomoney

# MongoDB
kubectl logs -f deployment/diaspomoney-mongo -n diaspomoney

# Redis
kubectl logs -f deployment/diaspomoney-redis -n diaspomoney
```

### Redémarrer un déploiement

```bash
kubectl rollout restart deployment/diaspomoney-app -n diaspomoney
```
