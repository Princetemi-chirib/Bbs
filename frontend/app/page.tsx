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
        <div className="max-w-4xl mx-auto pt-24">
          <h1 className="text-4xl font-bold mb-4 text-white">
            Barber Booking System
          </h1>
          <p className="text-lg mb-8 text-white/90">
            Welcome to the Barber Booking System. This is the main landing page.
          </p>
          
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
