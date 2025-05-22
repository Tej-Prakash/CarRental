
// src/app/api/admin/cars/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { Car } from '@/types';
import { CarInputSchema, type CarInput } from '@/lib/schemas/car'; 
import { ObjectId, type Filter } from 'mongodb';

interface CarDocument extends Omit<Car, 'id'> {
  _id: ObjectId;
}

const ITEMS_PER_PAGE = 10;

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req, 'Admin');
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }

  try {
    const rawData = await req.json();
    const validation = CarInputSchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid car data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const carData: CarInput = validation.data;

    const client = await clientPromise;
    const db = client.db();
    
    const newCarDocument = {
        ...carData,
        pricePerHour: Number(carData.pricePerHour), 
        availability: carData.availability.map(a => ({
          startDate: new Date(a.startDate).toISOString(),
          endDate: new Date(a.endDate).toISOString(),
      })),
      imageUrls: carData.imageUrls.map(url => (url.startsWith('/') ? url : `/assets/images/${url.split('/').pop()}`)),
    };

    const result = await db.collection('cars').insertOne(newCarDocument);
    
    if (!result.insertedId) {
        throw new Error('Failed to insert car into database.');
    }
    
    const insertedCar: Car = {
        id: result.insertedId.toHexString(),
        ...carData,
        pricePerHour: newCarDocument.pricePerHour, 
        availability: newCarDocument.availability, 
        imageUrls: newCarDocument.imageUrls,
    };

    return NextResponse.json(insertedCar, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add car:', error);
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return NextResponse.json({ message: 'A car with similar identifying features already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: error.message || 'Failed to add car' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req, 'Admin');
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString(), 10);
    const searchTerm = searchParams.get('search');
    const typeFilter = searchParams.get('type');

    const query: Filter<CarDocument> = {};
    if (searchTerm) {
      query.name = { $regex: searchTerm, $options: 'i' };
    }
    if (typeFilter && typeFilter !== 'all') {
      query.type = typeFilter as Car['type'];
    }

    const client = await clientPromise;
    const db = client.db();
    const carsCollection = db.collection<CarDocument>('cars');
    
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
    console.error('Failed to fetch cars for admin:', error);
    return NextResponse.json({ message: 'Failed to fetch cars' }, { status: 500 });
  }
}
