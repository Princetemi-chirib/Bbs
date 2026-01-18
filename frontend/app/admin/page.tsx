'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAuth } from '@/lib/auth';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      const response = await fetchAuth('/api/v1/admin/overview');
      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to load dashboard');
        return;
      }

      setStats(data.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button onClick={loadOverview}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>BBS Admin Dashboard</h1>
        <nav className={styles.nav}>
          <Link href="/admin">Overview</Link>
          <Link href="/admin/orders">Orders</Link>
          <Link href="/admin/barbers">Barbers</Link>
          <Link href="/admin/services">Services</Link>
          <button onClick={() => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            router.push('/login');
          }}>Logout</button>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total Barbers</h3>
            <p className={styles.statNumber}>{stats?.stats.totalBarbers || 0}</p>
            <span className={styles.statSubtext}>{stats?.stats.activeBarbers || 0} active</span>
          </div>

          <div className={styles.statCard}>
            <h3>Total Orders</h3>
            <p className={styles.statNumber}>{stats?.stats.totalOrders || 0}</p>
          </div>

          <div className={styles.statCard}>
            <h3>Total Revenue</h3>
            <p className={styles.statNumber}>₦{stats?.stats.totalRevenue?.toLocaleString() || '0'}</p>
          </div>

          <div className={styles.statCard}>
            <h3>Average Rating</h3>
            <p className={styles.statNumber}>{stats?.stats.averageRating || '0.00'}</p>
            <span className={styles.statSubtext}>Out of 5.0</span>
          </div>
        </section>

        <section className={styles.recentOrders}>
          <h2>Recent Orders</h2>
          <div className={styles.ordersList}>
            {stats?.recentOrders?.length > 0 ? (
              stats.recentOrders.map((order: any) => (
                <div key={order.id} className={styles.orderCard}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>{order.customerName}</span>
                  </div>
                  <div>
                    <span className={styles.statusBadge}>{order.status}</span>
                    {order.jobStatus && (
                      <span className={styles.jobStatusBadge}>{order.jobStatus}</span>
                    )}
                  </div>
                  <div>₦{order.totalAmount.toLocaleString()}</div>
                  {order.assignedBarberId && (
                    <div>Barber ID: {order.assignedBarberId}</div>
                  )}
                </div>
              ))
            ) : (
              <p>No recent orders</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
