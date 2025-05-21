
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
  maintenanceMode: z.boolean().optional().default(false),
});

interface SiteSettingsDocument extends Omit<SiteSettings, 'id'> {
  _id: ObjectId;
  settingsId: string; 
}

const SETTINGS_DOC_ID = 'main_settings'; 


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
      const defaultSettings: SiteSettings = {
        siteTitle: 'Travel Yatra', 
        defaultCurrency: 'INR',  
        maintenanceMode: false,
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


    const client = await clientPromise;
    const db = client.db();
    const settingsCollection = db.collection<SiteSettingsDocument>('settings');

    await settingsCollection.updateOne(
      { settingsId: SETTINGS_DOC_ID }, 
      { $set: { ...settingsDataToUpdate, settingsId: SETTINGS_DOC_ID } }, 
      { upsert: true } 
    );
    
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
