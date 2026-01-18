'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams?.get('reference') || null;

  useEffect(() => {
    // Redirect if no reference
    if (!reference && typeof window !== 'undefined') {
      router.push('/book');
    }
  }, [reference, router]);

  return (
    <div className={styles.successPage}>
      <div className={styles.container}>
        <div className={styles.successContent}>
          <div className={styles.successIcon}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1>Payment Successful!</h1>
          <p className={styles.successMessage}>
            Thank you for your booking. Your payment has been processed successfully.
          </p>
          {reference && (
            <div className={styles.referenceInfo}>
              <p>Reference Number:</p>
              <p className={styles.referenceCode}>{reference}</p>
            </div>
          )}
          <div className={styles.nextSteps}>
            <h2>What&apos;s Next?</h2>
            <ul>
              <li>You will receive a confirmation email with your booking details</li>
              <li>Our team will contact you shortly to confirm your appointment</li>
              <li>A professional barber will arrive at your chosen location</li>
              <li>You can track your barber&apos;s location via email updates</li>
            </ul>
          </div>
          <div className={styles.actions}>
            <Link href="/book" className={styles.primaryBtn}>
              Book Another Service
            </Link>
            <Link href="/" className={styles.secondaryBtn}>
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className={styles.successPage}>
        <div className={styles.container}>
          <div className={styles.successContent}>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
