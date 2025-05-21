// src/app/api/admin/reports/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { Booking, SiteSettings, BookingDocument } from '@/types'; // Assuming BookingDocument exists or is similar to Booking
import { ObjectId } from 'mongodb';
import { parseISO, isValid, formatISO } from 'date-fns';

interface SiteSettingsDocument extends Omit<SiteSettings, 'id'> {
  _id: ObjectId;
  settingsId: string; 
}
const SETTINGS_DOC_ID = 'main_settings';

export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req, 'Admin');
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(req.url);
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const statusParam = searchParams.get('status');

  const query: any = {};

  if (startDateParam) {
    const parsedStartDate = parseISO(startDateParam);
    if (isValid(parsedStartDate)) {
      query.createdAt = { ...query.createdAt, $gte: formatISO(parsedStartDate) };
    } else {
      return NextResponse.json({ message: 'Invalid start date format. Please use YYYY-MM-DD.' }, { status: 400 });
    }
  }

  if (endDateParam) {
    const parsedEndDate = parseISO(endDateParam);
    if (isValid(parsedEndDate)) {
      // To include the whole end day, we can set it to the end of that day or use the next day as exclusive upper bound
      const endOfDay = new Date(parsedEndDate.getFullYear(), parsedEndDate.getMonth(), parsedEndDate.getDate(), 23, 59, 59, 999);
      query.createdAt = { ...query.createdAt, $lte: formatISO(endOfDay) };
    } else {
      return NextResponse.json({ message: 'Invalid end date format. Please use YYYY-MM-DD.' }, { status: 400 });
    }
  }
  
  if (query.createdAt && query.createdAt.$gte && query.createdAt.$lte && query.createdAt.$gte > query.createdAt.$lte) {
    return NextResponse.json({ message: 'Start date cannot be after end date.' }, { status: 400 });
  }

  if (statusParam && statusParam !== 'All') {
    query.status = statusParam as Booking['status'];
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const bookingsCollection = db.collection<BookingDocument>('bookings');
    
    const filteredBookingsFromDb = await bookingsCollection.find(query).sort({ createdAt: -1 }).toArray();

    const bookings: Booking[] = filteredBookingsFromDb.map(doc => {
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

    const totalBookings = bookings.length;
    const totalRevenue = bookings
      .filter(b => b.status === 'Completed')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    const settingsCollection = db.collection<SiteSettingsDocument>('settings');
    let siteSettingsDoc = await settingsCollection.findOne({ settingsId: SETTINGS_DOC_ID });
    const currency = siteSettingsDoc?.defaultCurrency || 'INR';
    const currencySymbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';


    return NextResponse.json({
      totalBookings,
      totalRevenue,
      bookings,
      currencySymbol,
      currency,
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch report data:', error);
    return NextResponse.json({ message: 'Failed to fetch report data' }, { status: 500 });
  }
}
