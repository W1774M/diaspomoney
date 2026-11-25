import { notFound } from 'next/navigation';

import { InstitutionSectionScreen } from '@/components/institution/InstitutionSectionScreen';
import { getInstitutionSection } from '@/lib/institution/sections';

export default async function InstitutionSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: slug } = await params;
  const section = getInstitutionSection(slug);
  if (!section) {
    notFound();
  }

  return <InstitutionSectionScreen section={section} />;
}
