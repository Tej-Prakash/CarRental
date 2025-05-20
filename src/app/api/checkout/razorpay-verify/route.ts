
// src/app/api/checkout/razorpay-verify/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { Booking } from '@/types';
import { ObjectId } from 'mongodb';

const RazorpayVerificationSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  bookingId: z.string().refine((val) => ObjectId.isValid(val), { message: "Invalid booking ID" }),
});
import { z } from 'zod';


export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required for verification' }, { status: authResult.status || 401 });
  }

  try {
    const rawData = await req.json();
    const validation = RazorpayVerificationSchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid verification data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = validation.data;
    
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error('RAZORPAY_KEY_SECRET is not defined');
      return NextResponse.json({ message: 'Internal server configuration error for payment verification.' }, { status: 500 });
    }

    // Verify signature
    // The body should be: razorpay_order_id + "|" + razorpay_payment_id
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ message: 'Payment verification failed: Invalid signature.' }, { status: 400 });
    }

    // Signature is valid, update booking status
    const client = await clientPromise;
    const db = client.db();
    const bookingsCollection = db.collection<Booking>('bookings');

    const booking = await bookingsCollection.findOne({ _id: new ObjectId(bookingId), razorpayOrderId: razorpay_order_id });

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found or order ID mismatch.' }, { status: 404 });
    }

    if (booking.status === 'Confirmed') {
      // Already confirmed, possibly a duplicate callback or race condition
      return NextResponse.json({ message: 'Booking already confirmed.', bookingId: booking.id }, { status: 200 });
    }
    if (booking.status !== 'Pending') {
      return NextResponse.json({ message: `Booking status is ${booking.status}, cannot confirm.` }, { status: 400 });
    }

    const updateResult = await bookingsCollection.updateOne(
      { _id: new ObjectId(bookingId) },
      { 
        $set: { 
          status: 'Confirmed', 
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: new Date().toISOString(),
        } 
      }
    );

    if (updateResult.modifiedCount === 0) {
      // This might happen if the status was already 'Confirmed' or another issue.
      // Log it, but if we passed the signature check, it's likely okay or already processed.
      console.warn(`Booking ${bookingId} status not modified to Confirmed, but signature was valid.`);
    }

    console.log(`SIMULATED EMAIL: Booking ${bookingId} for ${booking.carName} by ${booking.userName} confirmed via Razorpay. Payment ID: ${razorpay_payment_id}`);

    return NextResponse.json({ message: 'Payment verified and booking confirmed.', bookingId: booking.id }, { status: 200 });

  } catch (error: any) {
    console.error('Razorpay payment verification failed:', error);
    return NextResponse.json({ message: error.message || 'Failed to verify payment' }, { status: 500 });
  }
}
