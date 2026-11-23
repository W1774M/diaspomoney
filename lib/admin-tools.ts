/**
 * Liens vers les outils d'exploitation affichés aux super admins.
 *
 * Les domaines d'infra viennent du `.env` du serveur (chargé par `env_file` dans
 * docker-compose.yml) : MONGO_EXPRESS_DOMAIN, PORTAINER_DOMAIN, TRAEFIK_DASHBOARD_DOMAIN,
 * MONITORING_DOMAIN. Ils ne sont lus que côté serveur, par /api/admin/tools, et ne
 * partent donc jamais dans le bundle client. Chaque lien peut être forcé avec
 * ADMIN_TOOL_<CLÉ>_URL (ex. ADMIN_TOOL_SENTRY_URL).
 */

export type AdminToolCategory = 'infra' | 'monitoring' | 'services' | 'code';

export interface AdminToolLink {
  key: string;
  name: string;
  description: string;
  category: AdminToolCategory;
  /** null quand la variable d'environnement n'est pas renseignée. */
  url: string | null;
  /** Variable à renseigner quand `url` est null. */
  envVar?: string;
  /** Les identifiants ne sont jamais affichés : on indique seulement où ils se trouvent. */
  credentialsHint?: string;
}

export const ADMIN_TOOL_CATEGORY_LABELS: Record<AdminToolCategory, string> = {
  infra: 'Infrastructure & base de données',
  monitoring: 'Monitoring',
  services: 'Services externes',
  code: 'Code & déploiement',
};

const GITHUB_REPO = 'W1774M/diaspomoney';
const DEFAULT_MONITORING_DOMAIN = 'dashboard.diaspomoney.fr';

type Env = Record<string, string | undefined>;

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Transforme un domaine nu (ou une URL) en URL https. */
function domainUrl(domain: string | undefined, path = ''): string | null {
  const value = clean(domain);
  if (!value) return null;
  const base = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return `${base.replace(/\/+$/, '')}${path}`;
}

function override(env: Env, key: string): string | undefined {
  return clean(env[`ADMIN_TOOL_${key.toUpperCase().replace(/-/g, '_')}_URL`]);
}

export function buildAdminToolLinks(env: Env): AdminToolLink[] {
  const monitoringDomain = clean(env['MONITORING_DOMAIN']) ?? DEFAULT_MONITORING_DOMAIN;
  const stripeKey = clean(env['STRIPE_SECRET_KEY']) ?? '';
  const stripeIsLive = stripeKey.startsWith('sk_live') || stripeKey.startsWith('rk_live');

  const links: AdminToolLink[] = [
    {
      key: 'mongo-express',
      name: 'Base de données (Mongo Express)',
      description: 'Parcourir et modifier les collections MongoDB (dev, rct et prod).',
      category: 'infra',
      url: domainUrl(env['MONGO_EXPRESS_DOMAIN']),
      envVar: 'MONGO_EXPRESS_DOMAIN',
      credentialsHint: 'MONGO_EXPRESS_USERNAME / MONGO_EXPRESS_PASSWORD du .env serveur',
    },
    {
      key: 'portainer',
      name: 'Portainer',
      description: 'Conteneurs Docker : état, logs, redémarrage, volumes.',
      category: 'infra',
      url: domainUrl(env['PORTAINER_DOMAIN']),
      envVar: 'PORTAINER_DOMAIN',
    },
    {
      key: 'traefik',
      name: 'Traefik',
      description: 'Routes HTTP, certificats TLS et services exposés.',
      category: 'infra',
      url: domainUrl(env['TRAEFIK_DASHBOARD_DOMAIN'], '/dashboard/'),
      envVar: 'TRAEFIK_DASHBOARD_DOMAIN',
      credentialsHint: 'TRAEFIK_DASHBOARD_AUTH du .env serveur',
    },
    {
      key: 'grafana',
      name: 'Grafana',
      description: 'Tableaux de bord de monitoring (stack compose.monitoring.yml).',
      category: 'monitoring',
      url: domainUrl(monitoringDomain, '/grafana'),
      credentialsHint: 'admin / GRAFANA_PASSWORD du .env serveur',
    },
    {
      key: 'prometheus',
      name: 'Prometheus',
      description: 'Requêtes sur les métriques collectées.',
      category: 'monitoring',
      url: domainUrl(monitoringDomain, '/prometheus'),
    },
    {
      key: 'metrics',
      name: 'Métriques de l’application',
      description: 'Export Prometheus brut de cette instance (/api/monitoring/metrics).',
      category: 'monitoring',
      url: '/api/monitoring/metrics',
    },
    {
      key: 'health',
      name: 'Health check',
      description: 'État JSON de l’instance : base, Redis, alertes (/api/health).',
      category: 'monitoring',
      url: '/api/health',
    },
    {
      key: 'sentry',
      name: 'Sentry',
      description: 'Erreurs et performances en production.',
      category: 'services',
      url: 'https://sentry.io/issues/',
    },
    {
      key: 'stripe',
      name: stripeIsLive ? 'Stripe (live)' : 'Stripe (mode test)',
      description: 'Paiements, remboursements, webhooks.',
      category: 'services',
      url: stripeIsLive ? 'https://dashboard.stripe.com/' : 'https://dashboard.stripe.com/test/',
    },
    {
      key: 'resend',
      name: 'Resend',
      description: 'E-mails transactionnels envoyés et leur statut de délivrance.',
      category: 'services',
      url: 'https://resend.com/emails',
    },
    {
      key: 'github',
      name: 'GitHub',
      description: 'Code source, pull requests et issues.',
      category: 'code',
      url: `https://github.com/${GITHUB_REPO}`,
    },
    {
      key: 'circleci',
      name: 'CircleCI',
      description: 'Pipelines, déploiements dev / rct / prod et rollbacks.',
      category: 'code',
      url: `https://app.circleci.com/pipelines/github/${GITHUB_REPO}`,
    },
  ];

  return links.map((link) => {
    const forced = override(env, link.key);
    return forced ? { ...link, url: forced } : link;
  });
}
