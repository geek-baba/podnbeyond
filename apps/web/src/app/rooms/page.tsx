'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RoomCard } from '@/components/RoomCard';
import { SearchWidget } from '@/components/SearchWidget';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface AvailableRoom {
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

export default function RoomsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [rooms, setRooms] = useState<AvailableRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = Number(searchParams.get('guests')) || 2;

  useEffect(() => {
    if (checkIn && checkOut && guests) {
      searchRooms();
    }
  }, [checkIn, checkOut, guests]);

  const searchRooms = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        checkIn,
        checkOut,
        guests: guests.toString(),
      });
      
      const response = await api.get(`/v1/availability?${params}`);
      setRooms(response.rooms || []);
    } catch (err) {
      setError('Failed to search rooms. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = (searchParams: {
    checkIn: string;
    checkOut: string;
    guests: number;
  }) => {
    const params = new URLSearchParams({
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      guests: searchParams.guests.toString(),
    });
    
    router.push(`/rooms?${params.toString()}`);
  };

  const handleBookRoom = (roomTypeId: string) => {
    const params = new URLSearchParams({
      roomTypeId,
      checkIn,
      checkOut,
      guests: guests.toString(),
    });
    
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Widget */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Modify Your Search</h2>
        <SearchWidget onSearch={handleNewSearch} />
      </div>

      {/* Search Results */}
      <div>
        {checkIn && checkOut && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Available Rooms
            </h1>
            <p className="text-gray-600">
              {checkIn} to {checkOut} • {guests} {guests === 1 ? 'Guest' : 'Guests'}
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Searching available rooms...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && rooms.length === 0 && checkIn && checkOut && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms available</h3>
            <p className="text-gray-600 mb-4">
              Sorry, no rooms are available for your selected dates and guest count.
            </p>
            <p className="text-sm text-gray-500">
              Try adjusting your dates or reducing the number of guests.
            </p>
          </div>
        )}

        {!loading && !error && rooms.length > 0 && (
          <div className="space-y-6">
            {rooms.map((room) => (
              <RoomCard
                key={room.roomTypeId}
                room={room}
                onBook={() => handleBookRoom(room.roomTypeId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}