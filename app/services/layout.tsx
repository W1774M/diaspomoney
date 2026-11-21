import type { Metadata } from 'next';
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/services",
  title: "Nos services",
  description:
    "Santé, éducation, immobilier : réservez et payez des services pour vos proches en Afrique. Paiement sécurisé, prestataires vérifiés.",
});

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
