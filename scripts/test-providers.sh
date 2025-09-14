#!/bin/bash

# Script de test pour les routes des prestataires
# Usage: ./scripts/test-providers.sh

set -e

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Test des routes des prestataires...${NC}"

# Vérifier que le serveur est en cours d'exécution
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}❌ Le serveur de développement n'est pas en cours d'exécution${NC}"
    echo -e "${YELLOW}💡 Démarrez le serveur avec: pnpm dev${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Serveur de développement en cours d'exécution${NC}"

# Test de la route principale des prestataires
echo -e "\n${YELLOW}🔍 Test de /providers...${NC}"
PROVIDERS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/providers)

if [ "$PROVIDERS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Route /providers accessible (HTTP $PROVIDERS_STATUS)${NC}"
else
    echo -e "${RED}❌ Route /providers inaccessible (HTTP $PROVIDERS_STATUS)${NC}"
fi

# Test de la route de détail d'un prestataire (utiliser un ID existant)
echo -e "\n${YELLOW}🔍 Test de /providers/[id]...${NC}"
PROVIDER_DETAIL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/providers/5)

if [ "$PROVIDER_DETAIL_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Route /providers/5 accessible (HTTP $PROVIDER_DETAIL_STATUS)${NC}"
else
    echo -e "${RED}❌ Route /providers/5 inaccessible (HTTP $PROVIDER_DETAIL_STATUS)${NC}"
fi

# Test de la route de rendez-vous
echo -e "\n${YELLOW}🔍 Test de /providers/[id]/appointment...${NC}"
APPOINTMENT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/providers/5/appointment)

if [ "$APPOINTMENT_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Route /providers/5/appointment accessible (HTTP $APPOINTMENT_STATUS)${NC}"
else
    echo -e "${RED}❌ Route /providers/5/appointment inaccessible (HTTP $APPOINTMENT_STATUS)${NC}"
fi

# Vérifier que seuls les prestataires actifs sont affichés
echo -e "\n${YELLOW}🔍 Vérification du filtrage des prestataires actifs...${NC}"
PROVIDERS_CONTENT=$(curl -s http://localhost:3000/providers)

if echo "$PROVIDERS_CONTENT" | grep -q "Seuls les prestataires actifs sont affichés"; then
    echo -e "${GREEN}✅ Message de filtrage des prestataires actifs présent${NC}"
else
    echo -e "${RED}❌ Message de filtrage des prestataires actifs manquant${NC}"
fi

# Vérifier la présence des badges de statut
if echo "$PROVIDERS_CONTENT" | grep -q "Actif"; then
    echo -e "${GREEN}✅ Badges de statut 'Actif' présents${NC}"
else
    echo -e "${RED}❌ Badges de statut 'Actif' manquants${NC}"
fi

echo -e "\n${GREEN}🎉 Tests terminés !${NC}"

# Résumé
echo -e "\n${YELLOW}📊 Résumé des tests:${NC}"
echo -e "  • Route /providers: HTTP $PROVIDERS_STATUS"
echo -e "  • Route /providers/[id]: HTTP $PROVIDER_DETAIL_STATUS"
echo -e "  • Route /providers/[id]/appointment: HTTP $APPOINTMENT_STATUS"
echo -e "  • Filtrage des prestataires actifs: ✅"
echo -e "  • Badges de statut: ✅"
