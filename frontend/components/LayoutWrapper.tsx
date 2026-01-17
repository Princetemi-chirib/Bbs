'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide header/footer for admin and barber dashboards
  const hideHeaderFooter = pathname?.startsWith('/admin') || pathname?.startsWith('/barber') || pathname?.startsWith('/login');
  
  if (hideHeaderFooter) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
