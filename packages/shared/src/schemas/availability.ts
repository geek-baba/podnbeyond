import { z } from 'zod';

export const availabilityQuerySchema = z.object({
  checkIn: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-in date'),
  checkOut: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-out date'),
  guests: z.coerce.number().min(1).max(10),
  roomTypeId: z.string().cuid().optional(),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;