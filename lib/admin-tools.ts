/**
 * Liens vers les outils d'exploitation affichés aux super admins.
 *
 * Les domaines d'infra viennent du `.env` du serveur (chargé par `env_file` dans
 * docker-compose.yml) : MONGO_EXPRESS_DOMAIN, PORTAINER_DOMAIN, TRAEFIK_DASHBOARD_DOMAIN,
 * MONITORING_DOMAIN, SENTRY_ORG (+ SENTRY_DSN pour l'ID du projet). Les préfixes de
 * STRIPE_SECRET_KEY et COSS_API_KEY distinguent test et live. Ils ne sont lus que côté serveur, par /api/admin/tools, et ne
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

/**
 * Issues Sentry du projet, filtrées sur l'environnement de l'instance.
 * L'organisation vient de SENTRY_ORG ; l'ID du projet est le dernier segment du DSN
 * (https://<clé>@o<id>.ingest.sentry.io/<projectId>).
 */
function sentryUrl(env: Env): string | null {
  const org = clean(env['SENTRY_ORG']);
  if (!org) return null;

  const params = new URLSearchParams();
  const dsn = clean(env['SENTRY_DSN']);
  const projectId = dsn?.match(/\/(\d+)\/?$/)?.[1];
  if (projectId) params.set('project', projectId);
  const environment = clean(env['SENTRY_ENVIRONMENT']);
  if (environment) params.set('environment', environment);

  const query = params.toString();
  return `https://${encodeURIComponent(org)}.sentry.io/issues/${query ? `?${query}` : ''}`;
}

/** Le SDK ne documente pas d'URL de tableau de bord : ADMIN_TOOL_COSS_URL la précise. */
const COSS_DASHBOARD_URL = 'https://coss.com';

/**
 * coss en sandbox (clé coss_test_, dev et rct) ou en live (prod, où docker-compose.yml
 * substitue COSS_API_KEY_PROD à COSS_API_KEY). Seul le préfixe de la clé est lu.
 */
function cossName(env: Env): string {
  const key = clean(env['COSS_API_KEY']);
  if (!key) return 'coss — Cal.com (non configuré)';
  return key.startsWith('coss_test_') ? 'coss — Cal.com (sandbox)' : 'coss — Cal.com (live)';
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
      description: 'Erreurs et performances, filtrées sur l’environnement de cette instance.',
      category: 'services',
      url: sentryUrl(env),
      envVar: 'SENTRY_ORG',
    },
    {
      key: 'stripe',
      name: stripeIsLive ? 'Stripe (live)' : 'Stripe (mode test)',
      description: 'Paiements, remboursements, webhooks.',
      category: 'services',
      url: stripeIsLive ? 'https://dashboard.stripe.com/' : 'https://dashboard.stripe.com/test/',
    },
    {
      key: 'coss',
      name: cossName(env),
      description:
        'Plannings des prestataires et créneaux santé (API coss, équivalent de Cal.com).',
      category: 'services',
      url: COSS_DASHBOARD_URL,
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
