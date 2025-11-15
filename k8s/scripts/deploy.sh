#!/bin/bash

# Script de déploiement Kubernetes pour DiaspoMoney
# Usage: ./k8s/scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-prod}
NAMESPACE="diaspomoney-${ENVIRONMENT}"

echo "🚀 Déploiement DiaspoMoney sur l'environnement: ${ENVIRONMENT}"
echo "📦 Namespace: ${NAMESPACE}"

# Vérifier que kubectl est configuré
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Erreur: kubectl n'est pas configuré ou le cluster n'est pas accessible"
    exit 1
fi

# Créer le namespace si nécessaire
echo "📝 Création du namespace..."
kubectl apply -f k8s/environments/${ENVIRONMENT}-namespace.yaml

# Attendre que le namespace soit créé
kubectl wait --for=condition=Active namespace/${NAMESPACE} --timeout=30s || true

# Appliquer les ConfigMaps
echo "📋 Application des ConfigMaps..."
kubectl apply -f k8s/configmaps/ -n ${NAMESPACE}

# Vérifier les secrets
echo "🔐 Vérification des secrets..."
if ! kubectl get secret diaspomoney-secrets -n ${NAMESPACE} &> /dev/null; then
    echo "⚠️  Attention: Les secrets n'ont pas été créés!"
    echo "   Créez-les avec: kubectl apply -f k8s/secrets/ -n ${NAMESPACE}"
    echo "   (Après avoir modifié les valeurs dans les fichiers)"
    read -p "Continuer quand même? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Déployer MongoDB
echo "🍃 Déploiement de MongoDB..."
kubectl apply -f k8s/mongodb/ -n ${NAMESPACE}
kubectl wait --for=condition=ready pod -l component=mongodb -n ${NAMESPACE} --timeout=300s || true

# Déployer Redis
echo "📦 Déploiement de Redis..."
kubectl apply -f k8s/redis/ -n ${NAMESPACE}
kubectl wait --for=condition=ready pod -l component=redis -n ${NAMESPACE} --timeout=300s || true

# Déployer l'application
echo "🚀 Déploiement de l'application..."
kubectl apply -f k8s/app/ -n ${NAMESPACE}

# Déployer Mongo Express (optionnel)
if [ "${ENVIRONMENT}" != "prod" ]; then
    echo "🔧 Déploiement de Mongo Express..."
    kubectl apply -f k8s/mongo-express/ -n ${NAMESPACE}
fi

# Déployer l'Ingress
echo "🌐 Déploiement de l'Ingress..."
kubectl apply -f k8s/ingress/ -n ${NAMESPACE}

# Attendre que les pods soient prêts
echo "⏳ Attente que les pods soient prêts..."
kubectl wait --for=condition=ready pod -l component=app -n ${NAMESPACE} --timeout=300s || true

# Afficher le statut
echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "📊 Statut des pods:"
kubectl get pods -n ${NAMESPACE}
echo ""
echo "🌐 Services:"
kubectl get svc -n ${NAMESPACE}
echo ""
echo "🔗 Ingress:"
kubectl get ingress -n ${NAMESPACE}
echo ""
echo "📈 HPA:"
kubectl get hpa -n ${NAMESPACE}

