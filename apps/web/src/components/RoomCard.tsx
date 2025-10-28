import Image from 'next/image';
import { formatCurrency } from '@shared/utils/currency';

interface RoomCardProps {
  room: {
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
  };
  onBook: () => void;
}

export function RoomCard({ room, onBook }: RoomCardProps) {
  const mainImage = room.images[0] || '/placeholder-room.jpg';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="md:flex">
        {/* Room Image */}
        <div className="md:w-1/3">
          <div className="relative h-48 md:h-full">
            <Image
              src={mainImage}
              alt={room.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        </div>

        {/* Room Details */}
        <div className="md:w-2/3 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {room.name}
              </h3>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Up to {room.capacity} guests
              </div>
              <div className="text-sm text-gray-600 mb-4">
                {room.available} rooms available
              </div>
            </div>

            {/* Pricing */}
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(room.pricing.totalAmount)}
              </div>
              <div className="text-sm text-gray-600">
                for {room.pricing.nights} {room.pricing.nights === 1 ? 'night' : 'nights'}
              </div>
              <div className="text-xs text-gray-500">
                includes taxes & fees
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {room.amenities.slice(0, 6).map((amenity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {amenity}
                </span>
              ))}
              {room.amenities.length > 6 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  +{room.amenities.length - 6} more
                </span>
              )}
            </div>
          </div>

          {/* Rate Breakdown */}
          <div className="mb-4">
            <details className="group">
              <summary className="text-sm text-primary-600 cursor-pointer hover:text-primary-700">
                View rate breakdown
              </summary>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Room rate ({room.pricing.nights} nights)</span>
                  <span>{formatCurrency(room.pricing.baseAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service charge (10%)</span>
                  <span>{formatCurrency(room.pricing.serviceCharge)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST on room (12%)</span>
                  <span>{formatCurrency(room.pricing.gstOnRoom)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST on service (18%)</span>
                  <span>{formatCurrency(room.pricing.gstOnService)}</span>
                </div>
                <div className="border-t border-gray-200 pt-1 flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(room.pricing.totalAmount)}</span>
                </div>
              </div>
            </details>
          </div>

          {/* Book Button */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Free cancellation until 24 hours before check-in
            </div>
            <button
              onClick={onBook}
              className="btn-primary"
              disabled={room.available === 0}
            >
              {room.available === 0 ? 'Sold Out' : 'Book Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}