'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import Footer from '@/components/layout/footer/Footer';
import DashboardHeader from '@/components/layout/header/DashboardHeader';
import Sidebar from '@/components/layout/Sidebar';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className='min-h-screen flex flex-col bg-gray-50'>
        {/* Header */}
        <DashboardHeader />

        {/* Main content with sidebar */}
        <div className='flex flex-1'>
          <Sidebar />
          <main className='flex-1 p-6'>
            {/* Fil d'Ariane */}
            <div className='mb-4'>
              <Breadcrumb />
            </div>
            {children}
          </main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </AuthGuard>
  );
}
