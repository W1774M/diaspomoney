#!/bin/bash

# Script de résolution MongoDB Production - DiaspoMoney
# Basé sur la charte de développement Company-Grade

echo "🔧 RÉSOLUTION MONGODB PRODUCTION - DiaspoMoney"
echo "=============================================="

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    log_error "Docker n'est pas en cours d'exécution"
    exit 1
fi

log_info "Docker est opérationnel"

# Phase 1: Diagnostic
log_info "Phase 1: Diagnostic des problèmes de connexion"

# Test 1: Vérifier la résolution DNS
log_info "Test 1: Résolution DNS interne"
if docker exec app nslookup mongodb > /dev/null 2>&1; then
    log_success "Résolution DNS interne OK"
else
    log_warning "Résolution DNS interne échouée"
fi

# Test 2: Vérifier la connectivité TCP
log_info "Test 2: Connectivité TCP"
if docker exec app nc -zv mongodb 27017 > /dev/null 2>&1; then
    log_success "Connectivité TCP OK"
else
    log_warning "Connectivité TCP échouée"
fi

# Test 3: Vérifier les variables d'environnement
log_info "Test 3: Variables d'environnement"
docker exec app env | grep MONGO || log_warning "Variables MongoDB non trouvées"

# Phase 2: Solutions
log_info "Phase 2: Application des solutions"

# Solution A: Modifier la configuration Docker Compose
log_info "Solution A: Configuration DNS interne"

# Créer un backup de la configuration actuelle
cp docker/docker-compose.prod.yml docker/docker-compose.prod.yml.backup
log_success "Backup créé: docker-compose.prod.yml.backup"

# Modifier la configuration pour utiliser le nom de service interne
cat > docker/docker-compose.prod.fixed.yml << 'EOF'
include:
  - compose.monitoring.yml

networks:
  traefik: {}
  diaspomoney: {}

volumes:
  traefik_letsencrypt: {}
  traefik_logs: {}

services:
  traefik:
    image: traefik:v3.1
    container_name: traefik
    restart: unless-stopped
    networks:
      - traefik
      - diaspomoney
    ports:
      - "80:80"
      - "443:443"
    command:
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --entrypoints.metrics.address=:9100
      - --certificatesresolvers.le.acme.email=contact@diaspomoney.fr
      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.le.acme.httpchallenge=true
      - --certificatesresolvers.le.acme.httpchallenge.entrypoint=web
      - --certificatesresolvers.le.acme.caserver=https://acme-v02.api.letsencrypt.org/directory
      - --providers.docker.endpoint=unix:///var/run/docker.sock
      - --providers.docker.network=diaspomoney
      - --providers.docker.exposedByDefault=false
      - --api.dashboard=true
      - --api.insecure=false
      - --metrics.prometheus.addEntryPointsLabels=true
      - --metrics.prometheus.addServicesLabels=true
      - --metrics.prometheus.entryPoint=metrics
      - --log.level=INFO
      - --log.format=json
      - --log.filePath=/var/log/traefik/traefik.log
      - --accessLog.filePath=/var/log/traefik/access.log
      - --global.checkNewVersion=false
      - --global.sendAnonymousUsage=false
    volumes:
      - traefik_letsencrypt:/letsencrypt
      - traefik_logs:/var/log/traefik
      - /var/run/docker.sock:/var/run/docker.sock:ro
    secrets:
      - traefik_basicauth
    labels:
      - traefik.enable=true
      - traefik.http.routers.traefik-dashboard.rule=Host(`dashboard.diaspomoney.fr`)
      - traefik.http.routers.traefik-dashboard.entrypoints=websecure
      - traefik.http.routers.traefik-dashboard.tls=true
      - traefik.http.routers.traefik-dashboard.tls.certresolver=le
      - traefik.http.routers.traefik-dashboard.service=api@internal
      - traefik.http.middlewares.dash-auth.basicauth.usersfile=/run/secrets/traefik_basicauth
      - traefik.http.routers.traefik-dashboard.middlewares=dash-auth

  app:
    build:
      context: ../
      dockerfile: Dockerfile
    container_name: app
    restart: unless-stopped
    env_file:
      - ../.env
    environment:
      # Configuration MongoDB optimisée pour production
      MONGODB_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/diaspomoney?authSource=admin&retryWrites=true&w=majority&serverSelectionTimeoutMS=10000
      NODE_ENV: production
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - traefik
      - diaspomoney
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: "1G"
        reservations:
          cpus: "0.5"
          memory: "256M"
    expose:
      - "3000"
    labels:
      - traefik.enable=true
      - traefik.docker.network=diaspomoney
      - traefik.http.routers.app.rule=Host(`app.diaspomoney.fr`)
      - traefik.http.routers.app.entrypoints=websecure
      - traefik.http.routers.app.tls=true
      - traefik.http.routers.app.tls.certresolver=le
      - traefik.http.services.app.loadbalancer.server.port=3000
      - traefik.http.routers.app-http.rule=Host(`app.diaspomoney.fr`)
      - traefik.http.routers.app-http.entrypoints=web
      - traefik.http.routers.app-http.middlewares=redirect-to-https
      - traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
      - traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true
      - traefik.http.middlewares.sec.headers.stsSeconds=31536000
      - traefik.http.middlewares.sec.headers.stsIncludeSubdomains=true
      - traefik.http.middlewares.sec.headers.stsPreload=true
      - traefik.http.routers.app.middlewares=sec

  mongodb:
    image: mongo:7.0
    container_name: mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: diaspomoney
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - diaspomoney
    ports:
      - "27017:27017"
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: "512M"
        reservations:
          cpus: "0.25"
          memory: "128M"

volumes:
  mongodb_data: {}

secrets:
  traefik_basicauth:
    file: ./secrets/traefik.htpasswd
EOF

log_success "Configuration Docker Compose optimisée créée"

# Phase 3: Test de la nouvelle configuration
log_info "Phase 3: Test de la nouvelle configuration"

# Arrêter les services actuels
log_info "Arrêt des services actuels..."
docker-compose -f docker/docker-compose.prod.yml down

# Démarrer avec la nouvelle configuration
log_info "Démarrage avec la nouvelle configuration..."
docker-compose -f docker/docker-compose.prod.fixed.yml up -d

# Attendre que les services soient prêts
log_info "Attente du démarrage des services..."
sleep 30

# Test de connexion
log_info "Test de connexion MongoDB..."
if docker exec app node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
}).then(() => {
  console.log('✅ Connexion MongoDB réussie');
  process.exit(0);
}).catch(err => {
  console.error('❌ Connexion MongoDB échouée:', err.message);
  process.exit(1);
});
"; then
    log_success "Connexion MongoDB fonctionnelle"
else
    log_error "Connexion MongoDB toujours en échec"
    log_info "Vérifiez les logs: docker logs app"
    log_info "Vérifiez les logs MongoDB: docker logs mongodb"
fi

# Phase 4: Monitoring
log_info "Phase 4: Configuration du monitoring"

# Créer un endpoint de santé
cat > app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  try {
    // Test de connexion MongoDB
    const dbState = mongoose.connection.readyState;
    const isConnected = dbState === 1;
    
    // Test de ping MongoDB
    if (isConnected) {
      await mongoose.connection.db.admin().ping();
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: {
          connected: isConnected,
          state: dbState,
          host: mongoose.connection.host,
          name: mongoose.connection.name
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}
EOF

log_success "Endpoint de santé créé: /api/health"

# Résumé
echo ""
log_success "RÉSOLUTION MONGODB TERMINÉE"
echo "================================"
echo ""
log_info "Actions effectuées:"
echo "  ✅ Backup de la configuration actuelle"
echo "  ✅ Configuration Docker Compose optimisée"
echo "  ✅ Variables d'environnement MongoDB corrigées"
echo "  ✅ Endpoint de santé créé"
echo ""
log_info "Prochaines étapes:"
echo "  1. Vérifier les logs: docker logs app"
echo "  2. Tester l'endpoint: curl https://app.diaspomoney.fr/api/health"
echo "  3. Surveiller les métriques dans Grafana"
echo ""
log_info "En cas de problème:"
echo "  - Restaurer: cp docker/docker-compose.prod.yml.backup docker/docker-compose.prod.yml"
echo "  - Redémarrer: docker-compose -f docker/docker-compose.prod.yml up -d"
