#!/bin/bash
# Script pour tester la connectivité des ports après ouverture dans le firewall
# Usage: ./scripts/test-ports.sh

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo "🔍 Test de connectivité des ports..."
echo ""

# Ports à tester
PORTS=(80 443 30201 31337)
PORT_NAMES=("HTTP" "HTTPS" "NodePort HTTP" "NodePort HTTPS")

for i in "${!PORTS[@]}"; do
    PORT=${PORTS[$i]}
    NAME=${PORT_NAMES[$i]}
    
    if timeout 2 bash -c "echo > /dev/tcp/localhost/$PORT" 2>/dev/null; then
        info "✅ Port $PORT ($NAME) : Accessible localement"
    else
        warn "⚠️  Port $PORT ($NAME) : Non accessible localement"
    fi
done

echo ""
echo "🌐 Test depuis l'extérieur (nécessite que les ports soient ouverts) :"
echo ""

# Test HTTP
info "Test HTTP (port 80) :"
if curl -s -o /dev/null -w "   HTTP %{http_code}\n" --max-time 5 http://app.diaspomoney.fr/ 2>/dev/null; then
    info "   ✅ app.diaspomoney.fr accessible"
else
    error "   ❌ app.diaspomoney.fr non accessible"
fi

if curl -s -o /dev/null -w "   HTTP %{http_code}\n" --max-time 5 http://dev.diaspomoney.fr/ 2>/dev/null; then
    info "   ✅ dev.diaspomoney.fr accessible"
else
    error "   ❌ dev.diaspomoney.fr non accessible"
fi

echo ""
info "Test HTTPS (port 443) :"
if curl -s -o /dev/null -w "   HTTP %{http_code}\n" --max-time 5 -k https://app.diaspomoney.fr/ 2>/dev/null; then
    info "   ✅ app.diaspomoney.fr (HTTPS) accessible"
else
    error "   ❌ app.diaspomoney.fr (HTTPS) non accessible"
fi

if curl -s -o /dev/null -w "   HTTP %{http_code}\n" --max-time 5 -k https://dev.diaspomoney.fr/ 2>/dev/null; then
    info "   ✅ dev.diaspomoney.fr (HTTPS) accessible"
else
    error "   ❌ dev.diaspomoney.fr (HTTPS) non accessible"
fi

echo ""
echo "✅ Tests terminés"

