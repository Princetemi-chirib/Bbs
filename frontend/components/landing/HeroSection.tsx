'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HERO_VIDEO } from '@/lib/landing-data';
import styles from '@/app/page.module.css';

/** Hero with deferred video: loads only when tab is visible and after first paint to improve TTI. */
export default function HeroSection() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  useEffect(() => {
    const loadVideo = () => setVideoSrc(HERO_VIDEO);

    if (typeof document === 'undefined') return;
    if (!document.hidden) {
      const useIdle = typeof requestIdleCallback === 'function';
      const id = useIdle ? requestIdleCallback(loadVideo, { timeout: 800 }) : (setTimeout(loadVideo, 300) as unknown as number);
      return () => (useIdle ? cancelIdleCallback(id) : clearTimeout(id));
    }

    const onVisible = () => {
      if (!document.hidden) loadVideo();
    };
    document.addEventListener('visibilitychange', onVisible);
    const fallback = setTimeout(loadVideo, 2000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearTimeout(fallback);
    };
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.heroVideo}>
        {videoSrc ? (
          <video autoPlay loop muted playsInline preload="metadata">
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : null}
      </div>
      <div className={styles.heroOverlay} />
      <div className={styles.heroContent}>
        <h5 className={styles.heroPrefix}>NEED A HAIRCUT ?</h5>
        <h1 className={styles.heroTitle}>The Art of the Perfect Cut.</h1>
        <Link href="/book" className={styles.heroCtaBtn}>BOOK NOW</Link>
      </div>
    </section>
  );
}
