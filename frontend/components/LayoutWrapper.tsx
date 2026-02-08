'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import TrafficTracker from '@/components/TrafficTracker';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide header/footer for admin, barber dashboard, and login (show on /barber-recruit)
  const hideHeaderFooter =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/login') ||
    pathname === '/barber' ||
    pathname?.startsWith('/barber/');

  if (hideHeaderFooter) {
    return (
      <>
        <TrafficTracker />
        {children}
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TrafficTracker />
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
