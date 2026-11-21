# Configuration Kubernetes — DiaspoMoney

## Structure

```
k8s/
├── app/
│   ├── base/                     # Kustomize base (Deployment + Service partagés)
│   │   ├── kustomization.yaml
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── overlays/
│   │   ├── dev/                  # canonical: kubectl apply -k k8s/app/overlays/dev
│   │   ├── rct/
│   │   └── prod/
│   ├── dev/                      # thin wrapper → overlays/dev
│   ├── rct/                      # thin wrapper → overlays/rct
│   └── prod/                     # thin wrapper → overlays/prod
│
├── common/
│   └── middlewares.yaml          # Traefik: https-redirect + security-headers
│
├── mongodb/
├── redis/
├── mongo-express/
│   ├── deployment.yaml
│   ├── secrets.example.yaml      # placeholders only — never real passwords
│   └── …
│
└── traefik/
```

## Déploiement

### 1. Namespace

```bash
kubectl create namespace diaspomoney
```

### 2. Secrets (hors git — ne jamais committer de vraies valeurs)

```bash
# Déjà en cluster (ne pas régénérer à l’aveugle) :
#   mongodb-secret, redis-secret, app-secrets
#
# Mongo Express Traefik basicAuth (clé `users` = htpasswd) :
htpasswd -nbB admin 'STRONG_PASSWORD' \
  | kubectl create secret generic mongo-express-traefik-auth \
      --from-file=users=/dev/stdin -n diaspomoney --dry-run=client -o yaml \
  | kubectl apply -f -
# Ou éditer localement k8s/mongo-express/secrets.example.yaml (non commité)
```

### 3. Middlewares Traefik (une fois)

```bash
kubectl apply -f k8s/common/middlewares.yaml
```

### 4. Infra

```bash
kubectl apply -f k8s/mongodb/
kubectl apply -f k8s/redis/
```

### 5. Application (Kustomize)

```bash
# Canonique
kubectl apply -k k8s/app/overlays/dev
kubectl apply -k k8s/app/overlays/rct
kubectl apply -k k8s/app/overlays/prod

# Équivalent via wrappers (rétrocompat)
kubectl apply -k k8s/app/dev
kubectl apply -k k8s/app/rct
kubectl apply -k k8s/app/prod
```

Prévisualiser le rendu :

```bash
kubectl kustomize k8s/app/overlays/dev
```

## Hostnames

| Env  | Host                 | Deployment         | Service                    |
|------|----------------------|--------------------|----------------------------|
| prod | `diaspomoney.fr`     | `diaspomoney-prod` | `diaspomoney-prod-service` |
| rct  | `rct.diaspomoney.fr` | `diaspomoney-rct`  | `diaspomoney-rct-service`  |
| dev  | `dev.diaspomoney.fr` | `diaspomoney-dev`  | `diaspomoney-dev-service`  |

Namespace : `diaspomoney`.

## Notes

1. **TLS** : les IngressRoutes utilisent `certResolver: le` (Let's Encrypt via Traefik). Les anciens secrets manuels (`dev-tls-cert`, etc.) ne sont plus référencés par les IngressRoutes app.
2. **Redis** : `REDIS_HOST` + `REDIS_PORT` + `REDIS_PASSWORD` (secret `redis-secret`). Pas de `REDIS_URL` avec `$(REDIS_PASSWORD)` — Kubernetes n’expand pas le shell dans les env.
3. **MongoDB** : clés `connection-string-dev` / `connection-string-rct` / `connection-string` selon l’overlay.
4. **Probes** : liveness `GET /` (processus up) ; readiness `GET /api/health` (dépendances). Ne pas utiliser `/api/health` en liveness — un 503 Mongo provoque une boucle de redémarrage.
5. **Stripe publishable** : `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (aligné rct/prod).
6. **Redis requirepass** : le Deployment Redis passe par `sh -c` pour expand `$REDIS_PASSWORD` (K8s n’expand pas les env dans un `command` argv).

## Maintenance

```bash
kubectl get pods,svc,ingressroute -n diaspomoney
kubectl logs -f deployment/diaspomoney-prod -n diaspomoney
kubectl rollout restart deployment/diaspomoney-prod -n diaspomoney
```
