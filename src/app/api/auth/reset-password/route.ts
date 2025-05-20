// src/app/api/auth/reset-password/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { User } from '@/types';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

interface UserDocument extends Omit<User, 'id'> {
  _id: ObjectId;
  passwordHash: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ message: 'Token and new password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<UserDocument>('users');

    const user = await usersCollection.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }, // Check if token is not expired
    });

    if (!user) {
      return NextResponse.json({ message: 'Password reset token is invalid or has expired.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash: hashedPassword,
          updatedAt: new Date().toISOString(),
        },
        $unset: { // Remove token fields after successful reset
          resetPasswordToken: "",
          resetPasswordExpires: "",
        },
      }
    );

    // Optionally, send a password change confirmation email here

    return NextResponse.json({ message: 'Your password has been successfully reset. You can now log in with your new password.' }, { status: 200 });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'An error occurred. Please try again.' }, { status: 500 });
  }
}
