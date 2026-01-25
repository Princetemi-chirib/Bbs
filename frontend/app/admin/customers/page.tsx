'use client';

import { useEffect, useState } from 'react';
import { fetchAuth } from '@/lib/auth';
import styles from './customers.module.css';
import Link from 'next/link';

type Customer = {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  isActive: boolean;
  status: string;
  membershipType: string;
  loyaltyPoints: number;
  preferredBarber: { id: string; name: string } | null;
  preferredBranch: string | null;
  totalBookings: number;
  totalOrders: number;
  totalReviews: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowCount: number;
  totalSpent: number;
  avgOrderValue: number;
  firstVisitDate: string;
  lastBookingDate: string | null;
  lastOrderDate: string | null;
  lastVisitDate: string | null;
  branchesVisited: string[];
  refundCount: number;
  refundAmount: number;
  tags: Array<{ id: string; tag: string; color: string | null }>;
  latestNote: { note: string; createdAt: string; createdBy: string } | null;
  createdAt: string;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [membershipFilter, setMembershipFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [maxSpend, setMaxSpend] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [page, sortBy, sortOrder, membershipFilter, statusFilter, segmentFilter, dateRangeStart, dateRangeEnd, minSpend, maxSpend]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (membershipFilter) params.append('membershipType', membershipFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (segmentFilter) params.append('segment', segmentFilter);
      if (dateRangeStart) params.append('dateRangeStart', dateRangeStart);
      if (dateRangeEnd) params.append('dateRangeEnd', dateRangeEnd);
      if (minSpend) params.append('minSpend', minSpend);
      if (maxSpend) params.append('maxSpend', maxSpend);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await fetchAuth(`/api/v1/admin/customers?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to load customers');
        return;
      }

      setCustomers(data.data.customers);
      setTotalPages(data.data.pagination.totalPages);
      setSummary(data.data.summary);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadCustomers();
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

  const getDaysSinceLastVisit = (lastBookingDate: string | null) => {
    if (!lastBookingDate) return 'Never';
    const days = Math.floor((Date.now() - new Date(lastBookingDate).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const handleCustomerAction = async (customerId: string, action: string, reason?: string) => {
    try {
      const response = await fetchAuth(`/api/v1/admin/customers/${customerId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason, note: reason }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Customer ${action.toLowerCase()}ed successfully`);
        setActionMenuOpen(null);
        loadCustomers();
      } else {
        alert(data.error?.message || 'Failed to perform action');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  };

  const handleAddNote = async (customerId: string) => {
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
        setSelectedCustomer(null);
        loadCustomers();
      } else {
        alert(data.error?.message || 'Failed to add note');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading && !customers.length) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading customers...</p>
      </div>
    );
  }

  if (error && !customers.length) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button onClick={loadCustomers}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.customers}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Customer Management</h1>
          <p className={styles.pageSubtitle}>Manage and track all your customers</p>
        </div>
        <div>
          <Link href="/admin/customers/analytics" className={styles.primaryButton} style={{ textDecoration: 'none', display: 'inline-block' }}>
            📊 View Analytics
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        {/* Enhanced Overview Dashboard */}
        {summary && (
          <section className={styles.overviewSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Customer Overview</h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => {
                    setDateRangeStart(e.target.value);
                    setPage(1);
                  }}
                  className={styles.dateInput}
                  placeholder="Start Date"
                />
                <span>to</span>
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => {
                    setDateRangeEnd(e.target.value);
                    setPage(1);
                  }}
                  className={styles.dateInput}
                  placeholder="End Date"
                />
                {(dateRangeStart || dateRangeEnd) && (
                  <button
                    onClick={() => {
                      setDateRangeStart('');
                      setDateRangeEnd('');
                      setPage(1);
                    }}
                    className={styles.clearButton}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: 'rgba(70, 180, 80, 0.1)' }}>
                  👥
                </div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryLabel}>Total Customers</h3>
                  <p className={styles.summaryValue}>{summary.totalCustomers}</p>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: 'rgba(57, 65, 63, 0.1)' }}>
                  📅
                </div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryLabel}>{summary.newCustomers !== undefined ? 'New Customers' : 'New This Month'}</h3>
                  <p className={styles.summaryValue}>{summary.newCustomers !== undefined ? summary.newCustomers : summary.newThisMonth}</p>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: 'rgba(33, 150, 243, 0.1)' }}>
                  🔄
                </div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryLabel}>Returning Customers</h3>
                  <p className={styles.summaryValue}>{summary.returningCustomers || 0}</p>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: 'rgba(76, 175, 80, 0.1)' }}>
                  ✓
                </div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryLabel}>Active Customers</h3>
                  <p className={styles.summaryValue}>{summary.activeCustomers || 0}</p>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: 'rgba(158, 158, 158, 0.1)' }}>
                  ⏸
                </div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryLabel}>Inactive Customers</h3>
                  <p className={styles.summaryValue}>{summary.inactiveCustomers || 0}</p>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: 'rgba(255, 193, 7, 0.1)' }}>
                  💰
                </div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryLabel}>Avg Customer Lifetime Value</h3>
                  <p className={styles.summaryValue}>₦{Math.round(summary.avgCLV || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: 'rgba(244, 67, 54, 0.1)' }}>
                  ↩️
                </div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryLabel}>Refund Rate</h3>
                  <p className={styles.summaryValue}>{Number(summary.refundRate || 0).toFixed(1)}%</p>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: 'rgba(220, 210, 204, 0.3)' }}>
                  ⭐
                </div>
                <div className={styles.summaryContent}>
                  <h3 className={styles.summaryLabel}>Premium Members</h3>
                  <p className={styles.summaryValue}>{summary.premiumMembers}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Enhanced Filters and Search */}
        <section className={styles.filters}>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search by name, email, phone, or customer ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
            <button onClick={handleSearch} className={styles.searchButton}>
              🔍 Search
            </button>
          </div>

          <div className={styles.filterControls}>
            <div className={styles.filterGroup}>
              <label>Segment:</label>
              <select
                value={segmentFilter}
                onChange={(e) => {
                  setSegmentFilter(e.target.value);
                  setPage(1);
                }}
                className={styles.select}
              >
                <option value="">All Segments</option>
                <option value="NEW">New Customers</option>
                <option value="LOYAL">Loyal Customers</option>
                <option value="VIP">VIP / High-Value</option>
                <option value="AT_RISK">At-Risk</option>
                <option value="DORMANT">Dormant</option>
                <option value="PROBLEMATIC">Problematic</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className={styles.select}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="FLAGGED">Flagged</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Membership:</label>
              <select
                value={membershipFilter}
                onChange={(e) => {
                  setMembershipFilter(e.target.value);
                  setPage(1);
                }}
                className={styles.select}
              >
                <option value="">All</option>
                <option value="BASIC">Basic</option>
                <option value="PREMIUM">Premium</option>
                <option value="VIP">VIP</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Min Spend:</label>
              <input
                type="number"
                value={minSpend}
                onChange={(e) => {
                  setMinSpend(e.target.value);
                  setPage(1);
                }}
                className={styles.numberInput}
                placeholder="₦0"
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Max Spend:</label>
              <input
                type="number"
                value={maxSpend}
                onChange={(e) => {
                  setMaxSpend(e.target.value);
                  setPage(1);
                }}
                className={styles.numberInput}
                placeholder="₦∞"
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className={styles.select}
              >
                <option value="createdAt">Join Date</option>
                <option value="totalSpent">Total Spent</option>
                <option value="avgOrderValue">Avg Order Value</option>
                <option value="noShowCount">No-Show Count</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                setPage(1);
              }}
              className={styles.sortButton}
            >
              {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </button>

            {(segmentFilter || statusFilter || membershipFilter || minSpend || maxSpend) && (
              <button
                onClick={() => {
                  setSegmentFilter('');
                  setStatusFilter('');
                  setMembershipFilter('');
                  setMinSpend('');
                  setMaxSpend('');
                  setPage(1);
                }}
                className={styles.clearButton}
              >
                Clear Filters
              </button>
            )}
          </div>
        </section>

        {/* Customers Table */}
        <section className={styles.customersSection}>
          <div className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>All Customers</h2>
              <span className={styles.sectionBadge}>{customers.length} customers</span>
            </div>

            {customers.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No customers found</p>
              </div>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Customer ID</th>
                        <th>Full Name</th>
                        <th>Phone Number</th>
                        <th>Email</th>
                        <th>Branch(es) Visited</th>
                        <th>First Visit</th>
                        <th>Last Visit</th>
                        <th>Total Visits</th>
                        <th>Total Spend</th>
                        <th>Avg Order Value</th>
                        <th>No-Show Count</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer.id}>
                          <td>
                            <strong>{customer.customerId}</strong>
                            {customer.tags && customer.tags.length > 0 && (
                              <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {customer.tags.slice(0, 2).map(tag => (
                                  <span
                                    key={tag.id}
                                    style={{
                                      fontSize: '0.75rem',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: tag.color || '#e5e5e5',
                                      color: '#39413f',
                                    }}
                                  >
                                    {tag.tag}
                                  </span>
                                ))}
                                {customer.tags.length > 2 && (
                                  <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>+{customer.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className={styles.customerInfo}>
                              {customer.avatarUrl ? (
                                <img
                                  src={customer.avatarUrl}
                                  alt={customer.name}
                                  className={styles.avatar}
                                />
                              ) : (
                                <div className={styles.avatarPlaceholder}>
                                  {customer.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className={styles.customerName}>{customer.name}</div>
                                {customer.latestNote && (
                                  <div style={{ fontSize: '0.75rem', color: '#6c757d', fontStyle: 'italic', marginTop: '2px' }}>
                                    📝 {customer.latestNote.note.substring(0, 30)}...
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>{customer.phone || 'N/A'}</td>
                          <td>
                            <div>{customer.email}</div>
                            {!customer.emailVerified && (
                              <div style={{ fontSize: '0.75rem', color: '#dc3232' }}>Unverified</div>
                            )}
                          </td>
                          <td>
                            {customer.branchesVisited && customer.branchesVisited.length > 0 ? (
                              <div style={{ fontSize: '0.85rem' }}>
                                {customer.branchesVisited.slice(0, 2).map((branch, idx) => (
                                  <div key={idx}>{branch}</div>
                                ))}
                                {customer.branchesVisited.length > 2 && (
                                  <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
                                    +{customer.branchesVisited.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>
                            {customer.firstVisitDate ? formatDate(customer.firstVisitDate) : 'N/A'}
                          </td>
                          <td>
                            {customer.lastVisitDate ? (
                              <>
                                <div>{formatDate(customer.lastVisitDate)}</div>
                                <div className={styles.lastVisit}>
                                  {getDaysSinceLastVisit(customer.lastVisitDate)}
                                </div>
                              </>
                            ) : (
                              <span className={styles.noVisit}>Never</span>
                            )}
                          </td>
                          <td>
                            <div>
                              <div>{customer.totalBookings + customer.totalOrders} visits</div>
                              <div className={styles.stats} style={{ fontSize: '0.85rem' }}>
                                {customer.completedBookings} completed
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.amount}><strong>{formatCurrency(customer.totalSpent)}</strong></div>
                          </td>
                          <td>
                            <div>{formatCurrency(customer.avgOrderValue || 0)}</div>
                          </td>
                          <td>
                            <div>
                              {customer.noShowCount > 0 ? (
                                <span style={{ color: '#dc3232', fontWeight: 600 }}>{customer.noShowCount}</span>
                              ) : (
                                <span style={{ color: '#6c757d' }}>0</span>
                              )}
                            </div>
                          </td>
                          <td>
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
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <Link
                                href={`/admin/customers/${customer.id}`}
                                className={styles.viewButton}
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                              >
                                View
                              </Link>
                              <div style={{ position: 'relative' }}>
                                <button
                                  onClick={() => setActionMenuOpen(actionMenuOpen === customer.id ? null : customer.id)}
                                  className={styles.actionButton}
                                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                >
                                  ⋮
                                </button>
                                {actionMenuOpen === customer.id && (
                                  <div className={styles.actionMenu}>
                                    <button
                                      onClick={() => {
                                        setSelectedCustomer(customer.id);
                                        setShowNoteModal(true);
                                        setActionMenuOpen(null);
                                      }}
                                      className={styles.actionMenuItem}
                                    >
                                      📝 Add Note
                                    </button>
                                    {customer.status !== 'FLAGGED' && (
                                      <button
                                        onClick={() => {
                                          const reason = prompt('Reason for flagging:');
                                          if (reason) handleCustomerAction(customer.id, 'FLAG', reason);
                                          setActionMenuOpen(null);
                                        }}
                                        className={styles.actionMenuItem}
                                      >
                                        🚩 Flag
                                      </button>
                                    )}
                                    {customer.status !== 'BLOCKED' && (
                                      <button
                                        onClick={() => {
                                          const reason = prompt('Reason for blocking:');
                                          if (reason) handleCustomerAction(customer.id, 'BLOCK', reason);
                                          setActionMenuOpen(null);
                                        }}
                                        className={styles.actionMenuItem}
                                        style={{ color: '#dc3232' }}
                                      >
                                        🚫 Block
                                      </button>
                                    )}
                                    {customer.status === 'BLOCKED' && (
                                      <button
                                        onClick={() => {
                                          handleCustomerAction(customer.id, 'UNBLOCK');
                                          setActionMenuOpen(null);
                                        }}
                                        className={styles.actionMenuItem}
                                        style={{ color: '#46b450' }}
                                      >
                                        ✓ Unblock
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={styles.pageButton}
                    >
                      Previous
                    </button>
                    <span className={styles.pageInfo}>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className={styles.pageButton}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {/* Add Note Modal */}
      {showNoteModal && selectedCustomer && (
        <div className={styles.modalOverlay} onClick={() => {
          setShowNoteModal(false);
          setSelectedCustomer(null);
          setNoteText('');
        }}>
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
                onClick={() => handleAddNote(selectedCustomer)}
                disabled={addingNote || !noteText.trim()}
                className={styles.primaryButton}
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setSelectedCustomer(null);
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
    </div>
  );
}
