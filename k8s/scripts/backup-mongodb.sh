#!/bin/bash

# Script de backup MongoDB dans Kubernetes
# Usage: ./k8s/scripts/backup-mongodb.sh [namespace]

set -e

NAMESPACE=${1:-diaspomoney-prod}
POD_NAME=$(kubectl get pods -n ${NAMESPACE} -l component=mongodb -o jsonpath='{.items[0].metadata.name}')
BACKUP_DIR="/tmp/backup-$(date +%Y%m%d-%H%M%S)"
LOCAL_BACKUP_DIR="./backups/mongodb-$(date +%Y%m%d-%H%M%S)"

echo "📦 Backup MongoDB depuis le pod: ${POD_NAME}"
echo "📁 Dossier de backup: ${BACKUP_DIR}"

# Créer le dossier local
mkdir -p ${LOCAL_BACKUP_DIR}

# Exécuter le backup dans le pod
kubectl exec -n ${NAMESPACE} ${POD_NAME} -- mongodump \
  --out=${BACKUP_DIR} \
  --username=$(kubectl get secret mongodb-secrets -n ${NAMESPACE} -o jsonpath='{.data.root-username}' | base64 -d) \
  --password=$(kubectl get secret mongodb-secrets -n ${NAMESPACE} -o jsonpath='{.data.root-password}' | base64 -d) \
  --authenticationDatabase=admin

# Copier le backup localement
echo "📥 Copie du backup localement..."
kubectl cp ${NAMESPACE}/${POD_NAME}:${BACKUP_DIR} ${LOCAL_BACKUP_DIR}

# Compresser le backup
echo "🗜️  Compression du backup..."
tar -czf ${LOCAL_BACKUP_DIR}.tar.gz -C ${LOCAL_BACKUP_DIR} .

# Nettoyer
rm -rf ${LOCAL_BACKUP_DIR}
kubectl exec -n ${NAMESPACE} ${POD_NAME} -- rm -rf ${BACKUP_DIR}

echo "✅ Backup terminé: ${LOCAL_BACKUP_DIR}.tar.gz"

