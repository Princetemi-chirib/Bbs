'use client';

import { useEffect, useState } from 'react';
import { fetchAuth } from '@/lib/auth';
import styles from './admin.module.css';

export default function AdminDashboard() {
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
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard Overview</h1>
          <p className={styles.pageSubtitle}>Monitor your business performance at a glance</p>
        </div>
      </header>

      <main className={styles.main}>
        {/* Stats Grid */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div className={styles.statIcon} style={{ background: 'rgba(70, 180, 80, 0.1)' }}>
                <span>✂️</span>
              </div>
              <div className={styles.statCardContent}>
                <h3 className={styles.statLabel}>Total Barbers</h3>
                <p className={styles.statNumber}>{stats?.stats.totalBarbers || 0}</p>
                <span className={styles.statSubtext}>
                  {stats?.stats.activeBarbers || 0} active
                </span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div className={styles.statIcon} style={{ background: 'rgba(57, 65, 63, 0.1)' }}>
                <span>📦</span>
              </div>
              <div className={styles.statCardContent}>
                <h3 className={styles.statLabel}>Total Orders</h3>
                <p className={styles.statNumber}>{stats?.stats.totalOrders || 0}</p>
                <span className={styles.statSubtext}>All time</span>
              </div>
            </div>
          </div>

          {stats?.stats.totalRevenue !== null && stats?.stats.totalRevenue !== undefined && (
            <div className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <div className={styles.statIcon} style={{ background: 'rgba(220, 210, 204, 0.3)' }}>
                  <span>💰</span>
                </div>
                <div className={styles.statCardContent}>
                  <h3 className={styles.statLabel}>Total Revenue</h3>
                  <p className={styles.statNumber}>₦{stats?.stats.totalRevenue?.toLocaleString() || '0'}</p>
                  <span className={styles.statSubtext}>Lifetime earnings</span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div className={styles.statIcon} style={{ background: 'rgba(255, 193, 7, 0.1)' }}>
                <span>⭐</span>
              </div>
              <div className={styles.statCardContent}>
                <h3 className={styles.statLabel}>Average Rating</h3>
                <p className={styles.statNumber}>{stats?.stats.averageRating || '0.00'}</p>
                <span className={styles.statSubtext}>Out of 5.0</span>
              </div>
            </div>
          </div>
        </section>

        {/* Order Status Breakdown */}
        {stats?.orderStatusBreakdown && (
          <section className={styles.statusBreakdown}>
            <h2 className={styles.sectionTitle}>Orders by Status</h2>
            <div className={styles.statusGrid}>
              {stats.orderStatusBreakdown.map((item: any) => (
                <div key={item.status} className={styles.statusCard}>
                  <span className={styles.statusLabel}>{item.status}</span>
                  <span className={styles.statusCount}>{item.count}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Orders */}
        <section className={styles.recentOrders}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Orders</h2>
            <span className={styles.sectionBadge}>{stats?.recentOrders?.length || 0} orders</span>
          </div>
          <div className={styles.ordersList}>
            {stats?.recentOrders?.length > 0 ? (
              stats.recentOrders.map((order: any) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderInfo}>
                    <div className={styles.orderPrimary}>
                      <strong className={styles.orderNumber}>{order.orderNumber}</strong>
                      <span className={styles.customerName}>{order.customerName}</span>
                    </div>
                    <div className={styles.orderSecondary}>
                      <span className={styles.orderAmount}>₦{order.totalAmount.toLocaleString()}</span>
                      {order.assignedBarberId && (
                        <span className={styles.barberInfo}>Barber: {order.assignedBarberId.slice(0, 8)}...</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.orderStatus}>
                    <span className={`${styles.statusBadge} ${styles[`status${order.status}`]}`}>
                      {order.status}
                    </span>
                    {order.jobStatus && (
                      <span className={`${styles.jobStatusBadge} ${styles[`jobStatus${order.jobStatus}`]}`}>
                        {order.jobStatus}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No recent orders</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
