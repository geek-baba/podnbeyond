import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createOrder, verifyWebhookSignature, getRazorpayKeyId } from '../lib/razorpay';
import { requireAuth } from '../lib/auth';

const router = Router();

// Validation schemas
const createBookingSchema = z.object({
  roomTypeId: z.string().cuid(),
  checkIn: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-in date'),
  checkOut: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-out date'),
  guests: z.number().min(1).max(10),
  guestName: z.string().min(1).max(100),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
});

/**
 * POST /v1/bookings
 * Create a new booking with Razorpay order
 */
router.post('/', async (req, res) => {
  try {
    const data = createBookingSchema.parse(req.body);
    
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    
    // Validate dates
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

    // Check if room type exists and has capacity
    const roomType = await prisma.roomType.findUnique({
      where: { id: data.roomTypeId }
    });

    if (!roomType) {
      return res.status(404).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
        title: 'Not Found',
        status: 404,
        detail: 'Room type not found',
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    if (roomType.capacity < data.guests) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Room capacity exceeded',
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    // Calculate pricing
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const baseAmount = roomType.baseRate * nights;
    const serviceCharge = Math.round(baseAmount * 0.10);
    const gstOnRoom = Math.round(baseAmount * 0.12);
    const gstOnService = Math.round(serviceCharge * 0.18);
    const totalAmount = baseAmount + serviceCharge + gstOnRoom + gstOnService;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        roomTypeId: data.roomTypeId,
        checkIn,
        checkOut,
        guests: data.guests,
        amountPaise: totalAmount,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        userId: req.user?.id, // If authenticated
      }
    });

    // Create Razorpay order
    const razorpayOrder = await createOrder(totalAmount, booking.id);
    
    // Update booking with Razorpay order ID
    await prisma.booking.update({
      where: { id: booking.id },
      data: { razorpayOrderId: razorpayOrder.id }
    });

    res.status(201).json({
      bookingId: booking.id,
      razorpay: {
        orderId: razorpayOrder.id,
        keyId: getRazorpayKeyId(),
        amount: totalAmount,
        currency: 'INR'
      },
      booking: {
        id: booking.id,
        roomType: roomType.name,
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0],
        guests: data.guests,
        nights,
        pricing: {
          baseAmount,
          serviceCharge,
          gstOnRoom,
          gstOnService,
          totalAmount
        }
      }
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid booking data',
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
      detail: 'Failed to create booking',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * POST /v1/bookings/:id/cancel
 * Cancel a booking
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
        title: 'Not Found',
        status: 404,
        detail: 'Booking not found',
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Booking already cancelled',
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    // Simple cancellation policy: free cancellation 24 hours before check-in
    const now = new Date();
    const checkIn = new Date(booking.checkIn);
    const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let refundAmount = 0;
    if (hoursUntilCheckIn > 24) {
      refundAmount = booking.amountPaise; // Full refund
    } else if (hoursUntilCheckIn > 0) {
      refundAmount = Math.round(booking.amountPaise * 0.5); // 50% refund
    }
    // No refund for same-day or past check-in

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' }
    });

    res.json({
      bookingId,
      status: 'CANCELLED',
      refundAmount,
      refundPolicy: hoursUntilCheckIn > 24 ? 'full' : hoursUntilCheckIn > 0 ? 'partial' : 'none'
    });

  } catch (error) {
    console.error('Booking cancellation error:', error);
    
    res.status(500).json({
      type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Failed to cancel booking',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

/**
 * POST /v1/webhooks/razorpay
 * Handle Razorpay webhook events
 */
router.post('/webhooks/razorpay', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const payload = JSON.stringify(req.body);
    
    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid webhook signature',
        instance: req.url,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }

    const event = req.body;
    
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      
      // Find booking by Razorpay order ID
      const booking = await prisma.booking.findFirst({
        where: { razorpayOrderId: orderId },
        include: { roomType: true }
      });

      if (!booking) {
        console.error(`Booking not found for Razorpay order: ${orderId}`);
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Update booking status (idempotent)
      if (booking.status === 'PENDING') {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'PAID' }
        });

        // Award loyalty points if user is registered
        if (booking.userId) {
          const pointsEarned = Math.floor(booking.amountPaise / 10000); // 1 point per ₹100
          
          await prisma.loyaltyLedger.create({
            data: {
              userId: booking.userId,
              points: pointsEarned,
              type: 'EARN',
              ref: booking.id
            }
          });

          // Update user points
          await prisma.user.update({
            where: { id: booking.userId },
            data: { points: { increment: pointsEarned } }
          });
        }

        // Update inventory (reduce available rooms)
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        
        for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
          await prisma.inventory.updateMany({
            where: {
              roomTypeId: booking.roomTypeId,
              date: new Date(d)
            },
            data: {
              booked: { increment: 1 }
            }
          });
        }

        console.log(`✅ Booking ${booking.id} marked as PAID, inventory updated`);
        
        // TODO: Send confirmation email
        console.log(`📧 Confirmation email should be sent to ${booking.guestEmail}`);
      }
    }

    res.json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    res.status(500).json({
      type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Failed to process webhook',
      instance: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

export { router as bookingsRouter };