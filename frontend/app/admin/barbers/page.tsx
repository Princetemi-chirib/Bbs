'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchAuth, isAdmin, hasRole } from '@/lib/auth';
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
  const searchParams = useSearchParams();
  const [metrics, setMetrics] = useState<BarberMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBarber, setEditingBarber] = useState<string | null>(null);
  const [reviewingApplication, setReviewingApplication] = useState<any | null>(null);
  const [recruitmentHistory, setRecruitmentHistory] = useState<any[]>([]);
  const [applicationHistory, setApplicationHistory] = useState<any[]>([]);
  const [showAddRecruitmentModal, setShowAddRecruitmentModal] = useState(false);
  const [addRecruitmentForm, setAddRecruitmentForm] = useState({
    firstName: '', lastName: '', otherName: '', email: '', phone: '', address: '', state: '', city: '',
    ninNumber: '', gender: '', maritalStatus: '', dateOfBirth: '', experienceYears: '', barberLicence: '',
    whyJoinNetwork: '', portfolioUrl: '', applicationLetterUrl: '', cvUrl: '',
  });
  const [addingRecruitment, setAddingRecruitment] = useState(false);
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null);
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

  // Deep link: open add recruitment modal when ?add=recruitment
  useEffect(() => {
    if (searchParams?.get('add') === 'recruitment' && isAdmin()) {
      setShowAddRecruitmentModal(true);
    }
  }, [searchParams]);

  // Deep link: scroll to recruitment section when ?section=recruitment
  useEffect(() => {
    if (searchParams?.get('section') !== 'recruitment') return;
    const el = document.getElementById('section-recruitment');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams, loading]);

  // Staff Target Tracking: when view tab changes, scroll to top so the selected section is visible
  useEffect(() => {
    const view = searchParams?.get('view') ?? '';
    if (hasRole('REP') && ['', 'talent', 'ratings', 'location'].includes(view)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchParams?.get('view')]);


  const loadData = async () => {
    try {
      setLoading(true);
      await loadMetrics();
      if (isAdmin()) {
        await loadApplications();
        loadRecruitmentHistory();
      }
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

  const loadRecruitmentHistory = async () => {
    try {
      const response = await fetchAuth('/api/v1/admin/barber-applications/history?limit=30');
      const data = await response.json();
      if (data.success) setRecruitmentHistory(data.data || []);
    } catch (err) {
      console.error('Failed to load recruitment history:', err);
    }
  };

  const loadApplicationHistory = async (applicationId: string) => {
    try {
      const response = await fetchAuth(`/api/v1/admin/barber-applications/${applicationId}/history`);
      const data = await response.json();
      if (data.success) setApplicationHistory(data.data || []);
      else setApplicationHistory([]);
    } catch {
      setApplicationHistory([]);
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
        setReviewingApplication(null);
        loadData();
        loadRecruitmentHistory();
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
        setReviewingApplication(null);
        setDecliningAppId(null);
        setDeclineReason('');
        loadData();
        loadRecruitmentHistory();
      } else {
        alert(data.error?.message || 'Failed to decline application');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setDeclining(false);
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (!confirm('Delete this recruitment record? This cannot be undone.')) return;
    setDeletingAppId(applicationId);
    try {
      const response = await fetchAuth(`/api/v1/admin/barber-applications/${applicationId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setReviewingApplication(null);
        loadData();
        loadRecruitmentHistory();
      } else {
        alert(data.error?.message || 'Failed to delete');
      }
    } catch (err: any) {
      alert(err?.message || 'An error occurred');
    } finally {
      setDeletingAppId(null);
    }
  };

  const handleAddRecruitment = async (e: React.FormEvent) => {
    e.preventDefault();
    const { firstName, lastName, email, phone, address } = addRecruitmentForm;
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim() || !address?.trim()) {
      alert('First name, last name, email, phone, and address are required.');
      return;
    }
    setAddingRecruitment(true);
    try {
      const response = await fetchAuth('/api/v1/admin/barber-applications/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addRecruitmentForm,
          experienceYears: addRecruitmentForm.experienceYears ? parseInt(String(addRecruitmentForm.experienceYears), 10) : null,
          dateOfBirth: addRecruitmentForm.dateOfBirth || undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Recruitment record created. You can review and approve or decline it from the list.');
        setShowAddRecruitmentModal(false);
        setAddRecruitmentForm({
          firstName: '', lastName: '', otherName: '', email: '', phone: '', address: '', state: '', city: '',
          ninNumber: '', gender: '', maritalStatus: '', dateOfBirth: '', experienceYears: '', barberLicence: '',
          whyJoinNetwork: '', portfolioUrl: '', applicationLetterUrl: '', cvUrl: '',
        });
        loadData();
        loadRecruitmentHistory();
      } else {
        alert(data.error?.message || 'Failed to create');
      }
    } catch (err: any) {
      alert(err?.message || 'An error occurred');
    } finally {
      setAddingRecruitment(false);
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
  const isRepView = hasRole('REP') && !isAdmin();
  const viewMode = searchParams?.get('view') || '';

  // For REP: talent list = sorted by rating then bookings; location = group by city/state
  const talentOrderedBarbers = [...filteredBarbers].sort((a, b) => {
    if (b.ratingAvg !== a.ratingAvg) return b.ratingAvg - a.ratingAvg;
    return (b.totalBookings || 0) - (a.totalBookings || 0);
  });
  const locationGroups = filteredBarbers.reduce<Record<string, Barber[]>>((acc, b) => {
    const key = [b.state || '', b.city || 'Unknown'].filter(Boolean).join(', ') || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

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
            <AdminBreadcrumbs items={[{ label: 'Dashboard', href: '/admin' }, { label: isRepView ? 'Staff Target Tracking' : 'Staff' }]} />
            <h1 className={styles.pageTitle}>{isRepView ? 'Staff Target Tracking' : 'Staff'}</h1>
            <p className={styles.pageSubtitle}>
              {isRepView ? 'Track staff count, talent, ratings, and locations.' : 'Manage staff, track performance, and review applications.'}
            </p>
          </div>
          {isAdmin() && (
            <button onClick={() => setShowAddForm(!showAddForm)} className={styles.addButton}>
              {showAddForm ? 'Cancel' : '+ Add Staff'}
            </button>
          )}
        </div>
        {isRepView && (
          <nav className={styles.viewTabs} aria-label="Staff views">
            <Link href="/admin/barbers" className={viewMode === '' ? styles.viewTabActive : styles.viewTab}>Total staff</Link>
            <Link href="/admin/barbers?view=talent" className={viewMode === 'talent' ? styles.viewTabActive : styles.viewTab}>Staff talent list</Link>
            <Link href="/admin/barbers?view=ratings" className={viewMode === 'ratings' ? styles.viewTabActive : styles.viewTab}>Average rating</Link>
            <span className={styles.viewTabComingSoon} aria-disabled="true">Location tracking (Coming soon)</span>
          </nav>
        )}
      </header>

      <main className={styles.main}>
        {/* Add Staff Form - at top so visible without scrolling */}
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
              {metrics.summary.totalRevenue != null && (
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Total Revenue</div>
                  <div className={styles.metricValue}>{formatCurrency(metrics.summary.totalRevenue)}</div>
                  <div className={styles.metricSubtext}>All time</div>
                </div>
              )}
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

        {/* REP: Staff talent list view */}
        {isRepView && viewMode === 'talent' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Staff talent list</h2>
            <p className={styles.sectionSubtitle}>Sorted by rating and then by number of bookings (top performers first).</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Rating</th>
                    <th>Reviews</th>
                    <th>Bookings</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {talentOrderedBarbers.map((barber) => (
                    <tr key={barber.id}>
                      <td className={styles.barberNameCell}>
                        <div className={styles.barberInfo}>
                          {barber.avatarUrl ? (
                            <Image src={barber.avatarUrl} alt="" width={36} height={36} className={styles.barberAvatar} unoptimized />
                          ) : (
                            <div className={styles.barberAvatarPlaceholder}>{barber.name.charAt(0).toUpperCase()}</div>
                          )}
                          <span>{barber.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.ratingValue}>{barber.ratingAvg.toFixed(1)}</span>
                        <span className={styles.ratingStars}>
                          {'★'.repeat(Math.floor(barber.ratingAvg))}{'☆'.repeat(5 - Math.floor(barber.ratingAvg))}
                        </span>
                      </td>
                      <td>{barber.totalReviews}</td>
                      <td>{barber.totalBookings ?? barber.totalOrders}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusBadgeClass(barber.status)}`}>{barber.status.replace('_', ' ')}</span>
                      </td>
                      <td>
                        <button type="button" onClick={() => router.push(`/admin/barbers/${barber.id}`)} className={styles.viewButton} title="View profile">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {talentOrderedBarbers.length === 0 && <p className={styles.emptyRecruitment}>No staff data.</p>}
          </section>
        )}

        {/* REP: Average rating view */}
        {isRepView && viewMode === 'ratings' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Average rating</h2>
            <p className={styles.sectionSubtitle}>Staff ranked by customer rating and review count.</p>
            {metrics && (
              <div className={styles.repRatingSummary}>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Overall average</div>
                  <div className={styles.metricValue}>{metrics.summary.averageRating.toFixed(1)}</div>
                  <div className={styles.metricSubtext}>Out of 5.0</div>
                </div>
              </div>
            )}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Rating</th>
                    <th>Review count</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredBarbers].sort((a, b) => b.ratingAvg - a.ratingAvg).map((barber) => (
                    <tr key={barber.id}>
                      <td className={styles.barberNameCell}>
                        <div className={styles.barberInfo}>
                          {barber.avatarUrl ? (
                            <Image src={barber.avatarUrl} alt="" width={36} height={36} className={styles.barberAvatar} unoptimized />
                          ) : (
                            <div className={styles.barberAvatarPlaceholder}>{barber.name.charAt(0).toUpperCase()}</div>
                          )}
                          <span>{barber.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.ratingValue}>{barber.ratingAvg.toFixed(1)}</span>
                        <span className={styles.ratingStars}>
                          {'★'.repeat(Math.floor(barber.ratingAvg))}{'☆'.repeat(5 - Math.floor(barber.ratingAvg))}
                        </span>
                      </td>
                      <td>{barber.totalReviews}</td>
                      <td>
                        <button type="button" onClick={() => router.push(`/admin/barbers/${barber.id}`)} className={styles.viewButton} title="View profile">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredBarbers.length === 0 && <p className={styles.emptyRecruitment}>No staff data.</p>}
          </section>
        )}

        {/* REP: Location tracking view - Coming soon */}
        {isRepView && viewMode === 'location' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Location tracking</h2>
            <p className={styles.sectionSubtitle}>This view is coming soon. Staff grouped by location (state, city) will be available here.</p>
            <div className={styles.comingSoonPlaceholder}>
              <p>Coming soon</p>
            </div>
          </section>
        )}

        {/* Filters, recruitment, and staff tables - hidden for REP when on talent/ratings/location view */}
        {(!isRepView || viewMode === '') && (
        <>
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

        {/* Staff recruitment: New (Pending) and Old (Approved/Declined) */}
        <section id="section-recruitment" className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <h2>Staff recruitment</h2>
            {isAdmin() && (
              <button
                type="button"
                onClick={() => setShowAddRecruitmentModal(true)}
                className={styles.addButton}
              >
                + Add new recruitment
              </button>
            )}
          </div>

          {/* New recruitment (Pending) */}
          <h3 className={styles.recruitmentSubheading}>New recruitment (pending)</h3>
          {applications.filter((a) => a.status === 'PENDING').length === 0 ? (
            <p className={styles.emptyRecruitment}>No pending applications.</p>
          ) : (
            <div className={styles.applicationsList}>
              {applications.filter((a) => a.status === 'PENDING').map((app) => (
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
                    {app.experienceYears != null && <p><strong>Experience:</strong> {app.experienceYears} years</p>}
                  </div>
                  {isAdmin() && (
                    <div className={styles.actionButtons}>
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingApplication(app);
                          loadApplicationHistory(app.id);
                        }}
                        className={styles.reviewButton}
                      >
                        Review application
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Old recruitment (Approved / Declined) */}
          <h3 className={styles.recruitmentSubheading}>Old recruitment (approved / declined)</h3>
          {applications.filter((a) => a.status !== 'PENDING').length === 0 ? (
            <p className={styles.emptyRecruitment}>No processed applications yet.</p>
          ) : (
            <div className={styles.applicationsList}>
              {applications.filter((a) => a.status !== 'PENDING').map((app) => (
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
                    {app.experienceYears != null && <p><strong>Experience:</strong> {app.experienceYears} years</p>}
                  </div>
                  {isAdmin() && (
                    <div className={styles.actionButtons}>
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingApplication(app);
                          loadApplicationHistory(app.id);
                        }}
                        className={styles.reviewButton}
                      >
                        View details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteApplication(app.id)}
                        disabled={deletingAppId === app.id}
                        className={styles.declineButton}
                      >
                        {deletingAppId === app.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Staff recruitment history */}
        {isAdmin() && recruitmentHistory.length > 0 && (
          <section className={styles.section}>
            <h2>Staff recruitment history</h2>
            <p className={styles.sectionSubtitle}>Recent actions on recruitment applications</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date & time</th>
                    <th>Application</th>
                    <th>Action</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {recruitmentHistory.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.performedAt).toLocaleString()}</td>
                      <td>
                        <span>{log.applicationName || '—'}</span>
                        <span className={styles.historyEmail}>{log.applicationEmail}</span>
                      </td>
                      <td><span className={styles.statusBadge}>{log.action}</span></td>
                      <td>{log.performedBy?.name || log.performedBy?.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  {isAdmin() && <th>Revenue/Day</th>}
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
                    {isAdmin() && <td>{formatCurrency(barber.revenuePerDay)}</td>}
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
                  {isAdmin() && <th>Revenue/Day</th>}
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
                    {isAdmin() && <td>{formatCurrency(barber.revenuePerDay)}</td>}
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
        </>
        )}
      </main>

      {/* Review Application Modal - full details then Approve / Decline */}
      {reviewingApplication && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setReviewingApplication(null);
            setDecliningAppId(null);
            setDeclineReason('');
          }}
        >
          <div className={styles.reviewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.reviewModalHeader}>
              <h2>Review application</h2>
              <button
                type="button"
                className={styles.reviewModalClose}
                onClick={() => {
                  setReviewingApplication(null);
                  setDecliningAppId(null);
                  setDeclineReason('');
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className={styles.reviewModalBody}>
              <section className={styles.reviewSection}>
                <h3>Personal</h3>
                <dl className={styles.reviewDl}>
                  <dt>Name</dt>
                  <dd>{reviewingApplication.name || `${reviewingApplication.firstName || ''} ${reviewingApplication.lastName || ''}`.trim() || '—'}</dd>
                  {reviewingApplication.otherName && (
                    <>
                      <dt>Other name</dt>
                      <dd>{reviewingApplication.otherName}</dd>
                    </>
                  )}
                  <dt>Email</dt>
                  <dd><a href={`mailto:${reviewingApplication.email}`}>{reviewingApplication.email}</a></dd>
                  <dt>Phone</dt>
                  <dd><a href={`tel:${reviewingApplication.phone}`}>{reviewingApplication.phone}</a></dd>
                  <dt>Date of birth</dt>
                  <dd>{reviewingApplication.dateOfBirth ? new Date(reviewingApplication.dateOfBirth).toLocaleDateString() : '—'}</dd>
                  <dt>Gender</dt>
                  <dd>{reviewingApplication.gender || '—'}</dd>
                  <dt>Marital status</dt>
                  <dd>{reviewingApplication.maritalStatus || '—'}</dd>
                  <dt>NIN</dt>
                  <dd>{reviewingApplication.ninNumber || '—'}</dd>
                </dl>
              </section>
              <section className={styles.reviewSection}>
                <h3>Location</h3>
                <dl className={styles.reviewDl}>
                  <dt>State</dt>
                  <dd>{reviewingApplication.state || '—'}</dd>
                  {reviewingApplication.city && (
                    <>
                      <dt>City</dt>
                      <dd>{reviewingApplication.city}</dd>
                    </>
                  )}
                  <dt>Address</dt>
                  <dd>{reviewingApplication.address || '—'}</dd>
                </dl>
              </section>
              <section className={styles.reviewSection}>
                <h3>Experience & skills</h3>
                <dl className={styles.reviewDl}>
                  <dt>Experience (years)</dt>
                  <dd>{reviewingApplication.experienceYears != null ? reviewingApplication.experienceYears : '—'}</dd>
                  <dt>Specialties</dt>
                  <dd>{Array.isArray(reviewingApplication.specialties) && reviewingApplication.specialties.length > 0 ? reviewingApplication.specialties.join(', ') : '—'}</dd>
                  <dt>Barber licence no.</dt>
                  <dd>{reviewingApplication.barberLicenceNumber || '—'}</dd>
                </dl>
              </section>
              <section className={styles.reviewSection}>
                <h3>Documents</h3>
                <dl className={styles.reviewDl}>
                  <dt>Application letter</dt>
                  <dd>
                    {reviewingApplication.applicationLetterUrl ? (
                      <a href={reviewingApplication.applicationLetterUrl} target="_blank" rel="noopener noreferrer">View / download</a>
                    ) : '—'}
                  </dd>
                  <dt>CV</dt>
                  <dd>
                    {reviewingApplication.cvUrl ? (
                      <a href={reviewingApplication.cvUrl} target="_blank" rel="noopener noreferrer">View / download</a>
                    ) : '—'}
                  </dd>
                  {reviewingApplication.portfolioUrl && (
                    <>
                      <dt>Portfolio</dt>
                      <dd><a href={reviewingApplication.portfolioUrl} target="_blank" rel="noopener noreferrer">View</a></dd>
                    </>
                  )}
                  {reviewingApplication.barberLicenceUrl && (
                    <>
                      <dt>Barber licence (file)</dt>
                      <dd><a href={reviewingApplication.barberLicenceUrl} target="_blank" rel="noopener noreferrer">View / download</a></dd>
                    </>
                  )}
                </dl>
              </section>
              <section className={styles.reviewSection}>
                <h3>Why join the network</h3>
                <p className={styles.reviewWhyJoin}>{reviewingApplication.whyJoinNetwork || '—'}</p>
              </section>
              <section className={styles.reviewSection}>
                <p className={styles.reviewMeta}>Applied {reviewingApplication.createdAt ? new Date(reviewingApplication.createdAt).toLocaleString() : '—'}</p>
              </section>
              {applicationHistory.length > 0 && (
                <section className={styles.reviewSection}>
                  <h3>History</h3>
                  <ul className={styles.reviewHistoryList}>
                    {applicationHistory.map((log) => (
                      <li key={log.id}>
                        <strong>{log.action}</strong>
                        {log.performedAt && ` — ${new Date(log.performedAt).toLocaleString()}`}
                        {log.performedBy?.name && ` by ${log.performedBy.name}`}
                        {log.metadata?.declineReason && (
                          <span className={styles.historyDeclineReason}> Reason: {String(log.metadata.declineReason)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
            <div className={styles.reviewModalFooter}>
              {reviewingApplication.status !== 'PENDING' ? (
                <p className={styles.reviewStatusNote}>This application is already {reviewingApplication.status.toLowerCase()}.</p>
              ) : decliningAppId !== reviewingApplication.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleApproveApplication(reviewingApplication.id)}
                    className={styles.approveButton}
                  >
                    ✓ Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecliningAppId(reviewingApplication.id)}
                    className={styles.declineButton}
                  >
                    ✗ Decline
                  </button>
                </>
              ) : (
                <div className={styles.reviewDeclineBlock}>
                  <label className={styles.reviewDeclineLabel}>Reason for declining *</label>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Enter reason for declining this application..."
                    rows={4}
                    className={styles.declineReasonInput}
                  />
                  <div className={styles.declineActions}>
                    <button
                      onClick={() => handleDeclineApplication(reviewingApplication.id)}
                      disabled={declining || !declineReason.trim()}
                      className={styles.confirmDeclineButton}
                    >
                      {declining ? 'Declining...' : 'Confirm Decline'}
                    </button>
                    <button
                      type="button"
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
              {isAdmin() && reviewingApplication.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => handleDeleteApplication(reviewingApplication.id)}
                  disabled={deletingAppId === reviewingApplication.id}
                  className={styles.reviewDeleteButton}
                >
                  {deletingAppId === reviewingApplication.id ? 'Deleting...' : 'Delete recruitment'}
                </button>
              )}
              <button
                type="button"
                className={styles.reviewModalCloseButton}
                onClick={() => {
                  setReviewingApplication(null);
                  setDecliningAppId(null);
                  setDeclineReason('');
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add new recruitment modal */}
      {showAddRecruitmentModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowAddRecruitmentModal(false)}
        >
          <div className={styles.reviewModal} style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.reviewModalHeader}>
              <h2>Add new recruitment</h2>
              <button type="button" className={styles.reviewModalClose} onClick={() => setShowAddRecruitmentModal(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleAddRecruitment} className={styles.reviewModalBody}>
              <p className={styles.sectionSubtitle}>Create a recruitment record manually. Required: first name, last name, email, phone, address.</p>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>First name *</label>
                  <input value={addRecruitmentForm.firstName} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, firstName: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Last name *</label>
                  <input value={addRecruitmentForm.lastName} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, lastName: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Other name</label>
                  <input value={addRecruitmentForm.otherName} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, otherName: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Email *</label>
                  <input type="email" value={addRecruitmentForm.email} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, email: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone *</label>
                  <input value={addRecruitmentForm.phone} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, phone: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Address *</label>
                  <input value={addRecruitmentForm.address} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, address: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label>State</label>
                  <input value={addRecruitmentForm.state} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, state: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>City</label>
                  <input value={addRecruitmentForm.city} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, city: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>NIN</label>
                  <input value={addRecruitmentForm.ninNumber} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, ninNumber: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Gender</label>
                  <input value={addRecruitmentForm.gender} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, gender: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Marital status</label>
                  <input value={addRecruitmentForm.maritalStatus} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, maritalStatus: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Date of birth</label>
                  <input type="date" value={addRecruitmentForm.dateOfBirth} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, dateOfBirth: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Experience (years)</label>
                  <input type="number" min={0} value={addRecruitmentForm.experienceYears} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, experienceYears: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Barber licence no.</label>
                  <input value={addRecruitmentForm.barberLicence} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, barberLicence: e.target.value })} />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Why join network</label>
                  <textarea value={addRecruitmentForm.whyJoinNetwork} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, whyJoinNetwork: e.target.value })} rows={2} />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Application letter URL</label>
                  <input value={addRecruitmentForm.applicationLetterUrl} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, applicationLetterUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>CV URL</label>
                  <input value={addRecruitmentForm.cvUrl} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, cvUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Portfolio URL</label>
                  <input value={addRecruitmentForm.portfolioUrl} onChange={(e) => setAddRecruitmentForm({ ...addRecruitmentForm, portfolioUrl: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div className={styles.reviewModalFooter}>
                <button type="submit" className={styles.submitButton} disabled={addingRecruitment}>
                  {addingRecruitment ? 'Creating...' : 'Create recruitment'}
                </button>
                <button type="button" className={styles.reviewModalCloseButton} onClick={() => setShowAddRecruitmentModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
}
