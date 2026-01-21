'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAuth } from '@/lib/auth';
import styles from './appointments.module.css';

export default function BarberAppointmentsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/v1/barber/orders'
        : `/api/v1/barber/orders?jobStatus=${filter}`;
      
      const response = await fetchAuth(url);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (!confirm(`Change status to ${newStatus}?`)) return;

    try {
      const response = await fetchAuth(`/api/v1/barber/orders/${orderId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Status updated successfully');
        loadOrders();
      } else {
        alert(data.error?.message || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  };

  const getStatusButton = (order: any) => {
    const currentStatus = order.jobStatus;
    
    if (currentStatus === 'ACCEPTED') {
      return (
        <button
          onClick={() => updateStatus(order.id, 'ON_THE_WAY')}
          className={styles.statusButton}
        >
          Mark as On The Way
        </button>
      );
    }
    
    if (currentStatus === 'ON_THE_WAY') {
      return (
        <button
          onClick={() => updateStatus(order.id, 'ARRIVED')}
          className={styles.statusButton}
        >
          Mark as Arrived
        </button>
      );
    }
    
    if (currentStatus === 'ARRIVED') {
      return (
        <button
          onClick={() => updateStatus(order.id, 'COMPLETED')}
          className={styles.statusButton}
        >
          Mark as Completed
        </button>
      );
    }

    if (currentStatus === 'COMPLETED') {
      return <span className={styles.completedBadge}>Completed</span>;
    }

    if (currentStatus === 'DECLINED') {
      return <span className={styles.declinedBadge}>Declined</span>;
    }

    return null;
  };

  if (loading) {
    return <div className={styles.loading}>Loading appointments...</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/barber" className={styles.backLink}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
        <h1>My Appointments</h1>
        <p className={styles.headerSubtitle}>Manage your orders and appointments</p>
        <p className={styles.headerSubtitle}>Manage your orders and appointments</p>
      </header>

      <main className={styles.main}>
        <div className={styles.filters}>
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? styles.activeFilter : styles.filterButton}
          >
            All
          </button>
          <button
            onClick={() => setFilter('PENDING_ACCEPTANCE')}
            className={filter === 'PENDING_ACCEPTANCE' ? styles.activeFilter : styles.filterButton}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('ACCEPTED')}
            className={filter === 'ACCEPTED' ? styles.activeFilter : styles.filterButton}
          >
            Accepted
          </button>
          <button
            onClick={() => setFilter('ON_THE_WAY')}
            className={filter === 'ON_THE_WAY' ? styles.activeFilter : styles.filterButton}
          >
            On The Way
          </button>
          <button
            onClick={() => setFilter('ARRIVED')}
            className={filter === 'ARRIVED' ? styles.activeFilter : styles.filterButton}
          >
            Arrived
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={filter === 'COMPLETED' ? styles.activeFilter : styles.filterButton}
          >
            Completed
          </button>
        </div>

        <div className={styles.ordersList}>
          {orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span className={styles.statusBadge}>{order.jobStatus}</span>
                  </div>
                  <div className={styles.amount}>₦{order.totalAmount.toLocaleString()}</div>
                </div>

                <div className={styles.orderDetails}>
                  <div className={styles.detailRow}>
                    <strong>Customer:</strong>
                    <span>{order.customerName}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <strong>Phone:</strong>
                    <span>{order.customerPhone}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <strong>Location:</strong>
                    <span>{order.city}, {order.location}</span>
                  </div>
                  {order.address && (
                    <div className={styles.detailRow}>
                      <strong>Address:</strong>
                      <span>{order.address}</span>
                    </div>
                  )}
                  {order.additionalNotes && (
                    <div className={styles.detailRow}>
                      <strong>Notes:</strong>
                      <span>{order.additionalNotes}</span>
                    </div>
                  )}
                </div>

                {order.items && order.items.length > 0 && (
                  <div className={styles.orderItems}>
                    <strong>Services:</strong>
                    <ul>
                      {order.items.map((item: any) => (
                        <li key={item.id}>
                          {item.title} ({item.quantity}x) - ₦{item.totalPrice.toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={styles.orderActions}>
                  {getStatusButton(order)}
                </div>
              </div>
            ))
          ) : (
            <p className={styles.empty}>No appointments found</p>
          )}
        </div>
      </main>
    </div>
  );
}
