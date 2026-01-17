import { Router } from 'express';
import { emailController } from '../controllers/emailController';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Email routes
router.post('/emails/order-confirmation', emailController.sendOrderConfirmation);
router.post('/emails/test', emailController.testEmail);

// Placeholder routes - to be implemented
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Barber Booking System API v1',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      emails: {
        orderConfirmation: 'POST /emails/order-confirmation',
        test: 'POST /emails/test',
      },
      auth: '/auth/*',
      barbers: '/barbers/*',
      bookings: '/bookings/*',
      // More endpoints to be added
    },
  });
});

export default router;
