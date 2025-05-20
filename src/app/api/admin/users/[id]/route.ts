
// src/app/api/admin/users/[id]/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { User } from '@/types';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

interface UserDocument extends Omit<User, 'id'> {
  _id: ObjectId;
  passwordHash?: string; // Ensure passwordHash can exist on the document
}

const UpdateUserSchema = z.object({
  name: z.string().min(1, "Full name is required").optional(),
  role: z.enum(['User', 'Admin']).optional(),
  // Password updates are intentionally omitted here for simplicity.
  // A separate, more secure flow (e.g., password reset) is recommended for password changes.
});

// GET a single user by ID (Admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyAuth(req, 'Admin');
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }

  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<UserDocument>('users');
    
    const userDoc = await usersCollection.findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } }); // Exclude passwordHash

    if (!userDoc) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { _id, ...rest } = userDoc;
    const userResponse: User = {
      id: _id.toHexString(),
      name: rest.name,
      email: rest.email,
      role: rest.role,
      createdAt: String(rest.createdAt), // Ensure string
      address: rest.address,
      location: rest.location,
      documents: rest.documents,
    };

    return NextResponse.json(userResponse, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch user for admin:', error);
    return NextResponse.json({ message: 'Failed to fetch user for admin' }, { status: 500 });
  }
}

// PUT (Update) a user by ID (Admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyAuth(req, 'Admin');
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }

  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    const rawData = await req.json();
    const validation = UpdateUserSchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid user data for update', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const userDataToUpdate = validation.data;
    
    if (Object.keys(userDataToUpdate).length === 0) {
        return NextResponse.json({ message: "No fields to update provided." }, { status: 400 });
    }
    
    const updatePayload: { [key: string]: any } = { ...userDataToUpdate };
    updatePayload.updatedAt = new Date().toISOString();


    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<UserDocument>('users');

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'User not found for update' }, { status: 404 });
    }
    
    // If modifiedCount is 0 but matchedCount is 1, it means data was same or only updatedAt was set.
    // We can still return the user data.
    const updatedUserDoc = await usersCollection.findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } });
    if (!updatedUserDoc) {
        // Should not happen if matchedCount was 1
        return NextResponse.json({ message: 'Failed to retrieve updated user after update.' }, { status: 500 });
    }

    const { _id, ...rest } = updatedUserDoc;
    const userResponse: User = {
      id: _id.toHexString(),
      name: rest.name,
      email: rest.email,
      role: rest.role,
      createdAt: String(rest.createdAt),
      address: rest.address,
      location: rest.location,
      documents: rest.documents,
      // Include updatedAt if it exists on rest (after being set)
      ...(rest.updatedAt && { updatedAt: String(rest.updatedAt) }),
    };
    return NextResponse.json(userResponse, { status: 200 });

  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ message: error.message || 'Failed to update user' }, { status: 500 });
  }
}

// DELETE is not typically implemented for users this way by admin, usually soft delete or disable.
// If hard delete is needed, it would be similar to car deletion.
// For now, DELETE is omitted for users.
