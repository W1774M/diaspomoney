import pino from 'pino';

const level =
  process.env['LOG_LEVEL'] ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

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
  loggerOptions.level = 'debug';
}

export const logger = pino(loggerOptions);

export function childLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
