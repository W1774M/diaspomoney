import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  path: '/support',
  title: 'Support',
  description: 'Une question sur une réservation ou un paiement ? L’équipe DiaspoMoney vous répond.',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
