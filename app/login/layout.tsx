// Titre de l'onglet (unique par page) ; la page elle-même est un composant client.
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/login',
  title: "Connexion",
  description: "Connectez-vous à DiaspoMoney pour suivre vos réservations et paiements pour vos proches.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
