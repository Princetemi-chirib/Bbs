'use client';

import styles from './RatingDisplay.module.css';

interface RatingDisplayProps {
  rating: number;
  totalReviews?: number;
  showReviewsCount?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function RatingDisplay({
  rating,
  totalReviews,
  showReviewsCount = true,
  size = 'medium',
}: RatingDisplayProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const sizeClass = styles[size];

  return (
    <div className={styles.ratingContainer}>
      <div className={`${styles.stars} ${sizeClass}`}>
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`full-${i}`} className={`${styles.star} ${styles.starFilled}`}>
            ★
          </span>
        ))}
        {hasHalfStar && (
          <span className={`${styles.star} ${styles.starHalf}`}>
            ★
          </span>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`empty-${i}`} className={styles.star}>
            ★
          </span>
        ))}
      </div>
      <span className={`${styles.ratingValue} ${sizeClass}`}>
        {rating.toFixed(1)}
      </span>
      {showReviewsCount && totalReviews !== undefined && (
        <span className={`${styles.reviewsCount} ${sizeClass}`}>
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
