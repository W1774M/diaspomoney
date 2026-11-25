import type { Metadata } from 'next';

import { getInstitutionSection } from '@/lib/institution/sections';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const known = getInstitutionSection(section);
  return {
    title: known?.title ?? 'Institution',
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
