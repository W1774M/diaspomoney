#!/bin/bash
# Script pour diagnostiquer et corriger les problèmes de routage K8s
# Usage: ./scripts/fix-k8s-routing.sh

set -e

echo "🔍 Diagnostic des services Kubernetes..."
echo ""

echo "1. État des pods :"
kubectl get pods -n diaspomoney

echo ""
echo "2. État des services :"
kubectl get svc -n diaspomoney

echo ""
echo "3. État des ingress :"
kubectl get ingress -n diaspomoney

echo ""
echo "4. Vérification de la redirection iptables :"
if sudo iptables -t nat -L PREROUTING -n | grep -q "dpt:80.*30201"; then
    echo "   ✅ Redirection 80->30201 active"
else
    echo "   ❌ Redirection 80->30201 manquante"
    echo "   Exécution de setup-port-redirect.sh..."
    ./scripts/setup-port-redirect.sh
fi

if sudo iptables -t nat -L PREROUTING -n | grep -q "dpt:443.*31337"; then
    echo "   ✅ Redirection 443->31337 active"
else
    echo "   ❌ Redirection 443->31337 manquante"
    echo "   Exécution de setup-port-redirect.sh..."
    ./scripts/setup-port-redirect.sh
fi

echo ""
echo "5. Vérification des secrets TLS :"
if kubectl get secret diaspomoney-tls -n diaspomoney > /dev/null 2>&1; then
    echo "   ✅ Secret TLS existe"
else
    echo "   ❌ Secret TLS manquant"
    echo "   Création du secret TLS..."
    ./scripts/create-tls-secret.sh
fi

echo ""
echo "6. Test de connectivité :"
echo "   Test app.diaspomoney.fr (HTTP) :"
curl -s -o /dev/null -w "   HTTP %{http_code}\n" -H "Host: app.diaspomoney.fr" http://localhost:30201/ || echo "   ❌ Erreur"

echo ""
echo "✅ Diagnostic terminé"
echo ""
echo "📋 Prochaines étapes si problèmes :"
echo "   1. Reconstruire les images avec les modifications du middleware"
echo "   2. Vérifier que les DNS pointent vers la bonne IP"
echo "   3. Vérifier le firewall externe (ports 80/443)"

