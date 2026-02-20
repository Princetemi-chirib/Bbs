'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/cartStore';
import styles from './page.module.css';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const total = getTotal();

  useEffect(() => {
    if (items.length === 0 && typeof window !== 'undefined') {
      // Redirect to book page if cart is empty
      router.push('/book');
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <div className={styles.emptyCartContent}>
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2>Your cart is empty</h2>
          <p>Start adding services to your cart to continue</p>
          <Link href="/book" className={styles.continueShoppingBtn}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cartPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Your Cart</h1>
          <p className={styles.itemCount}>{items.length} {items.length === 1 ? 'item' : 'items'} in your cart</p>
        </div>

        <div className={styles.cartLayout}>
          {/* Cart Items */}
          <div className={styles.cartItems}>
            {items.map((item) => (
              <div key={item.key} className={styles.cartItem}>
                <div className={styles.itemImage}>
                  <Image
                    src={item.afterImage}
                    alt={item.title}
                    fill
                    className={styles.image}
                    sizes="(max-width: 768px) 150px, 200px"
                  />
                </div>
                <div className={styles.itemDetails}>
                  <h3 className={styles.itemTitle}>{item.title}</h3>
                  {item.displayAge !== 'Fixed' && (
                    <p className={styles.itemAge}>Age Group: {item.displayAge}</p>
                  )}
                  <p className={styles.itemDescription}>{item.description}</p>
                  <div className={styles.itemPrice}>₦{item.price.toLocaleString()}</div>
                </div>
                <div className={styles.itemControls}>
                  <div className={styles.quantityControl}>
                    <button
                      className={styles.quantityBtn}
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <span className={styles.quantity}>{item.quantity}</span>
                    <button
                      className={styles.quantityBtn}
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <div className={styles.itemTotal}>
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.key)}
                    aria-label="Remove item"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className={styles.orderSummary}>
            <h2>Order Summary</h2>
            <div className={styles.summaryDetails}>
              <div className={styles.summaryRow}>
                <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Service Charge</span>
                <span>₦0</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>
            <Link href="/checkout" className={styles.checkoutBtn}>
              Proceed to Checkout
            </Link>
            <Link href="/book" className={styles.continueShoppingBtn}>
              Continue Shopping
            </Link>
            <button onClick={clearCart} className={styles.clearCartBtn}>
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
