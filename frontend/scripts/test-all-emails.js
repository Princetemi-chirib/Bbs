// Load environment variables
require('dotenv').config({ path: '.env.local' });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const TEST_EMAIL = 'rabiutemi@gmail.com';

const sendEmailViaAPI = async (template, data, subject) => {
  try {
    const response = await fetch(`${API_URL}/api/v1/emails/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ template, data, testEmail: TEST_EMAIL, subject: `[TEST] ${subject}` }),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
};

const testData = {
  orderConfirmation: {
    customerName: 'John Doe',
    customerEmail: TEST_EMAIL,
    orderReference: 'ORD-1738368000000-ABC123',
    items: [
      { title: 'Classic Haircut / Beardcut Services', quantity: 1, price: 12000, displayAge: 'Adult' },
      { title: 'Shaving Service', quantity: 2, price: 5500, displayAge: 'Fixed' },
    ],
    total: 23000,
    city: 'Lagos',
    location: 'Victoria Island',
    address: '123 Main Street, Apartment 4B',
    phone: '08012345678',
    paymentReference: 'PSK_REF_123456789',
  },

  barberAssignment: {
    barberName: 'Michael Barber',
    barberEmail: TEST_EMAIL,
    orderNumber: 'ORD-1738368000000-ABC123',
    customerName: 'John Doe',
    customerPhone: '08012345678',
    city: 'Lagos',
    location: 'Victoria Island',
    address: '123 Main Street, Apartment 4B',
    items: [
      { title: 'Classic Haircut / Beardcut Services', quantity: 1 },
      { title: 'Shaving Service', quantity: 2 },
    ],
    totalAmount: 23000,
  },

  barberAccepted: {
    customerName: 'John Doe',
    orderNumber: 'ORD-1738368000000-ABC123',
    barberName: 'Michael Barber',
    barberPhone: '08098765432',
    city: 'Lagos',
    location: 'Victoria Island',
    estimatedArrival: '10 minutes',
  },

  barberOnTheWay: {
    customerName: 'John Doe',
    orderNumber: 'ORD-1738368000000-ABC123',
    barberName: 'Michael Barber',
    barberPhone: '08098765432',
    estimatedArrival: '5 minutes',
    city: 'Lagos',
    location: 'Victoria Island',
  },

  barberArrived: {
    customerName: 'John Doe',
    orderNumber: 'ORD-1738368000000-ABC123',
    barberName: 'Michael Barber',
    barberPhone: '08098765432',
  },

  serviceComplete: {
    customerName: 'John Doe',
    orderNumber: 'ORD-1738368000000-ABC123',
    barberName: 'Michael Barber',
    items: [
      { title: 'Classic Haircut / Beardcut Services', quantity: 1 },
      { title: 'Shaving Service', quantity: 2 },
    ],
    totalAmount: 23000,
    reviewLink: `${API_URL}/review/ORD-1738368000000-ABC123`,
  },

  barberDeclined: {
    adminEmail: TEST_EMAIL,
    orderNumber: 'ORD-1738368000000-ABC123',
    customerName: 'John Doe',
    barberName: 'Michael Barber',
    declineReason: 'Currently unavailable - Personal emergency',
    city: 'Lagos',
    location: 'Victoria Island',
  },
};

async function sendTestEmails() {
  console.log('📧 Starting email template tests...\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Sending all emails to: ${TEST_EMAIL}\n`);

  // Check if server is running
  try {
    const healthCheck = await fetch(`${API_URL}/api/v1/health`);
    if (!healthCheck.ok) {
      console.log('⚠️  Warning: Health check failed. Make sure your Next.js server is running (npm run dev)\n');
    }
  } catch (error) {
    console.log('⚠️  Warning: Could not connect to server. Make sure your Next.js server is running (npm run dev)\n');
  }

  const results = [];
  const tests = [
    { name: 'Order Confirmation', template: 'orderConfirmation', data: testData.orderConfirmation, subject: 'Order Confirmation - ORD-1738368000000-ABC123' },
    { name: 'Barber Assignment', template: 'barberAssignment', data: testData.barberAssignment, subject: 'New Order Assigned - ORD-1738368000000-ABC123' },
    { name: 'Barber Accepted', template: 'barberAccepted', data: testData.barberAccepted, subject: 'Barber Accepted Your Order - ORD-1738368000000-ABC123' },
    { name: 'Barber On The Way', template: 'barberOnTheWay', data: testData.barberOnTheWay, subject: 'Your Barber is On The Way! - ORD-1738368000000-ABC123' },
    { name: 'Barber Arrived', template: 'barberArrived', data: testData.barberArrived, subject: 'Your Barber Has Arrived! - ORD-1738368000000-ABC123' },
    { name: 'Service Complete', template: 'serviceComplete', data: testData.serviceComplete, subject: 'Service Completed! - ORD-1738368000000-ABC123' },
    { name: 'Barber Declined', template: 'barberDeclined', data: testData.barberDeclined, subject: 'Order Declined by Barber - ORD-1738368000000-ABC123' },
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    try {
      console.log(`${i + 1}️⃣  Sending ${test.name} Email...`);
      const result = await sendEmailViaAPI(test.template, test.data, test.subject);
      results.push({ name: test.name, success: result.success, error: result.error?.message || result.error });
      if (result.success) {
        console.log('✅ Sent successfully');
        if (result.data?.previewUrl) {
          console.log(`   Preview: ${result.data.previewUrl}`);
        }
      } else {
        console.log(`❌ Failed: ${result.error?.message || result.error || 'Unknown error'}`);
      }
      console.log('');
    } catch (error) {
      results.push({ name: test.name, success: false, error: error.message });
      console.log(`❌ Error: ${error.message}\n`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${result.name}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${results.length} | ✅ Successful: ${successful} | ❌ Failed: ${failed}`);
  console.log('-'.repeat(60) + '\n');

  if (successful === results.length) {
    console.log('🎉 All emails sent successfully!');
    console.log(`📬 Check your inbox at: ${TEST_EMAIL}\n`);
  } else {
    console.log('⚠️  Some emails failed to send. Check the errors above.\n');
  }
}

// Run the test
sendTestEmails()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    // Clean up if needed
    setTimeout(() => process.exit(0), 2000);
  });
