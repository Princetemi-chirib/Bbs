'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

const SERVICE_IMAGES = [
  { src: '/images/Buzz cut.jpg', caption: 'Buzz Cut' },
  { src: '/images/Hair braiding service.jpg', caption: 'Braiding' },
  { src: '/images/hair tinting.jpg', caption: 'Hair Tinting' },
  { src: '/images/hair treatment.jpg', caption: 'Hair Treatment' },
  { src: '/images/locks1.jpg', caption: 'Locks' },
  { src: '/images/nailcut service.jpg', caption: 'Nailcut' },
];

const GALLERY_IMAGES = [
  '/images/278a2b3cf825ba6c793eb3dc2b0374b3.jpg',
  '/images/65e434238ac0822f965117a26bb6951d.jpg',
  '/images/7c1bf4e32515b68e3c4ac9815314f561.jpg',
  '/images/948b11e05545c9d37cfd9068465b3fe6.jpg',
  '/images/1745850448156.jpeg',
  '/images/WhatsApp Image 2025-11-16 at 16.02.44_c168ed1b.jpg',
  '/images/WhatsApp Image 2025-11-16 at 13.31.13_98036f65.jpg',
];

const PARTNERS = [
  '/images/Airtel_logo-01.png',
  '/images/ke-scbk-logo-min.png',
  '/images/Moniepoint Logo_White on Blue.webp',
  '/images/securepay-removebg-preview (1).png',
];

const REVIEWS = [
  { name: 'David Adekunle', avatar: '/images/images (1).jpeg', rating: 5, text: "Got the cleanest fade I've had in Benin City. BBS barbers are true professionals. The attention to detail is absolutely unmatched. Worth every penny.", time: '2 weeks ago' },
  { name: 'Wale Ibrahim', avatar: '/images/images (2).jpeg', rating: 5, text: 'The service quality in Benin City is outstanding. From the moment I walked in, I was treated like royalty. My haircut was perfect, and the studio has a premium feel. Will definitely be back!', time: '1 month ago' },
  { name: 'Chinedu Okafor', avatar: '/images/images (4).jpeg', rating: 4.5, text: 'Professional service from start to finish. The barbers really know their craft and take their time to get everything perfect. Best haircut experience in Benin City by far.', time: '3 weeks ago' },
  { name: 'Tunde Balogun', avatar: '/images/images (5).jpeg', rating: 5, text: "The hair treatment service changed my hair completely! I've struggled with dryness and breakage for years. After their deep conditioning treatment, my hair feels healthier and looks shinier than ever.", time: '5 days ago' },
  { name: 'Hammed Bello', avatar: '/images/images (3).jpeg', rating: 5, text: 'The hair fibre replacement procedure exceeded all my expectations. Natural-looking results and the team was so professional throughout. My confidence has returned completely. Highly recommend BBS!', time: '2 months ago' },
  { name: 'Emeka Nwosu', avatar: '/images/efffa01b942bd74e.jpeg', rating: 5, text: "I was nervous about getting hair fibre replacement, but BBS made the whole process comfortable and painless. The results look completely natural – even my family couldn't tell! Worth every investment.", time: '1 week ago' },
];

const HERO_VIDEO = 'https://bbslimited.online/wp-content/uploads/2025/07/WhatsApp-Video-2025-07-30-at-10.39.46_f8c76c0c.mp4';
const FEATURE_VIDEOS = [
  'https://bbslimited.online/wp-content/uploads/2025/10/ReactNativeBlobUtilTmp_ddqyje96w0duyldas6cq8a-1.mp4',
  'https://bbslimited.online/wp-content/uploads/2025/10/ReactNativeBlobUtilTmp_qwsk893v42c62vhgzrruj5-1.mp4',
  'https://bbslimited.online/wp-content/uploads/2025/10/ReactNativeBlobUtilTmp_4zu8nyz8y9gs5oi1gg8tfl.mp4',
];

export default function Home() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [counters, setCounters] = useState({ clients: 0, barbers: 0, satisfaction: 0, appointments: 0 });

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

  useEffect(() => {
    const g = galleryRef.current;
    if (!g) return;
    let x = 0;
    const run = () => { x += 1; if (x >= g.scrollWidth - g.clientWidth) x = 0; g.scrollLeft = x; };
    const id = setInterval(run, 50);
    return () => clearInterval(id);
  }, []);

  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    let x = Math.max(0, Math.min(r.width, clientX - r.left));
    setSliderPosition((x / r.width) * 100);
  };
  const onDown = () => setIsDragging(true);
  const onUp = () => setIsDragging(false);

  return (
    <div className={styles.home}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroVideo}>
          <video autoPlay loop muted playsInline>
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.heroPrefix}>Need a haircut?</p>
          <h1 className={styles.heroTitle}>The Art of the Perfect Cut.</h1>
          <Link href="/book" className={styles.ctaBtn}>Book now</Link>
        </div>
      </section>

      {/* Service intro */}
      <section className={styles.serviceIntro}>
        <div className={styles.serviceIntroInner}>
          <div className={styles.serviceIntroText}>
            <h2 className={styles.sectionTitle}>The barber comes to you</h2>
            <p className={styles.sectionLead}>
              Enjoy a premium studio experience from the comfort of your home. Our expert barbers bring their skills and equipment directly to your door.
            </p>
          </div>
          <div className={styles.serviceGrid}>
            {SERVICE_IMAGES.map((img, i) => (
              <div key={i} className={styles.serviceCard}>
                <Image src={img.src} alt={img.caption} width={360} height={480} className={styles.serviceImg} />
                <span className={styles.serviceCaption}>{img.caption}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className={styles.whatWeDo}>
        <div className={styles.whatWeDoInner}>
          <h2 className={styles.sectionTitle}>What we do</h2>
          <div className={styles.sep} />
          <p className={styles.whatWeDoP}>
            BBS Limited brings the full studio experience directly to you. Our skilled professionals provide premium haircuts and grooming services at your home or office, on your schedule.
          </p>
        </div>
      </section>

      {/* Features + video */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <div className={styles.featureCard}>
            <div className={styles.featureVideoWrap}>
              <video autoPlay loop muted playsInline>
                <source src={FEATURE_VIDEOS[0]} type="video/mp4" />
              </video>
            </div>
            <div className={styles.featureContent}>
              <h3 className={styles.featureTitle}>Masterful craftsmanship</h3>
              <p>We meticulously select and train only the most skilled and passionate barbers. Each professional is dedicated to perfecting their craft and delivering a flawless look.</p>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureVideoWrap}>
              <video autoPlay loop muted playsInline>
                <source src={FEATURE_VIDEOS[1]} type="video/mp4" />
              </video>
            </div>
            <div className={styles.featureContent}>
              <h3 className={styles.featureTitle}>Unmatched convenience</h3>
              <p>We bring the complete barbershop experience directly to you. Enjoy a premium service at your home or office, saving you time and the hassle of travel and waiting.</p>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureVideoWrap}>
              <video autoPlay loop muted playsInline>
                <source src={FEATURE_VIDEOS[2]} type="video/mp4" />
              </video>
            </div>
            <div className={styles.featureContent}>
              <h3 className={styles.featureTitle}>A full suite of services</h3>
              <p>Beyond the cut, we offer a comprehensive range of grooming services. From detailed beard trims to nourishing haircare treatments, we cater to all your styling needs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className={styles.beforeAfter}>
        <div className={styles.beforeAfterInner}>
          <h2 className={styles.sectionTitle}>See the real difference up close</h2>
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
              <Image src="C:\Users\adeni\OneDrive\Desktop\Bbs project\frontend\public\images\bfr.jpeg" alt="Before" fill className={styles.sliderImg} sizes="(max-width: 480px) 100vw, 420px" />
            </div>
            <div className={styles.afterWrap} style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}>
              <Image src="/images/aft.jpeg" alt="After" fill className={styles.sliderImg} sizes="(max-width: 480px) 100vw, 420px" />
            </div>
            <div className={styles.sliderLine} style={{ left: `${sliderPosition}%` }} />
            <div ref={sliderRef} className={styles.sliderHandle} style={{ left: `${sliderPosition}%` }} onMouseDown={onDown} onTouchStart={onDown}>
              <span className={styles.sliderIcon} aria-hidden>↔</span>
            </div>
            <span className={styles.beforeLabel}>Before</span>
            <span className={styles.afterLabel}>After</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats-section" className={styles.stats}>
        <div className={styles.statsInner}>
          <h2 className={styles.sectionTitle}>Our record of excellence</h2>
          <p className={styles.statsSub}>Our commitment to quality and service is reflected in our growing community of satisfied clients.</p>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{counters.clients}+</span>
              <span className={styles.statLabel}>Happy clients</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{counters.barbers}+</span>
              <span className={styles.statLabel}>Expert barbers</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{counters.satisfaction}%</span>
              <span className={styles.statLabel}>Satisfaction rate</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{counters.appointments}+</span>
              <span className={styles.statLabel}>Appointments booked</span>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className={styles.gallery}>
        <div ref={galleryRef} className={styles.galleryTrack}>
          {GALLERY_IMAGES.map((src, i) => (
            <div key={i} className={styles.galleryItem}>
              <Image src={src} alt={`Gallery ${i + 1}`} width={320} height={400} className={styles.galleryImg} />
            </div>
          ))}
        </div>
      </section>

      {/* Partners */}
      <section className={styles.partners}>
        <div className={styles.partnersInner}>
          <p className={styles.partnersTitle}>Our partners</p>
          <div className={styles.partnersGrid}>
            {PARTNERS.map((logo, i) => (
              <div key={i} className={styles.partnerLogo}>
                <Image src={logo} alt={`Partner ${i + 1}`} width={120} height={60} className={styles.partnerImg} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
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
                    <Image src={r.avatar} alt="" width={40} height={40} className={styles.avatarImg} />
                  </div>
                  <div>
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
                  <span className={styles.verified}>✓ Verified</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <p className={styles.ctaPrefix}>Ready for a new look?</p>
        <h2 className={styles.ctaTitle}>Book an appointment and experience the ultimate in convenience and style.</h2>
        <Link href="/book" className={styles.ctaBtn}>Book now</Link>
      </section>
    </div>
  );
}
