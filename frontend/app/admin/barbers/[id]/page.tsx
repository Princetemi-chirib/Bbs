'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchAuth, isAdmin } from '@/lib/auth';
import Image from 'next/image';
import Link from 'next/link';
import styles from './detail.module.css';

type BarberDetail = {
  barber: {
    id: string;
    barberId: string;
    status: string;
    isOnline: boolean;
    bio: string | null;
    experienceYears: number | null;
    specialties: string[];
    languagesSpoken: string[];
    ratingAvg: number;
    totalReviews: number;
    totalBookings: number;
    commissionRate: number;
    state: string | null;
    city: string | null;
    address: string | null;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      avatarUrl: string | null;
      createdAt: string;
    };
  };
  services: any[];
  availability: any[];
  performance: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    barberEarnings: number;
    avgOrdersPerDay: number;
    rebookingRate: number;
    complaintsCount: number;
    lastActiveDate: string;
  };
  reviews: any[];
  recentOrders: any[];
};

export default function BarberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const barberId = params?.id as string;

  const [detail, setDetail] = useState<BarberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (barberId) {
      loadDetail();
    } else {
      router.push('/admin/barbers');
    }
  }, [barberId, startDate, endDate, router]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetchAuth(`/api/v1/admin/barbers/${barberId}/detail?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setDetail(data.data);
      } else {
        alert(data.error?.message || 'Failed to load barber details');
        router.push('/admin/barbers');
      }
    } catch (err) {
      console.error('Failed to load detail:', err);
      router.push('/admin/barbers');
    } finally {
      setLoading(false);
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
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  if (loading) {
    return <div className={styles.loading}>Loading barber details...</div>;
  }

  if (!detail) {
    return <div className={styles.error}>Barber not found</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <div>
            <Link href="/admin/barbers" className={styles.backLink}>
              ← Back to Barbers
            </Link>
            <h1 className={styles.pageTitle}>{detail.barber.user.name}</h1>
            <p className={styles.pageSubtitle}>Barber ID: {detail.barber.barberId}</p>
          </div>
          <div className={styles.headerActions}>
            <span className={`${styles.statusBadge} ${styles[`status${detail.barber.status}`]}`}>
              {detail.barber.status.replace('_', ' ')}
            </span>
            {detail.barber.isOnline && <span className={styles.onlineBadge}>Online</span>}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Date Range Filter */}
        <section className={styles.filterSection}>
          <div className={styles.filters}>
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
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className={styles.clearFiltersButton}
              >
                Clear Filters
              </button>
            )}
          </div>
        </section>

        {/* Personal & Employment Info */}
        <section className={styles.section}>
          <h2>Personal & Employment Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Full Name:</span>
                <span className={styles.infoValue}>{detail.barber.user.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email:</span>
                <span className={styles.infoValue}>{detail.barber.user.email}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Phone:</span>
                <span className={styles.infoValue}>{detail.barber.user.phone || 'Not provided'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Hire Date:</span>
                <span className={styles.infoValue}>{formatDate(detail.barber.createdAt)}</span>
              </div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Location:</span>
                <span className={styles.infoValue}>
                  {detail.barber.state || 'N/A'}, {detail.barber.city || 'N/A'}
                </span>
              </div>
              {detail.barber.address && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Address:</span>
                  <span className={styles.infoValue}>{detail.barber.address}</span>
                </div>
              )}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Experience:</span>
                <span className={styles.infoValue}>
                  {detail.barber.experienceYears ? `${detail.barber.experienceYears} years` : 'Not specified'}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Commission Rate:</span>
                <span className={styles.infoValue}>{(detail.barber.commissionRate * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
          {detail.barber.bio && (
            <div className={styles.bioCard}>
              <h3>Bio</h3>
              <p>{detail.barber.bio}</p>
            </div>
          )}
        </section>

        {/* Skills & Services */}
        <section className={styles.section}>
          <h2>Skills & Services</h2>
          <div className={styles.skillsSection}>
            <div className={styles.skillsCard}>
              <h3>Specialties</h3>
              {detail.barber.specialties.length > 0 ? (
                <div className={styles.specialtiesList}>
                  {detail.barber.specialties.map((spec, idx) => (
                    <span key={idx} className={styles.specialtyTag}>{spec}</span>
                  ))}
                </div>
              ) : (
                <p className={styles.noData}>No specialties listed</p>
              )}
            </div>
            <div className={styles.skillsCard}>
              <h3>Languages Spoken</h3>
              {detail.barber.languagesSpoken.length > 0 ? (
                <div className={styles.languagesList}>
                  {detail.barber.languagesSpoken.map((lang, idx) => (
                    <span key={idx} className={styles.languageTag}>{lang}</span>
                  ))}
                </div>
              ) : (
                <p className={styles.noData}>No languages listed</p>
              )}
            </div>
          </div>
          <div className={styles.servicesCard}>
            <h3>Services Offered ({detail.services.length})</h3>
            {detail.services.length > 0 ? (
              <div className={styles.servicesList}>
                {detail.services.map((service) => (
                  <div key={service.id} className={styles.serviceItem}>
                    <div className={styles.serviceInfo}>
                      <strong>{service.name}</strong>
                      <span>{formatCurrency(Number(service.price))}</span>
                      <span>{service.durationMinutes} min</span>
                    </div>
                    {service.description && (
                      <p className={styles.serviceDescription}>{service.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noData}>No services configured</p>
            )}
          </div>
        </section>

        {/* Schedule Overview */}
        <section className={styles.section}>
          <h2>Schedule Overview</h2>
          {detail.availability.length > 0 ? (
            <div className={styles.scheduleGrid}>
              {detail.availability.map((avail) => (
                <div key={avail.id} className={styles.scheduleDay}>
                  <div className={styles.dayName}>{getDayName(avail.dayOfWeek)}</div>
                  {avail.isAvailable ? (
                    <div className={styles.timeSlot}>
                      {new Date(`2000-01-01T${avail.startTime}`).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} - {new Date(`2000-01-01T${avail.endTime}`).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  ) : (
                    <div className={styles.unavailable}>Not Available</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noData}>No availability schedule set</p>
          )}
        </section>

        {/* Performance Metrics */}
        <section className={styles.section}>
          <h2>Performance Metrics</h2>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Total Bookings Completed</div>
              <div className={styles.metricValue}>{detail.performance.completedOrders}</div>
              <div className={styles.metricSubtext}>of {detail.performance.totalOrders} total</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Total Revenue Generated</div>
              <div className={styles.metricValue}>{formatCurrency(detail.performance.totalRevenue)}</div>
              <div className={styles.metricSubtext}>All time</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Barber Earnings</div>
              <div className={styles.metricValue}>{formatCurrency(detail.performance.barberEarnings)}</div>
              <div className={styles.metricSubtext}>
                {(detail.barber.commissionRate * 100).toFixed(0)}% commission
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Avg Orders Per Day</div>
              <div className={styles.metricValue}>{detail.performance.avgOrdersPerDay.toFixed(1)}</div>
              <div className={styles.metricSubtext}>Average daily</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Rebooking Rate</div>
              <div className={styles.metricValue}>{detail.performance.rebookingRate.toFixed(1)}%</div>
              <div className={styles.metricSubtext}>Customer retention</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Complaints Count</div>
              <div className={styles.metricValue}>{detail.performance.complaintsCount}</div>
              <div className={styles.metricSubtext}>Low ratings (≤2 stars)</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Cancelled Orders</div>
              <div className={styles.metricValue}>{detail.performance.cancelledOrders}</div>
              <div className={styles.metricSubtext}>
                {detail.performance.totalOrders > 0
                  ? ((detail.performance.cancelledOrders / detail.performance.totalOrders) * 100).toFixed(1)
                  : 0}% cancellation rate
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Last Active</div>
              <div className={styles.metricValue}>{formatDate(detail.performance.lastActiveDate)}</div>
              <div className={styles.metricSubtext}>Last order date</div>
            </div>
          </div>
        </section>

        {/* Ratings & Feedback */}
        <section className={styles.section}>
          <h2>Ratings & Feedback</h2>
          <div className={styles.ratingsOverview}>
            <div className={styles.ratingCard}>
              <div className={styles.ratingValue}>{detail.barber.ratingAvg.toFixed(1)}</div>
              <div className={styles.ratingStars}>
                {'★'.repeat(Math.floor(detail.barber.ratingAvg))}
                {'☆'.repeat(5 - Math.floor(detail.barber.ratingAvg))}
              </div>
              <div className={styles.reviewCount}>{detail.barber.totalReviews} reviews</div>
            </div>
          </div>
          {detail.reviews.length > 0 ? (
            <div className={styles.reviewsList}>
              {detail.reviews.map((review) => (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div>
                      <strong>{review.order?.customer?.user?.name || 'Anonymous'}</strong>
                      <div className={styles.reviewRating}>
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                    <span className={styles.reviewDate}>{formatDate(review.createdAt)}</span>
                  </div>
                  {review.comment && <p className={styles.reviewComment}>{review.comment}</p>}
                  {review.barberResponse && (
                    <div className={styles.barberResponse}>
                      <strong>Barber Response:</strong>
                      <p>{review.barberResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noData}>No reviews yet</p>
          )}
        </section>

        {/* Recent Orders */}
        <section className={styles.section}>
          <h2>Recent Orders</h2>
          {detail.recentOrders.length > 0 ? (
            <div className={styles.ordersList}>
              {detail.recentOrders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div>
                      <strong>Order #{order.orderNumber}</strong>
                      <span>{formatDateTime(order.createdAt)}</span>
                    </div>
                    <div>
                      <span className={styles.orderStatus}>{order.status}</span>
                      <span className={styles.orderAmount}>{formatCurrency(Number(order.totalAmount))}</span>
                    </div>
                  </div>
                  <div className={styles.orderDetails}>
                    <p><strong>Customer:</strong> {order.customer?.user?.name || order.customerName}</p>
                    <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
                    <p><strong>Job Status:</strong> {order.jobStatus || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noData}>No orders found</p>
          )}
        </section>
      </main>
    </div>
  );
}
