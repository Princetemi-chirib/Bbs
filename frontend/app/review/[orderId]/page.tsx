'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchAuth, getUserData } from '@/lib/auth';
import styles from './review.module.css';

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      // Get order details - need to check if this endpoint exists or create it
      const response = await fetchAuth(`/api/v1/orders/${orderId}`);
      const data = await response.json();
      
      if (data.success) {
        const orderData = data.data;
        
        // Check if order is completed and has a barber
        if (orderData.jobStatus !== 'COMPLETED') {
          setError('You can only review completed orders');
          return;
        }
        
        if (!orderData.assignedBarber) {
          setError('This order does not have an assigned barber');
          return;
        }
        
        // Check if review already exists
        if (orderData.review) {
          setError('You have already reviewed this order');
          return;
        }
        
        setOrder(orderData);
      } else {
        setError(data.error?.message || 'Failed to load order');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetchAuth('/api/v1/reviews', {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Thank you for your review!');
        setTimeout(() => {
          router.push('/'); // Redirect to home or order history
        }, 2000);
      } else {
        setError(data.error?.message || 'Failed to submit review');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={() => router.push('/')} className={styles.button}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Leave a Review</h1>
        <p className={styles.subtitle}>
          How was your experience with {order?.assignedBarber?.user?.name || 'your barber'}?
        </p>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Your Rating *</label>
            <div className={styles.starRating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`${styles.star} ${
                    star <= (hoverRating || rating) ? styles.starActive : ''
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </button>
              ))}
              {rating > 0 && (
                <span className={styles.ratingText}>
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </span>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="comment" className={styles.label}>
              Your Review (Optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={styles.textarea}
              rows={5}
              placeholder="Share your experience with this barber..."
              maxLength={1000}
            />
            <div className={styles.charCount}>{comment.length}/1000</div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.cancelButton}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting || !rating}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>

        <div className={styles.orderInfo}>
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> {order?.orderNumber}</p>
          <p><strong>Barber:</strong> {order?.assignedBarber?.user?.name}</p>
          <p><strong>Total:</strong> ₦{Number(order?.totalAmount || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
