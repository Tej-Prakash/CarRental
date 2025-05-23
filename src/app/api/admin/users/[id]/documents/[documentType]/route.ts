
// src/app/api/admin/users/[id]/documents/[documentType]/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { User, DocumentStatus, DocumentType, UserDocument as UserDocType, UserRole } from '@/types';
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
  { params }: { params: { id: string; documentType: string } }
) {
  const authResult = await verifyAuth(req, ['Admin', 'Manager']);

  if (authResult.error || !authResult.user) { 
    return NextResponse.json(
      { message: authResult.error || 'Authentication required' },
      { status: authResult.status || 401 } 
    );
  }
  
  const adminUserId = authResult.user.userId; 

  const { id: userIdFromParams, documentType } = params;

  if (!ObjectId.isValid(userIdFromParams)) {
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

    const user = await usersCollection.findOne({ _id: new ObjectId(userIdFromParams) });
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
      [`documents.${documentIndex}.verifiedBy`]: adminUserId, // Store admin's ID
    };
    if (adminComments !== undefined) {
      updateFields[`documents.${documentIndex}.adminComments`] = adminComments;
    } else if (status === 'Approved') {
      if (user.documents && user.documents[documentIndex].adminComments && adminComments === undefined){
          updateFields[`documents.${documentIndex}.adminComments`] = '';
      } else if (adminComments === '') {
           updateFields[`documents.${documentIndex}.adminComments`] = '';
      }
    }


    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userIdFromParams), 'documents.type': docType },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: `Failed to find ${docType} for update or user not found.` }, { status: 404 });
    }

    const updatedUserDoc = await usersCollection.findOne({ _id: new ObjectId(userIdFromParams) }, { projection: { passwordHash: 0 } });
     if (!updatedUserDoc) {
        console.error(`Failed to retrieve updated user ${userIdFromParams} after document status update.`);
        return NextResponse.json({ message: 'Failed to retrieve updated user data.' }, { status: 500 });
    }

    const { _id, ...restOfUser } = updatedUserDoc;
    const updatedUserResponse: User = {
        id: _id.toHexString(),
        name: restOfUser.name,
        email: restOfUser.email,
        role: restOfUser.role,
        createdAt: String(restOfUser.createdAt),
        updatedAt: restOfUser.updatedAt ? String(restOfUser.updatedAt) : undefined,
        address: restOfUser.address,
        location: restOfUser.location,
        favoriteCarIds: restOfUser.favoriteCarIds || [],
        documents: (restOfUser.documents || []).map(d => ({
            ...d,
            uploadedAt: String(d.uploadedAt),
            verifiedAt: d.verifiedAt ? String(d.verifiedAt) : undefined,
        })) as UserDocType[],
    };

    console.log(`SIMULATED EMAIL to ${user.email}: Your ${docType} has been ${status}. Comments: ${adminComments || 'N/A'}`);

    return NextResponse.json(updatedUserResponse, { status: 200 });

  } catch (error: any) {
    console.error(`Failed to update document status for user ${userIdFromParams}, document ${docType}:`, error);
    return NextResponse.json({ message: error.message || 'Failed to update document status due to an unexpected error.' }, { status: 500 });
  }
}
