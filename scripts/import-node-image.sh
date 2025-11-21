#!/bin/bash
# Script pour importer node:20-alpine depuis un autre serveur
# Usage: ./scripts/import-node-image.sh [chemin-vers-node.tar.gz]

set -e

NODE_IMAGE_FILE=${1:-/tmp/node-20-alpine.tar.gz}

echo "📥 Import de l'image node:20-alpine..."
echo ""

if [ ! -f "$NODE_IMAGE_FILE" ]; then
    echo "❌ Fichier non trouvé : $NODE_IMAGE_FILE"
    echo ""
    echo "📋 Instructions pour obtenir le fichier :"
    echo ""
    echo "Sur un serveur avec accès internet, exécutez :"
    echo "  docker pull node:20-alpine"
    echo "  docker save node:20-alpine | gzip > /tmp/node-20-alpine.tar.gz"
    echo ""
    echo "Puis transférez le fichier vers ce serveur :"
    echo "  scp /tmp/node-20-alpine.tar.gz root@$(hostname -I | awk '{print $1}'):/tmp/"
    echo ""
    echo "Ou utilisez rsync :"
    echo "  rsync -avz /tmp/node-20-alpine.tar.gz root@$(hostname -I | awk '{print $1}'):/tmp/"
    echo ""
    echo "Ensuite, réexécutez ce script :"
    echo "  ./scripts/import-node-image.sh /tmp/node-20-alpine.tar.gz"
    exit 1
fi

echo "📦 Fichier trouvé : $NODE_IMAGE_FILE"
echo "📥 Import de l'image..."
gunzip -c "$NODE_IMAGE_FILE" | docker load

echo ""
echo "✅ Image node:20-alpine importée avec succès !"
echo ""
echo "Vous pouvez maintenant reconstruire :"
echo "  docker build -t localhost:5000/diaspomoney:dev -f Dockerfile ."
echo "  docker push localhost:5000/diaspomoney:dev"
echo "  kubectl rollout restart deployment diaspomoney-dev -n diaspomoney"
