'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAuth } from '@/lib/auth';
import styles from './orders.module.css';

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedBarber, setSelectedBarber] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadOrders();
    loadBarbers();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetchAuth('/api/v1/orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBarbers = async () => {
    try {
      const response = await fetchAuth('/api/v1/barbers');
      const data = await response.json();
      if (data.success) {
        setBarbers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load barbers:', err);
    }
  };

  const handleAssign = async (orderId: string) => {
    if (!selectedBarber) {
      alert('Please select a barber');
      return;
    }

    setAssigning(true);
    try {
      const response = await fetchAuth(`/api/v1/admin/orders/assign`, {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          barberId: selectedBarber,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Order assigned successfully');
        setSelectedOrder(null);
        setSelectedBarber('');
        loadOrders();
      } else {
        alert(data.error?.message || 'Failed to assign order');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setAssigning(false);
    }
  };

  // Filter orders that need assignment
  const unassignedOrders = orders.filter(
    (order) => order.paymentStatus === 'COMPLETED' && !order.assignedBarberId
  );

  const assignedOrders = orders.filter((order) => order.assignedBarberId);

  if (loading) {
    return <div className={styles.loading}>Loading orders...</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Order Management</h1>
          <p className={styles.pageSubtitle}>Manage and assign orders to barbers</p>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Unassigned Orders</h2>
            <span className={styles.sectionBadge}>{unassignedOrders.length} pending</span>
          </div>
          <div className={styles.ordersGrid}>
            {unassignedOrders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <strong>{order.orderNumber}</strong>
                  <span>₦{Number(order.totalAmount).toLocaleString()}</span>
                </div>
                <div className={styles.orderDetails}>
                  <p><strong>Customer:</strong> {order.customerName}</p>
                  <p><strong>Location:</strong> {order.city}, {order.location}</p>
                  <p><strong>Phone:</strong> {order.customerPhone}</p>
                </div>
                {selectedOrder === order.id ? (
                  <div className={styles.assignForm}>
                    <select
                      value={selectedBarber}
                      onChange={(e) => setSelectedBarber(e.target.value)}
                      className={styles.select}
                    >
                      <option value="">Select Barber</option>
                      {barbers
                        .filter((b) => {
                          // Filter barbers by order location (city or state match)
                          const barberLocation = (b.city || b.location || '').toLowerCase();
                          const barberState = (b.state || '').toLowerCase();
                          const orderCity = (order.city || '').toLowerCase();
                          return b.status === 'ACTIVE' && 
                            (barberLocation.includes(orderCity) || 
                             barberState.includes(orderCity) ||
                             orderCity.includes(barberLocation) ||
                             orderCity.includes(barberState));
                        })
                        .map((barber) => (
                          <option key={barber.id} value={barber.id}>
                            {barber.user?.name || 'Unknown'} - {barber.address || barber.city || barber.location || 'No address'}
                          </option>
                        ))}
                    </select>
                    <div className={styles.formActions}>
                      <button
                        onClick={() => handleAssign(order.id)}
                        disabled={assigning || !selectedBarber}
                        className={styles.assignButton}
                      >
                        {assigning ? 'Assigning...' : 'Assign'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrder(null);
                          setSelectedBarber('');
                        }}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedOrder(order.id)}
                    className={styles.assignButton}
                  >
                    Assign Barber
                  </button>
                )}
              </div>
            ))}
            {unassignedOrders.length === 0 && (
              <p className={styles.empty}>No unassigned orders</p>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Assigned Orders</h2>
            <span className={styles.sectionBadge}>{assignedOrders.length} total</span>
          </div>
          <div className={styles.ordersList}>
            {assignedOrders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <strong>{order.orderNumber}</strong>
                  <span>₦{Number(order.totalAmount).toLocaleString()}</span>
                </div>
                <div className={styles.orderDetails}>
                  <p><strong>Customer:</strong> {order.customerName}</p>
                  <p><strong>Barber:</strong> {order.assignedBarber?.name || 'N/A'}</p>
                  <p><strong>Status:</strong> {order.jobStatus || 'N/A'}</p>
                </div>
              </div>
            ))}
            {assignedOrders.length === 0 && (
              <p className={styles.empty}>No assigned orders</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
