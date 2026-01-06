# 🚀 Installation Rapide Jenkins

## Installation en 5 minutes avec Docker

```bash
# 1. Lancer Jenkins
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(which docker):/usr/bin/docker \
  jenkins/jenkins:lts

# 2. Récupérer le mot de passe initial
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# 3. Accéder à Jenkins
# Ouvrez http://localhost:8080
# Collez le mot de passe
# Installez les plugins recommandés
```

## Configuration du Projet

1. **Nouveau projet** → **Pipeline** → Nom : `diaspomoney`

2. **Pipeline configuration** :
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository: `https://github.com/W1774M/diaspomoney.git`
   - Branch: `*/main`, `*/rct`, `*/dev`
   - Script Path: `Jenkinsfile`

3. **Sauvegarder** → **Build Now**

## Configuration Kubernetes (Optionnel)

Si vous voulez utiliser des kubeconfig spécifiques :

1. **Manage Jenkins** → **Configure System** → **Global properties**
2. Ajoutez :
   - `KUBECONFIG_DEV` = `/path/to/config-dev`
   - `KUBECONFIG_RCT` = `/path/to/config-rct`
   - `KUBECONFIG_PROD` = `/path/to/config-prod`

Sinon, Jenkins utilisera `~/.kube/config-{env}` par défaut.

## C'est tout ! 🎉

Jenkins est beaucoup plus simple que CircleCI :
- ✅ Pas de problèmes SSH/HTTPS
- ✅ Contrôle total
- ✅ Fonctionne immédiatement
- ✅ Gratuit et open source

