/* global process, console, fetch, AbortSignal, Buffer */
/**
 * Serveur HTTP du relais Sentry → CircleCI (Node 20, aucune dépendance).
 *
 *   POST /__hooks/sentry   webhook d'une intégration interne Sentry
 *   GET  /__hooks/health   sonde de santé
 *
 * Variables d'environnement (valeurs dans le .env du serveur, jamais dans le dépôt) :
 *   SENTRY_CLIENT_SECRET         Client Secret de l'intégration interne Sentry
 *   CIRCLECI_VALIDATION_URL      https://circleci.com/api/v3/deploy/hooks/<ORG_UUID>/validate
 *   CIRCLECI_VALIDATION_SECRET   secret de webhook CircleCI (CCIVWH_…)
 */
import { createServer } from 'node:http';
import { isValidSignature, toValidationEvent } from './relay.mjs';

const PORT = Number(process.env.PORT || 8080);
const MAX_BODY = 1024 * 1024;
const { SENTRY_CLIENT_SECRET, CIRCLECI_VALIDATION_URL, CIRCLECI_VALIDATION_SECRET } = process.env;
const configured = Boolean(SENTRY_CLIENT_SECRET && CIRCLECI_VALIDATION_URL && CIRCLECI_VALIDATION_SECRET);

const log = (message, extra = {}) =>
  console.log(JSON.stringify({ time: new Date().toISOString(), message, ...extra }));

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('payload trop volumineux'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const send = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/__hooks/health') {
    return send(res, configured ? 200 : 503, { ok: configured });
  }
  if (req.method !== 'POST' || req.url !== '/__hooks/sentry') {
    return send(res, 404, { error: 'introuvable' });
  }
  if (!configured) {
    log('relais non configuré : variables manquantes');
    return send(res, 503, { error: 'relais non configuré' });
  }

  let raw;
  try {
    raw = await readBody(req);
  } catch {
    return send(res, 413, { error: 'payload trop volumineux' });
  }

  if (!isValidSignature(raw, req.headers['sentry-hook-signature'], SENTRY_CLIENT_SECRET)) {
    log('signature Sentry invalide');
    return send(res, 401, { error: 'signature invalide' });
  }

  let payload;
  try {
    payload = JSON.parse(raw.toString('utf8'));
  } catch {
    return send(res, 400, { error: 'JSON invalide' });
  }

  const resource = String(req.headers['sentry-hook-resource'] || '');
  const event = toValidationEvent(resource, payload);
  if (!event) {
    log('webhook ignoré', { resource, action: payload?.action });
    return send(res, 202, { forwarded: false });
  }

  try {
    const response = await fetch(CIRCLECI_VALIDATION_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${CIRCLECI_VALIDATION_SECRET}`,
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(10_000),
    });
    log('alerte relayée', { status: event.status, env: event.tags.env, circleci: response.status });
    return send(res, response.ok ? 200 : 502, { forwarded: response.ok });
  } catch (error) {
    log('échec du relais vers CircleCI', { error: String(error) });
    return send(res, 502, { forwarded: false });
  }
}).listen(PORT, () => log('relais Sentry → CircleCI démarré', { port: PORT, configured }));
