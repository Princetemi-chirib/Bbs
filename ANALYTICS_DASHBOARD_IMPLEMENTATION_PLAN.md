# Analytics Dashboard - Technical Implementation Plan

## Overview
This document outlines the technical architecture, tools, and implementation strategy for building the comprehensive analytics and financial dashboard for BBS Limited.

---

## 1. Architecture Overview

### 1.1 High-Level Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Gateway    │────▶│   Analytics     │
│   Dashboard     │     │   (Next.js API)  │     │   Engine        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                        ┌─────────────────────────────────────────┐
                        │         Data Layer                      │
                        │  ┌──────────┐  ┌──────────┐             │
                        │  │PostgreSQL│  │TimeSeries│             │
                        │  │(Main DB) │  │  DB      │             │
                        │  └──────────┘  └──────────┘             │
                        │  ┌──────────┐  ┌──────────┐             │
                        │  │  Redis   │  │  Cache   │             │
                        │  │  Cache   │  │  Layer   │             │
                        │  └──────────┘  └──────────┘             │
                        └─────────────────────────────────────────┘
                                                          │
                                                          ▼
                        ┌─────────────────────────────────────────┐
                        │    Background Jobs & Processing         │
                        │  ┌──────────┐  ┌──────────┐             │
                        │  │  Cron    │  │  Queue    │            │
                        │  │  Jobs    │  │  Workers  │            │
                        │  └──────────┘  └──────────┘             │
                        └─────────────────────────────────────────┘
```

### 1.2 Technology Stack

#### Frontend
- **Framework**: Next.js 14+ (React)
- **State Management**: Zustand or React Query
- **Charts/Visualization**: 
  - Recharts (primary)
  - Chart.js (for specific chart types)
  - D3.js (for advanced custom visualizations)
- **UI Components**: 
  - Tailwind CSS
  - shadcn/ui or similar component library
- **Real-time Updates**: WebSockets (Socket.io) or Server-Sent Events
- **Date Handling**: date-fns or Day.js
- **Data Tables**: TanStack Table (React Table)

#### Backend
- **API Framework**: Next.js API Routes
- **Database**: 
  - PostgreSQL (main database - existing)
  - TimescaleDB (for time-series data - extension of PostgreSQL)
- **Caching**: Redis
- **Job Queue**: 
  - BullMQ (Redis-based)
  - Or Next.js API routes with cron
- **Email Service**: Existing emailService
- **Analytics Collection**: Custom middleware + event tracking

#### Data Processing
- **ETL Pipeline**: Custom Node.js scripts
- **Aggregation**: PostgreSQL views + materialized views
- **Real-time Processing**: WebSocket server
- **Batch Processing**: Scheduled cron jobs

---

## 2. Data Collection Strategy

### 2.1 Event Tracking System

#### Implementation Approach
```typescript
// lib/analytics/tracker.ts
export class AnalyticsTracker {
  // Track page views
  static trackPageView(page: string, metadata?: object) {
    // Store in database
    // Send to analytics queue
  }

  // Track custom events
  static trackEvent(eventName: string, properties: object) {
    // Store event with timestamp
    // Aggregate in real-time
  }

  // Track transactions
  static trackTransaction(transaction: TransactionData) {
    // Store in financial analytics
  }
}
```

#### Middleware for Automatic Tracking
```typescript
// middleware.ts (Next.js)
export function middleware(request: NextRequest) {
  // Track page views automatically
  // Extract referrer, user agent, IP
  // Store in analytics database
}
```

### 2.2 Data Collection Points

#### Frontend Tracking
- **Page Views**: Automatic via middleware
- **User Actions**: Button clicks, form submissions
- **User Journey**: Navigation paths
- **Time on Page**: Tracked via visibility API
- **Scroll Depth**: Tracked via scroll events
- **Device Info**: Extracted from user agent

#### Backend Tracking
- **API Calls**: Log all API requests
- **Transactions**: All payment/order events
- **User Actions**: Login, registration, bookings
- **System Events**: Errors, performance metrics
- **Email/SMS**: Track sent, opened, clicked

### 2.3 Database Schema for Analytics

#### Core Tables
```sql
-- Page views and traffic
CREATE TABLE analytics_page_views (
  id UUID PRIMARY KEY,
  session_id VARCHAR(255),
  user_id UUID REFERENCES users(id),
  page_path VARCHAR(500),
  referrer VARCHAR(500),
  user_agent TEXT,
  ip_address INET,
  country VARCHAR(100),
  city VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Custom events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  event_name VARCHAR(255),
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(255),
  properties JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Financial transactions (extend existing)
-- Use existing orders/payments tables
-- Add analytics views for aggregation

-- System metrics
CREATE TABLE analytics_system_metrics (
  id UUID PRIMARY KEY,
  metric_type VARCHAR(100),
  metric_value DECIMAL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Time-Series Data (TimescaleDB)
```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert to hypertable for time-series
SELECT create_hypertable('analytics_page_views', 'created_at');
SELECT create_hypertable('analytics_events', 'created_at');
SELECT create_hypertable('analytics_system_metrics', 'created_at');
```

---

## 3. Data Storage Architecture

### 3.1 Database Strategy

#### PostgreSQL (Main Database)
- **Purpose**: Store all transactional data
- **Tables**: Users, orders, payments, bookings, etc. (existing)
- **Analytics Views**: Materialized views for common queries

#### TimescaleDB (Time-Series Extension)
- **Purpose**: Efficient storage and querying of time-series data
- **Use Cases**: 
  - Page views over time
  - Revenue trends
  - User activity patterns
  - System metrics
- **Benefits**: 
  - Automatic data compression
  - Time-based partitioning
  - Fast time-range queries
  - Retention policies

#### Redis (Caching)
- **Purpose**: Cache frequently accessed analytics
- **Use Cases**:
  - Real-time dashboard data
  - Aggregated metrics
  - Session data
  - Rate limiting
- **TTL Strategy**: 
  - Real-time data: 1-5 minutes
  - Daily aggregates: 24 hours
  - Weekly aggregates: 7 days

### 3.2 Data Aggregation Strategy

#### Materialized Views
```sql
-- Daily revenue aggregation
CREATE MATERIALIZED VIEW mv_daily_revenue AS
SELECT 
  DATE(created_at) as date,
  SUM(total_amount) as revenue,
  COUNT(*) as order_count,
  AVG(total_amount) as avg_order_value
FROM orders
WHERE payment_status = 'PAID'
GROUP BY DATE(created_at);

-- Refresh strategy
CREATE UNIQUE INDEX ON mv_daily_revenue(date);
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue;
```

#### Scheduled Aggregations
- **Real-time**: Last 1 hour (updated every 5 minutes)
- **Hourly**: Last 24 hours (updated every hour)
- **Daily**: Last 30 days (updated daily at midnight)
- **Weekly**: Last 12 weeks (updated weekly)
- **Monthly**: Last 12 months (updated monthly)

---

## 4. API Design

### 4.1 API Endpoints Structure

```
/api/v1/analytics/
  ├── overview              # Dashboard overview metrics
  ├── financial/            # Financial analytics
  │   ├── revenue
  │   ├── transactions
  │   ├── payments
  │   └── reports
  ├── traffic/              # Site traffic analytics
  │   ├── visitors
  │   ├── sources
  │   ├── pages
  │   └── geographic
  ├── customers/            # Customer analytics
  │   ├── growth
  │   ├── segments
  │   ├── behavior
  │   └── value
  ├── orders/              # Order analytics
  │   ├── overview
  │   ├── services
  │   ├── products
  │   └── trends
  ├── barbers/             # Barber analytics
  │   ├── performance
  │   ├── earnings
  │   └── rankings
  ├── operational/         # System metrics
  │   ├── uptime
  │   ├── performance
  │   └── errors
  └── reports/             # Report generation
      ├── weekly
      ├── monthly
      └── custom
```

### 4.2 API Implementation Example

```typescript
// app/api/v1/analytics/overview/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Get cached data if available
  const cacheKey = `analytics:overview:${startDate}:${endDate}`;
  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(JSON.parse(cached));

  // Fetch from database
  const [revenue, orders, customers, traffic] = await Promise.all([
    getRevenueMetrics(startDate, endDate),
    getOrderMetrics(startDate, endDate),
    getCustomerMetrics(startDate, endDate),
    getTrafficMetrics(startDate, endDate),
  ]);

  const data = {
    revenue,
    orders,
    customers,
    traffic,
    timestamp: new Date().toISOString(),
  };

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(data));

  return NextResponse.json({ success: true, data });
}
```

---

## 5. Frontend Dashboard Implementation

### 5.1 Dashboard Structure

```
/app/admin/analytics/
  ├── page.tsx              # Main dashboard
  ├── financial/
  │   └── page.tsx          # Financial analytics
  ├── traffic/
  │   └── page.tsx          # Traffic analytics
  ├── customers/
  │   └── page.tsx          # Customer analytics
  ├── orders/
  │   └── page.tsx          # Order analytics
  └── components/
      ├── MetricCard.tsx
      ├── ChartCard.tsx
      ├── DataTable.tsx
      └── DateRangePicker.tsx
```

### 5.2 Component Architecture

#### Metric Cards
```typescript
// components/analytics/MetricCard.tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
}

export function MetricCard({ title, value, change, trend, icon }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <span>{title}</span>
        {icon}
      </div>
      <div className="metric-value">{value}</div>
      {change && (
        <div className={`metric-change ${trend}`}>
          {trend === 'up' ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      )}
    </div>
  );
}
```

#### Chart Components
```typescript
// components/analytics/RevenueChart.tsx
export function RevenueChart({ data, period }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="#39413f" />
        <Line type="monotone" dataKey="previous" stroke="#ccc" strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### 5.3 Real-Time Updates

#### WebSocket Integration
```typescript
// hooks/useRealtimeAnalytics.ts
export function useRealtimeAnalytics() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const socket = io('/analytics');
    
    socket.on('metrics:update', (newData) => {
      setData(newData);
    });
    
    return () => socket.disconnect();
  }, []);
  
  return data;
}
```

---

## 6. Automated Weekly Email Reports

### 6.1 Report Generation Service

```typescript
// lib/analytics/reportGenerator.ts
export class WeeklyReportGenerator {
  async generateReport(startDate: Date, endDate: Date) {
    // Fetch all analytics data
    const [
      financial,
      traffic,
      customers,
      orders,
      operational
    ] = await Promise.all([
      this.getFinancialData(startDate, endDate),
      this.getTrafficData(startDate, endDate),
      this.getCustomerData(startDate, endDate),
      this.getOrderData(startDate, endDate),
      this.getOperationalData(startDate, endDate),
    ]);

    // Generate HTML report
    const html = this.generateHTML({
      financial,
      traffic,
      customers,
      orders,
      operational,
      period: { startDate, endDate },
    });

    // Generate PDF (optional)
    const pdf = await this.generatePDF(html);

    return { html, pdf };
  }

  private generateHTML(data: ReportData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          /* Report styling */
        </style>
      </head>
      <body>
        <h1>Weekly Analytics Report</h1>
        ${this.renderFinancialSection(data.financial)}
        ${this.renderTrafficSection(data.traffic)}
        ${this.renderCustomerSection(data.customers)}
        ${this.renderOrderSection(data.orders)}
        ${this.renderOperationalSection(data.operational)}
      </body>
      </html>
    `;
  }
}
```

### 6.2 Scheduled Job

```typescript
// lib/jobs/weeklyReport.ts
import { CronJob } from 'cron';

export function setupWeeklyReportJob() {
  // Run every Monday at 9 AM
  const job = new CronJob('0 9 * * 1', async () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days

    const generator = new WeeklyReportGenerator();
    const report = await generator.generateReport(startDate, endDate);

    // Get admin emails
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { email: true },
    });

    // Send emails
    for (const admin of admins) {
      await emailService.sendEmail({
        to: admin.email,
        subject: `Weekly Analytics Report - ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
        html: report.html,
        attachments: report.pdf ? [{ filename: 'report.pdf', content: report.pdf }] : [],
      });
    }
  });

  job.start();
}
```

### 6.3 Next.js API Route for Cron

```typescript
// app/api/cron/weekly-report/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate and send report
  const generator = new WeeklyReportGenerator();
  // ... generate and send report

  return NextResponse.json({ success: true });
}
```

---

## 7. Uptime & Performance Monitoring

### 7.1 System Health Tracking

```typescript
// lib/monitoring/systemHealth.ts
export class SystemHealthMonitor {
  async recordHealthCheck() {
    const metrics = {
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: await this.getCPUUsage(),
      database: await this.checkDatabase(),
      api: await this.checkAPI(),
    };

    await prisma.analyticsSystemMetrics.create({
      data: {
        metricType: 'HEALTH_CHECK',
        metricValue: metrics.uptime,
        metadata: metrics,
      },
    });

    // Check for issues
    if (metrics.database.status !== 'healthy') {
      await this.sendAlert('Database connection issue');
    }
  }

  async calculateUptime(startDate: Date, endDate: Date): Promise<number> {
    const checks = await prisma.analyticsSystemMetrics.findMany({
      where: {
        metricType: 'HEALTH_CHECK',
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const totalChecks = checks.length;
    const failedChecks = checks.filter(c => c.metadata.status !== 'healthy').length;
    
    return ((totalChecks - failedChecks) / totalChecks) * 100;
  }
}
```

### 7.2 Scheduled Health Checks

```typescript
// Run every 5 minutes
setInterval(async () => {
  const monitor = new SystemHealthMonitor();
  await monitor.recordHealthCheck();
}, 5 * 60 * 1000);
```

---

## 8. Traffic Source Tracking

### 8.1 Referrer Parsing

```typescript
// lib/analytics/referrerParser.ts
export function parseReferrer(referrer: string | null): TrafficSource {
  if (!referrer) return { type: 'direct', source: 'Direct' };

  const url = new URL(referrer);
  const hostname = url.hostname;

  // Social media
  if (hostname.includes('facebook.com')) return { type: 'social', source: 'Facebook' };
  if (hostname.includes('instagram.com')) return { type: 'social', source: 'Instagram' };
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) return { type: 'social', source: 'Twitter' };

  // Search engines
  if (hostname.includes('google.com')) {
    const query = url.searchParams.get('q');
    return { type: 'search', source: 'Google', query };
  }
  if (hostname.includes('bing.com')) return { type: 'search', source: 'Bing' };

  // Referral
  return { type: 'referral', source: hostname };
}
```

### 8.2 UTM Parameter Tracking

```typescript
// Track UTM parameters from URL
export function extractUTMParams(searchParams: URLSearchParams): UTMParams {
  return {
    utm_source: searchParams.get('utm_source'),
    utm_medium: searchParams.get('utm_medium'),
    utm_campaign: searchParams.get('utm_campaign'),
    utm_term: searchParams.get('utm_term'),
    utm_content: searchParams.get('utm_content'),
  };
}
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
1. Set up database schema for analytics
2. Implement basic event tracking
3. Create core API endpoints
4. Build basic dashboard UI
5. Implement caching layer

### Phase 2: Core Metrics (Weeks 3-4)
1. Financial analytics (revenue, transactions)
2. Order analytics
3. Customer metrics
4. Basic traffic tracking
5. Real-time updates

### Phase 3: Advanced Analytics (Weeks 5-6)
1. Detailed traffic analytics
2. Barber performance metrics
3. Marketing analytics
4. Geographic analytics
5. Time-based patterns

### Phase 4: Reporting & Automation (Weeks 7-8)
1. Weekly email report generation
2. Automated report scheduling
3. PDF report generation
4. Custom report builder
5. Export functionality

### Phase 5: Optimization (Weeks 9-10)
1. Performance optimization
2. Data aggregation optimization
3. Caching strategy refinement
4. UI/UX improvements
5. Mobile responsiveness

---

## 10. Scalability Considerations

### 10.1 Data Volume Management
- **Partitioning**: Use TimescaleDB automatic partitioning
- **Archiving**: Move old data to archive tables
- **Retention Policies**: Automatically delete data older than X years
- **Compression**: TimescaleDB automatic compression

### 10.2 Performance Optimization
- **Indexing**: Strategic indexes on frequently queried columns
- **Materialized Views**: Pre-aggregate common queries
- **Caching**: Aggressive caching of expensive queries
- **Query Optimization**: Use EXPLAIN ANALYZE to optimize slow queries

### 10.3 Horizontal Scaling
- **Read Replicas**: For read-heavy analytics queries
- **Connection Pooling**: Use PgBouncer or similar
- **CDN**: For static dashboard assets
- **Load Balancing**: For API endpoints

---

## 11. Security & Privacy

### 11.1 Data Privacy
- **IP Anonymization**: Hash or truncate IP addresses
- **GDPR Compliance**: Allow data deletion
- **Consent Tracking**: Track user consent for analytics
- **Data Minimization**: Only collect necessary data

### 11.2 Access Control
- **Role-Based Access**: Different analytics views for different roles
- **API Authentication**: Secure all analytics endpoints
- **Audit Logging**: Log who accessed what data
- **Data Encryption**: Encrypt sensitive analytics data

---

## 12. Third-Party Integrations

### 12.1 Google Analytics Integration
```typescript
// Optional: Send data to Google Analytics
export function sendToGoogleAnalytics(event: AnalyticsEvent) {
  // Use Measurement Protocol API
  // Or Google Analytics 4 API
}
```

### 12.2 Payment Gateway Analytics
- Extract analytics from payment gateway webhooks
- Track payment success/failure rates
- Monitor transaction fees

---

## 13. Testing Strategy

### 13.1 Unit Tests
- Test analytics calculations
- Test data aggregation functions
- Test report generation

### 13.2 Integration Tests
- Test API endpoints
- Test database queries
- Test email report generation

### 13.3 Performance Tests
- Load testing for dashboard
- Query performance testing
- Cache effectiveness testing

---

## 14. Monitoring & Alerts

### 14.1 Dashboard Monitoring
- Track dashboard load times
- Monitor API response times
- Alert on slow queries
- Alert on data inconsistencies

### 14.2 Automated Alerts
- Revenue drops
- Traffic anomalies
- System downtime
- Error rate spikes

---

## 15. Cost Estimation

### 15.1 Infrastructure Costs
- **Database**: Existing PostgreSQL (TimescaleDB is free extension)
- **Redis**: ~$10-50/month (depending on usage)
- **Storage**: Minimal additional cost
- **Compute**: Existing Next.js hosting

### 15.2 Development Time
- **Phase 1-2**: 4 weeks (core functionality)
- **Phase 3-4**: 4 weeks (advanced features)
- **Phase 5**: 2 weeks (optimization)
- **Total**: ~10 weeks for full implementation

---

## Conclusion

This implementation plan provides a comprehensive, scalable approach to building the analytics dashboard. The architecture is designed to:
- Handle large volumes of data efficiently
- Provide real-time insights
- Scale with business growth
- Maintain data privacy and security
- Automate reporting and monitoring

The phased approach allows for incremental delivery, starting with core metrics and gradually adding advanced features.
