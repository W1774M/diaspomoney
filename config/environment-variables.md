# 🔐 Variables d'Environnement - DiaspoMoney

## 📋 **VARIABLES D'ENVIRONNEMENT REQUISES**

### **1. 🌍 ENVIRONNEMENT**

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### **2. 🗄️ BASE DE DONNÉES**

```bash
MONGODB_URI=mongodb://localhost:27017/diaspomoney
MONGODB_DB_NAME=diaspomoney
```

### **3. 🔴 REDIS**

```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
```

### **4. 🔐 AUTHENTIFICATION**

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here
JWT_SECRET=your-jwt-secret-key-here
SESSION_SECRET=your-session-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

### **5. 🛡️ SÉCURITÉ**

```bash
ENCRYPTION_KEY=your-encryption-master-key-here
CORS_ORIGIN=http://localhost:3000
```

### **6. 💳 STRIPE (PAIEMENTS)**

```bash
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key-here
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret-here
```

### **7. 📧 RESEND (EMAILS)**

```bash
RESEND_API_KEY=re_your-resend-api-key-here
RESEND_FROM_EMAIL=noreply@diaspomoney.fr
RESEND_REPLY_TO=support@diaspomoney.fr
```

### **8. 🖼️ CLOUDINARY (IMAGES)**

```bash
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### **9. 📊 SENTRY (MONITORING)**

```bash
SENTRY_DSN=your-sentry-dsn-here
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### **10. 📈 PROMETHEUS (MONITORING)**

```bash
PROMETHEUS_ENDPOINT=http://localhost:9090
PROMETHEUS_USERNAME=admin
PROMETHEUS_PASSWORD=admin
```

### **11. 📊 GRAFANA (MONITORING)**

```bash
GRAFANA_URL=http://localhost:3001
GRAFANA_USERNAME=admin
GRAFANA_PASSWORD=admin
```

### **12. 📝 LOKI (LOGS)**

```bash
LOKI_URL=http://localhost:3100
LOKI_USERNAME=admin
LOKI_PASSWORD=admin
```

### **13. 📨 KAFKA (MESSAGING)**

```bash
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=diaspomoney
KAFKA_GROUP_ID=diaspomoney-group
```

### **14. 🔄 TRAEFIK (REVERSE PROXY)**

```bash
TRAEFIK_DASHBOARD_URL=http://localhost:8080
TRAEFIK_USERNAME=admin
TRAEFIK_PASSWORD=admin
```

### **15. ☸️ KUBERNETES (ORCHESTRATION)**

```bash
KUBE_CONFIG_DEV=your-kube-config-dev-base64-here
KUBE_CONFIG_RCT=your-kube-config-rct-base64-here
KUBE_CONFIG_PROD=your-kube-config-prod-base64-here
```

### **16. 🚀 GITHUB ACTIONS (CI/CD)**

```bash
GITHUB_TOKEN=your-github-token-here
GITHUB_REPOSITORY=your-username/diaspomoney
```

### **17. 💬 SLACK (NOTIFICATIONS)**

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your-slack-webhook
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL=#deployments
```

### **18. 📧 EMAIL SMTP (FALLBACK)**

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=DiaspoMoney <noreply@diaspomoney.fr>
```

### **19. 📱 TWILIO (SMS)**

```bash
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### **20. 💬 WHATSAPP BUSINESS API**

```bash
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-verify-token
```

### **21. 🗺️ GOOGLE MAPS API**

```bash
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_MAPS_CLIENT_ID=your-google-maps-client-id
```

### **22. 🤖 OPENAI (IA)**

```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_ORG_ID=your-openai-org-id
```

### **23. ⚡ RATE LIMITING**

```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
```

### **24. 💾 CACHE**

```bash
CACHE_TTL=3600000
CACHE_MAX_SIZE=1000
CACHE_UPDATE_INTERVAL=300000
```

### **25. 📝 LOGS**

```bash
LOG_LEVEL=debug
LOG_FORMAT=json
LOG_FILE_PATH=./logs/app.log
```

### **26. 💾 BACKUP**

```bash
BACKUP_S3_BUCKET=your-backup-bucket
BACKUP_S3_REGION=eu-west-1
BACKUP_S3_ACCESS_KEY=your-s3-access-key
BACKUP_S3_SECRET_KEY=your-s3-secret-key
```

### **27. 📊 ANALYTICS**

```bash
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
MIXPANEL_TOKEN=your-mixpanel-token
HOTJAR_ID=your-hotjar-id
```

### **28. 🚩 FEATURE FLAGS**

```bash
FEATURE_EMAIL_NOTIFICATIONS=true
FEATURE_SMS_NOTIFICATIONS=false
FEATURE_WHATSAPP_NOTIFICATIONS=false
FEATURE_AI_ASSISTANT=false
FEATURE_ANALYTICS=true
```

### **29. 🔑 API KEYS EXTERNES**

```bash
# Géolocalisation
NOMINATIM_API_URL=https://nominatim.openstreetmap.org
# Devises
EXCHANGE_RATE_API_KEY=your-exchange-rate-api-key
# SMS
SMS_API_KEY=your-sms-api-key
# Push Notifications
FIREBASE_SERVER_KEY=your-firebase-server-key
FIREBASE_PROJECT_ID=your-firebase-project-id
```

### **30. 🛡️ SÉCURITÉ AVANCÉE**

```bash
# WAF
WAF_ENABLED=false
WAF_RULES_PATH=./config/waf-rules.json
# DDoS Protection
DDOS_ENABLED=false
DDOS_MAX_REQUESTS=100
DDOS_WINDOW_MS=60000
# Bot Protection
BOT_PROTECTION_ENABLED=false
BOT_PROTECTION_SECRET=your-bot-protection-secret
```

### **31. 🚀 PERFORMANCE**

```bash
# CDN
CDN_URL=https://cdn.diaspomoney.fr
CDN_API_KEY=your-cdn-api-key
# Compression
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=6
# Image Optimization
IMAGE_OPTIMIZATION_ENABLED=true
IMAGE_QUALITY=80
IMAGE_FORMAT=webp
```

### **32. 🛠️ DÉVELOPPEMENT**

```bash
# Hot Reload
HOT_RELOAD=true
# Debug
DEBUG_MODE=true
DEBUG_SQL=false
DEBUG_REDIS=false
# Testing
TEST_DATABASE_URL=mongodb://localhost:27017/diaspomoney_test
TEST_REDIS_URL=redis://localhost:6379/1
```

### **33. 🌐 PRODUCTION**

```bash
# SSL
SSL_CERT_PATH=/etc/ssl/certs/diaspomoney.crt
SSL_KEY_PATH=/etc/ssl/private/diaspomoney.key
# Domain
DOMAIN=diaspomoney.fr
# Subdomains
DEV_DOMAIN=dev.diaspomoney.fr
RCT_DOMAIN=rct.diaspomoney.fr
PROD_DOMAIN=app.diaspomoney.fr
```

## 🔧 **CONFIGURATION PAR ENVIRONNEMENT**

### **Développement**

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/diaspomoney_dev
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
```

### **Recette**

```bash
NODE_ENV=recette
NEXT_PUBLIC_APP_URL=https://rct.diaspomoney.fr
MONGODB_URI=mongodb://localhost:27017/diaspomoney_rct
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

### **Production**

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.diaspomoney.fr
MONGODB_URI=mongodb://localhost:27017/diaspomoney_prod
REDIS_URL=redis://localhost:6379
LOG_LEVEL=error
```

## 🚨 **SÉCURITÉ**

### **Variables Sensibles**

- ✅ **Jamais commiter** les vraies valeurs
- ✅ **Utiliser des secrets** pour les API keys
- ✅ **Rotation régulière** des clés
- ✅ **Chiffrement** des données sensibles

### **Bonnes Pratiques**

- ✅ **Validation** des variables d'environnement
- ✅ **Valeurs par défaut** sécurisées
- ✅ **Documentation** des variables
- ✅ **Tests** de configuration

## 📝 **UTILISATION**

### **1. Créer le fichier .env**

```bash
cp .env.example .env
```

### **2. Remplir les valeurs**

```bash
# Éditer le fichier .env avec vos vraies valeurs
nano .env
```

### **3. Vérifier la configuration**

```bash
npm run type-check
```

### **4. Tester l'application**

```bash
npm run dev
```

---

**Version:** 2.0  
**Dernière mise à jour:** $(date)  
**Auteur:** Équipe DiaspoMoney
