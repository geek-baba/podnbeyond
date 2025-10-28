# Pod & Beyond - Development Runbook

## Prerequisites

- **Node.js**: Version 18 or higher
- **Docker**: For running PostgreSQL and other services
- **Package Manager**: npm, yarn, or pnpm

## Quick Start

### 1. Environment Setup

```bash
# Clone the repository (if not already done)
# cd podnbeyond

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### 2. Database Setup

```bash
# Start PostgreSQL and MailHog
docker compose up -d postgres mailhog

# Wait for PostgreSQL to be ready (check with docker compose logs postgres)

# Generate Prisma client and run migrations
cd apps/api
npx prisma generate
npx prisma migrate dev --name init

# Seed the database with sample data
npx prisma db seed
```

### 3. Start Development Servers

```bash
# From the root directory, start all services
npm run dev

# Or start individual services:
# API server (port 4000)
cd apps/api && npm run dev

# Web server (port 3000) - in another terminal
cd apps/web && npm run dev
```

### 4. Access the Application

- **Web Application**: http://localhost:3000
- **API Server**: http://localhost:4000
- **API Health Check**: http://localhost:4000/healthz
- **MailHog (Email Testing)**: http://localhost:8025
- **Prisma Studio**: `cd apps/api && npx prisma studio` (port 5555)

## Default Credentials

### Admin Login
- **Email**: admin@podnbeyond.com
- **Password**: admin123

### Sample Data
- **Room Types**: Deluxe Room (₹5000/night), Executive Suite (₹8000/night)
- **Inventory**: 7 days starting from today with available rooms
- **Rate Plan**: Best Available Rate (refundable)

## Environment Variables

### Required Variables
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/podnbeyond
JWT_SECRET=your-secure-jwt-secret-here
JWT_REFRESH_SECRET=your-secure-refresh-secret-here
```

### Optional Variables (for full functionality)
```bash
# Razorpay (for payment processing)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Channel Manager (for OTA integration)
BEDS24_API_URL=https://beds24.com/api/v2
BEDS24_API_KEY=your_api_key
BEDS24_HOTEL_CODE=your_hotel_code
```

## Docker Compose (Full Stack)

```bash
# Start all services including API and Web
docker compose up

# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

## Development Commands

### Database Operations
```bash
cd apps/api

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset --force

# Create new migration
npx prisma migrate dev --name your_migration_name

# Deploy migrations to production
npx prisma migrate deploy

# View database in browser
npx prisma studio
```

### Code Quality
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Code formatting
npm run format

# Build all packages
npm run build
```

## Testing the Application

### 1. Basic Functionality Test
1. Visit http://localhost:3000
2. Search for rooms (use default dates)
3. Select a room and proceed to checkout
4. Fill in guest details and submit
5. Payment will be stubbed if Razorpay is not configured

### 2. Admin Functionality Test
1. Visit http://localhost:3000/admin
2. Login with admin credentials
3. Navigate to dashboard and explore admin features

### 3. API Testing
```bash
# Health check
curl http://localhost:4000/healthz

# Search availability
curl "http://localhost:4000/v1/availability?checkIn=2024-01-15&checkOut=2024-01-17&guests=2"

# Admin login (get auth cookies)
curl -X POST http://localhost:4000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@podnbeyond.com","password":"admin123"}' \
  -c cookies.txt

# Get room types (requires auth)
curl http://localhost:4000/v1/admin/room-types -b cookies.txt
```

## Razorpay Integration

### Sandbox Setup
1. Create account at https://dashboard.razorpay.com/
2. Get test API keys from Dashboard > Settings > API Keys
3. Add keys to `.env` file
4. Test payments will work with test card numbers

### Test Card Numbers
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

#### Port Already in Use
```bash
# Find process using port 3000 or 4000
lsof -i :3000
lsof -i :4000

# Kill process
kill -9 <PID>
```

#### Prisma Client Issues
```bash
cd apps/api
npx prisma generate
npm run build
```

#### Module Not Found Errors
```bash
# Clean install
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
```

### Performance Issues
- Ensure Docker has sufficient memory (4GB+ recommended)
- Use `npm run build` for production builds
- Check database query performance in Prisma Studio

## Production Deployment

### Environment Variables for Production
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-host:5432/podnbeyond
JWT_SECRET=secure-random-string-32-chars-min
JWT_REFRESH_SECRET=another-secure-random-string
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_live_key_secret
WEB_URL=https://your-domain.com
API_URL=https://api.your-domain.com
```

### Build Commands
```bash
# Build all packages
npm run build

# Database migrations
cd apps/api && npx prisma migrate deploy

# Start production servers
npm run start
```

## Support

### Logs Location
- **API Logs**: Console output with structured logging
- **Web Logs**: Next.js console output
- **Database Logs**: Docker compose logs postgres
- **Email Logs**: MailHog web interface

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# API only
cd apps/api && DEBUG=* npm run dev
```

For additional support, check the application logs and ensure all environment variables are properly configured.