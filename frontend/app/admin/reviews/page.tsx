'use client';

import { useEffect, useState } from 'react';
import { fetchAuth, isAdmin } from '@/lib/auth';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import styles from './reviews.module.css';

type ReviewRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerEmail: string | null;
  rating: number;
  comment: string;
  commentTruncated: string;
  barberName: string;
  serviceName: string;
  status: string;
  visibility: string;
  isVisible: boolean;
  source: string;
  assignedTo: { id: string; name: string; email: string } | null;
  escalatedAt: string | null;
  resolvedAt: string | null;
  resolutionOutcome: string | null;
  slaDueAt: string | null;
  barberResponse: string | null;
  adminResponse: string | null;
  createdAt: string;
};

type Overview = {
  totalReviews: number;
  totalInPeriod: number;
  newInPeriod: number;
  avgRating: number;
  fiveStarVsOneTwoRatio: number;
  unresolvedNegative: number;
  responseRate: number;
  reviewsWithResponse: number;
  avgResponseTimeHours: number | null;
  ratingDistribution: { rating: number; count: number; percentage: number }[];
  reviewsByBarber: { barberId: string; barberName: string; count: number; avgRating: number }[];
  reviewsByService: { serviceId: string; serviceName: string; count: number; avgRating: number }[];
  recentReviews: unknown[];
};

type Detail = {
  review: {
    id: string;
    rating: number;
    comment: string | null;
    source: string;
    submittedAt: string;
    status: string;
    isVisible: boolean;
    barberResponse: string | null;
    barberResponseAt: string | null;
    adminResponse: string | null;
    adminResponseAt: string | null;
    internalNotes: string | null;
    escalatedAt: string | null;
    resolvedAt: string | null;
    resolutionOutcome: string | null;
    slaDueAt: string | null;
    assignedTo: { id: string; name: string; email: string } | null;
    customer: { id: string; name: string; email: string | null; avatarUrl: string | null } | null;
    barber: { id: string; name: string; email: string | null } | null;
  };
  order: {
    orderId: string;
    orderNumber: string;
    date: string;
    totalAmount: number;
    barber: string | null;
    services: { title: string; category: string | null; quantity: number; totalPrice: number }[];
  } | null;
  customerSnapshot: { totalVisits: number; lifetimeSpend: number; pastReviewsCount: number; noShowCount: number };
  responseHistory: { type: 'admin' | 'barber'; text: string; at: string; visibility?: string }[];
  auditLogs: { id: string; action: string; performedBy: { id: string; name: string; email: string } | null; createdAt: string }[];
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [filterOptions, setFilterOptions] = useState<{
    barbers: { id: string; name: string }[];
    assignableUsers: { id: string; name: string; email: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [visibility, setVisibility] = useState<'all' | 'visible' | 'hidden'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [barberId, setBarberId] = useState('');
  const [rating, setRating] = useState('');
  const [source, setSource] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');

  const [assignToId, setAssignToId] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  const [resolutionOutcome, setResolutionOutcome] = useState('no_action');

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadOverview();
  }, [startDate, endDate]);

  useEffect(() => {
    loadReviews();
  }, [visibility, startDate, endDate, barberId, rating, source, reviewStatus, page]);

  const loadFilterOptions = async () => {
    try {
      const r = await fetchAuth('/api/v1/admin/reviews/filter-options');
      const j = await r.json();
      if (j.success && j.data) setFilterOptions(j.data);
    } catch {
      // ignore
    }
  };

  const loadOverview = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (!startDate && !endDate) params.set('period', 'all');
      const r = await fetchAuth(`/api/v1/admin/reviews/analytics?${params}`);
      const j = await r.json();
      if (j.success && j.data) setOverview(j.data);
    } catch {
      setOverview(null);
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('visibility', visibility);
      params.set('page', String(page));
      params.set('limit', '20');
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (barberId) params.set('barberId', barberId);
      if (rating) params.set('rating', rating);
      if (source) params.set('source', source);
      if (reviewStatus) params.set('reviewStatus', reviewStatus);
      const res = await fetchAuth(`/api/v1/admin/reviews?${params}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data || []);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? 0);
      }
    } catch (e) {
      console.error('Failed to load reviews', e);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id: string) => {
    setLoadingDetail(true);
    setDetailModalOpen(true);
    setDetail(null);
    try {
      const r = await fetchAuth(`/api/v1/admin/reviews/${id}/detail`);
      const j = await r.json();
      if (j.success && j.data) {
        setDetail(j.data);
        setInternalNotes(j.data.review?.internalNotes ?? '');
        setAdminResponse(j.data.review?.adminResponse ?? '');
        setResolutionOutcome(j.data.review?.resolutionOutcome ?? 'no_action');
        setAssignToId(j.data.review?.assignedTo?.id ?? '');
      }
    } catch (e) {
      console.error('Failed to load detail', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setDetailModalOpen(false);
    setDetail(null);
    loadReviews();
    loadOverview();
  };

  const performAction = async (
    reviewId: string,
    action: string,
    payload?: Record<string, unknown>
  ) => {
    setActionLoading(reviewId);
    try {
      const body = { action, ...payload };
      const r = await fetchAuth(`/api/v1/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (j.success) {
        await loadReviews();
        if (overview) await loadOverview();
        if (detail?.review.id === reviewId) {
          const d = await fetchAuth(`/api/v1/admin/reviews/${reviewId}/detail`);
          const dj = await d.json();
          if (dj.success && dj.data) setDetail(dj.data);
        }
      } else {
        alert(j.error?.message ?? 'Action failed');
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    setActionLoading(reviewId);
    try {
      const r = await fetchAuth(`/api/v1/admin/reviews/${reviewId}`, { method: 'DELETE' });
      const j = await r.json();
      if (j.success) {
        closeDetail();
        await loadReviews();
        await loadOverview();
      } else alert(j.error?.message ?? 'Delete failed');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setActionLoading(null);
    }
  };

  const renderStars = (n: number) => (
    <span className={styles.stars}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`${styles.star} ${s <= n ? styles.starFilled : ''}`}>★</span>
      ))}
      <span className={styles.ratingValue}>({n}/5)</span>
    </span>
  );

  const statusClass = (s: string) => {
    const m: Record<string, string> = {
      NEW: styles.statusNew,
      RESPONDED: styles.statusResponded,
      ESCALATED: styles.statusEscalated,
      RESOLVED: styles.statusResolved,
      IGNORED: styles.statusIgnored,
    };
    return m[s] ?? styles.statusNew;
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <AdminBreadcrumbs items={[{ label: 'Dashboard', href: '/admin' }, { label: 'Reviews' }]} />
        <h1>Reviews</h1>
        <p className={styles.subtitle}>Moderate reviews, track metrics, and handle negative feedback.</p>
      </header>

      {overview && (
        <section className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total reviews</div>
            <div className={styles.metricValue}>{overview.totalReviews.toLocaleString()}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Average rating</div>
            <div className={styles.metricValue}>{overview.avgRating.toFixed(1)}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>5★ vs 1–2★ ratio</div>
            <div className={styles.metricValue}>{overview.fiveStarVsOneTwoRatio}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>New (period)</div>
            <div className={styles.metricValue}>{overview.newInPeriod.toLocaleString()}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Unresolved negative</div>
            <div className={styles.metricValue}>{overview.unresolvedNegative}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Response rate</div>
            <div className={styles.metricValue}>{overview.responseRate.toFixed(1)}%</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Avg response time</div>
            <div className={styles.metricValue}>
              {overview.avgResponseTimeHours != null ? `${overview.avgResponseTimeHours.toFixed(1)}h` : '—'}
            </div>
          </div>
        </section>
      )}

      <div className={styles.filtersRow}>
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${visibility === 'all' ? styles.active : ''}`}
            onClick={() => setVisibility('all')}
          >
            All
          </button>
          <button
            className={`${styles.filterBtn} ${visibility === 'visible' ? styles.active : ''}`}
            onClick={() => setVisibility('visible')}
          >
            Public
          </button>
          <button
            className={`${styles.filterBtn} ${visibility === 'hidden' ? styles.active : ''}`}
            onClick={() => setVisibility('hidden')}
          >
            Internal
          </button>
        </div>
        <label>
          From
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ marginLeft: 6, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ marginLeft: 6, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}
          />
        </label>
        <select value={barberId} onChange={(e) => setBarberId(e.target.value)}>
          <option value="">All barbers</option>
          {(filterOptions?.barbers ?? []).map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="">All ratings</option>
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>{r} ★</option>
          ))}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">All sources</option>
          <option value="APP">App</option>
          <option value="GOOGLE">Google</option>
          <option value="WALK_IN">Walk-in</option>
        </select>
        <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="RESPONDED">Responded</option>
          <option value="ESCALATED">Escalated</option>
          <option value="RESOLVED">Resolved</option>
          <option value="IGNORED">Ignored</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading reviews…</div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Barber</th>
                  <th>Service</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Visibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={11} className={styles.empty}>No reviews found</td>
                  </tr>
                ) : (
                  reviews.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.id.slice(0, 8)}</td>
                      <td>{new Date(row.date).toLocaleDateString()}</td>
                      <td>{row.customerName || 'Anonymous'}</td>
                      <td>{renderStars(row.rating)}</td>
                      <td title={row.comment} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.commentTruncated || '—'}
                      </td>
                      <td>{row.barberName}</td>
                      <td>{row.serviceName}</td>
                      <td>
                        <a href={`/admin/orders?q=${row.orderNumber}`} style={{ color: '#39413f', fontWeight: 600 }}>
                          {row.orderNumber}
                        </a>
                      </td>
                      <td>
                        <span className={statusClass(row.status)}>{row.status}</span>
                        {row.rating <= 2 && row.status !== 'RESOLVED' && row.status !== 'IGNORED' && (
                          <span style={{ marginLeft: 4, color: '#dc2626', fontSize: 11 }}>High priority</span>
                        )}
                      </td>
                      <td>
                        <span className={row.isVisible ? styles.visibilityBadge + ' ' + styles.visible : styles.visibilityBadge + ' ' + styles.hidden}>
                          {row.visibility}
                        </span>
                      </td>
                      <td>
                        <div className={styles.quickActions}>
                          <button onClick={() => openDetail(row.id)} disabled={actionLoading !== null}>View</button>
                          <button onClick={() => performAction(row.id, 'escalate')} disabled={actionLoading !== null}>Escalate</button>
                          <button onClick={() => performAction(row.id, 'resolve', { resolutionOutcome: 'no_action' })} disabled={actionLoading !== null}>Resolve</button>
                          {isAdmin() && (
                            <>
                              <button onClick={() => performAction(row.id, row.isVisible ? 'hide' : 'show')} disabled={actionLoading !== null}>
                                {row.isVisible ? 'Hide' : 'Show'}
                              </button>
                              <button
                                onClick={() => handleDelete(row.id)}
                                disabled={actionLoading !== null}
                                className={styles.deleteButton}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>Page {page} of {totalPages} ({total} total)</span>
              <button
                className={styles.pageButton}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {detailModalOpen && (
        <div className={styles.modalOverlay} onClick={closeDetail}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {loadingDetail ? (
              <div className={styles.loading}>Loading…</div>
            ) : detail ? (
              <>
                <h3>Review detail</h3>

                <div className={styles.modalSection}>
                  <div className={styles.modalSectionTitle}>Review content</div>
                  <div className={styles.detailGrid}>
                    <span>Rating</span>
                    <span>{renderStars(detail.review.rating)}</span>
                    <span>Source</span>
                    <span>{detail.review.source}</span>
                    <span>Submitted</span>
                    <span>{new Date(detail.review.submittedAt).toLocaleString()}</span>
                  </div>
                  {detail.review.comment && (
                    <div style={{ marginTop: 10, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                      {detail.review.comment}
                    </div>
                  )}
                </div>

                {detail.order && (
                  <div className={styles.modalSection}>
                    <div className={styles.modalSectionTitle}>Linked order</div>
                    <div className={styles.detailGrid}>
                      <span>Order</span>
                      <span><a href={`/admin/orders?q=${detail.order.orderNumber}`}>{detail.order.orderNumber}</a></span>
                      <span>Date</span>
                      <span>{new Date(detail.order.date).toLocaleString()}</span>
                      <span>Amount</span>
                      <span>{formatCurrency(detail.order.totalAmount)}</span>
                      <span>Barber</span>
                      <span>{detail.order.barber ?? '—'}</span>
                    </div>
                    {detail.order.services.length > 0 && (
                      <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                        {detail.order.services.map((s, i) => (
                          <li key={i}>{s.title} × {s.quantity} — {formatCurrency(s.totalPrice)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className={styles.modalSection}>
                  <div className={styles.modalSectionTitle}>Customer snapshot</div>
                  <div className={styles.detailGrid}>
                    <span>Total visits</span>
                    <span>{detail.customerSnapshot.totalVisits}</span>
                    <span>Lifetime spend</span>
                    <span>{formatCurrency(detail.customerSnapshot.lifetimeSpend)}</span>
                    <span>Past reviews</span>
                    <span>{detail.customerSnapshot.pastReviewsCount}</span>
                    <span>No-shows</span>
                    <span>{detail.customerSnapshot.noShowCount}</span>
                  </div>
                </div>

                {detail.responseHistory.length > 0 && (
                  <div className={styles.modalSection}>
                    <div className={styles.modalSectionTitle}>Response history</div>
                    {detail.responseHistory.map((h, i) => (
                      <div key={i} style={{ marginBottom: 10, padding: 10, background: h.type === 'admin' ? '#eff6ff' : '#f0fdf4', borderRadius: 8 }}>
                        <strong>{h.type === 'admin' ? 'Admin' : 'Barber'}</strong>
                        <span style={{ marginLeft: 8, fontSize: 12, color: '#6b7280' }}>{new Date(h.at).toLocaleString()}</span>
                        <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{h.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.modalSection}>
                  <div className={styles.modalSectionTitle}>Actions</div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Assign to</label>
                    <select
                      value={assignToId}
                      onChange={(e) => setAssignToId(e.target.value)}
                      style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, minWidth: 200 }}
                    >
                      <option value="">—</option>
                      {(filterOptions?.assignableUsers ?? []).map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                    <button
                      className={styles.primaryBtn}
                      style={{ marginLeft: 8 }}
                      disabled={actionLoading !== null || !assignToId}
                      onClick={() => performAction(detail.review.id, 'assign', { assignedToId: assignToId })}
                    >
                      Assign
                    </button>
                  </div>
                  <div className={styles.quickActions} style={{ marginBottom: 12 }}>
                    <button onClick={() => performAction(detail.review.id, 'escalate')} disabled={actionLoading !== null}>Escalate</button>
                    <select
                      value={resolutionOutcome}
                      onChange={(e) => setResolutionOutcome(e.target.value)}
                      style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }}
                    >
                      <option value="no_action">No action</option>
                      <option value="refund">Refund</option>
                      <option value="apology">Apology</option>
                    </select>
                    <button onClick={() => performAction(detail.review.id, 'resolve', { resolutionOutcome })} disabled={actionLoading !== null}>Resolve</button>
                    {isAdmin() && (
                      <>
                        <button onClick={() => performAction(detail.review.id, detail.review.isVisible ? 'hide' : 'show')} disabled={actionLoading !== null}>
                          {detail.review.isVisible ? 'Hide' : 'Show'}
                        </button>
                        <button onClick={() => handleDelete(detail.review.id)} disabled={actionLoading !== null} className={styles.deleteButton}>Delete</button>
                      </>
                    )}
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Internal notes</label>
                    <textarea
                      className={styles.textareaSmall}
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Internal notes (admin only)"
                    />
                    <button
                      className={styles.primaryBtn}
                      style={{ marginTop: 6 }}
                      disabled={actionLoading !== null}
                      onClick={() => performAction(detail.review.id, 'internal-notes', { internalNotes })}
                    >
                      Save notes
                    </button>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Admin response</label>
                    <textarea
                      className={styles.textareaSmall}
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      placeholder="Public admin response"
                    />
                    <button
                      className={styles.primaryBtn}
                      style={{ marginTop: 6 }}
                      disabled={actionLoading !== null || !adminResponse.trim()}
                      onClick={() => performAction(detail.review.id, 'admin-response', { adminResponse: adminResponse.trim() })}
                    >
                      Submit response
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button className={styles.secondaryBtn} onClick={closeDetail}>Close</button>
                </div>
              </>
            ) : (
              <div className={styles.empty}>Could not load detail.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
