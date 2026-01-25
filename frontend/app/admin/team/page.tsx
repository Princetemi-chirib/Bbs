'use client';

import { useEffect, useState } from 'react';
import { fetchAuth, isAdmin } from '@/lib/auth';
import styles from './team.module.css';

type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'ADMIN' | 'REP';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'REP' as 'ADMIN' | 'REP',
  });

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const response = await fetchAuth('/api/v1/admin/team');
      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to load team members');
        return;
      }

      setMembers(data.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      setCreating(true);
      const response = await fetchAuth('/api/v1/admin/team', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.error?.message || 'Failed to create user');
        return;
      }

      alert('User created successfully!');
      setShowAddForm(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'REP',
      });
      loadTeam();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !members.length) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading team members...</p>
      </div>
    );
  }

  if (error && !members.length) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button onClick={loadTeam}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.team}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <div>
            <h1 className={styles.pageTitle}>Team Management</h1>
            <p className={styles.pageSubtitle}>Manage admin and customer representative accounts</p>
          </div>
          {isAdmin() && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={styles.addButton}
            >
              {showAddForm ? 'Cancel' : '+ Add Team Member'}
            </button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {showAddForm && isAdmin() && (
          <section className={styles.formSection}>
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>Add New Team Member</h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      required
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@example.com"
                      required
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="08012345678"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Role *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'REP' })}
                      className={styles.input}
                      required
                    >
                      <option value="REP">Customer Representative</option>
                      <option value="ADMIN">Super Admin</option>
                    </select>
                  </div>

                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label>Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                      className={styles.input}
                    />
                    <small className={styles.helpText}>User will need this password to login</small>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        password: '',
                        role: 'REP',
                      });
                    }}
                    className={styles.cancelButton}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        <section className={styles.teamSection}>
          <div className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Team Members</h2>
              <span className={styles.sectionBadge}>{members.length} members</span>
            </div>

            {members.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No team members found</p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td>
                          <div className={styles.memberInfo}>
                            <div className={styles.memberName}>{member.name}</div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.emailCell}>
                            <span className={styles.emailText}>{member.email}</span>
                            {!member.emailVerified && (
                              <span className={styles.unverifiedBadge}>Unverified</span>
                            )}
                          </div>
                        </td>
                        <td>{member.phone || '—'}</td>
                        <td>
                          <span className={`${styles.roleBadge} ${styles[`role${member.role}`]}`}>
                            <span className={styles.roleTextDesktop}>
                              {member.role === 'ADMIN' ? 'Super Admin' : 'Customer Rep'}
                            </span>
                            <span className={styles.roleTextMobile}>
                              {member.role === 'ADMIN' ? 'S A' : 'C R'}
                            </span>
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              member.isActive ? styles.statusActive : styles.statusInactive
                            }`}
                          >
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{formatDate(member.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
