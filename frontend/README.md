# Frontend - Barber Booking System

Next.js 14+ frontend application for the Barber Booking System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

3. Run development server:
```bash
npm run dev
```

The application will run on http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── app/              # Next.js app directory
│   ├── (marketing)/  # Public marketing pages
│   ├── (auth)/       # Authentication pages
│   ├── (customer)/   # Customer dashboard
│   ├── (barber)/     # Barber dashboard
│   ├── (admin)/      # Admin dashboard
│   └── (rep)/        # Customer rep dashboard
├── components/       # React components
├── lib/              # Utilities and configs
├── hooks/            # Custom React hooks
├── store/            # State management
└── types/            # TypeScript types
```

## Features

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- React Hook Form + Zod validation
- Zustand for state management
- Socket.io client for real-time updates

## Pages Structure

### Marketing (Public)
- `/` - Home page
- `/about` - About page
- `/contact` - Contact page
- `/become-barber` - Become a barber page
- `/barber-recruit` - Barber recruitment page

### Authentication
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password reset

### Customer Dashboard
- `/customer/dashboard` - Customer dashboard
- `/customer/bookings` - My bookings
- `/customer/barbers` - Browse barbers

### Barber Dashboard
- `/barber/dashboard` - Barber dashboard
- `/barber/schedule` - Schedule management
- `/barber/bookings` - Manage bookings
- `/barber/earnings` - Earnings and payments

### Admin Dashboard
- `/admin/dashboard` - Admin dashboard
- `/admin/barbers` - Manage barbers
- `/admin/bookings` - All bookings
- `/admin/analytics` - Analytics and reports

### Customer Rep Dashboard
- `/rep/dashboard` - Rep dashboard
- `/rep/bookings` - Booking support
- `/rep/tickets` - Support tickets
