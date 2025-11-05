# 📧 Intégration Resend - DiaspoMoney

## 📋 **Vue d'ensemble**

DiaspoMoney utilise **Resend** pour l'envoi d'emails transactionnels. Resend est un service moderne et fiable pour l'envoi d'emails avec une excellente délivrabilité.

## 🔧 **Configuration**

### **Variables d'environnement**

```bash
# Resend API Key
RESEND_API_KEY=re_your-resend-api-key

# Email de configuration
RESEND_FROM_EMAIL=noreply@diaspomoney.fr
RESEND_REPLY_TO=support@diaspomoney.fr
```

### **Environnements**

#### **Développement**
```bash
RESEND_API_KEY=re_your-resend-api-key-dev
```

#### **Recette**
```bash
RESEND_API_KEY=re_your-resend-api-key-rct
```

#### **Production**
```bash
RESEND_API_KEY=re_your-resend-api-key-prod
```

## 📧 **Types d'emails supportés**

### **1. Email de bienvenue**
- **Déclenchement** : Inscription d'un nouvel utilisateur
- **Template** : HTML responsive avec branding DiaspoMoney
- **Actions** : Vérification d'email, activation du compte

### **2. Réinitialisation de mot de passe**
- **Déclenchement** : Demande de réinitialisation
- **Template** : Formulaire sécurisé avec lien temporaire
- **Sécurité** : Lien expire dans 1 heure

### **3. Confirmation de paiement**
- **Déclenchement** : Paiement réussi
- **Template** : Reçu de paiement avec détails
- **Données** : Montant, devise, service, date

### **4. Notifications de rendez-vous**
- **Déclenchement** : Confirmation ou rappel de RDV
- **Template** : Informations du prestataire
- **Types** : Confirmation, rappel, annulation

### **5. Emails personnalisés**
- **Déclenchement** : Notifications métier
- **Template** : HTML personnalisé
- **Usage** : Communications marketing, alertes

## 🚀 **Utilisation**

### **Service Email**

```typescript
import { emailService } from '@/services/email/email.service';

// Email de bienvenue
await emailService.sendWelcomeEmail(
  'user@example.com',
  'John Doe',
  'https://app.diaspomoney.fr/verify?token=abc123'
);

// Réinitialisation de mot de passe
await emailService.sendPasswordResetEmail(
  'user@example.com',
  'John Doe',
  'https://app.diaspomoney.fr/reset?token=xyz789'
);

// Confirmation de paiement
await emailService.sendPaymentConfirmationEmail(
  'user@example.com',
  'John Doe',
  150,
  'EUR',
  'Consultation médicale'
);

// Notification de rendez-vous
await emailService.sendAppointmentNotificationEmail(
  'user@example.com',
  'John Doe',
  'Dr. Smith',
  '2024-01-15',
  '14:00',
  'confirmation'
);
```

### **API Endpoints**

#### **Test d'email**
```bash
POST /api/email/test
Content-Type: application/json

{
  "type": "welcome",
  "email": "test@example.com",
  "data": {
    "name": "Test User",
    "verificationUrl": "https://app.diaspomoney.fr/verify?token=test"
  }
}
```

#### **Statut du service**
```bash
GET /api/email/test
```

### **Queue d'emails**

```typescript
// Ajouter un email à la queue
const emailId = emailService.addToQueue(
  'welcome',
  'user@example.com',
  { name: 'John Doe', verificationUrl: 'https://...' },
  'high'
);

// Traiter la queue
await emailService.processQueue();

// Statistiques de la queue
const stats = emailService.getQueueStats();
```

## 🧪 **Tests**

### **Test de connexion**
```bash
node scripts/test-resend.js test@example.com
```

### **Test via API**
```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "service_test",
    "email": "test@example.com"
  }'
```

### **Test des templates**
```bash
# Test email de bienvenue
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "email": "test@example.com",
    "data": {
      "name": "Test User",
      "verificationUrl": "https://app.diaspomoney.fr/verify?token=test"
    }
  }'
```

## 📊 **Monitoring**

### **Métriques**
- **Taux de délivrabilité** > 99%
- **Temps de traitement** < 2 secondes
- **Taux d'erreur** < 0.1%
- **Queue size** < 100 emails

### **Logs**
```typescript
// Logs automatiques
📧 Envoi email de bienvenue à user@example.com
✅ Email de bienvenue envoyé avec succès
❌ Échec envoi email de bienvenue
```

### **Alertes**
- **Échec d'envoi** → Slack #alerts
- **Queue bloquée** → Slack #alerts
- **Taux d'erreur élevé** → Email + Slack

## 🔒 **Sécurité**

### **Validation des emails**
- ✅ Format email valide
- ✅ Domaine autorisé
- ✅ Rate limiting par utilisateur

### **Protection contre le spam**
- ✅ Templates sécurisés
- ✅ Liens temporaires
- ✅ Validation des données

### **Conformité**
- ✅ RGPD - Consentement explicite
- ✅ CAN-SPAM - Désinscription facile
- ✅ Opt-out automatique

## 🎨 **Templates**

### **Structure HTML**
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>DiaspoMoney</title>
    <style>
      /* Styles responsives */
      body { font-family: Arial, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; }
      .header { background: #2563eb; color: white; }
      .button { background: #2563eb; color: white; padding: 12px 24px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>DiaspoMoney</h1>
      </div>
      <div class="content">
        <!-- Contenu de l'email -->
      </div>
    </div>
  </body>
</html>
```

### **Personnalisation**
- **Couleurs** : Palette DiaspoMoney
- **Logo** : Intégration du branding
- **Responsive** : Mobile-first design
- **Accessibilité** : Support lecteurs d'écran

## 📈 **Performance**

### **Optimisations**
- **Templates pré-compilés** - Pas de compilation à l'envoi
- **Queue asynchrone** - Traitement en arrière-plan
- **Cache des templates** - Réutilisation des templates
- **Batch processing** - Envoi groupé

### **Limites**
- **Rate limiting** : 100 emails/minute
- **Queue size** : 1000 emails maximum
- **Retry logic** : 3 tentatives maximum
- **TTL** : 7 jours pour les emails en queue

## 🛠️ **Maintenance**

### **Nettoyage de la queue**
```typescript
// Nettoyer les emails anciens
emailService.cleanupQueue();
```

### **Statistiques**
```typescript
const stats = emailService.getQueueStats();
console.log(`Queue: ${stats.pending} pending, ${stats.sent} sent, ${stats.failed} failed`);
```

### **Monitoring**
```typescript
// Test de connexion
const isConnected = await emailService.testConnection();

// Statistiques en temps réel
const stats = emailService.getQueueStats();
```

## 🚨 **Dépannage**

### **Problèmes courants**

#### **1. API Key invalide**
```bash
❌ Erreur Resend: Invalid API key
```
**Solution** : Vérifier la variable `RESEND_API_KEY`

#### **2. Email non délivré**
```bash
❌ Échec envoi email de bienvenue
```
**Solution** : Vérifier le format de l'email et la configuration Resend

#### **3. Queue bloquée**
```bash
⏳ Queue déjà en cours de traitement
```
**Solution** : Redémarrer le service ou nettoyer la queue

### **Logs de débogage**
```bash
# Activer les logs détaillés
LOG_LEVEL=debug npm run dev

# Vérifier les logs Resend
tail -f logs/email.log
```

## 📞 **Support**

### **Documentation Resend**
- **Site officiel** : https://resend.com
- **Documentation** : https://resend.com/docs
- **Support** : support@resend.com

### **DiaspoMoney Support**
- **Email** : support@diaspomoney.fr
- **Slack** : #email-support
- **Documentation** : docs.diaspomoney.fr

---

**Version:** 2.0  
**Dernière mise à jour:** $(date)  
**Auteur:** Équipe DiaspoMoney
