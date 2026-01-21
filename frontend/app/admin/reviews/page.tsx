'use client';

import { useEffect, useState } from 'react';
import { fetchAuth } from '@/lib/auth';
import styles from './reviews.module.css';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, [filter, page]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await fetchAuth(
        `/api/v1/admin/reviews?status=${filter}&page=${page}&limit=20`
      );
      const data = await response.json();
      if (data.success) {
        setReviews(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (reviewId: string, currentVisibility: boolean) => {
    setActionLoading(reviewId);
    try {
      const response = await fetchAuth(`/api/v1/admin/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify({
          action: 'toggle-visibility',
        }),
      });
      const data = await response.json();
      if (data.success) {
        await loadReviews();
        alert(data.message || 'Review visibility updated');
      } else {
        alert(data.error?.message || 'Failed to update review');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update review');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    setActionLoading(reviewId);
    try {
      const response = await fetchAuth(`/api/v1/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        await loadReviews();
        alert('Review deleted successfully');
      } else {
        alert(data.error?.message || 'Failed to delete review');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    } finally {
      setActionLoading(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${styles.star} ${star <= rating ? styles.starFilled : ''}`}
          >
            ★
          </span>
        ))}
        <span className={styles.ratingValue}>({rating}/5)</span>
      </div>
    );
  };

  if (loading) {
    return <div className={styles.loading}>Loading reviews...</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Review Management</h1>
        <p className={styles.subtitle}>Moderate customer reviews and ratings</p>
      </header>

      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          All Reviews
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'visible' ? styles.active : ''}`}
          onClick={() => setFilter('visible')}
        >
          Visible
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'hidden' ? styles.active : ''}`}
          onClick={() => setFilter('hidden')}
        >
          Hidden
        </button>
      </div>

      <div className={styles.reviewsList}>
        {reviews.length === 0 ? (
          <div className={styles.empty}>No reviews found</div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewerInfo}>
                  {review.customer.avatarUrl ? (
                    <img
                      src={review.customer.avatarUrl}
                      alt={review.customer.name}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {review.customer.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className={styles.reviewerName}>{review.customer.name}</div>
                    <div className={styles.reviewerEmail}>{review.customer.email}</div>
                    <div className={styles.orderNumber}>Order: {review.orderNumber}</div>
                  </div>
                </div>
                <div className={styles.reviewMeta}>
                  {renderStars(review.rating)}
                  <div className={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                  <div
                    className={`${styles.visibilityBadge} ${
                      review.isVisible ? styles.visible : styles.hidden
                    }`}
                  >
                    {review.isVisible ? 'Visible' : 'Hidden'}
                  </div>
                </div>
              </div>

              {review.comment && (
                <div className={styles.reviewComment}>{review.comment}</div>
              )}

              {review.barberResponse && (
                <div className={styles.barberResponse}>
                  <strong>Barber Response:</strong>
                  <p>{review.barberResponse}</p>
                  <small>
                    {new Date(review.barberResponseAt).toLocaleDateString()}
                  </small>
                </div>
              )}

              <div className={styles.reviewActions}>
                <button
                  onClick={() => handleToggleVisibility(review.id, review.isVisible)}
                  disabled={actionLoading === review.id}
                  className={styles.actionButton}
                >
                  {review.isVisible ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={actionLoading === review.id}
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={styles.pageButton}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={styles.pageButton}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
