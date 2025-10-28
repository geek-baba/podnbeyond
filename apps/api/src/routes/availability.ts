import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

// Validation schema for availability query
const availabilityQuerySchema = z.object({
  checkIn: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-in date'),
  checkOut: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-out date'),
  guests: z.coerce.number().min(1).max(10),
  roomTypeId: z.string().optional(),
});

/**
 * GET /v1/availability
 * Search for available rooms with pricing
 */
router.get('/', async (req, res) => {
  try {
    const query = availabilityQuerySchema.parse(req.query);
    
    const checkIn = new Date(query.checkIn);
    const checkOut = new Date(query.checkOut);
    
    // Validate date range
    if (checkIn >= checkOut) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Check-out date must be after check-in date',
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    // Build room type filter
    const roomTypeFilter = query.roomTypeId ? { id: query.roomTypeId } : {};

    // Get room types with availability
    const roomTypes = await prisma.roomType.findMany({
      where: {
        ...roomTypeFilter,
        capacity: { gte: query.guests }
      },
      include: {
        inventory: {
          where: {
            date: {
              gte: checkIn,
              lt: checkOut
            }
          }
        }
      }
    });

    // Calculate availability and pricing
    const availableRooms = roomTypes.map(roomType => {
      // Check if all dates have sufficient inventory
      const requiredDates = [];
      for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
        requiredDates.push(new Date(d));
      }

      let minAvailable = Infinity;
      let hasAllDates = true;

      for (const date of requiredDates) {
        const inventory = roomType.inventory.find(inv => 
          inv.date.toDateString() === date.toDateString()
        );
        
        if (!inventory) {
          hasAllDates = false;
          break;
        }
        
        const available = inventory.allotment - inventory.booked;
        minAvailable = Math.min(minAvailable, available);
      }

      if (!hasAllDates || minAvailable <= 0) {
        return null; // Not available
      }

      // Calculate pricing (simplified - using base rate)
      const baseAmount = roomType.baseRate * nights;
      const serviceCharge = Math.round(baseAmount * 0.10); // 10% service charge
      const gstOnRoom = Math.round(baseAmount * 0.12); // 12% GST on room
      const gstOnService = Math.round(serviceCharge * 0.18); // 18% GST on service
      const totalAmount = baseAmount + serviceCharge + gstOnRoom + gstOnService;

      return {
        roomTypeId: roomType.id,
        name: roomType.name,
        capacity: roomType.capacity,
        amenities: roomType.amenities,
        images: roomType.images,
        available: minAvailable,
        pricing: {
          nights,
          baseRate: roomType.baseRate,
          baseAmount,
          serviceCharge,
          gstOnRoom,
          gstOnService,
          totalAmount
        }
      };
    }).filter(Boolean);

    res.json({
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
      guests: query.guests,
      nights,
      rooms: availableRooms
    });

  } catch (error) {
    console.error('Availability search error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid query parameters',
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
      detail: 'Failed to search availability',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

export { router as availabilityRouter };