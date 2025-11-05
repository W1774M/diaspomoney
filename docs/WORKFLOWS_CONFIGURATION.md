# 🔄 Configuration des Workflows GitHub Actions

## 📋 **Vue d'ensemble**

DiaspoMoney utilise maintenant **2 workflows GitHub Actions** optimisés pour le déploiement multi-environnement :

1. **`test.yml`** - Tests et validation (PR + Push)
2. **`deploy-environments.yml`** - Déploiement multi-environnement (Push + Manuel)

## 🧪 **Workflow de Tests (`test.yml`)**

### **Déclenchement**
- ✅ **Pull Requests** sur `main`, `develop`, `rct`
- ✅ **Push** sur `main`, `develop`, `rct`

### **Jobs**
1. **Tests** - Tests unitaires, intégration, sécurité, performance
2. **Security Scan** - Trivy + CodeQL
3. **Build Test** - Test de build Docker

### **Services**
- **MongoDB 7.0** - Base de données de test
- **Redis 7.2** - Cache de test

## 🚀 **Workflow de Déploiement (`deploy-environments.yml`)**

### **Déclenchement**
- ✅ **Push** sur `main`, `develop`, `rct`
- ✅ **Workflow Dispatch** - Déploiement manuel
- ✅ **Pull Requests** sur `main` (tests uniquement)

### **Jobs**

#### **1. Tests**
- ✅ **Linting** - ESLint
- ✅ **Type Checking** - TypeScript
- ✅ **Unit Tests** - Tests unitaires
- ✅ **Integration Tests** - Tests d'intégration
- ✅ **Security Audit** - Audit de sécurité

#### **2. Security Scan**
- ✅ **Trivy** - Scan de vulnérabilités
- ✅ **CodeQL** - Analyse de code
- ✅ **SARIF Upload** - Résultats de sécurité

#### **3. Build**
- ✅ **Docker Buildx** - Construction multi-arch
- ✅ **Registry Push** - Push vers GHCR
- ✅ **Cache** - Cache GitHub Actions

#### **4. Déploiement DEV**
- ✅ **Déclenchement** : Push sur `develop`
- ✅ **URL** : `dev.diaspomoney.fr`
- ✅ **Namespace** : `diaspomoney-dev`
- ✅ **Tests** : Smoke tests automatiques

#### **5. Déploiement RCT**
- ✅ **Déclenchement** : Push sur `rct`
- ✅ **URL** : `rct.diaspomoney.fr`
- ✅ **Namespace** : `diaspomoney-rct`
- ✅ **Tests** : Tests d'intégration + smoke tests

#### **6. Déploiement PROD**
- ✅ **Déclenchement** : Push sur `main` + autorisation
- ✅ **URL** : `app.diaspomoney.fr`
- ✅ **Namespace** : `diaspomoney-prod`
- ✅ **Tests** : Suite complète + smoke tests
- ✅ **Notification** : Slack + Email

#### **7. Rollback**
- ✅ **Déclenchement** : Échec de déploiement
- ✅ **Action** : Rollback automatique
- ✅ **Notification** : Slack + Email

## 🔧 **Configuration des Environnements**

### **Secrets Requis**
```yaml
# Kubernetes Configs
KUBE_CONFIG_DEV      # Configuration Kubernetes DEV
KUBE_CONFIG_RCT      # Configuration Kubernetes RCT
KUBE_CONFIG_PROD     # Configuration Kubernetes PROD

# Notifications
SLACK_WEBHOOK        # Webhook Slack pour notifications

# Registry
GITHUB_TOKEN         # Token GitHub (automatique)
```

### **Variables d'Environnement**
```yaml
# Build
REGISTRY: ghcr.io
IMAGE_NAME: ${{ github.repository }}

# Test
NODE_ENV: test
MONGODB_URI: mongodb://localhost:27017/diaspomoney_test
REDIS_URL: redis://localhost:6379
```

## 🌐 **URLs et Accès**

### **Environnements**
- **DEV** : https://dev.diaspomoney.fr
- **RCT** : https://rct.diaspomoney.fr
- **PROD** : https://app.diaspomoney.fr

### **APIs de Santé**
- **DEV** : https://dev.diaspomoney.fr/api/health
- **RCT** : https://rct.diaspomoney.fr/api/health
- **PROD** : https://app.diaspomoney.fr/api/health

## 📊 **Métriques de Qualité**

### **Tests**
- ✅ **Coverage** > 80%
- ✅ **Unit Tests** > 95% de réussite
- ✅ **Integration Tests** > 90% de réussite
- ✅ **Security Tests** > 95% de réussite

### **Performance**
- ✅ **Build Time** < 5 minutes
- ✅ **Deploy Time** < 10 minutes
- ✅ **Smoke Tests** < 2 minutes

### **Sécurité**
- ✅ **Vulnerability Scan** - Aucune vulnérabilité critique
- ✅ **CodeQL** - Aucun problème de sécurité
- ✅ **Audit** - Aucune dépendance vulnérable

## 🔄 **Flux de Déploiement**

### **Développement**
```
Push sur 'develop' → Tests → Build → Deploy DEV → dev.diaspomoney.fr
```

### **Recette**
```
Push sur 'rct' → Tests → Build → Deploy RCT → rct.diaspomoney.fr
```

### **Production**
```
Push sur 'main' → Tests → Build → Deploy PROD → app.diaspomoney.fr
```

### **Rollback**
```
Échec de déploiement → Rollback automatique → Notification
```

## 🛠️ **Commandes Utiles**

### **Déploiement Manuel**
```bash
# Déployer un environnement spécifique
gh workflow run deploy-environments.yml -f environment=dev
gh workflow run deploy-environments.yml -f environment=rct
gh workflow run deploy-environments.yml -f environment=prod
```

### **Tests Locaux**
```bash
# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration

# Tests de sécurité
npm run test:security

# Tests de performance
npm run test:performance

# Build test
npm run build
```

### **Déploiement Local**
```bash
# Déployer un environnement
./scripts/deploy-multi-env.sh deploy dev
./scripts/deploy-multi-env.sh deploy rct
./scripts/deploy-multi-env.sh deploy prod

# Vérifier le statut
./scripts/deploy-multi-env.sh status dev
./scripts/deploy-multi-env.sh status rct
./scripts/deploy-multi-env.sh status prod

# Nettoyer un environnement
./scripts/deploy-multi-env.sh cleanup dev
./scripts/deploy-multi-env.sh cleanup rct
./scripts/deploy-multi-env.sh cleanup prod
```

## 📈 **Monitoring et Alertes**

### **Métriques**
- **Build Success Rate** > 95%
- **Deploy Success Rate** > 98%
- **Test Success Rate** > 95%
- **Security Scan Pass Rate** > 99%

### **Alertes**
- **Build Failure** → Slack #deployments
- **Deploy Failure** → Slack #deployments + Email
- **Security Issues** → Slack #security
- **Rollback** → Slack #deployments + Email

## 🎯 **Prochaines Étapes**

1. ✅ **Configurer les secrets** dans GitHub
2. ✅ **Tester les workflows** sur une branche de test
3. ✅ **Configurer les DNS** pour les domaines
4. ✅ **Activer les certificats SSL** avec Let's Encrypt
5. ✅ **Configurer les notifications** Slack

---

**Version:** 2.0  
**Dernière mise à jour:** $(date)  
**Auteur:** Équipe DiaspoMoney
