'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import Footer from '@/components/layout/footer/Footer';
import DashboardHeader from '@/components/layout/header/DashboardHeader';
import Sidebar from '@/components/layout/Sidebar';
import { SidebarProvider } from '@/contexts/SidebarContext';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <a href='#contenu' className='skip-link'>
          Aller au contenu
        </a>
        <div className='flex min-h-dvh flex-col bg-stone-50'>
          {/* data-dashboard-chrome : rendu inerte quand le tiroir mobile est ouvert */}
          <div data-dashboard-chrome className='sticky top-0 z-30 flex-shrink-0'>
            <DashboardHeader />
          </div>

          <div className='flex flex-1'>
            <Sidebar />
            <div data-dashboard-chrome className='flex min-w-0 flex-1 flex-col'>
              <main id='contenu' tabIndex={-1} className='flex-1 p-4 focus:outline-none sm:p-6 lg:p-8'>
                <div className='mx-auto w-full max-w-7xl'>
                  <div className='mb-4'>
                    <Breadcrumb />
                  </div>
                  {children}
                </div>
              </main>
              <Footer className='flex-shrink-0' />
            </div>
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
