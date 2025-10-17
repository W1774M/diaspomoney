#!/bin/bash
set -e

echo "🚀 Deploying DiaspoMoney Infrastructure..."

# Configuration
NAMESPACE="diaspomoney"
REDIS_PASSWORD="superSecretRedisPassword"
MONGO_PASSWORD="superSecretMongoPassword"
MONGO_EXPRESS_PASSWORD="superSecretMongoExpressPassword"
REDIS_COMMANDER_PASSWORD="superSecretRedisCommanderPassword"

# Créer le namespace
echo "📦 Creating namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Déployer Redis
echo "⚡ Deploying Redis Cluster..."
kubectl apply -f k8s/redis/redis-configmap.yaml
kubectl apply -f k8s/redis/redis-cluster.yaml

# Attendre que Redis soit prêt
echo "⏳ Waiting for Redis to be ready..."
kubectl wait --for=condition=ready pod -l app=redis-cluster -n $NAMESPACE --timeout=300s

# Initialiser le cluster Redis
echo "🔧 Initializing Redis cluster..."
kubectl exec -it redis-cluster-0 -n $NAMESPACE -- redis-cli --cluster create \
  --cluster-replicas 1 \
  redis-cluster-0.redis-cluster:6379 \
  redis-cluster-1.redis-cluster:6379 \
  redis-cluster-2.redis-cluster:6379 \
  redis-cluster-3.redis-cluster:6379 \
  redis-cluster-4.redis-cluster:6379 \
  redis-cluster-5.redis-cluster:6379 \
  --cluster-yes

# Déployer Kafka
echo "📨 Deploying Kafka..."
kubectl apply -f k8s/kafka/kafka-cluster.yaml

# Attendre que Kafka soit prêt
echo "⏳ Waiting for Kafka to be ready..."
kubectl wait --for=condition=ready pod -l app=kafka-cluster -n $NAMESPACE --timeout=300s

# Créer les topics Kafka
echo "📝 Creating Kafka topics..."
kubectl exec -it kafka-cluster-0 -n $NAMESPACE -- kafka-topics --create \
  --topic user.events \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 3

kubectl exec -it kafka-cluster-0 -n $NAMESPACE -- kafka-topics --create \
  --topic transaction.events \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 3

kubectl exec -it kafka-cluster-0 -n $NAMESPACE -- kafka-topics --create \
  --topic notification.events \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 3

kubectl exec -it kafka-cluster-0 -n $NAMESPACE -- kafka-topics --create \
  --topic payment.events \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 3

# Déployer l'application
echo "🚀 Deploying DiaspoMoney application..."
kubectl apply -f k8s/app/diaspomoney-deployment.yaml

# Attendre que l'application soit prête
echo "⏳ Waiting for application to be ready..."
kubectl wait --for=condition=ready pod -l app=diaspomoney -n $NAMESPACE --timeout=300s

# Vérifier le statut
echo "✅ Infrastructure deployment completed!"
echo ""
echo "📊 Status:"
kubectl get pods -n $NAMESPACE
echo ""
echo "🌐 Services:"
kubectl get services -n $NAMESPACE
echo ""
echo "🔗 Access URLs:"
echo "Application: http://localhost:3000"
echo "MongoDB Express: http://localhost:8081"
echo "Redis Commander: http://localhost:8082"
echo "Kafka UI: http://localhost:8083"
echo ""
echo "🎉 Infrastructure is ready!"
