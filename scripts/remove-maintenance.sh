#!/bin/bash

# Script pour supprimer l'application de maintenance et activer l'application de production
# sur diaspomoney.fr

set -e

echo "🗑️  Suppression des ressources de maintenance..."

# Supprimer les IngressRoute de maintenance
echo "  - Suppression des IngressRoute..."
kubectl delete ingressroute maintenance-page-ingressroute-https -n diaspomoney --ignore-not-found=true
kubectl delete ingressroute maintenance-page-ingressroute-http -n diaspomoney --ignore-not-found=true
kubectl delete ingressroute maintenance-page-www-redirect-https -n diaspomoney --ignore-not-found=true
kubectl delete ingressroute maintenance-page-www-redirect-http -n diaspomoney --ignore-not-found=true
kubectl delete ingressroute maintenance-page-acme-challenge -n diaspomoney --ignore-not-found=true

# Supprimer le déploiement de maintenance
echo "  - Suppression du déploiement..."
kubectl delete deployment maintenance-page -n diaspomoney --ignore-not-found=true

# Supprimer le service de maintenance
echo "  - Suppression du service..."
kubectl delete service maintenance-page-service -n diaspomoney --ignore-not-found=true

echo ""
echo "✅ Ressources de maintenance supprimées avec succès !"
echo ""
echo "📋 Prochaines étapes :"
echo "  1. Appliquer la nouvelle configuration de production :"
echo "     kubectl apply -f diaspomoney/k8s/app/prod/"
echo ""
echo "  2. Vérifier que l'application de production est déployée :"
echo "     kubectl get pods -n diaspomoney -l app=diaspomoney-app"
echo ""
echo "  3. Vérifier les IngressRoute :"
echo "     kubectl get ingressroute -n diaspomoney | grep diaspomoney"
echo ""

