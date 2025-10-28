import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../lib/auth';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

/**
 * GET /v1/loyalty/me
 * Get current user's loyalty information
 */
router.get('/me', async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Get user with current points
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        points: true,
        tier: true
      }
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

    // Get recent loyalty transactions
    const recentTransactions = await prisma.loyaltyLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Calculate tier benefits
    const tierBenefits = {
      BRONZE: { multiplier: 1, perks: ['Basic support'] },
      SILVER: { multiplier: 1.2, perks: ['Priority support', 'Late checkout'] },
      GOLD: { multiplier: 1.5, perks: ['Priority support', 'Late checkout', 'Room upgrade'] },
      PLATINUM: { multiplier: 2, perks: ['Dedicated support', 'Late checkout', 'Room upgrade', 'Complimentary breakfast'] }
    };

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points,
        tier: user.tier,
        benefits: tierBenefits[user.tier as keyof typeof tierBenefits] || tierBenefits.BRONZE
      },
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        points: tx.points,
        type: tx.type,
        ref: tx.ref,
        createdAt: tx.createdAt
      })),
      pointsValue: {
        currency: 'INR',
        rate: 1, // 1 point = ₹1
        description: 'Each point is worth ₹1 when redeemed'
      }
    });

  } catch (error) {
    console.error('Get loyalty info error:', error);
    
    res.status(500).json({
      type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Failed to get loyalty information',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * POST /v1/loyalty/redeem
 * Redeem loyalty points (for future use in booking flow)
 */
router.post('/redeem', async (req, res) => {
  try {
    const { points, bookingId } = z.object({
      points: z.number().min(1),
      bookingId: z.string().cuid().optional()
    }).parse(req.body);

    const userId = req.user!.id;
    
    // Get user's current points
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true }
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

    if (user.points < points) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Insufficient points',
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    // Create redemption transaction
    await prisma.loyaltyLedger.create({
      data: {
        userId,
        points: -points, // Negative for redemption
        type: 'REDEEM',
        ref: bookingId
      }
    });

    // Update user points
    await prisma.user.update({
      where: { id: userId },
      data: { points: { decrement: points } }
    });

    res.json({
      message: 'Points redeemed successfully',
      pointsRedeemed: points,
      discountAmount: points, // 1 point = ₹1
      remainingPoints: user.points - points
    });

  } catch (error) {
    console.error('Redeem points error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid redemption data',
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
      detail: 'Failed to redeem points',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

export { router as loyaltyRouter };