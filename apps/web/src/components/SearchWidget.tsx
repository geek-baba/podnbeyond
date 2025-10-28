'use client';

import { useState } from 'react';

interface SearchWidgetProps {
  onSearch: (params: {
    checkIn: string;
    checkOut: string;
    guests: number;
  }) => void;
}

export function SearchWidget({ onSearch }: SearchWidgetProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  // Set default dates (today and tomorrow)
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const defaultCheckIn = today.toISOString().split('T')[0];
  const defaultCheckOut = tomorrow.toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const searchCheckIn = checkIn || defaultCheckIn;
    const searchCheckOut = checkOut || defaultCheckOut;
    
    if (new Date(searchCheckIn) >= new Date(searchCheckOut)) {
      alert('Check-out date must be after check-in date');
      return;
    }
    
    onSearch({
      checkIn: searchCheckIn,
      checkOut: searchCheckOut,
      guests,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Check-in Date */}
      <div>
        <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-1">
          Check-in
        </label>
        <input
          type="date"
          id="checkIn"
          value={checkIn || defaultCheckIn}
          onChange={(e) => setCheckIn(e.target.value)}
          min={defaultCheckIn}
          className="input"
          required
        />
      </div>

      {/* Check-out Date */}
      <div>
        <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 mb-1">
          Check-out
        </label>
        <input
          type="date"
          id="checkOut"
          value={checkOut || defaultCheckOut}
          onChange={(e) => setCheckOut(e.target.value)}
          min={checkIn || defaultCheckIn}
          className="input"
          required
        />
      </div>

      {/* Guests */}
      <div>
        <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">
          Guests
        </label>
        <select
          id="guests"
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="input"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <option key={num} value={num}>
              {num} {num === 1 ? 'Guest' : 'Guests'}
            </option>
          ))}
        </select>
      </div>

      {/* Search Button */}
      <div className="flex items-end">
        <button
          type="submit"
          className="btn-primary w-full h-10 flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search Rooms
        </button>
      </div>
    </form>
  );
}