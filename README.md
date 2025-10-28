# Pod & Beyond 🏨

A modern hotel booking platform built with Next.js, Express, and Prisma. Features a complete booking flow, admin dashboard, loyalty system, and channel manager integration.

## ✨ Features

- **Guest Booking Flow** - Search rooms, book, and pay with Razorpay
- **Admin Dashboard** - Manage rooms, inventory, rates, and bookings
- **Loyalty System** - Earn and redeem points with tier benefits
- **Channel Manager** - OTA integration framework (Beds24 ready)
- **Payment Processing** - Secure payments with Razorpay webhooks
- **Responsive Design** - Mobile-first UI with Tailwind CSS
- **Type Safety** - Full TypeScript coverage with strict mode
- **Real-time Updates** - Live inventory and booking status

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm/yarn/pnpm

### Development Setup

```bash
# Clone the repository
git clone https://github.com/geek-baba/podnbeyond.git
cd podnbeyond

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start database and services
docker compose up -d postgres mailhog

# Set up database
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Start development servers
cd ../..
npm run dev
```

### Access the Application

- **Web App**: http://localhost:3000
- **API**: http://localhost:4000/healthz
- **Admin**: http://localhost:3000/admin (admin@podnbeyond.com / admin123)
- **MailHog**: http://localhost:8025

## 🏗️ Architecture

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

## 📁 Project Structure

```
podnbeyond/
├── apps/
│   ├── api/                 # Express API server
│   │   ├── prisma/         # Database schema & migrations
│   │   └── src/            # API routes & business logic
│   └── web/                # Next.js web application
│       └── src/            # Pages, components & utilities
├── packages/
│   └── shared/             # Shared types & validation schemas
├── .github/
│   └── workflows/          # CI/CD pipelines
└── docs/                   # Documentation
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form handling and validation

### Backend
- **Express.js** - Node.js web framework
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Relational database
- **JWT** - Authentication with httpOnly cookies
- **Zod** - Runtime type validation

### Infrastructure
- **Docker** - Containerization and development environment
- **GitHub Actions** - CI/CD pipelines
- **Turbo** - Monorepo build system

### Integrations
- **Razorpay** - Payment processing
- **Beds24** - Channel manager (framework ready)
- **MailHog** - Email testing in development

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start all services
npm run build        # Build all packages
npm run typecheck    # Type checking
npm run lint         # Code linting
npm run format       # Code formatting

# Database
cd apps/api
npx prisma studio    # Database GUI
npx prisma migrate   # Run migrations
npx prisma db seed   # Seed sample data
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/podnbeyond
JWT_SECRET=your-secure-secret-here

# Optional (for full functionality)
RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_secret
BEDS24_API_KEY=your_beds24_key
```

## 🧪 Testing

The project includes comprehensive testing setup:

- **Unit Tests** - Jest for API business logic
- **Integration Tests** - API endpoint testing
- **E2E Tests** - Playwright for user journeys
- **Type Checking** - TypeScript strict mode

```bash
npm run test         # Run all tests
npm run test:e2e     # Run Playwright tests
```

## 🚀 Deployment

### Docker Production

```bash
# Build images
docker build -t podnbeyond-api -f apps/api/Dockerfile .
docker build -t podnbeyond-web -f apps/web/Dockerfile .

# Run with docker-compose
docker compose -f docker-compose.prod.yml up
```

### CI/CD

GitHub Actions workflows handle:

- **CI** - Lint, test, and build on PRs
- **Preview** - Deploy preview environments for PRs
- **Release** - Publish Docker images on main branch

See [CI Documentation](.github/CI_README.md) for details.

## 📊 Features Deep Dive

### Booking Flow
1. **Search** - Real-time availability with pricing
2. **Selection** - Room details with amenities
3. **Checkout** - Guest details and payment
4. **Payment** - Secure Razorpay integration
5. **Confirmation** - Email receipt and booking reference

### Admin Dashboard
- **Room Management** - Types, amenities, pricing
- **Inventory Calendar** - Availability by date
- **Booking Management** - View and manage reservations
- **Rate Plans** - Flexible pricing strategies
- **Channel Manager** - OTA sync and mapping

### Loyalty Program
- **Points Earning** - 1 point per ₹100 spent
- **Tier System** - Bronze, Silver, Gold, Platinum
- **Redemption** - 1 point = ₹1 discount
- **Benefits** - Tier-based perks and multipliers

## 🔌 Integrations

### Razorpay Setup
1. Create account at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Get API keys from Settings > API Keys
3. Add to environment variables
4. Configure webhook endpoints

### Channel Manager
The system includes a flexible channel manager framework:

- **Provider Interface** - Standardized OTA integration
- **Beds24 Adapter** - Ready-to-use implementation
- **Sync Jobs** - Automated inventory and booking sync
- **Audit Logging** - Complete sync history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Development Runbook](docs/DEV_RUNBOOK.md)
- **Issues**: [GitHub Issues](https://github.com/geek-baba/podnbeyond/issues)
- **Discussions**: [GitHub Discussions](https://github.com/geek-baba/podnbeyond/discussions)

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by leading hotel booking platforms
- Designed for scalability and maintainability

---

**Pod & Beyond** - Experience comfort and luxury in the heart of the city 🏨✨