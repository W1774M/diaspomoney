import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  generatePreloadTags,
  getAssetURL,
  getCacheRules,
  getCDNConfig,
  getCloudflareWorkerConfig,
  optimizeImage,
  preloadCriticalAssets,
} from '@/config/cdn';

describe('CDN', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reste local tant que le CDN de production n’est pas demandé', () => {
    vi.stubEnv('USE_CDN', 'true');
    vi.stubEnv('NODE_ENV', 'test');
    expect(getCDNConfig().provider).toBe('local');

    vi.unstubAllEnvs();
    vi.stubEnv('NODE_ENV', 'production');
    const local = getCDNConfig();
    expect(local.provider).toBe('local');
    expect(local.optimization.imageOptimization).toBe(false);
    expect(getAssetURL('images/logo.svg')).toBe('/images/logo.svg');
    expect(getAssetURL('https://cdn.exemple/logo.svg')).toBe('https://cdn.exemple/logo.svg');
    expect(optimizeImage('/logo.svg', { width: 100 })).toBe('/logo.svg');
    expect(preloadCriticalAssets().every((path) => path.startsWith('/'))).toBe(true);
    expect(getCacheRules().map((rule) => rule.ttl)).toEqual([0, 0, 0, 0]);
  });

  it('construit une URL Cloudflare et optimise l’image', () => {
    vi.stubEnv('USE_CDN', 'true');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://diaspomoney.fr');

    const config = getCDNConfig();
    expect(config.provider).toBe('cloudflare');
    expect(config.fallbackUrl).toBe('https://diaspomoney.fr');
    expect(config.caching.images).toBe(2592000);

    expect(getAssetURL('/logo.svg')).toBe('https://cdn.diaspomoney.fr/logo.svg');
    expect(getAssetURL('logo.svg', { width: 320, height: 180, quality: 70, format: 'avif' })).toBe(
      'https://cdn.diaspomoney.fr/logo.svg?width=320&height=180&quality=70&format=avif',
    );
    expect(getAssetURL('logo.svg', { transformation: 'unused' })).toBe('https://cdn.diaspomoney.fr/logo.svg');
    expect(optimizeImage('photo.jpg', { format: 'auto', width: 800 })).toContain('format=webp');
    expect(optimizeImage('photo.jpg', { format: 'avif', width: 800 })).toContain('format=avif');
    expect(optimizeImage('photo.jpg')).toContain('quality=85');

    const rules = getCacheRules();
    expect(rules[0]?.immutable).toBe(true);
    expect(rules[3]?.immutable).toBe(false);
    expect(rules[1]?.ttl).toBe(31536000);
  });

  it('écrit les balises de préchargement selon l’extension', () => {
    const html = generatePreloadTags([
      '/app.css',
      '/app.js',
      '/font.woff2',
      '/font.ttf',
      '/logo.svg',
      '/photo.jpg',
      '/photo.jpeg',
      '/anim.gif',
      '/clip.avif',
      '/fichier',
      '/doc.pdf',
    ]);
    expect(html).toContain('href="/app.css" as="style"');
    expect(html).toContain('href="/app.js" as="script"');
    expect(html).toContain('href="/font.woff2" as="font" crossorigin');
    expect(html).toContain('href="/font.ttf" as="font" crossorigin');
    expect(html).toContain('href="/logo.svg" as="image"');
    expect(html).toContain('href="/photo.jpeg" as="image"');
    expect(html).toContain('href="/anim.gif" as="image"');
    expect(html).toContain('href="/clip.avif" as="image"');
    expect(html).toContain('href="/fichier" as="fetch"');
    expect(html).toContain('href="/doc.pdf" as="fetch"');
    expect(getCloudflareWorkerConfig().name).toBe('diaspomoney-cdn');
    expect(getCloudflareWorkerConfig().script).toContain('handleRequest');
  });
});
