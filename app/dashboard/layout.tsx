'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import Footer from '@/components/layout/footer/Footer';
import DashboardHeader from '@/components/layout/header/DashboardHeader';
import Sidebar from '@/components/layout/Sidebar';
import { SidebarProvider } from '@/contexts/SidebarContext';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className='h-screen flex flex-col bg-gray-50'>
          {/* Header - hauteur adaptative selon les enfants */}
          <DashboardHeader className='flex-shrink-0' />

          {/* Main content with sidebar - prend l'espace restant */}
          <div className='flex flex-1'>
            {/* Sidebar - prend toute la hauteur nécessaire */}
            <Sidebar />
            {/* Main content - même hauteur que la sidebar, contenu scrollable */}
            <main className='flex-1 h-full overflow-hidden flex flex-col'>
              <div className='flex-1 p-4 sm:p-6 lg:ml-0'>
                {/* Fil d'Ariane */}
                <div className='mb-4'>
                  <Breadcrumb />
                </div>
                {/* Contenu scrollable */}
                {children}
              </div>
            </main>
          </div>

          {/* Footer */}
          <Footer className='flex-shrink-0' />
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
