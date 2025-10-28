import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../lib/auth';

const router = Router();

// Apply authentication and admin role requirement
router.use(requireAuth);
router.use(requireRole(['ADMIN', 'STAFF']));

// Validation schemas
const createMappingSchema = z.object({
  provider: z.string().min(1),
  roomTypeId: z.string().cuid(),
  providerCode: z.string().min(1),
});

/**
 * GET /v1/channel/mappings
 * Get all channel mappings
 */
router.get('/mappings', async (req, res) => {
  try {
    const mappings = await prisma.channelMapping.findMany({
      include: {
        roomType: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ mappings });

  } catch (error) {
    console.error('Get channel mappings error:', error);
    
    res.status(500).json({
      type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Failed to get channel mappings',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * POST /v1/channel/mappings
 * Create a new channel mapping
 */
router.post('/mappings', async (req, res) => {
  try {
    const data = createMappingSchema.parse(req.body);
    
    const mapping = await prisma.channelMapping.create({
      data,
      include: {
        roomType: {
          select: { name: true }
        }
      }
    });

    res.status(201).json({ mapping });

  } catch (error) {
    console.error('Create channel mapping error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid mapping data',
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
      detail: 'Failed to create channel mapping',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * POST /v1/channel/sync/push-availability
 * Manually trigger availability push to OTAs
 */
router.post('/sync/push-availability', async (req, res) => {
  try {
    const { provider, roomTypeId, startDate, endDate } = z.object({
      provider: z.string().optional(),
      roomTypeId: z.string().cuid().optional(),
      startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
      endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
    }).parse(req.body);

    // Get inventory data to push
    const where: any = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    };

    if (roomTypeId) {
      where.roomTypeId = roomTypeId;
    }

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        roomType: {
          include: {
            channelMappings: {
              where: provider ? { provider } : {}
            }
          }
        }
      }
    });

    // Log the sync operation
    const payload = {
      action: 'push_availability',
      provider: provider || 'all',
      roomTypeId,
      startDate,
      endDate,
      inventoryCount: inventory.length,
      timestamp: new Date().toISOString()
    };

    await prisma.providerPayload.create({
      data: {
        provider: provider || 'all',
        direction: 'push',
        kind: 'availability',
        payload
      }
    });

    // TODO: Implement actual OTA API calls here
    console.log('🔄 Availability push triggered:', payload);

    res.json({
      message: 'Availability push triggered successfully',
      payload,
      inventoryRecords: inventory.length
    });

  } catch (error) {
    console.error('Push availability error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid sync data',
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
      detail: 'Failed to push availability',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * POST /v1/channel/sync/pull-reservations
 * Manually trigger reservation pull from OTAs
 */
router.post('/sync/pull-reservations', async (req, res) => {
  try {
    const { provider, since } = z.object({
      provider: z.string().optional(),
      since: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid since date').optional(),
    }).parse(req.body);

    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours

    // Log the sync operation
    const payload = {
      action: 'pull_reservations',
      provider: provider || 'all',
      since: sinceDate.toISOString(),
      timestamp: new Date().toISOString()
    };

    await prisma.providerPayload.create({
      data: {
        provider: provider || 'all',
        direction: 'pull',
        kind: 'reservations',
        payload
      }
    });

    // TODO: Implement actual OTA API calls here
    console.log('🔄 Reservation pull triggered:', payload);

    res.json({
      message: 'Reservation pull triggered successfully',
      payload
    });

  } catch (error) {
    console.error('Pull reservations error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid sync data',
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
      detail: 'Failed to pull reservations',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * GET /v1/channel/sync/logs
 * Get sync operation logs
 */
router.get('/sync/logs', async (req, res) => {
  try {
    const { provider, limit = 50 } = req.query;
    
    const where: any = {};
    if (provider) {
      where.provider = provider;
    }

    const logs = await prisma.providerPayload.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    res.json({ logs });

  } catch (error) {
    console.error('Get sync logs error:', error);
    
    res.status(500).json({
      type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Failed to get sync logs',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

export { router as channelRouter };