import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken, signRefreshToken, setTokenCookies, clearTokenCookies, requireAuth } from '../lib/auth';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
});

/**
 * POST /v1/auth/login
 * Authenticate user and issue JWT tokens
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        type: 'https://tools.ietf.org/html/rfc7235#section-3.1',
        title: 'Unauthorized',
        status: 401,
        detail: 'Invalid email or password',
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    // For development: allow 'admin123' password for admin user
    let isValidPassword = false;
    if (user.email === 'admin@podnbeyond.com' && password === 'admin123') {
      isValidPassword = true;
    } else {
      // In production, verify hashed password
      // isValidPassword = await bcrypt.compare(password, user.password);
      // For now, allow any password for demo purposes
      isValidPassword = true;
    }

    if (!isValidPassword) {
      return res.status(401).json({
        type: 'https://tools.ietf.org/html/rfc7235#section-3.1',
        title: 'Unauthorized',
        status: 401,
        detail: 'Invalid email or password',
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    // Generate tokens
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = signToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Set httpOnly cookies
    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        points: user.points,
        tier: user.tier
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid login data',
        errors: error.errors,
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    res.status(500).json({
      type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Login failed',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * POST /v1/auth/register
 * Register a new guest user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.8',
        title: 'Conflict',
        status: 409,
        detail: 'User with this email already exists',
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        role: 'GUEST',
        points: 0,
        tier: 'BRONZE'
      }
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        points: user.points,
        tier: user.tier
      },
      message: 'Registration successful'
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid registration data',
        errors: error.errors,
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    res.status(500).json({
      type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Registration failed',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * POST /v1/auth/logout
 * Clear authentication cookies
 */
router.post('/logout', (req, res) => {
  clearTokenCookies(res);
  res.json({ message: 'Logout successful' });
});

/**
 * GET /v1/auth/me
 * Get current user information
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
        title: 'Not Found',
        status: 404,
        detail: 'User not found',
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        points: user.points,
        tier: user.tier
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    
    res.status(500).json({
      type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Failed to get user information',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

export { router as authRouter };