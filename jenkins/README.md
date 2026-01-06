# 🚀 Guide d'Installation Jenkins

Jenkins est une alternative plus simple et flexible à CircleCI pour votre pipeline de déploiement.

## 📋 Avantages de Jenkins

- ✅ **Plus simple** : Pas de problèmes avec SSH/HTTPS
- ✅ **Plus flexible** : Contrôle total sur l'environnement
- ✅ **Auto-hébergé** : Vous contrôlez tout
- ✅ **Gratuit** : Open source
- ✅ **Kubernetes natif** : Excellent support pour k8s

## 🔧 Installation Jenkins

### Option 1 : Docker (Recommandé - Le plus simple)

```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts
```

Accédez à Jenkins : http://localhost:8080

### Option 2 : Installation système

```bash
# Ubuntu/Debian
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update
sudo apt-get install jenkins
```

## 🔗 Configuration Initiale

1. **Premier démarrage** :
   - Accédez à http://localhost:8080
   - Récupérez le mot de passe initial :
   ```bash
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```

2. **Installer les plugins recommandés** :
   - Git
   - Pipeline
   - Docker Pipeline
   - Kubernetes CLI

3. **Créer un utilisateur administrateur**

## 🔐 Configuration du Projet

1. **Créer un nouveau projet** :
   - Cliquez sur "New Item"
   - Nommez-le `diaspomoney`
   - Sélectionnez "Pipeline"
   - Cliquez sur "OK"

2. **Configurer le pipeline** :
   - Dans "Pipeline definition", sélectionnez "Pipeline script from SCM"
   - SCM : Git
   - Repository URL : `https://github.com/W1774M/diaspomoney.git` (ou SSH)
   - Credentials : Ajoutez vos identifiants GitHub si nécessaire
   - Branch Specifier : `*/main`, `*/rct`, `*/dev`
   - Script Path : `Jenkinsfile`

3. **Configurer les credentials Kubernetes** :
   - Allez dans "Manage Jenkins" → "Credentials"
   - Ajoutez vos fichiers kubeconfig pour dev, rct, prod
   - Ou configurez les variables d'environnement dans le pipeline

## 🔧 Configuration des Variables d'Environnement

Dans Jenkins, allez dans **Manage Jenkins → Configure System → Global properties** et ajoutez :

- `KUBECONFIG_DEV` : Chemin vers votre kubeconfig dev
- `KUBECONFIG_RCT` : Chemin vers votre kubeconfig rct  
- `KUBECONFIG_PROD` : Chemin vers votre kubeconfig prod

Ou configurez-les directement dans le `Jenkinsfile`.

## 🚀 Utilisation

### Déclenchement automatique

Le pipeline se déclenche automatiquement sur :
- Push vers `main`, `rct`, ou `dev`
- Pull requests (si configuré)

### Déclenchement manuel

1. Allez sur votre projet Jenkins
2. Cliquez sur "Build Now"

### Pour la production

Le pipeline demande une **approbation manuelle** avant de déployer en production.

## 📊 Avantages vs CircleCI

| Fonctionnalité | Jenkins | CircleCI |
|----------------|---------|----------|
| Complexité | ✅ Simple | ❌ Complexe (SSH, images, etc.) |
| Contrôle | ✅ Total | ⚠️ Limité |
| Coût | ✅ Gratuit | ⚠️ Limité en gratuit |
| Flexibilité | ✅ Totale | ⚠️ Limité par les images |
| Kubernetes | ✅ Excellent | ✅ Bon |
| Auto-hébergé | ✅ Oui | ❌ Non |

## 🔧 Personnalisation

Le `Jenkinsfile` est entièrement personnalisable. Vous pouvez :
- Ajouter des étapes
- Modifier les seuils
- Ajouter des notifications
- Intégrer avec d'autres outils

## 📚 Ressources

- [Documentation Jenkins](https://www.jenkins.io/doc/)
- [Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Jenkins Docker](https://hub.docker.com/r/jenkins/jenkins)

