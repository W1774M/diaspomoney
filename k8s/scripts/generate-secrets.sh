#!/bin/bash

# Script pour générer les secrets Kubernetes
# Usage: ./k8s/scripts/generate-secrets.sh

set -e

echo "🔐 Génération des secrets Kubernetes"
echo ""

# Fonction pour générer un secret aléatoire
generate_secret() {
    openssl rand -base64 32 | tr -d '\n'
}

# Créer le fichier de secrets
SECRETS_FILE="k8s/secrets/secrets.yaml"

cat > ${SECRETS_FILE} <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: diaspomoney-secrets
  namespace: diaspomoney-prod
  labels:
    app: diaspomoney
type: Opaque
stringData:
  # NextAuth Configuration
  AUTH_SECRET: "$(generate_secret)"
  NEXTAUTH_SECRET: "$(generate_secret)"
  
  # JWT Configuration
  JWT_SECRET: "$(generate_secret)"
  
  # OAuth Providers (à remplacer manuellement)
  GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID"
  GOOGLE_CLIENT_SECRET: "YOUR_GOOGLE_CLIENT_SECRET"
  FACEBOOK_CLIENT_ID: "YOUR_FACEBOOK_CLIENT_ID"
  FACEBOOK_CLIENT_SECRET: "YOUR_FACEBOOK_CLIENT_SECRET"
  
  # Email Configuration (à remplacer manuellement)
  SMTP_HOST: "smtp.example.com"
  SMTP_PORT: "587"
  SMTP_USER: "noreply@diaspomoney.fr"
  SMTP_PASSWORD: "YOUR_SMTP_PASSWORD"
  SMTP_FROM: "DiaspoMoney <noreply@diaspomoney.fr>"
  
  # Stripe Configuration (à remplacer manuellement)
  STRIPE_SECRET_KEY: "sk_live_YOUR_STRIPE_SECRET_KEY"
  STRIPE_PUBLISHABLE_KEY: "pk_live_YOUR_STRIPE_PUBLISHABLE_KEY"
  STRIPE_WEBHOOK_SECRET: "whsec_YOUR_STRIPE_WEBHOOK_SECRET"
  
  # Sentry Configuration (à remplacer manuellement)
  SENTRY_DSN: "https://YOUR_SENTRY_DSN@sentry.io/PROJECT_ID"
  SENTRY_AUTH_TOKEN: "YOUR_SENTRY_AUTH_TOKEN"
  
  # MongoDB Connection
  MONGO_USERNAME: "diaspomoney"
  MONGO_PASSWORD: "$(generate_secret)"
  MONGO_AUTH_DATABASE: "diaspomoney"
  
  # Redis Connection
  REDIS_PASSWORD: "$(generate_secret)"

---
apiVersion: v1
kind: Secret
metadata:
  name: mongodb-secrets
  namespace: diaspomoney-prod
  labels:
    app: diaspomoney
    component: mongodb
type: Opaque
stringData:
  root-username: "admin"
  root-password: "$(generate_secret)"

---
apiVersion: v1
kind: Secret
metadata:
  name: redis-secrets
  namespace: diaspomoney-prod
  labels:
    app: diaspomoney
    component: redis
type: Opaque
stringData:
  password: "$(generate_secret)"

---
apiVersion: v1
kind: Secret
metadata:
  name: mongo-express-secrets
  namespace: diaspomoney-prod
  labels:
    app: diaspomoney
    component: mongo-express
type: Opaque
stringData:
  username: "admin"
  password: "$(generate_secret)"
EOF

echo "✅ Secrets générés dans ${SECRETS_FILE}"
echo ""
echo "⚠️  IMPORTANT:"
echo "   1. Vérifiez et remplacez les valeurs marquées 'YOUR_*'"
echo "   2. Ne commitez JAMAIS ce fichier dans Git"
echo "   3. Appliquez les secrets avec: kubectl apply -f ${SECRETS_FILE}"

