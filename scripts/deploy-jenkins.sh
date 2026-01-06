#!/bin/bash

set -e

# Script pour déployer Jenkins sur Kubernetes

echo "🚀 Déploiement de Jenkins sur Kubernetes"
echo "=========================================="

# Vérifier que kubectl est disponible
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl n'est pas installé"
    exit 1
fi

# Vérifier la connexion au cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Impossible de se connecter au cluster Kubernetes"
    exit 1
fi

echo ""
echo "📋 Étapes du déploiement :"
echo "1. Création du namespace"
echo "2. Création des secrets (kubeconfig)"
echo "3. Déploiement de Jenkins"
echo ""

# Demander les chemins vers les kubeconfig
read -p "Chemin vers kubeconfig-dev (ou appuyez sur Entrée pour ignorer): " KUBECONFIG_DEV
read -p "Chemin vers kubeconfig-rct (ou appuyez sur Entrée pour ignorer): " KUBECONFIG_RCT
read -p "Chemin vers kubeconfig-prod (ou appuyez sur Entrée pour ignorer): " KUBECONFIG_PROD

# Créer le namespace
echo ""
echo "📦 Création du namespace jenkins..."
kubectl apply -f k8s/jenkins/namespace.yaml

# Créer les secrets
echo ""
echo "🔐 Création des secrets..."

SECRET_ARGS=""
if [ -n "$KUBECONFIG_DEV" ] && [ -f "$KUBECONFIG_DEV" ]; then
    SECRET_ARGS="$SECRET_ARGS --from-file=config-dev=$KUBECONFIG_DEV"
    echo "  ✅ config-dev ajouté"
fi

if [ -n "$KUBECONFIG_RCT" ] && [ -f "$KUBECONFIG_RCT" ]; then
    SECRET_ARGS="$SECRET_ARGS --from-file=config-rct=$KUBECONFIG_RCT"
    echo "  ✅ config-rct ajouté"
fi

if [ -n "$KUBECONFIG_PROD" ] && [ -f "$KUBECONFIG_PROD" ]; then
    SECRET_ARGS="$SECRET_ARGS --from-file=config-prod=$KUBECONFIG_PROD"
    echo "  ✅ config-prod ajouté"
fi

if [ -n "$SECRET_ARGS" ]; then
    # Supprimer le secret s'il existe déjà
    kubectl delete secret jenkins-kubeconfigs -n jenkins --ignore-not-found=true
    
    # Créer le secret
    kubectl create secret generic jenkins-kubeconfigs $SECRET_ARGS -n jenkins
    echo "  ✅ Secrets créés"
else
    echo "  ⚠️  Aucun kubeconfig fourni. Créez le secret manuellement :"
    echo "     kubectl create secret generic jenkins-kubeconfigs \\"
    echo "       --from-file=config-dev=~/.kube/config-dev \\"
    echo "       --from-file=config-rct=~/.kube/config-rct \\"
    echo "       --from-file=config-prod=~/.kube/config-prod \\"
    echo "       -n jenkins"
fi

# Déployer Jenkins
echo ""
echo "🚀 Déploiement de Jenkins..."
kubectl apply -f k8s/jenkins/serviceaccount.yaml
kubectl apply -f k8s/jenkins/configmap.yaml
kubectl apply -f k8s/jenkins/pvc.yaml
kubectl apply -f k8s/jenkins/deployment.yaml
kubectl apply -f k8s/jenkins/service.yaml
kubectl apply -f k8s/jenkins/ingress.yaml

# Attendre que le pod soit prêt
echo ""
echo "⏳ Attente du démarrage de Jenkins..."
kubectl wait --for=condition=ready pod -l app=jenkins -n jenkins --timeout=300s || {
    echo "⚠️  Le pod prend plus de temps que prévu"
    echo "   Vérifiez avec: kubectl get pods -n jenkins"
}

# Récupérer le mot de passe initial
echo ""
echo "🔑 Mot de passe initial Jenkins :"
echo "=================================="
kubectl exec -n jenkins deployment/jenkins -- cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null || {
    echo "⚠️  Le pod n'est pas encore prêt. Récupérez le mot de passe avec :"
    echo "   kubectl exec -n jenkins deployment/jenkins -- cat /var/jenkins_home/secrets/initialAdminPassword"
}

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Accédez à Jenkins :"
echo "   - Via Ingress : https://jenkins.diaspomoney.fr"
echo "   - Via Port-Forward : kubectl port-forward -n jenkins svc/jenkins 8080:8080"
echo ""
echo "2. Configurez le projet :"
echo "   - New Item → Pipeline → diaspomoney"
echo "   - Pipeline script from SCM"
echo "   - Repository : https://github.com/W1774M/diaspomoney.git"
echo "   - Script Path : Jenkinsfile"
echo ""

