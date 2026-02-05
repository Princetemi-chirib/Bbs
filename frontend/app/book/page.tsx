'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, OrderItem } from '@/lib/store/cartStore';
import { productApi } from '@/lib/api';
import { getSlotsLeftForToday } from '@/lib/utils';
import styles from './page.module.css';

interface Service {
  id: string;
  title: string;
  description: string;
  adultPrice: number;
  kidsPrice: number | null;
  category: 'general' | 'recovery';
  beforeImage: string;
  afterImage: string;
}

function BeforeAfterSlider({ beforeImage, afterImage }: { beforeImage: string; afterImage: string }) {
  const [splitPosition, setSplitPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const update = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let x = clientX - rect.left;
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;
    const pct = rect.width > 0 ? (x / rect.width) * 100 : 50;
    setSplitPosition(pct);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      update(e.clientX);
    };
    const onMouseUp = () => {
      isDragging.current = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      update(e.touches[0].clientX);
    };
    const onTouchEnd = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const onHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
  };

  const onHandleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
  };

  const onContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as Node;
    if (handleRef.current && (target === handleRef.current || handleRef.current.contains(target))) return;
    if (!containerRef.current) return;
    update(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      className={styles.baContainer}
      style={{ '--split-position': `${splitPosition}%` } as React.CSSProperties}
      onClick={onContainerClick}
    >
      <div className={`${styles.baLayer} ${styles.baBefore}`}>
        <img src={beforeImage} alt="Before" className={styles.baImage} loading="lazy" />
      </div>
      <div className={`${styles.baLayer} ${styles.baAfter}`}>
        <img src={afterImage} alt="After" className={styles.baImage} loading="lazy" />
      </div>
      <div className={styles.baSliderLine} aria-hidden="true" />
      <div
        ref={handleRef}
        className={styles.baHandle}
        onMouseDown={onHandleMouseDown}
        onTouchStart={onHandleTouchStart}
        aria-label="Slide to compare"
      />
      <div className={`${styles.baLabel} ${styles.beforeLabel}`}>Before</div>
      <div className={`${styles.baLabel} ${styles.afterLabel}`}>After</div>
    </div>
  );
}

export default function BookPage() {
  const router = useRouter();
  const { items: order, addItem, loadFromStorage } = useCartStore();
  const [currentFilter, setCurrentFilter] = useState<'all' | 'general' | 'recovery'>('all');
  const [selectedAges, setSelectedAges] = useState<Record<string, 'adult' | 'kids'>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ show: boolean; message: string; serviceName?: string }>({
    show: false,
    message: '',
  });

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const category = currentFilter === 'all' ? undefined : currentFilter;
        const response = await productApi.getAll(category);
        if (response.success) {
          setServices(response.data || []);
        } else {
          setError('Failed to load products');
        }
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentFilter]);

  const filteredServices = services;

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
    
    // Convert service id to string for cart store compatibility
    const serviceForCart = { ...service, id: String(service.id) } as any;

    const existingItem = order.find(item => item.key === key);
    if (existingItem) {
      showNotification(`${service.title} quantity updated!`, service.title);
      // Update quantity by adding a new item (store will handle merging)
      addItem({ ...serviceForCart, key, ageGroup: finalAgeGroup, displayAge, price, quantity: 1, productId: service.id } as OrderItem);
    } else {
      showNotification(`${service.title} added to your order!`, service.title);
      addItem({ ...serviceForCart, key, ageGroup: finalAgeGroup, displayAge, price, quantity: 1, productId: service.id } as OrderItem);
    }
  };

  const total = order.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const selectAge = (serviceId: string, ageGroup: 'adult' | 'kids') => {
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
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-primary)' }}>
                <p>Loading products...</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#b00020' }}>
                <p>Error: {error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  style={{ marginTop: '16px', padding: '10px 20px', cursor: 'pointer' }}
                >
                  Retry
                </button>
              </div>
            ) : (
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
                      <div className={styles.serviceTitleRow}>
                        <h3 className={styles.serviceTitle}>{service.title}</h3>
                        <span className={styles.slotsBadge} aria-label="Slots remaining today">{getSlotsLeftForToday(String(service.id))} left for today</span>
                      </div>
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
            )}

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
