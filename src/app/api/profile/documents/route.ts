
// src/app/api/profile/documents/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { UserDocument } from '@/types';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const DocumentUploadSchema = z.object({
  documentType: z.enum(['PhotoID', 'DrivingLicense']),
  fileName: z.string().min(1, "File name is required"),
});

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication required' }, { status: authResult.status || 401 });
  }

  try {
    const rawData = await req.json();
    const validation = DocumentUploadSchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid document data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { documentType, fileName } = validation.data;

    const newDocument: UserDocument = {
      type: documentType,
      fileName,
      uploadedAt: new Date().toISOString(),
      // In a real app, add fileUrl here after uploading to cloud storage
    };

    const client = await clientPromise;
    const db = client.db();

    // Add or update the document for the user
    // This example simply adds to an array. You might want to replace if a document of the same type exists.
    // For simplicity, we'll allow multiple documents of the same type for now or overwrite.
    // A more robust solution would check if a document of 'type' already exists and update it.
    
    // Option 1: Add to array (allows multiple of same type, which might not be desired)
    // const result = await db.collection('users').updateOne(
    //   { _id: new ObjectId(authResult.user.userId) },
    //   { 
    //     $push: { documents: newDocument },
    //     $set: { updatedAt: new Date().toISOString() }
    //   }
    // );

    // Option 2: Upsert - Remove existing document of the same type, then add new one.
    // This ensures only one document of each type (PhotoID, DrivingLicense)
    await db.collection('users').updateOne(
      { _id: new ObjectId(authResult.user.userId) },
      { 
        $pull: { documents: { type: documentType } },
      }
    );
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(authResult.user.userId) },
      {
        $push: { documents: newDocument },
        $set: { updatedAt: new Date().toISOString() }
      }
    );


    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    if (result.modifiedCount === 0) {
      // This could happen if $pull didn't remove anything and $push also didn't modify (edge case)
      // or if user object structure for documents was missing.
      // For now, assume success if matched.
    }
    
    // Fetch the updated user to return documents array
     const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(authResult.user.userId) },
      { projection: { documents: 1 } } // Only get documents
    );

    return NextResponse.json({ 
      message: `${documentType} uploaded successfully (simulated).`, 
      documents: updatedUser?.documents || [] 
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to upload document:', error);
    return NextResponse.json({ message: 'Failed to upload document' }, { status: 500 });
  }
}
