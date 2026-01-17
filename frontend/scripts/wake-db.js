// Simple script to wake up the Neon database
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function wakeDatabase() {
  try {
    console.log('Attempting to connect to database...');
    // Simple query to wake up the database
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful!');
    console.log('Database is now active and ready.');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n💡 Tips:');
    console.log('1. Check if DATABASE_URL is set in .env.local');
    console.log('2. The Neon database may need a few seconds to wake up');
    console.log('3. Try running the script again in a few seconds');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

wakeDatabase()
  .catch((error) => {
    process.exit(1);
  });
