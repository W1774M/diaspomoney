'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import Footer from '@/components/layout/footer/Footer';
import PublicHeader from '@/components/layout/header/PublicHeader';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className='min-h-screen flex flex-col'>
        {/* Header */}
        <PublicHeader />

        {/* Main content with sidebar */}
        <div className='flex flex-1 bg-gray-50'>
          <Sidebar />
          <main className='flex-1 p-6'>{children}</main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </AuthGuard>
  );
}
