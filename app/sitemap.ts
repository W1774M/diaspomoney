import type { MetadataRoute } from 'next';

const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'https://diaspomoney.fr';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/services',
    '/about',
    '/terms-and-conditions',
    '/privacy-policy',
    '/privacy',
    '/support',
    '/hotline',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency:
      route === '' || route === '/services' ? 'weekly' : ('monthly' as const),
    priority: route === '' ? 1 : route === '/services' ? 0.9 : 0.7,
  }));
}
