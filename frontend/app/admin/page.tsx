'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Scissors, Package, Wallet, Star, ArrowRight, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { fetchAuth, hasRole } from '@/lib/auth';
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

const QUICK_LINKS = [
  { href: '/admin/orders', label: 'Orders', Icon: Package },
  { href: '/admin/barbers', label: 'Staff', Icon: Scissors },
  { href: '/admin/customers', label: 'Customers', Icon: Users },
  { href: '/admin/financials', label: 'Financials', Icon: TrendingUp },
];

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
  const orderStatusItems = stats?.orderStatusBreakdown || stats?.ordersByStatus || [];

  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <AdminBreadcrumbs items={[{ label: 'Dashboard' }]} />
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <p className={styles.pageSubtitle}>
          Key metrics, order pipeline, and recent activity at a glance.
        </p>
        {hasUnassigned && (
          <Link href="/admin/orders" className={styles.primaryCta}>
            <AlertCircle size={18} aria-hidden />
            Assign {unassignedCount} order{unassignedCount !== 1 ? 's' : ''} <ArrowRight size={18} />
          </Link>
        )}
      </header>

      <main className={styles.main}>
        {/* Quick links (Financials hidden for Customer Rep) */}
        <nav className={styles.quickLinks} aria-label="Quick navigation">
          {QUICK_LINKS.filter((link) => !(link.href === '/admin/financials' && hasRole('REP'))).map(({ href, label, Icon }) => (
            <Link key={href} href={href} className={styles.quickLink}>
              <Icon size={20} aria-hidden />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Alert: unassigned orders */}
        {unassignedCount > 0 && (
          <section className={styles.alertBanner} role="alert">
            <div className={styles.alertContent}>
              <AlertCircle size={22} aria-hidden />
              <div>
                <strong>{unassignedCount} order{unassignedCount !== 1 ? 's' : ''}</strong> paid but not yet assigned to a barber.
                Assign them so barbers can accept and fulfill.
              </div>
            </div>
            <Link href="/admin/orders?view=assignment" className={styles.alertCta}>
              Assign now <ArrowRight size={18} />
            </Link>
          </section>
        )}

        {/* Key metrics */}
        <section className={styles.section} aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className={styles.sectionTitle}>Key metrics</h2>
          <p className={styles.sectionDesc}>Overview of your business performance.</p>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} data-theme="staff" aria-hidden>
                <Scissors size={24} />
              </div>
              <div className={styles.statBody}>
                <span className={styles.statLabel}>Total staff</span>
                <span className={styles.statNumber}>{stats?.stats.totalBarbers ?? 0}</span>
                <span className={styles.statSubtext}>{stats?.stats.activeBarbers ?? 0} active</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} data-theme="orders" aria-hidden>
                <Package size={24} />
              </div>
              <div className={styles.statBody}>
                <span className={styles.statLabel}>Total orders</span>
                <span className={styles.statNumber}>{stats?.stats.totalOrders ?? 0}</span>
                <span className={styles.statSubtext}>All time</span>
              </div>
            </div>
            {stats?.stats.totalRevenue != null && (
              <div className={styles.statCard}>
                <div className={styles.statIcon} data-theme="revenue" aria-hidden>
                  <Wallet size={24} />
                </div>
                <div className={styles.statBody}>
                  <span className={styles.statLabel}>Total revenue</span>
                  <span className={styles.statNumber}>₦{(stats.stats.totalRevenue as number).toLocaleString()}</span>
                  <span className={styles.statSubtext}>Lifetime</span>
                </div>
              </div>
            )}
            <div className={styles.statCard}>
              <div className={styles.statIcon} data-theme="rating" aria-hidden>
                <Star size={24} />
              </div>
              <div className={styles.statBody}>
                <span className={styles.statLabel}>Average rating</span>
                <span className={styles.statNumber}>{stats?.stats.averageRating ?? '0.00'}</span>
                <span className={styles.statSubtext}>Out of 5.0</span>
              </div>
            </div>
          </div>
        </section>

        {/* Order pipeline + Recent orders in two columns on large screens */}
        <div className={styles.twoCol}>
          {/* Order pipeline */}
          {orderStatusItems.length > 0 && (
            <section className={styles.section} aria-labelledby="pipeline-heading">
              <h2 id="pipeline-heading" className={styles.sectionTitle}>Order pipeline</h2>
              <p className={styles.sectionDesc}>Current distribution by status.</p>
              <div className={styles.pipelineCard}>
                <ul className={styles.pipelineList}>
                  {orderStatusItems.map((item: any) => (
                    <li key={item.status} className={styles.pipelineItem}>
                      <span className={styles.pipelineLabel}>{friendlyStatus(item.status)}</span>
                      <span className={styles.pipelineCount}>{item.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Recent orders */}
          <section className={styles.section} aria-labelledby="recent-heading">
            <div className={styles.sectionHeader}>
              <div>
                <h2 id="recent-heading" className={styles.sectionTitle}>Recent orders</h2>
                <p className={styles.sectionDesc}>Latest 10 orders.</p>
              </div>
              <Link href="/admin/orders" className={styles.sectionLink}>View all</Link>
            </div>
            <div className={styles.recentCard}>
              {stats?.recentOrders?.length > 0 ? (
                <>
                  <div className={styles.recentTableHeader}>
                    <span>Order</span>
                    <span>Customer</span>
                    <span>Amount</span>
                    <span>Barber</span>
                    <span>Status</span>
                  </div>
                  <ul className={styles.recentList}>
                    {stats.recentOrders.map((order: any) => (
                      <li key={order.id}>
                        <Link href="/admin/orders" className={styles.recentRow}>
                          <span className={styles.recentOrderNum}>{order.orderNumber}</span>
                          <span className={styles.recentCustomer}>{order.customerName}</span>
                          <span className={styles.recentAmount}>₦{Number(order.totalAmount).toLocaleString()}</span>
                          <span className={styles.recentBarber}>
                            {order.assignedBarberName || (order.assignedBarberId ? 'Assigned' : '—')}
                          </span>
                          <span className={styles.recentStatus}>
                            <span className={`${styles.statusBadge} ${styles[`status${order.status}`]}`}>
                              {friendlyStatus(order.status)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <p>No recent orders.</p>
                  <Link href="/admin/orders" className={styles.emptyStateLink}>Go to Orders</Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
