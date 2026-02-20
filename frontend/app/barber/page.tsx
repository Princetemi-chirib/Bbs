'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserData, fetchAuth, clearAuthData } from '@/lib/auth';
import styles from './barber.module.css';

export default function BarberDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [onlineStatus, setOnlineStatus] = useState<any>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const userData = getUserData();
    if (userData) {
      setUser(userData);
    }

    loadPendingOrders();
    loadStats();
    loadOnlineStatus();
    
    // Refresh status every minute to check availability hours
    const interval = setInterval(() => {
      loadOnlineStatus();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const loadOnlineStatus = async () => {
    try {
      const response = await fetchAuth('/api/v1/barber/online-status');
      const data = await response.json();
      if (data.success) {
        setOnlineStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to load online status:', err);
    }
  };

  const handleToggleOnline = async () => {
    if (toggling) return;
    
    setToggling(true);
    try {
      const newStatus = !onlineStatus?.isOnline;
      const response = await fetchAuth('/api/v1/barber/online-status', {
        method: 'PUT',
        body: JSON.stringify({ isOnline: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        await loadOnlineStatus();
        alert(data.message || (newStatus ? 'You are now online' : 'You are now offline'));
      } else {
        alert(data.error?.message || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  const loadPendingOrders = async () => {
    try {
      const response = await fetchAuth('/api/v1/barber/orders?jobStatus=PENDING_ACCEPTANCE');
      const data = await response.json();
      if (data.success) {
        setPendingOrders(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetchAuth('/api/v1/barber/dashboard-stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleAccept = async (orderId: string) => {
    try {
      const response = await fetchAuth(`/api/v1/barber/orders/${orderId}/accept`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        alert('Order accepted successfully');
        loadPendingOrders();
      } else {
        alert(data.error?.message || 'Failed to accept order');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  };

  const handleDecline = async (orderId: string) => {
    const reason = prompt('Please provide a reason for declining:');
    if (!reason) return;

    try {
      const response = await fetchAuth(`/api/v1/barber/orders/${orderId}/decline`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Order declined');
        loadPendingOrders();
      } else {
        alert(data.error?.message || 'Failed to decline order');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
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

  return (
    <div className={styles.newDashboard}>
      {/* App Header */}
      <div className={styles.appHeader}>
        <div className={styles.welcomeText}>
          Welcome back, {user?.name || 'Barber'}
        </div>
        {/* Online/Offline Toggle */}
        {onlineStatus && (
          <div className={styles.onlineToggleContainer}>
            <div className={styles.onlineStatusIndicator}>
              <div className={`${styles.statusDot} ${onlineStatus.isAvailable ? styles.online : styles.offline}`}></div>
              <span className={styles.statusText}>
                {onlineStatus.isAvailable ? 'Available' : 
                 !onlineStatus.isOnline ? 'Offline' : 
                 'Outside Hours'}
              </span>
            </div>
            <button
              onClick={handleToggleOnline}
              disabled={toggling}
              className={`${styles.toggleButton} ${onlineStatus.isOnline ? styles.toggleOn : styles.toggleOff}`}
            >
              <div className={styles.toggleSlider}></div>
              <span className={styles.toggleLabel}>
                {onlineStatus.isOnline ? 'Online' : 'Offline'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Logo Section */}
      <div className={styles.logoSection}>
        <div className={styles.logoCircle}>
          <div className={styles.logoText}>BBS</div>
        </div>
      </div>

      {/* Main Menu */}
      <div className={styles.mainMenu}>
        <Link href="/barber/appointments" className={styles.menuItem}>
          <div className={styles.menuIcon}>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z"/>
            </svg>
          </div>
          <div className={styles.menuText}>My Appointments</div>
          <div className={styles.menuArrow}>›</div>
        </Link>

        <Link href="/barber/earnings" className={styles.menuItem}>
          <div className={styles.menuIcon}>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
            </svg>
          </div>
          <div className={styles.menuText}>Earnings</div>
          <div className={styles.menuArrow}>›</div>
        </Link>

        <Link href="/barber/profile" className={styles.menuItem}>
          <div className={styles.menuIcon}>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div className={styles.menuText}>Profile</div>
          <div className={styles.menuArrow}>›</div>
        </Link>
      </div>

      {/* Pending Orders Section */}
      {pendingOrders.length > 0 && (
        <div className={styles.mainContent}>
          <div className={styles.pageContent}>
            <h2 className={styles.pageHeader}>Pending Acceptances ({pendingOrders.length})</h2>
            <div className={styles.ordersList}>
              {pendingOrders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <strong>{order.orderNumber}</strong>
                    <span className={styles.orderAmount}>₦{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className={styles.orderDetails}>
                    <p><strong>Customer:</strong> {order.customerName}</p>
                    <p><strong>Location:</strong> {order.city}, {order.location}</p>
                  </div>
                  <div className={styles.orderActions}>
                    <button
                      onClick={() => handleAccept(order.id)}
                      className={styles.acceptButton}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(order.id)}
                      className={styles.declineButton}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className={styles.mainContent}>
        <div className={styles.pageContent}>
          <h2 className={styles.pageHeader}>Dashboard overview</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>₦{(stats?.totalEarnings ?? 0).toLocaleString()}</div>
              <div className={styles.statLabel}>Total earnings</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>₦{(stats?.weeklyEarnings ?? 0).toLocaleString()}</div>
              <div className={styles.statLabel}>Total weekly earnings</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>₦{(stats?.monthlyEarnings ?? 0).toLocaleString()}</div>
              <div className={styles.statLabel}>Total monthly earnings</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                {stats?.starRating != null ? Number(stats.starRating).toFixed(1) : '0.0'}
                <span className={styles.statStar}> ★</span>
              </div>
              <div className={styles.statLabel}>Total star rating status</div>
              {stats?.totalReviews != null && stats.totalReviews > 0 && (
                <div className={styles.statSub}>{stats.totalReviews} reviews</div>
              )}
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{stats?.jobsCompleted ?? 0}</div>
              <div className={styles.statLabel}>Total job completed</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{stats?.jobsIncompleted ?? 0}</div>
              <div className={styles.statLabel}>Total job incompleted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className={styles.bottomNav}>
        <Link href="/barber" className={`${styles.navItem} ${styles.active}`}>
          <div className={styles.navIcon}>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
          <div className={styles.navText}>Home</div>
        </Link>
        <Link href="/barber/appointments" className={styles.navItem}>
          <div className={styles.navIcon}>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z"/>
            </svg>
          </div>
          <div className={styles.navText}>Jobs</div>
        </Link>
        <div className={styles.navCenter}>
          <div className={styles.plusButton}>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </div>
        </div>
        <Link href="/barber/earnings" className={styles.navItem}>
          <div className={styles.navIcon}>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
            </svg>
          </div>
          <div className={styles.navText}>Earnings</div>
        </Link>
        <div 
          className={styles.navItem}
          onClick={async () => {
            await clearAuthData();
            router.push('/login');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.navIcon}>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </div>
          <div className={styles.navText}>Logout</div>
        </div>
      </div>
    </div>
  );
}
