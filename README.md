# Barber Booking System (BBS)

A comprehensive full-stack barber booking system built with Next.js, Node.js, and PostgreSQL.

## 📋 Project Overview

This system includes:
- **Main Website**: Marketing pages (Home, About, Contact, Become a Barber, Barber Recruit)
- **Customer Dashboard**: Browse barbers, book appointments, manage bookings
- **Barber Dashboard**: Manage schedule, bookings, earnings, and profile
- **Admin Dashboard**: System administration, analytics, user management
- **Customer Rep Dashboard**: Support tickets, booking assistance, customer service

## 🚀 Quick Start

See [QUICK_START.md](./QUICK_START.md) for detailed setup instructions.

### Prerequisites
- Node.js 20+ LTS
- PostgreSQL database (or use Supabase/Neon free tier)
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd bbs-project

# Setup Frontend
cd frontend
npm install
npm run dev

# Setup Backend (in another terminal)
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npx prisma migrate dev
npm run dev
```

## 📁 Project Structure

```
bbs-project/
├── frontend/          # Next.js frontend application
├── backend/           # Node.js/Express backend API
├── docs/              # Documentation
├── PROJECT_PLAN.md    # Comprehensive project plan
├── QUICK_START.md     # Setup guide
└── README.md          # This file
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Auth.js) + JWT
- **Real-time**: Socket.io
- **Payments**: Stripe integration

## 📚 Documentation

- [Project Plan](./PROJECT_PLAN.md) - Complete project documentation
- [Database Schema](./docs/DATABASE_SCHEMA.md) - Database structure
- [API Architecture](./docs/API_ARCHITECTURE.md) - API endpoints and structure
- [Quick Start Guide](./QUICK_START.md) - Setup instructions

## 🔐 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## 📖 Development Roadmap

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for the complete development roadmap.

**Current Phase**: Project Setup & Initial Structure

## 🤝 Contributing

This is a private project. Follow the development guidelines in the project plan.

## 📝 License

[Your License Here]

## 👥 Team

[Your Team/Contact Info]

---

**Status**: 🚧 In Development
