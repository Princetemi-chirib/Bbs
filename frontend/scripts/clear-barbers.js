const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting to clear all barber-related data...\n');

  try {
    // Step 1: Get all barbers first
    const barbers = await prisma.barber.findMany({
      select: { id: true, userId: true },
    });

    if (barbers.length === 0) {
      console.log('ℹ️  No barbers found in database.');
      return;
    }

    console.log(`Found ${barbers.length} barber(s) to delete.\n`);

    // Step 2: Delete reviews for barbers
    const reviewsDeleted = await prisma.review.deleteMany({
      where: {
        barberId: {
          in: barbers.map((b) => b.id),
        },
      },
    });
    console.log(`✅ Deleted ${reviewsDeleted.count} review(s)`);

    // Step 3: Delete bookings for barbers (this will also cascade delete payments and reviews)
    const bookingsDeleted = await prisma.booking.deleteMany({
      where: {
        barberId: {
          in: barbers.map((b) => b.id),
        },
      },
    });
    console.log(`✅ Deleted ${bookingsDeleted.count} booking(s)`);

    // Step 4: Update orders assigned to barbers (set assignedBarberId to null)
    const ordersUpdated = await prisma.order.updateMany({
      where: {
        assignedBarberId: {
          in: barbers.map((b) => b.id),
        },
      },
      data: {
        assignedBarberId: null,
        jobStatus: 'PENDING_ACCEPTANCE',
      },
    });
    console.log(`✅ Updated ${ordersUpdated.count} order(s) (unassigned barbers)`);

    // Step 5: Update customers who preferred these barbers (set preferredBarberId to null)
    const customersUpdated = await prisma.customer.updateMany({
      where: {
        preferredBarberId: {
          in: barbers.map((b) => b.id),
        },
      },
      data: {
        preferredBarberId: null,
      },
    });
    console.log(`✅ Updated ${customersUpdated.count} customer(s) (removed preferred barber)`);

    // Step 6: Delete services (they cascade from barber, but let's be explicit)
    const servicesDeleted = await prisma.service.deleteMany({
      where: {
        barberId: {
          in: barbers.map((b) => b.id),
        },
      },
    });
    console.log(`✅ Deleted ${servicesDeleted.count} service(s)`);

    // Step 7: Delete time slots (they cascade from barber, but let's be explicit)
    const timeSlotsDeleted = await prisma.timeSlot.deleteMany({
      where: {
        barberId: {
          in: barbers.map((b) => b.id),
        },
      },
    });
    console.log(`✅ Deleted ${timeSlotsDeleted.count} time slot(s)`);

    // Step 8: Delete barber availability (they cascade from barber, but let's be explicit)
    const availabilityDeleted = await prisma.barberAvailability.deleteMany({
      where: {
        barberId: {
          in: barbers.map((b) => b.id),
        },
      },
    });
    console.log(`✅ Deleted ${availabilityDeleted.count} availability record(s)`);

    // Step 9: Delete barbers (they cascade from users, but let's be explicit)
    const barbersDeleted = await prisma.barber.deleteMany({
      where: {
        id: {
          in: barbers.map((b) => b.id),
        },
      },
    });
    console.log(`✅ Deleted ${barbersDeleted.count} barber(s)`);

    // Step 10: Delete users with BARBER role
    const usersDeleted = await prisma.user.deleteMany({
      where: {
        role: 'BARBER',
      },
    });
    console.log(`✅ Deleted ${usersDeleted.count} user(s) with BARBER role`);

    console.log('\n✨ All barber-related data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing barber data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
