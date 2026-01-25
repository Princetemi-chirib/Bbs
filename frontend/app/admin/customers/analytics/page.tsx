'use client';

import { useEffect, useState } from 'react';
import { fetchAuth } from '@/lib/auth';
import styles from '../customers.module.css';
import Link from 'next/link';

export default function CustomerAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, [dateRangeStart, dateRangeEnd]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRangeStart) params.append('dateRangeStart', dateRangeStart);
      if (dateRangeEnd) params.append('dateRangeEnd', dateRangeEnd);

      const response = await fetchAuth(`/api/v1/admin/customers/analytics?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to load analytics');
        return;
      }

      setAnalytics(data.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className={styles.errorContainer}>
        <p>{error || 'Failed to load analytics'}</p>
        <button onClick={loadAnalytics}>Retry</button>
        <Link href="/admin/customers" className={styles.backButton}>
          Back to Customers
        </Link>
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
          <h1 className={styles.pageTitle}>Customer Analytics & Insights</h1>
          <p className={styles.pageSubtitle}>Company-wide customer insights and trends</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="date"
            value={dateRangeStart}
            onChange={(e) => setDateRangeStart(e.target.value)}
            className={styles.dateInput}
            placeholder="Start Date"
          />
          <span>to</span>
          <input
            type="date"
            value={dateRangeEnd}
            onChange={(e) => setDateRangeEnd(e.target.value)}
            className={styles.dateInput}
            placeholder="End Date"
          />
          {(dateRangeStart || dateRangeEnd) && (
            <button
              onClick={() => {
                setDateRangeStart('');
                setDateRangeEnd('');
              }}
              className={styles.clearButton}
            >
              Clear
            </button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {/* Top 10% Contribution */}
        <section className={styles.card} style={{ marginBottom: '32px' }}>
          <h2 className={styles.sectionTitle}>Top 10% Customers Contribution</h2>
          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#39413f', marginBottom: '8px' }}>
              {analytics.top10PercentContribution.toFixed(1)}%
            </div>
            <p style={{ color: '#6c757d', marginBottom: '16px' }}>
              Top {analytics.top10PercentCount} customers contribute {analytics.top10PercentContribution.toFixed(1)}% of total revenue
            </p>
            <p style={{ color: '#6c757d', fontSize: '0.875rem' }}>
              Out of {analytics.totalCustomers} total customers
            </p>
          </div>
        </section>

        {/* Revenue by Segment */}
        <section className={styles.card} style={{ marginBottom: '32px' }}>
          <h2 className={styles.sectionTitle}>Revenue by Customer Segment</h2>
          <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '8px' }}>New Customers</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#39413f' }}>
                {formatCurrency(analytics.revenueBySegment.new)}
              </div>
            </div>
            <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '8px' }}>Loyal Customers</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#39413f' }}>
                {formatCurrency(analytics.revenueBySegment.loyal)}
              </div>
            </div>
            <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '8px' }}>VIP Customers</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#39413f' }}>
                {formatCurrency(analytics.revenueBySegment.vip)}
              </div>
            </div>
            <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '8px' }}>At-Risk Customers</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#39413f' }}>
                {formatCurrency(analytics.revenueBySegment.atRisk)}
              </div>
            </div>
            <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '8px' }}>Dormant Customers</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#39413f' }}>
                {formatCurrency(analytics.revenueBySegment.dormant)}
              </div>
            </div>
          </div>
        </section>

        {/* Customer Churn Reasons */}
        <section className={styles.card} style={{ marginBottom: '32px' }}>
          <h2 className={styles.sectionTitle}>Customer Churn Reasons</h2>
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem', color: '#856404', marginBottom: '8px' }}>High Cancellation Rate</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#856404' }}>
                  {analytics.churnReasons.highCancellation}
                </div>
              </div>
              <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem', color: '#856404', marginBottom: '8px' }}>No-Shows</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#856404' }}>
                  {analytics.churnReasons.noShows}
                </div>
              </div>
              <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem', color: '#856404', marginBottom: '8px' }}>Service Issues</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#856404' }}>
                  {analytics.churnReasons.serviceIssues}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Growth Trend */}
        {analytics.growthTrend && analytics.growthTrend.length > 0 && (
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Customer Growth Trend</h2>
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analytics.growthTrend.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#39413f' }}>
                      {new Date(item.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#39413f' }}>
                      {item.count} customers
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
