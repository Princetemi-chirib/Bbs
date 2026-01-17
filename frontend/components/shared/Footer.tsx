'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement email subscription logic
    console.log('Email submitted:', email);
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <footer className="text-white py-12 px-4 md:px-8" style={{ backgroundColor: '#39413f' }}>
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Products Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">Products</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="hover:text-gray-300 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="hover:text-gray-300 transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link 
                  href="/barber-recruit" 
                  className="hover:text-gray-300 transition-colors"
                >
                  Barber Recruit
                </Link>
              </li>
              <li>
                <Link 
                  href="/become-barber" 
                  className="hover:text-gray-300 transition-colors"
                >
                  Become A Barber
                </Link>
              </li>
            </ul>
          </div>

          {/* Stay up to date Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">Stay up to date</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full px-4 py-2 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button
                type="submit"
                className="w-full bg-white text-gray-900 font-semibold py-2 px-6 rounded-md hover:bg-gray-100 transition-colors uppercase"
              >
                Submit
              </button>
            </form>
            {submitted && (
              <p className="text-green-400 text-sm mt-2">
                Thank you for subscribing!
              </p>
            )}
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact</h3>
            <div className="space-y-2">
              <p>
                <a 
                  href="tel:02013306086" 
                  className="hover:text-gray-300 transition-colors"
                >
                  02013306086
                </a>
              </p>
              <p>
                <a 
                  href="mailto:Support@bbslimited.online" 
                  className="hover:text-gray-300 transition-colors"
                >
                  Support@bbslimited.online
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Secure Payment Badge */}
        <div className="flex items-center justify-start pt-6 border-t border-gray-700">
          <div className="flex items-center rounded-lg py-3">
            <div className="relative w-60 h-60 flex-shrink-0">
              <Image
                src="/images/securepay-removebg-preview (1).png"
                alt="Secure Payment"
                width={240}
                height={240}
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} BBS Limited. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
