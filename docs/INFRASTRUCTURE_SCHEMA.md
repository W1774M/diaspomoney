# 🏗️ Schéma de l'Infrastructure DiaspoMoney

## 📋 **Vue d'ensemble**

DiaspoMoney utilise une architecture microservices déployée sur Kubernetes avec trois environnements distincts :

- **🔧 DEV** : `dev.diaspomoney.fr` - Développement
- **🧪 RCT** : `rct.diaspomoney.fr` - Recette  
- **🚀 PROD** : `app.diaspomoney.fr` - Production

## 🌐 **Architecture Multi-Environnement**

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET                                │
└─────────────────────┬─────────────────────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────────────────┐
│                    TRAEFIK                                  │
│              (Reverse Proxy + Load Balancer)               │
└─────────────────────┬─────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌───▼──────┐ ┌────▼─────┐
│   DEV ENV    │ │ RCT ENV  │ │ PROD ENV │
│dev.diaspomoney│ │rct.diaspomoney│ │app.diaspomoney│
│     .fr      │ │    .fr   │ │    .fr   │
└──────────────┘ └──────────┘ └──────────┘
```

## 🏗️ **Architecture par Environnement**

### **Environnement de Développement (DEV)**
```
┌─────────────────────────────────────────────────────────────┐
│                    DEV ENVIRONMENT                         │
│                   dev.diaspomoney.fr                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 NAMESPACE: diaspomoney-dev                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Next.js App   │  │   Monitoring    │  │   Ingress   │ │
│  │   (3 replicas)  │  │   (Prometheus)  │  │   (Traefik) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              NAMESPACE: diaspomoney-dev-infra              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   MongoDB   │  │    Redis    │  │       Kafka         │ │
│  │  (Primary)  │  │  (Cluster)  │  │     (3 Brokers)     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Environnement de Recette (RCT)**
```
┌─────────────────────────────────────────────────────────────┐
│                   RCT ENVIRONMENT                         │
│                   rct.diaspomoney.fr                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 NAMESPACE: diaspomoney-rct                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Next.js App   │  │   Monitoring    │  │   Ingress   │ │
│  │   (3 replicas)  │  │   (Prometheus)  │  │   (Traefik) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              NAMESPACE: diaspomoney-rct-infra              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   MongoDB   │  │    Redis    │  │       Kafka         │ │
│  │  (Primary)  │  │  (Cluster)  │  │     (3 Brokers)     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Environnement de Production (PROD)**
```
┌─────────────────────────────────────────────────────────────┐
│                  PROD ENVIRONMENT                          │
│                   app.diaspomoney.fr                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                NAMESPACE: diaspomoney-prod                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Next.js App   │  │   Monitoring    │  │   Ingress   │ │
│  │   (5 replicas)  │  │   (Prometheus)  │  │   (Traefik) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│             NAMESPACE: diaspomoney-prod-infra               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   MongoDB   │  │    Redis    │  │       Kafka         │ │
│  │  (Replica)  │  │  (Cluster)  │  │     (5 Brokers)     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 **Composants Techniques**

### **1. Application Layer**
- **Next.js/React** - Application frontend/backend
- **Docker** - Containerisation
- **Kubernetes** - Orchestration
- **HPA** - Auto-scaling horizontal

### **2. Infrastructure Layer**
- **MongoDB** - Base de données principale
- **Redis Cluster** - Cache distribué
- **Kafka** - Event streaming
- **MongoDB Atlas Search** - Recherche avancée

### **3. Monitoring Layer**
- **Prometheus** - Métriques
- **Grafana** - Dashboards
- **Alertmanager** - Alertes
- **Sentry** - Error tracking

### **4. Security Layer**
- **Traefik** - Reverse proxy + SSL
- **Let's Encrypt** - Certificats SSL
- **Field Encryption** - Chiffrement des données
- **GDPR Compliance** - Conformité RGPD
- **PCI-DSS** - Conformité paiements

### **5. CI/CD Layer**
- **GitHub Actions** - Pipeline CI/CD
- **Docker Registry** - Registry d'images
- **Kubernetes** - Déploiement automatisé
- **Smoke Tests** - Tests de santé

## 🚀 **Flux de Déploiement**

### **Développement (DEV)**
```
Push sur branch 'develop' → GitHub Actions → Build → Deploy → dev.diaspomoney.fr
```

### **Recette (RCT)**
```
Push sur branch 'rct' → GitHub Actions → Build → Deploy → rct.diaspomoney.fr
```

### **Production (PROD)**
```
Push sur branch 'main' → GitHub Actions → Build → Deploy → app.diaspomoney.fr
```

## 📊 **Métriques et Monitoring**

### **Métriques Application**
- **Response Time** < 200ms (95th percentile)
- **Throughput** > 1000 req/s
- **Error Rate** < 0.1%
- **Uptime** > 99.9%

### **Métriques Infrastructure**
- **CPU Usage** < 70%
- **Memory Usage** < 80%
- **Disk Usage** < 85%
- **Network Latency** < 50ms

### **Alertes Configurées**
- **Critical** → Email + Slack + PagerDuty
- **Warning** → Email + Slack
- **Security** → Équipe sécurité
- **Payment** → Équipe paiements

## 🔒 **Sécurité**

### **Chiffrement**
- **TLS 1.3** - Transport
- **AES-256-GCM** - Données au repos
- **Field-Level Encryption** - Champs sensibles

### **Conformité**
- **GDPR** - Protection des données
- **PCI-DSS** - Sécurité des paiements
- **SOC 2** - Contrôles de sécurité

### **Audit**
- **Audit Logging** - Traçabilité complète
- **Anomaly Detection** - Détection d'anomalies
- **Compliance Reports** - Rapports de conformité

## 🌍 **URLs et Accès**

### **Environnements**
- **DEV** : https://dev.diaspomoney.fr
- **RCT** : https://rct.diaspomoney.fr
- **PROD** : https://app.diaspomoney.fr

### **Monitoring**
- **Prometheus** : https://prometheus.diaspomoney.fr
- **Grafana** : https://grafana.diaspomoney.fr
- **Alertmanager** : https://alertmanager.diaspomoney.fr

### **APIs**
- **Health Check** : `/api/health`
- **Metrics** : `/api/monitoring/metrics`
- **Auth** : `/api/auth/*`
- **Users** : `/api/users/*`
- **Transactions** : `/api/transactions/*`
- **Payments** : `/api/payments/*`

## 📈 **Scalabilité**

### **Auto-scaling**
- **HPA** - Scaling horizontal automatique
- **VPA** - Scaling vertical automatique
- **Cluster Autoscaler** - Scaling du cluster

### **Performance**
- **CDN** - Cloudflare pour les assets
- **Redis** - Cache distribué
- **MongoDB** - Sharding et réplication
- **Kafka** - Partitioning et réplication

## 🛠️ **Maintenance**

### **Backup**
- **MongoDB** - Backup quotidien
- **Redis** - Persistence AOF
- **Kafka** - Retention des messages

### **Updates**
- **Rolling Updates** - Mise à jour sans interruption
- **Blue-Green** - Déploiement sans risque
- **Canary** - Déploiement progressif

---

**Version:** 2.0  
**Dernière mise à jour:** $(date)  
**Auteur:** Équipe DiaspoMoney
