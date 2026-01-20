const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function deleteBarber() {
  const email = 'rabiutemi@gmail.com';
  const phone = '07055699437';
  const name = 'yy yyy yyy';

  try {
    console.log('🔍 Looking for barber to delete...');
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone}`);
    console.log(`Name: ${name}\n`);

    // Try to find by email first
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        barber: true,
      },
    });

    // If not found by email, try by phone
    if (!user) {
      console.log('⚠️  Not found by email, trying phone number...');
      user = await prisma.user.findFirst({
        where: { phone },
        include: {
          barber: true,
        },
      });
    }

    // If still not found, check barber applications
    if (!user) {
      console.log('⚠️  Not found by email or phone, checking barber applications...');
      const application = await prisma.barberApplication.findFirst({
        where: {
          OR: [
            { email },
            { phone },
          ],
        },
        include: {
          user: true,
        },
      });

      if (application) {
        console.log(`\n📋 Found barber application:`);
        console.log(`- Application ID: ${application.id}`);
        console.log(`- Name: ${application.firstName} ${application.lastName}`);
        console.log(`- Email: ${application.email}`);
        console.log(`- Phone: ${application.phone}`);
        console.log(`- Status: ${application.status}`);

        if (application.userId && application.user) {
          user = application.user;
          console.log('\n✅ Found associated user account');
        } else {
          console.log('\n⚠️  No user account created yet. Just deleting application...');
          
          // Delete the application
          await prisma.barberApplication.delete({
            where: { id: application.id },
          });
          console.log('✅ Deleted barber application');
          return;
        }
      }
    }

    if (!user) {
      console.log('❌ User not found with email:', email, 'or phone:', phone);
      console.log('❌ Also checked barber applications - not found');
      return;
    }

    if (user.role !== 'BARBER') {
      console.log('❌ User is not a barber. Role:', user.role);
      return;
    }

    if (!user.barber) {
      console.log('❌ User has no associated barber record');
      return;
    }

    const barberId = user.barber.id;
    const barberUserId = user.barber.userId;

    console.log('\n📊 Found barber:');
    console.log(`- User ID: ${user.id}`);
    console.log(`- Barber ID: ${barberId}`);
    console.log(`- Name: ${user.name}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Phone: ${user.phone || 'N/A'}`);

    // Check for related data
    const bookingsCount = await prisma.booking.count({
      where: { barberId },
    });

    const ordersCount = await prisma.order.count({
      where: { assignedBarberId: barberId },
    });

    const reviewsCount = await prisma.review.count({
      where: { barberId },
    });

    console.log('\n📋 Related data:');
    console.log(`- Bookings: ${bookingsCount}`);
    console.log(`- Orders: ${ordersCount}`);
    console.log(`- Reviews: ${reviewsCount}`);

    // Confirm deletion
    console.log('\n⚠️  WARNING: This will delete:');
    console.log('  - Barber record');
    console.log('  - User account');
    console.log('  - All bookings');
    console.log('  - All reviews');
    console.log('  - Order assignments (orders will remain unassigned)');
    console.log('  - Time slots');
    console.log('  - Availability records');

    // Delete in correct order (respecting foreign keys)
    console.log('\n🗑️  Starting deletion...');

    // 1. Delete reviews (references barber)
    if (reviewsCount > 0) {
      await prisma.review.deleteMany({
        where: { barberId },
      });
      console.log('✅ Deleted reviews');
    }

    // 2. Delete bookings (references barber)
    if (bookingsCount > 0) {
      await prisma.booking.deleteMany({
        where: { barberId },
      });
      console.log('✅ Deleted bookings');
    }

    // 3. Delete time slots (references barber)
    await prisma.timeSlot.deleteMany({
      where: { barberId },
    });
    console.log('✅ Deleted time slots');

    // 4. Delete availability (references barber)
    await prisma.barberAvailability.deleteMany({
      where: { barberId },
    });
    console.log('✅ Deleted availability records');

    // 5. Update orders to remove barber assignment (don't delete orders)
    if (ordersCount > 0) {
      await prisma.order.updateMany({
        where: { assignedBarberId: barberId },
        data: { assignedBarberId: null },
      });
      console.log('✅ Removed barber from orders');
    }

    // 6. Delete services (references barber)
    await prisma.service.deleteMany({
      where: { barberId },
    });
    console.log('✅ Deleted barber services');

    // 7. Update customers who preferred this barber
    await prisma.customer.updateMany({
      where: { preferredBarberId: barberId },
      data: { preferredBarberId: null },
    });
    console.log('✅ Removed from customer preferences');

    // 8. Delete barber record
    await prisma.barber.delete({
      where: { id: barberId },
    });
    console.log('✅ Deleted barber record');

    // 9. Delete user account
    await prisma.user.delete({
      where: { id: user.id },
    });
    console.log('✅ Deleted user account');

    console.log('\n✅ Barber deleted successfully!');
  } catch (error) {
    console.error('\n❌ Error deleting barber:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteBarber()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
