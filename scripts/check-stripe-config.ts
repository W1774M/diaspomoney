/**
 * Script de diagnostic pour vérifier la configuration Stripe
 * Usage: pnpm tsx scripts/check-stripe-config.ts
 */

/* eslint-disable no-console */
import { isStripeConfigured, getStripeMode, getStripeInstance } from '../lib/stripe-config';

console.log('🔍 Vérification de la configuration Stripe...\n');

// Vérifier la clé secrète
const secretKey = process.env['STRIPE_SECRET_KEY'];
const publishableKey = process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] || process.env['STRIPE_PUBLISHABLE_KEY'];

console.log('📋 Variables d\'environnement:');
console.log(`  STRIPE_SECRET_KEY: ${secretKey ? `${secretKey.substring(0, 10)}...${secretKey.substring(secretKey.length - 4)} (${secretKey.length} caractères)` : '❌ NON DÉFINIE'}`);
console.log(`  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${publishableKey ? `${publishableKey.substring(0, 10)}...${publishableKey.substring(publishableKey.length - 4)} (${publishableKey.length} caractères)` : '❌ NON DÉFINIE'}`);
console.log(`  STRIPE_PUBLISHABLE_KEY: ${process.env['STRIPE_PUBLISHABLE_KEY'] ? '✅ Définie (dépréciée, utiliser NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)' : 'Non définie'}`);

console.log('\n🔐 Validation:');

if (!secretKey) {
  console.log('  ❌ STRIPE_SECRET_KEY n\'est pas définie');
  console.log('  💡 Ajoutez STRIPE_SECRET_KEY=sk_test_... dans votre fichier .env.local');
  process.exit(1);
}

if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
  console.log('  ⚠️  STRIPE_SECRET_KEY n\'a pas le bon format');
  console.log('  💡 La clé doit commencer par sk_test_ (test) ou sk_live_ (production)');
  process.exit(1);
}

const mode = getStripeMode(secretKey);
console.log(`  ✅ STRIPE_SECRET_KEY: Format valide (mode: ${mode})`);

if (!publishableKey) {
  console.log('  ⚠️  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY n\'est pas définie');
  console.log('  💡 Ajoutez NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... dans votre fichier .env.local');
} else if (!publishableKey.startsWith('pk_test_') && !publishableKey.startsWith('pk_live_')) {
  console.log('  ⚠️  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY n\'a pas le bon format');
  console.log('  💡 La clé doit commencer par pk_test_ (test) ou pk_live_ (production)');
} else {
  const publishableMode = publishableKey.startsWith('pk_test_') ? 'test' : 'live';
  if (mode !== publishableMode) {
    console.log(`  ⚠️  Les modes ne correspondent pas: secret=${mode}, publishable=${publishableMode}`);
  } else {
    console.log(`  ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Format valide (mode: ${publishableMode})`);
  }
}

console.log('\n🧪 Test de connexion Stripe:');

try {
  if (!isStripeConfigured()) {
    console.log('  ❌ Stripe n\'est pas configuré');
    process.exit(1);
  }

  const stripe = getStripeInstance();
  console.log('  ✅ Instance Stripe créée avec succès');
  
  // Test simple: récupérer la liste des PaymentIntents (limite 1)
  console.log('  🔄 Test de connexion à l\'API Stripe...');
  await stripe.paymentIntents.list({ limit: 1 });
  console.log('  ✅ Connexion à l\'API Stripe réussie');
  
  console.log('\n✅ Configuration Stripe valide et fonctionnelle!');
} catch (error: any) {
  console.log('  ❌ Erreur lors de la connexion à Stripe:');
  console.log(`     ${error.message}`);
  
  if (error.type === 'StripeAuthenticationError') {
    console.log('\n  💡 La clé secrète Stripe est invalide ou expirée');
    console.log('  💡 Vérifiez votre clé dans le dashboard Stripe: https://dashboard.stripe.com/apikeys');
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    console.log('\n  💡 Problème de connexion réseau');
    console.log('  💡 Vérifiez votre connexion internet');
  } else {
    console.log('\n  💡 Erreur inattendue, vérifiez les logs pour plus de détails');
  }
  
  process.exit(1);
}
/* eslint-enable no-console */

