
// src/app/api/bookings/[bookingId]/request-cancellation/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { Booking } from '@/types';
import { ObjectId } from 'mongodb';
import { isFuture, parseISO } from 'date-fns';

interface BookingDocument extends Omit<Booking, 'id'> {
  _id: ObjectId;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }
  const { userId } = authResult.user;
  const { bookingId } = params;

  if (!ObjectId.isValid(bookingId)) {
    return NextResponse.json({ message: 'Invalid booking ID format' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const bookingsCollection = db.collection<BookingDocument>('bookings');

    const booking = await bookingsCollection.findOne({ _id: new ObjectId(bookingId) });

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    if (booking.userId !== userId) {
      return NextResponse.json({ message: 'Forbidden: You can only cancel your own bookings' }, { status: 403 });
    }

    if (booking.status !== 'Confirmed') {
      return NextResponse.json({ message: `Cannot request cancellation for booking with status: ${booking.status}` }, { status: 400 });
    }

    // Optional: Add business logic, e.g., cannot cancel if booking start date is too soon or past
    if (!isFuture(parseISO(booking.startDate))) {
        return NextResponse.json({ message: 'Cannot request cancellation for bookings that have already started or are in the past.' }, { status: 400 });
    }


    const result = await bookingsCollection.updateOne(
      { _id: new ObjectId(bookingId) },
      { 
        $set: { 
          status: 'Cancellation Requested',
          updatedAt: new Date().toISOString(),
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'Failed to update booking status or status already requested' }, { status: 500 });
    }

    console.log(`SIMULATED ADMIN NOTIFICATION: User ${authResult.user.name} (ID: ${userId}) requested cancellation for booking ID: ${bookingId}. Car: ${booking.carName}`);

    return NextResponse.json({ message: 'Cancellation requested successfully. Admin will review your request.' }, { status: 200 });

  } catch (error) {
    console.error('Failed to request booking cancellation:', error);
    return NextResponse.json({ message: 'Failed to request booking cancellation' }, { status: 500 });
  }
}
