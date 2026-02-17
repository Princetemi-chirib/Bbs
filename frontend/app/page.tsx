'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  SERVICE_IMAGES,
  PARTNERS,
  REVIEWS,
  FEATURE_VIDEOS,
  BEFORE_IMG,
  AFTER_IMG,
} from '@/lib/landing-data';
import HeroSection from '@/components/landing/HeroSection';
import styles from './page.module.css';

const GallerySection = dynamic(() => import('@/components/landing/GallerySection'), { ssr: true });

export default function Home() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [counters, setCounters] = useState({ clients: 0, barbers: 0, satisfaction: 0, appointments: 0 });
  // Lazy-load feature videos only when in viewport (keeps design identical, reduces initial load).
  const [featureVideoVisible, setFeatureVideoVisible] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const featureCardRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

  // Lazy-load feature videos when each card enters viewport.
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    featureCardRefs.current.forEach((el, i) => {
      if (!el) return;
      const ob = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setFeatureVideoVisible((prev) => {
              const next = [...prev] as [boolean, boolean, boolean];
              next[i] = true;
              return next;
            });
          }
        },
        { rootMargin: '100px', threshold: 0.1 }
      );
      ob.observe(el);
      observers.push(ob);
    });
    return () => observers.forEach((ob) => ob.disconnect());
  }, []);

  useEffect(() => {
    const animate = () => {
      const d = 1500;
      const steps = 60;
      const iv = d / steps;
      const t = { clients: 500, barbers: 50, satisfaction: 100, appointments: 500 };
      let s = 0;
      const timer = setInterval(() => {
        s++;
        const p = Math.min(s / steps, 1);
        setCounters({
          clients: Math.floor(t.clients * p),
          barbers: Math.floor(t.barbers * p),
          satisfaction: Math.floor(t.satisfaction * p),
          appointments: Math.floor(t.appointments * p),
        });
        if (s >= steps) clearInterval(timer);
      }, iv);
    };
    const ob = new IntersectionObserver(
      (e) => { if (e[0].isIntersecting) { animate(); ob.disconnect(); } },
      { threshold: 0.5 }
    );
    const el = document.getElementById('stats-section');
    if (el) ob.observe(el);
    return () => ob.disconnect();
  }, []);

  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    let x = Math.max(0, Math.min(r.width, clientX - r.left));
    setSliderPosition((x / r.width) * 100);
  };
  const onDown = () => setIsDragging(true);
  const onUp = () => setIsDragging(false);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => handleSliderMove(e.clientX);
    const onTouch = (e: TouchEvent) => e.touches[0] && handleSliderMove(e.touches[0].clientX);
    const onEnd = () => onUp();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouch, { passive: false });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging]);

  return (
    <div className={styles.home}>
      <HeroSection />

      {/* The Barber Comes to You – two-column: text left, 3×2 image grid right */}
      <section className={styles.serviceIntro}>
        <div className={styles.serviceIntroInner}>
          <div className={styles.serviceIntroText}>
            <h3 className={styles.serviceIntroTitle}>The Barber Comes to You.</h3>
            <p className={styles.serviceIntroLead}>
              Enjoy a premium studio experience from the comfort of your home. Our expert barbers bring their skills and equipment directly to your door.
            </p>
          </div>
          <div className={styles.serviceGrid}>
            {SERVICE_IMAGES.map((img, i) => (
              <div key={i} className={styles.serviceCard}>
                <Image src={img.src} alt={img.caption} width={360} height={480} className={styles.serviceImg} sizes="(max-width: 768px) 100vw, 360px" loading="lazy" />
                <span className={styles.serviceCaption}>{img.caption}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we do – header row (heading + line | paragraph) + three image cards */}
      <section className={styles.whatWeDo}>
        <div className={styles.whatWeDoInner}>
          <div className={styles.whatWeDoHeader}>
            <div className={styles.whatWeDoHeadLeft}>
              <h2 className={styles.whatWeDoHeading}>What we do</h2>
              <div className={styles.whatWeDoSep} />
            </div>
            <p className={styles.whatWeDoP}>
              BBS Limited brings the full studio experience directly to you. Our skilled professionals provide premium haircuts and grooming services at your home or office, on your schedule.
            </p>
          </div>
          <div className={styles.whatWeDoCards}>
            <div ref={(el) => { featureCardRefs.current[0] = el; }} className={styles.featureCard}>
              <div className={styles.featureMediaWrap}>
                <video autoPlay loop muted playsInline>
                  {featureVideoVisible[0] && <source src={FEATURE_VIDEOS[0]} type="video/mp4" />}
                </video>
                <div className={styles.featureOverlay} />
              </div>
              <div className={styles.featureContent}>
                <h3 className={styles.featureTitle}>Masterful Craftsmanship.</h3>
                <p className={styles.featureDesc}>We meticulously select and train only the most skilled and passionate barbers. Each professional on our team is dedicated to perfecting their craft and delivering a flawless look.</p>
              </div>
            </div>
            <div ref={(el) => { featureCardRefs.current[1] = el; }} className={styles.featureCard}>
              <div className={styles.featureMediaWrap}>
                <video autoPlay loop muted playsInline>
                  {featureVideoVisible[1] && <source src={FEATURE_VIDEOS[1]} type="video/mp4" />}
                </video>
                <div className={styles.featureOverlay} />
              </div>
              <div className={styles.featureContent}>
                <h3 className={styles.featureTitle}>Unmatched Convenience</h3>
                <p className={styles.featureDesc}>We bring the complete barbershop experience directly to you. Enjoy a premium service at your home or office, saving you time and the hassle of travel and waiting.</p>
              </div>
            </div>
            <div ref={(el) => { featureCardRefs.current[2] = el; }} className={styles.featureCard}>
              <div className={styles.featureMediaWrap}>
                <video autoPlay loop muted playsInline>
                  {featureVideoVisible[2] && <source src={FEATURE_VIDEOS[2]} type="video/mp4" />}
                </video>
                <div className={styles.featureOverlay} />
              </div>
              <div className={styles.featureContent}>
                <h3 className={styles.featureTitle}>A Full Suite of Services</h3>
                <p className={styles.featureDesc}>Beyond the cut, we offer a comprehensive range of grooming services. From detailed beard trims to nourishing haircare treatments, we cater to all your styling needs.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* See the Real Difference + Before/After */}
      <section className={styles.beforeAfter}>
        <div className={styles.beforeAfterInner}>
          <h2 className={styles.sectionTitle}>See the Real Difference up Close.</h2>
          <h2 className={styles.beforeAfterSubtitle}>Advanced Hair Replacement</h2>
          <div
            ref={containerRef}
            className={styles.sliderWrap}
            onMouseMove={(e) => isDragging && handleSliderMove(e.clientX)}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchMove={(e) => isDragging && e.touches[0] && handleSliderMove(e.touches[0].clientX)}
            onTouchEnd={onUp}
            onClick={(e) => !isDragging && handleSliderMove(e.clientX)}
          >
            <div className={styles.beforeWrap} style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}>
              <Image src={BEFORE_IMG} alt="Before" fill className={styles.sliderImg} sizes="(max-width: 480px) 100vw, 420px" loading="lazy" />
            </div>
            <div className={styles.afterWrap} style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}>
              <Image src={AFTER_IMG} alt="After" fill className={styles.sliderImg} sizes="(max-width: 480px) 100vw, 420px" loading="lazy" fetchPriority="low" />
            </div>
            <div className={styles.sliderLine} style={{ left: `${sliderPosition}%` }} />
            <div className={styles.sliderHandle} style={{ left: `${sliderPosition}%` }} onMouseDown={onDown} onTouchStart={onDown}>
              <span className={styles.sliderIcon} aria-hidden>↔</span>
            </div>
            <span className={styles.beforeLabel}>Before</span>
            <span className={styles.afterLabel}>After</span>
          </div>
        </div>
      </section>

      {/* Our Record of Excellence */}
      <section id="stats-section" className={styles.stats}>
        <div className={styles.statsInner}>
          <div className={styles.statsIntro}>
            <h2 className={styles.sectionTitle}>Our Record of Excellence</h2>
            <p className={styles.statsSub}>Our commitment to quality and service is reflected in our growing community of satisfied clients. Here are the numbers that show our dedication.</p>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{counters.clients}<span className={styles.statSuffix}>+</span></span>
              <span className={styles.statLabel}>Happy Clients</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{counters.barbers}<span className={styles.statSuffix}>+</span></span>
              <span className={styles.statLabel}>Expert Barbers</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{counters.satisfaction}<span className={styles.statSuffix}>%</span></span>
              <span className={styles.statLabel}><strong>Satisfaction Rate</strong></span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{counters.appointments}<span className={styles.statSuffix}>s</span></span>
              <span className={styles.statLabel}>Appointments Booked</span>
            </div>
          </div>
        </div>
      </section>

      <GallerySection />

      {/* OUR PARTNERS */}
      <section className={styles.partners}>
        <div className={styles.partnersInner}>
          <div className={styles.partnersTitleWrap}>
            <h2 className={styles.partnersTitle}>OUR PARTNERS</h2>
            <span className={styles.partnersTitleLine} aria-hidden />
          </div>
          <div className={styles.partnersGrid}>
            {PARTNERS.map((logo, i) => (
              <div key={i} className={styles.partnerLogo}>
                <Image src={logo} alt={`Partner ${i + 1}`} width={120} height={60} className={styles.partnerImg} sizes="120px" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* READY FOR A NEW LOOK? */}
      <section className={styles.finalCta}>
        <span className={styles.ctaPrefix}>READY FOR A NEW LOOK?</span>
        <h2 className={styles.ctaTitle}>Book an appointment with us and experience the ultimate in convenience and style.</h2>
        <Link href="/book" className={styles.ctaBtn}>BOOK NOW</Link>
      </section>

      {/* Customer Reviews - Google style */}
      <section className={styles.reviews}>
        <div className={styles.reviewsInner}>
          <div className={styles.reviewsHead}>
            <div className={styles.reviewsBrand}>
              <svg className={styles.googleIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className={styles.reviewsBrandText}>Reviews</span>
            </div>
            <div className={styles.ratingNum}>4.8</div>
            <div className={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((i) => <span key={i} className={styles.star} aria-hidden>★</span>)}
            </div>
            <p className={styles.reviewCount}>Based on 287 reviews</p>
          </div>
          <div className={styles.reviewsGrid}>
            {REVIEWS.map((r, i) => (
              <article key={i} className={styles.reviewCard}>
                <div className={styles.reviewHead}>
                  <div className={styles.reviewAvatar}>
                    <Image src={r.avatar} alt="" width={40} height={40} className={styles.avatarImg} sizes="40px" loading="lazy" />
                  </div>
                  <div className={styles.reviewHeadText}>
                    <div className={styles.reviewName}>{r.name}</div>
                    <div className={styles.reviewStarsSmall}>
                      {[1, 2, 3, 4, 5].map((j) => (
                        <span key={j} className={j <= Math.floor(r.rating) ? styles.starFilled : styles.starEmpty} aria-hidden>{j <= Math.floor(r.rating) ? '★' : '☆'}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className={styles.reviewText}>{r.text}</p>
                <div className={styles.reviewMeta}>
                  <span>{r.time}</span>
                  <span>•</span>
                  <span className={styles.verified}>Verified</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
