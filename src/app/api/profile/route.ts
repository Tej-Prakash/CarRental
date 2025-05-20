
// src/app/api/profile/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { User, Address } from '@/types';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

interface UserProfileUpdateInput {
  name?: string;
  address?: Address;
  location?: string;
}

const AddressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
});

const ProfileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  address: AddressSchema.optional(),
  location: z.string().min(1, "Location is required").optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update.",
});


export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(authResult.user.userId) },
      { projection: { passwordHash: 0 } } // Exclude password hash
    );

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const { _id, ...userData } = user;
    return NextResponse.json({ ...userData, id: _id.toHexString() } as User, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return NextResponse.json({ message: 'Failed to fetch user profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }

  try {
    const rawData = await req.json();
    const validation = ProfileUpdateSchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid profile data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const updateData: UserProfileUpdateInput = validation.data;
    const updateFields: Record<string, any> = {};

    if (updateData.name) updateFields.name = updateData.name;
    if (updateData.address) updateFields.address = updateData.address;
    if (updateData.location) updateFields.location = updateData.location;
    
    if (Object.keys(updateFields).length === 0) {
        return NextResponse.json({ message: 'No fields to update or invalid data provided.' }, { status: 400 });
    }

    updateFields.updatedAt = new Date().toISOString();

    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(authResult.user.userId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
        // This can happen if the data submitted is the same as existing data
        // Or if only `updatedAt` was set with no other changes
        // For simplicity, we can return the current user data or a success message
        const updatedUser = await db.collection('users').findOne(
            { _id: new ObjectId(authResult.user.userId) },
            { projection: { passwordHash: 0 } }
        );
        const { _id, ...userData } = updatedUser!; // Non-null assertion as we matched one
        return NextResponse.json({ message: 'Profile updated (or no changes detected).', user: { ...userData, id: _id.toHexString() } as User }, { status: 200 });
    }

    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(authResult.user.userId) },
      { projection: { passwordHash: 0 } }
    );
     const { _id, ...userData } = updatedUser!;
    return NextResponse.json({ message: 'Profile updated successfully', user: { ...userData, id: _id.toHexString() } as User }, { status: 200 });

  } catch (error) {
    console.error('Failed to update user profile:', error);
    return NextResponse.json({ message: 'Failed to update user profile' }, { status: 500 });
  }
}
