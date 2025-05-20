
// src/app/api/cars/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { Car } from '@/types';
import type { ObjectId } from 'mongodb';

interface CarDocument extends Omit<Car, 'id'> {
  _id: ObjectId;
}

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const carsCollection = db.collection<CarDocument>('cars');
    
    const carsFromDb = await carsCollection.find({}).sort({ name: 1 }).toArray();

    const cars: Car[] = carsFromDb.map(carDoc => {
      const { _id, ...rest } = carDoc;
      // Ensure all fields from Car type are present and correctly typed
      const car: Car = {
        id: _id.toHexString(),
        name: rest.name,
        type: rest.type,
        pricePerDay: rest.pricePerDay,
        imageUrl: rest.imageUrl,
        description: rest.description,
        longDescription: rest.longDescription,
        features: rest.features,
        availability: rest.availability.map(a => ({ startDate: String(a.startDate), endDate: String(a.endDate) })),
        seats: rest.seats,
        engine: rest.engine,
        transmission: rest.transmission,
        fuelType: rest.fuelType,
        rating: rest.rating,
        reviews: rest.reviews,
        location: rest.location,
        aiHint: rest.aiHint,
      };
      return car;
    });

    return NextResponse.json(cars, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch cars:', error);
    return NextResponse.json({ message: 'Failed to fetch cars' }, { status: 500 });
  }
}
