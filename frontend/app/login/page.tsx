'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setUserData } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: receive cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Login failed');
        setLoading(false);
        return;
      }

      // Store user data (tokens are in httpOnly cookies, not accessible from client)
      setUserData(data.data.user);

      // Redirect based on role
      if (data.data.user.role === 'ADMIN' || data.data.user.role === 'REP' || data.data.user.role === 'MANAGER' || data.data.user.role === 'VIEWER') {
        router.push('/admin');
      } else if (data.data.user.role === 'BARBER') {
        router.push('/barber');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#dcd2cc',
      padding: '20px',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '2rem',
            fontWeight: '700',
            color: '#39413f',
            marginBottom: '10px',
          }}>
            Welcome Back
          </h1>
          <p style={{
            color: '#5a625f',
            fontSize: '0.95rem',
          }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            color: '#c00',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#39413f',
              fontWeight: '600',
              fontSize: '0.9rem',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #b8aea8',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#39413f'}
              onBlur={(e) => e.target.style.borderColor = '#b8aea8'}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#39413f',
              fontWeight: '600',
              fontSize: '0.9rem',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #b8aea8',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#39413f'}
              onBlur={(e) => e.target.style.borderColor = '#b8aea8'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#ccc' : '#39413f',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.background = '#2a312f';
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.background = '#39413f';
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '30px',
          textAlign: 'center',
          fontSize: '0.9rem',
          color: '#5a625f',
        }}>
          <Link href="/" style={{ color: '#39413f', textDecoration: 'none' }}>
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
