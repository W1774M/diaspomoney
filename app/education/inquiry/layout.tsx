// Titre de l'onglet (unique par page) ; la page elle-même est un composant client.
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/education/inquiry',
  title: "Demande d'information éducation",
  description: "Renseignez-vous sur la prise en charge des frais de scolarité de vos proches en Afrique.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
