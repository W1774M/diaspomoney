import { describe, expect, it } from 'vitest';

import {
  absoluteUrl,
  googleSiteVerification,
  pageMetadata,
  serializeJsonLd,
  SITE_URL,
  siteJsonLd,
} from '@/lib/seo';

describe('lib/seo', () => {
  it('n’a jamais de barre finale dans l’URL de base', () => {
    expect(SITE_URL.endsWith('/')).toBe(false);
  });

  it('construit des URL absolues avec une barre finale pour la racine seulement', () => {
    expect(absoluteUrl('/')).toBe(`${SITE_URL}/`);
    expect(absoluteUrl('/services/health')).toBe(`${SITE_URL}/services/health`);
  });

  it('aligne canonical et og:url sur la page', () => {
    const metadata = pageMetadata({ path: '/about', title: 'À propos', description: 'd' });
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/about`);
    expect(metadata.openGraph?.url).toBe(`${SITE_URL}/about`);
    expect(metadata.title).toBe('À propos');
  });

  it('émet la balise google-site-verification seulement si le jeton est fourni', () => {
    expect(googleSiteVerification({ GOOGLE_SITE_VERIFICATION: ' abc123 ' })).toEqual({
      google: 'abc123',
    });
    expect(googleSiteVerification({ GOOGLE_SITE_VERIFICATION: '  ' })).toBeUndefined();
    expect(googleSiteVerification({})).toBeUndefined();
  });

  it('empêche le JSON-LD de fermer la balise script', () => {
    expect(serializeJsonLd({ a: '</script>' })).not.toContain('</script>');
    expect(JSON.parse(serializeJsonLd(siteJsonLd()))['@graph']).toHaveLength(2);
  });
});
