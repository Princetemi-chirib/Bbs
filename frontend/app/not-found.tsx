'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './not-found.module.css';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <Image
            src="/images/WhatsApp Image 2025-07-26 at 20.20.08_a40e3183 - Edited.png"
            alt="BBS Limited"
            width={200}
            height={70}
            className={styles.logo}
            priority
          />
        </div>

        {/* 404 Number */}
        <div className={styles.errorNumber}>
          <span className={styles.four}>4</span>
          <span className={styles.zero}>
            <div className={styles.zeroInner}></div>
          </span>
          <span className={styles.four}>4</span>
        </div>

        {/* Error Message */}
        <div className={styles.messageContainer}>
          <h1 className={styles.title}>Page Not Found</h1>
          <p className={styles.description}>
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button onClick={() => router.back()} className={styles.secondaryButton}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>
          <Link href="/" className={styles.primaryButton}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </Link>
        </div>

        {/* Helpful Links */}
        <div className={styles.helpfulLinks}>
          <p className={styles.helpfulTitle}>You might be looking for:</p>
          <div className={styles.linksGrid}>
            <Link href="/book" className={styles.linkCard}>
              <div className={styles.linkIcon}>📅</div>
              <div className={styles.linkText}>Book Service</div>
            </Link>
            <Link href="/contact" className={styles.linkCard}>
              <div className={styles.linkIcon}>📞</div>
              <div className={styles.linkText}>Contact Us</div>
            </Link>
            <Link href="/barber-recruit" className={styles.linkCard}>
              <div className={styles.linkIcon}>✂️</div>
              <div className={styles.linkText}>Join as Barber</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className={styles.decorativeCircle1}></div>
      <div className={styles.decorativeCircle2}></div>
      <div className={styles.decorativeCircle3}></div>
    </div>
  );
}
