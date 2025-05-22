
// src/app/api/admin/stats/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { SiteSettings, Booking, UserRole } from '@/types'; 
import type { ObjectId } from 'mongodb';

interface SiteSettingsDocument extends Omit<SiteSettings, 'id'> {
  _id: ObjectId;
  settingsId: string; 
}
const SETTINGS_DOC_ID = 'main_settings';

export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req, ['Admin', 'Manager']);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const totalUsers = await db.collection('users').countDocuments();
    const totalCars = await db.collection('cars').countDocuments();
    const pendingBookingsCount = await db.collection('bookings').countDocuments({
      status: { $in: ['Pending', 'Cancellation Requested'] }
    });

    const revenueAggregate = await db.collection('bookings').aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
    ]).toArray();
    
    const totalRevenue = revenueAggregate.length > 0 && revenueAggregate[0].totalRevenue ? revenueAggregate[0].totalRevenue : 0;

    const settingsCollection = db.collection<SiteSettingsDocument>('settings');
    let siteSettingsDoc = await settingsCollection.findOne({ settingsId: SETTINGS_DOC_ID });
    const defaultCurrency = siteSettingsDoc?.defaultCurrency || 'INR';


    return NextResponse.json({
      totalUsers,
      totalCars,
      pendingBookingsCount,
      totalRevenue,
      defaultCurrency,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to fetch admin stats:', error);
    return NextResponse.json({ message: 'Failed to fetch admin statistics. ' + error.message }, { status: 500 });
  }
}
