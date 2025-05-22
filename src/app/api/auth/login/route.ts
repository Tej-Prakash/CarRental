
// src/app/api/auth/login/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User } from '@/types';
import { getSiteSettings } from '@/lib/settingsUtils'; // Import the helper

interface UserWithPasswordHash extends User {
  passwordHash: string;
}

const DEFAULT_JWT_EXPIRATION_SECONDS = 3600; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection<UserWithPasswordHash>('users').findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined');
      return NextResponse.json({ message: 'Internal server configuration error' }, { status: 500 });
    }

    // Fetch site settings to get session timeout
    const siteSettings = await getSiteSettings();
    const sessionTimeoutMinutes = siteSettings.sessionTimeoutMinutes || (DEFAULT_JWT_EXPIRATION_SECONDS / 60);
    const expiresInSeconds = sessionTimeoutMinutes * 60;
    const expiresInValue = `${expiresInSeconds}s`;


    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, name: user.name },
      jwtSecret,
      { expiresIn: expiresInValue }
    );

    const { passwordHash, ...userWithoutPassword } = user;

    return NextResponse.json({ message: 'Login successful', token, user: userWithoutPassword }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
