/** Partagé entre le layout serveur et le bandeau client. */
export const OPEN_CONSENT_EVENT = 'diaspomoney:open-consent';

/** Script inline à placer dans le <head> : consentement refusé par défaut. */
export const CONSENT_DEFAULT_SCRIPT = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});`;
