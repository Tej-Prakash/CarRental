
// src/app/api/checkout/razorpay-order/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { razorpayInstance } from '@/lib/razorpay';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { Car, Booking, SiteSettings } from '@/types';
import { ObjectId } from 'mongodb';
import { differenceInHours, isFuture, parseISO, isValid } from 'date-fns';
import { z } from 'zod';

const CheckoutInputSchema = z.object({
  carId: z.string().refine((val) => ObjectId.isValid(val), { message: "Invalid car ID" }),
  startDate: z.string().refine((date) => isValid(parseISO(date)), "Invalid start date-time"),
  endDate: z.string().refine((date) => isValid(parseISO(date)), "Invalid end date-time"),
});

interface CarDocument extends Omit<Car, 'id'> {
  _id: ObjectId;
}
interface SiteSettingsDocument extends Omit<SiteSettings, 'id'> {
  _id: ObjectId;
  settingsId: string; 
}
const SETTINGS_DOC_ID = 'main_settings';

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }
  const { userId, name: userName, email: userEmail } = authResult.user;

  try {
    const rawData = await req.json();
    const validation = CheckoutInputSchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { carId, startDate: startDateStr, endDate: endDateStr } = validation.data;

    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    if (!isFuture(startDate)) {
      return NextResponse.json({ message: 'Start date-time must be in the future.' }, { status: 400 });
    }
    if (endDate <= startDate) {
      return NextResponse.json({ message: 'End date-time must be after start date-time.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const car = await db.collection<CarDocument>('cars').findOne({ _id: new ObjectId(carId) });
    if (!car) {
      return NextResponse.json({ message: 'Car not found.' }, { status: 404 });
    }

    const settingsCollection = db.collection<SiteSettingsDocument>('settings');
    let siteSettings = await settingsCollection.findOne({ settingsId: SETTINGS_DOC_ID });
    const currency = siteSettings?.defaultCurrency || 'INR'; 

    const existingBookings = await db.collection<Booking>('bookings').find({
      carId: carId,
      status: 'Confirmed', 
      $or: [
        { startDate: { $lt: endDateStr }, endDate: { $gt: startDateStr } },
      ],
    }).toArray();

    if (existingBookings.length > 0) {
      return NextResponse.json({ message: 'Car is not available for the selected date-time range.' }, { status: 409 });
    }

    const rentalHours = differenceInHours(endDate, startDate);
    if (rentalHours < 1) { // Assuming minimum 1 hour rental
        return NextResponse.json({ message: 'Minimum rental duration is 1 hour.' }, { status: 400 });
    }
    const totalPrice = rentalHours * car.pricePerHour; 
    const amountInPaise = Math.round(totalPrice * 100); 

    const nowISO = new Date().toISOString();
    const primaryImageUrl = car.imageUrls && car.imageUrls.length > 0 ? car.imageUrls[0] : undefined;

    const newBookingData: Omit<Booking, 'id'> = {
      carId: carId,
      carName: car.name,
      carImageUrl: primaryImageUrl,
      userId,
      userName,
      startDate: startDateStr,
      endDate: endDateStr,
      totalPrice,
      status: 'Pending', 
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    const bookingResult = await db.collection('bookings').insertOne(newBookingData);
    if (!bookingResult.insertedId) {
        throw new Error('Failed to create pending booking.');
    }
    const newBookingId = bookingResult.insertedId.toHexString();

    const orderOptions = {
      amount: amountInPaise,
      currency: currency,
      receipt: newBookingId, 
      notes: {
        bookingId: newBookingId,
        carName: car.name,
        userId: userId,
      }
    };

    const razorpayOrder = await razorpayInstance.orders.create(orderOptions);

    if (!razorpayOrder || !razorpayOrder.id) {
      await db.collection('bookings').updateOne({ _id: new ObjectId(newBookingId) }, { $set: { status: 'Cancelled', updatedAt: new Date().toISOString() } });
      throw new Error('Failed to create Razorpay order.');
    }

    await db.collection('bookings').updateOne(
      { _id: new ObjectId(newBookingId) },
      { $set: { razorpayOrderId: razorpayOrder.id, updatedAt: new Date().toISOString() } }
    );
    
    return NextResponse.json({
      message: 'Razorpay order created',
      bookingId: newBookingId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount, 
      currency: razorpayOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
      userName: userName,
      userEmail: userEmail,
    });

  } catch (error: any) {
    console.error('Razorpay order creation failed:', error);
    return NextResponse.json({ message: error.message || 'Failed to create Razorpay order' }, { status: 500 });
  }
}
