import type { Metadata } from 'next';

// Tunnel de réservation : pas d'intérêt à être indexé.
export const metadata: Metadata = {
  title: 'Réservation',
  robots: { index: false, follow: false },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
