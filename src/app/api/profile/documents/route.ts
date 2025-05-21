
// src/app/api/profile/documents/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { UserDocument, DocumentType } from '@/types';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const DocumentUploadSchema = z.object({
  documentType: z.enum(['PhotoID', 'DrivingLicense']),
  fileName: z.string().min(1, "Original file name is required"),
  filePath: z.string().min(1, "File path is required"), // Path returned by /api/upload
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
    
    const { documentType, fileName, filePath } = validation.data;

    const newDocumentEntry: UserDocument = {
      type: documentType as DocumentType,
      fileName, // Original filename for reference
      filePath, // Server path where file is stored
      uploadedAt: new Date().toISOString(),
      status: 'Pending', // Default status
    };

    const client = await clientPromise;
    const db = client.db();
    
    // Remove existing document of the same type, then add new one.
    // This ensures only one document of each type (PhotoID, DrivingLicense) is active for review at a time.
    // If you want to keep history, this logic would need to change.
    await db.collection('users').updateOne(
      { _id: new ObjectId(authResult.user.userId) },
      { 
        $pull: { documents: { type: documentType } },
      }
    );
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(authResult.user.userId) },
      {
        $push: { documents: newDocumentEntry },
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
     const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(authResult.user.userId) },
      { projection: { documents: 1, passwordHash: 0 } } 
    );

    return NextResponse.json({ 
      message: `${documentType} details recorded successfully. Status: Pending. File stored at ${filePath}.`, 
      documents: updatedUser?.documents || [] 
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to record document details:', error);
    return NextResponse.json({ message: 'Failed to record document details' }, { status: 500 });
  }
}
