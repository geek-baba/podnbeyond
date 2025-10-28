'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency } from '@shared/utils/currency';

interface BookingData {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
}

interface BookingResponse {
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

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [formData, setFormData] = useState<BookingData>({
    roomTypeId: searchParams.get('roomTypeId') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: Number(searchParams.get('guests')) || 2,
    guestName: '',
    guestEmail: '',
    guestPhone: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate required parameters
    if (!formData.roomTypeId || !formData.checkIn || !formData.checkOut) {
      router.push('/rooms');
    }
  }, [formData.roomTypeId, formData.checkIn, formData.checkOut, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create booking
      const bookingResponse: BookingResponse = await api.post('/v1/bookings', formData);
      
      // Initialize Razorpay payment
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: bookingResponse.razorpay.keyId,
          amount: bookingResponse.razorpay.amount,
          currency: bookingResponse.razorpay.currency,
          order_id: bookingResponse.razorpay.orderId,
          name: 'Pod & Beyond',
          description: `Booking for ${bookingResponse.booking.roomType}`,
          handler: function (response: any) {
            // Payment successful
            router.push(`/confirm?bookingId=${bookingResponse.bookingId}&paymentId=${response.razorpay_payment_id}`);
          },
          prefill: {
            name: formData.guestName,
            email: formData.guestEmail,
            contact: formData.guestPhone,
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: function() {
              setLoading(false);
            }
          }
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } else {
        // Fallback for development or when Razorpay is not loaded
        console.log('Razorpay not loaded, redirecting to confirmation...');
        router.push(`/confirm?bookingId=${bookingResponse.bookingId}&stub=true`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Load Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Booking</h1>

        {/* Booking Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Booking Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Check-in:</span>
              <span>{formData.checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span>Check-out:</span>
              <span>{formData.checkOut}</span>
            </div>
            <div className="flex justify-between">
              <span>Guests:</span>
              <span>{formData.guests}</span>
            </div>
          </div>
        </div>

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

        {/* Guest Details Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Guest Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="guestName"
                  name="guestName"
                  value={formData.guestName}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="guestEmail"
                  name="guestEmail"
                  value={formData.guestEmail}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="guestPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="guestPhone"
                  name="guestPhone"
                  value={formData.guestPhone}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700">
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-t border-gray-200 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Proceed to Payment'
              )}
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              You will be redirected to Razorpay for secure payment processing
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}