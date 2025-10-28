# Pod & Beyond — Design (MVP)

## 1. Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js Web   │◄──►│  Express API    │◄──►│   PostgreSQL    │
│   (apps/web)    │    │   (apps/api)    │    │   + Prisma      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Razorpay      │              │
         │              │   Webhooks      │              │
         │              └─────────────────┘              │
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│ Channel Manager │◄─────────────┘
                        │ OTA Integration │
                        └─────────────────┘
```

### Data Flow: Search → Book → Pay → Confirm
1. **Search**: Guest searches → API queries inventory → Returns available rooms with rates
2. **Book**: Guest selects room → API creates pending booking → Razorpay order created
3. **Pay**: Payment processed → Razorpay webhook → API verifies signature → Updates booking status
4. **Confirm**: Booking confirmed → Email sent → Inventory updated → Loyalty points awarded → OTA sync triggered

### OTA Provider Adapter
- Abstract provider interface for channel manager integration
- Sync jobs: Push availability/rates every 15 minutes, pull reservations every 5 minutes
- Audit logging for all OTA communications

## 2. Next.js (apps/web)

### Routes
- `/` - Homepage with search widget
- `/rooms` - Room search results and filtering
- `/book` - Room selection and guest details
- `/checkout` - Payment processing
- `/confirm` - Booking confirmation
- `/account` - Guest dashboard and loyalty points
- `/admin/*` - Hotel administration interface

### SSR/ISR Strategy
- Homepage: Static generation with ISR (revalidate: 3600)
- Room search: Server-side rendering for SEO
- Booking flow: Client-side rendering for interactivity
- Admin pages: Client-side rendering with authentication

### State Management
- Server Actions for form submissions (booking, admin operations)
- REST API calls for search and real-time data
- React Query for caching and synchronization
- Zustand for client-side state (cart, user session)

### Reusable UI Components
- `RoomCard` - Room display with images, amenities, pricing
- `RateBreakdown` - Detailed pricing with taxes and fees
- `InventoryCalendar` - Admin calendar for availability management
- `BookingForm` - Guest details collection
- `PaymentForm` - Razorpay integration component
- `LoyaltyWidget` - Points display and redemption
- `SearchWidget` - Date picker and occupancy selector

## 3. Express API (apps/api)

### REST Endpoints

#### Guest Booking Flow
```typescript
GET /v1/availability
// Query: checkIn, checkOut, guests, roomTypeId?
// Response: AvailableRoom[]

POST /v1/bookings
// Body: CreateBookingDTO
// Response: BookingWithPaymentOrder

POST /v1/webhooks/razorpay
// Body: RazorpayWebhookPayload
// Response: { success: boolean }

POST /v1/bookings/:id/cancel
// Response: CancellationResult
```

#### Authentication
```typescript
POST /v1/auth/login
POST /v1/auth/logout
POST /v1/auth/refresh
GET /v1/auth/me
```

#### Admin CRUD
```typescript
GET /v1/admin/room-types
POST /v1/admin/room-types
PUT /v1/admin/room-types/:id

GET /v1/admin/inventory
PUT /v1/admin/inventory/bulk

GET /v1/admin/rate-plans
POST /v1/admin/rate-plans
```

#### Loyalty
```typescript
GET /v1/loyalty/me
POST /v1/loyalty/redeem
```

#### Channel Manager
```typescript
GET /v1/channel/mappings
POST /v1/channel/mappings
POST /v1/channel/sync/trigger
```

### Schema Examples (Zod)
```typescript
const CreateBookingSchema = z.object({
  roomTypeId: z.string().uuid(),
  checkIn: z.string().date(),
  checkOut: z.string().date(),
  guests: z.number().min(1).max(4),
  guestDetails: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/)
  }),
  loyaltyPointsToRedeem: z.number().min(0).optional()
});

const AvailabilityQuerySchema = z.object({
  checkIn: z.string().date(),
  checkOut: z.string().date(),
  guests: z.number().min(1).max(4),
  roomTypeId: z.string().uuid().optional()
});
```

### Error Model
```typescript
interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId: string;
}

// Status Codes:
// 400 - Validation errors
// 401 - Authentication required
// 403 - Insufficient permissions
// 404 - Resource not found
// 409 - Conflict (e.g., room no longer available)
// 429 - Rate limit exceeded
// 500 - Internal server error
```

## 4. Data Model (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  firstName String
  lastName  String
  phone     String?
  /// @encrypted
  password  String
  role      UserRole @default(GUEST)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  bookings      Booking[]
  loyaltyLedger LoyaltyLedger[]

  @@map("users")
}

model RoomType {
  id          String @id @default(cuid())
  name        String
  description String
  maxGuests   Int
  amenities   String[] // JSON array
  images      String[] // URLs
  basePrice   Decimal  @db.Decimal(10, 2)
  isActive    Boolean  @default(true)

  inventory       Inventory[]
  ratePlans       RatePlan[]
  bookings        Booking[]
  channelMappings ChannelMapping[]

  @@map("room_types")
}

model Inventory {
  id         String   @id @default(cuid())
  roomTypeId String
  date       DateTime @db.Date
  available  Int
  sold       Int      @default(0)
  blocked    Int      @default(0)

  roomType RoomType @relation(fields: [roomTypeId], references: [id])

  @@unique([roomTypeId, date])
  @@index([date])
  @@map("inventory")
}

model RatePlan {
  id         String      @id @default(cuid())
  roomTypeId String
  name       String
  rate       Decimal     @db.Decimal(10, 2)
  validFrom  DateTime
  validTo    DateTime
  daysOfWeek Int[] // [1,2,3,4,5] for weekdays
  isActive   Boolean     @default(true)
  
  roomType RoomType @relation(fields: [roomTypeId], references: [id])
  
  @@map("rate_plans")
}

model Booking {
  id              String        @id @default(cuid())
  bookingRef      String        @unique
  userId          String?
  roomTypeId      String
  checkIn         DateTime      @db.Date
  checkOut        DateTime      @db.Date
  guests          Int
  status          BookingStatus @default(PENDING)
  
  // Guest details (for non-registered users)
  guestFirstName  String
  guestLastName   String
  guestEmail      String
  guestPhone      String?
  
  // Pricing
  roomRate        Decimal       @db.Decimal(10, 2)
  taxAmount       Decimal       @db.Decimal(10, 2)
  totalAmount     Decimal       @db.Decimal(10, 2)
  loyaltyDiscount Decimal       @db.Decimal(10, 2) @default(0)
  
  // Payment
  razorpayOrderId String?
  razorpayPaymentId String?
  paidAt          DateTime?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user     User?     @relation(fields: [userId], references: [id])
  roomType RoomType  @relation(fields: [roomTypeId], references: [id])

  @@index([checkIn, checkOut])
  @@index([status])
  @@map("bookings")
}

model LoyaltyLedger {
  id        String            @id @default(cuid())
  userId    String
  type      LoyaltyActionType
  points    Int
  bookingId String?
  createdAt DateTime          @default(now())

  user User @relation(fields: [userId], references: [id])

  @@map("loyalty_ledger")
}

model ChannelMapping {
  id           String @id @default(cuid())
  roomTypeId   String
  provider     String // 'mmtrip', 'beds24'
  externalCode String
  isActive     Boolean @default(true)

  roomType RoomType @relation(fields: [roomTypeId], references: [id])

  @@unique([roomTypeId, provider])
  @@map("channel_mappings")
}

model ProviderPayload {
  id        String   @id @default(cuid())
  provider  String
  operation String   // 'push_rates', 'pull_bookings'
  payload   Json
  response  Json?
  success   Boolean
  createdAt DateTime @default(now())

  @@index([provider, operation, createdAt])
  @@map("provider_payloads")
}

enum UserRole {
  GUEST
  ADMIN
}

enum BookingStatus {
  PENDING
  PAID
  CONFIRMED
  CANCELLED
  REFUNDED
}

enum LoyaltyActionType {
  EARNED
  REDEEMED
  EXPIRED
}
```

## 5. Pricing/Tax Engine

### GST and Service Fee Calculation
```typescript
interface PriceBreakdown {
  baseRate: number;
  serviceCharge: number; // 10% of base rate
  gstOnRoom: number;     // 12% of base rate
  gstOnService: number;  // 18% of service charge
  totalTax: number;
  totalAmount: number;
}

function calculatePricing(baseRate: number, nights: number): PriceBreakdown {
  const roomTotal = baseRate * nights;
  const serviceCharge = roomTotal * 0.10;
  const gstOnRoom = roomTotal * 0.12;
  const gstOnService = serviceCharge * 0.18;
  const totalTax = gstOnRoom + gstOnService;
  
  return {
    baseRate: roomTotal,
    serviceCharge,
    gstOnRoom,
    gstOnService,
    totalTax,
    totalAmount: roomTotal + serviceCharge + totalTax
  };
}
```

### Cancellation Policy
- Free cancellation: 24 hours before check-in
- Partial refund: 50% if cancelled within 24 hours
- No refund: No-show or same-day cancellation

## 6. Payments (Razorpay)

### Order Creation Flow
```typescript
async function createRazorpayOrder(booking: Booking) {
  const order = await razorpay.orders.create({
    amount: Math.round(booking.totalAmount * 100), // paise
    currency: 'INR',
    receipt: booking.bookingRef,
    notes: {
      bookingId: booking.id,
      roomType: booking.roomTypeId
    }
  });
  
  return order;
}
```

### Webhook Verification
```typescript
async function verifyWebhook(payload: string, signature: string) {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
    
  return signature === expectedSignature;
}
```

### Failure Handling
- Payment timeout: 15-minute booking hold
- Failed payments: Retry mechanism with exponential backoff
- Webhook failures: Dead letter queue with manual reconciliation

## 7. Channel Manager (Phase-1)

### Provider Interface
```typescript
interface ChannelProvider {
  name: string;
  pushAvailability(data: AvailabilityUpdate[]): Promise<SyncResult>;
  pushRates(data: RateUpdate[]): Promise<SyncResult>;
  pullBookings(since: Date): Promise<ExternalBooking[]>;
  testConnection(): Promise<boolean>;
}

interface AvailabilityUpdate {
  roomCode: string;
  date: string;
  available: number;
}

interface RateUpdate {
  roomCode: string;
  date: string;
  rate: number;
}
```

### MakeMyTrip Adapter Example
```typescript
class MakeMyTripAdapter implements ChannelProvider {
  name = 'mmtrip';
  
  async pushAvailability(data: AvailabilityUpdate[]) {
    // Transform to MMT format and POST to their API
    const mmtPayload = data.map(item => ({
      hotel_code: process.env.MMT_HOTEL_CODE,
      room_type_code: item.roomCode,
      date: item.date,
      inventory: item.available
    }));
    
    return this.makeRequest('/inventory/update', mmtPayload);
  }
}
```

### Sync Jobs
- **Push sync**: Triggered on inventory/rate changes + every 15 minutes
- **Pull sync**: Every 5 minutes for new bookings
- **Audit logging**: All requests/responses stored in ProviderPayload table

## 8. Security

### Authentication & Authorization
- JWT access tokens (15 min expiry) + refresh tokens (7 days)
- HttpOnly cookies for token storage
- CSRF protection using double-submit cookie pattern
- Password hashing with bcrypt (12 rounds)

### API Security
- Rate limiting: 100 requests/minute per IP
- Input validation with Zod schemas at API boundary
- CORS configuration for web domain only
- Request/response logging with sanitized PII

### Webhook Security
- Signature verification for Razorpay webhooks
- Idempotency keys for payment processing
- Secret rotation every 90 days

### Data Protection
- PII encryption using pgcrypto extension
- Database connection over SSL
- Environment variable validation on startup

## 9. Observability & Ops

### Logging Strategy
```typescript
interface LogContext {
  requestId: string;
  userId?: string;
  operation: string;
  duration?: number;
  error?: string;
}

// Structured logging with Winston
logger.info('Booking created', {
  requestId: req.id,
  bookingId: booking.id,
  userId: user?.id,
  operation: 'create_booking',
  duration: Date.now() - startTime
});
```

### Key Metrics
- Request latency (p95, p99)
- Booking conversion rate
- Payment success/failure rates
- OTA sync success rates
- Database query performance

### Health Endpoints
- `/health` - Basic health check
- `/health/ready` - Readiness probe (DB connection)
- `/health/live` - Liveness probe

### Backup Strategy
- Nightly PostgreSQL dumps with 7-day retention
- Point-in-time recovery capability
- Automated restore testing weekly

## 10. Deployment & Local Dev

### Docker Compose Services
```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: podnbeyond
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev123
    
  api:
    build: ./apps/api
    depends_on: [postgres]
    environment:
      DATABASE_URL: postgresql://dev:dev123@postgres:5432/podnbeyond
    
  web:
    build: ./apps/web
    depends_on: [api]
    environment:
      NEXT_PUBLIC_API_URL: http://api:3001
    
  mailhog:
    image: mailhog/mailhog
    ports: ["8025:8025"]
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/podnbeyond

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# Channel Manager
MMT_API_URL=https://sandbox.mmtrip.com/api
MMT_HOTEL_CODE=HTL001
MMT_API_KEY=xxx

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
```

### CI Pipeline
1. **Lint & Type Check**: ESLint, TypeScript, Prettier
2. **Unit Tests**: Jest for API, Vitest for shared packages
3. **Integration Tests**: API endpoints with test database
4. **Build**: Docker images for api and web
5. **Deploy**: Preview environment for PRs

## 11. Risks & Assumptions

### Technical Risks
- **OTA API Volatility**: Partner APIs may change without notice
- **Webhook Reliability**: Network issues may cause missed payments
- **Database Performance**: Complex availability queries may slow down

### Business Risks
- **GST Compliance**: Tax calculations must be accurate for Indian market
- **PCI Scope**: Payment handling increases compliance requirements
- **Loyalty Abuse**: Points system vulnerable to gaming

### Mitigation Strategies
- Comprehensive error handling and retry mechanisms
- Regular backup testing and disaster recovery procedures
- Security audits and penetration testing
- Performance monitoring and alerting
- Legal review of terms and privacy policy