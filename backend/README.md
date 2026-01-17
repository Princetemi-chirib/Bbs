# Backend API - Barber Booking System

Node.js + Express + TypeScript backend for the Barber Booking System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp env.example .env
```

3. Configure your `.env` file with:
   - Database connection string
   - JWT secrets
   - Other required configuration

4. Setup database:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Run development server:
```bash
npm run dev
```

The server will run on http://localhost:3001

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Project Structure

```
backend/
├── src/
│   ├── config/        # Configuration files
│   ├── controllers/   # Route controllers
│   ├── services/      # Business logic
│   ├── middleware/    # Express middleware
│   ├── routes/        # API routes
│   ├── utils/         # Utility functions
│   └── server.ts      # Entry point
├── prisma/
│   └── schema.prisma  # Database schema
└── tests/             # Test files
```

## API Documentation

See `docs/API_ARCHITECTURE.md` for complete API documentation.

## Environment Variables

Required environment variables (see `env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS
