import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

/**
 * Un seul groupe « User-agent: * ». Cloudflare préfixe son propre bloc géré
 * (Content-Signal, robots IA) : le désactiver dans le tableau de bord Cloudflare
 * si on veut un fichier sans doublon.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard', '/services/book', '/__acces'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
