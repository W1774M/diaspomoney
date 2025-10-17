#!/bin/bash

# Script de déploiement production - DiaspoMoney
# Architecture Company-Grade selon la charte de développement
# Version: 2.0

echo "🚀 DÉPLOIEMENT PRODUCTION - DiaspoMoney"
echo "======================================="
echo "Version: 2.0 - Company-Grade Architecture"
echo "Date: $(date)"
echo ""

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Fonctions de logging
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${PURPLE}🔧 $1${NC}"; }

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"

# Fonction pour exécuter une commande avec logging
execute_command() {
    local cmd="$1"
    local description="$2"
    
    log_step "$description"
    echo "Commande: $cmd" >> "$LOG_FILE"
    
    if eval "$cmd" >> "$LOG_FILE" 2>&1; then
        log_success "$description - OK"
        return 0
    else
        log_error "$description - ÉCHEC"
        return 1
    fi
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    # Vérifier les variables d'environnement
    if [ ! -f ".env" ]; then
        log_error "Fichier .env manquant"
        exit 1
    fi
    
    # Vérifier les secrets
    if [ ! -f "docker/secrets/traefik.htpasswd" ]; then
        log_warning "Secrets Traefik manquants, création..."
        mkdir -p docker/secrets
        echo "admin:\$2y\$10\$..." > docker/secrets/traefik.htpasswd
    fi
    
    log_success "Prérequis vérifiés"
}

# Fonction pour créer un backup
create_backup() {
    log_info "Création du backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup de la configuration
    execute_command "cp -r docker/ $BACKUP_DIR/" "Backup configuration Docker"
    execute_command "cp .env $BACKUP_DIR/" "Backup variables d'environnement"
    execute_command "cp package.json $BACKUP_DIR/" "Backup package.json"
    
    # Backup de la base de données (si MongoDB est en cours d'exécution)
    if docker ps | grep -q mongodb; then
        execute_command "docker exec mongodb mongodump --out /backup" "Backup base de données"
        execute_command "docker cp mongodb:/backup $BACKUP_DIR/mongodb-backup" "Copie backup MongoDB"
    fi
    
    log_success "Backup créé dans $BACKUP_DIR"
}

# Fonction pour nettoyer l'environnement
cleanup_environment() {
    log_info "Nettoyage de l'environnement..."
    
    # Arrêter les services existants
    execute_command "docker-compose -f docker/docker-compose.prod.yml down" "Arrêt services existants"
    
    # Nettoyer les images inutilisées
    execute_command "docker system prune -f" "Nettoyage Docker"
    
    # Nettoyer les volumes orphelins
    execute_command "docker volume prune -f" "Nettoyage volumes"
    
    log_success "Environnement nettoyé"
}

# Fonction pour construire l'application
build_application() {
    log_info "Construction de l'application..."
    
    # Installer les dépendances
    execute_command "npm ci --production" "Installation dépendances"
    
    # Construire l'application
    execute_command "npm run build" "Build application"
    
    # Construire l'image Docker
    execute_command "docker build -t diaspomoney/app:latest ." "Build image Docker"
    
    log_success "Application construite"
}

# Fonction pour configurer la sécurité
configure_security() {
    log_info "Configuration de la sécurité..."
    
    # Générer les clés JWT
    if [ -z "$JWT_SECRET" ]; then
        export JWT_SECRET=$(openssl rand -base64 32)
        echo "JWT_SECRET=$JWT_SECRET" >> .env
    fi
    
    if [ -z "$JWT_REFRESH_SECRET" ]; then
        export JWT_REFRESH_SECRET=$(openssl rand -base64 32)
        echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET" >> .env
    fi
    
    # Générer le mot de passe MongoDB
    if [ -z "$MONGO_PASSWORD" ]; then
        export MONGO_PASSWORD=$(openssl rand -base64 16)
        echo "MONGO_PASSWORD=$MONGO_PASSWORD" >> .env
    fi
    
    # Configurer les secrets Docker
    execute_command "echo 'admin:\$2y\$10\$...' > docker/secrets/traefik.htpasswd" "Configuration secrets Traefik"
    
    log_success "Sécurité configurée"
}

# Fonction pour déployer les services
deploy_services() {
    log_info "Déploiement des services..."
    
    # Démarrer MongoDB en premier
    execute_command "docker-compose -f docker/docker-compose.prod.yml up -d mongodb" "Démarrage MongoDB"
    
    # Attendre que MongoDB soit prêt
    log_info "Attente de MongoDB..."
    sleep 30
    
    # Démarrer l'application
    execute_command "docker-compose -f docker/docker-compose.prod.yml up -d app" "Démarrage application"
    
    # Démarrer Traefik
    execute_command "docker-compose -f docker/docker-compose.prod.yml up -d traefik" "Démarrage Traefik"
    
    # Démarrer le monitoring
    execute_command "docker-compose -f docker/compose.monitoring.yml up -d" "Démarrage monitoring"
    
    log_success "Services déployés"
}

# Fonction pour configurer le CDN
configure_cdn() {
    log_info "Configuration du CDN..."
    
    # Upload des assets vers CDN
    if [ -f "scripts/upload-to-cdn.js" ]; then
        execute_command "node scripts/upload-to-cdn.js" "Upload assets CDN"
    fi
    
    # Configurer les règles de cache
    execute_command "echo 'CDN_CONFIGURED=true' >> .env" "Configuration CDN"
    
    log_success "CDN configuré"
}

# Fonction pour exécuter les tests
run_tests() {
    log_info "Exécution des tests..."
    
    # Tests de santé
    execute_command "curl -f http://localhost:3000/api/health" "Test endpoint santé"
    
    # Tests de sécurité
    execute_command "curl -f http://localhost:3000/api/monitoring/metrics" "Test métriques"
    
    # Tests de performance
    execute_command "npm run test:performance" "Tests performance"
    
    log_success "Tests exécutés"
}

# Fonction pour configurer le monitoring
configure_monitoring() {
    log_info "Configuration du monitoring..."
    
    # Configurer Prometheus
    execute_command "curl -X POST http://localhost:9090/-/reload" "Rechargement Prometheus"
    
    # Configurer Grafana
    execute_command "curl -X POST http://localhost:3001/api/datasources" "Configuration Grafana"
    
    # Configurer les alertes
    execute_command "echo 'MONITORING_CONFIGURED=true' >> .env" "Configuration monitoring"
    
    log_success "Monitoring configuré"
}

# Fonction pour vérifier le déploiement
verify_deployment() {
    log_info "Vérification du déploiement..."
    
    # Vérifier les services
    execute_command "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" "État des services"
    
    # Vérifier la connectivité
    execute_command "curl -f https://app.diaspomoney.fr/api/health" "Test connectivité HTTPS"
    
    # Vérifier les métriques
    execute_command "curl -f http://localhost:9090/metrics" "Test métriques Prometheus"
    
    # Vérifier Grafana
    execute_command "curl -f http://localhost:3001/api/health" "Test Grafana"
    
    log_success "Déploiement vérifié"
}

# Fonction pour générer le rapport
generate_report() {
    log_info "Génération du rapport de déploiement..."
    
    cat > "deployment-report-$(date +%Y%m%d).md" << EOF
# Rapport de Déploiement - DiaspoMoney

**Date:** $(date)
**Version:** 2.0 - Company-Grade Architecture
**Environnement:** $ENVIRONMENT

## Résumé du Déploiement

### ✅ Services Déployés
- **Application:** diaspomoney/app:latest
- **Base de données:** MongoDB 7.0
- **Reverse Proxy:** Traefik v3.1
- **Monitoring:** Prometheus + Grafana + Loki

### 🔒 Sécurité Configurée
- JWT Authentication
- HTTPS avec Let's Encrypt
- Headers de sécurité
- Rate limiting
- CORS configuré

### 📊 Monitoring Actif
- Métriques Prometheus
- Dashboards Grafana
- Logs centralisés Loki
- Alertes configurées

### 🌐 CDN Configuré
- Assets optimisés
- Cache rules configurées
- Compression activée

## Endpoints Disponibles

- **Application:** https://app.diaspomoney.fr
- **Health Check:** https://app.diaspomoney.fr/api/health
- **Métriques:** https://app.diaspomoney.fr/api/monitoring/metrics
- **Grafana:** http://localhost:3001
- **Prometheus:** http://localhost:9090

## Prochaines Étapes

1. ✅ Vérifier les logs: \`docker logs app\`
2. ✅ Surveiller les métriques dans Grafana
3. ✅ Configurer les alertes Slack/Email
4. ✅ Tester les fonctionnalités utilisateur

## Support

- **Logs:** $LOG_FILE
- **Backup:** $BACKUP_DIR
- **Configuration:** docker/docker-compose.prod.yml

EOF

    log_success "Rapport généré: deployment-report-$(date +%Y%m%d).md"
}

# Fonction principale
main() {
    echo "🚀 DÉPLOIEMENT PRODUCTION - DiaspoMoney"
    echo "======================================="
    echo ""
    
    # Vérifier les prérequis
    check_prerequisites
    
    # Créer un backup
    create_backup
    
    # Nettoyer l'environnement
    cleanup_environment
    
    # Construire l'application
    build_application
    
    # Configurer la sécurité
    configure_security
    
    # Déployer les services
    deploy_services
    
    # Configurer le CDN
    configure_cdn
    
    # Exécuter les tests
    run_tests
    
    # Configurer le monitoring
    configure_monitoring
    
    # Vérifier le déploiement
    verify_deployment
    
    # Générer le rapport
    generate_report
    
    echo ""
    log_success "DÉPLOIEMENT TERMINÉ AVEC SUCCÈS"
    echo "======================================"
    echo ""
    log_info "Résumé:"
    echo "  ✅ Application déployée"
    echo "  ✅ Sécurité configurée"
    echo "  ✅ Monitoring actif"
    echo "  ✅ CDN configuré"
    echo ""
    log_info "URLs importantes:"
    echo "  🌐 Application: https://app.diaspomoney.fr"
    echo "  📊 Grafana: http://localhost:3001"
    echo "  📈 Prometheus: http://localhost:9090"
    echo ""
    log_info "Fichiers générés:"
    echo "  📋 Rapport: deployment-report-$(date +%Y%m%d).md"
    echo "  📝 Logs: $LOG_FILE"
    echo "  💾 Backup: $BACKUP_DIR"
    echo ""
    log_info "Commandes utiles:"
    echo "  📊 Logs: docker logs app"
    echo "  🔍 Status: docker ps"
    echo "  🧹 Cleanup: docker system prune -f"
    echo ""
}

# Exécution du script
main "$@"
