
// src/app/api/admin/users/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { User, UserDocument as UserTypeDocument } from '@/types'; 
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const UserInputSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.enum(['User', 'Admin']),
});

interface UserDbDoc {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'User' | 'Admin';
  createdAt: string; 
  updatedAt?: string; 
  address?: UserTypeDocument['address']; 
  location?: string;
  documents?: UserTypeDocument[]; 
}

const ITEMS_PER_PAGE = 10;

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req, 'Admin');
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }

  try {
    const rawData = await req.json();
    const validation = UserInputSchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid user data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { name, email, password, role } = validation.data;

    const client = await clientPromise;
    const db = client.db();

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists with this email' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isoCreatedAt = new Date().toISOString();

    const newUserDocument = {
      name,
      email,
      passwordHash: hashedPassword,
      role,
      createdAt: isoCreatedAt,
      updatedAt: isoCreatedAt, 
      documents: [], 
    };

    const result = await db.collection('users').insertOne(newUserDocument);
    
    if (!result.insertedId) {
        throw new Error('Failed to insert user into database.');
    }

    const createdUser: User = {
      id: result.insertedId.toHexString(),
      name,
      email,
      role,
      createdAt: isoCreatedAt,
      documents: [],
    };

    return NextResponse.json(createdUser, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add user:', error);
     if (error.name === 'MongoServerError' && error.code === 11000) {
      return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: error.message || 'Failed to add user' }, { status: 500 });
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

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<UserDbDoc>('users');
    
    const query = {}; // For future search/filter on this page

    const totalItems = await usersCollection.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const usersFromDb = await usersCollection
      .find(query, { projection: { passwordHash: 0 } })
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const usersData: User[] = usersFromDb.map(userDoc => {
      const { _id, passwordHash, ...rest } = userDoc; 
      return { 
        id: _id.toHexString(),
        name: rest.name,
        email: rest.email,
        role: rest.role,
        createdAt: String(rest.createdAt),
        updatedAt: rest.updatedAt ? String(rest.updatedAt) : undefined,
        address: rest.address,
        location: rest.location,
        documents: rest.documents || [], 
      };
    });

    return NextResponse.json({
      data: usersData,
      totalItems,
      totalPages,
      currentPage: page,
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch users for admin:', error);
    return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
  }
}
