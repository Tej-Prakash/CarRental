
// src/app/api/cars/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { Car } from '@/types';
import type { ObjectId, Filter } from 'mongodb';

interface CarDocument extends Omit<Car, 'id'> {
  _id: ObjectId;
}

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const carsCollection = db.collection<CarDocument>('cars');

    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get('search');
    const carType = searchParams.get('type');
    const minPriceStr = searchParams.get('minPrice');
    const maxPriceStr = searchParams.get('maxPrice');

    const query: Filter<CarDocument> = {};

    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { longDescription: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    if (carType && carType !== 'all') {
      query.type = carType as Car['type'];
    }

    const priceConditions: Record<string, number> = {};
    if (minPriceStr) {
      const minPrice = parseFloat(minPriceStr);
      if (!isNaN(minPrice)) {
        priceConditions.$gte = minPrice;
      }
    }
    if (maxPriceStr) {
      const maxPrice = parseFloat(maxPriceStr);
      if (!isNaN(maxPrice)) {
        priceConditions.$lte = maxPrice;
      }
    }

    if (Object.keys(priceConditions).length > 0) {
      query.pricePerDay = priceConditions;
    }
    
    const carsFromDb = await carsCollection.find(query).sort({ name: 1 }).toArray();

    const cars: Car[] = carsFromDb.map(carDoc => {
      const { _id, ...rest } = carDoc;
      const car: Car = {
        id: _id.toHexString(),
        name: rest.name,
        type: rest.type,
        pricePerDay: rest.pricePerDay,
        minNegotiablePrice: rest.minNegotiablePrice,
        maxNegotiablePrice: rest.maxNegotiablePrice,
        imageUrls: rest.imageUrls,
        description: rest.description,
        longDescription: rest.longDescription,
        features: rest.features,
        availability: rest.availability.map(a => ({ 
            startDate: typeof a.startDate === 'string' ? a.startDate : new Date(a.startDate).toISOString(), 
            endDate: typeof a.endDate === 'string' ? a.endDate : new Date(a.endDate).toISOString() 
        })),
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
