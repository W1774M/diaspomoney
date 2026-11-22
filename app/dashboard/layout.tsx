import DashboardShell from '@/components/layout/DashboardShell';
import type { Metadata } from 'next';

// Espace connecté : jamais indexé ; chaque page précise son titre dans son layout.
export const metadata: Metadata = {
  title: 'Tableau de bord',
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
