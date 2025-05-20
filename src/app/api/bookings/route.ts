
// src/app/api/bookings/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { Booking, Car } from '@/types';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { differenceInCalendarDays, isFuture, parseISO } from 'date-fns';

// This route is now primarily for direct booking creation (e.g., by an admin or if payments are handled separately)
// For user-initiated bookings with payment, /api/checkout/razorpay-order is used.

const BookingInputSchema = z.object({
  carId: z.string().refine((val) => ObjectId.isValid(val), { message: "Invalid car ID" }),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
  // Optional: Allow admin to set status directly, otherwise defaults to 'Confirmed' for direct bookings
  status: z.enum(['Pending', 'Confirmed', 'Cancelled', 'Completed', 'Cancellation Requested', 'Cancellation Rejected']).optional(), 
});

interface CarDocument extends Omit<Car, 'id'> {
  _id: ObjectId;
}

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req); // Admin might also use this endpoint
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }
  const { userId, name: userName, role: userRole } = authResult.user;

  try {
    const rawData = await req.json();
    const validation = BookingInputSchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid booking data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { carId, startDate: startDateStr, endDate: endDateStr, status: explicitStatus } = validation.data;

    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    if (!isFuture(startDate) && userRole !== 'Admin') { // Admin might book for past dates for record keeping
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

    // For direct bookings, check against 'Confirmed' or 'Pending' (if admin creates pending)
    const conflictingStatus: Booking['status'][] = ['Confirmed', 'Pending'];
    const existingBookings = await db.collection<Booking>('bookings').find({
      carId: carId,
      status: { $in: conflictingStatus },
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

    // If an admin provides a status, use it. Otherwise, default to 'Confirmed' for direct bookings.
    const finalStatus: Booking['status'] = (userRole === 'Admin' && explicitStatus) ? explicitStatus : 'Confirmed';


    const newBookingData = {
      carId: carId,
      carName: car.name,
      carImageUrl: primaryImageUrl,
      userId,
      userName,
      startDate: startDateStr,
      endDate: endDateStr,
      totalPrice,
      status: finalStatus,
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

    console.log(`SIMULATED EMAIL: Booking ${createdBooking.id} for ${car.name} by ${userName} created with status ${finalStatus}. (Direct Booking API)`);

    return NextResponse.json(createdBooking, { status: 201 });

  } catch (error: any) {
    console.error('Failed to create booking via direct API:', error);
    return NextResponse.json({ message: error.message || 'Failed to create booking' }, { status: 500 });
  }
}
