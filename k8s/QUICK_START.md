# Quick Start - Déploiement Kubernetes

Guide rapide pour déployer DiaspoMoney sur Kubernetes.

## 🚀 Déploiement en 5 minutes

### 1. Prérequis

```bash
# Vérifier l'accès au cluster
kubectl cluster-info

# Vérifier les nodes
kubectl get nodes
```

### 2. Générer les secrets

```bash
./k8s/scripts/generate-secrets.sh
```

⚠️ **Éditez** `k8s/secrets/secrets.yaml` avec vos vraies valeurs (OAuth, Stripe, SMTP, etc.)

### 3. Construire et pousser l'image

```bash
# Construire
docker build -t your-registry/diaspomoney-app:latest .

# Pousser
docker push your-registry/diaspomoney-app:latest

# Mettre à jour le deployment
sed -i 's|diaspomoney-app:latest|your-registry/diaspomoney-app:latest|g' k8s/app/deployment.yaml
```

### 4. Déployer

```bash
# Option A: Script automatisé
./k8s/scripts/deploy.sh prod

# Option B: Manuel
kubectl apply -f k8s/environments/prod-namespace.yaml
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/rbac/
kubectl apply -f k8s/mongodb/
kubectl apply -f k8s/redis/
kubectl apply -f k8s/app/
kubectl apply -f k8s/ingress/
```

### 5. Vérifier

```bash
# Vérifier les pods
kubectl get pods -n diaspomoney-prod

# Vérifier les services
kubectl get svc -n diaspomoney-prod

# Vérifier l'ingress
kubectl get ingress -n diaspomoney-prod

# Logs
kubectl logs -f deployment/diaspomoney-app -n diaspomoney-prod
```

## 📝 Commandes utiles

### Scaling

```bash
# Scaling manuel
kubectl scale deployment diaspomoney-app --replicas=5 -n diaspomoney-prod

# Vérifier le HPA
kubectl get hpa -n diaspomoney-prod
```

### Mise à jour

```bash
# Mettre à jour l'image
kubectl set image deployment/diaspomoney-app \
  app=your-registry/diaspomoney-app:v1.1.0 \
  -n diaspomoney-prod

# Suivre le rollout
kubectl rollout status deployment/diaspomoney-app -n diaspomoney-prod
```

### Backup

```bash
# Backup MongoDB
./k8s/scripts/backup-mongodb.sh diaspomoney-prod

# Restore MongoDB
./k8s/scripts/restore-mongodb.sh ./backups/mongodb-YYYYMMDD-HHMMSS.tar.gz diaspomoney-prod
```

## 🔧 Configuration

### Variables d'environnement

Modifiez `k8s/configmaps/app-config.yaml` pour changer les configurations non-sensibles.

### Secrets

Modifiez `k8s/secrets/secrets.yaml` pour les données sensibles (OAuth, Stripe, etc.).

## 📚 Documentation complète

Voir `k8s/README.md` et `k8s/DEPLOYMENT_GUIDE.md` pour plus de détails.

