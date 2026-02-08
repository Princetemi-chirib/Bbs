'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
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
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { getUserData } from '@/lib/auth';
import styles from './AdminSidebar.module.css';

interface AdminSidebarProps {
  onLogout: () => void;
}

type Role = 'ADMIN' | 'REP' | 'MANAGER' | 'VIEWER';

interface SubItem {
  href: string;
  label: string;
}

interface NavItem {
  type: 'link' | 'parent';
  href?: string;
  label: string;
  Icon: LucideIcon;
  roles: Role[];
  children?: SubItem[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  { type: 'link', href: '/admin', label: 'Dashboard', Icon: LayoutDashboard, roles: ['ADMIN', 'REP', 'MANAGER', 'VIEWER'] },
  {
    type: 'parent',
    href: '/admin/orders',
    label: 'Orders',
    Icon: Package,
    roles: ['ADMIN', 'REP', 'MANAGER', 'VIEWER'],
    children: [
      { href: '/admin/orders', label: 'All orders' },
      { href: '/admin/orders?create=1', label: 'Create order' },
    ],
  },
  { type: 'link', href: '/admin/customers', label: 'Customers', Icon: Users, roles: ['ADMIN', 'REP', 'MANAGER', 'VIEWER'] },
  { type: 'link', href: '/admin/barbers', label: 'Barbers', Icon: Scissors, roles: ['ADMIN', 'REP', 'MANAGER', 'VIEWER'] },
  { type: 'link', href: '/admin/services', label: 'Services', Icon: Sparkles, roles: ['ADMIN', 'REP', 'MANAGER', 'VIEWER'] },
  { type: 'link', href: '/admin/reviews', label: 'Reviews', Icon: Star, roles: ['ADMIN', 'REP', 'MANAGER', 'VIEWER'] },
  {
    type: 'parent',
    label: 'Financials',
    Icon: Wallet,
    roles: ['ADMIN', 'REP', 'MANAGER', 'VIEWER'],
    children: [
      { href: '/admin/financials?tab=overview', label: 'Overview' },
      { href: '/admin/financials?tab=financial', label: 'Revenue' },
      { href: '/admin/financials?tab=barbers', label: 'Barber payouts' },
      { href: '/admin/financials?tab=orders', label: 'Orders & services' },
      { href: '/admin/financials?tab=reviews', label: 'Reviews & feedback' },
      { href: '/admin/financials?tab=traffic', label: 'Site traffic' },
      { href: '/admin/financials?tab=operations', label: 'Operations' },
      { href: '/admin/financials?tab=marketing', label: 'Marketing' },
      { href: '/admin/financials?tab=inventory', label: 'Inventory' },
      { href: '/admin/financials?tab=settings', label: 'Settings' },
    ],
  },
  { type: 'link', href: '/admin/team', label: 'Team', Icon: UsersRound, roles: ['ADMIN'] },
];

function isPathActive(pathname: string, href: string, searchParams?: string | null): boolean {
  if (href === '/admin') return pathname === '/admin';
  if (href.startsWith('/admin/orders')) {
    const baseMatch = pathname === '/admin/orders' || pathname?.startsWith('/admin/orders');
    if (href === '/admin/orders') return baseMatch && !searchParams;
    if (href === '/admin/orders?create=1') return pathname === '/admin/orders' && searchParams === 'create=1';
    return baseMatch;
  }
  if (href.startsWith('/admin/financials')) {
    if (pathname !== '/admin/financials') return false;
    const tab = href.includes('tab=') ? href.split('tab=')[1]?.split('&')[0] : '';
    return !tab || (searchParams?.includes(`tab=${tab}`) ?? false);
  }
  return pathname === href || (href !== '/admin' && pathname?.startsWith(href));
}

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const path = pathname ?? '';
  const searchParams = useSearchParams()?.toString() || null;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  useEffect(() => {
    const user = getUserData();
    if (user?.role === 'ADMIN' || user?.role === 'REP' || user?.role === 'MANAGER' || user?.role === 'VIEWER') {
      setUserRole(user.role as Role);
    }
  }, []);

  useEffect(() => {
    const next = new Set<string>();
    ALL_NAV_ITEMS.forEach((item) => {
      if (item.type !== 'parent' || !item.children) return;
      const childActive = item.children.some((c) => isPathActive(path, c.href, searchParams));
      if (childActive) next.add(item.label);
    });
    setExpandedParents((prev) => (next.size ? new Set([...prev, ...next]) : prev));
  }, [pathname, searchParams]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const menuItems = ALL_NAV_ITEMS.filter((item) => userRole && item.roles.includes(userRole));

  const toggleParent = (label: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <>
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

      {isMobileOpen && (
        <div className={styles.overlay} onClick={() => setIsMobileOpen(false)} aria-hidden />
      )}

      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarContent}>
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
            {userRole === 'REP' && <span className={styles.roleBadge}>Customer Rep</span>}
            {userRole === 'MANAGER' && <span className={styles.roleBadge}>Manager</span>}
            {userRole === 'VIEWER' && <span className={styles.roleBadge}>View only</span>}
          </div>

          <nav className={styles.nav}>
            {menuItems.map((item) => {
              if (item.type === 'link' && item.href) {
                const isActive = isPathActive(path, item.href, searchParams);
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
              }

              if (item.type === 'parent' && item.children?.length) {
                const isExpanded = expandedParents.has(item.label);
                const isParentActive = item.href
                  ? isPathActive(path, item.href, searchParams)
                  : item.children.some((c) => isPathActive(path, c.href, searchParams));

                return (
                  <div key={item.label} className={styles.parentGroup}>
                    <div className={styles.parentRow}>
                      {item.href ? (
                        <Link
                          href={item.href}
                          className={`${styles.navItem} ${styles.navItemParent} ${isParentActive ? styles.navItemActive : ''}`}
                        >
                          <item.Icon size={20} className={styles.navIcon} aria-hidden />
                          <span className={styles.navLabel}>{item.label}</span>
                        </Link>
                      ) : (
                        <span
                          className={`${styles.navItem} ${styles.navItemParent} ${isParentActive ? styles.navItemActive : ''}`}
                        >
                          <item.Icon size={20} className={styles.navIcon} aria-hidden />
                          <span className={styles.navLabel}>{item.label}</span>
                        </span>
                      )}
                      <button
                        type="button"
                        className={styles.expandBtn}
                        onClick={() => toggleParent(item.label)}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </div>
                    {isExpanded && (
                      <ul className={styles.subNav}>
                        {item.children.map((sub) => {
                          const isSubActive = isPathActive(path, sub.href, searchParams);
                          return (
                            <li key={sub.href}>
                              <Link
                                href={sub.href}
                                className={`${styles.subNavItem} ${isSubActive ? styles.subNavItemActive : ''}`}
                              >
                                {sub.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <button type="button" onClick={onLogout} className={styles.logoutButton}>
              <LogOut size={20} className={styles.navIcon} aria-hidden />
              <span className={styles.navLabel}>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
