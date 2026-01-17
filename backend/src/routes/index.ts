import { Router } from 'express';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Placeholder routes - to be implemented
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Barber Booking System API v1',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth/*',
      barbers: '/barbers/*',
      bookings: '/bookings/*',
      // More endpoints to be added
    },
  });
});

export default router;
