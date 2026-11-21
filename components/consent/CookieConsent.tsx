'use client';

/**
 * Consentement aux cookies (CNIL) + Google Consent Mode v2.
 *
 * - Aucun traceur avant le choix : Google Tag Manager n'est chargé qu'après « Accepter ».
 * - « Refuser » est aussi visible et aussi simple que « Accepter ».
 * - Le choix est conservé 6 mois, puis redemandé ; il reste modifiable via
 *   le lien « Gérer les cookies » du pied de page (événement OPEN_CONSENT_EVENT).
 * - Les valeurs par défaut du Consent Mode (tout refusé) sont posées par CONSENT_DEFAULT_SCRIPT
 *   (lib/consent.ts) dans le <head>, avant tout tag Google.
 */
import Link from 'next/link';
import Script from 'next/script';
import { useCallback, useEffect, useState } from 'react';

import { OPEN_CONSENT_EVENT } from '@/lib/consent';

const STORAGE_KEY = 'diaspomoney.consent';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 182; // ~6 mois
const GTM_ID = 'GTM-N83PJN57';

type Choice = 'granted' | 'denied';
interface StoredConsent {
  analytics: Choice;
  date: number;
}

function readConsent(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (!parsed?.date || Date.now() - parsed.date > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Consent Mode attend l'objet « arguments » dans dataLayer, pas un tableau.
function gtag(..._args: unknown[]) {
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  w.dataLayer.push(arguments);
}

function applyConsent(choice: Choice) {
  gtag('consent', 'update', {
    analytics_storage: choice,
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
  });
}

export function CookieConsent() {
  const [consent, setConsent] = useState<StoredConsent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    setConsent(stored);
    if (stored) applyConsent(stored.analytics);
    else setOpen(true);

    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  const decide = useCallback((analytics: Choice) => {
    const value: StoredConsent = { analytics, date: Date.now() };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // stockage indisponible : le choix vaut pour cette visite
    }
    applyConsent(analytics);
    setConsent(value);
    setOpen(false);
    // Retrait d'un consentement : les cookies Google déjà posés ne sont plus lus,
    // un rechargement garantit que GTM n'est plus actif sur la page.
    if (analytics === 'denied' && consent?.analytics === 'granted') window.location.reload();
  }, [consent]);

  const buttonBase =
    'min-h-11 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(25,100%,40%)]';

  return (
    <>
      {consent?.analytics === 'granted' ? (
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
      ) : null}

      {open ? (
        <section
          aria-labelledby="cookie-consent-title"
          className="fixed inset-x-0 bottom-0 z-[90] border-t border-orange-100 bg-white p-4 shadow-[0_-8px_30px_rgb(0_0_0/0.08)] sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-md sm:rounded-2xl sm:border"
        >
          <h2 id="cookie-consent-title" className="mb-2 text-base font-bold text-gray-900">
            Vos choix sur les cookies
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Avec votre accord, nous utilisons des cookies de mesure d’audience (Google) pour
            améliorer le site. Les cookies nécessaires au fonctionnement (connexion, paiement)
            restent actifs. Vous pouvez changer d’avis à tout moment via « Gérer les cookies ».{' '}
            <Link href="/privacy-policy" className="font-medium text-[hsl(25,100%,35%)] underline">
              En savoir plus
            </Link>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              onClick={() => decide('granted')}
              className={`${buttonBase} bg-[hsl(25,100%,45%)] text-white hover:bg-[hsl(25,100%,40%)]`}
            >
              Accepter
            </button>
            <button
              type="button"
              onClick={() => decide('denied')}
              className={`${buttonBase} bg-[hsl(25,100%,45%)] text-white hover:bg-[hsl(25,100%,40%)]`}
            >
              Refuser
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}

/** Lien du pied de page pour rouvrir le bandeau. */
export function ManageCookiesButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
    >
      Gérer les cookies
    </button>
  );
}
