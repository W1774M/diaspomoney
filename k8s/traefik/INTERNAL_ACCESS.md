## Protection des environnements DEV / RCT (accès équipe interne)

Objectif : protéger `dev.diaspomoney.fr` et `rct.diaspomoney.fr` derrière une authentification HTTP Basic gérée par Traefik.

### 1) Créer le secret BasicAuth (htpasswd)

Le middleware `internal-basic-auth` attend un secret Kubernetes nommé `internal-basic-auth` dans le namespace `diaspomoney`, avec une clé `users` au format htpasswd.

Sur ta machine (Ubuntu), installe `apache2-utils` si besoin :

```bash
sudo apt-get update && sudo apt-get install -y apache2-utils
```

Créer un utilisateur (ex: `team`) :

```bash
kubectl -n diaspomoney create secret generic internal-basic-auth \
  --from-literal=users="$(htpasswd -nbB team 'CHANGE_ME_PASSWORD')" \
  --dry-run=client -o yaml | kubectl apply -f -
```

Pour ajouter plusieurs utilisateurs, concatène plusieurs lignes htpasswd (ou recrée le secret avec un fichier).

### 2) Appliquer les manifests Traefik + IngressRoutes

```bash
kubectl -n diaspomoney apply -f k8s/traefik/middlewares.yaml
kubectl -n diaspomoney apply -f k8s/app/dev/ingress.yaml
kubectl -n diaspomoney apply -f k8s/app/rct/ingress.yaml
```

### 3) IMPORTANT: Ingress "legacy" dev déjà présent dans le cluster

Ton cluster contient aussi un `Ingress` Kubernetes classique `diaspomoney-dev-ingress` (en plus des `IngressRoute`).
Pour le protéger, applique l’annotation middleware Traefik suivante :

```bash
kubectl -n diaspomoney annotate ingress diaspomoney-dev-ingress \
  traefik.ingress.kubernetes.io/router.middlewares="diaspomoney-internal-basic-auth@kubernetescrd" \
  --overwrite
```

### 4) Vérification

```bash
kubectl -n diaspomoney get ingressroute | grep -E 'dev|rct'
kubectl -n diaspomoney get middleware | grep internal-basic-auth
```

Ensuite, accéder à `https://dev.diaspomoney.fr` / `https://rct.diaspomoney.fr` doit demander un login/mot de passe.


