'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div 
      className="min-h-screen relative"
      style={{
        background: 'linear-gradient(to right, #0f5132 0%, #2d6a4f 20%, #6c7a5f 50%, #8b7355 80%, #a39280 100%)',
      }}
    >
      {/* Blurred gradient overlay for header background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-900 via-green-700 to-amber-900 opacity-30 blur-3xl"></div>
      
      <div className="relative z-10 p-8">
        <div className="max-w-4xl mx-auto pt-24 pb-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
              Barber Booking System
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed">
              Welcome to the Barber Booking System. This is the main landing page.
            </p>

            {/* ORDER Button - Prominent CTA */}
            <Link 
              href="/book"
              className="group relative inline-flex items-center justify-center px-12 py-6 text-xl font-semibold text-white bg-[#39413f] rounded-full shadow-2xl hover:bg-[#2d3432] transition-all duration-300 hover:shadow-3xl hover:scale-105 active:scale-100 border-2 border-white/20 hover:border-white/30"
            >
              <span className="relative z-10 flex items-center gap-3">
                ORDER NOW
                <svg 
                  className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 border rounded-lg bg-white/10 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold mb-2 text-white">For Customers</h2>
              <p className="text-white/80">
                Browse barbers, book appointments, and manage your bookings.
              </p>
            </div>
            
            <div className="p-6 border rounded-lg bg-white/10 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold mb-2 text-white">For Barbers</h2>
              <p className="text-white/80">
                Manage your schedule, bookings, and earnings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
