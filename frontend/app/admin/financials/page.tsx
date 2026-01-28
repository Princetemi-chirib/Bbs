'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard,
  Wallet,
  Users,
  Package,
  Scissors,
  Star,
  FileDown,
  FileSpreadsheet,
  FileText,
  ClipboardList,
  Calendar,
  DollarSign,
  TrendingUp,
  LineChart as LineChartIcon,
  RefreshCw,
  Crown,
  BarChart2,
  PieChart as PieChartIcon,
  TrendingDown,
  RotateCcw,
  Mail,
  BookmarkPlus,
  Bookmark,
  type LucideIcon,
} from 'lucide-react';
import { fetchAuth, isAdmin } from '@/lib/auth';
import styles from './financials.module.css';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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

type TabId = 'overview' | 'financial' | 'customers' | 'orders' | 'barbers' | 'reviews';

const TABS: { id: TabId; label: string; Icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'financial', label: 'Financial', Icon: Wallet },
  { id: 'customers', label: 'Customers', Icon: Users },
  { id: 'orders', label: 'Orders & Services', Icon: Package },
  { id: 'barbers', label: 'Barbers', Icon: Scissors },
  { id: 'reviews', label: 'Reviews & Feedback', Icon: Star },
];

export default function AdminFinancialsPage() {
  const [financials, setFinancials] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [txSearch, setTxSearch] = useState('');
  const [txSearchInput, setTxSearchInput] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [txData, setTxData] = useState<{ transactions: any[]; total: number; page: number; totalPages: number } | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [barberMetrics, setBarberMetrics] = useState<{ summary: any; barbers: any[] } | null>(null);
  const [barberMetricsLoading, setBarberMetricsLoading] = useState(false);
  const [reviewsAnalytics, setReviewsAnalytics] = useState<any>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [filterBarber, setFilterBarber] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterOptions, setFilterOptions] = useState<{
    barbers: { id: string; name: string }[];
    locations: string[];
    categories: string[];
    services: string[];
  } | null>(null);
  const [weeklyReportLoading, setWeeklyReportLoading] = useState(false);
  const [weeklyReportMessage, setWeeklyReportMessage] = useState('');
  const [savedViews, setSavedViews] = useState<{ id: string; name: string; filters: { period: string; startDate: string; endDate: string; filterBarber: string; filterLocation: string; filterCategory: string; filterService: string } }[]>([]);
  const [savedViewSelect, setSavedViewSelect] = useState('');

  useEffect(() => {
    loadFinancials();
  }, [period, startDate, endDate, filterBarber, filterLocation, filterCategory, filterService]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAuth('/api/v1/admin/financials/filter-options');
        const json = await res.json();
        if (json.success && json.data) setFilterOptions(json.data);
      } catch {
        setFilterOptions(null);
      }
    })();
  }, []);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('bbs-financials-saved-views') : null;
      setSavedViews(raw ? JSON.parse(raw) : []);
    } catch {
      setSavedViews([]);
    }
  }, []);

  const loadTransactions = async () => {
    setTxLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(txPage));
      params.set('limit', '20');
      if (txSearch) params.set('search', txSearch);
      if (period !== 'all') params.set('period', period);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (filterBarber) params.set('barber', filterBarber);
      if (filterLocation) params.set('location', filterLocation);
      if (filterCategory) params.set('category', filterCategory);
      if (filterService) params.set('service', filterService);
      const res = await fetchAuth(`/api/v1/admin/transactions?${params}`);
      const json = await res.json();
      if (json.success && json.data) {
        setTxData(json.data);
      } else {
        setTxData({ transactions: [], total: 0, page: 1, totalPages: 1 });
      }
    } catch {
      setTxData({ transactions: [], total: 0, page: 1, totalPages: 1 });
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'financial') return;
    loadTransactions();
  }, [activeTab, txPage, txSearch, period, startDate, endDate, filterBarber, filterLocation, filterCategory, filterService]);

  useEffect(() => {
    if (activeTab !== 'barbers') return;
    loadBarberMetrics();
  }, [activeTab, period, startDate, endDate]);

  useEffect(() => {
    if (activeTab !== 'reviews') return;
    loadReviewsAnalytics();
  }, [activeTab, period, startDate, endDate]);

  const loadBarberMetrics = async () => {
    if (!isAdmin()) return;
    setBarberMetricsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetchAuth(`/api/v1/admin/barbers/metrics?${params}`);
      const json = await res.json();
      if (json.success && json.data) {
        setBarberMetrics(json.data);
      }
    } catch {
      setBarberMetrics(null);
    } finally {
      setBarberMetricsLoading(false);
    }
  };

  const loadReviewsAnalytics = async () => {
    setReviewsLoading(true);
    try {
      const params = new URLSearchParams();
      if (period !== 'all') params.set('period', period);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetchAuth(`/api/v1/admin/reviews/analytics?${params}`);
      const json = await res.json();
      if (json.success && json.data) {
        setReviewsAnalytics(json.data);
      } else {
        setReviewsAnalytics(null);
      }
    } catch {
      setReviewsAnalytics(null);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadFinancials = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (period !== 'all') params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (filterBarber) params.append('barber', filterBarber);
      if (filterLocation) params.append('location', filterLocation);
      if (filterCategory) params.append('category', filterCategory);
      if (filterService) params.append('service', filterService);

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

  const hasActiveFilters = !!(filterBarber || filterLocation || filterCategory || filterService);
  const clearFilters = () => {
    setFilterBarber('');
    setFilterLocation('');
    setFilterCategory('');
    setFilterService('');
  };

  const sendWeeklyReport = async () => {
    setWeeklyReportLoading(true);
    setWeeklyReportMessage('');
    try {
      const res = await fetchAuth('/api/v1/admin/reports/weekly-email', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setWeeklyReportMessage(data.data?.message || 'Report sent to your email.');
      } else {
        setWeeklyReportMessage(data.error?.message || 'Failed to send report.');
      }
    } catch (e: any) {
      setWeeklyReportMessage(e?.message || 'Failed to send report.');
    } finally {
      setWeeklyReportLoading(false);
    }
  };

  const saveCurrentView = () => {
    const name = typeof prompt === 'function' ? prompt('Name for this view:', `View ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`) : null;
    if (!name?.trim()) return;
    const view = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `v-${Date.now()}`,
      name: name.trim(),
      filters: { period, startDate, endDate, filterBarber, filterLocation, filterCategory, filterService },
    };
    const next = [...savedViews, view];
    setSavedViews(next);
    try {
      localStorage.setItem('bbs-financials-saved-views', JSON.stringify(next));
    } catch {}
  };

  const loadSavedView = (viewId: string) => {
    const v = savedViews.find((s) => s.id === viewId);
    if (!v) return;
    const f = v.filters;
    setPeriod(f.period);
    setStartDate(f.startDate || '');
    setEndDate(f.endDate || '');
    setFilterBarber(f.filterBarber || '');
    setFilterLocation(f.filterLocation || '');
    setFilterCategory(f.filterCategory || '');
    setFilterService(f.filterService || '');
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    const h = Math.floor(m / 60);
    const mins = m % 60;
    return mins > 0 ? `${h}h ${mins}m` : `${h}h`;
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

  const exportToExcel = () => {
    if (!financials?.recentTransactions) return;

    const headers = ['Order Number', 'Customer', 'Amount', 'Payment Method', 'Status', 'Barber', 'Date'];
    const rows = financials.recentTransactions.map((t: any) => [
      t.orderNumber,
      t.customerName,
      typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount || 0)),
      t.paymentMethod ?? '',
      t.paymentStatus ?? '',
      t.barberName ?? '',
      new Date(t.createdAt).toISOString(),
    ]);
    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `financials-${dateStr}.xlsx`);
  };

  const exportToPDF = async () => {
    if (!financials) return;
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
      const dateStr = new Date().toISOString().split('T')[0];
      const pageW = 595;
      const pageH = 842;
      const margin = 40;
      const lineH = 12;
      let page = doc.addPage([pageW, pageH]);
      let y = pageH - margin;

      const sanitize = (s: string) =>
        String(s)
          .replace(/₦/g, 'NGN ')
          .replace(/—/g, '-')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');

      const draw = (text: string, x: number, yVal: number, opts: { size?: number; bold?: boolean } = {}) => {
        const f = opts.bold ? boldFont : font;
        const size = opts.size ?? 10;
        page.drawText(sanitize(text), { x, y: yVal, size, font: f, color: rgb(0, 0, 0) });
      };

      const addPageIfNeeded = () => {
        if (y < margin + lineH) {
          page = doc.addPage([pageW, pageH]);
          y = pageH - margin;
        }
      };

      const reportTypeLabels: Record<string, string> = {
        today: 'Daily Financial Summary',
        week: 'Weekly Financial Report',
        month: 'Monthly Financial Statement',
        quarter: 'Quarterly Financial Review',
        year: 'Annual Financial Report',
        custom: 'Custom Range Financial Report',
        all: 'Financial Report (All Time)',
      };
      const periodLabels: Record<string, string> = {
        all: 'All Time',
        today: 'Today',
        week: 'This Week',
        month: 'This Month',
        quarter: 'This Quarter',
        year: 'This Year',
      };
      const periodLabel = period === 'custom' && startDate && endDate
        ? `Custom: ${startDate} to ${endDate}`
        : periodLabels[period] ?? period;
      const reportTitle = reportTypeLabels[period] ?? reportTypeLabels.all;
      draw(`BBS Limited - ${reportTitle}`, margin, y, { size: 16, bold: true });
      y -= 20;
      draw(`Generated ${new Date().toLocaleString()}`, margin, y);
      y -= lineH;
      draw(`Period: ${periodLabel}`, margin, y);
      y -= lineH;
      if (period !== 'all' && financials?.kpis?.filteredRevenue != null) {
        draw(`Revenue (Period): ${formatCurrency(Number(financials.kpis.filteredRevenue))}`, margin, y);
        y -= lineH;
      }
      if (financials?.kpis?.totalRevenue != null) {
        draw(`Total Revenue (All Time): ${formatCurrency(Number(financials.kpis.totalRevenue))}`, margin, y);
        y -= lineH;
      }
      if (financials?.orders?.total != null) {
        draw(`Total Orders: ${financials.orders.total}`, margin, y);
        y -= lineH;
      }
      y -= 10;

      const colXs = [40, 95, 175, 240, 300, 360, 430];
      const headerLabels = ['Order #', 'Customer', 'Amount', 'Payment', 'Status', 'Barber', 'Date'];
      const trunc = (s: string, len: number) =>
        (String(s).length <= len ? String(s) : String(s).slice(0, len - 1) + '.');

      for (let i = 0; i < headerLabels.length; i++) {
        draw(headerLabels[i], colXs[i], y, { size: 8, bold: true });
      }
      y -= lineH;

      const txns = (financials.recentTransactions ?? []) as any[];
      const rows = txns.map((t) => [
        trunc(t.orderNumber ?? '', 10),
        trunc(t.customerName ?? '', 14),
        trunc(formatCurrency(typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount || 0))), 12),
        trunc(t.paymentMethod ?? '', 8),
        trunc(t.paymentStatus ?? '', 8),
        trunc(t.barberName ?? '-', 10),
        trunc(new Date(t.createdAt).toLocaleString(), 18),
      ]);

      for (const row of rows) {
        addPageIfNeeded();
        for (let c = 0; c < row.length; c++) {
          draw(String(row[c]), colXs[c], y, { size: 8 });
        }
        y -= lineH;
      }
      if (rows.length === 0) {
        draw('No transactions in this period.', margin, y, { size: 10 });
      }

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const slug = period === 'all' ? 'financials' : period === 'today' ? 'daily' : period === 'week' ? 'weekly' : period === 'month' ? 'monthly' : period === 'quarter' ? 'quarterly' : period === 'year' ? 'annual' : 'financials';
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}-report-${dateStr}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 200);
    } catch (e) {
      console.error('PDF export failed:', e);
      alert('PDF export failed. Check the console for details.');
    }
  };

  const exportTaxSummary = () => {
    if (!financials) return;
    const periodLabels: Record<string, string> = {
      all: 'All Time',
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      quarter: 'This Quarter',
      year: 'This Year',
    };
    const periodLabel = period === 'custom' && startDate && endDate
      ? `Custom: ${startDate} to ${endDate}`
      : periodLabels[period] ?? period;
    const rev = Number(financials.kpis?.filteredRevenue ?? financials.kpis?.totalRevenue ?? 0);
    const ref = Number(financials.refunds?.total ?? 0);
    const net = rev - ref;
    const rows: string[][] = [
      ['Tax-Ready Financial Summary', ''],
      ['Generated', new Date().toISOString()],
      ['Period', periodLabel],
      ['Total Revenue', formatCurrency(rev)],
      ['Total Refunds', formatCurrency(ref)],
      ['Net Revenue', formatCurrency(net)],
      ['Total Orders', String(financials.orders?.total ?? 0)],
      [''],
      ['Revenue by Payment Method', 'Amount', 'Count'],
    ];
    for (const pm of financials.paymentMethods ?? []) {
      rows.push([pm.method ?? 'Unknown', formatCurrency(pm.amount ?? 0), String(pm.count ?? 0)]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-summary-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    if (!financials) return;
    const payload = {
      generatedAt: new Date().toISOString(),
      kpis: financials.kpis,
      orders: financials.orders,
      customers: financials.customers,
      paymentMethods: financials.paymentMethods,
      paymentAnalytics: financials.paymentAnalytics,
      refunds: financials.refunds,
      recentTransactions: financials.recentTransactions,
      topServices: financials.topServices,
      leastOrderedServices: financials.leastOrderedServices,
      serviceVsProductRevenue: financials.serviceVsProductRevenue,
      revenueByLocation: financials.revenueByLocation,
      serviceCategories: financials.serviceCategories,
      productCategories: financials.productCategories,
      productRevenueByMonth: financials.productRevenueByMonth,
      peakBookingTimes: financials.peakBookingTimes,
      bookingHeatmap: financials.bookingHeatmap,
      revenueForecast: financials.revenueForecast,
      clvBySegment: financials.clvBySegment,
      orderFunnel: financials.orderFunnel,
      seasonalRevenueByMonth: financials.seasonalRevenueByMonth,
      demographics: financials.demographics,
      serviceDemandByLocation: financials.serviceDemandByLocation,
      partialPayments: financials.partialPayments,
      priorYearSamePeriod: financials.priorYearSamePeriod,
      peakTimesByLocation: financials.peakTimesByLocation,
      cancellationByService: financials.cancellationByService,
      weekendWeekday: financials.weekendWeekday,
      holidayImpact: financials.holidayImpact,
      revenueByLocationOverTime: financials.revenueByLocationOverTime,
      mostSoldProducts: financials.mostSoldProducts,
      leastSoldProducts: financials.leastSoldProducts,
      revenueBySegment: financials.revenueBySegment,
      preferredPaymentMethods: financials.preferredPaymentMethods,
      ...(financials.bookingNoShowRate != null
        ? { bookingNoShowRate: financials.bookingNoShowRate, bookingNoShowCount: financials.bookingNoShowCount, bookingTotal: financials.bookingTotal }
        : {}),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financials-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  const { kpis, orders, paymentMethods, paymentAnalytics, orderStatus, orderFunnel, barberEarnings, refunds, recentTransactions, charts, customers, topServices, leastOrderedServices, mostSoldProducts, leastSoldProducts, preferredPaymentMethods, bookingNoShowRate, bookingNoShowCount, bookingTotal, avgBookingLeadTimeDays, sameDayBookingsCount, cancellationByTimeBefore, revenueBySegment, clvBySegment, serviceVsProductRevenue, revenueByLocation, revenueByLocationOverTime, serviceCategories, productCategories, productRevenueByMonth, peakBookingTimes, bookingHeatmap, revenueForecast, weekendWeekday, seasonalRevenueByMonth, demographics, serviceDemandByLocation, partialPayments, priorYearSamePeriod, peakTimesByLocation, cancellationByService, holidayImpact } = financials || {};

  const priorYearYoYPct = priorYearSamePeriod && (priorYearSamePeriod.revenue ?? 0) > 0
    ? (((kpis?.filteredRevenue ?? 0) - (priorYearSamePeriod.revenue ?? 0)) / (priorYearSamePeriod.revenue ?? 1)) * 100
    : null;

  return (
    <div className={styles.financials}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Analytics & Financial Dashboard</h1>
          <p className={styles.pageSubtitle}>Comprehensive business insights and financial overview</p>
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
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {filterOptions && (
            <>
              <div className={styles.filterGroup}>
                <label>Barber:</label>
                <select
                  value={filterBarber}
                  onChange={(e) => setFilterBarber(e.target.value)}
                  className={styles.select}
                  style={{ minWidth: 140 }}
                >
                  <option value="">All</option>
                  {filterOptions.barbers.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Location:</label>
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className={styles.select}
                  style={{ minWidth: 120 }}
                >
                  <option value="">All</option>
                  {filterOptions.locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Category:</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className={styles.select}
                  style={{ minWidth: 120 }}
                >
                  <option value="">All</option>
                  {filterOptions.categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Service:</label>
                <select
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                  className={styles.select}
                  style={{ minWidth: 140 }}
                >
                  <option value="">All</option>
                  {filterOptions.services.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {hasActiveFilters && (
                <>
                  <span className={styles.sectionSubtext} style={{ marginRight: 8, fontSize: '0.85rem', color: '#6c757d' }}>
                    Filtered by: {[filterBarber && 'Barber', filterLocation && 'Location', filterCategory && 'Category', filterService && 'Service'].filter(Boolean).join(' · ')}
                  </span>
                  <button type="button" onClick={clearFilters} className={styles.tabBtn}>
                    Clear filters
                  </button>
                </>
              )}
            </>
          )}

          <div className={styles.filterGroup}>
            <label><Bookmark size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} aria-hidden /> Saved views:</label>
            <select
              value={savedViewSelect}
              onChange={(e) => { const id = e.target.value; if (id) loadSavedView(id); setSavedViewSelect(''); }}
              className={styles.select}
              style={{ minWidth: 160 }}
            >
              <option value="">Load view…</option>
              {savedViews.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <button type="button" onClick={saveCurrentView} className={styles.tabBtn} title="Save current filters as a bookmark">
              <BookmarkPlus size={16} aria-hidden /> Save view
            </button>
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

          {isAdmin() && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={exportToCSV} className={styles.exportButton}>
                <FileDown size={16} aria-hidden /> Export CSV
              </button>
              <button onClick={exportToExcel} className={styles.exportButton}>
                <FileSpreadsheet size={16} aria-hidden /> Export Excel
              </button>
              <button onClick={exportToPDF} className={styles.exportButton}>
                <FileText size={16} aria-hidden /> Export PDF
              </button>
              <button onClick={exportToJSON} className={styles.exportButton}>
                <ClipboardList size={16} aria-hidden /> Export JSON
              </button>
              <button onClick={exportTaxSummary} className={styles.exportButton}>
                <FileText size={16} aria-hidden /> Export Tax Summary
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: isAdmin() ? 8 : 0 }}>
            <button
              onClick={sendWeeklyReport}
              disabled={weeklyReportLoading}
              className={styles.exportButton}
              title="Send a weekly summary to your email"
            >
              <Mail size={16} aria-hidden /> {weeklyReportLoading ? 'Sending…' : 'Send weekly report'}
            </button>
            {weeklyReportMessage && (
              <span style={{ fontSize: '0.85rem', color: weeklyReportMessage.includes('sent') ? '#46B450' : '#dc3232' }}>
                {weeklyReportMessage}
              </span>
            )}
          </div>
        </section>

        {/* Tab Navigation */}
        <nav className={styles.tabNav} aria-label="Analytics tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
            >
              <tab.Icon size={18} aria-hidden /> {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <>
            <section className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <div className={styles.kpiIcon} style={{ background: 'rgba(70, 180, 80, 0.1)' }}><Wallet size={20} aria-hidden /></div>
                  <div className={styles.kpiContent}>
                    <h3 className={styles.kpiLabel}>Total Revenue</h3>
                    <p className={styles.kpiValue}>{formatCurrency(kpis?.totalRevenue || 0)}</p>
                    <span className={styles.kpiSubtext}>All time</span>
                  </div>
                </div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <div className={styles.kpiIcon} style={{ background: 'rgba(70, 180, 80, 0.1)' }}><Calendar size={20} aria-hidden /></div>
                  <div className={styles.kpiContent}>
                    <h3 className={styles.kpiLabel}>This Month</h3>
                    <p className={styles.kpiValue}>{formatCurrency(kpis?.monthRevenue || 0)}</p>
                    <span className={styles.kpiSubtext}>Monthly revenue</span>
                  </div>
                </div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <div className={styles.kpiIcon} style={{ background: 'rgba(57, 65, 63, 0.1)' }}><Package size={20} aria-hidden /></div>
                  <div className={styles.kpiContent}>
                    <h3 className={styles.kpiLabel}>Total Orders</h3>
                    <p className={styles.kpiValue}>{orders?.total ?? 0}</p>
                    <span className={styles.kpiSubtext}>{orders?.paid ?? 0} paid</span>
                  </div>
                </div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <div className={styles.kpiIcon} style={{ background: 'rgba(220, 210, 204, 0.3)' }}><Users size={20} aria-hidden /></div>
                  <div className={styles.kpiContent}>
                    <h3 className={styles.kpiLabel}>Customers</h3>
                    <p className={styles.kpiValue}>{customers?.total ?? 0}</p>
                    <span className={styles.kpiSubtext}>
                      {customers?.newThisPeriod ? `+${customers.newThisPeriod} this period` : 'Total'}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <div className={styles.kpiIcon} style={{ background: 'rgba(220, 210, 204, 0.3)' }}><DollarSign size={20} aria-hidden /></div>
                  <div className={styles.kpiContent}>
                    <h3 className={styles.kpiLabel}>Avg Order Value</h3>
                    <p className={styles.kpiValue}>{formatCurrency(kpis?.avgOrderValue || 0)}</p>
                    <span className={styles.kpiSubtext}>Average per order</span>
                  </div>
                </div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <div className={styles.kpiIcon} style={{ background: 'rgba(23, 162, 184, 0.15)' }}><Users size={20} aria-hidden /></div>
                  <div className={styles.kpiContent}>
                    <h3 className={styles.kpiLabel}>Revenue per Customer</h3>
                    <p className={styles.kpiValue}>{formatCurrency(customers?.avgOrderValuePerCustomer ?? 0)}</p>
                    <span className={styles.kpiSubtext}>
                      Median: {formatCurrency(customers?.medianRevenuePerCustomer ?? 0)}
                      {(customers?.revenueTop10Percent ?? 0) > 0 ? ' · Top 10%: ' + formatCurrency(customers.revenueTop10Percent) + (customers?.revenueTop10PercentOfTotal != null ? ' (' + customers.revenueTop10PercentOfTotal.toFixed(1) + '% of revenue)' : '') : revenueBySegment && (clvBySegment?.vip ?? 0) > 0 ? ' · Top 10% CLV: ' + formatCurrency(clvBySegment?.vip ?? 0) : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <div className={styles.kpiIcon} style={{ background: 'rgba(255, 193, 7, 0.1)' }}><TrendingUp size={20} aria-hidden /></div>
                  <div className={styles.kpiContent}>
                    <h3 className={styles.kpiLabel}>Week Growth</h3>
                    <p className={styles.kpiValue}>
                      {kpis?.weekGrowth != null ? (kpis.weekGrowth > 0 ? '+' : '') + kpis.weekGrowth.toFixed(1) + '%' : '0%'}
                    </p>
                    <span className={styles.kpiSubtext}>vs last week</span>
                  </div>
                </div>
              </div>
              {revenueForecast && (revenueForecast.nextMonth > 0 || revenueForecast.nextThreeMonths > 0) && (
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <div className={styles.kpiIcon} style={{ background: 'rgba(23, 162, 184, 0.15)' }}><LineChartIcon size={20} aria-hidden /></div>
                    <div className={styles.kpiContent}>
                      <h3 className={styles.kpiLabel}>Revenue Forecast</h3>
                      <p className={styles.kpiValue}>{formatCurrency(revenueForecast.nextMonth || 0)}</p>
                      <span className={styles.kpiSubtext}>Next month · {revenueForecast.method}; next 3 mo: {formatCurrency(revenueForecast.nextThreeMonths || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
              {priorYearSamePeriod && (priorYearSamePeriod.revenue > 0 || priorYearSamePeriod.orders > 0) && (
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <div className={styles.kpiIcon} style={{ background: 'rgba(220, 180, 200, 0.2)' }}><Calendar size={20} aria-hidden /></div>
                    <div className={styles.kpiContent}>
                      <h3 className={styles.kpiLabel}>Prior Year Same Period</h3>
                      <p className={styles.kpiValue}>{formatCurrency(priorYearSamePeriod.revenue || 0)}</p>
                      <span className={styles.kpiSubtext}>
                        {priorYearSamePeriod.orders ?? 0} orders · benchmark
                        {priorYearYoYPct != null ? ' · YoY ' + (priorYearYoYPct >= 0 ? '+' : '') + priorYearYoYPct.toFixed(1) + '%' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Period comparison: growth vs prior periods (§12) */}
            <section className={styles.chartCard} style={{ marginBottom: 16 }}>
              <h2 className={styles.chartTitle}>Growth vs Prior Periods</h2>
              <p className={styles.sectionSubtext}>Compare to previous day, week, month, quarter, year</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { label: 'DoD', val: kpis?.dodGrowth, unit: '%' },
                  { label: 'WoW', val: kpis?.weekGrowth, unit: '%' },
                  { label: 'MoM', val: kpis?.momGrowth, unit: '%' },
                  { label: 'QoQ', val: kpis?.quarterGrowth, unit: '%' },
                  { label: 'YoY', val: kpis?.yoyGrowth, unit: '%' },
                ].map(({ label, val, unit }) => (
                  <span
                    key={label}
                    style={{
                      padding: '6px 12px',
                      background: typeof val === 'number' ? (val >= 0 ? 'rgba(70, 180, 80, 0.12)' : 'rgba(220, 53, 69, 0.12)') : '#f0f0f0',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: typeof val === 'number' ? (val >= 0 ? '#46B450' : '#dc3232') : '#6c757d',
                    }}
                  >
                    {label} {typeof val === 'number' ? (val >= 0 ? '+' : '') + val.toFixed(1) + unit : '—'}
                  </span>
                ))}
              </div>
            </section>

            {/* Holiday impact (§11) — revenue on Nigerian public holidays vs avg daily in month */}
            {holidayImpact?.holidayDays?.length > 0 && (
              <section className={styles.chartCard} style={{ marginBottom: 16 }}>
                <h2 className={styles.chartTitle}>Holiday Impact</h2>
                <p className={styles.sectionSubtext}>Revenue on Nigerian public holidays vs average daily revenue in same month (last 12 months)</p>
                <div className={styles.summaryGrid} style={{ marginBottom: 12 }}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Total revenue on holidays</span>
                    <span className={styles.summaryValue}>{formatCurrency(holidayImpact.totalHolidayRevenue ?? 0)}</span>
                  </div>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Holiday</th>
                        <th>Revenue</th>
                        <th>Avg daily (month)</th>
                        <th>Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holidayImpact.holidayDays.map((h: any, i: number) => (
                        <tr key={i}>
                          <td>{h.date}</td>
                          <td>{h.name}</td>
                          <td>{formatCurrency(h.revenue ?? 0)}</td>
                          <td>{formatCurrency(h.avgDailyInMonth ?? 0)}</td>
                          <td style={{ color: (h.impactPercent ?? 0) >= 0 ? '#46B450' : '#dc3232' }}>
                            {(h.impactPercent ?? 0) >= 0 ? '+' : ''}{(h.impactPercent ?? 0).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {isAdmin() && (
              <section className={styles.chartsSection} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                <div className={styles.chartCard}>
                  <h2 className={styles.chartTitle}>Revenue Trend (Last 30 Days)</h2>
                  <ResponsiveContainer width="100%" height={300} className={styles.chartContainer}>
                    <AreaChart data={charts?.revenueTrend || []}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#46B450" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#46B450" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="date" tickFormatter={formatDate} stroke="#6c757d" />
                      <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} stroke="#6c757d" />
                      <Tooltip formatter={(v: any) => formatCurrency(v)} labelFormatter={(l) => formatDate(l)} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#46B450" strokeWidth={2} fill="url(#colorRevenue)" name="Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.chartCard}>
                  <h2 className={styles.chartTitle}>Monthly Revenue (Last 12 Months)</h2>
                  <p className={styles.sectionSubtext}>Growth and seasonal trend</p>
                  <ResponsiveContainer width="100%" height={300} className={styles.chartContainer}>
                    <BarChart data={charts?.monthlyRevenue || []} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#6c757d" />
                      <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} stroke="#6c757d" />
                      <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
                      <Bar dataKey="revenue" fill="#17A2B8" name="Revenue" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Order funnel, completion gauge & seasonal */}
            {orderFunnel && orderFunnel.length > 0 && (
              <section className={styles.chartsSection} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                <div className={styles.chartCard}>
                  <h2 className={styles.chartTitle}>Order Funnel</h2>
                  <p className={styles.sectionSubtext}>All → Paid → Completed</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {orderFunnel.map((s: { stage: string; count: number }, i: number) => {
                      const max = Math.max(1, ...orderFunnel.map((x: { count: number }) => x.count));
                      const pct = max > 0 ? (s.count / max) * 100 : 0;
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ minWidth: 100, fontSize: 13 }}>{s.stage}</span>
                          <div style={{ flex: 1, height: 24, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: pct + '%', height: '100%', background: i === 0 ? '#39413f' : i === 1 ? '#17A2B8' : '#46B450', transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontWeight: 600, minWidth: 48 }}>{s.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {orders?.completionRate != null && (
                  <div className={styles.chartCard}>
                    <h2 className={styles.chartTitle}>Order Completion Rate</h2>
                    <p className={styles.sectionSubtext}>Completed orders as % of total</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 140 }}>
                      <div style={{ position: 'relative', width: 120, height: 70 }}>
                        <svg viewBox="0 0 120 70" style={{ width: '100%', height: '100%' }}>
                          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#f0f0f0" strokeWidth="12" strokeLinecap="round" />
                          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#46B450" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(Math.min(100, Math.max(0, Number(orders.completionRate))) / 100) * 157} 500`} />
                        </svg>
                        <span style={{ position: 'absolute', left: '50%', bottom: 4, transform: 'translateX(-50%)', fontSize: 18, fontWeight: 700 }}>{Number(orders.completionRate).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}
                {seasonalRevenueByMonth && seasonalRevenueByMonth.length > 0 && (
                  <div className={styles.chartCard}>
                    <h2 className={styles.chartTitle}>Seasonal Revenue by Month</h2>
                    <p className={styles.sectionSubtext}>All-time revenue per month (Jan–Dec)</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={seasonalRevenueByMonth} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: any) => formatCurrency(v)} />
                        <Bar dataKey="revenue" fill="#DCB2CC" name="Revenue" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
            )}

            <section className={styles.chartsSection} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
              <div className={styles.chartCard}>
                <h2 className={styles.chartTitle}>Top Services</h2>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Orders</th>
                        <th>Quantity</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(topServices || []).length > 0 ? (topServices || []).map((s: any, i: number) => (
                        <tr key={i}>
                          <td>{s.title}</td>
                          <td>{s.orders}</td>
                          <td>{s.quantity}</td>
                          <td>{formatCurrency(s.revenue ?? 0)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className={styles.emptyState}>No data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={styles.chartCard}>
                <h2 className={styles.chartTitle}>Top Barbers</h2>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Barber</th>
                        <th>Revenue</th>
                        <th>Orders</th>
                        <th>Services</th>
                        <th>Growth</th>
                        <th>Cancellation Rate</th>
                        <th>Retention</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isAdmin() && barberEarnings?.length > 0 ? barberEarnings.slice(0, 8).map((b: any) => (
                        <tr key={b.barberId}>
                          <td style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setFilterBarber(b.barberId)} title="Click to filter by this barber">{b.barberName}</td>
                          <td>{formatCurrency(b.totalRevenue)}</td>
                          <td>{b.ordersCount}</td>
                          <td>{b.servicesCompleted ?? 0}</td>
                          <td style={{ color: b.earningsGrowth != null ? (b.earningsGrowth >= 0 ? '#46B450' : '#dc3232') : undefined }}>{b.earningsGrowth != null ? (b.earningsGrowth >= 0 ? '+' : '') + b.earningsGrowth.toFixed(1) + '%' : '—'}</td>
                          <td>{b.cancellationRate != null ? b.cancellationRate.toFixed(1) + '%' : '—'}</td>
                          <td>{b.retentionRate != null ? b.retentionRate.toFixed(1) + '%' : '—'}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={7} className={styles.emptyState}>No data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Tab: Financial (full content) */}
        {activeTab === 'financial' && (
        <>
        {/* KPI Cards */}
        <section className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(70, 180, 80, 0.1)' }}>
                <Wallet size={20} aria-hidden />
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
                <Calendar size={20} aria-hidden />
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
                <Calendar size={20} aria-hidden />
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
                <Package size={20} aria-hidden />
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
                <DollarSign size={20} aria-hidden />
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
              <div className={styles.kpiIcon} style={{ background: 'rgba(23, 162, 184, 0.1)' }}><RefreshCw size={20} aria-hidden /></div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>Revenue per Visit</h3>
                <p className={styles.kpiValue}>{formatCurrency(kpis?.revenuePerVisit ?? 0)}</p>
                <span className={styles.kpiSubtext}>Per paid booking</span>
              </div>
            </div>
          </div>

          {revenueBySegment && (
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: 'rgba(255, 193, 7, 0.15)' }}><Crown size={20} aria-hidden /></div>
                <div className={styles.kpiContent}>
                  <h3 className={styles.kpiLabel}>Top 10% Revenue</h3>
                  <p className={styles.kpiValue}>{formatCurrency(revenueBySegment.vip?.revenue ?? 0)}</p>
                  <span className={styles.kpiSubtext}>
                    {revenueBySegment.vip?.count ?? 0} customers · {kpis?.filteredRevenue ? ((revenueBySegment.vip?.revenue ?? 0) / (kpis.filteredRevenue || 1) * 100).toFixed(1) : '0'}% of period
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(255, 193, 7, 0.1)' }}>
                <TrendingUp size={20} aria-hidden />
              </div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>Week Growth</h3>
                <p className={styles.kpiValue}>
                  {kpis?.weekGrowth != null ? (kpis.weekGrowth > 0 ? '+' : '') + kpis.weekGrowth.toFixed(1) + '%' : '0%'}
                </p>
                <span className={styles.kpiSubtext}>vs last week</span>
              </div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(255, 193, 7, 0.1)' }}><Calendar size={20} aria-hidden /></div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>DoD Growth</h3>
                <p className={styles.kpiValue}>
                  {kpis?.dodGrowth != null ? (kpis.dodGrowth > 0 ? '+' : '') + kpis.dodGrowth.toFixed(1) + '%' : '0%'}
                </p>
                <span className={styles.kpiSubtext}>vs yesterday</span>
              </div>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(70, 180, 80, 0.1)' }}>📊</div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>This Quarter</h3>
                <p className={styles.kpiValue}>{formatCurrency(kpis?.quarterRevenue || 0)}</p>
                <span className={styles.kpiSubtext}>Quarterly revenue</span>
              </div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(255, 193, 7, 0.1)' }}><LineChartIcon size={20} aria-hidden /></div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>QoQ Growth</h3>
                <p className={styles.kpiValue}>
                  {kpis?.quarterGrowth != null ? (kpis.quarterGrowth > 0 ? '+' : '') + kpis.quarterGrowth.toFixed(1) + '%' : '0%'}
                </p>
                <span className={styles.kpiSubtext}>vs last quarter</span>
              </div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(220, 210, 204, 0.3)' }}><PieChartIcon size={20} aria-hidden /></div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>Median Order Value</h3>
                <p className={styles.kpiValue}>{formatCurrency(kpis?.medianOrderValue ?? 0)}</p>
                <span className={styles.kpiSubtext}>Median per order</span>
              </div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(255, 193, 7, 0.1)' }}><LineChartIcon size={20} aria-hidden /></div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>MoM Growth</h3>
                <p className={styles.kpiValue}>
                  {kpis?.momGrowth != null ? (kpis.momGrowth > 0 ? '+' : '') + kpis.momGrowth.toFixed(1) + '%' : '0%'}
                </p>
                <span className={styles.kpiSubtext}>vs last month</span>
              </div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(255, 193, 7, 0.1)' }}><TrendingDown size={20} aria-hidden /></div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>YoY Growth</h3>
                <p className={styles.kpiValue}>
                  {kpis?.yoyGrowth != null ? (kpis.yoyGrowth > 0 ? '+' : '') + kpis.yoyGrowth.toFixed(1) + '%' : '0%'}
                </p>
                <span className={styles.kpiSubtext}>vs last year</span>
              </div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(70, 180, 80, 0.1)' }}><TrendingUp size={20} aria-hidden /></div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>Net Profit</h3>
                <p className={styles.kpiValue}>{formatCurrency(kpis?.netProfit ?? 0)}</p>
                <span className={styles.kpiSubtext}>Revenue − refunds</span>
              </div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ background: 'rgba(255, 107, 107, 0.1)' }}><RotateCcw size={20} aria-hidden /></div>
              <div className={styles.kpiContent}>
                <h3 className={styles.kpiLabel}>Refund Rate</h3>
                <p className={styles.kpiValue}>{kpis?.refundRate != null ? kpis.refundRate.toFixed(1) + '%' : '0%'}</p>
                <span className={styles.kpiSubtext}>% of revenue refunded</span>
              </div>
            </div>
          </div>
        </section>

        {/* Charts Section - Admin Only */}
        {isAdmin() && (
        <section className={styles.chartsSection}>
          {/* Revenue Trend Chart */}
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Revenue Trend (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={300} className={styles.chartContainer}>
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
            <ResponsiveContainer width="100%" height={300} className={styles.chartContainer}>
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
            <ResponsiveContainer width="100%" height={300} className={styles.chartContainer}>
              <PieChart>
                <Pie
                  data={paymentMethods || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
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

          {/* Payment Analytics */}
          {paymentAnalytics && (
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Payment Analytics</h2>
              <div style={{ marginBottom: 16 }}>
                <div className={styles.summaryItem} style={{ marginBottom: 8 }}>
                  <span className={styles.summaryLabel}>Overall Payment Completion Rate</span>
                  <span className={styles.summaryValue}>
                    {paymentAnalytics.overallCompletionRate?.toFixed(1) || '0'}%
                  </span>
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Payment Method</th>
                      <th>Total Attempts</th>
                      <th>Successful</th>
                      <th>Success Rate</th>
                      <th>Avg Transaction Value</th>
                      <th>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentAnalytics.byMethod?.length > 0 ? (
                      paymentAnalytics.byMethod.map((method: any, idx: number) => (
                        <tr key={idx}>
                          <td>{method.method}</td>
                          <td>{method.totalAttempts}</td>
                          <td>{method.successfulPayments}</td>
                          <td>
                            <span style={{ color: method.successRate >= 90 ? '#46B450' : method.successRate >= 70 ? '#FFC107' : '#FF6B6B' }}>
                              {method.successRate.toFixed(1)}%
                            </span>
                          </td>
                          <td>{formatCurrency(method.avgTransactionValue)}</td>
                          <td>{formatCurrency(method.totalRevenue)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className={styles.emptyState}>No payment data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Weekend vs Weekday */}
          {weekendWeekday && (
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Weekend vs Weekday</h2>
              <p className={styles.sectionSubtext}>Revenue and orders (Sat–Sun vs Mon–Fri) in selected period</p>
              <div className={styles.summaryGrid} style={{ marginBottom: 16 }}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Weekend Revenue</span>
                  <span className={styles.summaryValue}>{formatCurrency(weekendWeekday.weekend?.revenue ?? 0)}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Weekend Orders</span>
                  <span className={styles.summaryValue}>{weekendWeekday.weekend?.orders ?? 0}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Weekday Revenue</span>
                  <span className={styles.summaryValue}>{formatCurrency(weekendWeekday.weekday?.revenue ?? 0)}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Weekday Orders</span>
                  <span className={styles.summaryValue}>{weekendWeekday.weekday?.orders ?? 0}</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[
                    { name: 'Weekend', revenue: weekendWeekday.weekend?.revenue ?? 0, orders: weekendWeekday.weekend?.orders ?? 0 },
                    { name: 'Weekday', revenue: weekendWeekday.weekday?.revenue ?? 0, orders: weekendWeekday.weekday?.orders ?? 0 },
                  ]}
                  margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#17A2B8" name="Revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Revenue by Customer Segment (New, Returning, VIP) */}
          {revenueBySegment && (
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Revenue by Customer Segment</h2>
              <p className={styles.sectionSubtext}>New (first order in period), Returning, VIP (top 10% by revenue)</p>
              <div className={styles.summaryGrid} style={{ marginBottom: 16 }}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>New Customers Revenue</span>
                  <span className={styles.summaryValue}>{formatCurrency(revenueBySegment.new?.revenue ?? 0)}</span>
                  <span className={styles.kpiSubtext}>{revenueBySegment.new?.count ?? 0} customers</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Returning Revenue</span>
                  <span className={styles.summaryValue}>{formatCurrency(revenueBySegment.returning?.revenue ?? 0)}</span>
                  <span className={styles.kpiSubtext}>{revenueBySegment.returning?.count ?? 0} customers</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>VIP (Top 10%) Revenue</span>
                  <span className={styles.summaryValue}>{formatCurrency(revenueBySegment.vip?.revenue ?? 0)}</span>
                  <span className={styles.kpiSubtext}>{revenueBySegment.vip?.count ?? 0} customers</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[
                    { name: 'New', revenue: revenueBySegment.new?.revenue ?? 0 },
                    { name: 'Returning', revenue: revenueBySegment.returning?.revenue ?? 0 },
                    { name: 'VIP (Top 10%)', revenue: revenueBySegment.vip?.revenue ?? 0 },
                  ]}
                  margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#39413f" name="Revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Order Status Chart */}
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Orders by Status</h2>
            <ResponsiveContainer width="100%" height={300} className={styles.chartContainer}>
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

          {/* Revenue by Location */}
          {revenueByLocation?.length > 0 && (
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Revenue by Location</h2>
              <p className={styles.sectionSubtext}>Revenue, orders, and customers per city. Click city to filter.</p>
              <ResponsiveContainer width="100%" height={300} className={styles.chartContainer}>
                <BarChart data={revenueByLocation} margin={{ bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="city" stroke="#6c757d" angle={-35} textAnchor="end" height={80} interval={0} />
                  <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} stroke="#6c757d" />
                  <Tooltip
                    formatter={(v: any) => formatCurrency(v)}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                  />
                  <Bar dataKey="revenue" fill="#17A2B8" radius={[8, 8, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
              <div className={styles.tableWrap} style={{ marginTop: 16 }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>City</th>
                      <th>Revenue</th>
                      <th>Orders</th>
                      <th>Customers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueByLocation.map((r: any, i: number) => (
                      <tr key={i}>
                        <td style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setFilterLocation(r.city || '')} title="Click to filter by this location">{r.city}</td>
                        <td>{formatCurrency(r.revenue ?? 0)}</td>
                        <td>{r.orders ?? 0}</td>
                        <td>{r.customers ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Location-specific trends over time (§10) */}
          {revenueByLocationOverTime?.length > 0 && (() => {
            const top = revenueByLocationOverTime.slice(0, 4);
            const labelsSet = new Set<string>();
            top.forEach((c: any) => (c.monthly || []).forEach((m: any) => labelsSet.add(m.label)));
            const labels = [...labelsSet].sort((a, b) => {
              const [ma, ya] = a.split(' '); const [mb, yb] = b.split(' ');
              const o: Record<string, number> = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 };
              if (ya !== yb) return Number(ya) - Number(yb);
              return (o[ma] || 0) - (o[mb] || 0);
            });
            const series: { label: string; [k: string]: any }[] = labels.map((label) => {
              const row: { label: string; [k: string]: any } = { label };
              top.forEach((c: any) => {
                const m = (c.monthly || []).find((x: any) => x.label === label);
                row[c.city] = m?.revenue ?? 0;
              });
              return row;
            });
            const lineColors = ['#46B450', '#17A2B8', '#39413f', '#DCB2CC'];
            return (
              <div className={styles.chartCard}>
                <h2 className={styles.chartTitle}>Revenue by Location Over Time</h2>
                <p className={styles.sectionSubtext}>Monthly revenue per city, last 12 months</p>
                <ResponsiveContainer width="100%" height={280} className={styles.chartContainer}>
                  <LineChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#6c757d" />
                    <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} stroke="#6c757d" />
                    <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
                    <Legend />
                    {top.map((c: any, i: number) => (
                      <Line key={c.city} type="monotone" dataKey={c.city} stroke={lineColors[i % lineColors.length]} strokeWidth={2} dot={{ r: 3 }} name={c.city} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          })()}

          {/* Revenue per Service */}
          {topServices?.length > 0 && (
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Revenue per Service</h2>
              <p className={styles.sectionSubtext} style={{ marginTop: 0, marginBottom: 8 }}>Click a bar to filter by service</p>
              <ResponsiveContainer width="100%" height={300} className={styles.chartContainer}>
                <BarChart data={topServices} margin={{ bottom: 80 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis type="number" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} stroke="#6c757d" />
                  <YAxis type="category" dataKey="title" width={120} stroke="#6c757d" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: any) => formatCurrency(v)}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                  />
                  <Bar dataKey="revenue" fill="#46B450" radius={[0, 8, 8, 0]} name="Revenue" onClick={(data: any) => { if (data?.title) setFilterService(data.title); }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Service vs Product Revenue */}
          {serviceVsProductRevenue && (serviceVsProductRevenue.serviceRevenue > 0 || serviceVsProductRevenue.productRevenue > 0) && (
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Service vs Product Revenue</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Services', value: serviceVsProductRevenue.serviceRevenue, fill: '#46B450' },
                        { name: 'Products', value: serviceVsProductRevenue.productRevenue, fill: '#17A2B8' },
                      ].filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: 'Services', value: serviceVsProductRevenue.serviceRevenue, fill: '#46B450' },
                        { name: 'Products', value: serviceVsProductRevenue.productRevenue, fill: '#17A2B8' },
                      ]
                        .filter((d) => d.value > 0)
                        .map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div className={styles.summaryItem} style={{ marginBottom: 8 }}>
                    <span className={styles.summaryLabel}>Service revenue</span>
                    <span className={styles.summaryValue}>{formatCurrency(serviceVsProductRevenue.serviceRevenue)}</span>
                  </div>
                  <div className={styles.summaryItem} style={{ marginBottom: 8 }}>
                    <span className={styles.summaryLabel}>Product revenue</span>
                    <span className={styles.summaryValue}>{formatCurrency(serviceVsProductRevenue.productRevenue)}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Service %</span>
                    <span className={styles.summaryValue}>{serviceVsProductRevenue.servicePercent}%</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Product %</span>
                    <span className={styles.summaryValue}>{serviceVsProductRevenue.productPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
        )}

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
                <span className={styles.summaryLabel}>Net Profit</span>
                <span className={styles.summaryValue}>{formatCurrency(kpis?.netProfit ?? (kpis?.totalRevenue || 0) - (refunds?.total || 0))}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Refunds</span>
                <span className={styles.summaryValue}>{formatCurrency(refunds?.total || 0)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Refund Rate</span>
                <span className={styles.summaryValue}>{kpis?.refundRate != null ? kpis.refundRate.toFixed(1) + '%' : '0%'}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Pending Payments</span>
                <span className={styles.summaryValue}>{orders?.pending || 0} orders</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Failed Payments</span>
                <span className={styles.summaryValue}>{orders?.failed || 0} orders</span>
              </div>
              {partialPayments && (partialPayments.count > 0 || partialPayments.totalAmount > 0) && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Partial Payments</span>
                  <span className={styles.summaryValue}>{partialPayments.count} orders · {formatCurrency(partialPayments.totalAmount)}</span>
                </div>
              )}
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Order Completion Rate</span>
                <span className={styles.summaryValue}>{orders?.completionRate != null ? orders.completionRate.toFixed(1) + '%' : '0%'}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Order Cancellation Rate</span>
                <span className={styles.summaryValue}>{orders?.cancellationRate != null ? orders.cancellationRate.toFixed(1) + '%' : '0%'}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Order Refund Rate</span>
                <span className={styles.summaryValue}>{orders?.refundRate != null ? orders.refundRate.toFixed(1) + '%' : '0%'}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Avg Time to Payment</span>
                <span className={styles.summaryValue}>{formatDuration(orders?.avgTimeToPaymentSeconds ?? 0)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Avg Time to Completion</span>
                <span className={styles.summaryValue}>{formatDuration(orders?.avgTimeToCompletionSeconds ?? 0)}</span>
              </div>
              {isAdmin() && (
                <>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Company Commission</span>
                    <span className={styles.summaryValue}>{formatCurrency(financials?.totalCompanyCommission || 0)}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Barber Payouts</span>
                    <span className={styles.summaryValue}>{formatCurrency(financials?.totalBarberPayouts || 0)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Top Earning Barbers - Admin Only */}
        {isAdmin() && barberEarnings && barberEarnings.length > 0 && (
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
                      <th>Services</th>
                      <th>Growth</th>
                      <th>Cancellation Rate</th>
                      <th>Retention</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barberEarnings.map((barber: any) => (
                      <tr key={barber.barberId}>
                        <td style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setFilterBarber(barber.barberId)} title="Click to filter by this barber">{barber.barberName}</td>
                        <td>{formatCurrency(barber.totalRevenue)}</td>
                        <td>{((barber.commissionRate ?? 0) * 100).toFixed(0)}%</td>
                        <td>{formatCurrency(barber.barberEarning)}</td>
                        <td>{barber.ordersCount}</td>
                        <td>{barber.servicesCompleted ?? 0}</td>
                        <td style={{ color: barber.earningsGrowth != null ? (barber.earningsGrowth >= 0 ? '#46B450' : '#dc3232') : undefined }}>{barber.earningsGrowth != null ? (barber.earningsGrowth >= 0 ? '+' : '') + barber.earningsGrowth.toFixed(1) + '%' : '—'}</td>
                        <td>{barber.cancellationRate != null ? barber.cancellationRate.toFixed(1) + '%' : '—'}</td>
                        <td>{barber.retentionRate != null ? barber.retentionRate.toFixed(1) + '%' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Refund History */}
        <section className={styles.transactionsSection}>
          <div className={styles.summaryCard}>
            <h2 className={styles.sectionTitle}>Refund History</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds?.recent?.length ? (
                    refunds.recent.map((r: any) => (
                      <tr key={r.id}>
                        <td>{r.orderNumber}</td>
                        <td>{r.customerName}</td>
                        <td>{formatCurrency(r.amount)}</td>
                        <td>{new Date(r.date).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className={styles.emptyState}>No refunds</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

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
                    <th>Items</th>
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
                        <td title={transaction.itemTitles?.join(', ')}>
                          {transaction.itemTitles?.length ? (transaction.itemTitles.join(', ').length > 40 ? transaction.itemTitles.join(', ').slice(0, 37) + '...' : transaction.itemTitles.join(', ')) : '—'}
                        </td>
                        <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className={styles.emptyState}>
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Transaction Log (search + pagination) */}
        <section className={styles.transactionsSection}>
          <div className={styles.summaryCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Transaction Log</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="search"
                  placeholder="Search by order #, customer..."
                  value={txSearchInput}
                  onChange={(e) => setTxSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), setTxSearch(txSearchInput), setTxPage(1))}
                  className={styles.input}
                  style={{ minWidth: 200 }}
                />
                <button
                  type="button"
                  onClick={() => { setTxSearch(txSearchInput); setTxPage(1); }}
                  className={styles.exportButton}
                >
                  Search
                </button>
                {txSearch && (
                  <button
                    type="button"
                    onClick={() => { setTxSearch(''); setTxSearchInput(''); setTxPage(1); }}
                    className={styles.tabBtn}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {txLoading ? (
              <div className={styles.emptyState}>Loading...</div>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Barber</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txData?.transactions?.length ? (
                        txData.transactions.map((t: any) => (
                          <tr key={t.id}>
                            <td>{t.orderNumber}</td>
                            <td>{t.customerName}</td>
                            <td>{formatCurrency(t.amount)}</td>
                            <td>{t.paymentMethod}</td>
                            <td>
                              <span className={`${styles.statusBadge} ${styles[`status${t.paymentStatus}`]}`}>
                                {t.paymentStatus}
                              </span>
                            </td>
                            <td>{t.barberName || '—'}</td>
                            <td>{new Date(t.createdAt).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={7} className={styles.emptyState}>No transactions</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {txData && txData.totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
                    <span className={styles.kpiSubtext}>
                      Page {txData.page} of {txData.totalPages} · {txData.total} total
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        disabled={txData.page <= 1}
                        onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                        className={styles.tabBtn}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={txData.page >= txData.totalPages}
                        onClick={() => setTxPage((p) => p + 1)}
                        className={styles.tabBtn}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
        </>
        )}

        {/* Tab: Customers */}
        {activeTab === 'customers' && (
          <>
            <section className={styles.summarySection}>
              <div className={styles.summaryCard}>
                <h2 className={styles.sectionTitle}>Customer Metrics</h2>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Total Customers</span>
                    <span className={styles.summaryValue}>{customers?.total ?? 0}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>New This Period</span>
                    <span className={styles.summaryValue}>{customers?.newThisPeriod ?? 0}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>New Today</span>
                    <span className={styles.summaryValue}>{customers?.newToday ?? 0}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>New This Week</span>
                    <span className={styles.summaryValue}>{customers?.newThisWeek ?? 0}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>New This Month</span>
                    <span className={styles.summaryValue}>{customers?.newThisMonth ?? 0}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Customer Growth Rate</span>
                    <span className={styles.summaryValue}>
                      {customers?.growthRate != null ? (customers.growthRate > 0 ? '+' : '') + customers.growthRate.toFixed(1) + '%' : '0%'}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Active Customers</span>
                    <span className={styles.summaryValue}>{customers?.active ?? 0}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Inactive Customers</span>
                    <span className={styles.summaryValue}>{customers?.inactive ?? 0}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>ARPU</span>
                    <span className={styles.summaryValue}>{formatCurrency(customers?.arpu ?? 0)}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Avg Order Value per Customer</span>
                    <span className={styles.summaryValue}>{formatCurrency(customers?.avgOrderValuePerCustomer ?? 0)}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Median Revenue per Customer</span>
                    <span className={styles.summaryValue}>{formatCurrency(customers?.medianRevenuePerCustomer ?? 0)}</span>
                  </div>
                  {(customers?.revenueTop10Percent ?? 0) > 0 && (
                    <>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Revenue from Top 10%</span>
                        <span className={styles.summaryValue}>{formatCurrency(customers?.revenueTop10Percent ?? 0)}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Top 10% of Total Revenue</span>
                        <span className={styles.summaryValue}>{customers?.revenueTop10PercentOfTotal != null ? customers.revenueTop10PercentOfTotal.toFixed(1) + '%' : '—'}</span>
                      </div>
                    </>
                  )}
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Purchase Frequency</span>
                    <span className={styles.summaryValue}>{customers?.purchaseFrequency != null ? customers.purchaseFrequency.toFixed(2) : '0'} orders/customer</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Avg Time Between Purchases</span>
                    <span className={styles.summaryValue}>{customers?.avgTimeBetweenPurchasesDays != null ? customers.avgTimeBetweenPurchasesDays.toFixed(1) : '0'} days</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Retention Rate</span>
                    <span className={styles.summaryValue}>{customers?.retentionRate != null ? customers.retentionRate.toFixed(1) + '%' : '0%'}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Churn Rate</span>
                    <span className={styles.summaryValue}>{customers?.churnRate != null ? customers.churnRate.toFixed(1) + '%' : '0%'}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>CLV (Avg Lifetime Value)</span>
                    <span className={styles.summaryValue}>{formatCurrency(customers?.clv ?? 0)}</span>
                  </div>
                </div>
              </div>
            </section>
            {clvBySegment && (clvBySegment.new > 0 || clvBySegment.returning > 0 || clvBySegment.vip > 0) && (
              <section className={styles.summarySection}>
                <div className={styles.summaryCard}>
                  <h2 className={styles.sectionTitle}>CLV by Segment</h2>
                  <p className={styles.sectionSubtext}>Avg lifetime value per customer in each segment (when period filter is applied)</p>
                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>New</span>
                      <span className={styles.summaryValue}>{formatCurrency(clvBySegment.new ?? 0)}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Returning</span>
                      <span className={styles.summaryValue}>{formatCurrency(clvBySegment.returning ?? 0)}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>VIP (Top 10%)</span>
                      <span className={styles.summaryValue}>{formatCurrency(clvBySegment.vip ?? 0)}</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Customer demographics */}
            {demographics && (Object.keys(demographics.gender || {}).length > 0 || (demographics.ageBuckets || []).some((a: { count: number }) => a.count > 0)) && (
              <section className={styles.summarySection}>
                <div className={styles.chartCard}>
                  <h2 className={styles.sectionTitle}>Customer Demographics</h2>
                  <p className={styles.sectionSubtext}>Gender and age distribution</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
                    {Object.keys(demographics.gender || {}).length > 0 && (
                      <div>
                        <h3 className={styles.chartTitle} style={{ fontSize: 14 }}>Gender</h3>
                        <div className={styles.summaryGrid} style={{ marginTop: 8 }}>
                          {Object.entries(demographics.gender).map(([g, n]) => (
                            <div key={g} className={styles.summaryItem}>
                              <span className={styles.summaryLabel}>{g}</span>
                              <span className={styles.summaryValue}>{String(n)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(demographics.ageBuckets || []).some((a: { count: number }) => a.count > 0) && (
                      <div>
                        <h3 className={styles.chartTitle} style={{ fontSize: 14 }}>Age</h3>
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={demographics.ageBuckets || []} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                            <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#17A2B8" name="Customers" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {customers?.acquisitionTrends && customers.acquisitionTrends.length > 0 && (
              <section className={styles.summarySection}>
                <div className={styles.chartCard}>
                  <h2 className={styles.chartTitle}>Customer Acquisition Trends</h2>
                  <p className={styles.sectionSubtext}>New customers per month (last 12 months)</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={customers.acquisitionTrends} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={(v: any) => [v, 'New customers']} />
                      <Area type="monotone" dataKey="count" stroke="#17A2B8" fill="#17A2B8" fillOpacity={0.3} name="New customers" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
            {preferredPaymentMethods && preferredPaymentMethods.length > 0 && (
              <section className={styles.summarySection}>
                <div className={styles.chartCard}>
                  <h2 className={styles.chartTitle}>Preferred Payment Methods</h2>
                  <p className={styles.sectionSubtext}>Distribution by customers’ most-used payment method (period filter applied)</p>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Method</th>
                          <th>Customers</th>
                          <th>Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preferredPaymentMethods.map((p: any, i: number) => (
                          <tr key={i}>
                            <td>{p.method}</td>
                            <td>{p.customerCount}</td>
                            <td>{(p.percentage ?? 0).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
            <section className={styles.summarySection}>
              <div className={styles.summaryCard}>
                <div>
                  <Link href="/admin/customers/analytics" className={styles.linkButton}>
                    <BarChart2 size={16} aria-hidden /> View Full Customer Analytics
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Tab: Orders & Services */}
        {activeTab === 'orders' && (
          <>
            <section className={styles.summarySection}>
              <div className={styles.summaryCard}>
                <h2 className={styles.sectionTitle}>Order Metrics</h2>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Total Orders</span>
                    <span className={styles.summaryValue}>{orders?.total ?? 0}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>This Week</span>
                    <span className={styles.summaryValue}>{orders?.thisWeek ?? 0}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>This Month</span>
                    <span className={styles.summaryValue}>{orders?.thisMonth ?? 0}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>This Year</span>
                    <span className={styles.summaryValue}>{orders?.thisYear ?? 0}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>This Quarter</span>
                    <span className={styles.summaryValue}>{orders?.thisQuarter ?? 0}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Order Week Growth</span>
                    <span className={styles.summaryValue}>
                      {orders?.weekGrowth != null ? (orders.weekGrowth > 0 ? '+' : '') + orders.weekGrowth.toFixed(1) + '%' : '0%'}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Order MoM Growth</span>
                    <span className={styles.summaryValue}>
                      {orders?.momGrowth != null ? (orders.momGrowth > 0 ? '+' : '') + orders.momGrowth.toFixed(1) + '%' : '0%'}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Order YoY Growth</span>
                    <span className={styles.summaryValue}>
                      {orders?.yoyGrowth != null ? (orders.yoyGrowth > 0 ? '+' : '') + orders.yoyGrowth.toFixed(1) + '%' : '0%'}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Order QoQ Growth</span>
                    <span className={styles.summaryValue}>
                      {orders?.quarterGrowth != null ? (orders.quarterGrowth > 0 ? '+' : '') + orders.quarterGrowth.toFixed(1) + '%' : '0%'}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Order DoD Growth</span>
                    <span className={styles.summaryValue}>
                      {orders?.dodGrowth != null ? (orders.dodGrowth > 0 ? '+' : '') + orders.dodGrowth.toFixed(1) + '%' : '0%'}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Orders Today</span>
                    <span className={styles.summaryValue}>{orders?.today ?? 0}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Orders Yesterday</span>
                    <span className={styles.summaryValue}>{orders?.yesterday ?? 0}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Completion Rate</span>
                    <span className={styles.summaryValue}>{orders?.completionRate != null ? orders.completionRate.toFixed(1) + '%' : '0%'}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Cancellation Rate</span>
                    <span className={styles.summaryValue}>{orders?.cancellationRate != null ? orders.cancellationRate.toFixed(1) + '%' : '0%'}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Order Refund Rate</span>
                    <span className={styles.summaryValue}>{orders?.refundRate != null ? orders.refundRate.toFixed(1) + '%' : '0%'}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Avg Order Value</span>
                    <span className={styles.summaryValue}>{formatCurrency(kpis?.avgOrderValue ?? 0)}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Median Order Value</span>
                    <span className={styles.summaryValue}>{formatCurrency(kpis?.medianOrderValue ?? 0)}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Avg Time to Payment</span>
                    <span className={styles.summaryValue}>{formatDuration(orders?.avgTimeToPaymentSeconds ?? 0)}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Avg Time to Completion</span>
                    <span className={styles.summaryValue}>{formatDuration(orders?.avgTimeToCompletionSeconds ?? 0)}</span>
                  </div>
                  {orders?.avgServiceCompletionMinutes != null && (
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Avg Service Completion</span>
                      <span className={styles.summaryValue}>{orders.avgServiceCompletionMinutes} min</span>
                    </div>
                  )}
                  {orders?.avgScheduledDurationMinutes != null && (
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Avg Scheduled Duration</span>
                      <span className={styles.summaryValue}>{orders.avgScheduledDurationMinutes} min</span>
                    </div>
                  )}
                  {bookingNoShowRate != null && (
                    <>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Booking No-Show Rate</span>
                        <span className={styles.summaryValue}>{bookingNoShowRate.toFixed(1)}%</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>No-Shows / Total Bookings</span>
                        <span className={styles.summaryValue}>{bookingNoShowCount ?? 0} / {bookingTotal ?? 0}</span>
                      </div>
                    </>
                  )}
                  {avgBookingLeadTimeDays != null && (
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Avg Booking Lead Time</span>
                      <span className={styles.summaryValue}>{avgBookingLeadTimeDays.toFixed(1)} days</span>
                    </div>
                  )}
                  {sameDayBookingsCount != null && (
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Same-Day Bookings</span>
                      <span className={styles.summaryValue}>{sameDayBookingsCount}</span>
                    </div>
                  )}
                  {cancellationByTimeBefore && cancellationByTimeBefore.total > 0 && (
                    <>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Cancellations by Time Before</span>
                        <span className={styles.summaryValue}>{cancellationByTimeBefore.total} total</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Same day / 1–7 days / 7+ days</span>
                        <span className={styles.summaryValue}>{cancellationByTimeBefore.sameDay} / {cancellationByTimeBefore.oneToSevenDays} / {cancellationByTimeBefore.sevenPlusDays}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
            <section className={styles.chartsSection} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
              <div className={styles.chartCard}>
                <h2 className={styles.chartTitle}>Orders by Status</h2>
                <ResponsiveContainer width="100%" height={280} className={styles.chartContainer}>
                  <BarChart data={orderStatus || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="status" stroke="#6c757d" />
                    <YAxis stroke="#6c757d" />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#39413f" radius={[8, 8, 0, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.chartCard}>
                <h2 className={styles.chartTitle}>Payment Methods</h2>
                <ResponsiveContainer width="100%" height={280} className={styles.chartContainer}>
                  <PieChart>
                    <Pie
                      data={paymentMethods || []}
                      cx="50%" cy="50%"
                      labelLine={false}
                      label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="amount"
                      nameKey="method"
                    >
                      {(paymentMethods || []).map((e: any, i: number) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
            <div className={styles.chartCard} style={{ marginBottom: 24 }}>
              <h2 className={styles.chartTitle}>Top Services</h2>
              {topServices?.[0]?.ordersGrowth != null && (
                <p className={styles.sectionSubtext}>Orders Δ and Revenue Δ vs previous period</p>
              )}
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Orders</th>
                      {topServices?.[0]?.ordersGrowth != null && <th>Orders Δ</th>}
                      <th>Quantity</th>
                      <th>Revenue</th>
                      {topServices?.[0]?.revenueGrowth != null && <th>Revenue Δ</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(topServices || []).length > 0 ? (topServices || []).map((s: any, i: number) => (
                      <tr key={i}>
                        <td style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setFilterService(s.title)} title="Click to filter by this service">{s.title}</td>
                        <td>{s.orders}</td>
                        {s.ordersGrowth != null && (
                          <td style={{ color: Number(s.ordersGrowth) >= 0 ? '#46B450' : '#dc3232' }}>
                            {Number(s.ordersGrowth) >= 0 ? '+' : ''}{(Number(s.ordersGrowth)).toFixed(1)}%
                          </td>
                        )}
                        <td>{s.quantity}</td>
                        <td>{formatCurrency(s.revenue ?? 0)}</td>
                        {s.revenueGrowth != null && (
                          <td style={{ color: Number(s.revenueGrowth) >= 0 ? '#46B450' : '#dc3232' }}>
                            {Number(s.revenueGrowth) >= 0 ? '+' : ''}{(Number(s.revenueGrowth)).toFixed(1)}%
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className={styles.emptyState}>No data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {leastOrderedServices && leastOrderedServices.length > 0 && (
              <div className={styles.chartCard} style={{ marginBottom: 24 }}>
                <h2 className={styles.chartTitle}>Least Ordered Services</h2>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Orders</th>
                        <th>Quantity</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leastOrderedServices.map((s: any, i: number) => (
                        <tr key={i}>
                          <td style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setFilterService(s.title)} title="Click to filter by this service">{s.title}</td>
                          <td>{s.orders}</td>
                          <td>{s.quantity}</td>
                          <td>{formatCurrency(s.revenue ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {mostSoldProducts && mostSoldProducts.length > 0 && (
              <div className={styles.chartCard} style={{ marginBottom: 24 }}>
                <h2 className={styles.chartTitle}>Most Sold Products</h2>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Orders</th>
                        <th>Quantity</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mostSoldProducts.map((p: any, i: number) => (
                        <tr key={p.productId ?? i}>
                          <td>{p.title}</td>
                          <td>{p.orders}</td>
                          <td>{p.quantity}</td>
                          <td>{formatCurrency(p.revenue ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {leastSoldProducts && leastSoldProducts.length > 0 && (
              <div className={styles.chartCard} style={{ marginBottom: 24 }}>
                <h2 className={styles.chartTitle}>Least Sold Products</h2>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Orders</th>
                        <th>Quantity</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leastSoldProducts.map((p: any, i: number) => (
                        <tr key={p.productId ?? i}>
                          <td>{p.title}</td>
                          <td>{p.orders}</td>
                          <td>{p.quantity}</td>
                          <td>{formatCurrency(p.revenue ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <section className={styles.transactionsSection}>
              <div className={styles.summaryCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Recent Transactions</h2>
                  <span className={styles.sectionBadge}>{recentTransactions?.length || 0}</span>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Items</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions?.length > 0 ? recentTransactions.slice(0, 20).map((t: any) => (
                        <tr key={t.id}>
                          <td>{t.orderNumber}</td>
                          <td>{t.customerName}</td>
                          <td>{formatCurrency(t.amount)}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles[`status${t.paymentStatus}`]}`}>
                              {t.paymentStatus}
                            </span>
                          </td>
                          <td title={t.itemTitles?.join(', ')}>
                            {t.itemTitles?.length ? (t.itemTitles.join(', ').length > 30 ? t.itemTitles.join(', ').slice(0, 27) + '...' : t.itemTitles.join(', ')) : '—'}
                          </td>
                          <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className={styles.emptyState}>No transactions</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Service Categories */}
            {serviceCategories && serviceCategories.length > 0 && (
              <section className={styles.summarySection}>
                <div className={styles.chartCard}>
                  <h2 className={styles.chartTitle}>Revenue by Service Category</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={serviceCategories}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#39413f" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 16 }}>
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Revenue</th>
                            <th>Orders</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviceCategories.map((cat: any, idx: number) => (
                            <tr key={idx}>
                              <td style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setFilterCategory(cat.category)} title="Click to filter by this category">{cat.category}</td>
                              <td>{formatCurrency(cat.revenue)}</td>
                              <td>{cat.orders}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Product Categories */}
            {productCategories && productCategories.length > 0 && (
              <section className={styles.summarySection}>
                <div className={styles.chartCard}>
                  <h2 className={styles.chartTitle}>Revenue by Product Category</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productCategories}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#46B450" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 16 }}>
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Revenue</th>
                            <th>Orders</th>
                            <th>Quantity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productCategories.map((cat: any, idx: number) => (
                            <tr key={idx}>
                              <td style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setFilterCategory(cat.category)} title="Click to filter by this category">{cat.category}</td>
                              <td>{formatCurrency(cat.revenue)}</td>
                              <td>{cat.orders}</td>
                              <td>{cat.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Product seasonality (§4.3) — product revenue by month, last 12 months */}
            {productRevenueByMonth && productRevenueByMonth.length > 0 && (
              <section className={styles.summarySection}>
                <div className={styles.chartCard}>
                  <h2 className={styles.chartTitle}>Product Revenue by Month</h2>
                  <p className={styles.sectionSubtext}>Product sales (order items) over the last 12 months</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={productRevenueByMonth} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => formatCurrency(v)} />
                      <Bar dataKey="revenue" fill="#17A2B8" name="Product revenue" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Peak Booking Times */}
            {peakBookingTimes && (
              <section className={styles.summarySection}>
                <div className={styles.summaryCard}>
                  <h2 className={styles.sectionTitle}>Peak Booking Times</h2>
                  <p className={styles.sectionSubtext}>Bookings by hour, day of week, month, and quarter (paid bookings in selected period)</p>
                  <div className={styles.chartGrid}>
                    {peakBookingTimes.hourly && peakBookingTimes.hourly.length > 0 && (
                      <div className={styles.chartCard}>
                        <h3 className={styles.chartTitle}>By Hour of Day</h3>
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={peakBookingTimes.hourly} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="bookings" fill="#39413f" name="Bookings" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {peakBookingTimes.daily && peakBookingTimes.daily.length > 0 && (
                      <div className={styles.chartCard}>
                        <h3 className={styles.chartTitle}>By Day of Week</h3>
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={peakBookingTimes.daily} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="bookings" fill="#17A2B8" name="Bookings" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {peakBookingTimes.monthly && peakBookingTimes.monthly.length > 0 && (
                      <div className={styles.chartCard}>
                        <h3 className={styles.chartTitle}>By Month</h3>
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={peakBookingTimes.monthly} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="bookings" fill="#46B450" name="Bookings" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {peakBookingTimes.quarterly && peakBookingTimes.quarterly.length > 0 && (
                      <div className={styles.chartCard}>
                        <h3 className={styles.chartTitle}>By Quarter (Season)</h3>
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={peakBookingTimes.quarterly} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="bookings" fill="#DCB2CC" name="Bookings" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Booking heatmap: hour x day of week */}
            {bookingHeatmap && bookingHeatmap.values && (
              <section className={styles.summarySection}>
                <div className={styles.chartCard}>
                  <h2 className={styles.sectionTitle}>Booking Heatmap</h2>
                  <p className={styles.sectionSubtext}>Bookings by hour and day of week (darker = more bookings)</p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 600, fontSize: 11 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: 4, textAlign: 'left', width: 36 }}></th>
                          {(bookingHeatmap.hourLabels || []).map((lb: string, h: number) => (
                            <th key={h} style={{ padding: 2, fontWeight: 600, width: 24 }} title={`${lb}`}>{h % 3 === 0 ? lb : ''}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(bookingHeatmap.values || []).map((row: number[], d: number) => {
                          const maxVal = Math.max(1, ...(bookingHeatmap.values || []).flat());
                          return (
                            <tr key={d}>
                              <td style={{ padding: '2px 6px', fontWeight: 600 }}>{(bookingHeatmap.dayLabels || [])[d] || ''}</td>
                              {(row || []).map((v: number, h: number) => {
                                const pct = maxVal > 0 ? Math.min(100, (v / maxVal) * 100) : 0;
                                const bg = pct === 0 ? '#f5f5f5' : `rgba(70, 180, 80, ${0.15 + (pct / 100) * 0.85})`;
                                return (
                                  <td key={h} style={{ padding: 2, background: bg, minWidth: 20, textAlign: 'center' }} title={`${(bookingHeatmap.hourLabels || [])[h]}: ${v} bookings`}>
                                    {v > 0 ? v : ''}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Service demand by location */}
            {serviceDemandByLocation && serviceDemandByLocation.length > 0 && (
              <section className={styles.summarySection}>
                <div className={styles.chartCard}>
                  <h2 className={styles.sectionTitle}>Service Demand by Location</h2>
                  <p className={styles.sectionSubtext}>Top services by bookings per city (barber&apos;s city). Click city to filter.</p>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>City</th>
                          <th>Top Services</th>
                          <th>Bookings</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceDemandByLocation.slice(0, 10).map((loc: { city: string; services: { name: string; bookings: number; revenue: number }[] }, i: number) => {
                          const totalBookings = loc.services.reduce((s, x) => s + x.bookings, 0);
                          const totalRev = loc.services.reduce((s, x) => s + x.revenue, 0);
                          return (
                            <tr key={i}>
                              <td style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setFilterLocation(loc.city || '')} title="Click to filter by this location">{loc.city}</td>
                              <td>{(loc.services || []).slice(0, 3).length === 0 ? '—' : (loc.services || []).slice(0, 3).map((s: { name: string }, j: number) => (
                                <span key={j}><span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={(e) => { e.stopPropagation(); setFilterService(s.name); }} title="Click to filter by this service">{s.name}</span>{j < Math.min((loc.services || []).length, 3) - 1 ? ', ' : ''}</span>
                              ))}</td>
                              <td>{totalBookings}</td>
                              <td>{formatCurrency(totalRev)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Peak times by location */}
            {peakTimesByLocation && peakTimesByLocation.length > 0 && (
              <section className={styles.summarySection}>
                <div className={styles.chartCard}>
                  <h2 className={styles.sectionTitle}>Peak Booking Hours by Location</h2>
                  <p className={styles.sectionSubtext}>Busiest hour per city (paid bookings)</p>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>City</th>
                          <th>Peak Hour</th>
                          <th>Bookings at Peak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {peakTimesByLocation.slice(0, 10).map((loc: { city: string; hourly: { hour: number; label: string; bookings: number }[] }, i: number) => {
                          const arr = loc.hourly || [];
                          const peak = arr.length === 0 ? null : arr.reduce((a, b) => (b.bookings > (a?.bookings ?? 0) ? b : a), arr[0]);
                          return (
                            <tr key={i}>
                              <td style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setFilterLocation(loc.city)} title="Click to filter by this location">{loc.city}</td>
                              <td>{peak?.label ?? '—'}</td>
                              <td>{peak?.bookings ?? 0}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Cancellation by service */}
            {cancellationByService && cancellationByService.length > 0 && (
              <section className={styles.summarySection}>
                <div className={styles.chartCard}>
                  <h2 className={styles.sectionTitle}>Booking Cancellation by Service</h2>
                  <p className={styles.sectionSubtext}>Cancelled vs total bookings per service</p>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Total</th>
                          <th>Cancelled</th>
                          <th>Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cancellationByService.map((s: { serviceName: string; total: number; cancelled: number; rate: number }, i: number) => (
                          <tr key={i}>
                            <td style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setFilterService(s.serviceName)} title="Click to filter by this service">{s.serviceName}</td>
                            <td>{s.total}</td>
                            <td>{s.cancelled}</td>
                            <td>{(s.rate ?? 0).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* Tab: Barbers */}
        {activeTab === 'barbers' && (
          <>
            {/* Summary KPIs */}
            <section className={styles.summarySection}>
              <div className={styles.summaryCard}>
                <h2 className={styles.sectionTitle}>Barber Performance Summary</h2>
                {barberMetricsLoading ? (
                  <div className={styles.emptyState}>Loading...</div>
                ) : barberMetrics?.summary ? (
                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Total Barbers</span>
                      <span className={styles.summaryValue}>{barberMetrics.summary.totalBarbers ?? 0}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Active Barbers</span>
                      <span className={styles.summaryValue}>{barberMetrics.summary.activeBarbers ?? 0}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Online</span>
                      <span className={styles.summaryValue}>{barberMetrics.summary.barbersOnline ?? 0}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Offline</span>
                      <span className={styles.summaryValue}>{barberMetrics.summary.barbersOffline ?? 0}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Average Rating</span>
                      <span className={styles.summaryValue}>
                        {barberMetrics.summary.averageRating ? barberMetrics.summary.averageRating.toFixed(2) : '0.00'} <Star size={14} className={styles.inlineIcon} aria-hidden />
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Total Revenue</span>
                      <span className={styles.summaryValue}>{formatCurrency(barberMetrics.summary.totalRevenue ?? 0)}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Avg Orders/Barber</span>
                      <span className={styles.summaryValue}>{barberMetrics.summary.avgOrdersPerBarber?.toFixed(1) ?? '0'}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>No-Show Rate</span>
                      <span className={styles.summaryValue}>
                        {barberMetrics.summary.noShowRate ? barberMetrics.summary.noShowRate.toFixed(1) + '%' : '0%'}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Working Today</span>
                      <span className={styles.summaryValue}>{barberMetrics.summary.barbersWorkingToday ?? 0}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Suspended</span>
                      <span className={styles.summaryValue}>{barberMetrics.summary.suspendedBarbers ?? 0}</span>
                    </div>
                  </div>
                ) : (
                  <p className={styles.emptyState}>No barber metrics available.</p>
                )}
              </div>
            </section>

            {/* Top Barbers by Different Metrics */}
            {barberMetrics?.barbers && barberMetrics.barbers.length > 0 && (
              <>
                <section className={styles.summarySection}>
                  <div className={styles.summaryCard}>
                    <h2 className={styles.sectionTitle}>Top Barbers by Revenue</h2>
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Barber</th>
                            <th>Revenue</th>
                            <th>Orders</th>
                            <th>Rating</th>
                            <th>No-Show Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...barberMetrics.barbers]
                            .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))
                            .slice(0, 10)
                            .map((b: any, idx: number) => (
                              <tr key={b.id}>
                                <td>#{idx + 1}</td>
                                <td>{b.name}</td>
                                <td>{formatCurrency(b.revenue)}</td>
                                <td>{b.totalOrders}</td>
                                <td>
                                  <span style={{ color: (b.ratingAvg ?? 0) >= 4 ? '#46B450' : (b.ratingAvg ?? 0) >= 3 ? '#FFC107' : '#FF6B6B' }}>
                                    {(b.ratingAvg ?? 0).toFixed(1)} <Star size={14} className={styles.inlineIcon} aria-hidden /> ({b.totalReviews})
                                  </span>
                                </td>
                                <td>
                                  <span style={{ color: (b.noShowRate ?? 0) < 5 ? '#46B450' : (b.noShowRate ?? 0) < 10 ? '#FFC107' : '#FF6B6B' }}>
                                    {(b.noShowRate ?? 0).toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <section className={styles.summarySection}>
                  <div className={styles.summaryCard}>
                    <h2 className={styles.sectionTitle}>Top Rated Barbers</h2>
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Barber</th>
                            <th>Rating</th>
                            <th>Reviews</th>
                            <th>Revenue</th>
                            <th>Orders</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...barberMetrics.barbers]
                            .filter((b: any) => b.totalReviews > 0)
                            .sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0))
                            .slice(0, 10)
                            .map((b: any, idx: number) => (
                              <tr key={b.id}>
                                <td>#{idx + 1}</td>
                                <td>{b.name}</td>
                                <td>
                                  <span style={{ color: (b.ratingAvg ?? 0) >= 4 ? '#46B450' : (b.ratingAvg ?? 0) >= 3 ? '#FFC107' : '#FF6B6B' }}>
                                    {(b.ratingAvg ?? 0).toFixed(2)} <Star size={14} className={styles.inlineIcon} aria-hidden />
                                  </span>
                                </td>
                                <td>{b.totalReviews}</td>
                                <td>{formatCurrency(b.revenue)}</td>
                                <td>{b.totalOrders}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <section className={styles.summarySection}>
                  <div className={styles.summaryCard}>
                    <h2 className={styles.sectionTitle}>Most Booked Barbers</h2>
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Barber</th>
                            <th>Total Orders</th>
                            <th>Total Bookings</th>
                            <th>Revenue</th>
                            <th>Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...barberMetrics.barbers]
                            .sort((a, b) => (b.totalBookings || b.totalOrders) - (a.totalBookings || a.totalOrders))
                            .slice(0, 10)
                            .map((b: any, idx: number) => (
                              <tr key={b.id}>
                                <td>#{idx + 1}</td>
                                <td>{b.name}</td>
                                <td>{b.totalOrders}</td>
                                <td>{b.totalBookings || 0}</td>
                                <td>{formatCurrency(b.revenue)}</td>
                                <td>
                                  <span style={{ color: (b.ratingAvg ?? 0) >= 4 ? '#46B450' : (b.ratingAvg ?? 0) >= 3 ? '#FFC107' : '#FF6B6B' }}>
                                    {(b.ratingAvg ?? 0).toFixed(1)} <Star size={14} className={styles.inlineIcon} aria-hidden />
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <section className={styles.summarySection}>
                  <div className={styles.summaryCard}>
                    <h2 className={styles.sectionTitle}>Most Reliable Barbers (Lowest No-Show Rate)</h2>
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Barber</th>
                            <th>No-Show Rate</th>
                            <th>Orders</th>
                            <th>Rating</th>
                            <th>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...barberMetrics.barbers]
                            .filter((b: any) => b.totalOrders > 0)
                            .sort((a, b) => (a.noShowRate ?? 0) - (b.noShowRate ?? 0))
                            .slice(0, 10)
                            .map((b: any, idx: number) => (
                              <tr key={b.id}>
                                <td>#{idx + 1}</td>
                                <td>{b.name}</td>
                                <td>
                                  <span style={{ color: (b.noShowRate ?? 0) < 5 ? '#46B450' : (b.noShowRate ?? 0) < 10 ? '#FFC107' : '#FF6B6B' }}>
                                    {(b.noShowRate ?? 0).toFixed(1)}%
                                  </span>
                                </td>
                                <td>{b.totalOrders}</td>
                                <td>
                                  <span style={{ color: (b.ratingAvg ?? 0) >= 4 ? '#46B450' : (b.ratingAvg ?? 0) >= 3 ? '#FFC107' : '#FF6B6B' }}>
                                    {(b.ratingAvg ?? 0).toFixed(1)} <Star size={14} className={styles.inlineIcon} aria-hidden />
                                  </span>
                                </td>
                                <td>{formatCurrency(b.revenue)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* All Barbers Detailed Table */}
            <section className={styles.summarySection}>
              <div className={styles.summaryCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>All Barbers Performance</h2>
                  <Link href="/admin/barbers" className={styles.linkButton}>
                    <Scissors size={16} aria-hidden /> Manage Barbers
                  </Link>
                </div>
                {barberMetricsLoading ? (
                  <div className={styles.emptyState}>Loading...</div>
                ) : barberMetrics?.barbers && barberMetrics.barbers.length > 0 ? (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Barber</th>
                          <th>Status</th>
                          <th>Rating</th>
                          <th>Reviews</th>
                          <th>Orders</th>
                          <th>Revenue</th>
                          <th>Commission</th>
                          <th>Earnings</th>
                          <th>No-Show Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {barberMetrics.barbers.map((b: any) => (
                          <tr key={b.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {b.avatarUrl && (
                                  <img src={b.avatarUrl} alt={b.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                                )}
                                <div>
                                  <div>{b.name}</div>
                                  {b.location && <div style={{ fontSize: '0.85em', color: '#666' }}>{b.location}</div>}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`${styles.statusBadge} ${styles[`status${b.status}`]}`}>
                                {b.status}
                              </span>
                            </td>
                            <td>
                              <span style={{ color: (b.ratingAvg ?? 0) >= 4 ? '#46B450' : (b.ratingAvg ?? 0) >= 3 ? '#FFC107' : '#FF6B6B' }}>
                                {(b.ratingAvg ?? 0).toFixed(2)} <Star size={14} className={styles.inlineIcon} aria-hidden />
                              </span>
                            </td>
                            <td>{b.totalReviews}</td>
                            <td>{b.totalOrders}</td>
                            <td>{formatCurrency(b.revenue)}</td>
                            <td>{((b.commissionRate ?? 0) * 100).toFixed(0)}%</td>
                            <td>{formatCurrency((b.revenue ?? 0) * (b.commissionRate ?? 0))}</td>
                            <td>
                              <span style={{ color: (b.noShowRate ?? 0) < 5 ? '#46B450' : (b.noShowRate ?? 0) < 10 ? '#FFC107' : '#FF6B6B' }}>
                                {(b.noShowRate ?? 0).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className={styles.emptyState}>No barber data available. <Link href="/admin/barbers">View barbers</Link>.</p>
                )}
              </div>
            </section>
          </>
        )}

        {/* Tab: Reviews & Feedback */}
        {activeTab === 'reviews' && (
          <>
            {/* Summary KPIs */}
            <section className={styles.summarySection}>
              <div className={styles.summaryCard}>
                <h2 className={styles.sectionTitle}>Reviews & Feedback Analytics</h2>
                {reviewsLoading ? (
                  <div className={styles.emptyState}>Loading...</div>
                ) : reviewsAnalytics ? (
                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Total Reviews</span>
                      <span className={styles.summaryValue}>{reviewsAnalytics.totalReviews ?? 0}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Average Rating</span>
                      <span className={styles.summaryValue}>
                        {reviewsAnalytics.avgRating ? reviewsAnalytics.avgRating.toFixed(2) : '0.00'} <Star size={14} className={styles.inlineIcon} aria-hidden />
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Response Rate</span>
                      <span className={styles.summaryValue}>
                        {reviewsAnalytics.responseRate ? reviewsAnalytics.responseRate.toFixed(1) + '%' : '0%'}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Reviews with Response</span>
                      <span className={styles.summaryValue}>{reviewsAnalytics.reviewsWithResponse ?? 0}</span>
                    </div>
                  </div>
                ) : (
                  <p className={styles.emptyState}>No reviews data available.</p>
                )}
              </div>
            </section>

            {/* Rating Distribution */}
            {reviewsAnalytics?.ratingDistribution && (
              <section className={styles.summarySection}>
                <div className={styles.chartCard}>
                  <h2 className={styles.chartTitle}>Rating Distribution</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reviewsAnalytics.ratingDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" label={{ value: 'Rating', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#39413f" name="Number of Reviews" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 16 }}>
                    <table className={styles.table} style={{ fontSize: '0.9em' }}>
                      <thead>
                        <tr>
                          <th>Rating</th>
                          <th>Count</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewsAnalytics.ratingDistribution.map((dist: any) => (
                          <tr key={dist.rating}>
                            <td>{dist.rating} <Star size={14} className={styles.inlineIcon} aria-hidden /></td>
                            <td>{dist.count}</td>
                            <td>{(dist.percentage ?? 0).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Reviews by Barber */}
            {reviewsAnalytics?.reviewsByBarber && reviewsAnalytics.reviewsByBarber.length > 0 && (
              <section className={styles.summarySection}>
                <div className={styles.summaryCard}>
                  <h2 className={styles.sectionTitle}>Reviews by Barber</h2>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Barber</th>
                          <th>Total Reviews</th>
                          <th>Average Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewsAnalytics.reviewsByBarber.map((item: any) => (
                          <tr key={item.barberId}>
                            <td>{item.barberName}</td>
                            <td>{item.count}</td>
                            <td>
                              <span style={{ color: (item.avgRating ?? 0) >= 4 ? '#46B450' : (item.avgRating ?? 0) >= 3 ? '#FFC107' : '#FF6B6B' }}>
                                {(item.avgRating ?? 0).toFixed(2)} <Star size={14} className={styles.inlineIcon} aria-hidden />
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Reviews by Service */}
            {reviewsAnalytics?.reviewsByService && reviewsAnalytics.reviewsByService.length > 0 && (
              <section className={styles.summarySection}>
                <div className={styles.summaryCard}>
                  <h2 className={styles.sectionTitle}>Reviews by Service</h2>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Category</th>
                          <th>Total Reviews</th>
                          <th>Average Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewsAnalytics.reviewsByService.map((item: any) => (
                          <tr key={item.serviceId}>
                            <td>{item.serviceName}</td>
                            <td>{item.category}</td>
                            <td>{item.count}</td>
                            <td>
                              <span style={{ color: (item.avgRating ?? 0) >= 4 ? '#46B450' : (item.avgRating ?? 0) >= 3 ? '#FFC107' : '#FF6B6B' }}>
                                {(item.avgRating ?? 0).toFixed(2)} <Star size={14} className={styles.inlineIcon} aria-hidden />
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Reviews by Category */}
            {reviewsAnalytics?.reviewsByCategory && reviewsAnalytics.reviewsByCategory.length > 0 && (
              <section className={styles.summarySection}>
                <div className={styles.chartCard}>
                  <h2 className={styles.chartTitle}>Reviews by Service Category</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reviewsAnalytics.reviewsByCategory} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="category" type="category" width={120} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#39413f" name="Number of Reviews" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Recent Reviews */}
            {reviewsAnalytics?.recentReviews && reviewsAnalytics.recentReviews.length > 0 && (
              <section className={styles.summarySection}>
                <div className={styles.summaryCard}>
                  <h2 className={styles.sectionTitle}>Recent Reviews</h2>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Rating</th>
                          <th>Customer</th>
                          <th>Barber</th>
                          <th>Service</th>
                          <th>Comment</th>
                          <th>Response</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewsAnalytics.recentReviews.map((review: any) => (
                          <tr key={review.id}>
                            <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                            <td>
                              <span style={{ color: review.rating >= 4 ? '#46B450' : review.rating >= 3 ? '#FFC107' : '#FF6B6B' }}>
                                {review.rating} <Star size={14} className={styles.inlineIcon} aria-hidden />
                              </span>
                            </td>
                            <td>{review.customerName}</td>
                            <td>{review.barberName}</td>
                            <td>{review.serviceName}</td>
                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {review.comment || '—'}
                            </td>
                            <td>
                              {review.barberResponse ? (
                                <span style={{ color: '#46B450' }}>✓ Responded</span>
                              ) : (
                                <span style={{ color: '#999' }}>—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
