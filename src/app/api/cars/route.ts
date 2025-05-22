
// src/app/api/cars/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { Car } from '@/types';
import type { ObjectId, Filter } from 'mongodb';

interface CarDocument extends Omit<Car, 'id'> {
  _id: ObjectId;
}

const ITEMS_PER_PAGE = 9; // Common for public car listings to show more items

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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString(), 10);


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
      query.pricePerHour = priceConditions; 
    }
    
    const totalItems = await carsCollection.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const carsFromDb = await carsCollection
      .find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const carsData: Car[] = carsFromDb.map(carDoc => {
      const { _id, ...rest } = carDoc;
      return {
        id: _id.toHexString(),
        ...rest,
        pricePerHour: rest.pricePerHour,
        availability: rest.availability.map(a => ({ 
            startDate: typeof a.startDate === 'string' ? a.startDate : new Date(a.startDate).toISOString(), 
            endDate: typeof a.endDate === 'string' ? a.endDate : new Date(a.endDate).toISOString() 
        })),
      };
    });

    return NextResponse.json({
      data: carsData,
      totalItems,
      totalPages,
      currentPage: page,
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch cars:', error);
    return NextResponse.json({ message: 'Failed to fetch cars' }, { status: 500 });
  }
}
