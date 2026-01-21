import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  role: string;
  email: string;
  isActive: boolean;
}

// Verify admin or rep (both have dashboard access)
export async function verifyAdminOrRep(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'REP') || !user.isActive) {
      return null;
    }
    
    return {
      id: user.id,
      role: user.role,
      email: user.email,
      isActive: user.isActive,
    };
  } catch {
    return null;
  }
}

// Verify admin only (super admin)
export async function verifyAdmin(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user || user.role !== 'ADMIN' || !user.isActive) {
      return null;
    }
    
    return {
      id: user.id,
      role: user.role,
      email: user.email,
      isActive: user.isActive,
    };
  } catch {
    return null;
  }
}

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
