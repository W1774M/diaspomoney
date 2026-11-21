import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

const SERVICES: Record<string, { title: string; description: string }> = {
  health: {
    title: 'Santé',
    description:
      'Consultations et soins dans des cliniques partenaires vérifiées en Afrique, payés directement depuis la France pour vos proches.',
  },
  edu: {
    title: 'Éducation',
    description:
      'Frais de scolarité et accompagnement scolaire payés directement aux établissements partenaires pour vos proches en Afrique.',
  },
  immo: {
    title: 'Immobilier & BTP',
    description:
      'Projets immobiliers et travaux suivis par des prestataires vérifiés, pour la diaspora qui construit en Afrique.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const service = SERVICES[id];
  if (!service) {
    return { robots: { index: false, follow: true } };
  }
  return pageMetadata({ path: `/services/${id}`, ...service });
}

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
