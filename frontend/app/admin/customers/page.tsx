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
  membershipType: string;
  loyaltyPoints: number;
  preferredBarber: { id: string; name: string } | null;
  totalBookings: number;
  totalOrders: number;
  totalReviews: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  lastBookingDate: string | null;
  createdAt: string;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [membershipFilter, setMembershipFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [page, sortBy, sortOrder, membershipFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (membershipFilter) params.append('membershipType', membershipFilter);
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
      </header>

      <main className={styles.main}>
        {/* Summary Cards */}
        {summary && (
          <section className={styles.summaryGrid}>
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
                <h3 className={styles.summaryLabel}>New This Month</h3>
                <p className={styles.summaryValue}>{summary.newThisMonth}</p>
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
          </section>
        )}

        {/* Filters and Search */}
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
                        <th>Customer</th>
                        <th>Contact</th>
                        <th>Membership</th>
                        <th>Total Spent</th>
                        <th>Bookings</th>
                        <th>Last Visit</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer.id}>
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
                                <div className={styles.customerId}>ID: {customer.customerId}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.contactInfo}>
                              <div>{customer.email}</div>
                              {customer.phone && (
                                <div className={styles.phone}>{customer.phone}</div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div>
                              <span className={styles.membershipBadge}>{customer.membershipType}</span>
                              {customer.loyaltyPoints > 0 && (
                                <div className={styles.loyaltyPoints}>
                                  {customer.loyaltyPoints} pts
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className={styles.amount}>{formatCurrency(customer.totalSpent)}</div>
                          </td>
                          <td>
                            <div>
                              <div>{customer.totalBookings} bookings</div>
                              <div className={styles.stats}>
                                {customer.completedBookings} completed
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              {customer.lastBookingDate ? (
                                <>
                                  <div>{formatDate(customer.lastBookingDate)}</div>
                                  <div className={styles.lastVisit}>
                                    {getDaysSinceLastVisit(customer.lastBookingDate)}
                                  </div>
                                </>
                              ) : (
                                <span className={styles.noVisit}>Never</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div>
                              <span
                                className={`${styles.statusBadge} ${
                                  customer.isActive ? styles.statusActive : styles.statusInactive
                                }`}
                              >
                                {customer.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {!customer.emailVerified && (
                                <div className={styles.verifiedBadge}>Unverified</div>
                              )}
                            </div>
                          </td>
                          <td>
                            <Link
                              href={`/admin/customers/${customer.id}`}
                              className={styles.viewButton}
                            >
                              View Details
                            </Link>
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
    </div>
  );
}
