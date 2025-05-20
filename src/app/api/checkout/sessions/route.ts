// src/app/api/checkout/sessions/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { Car, Booking } from '@/types';
import { ObjectId } from 'mongodb';
import { differenceInCalendarDays, isFuture, parseISO } from 'date-fns';
import { z } from 'zod';

const CheckoutInputSchema = z.object({
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
    const validation = CheckoutInputSchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
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
      status: 'Confirmed', // Only check against confirmed bookings for availability
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
    const totalPrice = rentalDays * car.pricePerDay; // Price in dollars

    // Create booking in DB first (simplified flow)
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
      status: 'Confirmed', // Simplified: Confirming before payment
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    const bookingResult = await db.collection('bookings').insertOne(newBookingData);
    if (!bookingResult.insertedId) {
        throw new Error('Failed to create booking before Stripe session.');
    }
    const newBookingId = bookingResult.insertedId.toHexString();

    console.log(`SIMULATED EMAIL: Booking ${newBookingId} for ${car.name} by ${userName} confirmed (pending payment).`);

    // Create Stripe Checkout Session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd', // Assuming USD, adjust if currency is dynamic
            product_data: {
              name: `${car.name} - Rental (${rentalDays} day${rentalDays !== 1 ? 's' : ''})`,
              images: primaryImageUrl ? [primaryImageUrl] : [],
            },
            unit_amount: Math.round(totalPrice * 100), // Stripe expects amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/booking/success?booking_id=${newBookingId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cars/${carId}`,
      metadata: {
        bookingId: newBookingId,
        userId: userId,
        carId: carId,
      },
      customer_email: authResult.user.email, // Pre-fill customer email
    });

    if (!session.id) {
      // If session creation fails, ideally, we would roll back the booking or mark it as 'failed_payment_initiation'
      // For now, this is a simplified error.
      await db.collection('bookings').updateOne({ _id: new ObjectId(newBookingId) }, { $set: { status: 'Pending' } }); // Revert to pending if stripe fails
      throw new Error('Failed to create Stripe session.');
    }
    
    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Checkout session creation failed:', error);
    return NextResponse.json({ message: error.message || 'Failed to create checkout session' }, { status: 500 });
  }
}
