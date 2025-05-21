
// src/app/api/profile/favorites/[carId]/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import { ObjectId } from 'mongodb';
import type { User } from '@/types';

interface UserDbDoc extends Omit<User, 'id'> {
  _id: ObjectId;
  passwordHash?: string;
  favoriteCarIds?: string[];
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { carId: string } }
) {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }
  const userId = authResult.user.userId;
  const { carId } = params;

  if (!carId || typeof carId !== 'string') {
    return NextResponse.json({ message: 'Car ID parameter is required' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<UserDbDoc>('users');

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $pull: { favoriteCarIds: carId } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Fetch the updated favorite list to return
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) }, { projection: { favoriteCarIds: 1 } });

    return NextResponse.json({ favoriteCarIds: updatedUser?.favoriteCarIds || [] }, { status: 200 });

  } catch (error) {
    console.error('Failed to remove car from favorites:', error);
    return NextResponse.json({ message: 'Failed to remove car from favorites' }, { status: 500 });
  }
}
