// Authentication utilities

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'BARBER' | 'CUSTOMER' | 'REP';
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

// Get stored auth token
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

// Get stored user data
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

// Store auth data
export function setAuthData(token: string, user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user_data', JSON.stringify(user));
}

// Clear auth data
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

// Check if user has specific role
export function hasRole(role: 'ADMIN' | 'BARBER' | 'CUSTOMER' | 'REP'): boolean {
  const user = getUserData();
  return user?.role === role;
}

// Check if user is admin (super admin)
export function isAdmin(): boolean {
  return hasRole('ADMIN');
}

// Check if user is admin or rep (has admin dashboard access)
export function isAdminOrRep(): boolean {
  const user = getUserData();
  return user?.role === 'ADMIN' || user?.role === 'REP';
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
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

// Fetch authenticated API
export async function fetchAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized, clear auth data
  if (response.status === 401) {
    clearAuthData();
  }

  return response;
}
