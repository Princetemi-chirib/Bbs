'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Scissors, Package, Wallet, Star, ArrowRight } from 'lucide-react';
import { fetchAuth } from '@/lib/auth';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import styles from './admin.module.css';

const FRIENDLY_STATUS: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  COMPLETED: 'Done',
  CANCELLED: 'Cancelled',
  PENDING_ACCEPTANCE: 'Waiting for barber',
  ACCEPTED: 'In progress',
  DECLINED: 'Declined',
};
function friendlyStatus(s: string) {
  return FRIENDLY_STATUS[s] || s;
}

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

  const unassignedInRecent = stats?.recentOrders?.filter(
    (o: any) => o.paymentStatus === 'PAID' && !o.assignedBarberId
  ) ?? [];
  const unassignedCount = unassignedInRecent.length;
  const hasUnassigned = unassignedCount > 0;

  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <AdminBreadcrumbs items={[{ label: 'Dashboard' }]} />
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>
              What needs your attention — orders, revenue, and recent activity.
            </p>
          </div>
          {hasUnassigned && (
            <Link href="/admin/orders" className={styles.primaryCta}>
              Assign orders <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {/* Quick attention */}
        {unassignedCount > 0 && (
          <section className={styles.quickAction}>
            <p className={styles.quickActionText}>
              <strong>{unassignedCount}</strong> order{unassignedCount !== 1 ? 's' : ''} may need a barber assigned.
            </p>
            <Link href="/admin/orders" className={styles.quickActionLink}>
              Go to Orders <ArrowRight size={16} />
            </Link>
          </section>
        )}

        {/* Stats Grid */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div className={styles.statIcon} style={{ background: 'rgba(70, 180, 80, 0.1)' }}>
                <Scissors size={24} aria-hidden />
              </div>
              <div className={styles.statCardContent}>
                <h3 className={styles.statLabel}>Total barbers</h3>
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
                <Package size={24} aria-hidden />
              </div>
              <div className={styles.statCardContent}>
                <h3 className={styles.statLabel}>Total orders</h3>
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
                  <h3 className={styles.statLabel}>Total revenue</h3>
                  <p className={styles.statNumber}>₦{stats?.stats.totalRevenue?.toLocaleString() || '0'}</p>
                  <span className={styles.statSubtext}>Lifetime earnings</span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div className={styles.statIcon} style={{ background: 'rgba(255, 193, 7, 0.1)' }}>
                <Star size={24} aria-hidden />
              </div>
              <div className={styles.statCardContent}>
                <h3 className={styles.statLabel}>Average rating</h3>
                <p className={styles.statNumber}>{stats?.stats.averageRating || '0.00'}</p>
                <span className={styles.statSubtext}>Out of 5.0</span>
              </div>
            </div>
          </div>
        </section>

        {/* Order Status Breakdown */}
        {(stats?.orderStatusBreakdown?.length || stats?.ordersByStatus?.length) && (
          <section className={styles.statusBreakdown}>
            <h2 className={styles.sectionTitle}>Orders by status</h2>
            <div className={styles.statusGrid}>
              {(stats?.orderStatusBreakdown || stats?.ordersByStatus || []).map((item: any) => (
                <div key={item.status} className={styles.statusCard}>
                  <span className={styles.statusLabel}>{friendlyStatus(item.status)}</span>
                  <span className={styles.statusCount}>{item.count}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Orders */}
        <section className={styles.recentOrders}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent orders</h2>
            <Link href="/admin/orders" className={styles.sectionLink}>View all</Link>
          </div>
          <div className={styles.ordersList}>
            {stats?.recentOrders?.length > 0 ? (
              stats.recentOrders.map((order: any) => (
                <Link key={order.id} href="/admin/orders" className={styles.orderCardLink}>
                  <div className={styles.orderCard}>
                    <div className={styles.orderInfo}>
                      <div className={styles.orderPrimary}>
                        <strong className={styles.orderNumber}>{order.orderNumber}</strong>
                        <span className={styles.customerName}>{order.customerName}</span>
                      </div>
                      <div className={styles.orderSecondary}>
                        <span className={styles.orderAmount}>₦{Number(order.totalAmount).toLocaleString()}</span>
                        {order.assignedBarberName ? (
                          <span className={styles.barberInfo}>Barber: {order.assignedBarberName}</span>
                        ) : order.assignedBarberId ? (
                          <span className={styles.barberInfo}>Barber assigned</span>
                        ) : null}
                      </div>
                    </div>
                    <div className={styles.orderStatus}>
                      <span className={`${styles.statusBadge} ${styles[`status${order.status}`]}`}>
                        {friendlyStatus(order.status)}
                      </span>
                      {order.jobStatus && (
                        <span className={`${styles.jobStatusBadge} ${styles[`jobStatus${order.jobStatus}`]}`}>
                          {friendlyStatus(order.jobStatus)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No recent orders.</p>
                <Link href="/admin/orders" className={styles.emptyStateLink}>Go to Orders</Link>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
