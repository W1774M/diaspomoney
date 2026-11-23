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

  it('ouvre Stripe en mode test sauf avec une clé live', () => {
    expect(byKey({ STRIPE_SECRET_KEY: 'sk_test_x' })['stripe']?.url).toContain('/test/');
    expect(byKey({ STRIPE_SECRET_KEY: 'sk_live_x' })['stripe']?.url).toBe('https://dashboard.stripe.com/');
  });

  it('ne divulgue aucun secret du .env', () => {
    const serialized = JSON.stringify(
      buildAdminToolLinks({
        MONGO_EXPRESS_DOMAIN: 'mongo.diaspomoney.fr',
        MONGO_EXPRESS_PASSWORD: 'super-secret',
        STRIPE_SECRET_KEY: 'sk_live_secret',
      }),
    );
    expect(serialized).not.toContain('super-secret');
    expect(serialized).not.toContain('sk_live_secret');
  });
});
