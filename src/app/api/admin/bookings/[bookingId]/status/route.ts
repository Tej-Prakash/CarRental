
// src/app/api/admin/bookings/[bookingId]/status/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { Booking, UserRole } from '@/types';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const UpdateStatusSchema = z.object({
  status: z.enum(['Confirmed', 'Cancelled', 'Completed', 'Cancellation Rejected']), 
});

interface BookingDocument extends Omit<Booking, 'id'> {
  _id: ObjectId;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const authResult = await verifyAuth(req, ['Admin', 'Manager']);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }

  const { bookingId } = params;
  if (!ObjectId.isValid(bookingId)) {
    return NextResponse.json({ message: 'Invalid booking ID format' }, { status: 400 });
  }

  try {
    const rawData = await req.json();
    const validation = UpdateStatusSchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid status update data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { status: newStatus } = validation.data;

    const client = await clientPromise;
    const db = client.db();
    const bookingsCollection = db.collection<BookingDocument>('bookings');

    const booking = await bookingsCollection.findOne({ _id: new ObjectId(bookingId) });
    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    const oldStatus = booking.status;

    const result = await bookingsCollection.updateOne(
      { _id: new ObjectId(bookingId) },
      { 
        $set: { 
          status: newStatus,
          updatedAt: new Date().toISOString(),
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'Failed to update booking status or status is already the same' }, { status: 500 });
    }

    // Simulate notifications and actions based on status change
    if (newStatus === 'Cancelled' && oldStatus === 'Cancellation Requested') {
      console.log(`SIMULATED: Refund for booking ID ${bookingId} (Amount: ₹${booking.totalPrice}) processed.`);
      console.log(`SIMULATED USER NOTIFICATION: Your cancellation request for booking ${bookingId} (${booking.carName}) has been approved and a refund is being processed.`);
    } else if (newStatus === 'Confirmed' && oldStatus === 'Cancellation Requested') { // This implies rejection of cancellation
      console.log(`SIMULATED USER NOTIFICATION: Your cancellation request for booking ${bookingId} (${booking.carName}) has been rejected. Your booking remains confirmed.`);
    } else if (newStatus === 'Completed') {
        console.log(`SIMULATED: Booking ${bookingId} (${booking.carName}) marked as completed.`);
    }
     // Add more notifications as needed for other status changes

    const updatedBooking = await bookingsCollection.findOne({ _id: new ObjectId(bookingId) });
     const { _id, ...restDoc } = updatedBooking!;


    return NextResponse.json({
        id: _id.toHexString(),
        ...restDoc,
        startDate: String(restDoc.startDate),
        endDate: String(restDoc.endDate),
        createdAt: String(restDoc.createdAt),
        updatedAt: String(restDoc.updatedAt),
      }, { status: 200 });

  } catch (error) {
    console.error('Failed to update booking status:', error);
    return NextResponse.json({ message: 'Failed to update booking status' }, { status: 500 });
  }
}
