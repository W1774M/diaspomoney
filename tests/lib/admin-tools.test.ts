import { describe, expect, it } from 'vitest';

import { buildAdminToolLinks } from '@/lib/admin-tools';

const byKey = (env: Record<string, string | undefined>) =>
  Object.fromEntries(buildAdminToolLinks(env).map((tool) => [tool.key, tool]));

describe('buildAdminToolLinks', () => {
  it('construit les URL https à partir des domaines du .env serveur', () => {
    const tools = byKey({
      MONGO_EXPRESS_DOMAIN: 'mongo.diaspomoney.fr',
      PORTAINER_DOMAIN: 'https://portainer.diaspomoney.fr/',
      TRAEFIK_DASHBOARD_DOMAIN: 'traefik.diaspomoney.fr',
      MONITORING_DOMAIN: 'monitoring.diaspomoney.fr',
    });

    expect(tools['mongo-express']?.url).toBe('https://mongo.diaspomoney.fr');
    expect(tools['portainer']?.url).toBe('https://portainer.diaspomoney.fr');
    expect(tools['traefik']?.url).toBe('https://traefik.diaspomoney.fr/dashboard/');
    expect(tools['grafana']?.url).toBe('https://monitoring.diaspomoney.fr/grafana');
    expect(tools['prometheus']?.url).toBe('https://monitoring.diaspomoney.fr/prometheus');
  });

  it('signale la variable manquante au lieu d’inventer une URL', () => {
    const tools = byKey({ PORTAINER_DOMAIN: '  ' });

    expect(tools['mongo-express']?.url).toBeNull();
    expect(tools['mongo-express']?.envVar).toBe('MONGO_EXPRESS_DOMAIN');
    expect(tools['portainer']?.url).toBeNull();
    // Le monitoring a un domaine par défaut (compose.monitoring.yml).
    expect(tools['grafana']?.url).toBe('https://dashboard.diaspomoney.fr/grafana');
  });

  it('accepte une URL forcée par ADMIN_TOOL_<CLÉ>_URL', () => {
    const tools = byKey({ ADMIN_TOOL_MONGO_EXPRESS_URL: 'https://db.example.com/db/diaspomoney' });
    expect(tools['mongo-express']?.url).toBe('https://db.example.com/db/diaspomoney');
  });

  it('pointe Sentry sur les issues du projet et de l’environnement', () => {
    const tools = byKey({
      SENTRY_ORG: 'mon-org',
      SENTRY_DSN: 'https://abc123@o4500000000000000.ingest.us.sentry.io/4511122233344455',
      SENTRY_ENVIRONMENT: 'production',
    });
    expect(tools['sentry']?.url).toBe(
      'https://mon-org.sentry.io/issues/?project=4511122233344455&environment=production',
    );
    expect(tools['sentry']?.url).not.toContain('abc123');

    expect(byKey({ SENTRY_ORG: 'mon-org' })['sentry']?.url).toBe('https://mon-org.sentry.io/issues/');
    expect(byKey({ SENTRY_DSN: 'https://k@o1.ingest.sentry.io/2' })['sentry']?.url).toBeNull();
  });

  it('ouvre Stripe en mode test sauf avec une clé live', () => {
    expect(byKey({ STRIPE_SECRET_KEY: 'sk_test_x' })['stripe']?.url).toContain('/test/');
    expect(byKey({ STRIPE_SECRET_KEY: 'sk_live_x' })['stripe']?.url).toBe('https://dashboard.stripe.com/');
  });

  it('donne accès à coss (Cal.com) et indique sandbox ou live', () => {
    expect(byKey({})['coss']).toMatchObject({
      category: 'services',
      url: 'https://coss.com',
      name: 'coss — Cal.com (non configuré)',
    });
    expect(byKey({ COSS_API_KEY: 'coss_test_x' })['coss']?.name).toBe('coss — Cal.com (sandbox)');
    expect(byKey({ COSS_API_KEY: 'coss_live_x' })['coss']?.name).toBe('coss — Cal.com (live)');
    expect(byKey({ ADMIN_TOOL_COSS_URL: 'https://app.coss.com/scheduling' })['coss']?.url).toBe(
      'https://app.coss.com/scheduling',
    );
  });

  it('ne divulgue aucun secret du .env', () => {
    const serialized = JSON.stringify(
      buildAdminToolLinks({
        MONGO_EXPRESS_DOMAIN: 'mongo.diaspomoney.fr',
        MONGO_EXPRESS_PASSWORD: 'super-secret',
        STRIPE_SECRET_KEY: 'sk_live_secret',
        COSS_API_KEY: 'coss_live_secret',
      }),
    );
    expect(serialized).not.toContain('super-secret');
    expect(serialized).not.toContain('sk_live_secret');
    expect(serialized).not.toContain('coss_live_secret');
  });
});
