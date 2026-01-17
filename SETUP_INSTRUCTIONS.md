# Setup Instructions

Follow these steps to get your Barber Booking System up and running.

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 2: Database Setup

1. **Choose a PostgreSQL provider:**
   - **Supabase** (Recommended for free tier): https://supabase.com
   - **Neon**: https://neon.tech
   - **Local PostgreSQL**: Install PostgreSQL locally

2. **Get your database connection string:**
   ```
   postgresql://user:password@host:5432/database?schema=public
   ```

3. **Configure backend environment:**
   ```bash
   cd backend
   cp env.example .env
   ```
   
   Edit `.env` and add your `DATABASE_URL`

4. **Run database migrations:**
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev --name init
   ```

## Step 3: Configure Environment Variables

### Backend (.env)
```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="generate-a-random-secret-key"
JWT_REFRESH_SECRET="generate-another-random-secret-key"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

Generate secrets:
```bash
# On Linux/Mac
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use any online generator
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="same-or-different-secret"
```

## Step 4: Start Development Servers

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📡 Socket.io server ready
🌍 Environment: development
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

You should see:
```
✓ Ready on http://localhost:3000
```

## Step 5: Verify Setup

1. **Check backend health:**
   - Visit: http://localhost:3001/health
   - Should return: `{"status":"ok",...}`

2. **Check frontend:**
   - Visit: http://localhost:3000
   - Should see the home page

3. **Check database:**
   ```bash
   cd backend
   npx prisma studio
   ```
   - Opens Prisma Studio at http://localhost:5555
   - Verify tables were created

## Step 6: Create Initial Admin User (Optional)

You can create an initial admin user using Prisma Studio or by creating a seed script.

### Option 1: Using Prisma Studio
1. Open Prisma Studio: `npx prisma studio`
2. Navigate to `users` table
3. Click "Add record"
4. Fill in user details:
   - email: admin@example.com
   - password: (hashed - use bcrypt)
   - role: ADMIN
   - etc.

### Option 2: Create Seed Script
Create `backend/prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  
  console.log('Admin user created:', admin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run seed:
```bash
npx ts-node prisma/seed.ts
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if database is accessible
- Ensure database exists
- Test connection: `npx prisma db pull`

### Port Already in Use
- Change `PORT` in `.env` (backend)
- Or kill the process:
  ```bash
  # Windows
  netstat -ano | findstr :3001
  taskkill /PID <PID> /F
  
  # Mac/Linux
  lsof -ti:3001 | xargs kill
  ```

### Prisma Client Not Generated
```bash
cd backend
npx prisma generate
```

### TypeScript Errors
- Run `npm install` again
- Restart your IDE/editor
- Check `tsconfig.json` is correct

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches frontend URL
- Check CORS configuration in `backend/src/server.ts`

## Next Steps

1. ✅ Project structure created
2. ✅ Database setup complete
3. ⏳ Implement authentication endpoints
4. ⏳ Build booking system
5. ⏳ Create dashboards
6. ⏳ Add payment integration

Refer to `PROJECT_PLAN.md` for the complete roadmap.

## Development Tips

- Use Prisma Studio to view/edit database: `npx prisma studio`
- Check backend logs for API errors
- Use browser DevTools for frontend debugging
- Keep both servers running during development

## Need Help?

- Check `PROJECT_PLAN.md` for architecture details
- See `docs/API_ARCHITECTURE.md` for API endpoints
- Review `docs/DATABASE_SCHEMA.md` for database structure
- Check `QUICK_START.md` for quick reference

---

Happy coding! 🚀
