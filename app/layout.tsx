import {
  AppointmentProvider,
  AuthProvider,
} from '@/components/features/providers';
// import NotificationContainer from "@/components/ui/Notification";
import { EventSystemProvider } from '@/app/providers/EventSystemProvider';
import '@/styles/globals.css';
import 'react-international-phone/style.css';
import { DefaultTemplate } from '@/template/DefaultTemplate';
import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { CookieConsent } from '@/components/consent/CookieConsent';
import { CONSENT_DEFAULT_SCRIPT } from '@/lib/consent';
import { serializeJsonLd, siteJsonLd } from '@/lib/seo';

const geistSans = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Inter({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
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
        {/* Consent Mode v2 : tout refusé par défaut, avant tout tag Google. */}
        <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(siteJsonLd()) }}
        />
        <EventSystemProvider>
          <AuthProvider>
            <AppointmentProvider>
              <DefaultTemplate>{children}</DefaultTemplate>
              <CookieConsent />
            </AppointmentProvider>
          </AuthProvider>
        </EventSystemProvider>
      </body>
    </html>
  );
}
