'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/contact', label: 'Contact' },
  { href: '/barber-recruit', label: 'Barber Recruit' },
  { href: '/become-barber', label: 'Become A Barber' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /* Home: dark glass header with white links; other pages: solid dark with white links */
  const linkClass = 'font-medium text-white hover:text-[#f5f5f5] transition-colors';
  const btnClass = 'md:hidden p-3 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-[#f5f5f5] transition-colors touch-manipulation cursor-pointer';
  const mobileNavBorder = 'border-white/20';
  const mobileNavLinkClass = 'font-medium text-white hover:text-[#f5f5f5] transition-colors py-2.5 px-1';

  return (
    <header
      className={`main-header-bar ${isScrolled ? 'ast-fixed-header' : ''} ${!isHomePage ? 'solid-header' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          {/* Logo Section */}
          <Link href="/" className="flex-shrink-0" onClick={() => setMobileOpen(false)}>
            <div className="relative h-12 w-auto">
              <Image
                src="/images/WhatsApp Image 2025-07-26 at 20.20.08_a40e3183 - Edited.png"
                alt="BITCON BARBING STUDIO LIMITED"
                width={140}
                height={48}
                className="h-full w-auto object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className={btnClass}
            onClick={() => setMobileOpen(!isMobileOpen)}
            aria-expanded={isMobileOpen}
            aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileOpen ? (
              <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className={`flex flex-col gap-1 pb-3 pt-1 border-t ${mobileNavBorder}`}>
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={mobileNavLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
