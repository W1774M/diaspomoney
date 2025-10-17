#!/usr/bin/env node

/**
 * Script de test pour Resend
 * Usage: node scripts/test-resend.js [email]
 */

const { Resend } = require('resend');
require('dotenv').config();

// Configuration
const resend = new Resend(process.env.RESEND_API_KEY);
const testEmail = process.argv[2] || 'test@diaspomoney.fr';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testResendConnection() {
  log('blue', '🧪 Test de connexion Resend...');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'DiaspoMoney <noreply@diaspomoney.fr>',
      to: testEmail,
      subject: 'Test de connexion Resend - DiaspoMoney',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Test Resend</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 20px; background: #f8fafc; border-radius: 0 0 8px 8px; }
              .success { color: #059669; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🧪 Test Resend</h1>
              </div>
              <div class="content">
                <p class="success">✅ Connexion Resend réussie !</p>
                <p>Ceci est un email de test pour vérifier que Resend fonctionne correctement avec DiaspoMoney.</p>
                <p><strong>Détails du test :</strong></p>
                <ul>
                  <li>Service : Resend</li>
                  <li>Environnement : ${process.env.NODE_ENV || 'development'}</li>
                  <li>Timestamp : ${new Date().toISOString()}</li>
                  <li>Email de test : ${testEmail}</li>
                </ul>
                <p>Si vous recevez cet email, la configuration Resend est correcte !</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Test de connexion Resend - DiaspoMoney
        
        ✅ Connexion Resend réussie !
        
        Ceci est un email de test pour vérifier que Resend fonctionne correctement avec DiaspoMoney.
        
        Détails du test :
        - Service : Resend
        - Environnement : ${process.env.NODE_ENV || 'development'}
        - Timestamp : ${new Date().toISOString()}
        - Email de test : ${testEmail}
        
        Si vous recevez cet email, la configuration Resend est correcte !
      `
    });

    if (error) {
      log('red', `❌ Erreur Resend: ${error.message}`);
      return false;
    }

    log('green', `✅ Email de test envoyé avec succès !`);
    log('cyan', `📧 ID: ${data.id}`);
    log('cyan', `📧 Destinataire: ${testEmail}`);
    return true;
  } catch (error) {
    log('red', `❌ Erreur lors du test: ${error.message}`);
    return false;
  }
}

async function testEmailTemplates() {
  log('blue', '🧪 Test des templates d\'email...');
  
  const templates = [
    {
      name: 'Bienvenue',
      type: 'welcome',
      data: {
        name: 'Test User',
        verificationUrl: 'https://app.diaspomoney.fr/verify?token=test123'
      }
    },
    {
      name: 'Réinitialisation mot de passe',
      type: 'password_reset',
      data: {
        name: 'Test User',
        resetUrl: 'https://app.diaspomoney.fr/reset?token=test123'
      }
    },
    {
      name: 'Confirmation de paiement',
      type: 'payment_confirmation',
      data: {
        name: 'Test User',
        amount: 150,
        currency: 'EUR',
        service: 'Consultation médicale'
      }
    }
  ];

  for (const template of templates) {
    try {
      log('yellow', `📧 Test template: ${template.name}`);
      
      const { data, error } = await resend.emails.send({
        from: 'DiaspoMoney <noreply@diaspomoney.fr>',
        to: testEmail,
        subject: `Test ${template.name} - DiaspoMoney`,
        html: `<p>Test du template ${template.name}</p>`,
        text: `Test du template ${template.name}`
      });

      if (error) {
        log('red', `❌ Erreur template ${template.name}: ${error.message}`);
      } else {
        log('green', `✅ Template ${template.name} testé avec succès`);
      }
    } catch (error) {
      log('red', `❌ Erreur template ${template.name}: ${error.message}`);
    }
  }
}

async function testEmailService() {
  log('blue', '🧪 Test du service email...');
  
  try {
    const response = await fetch('http://localhost:3000/api/email/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'service_test',
        email: testEmail
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      log('green', '✅ Service email testé avec succès');
      log('cyan', `📧 Réponse: ${JSON.stringify(result, null, 2)}`);
    } else {
      log('red', `❌ Erreur service email: ${result.error}`);
    }
  } catch (error) {
    log('red', `❌ Erreur test service email: ${error.message}`);
  }
}

async function main() {
  log('magenta', '🚀 Démarrage des tests Resend...');
  log('cyan', `📧 Email de test: ${testEmail}`);
  log('cyan', `🔑 API Key: ${process.env.RESEND_API_KEY ? 'Configurée' : 'Non configurée'}`);
  
  if (!process.env.RESEND_API_KEY) {
    log('red', '❌ RESEND_API_KEY non configurée dans les variables d\'environnement');
    process.exit(1);
  }

  // Test 1: Connexion Resend
  log('blue', '\n=== Test 1: Connexion Resend ===');
  const connectionTest = await testResendConnection();
  
  if (!connectionTest) {
    log('red', '❌ Test de connexion échoué, arrêt des tests');
    process.exit(1);
  }

  // Test 2: Templates d'email
  log('blue', '\n=== Test 2: Templates d\'email ===');
  await testEmailTemplates();

  // Test 3: Service email (si l'application est démarrée)
  log('blue', '\n=== Test 3: Service email ===');
  await testEmailService();

  log('green', '\n🎉 Tests Resend terminés !');
  log('cyan', '📧 Vérifiez votre boîte email pour confirmer la réception des emails de test');
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  log('red', `❌ Erreur non gérée: ${error.message}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log('red', `❌ Exception non capturée: ${error.message}`);
  process.exit(1);
});

// Exécution
main().catch((error) => {
  log('red', `❌ Erreur principale: ${error.message}`);
  process.exit(1);
});
