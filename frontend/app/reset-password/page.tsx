'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Verify token validity on mount
    if (token) {
      verifyToken();
    } else {
      setTokenValid(false);
      setErrors({ general: 'Invalid or missing reset token' });
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/v1/auth/verify-reset-token?token=${token}`);
      const data = await response.json();
      
      if (data.success) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        setErrors({ general: data.error?.message || 'Invalid or expired reset token' });
      }
    } catch (err) {
      setTokenValid(false);
      setErrors({ general: 'Failed to verify token. Please try again.' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setErrors({ general: data.error?.message || 'Failed to reset password. Please try again.' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✓</div>
            <h1>Password Set Successfully!</h1>
            <p>Your password has been set. You can now log in to your dashboard.</p>
            <p>Redirecting to login page...</p>
            <Link href="/login" className={styles.loginLink}>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorCard}>
            <h1>Invalid or Expired Link</h1>
            <p>{errors.general || 'This password reset link is invalid or has expired.'}</p>
            <p>Please contact support or request a new reset link.</p>
            <Link href="/" className={styles.homeLink}>
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === null) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingCard}>
            <p>Verifying reset token...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Set Up Your Password</h1>
          <p>Create a secure password for your barber dashboard account.</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {errors.general && (
              <div className={styles.errorMessage}>{errors.general}</div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="password">New Password *</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={errors.password ? styles.inputError : ''}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
              {errors.password && (
                <span className={styles.fieldError}>{errors.password}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={errors.confirmPassword ? styles.inputError : ''}
                placeholder="Re-enter your password"
                minLength={8}
                required
              />
              {errors.confirmPassword && (
                <span className={styles.fieldError}>{errors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Setting Password...' : 'Set Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
