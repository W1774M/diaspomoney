#!/bin/bash
# Script pour rendre les règles iptables permanentes
# Usage: ./scripts/make-iptables-persistent.sh

set -e

echo "🔧 Configuration des règles iptables permanentes..."
echo ""

if ! command -v netfilter-persistent &> /dev/null; then
    echo "📦 Installation de iptables-persistent..."
    sudo apt-get update
    sudo apt-get install -y iptables-persistent
fi

echo "💾 Sauvegarde des règles iptables actuelles..."
sudo netfilter-persistent save

echo ""
echo "✅ Les règles iptables sont maintenant permanentes"
echo "   Elles seront restaurées au redémarrage"
echo ""
echo "📋 Règles sauvegardées :"
sudo iptables -t nat -L PREROUTING -n | grep -E "80|443"

