# 🚀 Guide d'Installation CircleCI

Ce guide vous explique comment configurer CircleCI pour automatiser vos déploiements sur Kubernetes.

## 📋 Prérequis

- Un compte GitHub avec votre repository
- Un compte CircleCI (gratuit disponible)
- Accès à vos clusters Kubernetes (dev, rct, prod)
- Les fichiers de configuration kubectl pour chaque environnement

## 🔧 Étape 1 : Créer un compte CircleCI

1. Allez sur [circleci.com](https://circleci.com)
2. Cliquez sur **"Sign Up"**
3. Choisissez **"Sign up with GitHub"**
4. Autorisez CircleCI à accéder à votre compte GitHub

## 🔗 Étape 2 : Ajouter votre projet

1. Dans le dashboard CircleCI, cliquez sur **"Add Projects"**
2. Sélectionnez votre repository GitHub (`diaspomoney`)
3. Cliquez sur **"Set Up Project"**
4. Choisissez **"Use an existing config"** (le fichier `.circleci/config.yml` est déjà présent)
5. Cliquez sur **"Start Building"**

## 🔐 Étape 3 : Configurer SSH pour le Checkout (IMPORTANT)

**⚠️ Problème** : CircleCI essaie d'utiliser SSH pour cloner le repository, mais l'image `cimg/node:20.0` n'a pas le client SSH.

**Solution** : Ajoutez votre clé SSH dans CircleCI Project Settings :

1. **Récupérez votre clé SSH locale** :
```bash
cat ~/.ssh/id_rsa  # ou id_ed25519
```

2. **Vérifiez que la clé publique est sur GitHub** :
```bash
cat ~/.ssh/id_rsa.pub
```
   - Vérifiez que cette clé est dans GitHub → Settings → SSH and GPG keys

3. **Ajoutez la clé privée dans CircleCI** :
   - Allez sur [app.circleci.com](https://app.circleci.com)
   - Sélectionnez votre projet `diaspomoney`
   - Allez dans **Project Settings → SSH Keys**
   - Cliquez sur **"Add SSH Key"**
   - Collez votre clé privée (contenu de `~/.ssh/id_rsa`)
   - Sauvegardez

**Alternative** : Vérifiez que votre projet est correctement connecté à GitHub dans **Project Settings → GitHub** pour utiliser HTTPS automatiquement.

## 🔐 Étape 4 : Configurer les variables d'environnement

Dans CircleCI, allez dans **Project Settings → Environment Variables** et ajoutez :

### Variables requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `KUBE_CONFIG_DEV` | Configuration kubectl pour dev (base64) | `LS0tLS1CRUdJTi...` |
| `KUBE_CONFIG_RCT` | Configuration kubectl pour rct (base64) | `LS0tLS1CRUdJTi...` |
| `KUBE_CONFIG_PROD` | Configuration kubectl pour prod (base64) | `LS0tLS1CRUdJTi...` |

### Comment obtenir les configurations kubectl

```bash
# Pour chaque environnement, exportez la config en base64
cat ~/.kube/config-dev | base64 -w 0 > kubeconfig-dev.b64
cat ~/.kube/config-rct | base64 -w 0 > kubeconfig-rct.b64
cat ~/.kube/config-prod | base64 -w 0 > kubeconfig-prod.b64

# Ou si vous avez un seul fichier config avec des contexts
kubectl config view --flatten | base64 -w 0
```

Copiez le contenu de chaque fichier `.b64` dans les variables CircleCI correspondantes.

## 🎯 Étape 4 : Configurer l'approbation pour la production

1. Dans CircleCI, allez dans **Project Settings → Advanced Settings**
2. Activez **"Only build pull requests"** si vous voulez limiter les builds aux PRs
3. Pour la production, l'approbation manuelle est déjà configurée dans le workflow (`hold-production`)

### Activer l'approbation manuelle

Le workflow inclut déjà un job `hold-production` qui nécessite une approbation manuelle avant le déploiement en production. Cette approbation apparaîtra automatiquement dans l'interface CircleCI.

## 🧪 Étape 5 : Tester la configuration

### Test sur la branche dev

1. Créez une branche de test :
```bash
git checkout -b test-circleci
```

2. Faites un petit changement (ex: ajouter un commentaire)
3. Push la branche :
```bash
git push origin test-circleci
```

4. Créez une Pull Request vers `dev`
5. Vérifiez que CircleCI démarre automatiquement

### Test sur la branche dev (déploiement)

1. Mergez votre PR dans `dev`
2. CircleCI devrait :
   - Exécuter les tests
   - Vérifier la couverture (≥95%)
   - Builder l'application
   - Déployer sur dev

## 📊 Étape 6 : Vérifier les résultats

### Dashboard CircleCI

1. Allez sur [app.circleci.com](https://app.circleci.com)
2. Sélectionnez votre projet
3. Vous verrez tous les pipelines en cours et terminés

### Artifacts

Les artifacts suivants sont automatiquement sauvegardés :
- **test-results** : Résultats des tests
- **playwright-report** : Rapports E2E
- **coverage** : Rapports de couverture
- **build-artifacts** : Artifacts de build

### Notifications

CircleCI peut envoyer des notifications via :
- Email
- Slack (si configuré)
- Webhooks

## 🔄 Workflows disponibles

### 1. Workflow Dev (`deploy-dev-workflow`)
- **Déclencheur** : Push sur `dev`
- **Jobs** : Tests → Couverture → Build → Déploiement Dev
- **Approbation** : ❌ Automatique

### 2. Workflow RCT (`deploy-rct-workflow`)
- **Déclencheur** : Push sur `rct`
- **Jobs** : Tests → Couverture → Build → Déploiement RCT
- **Approbation** : ❌ Automatique

### 3. Workflow Production (`deploy-prod-workflow`)
- **Déclencheur** : Push sur `main`
- **Jobs** : Tests → Couverture → Build → **Approbation** → Déploiement Prod
- **Approbation** : ✅ **Manuelle requise**

### 4. Workflow PR (`pr-workflow`)
- **Déclencheur** : Pull Request (sauf main/rct/dev)
- **Jobs** : Tests → Couverture → Build
- **Déploiement** : ❌ Aucun

## 🚨 Gestion des erreurs

### Tests échoués
- Le workflow s'arrête
- Aucun déploiement
- Notification envoyée

### Couverture insuffisante (<95%)
- Le workflow s'arrête
- Aucun déploiement
- Notification envoyée

### Échec de déploiement
- Le workflow s'arrête
- Notification envoyée
- ⚠️ **Note** : Le rollback doit être géré manuellement ou via un script séparé

## 🔧 Personnalisation

### Modifier le seuil de couverture

Éditez `.circleci/config.yml` :

```yaml
THRESHOLD=95  # Modifier cette valeur
```

### Ajouter des notifications Slack

1. Dans CircleCI, allez dans **Project Settings → Notifications**
2. Ajoutez votre webhook Slack
3. Configurez les événements à notifier

### Modifier les resource classes

Par défaut, les jobs de déploiement utilisent `medium`. Pour changer :

```yaml
deploy-dev:
  machine:
    image: ubuntu-2004:current
  resource_class: large  # ou small, medium, large, xlarge
```

## 📚 Ressources

- [Documentation CircleCI](https://circleci.com/docs/)
- [CircleCI Orbs](https://circleci.com/orbs/)
- [CircleCI Pricing](https://circleci.com/pricing/)

## 🆘 Dépannage

### Le pipeline ne démarre pas

1. Vérifiez que le fichier `.circleci/config.yml` est présent
2. Vérifiez la syntaxe YAML
3. Vérifiez que CircleCI a accès au repository

### Erreur de connexion Kubernetes

1. Vérifiez que `KUBE_CONFIG_*` est correctement encodé en base64
2. Vérifiez que la config kubectl est valide
3. Vérifiez les permissions du cluster Kubernetes

### Tests MongoDB échouent

1. Vérifiez que Docker est disponible dans le job
2. Vérifiez que le port 27018 n'est pas déjà utilisé
3. Vérifiez les logs du conteneur MongoDB

## ✅ Checklist de configuration

- [ ] Compte CircleCI créé
- [ ] Projet ajouté à CircleCI
- [ ] Variables d'environnement configurées (`KUBE_CONFIG_*`)
- [ ] Test sur une branche de test réussi
- [ ] Déploiement dev testé et fonctionnel
- [ ] Approbation production configurée
- [ ] Notifications configurées (optionnel)

## 🎉 C'est prêt !

Une fois toutes les étapes complétées, votre pipeline CircleCI est opérationnel. Chaque push sur `dev`, `rct`, ou `main` déclenchera automatiquement le workflow correspondant.

