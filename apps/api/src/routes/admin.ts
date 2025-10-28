import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../lib/auth';

const router = Router();

// Apply authentication and admin role requirement to all routes
router.use(requireAuth);
router.use(requireRole(['ADMIN', 'STAFF']));

// Validation schemas
const createRoomTypeSchema = z.object({
  name: z.string().min(1).max(100),
  capacity: z.number().min(1).max(10),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  baseRate: z.number().min(0),
});

const updateInventorySchema = z.object({
  roomTypeId: z.string().cuid(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  allotment: z.number().min(0),
});

const createRatePlanSchema = z.object({
  name: z.string().min(1).max(100),
  refundable: z.boolean().default(true),
  discountPct: z.number().min(0).max(100).optional(),
});

/**
 * GET /v1/admin/room-types
 * List all room types
 */
router.get('/room-types', async (req, res) => {
  try {
    const roomTypes = await prisma.roomType.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({ roomTypes });

  } catch (error) {
    console.error('Get room types error:', error);
    
    res.status(500).json({
      type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Failed to get room types',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * POST /v1/admin/room-types
 * Create a new room type
 */
router.post('/room-types', async (req, res) => {
  try {
    const data = createRoomTypeSchema.parse(req.body);
    
    const roomType = await prisma.roomType.create({
      data: {
        name: data.name,
        capacity: data.capacity,
        amenities: data.amenities,
        images: data.images,
        baseRate: data.baseRate,
      }
    });

    res.status(201).json({ roomType });

  } catch (error) {
    console.error('Create room type error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid room type data',
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
      detail: 'Failed to create room type',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * PUT /v1/admin/room-types/:id
 * Update a room type
 */
router.put('/room-types/:id', async (req, res) => {
  try {
    const roomTypeId = req.params.id;
    const data = createRoomTypeSchema.partial().parse(req.body);
    
    const roomType = await prisma.roomType.update({
      where: { id: roomTypeId },
      data
    });

    res.json({ roomType });

  } catch (error) {
    console.error('Update room type error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid room type data',
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
      detail: 'Failed to update room type',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * GET /v1/admin/inventory
 * Get inventory for a date range
 */
router.get('/inventory', async (req, res) => {
  try {
    const { startDate, endDate, roomTypeId } = req.query;
    
    const where: any = {};
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    
    if (roomTypeId) {
      where.roomTypeId = roomTypeId;
    }

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        roomType: {
          select: { name: true }
        }
      },
      orderBy: [
        { date: 'asc' },
        { roomType: { name: 'asc' } }
      ]
    });

    res.json({ inventory });

  } catch (error) {
    console.error('Get inventory error:', error);
    
    res.status(500).json({
      type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Failed to get inventory',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * PUT /v1/admin/inventory/bulk
 * Bulk update inventory
 */
router.put('/inventory/bulk', async (req, res) => {
  try {
    const updates = z.array(updateInventorySchema).parse(req.body);
    
    const results = [];
    
    for (const update of updates) {
      const inventory = await prisma.inventory.upsert({
        where: {
          roomTypeId_date: {
            roomTypeId: update.roomTypeId,
            date: new Date(update.date)
          }
        },
        update: {
          allotment: update.allotment
        },
        create: {
          roomTypeId: update.roomTypeId,
          date: new Date(update.date),
          allotment: update.allotment,
          booked: 0
        }
      });
      
      results.push(inventory);
    }

    res.json({ 
      message: `Updated ${results.length} inventory records`,
      inventory: results 
    });

  } catch (error) {
    console.error('Bulk update inventory error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid inventory data',
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
      detail: 'Failed to update inventory',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * GET /v1/admin/rate-plans
 * List all rate plans
 */
router.get('/rate-plans', async (req, res) => {
  try {
    const ratePlans = await prisma.ratePlan.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({ ratePlans });

  } catch (error) {
    console.error('Get rate plans error:', error);
    
    res.status(500).json({
      type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Failed to get rate plans',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * POST /v1/admin/rate-plans
 * Create a new rate plan
 */
router.post('/rate-plans', async (req, res) => {
  try {
    const data = createRatePlanSchema.parse(req.body);
    
    const ratePlan = await prisma.ratePlan.create({
      data
    });

    res.status(201).json({ ratePlan });

  } catch (error) {
    console.error('Create rate plan error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid rate plan data',
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
      detail: 'Failed to create rate plan',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * GET /v1/admin/bookings
 * List all bookings with filters
 */
router.get('/bookings', async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (startDate && endDate) {
      where.checkIn = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        roomType: {
          select: { name: true }
        },
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ bookings });

  } catch (error) {
    console.error('Get bookings error:', error);
    
    res.status(500).json({
      type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Failed to get bookings',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

export { router as adminRouter };