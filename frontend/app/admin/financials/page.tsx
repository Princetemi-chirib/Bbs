'use client';

import { useEffect, useState } from 'react';
import { fetchAuth } from '@/lib/auth';
import styles from './financials.module.css';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#46B450', '#39413f', '#DCB2CC', '#FFC107', '#17A2B8', '#FF6B6B'];

export default function AdminFinancialsPage() {
  const [financials, setFinancials] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadFinancials();
  }, [period, startDate, endDate]);

  const loadFinancials = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (period !== 'all') params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `/api/v1/admin/financials${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetchAuth(url);
      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to load financial data');
        return;
      }

      setFinancials(data.data);
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
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const exportToCSV = () => {
    if (!financials?.recentTransactions) return;

    const headers = ['Order Number', 'Customer', 'Amount', 'Payment Method', 'Status', 'Date'];
    const rows = financials.recentTransactions.map((t: any) => [
      t.orderNumber,
      t.customerName,
      formatCurrency(t.amount),
      t.paymentMethod,
      t.paymentStatus,
      new Date(t.createdAt).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financials-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading financial data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button onClick={loadFinancials}>Retry</button>
      </div>
    );
  }

  const { kpis, orders, paymentMethods, orderStatus, barberEarnings, refunds, recentTransactions, charts } = financials || {};

  return (
    <div className={styles.financials}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Financial Dashboard</h1>
          <p className={styles.pageSubtitle}>Comprehensive financial overview and analytics</p>
        </div>
      </header>

      <main className={styles.main}>
        {/* Filter Section */}
        <section className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Period:</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className={styles.select}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {period === 'custom' && (
            <div className={styles.dateRange}>
              <div className={styles.filterGroup}>
                <label>Start Date:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.filterGroup}>
                <label>End Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>
          )}

          <button onClick={exportToCSV} className={styles.exportButton}>
            📊 Export CSV
          </button>
        </section>

        {/* KPI Cards */}
        <section className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(70, 180, 80, 0.1)' }}>
                💰
              </div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>Total Revenue</h3>
                <p className={styles.kpiValue}>{formatCurrency(kpis?.totalRevenue || 0)}</p>
                <span className={styles.kpiSubtext}>All time</span>
              </div>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(70, 180, 80, 0.1)' }}>
                📅
              </div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>Today</h3>
                <p className={styles.kpiValue}>{formatCurrency(kpis?.todayRevenue || 0)}</p>
                <span className={styles.kpiSubtext}>Today's revenue</span>
              </div>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(70, 180, 80, 0.1)' }}>
                📆
              </div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>This Month</h3>
                <p className={styles.kpiValue}>{formatCurrency(kpis?.monthRevenue || 0)}</p>
                <span className={styles.kpiSubtext}>Monthly revenue</span>
              </div>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(57, 65, 63, 0.1)' }}>
                📦
              </div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>Total Orders</h3>
                <p className={styles.kpiValue}>{orders?.total || 0}</p>
                <span className={styles.kpiSubtext}>{orders?.paid || 0} paid</span>
              </div>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(220, 210, 204, 0.3)' }}>
                💵
              </div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>Avg Order Value</h3>
                <p className={styles.kpiValue}>{formatCurrency(kpis?.avgOrderValue || 0)}</p>
                <span className={styles.kpiSubtext}>Average per order</span>
              </div>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(255, 193, 7, 0.1)' }}>
                ⬆️
              </div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>Week Growth</h3>
                <p className={styles.kpiValue}>
                  {kpis?.weekGrowth ? (kpis.weekGrowth > 0 ? '+' : '') + kpis.weekGrowth.toFixed(1) + '%' : '0%'}
                </p>
                <span className={styles.kpiSubtext}>vs last week</span>
              </div>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className={styles.chartsSection}>
          {/* Revenue Trend Chart */}
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Revenue Trend (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts?.revenueTrend || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#46B450" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#46B450" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="date" tickFormatter={formatDate} stroke="#6c757d" />
                <YAxis tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} stroke="#6c757d" />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  labelFormatter={(label) => formatDate(label)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#46B450"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Revenue Chart */}
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Monthly Revenue Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts?.monthlyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="month" stroke="#6c757d" />
                <YAxis tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} stroke="#6c757d" />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                />
                <Bar dataKey="revenue" fill="#46B450" radius={[8, 8, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Methods Pie Chart */}
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Payment Methods Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethods || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ method, percent }) => `${method}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                  nameKey="method"
                >
                  {(paymentMethods || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Order Status Chart */}
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Orders by Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderStatus || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="status" stroke="#6c757d" />
                <YAxis stroke="#6c757d" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#39413f" radius={[8, 8, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Summary Statistics */}
        <section className={styles.summarySection}>
          <div className={styles.summaryCard}>
            <h2 className={styles.sectionTitle}>Summary Statistics</h2>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Gross Revenue</span>
                <span className={styles.summaryValue}>{formatCurrency(kpis?.totalRevenue || 0)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Net Revenue</span>
                <span className={styles.summaryValue}>
                  {formatCurrency((kpis?.totalRevenue || 0) - (refunds?.total || 0))}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Refunds</span>
                <span className={styles.summaryValue}>{formatCurrency(refunds?.total || 0)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Pending Payments</span>
                <span className={styles.summaryValue}>{orders?.pending || 0} orders</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Failed Payments</span>
                <span className={styles.summaryValue}>{orders?.failed || 0} orders</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Company Commission</span>
                <span className={styles.summaryValue}>{formatCurrency(financials?.totalCompanyCommission || 0)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Barber Payouts</span>
                <span className={styles.summaryValue}>{formatCurrency(financials?.totalBarberPayouts || 0)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Top Earning Barbers */}
        {barberEarnings && barberEarnings.length > 0 && (
          <section className={styles.barbersSection}>
            <div className={styles.summaryCard}>
              <h2 className={styles.sectionTitle}>Top Earning Barbers</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Barber</th>
                      <th>Total Revenue</th>
                      <th>Commission Rate</th>
                      <th>Earnings</th>
                      <th>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barberEarnings.map((barber: any) => (
                      <tr key={barber.barberId}>
                        <td>{barber.barberName}</td>
                        <td>{formatCurrency(barber.totalRevenue)}</td>
                        <td>{(barber.commissionRate * 100).toFixed(0)}%</td>
                        <td>{formatCurrency(barber.barberEarning)}</td>
                        <td>{barber.ordersCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Recent Transactions */}
        <section className={styles.transactionsSection}>
          <div className={styles.summaryCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Transactions</h2>
              <span className={styles.sectionBadge}>{recentTransactions?.length || 0} transactions</span>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Barber</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions && recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction: any) => (
                      <tr key={transaction.id}>
                        <td>{transaction.orderNumber}</td>
                        <td>{transaction.customerName}</td>
                        <td>{formatCurrency(transaction.amount)}</td>
                        <td>{transaction.paymentMethod}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[`status${transaction.paymentStatus}`]}`}>
                            {transaction.paymentStatus}
                          </span>
                        </td>
                        <td>{transaction.barberName || '—'}</td>
                        <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className={styles.emptyState}>
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
