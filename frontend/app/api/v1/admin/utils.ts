// Re-export auth utilities from centralized location
import { 
  verifyAdminOrRep, 
  verifyAdmin,
  type AuthUser 
} from '../utils/auth';

export { 
  verifyAdminOrRep, 
  verifyAdmin,
  type AuthUser 
};

// Check if user has permission
export function hasPermission(user: AuthUser, permission: string): boolean {
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
