// Titre de l'onglet (unique par page) ; la page elle-même est un composant client.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Détail de la réservation',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
