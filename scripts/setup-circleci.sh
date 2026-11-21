#!/bin/bash

# Script d'aide pour configurer CircleCI
# Ce script génère les configurations kubectl en base64 pour CircleCI

set -e

echo "🚀 Configuration CircleCI - Génération des secrets kubectl"
echo "=========================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que kubectl est installé
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl n'est pas installé"
    exit 1
fi

# Vérifier que base64 est disponible
if ! command -v base64 &> /dev/null; then
    echo "❌ base64 n'est pas disponible"
    exit 1
fi

echo "📋 Ce script va générer les configurations kubectl en base64 pour CircleCI"
echo ""
echo "Options:"
echo "1. Utiliser des fichiers kubeconfig séparés (~/.kube/config-dev, config-rct, config-prod)"
echo "2. Utiliser des contexts depuis un seul fichier kubeconfig"
echo "3. Utiliser le fichier kubeconfig par défaut (~/.kube/config)"
echo ""
read -p "Choisissez une option (1/2/3): " option

case $option in
    1)
        echo ""
        echo "📁 Utilisation de fichiers kubeconfig séparés"
        
        for env in dev rct prod; do
            config_file="$HOME/.kube/config-${env}"
            if [ -f "$config_file" ]; then
                echo ""
                echo "${GREEN}✅ Configuration ${env}:${NC}"
                echo "Fichier: $config_file"
                base64_output=$(cat "$config_file" | base64 -w 0)
                echo ""
                echo "Variable CircleCI: KUBE_CONFIG_${env^^}"
                echo "Valeur (base64):"
                echo "$base64_output"
                echo ""
                echo "---"
            else
                echo "${YELLOW}⚠️  Fichier non trouvé: $config_file${NC}"
            fi
        done
        ;;
    2)
        echo ""
        echo "🔧 Utilisation de contexts depuis un seul fichier kubeconfig"
        
        # Lister les contexts disponibles
        echo "Contexts disponibles:"
        kubectl config get-contexts
        
        for env in dev rct prod; do
            echo ""
            read -p "Nom du context Kubernetes pour ${env}: " context_name
            
            if kubectl config view --context="$context_name" --flatten > /dev/null 2>&1; then
                echo "${GREEN}✅ Configuration ${env} (context: ${context_name}):${NC}"
                base64_output=$(kubectl config view --context="$context_name" --flatten | base64 -w 0)
                echo ""
                echo "Variable CircleCI: KUBE_CONFIG_${env^^}"
                echo "Valeur (base64):"
                echo "$base64_output"
                echo ""
                echo "---"
            else
                echo "${YELLOW}⚠️  Context '${context_name}' non trouvé${NC}"
            fi
        done
        ;;
    3)
        echo ""
        echo "📄 Utilisation du fichier kubeconfig par défaut"
        
        default_config="$HOME/.kube/config"
        if [ -f "$default_config" ]; then
            echo "${GREEN}✅ Fichier trouvé: $default_config${NC}"
            echo ""
            echo "⚠️  ATTENTION: Cette configuration sera utilisée pour TOUS les environnements"
            echo ""
            read -p "Continuer ? (yes/no): " confirm
            
            if [ "$confirm" = "yes" ]; then
                base64_output=$(cat "$default_config" | base64 -w 0)
                echo ""
                echo "Variable CircleCI: KUBE_CONFIG_DEV, KUBE_CONFIG_RCT, KUBE_CONFIG_PROD"
                echo "Valeur (base64) - À copier pour les 3 variables:"
                echo "$base64_output"
            fi
        else
            echo "${YELLOW}⚠️  Fichier non trouvé: $default_config${NC}"
        fi
        ;;
    *)
        echo "❌ Option invalide"
        exit 1
        ;;
esac

echo ""
echo "=========================================================="
echo "📝 Instructions pour ajouter les variables dans CircleCI:"
echo ""
echo "1. Allez sur https://app.circleci.com"
echo "2. Sélectionnez votre projet"
echo "3. Allez dans Project Settings → Environment Variables"
echo "4. Cliquez sur 'Add Environment Variable'"
echo "5. Ajoutez chaque variable avec sa valeur base64"
echo ""
echo "Variables à ajouter:"
echo "  - KUBE_CONFIG_DEV"
echo "  - KUBE_CONFIG_RCT"
echo "  - KUBE_CONFIG_PROD"
echo ""
echo "✅ Configuration terminée !"

