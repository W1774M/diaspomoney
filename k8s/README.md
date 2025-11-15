# Configuration Kubernetes pour DiaspoMoney

Cette configuration Kubernetes permet de déployer l'application DiaspoMoney dans un cluster Kubernetes avec orchestration complète.

## Structure

```
k8s/
├── app/                    # Configuration de l'application Next.js
│   ├── deployment.yaml    # Deployment avec 2+ replicas
│   ├── service.yaml        # Service ClusterIP
│   └── hpa.yaml           # Horizontal Pod Autoscaler
├── mongodb/                # Configuration MongoDB
│   ├── deployment.yaml    # StatefulSet pour persistance
│   └── service.yaml        # Service headless
├── redis/                  # Configuration Redis
│   ├── deployment.yaml    # StatefulSet pour persistance
│   └── service.yaml        # Service headless
├── mongo-express/          # Interface d'administration MongoDB
│   └── deployment.yaml    # Deployment + Service
├── configmaps/             # ConfigMaps pour configurations non-sensibles
│   ├── app-config.yaml
│   ├── mongodb-config.yaml
│   └── mongodb-init-script.yaml
├── secrets/                # Secrets pour données sensibles (templates)
│   ├── template.yaml
│   └── mongo-express-secrets.yaml
├── ingress/                # Configuration Ingress
│   └── ingress.yaml
└── environments/           # Namespaces par environnement
    ├── dev-namespace.yaml
    ├── prod-namespace.yaml
    └── rct-namespace.yaml
```

## Prérequis

1. **Cluster Kubernetes** (v1.24+)
2. **kubectl** configuré pour accéder au cluster
3. **Ingress Controller** installé (Nginx ou Traefik)
4. **Cert-Manager** (optionnel, pour Let's Encrypt)
5. **StorageClass** configuré pour les PersistentVolumes

## Installation

### 1. Créer les namespaces

```bash
kubectl apply -f k8s/environments/prod-namespace.yaml
```

### 2. Créer les ConfigMaps

```bash
kubectl apply -f k8s/configmaps/
```

### 3. Créer les Secrets

**⚠️ IMPORTANT :** Modifiez les secrets avant de les appliquer !

```bash
# Éditer les secrets avec vos vraies valeurs
vim k8s/secrets/template.yaml
vim k8s/secrets/mongo-express-secrets.yaml

# Appliquer les secrets
kubectl apply -f k8s/secrets/
```

### 4. Déployer MongoDB

```bash
kubectl apply -f k8s/mongodb/
```

### 5. Déployer Redis

```bash
kubectl apply -f k8s/redis/
```

### 6. Construire et pousser l'image Docker

```bash
# Construire l'image
docker build -t diaspomoney-app:latest .

# Tag pour votre registry
docker tag diaspomoney-app:latest your-registry/diaspomoney-app:latest

# Pousser l'image
docker push your-registry/diaspomoney-app:latest

# Mettre à jour le deployment avec votre registry
# Éditer k8s/app/deployment.yaml et changer l'image
```

### 7. Déployer l'application

```bash
kubectl apply -f k8s/app/
```

### 8. Déployer Mongo Express (optionnel)

```bash
kubectl apply -f k8s/mongo-express/
```

### 9. Configurer l'Ingress

```bash
kubectl apply -f k8s/ingress/
```

## Déploiement complet

Pour déployer tout d'un coup (après avoir configuré les secrets) :

```bash
# Appliquer dans l'ordre
kubectl apply -f k8s/environments/prod-namespace.yaml
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/mongodb/
kubectl apply -f k8s/redis/
kubectl apply -f k8s/app/
kubectl apply -f k8s/mongo-express/
kubectl apply -f k8s/ingress/
```

## Vérification

### Vérifier les pods

```bash
kubectl get pods -n diaspomoney-prod
```

### Vérifier les services

```bash
kubectl get svc -n diaspomoney-prod
```

### Vérifier les ingress

```bash
kubectl get ingress -n diaspomoney-prod
```

### Vérifier les logs

```bash
# Logs de l'application
kubectl logs -f deployment/diaspomoney-app -n diaspomoney-prod

# Logs MongoDB
kubectl logs -f statefulset/mongodb -n diaspomoney-prod

# Logs Redis
kubectl logs -f statefulset/redis -n diaspomoney-prod
```

## Scaling

### Scaling manuel

```bash
kubectl scale deployment diaspomoney-app --replicas=5 -n diaspomoney-prod
```

### Scaling automatique (HPA)

Le HPA est déjà configuré dans `k8s/app/hpa.yaml`. Il scale automatiquement entre 2 et 10 replicas basé sur :
- CPU : 70% d'utilisation
- Memory : 80% d'utilisation

Vérifier le HPA :

```bash
kubectl get hpa -n diaspomoney-prod
```

## Mise à jour

### Mise à jour de l'application

```bash
# 1. Construire et pousser la nouvelle image
docker build -t diaspomoney-app:v1.1.0 .
docker tag diaspomoney-app:v1.1.0 your-registry/diaspomoney-app:v1.1.0
docker push your-registry/diaspomoney-app:v1.1.0

# 2. Mettre à jour le deployment
kubectl set image deployment/diaspomoney-app app=your-registry/diaspomoney-app:v1.1.0 -n diaspomoney-prod

# 3. Vérifier le rollout
kubectl rollout status deployment/diaspomoney-app -n diaspomoney-prod
```

### Rollback

```bash
kubectl rollout undo deployment/diaspomoney-app -n diaspomoney-prod
```

## Backup et Restore

### Backup MongoDB

```bash
# Créer un backup
kubectl exec -it mongodb-0 -n diaspomoney-prod -- mongodump --out=/tmp/backup

# Copier le backup localement
kubectl cp diaspomoney-prod/mongodb-0:/tmp/backup ./mongodb-backup
```

### Restore MongoDB

```bash
# Copier le backup dans le pod
kubectl cp ./mongodb-backup diaspomoney-prod/mongodb-0:/tmp/backup

# Restaurer
kubectl exec -it mongodb-0 -n diaspomoney-prod -- mongorestore /tmp/backup
```

## Monitoring

### Métriques

Les métriques sont disponibles via les endpoints Prometheus :
- Application : `http://diaspomoney-app:3000/metrics`
- MongoDB : via MongoDB Exporter (à configurer)
- Redis : via Redis Exporter (à configurer)

### Health Checks

- **Liveness Probe** : Vérifie que le pod est vivant
- **Readiness Probe** : Vérifie que le pod est prêt à recevoir du trafic

## Sécurité

### RBAC (à configurer)

Créer des ServiceAccounts avec des permissions minimales :

```bash
kubectl apply -f k8s/rbac/  # À créer
```

### Network Policies (à configurer)

Restreindre la communication entre pods :

```bash
kubectl apply -f k8s/network-policies/  # À créer
```

## Troubleshooting

### Pods en CrashLoopBackOff

```bash
# Vérifier les logs
kubectl logs -f pod/<pod-name> -n diaspomoney-prod

# Vérifier les événements
kubectl describe pod <pod-name> -n diaspomoney-prod
```

### Problèmes de connexion

```bash
# Tester la connexion MongoDB depuis l'app
kubectl exec -it deployment/diaspomoney-app -n diaspomoney-prod -- sh
# Puis tester la connexion MongoDB
```

### Problèmes de ressources

```bash
# Vérifier l'utilisation des ressources
kubectl top pods -n diaspomoney-prod
kubectl top nodes
```

## Notes importantes

1. **Secrets** : Ne jamais commiter les secrets avec de vraies valeurs
2. **Images** : Utiliser un registry privé en production
3. **Storage** : Vérifier que le StorageClass est configuré
4. **Backup** : Mettre en place des backups automatiques
5. **Monitoring** : Configurer Prometheus et Grafana
6. **Logs** : Configurer un système de centralisation des logs (Loki, ELK)

## Environnements

- **dev** : Environnement de développement
- **rct** : Environnement de recette
- **prod** : Environnement de production

Chaque environnement a son propre namespace et peut avoir des configurations différentes.

