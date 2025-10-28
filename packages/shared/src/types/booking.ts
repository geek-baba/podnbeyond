export type BookingStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface Booking {
  id: string;
  userId: string | null;
  roomTypeId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  amountPaise: number;
  status: BookingStatus;
  razorpayOrderId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingRequest {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
}

export interface BookingResponse {
  bookingId: string;
  razorpay: {
    orderId: string;
    keyId: string;
    amount: number;
    currency: string;
  };
  booking: {
    id: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    nights: number;
    pricing: {
      baseAmount: number;
      serviceCharge: number;
      gstOnRoom: number;
      gstOnService: number;
      totalAmount: number;
    };
  };
}