import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { randomUUID } from 'crypto';
import { env } from './lib/env';
import { prisma } from './lib/prisma';

// Route imports
import { availabilityRouter } from './routes/availability';
import { bookingsRouter } from './routes/bookings';
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { loyaltyRouter } from './routes/loyalty';
import { channelRouter } from './routes/channel';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: env.WEB_URL,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Logging
app.use(morgan('combined'));

// Health checks
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/readyz', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'ready', 
      db: true, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(503).json({ 
      status: 'not ready', 
      db: false, 
      error: 'Database connection failed',
      timestamp: new Date().toISOString() 
    });
  }
});

// API Routes
app.use('/v1/auth', authRouter);
app.use('/v1/availability', availabilityRouter);
app.use('/v1/bookings', bookingsRouter);
app.use('/v1/admin', adminRouter);
app.use('/v1/loyalty', loyaltyRouter);
app.use('/v1/channel', channelRouter);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  const errorResponse = {
    type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
    title: 'Internal Server Error',
    status: err.status || 500,
    detail: err.message || 'An unexpected error occurred',
    instance: req.url,
    timestamp: new Date().toISOString(),
    requestId: req.id
  };

  res.status(errorResponse.status).json(errorResponse);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
    title: 'Not Found',
    status: 404,
    detail: `The requested resource ${req.url} was not found`,
    instance: req.url,
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Pod & Beyond API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
  console.log(`🔍 Ready check: http://localhost:${PORT}/readyz`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}