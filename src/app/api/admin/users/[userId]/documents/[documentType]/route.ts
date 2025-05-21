
// src/app/api/admin/users/[userId]/documents/[documentType]/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { User, DocumentStatus, DocumentType } from '@/types';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

interface UserDbDocument extends Omit<User, 'id'> {
  _id: ObjectId;
  passwordHash?: string;
}

const UpdateDocumentStatusSchema = z.object({
  status: z.enum(['Approved', 'Rejected']),
  adminComments: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string; documentType: string } }
) {
  const authResult = await verifyAuth(req, 'Admin');
  if (authResult.error || !authResult.admin) { // Check for admin user from verifyAuth
    return NextResponse.json({ message: authResult.error || 'Admin authentication required' }, { status: authResult.status || 401 });
  }
  const adminUserId = authResult.admin.userId; // Get admin user ID

  const { userId, documentType } = params;

  if (!ObjectId.isValid(userId)) {
    return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
  }
  if (!['PhotoID', 'DrivingLicense'].includes(documentType)) {
    return NextResponse.json({ message: 'Invalid document type' }, { status: 400 });
  }
  const docType = documentType as DocumentType;

  try {
    const rawData = await req.json();
    const validation = UpdateDocumentStatusSchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid document status data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { status, adminComments } = validation.data;

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<UserDbDocument>('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const documentIndex = user.documents?.findIndex(doc => doc.type === docType);
    if (documentIndex === undefined || documentIndex === -1) {
      return NextResponse.json({ message: `${docType} not found for this user.` }, { status: 404 });
    }

    const updateFields: Record<string, any> = {
      [`documents.${documentIndex}.status`]: status,
      [`documents.${documentIndex}.verifiedAt`]: new Date().toISOString(),
      [`documents.${documentIndex}.verifiedBy`]: adminUserId,
    };
    if (adminComments !== undefined) { // Allow clearing comments with empty string
      updateFields[`documents.${documentIndex}.adminComments`] = adminComments;
    } else if (status === 'Approved') { // Optionally clear comments on approval if not provided
      updateFields[`documents.${documentIndex}.adminComments`] = '';
    }


    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId), 'documents.type': docType }, // Ensure we target the correct document in array
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      // This might happen if the documentType within the array wasn't matched correctly
      return NextResponse.json({ message: `Failed to find ${docType} for update or user not found.` }, { status: 404 });
    }
     if (result.modifiedCount === 0 && result.matchedCount > 0) {
       return NextResponse.json({ message: 'Document status is already the same or no changes made.', user }, { status: 200 });
    }

    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) }, { projection: { passwordHash: 0 } });
    
    // Simulate notification to user (e.g., via email)
    console.log(`SIMULATED EMAIL to ${user.email}: Your ${docType} has been ${status}. Comments: ${adminComments || 'N/A'}`);


    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error: any) {
    console.error(`Failed to update document status for user ${userId}, document ${docType}:`, error);
    return NextResponse.json({ message: error.message || 'Failed to update document status' }, { status: 500 });
  }
}
