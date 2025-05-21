
// src/app/api/profile/documents/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { UserDocument, DocumentType, User } from '@/types';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const DocumentUploadSchema = z.object({
  documentType: z.enum(['PhotoID', 'DrivingLicense']),
  fileName: z.string().min(1, "Original file name is required"),
  filePath: z.string().min(1, "File path is required"), // Path returned by /api/upload
});

interface UserDbDoc extends Omit<User, 'id'> {
  _id: ObjectId;
}

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user || !authResult.user.userId) {
    console.error("Authentication error or missing user ID in /api/profile/documents:", authResult.error);
    return NextResponse.json({ message: authResult.error || 'Authentication required or user ID missing' }, { status: authResult.status || 401 });
  }

  if (!ObjectId.isValid(authResult.user.userId)) {
    console.error("Invalid user ID format for ObjectId:", authResult.user.userId);
    return NextResponse.json({ message: 'Invalid user ID format.' }, { status: 400 });
  }
  const userId = new ObjectId(authResult.user.userId);

  try {
    const rawData = await req.json();
    const validation = DocumentUploadSchema.safeParse(rawData);

    if (!validation.success) {
      console.error("Document upload data validation error:", validation.error.flatten().fieldErrors);
      return NextResponse.json({ message: 'Invalid document data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { documentType, fileName, filePath } = validation.data;

    const newDocumentEntry: UserDocument = {
      type: documentType as DocumentType,
      fileName,
      filePath,
      uploadedAt: new Date().toISOString(),
      status: 'Pending', 
    };

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<UserDbDoc>('users');
    
    // Step 1: Pull existing document of the same type
    console.log(`Attempting to pull document of type ${documentType} for user ${userId.toHexString()}`);
    const pullResult = await usersCollection.updateOne(
      { _id: userId },
      { 
        $pull: { documents: { type: documentType } },
      }
    );
    console.log(`Pull result for user ${userId.toHexString()}, type ${documentType}: matched: ${pullResult.matchedCount}, modified: ${pullResult.modifiedCount}`);
    
    // If pullResult.matchedCount is 0, it means either the user doesn't exist or they didn't have a document of this type.
    // We should ensure the user exists before trying to push.

    // Step 2: Push the new document entry
    console.log(`Attempting to push new document for user ${userId.toHexString()}:`, JSON.stringify(newDocumentEntry));
    const pushResult = await usersCollection.updateOne(
      { _id: userId },
      {
        $push: { documents: newDocumentEntry },
        $set: { updatedAt: new Date().toISOString() }
      }
    );
    console.log(`Push result for user ${userId.toHexString()}: matched: ${pushResult.matchedCount}, modified: ${pushResult.modifiedCount}`);

    if (pushResult.matchedCount === 0) {
      // This implies the user was not found during the push, which is critical.
      console.error(`User ${userId.toHexString()} not found during document push operation. This should not happen if pull matched or user was verified.`);
      return NextResponse.json({ message: 'User not found during update. Please try logging in again.' }, { status: 404 });
    }
    
    const updatedUser = await usersCollection.findOne(
      { _id: userId },
      { projection: { documents: 1, passwordHash: 0 } } 
    );

    return NextResponse.json({ 
      message: `${documentType} details recorded successfully. Status: Pending. File stored at ${filePath}.`, 
      documents: updatedUser?.documents || [] 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to record document details in API /api/profile/documents:', error);
    const errorMessage = error.message || 'An unexpected error occurred while recording document details.';
    return NextResponse.json({ message: errorMessage, errorDetails: error.toString() }, { status: 500 });
  }
}
