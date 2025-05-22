
// src/app/api/admin/cars/[id]/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { Car, UserRole } from '@/types';
import { ObjectId } from 'mongodb';
import { UpdateCarInputSchema, type UpdateCarInput } from '@/lib/schemas/car'; 

interface CarDocument extends Omit<Car, 'id'> {
  _id: ObjectId;
}

// GET a single car by ID (Admin or Manager)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyAuth(req, ['Admin', 'Manager']);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }

  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

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
      pricePerHour: rest.pricePerHour, 
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
    console.error('Failed to fetch car for admin:', error);
    return NextResponse.json({ message: 'Failed to fetch car for admin' }, { status: 500 });
  }
}

// PUT (Update) a car by ID (Admin or Manager)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyAuth(req, ['Admin', 'Manager']);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }

  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid car ID format' }, { status: 400 });
    }

    const rawData = await req.json();
    const validation = UpdateCarInputSchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid car data for update', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const carDataToUpdate: UpdateCarInput = validation.data;
    
    if (carDataToUpdate.availability) {
      carDataToUpdate.availability = carDataToUpdate.availability.map(a => ({
        startDate: new Date(a.startDate).toISOString(),
        endDate: new Date(a.endDate).toISOString(),
      }));
    }
    if (carDataToUpdate.pricePerHour !== undefined) {
        carDataToUpdate.pricePerHour = Number(carDataToUpdate.pricePerHour);
    }
    // Ensure imageUrls are passed as is (relative paths)
    if (carDataToUpdate.imageUrls) {
        carDataToUpdate.imageUrls = carDataToUpdate.imageUrls;
    }


    const updatePayload: { [key: string]: any } = {};
    for (const key in carDataToUpdate) {
      if (carDataToUpdate[key as keyof UpdateCarInput] !== undefined) {
        updatePayload[key] = carDataToUpdate[key as keyof UpdateCarInput];
      }
    }
    
    if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ message: "No fields to update provided." }, { status: 400 });
    }


    const client = await clientPromise;
    const db = client.db();
    const carsCollection = db.collection<CarDocument>('cars');

    const result = await carsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Car not found for update' }, { status: 404 });
    }
     if (result.modifiedCount === 0 && result.matchedCount > 0) {
      const currentCar = await carsCollection.findOne({ _id: new ObjectId(id) });
      const { _id, ...rest } = currentCar!;
       const carResponse: Car = {
        id: _id.toHexString(),
        ...rest,
        pricePerHour: rest.pricePerHour, // ensure this is returned
        availability: rest.availability.map(a => ({ 
            startDate: typeof a.startDate === 'string' ? a.startDate : new Date(a.startDate).toISOString(), 
            endDate: typeof a.endDate === 'string' ? a.endDate : new Date(a.endDate).toISOString() 
        })),
      };
      return NextResponse.json(carResponse, { status: 200 });
    }

    const updatedCarDoc = await carsCollection.findOne({ _id: new ObjectId(id) });
    const { _id, ...rest } = updatedCarDoc!;
    const carResponse: Car = {
      id: _id.toHexString(),
      ...rest,
      pricePerHour: rest.pricePerHour, // ensure this is returned
      availability: rest.availability.map(a => ({ 
        startDate: typeof a.startDate === 'string' ? a.startDate : new Date(a.startDate).toISOString(), 
        endDate: typeof a.endDate === 'string' ? a.endDate : new Date(a.endDate).toISOString() 
      })),
    };
    return NextResponse.json(carResponse, { status: 200 });

  } catch (error: any) {
    console.error('Failed to update car:', error);
    return NextResponse.json({ message: error.message || 'Failed to update car' }, { status: 500 });
  }
}

// DELETE a car by ID (Admin or Manager)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyAuth(req, ['Admin', 'Manager']);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }

  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid car ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const carsCollection = db.collection<CarDocument>('cars');
    
    const bookingsCollection = db.collection('bookings');
    const activeBookings = await bookingsCollection.countDocuments({ 
      carId: id, 
      status: { $in: ['Confirmed', 'Pending', 'Cancellation Requested'] } 
    });

    if (activeBookings > 0) {
      return NextResponse.json({ message: `Cannot delete car. It has ${activeBookings} active or pending booking(s). Please resolve them first.` }, { status: 400 });
    }

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
