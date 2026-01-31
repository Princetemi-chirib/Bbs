// Authentication utilities

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'BARBER' | 'CUSTOMER' | 'REP' | 'MANAGER' | 'VIEWER';
  avatarUrl?: string;
  barber?: {
    id: string;
    status: string;
    location?: string;
    ratingAvg: number;
    totalReviews: number;
    totalBookings: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Note: Tokens are now stored in httpOnly cookies, not accessible from client-side JavaScript
// User data is still stored in localStorage for client-side access

// Get stored user data (from localStorage - set after login)
export function getUserData(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user_data');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// Store user data (after successful login)
export function setUserData(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_data', JSON.stringify(user));
}

// Clear auth data (logout)
export async function clearAuthData(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  // Call logout endpoint to clear server-side session and cookies
  try {
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include', // Important: send cookies
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  // Clear local user data
  localStorage.removeItem('user_data');
}

// Check if user is authenticated (checks localStorage for user data)
// Note: Actual authentication is handled server-side via cookies
export function isAuthenticated(): boolean {
  return getUserData() !== null;
}

// Check if user has specific role
export function hasRole(role: 'ADMIN' | 'BARBER' | 'CUSTOMER' | 'REP' | 'MANAGER' | 'VIEWER'): boolean {
  const user = getUserData();
  return user?.role === role;
}

// Check if user is admin (super admin)
export function isAdmin(): boolean {
  return hasRole('ADMIN');
}

// Check if user is admin, rep, manager, or viewer (has admin dashboard access)
export function isAdminOrRep(): boolean {
  const user = getUserData();
  return user?.role === 'ADMIN' || user?.role === 'REP' || user?.role === 'MANAGER' || user?.role === 'VIEWER';
}

// Check if user is view-only (no export, no send report, no write actions)
export function isViewOnly(): boolean {
  const user = getUserData();
  return user?.role === 'VIEWER';
}

// Check if user has permission for an action (admin has all permissions)
export function hasPermission(permission: string): boolean {
  const user = getUserData();
  if (!user) return false;
  
  // Super admin has all permissions
  if (user.role === 'ADMIN') return true;
  
  // Rep permissions
  if (user.role === 'REP') {
    const repPermissions = [
      'view_dashboard',
      'view_orders',
      'update_order_status',
      'assign_orders',
      'view_customers',
      'edit_customers',
      'view_barbers',
      'view_services',
      'view_financials_limited',
      'view_support_tickets',
    ];
    return repPermissions.includes(permission);
  }
  
  return false;
}

// Get auth headers for API requests
// Note: Cookies are sent automatically with credentials: 'include'
// This function is kept for backward compatibility but no longer adds Authorization header
export function getAuthHeaders(): Record<string, string> {
  // Cookies are sent automatically, no need for Authorization header
  // But we keep this for backward compatibility in case some code expects it
  return {};
}

// Fetch authenticated API
// Cookies (access_token and refresh_token) are sent automatically with credentials: 'include'
export async function fetchAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important: send cookies with request
  });

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    try {
      // Attempt to refresh the token
      const refreshResponse = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        // Token refreshed, retry original request
        return fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });
      } else {
        // Refresh failed, clear auth data and redirect to login
        await clearAuthData();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    } catch (refreshError) {
      console.error('Token refresh error:', refreshError);
      await clearAuthData();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  return response;
}
