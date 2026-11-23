import {
  AppointmentProvider,
  AuthProvider,
} from '@/components/features/providers';
import NotificationContainer from "@/components/ui/Notification";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import { ImpersonationBanner } from '@/components/support/ImpersonationBanner';
import { EventSystemProvider } from '@/app/providers/EventSystemProvider';
import '@/styles/globals.css';
import 'react-international-phone/style.css';
import { DefaultTemplate } from '@/template/DefaultTemplate';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { CookieConsent } from '@/components/consent/CookieConsent';
import { CONSENT_DEFAULT_SCRIPT } from '@/lib/consent';
import { serializeJsonLd, siteJsonLd } from '@/lib/seo';

// Polices hébergées dans le projet (paquets @fontsource-variable, sous-ensemble latin) :
// next/font/google les téléchargeait à chaque build, et un build échouait dès que
// Google Fonts répondait de travers (CI comme images Docker du serveur).
// Texte courant : Inter. Titres : Plus Jakarta Sans (classe font-display).
const inter = localFont({
  src: '../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
  variable: '--font-inter',
  weight: '100 900',
  display: 'swap',
  // métriques de repli ajustées : pas de saut de mise en page au chargement
  adjustFontFallback: 'Arial',
});

const plusJakartaSans = localFont({
  src: '../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2',
  variable: '--font-plus-jakarta-sans',
  weight: '200 800',
  display: 'swap',
  adjustFontFallback: 'Arial',
});

const baseUrl =
  process.env['NEXT_PUBLIC_APP_URL'] || 'https://diaspomoney.fr';

// Couleur de la barre du navigateur mobile et thème des contrôles natifs (site clair uniquement).
export const viewport: Viewport = {
  themeColor: '#F97015',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'DiaspoMoney – Services pour la diaspora',
    template: '%s | DiaspoMoney',
  },
  description:
    'Réservez et payez des services pour vos proches en Afrique : santé, éducation, immobilier. Paiement sécurisé, prestataires vérifiés.',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'DiaspoMoney',
    title: 'DiaspoMoney – Services pour la diaspora',
    description:
      'Réservez et payez des services pour vos proches en Afrique : santé, éducation, immobilier. Paiement sécurisé, prestataires vérifiés.',
    images: [{ url: '/img/og.png', width: 1200, height: 630, alt: 'DiaspoMoney' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DiaspoMoney – Services pour la diaspora',
    description:
      'Réservez et payez des services pour vos proches en Afrique. Paiement sécurisé, prestataires vérifiés.',
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Suit la taille de texte réglée dans le système (Chrome/Edge 146+, ignoré ailleurs) */}
        <meta name='text-scale' content='scale' />
        {/* Consent Mode v2 : tout refusé par défaut, avant tout tag Google. */}
        <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_SCRIPT }} />
      </head>
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(siteJsonLd()) }}
        />
        <EventSystemProvider>
          <AuthProvider>
            {/* consultation du support en cours (lecture seule) : toujours visible */}
            <ImpersonationBanner />
            <AppointmentProvider>
              <ConfirmProvider>
                <DefaultTemplate>{children}</DefaultTemplate>
              </ConfirmProvider>
              <CookieConsent />
              {/* zone unique des notifications (toasts) de toute l'app */}
              <NotificationContainer />
            </AppointmentProvider>
          </AuthProvider>
        </EventSystemProvider>
      </body>
    </html>
  );
}
