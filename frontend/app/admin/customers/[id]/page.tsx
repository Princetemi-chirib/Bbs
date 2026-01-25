'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAuth } from '@/lib/auth';
import styles from '../customers.module.css';
import Link from 'next/link';

type TabType = 'profile' | 'bookings' | 'orders' | 'payments' | 'reviews' | 'financial' | 'preferences' | 'communications' | 'audit';

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
  const [preferences, setPreferences] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [riskIndicators, setRiskIndicators] = useState<any>(null);
  const [communications, setCommunications] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagText, setTagText] = useState('');
  const [tagColor, setTagColor] = useState('#e5e5e5');
  const [addingTag, setAddingTag] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeCustomerId, setMergeCustomerId] = useState('');
  const [editing, setEditing] = useState(false);
  const [merging, setMerging] = useState(false);
  const [editForm, setEditForm] = useState({
    preferredBranch: '',
    membershipType: '',
    allergies: '',
    servicePreferences: [] as string[],
  });

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
      setPreferences(data.data.preferences);
      setNotes(data.data.notes || []);
      setTags(data.data.customer?.tags || []);
      setRiskIndicators(data.data.riskIndicators);
      setCommunications(data.data.communications || []);
      setAuditLogs(data.data.auditLogs || []);
      
      // Initialize edit form
      setEditForm({
        preferredBranch: data.data.customer?.preferredBranch || '',
        membershipType: data.data.customer?.membershipType || '',
        allergies: data.data.customer?.allergies || '',
        servicePreferences: data.data.customer?.servicePreferences || [],
      });
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

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      alert('Please enter a note');
      return;
    }

    setAddingNote(true);
    try {
      const response = await fetchAuth(`/api/v1/admin/customers/${customerId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText, isInternal: true }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Note added successfully');
        setShowNoteModal(false);
        setNoteText('');
        loadCustomerDetails();
      } else {
        alert(data.error?.message || 'Failed to add note');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setAddingNote(false);
    }
  };

  const handleAddTag = async () => {
    if (!tagText.trim()) {
      alert('Please enter a tag');
      return;
    }

    setAddingTag(true);
    try {
      const response = await fetchAuth(`/api/v1/admin/customers/${customerId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: tagText, color: tagColor }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Tag added successfully');
        setShowTagModal(false);
        setTagText('');
        setTagColor('#e5e5e5');
        loadCustomerDetails();
      } else {
        alert(data.error?.message || 'Failed to add tag');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setAddingTag(false);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!confirm(`Remove tag "${tag}"?`)) return;

    try {
      const response = await fetchAuth(`/api/v1/admin/customers/${customerId}/tags?tag=${encodeURIComponent(tag)}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert('Tag removed successfully');
        loadCustomerDetails();
      } else {
        alert(data.error?.message || 'Failed to remove tag');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  };

  const handleCustomerAction = async (action: string, reason?: string) => {
    const actionReason = reason || prompt(`Reason for ${action.toLowerCase()}ing:`);
    if (!actionReason && (action === 'FLAG' || action === 'BLOCK')) {
      return;
    }

    try {
      const response = await fetchAuth(`/api/v1/admin/customers/${customerId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: actionReason }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Customer ${action.toLowerCase()}ed successfully`);
        loadCustomerDetails();
      } else {
        alert(data.error?.message || 'Failed to perform action');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  };

  const handleEditCustomer = async () => {
    setEditing(true);
    try {
      const response = await fetchAuth(`/api/v1/admin/customers/${customerId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();
      if (data.success) {
        alert('Customer updated successfully');
        setShowEditModal(false);
        loadCustomerDetails();
      } else {
        alert(data.error?.message || 'Failed to update customer');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setEditing(false);
    }
  };

  const handleMergeCustomers = async () => {
    if (!mergeCustomerId.trim()) {
      alert('Please enter a customer ID to merge with');
      return;
    }

    const reason = prompt('Reason for merging:');
    if (!reason) return;

    setMerging(true);
    try {
      const response = await fetchAuth(`/api/v1/admin/customers/${customerId}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mergeWithCustomerId: mergeCustomerId, reason }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Customers merged successfully');
        setShowMergeModal(false);
        setMergeCustomerId('');
        router.push('/admin/customers');
      } else {
        alert(data.error?.message || 'Failed to merge customers');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setMerging(false);
    }
  };

  const handleExportData = async () => {
    if (!confirm('Export customer data? This will download all customer information.')) return;

    try {
      const response = await fetchAuth(`/api/v1/admin/customers/${customerId}/export`);
      const data = await response.json();
      
      if (data.success) {
        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customer_${customer.customerId}_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Data exported successfully');
      } else {
        alert(data.error?.message || 'Failed to export data');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  };

  const handleAnonymizeData = async () => {
    const reason = prompt('Reason for anonymization (required):');
    if (!reason) return;

    if (!confirm('WARNING: This will permanently anonymize customer data. This action cannot be undone. Continue?')) {
      return;
    }

    try {
      const response = await fetchAuth(`/api/v1/admin/customers/${customerId}/anonymize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Customer data anonymized successfully');
        loadCustomerDetails();
      } else {
        alert(data.error?.message || 'Failed to anonymize data');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
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
            <button
              className={`${styles.tab} ${activeTab === 'financial' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('financial')}
            >
              💰 Financial
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'preferences' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              ⚙️ Preferences & Notes
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'communications' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('communications')}
            >
              📧 Communications ({communications.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'audit' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              📋 Audit Log ({auditLogs.length})
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
                      <label>Preferred Branch</label>
                      <div>{customer.preferredBranch || 'Not specified'}</div>
                    </div>
                    <div className={styles.profileItem}>
                      <label>Customer Status</label>
                      <div>
                        <span
                          className={`${styles.statusBadge} ${
                            customer.status === 'ACTIVE' ? styles.statusActive :
                            customer.status === 'FLAGGED' ? styles.statusFlagged :
                            customer.status === 'BLOCKED' ? styles.statusBlocked :
                            styles.statusInactive
                          }`}
                        >
                          {customer.status || (customer.isActive ? 'Active' : 'Inactive')}
                        </span>
                      </div>
                    </div>
                    {tags && tags.length > 0 && (
                      <div className={styles.profileItem} style={{ gridColumn: '1 / -1' }}>
                        <label>Tags</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {tags.map((tag: any) => (
                            <span
                              key={tag.id}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '16px',
                                fontSize: '0.875rem',
                                background: tag.color || '#e5e5e5',
                                color: '#39413f',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              {tag.tag}
                              <button
                                onClick={() => handleRemoveTag(tag.tag)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  color: '#6c757d',
                                  padding: 0,
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {riskIndicators && (
                      <div className={styles.profileItem} style={{ gridColumn: '1 / -1' }}>
                        <label>Risk Indicators</label>
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {riskIndicators.highCancellationRate && (
                            <div style={{ padding: '8px', background: '#fff3cd', borderRadius: '6px', color: '#856404' }}>
                              ⚠️ High cancellation rate detected
                            </div>
                          )}
                          {riskIndicators.frequentNoShows && (
                            <div style={{ padding: '8px', background: '#fff3cd', borderRadius: '6px', color: '#856404' }}>
                              ⚠️ Frequent no-shows detected
                            </div>
                          )}
                          {riskIndicators.excessiveRefunds && (
                            <div style={{ padding: '8px', background: '#fff3cd', borderRadius: '6px', color: '#856404' }}>
                              ⚠️ Excessive refunds detected
                            </div>
                          )}
                          {!riskIndicators.highCancellationRate && !riskIndicators.frequentNoShows && !riskIndicators.excessiveRefunds && (
                            <div style={{ padding: '8px', background: '#d1e7dd', borderRadius: '6px', color: '#0f5132' }}>
                              ✓ No risk indicators
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {customer.referralCode && (
                      <div className={styles.profileItem}>
                        <label>Referral Code</label>
                        <div>
                          <code style={{ background: '#f8f9fa', padding: '4px 8px', borderRadius: '4px' }}>
                            {customer.referralCode}
                          </code>
                        </div>
                      </div>
                    )}
                    <div className={styles.profileItem} style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setShowNoteModal(true)}
                          className={styles.primaryButton}
                        >
                          📝 Add Note
                        </button>
                        <button
                          onClick={() => setShowTagModal(true)}
                          className={styles.secondaryButton}
                        >
                          🏷️ Add Tag
                        </button>
                        <button
                          onClick={() => setShowEditModal(true)}
                          className={styles.secondaryButton}
                        >
                          ✏️ Edit Customer
                        </button>
                        <button
                          onClick={() => setShowMergeModal(true)}
                          className={styles.secondaryButton}
                        >
                          🔀 Merge Customers
                        </button>
                        {customer.status !== 'FLAGGED' && (
                          <button
                            onClick={() => handleCustomerAction('FLAG')}
                            className={styles.secondaryButton}
                          >
                            🚩 Flag Customer
                          </button>
                        )}
                        {customer.status !== 'BLOCKED' && (
                          <button
                            onClick={() => handleCustomerAction('BLOCK')}
                            className={styles.secondaryButton}
                            style={{ color: '#dc3232' }}
                          >
                            🚫 Block Customer
                          </button>
                        )}
                        {customer.status === 'BLOCKED' && (
                          <button
                            onClick={() => handleCustomerAction('UNBLOCK')}
                            className={styles.primaryButton}
                            style={{ background: '#46b450' }}
                          >
                            ✓ Unblock Customer
                          </button>
                        )}
                        <button
                          onClick={handleExportData}
                          className={styles.secondaryButton}
                        >
                          📥 Export Data
                        </button>
                        <button
                          onClick={handleAnonymizeData}
                          className={styles.secondaryButton}
                          style={{ color: '#dc3232' }}
                        >
                          🗑️ Anonymize Data
                        </button>
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
                              <td>
                                <Link
                                  href={`/admin/bookings?booking=${booking.bookingNumber}`}
                                  style={{ color: '#39413f', textDecoration: 'none', fontWeight: 600 }}
                                >
                                  {booking.bookingNumber}
                                </Link>
                              </td>
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
                            <tr
                              key={order.id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => window.open(`/admin/orders?order=${order.orderNumber}`, '_blank')}
                            >
                              <td>
                                <Link
                                  href={`/admin/orders?order=${order.orderNumber}`}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ color: '#39413f', textDecoration: 'none', fontWeight: 600 }}
                                >
                                  {order.orderNumber}
                                </Link>
                              </td>
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

            {activeTab === 'financial' && (
              <div className={styles.financialTab}>
                <div className={styles.card}>
                  <h2 className={styles.sectionTitle}>Financial Summary</h2>
                  {statistics && (
                    <div className={styles.profileGrid} style={{ marginTop: '24px' }}>
                      <div className={styles.profileItem}>
                        <label>Total Lifetime Spend</label>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#39413f' }}>
                          {formatCurrency(statistics.totalSpent)}
                        </div>
                      </div>
                      <div className={styles.profileItem}>
                        <label>Average Spend Per Visit</label>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                          {formatCurrency(statistics.avgSpendPerVisit || 0)}
                        </div>
                      </div>
                      <div className={styles.profileItem}>
                        <label>Discounts Used</label>
                        <div>{formatCurrency(statistics.discountsUsed || 0)}</div>
                      </div>
                      <div className={styles.profileItem}>
                        <label>Refunds Issued</label>
                        <div style={{ color: statistics.refundAmount > 0 ? '#dc3232' : '#39413f' }}>
                          {formatCurrency(statistics.refundAmount || 0)} ({statistics.refundCount || 0} refunds)
                        </div>
                      </div>
                      <div className={styles.profileItem}>
                        <label>Outstanding Balance</label>
                        <div>{formatCurrency(statistics.outstandingBalance || 0)}</div>
                      </div>
                      <div className={styles.profileItem}>
                        <label>First Visit Date</label>
                        <div>{statistics.firstVisitDate ? formatDate(statistics.firstVisitDate) : 'N/A'}</div>
                      </div>
                      <div className={styles.profileItem}>
                        <label>Last Visit Date</label>
                        <div>{statistics.lastBookingDate ? formatDate(statistics.lastBookingDate) : 'Never'}</div>
                      </div>
                      <div className={styles.profileItem}>
                        <label>Total Visits</label>
                        <div>{(statistics.totalBookings || 0) + (statistics.totalOrders || 0)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className={styles.preferencesTab}>
                <div className={styles.card}>
                  <h2 className={styles.sectionTitle}>Preferences & Notes</h2>
                  
                  <div style={{ marginTop: '24px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>Service Preferences</h3>
                    {preferences?.preferredServices && preferences.preferredServices.length > 0 ? (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {preferences.preferredServices.map((service: string, idx: number) => (
                          <span key={idx} className={styles.membershipBadge}>{service}</span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#6c757d' }}>No service preferences set</p>
                    )}
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>Barber Preferences</h3>
                    {preferences?.preferredBarbers && preferences.preferredBarbers.length > 0 ? (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {preferences.preferredBarbers.map((barber: string, idx: number) => (
                          <span key={idx} className={styles.membershipBadge}>{barber}</span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#6c757d' }}>No barber preferences set</p>
                    )}
                  </div>

                  {(preferences?.allergies || customer.allergies) && (
                    <div style={{ marginTop: '24px' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>Allergies / Sensitivities</h3>
                      <p>{preferences?.allergies || customer.allergies}</p>
                    </div>
                  )}

                  {preferences?.sensitivities && (
                    <div style={{ marginTop: '24px' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>Sensitivities</h3>
                      <p>{preferences.sensitivities}</p>
                    </div>
                  )}

                  {preferences?.specialRequests && (
                    <div style={{ marginTop: '24px' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>Special Requests</h3>
                      <p>{preferences.specialRequests}</p>
                    </div>
                  )}

                  <div style={{ marginTop: '32px', borderTop: '1px solid #e5e5e5', paddingTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Internal Notes</h3>
                      <button onClick={() => setShowNoteModal(true)} className={styles.primaryButton}>
                        + Add Note
                      </button>
                    </div>
                    {notes.length === 0 ? (
                      <p style={{ color: '#6c757d' }}>No notes yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {notes.map((note: any) => (
                          <div
                            key={note.id}
                            style={{
                              padding: '16px',
                              background: '#f8f9fa',
                              borderRadius: '8px',
                              border: '1px solid #e5e5e5',
                            }}
                          >
                            <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '8px' }}>
                              {formatDateTime(note.createdAt)} • {note.isInternal ? 'Internal' : 'Public'}
                            </div>
                            <div style={{ color: '#39413f' }}>{note.note}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'communications' && (
              <div className={styles.communicationsTab}>
                <div className={styles.card}>
                  <h2 className={styles.sectionTitle}>Communication History</h2>
                  {communications.length === 0 ? (
                    <div className={styles.emptyState}>No communications found</div>
                  ) : (
                    <div className={styles.tableWrap} style={{ marginTop: '24px' }}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Channel</th>
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Sent At</th>
                            <th>Delivered At</th>
                            <th>Opt-In</th>
                          </tr>
                        </thead>
                        <tbody>
                          {communications.map((comm: any) => (
                            <tr key={comm.id}>
                              <td>{comm.type}</td>
                              <td>{comm.channel}</td>
                              <td>{comm.subject || 'N/A'}</td>
                              <td>
                                <span className={`${styles.statusBadge} ${styles[`status${comm.status}`]}`}>
                                  {comm.status}
                                </span>
                              </td>
                              <td>{comm.sentAt ? formatDateTime(comm.sentAt) : 'N/A'}</td>
                              <td>{comm.deliveredAt ? formatDateTime(comm.deliveredAt) : 'N/A'}</td>
                              <td>
                                <span className={comm.optInStatus ? styles.statusActive : styles.statusInactive}>
                                  {comm.optInStatus ? 'Yes' : 'No'}
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

            {activeTab === 'audit' && (
              <div className={styles.auditTab}>
                <div className={styles.card}>
                  <h2 className={styles.sectionTitle}>Audit Log</h2>
                  {auditLogs.length === 0 ? (
                    <div className={styles.emptyState}>No audit logs found</div>
                  ) : (
                    <div className={styles.tableWrap} style={{ marginTop: '24px' }}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Action</th>
                            <th>Performed By</th>
                            <th>Reason</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map((log: any) => (
                            <tr key={log.id}>
                              <td>
                                <span className={styles.membershipBadge}>{log.action}</span>
                              </td>
                              <td>{log.performedBy?.name || 'Unknown'}</td>
                              <td>{log.reason || 'N/A'}</td>
                              <td>{formatDateTime(log.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNoteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Add Internal Note</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter note..."
              rows={5}
              className={styles.noteTextarea}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={handleAddNote}
                disabled={addingNote || !noteText.trim()}
                className={styles.primaryButton}
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText('');
                }}
                className={styles.secondaryButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tag Modal */}
      {showTagModal && (
        <div className={styles.modalOverlay} onClick={() => setShowTagModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Add Tag</h3>
            <input
              type="text"
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              placeholder="Enter tag name..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                fontSize: '0.95rem',
                marginBottom: '12px',
              }}
            />
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
                Tag Color (optional)
              </label>
              <input
                type="color"
                value={tagColor}
                onChange={(e) => setTagColor(e.target.value)}
                style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #e5e5e5' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleAddTag}
                disabled={addingTag || !tagText.trim()}
                className={styles.primaryButton}
              >
                {addingTag ? 'Adding...' : 'Add Tag'}
              </button>
              <button
                onClick={() => {
                  setShowTagModal(false);
                  setTagText('');
                  setTagColor('#e5e5e5');
                }}
                className={styles.secondaryButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3>Edit Customer</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
                  Preferred Branch
                </label>
                <input
                  type="text"
                  value={editForm.preferredBranch}
                  onChange={(e) => setEditForm({ ...editForm, preferredBranch: e.target.value })}
                  placeholder="Enter preferred branch..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
                  Membership Type
                </label>
                <select
                  value={editForm.membershipType}
                  onChange={(e) => setEditForm({ ...editForm, membershipType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                  }}
                >
                  <option value="BASIC">Basic</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
                  Allergies
                </label>
                <textarea
                  value={editForm.allergies}
                  onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                  placeholder="Enter allergies..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={handleEditCustomer}
                disabled={editing}
                className={styles.primaryButton}
              >
                {editing ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className={styles.secondaryButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Customers Modal */}
      {showMergeModal && (
        <div className={styles.modalOverlay} onClick={() => setShowMergeModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Merge Customers</h3>
            <p style={{ color: '#6c757d', marginBottom: '16px', fontSize: '0.875rem' }}>
              This will merge another customer into this one. All data from the other customer will be transferred to this customer.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
                Customer ID to Merge With
              </label>
              <input
                type="text"
                value={mergeCustomerId}
                onChange={(e) => setMergeCustomerId(e.target.value)}
                placeholder="Enter customer ID..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleMergeCustomers}
                disabled={merging || !mergeCustomerId.trim()}
                className={styles.primaryButton}
                style={{ background: '#dc3232' }}
              >
                {merging ? 'Merging...' : 'Merge Customers'}
              </button>
              <button
                onClick={() => {
                  setShowMergeModal(false);
                  setMergeCustomerId('');
                }}
                className={styles.secondaryButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
