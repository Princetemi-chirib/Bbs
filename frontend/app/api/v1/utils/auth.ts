import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  role: string;
  email: string;
  isActive: boolean;
}

/**
 * Get JWT token from request (checks cookies first, then Authorization header for backward compatibility)
 */
function getTokenFromRequest(request: NextRequest): string | null {
  // First, try to get token from httpOnly cookie (new method)
  const cookieToken = request.cookies.get('access_token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback to Authorization header (for backward compatibility)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Verify JWT token and return decoded user info
 */
async function verifyToken(token: string): Promise<AuthUser | null> {
  const JWT_SECRET = process.env.JWT_SECRET;
  
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { 
      id: string; 
      role: string; 
      email: string;
      type?: string;
    };

    // Verify user exists and is active
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.id } 
    });
    
    if (!user || !user.isActive) {
      return null;
    }
    
    return {
      id: user.id,
      role: user.role,
      email: user.email,
      isActive: user.isActive,
    };
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

/**
 * Verify admin, rep, manager, or viewer (dashboard access).
 * VIEWER = read-only; MANAGER = department/location-scoped (treated like REP for now).
 */
export async function verifyAdminOrRep(request: NextRequest): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  const user = await verifyToken(token);
  if (!user) {
    return null;
  }

  if (user.role !== 'ADMIN' && user.role !== 'REP' && user.role !== 'MANAGER' && user.role !== 'VIEWER') {
    return null;
  }
  
  return user;
}

/** True if user can only view (no export, no send report, no write). */
export function isViewOnly(user: AuthUser): boolean {
  return user.role === 'VIEWER';
}

/**
 * Verify admin only (super admin)
 */
export async function verifyAdmin(request: NextRequest): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  const user = await verifyToken(token);
  if (!user) {
    return null;
  }

  if (user.role !== 'ADMIN') {
    return null;
  }
  
  return user;
}

/**
 * Verify barber
 */
export async function verifyBarber(request: NextRequest): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  const user = await verifyToken(token);
  if (!user) {
    return null;
  }

  if (user.role !== 'BARBER') {
    return null;
  }
  
  return user;
}

/**
 * Verify customer representative (REP) only
 */
export async function verifyRep(request: NextRequest): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  const user = await verifyToken(token);
  if (!user) {
    return null;
  }

  if (user.role !== 'REP') {
    return null;
  }
  
  return user;
}

/**
 * Verify any authenticated user
 */
export async function verifyUser(request: NextRequest): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  return verifyToken(token);
}
