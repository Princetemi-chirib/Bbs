'use client';

import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import { MessageSquare } from 'lucide-react';
import styles from '../orders/orders.module.css';

export default function AdminChatPage() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <AdminBreadcrumbs items={[{ label: 'Dashboard', href: '/admin' }, { label: 'Chat Room' }]} />
        <div>
          <h1 className={styles.pageTitle}>Chat Room</h1>
          <p className={styles.pageSubtitle}>
            Customer and staff messaging. This feature is coming soon.
          </p>
        </div>
      </header>
      <main className={styles.main}>
        <section
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: 48,
            textAlign: 'center',
            border: '1px solid #e5e5e5',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <MessageSquare size={64} style={{ color: '#39413f', marginBottom: 16 }} aria-hidden />
          <h2 style={{ fontSize: '1.25rem', color: '#39413f', marginBottom: 8 }}>Chat Room</h2>
          <p style={{ color: '#6c757d', maxWidth: 400, margin: '0 auto' }}>
            Live chat with customers and staff will be available here. You will be able to see conversations, assign threads, and respond from the dashboard.
          </p>
        </section>
      </main>
    </div>
  );
}
