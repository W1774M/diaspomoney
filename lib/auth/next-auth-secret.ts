export function isProductionEnvironment(): boolean {
  return process.env['NODE_ENV'] === 'production' || process.env['VERCEL_ENV'] === 'production';
}

export function getNextAuthSecret(): string | null {
  const secret = process.env['AUTH_SECRET'] ?? process.env['NEXTAUTH_SECRET'];

  if (secret) {
    return secret;
  }

  if (isProductionEnvironment()) {
    return null;
  }

  return 'fallback-secret-for-development';
}
