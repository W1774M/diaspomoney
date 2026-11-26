import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

/**
 * Pages publiques indexables. Pas de lastModified : une date identique et fausse
 * sur toutes les URL est ignorée par les moteurs ; mieux vaut ne rien déclarer.
 */
const ROUTES: Array<{ path: string; changeFrequency: 'weekly' | 'monthly' | 'yearly'; priority: number }> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/services/health', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/services/edu', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/services/immo', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/support', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/hotline', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/terms-and-conditions', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms-of-sale', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/legal-notice', changeFrequency: 'yearly', priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  }));
}
