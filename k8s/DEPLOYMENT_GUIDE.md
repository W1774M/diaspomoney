# Guide de Déploiement Kubernetes

Ce guide vous accompagne dans le déploiement de DiaspoMoney sur Kubernetes.

## 📋 Prérequis

### Infrastructure

- **Cluster Kubernetes** (v1.24+)
- **kubectl** configuré et connecté au cluster
- **Ingress Controller** (Nginx ou Traefik)
- **Cert-Manager** (optionnel, pour Let's Encrypt)
- **StorageClass** configuré pour les PersistentVolumes
- **Registry Docker** pour stocker les images

### Outils

```bash
# Vérifier l'accès au cluster
kubectl cluster-info

# Vérifier les nodes
kubectl get nodes

# Vérifier le StorageClass
kubectl get storageclass
```

## 🚀 Déploiement Rapide

### Option 1: Script automatisé

```bash
# Générer les secrets
./k8s/scripts/generate-secrets.sh

# Éditer les secrets avec vos vraies valeurs
vim k8s/secrets/secrets.yaml

# Déployer
./k8s/scripts/deploy.sh prod
```

### Option 2: Déploiement manuel

```bash
# 1. Créer le namespace
kubectl apply -f k8s/environments/prod-namespace.yaml

# 2. Créer les ConfigMaps
kubectl apply -f k8s/configmaps/

# 3. Créer les Secrets (après les avoir configurés)
kubectl apply -f k8s/secrets/

# 4. Déployer MongoDB
kubectl apply -f k8s/mongodb/

# 5. Déployer Redis
kubectl apply -f k8s/redis/

# 6. Déployer l'application
kubectl apply -f k8s/app/

# 7. Déployer l'Ingress
kubectl apply -f k8s/ingress/
```

### Option 3: Kustomize

```bash
# Utiliser Kustomize pour gérer les environnements
kubectl apply -k k8s/
```

## 🔧 Configuration

### 1. Secrets

Les secrets contiennent des informations sensibles. **Ne jamais les commiter dans Git !**

#### Génération automatique

```bash
./k8s/scripts/generate-secrets.sh
```

Cela génère des secrets avec des valeurs aléatoires pour :
- `AUTH_SECRET`
- `NEXTAUTH_SECRET`
- `JWT_SECRET`
- `MONGO_PASSWORD`
- `REDIS_PASSWORD`

#### Configuration manuelle

Éditez `k8s/secrets/secrets.yaml` et remplacez :
- `YOUR_GOOGLE_CLIENT_ID` → Votre Google Client ID
- `YOUR_GOOGLE_CLIENT_SECRET` → Votre Google Client Secret
- `YOUR_FACEBOOK_CLIENT_ID` → Votre Facebook Client ID
- `YOUR_FACEBOOK_CLIENT_SECRET` → Votre Facebook Client Secret
- `YOUR_SMTP_PASSWORD` → Votre mot de passe SMTP
- `YOUR_STRIPE_SECRET_KEY` → Votre clé secrète Stripe
- `YOUR_STRIPE_PUBLISHABLE_KEY` → Votre clé publique Stripe
- `YOUR_STRIPE_WEBHOOK_SECRET` → Votre secret webhook Stripe
- `YOUR_SENTRY_DSN` → Votre DSN Sentry

### 2. ConfigMaps

Les ConfigMaps contiennent des configurations non-sensibles. Vous pouvez les modifier selon vos besoins :

```bash
vim k8s/configmaps/app-config.yaml
kubectl apply -f k8s/configmaps/app-config.yaml
```

### 3. Image Docker

#### Construire l'image

```bash
docker build -t diaspomoney-app:latest .
```

#### Pousser vers un registry

```bash
# Tag pour votre registry
docker tag diaspomoney-app:latest your-registry/diaspomoney-app:v1.0.0

# Pousser
docker push your-registry/diaspomoney-app:v1.0.0
```

#### Mettre à jour le deployment

Éditez `k8s/app/deployment.yaml` :

```yaml
image: your-registry/diaspomoney-app:v1.0.0
imagePullPolicy: Always
```

Si vous utilisez un registry privé, créez un Secret :

```bash
kubectl create secret docker-registry registry-secret \
  --docker-server=your-registry \
  --docker-username=your-username \
  --docker-password=your-password \
  --docker-email=your-email \
  -n diaspomoney-prod
```

Puis ajoutez dans le deployment :

```yaml
spec:
  template:
    spec:
      imagePullSecrets:
      - name: registry-secret
```

## 📊 Monitoring

### Vérifier le statut

```bash
# Pods
kubectl get pods -n diaspomoney-prod

# Services
kubectl get svc -n diaspomoney-prod

# Ingress
kubectl get ingress -n diaspomoney-prod

# HPA
kubectl get hpa -n diaspomoney-prod
```

### Logs

```bash
# Logs de l'application
kubectl logs -f deployment/diaspomoney-app -n diaspomoney-prod

# Logs d'un pod spécifique
kubectl logs -f <pod-name> -n diaspomoney-prod

# Logs de tous les pods
kubectl logs -f -l app=diaspomoney -n diaspomoney-prod
```

### Métriques

```bash
# Utilisation des ressources
kubectl top pods -n diaspomoney-prod
kubectl top nodes

# Détails d'un pod
kubectl describe pod <pod-name> -n diaspomoney-prod
```

## 🔄 Mise à jour

### Rolling Update

```bash
# Mettre à jour l'image
kubectl set image deployment/diaspomoney-app \
  app=your-registry/diaspomoney-app:v1.1.0 \
  -n diaspomoney-prod

# Suivre le rollout
kubectl rollout status deployment/diaspomoney-app -n diaspomoney-prod

# Voir l'historique
kubectl rollout history deployment/diaspomoney-app -n diaspomoney-prod
```

### Rollback

```bash
# Rollback vers la version précédente
kubectl rollout undo deployment/diaspomoney-app -n diaspomoney-prod

# Rollback vers une version spécifique
kubectl rollout undo deployment/diaspomoney-app \
  --to-revision=2 \
  -n diaspomoney-prod
```

## 📦 Scaling

### Scaling manuel

```bash
# Changer le nombre de replicas
kubectl scale deployment diaspomoney-app --replicas=5 -n diaspomoney-prod
```

### Scaling automatique (HPA)

Le HPA est configuré dans `k8s/app/hpa.yaml`. Il scale automatiquement entre 2 et 10 replicas.

```bash
# Vérifier le HPA
kubectl get hpa -n diaspomoney-prod

# Détails du HPA
kubectl describe hpa diaspomoney-app-hpa -n diaspomoney-prod
```

## 💾 Backup et Restore

### Backup MongoDB

```bash
./k8s/scripts/backup-mongodb.sh diaspomoney-prod
```

Le backup sera sauvegardé dans `./backups/mongodb-YYYYMMDD-HHMMSS.tar.gz`

### Restore MongoDB

```bash
./k8s/scripts/restore-mongodb.sh ./backups/mongodb-20231108-120000.tar.gz diaspomoney-prod
```

⚠️ **Attention** : Le restore supprime les données existantes (`--drop`)

## 🔒 Sécurité

### Network Policies

Les Network Policies sont dans `k8s/network-policies/`. Elles restreignent la communication entre pods.

```bash
kubectl apply -f k8s/network-policies/
```

### RBAC

Les ServiceAccounts et RBAC sont dans `k8s/rbac/`.

```bash
kubectl apply -f k8s/rbac/
```

### Secrets Management

Pour une meilleure sécurité, utilisez un gestionnaire de secrets externe :
- **HashiCorp Vault**
- **AWS Secrets Manager**
- **Azure Key Vault**
- **Google Secret Manager**

## 🐛 Troubleshooting

### Pods en CrashLoopBackOff

```bash
# Vérifier les logs
kubectl logs <pod-name> -n diaspomoney-prod

# Vérifier les événements
kubectl describe pod <pod-name> -n diaspomoney-prod

# Vérifier les ressources
kubectl top pod <pod-name> -n diaspomoney-prod
```

### Problèmes de connexion

```bash
# Tester la connexion MongoDB
kubectl exec -it deployment/diaspomoney-app -n diaspomoney-prod -- sh
# Puis dans le shell:
# mongosh mongodb://mongodb:27017/diaspomoney

# Tester la connexion Redis
kubectl exec -it deployment/diaspomoney-app -n diaspomoney-prod -- sh
# Puis dans le shell:
# redis-cli -h redis -p 6379 -a $REDIS_PASSWORD ping
```

### Problèmes d'Ingress

```bash
# Vérifier l'Ingress
kubectl describe ingress diaspomoney-ingress -n diaspomoney-prod

# Vérifier les certificats TLS
kubectl get certificate -n diaspomoney-prod
```

### Problèmes de ressources

```bash
# Vérifier les limites
kubectl describe pod <pod-name> -n diaspomoney-prod | grep -A 5 "Limits"

# Vérifier les quotas
kubectl describe quota -n diaspomoney-prod
```

## 📚 Ressources supplémentaires

- [Documentation Kubernetes](https://kubernetes.io/docs/)
- [Kustomize](https://kustomize.io/)
- [Cert-Manager](https://cert-manager.io/)
- [Nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Traefik Ingress Controller](https://doc.traefik.io/traefik/providers/kubernetes-ingress/)

