#!/bin/bash
set -e

echo "🚀 DiaspoMoney Complete Deployment Pipeline"

# Configuration
NAMESPACE="diaspomoney"
IMAGE_TAG=${1:-latest}
ENVIRONMENT=${2:-staging}
REGISTRY="ghcr.io/diaspomoney"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "docker is not installed"
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        print_warning "helm is not installed, some features may not work"
    fi
    
    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        print_error "kubectl is not connected to a cluster"
        exit 1
    fi
    
    print_status "✅ Prerequisites check passed"
}

# Function to create namespace
create_namespace() {
    print_header "Creating namespace..."
    
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Create secrets
    kubectl create secret generic mongodb-secret \
      --from-literal=uri="mongodb://admin:password@mongodb-primary:27017/diaspomoney" \
      -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl create secret generic redis-secret \
      --from-literal=url="redis://redis-cluster:6379" \
      -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl create secret generic jwt-secret \
      --from-literal=secret="your-super-secret-jwt-key" \
      -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl create secret generic encryption-secret \
      --from-literal=master-key="your-encryption-master-key" \
      -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl create secret generic sentry-secret \
      --from-literal=dsn="your-sentry-dsn" \
      -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    print_status "✅ Namespace and secrets created"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    print_header "Deploying infrastructure..."
    
    # Deploy MongoDB
    print_status "Deploying MongoDB..."
    kubectl apply -f k8s/mongodb/mongodb-cluster.yaml
    
    # Deploy Redis
    print_status "Deploying Redis..."
    kubectl apply -f k8s/redis/redis-cluster.yaml
    
    # Deploy Kafka
    print_status "Deploying Kafka..."
    kubectl apply -f k8s/kafka/kafka-cluster.yaml
    
    # Wait for infrastructure to be ready
    print_status "Waiting for infrastructure to be ready..."
    kubectl wait --for=condition=ready pod -l app=mongodb -n $NAMESPACE --timeout=300s
    kubectl wait --for=condition=ready pod -l app=redis-cluster -n $NAMESPACE --timeout=300s
    kubectl wait --for=condition=ready pod -l app=kafka-cluster -n $NAMESPACE --timeout=300s
    
    print_status "✅ Infrastructure deployed"
}

# Function to deploy monitoring
deploy_monitoring() {
    print_header "Deploying monitoring stack..."
    
    # Deploy Prometheus
    print_status "Deploying Prometheus..."
    kubectl apply -f k8s/monitoring/prometheus-config.yaml
    kubectl apply -f k8s/monitoring/prometheus-rules.yaml
    kubectl apply -f k8s/monitoring/monitoring-stack.yaml
    
    # Deploy Grafana
    print_status "Deploying Grafana..."
    kubectl apply -f k8s/monitoring/grafana-dashboards.yaml
    
    # Deploy Alertmanager
    print_status "Deploying Alertmanager..."
    kubectl apply -f k8s/monitoring/alertmanager-config.yaml
    
    # Wait for monitoring to be ready
    print_status "Waiting for monitoring to be ready..."
    kubectl wait --for=condition=ready pod -l app=prometheus -n $NAMESPACE --timeout=300s
    kubectl wait --for=condition=ready pod -l app=grafana -n $NAMESPACE --timeout=300s
    kubectl wait --for=condition=ready pod -l app=alertmanager -n $NAMESPACE --timeout=300s
    
    print_status "✅ Monitoring deployed"
}

# Function to deploy application
deploy_application() {
    print_header "Deploying application..."
    
    # Update image tag in deployment
    sed -i.bak "s|image: ghcr.io/diaspomoney/diaspomoney:latest|image: $REGISTRY/diaspomoney:$IMAGE_TAG|g" k8s/app/diaspomoney-deployment.yaml
    
    # Deploy application
    print_status "Deploying DiaspoMoney application..."
    kubectl apply -f k8s/app/diaspomoney-deployment.yaml
    
    # Wait for application to be ready
    print_status "Waiting for application to be ready..."
    kubectl wait --for=condition=ready pod -l app=diaspomoney -n $NAMESPACE --timeout=600s
    
    print_status "✅ Application deployed"
}

# Function to run smoke tests
run_smoke_tests() {
    print_header "Running smoke tests..."
    
    # Get application URL
    APP_URL=$(kubectl get service diaspomoney-app -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if [ -z "$APP_URL" ]; then
        APP_URL="localhost:3000"
    fi
    
    # Health check
    print_status "Testing health endpoint..."
    if kubectl run smoke-test --image=curlimages/curl:latest --rm -i --restart=Never \
      -- curl -f http://diaspomoney-app:3000/api/health; then
        print_status "✅ Health check passed"
    else
        print_error "❌ Health check failed"
        exit 1
    fi
    
    # API endpoints test
    print_status "Testing API endpoints..."
    kubectl run api-test --image=curlimages/curl:latest --rm -i --restart=Never \
      -- curl -f http://diaspomoney-app:3000/api/monitoring/metrics
    
    print_status "✅ Smoke tests passed"
}

# Function to run performance tests
run_performance_tests() {
    print_header "Running performance tests..."
    
    # Install k6 if not present
    if ! command -v k6 &> /dev/null; then
        print_status "Installing k6..."
        brew install k6
    fi
    
    # Run performance tests
    print_status "Running load tests..."
    k6 run scripts/performance/load-test.js
    
    print_status "✅ Performance tests completed"
}

# Function to setup ingress
setup_ingress() {
    print_header "Setting up ingress..."
    
    # Deploy Traefik
    print_status "Deploying Traefik..."
    kubectl apply -f k8s/ingress/traefik.yaml
    
    # Deploy ingress rules
    print_status "Deploying ingress rules..."
    kubectl apply -f k8s/ingress/ingress.yaml
    
    print_status "✅ Ingress configured"
}

# Function to backup before deployment
backup_before_deployment() {
    print_header "Creating backup..."
    
    # Backup current deployment
    kubectl get deployment diaspomoney-app -n $NAMESPACE -o yaml > backup/diaspomoney-app-$(date +%Y%m%d-%H%M%S).yaml
    
    print_status "✅ Backup created"
}

# Function to rollback if needed
rollback_deployment() {
    print_header "Rolling back deployment..."
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t backup/diaspomoney-app-*.yaml | head -n1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        kubectl apply -f $LATEST_BACKUP
        print_status "✅ Rollback completed"
    else
        print_error "❌ No backup found for rollback"
        exit 1
    fi
}

# Main deployment function
main() {
    print_header "Starting DiaspoMoney deployment..."
    print_status "Environment: $ENVIRONMENT"
    print_status "Image tag: $IMAGE_TAG"
    print_status "Namespace: $NAMESPACE"
    
    # Create backup directory
    mkdir -p backup
    
    # Check prerequisites
    check_prerequisites
    
    # Create namespace
    create_namespace
    
    # Deploy infrastructure
    deploy_infrastructure
    
    # Deploy monitoring
    deploy_monitoring
    
    # Backup before deployment
    backup_before_deployment
    
    # Deploy application
    deploy_application
    
    # Setup ingress
    setup_ingress
    
    # Run smoke tests
    run_smoke_tests
    
    # Run performance tests
    run_performance_tests
    
    print_status "🎉 Deployment completed successfully!"
    
    # Display access information
    print_header "Access Information"
    print_status "Application: http://app.diaspomoney.fr"
    print_status "Prometheus: http://prometheus.diaspomoney.fr"
    print_status "Grafana: http://grafana.diaspomoney.fr"
    print_status "Alertmanager: http://alertmanager.diaspomoney.fr"
    
    # Display status
    print_header "Deployment Status"
    kubectl get pods -n $NAMESPACE
    kubectl get services -n $NAMESPACE
    kubectl get ingress -n $NAMESPACE
}

# Error handling
trap 'print_error "Deployment failed. Rolling back..."; rollback_deployment; exit 1' ERR

# Run main function
main "$@"
