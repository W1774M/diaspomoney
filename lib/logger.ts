import pino from 'pino';
import { LOG_LEVELS } from '@/lib/constants';

const level =
  (process.env['LOG_LEVEL'] as typeof LOG_LEVELS[keyof typeof LOG_LEVELS]) ||
  (process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG);

const loggerOptions: pino.LoggerOptions = {
  level,
  base: null, // do not include pid/hostname by default to keep logs compact
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
    ],
    remove: true,
  },
};

if (process.env.NODE_ENV !== 'production') {
  // Configuration simple pour le développement
  loggerOptions.level = LOG_LEVELS.DEBUG;
}

export const logger = pino(loggerOptions);

export function childLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
