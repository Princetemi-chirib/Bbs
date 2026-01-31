'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  Scissors,
  Sparkles,
  Star,
  Wallet,
  UsersRound,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { getUserData } from '@/lib/auth';
import styles from './AdminSidebar.module.css';

interface AdminSidebarProps {
  onLogout: () => void;
}

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'REP' | 'MANAGER' | 'VIEWER' | null>(null);

  // Get user role on mount
  useEffect(() => {
    const user = getUserData();
    if (user?.role === 'ADMIN' || user?.role === 'REP' || user?.role === 'MANAGER' || user?.role === 'VIEWER') {
      setUserRole(user.role as 'ADMIN' | 'REP' | 'MANAGER' | 'VIEWER');
    }
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // All menu items (MANAGER/VIEWER have dashboard access; Team is Admin only)
  const allMenuItems: { href: string; label: string; Icon: LucideIcon; roles: ('ADMIN' | 'REP' | 'MANAGER' | 'VIEWER')[] }[] = [
    { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard, roles: ['ADMIN', 'REP', 'MANAGER', 'VIEWER'] },
    { href: '/admin/orders', label: 'Orders', Icon: Package, roles: ['ADMIN', 'REP', 'MANAGER', 'VIEWER'] },
    { href: '/admin/customers', label: 'Customers', Icon: Users, roles: ['ADMIN', 'REP', 'MANAGER', 'VIEWER'] },
    { href: '/admin/barbers', label: 'Barbers', Icon: Scissors, roles: ['ADMIN', 'REP', 'MANAGER', 'VIEWER'] },
    { href: '/admin/services', label: 'Services', Icon: Sparkles, roles: ['ADMIN', 'REP', 'MANAGER', 'VIEWER'] },
    { href: '/admin/reviews', label: 'Reviews', Icon: Star, roles: ['ADMIN', 'REP', 'MANAGER', 'VIEWER'] },
    { href: '/admin/financials', label: 'Financials', Icon: Wallet, roles: ['ADMIN', 'REP', 'MANAGER', 'VIEWER'] },
    { href: '/admin/team', label: 'Team', Icon: UsersRound, roles: ['ADMIN'] },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        className={styles.mobileToggle}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        <span className={styles.hamburger}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarContent}>
          {/* Logo/Brand */}
          <div className={styles.brand}>
            <Link href="/admin" className={styles.logoLink}>
              <Image
                src="/images/WhatsApp Image 2025-07-26 at 20.20.08_a40e3183 - Edited.png"
                alt="BBS Limited"
                width={140}
                height={48}
                className={styles.logo}
                priority
              />
            </Link>
            {userRole === 'REP' && (
              <span className={styles.roleBadge}>Customer Rep</span>
            )}
            {userRole === 'MANAGER' && (
              <span className={styles.roleBadge}>Manager</span>
            )}
            {userRole === 'VIEWER' && (
              <span className={styles.roleBadge}>View only</span>
            )}
          </div>

          {/* Navigation */}
          <nav className={styles.nav}>
            {menuItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname?.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                >
                  <item.Icon size={20} className={styles.navIcon} aria-hidden />
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className={styles.sidebarFooter}>
            <button onClick={onLogout} className={styles.logoutButton}>
              <LogOut size={20} className={styles.navIcon} aria-hidden />
              <span className={styles.navLabel}>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
