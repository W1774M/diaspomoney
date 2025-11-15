import {
  AppointmentProvider,
  AuthProvider,
} from '@/components/features/providers';
// import NotificationContainer from "@/components/ui/Notification";
import { EventSystemProvider } from '@/app/providers/EventSystemProvider';
import '@/styles/globals.css';
import { DefaultTemplate } from '@/template/DefaultTemplate';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

const geistSans = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Inter({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DiaspoMoney',
  description: 'Le lieu parfait pour acheter vos services pour la diaspora',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
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
})(window,document,'script','dataLayer','GTM-T5KW77GK');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src='https://www.googletagmanager.com/ns.html?id=GTM-T5KW77GK'
            height='0'
            width='0'
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
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
