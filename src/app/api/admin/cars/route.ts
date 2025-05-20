
// src/app/api/admin/cars/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { Car } from '@/types';
import { CarInputSchema, type CarInput } from '@/lib/schemas/car'; 
import { ObjectId } from 'mongodb';

interface CarDocument extends Omit<Car, 'id'> {
  _id: ObjectId;
}

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

    // Here, carData.imageUrls are expected to be relative paths like /assets/images/filename.jpg
    // In a real scenario with actual file uploads, this endpoint would handle multipart/form-data,
    // save files to a designated storage (e.g., public/assets/images/ or a cloud storage),
    // and then store the generated paths/URLs in the database.
    // For this simulation, we trust the client-generated paths.

    const client = await clientPromise;
    const db = client.db();
    
    const newCarDocument = {
        ...carData,
        availability: carData.availability.map(a => ({
          startDate: new Date(a.startDate).toISOString(),
          endDate: new Date(a.endDate).toISOString(),
      })),
    };

    const result = await db.collection('cars').insertOne(newCarDocument);
    
    if (!result.insertedId) {
        throw new Error('Failed to insert car into database.');
    }
    
    const insertedCar: Car = {
        id: result.insertedId.toHexString(),
        ...carData, 
        availability: newCarDocument.availability, 
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
    const client = await clientPromise;
    const db = client.db();
    const carsCollection = db.collection<CarDocument>('cars');
    
    const carsFromDb = await carsCollection.find({}).sort({ name: 1 }).toArray();

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
    console.error('Failed to fetch cars for admin:', error);
    return NextResponse.json({ message: 'Failed to fetch cars' }, { status: 500 });
  }
}
