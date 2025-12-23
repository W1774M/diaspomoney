# Configuration Kubernetes - DiaspoMoney

## 📁 Structure de l'architecture

```text
k8s/
├── app/
│   ├── prod/
│   │   ├── deployment.yaml      # Déploiement production (diaspomoney.fr)
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
│
├── secrets.yaml                # Secrets partagés (app-secrets, mongodb-secret, redis-secret, mongo-express-*)
│
├── mongodb/
│   ├── deployment.yaml         # Déploiement MongoDB
│   ├── service.yaml            # Service MongoDB
│   ├── pvc.yaml                # PersistentVolumeClaim pour données
│   ├── ingress-tcp.yaml        # Accès TCP MongoDB via Traefik (entryPoint `mongo`)
│   └── middleware-ip.yaml      # Whitelist IP (si tu exposes Mongo en TCP)
│
├── mongo-express/
│   ├── deployment.yml          # Déploiement Mongo Express
│   ├── service.yaml            # Service Mongo Express
│   ├── ingress.yaml            # Ingress (HTTP) pour mongo.diaspomoney.fr
│   └── mongo-express-middleware.yaml  # Auth basic Traefik (référence un Secret)
│
├── redis/
│   ├── deployment.yaml         # Déploiement Redis
│   ├── service.yaml            # Service Redis
│
└── traefik/                    # Configurations Traefik
    ├── traefik.yaml            # ConfigMap Traefik (ACME / certResolver)
    ├── traefik-values.yaml     # Arguments additionnels (si install via Helm)
    └── middlewares.yaml        # Middlewares requis (https-redirect, security-headers)
```

## 🚀 Déploiement

### 1. Créer le namespace

```bash
kubectl create namespace diaspomoney
```

### 2. Déployer les secrets (obligatoire)

```bash
# Secrets (app + mongodb + redis + mongo-express)
kubectl apply -f k8s/secrets.yaml
```

### 3. Traefik : middlewares requis (obligatoire pour les IngressRoute)

Les manifests `k8s/app/*/ingress.yaml` utilisent :

- `https-redirect` (HTTP → HTTPS)
- `security-headers` (headers de sécurité)

```bash
kubectl apply -f k8s/traefik/middlewares.yaml
```

### 4. MongoDB : script d'init (requis par le déploiement)

Le déploiement MongoDB monte un ConfigMap nommé `mongo-init-script`.
Le fichier source est `docker/mongo-init.js` (à **adapter** si besoin, il contient des données/credentials de dev).

```bash
kubectl create configmap mongo-init-script ^
  --from-file=mongo-init.js=docker/mongo-init.js ^
  -n diaspomoney ^
  --dry-run=client -o yaml | kubectl apply -f -
```

### 5. Déployer MongoDB

```bash
kubectl apply -f k8s/mongodb/
```

### 6. Déployer Redis

```bash
kubectl apply -f k8s/redis/
```

### 7. Déployer les applications

```bash
# Développement
kubectl apply -f k8s/app/dev/

# Recette
kubectl apply -f k8s/app/rct/

# Production
kubectl apply -f k8s/app/prod/
```

### 8. (Optionnel) Déployer Mongo Express

```bash
kubectl apply -f k8s/mongo-express/
```

## 🌐 URLs d'accès

- **Production**: `https://diaspomoney.fr`
- **Recette**: `https://rct.diaspomoney.fr`
- **Développement**: `https://dev.diaspomoney.fr`
- **Mongo Express**: `https://mongo.diaspomoney.fr`

## 📝 Notes importantes

1. **Secrets**: Les fichiers `secrets.yaml` contiennent des valeurs sensibles. Ne jamais les commiter avec les vraies valeurs en production.

2. **TLS**: Les certificats TLS sont gérés par Traefik via `certResolver: le` (ACME). Pour l'Ingress Kubernetes de Mongo Express, le secret TLS `mongo-express-tls` est créé/renouvelé automatiquement par Traefik.

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
kubectl logs -f deployment/diaspomoney-prod -n diaspomoney

# MongoDB
kubectl logs -f deployment/diaspomoney-mongo -n diaspomoney

# Redis
kubectl logs -f deployment/diaspomoney-redis -n diaspomoney
```

### Redémarrer un déploiement

```bash
kubectl rollout restart deployment/diaspomoney-prod -n diaspomoney
```
