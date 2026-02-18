'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuth, isAdmin } from '@/lib/auth';
import Image from 'next/image';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import styles from './barbers.module.css';

type BarberMetrics = {
  summary: {
    totalBarbers: number;
    activeBarbers: number;
    inactiveBarbers: number;
    suspendedBarbers: number;
    barbersWorkingToday: number;
    averageRating: number;
    totalRevenue: number;
    avgOrdersPerBarber: number;
    noShowRate: number;
  };
  barbers: Barber[];
};

type Barber = {
  id: string;
  barberId: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  isOnline: boolean;
  state: string | null;
  city: string | null;
  address: string | null;
  specialties: string[];
  ratingAvg: number;
  totalReviews: number;
  totalBookings: number;
  totalOrders: number;
  revenue: number;
  revenuePerDay: number;
  noShowRate: number;
  lastActiveDate: string;
  createdAt: string;
  experienceYears: number | null;
  commissionRate: number;
};

export default function AdminBarbersPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<BarberMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBarber, setEditingBarber] = useState<string | null>(null);
  const [decliningAppId, setDecliningAppId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Action modals
  const [actionBarber, setActionBarber] = useState<Barber | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | 'terminate' | null>(null);
  const [actionReason, setActionReason] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    loadData();
  }, [statusFilter, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMetrics(),
        loadApplications(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetchAuth(`/api/v1/admin/barbers/metrics?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  const loadApplications = async () => {
    try {
      const response = await fetchAuth('/api/v1/admin/barber-applications');
      const data = await response.json();
      if (data.success) {
        setApplications(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    }
  };

  const handleApproveApplication = async (applicationId: string) => {
    if (!confirm('Approve this application and create barber account? The barber will receive an email with a password setup link.')) return;

    try {
      const response = await fetchAuth(`/api/v1/admin/barber-applications/${applicationId}/approve`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        alert('Application approved! The barber has been sent an email with a password setup link.');
        loadData();
      } else {
        alert(data.error?.message || 'Failed to approve application');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetchAuth('/api/v1/admin/barbers/invite', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Invitation sent successfully! The staff member will receive an email with a link to complete their application.');
        setShowAddForm(false);
        setFormData({ name: '', email: '' });
        loadMetrics();
      } else {
        alert(data.error?.message || 'Failed to send invitation');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while sending invitation');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
    });
  };

  const handleDeclineApplication = async (applicationId: string) => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining this application');
      return;
    }

    if (!confirm('Are you sure you want to decline this application? The applicant will receive an email with the decline reason.')) return;

    setDeclining(true);
    try {
      const response = await fetchAuth(`/api/v1/admin/barber-applications/${applicationId}/decline`, {
        method: 'POST',
        body: JSON.stringify({ declineReason: declineReason.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Application declined. The applicant has been notified via email.');
        setDecliningAppId(null);
        setDeclineReason('');
        loadApplications();
      } else {
        alert(data.error?.message || 'Failed to decline application');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setDeclining(false);
    }
  };

  const handleBarberAction = async () => {
    if (!actionBarber || !actionType) return;

    if ((actionType === 'suspend' || actionType === 'terminate') && !actionReason.trim()) {
      alert('Please provide a reason for this action');
      return;
    }

    const confirmMessage = actionType === 'suspend' 
      ? `Suspend ${actionBarber.name}? This will deactivate their account.`
      : actionType === 'terminate'
      ? `Terminate ${actionBarber.name}? This action cannot be undone.`
      : `Activate ${actionBarber.name}?`;

    if (!confirm(confirmMessage)) return;

    try {
      const endpoint = actionType === 'suspend' 
        ? `/api/v1/admin/barbers/${actionBarber.id}/suspend`
        : actionType === 'terminate'
        ? `/api/v1/admin/barbers/${actionBarber.id}/terminate`
        : `/api/v1/admin/barbers/${actionBarber.id}/activate`;

      const body = (actionType === 'suspend' || actionType === 'terminate') 
        ? { reason: actionReason.trim() }
        : {};

      const response = await fetchAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        alert(data.data.message || 'Action completed successfully');
        setActionBarber(null);
        setActionType(null);
        setActionReason('');
        loadMetrics();
      } else {
        alert(data.error?.message || 'Failed to perform action');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return styles.statusActive;
      case 'INACTIVE':
        return styles.statusInactive;
      case 'SUSPENDED':
        return styles.statusSuspended;
      case 'PENDING_APPROVAL':
        return styles.statusPending;
      default:
        return styles.statusInactive;
    }
  };

  if (loading && !metrics) {
    return <div className={styles.loading}>Loading staff management...</div>;
  }

  const filteredBarbers = metrics?.barbers || [];

  // New staff: added in the last 1 month. Old staff: more than 1 month ago.
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneMonthAgoStr = oneMonthAgo.toISOString();
  const newStaff = filteredBarbers.filter((b) => (b.createdAt || '') >= oneMonthAgoStr);
  const oldStaff = filteredBarbers.filter((b) => (b.createdAt || '') < oneMonthAgoStr);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <div>
            <AdminBreadcrumbs items={[{ label: 'Dashboard', href: '/admin' }, { label: 'Staff' }]} />
            <h1 className={styles.pageTitle}>Staff</h1>
            <p className={styles.pageSubtitle}>Manage staff, track performance, and review applications.</p>
          </div>
          {isAdmin() && (
            <button onClick={() => setShowAddForm(!showAddForm)} className={styles.addButton}>
              {showAddForm ? 'Cancel' : '+ Add Staff'}
            </button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {/* High-Level Summary Metrics */}
        {metrics && (
          <section className={styles.metricsSection}>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total Active Staff</div>
                <div className={styles.metricValue}>{metrics.summary.activeBarbers}</div>
                <div className={styles.metricSubtext}>of {metrics.summary.totalBarbers} total</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Inactive / Suspended</div>
                <div className={styles.metricValue}>{metrics.summary.inactiveBarbers + metrics.summary.suspendedBarbers}</div>
                <div className={styles.metricSubtext}>
                  {metrics.summary.inactiveBarbers} inactive, {metrics.summary.suspendedBarbers} suspended staff
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Working Today</div>
                <div className={styles.metricValue}>{metrics.summary.barbersWorkingToday}</div>
                <div className={styles.metricSubtext}>Currently active</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Average Rating</div>
                <div className={styles.metricValue}>{metrics.summary.averageRating.toFixed(1)}</div>
                <div className={styles.metricSubtext}>Across all staff</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total Revenue</div>
                <div className={styles.metricValue}>{formatCurrency(metrics.summary.totalRevenue)}</div>
                <div className={styles.metricSubtext}>All time</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Avg Orders/Staff</div>
                <div className={styles.metricValue}>{metrics.summary.avgOrdersPerBarber.toFixed(1)}</div>
                <div className={styles.metricSubtext}>Average per staff member</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>No-Show / Late Rate</div>
                <div className={styles.metricValue}>{metrics.summary.noShowRate.toFixed(1)}%</div>
                <div className={styles.metricSubtext}>Cancellation rate</div>
              </div>
            </div>
          </section>
        )}

        {/* Filters */}
        <section className={styles.filtersSection}>
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            {(startDate || endDate || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setStatusFilter('ALL');
                }}
                className={styles.clearFiltersButton}
              >
                Clear Filters
              </button>
            )}
          </div>
        </section>

        {/* Applications Section */}
        {applications.length > 0 && (
          <section className={styles.section}>
            <h2>Pending Applications ({applications.length})</h2>
            <div className={styles.applicationsList}>
              {applications.map((app) => (
                <div key={app.id} className={styles.applicationCard}>
                  <div className={styles.appHeader}>
                    <div>
                      <strong>{app.name}</strong>
                      <span>{app.email}</span>
                      <span>{app.phone}</span>
                    </div>
                    <div>
                      <span className={styles.statusBadge}>{app.status}</span>
                    </div>
                  </div>
                  <div className={styles.appDetails}>
                    <p><strong>Location:</strong> {app.state || 'N/A'}, {app.city || 'N/A'} - {app.address}</p>
                    {app.experienceYears && <p><strong>Experience:</strong> {app.experienceYears} years</p>}
                  </div>
                  {app.status === 'PENDING' && decliningAppId !== app.id && isAdmin() && (
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => handleApproveApplication(app.id)}
                        className={styles.approveButton}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => setDecliningAppId(app.id)}
                        className={styles.declineButton}
                      >
                        ✗ Decline
                      </button>
                    </div>
                  )}
                  {app.status === 'PENDING' && decliningAppId === app.id && isAdmin() && (
                    <div className={styles.declineForm}>
                      <textarea
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="Enter reason for declining this application..."
                        rows={4}
                        className={styles.declineReasonInput}
                      />
                      <div className={styles.declineActions}>
                        <button
                          onClick={() => handleDeclineApplication(app.id)}
                          disabled={declining || !declineReason.trim()}
                          className={styles.confirmDeclineButton}
                        >
                          {declining ? 'Declining...' : 'Confirm Decline'}
                        </button>
                        <button
                          onClick={() => {
                            setDecliningAppId(null);
                            setDeclineReason('');
                          }}
                          disabled={declining}
                          className={styles.cancelDeclineButton}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* New Staff (added in last 1 month) */}
        <section className={styles.section}>
          <h2>New Staff ({newStaff.length})</h2>
          <p className={styles.sectionSubtitle}>Added in the last 1 month</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Name & Photo</th>
                  <th>Employment Status</th>
                  <th>Skills / Services</th>
                  <th>Rating</th>
                  <th>Total Orders</th>
                  <th>Revenue/Day</th>
                  <th>No-Show Rate</th>
                  <th>Last Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {newStaff.map((barber) => (
                  <tr key={barber.id}>
                    <td className={styles.barberId}>{barber.barberId}</td>
                    <td className={styles.namePhotoCell}>
                      <div className={styles.barberInfo}>
                        {barber.avatarUrl ? (
                          <Image
                            src={barber.avatarUrl}
                            alt={barber.name}
                            width={40}
                            height={40}
                            className={styles.barberAvatar}
                            unoptimized
                          />
                        ) : (
                          <div className={styles.barberAvatarPlaceholder}>
                            {barber.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className={styles.barberName}>{barber.name}</div>
                          <div className={styles.barberEmail}>{barber.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(barber.status)}`}>
                        {barber.status.replace('_', ' ')}
                      </span>
                      {barber.isOnline && <span className={styles.onlineBadge}>Online</span>}
                    </td>
                    <td>
                      <div className={styles.specialties}>
                        {barber.specialties.length > 0 ? (
                          barber.specialties.map((spec, idx) => (
                            <span key={idx} className={styles.specialtyTag}>{spec}</span>
                          ))
                        ) : (
                          <span className={styles.noSpecialties}>No skills listed</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.rating}>
                        <span className={styles.ratingStars}>
                          {'★'.repeat(Math.floor(barber.ratingAvg))}
                          {'☆'.repeat(5 - Math.floor(barber.ratingAvg))}
                        </span>
                        <span className={styles.ratingValue}>{barber.ratingAvg.toFixed(1)}</span>
                        <span className={styles.reviewCount}>({barber.totalReviews})</span>
                      </div>
                    </td>
                    <td>{barber.totalOrders}</td>
                    <td>{formatCurrency(barber.revenuePerDay)}</td>
                    <td>
                      <span className={barber.noShowRate > 10 ? styles.highNoShow : styles.lowNoShow}>
                        {barber.noShowRate.toFixed(1)}%
                      </span>
                    </td>
                    <td>{formatDate(barber.lastActiveDate)}</td>
                    <td>
                      <div className={styles.quickActions}>
                        <button
                          onClick={() => router.push(`/admin/barbers/${barber.id}`)}
                          className={styles.viewButton}
                          title="View Profile"
                        >
                          👁️
                        </button>
                        {isAdmin() && (
                          <>
                            {barber.status === 'ACTIVE' ? (
                              <button
                                onClick={() => {
                                  setActionBarber(barber);
                                  setActionType('suspend');
                                }}
                                className={styles.suspendButton}
                                title="Suspend"
                              >
                                ⏸️
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setActionBarber(barber);
                                  setActionType('activate');
                                }}
                                className={styles.activateButton}
                                title="Activate"
                              >
                                ▶️
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setActionBarber(barber);
                                setActionType('terminate');
                              }}
                              className={styles.terminateButton}
                              title="Terminate"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {newStaff.length === 0 && (
              <div className={styles.empty}>No new staff in the last 1 month.</div>
            )}
          </div>
        </section>

        {/* Old Staff (added more than 1 month ago) */}
        <section className={styles.section}>
          <h2>Old Staff ({oldStaff.length})</h2>
          <p className={styles.sectionSubtitle}>Added more than 1 month ago</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Name & Photo</th>
                  <th>Employment Status</th>
                  <th>Skills / Services</th>
                  <th>Rating</th>
                  <th>Total Orders</th>
                  <th>Revenue/Day</th>
                  <th>No-Show Rate</th>
                  <th>Last Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {oldStaff.map((barber) => (
                  <tr key={barber.id}>
                    <td className={styles.barberId}>{barber.barberId}</td>
                    <td className={styles.namePhotoCell}>
                      <div className={styles.barberInfo}>
                        {barber.avatarUrl ? (
                          <Image
                            src={barber.avatarUrl}
                            alt={barber.name}
                            width={40}
                            height={40}
                            className={styles.barberAvatar}
                            unoptimized
                          />
                        ) : (
                          <div className={styles.barberAvatarPlaceholder}>
                            {barber.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className={styles.barberName}>{barber.name}</div>
                          <div className={styles.barberEmail}>{barber.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(barber.status)}`}>
                        {barber.status.replace('_', ' ')}
                      </span>
                      {barber.isOnline && <span className={styles.onlineBadge}>Online</span>}
                    </td>
                    <td>
                      <div className={styles.specialties}>
                        {barber.specialties.length > 0 ? (
                          barber.specialties.map((spec, idx) => (
                            <span key={idx} className={styles.specialtyTag}>{spec}</span>
                          ))
                        ) : (
                          <span className={styles.noSpecialties}>No skills listed</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.rating}>
                        <span className={styles.ratingStars}>
                          {'★'.repeat(Math.floor(barber.ratingAvg))}
                          {'☆'.repeat(5 - Math.floor(barber.ratingAvg))}
                        </span>
                        <span className={styles.ratingValue}>{barber.ratingAvg.toFixed(1)}</span>
                        <span className={styles.reviewCount}>({barber.totalReviews})</span>
                      </div>
                    </td>
                    <td>{barber.totalOrders}</td>
                    <td>{formatCurrency(barber.revenuePerDay)}</td>
                    <td>
                      <span className={barber.noShowRate > 10 ? styles.highNoShow : styles.lowNoShow}>
                        {barber.noShowRate.toFixed(1)}%
                      </span>
                    </td>
                    <td>{formatDate(barber.lastActiveDate)}</td>
                    <td>
                      <div className={styles.quickActions}>
                        <button
                          onClick={() => router.push(`/admin/barbers/${barber.id}`)}
                          className={styles.viewButton}
                          title="View Profile"
                        >
                          👁️
                        </button>
                        {isAdmin() && (
                          <>
                            {barber.status === 'ACTIVE' ? (
                              <button
                                onClick={() => {
                                  setActionBarber(barber);
                                  setActionType('suspend');
                                }}
                                className={styles.suspendButton}
                                title="Suspend"
                              >
                                ⏸️
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setActionBarber(barber);
                                  setActionType('activate');
                                }}
                                className={styles.activateButton}
                                title="Activate"
                              >
                                ▶️
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setActionBarber(barber);
                                setActionType('terminate');
                              }}
                              className={styles.terminateButton}
                              title="Terminate"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {oldStaff.length === 0 && (
              <div className={styles.empty}>No old staff (all staff were added in the last 1 month).</div>
            )}
          </div>
        </section>
      </main>

      {/* Action Modal */}
      {actionBarber && actionType && (
        <div className={styles.modalOverlay} onClick={() => {
          setActionBarber(null);
          setActionType(null);
          setActionReason('');
        }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>
              {actionType === 'suspend' && 'Suspend Staff'}
              {actionType === 'terminate' && 'Terminate Staff'}
              {actionType === 'activate' && 'Activate Staff'}
            </h3>
            <p>
              {actionType === 'suspend' && `Are you sure you want to suspend ${actionBarber.name}?`}
              {actionType === 'terminate' && `Are you sure you want to terminate ${actionBarber.name}? This action cannot be undone.`}
              {actionType === 'activate' && `Activate ${actionBarber.name}?`}
            </p>
            {(actionType === 'suspend' || actionType === 'terminate') && (
              <div className={styles.modalFormGroup}>
                <label>Reason *</label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                  rows={4}
                  required
                  className={styles.modalTextarea}
                />
              </div>
            )}
            <div className={styles.modalActions}>
              <button
                onClick={handleBarberAction}
                disabled={(actionType === 'suspend' || actionType === 'terminate') && !actionReason.trim()}
                className={actionType === 'terminate' ? styles.modalTerminateButton : styles.modalConfirmButton}
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setActionBarber(null);
                  setActionType(null);
                  setActionReason('');
                }}
                className={styles.modalCancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Form */}
      {showAddForm && isAdmin() && (
        <section className={styles.formSection}>
          <h2>Add New Staff</h2>
          <p style={{ marginBottom: '24px', color: '#6c757d' }}>
            Enter the staff member's name and email. They will receive an invitation email with a link to complete their application.
          </p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton}>
                Send Invitation
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingBarber(null);
                  setFormData({ name: '', email: '' });
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
