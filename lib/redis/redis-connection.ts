/**
 * Paramètres de connexion Redis lus depuis l'environnement.
 *
 * Les environnements (dev, rct, prod) partagent le même serveur Redis et se distinguent par
 * le numéro de base dans REDIS_URL (redis://:motdepasse@redis:6379/2). REDIS_URL est donc
 * prioritaire ; REDIS_HOST / REDIS_PORT / REDIS_PASSWORD / REDIS_DB servent de repli.
 */
export interface RedisConnection {
  host: string;
  port: number;
  password: string;
  db: number;
}

const toInt = (value: string | undefined, fallback: number): number => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export function redisConnectionFromEnv(env: Record<string, string | undefined> = process.env): RedisConnection {
  const fallback: RedisConnection = {
    host: env['REDIS_HOST'] || 'localhost',
    port: toInt(env['REDIS_PORT'], 6379),
    password: env['REDIS_PASSWORD'] ?? '',
    db: toInt(env['REDIS_DB'], 0),
  };

  const raw = env['REDIS_URL'];
  if (!raw) return fallback;

  try {
    const url = new URL(raw);
    if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') return fallback;
    return {
      host: url.hostname || fallback.host,
      port: toInt(url.port, fallback.port),
      password: url.password ? decodeURIComponent(url.password) : fallback.password,
      db: toInt(url.pathname.replace(/^\//, ''), fallback.db),
    };
  } catch {
    return fallback;
  }
}

/**
 * Délai avant chaque tentative de reconnexion (ms) : 50, 100, 150… plafonné à 2 s.
 *
 * C'était le défaut d'ioredis 5. ioredis 6 est passé à une attente exponentielle
 * (jusqu'à 5 s + jitter) : avec maxRetriesPerRequest à 3, une commande pouvait alors
 * attendre une quinzaine de secondes quand Redis est injoignable, et bloquer la requête
 * HTTP d'autant (inscription, transactions…).
 */
export const redisRetryDelay = (times: number): number => Math.min(times * 50, 2000);
