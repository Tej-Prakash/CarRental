// src/app/api/auth/forgot-password/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { User } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from '@/lib/email';
import { ObjectId } from 'mongodb';

interface UserDocument extends Omit<User, 'id'> {
  _id: ObjectId;
  passwordHash: string;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<UserDocument>('users');

    const user = await usersCollection.findOne({ email });

    if (!user) {
      // To prevent email enumeration, send a generic success message even if user doesn't exist
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });
    }

    const resetToken = uuidv4();
    const tokenExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: tokenExpiry,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Don't expose email sending failure to client directly, but log it.
      // The user record still has the token, they just didn't get the email.
      // This is a critical error to monitor.
      // For the user, it will appear as if the process worked, they just won't get the email.
    }
    
    return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });

  } catch (error) {
    console.error('Forgot password error:', error);
    // Generic error for the client
    return NextResponse.json({ message: 'An error occurred. Please try again.' }, { status: 500 });
  }
}
