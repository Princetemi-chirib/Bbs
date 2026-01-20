'use client';

import { useEffect, useState } from 'react';
import { fetchAuth } from '@/lib/auth';
import styles from './barbers.module.css';

export default function AdminBarbersPage() {
  const [barbers, setBarbers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBarber, setEditingBarber] = useState<string | null>(null);
  const [decliningAppId, setDecliningAppId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    state: '',
    city: '',
    address: '',
    bio: '',
    specialties: [] as string[],
    experienceYears: '',
  });

  useEffect(() => {
    loadBarbers();
    loadApplications();
  }, []);

  const loadBarbers = async () => {
    try {
      const response = await fetchAuth('/api/v1/barbers');
      const data = await response.json();
      if (data.success) {
        setBarbers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load barbers:', err);
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingBarber ? 'PUT' : 'POST';
      const url = editingBarber 
        ? `/api/v1/admin/barbers/${editingBarber}`
        : '/api/v1/admin/barbers';

      const response = await fetchAuth(url, {
        method,
        body: JSON.stringify({
          ...formData,
          experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(editingBarber ? 'Barber updated successfully' : 'Barber created successfully');
        setShowAddForm(false);
        setEditingBarber(null);
        resetForm();
        loadBarbers();
      } else {
        alert(data.error?.message || 'Failed to save barber');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
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
        loadApplications();
        loadBarbers();
      } else {
        alert(data.error?.message || 'Failed to approve application');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
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

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      state: '',
      city: '',
      address: '',
      bio: '',
      specialties: [],
      experienceYears: '',
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading barbers...</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <div>
            <h1 className={styles.pageTitle}>Barber Management</h1>
            <p className={styles.pageSubtitle}>Manage barbers and review applications</p>
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)} className={styles.addButton}>
            {showAddForm ? 'Cancel' : '+ Add Barber'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {showAddForm && (
          <section className={styles.formSection}>
            <h2>{editingBarber ? 'Edit Barber' : 'Add New Barber'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g., Lagos, Abuja, Warri"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Exact location/address"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Experience (Years)</label>
                  <input
                    type="number"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                    min="0"
                  />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitButton}>
                  {editingBarber ? 'Update Barber' : 'Create Barber'}
                </button>
                <button type="button" onClick={() => {
                  setShowAddForm(false);
                  setEditingBarber(null);
                  resetForm();
                }} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

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
                    <p><strong>Location:</strong> {app.state} - {app.address}</p>
                    {app.experienceYears && <p><strong>Experience:</strong> {app.experienceYears} years</p>}
                  </div>
                  {app.status === 'PENDING' && decliningAppId !== app.id && (
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
                  {app.status === 'PENDING' && decliningAppId === app.id && (
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

        <section className={styles.section}>
          <h2>All Barbers ({barbers.length})</h2>
          <div className={styles.barbersList}>
            {barbers.map((barber) => (
              <div key={barber.id} className={styles.barberCard}>
                <div className={styles.barberHeader}>
                  <div>
                    <strong>{barber.user?.name || 'N/A'}</strong>
                    <span>{barber.user?.email}</span>
                    <span>{barber.user?.phone}</span>
                  </div>
                  <div>
                    <span className={styles.statusBadge}>
                      {barber.status}
                    </span>
                  </div>
                </div>
                <div className={styles.barberDetails}>
                  <p><strong>Location:</strong> {barber.state || barber.location || 'Not set'} - {barber.city || 'N/A'}</p>
                  {barber.address && <p><strong>Address:</strong> {barber.address}</p>}
                  <p><strong>Rating:</strong> {barber.ratingAvg || 0}/5.0 ({barber.totalReviews || 0} reviews)</p>
                  <p><strong>Total Bookings:</strong> {barber.totalBookings || 0}</p>
                </div>
              </div>
            ))}
            {barbers.length === 0 && (
              <p className={styles.empty}>No barbers found. Add your first barber above.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
