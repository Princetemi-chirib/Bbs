'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { GALLERY_CAROUSEL } from '@/lib/landing-data';
import styles from '@/app/page.module.css';

const PAUSE_AFTER_SCROLL_MS = 400;
const GAP_PX = 20;

/** Gallery carousel with auto-scroll that pauses when tab is hidden (Page Visibility API) and on user scroll/touch. */
export default function GallerySection() {
  const galleryRef = useRef<HTMLDivElement>(null);
  const galleryPausedUntilRef = useRef(0);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;

    const onScrollOrTouch = () => {
      galleryPausedUntilRef.current = Date.now() + PAUSE_AFTER_SCROLL_MS;
    };

    el.addEventListener('scroll', onScrollOrTouch, { passive: true });
    el.addEventListener('touchstart', onScrollOrTouch, { passive: true });

    const step = 2;
    const intervalMs = 45;
    const timer = setInterval(() => {
      if (!isVisibleRef.current || Date.now() < galleryPausedUntilRef.current) return;
      const track = galleryRef.current;
      if (!track) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) return;
      const next = track.scrollLeft + step;
      track.scrollLeft = next >= maxScroll ? 0 : next;
    }, intervalMs);

    return () => {
      el.removeEventListener('scroll', onScrollOrTouch);
      el.removeEventListener('touchstart', onScrollOrTouch);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const scrollGallery = (direction: 'left' | 'right') => {
    galleryPausedUntilRef.current = Date.now() + PAUSE_AFTER_SCROLL_MS;
    const g = galleryRef.current;
    if (!g) return;
    const firstItem = g.firstElementChild as HTMLElement | null;
    const itemWidth = firstItem?.offsetWidth ?? 276;
    const step = itemWidth + GAP_PX;
    g.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
  };

  return (
    <section className={styles.gallery}>
      <div className={styles.galleryWrap}>
        <button type="button" className={styles.galleryArrow} aria-label="Scroll gallery left" onClick={() => scrollGallery('left')}>
          <svg className={styles.galleryArrowIcon} width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6 12L18 4v16L6 12z" /></svg>
        </button>
        <div ref={galleryRef} className={styles.galleryTrack}>
          {GALLERY_CAROUSEL.map((src, i) => (
            <div key={i} className={styles.galleryItem}>
              <Image src={src} alt={`Gallery ${i + 1}`} width={276} height={276} className={styles.galleryImg} sizes="(max-width: 768px) 45vw, 276px" loading="lazy" />
            </div>
          ))}
        </div>
        <button type="button" className={styles.galleryArrowRight} aria-label="Scroll gallery right" onClick={() => scrollGallery('right')}>
          <svg className={styles.galleryArrowIcon} width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18 12L6 4v16l12-8z" /></svg>
        </button>
      </div>
    </section>
  );
}
