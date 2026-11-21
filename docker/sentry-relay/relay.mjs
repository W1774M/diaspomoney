/* global Buffer */
/**
 * Relais Sentry → validation des déploiements CircleCI (logique pure, testée).
 *
 * Sentry n'accepte pas d'en-tête Authorization sur ses webhooks : ce relais reçoit le
 * webhook Sentry (signé HMAC-SHA256 avec le Client Secret de l'intégration interne),
 * le traduit au format « custom » de CircleCI et le renvoie avec le secret CircleCI.
 *
 * Format envoyé à CircleCI (chemins lus par le provider custom, sans data_points) :
 *   { "signal_name": "sentry-errors", "status": "firing" | "resolved",
 *     "tags": { "component_name": "diaspomoney", "env": "<environnement Sentry>" } }
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Doit être identique à validation.webhooks[].name dans .circleci/config.yml et deploy.yml. */
export const SIGNAL_NAME = 'sentry-errors';
/** Doit être identique à --component-name des marqueurs de déploiement. */
export const COMPONENT_NAME = 'diaspomoney';
/** Environnements Sentry acceptés : mêmes chaînes que --environment-name des marqueurs. */
export const ENVIRONMENTS = new Set(['development', 'staging', 'production']);

/** Vérifie l'en-tête Sentry-Hook-Signature (HMAC-SHA256 hexadécimal du corps brut). */
export function isValidSignature(rawBody, signature, clientSecret) {
  if (!clientSecret || typeof signature !== 'string' || !/^[0-9a-f]{64}$/i.test(signature)) {
    return false;
  }
  const expected = createHmac('sha256', clientSecret).update(rawBody).digest();
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** Environnement d'une alerte d'issue : data.event.environment, sinon le tag « environment ». */
function issueEnvironment(event) {
  if (typeof event?.environment === 'string') return event.environment;
  const tags = Array.isArray(event?.tags) ? event.tags : [];
  const tag = tags.find((pair) => Array.isArray(pair) && pair[0] === 'environment');
  return tag ? tag[1] : undefined;
}

/**
 * Traduit un webhook Sentry en événement de validation CircleCI.
 * Renvoie null quand il n'y a rien à transmettre (ressource ignorée, environnement inconnu).
 *
 * @param {string} resource valeur de l'en-tête Sentry-Hook-Resource
 * @param {any} payload corps JSON du webhook
 */
export function toValidationEvent(resource, payload) {
  let status;
  let env;

  if (resource === 'metric_alert') {
    // action : critical | warning | resolved
    if (payload?.action === 'resolved') status = 'resolved';
    else if (payload?.action === 'critical' || payload?.action === 'warning') status = 'firing';
    env = payload?.data?.metric_alert?.alert_rule?.environment;
  } else if (resource === 'event_alert') {
    // Alerte d'issue : action toujours « triggered ».
    if (payload?.action === 'triggered') status = 'firing';
    env = issueEnvironment(payload?.data?.event);
  }

  if (!status || typeof env !== 'string' || !ENVIRONMENTS.has(env)) return null;

  return {
    signal_name: SIGNAL_NAME,
    status,
    tags: { component_name: COMPONENT_NAME, env },
  };
}
