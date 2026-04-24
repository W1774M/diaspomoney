import {
  AppointmentProvider,
  AuthProvider,
} from '@/components/features/providers';
// import NotificationContainer from "@/components/ui/Notification";
import { EventSystemProvider } from '@/app/providers/EventSystemProvider';
import '@/styles/globals.css';
import 'react-international-phone/style.css';
import { DefaultTemplate } from '@/template/DefaultTemplate';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';

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

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'DiaspoMoney – Services pour la diaspora',
    template: '%s | DiaspoMoney',
  },
  description:
    'Réservez et payez des services pour vos proches en Afrique : santé, éducation, immobilier. Paiement sécurisé, prestataires vérifiés.',
  keywords: [
    'diaspora',
    'services Afrique',
    'paiement diaspora',
    'santé Afrique',
    'éducation Afrique',
    'immobilier Afrique',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: baseUrl,
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
        {/* Google Tag Manager */}
        <Script
          id='gtm-script'
          strategy='afterInteractive'
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-N83PJN57');`,
          }}
        />

        {/* End Google Tag Manager */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Google Tag Manager (noscript) */}
        <Script
          id='gtm-noscript'
          strategy='afterInteractive'
          dangerouslySetInnerHTML={{
            __html: `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T5KW77GK"
              height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
          }}
        />
        {/* End Google Tag Manager (noscript) */}
        <EventSystemProvider>
          <AuthProvider>
            <AppointmentProvider>
              <DefaultTemplate>{children}</DefaultTemplate>
            </AppointmentProvider>
          </AuthProvider>
        </EventSystemProvider>
      </body>
    </html>
  );
}
