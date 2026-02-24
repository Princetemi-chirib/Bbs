'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const ref = searchParams?.get('ref');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(180deg, #f5f5f4 0%, #e8e6e4 100%)',
    }}>
      <div style={{
        maxWidth: 420,
        textAlign: 'center',
        background: '#fff',
        padding: 40,
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#39413f', margin: '0 0 12px 0' }}>
          Payment successful
        </h1>
        <p style={{ color: '#666', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          Your payment has been received. We will confirm your order by email and assign a barber shortly.
        </p>
        {ref && (
          <p style={{ fontSize: 14, color: '#999', marginBottom: 24 }}>
            Reference: {ref}
          </p>
        )}
        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: '#39413f',
            color: '#fff',
            padding: '14px 28px',
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        background: 'linear-gradient(180deg, #f5f5f4 0%, #e8e6e4 100%)',
      }}>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
