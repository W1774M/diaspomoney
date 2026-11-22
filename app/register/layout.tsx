// Titre de l'onglet (unique par page) ; la page elle-même est un composant client.
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/register',
  title: "Créer un compte",
  description: "Créez votre compte DiaspoMoney et payez directement les services de vos proches en Afrique.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
