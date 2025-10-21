'use client';

import { usePathname } from 'next/navigation';
import Footer from './footer/Footer';
import PublicHeader from './header/PublicHeader';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Les pages dashboard ont leur propre layout avec sidebar
  const isDashboardPage = pathname?.startsWith('/dashboard');

  if (isDashboardPage) {
    // Pour les pages dashboard, ne pas ajouter de header/footer
    // car elles ont leur propre structure avec sidebar dans le layout dashboard
    return <>{children}</>;
  }

  // Pour toutes les autres pages, utiliser le header et footer
  return (
    <div className='min-h-screen flex flex-col'>
      <PublicHeader />
      <main className='flex-1'>{children}</main>
      <Footer />
    </div>
  );
}
