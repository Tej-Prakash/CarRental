
// src/app/api/settings/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { SiteSettings } from '@/types';
import type { ObjectId } from 'mongodb';

interface SiteSettingsDocument extends Omit<SiteSettings, 'id'> {
  _id: ObjectId;
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
        siteTitle: 'Wheels on Clicks',
        defaultCurrency: 'USD', 
      };
      return NextResponse.json(defaultSettings, { status: 200 });
    }

    const { _id, settingsId, ...settingsData } = settings; // exclude settingsId from public response
    return NextResponse.json({ id: _id.toHexString(), ...settingsData }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch site settings:', error);
    // Return default on error to ensure app loads, but log the error
    return NextResponse.json({ siteTitle: 'Wheels on Clicks', defaultCurrency: 'USD' }, { status: 200 });
  }
}
