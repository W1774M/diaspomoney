#!/bin/bash
set -e

echo "📊 Deploying DiaspoMoney Monitoring Stack..."

# Configuration
NAMESPACE="diaspomoney"
GRAFANA_PASSWORD="adminpassword"
SMTP_PASSWORD="your-smtp-password"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
PAGERDUTY_WEBHOOK_URL="https://events.pagerduty.com/v2/enqueue"
SECURITY_WEBHOOK_URL="https://security.diaspomoney.fr/webhook"
PAYMENT_WEBHOOK_URL="https://payments.diaspomoney.fr/webhook"

# Créer le namespace
echo "📦 Creating namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Déployer Prometheus
echo "📈 Deploying Prometheus..."
kubectl apply -f k8s/monitoring/prometheus-config.yaml
kubectl apply -f k8s/monitoring/prometheus-rules.yaml
kubectl apply -f k8s/monitoring/monitoring-stack.yaml

# Attendre que Prometheus soit prêt
echo "⏳ Waiting for Prometheus to be ready..."
kubectl wait --for=condition=ready pod -l app=prometheus -n $NAMESPACE --timeout=300s

# Déployer Grafana
echo "📊 Deploying Grafana..."
kubectl apply -f k8s/monitoring/grafana-dashboards.yaml

# Attendre que Grafana soit prêt
echo "⏳ Waiting for Grafana to be ready..."
kubectl wait --for=condition=ready pod -l app=grafana -n $NAMESPACE --timeout=300s

# Déployer Alertmanager
echo "🚨 Deploying Alertmanager..."
kubectl apply -f k8s/monitoring/alertmanager-config.yaml

# Attendre qu'Alertmanager soit prêt
echo "⏳ Waiting for Alertmanager to be ready..."
kubectl wait --for=condition=ready pod -l app=alertmanager -n $NAMESPACE --timeout=300s

# Configurer les secrets
echo "🔐 Configuring secrets..."
kubectl create secret generic grafana-secret \
  --from-literal=admin-password=$GRAFANA_PASSWORD \
  -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic alertmanager-secrets \
  --from-literal=smtp-password=$SMTP_PASSWORD \
  --from-literal=slack-webhook-url=$SLACK_WEBHOOK_URL \
  --from-literal=pagerduty-webhook-url=$PAGERDUTY_WEBHOOK_URL \
  --from-literal=security-webhook-url=$SECURITY_WEBHOOK_URL \
  --from-literal=payment-webhook-url=$PAYMENT_WEBHOOK_URL \
  -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Redémarrer Alertmanager pour charger les nouveaux secrets
echo "🔄 Restarting Alertmanager..."
kubectl rollout restart deployment/alertmanager -n $NAMESPACE

# Vérifier le statut
echo "✅ Monitoring deployment completed!"
echo ""
echo "📊 Status:"
kubectl get pods -n $NAMESPACE
echo ""
echo "🌐 Services:"
kubectl get services -n $NAMESPACE
echo ""
echo "🔗 Access URLs:"
echo "Prometheus: http://localhost:9090"
echo "Grafana: http://localhost:3000 (admin/$GRAFANA_PASSWORD)"
echo "Alertmanager: http://localhost:9093"
echo ""
echo "📈 Dashboards available:"
echo "- DiaspoMoney Overview"
echo "- Database Monitoring"
echo "- Security Monitoring"
echo "- Transaction Monitoring"
echo "- Notification Monitoring"
echo ""
echo "🚨 Alerting configured for:"
echo "- Critical alerts → Email + Slack + PagerDuty"
echo "- Warning alerts → Email + Slack"
echo "- Security alerts → Security team"
echo "- Payment alerts → Payment team"
echo ""
echo "🎉 Monitoring stack is ready!"
