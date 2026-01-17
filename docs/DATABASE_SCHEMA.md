# Database Schema Documentation

See the Prisma schema file at `backend/prisma/schema.prisma` for the complete database schema.

## Overview

The database uses PostgreSQL with Prisma ORM. All models and relationships are defined in the Prisma schema.

## Key Models

- **User**: Base user table with roles (CUSTOMER, BARBER, ADMIN, REP)
- **Barber**: Barber profiles extending User
- **Customer**: Customer profiles extending User
- **Booking**: Core booking/reservation table
- **Service**: Services offered by barbers
- **TimeSlot**: Available time slots
- **Review**: Customer reviews and ratings
- **Payment**: Payment records
- **Notification**: In-app notifications

## Relationships

- User → Barber (1:1)
- User → Customer (1:1)
- Barber → Services (1:many)
- Barber → Bookings (1:many)
- Customer → Bookings (1:many)
- Booking → Payment (1:1)
- Booking → Review (1:1)

## See Also

- [PROJECT_PLAN.md](../PROJECT_PLAN.md) - Complete project documentation
- [Prisma Schema](../backend/prisma/schema.prisma) - Complete schema definition
