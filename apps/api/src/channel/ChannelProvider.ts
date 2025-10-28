/**
 * Channel Provider Interface
 * Defines the contract for OTA integrations
 */

export interface AvailabilityUpdate {
  roomCode: string;
  date: string; // YYYY-MM-DD format
  available: number;
}

export interface RateUpdate {
  roomCode: string;
  date: string; // YYYY-MM-DD format
  rate: number; // Rate in paise
}

export interface ExternalBooking {
  externalId: string;
  roomCode: string;
  checkIn: string; // YYYY-MM-DD format
  checkOut: string; // YYYY-MM-DD format
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  totalAmount: number; // Amount in paise
  status: 'confirmed' | 'cancelled';
  createdAt: string; // ISO timestamp
}

export interface SyncResult {
  success: boolean;
  message: string;
  recordsProcessed?: number;
  errors?: string[];
}

/**
 * Base interface that all channel providers must implement
 */
export interface ChannelProvider {
  /** Provider name (e.g., 'beds24', 'mmtrip') */
  name: string;
  
  /** Test connection to the provider */
  testConnection(): Promise<boolean>;
  
  /** Push room availability to the provider */
  pushAvailability(updates: AvailabilityUpdate[]): Promise<SyncResult>;
  
  /** Push room rates to the provider */
  pushRates(updates: RateUpdate[]): Promise<SyncResult>;
  
  /** Pull new bookings from the provider */
  pullBookings(since: Date): Promise<ExternalBooking[]>;
  
  /** Get provider-specific room mappings */
  getRoomMappings(): Promise<{ [internalRoomId: string]: string }>;
}

/**
 * Abstract base class with common functionality
 */
export abstract class BaseChannelProvider implements ChannelProvider {
  abstract name: string;
  
  protected apiUrl: string;
  protected apiKey: string;
  protected hotelCode: string;
  
  constructor(config: { apiUrl: string; apiKey: string; hotelCode: string }) {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.hotelCode = config.hotelCode;
  }
  
  abstract testConnection(): Promise<boolean>;
  abstract pushAvailability(updates: AvailabilityUpdate[]): Promise<SyncResult>;
  abstract pushRates(updates: RateUpdate[]): Promise<SyncResult>;
  abstract pullBookings(since: Date): Promise<ExternalBooking[]>;
  abstract getRoomMappings(): Promise<{ [internalRoomId: string]: string }>;
  
  /**
   * Common HTTP request helper
   */
  protected async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' = 'GET', 
    data?: any
  ): Promise<any> {
    const url = `${this.apiUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'PodAndBeyond/1.0'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`${this.name} API request failed:`, error);
      throw error;
    }
  }
  
  /**
   * Log sync operation for audit trail
   */
  protected logOperation(operation: string, data: any, success: boolean, error?: string) {
    console.log(`[${this.name}] ${operation}:`, {
      success,
      data,
      error,
      timestamp: new Date().toISOString()
    });
  }
}