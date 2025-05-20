// src/app/api/auth/register/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import type { User } from '@/types'; // Ensure User type is appropriate

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(); // Defaults to DB name in connection string or 'test'

    const existingUser = await db.collection<User>('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists with this email' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: Omit<User, 'id'> & { passwordHash: string } = {
      name: fullName,
      email,
      passwordHash: hashedPassword, // Store hashed password
      role: 'User', // Default role
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection('users').insertOne(newUser);
    
    // Create a user object to return, omitting the passwordHash
    const registeredUser: Partial<User> = {
        // id: result.insertedId.toString(), // MongoDB _id is an ObjectId, convert if needed or let it be
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
    }


    return NextResponse.json({ message: 'User registered successfully', user: registeredUser }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
