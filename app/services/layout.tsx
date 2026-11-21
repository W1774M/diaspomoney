import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nos services',
  description:
    'Santé, éducation, immobilier : réservez et payez des services pour vos proches en Afrique. Paiement sécurisé, prestataires vérifiés.',
  openGraph: {
    title: 'Nos services | DiaspoMoney',
    description:
      'Santé, éducation, immobilier : réservez et payez des services pour vos proches en Afrique.',
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
