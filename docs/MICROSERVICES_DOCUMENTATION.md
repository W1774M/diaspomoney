# DiaspoMoney - Documentation des Microservices

## 📋 **Vue d'ensemble**

DiaspoMoney est une plateforme B2B2C internationale pour les résidents européens qui souhaitent payer des services en Afrique. L'architecture est basée sur des microservices pour assurer la scalabilité, la maintenabilité et la fiabilité.

## 🏗️ **Architecture des Microservices**

### **Services Core**

#### 1. **Auth Service** - Service d'authentification
- **Fichier**: `services/auth/auth.service.ts`
- **Responsabilités**:
  - Authentification JWT
  - Gestion des sessions
  - 2FA/MFA
  - Gestion des tokens de rafraîchissement
  - Détection d'anomalies

```typescript
// Exemple d'utilisation
const authService = new AuthService();
const result = await authService.login(email, password);
```

#### 2. **User Service** - Service de gestion des utilisateurs
- **Fichier**: `services/user/user.service.ts`
- **Responsabilités**:
  - Gestion des profils utilisateurs
  - Gestion des bénéficiaires
  - KYC/AML
  - Conformité GDPR
  - Validation des données

```typescript
// Exemple d'utilisation
const userService = new UserService();
const user = await userService.getUserById(userId);
```

#### 3. **Transaction Service** - Service de transactions
- **Fichier**: `services/transaction/transaction.service.ts`
- **Responsabilités**:
  - Orchestration des transactions
  - Multi-devises
  - Calcul des frais
  - Remboursements
  - Suivi des statuts

```typescript
// Exemple d'utilisation
const transactionService = new TransactionService();
const transaction = await transactionService.createTransaction(data);
```

#### 4. **Payment Service** - Service de paiement
- **Fichier**: `services/payment/payment.service.ts`
- **Responsabilités**:
  - Intégration Stripe
  - Payment Intents
  - Webhooks
  - Remboursements
  - Multi-providers

```typescript
// Exemple d'utilisation
const paymentService = new PaymentService();
const payment = await paymentService.processPayment(amount, currency);
```

#### 5. **Notification Service** - Service de notifications
- **Fichier**: `services/notification/notification.service.ts`
- **Responsabilités**:
  - Notifications multi-canaux
  - Templates localisés
  - Planification
  - Suivi de livraison
  - Notifications métier

```typescript
// Exemple d'utilisation
const notificationService = new NotificationService();
await notificationService.sendWelcomeNotification(email, name);
```

### **Services Verticaux**

#### 6. **Health Service** - Service de santé
- **Fichier**: `services/health/health.service.ts`
- **Responsabilités**:
  - Recherche de prestataires
  - Prise de rendez-vous
  - Téléconsultation
  - Gestion des ordonnances
  - Disponibilité temps réel

```typescript
// Exemple d'utilisation
const healthService = new HealthService();
const providers = await healthService.searchProviders(filters);
```

#### 7. **BTP Service** - Service BTP
- **Fichier**: `services/btp/btp.service.ts`
- **Responsabilités**:
  - Recherche de propriétés
  - Gestion des entrepreneurs
  - Catalogue de matériaux
  - Projets de construction
  - Calcul de coûts

```typescript
// Exemple d'utilisation
const btpService = new BTPService();
const properties = await btpService.searchProperties(filters);
```

#### 8. **Education Service** - Service d'éducation
- **Fichier**: `services/education/education.service.ts`
- **Responsabilités**:
  - Recherche d'écoles
  - Inscription d'étudiants
  - Paiement des frais
  - Gestion des notes
  - Bulletins de notes

```typescript
// Exemple d'utilisation
const educationService = new EducationService();
const schools = await educationService.searchSchools(filters);
```

## 🔧 **Configuration et Déploiement**

### **Variables d'environnement**

```bash
# Base de données
MONGODB_URI=mongodb://admin:password@mongodb-primary:27017/diaspomoney
REDIS_URL=redis://redis-cluster:6379

# Sécurité
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_MASTER_KEY=your-encryption-master-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
PROMETHEUS_ENDPOINT=http://prometheus:9090

# Services externes
STRIPE_SECRET_KEY=sk_test_...
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
```

### **Déploiement Kubernetes**

```bash
# Déployer l'infrastructure
./scripts/deploy-infrastructure.sh

# Déployer le monitoring
./scripts/deploy-monitoring.sh

# Déployer l'application complète
./scripts/deploy-complete.sh
```

## 📊 **Monitoring et Observabilité**

### **Métriques Prometheus**

- `http_requests_total` - Nombre total de requêtes HTTP
- `http_request_duration_seconds` - Durée des requêtes HTTP
- `transactions_total` - Nombre total de transactions
- `auth_logins_failed` - Tentatives de connexion échouées
- `security_events_total` - Événements de sécurité

### **Dashboards Grafana**

1. **DiaspoMoney Overview** - Vue d'ensemble de l'application
2. **Database Monitoring** - Monitoring MongoDB et Redis
3. **Security Dashboard** - Surveillance de la sécurité
4. **Transaction Analytics** - Analytics des transactions
5. **Notification Tracking** - Suivi des notifications

### **Alertes**

- **Critical** → Email + Slack + PagerDuty
- **Warning** → Email + Slack
- **Security** → Équipe sécurité
- **Payment** → Équipe paiements

## 🔒 **Sécurité**

### **Chiffrement au niveau des champs**

```typescript
import { fieldEncryption } from '@/lib/security/field-encryption';

// Chiffrer des données sensibles
const encryptedData = fieldEncryption.encrypt('cardNumber', '4111111111111111', userId);
```

### **Conformité GDPR**

```typescript
import { gdprCompliance } from '@/lib/security/gdpr-compliance';

// Enregistrer un consentement
await gdprCompliance.recordConsent(userId, 'marketing', ['email'], 'CONSENT');
```

### **Conformité PCI-DSS**

```typescript
import { pciDSSCompliance } from '@/lib/security/pci-dss-compliance';

// Chiffrer les données de carte
const encryptedCard = await pciDSSCompliance.encryptCardData(cardData, userId);
```

### **Audit Logging**

```typescript
import { auditLogging } from '@/lib/security/audit-logging';

// Enregistrer un événement d'audit
await auditLogging.log('USER_LOGIN', 'AUTH_SYSTEM', { ipAddress, userAgent });
```

## 🧪 **Tests**

### **Tests unitaires**

```bash
npm run test:unit
```

### **Tests d'intégration**

```bash
npm run test:integration
```

### **Tests de performance**

```bash
npm run test:performance
```

### **Tests de sécurité**

```bash
npm run test:security
```

## 📈 **Performance**

### **Optimisations**

1. **CDN** - Cloudflare pour les assets statiques
2. **Cache Redis** - Cache distribué pour les données
3. **MongoDB Atlas Search** - Recherche optimisée
4. **Image Optimization** - Images WebP/AVIF
5. **Code Splitting** - Chargement à la demande

### **Métriques de performance**

- **Response Time** < 200ms (95th percentile)
- **Throughput** > 1000 req/s
- **Error Rate** < 0.1%
- **Uptime** > 99.9%

## 🚀 **CI/CD**

### **GitHub Actions**

- **Tests automatisés** sur chaque PR
- **Build Docker** avec multi-arch
- **Déploiement automatique** staging/production
- **Tests de sécurité** avec Trivy
- **Rollback automatique** en cas d'échec

### **Pipeline de déploiement**

1. **Test** → Tests unitaires, intégration, sécurité
2. **Build** → Construction de l'image Docker
3. **Deploy Staging** → Déploiement en staging
4. **Deploy Production** → Déploiement en production
5. **Monitor** → Surveillance et alertes

## 📚 **API Documentation**

### **Endpoints principaux**

```typescript
// Authentification
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout

// Utilisateurs
GET /api/users/:id
PUT /api/users/:id
DELETE /api/users/:id

// Transactions
GET /api/transactions
POST /api/transactions
GET /api/transactions/:id

// Paiements
POST /api/payments/process
POST /api/payments/refund
GET /api/payments/:id

// Notifications
POST /api/notifications/send
GET /api/notifications/:id
```

## 🔍 **Dépannage**

### **Logs**

```bash
# Logs de l'application
kubectl logs -f deployment/diaspomoney-app -n diaspomoney

# Logs de MongoDB
kubectl logs -f deployment/mongodb-primary -n diaspomoney

# Logs de Redis
kubectl logs -f deployment/redis-cluster -n diaspomoney
```

### **Métriques**

```bash
# Métriques Prometheus
curl http://prometheus:9090/api/v1/query?query=up

# Santé de l'application
curl http://diaspomoney-app:3000/api/health
```

### **Base de données**

```bash
# Connexion MongoDB
kubectl exec -it mongodb-primary -n diaspomoney -- mongosh

# Connexion Redis
kubectl exec -it redis-cluster-0 -n diaspomoney -- redis-cli
```

## 📞 **Support**

- **Documentation**: [docs.diaspomoney.fr](https://docs.diaspomoney.fr)
- **Support**: support@diaspomoney.fr
- **Sécurité**: security@diaspomoney.fr
- **Slack**: #diaspomoney-support

---

**Version**: 1.0.0  
**Dernière mise à jour**: $(date)  
**Auteur**: Équipe DiaspoMoney
