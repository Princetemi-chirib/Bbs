# Getting Started 🚀

Welcome to the Barber Booking System project! This guide will help you get started quickly.

## Quick Setup (5 minutes)

### 1. Install Dependencies

**Backend:**
```powershell
cd backend
npm install
```

**Frontend:**
```powershell
cd frontend
npm install
```

### 2. Setup Database

1. Create a PostgreSQL database (use [Supabase](https://supabase.com) for free tier)
2. Copy `backend/env.example` to `backend/.env`
3. Add your database connection string:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/database"
   ```
4. Generate JWT secrets (use any random string generator)

### 3. Initialize Database

```powershell
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

### 5. Verify Setup

- Backend: http://localhost:3001/health
- Frontend: http://localhost:3000

## 📚 Documentation

- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** - Complete project documentation with features, roadmap, and architecture
- **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** - Detailed setup instructions
- **[QUICK_START.md](./QUICK_START.md)** - Quick reference guide
- **[docs/API_ARCHITECTURE.md](./docs/API_ARCHITECTURE.md)** - API endpoints documentation
- **[docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** - Database schema details

## 📁 Project Structure

```
bbs-project/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/      # Database, env config
│   │   ├── controllers/ # Route controllers
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Auth, validation
│   │   ├── routes/      # API routes
│   │   └── server.ts    # Entry point
│   └── prisma/          # Database schema
│
├── frontend/             # Next.js application
│   ├── app/             # Next.js app directory
│   │   ├── (marketing)/ # Public pages
│   │   ├── (auth)/      # Auth pages
│   │   ├── (customer)/  # Customer dashboard
│   │   ├── (barber)/    # Barber dashboard
│   │   ├── (admin)/     # Admin dashboard
│   │   └── (rep)/       # Rep dashboard
│   └── components/      # React components
│
└── docs/                # Documentation
```

## 🎯 Next Steps

1. ✅ Project structure created
2. ⏳ Setup database and environment variables
3. ⏳ Implement authentication system
4. ⏳ Build booking system
5. ⏳ Create dashboards

See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for detailed progress tracking.

## 💡 Tips

- Use **Prisma Studio** to view/edit database: `npx prisma studio`
- Check **PROJECT_PLAN.md** for complete feature list
- Refer to **API_ARCHITECTURE.md** for API endpoints
- See **DATABASE_SCHEMA.md** for database structure

## 🆘 Need Help?

1. Check [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) for troubleshooting
2. Review [PROJECT_PLAN.md](./PROJECT_PLAN.md) for architecture details
3. Verify all environment variables are set correctly
4. Ensure database is accessible

---

**Happy Coding!** 🎉
