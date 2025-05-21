
// src/app/api/settings/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { SiteSettings } from '@/types';
import type { ObjectId } from 'mongodb';

interface SiteSettingsDocument extends Omit<SiteSettings, 'id'> {
  _id: ObjectId;
  settingsId?: string; // Made optional as it might not be on all docs if old ones exist
}

const SETTINGS_DOC_ID = 'main_settings'; // Use a fixed ID for the single settings document

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const settingsCollection = db.collection<SiteSettingsDocument>('settings');
    
    let settings = await settingsCollection.findOne({ settingsId: SETTINGS_DOC_ID });

    if (!settings) {
      // Default settings if none exist
      const defaultSettings: SiteSettings = {
        siteTitle: 'Travel Yatra',
        defaultCurrency: 'INR', 
      };
      return NextResponse.json(defaultSettings, { status: 200 });
    }

    const { _id, settingsId, ...settingsData } = settings; // exclude settingsId from public response
    return NextResponse.json({ id: _id.toHexString(), ...settingsData }, { status: 200 });
  } catch (error) {
    console.error('CRITICAL: Failed to fetch site settings from DB:', error);
    // Return default on error to ensure app loads for public users, but log the error
    const defaultSettingsOnError: SiteSettings = {
        siteTitle: 'Travel Yatra', // Fallback site title
        defaultCurrency: 'INR',   // Fallback currency
    };
    return NextResponse.json(defaultSettingsOnError, { status: 200 }); // Still 200 so app doesn't break, but error is logged
  }
}

