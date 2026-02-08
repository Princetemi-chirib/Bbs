'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

const MEDIA = 'https://whitesmoke-jackal-101083.hostingersite.com';

const SERVICE_IMAGES = [
  { src: `${MEDIA}/wp-content/uploads/2025/10/2e7349e0-2da2-4462-a63f-0f39f9adafeb-871x1024.jpeg`, caption: 'Hair Dye' },
  { src: `${MEDIA}/wp-content/uploads/2025/10/5fbc6405-88de-4f61-a8c1-bb3636a2d27e-863x1024.jpeg`, caption: 'Tapper Fade' },
  { src: `${MEDIA}/wp-content/uploads/2025/10/a7e754ff-e7b7-4e0f-a40c-69f2a8f15527-1024x988.jpeg`, caption: 'Round Cut' },
  { src: `${MEDIA}/wp-content/uploads/2025/10/e1d33e39-ab4c-40fb-a699-e4711235d343-936x1024.jpeg`, caption: 'Locks' },
  { src: `${MEDIA}/wp-content/uploads/2025/10/c6175c55-424d-4864-beb2-01028a3b30d9-944x1024.jpeg`, caption: 'High Tapper' },
  { src: `${MEDIA}/wp-content/uploads/2025/10/e50c2ed2-3d1b-41e3-b766-8c65deccff67.jpeg`, caption: 'Braids' },
];

const GALLERY_CAROUSEL = [
  `${MEDIA}/wp-content/uploads/2025/10/c6175c55-424d-4864-beb2-01028a3b30d9-276x300.jpeg`,
  `${MEDIA}/wp-content/uploads/2025/10/e25fb414-4c63-47fa-8584-d577356e5da9-300x290.jpeg`,
  `${MEDIA}/wp-content/uploads/2025/10/e1d33e39-ab4c-40fb-a699-e4711235d343-274x300.jpeg`,
  `${MEDIA}/wp-content/uploads/2025/10/4925501c-2e21-41b6-b943-7be70428cd97-300x294.jpeg`,
  `${MEDIA}/wp-content/uploads/2025/10/3ba511bc-2d3d-4cb3-9ee2-1500d1f7771c-269x300.jpeg`,
  `${MEDIA}/wp-content/uploads/2025/10/f4d0215e-a42b-4a7a-a102-7f8f771ea25f-255x300.jpeg`,
  `${MEDIA}/wp-content/uploads/2025/10/fb38aac4-11c0-41cb-bace-6430b45387a6-275x300.jpeg`,
  `${MEDIA}/wp-content/uploads/2025/10/e7c29c32-b537-4a97-b15e-4a0bbf6ef82d-257x300.jpeg`,
  `${MEDIA}/wp-content/uploads/2025/10/9574667e-e7e3-4c54-baa1-3fe85a175adf-274x300.jpeg`,
  `${MEDIA}/wp-content/uploads/2025/10/67e08b01-213b-4c65-82c9-11c93244021f-258x300.jpeg`,
  `${MEDIA}/wp-content/uploads/2025/10/e50c2ed2-3d1b-41e3-b766-8c65deccff67-300x300.jpeg`,
];

const PARTNERS = [
  `${MEDIA}/wp-content/uploads/2025/09/IMG_0375.png`,
  `${MEDIA}/wp-content/uploads/2025/09/fbd1ba7b-3928-41c9-b92a-bcc172e174d9.jpeg`,
  `${MEDIA}/wp-content/uploads/2025/09/IMG_0376.jpeg`,
  `${MEDIA}/wp-content/uploads/2025/09/images-1.png`,
  `${MEDIA}/wp-content/uploads/2025/09/Zenith-Bank-logo.png`,
  `${MEDIA}/wp-content/uploads/2025/09/1hOeKxzZ_400x400.jpg`,
  `${MEDIA}/wp-content/uploads/2025/10/IMG_1842.png`,
  `${MEDIA}/wp-content/uploads/2025/10/IMG_1839.png`,
  `${MEDIA}/wp-content/uploads/2025/10/images-2.png`,
  `${MEDIA}/wp-content/uploads/2025/10/Airtel_logo-01.png`,
];

const REVIEWS = [
  { name: 'David Adekunle', avatar: `${MEDIA}/wp-content/uploads/2025/10/images-1.jpeg`, rating: 5, text: "Got the cleanest fade I've had in Benin City. BBS barbers are true professionals. The attention to detail is absolutely unmatched. Worth every penny.", time: '2 weeks ago' },
  { name: 'wale Ibrahim', avatar: `${MEDIA}/wp-content/uploads/2025/10/images-2.jpeg`, rating: 5, text: 'The service quality in Benin City is outstanding. From the moment I walked in, I was treated like royalty. My haircut was perfect, and the haircut studio has a premium feel. Will definitely be back!', time: '1 month ago' },
  { name: 'Chinedu Okafor', avatar: `${MEDIA}/wp-content/uploads/2025/10/images-4.jpeg`, rating: 4.5, text: 'Professional service from start to finish. The barbers really know their craft and take their time to get everything perfect. Best haircut experience in Benin City by far.', time: '3 weeks ago' },
  { name: 'Tunde Balogun', avatar: `${MEDIA}/wp-content/uploads/2025/10/images-5.jpeg`, rating: 5, text: "The hair treatment service changed my hair completely! I've struggled with dryness and breakage for years. After their deep conditioning treatment, my hair feels healthier and looks shinier than ever before.", time: '5 days ago' },
  { name: 'Hammed Bello', avatar: `${MEDIA}/wp-content/uploads/2025/10/images-3.jpeg`, rating: 5, text: 'The hair fibre replacement procedure exceeded all my expectations. Natural-looking results and the team was so professional throughout. My confidence has returned completely. Highly recommend BBS for this service!', time: '2 months ago' },
  { name: 'Emeka Nwosu', avatar: `${MEDIA}/wp-content/uploads/2025/10/efffa01b942bd74e.jpeg`, rating: 5, text: "I was nervous about getting hair fibre replacement, but BBS made the whole process comfortable and painless. The results look completely natural – even my family couldn't tell! Worth every investment.", time: '1 week ago' },
];

const HERO_VIDEO = `${MEDIA}/wp-content/uploads/2025/07/WhatsApp-Video-2025-07-30-at-10.39.46_f8c76c0c.mp4`;
const FEATURE_VIDEOS = [
  `${MEDIA}/wp-content/uploads/2025/10/ReactNativeBlobUtilTmp_ddqyje96w0duyldas6cq8a-1.mp4`,
  `${MEDIA}/wp-content/uploads/2025/10/ReactNativeBlobUtilTmp_qwsk893v42c62vhgzrruj5-1.mp4`,
  `${MEDIA}/wp-content/uploads/2025/10/ReactNativeBlobUtilTmp_4zu8nyz8y9gs5oi1gg8tfl.mp4`,
];

const BEFORE_IMG = `${MEDIA}/wp-content/uploads/2025/09/bfr.jpeg`;
const AFTER_IMG = `${MEDIA}/wp-content/uploads/2025/09/aft.jpeg`;

export default function Home() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
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

  // Gallery: use requestAnimationFrame for smooth scroll without layout thrash (was setInterval 50ms).
  useEffect(() => {
    const g = galleryRef.current;
    if (!g) return;
    let x = 0;
    let rafId: number;
    const run = () => {
      x += 1;
      if (x >= g.scrollWidth - g.clientWidth) x = 0;
      g.scrollLeft = x;
      rafId = requestAnimationFrame(run);
    };
    rafId = requestAnimationFrame(run);
    return () => cancelAnimationFrame(rafId);
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
      {/* Hero - exact copy from current site */}
      <section className={styles.hero}>
        <div className={styles.heroVideo}>
          <video autoPlay loop muted playsInline preload="metadata">
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h5 className={styles.heroPrefix}>NEED A HAIRCUT ?</h5>
          <h1 className={styles.heroTitle}>The Art of the Perfect Cut.</h1>
          <Link href="/book" className={styles.heroCtaBtn}>BOOK NOW</Link>
        </div>
      </section>

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
              <Image src={BEFORE_IMG} alt="Before" fill className={styles.sliderImg} sizes="(max-width: 480px) 100vw, 420px" />
            </div>
            <div className={styles.afterWrap} style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}>
              <Image src={AFTER_IMG} alt="After" fill className={styles.sliderImg} sizes="(max-width: 480px) 100vw, 420px" />
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

      {/* Gallery carousel */}
      <section className={styles.gallery}>
        <div ref={galleryRef} className={styles.galleryTrack}>
          {GALLERY_CAROUSEL.map((src, i) => (
            <div key={i} className={styles.galleryItem}>
              <Image src={src} alt={`Gallery ${i + 1}`} width={276} height={300} className={styles.galleryImg} sizes="276px" loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      {/* OUR PARTNERS */}
      <section className={styles.partners}>
        <div className={styles.partnersInner}>
          <h6 className={styles.partnersTitle}>OUR PARTNERS</h6>
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
