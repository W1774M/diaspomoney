/**
 * Route API de diagnostic pour vérifier la configuration Stripe
 * GET /api/stripe/check-config — réservée aux admins (expose préfixes de clés)
 */

import { NextResponse } from 'next/server';
import { requireApiRoles } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/error-handler';
import { ROLES } from '@/lib/constants';
import { isStripeConfigured, getStripeMode, getStripeInstance } from '@/lib/stripe-config';

export async function GET() {
  try {
    await requireApiRoles([ROLES.ADMIN, ROLES.SUPERADMIN]);

    // Utiliser les variables d'environnement standard (pas _PROD)
    const secretKey = process.env['STRIPE_SECRET_KEY'];
    const publishableKey = process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'];

    const config = {
      secretKey: {
        defined: !!secretKey,
        format: secretKey ? (secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_')) : false,
        mode: secretKey ? getStripeMode(secretKey) : null,
        prefix: secretKey ? `${secretKey.substring(0, 10)}...` : null,
        length: secretKey?.length || 0,
      },
      publishableKey: {
        defined: !!publishableKey,
        format: publishableKey ? (publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')) : false,
        mode: publishableKey ? (publishableKey.startsWith('pk_test_') ? 'test' : 'live') : null,
        prefix: publishableKey ? `${publishableKey.substring(0, 10)}...` : null,
        length: publishableKey?.length || 0,
        usingNextPublic: !!process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
      },
      configured: isStripeConfigured(),
      modesMatch: secretKey && publishableKey
        ? getStripeMode(secretKey) === (publishableKey.startsWith('pk_test_') ? 'test' : 'live')
        : null,
    };

    // Test de connexion si configuré
    let connectionTest = null;
    if (isStripeConfigured()) {
      try {
        const stripe = getStripeInstance();
        await stripe.paymentIntents.list({ limit: 1 });
        connectionTest = {
          success: true,
          message: "Connexion à l'API Stripe réussie",
        };
      } catch (error: any) {
        connectionTest = {
          success: false,
          message: error.message || 'Erreur de connexion',
          type: error.type || 'Unknown',
        };
      }
    }

    return NextResponse.json({
      success: true,
      config,
      connectionTest,
      recommendations: getRecommendations(config),
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur lors de la vérification',
      },
      { status: 500 },
    );
  }
}

function getRecommendations(config: any): string[] {
  const recommendations: string[] = [];

  if (!config.secretKey.defined) {
    recommendations.push("❌ STRIPE_SECRET_KEY n'est pas définie. Ajoutez-la dans .env.local");
  } else if (!config.secretKey.format) {
    recommendations.push('⚠️ STRIPE_SECRET_KEY n\'a pas le bon format. Doit commencer par sk_test_ ou sk_live_');
  } else if (config.secretKey.mode === 'live') {
    recommendations.push('⚠️ ATTENTION: STRIPE_SECRET_KEY est en mode LIVE (production). Assurez-vous que c\'est intentionnel.');
  } else if (config.secretKey.mode === 'test') {
    recommendations.push('✅ STRIPE_SECRET_KEY est en mode TEST (correct pour le développement)');
  }

  if (!config.publishableKey.defined) {
    recommendations.push('⚠️ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY n\'est pas définie. Ajoutez-la dans .env.local');
  } else if (!config.publishableKey.format) {
    recommendations.push('⚠️ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY n\'a pas le bon format. Doit commencer par pk_test_ ou pk_live_');
  } else if (config.publishableKey.mode === 'live') {
    recommendations.push('⚠️ ATTENTION: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY est en mode LIVE (production). Assurez-vous que c\'est intentionnel.');
  } else if (config.publishableKey.mode === 'test') {
    recommendations.push('✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY est en mode TEST (correct pour le développement)');
  } else if (!config.publishableKey.usingNextPublic) {
    recommendations.push('💡 Utilisez NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY au lieu de STRIPE_PUBLISHABLE_KEY pour Next.js');
  }

  if (config.modesMatch === false) {
    recommendations.push('⚠️ Les modes des clés ne correspondent pas (test vs live)');
  } else if (config.modesMatch === true && config.secretKey.mode === 'test') {
    recommendations.push('✅ Les deux clés sont en mode TEST et correspondent');
  }

  if (config.configured && !recommendations.length) {
    recommendations.push('✅ Configuration Stripe valide !');
  }

  return recommendations;
}
