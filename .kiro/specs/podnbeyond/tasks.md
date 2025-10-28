# Pod & Beyond — Tasks (MVP)

## Global Conventions

### Coding Standards
- TypeScript strict mode enabled across all packages
- ESLint + Prettier for consistent code formatting
- Zod schemas for all API request/response validation
- Conventional commits for clear change history

### Definition of Done
- [ ] All TypeScript compilation errors resolved
- [ ] ESLint and Prettier checks pass
- [ ] Unit tests written and passing (where applicable)
- [ ] Integration tests cover happy path scenarios
- [ ] Structured logging added for key operations
- [ ] Error handling implemented with proper status codes
- [ ] Documentation updated (API contracts, README)

---

## M0 — Repo & Plumbing

**Goal**: Establish monorepo structure, development environment, and core tooling.

**DoD**: Developer can run `npm run dev` and see Next.js app connecting to Express API with PostgreSQL database.

### Tasks

- [ ] 0.1 Initialize monorepo structure [INF]
  - Create apps/web, apps/api, packages/shared directories
  - Set up package.json with workspaces configuration
  - Configure TypeScript project references
  - _Requirements: Foundation for all development_

- [ ] 0.2 Set up shared package with core types [S]
  - Create packages/shared with TypeScript configuration
  - Define base types: User, RoomType, Booking, etc.
  - Set up Zod schemas for API validation
  - Export utilities for date handling and formatting
  - _Requirements: 1.1, 2.1, 4.1_

- [ ] 0.3 Configure PostgreSQL with Prisma [INF]
  - Set up Docker Compose with PostgreSQL service
  - Initialize Prisma in apps/api
  - Create initial schema with User, RoomType, Booking models
  - Set up database migrations and seeding
  - _Requirements: 8.1, 8.5_

- [ ] 0.4 Create Express API foundation [A]
  - Initialize Express app with TypeScript
  - Set up middleware: CORS, helmet, rate limiting
  - Configure structured logging with Winston
  - Add health check endpoints (/health, /health/ready)
  - _Requirements: 8.2, 8.4_

- [ ] 0.5 Create Next.js web foundation [W]
  - Initialize Next.js with App Router and TypeScript
  - Configure Tailwind CSS and basic component structure
  - Set up environment configuration
  - Create basic layout and navigation
  - _Requirements: 1.1, 2.1_

- [ ] 0.6 Set up development environment [INF]
  - Complete Docker Compose with all services
  - Add MailHog for email testing
  - Create development scripts and documentation
  - Configure hot reloading for both apps
  - _Requirements: Development efficiency_

---

## M1 — Data Model & Admin Basics

**Goal**: Complete database schema and basic admin interface for managing room types and inventory.

**DoD**: Admin can log in, create room types, and set inventory through web interface. Database properly stores and retrieves data.

### Tasks

- [ ] 1.1 Complete Prisma schema implementation [A]
  - Implement all models: User, RoomType, Inventory, RatePlan, Booking, LoyaltyLedger
  - Add proper indexes and constraints
  - Set up database relationships and cascading rules
  - _Requirements: 4.1, 4.2, 6.1_

- [ ] 1.2 Implement authentication system [A]
  - Create JWT token generation and validation
  - Set up password hashing with bcrypt
  - Implement login/logout endpoints with httpOnly cookies
  - Add middleware for protected routes
  - _Requirements: 8.1, 8.2_

- [ ] 1.3 Create admin authentication UI [W]
  - Build login form with validation
  - Implement authentication state management
  - Add protected route wrapper for admin pages
  - Create logout functionality
  - _Requirements: 4.1, 8.1_

- [ ] 1.4 Build room type management API [A]
  - Create CRUD endpoints for room types
  - Implement validation with Zod schemas
  - Add image upload handling
  - Include proper error responses
  - _Requirements: 4.1, 4.2_

- [ ] 1.5 Build room type management UI [W]
  - Create room type listing page
  - Build form for creating/editing room types
  - Add image upload component
  - Implement delete confirmation
  - _Requirements: 4.1, 4.2_

- [ ] 1.6 Implement inventory management API [A]
  - Create endpoints for bulk inventory updates
  - Build calendar-based inventory queries
  - Add validation for inventory constraints
  - _Requirements: 4.1, 4.3_

- [ ] 1.7 Build inventory calendar UI [W]
  - Create calendar component for inventory management
  - Implement bulk update functionality
  - Add visual indicators for availability levels
  - _Requirements: 4.3_

- [ ]* 1.8 Write unit tests for core models [A]
  - Test Prisma model operations
  - Test authentication functions
  - Test inventory calculation logic
  - _Requirements: 8.5_

---

## M2 — Availability & Booking Flow

**Goal**: Implement guest-facing search, booking, and payment flow with Razorpay integration.

**DoD**: Guest can search for rooms, select dates, enter details, pay via Razorpay sandbox, and receive booking confirmation. Inventory is properly updated.

### Tasks

- [ ] 2.1 Implement availability search API [A]
  - Create availability query endpoint with date/guest filters
  - Implement complex inventory and rate calculations
  - Add room type filtering and sorting
  - Optimize database queries for performance
  - _Requirements: 1.1, 1.2, 1.4_

- [ ] 2.2 Build guest search interface [W]
  - Create search widget with date picker and guest selector
  - Build room search results page with filtering
  - Implement RoomCard component with pricing display
  - Add responsive design for mobile devices
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2.3 Create booking creation API [A]
  - Implement booking creation with inventory validation
  - Add guest details validation and storage
  - Create Razorpay order integration
  - Handle booking expiration (15-minute hold)
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 2.4 Build booking form UI [W]
  - Create guest details collection form
  - Implement booking summary with rate breakdown
  - Add form validation and error handling
  - Build progress indicator for booking flow
  - _Requirements: 2.1, 2.2_

- [ ] 2.5 Integrate Razorpay payment [W]
  - Set up Razorpay SDK in frontend
  - Create payment form component
  - Handle payment success/failure scenarios
  - Implement payment retry mechanism
  - _Requirements: 2.2, 2.3_

- [ ] 2.6 Implement Razorpay webhook handler [A]
  - Create webhook endpoint with signature verification
  - Update booking status based on payment events
  - Handle idempotency for duplicate webhooks
  - Add comprehensive error logging
  - _Requirements: 2.2, 2.4_

- [ ] 2.7 Build booking confirmation flow [W]
  - Create confirmation page with booking details
  - Implement email confirmation (using MailHog in dev)
  - Add booking reference display
  - Handle payment failure scenarios gracefully
  - _Requirements: 2.4, 2.5_

- [ ] 2.8 Add inventory update automation [A]
  - Update available inventory on confirmed bookings
  - Handle inventory restoration on cancellations
  - Add inventory validation before booking confirmation
  - _Requirements: 2.4, 4.1_

- [ ]* 2.9 Write integration tests for booking flow [A]
  - Test complete search to payment flow
  - Test webhook handling scenarios
  - Test inventory update logic
  - _Requirements: 8.5_

- [ ]* 2.10 Add Playwright end-to-end test [W]
  - Test guest booking journey from search to confirmation
  - Include payment flow with Razorpay test mode
  - Verify email confirmation delivery
  - _Requirements: 1.1, 2.1, 2.2, 2.4_

---

## M3 — Taxes/Fees & Policies

**Goal**: Implement accurate GST calculation, service fees, and cancellation policies.

**DoD**: Booking shows detailed price breakdown with GST and service charges. Guests can cancel bookings with appropriate refund calculations.

### Tasks

- [ ] 3.1 Implement pricing engine [A]
  - Create GST calculation functions (12% room, 18% service)
  - Add service charge calculation (10% of room rate)
  - Build detailed price breakdown API
  - Handle multi-night stay calculations
  - _Requirements: Tax compliance, pricing transparency_

- [ ] 3.2 Update booking API with pricing [A]
  - Integrate pricing engine into booking creation
  - Store detailed pricing breakdown in database
  - Update availability API to include pricing
  - _Requirements: 1.2, 2.1_

- [ ] 3.3 Build rate breakdown UI component [W]
  - Create detailed pricing display component
  - Show base rate, service charge, GST breakdown
  - Add total calculation with clear formatting
  - Make component reusable across booking flow
  - _Requirements: 1.2, 2.1_

- [ ] 3.4 Implement cancellation policy engine [A]
  - Create policy evaluation functions
  - Calculate refund amounts based on timing
  - Handle different cancellation scenarios
  - Add policy validation logic
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 3.5 Create booking cancellation API [A]
  - Build cancellation endpoint with policy checks
  - Implement refund calculation and processing
  - Update inventory on cancellation
  - Add cancellation audit logging
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 3.6 Build guest cancellation interface [W]
  - Create booking lookup by reference
  - Display cancellation policy and refund amount
  - Add cancellation confirmation flow
  - Show cancellation status and refund details
  - _Requirements: 7.1, 7.2, 7.3_

- [ ]* 3.7 Write tests for pricing calculations [A]
  - Test GST calculation accuracy
  - Test service charge calculations
  - Test cancellation policy logic
  - _Requirements: Tax compliance accuracy_

---

## M4 — Loyalty (Simple)

**Goal**: Basic loyalty points system with earning and redemption capabilities.

**DoD**: Registered guests earn points on bookings, can view balance, and redeem points for discounts during checkout.

### Tasks

- [ ] 4.1 Implement loyalty points calculation [A]
  - Create points earning rules (1 point per ₹100 spent)
  - Add points redemption logic (₹1 per point)
  - Build loyalty ledger management
  - Handle points expiration (if applicable)
  - _Requirements: 3.1, 3.3, 3.4_

- [ ] 4.2 Create loyalty API endpoints [A]
  - Build points balance query endpoint
  - Create points redemption endpoint
  - Add points earning automation on booking confirmation
  - Include loyalty history retrieval
  - _Requirements: 3.1, 3.2, 3.4_

- [ ] 4.3 Build guest registration system [W]
  - Create user registration form
  - Add email verification flow
  - Implement guest login functionality
  - Build guest dashboard with booking history
  - _Requirements: 3.2, 3.4_

- [ ] 4.4 Add loyalty widget to booking flow [W]
  - Display points balance during checkout
  - Add points redemption interface
  - Show points earning preview
  - Update price breakdown with loyalty discount
  - _Requirements: 3.1, 3.3_

- [ ] 4.5 Create guest account dashboard [W]
  - Display current points balance
  - Show points earning/redemption history
  - List booking history with status
  - Add profile management functionality
  - _Requirements: 3.2, 3.4_

- [ ]* 4.6 Write loyalty system tests [A]
  - Test points calculation accuracy
  - Test redemption validation
  - Test points ledger integrity
  - _Requirements: 3.1, 3.3, 3.4_

---

## M5 — Channel Manager (Phase-1, one provider)

**Goal**: Integrate with one Indian OTA (MakeMyTrip or Beds24 bridge) for inventory and booking synchronization.

**DoD**: Room inventory and rates sync to OTA every 15 minutes. New OTA bookings are pulled every 5 minutes and stored in system.

### Tasks

- [ ] 5.1 Design channel manager architecture [A]
  - Create provider interface abstraction
  - Design room mapping system
  - Plan sync job scheduling
  - Define audit logging structure
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 5.2 Implement provider interface [A]
  - Create base ChannelProvider interface
  - Define data transformation contracts
  - Add error handling and retry logic
  - Build sync result tracking
  - _Requirements: 5.1, 5.2_

- [ ] 5.3 Build MakeMyTrip adapter [A]
  - Implement MMT API client
  - Create data transformation functions
  - Add authentication and request signing
  - Handle MMT-specific error responses
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 5.4 Create channel mapping management [A]
  - Build room type to OTA code mapping API
  - Add mapping validation and testing
  - Create mapping CRUD operations
  - _Requirements: 5.3_

- [ ] 5.5 Implement sync job scheduler [A]
  - Create availability/rate push jobs (15 min interval)
  - Build booking pull jobs (5 min interval)
  - Add job failure handling and alerting
  - Implement sync status tracking
  - _Requirements: 5.1, 5.2_

- [ ] 5.6 Build channel manager admin UI [W]
  - Create OTA mapping management interface
  - Add sync status dashboard
  - Build manual sync trigger functionality
  - Display sync logs and error reports
  - _Requirements: 5.3_

- [ ] 5.7 Add OTA booking processing [A]
  - Parse incoming OTA booking data
  - Create bookings in local system
  - Handle duplicate booking prevention
  - Update inventory automatically
  - _Requirements: 5.2_

- [ ]* 5.8 Write channel manager tests [A]
  - Test provider interface implementations
  - Test data transformation accuracy
  - Test sync job reliability
  - Mock OTA API responses for testing
  - _Requirements: 5.1, 5.2, 5.3_

---

## M6 — Observability, Security Hardening, Backups

**Goal**: Production-ready monitoring, security measures, and data protection.

**DoD**: System has comprehensive logging, monitoring dashboards, security hardening, and automated backup/restore procedures.

### Tasks

- [ ] 6.1 Implement comprehensive logging [A]
  - Add structured logging to all API endpoints
  - Include request IDs for tracing
  - Log security events and errors
  - Set up log rotation and retention
  - _Requirements: 8.5_

- [ ] 6.2 Add security hardening [A]
  - Implement rate limiting per endpoint
  - Add CSRF protection for forms
  - Set up input sanitization
  - Configure security headers
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 6.3 Set up monitoring and metrics [INF]
  - Configure application metrics collection
  - Set up database performance monitoring
  - Add business metrics (bookings, revenue)
  - Create alerting rules for critical issues
  - _Requirements: 8.4, 8.5_

- [ ] 6.4 Implement backup system [INF]
  - Set up automated PostgreSQL backups
  - Create backup verification procedures
  - Document restore procedures
  - Test backup/restore process
  - _Requirements: 8.5_

- [ ] 6.5 Add error tracking and alerting [INF]
  - Set up error tracking service integration
  - Configure alerting for critical errors
  - Add performance monitoring
  - Create incident response procedures
  - _Requirements: 8.4, 8.5_

- [ ] 6.6 Security audit and penetration testing [INF]
  - Conduct security code review
  - Test authentication and authorization
  - Validate input sanitization
  - Check for common vulnerabilities
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 6.7 Create monitoring dashboards [INF]
  - Build system health dashboard
  - Create business metrics dashboard
  - Add OTA sync monitoring
  - Set up automated reporting
  - _Requirements: 6.1, 6.2_

- [ ]* 6.8 Write security tests [A]
  - Test authentication bypass attempts
  - Test input validation edge cases
  - Test rate limiting effectiveness
  - Verify CSRF protection
  - _Requirements: 8.1, 8.2, 8.3_

---

## Prerequisites and Dependencies

### Cross-Milestone Dependencies
- M1 depends on M0 (foundation must be complete)
- M2 depends on M1 (authentication and data models required)
- M3 depends on M2 (booking flow must exist for pricing)
- M4 depends on M2 (booking system required for loyalty)
- M5 depends on M1, M2 (room management and booking system required)
- M6 can run in parallel with M4, M5 (observability is independent)

### External Dependencies
- Razorpay sandbox account and API keys
- MakeMyTrip sandbox API access
- SMTP service for email notifications
- SSL certificates for production deployment

### Testing Strategy
- **Unit Tests**: Core business logic, pricing calculations, authentication
- **Integration Tests**: API endpoints, database operations, external service mocks
- **End-to-End Tests**: Complete user journeys using Playwright
- **Performance Tests**: Load testing for search and booking APIs
- **Security Tests**: Authentication, authorization, input validation

### Acceptance Criteria Summary
**M2 Completion**: Guest can search → select room → pay via Razorpay sandbox → see confirmation; email receipt sent; booking marked PAID; inventory updated.

**M3 Completion**: Booking shows detailed GST breakdown; guest can cancel with appropriate refund calculation.

**M4 Completion**: Registered guest earns points on booking; can redeem points for discount; loyalty ledger entry created.

**M5 Completion**: Room inventory syncs to OTA every 15 minutes; OTA bookings pulled every 5 minutes; mapping management functional.

**M6 Completion**: System logs all operations; monitoring dashboard shows key metrics; automated backups running; security hardening complete.