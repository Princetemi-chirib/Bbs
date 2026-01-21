'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './AdminSidebar.module.css';

interface AdminSidebarProps {
  onLogout: () => void;
}

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/orders', label: 'Orders', icon: '📦' },
    { href: '/admin/customers', label: 'Customers', icon: '👥' },
    { href: '/admin/barbers', label: 'Barbers', icon: '✂️' },
    { href: '/admin/services', label: 'Services', icon: '💇' },
    { href: '/admin/financials', label: 'Financials', icon: '💰' },
  ];

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
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className={styles.sidebarFooter}>
            <button onClick={onLogout} className={styles.logoutButton}>
              <span className={styles.navIcon}>🚪</span>
              <span className={styles.navLabel}>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
