'use client';

import { Suspense } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AdminSidebar from '@/components/admin/AdminSidebar';
import SettingsApply from '@/components/admin/SettingsApply';
import { useRouter } from 'next/navigation';
import { clearAuthData } from '@/lib/auth';
import styles from './admin-layout.module.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await clearAuthData();
    router.push('/login');
  };

  return (
    <AuthGuard requiredRole="ADMIN_OR_REP">
      <SettingsApply />
      <div className={styles.adminContainer}>
        <Suspense fallback={<aside className={styles.sidebarFallback} />}>
          <AdminSidebar onLogout={handleLogout} />
        </Suspense>
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
