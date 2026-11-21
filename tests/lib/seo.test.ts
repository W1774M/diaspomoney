import { describe, expect, it } from 'vitest';

import { absoluteUrl, pageMetadata, serializeJsonLd, siteJsonLd } from '@/lib/seo';

describe('lib/seo', () => {
  it('construit des URL absolues avec une barre finale pour la racine seulement', () => {
    expect(absoluteUrl('/')).toBe('https://diaspomoney.fr/');
    expect(absoluteUrl('/services/health')).toBe('https://diaspomoney.fr/services/health');
  });

  it('aligne canonical et og:url sur la page', () => {
    const metadata = pageMetadata({ path: '/about', title: 'À propos', description: 'd' });
    expect(metadata.alternates?.canonical).toBe('https://diaspomoney.fr/about');
    expect(metadata.openGraph?.url).toBe('https://diaspomoney.fr/about');
    expect(metadata.title).toBe('À propos');
  });

  it('empêche le JSON-LD de fermer la balise script', () => {
    expect(serializeJsonLd({ a: '</script>' })).not.toContain('</script>');
    expect(JSON.parse(serializeJsonLd(siteJsonLd()))['@graph']).toHaveLength(2);
  });
});
