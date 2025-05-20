
// src/app/api/bookings/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { Booking, Car } from '@/types';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { differenceInCalendarDays, isFuture, parseISO } from 'date-fns';

const BookingInputSchema = z.object({
  carId: z.string().refine((val) => ObjectId.isValid(val), { message: "Invalid car ID" }),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
});

interface CarDocument extends Omit<Car, 'id'> {
  _id: ObjectId;
}

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }
  const { userId, name: userName } = authResult.user;

  try {
    const rawData = await req.json();
    const validation = BookingInputSchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid booking data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { carId, startDate: startDateStr, endDate: endDateStr } = validation.data;

    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    if (!isFuture(startDate)) {
      return NextResponse.json({ message: 'Start date must be in the future.' }, { status: 400 });
    }
    if (endDate <= startDate) {
      return NextResponse.json({ message: 'End date must be after start date.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const car = await db.collection<CarDocument>('cars').findOne({ _id: new ObjectId(carId) });
    if (!car) {
      return NextResponse.json({ message: 'Car not found.' }, { status: 404 });
    }

    const existingBookings = await db.collection<Booking>('bookings').find({
      carId: carId,
      status: 'Confirmed',
      $or: [
        { startDate: { $lt: endDateStr }, endDate: { $gt: startDateStr } },
      ],
    }).toArray();

    if (existingBookings.length > 0) {
      return NextResponse.json({ message: 'Car is not available for the selected dates.' }, { status: 409 });
    }

    const rentalDays = differenceInCalendarDays(endDate, startDate);
    if (rentalDays < 1) {
        return NextResponse.json({ message: 'Minimum rental duration is 1 day.' }, { status: 400 });
    }
    const totalPrice = rentalDays * car.pricePerDay;

    const nowISO = new Date().toISOString();
    const primaryImageUrl = car.imageUrls && car.imageUrls.length > 0 ? car.imageUrls[0] : undefined;

    const newBookingData = {
      carId: carId,
      carName: car.name,
      carImageUrl: primaryImageUrl,
      userId,
      userName,
      startDate: startDateStr,
      endDate: endDateStr,
      totalPrice,
      status: 'Confirmed' as Booking['status'],
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    const result = await db.collection('bookings').insertOne(newBookingData);
    
    if (!result.insertedId) {
        throw new Error('Failed to create booking.');
    }
    
    const createdBooking: Booking = {
        id: result.insertedId.toHexString(),
        ...newBookingData,
    };

    console.log('Simulating email notification for booking:', createdBooking.id, 'to user:', userName);

    return NextResponse.json(createdBooking, { status: 201 });

  } catch (error: any) {
    console.error('Failed to create booking:', error);
    return NextResponse.json({ message: error.message || 'Failed to create booking' }, { status: 500 });
  }
}
