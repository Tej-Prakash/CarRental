
// src/app/api/admin/cars/[id]/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { Car } from '@/types';
import { ObjectId } from 'mongodb';
import { CarInputSchema as CreateCarInputSchema } from '../route'; // Import from sibling route.ts
import { z } from 'zod';

// Schema for updating a car (all fields optional)
const UpdateCarInputSchema = CreateCarInputSchema.partial();
type UpdateCarInput = z.infer<typeof UpdateCarInputSchema>;

interface CarDocument extends Omit<Car, 'id'> {
  _id: ObjectId;
}

// GET a single car by ID (Admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyAuth(req, 'Admin');
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }

  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid car ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const carsCollection = db.collection<CarDocument>('cars');
    
    const carDoc = await carsCollection.findOne({ _id: new ObjectId(id) });

    if (!carDoc) {
      return NextResponse.json({ message: 'Car not found' }, { status: 404 });
    }

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

    return NextResponse.json(car, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch car for admin:', error);
    return NextResponse.json({ message: 'Failed to fetch car for admin' }, { status: 500 });
  }
}

// PUT (Update) a car by ID (Admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyAuth(req, 'Admin');
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }

  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid car ID format' }, { status: 400 });
    }

    const rawData = await req.json();
    const validation = UpdateCarInputSchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid car data for update', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const carDataToUpdate: UpdateCarInput = validation.data;

    // Ensure numbers are correctly typed if they arrive as strings from partial schema
    if (carDataToUpdate.pricePerDay !== undefined) carDataToUpdate.pricePerDay = Number(carDataToUpdate.pricePerDay);
    if (carDataToUpdate.seats !== undefined) carDataToUpdate.seats = Number(carDataToUpdate.seats);
    if (carDataToUpdate.rating !== undefined) carDataToUpdate.rating = Number(carDataToUpdate.rating);
    if (carDataToUpdate.reviews !== undefined) carDataToUpdate.reviews = Number(carDataToUpdate.reviews);


    const client = await clientPromise;
    const db = client.db();
    const carsCollection = db.collection<CarDocument>('cars');

    const result = await carsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: carDataToUpdate }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Car not found for update' }, { status: 404 });
    }
     if (result.modifiedCount === 0 && result.matchedCount > 0) {
      // No actual changes were made, but the car was found.
      // Fetch and return current car data.
      const currentCar = await carsCollection.findOne({ _id: new ObjectId(id) });
      const { _id, ...rest } = currentCar!; // Non-null assertion ok due to matchedCount
      return NextResponse.json({ id: _id.toHexString(), ...rest }, { status: 200 });
    }


    const updatedCar = await carsCollection.findOne({ _id: new ObjectId(id) });
    const { _id, ...rest } = updatedCar!;
    return NextResponse.json({ id: _id.toHexString(), ...rest }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to update car:', error);
    return NextResponse.json({ message: error.message || 'Failed to update car' }, { status: 500 });
  }
}

// DELETE a car by ID (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyAuth(req, 'Admin');
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }

  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid car ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const carsCollection = db.collection<CarDocument>('cars');

    const result = await carsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Car not found for deletion' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Car deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to delete car:', error);
    return NextResponse.json({ message: error.message || 'Failed to delete car' }, { status: 500 });
  }
}
