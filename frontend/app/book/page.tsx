'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore, OrderItem } from '@/lib/store/cartStore';
import styles from './page.module.css';

interface Service {
  id: number;
  title: string;
  description: string;
  adultPrice: number;
  kidsPrice: number | null;
  category: 'general' | 'recovery';
  beforeImage: string;
  afterImage: string;
}

// OrderItem is imported from cartStore

// Services data - using available images
const services: Service[] = [
  {
    id: 1,
    title: 'Classic Haircut / Beardcut Services',
    description: 'Professional precision cuts tailored to your face shape and personal style preferences.',
    adultPrice: 12000,
    kidsPrice: 6000,
    category: 'general',
    beforeImage: '/images/Gemini_Generated_Image_gmkfwrgmkfwrgmkf.png',
    afterImage: '/images/948b11e05545c9d37cfd9068465b3fe6.jpg',
  },
  {
    id: 2,
    title: 'Dreadlock Service',
    description: 'Professional dreadlock installation, maintenance, and styling for authentic looks.',
    adultPrice: 32000,
    kidsPrice: 20000,
    category: 'general',
    beforeImage: '/images/Gemini_Generated_Image_xg78zjxg78zjxg78.png',
    afterImage: '/images/locks1.jpg',
  },
  {
    id: 3,
    title: 'Dreadlocks Maintenance Service',
    description: 'Comprehensive maintenance for existing hairstyles and treatments.',
    adultPrice: 17000,
    kidsPrice: 11500,
    category: 'general',
    beforeImage: '/images/Gemini_Generated_Image_75j3pr75j3pr75j3.png',
    afterImage: '/images/locks1.jpg',
  },
  {
    id: 4,
    title: 'Hair Growth / Hair-care Treatment Service',
    description: 'Deep conditioning and scalp treatments to restore health and natural shine.',
    adultPrice: 8500,
    kidsPrice: 5000,
    category: 'general',
    beforeImage: '/images/Gemini_Generated_Image_7ncfyr7ncfyr7ncf.png',
    afterImage: '/images/Gemini_Generated_Image_7srl7l7srl7l7srl.png',
  },
  {
    id: 5,
    title: 'Hair Braiding Service',
    description: 'Creative and traditional braiding styles crafted with precision and artistry.',
    adultPrice: 16500,
    kidsPrice: 10000,
    category: 'general',
    beforeImage: '/images/Gemini_Generated_Image_14n0uy14n0uy14n0.png',
    afterImage: '/images/Hair braiding service.jpg',
  },
  {
    id: 6,
    title: 'Hair Tinting Service',
    description: 'Professional hair coloring and tinting services for a vibrant new look.',
    adultPrice: 18500,
    kidsPrice: 12000,
    category: 'general',
    beforeImage: '/images/Gemini_Generated_Image_i5apbvi5apbvi5ap.png',
    afterImage: '/images/hair tinting.jpg',
  },
  {
    id: 7,
    title: 'Nailcut Service',
    description: 'Complete nail grooming service including cutting, shaping, and cuticle care.',
    adultPrice: 10000,
    kidsPrice: 5000,
    category: 'general',
    beforeImage: '/images/Gemini_Generated_Image_fg5jiifg5jiifg5j.png',
    afterImage: '/images/nailcut service.jpg',
  },
  {
    id: 8,
    title: 'Shaving Service',
    description: 'Professional shaving service with premium grooming techniques for a smooth, comfortable experience.',
    adultPrice: 5500,
    kidsPrice: 5500,
    category: 'general',
    beforeImage: '/images/Gemini_Generated_Image_387fbi387fbi387f.png',
    afterImage: '/images/278a2b3cf825ba6c793eb3dc2b0374b3.jpg',
  },
  {
    id: 9,
    title: '1 Month Hair Loss Recovery Plan',
    description: 'Comprehensive 1-month manual hair loss recovery treatment with guaranteed results.',
    adultPrice: 30000,
    kidsPrice: 30000,
    category: 'recovery',
    beforeImage: '/images/loss 1.jpg',
    afterImage: '/images/Gemini_Generated_Image_tw4lxvtw4lxvtw4l.png',
  },
  {
    id: 10,
    title: '2 Month Hair Loss Recovery Plan',
    description: 'Extended 2-month manual hair loss recovery treatment with guaranteed results.',
    adultPrice: 55000,
    kidsPrice: 55000,
    category: 'recovery',
    beforeImage: '/images/loss 1.jpg',
    afterImage: '/images/Gemini_Generated_Image_tw4lxvtw4lxvtw4l.png',
  },
  {
    id: 11,
    title: '3 Month Hair Loss Recovery Plan',
    description: 'Comprehensive 3-month manual hair loss recovery treatment with guaranteed results.',
    adultPrice: 80000,
    kidsPrice: 80000,
    category: 'recovery',
    beforeImage: '/images/loss 1.jpg',
    afterImage: '/images/Gemini_Generated_Image_tw4lxvtw4lxvtw4l.png',
  },
  {
    id: 12,
    title: 'Original Hairpiece Fibre Installation',
    description: 'Professional hairpiece fibre installation for natural-looking hair restoration.',
    adultPrice: 50000,
    kidsPrice: 50000,
    category: 'recovery',
    beforeImage: '/images/bf.jpg',
    afterImage: '/images/bfr.jpeg',
  },
  {
    id: 13,
    title: 'Original Hairpiece Wig Installation',
    description: 'Original Premium hairpiece wig installation service for complete hair transformation.',
    adultPrice: 180000,
    kidsPrice: 180000,
    category: 'recovery',
    beforeImage: '/images/Gemini_Generated_Image_gua5xogua5xogua5.png',
    afterImage: '/images/unnamed.png',
  },
  {
    id: 14,
    title: 'Original Hairpiece Replacement Installation',
    description: 'Advanced hair replacement installation for permanent hair restoration solutions.',
    adultPrice: 30000,
    kidsPrice: 30000,
    category: 'recovery',
    beforeImage: '/images/aft.jpeg',
    afterImage: '/images/bfr.jpeg',
  },
  {
    id: 15,
    title: 'Hairpiece Installation Maintenance',
    description: 'Professional maintenance service for existing artificial hair installations.',
    adultPrice: 15000,
    kidsPrice: 15000,
    category: 'recovery',
    beforeImage: '/images/unnamed.png',
    afterImage: '/images/Gemini_Generated_Image_gua5xogua5xogua5.png',
  },
];

function BeforeAfterSlider({ beforeImage, afterImage }: { beforeImage: string; afterImage: string }) {
  const [splitPosition, setSplitPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSplitPosition(percentage);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSplitPosition(percentage);
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.ba-handle')) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSplitPosition(percentage);
  };

  return (
    <div
      ref={containerRef}
      className={styles.baContainer}
      style={{ '--split-position': `${splitPosition}%` } as React.CSSProperties}
      onClick={handleClick}
    >
      <div className={`${styles.baLayer} ${styles.baBefore}`}>
        <Image src={beforeImage} alt="Before" fill className={styles.baImage} sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      <div className={`${styles.baLayer} ${styles.baAfter}`}>
        <Image src={afterImage} alt="After" fill className={styles.baImage} sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      <div
        className={styles.baSliderLine}
        style={{ left: `${splitPosition}%` }}
      />
      <div
        className={styles.baHandle}
        style={{ left: `${splitPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        aria-label="Slide to compare"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M8 12h8M12 8l4 4-4 4" />
        </svg>
      </div>
      <div className={`${styles.baLabel} ${styles.beforeLabel}`}>Before</div>
      <div className={`${styles.baLabel} ${styles.afterLabel}`}>After</div>
    </div>
  );
}

export default function BookPage() {
  const router = useRouter();
  const { items: order, addItem, loadFromStorage } = useCartStore();
  const [currentFilter, setCurrentFilter] = useState<'all' | 'general' | 'recovery'>('all');
  const [selectedAges, setSelectedAges] = useState<Record<number, 'adult' | 'kids'>>({});
  const [notification, setNotification] = useState<{ show: boolean; message: string; serviceName?: string }>({
    show: false,
    message: '',
  });

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const filteredServices = currentFilter === 'all'
    ? services
    : services.filter(service => service.category === currentFilter);

  const showNotification = (message: string, serviceName?: string) => {
    setNotification({ show: true, message, serviceName });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const addToOrder = (service: Service, ageGroup?: 'adult' | 'kids') => {
    if (!ageGroup && service.kidsPrice !== null && service.adultPrice !== service.kidsPrice) {
      return; // Age group must be selected
    }

    const finalAgeGroup = ageGroup || (service.kidsPrice === null || service.adultPrice === service.kidsPrice ? 'fixed' : 'adult');
    const price = finalAgeGroup === 'kids' && service.kidsPrice ? service.kidsPrice : service.adultPrice;
    const displayAge = finalAgeGroup === 'fixed' ? 'Fixed' : finalAgeGroup === 'adult' ? 'Adult' : 'Kids';
    const key = `${service.id}-${finalAgeGroup}`;

    const existingItem = order.find(item => item.key === key);
    if (existingItem) {
      showNotification(`${service.title} quantity updated!`, service.title);
      // Update quantity by adding a new item (store will handle merging)
      addItem({ ...service, key, ageGroup: finalAgeGroup, displayAge, price, quantity: 1 } as OrderItem);
    } else {
      showNotification(`${service.title} added to your order!`, service.title);
      addItem({ ...service, key, ageGroup: finalAgeGroup, displayAge, price, quantity: 1 } as OrderItem);
    }
  };

  const total = order.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const selectAge = (serviceId: number, ageGroup: 'adult' | 'kids') => {
    setSelectedAges(prev => ({ ...prev, [serviceId]: ageGroup }));
  };

  return (
    <>
      {/* Notification Popup */}
      {notification.show && (
        <div className={styles.notificationPopup}>
          <div className={styles.notificationContent}>
            <div className={styles.notificationIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className={styles.notificationText}>
              <div className={styles.notificationTitle}>Service Added!</div>
              <div className={styles.notificationMessage}>{notification.message}</div>
            </div>
            <div className={styles.notificationActions}>
              <button
                className={styles.goToCartButton}
                onClick={() => {
                  setNotification(prev => ({ ...prev, show: false }));
                  router.push('/cart');
                }}
              >
                Go to Cart
              </button>
              <button
                className={styles.notificationClose}
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                aria-label="Close notification"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <section className={styles.heroHeader}>
        <div className={styles.container}>
          <h1>Our Premium Services</h1>
          <p>Experience the finest in traditional barbering with modern sophistication</p>
        </div>
      </section>

      {/* Services Section */}
      <section className={styles.servicesSection}>
        <div className={styles.container}>
          {/* Category Filter */}
          <div className={styles.categoryFilter}>
            <button
              className={`${styles.filterButton} ${currentFilter === 'all' ? styles.active : ''}`}
              onClick={() => setCurrentFilter('all')}
            >
              All Services
            </button>
            <button
              className={`${styles.filterButton} ${currentFilter === 'general' ? styles.active : ''}`}
              onClick={() => setCurrentFilter('general')}
            >
              General Services
            </button>
            <button
              className={`${styles.filterButton} ${currentFilter === 'recovery' ? styles.active : ''}`}
              onClick={() => setCurrentFilter('recovery')}
            >
              Hair Loss Recovery
            </button>
          </div>

          <div className={styles.orderContainer}>
            {/* Services Grid */}
            <div className={styles.servicesGrid}>
              {filteredServices.map(service => {
                const hasDifferentPrices = service.kidsPrice !== null && service.adultPrice !== service.kidsPrice;
                const selectedAge = selectedAges[service.id];
                const canAddToOrder = !hasDifferentPrices || selectedAge;

                return (
                  <div key={service.id} className={styles.serviceCard}>
                    <div className={styles.serviceImage}>
                      <BeforeAfterSlider
                        beforeImage={service.beforeImage}
                        afterImage={service.afterImage}
                      />
                    </div>
                    <div className={styles.serviceContent}>
                      <h3 className={styles.serviceTitle}>{service.title}</h3>
                      <p className={styles.serviceDescription}>{service.description}</p>

                      {hasDifferentPrices ? (
                        <>
                          <div className={styles.servicePricing}>
                            <div className={styles.priceInfo}>
                              <div className={styles.priceLabel}>Kids</div>
                              <div className={styles.priceValue}>₦{service.kidsPrice!.toLocaleString()}</div>
                            </div>
                            <div className={styles.priceInfo}>
                              <div className={styles.priceLabel}>Adult</div>
                              <div className={styles.priceValue}>₦{service.adultPrice.toLocaleString()}</div>
                            </div>
                          </div>

                          <div className={styles.ageSelection}>
                            <button
                              className={`${styles.ageOption} ${selectedAge === 'kids' ? styles.selected : ''}`}
                              onClick={() => selectAge(service.id, 'kids')}
                            >
                              Kids - ₦{service.kidsPrice!.toLocaleString()}
                            </button>
                            <button
                              className={`${styles.ageOption} ${selectedAge === 'adult' ? styles.selected : ''}`}
                              onClick={() => selectAge(service.id, 'adult')}
                            >
                              Adult - ₦{service.adultPrice.toLocaleString()}
                            </button>
                          </div>

                          {selectedAge && (
                            <div className={styles.selectedPrice}>
                              Selected: {selectedAge === 'adult' ? 'Adult' : 'Kids'} - ₦
                              {(selectedAge === 'adult' ? service.adultPrice : service.kidsPrice!).toLocaleString()}
                            </div>
                          )}

                          <button
                            className={styles.bookButton}
                            onClick={() => canAddToOrder && addToOrder(service, selectedAge)}
                            disabled={!canAddToOrder}
                          >
                            {canAddToOrder ? 'Add to Order' : 'Select kids or Adult'}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className={styles.selectedPrice}>
                            Price: ₦{service.adultPrice.toLocaleString()}
                          </div>
                          <button
                            className={styles.bookButton}
                            onClick={() => addToOrder(service)}
                          >
                            Add to Order
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className={styles.orderSummary}>
              <h3>Your Order</h3>
              <div className={styles.orderItems}>
                {order.length === 0 ? (
                  <div className={styles.emptyOrder}>
                    <h4>No services selected</h4>
                    <p>Choose from our premium services to get started</p>
                  </div>
                ) : (
                  <>
                    {order.map(item => (
                      <div key={item.key} className={styles.orderItem}>
                        <div className={styles.itemDetails}>
                          <div className={styles.itemName}>
                            {item.title} {item.displayAge !== 'Fixed' ? `(${item.displayAge})` : ''}
                          </div>
                          <div className={styles.quantityControls}>
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <div className={styles.itemPrice}>
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                    <div className={`${styles.orderItem} ${styles.totalItem}`}>
                      <div className={styles.itemName}>Total</div>
                      <div className={styles.itemPrice}>₦{total.toLocaleString()}</div>
                    </div>
                  </>
                )}
              </div>
              <button
                className={styles.checkoutButton}
                disabled={order.length === 0}
                onClick={() => {
                  if (order.length > 0) {
                    router.push('/cart');
                  }
                }}
              >
                View Cart & Checkout
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
