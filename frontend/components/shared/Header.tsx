'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`main-header-bar ${isScrolled ? 'ast-fixed-header' : ''} ${!isHomePage ? 'solid-header' : ''}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between py-2 px-4">
        {/* Logo Section */}
        <Link href="/" className="flex-shrink-0">
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

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <Link
            href="/"
            className="text-white font-medium hover:text-yellow-400 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/contact"
            className="text-white font-medium hover:text-yellow-400 transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/barber-recruit"
            className="text-white font-medium hover:text-yellow-400 transition-colors"
          >
            Barber Recruit
          </Link>
          <Link
            href="/become-barber"
            className="text-white font-medium hover:text-yellow-400 transition-colors"
          >
            Become A Barber
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white">
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
    </header>
  );
}
