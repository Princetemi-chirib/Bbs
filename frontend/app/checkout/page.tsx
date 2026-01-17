'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { emailApi } from '@/lib/api';
import styles from './page.module.css';

// Dynamically import Paystack to avoid SSR issues with window object
let usePaystackPayment: any;
if (typeof window !== 'undefined') {
  const paystack = require('react-paystack');
  usePaystackPayment = paystack.usePaystackPayment;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  location: string;
  additionalNotes: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, getTotal, loadFromStorage } = useCartStore();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    location: '',
    additionalNotes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInfo, string>>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const total = getTotal();

  useEffect(() => {
    loadFromStorage();
    if (items.length === 0) {
      router.push('/book');
    }
  }, [items.length, router, loadFromStorage]);

  // Paystack public key - get from Paystack Dashboard → Settings → API Keys
  // Test key format: pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
  // Live key format: pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_your_public_key_here';

  // Only initialize Paystack on client side
  const initializePayment = typeof window !== 'undefined' && usePaystackPayment
    ? usePaystackPayment({ publicKey })
    : null;

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerInfo, string>> = {};

    if (!customerInfo.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!customerInfo.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!customerInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10,15}$/.test(customerInfo.phone.replace(/[-\s]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!customerInfo.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!customerInfo.location.trim()) {
      newErrors.location = 'Service location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    // Check if Paystack is available
    if (!initializePayment) {
      alert('Payment system is not available. Please refresh the page.');
      setIsProcessing(false);
      return;
    }

    // Initialize Paystack payment
    const config = {
      reference: new Date().getTime().toString(),
      email: customerInfo.email,
      amount: total * 100, // Convert to kobo (Paystack uses kobo)
      metadata: {
        custom_fields: [
          {
            display_name: 'Customer Name',
            variable_name: 'customer_name',
            value: `${customerInfo.firstName} ${customerInfo.lastName}`,
          },
          {
            display_name: 'Phone',
            variable_name: 'phone',
            value: customerInfo.phone,
          },
          {
            display_name: 'City',
            variable_name: 'city',
            value: customerInfo.city,
          },
          {
            display_name: 'Location',
            variable_name: 'location',
            value: customerInfo.location,
          },
          {
            display_name: 'Services',
            variable_name: 'services',
            value: items.map(item => `${item.title} (${item.quantity}x)`).join(', '),
          },
        ],
      },
      onSuccess: async (response: any) => {
        console.log('Payment successful:', response);
        setIsProcessing(false);
        
        // Send order confirmation email
        try {
          const orderReference = `ORD-${Date.now()}`;
          await emailApi.sendOrderConfirmation({
            customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
            customerEmail: customerInfo.email,
            orderReference,
            items: items.map(item => ({
              title: item.title,
              quantity: item.quantity,
              price: item.price,
              displayAge: item.displayAge !== 'Fixed' ? item.displayAge : undefined,
            })),
            total,
            city: customerInfo.city,
            location: customerInfo.location,
            address: customerInfo.address || undefined,
            phone: customerInfo.phone,
            paymentReference: response.reference,
          });
          console.log('Order confirmation email sent');
        } catch (error) {
          console.error('Failed to send order confirmation email:', error);
          // Don't block the user if email fails
        }
        
        // Clear cart and redirect to success page
        clearCart();
        router.push(`/checkout/success?reference=${response.reference}`);
      },
      onClose: () => {
        setIsProcessing(false);
        console.log('Payment closed');
      },
    };

    initializePayment(config);
  };

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (items.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Checkout</h1>
          <p>Complete your booking information</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.checkoutForm}>
          <div className={styles.formLayout}>
            {/* Customer Information */}
            <div className={styles.formSection}>
              <h2>Customer Information</h2>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    value={customerInfo.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={errors.firstName ? styles.inputError : ''}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <span className={styles.errorMessage}>{errors.firstName}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    value={customerInfo.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={errors.lastName ? styles.inputError : ''}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <span className={styles.errorMessage}>{errors.lastName}</span>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  value={customerInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? styles.inputError : ''}
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <span className={styles.errorMessage}>{errors.email}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  value={customerInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? styles.inputError : ''}
                  placeholder="08012345678"
                />
                {errors.phone && (
                  <span className={styles.errorMessage}>{errors.phone}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="city">City *</label>
                <select
                  id="city"
                  value={customerInfo.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={errors.city ? styles.inputError : ''}
                >
                  <option value="">Select a city</option>
                  <option value="lagos">Lagos</option>
                  <option value="abuja">Abuja</option>
                  <option value="warri">Warri</option>
                  <option value="other">Other</option>
                </select>
                {errors.city && (
                  <span className={styles.errorMessage}>{errors.city}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="location">Service Location *</label>
                <input
                  type="text"
                  id="location"
                  value={customerInfo.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={errors.location ? styles.inputError : ''}
                  placeholder="e.g., Victoria Island, Lekki Phase 1"
                />
                {errors.location && (
                  <span className={styles.errorMessage}>{errors.location}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="address">Full Address (Optional)</label>
                <input
                  type="text"
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="House number, street name"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="additionalNotes">Additional Notes (Optional)</label>
                <textarea
                  id="additionalNotes"
                  value={customerInfo.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  rows={4}
                  placeholder="Any special instructions or preferences..."
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className={styles.orderSummary}>
              <h2>Order Summary</h2>
              <div className={styles.summaryItems}>
                {items.map((item) => (
                  <div key={item.key} className={styles.summaryItem}>
                    <div className={styles.summaryItemInfo}>
                      <h4>{item.title}</h4>
                      {item.displayAge !== 'Fixed' && (
                        <span className={styles.summaryItemAge}>{item.displayAge}</span>
                      )}
                      <span className={styles.summaryItemQuantity}>Qty: {item.quantity}</span>
                    </div>
                    <div className={styles.summaryItemPrice}>
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.summaryTotal}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>₦{total.toLocaleString()}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Service Charge</span>
                  <span>₦0</span>
                </div>
                <div className={`${styles.totalRow} ${styles.finalTotal}`}>
                  <span>Total</span>
                  <span>₦{total.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                className={styles.payButton}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Pay ₦${total.toLocaleString()}`}
              </button>

              <p className={styles.securePaymentNote}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Secure payment powered by Paystack
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
