
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

const ITEMS_PER_PAGE = 10;

export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req, 'Admin');
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString(), 10);

    const client = await clientPromise;
    const db = client.db();
    const bookingsCollection = db.collection<BookingDocument>('bookings');
    
    const query = {}; // For future search/filter on this page

    const totalItems = await bookingsCollection.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const bookingsFromDb = await bookingsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const bookingsData: Booking[] = bookingsFromDb.map(doc => {
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

    return NextResponse.json({
      data: bookingsData,
      totalItems,
      totalPages,
      currentPage: page,
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch bookings for admin:', error);
    return NextResponse.json({ message: 'Failed to fetch bookings' }, { status: 500 });
  }
}
