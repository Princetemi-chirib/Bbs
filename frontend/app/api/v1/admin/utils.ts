// Re-export auth utilities from centralized location
import { 
  verifyAdminOrRep, 
  verifyAdmin,
  isViewOnly,
  type AuthUser 
} from '../utils/auth';

export { 
  verifyAdminOrRep, 
  verifyAdmin,
  isViewOnly,
  type AuthUser 
};

// Check if user has permission
export function hasPermission(user: AuthUser, permission: string): boolean {
  // Super admin has all permissions
  if (user.role === 'ADMIN') return true;
  
  // View-only: only view_* permissions, no write/export
  if (user.role === 'VIEWER') {
    const viewerPermissions = [
      'view_dashboard',
      'view_orders',
      'view_customers',
      'view_barbers',
      'view_services',
      'view_financials_limited',
      'view_support_tickets',
      'view_analytics',
      'view_reports',
    ];
    return viewerPermissions.includes(permission);
  }
  
  // Manager: same as REP for now (department-scoped can be added later)
  if (user.role === 'MANAGER') {
    const managerPermissions = [
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
    return managerPermissions.includes(permission);
  }
  
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
