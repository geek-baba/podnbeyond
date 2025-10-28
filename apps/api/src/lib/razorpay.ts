import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from './env';

// Initialize Razorpay client if keys are available
let razorpayClient: Razorpay | null = null;

if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  razorpayClient = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
  console.log('✅ Razorpay client initialized');
} else {
  console.warn('⚠️  Razorpay not configured - using stub implementation');
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

/**
 * Create a Razorpay order
 */
export async function createOrder(amountPaise: number, receiptId: string): Promise<RazorpayOrder> {
  if (!razorpayClient) {
    // Stub implementation for development
    console.log(`🔧 Stubbed Razorpay order: ₹${amountPaise / 100} for receipt ${receiptId}`);
    return {
      id: `order_stub_${Date.now()}`,
      amount: amountPaise,
      currency: 'INR',
      receipt: receiptId,
      status: 'created'
    };
  }

  try {
    const order = await razorpayClient.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: receiptId,
      payment_capture: 1, // Auto capture
    });

    console.log(`✅ Razorpay order created: ${order.id} for ₹${amountPaise / 100}`);
    return order as RazorpayOrder;
  } catch (error) {
    console.error('❌ Failed to create Razorpay order:', error);
    throw new Error('Failed to create payment order');
  }
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    console.warn('⚠️  Razorpay webhook secret not configured - skipping verification');
    return true; // Allow in development
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    const isValid = signature === expectedSignature;
    
    if (isValid) {
      console.log('✅ Razorpay webhook signature verified');
    } else {
      console.error('❌ Invalid Razorpay webhook signature');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Verify payment signature (for frontend verification)
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!env.RAZORPAY_KEY_SECRET) {
    console.warn('⚠️  Razorpay key secret not configured - skipping verification');
    return true; // Allow in development
  }

  try {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('❌ Error verifying payment signature:', error);
    return false;
  }
}

/**
 * Get Razorpay key ID for frontend
 */
export function getRazorpayKeyId(): string {
  return env.RAZORPAY_KEY_ID || 'rzp_test_stub_key_id';
}