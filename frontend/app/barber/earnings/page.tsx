'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAuth } from '@/lib/auth';
import styles from './earnings.module.css';

export default function BarberEarningsPage() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<any>(null);
  const [period, setPeriod] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, [period]);

  const loadEarnings = async () => {
    try {
      const url = `/api/v1/barber/earnings?period=${period}`;
      const response = await fetchAuth(url);
      const data = await response.json();

      if (data.success) {
        setEarnings(data.data);
      }
    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading earnings...</div>;
  }

  if (!earnings) {
    return <div className={styles.error}>Failed to load earnings data</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/barber">← Back to Dashboard</Link>
        <h1>My Earnings</h1>
      </header>

      <main className={styles.main}>
        <div className={styles.periodFilters}>
          <button
            onClick={() => setPeriod('today')}
            className={period === 'today' ? styles.activePeriod : styles.periodButton}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={period === 'week' ? styles.activePeriod : styles.periodButton}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={period === 'month' ? styles.activePeriod : styles.periodButton}
          >
            This Month
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={period === 'all' ? styles.activePeriod : styles.periodButton}
          >
            All Time
          </button>
        </div>

        <section className={styles.overview}>
          <div className={styles.totalEarnings}>
            <h2>Total Earnings</h2>
            <p className={styles.earningsAmount}>₦{earnings.totalEarnings.toLocaleString()}</p>
            <span className={styles.commissionRate}>
              Commission Rate: {(earnings.commissionRate * 100).toFixed(0)}%
            </span>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Completed Orders</h3>
              <p>{earnings.orderCount}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Pending Earnings</h3>
              <p>₦{earnings.pendingEarnings.toLocaleString()}</p>
              <span className={styles.pendingCount}>
                ({earnings.pendingOrderCount} orders)
              </span>
            </div>
          </div>
        </section>

        {earnings.earningsByService && earnings.earningsByService.length > 0 && (
          <section className={styles.serviceEarnings}>
            <h2>Earnings by Service</h2>
            <div className={styles.serviceList}>
              {earnings.earningsByService.map((service: any, index: number) => (
                <div key={index} className={styles.serviceItem}>
                  <div className={styles.serviceHeader}>
                    <span className={styles.serviceName}>{service.service}</span>
                    <span className={styles.serviceAmount}>₦{service.earnings.toLocaleString()}</span>
                  </div>
                  <div className={styles.serviceMeta}>
                    <span>{service.orderCount} orders</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {earnings.orders && earnings.orders.length > 0 && (
          <section className={styles.recentEarnings}>
            <h2>Recent Earnings</h2>
            <div className={styles.ordersList}>
              {earnings.orders.map((order: any) => (
                <div key={order.id} className={styles.earningsItem}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span className={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.earningsDetails}>
                    <span>Order: ₦{order.totalAmount.toLocaleString()}</span>
                    <span className={styles.earningsAmount}>
                      Earnings: ₦{order.earnings.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {earnings.orderCount === 0 && (
          <div className={styles.empty}>
            <p>No earnings data for this period</p>
          </div>
        )}
      </main>
    </div>
  );
}
