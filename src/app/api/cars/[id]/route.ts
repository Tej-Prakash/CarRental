
// src/app/api/cars/[id]/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { Car } from '@/types';
import { ObjectId } from 'mongodb';

interface CarDocument extends Omit<Car, 'id'> {
  _id: ObjectId;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    return NextResponse.json(car, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch car:', error);
    return NextResponse.json({ message: 'Failed to fetch car' }, { status: 500 });
  }
}
