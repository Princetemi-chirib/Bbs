'use client';

import AuthGuard from '@/components/AuthGuard';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useRouter } from 'next/navigation';
import styles from './admin-layout.module.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    router.push('/login');
  };

  return (
    <AuthGuard requiredRole="ADMIN_OR_REP">
      <div className={styles.adminContainer}>
        <AdminSidebar onLogout={handleLogout} />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
