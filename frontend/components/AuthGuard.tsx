'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, getUserData, hasRole } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'BARBER' | 'CUSTOMER' | 'REP' | 'ADMIN_OR_REP';
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requiredRole,
  redirectTo = '/login' 
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        const safePath = pathname ?? '/';
        router.push(`${redirectTo}?redirect=${encodeURIComponent(safePath)}`);
        return;
      }

      if (requiredRole) {
        const user = getUserData();
        let authorized = false;

        if (requiredRole === 'ADMIN_OR_REP') {
          authorized = user?.role === 'ADMIN' || user?.role === 'REP' || user?.role === 'MANAGER' || user?.role === 'VIEWER';
        } else {
          authorized = hasRole(requiredRole);
        }

        if (!authorized) {
          // Redirect based on user role
          if (user?.role === 'ADMIN' || user?.role === 'REP' || user?.role === 'MANAGER' || user?.role === 'VIEWER') {
            router.push('/admin');
          } else if (user?.role === 'BARBER') {
            router.push('/barber');
          } else {
            router.push('/');
          }
          return;
        }
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router, pathname, requiredRole, redirectTo]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#dcd2cc',
      }}>
        <div style={{
          textAlign: 'center',
          color: '#39413f',
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #39413f',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px',
          }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
