import { permanentRedirect } from 'next/navigation';

/** Ancienne adresse : redirection permanente vers la page canonique. */
export default function PrivacyRedirect() {
  permanentRedirect('/privacy-policy');
}
