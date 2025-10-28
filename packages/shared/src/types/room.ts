export interface RoomType {
  id: string;
  name: string;
  capacity: number;
  amenities: string[];
  images: string[];
  baseRate: number; // Rate in paise
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: string;
  roomTypeId: string;
  date: Date;
  allotment: number;
  booked: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RatePlan {
  id: string;
  name: string;
  refundable: boolean;
  discountPct: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailableRoom {
  roomTypeId: string;
  name: string;
  capacity: number;
  amenities: string[];
  images: string[];
  available: number;
  pricing: {
    nights: number;
    baseRate: number;
    baseAmount: number;
    serviceCharge: number;
    gstOnRoom: number;
    gstOnService: number;
    totalAmount: number;
  };
}