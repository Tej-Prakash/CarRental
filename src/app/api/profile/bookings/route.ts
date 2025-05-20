
// src/app/api/profile/bookings/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { Booking } from '@/types';
import type { ObjectId } from 'mongodb';

interface BookingDocument extends Omit<Booking, 'id'> {
  _id: ObjectId;
}

export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }
  const { userId } = authResult.user;

  try {
    const client = await clientPromise;
    const db = client.db();
    const bookingsCollection = db.collection<BookingDocument>('bookings');
    
    const userBookingsFromDb = await bookingsCollection.find({ userId: userId }).sort({ createdAt: -1 }).toArray();

    const userBookings: Booking[] = userBookingsFromDb.map(doc => {
      const { _id, ...rest } = doc;
      return { 
        id: _id.toHexString(),
        ...rest,
        startDate: String(rest.startDate),
        endDate: String(rest.endDate),
        createdAt: String(rest.createdAt),
        updatedAt: String(rest.updatedAt),
      };
    });

    return NextResponse.json(userBookings, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch user bookings:', error);
    return NextResponse.json({ message: 'Failed to fetch bookings' }, { status: 500 });
  }
}
