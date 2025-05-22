
// src/app/api/admin/stats/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { SiteSettings, Booking, User, UserRole, BookingDocument } from '@/types';
import type { ObjectId } from 'mongodb';

interface SiteSettingsDocument extends Omit<SiteSettings, 'id'> {
  _id: ObjectId;
  settingsId: string;
}
interface UserDbDoc extends Omit<User, 'id'> {
  _id: ObjectId;
  passwordHash?: string;
}

const SETTINGS_DOC_ID = 'main_settings';
const RECENT_ITEMS_LIMIT = 5;

export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req, ['Admin', 'Manager']);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const totalUsersPromise = db.collection('users').countDocuments();
    const totalCarsPromise = db.collection('cars').countDocuments();
    const pendingBookingsCountPromise = db.collection('bookings').countDocuments({
      status: { $in: ['Pending', 'Cancellation Requested'] }
    });

    const revenueAggregatePromise = db.collection('bookings').aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
    ]).toArray();

    const settingsCollection = db.collection<SiteSettingsDocument>('settings');
    const siteSettingsDocPromise = settingsCollection.findOne({ settingsId: SETTINGS_DOC_ID });

    const recentBookingsPromise = db.collection<BookingDocument>('bookings')
      .find()
      .sort({ createdAt: -1 })
      .limit(RECENT_ITEMS_LIMIT)
      .toArray();

    const newUsersPromise = db.collection<UserDbDoc>('users')
      .find({}, { projection: { passwordHash: 0 } }) // Exclude passwordHash
      .sort({ createdAt: -1 })
      .limit(RECENT_ITEMS_LIMIT)
      .toArray();

    const [
      totalUsers,
      totalCars,
      pendingBookingsCount,
      revenueAggregate,
      siteSettingsDoc,
      recentBookingsDocs,
      newUsersDocs
    ] = await Promise.all([
      totalUsersPromise,
      totalCarsPromise,
      pendingBookingsCountPromise,
      revenueAggregatePromise,
      siteSettingsDocPromise,
      recentBookingsPromise,
      newUsersPromise
    ]);

    const totalRevenue = revenueAggregate.length > 0 && revenueAggregate[0].totalRevenue ? revenueAggregate[0].totalRevenue : 0;
    const defaultCurrency = siteSettingsDoc?.defaultCurrency || 'INR';

    const recentBookings: Booking[] = recentBookingsDocs.map(doc => {
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

    const newUsers: User[] = newUsersDocs.map(doc => {
        const { _id, passwordHash, ...rest } = doc;
        return {
            id: _id.toHexString(),
            ...rest,
            createdAt: String(rest.createdAt),
            updatedAt: rest.updatedAt ? String(rest.updatedAt) : undefined,
            documents: rest.documents || [],
            favoriteCarIds: rest.favoriteCarIds || [],
        };
    });


    return NextResponse.json({
      totalUsers,
      totalCars,
      pendingBookingsCount,
      totalRevenue,
      defaultCurrency,
      recentBookings,
      newUsers,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to fetch admin stats:', error);
    return NextResponse.json({ message: 'Failed to fetch admin statistics. ' + error.message }, { status: 500 });
  }
}
