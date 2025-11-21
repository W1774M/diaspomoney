#!/bin/bash

# Script pour créer des secrets TLS auto-signés pour le développement
# Usage: ./scripts/create-tls-secret.sh

set -e

NAMESPACE=${NAMESPACE:-diaspomoney}
DOMAINS=("dev.diaspomoney.fr" "rct.diaspomoney.fr" "app.diaspomoney.fr")
SECRETS=("dev-tls-cert" "rct-tls-cert" "app-tls-cert")

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

section() {
    echo -e "${BLUE}[SECTION]${NC} $1"
}

info "Création de certificats TLS auto-signés pour le développement"

# Créer un répertoire temporaire
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

# Fonction pour créer un certificat pour un domaine spécifique
create_cert_for_domain() {
    local domain=$1
    local secret_name=$2
    
    section "Création du certificat pour $domain (secret: $secret_name)"
    
    # Générer la clé privée
    info "Génération de la clé privée pour $domain..."
    openssl genrsa -out "$TMP_DIR/${domain}.key" 2048
    
    # Créer le fichier de configuration pour le certificat
    cat > "$TMP_DIR/${domain}.conf" <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = $domain

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = $domain
DNS.2 = *.$domain
EOF
    
    # Générer le certificat
    info "Génération du certificat auto-signé pour $domain..."
    openssl req -new -x509 -key "$TMP_DIR/${domain}.key" -out "$TMP_DIR/${domain}.crt" \
        -days 365 -config "$TMP_DIR/${domain}.conf" -extensions v3_req
    
    # Créer le secret Kubernetes
    info "Création du secret Kubernetes $secret_name..."
    kubectl create secret tls "$secret_name" \
        --cert="$TMP_DIR/${domain}.crt" \
        --key="$TMP_DIR/${domain}.key" \
        -n "$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    info "✅ Secret TLS créé: $secret_name pour $domain"
}

# Créer un certificat générique pour tous les domaines (pour compatibilité)
section "Création d'un certificat générique (diaspomoney-tls) pour tous les domaines"
info "Génération de la clé privée..."
openssl genrsa -out "$TMP_DIR/tls.key" 2048

# Créer le fichier de configuration pour le certificat
cat > "$TMP_DIR/openssl.conf" <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = diaspomoney.fr

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
EOF

# Ajouter les domaines
for i in "${!DOMAINS[@]}"; do
    echo "DNS.$((i+1)) = ${DOMAINS[$i]}" >> "$TMP_DIR/openssl.conf"
done

# Générer le certificat
info "Génération du certificat auto-signé..."
openssl req -new -x509 -key "$TMP_DIR/tls.key" -out "$TMP_DIR/tls.crt" \
    -days 365 -config "$TMP_DIR/openssl.conf" -extensions v3_req

# Créer le secret Kubernetes générique
info "Création du secret Kubernetes générique..."
kubectl create secret tls "diaspomoney-tls" \
    --cert="$TMP_DIR/tls.crt" \
    --key="$TMP_DIR/tls.key" \
    -n "$NAMESPACE" \
    --dry-run=client -o yaml | kubectl apply -f -

info "✅ Secret TLS générique créé: diaspomoney-tls"

# Créer les secrets spécifiques pour chaque environnement
for i in "${!DOMAINS[@]}"; do
    create_cert_for_domain "${DOMAINS[$i]}" "${SECRETS[$i]}"
done

echo ""
info "✅ Tous les secrets TLS ont été créés avec succès"
warn "⚠️  Ces certificats sont auto-signés et ne seront pas reconnus par les navigateurs"
warn "⚠️  Pour la production, configurez Let's Encrypt avec Traefik"

