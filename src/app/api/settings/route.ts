
// src/app/api/settings/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { SiteSettings } from '@/types';
import type { ObjectId } from 'mongodb';

interface SiteSettingsDocument extends Omit<SiteSettings, 'id'> {
  _id: ObjectId;
  settingsId?: string; 
}

const SETTINGS_DOC_ID = 'main_settings'; 

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const settingsCollection = db.collection<SiteSettingsDocument>('settings');
    
    let settings = await settingsCollection.findOne({ settingsId: SETTINGS_DOC_ID });

    if (!settings) {
      const defaultSettings: SiteSettings = {
        siteTitle: 'Travel Yatra',
        defaultCurrency: 'INR', 
        maintenanceMode: false,
      };
      return NextResponse.json(defaultSettings, { status: 200 });
    }

    const { _id, settingsId, ...settingsData } = settings; 
    return NextResponse.json({ 
      id: _id.toHexString(), 
      ...settingsData,
      maintenanceMode: settingsData.maintenanceMode ?? false, // Ensure default
    }, { status: 200 });
  } catch (error) {
    console.error('CRITICAL: Failed to fetch site settings from DB:', error);
    const defaultSettingsOnError: SiteSettings = {
        siteTitle: 'Travel Yatra', 
        defaultCurrency: 'INR',  
        maintenanceMode: false,
    };
    return NextResponse.json(defaultSettingsOnError, { status: 200 }); 
  }
}
