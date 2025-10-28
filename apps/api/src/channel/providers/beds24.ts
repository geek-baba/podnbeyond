import { BaseChannelProvider, AvailabilityUpdate, RateUpdate, ExternalBooking, SyncResult } from '../ChannelProvider';

/**
 * Beds24 Channel Provider
 * Integrates with Beds24 API for inventory and booking synchronization
 */
export class Beds24Provider extends BaseChannelProvider {
  name = 'beds24';
  
  constructor(config: { apiUrl: string; apiKey: string; hotelCode: string }) {
    super(config);
  }
  
  /**
   * Test connection to Beds24 API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple API call
      await this.makeRequest('/properties');
      this.logOperation('testConnection', {}, true);
      return true;
    } catch (error) {
      this.logOperation('testConnection', {}, false, (error as Error).message);
      return false;
    }
  }
  
  /**
   * Push availability updates to Beds24
   */
  async pushAvailability(updates: AvailabilityUpdate[]): Promise<SyncResult> {
    try {
      // Transform to Beds24 format
      const beds24Updates = updates.map(update => ({
        propId: this.hotelCode,
        roomId: update.roomCode,
        date: update.date,
        numRooms: update.available
      }));
      
      // Make API call to Beds24
      const response = await this.makeRequest('/inventory', 'POST', {
        updates: beds24Updates
      });
      
      this.logOperation('pushAvailability', { updates: beds24Updates }, true);
      
      return {
        success: true,
        message: 'Availability pushed successfully',
        recordsProcessed: updates.length
      };
      
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logOperation('pushAvailability', { updates }, false, errorMessage);
      
      return {
        success: false,
        message: `Failed to push availability: ${errorMessage}`,
        errors: [errorMessage]
      };
    }
  }
  
  /**
   * Push rate updates to Beds24
   */
  async pushRates(updates: RateUpdate[]): Promise<SyncResult> {
    try {
      // Transform to Beds24 format
      const beds24Updates = updates.map(update => ({
        propId: this.hotelCode,
        roomId: update.roomCode,
        date: update.date,
        rate: update.rate / 100 // Convert paise to rupees
      }));
      
      // Make API call to Beds24
      const response = await this.makeRequest('/rates', 'POST', {
        updates: beds24Updates
      });
      
      this.logOperation('pushRates', { updates: beds24Updates }, true);
      
      return {
        success: true,
        message: 'Rates pushed successfully',
        recordsProcessed: updates.length
      };
      
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logOperation('pushRates', { updates }, false, errorMessage);
      
      return {
        success: false,
        message: `Failed to push rates: ${errorMessage}`,
        errors: [errorMessage]
      };
    }
  }
  
  /**
   * Pull new bookings from Beds24
   */
  async pullBookings(since: Date): Promise<ExternalBooking[]> {
    try {
      // Make API call to get bookings
      const response = await this.makeRequest(
        `/bookings?propId=${this.hotelCode}&since=${since.toISOString()}`
      );
      
      // Transform Beds24 bookings to our format
      const bookings: ExternalBooking[] = response.bookings?.map((booking: any) => ({
        externalId: booking.bookId,
        roomCode: booking.roomId,
        checkIn: booking.arrival,
        checkOut: booking.departure,
        guests: booking.numAdult + (booking.numChild || 0),
        guestName: `${booking.guestFirstName} ${booking.guestName}`,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        totalAmount: Math.round(booking.price * 100), // Convert to paise
        status: booking.status === 1 ? 'confirmed' : 'cancelled',
        createdAt: booking.created
      })) || [];
      
      this.logOperation('pullBookings', { since, count: bookings.length }, true);
      
      return bookings;
      
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logOperation('pullBookings', { since }, false, errorMessage);
      throw error;
    }
  }
  
  /**
   * Get room mappings from Beds24
   */
  async getRoomMappings(): Promise<{ [internalRoomId: string]: string }> {
    try {
      // Get room types from Beds24
      const response = await this.makeRequest(`/rooms?propId=${this.hotelCode}`);
      
      // For now, return empty mappings - this would be configured in the admin interface
      const mappings: { [key: string]: string } = {};
      
      response.rooms?.forEach((room: any) => {
        // This mapping would be stored in our ChannelMapping table
        // mappings[internalRoomTypeId] = room.roomId;
      });
      
      this.logOperation('getRoomMappings', { mappings }, true);
      
      return mappings;
      
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logOperation('getRoomMappings', {}, false, errorMessage);
      throw error;
    }
  }
}

/**
 * Factory function to create Beds24 provider instance
 */
export function createBeds24Provider(): Beds24Provider | null {
  const config = {
    apiUrl: process.env.BEDS24_API_URL || 'https://beds24.com/api/v2',
    apiKey: process.env.BEDS24_API_KEY || '',
    hotelCode: process.env.BEDS24_HOTEL_CODE || ''
  };
  
  if (!config.apiKey || !config.hotelCode) {
    console.warn('⚠️  Beds24 not configured - missing API key or hotel code');
    return null;
  }
  
  return new Beds24Provider(config);
}