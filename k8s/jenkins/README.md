# 🚀 Déploiement Jenkins sur Kubernetes

Ce guide vous explique comment déployer Jenkins directement dans votre cluster Kubernetes.

## 📋 Prérequis

- Cluster Kubernetes fonctionnel
- `kubectl` configuré et connecté au cluster
- Accès aux fichiers kubeconfig (dev, rct, prod)
- Ingress Controller configuré (nginx, traefik, etc.)

## 🔧 Installation

### Étape 1 : Créer les secrets Kubernetes

Créez un secret avec vos fichiers kubeconfig :

```bash
kubectl create namespace jenkins

kubectl create secret generic jenkins-kubeconfigs \
  --from-file=config-dev=~/.kube/config-dev \
  --from-file=config-rct=~/.kube/config-rct \
  --from-file=config-prod=~/.kube/config-prod \
  -n jenkins
```

### Étape 2 : Déployer Jenkins

```bash
# Appliquer tous les manifests
kubectl apply -f k8s/jenkins/

# Vérifier le déploiement
kubectl get pods -n jenkins
kubectl get svc -n jenkins
kubectl get ingress -n jenkins
```

### Étape 3 : Récupérer le mot de passe initial

```bash
kubectl exec -it -n jenkins deployment/jenkins -- cat /var/jenkins_home/secrets/initialAdminPassword
```

### Étape 4 : Accéder à Jenkins

- **Via Ingress** : https://jenkins.diaspomoney.fr (si configuré)
- **Via Port-Forward** : 
  ```bash
  kubectl port-forward -n jenkins svc/jenkins 8080:8080
  ```
  Puis ouvrez http://localhost:8080

## 🔐 Configuration du Projet

1. **Premier démarrage** :
   - Collez le mot de passe initial
   - Installez les plugins recommandés
   - Créez un utilisateur administrateur

2. **Installer les plugins nécessaires** :
   - Git
   - Pipeline
   - Docker Pipeline
   - Kubernetes CLI
   - Blue Ocean (optionnel, interface moderne)

3. **Créer le projet** :
   - **New Item** → **Pipeline** → Nom : `diaspomoney`
   - **Pipeline definition** : `Pipeline script from SCM`
   - **SCM** : Git
   - **Repository URL** : `https://github.com/W1774M/diaspomoney.git`
   - **Branch Specifier** : `*/main`, `*/rct`, `*/dev`
   - **Script Path** : `Jenkinsfile`

## 🔧 Configuration des Variables d'Environnement

Dans Jenkins, configurez les chemins vers les kubeconfig :

1. **Manage Jenkins** → **Configure System** → **Global properties**
2. Ajoutez les variables :
   - `KUBECONFIG_DEV` = `/root/.kube/config-dev`
   - `KUBECONFIG_RCT` = `/root/.kube/config-rct`
   - `KUBECONFIG_PROD` = `/root/.kube/config-prod`

Ces chemins correspondent aux volumes montés dans le deployment.

## 🚀 Utilisation

### Déclenchement automatique

Configurez un webhook GitHub vers Jenkins :

1. Dans Jenkins : **Manage Jenkins** → **Configure System** → **GitHub**
2. Ajoutez votre GitHub credentials
3. Dans GitHub : **Settings** → **Webhooks** → **Add webhook**
4. URL : `https://jenkins.diaspomoney.fr/github-webhook/`
5. Content type : `application/json`

### Déclenchement manuel

- Allez sur votre projet Jenkins
- Cliquez sur **Build Now**

## 📊 Avantages

- ✅ **Intégré dans votre cluster** : Pas besoin de serveur séparé
- ✅ **Accès direct à Kubernetes** : kubectl disponible directement
- ✅ **Persistance** : Données sauvegardées dans un PVC
- ✅ **Scalable** : Peut être mis à l'échelle si nécessaire
- ✅ **Sécurisé** : RBAC configuré, secrets gérés par Kubernetes

## 🔧 Personnalisation

### Modifier le domaine

Éditez `k8s/jenkins/ingress.yaml` :
```yaml
- host: jenkins.votre-domaine.fr
```

### Modifier les ressources

Éditez `k8s/jenkins/deployment.yaml` :
```yaml
resources:
  requests:
    memory: "4Gi"  # Augmentez si nécessaire
    cpu: "2000m"
```

### Ajouter des plugins au démarrage

Créez un `ConfigMap` avec `plugins.txt` et montez-le dans le deployment.

## 🆘 Dépannage

### Jenkins ne démarre pas

```bash
kubectl logs -n jenkins deployment/jenkins
kubectl describe pod -n jenkins -l app=jenkins
```

### Problème de permissions

Vérifiez le ServiceAccount et les ClusterRoleBindings :
```bash
kubectl get serviceaccount -n jenkins
kubectl get clusterrolebinding jenkins-cluster-role-binding
```

### Problème de PVC

Vérifiez le StorageClass :
```bash
kubectl get storageclass
kubectl get pvc -n jenkins
```

## 📚 Commandes Utiles

```bash
# Voir les logs
kubectl logs -n jenkins deployment/jenkins -f

# Redémarrer Jenkins
kubectl rollout restart deployment/jenkins -n jenkins

# Accéder au shell
kubectl exec -it -n jenkins deployment/jenkins -- /bin/bash

# Vérifier les secrets
kubectl get secret jenkins-kubeconfigs -n jenkins -o yaml
```

