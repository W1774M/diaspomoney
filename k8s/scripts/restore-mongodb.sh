#!/bin/bash

# Script de restore MongoDB dans Kubernetes
# Usage: ./k8s/scripts/restore-mongodb.sh <backup-file.tar.gz> [namespace]

set -e

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <backup-file.tar.gz> [namespace]"
    exit 1
fi

BACKUP_FILE=$1
NAMESPACE=${2:-diaspomoney-prod}
POD_NAME=$(kubectl get pods -n ${NAMESPACE} -l component=mongodb -o jsonpath='{.items[0].metadata.name}')
BACKUP_DIR="/tmp/restore-$(date +%Y%m%d-%H%M%S)"
TEMP_DIR=$(mktemp -d)

echo "📦 Restore MongoDB vers le pod: ${POD_NAME}"
echo "📁 Fichier de backup: ${BACKUP_FILE}"

# Extraire le backup
echo "📤 Extraction du backup..."
tar -xzf ${BACKUP_FILE} -C ${TEMP_DIR}

# Copier le backup dans le pod
echo "📥 Copie du backup dans le pod..."
kubectl cp ${TEMP_DIR} ${NAMESPACE}/${POD_NAME}:${BACKUP_DIR}

# Restaurer
echo "🔄 Restauration en cours..."
kubectl exec -n ${NAMESPACE} ${POD_NAME} -- mongorestore \
  ${BACKUP_DIR} \
  --username=$(kubectl get secret mongodb-secrets -n ${NAMESPACE} -o jsonpath='{.data.root-username}' | base64 -d) \
  --password=$(kubectl get secret mongodb-secrets -n ${NAMESPACE} -o jsonpath='{.data.root-password}' | base64 -d) \
  --authenticationDatabase=admin \
  --drop

# Nettoyer
rm -rf ${TEMP_DIR}
kubectl exec -n ${NAMESPACE} ${POD_NAME} -- rm -rf ${BACKUP_DIR}

echo "✅ Restore terminé!"

