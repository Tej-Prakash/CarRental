
// src/app/api/auth/register/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import type { User } from '@/types'; 

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password, phoneNumber } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields (fullName, email, password)' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(); 

    const existingUser = await db.collection<User>('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists with this email' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: Omit<User, 'id'> & { passwordHash: string } = {
      name: fullName,
      email,
      passwordHash: hashedPassword, 
      phoneNumber: phoneNumber || undefined, // Store phone number if provided
      role: 'Customer', 
      createdAt: new Date().toISOString(),
      documents: [],
      favoriteCarIds: [],
    };

    const result = await db.collection('users').insertOne(newUser);
    
    const registeredUser: Partial<User> & { id: string } = {
        id: result.insertedId.toString(), 
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        createdAt: newUser.createdAt,
    }


    return NextResponse.json({ message: 'User registered successfully', user: registeredUser }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
