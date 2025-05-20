
// src/app/api/admin/settings/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { SiteSettings } from '@/types';
import { z } from 'zod';
import type { ObjectId } from 'mongodb';

const SiteSettingsSchema = z.object({
  siteTitle: z.string().min(1, "Site title is required"),
  defaultCurrency: z.enum(['USD', 'EUR', 'GBP', 'INR']).default('INR'),
  // faviconUrl: z.string().url("Favicon URL must be a valid URL").or(z.literal("")).optional(),
});

interface SiteSettingsDocument extends Omit<SiteSettings, 'id'> {
  _id: ObjectId;
  settingsId: string; // To ensure we always update the same document
}

const SETTINGS_DOC_ID = 'main_settings'; // Use a fixed ID for the single settings document


export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req, 'Admin');
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const settingsCollection = db.collection<SiteSettingsDocument>('settings');
    
    let settingsDoc = await settingsCollection.findOne({ settingsId: SETTINGS_DOC_ID });

    if (!settingsDoc) {
      // If no settings exist, return defaults or an empty object for admin to fill
      const defaultSettings: SiteSettings = {
        siteTitle: 'Travel Yatra', // Default site title
        defaultCurrency: 'INR',   // Default currency
      };
      return NextResponse.json(defaultSettings, { status: 200 });
    }
    
    const { _id, settingsId, ...settingsData } = settingsDoc;
    return NextResponse.json({ id: _id.toHexString(), ...settingsData }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch settings for admin:', error);
    return NextResponse.json({ message: 'Failed to fetch settings' }, { status: 500 });
  }
}


export async function PUT(req: NextRequest) {
  const authResult = await verifyAuth(req, 'Admin');
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }

  try {
    const rawData = await req.json();
    const validation = SiteSettingsSchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid settings data', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const settingsDataToUpdate: Partial<Omit<SiteSettings, 'id'>> = validation.data;
    settingsDataToUpdate.updatedAt = new Date().toISOString();

    // If faviconUrl is an empty string, remove it or set to undefined to avoid storing empty string if not desired.
    // if ('faviconUrl' in settingsDataToUpdate && settingsDataToUpdate.faviconUrl === "") {
    //   delete settingsDataToUpdate.faviconUrl; // Or set to undefined if your schema/logic prefers
    // }


    const client = await clientPromise;
    const db = client.db();
    const settingsCollection = db.collection<SiteSettingsDocument>('settings');

    await settingsCollection.updateOne(
      { settingsId: SETTINGS_DOC_ID }, // Filter by our fixed identifier
      { $set: { ...settingsDataToUpdate, settingsId: SETTINGS_DOC_ID } }, // ensure settingsId is part of the doc
      { upsert: true } // Create the document if it doesn't exist
    );
    
    // Fetch the updated/created document to return
    const updatedSettingsDoc = await settingsCollection.findOne({ settingsId: SETTINGS_DOC_ID });
    
    if (!updatedSettingsDoc) {
         console.error('CRITICAL: Settings document not found after upsert operation. settingsId:', SETTINGS_DOC_ID);
        return NextResponse.json({ message: 'Failed to retrieve updated settings after save.' }, { status: 500 });
    }
    
    const { _id, settingsId, ...updatedSettingsData } = updatedSettingsDoc;

    return NextResponse.json({ id: _id.toHexString(), ...updatedSettingsData }, { status: 200 });

  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ message: 'Failed to update settings' }, { status: 500 });
  }
}

