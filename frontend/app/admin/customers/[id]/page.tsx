'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAuth } from '@/lib/auth';
import styles from '../customers.module.css';
import Link from 'next/link';

type TabType = 'profile' | 'bookings' | 'orders' | 'payments' | 'reviews';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string | undefined;
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [customer, setCustomer] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customerId) {
      loadCustomerDetails();
    }
  }, [customerId]);

  const loadCustomerDetails = async () => {
    try {
      setLoading(true);
      const response = await fetchAuth(`/api/v1/admin/customers/${customerId}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to load customer details');
        return;
      }

      setCustomer(data.data.customer);
      setStatistics(data.data.statistics);
      setBookings(data.data.bookings);
      setOrders(data.data.orders);
      setPayments(data.data.payments);
      setReviews(data.data.reviews);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading customer details...</p>
      </div>
    );
  }

  if (!customerId) {
    return (
      <div className={styles.errorContainer}>
        <p>Invalid customer ID</p>
        <Link href="/admin/customers" className={styles.backButton}>
          Back to Customers
        </Link>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className={styles.errorContainer}>
        <p>{error || 'Customer not found'}</p>
        <div>
          <button onClick={loadCustomerDetails}>Retry</button>
          <Link href="/admin/customers" className={styles.backButton}>
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.customerDetail}>
      <header className={styles.pageHeader}>
        <div>
          <Link href="/admin/customers" className={styles.backLink}>
            ← Back to Customers
          </Link>
          <h1 className={styles.pageTitle}>{customer.name}</h1>
          <p className={styles.pageSubtitle}>Customer ID: {customer.customerId}</p>
        </div>
      </header>

      <main className={styles.main}>
        {/* Statistics Cards */}
        {statistics && (
          <section className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(70, 180, 80, 0.1)' }}>
                💰
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statLabel}>Total Spent</h3>
                <p className={styles.statValue}>{formatCurrency(statistics.totalSpent)}</p>
                <span className={styles.statSubtext}>
                  Avg: {formatCurrency(statistics.avgOrderValue)}
                </span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(57, 65, 63, 0.1)' }}>
                📅
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statLabel}>Total Bookings</h3>
                <p className={styles.statValue}>{statistics.totalBookings}</p>
                <span className={styles.statSubtext}>
                  {statistics.completedBookings} completed
                </span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(220, 210, 204, 0.3)' }}>
                📦
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statLabel}>Total Orders</h3>
                <p className={styles.statValue}>{statistics.totalOrders}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(255, 193, 7, 0.1)' }}>
                ⭐
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statLabel}>Average Rating</h3>
                <p className={styles.statValue}>{statistics.avgRatingGiven}</p>
                <span className={styles.statSubtext}>
                  {statistics.totalReviews} reviews
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Tabs */}
        <section className={styles.tabsSection}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'profile' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              👤 Profile
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'bookings' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              📅 Bookings ({bookings.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'orders' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              📦 Orders ({orders.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'payments' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              💳 Payments ({payments.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'reviews' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              ⭐ Reviews ({reviews.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === 'profile' && (
              <div className={styles.profileTab}>
                <div className={styles.profileCard}>
                  <h2 className={styles.sectionTitle}>Customer Information</h2>
                  <div className={styles.profileGrid}>
                    <div className={styles.profileItem}>
                      <label>Name</label>
                      <div>{customer.name}</div>
                    </div>
                    <div className={styles.profileItem}>
                      <label>Email</label>
                      <div>
                        {customer.email}
                        {customer.emailVerified ? (
                          <span className={styles.verifiedBadge}>✓ Verified</span>
                        ) : (
                          <span className={styles.unverifiedBadge}>Unverified</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.profileItem}>
                      <label>Phone</label>
                      <div>{customer.phone || 'Not provided'}</div>
                    </div>
                    <div className={styles.profileItem}>
                      <label>Address</label>
                      <div>{customer.address || 'Not provided'}</div>
                    </div>
                    <div className={styles.profileItem}>
                      <label>Date of Birth</label>
                      <div>
                        {customer.dateOfBirth
                          ? formatDate(customer.dateOfBirth)
                          : 'Not provided'}
                      </div>
                    </div>
                    <div className={styles.profileItem}>
                      <label>Gender</label>
                      <div>{customer.gender || 'Not specified'}</div>
                    </div>
                    <div className={styles.profileItem}>
                      <label>Membership Type</label>
                      <div>
                        <span className={styles.membershipBadge}>{customer.membershipType}</span>
                      </div>
                    </div>
                    <div className={styles.profileItem}>
                      <label>Loyalty Points</label>
                      <div>{customer.loyaltyPoints}</div>
                    </div>
                    <div className={styles.profileItem}>
                      <label>Preferred Barber</label>
                      <div>{customer.preferredBarber?.name || 'None'}</div>
                    </div>
                    <div className={styles.profileItem}>
                      <label>Account Status</label>
                      <div>
                        <span
                          className={`${styles.statusBadge} ${
                            customer.isActive ? styles.statusActive : styles.statusInactive
                          }`}
                        >
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.profileItem}>
                      <label>Member Since</label>
                      <div>{formatDate(customer.createdAt)}</div>
                    </div>
                    <div className={styles.profileItem}>
                      <label>Last Updated</label>
                      <div>{formatDate(customer.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className={styles.bookingsTab}>
                <div className={styles.card}>
                  <h2 className={styles.sectionTitle}>Booking History</h2>
                  {bookings.length === 0 ? (
                    <div className={styles.emptyState}>No bookings found</div>
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Booking #</th>
                            <th>Barber</th>
                            <th>Service</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((booking) => (
                            <tr key={booking.id}>
                              <td>{booking.bookingNumber}</td>
                              <td>{booking.barberName}</td>
                              <td>{booking.serviceName}</td>
                              <td>{formatDate(booking.bookingDate)}</td>
                              <td>{formatCurrency(booking.totalPrice)}</td>
                              <td>
                                <span
                                  className={`${styles.statusBadge} ${styles[`status${booking.status}`]}`}
                                >
                                  {booking.status}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`${styles.statusBadge} ${styles[`status${booking.paymentStatus}`]}`}
                                >
                                  {booking.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className={styles.ordersTab}>
                <div className={styles.card}>
                  <h2 className={styles.sectionTitle}>Order History</h2>
                  {orders.length === 0 ? (
                    <div className={styles.emptyState}>No orders found</div>
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Order #</th>
                            <th>Items</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order) => (
                            <tr key={order.id}>
                              <td>{order.orderNumber}</td>
                              <td>
                                {order.items.map((item: any, idx: number) => (
                                  <div key={idx}>
                                    {item.title} x{item.quantity}
                                  </div>
                                ))}
                              </td>
                              <td>{formatCurrency(order.totalAmount)}</td>
                              <td>
                                <span
                                  className={`${styles.statusBadge} ${styles[`status${order.status}`]}`}
                                >
                                  {order.status}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`${styles.statusBadge} ${styles[`status${order.paymentStatus}`]}`}
                                >
                                  {order.paymentStatus}
                                </span>
                              </td>
                              <td>{formatDate(order.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className={styles.paymentsTab}>
                <div className={styles.card}>
                  <h2 className={styles.sectionTitle}>Payment History</h2>
                  {payments.length === 0 ? (
                    <div className={styles.emptyState}>No payments found</div>
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Service</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Transaction ID</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment) => (
                            <tr key={payment.id}>
                              <td>{payment.bookingNumber}</td>
                              <td>{formatCurrency(payment.amount)}</td>
                              <td>{payment.paymentMethod}</td>
                              <td>
                                <span
                                  className={`${styles.statusBadge} ${styles[`status${payment.status}`]}`}
                                >
                                  {payment.status}
                                </span>
                              </td>
                              <td>{payment.transactionId || 'N/A'}</td>
                              <td>{formatDate(payment.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className={styles.reviewsTab}>
                <div className={styles.card}>
                  <h2 className={styles.sectionTitle}>Reviews & Ratings</h2>
                  {reviews.length === 0 ? (
                    <div className={styles.emptyState}>No reviews found</div>
                  ) : (
                    <div className={styles.reviewsList}>
                      {reviews.map((review) => (
                        <div key={review.id} className={styles.reviewCard}>
                          <div className={styles.reviewHeader}>
                            <div>
                              <div className={styles.reviewBarber}>{review.barberName}</div>
                              <div className={styles.reviewService}>{review.serviceName}</div>
                            </div>
                            <div className={styles.rating}>
                              {'⭐'.repeat(review.rating)}
                              <span className={styles.ratingNumber}>{review.rating}/5</span>
                            </div>
                          </div>
                          {review.comment && (
                            <div className={styles.reviewComment}>{review.comment}</div>
                          )}
                          {review.barberResponse && (
                            <div className={styles.barberResponse}>
                              <strong>Barber Response:</strong> {review.barberResponse}
                            </div>
                          )}
                          <div className={styles.reviewDate}>
                            {formatDateTime(review.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
