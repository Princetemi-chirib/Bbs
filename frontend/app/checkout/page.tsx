'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { emailApi, orderApi } from '@/lib/api';
import styles from './page.module.css';

// Dynamically import Paystack to avoid SSR issues with window object
let usePaystackPayment: any;
if (typeof window !== 'undefined') {
  try {
    const paystack = require('react-paystack');
    usePaystackPayment = paystack.usePaystackPayment;
    if (!usePaystackPayment) {
      console.error('react-paystack module not loaded correctly');
    }
  } catch (error) {
    console.error('Failed to load react-paystack:', error);
  }
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  state: string;
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
    state: '',
    city: '',
    location: '',
    additionalNotes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInfo, string>>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<Record<string, string[]>>({});
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [cartLoaded, setCartLoaded] = useState(false);

  const total = getTotal();

  // Fetch available locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/v1/locations');
        const data = await response.json();
        if (data.success) {
          setAvailableLocations(data.data.locations || {});
          setAvailableStates(data.data.states || []);
        }
      } catch (err) {
        console.error('Failed to load locations:', err);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    // Load cart from localStorage first
    loadFromStorage();
    setCartLoaded(true);
  }, [loadFromStorage]);

  // Check if cart is empty after it's loaded from storage
  useEffect(() => {
    if (cartLoaded && items.length === 0) {
      router.push('/book');
    }
  }, [cartLoaded, items.length, router]);

  // Paystack public key - get from Paystack Dashboard → Settings → API Keys
  // Test key format: pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
  // Live key format: pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
  // Get key directly (env vars are available at build time)
  const publicKeyEnv = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
  const publicKey = publicKeyEnv.trim();
  
  // Validate the key
  const isPaystackConfigured = publicKey && 
                               publicKey !== 'pk_test_your_public_key_here' && 
                               publicKey.startsWith('pk_') &&
                               publicKey.length > 20; // Paystack keys are longer than 20 chars

  // Debug log on mount
  useEffect(() => {
    console.log('🔍 Paystack Public Key Check:', {
      hasKey: !!publicKey,
      keyLength: publicKey.length,
      keyPrefix: publicKey ? publicKey.substring(0, 20) + '...' : 'N/A',
      startsWithPk: publicKey.startsWith('pk_'),
      isConfigured: isPaystackConfigured,
      fullEnvCheck: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ? 'Found' : 'Missing',
    });
    
    if (!isPaystackConfigured && typeof window !== 'undefined') {
      console.error('❌ Paystack not configured. Please set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in .env.local');
    }
  }, [publicKey, isPaystackConfigured]);

  // Initialize Paystack hook (must be called at top level, hooks can't be conditional)
  // IMPORTANT: React hooks must be called unconditionally
  // Component is 'use client' so this only runs on client side
  // If usePaystackPayment is not loaded, we'll get null but hook will still be called if it exists
  const initializePayment = usePaystackPayment 
    ? usePaystackPayment({ 
        publicKey: (publicKey && isPaystackConfigured) 
          ? publicKey 
          : 'pk_test_000000000000000000000000000000000000000000000000000000' // Fallback for hook initialization
      })
    : null;
  
  // Only allow payment if everything is configured correctly
  const canInitializePayment = isPaystackConfigured && publicKey && initializePayment && typeof initializePayment === 'function';

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
    if (!customerInfo.state.trim()) {
      newErrors.state = 'State is required';
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
    if (!canInitializePayment || !initializePayment) {
      console.error('Paystack initialization failed:', {
        canInitializePayment,
        initializePayment: !!initializePayment,
        isPaystackConfigured,
        publicKey: publicKey ? publicKey.substring(0, 20) + '...' : 'missing'
      });
      if (!isPaystackConfigured) {
        alert('Payment is not configured. Please check your Paystack public key in the environment variables.');
      } else {
        alert('Payment system is not available. Please refresh the page.');
      }
      setIsProcessing(false);
      return;
    }

    console.log('Initializing Paystack payment with key:', publicKey.substring(0, 20) + '...');

    // Validate amount (minimum is 100 kobo = 1 NGN)
    // Paystack requires amount as string in kobo (smallest currency unit)
    const amountInKobo = Math.round(total * 100);
    if (amountInKobo < 100) {
      alert('Minimum payment amount is ₦1.00');
      setIsProcessing(false);
      return;
    }
    
    console.log('Amount validation:', {
      totalNGN: total,
      amountInKobo,
      amountAsString: amountInKobo.toString(),
    });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      alert('Please enter a valid email address');
      setIsProcessing(false);
      return;
    }

    // Initialize Paystack payment
    // Note: react-paystack v6 format - the initializePayment function expects:
    // { onSuccess, onClose, config: { email, amount, reference, metadata, ... } }
    const paymentConfig = {
      reference: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      email: customerInfo.email.trim().toLowerCase(),
      amount: Math.floor(amountInKobo), // Amount as number in kobo
      // Simplify metadata - only include if values are valid
      metadata: (() => {
        const fields: any[] = [];
        
        const customerName = `${customerInfo.firstName} ${customerInfo.lastName}`.trim();
        if (customerName) {
          fields.push({
            display_name: 'Customer Name',
            variable_name: 'customer_name',
            value: customerName.substring(0, 100),
          });
        }
        
        if (customerInfo.phone.trim()) {
          fields.push({
            display_name: 'Phone',
            variable_name: 'phone',
            value: customerInfo.phone.trim().substring(0, 20),
          });
        }
        
        if (customerInfo.city.trim()) {
          fields.push({
            display_name: 'City',
            variable_name: 'city',
            value: customerInfo.city.trim().substring(0, 100),
          });
        }
        
        if (customerInfo.location.trim()) {
          fields.push({
            display_name: 'Location',
            variable_name: 'location',
            value: customerInfo.location.trim().substring(0, 100),
          });
        }
        
        const servicesStr = items.map(item => `${item.title} (${item.quantity}x)`).join(', ');
        if (servicesStr) {
          fields.push({
            display_name: 'Services',
            variable_name: 'services',
            value: servicesStr.substring(0, 500),
          });
        }
        
        return fields.length > 0 ? { custom_fields: fields } : {};
      })(),
    };

    // Prepare callbacks
    const onSuccess = async (response: any) => {
        console.log('Payment successful:', response);
        setIsProcessing(false);
        
        try {
          // Save order to database
          const orderData = {
            customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            state: customerInfo.state,
            city: customerInfo.city,
            location: customerInfo.location,
            address: customerInfo.address || undefined,
            additionalNotes: customerInfo.additionalNotes || undefined,
            items: items.map(item => ({
              productId: item.productId || item.id?.toString() || '',
              title: item.title,
              quantity: item.quantity,
              ageGroup: item.ageGroup || 'fixed',
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
            })),
            totalAmount: total,
            paymentReference: response.reference,
            paymentMethod: 'paystack',
          };

          const orderResponse = await orderApi.create(orderData);
          const orderNumber = orderResponse.data?.orderNumber || `ORD-${Date.now()}`;
          
          console.log('Order saved to database:', orderResponse);
          
          // Send order confirmation email
          try {
            await emailApi.sendOrderConfirmation({
              customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
              customerEmail: customerInfo.email,
              orderReference: orderNumber,
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
          router.push(`/checkout/success?reference=${response.reference}&order=${orderNumber}`);
        } catch (error: any) {
          console.error('Failed to save order:', error);
          // Still redirect even if order save fails (payment was successful)
          clearCart();
          router.push(`/checkout/success?reference=${response.reference}`);
        }
    };

    const onClose = () => {
      setIsProcessing(false);
      console.log('Payment closed');
    };

    // Validate config before calling Paystack
    console.log('🔍 Paystack Payment Config Validation:', {
      email: paymentConfig.email,
      emailValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentConfig.email),
      amount: paymentConfig.amount,
      amountInNGN: (paymentConfig.amount / 100).toFixed(2),
      amountValid: paymentConfig.amount >= 100 && Number.isInteger(paymentConfig.amount),
      reference: paymentConfig.reference,
      referenceValid: !!paymentConfig.reference && paymentConfig.reference.length > 0,
      publicKeyPrefix: publicKey.substring(0, 20) + '...',
      hasMetadata: !!paymentConfig.metadata,
      metadataFields: paymentConfig.metadata?.custom_fields?.length || 0,
      hasOnSuccess: typeof onSuccess === 'function',
      hasOnClose: typeof onClose === 'function',
    });
    console.log('📦 Payment Config Object:', JSON.stringify(paymentConfig, null, 2));

    // Validate all required fields
    if (!paymentConfig.email || !paymentConfig.amount || !paymentConfig.reference) {
      alert('Missing required payment information. Please check your form.');
      setIsProcessing(false);
      return;
    }

    try {
      console.log('🚀 About to call initializePayment:', {
        type: typeof initializePayment,
        isFunction: typeof initializePayment === 'function',
        isNull: initializePayment === null,
        isUndefined: initializePayment === undefined,
        configKeys: Object.keys(paymentConfig),
        publicKeyConfigured: isPaystackConfigured,
        publicKeyLength: publicKey.length,
      });
      
      if (!initializePayment || typeof initializePayment !== 'function') {
        console.error('❌ Payment function unavailable:', {
          initializePayment,
          isPaystackConfigured,
          publicKeyExists: !!publicKey,
          usePaystackPaymentExists: !!usePaystackPayment,
          windowExists: typeof window !== 'undefined',
        });
        throw new Error('Payment function not available. Please refresh the page.');
      }
      
      // react-paystack v6 expects: initializePayment({ onSuccess, onClose, config })
      console.log('✅ Calling initializePayment with correct structure...');
      initializePayment({
        onSuccess,
        onClose,
        config: paymentConfig,
      });
      console.log('✅ Payment initialization called successfully - Paystack modal should open');
    } catch (error: any) {
      console.error('Error initializing payment:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        issues: error?.issues, // Paystack validation issues array
        stack: error?.stack,
        name: error?.name,
        toString: String(error),
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });
      
      // Try to extract and log all error properties
      console.error('❌ Complete Error Object:', error);
      console.error('❌ Error Keys:', Object.keys(error || {}));
      if (error?.issues) {
        console.error('❌ Issues Array:', JSON.stringify(error.issues, null, 2));
      }
      
      // Log each validation issue if available
      if (error?.issues && Array.isArray(error.issues)) {
        console.error('❌ Paystack Validation Issues:');
        error.issues.forEach((issue: any, index: number) => {
          console.error(`❌ Issue ${index + 1}:`, JSON.stringify(issue, null, 2));
          console.error(`   - Message: ${issue?.message || issue?.msg || 'Unknown'}`);
          console.error(`   - Field: ${issue?.field || issue?.param || 'Unknown'}`);
          console.error(`   - Full:`, issue);
        });
      }
      setIsProcessing(false);
      
      // More specific error messages
      let errorMessage = 'Failed to initialize payment. ';
      const errorStr = error?.message || String(error) || 'Unknown error';
      
      if (errorStr.includes('Invalid transaction parameters')) {
        errorMessage += 'Please check that all form fields are filled correctly and the amount is valid (minimum ₦1.00).';
        console.error('Invalid parameters - Payment Config was:', paymentConfig);
      } else if (errorStr) {
        errorMessage += errorStr;
      } else {
        errorMessage += 'Please refresh the page and try again.';
      }
      
      alert(errorMessage);
    }
  };

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    // If state changes, reset city and location
    if (field === 'state') {
      setCustomerInfo((prev) => ({ ...prev, [field]: value, city: '', location: '' }));
    } else {
      setCustomerInfo((prev) => ({ ...prev, [field]: value }));
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Get cities for selected state
  const availableCities = customerInfo.state ? (availableLocations[customerInfo.state] || []) : [];

  // Show loading state while cart is being loaded
  if (!cartLoaded) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.container}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if cart is empty after loading
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
                <label htmlFor="state">State *</label>
                <select
                  id="state"
                  value={customerInfo.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={errors.state ? styles.inputError : ''}
                  disabled={loadingLocations || availableStates.length === 0}
                >
                  <option value="">Select a state</option>
                  {availableStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <span className={styles.errorMessage}>{errors.state}</span>
                )}
                {loadingLocations && (
                  <span className={styles.helpText}>Loading available locations...</span>
                )}
                {!loadingLocations && availableStates.length === 0 && (
                  <span className={styles.helpText} style={{ color: '#dc3232' }}>
                    No barbers available in any location. Please contact support.
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="city">City *</label>
                <select
                  id="city"
                  value={customerInfo.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={errors.city ? styles.inputError : ''}
                  disabled={!customerInfo.state || availableCities.length === 0}
                >
                  <option value="">Select a city</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <span className={styles.errorMessage}>{errors.city}</span>
                )}
                {customerInfo.state && availableCities.length === 0 && (
                  <span className={styles.helpText} style={{ color: '#dc3232' }}>
                    No cities available in this state. Please select another state.
                  </span>
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
                disabled={isProcessing || !isPaystackConfigured}
              >
                {isProcessing 
                  ? 'Processing...' 
                  : !isPaystackConfigured 
                    ? 'Payment Not Configured' 
                    : `Pay ₦${total.toLocaleString()}`
                }
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
