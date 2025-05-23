
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
const DEFAULT_SESSION_TIMEOUT_MINUTES = 60;

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const settingsCollection = db.collection<SiteSettingsDocument>('settings');

    let settings = await settingsCollection.findOne({ settingsId: SETTINGS_DOC_ID });

    const defaultSettings: Partial<SiteSettings> = {
      siteTitle: 'Travel Yatra',
      defaultCurrency: 'INR',
      maintenanceMode: false,
      sessionTimeoutMinutes: DEFAULT_SESSION_TIMEOUT_MINUTES,
      globalDiscountPercent: 0, // Default global discount
    };

    if (!settings) {
      return NextResponse.json(defaultSettings, { status: 200 });
    }

    const { _id, settingsId, smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, emailFrom, ...publicSettingsData } = settings;
    
    return NextResponse.json({
      ...defaultSettings, // Apply defaults first
      ...publicSettingsData, // Override with DB values
      id: _id?.toHexString(), // id might not exist if it's a fresh default
    }, { status: 200 });
  } catch (error) {
    console.error('CRITICAL: Failed to fetch site settings from DB:', error);
    // Return essential defaults on critical DB error to prevent site breakage
    const criticalErrorDefaults: Partial<SiteSettings> = {
        siteTitle: 'Travel Yatra',
        defaultCurrency: 'INR',
        maintenanceMode: false, 
        sessionTimeoutMinutes: DEFAULT_SESSION_TIMEOUT_MINUTES,
        globalDiscountPercent: 0,
    };
    return NextResponse.json(criticalErrorDefaults, { status: 200 });
  }
}
