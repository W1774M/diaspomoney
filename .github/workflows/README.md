# 🚀 Pipeline de Déploiement Multi-Environnements

Ce workflow GitHub Actions automatise le déploiement sur trois environnements : **dev**, **rct** (recette), et **prod** (production).

## 📋 Vue d'ensemble

Le workflow suit ce processus pour chaque environnement :

1. **🧪 Tests** - Exécution de tous les tests (lint, TypeScript, unitaires, intégration, E2E)
2. **📈 Couverture** - Vérification que la couverture de code est ≥ 95%
3. **🏗️ Build** - Compilation de l'application
4. **🚀 Déploiement** - Exécution du script `deploy.sh` sur l'environnement cible
5. **🔄 Rollback** - Rollback automatique en cas d'échec

## 🌿 Branches et Environnements

| Branche | Environnement | URL | Approbation |
|---------|--------------|-----|-------------|
| `dev` | Développement | https://dev.diaspomoney.fr | ❌ Automatique |
| `rct` | Recette | https://rct.diaspomoney.fr | ❌ Automatique |
| `main` | Production | https://diaspomoney.fr | ✅ **Manuelle** |

## 🔄 Déclenchement

Le workflow se déclenche automatiquement sur :
- **Push** vers `main`, `rct`, ou `dev`
- **Merge** d'une pull request vers ces branches
- **Workflow dispatch** manuel depuis l'interface GitHub Actions

## 📊 Processus de Déploiement

### Étape 1 : Tests ✅

Si les tests échouent :
- ❌ Le workflow s'arrête
- 📢 Une issue GitHub est créée automatiquement
- 🔔 Notification envoyée

**Tests exécutés :**
- Lint (ESLint)
- Vérification TypeScript
- Tests unitaires (client + serveur)
- Tests d'intégration (avec MongoDB)
- Tests E2E (Playwright)

### Étape 2 : Couverture de Code 📈

Si la couverture < 95% :
- ❌ Le workflow s'arrête
- 📢 Une issue GitHub est créée automatiquement
- 🔔 Notification envoyée

**Seuil minimum :** 95% de couverture de code

### Étape 3 : Build 🏗️

- Compilation de l'application Next.js
- Génération des artifacts de build
- Upload des artifacts pour inspection

### Étape 4 : Déploiement 🚀

**Pour DEV et RCT :**
- Déploiement automatique après validation des tests et couverture

**Pour PROD :**
- ⚠️ **Approbation manuelle requise**
- Un reviewer doit approuver le déploiement depuis l'interface GitHub
- Après approbation, le déploiement se lance automatiquement

### Étape 5 : Rollback 🔄

En cas d'échec du déploiement :
- 🔄 Rollback automatique vers la version précédente
- 📢 Issue GitHub créée pour notification
- 🔔 Alerte envoyée à l'équipe

## 🔐 Configuration Requise

### Secrets GitHub

Configurez les secrets suivants dans **Settings → Secrets and variables → Actions** :

| Secret | Description | Obligatoire |
|--------|-------------|-------------|
| `KUBE_CONFIG_DEV` | Configuration kubectl pour l'environnement dev (base64) | ✅ |
| `KUBE_CONFIG_RCT` | Configuration kubectl pour l'environnement rct (base64) | ✅ |
| `KUBE_CONFIG_PROD` | Configuration kubectl pour l'environnement prod (base64) | ✅ |

### Environnements GitHub

Configurez les environnements dans **Settings → Environments** :

1. **development** (pour `dev`)
   - Protection rules : Aucune (déploiement automatique)

2. **recette** (pour `rct`)
   - Protection rules : Aucune (déploiement automatique)

3. **production** (pour `main`)
   - Protection rules : **Required reviewers** (minimum 1)
   - ⚠️ **IMPORTANT** : Ajoutez au moins un reviewer pour activer l'approbation manuelle

### Comment obtenir KUBE_CONFIG

```bash
# Exporter la configuration kubectl en base64
cat ~/.kube/config | base64 -w 0
```

Copiez la sortie et ajoutez-la comme secret GitHub.

## 📝 Script de Déploiement

Le workflow utilise le script `./scripts/deploy.sh` qui :
1. Vérifie l'environnement
2. Construit l'image Docker
3. Push l'image vers le registry
4. Déploie sur Kubernetes
5. Vérifie le statut du déploiement

## 🎯 Fonctionnalités Avancées

### Notifications Automatiques

- ✅ Création d'issues GitHub en cas d'échec
- 📊 Upload des rapports de couverture vers Codecov
- 📦 Sauvegarde des artifacts (build, tests, couverture)

### Smoke Tests

Après chaque déploiement, des smoke tests vérifient que l'application répond correctement :
- Vérification de l'endpoint `/api/health`
- Timeout de 10-15 secondes pour laisser l'application démarrer

### Rollback Automatique

En cas d'échec :
- Rollback vers la version précédente
- Notification automatique
- Issue GitHub créée pour suivi

## 🚨 Gestion des Erreurs

### Tests échoués
- Workflow arrêté
- Issue créée avec label `ci-failure`
- Pas de déploiement

### Couverture insuffisante
- Workflow arrêté
- Issue créée avec label `coverage`
- Pas de déploiement

### Échec de déploiement
- Rollback automatique
- Issue créée avec label `deployment` et `urgent`
- Notification envoyée

## 📊 Monitoring

### Artifacts Disponibles

- `test-results` : Résultats des tests (30 jours)
- `coverage-report` : Rapports de couverture (30 jours)
- `build-artifacts` : Artifacts de build (7 jours)

### Codecov

Les rapports de couverture sont automatiquement uploadés vers Codecov (si configuré).

## 🔧 Personnalisation

### Modifier le seuil de couverture

Éditez la variable d'environnement dans le workflow :
```yaml
env:
  COVERAGE_THRESHOLD: 95  # Modifier cette valeur
```

### Ajouter des reviewers pour la production

1. Allez dans **Settings → Environments → production**
2. Ajoutez des **Required reviewers**
3. Le déploiement en production nécessitera leur approbation

### Désactiver le rollback automatique

Commentez ou supprimez le job `rollback` dans le workflow.

## 📚 Ressources

- [Documentation GitHub Actions](https://docs.github.com/en/actions)
- [Documentation Kubernetes](https://kubernetes.io/docs/)
- [Documentation Next.js](https://nextjs.org/docs)

## 🆘 Support

En cas de problème :
1. Vérifiez les logs du workflow dans l'onglet **Actions**
2. Consultez les issues GitHub créées automatiquement
3. Vérifiez la configuration des secrets et environnements
