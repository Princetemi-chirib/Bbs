'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function Home() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Counter animation
  const [counters, setCounters] = useState({
    clients: 0,
    barbers: 0,
    satisfaction: 0,
    appointments: 0,
  });

  useEffect(() => {
    const animateCounters = () => {
      const duration = 1500;
      const steps = 60;
      const interval = duration / steps;

      const targets = {
        clients: 500,
        barbers: 50,
        satisfaction: 100,
        appointments: 500,
      };

      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = Math.min(step / steps, 1);
        
        setCounters({
          clients: Math.floor(targets.clients * progress),
          barbers: Math.floor(targets.barbers * progress),
          satisfaction: Math.floor(targets.satisfaction * progress),
          appointments: Math.floor(targets.appointments * progress),
        });

        if (step >= steps) {
          clearInterval(timer);
        }
      }, interval);
    };

    // Trigger animation when component mounts
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounters();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    const statsSection = document.getElementById('stats-section');
    if (statsSection) {
      observer.observe(statsSection);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-scroll gallery
  useEffect(() => {
    if (!galleryRef.current) return;
    
    const gallery = galleryRef.current;
    let scrollPosition = 0;
    const scrollSpeed = 1;
    
    const autoScroll = () => {
      scrollPosition += scrollSpeed;
      if (scrollPosition >= gallery.scrollWidth - gallery.clientWidth) {
        scrollPosition = 0;
      }
      gallery.scrollLeft = scrollPosition;
    };
    
    const interval = setInterval(autoScroll, 50);
    return () => clearInterval(interval);
  }, []);

  // Slider handlers
  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(rect.width, x));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleSliderMove(e.clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches[0]) handleSliderMove(e.touches[0].clientX);
  };

  // Service images
  const serviceImages = [
    { src: 'https://bbslimited.online/wp-content/uploads/2025/10/2e7349e0-2da2-4462-a63f-0f39f9adafeb-871x1024.jpeg', caption: 'Hair Dye' },
    { src: 'https://bbslimited.online/wp-content/uploads/2025/10/5fbc6405-88de-4f61-a8c1-bb3636a2d27e-863x1024.jpeg', caption: 'Tapper Fade' },
    { src: 'https://bbslimited.online/wp-content/uploads/2025/10/a7e754ff-e7b7-4e0f-a40c-69f2a8f15527-1024x988.jpeg', caption: 'Round Cut' },
    { src: 'https://bbslimited.online/wp-content/uploads/2025/10/e1d33e39-ab4c-40fb-a699-e4711235d343-936x1024.jpeg', caption: 'Locks' },
    { src: 'https://bbslimited.online/wp-content/uploads/2025/10/c6175c55-424d-4864-beb2-01028a3b30d9-944x1024.jpeg', caption: 'High Tapper' },
    { src: 'https://bbslimited.online/wp-content/uploads/2025/10/e50c2ed2-3d1b-41e3-b766-8c65deccff67.jpeg', caption: 'Braids' },
  ];

  // Gallery images for carousel
  const galleryImages = [
    'https://bbslimited.online/wp-content/uploads/2025/10/c6175c55-424d-4864-beb2-01028a3b30d9.jpeg',
    'https://bbslimited.online/wp-content/uploads/2025/10/e25fb414-4c63-47fa-8584-d577356e5da9.jpeg',
    'https://bbslimited.online/wp-content/uploads/2025/10/e1d33e39-ab4c-40fb-a699-e4711235d343.jpeg',
    'https://bbslimited.online/wp-content/uploads/2025/10/4925501c-2e21-41b6-b943-7be70428cd97.jpeg',
    'https://bbslimited.online/wp-content/uploads/2025/10/3ba511bc-2d3d-4cb3-9ee2-1500d1f7771c.jpeg',
    'https://bbslimited.online/wp-content/uploads/2025/10/f4d0215e-a42b-4a7a-a102-7f8f771ea25f.jpeg',
  ];

  // Partners
  const partners = [
    'https://bbslimited.online/wp-content/uploads/2025/09/IMG_0375.png',
    'https://bbslimited.online/wp-content/uploads/2025/09/fbd1ba7b-3928-41c9-b92a-bcc172e174d9-1024x561.jpeg',
    'https://bbslimited.online/wp-content/uploads/2025/09/IMG_0376.jpeg',
    'https://bbslimited.online/wp-content/uploads/2025/09/images-1.png',
    'https://bbslimited.online/wp-content/uploads/2025/09/Zenith-Bank-logo.png',
  ];

  // Reviews
  const reviews = [
    {
      name: 'David Adekunle',
      avatar: 'https://bbslimited.online/wp-content/uploads/2025/10/images-1.jpeg',
      rating: 5,
      text: "Got the cleanest fade I've had in Benin City. BBS barbers are true professionals. The attention to detail is absolutely unmatched. Worth every penny.",
      time: '2 weeks ago',
    },
    {
      name: 'Wale Ibrahim',
      avatar: 'https://bbslimited.online/wp-content/uploads/2025/10/images-2.jpeg',
      rating: 5,
      text: 'The service quality in Benin City is outstanding. From the moment I walked in, I was treated like royalty. My haircut was perfect, and the haircut studio has a premium feel. Will definitely be back!',
      time: '1 month ago',
    },
    {
      name: 'Chinedu Okafor',
      avatar: 'https://bbslimited.online/wp-content/uploads/2025/10/images-4.jpeg',
      rating: 4.5,
      text: 'Professional service from start to finish. The barbers really know their craft and take their time to get everything perfect. Best haircut experience in Benin City by far.',
      time: '3 weeks ago',
    },
    {
      name: 'Tunde Balogun',
      avatar: 'https://bbslimited.online/wp-content/uploads/2025/10/images-5.jpeg',
      rating: 5,
      text: "The hair treatment service changed my hair completely! I've struggled with dryness and breakage for years. After their deep conditioning treatment, my hair feels healthier and looks shinier than ever before.",
      time: '5 days ago',
    },
    {
      name: 'Hammed Bello',
      avatar: 'https://bbslimited.online/wp-content/uploads/2025/10/images-3.jpeg',
      rating: 5,
      text: 'The hair fibre replacement procedure exceeded all my expectations. Natural-looking results and the team was so professional throughout. My confidence has returned completely. Highly recommend BBS for this service!',
      time: '2 months ago',
    },
    {
      name: 'Emeka Nwosu',
      avatar: 'https://bbslimited.online/wp-content/uploads/2025/10/efffa01b942bd74e.jpeg',
      rating: 5,
      text: "I was nervous about getting hair fibre replacement, but BBS made the whole process comfortable and painless. The results look completely natural – even my family couldn't tell! Worth every investment.",
      time: '1 week ago',
    },
  ];

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroVideo}>
          <video autoPlay loop muted playsInline>
            <source src="https://bbslimited.online/wp-content/uploads/2025/07/WhatsApp-Video-2025-07-30-at-10.39.46_f8c76c0c.mp4" type="video/mp4" />
          </video>
        </div>
        <div className={styles.heroContent}>
          <h5 className={styles.heroPrefix}>NEED A HAIRCUT ?</h5>
          <h1 className={styles.heroTitle}>The Art of the Perfect Cut.</h1>
          <Link href="/book" className={styles.ctaButton}>
            BOOK NOW
          </Link>
        </div>
      </section>

      {/* Service Introduction */}
      <section className={styles.serviceIntro}>
        <div className={styles.serviceIntroContent}>
          <h3>The Barber Comes to You.</h3>
          <p>Enjoy a premium studio experience from the comfort of your home. Our expert barbers bring their skills and equipment directly to your door.</p>
        </div>
        <div className={styles.serviceGallery}>
          {serviceImages.map((img, idx) => (
            <div key={idx} className={styles.serviceImageCard}>
              <Image
                src={img.src}
                alt={img.caption}
                width={300}
                height={400}
                className={styles.serviceImage}
                unoptimized
              />
              <div className={styles.serviceCaption}>{img.caption}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What We Do */}
      <section className={styles.whatWeDo}>
        <h2><strong>What we do</strong></h2>
        <div className={styles.separator}></div>
        <p className={styles.whatWeDoText}>
          BBS Limited brings the full studio experience directly to you. Our skilled professionals provide premium haircuts and grooming services at your home or office, on your schedule.
        </p>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureVideo}>
            <video autoPlay loop muted playsInline>
              <source src="https://bbslimited.online/wp-content/uploads/2025/10/ReactNativeBlobUtilTmp_ddqyje96w0duyldas6cq8a-1.mp4" type="video/mp4" />
            </video>
          </div>
          <div className={styles.featureContent}>
            <h3>Masterful Craftsmanship.</h3>
            <p>We meticulously select and train only the most skilled and passionate barbers. Each professional on our team is dedicated to perfecting their craft and delivering a flawless look.</p>
          </div>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureVideo}>
            <video autoPlay loop muted playsInline>
              <source src="https://bbslimited.online/wp-content/uploads/2025/10/ReactNativeBlobUtilTmp_qwsk893v42c62vhgzrruj5-1.mp4" type="video/mp4" />
            </video>
          </div>
          <div className={styles.featureContent}>
            <h3><strong>Unmatched Convenience</strong></h3>
            <p>We bring the complete barbershop experience directly to you. Enjoy a premium service at your home or office, saving you time and the hassle of travel and waiting.</p>
          </div>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureVideo}>
            <video autoPlay loop muted playsInline>
              <source src="https://bbslimited.online/wp-content/uploads/2025/10/ReactNativeBlobUtilTmp_4zu8nyz8y9gs5oi1gg8tfl.mp4" type="video/mp4" />
            </video>
          </div>
          <div className={styles.featureContent}>
            <h3>A Full Suite of Services</h3>
            <p>Beyond the cut, we offer a comprehensive range of grooming services. From detailed beard trims to nourishing haircare treatments, we cater to all your styling needs.</p>
          </div>
        </div>
      </section>

      {/* Before/After Slider */}
      <section className={styles.beforeAfterSection}>
        <h2>See the Real Difference up Close.</h2>
        <div
          ref={containerRef}
          className={styles.sliderContainer}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          onClick={(e) => !isDragging && handleSliderMove(e.clientX)}
        >
          <div className={styles.beforeContainer} style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}>
            <Image
              src="https://bbslimited.online/wp-content/uploads/2025/09/bfr.jpeg"
              alt="Before"
              fill
              className={styles.sliderImage}
              unoptimized
            />
          </div>
          <div className={styles.afterContainer} style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}>
            <Image
              src="https://bbslimited.online/wp-content/uploads/2025/09/aft.jpeg"
              alt="After"
              fill
              className={styles.sliderImage}
              unoptimized
            />
          </div>
          <div className={styles.sliderLine} style={{ left: `${sliderPosition}%` }}></div>
          <div
            ref={sliderRef}
            className={styles.slider}
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            <span className={styles.sliderIcon}>↔</span>
          </div>
          <div className={styles.beforeLabel}>Before</div>
          <div className={styles.afterLabel}>After</div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats-section" className={styles.stats}>
        <div className={styles.statsHeader}>
          <h2>Our Record of Excellence</h2>
          <p>Our commitment to quality and service is reflected in our growing community of satisfied clients. Here are the numbers that show our dedication.</p>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{counters.clients}+</div>
            <div className={styles.statLabel}>Happy Clients</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{counters.barbers}+</div>
            <div className={styles.statLabel}>Expert Barbers</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{counters.satisfaction}%</div>
            <div className={styles.statLabel}><strong>Satisfaction Rate</strong></div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{counters.appointments}s</div>
            <div className={styles.statLabel}>Appointments Booked</div>
          </div>
        </div>
      </section>

      {/* Gallery Carousel */}
      <section className={styles.gallerySection}>
        <div ref={galleryRef} className={styles.galleryCarousel}>
          {galleryImages.map((img, idx) => (
            <div key={idx} className={styles.galleryItem}>
              <Image
                src={img}
                alt={`Gallery ${idx + 1}`}
                width={300}
                height={400}
                className={styles.galleryImage}
                unoptimized
              />
            </div>
          ))}
        </div>
      </section>

      {/* Partners Section */}
      <section className={styles.partners}>
        <h6>OUR PARTNERS</h6>
        <div className={styles.partnersGrid}>
          {partners.map((logo, idx) => (
            <div key={idx} className={styles.partnerLogo}>
              <Image
                src={logo}
                alt={`Partner ${idx + 1}`}
                width={150}
                height={150}
                className={styles.partnerImage}
                unoptimized
              />
            </div>
          ))}
        </div>
      </section>

      {/* Reviews Section */}
      <section className={styles.reviews}>
        <div className={styles.reviewsHeader}>
          <div className={styles.googleLogo}>
            <svg className={styles.googleIcon} viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className={styles.googleLogoText}>Reviews</span>
          </div>
          <div className={styles.ratingNumber}>4.8</div>
          <div className={styles.ratingStars}>
            {[...Array(5)].map((_, i) => (
              <span key={i} className={styles.star}>★</span>
            ))}
          </div>
          <div className={styles.reviewCount}>Based on 287 reviews</div>
        </div>
        <div className={styles.reviewsGrid}>
          {reviews.map((review, idx) => (
            <div key={idx} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewAvatar}>
                  <Image
                    src={review.avatar}
                    alt={review.name}
                    width={40}
                    height={40}
                    className={styles.avatarImage}
                    unoptimized
                  />
                </div>
                <div className={styles.reviewInfo}>
                  <div className={styles.reviewName}>{review.name}</div>
                  <div className={styles.reviewStarsSmall}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.floor(review.rating) ? styles.starFilled : i < review.rating ? styles.starHalf : styles.starEmpty}>
                        {i < Math.floor(review.rating) ? '★' : i < review.rating ? '☆' : '☆'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <p className={styles.reviewText}>{review.text}</p>
              <div className={styles.reviewMeta}>
                <span>{review.time}</span>
                <span>•</span>
                <span className={styles.verifiedBadge}>
                  <span className={styles.verifiedIcon}>✓</span>
                  Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCTA}>
        <span className={styles.ctaPrefix}>READY FOR A NEW LOOK?</span>
        <h2>Book an appointment with us and experience the ultimate in convenience and style.</h2>
        <Link href="/book" className={styles.ctaButton}>
          BOOK NOW
        </Link>
      </section>
    </div>
  );
}
