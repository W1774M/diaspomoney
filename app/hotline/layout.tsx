import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/hotline',
  title: 'Hotline',
  description: 'Joignez l’assistance DiaspoMoney pour une aide rapide sur vos réservations et paiements.',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
