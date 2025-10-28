'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AccountPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Sign In Required
          </h1>
          
          <p className="text-gray-600 mb-6">
            Please sign in to view your account and booking history.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setIsLoggedIn(true)}
              className="btn-primary w-full"
            >
              Sign In
            </button>
            
            <button className="btn-outline w-full">
              Create Account
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button 
                onClick={() => setIsLoggedIn(true)}
                className="text-primary-600 hover:text-primary-700"
              >
                Sign up for free
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mock user data for demonstration
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    points: 1250,
    tier: 'SILVER',
    memberSince: '2023-01-15',
  };

  const recentBookings = [
    {
      id: 'BK001',
      roomType: 'Deluxe Room',
      checkIn: '2024-01-15',
      checkOut: '2024-01-17',
      status: 'CONFIRMED',
      amount: 12000,
    },
    {
      id: 'BK002',
      roomType: 'Executive Suite',
      checkIn: '2023-12-20',
      checkOut: '2023-12-22',
      status: 'COMPLETED',
      amount: 18000,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
        <p className="text-gray-600 mt-2">Manage your profile and view booking history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Loyalty Status</div>
                <div className="text-lg font-semibold text-primary-600">{user.tier}</div>
                <div className="text-2xl font-bold text-gray-900">{user.points} points</div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                Member since {new Date(user.memberSince).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 space-y-3">
            <Link href="/" className="btn-primary w-full text-center block">
              Book New Stay
            </Link>
            <button className="btn-outline w-full">
              Edit Profile
            </button>
            <button 
              onClick={() => setIsLoggedIn(false)}
              className="btn-outline w-full text-red-600 border-red-300 hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loyalty Points */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Loyalty Points</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{user.points}</div>
                <div className="text-sm text-green-700">Available Points</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">₹{user.points}</div>
                <div className="text-sm text-blue-700">Points Value</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{user.tier}</div>
                <div className="text-sm text-purple-700">Current Tier</div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>• Earn 1 point for every ₹100 spent</p>
              <p>• Redeem points at ₹1 per point</p>
              <p>• {user.tier} members get 20% bonus points</p>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
            
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{booking.roomType}</h4>
                      <p className="text-sm text-gray-600">Booking ID: {booking.id}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      booking.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Check-in:</span>
                      <div className="font-medium">{booking.checkIn}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Check-out:</span>
                      <div className="font-medium">{booking.checkOut}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <div className="font-medium">₹{booking.amount.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    <button className="text-sm text-primary-600 hover:text-primary-700">
                      View Details
                    </button>
                    {booking.status === 'CONFIRMED' && (
                      <button className="text-sm text-red-600 hover:text-red-700">
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <button className="text-primary-600 hover:text-primary-700 text-sm">
                View All Bookings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}