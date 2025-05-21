
// src/app/api/profile/favorites/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import { ObjectId } from 'mongodb';
import type { Car, User } from '@/types';

interface UserDbDoc extends Omit<User, 'id'> {
  _id: ObjectId;
  passwordHash?: string;
  favoriteCarIds?: string[];
}

interface CarDbDoc extends Omit<Car, 'id'> {
  _id: ObjectId;
}

// POST to add a car to favorites
export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }
  const userId = authResult.user.userId;

  try {
    const { carId } = await req.json();
    if (!carId || typeof carId !== 'string') {
      return NextResponse.json({ message: 'Car ID is required and must be a string' }, { status: 400 });
    }
    // No need to validate carId as ObjectId here, as it's stored as string

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<UserDbDoc>('users');

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $addToSet: { favoriteCarIds: carId } } // Use $addToSet to avoid duplicates
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) }, { projection: { favoriteCarIds: 1 } });

    return NextResponse.json({ favoriteCarIds: updatedUser?.favoriteCarIds || [] }, { status: 200 });

  } catch (error) {
    console.error('Failed to add car to favorites:', error);
    return NextResponse.json({ message: 'Failed to add car to favorites' }, { status: 500 });
  }
}

// GET to fetch favorite cars
export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }
  const userId = authResult.user.userId;

  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<UserDbDoc>('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) }, { projection: { favoriteCarIds: 1 } });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const favoriteCarIds = user.favoriteCarIds || [];
    if (favoriteCarIds.length === 0) {
      return NextResponse.json([], { status: 200 }); // Return empty array if no favorites
    }

    // Convert string IDs to ObjectIds for querying the cars collection
    const favoriteCarObjectIds = favoriteCarIds.map(id => {
      try {
        return new ObjectId(id);
      } catch (e) {
        console.warn(`Invalid ObjectId string in user's favorites: ${id}`);
        return null; // Handle invalid IDs gracefully
      }
    }).filter(id => id !== null) as ObjectId[];


    const carsCollection = db.collection<CarDbDoc>('cars');
    const favoriteCarsFromDb = await carsCollection.find({ _id: { $in: favoriteCarObjectIds } }).toArray();
    
    const favoriteCars: Car[] = favoriteCarsFromDb.map(carDoc => {
      const { _id, ...rest } = carDoc;
      return {
        id: _id.toHexString(),
        ...rest,
        availability: rest.availability.map(a => ({
          startDate: typeof a.startDate === 'string' ? a.startDate : new Date(a.startDate).toISOString(),
          endDate: typeof a.endDate === 'string' ? a.endDate : new Date(a.endDate).toISOString()
        })),
      };
    });

    return NextResponse.json(favoriteCars, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch favorite cars:', error);
    return NextResponse.json({ message: 'Failed to fetch favorite cars' }, { status: 500 });
  }
}
