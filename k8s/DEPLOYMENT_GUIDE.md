# 🚀 Guide de Déploiement Kubernetes (K3s) - DiaspoMoney

Ce guide vous accompagne pour déployer DiaspoMoney sur Kubernetes (K3s) de manière reproductible et automatisée.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration du Registry Docker](#configuration-du-registry-docker)
3. [Vérification du Registry](#vérification-du-registry)
4. [Déploiement](#déploiement)
5. [Vérifications post-déploiement](#vérifications-post-déploiement)
6. [Automatisation CI/CD](#automatisation-cicd)
7. [Dépannage](#dépannage)

---

## 🔧 Prérequis

- K3s installé et fonctionnel
- `kubectl` configuré et connecté au cluster
- Registry Docker accessible (localhost:5000 ou IP distante)
- Namespace `diaspomoney` créé
- MongoDB et Redis déployés dans le cluster

### Configuration initiale

#### 1. Configurer kubectl pour K3s

```bash
# Utiliser le script automatisé (recommandé)
./scripts/setup-kubectl.sh

# Ou manuellement
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
chmod 600 ~/.kube/config

# Tester
kubectl cluster-info
```

#### 2. Initialiser le cluster

```bash
# Script d'initialisation complet
./scripts/init-k8s.sh
```

#### 3. Créer le namespace

```bash
kubectl create namespace diaspomoney
```

---

## 🐳 Configuration du Registry Docker

### Si le registry est sur la même machine (localhost)

K3s devrait automatiquement utiliser `localhost:5000`. Si ce n'est pas le cas, créez `/etc/rancher/k3s/registries.yaml` :

```yaml
mirrors:
  localhost:5000:
    endpoint:
      - "http://localhost:5000"
```

### Si le registry est sur une autre machine

Remplacez `localhost` par l'IP ou le hostname accessible depuis les nœuds K3s :

```yaml
mirrors:
  192.168.1.10:5000:
    endpoint:
      - "http://192.168.1.10:5000"
```

Puis redémarrez K3s :

```bash
sudo systemctl restart k3s
```

---

## ✅ Vérification du Registry

### Test rapide avec kubectl

```bash
kubectl run registry-test \
  --image=localhost:5000/diaspomoney:dev \
  --restart=Never \
  --rm -it \
  -- /bin/sh -c "echo 'Registry OK'"
```

### Test avec un Pod

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: registry-test
  namespace: diaspomoney
spec:
  containers:
  - name: test
    image: localhost:5000/diaspomoney:dev
    command: ["sh","-c","sleep 3600"]
EOF
```

Vérifier le statut :

```bash
kubectl describe pod registry-test -n diaspomoney
kubectl logs registry-test -n diaspomoney
```

Si tout est OK, supprimez le pod de test :

```bash
kubectl delete pod registry-test -n diaspomoney
```

---

## 🚀 Déploiement

### 1. Build et Push de l'image

```bash
# Pour dev
pnpm k8s:dev
# ou
docker build -f Dockerfile -t localhost:5000/diaspomoney:dev .
docker push localhost:5000/diaspomoney:dev

# Pour recette
pnpm k8s:rct
# ou
docker build -f Dockerfile -t localhost:5000/diaspomoney:rct .
docker push localhost:5000/diaspomoney:rct

# Pour production
pnpm k8s:prod
# ou
docker build -f Dockerfile -t localhost:5000/diaspomoney:prod .
docker push localhost:5000/diaspomoney:prod
```

### 2. Déployer l'application

#### Environnement DEV

```bash
kubectl apply -f k8s/app/dev/deployment.yaml
kubectl apply -f k8s/app/dev/service.yaml
kubectl apply -f k8s/app/dev/ingress.yaml
```

#### Environnement RECETTE

```bash
kubectl apply -f k8s/app/rct/deployment.yaml
kubectl apply -f k8s/app/rct/service.yaml
kubectl apply -f k8s/app/rct/ingress.yaml
```

#### Environnement PRODUCTION

```bash
kubectl apply -f k8s/app/prod/deployment.yaml
kubectl apply -f k8s/app/prod/service.yaml
kubectl apply -f k8s/app/prod/ingress.yaml
```

### 3. Script de déploiement automatisé

Utilisez le script `scripts/deploy.sh` :

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh dev
./scripts/deploy.sh rct
./scripts/deploy.sh prod
```

---

## 🔍 Vérifications post-déploiement

### Vérifier les pods

```bash
# Voir tous les pods
kubectl get pods -n diaspomoney

# Voir les pods d'un environnement spécifique
kubectl get pods -n diaspomoney -l app=diaspomoney-dev
kubectl get pods -n diaspomoney -l app=diaspomoney-rct
kubectl get pods -n diaspomoney -l app=diaspomoney-app

# Vérifier le statut du déploiement
kubectl rollout status deploy/diaspomoney-dev -n diaspomoney
```

### Vérifier les services

```bash
kubectl get svc -n diaspomoney
```

### Vérifier les ingress

```bash
kubectl get ingress -n diaspomoney
```

### Consulter les logs

```bash
# Logs d'un pod spécifique
kubectl logs -l app=diaspomoney-dev -n diaspomoney --tail=200

# Logs en temps réel
kubectl logs -f -l app=diaspomoney-dev -n diaspomoney

# Logs d'un container spécifique
kubectl logs <pod-name> -n diaspomoney -c diaspomoney-dev
```

### Exécuter une commande dans un pod

```bash
kubectl exec -it <pod-name> -n diaspomoney -- /bin/sh
```

### Vérifier les événements

```bash
kubectl get events -n diaspomoney --sort-by='.lastTimestamp'
```

### Dépannage ImagePullBackOff

Si vous voyez `ImagePullBackOff` :

```bash
# Décrire le pod pour voir l'erreur
kubectl describe pod <pod-name> -n diaspomoney

# Vérifier les événements
kubectl get events -n diaspomoney

# Vérifier la configuration du registry
cat /etc/rancher/k3s/registries.yaml
```

---

## 🔄 Automatisation CI/CD

### GitHub Actions

Voir `.github/workflows/deploy-k8s.yml` pour un exemple complet.

### Déploiement manuel avec tags

Pour utiliser des tags immuables (recommandé) :

```bash
# Build avec tag git SHA
GIT_SHA=$(git rev-parse --short HEAD)
docker build -t localhost:5000/diaspomoney:${GIT_SHA} .
docker push localhost:5000/diaspomoney:${GIT_SHA}

# Mettre à jour le deployment
kubectl set image deployment/diaspomoney-dev \
  diaspomoney-dev=localhost:5000/diaspomoney:${GIT_SHA} \
  -n diaspomoney

# Rollout restart
kubectl rollout restart deployment/diaspomoney-dev -n diaspomoney
```

---

## 🛠️ Dépannage

### Pod en état ImagePullBackOff

1. Vérifier que l'image existe dans le registry :
   ```bash
   curl http://localhost:5000/v2/diaspomoney/tags/list
   ```

2. Vérifier la configuration du registry K3s :
   ```bash
   cat /etc/rancher/k3s/registries.yaml
   ```

3. Redémarrer K3s :
   ```bash
   sudo systemctl restart k3s
   ```

### Pod en état CrashLoopBackOff

1. Consulter les logs :
   ```bash
   kubectl logs <pod-name> -n diaspomoney --previous
   ```

2. Vérifier les variables d'environnement :
   ```bash
   kubectl describe pod <pod-name> -n diaspomoney
   ```

3. Vérifier les health checks :
   ```bash
   kubectl exec <pod-name> -n diaspomoney -- curl http://localhost:3000/
   ```

### Service non accessible

1. Vérifier que le service pointe vers les bons pods :
   ```bash
   kubectl get endpoints -n diaspomoney
   ```

2. Tester depuis un pod :
   ```bash
   kubectl run test-pod --image=curlimages/curl -it --rm -- \
     curl http://diaspomoney-dev-service.diaspomoney:80
   ```

### Ingress non fonctionnel

1. Vérifier que Traefik est installé :
   ```bash
   kubectl get pods -n kube-system | grep traefik
   ```

2. Vérifier les annotations de l'ingress :
   ```bash
   kubectl describe ingress diaspomoney-dev-ingress -n diaspomoney
   ```

---

## 📝 Bonnes pratiques

1. **Tags immuables** : Utilisez des tags basés sur le SHA git plutôt que `:dev`, `:rct`, `:prod`
2. **Secrets** : Utilisez Kubernetes Secrets pour les variables sensibles
3. **Health checks** : Configurez des probes significatives
4. **Ressources** : Définissez des requests et limits appropriés
5. **Multi-réplicas** : Utilisez au moins 2 réplicas en production
6. **Monitoring** : Configurez Prometheus et Grafana pour le monitoring
7. **Backup** : Mettez en place des backups réguliers de MongoDB

---

## 🔗 Ressources supplémentaires

- [Documentation K3s](https://k3s.io/)
- [Documentation Kubernetes](https://kubernetes.io/docs/)
- [Documentation Traefik](https://doc.traefik.io/traefik/)

---

**Dernière mise à jour** : $(date)

