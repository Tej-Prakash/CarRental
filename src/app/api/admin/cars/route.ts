
// src/app/api/admin/cars/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { Car } from '@/types';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

// Zod schema for car validation
const CarInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(['Sedan', 'SUV', 'Hatchback', 'Truck', 'Van', 'Convertible', 'Coupe']),
  pricePerDay: z.number().positive("Price must be positive"),
  imageUrl: z.string().url("Image URL must be valid"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  longDescription: z.string().min(20, "Long description must be at least 20 characters"),
  features: z.array(z.string()).min(1, "At least one feature is required"),
  availability: z.array(z.object({
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
  })).min(1, "Availability is required"),
  seats: z.number().int().min(1, "Seats must be at least 1"),
  engine: z.string().min(1, "Engine details are required"),
  transmission: z.enum(['Automatic', 'Manual']),
  fuelType: z.enum(['Gasoline', 'Diesel', 'Electric', 'Hybrid']),
  rating: z.number().min(0).max(5).optional().default(0), // Defaulted in schema
  reviews: z.number().int().min(0).optional().default(0), // Defaulted in schema
  location: z.string().min(1, "Location is required"),
  aiHint: z.string().optional(),
});

type CarInput = z.infer<typeof CarInputSchema>;

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

    const client = await clientPromise;
    const db = client.db();
    
    const newCarDocument = {
        ...carData,
        // Convert availability date strings to Date objects if storing as BSON Dates
        // For this example, they are stored as strings as per schema and Car type
        availability: carData.availability.map(a => ({
          startDate: a.startDate, // Already string
          endDate: a.endDate,     // Already string
      })),
    };

    const result = await db.collection('cars').insertOne(newCarDocument);
    
    if (!result.insertedId) {
        throw new Error('Failed to insert car into database.');
    }
    
    const insertedCar: Car = {
        id: result.insertedId.toHexString(),
        ...carData, // Spread validated data. Rating/reviews are defaulted by Zod if not provided.
    };

    return NextResponse.json(insertedCar, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add car:', error);
    if (error.name === 'MongoServerError' && error.code === 11000) { // Duplicate key error
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
    console.error('Failed to fetch cars for admin:', error);
    return NextResponse.json({ message: 'Failed to fetch cars' }, { status: 500 });
  }
}
