
// src/app/api/admin/settings/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { SiteSettings, UserRole } from '@/types';
import { z } from 'zod';
import type { ObjectId } from 'mongodb';

const SiteSettingsSchema = z.object({
  siteTitle: z.string().min(1, "Site title is required"),
  defaultCurrency: z.enum(['USD', 'EUR', 'GBP', 'INR']).default('INR'),
  maintenanceMode: z.boolean().optional().default(false),
  sessionTimeoutMinutes: z.number().int().positive("Session timeout must be a positive integer.").min(1, "Session timeout must be at least 1 minute.").optional().default(60),
  globalDiscountPercent: z.number().min(0, "Global discount cannot be negative").max(100, "Global discount cannot exceed 100%").optional().default(0), // New field
  // SMTP fields - all optional on input
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(), 
  smtpSecure: z.boolean().optional().default(false),
  emailFrom: z.string().email("Invalid 'From' email address").optional(),
});

interface SiteSettingsDocument extends Omit<SiteSettings, 'id'> {
  _id?: ObjectId; 
  settingsId: string;
}

const SETTINGS_DOC_ID = 'main_settings';
const DEFAULT_SESSION_TIMEOUT_MINUTES = 60;

export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req, ['Admin']);
  if (!authResult.admin) {
    return NextResponse.json({ message: authResult.error || 'Forbidden: Only Admins can access settings.' }, { status: authResult.status || 403 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const settingsCollection = db.collection<SiteSettingsDocument>('settings');

    let settingsDoc = await settingsCollection.findOne({ settingsId: SETTINGS_DOC_ID });

    const defaults: Partial<SiteSettings> = {
        siteTitle: 'Travel Yatra',
        defaultCurrency: 'INR',
        maintenanceMode: false,
        sessionTimeoutMinutes: DEFAULT_SESSION_TIMEOUT_MINUTES,
        globalDiscountPercent: 0,
        smtpHost: '',
        smtpPort: 587, 
        smtpUser: '',
        smtpSecure: false,
        emailFrom: '',
    };
    
    if (!settingsDoc) {
      return NextResponse.json(defaults, { status: 200 });
    }

    // IMPORTANT: Do NOT return smtpPass to the client
    const { _id, settingsId, smtpPass, ...settingsData } = settingsDoc;
    
    return NextResponse.json({
      id: _id?.toHexString(), 
      ...defaults, 
      ...settingsData, 
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch settings for admin:', error);
    return NextResponse.json({ message: 'Failed to fetch settings' }, { status: 500 });
  }
}


export async function PUT(req: NextRequest) {
  const authResult = await verifyAuth(req, ['Admin']);
  if (!authResult.admin) { 
    return NextResponse.json({ message: authResult.error || 'Forbidden: Only Admins can update settings.' }, { status: authResult.status || 403 });
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

    const updatePayload: { [key: string]: any } = { ...settingsDataToUpdate };

    
    if (!rawData.smtpPass || rawData.smtpPass.trim() === '') {
      delete updatePayload.smtpPass; 
    } else {
      updatePayload.smtpPass = rawData.smtpPass; 
    }


    
    Object.keys(updatePayload).forEach(key => {
        if (updatePayload[key] === undefined) {
            delete updatePayload[key];
        }
    });
    
    if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ message: "No valid fields to update." }, { status: 400 });
    }

    updatePayload.settingsId = SETTINGS_DOC_ID; 


    await settingsCollection.updateOne(
      { settingsId: SETTINGS_DOC_ID },
      { $set: updatePayload },
      { upsert: true }
    );

    const updatedSettingsDoc = await settingsCollection.findOne({ settingsId: SETTINGS_DOC_ID });

    if (!updatedSettingsDoc) {
         console.error('CRITICAL: Settings document not found after upsert operation. settingsId:', SETTINGS_DOC_ID);
        return NextResponse.json({ message: 'Failed to retrieve updated settings after save.' }, { status: 500 });
    }

    
    const { _id, settingsId, smtpPass, ...returnedSettingsData } = updatedSettingsDoc;

    return NextResponse.json({
        id: _id.toHexString(),
        ...returnedSettingsData,
      }, { status: 200 });

  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ message: 'Failed to update settings' }, { status: 500 });
  }
}
