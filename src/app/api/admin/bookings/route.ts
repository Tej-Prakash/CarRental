
// src/app/api/admin/bookings/route.ts
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
  const authResult = await verifyAuth(req, 'Admin');
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const bookingsCollection = db.collection<BookingDocument>('bookings');
    
    const bookingsFromDb = await bookingsCollection.find({}).sort({ createdAt: -1 }).toArray();

    const bookings: Booking[] = bookingsFromDb.map(doc => {
      const { _id, ...rest } = doc;
      return { 
        id: _id.toHexString(),
        ...rest,
        // Ensure date fields are strings as expected by the type
        startDate: String(rest.startDate),
        endDate: String(rest.endDate),
        createdAt: String(rest.createdAt),
        updatedAt: String(rest.updatedAt),
      };
    });

    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch bookings for admin:', error);
    return NextResponse.json({ message: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// TODO: Implement POST, PUT, DELETE for admin managing bookings (e.g., change status, cancel)
