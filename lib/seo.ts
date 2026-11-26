/**
 * Métadonnées SEO partagées : URL canonique, Open Graph et Twitter cohérents par page.
 */
import type { Metadata } from 'next';

export const SITE_URL = (process.env['NEXT_PUBLIC_APP_URL'] || 'https://diaspomoney.fr').replace(/\/$/, '');
export const SITE_NAME = 'DiaspoMoney';
/**
 * Balise google-site-verification (Search Console, méthode « Balise HTML »).
 * Le jeton est public : il figure dans le HTML de chaque page. GOOGLE_SITE_VERIFICATION
 * doit être présent au build, car les métadonnées racine sont générées à ce moment-là.
 */
export function googleSiteVerification(
  env: Record<string, string | undefined> = process.env,
): Metadata['verification'] {
  const token = env['GOOGLE_SITE_VERIFICATION']?.trim();
  return token ? { google: token } : undefined;
}

const OG_IMAGE ={ url: '/img/og.png', width: 1200, height: 630, alt: 'DiaspoMoney' };

/** URL absolue d'un chemin ; la racine garde sa barre finale (https://diaspomoney.fr/). */
export function absoluteUrl(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export function pageMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  const url = absoluteUrl(path);
  const socialTitle = path === '/' ? title : `${title} | ${SITE_NAME}`;
  return {
    title: path === '/' ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      siteName: SITE_NAME,
      url,
      title: socialTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [OG_IMAGE],
    },
  };
}

export const SOCIAL_PROFILES = [
  'https://www.facebook.com/profile.php?id=61586670864659',
  'https://www.instagram.com/diaspomoney.fr/',
  'https://www.linkedin.com/company/diaspomoney',
];

/** Données structurées Organization + WebSite (schema.org), communes à tout le site. */
export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/img/diaspo/Logo_DispoMoney_horiz.webp`,
        email: 'contact@diaspomoney.fr',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Seine Innopolis',
          postalCode: '76140',
          addressLocality: 'Le Petit-Quevilly',
          addressCountry: 'FR',
        },
        sameAs: SOCIAL_PROFILES,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        inLanguage: 'fr-FR',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  };
}

/** Sérialise du JSON-LD sans permettre de fermer la balise <script>. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
