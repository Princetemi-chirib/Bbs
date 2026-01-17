# API Architecture Documentation

See [PROJECT_PLAN.md](../PROJECT_PLAN.md) for the complete API documentation section with all endpoints.

## Quick Reference

### Base URL
- Development: `http://localhost:3001/api/v1`
- Production: `https://api.yourdomain.com/api/v1`

### Authentication
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Success"
}
```

## Main Endpoint Categories

1. **Authentication** (`/auth/*`)
   - Register, Login, Refresh, Forgot Password

2. **Barbers** (`/barbers/*`)
   - List, Get details, Services, Availability

3. **Bookings** (`/bookings/*`)
   - Create, Update, Cancel, Get bookings

4. **Payments** (`/payments/*`)
   - Process payment, Get history, Refunds

5. **Reviews** (`/reviews/*`)
   - Create, List, Respond

6. **Admin** (`/admin/*`)
   - Dashboard, User management, Analytics

## See Also

- [PROJECT_PLAN.md](../PROJECT_PLAN.md) - Detailed API documentation
- [Backend README](../backend/README.md) - Backend setup guide
